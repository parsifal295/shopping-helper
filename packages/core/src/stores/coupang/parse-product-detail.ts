import * as cheerio from "cheerio";

export function parseCoupangProductDetail(html: string) {
  const $ = cheerio.load(html);

  return {
    externalProductId: $("body").attr("data-product-id") ?? "",
    brand: $(".prod-brand-name").first().text().trim(),
    title: $(".prod-buy-header__title").first().text().trim(),
    options: $(".prod-option .name")
      .map((_, element) => $(element).text().trim())
      .get(),
    imageUrl: $(".prod-image__detail").attr("src") ?? "",
  };
}
