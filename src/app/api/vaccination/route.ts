import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Indian NIS (National Immunization Schedule) reference data ────

const NIS_SCHEDULE = [
  { vaccineName: 'BCG', doseNumber: 1, totalDoses: 1, ageGroup: 'At Birth', route: 'Intradermal', site: 'LEFT_ARM' },
  { vaccineName: 'OPV (Birth)', doseNumber: 1, totalDoses: 1, ageGroup: 'At Birth', route: 'Oral', site: null },
  { vaccineName: 'Hepatitis B (Birth)', doseNumber: 1, totalDoses: 3, ageGroup: 'At Birth', route: 'Intramuscular', site: 'RIGHT_ARM' },
  { vaccineName: 'OPV-1', doseNumber: 1, totalDoses: 3, ageGroup: '6 Weeks', route: 'Oral', site: null },
  { vaccineName: 'Pentavalent-1', doseNumber: 1, totalDoses: 3, ageGroup: '6 Weeks', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'Rotavirus-1', doseNumber: 1, totalDoses: 3, ageGroup: '6 Weeks', route: 'Oral', site: null },
  { vaccineName: 'PCV-1', doseNumber: 1, totalDoses: 3, ageGroup: '6 Weeks', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'OPV-2', doseNumber: 2, totalDoses: 3, ageGroup: '10 Weeks', route: 'Oral', site: null },
  { vaccineName: 'Pentavalent-2', doseNumber: 2, totalDoses: 3, ageGroup: '10 Weeks', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'Rotavirus-2', doseNumber: 2, totalDoses: 3, ageGroup: '10 Weeks', route: 'Oral', site: null },
  { vaccineName: 'OPV-3', doseNumber: 3, totalDoses: 3, ageGroup: '14 Weeks', route: 'Oral', site: null },
  { vaccineName: 'Pentavalent-3', doseNumber: 3, totalDoses: 3, ageGroup: '14 Weeks', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'Rotavirus-3', doseNumber: 3, totalDoses: 3, ageGroup: '14 Weeks', route: 'Oral', site: null },
  { vaccineName: 'PCV-2', doseNumber: 2, totalDoses: 3, ageGroup: '14 Weeks', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'IPV-1', doseNumber: 1, totalDoses: 2, ageGroup: '14 Weeks', route: 'Intramuscular', site: 'RIGHT_ARM' },
  { vaccineName: 'Measles-1 / MR-1', doseNumber: 1, totalDoses: 2, ageGroup: '9 Months', route: 'Subcutaneous', site: 'RIGHT_ARM' },
  { vaccineName: 'Vitamin A (1st dose)', doseNumber: 1, totalDoses: 9, ageGroup: '9 Months', route: 'Oral', site: null },
  { vaccineName: 'PCV Booster', doseNumber: 3, totalDoses: 3, ageGroup: '9 Months', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'MMR-1', doseNumber: 1, totalDoses: 1, ageGroup: '12 Months', route: 'Subcutaneous', site: 'RIGHT_ARM' },
  { vaccineName: 'Measles-2 / MR-2', doseNumber: 2, totalDoses: 2, ageGroup: '16-18 Months', route: 'Subcutaneous', site: 'RIGHT_ARM' },
  { vaccineName: 'DPT Booster-1', doseNumber: 1, totalDoses: 2, ageGroup: '16-18 Months', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'IPV-2', doseNumber: 2, totalDoses: 2, ageGroup: '16-18 Months', route: 'Intramuscular', site: 'RIGHT_ARM' },
  { vaccineName: 'Varicella (Chickenpox)', doseNumber: 1, totalDoses: 1, ageGroup: '16-18 Months', route: 'Subcutaneous', site: 'RIGHT_ARM' },
  { vaccineName: 'Hepatitis A - 1', doseNumber: 1, totalDoses: 2, ageGroup: '18 Months', route: 'Intramuscular', site: 'RIGHT_ARM' },
  { vaccineName: 'DPT Booster-2', doseNumber: 2, totalDoses: 2, ageGroup: '5-6 Years', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'TT/Td (10 years)', doseNumber: 1, totalDoses: 1, ageGroup: '10 Years', route: 'Intramuscular', site: 'LEFT_ARM' },
  { vaccineName: 'TT/Td (16 years)', doseNumber: 1, totalDoses: 1, ageGroup: '16 Years', route: 'Intramuscular', site: 'LEFT_ARM' },
  // COVID-19
  { vaccineName: 'COVID-19 (Covishield/Covaxin)', doseNumber: 1, totalDoses: 2, ageGroup: '18+ Years', route: 'Intramuscular', site: 'LEFT_ARM' },
]

