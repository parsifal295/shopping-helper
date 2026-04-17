import { pool } from "./client";

console.log("db seed: no-op");

await pool.end();
