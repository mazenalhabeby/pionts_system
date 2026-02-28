#!/bin/bash
#
# Comprehensive Backend Test Suite
# Tests: Functional + Security
#

BASE="http://localhost:3000"
COOKIE_JAR="/tmp/test_cookies.txt"
PASS_COUNT=0
FAIL_COUNT=0

# Cleanup
rm -f "$COOKIE_JAR"

# Unique suffix to avoid collisions with previous test runs
UNIQUE=$(date +%s)

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "  [PASS] $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "  [FAIL] $1"
  if [ -n "$2" ]; then
    echo "         Response: $(echo "$2" | head -c 300)"
  fi
}

echo "========================================"
echo "  COMPREHENSIVE BACKEND TEST SUITE"
echo "  $(date)"
echo "========================================"
echo ""

########################################
# PART 1: FUNCTIONAL TESTS
########################################

echo "========== PART 1: FUNCTIONAL TESTS =========="
echo ""

# ---- 1. Admin Session Auth ----
echo "--- 1. Admin Session Auth ---"

# 1a. POST /admin/login with correct password
RESP=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR" -X POST "$BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"123456789"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"success":true'; then
    pass "POST /admin/login with correct password => $HTTP_CODE + success:true"
  else
    fail "POST /admin/login - got $HTTP_CODE but body missing success:true" "$BODY"
  fi
else
  fail "POST /admin/login with correct password => HTTP $HTTP_CODE (expected 200/201)" "$BODY"
fi

# 1b. GET /admin/api/session WITH cookie
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if echo "$BODY" | grep -q '"authenticated":true'; then
  pass "GET /admin/api/session with cookie => authenticated:true"
else
  fail "GET /admin/api/session with cookie => expected authenticated:true" "$BODY"
fi

# 1c. GET /admin/api/session WITHOUT cookie
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/api/session")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if echo "$BODY" | grep -q '"authenticated":false'; then
  pass "GET /admin/api/session without cookie => authenticated:false"
else
  fail "GET /admin/api/session without cookie => expected authenticated:false" "$BODY"
fi

echo ""

# ---- 2. Admin Dashboard API ----
echo "--- 2. Admin Dashboard API ---"

# 2a. GET /admin/api/stats
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/stats")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"stats"'; then
  pass "GET /admin/api/stats => 200 + stats object"
else
  fail "GET /admin/api/stats => HTTP $HTTP_CODE" "$BODY"
fi

# 2b. GET /admin/api/customers
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customers")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"customers"' && echo "$BODY" | grep -q '"total"'; then
  pass "GET /admin/api/customers => 200 + customers array + total"
else
  fail "GET /admin/api/customers => HTTP $HTTP_CODE" "$BODY"
fi

# Save total count for later SQL injection comparison
TOTAL_ALL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "0")

# 2c. GET /admin/api/customers?q=alex
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customers?q=alex")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"customers"'; then
  pass "GET /admin/api/customers?q=alex => 200 + filtered results"
else
  fail "GET /admin/api/customers?q=alex => HTTP $HTTP_CODE" "$BODY"
fi

# 2d. GET /admin/api/customer/1
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customer/1")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"customer"'; then
  pass "GET /admin/api/customer/1 => 200 + customer detail"
else
  fail "GET /admin/api/customer/1 => HTTP $HTTP_CODE" "$BODY"
fi

# 2e. POST /admin/api/customer/1/award
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/award" \
  -H "Content-Type: application/json" \
  -d '{"points":10,"reason":"test award"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"success":true'; then
  pass "POST /admin/api/customer/1/award +10 => success"
else
  fail "POST /admin/api/customer/1/award => HTTP $HTTP_CODE" "$BODY"
fi

# 2f. POST /admin/api/customer/1/deduct
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/deduct" \
  -H "Content-Type: application/json" \
  -d '{"points":5,"reason":"test deduct"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"success":true'; then
  pass "POST /admin/api/customer/1/deduct -5 => success"
else
  fail "POST /admin/api/customer/1/deduct => HTTP $HTTP_CODE" "$BODY"
fi

# 2g. GET /admin/api/settings
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/settings")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"settings"'; then
  pass "GET /admin/api/settings => 200 + settings"
else
  fail "GET /admin/api/settings => HTTP $HTTP_CODE" "$BODY"
fi

# 2h. GET /admin/api/referrals
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/referrals")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  pass "GET /admin/api/referrals => 200"
else
  fail "GET /admin/api/referrals => HTTP $HTTP_CODE" "$BODY"
