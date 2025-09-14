import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

// -------- Types --------
type Payload = {
  schema_version?: number;
  niche?: string;
  audience?: string;
  product_or_service?: string;
  primary_platform?: "tiktok" | "instagram" | "youtube" | "facebook" | "linkedin" | string;
  tone?: string;
  monthly_goal?: string;
  video_comfort?: "talking_head" | "no_talking_head" | "mixed" | string;
  content_balance?: number | string;
  hashtag_style?: "broad" | "niche" | "mix" | string;
  special_instructions?: string;
  no_talking_heads?: boolean | string; // legacy
};

type PlanDay = {
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
type Plan = { days: PlanDay[] };

// -------- Helpers: coercion & validation --------
function coerceBoolean(v: any): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return undefined;
}
function coerceNumber01(v: any): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return undefined;
}

function validateAndNormalize(input: any): Required<Payload> {
  const raw: Payload = (input ?? {}) as Payload;

  const niche = raw.niche ?? "";
  const audience = raw.audience ?? "";
  if (!niche || !audience) throw new Error("Missing required fields: niche and audience.");

  const legacyNoTalking = coerceBoolean(raw.no_talking_heads);
  let video_comfort: Required<Payload>["video_comfort"] =
    (raw.video_comfort as any) || (legacyNoTalking === true ? "no_talking_head" : (raw.video_comfort as any));

  const content_balanceC = coerceNumber01(raw.content_balance);
  const content_balance = content_balanceC !== undefined ? Math.max(0, Math.min(100, content_balanceC)) : (raw.content_balance as any);

  return {
    schema_version: raw.schema_version ?? 1,
    niche,
    audience,
    product_or_service: raw.product_or_service ?? "",
    primary_platform: (raw.primary_platform as any) ?? "",
    tone: raw.tone ?? "",
    monthly_goal: raw.monthly_goal ?? "",
    video_comfort: (video_comfort as any) ?? "",
    content_balance: (content_balance as any) ?? (50 as any),
    hashtag_style: (raw.hashtag_style as any) ?? "",
    special_instructions: raw.special_instructions ?? "",
    no_talking_heads: (raw.no_talking_heads as any),
  };
}

// -------- System prompt & OpenAI call --------
const SYSTEM_PROMPT = `
You are QuickPostKit, a sharp human marketer and social content coach.

GOAL: Generate a 30-day content plan as strict JSON (schema provided). Each “day” is a compact recipe card for social content.

STRICT JSON SCHEMA (return ONLY this object, no prose):
{
  "days": [
    {
      "day": 1,
      "caption": "string, 1–3 sentences, human-sounding, tone-aware",
      "video_idea": "string, 2–6 words",
      "filming_directions": "string, 3–6 bullets; obey video_comfort; 6–14 words each",
      "hook": "string, ≤12 words",
      "cta": "string, ≤12 words, aligned to monthly_goal",
      "hashtags": "string, 5–7 hashtags, space-separated; respect hashtag_style",
      "posting_suggestion": "string, platform-aware timing + 1–2 tips",
      "platform_notes": "string, optional ≤200 chars (format notes for primary_platform)"
    }
  ]
}

INPUTS:
- niche: {{niche}}
- audience: {{audience}}
- product_or_service: {{product_or_service}}
- primary_platform: {{primary_platform}}
- tone: {{tone}}   // friendly|bold|witty|minimalist
- monthly_goal: {{monthly_goal}}   // awareness|engagement|authority|sales
- video_comfort: {{video_comfort}} // talking_head|no_talking_head|mixed
- content_balance: {{content_balance}} // 0-100 (0=educational, 100=entertaining)
- hashtag_style: {{hashtag_style}} // broad|niche|mix
- special_instructions: {{special_instructions}}

WRITING RULES:
- Sound human, specific, witty, and useful. No clichés, no “as an AI,” no generic fluff.
- Keep tone consistent with \`tone\` across captions, hooks, CTAs.
- Rotate formats daily to avoid repetition: myth/fact, 3 tips, demo, FAQ, before/after, case study, testimonial bite, objection handling, storytime/origin, prediction/hot take, checklist, challenge/poll, stitch/duet idea, price/value breakdown, seasonal tie-in.
- Support Awareness → Value → Authority → Conversion arcs, BUT shuffle format order so returning users don’t see the same skeleton.
- Respect \`video_comfort\`:
  - talking_head → A-roll opener + 1–2 B-roll cutaways
  - no_talking_head → B-roll-only (self-shot or stock: Canva/Pexels/Envato) + on-screen text
  - mixed → short A-roll hook + B-roll sequence + A-roll CTA
- Use \`content_balance\` to guide mix: lower = how-to/process/educational, higher = entertaining/trendy/BTS.
- Hashtags: 5–7 total, follow \`hashtag_style\` rules:
  - broad → 3 broad, 2 niche
  - niche → 1 broad, 4 niche
  - mix → 2 broad, 3 niche
- \`posting_suggestion\` and \`platform_notes\` must reflect \`primary_platform\` norms (length, timing, overlays, covers). Be concise.
- Captions: 1–3 sentences, platform-ready, tie back to \`special_instructions\` if provided.
- Filming directions: 3–6 bullets, each 6–14 words, concrete and visual.

QUALITY & UNIQUENESS:
- Every pack must be original. Even with identical inputs, vary examples, metaphors, and angles.
- Captions must feel like a human wrote them, not template filler.
- Hooks & CTAs must be short, punchy, and aligned with \`tone\` + \`monthly_goal\`.

OUTPUT: Return ONLY valid JSON matching the schema.
`.trim();

