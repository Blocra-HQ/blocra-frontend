# Starklytics Suite - Comprehensive Codebase Overview

## 📋 Executive Summary

**Starklytics Suite** is a production-ready, enterprise-grade analytics and bounty platform built for the Starknet blockchain ecosystem. It combines real-time blockchain analytics dashboards with an automated bounty management system, powered by AI insights and smart contracts.

**Key Stats:**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js/Express + MongoDB + Supabase
- **Blockchain:** Starknet + Cairo Smart Contracts
- **AI:** GPT-OSS 120B integration
- **Deployment:** Vercel + Edge Functions
- **Status:** Production Ready (99.9% uptime)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                     │
│  ┌────────────────────────────────────��─────────────────┐   │
│  │ Pages: Analytics, Bounties, Dashboard, Query Editor  │   │
│  │ Components: Charts, AI Chat, Wallet Integration      │   │
│  │ Services: Starknet, Bounty, Dashboard, Query         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes: Auth, Bounties, Stats                        │   │
│  │ Controllers: Auth, Bounty, Google Auth, Stats        │   │
│  │ Models: User, Bounty (MongoDB)                       │   │
│  │ Middleware: Auth, Error, Validation, Rate Limit      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services & Blockchain                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Starknet RPC: Real-time blockchain data              │   │
│  │ Cairo Contracts: Bounty smart contracts              │   │
│  │ AutoSwappr: Token deposits/payouts                   │   │
│  │ Supabase: Database & Auth                            │   │
│  │ GPT-OSS: AI-powered insights                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

### Frontend (`/src`)

#### **Pages** (`/src/pages`)
- **Index.tsx** - Main analytics dashboard with real-time Starknet data
- **Analytics.tsx** - Advanced analytics interface
- **Bounties.tsx** - Browse and manage bounties
- **CreateBounty.tsx** - Create new bounties
- **JoinBounty.tsx** - Join existing bounties
- **PlaceBounty.tsx** - Place bounty offers
- **QueryEditor.tsx** - SQL-like query interface for blockchain data
- **DashboardBuilder.tsx** - Drag-and-drop dashboard creation
- **DashboardEdit.tsx** - Edit existing dashboards
- **DashboardPage.tsx** - View saved dashboards
- **PublicDashboard.tsx** - Public dashboard sharing
- **ContractEventsEDA.tsx** - Exploratory data analysis for contract events
- **DataExplorerPage.tsx** - Advanced data exploration
- **Wallet.tsx** - Wallet management and integration
- **Profile.tsx** - User profile management
- **Settings.tsx** - Application settings
- **SystemStatus.tsx** - System health monitoring
- **Auth.tsx** - Authentication page
- **AdminDashboard.tsx** - Admin panel
- **AdminLogin.tsx** - Admin authentication
- **Charts.tsx** - Chart gallery and examples
- **Docs.tsx** - Documentation
- **Library.tsx** - Query/Dashboard library
- **NotFound.tsx** - 404 page

#### **Components** (`/src/components`)

**Layout Components:**
- `layout/AppLayout.tsx` - Main app wrapper
- `layout/Header.tsx` - Top navigation header
- `layout/Sidebar.tsx` - Navigation sidebar
- `layout/AuthenticatedSidebar.tsx` - Authenticated user sidebar

**AI Components:**
- `ai/AIChatBox.tsx` - AI chat interface
- `ai/AIFloatingButton.tsx` - Floating AI button
- `ai/AIDataInterpreter.tsx` - AI data analysis
- `ai/AISuggestions.tsx` - AI-powered suggestions

**Dashboard Components:**
- `dashboard/DashboardEditor.tsx` - Dashboard editing interface
- `dashboard/DashboardWidget.tsx` - Individual dashboard widget
- `dashboard/DraggableWidget.tsx` - Draggable widget wrapper
- `dashboard/ProfessionalDashboardWidget.tsx` - Enhanced widget
- `dashboard/SavedDashboards.tsx` - Saved dashboards list
- `dashboard/StatsOverview.tsx` - Statistics overview
- `dashboard/CreateDashboardModal.tsx` - Create dashboard dialog
- `dashboard/SaveDashboardDialog.tsx` - Save dashboard dialog
- `dashboard/DashboardEmptyState.tsx` - Empty state UI
- `dashboard/DashboardHeader.tsx` - Dashboard header

