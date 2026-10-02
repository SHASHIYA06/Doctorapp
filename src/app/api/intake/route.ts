import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const createIntakeSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  tenantId: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().optional(),
  reviewOfSystems: z.string().optional(), // JSON string
  reason: z.string().optional(),
})

// ─── GET: Get intake for an encounter ────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encounterId = searchParams.get('encounterId')

    if (!encounterId) {
      return NextResponse.json(
        { error: 'encounterId query parameter is required' },
        { status: 400 }
      )
    }

    const intake = await db.intake.findUnique({
      where: { encounterId },
      include: {
        encounter: {
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
          },
        },
      },
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found for this encounter' }, { status: 404 })
    }

    return NextResponse.json({ data: intake })
  } catch (error) {
    console.error('[INTAKE_GET]', error)
    return NextResponse.json({ error: 'Failed to get intake' }, { status: 500 })
  }
}

// ─── POST: Create intake + encounter ─────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createIntakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify patient exists
    const patient = await db.patient.findUnique({ where: { id: data.patientId } })
    if (!patient || !patient.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const tenantId = data.tenantId || patient.tenantId

    // Create encounter first
    const encounter = await db.encounter.create({
      data: {
        patientId: data.patientId,
        tenantId,
        modality: data.modality,
        status: 'IN_PROGRESS',
        reason: data.reason || data.chiefComplaint,
        startedAt: new Date(),
      },
    })

    // Create intake linked to encounter
    const intake = await db.intake.create({
      data: {
        encounterId: encounter.id,
        chiefComplaint: data.chiefComplaint,
        historyOfPresentIllness: data.historyOfPresentIllness,
        reviewOfSystems: data.reviewOfSystems,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId,
        action: 'CREATE',
        resourceType: 'Intake',
        resourceId: intake.id,
        patientId: data.patientId,
        encounterId: encounter.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          encounterId: encounter.id,
          chiefComplaint: data.chiefComplaint,
          modality: data.modality,
        }),
      },
    })

    return NextResponse.json(
      {
        data: { intake, encounter },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[INTAKE_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 })
  }
}
