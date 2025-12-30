# 🚀 Quick Access Guide

## 🔐 Admin Access

### Credentials
- **Username**: `Ndifreke`
- **Password**: `Ndifreke`

### URLs

#### 🏠 Local Development
- **Main Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Settings**: http://localhost:3000/settings
- **Contract EDA**: http://localhost:3000/contract-events-eda

#### 🌐 Production (Vercel)
- **Main Site**: https://blocrahq.vercel.app
- **Admin Login**: https://blocrahq.vercel.app/admin
- **Admin Dashboard**: https://blocrahq.vercel.app/admin/dashboard
- **Settings**: https://blocrahq.vercel.app/settings
- **Contract EDA**: https://blocrahq.vercel.app/contract-events-eda

## 🎯 Quick Start

### 1. Start Backend (Local)
```bash
cd backend-rust
cargo run --release
```
Backend runs on: http://localhost:5000

### 2. Start Frontend (Local)
```bash
cd BlocRA-HQ
npm run dev
```
Frontend runs on: http://localhost:3000

### 3. Access Admin Dashboard
1. Go to http://localhost:3000/admin
2. Login with: `Ndifreke` / `Ndifreke`
3. View all users and stats

## 📊 What's Working

✅ **Frontend**
- Contract Events EDA with unlimited mode (block 0 to latest)
- Real wallet addresses displayed (no fake data)
- Admin dashboard with user list
- Settings page
- Consistent UI with Header component

✅ **Backend (Rust)**
- User authentication (email, wallet, Google)
- Contract events fetching with pagination
- Admin endpoints for user management
- Database persistence (SQLite)
- All migrations applied

✅ **Features**
- Sign up / Sign in (email or wallet)
- Contract analysis from block 0 to latest
- User persistence in database
- Admin dashboard with real user data
- No placeholder/fake data

## 🔧 Testing

### Test Contract Events
```bash
curl -X POST http://localhost:5000/api/contracts/events \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x067a27274b63fa3b070cabf7adf59e7b1c1e5b768b18f84b50f6cb85f59c42e5",
    "chain": "Starknet"
  }' | jq '.data.totalEvents'
```

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "testuser"}' | jq
```

### Test Admin Users List
```bash
curl http://localhost:5000/api/admin/users | jq
```

## 📝 Recent Changes

1. ✅ Fixed Contract EDA to use only real RPC data
2. ✅ Removed placeholder wallet names
3. ✅ Added full wallet addresses to Most Active Wallets
4. ✅ Fixed database file creation for Render deployment
5. ✅ Disabled subscription tables (not needed yet)
6. ✅ Updated admin credentials to Ndifreke/Ndifreke
7. ✅ Added Header component to Admin Dashboard
8. ✅ Removed /tmp warning for local development

## 🚨 Important Notes

⚠️ **Database on Render**: Uses `/tmp` which is ephemeral. Data is lost on restart. For production, use PostgreSQL or persistent disk.

⚠️ **Admin Security**: Credentials are hardcoded in frontend. For production, implement proper backend authentication.

⚠️ **Backend URL**: Make sure `VITE_BACKEND_URL` is set correctly in production environment variables on Vercel.

## 📚 Documentation

- [ADMIN_DASHBOARD_GUIDE.md](./ADMIN_DASHBOARD_GUIDE.md) - Complete admin guide
- [UNLIMITED_MODE.md](./UNLIMITED_MODE.md) - Contract events unlimited mode
- [RENDER_DEPLOYMENT.md](./backend-rust/RENDER_DEPLOYMENT.md) - Backend deployment guide
