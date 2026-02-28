# Seed Data — Comprehensive Demo Dataset

## Organizations

### Org 1: Brew & Bean Co (slug: brew-bean)
- Coffee shop chain, Pro plan
- 2 Users: owner + editor member
- 1 Project: **Brew Rewards** (points + referrals + partners all enabled)

### Org 2: Velvet Fashion (slug: velvet-fashion)
- Fashion e-commerce store
- 1 User: owner
- 1 Project: **Velvet VIP** (points + referrals enabled, partners disabled)

---

## Users

| # | Org | Email | Password | Name | Role |
|---|-----|-------|----------|------|------|
| 1 | Brew & Bean | admin@brewbean.com | admin | Marcus Rivera | owner |
| 2 | Brew & Bean | barista@brewbean.com | member | Jade Thompson | member |
| 3 | Velvet Fashion | hello@velvetfashion.com | admin | Priya Sharma | owner |

---

## Projects

| # | Org | Name | Domain | Platform | Points | Referrals | Partners |
|---|-----|------|--------|----------|--------|-----------|----------|
| 1 | Brew & Bean | Brew Rewards | brewbean.com | custom | yes | yes | yes |
| 2 | Velvet Fashion | Velvet VIP | velvetfashion.com | shopify | yes | yes | no |

---

## API Keys

| Project | Public Key | Secret Key |
|---------|-----------|------------|
| Brew Rewards | pk_live_brew_test_public_key_001 | sk_live_brew_test_secret_key_001 |
| Velvet VIP | pk_live_velvet_test_pub_key_002 | sk_live_velvet_test_sec_key_002 |

---

## Earn Actions (per project)

### Brew Rewards
| Slug | Label | Points | Category | Frequency | Enabled |
|------|-------|--------|----------|-----------|---------|
| signup | Sign up | 25 | predefined | one_time | yes |
| purchase | Every purchase | 15 | predefined | repeatable | yes |
| first_order | First order bonus | 75 | predefined | one_time | yes |
| review_photo | Photo review | 15 | predefined | repeatable | yes |
| review_text | Text review | 8 | predefined | repeatable | yes |
| share_product | Share a product | 5 | predefined | repeatable | yes |
| birthday | Birthday bonus | 30 | predefined | yearly | yes |
| follow_tiktok | Follow on TikTok | 10 | social_follow | one_time | yes |
| follow_instagram | Follow on Instagram | 10 | social_follow | one_time | yes |
| coffee_survey | Coffee preference survey | 20 | custom | one_time | yes |
| app_download | Download mobile app | 30 | custom | one_time | no |

### Velvet VIP
| Slug | Label | Points | Category | Frequency | Enabled |
|------|-------|--------|----------|-----------|---------|
| signup | Sign up | 20 | predefined | one_time | yes |
| purchase | Every purchase | 10 | predefined | repeatable | yes |
| first_order | First order bonus | 50 | predefined | one_time | yes |
| review_photo | Photo review | 12 | predefined | repeatable | yes |
| review_text | Text review | 5 | predefined | repeatable | yes |
| share_product | Share a product | 5 | predefined | repeatable | yes |
| birthday | Birthday bonus | 25 | predefined | yearly | yes |
| follow_tiktok | Follow on TikTok | 10 | social_follow | one_time | yes |
| follow_instagram | Follow on Instagram | 10 | social_follow | one_time | yes |

---

## Redemption Tiers

### Brew Rewards
| Points | Discount |
|--------|----------|
| 50 | 3 |
| 100 | 6 |
| 200 | 12 |
| 400 | 25 |
| 800 | 55 |

### Velvet VIP
| Points | Discount |
|--------|----------|
| 50 | 2 |
| 100 | 5 |
| 200 | 10 |
| 400 | 20 |

---

## Referral Levels

### Brew Rewards
| Level | Points |
|-------|--------|
| 2 | 8 |
| 3 | 3 |

### Velvet VIP
| Level | Points |
|-------|--------|
| 2 | 5 |
| 3 | 2 |

---

## Customers — Brew Rewards (30 customers)

