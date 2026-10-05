import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// REGISTER USER (Patient or Doctor)
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, specialization } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !userType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['patient', 'doctor', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, user_type, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, user_type',
      [email, hashedPassword, firstName, lastName, userType]
    );

    const userId = userResult.rows[0].id;

    // Create profile based on user type
    if (userType === 'patient') {
      await query(
        'INSERT INTO patients (user_id, date_of_birth, medical_history) VALUES ($1, NULL, NULL)',
        [userId]
      );
    } else if (userType === 'doctor') {
      if (!specialization) {
        return res.status(400).json({ error: 'Specialization required for doctors' });
      }
      await query(
        'INSERT INTO doctors (user_id, specialization, license_number, experience_years) VALUES ($1, $2, NULL, 0)',
        [userId, specialization]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        userType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// LOGIN USER
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const userResult = await query(
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

    // Generate JWT token
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

// ============================================
// GET CURRENT USER
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, u.created_at,
              CASE 
                WHEN u.user_type = 'patient' THEN row_to_json(p.*)
                WHEN u.user_type = 'doctor' THEN row_to_json(d.*)
                ELSE NULL
              END as profile
       FROM users u
       LEFT JOIN patients p ON u.id = p.user_id
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      profile: user.profile,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================
// LOGOUT (client-side JWT removal)
// ============================================
router.post('/logout', authenticateToken, (req, res) => {
  // JWT logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// UPDATE USER PROFILE
// ============================================
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, medicalHistory } = req.body;
    const userId = req.user.id;

    // Update user table
    if (firstName || lastName) {
      await query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), updated_at = NOW() WHERE id = $3',
        [firstName, lastName, userId]
      );
    }

    // Update patient profile if patient
    if (req.user.userType === 'patient') {
      if (dateOfBirth || medicalHistory) {
        await query(
          'UPDATE patients SET date_of_birth = COALESCE($1, date_of_birth), medical_history = COALESCE($2, medical_history) WHERE user_id = $3',
          [dateOfBirth, medicalHistory, userId]
        );
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
