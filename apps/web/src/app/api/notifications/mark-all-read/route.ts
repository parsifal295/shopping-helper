import { auth } from "@/auth";
import { markAllNotificationsRead } from "@shopping/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await markAllNotificationsRead(session.user.id, new Date());

  return Response.json(result, { status: 200 });
}
