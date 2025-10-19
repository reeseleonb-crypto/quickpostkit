"use client";

export default function ClientShell() {
  return (
    <main style={{minHeight: "60vh", display: "grid", placeItems: "center"}}>
      <div style={{padding: 16, border: "1px solid #888", borderRadius: 8}}>
        <h1>✅ ClientShell is rendering</h1>
        <p>If you can see this, routing is fine. Then we’ll add your real UI back in small chunks.</p>
      </div>
    </main>
  );
}
