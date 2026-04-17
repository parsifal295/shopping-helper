import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCoupangProductDetail } from "./coupang/parse-product-detail";
import { parseSsgProductDetail } from "./ssg/parse-product-detail";

describe("product detail parsers", () => {
  it("extracts comparable metadata from Coupang and SSG detail pages", () => {
    const coupangHtml = readFileSync(resolve(process.cwd(), "test/fixtures/coupang-product.html"), "utf8");
    const ssgHtml = readFileSync(resolve(process.cwd(), "test/fixtures/ssg-product.html"), "utf8");

    const coupang = parseCoupangProductDetail(coupangHtml);
    const ssg = parseSsgProductDetail(ssgHtml);

    expect(coupang.brand).toBe("CJ");
    expect(coupang.title).toContain("왕교자");
    expect(ssg.externalProductId).toBe("ssg-item-1");
    expect(ssg.title).toContain("왕교자");
  });
});
