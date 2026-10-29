import { PolicyPage } from "@/components/policy-page";
import { ADDRESS_LINE, BUSINESS } from "@/lib/business";

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>This policy explains what {BUSINESS.name} (&quot;we&quot;) collects through {BUSINESS.domain} and by text message, and how we use it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Information you give us: your name, mobile number, email, VIN or vehicle details, ZIP code and messages.</li>
        <li>Order information: shipping address and order details. Card payments are processed by Stripe; we never see or store your full card number.</li>
        <li>Basic technical data such as pages visited and ad-click identifiers, used to understand how people find us.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To find and quote the part you asked for, text or call you about your request, process and ship orders, provide warranty support, and improve our website.</p>
      <h2>Text messaging</h2>
      <p>
        Mobile numbers and SMS consent collected for text messaging are never sold, rented or shared with third parties or
        affiliates for their marketing purposes. We share your number only with the service providers that deliver our
        messages.
      </p>
      <h2>Service providers</h2>
      <p>We use trusted providers for hosting, text messaging, payments, freight shipping and AI tools that help our staff draft replies. They may use your information only to provide services to us.</p>
      <h2>Your choices</h2>
      <p>Reply STOP to any text to opt out. To see, correct or delete your information, contact {BUSINESS.email}.</p>
      <h2>Contact</h2>
      <p>{BUSINESS.name}, {ADDRESS_LINE} · {BUSINESS.phoneDisplay} · {BUSINESS.email}</p>
    </PolicyPage>
  );
}
