# Frontend Integration Guide

## Overview

The clinician-web application has been upgraded to include the full healthcare workflow from the healthcare-app, combining:
- **Legacy Clinical SaaS**: CDS workflow, care plan review
- **New Healthcare App**: Patient-doctor consultation workflow, real-time chat, prescriptions, payments

## New Directory Structure

```
apps/clinician-web/src/
├── App.tsx                 # Main app with React Router
├── main.tsx               # Entry point
├── index.css              # Global styles
├── components/            # Legacy Clinical SaaS components
│   ├── DoctorDashboard.modern.tsx
│   ├── PatientDetails.tsx
│   └── ...
├── pages/                 # New healthcare pages
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── PatientDashboard.tsx
│   ├── DoctorDashboard.tsx
│   ├── NewComplaint.tsx
│   ├── PatientProfile.tsx
│   ├── AddDiagnosis.tsx
│   ├── AddPrescription.tsx
│   ├── Prescriptions.tsx
│   ├── Payments.tsx
│   └── Chat.tsx
├── api/                   # API client modules
│   ├── client.ts          # Axios client with auth interceptor
│   ├── auth.ts            # Authentication APIs
│   ├── complaints.ts      # Complaint APIs
│   ├── consultations.ts   # Consultation APIs
│   ├── diagnoses.ts       # Diagnosis APIs
│   ├── medicines.ts       # Medicine APIs
│   ├── payments.ts        # Payment APIs
│   └── prescriptions.ts   # Prescription APIs
├── store/                 # State management
│   └── authStore.ts       # Zustand auth store
├── hooks/                 # Custom React hooks
└── styles/                # Style utilities
```

## New Dependencies Added

```json
{
  "react-router-dom": "^6.22.0",   // Routing
  "axios": "^1.6.0",               // HTTP client
  "zustand": "^4.5.0",             // State management
  "socket.io-client": "^4.7.0"     // Real-time chat
}
```

## Routes

### Public Routes
- `/login` - User login
- `/register` - User registration

### Patient Routes (Protected)
- `/patient/dashboard` - Patient dashboard
- `/patient/complaint/new` - Submit new complaint
- `/patient/prescriptions` - View prescriptions
- `/patient/payments` - Payment history

### Doctor Routes (Protected)
- `/doctor/dashboard` - Doctor dashboard with patient queue
- `/doctor/patient/:patientId` - Patient profile and history
- `/doctor/diagnosis/add/:consultationId` - Add diagnosis
- `/doctor/prescription/add/:consultationId` - Create prescription

### Shared Routes (Protected)
- `/chat/:consultationId` - Real-time chat between patient and doctor

### Legacy Clinical SaaS Routes
- `/clinical/dashboard` - Legacy CDS workflow dashboard

### Root Route
- `/` - Redirects based on user role:
  - Patient → `/patient/dashboard`
  - Doctor → `/doctor/dashboard`
  - Not authenticated → `/login`

## Environment Variables

Create `.env` file in `apps/clinician-web/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Socket.IO Configuration
VITE_SOCKET_URL=http://localhost:3000

# Environment
VITE_ENV=development
```

For Vercel deployment:

```env
VITE_API_URL=https://your-domain.vercel.app/api
VITE_SOCKET_URL=https://your-domain.vercel.app
VITE_ENV=production
```

## Authentication Flow

1. **Login/Register** → API call to `/api/auth/login` or `/api/auth/register`
2. **Token received** → Stored in Zustand with localStorage persistence
3. **Protected routes** → Check token and user role
4. **API calls** → Axios interceptor adds `Authorization: Bearer <token>`
5. **401 response** → Automatically logout and redirect to login

## State Management

### Zustand Auth Store

```typescript
import { useAuthStore } from './store/authStore';

// In component
const { user, token, setAuth, logout, isDoctor, isPatient } = useAuthStore();

// Login
setAuth(userData, token);

// Logout
logout();

// Check role
if (isDoctor()) {
  // Doctor-specific logic
}
```

## API Client Usage

```typescript
import { authAPI } from './api/auth';
import { complaintsAPI } from './api/complaints';

// Login
const response = await authAPI.login({ email, password });

// Create complaint
const complaint = await complaintsAPI.create({
  consultationId: 123,
  chiefComplaint: 'Headache',
  description: 'Severe headache for 3 days',
  symptoms: 'Nausea, sensitivity to light',
  severity: 'moderate'
});
```

## Real-time Chat (Socket.IO)

```typescript
import { io } from 'socket.io-client';

// Connect
const socket = io(import.meta.env.VITE_SOCKET_URL);

// Register user
socket.emit('register', userId);

// Send message
socket.emit('send_message', {
  consultationId,
  senderId,
  receiverId,
  message,
  senderType
});

// Receive message
socket.on('receive_message', (data) => {
  console.log('New message:', data);
});
```

## Development Workflow

### Local Development

1. **Start Backend API**
   ```bash
   cd apps/api
   npm install
   npm run dev
   # Runs on http://localhost:3000
   ```

2. **Start Frontend**
   ```bash
   cd apps/clinician-web
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/health

### Building for Production

```bash
cd apps/clinician-web
npm run build
# Output in dist/
```

## Vercel Deployment

### Backend API Configuration

Update `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/api/src/healthcare-server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "apps/clinician-web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/api/src/healthcare-server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "apps/clinician-web/dist/$1"
    }
  ]
}
```

### Environment Variables in Vercel

Set in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=<your-neon-connection-string>
JWT_SECRET=<your-jwt-secret>
STRIPE_SECRET_KEY=<your-stripe-key>
NODE_ENV=production
FRONTEND_URL=https://your-domain.vercel.app
```

## Testing

### Test User Login

```typescript
// As Patient
await authAPI.login({
  email: 'patient1@example.com',
  password: 'Test@123'
});

// As Doctor
await authAPI.login({
  email: 'doctor1@example.com',
  password: 'Test@123'
});
```

### Test Workflow

1. **Patient Flow**:
   - Register/Login as patient
   - Submit new complaint
   - View consultation status
   - Chat with doctor
   - View prescription
   - Make payment

2. **Doctor Flow**:
   - Login as doctor
   - View patient queue
   - Review patient complaint
   - Add diagnosis
   - Create prescription
   - Chat with patient

## Next Steps

1. ✅ Install dependencies: `npm install` in clinician-web
2. ✅ Create `.env` file with API URL
3. ✅ Start backend API server
4. ✅ Start frontend dev server
5. ✅ Test login/register flow
6. ✅ Test patient and doctor workflows
7. ✅ Deploy to Vercel

## Known Issues & Solutions

### CORS Errors
- **Issue**: API calls blocked by CORS
- **Solution**: Ensure backend has correct CORS config for frontend URL

### Socket.IO Connection Failed
- **Issue**: Chat not working
- **Solution**: Check VITE_SOCKET_URL matches backend server

### 401 Unauthorized
- **Issue**: API calls return 401
- **Solution**: Check token is stored correctly, verify JWT_SECRET matches

### Route Not Found
- **Issue**: Page refresh gives 404
- **Solution**: Ensure Vercel rewrites are configured for SPA

## Support

For issues or questions:
- Check API health: `/api/health`
- Review browser console for errors
- Check network tab for API calls
- Verify environment variables are set