**Query Components:**
- `query/QueryEditor.tsx` - Query writing interface
- `query/AdvancedQueryEditor.tsx` - Advanced query features
- `query/QueryVisualizer.tsx` - Query result visualization
- `query/ChartBuilder.tsx` - Chart creation from queries
- `query/QuerySuggestions.tsx` - AI query suggestions
- `query/SavedQueries.tsx` - Saved queries list

**Auth Components:**
- `auth/SocialLoginButtons.tsx` - Social login buttons
- `auth/SocialLoginDialog.tsx` - Social login dialog

**Bounty Components:**
- `bounty/BountyDetailsDialog.tsx` - Bounty details modal

**Data Explorer:**
- `data-explorer/DataExplorer.tsx` - Data exploration interface

**UI Components** (`/src/components/ui`)
- Radix UI components: accordion, alert-dialog, avatar, badge, button, calendar, card, carousel, checkbox, collapsible, dialog, dropdown-menu, etc.
- Custom components: Chart, RpcStatus

**Other:**
- `ErrorBoundary.tsx` - Error boundary wrapper
- `ProtectedRoute.tsx` - Route protection component

#### **Contexts** (`/src/contexts`)
- **AuthContext.tsx** - Authentication state management (demo mode + production)
- **ThemeContext.tsx** - Theme management (light/dark mode)

#### **Services** (`/src/services`)
- **StarknetDataService.ts** - Real-time Starknet blockchain data fetching
  - `getDailyActivity()` - Hourly activity metrics
  - `getDiscoveryTransactions()` - Interesting transactions
  - `getNetworkMetrics()` - Network statistics
  - Caching mechanism (5-minute TTL)
  - Fallback data generation

- **BountyService.ts** - Bounty management
  - `getBounties()` - Fetch bounties with filters
  - `createBounty()` - Create new bounty
  - `joinBounty()` - Join bounty
  - `submitSolution()` - Submit solution
  - `selectWinner()` - Select winner
  - `getStats()` - Bounty statistics
  - Demo data fallback

- **DashboardService.ts** - Dashboard management
- **QueryService.ts** - Query management
- **ProfileService.ts** - User profile management
- **NotificationService.ts** - Notification handling
- **AutoSwapprService.ts** - AutoSwappr integration

#### **Hooks** (`/src/hooks`)
- `use-mobile.tsx` - Mobile detection
- `use-toast.ts` - Toast notifications
- `use-wallet.ts` - Wallet integration
- `useCavosWallet.ts` - Cavos wallet integration
- `useLayout.ts` - Layout state
- `useLocalStorage.ts` - Local storage management
- `useQuerySaver.ts` - Query saving
- `useRpcEndpoint.ts` - RPC endpoint management

#### **Utilities** (`/src/utils`)
- `errorHandler.ts` - Error handling utilities
- `validation.ts` - Input validation

#### **Types** (`/src/types`)
- `common.types.ts` - Shared TypeScript types

#### **Lib** (`/src/lib`)
- `api.ts` - API client configuration
- `utils.ts` - Utility functions

#### **Middleware** (`/src/middleware`)
- `rateLimiter.ts` - Client-side rate limiting

#### **Integrations** (`/src/integrations`)
- `autoswappr.ts` - AutoSwappr API integration
- `bounty-contract.ts` - Smart contract interaction

### Backend (`/backend`)

#### **Routes** (`/backend/src/routes`)
- **authRoutes.js** - Authentication endpoints
  - POST `/api/auth/signup` - User registration
  - POST `/api/auth/signin` - User login
  - POST `/api/auth/google` - Google OAuth
  - POST `/api/auth/logout` - Logout

- **bountyRoutes.js** - Bounty endpoints
  - GET `/api/bounties` - List bounties
  - POST `/api/bounties` - Create bounty
  - GET `/api/bounties/:id` - Get bounty details
  - PUT `/api/bounties/:id` - Update bounty
  - POST `/api/bounties/:id/join` - Join bounty
  - POST `/api/bounties/:id/submit` - Submit solution
  - POST `/api/bounties/:id/winner` - Select winner
  - GET `/api/bounties/stats` - Bounty statistics

