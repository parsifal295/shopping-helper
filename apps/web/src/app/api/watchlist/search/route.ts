import {
  buildSkuSignature,
  getShoppingEnv,
  normalizeProductMeta,
  parseCoupangSearchResults,
  parseSsgSearchResults,
} from "@shopping/core";
import { auth } from "@/auth";
import { fetchLinkedStorePage } from "@/lib/fetch-linked-store-page";
import { getLinkedStoreAccount, type SearchCandidateGroup } from "@shopping/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const query = String(formData.get("query") ?? "");

  const [coupangAccount, ssgAccount] = await Promise.all([
    getLinkedStoreAccount(session.user.id, "coupang"),
    getLinkedStoreAccount(session.user.id, "ssg"),
  ]);

  const groups = new Map<string, SearchCandidateGroup>();

  const tasks = [
    coupangAccount
      ? (async () => {
          const response = await fetchLinkedStorePage({
            url: `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`,
            encryptedSessionJson: coupangAccount.encryptedSessionJson,
            encryptionKey: getShoppingEnv().APP_ENCRYPTION_KEY,
          });
          if (!response.ok) return [];
          return parseCoupangSearchResults(await response.text());
        })()
      : Promise.resolve([]),
    ssgAccount
      ? (async () => {
          const response = await fetchLinkedStorePage({
            url: `https://www.ssg.com/search.ssg?target=all&query=${encodeURIComponent(query)}`,
            encryptedSessionJson: ssgAccount.encryptedSessionJson,
            encryptionKey: getShoppingEnv().APP_ENCRYPTION_KEY,
          });
          if (!response.ok) return [];
          return parseSsgSearchResults(await response.text());
        })()
      : Promise.resolve([]),
  ];

  const [coupangResults, ssgResults] = await Promise.all(tasks);

  for (const result of [...coupangResults, ...ssgResults]) {
    try {
      const normalized = normalizeProductMeta({
        brand: result.brand,
        title: result.title,
        options: [],
      });
      const signature = buildSkuSignature(normalized);
      const existing = groups.get(signature);
      const offer = {
        store: result.store,
        externalProductId: result.externalProductId,
        productUrl: result.productUrl,
        latestKnownTitle: result.title,
        brand: result.brand,
        imageUrl: result.imageUrl || null,
      };

      if (existing) {
        existing.offers.push(offer);
      } else {
        groups.set(signature, {
          normalized,
          displayTitle: result.title,
          brand: result.brand,
          imageUrl: result.imageUrl || null,
          offers: [offer],
        });
      }
    } catch {
      continue;
    }
  }

  return Response.json({ groups: [...groups.values()] });
}
