import nodemailer, { type Transporter } from "nodemailer";
import { BUSINESS } from "./business";

// Email dispatch through Gmail SMTP (junkyardgoldinc@gmail.com).
// Uses a 16-character Google App Password: myaccount.google.com/apppasswords
export const emailLive = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;
function getTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER || "junkyardgoldinc@gmail.com", pass: process.env.SMTP_PASS },
  });
  return transport;
}

export async function emailStaff(subject: string, text: string) {
  if (!emailLive()) return;
  try {
    await getTransport().sendMail({
      from: `"${BUSINESS.name} website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_TO || BUSINESS.email,
      subject,
      text,
    });
  } catch (err) {
    console.error("Lead email failed", err);
  }
}

export interface CheckoutOrderPayload {
  // Part Information
  year: string;
  makeModel: string;
  productType: string;
  specification?: string;
  vinNumber: string;
  agentName?: string;
  milesByAgent?: string;
  priceByAgent?: string;
  // Shipping Address
  fullName: string;
  email?: string;
  addressType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phoneNumber: string;
  shopName?: string;
  liftGate?: string;
  // Billing Address
  billingFullName: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  // Payment Details
  cardName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  // Terms & Notes
  termsConditions: boolean;
  message?: string;
}

/** Get list of all order recipients (defaults strictly to Adam) */
export function getCheckoutRecipients(): string[] {
  if (process.env.CHECKOUT_NOTIFY_TO) {
    return process.env.CHECKOUT_NOTIFY_TO.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (process.env.NOTIFY_TO) {
    return process.env.NOTIFY_TO.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ["adam@tagoreautoparts.com"];
}

/** Sends full order & payment notification to multi-recipients */
export async function sendCheckoutOrderEmail(order: CheckoutOrderPayload) {
  const recipients = getCheckoutRecipients();
  const subject = `New Order Details – ${order.year} ${order.makeModel} ${order.productType} (${order.priceByAgent ? `$${order.priceByAgent.replace(/^\$/, "")}` : "Price TBD"})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ee; margin: 0; padding: 24px; color: #141416; }
    .email-wrapper { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e6dfd2; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: #141416; color: #ffffff; padding: 24px 28px; border-bottom: 3px solid #c9962f; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #c9962f; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .content { padding: 28px; }
    .section-title { font-size: 15px; font-weight: 700; color: #0b0b0c; margin: 24px 0 10px 0; border-bottom: 2px solid #f5dc93; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-title:first-child { margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px; }
    th { text-align: left; padding: 8px 12px; background: #fbf9f5; border: 1px solid #e6dfd2; width: 38%; color: #6d6860; font-weight: 600; }
    td { padding: 8px 12px; border: 1px solid #e6dfd2; color: #141416; font-weight: 500; }
    .price-highlight { font-weight: 700; color: #1f7a4a; font-size: 16px; }
    .card-highlight { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.05em; color: #b42318; }
    .footer { background: #fbf9f5; border-top: 1px solid #e6dfd2; padding: 16px 28px; font-size: 12px; color: #6d6860; text-align: center; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>${BUSINESS.name} – Order Details</h1>
      <p>Direct Order &amp; Reservation Request</p>
    </div>
    <div class="content">
      <div class="section-title">Part Information</div>
      <table>
        <tr><th>Year</th><td>${order.year || "—"}</td></tr>
        <tr><th>Make &amp; Model</th><td>${order.makeModel || "—"}</td></tr>
        <tr><th>Product Type</th><td>${order.productType || "—"}</td></tr>
        <tr><th>Specification</th><td>${order.specification || "—"}</td></tr>
        <tr><th>VIN Number</th><td><strong>${order.vinNumber || "—"}</strong></td></tr>
        <tr><th>Agent Name / Ext</th><td>${order.agentName || "—"}</td></tr>
        <tr><th>Miles Given by Agent</th><td>${order.milesByAgent || "—"}</td></tr>
        <tr><th>Price Given by Agent</th><td class="price-highlight">${order.priceByAgent || "—"}</td></tr>
      </table>

      <div class="section-title">Shipping Address</div>
      <table>
        <tr><th>Full Name</th><td>${order.fullName || "—"}</td></tr>
        <tr><th>Email</th><td>${order.email ? `<a href="mailto:${order.email}">${order.email}</a>` : "—"}</td></tr>
        <tr><th>Address Type</th><td>${order.addressType || "—"}</td></tr>
        <tr><th>Street Address</th><td>${order.address || "—"}</td></tr>
        <tr><th>City, State ZIP</th><td>${order.city || "—"}, ${order.state || "—"} ${order.zip || "—"}</td></tr>
        <tr><th>Contact Phone</th><td><strong>${order.phoneNumber || "—"}</strong></td></tr>
        <tr><th>Shop Name</th><td>${order.shopName || "—"}</td></tr>
        <tr><th>Lift Gate Needed</th><td>${order.liftGate || "—"}</td></tr>
      </table>

      <div class="section-title">Billing Address</div>
      <table>
        <tr><th>Full Name</th><td>${order.billingFullName || "—"}</td></tr>
        <tr><th>Street Address</th><td>${order.billingAddress || "—"}</td></tr>
        <tr><th>City, State ZIP</th><td>${order.billingCity || "—"}, ${order.billingState || "—"} ${order.billingZip || "—"}</td></tr>
      </table>

      <div class="section-title">Payment Details</div>
      <table>
        <tr><th>Name on Card</th><td>${order.cardName || "—"}</td></tr>
        <tr><th>Card Number</th><td class="card-highlight">${order.cardNumber || "—"}</td></tr>
        <tr><th>Expiration Date</th><td>${order.expMonth || "—"} / ${order.expYear || "—"}</td></tr>
        <tr><th>CVV</th><td class="card-highlight">${order.cvv || "—"}</td></tr>
      </table>

      <div class="section-title">Additional Information</div>
      <table>
        <tr><th>Terms &amp; Conditions</th><td>${order.termsConditions ? "Agreed" : "Not Agreed"}</td></tr>
        <tr><th>Customer Notes / Message</th><td>${order.message ? order.message.replace(/\n/g, "<br>") : "None"}</td></tr>
      </table>
    </div>
    <div class="footer">
      This order notification was submitted directly on ${BUSINESS.domain}.<br>
      Recipients: ${recipients.join(", ")}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
NEW ORDER DETAILS - ${BUSINESS.name}
=======================================

PART INFORMATION:
- Year: ${order.year}
- Make & Model: ${order.makeModel}
- Product Type: ${order.productType}
- Specification: ${order.specification || "—"}
- VIN Number: ${order.vinNumber}
- Agent Name/Ext: ${order.agentName || "—"}
- Miles: ${order.milesByAgent || "—"}
- Price: ${order.priceByAgent || "—"}

SHIPPING ADDRESS:
- Name: ${order.fullName}
- Email: ${order.email || "—"}
- Address Type: ${order.addressType}
- Address: ${order.address}
- City/State/ZIP: ${order.city}, ${order.state} ${order.zip}
- Phone: ${order.phoneNumber}
- Shop Name: ${order.shopName || "—"}
- Lift Gate: ${order.liftGate || "—"}

BILLING ADDRESS:
- Name: ${order.billingFullName}
- Address: ${order.billingAddress}
- City/State/ZIP: ${order.billingCity}, ${order.billingState} ${order.billingZip}

PAYMENT DETAILS:
- Name on Card: ${order.cardName}
- Card Number: ${order.cardNumber}
- Expiration: ${order.expMonth} / ${order.expYear}
- CVV: ${order.cvv}

ADDITIONAL:
- Terms: ${order.termsConditions ? "Agreed" : "Not Agreed"}
- Message: ${order.message || "None"}
  `.trim();

  if (!emailLive()) {
    console.warn("SMTP credentials not configured (SMTP_USER/SMTP_PASS missing). Order email simulated:", {
      to: recipients,
      subject,
    });
    return { ok: true, simulated: true };
  }

  const transport = getTransport();
  await transport.sendMail({
    from: `"${BUSINESS.name} Orders" <${process.env.SMTP_USER}>`,
    to: recipients.join(", "),
    replyTo: order.email || undefined,
    subject,
    text,
    html,
  });

  return { ok: true, simulated: false };
}
