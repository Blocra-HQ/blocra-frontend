# Mobile RPC & Cross-Device Authentication Issues - Root Cause Analysis & Fixes

## 🔴 Critical Issues Identified

### Issue 1: Environment Variable Mismatch
**Problem:** Your frontend uses **THREE DIFFERENT** environment variable names:
- `VITE_API_URL` (in api.ts, QueryExecutor, QueryEditor)
- `VITE_BACKEND_URL` (in AdminDashboard, ContractEventsEDA, .env files)
- Hardcoded fallbacks to `http://localhost:5000` and `http://localhost:5001`

**Impact:**
- Mobile devices can't reach `localhost` - they need the actual deployed backend URL
- Different components use different URLs, causing inconsistent behavior
- Production build uses placeholder URL: `https://your-backend-name.onrender.com`

### Issue 2: JWT Secret Mismatch Between Devices
**Problem:** Your JWT tokens are device-specific because:
1. Backend uses default JWT secret if not configured: `"default_jwt_secret_change_in_production_12345678901234567890"`
2. Each deployment/restart might generate different secrets
3. Tokens signed with one secret can't be verified with another

**Impact:**
- Sign in on mobile → token signed with Secret A
- Try to use on laptop → backend verifies with Secret B → FAILS
- This is why credentials don't work across devices!

### Issue 3: No Password Verification
**Problem:** Login handler has this comment:
```rust
// TODO: Verify password with bcrypt
// For now, just return token
```

**Impact:**
- ANY password works for ANY email
- Security vulnerability
- Inconsistent auth behavior

### Issue 4: Mobile CORS & Network Issues
**Problem:**
- Mobile browsers have stricter CORS policies
- RPC endpoints might be blocked on mobile networks
- No error handling for network failures

---

## ✅ Complete Fix Implementation

### Fix 1: Standardize Environment Variables

#### Step 1: Update `.env.production`
```bash
# Production Environment Variables
VITE_BACKEND_URL=https://blocra-backend.onrender.com
VITE_STARKNET_RPC_URL=https://rpc.starknet.lava.build
```

#### Step 2: Update `.env.local`
```bash
VITE_BACKEND_URL=http://localhost:5000
VITE_STARKNET_RPC_URL=https://rpc.starknet.lava.build
```

#### Step 3: Fix `src/lib/api.ts`
Change line 1 from:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```
To:
```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';
```

#### Step 4: Fix `src/components/query/QueryExecutor.tsx`
Change line 47 from:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```
To:
```typescript
const API_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';
```

