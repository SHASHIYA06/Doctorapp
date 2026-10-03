import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── PUT: Update counterfeit report status (admin review) ────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, verifiedBy, adminNotes } = body as {
      status: string
      verifiedBy?: string
      adminNotes?: string
    }

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.counterfeitReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Counterfeit report not found' }, { status: 404 })
    }

    // Validate status transition
    const statusOrder = ['SUBMITTED', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED']
    const currentIdx = statusOrder.indexOf(existing.status)
    const newIdx = statusOrder.indexOf(status)

    // Allow UNDER_REVIEW → CONFIRMED or DISMISSED, SUBMITTED → UNDER_REVIEW
    if (existing.status === 'CONFIRMED' || existing.status === 'DISMISSED') {
      return NextResponse.json(
        { error: `Report is already in terminal status: ${existing.status}` },
        { status: 400 }
      )
    }

    if (status === 'SUBMITTED' && existing.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Cannot revert to SUBMITTED status' },
        { status: 400 }
      )
    }

    const updated = await db.counterfeitReport.update({
      where: { id },
      data: {
        status,
        verifiedBy: verifiedBy || null,
        verifiedAt: status === 'CONFIRMED' || status === 'DISMISSED' ? new Date() : null,
        adminNotes: adminNotes || null,
      },
    })

    // Audit event
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        actorId: verifiedBy,
        action: 'COUNTERFEIT_REPORT_UPDATED',
        resourceType: 'CounterfeitReport',
        resourceId: id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          previousStatus: existing.status,
          newStatus: status,
          adminNotes,
        }),
      },
    })

    // Status-specific metadata for Indian context
    const statusMetadata: Record<string, unknown> = {}
    if (status === 'UNDER_REVIEW') {
      statusMetadata.message = 'Report is now under review by CDSCO designated officer.'
      statusMetadata.estimatedCompletionDays = 7
    } else if (status === 'CONFIRMED') {
      statusMetadata.message = 'Counterfeit medicine confirmed. CDSCO will initiate enforcement action under Drugs & Cosmetics Act, 1940.'
      statusMetadata.legalProvisions = ['Section 17(4)', 'Rule 65 of Drugs Rules 1945']
    } else if (status === 'DISMISSED') {
      statusMetadata.message = 'Report dismissed after investigation. Medicine found to be genuine.'
    }

    return NextResponse.json({
      data: {
        ...updated,
        statusMetadata,
      },
    })
  } catch (error) {
    console.error('[COUNTERFEIT_PUT]', error)
    return NextResponse.json({ error: 'Failed to update counterfeit report' }, { status: 500 })
  }
}
