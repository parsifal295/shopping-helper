"use client";

import { useState } from "react";

export default function AddWatchlistPage() {
  const [query, setQuery] = useState("");
  const [productUrl, setProductUrl] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Add a watched product</h1>
        <p className="mt-1 text-sm text-slate-600">Search by product name or paste a Coupang / SSG URL.</p>
      </section>

      <form action="/api/watchlist/search" className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          name="query"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 비비고 왕교자 1.05kg"
          value={query}
        />
        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white" type="submit">
          Search products
        </button>
      </form>

      <form action="/api/watchlist/from-url" className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          name="productUrl"
          onChange={(event) => setProductUrl(event.target.value)}
          placeholder="https://..."
          value={productUrl}
        />
        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white" type="submit">
          Add from URL
        </button>
      </form>
    </div>
  );
}
