import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List referrals + practitioners ──────────────────────────────

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
    const status = searchParams.get('status')
    if (status) where.status = status
    const urgency = searchParams.get('urgency')
    if (urgency) where.urgency = urgency
    const specialty = searchParams.get('specialty')
    if (specialty) where.referredSpeciality = specialty

    const referrals = await db.referral.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patientId: true,
        fromPractitionerId: true,
        toPractitionerId: true,
        modality: true,
        targetModality: true,
        reason: true,
        clinicalSummary: true,
        urgency: true,
        status: true,
        referredSpeciality: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        patient: { select: { firstName: true, lastName: true } },
        fromPractitioner: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        toPractitioner: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    const data = referrals.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      fromPractitionerId: r.fromPractitionerId,
      fromPractitionerName: `${r.fromPractitioner.user.firstName} ${r.fromPractitioner.user.lastName}`,
      fromModality: r.modality,
      toPractitionerId: r.toPractitionerId ?? '',
      toPractitionerName: r.toPractitioner
        ? `${r.toPractitioner.user.firstName} ${r.toPractitioner.user.lastName}`
        : 'Unassigned',
      toModality: r.targetModality ?? r.modality,
      specialty: r.referredSpeciality ?? 'General',
      urgency: r.urgency,
      status: r.status,
      clinicalSummary: r.clinicalSummary ?? '',
      reason: r.reason,
      notes: r.notes ?? '',
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[REFERRALS_LIST]', error)
    return NextResponse.json({ data: [], practitioners: [] })
  }
}

// ─── POST: Create referral ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      toPractitionerId,
      specialty,
      urgency,
      fromModality,
      toModality,
      clinicalSummary,
      reason,
      notes,
    } = body

    // Find a from-practitioner (first active for the modality)
    const fromPractitioner = await db.practitioner.findFirst({
      where: { modality: fromModality, isActive: true },
    })
    if (!fromPractitioner) {
      return NextResponse.json({ error: 'No active practitioner found for from-modality' }, { status: 400 })
    }

    const referralNumber = `REF-${Date.now().toString(36).toUpperCase()}`

    const referral = await db.referral.create({
      data: {
        patientId,
        fromPractitionerId: fromPractitioner.id,
        toPractitionerId: toPractitionerId || null,
        referralNumber,
        modality: fromModality,
        targetModality: toModality ?? null,
        reason: reason || 'Cross-practitioner referral',
        clinicalSummary: clinicalSummary || null,
        urgency: urgency || 'ROUTINE',
        status: 'PENDING',
        referredSpeciality: specialty || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ data: referral }, { status: 201 })
  } catch (error) {
    console.error('[REFERRALS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
  }
}

// ─── PUT: Update referral status ──────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const existing = await db.referral.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
    }

    const now = new Date()
    const referral = await db.referral.update({
      where: { id },
      data: {
        status,
        respondedAt: status === 'ACCEPTED' || status === 'REJECTED' ? now : existing.respondedAt,
        completedAt: status === 'COMPLETED' ? now : existing.completedAt,
      },
    })

    return NextResponse.json({ data: referral })
  } catch (error) {
    console.error('[REFERRALS_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 })
  }
}
