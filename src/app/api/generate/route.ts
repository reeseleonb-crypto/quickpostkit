import OpenAI from 'openai';
import { Document, Packer, Paragraph, HeadingLevel, Footer, AlignmentType } from 'docx';

export const runtime = 'nodejs';

/* ============================= Types ============================= */
type Inputs = {
  niche?: string;
  audience?: string;
  product_or_service?: string;
  primary_platform?: string; // tiktok | instagram | youtube | linkedin (raw, no normalization)
  tone?: string;
  video_comfort?: string;     // no_talking_head | talking_head | mixed
  monthly_goal?: string;      // short strings like engagement, sales, bookings, email_signups
  content_balance?: number | string; // backend expects percent educational (client inverts)
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
  const d: any = body && typeof body === 'object' ? body : {};
  const keys = [
    'niche','audience','product_or_service','primary_platform','tone',
    'video_comfort','monthly_goal','content_balance','hashtag_style',
    'special_instructions','location'
  ];
  const out: any = {};
  for (const k of keys) out[k] = d[k];
  return { ok: true, data: out as Inputs };
}

/* ============================= Prompt ============================= */
function buildPrompt(data: Inputs): string {
  const lines: string[] = [];
  lines.push('ROLE: Return a single compact JSON object only.');
  lines.push('No markdown, no code fences, no commentary.');
  lines.push('Use double quotes for all keys and strings. No trailing commas. ASCII only.');
  lines.push('TOP LEVEL: include a property named "days" that is an array with exactly 30 items.');
  lines.push('PER-DAY KEYS (exact): "hook", "caption", "video_idea", "filming_directions", "editing_notes", "cta", "hashtags", "posting_suggestion", "platform_notes".');
  lines.push('FILMING_DIRECTIONS: array of 5-7 beginner steps. Each has: "start_s" (int), "end_s" (int), "instruction" (plain filming guidance for non-experts), "overlay" (<= 6 words, Title Case). Hook visible by 0-2s. Timestamps ascend. Total 12-20s.');
  lines.push('EDITING_NOTES: array of 3-5 varied, specific techniques matched to the idea.');
  lines.push('HASHTAGS: array of 4-6 all-lowercase, niche-aware; avoid generic fillers.');
  lines.push('CTA: fresh and specific; avoid generic lines.');
  lines.push('POSTING_SUGGESTION: brief timing or packaging tip.');
  lines.push('PLATFORM_NOTES: short note tailored to major platforms when relevant.');

  lines.push('Niche: ' + (data.niche ?? '') + '.');
  lines.push('Audience: ' + (data.audience ?? '') + '.');
  lines.push('Product or service: ' + (data.product_or_service ?? '') + '.');
  lines.push('Primary platform: ' + (data.primary_platform ?? '') + '.');
  lines.push('Tone: ' + (data.tone ?? '') + '.');
  lines.push('Video comfort: ' + (data.video_comfort ?? '') + '.');
  if (data.content_balance !== undefined && data.content_balance !== null) {
    lines.push('Content balance target: ' + String(data.content_balance) + ' percent educational across 30 days.');
  } else {
    lines.push('Content balance target: .');
  }
  lines.push('Monthly goal: ' + (data.monthly_goal ?? '') + '.');
  lines.push('Hashtag style: ' + (data.hashtag_style ?? '') + '.');
  lines.push('Location: ' + (data.location ?? '') + '.');
  lines.push('Special instructions: ' + (data.special_instructions ?? '') + '.');

  lines.push('QUALITY GUARDRAILS: No cliches, no repetitive phrasing, no filler. Hooks must be punchy and varied. Keep captions human and specific. Return JSON only.');
  return lines.join('\n');
}

