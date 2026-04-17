# Shopping Price Watcher Design

## Context

This workspace is currently a greenfield project with no existing application code or git repository. The design therefore defines the initial product shape for a TypeScript-based mobile-compatible web app.

The product goal is to reduce friction when comparing the same grocery item across Coupang Rocket Fresh and SSG. Users maintain a watchlist, the app keeps price data fresh, highlights the cheaper store for each item, and alerts users when a watched item goes on sale or drops in price.

## Product Goal

Build a mobile-first web app that:

- lets users add products to a watchlist by search or pasted product URL
- compares only the exact same product across Coupang Rocket Fresh and SSG
- shows which store is cheaper for each watched item
- alerts users inside the app when a watched item starts a sale or drops in price

## Scope

### In Scope for V1

- TypeScript-based web app, optimized for mobile but usable on desktop
- authenticated user accounts for a small set of users
- account-linked price collection using the user's Coupang and SSG sessions
- watchlist item creation from:
  - product search
  - direct Coupang or SSG product URL paste
- canonical product matching based on the exact same:
  - brand
  - size or quantity
  - option or variant
- periodic price collection with user-configurable polling interval
- default polling interval of 1 hour
- per-item cheaper-store recommendation
- in-app notifications for:
  - sale started
  - price dropped
- SSG filtering that only keeps:
  - dawn delivery
  - daytime delivery
  - Traders delivery

### Explicitly Out of Scope for V1

- automatic cart insertion on Coupang or SSG
- cart optimization across shipping fees or minimum order thresholds
- bundle or basket-level optimization
- browser push notifications
- email notifications
- open public price comparison without linked user accounts
- comparison of loose produce or ambiguous fresh items whose brand, size, or option are not exact

## Users

The initial product is for individual or small-scale authenticated users, not a broad multi-tenant SaaS platform. The system should still keep a per-user data boundary for sessions, watchlists, snapshots, and notifications.

## Core Product Rules

### Product Comparison Rule

Only compare identical products. The match is valid only when brand, size, and option align at SKU level.

Examples of valid comparison:

- Seoul Milk 1L
- CJ Bibigo Wang Gyoza 1.05kg

Examples excluded from V1:

- bananas
- green onion
- any item where quantity basis, unit, or option is ambiguous

### Store Eligibility Rule

- Coupang results must be Rocket Fresh eligible
- SSG results must be one of:
  - dawn delivery
  - daytime delivery
  - Traders delivery

If an SSG offer is found but the delivery type is outside the allowed set, it must be excluded from price comparison and recommendation.

### Recommendation Rule

Recommendation is decided per item, based on the latest valid store snapshot with the lowest price. Delivery fees, minimum order value, and multi-item shipping optimization are not included in the V1 recommendation formula.

### Notification Rule

The app creates in-app notifications only when:

- a watched product enters a sale state
- a watched product price decreases relative to the previous valid snapshot

The app must not create duplicate notifications when the effective price state has not changed.

## Recommended Architecture

The recommended solution is a hybrid collection architecture.

The web app does not fetch live store pages on every user view. Instead, a scheduled collector refreshes store data with account-linked sessions and saves normalized snapshots. The web app reads the latest saved data for fast and stable rendering. On-demand refresh can be added as a controlled action later, but scheduled refresh is the primary V1 model.

The collector must use authenticated HTTP requests with imported store session cookies and parse the returned HTML or store responses directly. Browser automation is out of scope for V1 and there is no browser fallback path in this design.

### Main Components

1. Mobile-first web app
2. TypeScript API layer
3. product matching and normalization engine
4. scheduled collection worker
5. price snapshot storage
6. notification engine

### Data Flow

1. The user connects Coupang and SSG accounts.
2. The user adds a watchlist item by search or product URL.
3. The product resolver extracts metadata and either:
   - matches an existing canonical product
   - creates a new canonical product
   - asks the user to choose from candidates if confidence is low
4. The watchlist item is stored with the user's polling interval.
5. The scheduler triggers collection jobs based on the user's configured interval.
6. The collector sends authenticated HTTP requests with the linked session cookies and parses current valid offers from the response payload.
7. The system stores store-specific snapshots and computes the cheapest valid store.
8. The notification engine compares the latest snapshot to the previous one and creates events when sale-start or price-drop rules are met.
9. The UI renders watchlist state, cheaper-store badges, and notifications from stored results.

## Technical Direction

### Language

All core implementation should be in TypeScript.

### Recommended Stack

- frontend: Next.js with TypeScript
- backend/API: Next.js route handlers or server actions plus background job support
- collector: TypeScript HTTP client plus HTML or response parsers
- database: PostgreSQL via a TypeScript ORM
- authentication: standard web authentication for the app itself, separate from store session linking
- scheduling: recurring background jobs with per-user interval support

The design intentionally leaves room for choosing the specific ORM, auth library, and deployment provider during implementation planning.

## Core Domain Model

### User

Represents an authenticated app user.

Fields:

- id
- email or login identifier
- createdAt

### LinkedStoreAccount

Represents a user's linked store session.

Fields:

- id
- userId
- store (`coupang` or `ssg`)
- encrypted session material
- sessionStatus
- lastValidatedAt
- reauthRequiredAt

