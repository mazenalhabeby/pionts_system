# Shopify Discount Integration Guide

## 🎯 Overview

Your system **already creates discount codes in Shopify** when customers redeem points. This guide explains how to integrate these discount codes with Shopify's checkout page.

---

## ✅ What's Already Implemented

### Backend (Working!)

#### 1. **Discount Code Generation** (`RedemptionsService`)
```typescript
// When user redeems points:
const code = `${prefix}-${customer.referralCode}-${Date.now()}`;
// Example: "STORE-ABC123-1234567890"
```

#### 2. **Shopify Integration** (`ShopifyService`)
```typescript
// Creates discount in Shopify via Admin API:
async createDiscount(code: string, amount: number) {
  // Creates Price Rule
  // Creates Discount Code
  // Sets usage_limit: 1 (single use)
  // Sets once_per_customer: true
}
```

#### 3. **Discount Validation** (`DiscountService`)
```typescript
// Validates discount code
// Marks as used when applied
// Prevents reuse
```

---

## 🛍️ How Shopify Checkout Works

### Shopify Checkout Already Has a Discount Field!

```
┌────────────────────────────────────────┐
│  Shopify Checkout Page                 │
├────────────────────────────────────────┤
│  Cart Items:                           │
│  • Product A         €50.00            │
│  • Product B         €30.00            │
│  ─────────────────────────────         │
│  Subtotal:           €80.00            │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Discount code or gift card       │ │
│  │ [_____________________] [Apply]  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ─────────────────────────────         │
│  Discount (STORE-ABC123-123): -€10.00 │ ← Applied!
│  Total:              €70.00            │
└────────────────────────────────────────┘
```

**Built-in Features:**
- ✅ Discount code input field (native Shopify)
- ✅ Automatic price calculation
- ✅ Shows discount amount
- ✅ Updates total price
- ✅ Validates discount code
- ✅ Prevents reuse (if usage_limit: 1)

**You don't need to build this!** Shopify handles it automatically.

---

## 🚀 Integration Options

### **Option 1: Manual Entry** (Already Works!)

User manually copies discount code from widget and pastes in checkout.

#### Current Flow:
```
1. User redeems 100 points in widget
   ↓
2. Widget shows: "STORE-ABC123-1234567890"
   ↓
3. User copies code
   ↓
4. User goes to Shopify checkout
   ↓
5. User pastes code in discount field
   ↓
6. Shopify applies €10 discount
   ✅ Total updates automatically
```

**Pros:**
- ✅ Already working
- ✅ No code changes needed
- ✅ Simple

**Cons:**
- ❌ Requires manual copy/paste
- ❌ Extra step for user

---

### **Option 2: Auto-Apply via URL** (Recommended!)

Automatically apply discount code by adding it to the checkout URL.

#### Shopify URL Format:
```
https://your-store.myshopify.com/discount/DISCOUNT_CODE
```

#### Implementation:

**Step 1: Update Widget to Generate Checkout URL**

When user redeems points, show a "Apply Discount" button that redirects to Shopify with discount pre-applied.

**Frontend (`client-ui/src/pages/Redeem.tsx`):**

```typescript
// After successful redemption:
const discountCode = response.discount_code; // e.g., "STORE-ABC123-123"
const shopifyDomain = "your-store.myshopify.com"; // From project settings

// Construct checkout URL with discount
const checkoutUrl = `https://${shopifyDomain}/discount/${discountCode}`;

// Show button to user
<button onClick={() => window.location.href = checkoutUrl}>
  Apply Discount & Checkout
</button>
```

**Full Example:**

```tsx
// In Redeem page, after user redeems points:

function RedeemSuccess({ discountCode, discountAmount }) {
  const shopifyDomain = settings?.shopify_domain || 'your-store.myshopify.com';
  const checkoutUrl = `https://${shopifyDomain}/discount/${discountCode}`;

  return (
    <div className="pw-redeem-success">
      <h2>🎉 Discount Code Generated!</h2>

      {/* Option 1: Copy Code */}
      <div className="pw-discount-code">
        <code>{discountCode}</code>
        <button onClick={() => navigator.clipboard.writeText(discountCode)}>
          Copy Code
        </button>
      </div>

      <p>Saves you €{discountAmount}!</p>

      {/* Option 2: Auto-Apply (Recommended!) */}
      <button
        className="pw-btn pw-btn--primary"
        onClick={() => window.location.href = checkoutUrl}
      >
        🛍️ Apply & Go to Checkout
      </button>

      <p className="pw-help-text">
        Or manually enter code at checkout
      </p>
    </div>
  );
}
```

#### How It Works:
```
1. User clicks "Redeem 100 points"
   ↓
