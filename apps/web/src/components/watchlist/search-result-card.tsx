type SearchResultCardProps = {
  brand: string;
  title: string;
  store: "coupang" | "ssg";
};

export function SearchResultCard({ brand, title, store }: SearchResultCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{store}</p>
      <h2 className="mt-2 text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{brand}</p>
    </article>
  );
}
