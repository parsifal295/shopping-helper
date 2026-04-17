/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualRefreshButton } from "./manual-refresh-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  refresh.mockReset();
});

describe("ManualRefreshButton", () => {
  it("calls the watchlist refresh endpoint and refreshes the page", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ status: "success" }), { status: 202 }),
    );

    render(<ManualRefreshButton watchlistItemId="watch-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist/watch-1/refresh", {
        method: "POST",
      });
      expect(refresh).toHaveBeenCalled();
    });
  });
});
