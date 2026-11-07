# SHAKA — Express + MongoDB Backend Service

REST API backend service for the **SHAKA** Personal Finance & Shared Ledger platform, built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

---

## ⚡ Quick Start

### 1. Start Local MongoDB
Ensure your local MongoDB daemon is running:
- **Windows Service**: `net start MongoDB` (or run MongoDB Compass)
- **Direct CLI**: `mongod --dbpath <data-folder>`

Default connection URI:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/shaka
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` with hot-reloading and directly connects to the existing MongoDB database without inserting predefined records.

---

## 🍃 MongoDB Models

- **`User`** (`backend/src/models/User.js`): Accounts, credentials, roles, initials, avatar colors
- **`Transaction`** (`backend/src/models/Transaction.js`): Expenses, date/time, category, user, split flag
- **`BudgetCategory`** (`backend/src/models/BudgetCategory.js`): Spending limits, amounts spent, category colors, threshold health status
- **`Setting`** (`backend/src/models/Setting.js`): Global monthly limit and available category icons

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
