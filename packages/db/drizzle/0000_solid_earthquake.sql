CREATE TYPE "public"."delivery_type" AS ENUM('rocket_fresh', 'dawn', 'daytime', 'traders', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('sale_started', 'price_dropped');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'reauth_required');--> statement-breakpoint
CREATE TYPE "public"."store" AS ENUM('coupang', 'ssg');--> statement-breakpoint
CREATE TABLE "canonical_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(120) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"size_value" numeric(10, 2) NOT NULL,
	"size_unit" varchar(32) NOT NULL,
	"option_key" varchar(255) NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_store_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store" "store" NOT NULL,
	"encrypted_session_json" text NOT NULL,
	"session_status" "session_status" DEFAULT 'active' NOT NULL,
	"last_validated_at" timestamp with time zone,
	"reauth_required_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_offer_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_product_id" uuid NOT NULL,
	"store" "store" NOT NULL,
	"product_url" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"list_price" numeric(12, 2),
	"is_on_sale" boolean DEFAULT false NOT NULL,
	"delivery_type" "delivery_type" NOT NULL,
	"availability" varchar(32) NOT NULL,
	"raw_title" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_product_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_product_id" uuid NOT NULL,
	"store" "store" NOT NULL,
	"external_product_id" varchar(255) NOT NULL,
	"product_url" text NOT NULL,
	"latest_known_title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_product_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"winning_store" "store",
	"previous_price" numeric(12, 2),
	"current_price" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_watchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_product_id" uuid NOT NULL,
	"polling_interval_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchlist_sync_state" (
	"watchlist_item_id" uuid PRIMARY KEY NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_status" varchar(32) DEFAULT 'idle' NOT NULL,
	"last_error_code" varchar(64)
);
--> statement-breakpoint
ALTER TABLE "linked_store_accounts" ADD CONSTRAINT "linked_store_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_offer_snapshots" ADD CONSTRAINT "store_offer_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_offer_snapshots" ADD CONSTRAINT "store_offer_snapshots_canonical_product_id_canonical_products_id_fk" FOREIGN KEY ("canonical_product_id") REFERENCES "public"."canonical_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_product_references" ADD CONSTRAINT "store_product_references_canonical_product_id_canonical_products_id_fk" FOREIGN KEY ("canonical_product_id") REFERENCES "public"."canonical_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_canonical_product_id_canonical_products_id_fk" FOREIGN KEY ("canonical_product_id") REFERENCES "public"."canonical_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist_items" ADD CONSTRAINT "user_watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist_items" ADD CONSTRAINT "user_watchlist_items_canonical_product_id_canonical_products_id_fk" FOREIGN KEY ("canonical_product_id") REFERENCES "public"."canonical_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_sync_state" ADD CONSTRAINT "watchlist_sync_state_watchlist_item_id_user_watchlist_items_id_fk" FOREIGN KEY ("watchlist_item_id") REFERENCES "public"."user_watchlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canonical_products_sku_uq" ON "canonical_products" USING btree ("brand","normalized_name","size_value","size_unit","option_key");--> statement-breakpoint
CREATE UNIQUE INDEX "linked_store_accounts_user_store_uq" ON "linked_store_accounts" USING btree ("user_id","store");--> statement-breakpoint
CREATE UNIQUE INDEX "store_product_references_store_external_uq" ON "store_product_references" USING btree ("store","external_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_watchlist_items_user_product_uq" ON "user_watchlist_items" USING btree ("user_id","canonical_product_id");--> statement-breakpoint
CREATE INDEX "watchlist_sync_state_next_run_idx" ON "watchlist_sync_state" USING btree ("next_run_at");