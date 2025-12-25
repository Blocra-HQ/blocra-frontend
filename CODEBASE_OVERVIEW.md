# Codebase Overview

Complete technical documentation of the BlocRA platform architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + TypeScript + Vite + TailwindCSS + Recharts        │
│  Port: 8080                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    Rust Backend                              │
│  Actix-web + SQLite + SQLx + JWT                            │
│  Port: 5000                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ RPC Calls
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Starknet Blockchain                         │
│  Cairo Smart Contracts + RPC Endpoints                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend (React + TypeScript)

### Structure
```
src/
├── components/          # Reusable UI components
│   ├── ai/             # AI chat components
│   ├── bounty/         # Bounty-related components
│   ├── layout/         # Header, sidebar, footer
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (Auth, Chain, Theme)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── pages/              # Route pages
│   ├── Index.tsx       # Dashboard with 13 charts
│   ├── Bounties.tsx    # Bounty management
│   ├── Admin.tsx       # Admin panel
│   └── ...
├── services/           # API service layer
└── types/              # TypeScript type definitions
```

### Key Features
- **Dashboard:** 13 real-time charts showing blockchain metrics
- **Authentication:** Multi-wallet support (Argent, Braavos, Metamask)
- **Bounty System:** Create, manage, and participate in bounties
- **Admin Panel:** User management, bounty approval, analytics
- **Dark Mode:** Full theme support
- **Responsive:** Mobile, tablet, desktop layouts

### State Management
- React Context API for global state
- Local state with useState/useReducer
- Real-time updates every 30 seconds

### API Integration
```typescript
// Example: Fetch dashboard stats
const response = await fetch('http://localhost:5000/api/dashboards/stats');
const data = await response.json();
// Returns: { block_number, timestamp, stats: {...}, block_info: {...} }
```

---

## 2. Backend (Rust + Actix-web)

### Structure
```
backend-rust/
├── src/
│   ├── main.rs              # Entry point, server setup
│   ├── config.rs            # Environment configuration
│   ├── db.rs                # Database connection & migrations
│   ├── errors.rs            # Custom error types
│   ├── handlers/            # Request handlers (controllers)
│   │   ├── auth.rs          # Authentication endpoints
│   │   ├── bounty.rs        # Bounty CRUD operations
│   │   ├── admin.rs         # Admin operations
│   │   ├── contract.rs      # Contract queries
│   │   ├── dashboard.rs     # Analytics & stats
│   │   └── query.rs         # Custom queries
│   ├── middleware/          # Custom middleware
│   │   └── rate_limit.rs    # Rate limiting
│   ├── models/              # Data structures
│   │   ├── user.rs
│   │   ├── bounty.rs
│   │   ├── submission.rs
│   │   └── ...
│   ├── routes/              # Route configuration
│   ├── services/            # Business logic
│   │   └── rpc.rs           # Starknet RPC service
│   └── utils/               # Utilities
│       └── jwt.rs           # JWT token handling
├── migrations/              # SQL migration files
│   ├── 001_create_users.sql
│   ├── 002_create_bounties.sql
│   └── ...
├── Cargo.toml              # Rust dependencies
└── .env                    # Environment variables
```

### Database Schema (SQLite)

#### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    wallet_address TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Bounties Table
```sql
CREATE TABLE bounties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward_amount REAL NOT NULL,
    status TEXT DEFAULT 'open',
    difficulty TEXT,
    category TEXT,
    created_by TEXT NOT NULL,
    deadline DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### Other Tables
- `bounty_participants` - Track bounty participation
- `submissions` - Bounty submissions
- `rewards` - Reward distribution
- `contract_queries` - Saved contract queries

### API Endpoints (42 Total)

#### Authentication (8 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/wallet` - Wallet authentication
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

