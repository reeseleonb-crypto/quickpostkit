"use client";

import * as React from "react";

type FormState = {
  niche: string;
  audience: string;
  product_or_service: string;
  primary_platform: "tiktok" | "instagram" | "youtube" | "linkedin" | "";
  tone: string;
  video_comfort: "no_talking_head" | "talking_head" | "mixed" | "";
  monthly_goal: string;
  content_balance: number; // UI: 0 educational  100 entertaining (we invert before POST)
  hashtag_style: string;
  special_instructions: string;
  location: string;
};

export default function GenerateForm() {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [f, setF] = React.useState<FormState>({
    niche: "",
    audience: "",
    product_or_service: "",
    primary_platform: "",
    tone: "",
    video_comfort: "",
    monthly_goal: "",
    content_balance: 50,
    hashtag_style: "",
    special_instructions: "",
    location: ""
  });

  function up<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const percentEducational = 100 - Number(f.content_balance || 0);

      const payload = {
        niche: f.niche,
        audience: f.audience,
        product_or_service: f.product_or_service,
        primary_platform: f.primary_platform,
        tone: f.tone,
        video_comfort: f.video_comfort,
        monthly_goal: f.monthly_goal,
        content_balance: percentEducational,
        hashtag_style: f.hashtag_style,
        special_instructions: f.special_instructions,
        location: f.location
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || ("HTTP " + res.status));
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "QuickPostKit_" + Date.now() + ".docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500";
  const labelCls = "text-sm font-medium text-slate-800";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Generate Your 30-Day Social Content Kit</h1>
      <p className="text-slate-600 mt-2 mb-8">
        Fill in the details below. When you click <span className="font-semibold">Generate</span>, your DOCX will download automatically.
      </p>

      <form onSubmit={onSubmit} className="grid gap-6">
        {/* 2-column on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label className={labelCls}>Niche</label>
            <input className={inputCls} value={f.niche} onChange={(e) => up("niche", e.target.value)} placeholder="e.g., power washing" />
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Audience</label>
            <input className={inputCls} value={f.audience} onChange={(e) => up("audience", e.target.value)} placeholder="e.g., homeowners" />
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Product or Service</label>
            <input className={inputCls} value={f.product_or_service} onChange={(e) => up("product_or_service", e.target.value)} placeholder="e.g., driveway cleaning" />
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Primary Platform</label>
            <select className={inputCls} value={f.primary_platform} onChange={(e) => up("primary_platform", e.target.value as any)}>
              <option value="">(select)</option>
              <option value="tiktok">tiktok</option>
              <option value="instagram">instagram</option>
              <option value="youtube">youtube</option>
              <option value="linkedin">linkedin</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Tone</label>
            <input className={inputCls} value={f.tone} onChange={(e) => up("tone", e.target.value)} placeholder="e.g., witty, direct, professional" />
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Video Comfort</label>
            <select className={inputCls} value={f.video_comfort} onChange={(e) => up("video_comfort", e.target.value as any)}>
              <option value="">(select)</option>
              <option value="no_talking_head">no_talking_head</option>
              <option value="talking_head">talking_head</option>
              <option value="mixed">mixed</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Monthly Goal</label>
            <input className={inputCls} value={f.monthly_goal} onChange={(e) => up("monthly_goal", e.target.value)} placeholder="e.g., bookings, sales, email_signups" />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className={labelCls}>Content Balance</label>
            <input type="range" min={0} max={100} step={1} value={f.content_balance} onChange={(e) => up("content_balance", Number(e.target.value))} className="w-full" />
            <div className="text-xs text-slate-600">
              {f.content_balance}% entertaining / {100 - f.content_balance}% educational
              <span className="opacity-70"> (backend receives % educational)</span>
            </div>
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Hashtag Style</label>
            <input className={inputCls} value={f.hashtag_style} onChange={(e) => up("hashtag_style", e.target.value)} placeholder="e.g., niche or broad" />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className={labelCls}>Special Instructions</label>
            <textarea className={inputCls} rows={3} value={f.special_instructions} onChange={(e) => up("special_instructions", e.target.value)} placeholder="Anything we should avoid or emphasize" />
          </div>

          <div className="grid gap-2">
            <label className={labelCls}>Location</label>
            <input className={inputCls} value={f.location} onChange={(e) => up("location", e.target.value)} placeholder="e.g., Wilmington, NC" />
          </div>
        </div>

        {err && <div className="text-sm text-red-700">{err}</div>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-black px-5 py-2.5 font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}