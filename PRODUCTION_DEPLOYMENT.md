# Production Deployment Guide

## Overview
- **Frontend**: Deployed on Vercel (blocrahq.vercel.app)
- **Backend**: Deployed on Render (Rust backend)

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Fix Backend Database Issue
The backend is currently failing because it can't create the SQLite database. We've already fixed this in the code.

### 1.2 Set Environment Variables in Render Dashboard

Go to your Render service → Environment tab and add:

```bash
DATABASE_URL=sqlite:/tmp/blocra.db
JWT_SECRET=your_secure_random_string_min_32_chars_here
RUST_LOG=info
PORT=5000
CORS_ORIGIN=https://blocrahq.vercel.app
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 1.3 Trigger Redeploy
After setting environment variables, Render will automatically redeploy. Or manually trigger from the dashboard.

### 1.4 Verify Backend is Running
Once deployed, test the backend:
```bash
curl https://your-backend-name.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"BlocRA Backend is running"}
```

## 🌐 Step 2: Configure Frontend (Vercel)

### 2.1 Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production**:

```bash
VITE_BACKEND_URL=https://your-backend-name.onrender.com
VITE_STARKNET_RPC_URL=https://rpc.starknet.lava.build
```

### 2.2 Redeploy Frontend
After adding environment variables:
1. Go to Deployments tab
2. Click "..." on the latest deployment
3. Click "Redeploy"

OR push a new commit to trigger auto-deployment.

## 📋 Step 3: Verify Production Setup

### 3.1 Test Backend Endpoints
```bash
# Health check
curl https://your-backend-name.onrender.com/api/health

# Dashboard stats
curl https://your-backend-name.onrender.com/api/dashboards/stats

# Contract events (requires auth)
curl -X POST https://your-backend-name.onrender.com/api/contracts/events \
  -H "Content-Type: application/json" \
  -d '{"contractAddress":"0x...", "fromDate":"2024-01-01T00:00:00Z", "toDate":"2024-01-31T23:59:59Z"}'
```

### 3.2 Test Frontend
1. Visit https://blocrahq.vercel.app
2. Check browser console for any errors
3. Try switching chains - should see data loading
4. Go to Contract Events EDA page - should connect to backend

## 🔧 Troubleshooting

### Backend Issues

**Issue: "unable to open database file"**
- ✅ Fixed: We set `DATABASE_URL=sqlite:/tmp/blocra.db`
- Verify environment variable is set in Render

**Issue: "JWT_SECRET must be set"**
- ✅ Fixed: We added default fallback in code
- Still recommended: Set JWT_SECRET in Render environment

**Issue: Backend not responding**
- Check Render logs for errors
- Verify PORT=5000 is set
- Check if service is running (not crashed)

### Frontend Issues

**Issue: "Network error" on Contract Events EDA**
- Verify `VITE_BACKEND_URL` is set in Vercel
- Check backend is actually running
- Verify CORS_ORIGIN includes your Vercel domain

**Issue: Dashboard not loading**
- Check browser console for errors
- Verify backend URL is correct
- Test backend endpoint directly

## 📊 Current Status

### Backend (Render)
- ❌ Currently failing with database error
- ✅ Code fixes applied (need to redeploy)
- ⏳ Waiting for environment variables to be set

### Frontend (Vercel)
- ✅ Deployed successfully
- ⏳ Needs VITE_BACKEND_URL environment variable
- ⏳ Needs redeploy after backend is fixed

## 🎯 Quick Fix Checklist

- [ ] Set `DATABASE_URL=sqlite:/tmp/blocra.db` in Render
- [ ] Set `JWT_SECRET` in Render (generate with `openssl rand -base64 32`)
- [ ] Set `CORS_ORIGIN=https://blocrahq.vercel.app` in Render
- [ ] Redeploy backend on Render
- [ ] Verify backend health endpoint works
- [ ] Set `VITE_BACKEND_URL` in Vercel (use your Render backend URL)
- [ ] Redeploy frontend on Vercel
- [ ] Test the app end-to-end

## 📝 Notes

### Database Persistence
⚠️ **Important**: SQLite on Render uses `/tmp` which is **ephemeral**!
- Data is lost on each deployment/restart
- For production, consider:
  - Render PostgreSQL add-on
  - External database (Supabase, PlanetScale)
  - Persistent disk (Render paid plans)

### Environment Variables
- Frontend env vars must start with `VITE_` to be exposed to the browser
- Backend env vars are server-side only
- Never commit secrets to git

### CORS Configuration
- Backend CORS_ORIGIN should match your frontend domain
- Use `*` only for development
- Production should use exact domain: `https://blocrahq.vercel.app`

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Backend Logs](https://dashboard.render.com/your-service/logs)
- [Frontend Deployment Logs](https://vercel.com/your-project/deployments)
