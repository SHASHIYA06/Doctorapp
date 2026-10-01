# Healthcare App - Production Deployment Guide

## Overview

This guide covers deploying the complete healthcare application to production with:
- **Backend**: Railway or Render (Node.js + Express)
- **Frontend**: Vercel or Netlify (React + Vite)
- **Database**: Neon PostgreSQL (Serverless)
- **Storage**: AWS S3 (for medical documents)
- **Payments**: Stripe (Live Mode)

## Prerequisites

1. GitHub repository with code pushed
2. Neon PostgreSQL account (create if not exists)
3. Railway or Render account
4. Vercel account
5. Stripe Live account
6. AWS account (optional, for S3)

---

## Part 1: Database Setup (Neon PostgreSQL)

### 1. Create Neon Project

1. Go to [neon.tech](https://neon.tech)
2. Sign up or login
3. Create new project "healthcare-app-prod"
4. Choose region closest to your users
5. Copy connection string

### 2. Run Database Schema

1. In Neon console, open SQL Editor
2. Paste entire contents of `DATABASE_SCHEMA.sql`
3. Execute the SQL
4. Verify all 16 tables created

### 3. Save Connection String

```
postgresql://username:password@host/database?sslmode=require
```

Store securely - you'll need this for backend deployment.

---

## Part 2: Backend Deployment (Railway)

### Step 1: Connect GitHub Repository

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your repository
6. Select `healthcare-app/backend` as root directory

### Step 2: Configure Environment Variables

In Railway dashboard, go to Variables tab:

```env
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Authentication
JWT_SECRET=generate_random_32_character_string_here_use_openssl
JWT_EXPIRE=7d

# Stripe (Live Keys)
STRIPE_PUBLIC_KEY=pk_live_your_live_public_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Optional: AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=healthcare-app-prod

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Step 3: Generate JWT Secret

```bash
# On your local machine
openssl rand -base64 32
# Copy the output and paste into JWT_SECRET
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-5 minutes)
3. Get your backend URL: `https://your-backend-railway.app`
4. Test health endpoint: `https://your-backend-railway.app/api/health`

### Step 5: Verify Deployment

```bash
# Test from terminal
curl https://your-backend-railway.app/api/health

# Should return:
# {"status":"OK","message":"Healthcare Backend is running"}
```

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Login with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `healthcare-app/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables

In Vercel project settings → Environment Variables:

```env
VITE_API_URL=https://your-backend-railway.app/api
VITE_SOCKET_URL=https://your-backend-railway.app
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_public_key
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build (~3-5 minutes)
3. Get your frontend URL: `https://your-frontend.vercel.app`
4. Visit URL to verify deployment

### Step 4: Add Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your domain: `healthcare.yourdomain.com`
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (~5-10 minutes)

---

## Part 4: Configure Stripe Webhooks

### Step 1: Get Webhook URL

Your webhook endpoint:
```
https://your-backend-railway.app/api/payments/webhook
```

### Step 2: Create Webhook in Stripe Dashboard

1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Developers → Webhooks
3. Click "Add endpoint"
4. Enter endpoint URL: `https://your-backend-railway.app/api/payments/webhook`
5. Select event: `checkout.session.completed`
6. Copy Signing Secret
7. Update `STRIPE_WEBHOOK_SECRET` in Railway

### Step 3: Test Webhook

```bash
curl -X POST https://your-backend-railway.app/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: your_test_signature" \
  -d '{"type":"checkout.session.completed"}'
```

---

## Part 5: Database Seeding (Initial Data)

### Seed Medicines

Create `seed-medicines.sql`:

```sql
INSERT INTO medicines (name, generic_name, category, strength, dosage_form, price, stock, description) VALUES
('Aspirin', 'Acetylsalicylic acid', 'Analgesic', '500mg', 'Tablet', 50, 200, 'Pain reliever and blood thinner'),
('Amoxicillin', 'Amoxicillin trihydrate', 'Antibiotic', '500mg', 'Capsule', 150, 100, 'Beta-lactam antibiotic'),
('Metformin', 'Metformin hydrochloride', 'Antidiabetic', '500mg', 'Tablet', 100, 150, 'First-line diabetes medication'),
('Atorvastatin', 'Atorvastatin calcium', 'Statin', '10mg', 'Tablet', 200, 80, 'Cholesterol-lowering agent'),
('Lisinopril', 'Lisinopril dihydrate', 'ACE Inhibitor', '10mg', 'Tablet', 120, 120, 'Blood pressure medication'),
('Omeprazole', 'Omeprazole', 'PPI', '20mg', 'Capsule', 80, 110, 'Acid reflux treatment'),
('Albuterol', 'Albuterol sulfate', 'Bronchodilator', '100mcg', 'Inhaler', 300, 50, 'Asthma relief'),
('Ibuprofen', 'Ibuprofen', 'NSAID', '400mg', 'Tablet', 60, 200, 'Anti-inflammatory pain reliever'),
('Cefixime', 'Cefixime trihydrate', 'Antibiotic', '200mg', 'Capsule', 180, 90, 'Third-generation cephalosporin'),
('Doxycycline', 'Doxycycline hyclate', 'Antibiotic', '100mg', 'Capsule', 160, 110, 'Tetracycline antibiotic');
```

