import Link from "next/link";
import type { Part } from "@prisma/client";
import { money, partUrl, warrantyAdj } from "@/lib/inventory";
import { pickPhotos } from "@/lib/photos";

type ImgPart = Pick<Part, "imageUrl" | "partType" | "make" | "model" | "spec">;

/** Photos for a listing: its own photo, else example photos of a similar unit, else an illustration. */
export function partImages(p: ImgPart): { files: string[]; kind: "own" | "example" | "illustration" } {
  if (p.imageUrl) return { files: [p.imageUrl], kind: "own" };
  const match = pickPhotos(p);
  if (match.files.length) return { files: match.files, kind: "example" };
  if (p.partType === "Engine") return { files: ["/img/engine.svg"], kind: "illustration" };
  if (p.partType === "Transmission") return { files: ["/img/transmission.svg"], kind: "illustration" };
  return { files: ["/img/part.svg"], kind: "illustration" };
}

export const partImage = (p: ImgPart) => partImages(p).files[0];

export function PartCard({ part }: { part: Part }) {
  const img = partImages(part);
  return (
    <Link
      href={partUrl(part)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-lift"
    >
      <div className={`relative ${img.kind === "illustration" ? "bg-ink" : "bg-white"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.files[0]}
          alt=""
          className="aspect-[4/3] w-full object-contain p-3 transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-light">
          {part.partType}
        </span>
      </div>
      <div className="flex flex-1 flex-col border-t border-line p-5">
        <h3 className="font-display text-[17px] font-semibold leading-snug">
          {part.year} {part.make} {part.model}
        </h3>
        {part.spec && <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-steel">{part.spec}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="font-display text-[26px] font-bold leading-none">{money(part.price)}</div>
            <div className="mt-1.5 text-[12.5px] text-steel">
              {part.mileage ? `${part.mileage.toLocaleString()} mi · ` : ""}
              {warrantyAdj(part.warranty)} warranty
            </div>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink transition group-hover:border-gold group-hover:bg-gold-grad" aria-hidden>
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
