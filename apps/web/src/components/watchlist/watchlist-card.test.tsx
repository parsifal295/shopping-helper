import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
          lastCapturedAt: "2026-04-17T00:00:00.000Z",
        }}
      />,
    );

    expect(html).toContain("ssg is cheaper");
    expect(html).toContain("비비고 왕교자 1.05kg");
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
          lastCapturedAt: null,
        }}
      />,
    );

    expect(html).toContain("Coupang Latest info unavailable");
  });
});
