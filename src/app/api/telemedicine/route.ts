import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List telemedicine sessions + practitioners ──────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practitionersOnly = searchParams.get('practitioners')

    // Return practitioners list for the form dropdowns
    if (practitionersOnly === 'true') {
      const practitioners = await db.practitioner.findMany({
        where: { isActive: true },
        select: {
          id: true,
          specialization: true,
          modality: true,
          user: { select: { firstName: true, lastName: true } },
        },
      })
      const mapped = practitioners.map((p) => ({
        id: p.id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        specialty: p.specialization ?? 'General',
        modality: p.modality,
      }))
      return NextResponse.json({ practitioners: mapped })
    }

    // Build filters
    const where: Record<string, unknown> = {}
    const modality = searchParams.get('modality')
    if (modality) where.modality = modality
    const status = searchParams.get('status')
    if (status) where.status = status

    const sessions = await db.telemedicineSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patientId: true,
        practitionerId: true,
        modality: true,
        status: true,
        duration: true,
        notes: true,
        prescriptionId: true,
        rating: true,
        feedback: true,
        recordingUrl: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        patient: { select: { firstName: true, lastName: true } },
        practitioner: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    const data = sessions.map((s) => ({
      id: s.id,
      patientId: s.patientId,
      patientName: `${s.patient.firstName} ${s.patient.lastName}`,
      practitionerId: s.practitionerId ?? '',
      practitionerName: s.practitioner
        ? `${s.practitioner.user.firstName} ${s.practitioner.user.lastName}`
        : 'Unassigned',
      modality: s.modality,
      status: s.status,
      scheduledAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
      durationMinutes: s.duration ? Math.round(s.duration / 60) : null,
      rating: s.rating,
      feedback: s.feedback,
      isRecording: !!s.recordingUrl,
      notes: s.notes ?? '',
      prescriptionId: s.prescriptionId ?? null,
      followUpScheduled: false,
      createdAt: s.createdAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[TELEMEDICINE_LIST]', error)
    return NextResponse.json({ data: [], practitioners: [] })
  }
}

// ─── POST: Schedule session ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, practitionerId, modality, scheduledAt, notes } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const sessionToken = `SESSION-${Date.now().toString(36).toUpperCase()}`

    const session = await db.telemedicineSession.create({
      data: {
        patientId,
        practitionerId: practitionerId || null,
        sessionToken,
        modality: modality || 'ALLOPATHY',
        status: 'SCHEDULED',
        platform: 'BUILT_IN',
        notes: notes || null,
      },
    })

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('[TELEMEDICINE_CREATE]', error)
    return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 })
  }
}

// ─── PUT: Update session ──────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, durationMinutes, rating, feedback } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const existing = await db.telemedicineSession.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      if (status === 'IN_PROGRESS') updateData.startedAt = new Date()
      if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED') updateData.endedAt = new Date()
    }
    if (durationMinutes !== undefined) updateData.duration = durationMinutes * 60
    if (rating !== undefined) updateData.rating = rating
    if (feedback !== undefined) updateData.feedback = feedback

    const session = await db.telemedicineSession.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error('[TELEMEDICINE_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
