import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">30-Day Social Content Kit</h1>
        <p className="mt-3 text-slate-600">
          One-time <span className="font-semibold">$5</span>. No subscriptions. Tailored by your 10 inputs.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sample" className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-slate-900 shadow-sm hover:bg-indigo-50">See a Sample</Link>
          <Link href="/generate" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-sm hover:bg-indigo-700">Get Your Kit</Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900">Practical & Affordable</h3>
          <p className="mt-2 text-slate-600">$5 once. That&apos;s it.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900">Tailored by 10 Inputs</h3>
          <p className="mt-2 text-slate-600">Niche, audience, tone, and more.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900">Word Doc Download</h3>
          <p className="mt-2 text-slate-600">30 days with filming notes.</p>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
        <ol className="mx-auto mt-4 max-w-3xl list-decimal space-y-2 text-left text-slate-700 marker:text-indigo-600">
          <li>Fill the 10-input form</li>
          <li>Pay $5 via Stripe Checkout</li>
          <li>Wait ~30–60s while we assemble</li>
          <li>Auto-download your .docx</li>
        </ol>
        <div className="mt-6">
          <Link href="/generate" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-sm hover:bg-indigo-700">Generate Now</Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-slate-900 text-center">FAQ</h2>
        <div className="mx-auto mt-6 grid max-w-3xl gap-4">
          <details className="rounded-lg border border-slate-200 p-4">
            <summary className="font-medium text-slate-900">What do I get?</summary>
            <p className="mt-2 text-slate-600">A 30-day Word doc with daily caption, hook, CTA, hashtags, filming directions, posting tips, plus static appendices.</p>
          </details>
          <details className="rounded-lg border border-slate-200 p-4">
            <summary className="font-medium text-slate-900">Is there a subscription?</summary>
            <p className="mt-2 text-slate-600">No. One-time purchase.</p>
          </details>
          <details className="rounded-lg border border-slate-200 p-4">
            <summary className="font-medium text-slate-900">Which platforms?</summary>
            <p className="mt-2 text-slate-600">Defaults to Instagram Reels. Also supports TikTok, YouTube Shorts, LinkedIn, Facebook.</p>
          </details>
        </div>
      </section>
    </main>
  );
}
