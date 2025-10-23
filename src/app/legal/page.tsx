export default function Legal() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_500px_at_80%_-10%,#1a1d2b_0%,#0b0b12_45%)] text-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex justify-end">
          <a href="/" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-white/30">← Back to Home</a>
        </div>
        <div className="flex justify-end">
          <a href="/" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-white/30">â† Back to Home</a>
        </div>
  <div className="flex justify-end">
    <a href="/" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-white/30">Ã¢â€ Â Back to Home</a>
  </div>
        <header>
          <h1 className="text-3xl font-bold">Legal &amp; Data Practices</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </header>

        <section>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            QuickPostKit (a Fifth Element Labs product) generates a 30-day social content pack from your inputs.
            We do not create user accounts or require logins. This page explains how data is handled and who
            processes payments and AI generation on our behalf.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">What We Collect</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            We collect only the inputs you provide to generate your document (for example: niche, audience, goals).
            We do not sell or share your inputs. Server logs may contain minimal, transient technical data
            (timestamps, request metadata) needed for reliability and abuse prevention.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">Storage &amp; Retention</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            Inputs are processed to produce your downloadable file. We do not intentionally persist your inputs on
            our servers beyond what is required to fulfill your request and maintain the service. Do not enter
            confidential or sensitive information (financial, health, or personal identifiers).
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">Payments (Stripe)</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            All payments are processed securely by <span className="font-medium">Stripe</span>. QuickPostKit does not
            see or store your credit-card or banking data. Stripe operates independently and maintains its own security
            and compliance programs. Your payment information is handled under StripeÃ¢â‚¬â„¢s policies.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">AI Processing (OpenAI / ChatGPT API)</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            To assemble your plan, we use <span className="font-medium">OpenAIÃ¢â‚¬â„¢s ChatGPT API</span>. Relevant inputs
            may be transmitted to OpenAI for processing and are subject to OpenAIÃ¢â‚¬â„¢s terms and privacy practices.
            Avoid entering sensitive data. QuickPostKit cannot control how third-party providers process or retain
            data under their policies.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">Security &amp; Responsibility</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            We take reasonable measures to safeguard our service. However, third-party processors (Stripe, OpenAI)
            maintain their own security and compliance. By using QuickPostKit, you acknowledge these third parties may
            process your information under their respective terms.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">Refund Policy</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            Because QuickPostKit generates a digital file instantly upon purchase, all sales are final. If you encounter
            technical issues, contact us within 48 hours and we will assist promptly.
          </p>
        </section>

        <section>
          <h2 className="mt-6 text-xl font-semibold">Contact</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            Questions? Email{" "}
            <a className="text-pink-400 hover:text-orange-400" href="mailto:support@fifthelementlabs.com">
              support@fifthelementlabs.com
            </a>.
          </p>
        </section>

        <footer className="border-t border-slate-800 pt-4 text-sm text-slate-500">
          QuickPostKit Ã‚Â© {new Date().getFullYear()}. A Fifth Element Labs Product.
        </footer>
      </div>
    </main>
  );
}
