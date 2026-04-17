/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddWatchlistPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  push.mockReset();
});

describe("AddWatchlistPage", () => {
  it("searches and confirms a grouped candidate", async () => {
    global.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            groups: [
              {
                normalized: {
                  brand: "cj",
                  normalizedName: "비비고 왕교자",
                  sizeValue: 1.05,
                  sizeUnit: "kg",
                  optionKey: "냉동",
                },
                displayTitle: "CJ 비비고 왕교자 1.05kg",
                brand: "CJ",
                imageUrl: null,
                offers: [
                  {
                    store: "coupang",
                    externalProductId: "1",
                    productUrl: "https://www.coupang.com/products/1",
                    latestKnownTitle: "CJ 비비고 왕교자 1.05kg",
                    brand: "CJ",
                    imageUrl: null,
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ watchlistItem: { id: "watch-1" } }), { status: 201 }));

    render(<AddWatchlistPage />);

    fireEvent.change(screen.getByPlaceholderText("예: 비비고 왕교자 1.05kg"), {
      target: { value: "비비고 왕교자" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search products" }));

    expect(await screen.findByText("CJ 비비고 왕교자 1.05kg")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/watchlist");
    });
  });
});
