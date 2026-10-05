import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query, getClient } from '../config/database.js';
import { authenticateToken, isPatient, isDoctor } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// MULTER SETUP FOR FILE UPLOADS
// ============================================
const uploadDir = 'uploads/medical-documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and documents allowed.'));
    }
  }
});

// ============================================
// SUBMIT COMPLAINT
// ============================================
router.post('/submit', authenticateToken, isPatient, async (req, res) => {
  try {
    const { chiefComplaint, symptoms, duration, severity } = req.body;
    const patientUserId = req.user.id;

    // Validation
    if (!chiefComplaint || !symptoms || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get patient ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [patientUserId]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }
    const patientId = patientResult.rows[0].id;

    // Create consultation first
    const consultationResult = await query(
      `INSERT INTO consultations (patient_id, status, created_at) 
       VALUES ($1, 'pending', NOW()) RETURNING id`,
      [patientId]
    );
    const consultationId = consultationResult.rows[0].id;

    // Create complaint
    const complaintResult = await query(
      `INSERT INTO complaints (consultation_id, chief_complaint, symptoms, duration, severity, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW())
       RETURNING id, consultation_id, chief_complaint, symptoms, duration, severity, status, created_at`,
      [consultationId, chiefComplaint, symptoms, duration, severity || 'moderate']
    );

    const complaint = complaintResult.rows[0];

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: {
        id: complaint.id,
        consultationId: complaint.consultation_id,
        chiefComplaint: complaint.chief_complaint,
        symptoms: complaint.symptoms,
        duration: complaint.duration,
        severity: complaint.severity,
        status: complaint.status,
        createdAt: complaint.created_at
      }
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// ============================================
// GET PATIENT COMPLAINTS
// ============================================
router.get('/my-complaints', authenticateToken, isPatient, async (req, res) => {
  try {
    const patientUserId = req.user.id;

    const complaintsResult = await query(
      `SELECT c.id, c.consultation_id, c.chief_complaint, c.symptoms, c.duration, 
              c.severity, c.status, c.created_at
       FROM complaints c
       JOIN consultations con ON c.consultation_id = con.id
       JOIN patients p ON con.patient_id = p.id
       WHERE p.user_id = $1
       ORDER BY c.created_at DESC`,
      [patientUserId]
    );

    const complaints = complaintsResult.rows.map(c => ({
      id: c.id,
      consultationId: c.consultation_id,
      chiefComplaint: c.chief_complaint,
      symptoms: c.symptoms,
      duration: c.duration,
      severity: c.severity,
      status: c.status,
      createdAt: c.created_at
    }));

    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// ============================================
// GET DOCTOR'S ASSIGNED COMPLAINTS
// ============================================
router.get('/assigned', authenticateToken, isDoctor, async (req, res) => {
  try {
    const doctorUserId = req.user.id;

    const complaintsResult = await query(
      `SELECT c.id, c.consultation_id, c.chief_complaint, c.symptoms, c.duration,
              c.severity, c.status, c.created_at,
              u.first_name, u.last_name, u.email,
              con.doctor_id
       FROM complaints c
       JOIN consultations con ON c.consultation_id = con.id
       JOIN patients p ON con.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN doctors d ON con.doctor_id = d.id
       WHERE d.user_id = $1 OR con.doctor_id IS NULL
       ORDER BY c.created_at DESC`,
      [doctorUserId]
    );

    const complaints = complaintsResult.rows.map(c => ({
      id: c.id,
      consultationId: c.consultation_id,
      chiefComplaint: c.chief_complaint,
      symptoms: c.symptoms,
      duration: c.duration,
      severity: c.severity,
      status: c.status,
      createdAt: c.created_at,
      patientName: `${c.first_name} ${c.last_name}`,
      patientEmail: c.email
    }));

    res.json({ complaints });
  } catch (error) {
    console.error('Get assigned complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// ============================================
// GET COMPLAINT DETAILS
// ============================================
router.get('/:complaintId', authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaintResult = await query(
      `SELECT c.*, con.id as consultation_id, con.doctor_id,
              u.first_name, u.last_name, u.email
       FROM complaints c
       JOIN consultations con ON c.consultation_id = con.id
       JOIN patients p ON con.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE c.id = $1`,
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintResult.rows[0];

    res.json({
      id: complaint.id,
      consultationId: complaint.consultation_id,
      chiefComplaint: complaint.chief_complaint,
      symptoms: complaint.symptoms,
      duration: complaint.duration,
      severity: complaint.severity,
      status: complaint.status,
      createdAt: complaint.created_at,
      patientName: `${complaint.first_name} ${complaint.last_name}`,
      patientEmail: complaint.email,
      assignedDoctorId: complaint.doctor_id
    });
  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// ============================================
// UPLOAD MEDICAL DOCUMENT
// ============================================
router.post('/:complaintId/upload-document', authenticateToken, isPatient, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { complaintId } = req.params;
    const { documentType } = req.body;

    // Verify complaint belongs to patient
    const complaintResult = await query(
      `SELECT c.id FROM complaints c
       JOIN consultations con ON c.consultation_id = con.id
       JOIN patients p ON con.patient_id = p.id
       WHERE c.id = $1 AND p.user_id = $2`,
      [complaintId, req.user.id]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Save document record
    const docResult = await query(
      `INSERT INTO medical_documents (complaint_id, document_type, file_path, file_name, file_size, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, document_type, file_name, uploaded_at`,
      [complaintId, documentType || 'report', req.file.path, req.file.filename, req.file.size]
    );

    const document = docResult.rows[0];

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        documentType: document.document_type,
        fileName: document.file_name,
        uploadedAt: document.uploaded_at
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ============================================
// GET COMPLAINT DOCUMENTS
// ============================================
router.get('/:complaintId/documents', authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;

    const docsResult = await query(
      `SELECT id, document_type, file_name, file_size, uploaded_at
       FROM medical_documents
       WHERE complaint_id = $1
       ORDER BY uploaded_at DESC`,
      [complaintId]
    );

    const documents = docsResult.rows.map(d => ({
      id: d.id,
      documentType: d.document_type,
      fileName: d.file_name,
      fileSize: d.file_size,
      uploadedAt: d.uploaded_at
    }));

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ============================================
// ASSIGN COMPLAINT TO DOCTOR
// ============================================
router.put('/:complaintId/assign-doctor', authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { doctorUserId } = req.body;

    if (!doctorUserId) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    // Get doctor ID from user ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const doctorId = doctorResult.rows[0].id;

    // Get consultation ID
    const complaintResult = await query('SELECT consultation_id FROM complaints WHERE id = $1', [complaintId]);
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    const consultationId = complaintResult.rows[0].consultation_id;

    // Update consultation with doctor assignment
    await query(
      'UPDATE consultations SET doctor_id = $1, status = $2 WHERE id = $3',
      [doctorId, 'assigned', consultationId]
    );

    res.json({ message: 'Complaint assigned to doctor successfully' });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Failed to assign doctor' });
  }
});

export default router;
