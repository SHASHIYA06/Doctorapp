import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schema ────────────────────────────────────────────

const createAuditSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  actorId: z.string().optional(),
  actorRole: z.string().optional(),
  patientId: z.string().optional(),
  encounterId: z.string().optional(),
  action: z.string().min(1, 'Action is required'),
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().optional(),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']).default('SUCCESS'),
  reason: z.string().optional(),
  metadata: z.string().optional(), // JSON string
})

// ─── GET: List audit events ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const patientId = searchParams.get('patientId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType
    if (patientId) where.patientId = patientId

    const [events, total] = await Promise.all([
      db.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.auditEvent.count({ where }),
    ])

    return NextResponse.json({
      data: events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[AUDIT_LIST]', error)
    return NextResponse.json({ error: 'Failed to list audit events' }, { status: 500 })
  }
}

// ─── POST: Create audit event ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createAuditSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const event = await db.auditEvent.create({
      data: {
        tenantId: data.tenantId,
        actorId: data.actorId ?? null,
        actorRole: data.actorRole ?? null,
        patientId: data.patientId ?? null,
        encounterId: data.encounterId ?? null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId ?? null,
        outcome: data.outcome,
        reason: data.reason ?? null,
        metadata: data.metadata ?? null,
      },
    })

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    console.error('[AUDIT_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create audit event' }, { status: 500 })
  }
}
