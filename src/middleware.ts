import { NextResponse, type NextRequest } from "next/server";

/**
 * Minimal security + rate limit middleware for QPK
 * - Limits /api/generate and /api/docx to N req per 60s per IP (default N=5)
 * - Adds conservative security headers (CSP, X-Frame-Options, etc.)
 *
 * Notes:
 * - This is an in-memory token bucket per runtime instance.
 * - In serverless/edge, instances may not share state. This is still a good
 *   basic guardrail and thwarts bursts; for iron-clad limits use a KV/Redis.
 */

// ------- Config (tweak safely) -------
const WINDOW_MS = 60_000;                         // 60s window
const MAX_REQS  = Number(process.env.QPK_RL_MAX ?? 5); // default 5/min
const MATCH = ["/api/generate", "/api/docx"];     // endpoints to guard

// Basic, self-contained per-IP buckets in memory
// (acceptable as a "bare-minimum" guardrail)
type Bucket = { times: number[] };
const buckets = new Map<string, Bucket>();

function keyFor(req: NextRequest) {
  // Derive client IP from common proxy headers; NextRequest has no .ip in Next 15
  const xReal = req.headers.get("x-real-ip");
  const xFwd  = req.headers.get("x-forwarded-for");
  const cf    = req.headers.get("cf-connecting-ip");

  const ip =
    xReal ??
    (xFwd ? xFwd.split(",")[0].trim() : undefined) ??
    cf ??
    "unknown";

  return `ip:${ip}`;
}


function rateLimitOk(req: NextRequest) {
  const now = Date.now();
  const k = keyFor(req);
  const b = buckets.get(k) ?? { times: [] };
  // prune old timestamps
  b.times = b.times.filter(t => now - t < WINDOW_MS);
  if (b.times.length >= MAX_REQS) {
    buckets.set(k, b);
    return false;
  }
  b.times.push(now);
  buckets.set(k, b);
  return true;
}

function addSecurityHeaders(res: NextResponse) {
  // Conservative CSP that still allows Next.js and external APIs/images
  // Adjust if you load third-party scripts.
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https:",
    "font-src 'self' data: https:",
    "object-src 'none'",
    "media-src 'self' https:",
    "upgrade-insecure-requests"
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Only guard listed API routes
  if (MATCH.some(m => url.startsWith(m))) {
    if (!rateLimitOk(req)) {
      const res = NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429 }
      );
      return addSecurityHeaders(res);
    }
  }

  // Pass through (and add headers) for everything else
  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

// Limit middleware to specific routes (faster & safer)
export const config = {
  matcher: ["/api/generate", "/api/docx"],
};