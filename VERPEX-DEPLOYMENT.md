# 🚀 Verpex cPanel Deployment Guide — CircuCity AI

**Target:** Deploy to Verpex cPanel at `https://chatbot.circucity.se`

---

## ⚡ Quick Summary (What's Already Done)

| Item | Status |
|------|--------|
| `.env` configured with production values | ✅ Done |
| `next.config.js` updated with `output: "standalone"` | ✅ Done |
| `server.js` created for Node.js startup | ✅ Done |
| Prisma schema uses PostgreSQL (Verpex compatible) | ✅ Done |
| PM2 ecosystem config ready | ✅ Done |

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Get Your PostgreSQL Database from Verpex cPanel

1. Login to your **Verpex cPanel**
2. Go to **"PostgreSQL Databases"** (NOT MySQL)
3. **Create a database** (e.g., `circucit_circuitcity_ai`)
4. **Create a database user** with a strong password
5. **Add the user to the database** with ALL PRIVILEGES
6. Note the **connection string** — it will look like:
   ```
   postgresql://username:password@localhost:5432/databasename?schema=public
   ```

### Step 2: Update the `.env` File

Open `../circuitcity-ai/.env` and replace the `DATABASE_URL` with your actual Verpex PostgreSQL connection string from Step 1.

Also generate a **strong JWT secret**:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```
Then update `JWT_SECRET` in `.env` with the output.

### Step 3: Prepare the App for Upload

On your local machine, run these commands:

```bash
cd Desktop/circuitcity-ai

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Generate Prisma client
npx prisma generate

# 3. Build the app (creates .next + standalone)
npm run build
```

The build will produce a `.next/standalone/` directory containing all files needed to run the app.

### Step 4: Upload to Verpex cPanel

**Using cPanel File Manager:**
1. Login to Verpex cPanel
2. Go to **File Manager** → Navigate to your document root (usually `public_html` or a subdirectory)
3. **Upload** these files/folders:
   - `.next/standalone/` (all contents)
   - `public/` folder
   - `.env` file
   - `package.json` file
   - `server.js` file
   - `prisma/` folder (the entire directory)
   - `node_modules/` folder (or run npm install on the server)
   - `next.config.js`

**Better option — zip and upload:**
```bash
# On your local machine, zip the needed files:
# After npm run build completes:

# Create deployment zip (run from circuitcity-ai directory)
# Important: Copy these files to a clean folder first:
mkdir -p deploy-temp
cp -r .next/standalone/* deploy-temp/
cp -r public deploy-temp/
cp .env deploy-temp/
cp package.json deploy-temp/
cp server.js deploy-temp/
cp -r prisma deploy-temp/
cp next.config.js deploy-temp/
cp -r node_modules deploy-temp/

# Zip it
cd deploy-temp && zip -r ../circuitcity-deploy.zip *
```

Then upload `circuitcity-deploy.zip` via Verpex cPanel File Manager and **Extract** it.

### Step 5: Set Up Node.js App in Verpex cPanel

1. In Verpex cPanel, go to **"Setup Node.js App"** (or "Node.js Selector")
2. Click **"Create Application"**
3. Configure:
   - **Node.js version:** 20.x or 22.x
   - **Application root:** Path where you uploaded the files
   - **Application startup file:** `server.js`
   - **Application entry point:** Leave as default (or set to `server.js`)
   - **Environment variables:** Add these manually:
     ```
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=[your postgresql connection string]
     JWT_SECRET=[your strong secret]
     NEXT_PUBLIC_URL=https://chatbot.circucity.se
     NEXT_PUBLIC_APP_NAME=CircuCity AI
     NEXT_PUBLIC_APP_DESCRIPTION=Personalized AI Customer Support for E-commerce
     ```
4. Click **"Create"** or **"Save"**

### Step 6: Run Database Migrations

After the Node.js app is created, SSH into Verpex or use the **"Run npm script"** option:

```bash
cd /path/to/your/app
npx prisma migrate deploy
```

This will create all the database tables in your PostgreSQL database.

### Step 7: Restart the App

1. In the **"Setup Node.js App"** section
2. Click **"Restart"** for your application
3. The app should now be running at `https://chatbot.circucity.se:3000`

### Step 8: Set Up Domain and Proxy

Since your app runs on port 3000, you need to configure the domain:

**Option A: Verpex cPanel Domain Redirect**
1. Go to **"Domains"** → your domain `chatbot.circucity.se`
2. Set **Document Root** to the folder containing your app
3. Create an **.htaccess** file in the document root:

```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Option B: Use Verpex's Node.js proxy** (if available)
Verpex may automatically proxy your domain to the Node.js app. Check the Node.js settings for a domain mapping option.

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Open `https://chatbot.circucity.se` — should show the landing page
- [ ] Go to `/sign-up` — should load the registration form
- [ ] Go to `/sign-in` — should load the login form
- [ ] Check API health by visiting `/api/me` (may return 401, but that means it's working)
- [ ] Check database connection via Prisma
- [ ] Test the chatbot widget endpoint

---

## 🔧 Troubleshooting

**App shows "Cannot GET /" or 404:**
- Make sure `.next/standalone/` contents are in the right place
- Check that `server.js` is in the app root
- Restart the Node.js app from cPanel

**Database connection fails:**
- Verify PostgreSQL is enabled in your Verpex plan (not just MySQL)
- Double-check the `DATABASE_URL` format: `postgresql://user:pass@localhost:5432/dbname?schema=public`
- Make sure the database user has ALL PRIVILEGES on the database

**App crashes on startup:**
- Check the Node.js error logs in cPanel
- Ensure Node.js version is 18+ (20.x recommended)
- Verify all `.env` variables are set

**500 Internal Server Error:**
- Run `npx prisma generate` if Prisma client is missing
- Check if database migrations have been run

---

## 📁 Files Modified/Added

| File | Change |
|------|--------|
| `next.config.js` | Added `output: "standalone"`, disabled `trailingSlash` |
| `server.js` | Recreated for Next.js 15 standalone mode |
| `.env` | Updated with production PostgreSQL + site URL |