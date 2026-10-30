import Link from "next/link";
import { PageShell } from "@/components/site-chrome";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Order received" };

export default function Page() {
  return (
    <PageShell>
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-5xl font-bold">Thank you!</h1>
        <p className="mt-4 text-lg text-steel">
          Your payment went through. We&apos;ll confirm fitment with your VIN and text you the shipping details shortly. Questions? Call or text {BUSINESS.phoneDisplay}.
        </p>
        <Link href="/" className="btn-gold mt-8">Back to home</Link>
      </section>
    </PageShell>
  );
}
