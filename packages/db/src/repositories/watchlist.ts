import { and, asc, eq, lte } from "drizzle-orm";
import { chooseCheaperOffer, normalizeProductMeta, type NormalizedProductMeta } from "@shopping/core";
import { db } from "../client";
import {
  canonicalProducts,
  linkedStoreAccounts,
  storeProductReferences,
  userWatchlistItems,
  watchlistSyncState,
} from "../schema";
import { listSnapshotsForProducts } from "./snapshots";

type Store = "coupang" | "ssg";

export type SearchCandidateGroup = {
  normalized: NormalizedProductMeta;
  displayTitle: string;
  brand: string;
  imageUrl: string | null;
  offers: {
    store: Store;
    externalProductId: string;
    productUrl: string;
    latestKnownTitle: string;
    brand: string;
    imageUrl: string | null;
  }[];
};

async function upsertCanonicalProduct(input: NormalizedProductMeta & { imageUrl?: string | null }) {
  const [existing] = await db
    .select()
    .from(canonicalProducts)
    .where(
      and(
        eq(canonicalProducts.brand, input.brand),
        eq(canonicalProducts.normalizedName, input.normalizedName),
        eq(canonicalProducts.sizeValue, input.sizeValue.toFixed(2)),
        eq(canonicalProducts.sizeUnit, input.sizeUnit),
        eq(canonicalProducts.optionKey, input.optionKey),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(canonicalProducts)
    .values({
      brand: input.brand,
      normalizedName: input.normalizedName,
      sizeValue: input.sizeValue.toFixed(2),
      sizeUnit: input.sizeUnit,
      optionKey: input.optionKey,
      imageUrl: input.imageUrl ?? null,
    })
    .returning();

  return created;
}

async function upsertStoreProductReference(input: {
  canonicalProductId: string;
  store: Store;
  externalProductId: string;
  productUrl: string;
  latestKnownTitle: string;
}) {
  const [existing] = await db
    .select()
    .from(storeProductReferences)
    .where(
      and(
        eq(storeProductReferences.store, input.store),
        eq(storeProductReferences.externalProductId, input.externalProductId),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(storeProductReferences)
    .values(input)
    .returning();

  return created;
}

async function ensureWatchlistItem(input: {
  userId: string;
  canonicalProductId: string;
  pollingIntervalMinutes: number;
}) {
  const [existing] = await db
    .select()
    .from(userWatchlistItems)
    .where(
      and(
        eq(userWatchlistItems.userId, input.userId),
        eq(userWatchlistItems.canonicalProductId, input.canonicalProductId),
      ),
    )
    .limit(1);

  const item =
    existing ??
    (
      await db
        .insert(userWatchlistItems)
        .values(input)
        .returning()
    )[0];

  const nextRunAt = new Date(Date.now() + input.pollingIntervalMinutes * 60_000);
  const [existingSync] = await db
    .select()
    .from(watchlistSyncState)
    .where(eq(watchlistSyncState.watchlistItemId, item.id))
    .limit(1);

  if (!existingSync) {
    await db.insert(watchlistSyncState).values({
      watchlistItemId: item.id,
      nextRunAt,
      lastStatus: "idle",
    });
  }

  return item;
}

export async function createWatchlistItemFromGroup(input: {
  userId: string;
  group: SearchCandidateGroup;
  pollingIntervalMinutes: number;
}) {
  const canonicalProduct = await upsertCanonicalProduct({
    ...input.group.normalized,
    imageUrl: input.group.imageUrl,
  });

  for (const offer of input.group.offers) {
    await upsertStoreProductReference({
      canonicalProductId: canonicalProduct.id,
      store: offer.store,
      externalProductId: offer.externalProductId,
      productUrl: offer.productUrl,
      latestKnownTitle: offer.latestKnownTitle,
    });
  }

  const watchlistItem = await ensureWatchlistItem({
    userId: input.userId,
    canonicalProductId: canonicalProduct.id,
    pollingIntervalMinutes: input.pollingIntervalMinutes,
  });

  return { canonicalProduct, watchlistItem };
}

export async function createWatchlistItemFromUrl(input: {
  userId: string;
  store: Store;
  externalProductId: string;
  productUrl: string;
  title: string;
  brand: string;
  options: string[];
  imageUrl?: string | null;
  pollingIntervalMinutes: number;
}) {
  const normalized = normalizeProductMeta({
    brand: input.brand,
    title: input.title,
    options: input.options,
  });

  return createWatchlistItemFromGroup({
    userId: input.userId,
    pollingIntervalMinutes: input.pollingIntervalMinutes,
    group: {
      normalized,
      displayTitle: input.title,
      brand: input.brand,
      imageUrl: input.imageUrl ?? null,
      offers: [
        {
          store: input.store,
          externalProductId: input.externalProductId,
          productUrl: input.productUrl,
          latestKnownTitle: input.title,
          brand: input.brand,
          imageUrl: input.imageUrl ?? null,
        },
      ],
    },
  });
}

export async function listWatchlistView(userId: string) {
  const items = await db
    .select({
      id: userWatchlistItems.id,
      canonicalProductId: userWatchlistItems.canonicalProductId,
      productName: canonicalProducts.normalizedName,
      brand: canonicalProducts.brand,
      imageUrl: canonicalProducts.imageUrl,
      pollingIntervalMinutes: userWatchlistItems.pollingIntervalMinutes,
      nextRunAt: watchlistSyncState.nextRunAt,
    })
    .from(userWatchlistItems)
    .innerJoin(canonicalProducts, eq(userWatchlistItems.canonicalProductId, canonicalProducts.id))
    .innerJoin(watchlistSyncState, eq(watchlistSyncState.watchlistItemId, userWatchlistItems.id))
    .where(and(eq(userWatchlistItems.userId, userId), eq(userWatchlistItems.active, true)));

  const snapshots = await listSnapshotsForProducts(
    userId,
    items.map((item) => item.canonicalProductId),
  );

  const latestByProductStore = new Map<string, { price: number; capturedAt: Date | null; store: Store }>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.canonicalProductId}:${snapshot.store}`;
    if (!latestByProductStore.has(key)) {
      latestByProductStore.set(key, {
        price: Number(snapshot.price),
        capturedAt: snapshot.capturedAt,
        store: snapshot.store,
      });
    }
  }

  return items.map((item) => {
    const coupang = latestByProductStore.get(`${item.canonicalProductId}:coupang`);
    const ssg = latestByProductStore.get(`${item.canonicalProductId}:ssg`);
    const cheaper = chooseCheaperOffer(
      [
        coupang ? { store: "coupang" as const, price: coupang.price, eligible: true } : null,
        ssg ? { store: "ssg" as const, price: ssg.price, eligible: true } : null,
      ].filter(Boolean) as { store: Store; price: number; eligible: boolean }[],
    );

    return {
      id: item.id,
      productName: `${item.brand} ${item.productName}`.trim(),
      imageUrl: item.imageUrl,
      coupangPrice: coupang?.price ?? null,
      ssgPrice: ssg?.price ?? null,
      cheaperStore: cheaper?.store ?? null,
      pollingIntervalMinutes: item.pollingIntervalMinutes,
      lastCapturedAt: [coupang?.capturedAt, ssg?.capturedAt]
        .filter(Boolean)
        .sort((left, right) => new Date(right as Date).getTime() - new Date(left as Date).getTime())[0]
        ?.toISOString() ?? null,
      nextRunAt: item.nextRunAt.toISOString(),
    };
  });
}

export async function getLinkedStoreAccount(userId: string, store: Store) {
  return db.query.linkedStoreAccounts.findFirst({
    where: and(eq(linkedStoreAccounts.userId, userId), eq(linkedStoreAccounts.store, store)),
  });
}

export async function userOwnsWatchlistItem(userId: string, watchlistItemId: string) {
  const [watchlistItem] = await db
    .select({ id: userWatchlistItems.id })
    .from(userWatchlistItems)
    .where(and(eq(userWatchlistItems.userId, userId), eq(userWatchlistItems.id, watchlistItemId)))
    .limit(1);

  return Boolean(watchlistItem);
}

export async function updateWatchlistPollingInterval(input: {
  userId: string;
  watchlistItemId: string;
  pollingIntervalMinutes: number;
  now: Date;
}) {
  return db.transaction(async (tx) => {
    const [watchlistItem] = await tx
      .update(userWatchlistItems)
      .set({
        pollingIntervalMinutes: input.pollingIntervalMinutes,
      })
      .where(
        and(
          eq(userWatchlistItems.userId, input.userId),
          eq(userWatchlistItems.id, input.watchlistItemId),
          eq(userWatchlistItems.active, true),
        ),
      )
      .returning({ id: userWatchlistItems.id });

    if (!watchlistItem) {
      return null;
    }

    const nextRunAt = new Date(input.now.getTime() + input.pollingIntervalMinutes * 60_000);
    await tx
      .update(watchlistSyncState)
      .set({
        nextRunAt,
      })
      .where(eq(watchlistSyncState.watchlistItemId, input.watchlistItemId));

    return {
      id: watchlistItem.id,
      pollingIntervalMinutes: input.pollingIntervalMinutes,
      nextRunAt,
    };
  });
}

export async function listDueWatchlistItemIds(now: Date, limit: number) {
  return db
    .select({
      watchlistItemId: watchlistSyncState.watchlistItemId,
      nextRunAt: watchlistSyncState.nextRunAt,
    })
    .from(watchlistSyncState)
    .innerJoin(userWatchlistItems, eq(userWatchlistItems.id, watchlistSyncState.watchlistItemId))
    .where(and(eq(userWatchlistItems.active, true), lte(watchlistSyncState.nextRunAt, now)))
    .orderBy(asc(watchlistSyncState.nextRunAt))
    .limit(limit);
}

export async function loadWatchlistRefreshContext(watchlistItemId: string) {
  const [watchlistItem] = await db
    .select({
      id: userWatchlistItems.id,
      userId: userWatchlistItems.userId,
      canonicalProductId: userWatchlistItems.canonicalProductId,
      pollingIntervalMinutes: userWatchlistItems.pollingIntervalMinutes,
    })
    .from(userWatchlistItems)
    .where(eq(userWatchlistItems.id, watchlistItemId))
    .limit(1);

  if (!watchlistItem) {
    throw new Error(`Watchlist item not found: ${watchlistItemId}`);
  }

  const [storeReferences, linkedAccounts] = await Promise.all([
    db
      .select({
        store: storeProductReferences.store,
        productUrl: storeProductReferences.productUrl,
      })
      .from(storeProductReferences)
      .where(eq(storeProductReferences.canonicalProductId, watchlistItem.canonicalProductId)),
    db
      .select({
        store: linkedStoreAccounts.store,
        encryptedSessionJson: linkedStoreAccounts.encryptedSessionJson,
      })
      .from(linkedStoreAccounts)
      .where(
        and(
          eq(linkedStoreAccounts.userId, watchlistItem.userId),
          eq(linkedStoreAccounts.sessionStatus, "active"),
        ),
      ),
  ]);

  return {
    userId: watchlistItem.userId,
    canonicalProductId: watchlistItem.canonicalProductId,
    pollingIntervalMinutes: watchlistItem.pollingIntervalMinutes,
    encryptedSessionJsonByStore: Object.fromEntries(
      linkedAccounts.map((account) => [account.store, account.encryptedSessionJson]),
    ) as Partial<Record<Store, string>>,
    storeReferences,
  };
}

export async function updateWatchlistSyncState(input: {
  watchlistItemId: string;
  lastRunAt: Date;
  nextRunAt: Date;
  lastStatus: "success" | "partial" | "failed";
  lastErrorCode: string | null;
}) {
  const [syncState] = await db
    .update(watchlistSyncState)
    .set({
      lastRunAt: input.lastRunAt,
      nextRunAt: input.nextRunAt,
      lastStatus: input.lastStatus,
      lastErrorCode: input.lastErrorCode,
    })
    .where(eq(watchlistSyncState.watchlistItemId, input.watchlistItemId))
    .returning();

  return syncState;
}
