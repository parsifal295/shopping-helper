import { auth } from "@/auth";
import { getShoppingEnv, parseCookieImport, encryptSessionJson } from "@shopping/core";
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

  const record = await storeAccountsRepository.upsert({
    userId: session.user.id,
    store,
    encryptedSessionJson: encryptSessionJson(JSON.stringify(cookies), getShoppingEnv().APP_ENCRYPTION_KEY),
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
