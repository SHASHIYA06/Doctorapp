import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schemas ──────────────────────────────────────────

const dischargeSummaryCreateSchema = z.object({
  patientId: z.string().min(1),
  encounterId: z.string().optional(),
  admittingDiagnosis: z.string().min(1),
  dischargeDiagnosis: z.string().optional(),
  chiefComplaints: z.string().optional(),
  investigationsSummary: z.string().optional(),
  treatmentGiven: z.string().optional(),
  conditionAtDischarge: z.enum(['IMPROVED', 'STABLE', 'CRITICAL', 'EXPIRED']).default('STABLE'),
  medications: z.string().optional(),
  followUpInstructions: z.string().optional(),
  dietAdvice: z.string().optional(),
  activityRestrictions: z.string().optional(),
})

// ─── GET: Discharge Summaries ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId

    const [summaries, total] = await Promise.all([
      db.dischargeSummary.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.dischargeSummary.count({ where }),
    ])

    return NextResponse.json({
      summaries: summaries.map(s => ({
        ...s,
        patientName: s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'Unknown',
      })),
      pagination: { page, limit, total },
    })
  } catch (error) {
    console.error('[DISCHARGE_SUMMARY_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch discharge summaries' }, { status: 500 })
  }
}

// ─── POST: Create Discharge Summary ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = dischargeSummaryCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Verify patient exists
    const patient = await db.patient.findUnique({ where: { id: data.patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const summary = await db.dischargeSummary.create({
      data: {
        patientId: data.patientId,
        encounterId: data.encounterId || null,
        admittingDiagnosis: data.admittingDiagnosis,
        dischargeDiagnosis: data.dischargeDiagnosis || null,
        chiefComplaints: data.chiefComplaints || null,
        investigationsSummary: data.investigationsSummary || null,
        treatmentGiven: data.treatmentGiven || null,
        conditionAtDischarge: data.conditionAtDischarge,
        medications: data.medications || null,
        followUpInstructions: data.followUpInstructions || null,
        dietAdvice: data.dietAdvice || null,
        activityRestrictions: data.activityRestrictions || null,
        isSigned: false,
        isLocked: false,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Create timeline event
    await db.patientTimelineEvent.create({
      data: {
        patientId: data.patientId,
        eventType: 'DISCHARGE',
        title: 'Discharge Summary Created',
        description: `Admitting diagnosis: ${data.admittingDiagnosis}`,
        modality: 'ALLOPATHY',
      },
    })

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('[DISCHARGE_SUMMARY_POST]', error)
    return NextResponse.json({ error: 'Failed to create discharge summary' }, { status: 500 })
  }
}