### Top Referrers & Power Users
| # | Name | Email | Code | Referred By | Balance | Earned | Orders | Social | Partner |
|---|------|-------|------|-------------|---------|--------|--------|--------|---------|
| 1 | Olivia Martinez | olivia@test.com | OLV8M3 | — | 620 | 1280 | 18 | TT+IG | yes (12%) |
| 2 | Liam Nakamura | liam@test.com | LM4N7K | — | 340 | 890 | 14 | TT+IG | yes (10%) |
| 3 | Aisha Patel | aisha@test.com | AP2R6D | — | 480 | 720 | 10 | TT | no |

### Olivia's Referral Network (L1: 5 direct)
| # | Name | Email | Code | Referred By | Balance | Earned | Orders |
|---|------|-------|------|-------------|---------|--------|--------|
| 4 | Noah Kim | noah@example.com | NK9T2B | OLV8M3 | 185 | 285 | 5 |
| 5 | Sofia Reyes | sofia@example.com | SR3W7H | OLV8M3 | 120 | 170 | 3 |
| 6 | Ethan Clarke | ethan@example.com | EC5J8P | OLV8M3 | 90 | 115 | 2 |
| 7 | Mila Johansson | mila@example.com | MJ6K1N | OLV8M3 | 45 | 45 | 0 |
| 8 | Diego Santos | diego@example.com | DS8Q4V | OLV8M3 | 195 | 345 | 7 |

### L2 under Noah (grandchildren of Olivia)
| # | Name | Email | Code | Referred By | Balance | Earned | Orders |
|---|------|-------|------|-------------|---------|--------|--------|
| 9 | Hana Yilmaz | hana@example.com | HY2L5F | NK9T2B | 110 | 160 | 3 |
| 10 | Lucas Ferreira | lucas@example.com | LF7M3R | NK9T2B | 65 | 65 | 1 |

### L2 under Diego (grandchildren of Olivia)
| 11 | Amara Okafor | amara@example.com | AO4P8X | DS8Q4V | 130 | 180 | 4 |

### L3 under Hana (great-grandchild — Olivia->Noah->Hana->Kai)
| 12 | Kai Tanaka | kai@example.com | KT6R9W | HY2L5F | 40 | 40 | 1 |

### Liam's Referral Network (L1: 4 direct)
| # | Name | Email | Code | Referred By | Balance | Earned | Orders |
|---|------|-------|------|-------------|---------|--------|--------|
| 13 | Zara Ahmed | zara@example.com | ZA3S7G | LM4N7K | 155 | 230 | 5 |
| 14 | Oscar Lindgren | oscar@example.com | OL5D2C | LM4N7K | 80 | 105 | 2 |
| 15 | Isla Murphy | isla@example.com | IM8E4T | LM4N7K | 100 | 150 | 3 |
| 16 | Ravi Gupta | ravi@example.com | RG1F6Y | LM4N7K | 35 | 35 | 0 |

### L2 under Zara (grandchild of Liam)
| 17 | Yuki Sato | yuki@example.com | YS9H2K | ZA3S7G | 55 | 80 | 1 |

### Aisha's Referral Network (L1: 3 direct)
| 18 | Felix Weber | felix@example.com | FW4J8M | AP2R6D | 90 | 115 | 2 |
| 19 | Chloe Dubois | chloe@example.com | CD7K3N | AP2R6D | 145 | 195 | 4 |
| 20 | Tariq Hassan | tariq@example.com | TH2L9P | AP2R6D | 25 | 25 | 0 |

### L2 under Chloe (grandchild of Aisha)
| 21 | Ines Moreau | ines@example.com | IN5M6Q | CD7K3N | 70 | 95 | 2 |