#### Bounties (12 endpoints)
- `GET /api/bounties` - List all bounties
- `POST /api/bounties` - Create bounty
- `GET /api/bounties/:id` - Get bounty details
- `PUT /api/bounties/:id` - Update bounty
- `DELETE /api/bounties/:id` - Delete bounty
- `POST /api/bounties/:id/join` - Join bounty
- `POST /api/bounties/:id/submit` - Submit work
- `GET /api/bounties/:id/submissions` - List submissions
- `PUT /api/bounties/:id/submissions/:sid` - Review submission
- `GET /api/bounties/user/:userId` - User's bounties
- `GET /api/bounties/stats` - Bounty statistics
- `POST /api/bounties/:id/reward` - Distribute reward

#### Admin (6 endpoints)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/bounties` - All bounties (admin view)
- `PUT /api/admin/bounties/:id/approve` - Approve bounty
- `GET /api/admin/stats` - Platform statistics

#### Contracts (8 endpoints)
- `POST /api/contracts/events` - Get contract events
- `POST /api/contracts/analyze` - Analyze contract
- `POST /api/contracts/balance` - Get token balance
- `POST /api/contracts/transactions` - Get transactions
- `GET /api/contracts/queries` - Saved queries
- `POST /api/contracts/queries` - Save query
- `DELETE /api/contracts/queries/:id` - Delete query
- `GET /api/contracts/popular` - Popular contracts

#### Dashboard (3 endpoints)
- `GET /api/dashboards` - User dashboard data
- `GET /api/dashboards/analytics` - Platform analytics
- `GET /api/dashboards/stats` - Blockchain stats (optimized)

#### Queries (4 endpoints)
- `GET /api/queries` - List saved queries
- `POST /api/queries` - Create query
- `GET /api/queries/:id` - Get query
- `DELETE /api/queries/:id` - Delete query

#### Health (1 endpoint)
- `GET /health` - Health check

### RPC Service (Starknet Integration)

```rust
// Multi-endpoint failover system
const RPC_ENDPOINTS: &[&str] = &[
    "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
    "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/...",
    "https://starknet-mainnet.blastapi.io/...",
    "https://free-rpc.nethermind.io/mainnet-juno/v0_7",
];
```

**Features:**
- Automatic failover if endpoint fails
- Block fetching with transaction details
- Event filtering and decoding
- Contract analysis
- Transaction status tracking

### Performance Metrics
- **Response Time:** 1-5ms average
- **Throughput:** 15,000+ req/sec
- **Memory:** ~30MB
- **Startup:** <200ms
- **Database:** SQLite (ACID compliant)

---

## 3. Smart Contracts (Cairo/Starknet)

### Contract Structure
```
contracts/
├── src/
│   └── lib.cairo           # Main contract logic
├── Scarb.toml              # Cairo dependencies
└── Scarb.lock              # Lock file
```

### Contract Features
- Token management
- Bounty escrow
- Reward distribution
- Access control
- Event emission

### Deployment
- Network: Starknet Mainnet
- Compiler: Cairo 2.x
- Build tool: Scarb

---

## 4. Data Flow

### Dashboard Stats Flow
```
1. Frontend requests stats every 30s
   ↓
2. Backend fetches latest block from RPC
   ↓
3. Backend calculates all metrics from ONE block:
   - Total transactions
   - Gas used
   - Unique senders
   - Transaction status (success/failed/pending)
   - Volume, TVL, fees
   ↓
4. Backend returns JSON response
   ↓
5. Frontend updates 13 charts with new data
   ↓
6. Historical data accumulated (last 20 blocks)
```

### Authentication Flow
```
1. User connects wallet (Argent/Braavos)
   ↓
2. Frontend sends wallet address to backend
   ↓
3. Backend checks if user exists in database
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores token in localStorage
   ↓
6. All subsequent requests include JWT in Authorization header
```

### Bounty Creation Flow
```
1. User fills bounty form
   ↓
2. Frontend validates input
   ↓
3. POST /api/bounties with JWT token
   ↓
4. Backend verifies JWT
   ↓
5. Backend inserts into SQLite database
   ↓
6. Backend returns created bounty
   ↓
7. Frontend updates UI
```

