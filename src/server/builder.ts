import path from "path";
import fs from "fs/promises";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
} from "docx";

type Inputs = {
  niche: string;
  audience: string;
  product_or_service: string;
  primary_platform: string;
  tone: string;
  monthly_goal: string;
  video_comfort: string;
  content_balance: number;
  hashtag_style: string;
  special_instructions: string;
};

type Day = {
  day: number;
  caption: string;
  video_idea: string;
  filming_directions: string; // newline-bulleted (• ...)
  hook: string;
  cta: string;
  hashtags: string;
  posting_suggestion: string;
  platform_notes?: string;
};

type Plan = { days: Day[] };

function brandedFooter(): Footer {
  // Simple, stable footer (no page numbers per your call)
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: "QuickPostKit — 30-Day Content Plan", size: 18 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "© 2025 Fifth Element Labs — One-time license", size: 16 })],
      }),
    ],
  });
}

// Avoid the HeadingLevel-as-type issue by not annotating it as a type.
function H(text: string, level = HeadingLevel.HEADING_2) {
  return new Paragraph({ heading: level, children: [new TextRun({ text })] });
}
function P(text: string) {
  return new Paragraph({ children: [new TextRun({ text })] });
}
function Label(text: string) {
  return new Paragraph({ children: [new TextRun({ text, color: "475569" /* Slate 600 */ })] });
}
function SectionTitle(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: "4338CA" /* Indigo 600 */ })],
  });
}

function bulletsFrom(filming: string) {
  const raw = filming
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[\u2022•-]\s*/, "").trim())
    .filter(Boolean);
  return raw.map((line) => new Paragraph({ children: [new TextRun({ text: "• " + line })] }));
}

/** ========= Output polish (no flow changes) ========= */

/** Trim schema leakage like "… idea" → "…" */
function cleanVideoIdea(s: string | undefined): string {
  const x = (s || "").trim();
  return x.replace(/\bidea\b\s*$/i, "").trim();
}

/** Dedupe filming bullets (case-insensitive, exact-match) and cap 3–6 lines */
function dedupeFilmingDirections(s: string | undefined): string {
  if (!s) return "";
  const lines = s
    .split(/\r?\n/)
    .map((t) => t.replace(/^\s*[\u2022*-]\s*/, "").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const L of lines) {
    const k = L.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(L); }
  }
  // clamp to sensible length
  const clamped = out.slice(0, 6);
  if (clamped.length >= 3) return clamped.join("\n");
  // ensure at least 3 with simple alts if too short
  const ALTS = [
    "Close-up on the key motion for 1–2 seconds",
    "Mid-shot of setup; overlay step text",
    "Slow reveal pan; hold final frame for 1s"
  ];
  while (clamped.length < 3 && ALTS.length) clamped.push(ALTS.shift()!);
  return clamped.join("\n");
}

/** Add niche hashtags (ensures 1–2 domain tags; keep total 5–7) */
function injectNicheHashtags(existing: string | undefined, niche: string | undefined): string {
  const base = (existing || "").trim();
  const set = new Set(
    base.split(/\s+/).map((t) => t.trim()).filter(Boolean)
  );

  const n = (niche || "").toLowerCase();

  const nichePool: string[] = [];
  if (/(power\s*wash|pressure\s*wash|driveway|concrete|clean)/i.test(n)) {
    nichePool.push("#powerwashing", "#cleaningtips", "#satisfyingvideo");
  }
  // add other mappings here later, safely

  // ensure at least one niche tag is present
  const hasNiche = [...set].some((t) => /powerwash|cleaning|satisfyingvideo/.test(t.toLowerCase()));
  if (!hasNiche && nichePool.length) {
    // prefer replacing ultra-generic tags if we already have 5–7
    const genericOrder = ["#buildinpublic", "#growonline", "#reelsideas", "#creator", "#onlinemarketing"];
    const toAdd = nichePool.slice(0, 2);

    for (const tag of toAdd) {
      if (set.size >= 7) {
        // try to delete a generic to keep size ≤7
        for (const g of genericOrder) {
          if (set.has(g)) { set.delete(g); break; }
        }
      }
      if (set.size < 7) set.add(tag);
    }
  }

  // hard clamp to 7, but keep at least 5
  const arr = [...set].slice(0, 7);
  while (arr.length < 5) arr.push("#smallbusiness"); // safe filler
  return arr.join(" ");
}

