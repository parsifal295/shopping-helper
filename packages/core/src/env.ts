import { z } from "zod";

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