---

## 5. Security

### Backend Security
- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcrypt with salt
- **Rate Limiting:** 1000 requests per 15 minutes
- **SQL Injection:** Prevented by SQLx prepared statements
- **CORS:** Configurable origin whitelist
- **Memory Safety:** Rust's compile-time guarantees

### Frontend Security
- **XSS Prevention:** React's built-in escaping
- **HTTPS Only:** Production deployment
- **Token Storage:** Secure localStorage
- **Input Validation:** Client-side validation
- **CSRF Protection:** Token-based requests

---

## 6. Performance Optimizations

### Backend
- **Async/Await:** Non-blocking I/O
- **Connection Pooling:** Reuse database connections
- **Compiled Binary:** No runtime overhead
- **Zero-Copy:** Efficient data handling
- **Multi-threading:** Actix-web workers

### Frontend
- **Code Splitting:** Lazy loading routes
- **Memoization:** React.memo, useMemo
- **Debouncing:** API call optimization
- **Virtual Scrolling:** Large lists
- **Image Optimization:** Lazy loading

### Database
- **Indexes:** On frequently queried columns
- **Prepared Statements:** Query plan caching
- **Transactions:** Batch operations
- **WAL Mode:** Better concurrency

---

## 7. Testing

### Backend Tests
```bash
cd backend-rust
cargo test
```

### Frontend Tests
```bash
npm run test
```

### Integration Tests
```bash
# Test all API endpoints
cd backend-rust
./test-api.sh
```

---

## 8. Deployment Architecture

### Production Setup
```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
│         SSL/TLS Termination             │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ↓                ↓
┌─────────────┐  ┌─────────────┐
│  Frontend   │  │   Backend   │
│  (Static)   │  │   (Rust)    │
│  Port 80    │  │  Port 5000  │
└─────────────┘  └──────┬──────┘
                        │
                        ↓
                 ┌─────────────┐
                 │   SQLite    │
                 │  Database   │
                 └─────────────┘
```

### Scaling Strategy
- **Horizontal:** Multiple backend instances behind load balancer
- **Vertical:** Increase server resources
- **Database:** Consider PostgreSQL for multi-writer scenarios
- **Caching:** Redis for session storage
- **CDN:** Static asset delivery

---

## 9. Monitoring

### Metrics to Track
- Response times (p50, p95, p99)
- Error rates
- Request throughput
- Database query performance
- Memory usage
- CPU usage
- Active connections

### Logging
```rust
// Backend logging levels
RUST_LOG=error  // Production
RUST_LOG=info   // Staging
RUST_LOG=debug  // Development
```

---

## 10. Development Workflow

### Local Development
```bash
# Terminal 1: Backend
cd backend-rust
cargo run

# Terminal 2: Frontend
npm run dev

# Terminal 3: Watch logs
tail -f backend-rust/logs/app.log
```

### Git Workflow
1. Create feature branch
2. Make changes
3. Run tests
4. Commit with descriptive message
5. Push and create PR
6. Code review
7. Merge to main

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| | TypeScript | Type safety |
| | Vite | Build tool |
| | TailwindCSS | Styling |
| | Recharts | Data visualization |
| | shadcn/ui | Component library |
| **Backend** | Rust 1.75+ | Programming language |
| | Actix-web 4.9 | Web framework |
| | SQLx 0.8 | Database driver |
| | SQLite | Database |
| | JWT | Authentication |
| | bcrypt | Password hashing |
| **Blockchain** | Starknet | Layer 2 network |
| | Cairo 2.x | Smart contract language |
| | Scarb | Build tool |
| **DevOps** | Docker | Containerization |
| | Nginx | Reverse proxy |
| | GitHub Actions | CI/CD |

---

**Last Updated:** December 24, 2024
