import { buildNotifications } from "@shopping/core";

type Store = "coupang" | "ssg";

type PreviousSnapshot = {
  price: number;
  isOnSale: boolean;
} | null;

type CollectedOffer = {
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  availability: string;
  deliveryType: "rocket_fresh" | "dawn" | "daytime" | "traders" | "other";
  rawTitle: string;
  rawPayload: Record<string, unknown>;
  eligible: boolean;
};

export async function refreshWatchlistItem(
  deps: {
    loadWatchlistItem(id: string): Promise<{
      userId: string;
      canonicalProductId: string;
      pollingIntervalMinutes: number;
      encryptedSessionJsonByStore: Partial<Record<Store, string>>;
      storeReferences: { store: Store; productUrl: string }[];
    }>;
    collectOffer(input: {
      store: Store;
      productUrl: string;
      encryptedSessionJson: string;
    }): Promise<CollectedOffer>;
    loadPreviousSnapshot(input: {
      userId: string;
      canonicalProductId: string;
      store: Store;
    }): Promise<PreviousSnapshot>;
    saveSnapshot(input: {
      userId: string;
      canonicalProductId: string;
      store: Store;
      productUrl: string;
      price: number;
      listPrice: number | null;
      isOnSale: boolean;
      availability: string;
      deliveryType: "rocket_fresh" | "dawn" | "daytime" | "traders" | "other";
      rawTitle: string;
      rawPayload: Record<string, unknown>;
    }): Promise<unknown>;
    createNotification(input: {
      userId: string;
      canonicalProductId: string;
      type: "sale_started" | "price_dropped";
      winningStore: Store;
      previousPrice: number | null;
      currentPrice: number;
    }): Promise<unknown>;
    logCollectionEvent(input: {
      watchlistItemId: string;
      store: Store;
      status: "success" | "error";
      errorCode?: string;
    }): void;
    updateSyncState(input: {
      watchlistItemId: string;
      lastRunAt: Date;
      nextRunAt: Date;
      lastStatus: "success" | "partial" | "failed";
      lastErrorCode: string | null;
    }): Promise<unknown>;
  },
  watchlistItemId: string,
  now = new Date(),
) {
  const watchlistItem = await deps.loadWatchlistItem(watchlistItemId);
  const nextRunAt = new Date(now.getTime() + watchlistItem.pollingIntervalMinutes * 60_000);
  let successfulStores = 0;
  let processedStores = 0;
  let firstErrorCode: string | null = null;

  for (const reference of watchlistItem.storeReferences) {
    const encryptedSessionJson = watchlistItem.encryptedSessionJsonByStore[reference.store];
    if (!encryptedSessionJson) {
      continue;
    }

    try {
      const offer = await deps.collectOffer({
        store: reference.store,
        productUrl: reference.productUrl,
        encryptedSessionJson,
      });

      processedStores += 1;

      if (!offer.eligible) {
        continue;
      }

      const previous = await deps.loadPreviousSnapshot({
        userId: watchlistItem.userId,
        canonicalProductId: watchlistItem.canonicalProductId,
        store: reference.store,
      });

      await deps.saveSnapshot({
        userId: watchlistItem.userId,
        canonicalProductId: watchlistItem.canonicalProductId,
        store: reference.store,
        productUrl: reference.productUrl,
        ...offer,
      });

      successfulStores += 1;
      deps.logCollectionEvent({
        watchlistItemId,
        store: reference.store,
        status: "success",
      });

      const notifications = buildNotifications({
        previous:
          previous === null
            ? null
            : {
                store: reference.store,
                price: previous.price,
                isOnSale: previous.isOnSale,
              },
        current: {
          store: reference.store,
          price: offer.price,
          isOnSale: offer.isOnSale,
        },
      });

      for (const notification of notifications) {
        await deps.createNotification({
          userId: watchlistItem.userId,
          canonicalProductId: watchlistItem.canonicalProductId,
          type: notification.type,
          winningStore: notification.winningStore,
          previousPrice: previous?.price ?? null,
          currentPrice: offer.price,
        });
      }
    } catch {
      const errorCode = `collect_${reference.store}`;
      firstErrorCode ??= errorCode;
      deps.logCollectionEvent({
        watchlistItemId,
        store: reference.store,
        status: "error",
        errorCode,
      });
    }
  }

  const lastStatus: "success" | "partial" | "failed" =
    firstErrorCode === null ? "success" :
    successfulStores > 0 || processedStores > 0 ? "partial" :
    "failed";

  await deps.updateSyncState({
    watchlistItemId,
    lastRunAt: now,
    nextRunAt,
    lastStatus,
    lastErrorCode: firstErrorCode,
  });

  return {
    status: lastStatus,
    lastErrorCode: firstErrorCode,
    processedStores,
    successfulStores,
  };
}
