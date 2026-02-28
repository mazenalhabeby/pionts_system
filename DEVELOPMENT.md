# Development

## Shared Library (@pionts/shared)

All commands run from `shared/`.

Shared TypeScript package consumed by both frontends via Vite `resolve.alias` (`@pionts/shared` → `../shared/src`). No npm workspaces — just a directory with TypeScript source that Vite resolves directly.

### Commands

```bash
# Type-check
npm run typecheck    # or: npx tsc --noEmit

# Run tests (29 tests across 4 suites)
npm test

# Watch mode
npm run test:watch
```

### Test Structure

```
shared/src/__tests__/
├── setup.ts               — imports @testing-library/jest-dom
├── utils.test.ts          — timeAgo, formatPoints, formatDate, countDescendants (16 tests)
├── useFetch.test.ts       — Loading states, error handling, refresh, unmount safety (5 tests)
├── useClipboard.test.ts   — Copy, auto-reset, fallback to execCommand (4 tests)
└── useDebounce.test.ts    — Debounce timing, rapid-change cancellation, default delay (4 tests)
```

---

## Backend

All commands run from `backend/`.

### Dev Server

```bash
# Start dev server with hot-reload
npm run start:dev

# Production build + start
npm run build && node dist/main.js
```

### Database

```bash
# Run migrations (dev — creates migration files)
npx prisma migrate dev --name <migration-name>

# Run migrations (production — applies existing migrations)
npx prisma migrate deploy

# Generate Prisma client (after schema changes)
npx prisma generate

# Seed database with test data
npm run seed

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

### Testing

```bash
# One-time: create test database
/opt/homebrew/opt/postgresql@17/bin/createdb -U postgres pionts_test

# Run migrations on test database
npm run test:e2e:setup-db

# Unit tests (113 tests across 13 suites)
npm test

# E2E tests (168 tests across 9 suites, uses pionts_test database)
npm run test:e2e

# Unit tests with coverage report
npm run test:cov

# Run everything (unit + E2E)
npm run test:all
```

### Test Structure

```
backend/test/
├── helpers/
│   ├── test-app.helper.ts      — Creates NestJS test app (with cookieParser, session, validation)
│   ├── auth.helper.ts           — Auth helpers: registerUser, loginUser, authGet/Post/Put/Delete
│   ├── prisma-test.helper.ts    — Test DB connection + resetDatabase()
│   └── factories.ts             — Factory functions for seeding test data
├── mocks/
│   └── prisma.mock.ts           — Deep mock factory for PrismaService
├── setup/
│   └── jest.setup.ts            — Global Jest setup
├── unit/
│   ├── auth.service.spec.ts     — Register, login, refresh token flows
│   ├── api-key.service.spec.ts  — Key generation, validation, revocation
│   ├── app-config.service.spec.ts — Settings cache, defaults, redemption tiers
│   ├── customers.service.spec.ts  — CRUD, points award/deduct, search, flags
│   ├── referrals.service.spec.ts  — Referral tree linking, stats, earnings
│   ├── referral-code.service.spec.ts — Code generation, collision handling
│   ├── transformers.spec.ts     — camelCase→snake_case transformations
│   ├── orgs.service.spec.ts     — Org CRUD, member management, safeguards
│   ├── projects.service.spec.ts — Project CRUD, key generation, settings init
│   ├── project-owner.guard.spec.ts — Org ownership verification
│   ├── roles.guard.spec.ts      — Role-based access control
│   ├── secret-key.guard.spec.ts — Secret key validation, reject public keys
│   └── discount.service.spec.ts — Validate, mark-used, cross-project isolation
└── e2e/
    ├── auth.e2e-spec.ts         — Register, login, refresh (cookie-based), logout, /me
    ├── orgs.e2e-spec.ts         — Org details, update, members CRUD, role enforcement
    ├── projects.e2e-spec.ts     — Project CRUD, API keys, cross-org isolation
    ├── dashboard.e2e-spec.ts    — Stats, customers, award/deduct, settings, referrals
    ├── admin.e2e-spec.ts        — Legacy session-based admin endpoints
    ├── customer-api.e2e-spec.ts — SDK/widget customer endpoints
    ├── webhook.e2e-spec.ts      — Order, refund, customer webhooks (generic + Shopify)
    ├── discount.e2e-spec.ts     — Validate, mark-used, auth, cross-project isolation
    └── security.e2e-spec.ts     — SQL injection, auth bypass, rate limiting, CORS
