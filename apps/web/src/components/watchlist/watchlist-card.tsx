type WatchlistView = {
  id: string;
  productName: string;
  imageUrl: string | null;
  coupangPrice: number | null;
  ssgPrice: number | null;
  cheaperStore: "coupang" | "ssg" | null;
  lastCapturedAt: string | null;
};

export function WatchlistCard({ item }: { item: WatchlistView }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
          IMG
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium text-slate-950">{item.productName}</h2>
          <p className="mt-1 text-sm text-slate-600">Coupang {item.coupangPrice ?? "-"}원</p>
          <p className="text-sm text-slate-600">SSG {item.ssgPrice ?? "-"}원</p>
          {item.cheaperStore ? (
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              {item.cheaperStore} is cheaper
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
