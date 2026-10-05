# Complete Vercel Deployment Guide

## Overview

This guide covers deploying the upgraded Healthcare SaaS application to Vercel with:
- ✅ Backend API (Serverless Functions)
- ✅ Frontend (React/Vite SPA)
- ✅ Neon PostgreSQL Database
- ✅ Environment Variables
- ✅ Custom Domain (Optional)

## Prerequisites

- Vercel account
- Neon database already connected
- GitHub repository pushed
- Node.js 18+ locally

## Step 1: Database Setup

### Run Schema in Neon Console

1. Go to https://console.neon.tech/
2. Select your project
3. Open SQL Editor
4. Run the schema:

```bash
# Copy and paste the content from:
infra/database/unified-schema.sql
```

5. (Optional) Run seed data:

```bash
# Copy and paste the content from:
infra/database/seed-data.sql
```

### Verify Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 16 tables.

## Step 2: Configure Environment Variables in Vercel

### Login to Vercel Dashboard

```bash
vercel login
```

### Link Project (if not linked)

```bash
cd /Users/shashishekharmishra/Doctor_App/clinical-saas
vercel link
```

### Set Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables for **Production**, **Preview**, and **Development**:

#### Required Variables

```env
# Database
DATABASE_URL=<your-neon-connection-string>

# JWT Secret (generate a strong random string)
JWT_SECRET=<generate-using: openssl rand -base64 32>

# Node Environment
NODE_ENV=production

# Frontend URL (after first deployment, update with your actual domain)
FRONTEND_URL=https://your-project.vercel.app

# API URL (same as frontend)
VITE_API_URL=https://your-project.vercel.app/api

# Socket.IO URL
VITE_SOCKET_URL=https://your-project.vercel.app
```

#### Optional Variables

```env
# Stripe (if using payments)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>

# Email (if using notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>

# Debug
DEBUG_QUERIES=false
```

### Set via CLI (Alternative)

```bash
# Production
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add FRONTEND_URL production
vercel env add VITE_API_URL production

# Preview (for PR deployments)
vercel env add DATABASE_URL preview
vercel env add JWT_SECRET preview
vercel env add FRONTEND_URL preview
vercel env add VITE_API_URL preview

# Development (for local vercel dev)
vercel env add DATABASE_URL development
vercel env add JWT_SECRET development
```

## Step 3: Update Frontend Environment

Create `.env` file in `apps/clinician-web/`:

```bash
cd apps/clinician-web
cat > .env << EOF
VITE_API_URL=https://your-project.vercel.app/api
VITE_SOCKET_URL=https://your-project.vercel.app
VITE_ENV=production
EOF
```

## Step 4: Install Dependencies

### Frontend

```bash
cd apps/clinician-web
npm install
```

### API Serverless Functions

```bash
cd ../../api
npm install
```

## Step 5: Test Build Locally

### Build Frontend

```bash
cd apps/clinician-web
npm run build
```

### Verify Build Output

```bash
ls -la dist/
# Should see index.html, assets/, etc.
```

## Step 6: Deploy to Vercel

### Option 1: Deploy via CLI

```bash
cd /Users/shashishekharmishra/Doctor_App/clinical-saas
vercel --prod
```

### Option 2: Deploy via GitHub

1. Push to GitHub:

```bash
git add .
git commit -m "Complete Healthcare SaaS integration with Vercel deployment"
git push origin main
```

2. Vercel will auto-deploy from main branch

### Option 3: Deploy via Vercel Dashboard

1. Go to Vercel Dashboard
2. Click "Add New Project"
3. Import from GitHub
4. Select repository
5. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `.` (leave empty or root)
   - Build Command: `cd apps/clinician-web && npm install && npm run build`
   - Output Directory: `apps/clinician-web/dist`
6. Click "Deploy"

## Step 7: Verify Deployment

### Check Health Endpoint

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-09-29T...",
  "version": "2.0.0",
  "service": "Healthcare SaaS API"
}
```

### Test Frontend

Visit: `https://your-project.vercel.app`

Should see login page.

### Test API Endpoints

```bash
# Register
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "userType": "patient"
  }'

# Login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

## Step 8: Update Environment Variables with Actual Domain

After first successful deployment:

1. Note your Vercel URL: `https://your-project.vercel.app`
2. Update environment variables:

```bash
vercel env rm FRONTEND_URL production
vercel env add FRONTEND_URL production
# Enter: https://your-actual-domain.vercel.app

vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter: https://your-actual-domain.vercel.app/api
```

3. Redeploy:

```bash
vercel --prod
```

