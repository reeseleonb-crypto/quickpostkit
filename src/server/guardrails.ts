import { z } from "zod";

/** QPK input schema — strict, trimmed, and bounded */
export const qpkInputSchema = z.object({
  niche: z.string().trim().min(1).max(120),
  audience: z.string().trim().min(1).max(200),
  product_or_service: z.string().trim().min(1).max(160),
  primary_platform: z.enum(["tiktok","instagram","youtube","linkedin"]).or(z.string().trim().max(20)), // keep flexible if you support more
  tone: z.string().trim().max(40),
  monthly_goal: z.string().trim().max(160),
  video_comfort: z.enum(["camera-shy","on-camera","voiceover-ok","no-talking"]).or(z.string().trim().max(20)),
  content_balance: z.string().trim().max(40),        // e.g., "60/40 edutainment/sales"
  hashtag_style: z.string().trim().max(40),          // e.g., "niche-low"
  special_instructions: z.string().trim().max(1000).optional().default("")
}).strict();

/**
 * Patch global fetch with timeout+retry for api.openai.com.
 * - Retries on 429, 500-599 and network errors.
 * - Exponential backoff with jitter.
 * - 60s absolute timeout per attempt.
 * Works with the OpenAI SDK (which uses fetch under the hood).
 */
export function withOpenAIRetryFetch(options?: {
  attempts?: number;            // total tries (default 3)
  baseDelayMs?: number;         // initial backoff (default 400ms)
  maxDelayMs?: number;          // cap backoff (default 5000ms)
  timeoutMs?: number;           // per-attempt timeout (default 60000ms)
}) {
  const ATTEMPTS   = Number(process.env.QPK_OPENAI_ATTEMPTS ?? (options?.attempts   ?? 2));const BASE_DELAY = options?.baseDelayMs?? 400;
  const MAX_DELAY  = options?.maxDelayMs ?? 5000;
  const TIMEOUT    = Number(process.env.QPK_OPENAI_TIMEOUT_MS ?? (options?.timeoutMs  ?? 45_000));if ((globalThis as any).__qpk_fetch_patched__) return;
  const orig = globalThis.fetch?.bind(globalThis);
  if (!orig) return;
  const isOpenAI = (u: any) => {
    try {
      const url = typeof u === "string" ? new URL(u) : new URL(u.url ?? u.toString());
      return /(^|\.)api\.openai\.com$/i.test(url.hostname);
    } catch { return false; }
  };

  async function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  (globalThis as any).fetch = (async (input: any, init?: RequestInit) => {
    const targetIsOpenAI = isOpenAI(input);
    let lastErr: any;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), TIMEOUT);
      try {
        const res = await orig(input, { ...init, signal: init?.signal ?? ctl.signal });
        if (!targetIsOpenAI) {
          clearTimeout(t);
          return res;
        }
        // Retry on 429 and 5xx for OpenAI
        if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
          lastErr = new Error(`OpenAI HTTP ${res.status}`);
          if (attempt < ATTEMPTS) {
            const backoff = Math.min(MAX_DELAY, BASE_DELAY * 2 ** (attempt - 1));
            const jitter = Math.random() * 150;
            await sleep(backoff + jitter);
            clearTimeout(t);
            continue;
          }
        }
        clearTimeout(t);
        return res;
      } catch (e) {
        lastErr = e;
        // Retry network/abort errors for OpenAI only
        if (!targetIsOpenAI || attempt >= ATTEMPTS) {
          throw e;
        }
        const backoff = Math.min(MAX_DELAY, BASE_DELAY * 2 ** (attempt - 1));
        const jitter = Math.random() * 150;
        await sleep(backoff + jitter);
      } finally {
        clearTimeout(t);
      }
    }
    throw lastErr ?? new Error("OpenAI request failed after retries");
  }) as typeof fetch;

  (globalThis as any).__qpk_fetch_patched__ = true;
}