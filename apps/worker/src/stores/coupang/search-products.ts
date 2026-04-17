import * as cheerio from "cheerio";

export function parseCoupangSearchResults(html: string) {
  const $ = cheerio.load(html);

  return $(".search-product")
    .slice(0, 8)
    .map((_, element) => ({
      store: "coupang" as const,
      externalProductId: $(element).attr("data-product-id") ?? "",
      title: $(element).find(".name").text().trim(),
      brand: $(element).find(".brand").text().trim(),
      productUrl: $(element).find("a").attr("href") ?? "",
      imageUrl: $(element).find("img").attr("src") ?? "",
    }))
    .get();
}
