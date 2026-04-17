import { auth } from "@/auth";
import { listWatchlistView } from "@shopping/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    items: await listWatchlistView(session.user.id),
  });
}
