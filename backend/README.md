# Backend - Smart Vehicle Maintenance Platform

This directory contains the Node.js and Express.js backend services, REST API route controllers, security middleware, and database connectivity.

## Directory Structure

```text
backend/
├── config/
│   └── db.js                 # MySQL connection pool & parameterized query runner (mysql2)
├── middleware/
│   └── auth.js               # Session auth guard & user vehicle ownership verification
├── routes/
│   ├── auth.js               # /api/auth (register, login, logout, me)
│   ├── profile.js            # /api/profile (view, update, password change)
│   ├── vehicles.js           # /api/vehicles (CRUD, vehicle health assessment)
│   ├── services.js           # /api/services (CRUD, search, date range filter, odometer sync)
│   ├── reminders.js          # /api/reminders (CRUD, mark complete, notification trigger)
│   ├── problems.js           # /api/problems (knowledge base search & detail)
│   ├── reports.js            # /api/reports (financial analytics & printable data)
│   └── dashboard.js          # /api/dashboard (computed fleet telemetry & stats)
├── services/
│   └── reminderService.js    # Date-based status updater & honest Nodemailer email dispatcher
└── server.js                 # Main Express server entry point
```

## Key Technologies & Security
- **Node.js & Express.js:** Fast, minimal web server and REST API routing.
- **MySQL & mysql2:** Connection pooling, parameterized queries preventing SQL injection.
- **bcryptjs:** Secure password hashing (10 salt rounds).
- **express-session:** Session authentication with `httpOnly` and `sameSite` cookies.
- **Nodemailer:** Scheduled and on-demand maintenance alert email delivery via SMTP.
- **Data Isolation:** Enforces record ownership so users only access their own vehicle data.
