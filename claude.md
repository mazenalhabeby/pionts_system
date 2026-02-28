# Pionts — Multi-Tenant Loyalty & Referral SaaS Platform

## PROJECT OVERVIEW

Pionts is a **multi-tenant SaaS loyalty + referral rewards platform**. Any company can sign up, create a project, and integrate a points system into their website — Shopify, WordPress, custom-built, anything with a `<script>` tag.

Each project gets its own customers, points config, referral tree, and API keys. The platform handles all logic server-side; websites interact via a universal JavaScript SDK or direct API calls.

**Evolution**: Originally built as a single-tenant system for 8bc.store (Shopify). Now being rebuilt as a platform that any business can use.

---

## CODING PRINCIPLES

- Follow DRY (Don't Repeat Yourself) — extract shared logic into reusable utilities, hooks, components, and services. Never duplicate code across files.
- Follow SOLID principles:
  - **Single Responsibility**: Each module/component/function does one thing well
  - **Open/Closed**: Use configuration objects and strategy patterns — extend behavior without modifying existing code
  - **Liskov Substitution**: Shared interfaces/types are consistent across implementations
  - **Interface Segregation**: API service functions are granular — consumers only depend on what they use
  - **Dependency Inversion**: Components depend on abstractions (hooks, services) not concrete implementations
- Backend: Extract DB operations into a repository/service layer, middleware into separate modules, route handlers into controllers
- Frontend: Use custom React hooks for data fetching and state, shared UI components, a centralized API service, and constants/config files for magic values

---

## TECH STACK

- **Backend**: NestJS (TypeScript) — modular, scalable, built-in guards/interceptors/pipes
- **Database**: PostgreSQL (via Prisma ORM) — multi-tenant, relational, production-ready
- **Auth**: JWT (access + refresh tokens) for dashboard users, API keys + HMAC for SDK/webhook auth
- **Shared Library**: `@pionts/shared` (TypeScript) — types, hooks, utils, icons shared between frontends
- **Frontend Dashboard**: React 19 + TypeScript + Tailwind CSS v4 (Vite SPA) — org/project management + per-project admin
- **Frontend Widget**: React 19 + TypeScript + Tailwind CSS v4 (Vite SPA + UMD bundle) — embeddable loyalty panel for any website
- **JavaScript SDK**: Lightweight IIFE loader (`loyalty.js`, ~1.4KB) — initializes widget, handles identity, manages referral cookies
- **Testing**: Vitest (frontend), Jest (backend), React Testing Library
- **Hosting**: Hetzner VPS (Nginx reverse proxy, PM2, Let's Encrypt SSL)

---

## MULTI-TENANT ARCHITECTURE

```
Organization (company account)
├── User (team members with roles: owner, admin, member)
├── Project "Main Store" (one points system instance)
│   ├── API Keys (public key for SDK, secret key for server-to-server)
│   ├── Settings (points config, tiers, anti-abuse rules)
│   ├── Customers (end-users earning/spending points)
│   ├── Points Log (all point transactions)
│   ├── Referral Tree (3-level referral chains)
│   ├── Redemptions (discount codes generated)
│   └── Processed Orders (dedup webhook handling)
├── Project "Second Store"
│   └── ... (completely separate data)
└── ...
```

### Key Principles
- **Project isolation**: every query filters by `projectId` — no data leaks between projects
- **Two auth layers**: JWT tokens for dashboard users, API keys for SDK/webhooks
- **HMAC identity verification**: company's server signs customer email with secret key, SDK sends signature, API verifies — prevents spoofing
- **API-first**: the widget is just a pre-built UI on top of the public API — companies can build custom UIs too

---

## DATABASE SCHEMA (PostgreSQL + Prisma)

### Core Platform Tables

#### Organization
```
id              UUID PRIMARY KEY
name            TEXT
slug            TEXT UNIQUE (URL-friendly identifier)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### User
```
id              UUID PRIMARY KEY
org_id          UUID (FK → Organization)
email           TEXT UNIQUE
password_hash   TEXT
name            TEXT
role            ENUM (owner, admin, member)
created_at      TIMESTAMP
last_login      TIMESTAMP
```

#### Project
```
id              UUID PRIMARY KEY
org_id          UUID (FK → Organization)
name            TEXT
domain          TEXT (e.g. "coolstore.com" — for display/CORS)
status          ENUM (active, paused, archived)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### ApiKey
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
type            ENUM (public, secret)
key             TEXT UNIQUE (prefixed: pk_live_... or sk_live_...)
label           TEXT (human-friendly name)
created_at      TIMESTAMP
last_used_at    TIMESTAMP
revoked         BOOLEAN DEFAULT false
```

### Per-Project Data Tables (all scoped by project_id)

#### Customer
```
id                    UUID PRIMARY KEY
project_id            UUID (FK → Project)
external_customer_id  TEXT (e.g. Shopify customer ID — optional)
email                 TEXT
name                  TEXT
referral_code         TEXT (6-char alphanumeric, unique within project)
referred_by           TEXT (referral_code of whoever referred them)
points_balance        INTEGER DEFAULT 0
points_earned_total   INTEGER DEFAULT 0
order_count           INTEGER DEFAULT 0
signup_rewarded       BOOLEAN DEFAULT false
first_order_rewarded  BOOLEAN DEFAULT false
followed_tiktok       BOOLEAN DEFAULT false
followed_instagram    BOOLEAN DEFAULT false
birthday              DATE
birthday_rewarded_year INTEGER DEFAULT 0
created_at            TIMESTAMP
last_activity         TIMESTAMP

UNIQUE(project_id, email)
UNIQUE(project_id, referral_code)
```

#### PointsLog
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
customer_id     UUID (FK → Customer)
points          INTEGER (positive = earned, negative = spent/clawback)
type            TEXT (signup|purchase|first_order|referral_l2|referral_l3|review_photo|review_text|follow_tiktok|follow_instagram|share_product|birthday|redeem|clawback|manual_award|manual_deduct)
description     TEXT
order_id        TEXT (nullable, links to external order)
created_at      TIMESTAMP
```

#### ReferralTree
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
customer_id     UUID (FK → Customer, the new buyer)
parent_id       UUID (FK → Customer, Level 2 referrer)
grandparent_id  UUID (FK → Customer, Level 3 grand-referrer, nullable)
```

#### Redemption
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
customer_id     UUID (FK → Customer)
points_spent    INTEGER
discount_amount DECIMAL
discount_code   TEXT UNIQUE
used            BOOLEAN DEFAULT false
created_at      TIMESTAMP
```

#### ProcessedOrder
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
order_id        TEXT
processed_at    TIMESTAMP

UNIQUE(project_id, order_id)
```

#### Setting
```
id              UUID PRIMARY KEY
project_id      UUID (FK → Project)
key             TEXT
value           TEXT
updated_at      TIMESTAMP

UNIQUE(project_id, key)
```

---

## POINTS ENGINES (per-project, configurable)

### Engine 1 — Points Loyalty (Personal Rewards)

Default point values (configurable per project via Settings):

| Action | Default Points | Rules |
|--------|---------------|-------|
| Sign up | 20 | One-time welcome bonus |
| Every purchase | 10 | Flat per order |
| First order ever | 50 | Bonus on top of purchase points |
| Product review with photo | 12 | Per review |
| Text-only review | 5 | Per review |
| Follow on TikTok | 10 | One-time only |
| Follow on Instagram | 10 | One-time only |
| Share product on social media | 5 | Per share |
| Birthday | 25 | Once per year |

### Engine 2 — 3-Level Referral (Network Rewards)

| Level | Who | Default Points |
|-------|-----|---------------|
| Level 1 | The Buyer | 10 points |
| Level 2 | The Referrer | 5 points |
| Level 3 | The Grand-Referrer | 2 points |
| Level 4+ | Nobody | 0 — chain stops at 3 |

- New buyer via referral gets configurable discount (default 5%) on first order
- Minimum order amount to trigger referral points (default 10 in local currency)

### Redemption Tiers (configurable per project)

| Points | Default Reward |
|--------|---------------|
| 50 | 2 off |
| 100 | 5 off |
| 200 | 10 off |
| 400 | 20 off |

### Referral Tree Logic

When Customer C signs up referred by B, who was referred by A:
```
referral_tree for C: customer_id=C, parent_id=B, grandparent_id=A
```

When D signs up referred by C:
```
referral_tree for D: customer_id=D, parent_id=C, grandparent_id=B
(B is C's parent → B becomes D's grandparent. A gets nothing — L4, capped.)
```

To find grandparent_id: look up parent's referral_tree entry → their parent_id becomes the new grandparent_id.

### Anti-Abuse Rules (configurable per project)

- Minimum order amount to trigger referral points (default 10)
- Maximum direct referrals per customer (default 50)
- Points expire after N months of no activity (default 12)
- Self-referrals blocked
- Refunded orders = all associated points clawed back
- ProcessedOrder table prevents double-processing
- One-time flags: signup, first order, social follows
- Birthday: once per calendar year

---

## API DESIGN (versioned, /api/v1/)

### Authentication

Two auth mechanisms:
1. **JWT** — for dashboard users (Authorization: Bearer <token>)
2. **API Key** — for SDK and server-to-server (X-Project-Key: pk_... or X-Secret-Key: sk_...)

Public key (`pk_`) — used by the JavaScript SDK (browser-safe, read + limited writes)
Secret key (`sk_`) — used by company's backend (full access, webhook submission)

### Dashboard API (JWT auth)

```
POST   /api/v1/auth/signup          → Create org + first user
POST   /api/v1/auth/login           → Returns access + refresh tokens
POST   /api/v1/auth/refresh         → Refresh access token
POST   /api/v1/auth/logout          → Invalidate refresh token

GET    /api/v1/orgs/me              → Current org details
PUT    /api/v1/orgs/me              → Update org
GET    /api/v1/orgs/me/members      → List team members
POST   /api/v1/orgs/me/members      → Invite member
DELETE /api/v1/orgs/me/members/:id  → Remove member

POST   /api/v1/projects             → Create project
GET    /api/v1/projects             → List projects in org
GET    /api/v1/projects/:id         → Project details
PUT    /api/v1/projects/:id         → Update project
DELETE /api/v1/projects/:id         → Archive project

POST   /api/v1/projects/:id/keys    → Generate API key
GET    /api/v1/projects/:id/keys    → List API keys
DELETE /api/v1/projects/:id/keys/:keyId → Revoke key

GET    /api/v1/projects/:id/stats       → Overview stats
GET    /api/v1/projects/:id/customers   → Customer list (search, sort, paginate)
GET    /api/v1/projects/:id/customers/:custId → Customer detail + history
POST   /api/v1/projects/:id/customers/:custId/award  → Manual award
POST   /api/v1/projects/:id/customers/:custId/deduct → Manual deduct
GET    /api/v1/projects/:id/settings    → Project settings
PUT    /api/v1/projects/:id/settings    → Update settings
GET    /api/v1/projects/:id/referrals   → Referral tree data
```

### Public SDK API (public API key auth)

```
GET    /api/v1/sdk/customer              → Get customer data (balance, history, referral stats, settings)
POST   /api/v1/sdk/signup                → Register customer (email, name, referral_code)
POST   /api/v1/sdk/redeem                → Redeem points for discount
POST   /api/v1/sdk/award                 → Claim action (follow, share, birthday, review)
GET    /api/v1/sdk/check-ref/:code       → Validate referral code
GET    /api/v1/sdk/customer/referrals    → Customer's referral network tree
GET    /api/v1/sdk/customer/redemptions  → Customer's redemption history
POST   /api/v1/sdk/auth/send-code        → Send email OTP for widget login
POST   /api/v1/sdk/auth/verify-code      → Verify OTP and issue JWT token
GET    /api/v1/sdk/leaderboard           → Top referrers (opt-in)
```

All SDK requests include: `X-Project-Key: pk_...` + customer identity (email + HMAC signature or JWT).

### Server-to-Server API (secret key auth)

```
POST   /api/v1/webhooks/order       → Process order (purchase points + referral chain)
POST   /api/v1/webhooks/refund      → Process refund (clawback points)
POST   /api/v1/webhooks/customer    → Customer created (signup bonus)
POST   /api/v1/discount/validate    → Validate discount code at checkout
POST   /api/v1/discount/mark-used   → Mark discount code as used (idempotent)
```

All server requests include: `X-Secret-Key: sk_...`

### Analytics API (JWT auth, project-scoped)

```
GET    /api/v1/projects/:id/analytics/points-economy  → Points issued vs redeemed over time
GET    /api/v1/projects/:id/analytics/referral-funnel  → Link clicks → signups → purchases
GET    /api/v1/projects/:id/analytics/segments         → Active, at-risk, churned customers
GET    /api/v1/projects/:id/analytics/export/customers → CSV export of all customers
GET    /api/v1/projects/:id/analytics/export/points    → CSV export of points log
```

### Billing API (JWT auth)

```
GET    /api/v1/billing/subscription  → Current plan + usage
POST   /api/v1/billing/checkout      → Create Stripe checkout session
POST   /api/v1/billing/portal        → Create Stripe customer portal session
POST   /api/v1/billing/webhook       → Stripe webhook handler
```

---

## JAVASCRIPT SDK (loyalty.js)

Lightweight script that any website embeds:

```html
<script src="https://cdn.pionts.com/v1/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: 'pk_live_abc123',
    customer: {
      email: 'john@gmail.com',
      name: 'John',
      hmac: 'a3f8c2...'  // HMAC-SHA256(email, secret_key) — generated server-side
    },
    mode: 'floating'  // or 'embedded' with container: '#my-div'
  });
