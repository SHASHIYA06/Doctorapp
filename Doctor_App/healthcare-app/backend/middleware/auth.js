import jwt from 'jsonwebtoken';

// ============================================
// AUTHENTICATE TOKEN MIDDLEWARE
// ============================================
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ============================================
// CHECK IF PATIENT
// ============================================
export const isPatient = (req, res, next) => {
  if (!req.user || req.user.userType !== 'patient') {
    return res.status(403).json({ error: 'Only patients can access this resource' });
  }
  next();
};

// ============================================
// CHECK IF DOCTOR
// ============================================
export const isDoctor = (req, res, next) => {
  if (!req.user || req.user.userType !== 'doctor') {
    return res.status(403).json({ error: 'Only doctors can access this resource' });
  }
  next();
};

// ============================================
// CHECK IF ADMIN
// ============================================
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admins can access this resource' });
  }
  next();
};
