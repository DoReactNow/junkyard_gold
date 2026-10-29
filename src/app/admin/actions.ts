"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { refreshDraft } from "@/lib/ai";
import { sendText, smsLive } from "@/lib/sms";
import { importParts } from "@/lib/import-parts";
import { convertSalesRows, isSalesSheet, readTable } from "@/lib/sales-import";
import { normalizePhone } from "@/lib/phone";
import { recordInbound } from "@/lib/inbound";
import { stopFollowups } from "@/lib/followups";

export async function login(_: unknown, form: FormData) {
  if (!checkPassword(String(form.get("password") || ""))) return { error: "Wrong password" };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function sendReply(conversationId: string, body: string) {
  await requireAdmin();
  const text = body.trim();
  if (!text) return { error: "Message is empty" };
  const convo = await db.conversation.findUniqueOrThrow({ where: { id: conversationId } });
  const msg = await sendText({ conversationId, to: convo.phone, body: text, author: "staff" });
  await db.conversation.update({ where: { id: conversationId }, data: { unread: false, aiDraft: null, aiDraftNote: null, aiDraftParts: null } });
  await db.lead.updateMany({ where: { conversationId, status: "new" }, data: { status: "quoted" } });
  revalidatePath("/admin");
  return { status: msg.status };
}

export async function regenerateDraft(conversationId: string) {
  await requireAdmin();
  await refreshDraft(conversationId);
  revalidatePath("/admin");
}

export async function markRead(conversationId: string) {
  await requireAdmin();
  await db.conversation.update({ where: { id: conversationId }, data: { unread: false } });
  revalidatePath("/admin");
}

export async function setLeadStatus(conversationId: string, status: string) {
  await requireAdmin();
  await db.lead.updateMany({ where: { conversationId }, data: { status } });
  if (status === "won" || status === "lost") await stopFollowups(conversationId, `lead marked ${status}`);
  revalidatePath("/admin");
}

/** Demo mode only: pretend a customer texted us, to try the flow without RingCentral. */
export async function simulateInbound(form: FormData) {
  await requireAdmin();
  if (smsLive()) return;
  const phone = normalizePhone(String(form.get("phone") || ""));
  const body = String(form.get("body") || "").trim();
  if (!phone || !body) return;
  const { convo, needsReply } = await recordInbound(phone, body, null);
  if (!convo) return;
  if (needsReply) await refreshDraft(convo.id);
  revalidatePath("/admin");
  redirect(`/admin?c=${convo.id}`);
}

export async function setPartStatus(id: string, status: string) {
  await requireAdmin();
  await db.part.update({ where: { id }, data: { status } });
  revalidatePath("/admin/parts");
}

export async function updatePrice(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const price = Math.round(Number(form.get("price")));
  if (price > 0) await db.part.update({ where: { id }, data: { price } });
  revalidatePath("/admin/parts");
}

export async function uploadCsv(_: unknown, form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose a .xlsx or .csv file first." };
  let rows = await readTable(file.name, Buffer.from(await file.arrayBuffer()));
  let summary = "";
  let skipped: { line: number; reason: string }[] = [];
  if (isSalesSheet(rows)) {
    const conv = convertSalesRows(rows);
    summary = `Sales sheet: ${conv.stats.rows} sales → ${conv.stats.listings} listings (${conv.stats.mergedDuplicates} repeats merged). `;
    skipped = conv.skipped;
    rows = conv.listings;
  }
  const res = await importParts(rows);
  let retired = 0;
  if (form.get("replace")) {
    const keep = rows.map((r) => r.stock_no).filter(Boolean);
    retired = (await db.part.updateMany({ where: { stockNo: { notIn: keep }, status: "available" }, data: { status: "sold" } })).count;
  }
  revalidatePath("/admin/parts");
  return {
    message: `${summary}Added ${res.created}, updated ${res.updated}${retired ? `, marked ${retired} old listings sold` : ""}. ${skipped.length + res.skipped.length} rows skipped.`,
    skipped: [...skipped, ...res.skipped].slice(0, 25),
  };
}
