"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualRefreshButton({ watchlistItemId }: { watchlistItemId: string }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setError(null);
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/watchlist/${watchlistItemId}/refresh`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Manual refresh failed");
      }

      router.refresh();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Manual refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:text-slate-400"
        disabled={isRefreshing}
        onClick={() => void handleRefresh()}
        type="button"
      >
        {isRefreshing ? "Refreshing..." : "Refresh now"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
