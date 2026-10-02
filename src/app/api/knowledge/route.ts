import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const createKnowledgeSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Name is required'),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  sourceType: z.enum(['TEXTBOOK', 'GUIDELINE', 'MONOGRAPH', 'JOURNAL', 'PHARMACOPIA']),
  evidenceLevel: z.enum(['APPROVED', 'REVIEWED', 'EXPERIMENTAL']).optional(),
  jurisdiction: z.string().default('IN'),
  license: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
})

const updateKnowledgeSchema = z.object({
  id: z.string().min(1, 'Knowledge source ID is required'),
  reviewStatus: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  reviewerId: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ─── GET: List knowledge sources ─────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modality = searchParams.get('modality')
    const reviewStatus = searchParams.get('reviewStatus')
    const tenantId = searchParams.get('tenantId')

    const where: Record<string, unknown> = {}
    if (modality) where.modality = modality
    if (reviewStatus) where.reviewStatus = reviewStatus
    if (tenantId) where.tenantId = tenantId

    const sources = await db.knowledgeSource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { documents: true } },
      },
    })

    return NextResponse.json({ data: sources })
  } catch (error) {
    console.error('[KNOWLEDGE_LIST]', error)
    return NextResponse.json({ error: 'Failed to list knowledge sources' }, { status: 500 })
  }
}

// ─── POST: Create knowledge source ───────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createKnowledgeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify tenant exists
    const tenant = await db.tenant.findUnique({ where: { id: data.tenantId } })
    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 })
    }

    const source = await db.knowledgeSource.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        modality: data.modality,
        sourceType: data.sourceType,
        evidenceLevel: data.evidenceLevel ?? null,
        jurisdiction: data.jurisdiction,
        license: data.license ?? null,
        sourceUrl: data.sourceUrl || null,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: data.tenantId,
        action: 'CREATE',
        resourceType: 'KnowledgeSource',
        resourceId: source.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ name: data.name, modality: data.modality, sourceType: data.sourceType }),
      },
    })

    return NextResponse.json({ data: source }, { status: 201 })
  } catch (error) {
    console.error('[KNOWLEDGE_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create knowledge source' }, { status: 500 })
  }
}

// ─── PUT: Update review status ───────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateKnowledgeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, reviewStatus, reviewerId, isActive } = parsed.data

    const existing = await db.knowledgeSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Knowledge source not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      reviewStatus,
      reviewerId: reviewerId ?? null,
    }
    if (isActive !== undefined) updateData.isActive = isActive

    // Set effective dates on approval
    if (reviewStatus === 'APPROVED' && !existing.effectiveFrom) {
      updateData.effectiveFrom = new Date()
    }

    const source = await db.knowledgeSource.update({
      where: { id },
      data: updateData,
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: existing.tenantId,
        actorId: reviewerId ?? null,
        actorRole: 'KNOWLEDGE_CURATOR',
        action: 'REVIEW',
        resourceType: 'KnowledgeSource',
        resourceId: id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ reviewStatus, previousStatus: existing.reviewStatus }),
      },
    })

    return NextResponse.json({ data: source })
  } catch (error) {
    console.error('[KNOWLEDGE_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update knowledge source' }, { status: 500 })
  }
}
