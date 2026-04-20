import { MarkNotificationReadButton } from "./mark-notification-read-button";

type NotificationCardProps = {
  item: {
    id: string;
    type: "sale_started" | "price_dropped";
    winningStore: "coupang" | "ssg" | null;
    previousPrice: number | null;
    currentPrice: number | null;
    createdAt: string;
    readAt: string | null;
    productName: string;
  };
};

export function NotificationCard({ item }: NotificationCardProps) {
  const title = item.type === "price_dropped" ? "Price dropped" : "Sale started";

  return (
    <article className={`rounded-2xl p-4 shadow-sm ${item.readAt ? "bg-white" : "border border-emerald-200 bg-emerald-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{title}</p>
        {item.readAt === null ? (
          <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
            New
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-medium text-slate-950">{item.productName}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {item.previousPrice !== null && item.currentPrice !== null
          ? `${item.previousPrice}원 → ${item.currentPrice}원`
          : item.winningStore ? `${item.winningStore} is now eligible` : "-"}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {item.readAt ? "Read" : "Received"} {new Date(item.createdAt).toLocaleString("en-US")}
      </p>
      {item.readAt === null ? <MarkNotificationReadButton notificationId={item.id} /> : null}
    </article>
  );
}
