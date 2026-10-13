# Smart Vehicle Maintenance Platform

> A centralized, professional automotive maintenance platform built for vehicle owners and fleet managers to track vehicles, log service histories, schedule maintenance reminders, evaluate vehicle health, search common automotive problems, and analyze repair expenditures.

---

## 1. Project Overview

Missed oil changes, forgotten brake inspections, and surprise breakdown bills are among the most common and costly pitfalls of vehicle ownership. The **Smart Vehicle Maintenance Platform** eliminates these challenges by providing a unified, secure dashboard to manage your vehicles across their complete lifecycle.

### Core Highlights:
- **Multi-Vehicle Garage:** Register cars, SUVs, trucks, and bikes with odometer tracking, fuel types, and registration details.
- **Service History & Invoice Records:** Record maintenance logs with costs, parts replaced, odometer readings, and service centers.
- **Maintenance Reminders & Scheduling:** Receive in-app and optional automated email alerts (via Nodemailer) for upcoming and overdue servicing tasks.
- **Vehicle Health Assessment:** Automatic evaluation calculates status (**Good**, **Due Soon**, or **Overdue**) based on actual service records and due dates.
- **Automotive Problem Knowledge Base:** Search symptoms for engine overheating, warning lights, brake noises, and low fuel efficiency with safety guidelines and when to consult a mechanic.
- **Expense Analytics & Reports:** Interactive Chart.js monthly trend charts, vehicle expenditure distribution, date-range filtering, and printable PDF audit logs.
- **Secure Authentication:** Express session management, user data isolation, and bcrypt password hashing.

---

## 2. Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons
- **Data Visualizations:** Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MySQL (version 8.0+)
- **Database Connectivity:** `mysql2` (Connection pooling & parameterized SQL)
- **Authentication & Security:** Express Sessions (`express-session`) and `bcryptjs`
- **Email Notifications:** Nodemailer (configured through environment variables)
- **Deployment Platform:** Windows (Local development via VS Code & PowerShell / Command Prompt)

> **Architectural Note:** Built deliberately with clean vanilla JavaScript, standard REST APIs, and relational MySQL without the complexity of heavy frameworks or external paid APIs.

---

## 3. Directory Structure

```text
smart-vehicle-maintenance/
├── config/
│   └── db.js                 # MySQL connection pool & parameterized query runner
├── database/
│   ├── schema.sql            # Full SQL schema (users, vehicles, services, reminders, problems)
│   ├── seed.sql              # Curated knowledge base records (10+ automotive problems)
│   ├── init.js               # Automated database creator & schema loader (npm run db:init)
│   └── seed.js               # Optional demo account with sample vehicles & records (npm run db:seed)
├── middleware/
│   └── auth.js               # Session verification & user vehicle ownership guard
├── public/
│   ├── css/
│   │   └── style.css         # Premium automotive dark navy & blue theme + print styles
│   ├── js/
│   │   ├── app-utils.js      # Shared toast system, confirmation modals, formatters & auth sync
│   │   ├── auth.js           # Login and registration validation & submission
│   │   ├── dashboard.js      # Real-time KPI cards, Chart.js monthly chart & status rendering
│   │   ├── vehicles.js       # Vehicle garage CRUD, modal controls & search filters
│   │   ├── services.js       # Service history table, filters, sorting & cost calculations
│   │   ├── reminders.js      # Task reminders, status tabs & Nodemailer dispatch triggers
│   │   ├── problems.js       # Knowledge base live search, category & urgency filters
│   │   └── reports.js        # Analytics charts (bar + doughnut) and printable audit reports
│   └── images/
├── routes/
│   ├── auth.js               # /api/auth (register, login, logout, me)
│   ├── profile.js            # /api/profile (view, update profile, change password)
│   ├── vehicles.js           # /api/vehicles (CRUD, health assessment)
│   ├── services.js           # /api/services (CRUD, search, date filtering)
│   ├── reminders.js          # /api/reminders (CRUD, mark complete, notification trigger)
│   ├── problems.js           # /api/problems (knowledge base search & detail)
│   ├── reports.js            # /api/reports (financial analytics & audit records)
│   └── dashboard.js          # /api/dashboard (aggregate fleet telemetry & stats)
├── services/
│   └── reminderService.js    # Date-based status updates & honest Nodemailer email dispatcher
├── views/
│   ├── index.html            # Public automotive landing page
│   ├── login.html            # User authentication sign in
│   ├── register.html         # User account registration
│   ├── dashboard.html        # Fleet telemetry & analytics overview
│   ├── vehicles.html         # Registered vehicle management garage
│   ├── vehicle-details.html  # Vehicle health, specifications & individual history
│   ├── services.html         # Complete service history logs & invoices
│   ├── reminders.html        # Maintenance task reminders & email dispatch controls
│   ├── problems.html         # Automotive troubleshooting & safety knowledge base
│   ├── reports.html          # Expense breakdown, Chart.js graphs & printable reports
│   └── profile.html          # Profile settings & password security management
├── test/
│   ├── run-checks.js         # Automated architecture, views, bcrypt & service tests
│   └── routes.test.js        # Route security & middleware protection tests
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and lifecycle scripts
├── server.js                 # Main Express server entry point
└── README.md                 # Full documentation and setup guide
```

