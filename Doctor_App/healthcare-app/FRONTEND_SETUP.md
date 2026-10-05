# Healthcare App Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd healthcare-app/frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 3. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Features

### Patient Portal
- ✅ Dashboard with consultation overview
- ✅ Submit new complaints with symptoms
- ✅ Upload medical documents (lab reports, X-rays, scans)
- ✅ View prescriptions with medicine details
- ✅ Make payments via Stripe
- ✅ Real-time chat with doctor
- ✅ Track consultation status

### Doctor Portal
- ✅ Dashboard with assigned patients
- ✅ View patient complaints and documents
- ✅ Add diagnoses with ICD codes
- ✅ Create prescriptions with multiple medicines
- ✅ Real-time chat with patients
- ✅ Manage consultations

### Authentication
- ✅ User registration (patient/doctor)
- ✅ JWT-based login
- ✅ Persistent authentication via Zustand
- ✅ Role-based access control
- ✅ Automatic logout on token expiration

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   │   ├── auth.js       # Authentication endpoints
│   │   ├── complaints.js # Complaint endpoints
│   │   ├── prescriptions.js
│   │   ├── payments.js
│   │   ├── medicines.js
│   │   ├── diagnoses.js
│   │   ├── consultations.js
│   │   └── client.js     # Axios configuration
│   ├── pages/            # React pages/components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── PatientDashboard.jsx
│   │   ├── NewComplaint.jsx
│   │   ├── Prescriptions.jsx
│   │   ├── Payments.jsx
│   │   ├── DoctorDashboard.jsx
│   │   └── Chat.jsx
│   ├── store/            # Zustand state management
│   │   └── authStore.js
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
└── .env.example          # Environment template
```

## Page Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page

### Patient Routes (Protected)
- `/patient/dashboard` - Main patient dashboard
- `/patient/new-complaint` - Submit new complaint
- `/patient/prescriptions` - View prescriptions
- `/patient/payments` - Payment management
- `/patient/chat` - Real-time chat with doctor
- `/patient/consultation/:id` - Consultation details

### Doctor Routes (Protected)
- `/doctor/dashboard` - Main doctor dashboard
- `/doctor/patient/:id` - Patient details
- `/doctor/chat` - Real-time chat with patient

## API Integration

### Authentication Flow
1. User registers at `/register`
2. Credentials sent to `POST /api/auth/register`
3. User receives JWT token
4. Token stored in Zustand store (persisted to localStorage)
5. Token sent in all subsequent requests as `Authorization: Bearer {token}`
6. On login, token refreshed and stored

### Complaint Submission Flow
1. Patient fills form on `/patient/new-complaint`
2. Form submitted to `POST /api/complaints/submit`
3. Consultation created automatically
4. Optional: Medical document uploaded to `POST /api/complaints/{id}/upload-document`
5. Patient redirected to dashboard

### Payment Flow
1. Patient views consultation on `/patient/payments`
2. Clicks "Pay Now"
3. Frontend creates Stripe checkout session via `POST /api/payments/create-checkout-session`
4. Redirects to Stripe checkout page
5. Upon success, backend webhook updates payment status
6. Consultation marked as paid

### Chat Flow
1. Patient/Doctor enters consultation ID
2. Socket.io connects to `ws://localhost:5000`
3. Emits `join-consultation` event
4. Sends messages via `send-message` event
5. Receives messages via `receive-message` listener

## State Management (Zustand)

### useAuthStore
```javascript
import { useAuthStore } from './store/authStore';

// Get auth state
const { user, token, isAuthenticated } = useAuthStore();

// Login
useAuthStore.getState().setAuth(user, token);

// Logout
useAuthStore.getState().logout();

// Check role
if (useAuthStore.getState().isPatient()) { ... }
```

## Styling

### Tailwind CSS
- Configured in `tailwind.config.js`
- Imported in `src/index.css`
- Used throughout all components
- Responsive design with mobile-first approach

### Custom Colors
- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Extend in `tailwind.config.js`

## File Upload

### Supported Formats
- PDF (.pdf)
- Images (.jpg, .jpeg, .png, .tiff)
- Documents (.doc, .docx)

### Size Limit
- Max 50MB per file

### Upload Implementation
```javascript
const file = e.target.files[0];
await complaintsAPI.uploadDocument(complaintId, file, documentType);
```

## Real-time Chat

### Socket.io Events

**Client → Server:**
- `join-consultation` - Join a consultation room
- `send-message` - Send a message
- `typing` - User is typing
- `stop-typing` - User stopped typing

**Server → Client:**
- `receive-message` - Message received
- `user-joined` - User joined consultation
- `user-typing` - User typing indicator

### Chat Usage
```javascript
import { io } from 'socket.io-client';

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
  console.log('Message:', data);
});
```

## Build for Production

```bash
npm run build
```

Output:
- Creates `dist/` directory
- Optimized and minified code
- Ready for deployment

### Deployment Options
1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

3. **Docker**
   ```dockerfile
   FROM node:18 AS build
   WORKDIR /app
   COPY . .
   RUN npm install && npm run build

   FROM nginx:latest
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:5000/api | Backend API URL |
| VITE_SOCKET_URL | http://localhost:5000 | Socket.io server URL |
| VITE_STRIPE_PUBLIC_KEY | - | Stripe public key for payments |

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

### Code Splitting
- Vendor code split
- React split
- UI components bundled separately

### Caching
- Persistent auth store
- Browser cache headers
- Service worker ready (can add PWA support)

### Network
- Axios request/response interceptors
- Automatic token refresh
- Error handling

## Troubleshooting

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "API not responding"
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `.env`
- Verify CORS configuration on backend

### "Socket.io not connecting"
- Check `VITE_SOCKET_URL` in `.env`
- Ensure backend Socket.io is running
- Check browser console for connection errors

### "Stripe payment failing"
- Verify `VITE_STRIPE_PUBLIC_KEY` is correct
- Use Stripe test keys for development
- Check Stripe dashboard for errors

## Development Tips

### Hot Module Replacement (HMR)
- Changes reflect instantly in browser
- State is preserved
- No full page reload needed

### Debugging
- React DevTools browser extension
- Redux DevTools for state management
- Browser DevTools for network/console

### Testing API
- Use Postman or cURL
- Check network tab in DevTools
- Review backend logs

## Next Steps

1. Start frontend: `npm run dev`
2. Start backend: `npm run dev` (in backend directory)
3. Open http://localhost:3000
4. Register test accounts
5. Test all features

## Support

For issues:
1. Check console errors (F12)
2. Review API response in Network tab
3. Check backend logs
4. Verify environment variables

