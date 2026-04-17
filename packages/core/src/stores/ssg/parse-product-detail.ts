import * as cheerio from "cheerio";

export function parseSsgProductDetail(html: string) {
  const $ = cheerio.load(html);

  return {
    externalProductId: $("body").attr("data-item-id") ?? "",
    brand: $(".cdtl_info_tit em").first().text().trim(),
    title: $(".cdtl_info_tit h2").first().text().trim(),
    options: $(".cdtl_clydeliv .delivery-badge")
      .map((_, element) => $(element).text().trim())
      .get(),
    imageUrl: $(".cdtl_item_image img").attr("src") ?? "",
  };
}
