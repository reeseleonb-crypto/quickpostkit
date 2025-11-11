import OpenAI from "openai";
import { Document, Packer, Paragraph, HeadingLevel, Footer, AlignmentType } from "docx";

export const runtime = "nodejs";

/* ============================= Types ============================= */
type Inputs = {
  niche?: string;
  audience?: string;
  product_or_service?: string;
  primary_platform?: string;
  tone?: string;
  video_comfort?: string;
  monthly_goal?: string;
  content_balance?: number | string;
  hashtag_style?: string;
  special_instructions?: string;
  location?: string;
};

type Step = { start_s: number; end_s: number; instruction: string; overlay: string };
type DayItem = {
  hook: string;
  caption: string;
  video_idea: string;
  filming_directions: Step[];
  editing_notes: string[];
  cta: string;
  hashtags: string[];
  posting_suggestion: string;
  platform_notes: string;
};
type Plan = { days: DayItem[] };

/* ============================ Minimal Validation ============================ */
function validateInputs(body: any): { ok: boolean; data: Inputs } {
  const d: any = body && typeof body === "object" ? body : {};
  const keys = [
    "niche","audience","product_or_service","primary_platform","tone",
    "video_comfort","monthly_goal","content_balance","hashtag_style",
    "special_instructions","location"
  ];
  const out: any = {};
  for (const k of keys) out[k] = d[k];
  return { ok: true, data: out as Inputs };
}

/* ============================= Prompt ============================= */
function buildPrompt(data: Inputs): string {
  const lines: string[] = [];
  lines.push("ROLE: Return a single compact JSON object only.");
  lines.push("No markdown, no code fences, no commentary.");
  lines.push("Use double quotes for all keys and strings. No trailing commas. ASCII only.");
  lines.push('TOP LEVEL: include a property named "days" that is an array with exactly 30 items.');
  lines.push('PER-DAY KEYS (exact): "hook", "caption", "video_idea", "filming_directions", "editing_notes", "cta", "hashtags", "posting_suggestion", "platform_notes".');
  lines.push("FILMING_DIRECTIONS: array of 5–7 steps showing how to film the creator performing their craft. Each step uses action verbs like capture/show/highlight. Hooks visible by 0–2s. Total 12–20s.");
  lines.push("EDITING_NOTES: array of 3–5 varied, specific techniques matched to the idea.");
  lines.push("HASHTAGS: array of 4–6 all-lowercase, niche-aware; avoid generic fillers.");
  lines.push("CTA: fresh and specific; avoid generic lines.");
  lines.push("POSTING_SUGGESTION: brief timing or packaging tip.");
  lines.push("PLATFORM_NOTES: short note tailored to major platforms when relevant.");

  lines.push("Niche: " + (data.niche ?? "") + ".");
  lines.push("Audience: " + (data.audience ?? "") + ".");
  lines.push("Product or service: " + (data.product_or_service ?? "") + ".");
  lines.push("Primary platform: " + (data.primary_platform ?? "") + ".");
  lines.push("Tone: " + (data.tone ?? "") + ".");
  lines.push("Video comfort: " + (data.video_comfort ?? "") + ".");
  lines.push("Monthly goal: " + (data.monthly_goal ?? "") + ".");
  lines.push("Content balance: " + (data.content_balance ?? "") + ".");
  lines.push("Hashtag style: " + (data.hashtag_style ?? "") + ".");
  lines.push("Location: " + (data.location ?? "") + ".");
  lines.push("Special instructions: " + (data.special_instructions ?? "") + ".");

  lines.push(`CREATIVE CONTEXT:
This project is for local creators and small businesses who want to show their craft through short social media videos.
Filming directions must focus on how to film the craft being performed, not how to perform it.
Describe how to capture emotion, movement, lighting, and storytelling that makes the work look cinematic.
Never give tutorial advice. QUALITY GUARDRAILS: No cliches, no repetition, no filler. Hooks must be punchy. Return JSON only.`);
  return lines.join("\n");
}

