import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    // Load env variables
    const key = process.env.STRIPE_SECRET_KEY;
    const price = process.env.STRIPE_PRICE_ID;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");

    // Validate
    if (!key || !price || !site) {
      console.error("❌ Missing STRIPE_SECRET_KEY, STRIPE_PRICE_ID, or NEXT_PUBLIC_SITE_URL");
      return NextResponse.json(
        { error: "Missing Stripe configuration on server" },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${site}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/generate?canceled=true`,
    });

    // Return checkout URL
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: "Stripe checkout session failed", details: err.message },
      { status: 500 }
    );
  }
}