function fillPrompt(t: string, data: Required<Payload>) {
  return t
    .replace("{{niche}}", data.niche)
    .replace("{{audience}}", data.audience)
    .replace("{{product_or_service}}", data.product_or_service || "")
    .replace("{{primary_platform}}", data.primary_platform || "")
    .replace("{{tone}}", data.tone || "")
    .replace("{{monthly_goal}}", data.monthly_goal || "")
    .replace("{{video_comfort}}", data.video_comfort || "")
    .replace("{{content_balance}}", String(data.content_balance ?? ""))
    .replace("{{hashtag_style}}", data.hashtag_style || "")
    .replace("{{special_instructions}}", data.special_instructions || "");
}

async function callOpenAIJson(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt + (process.env.PROMPT_ADDENDUM ? "\n\n" + process.env.PROMPT_ADDENDUM : "") },
        { role: "user", content: "Return ONLY the JSON object." }
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`openai_http_${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("openai_no_content");
  return content;
}

// -------- Plan parsing --------
function safeParsePlan(s: string): Plan | null {
  try {
    const trimmed = s.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
    const obj = JSON.parse(trimmed);
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.days)) return null;
    return { days: obj.days.map((d: any, i: number) => ({
      day: Number(d?.day ?? i + 1),
      caption: String(d?.caption ?? ""),
      video_idea: String(d?.video_idea ?? ""),
      filming_directions: String(d?.filming_directions ?? ""),
      hook: String(d?.hook ?? ""),
      cta: String(d?.cta ?? ""),
      hashtags: String(d?.hashtags ?? ""),
      posting_suggestion: String(d?.posting_suggestion ?? ""),
      platform_notes: d?.platform_notes ? String(d.platform_notes) : undefined,
    })) };
  } catch {
    return null;
  }
}

// -------- Normalizers (formatting safety nets) --------
function splitDirectionsToBullets(text: string): string[] {
  if (!text) return [];

  // Prefer explicit newlines; otherwise split on periods / semicolons / commas
  const parts = (text.includes("\n") ? text.split(/\r?\n/) : text.split(/[.;,]\s*/))
    .map(s => s
      .replace(/^[-*\u2022\u25CF]\s*/, "")   // remove any bullet glyphs
      .replace(/[.,;:]\s*$/, "")             // drop trailing punctuation
      .trim()
    )
    .filter(Boolean);

  // Expand compound steps on "and / then / & / /"
  const out: string[] = [];
  for (const p of parts) {
    const subs = p.split(/\s*(?:\band\b|then|&|\/)\s*/i).map(x => x.trim()).filter(Boolean);
    out.push(...(subs.length > 1 ? subs : [p]));
  }

  // Normalize spacing, de-dupe adjacent, and cap at 6
  const dedup: string[] = [];
  for (const x of out) {
    const cleaned = x.replace(/\s+/g, " ");
    if (dedup.length === 0 || dedup[dedup.length - 1].toLowerCase() !== cleaned.toLowerCase()) {
      dedup.push(cleaned);
    }
  }
  return dedup.slice(0, 6);
}function normalizeHashtags(s: string): string {
  if (!s) return "";
  const tokens = s
    .split(/[\s,]+/)
    .map(t => t.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9_]/gi, ""))
    .filter(Boolean)
    .slice(0, 6)
    .map(t => "#" + t);
  return tokens.join(" ");
}
function capitalizeWords(s: string): string {
  if (!s) return "";
  return s.replace(/\b\w/g, c => c.toUpperCase()).replace(/_/g, " ");
}
function formatVideoComfort(v: string): string {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// -------- DOCX builder (cover + plan + appendices) --------
async function buildDocFromPlan(data: Required<Payload>, plan: Plan): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  // Cover
  children.push(
    new Paragraph({ text: "QUICKPOSTKIT — CUSTOM CONTENT PACK", heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Your AI-powered 30-day social media strategy", italics: true })], spacing: { after: 800 } }),
    new Paragraph({ text: `Niche: ${capitalizeWords(data.niche)}` }),
    new Paragraph({ text: `Audience: ${capitalizeWords(data.audience)}` }),
    new Paragraph({ text: `Platform: ${capitalizeWords(data.primary_platform)}` }),
    new Paragraph({ text: `Tone: ${capitalizeWords(data.tone)}` }),
    new Paragraph({ text: `Goal: ${capitalizeWords(data.monthly_goal) || "—"}` }),
    new Paragraph({ text: `Video Style: ${formatVideoComfort(data.video_comfort)}` }),
    new Paragraph({ text: `Content Balance: ${String(data.content_balance)}` }),
    new Paragraph({ text: `Hashtag Strategy: ${capitalizeWords(data.hashtag_style)}` }),
    new Paragraph({ text: data.special_instructions ? `Notes: ${data.special_instructions}` : "" }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "© 2025 Fifth Element Labs. All Rights Reserved.", italics: true, size: 20 })], spacing: { before: 800 } }),
    new Paragraph({ text: "", pageBreakBefore: true })
  );

  // 30-day plan
  plan.days.slice(0, 30).forEach((d, idx) => {
    const bullets = splitDirectionsToBullets(d.filming_directions);
    const hashtags = normalizeHashtags(d.hashtags);

    children.push(
      new Paragraph({ text: `Day ${idx + 1}`, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun({ text: "Hook: ", bold: true }), new TextRun({ text: d.hook || "—" })] }),
      new Paragraph({ children: [new TextRun({ text: "Caption: ", bold: true }), new TextRun({ text: d.caption || "—" })] }),
      new Paragraph({ children: [new TextRun({ text: "Video Idea: ", bold: true }), new TextRun({ text: d.video_idea || "—" })] }),
      new Paragraph({ children: [new TextRun({ text: "Filming Directions:", bold: true })] })
    );

    if (bullets.length) {
      bullets.forEach(b => children.push(new Paragraph({ text: b, bullet: { level: 0 } })));
    } else {
      children.push(new Paragraph({ text: "—" }));
    }

    children.push(
      new Paragraph({ children: [new TextRun({ text: "CTA: ", bold: true }), new TextRun({ text: d.cta || "—" })] }),
      new Paragraph({ children: [new TextRun({ text: "Hashtags: ", bold: true }), new TextRun({ text: hashtags || "—" })] }),
      new Paragraph({ children: [new TextRun({ text: "Posting Suggestion: ", bold: true }), new TextRun({ text: d.posting_suggestion || "—" })] }),
      d.platform_notes ? new Paragraph({ children: [new TextRun({ text: "Platform Notes: ", bold: true }), new TextRun({ text: d.platform_notes })] }) : new Paragraph({ text: "" }),
      new Paragraph({ text: "" })
    );
  });

  // Appendices
  children.push(new Paragraph({ text: "", pageBreakBefore: true }));

  // Appendix A
  children.push(new Paragraph({ text: "APPENDIX A — FINDING TRENDING SOUNDS", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: "Use these platform-specific steps each week to spot rising audio." }));
  [
    "TikTok: Open Discover / Sounds tab; target 1k–50k uses; preview top 5 creators.",
    "Instagram Reels: Look for ↗ arrow next to audio; save to library; pick steady risers.",
    "YouTube Shorts: Use Add Sound / Trending Music; check niche Shorts; favor growing tracks.",
    "General: Save 5–10 sounds weekly; map each to a planned content type."
  ].forEach(t => children.push(new Paragraph({ text: t, bullet: { level: 0 } })));

  // Appendix B
  children.push(new Paragraph({ text: "APPENDIX B — THE 10-BEATS SCRIPT FRAMEWORK", heading: HeadingLevel.HEADING_1 }));
  [
    "Hook (≤2s)", "Context / Setup", "Promise", "Step 1", "Step 2", "Step 3",
    "Common Mistake / Myth", "Proof or Example", "Payoff / Result", "Clear CTA"
  ].forEach(t => children.push(new Paragraph({ text: t, bullet: { level: 0 } })));

  // Appendix C
  children.push(new Paragraph({ text: "APPENDIX C — FILMING & EDIT CHEATS", heading: HeadingLevel.HEADING_1 }));
  [
    "Angles: wide → medium → close; change every 2–3s.",
    "Movement: pan, tilt, push, pull; keep motivated.",
    "Lighting: face natural light; avoid mixed temps.",
    "Text: 5–8 words per screen; high contrast; safe zones.",
    "Audio: lower background under voice; check phone clarity."
  ].forEach(t => children.push(new Paragraph({ text: t, bullet: { level: 0 } })));

  // Appendix D
  children.push(new Paragraph({ text: "APPENDIX D — WEEKLY BATCH PLAN", heading: HeadingLevel.HEADING_1 }));
  [
    "Mon: Research hooks (1 hr); save 10 sounds.",
    "Tue: Film 6–8 clips (90 min).",
    "Wed: Edit 3–4 drafts (90 min).",
    "Thu: Write captions + hashtags (45 min).",
    "Fri: Schedule posts; prep backlog."
  ].forEach(t => children.push(new Paragraph({ text: t, bullet: { level: 0 } })));

  // Appendix E
  children.push(new Paragraph({ text: "APPENDIX E — POSTING CHECKLIST", heading: HeadingLevel.HEADING_1 }));
  [
    "Hook in first 2s; cover frame clear.",
    "Auto-captions on; fix typos.",
    "One clear CTA (buy, book, follow).",
    "Exactly 6 hashtags with #.",
    "Reply to first 5 comments within 15 minutes."
  ].forEach(t => children.push(new Paragraph({ text: t, bullet: { level: 0 } })));
  children.push(new Paragraph({ text: "Powered by Fifth Element Labs", italics: true }));

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc).then((buf) => new Uint8Array(buf));
}

// -------- Fallback doc --------
function buildFallbackDoc(): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "QuickPostKit — Custom Content Pack", heading: HeadingLevel.TITLE }),
        new Paragraph({ text: "Smoke test: generation fallback succeeded." }),
        ...Array.from({ length: 10 }).map((_, i) => new Paragraph({ text: `Content Idea ${i + 1}` })),
      ],
    }],
  });
  return Packer.toBuffer(doc).then((buf) => new Uint8Array(buf));
}

// -------- HTTP handler --------
export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    let normalized: Required<Payload>;
    try {
      normalized = validateAndNormalize(data);
      console.log("[gen] schema v" + normalized.schema_version, {
        platform: normalized.primary_platform,
        video: normalized.video_comfort,
        balance: normalized.content_balance,
        hashtags: normalized.hashtag_style,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "invalid_input" }, { status: 400 });
    }

    let file: Uint8Array | null = null;

    try {
      const prompt = fillPrompt(SYSTEM_PROMPT, normalized);
      const content = await callOpenAIJson(prompt);
      const plan = safeParsePlan(content);
      if (!plan) throw new Error("plan_parse_failed");
      file = await buildDocFromPlan(normalized, plan);
    } catch (e: any) {
      console.log("[generate] LLM path failed:", e?.message);
    }

    if (!file) file = await buildFallbackDoc();

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=QuickPostKit.docx",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.log("[generate ERROR] hard fallback:", err?.message);
    const fallback = await buildFallbackDoc();
    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=QuickPostKit.docx",
        "Cache-Control": "no-store",
        "X-Fallback": "true",
      },
    });
  }
}





