"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchCandidateGroup } from "@shopping/db";
import { SearchResultCard } from "../../../../components/watchlist/search-result-card";

type SearchResponse = {
  groups: SearchCandidateGroup[];
  message?: string;
};

type ErrorResponse = {
  message?: string;
};

export default function AddWatchlistPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [pollingIntervalMinutes, setPollingIntervalMinutes] = useState(60);
  const [searchResults, setSearchResults] = useState<SearchCandidateGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingGroupKey, setIsSavingGroupKey] = useState<string | null>(null);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError(null);
    setSearchResults([]);
    setIsSearching(true);

    const formData = new FormData();
    formData.set("query", query);

    try {
      const response = await fetch("/api/watchlist/search", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Search failed");
      }

      setSearchResults(data.groups);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleConfirmGroup(group: SearchCandidateGroup) {
    const groupKey = `${group.normalized.brand}:${group.normalized.normalizedName}:${group.normalized.optionKey}`;
    setSearchError(null);
    setIsSavingGroupKey(groupKey);

    try {
      const response = await fetch("/api/watchlist/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group,
          pollingIntervalMinutes,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as ErrorResponse;
        throw new Error(data.message ?? "Failed to add watchlist item");
      }

      startTransition(() => {
        router.push("/watchlist");
      });
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Failed to add watchlist item");
    } finally {
      setIsSavingGroupKey(null);
    }
  }

  async function handleUrlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUrlError(null);
    setIsSavingUrl(true);

    const formData = new FormData();
    formData.set("productUrl", productUrl);
    formData.set("pollingIntervalMinutes", String(pollingIntervalMinutes));

    try {
      const response = await fetch("/api/watchlist/from-url", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as ErrorResponse;
        throw new Error(data.message ?? "Failed to add from URL");
      }

      startTransition(() => {
        router.push("/watchlist");
      });
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : "Failed to add from URL");
    } finally {
      setIsSavingUrl(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Add a watched product</h1>
        <p className="mt-1 text-sm text-slate-600">Search by product name or paste a Coupang / SSG URL.</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700" htmlFor="pollingIntervalMinutes">
          Check interval (minutes)
        </label>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          id="pollingIntervalMinutes"
          min={15}
          onChange={(event) => setPollingIntervalMinutes(Number(event.target.value) || 60)}
          type="number"
          value={pollingIntervalMinutes}
        />
      </section>

      <form className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" onSubmit={handleSearchSubmit}>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          name="query"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 비비고 왕교자 1.05kg"
          value={query}
        />
        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:bg-slate-300"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? "Searching..." : "Search products"}
        </button>
        {searchError ? <p className="text-sm text-rose-600">{searchError}</p> : null}
      </form>

      {searchResults.length > 0 ? (
        <section className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Choose the exact product</h2>
            <p className="mt-1 text-sm text-slate-600">Only exact brand, size, and option matches should be added.</p>
          </div>
          {searchResults.map((group) => {
            const groupKey = `${group.normalized.brand}:${group.normalized.normalizedName}:${group.normalized.optionKey}`;

            return (
              <SearchResultCard
                group={group}
                isSaving={isSavingGroupKey === groupKey}
                key={groupKey}
                onAdd={() => void handleConfirmGroup(group)}
              />
            );
          })}
        </section>
      ) : null}

      <form className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" onSubmit={handleUrlSubmit}>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          name="productUrl"
          onChange={(event) => setProductUrl(event.target.value)}
          placeholder="https://..."
          value={productUrl}
        />
        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:bg-slate-300"
          disabled={isSavingUrl}
          type="submit"
        >
          {isSavingUrl ? "Adding..." : "Add from URL"}
        </button>
        {urlError ? <p className="text-sm text-rose-600">{urlError}</p> : null}
      </form>
    </div>
  );
}
