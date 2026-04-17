import { describe, expect, it, vi } from "vitest";
import { runWorkerCycle } from "./index";

describe("runWorkerCycle", () => {
  it("processes due items and reports per-status counts", async () => {
    const result = await runWorkerCycle(
      {
        claimDueWatchlistItems: async () => [{ watchlistItemId: "watch-1" }, { watchlistItemId: "watch-2" }],
        refreshWatchlistItem: vi
          .fn()
          .mockResolvedValueOnce({ status: "success" })
          .mockResolvedValueOnce({ status: "partial" }),
      },
      new Date("2026-04-17T08:00:00.000Z"),
      10,
    );

    expect(result).toEqual({
      claimed: 2,
      success: 1,
      partial: 1,
      failed: 0,
    });
  });

  it("marks unexpected job exceptions as failures and continues", async () => {
    const result = await runWorkerCycle(
      {
        claimDueWatchlistItems: async () => [{ watchlistItemId: "watch-1" }, { watchlistItemId: "watch-2" }],
        refreshWatchlistItem: vi
          .fn()
          .mockRejectedValueOnce(new Error("boom"))
          .mockResolvedValueOnce({ status: "success" }),
      },
      new Date("2026-04-17T08:00:00.000Z"),
      10,
    );

    expect(result).toEqual({
      claimed: 2,
      success: 1,
      partial: 0,
      failed: 1,
    });
  });
});
