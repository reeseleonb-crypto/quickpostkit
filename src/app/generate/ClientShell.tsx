"use client";
import GenerateForm from "./GenerateForm";

export default function ClientShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_500px_at_80%_-10%,#1a1d2b_0%,#0b0b12_45%)] text-slate-100 selection:bg-fuchsia-500/30">
      {/* Nav (same as landing) */}
      <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-fuchsia-300">Quick</span>
                <span className="ml-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200">PostKit</span>
              </span>
            </a>
            <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
              <a href="/#who" className="hover:text-white">Who its for</a>
              <a href="/#how" className="hover:text-white">How it works</a>
              <a href="/sample" className="hover:text-white">Sample</a>
              <a href="/#faq" className="hover:text-white">FAQ</a>
            </nav>
            <a href="/generate" className="group inline-flex items-center rounded-xl border border-fuchsia-400/40 bg-white/5 px-3 py-1.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)] hover:border-fuchsia-400/80 transition">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_3px_rgba(255,61,240,.6)] group-hover:scale-110 transition" />
              Get Your Kit
            </a>
          </div>
        </div>
      </header>

      {/* Page intro + top CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Generate Your 30-Day Social Content Kit
        </h1>
        <p className="text-slate-300 mt-2">
          Fill in the details below. When you click <span className="font-semibold">Generate</span>, your DOCX will download automatically.
        </p>
        <div className="mt-6">
          <a href="#form" className="inline-flex items-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-orange-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-black shadow-[0_8px_40px_-12px_rgba(255,61,240,.6)] [background-size:200%_100%] hover:[background-position:100%_0] active:scale-[.98]">
            Start Filling the Form
          </a>
        </div>
      </section>

      {/* Form */}
      <main id="form" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <GenerateForm />
        </div>
      </main>

      {/* Bottom CTA */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap gap-3">
            <a href="/#how" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:border-white/30">
              How it works
            </a>
            <a href="/" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:border-white/30">
              Back to Home
            </a>
          </div>
        </div>
      </section>

      {/* Footer (same as landing) */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-400 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p>QuickPostKit 2025. A Fifth Element Labs Product.</p>
          <nav className="flex gap-4">
            <a className="hover:text-slate-200" href="/#who">Who its for</a>
            <a className="hover:text-slate-200" href="/#how">How it works</a>
            <a className="hover:text-slate-200" href="/sample">Sample</a>
            <a className="hover:text-slate-200" href="/#faq">FAQ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}