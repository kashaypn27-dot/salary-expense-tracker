# 💰 Salary & Expense Tracker

A production-ready full-stack web app for tracking salary/income, expenses,
and generating reports with charts. Built with:

- **Frontend:** HTML5, CSS3 (responsive, dark-mode ready), Vanilla JavaScript, Chart.js
- **Backend:** Node.js + Express.js (MVC folder structure)
- **Database:** MySQL
- **Auth:** JWT + bcrypt password hashing

---

## 📁 Folder Structure

```
project-root/
├── backend/                 # Node.js + Express API
│   ├── config/db.js         # MySQL connection pool
│   ├── controllers/         # Route handlers (business logic)
│   ├── middleware/          # Auth guard + centralized error handler
│   ├── models/              # SQL query layer (no ORM, parameterized queries)
│   ├── routes/               # Express routers
│   ├── utils/                # Validators, JWT helper, async wrapper
│   ├── server.js             # App entry point
│   ├── ecosystem.config.js   # PM2 process config
│   ├── Dockerfile
│   └── .env.example
├── frontend/                 # Static HTML/CSS/JS client
│   ├── index.html            # Login page
│   ├── register.html
│   ├── dashboard.html
│   ├── income.html
│   ├── expenses.html
│   ├── reports.html
│   ├── css/style.css
│   └── js/ (api.js, auth.js, theme.js, sidebar.js, dashboard.js, income.js, expenses.js, reports.js)
├── database/
│   ├── schema.sql            # Table definitions + foreign keys
│   └── sample_data.sql       # Sample income/expense rows
├── docker-compose.yml         # MySQL + backend + frontend (optional)
├── package.json               # Convenience scripts at the repo root
└── README.md
```

---

## ✅ Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (or MySQL 5.7+) running locally or remotely
- (Optional) Docker + Docker Compose, if you prefer containerized setup
- (Optional) PM2 (`npm i -g pm2`) for production process management

---

## 🚀 Setup Instructions (Local, without Docker)

### 1. Clone / unzip the project and move into it
```bash
cd project-root
```

### 2. Create the database
Log into MySQL and run the schema script:
```bash
mysql -u root -p < database/schema.sql
```
This creates the `salary_expense_tracker` database and the `users`, `income`, and `expenses` tables with proper foreign keys and indexes.

### 3. Configure environment variables
```bash
cd backend
cp .env.example .env
```
Edit `.env` and set your real MySQL credentials and a strong `JWT_SECRET`:
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=salary_expense_tracker
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

### 4. Install backend dependencies
```bash
npm install
```

### 5. Start the backend API
```bash
npm run dev     # nodemon (auto-restarts on changes)
# or
npm start       # plain node
```
You should see:
```
✅ MySQL connected successfully
🚀 Server running in development mode on port 5000
```
Verify it's alive: `curl http://localhost:5000/api/health`

### 6. Serve the frontend
The frontend is static HTML/CSS/JS, so any static file server works. From the project root:
```bash
npx serve frontend -l 5500
```
Then open **http://localhost:5500** in your browser.

> If you use a different port/host for the frontend, add it to `CORS_ORIGIN` in `backend/.env`.
> If your backend runs somewhere other than `http://localhost:5000`, update `API_BASE_URL` at the top of `frontend/js/api.js`.

### 7. Create an account and load sample data (optional)
1. Open the app and click **Create one** to register (e.g. `demo@example.com` / `password123`). This creates user id `1` on a fresh database.
2. Load sample transactions for that user:
   ```bash
   mysql -u root -p salary_expense_tracker < database/sample_data.sql
   ```
3. Refresh the dashboard — you'll see populated charts and tables.

---

## 🐳 Setup with Docker (alternative)

```bash
# from project-root
DB_PASSWORD=your_root_password JWT_SECRET=your_jwt_secret docker compose up --build
```
This spins up MySQL (with schema auto-loaded), the Express API on port `5000`, and the static frontend (via nginx) on port `5500`. Then run the sample data script against the containerized DB if desired:
```bash
docker exec -i set_mysql mysql -uroot -p"$DB_PASSWORD" salary_expense_tracker < database/sample_data.sql
```

---

## 📦 PM2 (production process management, non-Docker)

```bash
cd backend
npm install -g pm2   # if not already installed
pm2 start ecosystem.config.js --env production
pm2 logs salary-expense-tracker-api
pm2 save && pm2 startup   # persist across reboots
```

