type DueRow = {
  watchlistItemId: string;
  nextRunAt: Date;
};

export async function claimDueWatchlistItems(
  repo: { selectDueRows(now: Date, limit: number): Promise<DueRow[]> },
  now: Date,
  limit: number,
) {
  return repo.selectDueRows(now, limit);
}
