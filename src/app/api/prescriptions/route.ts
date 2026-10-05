import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET: List prescriptions ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const status = searchParams.get('status') || undefined
    const modality = searchParams.get('modality') || undefined

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (modality) where.modality = modality

    const prescriptions = await db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true } },
        items: { orderBy: { sequence: 'asc' } },
      },
    })

    return NextResponse.json({ data: prescriptions })
  } catch (error) {
    console.error('[PRESCRIPTIONS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list prescriptions' }, { status: 500 })
  }
}

// ─── POST: Create prescription ─────────────────────────────────────

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'medicineName is required'),
  medicineId: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  route: z.string().optional(),
  instructions: z.string().optional(),
  scheduleType: z.string().optional(),
  quantity: z.number().optional(),
  refills: z.number().optional(),
})

const prescriptionPostSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  practitionerId: z.string().optional(),
  encounterId: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  isCdScoCompliant: z.boolean().optional(),
  items: z.array(prescriptionItemSchema).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = prescriptionPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      practitionerId,
      encounterId,
      modality = 'ALLOPATHY',
      diagnosis,
      notes,
      isCdScoCompliant = true,
      items = [],
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Generate prescription number
    const count = await db.prescription.count()
    const prescriptionNo = `RX-${String(count + 1).padStart(6, '0')}`

    // Build QR data
    const qrCodeData = JSON.stringify({ prescriptionNo, patientId, modality, diagnosis })

    const prescription = await db.prescription.create({
      data: {
        patientId,
        practitionerId,
        encounterId,
        prescriptionNo,
        modality,
        status: 'DRAFT',
        diagnosis,
        notes,
        qrCodeData,
        isCdScoCompliant,
        items: {
          create: items.map((item: Record<string, unknown>, idx: number) => ({
            medicineName: (item.medicineName as string) || 'Unknown',
            medicineId: (item.medicineId as string) || undefined,
            dosage: (item.dosage as string) || '',
            frequency: (item.frequency as string) || 'ONCE_DAILY',
            duration: (item.duration as string) || undefined,
            route: (item.route as string) || undefined,
            instructions: (item.instructions as string) || undefined,
            scheduleType: (item.scheduleType as string) || undefined,
            quantity: (item.quantity as number) || undefined,
            refills: (item.refills as number) || 0,
            sequence: idx + 1,
          })),
        },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true } },
        items: true,
      },
    })

    return NextResponse.json({ data: prescription }, { status: 201 })
  } catch (error) {
    console.error('[PRESCRIPTIONS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}
