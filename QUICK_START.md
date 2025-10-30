# Starklytics Suite - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

---

## 📦 Installation

### 1. Clone & Install
```bash
git clone <repo-url>
cd Starklytics-For-STARKNET

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:3000
VITE_STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
VITE_BOUNTY_CONTRACT_ADDRESS=0x07070d915635269ea0930fa1c538f2d026e02e5078884aeb007141c39f481eee
VITE_AUTOSWAPPR_API_URL=https://api.autoswappr.com
VITE_AUTOSWAPPR_API_KEY=your_api_key_here
```

**Backend (backend/.env)**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/starklytics
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CORS_ORIGIN=http://localhost:8080
VITE_STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
```

### 3. Start Development Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
# Server running on http://localhost:3000
```

**Terminal 2 - Frontend**
```bash
npm run dev
# App running on http://localhost:8080
```

---

## 🧪 Test the Features

### 1. Create Account
- Go to http://localhost:8080/auth
- Sign up with any email/password (demo mode)
- You're logged in!

### 2. Create a Bounty
- Navigate to "Create Bounty"
- Fill in bounty details
- Click "Create Bounty"
- Watch the 3-step process:
  1. Database creation
  2. AutoSwappr deposit
  3. Smart contract registration

### 3. Create a Dashboard
- Go to "Dashboard Builder"
- Add widgets
- Save dashboard
- Dashboard persisted to database!

### 4. Execute Queries
- Go to "Query Editor"
- Try: `SELECT * FROM bounties LIMIT 10`
- See real results from database!

### 5. Admin Panel
- Go to `/admin`
- Login with admin credentials
- View real user/bounty data
- Manage users and bounties

---

## 📊 API Testing

### Test Endpoints with cURL

**Create Dashboard**
```bash
curl -X POST http://localhost:3000/api/dashboards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Dashboard",
    "description": "Test",
    "widgets": [],
    "isPublic": false
  }'
```

**Execute Query**
```bash
curl -X POST http://localhost:3000/api/queries/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM bounties LIMIT 10",
    "limit": 100
  }'
```

**Get Admin Stats**
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔗 Important URLs

| Feature | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| Auth | http://localhost:8080/auth |
| Dashboard Builder | http://localhost:8080/builder |
| Query Editor | http://localhost:8080/query |
| Admin Panel | http://localhost:8080/admin |

---

## 📚 Key Files

### Frontend
- `src/App.tsx` - Main app routing
- `src/pages/CreateBounty.tsx` - Bounty creation
- `src/pages/AdminDashboard.tsx` - Admin panel
- `src/services/` - API services

### Backend
- `backend/src/app.js` - Express app
- `backend/src/routes/` - API endpoints
- `backend/src/models/` - Database schemas
- `backend/src/controllers/` - Business logic

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB connection
# Verify .env file exists
# Check port 3000 is available
lsof -i :3000
```

### Frontend won't connect to backend
```bash
# Check VITE_API_URL in .env.local
# Verify backend is running
# Check CORS configuration
```

### Queries not executing
```bash
# Check MongoDB is running
# Verify RPC endpoint is accessible
# Check query syntax (SELECT only)
```

### Wallet connection fails
```bash
# Install Argent X or Braavos extension
# Check RPC endpoint
# Verify contract address
```

---

## 📖 Documentation

- **Full Overview:** `CODEBASE_OVERVIEW.md`
- **Fixes Applied:** `FIXES_APPLIED.md`
- **Backend API:** `BACKEND_IMPLEMENTATION.md`
- **Complete Summary:** `COMPLETE_IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Heroku/Railway)
```bash
cd backend
npm run build
# Deploy to Heroku/Railway
```

---

## 🎯 Next Steps

1. ✅ Get it running locally
2. ✅ Test all features
3. ✅ Configure production environment
4. ✅ Deploy to production
5. ✅ Monitor and maintain

---

## 💡 Tips

- Use demo credentials to test without real wallet
- Check browser console for errors
- Check backend logs for API issues
- Use Postman for API testing
- Enable browser DevTools for debugging

---

## 🆘 Need Help?

1. Check documentation files
2. Review error messages
3. Check browser console
4. Check backend logs
5. Verify environment variables

---

## ✅ You're Ready!

Everything is set up and ready to go. Start building amazing analytics dashboards on Starknet! 🚀

---

**Happy Coding!** 🎉
