export default function ComparePage() {
  return (
    <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Compare prices in a single glance
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Use PriceLens to collect products from Amazon, Flipkart, GeM and Snapdeal, then open a
            side‑by‑side comparison table to see which option truly fits your budget and
            requirements.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-600">
              Step 1
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Search for a product</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start from the Search tab and look up the product you care about – for example,
              &quot;Samsung 55 inch 4K TV&quot;.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-600">
              Step 2
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Select items to compare</h2>
            <p className="mt-2 text-sm text-slate-600">
              In the results, use the <span className="font-medium">Compare</span> checkbox on any
              product card to build your shortlist across websites.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-600">
              Step 3
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Open the comparison table</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use the floating bar at the bottom‑right to open a structured comparison including
              price, match score, site and links.
            </p>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-sky-50/70 p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Make confident, traceable decisions
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              The comparison view is designed to be simple and audit‑friendly. Each column
              represents a product from a specific site, with clear pricing, match scores, and a
              direct link back to the original listing.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Highlighted &quot;Best value&quot; pricing for quick scanning.</li>
              <li>• Consistent formatting so prices are easy to line up.</li>
              <li>• Non‑destructive: close the table any time to return to search results.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Tips for sharper comparisons</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Compare 3–6 products at a time to keep things readable.</li>
              <li>• Use filters and sorting before selecting items for comparison.</li>
              <li>• Look at both price and match score to avoid poor‑fit deals.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}


