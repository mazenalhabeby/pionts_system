# Quick Add Points - One Command

## 🚀 Fastest Way (Copy & Paste)

### Step 1: SSH to Server
```bash
ssh root@65.108.154.26
```

### Step 2: Navigate to Pionts Directory
```bash
cd /srv/pionts/repo
```

### Step 3: Add 500 Points (One Command)
```bash
docker compose exec postgres psql -U pionts_user -d pionts_db <<'EOF'
BEGIN;
WITH customer_info AS (
  SELECT id, project_id, points_balance FROM customers WHERE email = 'amd07dev@gmail.com'
)
UPDATE customers SET
  points_balance = points_balance + 500,
  points_earned_total = points_earned_total + 500
FROM customer_info WHERE customers.id = customer_info.id;

INSERT INTO points_log (project_id, customer_id, points, type, description, created_at)
SELECT project_id, id, 500, 'manual_award', 'Test points for discount redemption', NOW()
FROM customers WHERE email = 'amd07dev@gmail.com';
COMMIT;

SELECT email, points_balance, points_earned_total FROM customers WHERE email = 'amd07dev@gmail.com';
EOF
```

### Step 4: Verify Points Added
You should see output like:
```
BEGIN
UPDATE 1
INSERT 0 1
COMMIT

      email       | points_balance | points_earned_total
------------------+----------------+--------------------
 amd07dev@gmail.com |           500 |                500
(1 row)
```

✅ **Done! You now have 500 points.**

---

## 🧪 Test the Discount

1. **Login**: https://hbc-solution.io
2. **Email**: amd07dev@gmail.com
3. **Redeem** 100 points for €5 OFF (or any tier)
4. **Click**: 🛍️ Apply & Checkout
5. **Verify**: Discount shows in Shopify checkout

---

## 🔄 Add More Points (If Needed)

Just change `500` to any amount in the command above:
- `100` = €5 OFF discount (minimum)
- `200` = €10 OFF discount
- `400` = €20 OFF discount
- `1000` = Test all tiers multiple times

---

## 📊 Check Current Balance

```bash
docker compose exec postgres psql -U pionts_user -d pionts_db -c \
  "SELECT email, points_balance, points_earned_total FROM customers WHERE email = 'amd07dev@gmail.com';"
```

---

## 🎯 Quick Reference

### Available Redemption Tiers:
| Points | Discount |
|--------|----------|
| 50     | €2 OFF   |
| 100    | €5 OFF   |
| 200    | €10 OFF  |
| 400    | €20 OFF  |

### With 500 Points You Can:
- ✅ Redeem 5x €5 OFF discounts
- ✅ Redeem 2x €10 OFF + 1x €5 OFF
- ✅ Redeem 1x €20 OFF + 1x €5 OFF
- ✅ Test multiple redemptions

---

## 💡 Pro Tip

After redemption, if you want to **cancel** and get points back:
1. Click "Cancel" button in widget
2. Points are immediately refunded
3. Discount code is marked as cancelled
4. You can redeem again
