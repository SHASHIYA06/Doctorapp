import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schema ────────────────────────────────────────────

const assignClinicianSchema = z.object({
  encounterId: z.string().min(1, 'Encounter ID is required'),
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
})

// ─── GET: List encounters awaiting clinician review ──────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modality = searchParams.get('modality')

    const where: Record<string, unknown> = {
      status: 'IN_PROGRESS',
      practitionerId: null, // Unassigned
    }
    if (modality) where.modality = modality

    const encounters = await db.encounter.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // FIFO - oldest first
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            allergies: {
              select: { id: true, substance: true, reaction: true, severity: true },
            },
          },
        },
        intake: true,
        triageAssessment: true,
      },
    })

    // Also get assigned encounters in progress
    const assignedWhere: Record<string, unknown> = {
      status: 'IN_PROGRESS',
      practitionerId: { not: null },
    }
    if (modality) assignedWhere.modality = modality

    const assignedEncounters = await db.encounter.findMany({
      where: assignedWhere,
      orderBy: { startedAt: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        intake: true,
        triageAssessment: true,
        practitioner: {
          select: { id: true, name: true, specialization: true },
        },
      },
    })

    return NextResponse.json({
      data: {
        unassigned: encounters,
        assigned: assignedEncounters,
        summary: {
          unassignedCount: encounters.length,
          assignedCount: assignedEncounters.length,
        },
      },
    })
  } catch (error) {
    console.error('[CLINICIAN_QUEUE_LIST]', error)
    return NextResponse.json({ error: 'Failed to list clinician queue' }, { status: 500 })
  }
}

// ─── POST: Assign clinician to encounter ─────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = assignClinicianSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { encounterId, practitionerId } = parsed.data

    // Verify encounter exists and is in progress
    const encounter = await db.encounter.findUnique({ where: { id: encounterId } })
    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }
    if (encounter.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Encounter is ${encounter.status}, cannot assign` },
        { status: 400 }
      )
    }

    // Verify practitioner exists and is active
    const practitioner = await db.practitioner.findUnique({
      where: { id: practitionerId },
    })
    if (!practitioner || !practitioner.isActive) {
      return NextResponse.json({ error: 'Practitioner not found or inactive' }, { status: 404 })
    }

    // Assign clinician
    const updated = await db.encounter.update({
      where: { id: encounterId },
      data: {
        practitionerId,
        startedAt: encounter.startedAt ?? new Date(),
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        practitioner: {
          select: { id: true, name: true, specialization: true },
        },
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: encounter.tenantId,
        actorId: practitionerId,
        action: 'ASSIGN_CLINICIAN',
        resourceType: 'Encounter',
        resourceId: encounterId,
        patientId: encounter.patientId,
        encounterId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ practitionerId, practitionerName: practitioner.name }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[CLINICIAN_ASSIGN]', error)
    return NextResponse.json({ error: 'Failed to assign clinician' }, { status: 500 })
  }
}