fi

echo ""

# ---- 3. JWT Auth ----
echo "--- 3. JWT Auth ---"

# 3a. POST /auth/register
REG_EMAIL="testuser_${UNIQUE}@test.com"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${REG_EMAIL}\",\"password\":\"Test1234!\",\"orgName\":\"Test Org ${UNIQUE}\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"accessToken"' && echo "$BODY" | grep -q '"org"' && echo "$BODY" | grep -q '"project"' && echo "$BODY" | grep -q '"apiKeys"'; then
  pass "POST /auth/register => tokens + user + org + project + apiKeys"
else
  fail "POST /auth/register => HTTP $HTTP_CODE" "$BODY"
fi

# 3b. POST /auth/login with the registered user
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${REG_EMAIL}\",\"password\":\"Test1234!\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"accessToken"' && echo "$BODY" | grep -q '"refreshToken"'; then
  JWT_ACCESS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
  JWT_REFRESH=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)
  pass "POST /auth/login => accessToken + refreshToken"
else
  fail "POST /auth/login => HTTP $HTTP_CODE" "$BODY"
  JWT_ACCESS=""
  JWT_REFRESH=""
fi

# 3c. GET /auth/me with Bearer token
if [ -n "$JWT_ACCESS" ]; then
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
    -H "Authorization: Bearer $JWT_ACCESS")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')

  if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"email"'; then
    pass "GET /auth/me with valid token => 200 + user info"
  else
    fail "GET /auth/me with valid token => HTTP $HTTP_CODE" "$BODY"
  fi
else
  fail "GET /auth/me - skipped (no token from login)"
fi

# 3d. POST /auth/refresh
if [ -n "$JWT_REFRESH" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"${JWT_REFRESH}\"}")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')

  if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"accessToken"'; then
    NEW_ACCESS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
    pass "POST /auth/refresh => new token pair"
  else
    fail "POST /auth/refresh => HTTP $HTTP_CODE" "$BODY"
    NEW_ACCESS=""
  fi
else
  fail "POST /auth/refresh - skipped (no refresh token)"
  NEW_ACCESS=""
fi

# 3e. GET /auth/me with NEW access token
if [ -n "$NEW_ACCESS" ]; then
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
    -H "Authorization: Bearer $NEW_ACCESS")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')

  if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"email"'; then
    pass "GET /auth/me with refreshed token => 200 + user info"
  else
    fail "GET /auth/me with refreshed token => HTTP $HTTP_CODE" "$BODY"
  fi
else
  fail "GET /auth/me with refreshed token - skipped (no new token)"
fi

echo ""

# ---- 4. Admin Auth Guard ----
echo "--- 4. Admin Auth Guard ---"

# 4a. GET /admin/api/stats without cookie
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/api/stats")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  pass "GET /admin/api/stats without cookie => $HTTP_CODE (blocked)"
else
  fail "GET /admin/api/stats without cookie => HTTP $HTTP_CODE (expected 401/403)" "$BODY"
fi

# 4b. GET /admin/api/customers without cookie
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/api/customers")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  pass "GET /admin/api/customers without cookie => $HTTP_CODE (blocked)"
else
  fail "GET /admin/api/customers without cookie => HTTP $HTTP_CODE (expected 401/403)" "$BODY"
fi

echo ""

# ---- 5. Widget/Customer endpoints ----
echo "--- 5. Widget/Customer endpoints ---"

# 5a. POST /api/signup
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"widget_${UNIQUE}@test.com\",\"name\":\"Widget User\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"referral_code"'; then
  pass "POST /api/signup => referral_code + points_balance"
else
  fail "POST /api/signup => HTTP $HTTP_CODE" "$BODY"
fi

# 5b. POST /admin/logout
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE/admin/logout")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"success":true'; then
  pass "POST /admin/logout => success"
else
  fail "POST /admin/logout => HTTP $HTTP_CODE" "$BODY"
fi

# Verify logged out - stats should now fail
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/stats")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  pass "GET /admin/api/stats after logout => $HTTP_CODE (session destroyed)"
else
  fail "GET /admin/api/stats after logout => HTTP $HTTP_CODE (expected 401/403)"
fi

echo ""
echo ""

########################################
# PART 2: AGGRESSIVE SECURITY TESTS
########################################

echo "========== PART 2: SECURITY TESTS =========="
echo ""

# Re-login for security tests that need auth
curl -s -c "$COOKIE_JAR" -X POST "$BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"123456789"}' > /dev/null

