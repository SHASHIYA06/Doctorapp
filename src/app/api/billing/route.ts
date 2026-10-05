import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
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