2. Widget generates: "STORE-ABC123-123"
   ↓
3. User clicks "Apply & Go to Checkout"
   ↓
4. Redirects to: https://store.com/discount/STORE-ABC123-123
   ↓
5. Shopify automatically:
   • Applies discount to cart
   • Shows updated total
   • Proceeds to checkout
   ✅ No manual entry needed!
```

---

### **Option 3: Add to Cart with Discount** (Advanced)

Add product to cart AND apply discount in one click.

#### Shopify Cart URL Format:
```
https://your-store.myshopify.com/cart/VARIANT_ID:1?discount=DISCOUNT_CODE
```

#### Example:
```typescript
const addToCartWithDiscount = (variantId: string, discountCode: string) => {
  const url = `https://${shopifyDomain}/cart/${variantId}:1?discount=${discountCode}`;
  window.location.href = url;
};
```

---

## 🔧 Implementation Steps

### **Step 1: Store Shopify Domain in Project Settings**

Add a setting for the Shopify store domain:

**Database (Already exists in Settings table):**
```sql
-- Add setting for Shopify domain
INSERT INTO settings (project_id, key, value)
VALUES (1, 'shopify_domain', 'your-store.myshopify.com');
```

**Or via Dashboard UI:**
```
Settings → Integrations → Shopify Domain
[ your-store.myshopify.com ]
```

---

### **Step 2: Update Widget to Show "Apply & Checkout" Button**

**File: `client-ui/src/pages/Redeem.tsx`**

After successful redemption, show two options:
1. Copy discount code (manual)
2. Apply & go to checkout (auto)

Add this after the redemption success message:

```tsx
const shopifyDomain = settings?.shopify_domain;

{discountCode && shopifyDomain && (
  <div className="pw-checkout-actions">
    <button
      className="pw-btn pw-btn--primary pw-btn--full"
      onClick={() => {
        const checkoutUrl = `https://${shopifyDomain}/discount/${discountCode}`;
        window.open(checkoutUrl, '_blank'); // Opens in new tab
      }}
    >
      🛍️ Apply Discount & Go to Checkout
    </button>

    <div className="pw-divider">or</div>

    <div className="pw-discount-code-display">
      <label>Discount Code:</label>
      <div className="pw-code-box">
        <code>{discountCode}</code>
        <button onClick={() => {
          navigator.clipboard.writeText(discountCode);
          alert('Copied!');
        }}>
          📋 Copy
        </button>
      </div>
      <small>Manually enter this code at checkout</small>
    </div>
  </div>
)}
```

---

### **Step 3: Update Backend to Return Shopify Domain**

**File: `backend/src/sdk/sdk.service.ts`**

Include `shopify_domain` in project settings response:

```typescript
async getProjectConfig(projectId: number) {
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
  });

  return {
    // ... other settings
    shopify_domain: this.configService.get(projectId, 'shopify_domain'),
  };
}
```

---

### **Step 4: Test the Flow**

#### Test Scenario:
```
1. User has 100 points
2. User clicks "Redeem for €10 off"
3. Widget shows:
   ┌────────────────────────────────┐
   │ 🎉 Discount Generated!         │
   │                                │
   │ Code: STORE-ABC123-123         │
   │ Saves: €10                     │
   │                                │
   │ [Apply & Go to Checkout] ←─────── Click this
   │                                │
   │ - or -                         │
   │                                │
   │ Copy: STORE-ABC123-123 [Copy] │
   └────────────────────────────────┘
4. Clicks "Apply & Go to Checkout"
5. Opens Shopify: https://store.com/discount/STORE-ABC123-123
6. Shopify cart shows:
   ┌────────────────────────────────┐
   │ Cart                           │
   │ Subtotal: €80.00              │
   │ Discount (STORE-ABC123-123):   │
   │           -€10.00 ✅          │
   │ Total:    €70.00              │
   └────────────────────────────────┘
7. ✅ Discount automatically applied!
```

---

## 🎨 UI/UX Best Practices

### **Show Discount Code Clearly**

```tsx
<div className="pw-discount-success">
  {/* Large, prominent display */}
  <div className="pw-discount-code-hero">
    <div className="pw-discount-badge">
      💰 €{discountAmount} OFF
    </div>
    <div className="pw-discount-code-display">
      <span className="pw-label">Your Code:</span>
      <code className="pw-code-large">{discountCode}</code>
    </div>
  </div>

  {/* Primary CTA */}
  <button className="pw-btn-primary pw-btn-large">
    🛍️ Apply & Checkout Now
  </button>

  {/* Secondary option */}
  <button className="pw-btn-secondary">
    📋 Copy Code for Later
  </button>

  {/* Help text */}
  <p className="pw-help-text">
    Code valid for one-time use. Apply at checkout.
  </p>
