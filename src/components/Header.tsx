'use client';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">QuickPostKit</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/sample" className="text-slate-600 hover:text-slate-900">Sample</Link>
          <Link href="/generate" className="text-slate-600 hover:text-slate-900">Generate</Link>
          <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
