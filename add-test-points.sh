#!/bin/bash

# Add Test Points to User Account
# This script adds points to amd07dev@gmail.com for testing

set -e

echo "🎯 Adding Test Points to amd07dev@gmail.com"
echo "=========================================="
echo ""

# Database connection details
DB_USER="pionts_user"
DB_NAME="pionts_db"
EMAIL="amd07dev@gmail.com"
POINTS_TO_ADD=500  # Give 500 points for testing (enough for multiple redemptions)

echo "📊 Checking current balance..."
CURRENT_BALANCE=$(docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c \
  "SELECT points_balance FROM customers WHERE email = '$EMAIL';")

if [ -z "$CURRENT_BALANCE" ]; then
  echo "❌ Error: User $EMAIL not found in database!"
  exit 1
fi

CURRENT_BALANCE=$(echo $CURRENT_BALANCE | xargs)
echo "Current balance: $CURRENT_BALANCE points"
echo ""

echo "➕ Adding $POINTS_TO_ADD test points..."
echo ""

# SQL to add points
cat <<EOF | docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME
-- Start transaction
BEGIN;

-- Get customer ID and project ID
DO \$\$
DECLARE
  v_customer_id INT;
  v_project_id INT;
  v_current_balance INT;
  v_new_balance INT;
BEGIN
  -- Get customer info
  SELECT id, project_id, points_balance
  INTO v_customer_id, v_project_id, v_current_balance
  FROM customers
  WHERE email = '$EMAIL';

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found: $EMAIL';
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + $POINTS_TO_ADD;

  -- Add points to balance
  UPDATE customers
  SET
    points_balance = v_new_balance,
    points_earned_total = points_earned_total + $POINTS_TO_ADD
  WHERE id = v_customer_id;

  -- Create points log entry
  INSERT INTO points_log (project_id, customer_id, points, type, description, created_at)
  VALUES (
    v_project_id,
    v_customer_id,
    $POINTS_TO_ADD,
    'manual_award',
    'Test points for discount redemption testing',
    NOW()
  );

  -- Show result
  RAISE NOTICE 'SUCCESS! Added % points to %', $POINTS_TO_ADD, '$EMAIL';
  RAISE NOTICE 'Previous balance: % points', v_current_balance;
  RAISE NOTICE 'New balance: % points', v_new_balance;
END \$\$;

COMMIT;

-- Verify the update
SELECT
  email,
  points_balance,
  points_earned_total,
  order_count
FROM customers
WHERE email = '$EMAIL';
EOF

echo ""
echo "✅ Points added successfully!"
echo ""
echo "📋 Available Redemption Tiers:"
echo "   50 points  → €2 OFF"
echo "  100 points  → €5 OFF"
echo "  200 points  → €10 OFF"
echo "  400 points  → €20 OFF"
echo ""
echo "🧪 Test Steps:"
echo "1. Login to widget at: https://hbc-solution.io"
echo "2. Check your points balance (should show $POINTS_TO_ADD+ points)"
echo "3. Go to 'Redeem' tab"
echo "4. Click redeem on any tier you can afford"
echo "5. Click '🛍️ Apply & Checkout' button"
echo "6. Should redirect to: https://8bc.myshopify.com/discount/CODE"
echo "7. Verify discount shows in Shopify checkout"
echo ""
echo "📊 View Points History:"
echo "   docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c \"SELECT * FROM points_log WHERE customer_id = (SELECT id FROM customers WHERE email = '$EMAIL') ORDER BY created_at DESC LIMIT 10;\""
echo ""
