import { ReconnectBanner } from "@/components/store-accounts/reconnect-banner";
import { StoreConnectionStatus } from "@/components/store-accounts/store-connection-status";
import { requireUser } from "@/lib/require-user";
import { storeAccountsRepository } from "@shopping/db";

export default async function ConnectionsPage() {
  const user = await requireUser();
  const accounts = await storeAccountsRepository.listByUserId(user.id);
  const byStore = new Map(accounts.map((account) => [account.store, account]));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Store connections</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste exported cookie JSON for Coupang Rocket Fresh and SSG.
        </p>
      </section>

      {(["coupang", "ssg"] as const).map((store) => (
        <div className="space-y-3" key={store}>
          {byStore.get(store)?.sessionStatus === "reauth_required" ? <ReconnectBanner store={store} /> : null}
          <form action={`/api/store-accounts/${store}`} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium capitalize text-slate-700">{store}</label>
              <StoreConnectionStatus
                account={
                  byStore.get(store)
                    ? {
                        sessionStatus: byStore.get(store)!.sessionStatus,
                        lastValidatedAt: byStore.get(store)!.lastValidatedAt?.toISOString() ?? null,
                        reauthRequiredAt: byStore.get(store)!.reauthRequiredAt?.toISOString() ?? null,
                      }
                    : null
                }
              />
            </div>

            <textarea
              className="min-h-40 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none"
              name="cookieJson"
            />

            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
              type="submit"
            >
              Save {store} session
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