```

### Test Conventions

- **Unit tests** use `createPrismaMock()` for isolated service testing with `jest.fn()` stubs
- **E2E tests** use a real PostgreSQL test database (`pionts_test`), reset between suites via `resetDatabase()`
- **Auth in E2E**: `registerUser()` / `loginUser()` return `{ body, refreshCookie }` — refresh tokens are in httpOnly cookies, not response bodies
- **JWT helpers**: `authGet`, `authPost`, `authPut`, `authDelete` make Bearer-authenticated requests
- **Factories**: `createOrg()`, `createUser()`, `createProject()`, `createCustomer()`, `createPointsLog()`, `createReferralTree()`, `createSetting()` for seeding test data
- **Cross-org isolation** is tested in projects and dashboard E2E suites

### Backend Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| auth | JWT signup/login/refresh, API key generation | auth.service.ts, api-key.service.ts |
| orgs | Organization CRUD, member management | orgs.service.ts, orgs.controller.ts |
| projects | Project CRUD, API key management | projects.service.ts, projects.controller.ts |
| customers | Core points logic, CRUD, tier multipliers | customers.service.ts (380 LOC) |
| referrals | Referral tree building, earnings calc | referrals.service.ts (200 LOC) |
| redemptions | Points → discount code conversion | redemptions.service.ts |
| webhooks | Order/refund/customer processing (S2S) | webhooks.controller.ts (206 LOC) |
| sdk | Public API (10 endpoints), HMAC auth | sdk.controller.ts, sdk.service.ts |
| dashboard | Project-scoped admin API | dashboard.controller.ts |
| discount | Discount code validate + mark-used | discount.service.ts |
| analytics | Points economy, funnel, segments, CSV | analytics.service.ts (246 LOC) |
| billing | Stripe integration, plan limits | billing.service.ts, stripe.service.ts |
| notifications | Email dispatch (welcome, points, referral) | notification.service.ts |
| health | GET /health endpoint | health.controller.ts |
| shopify | Shopify discount code creation | shopify.service.ts |
| customer-auth | Email OTP, widget login, rewards SPA | customer-auth.controller.ts |
| config | Per-project settings cache + defaults | app-config.service.ts |
| admin | Legacy session-based (backward compat) | admin.controller.ts |

---

## Frontend (admin-ui)

All commands run from `admin-ui/`. TypeScript + Tailwind CSS v4.

### Building

```bash
# Production build
npm run build

# Type-check
npm run typecheck
```

### Testing

```bash
# Run all tests (16 tests across 4 suites)
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

### Test Structure

```
admin-ui/src/__tests__/
├── StatCard.test.tsx       — Renders value, label, optional icon (3 tests)
├── PointsForm.test.tsx     — Validation, submit callback, input clearing (4 tests)
├── AuthContext.test.tsx     — Login/logout flows, session restore, provider requirement (5 tests)
└── Login.test.tsx           — Form submit, error display, loading state (4 tests)
```

### Test Conventions

- **Framework**: Vitest + React Testing Library + jsdom
- **Setup file**: `src/test/setup.ts` imports `@testing-library/jest-dom` for DOM matchers
- **Mocking**: `vi.mock('../api')` for API module; `vi.useFakeTimers()` for time-dependent tests
- **Component tests** wrap in required providers (`AuthProvider`, `MemoryRouter`) as needed
- **User interactions** use `@testing-library/user-event` for realistic event simulation
- **Shared code tests** (utils, useFetch, useDebounce) live in `shared/src/__tests__/`

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/admin/login` | Email + password form |
| Signup | `/admin/signup` | Create org + user account |
| ProjectList | `/admin/projects` | Card grid of org's projects |
| ProjectCreate | `/admin/projects/new` | Create project form |
| Overview | `/admin/` | Stats, activity feed, top referrers |
| Customers | `/admin/customers` | Paginated table with search/sort |
| CustomerDetail | `/admin/customers/:id` | Profile, award/deduct, referrals, history |
| Settings | `/admin/settings` | Points config, tiers, anti-abuse, gamification, email |
| Referrals | `/admin/referrals` | Referral tree visualization |
| Analytics | `/admin/analytics` | Points economy, funnel, segments |
| ApiKeys | `/admin/api-keys` | Generate/revoke API keys |
| Billing | `/admin/billing` | Plan selection, usage |
| Guides | `/admin/guides` | Integration guides (Shopify, WordPress, Custom) |
| OrgSettings | `/admin/org` | Org name, members, invite |

### SOLID Component Splits

Large components have been decomposed into focused sub-components:

- **ReferralTree** → `components/referral-tree/` (7 files + index: ReferralTree, RootChain, DownlineNode, LevelBreakdown, EmptyNetwork, Pagination, tree-utils)
- **CustomerDetail** → `pages/customer-detail/` (7 files + index: CustomerDetail, CustomerHero, CustomerProfile, ReferralChain, ManualActions, DirectReferralsTable, CustomerHistory)
- **OrgSettings** → `pages/org-settings/` (4 files + index: OrgSettings, OrgDetailsForm, MemberList, AddMemberForm)
- **Analytics** → `pages/analytics/` (4 files: PointsEconomyChart, ReferralFunnel, CustomerSegments, ExportButtons)
- **Billing** → `pages/billing/` (2 files: PlanCard, UsageBar)
- **Guides** → `pages/guides/` (4 files: ShopifyGuide, WordPressGuide, CustomGuide, ApiReference)

---

## Widget (client-ui)

All commands run from `client-ui/`. TypeScript + Tailwind CSS v4.

### Building

```bash
# SPA build (78 modules)
npm run build

