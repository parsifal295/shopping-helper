import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./manual-refresh-button", () => ({
  ManualRefreshButton: ({ watchlistItemId }: { watchlistItemId: string }) => (
    <button type="button">Refresh {watchlistItemId}</button>
  ),
}));

vi.mock("./polling-interval-control", () => ({
  PollingIntervalControl: ({ watchlistItemId }: { watchlistItemId: string }) => (
    <button type="button">Cadence {watchlistItemId}</button>
  ),
}));

import { WatchlistCard } from "./watchlist-card";

describe("WatchlistCard", () => {
  it("renders the cheaper store badge", () => {
    const html = renderToStaticMarkup(
      <WatchlistCard
        item={{
          id: "watch-1",
          productName: "비비고 왕교자 1.05kg",
          imageUrl: null,
          coupangPrice: 8990,
          ssgPrice: 7990,
          cheaperStore: "ssg",
          pollingIntervalMinutes: 60,
          lastCapturedAt: "2026-04-17T00:00:00.000Z",
          nextRunAt: "2026-04-17T01:00:00.000Z",
        }}
      />,
    );

    expect(html).toContain("ssg is cheaper");
    expect(html).toContain("비비고 왕교자 1.05kg");
    expect(html).toContain("Checks every 60 min");
    expect(html).toContain("Updated");
  });

  it("renders an unavailable label when a store has no latest snapshot", () => {
    const html = renderToStaticMarkup(
      <WatchlistCard
        item={{
          id: "watch-1",
          productName: "서울우유 1L",
          imageUrl: null,
          coupangPrice: null,
          ssgPrice: 2990,
          cheaperStore: "ssg",
          pollingIntervalMinutes: 30,
          lastCapturedAt: null,
          nextRunAt: "2026-04-17T00:30:00.000Z",
        }}
      />,
    );

    expect(html).toContain("Coupang Latest info unavailable");
  });
});
