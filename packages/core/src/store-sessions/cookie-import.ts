import { z } from "zod";

export const BrowserCookieSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  domain: z.string().min(1),
  path: z.string().default("/"),
  expires: z.number().optional(),
  httpOnly: z.boolean().default(false),
  secure: z.boolean().default(true),
  sameSite: z.enum(["Strict", "Lax", "None"]).optional(),
});

export type BrowserCookie = z.infer<typeof BrowserCookieSchema>;

export function parseCookieImport(raw: string): BrowserCookie[] {
  return z.array(BrowserCookieSchema).min(1).parse(JSON.parse(raw));
}
