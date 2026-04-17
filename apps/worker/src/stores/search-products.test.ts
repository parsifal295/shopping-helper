import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCoupangSearchResults } from "./coupang/search-products";
import { parseSsgSearchResults } from "./ssg/search-products";

describe("store search parsers", () => {
  it("returns normalized candidates from both stores", () => {
    const coupangHtml = readFileSync(resolve(process.cwd(), "test/fixtures/coupang-search.html"), "utf8");
    const ssgHtml = readFileSync(resolve(process.cwd(), "test/fixtures/ssg-search.html"), "utf8");

    const coupang = parseCoupangSearchResults(coupangHtml);
    const ssg = parseSsgSearchResults(ssgHtml);

    expect(coupang[0].title).toContain("비비고");
    expect(ssg[0].store).toBe("ssg");
  });
});
