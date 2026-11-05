# SHAKA — Express Backend Service

REST API backend service for the **SHAKA** Personal Finance & Shared Ledger platform, built with **Node.js** and **Express**.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` (a ready `.env` has already been created for you):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=shaka_quiet_luxury_secret_key_2026
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` with hot-reloading.

---

## 📡 API Endpoints Overview

### Health
- `GET /api/health` — Verify API server health & status

### Authentication & User (`/api/auth`)
- `POST /api/auth/login` — Login with username (`alex_rivera`) and password (`password123`)
- `GET /api/auth/me` — Get current logged-in user profile
- `POST /api/auth/forgot-password` — Request password reset link
- `POST /api/auth/change-password` — Change password for current account

### Transactions / Ledger (`/api/transactions`)
- `GET /api/transactions` — List all transactions (supports `?category=`, `?search=`, `?user=`, `?isSplit=`, `?limit=`)
- `GET /api/transactions/:id` — Get single transaction details
- `POST /api/transactions` — Create new expense entry (auto-updates budget category spent)
- `PUT /api/transactions/:id` — Update existing transaction
- `DELETE /api/transactions/:id` — Delete transaction

### Budget & Limits (`/api/budget`)
- `GET /api/budget/categories` — List budget categories with spent, limits & status
- `POST /api/budget/categories` — Add new budget category
- `PUT /api/budget/categories/:id` — Update category limit, name, or color
- `DELETE /api/budget/categories/:id` — Delete category
- `GET /api/budget/monthly-limit` — Get overall monthly spending limit
- `PUT /api/budget/monthly-limit` — Update overall monthly spending limit
- `GET /api/budget/available-categories` — List available transaction categories with icons

### Analytics & Dashboard (`/api/analytics`)
- `GET /api/analytics/summary` — Full real-time metrics (total spent, remaining limit, % spent, today's spend & count, daily average, projected spend, category breakdown)

### Household & Shared Balances (`/api/household`)
- `GET /api/household/members` — List household members and roles
- `GET /api/household/balances` — Calculate split share and who owes whom
- `POST /api/household/settle` — Mark split balances as settled

---

## 💾 Data Persistence

Initial state is seeded from the Stitch design specifications into `backend/data/db.json`. All additions and updates persist to this local JSON database file automatically.