# ---- 6. SQL Injection Attempts ----
echo "--- 6. SQL Injection Attempts ---"

# 6a. Classic OR injection in search
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customers?q=%27%20OR%20%271%27%3D%271")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

SQLI_TOTAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "error")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  if [ "$SQLI_TOTAL" = "error" ] || [ "$SQLI_TOTAL" = "0" ]; then
    pass "SQL Injection (' OR '1'='1) => safe (total=$SQLI_TOTAL vs all=$TOTAL_ALL)"
  elif [ "$SQLI_TOTAL" -lt "$TOTAL_ALL" ] 2>/dev/null; then
    pass "SQL Injection (' OR '1'='1) => safe (total=$SQLI_TOTAL vs all=$TOTAL_ALL)"
  elif [ "$SQLI_TOTAL" = "$TOTAL_ALL" ] && [ "$TOTAL_ALL" = "0" ]; then
    pass "SQL Injection (' OR '1'='1) => safe (both 0, no data to leak)"
  else
    fail "SQL Injection (' OR '1'='1) => returned total=$SQLI_TOTAL (same as all=$TOTAL_ALL) - CHECK MANUALLY" "$BODY"
  fi
else
  pass "SQL Injection (' OR '1'='1) => HTTP $HTTP_CODE (query rejected)"
fi

# 6b. DROP TABLE injection
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customers?q=%27%3B%20DROP%20TABLE%20customers%3B--")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

# Verify the database still works by fetching customers
VERIFY=$(curl -s -b "$COOKIE_JAR" "$BASE/admin/api/customers" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "error")

if [ "$VERIFY" != "error" ] && [ "$VERIFY" -ge 0 ] 2>/dev/null; then
  pass "SQL Injection (DROP TABLE) => harmless, DB intact (total=$VERIFY)"
else
  fail "SQL Injection (DROP TABLE) => DB may be damaged!" "$VERIFY"
fi

# 6c. Customer ID injection
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customer/1%20OR%201%3D1")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "500" ]; then
  pass "SQL Injection (customer/1 OR 1=1) => HTTP $HTTP_CODE (rejected)"
else
  # Even 200 is ok if it only returns customer 1 (parseInt parses just "1")
  CUST_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('customer',{}).get('id',''))" 2>/dev/null)
  if [ "$CUST_ID" = "1" ]; then
    pass "SQL Injection (customer/1 OR 1=1) => parseInt safely parsed as 1"
  else
    fail "SQL Injection (customer/1 OR 1=1) => unexpected response" "$BODY"
  fi
fi

# 6d. SQL injection in auth login
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"' OR '1'='1\",\"password\":\"' OR '1'='1\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
  pass "SQL Injection in /auth/login => HTTP $HTTP_CODE (rejected)"
else
  fail "SQL Injection in /auth/login => HTTP $HTTP_CODE" "$BODY"
fi

echo ""

# ---- 7. XSS Injection Attempts ----
echo "--- 7. XSS Injection Attempts ---"

# 7a. XSS in registration
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"xss_${UNIQUE}@test.com\",\"password\":\"Test1234!\",\"orgName\":\"<script>alert('xss')</script>\",\"name\":\"<img onerror=alert(1) src=x>\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]); then
  if echo "$BODY" | grep -q '<script>'; then
    pass "XSS in register => stored as plain text (frontend must escape on render)"
  else
    pass "XSS in register => content was escaped/sanitized"
  fi
elif [ "$HTTP_CODE" = "400" ]; then
  pass "XSS in register => HTTP 400 (input rejected)"
else
  fail "XSS in register => HTTP $HTTP_CODE" "$BODY"
fi

# 7b. XSS in search query
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customers?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"customers"'; then
  pass "XSS in search query => 200, returned safe JSON response"
elif [ "$HTTP_CODE" = "400" ]; then
  pass "XSS in search query => 400 (input rejected)"
else
  fail "XSS in search query => HTTP $HTTP_CODE" "$BODY"
fi

echo ""

# ---- 8. Auth Bypass Attempts ----
echo "--- 8. Auth Bypass Attempts ---"

# 8a. GET /auth/me without token
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  pass "GET /auth/me without token => 401"
else
  fail "GET /auth/me without token => HTTP $HTTP_CODE (expected 401)" "$BODY"
fi

