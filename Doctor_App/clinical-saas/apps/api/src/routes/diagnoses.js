import express from 'express';
import { query, getClient } from '../config/database.js';
import { authenticateToken, isDoctor } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ADD DIAGNOSIS
// ============================================
router.post('/add-diagnosis', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { consultationId, diagnosis, findings, icdCode, treatmentPlan } = req.body;
    const doctorUserId = req.user.id;

    // Validation
    if (!consultationId || !diagnosis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    const doctorId = doctorResult.rows[0].id;

    // Verify consultation assignment
    const consultResult = await query(
      'SELECT id FROM consultations WHERE id = $1 AND doctor_id = $2',
      [consultationId, doctorId]
    );

    if (consultResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized for this consultation' });
    }

    // Create diagnosis record
    const diagnosisResult = await query(
      `INSERT INTO diagnoses (consultation_id, diagnosis, findings, icd_code, treatment_plan, diagnosed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, consultation_id, diagnosis, findings, icd_code, treatment_plan, diagnosed_at`,
      [consultationId, diagnosis, findings, icdCode, treatmentPlan]
    );

    const diagnosisRecord = diagnosisResult.rows[0];

    res.status(201).json({
      message: 'Diagnosis added successfully',
      diagnosis: {
        id: diagnosisRecord.id,
        consultationId: diagnosisRecord.consultation_id,
        diagnosis: diagnosisRecord.diagnosis,
        findings: diagnosisRecord.findings,
        icdCode: diagnosisRecord.icd_code,
        treatmentPlan: diagnosisRecord.treatment_plan,
        diagnosedAt: diagnosisRecord.diagnosed_at
      }
    });
  } catch (error) {
    console.error('Add diagnosis error:', error);
    res.status(500).json({ error: 'Failed to add diagnosis' });
  }
});

// ============================================
// GET CONSULTATION DIAGNOSIS
// ============================================
router.get('/consultation/:consultationId', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const diagnosisResult = await query(
      `SELECT id, consultation_id, diagnosis, findings, icd_code, treatment_plan, diagnosed_at
       FROM diagnoses
       WHERE consultation_id = $1
       ORDER BY diagnosed_at DESC
       LIMIT 1`,
      [consultationId]
    );

    if (diagnosisResult.rows.length === 0) {
      return res.status(404).json({ error: 'No diagnosis found' });
    }

    const diagnosis = diagnosisResult.rows[0];

    res.json({
      id: diagnosis.id,
      consultationId: diagnosis.consultation_id,
      diagnosis: diagnosis.diagnosis,
      findings: diagnosis.findings,
      icdCode: diagnosis.icd_code,
      treatmentPlan: diagnosis.treatment_plan,
      diagnosedAt: diagnosis.diagnosed_at
    });
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({ error: 'Failed to fetch diagnosis' });
  }
});

// ============================================
// UPDATE DIAGNOSIS
// ============================================
router.put('/:diagnosisId', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { diagnosis, findings, icdCode, treatmentPlan } = req.body;
    const doctorUserId = req.user.id;

    // Verify doctor owns this diagnosis
    const diagResult = await query(
      `SELECT d.id FROM diagnoses d
       JOIN consultations c ON d.consultation_id = c.id
       JOIN doctors doc ON c.doctor_id = doc.id
       WHERE d.id = $1 AND doc.user_id = $2`,
      [diagnosisId, doctorUserId]
    );

    if (diagResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query(
      `UPDATE diagnoses SET diagnosis = COALESCE($1, diagnosis), 
                           findings = COALESCE($2, findings),
                           icd_code = COALESCE($3, icd_code),
                           treatment_plan = COALESCE($4, treatment_plan)
       WHERE id = $5`,
      [diagnosis, findings, icdCode, treatmentPlan, diagnosisId]
    );

    res.json({ message: 'Diagnosis updated successfully' });
  } catch (error) {
    console.error('Update diagnosis error:', error);
    res.status(500).json({ error: 'Failed to update diagnosis' });
  }
});

// ============================================
// GET DOCTOR'S PATIENT LIST
// ============================================
router.get('/doctor/patients-list', authenticateToken, isDoctor, async (req, res) => {
  try {
    const doctorUserId = req.user.id;

    const patientsResult = await query(
      `SELECT DISTINCT 
              u.id, u.first_name, u.last_name, u.email,
              c.id as consultation_id, c.status,
              comp.chief_complaint, comp.created_at as complaint_date
       FROM users u
       JOIN patients p ON u.id = p.user_id
       JOIN consultations c ON p.id = c.patient_id
       LEFT JOIN complaints comp ON c.id = comp.consultation_id
       JOIN doctors d ON c.doctor_id = d.id
       WHERE d.user_id = $1
       ORDER BY comp.created_at DESC`,
      [doctorUserId]
    );

    const patients = patientsResult.rows.map(p => ({
      userId: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      consultationId: p.consultation_id,
      status: p.status,
      chiefComplaint: p.chief_complaint,
      complaintDate: p.complaint_date
    }));

    res.json({ patients });
  } catch (error) {
    console.error('Get patients list error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// ============================================
// GET ALL CONSULTATIONS FOR DOCTOR
// ============================================
router.get('/doctor/consultations', authenticateToken, isDoctor, async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const { status } = req.query;

    let query_text = `
      SELECT c.id, c.status, c.created_at,
             u.first_name, u.last_name, u.email,
             comp.chief_complaint
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN complaints comp ON c.id = comp.consultation_id
      JOIN doctors d ON c.doctor_id = d.id
      WHERE d.user_id = $1
    `;

    const params = [doctorUserId];

    if (status) {
      query_text += ` AND c.status = $2`;
      params.push(status);
    }

    query_text += ` ORDER BY c.created_at DESC`;

    const consultationsResult = await query(query_text, params);

    const consultations = consultationsResult.rows.map(c => ({
      id: c.id,
      status: c.status,
      createdAt: c.created_at,
      patientName: `${c.first_name} ${c.last_name}`,
      patientEmail: c.email,
      chiefComplaint: c.chief_complaint
    }));

    res.json({ consultations });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

export default router;
