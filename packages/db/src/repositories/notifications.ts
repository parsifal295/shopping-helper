import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../client";
import { canonicalProducts, userNotifications } from "../schema";

export async function listNotifications(userId: string) {
  const notifications = await db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt));

  const productIds = [...new Set(notifications.map((notification) => notification.canonicalProductId))];
  const products =
    productIds.length === 0
      ? []
      : await db.select().from(canonicalProducts).where(inArray(canonicalProducts.id, productIds));
  const productById = new Map(products.map((product) => [product.id, product]));

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    winningStore: notification.winningStore,
    previousPrice: notification.previousPrice === null ? null : Number(notification.previousPrice),
    currentPrice: notification.currentPrice === null ? null : Number(notification.currentPrice),
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    productName: productById.get(notification.canonicalProductId)
      ? `${productById.get(notification.canonicalProductId)?.brand} ${productById.get(notification.canonicalProductId)?.normalizedName}`.trim()
      : "Unknown product",
  }));
}

export async function createNotification(input: {
  userId: string;
  canonicalProductId: string;
  type: "sale_started" | "price_dropped";
  winningStore: "coupang" | "ssg";
  previousPrice: number | null;
  currentPrice: number;
}) {
  const [notification] = await db
    .insert(userNotifications)
    .values({
      userId: input.userId,
      canonicalProductId: input.canonicalProductId,
      type: input.type,
      winningStore: input.winningStore,
      previousPrice: input.previousPrice === null ? null : input.previousPrice.toFixed(2),
      currentPrice: input.currentPrice.toFixed(2),
    })
    .returning();

  return notification;
}

export async function markAllNotificationsRead(userId: string, now: Date) {
  const updated = await db
    .update(userNotifications)
    .set({
      readAt: now,
    })
    .where(and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)))
    .returning({ id: userNotifications.id });

  return {
    updatedCount: updated.length,
  };
}

export async function markNotificationRead(input: {
  userId: string;
  notificationId: string;
  now: Date;
}) {
  const [updated] = await db
    .update(userNotifications)
    .set({
      readAt: input.now,
    })
    .where(
      and(
        eq(userNotifications.userId, input.userId),
        eq(userNotifications.id, input.notificationId),
        isNull(userNotifications.readAt),
      ),
    )
    .returning({ id: userNotifications.id });

  return updated ?? null;
}
