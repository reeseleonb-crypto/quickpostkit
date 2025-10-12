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
    content_balance: 50, // midpoint default
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
      // Slider Option A: invert for backend (backend expects % educational)
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

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Generate Your 30-Day Social Content Kit
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Fill in the details below. When you click Generate, your DOCX will download automatically.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Niche
          <input
            value={f.niche}
            onChange={(e) => up("niche", e.target.value)}
            placeholder="e.g., power washing"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Audience
          <input
            value={f.audience}
            onChange={(e) => up("audience", e.target.value)}
            placeholder="e.g., homeowners"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Product or Service
          <input
            value={f.product_or_service}
            onChange={(e) => up("product_or_service", e.target.value)}
            placeholder="e.g., driveway cleaning"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Primary Platform
          <select
            value={f.primary_platform}
            onChange={(e) => up("primary_platform", e.target.value as any)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">(select)</option>
            <option value="tiktok">tiktok</option>
            <option value="instagram">instagram</option>
            <option value="youtube">youtube</option>
            <option value="linkedin">linkedin</option>
          </select>
        </label>

        <label>
          Tone
          <input
            value={f.tone}
            onChange={(e) => up("tone", e.target.value)}
            placeholder="e.g., witty, direct, professional"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Video Comfort
          <select
            value={f.video_comfort}
            onChange={(e) => up("video_comfort", e.target.value as any)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">(select)</option>
            <option value="no_talking_head">no_talking_head</option>
            <option value="talking_head">talking_head</option>
            <option value="mixed">mixed</option>
          </select>
        </label>

        <label>
          Monthly Goal
          <input
            value={f.monthly_goal}
            onChange={(e) => up("monthly_goal", e.target.value)}
            placeholder="e.g., bookings, sales, email_signups"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div>
          <label>Content Balance</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={f.content_balance}
            onChange={(e) => up("content_balance", Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {f.content_balance}% entertaining / {100 - f.content_balance}% educational (backend receives % educational)
          </div>
        </div>

        <label>
          Hashtag Style
          <input
            value={f.hashtag_style}
            onChange={(e) => up("hashtag_style", e.target.value)}
            placeholder="e.g., niche or broad"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Special Instructions
          <textarea
            value={f.special_instructions}
            onChange={(e) => up("special_instructions", e.target.value)}
            placeholder="Anything we should avoid or emphasize"
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Location
          <input
            value={f.location}
            onChange={(e) => up("location", e.target.value)}
            placeholder="e.g., Wilmington, NC"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        {err && (
          <div style={{ color: "#b00020", marginTop: 8 }}>
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            border: "1px solid #333",
            background: loading ? "#ddd" : "#f5f5f5",
            cursor: loading ? "default" : "pointer"
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
    </div>
  );
}