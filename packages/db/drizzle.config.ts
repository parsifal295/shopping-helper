import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getShoppingEnv } from "@shopping/core/src/env";

loadEnv({
  path: new URL("../../.env", import.meta.url).pathname,
});

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getShoppingEnv().DATABASE_URL,
  },
});
