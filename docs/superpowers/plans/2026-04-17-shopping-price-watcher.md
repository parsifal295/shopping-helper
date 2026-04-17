# Shopping Price Watcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript mobile-first web app that lets authenticated users watch exact grocery products across Coupang Rocket Fresh and SSG, compare the latest valid price per item, and receive in-app alerts when a watched product goes on sale or drops in price.

**Architecture:** Use a pnpm TypeScript workspace with a Next.js web app, a shared core domain package for exact-match and pricing logic, a shared database package for PostgreSQL schema access, and a TypeScript HTTP parsing worker that validates linked store sessions, resolves products, and refreshes watchlist snapshots on a schedule through authenticated requests with imported cookies.

**Tech Stack:** pnpm, Next.js App Router, React, Tailwind CSS, Auth.js credentials provider, PostgreSQL, Drizzle ORM, Zod, Vitest, Cheerio, Node fetch, bcrypt, Node crypto, @playwright/test

---

## Assumptions Locked for This Plan

- V1 retailer account linking uses **cookie/session JSON import** instead of collecting raw Coupang or SSG passwords.
- App authentication is **invite-only email/password** with Auth.js credentials and JWT sessions.
- Background collection runs in a **separate TypeScript worker process** in the same workspace.
- Scheduler state is stored in PostgreSQL to avoid adding Redis or third-party job infrastructure in V1.
- The collector is **parser-only**. There is no browser automation fallback in V1. If a store response cannot be parsed, the run fails and is surfaced for maintenance.

## Target File Structure

### Root workspace

- `package.json`: workspace scripts for linting, testing, database commands, and local dev
- `pnpm-workspace.yaml`: workspace package discovery
- `tsconfig.base.json`: shared TypeScript compiler settings
- `.gitignore`: ignore Next.js output, env files, Playwright output, and local brainstorm artifacts
- `.env.example`: required environment variables
- `docker-compose.yml`: local PostgreSQL for development and tests

### Web app

- `apps/web/src/app/(auth)/sign-in/page.tsx`: credentials sign-in page
- `apps/web/src/app/(app)/layout.tsx`: protected mobile shell
- `apps/web/src/app/(app)/watchlist/page.tsx`: watchlist dashboard
- `apps/web/src/app/(app)/watchlist/add/page.tsx`: add product by search or URL
- `apps/web/src/app/(app)/notifications/page.tsx`: in-app notifications
- `apps/web/src/app/(app)/settings/connections/page.tsx`: store connection management
- `apps/web/src/app/api/**/route.ts`: API routes for sessions, watchlist, notifications, and manual refresh
- `apps/web/src/components/**`: reusable mobile UI pieces
- `apps/web/src/lib/**`: auth helpers, route guards, API helpers

### Shared packages

- `packages/core/src/env.ts`: typed env parsing
- `packages/core/src/products/**`: normalization, exact-match, and scoring logic
- `packages/core/src/pricing/**`: cheaper-store and alert generation logic
- `packages/core/src/store-sessions/**`: cookie import parsing and encryption helpers
- `packages/db/src/schema.ts`: Drizzle schema
- `packages/db/src/client.ts`: database client
- `packages/db/src/repositories/**`: app-level queries and mutations

### Worker

- `apps/worker/src/index.ts`: worker entrypoint
- `apps/worker/src/http/**`: authenticated request helpers using imported store cookies
- `apps/worker/src/scheduler/**`: due-job selection and next-run updates
- `apps/worker/src/stores/coupang/**`: product resolution and offer collection for Coupang
- `apps/worker/src/stores/ssg/**`: product resolution and offer collection for SSG
- `apps/worker/src/jobs/**`: watchlist resolve and refresh jobs
- `apps/worker/test/fixtures/**`: saved HTML fixtures for parser contract tests

## Task 1: Bootstrap the pnpm Workspace and Shared TypeScript Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`
- Modify: `apps/web/package.json`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/env.ts`
- Test: `packages/core/src/env.test.ts`

- [ ] **Step 1: Write the failing env parser test**

```ts
// packages/core/src/env.test.ts
import { describe, expect, it } from "vitest";
import { parseShoppingEnv } from "./env";

