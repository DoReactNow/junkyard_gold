import { PolicyPage } from "@/components/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Terms & SMS Policy" };

export default function Page() {
  return (
    <PolicyPage title="Terms & SMS Policy">
      <h2>SMS program</h2>
      <p>
        <b>{BUSINESS.name} Parts Quotes.</b> When you submit a request on our website and check the consent box, or text
        us first, you agree to receive text messages from {BUSINESS.name} at {BUSINESS.phoneDisplay} about your parts
        request: quotes, photos, up to three follow-up reminders, order updates and warranty support. Automatic texts are only sent between 10 AM and 8 PM Eastern.
      </p>
      <ul>
        <li>Message frequency varies with your request.</li>
        <li>Message and data rates may apply.</li>
        <li>Reply <b>STOP</b> to stop receiving messages at any time. Reply <b>HELP</b> for help, or contact {BUSINESS.email} / {BUSINESS.phoneDisplay}.</li>
        <li>Carriers are not liable for delayed or undelivered messages.</li>
        <li>Consent to receive texts is not a condition of purchase.</li>
      </ul>
      <h2>Quotes and prices</h2>
      <p>Prices and availability can change until an order is paid. Used parts are sold as described in the listing and under our warranty; we may cancel and refund an order if a part turns out to be unavailable or not as described.</p>
      <h2>Fitment</h2>
      <p>We check every order against the VIN you provide. You are responsible for giving us the correct VIN and for having the part installed by a qualified mechanic.</p>
      <h2>Warranty and returns</h2>
      <p>See our <a href="/warranty" className="underline">warranty</a> and <a href="/shipping-returns" className="underline">shipping &amp; returns</a> pages.</p>
      <h2>Limitation of liability</h2>
      <p>To the extent allowed by law, our liability for any part is limited to its purchase price. We are not responsible for labor, towing, rental or other indirect costs.</p>
      <p>These terms are governed by the laws of the State of Florida.</p>
    </PolicyPage>
  );
}
