/**
 * Integrated Healthcare Server - combines Clinical SaaS + Healthcare App
 * Handles both legacy CDS routes and new patient/doctor workflow
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import 'express-async-errors';
import dotenv from 'dotenv';

// Import database connection
import { testConnection } from './config/database';

// Import existing clinical-saas routes
import cdsRoutes from './cds-routes';
import monographRoutes from './monograph-routes';
import voiceRoutes from './voice-routes';

// Import healthcare-app routes (will need conversion to TypeScript imports)
// These will be imported as CommonJS for now
const authRoutes = require('./routes/auth.js');
const complaintsRoutes = require('./routes/complaints.js');
const consultationsRoutes = require('./routes/consultations.js');
const diagnosesRoutes = require('./routes/diagnoses.js');
const medicinesRoutes = require('./routes/medicines.js');
const paymentsRoutes = require('./routes/payments.js');
const prescriptionsRoutes = require('./routes/prescriptions.js');

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// ============================================
// SOCKET.IO SETUP FOR REAL-TIME CHAT
// ============================================
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active users
const activeUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('register', (userId: string) => {
    activeUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('send_message', async (data) => {
    const { consultationId, senderId, receiverId, message, senderType } = data;
    
    // Save message to database (implementation needed)
    console.log('💬 Message:', { consultationId, senderId, receiverId, message });

    // Send to receiver if online
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', {
        consultationId,
        senderId,
        message,
        senderType,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    // Remove user from active users
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      api: 'healthy',
      database: 'connected',
      socketio: 'active'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// HEALTHCARE APP ROUTES (NEW)
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/diagnoses', diagnosesRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);

// ============================================
// CLINICAL SAAS ROUTES (LEGACY)
// ============================================
app.use('/api/cds', cdsRoutes);
app.use('/api/monograph', monographRoutes);
app.use('/api/voice', voiceRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Unhandled error:', err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    server.listen(port, () => {
      console.log('='.repeat(60));
      console.log('🏥 Healthcare SaaS API Server');
      console.log('='.repeat(60));
      console.log(`✅ Server running on port ${port}`);
      console.log(`✅ Socket.IO enabled for real-time chat`);
      console.log(`✅ Database connected (Neon PostgreSQL)`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
export { io };