// ─── GET: Get vaccination records ─────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const vaccineName = searchParams.get('vaccineName') || ''
    const includeSchedule = searchParams.get('includeSchedule') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { patientId }
    if (vaccineName) {
      where.vaccineName = { contains: vaccineName, mode: 'insensitive' }
    }

    const [records, total] = await Promise.all([
      db.vaccinationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { administeredAt: 'desc' },
      }),
      db.vaccinationRecord.count({ where }),
    ])

    // Enrich records with next due info
    const enriched = records.map((record) => {
      const isFullyVaccinated = record.doseNumber >= record.totalDoses
      const isBoosterDue = record.nextDueDate && new Date(record.nextDueDate) <= new Date()

      return {
        ...record,
        status: isFullyVaccinated ? 'COMPLETED' : 'PARTIAL',
        isBoosterDue,
        adverseEffectsParsed: record.adverseEffects ? JSON.parse(record.adverseEffects) : null,
      }
    })

    const result: Record<string, unknown> = {
      records: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }

    // Optionally include NIS schedule
    if (includeSchedule) {
      // Determine which NIS vaccines are pending
      const administeredVaccines = records.map((r) => r.vaccineName)
      const pendingVaccines = NIS_SCHEDULE.filter(
        (nis) => !administeredVaccines.some((av) => av.includes(nis.vaccineName.split('-')[0].split(' ')[0]))
      )
      result.nisSchedule = NIS_SCHEDULE
      result.pendingVaccines = pendingVaccines
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[VACCINATION_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch vaccination records' }, { status: 500 })
  }
}

// ─── POST: Add vaccination record ─────────────────────────────────

const vaccinationPostSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  vaccineName: z.string().min(1, 'vaccineName is required'),
  doseNumber: z.number().int().positive('doseNumber must be a positive integer'),
  totalDoses: z.number().int().positive('totalDoses must be a positive integer'),
  administeredAt: z.string().min(1, 'administeredAt is required'),
  administeredBy: z.string().optional(),
  batchNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  site: z.string().optional(),
  nextDueDate: z.string().optional(),
  adverseEffects: z.unknown().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = vaccinationPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      vaccineName,
      doseNumber,
      totalDoses,
      administeredAt,
      administeredBy,
      batchNumber,
      manufacturer,
      site,
      nextDueDate,
      adverseEffects,
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const parsedAdministeredAt = new Date(administeredAt)
    if (isNaN(parsedAdministeredAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid administeredAt format' },
        { status: 400 }
      )
    }

    const isCompleted = doseNumber >= totalDoses

    const record = await db.vaccinationRecord.create({
      data: {
        patientId,
        vaccineName,
        doseNumber,
        totalDoses,
        administeredAt: parsedAdministeredAt,
        administeredBy: administeredBy || null,
        batchNumber: batchNumber || null,
        manufacturer: manufacturer || null,
        site: site || null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        adverseEffects: adverseEffects ? JSON.stringify(adverseEffects) : null,
        isCompleted,
      },
    })

    return NextResponse.json({
      data: {
        ...record,
        status: isCompleted ? 'COMPLETED' : 'PARTIAL',
        adverseEffectsParsed: adverseEffects || null,
        certificateInfo: {
          canGenerateCertificate: true,
          certificateType: isCompleted ? 'FULL_VACCINATION' : 'PARTIAL_VACCINATION',
          issuingAuthority: 'CoWIN / District Immunization Officer',
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[VACCINATION_POST]', error)
    return NextResponse.json({ error: 'Failed to add vaccination record' }, { status: 500 })
  }
}
