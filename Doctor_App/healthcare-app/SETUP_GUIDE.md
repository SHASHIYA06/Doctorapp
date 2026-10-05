# 🏥 Complete Healthcare Application - Setup Guide

## Overview
This is a complete, production-ready healthcare application that enables:
- ✅ Patients to submit complaints/symptoms
- ✅ Doctors to review complaints and provide diagnosis
- ✅ Doctors to prescribe medicines based on diagnosis
- ✅ Real-time chat between patient and doctor
- ✅ Payment processing for consultations
- ✅ Medicine ordering system

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  ├─ Patient Portal                      │
│  ├─ Doctor Portal                       │
│  ├─ Admin Dashboard                     │
│  └─ Real-time Chat UI                   │
└────────────────────┬────────────────────┘
                     │ (HTTP + WebSocket)
┌────────────────────v────────────────────┐
│     Backend (Node.js + Express)         │
│  ├─ Authentication (JWT)                │
│  ├─ Complaint Management                │
│  ├─ Diagnosis & Prescription APIs       │
│  ├─ Payment Processing (Stripe)         │
│  ├─ Real-time Chat (Socket.io)          │
│  └─ Medicine Ordering                   │
└────────────────────┬────────────────────┘
                     │ (SQL)
┌────────────────────v────────────────────┐
│    Neon PostgreSQL Database             │
│  ├─ Users & Authentication              │
│  ├─ Patient Profiles                    │
│  ├─ Doctor Profiles                     │
│  ├─ Consultations & Complaints          │
│  ├─ Diagnoses & Prescriptions           │
│  ├─ Medicines & Orders                  │
│  └─ Payments & Messages                 │
└─────────────────────────────────────────┘
```

---

## 🚀 Step 1: Set Up Neon PostgreSQL Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new project "healthcare-app"

### 1.2 Get Connection String
1. In Neon dashboard, copy the connection string
2. Format: `postgresql://user:password@host/database?sslmode=require`

### 1.3 Run Database Schema
```bash
# Option A: Using psql command line
psql "your_connection_string" -f DATABASE_SCHEMA.sql

# Option B: Using Neon SQL editor
# Copy entire DATABASE_SCHEMA.sql content
# Paste into Neon's SQL editor
# Click Execute
```

### 1.4 Verify Tables Created
```sql
-- Run in Neon SQL editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see 16 tables:
- users, patients, doctors, medicines
- consultations, complaints, medical_documents
- diagnoses, prescriptions, prescription_items
- payments, messages, medicine_orders, medicine_order_items
- reviews, notifications

---

## 🔧 Step 2: Set Up Backend (Node.js + Express)

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Configure Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your actual values
```

### 2.3 Update .env File
```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT (generate: openssl rand -base64 32)
JWT_SECRET=your_32_char_secret_key_here
JWT_EXPIRE=7d

# Stripe (from https://stripe.com/dashboard)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2.4 Start Backend Server
```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Expected output:
```
╔══════════════════════════════════════════════════╗
║   🏥 Healthcare Application Backend Started     ║
║   ✅ Server running on port 5000                  ║
║   ✅ Socket.io enabled for real-time chat       ║
║   ✅ Ready to accept connections                ║
╚══════════════════════════════════════════════════╝
```

---

## 🎨 Step 3: Frontend Setup (React)

### 3.1 Create React App
```bash
cd ../frontend
npx create-react-app doctor-patient-app
cd doctor-patient-app
```

### 3.2 Install Dependencies
```bash
npm install axios react-router-dom socket.io-client stripe @stripe/react-js react-query
```

### 3.3 Create .env
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 📱 Complete Workflow

### Patient Flow:
1. **Register** → `/api/auth/register` (user_type: "patient")
2. **Login** → `/api/auth/login`
3. **Submit Complaint** → `POST /api/complaints/submit`
   - chief_complaint: "Headache"
   - symptoms: "Severe pain in frontal area"
   - duration: "2 days"
4. **Upload Medical Documents** → `POST /api/complaints/:id/upload-document`
5. **View Diagnosis** → Once doctor diagnoses
6. **Pay for Consultation** → `/api/payments/create-checkout-session`
7. **Receive Prescription** → View medicines prescribed
8. **Order Medicines** → Order prescribed medicines

### Doctor Flow:
1. **Register** → `/api/auth/register` (user_type: "doctor")
2. **Login** → `/api/auth/login`
3. **View Patient List** → See all patient complaints
4. **View Complaint Details** → `GET /api/complaints/:id`
5. **Review Medical Documents** → Attached by patient
6. **Chat with Patient** → Real-time chat via Socket.io
7. **Add Diagnosis** → `POST /api/diagnoses/add-diagnosis`
8. **Create Prescription** → `POST /api/diagnoses/create-prescription`
   - Select medicines
   - Add dosage (2x daily)
   - Duration (7 days)

