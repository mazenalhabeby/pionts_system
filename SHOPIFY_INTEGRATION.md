# Shopify Integration — Step by Step

## 1. Create Your Project in Pionts Dashboard

- Go to your Pionts admin panel and sign up / log in
- Create a new **Project** (e.g. "My Shopify Store")
- Set the domain to your Shopify store domain (e.g. `mystore.myshopify.com`)
- Go to **API Keys** and generate a key pair — you'll get:
  - **Public key**: `pk_live_...` (used in the widget)
  - **Secret key**: `sk_live_...` (used in Liquid for HMAC + webhooks)

## 2. Add the Widget Script to Your Theme

1. In Shopify Admin → **Online Store** → **Themes** → **Edit code**
2. Open `layout/theme.liquid`
3. Add this **before the closing `</body>` tag**:

```liquid
{% if customer %}
<script src="https://YOUR_PIONTS_DOMAIN/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: 'pk_live_YOUR_PUBLIC_KEY',
    customer: {
      email: '{{ customer.email }}',
      name: '{{ customer.first_name }}',
      hmac: '{{ customer.email | hmac_sha256: "sk_live_YOUR_SECRET_KEY" }}'
    },
    mode: 'floating'
  });
</script>
{% endif %}
```

- Replace `YOUR_PIONTS_DOMAIN` with your backend URL
- Replace `pk_live_YOUR_PUBLIC_KEY` with your public key
- Replace `sk_live_YOUR_SECRET_KEY` with your secret key
- `mode: 'floating'` shows a slide-out panel; use `mode: 'embedded'` + `container: '#my-div'` to place it inline

## 3. Set Up Webhooks for Orders & Refunds

In Shopify Admin → **Settings** → **Notifications** → **Webhooks**:

**Webhook 1 — Order Paid:**
- Event: `Order payment`
- URL: `https://YOUR_PIONTS_DOMAIN/api/v1/webhooks/order`
- Format: JSON
- Add header: `X-Secret-Key: sk_live_YOUR_SECRET_KEY`

**Webhook 2 — Refund Created:**
- Event: `Refund create`
- URL: `https://YOUR_PIONTS_DOMAIN/api/v1/webhooks/refund`
- Format: JSON
- Add header: `X-Secret-Key: sk_live_YOUR_SECRET_KEY`

**Webhook 3 — Customer Created (optional):**
- Event: `Customer creation`
- URL: `https://YOUR_PIONTS_DOMAIN/api/v1/webhooks/customer`
- Format: JSON
- Add header: `X-Secret-Key: sk_live_YOUR_SECRET_KEY`

## 4. Handle Referral Links

Referral links look like: `https://yourstore.com?ref=ABC123`

The SDK (`loyalty.js`) automatically:
- Detects the `?ref=` parameter in the URL
- Saves it as a cookie for 30 days
- Sends it when the customer signs up through the widget

No extra Shopify config needed — it just works.

## 5. Apply Discount Codes at Checkout

When a customer redeems points, they get a discount code (e.g. `MYSTORE-ABC123-xyz`). They paste it at Shopify checkout manually.

**For automatic Shopify discount creation** (optional):
- In your Pionts project settings, connect your Shopify store credentials (store domain + Admin API access token)
- The system will auto-create Shopify discount codes via the Admin API when customers redeem

## 6. Configure Your Points Settings

In the Pionts dashboard → **Settings** tab:
- Set point values for each action (signup, purchase, referral, etc.)
- Set redemption tiers (e.g. 50pts = €2 off, 100pts = €5 off)
- Set anti-abuse rules (min order amount, max referrals)
- Set your **Discount Code Prefix** to your store name
- Enable/disable gamification tiers, leaderboard, email notifications

## 7. Test It

1. Open your Shopify store while logged in as a customer
2. The floating widget should appear in the bottom-right corner
3. Check that the points balance loads
4. Copy the referral link and open it in an incognito window
5. Place a test order to verify webhook triggers and points are awarded

## Summary Flow

```
Customer visits store → Widget loads → Shows points balance
Customer refers friend → Friend uses ?ref=CODE link → Cookie saved
Friend signs up + buys → Webhook fires → Points awarded to all 3 levels
Customer redeems points → Gets discount code → Uses at checkout
```