# 8b. GET /auth/me with garbage token
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer invalidtoken123")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  pass "GET /auth/me with invalid token => 401"
else
  fail "GET /auth/me with invalid token => HTTP $HTTP_CODE (expected 401)" "$BODY"
fi

# 8c. GET /auth/me with forged JWT (wrong signature)
FORGED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjk5OTksIm9yZ0lkIjo5OTk5LCJlbWFpbCI6ImhhY2tlckB0ZXN0LmNvbSIsInJvbGUiOiJvd25lciIsImlhdCI6MTcwMDAwMDAwMH0.fakesignaturethatwontwork"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $FORGED_JWT")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  pass "GET /auth/me with forged JWT => 401"
else
  fail "GET /auth/me with forged JWT => HTTP $HTTP_CODE (expected 401)" "$BODY"
fi

# 8d. POST /auth/login with wrong password
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${REG_EMAIL}\",\"password\":\"wrongpassword\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  pass "POST /auth/login with wrong password => 401"
else
  fail "POST /auth/login with wrong password => HTTP $HTTP_CODE (expected 401)" "$BODY"
fi

# 8e. POST /admin/login with wrong password
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpassword"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  pass "POST /admin/login with wrong password => 401"
else
  fail "POST /admin/login with wrong password => HTTP $HTTP_CODE (expected 401)" "$BODY"
fi

echo ""

# ---- 9. Path Traversal ----
echo "--- 9. Path Traversal ---"

# 9a. GET /admin/../../etc/passwd
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/../../etc/passwd")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if echo "$BODY" | grep -q "root:"; then
  fail "Path traversal /admin/../../etc/passwd => LEAKED /etc/passwd!"
else
  pass "Path traversal /admin/../../etc/passwd => safe (HTTP $HTTP_CODE, no file contents)"
fi

# 9b. GET /admin/../.env (URL-encoded)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/..%2F.env")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if echo "$BODY" | grep -q "DATABASE_URL\|JWT_SECRET\|SESSION_SECRET"; then
  fail "Path traversal /admin/../.env => LEAKED .env contents!"
else
  pass "Path traversal /admin/../.env => safe (HTTP $HTTP_CODE, no env contents)"
fi

echo ""

# ---- 10. Rate Limiting ----
echo "--- 10. Rate Limiting (ThrottlerModule: 60 req/min) ---"

RATE_LIMIT_HIT=0
for i in $(seq 1 65); do
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit@test.com","password":"wrong"}' 2>/dev/null)
  HTTP_CODE=$(echo "$RESP" | tail -1)
  if [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMIT_HIT=1
    echo "  Rate limit hit at request #$i"
    break
  fi
done

if [ "$RATE_LIMIT_HIT" = "1" ]; then
  pass "Rate limiting => 429 triggered within 65 requests"
else
  fail "Rate limiting => No 429 after 65 rapid requests"
fi

# Wait for rate limit to cool down
sleep 3

echo ""

# ---- 11. Parameter Tampering ----
echo "--- 11. Parameter Tampering ---"

# Re-login
curl -s -c "$COOKIE_JAR" -X POST "$BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"123456789"}' > /dev/null

# 11a. Negative points
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/award" \
  -H "Content-Type: application/json" \
  -d '{"points":-1000,"reason":"negative test"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
  pass "Award negative points (-1000) => HTTP $HTTP_CODE (rejected by @Min(1) validation)"
else
  fail "Award negative points (-1000) => HTTP $HTTP_CODE (expected 400 from @Min(1))" "$BODY"
fi

# 11b. Extremely large points
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/award" \
  -H "Content-Type: application/json" \
  -d '{"points":999999999,"reason":"overflow test"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]) && echo "$BODY" | grep -q '"success":true'; then
  pass "Award huge points (999999999) => HTTP $HTTP_CODE, accepted (no overflow)"
  # Deduct them back to not pollute data
  curl -s -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/deduct" \
    -H "Content-Type: application/json" \
    -d '{"points":999999999,"reason":"undo overflow test"}' > /dev/null
elif [ "$HTTP_CODE" = "400" ]; then
  pass "Award huge points (999999999) => HTTP 400 (rejected)"
else
  fail "Award huge points (999999999) => HTTP $HTTP_CODE" "$BODY"
fi

# 11c. Non-numeric points
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/admin/api/customer/1/award" \
  -H "Content-Type: application/json" \
  -d '{"points":"not_a_number","reason":"string test"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
  pass "Award non-numeric points => HTTP $HTTP_CODE (rejected)"
else
  fail "Award non-numeric points => HTTP $HTTP_CODE (expected 400)" "$BODY"
fi

# 11d. Non-existent customer
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/admin/api/customer/99999")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "404" ]; then
  pass "GET /admin/api/customer/99999 => 404 (not found)"
else
  fail "GET /admin/api/customer/99999 => HTTP $HTTP_CODE (expected 404)" "$BODY"
fi

echo ""

# ---- 12. Large Payload / DoS Attempts ----
echo "--- 12. Large Payload / DoS Attempts ---"

# 12a. 1MB JSON body
BIG_PAYLOAD=$(python3 -c "import json; print(json.dumps({'email': 'x' * 1000000 + '@test.com', 'password': 'test'}))")
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "$BIG_PAYLOAD" --max-time 10)
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "413" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "429" ]; then
  pass "1MB payload => HTTP $HTTP_CODE (rejected)"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "500" ]; then
  pass "1MB payload => HTTP $HTTP_CODE (handled without crash)"
