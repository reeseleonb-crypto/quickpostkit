"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";

function fetchAsDocx(url: string, init?: RequestInit) {
  return fetch(url, init).then(async (res) => {
    if (!res.ok) throw new Error(`${url} failed`);
    return res.blob();
  });
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PostCheckoutRunner() {
  const sp = useSearchParams();

  // Hooks declared unconditionally (same order every render)
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"idle"|"verifying"|"generating"|"downloading"|"done"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Mark mounted after first client render
  useEffect(() => { setMounted(true); }, []);

  const sessionId = sp.get("session_id") || null;
  const active = mounted && !!sessionId;

  // Only read localStorage after mount to avoid SSR mismatch
  const inputSchema = useMemo(() => {
    if (!mounted) return null;
    try {
      const raw = localStorage.getItem("qpk_form");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [mounted]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (!active) return;
        if (!inputSchema) throw new Error("Missing form data. Please fill the form and checkout again.");

        setStatus("verifying");
        const vr = await fetch(`/api/verify?session_id=${encodeURIComponent(sessionId!)}`, { cache: "no-store" });
        const vj = await vr.json();
        if (!vr.ok || !vj?.paid) throw new Error("Payment not verified.");
        console.log("[verify OK]");

        setStatus("generating");
        const blob = await fetchAsDocx("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputSchema),
        });
        console.log("[generate OK]");

        setStatus("downloading");
        triggerDownload(blob, "QuickPostKit.docx");
        console.log("[download OK]");

        if (!cancelled) setStatus("done");
      } catch (e: any) {
        console.log("[runner ERROR]", e?.message);
        if (!cancelled) {
          setError(e?.message ?? "unknown_error");
          setStatus("error");
        }
      }
    }

    if (status === "idle") run();
    return () => { cancelled = true; };
  }, [active, inputSchema, sessionId, status]);

  // Render overlay only when returning from Stripe (active)
  if (!active) return null;

  const overlay =
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, color: "white", padding: "24px", textAlign: "center"
    }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Preparing your content pack…
        </h2>
        <p style={{ opacity: 0.85, marginBottom: 12 }}>Status: {status}</p>
        {status === "error" && (
          <>
            <p style={{ color: "#fca5a5", marginBottom: 12 }}>Error: {error}</p>
            <a href="/generate" style={{ textDecoration: "underline" }}>Go back to the form</a>
          </>
        )}
      </div>
    </div>;

  return typeof document !== "undefined" ? createPortal(overlay, document.body) : null;
}
