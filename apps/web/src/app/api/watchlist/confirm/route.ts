import { auth } from "@/auth";
import { createWatchlistItemFromGroup, type SearchCandidateGroup } from "@shopping/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    group: SearchCandidateGroup;
    pollingIntervalMinutes?: number;
  };

  const created = await createWatchlistItemFromGroup({
    userId: session.user.id,
    group: body.group,
    pollingIntervalMinutes: body.pollingIntervalMinutes ?? 60,
  });

  return Response.json(created, { status: 201 });
}
