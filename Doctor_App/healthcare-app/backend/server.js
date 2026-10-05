import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import database and routes
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import complaintsRoutes from './routes/complaints.js';
import diagnosesRoutes from './routes/diagnoses.js';
import medicinesRoutes from './routes/medicines.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import paymentsRoutes from './routes/payments.js';
import consultationsRoutes from './routes/consultations.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SOCKET.IO (Real-time Chat)
// ============================================
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // User joins consultation room
  socket.on('join-consultation', (consultationId, userId) => {
    socket.join(`consultation-${consultationId}`);
    activeUsers.set(userId, socket.id);
    io.to(`consultation-${consultationId}`).emit('user-joined', { userId, timestamp: new Date() });
    console.log(`📌 User ${userId} joined consultation ${consultationId}`);
  });

  // Send message
  socket.on('send-message', (data) => {
    io.to(`consultation-${data.consultationId}`).emit('receive-message', {
      senderId: data.senderId,
      senderName: data.senderName,
      message: data.message,
      timestamp: new Date(),
      messageType: data.messageType || 'text'
    });
    console.log(`💬 Message sent in consultation ${data.consultationId}`);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    io.to(`consultation-${data.consultationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: true
    });
  });

  // Stop typing
  socket.on('stop-typing', (data) => {
    io.to(`consultation-${data.consultationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: false
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    activeUsers.forEach((value, key) => {
      if (value === socket.id) activeUsers.delete(key);
    });
  });
});

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Healthcare Backend is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Complaint routes
app.use('/api/complaints', complaintsRoutes);

// Diagnoses routes
app.use('/api/diagnoses', diagnosesRoutes);

// Medicines routes
app.use('/api/medicines', medicinesRoutes);

// Prescriptions routes
app.use('/api/prescriptions', prescriptionsRoutes);

// Payments routes
app.use('/api/payments', paymentsRoutes);

// Consultations routes
app.use('/api/consultations', consultationsRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

// Test database connection and start server
testConnection().then((isConnected) => {
  if (isConnected) {
    httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║   🏥 Healthcare Application Backend Started     ║
║   ✅ Server running on port ${PORT}                  ║
║   ✅ Database connected                          ║
║   ✅ Socket.io enabled for real-time chat       ║
║   ✅ All API routes configured                  ║
║   ✅ Ready to accept connections                ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } else {
    console.error('❌ Failed to connect to database. Check your DATABASE_URL in .env');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

export { app, io, httpServer };
