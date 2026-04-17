/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PollingIntervalControl } from "./polling-interval-control";

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

describe("PollingIntervalControl", () => {
  it("updates the polling cadence and refreshes the page", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ pollingIntervalMinutes: 30 }), { status: 200 }),
    );

    render(<PollingIntervalControl initialPollingIntervalMinutes={60} watchlistItemId="watch-1" />);

    fireEvent.change(screen.getByLabelText("Polling cadence"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save cadence" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist/watch-1/polling-interval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pollingIntervalMinutes: 30 }),
      });
      expect(refresh).toHaveBeenCalled();
    });
  });
});
