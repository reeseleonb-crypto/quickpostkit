import { NextRequest, NextResponse } from "next/server";
import { createJob, findJobBySession, updateJob } from "@/server/jobs";
import { generatePlan } from "@/server/generator";
import { buildDoc } from "@/server/builder";
import Stripe from "stripe";

// Use default version from your key (avoid TS apiVersion pin mismatch)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** ===== Local types ===== */
type Inputs = {
  niche: string;
  audience: string;
  product_or_service: string;
  primary_platform: string;
  tone: "friendly" | "bold" | "witty" | "minimalist" | string;
  monthly_goal: "awareness" | "engagement" | "authority" | "sales" | string;
  video_comfort: "talking_head" | "no_talking_head" | "mixed" | string;
  content_balance: number;
  hashtag_style: "broad" | "niche" | "mix" | string;
  special_instructions: string;
};

type Day = {
  day: number;
  caption: string;
  video_idea: string;
  filming_directions: string;
  hook: string;
  cta: string;
  hashtags: string;
  posting_suggestion: string;
  platform_notes?: string;
};
type Plan = { days: Day[] };

/** ===== Helpers ===== */
function toNum(v: unknown, def = 40): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeInputs(body: unknown): Inputs {
  const src = (body ?? {}) as Record<string, unknown>;
  const pick = (k: string, def = "") =>
    String(
      src[k] ??
      (src["inputs"] as Record<string, unknown> | undefined)?.[k] ??
      (src["data"] as Record<string, unknown> | undefined)?.[k] ??
      def
    );

  return {
    niche: pick("niche"),
    audience: pick("audience"),
    product_or_service: pick("product_or_service"),
    primary_platform: pick("primary_platform", "Instagram Reels"),
    tone: pick("tone", "friendly"),
    monthly_goal: pick("monthly_goal", "engagement"),
    video_comfort: pick("video_comfort", "mixed"),
    content_balance: toNum(pick("content_balance", "40")),
    hashtag_style: pick("hashtag_style", "mix"),
    special_instructions: pick("special_instructions"),
  };
}

function mergeStripe(md: Record<string, string> | null | undefined, base: Inputs): Inputs {
  const m = md ?? {};
  return {
    niche: (m.niche ?? base.niche ?? "") || "",
    audience: (m.audience ?? base.audience ?? "") || "",
    product_or_service: (m.product_or_service ?? base.product_or_service ?? "") || "",
    primary_platform: (m.primary_platform ?? base.primary_platform ?? "Instagram Reels"),
    tone: (m.tone ?? base.tone ?? "friendly") as Inputs["tone"],
    monthly_goal: (m.monthly_goal ?? base.monthly_goal ?? "engagement") as Inputs["monthly_goal"],
    video_comfort: (m.video_comfort ?? base.video_comfort ?? "mixed") as Inputs["video_comfort"],
    content_balance: toNum(m.content_balance ?? base.content_balance, 40),
    hashtag_style: (m.hashtag_style ?? base.hashtag_style ?? "mix") as Inputs["hashtag_style"],
    special_instructions: (m.special_instructions ?? base.special_instructions ?? ""),
  };
}

function isPlan(p: unknown): p is Plan {
  if (!p || typeof p !== "object") return false;
  const days = (p as { days?: unknown }).days;
  return Array.isArray(days) && days.length === 30;
}

/** ===== Route ===== */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id") || "";
    if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    // Body may be empty on redirect
    let raw: unknown = {};
    try { raw = await req.json(); } catch {}
    // Start with basic normalization (fallback)
    let inputs = normalizeInputs(raw);

    // Prefer Stripe metadata as source of truth after Checkout
    const session = await stripe.checkout.sessions.retrieve(session_id);
    inputs = mergeStripe(session.metadata as Record<string, string> | undefined, inputs);

    // Find or create job keyed by session
    const found = await findJobBySession(session_id);
    const job = found ?? (await createJob(session_id));

    // Mark working
    await updateJob(job.id, { status: "working" });

    // If already ready, return immediately
    if (job.filename && job.status === "ready") {
      return NextResponse.json({ id: job.id, status: "ready", filename: job.filename });
    }

    // Background: generate → build → ready
    (async () => {
      try {
        const plan = await generatePlan(inputs);
        if (!isPlan(plan)) throw new Error("Invalid plan structure");
        const { filename } = await buildDoc(plan, inputs);
        await updateJob(job.id, { status: "ready", filename });
      } catch (err) {
        console.error("generate_or_build_error", err);
        await updateJob(job.id, { status: "failed" });
      }
    })();

    // Respond working; frontend polls /api/jobs/:id
    return NextResponse.json({ id: job.id, status: "working" });
  } catch (err) {
    console.error("api_generate_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}