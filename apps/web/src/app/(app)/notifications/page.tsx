import { ReconnectBanner } from "@/components/store-accounts/reconnect-banner";
import { listNotifications } from "@shopping/db";
import { storeAccountsRepository } from "@shopping/db";
import { NotificationCard } from "@/components/notifications/notification-card";
import { requireUser } from "@/lib/require-user";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, accounts] = await Promise.all([
    listNotifications(user.id),
    storeAccountsRepository.listByUserId(user.id),
  ]);
  const reconnectStores = accounts.filter((account) => account.sessionStatus === "reauth_required");

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">Price drops and sale starts for your watched products.</p>
      </section>

      {reconnectStores.map((account) => (
        <ReconnectBanner key={account.store} store={account.store} />
      ))}

      {items.length === 0 ? (
        <section className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          No alerts yet.
        </section>
      ) : (
        items.map((item) => <NotificationCard item={item} key={item.id} />)
      )}
    </div>
  );
}
