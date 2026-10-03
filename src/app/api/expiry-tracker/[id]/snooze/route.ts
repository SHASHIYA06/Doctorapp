import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── PUT: Snooze an expiry alert ──────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { days, reason } = body as {
      days: number
      reason?: string
    }

    if (!days || days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Snooze days must be between 1 and 90' },
        { status: 400 }
      )
    }

    const existing = await db.expiryTrackerItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Expiry tracker item not found' }, { status: 404 })
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: 'Cannot snooze an inactive item' },
        { status: 400 }
      )
    }

    const now = new Date()
    const snoozedUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const updated = await db.expiryTrackerItem.update({
      where: { id },
      data: { snoozedUntil },
    })

    // Calculate metadata
    const daysRemaining = Math.ceil(
      (updated.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const isExpired = daysRemaining <= 0

    return NextResponse.json({
      data: {
        ...updated,
        snoozeInfo: {
          snoozedForDays: days,
          snoozedUntil: snoozedUntil.toISOString(),
          reason: reason || 'User requested snooze',
          daysRemaining,
          isExpired,
          alertWillResumeAt: snoozedUntil.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[EXPIRY_SNOOZE]', error)
    return NextResponse.json({ error: 'Failed to snooze expiry alert' }, { status: 500 })
  }
}