#### **Controllers** (`/backend/src/controllers`)
- **authController.js** - Authentication logic
  - User registration with validation
  - Password hashing with bcrypt
  - JWT token generation
  - Email verification

- **bountyController.js** - Bounty management logic
  - CRUD operations
  - Submission handling
  - Winner selection

- **googleAuthController.js** - Google OAuth handling
- **statsController.js** - Statistics aggregation

#### **Models** (`/backend/src/models`)

**User.js** - User schema
```javascript
{
  email: String (unique, validated),
  password: String (hashed, optional for OAuth),
  googleId: String (OAuth),
  twitterId: String (OAuth),
  githubId: String (OAuth),
  authProvider: String (local|google|twitter|github),
  role: String (admin|creator|analyst),
  firstName: String,
  lastName: String,
  profilePicture: String (URL),
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  refreshToken: String,
  timestamps: true
}
```

**Bounty.js** - Bounty schema
```javascript
{
  title: String (required, max 200),
  description: String (required, max 2000),
  reward: {
    amount: Number,
    currency: String (USD|EUR|GBP|ETH|BTC|STRK)
  },
  status: String (draft|active|completed|cancelled|expired),
  priority: String (low|medium|high|critical),
  category: String (bug|feature|security|documentation|design|research|other),
  tags: [String],
  requirements: [{
    description: String,
    isCompleted: Boolean
  }],
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  submissions: [{
    user: ObjectId,
    content: String,
    attachments: [String],
    submittedAt: Date,
    status: String (pending|approved|rejected),
    feedback: String
  }],
  deadline: Date,
  isPublic: Boolean,
  views: Number,
  timestamps: true
}
```

#### **Middleware** (`/backend/src/middlewares`)
- **authMiddlewares.js** - JWT verification, role-based access
- **errorMiddleware.js** - Global error handling
- **validateMiddleware.js** - Input validation

#### **Utilities** (`/backend/src/utils`)
- **generateToken.js** - JWT token generation
- **validateEnv.js** - Environment variable validation
- **logger.js** - Winston logging
- **rateLimiter.js** - Express rate limiting
- **googleAuth.js** - Google OAuth utilities
- **githubAuth.js** - GitHub OAuth utilities
- **twitterAuth.js** - Twitter OAuth utilities

#### **Validators** (`/backend/src/validators`)
- **authValidator.js** - Auth input validation (Zod)
- **bountyValidator.js** - Bounty input validation
- **googleAuthValidator.js** - Google auth validation

#### **Config** (`/backend/src/config`)
- **db.js** - MongoDB connection configuration

#### **Main Files**
- **app.js** - Express app setup with middleware
- **server.js** - Server startup

### Smart Contracts (`/contracts`)

#### **Cairo Smart Contract** (`/src/bounty_contract.cairo`)

**Bounty Struct:**
```cairo
pub struct Bounty {
    pub id: u256,
    pub creator: ContractAddress,
    pub title: felt252,
    pub description: felt252,
    pub reward_amount: u256,
    pub deadline: u64,
    pub status: u8,
    pub max_participants: u32,
    pub current_participants: u32,
}
```

**Key Functions:**
- `create_bounty()` - Create new bounty
- `join_bounty()` - Join bounty as participant
- `submit_solution()` - Submit solution hash
- `select_winner()` - Select winner (creator only)
- `get_bounty()` - Retrieve bounty details
- `is_participant()` - Check participation
- `get_winner()` - Get winner address

**Events:**
- `BountyCreated` - Emitted on bounty creation
- `ParticipantJoined` - Emitted when participant joins
- `SolutionSubmitted` - Emitted on solution submission
- `WinnerSelected` - Emitted when winner is selected

**Storage:**
- `bounties: Map<u256, Bounty>` - Bounty storage
- `bounty_count: u256` - Total bounty count
- `participants: Map<(u256, ContractAddress), bool>` - Participation tracking
- `submissions: Map<(u256, ContractAddress), felt252>` - Solution hashes
- `winners: Map<u256, ContractAddress>` - Winner tracking

---

## 🔄 Data Flow