else
  fail "1MB payload => HTTP $HTTP_CODE" "$(echo "$BODY" | head -c 200)"
fi

# 12b. Extremely long email in registration (5000 chars)
LONG_EMAIL=$(python3 -c "print('a' * 5000 + '@test.com')")
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${LONG_EMAIL}\",\"password\":\"Test1234!\",\"orgName\":\"Long Test\"}" --max-time 10)
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "413" ] || [ "$HTTP_CODE" = "422" ]; then
  pass "5000-char email => HTTP $HTTP_CODE (rejected by @IsEmail)"
else
  fail "5000-char email => HTTP $HTTP_CODE (expected 400 from @IsEmail validation)" "$BODY"
fi

echo ""

# ---- 13. CORS / Headers Check ----
echo "--- 13. CORS / Security Headers ---"

# 13a. Check security headers
HEADERS=$(curl -s -D - -o /dev/null "$BASE/admin/api/session" 2>/dev/null)

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  pass "X-Content-Type-Options header present"
else
  fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-powered-by"; then
  fail "X-Powered-By header present (information leak, should be removed)"
else
  pass "X-Powered-By header not exposed"
fi

# 13b. OPTIONS preflight from evil origin
HEADERS=$(curl -s -D - -o /dev/null -X OPTIONS "$BASE/auth/login" \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" 2>/dev/null)

if echo "$HEADERS" | grep -qi "access-control-allow-origin: https://evil.com"; then
  fail "CORS allows evil.com origin (should be restricted)"
else
  pass "CORS does not allow arbitrary origins (evil.com blocked)"
fi

echo ""

# ---- 14. JWT Token Manipulation ----
echo "--- 14. JWT Token Manipulation ---"

# 14a. Modified payload JWT (changed role to superadmin, invalid signature)
TAMPERED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm9yZ0lkIjoxLCJlbWFpbCI6ImhhY2tlckB0ZXN0LmNvbSIsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzAwMDAwMDAwfQ.invalidsignature"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $TAMPERED_JWT")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "Tampered JWT (role=superadmin, bad sig) => 401"
else
  fail "Tampered JWT (role=superadmin, bad sig) => HTTP $HTTP_CODE (expected 401)"
fi

# 14b. Expired token (exp=1, i.e. 1970)
EXPIRED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm9yZ0lkIjoxLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MX0.invalidsig"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $EXPIRED_JWT")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "Expired JWT (exp=1) => 401"
else
  fail "Expired JWT (exp=1) => HTTP $HTTP_CODE (expected 401)"
fi

# 14c. JWT "none" algorithm attack
NONE_JWT="eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOjEsIm9yZ0lkIjoxLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3MDAwMDAwMDB9."
RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $NONE_JWT")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "JWT 'none' algorithm attack => 401 (rejected)"
else
  fail "JWT 'none' algorithm attack => HTTP $HTTP_CODE (expected 401)"
fi

echo ""
echo ""

########################################
# SUMMARY
########################################

echo "========================================"
echo "  TEST RESULTS SUMMARY"
echo "========================================"
echo ""
echo "  PASSED: $PASS_COUNT"
echo "  FAILED: $FAIL_COUNT"
echo "  TOTAL:  $((PASS_COUNT + FAIL_COUNT))"
echo ""
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "  ALL TESTS PASSED!"
else
  echo "  $FAIL_COUNT test(s) failed. Review output above."
fi
echo ""
echo "========================================"

# Cleanup
rm -f "$COOKIE_JAR"

exit $FAIL_COUNT
