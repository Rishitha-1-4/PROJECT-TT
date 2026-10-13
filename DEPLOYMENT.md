# Deploying Smart Vehicle Maintenance Platform on Render

This guide provides step-by-step instructions to deploy your application to **Render** ([render.com](https://render.com)).

---

## 1. Quick Deployment Steps on Render

### Step 1: Create a Free MySQL Database
Render provides web servers, but for MySQL, you can connect any free cloud MySQL database in 1 minute:
* **Option A: Aiven for MySQL (Recommended - Free Tier):**
  1. Go to [https://console.aiven.io/signup](https://console.aiven.io/signup) and create a free account.
  2. Create a new service &rarr; Select **MySQL** &rarr; Free Plan.
  3. Copy your Service URI or connection details:
     * **Host:** `mysql-xxx.aivencloud.com`
     * **Port:** `12345`
     * **User:** `avnadmin`
     * **Password:** *(shown in Aiven console)*
     * **Database:** `defaultdb` (or create `smart_vehicle_maintenance`)

* **Option B: TiDB Cloud (Serverless Free Tier - 100% MySQL Compatible):**
  1. Go to [https://tidbcloud.com](https://tidbcloud.com) &rarr; Sign in with GitHub.
  2. Create a **Serverless** cluster (Free, 5 GB storage).
  3. Click **Connect** &rarr; Copy the Host, Port (4000), User, and Password.

---

### Step 2: Deploy Web Service on Render

1. Go to your Render Dashboard: [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your repository:
   ```text
   Rishitha-1-4/PROJECT-TT
   ```
5. Configure the service settings:
   * **Name:** `smart-vehicle-maintenance` (or your chosen name)
   * **Region:** Any (e.g., Oregon or Frankfurt)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`

---

### Step 3: Add Environment Variables in Render
Under the **Environment Variables** section on Render, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `SESSION_SECRET` | *(click Generate or enter a secret key)* | Session encryption key |
| `DB_HOST` | `your-cloud-mysql-host.com` | Hostname from Aiven / TiDB / Cloud MySQL |
| `DB_PORT` | `3306` *(or 4000 for TiDB)* | Port number |
| `DB_USER` | `your_mysql_username` | MySQL user |
| `DB_PASSWORD` | `your_mysql_password` | MySQL password |
| `DB_NAME` | `smart_vehicle_maintenance` *(or defaultdb)* | Database name |
| `DB_SSL` | `true` | Enables SSL for cloud database connection |

*(Optional)* If you have SMTP credentials for Nodemailer email reminders:
* `SMTP_HOST`: `smtp.gmail.com`
* `SMTP_PORT`: `587`
* `SMTP_USER`: `your_email@gmail.com`
* `SMTP_PASS`: `your_app_password`

---

### Step 4: Click Deploy!
1. Click **Create Web Service**.
2. Render will build and deploy your application.
3. Once deployed, Render will provide your public live URL:
   ```text
   https://smart-vehicle-maintenance-xxxx.onrender.com
   ```

> [!NOTE]
> The server automatically detects missing database tables and runs schema creation and knowledge base seed scripts automatically on startup!
