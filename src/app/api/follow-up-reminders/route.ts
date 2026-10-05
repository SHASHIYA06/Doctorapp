import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List follow-up reminders ───────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const type = searchParams.get('type') || undefined
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (type) where.type = type
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const reminders = await db.followUpReminder.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    })

    return NextResponse.json({ data: reminders })
  } catch (error) {
    console.error('[FOLLOW_UP_REMINDERS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list follow-up reminders' }, { status: 500 })
  }
}

// ─── POST: Create / Complete follow-up reminder ──────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Mark reminder as complete ──
    if (body.completeId) {
      const { completeId } = body

      const existing = await db.followUpReminder.findUnique({ where: { id: completeId } })
      if (!existing) {
        return NextResponse.json({ error: 'Follow-up reminder not found' }, { status: 404 })
      }

      const updated = await db.followUpReminder.update({
        where: { id: completeId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          isActive: false,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      })

      return NextResponse.json({ data: updated })
    }

    // ── Create new reminder ──
    const {
      patientId,
      practitionerId,
      type,
      title,
      description,
      scheduledAt,
      channel = 'IN_APP',
      recurrence,
      nextRecurrence,
    } = body

    if (!patientId || !type || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'patientId, type, title, and scheduledAt are required' },
        { status: 400 }
      )
    }

    const reminder = await db.followUpReminder.create({
      data: {
        patientId,
        practitionerId,
        type,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        channel,
        recurrence,
        nextRecurrence: nextRecurrence ? new Date(nextRecurrence) : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    })

    return NextResponse.json({ data: reminder }, { status: 201 })
  } catch (error) {
    console.error('[FOLLOW_UP_REMINDERS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to process follow-up reminder' }, { status: 500 })
  }
}
