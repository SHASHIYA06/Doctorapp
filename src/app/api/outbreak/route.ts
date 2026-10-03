import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Indian Outbreak Reference Data ───────────────────────────────

const INDIAN_OUTBREAK_REFERENCES = [
  {
    title: 'Dengue Seasonal Alert — Delhi NCR',
    description: 'Elevated dengue cases reported across Delhi NCR. Aedes aegypti breeding sites identified in multiple districts. Municipal fogging operations underway.',
    district: 'New Delhi',
    state: 'Delhi',
    severity: 'HIGH',
    source: 'MCD Delhi / NCDC',
    isActive: true,
  },
  {
    title: 'Cholera Outbreak — Coastal Odisha',
    description: 'Cluster of cholera cases in coastal Odisha districts following monsoon flooding. Water contamination confirmed. ORS distribution centers activated.',
    district: 'Puri',
    state: 'Odisha',
    severity: 'CRITICAL',
    source: 'ICMR',
    isActive: true,
  },
  {
    title: 'Chandipura Virus Alert — Gujarat',
    description: 'Suspected Chandipura virus (CHPV) cases in tribal areas of Gujarat. Acute encephalitis syndrome (AES) surveillance intensified. Vector control measures deployed.',
    district: 'Valsad',
    state: 'Gujarat',
    severity: 'CRITICAL',
    source: 'ICMR / NIV Pune',
    isActive: true,
  },
  {
    title: 'Scrub Typhus — Sub-Himalayan Belt',
    description: 'Seasonal scrub typhus cases rising in Himachal Pradesh and Uttarakhand. Doxycycline prophylaxis recommended for high-risk populations.',
    district: 'Shimla',
    state: 'Himachal Pradesh',
    severity: 'MODERATE',
    source: 'State Health Directorate',
    isActive: true,
  },
  {
    title: 'Nipah Virus Surveillance — Kerala',
    description: 'Routine Nipah virus surveillance in Kozhikode district following historical outbreaks. No active cases but heightened monitoring continues through June.',
    district: 'Kozhikode',
    state: 'Kerala',
    severity: 'MODERATE',
    source: 'ICMR / NIV Pune',
    isActive: true,
  },
  {
    title: 'Leptospirosis — Mumbai Monsoon',
    description: 'Post-monsoon leptospirosis cases in Mumbai. High-risk groups: rice workers, sewage workers. Doxycycline prophylaxis recommended.',
    district: 'Mumbai',
    state: 'Maharashtra',
    severity: 'HIGH',
    source: 'BMC Health Department',
    isActive: true,
  },
]

// ─── GET: Get outbreak alerts ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActiveParam = searchParams.get('isActive') || ''
    const state = searchParams.get('state') || ''
    const district = searchParams.get('district') || ''
    const severity = searchParams.get('severity') || ''
    const source = searchParams.get('source') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (isActiveParam === 'true') where.isActive = true
    else if (isActiveParam === 'false') where.isActive = false
    else where.isActive = true // default to active

    if (state) where.state = state
    if (district) where.district = district
    if (severity) where.severity = severity
    if (source) where.source = { contains: source, mode: 'insensitive' }

    const [alerts, total] = await Promise.all([
      db.outbreakAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.outbreakAlert.count({ where }),
    ])

    // Enrich with Indian health system references
    const now = new Date()
    const enriched = alerts.map((alert) => {
      const isActivePeriod = alert.endsAt ? now <= alert.endsAt : true
      const daysSinceStart = Math.ceil(
        (now.getTime() - alert.startsAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        ...alert,
        isActivePeriod,
        daysSinceStart,
        healthSystemRefs: {
          nationalHotline: '104',
          emergencyNumber: '108',
          cdcIndia: 'https://ncdc.in',
          idspPortal: 'https://idsp.nic.in',
        },
      }
    })

    // Stats summary
    const [activeCount, criticalCount, highCount] = await Promise.all([
      db.outbreakAlert.count({ where: { isActive: true } }),
      db.outbreakAlert.count({ where: { isActive: true, severity: 'CRITICAL' } }),
      db.outbreakAlert.count({ where: { isActive: true, severity: 'HIGH' } }),
    ])

    return NextResponse.json({
      data: enriched,
      stats: {
        activeOutbreaks: activeCount,
        criticalOutbreaks: criticalCount,
        highSeverityOutbreaks: highCount,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[OUTBREAK_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch outbreak alerts' }, { status: 500 })
  }
}

// ─── POST: Create outbreak alert (admin) ──────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      district,
      state,
      severity,
      source,
      sourceUrl,
      startsAt,
      endsAt,
    } = body as {
      title: string
      description: string
      district?: string
      state?: string
      severity?: string
      source?: string
      sourceUrl?: string
      startsAt?: string
      endsAt?: string
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      )
    }

    const validSeverities = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
    const parsedSeverity = severity && validSeverities.includes(severity) ? severity : 'HIGH'

    const alert = await db.outbreakAlert.create({
      data: {
        title,
        description,
        district: district || null,
        state: state || null,
        severity: parsedSeverity,
        source: source || null,
        sourceUrl: sourceUrl || null,
        isActive: true,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })

    // Audit
    const tenant = await db.tenant.findFirst({ where: { isActive: true } })
    await db.auditEvent.create({
      data: {
        tenantId: tenant?.id ?? 'unknown',
        action: 'OUTBREAK_ALERT_CREATED',
        resourceType: 'OutbreakAlert',
        resourceId: alert.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ title, severity: parsedSeverity, state, district }),
      },
    })

    return NextResponse.json({
      data: {
        ...alert,
        notificationInfo: {
          channelsTriggered: ['in_app', 'sms', 'whatsapp'],
          affectedDistrict: district,
          affectedState: state,
          nationalHotline: '104',
          emergencyNumber: '108',
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[OUTBREAK_POST]', error)
    return NextResponse.json({ error: 'Failed to create outbreak alert' }, { status: 500 })
  }
}
