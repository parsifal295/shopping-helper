import * as cheerio from "cheerio";

export function parseSsgSearchResults(html: string) {
  const $ = cheerio.load(html);

  return $(".ssg-search-item")
    .slice(0, 8)
    .map((_, element) => ({
      store: "ssg" as const,
      externalProductId: $(element).attr("data-product-id") ?? "",
      title: $(element).find(".name").text().trim(),
      brand: $(element).find(".brand").text().trim(),
      productUrl: $(element).find("a").attr("href") ?? "",
      imageUrl: $(element).find("img").attr("src") ?? "",
    }))
    .get();
}
