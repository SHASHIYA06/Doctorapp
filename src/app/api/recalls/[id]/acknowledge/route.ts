import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── PUT: Acknowledge a Recall ────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { acknowledgedBy, notes } = body as {
      acknowledgedBy: string
      notes?: string
    }

    if (!acknowledgedBy) {
      return NextResponse.json(
        { error: 'acknowledgedBy is required' },
        { status: 400 }
      )
    }

    const existing = await db.medicineRecall.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Recall not found' }, { status: 404 })
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: 'Recall is already resolved/inactive' },
        { status: 400 }
      )
    }

    // Mark the recall as acknowledged (set isActive to false)
    const updated = await db.medicineRecall.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            category: true,
            manufacturer: true,
            modality: true,
          },
        },
      },
    })

    // Create audit event
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        actorId: acknowledgedBy,
        action: 'RECALL_ACKNOWLEDGED',
        resourceType: 'MedicineRecall',
        resourceId: id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          medicineId: existing.medicineId,
          batchNumber: existing.batchNumber,
          reason: existing.reason,
          acknowledgedAt: new Date().toISOString(),
          notes,
        }),
      },
    })

    return NextResponse.json({
      data: {
        ...updated,
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString(),
        notes,
      },
    })
  } catch (error) {
    console.error('[RECALL_ACKNOWLEDGE]', error)
    return NextResponse.json({ error: 'Failed to acknowledge recall' }, { status: 500 })
  }
}