1. Open Neon SQL Editor
2. Paste and execute
3. Verify in medicines table

---

## Part 6: SSL/HTTPS Configuration

### For Backend (Railway)

- ✅ Automatic HTTPS (free)
- ✅ Auto-renewal
- ✅ Already configured

### For Frontend (Vercel)

- ✅ Automatic HTTPS
- ✅ Auto-renewal
- ✅ Can add custom domain with SSL

---

## Part 7: Production Security Checklist

### Backend
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] NODE_ENV=production
- [ ] Helmet middleware enabled
- [ ] CORS restricted to frontend domain
- [ ] Database has SSL enabled
- [ ] Stripe keys are LIVE keys
- [ ] Email credentials configured
- [ ] HTTPS enforced

### Frontend
- [ ] API URL points to production backend
- [ ] Stripe public key is LIVE key
- [ ] No API keys in code (all in .env)
- [ ] Build output is minified
- [ ] CSP headers set
- [ ] X-Frame-Options: DENY

### Database
- [ ] Backups enabled (Neon auto-backups daily)
- [ ] Read replicas set up (optional)
- [ ] Connection pooling optimized
- [ ] Indexes on all query columns

### Application
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Health check endpoint working

---

## Part 8: Monitoring & Logging

### Backend Logs

**Railway Dashboard:**
1. Select project
2. Click "Logs" tab
3. View real-time logs
4. Export logs for analysis

**Common Issues:**
- `Error: connect ECONNREFUSED` → Database connection failed
- `jwt malformed` → Invalid JWT token
- `Stripe: Invalid API Key` → Wrong Stripe keys
- `CORS error` → Frontend URL not whitelisted

### Frontend Monitoring

**Vercel Analytics:**
1. Go to project → Analytics
2. View page performance
3. Monitor bundle size
4. Check error tracking

**Browser DevTools:**
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests
- Check Application → LocalStorage for auth tokens

### Database Monitoring

**Neon Dashboard:**
1. Go to project → Monitoring
2. View connection count
3. Monitor query performance
4. Check storage usage
5. View recent backups

---

## Part 9: Performance Optimization

### Backend
```javascript
// Already implemented:
- Connection pooling (max 20)
- Query caching
- Gzip compression
- Response pagination
```

### Frontend
```javascript
// Already implemented:
- Code splitting
- Lazy loading
- Image optimization
- CSS minification
```

### Database
```sql
-- Already created:
- Indexes on foreign keys
- Indexes on frequently queried columns
- Connection pooling
```

---

## Part 10: Scaling Strategy

### Phase 1: Current Setup (0-1000 users)
- Railway backend (single instance)
- Vercel frontend (CDN global)
- Neon PostgreSQL (with auto-scaling)
- Works out of the box

### Phase 2: Growing (1000-10000 users)
- Railway: Add 2-3 backend instances
- Database: Enable read replicas
- Cache: Add Redis layer
- Storage: Move to AWS S3

### Phase 3: Enterprise (10000+ users)
- Backend: Kubernetes cluster
- Database: Managed PostgreSQL clusters
- Cache: Redis cluster
- CDN: CloudFlare
- Storage: S3 with CloudFront

---

## Part 11: Backup & Recovery

### Automated Backups
- **Neon**: Daily automated backups (7-day retention)
- **Database**: Point-in-time recovery available
- **Code**: GitHub repository (version control)

### Manual Backup (Monthly)

```bash
# Export database
PGPASSWORD='password' pg_dump -h host -U user database > backup.sql

# Export application files
tar -czf app-backup.tar.gz healthcare-app/

# Store in S3
aws s3 cp app-backup.tar.gz s3://backups/healthcare-app-$(date +%Y%m%d).tar.gz
```

### Restore Process

```bash
# Restore database
PGPASSWORD='password' psql -h host -U user database < backup.sql

# Restore files
tar -xzf app-backup.tar.gz
```

---

## Part 12: Continuous Deployment

### Auto-Deploy on Git Push

**Already configured:**
- Railway: Auto-deploys on git push to main
- Vercel: Auto-deploys on git push to main

