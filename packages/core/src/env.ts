import { config as loadEnv, type DotenvConfigOptions } from "dotenv";
import { z } from "zod";

const DEFAULT_ENV_PATH = new URL("../../../.env", import.meta.url).pathname;

export function loadShoppingEnv(options: DotenvConfigOptions = {}) {
  return loadEnv({
    path: DEFAULT_ENV_PATH,
    quiet: true,
    ...options,
  });
}

loadShoppingEnv();

const ShoppingEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  APP_ENCRYPTION_KEY: z.string().min(32),
});

export type ShoppingEnv = z.infer<typeof ShoppingEnvSchema>;

export function parseShoppingEnv(input: Record<string, string | undefined>): ShoppingEnv {
  return ShoppingEnvSchema.parse(input);
}

export function getShoppingEnv(): ShoppingEnv {
  return parseShoppingEnv(process.env);
}