### Independent Customers (no referral chain)
| # | Name | Email | Code | Balance | Earned | Orders | Notes |
|---|------|-------|------|---------|--------|--------|-------|
| 22 | James O'Brien | james@example.com | JO8N4R | 210 | 360 | 8 | Loyal, many orders |
| 23 | Leila Bergström | leila@example.com | LB3P7S | 95 | 120 | 2 | Moderate |
| 24 | Chen Wei | chen@example.com | CW6Q2T | 160 | 260 | 6 | Active buyer |
| 25 | Maria Rossi | maria@example.com | MR9R5U | 30 | 30 | 0 | New signup |
| 26 | Kwame Asante | kwame@example.com | KA1S8V | 50 | 100 | 2 | Used redemption |
| 27 | Elena Volkov | elena@example.com | EV4T1W | 0 | 75 | 1 | Churned (90 days inactive) |
| 28 | Sam Taylor | sam@example.com | ST7U3X | 15 | 40 | 1 | At risk (45 days inactive) |
| 29 | Noor Al-Rashid | noor@example.com | NA2V6Y | 25 | 25 | 0 | Just signed up |
| 30 | Freya Andersen | freya@example.com | FA5W9Z | 35 | 35 | 0 | Just signed up |

---

## Partners (Brew Rewards)

| Customer | Commission % | Total Earned | Earnings Count |
|----------|-------------|--------------|----------------|
| Olivia Martinez | 12% | ~€85 (6 orders via referrals) | 6 |
| Liam Nakamura | 10% | ~€42 (4 orders via referrals) | 4 |

---

## Referral Tree Summary

### Brew Rewards
```
Olivia (OLV8M3) — Partner 12%
├── Noah (NK9T2B) — 2 referrals
│   ├── Hana (HY2L5F) — 1 referral
│   │   └── Kai (KT6R9W) ← L3 of Olivia
│   └── Lucas (LF7M3R)
├── Sofia (SR3W7H)
├── Ethan (EC5J8P)
├── Mila (MJ6K1N)
└── Diego (DS8Q4V) — 1 referral
    └── Amara (AO4P8X)

Liam (LM4N7K) — Partner 10%
├── Zara (ZA3S7G) — 1 referral
│   └── Yuki (YS9H2K)
├── Oscar (OL5D2C)
├── Isla (IM8E4T)
└── Ravi (RG1F6Y)

Aisha (AP2R6D)
├── Felix (FW4J8M)
├── Chloe (CD7K3N) — 1 referral
│   └── Ines (IN5M6Q)
└── Tariq (TH2L9P)
```

---

## Points Log Distribution

Points log entries are spread across the last 120 days with concentration in recent 30 days for chart visibility. Types include:
- signup, purchase, first_order — standard earning
- referral_l2, referral_l3 — network rewards
- review_photo, review_text — engagement
- follow_tiktok, follow_instagram — social
- share_product, birthday — misc earn
- redeem — points spent
- clawback — refund reversal
- manual_award, manual_deduct — admin actions

**Total entries: ~200+**

---

## Redemptions

| Customer | Points Spent | Discount | Code | Used |
|----------|-------------|----------|------|------|
| Olivia | 400 | 25 | BREW-OLV8M3-001 | yes |
| Olivia | 200 | 12 | BREW-OLV8M3-002 | yes |
| Liam | 200 | 12 | BREW-LM4N7K-003 | yes |
| Liam | 100 | 6 | BREW-LM4N7K-004 | yes |
| Liam | 50 | 3 | BREW-LM4N7K-005 | no (pending) |
| Aisha | 100 | 6 | BREW-AP2R6D-006 | yes |
| Noah | 100 | 6 | BREW-NK9T2B-007 | yes |
| Diego | 100 | 6 | BREW-DS8Q4V-008 | yes |
| Diego | 50 | 3 | BREW-DS8Q4V-009 | yes |
| James | 100 | 6 | BREW-JO8N4R-010 | yes |
| James | 50 | 3 | BREW-JO8N4R-011 | yes |
| Kwame | 50 | 3 | BREW-KA1S8V-012 | yes |
| Chen | 100 | 6 | BREW-CW6Q2T-013 | yes |
| Zara | 50 | 3 | BREW-ZA3S7G-014 | yes |
| Chloe | 50 | 3 | BREW-CD7K3N-015 | yes |

---

## Settings — Brew Rewards

