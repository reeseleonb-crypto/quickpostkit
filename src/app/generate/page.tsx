"use client";

import { useState } from "react";
import { saveQpkForm } from "@/lib/qpkFormPersist";
import { Suspense } from "react";

type FormValues = {
  schema_version: number;
  niche: string;
  audience: string;
  product_or_service: string;
  location: string; // UI-only addition requested earlier
  primary_platform: "tiktok" | "instagram" | "youtube" | "facebook" | "linkedin" | "";
  tone: string; // friendly|bold|witty|minimalist|professional or freeform
  monthly_goal: string; // awareness|engagement|authority|sales or freeform
  video_comfort: "talking_head" | "no_talking_head" | "mixed" | "";
  content_balance: number; // 0-100
  hashtag_style: "broad" | "niche" | "mix" | "";
  special_instructions: string;
};

export default function GenerateFormPage() {
  const [v, setV] = useState<FormValues>({
    schema_version: 1,
    niche: "",
    audience: "",
    product_or_service: "",
    location: "",
    primary_platform: "",
    tone: "",
    monthly_goal: "",
    video_comfort: "",
    content_balance: 50,
    hashtag_style: "",
    special_instructions: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setV((p) => ({ ...p, [name]: value }));
  }
  function onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target;
    setV((p) => ({ ...p, [name]: value as any }));
  }
  function onRange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const num = Number(value);
    setV((p) => ({ ...p, [name]: Number.isFinite(num) ? num : p.content_balance }));
  }

  async function startCheckout() {
    try {
      setErr(null);

      // Minimal required fields (unchanged)
      if (!v.niche || !v.audience) {
        setErr("Please fill at least Niche and Audience.");
        return;
      }

      setLoading(true);
      saveQpkForm(v);

      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "checkout_failed");
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message ?? "unknown_error");
      setLoading(false);
    }
  }
import { Suspense } from "react";

return (
  <Suspense fallback={null}>
    <main className="min-h-screen bg-[radial-gradient(1000px_500px_at_80%_-10%,#1a1d2b_0%,#0b0b12_45%)] text-slate-100">
      {/* Top bar (visual only) */}
      <header className="border-b border-white/5 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-fuchsia-300">Quick</span>
            <span className="ml-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200">PostKit</span>
          </a>
          <nav className="hidden md:flex gap-6 text-sm text-slate-300">
            <a href="/#who" className="hover:text-white">Who it’s for</a>
            <a href="/#how" className="hover:text-white">How it works</a>
            <a href="/sample" className="hover:text-white">Sample</a>
            <a href="/#faq" className="hover:text-white">FAQ</a>
          </nav>
        </div>
      </header>

      {/* ...rest of your page content stays here... */}
    </main>
  </Suspense>
);

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">Generate Your 30-Day Social Content Kit</h1>
        <p className="mt-2 text-slate-300 max-w-3xl">
          Fill in the details below. When you click Generate, your DOCX will download automatically.
        </p>

        {/* Stepper (visual) */}
        <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { n: 1, t: "Inputs" },
            { n: 2, t: "Pay $5" },
            { n: 3, t: "Download" },
          ].map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">{s.n}</div>
              <span className="text-slate-200">{s.t}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Niche</label>
              <input
                name="niche"
                placeholder="e.g., wedding photography, lawn services, real estate agents"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60"
                value={v.niche}
                onChange={onChange}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Audience</label>
              <input
                name="audience"
                placeholder="e.g., brides-to-be, homeowners, local buyers"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60"
                value={v.audience}
                onChange={onChange}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Product or Service</label>
              <input
                name="product_or_service"
                placeholder="e.g., photo packages, weekly mowing, open house tours"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                value={v.product_or_service}
                onChange={onChange}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Location</label>
              <input
                name="location"
                placeholder="e.g., Charlotte, NC"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                value={v.location}
                onChange={onChange}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Special instructions</label>
              <textarea
                name="special_instructions"
                rows={6}
                placeholder="e.g., emphasize eco-friendly, highlight seasonal offers, avoid pricing mentions"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60 min-h-[100px]"
                value={v.special_instructions}
                onChange={onChange}
              />
              <p className="mt-2 text-xs text-slate-400">Add anything we should know. We’ll reflect this in hooks, filming and captions.</p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Primary platform</label>
              <select
                name="primary_platform"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/60"
                value={v.primary_platform}
                onChange={onSelect}
              >
                <option value="">Choose…</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Video style</label>
              <select
                name="video_comfort"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/60"
                value={v.video_comfort}
                onChange={onSelect}
              >
                <option value="">Choose…</option>
                <option value="talking_head">Talking heads</option>
                <option value="no_talking_head">No talking heads</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Tone</label>
              <select
                name="tone"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                value={v.tone}
                onChange={onSelect}
              >
                <option value="">Choose…</option>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="bold">Bold</option>
                <option value="witty">Witty</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Monthly goal</label>
              <select
                name="monthly_goal"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                value={v.monthly_goal}
                onChange={onSelect}
              >
                <option value="">Choose…</option>
                <option value="awareness">Awareness</option>
                <option value="engagement">Engagement</option>
                <option value="authority">Authority</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">
                Content balance <span className="text-slate-400">(0 = entertaining, 100 = educational)</span>
              </label>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range"
                  name="content_balance"
                  min="0"
                  max="100"
                  value={v.content_balance}
                  onChange={onRange}
                  className="w-full accent-fuchsia-500 [accent-color:#ff3df0]"
                />
                <span className="text-sm text-slate-300 w-10 text-right">{v.content_balance}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Entertaining</span><span>Balanced</span><span>Educational</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block text-sm font-medium text-slate-200">Hashtag style</label>
              <select
                name="hashtag_style"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/60"
                value={v.hashtag_style}
                onChange={onSelect}
              >
                <option value="">Choose…</option>
                <option value="niche">Local + niche</option>
                <option value="broad">Wide reach</option>
                <option value="mix">Mix</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-orange-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-black shadow-[0_8px_40px_-12px_rgba(255,61,240,.6)] [background-size:200%_100%] hover:[background-position:100%_0] active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Pay $5 & Generate"}
          </button>
          {err && <p className="text-red-400 text-sm">{err}</p>}
        </div>
      </section>

      {/* Overlay: add third line (UI-only) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 text-white space-y-2">
          <p className="text-lg font-semibold">Preparing your content pack...</p>
          <p className="text-sm">Status: generating</p>
          <p className="text-sm text-slate-400">This may take a few minutes, please do not refresh.</p>
        </div>
      )}
    </main>
  );
}
