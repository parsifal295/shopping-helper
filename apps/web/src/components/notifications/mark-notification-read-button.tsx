"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkNotificationReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkRead() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to mark notification as read");
      }

      router.refresh();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to mark notification as read");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:text-slate-400"
        disabled={isSaving}
        onClick={() => void handleMarkRead()}
        type="button"
      >
        {isSaving ? "Saving..." : "Mark read"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
