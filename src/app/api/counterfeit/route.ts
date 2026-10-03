import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List counterfeit reports with filtering ─────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const severity = searchParams.get('severity') || ''
    const medicineName = searchParams.get('medicineName') || ''
    const district = searchParams.get('district') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (severity) where.severity = severity
    if (medicineName) {
      where.medicineName = { contains: medicineName, mode: 'insensitive' }
    }

    const [reports, total] = await Promise.all([
      db.counterfeitReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.counterfeitReport.count({ where }),
    ])

    // Enrich with Indian context data
    const enriched = reports.map((report) => ({
      ...report,
      jurisdictionInfo: {
        authority: 'CDSCO',
        helpline: '1800-180-3024',
        onlinePortal: 'https://www.cdsco.gov.in',
        reportingFormat: 'Form 44 under Drugs and Cosmetics Act, 1940',
      },
      timeline: {
        submittedAt: report.createdAt,
        estimatedReviewDays: 7,
        maxInvestigationDays: 30,
      },
    }))

    // Stats summary
    const [totalCount, submittedCount, underReviewCount, confirmedCount, dismissedCount] = await Promise.all([
      db.counterfeitReport.count(),
      db.counterfeitReport.count({ where: { status: 'SUBMITTED' } }),
      db.counterfeitReport.count({ where: { status: 'UNDER_REVIEW' } }),
      db.counterfeitReport.count({ where: { status: 'CONFIRMED' } }),
      db.counterfeitReport.count({ where: { status: 'DISMISSED' } }),
    ])

    return NextResponse.json({
      data: enriched,
      stats: {
        total: totalCount,
        submitted: submittedCount,
        underReview: underReviewCount,
        confirmed: confirmedCount,
        dismissed: dismissedCount,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[COUNTERFEIT_GET]', error)
    return NextResponse.json({ error: 'Failed to list counterfeit reports' }, { status: 500 })
  }
}

// ─── POST: Submit counterfeit report ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId,
      reporterName,
      reporterPhone,
      medicineName,
      batchNumber,
      manufacturer,
      purchaseLocation,
      purchaseDate,
      description,
      photoUrl,
      proofImageUrl,
      severity,
    } = body as {
      tenantId?: string
      reporterName?: string
      reporterPhone?: string
      medicineName: string
      batchNumber?: string
      manufacturer?: string
      purchaseLocation?: string
      purchaseDate?: string
      description?: string
      photoUrl?: string
      proofImageUrl?: string
      severity?: string
    }

    if (!medicineName) {
      return NextResponse.json(
        { error: 'medicineName is required' },
        { status: 400 }
      )
    }

    // Resolve tenant
    let resolvedTenantId = tenantId
    if (!resolvedTenantId) {
      const tenant = await db.tenant.findFirst({ where: { isActive: true } })
      resolvedTenantId = tenant?.id
    }

    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: 'No active tenant found. Provide tenantId.' },
        { status: 400 }
      )
    }

    const report = await db.counterfeitReport.create({
      data: {
        tenantId: resolvedTenantId,
        reporterName: reporterName || null,
        reporterPhone: reporterPhone || null,
        medicineName,
        batchNumber: batchNumber || null,
        manufacturer: manufacturer || null,
        purchaseLocation: purchaseLocation || null,
        purchaseDate: purchaseDate || null,
        description: description || null,
        photoUrl: photoUrl || null,
        proofImageUrl: proofImageUrl || null,
        severity: severity || 'MODERATE',
        status: 'SUBMITTED',
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: resolvedTenantId,
        action: 'COUNTERFEIT_REPORT_SUBMITTED',
        resourceType: 'CounterfeitReport',
        resourceId: report.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ medicineName, batchNumber, severity: report.severity }),
      },
    })

    return NextResponse.json({
      data: {
        ...report,
        acknowledgment: {
          referenceNumber: `CFR/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`,
          message: 'Your counterfeit medicine report has been submitted. CDSCO will review within 7 working days.',
          helpline: '1800-180-3024',
          onlineTracking: `https://www.cdsco.gov.in/counterfeit/track/${report.id}`,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[COUNTERFEIT_POST]', error)
    return NextResponse.json({ error: 'Failed to submit counterfeit report' }, { status: 500 })
  }
}
