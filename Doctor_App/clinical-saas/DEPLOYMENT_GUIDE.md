# Doctor App - Vercel Deployment Guide

**Status:** Ready for Vercel Deployment  
**Last Updated:** January 30, 2024  
**Version:** 1.0.0

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] TypeScript compilation successful
- [x] No ESLint errors
- [x] All components tested locally
- [x] Git repository initialized and pushed to GitHub
- [x] Commit history clean

### ✅ Configuration
- [x] Environment variables documented (.env.example)
- [x] vercel.json configuration created
- [x] Build commands verified
- [x] API routes configured

### ⚠️ To Complete Before Deployment

1. **Database Setup** (see Database Selection section below)
2. **Environment Variables** (configure in Vercel dashboard)
3. **API Keys** (Gemini API, etc.)
4. **Domain Configuration** (if using custom domain)

---

## 🚀 Quick Start: Deploy to Vercel

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub account (SHASHIYA06)
3. Click "New Project"
4. Select repository: `SHASHIYA06/Doctorapp`
5. Configure project:
   - **Framework:** Vite (auto-detected)
   - **Build Command:** `pnpm build` (pre-configured)
   - **Output Directory:** `apps/clinician-web/dist`
   - **Install Command:** `pnpm install --frozen-lockfile`

### Step 2: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Frontend Variables (all environments)
```
VITE_API_BASE_URL=https://your-api.vercel.app
VITE_APP_NAME=Doctor App
```

#### Backend Variables (production only)
```
DATABASE_URL=your_database_url_here
GEMINI_API_KEY=your_gemini_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
```

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Verify deployment: Check the provided URL

---

## 🗄️ Database Selection & Setup

### Recommended: PostgreSQL

#### Option 1: **Neon (Recommended for Vercel)**

**Pros:**
- Serverless PostgreSQL
- Perfect integration with Vercel
- Free tier available (0.5 project with 1GB storage)
- Scales automatically
- Point-in-time restore

**Setup:**
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create new project
3. Copy connection string (DATABASE_URL)
4. Add to Vercel environment variables

**Connection String Format:**
```
postgresql://username:password@ep-xxx.us-east-2.neon.tech/dbname?sslmode=require
```

#### Option 2: **Supabase**

**Pros:**
- PostgreSQL + Auth + Realtime + Storage
- Free tier (500MB storage, 2GB bandwidth)
- Built-in authentication
- Real-time capabilities

**Setup:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add to Vercel environment variables

#### Option 3: **Railway**

**Pros:**
- Simple deployment
- Good free tier ($5/month credit)
- Pay-per-use pricing
- Works well with Vercel

**Setup:**
1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Add to Vercel

#### Option 4: **Render**

**Pros:**
- Free PostgreSQL tier (512MB)
- Auto-pauses free tier (no cost)
- Easy setup

