/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkAllReadButton } from "./mark-all-read-button";

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

describe("MarkAllReadButton", () => {
  it("marks unread notifications as read and refreshes the page", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ updatedCount: 3 }), { status: 200 }),
    );

    render(<MarkAllReadButton />);

    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications/mark-all-read", {
        method: "POST",
      });
      expect(refresh).toHaveBeenCalled();
    });
  });
});
