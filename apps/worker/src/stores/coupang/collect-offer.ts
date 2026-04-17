import * as cheerio from "cheerio";
import { fetchWithSession } from "../../http/fetch-with-session";

export async function collectCoupangOffer(input: {
  productUrl: string;
  encryptedSessionJson: string;
  encryptionKey: string;
}): Promise<{
  store: "coupang";
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  availability: string;
  deliveryType: "rocket_fresh" | "other";
  eligible: boolean;
  rawTitle: string;
  rawPayload: { rocketFresh: boolean };
}> {
  const response = await fetchWithSession({
    url: input.productUrl,
    encryptedSessionJson: input.encryptedSessionJson,
    encryptionKey: input.encryptionKey,
    userAgent: "shopping-helper-collector",
  });

  if (!response.ok) {
    throw new Error(`Coupang offer request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rocketFresh = html.includes("로켓프레시") || html.includes("Rocket Fresh");

  return {
    store: "coupang" as const,
    price: Number($(".total-price strong").first().text().replace(/[^\d]/g, "")),
    listPrice: Number($(".origin-price").first().text().replace(/[^\d]/g, "")) || null,
    isOnSale: $(".discount-rate").length > 0,
    availability: $(".sold-out").length ? "sold_out" : "available",
    deliveryType: rocketFresh ? "rocket_fresh" : "other",
    eligible: rocketFresh,
    rawTitle: $(".prod-buy-header__title").first().text().trim() || "Unknown Coupang item",
    rawPayload: {
      rocketFresh,
    },
  };
}