**Manual deployment if needed:**

```bash
# Backend
cd healthcare-app/backend
railway up

# Frontend
cd healthcare-app/frontend
vercel --prod
```

---

## Part 13: Testing Production Environment

### 1. Test Authentication

```bash
# Register
curl -X POST https://your-backend/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@prod.com","password":"Test@123","firstName":"Test","lastName":"User","userType":"patient"}'

# Login
curl -X POST https://your-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@prod.com","password":"Test@123"}'
```

### 2. Test Patient Flow

1. Visit `https://your-frontend.vercel.app`
2. Register as patient
3. Login
4. Submit complaint
5. View complaint (should appear in list)

### 3. Test Doctor Flow

1. Register as doctor (with specialization)
2. Doctor dashboard shows pending consultations
3. Accept consultation
4. View patient profile
5. Add diagnosis
6. Create prescription

### 4. Test Payment Flow (Test Mode)

1. Create consultation (as patient)
2. Go to Payments
3. Click "Pay Now"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Enter any future expiry, any CVC
6. Payment should complete
7. Verify in Stripe Dashboard

### 5. Test Chat

1. Open two browser windows
2. Patient in one, Doctor in another
3. Join same consultation ID
4. Send messages
5. Messages should appear in real-time

---

## Part 14: Troubleshooting Deployment

### Backend Won't Start

**Check logs:**
```bash
# Railway
- Dashboard → Logs
- Look for error messages
```

**Common fixes:**
- ✅ DATABASE_URL format wrong → Check Neon connection string
- ✅ Port already in use → Railway handles this
- ✅ Missing environment variables → Check all vars set

### Frontend Shows Blank Page

**Check console (F12):**
- API URL errors → Verify VITE_API_URL
- CORS errors → Check backend CORS config
- Auth token errors → Login again

**Fix:**
```bash
# Rebuild locally
npm run build

# Deploy
vercel --prod
```

### Stripe Payments Not Working

**Check:**
- [ ] STRIPE_SECRET_KEY is LIVE key (pk_live_)
- [ ] STRIPE_WEBHOOK_SECRET is set
- [ ] Frontend uses pk_live_ key
- [ ] Webhook endpoint is reachable

**Test:**
```bash
# Stripe CLI test
stripe trigger payment_intent.succeeded
```

### Database Connection Issues

**Check:**
- [ ] DATABASE_URL format: `postgresql://user:pass@host/db?sslmode=require`
- [ ] Neon project is active
- [ ] Connection not exhausted (max 20)

**Verify:**
```bash
# From backend server
psql $DATABASE_URL -c "SELECT 1;"
```

---

## Part 15: Post-Deployment Checklist

Production Ready Verification:

- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Database schema created in Neon
- [ ] Environment variables set in both services
- [ ] HTTPS working on both domains
- [ ] Authentication test passed
- [ ] Patient flow test passed
- [ ] Doctor flow test passed
- [ ] Payment test passed (test mode)
- [ ] Chat test passed
- [ ] Stripe webhook configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Domain SSL certificates valid
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] Error handling working
- [ ] Logs accessible
- [ ] Team has deployment access

---

## Production URLs Template

```
Frontend:     https://healthcare.yourdomain.com
Backend API:  https://api.healthcare.yourdomain.com
Health Check: https://api.healthcare.yourdomain.com/api/health
Webhook:      https://api.healthcare.yourdomain.com/api/payments/webhook
```

---

## Support & Escalation

### For Critical Issues

**Status Pages:**
- Railway: [status.railway.app](https://status.railway.app)
- Vercel: [status.vercel.com](https://status.vercel.com)
- Neon: [status.neon.tech](https://status.neon.tech)
- Stripe: [status.stripe.com](https://status.stripe.com)

**Contact:**
- Railway Support: support@railway.app
- Vercel Support: support@vercel.com
- Neon Support: support@neon.tech
- Stripe Support: support@stripe.com

---

## Cost Estimation (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Railway Backend | Hobby | $5-20 |
| Neon Database | Pro | $15-50 |
| Vercel Frontend | Pro | $20 |
| Stripe | Per transaction | 2.9% + $0.30 |
| AWS S3 (optional) | Standard | $0.023/GB |
| **Total (estimated)** | | **$50-100+** |

---

## Next Steps

1. ✅ Follow this guide step-by-step
2. ✅ Test all functionality
3. ✅ Set up monitoring
4. ✅ Configure alerts
5. ✅ Plan scaling strategy
6. ✅ Document your production setup
7. ✅ Train team on deployment process
8. ✅ Regular security audits

---

**Deployment Status: READY FOR PRODUCTION** ✅

Date: September 2026
Version: 1.0.0
