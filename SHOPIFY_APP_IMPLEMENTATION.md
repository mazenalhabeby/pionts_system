# Shopify App — Theme App Extension + Auto-Provisioning

## Complete Implementation Guide

This document describes the **complete Shopify App integration** for the Pionts multi-tenant loyalty platform. It covers every file created, every file modified, exact code, architecture decisions, and how it all connects. A Claude instance reading this document should be able to recreate, debug, test, or extend the entire feature.

---

## Table of Contents

1. [What This Feature Does](#1-what-this-feature-does)
2. [Architecture Overview](#2-architecture-overview)
3. [Complete Flow Diagrams](#3-complete-flow-diagrams)
4. [Database Changes](#4-database-changes)
5. [New Files Created](#5-new-files-created)
6. [Existing Files Modified](#6-existing-files-modified)
7. [Theme App Extension](#7-theme-app-extension)
8. [Environment Variables](#8-environment-variables)
9. [How Auth Works End-to-End](#9-how-auth-works-end-to-end)
10. [What Does NOT Change](#10-what-does-not-change)
11. [Testing](#11-testing)
12. [Deployment Checklist](#12-deployment-checklist)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. What This Feature Does

### Before (Manual Integration)
Merchants had to:
1. Sign up on the Pionts dashboard manually
2. Create a project, copy API keys
3. Edit `theme.liquid` to paste SDK script + HMAC generation code
4. Manually configure Shopify webhooks for orders/refunds
5. Understand HMAC signatures and Liquid template syntax

### After (Shopify App)
Merchants:
1. Click "Install" → Shopify OAuth consent screen
2. Approve → **everything is auto-provisioned**:
   - Organization + Project + API keys created
   - HMAC secret stored in Shopify shop metafields
   - Webhooks registered automatically (orders, refunds, uninstall)
3. Enable the widget in Theme Editor → toggle on "Loyalty Popup"
4. Done. Widget appears. Logged-in customers are auto-authenticated via HMAC. Logged-out visitors get OTP login fallback.

### Key Architectural Insight
The existing widget already supports HMAC auth — when `config.customer` has `email + hmac`, it skips login entirely. The SDK (`loyalty.js`) and widget (`client-ui/`) need **zero changes**. All the work is backend + Liquid templates.

---

## 2. Architecture Overview

### System Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│ Shopify Store (merchant's theme)                             │
│                                                              │
│  Theme App Extension (Liquid blocks)                         │
│  ├── loyalty-popup.liquid    → floating widget (all pages)   │
│  ├── loyalty-profile.liquid  → embedded widget (account page)│
│  └── loyalty-init.liquid     → shared init snippet           │
│       ├── Reads shop.metafields.pionts.public_key            │
│       ├── Reads shop.metafields.pionts.hmac_secret           │
│       ├── Generates HMAC via Liquid hmac_sha256 filter       │
│       └── Calls Loyalty.init({...}) with customer identity   │
│                                                              │
│  Shopify sends webhooks:                                     │
│  ├── orders/create  → POST /shopify/webhooks/orders-create   │
│  ├── refunds/create → POST /shopify/webhooks/refunds-create  │
│  └── app/uninstalled→ POST /shopify/webhooks/app-uninstalled │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Pionts Backend (NestJS)                                      │
│                                                              │
│  ShopifyAppModule (NEW)                                      │
│  ├── /shopify/auth           → OAuth start (redirect)        │
│  ├── /shopify/auth/callback  → OAuth callback (provision)    │
│  ├── /shopify/webhooks/*     → Shopify-signed webhooks       │
│  │                                                           │
│  ├── ShopifyApiService       → Shopify Admin API wrapper     │
│  ├── ShopifyAppService       → Provisioning orchestrator     │
│  ├── ShopifyWebhookService   → Routes to WebhooksService     │
│  └── ShopifyWebhookHmacGuard → Validates X-Shopify-Hmac-256 │
│                                                              │
│  Existing modules (UNCHANGED):                               │
│  ├── /api/v1/sdk/*           → SDK endpoints (widget uses)   │
│  ├── /api/v1/webhooks/*      → S2S webhooks (non-Shopify)    │
│  └── /api/v1/dashboard/*     → Dashboard API                 │
└──────────────────────────────────────────────────────────────┘
```

### Module Dependency Graph

```
ShopifyAppModule
├── imports: ProjectsModule (for ProjectsService)
├── imports: WebhooksModule (for WebhooksService)
├── providers: ShopifyApiService, ShopifyAppService, ShopifyWebhookService, ShopifyWebhookHmacGuard
└── controllers: ShopifyAppController, ShopifyWebhookController
```

Both `ProjectsModule` and `WebhooksModule` needed new `exports` added to make their services available.

---

## 3. Complete Flow Diagrams

### OAuth Installation Flow

```
Merchant clicks Install
        │
        ▼
GET /shopify/auth?shop=store.myshopify.com
        │
        ├── Validates shop domain (regex: ^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$)
        ├── Generates nonce, stores in httpOnly cookie (10min TTL)
        └── Redirects to: https://store.myshopify.com/admin/oauth/authorize
            ?client_id=SHOPIFY_API_KEY
            &scope=read_customers,write_customers,read_orders,write_orders,
                   read_products,write_price_rules,write_discounts,read_themes,write_themes
            &redirect_uri=https://app.pionts.com/shopify/auth/callback
            &state=<nonce>
        │
        ▼
Merchant approves on Shopify
        │
        ▼
GET /shopify/auth/callback?shop=...&code=...&hmac=...&state=...
        │
        ├── Verifies nonce matches cookie
        ├── Verifies HMAC of ALL query params using SHOPIFY_API_SECRET
        │   (sort params alphabetically, join with &, HMAC-SHA256, timingSafeEqual)
        ├── Exchanges code for access token via Shopify API
        │
        ▼
    ShopifyAppService.provisionStore(shop, accessToken, scopes)
        │
        ├── Check existing ShopifyInstallation by shopDomain
        │   ├── EXISTS → reactivate (update token, clear uninstalledAt, re-register webhooks)
        │   └── NOT EXISTS → continue to create new
        │
        ├── GET /admin/api/2024-01/shop.json → get shop name
        │
        ├── Create Organization (name=shopName, slug=shop-domain-timestamp)
        ├── Create Subscription (free tier, stripeCustomerId=cus_shopify_<orgId>)
        ├── Create Project via ProjectsService.create()
        │   └── This internally: creates project, generates API key pair,
        │       seeds earn actions, redemption tiers, referral levels
        │
        ├── Save ShopifyInstallation {
        │     shopDomain, accessToken, scopes, projectId, orgId,
        │     publicKey: keys.publicKey (raw pk_live_...),
        │     hmacSecret: project.hmacSecret
        │   }
        │
        ├── Register 3 Shopify webhooks:
        │   ├── orders/create  → /shopify/webhooks/orders-create
        │   ├── refunds/create → /shopify/webhooks/refunds-create
        │   └── app/uninstalled→ /shopify/webhooks/app-uninstalled
        │
        └── Set 3 shop metafields:
            ├── pionts.public_key  = pk_live_...
            ├── pionts.hmac_secret = <64-char hex string>
            └── pionts.api_url     = https://app.pionts.com
        │
        ▼
Redirect to: /admin/login?shopify=installed&shop=store.myshopify.com
```

### Widget Loading Flow (on Shopify storefront)

```
Customer visits merchant's Shopify store
        │
        ▼
Theme App Extension block loads (loyalty-popup.liquid or loyalty-profile.liquid)
        │
        ▼
loyalty-init.liquid snippet executes:
        │
        ├── {% assign pionts_key = shop.metafields.pionts.public_key %}
        ├── {% assign pionts_secret = shop.metafields.pionts.hmac_secret %}
        │
        ├── IF pionts_key is blank → renders nothing (app not configured)
        │
        ├── Loads <script src="{api_url}/sdk/loyalty.js" defer>
        │
        ├── IF customer is logged in to Shopify:
        │   ├── email = customer.email
        │   ├── name = customer.first_name
        │   ├── hmac = customer.email | hmac_sha256: pionts_secret
        │   └── config.customer = { email, name, hmac }
        │
        └── Loyalty.init(config) → widget renders
                │
                ├── IF config.customer has email+hmac:
                │   └── SdkAuthGuard verifies HMAC → auto-authenticated, no login screen
                │
                └── IF no config.customer (visitor not logged in):
                    └── Widget shows OTP email login fallback
```

### Shopify Webhook Flow

```
Shopify sends POST /shopify/webhooks/orders-create
        │
        ├── Headers:
        │   ├── X-Shopify-Hmac-Sha256: <base64 HMAC of raw body>
        │   └── X-Shopify-Shop-Domain: store.myshopify.com
        │
        ▼
ShopifyWebhookHmacGuard:
        ├── Gets SHOPIFY_API_SECRET from env
        ├── Gets request.rawBody (available because main.ts has rawBody: true)
        ├── Computes HMAC-SHA256(rawBody, SHOPIFY_API_SECRET) as base64
        ├── timingSafeEqual(computed, received)
        └── Pass → continue | Fail → 401 Unauthorized
        │
        ▼
ShopifyWebhookController.orderCreated():
        ├── Gets shopDomain from X-Shopify-Shop-Domain header
        └── Calls ShopifyWebhookService.handleOrderCreated(shopDomain, body)
                │
                ├── Looks up ShopifyInstallation by shopDomain
                ├── Gets projectId from installation
                └── Delegates to existing WebhooksService.processOrder(projectId, body)
                    │
                    └── This is the EXACT same code path as the S2S webhook endpoint.
                        Shopify's payload format (body.customer.email, body.total_price,
                        etc.) is already supported by the existing OrderWebhookDto.
```

### Discount Creation Flow (Multi-Tenant)

```
Customer redeems points → RedemptionsService.redeemGeneric()
        │
        ▼
createShopifyDiscount(projectId, code, amount)
        │
        ├── Look up ShopifyInstallation by projectId
        │
        ├── IF installation exists and not uninstalled:
        │   └── ShopifyService.createDiscountForShop(shop, accessToken, code, amount)
        │       (uses per-store credentials from DB)
        │
        └── ELSE (non-Shopify project or env-configured single-tenant):
            └── ShopifyService.createDiscount(code, amount)
                (uses SHOPIFY_STORE + SHOPIFY_ACCESS_TOKEN from env)
                (returns false if env vars not set — no-op for non-Shopify)
```

---

## 4. Database Changes

### New Model: `ShopifyInstallation`

**File:** `backend/prisma/schema.prisma` (added at end of file)

```prisma
model ShopifyInstallation {
  id            Int       @id @default(autoincrement())
  shopDomain    String    @unique @map("shop_domain")
  accessToken   String    @map("access_token")
  scopes        String
  projectId     Int       @unique @map("project_id")
  orgId         Int       @map("org_id")
  publicKey     String?   @map("public_key")
  hmacSecret    String?   @map("hmac_secret")
  webhookIds    String?   @map("webhook_ids")
  installedAt   DateTime  @default(now()) @map("installed_at")
  uninstalledAt DateTime? @map("uninstalled_at")

  project Project      @relation(fields: [projectId], references: [id])
  org     Organization @relation(fields: [orgId], references: [id])

  @@index([orgId])
  @@map("shopify_installations")
}
```

**Field explanations:**
- `shopDomain` (unique): `"store.myshopify.com"` — identifies the Shopify store
- `accessToken`: Shopify Admin API token from OAuth exchange. Used for creating discounts, registering webhooks, setting metafields
- `scopes`: Comma-separated scopes granted during OAuth
- `projectId` (unique, 1:1): Links to the auto-created Pionts project for this store
- `orgId`: Links to the auto-created organization
- `publicKey`: Raw `pk_live_...` key stored for metafield. Normally API keys are only stored as hashes, but we need the raw value for the Liquid template to use
- `hmacSecret`: The project's HMAC secret (same as `project.hmacSecret`). Stored here for convenience since it's written to metafields
- `webhookIds`: JSON array of Shopify webhook IDs `["123","456","789"]`. Useful for cleanup/debug
- `uninstalledAt`: Set when `app/uninstalled` webhook fires. `null` = active install

### Reverse Relations Added

**On `Organization` model** (line 19-23 area):
```prisma
// BEFORE:
  memberships  OrgMembership[]
  projects     Project[]
  subscription Subscription?
  invitations  Invitation[]

// AFTER:
  memberships          OrgMembership[]
  projects             Project[]
  subscription         Subscription?
  invitations          Invitation[]
  shopifyInstallations ShopifyInstallation[]
```

**On `Project` model** (after `partnerApplications`):
```prisma
// ADDED:
  shopifyInstallation  ShopifyInstallation?
```

### Migration

```bash
cd backend && npx prisma migrate dev --name add-shopify-installation
```

This creates: `prisma/migrations/YYYYMMDDHHMMSS_add_shopify_installation/migration.sql`

The generated SQL:
```sql
CREATE TABLE "shopify_installations" (
    "id" SERIAL NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "public_key" TEXT,
    "hmac_secret" TEXT,
    "webhook_ids" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMP(3),

    CONSTRAINT "shopify_installations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shopify_installations_shop_domain_key" ON "shopify_installations"("shop_domain");
CREATE UNIQUE INDEX "shopify_installations_project_id_key" ON "shopify_installations"("project_id");
CREATE INDEX "shopify_installations_org_id_idx" ON "shopify_installations"("org_id");
ALTER TABLE "shopify_installations" ADD CONSTRAINT "shopify_installations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");
ALTER TABLE "shopify_installations" ADD CONSTRAINT "shopify_installations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id");
```

---

## 5. New Files Created

### File Tree

```
backend/src/shopify-app/
├── shopify-app.module.ts            — NestJS module (wires everything)
├── shopify-app.controller.ts        — OAuth endpoints (GET /shopify/auth, GET /shopify/auth/callback)
├── shopify-app.service.ts           — Provisioning orchestrator (creates org/project/keys/webhooks/metafields)
├── shopify-api.service.ts           — Shopify Admin API wrapper (token exchange, webhooks, metafields, discounts)
├── shopify-webhook.controller.ts    — Receives Shopify-signed webhooks (3 endpoints)
├── shopify-webhook.service.ts       — Routes Shopify webhooks to existing WebhooksService
└── guards/
    └── shopify-hmac.guard.ts        — Validates X-Shopify-Hmac-Sha256 header

shopify-app/                          — Theme App Extension (root level, separate from backend)
├── shopify.app.toml                  — Shopify app config
└── extensions/
    └── theme-loyalty/
        ├── shopify.extension.toml    — Extension config (2 blocks)
        ├── blocks/
        │   ├── loyalty-popup.liquid  — App Embed: floating widget on all pages
        │   └── loyalty-profile.liquid— App Block: embedded widget on account page
        └── snippets/
            └── loyalty-init.liquid   — Shared Liquid init logic (reads metafields, generates HMAC, calls Loyalty.init)
```

### 5a. `backend/src/shopify-app/shopify-api.service.ts`

**Purpose:** Low-level Shopify Admin API wrapper. All HTTP calls to Shopify go through this service.

**Pattern:** Reuses the same `fetchWithTimeout` + `fetchWithRetry` pattern from the existing `backend/src/shopify/shopify.service.ts` (exponential backoff, 429/5xx retry, abort signal timeout).

**Methods:**

| Method | Purpose | Used By |
|--------|---------|---------|
| `exchangeCodeForToken(shop, code)` | OAuth token exchange | ShopifyAppController |
| `registerWebhook(shop, token, topic, address)` | Register a webhook subscription | ShopifyAppService |
| `setMetafield(shop, token, namespace, key, value, type?)` | Write shop-level metafield | ShopifyAppService |
| `createDiscountForShop(shop, token, code, amount)` | Create price rule + discount code | ShopifyAppService (exports for future use) |
| `deleteDiscountForShop(shop, token, code)` | Look up + delete price rule | ShopifyAppService (exports for future use) |
| `getShopInfo(shop, token)` | GET /admin/api/shop.json → { name } | ShopifyAppService |

**Full source:** `backend/src/shopify-app/shopify-api.service.ts` (223 lines)

### 5b. `backend/src/shopify-app/guards/shopify-hmac.guard.ts`

**Purpose:** NestJS guard that validates the `X-Shopify-Hmac-Sha256` header on incoming Shopify webhooks.

**How it works:**
1. Gets `X-Shopify-Hmac-Sha256` header (base64-encoded)
2. Gets `SHOPIFY_API_SECRET` from environment
3. Gets `request.rawBody` (available because `main.ts` creates the app with `rawBody: true`)
4. Computes `HMAC-SHA256(rawBody, SHOPIFY_API_SECRET)` → base64
5. Compares using `crypto.timingSafeEqual()` (constant-time comparison to prevent timing attacks)
6. Returns `true` (allow) or throws `UnauthorizedException`

**IMPORTANT:** This is different from the SDK auth guard (`SdkAuthGuard`) which verifies customer identity HMAC. This guard verifies that the webhook actually came from Shopify, not a random attacker.

**Full source:** `backend/src/shopify-app/guards/shopify-hmac.guard.ts` (39 lines)

### 5c. `backend/src/shopify-app/shopify-app.service.ts`

**Purpose:** The core provisioning orchestrator. Called once during OAuth callback to set up everything for a new merchant.

**Key method: `provisionStore(shopDomain, accessToken, scopes)`**

This method does 8 things in sequence:

1. **Check for reinstall**: Look up `ShopifyInstallation` by `shopDomain`. If found, just update the token, clear `uninstalledAt`, re-register webhooks, and return. This handles the case where a merchant uninstalls and reinstalls the app — they get their existing project back.

2. **Get shop name**: `GET /admin/api/2024-01/shop.json` to get the human-readable store name.

3. **Create Organization**: Uses the shop domain as slug base (e.g., `cool-store-m1abc2`). The `Date.now().toString(36)` suffix ensures uniqueness.

4. **Create Subscription**: Free tier with `stripeCustomerId: cus_shopify_<orgId>`. This follows the same pattern as `auth.service.ts:83-90`.

5. **Create Project**: Calls `ProjectsService.create(orgId, name, domain, 'shopify')`. This is the **existing** project creation method that:
   - Creates the project record with `hmacSecret = crypto.randomBytes(32).toString('hex')`
   - Generates API key pair via `ApiKeyService.generateKeyPair()` → returns raw `{ publicKey, secretKey }`
   - Seeds default earn actions, redemption tiers, referral levels
   - Loads default settings

6. **Save ShopifyInstallation**: Stores `shopDomain`, `accessToken`, `scopes`, `projectId`, `orgId`, plus the raw `publicKey` and `hmacSecret` (needed for metafields).

7. **Register webhooks**: Calls `ShopifyApiService.registerWebhook()` for 3 topics:
   - `orders/create` → `POST /shopify/webhooks/orders-create`
   - `refunds/create` → `POST /shopify/webhooks/refunds-create`
   - `app/uninstalled` → `POST /shopify/webhooks/app-uninstalled`

8. **Set shop metafields**: Writes 3 metafields to the Shopify store:
   - `pionts.public_key` = `pk_live_...` (raw API key)
   - `pionts.hmac_secret` = `<64-char hex>` (for Liquid `hmac_sha256` filter)
   - `pionts.api_url` = `https://app.pionts.com`

**Other methods:**
- `handleUninstall(shopDomain)` — Sets `uninstalledAt` timestamp. Does NOT delete the org/project/data — merchant might reinstall.
- `getInstallationByShop(shopDomain)` — Simple lookup, used by webhook service.

**Full source:** `backend/src/shopify-app/shopify-app.service.ts` (169 lines)

### 5d. `backend/src/shopify-app/shopify-app.controller.ts`

**Purpose:** Two OAuth endpoints.

**`GET /shopify/auth?shop=store.myshopify.com`**
1. Validates shop domain with regex
2. Checks `SHOPIFY_API_KEY` and `SHOPIFY_APP_URL` env vars exist
3. Generates random nonce, stores in httpOnly secure cookie (`shopify_nonce`, 10min TTL)
4. Redirects to `https://{shop}/admin/oauth/authorize?...`

**`GET /shopify/auth/callback?shop=...&code=...&hmac=...&state=...`**
1. Validates all 4 params present
2. Validates shop domain
3. Verifies nonce from cookie matches `state` param (CSRF protection)
4. Verifies HMAC of query params:
   - Remove `hmac` from params
   - Sort remaining params alphabetically
   - Join as `key=value&key=value`
   - HMAC-SHA256 with `SHOPIFY_API_SECRET`
   - timingSafeEqual comparison
5. Calls `ShopifyApiService.exchangeCodeForToken(shop, code)` → get access token
6. Calls `ShopifyAppService.provisionStore(shop, accessToken, scope)`
7. Redirects to dashboard: `/admin/login?shopify=installed&shop=...`

**Security notes:**
- Controller is `@SkipThrottle()` — OAuth flow shouldn't be rate-limited
- Uses `@Res()` for manual redirects (NestJS doesn't return a response body)
- Cookie is `httpOnly`, `secure`, `sameSite: 'lax'`

**Full source:** `backend/src/shopify-app/shopify-app.controller.ts` (117 lines)

### 5e. `backend/src/shopify-app/shopify-webhook.controller.ts`

**Purpose:** Receives Shopify-signed webhooks. Three POST endpoints, all guarded by `ShopifyWebhookHmacGuard`.

| Endpoint | Shopify Topic | Handler |
|----------|---------------|---------|
| `POST /shopify/webhooks/orders-create` | `orders/create` | → `WebhooksService.processOrder()` |
| `POST /shopify/webhooks/refunds-create` | `refunds/create` | → `WebhooksService.processRefund()` |
| `POST /shopify/webhooks/app-uninstalled` | `app/uninstalled` | → Sets `uninstalledAt` |

**How shop identity is resolved:**
- Shopify sends `X-Shopify-Shop-Domain` header with every webhook
- Controller reads this header and passes to `ShopifyWebhookService`
- Service looks up `ShopifyInstallation` by `shopDomain` → gets `projectId`
- Delegates to existing `WebhooksService` methods

**Error handling:** Returns `{ status: 'error' }` instead of throwing. Shopify retries webhooks that return 4xx/5xx, so we don't want to crash — just log the error. Shopify will retry.

**Full source:** `backend/src/shopify-app/shopify-webhook.controller.ts` (69 lines)

### 5f. `backend/src/shopify-app/shopify-webhook.service.ts`

**Purpose:** Middle layer between Shopify webhook controller and existing WebhooksService. Resolves `projectId` from `shopDomain`.

**Key method: `resolveProjectId(shopDomain)`**
- Looks up `ShopifyInstallation` by `shopDomain`
- Throws `NotFoundException` if not found or if `uninstalledAt` is set
- Returns `installation.projectId`

**Why this layer exists:** The existing `WebhooksService` expects a `projectId` (resolved by `SecretKeyGuard` from the `X-Secret-Key` header). Shopify webhooks don't have an `X-Secret-Key` — they have `X-Shopify-Shop-Domain`. This service bridges the gap.

**Full source:** `backend/src/shopify-app/shopify-webhook.service.ts` (45 lines)

### 5g. `backend/src/shopify-app/shopify-app.module.ts`

**Purpose:** NestJS module that wires everything together.

```typescript
@Module({
  imports: [ProjectsModule, WebhooksModule],
  controllers: [ShopifyAppController, ShopifyWebhookController],
  providers: [
    ShopifyApiService,
    ShopifyAppService,
    ShopifyWebhookService,
    ShopifyWebhookHmacGuard,
  ],
  exports: [ShopifyApiService, ShopifyAppService],
})
export class ShopifyAppModule {}
```

**Dependencies:**
- `ProjectsModule` → for `ProjectsService` (used in provisioning)
- `WebhooksModule` → for `WebhooksService` (used in webhook routing)
- `PrismaModule` → globally available (no explicit import needed)

**Full source:** `backend/src/shopify-app/shopify-app.module.ts` (22 lines)

---

## 6. Existing Files Modified

### 6a. `backend/prisma/schema.prisma`

**Changes:**
1. Added `shopifyInstallations ShopifyInstallation[]` to `Organization` model
2. Added `shopifyInstallation ShopifyInstallation?` to `Project` model
3. Added entire `ShopifyInstallation` model at end of file

(See Section 4 for full details)

### 6b. `backend/src/app.module.ts`

**Changes:** Added import and registration of `ShopifyAppModule`.

```typescript
// ADDED import:
import { ShopifyAppModule } from './shopify-app/shopify-app.module';

// ADDED to imports array (after PlatformAdminModule):
    PlatformAdminModule,
    ShopifyAppModule,     // ← NEW
  ],
```

### 6c. `backend/src/projects/projects.module.ts`

**Change:** Added `ProjectsService` to exports so `ShopifyAppModule` can use it.

```typescript
// BEFORE:
  exports: [ProjectMembersService],

// AFTER:
  exports: [ProjectsService, ProjectMembersService],
```

### 6d. `backend/src/webhooks/webhooks.module.ts`

**Change:** Added `WebhooksService` to exports so `ShopifyAppModule` can use it.

```typescript
// BEFORE:
  controllers: [WebhooksController],
  providers: [WebhooksService],
})

// AFTER:
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
```

### 6e. `backend/src/shopify/shopify.service.ts`

**Change:** Refactored `createDiscount` and `deleteDiscount` to accept per-store credentials. The original methods now delegate to the new ones with env-based credentials.

**Before:** `createDiscount(code, amount)` had the full implementation with `this.store` and `this.token`.

**After:**
```typescript
// Backward-compat wrappers (use env vars):
async createDiscount(code, amount) {
  if (!this.token || !this.store) return false;
  return this.createDiscountForShop(this.store, this.token, code, amount);
}
async deleteDiscount(code) {
  if (!this.token || !this.store) return false;
  return this.deleteDiscountForShop(this.store, this.token, code);
}

// New multi-tenant methods (accept credentials):
async createDiscountForShop(shop, accessToken, code, amount) { ... }
async deleteDiscountForShop(shop, accessToken, code) { ... }
```

The implementation body is identical — just the `this.store`/`this.token` is replaced with parameters.

### 6f. `backend/src/redemptions/redemptions.service.ts`

**Changes:**
1. Added `Logger` import and instance
2. `redeemGeneric()` now calls `this.createShopifyDiscount(projectId, code, tier.discount)` instead of `this.shopifyService.createDiscount(code, tier.discount)`
3. `cancelRedemption()` now calls `this.deleteShopifyDiscount(projectId, code)` instead of `this.shopifyService.deleteDiscount(code)`
4. Added two new private helper methods:

```typescript
private async createShopifyDiscount(projectId, code, amount): Promise<boolean> {
  const installation = await this.prisma.shopifyInstallation.findUnique({
    where: { projectId },
  });
  if (installation && !installation.uninstalledAt) {
    return this.shopifyService.createDiscountForShop(
      installation.shopDomain, installation.accessToken, code, amount,
    );
  }
  return this.shopifyService.createDiscount(code, amount);
}

private async deleteShopifyDiscount(projectId, code): Promise<boolean> {
  // Same pattern — look up installation, use per-store or fall back to env
}
```

**Impact on non-Shopify projects:** For non-Shopify projects, there's no `ShopifyInstallation` row. The lookup returns `null`, so it falls through to `shopifyService.createDiscount()` which checks env vars (`SHOPIFY_STORE`, `SHOPIFY_ACCESS_TOKEN`) and returns `false` if they're not set. This is exactly the same behavior as before. The only difference is one extra DB query (unique index lookup on `projectId`) per redemption — negligible performance cost.

---

## 7. Theme App Extension

### Directory Structure

```
shopify-app/                           ← Root level (NOT inside backend/)
├── shopify.app.toml                   ← Shopify app config
└── extensions/
    └── theme-loyalty/
        ├── shopify.extension.toml     ← Extension manifest
        ├── blocks/
        │   ├── loyalty-popup.liquid   ← App Embed (floating, all pages)
        │   └── loyalty-profile.liquid ← App Block (embedded, account page)
        └── snippets/
            └── loyalty-init.liquid    ← Shared init logic
```

### 7a. `shopify.app.toml`

```toml
name = "Pionts Loyalty & Referrals"
client_id = "${SHOPIFY_API_KEY}"
application_url = "${SHOPIFY_APP_URL}/shopify/auth"

[auth]
redirect_urls = ["${SHOPIFY_APP_URL}/shopify/auth/callback"]

[access_scopes]
scopes = "read_customers,write_customers,read_orders,write_orders,read_products,write_price_rules,write_discounts,read_themes,write_themes"

[webhooks]
api_version = "2024-01"
```

### 7b. `shopify.extension.toml`

Defines two blocks:
- **Loyalty Popup** (`loyalty-popup`) — App Embed type, targets `head`, enabled by default
- **Loyalty Profile Widget** (`loyalty-profile`) — Section block type, for placement in page templates

### 7c. `snippets/loyalty-init.liquid` — The Core Logic

This is the most important Liquid file. It:
1. Reads 3 shop metafields (set during app install by `ShopifyAppService`)
2. Loads the SDK script
3. Builds the `config` object
4. If a Shopify customer is logged in, generates HMAC using Liquid's built-in `hmac_sha256` filter
5. Calls `Loyalty.init(config)`

**Why this works without any widget/SDK changes:**
- The `hmac_sha256` Liquid filter computes `HMAC-SHA256(email, hmacSecret)` — the exact same algorithm used by `SdkAuthGuard` (line 44-52 of `sdk-auth.guard.ts`)
- The `hmacSecret` metafield value equals `project.hmacSecret` (set during provisioning)
- So the HMAC generated in Liquid matches what the backend expects
- The SDK/widget sees `config.customer.hmac` and sends it as `X-Customer-Hmac` header
- `SdkAuthGuard` verifies it → customer is authenticated → no login screen shown

### 7d. `blocks/loyalty-popup.liquid`

Minimal — just sets mode to `'floating'` and renders the shared snippet:
```liquid
{% assign pionts_mode = 'floating' %}
{% render 'loyalty-init', pionts_mode: pionts_mode %}
```

### 7e. `blocks/loyalty-profile.liquid`

Creates a container div and sets mode to `'embedded'`:
```liquid
<div id="pionts-profile-widget" style="width:100%;min-height:400px"></div>
{% assign pionts_mode = 'embedded' %}
{% assign pionts_container = '#pionts-profile-widget' %}
{% render 'loyalty-init', pionts_mode: pionts_mode, pionts_container: pionts_container %}
```

---

## 8. Environment Variables

### Required (add to `.env`)

```env
SHOPIFY_API_KEY=your_shopify_app_client_id
SHOPIFY_API_SECRET=your_shopify_app_secret
SHOPIFY_APP_URL=https://app.pionts.com
```

**Where to get these:**
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create a new app (or use existing)
3. App Setup → Client credentials → `API key` = `SHOPIFY_API_KEY`, `API secret key` = `SHOPIFY_API_SECRET`
4. App URL = `{SHOPIFY_APP_URL}/shopify/auth`
5. Redirect URL = `{SHOPIFY_APP_URL}/shopify/auth/callback`

### Existing env vars still work

The existing `SHOPIFY_STORE` and `SHOPIFY_ACCESS_TOKEN` env vars (used by the old single-tenant `ShopifyService`) still work for backward compatibility. They're used as fallback when a project doesn't have a `ShopifyInstallation` record.

---

## 9. How Auth Works End-to-End

There are **three layers of authentication** in the Shopify integration:

### Layer 1: OAuth (App Install)
- **Who:** Shopify ↔ Pionts backend
- **How:** Standard Shopify OAuth 2.0 flow
- **Protections:** HMAC verification of callback params, nonce cookie for CSRF
- **Result:** Access token stored in `ShopifyInstallation.accessToken`

### Layer 2: Webhook HMAC (Server-to-Server)
- **Who:** Shopify webhook sender → Pionts `/shopify/webhooks/*`
- **How:** `X-Shopify-Hmac-Sha256` header = HMAC-SHA256(rawBody, `SHOPIFY_API_SECRET`)
- **Guard:** `ShopifyWebhookHmacGuard`
- **Why different from S2S:** Existing S2S webhooks use `X-Secret-Key: sk_live_...` header. Shopify can't send custom headers — it always sends its own HMAC.

### Layer 3: Customer Identity HMAC (Widget Auth)
- **Who:** Shopify Liquid template → Widget → SDK API
- **How:** Liquid computes `customer.email | hmac_sha256: pionts_secret`, widget sends as `X-Customer-Hmac`
- **Guard:** `SdkAuthGuard` (existing, unchanged)
- **Secret used:** `project.hmacSecret` (stored in both DB and shop metafield)

### Important: These use DIFFERENT secrets

| HMAC Check | Secret | Encoding | Guard |
|------------|--------|----------|-------|
| OAuth callback query params | `SHOPIFY_API_SECRET` (env) | hex | Manual in controller |
| Shopify webhook body | `SHOPIFY_API_SECRET` (env) | base64 | `ShopifyWebhookHmacGuard` |
| Customer identity | `project.hmacSecret` (DB) | hex | `SdkAuthGuard` (existing) |

---

## 10. What Does NOT Change

These files/modules have **zero modifications**:

- **Widget (`client-ui/`)** — zero changes to any file
- **SDK loader (`sdk/`)** — zero changes
- **SDK backend endpoints (`backend/src/sdk/`)** — zero changes
- **Dashboard frontend (`admin-ui/`)** — zero changes
- **Dashboard backend (`backend/src/dashboard/`)** — zero changes
- **Auth module (`backend/src/auth/`)** — zero changes
- **Customers module (`backend/src/customers/`)** — zero changes
- **Referrals module (`backend/src/referrals/`)** — zero changes
- **Analytics, Billing, Notifications** — zero changes
- **Existing Shopify module** (`backend/src/shopify/`) — only additive changes (new methods, old methods still work)
- **Non-Shopify integration flows** — fully preserved. WordPress, custom, etc. work exactly as before.

---

## 11. Testing

### Existing Tests (all pass)

```bash
# Unit tests: 15 suites, 165 tests — ALL PASS
cd backend && npm test

# E2E tests: 8 suites, 140 tests — ALL PASS
cd backend && npm run test:e2e

# TypeScript typecheck — CLEAN
cd backend && npx tsc --noEmit
```

### Manual Testing Checklist

#### OAuth Flow
1. Start backend: `cd backend && npm run start:dev`
2. Visit: `http://localhost:3000/shopify/auth?shop=your-dev-store.myshopify.com`
3. Should redirect to Shopify OAuth consent screen
4. Approve → callback → should provision and redirect to `/admin/login?shopify=installed`
5. Verify in DB: `SELECT * FROM shopify_installations;` → should have one row
6. Verify in DB: `SELECT * FROM organizations;` → should have new org
7. Verify in DB: `SELECT * FROM projects WHERE platform = 'shopify';` → should have new project

#### Widget Rendering
1. In Shopify dev store: Online Store → Themes → Customize
2. App Embeds → toggle on "Loyalty Popup"
3. Preview the store → floating widget button should appear
4. If logged in as Shopify customer → widget should auto-authenticate (no login screen)
5. If not logged in → widget should show OTP email login

#### Webhook Processing
1. Place a test order in dev store
2. Check backend logs for: `Shopify order webhook for your-store.myshopify.com (project X)`
3. Verify points awarded in DB: `SELECT * FROM points_log WHERE project_id = X ORDER BY created_at DESC;`

#### Reinstall Flow
1. Uninstall app from dev store
2. Check DB: `uninstalled_at` should be set
3. Reinstall app
4. Check DB: `uninstalled_at` should be `null`, same `projectId` (data preserved)

#### Non-Shopify Projects (Regression)
1. Create a manual project via dashboard (platform = 'custom')
2. Redeem points → should still work (returns `shopify_created: false`)
3. Verify no errors in logs

---

## 12. Deployment Checklist

1. **Environment variables** — Add `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL` to production `.env`
2. **Database migration** — Run `npx prisma migrate deploy` on production DB
3. **Also run on test DB** — `DATABASE_URL=...test npx prisma migrate deploy`
4. **Shopify Partner Dashboard** — Create app, set URLs:
   - App URL: `https://app.pionts.com/shopify/auth`
   - Redirect URL: `https://app.pionts.com/shopify/auth/callback`
5. **Deploy Theme Extension** — `cd shopify-app && shopify app deploy`
6. **Nginx** — No changes needed. The `/shopify/*` routes are handled by the NestJS backend (same port).
7. **Test** — Install on a Shopify dev store, verify end-to-end flow

---

## 13. Troubleshooting

### "Invalid webhook signature" on Shopify webhooks
- Verify `SHOPIFY_API_SECRET` env var is set and matches your Shopify app's API secret
- Verify `rawBody: true` is set in `main.ts` (line 14) — this is already the case
- Check that no middleware is consuming/modifying the body before the guard runs

### Widget doesn't render on Shopify store
- Check shop metafields: Shopify Admin → Settings → Custom data → Shop metafields → look for `pionts.public_key`
- If metafields are empty, the provisioning may have failed. Check backend logs for errors during `setShopMetafields`.
- Verify the Theme App Extension is deployed and enabled in Theme Customize → App Embeds

### HMAC mismatch (customer auth)
- The `hmac_sha256` Liquid filter uses the raw secret string. Verify `shop.metafields.pionts.hmac_secret` matches `project.hmacSecret` in the DB.
- Check that the metafield type is `single_line_text_field` (not JSON or another type)

### Reinstall doesn't work
- Check if `ShopifyInstallation` has the `shopDomain` with `uninstalledAt` set
- The `provisionStore` method checks for existing installation first and reactivates it
- If the installation was manually deleted from DB, it will create a new one (new org/project)

### OAuth callback fails with "Invalid state parameter"
- The nonce cookie has a 10-minute TTL. If the merchant takes too long on the consent screen, the cookie expires.
- Check that cookies are enabled and that the `sameSite: 'lax'` setting works with your domain setup.
- In development, make sure the server is running on HTTPS (the cookie has `secure: true`). For local dev, you may need to temporarily change this.
