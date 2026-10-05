import express from 'express';
import Stripe from 'stripe';
import { query, getClient } from '../config/database.js';
import { authenticateToken, isPatient } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// CREATE CHECKOUT SESSION
// ============================================
router.post('/create-checkout-session', authenticateToken, isPatient, async (req, res) => {
  try {
    const { consultationId } = req.body;
    const patientUserId = req.user.id;

    if (!consultationId) {
      return res.status(400).json({ error: 'Consultation ID required' });
    }

    // Get consultation details
    const consultResult = await query(
      `SELECT con.id, con.patient_id, p.user_id, 
              COALESCE(dia.id, 0) as has_diagnosis
       FROM consultations con
       JOIN patients p ON con.patient_id = p.id
       LEFT JOIN diagnoses dia ON con.id = dia.consultation_id
       WHERE con.id = $1 AND p.user_id = $2`,
      [consultationId, patientUserId]
    );

    if (consultResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const consultation = consultResult.rows[0];

    if (consultation.has_diagnosis === 0) {
      return res.status(400).json({ error: 'Diagnosis not yet completed' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Healthcare Consultation',
              description: 'Doctor consultation fee'
            },
            unit_amount: 50000 // 500 INR in paise
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&consultation_id=${consultationId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?consultation_id=${consultationId}`,
      metadata: {
        consultationId: consultationId.toString(),
        patientId: consultation.patient_id.toString()
      },
      customer_email: req.user.email
    });

    res.json({
      message: 'Checkout session created',
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ============================================
// PAYMENT WEBHOOK (Stripe)
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { consultationId, patientId } = session.metadata;

      // Create payment record
      await query(
        `INSERT INTO payments (consultation_id, amount, currency, status, payment_method, stripe_session_id, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [consultationId, session.amount_total / 100, session.currency, 'completed', 'card', session.id]
      );

      // Update consultation status
      await query(
        'UPDATE consultations SET status = $1, is_paid = true WHERE id = $2',
        ['completed', consultationId]
      );

      console.log(`✅ Payment completed for consultation ${consultationId}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook error: ${error.message}`);
  }
});

// ============================================
// GET PAYMENT STATUS
// ============================================
router.get('/:consultationId/status', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const paymentResult = await query(
      `SELECT id, amount, currency, status, payment_method, paid_at
       FROM payments
       WHERE consultation_id = $1
       ORDER BY paid_at DESC
       LIMIT 1`,
      [consultationId]
    );

    if (paymentResult.rows.length === 0) {
      return res.json({
        status: 'not_paid',
        message: 'No payment found for this consultation'
      });
    }

    const payment = paymentResult.rows[0];

    res.json({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.payment_method,
      paidAt: payment.paid_at
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// ============================================
// GET CONSULTATION PAYMENT DETAILS
// ============================================
router.get('/:consultationId/details', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultResult = await query(
      `SELECT con.id, con.is_paid, con.status,
              COALESCE(p.amount, 0) as amount,
              COALESCE(p.status, 'pending') as payment_status
       FROM consultations con
       LEFT JOIN payments p ON con.id = p.consultation_id
       WHERE con.id = $1`,
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const result = consultResult.rows[0];

    res.json({
      consultationId: result.id,
      isPaid: result.is_paid,
      consultationStatus: result.status,
      paymentAmount: result.amount,
      paymentStatus: result.payment_status
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// ============================================
// GET ALL PAYMENTS (Admin)
// ============================================
router.get('/admin/all-payments', authenticateToken, async (req, res) => {
  try {
    const paymentsResult = await query(
      `SELECT p.id, p.amount, p.currency, p.status, p.payment_method, p.paid_at,
              u.first_name, u.last_name, u.email
       FROM payments p
       JOIN consultations con ON p.consultation_id = con.id
       JOIN patients pat ON con.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       ORDER BY p.paid_at DESC`,
      []
    );

    const payments = paymentsResult.rows.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.payment_method,
      paidAt: p.paid_at,
      patientName: `${p.first_name} ${p.last_name}`,
      patientEmail: p.email
    }));

    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ============================================
// GET REVENUE STATISTICS
// ============================================
router.get('/admin/revenue-stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query_text = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_revenue,
        AVG(amount) as average_payment,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
      FROM payments
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      query_text += ` AND paid_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query_text += ` AND paid_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const statsResult = await query(query_text, params);
    const stats = statsResult.rows[0];

    res.json({
      totalPayments: stats.total_payments,
      totalRevenue: stats.total_revenue,
      averagePayment: stats.average_payment,
      completedPayments: stats.completed_payments,
      pendingPayments: stats.pending_payments
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

export default router;
