type ProductMetaInput = {
  brand: string;
  title: string;
  options: string[];
};

export type NormalizedProductMeta = {
  brand: string;
  normalizedName: string;
  sizeValue: number;
  sizeUnit: string;
  optionKey: string;
};

const sizeRegex = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|개)/i;

export function normalizeProductMeta(input: ProductMetaInput): NormalizedProductMeta {
  const sizeMatch = input.title.match(sizeRegex);
  if (!sizeMatch) {
    throw new Error("Unable to parse product size");
  }

  const normalizedName = input.title
    .toLowerCase()
    .replace(sizeRegex, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    brand: input.brand.toLowerCase().trim(),
    normalizedName,
    sizeValue: Number(sizeMatch[1]),
    sizeUnit: sizeMatch[2].toLowerCase(),
    optionKey: input.options.map((option) => option.toLowerCase().trim()).sort().join("|"),
  };
}

export function buildSkuSignature(input: NormalizedProductMeta) {
  return [input.brand, input.normalizedName, input.sizeValue, input.sizeUnit, input.optionKey].join("::");
}

export function isExactProductMatch(left: NormalizedProductMeta, right: NormalizedProductMeta) {
  return buildSkuSignature(left) === buildSkuSignature(right);
}
