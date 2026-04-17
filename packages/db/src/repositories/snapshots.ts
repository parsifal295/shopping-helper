import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { storeOfferSnapshots } from "../schema";

export async function saveSnapshot(input: {
  userId: string;
  canonicalProductId: string;
  store: "coupang" | "ssg";
  productUrl: string;
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  availability: string;
  deliveryType: "rocket_fresh" | "dawn" | "daytime" | "traders" | "other";
  rawTitle: string;
  rawPayload: Record<string, unknown>;
}) {
  const [snapshot] = await db
    .insert(storeOfferSnapshots)
    .values({
      ...input,
      price: input.price.toFixed(2),
      listPrice: input.listPrice === null ? null : input.listPrice.toFixed(2),
    })
    .returning();

  return snapshot;
}

export async function listSnapshotsForProducts(userId: string, canonicalProductIds: string[]) {
  if (canonicalProductIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(storeOfferSnapshots)
    .where(and(inArray(storeOfferSnapshots.canonicalProductId, canonicalProductIds), eq(storeOfferSnapshots.userId, userId)))
    .orderBy(desc(storeOfferSnapshots.capturedAt));
}

export async function getLatestSnapshotForProductStore(input: {
  userId: string;
  canonicalProductId: string;
  store: "coupang" | "ssg";
}) {
  const [snapshot] = await db
    .select()
    .from(storeOfferSnapshots)
    .where(
      and(
        eq(storeOfferSnapshots.userId, input.userId),
        eq(storeOfferSnapshots.canonicalProductId, input.canonicalProductId),
        eq(storeOfferSnapshots.store, input.store),
      ),
    )
    .orderBy(desc(storeOfferSnapshots.capturedAt))
    .limit(1);

  if (!snapshot) {
    return null;
  }

  return {
    ...snapshot,
    price: Number(snapshot.price),
    listPrice: snapshot.listPrice === null ? null : Number(snapshot.listPrice),
  };
}
