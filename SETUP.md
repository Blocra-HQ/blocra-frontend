# Starklytics Setup Guide

## Architecture Overview

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB
- **Database**: MongoDB Atlas
- **Authentication**: JWT-based

## Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB Atlas account (or local MongoDB)

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env.local
cp backend/.env.example backend/.env
```

### 3. Configure Backend Environment

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
```

### 4. Configure Frontend Environment

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STARKNET_RPC_URL=https://starknet-mainnet.reddio.com/rpc/v0_7
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run start:full

# Or start separately:
# Backend: npm run backend
# Frontend: npm run dev
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'admin' | 'creator' | 'analyst',
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Bounties Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  reward: {
    amount: Number,
    currency: 'USD' | 'EUR' | 'GBP' | 'ETH' | 'BTC' | 'STRK'
  },
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'expired',
  priority: 'low' | 'medium' | 'high' | 'critical',
  category: 'bug' | 'feature' | 'security' | 'documentation' | 'design' | 'research' | 'other',
  tags: [String],
  requirements: [{
    description: String,
    isCompleted: Boolean
  }],
  createdBy: ObjectId,
  assignedTo: ObjectId,
  submissions: [{
    user: ObjectId,
    content: String,
    attachments: [String],
    submittedAt: Date,
    status: 'pending' | 'approved' | 'rejected',
    feedback: String
  }],
  deadline: Date,
  isPublic: Boolean,
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Bounties
- `GET /api/bounties` - Get bounties list
- `POST /api/bounties` - Create bounty (creator/admin)
- `GET /api/bounties/:id` - Get bounty by ID
- `PUT /api/bounties/:id` - Update bounty
- `DELETE /api/bounties/:id` - Delete bounty
- `POST /api/bounties/:id/submit` - Submit solution
- `GET /api/bounties/stats` - Get bounty statistics

## Features Implemented

✅ **Real-time Data**: All data comes from MongoDB
✅ **Authentication**: JWT-based auth system
✅ **Bounty Management**: Full CRUD operations
✅ **User Roles**: Admin, Creator, Analyst roles
✅ **Statistics**: Real bounty and user statistics
✅ **Responsive Design**: Mobile-friendly interface

## Removed Features

❌ **Supabase Integration**: Completely removed
❌ **Demo/Fake Data**: All hardcoded data removed
❌ **OAuth Social Login**: Simplified for now
❌ **AutoSwappr Integration**: Moved to backend-only

## Development Notes

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`
- MongoDB connection required for full functionality
- All authentication uses JWT tokens
- CORS enabled for development

## Production Deployment

1. Set `NODE_ENV=production` in backend
2. Update `VITE_API_URL` to production backend URL
3. Use production MongoDB connection string
4. Implement proper secret management
5. Enable HTTPS and security headers

## Troubleshooting

### Backend Connection Issues
- Check MongoDB connection string
- Verify backend is running on port 5000
- Check CORS configuration

### Frontend API Issues
- Verify `VITE_API_URL` points to backend
- Check browser network tab for API errors
- Ensure JWT token is being sent

### Database Issues
- Verify MongoDB Atlas connection
- Check database permissions
- Ensure collections are created