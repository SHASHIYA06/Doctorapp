import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const createConsentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  type: z.enum(['TREATMENT', 'DATA_SHARING', 'AI_ASSISTED', 'RESEARCH']),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
})

const updateConsentSchema = z.object({
  id: z.string().min(1, 'Consent ID is required'),
  status: z.enum(['GRANTED', 'REVOKED']),
  notes: z.string().optional(),
})

// ─── GET: List consents ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId query parameter is required' }, { status: 400 })
    }

    const consents = await db.consent.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: consents })
  } catch (error) {
    console.error('[CONSENT_LIST]', error)
    return NextResponse.json({ error: 'Failed to list consents' }, { status: 500 })
  }
}

// ─── POST: Create consent ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createConsentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify patient exists and is active
    const patient = await db.patient.findUnique({
      where: { id: data.patientId },
    })
    if (!patient || !patient.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const consent = await db.consent.create({
      data: {
        patientId: data.patientId,
        type: data.type,
        modality: data.modality,
        notes: data.notes,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: patient.tenantId,
        action: 'CREATE',
        resourceType: 'Consent',
        resourceId: consent.id,
        patientId: data.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ type: data.type, modality: data.modality }),
      },
    })

    return NextResponse.json({ data: consent }, { status: 201 })
  } catch (error) {
    console.error('[CONSENT_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create consent' }, { status: 500 })
  }
}

// ─── PUT: Update consent status ──────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateConsentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, status, notes } = parsed.data

    const existing = await db.consent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Consent not found' }, { status: 404 })
    }

    const now = new Date()
    const consent = await db.consent.update({
      where: { id },
      data: {
        status,
        notes: notes ?? existing.notes,
        grantedAt: status === 'GRANTED' ? now : existing.grantedAt,
        revokedAt: status === 'REVOKED' ? now : existing.revokedAt,
      },
    })

    // Audit
    const patient = await db.patient.findUnique({ where: { id: existing.patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        action: 'UPDATE',
        resourceType: 'Consent',
        resourceId: id,
        patientId: existing.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ status, previousStatus: existing.status }),
      },
    })

    return NextResponse.json({ data: consent })
  } catch (error) {
    console.error('[CONSENT_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 })
  }
}
