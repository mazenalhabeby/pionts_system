# Add Test Points to amd07dev@gmail.com

## 🚀 Quick Start

SSH to the server and run the automated script:

```bash
# 1. SSH to server
ssh root@65.108.154.26

# 2. Navigate to Pionts directory
cd /srv/pionts/repo

# 3. Run the script (adds 500 points)
./add-test-points.sh
```

Done! You now have 500 points to test redemptions.

---

## 📝 Manual Method (Alternative)

If you prefer to run SQL commands manually:

### Step 1: SSH to Server
```bash
ssh root@65.108.154.26
```

### Step 2: Connect to Database
```bash
cd /srv/pionts/repo
docker compose exec postgres psql -U pionts_user -d pionts_db
```

### Step 3: Check Current Balance
```sql
SELECT
  id,
  email,
  points_balance,
  points_earned_total
FROM customers
WHERE email = 'amd07dev@gmail.com';
```

### Step 4: Add Test Points (500 points)
```sql
-- Start transaction
BEGIN;

-- Add points (change 500 to any amount you want)
WITH customer_info AS (
  SELECT id, project_id, points_balance
  FROM customers
  WHERE email = 'amd07dev@gmail.com'
)
UPDATE customers
SET
  points_balance = points_balance + 500,
  points_earned_total = points_earned_total + 500
FROM customer_info
WHERE customers.id = customer_info.id
RETURNING customers.id, customers.email, customers.points_balance;

-- Add log entry
INSERT INTO points_log (project_id, customer_id, points, type, description, created_at)
SELECT
  project_id,
  id,
  500,
  'manual_award',
  'Test points for discount redemption',
  NOW()
FROM customers
WHERE email = 'amd07dev@gmail.com';

-- Commit
COMMIT;
```

### Step 5: Verify Points Added
```sql
SELECT
  email,
  points_balance,
  points_earned_total
FROM customers
WHERE email = 'amd07dev@gmail.com';
```

### Step 6: Exit Database
```sql
\q
```

---

## 🧪 Testing Discount Redemption

After adding points:

### 1. **Login to Widget**
- Go to: https://hbc-solution.io
- Login with email: amd07dev@gmail.com
- Enter OTP code from email

### 2. **Check Points Balance**
- You should see 500+ points in the dashboard
- Progress ring should show your balance

### 3. **Redeem Points**
- Click "Redeem" tab
- Available tiers:
  - ✅ 50 points → €2 OFF
  - ✅ 100 points → €5 OFF
  - ✅ 200 points → €10 OFF
  - ✅ 400 points → €20 OFF
- Click "Redeem" on any tier you want

### 4. **Apply Discount to Shopify**
- After redeeming, you'll see the discount code
- Click **"🛍️ Apply & Checkout"** button
- This will open: `https://8bc.myshopify.com/discount/YOUR-CODE`

### 5. **Verify in Shopify Checkout**
- Shopify checkout page should load
- Discount should be **automatically applied**
- Order summary should show:
  ```
  Subtotal:        €XX.XX
  Discount:        -€10.00  ← YOUR DISCOUNT!
  TOTAL SAVINGS:   €10.00
  Total:           €XX.XX
  ```

### 6. **Complete Test (or Cancel)**
- You can complete the test order to verify everything works
- Or just verify the discount shows and cancel
- If you cancel the redemption in widget, points will be refunded

---

## 📊 Useful Database Queries

### View Points History
```sql
SELECT
  pl.created_at,
  pl.points,
  pl.type,
  pl.description
FROM points_log pl
JOIN customers c ON c.id = pl.customer_id
WHERE c.email = 'amd07dev@gmail.com'
ORDER BY pl.created_at DESC
LIMIT 20;
```

### View All Redemptions
```sql
SELECT
  r.id,
  r.discount_code,
  r.discount_amount,
  r.points_spent,
  r.used,
  r.created_at
FROM redemptions r
JOIN customers c ON c.id = r.customer_id
WHERE c.email = 'amd07dev@gmail.com'
ORDER BY r.created_at DESC;
```

### View Customer Full Profile
```sql
SELECT
  email,
  name,
  points_balance,
  points_earned_total,
  order_count,
  referral_code,
  is_partner,
  created_at
FROM customers
WHERE email = 'amd07dev@gmail.com';
```

### Check Shopify Domain Setting
```sql
SELECT key, value
FROM settings
WHERE key = 'shopify_domain';
```

---

## 🔧 Troubleshooting

### Issue: "Apply & Checkout" Button Not Showing

**Solution:** Set Shopify domain in settings:
```sql
INSERT INTO settings (project_id, key, value)
VALUES (1, 'shopify_domain', '8bc.myshopify.com')
ON CONFLICT (project_id, key)
DO UPDATE SET value = '8bc.myshopify.com';
```

### Issue: User Not Found

**Solution:** Check if user exists:
```sql
SELECT * FROM customers WHERE email = 'amd07dev@gmail.com';
```

If not found, create account by:
1. Go to widget at https://hbc-solution.io
2. Login with email (will create account automatically)
3. Complete profile (name + birthdate)
4. Then run the add-points script again

### Issue: Discount Not Showing in Shopify

**Solution:** Verify Shopify API credentials in backend `.env`:
```bash
docker compose exec backend env | grep SHOPIFY
```

Should show:
```
SHOPIFY_STORE=8bc.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx...
```

If missing, add to `.env` and restart backend:
```bash
docker compose restart backend
```

---

## 💡 Quick Reference

### Different Point Amounts for Testing

**50 points** - Test smallest tier (€2 OFF)
```sql
-- Just change 500 to 50 in the SQL above
```

**100 points** - Test medium tier (€5 OFF)
```sql
-- Change 500 to 100
```

**200 points** - Test large tier (€10 OFF)
```sql
-- Change 500 to 200
```

**500 points** - Test multiple redemptions
```sql
-- Use 500 (recommended for full testing)
```

**1000 points** - Test all tiers
```sql
-- Change 500 to 1000
```

---

## 📞 Support

If you encounter any issues:
1. Check backend logs: `docker compose logs -f backend`
2. Check database connection: `docker compose ps postgres`
3. Verify settings: `SELECT * FROM settings;`
4. Check customer exists: `SELECT * FROM customers WHERE email = 'amd07dev@gmail.com';`

---

## ✅ Summary

```bash
# Complete command sequence:
ssh root@65.108.154.26
cd /srv/pionts/repo
./add-test-points.sh

# Then test:
# 1. Login at https://hbc-solution.io
# 2. Check points balance
# 3. Redeem points
# 4. Click "Apply & Checkout"
# 5. Verify discount in Shopify
```

Done! 🎉
