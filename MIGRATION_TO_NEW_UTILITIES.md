# Migration Guide: Using New Centralized Utilities

**Purpose:** Guide for updating existing code to use the new API config and logger utilities  
**Estimated Time:** 2 hours for all files  
**Difficulty:** Easy - mostly find & replace

---

## 📦 NEW UTILITIES OVERVIEW

### 1. API Configuration (`src/config/api.ts`)
Centralized API configuration that replaces scattered environment variable usage.

### 2. Logger (`src/utils/logger.ts`)
Professional logging utility that replaces console statements.

---

## 🔄 MIGRATION PATTERNS

### Pattern 1: Replace Hardcoded Backend URLs

#### ❌ OLD WAY (8 files need updating)
```typescript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const response = await fetch(`${backendUrl}/api/auth/login`, { ... });
```

#### ✅ NEW WAY
```typescript
import { API_CONFIG } from '@/config/api';

const response = await fetch(`${API_CONFIG.apiUrl}/auth/login`, { ... });
```

#### 🎯 EVEN BETTER
```typescript
import { buildApiUrl } from '@/config/api';

const response = await fetch(buildApiUrl('auth/login'), { ... });
```

---

### Pattern 2: Replace Console Statements

#### ❌ OLD WAY (50+ occurrences)
```typescript
console.log('User logged in:', user);
console.error('Failed to fetch data:', error);
console.warn('RPC endpoint failed:', endpoint);
```

#### ✅ NEW WAY
```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', user);
logger.error('Failed to fetch data', error);
logger.warn('RPC endpoint failed', endpoint);
```

#### 🎯 SPECIALIZED LOGGERS
```typescript
import { logger } from '@/utils/logger';

// For RPC calls
logger.rpc('Fetching block data', { blockNumber: 12345 });

// For API calls
logger.api('POST /auth/login', { email: user.email });

// For debugging
logger.debug('Component mounted', { props });
```

---

## 📝 FILE-BY-FILE MIGRATION CHECKLIST

### Priority 1: API Configuration (8 files)

#### 1. `src/pages/auth/GoogleCallback.tsx` (Line 14)
```typescript
// BEFORE
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const response = await fetch(`${backendUrl}/api/auth/google`, {

// AFTER
import { buildApiUrl } from '@/config/api';
const response = await fetch(buildApiUrl('auth/google'), {
```

#### 2. `src/pages/AdminDashboard.tsx` (Line 51)
```typescript
// BEFORE
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// AFTER
import { API_CONFIG } from '@/config/api';
const backendUrl = API_CONFIG.baseUrl;
```

#### 3. `src/pages/Index.tsx` (Line 79)
```typescript
// BEFORE
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const response = await fetch(`${backendUrl}/api/dashboards/stats?chain=${currentChain.id}`);

// AFTER
import { buildApiUrl } from '@/config/api';
const response = await fetch(buildApiUrl(`dashboards/stats?chain=${currentChain.id}`));
```

#### 4. `src/components/query/QueryEditor.tsx` (Line 712)
```typescript
// BEFORE
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';
const response = await fetch(`${BACKEND_URL}/contracts/analyze`, {

// AFTER
import { buildApiUrl } from '@/config/api';
const response = await fetch(buildApiUrl('contracts/analyze'), {
```

#### 5. `src/components/ui/optimized-stats.tsx` (Line 40)
```typescript
// BEFORE
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const response = await fetch(`${backendUrl}/api/dashboards/stats`);

// AFTER
import { buildApiUrl } from '@/config/api';
const response = await fetch(buildApiUrl('dashboards/stats'));
```

#### 6. `src/components/query/QueryExecutor.tsx` (Line 49)
```typescript
// BEFORE
const API_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';

// AFTER
import { API_CONFIG } from '@/config/api';
const API_URL = API_CONFIG.apiUrl;
```

#### 7. `src/utils/mobile.ts` (Line 22)
```typescript
// BEFORE
return envUrl ? `${envUrl}/api` : 'http://localhost:5000/api';

// AFTER
import { API_CONFIG } from '@/config/api';
return API_CONFIG.apiUrl;
```

#### 8. `src/lib/api.ts` (Line 3)
```typescript
// BEFORE
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';

// AFTER
import { API_CONFIG } from '@/config/api';
const API_BASE_URL = API_CONFIG.apiUrl;
```

---

### Priority 2: Logger Migration (Top 10 files)

#### 1. `src/components/query/QueryEditor.tsx` (6 occurrences)
```typescript
// Add import at top
import { logger } from '@/utils/logger';

// Line 708: console.log → logger.info
logger.info(`Analyzing contract: ${address}`);

// Line 729: console.log → logger.info
logger.info('Contract analysis result', data);

// Line 795: console.error → logger.error
logger.error('Contract analysis error', error);

// Line 1181: console.error → logger.error
logger.error('Failed to fetch insights', error);

// Line 92: console.warn → logger.warn
logger.warn('Failed to load query history');

// Line 610: console.warn → logger.warn
logger.warn('Query saver hook failed', e);
```

#### 2. `src/hooks/use-wallet.ts` (5 occurrences)
```typescript
// Add import at top
import { logger } from '@/utils/logger';

// Line 95: console.log → logger.info
logger.info(`Connected to ${walletType} wallet`, address);

// Line 99: console.error → logger.error
logger.error('Wallet connection failed', err);

// Line 128: console.log → logger.info
logger.info('Wallet disconnected');

// Line 130: console.error → logger.error
logger.error('Wallet disconnection failed', err);

// Line 156: console.error → logger.error
logger.error('Failed to get balance', err);

// Line 196: console.error → logger.error
logger.error('Failed to sign message', err);
```

