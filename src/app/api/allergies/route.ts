import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const addAllergySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  substance: z.string().min(1, 'Substance is required'),
  reaction: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']).default('MODERATE'),
})

const verifyAllergySchema = z.object({
  id: z.string().min(1, 'Allergy ID is required'),
  verified: z.boolean(),
  verifiedBy: z.string().optional(),
})

// ─── GET: List allergies for a patient ───────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      )
    }

    const allergies = await db.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: allergies })
  } catch (error) {
    console.error('[ALLERGIES_LIST]', error)
    return NextResponse.json({ error: 'Failed to list allergies' }, { status: 500 })
  }
}

// ─── POST: Add allergy ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = addAllergySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify patient
    const patient = await db.patient.findUnique({ where: { id: data.patientId } })
    if (!patient || !patient.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check for duplicate allergy
    const existing = await db.allergy.findFirst({
      where: {
        patientId: data.patientId,
        substance: { equals: data.substance, mode: 'insensitive' },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Allergy to this substance already exists for this patient' },
        { status: 409 }
      )
    }

    const allergy = await db.allergy.create({
      data: {
        patientId: data.patientId,
        substance: data.substance,
        reaction: data.reaction ?? null,
        severity: data.severity,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: patient.tenantId,
        action: 'CREATE',
        resourceType: 'Allergy',
        resourceId: allergy.id,
        patientId: data.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ substance: data.substance, severity: data.severity }),
      },
    })

    return NextResponse.json({ data: allergy }, { status: 201 })
  } catch (error) {
    console.error('[ALLERGIES_CREATE]', error)
    return NextResponse.json({ error: 'Failed to add allergy' }, { status: 500 })
  }
}

// ─── PUT: Verify allergy ─────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyAllergySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, verified, verifiedBy } = parsed.data

    const existing = await db.allergy.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 })
    }

    const allergy = await db.allergy.update({
      where: { id },
      data: { verified },
    })

    // Audit
    const patient = await db.patient.findUnique({ where: { id: existing.patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        actorId: verifiedBy ?? null,
        action: verified ? 'VERIFY' : 'UNVERIFY',
        resourceType: 'Allergy',
        resourceId: id,
        patientId: existing.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ substance: existing.substance, verified }),
      },
    })

    return NextResponse.json({ data: allergy })
  } catch (error) {
    console.error('[ALLERGIES_VERIFY]', error)
    return NextResponse.json({ error: 'Failed to verify allergy' }, { status: 500 })
  }
}
