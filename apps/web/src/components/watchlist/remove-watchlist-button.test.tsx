/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoveWatchlistButton } from "./remove-watchlist-button";

const refresh = vi.fn();
const confirmMock = vi.fn(() => true);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

beforeEach(() => {
  vi.stubGlobal("confirm", confirmMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  refresh.mockReset();
  confirmMock.mockReset();
  confirmMock.mockReturnValue(true);
});

describe("RemoveWatchlistButton", () => {
  it("deactivates the watchlist item and refreshes the page", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ watchlistItemId: "watch-1" }), { status: 200 }),
    );

    render(<RemoveWatchlistButton productName="비비고 왕교자 1.05kg" watchlistItemId="watch-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith("Remove 비비고 왕교자 1.05kg from your watchlist?");
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist/watch-1", {
        method: "DELETE",
      });
      expect(refresh).toHaveBeenCalled();
    });
  });
});
