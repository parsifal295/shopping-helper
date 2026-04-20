import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getShoppingEnv } from "@shopping/core";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: getShoppingEnv().DATABASE_URL,
});

export const db = drizzle(pool, { schema });
