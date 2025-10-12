const Card = ({ day }: { day: number }) => (
  <div className="rounded-xl border border-slate-200 p-4">
    <div className="text-xs text-slate-500">Day {day}</div>
    <div className="mt-1 font-semibold text-slate-900">🎬 Hook:</div>
    <p className="text-slate-700">Stop scrolling—watch this before you book a wedding photographer.</p>
    <div className="mt-2 font-semibold text-slate-900">📹 Filming:</div>
    <ul className="ml-5 list-disc text-slate-700">
      <li>Show portfolio flips; overlay client reactions; quick pacing.</li>
      <li>Cut to behind-the-scenes prep; lenses laid out on table.</li>
      <li>End on 3-second smile + on-screen CTA.</li>
    </ul>
    <div className="mt-2 font-semibold text-slate-900">💡 Caption:</div>
    <p className="text-slate-700">Three things pros do that save you stress on the big day…</p>
    <div className="mt-2 font-semibold text-slate-900">👉 CTA:</div>
    <p className="text-slate-700">Grab the free shot list in bio.</p>
    <div className="mt-2 font-semibold text-slate-900">#️⃣ Hashtags:</div>
    <p className="text-slate-700">#weddingphotographer #bridetobe #weddingtips #ncweddings #reels</p>
  </div>
);

export default function Sample() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Sample (5-Day Preview)</h1>
      <p className="mt-2 text-slate-600">Example day cards for a wedding photographer.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((d) => <Card key={d} day={d} />)}
      </div>
    </main>
  );
}
