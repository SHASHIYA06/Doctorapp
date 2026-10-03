import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List CDS alerts ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertType = searchParams.get('alertType') || undefined
    const severity = searchParams.get('severity') || undefined
    const isActive = searchParams.get('isActive')
    const isAcknowledged = searchParams.get('isAcknowledged')

    const where: Record<string, unknown> = {}
    if (alertType) where.alertType = alertType
    if (severity) where.severity = severity
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (isAcknowledged !== null && isAcknowledged !== undefined && isAcknowledged !== '') {
      where.isAcknowledged = isAcknowledged === 'true'
    }

    const alerts = await db.cDSAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('[CDS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list CDS alerts' }, { status: 500 })
  }
}

// ─── POST: Create / Acknowledge / Override CDS alert ─────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Acknowledge alert ──
    if (body.acknowledgeId) {
      const { acknowledgeId, acknowledgedBy } = body

      const existing = await db.cDSAlert.findUnique({ where: { id: acknowledgeId } })
      if (!existing) {
        return NextResponse.json({ error: 'CDS alert not found' }, { status: 404 })
      }

      const updated = await db.cDSAlert.update({
        where: { id: acknowledgeId },
        data: {
          isAcknowledged: true,
          acknowledgedBy: acknowledgedBy || undefined,
          acknowledgedAt: new Date(),
        },
      })

      return NextResponse.json({ data: updated })
    }

    // ── Override alert ──
    if (body.overrideId) {
      const { overrideId, overrideReason } = body

      const existing = await db.cDSAlert.findUnique({ where: { id: overrideId } })
      if (!existing) {
        return NextResponse.json({ error: 'CDS alert not found' }, { status: 404 })
      }
      if (!existing.isOverrideable) {
        return NextResponse.json(
          { error: 'This alert cannot be overridden' },
          { status: 403 }
        )
      }

      const updated = await db.cDSAlert.update({
        where: { id: overrideId },
        data: {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          overrideReason: overrideReason || 'No reason provided',
          isActive: false,
        },
      })

      return NextResponse.json({ data: updated })
    }

    // ── Create new alert ──
    const {
      patientId,
      practitionerId,
      encounterId,
      alertType,
      severity = 'INFO',
      title,
      description,
      evidence,
      suggestedAction,
      isOverrideable = true,
    } = body

    if (!alertType || !title || !description) {
      return NextResponse.json(
        { error: 'alertType, title, and description are required' },
        { status: 400 }
      )
    }

    const alert = await db.cDSAlert.create({
      data: {
        patientId,
        practitionerId,
        encounterId,
        alertType,
        severity,
        title,
        description,
        evidence,
        suggestedAction,
        isOverrideable,
      },
    })

    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error) {
    console.error('[CDS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to process CDS alert' }, { status: 500 })
  }
}

// ─── PUT: Acknowledge / Override CDS alert ───────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, reason } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.cDSAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'CDS alert not found' }, { status: 404 })
    }

    // ── Acknowledge single alert ──
    if (action === 'acknowledge') {
      const updated = await db.cDSAlert.update({
        where: { id },
        data: {
          isAcknowledged: true,
          acknowledgedBy: 'Current User',
          acknowledgedAt: new Date(),
        },
      })
      return NextResponse.json({ data: updated })
    }

    // ── Acknowledge all non-critical ──
    if (action === 'acknowledge_all') {
      const excludeCritical = body.excludeCritical === true
      const where: Record<string, unknown> = {
        isAcknowledged: false,
      }
      if (excludeCritical) where.severity = { not: 'CRITICAL' }

      await db.cDSAlert.updateMany({
        where,
        data: {
          isAcknowledged: true,
          acknowledgedBy: 'Current User',
          acknowledgedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true })
    }

    // ── Override alert ──
    if (action === 'override') {
      if (!existing.isOverrideable) {
        return NextResponse.json(
          { error: 'This alert cannot be overridden' },
          { status: 403 }
        )
      }

      const updated = await db.cDSAlert.update({
        where: { id },
        data: {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          overrideReason: reason || 'No reason provided',
          isActive: false,
        },
      })
      return NextResponse.json({ data: updated })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[CDS_PUT]', error)
    return NextResponse.json({ error: 'Failed to process CDS alert' }, { status: 500 })
  }
}
