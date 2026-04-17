"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POLLING_OPTIONS = [
  15,
  30,
  60,
  180,
  360,
  720,
  1_440,
] as const;

function formatPollingOption(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 24 ? "24 hr" : `${hours} hr`;
  }

  return `${minutes} min`;
}

export function PollingIntervalControl(input: {
  watchlistItemId: string;
  initialPollingIntervalMinutes: number;
}) {
  const router = useRouter();
  const [pollingIntervalMinutes, setPollingIntervalMinutes] = useState(input.initialPollingIntervalMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/watchlist/${input.watchlistItemId}/polling-interval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pollingIntervalMinutes,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to update cadence");
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update cadence");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`polling-interval-${input.watchlistItemId}`}>
          Polling cadence
        </label>
        <select
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          id={`polling-interval-${input.watchlistItemId}`}
          onChange={(event) => setPollingIntervalMinutes(Number(event.target.value))}
          value={pollingIntervalMinutes}
        >
          {POLLING_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {formatPollingOption(minutes)}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:text-slate-400"
          disabled={isSaving || pollingIntervalMinutes === input.initialPollingIntervalMinutes}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Saving..." : "Save cadence"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