### Authentication Flow
```
User Input (Email/Password)
    ↓
AuthContext.signIn() / signUp()
    ↓
Demo Mode: localStorage storage
Production Mode: API call to /api/auth/signin
    ↓
JWT Token stored in localStorage
    ↓
fetchProfile() retrieves user data
    ↓
User state updated in AuthContext
    ↓
Protected routes accessible
```

### Bounty Creation Flow
```
User fills bounty form
    ↓
BountyService.createBounty()
    ↓
POST /api/bounties with auth token
    ↓
Backend validates input (Zod)
    ↓
MongoDB stores bounty
    ↓
Smart contract creates bounty on-chain
    ↓
AutoSwappr handles token deposit
    ↓
Notification sent to creator
    ↓
Bounty appears in list
```

### Real-Time Analytics Flow
```
Index page loads
    ↓
StarknetDataService.getDailyActivity()
    ↓
Fetch from Starknet RPC endpoints
    ↓
Parse block data
    ↓
Calculate metrics (transactions, gas, users)
    ↓
Cache data (5-minute TTL)
    ↓
Update charts every 2 seconds
    ↓
User sees live Starknet data
```

---

## 🔐 Security Features

### Backend Security
1. **Helmet.js** - HTTP security headers
2. **CORS** - Cross-origin resource sharing control
3. **Rate Limiting** - 100 requests per 15 minutes
4. **Input Sanitization** - MongoDB sanitization + XSS prevention
5. **Password Hashing** - bcryptjs with salt rounds 12
6. **JWT Authentication** - Secure token-based auth
7. **Environment Validation** - Required env vars checked at startup
8. **Error Handling** - Comprehensive error middleware

### Frontend Security
1. **Protected Routes** - ProtectedRoute component
2. **Token Storage** - localStorage with auth_token
3. **Input Validation** - Zod schema validation
4. **XSS Prevention** - React's built-in XSS protection
5. **HTTPS** - Enforced in production

---

## 🚀 Key Features

### 1. Real-Time Analytics Dashboard
- **Live Starknet Data** - Fetches from multiple RPC endpoints
- **Interactive Charts** - Recharts library for visualizations
- **Metrics Tracked:**
  - Transaction volume
  - Gas usage
  - Active users
  - Average fees
  - Top contracts
  - Block metrics
  - Wallet growth
  - Transaction status
  - Failed rate
  - Validator performance

### 2. Bounty Management System
- **Create Bounties** - Define tasks with rewards
- **Join Bounties** - Participate in challenges
- **Submit Solutions** - Upload work for review
- **Select Winners** - Automated payout via smart contracts
- **Role-Based Access** - Creator, Analyst, Admin roles
- **Smart Contract Integration** - On-chain bounty logic

### 3. Dashboard Builder
- **Drag-and-Drop** - React Grid Layout
- **Custom Widgets** - Create personalized dashboards
- **Save/Share** - Public dashboard sharing
- **Real-Time Updates** - Live data refresh

### 4. Query Editor
- **SQL-Like Interface** - Write custom queries
- **AI Suggestions** - GPT-OSS powered recommendations
- **Visualization** - Auto-generate charts
- **Save Queries** - Reuse common queries

### 5. AI Integration
- **GPT-OSS 120B** - Advanced language model
- **Data Interpretation** - Automatic insights
- **Chat Interface** - Interactive AI assistant
- **Query Suggestions** - Smart query recommendations

### 6. Wallet Integration
- **Starknet Wallets** - Argent X, Braavos support
- **Transaction Signing** - Secure contract interactions
- **Balance Display** - Real-time wallet balance

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **React Router** - Navigation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Query** - Data fetching
- **Starknet.js** - Blockchain interaction

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation
- **Winston** - Logging
- **Helmet** - Security headers
- **CORS** - Cross-origin handling

### Blockchain
- **Starknet** - L2 blockchain
- **Cairo** - Smart contract language
- **Scarb** - Cairo package manager
- **Starkli** - CLI tool

### Deployment
- **Vercel** - Frontend hosting
- **Supabase** - Backend services
- **Edge Functions** - Serverless functions

---

## 📊 Database Schema

