# BlocRA Routing Guide

## Frontend Routes (React Router)

### Public Routes
- `/auth` - Authentication page (login/signup)
- `/auth/google/callback` - Google OAuth callback
- `/docs` - Documentation page

### Protected Routes (Require Authentication)
- `/` - Main dashboard (Index page)
- `/profile` - User profile
- `/query` - Query Editor (create and save queries)
- `/builder` - Dashboard Builder (use saved queries)
- `/bounties` - Bounties list
- `/bounties/create` - Create new bounty
- `/data-explorer` - Data explorer
- `/queries/new` - New query (redirects to /query)
- `/library` - Library page
- `/library/:type` - Library by type
- `/contract-events-eda` - Contract Events EDA
- `/settings` - User settings
- `/admin` - Admin dashboard (password: Ndifreke000)

### Catch-all
- `*` - 404 Not Found page

## Backend API Routes (Actix-web)

### Base URL
- Development: `http://localhost:5000/api`
- Production: `${VITE_BACKEND_URL}/api`

### Health
- `GET /api/health` - Health check

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/wallet` - Wallet authentication
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/upload-profile-image` - Upload profile image
- `POST /api/auth/logout` - Logout
- `GET /api/auth/oauth/config` - OAuth configuration

### Admin (`/api/admin`)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details
- `GET /api/admin/query-logs` - Get query logs

### Bounties (`/api/bounties`)
- `GET /api/bounties` - List bounties
- `POST /api/bounties` - Create bounty
- `GET /api/bounties/{id}` - Get bounty details
- `PUT /api/bounties/{id}` - Update bounty
- `POST /api/bounties/{id}/join` - Join bounty
- `POST /api/bounties/{id}/submit` - Submit solution
- `POST /api/bounties/{id}/winner` - Select winner
- `GET /api/bounties/stats` - Get bounty statistics

### Contracts (`/api/contracts`)
- `GET /api/contracts` - List contracts
- `POST /api/contracts` - Add contract
- `GET /api/contracts/{address}` - Get contract details
- `GET /api/contracts/{address}/events` - Get contract events

### Dashboard (`/api/dashboards`)
- `GET /api/dashboards/stats` - Get dashboard statistics
- `GET /api/dashboards/stats?chain={chainId}` - Get stats for specific chain

### Query (`/api/query`)
- `POST /api/query/execute` - Execute query
- `GET /api/query/saved` - Get saved queries
- `POST /api/query/save` - Save query
- `GET /api/query/{id}` - Get query by ID
- `DELETE /api/query/{id}` - Delete query

### Feedback (`/api/feedback`)
- `POST /api/feedback/submit` - Submit feedback

### Dashboard Builder (`/api/dashboard-builder`) **NEW**
- `POST /api/dashboard-builder` - Create dashboard
- `GET /api/dashboard-builder` - Get user's dashboards
- `GET /api/dashboard-builder/{id}` - Get dashboard with widgets
- `DELETE /api/dashboard-builder/{id}` - Delete dashboard
- `POST /api/dashboard-builder/{id}/widgets` - Add widget to dashboard
- `PUT /api/dashboard-builder/widgets/{id}` - Update widget position/size
- `DELETE /api/dashboard-builder/widgets/{id}` - Delete widget
- `GET /api/dashboard-builder/queries` - Get saved queries
- `GET /api/dashboard-builder/suggest/{query_id}` - Get AI chart suggestions

## API Client Usage

### Import
```typescript
import { api } from '@/lib/api';
```

### Methods
```typescript
// GET request
const response = await api.get('/dashboard-builder/queries');

// POST request
const response = await api.post('/dashboard-builder', {
  name: 'My Dashboard',
  description: 'Dashboard description'
});

// PUT request
const response = await api.put('/dashboard-builder/widgets/1', {
  position_x: 100,
  position_y: 200
});

// DELETE request
const response = await api.delete('/dashboard-builder/widgets/1');
```

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Or for errors:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Cause**: Backend not running or wrong URL
**Solution**: 
1. Check backend is running: `cargo run` in `backend-rust/`
2. Verify `VITE_BACKEND_URL` in `.env.local`
3. Check browser console for actual URL being called

### Issue: "401 Unauthorized"
**Cause**: Not logged in or token expired
**Solution**:
1. Login again at `/auth`
2. Check `localStorage.getItem('auth_token')`
3. Clear storage and re-login

### Issue: "404 Not Found"
**Cause**: Route doesn't exist or typo in endpoint
**Solution**:
1. Check endpoint spelling
2. Verify route is configured in `backend-rust/src/routes.rs`
3. Check backend logs for incoming requests

### Issue: "CORS Error"
**Cause**: Backend CORS not configured for frontend origin
**Solution**:
1. Check `CORS_ORIGIN` in backend `.env`
2. Should be `*` for development
3. For production, set to your frontend URL

### Issue: Dashboard Builder shows "No saved queries"
**Cause**: User hasn't created any queries yet
**Solution**:
1. Go to `/query` page
2. Write a query
3. Click "Save Query"
4. Return to `/builder`

### Issue: No AI suggestions appearing
**Cause**: User hasn't made 2+ widget selections yet
**Solution**:
1. Add at least 2 widgets to any dashboard
2. AI will start suggesting on 3rd widget
3. Check `widget_preferences` table in database

## Testing Routes

### Test Backend Routes
```bash
# Health check
curl http://localhost:5000/api/health

# Get saved queries (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard-builder/queries

# Get AI suggestions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard-builder/suggest/1
```

### Test Frontend Routes
1. Open browser to `http://localhost:8080`
2. Login at `/auth`
3. Navigate to each route manually
4. Check browser console for errors
5. Check Network tab for API calls

## Environment Variables

### Frontend (`.env.local`)
```
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (`.env`)
```
DATABASE_URL=sqlite:data/blocra.db
HOST=0.0.0.0
PORT=5000
CORS_ORIGIN=*
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

## Route Priority

Routes are matched in order, so more specific routes should come before general ones:

### Frontend (React Router)
```typescript
// Specific routes first
<Route path="/queries/new" element={<QueryEditor />} />
<Route path="/query" element={<QueryEditor />} />

// Catch-all last
<Route path="*" element={<NotFound />} />
```

### Backend (Actix-web)
```rust
// More specific scopes first
.configure(dashboard_builder::configure)  // /api/dashboard-builder
.configure(dashboard::configure)          // /api/dashboards
```

## Debugging Tips

1. **Check Browser Console**: Look for errors, warnings, and network requests
2. **Check Backend Logs**: Run `cargo run` and watch output
3. **Use Browser DevTools**: Network tab shows all API calls
4. **Check Database**: Use `sqlite3 data/blocra.db` to inspect data
5. **Test API Directly**: Use curl or Postman to test endpoints
6. **Clear Cache**: Sometimes old code is cached, hard refresh (Ctrl+Shift+R)

## Quick Reference

### Most Used Routes

**Frontend:**
- Dashboard: `/`
- Query Editor: `/query`
- Dashboard Builder: `/builder`
- Settings: `/settings`

**Backend:**
- Execute Query: `POST /api/query/execute`
- Save Query: `POST /api/query/save`
- Get Saved Queries: `GET /api/dashboard-builder/queries`
- AI Suggestions: `GET /api/dashboard-builder/suggest/{id}`

## Migration Notes

If you're migrating from an older version:
1. Run database migrations: `cargo run` (auto-runs migrations)
2. Clear browser localStorage: `localStorage.clear()`
3. Re-login to get fresh token
4. Create test queries in Query Editor
5. Test Dashboard Builder with saved queries
