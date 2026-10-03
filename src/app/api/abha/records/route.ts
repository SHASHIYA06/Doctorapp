import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Get health records for an ABHA link ────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const abhaLinkId = searchParams.get('abhaLinkId') || ''
    const recordType = searchParams.get('recordType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!abhaLinkId) {
      return NextResponse.json(
        { error: 'abhaLinkId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the ABHA link exists
    const link = await db.aBHALink.findUnique({
      where: { id: abhaLinkId },
    })

    if (!link) {
      return NextResponse.json(
        { error: 'ABHA link not found' },
        { status: 404 }
      )
    }

    const where: Record<string, unknown> = { abhaLinkId }
    if (recordType) where.recordType = recordType

    const [records, total] = await Promise.all([
      db.aBHARecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.aBHARecord.count({ where }),
    ])

    return NextResponse.json({
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[ABHA_RECORDS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch ABHA records' }, { status: 500 })
  }
}

// ─── POST: Add health record to ABHA ─────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { abhaLinkId, recordType, data, source } = body as {
      abhaLinkId: string
      recordType: string
      data: unknown
      source?: string
    }

    if (!abhaLinkId || !recordType || !data) {
      return NextResponse.json(
        { error: 'abhaLinkId, recordType, and data are required' },
        { status: 400 }
      )
    }

    const validRecordTypes = ['verification', 'prescription', 'health_record', 'lab_report', 'discharge_summary', 'immunization', 'fitness_certificate']
    if (!validRecordTypes.includes(recordType)) {
      return NextResponse.json(
        { error: `Invalid recordType. Must be one of: ${validRecordTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify ABHA link exists
    const link = await db.aBHALink.findUnique({
      where: { id: abhaLinkId },
    })

    if (!link) {
      return NextResponse.json(
        { error: 'ABHA link not found' },
        { status: 404 }
      )
    }

    const record = await db.aBHARecord.create({
      data: {
        abhaLinkId,
        recordType,
        data: JSON.stringify(data),
        source: source || 'SELF_UPLOAD',
        verifiedAt: null,
      },
    })

    // Audit event
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        patientId: link.patientId,
        action: 'ABHA_RECORD_ADDED',
        resourceType: 'ABHARecord',
        resourceId: record.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ abhaLinkId, recordType, source }),
      },
    })

    return NextResponse.json({
      data: {
        ...record,
        parsedData: data,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[ABHA_RECORDS_POST]', error)
    return NextResponse.json({ error: 'Failed to add ABHA record' }, { status: 500 })
  }
}
