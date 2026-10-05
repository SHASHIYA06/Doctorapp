import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, isDoctor, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ALL MEDICINES
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;

    let query_text = 'SELECT id, name, generic_name, category, strength, dosage_form, price, stock, description FROM medicines WHERE 1=1';
    const params = [];

    if (search) {
      query_text += ` AND (name ILIKE $${params.length + 1} OR generic_name ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query_text += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query_text += ' ORDER BY name ASC';

    const medicinesResult = await query(query_text, params);

    const medicines = medicinesResult.rows.map(m => ({
      id: m.id,
      name: m.name,
      genericName: m.generic_name,
      category: m.category,
      strength: m.strength,
      dosageForm: m.dosage_form,
      price: m.price,
      stock: m.stock,
      description: m.description
    }));

    res.json({ medicines });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

// ============================================
// GET SINGLE MEDICINE
// ============================================
router.get('/:medicineId', authenticateToken, async (req, res) => {
  try {
    const { medicineId } = req.params;

    const medicineResult = await query(
      'SELECT id, name, generic_name, category, strength, dosage_form, price, stock, description FROM medicines WHERE id = $1',
      [medicineId]
    );

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const m = medicineResult.rows[0];

    res.json({
      id: m.id,
      name: m.name,
      genericName: m.generic_name,
      category: m.category,
      strength: m.strength,
      dosageForm: m.dosage_form,
      price: m.price,
      stock: m.stock,
      description: m.description
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

// ============================================
// ADD MEDICINE (Admin only)
// ============================================
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, genericName, category, strength, dosageForm, price, stock, description } = req.body;

    if (!name || !category || !dosageForm) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const medicineResult = await query(
      `INSERT INTO medicines (name, generic_name, category, strength, dosage_form, price, stock, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, generic_name, category, strength, dosage_form, price, stock, description`,
      [name, genericName, category, strength, dosageForm, price || 0, stock || 0, description]
    );

    const m = medicineResult.rows[0];

    res.status(201).json({
      message: 'Medicine added successfully',
      medicine: {
        id: m.id,
        name: m.name,
        genericName: m.generic_name,
        category: m.category,
        strength: m.strength,
        dosageForm: m.dosage_form,
        price: m.price,
        stock: m.stock,
        description: m.description
      }
    });
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

// ============================================
// UPDATE MEDICINE (Admin only)
// ============================================
router.put('/:medicineId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { name, genericName, category, strength, dosageForm, price, stock, description } = req.body;

    await query(
      `UPDATE medicines SET 
               name = COALESCE($1, name),
               generic_name = COALESCE($2, generic_name),
               category = COALESCE($3, category),
               strength = COALESCE($4, strength),
               dosage_form = COALESCE($5, dosage_form),
               price = COALESCE($6, price),
               stock = COALESCE($7, stock),
               description = COALESCE($8, description)
       WHERE id = $9`,
      [name, genericName, category, strength, dosageForm, price, stock, description, medicineId]
    );

    res.json({ message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
});

// ============================================
// DELETE MEDICINE (Admin only)
// ============================================
router.delete('/:medicineId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { medicineId } = req.params;

    await query('DELETE FROM medicines WHERE id = $1', [medicineId]);

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
});

// ============================================
// GET MEDICINES BY CATEGORY
// ============================================
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;

    const medicinesResult = await query(
      `SELECT id, name, generic_name, category, strength, dosage_form, price, stock 
       FROM medicines 
       WHERE category = $1 
       ORDER BY name ASC`,
      [category]
    );

    const medicines = medicinesResult.rows.map(m => ({
      id: m.id,
      name: m.name,
      genericName: m.generic_name,
      category: m.category,
      strength: m.strength,
      dosageForm: m.dosage_form,
      price: m.price,
      stock: m.stock
    }));

    res.json({ medicines });
  } catch (error) {
    console.error('Get medicines by category error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

// ============================================
// LOW STOCK ALERT (Admin)
// ============================================
router.get('/admin/low-stock', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { threshold } = req.query;
    const lowStockThreshold = threshold || 10;

    const medicinesResult = await query(
      `SELECT id, name, stock, price 
       FROM medicines 
       WHERE stock < $1 
       ORDER BY stock ASC`,
      [lowStockThreshold]
    );

    const medicines = medicinesResult.rows.map(m => ({
      id: m.id,
      name: m.name,
      stock: m.stock,
      price: m.price
    }));

    res.json({ medicines, count: medicines.length });
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock medicines' });
  }
});

export default router;
