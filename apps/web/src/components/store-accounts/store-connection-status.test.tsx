import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StoreConnectionStatus } from "./store-connection-status";

describe("StoreConnectionStatus", () => {
  it("renders validation metadata for an active session", () => {
    const html = renderToStaticMarkup(
      <StoreConnectionStatus
        account={{
          sessionStatus: "active",
          lastValidatedAt: "2026-04-20T00:00:00.000Z",
          reauthRequiredAt: null,
        }}
      />,
    );

    expect(html).toContain("active");
    expect(html).toContain("Validated");
  });

  it("renders reconnect metadata when reauthentication is required", () => {
    const html = renderToStaticMarkup(
      <StoreConnectionStatus
        account={{
          sessionStatus: "reauth_required",
          lastValidatedAt: null,
          reauthRequiredAt: "2026-04-20T01:00:00.000Z",
        }}
      />,
    );

    expect(html).toContain("reauth_required");
    expect(html).toContain("Reconnect needed");
  });
});
