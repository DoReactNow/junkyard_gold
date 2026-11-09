import { PageHero, PageShell } from "@/components/site-chrome";
import { CheckoutForm } from "./checkout-form";
import { BUSINESS } from "@/lib/business";
import { ChatIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const metadata = {
  title: "Secure Order Checkout | Junkyard Gold",
  description:
    "Complete your auto part purchase at Junkyard Gold with our secure checkout process. Provide part details, shipping and billing addresses, and payment information.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    make?: string;
    model?: string;
    type?: string;
    product_type?: string;
    spec?: string;
    vin?: string;
    price?: string;
    agent?: string;
    miles?: string;
  }>;
}) {
  const sp = await searchParams;

  const initialValues = {
    year: sp.year || "",
    makeModel: [sp.make, sp.model].filter(Boolean).join(" "),
    productType: sp.product_type || sp.type || "",
    spec: sp.spec || "",
    vin: sp.vin || "",
    price: sp.price || "",
    agent: sp.agent || "",
    miles: sp.miles || "",
  };

  const guarantees = [
    {
      i: <TruckIcon className="size-6 text-gold-dark" />,
      t: "Nationwide Shipping",
      d: `Direct freight across the ${BUSINESS.freeDeliveryArea}. Usually ${BUSINESS.deliveryDays}.`,
    },
    {
      i: <ChatIcon className="size-6 text-gold-dark" />,
      t: "Direct Specialist Support",
      d: `Texts answered ${BUSINESS.textHours}. Call ${BUSINESS.phoneDisplay} anytime during hours.`,
    },
    {
      i: <ShieldIcon className="size-6 text-gold-dark" />,
      t: "Encrypted Secure Order",
      d: "TLS-encrypted order desk transmission with guaranteed VIN fitment check.",
    },
    {
      i: <ReturnIcon className="size-6 text-gold-dark" />,
      t: `${BUSINESS.warrantyAdj} Warranty`,
      d: `${BUSINESS.replacementDays}-day replacement warranty on tested engines & transmissions.`,
    },
  ];

  return (
    <PageShell>
      <PageHero
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Checkout", href: "/checkout" },
        ]}
        eyebrow="Direct Order & Reservation Request"
        title={
          <>
            Secure <span className="text-gold-grad">Order Checkout</span>
          </>
        }
      >
        Complete your auto part order and lock in your {BUSINESS.warrantyAdj} nationwide warranty.
        Fitment will be verified by our parts team using your VIN before delivery.
      </PageHero>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <CheckoutForm initialValues={initialValues} />

        {/* Guarantees / Shipping Information Strip */}
        <section className="mt-16 border-t border-line pt-12">
          <div className="text-center mb-8">
            <span className="eyebrow">Customer Protection</span>
            <h3 className="font-display text-2xl font-bold text-ink mt-1">
              Included with Every {BUSINESS.name} Order
            </h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g) => (
              <div key={g.t} className="card p-5 text-center flex flex-col items-center">
                <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-sand/60">
                  {g.i}
                </div>
                <h4 className="font-semibold text-ink text-sm">{g.t}</h4>
                <p className="mt-1 text-xs text-steel leading-relaxed">{g.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
