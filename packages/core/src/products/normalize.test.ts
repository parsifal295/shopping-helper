import { describe, expect, it } from "vitest";
import { buildSkuSignature, isExactProductMatch, normalizeProductMeta } from "./normalize";

describe("normalizeProductMeta", () => {
  it("treats the same branded SKU as equivalent", () => {
    const left = normalizeProductMeta({
      brand: "CJ",
      title: "비비고 왕교자 1.05kg",
      options: ["냉동"],
    });

    const right = normalizeProductMeta({
      brand: "cj",
      title: "비비고 왕교자 1.05 KG",
      options: ["냉동"],
    });

    expect(buildSkuSignature(left)).toBe(buildSkuSignature(right));
    expect(isExactProductMatch(left, right)).toBe(true);
  });
});
