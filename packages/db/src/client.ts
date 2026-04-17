import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getShoppingEnv } from "@shopping/core/src/env";
import * as schema from "./schema";

loadEnv({
  path: new URL("../../../.env", import.meta.url).pathname,
});

export const pool = new Pool({
  connectionString: getShoppingEnv().DATABASE_URL,
});

export const db = drizzle(pool, { schema });