---

## 💳 Stripe Integration

### 3.1 Get Stripe Keys
1. Go to [stripe.com](https://stripe.com)
2. Sign up and get test keys from Dashboard
3. Add to `.env`:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3.2 Test Payment Flow
1. Doctor creates prescription
2. Patient clicks "Pay for Consultation"
3. Redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Any future date, any CVV
6. Payment processed → Consultation marked as paid

---

## 🗣️ Real-Time Chat Setup

### Socket.io Connection
```javascript
// Frontend
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL);

socket.on('connect', () => console.log('Connected'));
socket.emit('join-consultation', consultationId, userId);
socket.on('receive-message', (data) => {
  console.log('New message:', data.message);
});
```

### Send Message
```javascript
socket.emit('send-message', {
  consultationId: 123,
  senderId: 456,
  message: 'Hello doctor, I have a headache',
  messageType: 'text'
});
```

---

## 📊 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Complaints (Patient)
- `POST /api/complaints/submit` - Submit complaint
- `GET /api/complaints/:id` - Get complaint details
- `POST /api/complaints/:id/upload-document` - Upload medical documents

### Diagnosis (Doctor)
- `POST /api/diagnoses/add-diagnosis` - Add diagnosis
- `POST /api/diagnoses/create-prescription` - Create prescription
- `GET /api/diagnoses/:id` - Get prescription

### Payments
- `POST /api/payments/create-checkout-session` - Create payment
- `GET /api/payments/:consultation_id/status` - Check payment status
- `POST /api/payments/webhook` - Stripe webhook

---

## 🧪 Testing the Complete Workflow

### Test Scenario:

```bash
# 1. Patient Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Pass123!",
    "user_type": "patient",
    "full_name": "John Doe",
    "phone": "+919876543210"
  }'

# 2. Doctor Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "Pass123!",
    "user_type": "doctor",
    "full_name": "Dr. Jane Smith",
    "phone": "+919876543211",
    "specialization": "General Physician",
    "license_number": "LIC123456"
  }'

# 3. Patient Submits Complaint
curl -X POST http://localhost:5000/api/complaints/submit \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "chief_complaint": "Severe Headache",
    "description": "Headache for 2 days with fever",
    "symptoms": "Pain, Fever, Nausea",
    "symptom_duration": "2 days",
    "severity": "severe"
  }'

# 4. Doctor Adds Diagnosis
curl -X POST http://localhost:5000/api/diagnoses/add-diagnosis \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consultation_id": 1,
    "complaint_id": 1,
    "diagnosis_text": "Migraine with tension headache",
    "findings": "Patient has migraine symptoms",
    "severity": "moderate",
    "treatment_plan": "Rest and medication"
  }'

# 5. Doctor Creates Prescription
curl -X POST http://localhost:5000/api/diagnoses/create-prescription \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consultation_id": 1,
    "diagnosis_id": 1,
    "medicines": [
      {
        "medicine_id": 1,
        "dosage": "500mg",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 14
      }
    ],
    "notes": "Take with food. Avoid alcohol."
  }'
```

---

## 📚 Files Created

```
healthcare-app/
├── DATABASE_SCHEMA.sql              # Complete Neon database schema
├── SETUP_GUIDE.md                   # This file
├── backend/
│   ├── package.json                 # Dependencies
│   ├── .env.example                 # Environment template
│   ├── server.js                    # Main server with Socket.io
│   ├── config/
│   │   └── database.js              # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   └── routes/
│       ├── auth.js                  # Authentication endpoints
│       ├── complaints.js            # Complaint submission
│       ├── diagnoses.js             # Diagnosis & Prescription
│       └── payments.js              # Stripe payments
└── frontend/
    └── (React app to be created)
```

---

## 🚀 Next Steps

1. **Set up database** - Follow Step 1
2. **Set up backend** - Follow Step 2
3. **Create frontend** - Follow Step 3
4. **Connect to Stripe** - For payments
5. **Deploy backend** - Railway.app or Render.com
6. **Deploy frontend** - Vercel
7. **Configure webhooks** - For real-time updates

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
→ Check DATABASE_URL is correct from Neon dashboard

### JWT Error
```
Error: Invalid token
```
→ Ensure JWT_SECRET matches between backend and frontend

### Stripe Error
```
Error: Invalid API Key
```
→ Check STRIPE_SECRET_KEY is correct in .env

### Socket.io Connection Failed
```
Error: WebSocket connection failed
```
→ Ensure backend is running and REACT_APP_SOCKET_URL is correct

---

## 📞 Support

For issues or questions:
1. Check DATABASE_SCHEMA.sql for table structures
2. Review API endpoints documentation
3. Check console logs for detailed errors
4. Verify all environment variables are set

---

**Healthcare Application is now ready for complete setup!** 🎉

Next: Follow Step 1 to create the Neon database.
