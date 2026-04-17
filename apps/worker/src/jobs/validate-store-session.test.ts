import { afterEach, describe, expect, it, vi } from "vitest";
import { encryptSessionJson } from "@shopping/core";
import { validateStoreSession } from "./validate-store-session";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("validateStoreSession", () => {
  it("returns true when SSG cookies can fetch a delivery-capable page", async () => {
    global.fetch = vi.fn<typeof fetch>(async () => new Response("<html><body>새벽배송</body></html>"));

    const encryptedSessionJson = encryptSessionJson(
      JSON.stringify([
        { name: "SID", value: "abc", domain: ".ssg.com", path: "/", secure: true, httpOnly: true },
      ]),
      "12345678901234567890123456789012",
    );

    await expect(
      validateStoreSession({
        store: "ssg",
        encryptedSessionJson,
        encryptionKey: "12345678901234567890123456789012",
      }),
    ).resolves.toBe(true);
  });
});