| Key | Value |
|-----|-------|
| min_order_referral | 8 |
| max_direct_referrals | 50 |
| points_expiry_months | 12 |
| referral_discount_percent | 5 |
| partner_reward_type | credit |
| gamification_enabled | true |
| tier_bronze_label | Bean |
| tier_bronze_threshold | 100 |
| tier_bronze_multiplier | 1.0 |
| tier_silver_label | Roast |
| tier_silver_threshold | 500 |
| tier_silver_multiplier | 1.25 |
| tier_gold_label | Barista |
| tier_gold_threshold | 1000 |
| tier_gold_multiplier | 1.5 |
| leaderboard_enabled | true |
| widget_primary_color | #d97706 |
| widget_bg_color | #fef3c7 |
| widget_text_color | #1c1917 |
| widget_brand_name | Brew & Bean |
| social_tiktok_url | https://tiktok.com/@brewbean |
| social_instagram_url | https://instagram.com/brewbean |
| referral_base_url | https://brewbean.com |
| email_notification_mode | instant |
| email_welcome_enabled | true |
| email_referral_enabled | true |
| email_from_name | Brew & Bean Rewards |

## Settings — Velvet VIP

| Key | Value |
|-----|-------|
| min_order_referral | 15 |
| max_direct_referrals | 30 |
| points_expiry_months | 6 |
| referral_discount_percent | 10 |
| gamification_enabled | true |
| tier_bronze_label | Silver |
| tier_bronze_threshold | 200 |
| tier_bronze_multiplier | 1.0 |
| tier_silver_label | Gold |
| tier_silver_threshold | 500 |
| tier_silver_multiplier | 1.5 |
| tier_gold_label | Platinum |
| tier_gold_threshold | 1000 |
| tier_gold_multiplier | 2.0 |
| leaderboard_enabled | false |
| widget_primary_color | #7c3aed |
| widget_bg_color | #f5f3ff |
| widget_text_color | #1e1b4b |
| widget_brand_name | Velvet VIP |
| social_tiktok_url | https://tiktok.com/@velvetfashion |
| social_instagram_url | https://instagram.com/velvetfashion |
| referral_base_url | https://velvetfashion.com |
| email_notification_mode | digest |
| email_welcome_enabled | true |
| email_referral_enabled | true |
| email_from_name | Velvet Fashion |

---

## Customers — Velvet VIP (10 customers)

| # | Name | Email | Code | Referred By | Balance | Earned | Orders |
|---|------|-------|------|-------------|---------|--------|--------|
| 1 | Ava Bennett | ava@velvet.com | AVB3K7 | — | 280 | 430 | 8 |
| 2 | Leo Strand | leo@velvet.com | LS6P2M | — | 150 | 200 | 4 |
| 3 | Ruby Chen | ruby@velvet.com | RC9T5N | AVB3K7 | 110 | 160 | 3 |
| 4 | Max Hoffman | max@velvet.com | MH2W8Q | AVB3K7 | 75 | 100 | 2 |
| 5 | Zoe Laurent | zoe@velvet.com | ZL4X1R | AVB3K7 | 40 | 40 | 0 |
| 6 | Finn Callahan | finn@velvet.com | FC7Y3S | LS6P2M | 85 | 110 | 2 |
| 7 | Nina Park | nina@velvet.com | NP1Z6T | LS6P2M | 30 | 30 | 0 |
| 8 | Omar Farah | omar@velvet.com | OF3A9U | RC9T5N | 55 | 80 | 1 |
| 9 | Ella Morrison | ella@velvet.com | EM6B2V | — | 20 | 20 | 0 |
| 10 | Jay Pham | jay@velvet.com | JP8C4W | — | 95 | 145 | 3 |

---

## Login Credentials

| Org | Email | Password | Role |
|-----|-------|----------|------|
| Brew & Bean | admin@brewbean.com | admin | owner |
| Brew & Bean | barista@brewbean.com | member | editor on Brew Rewards |
| Velvet Fashion | hello@velvetfashion.com | admin | owner |

## Widget Test

| Project | Customer Email | HMAC secret for testing |
|---------|---------------|------------------------|
| Brew Rewards | olivia@test.com | sk_live_brew_test_secret_key_001 |
| Velvet VIP | ava@velvet.com | sk_live_velvet_test_sec_key_002 |
