import { NextRequest, NextResponse } from 'next/server'

// Notifications API — returns mock data for frontend consumption
// In production, this would query the database with Prisma

const now = new Date()

const mockNotifications = [
  {
    id: 'n1', type: 'RECALL', category: 'CRITICAL', title: 'CDSCO Drug Recall Alert',
    message: 'Dolo 650 (Batch ML-2025-0892) recalled due to dissolution test failure. Quarantine all stock immediately.',
    isRead: false, createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    actionLabel: 'View Recalls', actionSection: 'recalls',
  },
  {
    id: 'n2', type: 'PRESCRIPTION', category: 'INFO', title: 'New Prescription Signed',
    message: 'Dr. Anil Mehta signed prescription #RX-2026-452 for Rajesh Kumar Sharma.',
    isRead: false, createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    actionLabel: 'View Prescription', actionSection: 'prescriptions', patientName: 'Rajesh Kumar Sharma',
  },
  {
    id: 'n3', type: 'LAB_RESULT', category: 'WARNING', title: 'Critical Lab Result',
    message: 'Troponin I level 8.5 ng/mL (critical high) for patient Mohammed Asif. Immediate clinical attention required.',
    isRead: false, createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    actionLabel: 'View Lab Orders', actionSection: 'lab-orders', patientName: 'Mohammed Asif',
  },
  {
    id: 'n4', type: 'APPOINTMENT', category: 'INFO', title: 'Upcoming Appointment',
    message: 'Priya Nair has an appointment at 10:30 AM today with Dr. Sunita Reddy.',
    isRead: true, createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Appointments', actionSection: 'appointments', patientName: 'Priya Nair',
  },
  {
    id: 'n5', type: 'SAFETY', category: 'URGENT', title: 'Drug Interaction Alert',
    message: 'Potential interaction: Clopidogrel + Omeprazole (reduced antiplatelet effect). Patient: Rajesh Kumar Sharma.',
    isRead: false, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Interactions', actionSection: 'drug-interactions', patientName: 'Rajesh Kumar Sharma',
  },
  {
    id: 'n6', type: 'FOLLOW_UP', category: 'INFO', title: 'Follow-up Reminder',
    message: 'Lakshmi Iyer is due for post-discharge follow-up in 2 days (Cardiology OPD).',
    isRead: true, createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Follow-ups', actionSection: 'follow-up-reminders', patientName: 'Lakshmi Iyer',
  },
  {
    id: 'n7', type: 'BILLING', category: 'WARNING', title: 'Insurance Claim Pending',
    message: 'Insurance claim for Priya Nair (₹45,000) pending for 5 days.',
    isRead: false, createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Billing', actionSection: 'billing', patientName: 'Priya Nair',
  },
  {
    id: 'n8', type: 'REFERRAL', category: 'INFO', title: 'Specialist Referral Received',
    message: 'Referral from Dr. Gupta for Mohammed Asif to Cardiology — chest pain evaluation.',
    isRead: true, createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Referrals', actionSection: 'referrals', patientName: 'Mohammed Asif',
  },
  {
    id: 'n9', type: 'SYSTEM', category: 'INFO', title: 'System Update Completed',
    message: 'Clinical decision support rules updated to v2026.10.3.',
    isRead: true, createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n10', type: 'SAFETY', category: 'CRITICAL', title: 'Allergy Alert — Near Miss',
    message: 'Attempted prescription of Ciprofloxacin for Mohammed Asif who has a documented Ciprofloxacin allergy. Prescription blocked.',
    isRead: false, createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    actionLabel: 'View Safety Alerts', actionSection: 'safety', patientName: 'Mohammed Asif',
  },
  {
    id: 'n11', type: 'PRESCRIPTION', category: 'INFO', title: 'Prescription Renewal Due',
    message: "Lakshmi Iyer's prescription for Metformin 500mg expires in 3 days.",
    isRead: false, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Prescriptions', actionSection: 'prescriptions', patientName: 'Lakshmi Iyer',
  },
  {
    id: 'n12', type: 'LAB_RESULT', category: 'INFO', title: 'Lab Results Ready',
    message: 'Complete blood count and lipid panel results now available for Rajesh Kumar Sharma.',
    isRead: true, createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Lab Orders', actionSection: 'lab-orders', patientName: 'Rajesh Kumar Sharma',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const isRead = searchParams.get('isRead')

  let notifications = [...mockNotifications]

  if (type) {
    notifications = notifications.filter(n => n.type === type)
  }
  if (category) {
    notifications = notifications.filter(n => n.category === category)
  }
  if (isRead !== null && isRead !== undefined) {
    const readBool = isRead === 'true'
    notifications = notifications.filter(n => n.isRead === readBool)
  }

  const total = mockNotifications.length
  const unread = mockNotifications.filter(n => !n.isRead).length
  const critical = mockNotifications.filter(n => n.category === 'CRITICAL').length
  const today = mockNotifications.filter(n => {
    const diffMs = Date.now() - new Date(n.createdAt).getTime()
    return diffMs < 24 * 60 * 60 * 1000
  }).length

  return NextResponse.json({
    notifications,
    stats: { total, unread, critical, today },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In production, update database with Prisma
    return NextResponse.json({
      success: true,
      message: `Notification ${notificationId} ${action}`,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
