import { NextResponse } from "next/server";
import Stripe from "stripe";

// Re-use a single Stripe client
const key = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });

async function checkPaid(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Consider paid when payment_status is 'paid' (or 'no_payment_required' for )
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    return { verified: !!paid };
  } catch (err: any) {
    return { verified: false, reason: err?.message ?? "stripe_error" };
  }
}

function extractSessionIdFromUrl(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.get("session_id");
  return qs ?? undefined;
}

export async function GET(req: Request) {
  const sid = extractSessionIdFromUrl(req);
  if (!sid) {
    return NextResponse.json({ verified: false, reason: "missing_session_id" }, { status: 200 });
  }
  const result = await checkPaid(sid);
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: Request) {
  try {
    // Prefer body.session_id, fall back to query param
    const fromBody = await req.json().catch(() => ({}));
    const sid = (fromBody?.session_id as string | undefined) ?? extractSessionIdFromUrl(req);
    if (!sid) {
      return NextResponse.json({ verified: false, reason: "missing_session_id" }, { status: 200 });
    }
    const result = await checkPaid(sid);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ verified: false, reason: e?.message ?? "verify_error" }, { status: 200 });
  }
}
