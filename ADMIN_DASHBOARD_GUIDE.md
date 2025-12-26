# Admin Dashboard Access Guide

## 🔐 Admin Credentials

**Username:** `Ndifreke`  
**Password:** `Ndifreke`

## 🌐 Access URLs

### Local Development
1. **Admin Login**: http://localhost:3000/admin
2. **Admin Dashboard**: http://localhost:3000/admin/dashboard (requires login)
3. **Settings**: http://localhost:3000/settings

### Production (Vercel)
1. **Admin Login**: https://blocrahq.vercel.app/admin
2. **Admin Dashboard**: https://blocrahq.vercel.app/admin/dashboard (requires login)
3. **Settings**: https://blocrahq.vercel.app/settings

## 📋 How to Access

### Step 1: Navigate to Admin Login
Go to `/admin` on either localhost or production URL

### Step 2: Enter Credentials
- **Username**: Ndifreke
- **Password**: Ndifreke

### Step 3: Access Dashboard
After successful login, you'll be redirected to `/admin/dashboard`

⚠️ **Note**: You cannot bypass login by going directly to `/admin/dashboard`. The app checks for admin session in localStorage.

## 🎨 UI Updates

All pages now have consistent UI with the Header component:
- ✅ **Admin Dashboard**: Has Header with title "Admin Dashboard"
- ✅ **Settings Page**: Has Header with title "Settings"
- ✅ **Index Page**: Has Header with title "BlocRA HQ"

## 📊 Dashboard Features

### 📊 Dashboard Overview
- **Total Users**: See count of all registered users
- **Daily/Weekly/Monthly Active Users**: Track user engagement
- **Total Analyses**: Number of contract analyses performed
- **Total Reports**: Reports generated
- **Total Dashboards**: Custom dashboards created
- **Total Downloads**: Files downloaded

### 👥 Registered Users Table
Shows all users with:
- **ID**: User database ID
- **Email**: User email address
- **Username**: Display name
- **Wallet Address**: Connected Starknet wallet (truncated for display)
- **Role**: User role (user/admin)
- **Created At**: Registration timestamp

### 📈 Activity Monitoring
- Recent user activities
- Filter by user or action type
- Real-time activity tracking

## 🔧 API Endpoints Used

### Get All Users
```bash
GET http://localhost:5000/api/admin/users
```

Response:
```json
[
  {
    "id": 1,
    "wallet_address": "0x...",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "created_at": "2025-12-26T12:47:10Z",
    "updated_at": "2025-12-26T12:47:10Z"
  }
]
```

### Get Admin Stats
```bash
GET http://localhost:5000/api/admin/stats
```

Response:
```json
{
  "users": 4,
  "bounties": 0,
  "submissions": 0
}
```

## 🧪 Testing the Admin Dashboard

### 1. Start Backend
```bash
cd backend-rust
cargo run --release
```

### 2. Start Frontend
```bash
cd BlocRA-HQ
npm run dev
```

### 3. Login as Admin
1. Go to http://localhost:3000/admin
2. Enter username: `Ndifreke`
3. Enter password: `Ndifreke`
4. Click "Access Admin Panel"

### 4. View Users
Once logged in, you'll see all registered users in the dashboard.

## 🚀 Production Deployment

### Environment Variables
Make sure `VITE_BACKEND_URL` is set in your frontend environment:

```bash
# .env.production
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Vercel Deployment
The app is already deployed at: https://blocrahq.vercel.app

To access admin:
1. Go to https://blocrahq.vercel.app/admin
2. Login with credentials above
3. Access dashboard at https://blocrahq.vercel.app/admin/dashboard

## 🔒 Security Considerations

⚠️ **Current Implementation**:
- Admin credentials are hardcoded in `src/pages/AdminLogin.tsx`
- Session stored in localStorage
- No backend authentication for admin endpoints

⚠️ **For Production, you should**:
1. Move credentials to environment variables
2. Add backend admin authentication middleware
3. Require admin role to access `/api/admin/*` endpoints
4. Implement proper session management with JWT
5. Add rate limiting for admin endpoints
6. Use HTTPS only
7. Add 2FA for admin accounts

## 📝 Changing Admin Credentials

To change admin credentials, edit `src/pages/AdminLogin.tsx`:

```typescript
const ADMIN_CREDENTIALS = {
  username: "YourNewUsername",
  password: "YourNewPassword"
};
```

Then rebuild:
```bash
npm run build
```

## 🆘 Troubleshooting

### Can't Access Admin Dashboard
- Make sure you logged in at `/admin` first
- Check browser console for errors
- Verify localStorage has `adminSession` key

### Users Not Showing
- Ensure backend is running
- Check `VITE_BACKEND_URL` environment variable
- Verify backend endpoint: `curl http://localhost:5000/api/admin/users`

### Login Not Working
- Verify credentials: username `Ndifreke`, password `Ndifreke`
- Check browser console for errors
- Clear localStorage and try again

## 🎯 Future Enhancements

- [ ] Backend admin authentication
- [ ] User management (edit, delete, ban)
- [ ] Role management
- [ ] Activity logs export
- [ ] User analytics and insights
- [ ] Email notifications
- [ ] Bulk operations
- [ ] 2FA for admin accounts
