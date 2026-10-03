import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List appointments ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const status = searchParams.get('status') || undefined
    const practitionerId = searchParams.get('practitionerId') || undefined
    const date = searchParams.get('date') || undefined

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (practitionerId) where.practitionerId = practitionerId
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.scheduledAt = { gte: start, lte: end }
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: appointments })
  } catch (error) {
    console.error('[APPOINTMENTS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list appointments' }, { status: 500 })
  }
}

// ─── POST: Create appointment ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      practitionerId,
      type = 'CONSULTATION',
      modality = 'ALLOPATHY',
      status = 'SCHEDULED',
      scheduledAt,
      duration = 15,
      reason,
      notes,
      isUrgent = false,
      cancelledReason,
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 })
    }

    // Generate appointmentNo: APT-YYYYMMDD-XXXX
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
    const todayCount = await db.appointment.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    })
    const seq = String(todayCount + 1).padStart(4, '0')
    const appointmentNo = `APT-${dateStr}-${seq}`

    const appointment = await db.appointment.create({
      data: {
        patientId,
        practitionerId,
        appointmentNo,
        type,
        modality,
        status,
        scheduledAt: new Date(scheduledAt),
        duration,
        reason,
        notes,
        isUrgent,
        cancelledReason,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: appointment }, { status: 201 })
  } catch (error) {
    console.error('[APPOINTMENTS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
