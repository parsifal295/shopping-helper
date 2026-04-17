import { getShoppingEnv, parseCoupangProductDetail, parseSsgProductDetail } from "@shopping/core";
import { auth } from "@/auth";
import { fetchLinkedStorePage } from "@/lib/fetch-linked-store-page";
import { createWatchlistItemFromUrl, getLinkedStoreAccount } from "@shopping/db";

function inferStoreFromUrl(productUrl: string): "coupang" | "ssg" {
  if (productUrl.includes("coupang.com")) return "coupang";
  if (productUrl.includes("ssg.com")) return "ssg";
  throw new Error("Unsupported store URL");
}

function inferExternalProductId(store: "coupang" | "ssg", productUrl: string, fallback: string) {
  const url = new URL(productUrl);
  if (store === "coupang") {
    return productUrl.split("/").filter(Boolean).pop() ?? fallback;
  }
  return url.searchParams.get("itemId") ?? fallback;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const productUrl = String(formData.get("productUrl") ?? "");
  const pollingIntervalMinutes = Number(formData.get("pollingIntervalMinutes") ?? 60);
  const store = inferStoreFromUrl(productUrl);
  const linkedAccount = await getLinkedStoreAccount(session.user.id, store);

  if (!linkedAccount) {
    return Response.json({ message: `No linked ${store} account found` }, { status: 400 });
  }

  const response = await fetchLinkedStorePage({
    url: productUrl,
    encryptedSessionJson: linkedAccount.encryptedSessionJson,
    encryptionKey: getShoppingEnv().APP_ENCRYPTION_KEY,
  });

  if (!response.ok) {
    return Response.json({ message: `Failed to fetch ${store} product page` }, { status: 502 });
  }

  const html = await response.text();
  const detail = store === "coupang" ? parseCoupangProductDetail(html) : parseSsgProductDetail(html);

  const created = await createWatchlistItemFromUrl({
    userId: session.user.id,
    store,
    externalProductId: inferExternalProductId(store, productUrl, detail.externalProductId),
    productUrl,
    title: detail.title,
    brand: detail.brand,
    options: detail.options,
    imageUrl: detail.imageUrl,
    pollingIntervalMinutes,
  });

  return Response.json(created, { status: 201 });
}
