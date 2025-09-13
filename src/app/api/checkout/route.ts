import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  if (!key || !price || !site) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY, STRIPE_PRICE_ID, or NEXT_PUBLIC_SITE_URL/SITE_URL" }, { status: 500 });
  }
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${site}/generate?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/generate?canceled=1`,
  });
  return NextResponse.json({ url: session.url }, { status: 200 });
}
