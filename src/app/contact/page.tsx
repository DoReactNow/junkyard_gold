import { PageShell } from "@/components/site-chrome";
import { QuoteForm } from "@/components/quote-form";
import { ADDRESS_LINE, BUSINESS, SMS_HREF, TEL_HREF } from "@/lib/business";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata = { title: "Contact" };

export default function Page() {
  const items = [
    { i: <ChatIcon className="size-5" />, t: "Text us (fastest)", v: BUSINESS.phoneDisplay, href: SMS_HREF },
    { i: <PhoneIcon className="size-5" />, t: "Call", v: BUSINESS.phoneDisplay, href: TEL_HREF },
    { i: <MailIcon className="size-5" />, t: "Email", v: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { i: <PinIcon className="size-5" />, t: "Office (no pickups — we ship every order)", v: ADDRESS_LINE, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_LINE)}` },
  ];
  return (
    <PageShell>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h1 className="font-display text-5xl font-bold uppercase">Contact {BUSINESS.name}</h1>
          <p className="mt-2 text-white/70">{BUSINESS.hours}</p>
        </div>
        <div className="stripe h-1.5" />
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
        <div className="grid gap-3 self-start">
          {items.map((x) => (
            <a key={x.t} href={x.href} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 hover:border-gold">
              <span className="grid size-11 place-items-center rounded-md bg-gold/15 text-gold-dark">{x.i}</span>
              <span>
                <span className="block text-xs font-semibold uppercase text-steel">{x.t}</span>
                <span className="font-semibold">{x.v}</span>
              </span>
            </a>
          ))}
          <iframe
            title="Map"
            className="mt-2 h-64 w-full rounded-lg border border-line"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_LINE)}&output=embed`}
          />
        </div>
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="mb-4 font-display text-3xl font-semibold uppercase">Request a part</h2>
          <QuoteForm />
        </div>
      </section>
    </PageShell>
  );
}