**Setup:**
1. Go to [render.com](https://render.com)
2. Create PostgreSQL instance
3. Copy database URL
4. Add to Vercel

### Database Schema Setup

After choosing database, run migrations:

```bash
# Install migration tool
pnpm add -D prisma

# Or use raw SQL files in infra/migrations/
```

**Current schema supports:**
- Doctors (clinicians)
- Patients
- Prescriptions
- Medical Reports
- Consultations
- Messages/Communications
- CDS Recommendations

---

## 🔐 Environment Variables for Vercel

### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Production |
| `GEMINI_API_KEY` | From Google AI Studio | Production |
| `JWT_SECRET` | Random 32+ char string | Production |
| `NODE_ENV` | `production` | Production |
| `VITE_API_BASE_URL` | Your API domain | All |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `SENDGRID_API_KEY` | Email notifications |
| `STRIPE_SECRET_KEY` | Payment processing |
| `TWILIO_ACCOUNT_SID` | SMS/Voice features |
| `SENTRY_DSN` | Error tracking |

---

## 🔑 Obtaining API Keys

### Gemini API Key (Required for CDS)

1. Go to [Google AI Studio](https://ai.google.dev/tutorials/setup)
2. Click "Get API Key"
3. Create new API key
4. Add to Vercel environment variables as `GEMINI_API_KEY`

**Limit:** Free tier has rate limits. Contact Google for production limits.

### Other Optional Keys

**SendGrid (Email):**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to environment variables

**Stripe (Payments):**
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard
3. Add to environment variables

**Twilio (SMS/Voice):**
1. Sign up at [twilio.com](https://twilio.com)
2. Get credentials from Console
3. Add to environment variables

---

## 📊 Architecture After Deployment

```
┌─────────────────────────────────────────┐
│         Vercel Frontend                 │
│    (React + TypeScript + Vite)          │
│  - Doctor Dashboard (clinician-web)     │
│  - Patient Interface (patient-web)      │
│  - Static hosting                       │
└────────────┬────────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────┐
│       Vercel API Functions              │
│    (Node.js Serverless Functions)       │
│  - /api/patients                        │
│  - /api/prescriptions                   │
│  - /api/reports                         │
│  - /api/cds (Clinical Decision Support) │
│  - /api/consultations                   │
│  - /api/messages                        │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│      Database (Neon/Supabase/etc)       │
│         PostgreSQL                      │
│  - Patient records                      │
│  - Medical history                      │
│  - Prescriptions                        │
│  - Reports                              │
│  - User data                            │
└─────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│     External Services                   │
│  - Gemini AI (CDS)                      │
│  - SendGrid (Email)                     │
│  - Stripe (Payments)                    │
│  - Twilio (SMS/Voice)                   │
└─────────────────────────────────────────┘
```

---

## ✅ Deployment Steps Summary

### Step 1: Database
- [ ] Choose database (Neon recommended)
- [ ] Create database instance
- [ ] Get connection string
- [ ] Copy to Vercel environment

### Step 2: API Keys
- [ ] Generate Gemini API key
- [ ] Add to Vercel environment variables
- [ ] Generate JWT secret (use: `openssl rand -base64 32`)
- [ ] Add to Vercel environment

### Step 3: Vercel Setup
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy

### Step 4: Verification
- [ ] Check Vercel deployment status
- [ ] Test frontend (should load)
- [ ] Test API endpoints
- [ ] Monitor logs for errors

### Step 5: Post-Deployment
- [ ] Test database connection
- [ ] Verify Gemini API integration
- [ ] Test authentication
- [ ] Run smoke tests
- [ ] Monitor performance

---

## 🧪 Testing Deployment

### Frontend Testing
```bash
# After deployment, test these URLs:
https://your-app.vercel.app/
https://your-app.vercel.app/dashboard
https://your-app.vercel.app/patients
```

### API Testing
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/patients
curl https://your-app.vercel.app/api/health
```

### Database Testing
```bash
# Check if database queries work
# This will be visible in Vercel logs
```

---

## 📈 Monitoring & Observability

### Vercel Dashboard
- Real-time deployment logs
- Performance metrics
- Error tracking
- Environment variables management

### Log Monitoring
1. Go to Vercel Project Settings → Logs
2. View real-time logs
3. Search for errors

### Performance Metrics
- Monitor in Vercel Analytics
- Check:
  - Frontend Performance (TTFB, FCP, LCP)
  - API response times
  - Database query performance

---

## 🚨 Troubleshooting

### Build Failures

**Error: "Cannot find module"**
```bash
# Solution: Ensure dependencies are properly declared
pnpm install
pnpm build --verbose
```

**Error: "TypeScript compilation failed"**
```bash
# Solution: Fix type errors
pnpm type-check
```

### Runtime Errors

**Error: "Database connection failed"**
- Check DATABASE_URL format
- Verify network access is allowed
- Check connection pooling settings

**Error: "Gemini API not working"**
- Verify API key is correct
- Check rate limits
- Ensure API is enabled in Google Cloud

### Performance Issues

**Slow page loads:**
- Check Vercel Analytics
- Optimize images and bundles
- Enable caching headers

**API timeout:**
- Increase serverless function timeout
- Optimize database queries
- Add pagination to large endpoints

---

## 🔒 Security Checklist

Before going to production:

- [ ] All API keys in environment variables (not in code)
- [ ] HTTPS enabled (Vercel default)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all APIs
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS protection enabled
- [ ] JWT tokens secure
- [ ] Database backups configured
- [ ] Audit logging enabled
- [ ] HIPAA compliance verified (if applicable)

---

## 📞 Support & Resources

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Deployment Guide](https://vercel.com/docs/concepts/deployments/overview)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Database Documentation
- [Neon Docs](https://neon.tech/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)

### Other Resources
- [Gemini API Docs](https://ai.google.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

---

## ✨ Next Steps After Deployment

1. **Monitor Performance**
   - Set up error tracking (Sentry)
   - Monitor analytics (PostHog)
   - Track user behavior

2. **Enable Features**
   - Real-time messaging (WebSockets)
   - Video consultations
   - Advanced CDS

3. **Scale Application**
   - Add more databases/replicas
   - Implement caching (Redis)
   - CDN for static assets

4. **Enhance Security**
   - Add authentication flow
   - Implement RBAC
   - Set up automated backups

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** January 30, 2024  
**Status:** ✅ Ready for Deployment
