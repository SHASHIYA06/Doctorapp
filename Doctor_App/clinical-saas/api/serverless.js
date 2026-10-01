/**
 * Vercel Serverless Function - Healthcare API
 * Wraps Express app for serverless deployment
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, specialization } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, user_type, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, user_type',
      [email, hashedPassword, firstName, lastName, userType]
    );

    const userId = userResult.rows[0].id;

    // Create profile
    if (userType === 'patient') {
      await pool.query('INSERT INTO patients (user_id) VALUES ($1)', [userId]);
    } else if (userType === 'doctor') {
      await pool.query(
        'INSERT INTO doctors (user_id, specialization, license_number) VALUES ($1, $2, $3)',
        [userId, specialization || 'General Medicine', `LIC-${Date.now()}`]
      );
    }

    // Generate token
    const token = jwt.sign(
      { id: userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email, firstName, lastName, userType }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, user_type, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, user_type FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Complaints routes (basic implementation)
app.get('/api/complaints/my-complaints', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, cons.status, cons.scheduled_date 
       FROM complaints c
       JOIN consultations cons ON c.consultation_id = cons.id
       WHERE c.patient_id = (SELECT id FROM patients WHERE user_id = $1)
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Consultations routes (basic implementation)
app.get('/api/consultations/patient/my-consultations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, d.specialization, u.first_name || ' ' || u.last_name as doctor_name
       FROM consultations c
       JOIN doctors d ON c.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE c.patient_id = (SELECT id FROM patients WHERE user_id = $1)
       ORDER BY c.scheduled_date DESC`,
      [req.user.id]
    );
    res.json({ consultations: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

app.get('/api/consultations/doctor/my-consultations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.first_name || ' ' || u.last_name as patient_name
       FROM consultations c
       JOIN patients p ON c.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE c.doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
       ORDER BY c.scheduled_date DESC`,
      [req.user.id]
    );
    res.json({ consultations: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// Catch all for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = app;
