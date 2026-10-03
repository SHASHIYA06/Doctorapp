import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── PATCH: Update appointment (status change, cancel) ──────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status) updateData.status = body.status
    if (body.cancelReason) updateData.cancelledReason = body.cancelReason
    if (body.notes) updateData.notes = body.notes
    if (body.isUrgent !== undefined) updateData.isUrgent = body.isUrgent

    const updated = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[APPOINTMENT_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

// ─── DELETE: Cancel appointment ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const updated = await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[APPOINTMENT_DELETE]', error)
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }
}
