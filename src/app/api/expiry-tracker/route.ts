import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Helper: Calculate days remaining and notification milestones ─

function calculateExpiryMetadata(expiryDate: Date, snoozedUntil: Date | null) {
  const now = new Date()
  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining <= 0
  const isExpiringSoon = !isExpired && daysRemaining <= 30

  // Notification milestones
  const milestones = {
    notified30d: daysRemaining <= 30 && daysRemaining > 14,
    notified14d: daysRemaining <= 14 && daysRemaining > 7,
    notified7d: daysRemaining <= 7 && daysRemaining > 0,
    expired: isExpired,
  }

  // Severity based on remaining days
  let urgencyLevel: string
  if (isExpired) urgencyLevel = 'EXPIRED'
  else if (daysRemaining <= 7) urgencyLevel = 'CRITICAL'
  else if (daysRemaining <= 14) urgencyLevel = 'HIGH'
  else if (daysRemaining <= 30) urgencyLevel = 'MODERATE'
  else urgencyLevel = 'LOW'

  // Snooze status
  const isSnoozed = snoozedUntil ? snoozedUntil > now : false
  const snoozeRemaining = isSnoozed && snoozedUntil
    ? Math.ceil((snoozedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    daysRemaining,
    isExpired,
    isExpiringSoon,
    milestones,
    urgencyLevel,
    isSnoozed,
    snoozeRemainingDays: snoozeRemaining,
  }
}

// ─── GET: Get tracked expiry items ────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const urgencyLevel = searchParams.get('urgencyLevel') || ''
    const isExpired = searchParams.get('isExpired') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }
    if (patientId) where.patientId = patientId

    const [items, total] = await Promise.all([
      db.expiryTrackerItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: 'asc' },
      }),
      db.expiryTrackerItem.count({ where }),
    ])

    // Enrich with expiry metadata
    let enriched = items.map((item) => ({
      ...item,
      expiryMetadata: calculateExpiryMetadata(item.expiryDate, item.snoozedUntil),
    }))

    // Client-side filtering by urgency level
    if (urgencyLevel) {
      enriched = enriched.filter(
        (item) => item.expiryMetadata.urgencyLevel === urgencyLevel
      )
    }

    // Client-side filtering by expired status
    if (isExpired === 'true') {
      enriched = enriched.filter((item) => item.expiryMetadata.isExpired)
    } else if (isExpired === 'false') {
      enriched = enriched.filter((item) => !item.expiryMetadata.isExpired)
    }

    // Summary stats
    const allItems = await db.expiryTrackerItem.findMany({
      where: { isActive: true, ...(patientId ? { patientId } : {}) },
    })

    const stats = {
      total: allItems.length,
      expired: 0,
      expiringIn7d: 0,
      expiringIn14d: 0,
      expiringIn30d: 0,
      safe: 0,
    }

    for (const item of allItems) {
      const meta = calculateExpiryMetadata(item.expiryDate, item.snoozedUntil)
      if (meta.isExpired) stats.expired++
      else if (meta.daysRemaining <= 7) stats.expiringIn7d++
      else if (meta.daysRemaining <= 14) stats.expiringIn14d++
      else if (meta.daysRemaining <= 30) stats.expiringIn30d++
      else stats.safe++
    }

    return NextResponse.json({
      data: enriched,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[EXPIRY_TRACKER_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch expiry tracker items' }, { status: 500 })
  }
}

// ─── POST: Add item to track ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      medicineId,
      medicineName,
      batchNumber,
      expiryDate,
      quantity,
      isVerified,
    } = body as {
      patientId?: string
      medicineId?: string
      medicineName: string
      batchNumber?: string
      expiryDate: string
      quantity?: number
      isVerified?: boolean
    }

    if (!medicineName || !expiryDate) {
      return NextResponse.json(
        { error: 'medicineName and expiryDate are required' },
        { status: 400 }
      )
    }

    const parsedExpiry = new Date(expiryDate)
    if (isNaN(parsedExpiry.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expiryDate format. Use ISO 8601 (e.g., 2026-12-31)' },
        { status: 400 }
      )
    }

    const item = await db.expiryTrackerItem.create({
      data: {
        patientId: patientId || null,
        medicineId: medicineId || null,
        medicineName,
        batchNumber: batchNumber || null,
        expiryDate: parsedExpiry,
        quantity: quantity || null,
        isVerified: isVerified || false,
        notified7d: false,
        notified14d: false,
        notified30d: false,
        isActive: true,
      },
    })

    const metadata = calculateExpiryMetadata(item.expiryDate, item.snoozedUntil)

    return NextResponse.json({
      data: {
        ...item,
        expiryMetadata: metadata,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[EXPIRY_TRACKER_POST]', error)
    return NextResponse.json({ error: 'Failed to add expiry tracker item' }, { status: 500 })
  }
}
