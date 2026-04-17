import type { SearchCandidateGroup } from "@shopping/db";

type SearchResultCardProps = {
  group: SearchCandidateGroup;
  isSaving: boolean;
  onAdd(): void;
};

export function SearchResultCard({ group, isSaving, onAdd }: SearchResultCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{group.brand}</p>
          <h2 className="mt-2 text-sm font-semibold text-slate-950">{group.displayTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.offers.map((offer) => (
              <span
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                key={`${offer.store}:${offer.externalProductId}`}
              >
                {offer.store}
              </span>
            ))}
          </div>
        </div>
        <button
          className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
          disabled={isSaving}
          onClick={onAdd}
          type="button"
        >
          {isSaving ? "Adding..." : "Add to watchlist"}
        </button>
      </div>
    </article>
  );
}