---

## 4. Windows Prerequisites

Before starting, ensure the following are installed on your Windows laptop:

1. **Node.js:** v18.x or higher (v20+ recommended). Check with:
   ```cmd
   node -v
   npm.cmd -v
   ```
2. **MySQL Server:** MySQL 8.0 or MySQL Community Server. Check with:
   ```powershell
   Get-Service -Name *mysql*
   ```
   Ensure the MySQL service (typically named `MySQL80`) is in the **Running** state.

---

## 5. Step-by-Step Windows Installation Guide

### Step 1: Open the Project Directory
Open **VS Code** or a **Command Prompt / PowerShell** window in the project folder:
```powershell
cd c:\Users\harin\Downloads\T08
```

### Step 2: Install Node.js Dependencies
Run the install command:
```powershell
npm.cmd install
```
*(On Windows systems where script execution policies restrict `npm.ps1`, using `npm.cmd` runs directly and smoothly).*

---

### Step 3: Configure Environment Variables (`.env`)
Copy `.env.example` to create your local `.env` configuration file:
```powershell
Copy-Item .env.example .env
```
Open `.env` in VS Code and supply your local MySQL database credentials:
```ini
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=smart_vehicle_maintenance

# Session Configuration
SESSION_SECRET=smart_vehicle_maintenance_super_secret_session_key_2026

# Optional: Automated Email Reminders via Nodemailer
# Leave blank to use in-app reminders; fill in to enable live email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@smartvehicle.local
```

---

### Step 4: Initialize the Database
Run the automated schema and knowledge base initializer:
```powershell
npm.cmd run db:init
```
This script automatically:
1. Connects to your local MySQL instance.
2. Creates the database `smart_vehicle_maintenance` if it does not already exist.
3. Creates all tables (`users`, `vehicles`, `service_records`, `maintenance_reminders`, `vehicle_problems`) with proper foreign keys and indexes.
4. Seeds the automotive problem knowledge base with 10+ common mechanical issues, symptoms, root causes, and safety warnings.