</script>
```

### SDK Responsibilities
- Load and render the widget (React UMD bundle)
- Handle customer identity + HMAC verification
- Manage referral cookie (?ref= parameter → stored 30 days)
- Call public API endpoints
- Support two modes: `floating` (slide-out panel) and `embedded` (inline in a div)

### Platform-Specific Identity Examples

**Shopify (Liquid):**
```liquid
{% if customer %}
<script>
  Loyalty.init({
    projectKey: 'pk_live_abc123',
    customer: {
      email: '{{ customer.email }}',
      name: '{{ customer.first_name }}',
      hmac: '{{ customer.email | hmac_sha256: "sk_live_xyz789" }}'
    }
  });
</script>
{% endif %}
```

**WordPress/WooCommerce (PHP):**
```php
<?php if (is_user_logged_in()): $u = wp_get_current_user(); ?>
<script>
  Loyalty.init({
    projectKey: 'pk_live_abc123',
    customer: {
      email: '<?= $u->user_email ?>',
      name: '<?= $u->first_name ?>',
      hmac: '<?= hash_hmac("sha256", $u->user_email, "sk_live_xyz789") ?>'
    }
  });
</script>
<?php endif; ?>
```

**Custom (any backend):**
```js
// Server generates HMAC, passes to page
const hmac = crypto.createHmac('sha256', SECRET_KEY).update(user.email).digest('hex');
```

### Fallback: Widget Login
If company doesn't pass identity, the widget can show an email + magic-link/OTP flow so the customer authenticates directly.

---

## WIDGET UI (embeddable, configurable)

The widget is a React 19 + TypeScript + Tailwind CSS v4 app, adapted to be platform-agnostic. Builds as both a Vite SPA (standalone mode with react-router) and a UMD bundle (SDK mode with tab navigation).

### Widget Sections (5 panels):
1. **Points Balance Header** — greeting, balance, progress bar to next tier, total earned + orders
2. **Referral Link** — copy-able link, share buttons, direct/network referral stats
3. **Redeem Points** — tier cards, redeem button, discount code display with copy
4. **Earn More Points** — checklist of actions (completed items show checkmark)
5. **Points History** — last 20 entries, color-coded, relative timestamps

### Widget Configuration (per project, set in dashboard)
- **Colors**: primary accent, background, text (default: orange #ff3c00, dark #050505, white #f2f2f2)
- **Logo**: company logo URL (optional)
- **Social URLs**: TikTok profile, Instagram profile
- **Referral link base URL**: the company's domain (e.g. "https://coolstore.com")
- **Mode**: floating panel or embedded

---

## DASHBOARD (SaaS admin panel)

The dashboard at `https://app.pionts.com` (or self-hosted equivalent). Multi-level:

