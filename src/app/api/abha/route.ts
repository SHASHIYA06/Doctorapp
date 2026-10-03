import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Check ABHA link status ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const abhaNumber = searchParams.get('abhaNumber') || ''
    const patientId = searchParams.get('patientId') || ''

    if (!abhaNumber && !patientId) {
      return NextResponse.json(
        { error: 'Provide abhaNumber or patientId query parameter' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}
    if (abhaNumber) where.abhaNumber = abhaNumber
    if (patientId) where.patientId = patientId

    const link = await db.aBHALink.findFirst({
      where,
      include: {
        records: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!link) {
      return NextResponse.json({
        data: {
          isLinked: false,
          abhaNumber: abhaNumber || null,
          linkDetails: null,
        },
      })
    }

    return NextResponse.json({
      data: {
        isLinked: true,
        abhaNumber: link.abhaNumber,
        linkDetails: {
          id: link.id,
          healthId: link.healthId,
          name: link.name,
          gender: link.gender,
          dateOfBirth: link.dateOfBirth,
          mobile: link.mobile,
          email: link.email,
          district: link.district,
          state: link.state,
          pincode: link.pincode,
          isActive: link.isActive,
          linkedAt: link.linkedAt,
          recentRecords: link.records.length,
        },
      },
    })
  } catch (error) {
    console.error('[ABHA_GET]', error)
    return NextResponse.json({ error: 'Failed to check ABHA link status' }, { status: 500 })
  }
}

// ─── POST: Link ABHA number ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { abhaNumber, patientId } = body as {
      abhaNumber: string
      patientId?: string
    }

    if (!abhaNumber) {
      return NextResponse.json(
        { error: 'abhaNumber is required' },
        { status: 400 }
      )
    }

    // Validate ABHA number format (14-digit)
    const cleanAbha = abhaNumber.replace(/\s/g, '')
    if (!/^\d{14}$/.test(cleanAbha)) {
      return NextResponse.json(
        { error: 'ABHA number must be a 14-digit number' },
        { status: 400 }
      )
    }

    // Check if already linked
    const existing = await db.aBHALink.findUnique({
      where: { abhaNumber: cleanAbha },
    })

    if (existing) {
      // Update patientId if provided and different
      if (patientId && existing.patientId !== patientId) {
        const updated = await db.aBHALink.update({
          where: { abhaNumber: cleanAbha },
          data: { patientId },
        })
        return NextResponse.json({
          data: {
            ...updated,
            status: 'UPDATED',
            message: 'ABHA number already existed; patientId updated',
          },
        })
      }
      return NextResponse.json({
        data: {
          ...existing,
          status: 'ALREADY_LINKED',
          message: 'ABHA number is already linked',
        },
      })
    }

    // Create new ABHA link with mock demographic data for Indian context
    const link = await db.aBHALink.create({
      data: {
        abhaNumber: cleanAbha,
        patientId: patientId || null,
        healthId: `${cleanAbha.slice(0, 4)}@abdm`,
        name: null,
        gender: null,
        dateOfBirth: null,
        mobile: null,
        email: null,
        district: null,
        state: null,
        pincode: null,
        isActive: true,
      },
    })

    // Create audit event
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        patientId: patientId || null,
        action: 'ABHA_LINKED',
        resourceType: 'ABHALink',
        resourceId: link.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ abhaNumber: cleanAbha, patientId }),
      },
    })

    return NextResponse.json({
      data: {
        ...link,
        status: 'LINKED',
        message: 'ABHA number linked successfully',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[ABHA_POST]', error)
    return NextResponse.json({ error: 'Failed to link ABHA number' }, { status: 500 })
  }
}
