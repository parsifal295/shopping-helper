import * as cheerio from "cheerio";
import { fetchWithSession } from "../../http/fetch-with-session";

export async function collectSsgOffer(input: {
  productUrl: string;
  encryptedSessionJson: string;
  encryptionKey: string;
}): Promise<{
  store: "ssg";
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  availability: string;
  deliveryType: "dawn" | "daytime" | "traders" | "other";
  eligible: boolean;
  rawTitle: string;
  rawPayload: { deliveryLabel: string };
}> {
  const response = await fetchWithSession({
    url: input.productUrl,
    encryptedSessionJson: input.encryptedSessionJson,
    encryptionKey: input.encryptionKey,
    userAgent: "shopping-helper-collector",
  });

  if (!response.ok) {
    throw new Error(`SSG offer request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const deliveryLabel = $(".delivery-type").first().text().trim().toLowerCase();
  const deliveryType: "dawn" | "daytime" | "traders" | "other" =
    deliveryLabel.includes("새벽") ? "dawn" :
    deliveryLabel.includes("주간") ? "daytime" :
    deliveryLabel.includes("트레이더스") ? "traders" :
    "other";

  return {
    store: "ssg" as const,
    price: Number($(".ssg_price").first().text().replace(/[^\d]/g, "")),
    listPrice: Number($(".ssg_list_price").first().text().replace(/[^\d]/g, "")) || null,
    isOnSale: Boolean($(".sale-badge").length),
    availability: $(".soldout").length ? "sold_out" : "available",
    deliveryType,
    eligible: deliveryType !== "other",
    rawTitle: $(".cdtl_info_tit h2").first().text().trim() || "Unknown SSG item",
    rawPayload: {
      deliveryLabel,
    },
  };
}