describe("parseShoppingEnv", () => {
  it("rejects missing encryption material", () => {
    expect(() =>
      parseShoppingEnv({
        DATABASE_URL: "https://example.com/not-a-real-db",
        AUTH_SECRET: "a".repeat(32),
        APP_ENCRYPTION_KEY: "",
      }),
    ).toThrow(/APP_ENCRYPTION_KEY/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @shopping/core test -- run src/env.test.ts`

Expected: FAIL with `Cannot find module './env'` or `No projects matched the filters`.

- [ ] **Step 3: Create the workspace skeleton and minimal env implementation**

Run:

```bash
pnpm dlx create-next-app@latest apps/web --ts --eslint --tailwind --app --src-dir --use-pnpm --import-alias "@/*"
```

```json
// package.json
{
  "name": "shopping-helper",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "dev:web": "pnpm --filter @shopping/web dev",
    "dev:worker": "pnpm --filter @shopping/worker dev",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "test:e2e": "pnpm --filter @shopping/web test:e2e",
    "db:generate": "pnpm --filter @shopping/db db:generate",
    "db:migrate": "pnpm --filter @shopping/db db:migrate",
    "db:seed": "pnpm --filter @shopping/db db:seed"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// apps/web/package.json
{
  "name": "@shopping/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "vitest": "^3.0.5"
  }
}
```

```json
// packages/core/package.json
{
  "name": "@shopping/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "vitest": "^3.0.5",
    "typescript": "^5.7.3"
  }
}
```

```json
// apps/worker/package.json
{
  "name": "@shopping/worker",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "@shopping/core": "workspace:*",
    "@shopping/db": "workspace:*",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "vitest": "^3.0.5",
    "typescript": "^5.7.3"
  }
}
```

```ts
// packages/core/src/env.ts
import { z } from "zod";

const ShoppingEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  APP_ENCRYPTION_KEY: z.string().min(32),
});

export type ShoppingEnv = z.infer<typeof ShoppingEnvSchema>;

export function parseShoppingEnv(input: Record<string, string | undefined>): ShoppingEnv {
  return ShoppingEnvSchema.parse(input);
}

export function getShoppingEnv(): ShoppingEnv {
  return parseShoppingEnv(process.env);
}
```

```ts
// apps/worker/src/index.ts
async function main() {
  console.log("worker booted");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: Install dependencies and rerun the targeted test**

Run: `pnpm install && pnpm --filter @shopping/core test -- run src/env.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Initialize git and commit the bootstrap**

Run:

```bash
git init
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example apps/web apps/worker packages/core
git commit -m "chore: bootstrap typescript workspace"
```

## Task 2: Define the PostgreSQL Schema and Database Package

**Files:**
- Create: `docker-compose.yml`
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/seed.ts`
- Test: `packages/db/src/schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
// packages/db/src/schema.test.ts
import { describe, expect, it } from "vitest";
import { linkedStoreAccounts, userWatchlistItems, watchlistSyncState } from "./schema";

describe("database schema", () => {
  it("tracks store linkage and polling cadence", () => {
    expect(linkedStoreAccounts.store.enumValues).toEqual(["coupang", "ssg"]);
    expect(userWatchlistItems.pollingIntervalMinutes.name).toBe("polling_interval_minutes");
    expect(watchlistSyncState.nextRunAt.name).toBe("next_run_at");
  });
});
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `pnpm --filter @shopping/db test -- run src/schema.test.ts`

Expected: FAIL with `Cannot find module './schema'`.

- [ ] **Step 3: Add PostgreSQL, Drizzle, and the initial schema**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: shopping_helper
      POSTGRES_USER: shopping
      POSTGRES_PASSWORD: shopping
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

```json
// packages/db/package.json
{
  "name": "@shopping/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "lint": "eslint .",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/migrate.ts",
    "db:seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@shopping/core": "workspace:*",
    "drizzle-orm": "^0.38.3",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.1",
    "tsx": "^4.19.2",
    "vitest": "^3.0.5",
    "typescript": "^5.7.3"
  }
}
```

```ts
// packages/db/src/schema.ts
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
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
    canonicalProductId: uuid("canonical_product_id").notNull().references(() => canonicalProducts.id, { onDelete: "cascade" }),
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
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    canonicalProductId: uuid("canonical_product_id").notNull().references(() => canonicalProducts.id, { onDelete: "cascade" }),
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
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  canonicalProductId: uuid("canonical_product_id").notNull().references(() => canonicalProducts.id, { onDelete: "cascade" }),
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
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  canonicalProductId: uuid("canonical_product_id").notNull().references(() => canonicalProducts.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  winningStore: storeEnum("winning_store"),
  previousPrice: numeric("previous_price", { precision: 12, scale: 2 }),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
});
```

```ts
// packages/db/src/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getShoppingEnv } from "@shopping/core/src/env";

export const pool = new Pool({ connectionString: getShoppingEnv().DATABASE_URL });
export const db = drizzle(pool);
```

- [ ] **Step 4: Generate and apply the migration, then rerun the schema test**

Run:

```bash
docker compose up -d postgres
pnpm add -D -w drizzle-kit
pnpm --filter @shopping/db add drizzle-orm pg
pnpm db:generate
pnpm db:migrate
pnpm --filter @shopping/db test -- run src/schema.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the database foundation**

Run:

```bash
git add docker-compose.yml packages/db package.json pnpm-workspace.yaml
git commit -m "feat: add postgres schema foundation"
```

## Task 3: Add Invite-Only App Authentication and the Protected Mobile Shell

**Files:**
- Create: `apps/web/src/auth.ts`
- Create: `apps/web/src/lib/authorize-user.ts`
- Create: `apps/web/src/lib/require-user.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/app/(auth)/sign-in/page.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`
- Create: `apps/web/src/components/mobile-shell.tsx`
- Create: `packages/db/src/repositories/users.ts`
- Test: `apps/web/src/lib/authorize-user.test.ts`

- [ ] **Step 1: Write the failing auth authorization test**

```ts
// apps/web/src/lib/authorize-user.test.ts
import { describe, expect, it } from "vitest";
import { hash } from "bcryptjs";
import { authorizeUser } from "./authorize-user";

describe("authorizeUser", () => {
  it("returns a safe user object when the password matches", async () => {
    const passwordHash = await hash("hunter2", 10);

    const result = await authorizeUser(
      {
        findByEmail: async () => ({
          id: "user-1",
          email: "owner@example.com",
          displayName: "Owner",
          passwordHash,
        }),
      },
      { email: "owner@example.com", password: "hunter2" },
    );

    expect(result).toEqual({
      id: "user-1",
      email: "owner@example.com",
      name: "Owner",
    });
  });
});
```

- [ ] **Step 2: Run the auth test to verify it fails**