/* ============================= Coercion & Repair ============================= */
function coercePlan(raw: any): Plan {
  function normTags(arr: any): string[] {
    const tg = Array.isArray(arr) ? arr : [];
    const out: string[] = [];
    for (let i = 0; i < tg.length; i++) {
      let s = String(tg[i] || "").trim();
      if (!s) continue;
      if (s.charAt(0) !== "#") s = "#" + s.replace(/^#+/, "");
      out.push(s.toLowerCase());
    }
    return out;
  }
  function mapSteps(arr: any): Step[] {
    const sb = Array.isArray(arr) ? arr : [];
    return sb.map((s: any) => ({
      start_s: Math.max(0, Math.floor(Number((s && s.start_s) || 0))),
      end_s: Math.max(1, Math.floor(Number((s && s.end_s) || 0))),
      instruction: String((s && (s.instruction || s.direction || s.step || "")) || ""),
      overlay: String((s && s.overlay) || "")
    }));
  }

  if (!raw || typeof raw !== "object" || !Array.isArray(raw.days)) return { days: [] };
  const out: DayItem[] = [];
  for (let i = 0; i < raw.days.length; i++) {
    const d = raw.days[i] || {};
    const fdSrc = Array.isArray(d.filming_directions) ? d.filming_directions : (Array.isArray(d.storyboard) ? d.storyboard : []);
    out.push({
      hook: String(d.hook || ""),
      caption: String(d.caption || ""),
      video_idea: String(d.video_idea || ""),
      filming_directions: mapSteps(fdSrc),
      editing_notes: (Array.isArray(d.editing_notes) ? d.editing_notes : []).map((e: any) => String(e || "")),
      cta: String(d.cta || ""),
      hashtags: normTags(d.hashtags),
      posting_suggestion: String(d.posting_suggestion || ""),
      platform_notes: String(d.platform_notes || "")
    });
  }
  return { days: out };
}

function ensureExactly30(plan: Plan): Plan {
  const daysIn = Array.isArray(plan.days) ? plan.days.slice(0, 30) : [];
  const days: DayItem[] = [];
  const fallbackDay = (i: number): DayItem => ({
    hook: "Hook " + (i + 1),
    caption: "Caption " + (i + 1),
    video_idea: "Idea " + (i + 1),
    filming_directions: [
      { start_s: 0, end_s: 2, instruction: "Show subject clearly", overlay: "Start" },
      { start_s: 2, end_s: 6, instruction: "Move closer, reveal detail", overlay: "Detail" },
      { start_s: 6, end_s: 10, instruction: "Show main action", overlay: "Action" },
      { start_s: 10, end_s: 12, instruction: "Show result", overlay: "Result" }
    ],
    editing_notes: ["Tight cuts", "On-screen text", "Native captions"],
    cta: "Try this today and tag us.",
    hashtags: ["#tips", "#guide", "#howto", "#niche"],
    posting_suggestion: "Post at peak hour.",
    platform_notes: "Add captions."
  });
  for (let i = 0; i < 30; i++) days.push(daysIn[i] || fallbackDay(i));
  return { days };
}

/* ============================= DOCX ============================= */
function buildDocx(plan: Plan, meta: Inputs): Promise<Buffer> {
  function p(text: string) { return new Paragraph({ text }); }
  const children: any[] = [];
  children.push(new Paragraph({ text: "QuickPostKit - 30-Day Plan", heading: HeadingLevel.TITLE }));
  children.push(p("Generated: " + new Date().toISOString().slice(0, 10)));
  children.push(p("Niche: " + (meta.niche || "")));
  children.push(p("Audience: " + (meta.audience || "")));
  children.push(p("Product/Service: " + (meta.product_or_service || "")));
  children.push(p("Platform: " + (meta.primary_platform || "")));
  children.push(p("Tone: " + (meta.tone || "")));
  children.push(p("Goal: " + (meta.monthly_goal || "")));
  children.push(p("Hashtag Style: " + (meta.hashtag_style || "")));
  children.push(p("Location: " + (meta.location || "")));
  children.push(p("Special Instructions: " + (meta.special_instructions || "")));
  children.push(p(""));

  for (let i = 0; i < plan.days.length; i++) {
    const d = plan.days[i];
    children.push(new Paragraph({ text: "Day " + (i + 1), heading: HeadingLevel.HEADING_1 }));
    children.push(p("Hook: " + d.hook));
    children.push(p("Caption: " + d.caption));
    children.push(p("Video Idea: " + d.video_idea));
    for (const s of d.filming_directions)
      children.push(p(`[${s.start_s}-${s.end_s}s] ${s.instruction} | ${s.overlay}`));
    children.push(p("Hashtags: " + d.hashtags.join(" ")));
    children.push(p(""));
  }

  const doc = new Document({
    sections: [{ properties: {}, footers: { default: new Footer({ children: [new Paragraph({ text: "© 2025 Fifth Element Labs", alignment: AlignmentType.CENTER })] }) }, children }]
  });
  return Packer.toBuffer(doc);
}

/* ============================= HTTP Handler ============================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ok, data } = validateInputs(body);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const batch1 = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "You output JSON only." }, { role: "user", content: buildPrompt(data) }],
      temperature: 0.55
    });

    const raw = batch1.choices[0]?.message?.content || "{}";
    let plan = coercePlan(JSON.parse(raw));
    plan = ensureExactly30(plan);

    const buf = await buildDocx(plan, data);
    const fileName = "QuickPostKit_" + Date.now() + ".docx";
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    console.error("?? Generation error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
