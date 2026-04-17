import { auth } from "@/auth";
import { updateWatchlistPollingInterval } from "@shopping/db";

type WatchlistPollingIntervalRouteContext = {
  params: Promise<{
    watchlistItemId: string;
  }>;
};

export async function PATCH(request: Request, context: WatchlistPollingIntervalRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    pollingIntervalMinutes?: number;
  };
  const pollingIntervalMinutes = Number(body.pollingIntervalMinutes);

  if (
    !Number.isInteger(pollingIntervalMinutes) ||
    pollingIntervalMinutes < 15 ||
    pollingIntervalMinutes > 1_440
  ) {
    return Response.json(
      { message: "Polling cadence must be between 15 and 1440 minutes" },
      { status: 400 },
    );
  }

  const { watchlistItemId } = await context.params;
  const updated = await updateWatchlistPollingInterval({
    userId: session.user.id,
    watchlistItemId,
    pollingIntervalMinutes,
    now: new Date(),
  });

  if (!updated) {
    return Response.json({ message: "Watchlist item not found" }, { status: 404 });
  }

  return Response.json(
    {
      watchlistItemId: updated.id,
      pollingIntervalMinutes: updated.pollingIntervalMinutes,
      nextRunAt: updated.nextRunAt.toISOString(),
    },
    { status: 200 },
  );
}
