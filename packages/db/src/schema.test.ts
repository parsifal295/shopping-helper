import { describe, expect, it } from "vitest";
import { linkedStoreAccounts, userWatchlistItems, watchlistSyncState } from "./schema";

describe("database schema", () => {
  it("tracks store linkage and polling cadence", () => {
    expect(linkedStoreAccounts.store.enumValues).toEqual(["coupang", "ssg"]);
    expect(userWatchlistItems.pollingIntervalMinutes.name).toBe("polling_interval_minutes");
    expect(watchlistSyncState.nextRunAt.name).toBe("next_run_at");
  });
});
