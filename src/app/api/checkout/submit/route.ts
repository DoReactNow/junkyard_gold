import { NextResponse } from "next/server";
import { sendCheckoutOrderEmail, type CheckoutOrderPayload } from "@/lib/email";

export async function POST(req: Request) {
  try {
    let data: Record<string, unknown> = {};

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        for (const [key, value] of formData.entries()) {
          data[key] = typeof value === "string" ? value : value.name;
        }
      }
    }

    // Map fields matching Tagore form field names and clean camelCase names
    const order: CheckoutOrderPayload = {
      // Part Information
      year: String(data.year || "").trim(),
      makeModel: String(data.makeModel || data["Make&model"] || data.make_model || "").trim(),
      productType: String(data.productType || data.product_type || "").trim(),
      specification: String(data.specification || data.Specification || "").trim(),
      vinNumber: String(data.vinNumber || data.vin_number || "").trim(),
      agentName: String(data.agentName || data.agent_name || "").trim(),
      milesByAgent: String(data.milesByAgent || data.miles_by_agent || "").trim(),
      priceByAgent: String(data.priceByAgent || data.price_by_agent || "").trim(),

      // Shipping Address
      fullName: String(data.fullName || data.firstname || data.fname || "").trim(),
      email: String(data.email || "").trim(),
      addressType: String(data.addressType || data.address_type || "Residential").trim(),
      address: String(data.address || data.adr || "").trim(),
      city: String(data.city || "").trim(),
      state: String(data.state || "").trim(),
      zip: String(data.zip || "").trim(),
      phoneNumber: String(data.phoneNumber || data.phone_number || data.phn || "").trim(),
      shopName: String(data.shopName || data.shop_name || "").trim(),
      liftGate: String(data.liftGate || data.lift_gate || "").trim(),

      // Billing Address
      billingFullName: String(data.billingFullName || data.billing_fullname || "").trim(),
      billingAddress: String(data.billingAddress || data.billing_address || "").trim(),
      billingCity: String(data.billingCity || data.billing_city || "").trim(),
      billingState: String(data.billingState || data.billing_state || "").trim(),
      billingZip: String(data.billingZip || data.billing_zip || "").trim(),

      // Payment Details
      cardName: String(data.cardName || data.cardname || data.cname || "").trim(),
      cardNumber: String(data.cardNumber || data.cardnumber || data.ccnum || "").trim(),
      expMonth: String(data.expMonth || data.expmonth || "").trim(),
      expYear: String(data.expYear || data.expyear || "").trim(),
      cvv: String(data.cvv || "").trim(),

      // Terms & Notes
      termsConditions: Boolean(data.termsConditions ?? data.terms_conditions ?? false),
      message: String(data.message || "").trim(),
    };

    // Basic Validation
    const errors: string[] = [];
    if (!order.year) errors.push("Year is required");
    if (!order.makeModel) errors.push("Make & Model is required");
    if (!order.productType) errors.push("Product Type is required");
    if (!order.vinNumber) errors.push("VIN Number is required");
    if (!order.fullName) errors.push("Shipping Full Name is required");
    if (!order.address) errors.push("Shipping Address is required");
    if (!order.city) errors.push("Shipping City is required");
    if (!order.state) errors.push("Shipping State is required");
    if (!order.zip) errors.push("Shipping ZIP Code is required");
    if (!order.phoneNumber) errors.push("Shipping Contact Phone is required");
    if (!order.billingFullName) errors.push("Billing Full Name is required");
    if (!order.billingAddress) errors.push("Billing Address is required");
    if (!order.billingCity) errors.push("Billing City is required");
    if (!order.billingState) errors.push("Billing State is required");
    if (!order.billingZip) errors.push("Billing ZIP Code is required");
    if (!order.cardName) errors.push("Name on Card is required");
    if (!order.cardNumber) errors.push("Card Number is required");
    if (!order.expMonth) errors.push("Expiration Month is required");
    if (!order.expYear) errors.push("Expiration Year is required");
    if (!order.cvv) errors.push("CVV is required");
    if (!order.termsConditions) errors.push("You must agree to the Terms and Conditions");

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, error: errors[0], errors }, { status: 400 });
    }

    // Send the email to Adam & Support
    const result = await sendCheckoutOrderEmail(order);

    return NextResponse.json({
      ok: true,
      success: true,
      simulated: result.simulated,
      message: "Order details received successfully! We will confirm fitment with your VIN and process your order shortly.",
      orderSummary: {
        name: order.fullName,
        part: `${order.year} ${order.makeModel} ${order.productType}`,
        price: order.priceByAgent || "TBD",
        phone: order.phoneNumber,
      },
    });
  } catch (err: unknown) {
    console.error("Checkout order submission failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error processing checkout." },
      { status: 500 }
    );
  }
}
