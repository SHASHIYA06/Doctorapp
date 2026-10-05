import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET: List billing records ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const records = await db.billingRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('[BILLING_LIST]', error)
    return NextResponse.json({ error: 'Failed to list billing records' }, { status: 500 })
  }
}

// ─── POST: Create billing record ─────────────────────────────────

const billingPostSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  encounterId: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']).optional(),
  consultationFee: z.number().optional(),
  medicineCharges: z.number().optional(),
  labCharges: z.number().optional(),
  procedureCharges: z.number().optional(),
  otherCharges: z.number().optional(),
  totalAmount: z.number().optional(),
  discount: z.number().optional(),
  tax: z.number().optional(),
  netAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = billingPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      encounterId,
      modality = 'ALLOPATHY',
      status = 'PENDING',
      consultationFee = 0,
      medicineCharges = 0,
      labCharges = 0,
      procedureCharges = 0,
      otherCharges = 0,
      totalAmount = 0,
      discount = 0,
      tax = 0,
      netAmount = 0,
      paidAmount = 0,
      paymentMethod,
      paymentRef,
      dueDate,
      paidAt,
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Generate invoiceNumber: INV-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('')
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const todayCount = await db.billingRecord.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    })
    const seq = String(todayCount + 1).padStart(4, '0')
    const invoiceNumber = `INV-${dateStr}-${seq}`

    const record = await db.billingRecord.create({
      data: {
        patientId,
        encounterId,
        invoiceNumber,
        modality,
        status,
        consultationFee,
        medicineCharges,
        labCharges,
        procedureCharges,
        otherCharges,
        totalAmount,
        discount,
        tax,
        netAmount,
        paidAmount,
        paymentMethod,
        paymentRef,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paidAt: paidAt ? new Date(paidAt) : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('[BILLING_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 })
  }
}
