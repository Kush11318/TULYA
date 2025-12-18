export default function AboutPage() {
  return (
    <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
            About
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            PriceLens helps you focus on value, not noise
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            PriceLens compares live prices across multiple marketplaces so you can see the real
            trade‑offs in one place – no endless tab‑hopping, no guesswork.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-sky-50/70 p-6">
            <h2 className="text-base font-semibold text-slate-900">Multi‑site visibility</h2>
            <p className="mt-2 text-sm text-slate-700">
              See offers from Amazon, Flipkart, GeM and Snapdeal together, with a consistent format
              that makes them easy to compare.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Signal over noise</h2>
            <p className="mt-2 text-sm text-slate-700">
              Our simple relevance score surfaces the closest matches to your query, so you can
              ignore outliers and distractions.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Built for decisions</h2>
            <p className="mt-2 text-sm text-slate-700">
              From &quot;best price&quot; highlights to a clean comparison table, PriceLens is
              designed to support real purchasing decisions – not just browsing.
            </p>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              A product mindset from day one
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              PriceLens is intentionally minimal on the surface, so teams can quickly scan what
              matters: price, match, and source. Behind the scenes, we focus on reliability and
              clarity instead of visual noise.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              The result is a tool that feels familiar and light to use, but strong enough to sit in
              front of stakeholders and procurement teams.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-sky-50/70 p-6">
            <h3 className="text-sm font-semibold text-slate-900">What PriceLens is not</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Not a marketplace – we don&apos;t sell products.</li>
              <li>• Not a browser plugin – everything happens in this focused workspace.</li>
              <li>• Not a dark‑pattern UX – you stay in control of every click.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}