### Users Collection
```
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String (admin|creator|analyst),
  firstName: String,
  lastName: String,
  profilePicture: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Bounties Collection
```
{
  _id: ObjectId,
  title: String,
  description: String,
  reward: {
    amount: Number,
    currency: String
  },
  status: String,
  priority: String,
  category: String,
  tags: [String],
  requirements: [{
    description: String,
    isCompleted: Boolean
  }],
  createdBy: ObjectId (ref: User),
  submissions: [{
    user: ObjectId,
    content: String,
    status: String,
    submittedAt: Date
  }],
  deadline: Date,
  isPublic: Boolean,
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout

### Bounties
- `GET /api/bounties` - List bounties
- `GET /api/bounties/:id` - Get bounty
- `POST /api/bounties` - Create bounty
- `PUT /api/bounties/:id` - Update bounty
- `POST /api/bounties/:id/join` - Join bounty
- `POST /api/bounties/:id/submit` - Submit solution
- `POST /api/bounties/:id/winner` - Select winner
- `GET /api/bounties/stats` - Get statistics

### Health
- `GET /health` - Health check

---

## 🎯 User Roles

### Admin
- Full system access
- User management
- Bounty moderation
- System configuration

### Creator
- Create bounties
- Manage own bounties
- Select winners
- View analytics

### Analyst
- Browse bounties
- Join bounties
- Submit solutions
- View analytics
- Create dashboards

---

## 📈 Performance Optimizations

1. **Code Splitting** - Lazy loading of pages
2. **Caching** - 5-minute cache for Starknet data
3. **Rate Limiting** - Prevent API abuse
4. **Database Indexes** - Optimized queries
5. **Image Optimization** - WebP format
6. **Bundle Optimization** - Tree shaking, minification
7. **CDN** - Vercel global CDN

---

## 🧪 Testing

### Backend
- Unit tests for validators
- Integration tests for routes
- Contract tests for Cairo

### Frontend
- Component tests
- Integration tests
- E2E tests

---

## 📝 Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
VITE_STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
VITE_BOUNTY_CONTRACT_ADDRESS=0x...
VITE_AUTOSWAPPR_API_URL=https://api.autoswappr.com
VITE_GPT_OSS_ENDPOINT=http://localhost:8000
VITE_CAVOS_CLIENT_ID=...
```

### Backend (.env)
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://...
JWT_SECRET=...
CORS_ORIGIN=https://starklytics-suite.vercel.app
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deployed to Vercel
```

### Backend
```bash
npm run start
# Deployed to Supabase/Vercel
```

### Smart Contracts
```bash
./scripts/deploy-contract.sh
# Deployed to Starknet mainnet
```

---

## 📚 Key Files to Understand

1. **src/App.tsx** - Main app routing and setup
2. **src/pages/Index.tsx** - Analytics dashboard implementation
3. **src/services/StarknetDataService.ts** - Blockchain data fetching
4. **src/services/BountyService.ts** - Bounty management
5. **src/contexts/AuthContext.tsx** - Authentication state
6. **backend/src/app.js** - Express app configuration
7. **backend/src/models/User.js** - User schema
8. **backend/src/models/Bounty.js** - Bounty schema
9. **src/bounty_contract.cairo** - Smart contract logic

---

## 🔄 Development Workflow

### Local Development
```bash
# Install dependencies
npm install
cd backend && npm install

# Start backend
npm run backend

# Start frontend (in another terminal)
npm run dev

# Access at http://localhost:8080
```

### Production Build
```bash
npm run build
# Creates optimized dist/ folder
```

---

## 🎓 Learning Path

1. **Start with** `src/App.tsx` - Understand routing
2. **Then explore** `src/pages/Index.tsx` - Main dashboard
3. **Study** `src/contexts/AuthContext.tsx` - State management
4. **Review** `src/services/StarknetDataService.ts` - Data fetching
5. **Check** `backend/src/app.js` - Backend setup
6. **Examine** `backend/src/models/` - Database schemas
7. **Understand** `src/bounty_contract.cairo` - Smart contracts

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request
5. Follow code style guidelines

---

## 📞 Support

- **Email:** support@starklytics.com
- **Discord:** [Join community](https://discord.gg/starklytics)
- **GitHub Issues:** Report bugs
- **Documentation:** [Full docs](./README-PRODUCTION.md)

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
