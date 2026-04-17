import { fetchWithSession } from "../http/fetch-with-session";

export async function validateStoreSession(input: {
  store: "coupang" | "ssg";
  encryptedSessionJson: string;
  encryptionKey: string;
}) {
  const response = await fetchWithSession({
    url: input.store === "coupang" ? "https://www.coupang.com/np/campaigns/82" : "https://www.ssg.com/",
    encryptedSessionJson: input.encryptedSessionJson,
    encryptionKey: input.encryptionKey,
    userAgent: "shopping-helper-session-validator",
  });

  if (!response.ok) {
    throw new Error(`Session validation failed with status ${response.status}`);
  }

  const body = await response.text();

  if (input.store === "coupang") {
    return body.includes("로켓프레시") || body.includes("Rocket Fresh");
  }

  return body.includes("새벽배송") || body.includes("쓱배송") || body.includes("트레이더스");
}
