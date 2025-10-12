"use client";

import { useState } from "react";
import { saveQpkForm } from "@/lib/qpkFormPersist";

type FormValues = {
  schema_version: number;
  niche: string;
  audience: string;
  product_or_service: string;
  primary_platform: "tiktok" | "instagram" | "youtube" | "facebook" | "linkedin" | "";
  tone: string; // friendly|bold|witty|minimalist or freeform
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

      // Minimal required fields
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

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create your 30-day content pack</h1>

      <section className="grid gap-3">
        <input name="niche" placeholder="Niche (e.g., home services)" className="px-3 py-2 rounded bg-white/10" value={v.niche} onChange={onChange} />
        <input name="audience" placeholder="Audience (e.g., local homeowners)" className="px-3 py-2 rounded bg-white/10" value={v.audience} onChange={onChange} />
        <input name="product_or_service" placeholder="Product or service (e.g., gutter cleaning packages)" className="px-3 py-2 rounded bg-white/10" value={v.product_or_service} onChange={onChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select name="primary_platform" className="px-3 py-2 rounded bg-white/10" value={v.primary_platform} onChange={onSelect}>
            <option value="">Primary platform…</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          <select name="video_comfort" className="px-3 py-2 rounded bg-white/10" value={v.video_comfort} onChange={onSelect}>
            <option value="">Video comfort…</option>
            <option value="talking_head">Talking head</option>
            <option value="no_talking_head">No talking head</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select name="tone" className="px-3 py-2 rounded bg-white/10" value={v.tone} onChange={onSelect}>
            <option value="">Tone…</option>
            <option value="friendly">Friendly</option>
            <option value="bold">Bold</option>
            <option value="witty">Witty</option>
            <option value="minimalist">Minimalist</option>
          </select>

          <select name="monthly_goal" className="px-3 py-2 rounded bg-white/10" value={v.monthly_goal} onChange={onSelect}>
            <option value="">Monthly goal…</option>
            <option value="awareness">Awareness</option>
            <option value="engagement">Engagement</option>
            <option value="authority">Authority</option>
            <option value="sales">Sales</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <label className="text-sm opacity-80">
            Content balance (0 = educational, 100 = entertaining): {v.content_balance}
          </label>
          <input type="range" name="content_balance" min="0" max="100" value={v.content_balance} onChange={onRange} />
        </div>

        <select name="hashtag_style" className="px-3 py-2 rounded bg-white/10" value={v.hashtag_style} onChange={onSelect}>
          <option value="">Hashtag style…</option>
          <option value="broad">Broad</option>
          <option value="niche">Niche</option>
          <option value="mix">Mix</option>
        </select>

        <textarea name="special_instructions" placeholder="Special instructions (e.g., no talking heads, before/after preferred, brand rules…)" className="px-3 py-2 rounded bg-white/10 min-h-[100px]" value={v.special_instructions} onChange={onChange} />
      </section>

      <div className="space-y-2">
        <button onClick={startCheckout} disabled={loading} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition disabled:opacity-50">
          {loading ? "Redirecting…" : "Pay $5"}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </main>
  );
}
