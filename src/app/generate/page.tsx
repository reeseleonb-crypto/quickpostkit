"use client";

import { useState } from "react";
import { saveQpkForm } from "@/lib/qpkFormPersist";

type FormValues = {
  niche: string;
  audience: string;
  tone: string;
  monthly_goal: string;
  special_instructions: string;
};

export default function GenerateFormPage() {
  const [v, setV] = useState<FormValues>({
    niche: "",
    audience: "",
    tone: "",
    monthly_goal: "",
    special_instructions: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) {
    setV(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function startCheckout() {
    try {
      setErr(null);
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
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create your 30-day content pack</h1>

      <div className="grid gap-3">
        <input name="niche" placeholder="Niche (e.g., home services)" className="px-3 py-2 rounded bg-white/10" value={v.niche} onChange={onChange} />
        <input name="audience" placeholder="Audience (e.g., local homeowners)" className="px-3 py-2 rounded bg-white/10" value={v.audience} onChange={onChange} />
        <input name="tone" placeholder="Tone (e.g., friendly, bold)" className="px-3 py-2 rounded bg-white/10" value={v.tone} onChange={onChange} />
        <input name="monthly_goal" placeholder="Monthly goal (e.g., book 10 jobs)" className="px-3 py-2 rounded bg-white/10" value={v.monthly_goal} onChange={onChange} />
        <textarea name="special_instructions" placeholder="Special instructions (e.g., no talking heads, prefer before/after)" className="px-3 py-2 rounded bg-white/10 min-h-[100px]" value={v.special_instructions} onChange={onChange} />
      </div>

      <div className="space-y-2">
        <button onClick={startCheckout} disabled={loading} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition disabled:opacity-50">
          {loading ? "Redirecting…" : "Pay $5"}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </main>
  );
}
