import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schema ────────────────────────────────────────────

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
  emergencyContact: z.string().optional(),
})

// ─── GET: Patient by ID with relations ───────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        allergies: { orderBy: { createdAt: 'desc' } },
        medicationStatements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        conditions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
        consents: { orderBy: { createdAt: 'desc' } },
        symptoms: { orderBy: { createdAt: 'desc' } },
        encounters: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            intake: true,
            triageAssessment: true,
          },
        },
      },
    })

    if (!patient || !patient.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ data: patient })
  } catch (error) {
    console.error('[PATIENT_GET]', error)
    return NextResponse.json({ error: 'Failed to get patient' }, { status: 500 })
  }
}

// ─── PUT: Update patient ─────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.patient.findUnique({ where: { id } })
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updatePatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const patient = await db.patient.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
        ...(data.gender && { gender: data.gender }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.bloodGroup && { bloodGroup: data.bloodGroup }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
      },
    })

    // Audit event
    await db.auditEvent.create({
      data: {
        tenantId: existing.tenantId,
        action: 'UPDATE',
        resourceType: 'Patient',
        resourceId: id,
        patientId: id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ updatedFields: Object.keys(data) }),
      },
    })

    return NextResponse.json({ data: patient })
  } catch (error) {
    console.error('[PATIENT_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}

// ─── DELETE: Soft delete ─────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.patient.findUnique({ where: { id } })
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    await db.patient.update({
      where: { id },
      data: { isActive: false },
    })

    // Audit event
    await db.auditEvent.create({
      data: {
        tenantId: existing.tenantId,
        action: 'SOFT_DELETE',
        resourceType: 'Patient',
        resourceId: id,
        patientId: id,
        outcome: 'SUCCESS',
      },
    })

    return NextResponse.json({ data: { id, isActive: false } })
  } catch (error) {
    console.error('[PATIENT_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
  }
}