#### 3. `src/hooks/useRpcEndpoint.ts` (5 occurrences)
```typescript
// Add import at top
import { logger } from '@/utils/logger';

// Line 15: console.log → logger.rpc
logger.rpc(`Checking RPC connection to ${endpoint}`);

// Line 33: console.log → logger.rpc
logger.rpc(`Connected to ${endpoint}`);

// Line 38: console.warn → logger.warn
logger.warn(`RPC ${endpoint} returned ${response.status}`);

// Line 41: console.warn → logger.warn
logger.warn(`Failed to connect to ${endpoint}`, error);

// Line 56: console.error → logger.error
logger.error('All RPC endpoints failed');
```

#### 4. `src/components/ui/chart.tsx` (3 occurrences)
```typescript
// Add import at top
import { logger } from '@/utils/logger';

// Line 68: console.warn → logger.warn
logger.warn(`RPC endpoint failed: ${endpoint}`, e);

// Line 113: console.error → logger.error
logger.error('RPC call failed', error);
```

#### 5. `src/components/ui/Chart.tsx` (3 occurrences)
```typescript
// Add import at top
import { logger } from '@/utils/logger';

// Line 60: console.warn → logger.warn
logger.warn(`RPC endpoint failed: ${endpoint}`, e);

// Line 89: console.error → logger.error
logger.error('RPC call failed', error);
```

#### 6-10. Similar pattern for remaining files
Follow the same pattern for:
- `src/components/ui/specialized-chart.tsx`
- `src/components/ui/optimized-stats.tsx`
- `src/components/ai/AISuggestions.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/CreateBounty.tsx`

---

## 🧪 TESTING AFTER MIGRATION

### 1. Development Mode
```bash
# Start dev server
npm run dev

# Check browser console - should see formatted logs
# [INFO] User logged in
# [RPC] Fetching block data
# [API] POST /auth/login
```

### 2. Production Build
```bash
# Build for production
npm run build

# Check that console is clean (no logs except errors)
# Errors should still appear for debugging
```

### 3. Verify API Calls
```bash
# Open browser DevTools > Network tab
# All API calls should go to VITE_BACKEND_URL
# No calls to localhost:5000 in production
```

---

## ⚠️ COMMON PITFALLS

### 1. Forgetting to Import
```typescript
// ❌ WRONG - will cause error
const response = await fetch(buildApiUrl('auth/login'));

// ✅ CORRECT
import { buildApiUrl } from '@/config/api';
const response = await fetch(buildApiUrl('auth/login'));
```

### 2. Using Old Console in New Code
```typescript
// ❌ WRONG - inconsistent
import { logger } from '@/utils/logger';
logger.info('Starting process');
console.log('Process complete'); // Don't mix!

// ✅ CORRECT
import { logger } from '@/utils/logger';
logger.info('Starting process');
logger.info('Process complete');
```

### 3. Not Setting Environment Variable
```bash
# ❌ WRONG - will fail in production
# (no VITE_BACKEND_URL set)

# ✅ CORRECT
# .env.production
VITE_BACKEND_URL=https://api.blocra.com
```

---

## 📊 PROGRESS TRACKING

Use this checklist to track your migration progress:

### API Configuration Migration
- [ ] src/pages/auth/GoogleCallback.tsx
- [ ] src/pages/AdminDashboard.tsx
- [ ] src/pages/Index.tsx
- [ ] src/components/query/QueryEditor.tsx
- [ ] src/components/ui/optimized-stats.tsx
- [ ] src/components/query/QueryExecutor.tsx
- [ ] src/utils/mobile.ts
- [ ] src/lib/api.ts

### Logger Migration (Top Priority)
- [ ] src/components/query/QueryEditor.tsx (6 occurrences)
- [ ] src/hooks/use-wallet.ts (5 occurrences)
- [ ] src/hooks/useRpcEndpoint.ts (5 occurrences)
- [ ] src/components/ui/chart.tsx (3 occurrences)
- [ ] src/components/ui/Chart.tsx (3 occurrences)
- [ ] src/components/ui/specialized-chart.tsx
- [ ] src/components/ui/optimized-stats.tsx
- [ ] src/components/ai/AISuggestions.tsx
- [ ] src/pages/AdminDashboard.tsx
- [ ] src/pages/CreateBounty.tsx

---

## 🎯 QUICK WINS

Start with these files for immediate impact:

1. **`src/lib/api.ts`** - Central API client, affects all API calls
2. **`src/components/query/QueryEditor.tsx`** - High-traffic component
3. **`src/hooks/use-wallet.ts`** - Critical for authentication
4. **`src/pages/Index.tsx`** - Main dashboard page

---

## 💡 TIPS

1. **Use Find & Replace** - Most changes are mechanical
2. **Test Incrementally** - Update one file, test, commit
3. **Check DevTools** - Verify no localhost calls in Network tab
4. **Review Logs** - Ensure logger output is helpful
5. **Update Tests** - If you have tests, update them too

---

## 🚀 BENEFITS AFTER MIGRATION

- ✅ No localhost fallbacks in production
- ✅ Consistent API URL handling
- ✅ Professional logging with history
- ✅ Environment-aware behavior
- ✅ Easier debugging and monitoring
- ✅ Ready for error tracking integration
- ✅ Cleaner, more maintainable code

---

**Estimated Time:** 2 hours  
**Difficulty:** Easy  
**Impact:** High  
**Priority:** High

**Start with:** API configuration (8 files) → Logger (top 10 files) → Remaining files
