import { auth } from "@/auth";
import { listNotifications } from "@shopping/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    items: await listNotifications(session.user.id),
  });
}
