import { describe, expect, it } from "vitest";
import { parseShoppingEnv } from "./env";

describe("parseShoppingEnv", () => {
  it("rejects missing encryption material", () => {
    expect(() =>
      parseShoppingEnv({
        DATABASE_URL: "https://example.com/not-a-real-db",
        AUTH_SECRET: "a".repeat(32),
        APP_ENCRYPTION_KEY: "",
      }),
    ).toThrow(/APP_ENCRYPTION_KEY/);
  });
});
