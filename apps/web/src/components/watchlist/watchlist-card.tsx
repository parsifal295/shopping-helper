import { ManualRefreshButton } from "./manual-refresh-button";
import { PollingIntervalControl } from "./polling-interval-control";
import { RemoveWatchlistButton } from "./remove-watchlist-button";

type WatchlistView = {
  id: string;
  productName: string;
  imageUrl: string | null;
  coupangPrice: number | null;
  ssgPrice: number | null;
  cheaperStore: "coupang" | "ssg" | null;
  pollingIntervalMinutes: number;
  lastCapturedAt: string | null;
  nextRunAt: string;
};

function renderStorePrice(label: string, price: number | null) {
  return price === null ? `${label} Latest info unavailable` : `${label} ${price}원`;
}

export function WatchlistCard({ item }: { item: WatchlistView }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
          IMG
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium text-slate-950">{item.productName}</h2>
          <p className="mt-1 text-sm text-slate-600">{renderStorePrice("Coupang", item.coupangPrice)}</p>
          <p className="text-sm text-slate-600">{renderStorePrice("SSG", item.ssgPrice)}</p>
          {item.cheaperStore ? (
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              {item.cheaperStore} is cheaper
            </span>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Checks every {item.pollingIntervalMinutes} min · Next check {new Date(item.nextRunAt).toLocaleString("en-US")}
          </p>
          {item.lastCapturedAt ? (
            <p className="mt-2 text-xs text-slate-500">Updated {new Date(item.lastCapturedAt).toLocaleString("en-US")}</p>
          ) : null}
          <PollingIntervalControl
            initialPollingIntervalMinutes={item.pollingIntervalMinutes}
            watchlistItemId={item.id}
          />
          <ManualRefreshButton watchlistItemId={item.id} />
          <RemoveWatchlistButton productName={item.productName} watchlistItemId={item.id} />
        </div>
      </div>
    </article>
  );
}
