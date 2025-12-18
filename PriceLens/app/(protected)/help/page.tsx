'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'How do I start a price comparison?',
    answer:
      'Begin on the Search tab, type the product you are looking for, and run a search. From there you can select products to compare across sites.',
  },
  {
    question: 'How does the match score work?',
    answer:
      'The match score is a simple text‑based similarity between your query and the product title. Higher scores indicate closer matches, but you should still review the details before purchasing.',
  },
  {
    question: 'Can I trust the prices I see?',
    answer:
      'PriceLens surfaces live prices directly from the marketplaces at the time of search. Final pricing, shipping, and availability are always confirmed on the original website.',
  },
  {
    question: 'What happens when I click a product?',
    answer:
      'You are taken directly to the product page on the source website (Amazon, Flipkart, GeM or Snapdeal) so you can complete your purchase there.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="page-fade-in min-h-[calc(100vh-56px)] bg-slate-50/80 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Help</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Getting the most out of PriceLens
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            This page covers the most common questions about how to search, compare, and interpret
            results. Everything is designed to stay predictable and transparent.
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const open = openIndex === index;
              return (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-slate-900">{item.question}</h2>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700">
                      {open ? '−' : '+'}
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-sm text-slate-700 transition-all duration-200 ${
                      open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {open && <p className="pt-1">{item.answer}</p>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-sky-50/70 p-6">
            <h3 className="text-sm font-semibold text-slate-900">Quick tips</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li>• Use specific model names to get cleaner, higher‑match results.</li>
              <li>• Try a few different price filters to see how the market shifts.</li>
              <li>• Use the comparison table whenever you are close to making a decision.</li>
            </ul>
            <p className="pt-2 text-xs text-slate-500">
              If something doesn&apos;t look right in the data, always double‑check on the original
              website before purchasing.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


