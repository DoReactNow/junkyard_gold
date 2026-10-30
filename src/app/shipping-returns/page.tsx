import { PolicyPage } from "@/components/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Shipping & Returns" };

export default function Page() {
  return (
    <PolicyPage title="Shipping & Returns" intro="Freight shipping anywhere in the US.">
      <h2>Shipping</h2>
      <p>
        Engines and transmissions ship on a pallet by freight carrier to a home or a repair shop. We confirm the shipping
        cost to your ZIP code with your quote, before you pay. Most orders ship within 1–3 business days and
        arrive 3–7 business days after that. You&apos;ll get tracking by text.
      </p>
      <p>We ship every order. We don&apos;t offer pickup.</p>
      <p>Inspect the shipment when it arrives and note any visible damage on the delivery receipt before you sign.</p>
      <h2>Returns</h2>
      <ul>
        <li><b>Wrong part or defective part:</b> if we send a part that doesn&apos;t match your VIN, or it&apos;s defective under our warranty, we&apos;ll exchange it or refund you, including return freight.</li>
        <li><b>Changed your mind:</b> contact us within 14 days of delivery. The part must be uninstalled and in the condition we sent it. Return shipping is paid by the customer.</li>
        <li>Talk to us before sending anything back so we can give you a return number and arrange the return freight.</li>
      </ul>
      <p>Every order is different, so if you have a special situation, just ask. Call {BUSINESS.phoneDisplay} or text {BUSINESS.smsDisplay}.</p>
    </PolicyPage>
  );
}
