"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { CheckIcon, PhoneIcon, ShieldIcon } from "@/components/icons";

interface CheckoutFormProps {
  initialValues?: {
    year?: string;
    makeModel?: string;
    productType?: string;
    spec?: string;
    vin?: string;
    price?: string;
    agent?: string;
    miles?: string;
  };
}

export function CheckoutForm({ initialValues = {} }: CheckoutFormProps) {
  // Part Information
  const [year, setYear] = useState(initialValues.year || "");
  const [makeModel, setMakeModel] = useState(initialValues.makeModel || "");
  const [productType, setProductType] = useState(initialValues.productType || "");
  const [specification, setSpecification] = useState(initialValues.spec || "");
  const [vinNumber, setVinNumber] = useState(initialValues.vin || "");
  const [agentName, setAgentName] = useState(initialValues.agent || "");
  const [milesByAgent, setMilesByAgent] = useState(initialValues.miles || "");
  const [priceByAgent, setPriceByAgent] = useState(initialValues.price || "");

  // Shipping Address
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [addressType, setAddressType] = useState("Residential");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shopName, setShopName] = useState("");
  const [liftGate, setLiftGate] = useState("");

  // Billing Address
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [billingFullName, setBillingFullName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZip, setBillingZip] = useState("");

  // Payment Details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");

  // Terms and Message
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [message, setMessage] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    part: string;
    phone: string;
    price: string;
  } | null>(null);

  // Sync "Same as shipping"
  const handleSameAsShippingToggle = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setBillingFullName(fullName);
      setBillingAddress(address);
      setBillingCity(city);
      setBillingState(state);
      setBillingZip(zip);
    }
  };

  // Synchronize receipt price display
  const receiptPrice = useMemo(() => {
    const val = (priceByAgent || "").trim();
    if (!val) return "$0.00";
    return val.startsWith("$") ? val : `$${val}`;
  }, [priceByAgent]);

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!termsAgreed) {
      setError("Please check the box to agree to the Terms and Conditions.");
      return;
    }

    setSubmitting(true);

    const payload = {
      year,
      makeModel,
      productType,
      specification,
      vinNumber,
      agentName,
      milesByAgent,
      priceByAgent,
      fullName,
      email,
      addressType,
      address,
      city,
      state,
      zip,
      phoneNumber,
      shopName,
      liftGate,
      billingFullName: sameAsShipping ? fullName : billingFullName,
      billingAddress: sameAsShipping ? address : billingAddress,
      billingCity: sameAsShipping ? city : billingCity,
      billingState: sameAsShipping ? state : billingState,
      billingZip: sameAsShipping ? zip : billingZip,
      cardName,
      cardNumber,
      expMonth,
      expYear,
      cvv,
      termsConditions: termsAgreed,
      message,
    };

    try {
      const res = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to submit checkout order.");
      }

      setSubmittedData({
        name: fullName || "Customer",
        part: `${year} ${makeModel} ${productType}`.trim() || "Requested Auto Part",
        phone: phoneNumber || email,
        price: receiptPrice,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong submitting your order. Please call us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success view
  if (submittedData) {
    return (
      <div className="card relative overflow-hidden p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-lift">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gold-grad" />
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-ok/10 text-ok ring-8 ring-ok/5">
          <CheckIcon className="size-8 text-ok" />
        </div>
        <div className="mt-4 eyebrow">Order Details Confirmed</div>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Order Received!
        </h2>
        <p className="mt-4 text-base text-steel max-w-xl mx-auto">
          Thank you, <strong className="text-ink">{submittedData.name}</strong>! We have received your order details for{" "}
          <strong className="text-ink">{submittedData.part}</strong>.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-paper p-5 text-sm text-ink/80 max-w-lg mx-auto">
          <p className="font-semibold text-ink">What happens next?</p>
          <p className="mt-1 text-steel">
            Our order desk is reviewing your vehicle details and VIN to ensure 100% correct fitment. We will contact you shortly at{" "}
            <strong className="text-ink">{submittedData.phone}</strong> to confirm processing, tracking, and warranty documentation.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href={`tel:${BUSINESS.phoneE164}`} className="btn-dark">
            <PhoneIcon className="size-4" /> Call Order Desk: {BUSINESS.phoneDisplay}
          </a>
          <Link href="/" className="btn-gold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Part Information */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
        <div className="eyebrow mb-1">Step 1</div>
        <h2 className="font-display text-2xl font-bold text-ink">Part Information</h2>
        <p className="text-sm text-steel mb-6">
          Specify the vehicle and component details quoted by our parts specialist.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Year <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="year"
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2015"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Make &amp; Model <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="makeModel"
              required
              value={makeModel}
              onChange={(e) => setMakeModel(e.target.value)}
              placeholder="e.g. Ford F-150, Dodge Ram"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Product Type <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="productType"
              required
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. Engine or Transmission"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Specification (Optional)
            </span>
            <input
              type="text"
              name="specification"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. 5.0L, 4WD, AT"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              VIN Number <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="vinNumber"
              required
              value={vinNumber}
              onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
              placeholder="17-Digit Vehicle Identification Number"
              className="field font-mono uppercase"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Agent Name / Extension
            </span>
            <input
              type="text"
              name="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Adam (Ext 102)"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Miles Given by Agent
            </span>
            <input
              type="text"
              name="milesByAgent"
              value={milesByAgent}
              onChange={(e) => setMilesByAgent(e.target.value)}
              placeholder="e.g. 65,000 miles"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Price Given by Agent
            </span>
            <input
              type="text"
              name="priceByAgent"
              value={priceByAgent}
              onChange={(e) => setPriceByAgent(e.target.value)}
              placeholder="e.g. $1,250.00"
              className="field font-semibold text-ok"
            />
          </label>
        </div>
      </section>

      {/* Shipping Address */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
        <div className="eyebrow mb-1">Step 2</div>
        <h2 className="font-display text-2xl font-bold text-ink">Shipping Address</h2>
        <p className="text-sm text-steel mb-6">
          Where should your part be freight delivered?
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Full Name <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John M. Doe"
              className="field"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Email (Optional)
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="field"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Address Type <span className="text-bad">*</span>
            </span>
            <select
              name="addressType"
              value={addressType}
              onChange={(e) => setAddressType(e.target.value)}
              className="field"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial / Shop</option>
            </select>
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Street Address <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Suite or Unit #"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <label className="block col-span-2 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              City <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="field"
            />
          </label>
          <label className="block col-span-1 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              State <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State (e.g. FL)"
              className="field"
            />
          </label>
          <label className="block col-span-1 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              ZIP Code <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="zip"
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP Code"
              className="field"
            />
          </label>
          <label className="block col-span-2 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Contact Phone <span className="text-bad">*</span>
            </span>
            <input
              type="tel"
              name="phoneNumber"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(904) 000-0000"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Shop Name (Optional)
            </span>
            <input
              type="text"
              name="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Auto repair shop / mechanics name"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Lift Gate Needed?
            </span>
            <select
              name="liftGate"
              value={liftGate}
              onChange={(e) => setLiftGate(e.target.value)}
              className="field"
            >
              <option value="">Select an Option</option>
              <option value="Yes">Yes (Recommended for residential)</option>
              <option value="No">No (Shop has forklift/loading dock)</option>
            </select>
          </label>
        </div>
      </section>

      {/* Billing Address */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="eyebrow mb-1">Step 3</div>
            <h2 className="font-display text-2xl font-bold text-ink">Billing Address</h2>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand/40">
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => handleSameAsShippingToggle(e.target.checked)}
              className="accent-gold size-4"
            />
            Same as Shipping Address
          </label>
        </div>
        <p className="text-sm text-steel mb-6">
          The address registered with your payment card issuer.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Billing Full Name <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="billingFullName"
              required
              value={sameAsShipping ? fullName : billingFullName}
              onChange={(e) => setBillingFullName(e.target.value)}
              disabled={sameAsShipping}
              placeholder="Cardholder Name"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Street Address <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="billingAddress"
              required
              value={sameAsShipping ? address : billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              disabled={sameAsShipping}
              placeholder="542 W. 15th Street"
              className="field"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3">
          <label className="block col-span-2 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              City <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="billingCity"
              required
              value={sameAsShipping ? city : billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              disabled={sameAsShipping}
              placeholder="New York"
              className="field"
            />
          </label>
          <label className="block col-span-1 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              State <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="billingState"
              required
              value={sameAsShipping ? state : billingState}
              onChange={(e) => setBillingState(e.target.value)}
              disabled={sameAsShipping}
              placeholder="NY"
              className="field"
            />
          </label>
          <label className="block col-span-1 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              ZIP Code <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="billingZip"
              required
              value={sameAsShipping ? zip : billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              disabled={sameAsShipping}
              placeholder="10001"
              className="field"
            />
          </label>
        </div>
      </section>

      {/* Payment Details */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
        <div className="eyebrow mb-1">Step 4</div>
        <h2 className="font-display text-2xl font-bold text-ink">Payment Details</h2>
        <p className="text-sm text-steel mb-6">
          Encrypted TLS submission processed directly by our authorized order desk.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Name on Card <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="cardName"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Cardholder Name as shown on card"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Card Number <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="cardNumber"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="field font-mono"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Exp Month <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="expMonth"
              required
              maxLength={2}
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              placeholder="MM (e.g. 08)"
              className="field text-center font-mono"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              Exp Year <span className="text-bad">*</span>
            </span>
            <input
              type="text"
              name="expYear"
              required
              maxLength={4}
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              placeholder="YYYY (e.g. 2028)"
              className="field text-center font-mono"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-ink/80">
              CVV <span className="text-bad">*</span>
            </span>
            <input
              type="password"
              name="cvv"
              required
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="3 or 4 digits"
              className="field text-center font-mono"
            />
          </label>
        </div>
      </section>

      {/* Part Price Summary Card (Receipt-Style) */}
      <div className="rounded-2xl border-2 border-gold/40 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gold-dark">
            <ShieldIcon className="size-4" /> Part Price Summary
          </span>
          <span className="text-xs text-steel">Locked-in Quote</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="block text-base font-semibold text-ink">Quoted Part Price</span>
            <span className="text-xs text-steel">Includes {BUSINESS.warrantyAdj} warranty and fitment guarantee</span>
          </div>
          <span className="font-display text-3xl font-extrabold text-ink sm:text-4xl text-gold-dark">
            {receiptPrice}
          </span>
        </div>
      </div>

      {/* Terms & Conditions Checkbox */}
      <div className="card p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
            className="mt-1 size-5 shrink-0 rounded accent-gold"
          />
          <span className="text-sm text-ink/85 leading-relaxed">
            I agree with the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-ink underline decoration-gold underline-offset-2">
              terms and conditions
            </Link>{" "}
            and{" "}
            <Link href="/shipping-returns" target="_blank" className="font-semibold text-ink underline decoration-gold underline-offset-2">
              shipping &amp; return policies
            </Link>
            . I understand that fitment will be verified against my VIN before shipping.
          </span>
        </label>
      </div>

      {/* Additional Message */}
      <div className="card p-6">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-ink/80">
            Additional Message or Special Instructions (Optional)
          </span>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Special delivery notes, business hours for delivery, mechanic contact info..."
            className="w-full rounded-lg border border-line bg-white p-3.5 text-[15px] text-ink outline-none transition placeholder:text-steel/70 focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-bad/20 bg-bad/5 p-4 text-sm font-semibold text-bad">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-gold w-full py-4 text-lg font-bold tracking-tight shadow-lift hover:brightness-105 active:translate-y-px transition"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            Processing Order Details...
          </span>
        ) : (
          "Proceed to Checkout"
        )}
      </button>
    </form>
  );
}