</div>
```

---

## 🔒 Security & Validation

### **Current Safeguards (Already Implemented):**

1. **Shopify Validation**
   - Discount code created in Shopify via Admin API
   - Shopify validates code at checkout
   - Shopify enforces usage_limit: 1
   - Shopify enforces once_per_customer: true

2. **Backend Validation** (`DiscountService`)
   - Validates code exists in database
   - Checks if already used
   - Marks as used after application

3. **Webhook Integration**
   - Order webhook calls `/api/v1/discount/mark-used`
   - Prevents reuse in your system

### **Flow:**
```
User applies code in Shopify
   ↓
Shopify validates code (built-in)
   ↓
User completes order
   ↓
Shopify sends webhook to your API
   ↓
API marks discount as used
   ↓
Code cannot be reused ✅
```

---

## 📱 Mobile Optimization

### **Consideration: Cross-Device Usage**

Users might:
1. Redeem points on mobile widget
2. Checkout on desktop Shopify

**Solution: Email Discount Code**

Send discount code via email after redemption:

```typescript
// After redemption:
await emailService.sendDiscountCode(
  customer.email,
  discountCode,
  discountAmount
);
```

**Email Template:**
```html
<h2>🎉 Your €10 Discount Code</h2>
<p>You've successfully redeemed 100 points!</p>

<div style="background: #f0f0f0; padding: 20px; text-align: center;">
  <h3>Discount Code:</h3>
  <code style="font-size: 24px; font-weight: bold;">
    STORE-ABC123-123
  </code>
</div>

<p>
  <a href="https://your-store.com/discount/STORE-ABC123-123">
    Apply & Checkout Now
  </a>
</p>

<small>Code valid for one-time use. Expires in 30 days.</small>
```

---

## 🧪 Testing Checklist

### **Manual Testing:**

- [ ] Redeem points in widget
- [ ] Verify discount code generated
- [ ] Click "Apply & Checkout" button
- [ ] Verify redirect to Shopify
- [ ] Verify discount auto-applied in cart
- [ ] Verify total price updates correctly
- [ ] Complete test order
- [ ] Verify discount marked as "used"
- [ ] Try to reuse code → Should fail

### **Edge Cases:**

- [ ] User has empty cart → Discount still applied when they add items
- [ ] User has existing discount → Shopify shows error (only one discount allowed)
- [ ] Discount code expired → Shopify shows error
- [ ] Invalid discount code → Shopify shows error

---

## 📊 Current vs Improved Flow

### **Current (Manual):**
```
1. User redeems points       [Widget]
2. Widget shows code         [Widget]
3. User copies code          [User action]
4. User opens Shopify        [User action]
5. User goes to cart         [User action]
6. User pastes code          [User action]
7. User clicks Apply         [User action]
8. Checkout                  [Shopify]

Steps: 8
User actions: 5 ❌ Too many!
```

### **Improved (Auto-Apply):**
```
1. User redeems points       [Widget]
2. User clicks "Apply"       [User action]
3. Opens Shopify with code   [Auto]
4. Discount applied          [Auto]
5. Checkout                  [Shopify]

Steps: 5
User actions: 2 ✅ Much better!
```

---

## 🎯 Summary

### **What's Already Working:**
✅ Discount codes created in Shopify
✅ Shopify checkout has discount field
✅ Shopify validates and applies discount
✅ Shopify calculates new total
✅ Usage limits enforced
✅ Webhook tracking

### **What to Add:**
1. ✅ Store `shopify_domain` in project settings
2. ✅ Update widget to show "Apply & Checkout" button
3. ✅ Construct checkout URL: `https://store.com/discount/CODE`
4. ✅ Redirect user to Shopify with discount pre-applied

### **Result:**
🎉 **One-click discount application!**

Users go from "redeeming points" to "checkout with discount applied" in ONE click instead of 5 manual steps!

---

## 📝 Quick Implementation

**30-Second Version:**

```tsx
// In Redeem page, after redemption:
const checkoutUrl = `https://${settings.shopify_domain}/discount/${discountCode}`;

<button onClick={() => window.location.href = checkoutUrl}>
  Apply & Checkout
</button>
```

That's it! Shopify handles the rest. 🚀
