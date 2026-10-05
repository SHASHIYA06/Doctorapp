# Database Setup Guide for Doctor App

**Status:** Production-Ready  
**Tested Database:** PostgreSQL 14+  
**ORM Support:** Raw SQL, Prisma (optional)  

---

## 🗄️ Quick Database Comparison

| Feature | Neon | Supabase | Railway | Render |
|---------|------|----------|---------|--------|
| **Type** | Serverless PostgreSQL | PostgreSQL + Auth | PostgreSQL | PostgreSQL |
| **Free Tier** | 0.5 project, 1GB | 500MB | $5/month credit | 512MB |
| **Vercel Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Scaling** | Automatic | Automatic | Auto | Auto |
| **Backup** | Yes | Yes | Yes | Yes |
| **Connection Pooling** | Yes | Yes | Yes | Yes |
| **Cost (Scale)** | Reasonable | Reasonable | Cheap | Cheap |

**Recommendation for Production:** **Neon** (best Vercel integration)

---

## 🚀 Option 1: Neon (Recommended)

### Step 1: Create Neon Project
1. Go to [neon.tech](https://neon.tech)
2. Sign up or log in
3. Click "Create a new project"
4. Select:
   - **Database Name:** `clinical_saas`
   - **Region:** Closest to your users
   - **PostgreSQL Version:** Latest
5. Click "Create project"

### Step 2: Get Connection String
1. Click "Dashboard"
2. Find your project
3. Click "Connection string"
4. Select "Node.js" driver
5. Copy the connection string

**Connection String Example:**
```
postgresql://neondb_owner:xxxxxxxxxxxx@ep-silent-mountain-xxxxx.us-east-2.neon.tech/clinical_saas?sslmode=require
```

### Step 3: Add to Vercel
1. Go to Vercel Project Settings
2. Go to "Environment Variables"
3. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon connection string
   - **Environments:** Production, Preview, Development

### Step 4: Initialize Database

**Option A: Using SQL Script**
```sql
-- Copy and run this in Neon Console → SQL Editor

-- Create schema
CREATE SCHEMA clinical_saas;

-- Create doctors table
CREATE TABLE clinical_saas.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  specialty VARCHAR(100),
  hospital VARCHAR(255),
  license_number VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create patients table
CREATE TABLE clinical_saas.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_type VARCHAR(5),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  medical_history TEXT,
  allergies TEXT,
  emergency_contact VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  insurance_provider VARCHAR(255),
  insurance_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE clinical_saas.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES clinical_saas.patients(id),
  doctor_id UUID NOT NULL REFERENCES clinical_saas.doctors(id),
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration_days INT,
  instructions TEXT,
  status VARCHAR(20) DEFAULT 'active',
  issued_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  refills_remaining INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create medical_reports table
CREATE TABLE clinical_saas.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES clinical_saas.patients(id),
  doctor_id UUID NOT NULL REFERENCES clinical_saas.doctors(id),
  report_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  findings JSONB,
  ai_analysis JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create consultations table
CREATE TABLE clinical_saas.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES clinical_saas.patients(id),
  doctor_id UUID NOT NULL REFERENCES clinical_saas.doctors(id),
  consultation_date TIMESTAMP NOT NULL,
  consultation_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  duration_minutes INT,
  notes TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE clinical_saas.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cds_recommendations table
CREATE TABLE clinical_saas.cds_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES clinical_saas.patients(id),
  doctor_id UUID NOT NULL REFERENCES clinical_saas.doctors(id),
  recommendation_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  confidence_score INT,
  evidence_level VARCHAR(20),
  actionable_items JSONB,
  risk_factors JSONB,
  references JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_doctors_email ON clinical_saas.doctors(email);
CREATE INDEX idx_patients_email ON clinical_saas.patients(email);
CREATE INDEX idx_prescriptions_patient ON clinical_saas.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON clinical_saas.prescriptions(doctor_id);
CREATE INDEX idx_reports_patient ON clinical_saas.medical_reports(patient_id);
CREATE INDEX idx_consultations_patient ON clinical_saas.consultations(patient_id);
CREATE INDEX idx_messages_sender ON clinical_saas.messages(sender_id);
CREATE INDEX idx_cds_patient ON clinical_saas.cds_recommendations(patient_id);

-- Set schema search path
ALTER DATABASE clinical_saas SET search_path TO clinical_saas, public;
```

**Option B: Using Prisma (if installed)**
```bash
# Initialize Prisma
npx prisma init

# Add DATABASE_URL to .env
# Update schema.prisma with your models
# Run migrations
npx prisma migrate deploy
```

---

## 🔌 Option 2: Supabase

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New project"
3. Fill in:
   - **Project name:** `clinical-saas`
   - **Password:** Strong password
   - **Region:** Closest to users
4. Click "Create new project" (wait for setup)

### Step 2: Get Connection String
1. Go to "Settings" → "Database"
2. Find "Connection string"
3. Select "Connection pooler"
4. Copy connection string

### Step 3: Run SQL Setup
1. Go to "SQL Editor"
2. Paste the SQL script from Option 1 above
3. Click "Run"

### Step 4: Add to Vercel
Same as Neon (see Option 1, Step 3)

**Supabase Advantages:**
- Built-in authentication
- Real-time subscriptions
- File storage (for documents)
- Auto-generated APIs

---

## 🚄 Option 3: Railway

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "Start New Project"
3. Select "PostgreSQL"
4. Railway creates database automatically

### Step 2: Get Connection URL
1. Click on PostgreSQL plugin
2. Go to "Connect" tab
3. Copy "DatabaseURL"

### Step 3: Add to Vercel
1. Vercel Settings → Environment Variables
2. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Railway connection URL

### Step 4: Run Migrations
```bash
# Run SQL script via command line
psql $DATABASE_URL < schema.sql

# Or use Prisma
npx prisma migrate deploy
```

---

## 🎨 Option 4: Render

### Step 1: Create PostgreSQL Database
1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "PostgreSQL"
4. Configure:
   - **Name:** `clinical-saas`
   - **Database:** `clinical_saas`
   - **User:** Leave default
   - **Region:** Select region
5. Click "Create Database"

### Step 2: Get Connection String
1. Go to database details
2. Copy "External Database URL"

### Step 3: Add to Vercel
1. Vercel Settings → Environment Variables
2. Add `DATABASE_URL` with Render connection string

### Step 4: Initialize
```bash
# Connect and run migrations
psql [your-render-connection-string] < schema.sql
```

---

## 📊 Database Schema Overview

### Core Tables

```sql
-- Doctors (Clinicians)
doctors
├── id (UUID, PK)
├── name, email, specialty
├── license_number, hospital
└── timestamps

-- Patients
patients
├── id (UUID, PK)
├── name, email, phone
├── medical_history, allergies
├── vital information
└── insurance details

-- Prescriptions
prescriptions
├── id (UUID, PK)
├── patient_id, doctor_id (FKs)
├── medication, dosage, frequency
├── status, dates
└── refill tracking

-- Medical Reports
medical_reports
├── id (UUID, PK)
├── patient_id, doctor_id (FKs)
├── report_type (blood_test, x_ray, etc)
├── findings, ai_analysis (JSONB)
└── file_url

-- Consultations
consultations
├── id (UUID, PK)
├── patient_id, doctor_id (FKs)
├── datetime, type (online/offline)
├── video_url, notes
└── status

-- Messages
messages
├── id (UUID, PK)
├── sender_id, receiver_id
├── message_text, attachments
├── is_read flag
└── timestamp

-- CDS Recommendations
cds_recommendations
├── id (UUID, PK)
├── patient_id, doctor_id (FKs)
├── type, title, confidence
├── actionable_items (JSONB)
└── evidence data
```

---

## 🔑 Environment Variable Format

```
# PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Components:
# username: database user
# password: database password
# host: database server address
# port: usually 5432
# database: database name
# sslmode: require for production

# Examples:
# Neon: postgresql://neondb_owner:xxx@ep-xxx.us-east-2.neon.tech/clinical_saas?sslmode=require
# Supabase: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
# Railway: postgresql://postgres:password@containers-us-west-xxx.railway.app:7103/railway
# Render: postgresql://user:password@dpg-xxx.render.com/clinical_saas
```

---

## ✅ Testing Database Connection

### Option 1: Using Node.js
```javascript
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
```

### Option 2: Using psql CLI
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Option 3: Using Vercel Logs
- Deploy to Vercel
- Check Vercel logs for connection status
- Look for SQL query results

---

## 🔒 Security Best Practices

### Connection String Security
✅ DO:
- Store in Vercel environment variables
- Use connection pooling
- Enable SSL mode
- Rotate passwords regularly
- Use strong passwords (32+ chars)

❌ DON'T:
- Hardcode in source code
- Commit to git
- Share in Slack/email
- Use weak passwords
- Disable SSL

### Database Permissions
```sql
-- Create app user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant minimal necessary permissions
GRANT CONNECT ON DATABASE clinical_saas TO app_user;
GRANT USAGE ON SCHEMA clinical_saas TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA clinical_saas TO app_user;
```

### Backups
- **Neon:** Automatic (7 days retention)
- **Supabase:** Automatic (daily)
- **Railway:** Manual required
- **Render:** Manual required

**Setup backups for Railway/Render:**
```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
```

---

## 📈 Performance Optimization

### Connection Pooling
```
-- PgBouncer configuration (if needed)
max_connections = 1000
default_pool_size = 25
reserve_pool_size = 5
```

### Query Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_reports_date ON medical_reports(created_at DESC);

-- ANALYZE for query planner
ANALYZE;
```

### Connection Management
```javascript
// Node.js connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 🆘 Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED
Solution:
- Check DATABASE_URL is correct
- Verify IP whitelist (for Railway/Render)
- Check SSL mode setting
```

### Too Many Connections
```
Error: too many connections
Solution:
- Enable connection pooling
- Reduce max_connections in pool config
- Close idle connections
```

### Slow Queries
```
Solution:
- Add missing indexes
- Run ANALYZE
- Check query plans with EXPLAIN
- Optimize N+1 queries
```

---

## 📞 Support Links

- **Neon:** [neon.tech/docs](https://neon.tech/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Render:** [render.com/docs](https://render.com/docs)
- **PostgreSQL:** [postgresql.org/docs](https://www.postgresql.org/docs/)

---

## ✨ Next Steps

1. **Choose Database:** Pick from options above
2. **Create Instance:** Follow provider's setup
3. **Run Schema:** Execute SQL script
4. **Add to Vercel:** Set environment variables
5. **Test:** Verify connection works
6. **Deploy:** Push to production

**Total Setup Time:** ~10-15 minutes

---

**Database Setup Guide Version:** 1.0.0  
**Last Updated:** January 30, 2024  
**Status:** ✅ Ready to Deploy
