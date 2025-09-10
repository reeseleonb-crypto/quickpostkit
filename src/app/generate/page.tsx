"use client";
import { Suspense } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type JobStatus = "working" | "ready" | "failed";

function QPKPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [form, setForm] = useState({
    niche: "",
    audience: "",
    product_or_service: "",
    primary_platform: "instagram_reels",
    tone: "friendly",
    monthly_goal: "awareness",
    video_comfort: "mixed",
    content_balance: 50,
    hashtag_style: "mix",
    special_instructions: "",
  });
  const U = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>("working");
  const startedRef = useRef(false);

  // When session_id exists, start the job once (idempotent on server)
  useEffect(() => {
    if (!sessionId || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/generate?session_id=${encodeURIComponent(sessionId)}`, { method: "POST" });
        if (!res.ok) throw new Error("failed_to_start");
        const data = await res.json();
        setJobId(data.id || data.job_id);
        setStatus(data.status as JobStatus);
      } catch (e) {
        setStatus("failed");
        console.error("generate_start_error", e);
      }
    })();
  }, [sessionId]);

  // Poll /api/jobs/:id with exponential backoff
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const delays = [1000, 2000, 4000, 8000, 12000, 15000]; // backoff

    (async () => {
      for (const d of delays) {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
          if (cancelled) return;
          if (r.ok) {
            const j = await r.json();
            setStatus(j.status as JobStatus);
            if (j.status === "ready") {
              if (j.filename) {
                // Will work once /api/download is implemented.
                window.location.href = `/api/download/${encodeURIComponent(j.filename)}`;
              }
              return;
            }
            if (j.status === "failed") return;
          }
        } catch (e) {
          console.error("jobs_poll_error", e);
        }
        await new Promise((res) => setTimeout(res, d));
      }
    })();

    return () => { cancelled = true; };
  }, [jobId]);

  const showOverlay = Boolean(sessionId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Generate Your Kit</h1>
      <p className="mt-2 text-slate-600">Fill the 10 inputs, then checkout via Stripe.</p>

      <form className="mt-6 grid gap-4">
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="niche" value={form.niche} onChange={(e) => U("niche", e.target.value)} />
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="audience" value={form.audience} onChange={(e) => U("audience", e.target.value)} />
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="product_or_service" value={form.product_or_service} onChange={(e) => U("product_or_service", e.target.value)} />
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.primary_platform} onChange={(e) => U("primary_platform", e.target.value)}>
          <option value="instagram_reels">instagram_reels</option>
          <option value="tiktok">tiktok</option>
          <option value="youtube_shorts">youtube_shorts</option>
          <option value="linkedin">linkedin</option>
          <option value="facebook">facebook</option>
        </select>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.tone} onChange={(e) => U("tone", e.target.value)}>
          <option>friendly</option><option>bold</option><option>witty</option><option>minimalist</option>
        </select>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.monthly_goal} onChange={(e) => U("monthly_goal", e.target.value)}>
          <option>awareness</option><option>engagement</option><option>authority</option><option>sales</option>
        </select>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.video_comfort} onChange={(e) => U("video_comfort", e.target.value)}>
          <option>talking_head</option><option>no_talking_head</option><option>mixed</option>
        </select>
        <div>
          <label className="mb-1 block text-sm text-slate-600">content_balance (0–100)</label>
          <input type="range" min={0} max={100} value={form.content_balance} onChange={(e) => U("content_balance", Number(e.target.value))} className="w-full" />
          <div className="mt-1 text-sm text-slate-600">{form.content_balance}</div>
        </div>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.hashtag_style} onChange={(e) => U("hashtag_style", e.target.value)}>
          <option>broad</option><option>niche</option><option>mix</option>
        </select>
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="special_instructions (≤200 chars)" maxLength={200} value={form.special_instructions} onChange={(e) => U("special_instructions", e.target.value)} />
        <button
          type="button"
          onClick={async () => {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            if (!res.ok) { alert("Checkout failed. Try again."); return; }
            const data = await res.json();
            if (data?.url) window.location.href = data.url;
            else alert("Missing redirect URL.");
          }}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-sm hover:bg-indigo-700"
        >
          Checkout — $5
        </button>
      </form>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              {status === "failed" ? "We hit a snag." : "Assembling your kit…"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              {status === "failed"
                ? "Try again or contact support."
                : "Please keep this tab open. Your download will start automatically."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PageSuspenseWrapper() {
  return (
    <Suspense fallback={null}>
      <QPKPage />
    </Suspense>
  );
}