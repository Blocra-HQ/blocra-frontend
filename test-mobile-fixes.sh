#!/bin/bash

# Test script to verify mobile and auth fixes
# Run this after deploying to verify everything works

set -e

echo "🧪 Testing Mobile & Auth Fixes"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get backend URL from user
read -p "Enter your backend URL (e.g., https://your-backend.onrender.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend URL is required${NC}"
    exit 1
fi

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

echo ""
echo "Testing backend: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    exit 1
fi

echo ""

# Test 2: OAuth Config
echo "2️⃣  Testing OAuth config endpoint..."
OAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/auth/oauth/config" || echo "000")
HTTP_CODE=$(echo "$OAUTH_RESPONSE" | tail -n1)
BODY=$(echo "$OAUTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OAuth config endpoint accessible${NC}"
    echo "   Response: $BODY"
else
    echo -e "${YELLOW}⚠️  OAuth config endpoint returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi

echo ""

# Test 3: Register new user
echo "3️⃣  Testing user registration..."
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"testuser\"}" || echo "000")
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token received: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ User registration failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    exit 1
fi

echo ""

# Test 4: Login with created user
echo "4️⃣  Testing user login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" || echo "000")
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User login successful${NC}"
    NEW_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   New token received: ${NEW_TOKEN:0:20}..."
else
    echo -e "${RED}❌ User login failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    exit 1
fi

echo ""

# Test 5: Test wrong password
echo "5️⃣  Testing password validation..."
WRONG_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" || echo "000")
HTTP_CODE=$(echo "$WRONG_LOGIN" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Password validation working (rejected wrong password)${NC}"
else
    echo -e "${RED}❌ Password validation not working (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# Test 6: Test authenticated endpoint
echo "6️⃣  Testing authenticated endpoint..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" || echo "000")
HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
BODY=$(echo "$ME_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Authenticated endpoint working${NC}"
    echo "   Response: $BODY"
else
    echo -e "${YELLOW}⚠️  Authenticated endpoint returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi

echo ""

# Test 7: Test RPC endpoint
echo "7️⃣  Testing RPC endpoint..."
RPC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/contracts/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"contract_address\":\"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7\"}" || echo "000")
HTTP_CODE=$(echo "$RPC_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ RPC endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  RPC endpoint returned HTTP $HTTP_CODE${NC}"
    echo "   This might be expected if the contract address is invalid"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 All critical tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update VITE_BACKEND_URL in Vercel to: $BACKEND_URL"
echo "2. Test on mobile device"
echo "3. Test cross-device authentication"
echo ""
echo "Debug commands for browser console:"
echo "  - runAllDiagnostics()"
echo "  - debugBackendConnection()"
echo "  - debugAuth()"