### Level 1 — Platform Auth
- Signup (creates org + first user)
- Login (email + password → JWT)
- Org settings, team members, billing (future)

### Level 2 — Project Management
- List projects, create new, archive
- API key management (generate, revoke, view usage)
- Quick-switch between projects

### Level 3 — Per-Project Admin (existing pages, scoped)
- **Overview**: stats cards, recent activity, top referrers
- **Customers**: searchable/sortable table with pagination, click for detail
- **Customer Detail**: profile, manual award/deduct, referral chain, direct referrals table, history
- **Settings**: points config, tiers, anti-abuse rules, widget appearance, gamification, email
- **Referral Network**: tree visualization with level breakdown + pagination
- **Analytics**: points economy chart, referral funnel, customer segments, CSV export
- **API Keys**: generate/revoke key pairs, masked prefix display
- **Billing**: plan selection (Free/Pro), usage bars, Stripe checkout
- **Guides**: step-by-step integration for Shopify, WordPress, Custom, + API reference

### Dashboard Architecture
- React 19 SPA with React Router, TypeScript (strict), Tailwind CSS v4
- JWT auth via AuthContext
- Project selection context (current project scoped globally)
- All API calls include project ID in URL path
- Reusable components: StatCard, DataTable, ActivityFeed, PointsForm, ReferralTree, SettingsForm
- Shared code imported from `@pionts/shared` (types, hooks, utils, icons)