#### Step 5: Fix `src/components/query/QueryEditor.tsx`
Change line 699 from:
```typescript
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```
To:
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';
```

#### Step 6: Fix OAuth Callbacks
Update `src/pages/auth/GoogleCallback.tsx` and `GithubCallback.tsx`:
```typescript
const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
```

---

### Fix 2: Configure Production JWT Secret

#### Step 1: Generate Secure JWT Secret
```bash
openssl rand -base64 32
```
Example output: `xK9mP2vN8qR5tY7wE3aS6dF4gH1jL0zX9cV8bN5mQ2w=`

#### Step 2: Set in Render Dashboard
1. Go to your Render backend service
2. Navigate to "Environment" tab
3. Add environment variable:
   - Key: `JWT_SECRET`
   - Value: `xK9mP2vN8qR5tY7wE3aS6dF4gH1jL0zX9cV8bN5mQ2w=` (use your generated value)
4. Click "Save Changes"
5. Render will automatically redeploy

#### Step 3: Update Backend `.env.production`
```bash
JWT_SECRET=xK9mP2vN8qR5tY7wE3aS6dF4gH1jL0zX9cV8bN5mQ2w=
JWT_EXPIRATION=86400
PORT=5000
HOST=0.0.0.0
DATABASE_URL=sqlite:/tmp/blocra.db
CORS_ORIGIN=*
RUST_LOG=info
```

---

### Fix 3: Add Password Hashing (Security Critical)

#### Update `backend-rust/Cargo.toml`
Add bcrypt dependency:
```toml
[dependencies]
bcrypt = "0.15"
```

#### Update `backend-rust/src/handlers/auth.rs`
Add at the top:
```rust
use bcrypt::{hash, verify, DEFAULT_COST};
```

Update the `register` function:
```rust
pub async fn register(
    pool: &DbPool,
    payload: RegisterPayload,
) -> Result<AuthResponse, AppError> {
    // Check if user exists
    let existing: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE email = ?"
    )
    .bind(&payload.email)
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        return Err(AppError::BadRequest("User already exists".to_string()));
    }

    // Hash password if provided
    let password_hash = if let Some(password) = payload.password {
        Some(hash(password, DEFAULT_COST)
            .map_err(|_| AppError::InternalServerError("Failed to hash password".to_string()))?)
    } else {
        None
    };

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, 'user')
         RETURNING *"
    )
    .bind(&payload.email)
    .bind(payload.username)
    .bind(password_hash)
    .fetch_one(pool)
    .await?;

    let token = jwt::create_token(user.id)?;

    Ok(AuthResponse {
        success: true,
        token,
        user: user.into(),
    })
}
```

Update the `login` function:
```rust
pub async fn login(
    pool: &DbPool,
    payload: LoginPayload,
) -> Result<AuthResponse, AppError> {
    let user: User = sqlx::query_as(
        "SELECT * FROM users WHERE email = ?"
    )
    .bind(&payload.email)
    .fetch_one(pool)
    .await
    .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    if let Some(password_hash) = &user.password_hash {
        let valid = verify(&payload.password, password_hash)
            .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;
        
        if !valid {
            return Err(AppError::Unauthorized("Invalid credentials".to_string()));
        }
    } else {
        return Err(AppError::Unauthorized("Password not set for this account".to_string()));
    }

    let token = jwt::create_token(user.id)?;

    Ok(AuthResponse {
        success: true,
        token,
        user: user.into(),
    })
}
```

#### Update User Model
Add `password_hash` field to `backend-rust/src/models/user.rs`:
```rust
pub struct User {
    pub id: i64,
    pub email: Option<String>,
    pub username: Option<String>,
    pub password_hash: Option<String>,  // ADD THIS
    pub wallet_address: Option<String>,
    pub google_id: Option<String>,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}
```

#### Add Migration
Create `backend-rust/migrations/007_add_password_hash.sql`:
```sql
-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;
```

---

### Fix 4: Improve Mobile RPC Handling

#### Update `backend-rust/src/services/rpc.rs`
Add better error handling and mobile-friendly timeouts:

```rust
use reqwest::Client;
use std::time::Duration;

