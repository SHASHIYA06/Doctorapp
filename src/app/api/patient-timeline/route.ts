import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Patient Timeline Events ────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const eventType = searchParams.get('eventType')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { patientId }
    if (eventType) where.eventType = eventType

    const events = await db.patientTimelineEvent.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      take: limit,
    })

    // Transform to frontend-friendly format
    const timeline = events.map((e) => ({
      id: e.id,
      patientId: e.patientId,
      eventType: e.eventType,
      modality: e.modality || 'ALLOPATHY',
      title: e.title,
      description: e.description || '',
      timestamp: e.eventDate.toISOString(),
      isSignificant: e.isSignificant,
      data: e.data ? JSON.parse(e.data) : {},
    }))

    return NextResponse.json({ data: timeline, events: timeline })
  } catch (error) {
    console.error('[PATIENT_TIMELINE]', error)
    return NextResponse.json({ error: 'Failed to load patient timeline' }, { status: 500 })
  }
}