---

## ENVIRONMENT VARIABLES

```
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pionts

# Auth
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session (for backward compat during migration)
SESSION_SECRET=random_string

# Platform
APP_URL=https://app.pionts.com
SDK_CDN_URL=https://cdn.pionts.com
```

Per-project secrets (Shopify tokens, etc.) are stored encrypted in the Project or a separate IntegrationConfig table — NOT in .env.

---

## FILE STRUCTURE

```
pionts/
├── shared/                         — @pionts/shared TypeScript package (imported via Vite alias)
│   ├── src/
│   │   ├── index.ts                — Barrel re-exports for all shared code
│   │   ├── types/
│   │   │   ├── index.ts            — Customer, PointsLogEntry, ReferralNode, RedemptionTier, etc.
│   │   │   └── api.types.ts        — WidgetApi, SdkConfig, UseFetchResult interfaces
│   │   ├── utils/
│   │   │   └── index.ts            — timeAgo, formatPoints, formatDate, countDescendants
│   │   ├── hooks/
│   │   │   ├── useFetch.ts         — Data fetching with loading/error/refresh (mountedRef safety)
│   │   │   ├── useClipboard.ts     — Copy-to-clipboard with fallback
│   │   │   └── useDebounce.ts      — Value debouncing
│   │   ├── components/
│   │   │   └── Icons.tsx           — 12 SVG icon components
│   │   ├── lib/
│   │   │   └── request.ts          — Base HTTP fetch helper
│   │   └── __tests__/              — 29 tests across 4 suites
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           — All models (Org, User, Project, ApiKey, Customer, etc.)
│   │   └── seed.ts                 — Dev seed data (org, users, customers, referrals, points)
│   ├── src/
│   │   ├── main.ts                 — NestJS bootstrap (helmet, compression, CORS, validation)
│   │   ├── app.module.ts           — Root module (ServeStatic, ThrottlerModule, all imports)
│   │   ├── prisma/                 — PrismaService + PrismaModule (global)
│   │   ├── config/                 — AppConfigService (per-project settings cache + defaults)
│   │   ├── common/
│   │   │   ├── guards/             — AdminAuthGuard, ProjectOwnerGuard, RolesGuard, SecretKeyGuard, WebhookHmacGuard
│   │   │   ├── decorators/         — @Roles, @SecretKeyProject
│   │   │   ├── helpers/            — project-resolver.ts
│   │   │   └── filters/            — HttpExceptionFilter
│   │   ├── auth/                   — AuthModule (signup, login, refresh, JWT strategy, API key service)
│   │   ├── orgs/                   — OrgsModule (org CRUD, member management)
│   │   ├── projects/               — ProjectsModule (project CRUD, API key management)
│   │   ├── customers/              — CustomersModule (CRUD, points award/deduct, tier multipliers)
│   │   ├── referrals/              — ReferralsModule (tree building, earnings, downline)
│   │   ├── redemptions/            — RedemptionsModule (points → discount codes)
│   │   ├── webhooks/               — WebhooksModule (order/refund/customer, generic + Shopify payloads)
│   │   ├── sdk/                    — SdkModule (10 endpoints, HMAC + API key + JWT auth, leaderboard)
│   │   ├── dashboard/              — DashboardModule (project-scoped admin API)
│   │   ├── discount/               — DiscountModule (validate + mark-used discount codes)
│   │   ├── analytics/              — AnalyticsModule (points economy, referral funnel, segments, CSV export)
│   │   ├── billing/                — BillingModule (Stripe, plan limits, usage tracking)
│   │   ├── notifications/          — NotificationsModule (email: welcome, points, referral)
│   │   ├── health/                 — HealthModule (GET /health endpoint)
│   │   ├── shopify/                — ShopifyModule (discount code creation via Admin API)
│   │   ├── customer-auth/          — CustomerAuthModule (email OTP, widget login, rewards SPA controller)
│   │   ├── admin/                  — AdminModule (legacy session-based, backward compat)
│   │   └── utils/                  — ReferralCodeService, field transformers
│   ├── test/
│   │   ├── unit/                   — 13 unit test suites (services, guards)
│   │   ├── e2e/                    — 9 E2E test suites (auth, orgs, projects, dashboard, webhooks, discount, security)
│   │   ├── helpers/                — test-app, auth, prisma-test, factories
│   │   └── mocks/                  — prisma.mock.ts
│   └── package.json
│
├── admin-ui/                       — React 19 dashboard SPA (TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx, Signup.tsx           — Auth pages
│   │   │   ├── ProjectList.tsx, ProjectCreate.tsx — Project management
│   │   │   ├── Overview.tsx, Customers.tsx     — Dashboard pages
│   │   │   ├── Settings.tsx, Referrals.tsx, ApiKeys.tsx
│   │   │   ├── Analytics.tsx, Billing.tsx, Guides.tsx
│   │   │   ├── customer-detail/               — Split: 7 sub-components + index
│   │   │   ├── org-settings/                  — Split: 4 sub-components + index
│   │   │   ├── analytics/                     — Split: 4 sub-components
│   │   │   ├── billing/                       — Split: 2 sub-components
│   │   │   └── guides/                        — Split: 4 sub-components (Shopify, WordPress, Custom, API Reference)
│   │   ├── components/
│   │   │   ├── StatCard.tsx, DataTable.tsx, ActivityFeed.tsx, PointsForm.tsx
│   │   │   ├── SettingsForm.tsx, Layout.tsx, CodeBlock.tsx, GuideStep.tsx
│   │   │   └── referral-tree/                 — Split: 7 sub-components + index (tree-utils, DownlineNode, etc.)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx                 — JWT auth + 13-min proactive refresh
│   │   │   └── ProjectContext.tsx              — Project selection + sessionStorage persistence
│   │   ├── hooks/
│   │   │   └── useCustomerDetail.ts
│   │   ├── api.ts                  — JWT auth + auto-refresh, 7 API namespaces
│   │   ├── constants.ts            — Nav items, setting groups, column definitions
│   │   ├── styles/admin.css        — Tailwind @theme + keyframes + pseudo-elements (~185 lines)
│   │   └── __tests__/              — 16 tests across 4 suites
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
│
├── client-ui/                      — React 19 embeddable widget (TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── main.tsx                — SPA entry point
│   │   ├── main-sdk.tsx            — UMD entry point (SDK mode)
│   │   ├── App.tsx                 — SPA router (standalone mode)
│   │   ├── WidgetApp.tsx           — Tab-based navigation (SDK mode)
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx, Earn.tsx, Redeem.tsx
│   │   │   └── referrals/          — Split: 5 sub-components + index
│   │   ├── components/
│   │   │   ├── CopyButton.tsx, EarnItem.tsx, FloatingWrapper.tsx
│   │   │   ├── HistoryEntry.tsx, Layout.tsx, LoginPage.tsx
│   │   │   ├── ProgressRing.tsx, TierCard.tsx, TierBadge.tsx
│   │   │   ├── AnimatedCounter.tsx, ConfettiEffect.tsx, Leaderboard.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── WidgetContext.tsx    — SDK state management
│   │   │   └── WidgetConfigContext.tsx — Dual-mode abstraction
│   │   ├── hooks/
│   │   │   ├── useCustomer.ts, useProgress.ts, useReferrals.ts, useTier.ts
│   │   ├── api.ts                  — Standalone mode API (session-based)
│   │   ├── api-sdk.ts              — SDK mode API (API key + HMAC headers)
│   │   ├── constants.ts
│   │   ├── styles/widget.css       — Tailwind @theme with CSS variable mapping (~240 lines)
│   │   └── __tests__/              — 18 tests across 4 suites
│   ├── tsconfig.json
│   ├── vite.config.ts              — SPA build config
│   ├── vite.config.umd.ts          — UMD library build config
│   ├── vitest.config.ts
│   └── package.json
│
├── sdk/                            — JavaScript SDK loader (loyalty.js)
│   ├── src/
│   │   └── index.ts                — Loyalty.init(), referral cookie, widget loader
│   ├── dist/loyalty.js             — IIFE bundle (~4KB)
│   └── package.json
│
├── deploy/
│   └── nginx.conf                  — Reverse proxy, SSL, caching, health checks
│
├── .github/workflows/
│   └── ci.yml                      — 4-stage CI/CD (typecheck, test, build, deploy)
│
└── docker-compose.yml              — PostgreSQL + backend (local dev)

---

## DEPLOYMENT

1. PostgreSQL instance (local or managed: Supabase, Neon, Railway, or self-hosted on Hetzner)
2. NestJS backend on Hetzner VPS via PM2
3. Nginx reverse proxy with SSL (Let's Encrypt)
4. Dashboard SPA served by NestJS (ServeStaticModule) or separate Nginx location
5. Widget UMD bundle + SDK served from CDN path or same server
6. `prisma migrate deploy` for database migrations
