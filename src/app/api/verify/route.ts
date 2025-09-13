﻿import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");
    if (!session_id) return NextResponse.json({ paid:false, reason:"missing_session_id" }, { status:200 });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ paid:false, reason:"missing_key" }, { status:200 });

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid";
    return NextResponse.json({ paid }, { status:200 });
  } catch (e) {
    console.error("[QPK] verify error", e);
    return NextResponse.json({ paid:false, reason:"server_error" }, { status:200 });
  }
}
