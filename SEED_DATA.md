# Pionts — Seed Data Reference

## Running the Seed

```bash
cd backend && npm run seed
```

This clears all existing data and creates a complete test dataset.

---

## JWT Auth Login (Dashboard)

- **URL**: `POST /auth/login`
- **Email**: `admin@8bc.store`
- **Password**: `admin`

## Legacy Admin Login (Session-based)

- **Password**: `123456789` (from ADMIN_PASSWORD in .env)

---

## Organization

- **Name**: 8BC Store
- **Slug**: `8bc-store`

## Project

- **Name**: 8BC Crew Rewards
- **ID**: 1
- **Domain**: 8bc.store

## API Keys

- **Public Key**: `pk_live_seed_test_public_key_00001`
- **Secret Key**: `sk_live_seed_test_secret_key_00001`
- Keys are SHA-256 hashed before storage; the plain-text values above are for testing only.

## HMAC Secret

- Auto-generated on project creation (`crypto.randomBytes(32).toString('hex')`)
- Seed project may not have one — created before hmacSecret was added
- To generate: re-create the project via dashboard, or manually set via Prisma

---

## Database

- **Dev URL**: `postgresql://postgres:postgres@localhost:5432/pionts`
- **Test URL**: `postgresql://postgres:postgres@localhost:5432/pionts_test`

---

## Test Customers (15 total)

| # | Name | Email | Referral Code | Points | Orders |
|---|------|-------|---------------|--------|--------|
| 1 | Alex Morgan | test@test.com | AX7K2M | 285 | 8 |
| 2 | Sarah Chen | sarah@example.com | B4N8P2 | 145 | 4 |
| 3 | Jake Williams | jake@example.com | R9T3K7 | 80 | 1 |
| 4 | Emma Davis | emma@example.com | H2L5W8 | 210 | 6 |
| 5 | Omar Hassan | omar@example.com | Y6J1N4 | 35 | 0 |
| 6 | Lisa Park | lisa@example.com | T8R2V5 | 120 | 3 |
| 7 | Dan Wright | dan@example.com | Q3F7B9 | 90 | 2 |
| 8 | Nina Petrov | nina@example.com | K7D2G8 | 60 | 1 |
| 9 | Chris Palmer | chris@example.com | E5X4M1 | 30 | 1 |
| 10 | Mike Torres | mike@example.com | M4K9P2 | 410 | 12 |
| 11 | Amy Liu | amy@example.com | A2W9L6 | 155 | 5 |
| 12 | Ryan Brooks | ryan@example.com | R6P3T8 | 70 | 2 |
| 13 | Zoe Kim | zoe@example.com | Z1N5K3 | 45 | 1 |
| 14 | Tom Garcia | tom@example.com | T4G7M2 | 50 | 3 |
| 15 | Mia Johnson | mia@example.com | M8J4Q1 | 20 | 0 |

## Widget Login (OTP)

In dev mode, the OTP code is returned in the API response and auto-filled in the code input.
Use any customer email above (e.g. `test@test.com`).

## Referral Tree (11 entries)

```
Alex (AX7K2M) — test@test.com
├── Sarah (B4N8P2)          — referred by Alex
│   ├── Lisa (T8R2V5)      — referred by Sarah, grandparent: Alex
│   │   └── Chris (E5X4M1) — referred by Lisa, grandparent: Sarah (Alex = L4, capped)
│   └── Dan (Q3F7B9)       — referred by Sarah, grandparent: Alex
├── Jake (R9T3K7)           — referred by Alex
├── Emma (H2L5W8)           — referred by Alex
│   └── Nina (K7D2G8)      — referred by Emma, grandparent: Alex
└── Omar (Y6J1N4)           — referred by Alex

Mike (M4K9P2) — mike@example.com (independent)
├── Amy (A2W9L6)            — referred by Mike
│   └── Zoe (Z1N5K3)       — referred by Amy, grandparent: Mike
└── Ryan (R6P3T8)           — referred by Mike

Tom (T4G7M2) — independent, no referrals
Mia (M8J4Q1) — independent, no referrals
```

## Seed Data Counts

| Data | Count |
|------|-------|
| Organizations | 1 |
| Users (admin) | 1 |
| Projects | 1 |
| API Keys | 2 (1 public, 1 secret) |
| Customers | 15 |
| Referral Tree Entries | 11 |
| Points Log Entries | ~91 |
| Redemptions | 9 |
| Processed Orders | ~43 |
| Settings | ~23 |

## Points Log Types in Seed

- `signup` — welcome bonus
- `purchase` — per-order points
- `first_order` — first purchase bonus
- `referral_l2` / `referral_l3` — referral chain rewards
- `review_photo` / `review_text` — review rewards
- `follow_tiktok` / `follow_instagram` — social follow rewards
- `share_product` — social share rewards
- `birthday` — annual birthday bonus
- `redeem` — points spent on discounts
- `clawback` — refund reversal

## Settings Defaults (23 keys)

Configured in `backend/src/config/config.constants.ts`:

| Key | Default |
|-----|---------|
| signup_points | 20 |
| purchase_points | 10 |
| first_order_points | 50 |
| review_photo_points | 12 |
| review_text_points | 5 |
| follow_tiktok_points | 10 |
| follow_instagram_points | 10 |
| share_product_points | 5 |
| birthday_points | 25 |
| referral_l1_points | 10 |
| referral_l2_points | 5 |
| referral_l3_points | 2 |
| referral_discount_percent | 5 |
| tier1_points / tier1_discount | 50 / 2 |
| tier2_points / tier2_discount | 100 / 5 |
| tier3_points / tier3_discount | 200 / 10 |
| tier4_points / tier4_discount | 400 / 20 |
| min_order_referral | 10 |
| max_direct_referrals | 50 |
| points_expiry_months | 12 |
| widget_primary_color | #ff3c00 |
| widget_bg_color | #f5f5f5 |
| widget_text_color | #1a1a1a |
| gamification_enabled | false |
| leaderboard_enabled | false |
| email_notification_mode | off |

---

## Dev URLs

- **Admin Dashboard**: `http://localhost:3000/admin/` (or `http://localhost:5174/admin/` via Vite dev server)
- **Widget SPA**: `http://localhost:3000/rewards/` (or `http://localhost:5173/rewards/` via Vite dev server)
- **Backend API**: `http://localhost:3000/api/v1/`
- **Swagger Docs**: `http://localhost:3000/api` (if Swagger enabled)
- **Prisma Studio**: `npx prisma studio` (visual DB browser on port 5555)

## SDK Test Page

- **File**: `sdk/test.html` — plain HTML page with embedded SDK script tag
- **Requires**: backend running on `localhost:3000`, valid public key + HMAC for customer identity
