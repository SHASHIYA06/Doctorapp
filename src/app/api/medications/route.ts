import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const addMedicationSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  route: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  notes: z.string().optional(),
})

const updateMedicationSchema = z.object({
  id: z.string().min(1, 'Medication statement ID is required'),
  isActive: z.boolean().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})

// ─── GET: List medication statements for a patient ───────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { patientId }
    if (!includeInactive) where.isActive = true

    const medications = await db.medicationStatement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: medications })
  } catch (error) {
    console.error('[MEDICATIONS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list medications' }, { status: 500 })
  }
}

// ─── POST: Add medication statement ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = addMedicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify patient
    const patient = await db.patient.findUnique({ where: { id: data.patientId } })
    if (!patient || !patient.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const medication = await db.medicationStatement.create({
      data: {
        patientId: data.patientId,
        medication: data.medication,
        dosage: data.dosage ?? null,
        frequency: data.frequency ?? null,
        route: data.route ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        modality: data.modality,
        notes: data.notes ?? null,
      },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: patient.tenantId,
        action: 'CREATE',
        resourceType: 'MedicationStatement',
        resourceId: medication.id,
        patientId: data.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ medication: data.medication, modality: data.modality }),
      },
    })

    return NextResponse.json({ data: medication }, { status: 201 })
  } catch (error) {
    console.error('[MEDICATIONS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to add medication' }, { status: 500 })
  }
}

// ─── PUT: Update medication (deactivate) ─────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateMedicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, isActive, dosage, frequency, endDate, notes } = parsed.data

    const existing = await db.medicationStatement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Medication statement not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (dosage !== undefined) updateData.dosage = dosage
    if (frequency !== undefined) updateData.frequency = frequency
    if (endDate !== undefined) updateData.endDate = endDate
    if (notes !== undefined) updateData.notes = notes

    const medication = await db.medicationStatement.update({
      where: { id },
      data: updateData,
    })

    // Audit
    const patient = await db.patient.findUnique({ where: { id: existing.patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        action: isActive === false ? 'DEACTIVATE' : 'UPDATE',
        resourceType: 'MedicationStatement',
        resourceId: id,
        patientId: existing.patientId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    })

    return NextResponse.json({ data: medication })
  } catch (error) {
    console.error('[MEDICATIONS_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
  }
}
