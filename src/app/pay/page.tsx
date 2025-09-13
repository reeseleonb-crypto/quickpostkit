"use client";
import { useState } from "react";

export default function PayPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout() {
    try {
      setLoading(true); setErr(null);
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "checkout_failed");
      window.location.href = data.url;
    } catch (e:any) { setErr(e?.message ?? "unknown_error"); setLoading(false); }
  }

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <button onClick={startCheckout} disabled={loading}
        className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition disabled:opacity-50">
        {loading ? "Redirecting…" : "Pay $5"}
      </button>
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </main>
  );
}