### CanonicalProduct

Represents the app's normalized view of an exact product.

Fields:

- id
- brand
- normalizedName
- sizeValue
- sizeUnit
- optionKey
- imageUrl
- createdAt

### StoreProductReference

Links a canonical product to a store-specific product page.

Fields:

- id
- canonicalProductId
- store
- externalProductId
- productUrl
- latestKnownTitle

### UserWatchlistItem

Represents a user's intent to monitor a canonical product.

Fields:

- id
- userId
- canonicalProductId
- pollingIntervalMinutes
- active
- createdAt

### StoreOfferSnapshot

Represents a captured price state for a store-specific offer.

Fields:

- id
- userId
- canonicalProductId
- store
- productUrl
- price
- listPrice
- isOnSale
- deliveryType
- availability
- capturedAt
- rawTitle

### UserNotification

Represents an in-app alert generated from snapshot changes.

Fields:

- id
- userId
- canonicalProductId
- type
- winningStore
- previousPrice
- currentPrice
- createdAt
- readAt

## Key Modules

### Account Connector

Responsibilities:

- link Coupang and SSG accounts
- validate whether a session is still usable
- securely persist session material
- mark the store as requiring reauthentication when collection fails due to auth state

### Product Resolver

Responsibilities:

- support watchlist creation from search or pasted URL
- extract comparable product metadata from store pages or search results
- normalize brand, size, and option values
- decide whether the item matches an existing canonical product
- return candidate choices when confidence is insufficient for automatic matching

### Collector Worker

Responsibilities:

- execute scheduled data collection jobs
- use imported session cookies to make authenticated HTTP requests
- parse returned HTML or store responses without browser automation
- collect current price, list price, sale status, availability, and delivery type
- reject invalid store offers before recommendation logic
- fail the run explicitly when required fields cannot be parsed; no browser fallback exists

Specific rules:

- reject Coupang offers that are not Rocket Fresh eligible
- reject SSG offers outside dawn, daytime, or Traders delivery

### Recommendation Engine

Responsibilities:

- read the latest valid snapshots for the user's watched items
- compare store prices per canonical product
- decide the cheaper store
- expose comparison results to the UI

### Alert Engine

Responsibilities:

- compare previous and latest valid snapshots
- generate sale-start notifications
- generate price-drop notifications
- suppress duplicates when the state did not materially change

## User Experience

### Watchlist Add Flow

The user can add a product in two ways:

1. Search for a product
2. Paste a product URL from Coupang or SSG

If the system can confidently map the item to an existing canonical product, it saves it directly. If confidence is low, the user must select from candidate matches or confirm creation of a new canonical product.

### Watchlist View

Each watchlist item should show:

- product image
- normalized product name
- latest price from Coupang
- latest price from SSG
- badge indicating the cheaper store
- timestamp of last successful refresh
- indicator if one store is unavailable or outdated

### Notification View

The app should include an in-app notification center showing:

- sale started
- price dropped
- product name
- old price and new price when relevant
- store context

## Error Handling

### Session Failure

If the linked store session expires or becomes invalid:

- collection for that store stops
- the app marks the linked account as requiring reauthentication
- the user sees a clear reconnect prompt

### Partial Collection Failure

If one store fails during a collection cycle:

- keep the other store's valid result
- do not block the entire watchlist item
- mark the failed store as unavailable or stale in the UI

### Low Match Confidence

If product normalization cannot confidently prove same-product equivalence:

- do not auto-merge
- ask the user to choose or confirm

### Invalid Delivery Type

If SSG returns a product outside the allowed delivery types:

- store the collection result only if needed for diagnostics
- exclude it from recommendation and visible comparison output
- expose an internal reason code for debugging

## Security and Privacy Considerations

- store session material must be encrypted at rest
- session usage should be scoped per user and per store
- raw store credentials should not be retained if session-based linking is possible
- logs must avoid leaking session tokens or personally sensitive shopping data
- access control must ensure users can only view their own watchlists, snapshots, and notifications

## Testing Strategy

### Unit Tests

- product normalization
- exact-match comparison for brand, size, and option
- SSG delivery-type filtering
- cheaper-store recommendation logic
- notification generation rules

### Integration Tests

- linked-account validation flow
- watchlist creation from search
- watchlist creation from URL
- snapshot persistence
- recommendation API output

### End-to-End Tests

- mobile viewport watchlist creation
- comparison screen rendering
- notification center rendering
- reconnect flow when a store session expires

### Collector Contract Tests

Validate safe failure when store page structure changes or required fields cannot be extracted.

These tests must validate the parser-only collection path. A failed parser should produce a controlled collection error and reauthentication or maintenance signal rather than invoking a browser fallback.

## Observability

The system should record enough internal state to debug collection failures and stale data without exposing sensitive session information.

Minimum signals:

- last successful collection time by user, store, and watchlist item
- last collection failure reason
- last session validation result
- count of notifications generated per day

## Delivery Plan Boundary

This design is intentionally limited to V1 product comparison and alerting. Automatic cart insertion remains out of scope. If V1 is successful, a later design can extend the system into checkout-adjacent automation, but that should be a separate specification because it changes the risk profile, auth handling, and UX significantly.
