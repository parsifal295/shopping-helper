export function ReconnectBanner({ store }: { store: "coupang" | "ssg" }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">{store.toUpperCase()} session expired</p>
      <a
        className="mt-3 inline-flex rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white"
        href="/settings/connections"
      >
        Reconnect {store.toUpperCase()}
      </a>
    </div>
  );
}