*(Alternative Manual Setup)*:
If you prefer running SQL directly in **MySQL Workbench** or MySQL CLI:
```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

---

### Step 5: (Optional) Seed Demo Data for Demonstration
If you want to immediately explore charts, reports, and vehicle records without typing data manually:
```powershell
npm.cmd run db:seed
```
This creates:
- **Demo User:** `demo@smartvehicle.com` / Password: `Demo123!`
- **Vehicles:** Toyota Camry XSE (Sedan) and Ford Explorer ST (SUV)
- **Service Records:** Monthly service logs across May to October 2026
- **Reminders:** Upcoming, Overdue, and Completed tasks

---

### Step 6: Start the Application Server
Start the Express server:
```powershell
npm.cmd start
```
*(For development with auto-reload, run `npm.cmd run dev`)*.

The server will output:
```text
========================================================
🚀 Smart Vehicle Maintenance Platform
📡 Server running at http://localhost:3000
⏱  Environment: development
========================================================
✓ Connected to MySQL database "smart_vehicle_maintenance" on localhost:3306
```

---

### Step 7: Open the Application in Your Browser
Open your browser and navigate to:
```text
http://localhost:3000
```
- Click **"Get Started"** to register a new account, or
- Click **"Sign In"** (use `demo@smartvehicle.com` / `Demo123!` if you ran `npm run db:seed`).

---

## 6. Running Automated Tests

Run the built-in test suite to verify file integrity, route security, password hashing, and service reliability:
```powershell
npm.cmd test
```
The test suite validates:
- [x] All 10 HTML view templates exist and have valid structure
- [x] All client scripts are present
- [x] Automotive theme stylesheet & print media queries are compiled
- [x] Bcrypt password hashing & comparison work correctly
- [x] Unauthenticated requests to protected endpoints return `401 Unauthorized`
- [x] Input validation for user registration & login rejects malformed data
- [x] Nodemailer service reports honest status when SMTP credentials are not configured

---

## 7. Application Features & Page Walkthrough

### A. Landing Page (`/`)
- Sleek automotive-themed hero section with platform statistics.
- Key features breakdown: Multi-vehicle garage, service history, reminders, health evaluation, and problem library.
- Three-step workflow guide.
- Knowledge base preview with critical safety alerts.
- Direct navigation to Sign In and Registration.

### B. Authentication (`/login.html` & `/register.html`)
- **Register:** Validates full name, email format, duplicate email checks, and minimum 6-character passwords with matching confirmation.
- **Login:** Compares password hash via bcrypt; initiates authenticated Express session cookie (`svm.sid`).
- Protected views redirect unauthorized visitors to the login page automatically.

### C. Dashboard (`/dashboard.html`)
- **Real-Time Telemetry:** Calculated from actual database tables (never hardcoded mock values).
- **KPI Metrics:** Registered Vehicles, Upcoming Tasks, Overdue Tasks, Total Maintenance Cost.
- **Monthly Expenses Chart:** Chart.js bar chart displaying spending trends across recent months.
- **Vehicle Maintenance Status Cards:** Immediate overview showing which vehicles are in Good condition, Due Soon, or Overdue.
- **Recent Services Table:** Quick view of the 5 most recent service events.

### D. Vehicle Management (`/vehicles.html`)
- **Garage View:** Filter vehicles by search keyword or vehicle type (Sedan, SUV, Hatchback, Truck, Motorcycle, etc.).
- **Add / Edit Modal:** Vehicle name, registration plate, type, manufacturer, model, year, fuel type, current odometer, and purchase date.
- **Enforced Uniqueness:** Prevents duplicate registration numbers within a user's garage.
- **Owner Isolation:** Parameterized queries ensure users only see and edit their own vehicles.
- **Delete Confirmation:** Modal dialog warns that deleting a vehicle cascades to its service records and reminders.

### E. Vehicle Details & Health (`/vehicle-details.html?id=X`)
- Comprehensive overview of a single vehicle's telemetry.
- **Health Status Calculation:** Evaluates scheduled service intervals and reminders:
  - **Good:** All maintenance tasks and service dates are current.
  - **Due Soon:** Task due within the next 14 days.
  - **Overdue:** Scheduled due date has passed.
  *(Transparently indicates this is a schedule compliance assessment, not a physical mechanical diagnostic scan).*
- Complete chronological service logs and active reminders for the selected vehicle.

### F. Service History (`/services.html`)
- Add, edit, search, and delete service visits.
- Tracks: Vehicle, Service Date, Odometer Reading, Service Type, Technician Notes, Parts Replaced, Service Centre, Total Cost, and Next Service Date.
- Filter by vehicle, sort by date or cost, and live keyword search.
- **Automatic Odometer Sync:** Logging a service with a higher odometer reading automatically updates the vehicle's current odometer.

### G. Maintenance Reminders (`/reminders.html`)
- Track tasks for engine oil, tire rotation, brake inspections, battery checks, and custom jobs.
- Filter by status tabs: **All**, **Upcoming**, **Overdue**, and **Completed**.
- **One-Click Completion:** "Mark Complete" stamps the task as completed on today's date.
- **Honest Nodemailer Email System:**
  - Status banner transparently reflects whether SMTP credentials are configured in `.env`.
  - Never falsely reports email delivery as successful when SMTP is not configured.
  - "Check Notifications" button triggers real-time schedule checks and updates statuses.

### H. Problem Knowledge Base (`/problems.html`)
- Database-backed library of common automotive issues:
  - *Engine Overheating*
  - *Battery Not Starting / Slow Crank*
  - *Low Tyre Pressure / TPMS Warning*
  - *Brake Noise & Grinding Pedal*
  - *Check Engine Light (CEL)*
  - *Poor Fuel Efficiency & Sluggish Acceleration*
  - *Engine Oil Leakage*
  - *Unusual Engine Noise (Knocking / Squealing)*
  - *Transmission Slipping*
  - *AC Blowing Warm Air*
- Highlights Symptoms, Possible Root Causes, Affected Components, Recommendations, Urgency Level, and When to Consult a Mechanic.
- Prominent safety warnings for high-risk hazards.

### I. Reports & Expense Analytics (`/reports.html`)
- Date-range filtering (From Date, To Date) and vehicle selector.
- **Summary KPIs:** Total Expenditure, Total Services Completed, Average Cost per Service.
- **Chart.js Monthly Spending Timeline:** Bar chart visualizing expenditure trends.
- **Chart.js Vehicle Spending Distribution:** Doughnut chart breaking down costs across garage vehicles.
- **Detailed Tabular Audit:** Full breakdown with grand totals.
- **Printable Audit Report:** Clean `@media print` CSS removes navigation bars and buttons for professional one-click PDF export (`Ctrl + P` or "Print / Save PDF").

### J. User Profile & Security (`/profile.html`)
- Displays account statistics: Registered vehicles, services logged, and active reminders.
- Update profile name and email address (with duplicate email validation).
- Change password securely: Verifies current password before updating to the new bcrypt hash.

---

## 8. Windows Troubleshooting Guide

| Problem | Cause | Resolution |
| :--- | :--- | :--- |
| **`ER_ACCESS_DENIED_ERROR` for user 'root'@'localhost'** | Incorrect password in `.env` | Open `.env` and verify `DB_PASSWORD` matches the root password set during your MySQL installation. |
| **`ECONNREFUSED 127.0.0.1:3306`** | MySQL Server service is stopped | Open PowerShell as Administrator and run: `Start-Service MySQL80` (or start it via Windows `services.msc`). |
| **`npm : File cannot be loaded because running scripts is disabled`** | Windows PowerShell Execution Policy | Use `npm.cmd` instead of `npm`, e.g., `npm.cmd start` or `npm.cmd run db:init`. |
| **Port 3000 already in use (`EADDRINUSE`)** | Another process is occupying port 3000 | Change `PORT=3001` in your `.env` file and restart the server, or run `Get-NetTCPConnection -LocalPort 3000` to find and stop the process. |
| **Nodemailer emails not sending** | SMTP credentials missing in `.env` | Email dispatch is optional. Set `SMTP_USER` and `SMTP_PASS` in `.env` (e.g. Gmail App Password). Without it, in-app notifications operate normally. |

---

## 9. Preparing for Git and GitHub

To commit and push the project to your GitHub repository:
```powershell
git init
git add .
git commit -m "Complete Smart Vehicle Maintenance Platform"
git branch -M main
# Add your GitHub remote URL:
# git remote add origin https://github.com/YOUR_USERNAME/smart-vehicle-maintenance.git
# git push -u origin main
```

---

## 10. License

This project is licensed under the ISC License. Designed and engineered for local Windows deployment.
