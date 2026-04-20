/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkNotificationReadButton } from "./mark-notification-read-button";

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

describe("MarkNotificationReadButton", () => {
  it("marks one notification as read and refreshes the page", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ notificationId: "notif-1" }), { status: 200 }),
    );

    render(<MarkNotificationReadButton notificationId="notif-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Mark read" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications/notif-1/read", {
        method: "POST",
      });
      expect(refresh).toHaveBeenCalled();
    });
  });
});