Run: `pnpm --filter @shopping/web test -- run src/lib/authorize-user.test.ts`

Expected: FAIL with `Cannot find module './authorize-user'`.

- [ ] **Step 3: Implement Auth.js credentials auth and the mobile shell**

```ts
// apps/web/src/lib/authorize-user.ts
import { compare } from "bcryptjs";

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export async function authorizeUser(
  repo: { findByEmail(email: string): Promise<UserRecord | null> },
  credentials: { email: string; password: string },
) {
  const user = await repo.findByEmail(credentials.email);
  if (!user) return null;

  const matches = await compare(credentials.password, user.passwordHash);
  if (!matches) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
  };
}
```

```ts
// apps/web/src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { usersRepository } from "@shopping/db/src/repositories/users";
import { authorizeUser } from "@/lib/authorize-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        return authorizeUser(usersRepository, {
          email: String(credentials?.email ?? ""),
          password: String(credentials?.password ?? ""),
        });
      },
    }),
  ],
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
});
```

```ts
// apps/web/src/lib/require-user.ts
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session.user;
}
```

```tsx
// apps/web/src/components/mobile-shell.tsx
import Link from "next/link";
import type { PropsWithChildren } from "react";

const nav = [
  { href: "/watchlist", label: "Watchlist" },
  { href: "/watchlist/add", label: "Add" },
  { href: "/notifications", label: "Alerts" },
  { href: "/settings/connections", label: "Connections" },
];

export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
      <header className="border-b bg-white px-4 py-3 text-lg font-semibold">Shopping Helper</header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <nav className="grid grid-cols-4 border-t bg-white">
        {nav.map((item) => (
          <Link className="px-2 py-3 text-center text-sm font-medium text-slate-700" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Run the auth test and a web lint pass**

Run: `pnpm --filter @shopping/web test -- run src/lib/authorize-user.test.ts && pnpm --filter @shopping/web lint`

Expected: PASS with the auth test green and ESLint reporting no errors.

- [ ] **Step 5: Commit the authentication shell**

Run:

```bash
git add apps/web/src/auth.ts apps/web/src/lib apps/web/src/app packages/db/src/repositories/users.ts
git commit -m "feat: add app authentication shell"
```

## Task 4: Implement Store Session Import, Encryption, and HTTP Validation

**Files:**
- Create: `packages/core/src/store-sessions/cookie-import.ts`
- Create: `packages/core/src/store-sessions/crypto.ts`
- Create: `packages/core/src/store-sessions/to-cookie-header.ts`
- Create: `packages/core/src/store-sessions/cookie-import.test.ts`
- Create: `apps/web/src/app/api/store-accounts/[store]/route.ts`
- Create: `apps/web/src/app/(app)/settings/connections/page.tsx`
- Create: `packages/db/src/repositories/store-accounts.ts`
- Create: `apps/worker/src/http/fetch-with-session.ts`
- Create: `apps/worker/src/jobs/validate-store-session.ts`
- Test: `apps/worker/src/jobs/validate-store-session.test.ts`

- [ ] **Step 1: Write the failing cookie import and encryption test**

```ts
// packages/core/src/store-sessions/cookie-import.test.ts
import { describe, expect, it } from "vitest";
import { decryptSessionJson, encryptSessionJson } from "./crypto";
import { parseCookieImport } from "./cookie-import";

describe("store session import", () => {
  it("parses browser cookies and round-trips encrypted payloads", () => {
    const cookies = parseCookieImport(
      JSON.stringify([
        {
          name: "SID",
          value: "abc",
          domain: ".ssg.com",
          path: "/",
          secure: true,
          httpOnly: true,
        },
      ]),
    );

    const encrypted = encryptSessionJson(
      JSON.stringify(cookies),
      "12345678901234567890123456789012",
    );

    expect(cookies[0].domain).toBe(".ssg.com");
    expect(decryptSessionJson(encrypted, "12345678901234567890123456789012")).toContain("\"SID\"");
  });
});
```

- [ ] **Step 2: Run the session test to verify it fails**

Run: `pnpm --filter @shopping/core test -- run src/store-sessions/cookie-import.test.ts`

Expected: FAIL with `Cannot find module './cookie-import'`.

- [ ] **Step 3: Implement cookie import, encryption, and the connection screen**

```ts
// packages/core/src/store-sessions/cookie-import.ts
import { z } from "zod";

export const BrowserCookieSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  domain: z.string().min(1),
  path: z.string().default("/"),
  expires: z.number().optional(),
  httpOnly: z.boolean().default(false),
  secure: z.boolean().default(true),
  sameSite: z.enum(["Strict", "Lax", "None"]).optional(),
});

export type BrowserCookie = z.infer<typeof BrowserCookieSchema>;

