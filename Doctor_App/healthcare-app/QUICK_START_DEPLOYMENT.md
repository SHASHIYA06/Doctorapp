# Quick Start: Deploy to Production in 30 Minutes

## Pre-Deployment (5 mins)

### 1. Gather Credentials
- [ ] Neon PostgreSQL connection string
- [ ] Railway/Render API token
- [ ] Vercel access token
- [ ] Stripe Live keys (pk_live_, sk_live_)
- [ ] OpenSSL for JWT secret generation

```bash
# Generate JWT secret
openssl rand -base64 32
# Save this value
```

---

## Deploy Backend (10 mins)

### Option A: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project in backend directory
cd healthcare-app/backend
railway init

# 4. Create database variable
railway variables set DATABASE_URL "your-neon-connection-string"

# 5. Set environment variables
railway variables set NODE_ENV production
railway variables set PORT 5000
railway variables set JWT_SECRET "your-generated-secret"
railway variables set STRIPE_SECRET_KEY "sk_live_..."
railway variables set STRIPE_PUBLIC_KEY "pk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET "whsec_..."
railway variables set FRONTEND_URL "https://your-frontend-url.vercel.app"

# 6. Deploy
railway up

# 7. Get backend URL
railway status
# Copy your service URL like: https://healthcare-app-prod-xxx.railway.app
```

### Option B: Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Select root directory: `healthcare-app/backend`
5. Set environment variables (same as above)
6. Click "Deploy"
7. Wait 3-5 minutes
8. Copy your service URL from dashboard

### Verify Backend
```bash
curl https://your-backend-url/api/health
# Should return: {"status":"OK","message":"Healthcare Backend is running"}
```

---

## Deploy Frontend (10 mins)

### Step 1: Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Authenticate
vercel login

# 3. Deploy
cd healthcare-app/frontend
vercel --prod

# 4. When prompted for settings:
#    - Framework: Vite
#    - Root directory: ./
#    - Build command: npm run build
#    - Output directory: dist
```

### Step 2: Set Environment Variables in Vercel

```bash
vercel env add VITE_API_URL
# Enter: https://your-backend-url/api

vercel env add VITE_SOCKET_URL
# Enter: https://your-backend-url

vercel env add VITE_STRIPE_PUBLIC_KEY
# Enter: pk_live_...

# Redeploy with new variables
vercel --prod
```

### Verify Frontend
- Open `https://your-frontend-url.vercel.app`
- Should see login page
- No console errors

---

## Configure Stripe Webhook (5 mins)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → Webhooks → "Add endpoint"
3. URL: `https://your-backend-url/api/payments/webhook`
4. Events: `checkout.session.completed`
5. Copy Signing Secret
6. Set in Railway/Render as `STRIPE_WEBHOOK_SECRET`

---

## Test End-to-End (5 mins)

### 1. Test Login
```bash
curl -X POST https://your-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"Test@123"}'

# Should return JWT token
```

### 2. Test Frontend
1. Visit `https://your-frontend.vercel.app`
2. Click "Sign in"
3. Enter: `patient@test.com` / `Test@123`
4. Should redirect to dashboard

### 3. Test API
1. Get token from step 1
2. Test API endpoint:
```bash
curl -X GET https://your-backend/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return user profile
```

---

## Troubleshooting

### Backend shows "Service Unavailable"
- Check DATABASE_URL is correct
- Check all env variables are set
- Check logs in Railway/Render dashboard

### Frontend shows blank page
- Check browser console (F12)
- Verify VITE_API_URL in Vercel env vars
- Run `vercel env pull` locally to check vars

### Login fails
- Check backend is running: `curl backend-url/api/health`
- Check CORS is configured
- Check JWT_SECRET is set

### Payment fails
- Check Stripe keys are LIVE (pk_live_, sk_live_)
- Check webhook is registered
- Check webhook secret is set

---

## Production URLs

After deployment, you'll have:

```
Frontend:  https://your-app.vercel.app
Backend:   https://healthcare-app-prod-xxx.railway.app
           (or your-app.onrender.com)
```

Share these with your team!

---

## Access Control

### Who can deploy?
- Backend: Add SSH key to Railway/Render account
- Frontend: Add GitHub to Vercel account

### Environment Variables
- Never commit .env files
- Store in dashboard (Railway/Render/Vercel)
- Rotate secrets monthly

---

## Next Steps

1. ✅ Visit [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup
2. ✅ Set up monitoring
3. ✅ Configure backups
4. ✅ Run security audit
5. ✅ Load test the application
6. ✅ Plan scaling

---

## Support

- Backend issues → Check Railway/Render logs
- Frontend issues → Check Vercel logs + browser console
- Database issues → Check Neon logs
- Payment issues → Check Stripe webhook logs

---

**Status: DEPLOYMENT COMPLETE** ✅

Now your healthcare app is live and ready for patients!