/* ============================= Coercion & Repair ============================= */
function coercePlan(raw: any): Plan {
  function normTags(arr: any): string[] {
    const tg = Array.isArray(arr) ? arr : [];
    const out: string[] = [];
    for (let i = 0; i < tg.length; i++) {
      let s = String(tg[i] || '').trim();
      if (!s) continue;
      if (s.charAt(0) !== '#') s = '#' + s.replace(/^#+/, '');
      out.push(s.toLowerCase());
    }
    return out;
  }
  function mapSteps(arr: any): Step[] {
    const sb = Array.isArray(arr) ? arr : [];
    return sb.map((s: any) => ({
      start_s: Math.max(0, Math.floor(Number((s && s.start_s) || 0))),
      end_s: Math.max(1, Math.floor(Number((s && s.end_s) || 0))),
      instruction: String((s && (s.instruction || s.direction || s.step || '')) || ''),
      overlay: String((s && s.overlay) || '')
    }));
  }

  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.days)) return { days: [] };
  const out: DayItem[] = [];
  for (let i = 0; i < raw.days.length; i++) {
    const d = raw.days[i] || {};
    const fdSrc = Array.isArray(d.filming_directions) ? d.filming_directions : (Array.isArray(d.storyboard) ? d.storyboard : []);
    out.push({
      hook: String(d.hook || ''),
      caption: String(d.caption || ''),
      video_idea: String(d.video_idea || ''),
      filming_directions: mapSteps(fdSrc),
      editing_notes: (Array.isArray(d.editing_notes) ? d.editing_notes : []).map((e: any) => String(e || '')),
      cta: String(d.cta || ''),
      hashtags: normTags(d.hashtags),
      posting_suggestion: String(d.posting_suggestion || ''),
      platform_notes: String(d.platform_notes || '')
    });
  }
  return { days: out };
}

function ensureExactly30(plan: Plan): Plan {
  function fallbackDay(i: number): DayItem {
    return {
      hook: 'Hook ' + String(i + 1),
      caption: 'Caption ' + String(i + 1),
      video_idea: 'Idea ' + String(i + 1),
      filming_directions: [
        { start_s: 0, end_s: 2, instruction: 'Show the subject clearly; steady shot.', overlay: 'Watch This' },
        { start_s: 2, end_s: 5, instruction: 'Move closer so the subject fills most of the frame.', overlay: 'Detail' },
        { start_s: 5, end_s: 9, instruction: 'Demonstrate the key action; keep frame simple.', overlay: 'Action' },
        { start_s: 9, end_s: 12, instruction: 'End on the result; hold for 1 second.', overlay: 'Result' }
      ],
      editing_notes: ['Tight cuts', 'On-screen text', 'Native captions'],
      cta: 'Try this today and tag us.',
      hashtags: ['#tips', '#guide', '#howto', '#niche'],
      posting_suggestion: 'Post in your audience prime evening hour.',
      platform_notes: 'Add captions on TikTok/Reels.'
    };
  }
  const daysIn = Array.isArray(plan.days) ? plan.days.slice(0, 30) : [];
  const days: DayItem[] = [];
  for (let i = 0; i < 30; i++) days.push(daysIn[i] || fallbackDay(i));
  return { days };
}

