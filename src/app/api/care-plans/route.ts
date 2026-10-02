import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const createDraftSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  encounterId: z.string().optional(),
  practitionerId: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  content: z.string().min(1, 'Content is required'), // JSON string
  aiGenerated: z.boolean().default(false),
  citations: z.string().optional(), // JSON array
  safetyFlags: z.string().optional(), // JSON array
})

const updateDraftSchema = z.object({
  id: z.string().min(1, 'Draft ID is required'),
  action: z.enum(['REVIEW', 'SIGN', 'REJECT']),
  reviewerId: z.string().min(1, 'Reviewer ID is required'),
  reviewNotes: z.string().optional(),
  content: z.string().optional(), // Updated content (for review edits)
})

// ─── GET: List clinical drafts ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const drafts = await db.clinicalDraft.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        encounter: {
          select: { id: true, modality: true, status: true },
        },
      },
    })

    return NextResponse.json({ data: drafts })
  } catch (error) {
    console.error('[CARE_PLANS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list care plans' }, { status: 500 })
  }
}

// ─── POST: Create clinical draft ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createDraftSchema.safeParse(body)

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

    // Validate modality consent if AI-generated
    if (data.aiGenerated) {
      const aiConsent = await db.consent.findFirst({
        where: {
          patientId: data.patientId,
          type: 'AI_ASSISTED',
          modality: data.modality,
          status: 'GRANTED',
        },
      })
      if (!aiConsent) {
        return NextResponse.json(
          { error: 'AI-assisted care requires active consent for this modality' },
          { status: 403 }
        )
      }
    }

    const draft = await db.clinicalDraft.create({
      data: {
        patientId: data.patientId,
        encounterId: data.encounterId ?? null,
        practitionerId: data.practitionerId ?? null,
        modality: data.modality,
        content: data.content,
        aiGenerated: data.aiGenerated,
        citations: data.citations,
        safetyFlags: data.safetyFlags,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: patient.tenantId,
        action: 'CREATE',
        resourceType: 'ClinicalDraft',
        resourceId: draft.id,
        patientId: data.patientId,
        encounterId: data.encounterId ?? null,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          modality: data.modality,
          aiGenerated: data.aiGenerated,
        }),
      },
    })

    return NextResponse.json({ data: draft }, { status: 201 })
  } catch (error) {
    console.error('[CARE_PLANS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
  }
}

// ─── PUT: Clinician review actions ───────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateDraftSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, action, reviewerId, reviewNotes, content } = parsed.data

    const draft = await db.clinicalDraft.findUnique({ where: { id } })
    if (!draft) {
      return NextResponse.json({ error: 'Clinical draft not found' }, { status: 404 })
    }

    const now = new Date()
    let updatedDraft
    let signedCarePlan = null

    switch (action) {
      case 'REVIEW':
        if (draft.status !== 'DRAFT') {
          return NextResponse.json(
            { error: 'Only DRAFT drafts can be moved to review' },
            { status: 400 }
          )
        }
        updatedDraft = await db.clinicalDraft.update({
          where: { id },
          data: {
            status: 'UNDER_REVIEW',
            reviewedBy: reviewerId,
            reviewedAt: now,
            reviewNotes: reviewNotes ?? null,
            content: content ?? draft.content,
          },
        })
        break

      case 'SIGN':
        if (draft.status !== 'UNDER_REVIEW' && draft.status !== 'DRAFT') {
          return NextResponse.json(
            { error: 'Only DRAFT or UNDER_REVIEW drafts can be signed' },
            { status: 400 }
          )
        }
        updatedDraft = await db.clinicalDraft.update({
          where: { id },
          data: {
            status: 'SIGNED',
            reviewedBy: reviewerId,
            reviewedAt: draft.reviewedAt ?? now,
            signedBy: reviewerId,
            signedAt: now,
            reviewNotes: reviewNotes ?? draft.reviewNotes,
            content: content ?? draft.content,
          },
        })

        // Create SignedCarePlan
        signedCarePlan = await db.signedCarePlan.create({
          data: {
            patientId: draft.patientId,
            practitionerId: draft.practitionerId ?? null,
            draftId: draft.id,
            modality: draft.modality,
            content: content ?? draft.content,
            signedBy: reviewerId,
            signedAt: now,
          },
        })
        break

      case 'REJECT':
        if (draft.status === 'SIGNED') {
          return NextResponse.json(
            { error: 'Cannot reject a signed draft' },
            { status: 400 }
          )
        }
        updatedDraft = await db.clinicalDraft.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewedBy: reviewerId,
            reviewedAt: now,
            reviewNotes: reviewNotes ?? null,
          },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Audit
    const patient = await db.patient.findUnique({ where: { id: draft.patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        actorId: reviewerId,
        action: `DRAFT_${action}`,
        resourceType: 'ClinicalDraft',
        resourceId: id,
        patientId: draft.patientId,
        encounterId: draft.encounterId ?? null,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          action,
          signedCarePlanId: signedCarePlan?.id ?? null,
        }),
      },
    })

    return NextResponse.json({
      data: { draft: updatedDraft, signedCarePlan },
    })
  } catch (error) {
    console.error('[CARE_PLANS_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
  }
}
