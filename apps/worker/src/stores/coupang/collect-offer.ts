import * as cheerio from "cheerio";
import { fetchWithSession } from "../../http/fetch-with-session";
import { CollectionError } from "../collection-error";

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
    throw new CollectionError(
      response.status === 401 || response.status === 403 ? "auth_required" : "request_failed",
      `Coupang offer request failed with status ${response.status}`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rocketFresh = html.includes("로켓프레시") || html.includes("Rocket Fresh");
  const rawTitle = $(".prod-buy-header__title").first().text().trim();
  const price = Number($(".total-price strong").first().text().replace(/[^\d]/g, ""));
  const listPrice = Number($(".origin-price").first().text().replace(/[^\d]/g, "")) || null;

  if (!rawTitle || price <= 0) {
    throw new CollectionError("parse_failed", "Coupang offer response is missing required fields");
  }

  return {
    store: "coupang" as const,
    price,
    listPrice,
    isOnSale: $(".discount-rate").length > 0,
    availability: $(".sold-out").length ? "sold_out" : "available",
    deliveryType: rocketFresh ? "rocket_fresh" : "other",
    eligible: rocketFresh,
    rawTitle,
    rawPayload: {
      rocketFresh,
    },
  };
}
