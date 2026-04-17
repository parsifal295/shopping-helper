import { auth } from "@/auth";
import { getShoppingEnv, parseCookieImport, encryptSessionJson } from "@shopping/core";
import { fetchLinkedStorePage } from "@/lib/fetch-linked-store-page";
import { storeAccountsRepository } from "@shopping/db";

type StoreRouteContext = {
  params: Promise<{
    store: "coupang" | "ssg";
  }>;
};

export async function POST(request: Request, context: StoreRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const { store } = await context.params;
  const cookieJson = String(formData.get("cookieJson") ?? "");
  const cookies = parseCookieImport(cookieJson);
  const encryptedSessionJson = encryptSessionJson(JSON.stringify(cookies), getShoppingEnv().APP_ENCRYPTION_KEY);
  const validationResponse = await fetchLinkedStorePage({
    url: store === "coupang" ? "https://www.coupang.com/np/campaigns/82" : "https://www.ssg.com/",
    encryptedSessionJson,
    encryptionKey: getShoppingEnv().APP_ENCRYPTION_KEY,
    userAgent: "shopping-helper-connection-validator",
  });
  const validationBody = validationResponse.ok ? await validationResponse.text() : "";
  const sessionStatus =
    validationResponse.ok &&
    (store === "coupang"
      ? validationBody.includes("로켓프레시") || validationBody.includes("Rocket Fresh")
      : validationBody.includes("새벽배송") || validationBody.includes("쓱배송") || validationBody.includes("트레이더스"))
      ? "active"
      : "reauth_required";

  const record = await storeAccountsRepository.upsert({
    userId: session.user.id,
    store,
    encryptedSessionJson,
    sessionStatus,
  });

  return Response.json(
    {
      id: record?.id,
      store: record?.store,
      sessionStatus: record?.sessionStatus,
    },
    { status: 201 },
  );
}
