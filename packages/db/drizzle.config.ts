import { defineConfig } from "drizzle-kit";
import { getShoppingEnv } from "@shopping/core";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getShoppingEnv().DATABASE_URL,
  },
});
