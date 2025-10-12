export default function Contact() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_500px_at_80%_-10%,#1a1d2b_0%,#0b0b12_45%)] text-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Contact */}
        <section>
          <h1 className="text-3xl font-bold">Contact</h1>
          <p className="mt-2 text-slate-300">
            Support:{" "}
            <a className="text-pink-400 hover:text-orange-400 transition" href="mailto:support@fifthelementlabs.com">
              support@fifthelementlabs.com
            </a>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Privacy • Terms • Disclaimer • Refund Policy •{" "}
            <a href="/legal" className="text-pink-400 hover:text-orange-400">Legal</a>
          </p>
        </section>

        <hr className="border-slate-700" />

        {/* Short legal summary visible on Contact */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Legal Summary</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            QuickPostKit does not save or sell your personal inputs. Payments are handled securely by
            <span className="font-medium"> Stripe</span>, and your payment information is never stored by us.
            Content generation uses <span className="font-medium">OpenAI’s ChatGPT API</span>; relevant inputs may be
            processed by OpenAI under their terms. Please avoid submitting sensitive data. See the{" "}
            <a href="/legal" className="text-pink-400 hover:text-orange-400">full Legal page</a> for details.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="mt-6 text-xl font-semibold">Privacy</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            We store only what is needed to process your order and deliver your document. We do not sell or share your
            inputs. For payment processing, Stripe’s systems and policies apply.
          </p>
        </section>

        {/* Terms */}
        <section>
          <h2 className="mt-6 text-xl font-semibold">Terms</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            Each purchase provides a one-time license for personal or business use by the purchaser. Redistribution,
            reselling, or offering generated materials as a commercial service is prohibited without written permission
            from Fifth Element Labs.
          </p>
        </section>

        {/* Disclaimer */}
        <section>
          <h2 className="mt-6 text-xl font-semibold">Disclaimer</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            QuickPostKit provides structured plans to assist with social posting. Results may vary depending on your
            inputs, posting consistency, and platform changes. We cannot guarantee specific engagement, traffic, or sales
            outcomes.
          </p>
        </section>

        {/* Refund Policy */}
        <section>
          <h2 className="mt-6 text-xl font-semibold">Refund Policy</h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            Because a digital file is generated instantly upon purchase, all sales are final. If you experience technical
            issues accessing your content pack, contact support within 48 hours and we will assist promptly.
          </p>
        </section>

        <footer className="border-t border-slate-800 pt-4 text-sm text-slate-500">
          QuickPostKit © {new Date().getFullYear()}. A Fifth Element Labs Product.
        </footer>
      </div>
    </main>
  );
}