impl RpcService {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))  // Mobile-friendly timeout
                .connect_timeout(Duration::from_secs(10))
                .build()
                .unwrap_or_else(|_| Client::new()),
        }
    }

    pub async fn rpc_call(&self, method: &str, params: Value) -> Result<Value, AppError> {
        let mut last_error = None;
        
        for attempt in 0..RPC_ENDPOINTS.len() {
            let url = self.get_rpc_url();
            
            log::info!("RPC call attempt {} to {}: {}", attempt + 1, url, method);
            
            let request = RpcRequest {
                jsonrpc: "2.0".to_string(),
                method: method.to_string(),
                params: params.clone(),
                id: 1,
            };

            match self.client.post(url)
                .json(&request)
                .send()
                .await
            {
                Ok(response) => {
                    if response.status().is_success() {
                        if let Ok(rpc_response) = response.json::<RpcResponse>().await {
                            if let Some(result) = rpc_response.result {
                                log::info!("RPC call successful on attempt {}", attempt + 1);
                                return Ok(result);
                            }
                            if let Some(error) = rpc_response.error {
                                log::warn!("RPC error: {} - {}", error.code, error.message);
                                last_error = Some(format!("RPC error: {}", error.message));
                            }
                        }
                    } else {
                        log::warn!("RPC HTTP error: {}", response.status());
                        last_error = Some(format!("HTTP {}", response.status()));
                    }
                }
                Err(e) => {
                    log::warn!("RPC request failed: {}", e);
                    last_error = Some(e.to_string());
                    self.switch_rpc();
                    continue;
                }
            }
            
            self.switch_rpc();
        }

        Err(AppError::BadRequest(
            last_error.unwrap_or_else(|| "All RPC endpoints failed".to_string())
        ))
    }
}
```

---

### Fix 5: Add Mobile Detection & Fallback

#### Create `src/utils/mobile.ts`
```typescript
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  // In production, always use the env URL
  if (import.meta.env.PROD && envUrl) {
    return `${envUrl}/api`;
  }
  
  // In development on mobile, warn about localhost
  if (isMobile() && envUrl?.includes('localhost')) {
    console.warn('⚠️ Mobile device detected with localhost URL. This will not work!');
    console.warn('Please set VITE_BACKEND_URL to your computer\'s IP address');
    console.warn('Example: VITE_BACKEND_URL=http://192.168.1.100:5000');
  }
  
  return envUrl ? `${envUrl}/api` : 'http://localhost:5000/api';
};
```

#### Update `src/lib/api.ts`
```typescript
import { getApiUrl } from '@/utils/mobile';

const API_BASE_URL = getApiUrl();
```

---

## 🚀 Deployment Steps

### 1. Update Frontend Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update/Add:
   ```
   VITE_BACKEND_URL = https://your-actual-backend.onrender.com
   ```
3. Redeploy frontend

### 2. Update Backend Environment Variables in Render

1. Go to Render Dashboard → Your Backend Service → Environment
2. Add/Update:
   ```
   JWT_SECRET = [your-generated-secret]
   CORS_ORIGIN = https://your-frontend.vercel.app
   DATABASE_URL = sqlite:/tmp/blocra.db
   PORT = 5000
   ```
3. Save (auto-redeploys)

### 3. Test Cross-Device Authentication

1. Clear all browser data on both devices
2. Sign up on mobile with new account
3. Note the email/password
4. Try logging in on laptop with same credentials
5. Should work now! ✅

---

## 🧪 Testing Checklist

- [ ] Mobile can reach backend API (not localhost)
- [ ] Sign up on mobile works
- [ ] Sign in on mobile works
- [ ] Sign in on laptop with mobile credentials works
- [ ] RPC calls work on mobile
- [ ] Contract queries work on mobile
- [ ] Event fetching works on mobile
- [ ] Token persists across page refreshes
- [ ] Logout works on both devices

---

## 🔍 Debugging Tips

### Check if mobile can reach backend:
```javascript
// Run in mobile browser console
fetch('https://your-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Check JWT token:
```javascript
// Run in browser console
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Decode JWT (without verification)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
console.log('Expires:', new Date(payload.exp * 1000));
```

### Check environment variables:
```javascript
// Run in browser console
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Prod:', import.meta.env.PROD);
```

---

## 📱 Mobile Development Tips

### For local development on mobile:

1. Find your computer's local IP:
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. Update `.env.local`:
   ```bash
   VITE_BACKEND_URL=http://192.168.1.100:5000
   ```

3. Make sure your phone is on the same WiFi network

4. Access from mobile: `http://192.168.1.100:5173`

---

## 🎯 Summary

The root causes were:
1. **Inconsistent environment variable names** → Mobile couldn't find backend
2. **Missing/inconsistent JWT secret** → Tokens didn't work across devices
3. **No password verification** → Security issue
4. **Poor mobile error handling** → Silent failures

After these fixes:
- ✅ Mobile will connect to the correct backend
- ✅ Tokens will work across all devices
- ✅ Passwords will be properly verified
- ✅ Better error messages for debugging
