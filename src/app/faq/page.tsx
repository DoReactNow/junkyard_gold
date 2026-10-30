import { PageHero, PageShell } from "@/components/site-chrome";
import { BUSINESS, smsWithBody } from "@/lib/business";
import { ChatIcon } from "@/components/icons";

export const metadata = {
  title: "Frequently asked questions",
  description: `Fit, photos, price, delivery, warranty and replacement: straight answers about buying a used engine or transmission from ${BUSINESS.name}.`,
};

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Fit and condition",
    items: [
      ["How do I know it fits?", "Enter your VIN on any product page for a free check. A specialist also matches your VIN to the part before it ships."],
      ["Where do I find my VIN?", "On the driver's side of the dashboard, seen through the windshield, on the door jamb sticker, and on your registration and insurance card."],
      ["I don't have my VIN. Can I still order?", "Text us the year, make, model and engine size and we'll work from that, but we'll need the VIN to confirm the match before it ships."],
      ["Are the parts new?", "No. They're used OEM parts, which is why they cost less than new or remanufactured units. Each option lists its mileage."],
      ["What comes attached to the part?", "It can vary by donor vehicle. Text us your unit's reference and we'll confirm before you pay."],
    ],
  },
  {
    title: "Photos and price",
    items: [
      ["Can I see the part before I buy?", "Yes. Text us your unit's reference and we'll send real photos before you pay."],
      ["Why are there three prices?", "Each is a unit with different mileage. Lower mileage costs more. Pick the one that suits your vehicle and budget."],
      ["Is there anything on top of the price?", "Delivery to a repair shop in the lower 48 states is free. Home delivery, and delivery to Alaska and Hawaii, is quoted by text before the part ships."],
    ],
  },
  {
    title: "Delivery",
    items: [
      ["How long does delivery take?", `Usually ${BUSINESS.deliveryDays} from your order.`],
      ["Where do you deliver?", "All 50 states, to a repair shop or a home, by freight on a pallet. Free shop delivery covers the lower 48 states."],
      ["Can I pick it up?", "No. We ship every order, wherever you're located."],
      ["What do I do when it arrives?", "Inspect the shipment and note any visible damage on the delivery receipt before you sign."],
    ],
  },
  {
    title: "Warranty and replacement",
    items: [
      ["How long is the warranty?", `${BUSINESS.warranty} on every used part.`],
      ["What if there's a problem with the part?", `Tell us within ${BUSINESS.replacementDays} days of delivery. We pick up the part and send a replacement at our cost. If we don't have a replacement, we refund you.`],
      ["Do you pay for labor?", "No. Labor, towing and fluids aren't covered."],
      ["What keeps the warranty valid?", "Installation by a qualified mechanic, new fluids and filters at installation with receipts kept, and not taking the part apart without our written approval."],
      ["Can I return it if I change my mind?", "No. All sales are final unless something goes wrong with the part. Check the fit and ask for photos before you pay."],
      ["Can I get a longer warranty?", "Call or text us and a specialist can talk it through."],
    ],
  },
  {
    title: "Reaching us",
    items: [
      ["When are you available?", `${BUSINESS.contactHours}.`],
      ["Do I have to call to order?", "No. You can choose your unit on the site, and anything you want to check can be handled by text."],
      ["Where are you located?", `Our office is in ${BUSINESS.city}, ${BUSINESS.state}, and we've been in business since ${BUSINESS.founded}. We ship every order.`],
    ],
  },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUPS.flatMap((g) => g.items).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "FAQ", href: "/faq" }]} eyebrow="FAQ" title={<>Straight <span className="text-gold-grad">answers.</span></>}>
        What buyers ask before ordering a used engine or transmission.
      </PageHero>
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 md:px-6">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="font-serif text-[2.2rem] leading-none">{g.title}</h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {g.items.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-gold-dark transition group-open:rotate-45 group-open:border-gold">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-steel">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <a href={smsWithBody("Hi, I have a question: ")} className="btn-gold"><ChatIcon /> Ask us by text</a>
      </div>
    </PageShell>
  );
}
