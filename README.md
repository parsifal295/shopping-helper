# Shopping Helper

TypeScript workspace for a mobile-first grocery price watcher across Coupang Rocket Fresh and SSG.

## Workspace

- `apps/web`: Next.js App Router web app
- `apps/worker`: parser-only HTTP collection worker
- `packages/core`: product normalization, pricing, and shared parsing logic
- `packages/db`: Drizzle schema and repositories

## Local development

1. Copy environment variables: `cp .env.example .env`
2. Start PostgreSQL: `docker compose up -d postgres`
3. Install dependencies: `pnpm install`
4. Generate or apply schema: `pnpm db:generate` then `pnpm db:migrate`
5. Seed users and sample data if needed: `pnpm db:seed`
6. Start the web app: `pnpm dev:web`
7. Start the worker in a second terminal: `pnpm dev:worker`

## Tests

- Unit tests: `pnpm test`
- Web lint: `pnpm --filter @shopping/web lint`
- Type checks:
  - `pnpm --filter @shopping/web exec tsc --noEmit`
  - `pnpm --filter @shopping/worker exec tsc --noEmit`
  - `pnpm --filter @shopping/core exec tsc --noEmit`
  - `pnpm --filter @shopping/db exec tsc --noEmit`
- E2E smoke tests: `pnpm --filter @shopping/web test:e2e`

## E2E environment

To run Playwright smoke tests, provide:

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_SIGNIN_EMAIL`
- `PLAYWRIGHT_SIGNIN_PASSWORD`

Without those variables, the Playwright smoke specs are skipped.
