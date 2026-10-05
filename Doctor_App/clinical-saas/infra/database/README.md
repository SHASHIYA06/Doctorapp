# Healthcare SaaS Database Setup Guide

## Overview

This directory contains the unified database schema for the Healthcare SaaS application, combining the Clinical SaaS and Healthcare App functionality.

## Files

- **unified-schema.sql** - Complete database schema with 16 tables
- **seed-data.sql** - Sample data for testing and development
- **README.md** - This file

## Database Structure

### Core Tables (16)

1. **users** - Base authentication and user information
2. **patients** - Patient profile data
3. **doctors** - Doctor profile and practice information
4. **medicines** - Medicine catalog
5. **consultations** - Consultation appointments
6. **complaints** - Patient complaints/symptoms
7. **medical_documents** - Uploaded medical files
8. **diagnoses** - Doctor's diagnosis records
9. **prescriptions** - Prescription records
10. **prescription_items** - Individual medicines in prescriptions
11. **payments** - Payment transactions
12. **messages** - Real-time chat messages
13. **medicine_orders** - Medicine order records
14. **medicine_order_items** - Items in medicine orders
15. **reviews** - Doctor ratings and reviews
16. **notifications** - User notifications

## Setup Instructions

### Option 1: Using Neon Console (Recommended for Vercel)

1. **Login to Neon Console**
   - Go to https://console.neon.tech/
   - Login with your account

2. **Select Your Project**
   - Choose your existing project (already connected to Vercel)

3. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

4. **Run Schema**
   ```sql
   -- Copy and paste the entire content of unified-schema.sql
   -- Click "Run" to execute
   ```

5. **Run Seed Data (Optional)**
   ```sql
   -- Copy and paste the entire content of seed-data.sql
   -- Click "Run" to execute
   ```

### Option 2: Using Command Line (psql)

```bash
# Connect to your Neon database
psql "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Run schema
\i unified-schema.sql

# Run seed data (optional)
\i seed-data.sql
```

### Option 3: Using Node.js Script

Create a setup script:

```javascript
import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    // Read schema file
    const schema = fs.readFileSync('./unified-schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Schema created successfully');

    // Read seed data file
    const seedData = fs.readFileSync('./seed-data.sql', 'utf8');
    await pool.query(seedData);
    console.log('✅ Seed data inserted successfully');

    await pool.end();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
```

## Environment Variables

Make sure your `.env` file contains:

```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Verification

After setup, verify tables were created:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check row counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'medicines', COUNT(*) FROM medicines
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations;
```

## Features

### Automatic Timestamps
- All tables with `updated_at` columns have triggers to auto-update on modification

### Performance Indexes
- 30+ indexes for optimized queries
- Covering key foreign keys and frequently queried columns

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values
- Unique constraints prevent duplicates

### Security
- Password hashes (never store plain text passwords)
- User type verification
- Cascading deletes where appropriate

## Sample Credentials (from seed data)

**Patients:**
- patient1@example.com / Test@123
- patient2@example.com / Test@123

**Doctors:**
- doctor1@example.com / Test@123 (Cardiology)
- doctor2@example.com / Test@123 (General Medicine)
- doctor3@example.com / Test@123 (Pediatrics)

**Admin:**
- admin@example.com / Test@123

> ⚠️ **Note:** Change these credentials in production!

## Next Steps

1. ✅ Run unified-schema.sql in Neon console
2. ✅ (Optional) Run seed-data.sql for test data
3. ✅ Update your Vercel environment variables with DATABASE_URL
4. ✅ Test API connectivity with `/api/health` endpoint

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Permission Issues
```sql
-- Grant permissions if needed
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Reset Database (⚠️ Danger)
```sql
-- Drop all tables (use with caution!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO your_user;
```

## Support

For issues, contact the development team or check:
- Neon Documentation: https://neon.tech/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