export function parseCookieImport(raw: string): BrowserCookie[] {
  return z.array(BrowserCookieSchema).min(1).parse(JSON.parse(raw));
}
```

```ts
// packages/core/src/store-sessions/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function encryptSessionJson(plainText: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSessionJson(cipherText: string, key: string) {
  const payload = Buffer.from(cipherText, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
```

```ts
// packages/core/src/store-sessions/to-cookie-header.ts
import type { BrowserCookie } from "./cookie-import";

export function toCookieHeader(cookies: BrowserCookie[]) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
```

```ts
// apps/worker/src/http/fetch-with-session.ts
import { decryptSessionJson } from "@shopping/core/src/store-sessions/crypto";
import { toCookieHeader } from "@shopping/core/src/store-sessions/to-cookie-header";
import type { BrowserCookie } from "@shopping/core/src/store-sessions/cookie-import";

export async function fetchWithSession(input: {
  url: string;
  encryptedSessionJson: string;
  encryptionKey: string;
  userAgent: string;
}) {
  const cookies = JSON.parse(
    decryptSessionJson(input.encryptedSessionJson, input.encryptionKey),
  ) as BrowserCookie[];

  return fetch(input.url, {
    headers: {
      Cookie: toCookieHeader(cookies),
      "User-Agent": input.userAgent,
      Accept: "text/html,application/json",
    },
  });
}
```

```ts
// apps/worker/src/jobs/validate-store-session.ts
import { fetchWithSession } from "../http/fetch-with-session";

export async function validateStoreSession(input: {
  store: "coupang" | "ssg";
  encryptedSessionJson: string;
  encryptionKey: string;
}) {
  const url =
    input.store === "coupang"
      ? "https://www.coupang.com/np/campaigns/82"
      : "https://www.ssg.com/";

  const response = await fetchWithSession({
    url,
    encryptedSessionJson: input.encryptedSessionJson,
    encryptionKey: input.encryptionKey,
    userAgent: "shopping-helper-session-validator",
  });

  if (!response.ok) {
    throw new Error(`Session validation failed with status ${response.status}`);
  }

  const body = await response.text();
  return input.store === "coupang"
    ? body.includes("로켓프레시")
    : body.includes("새벽배송") || body.includes("쓱배송") || body.includes("트레이더스");
}
```

```tsx
// apps/web/src/app/(app)/settings/connections/page.tsx
import { requireUser } from "@/lib/require-user";

export default async function ConnectionsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Store connections</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste exported cookie JSON for Coupang Rocket Fresh and SSG.
        </p>
      </section>
      {["coupang", "ssg"].map((store) => (
        <form action={`/api/store-accounts/${store}`} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" key={store} method="post">
          <label className="block text-sm font-medium capitalize text-slate-700">{store}</label>
          <textarea className="min-h-40 w-full rounded-xl border p-3 text-sm" name="cookieJson" />
          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white" type="submit">
            Save {store} session
          </button>
        </form>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Validate imported sessions with the worker and rerun tests**

Run: `pnpm --filter @shopping/core test -- run src/store-sessions/cookie-import.test.ts`

Then run: `pnpm --filter @shopping/worker test -- run src/jobs/validate-store-session.test.ts`

Expected: PASS with the cookie round-trip test green and worker session validation confirming each store session can fetch a signed-in or delivery-capable page over HTTP using imported cookies.

- [ ] **Step 5: Commit the store connection flow**

Run:

```bash
git add packages/core/src/store-sessions apps/web/src/app/'(app)'/settings packages/db/src/repositories/store-accounts.ts apps/worker/src/http apps/worker/src/jobs
git commit -m "feat: add linked store session import"
```

## Task 5: Build Exact-Product Normalization and URL-Based Watchlist Creation

**Files:**
- Create: `packages/core/src/products/normalize.ts`
- Create: `packages/core/src/products/normalize.test.ts`
- Create: `apps/worker/src/stores/coupang/parse-product-detail.ts`
- Create: `apps/worker/src/stores/ssg/parse-product-detail.ts`
- Create: `apps/worker/test/fixtures/coupang-product.html`
- Create: `apps/worker/test/fixtures/ssg-product.html`
- Create: `apps/web/src/app/api/watchlist/from-url/route.ts`
- Create: `packages/db/src/repositories/watchlist.ts`
- Test: `apps/worker/src/stores/parse-product-detail.test.ts`

- [ ] **Step 1: Write the failing exact-match test**

```ts
// packages/core/src/products/normalize.test.ts
import { describe, expect, it } from "vitest";
import { buildSkuSignature, isExactProductMatch, normalizeProductMeta } from "./normalize";

describe("normalizeProductMeta", () => {
  it("treats the same branded SKU as equivalent", () => {
    const left = normalizeProductMeta({
      brand: "CJ",
      title: "비비고 왕교자 1.05kg",
      options: ["냉동"],
    });

    const right = normalizeProductMeta({
      brand: "cj",
      title: "비비고 왕교자 1.05 KG",
      options: ["냉동"],
    });

    expect(buildSkuSignature(left)).toBe(buildSkuSignature(right));
    expect(isExactProductMatch(left, right)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the product test to verify it fails**

Run: `pnpm --filter @shopping/core test -- run src/products/normalize.test.ts`

Expected: FAIL with `Cannot find module './normalize'`.

- [ ] **Step 3: Implement product normalization, store detail parsers, and the URL watchlist route**

```ts
// packages/core/src/products/normalize.ts
type ProductMetaInput = {
  brand: string;
  title: string;
  options: string[];
};

export type NormalizedProductMeta = {
  brand: string;
  normalizedName: string;
  sizeValue: number;
  sizeUnit: string;
  optionKey: string;
};

const sizeRegex = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|개)/i;

export function normalizeProductMeta(input: ProductMetaInput): NormalizedProductMeta {
  const sizeMatch = input.title.match(sizeRegex);
  if (!sizeMatch) {
    throw new Error("Unable to parse product size");
  }

  const normalizedName = input.title
    .toLowerCase()
    .replace(sizeRegex, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    brand: input.brand.toLowerCase().trim(),
    normalizedName,
    sizeValue: Number(sizeMatch[1]),
    sizeUnit: sizeMatch[2].toLowerCase(),
    optionKey: input.options.map((option) => option.toLowerCase().trim()).sort().join("|"),
  };
}

export function buildSkuSignature(input: NormalizedProductMeta) {
  return [input.brand, input.normalizedName, input.sizeValue, input.sizeUnit, input.optionKey].join("::");
}

export function isExactProductMatch(left: NormalizedProductMeta, right: NormalizedProductMeta) {
  return buildSkuSignature(left) === buildSkuSignature(right);
}
```

```ts
// apps/worker/src/stores/ssg/parse-product-detail.ts
import * as cheerio from "cheerio";

export function parseSsgProductDetail(html: string) {
  const $ = cheerio.load(html);
  return {
    externalProductId: $("body").attr("data-item-id") ?? "",
    brand: $(".cdtl_info_tit em").first().text().trim(),
    title: $(".cdtl_info_tit h2").first().text().trim(),
    options: $(".cdtl_clydeliv .delivery-badge").map((_, el) => $(el).text().trim()).get(),
    imageUrl: $(".cdtl_item_image img").attr("src") ?? "",
  };
}
```

```ts
// apps/web/src/app/api/watchlist/from-url/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { createWatchlistItemFromUrl } from "@shopping/db/src/repositories/watchlist";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();

  const created = await createWatchlistItemFromUrl({
    userId: user.id,
    productUrl: body.productUrl,
    pollingIntervalMinutes: body.pollingIntervalMinutes ?? 60,
  });

  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 4: Run the product test and route test**

Run: `pnpm --filter @shopping/core test -- run src/products/normalize.test.ts`

Then run: `pnpm --filter @shopping/worker test -- run src/stores/parse-product-detail.test.ts`

Expected: PASS with exact-match logic and HTML parser fixtures both green.

- [ ] **Step 5: Commit URL-based exact watchlist creation**

Run:

```bash
git add packages/core/src/products apps/worker/src/stores apps/worker/test/fixtures apps/web/src/app/api/watchlist/from-url packages/db/src/repositories/watchlist.ts
git commit -m "feat: add exact product normalization and url watchlist flow"
```

## Task 6: Add Search-Based Watchlist Creation and Candidate Confirmation

**Files:**
- Create: `apps/worker/src/stores/coupang/search-products.ts`
- Create: `apps/worker/src/stores/ssg/search-products.ts`
- Create: `apps/worker/test/fixtures/coupang-search.html`
- Create: `apps/worker/test/fixtures/ssg-search.html`
- Create: `apps/web/src/app/api/watchlist/search/route.ts`
- Create: `apps/web/src/app/api/watchlist/confirm/route.ts`
- Create: `apps/web/src/app/(app)/watchlist/add/page.tsx`
- Create: `apps/web/src/components/watchlist/search-result-card.tsx`
- Test: `apps/worker/src/stores/search-products.test.ts`
- Test: `apps/web/src/app/(app)/watchlist/add/page.test.tsx`

- [ ] **Step 1: Write the failing search parser test**

```ts
// apps/worker/src/stores/search-products.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCoupangSearchResults } from "./coupang/search-products";
import { parseSsgSearchResults } from "./ssg/search-products";

describe("store search parsers", () => {
  it("returns normalized candidates from both stores", () => {
    const coupangHtml = readFileSync("test/fixtures/coupang-search.html", "utf8");
    const ssgHtml = readFileSync("test/fixtures/ssg-search.html", "utf8");

    const coupang = parseCoupangSearchResults(coupangHtml);
    const ssg = parseSsgSearchResults(ssgHtml);

    expect(coupang[0].title).toContain("비비고");
    expect(ssg[0].store).toBe("ssg");
  });
});
```

- [ ] **Step 2: Run the search parser test to verify it fails**

Run: `pnpm --filter @shopping/worker test -- run src/stores/search-products.test.ts`

Expected: FAIL with `Cannot find module './coupang/search-products'`.

- [ ] **Step 3: Implement search parsing and the candidate confirmation UI**

```ts
// apps/worker/src/stores/coupang/search-products.ts
import * as cheerio from "cheerio";

export function parseCoupangSearchResults(html: string) {
  const $ = cheerio.load(html);
  return $(".search-product")
    .slice(0, 8)
    .map((_, element) => ({
      store: "coupang" as const,
      externalProductId: $(element).attr("data-product-id") ?? "",
      title: $(element).find(".name").text().trim(),
      brand: $(element).find(".brand").text().trim(),
      productUrl: $(element).find("a").attr("href") ?? "",
      imageUrl: $(element).find("img").attr("src") ?? "",
    }))
    .get();
}
```

```tsx
// apps/web/src/app/(app)/watchlist/add/page.tsx
"use client";

import { useState } from "react";

export default function AddWatchlistPage() {
  const [query, setQuery] = useState("");
  const [productUrl, setProductUrl] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Add a watched product</h1>
        <p className="mt-1 text-sm text-slate-600">Search by product name or paste a Coupang / SSG URL.</p>
      </section>

      <form action="/api/watchlist/search" className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
        <input
          className="w-full rounded-xl border px-3 py-3"
          name="query"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 비비고 왕교자 1.05kg"
          value={query}
        />
        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white" type="submit">
          Search products
        </button>
      </form>

      <form action="/api/watchlist/from-url" className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
        <input
          className="w-full rounded-xl border px-3 py-3"
          name="productUrl"
          onChange={(event) => setProductUrl(event.target.value)}
          placeholder="https://..."
          value={productUrl}
        />
        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white" type="submit">
          Add from URL
        </button>
      </form>
    </div>
  );
}
```

```ts
// apps/web/src/app/api/watchlist/confirm/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { confirmCandidateMatch } from "@shopping/db/src/repositories/watchlist";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();

  const result = await confirmCandidateMatch({
    userId: user.id,
    candidateId: body.candidateId,
    pollingIntervalMinutes: body.pollingIntervalMinutes ?? 60,
  });

  return NextResponse.json(result, { status: 201 });
}
```

- [ ] **Step 4: Run the search tests and render check**

Run: `pnpm --filter @shopping/worker test -- run src/stores/search-products.test.ts`

Then run: `pnpm --filter @shopping/web test -- run src/app/'(app)'/watchlist/add/page.test.tsx`

Expected: PASS with search parsing green and the add page rendering both forms.

- [ ] **Step 5: Commit the search-based add flow**

Run:

```bash
git add apps/worker/src/stores apps/worker/test/fixtures apps/web/src/app/'(app)'/watchlist/add apps/web/src/app/api/watchlist/search apps/web/src/app/api/watchlist/confirm apps/web/src/components/watchlist
git commit -m "feat: add search-based watchlist creation"
```

## Task 7: Implement the Scheduler and Price Snapshot Collector Worker

**Files:**
- Create: `apps/worker/src/scheduler/claim-due-watchlist-items.ts`
- Create: `apps/worker/src/jobs/refresh-watchlist-item.ts`
- Create: `apps/worker/src/stores/coupang/collect-offer.ts`
- Create: `apps/worker/src/stores/ssg/collect-offer.ts`
- Create: `apps/worker/src/scheduler/claim-due-watchlist-items.test.ts`
- Create: `packages/db/src/repositories/snapshots.ts`
- Test: `apps/worker/src/stores/collect-offer.test.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Write the failing due-job selection test**

```ts
// apps/worker/src/scheduler/claim-due-watchlist-items.test.ts
import { describe, expect, it } from "vitest";
import { claimDueWatchlistItems } from "./claim-due-watchlist-items";

describe("claimDueWatchlistItems", () => {
  it("returns only items whose nextRunAt is due", async () => {
    const result = await claimDueWatchlistItems(
      {
        selectDueRows: async () => [
          { watchlistItemId: "due-1", nextRunAt: new Date("2026-04-17T01:00:00.000Z") },
        ],
      },
      new Date("2026-04-17T02:00:00.000Z"),
      10,
    );

    expect(result).toHaveLength(1);
    expect(result[0].watchlistItemId).toBe("due-1");
  });
});
```

- [ ] **Step 2: Run the scheduler test to verify it fails**

Run: `pnpm --filter @shopping/worker test -- run src/scheduler/claim-due-watchlist-items.test.ts`

Expected: FAIL with `Cannot find module './claim-due-watchlist-items'`.

- [ ] **Step 3: Implement the due-item scheduler and store offer collectors**

```ts
// apps/worker/src/scheduler/claim-due-watchlist-items.ts
type DueRow = {
  watchlistItemId: string;
  nextRunAt: Date;
};

export async function claimDueWatchlistItems(
  repo: { selectDueRows(now: Date, limit: number): Promise<DueRow[]> },
  now: Date,
  limit: number,
) {
  return repo.selectDueRows(now, limit);
}
```

```ts
// apps/worker/src/stores/ssg/collect-offer.ts
import * as cheerio from "cheerio";
import { fetchWithSession } from "../../http/fetch-with-session";

const allowedDeliveryTypes = new Set(["dawn", "daytime", "traders"]);

export async function collectSsgOffer(input: {
  productUrl: string;
  encryptedSessionJson: string;
  encryptionKey: string;
}) {
  const response = await fetchWithSession({
    url: input.productUrl,
    encryptedSessionJson: input.encryptedSessionJson,
    encryptionKey: input.encryptionKey,
    userAgent: "shopping-helper-collector",
  });

  if (!response.ok) {
    throw new Error(`SSG offer request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const deliveryLabel = $(".delivery-type").first().text().trim().toLowerCase();
  const deliveryType =
    deliveryLabel.includes("새벽") ? "dawn" :
    deliveryLabel.includes("주간") ? "daytime" :
    deliveryLabel.includes("트레이더스") ? "traders" :
    "other";

  return {
    store: "ssg" as const,
    price: Number($(".ssg_price").first().text().replace(/[^\d]/g, "")),
    listPrice: Number($(".ssg_list_price").first().text().replace(/[^\d]/g, "")) || null,
    isOnSale: Boolean($(".sale-badge").length),
    availability: $(".soldout").length ? "sold_out" : "available",
    deliveryType,
    eligible: allowedDeliveryTypes.has(deliveryType),
  };
}
```

```ts
// apps/worker/src/jobs/refresh-watchlist-item.ts
import { saveSnapshot } from "@shopping/db/src/repositories/snapshots";

export async function refreshWatchlistItem(deps: {
  loadWatchlistItem(id: string): Promise<{
    id: string;
    userId: string;
    encryptedSessionJsonByStore: Record<"coupang" | "ssg", string | null>;
    storeReferences: { store: "coupang" | "ssg"; productUrl: string }[];
  }>;
  collectOffer(input: {
    store: "coupang" | "ssg";
    productUrl: string;
    encryptedSessionJson: string;
  }): Promise<{
    price: number;
    listPrice: number | null;
    isOnSale: boolean;
    availability: string;
    deliveryType: "rocket_fresh" | "dawn" | "daytime" | "traders" | "other";
    rawTitle: string;
    rawPayload: Record<string, unknown>;
    eligible: boolean;
  }>;
}, watchlistItemId: string) {
  const watchlistItem = await deps.loadWatchlistItem(watchlistItemId);

  for (const reference of watchlistItem.storeReferences) {
    const encryptedSessionJson = watchlistItem.encryptedSessionJsonByStore[reference.store];
    if (!encryptedSessionJson) continue;

    const offer = await deps.collectOffer({
      store: reference.store,
      productUrl: reference.productUrl,
      encryptedSessionJson,
    });
    if (!offer.eligible) continue;

    await saveSnapshot({
      userId: watchlistItem.userId,
      watchlistItemId,
      store: reference.store,
      productUrl: reference.productUrl,
      ...offer,
    });
  }
}
```

- [ ] **Step 4: Run the scheduler and parser tests**

Run: `pnpm --filter @shopping/worker test -- run src/scheduler/claim-due-watchlist-items.test.ts`

Then run: `pnpm --filter @shopping/worker test -- run src/stores/collect-offer.test.ts`

Expected: PASS with due-item selection green and parser-only HTTP collection rejecting non-dawn/daytime/traders SSG offers.

- [ ] **Step 5: Commit the worker scheduler**

Run:

```bash
git add apps/worker/src/scheduler apps/worker/src/jobs apps/worker/src/stores packages/db/src/repositories/snapshots.ts
git commit -m "feat: add scheduled price snapshot collector"
```

## Task 8: Add Recommendation Logic, Notifications, and the Watchlist Dashboard

**Files:**
- Create: `packages/core/src/pricing/choose-cheaper-offer.ts`
- Create: `packages/core/src/pricing/choose-cheaper-offer.test.ts`
- Create: `apps/web/src/app/api/watchlist/route.ts`
- Create: `apps/web/src/app/api/notifications/route.ts`
- Create: `apps/web/src/app/(app)/watchlist/page.tsx`
- Create: `apps/web/src/app/(app)/notifications/page.tsx`
- Create: `apps/web/src/components/watchlist/watchlist-card.tsx`
- Create: `apps/web/src/components/notifications/notification-card.tsx`
- Test: `apps/web/src/components/watchlist/watchlist-card.test.tsx`

- [ ] **Step 1: Write the failing pricing and alert generation test**

```ts
// packages/core/src/pricing/choose-cheaper-offer.test.ts
import { describe, expect, it } from "vitest";
import { buildNotifications, chooseCheaperOffer } from "./choose-cheaper-offer";

describe("chooseCheaperOffer", () => {
  it("selects the lower eligible store price and emits a price-drop alert", () => {
    const winner = chooseCheaperOffer([
      { store: "coupang", price: 8990, eligible: true },
      { store: "ssg", price: 7990, eligible: true },
    ]);

    const notifications = buildNotifications({
      previous: { store: "ssg", price: 8990, isOnSale: false },
      current: { store: "ssg", price: 7990, isOnSale: true },
    });

    expect(winner?.store).toBe("ssg");
    expect(notifications.map((item) => item.type)).toEqual(["sale_started", "price_dropped"]);
  });
});
```

- [ ] **Step 2: Run the pricing test to verify it fails**

Run: `pnpm --filter @shopping/core test -- run src/pricing/choose-cheaper-offer.test.ts`

Expected: FAIL with `Cannot find module './choose-cheaper-offer'`.

- [ ] **Step 3: Implement the pricing engine and dashboard pages**

```ts
// packages/core/src/pricing/choose-cheaper-offer.ts
type ComparableOffer = {
  store: "coupang" | "ssg";
  price: number;
  eligible: boolean;
};

export function chooseCheaperOffer(offers: ComparableOffer[]) {
  return offers
    .filter((offer) => offer.eligible)
    .sort((left, right) => left.price - right.price)[0] ?? null;
}

export function buildNotifications(input: {
  previous: { store: "coupang" | "ssg"; price: number; isOnSale: boolean } | null;
  current: { store: "coupang" | "ssg"; price: number; isOnSale: boolean };
}) {
  const notifications: { type: "sale_started" | "price_dropped"; winningStore: "coupang" | "ssg" }[] = [];

  if (!input.previous) return notifications;
  if (!input.previous.isOnSale && input.current.isOnSale) {
    notifications.push({ type: "sale_started", winningStore: input.current.store });
  }
  if (input.current.price < input.previous.price) {
    notifications.push({ type: "price_dropped", winningStore: input.current.store });
  }

  return notifications;
}
```

```tsx
// apps/web/src/app/(app)/watchlist/page.tsx
import { requireUser } from "@/lib/require-user";
import { listWatchlistView } from "@shopping/db/src/repositories/watchlist";
import { WatchlistCard } from "@/components/watchlist/watchlist-card";

export default async function WatchlistPage() {
  const user = await requireUser();
  const items = await listWatchlistView(user.id);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-600">Track exact products and see the cheaper store per item.</p>
      </section>
      {items.map((item) => (
        <WatchlistCard item={item} key={item.id} />
      ))}
    </div>
  );
}
```

```tsx
// apps/web/src/components/watchlist/watchlist-card.tsx
type WatchlistView = {
  id: string;
  productName: string;
  imageUrl: string | null;
  coupangPrice: number | null;
  ssgPrice: number | null;
  cheaperStore: "coupang" | "ssg" | null;
  lastCapturedAt: string | null;
};

export function WatchlistCard({ item }: { item: WatchlistView }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 rounded-xl bg-slate-100" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{item.productName}</h2>
          <p className="mt-1 text-sm text-slate-600">Coupang {item.coupangPrice ?? "-"}원</p>
          <p className="text-sm text-slate-600">SSG {item.ssgPrice ?? "-"}원</p>
          {item.cheaperStore ? (
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              {item.cheaperStore} is cheaper
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run pricing tests and dashboard component tests**

Run: `pnpm --filter @shopping/core test -- run src/pricing/choose-cheaper-offer.test.ts`

Then run: `pnpm --filter @shopping/web test -- run src/components/watchlist/watchlist-card.test.tsx`

Expected: PASS with cheaper-store selection and alert generation green.

- [ ] **Step 5: Commit recommendations and notifications**

Run:

```bash
git add packages/core/src/pricing apps/web/src/app/'(app)'/watchlist apps/web/src/app/'(app)'/notifications apps/web/src/components/watchlist apps/web/src/components/notifications apps/web/src/app/api/watchlist apps/web/src/app/api/notifications
git commit -m "feat: add watchlist recommendations and alerts"
```

## Task 9: Add Reconnect States, Observability, and End-to-End Coverage

**Files:**
- Create: `apps/web/src/components/store-accounts/reconnect-banner.tsx`
- Test: `apps/web/src/components/store-accounts/reconnect-banner.test.tsx`
- Create: `apps/worker/src/logging/collection-logger.ts`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/watchlist.spec.ts`
- Create: `apps/web/tests/e2e/notifications.spec.ts`
- Create: `README.md`

- [ ] **Step 1: Write the failing reconnect banner test**

```ts
// apps/web/src/components/store-accounts/reconnect-banner.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReconnectBanner } from "./reconnect-banner";

describe("ReconnectBanner", () => {
  it("shows a reconnect call-to-action when a store session expires", () => {
    render(<ReconnectBanner store="ssg" />);
    expect(screen.getByText("Reconnect SSG")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the reconnect banner test to verify it fails**

Run: `pnpm --filter @shopping/web test -- run src/components/store-accounts/reconnect-banner.test.tsx`

Expected: FAIL with `Cannot find module './reconnect-banner'`.

- [ ] **Step 3: Implement reconnect UI, collection logging, and end-to-end flows**

```tsx
// apps/web/src/components/store-accounts/reconnect-banner.tsx
export function ReconnectBanner({ store }: { store: "coupang" | "ssg" }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">{store.toUpperCase()} session expired</p>
      <a className="mt-3 inline-flex rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white" href="/settings/connections">
        Reconnect {store.toUpperCase()}
      </a>
    </div>
  );
}
```

```ts
// apps/worker/src/logging/collection-logger.ts
type CollectionLogInput = {
  watchlistItemId: string;
  store: "coupang" | "ssg";
  status: "success" | "error";
  errorCode?: string;
};

export function logCollectionEvent(input: CollectionLogInput) {
  console.info("collection_event", JSON.stringify(input));
}
```

```ts
// apps/web/tests/e2e/watchlist.spec.ts
import { expect, test } from "@playwright/test";

test("user can open the mobile watchlist and see the cheaper store badge", async ({ page }) => {
  await page.goto("/watchlist");
  await expect(page.getByRole("heading", { name: "Watchlist" })).toBeVisible();
  await expect(page.getByText(/is cheaper/i)).toBeVisible();
});
```

```md
<!-- README.md -->
# Shopping Helper

## Local development

1. `cp .env.example .env`
2. `docker compose up -d postgres`
3. `pnpm install`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. Run `pnpm dev:web` and `pnpm dev:worker`
```

- [ ] **Step 4: Run the reconnect test and Playwright smoke suite**

Run: `pnpm --filter @shopping/web test -- run src/components/store-accounts/reconnect-banner.test.tsx`

Then run: `pnpm --filter @shopping/web test:e2e`

Expected: PASS with reconnect CTA rendering and end-to-end watchlist / notification flows green under a mobile viewport.

- [ ] **Step 5: Commit the final hardening pass**

Run:

```bash
git add apps/web/src/components/store-accounts apps/worker/src/logging apps/web/tests/e2e apps/web/playwright.config.ts README.md
git commit -m "test: add reconnect states and e2e coverage"
```

## Plan Self-Review

### Spec Coverage

- authenticated TypeScript web app: Tasks 1, 3
- linked Coupang and SSG accounts: Task 4
- search and URL watchlist creation: Tasks 5, 6
- exact SKU-only matching: Task 5
- user-configurable polling interval, default 60 minutes: Tasks 5, 7
- valid SSG delivery-type filtering: Task 7
- cheaper-store recommendation: Task 8
- in-app notifications for sale start and price drop: Task 8
- reconnect flow and stale-state observability: Task 9

### Placeholder Scan

- No placeholder markers or deferred work notes remain.
- Each task includes explicit files, commands, expected results, and commit messages.

### Type Consistency

- Store enum is always `coupang | ssg`.
- Delivery type is always one of `rocket_fresh | dawn | daytime | traders | other`.
- Notification type is always `sale_started | price_dropped`.
- Watchlist cadence is consistently stored as `pollingIntervalMinutes`.
