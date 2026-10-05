# Healthcare App Backend - Setup Guide

## Prerequisites

- Node.js v16+ and npm
- PostgreSQL database (Neon PostgreSQL recommended)
- Stripe account for payments
- Environment variables configured

## Installation Steps

### 1. Install Dependencies

```bash
cd healthcare-app/backend
npm install
```

### 2. Database Setup (Neon PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project named `healthcare-app`
3. Copy the connection string (looks like `postgresql://user:password@host/database`)
4. Add to `.env` file as `DATABASE_URL`

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

**Required Configuration:**

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# Stripe Payments
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional: AWS S3 for documents
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=healthcare-app-documents
```

### 4. Initialize Database Schema

Option A: Using Neon Console (Recommended for first-time setup)

1. Go to Neon console
2. Open SQL Editor
3. Copy and paste content from `DATABASE_SCHEMA.sql`
4. Execute

Option B: Using psql client

```bash
psql postgresql://user:password@host/database < DATABASE_SCHEMA.sql
```

### 5. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new patient/doctor
- `POST /login` - Login and get JWT token
- `GET /me` - Get current user profile (requires auth)
- `PUT /profile` - Update profile
- `POST /logout` - Logout

### Complaints Routes (`/api/complaints`)
- `POST /submit` - Patient submits complaint
- `GET /my-complaints` - Patient views their complaints
- `GET /assigned` - Doctor views assigned complaints
- `GET /:complaintId` - Get complaint details
- `POST /:complaintId/upload-document` - Upload medical document
- `GET /:complaintId/documents` - Get complaint documents
- `PUT /:complaintId/assign-doctor` - Assign doctor to complaint

### Diagnoses Routes (`/api/diagnoses`)
- `POST /add-diagnosis` - Doctor adds diagnosis
- `GET /consultation/:consultationId` - Get diagnosis for consultation
- `PUT /:diagnosisId` - Update diagnosis
- `GET /doctor/patients-list` - Get doctor's patient list
- `GET /doctor/consultations` - Get doctor's consultations

### Medicines Routes (`/api/medicines`)
- `GET /` - List all medicines (with search/filter)
- `GET /:medicineId` - Get single medicine
- `POST /` - Add medicine (admin only)
- `PUT /:medicineId` - Update medicine (admin only)
- `DELETE /:medicineId` - Delete medicine (admin only)
- `GET /category/:category` - Get medicines by category
- `GET /admin/low-stock` - Low stock alert (admin only)

### Prescriptions Routes (`/api/prescriptions`)
- `POST /create` - Create prescription with medicines
- `GET /:prescriptionId` - Get prescription details
- `GET /patient/my-prescriptions` - Get patient's prescriptions
- `GET /:prescriptionId/details` - Get full prescription details
- `PUT /item/:itemId` - Update prescription item
- `DELETE /item/:itemId` - Delete prescription item

### Payments Routes (`/api/payments`)
- `POST /create-checkout-session` - Create Stripe checkout
- `POST /webhook` - Stripe webhook handler
- `GET /:consultationId/status` - Get payment status
- `GET /:consultationId/details` - Get payment details
- `GET /admin/all-payments` - Get all payments (admin)
- `GET /admin/revenue-stats` - Get revenue statistics (admin)

### Consultations Routes (`/api/consultations`)
- `GET /patient/my-consultations` - Get patient's consultations
- `GET /:consultationId` - Get consultation details
- `PUT /:consultationId/status` - Update consultation status
- `GET /doctor/unassigned-consultations` - Get unassigned consultations
- `POST /:consultationId/accept` - Doctor accepts consultation
- `GET /admin/analytics` - Get consultation analytics (admin)

## Real-time Chat (Socket.io)

### Client Connection
```javascript
const socket = io('http://localhost:5000');

// Join consultation
socket.emit('join-consultation', consultationId, userId);

// Send message
socket.emit('send-message', {
  consultationId,
  senderId,
  senderName,
  message,
  messageType: 'text'
});

// Listen for messages
socket.on('receive-message', (data) => {
  console.log('Message received:', data);
});

// Typing indicator
socket.emit('typing', { consultationId, userId });
socket.emit('stop-typing', { consultationId, userId });
```

### Events
- `join-consultation` - Join a consultation room
- `send-message` - Send a message
- `receive-message` - Receive a message
- `typing` - Someone is typing
- `user-joined` - User joined consultation
- `user-typing` - Typing indicator

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test@123",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "patient"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test@123"
  }'

# Get current user (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set `{{base_url}}` to `http://localhost:5000`
3. For authenticated requests, add Authorization header:
   - Type: Bearer Token
   - Token: [Your JWT from login]

## File Structure

```
backend/
├── config/
│   └── database.js          # Database connection pool
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Auth endpoints
│   ├── complaints.js        # Complaint endpoints
│   ├── diagnoses.js         # Diagnosis endpoints
│   ├── medicines.js         # Medicines endpoints
│   ├── prescriptions.js     # Prescription endpoints
│   ├── payments.js          # Payment endpoints
│   └── consultations.js     # Consultation endpoints
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env.example             # Environment template
└── .env                     # Environment variables (not in git)
```

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` format
- Ensure SSL mode is correct for Neon
- Test connection with: `node -e "require('./config/database.js').testConnection()"`

### JWT Token Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Token expires after time in `JWT_EXPIRE`
- Send token in header as: `Authorization: Bearer <token>`

### Stripe Payment Issues
- Verify webhook secret matches Stripe dashboard
- Check environment variables are loaded correctly
- Test webhook locally with Stripe CLI

### CORS Issues
- Ensure `FRONTEND_URL` matches your frontend domain
- Update `/api/payments/webhook` to accept raw body from Stripe

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Database
- Use Neon Production database
- Enable SSL connections
- Set up automated backups

### Security
- Change `JWT_SECRET` to a secure random value
- Use Stripe production keys
- Enable HTTPS only
- Set up rate limiting
- Enable CORS only for your domain

### Deployment Services
- Backend: Railway, Render, or Heroku
- Database: Neon PostgreSQL
- Files: AWS S3 or similar

## Performance Considerations

1. **Database Indexes** - Already created in schema for common queries
2. **Connection Pooling** - Configured with max 20 connections
3. **Query Logging** - Enable with `DEBUG_QUERIES=true` in development only
4. **Socket.io Scaling** - Add Redis adapter for multiple instances

## Support

For issues or questions:
1. Check logs with `npm run dev`
2. Verify `.env` configuration
3. Test database connection
4. Review API response format

