# 🧪 Auth Testing Suite

Complete testing suite for BlocRA authentication (login and sign up).

---

## 📦 Test Files

### 1. `test-auth.spec.ts` - Automated Unit Tests
**Framework:** Vitest  
**Purpose:** Automated testing for CI/CD

**Run:**
```bash
npm test test-auth.spec.ts
```

**Tests:**
- Email validation (5 tests)
- Password validation (4 tests)
- Password hashing (2 tests)
- Sign up flow (4 tests)
- Sign in flow (5 tests)
- Input validation (3 tests)
- Multiple users (2 tests)

**Total:** 25 automated tests

---

### 2. `test-auth-manual.js` - Node.js Manual Tests
**Framework:** Node.js (no dependencies)  
**Purpose:** Quick manual testing without browser

**Run:**
```bash
chmod +x test-auth-manual.js
node test-auth-manual.js
```

**Output:**
```
🧪 Running Auth Tests...
============================================================

📧 Email Validation Tests
------------------------------------------------------------
✅ PASS: Valid email: test@example.com
✅ PASS: Valid email with subdomain: user@mail.example.com
...

📊 Test Summary
------------------------------------------------------------
✅ Passed: 25
❌ Failed: 0
📈 Total:  25
🎯 Success Rate: 100.0%

🎉 All tests passed! Auth system is working correctly.
```

---

### 3. `test-auth-browser.html` - Interactive Browser Tests
**Framework:** Vanilla JavaScript  
**Purpose:** Visual testing and manual verification

**Run:**
```bash
# Open in browser
open test-auth-browser.html
# or
firefox test-auth-browser.html
# or
chrome test-auth-browser.html
```

**Features:**
- ✅ Run all automated tests
- ✅ Manual sign up form
- ✅ Manual sign in form
- ✅ View registered users
- ✅ Clear localStorage
- ✅ Visual test results

---

## 🎯 What's Tested

### Email Validation
- ✅ Valid email formats
- ✅ Invalid email formats
- ✅ Edge cases (missing @, missing domain, etc.)

### Password Validation
- ✅ Minimum length (6 characters)
- ✅ Password strength (weak/medium/strong)
- ✅ Special character detection
- ✅ Uppercase/lowercase detection

### Password Hashing
- ✅ Consistent hashing
- ✅ Different passwords produce different hashes
- ✅ Hash collision prevention

### Sign Up Flow
- ✅ Create new user
- ✅ Prevent duplicate email
- ✅ Prevent duplicate name
- ✅ Store correct role (analyst/creator)
- ✅ Input validation
- ✅ Whitespace trimming

### Sign In Flow
- ✅ Sign in with email
- ✅ Sign in with name
- ✅ Reject incorrect password
- ✅ Reject non-existent user
- ✅ Store auth token
- ✅ Store user data

### Multiple Users
- ✅ Handle multiple registrations
- ✅ Find correct user among many
- ✅ Maintain data integrity

---

## 🚀 Quick Start

### Option 1: Automated Tests (Recommended)
```bash
# Install dependencies (if not already installed)
npm install

# Run tests
npm test test-auth.spec.ts
```

### Option 2: Manual Node.js Tests
```bash
# Make executable
chmod +x test-auth-manual.js

# Run
node test-auth-manual.js
```

### Option 3: Browser Tests
```bash
# Open in browser
open test-auth-browser.html
```

---

## 📊 Test Coverage

### Functions Tested
- ✅ `validateEmail()` - 5 tests
- ✅ `validatePassword()` - 4 tests
- ✅ `hashPassword()` - 2 tests
- ✅ Sign up logic - 4 tests
- ✅ Sign in logic - 5 tests
- ✅ Input validation - 3 tests
- ✅ Multi-user handling - 2 tests

### Edge Cases Covered
- ✅ Empty inputs
- ✅ Whitespace handling
- ✅ Duplicate prevention
- ✅ Invalid formats
- ✅ Wrong credentials
- ✅ Non-existent users
- ✅ Multiple users
- ✅ Role assignment

---

## 🧪 Manual Testing Guide

### Test Sign Up
1. Open `test-auth-browser.html`
2. Fill in the Sign Up form:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Role: Analyst
3. Click "Test Sign Up"
4. Should see success message
5. Click "View Registered Users" to verify

### Test Sign In
1. Use credentials from sign up
2. Fill in the Sign In form:
   - Email or Name: test@example.com
   - Password: Test123!
3. Click "Test Sign In"
4. Should see success message
5. Check browser console for stored data

### Test Validation
1. Try invalid email: "invalid"
2. Try short password: "12345"
3. Try duplicate registration
4. Try wrong password
5. All should show appropriate errors

---

## 📝 Test Scenarios

### Scenario 1: New User Registration
```
1. Enter valid email
2. Enter valid name
3. Enter strong password
4. Select role
5. Submit
✅ Expected: Success message, user stored
```

### Scenario 2: Duplicate Prevention
```
1. Register user: test@example.com
2. Try to register same email again
✅ Expected: Error message, registration blocked
```

### Scenario 3: Successful Login
```
1. Register user
2. Sign in with correct credentials
✅ Expected: Success, auth token stored
```

### Scenario 4: Failed Login
```
1. Register user
2. Sign in with wrong password
✅ Expected: Error message, no token stored
```

### Scenario 5: Multiple Users
```
1. Register user1@example.com
2. Register user2@example.com
3. Sign in as user2
✅ Expected: Correct user authenticated
```

---

## 🔍 Debugging

### Check LocalStorage
```javascript
// In browser console
console.log(localStorage.getItem('blocra_users'));
console.log(localStorage.getItem('demo_user'));
console.log(localStorage.getItem('auth_token'));
```

### Clear Data
```javascript
// In browser console
localStorage.clear();
```

### View All Users
```javascript
// In browser console
const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
console.table(users);
```

---

## ✅ Expected Results

### All Tests Pass
```
📊 Test Summary
------------------------------------------------------------
✅ Passed: 25
❌ Failed: 0
📈 Total:  25
🎯 Success Rate: 100.0%

🎉 All tests passed! Auth system is working correctly.
```

### Sign Up Success
```
✅ Account created successfully!

Name: Test User
Email: test@example.com
Role: analyst
Password Strength: strong
```

### Sign In Success
```
✅ Signed in successfully!

Name: Test User
Email: test@example.com
Role: analyst
```

---

## 🐛 Troubleshooting

### Tests Fail
1. Check if localStorage is available
2. Clear localStorage and retry
3. Check browser console for errors
4. Verify test file paths

### Sign Up Fails
1. Check email format
2. Check password length (min 6)
3. Check for duplicate email/name
4. Clear localStorage and retry

### Sign In Fails
1. Verify user is registered
2. Check password is correct
3. Check email/name spelling
4. View registered users to verify

---

## 📚 Additional Resources

### Related Files
- `src/pages/Auth.tsx` - Main auth component
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/lib/api.ts` - API client

### Documentation
- `RESPONSIVE_FIX_COMPLETE.md` - Auth verification
- `ALL_FIXES_SUMMARY.md` - Complete fixes
- `FINAL_STATUS.md` - Current status

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ 100% success rate
- ✅ No console errors
- ✅ Proper data storage
- ✅ Correct validation
- ✅ Secure password hashing

---

**Status:** ✅ All tests passing  
**Coverage:** 25 tests  
**Last Updated:** January 1, 2026
