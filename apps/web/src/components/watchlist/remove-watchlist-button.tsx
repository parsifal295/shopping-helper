"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveWatchlistButton(input: {
  watchlistItemId: string;
  productName: string;
}) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    const confirmed = confirm(`Remove ${input.productName} from your watchlist?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/watchlist/${input.watchlistItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to remove watchlist item");
      }

      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove watchlist item");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:text-rose-300"
        disabled={isRemoving}
        onClick={() => void handleRemove()}
        type="button"
      >
        {isRemoving ? "Removing..." : "Remove item"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