---

## 🔌 API Documentation

Base URL: `http://localhost:5000/api`

All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Create account, returns JWT + user |
| POST | `/auth/login` | `{ email, password }` | Log in, returns JWT + user |
| GET | `/auth/me` | — | Get current logged-in user profile |

**Register example**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```
Response `201`:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": { "id": 1, "name": "Jane Doe", "email": "jane@example.com" },
  "token": "eyJhbGciOi..."
}
```

### Income

| Method | Endpoint | Query/Body | Description |
|---|---|---|---|
| GET | `/income` | `?category&month&year&search&page&limit` | List income (paginated, filterable) |
| POST | `/income` | `{ source, category, amount, incomeDate, description? }` | Add income |
| PUT | `/income/:id` | same as POST | Update an income entry |
| DELETE | `/income/:id` | — | Delete an income entry |

### Expenses

| Method | Endpoint | Query/Body | Description |
|---|---|---|---|
| GET | `/expenses` | `?category&month&year&search&page&limit` | List expenses (paginated, filterable) |
| POST | `/expenses` | `{ category, amount, expenseDate, description? }` | Add expense |
| PUT | `/expenses/:id` | same as POST | Update an expense entry |
| DELETE | `/expenses/:id` | — | Delete an expense entry |

### Reports

| Method | Endpoint | Query | Description |
|---|---|---|---|
| GET | `/reports/dashboard` | `?year` | Totals, this-month summary, 12-month trend, category breakdown |
| GET | `/reports/monthly` | `?month&year` | Monthly totals + income/expense category breakdown |
| GET | `/reports/yearly` | `?year` | 12-month income/expense trend + yearly totals |
| GET | `/reports/csv` | `?type=income\|expense&month&year&category` | Download CSV export |

All responses follow this shape:
```json
{ "success": true, "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "Human readable error" }
```
Validation errors (`400`) include an `errors` array from `express-validator`.

**Standard status codes used:** `200` OK, `201` Created, `400` Validation error, `401` Unauthorized, `404` Not found, `409` Conflict (duplicate email), `500` Server error.

---

## 🔒 Security & Best Practices Implemented

- Passwords hashed with **bcrypt** (never stored in plain text)
- **JWT** authentication with expiry, verified on every protected route
- All SQL queries use **parameterized statements** (`mysql2` placeholders) — no string concatenation, so no SQL injection
- **express-validator** validates and sanitizes all incoming input
- **helmet** sets secure HTTP headers
- **CORS** restricted to an explicit allow-list via `CORS_ORIGIN`
- **express-rate-limit** throttles login/register attempts (brute-force protection)
- Centralized error handler normalizes error responses and hides stack traces in production
- Secrets/config kept in `.env` (never committed — see `.gitignore`)
- Foreign keys with `ON DELETE CASCADE` keep income/expenses consistent with their owning user

---

## ✨ Extra Features Included

- 🌙 **Dark mode** toggle (persisted in `localStorage`, applied via CSS variables)
- ⚠️ **Overspending banner** on the dashboard when current-month expenses exceed income
- 🔍 **Search & filter** transactions by category, month, year, and free-text search
- 📄 **Pagination** on income/expense tables
- 📊 **Chart.js** bar/line/pie charts for trends and category breakdowns
- 📥 **CSV export** for both income and expense reports
- 📱 Fully **responsive** layout with a collapsible sidebar on mobile

---

## 🧪 Quick Manual Test Checklist

1. Register a new user → redirected to dashboard
2. Add an income entry (Salary, ₹50000, today) → appears in Income table
3. Add an expense entry (Food, ₹1200, today) → appears in Expenses table
4. Dashboard totals update automatically; pie/bar charts render
5. Edit and delete both an income and an expense entry
6. Filter expenses by category/month/search
7. Visit Reports, switch month/year, download CSV
8. Toggle dark mode from the sidebar — preference persists on reload
9. Log out, confirm redirected to login and protected pages are inaccessible without a token

---

## 🛠 Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3 (custom, no framework), Vanilla JS, Chart.js |
| Backend | Node.js, Express.js |
| Database | MySQL 8 (`mysql2` driver, connection pooling) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Deployment | PM2 `ecosystem.config.js`, `Dockerfile`, `docker-compose.yml` |
