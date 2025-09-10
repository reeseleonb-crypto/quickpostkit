import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Use default API version from your key; no explicit apiVersion (avoids TS mismatch)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const origin = new URL(req.url).origin;

    // Safe body parse with strict typing (no `any`)
    let raw: unknown = {};
    try { raw = await req.json(); } catch {}
    const src = (raw ?? {}) as Record<string, unknown>;
    const pick = (k: string, def = "") => String(src[k] ?? def);

    // All metadata values must be strings
    const md: Record<string, string> = {
      niche: pick("niche"),
      audience: pick("audience"),
      product_or_service: pick("product_or_service"),
      primary_platform: pick("primary_platform", "Instagram Reels"),
      tone: pick("tone", "friendly"),
      monthly_goal: pick("monthly_goal", "engagement"),
      video_comfort: pick("video_comfort", "mixed"),
      content_balance: pick("content_balance", "40"),
      hashtag_style: pick("hashtag_style", "mix"),
      special_instructions: pick("special_instructions")
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5.00
            product_data: { name: "QuickPostKit — 30-Day Content Plan (one-time)" }
          }
        }
      ],
      success_url: `${origin}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/generate`,
      metadata: md
    });

    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("checkout_error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "checkout_failed", message: msg }, { status: 500 });
  }
}