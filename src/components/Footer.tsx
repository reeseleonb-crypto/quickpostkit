export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-600 md:flex-row">
        <p>QuickPostKit © 2025. A Fifth Element Labs Product.</p>
        <div className="flex gap-4">
          <a href="/sample" className="hover:text-slate-900">Sample</a>
          <a href="/generate" className="hover:text-slate-900">Generate</a>
          <a href="/contact" className="hover:text-slate-900">Contact</a>
        </div>
      </div>
    </footer>
  );
}
