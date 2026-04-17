import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const storeEnum = pgEnum("store", ["coupang", "ssg"]);
export const deliveryTypeEnum = pgEnum("delivery_type", ["rocket_fresh", "dawn", "daytime", "traders", "other"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "reauth_required"]);
export const notificationTypeEnum = pgEnum("notification_type", ["sale_started", "price_dropped"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const linkedStoreAccounts = pgTable(
  "linked_store_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    store: storeEnum("store").notNull(),
    encryptedSessionJson: text("encrypted_session_json").notNull(),
    sessionStatus: sessionStatusEnum("session_status").default("active").notNull(),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
    reauthRequiredAt: timestamp("reauth_required_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userStoreUnique: uniqueIndex("linked_store_accounts_user_store_uq").on(table.userId, table.store),
  }),
);

export const canonicalProducts = pgTable(
  "canonical_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brand: varchar("brand", { length: 120 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
    sizeValue: numeric("size_value", { precision: 10, scale: 2 }).notNull(),
    sizeUnit: varchar("size_unit", { length: 32 }).notNull(),
    optionKey: varchar("option_key", { length: 255 }).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    skuUnique: uniqueIndex("canonical_products_sku_uq").on(
      table.brand,
      table.normalizedName,
      table.sizeValue,
      table.sizeUnit,
      table.optionKey,
    ),
  }),
);

export const storeProductReferences = pgTable(
  "store_product_references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    canonicalProductId: uuid("canonical_product_id")
      .notNull()
      .references(() => canonicalProducts.id, { onDelete: "cascade" }),
    store: storeEnum("store").notNull(),
    externalProductId: varchar("external_product_id", { length: 255 }).notNull(),
    productUrl: text("product_url").notNull(),
    latestKnownTitle: text("latest_known_title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    storeExternalUnique: uniqueIndex("store_product_references_store_external_uq").on(table.store, table.externalProductId),
  }),
);

export const userWatchlistItems = pgTable(
  "user_watchlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canonicalProductId: uuid("canonical_product_id")
      .notNull()
      .references(() => canonicalProducts.id, { onDelete: "cascade" }),
    pollingIntervalMinutes: integer("polling_interval_minutes").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userProductUnique: uniqueIndex("user_watchlist_items_user_product_uq").on(table.userId, table.canonicalProductId),
  }),
);

export const watchlistSyncState = pgTable(
  "watchlist_sync_state",
  {
    watchlistItemId: uuid("watchlist_item_id")
      .primaryKey()
      .references(() => userWatchlistItems.id, { onDelete: "cascade" }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastStatus: varchar("last_status", { length: 32 }).default("idle").notNull(),
    lastErrorCode: varchar("last_error_code", { length: 64 }),
  },
  (table) => ({
    nextRunIdx: index("watchlist_sync_state_next_run_idx").on(table.nextRunAt),
  }),
);

export const storeOfferSnapshots = pgTable("store_offer_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  canonicalProductId: uuid("canonical_product_id")
    .notNull()
    .references(() => canonicalProducts.id, { onDelete: "cascade" }),
  store: storeEnum("store").notNull(),
  productUrl: text("product_url").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  listPrice: numeric("list_price", { precision: 12, scale: 2 }),
  isOnSale: boolean("is_on_sale").default(false).notNull(),
  deliveryType: deliveryTypeEnum("delivery_type").notNull(),
  availability: varchar("availability", { length: 32 }).notNull(),
  rawTitle: text("raw_title").notNull(),
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userNotifications = pgTable("user_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  canonicalProductId: uuid("canonical_product_id")
    .notNull()
    .references(() => canonicalProducts.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  winningStore: storeEnum("winning_store"),
  previousPrice: numeric("previous_price", { precision: 12, scale: 2 }),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
});
