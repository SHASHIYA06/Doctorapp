import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, isPatient, isDoctor } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ALL PATIENT CONSULTATIONS
// ============================================
router.get('/patient/my-consultations', authenticateToken, isPatient, async (req, res) => {
  try {
    const patientUserId = req.user.id;

    const consultationsResult = await query(
      `SELECT con.id, con.status, con.is_paid, con.created_at,
              d.user_id as doctor_user_id,
              u.first_name, u.last_name, u.email,
              comp.chief_complaint,
              COUNT(p.id) as prescription_count
       FROM consultations con
       JOIN patients pat ON con.patient_id = pat.id
       LEFT JOIN doctors d ON con.doctor_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN complaints comp ON con.id = comp.consultation_id
       LEFT JOIN prescriptions p ON con.id = p.consultation_id
       WHERE pat.user_id = $1
       GROUP BY con.id, d.user_id, u.id, comp.id
       ORDER BY con.created_at DESC`,
      [patientUserId]
    );

    const consultations = consultationsResult.rows.map(c => ({
      id: c.id,
      status: c.status,
      isPaid: c.is_paid,
      createdAt: c.created_at,
      doctorName: c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : null,
      doctorEmail: c.email,
      chiefComplaint: c.chief_complaint,
      prescriptionCount: parseInt(c.prescription_count)
    }));

    res.json({ consultations });
  } catch (error) {
    console.error('Get patient consultations error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// ============================================
// GET CONSULTATION DETAILS
// ============================================
router.get('/:consultationId', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultResult = await query(
      `SELECT con.id, con.status, con.is_paid, con.created_at,
              pat.user_id as patient_user_id,
              u_patient.first_name, u_patient.last_name, u_patient.email,
              d.user_id as doctor_user_id,
              u_doctor.first_name as doc_first_name, u_doctor.last_name as doc_last_name,
              comp.chief_complaint, comp.symptoms,
              dia.diagnosis, dia.findings,
              p.id as prescription_id
       FROM consultations con
       JOIN patients pat ON con.patient_id = pat.id
       JOIN users u_patient ON pat.user_id = u_patient.id
       LEFT JOIN doctors d ON con.doctor_id = d.id
       LEFT JOIN users u_doctor ON d.user_id = u_doctor.id
       LEFT JOIN complaints comp ON con.id = comp.consultation_id
       LEFT JOIN diagnoses dia ON con.id = dia.consultation_id
       LEFT JOIN prescriptions p ON con.id = p.consultation_id
       WHERE con.id = $1`,
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const con = consultResult.rows[0];

    res.json({
      id: con.id,
      status: con.status,
      isPaid: con.is_paid,
      createdAt: con.created_at,
      patient: {
        name: `${con.first_name} ${con.last_name}`,
        email: con.email
      },
      doctor: con.doc_first_name ? {
        name: `${con.doc_first_name} ${con.doc_last_name}`
      } : null,
      complaint: {
        chiefComplaint: con.chief_complaint,
        symptoms: con.symptoms
      },
      diagnosis: con.diagnosis ? {
        diagnosis: con.diagnosis,
        findings: con.findings
      } : null,
      prescriptionId: con.prescription_id
    });
  } catch (error) {
    console.error('Get consultation details error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation details' });
  }
});

// ============================================
// UPDATE CONSULTATION STATUS
// ============================================
router.put('/:consultationId/status', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;

    if (!['pending', 'assigned', 'diagnosed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await query(
      'UPDATE consultations SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, consultationId]
    );

    res.json({ message: 'Consultation status updated successfully' });
  } catch (error) {
    console.error('Update consultation status error:', error);
    res.status(500).json({ error: 'Failed to update consultation status' });
  }
});

// ============================================
// GET UNASSIGNED CONSULTATIONS (For Doctors)
// ============================================
router.get('/doctor/unassigned-consultations', authenticateToken, isDoctor, async (req, res) => {
  try {
    const consultationsResult = await query(
      `SELECT con.id, con.status, con.created_at,
              u.first_name, u.last_name, u.email,
              comp.chief_complaint, comp.severity
       FROM consultations con
       JOIN patients pat ON con.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       LEFT JOIN complaints comp ON con.id = comp.consultation_id
       WHERE con.doctor_id IS NULL AND con.status IN ('pending', 'assigned')
       ORDER BY con.created_at ASC`,
      []
    );

    const consultations = consultationsResult.rows.map(c => ({
      id: c.id,
      status: c.status,
      createdAt: c.created_at,
      patientName: `${c.first_name} ${c.last_name}`,
      patientEmail: c.email,
      chiefComplaint: c.chief_complaint,
      severity: c.severity
    }));

    res.json({ consultations });
  } catch (error) {
    console.error('Get unassigned consultations error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// ============================================
// DOCTOR ACCEPT CONSULTATION
// ============================================
router.post('/:consultationId/accept', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const doctorUserId = req.user.id;

    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    const doctorId = doctorResult.rows[0].id;

    // Update consultation
    await query(
      'UPDATE consultations SET doctor_id = $1, status = $2 WHERE id = $3',
      [doctorId, 'assigned', consultationId]
    );

    res.json({ message: 'Consultation accepted successfully' });
  } catch (error) {
    console.error('Accept consultation error:', error);
    res.status(500).json({ error: 'Failed to accept consultation' });
  }
});

// ============================================
// GET CONSULTATION ANALYTICS (Admin)
// ============================================
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    const analyticsResult = await query(
      `SELECT 
        COUNT(*) as total_consultations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'diagnosed' THEN 1 END) as diagnosed,
        COUNT(CASE WHEN is_paid = true THEN 1 END) as paid_consultations,
        COUNT(CASE WHEN is_paid = false THEN 1 END) as unpaid_consultations
       FROM consultations`,
      []
    );

    const stats = analyticsResult.rows[0];

    res.json({
      totalConsultations: stats.total_consultations,
      completed: stats.completed,
      pending: stats.pending,
      assigned: stats.assigned,
      diagnosed: stats.diagnosed,
      paidConsultations: stats.paid_consultations,
      unpaidConsultations: stats.unpaid_consultations
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