/* ============================= DOCX ============================= */
function buildDocx(plan: Plan, meta: Inputs): Promise<Buffer> {
  function h1(text: string) { return new Paragraph({ text, heading: HeadingLevel.HEADING_1 }); }
  function h2(text: string) { return new Paragraph({ text, heading: HeadingLevel.HEADING_2 }); }
  function p(text: string)  { return new Paragraph({ text }); }

  // Cover: content balance display
  let edu = '';
  let ent = '';
  if (meta && meta.content_balance !== undefined && meta.content_balance !== null && meta.content_balance !== '') {
    const v = Number(meta.content_balance);
    if (!isNaN(v)) {
      const vc = Math.max(0, Math.min(100, Math.round(v)));
      edu = String(vc) + '% educational';
      ent = String(100 - vc) + '% entertaining';
    }
  }

  const children: any[] = [];
  children.push(new Paragraph({ text: 'QuickPostKit - 30-Day Plan', heading: HeadingLevel.TITLE }));
  children.push(p('Generated: ' + new Date().toISOString().slice(0, 10)));
  children.push(p('----------------------------------------'));
  children.push(p('Niche: ' + (meta.niche || '')));
  children.push(p('Audience: ' + (meta.audience || '')));
  children.push(p('Product or Service: ' + (meta.product_or_service || '')));
  children.push(p('Primary Platform: ' + (meta.primary_platform || '')));
  children.push(p('Tone: ' + (meta.tone || '')));
  children.push(p('Video Comfort: ' + (meta.video_comfort || '')));
  children.push(p('Monthly Goal: ' + (meta.monthly_goal || '')));
  children.push(p('Content Balance: ' + (edu ? (ent ? (edu + ' / ' + ent) : edu) : '')));
  children.push(p('Hashtag Style: ' + (meta.hashtag_style || '')));
  children.push(p('Special Instructions: ' + (meta.special_instructions || '')));
  children.push(p('Location: ' + (meta.location || '')));
  children.push(p(''));

  // Quick Guide - How To Use This Download
  children.push(h1('Quick Guide - How To Use This Download'));
  const quickGuide = [
    'Skim Day 1-3 and pick one to film today.',
    'Follow the Filming Directions step-by-step. Keep each step about 1-3s.',
    'Hook must be visible by 0-2s. Show motion or contrast early.',
    'If you need a trending sound, see Appendix A and pair it after editing.',
    'Aim for 5-7 steps total; hold the final result for 1s.',
    'Post at your audience peak hour. Reply to early comments within 20 minutes.'
  ];
  for (let i = 0; i < quickGuide.length; i++) { children.push(p('- ' + quickGuide[i])); }
  children.push(p(''));

  // 30 Days
  for (let i = 0; i < plan.days.length; i++) {
    const d = plan.days[i];
    children.push(h1('Day ' + String(i + 1)));
    children.push(p('Hook: ' + d.hook));
    children.push(p('Caption: ' + d.caption));
    children.push(p('Video Idea: ' + d.video_idea));
    children.push(h2('Filming Directions'));
    for (let k = 0; k < d.filming_directions.length; k++) {
      const s = d.filming_directions[k];
      children.push(p('[' + String(s.start_s) + '-' + String(s.end_s) + 's] ' + s.instruction + ' | Overlay: ' + s.overlay));
    }
    children.push(h2('Editing Notes'));
    for (let e = 0; e < d.editing_notes.length; e++) children.push(p('- ' + d.editing_notes[e]));
    children.push(p('CTA: ' + d.cta));
    children.push(p('Hashtags: ' + d.hashtags.join(' ')));
    children.push(p('Posting Suggestion: ' + d.posting_suggestion));
    children.push(p('Platform Notes: ' + d.platform_notes));
    children.push(p(''));
  }

  // Platform-Specific Guide
  children.push(h1('Platform-Specific Guide'));
  children.push(h2('TikTok'));
  for (const s of [
    'Hook by 0-2s with motion or contrast.',
    '12-16s total; align one text hit to the beat.',
    'Use rising sounds in your niche (see Appendix A).',
    'End with a clear action: save, share, comment a keyword.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('Instagram Reels'));
  for (const s of [
    '8-12s; crisp cuts; color pop.',
    'Strong cover frame; readable title.',
    'Use native text styles; add location tag when relevant.',
    'Test 3 caption lengths: micro, short, story.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('YouTube Shorts'));
  for (const s of [
    '15-25s; allow one explanatory step.',
    'Clear narration or on-screen text for context.',
    'CTA to a longer video or resources in description.',
    'Consistent thumbnail style for the Shorts shelf.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('LinkedIn'));
  for (const s of [
    '20-45s explainers; lead with a stat, proof, or mini case.',
    'Subtitles required; many watch muted.',
    'Text above video: 2-line value summary.',
    'Tag people/companies only when relevant.'
  ]) children.push(p('- ' + s));

  children.push(p(''));
  children.push(p(''));

  // Recycling Plan
  children.push(h1('Recycling Plan'));
  for (const s of [
    'Turn top 3 hooks into carousels (6-8 frames).',
    'Combine 3 similar tips into a 30s roundup.',
    'Make a before/after split-screen of your best result.',
    'Cut a vertical teaser for YouTube; link long-form.',
    'Convert 1 explainer into a talking-head plus B-roll remix.',
    'Reply-on-video to 5 comments as rapid Q and A.',
    'Turn 2 best captions into email subject lines and send.',
    'Save good shots to a B-roll library for future edits.'
  ]) children.push(p('- ' + s));

  children.push(p(''));
  children.push(p(''));

  // Cheat Sheet
  children.push(h1('Cheat Sheet'));
  children.push(h2('Hooks'));
  for (const s of [
    'Start with an outcome or bold claim.',
    'Show the result first, then rewind.',
    'Flip an objection: You think X, but actually...'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('Filming'));
  for (const s of [
    'Natural light if possible; face a window.',
    'Alternate distance: full view -> close detail -> action -> reaction.',
    'One motivated move per step; avoid digital zoom unless experienced.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('Editing'));
  for (const s of [
    'Average cut about 0.7-1.2s; reset visuals every 3-4s.',
    'Large readable text; keep in safe zones.',
    'Align at least one text hit to the beat.'
  ]) children.push(p('- ' + s));

  children.push(p(''));
  children.push(p(''));

  // Evergreen Content Ideas
  children.push(h1('Evergreen Content Ideas'));
  for (const s of [
    'Myth vs Fact in your niche.',
    '3 quick tips that solve a common pain.',
    'Mini demo with before/after.',
    'FAQ bite with on-screen text only.',
    'Case study: problem -> process -> result.',
    'Price vs value breakdown in 20 seconds.',
    'Tool or gear loadout for beginners.',
    'Origin story: why you started.',
    'Challenge viewers to try one small action.',
    'Testimonial highlight with overlay text.'
  ]) children.push(p('- ' + s));

  children.push(p(''));
  children.push(p(''));

  // Appendix A - Trending Sounds (Detailed)
  children.push(h1('Appendix A - How to Find Trending Sounds (Detailed)'));
  children.push(h2('TikTok'));
  for (const s of [
    'Use TikTok Creative Center: Songs -> Rising; set country and niche.',
    'Open a candidate audio; check top recent videos for pacing and caption patterns.',
    'Save 10-20 candidates labeled by vibe (high-energy, calm, storytelling).',
    'In-app search: niche keyword + sound; prefer steady week-over-week growth.',
    'Rule of fit: if the first 2s do not support your visual hook, skip it.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('Instagram Reels'));
  for (const s of [
    'Professional Dashboard -> Audio; pick 10k-150k uses trending upward.',
    'Tap audio name -> Save Audio; preview against your 0-2s hook.',
    'From a strong Reel, tap audio to inspect formats that win in your niche.',
    'Update your saved audio list weekly; remove tracks that cooled off.'
  ]) children.push(p('- ' + s));
  children.push(p(''));
  children.push(h2('YouTube Shorts'));
  for (const s of [
    'Use mobile Sounds picker -> Trending tab; confirm beats align with your step hits.',
    'Avoid overused tracks that drown narration; favor percussive cues for text hits.',
    'Check top Shorts using the sound in the last 7 days for format alignment.'
  ]) children.push(p('- ' + s));

  // Appendix B - Talking-Head Content Guide
  children.push(h1('Appendix B - Talking-Head Content Guide'));
  children.push(p('Talking-head videos build trust with local audiences. Use this simple pattern for 5-8 seconds on-camera without memorizing a script:'));
  for (const s of [
    'Hook: short question, pain point, or result tied to todays video idea.',
    'Proof: one tangible detail you actually use (tool, method, measurement).',
    'CTA: one action only (comment a keyword, save, DM for estimate).',
    'Keep it under 8s. Speak naturally. If you hate on-camera, put the same words as on-screen text.'
  ]) children.push(p('- ' + s));
  children.push(p(''));

  // Appendix C - Evergreen Post Ideas
  children.push(h1('Appendix C - Evergreen Post Ideas'));
  for (const s of [
    'Before/After reveal',
    '3 quick tips that solve a common pain',
    'Time-lapse of process with overlays',
    'FAQ bite with on-screen text only',
    'Customer mini case study: problem -> process -> result',
    'Tool or gear loadout',
    'Myth vs fact in your niche',
    'Origin story: why you started'
  ]) children.push(p('- ' + s));
  children.push(p(''));

  // Appendix D - Recycling & Repurposing
  children.push(h1('Appendix D - Recycling & Repurposing'));
  for (const s of [
    'Trim best clips into a 30s roundup',
    'Turn winning hooks into carousels (6-8 frames)',
    'Reply-on-video to 5 audience comments',
    'Repost top 3 videos at new times with new cover frames',
    'Compile a month-in-review montage',
    'Archive good shots to a B-roll folder'
  ]) children.push(p('- ' + s));
  children.push(p(''));

  // Appendix E - Quick Hashtag Guide
  children.push(h1('Appendix E - Quick Hashtag Guide'));
  for (const s of [
    'Blend 2-3 niche tags (e.g., #drivewaycleaning)',
    'Add 1-2 location tags (e.g., #wilmingtonnc)',
    'Use 1 broad tag max (e.g., #homeimprovement)',
    'Keep lowercase; 4-6 total; avoid spammy blocks'
  ]) children.push(p('- ' + s));
  children.push(p(''));

  // Appendix F - Editing Cheat Sheet
  children.push(h1('Appendix F - Editing Cheat Sheet'));
  for (const s of [
    'Cut every 0.7-1.2s; reset visuals every 3-4s',
    'Large readable text; keep in safe zones',
    'Natural light; face a window; avoid harsh backlight',
    'Clean audio; add one beat-synced text hit',
    'Stabilize handheld shots; avoid digital zoom'
  ]) children.push(p('- ' + s));
  children.push(p(''));

  const cSign = String.fromCharCode(0x00A9);
  const footerText = cSign + ' 2025 Fifth Element Labs - Practical AI at the right price';
  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [ new Paragraph({ text: footerText, alignment: AlignmentType.CENTER }) ]
          })
        },
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}

/* ============================= HTTP Handler ============================= */

function comfortIsNoTalkingHead(v: any): boolean {
  const s = String(v || '').toLowerCase().trim();
  return s === 'no_talking_head' || s === 'no-talking-head' || s === 'no talking head';
}

function violatesComfort(stepText: string, comfort: string): boolean {
  if (!comfortIsNoTalkingHead(comfort)) return false;
  if (!stepText) return false;
  const banned = /(face (the )?camera|look(?:ing)? at (?:the )?camera|selfie|address(?: the)? viewer|talk to camera|smile (?:at|to) camera|\b(?:say|speak|tell|ask)\b)/i;
  return banned.test(stepText);
}

function rewriteForNoTalkingHead(stepText: string): string {
  if (!stepText) return stepText;
  let t = stepText;
  t = t.replace(/face (the )?camera|look(?:ing)? at (?:the )?camera|selfie|address(?: the)? viewer|talk to camera|smile (?:at|to) camera/gi,
                'frame hands-only or POV; do not show your face or look into the lens');
  t = t.replace(/\b(?:say|speak|tell|ask)\b/gi,
                'convey with on-screen text or demonstrate silently');
  return t;
}

function sanitizeFilmingSteps(day: DayItem, comfort: string): DayItem {
  if (!day) return day;
  if (!Array.isArray(day.filming_directions)) return day;
  const steps = day.filming_directions.map(function (s: any) {
    const step = s || {};
    const instr = String(step.instruction || '');
    if (comfortIsNoTalkingHead(comfort)) {
      step.instruction = rewriteForNoTalkingHead(instr);
    }
    return step;
  });
  day.filming_directions = steps;
  return day;
}

function buildComfortNote(data: Inputs): string {
  const comfort = String((data as any).video_comfort || '').toLowerCase().trim();

  if (comfortIsNoTalkingHead(comfort)) {
    return [
      'COMFORT MODE: NO_TALKING_HEAD.',
      'Hard rules:',
      '- Do NOT show the creator\'s face or body facing the camera.',
      '- Use hands-only close-ups, POV, over-the-shoulder, or product-only shots.',
      '- Replace any say/speak/tell/ask or look at camera/selfie/address viewers with silent demonstration or on-screen text.',
      'Filming directions must respect these rules.'
    ].join('\\n');
  }

  if (comfort === 'talking_head') {
    return [
      'COMFORT MODE: TALKING_HEAD.',
      'Include 1â€“2 short Say: style lines and at least one head-and-shoulders framing note.'
    ].join('\\n');
  }

  return [
    'COMFORT MODE: MIXED.',
    'Use a blend of hands-only/POV and occasional to-camera lines.'
  ].join('\\n');
}

function isLowQualityDay(d: DayItem, index1: number, comfort?: string): boolean {
  if (!d) return true;
  const hook = String(d.hook || '').trim();
  const caption = String(d.caption || '').trim();
  const idea = String(d.video_idea || '').trim();
  const steps = Array.isArray(d.filming_directions) ? d.filming_directions : [];

  const genericHook = /^Hook\\s+\\d+$/i.test(hook) || hook.length < 6;
  const genericCaption = /^Caption\\s+\\d+$/i.test(caption) || caption.length < 6;
  const genericIdea = /^(Idea\\s+\\d+|)$/.test(idea);
  const tooFewSteps = steps.length < 5;
  const genericStep = steps.length > 0 && steps.every(function(s: any){
    var ins = String(s && s.instruction || '').toLowerCase();
    return ins.indexOf('stand back') >= 0 || ins.indexOf('step 1') >= 0;
  });

  let comfortViolation = false;
  if (comfortIsNoTalkingHead(comfort)) {
    for (let i = 0; i < steps.length; i++) {
      const ins = String(steps[i]?.instruction || '');
      if (violatesComfort(ins, 'no_talking_head')) { comfortViolation = true; break; }
    }
  }

  return genericHook || genericCaption || genericIdea || tooFewSteps || genericStep || comfortViolation;
}

async function generateBatch(client: OpenAI, data: Inputs, startIndex: number, count: number): Promise<Plan> {
  const base = buildPrompt(data);
  const comfortNote = buildComfortNote(data);
  const startDay = startIndex + 1;
  const endDay = startIndex + count;
  const rangeNote = [
    'BATCH RANGE: Generate days ' + String(startDay) + ' through ' + String(endDay) + ' inclusive.',
    'Return a single JSON object with a top-level "days" array containing exactly ' + String(count) + ' items.',
    'Each item must correspond to one day in this range, in order.',
    'Do not include any commentary or extra text.'
  ].join('\\n');

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a precise JSON generator. Output beginner filming_directions (5-7 steps), not storyboard. Plain English steps, occasional quick checks, safety cues only if obvious. JSON only.' },
      { role: 'user', content: base + '\\n' + comfortNote + '\\n' + rangeNote }
    ],
    temperature: 0.55
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let plan: Plan = { days: [] };
  try { plan = coercePlan(JSON.parse(raw)); } catch { plan = { days: [] }; }
  plan.days = Array.isArray(plan.days) ? plan.days.slice(0, count) : [];
  return plan;
}

async function regenerateOneDay(client: OpenAI, data: Inputs, dayNumber: number): Promise<DayItem | null> {
  const base = buildPrompt(data);
  const comfortNote = buildComfortNote(data);
  const hardNote = [
    'SINGLE DAY REQUEST: Generate exactly 1 item for Day ' + String(dayNumber) + '.',
    'Return JSON with top-level "days": [ { ...exactly one item... } ].',
    'Filming directions: 5-7 steps, plain English, precise and beginner-friendly.',
    'Timing ascends; hook visible by 0-2s; total fits the platform range.',
    'No boilerplate like "Hook ' + String(dayNumber) + '" or "Caption ' + String(dayNumber) + '".',
    'No generic steps like "Stand back / Step 1". Make it niche-aware and specific.'
  ].join('\\n');

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a precise JSON generator. Output beginner filming_directions (5-7 steps). JSON only. No filler.' },
      { role: 'user', content: base + '\\n' + comfortNote + '\\n' + hardNote }
    ],
    temperature: 0.5
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let plan: Plan = { days: [] };
  try { plan = coercePlan(JSON.parse(raw)); } catch { plan = { days: [] }; }
  const d = Array.isArray(plan.days) && plan.days[0] ? plan.days[0] : null;
  if (!d) return null;

  return d;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(function(){ return {}; });
    const data: Inputs = body || {};
    const comfort = String((data as any).video_comfort || '').toLowerCase().trim();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 3 x 10 batches to avoid tail truncation
    const batch1 = await generateBatch(client, data, 0, 10);
    const batch2 = await generateBatch(client, data, 10, 10);
    const batch3 = await generateBatch(client, data, 20, 10);

    // Stitch
// types must exist somewhere above:
// type DayItem = { /* fields */ };
// type Plan = { days: DayItem[] };

let stitched: Plan = { days: [] as DayItem[] };

const d1: DayItem[] = batch1?.days ?? [];
const d2: DayItem[] = batch2?.days ?? [];
const d3: DayItem[] = batch3?.days ?? [];

stitched.days = [...d1, ...d2, ...d3];


    // Sanitize for comfort mode (e.g., remove any face-to-camera language)
    stitched.days = (stitched.days || []).map(function(d){ return sanitizeFilmingSteps(d, comfort); });

    // Pad/truncate to exactly 30
    stitched = ensureExactly30(stitched);

    // Targeted regeneration for any low-quality days (comfort-aware; focus on 21â€“30 first)
    for (let i = 20; i < 30; i++) {
      const dayNumber = i + 1;
      let d = stitched.days[i];
      if (isLowQualityDay(d, dayNumber, comfort)) {
        for (let attempt = 0; attempt < 2; attempt++) {
          const fresh = await regenerateOneDay(client, data, dayNumber);
          if (fresh) {
            const clean = sanitizeFilmingSteps(fresh, comfort);
            if (!isLowQualityDay(clean, dayNumber, comfort)) {
              stitched.days[i] = clean;
              break;
            }
          }
        }
      }
    }

    // Final safety
    stitched = ensureExactly30(stitched);

    const buf = await buildDocx(stitched, data);
// buf is a Node Buffer (e.g., from docx Packer)
const fileName = 'QuickPostKit_' + String(Date.now()) + '.docx';

// Convert Node Buffer -> ArrayBuffer (correctly slicing the view)
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

return new Response(arrayBuffer, {
  status: 200,
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store',
  },
});

  } catch (err: any) {
    const msg = err && err.message ? String(err.message) : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}