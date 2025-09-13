"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadQpkForm } from "@/lib/qpkFormPersist";

async function fetchAsDocx(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} failed`);
  return res.blob();
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

export default function ReadyPage() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");
  const [status, setStatus] = useState<"idle"|"verifying"|"generating"|"downloading"|"done"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!sessionId) throw new Error("Missing session_id. Complete checkout first.");
        const inputSchema = loadQpkForm() as any;
        if (!inputSchema) throw new Error("Missing form data. Please fill the form before checkout.");

        setStatus("verifying");
        const vr = await fetch(`/api/verify?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
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
        console.log("[flow ERROR]", e?.message);
        if (!cancelled) {
          setError(e?.message ?? "unknown_error");
          setStatus("error");
        }
      }
    }

    if (status === "idle") run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Preparing your content pack…</h1>
      <p className="text-sm opacity-80">Status: {status}</p>

      {status === "error" && (
        <>
          <p className="text-red-400">Error: {error}</p>
          {!sessionId && <a className="underline" href="/generate">Go to form</a>}
          {sessionId && <a className="underline" href="/generate">Go back to the form</a>}
        </>
      )}
    </main>
  );
}
