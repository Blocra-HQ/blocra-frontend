# 🚀 Deployment Checklist - Mobile & Auth Fixes

## ⚡ Quick Fix Steps

### 1. Generate JWT Secret (Do this first!)
```bash
openssl rand -base64 32
```
Copy the output (e.g., `xK9mP2vN8qR5tY7wE3aS6dF4gH1jL0zX9cV8bN5mQ2w=`)

---

### 2. Update Render Backend Environment Variables

Go to: **Render Dashboard → Your Backend Service → Environment**

Add/Update these variables:
```
JWT_SECRET = [paste your generated secret from step 1]
CORS_ORIGIN = https://your-frontend-domain.vercel.app
DATABASE_URL = sqlite:/tmp/blocra.db
PORT = 5000
HOST = 0.0.0.0
RUST_LOG = info
```

Click **Save Changes** (Render will auto-redeploy)

---

### 3. Update Vercel Frontend Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add/Update:
```
VITE_BACKEND_URL = https://your-backend-name.onrender.com
```
**IMPORTANT:** No trailing slash! No `/api` at the end!

Then: **Deployments → Redeploy latest**

---

### 4. Test the Fixes

#### On Mobile:
1. Open browser console (if possible) or use desktop browser in mobile mode
2. Navigate to your app
3. Try to sign up with a new account
4. Check if you can see contract data

#### On Desktop:
1. Clear browser cache and localStorage
2. Sign in with the same credentials you used on mobile
3. Should work now! ✅

---

## 🔍 Verify Deployment

### Check Backend Health
```bash
curl https://your-backend-name.onrender.com/api/health
```
Should return: `{"status":"ok"}`

### Check Frontend Environment
Open browser console on your deployed site:
```javascript
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
```
Should show your Render URL, not localhost

### Check JWT Secret is Set
Look at Render logs after deployment:
- ✅ Good: No warnings about JWT_SECRET
- ❌ Bad: "JWT_SECRET not set, using default"

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" on mobile
**Cause:** Mobile can't reach localhost
**Fix:** Make sure VITE_BACKEND_URL in Vercel points to your Render URL

### Issue: "Invalid token" when switching devices
**Cause:** JWT_SECRET not set or different between deployments
**Fix:** Set JWT_SECRET in Render environment variables

### Issue: "Invalid credentials" even with correct password
**Cause:** Old users in database don't have password_hash
**Fix:** Users need to re-register, or run migration to add password_hash column

### Issue: RPC calls timeout on mobile
**Cause:** Mobile networks are slower
**Fix:** Already implemented - 30s timeout with automatic retry

---

## 📱 Local Mobile Development

To test on your phone while developing locally:

1. Find your computer's IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
   Example: `192.168.1.100`

2. Update `.env.local`:
   ```bash
   VITE_BACKEND_URL=http://192.168.1.100:5000
   ```

3. Start backend:
   ```bash
   cd backend-rust
   cargo run
   ```

4. Start frontend:
   ```bash
   npm run dev -- --host
   ```

5. On your phone (same WiFi):
   - Open: `http://192.168.1.100:5173`

---

## ✅ What Was Fixed

1. **Environment Variables**: Standardized to `VITE_BACKEND_URL` everywhere
2. **JWT Secret**: Now properly configured and consistent
3. **Password Hashing**: Added bcrypt for secure password storage
4. **Mobile RPC**: Added timeouts and better error handling
5. **Cross-Device Auth**: Tokens now work across all devices

---

## 🎯 Next Steps After Deployment

1. Test sign up on mobile
2. Test sign in on desktop with mobile credentials
3. Test RPC queries on mobile
4. Monitor Render logs for any errors
5. Set up database backups (Render doesn't auto-backup SQLite)

---

## 📞 Need Help?

Check the logs:
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments → View Function Logs
- **Browser**: F12 → Console tab

Common log messages:
- ✅ "RPC call successful" - Good!
- ❌ "JWT_SECRET not set" - Set it in Render!
- ❌ "All RPC endpoints failed" - Network issue
- ❌ "Invalid credentials" - Password mismatch or not hashed
