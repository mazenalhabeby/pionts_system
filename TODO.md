# Pionts — Implementation Roadmap

> Multi-tenant loyalty & referral SaaS platform.
> Each phase ships working value. Don't skip ahead.

---

## Phase 1 — Foundation (Multi-Tenant Database + Auth)

The goal: everything works like before, but the database supports multiple tenants and auth is real.

### 1.1 PostgreSQL Setup
- [x] Install PostgreSQL dependencies (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` + dev types)
- [x] Install PostgreSQL locally (Homebrew postgresql@17)
- [x] Create `pionts` database
- [x] Update Prisma datasource from `sqlite` to `postgresql`
- [x] Update `DATABASE_URL` in `.env` (+ added `JWT_SECRET`, `JWT_REFRESH_SECRET`)
- [x] Remove SQLite PRAGMAs from `prisma.service.ts`
- [x] Delete `utils/datetime.ts` — replaced all `nowDatetime()` with `new Date()`

### 1.2 New Prisma Models
- [x] Add `Organization` model (id, name, slug, timestamps)
- [x] Add `User` model (id, orgId, email, passwordHash, name, role, timestamps)
- [x] Add `Project` model (id, orgId, name, domain, status, timestamps)
- [x] Add `ApiKey` model (id, projectId, type, keyHash, keyPrefix, label, revoked, timestamps)
- [x] Add `projectId` field to all existing models: Customer, PointsLog, ReferralTree, Redemption, ProcessedOrder, Setting
- [x] Update unique constraints to compound (projectId + email, projectId + referralCode, projectId + orderId, projectId + key)
- [x] Convert Int boolean flags to native `Boolean` (signupRewarded, firstOrderRewarded, followedTiktok, followedInstagram, emailVerified, used)
- [x] Convert String dates to `DateTime @default(now())`
- [x] Convert `Float` to `Decimal` for discountAmount
- [x] Run `prisma migrate dev` — clean migration applied (`multi_tenant_foundation`)

### 1.3 Auth Module (JWT)
- [x] Create `AuthModule` with `AuthService` and `AuthController`
- [x] Signup endpoint: creates org + user (owner, bcrypt hashed) + project + API key pair + default settings
- [x] Login endpoint: validates credentials, returns access + refresh tokens + user/org info
- [x] Refresh endpoint: validates refresh token, issues new token pair
- [x] `JwtStrategy` (Passport) for extracting user from Bearer token
- [x] `JwtAuthGuard` — protects JWT-authenticated routes
- [x] `@CurrentUser()` decorator — injects authenticated user into controllers

### 1.4 API Key System
- [x] Key generation: `pk_live_` + 24 random hex (public), `sk_live_` + 24 random hex (secret)
- [x] `ApiKeyGuard` — extracts key from `X-Project-Key` or `X-Secret-Key` header, resolves project
- [x] `@CurrentProject()` decorator — injects resolved project into controllers
- [x] Store SHA-256 hashed keys in DB, store prefix (first 12 chars) for display
- [x] `ApiKeyService` — generateKeyPair, validateKey, revokeKey, listKeys

### 1.5 Project Scoping
- [x] Update `CustomersService` — all 18+ methods take `projectId`, queries scoped with compound uniques
- [x] Update `ReferralsService` — all methods take `projectId`, scoped tree building
- [x] Update `RedemptionsService` — all methods take `projectId`
- [x] Update `AppConfigService` — per-project cache (`Map<number, Map<string, string>>`), lazy-load
- [x] Update `ReferralCodeService` — `generate(projectId)` checks uniqueness within project
- [x] Update `WebhooksController` — hardcoded `projectId=1` (TODO: resolve from API key in Phase 4)
- [x] Update `AdminController` — resolves projectId from session via `resolveProjectId()` helper
- [x] Update `CustomersController` — resolves projectId, passes to all service calls
- [x] Update `ReferralsController` — hardcoded `projectId=1` (TODO: resolve from API key in Phase 2)
- [x] Update `RedemptionsController` — resolves projectId from session
- [x] Update `CustomerAuthController` — passes projectId to findByEmail/resolveFromSession
- [x] Create `common/helpers/project-resolver.ts` — `resolveProjectId(session)` defaults to 1
- [x] Add case-insensitive search (`mode: 'insensitive'`) for PostgreSQL
- [x] Fix raw SQL GROUP BY for PostgreSQL strictness in `getTopReferrers()`
- [x] Register `AuthModule` in `app.module.ts`

### 1.6 Data Migration
- [x] Rewrite seed script for multi-tenant: creates Organization, User, Project, API keys, all data with `projectId`
- [x] Seed uses Boolean values and Date objects (not Int/String)
- [x] Run `prisma migrate dev --name multi-tenant-foundation`
- [x] Run `npm run seed` — 15 customers, 11 referrals, 124 points logs, 9 redemptions, 24 settings

### 1.7 Build Verification
- [x] Backend builds clean (`nest build` — 0 errors)
- [x] Admin UI builds clean (no frontend changes needed)

### 1.8 Testing — 47/47 PASS
- [x] Admin session login/logout/session check
- [x] Dashboard API: stats, customers, search, customer detail, award, deduct, settings, referrals
- [x] `POST /auth/register` creates new org + user + project + API keys
- [x] `POST /auth/login` returns JWT tokens
- [x] `GET /auth/me` with Bearer token returns user info
- [x] `POST /auth/refresh` issues new token pair
- [x] Widget customer signup works
- [x] Auth guards block unauthenticated requests (401)
- [x] SQL injection — 4 vectors tested, all safe (Prisma parameterized queries)
- [x] XSS injection — stored as plain text, no execution
- [x] Auth bypass — forged JWT, garbage tokens, wrong passwords all return 401
- [x] Path traversal — `../../etc/passwd`, `../.env` return 404
- [x] Rate limiting — ThrottlerModule returns 429 at ~60 req/min
- [x] Parameter tampering — negative points rejected, non-numeric rejected, missing customer returns 404
- [x] Large payloads — 1MB body handled safely, 5000-char email rejected
- [x] CORS — arbitrary origins blocked
- [x] JWT manipulation — tampered payload, expired token, "none" algorithm all return 401
- [x] Security headers — `helmet` added (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, no X-Powered-By)

---

## Phase 2 — Dashboard (Org & Project Management)

The goal: any user can sign up, create an org, create projects, and manage them.

### 2.1 Backend — Guards & Decorators
- [x] `ProjectOwnerGuard` — verifies project belongs to user's org, attaches project to request
- [x] `RolesGuard` + `@Roles('owner', 'admin')` decorator — role-based access control via Reflector metadata

### 2.2 Backend — Org & Project CRUD
- [x] `OrgsModule` — GET /api/v1/orgs/me (org details + counts), PUT /api/v1/orgs/me (update name)
- [x] `OrgsModule` — GET /api/v1/orgs/me/members, POST (add member with bcrypt hash), DELETE (remove, prevents self-delete and last-owner removal)
- [x] `ProjectsModule` — POST /api/v1/projects (create + generate keys + init settings), GET (list with counts)
- [x] `ProjectsModule` — GET/PUT/DELETE /api/v1/projects/:id (detail, update, archive) — all with ProjectOwnerGuard
- [x] `ProjectsModule` — POST/GET/DELETE /api/v1/projects/:id/keys — key generation, listing, revocation

### 2.3 Backend — Dashboard Module (Project-Scoped Data)
- [x] `DashboardModule` — controller at `/api/v1/projects/:id/` reusing existing services
- [x] GET stats, GET/search customers, GET customer detail, POST award/deduct, GET/POST settings, GET referrals
- [x] All routes protected by JwtAuthGuard + ProjectOwnerGuard
- [x] Same logic as AdminController but scoped via URL param projectId

### 2.4 Backend — Auth Cookie Refactor
- [x] Installed `cookie-parser` + `@types/cookie-parser`
- [x] Added `cookieParser()` middleware in `main.ts`
- [x] Refactored `AuthController`: refresh token sent as httpOnly cookie (`Set-Cookie: refresh_token; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=7d`)
- [x] `POST /auth/login` and `POST /auth/register` — set cookie, return only `accessToken` in JSON body
- [x] `POST /auth/refresh` — reads token from `req.cookies.refresh_token`, returns new `accessToken` + sets new cookie
- [x] `POST /auth/logout` — clears cookie

### 2.5 Backend — Module Registration
- [x] Imported `OrgsModule`, `ProjectsModule`, `DashboardModule` in `AppModule`
- [x] Backend TypeScript compiles clean (0 errors)

### 2.6 Frontend — API Rewrite
- [x] Rewrote `api.js` — JWT-based `request()` with Bearer token, auto-refresh on 401
- [x] New API sections: `authApi`, `orgApi`, `projectApi`, `dashboardApi`
- [x] Kept legacy `adminApi` for backward compat (session-based, `/admin/` prefix)
- [x] Updated `vite.config.js` — added proxies for `/auth` and `/api/v1`

### 2.7 Frontend — Auth Pages
- [x] Rewrote `AuthContext.jsx` — JWT-based with silent refresh on mount, 13-minute auto-refresh timer
- [x] Exposes `user`, `org`, `loading`, `authenticated`, `login(email, password)`, `signup(data)`, `logout()`
- [x] Rewrote `Login.jsx` — email + password form (replaced password-only), link to signup
- [x] Created `Signup.jsx` — org name, name, email, password form, navigates to `/projects` on success

### 2.8 Frontend — Project Management
- [x] Created `ProjectContext.jsx` — project list, current selection (persisted in sessionStorage), auto-select if 1 project
- [x] Created `ProjectList.jsx` — grid of project cards, click to select + navigate to dashboard
- [x] Created `ProjectCreate.jsx` — name + domain form, shows generated API keys on success (copy buttons)
- [x] Created `ApiKeys.jsx` — key table with type/prefix/status/created, generate new pair, revoke with confirmation
- [x] Created `OrgSettings.jsx` — org name edit, members table, add member form (email/name/password/role), remove member

### 2.9 Frontend — Scope Existing Pages
- [x] Updated all pages to use `useProject()` for `currentProject.id`
- [x] `Overview.jsx` — `dashboardApi.getStats(pid)`, shows project name in hero
- [x] `Customers.jsx` — `dashboardApi.getCustomers(pid, params)`
- [x] `CustomerDetail.jsx` — `dashboardApi.getCustomer(pid, custId)` + award/deduct
- [x] `Settings.jsx` — `dashboardApi.getSettings(pid)` + save
- [x] `Referrals.jsx` — `dashboardApi.getReferrals(pid)`
- [x] All pages show "Select a project first" if no project selected
- [x] Data re-fetches on project switch (pid in useFetch deps)

### 2.10 Frontend — Layout & Navigation
- [x] Updated `Layout.jsx` — project switcher dropdown, user name display, rebranded to "PIONTS"
- [x] Updated `App.jsx` — new routes: `/signup`, `/projects`, `/projects/new`, `/api-keys`, `/org`
- [x] Updated `main.jsx` — wrapped with `<ProjectProvider>`
- [x] Updated `constants.js` — added `SECONDARY_NAV` items
- [x] Added ~350 lines of CSS: project switcher, project list cards, project create, API keys, org settings, buttons, responsive

### 2.11 Build Verification
- [x] Backend TypeScript compiles clean (`tsc --noEmit` — 0 errors)
- [x] Frontend Vite builds clean (66 modules, 15 chunks, 691ms)
- [x] Old AdminController and session auth preserved for backward compat

### 2.12 E2E Verification — 32/32 PASS
- [x] POST /auth/register → creates org + user (owner) + project + API keys (201)
- [x] GET /auth/me → returns user info with org (200)
- [x] POST /auth/refresh → cookie-based refresh returns new accessToken (201)
- [x] GET /api/v1/orgs/me → org details with member/project counts (200)
- [x] PUT /api/v1/orgs/me → updates org name (200)
- [x] GET /api/v1/orgs/me/members → lists all members (200)
- [x] POST /api/v1/orgs/me/members → adds member with role (201)
- [x] GET /api/v1/projects → lists org's active projects with counts (200)
- [x] POST /api/v1/projects → creates project + generates API keys + inits settings (201)
- [x] GET /api/v1/projects/:id → project detail (200)
- [x] PUT /api/v1/projects/:id → updates project name/domain (200)
- [x] GET /api/v1/projects/:id/keys → lists API keys with masked prefixes (200)
- [x] POST /api/v1/projects/:id/keys → generates new key pair (201)
- [x] DELETE /api/v1/projects/:id/keys/:keyId → revokes key, verified revoked=true (200)
- [x] GET /api/v1/projects/:id/stats → returns stats + recentActivity + topReferrers (200)
- [x] GET /api/v1/projects/:id/customers → customer list with pagination (200)
- [x] GET /api/v1/projects/:id/settings → returns settings + defaults (200)
- [x] POST /api/v1/projects/:id/settings → updates specific settings (201)
- [x] GET /api/v1/projects/:id/referrals → returns referral tree data (200)
- [x] Cross-project isolation: accessing another org's project returns 403 (Access denied)
- [x] Cross-project isolation: accessing another org's dashboard stats returns 403
- [x] DELETE /api/v1/projects/:id → archives project (200), hidden from list
- [x] DELETE /api/v1/orgs/me/members/:id → removes member (200)
- [x] Self-delete prevention: cannot remove yourself (400)
- [x] POST /auth/logout → clears refresh cookie (201)
- [x] After logout, refresh returns 401 (No refresh token)
- [x] Old admin routes still exist (backward compat preserved)
- [x] Backend TypeScript compiles clean (0 errors)
- [x] Frontend Vite builds clean (66 modules, 15 chunks)
- [x] Settings persist across requests (verified signup_points changed from 20→30)
- [x] Project list excludes archived projects
- [x] API key revocation persists (revoked=true in list)

---

## Phase 3 — Universal JavaScript SDK

The goal: any website can integrate by pasting a script tag.

### 3.1 SDK Loader (loyalty.js)
- [x] Create `sdk/` package — TypeScript, builds to single minified IIFE (~1.4KB)
- [x] `Loyalty.init(config)` — accepts projectKey, customer (email + name + hmac), mode
- [x] Reads `?ref=` from URL → stores referral code in cookie (30 days)
- [x] Loads widget bundle (UMD) from CDN/server
- [x] Passes config to widget via `window.__PIONTS_CONFIG__` global

### 3.2 HMAC Identity Verification
- [x] Backend `SdkModule` with `SdkController` and `SdkService`
- [x] `SdkAuthGuard` — triple-layer auth: API key + HMAC + JWT token
- [x] Server recalculates HMAC using project's `hmacSecret` field
- [x] `crypto.timingSafeEqual` for HMAC comparison (prevents timing attacks)
- [x] Fallback: widget login flow (email + OTP) for sites that don't pass identity

### 3.3 SDK API Endpoints (9 endpoints at /api/v1/sdk/*)
- [x] `GET /api/v1/sdk/customer` — returns balance, history, referral stats, settings (tiers, earn actions)
- [x] `POST /api/v1/sdk/signup` — register customer with optional referral code
- [x] `POST /api/v1/sdk/redeem` — redeem points for discount code
- [x] `POST /api/v1/sdk/award` — claim action (follow_tiktok, follow_instagram, share_product)
- [x] `GET /api/v1/sdk/check-ref/:code` — validate referral code
- [x] `GET /api/v1/sdk/customer/referrals` — customer's referral network tree
- [x] `GET /api/v1/sdk/customer/redemptions` — customer's redemption history
- [x] `POST /api/v1/sdk/auth/send-code` — send email OTP for widget login
- [x] `POST /api/v1/sdk/auth/verify-code` — verify OTP and issue JWT token
- [x] All endpoints authenticated via public API key + HMAC or JWT

### 3.4 Widget Adaptation
- [x] Dual-mode widget: SPA mode (`main.tsx`) and SDK mode (`main-sdk.tsx`)
- [x] `WidgetConfigContext` unifies both modes with `useWidgetConfig()` hook
- [x] `WidgetContext` for SDK state management (HMAC/token auth)
- [x] `api-sdk.ts` sends `X-Project-Key` header + customer email + HMAC on all calls
- [x] Referral link uses project's configured `referral_base_url` (not hardcoded)
- [x] Social URLs read from project settings (`social_tiktok_url`, `social_instagram_url`)
- [x] `FloatingWrapper` for slide-out panel in floating mode
- [x] `mode: 'embedded'` renders in specified container div

### 3.5 Widget Theming
- [x] CSS custom properties: `--pionts-primary`, `--pionts-bg`, `--pionts-text`
- [x] All hardcoded `#ff3c00` replaced with `var(--pionts-primary)`
- [x] Dashboard Settings: `widget_primary_color`, `widget_bg_color`, `widget_text_color`, `widget_brand_name`
- [x] Dynamic CORS: allows all origins (API key + HMAC is the security layer)

### 3.6 Verify
- [x] `sdk/test.html` — plain HTML page with SDK script, widget loads with custom theme
- [x] Floating mode and embedded mode work
- [x] HMAC auth and fallback widget login both functional
- [x] Referral cookie flow works end-to-end

---

## Phase 4 — Server-to-Server API + Discount Validation

The goal: company's backend can send orders/refunds and validate discount codes.

### 4.1 SecretKeyGuard + Decorator
- [x] `SecretKeyGuard` — validates `X-Secret-Key` header, requires `sk_live_` prefix, rejects public keys with 401
- [x] `SecretKeyProject` param decorator — extracts `request.project` set by guard
- [x] Guard uses existing `ApiKeyService.validateKey(key, 'secret')` from AuthModule

### 4.2 Webhook Endpoints (Secret Key Auth)
- [x] `POST /api/v1/webhooks/order` — process purchase (points + referral chain + first order bonus)
- [x] `POST /api/v1/webhooks/refund` — clawback all points for refunded order
- [x] `POST /api/v1/webhooks/customer` — customer created (signup bonus if not yet rewarded)
- [x] All authenticated via `X-Secret-Key` header → resolves project (replaces hardcoded `projectId = 1`)
- [x] Generic payload format alongside Shopify backward compat:
  ```json
  {
    "customer_email": "john@gmail.com",
    "customer_name": "John",
    "order_id": "ORD-1055",
    "order_total": 45.00,
    "referral_code": "X7K2M9"
  }
  ```
- [x] `referral_code` in order payload links referral chain before awarding points
- [x] Payload normalization: accepts both generic (`customer_email`) and Shopify (`customer.email`) formats
- [x] WebhooksModule imports AuthModule for SecretKeyGuard dependency

### 4.3 Discount Validation
- [x] `DiscountModule` — controller, service, DTOs with class-validator
- [x] `POST /api/v1/discount/validate` — input: `{ code }` → returns `{ valid, discount_amount, already_used }`
- [x] `POST /api/v1/discount/mark-used` — input: `{ code }` → marks as used, idempotent
- [x] Cross-project isolation: codes from other projects return `{ valid: false }`
- [x] Company's checkout calls validate → applies discount → calls mark-used on success

### 4.4 Platform-Specific Adapters (Optional — deferred to Phase 5)
- [ ] Shopify adapter: translates Shopify webhook format → generic format → calls internal webhook handler
- [ ] Shopify adapter: creates Shopify discount code via Admin API when customer redeems (if Shopify token configured)
- [ ] Store platform tokens in Project config (encrypted)

### 4.5 Rate Limiting
- [x] `@Throttle({ default: { ttl: 60000, limit: 300 } })` on WebhooksController and DiscountController
- [x] Public/browser traffic: 60 requests/minute (global default)
- [x] Secret key S2S endpoints: 300 requests/minute (per-controller override)
- [x] SDK controller: `@SkipThrottle()` (unchanged)

### 4.6 Testing — 29 new tests (281 backend total)
- [x] Unit: `SecretKeyGuard` — valid secret key, reject public key, reject missing key, reject revoked key (4 tests)
- [x] Unit: `DiscountService` — validate unused/used/nonexistent/cross-project, mark-used/idempotent/nonexistent/cross-project (8 tests)
- [x] E2E: Webhook auth — reject missing key, reject public key, reject invalid key (3 tests)
- [x] E2E: Webhook order — generic format, Shopify format, first order bonus, L2/L3 referral points, dedup, referral_code linking (8 tests)
- [x] E2E: Webhook customer — generic format, Shopify format, no double signup reward, missing email (4 tests)
- [x] E2E: Webhook refund — clawback points, non-existent order graceful (2 tests)
- [x] E2E: Discount auth — reject missing key, reject public key (2 tests)
- [x] E2E: Discount validate — unused code, used code, nonexistent, cross-project isolation, missing code (5 tests)
- [x] E2E: Discount mark-used — mark unused, idempotent, nonexistent, cross-project isolation (4 tests)

### 4.7 Verify
- [x] Backend TypeScript compiles clean (`tsc --noEmit` — 0 errors)
- [x] 113 unit tests pass (13 suites)
- [x] 168 E2E tests pass (9 suites)
- [x] Total: 281 backend tests passing

---

## Phase 5 — Growth Features

The goal: polish, monetize, and scale.

### 5.1 Billing (Stripe) — BUILT
- [x] Define plans: Free (1 project, 100 customers), Pro (unlimited projects, unlimited customers)
- [x] Stripe integration: checkout session, subscription management, webhook for payment events
- [x] Enforce limits: check plan on project create, customer create
- [x] Billing page in dashboard: current plan, usage, upgrade/downgrade (PlanCard, UsageBar)
- [ ] Production Stripe keys + webhook endpoint configured
- [ ] Test end-to-end payment flow with Stripe test mode

### 5.2 Analytics — BUILT
- [x] Points economy dashboard: total points issued vs redeemed over time
- [x] Referral conversion funnel: link clicks → signups → first purchases
- [x] Customer segments: active, at-risk (no activity 30+ days), churned
- [x] Export to CSV (customers + points log)
- [ ] Period-based filtering (day/week/month) — UI built, backend supports it
- [ ] Custom date range picker

### 5.3 Email Notifications — BUILT (templates ready)
- [x] NotificationsModule with email-sender, email-template, notification services
- [x] Welcome email when customer signs up
- [x] Referral notification ("Someone used your link!")
- [x] Settings: email_notification_mode (off/instant), email_welcome_enabled, email_referral_enabled
- [ ] Points earned notification (configurable: instant, daily digest)
- [ ] Points expiring warning (30 days before expiry)
- [ ] Configure email provider (Resend or SendGrid) for production

### 5.4 Advanced Widget — BUILT
- [x] Widget login flow (email + magic link OTP) for sites that don't pass identity
- [x] Gamification: levels/tiers (Bronze, Silver, Gold) with multipliers — TierBadge, useTier
- [x] Leaderboard: top referrers (opt-in) — Leaderboard component + SDK endpoint
- [x] Animations: AnimatedCounter (points), ConfettiEffect (on redeem)
- [ ] Polish animations and transitions

### 5.5 Platform Guides — BUILT
- [x] Step-by-step integration guide for Shopify (ShopifyGuide.tsx)
- [x] Step-by-step integration guide for WordPress/WooCommerce (WordPressGuide.tsx)
- [x] Step-by-step integration guide for custom websites (CustomGuide.tsx)
- [x] API reference documentation (ApiReference.tsx)
- [ ] Auto-generated Swagger docs (NestJS Swagger configured but needs polish)

### 5.6 Infrastructure — PARTIALLY BUILT
- [x] Dockerize backend + database (docker-compose.yml)
- [x] CI/CD pipeline (GitHub Actions: typecheck, test, build, deploy)
- [x] Nginx reverse proxy with SSL + strategic caching (deploy/nginx.conf)
- [x] PM2 process manager for production
- [ ] Database backups (automated daily)
- [ ] Monitoring + alerting (uptime, error rates)
- [ ] CDN for SDK + widget bundle (Cloudflare or BunnyCDN)

### 5.7 Remaining Polish
- [ ] Fix 25 failing backend unit tests (customers.service, auth.service — likely mock drift)
- [ ] Fix client-ui TypeScript errors (case-sensitive Referrals import, missing getLeaderboard on WidgetApi type)
- [ ] Add Shopify adapter: translate Shopify webhook format → generic format automatically
- [ ] Add Shopify adapter: create Shopify discount code via Admin API on redeem
- [ ] Store platform tokens encrypted in Project config

---

---

## Phase 3.5 — Frontend Refactoring (TypeScript + Tailwind + DRY/SOLID)

The goal: modernize both frontends with TypeScript, Tailwind CSS, shared code extraction, and component decomposition.

### 3.5.1 Shared Package (`shared/`)
- [x] Created `@pionts/shared` package with Vite alias resolution (no npm workspaces)
- [x] Extracted shared types: Customer, CustomerData, PointsLogEntry, ReferralNode, RedemptionTier, ProjectSettings, etc.
- [x] Extracted shared hooks: useFetch (with mountedRef), useClipboard, useDebounce
- [x] Extracted shared utils: timeAgo, formatPoints, formatDate, countDescendants
- [x] Extracted shared components: 12 SVG icon components (Icons.tsx)
- [x] Created baseRequest utility in shared/lib/request.ts
- [x] 29 tests across 4 suites all passing

### 3.5.2 TypeScript Migration
- [x] Both frontends converted from JS/JSX to TS/TSX (strict mode)
- [x] client-ui: 26 files renamed, old shared code deleted (uses @pionts/shared)
- [x] admin-ui: 30 files renamed, old shared code deleted (uses @pionts/shared)
- [x] All type errors resolved, `tsc --noEmit` clean on all 3 packages

### 3.5.3 Tailwind CSS v4 Migration
- [x] Installed `tailwindcss` + `@tailwindcss/vite` in both frontends
- [x] client-ui: `@theme` with CSS variable mapping (`--color-primary: var(--pionts-primary)`)
- [x] admin-ui: `@theme` with fixed brand colors + sidebar colors
- [x] All ~3,300 lines of vanilla CSS replaced with Tailwind utilities
- [x] CSS files reduced to ~185 lines each (imports, @theme, keyframes, pseudo-elements)
- [x] Runtime theming via CSS custom properties still works

### 3.5.4 SOLID Component Splits
- [x] admin-ui ReferralTree (445L) → 8 files in `components/referral-tree/`
- [x] admin-ui CustomerDetail (283L) → 8 files in `pages/customer-detail/`
- [x] admin-ui OrgSettings (239L) → 5 files in `pages/org-settings/`
- [x] client-ui Referrals (307L) → 6 files in `pages/referrals/`
- [x] Barrel re-exports maintain backward compatibility

### 3.5.5 Verification
- [x] shared: tsc clean, 29 tests pass
- [x] client-ui: SPA build (74 modules), UMD build (277 KB), 18 tests pass
- [x] admin-ui: SPA build (90 modules), 16 tests pass
- [x] Total: 63 frontend tests pass across 12 suites

---

## Current Status

- [x] **Phase 0** — Single-tenant system built and working (NestJS + Prisma + SQLite, admin-ui, client-ui)
- [x] **Phase 1** — COMPLETE. PostgreSQL + multi-tenant schema + JWT auth + API keys + project scoping + 47/47 tests passed
- [x] **Phase 2** — COMPLETE. Dashboard rewrite: JWT auth with httpOnly cookies, org/project/dashboard modules, frontend with ProjectContext + project switcher + all pages scoped by projectId
- [x] **Phase 3** — COMPLETE. Universal JavaScript SDK: loyalty.js loader, SdkModule with 10 API endpoints, HMAC auth, dual-mode widget, CSS theming, floating/embedded modes
- [x] **Phase 3.5** — COMPLETE. Frontend refactoring: TypeScript strict mode, Tailwind CSS v4, @pionts/shared package, SOLID component splits. 63 frontend tests + 252 backend tests = 315 total
- [x] **Phase 4** — COMPLETE. Server-to-Server API: SecretKeyGuard, multi-tenant webhooks (generic + Shopify payloads), referral_code linking in order webhook, DiscountModule (validate + mark-used), 300/min S2S rate limiting. 63 frontend tests + 281 backend tests = 344 total
- [~] **Phase 5** — IN PROGRESS. Growth features built: analytics (points economy, funnel, segments, CSV export), billing (Stripe, plan limits, UI), notifications (email templates), advanced widget (gamification, leaderboard, animations), platform guides (Shopify, WordPress, Custom, API reference), CI/CD + Docker + Nginx. Remaining: production config, Shopify adapter, monitoring, fix test drift.
