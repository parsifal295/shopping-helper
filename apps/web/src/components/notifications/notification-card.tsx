type NotificationCardProps = {
  item: {
    id: string;
    type: "sale_started" | "price_dropped";
    winningStore: "coupang" | "ssg" | null;
    previousPrice: number | null;
    currentPrice: number | null;
    createdAt: string;
    productName: string;
  };
};

export function NotificationCard({ item }: NotificationCardProps) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{item.type}</p>
      <h2 className="mt-2 font-medium text-slate-950">{item.productName}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {item.previousPrice !== null && item.currentPrice !== null
          ? `${item.previousPrice}원 → ${item.currentPrice}원`
          : item.winningStore ?? "-"}
      </p>
    </article>
  );
}
