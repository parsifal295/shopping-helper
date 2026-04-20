import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { getShoppingEnv, loadShoppingEnv, parseShoppingEnv } from "./env";

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

  it("loads env values from a dotenv file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "shopping-env-"));
    const envPath = join(tempDir, ".env");
    const previousEnv = {
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
    };

    await writeFile(
      envPath,
      [
        "DATABASE_URL=postgresql://example.com/shopping",
        `AUTH_SECRET=${"a".repeat(32)}`,
        `APP_ENCRYPTION_KEY=${"b".repeat(32)}`,
      ].join("\n"),
    );

    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    delete process.env.APP_ENCRYPTION_KEY;

    try {
      loadShoppingEnv({ path: envPath, override: true });

      expect(getShoppingEnv()).toEqual({
        DATABASE_URL: "postgresql://example.com/shopping",
        AUTH_SECRET: "a".repeat(32),
        APP_ENCRYPTION_KEY: "b".repeat(32),
      });
    } finally {
      if (previousEnv.DATABASE_URL === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousEnv.DATABASE_URL;
      }

      if (previousEnv.AUTH_SECRET === undefined) {
        delete process.env.AUTH_SECRET;
      } else {
        process.env.AUTH_SECRET = previousEnv.AUTH_SECRET;
      }

      if (previousEnv.APP_ENCRYPTION_KEY === undefined) {
        delete process.env.APP_ENCRYPTION_KEY;
      } else {
        process.env.APP_ENCRYPTION_KEY = previousEnv.APP_ENCRYPTION_KEY;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
