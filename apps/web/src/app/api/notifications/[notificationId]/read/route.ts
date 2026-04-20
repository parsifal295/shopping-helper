import { auth } from "@/auth";
import { markNotificationRead } from "@shopping/db";

type NotificationReadRouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function POST(_request: Request, context: NotificationReadRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { notificationId } = await context.params;
  const updated = await markNotificationRead({
    userId: session.user.id,
    notificationId,
    now: new Date(),
  });

  if (!updated) {
    return Response.json({ message: "Notification not found" }, { status: 404 });
  }

  return Response.json(
    {
      notificationId: updated.id,
    },
    { status: 200 },
  );
}
