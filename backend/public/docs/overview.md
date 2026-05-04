# Overview

Pionts adds loyalty points, referrals, and rewards to any e-commerce platform. Your shop communicates with Pionts via a simple API — **4 backend calls and 1 frontend snippet**.

## How It Works

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Customer   │────────▶│  Your Shop   │────────▶│    Pionts    │
│   Browser    │         │   Backend    │         │    Server    │
└──────┬───────┘         └──────────────┘         └──────────────┘
       │                                                  ▲
       │   Floating Widget                                │
       │   (points, redeem, referrals)                    │
       └──────────────────────────────────────────────────┘
              Direct SDK calls (HMAC authenticated)
```

| Flow | Description |
|------|-------------|
| **Shop → Pionts** | Checkout validate, mark-used, order paid, refunded |
| **Widget → Pionts** | Customer data, redemption, referrals, history |
| **Pionts → Shop** | Webhook events (optional) |

## Features

| Feature | Description |
|---------|-------------|
| **Points** | Per purchase, signup, birthday, social follow, custom actions |
| **Redemption** | Configurable tiers — 50 pts = €5, 100 pts = €10, etc. |
| **Referrals** | Multi-level referral tree with per-level rewards |
| **Widget** | Floating chat bubble, drop-in, CSS isolated |
| **SDK** | `npm install @pionts/sdk` — TypeScript, timeout, retry |
| **Webhooks** | Queue-based with HMAC signatures and retry |
| **Security** | Scoped API keys, HMAC auth, audit logging |
| **Analytics** | Points economy, referral funnels, segments, export |

## Choose Your Platform

| Platform | Effort | Guide |
|----------|--------|-------|
| **Shopify** | Zero code — install app | [Shopify Guide](guide-shopify.md) |
| **WooCommerce** | PHP snippet + webhooks | [WooCommerce Guide](guide-woocommerce.md) |
| **Node.js / NestJS** | SDK + 4 hooks | [Custom API Guide](guide-custom.md) |
| **PHP / Laravel** | cURL helper | [PHP Guide](guide-php.md) |
| **Python / Django** | requests helper | [Python Guide](guide-python.md) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PIONTS_API_URL` | Yes | Pionts server URL |
| `PIONTS_SECRET_KEY` | Yes | Secret key `sk_live_...` |
| `PIONTS_PROJECT_KEY` | Widget only | Public key `pk_live_...` |
| `PIONTS_HMAC_SECRET` | Widget only | HMAC secret for customer auth |