# UMD bundle for SDK embedding (~282 KB + 32 KB CSS)
npm run build:umd

# Type-check
npm run typecheck
```

### Testing

```bash
# Run all tests (18 tests across 4 suites)
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

### Test Structure

```
client-ui/src/__tests__/
├── useProgress.test.ts     — Tier calculation, progress %, sorting, edge cases (6 tests)
├── TierCard.test.tsx       — Renders points/discount, enabled/disabled, redeem callback (4 tests)
├── ProgressRing.test.tsx   — SVG viewBox, children rendering, gradient ID (3 tests)
└── LoginPage.test.tsx      — Email/code steps, error display, navigation (5 tests)
```

### Test Conventions

- **Framework**: Vitest + React Testing Library + jsdom (same as admin-ui)
- **Setup file**: `src/test/setup.ts` imports `@testing-library/jest-dom`
- **Mocking**: `vi.mock('../api')` for API module; `navigator.clipboard` mocked for clipboard tests
- **Component tests** wrap in `AuthProvider` where auth context is needed
- **User interactions** use `@testing-library/user-event` for realistic event simulation
- **Shared code tests** (utils, useClipboard) live in `shared/src/__tests__/`

### Widget Components

| Component | Description |
|-----------|-------------|
| Dashboard | Points balance, progress ring, history |
| Earn | Earn actions checklist (signup, follow, share, review, birthday) |
| Redeem | Tier cards, redeem button, discount code display |
| Referrals | Referral link + share, network tree, downline |
| LoginPage | Email + OTP code entry for widget login |
| FloatingWrapper | Slide-out panel for floating mode |
| TierBadge | Gamification tier display (Bronze/Silver/Gold) |
| Leaderboard | Top referrers list |
| AnimatedCounter | Points counter animation |
| ConfettiEffect | Confetti on redeem |

### SOLID Component Splits

- **Referrals** → `pages/referrals/` (5 files + index: Referrals, ReferralLinkSection, NetworkTreeSection, DownlineNode, EmptyNetwork)

---

## SDK (loyalty.js)

All commands run from `sdk/`.

### Building

```bash
# Build IIFE bundle (~4KB)
npm run build
```

### Manual Testing

Open `sdk/test.html` in a browser with backend running on `localhost:3000`.

---

## Full Test Summary

| Package | Suites | Tests |
|---------|--------|-------|
| shared | 4 | 29 |
| backend (unit) | 13 | 113 |
| backend (e2e) | 9 | 168 |
| admin-ui | 4 | 16 |
| client-ui | 4 | 18 |
| **Total** | **34** | **344** |

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main`:

1. **lint-and-typecheck** — TypeScript check on shared, backend, admin-ui, client-ui
2. **backend-tests** — Unit + E2E with PostgreSQL service container
3. **frontend-tests** — Vitest for shared, admin-ui, client-ui
4. **build** — Backend, admin-ui (SPA), client-ui (SPA + UMD), SDK
5. **deploy** — SSH to Hetzner VPS, git pull, rebuild all, PM2 restart (main branch only)

---

## Deployment

Production server at Hetzner VPS:

1. **Nginx** reverse proxy with SSL (Let's Encrypt) — config at `deploy/nginx.conf`
2. **PM2** process manager for NestJS backend
3. **PostgreSQL** database (local or managed)
4. **Static assets**: admin-ui served via ServeStatic, client-ui UMD + SDK via `/widget/` and `/sdk/` routes
5. **Caching**: SDK/widget 1-day cache, admin assets 1-year immutable cache
