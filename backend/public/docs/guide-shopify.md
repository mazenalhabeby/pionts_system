# Shopify Integration

**Zero code required.** Install the app and everything works automatically.

## Step 1: Install the App

Go to the Shopify App Store, search for **"Pionts"**, and click **Install**. Authorize when prompted.

The app automatically:
- Creates your Pionts project
- Generates API keys + HMAC secrets
- Registers webhooks (orders, refunds, customers)
- Injects the loyalty widget into your theme

## Step 2: Configure

Open the Pionts admin dashboard and configure:

| Setting | Description | Example |
|---------|-------------|---------|
| Earn Actions | How customers earn points | 1 pt per €1, 20 pts signup bonus |
| Redemption Tiers | Points → discount | 50 pts = €5, 100 pts = €10 |
| Referral Rewards | Referral tree rewards | Level 1: 8 pts, Level 2: 5 pts |
| Widget | Colors, branding | Primary color, brand name |

## Step 3: Done

Everything is automatic:

| Event | What Happens |
|-------|-------------|
| Customer purchases | Points awarded via Shopify webhook |
| Customer redeems in widget | Discount code created in Shopify |
| Customer uses code at checkout | Shopify applies the discount |
| Order refunded | Points reversed via webhook |
| New customer signs up | Signup bonus awarded |

> [!TIP]
> Add a dedicated Rewards Page in customer accounts using the Shopify Customer Account UI Extension.
