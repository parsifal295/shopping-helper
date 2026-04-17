import { describe, expect, it } from "vitest";
import { claimDueWatchlistItems } from "./claim-due-watchlist-items";

describe("claimDueWatchlistItems", () => {
  it("returns only items whose nextRunAt is due", async () => {
    const result = await claimDueWatchlistItems(
      {
        selectDueRows: async () => [{ watchlistItemId: "due-1", nextRunAt: new Date("2026-04-17T01:00:00.000Z") }],
      },
      new Date("2026-04-17T02:00:00.000Z"),
      10,
    );

    expect(result).toHaveLength(1);
    expect(result[0].watchlistItemId).toBe("due-1");
  });
});
