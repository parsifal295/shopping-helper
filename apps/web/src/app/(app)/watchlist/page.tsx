import { listWatchlistView } from "@shopping/db";
import { WatchlistCard } from "@/components/watchlist/watchlist-card";
import { requireUser } from "@/lib/require-user";

export default async function WatchlistPage() {
  const user = await requireUser();
  const items = await listWatchlistView(user.id);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-600">Track exact products and see the cheaper store per item.</p>
      </section>

      {items.length === 0 ? (
        <section className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          No watched products yet.
        </section>
      ) : (
        items.map((item) => <WatchlistCard item={item} key={item.id} />)
      )}
    </div>
  );
}