/** Apply all lightweight fixes */
function polishPlan(plan: Plan, inputs: Inputs): Plan {
  const days = plan.days.map((d) => {
    const video_idea = cleanVideoIdea(d.video_idea);
    const filming_directions = dedupeFilmingDirections(d.filming_directions);
    const hashtags = injectNicheHashtags(d.hashtags, inputs.niche);
    return { ...d, video_idea, filming_directions, hashtags };
  });
  return { days };
}
/** ======== end polish ========= */
export async function buildDoc(
  plan: Plan,
  inputs: Inputs
): Promise<{ filename: string; filepath: string }> {
  
  const polished = polishPlan(plan, inputs);const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Cover — no footer
  const coverChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "QuickPostKit — 30-Day Content Plan", bold: true, size: 40, color: "4338CA" }),
      ],
    }),
    new Paragraph({}),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Tailored for: ${inputs.niche}`, size: 28 })],
    }),
    new Paragraph({}),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated on ${dateStr} • Powered by Fifth Element Labs`,
          size: 20,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({}),
    SectionTitle("Inputs used:"),
    P(`Audience: ${inputs.audience}`),
    P(`Product/Service: ${inputs.product_or_service}`),
    P(`Primary Platform: ${inputs.primary_platform}`),
    P(`Tone: ${inputs.tone}`),
    P(`Monthly Goal: ${inputs.monthly_goal}`),
    P(`Video Comfort: ${inputs.video_comfort}`),
    P(`Content Balance: ${inputs.content_balance}`),
    P(`Hashtag Style: ${inputs.hashtag_style}`),
    P(`Special Instructions: ${inputs.special_instructions || "—"}`),
  ];

  // Days 1–30
  const dayBlocks: Paragraph[] = [];
  for (const d of polished.days) {
    dayBlocks.push(new Paragraph({}));
    dayBlocks.push(
      new Paragraph({
        children: [new TextRun({ text: `Day ${d.day} — ${d.video_idea}`, bold: true, size: 28, color: "4338CA" })],
      })
    );
    dayBlocks.push(Label("Caption"));
    dayBlocks.push(P(d.caption));

    dayBlocks.push(Label("🎬 Video Idea"));
    dayBlocks.push(P(d.video_idea));

    dayBlocks.push(Label("📹 Filming Directions"));
    dayBlocks.push(...bulletsFrom(d.filming_directions));

    dayBlocks.push(Label("💡 Hook"));
    dayBlocks.push(P(d.hook));

    dayBlocks.push(Label("👉 CTA"));
    dayBlocks.push(P(d.cta));

    dayBlocks.push(Label("#️⃣ Hashtags"));
    dayBlocks.push(P(d.hashtags));

    dayBlocks.push(Label("📌 Posting Suggestion"));
    dayBlocks.push(P(d.posting_suggestion));

    if (d.platform_notes && d.platform_notes.trim().length) {
      dayBlocks.push(Label("📝 Platform Notes"));
      dayBlocks.push(P(d.platform_notes));
    }

    dayBlocks.push(new Paragraph({})); // spacer
  }

  // Appendices A–E
  const appendices: Paragraph[] = [
    new Paragraph({}),
    H("Appendix A — How to Find Trending Sounds"),
    P("Use in-app trending tabs, TikTok Creative Center, and save candidate audios weekly."),
    new Paragraph({}),
    H("Appendix B — 10-Beats Script Framework"),
    P("Hook • Context • Promise • Step 1 • Step 2 • Step 3 • Proof • Objection flip • Result • CTA."),
    new Paragraph({}),
    H("Appendix C — Filming & Edit Cheats"),
    P("Natural light, 0.8–1.1x speed cuts, on-screen text, bold cover, mix A-roll/B-roll."),
    new Paragraph({}),
    H("Appendix D — Weekly Batch Plan"),
    P("Batch 7 hooks, film 3 B-roll reels/day, edit in one session, schedule posts."),
    new Paragraph({}),
    H("Appendix E — Posting Checklist"),
    P("Strong cover • First 2s hook • Captions w/ value • 5–7 hashtags • Native text • Clear CTA."),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {}, // no footer on cover
        children: coverChildren,
      },
      {
        properties: {},
        footers: { default: brandedFooter() },
        children: [...dayBlocks, ...appendices],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);

  const tmpDir = path.join(process.cwd(), ".next", "tmp");
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch {}

  const slug = (inputs.niche || "quickpostkit")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const stamp = Date.now();
  const filename = `QuickPostKit_${slug}_${stamp}.docx`;
  const filepath = path.join(tmpDir, filename);
  await fs.writeFile(filepath, buf);

  return { filename, filepath };
}