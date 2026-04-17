import { pathToFileURL } from "node:url";
import { getShoppingEnv } from "@shopping/core";
import { refreshWatchlistItem as runRefreshWatchlistItem } from "./jobs/refresh-watchlist-item";
import { logCollectionEvent } from "./logging/collection-logger";
import { claimDueWatchlistItems } from "./scheduler/claim-due-watchlist-items";
import { collectCoupangOffer } from "./stores/coupang/collect-offer";
import { collectSsgOffer } from "./stores/ssg/collect-offer";

type WorkerCycleDeps = {
  claimDueWatchlistItems(now: Date, limit: number): Promise<{ watchlistItemId: string }[]>;
  refreshWatchlistItem(watchlistItemId: string, now: Date): Promise<{ status: "success" | "partial" | "failed" }>;
};

export async function runWorkerCycle(
  deps: WorkerCycleDeps,
  now = new Date(),
  limit = 10,
) {
  const dueItems = await deps.claimDueWatchlistItems(now, limit);
  const summary = {
    claimed: dueItems.length,
    success: 0,
    partial: 0,
    failed: 0,
  };

  for (const item of dueItems) {
    try {
      const result = await deps.refreshWatchlistItem(item.watchlistItemId, now);
      summary[result.status] += 1;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}

async function createWorkerDependencies(): Promise<WorkerCycleDeps> {
  const env = getShoppingEnv();
  const {
    createNotification,
    getLatestSnapshotForProductStore,
    listDueWatchlistItemIds,
    loadWatchlistRefreshContext,
    saveSnapshot,
    storeAccountsRepository,
    updateWatchlistSyncState,
  } = await import("@shopping/db");

  return {
    claimDueWatchlistItems(now, limit) {
      return claimDueWatchlistItems(
        {
          selectDueRows: listDueWatchlistItemIds,
        },
        now,
        limit,
      );
    },
    refreshWatchlistItem(watchlistItemId, now) {
      return runRefreshWatchlistItem(
        {
          loadWatchlistItem: loadWatchlistRefreshContext,
          loadPreviousSnapshot: getLatestSnapshotForProductStore,
          saveSnapshot,
          createNotification,
          setStoreSessionStatus: storeAccountsRepository.setSessionStatus,
          logCollectionEvent,
          updateSyncState: updateWatchlistSyncState,
          collectOffer(input) {
            return input.store === "coupang"
              ? collectCoupangOffer({
                  productUrl: input.productUrl,
                  encryptedSessionJson: input.encryptedSessionJson,
                  encryptionKey: env.APP_ENCRYPTION_KEY,
                })
              : collectSsgOffer({
                  productUrl: input.productUrl,
                  encryptedSessionJson: input.encryptedSessionJson,
                  encryptionKey: env.APP_ENCRYPTION_KEY,
                });
          },
        },
        watchlistItemId,
        now,
      );
    },
  };
}

async function main() {
  const summary = await runWorkerCycle(await createWorkerDependencies());
  console.log(JSON.stringify(summary));
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
