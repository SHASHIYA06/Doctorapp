import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List Recalls / Stats ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'list' // 'list' or 'stats'
    const status = searchParams.get('status') || ''
    const severity = searchParams.get('severity') || ''
    const medicineName = searchParams.get('medicineName') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // ── Stats Mode ──
    if (mode === 'stats') {
      const [totalActive, totalInactive, bySeverity, recentRecalls] = await Promise.all([
        db.medicineRecall.count({ where: { isActive: true } }),
        db.medicineRecall.count({ where: { isActive: false } }),
        db.medicineRecall.groupBy({
          by: ['severity'],
          where: { isActive: true },
          _count: { severity: true },
        }),
        db.medicineRecall.findMany({
          where: { isActive: true },
          take: 5,
          orderBy: { recallDate: 'desc' },
          include: { medicine: { select: { id: true, name: true, genericName: true, manufacturer: true } } },
        }),
      ])

      // Build monthly breakdown (last 6 months mock)
      const now = new Date()
      const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return {
          month: d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
          count: Math.floor(Math.random() * 12) + 1,
          critical: Math.floor(Math.random() * 3),
          moderate: Math.floor(Math.random() * 5) + 1,
          minor: Math.floor(Math.random() * 4),
        }
      })

      return NextResponse.json({
        data: {
          totalActive,
          totalInactive,
          total: totalActive + totalInactive,
          bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.severity })),
          recentRecalls,
          monthlyBreakdown,
          lastUpdated: new Date().toISOString(),
        },
      })
    }

    // ── List Mode ──
    const where: Record<string, unknown> = {}

    if (status === 'ACTIVE') where.isActive = true
    else if (status === 'RESOLVED') where.isActive = false

    if (severity) where.severity = severity

    if (dateFrom || dateTo) {
      const recallDateFilter: Record<string, Date> = {}
      if (dateFrom) recallDateFilter.gte = new Date(dateFrom)
      if (dateTo) recallDateFilter.lte = new Date(dateTo)
      where.recallDate = recallDateFilter
    }

    if (medicineName) {
      const matchingMedicines = await db.medicine.findMany({
        where: {
          OR: [
            { name: { contains: medicineName, mode: 'insensitive' } },
            { genericName: { contains: medicineName, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      where.medicineId = { in: matchingMedicines.map(m => m.id) }
    }

    const [recalls, total] = await Promise.all([
      db.medicineRecall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recallDate: 'desc' },
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
      }),
      db.medicineRecall.count({ where }),
    ])

    // Add mock CDSCO reference numbers
    const enrichedRecalls = recalls.map((recall, idx) => ({
      ...recall,
      cdscoReference: `CDSCO/RECALL/${new Date(recall.recallDate).getFullYear()}/${String(idx + 1).padStart(4, '0')}`,
      acknowledgedBy: null as string | null,
      acknowledgedAt: null as string | null,
    }))

    return NextResponse.json({
      data: enrichedRecalls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[RECALLS_GET]', error)
    return NextResponse.json({ error: 'Failed to list recalls' }, { status: 500 })
  }
}

// ─── POST: Create Recall Alert ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicineId, medicineName, batchNumber, reason, severity, initiatedBy } = body as {
      medicineId?: string
      medicineName?: string
      batchNumber?: string
      reason: string
      severity?: string
      initiatedBy?: string
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for creating a recall' },
        { status: 400 }
      )
    }

    // Resolve medicineId if not provided
    let resolvedMedicineId = medicineId
    if (!resolvedMedicineId && medicineName) {
      const med = await db.medicine.findFirst({
        where: {
          OR: [
            { name: { contains: medicineName, mode: 'insensitive' } },
            { genericName: { contains: medicineName, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      resolvedMedicineId = med?.id
    }

    if (!resolvedMedicineId) {
      return NextResponse.json(
        { error: 'Medicine not found. Provide valid medicineId or medicineName' },
        { status: 400 }
      )
    }

    const recall = await db.medicineRecall.create({
      data: {
        medicineId: resolvedMedicineId,
        batchNumber: batchNumber || null,
        reason,
        severity: severity || 'MODERATE',
        initiatedBy: initiatedBy || 'CDSCO',
        isActive: true,
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            category: true,
            manufacturer: true,
          },
        },
      },
    })

    // Create audit event
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        action: 'RECALL_CREATED',
        resourceType: 'MedicineRecall',
        resourceId: recall.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ medicineId: resolvedMedicineId, reason, severity: recall.severity }),
      },
    })

    return NextResponse.json({
      data: {
        ...recall,
        cdscoReference: `CDSCO/RECALL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[RECALLS_POST]', error)
    return NextResponse.json({ error: 'Failed to create recall' }, { status: 500 })
  }
}

// ─── PUT: Update Recall Status ───────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive, notes } = body as {
      id: string
      isActive?: boolean
      notes?: string
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Recall ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.medicineRecall.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Recall not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const updated = await db.medicineRecall.update({
      where: { id },
      data: updateData,
      include: {
        medicine: {
          select: { id: true, name: true, genericName: true, manufacturer: true },
        },
      },
    })

    // Audit
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        action: 'RECALL_UPDATED',
        resourceType: 'MedicineRecall',
        resourceId: id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ isActive, notes }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[RECALLS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update recall' }, { status: 500 })
  }
}
