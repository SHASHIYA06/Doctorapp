import express from 'express';
import { query, getClient } from '../config/database.js';
import { authenticateToken, isDoctor, isPatient } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// CREATE PRESCRIPTION
// ============================================
router.post('/create', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { consultationId, medicines } = req.body;
    const doctorUserId = req.user.id;

    if (!consultationId || !medicines || medicines.length === 0) {
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

    // Get a client for transaction
    const client = await getClient();

    try {
      // Begin transaction
      await client.query('BEGIN');

      // Create prescription
      const prescriptionResult = await client.query(
        `INSERT INTO prescriptions (consultation_id, prescribed_by, prescribed_at, status)
         VALUES ($1, $2, NOW(), 'active')
         RETURNING id, consultation_id, prescribed_at`,
        [consultationId, doctorId]
      );

      const prescriptionId = prescriptionResult.rows[0].id;

      // Add medicines to prescription
      for (const medicine of medicines) {
        const { medicineId, dosage, frequency, duration, notes } = medicine;

        if (!medicineId || !dosage || !frequency || !duration) {
          throw new Error('Invalid medicine data');
        }

        await client.query(
          `INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [prescriptionId, medicineId, dosage, frequency, duration, notes || null]
        );
      }

      // Update consultation status
      await client.query(
        'UPDATE consultations SET status = $1 WHERE id = $2',
        ['diagnosed', consultationId]
      );

      // Commit transaction
      await client.query('COMMIT');

      res.status(201).json({
        message: 'Prescription created successfully',
        prescription: {
          id: prescriptionId,
          consultationId: consultationId,
          prescribedAt: prescriptionResult.rows[0].prescribed_at
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// ============================================
// GET PRESCRIPTION
// ============================================
router.get('/:prescriptionId', authenticateToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescriptionResult = await query(
      `SELECT id, consultation_id, prescribed_by, prescribed_at, status
       FROM prescriptions
       WHERE id = $1`,
      [prescriptionId]
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = prescriptionResult.rows[0];

    // Get prescription items
    const itemsResult = await query(
      `SELECT pi.id, pi.medicine_id, m.name, m.generic_name, m.dosage_form, 
              pi.dosage, pi.frequency, pi.duration, pi.notes
       FROM prescription_items pi
       JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.prescription_id = $1`,
      [prescriptionId]
    );

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      medicineId: item.medicine_id,
      medicineName: item.name,
      genericName: item.generic_name,
      dosageForm: item.dosage_form,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      notes: item.notes
    }));

    res.json({
      id: prescription.id,
      consultationId: prescription.consultation_id,
      prescribedAt: prescription.prescribed_at,
      status: prescription.status,
      items
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// ============================================
// GET PATIENT PRESCRIPTIONS
// ============================================
router.get('/patient/my-prescriptions', authenticateToken, isPatient, async (req, res) => {
  try {
    const patientUserId = req.user.id;

    const prescriptionsResult = await query(
      `SELECT p.id, p.consultation_id, p.prescribed_at, p.status,
              u.first_name, u.last_name,
              c.chief_complaint
       FROM prescriptions p
       JOIN consultations con ON p.consultation_id = con.id
       JOIN patients pat ON con.patient_id = pat.id
       JOIN doctors d ON con.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN complaints c ON con.id = c.consultation_id
       WHERE pat.user_id = $1
       ORDER BY p.prescribed_at DESC`,
      [patientUserId]
    );

    const prescriptions = prescriptionsResult.rows.map(p => ({
      id: p.id,
      consultationId: p.consultation_id,
      prescribedAt: p.prescribed_at,
      status: p.status,
      doctorName: `${p.first_name} ${p.last_name}`,
      chiefComplaint: p.chief_complaint
    }));

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// ============================================
// GET PRESCRIPTION WITH FULL DETAILS
// ============================================
router.get('/:prescriptionId/details', authenticateToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescriptionResult = await query(
      `SELECT p.id, p.consultation_id, p.prescribed_at, p.status,
              u.first_name, u.last_name, u.email,
              c.chief_complaint, c.symptoms
       FROM prescriptions p
       JOIN consultations con ON p.consultation_id = con.id
       LEFT JOIN complaints c ON con.id = c.consultation_id
       JOIN doctors d ON con.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE p.id = $1`,
      [prescriptionId]
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = prescriptionResult.rows[0];

    // Get prescription items
    const itemsResult = await query(
      `SELECT pi.id, pi.medicine_id, m.name, m.generic_name, m.dosage_form, m.price,
              pi.dosage, pi.frequency, pi.duration, pi.notes
       FROM prescription_items pi
       JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.prescription_id = $1`,
      [prescriptionId]
    );

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      medicineId: item.medicine_id,
      medicineName: item.name,
      genericName: item.generic_name,
      dosageForm: item.dosage_form,
      price: item.price,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      notes: item.notes
    }));

    res.json({
      id: prescription.id,
      consultationId: prescription.consultation_id,
      doctorName: `${prescription.first_name} ${prescription.last_name}`,
      doctorEmail: prescription.email,
      chiefComplaint: prescription.chief_complaint,
      symptoms: prescription.symptoms,
      prescribedAt: prescription.prescribed_at,
      status: prescription.status,
      items
    });
  } catch (error) {
    console.error('Get prescription details error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription details' });
  }
});

// ============================================
// UPDATE PRESCRIPTION ITEM
// ============================================
router.put('/item/:itemId', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { dosage, frequency, duration, notes } = req.body;

    await query(
      `UPDATE prescription_items SET 
               dosage = COALESCE($1, dosage),
               frequency = COALESCE($2, frequency),
               duration = COALESCE($3, duration),
               notes = COALESCE($4, notes)
       WHERE id = $5`,
      [dosage, frequency, duration, notes, itemId]
    );

    res.json({ message: 'Prescription item updated successfully' });
  } catch (error) {
    console.error('Update prescription item error:', error);
    res.status(500).json({ error: 'Failed to update prescription item' });
  }
});

// ============================================
// DELETE PRESCRIPTION ITEM
// ============================================
router.delete('/item/:itemId', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { itemId } = req.params;

    await query('DELETE FROM prescription_items WHERE id = $1', [itemId]);

    res.json({ message: 'Prescription item deleted successfully' });
  } catch (error) {
    console.error('Delete prescription item error:', error);
    res.status(500).json({ error: 'Failed to delete prescription item' });
  }
});

export default router;
