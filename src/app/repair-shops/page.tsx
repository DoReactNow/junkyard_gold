import Link from "next/link";
import { PageHero, PageShell } from "@/components/site-chrome";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { CameraIcon, ChatIcon, PhoneIcon, ReturnIcon, SearchIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const metadata = {
  title: "For repair shops",
  description: `Used engines and transmissions delivered free to your repair shop, usually in ${BUSINESS.deliveryDays}, matched to your customer's VIN.`,
};

const WHY = [
  { i: <TruckIcon className="size-5" />, t: "Free delivery to your shop", d: `Usually ${BUSINESS.deliveryDays} by freight, in the lower 48 states. Alaska and Hawaii are quoted by text. Tracking comes by text.` },
  { i: <SearchIcon className="size-5" />, t: "Matched to your customer's VIN", d: "Send the VIN and we check it against the unit before anything ships." },
  { i: <CameraIcon className="size-5" />, t: "Photos for your customer", d: "Ask for real photos of the unit before you commit, and pass them along." },
  { i: <ShieldIcon className="size-5" />, t: `${BUSINESS.warrantyAdj} warranty`, d: "Written terms you can hand to your customer." },
  { i: <ReturnIcon className="size-5" />, t: `${BUSINESS.replacementDays}-day replacement`, d: "If there's a problem with the part, we pick it up and send a replacement at our cost, or refund you if we don't have one." },
  { i: <ChatIcon className="size-5" />, t: `Texts ${BUSINESS.textHours}`, d: `Text ${BUSINESS.smsDisplay} any day, or call Mon–Fri 10 AM – 6 PM ET.` },
];

export default function Page() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "For repair shops", href: "/repair-shops" }]}
        eyebrow="For repair shops"
        title={<>Free delivery <span className="text-gold-grad">to your shop.</span></>}
      >
        Text a VIN and get priced options you can take to your customer.
      </PageHero>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((x) => (
            <li key={x.t} className="card p-6">
              <span className="grid size-10 place-items-center rounded-full bg-ink text-gold-2">{x.i}</span>
              <h2 className="mt-4 text-[18px] font-semibold">{x.t}</h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-steel">{x.d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href={smsWithBody("Hi, I'm with a repair shop. I need a part. The VIN is: ")} className="btn-gold"><ChatIcon /> Text a VIN</a>
          <a href={TEL_HREF} className="btn-ghost"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
          <Link href="/warranty" className="btn-ghost">Read the warranty</Link>
        </div>
      </section>
    </PageShell>
  );
}
