import { PageHero, PageShell } from "@/components/site-chrome";
import { QuoteForm } from "@/components/quote-form";
import { ADDRESS_LINE, BUSINESS, SMS_HREF, TEL_HREF } from "@/lib/business";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata = { title: "Contact" };

export default function Page() {
  const items = [
    { i: <ChatIcon className="size-5" />, t: "Text us (fastest)", v: BUSINESS.smsDisplay, href: SMS_HREF },
    { i: <PhoneIcon className="size-5" />, t: "Call", v: BUSINESS.phoneDisplay, href: TEL_HREF },
    { i: <MailIcon className="size-5" />, t: "Email", v: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { i: <PinIcon className="size-5" />, t: "Office · we ship every order, no pickups", v: ADDRESS_LINE, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_LINE)}` },
  ];
  return (
    <PageShell>
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} eyebrow="Contact" title={<>Talk to a <span className="text-gold-grad">parts specialist</span></>}>
        Text is fastest. Send your VIN and we&apos;ll reply with matching parts, prices and photos. {BUSINESS.contactHours}.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-3 self-start">
          {items.map((x) => (
            <a key={x.t} href={x.href} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-gold/60">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-gold-2">{x.i}</span>
              <span>
                <span className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-steel">{x.t}</span>
                <span className="text-[16px] font-semibold">{x.v}</span>
              </span>
            </a>
          ))}
          <iframe
            title="Map"
            className="mt-1 h-72 w-full rounded-2xl border border-line"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_LINE)}&output=embed`}
          />
        </div>
        <div className="card relative overflow-hidden p-7 sm:p-9">
          <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
          <div className="eyebrow">Free quote · no obligation</div>
          <h2 className="mb-6 mt-2 font-display text-3xl font-bold">Request a part</h2>
          <QuoteForm />
        </div>
      </section>
    </PageShell>
  );
}
