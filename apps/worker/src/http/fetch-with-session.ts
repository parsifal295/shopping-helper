import { decryptSessionJson, toCookieHeader, type BrowserCookie } from "@shopping/core";

export async function fetchWithSession(input: {
  url: string;
  encryptedSessionJson: string;
  encryptionKey: string;
  userAgent: string;
}) {
  const cookies = JSON.parse(
    decryptSessionJson(input.encryptedSessionJson, input.encryptionKey),
  ) as BrowserCookie[];

  return fetch(input.url, {
    headers: {
      Accept: "text/html,application/json",
      Cookie: toCookieHeader(cookies),
      "User-Agent": input.userAgent,
    },
  });
}
