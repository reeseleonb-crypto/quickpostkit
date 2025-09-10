/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";
import { ANGLE_TAGS, CTA_ALTS, HASHTAG_POOL } from "./constants";

type Inputs = {
  niche: string;
  audience: string;
  product_or_service: string;
  primary_platform: string;
  tone: "friendly" | "bold" | "witty" | "minimalist" | string;
  monthly_goal: "awareness" | "engagement" | "authority" | "sales" | string;
  video_comfort: "talking_head" | "no_talking_head" | "mixed" | string;
  content_balance: number; // 0-100
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generatePlan(inputs: Inputs): Promise<Plan> {
  const userBlock = [
    "INPUTS:",
    `- niche: ${inputs.niche}`,
    `- audience: ${inputs.audience}`,
    `- product_or_service: ${inputs.product_or_service}`,
    `- primary_platform: ${inputs.primary_platform}`,
    `- tone: ${inputs.tone}`,
    `- monthly_goal: ${inputs.monthly_goal}`,
    `- video_comfort: ${inputs.video_comfort}`,
    `- content_balance: ${inputs.content_balance}`,
    `- hashtag_style: ${inputs.hashtag_style}`,
    `- special_instructions: ${inputs.special_instructions || "none"}`
  ].join("\\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.8,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userBlock }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  const parsed = repairJsonOnce(raw);
  validateStrict(parsed);
  const rotated = enforceRotation(parsed, inputs);
  const unique = ensureUniqueness(rotated, inputs);
  const cleaned = unique.days.map((d, idx) => mutateDay_v2(d, idx + 1, inputs));
  return { days: cleaned };
}

// ————— Helpers —————

function repairJsonOnce(text: string): Plan {
  let s = text.trim();
  s = s.replace(/^```json/gi, "").replace(/^```/gi, "").replace(/```$/g, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch {
    s = s.replace(/,\\s*([}\\]])/g, "$1");
    return JSON.parse(s);
  }
}

function validateStrict(plan: Plan) {
  if (!plan || !Array.isArray(plan.days)) throw new Error("Invalid: missing days[]");
  if (plan.days.length !== 30) throw new Error("Invalid: days must be length 30");
  for (const d of plan.days) {
    const req = ["day","caption","video_idea","filming_directions","hook","cta","hashtags","posting_suggestion"];
    for (const k of req) if ((d as any)[k] == null) throw new Error(`Invalid day: missing ${k}`);
  }
}

function enforceRotation(plan: Plan, inputs: Inputs): Plan {
  const angles = shuffle([...ANGLE_TAGS]).slice(0, 30);
  return {
    days: plan.days.map((d, i) => {
      const hint = `Format: ${angles[i]} • ${inputs.primary_platform} norms respected.`;
      d.platform_notes = (d.platform_notes?.length ? d.platform_notes + " " : "") + hint;
      return d;
    })
  };
}

function ensureUniqueness(plan: Plan, inputs: Inputs): Plan {
  const seen = new Set<string>();
  const out: Day[] = [];
  for (const d of plan.days) {
    let candidate = { ...d };
    let sig = signature(candidate);
    let guard = 0;
    while (seen.has(sig) && guard++ < 3) {
      candidate = nudgeVariant(candidate, inputs);
      sig = signature(candidate);
    }
    if (seen.has(sig)) candidate.hook = uniqueHook(candidate.hook);
    seen.add(sig);
    out.push(candidate);
  }
  return { days: out };
}

function signature(d: Day): string {
  const norm = (s: string) => s.toLowerCase().replace(/\\s+/g, " ").trim();
  return [norm(d.video_idea), norm(d.hook), norm(d.caption)].join("|");
}

function nudgeVariant(d: Day, inputs: Inputs): Day {
  const cta = pickDifferent(CTA_ALTS, d.cta);
  const angleWord = pickDifferent(ANGLE_TAGS, d.video_idea);
  const video = smartCap(`${angleWord}: ${d.video_idea}`.replace(/\\s+/g, " ").trim()).slice(0, 60);
  const hashtags = remixHashtags(d.hashtags, inputs.hashtag_style);
  return { ...d, cta, video_idea: video, hashtags };
}

function uniqueHook(hook: string): string {
  const tagPool = ["Today Only","New Angle","Pro Tip","Try This","Zero Fluff"];
  const tag = tagPool[Math.floor(Math.random()*tagPool.length)];
  const words = hook.trim().split(/\\s+/);
  if (words.length <= 10) return `${hook} — ${tag}`;
  return smartCap(`${words.slice(0, 9).join(" ")} — ${tag}`);
}

function remixHashtags(_: string, __: string) {
  const pool = shuffle(HASHTAG_POOL).slice(0, 7);
  const want = Math.min(7, Math.max(5, 6));
  return pool.slice(0, want).join(" ");
}

function pickDifferent(list: string[], current: string): string {
  const shuffled = shuffle(list);
  for (const x of shuffled) if (!eqi(x, current)) return x;
  return shuffled[0];
}

function eqi(a: string, b: string) { return a.trim().toLowerCase() === b.trim().toLowerCase(); }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function smartCap(s: string) { return s.replace(/\\b\\w/g, c => c.toUpperCase()); }

// Final sanitizer for each day
export function mutateDay_v2(day: Day, idx: number, inputs: Inputs): Day {
  const within = (s: string, maxWords: number) => {
    const w = s.trim().split(/\\s+/);
    return w.length <= maxWords ? s : w.slice(0, maxWords).join(" ");
  };

  day.hook = within(day.hook, 12);
  day.cta = within(day.cta, 12);

  // Filming bullets
  let bullets = day.filming_directions
    .split(/\\n|•|- |\\u2022/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^\\u2022\\s*/, ""));

  const seen = new Set<string>();
  bullets = bullets.filter(b => {
    const key = b.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  while (bullets.length < 3) {
    bullets.push(inputs.video_comfort === "no_talking_head"
      ? "Top-down B-roll of process with on-screen text steps"
      : "A-roll opener, then B-roll cutaway showing the key step");
  }
  if (bullets.length > 6) bullets = bullets.slice(0, 6);

  bullets = bullets.map(b => {
    const words = b.split(/\\s+/);
    if (words.length < 6) return (b + " with clear on-screen text overlay").trim();
    if (words.length > 14) return words.slice(0, 14).join(" ");
    return b;
  });
  day.filming_directions = bullets.map(b => `• ${smartCap(b)}`).join("\\n");

  // Hashtags 5–7
  const tags = day.hashtags.trim().split(/\\s+/).filter(t => t.startsWith("#"));
  if (tags.length < 5 || tags.length > 7) day.hashtags = remixHashtags(day.hashtags, inputs.hashtag_style);

  // Platform notes
  if (!day.platform_notes) {
    day.platform_notes = `${inputs.primary_platform}: use native text overlays and an engaging cover frame.`;
  }

  // Caption 1–3 sentences
  const sentences = day.caption.split(/(?<=[.!?])\\s+/).filter(Boolean);
  if (sentences.length === 0) day.caption = "Quick hit worth saving. Try it and report back.";
  if (sentences.length > 3) day.caption = sentences.slice(0, 3).join(" ");

  // Video idea 2–6 words
  const viWords = day.video_idea.trim().split(/\\s+/);
  if (viWords.length < 2) day.video_idea = smartCap(`${ANGLE_TAGS[idx % ANGLE_TAGS.length]} idea`);
  if (viWords.length > 6) day.video_idea = viWords.slice(0, 6).join(" ");

  return day;
}