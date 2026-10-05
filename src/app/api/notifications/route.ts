import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schemas ──────────────────────────────────────────

const notificationQuerySchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  isRead: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

const notificationActionSchema = z.object({
  notificationId: z.string().min(1),
  action: z.enum(['markRead', 'markUnread', 'dismiss']),
})

const notificationCreateSchema = z.object({
  type: z.enum(['RECALL', 'PRESCRIPTION', 'LAB_RESULT', 'APPOINTMENT', 'SAFETY', 'FOLLOW_UP', 'BILLING', 'REFERRAL', 'SYSTEM', 'DISCHARGE']),
  category: z.enum(['INFO', 'WARNING', 'URGENT', 'CRITICAL']).default('INFO'),
  title: z.string().min(1),
  message: z.string().min(1),
  patientId: z.string().optional(),
  actionLabel: z.string().optional(),
  actionSection: z.string().optional(),
  channel: z.enum(['IN_APP', 'SMS', 'WHATSAPP', 'PUSH', 'EMAIL']).default('IN_APP'),
})

// ─── GET: Notifications with filters and stats ──────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = notificationQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
    }

    const { type, category, isRead, page, limit } = parsed.data

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category
    if (isRead !== undefined) where.isRead = isRead === 'true'

    const [notifications, total] = await Promise.all([
      db.appNotification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.appNotification.count({ where }),
    ])

    // Compute stats
    const [allCount, unreadCount, criticalCount, todayCount] = await Promise.all([
      db.appNotification.count(),
      db.appNotification.count({ where: { isRead: false } }),
      db.appNotification.count({ where: { category: 'CRITICAL' } }),
      db.appNotification.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ])

    return NextResponse.json({
      notifications,
      stats: { total: allCount, unread: unreadCount, critical: criticalCount, today: todayCount },
      pagination: { page, limit, total },
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// ─── POST: Notification Actions & Creation ───────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if it's an action request (markRead/markUnread/dismiss)
    if (body.notificationId && body.action) {
      const parsed = notificationActionSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
      }

      const { notificationId, action } = parsed.data

      const notification = await db.appNotification.findUnique({ where: { id: notificationId } })
      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }

      if (action === 'markRead') {
        await db.appNotification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } })
      } else if (action === 'markUnread') {
        await db.appNotification.update({ where: { id: notificationId }, data: { isRead: false, readAt: null } })
      } else if (action === 'dismiss') {
        await db.appNotification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } })
      }

      return NextResponse.json({ success: true, message: `Notification ${notificationId} ${action}` })
    }

    // Otherwise, create a new notification
    const parsed = notificationCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const notification = await db.appNotification.create({
      data: {
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        patientId: data.patientId || null,
        actionLabel: data.actionLabel || null,
        actionSection: data.actionSection || null,
        channel: data.channel,
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('[NOTIFICATIONS_POST]', error)
    return NextResponse.json({ error: 'Failed to process notification request' }, { status: 500 })
  }
}
