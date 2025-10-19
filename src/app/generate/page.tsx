export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <html>
      <body style={{ background: "#111", color: "#fff", padding: "2rem" }}>
        <h1>✅ Direct render from /generate</h1>
        <p>
          If this appears, your <code>layout.tsx</code> or parent route is preventing content
          from displaying.
        </p>
      </body>
    </html>
  );
}
