import type { BrowserCookie } from "./cookie-import";

export function toCookieHeader(cookies: BrowserCookie[]) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
