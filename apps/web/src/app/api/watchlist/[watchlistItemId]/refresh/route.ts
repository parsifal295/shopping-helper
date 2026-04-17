import { auth } from "@/auth";
import { userOwnsWatchlistItem } from "@shopping/db";
import { runRefreshOnce } from "@shopping/worker";

type WatchlistRefreshRouteContext = {
  params: Promise<{
    watchlistItemId: string;
  }>;
};

export async function POST(_request: Request, context: WatchlistRefreshRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { watchlistItemId } = await context.params;
  const ownsItem = await userOwnsWatchlistItem(session.user.id, watchlistItemId);

  if (!ownsItem) {
    return Response.json({ message: "Watchlist item not found" }, { status: 404 });
  }

  const result = await runRefreshOnce(watchlistItemId);

  return Response.json(
    {
      status: result.status,
      lastErrorCode: result.lastErrorCode,
    },
    { status: 202 },
  );
}