## Step 9: Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add"
3. Enter your domain: `healthcare-saas.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (5-10 minutes)

### Update Environment Variables

After custom domain is active:

```env
FRONTEND_URL=https://healthcare-saas.com
VITE_API_URL=https://healthcare-saas.com/api
VITE_SOCKET_URL=https://healthcare-saas.com
```

Redeploy to apply changes.

## Project Structure

```
clinical-saas/
├── api/                          # Vercel Serverless Functions
│   ├── serverless.js             # Main API handler
│   ├── health.js                 # Health check
│   └── package.json              # API dependencies
├── apps/
│   ├── clinician-web/            # React Frontend
│   │   ├── src/
│   │   ├── dist/                 # Build output
│   │   └── package.json
│   └── api/                      # Full Express server (for local dev)
│       └── src/
│           └── healthcare-server.ts
├── infra/
│   └── database/
│       ├── unified-schema.sql    # Database schema
│       └── seed-data.sql         # Sample data
└── vercel.json                   # Vercel configuration
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Vercel Edge Network               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Frontend   │      │  API Serverless │ │
│  │  (Vite SPA)  │◄────►│   Functions     │ │
│  │              │      │                 │ │
│  └──────────────┘      └─────────────────┘ │
│         │                       │           │
└─────────┼───────────────────────┼───────────┘
          │                       │
          │                       ▼
          │              ┌─────────────────┐
          │              │  Neon Database  │
          │              │  (PostgreSQL)   │
          │              └─────────────────┘
          │
          ▼
    ┌──────────────┐
    │  Users       │
    │  (Browser)   │
    └──────────────┘
```

## Troubleshooting

### Build Fails

**Issue**: Frontend build fails

**Solutions**:
```bash
# Clear cache and rebuild
cd apps/clinician-web
rm -rf node_modules dist
npm install
npm run build
```

### API Returns 500

**Issue**: API endpoints returning 500 errors

**Check**:
1. Environment variables are set correctly
2. DATABASE_URL is valid
3. JWT_SECRET is set
4. Check Vercel function logs

**View logs**:
```bash
vercel logs your-project.vercel.app
```

### Database Connection Failed

**Issue**: Cannot connect to Neon database

**Solutions**:
1. Verify DATABASE_URL includes `?sslmode=require`
2. Check Neon project is not paused
3. Verify IP allowlist (if configured)
4. Test connection:

```bash
psql "postgresql://user:pass@host/db?sslmode=require" -c "SELECT NOW();"
```

### CORS Errors

**Issue**: Frontend can't call API

**Check**:
1. FRONTEND_URL environment variable matches actual domain
2. CORS headers in `vercel.json` are correct
3. API is deployed and accessible

### Routes Return 404

**Issue**: SPA routes return 404 on refresh

**Solution**: Verify `vercel.json` has correct rewrites:

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/apps/clinician-web/dist/index.html"
    }
  ]
}
```

### Environment Variables Not Working

**Issue**: New environment variables not applied

**Solution**:
```bash
# Pull latest env vars
vercel env pull

# Redeploy
vercel --prod
```

## Local Development

### Run Frontend Locally

```bash
cd apps/clinician-web
npm run dev
# Visit http://localhost:5173
```

### Run API Locally

```bash
cd apps/api
npm run dev
# API runs on http://localhost:3000
```

### Run with Vercel Dev

```bash
cd clinical-saas
vercel dev
# Full stack on http://localhost:3000
```

## Production Checklist

- [ ] Database schema deployed to Neon
- [ ] All environment variables set in Vercel
- [ ] Frontend builds successfully
- [ ] API health check returns 200
- [ ] Can register new user
- [ ] Can login
- [ ] JWT authentication works
- [ ] Database queries execute correctly
- [ ] CORS configured properly
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring setup (Vercel Analytics)

## Monitoring

### Enable Vercel Analytics

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics
3. View metrics: page views, performance, etc.

### Enable Logging

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --filter=/api/auth/login
```

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Project README**: `./README.md`
- **Frontend Guide**: `./FRONTEND_INTEGRATION_GUIDE.md`
- **Database Setup**: `./infra/database/README.md`
- **API Docs**: `./apps/clinician-web/API_CLIENT_DOCS.md`

## Next Steps

1. ✅ Deploy to production
2. ✅ Test all user workflows
3. ✅ Set up monitoring and alerts
4. ✅ Configure custom domain
5. ✅ Enable HTTPS (auto-configured by Vercel)
6. ✅ Set up CI/CD (auto-configured for GitHub)
7. ✅ Configure backup strategy for database
8. ✅ Implement error tracking (Sentry, LogRocket)
9. ✅ Set up uptime monitoring
10. ✅ Review security headers and CSP

## Success!

Your Healthcare SaaS application is now live on Vercel with:
- Full-stack architecture (Frontend + Backend API)
- Neon PostgreSQL database
- Secure authentication (JWT)
- Real-time features ready (Socket.IO compatible)
- Production-ready configuration
- Auto-scaling and CDN

🎉 **Congratulations on your deployment!**
