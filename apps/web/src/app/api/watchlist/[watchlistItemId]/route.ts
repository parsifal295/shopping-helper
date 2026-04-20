import { auth } from "@/auth";
import { deactivateWatchlistItem } from "@shopping/db";

type WatchlistItemRouteContext = {
  params: Promise<{
    watchlistItemId: string;
  }>;
};

export async function DELETE(_request: Request, context: WatchlistItemRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { watchlistItemId } = await context.params;
  const removed = await deactivateWatchlistItem({
    userId: session.user.id,
    watchlistItemId,
  });

  if (!removed) {
    return Response.json({ message: "Watchlist item not found" }, { status: 404 });
  }

  return Response.json(
    {
      watchlistItemId: removed.id,
    },
    { status: 200 },
  );
}
