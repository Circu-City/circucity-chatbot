# Deployment Guide: CircuitCity AI → chatbot.circucity.se

**Target:** Production deployment on Verpex VPS to `https://chatbot.circucity.se`

**Last updated:** 2026-05-27 (post-refactor commit 7f7fdf3)

---

## 1. Current App Status (Fixed)

- ✅ Git committed (refactor to App Router + Prisma + custom JWT auth)
- ✅ Added missing dependencies: `bcryptjs`, `jsonwebtoken`, `@prisma/client`, `prisma`
- ✅ Added `prisma generate` to build + postinstall
- ✅ PM2 ecosystem config ready (`ecosystem.config.js`)
- ✅ Improved `.env.example`

**Still needs on first deploy:**
- Database migration
- Proper environment variables
- Nginx reverse proxy + SSL (Let's Encrypt)

---

## 2. What You Must Provide (Reply With These)

Please give me the following so I can give you exact copy-paste commands:

1. **Server IP or hostname** (e.g. `123.45.67.89` or `vps123.verpex.com`)
2. **SSH username** (usually `root` or the user you created for `circucity-deploy` key)
3. **Which Linux distro** is on the Verpex VPS? (Ubuntu 22.04/24.04 recommended, or Debian, Alma, etc.)
4. **Do you want Postgres installed on the same VPS**, or use an external managed database (Neon, Supabase, Railway, etc.)?
5. **Is the domain `chatbot.circucity.se` already pointed** to the VPS IP via DNS (A record)?
6. **Do you have a strong password** ready for the database user, or should I generate one?

Once you reply with the above, I will give you the exact sequence of commands to run on the server.

---

## 3. High-Level Deployment Architecture (Recommended)

```
chatbot.circucity.se (HTTPS via Nginx + Certbot)
          ↓
Nginx reverse proxy (port 80 → 443, proxy to 3000)
          ↓
PM2-managed Node process (Next.js)
          ↓
PostgreSQL (local or remote)
```

**Why this stack?**
- Most reliable on VPS
- Easy zero-downtime restarts with PM2
- Free SSL with Certbot

---

## 4. Local Preparation (Do This First on Your Machine)

```bash
cd Desktop/circuitcity-ai

# 1. Install deps (React 19 RC can be picky — use legacy-peer-deps)
npm install --legacy-peer-deps

# 2. Create real .env file (copy from example and fill)
cp .env.example .env
# Edit .env with real values (especially DATABASE_URL and JWT_SECRET)

# 3. Generate a strong JWT secret (run this)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 4. Test build locally (critical before server deploy!)
npm run build
```

If the local build succeeds, we're in good shape for the server.

**Note:** The React 19 Release Candidate + some libs (zustand) require the legacy peer deps flag. This is normal for RC versions.

---

## 5. Server Setup (High Level Steps)

I will give precise commands once you answer the questions above. Typical flow:

1. Add your SSH key to the server (if not already done)
2. SSH in
3. Update system + install Node 20/22, Git, Nginx, Certbot, build tools
4. Install PostgreSQL (if using local DB) + create user + database
5. Clone or rsync the app to `/var/www/circucity` or `~/circucity`
6. `npm install` (Prisma will generate on postinstall)
7. Copy `.env` with production values
8. Run `npm run db:migrate`
9. (Optional) `npm run db:seed`
10. Start with PM2 + save
11. Configure Nginx site + Certbot for chatbot.circucity.se
12. Set up firewall (ufw)

---

## 6. Important Notes & Gotchas

- **Next.js 15 + React 19 RC**: Works, but some packages are picky. We pinned Prisma 5.22 for stability.
- **Images**: `next.config.js` has `images.unoptimized: true` — this is fine for now.
- **Trailing slashes**: Enabled. Most routes should work.
- **Cookies / Auth**: The app uses httpOnly JWT cookies. Will work behind Nginx as long as you proxy correctly (no extra buffering issues).
- **Prisma on production**: Always use `prisma migrate deploy` (never `db push` in prod).
- **Logs**: PM2 logs go to `./logs/`
- **Backups**: Plan database backups (pg_dump cron or managed DB snapshots).

---

## 7. After Deployment — Next Features Likely Needed

- Real AI chat endpoint (currently conversations are stored but no LLM call visible in the current code)
- Stripe billing (schema is ready)
- Widget embed script serving (`/widget.js` or similar)
- Proper rate limiting / API key validation

---

## Quick Commands (Save for Later)

```bash
# On server - after code is there
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# View logs
pm2 logs circucity-chatbot

# Restart after changes
pm2 restart circucity-chatbot

# Database migration (run after pulling new migrations)
npm run db:migrate
```

---

**Next action:** Reply with the 6 pieces of information listed in section 2.

I will then give you the **complete, numbered, copy-paste ready terminal commands** tailored to your exact server.

We can also do the first deployment together step-by-step here.