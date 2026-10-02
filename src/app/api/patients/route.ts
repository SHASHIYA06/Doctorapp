import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
  emergencyContact: z.string().optional(),
})

// ─── Helper: Get first active tenant for isolation ────────────────

async function getFirstTenantId(): Promise<string | null> {
  const tenant = await db.tenant.findFirst({ where: { isActive: true } })
  return tenant?.id ?? null
}

// ─── GET: List patients (paginated, searchable) ──────────────────

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getFirstTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      tenantId,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [patients, total] = await Promise.all([
      db.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          bloodGroup: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              allergies: true,
              medicationStatements: true,
              conditions: true,
              encounters: true,
            },
          },
        },
      }),
      db.patient.count({ where }),
    ])

    return NextResponse.json({
      data: patients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[PATIENTS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list patients' }, { status: 500 })
  }
}

// ─── POST: Create patient ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getFirstTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant found' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = createPatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const patient = await db.patient.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        bloodGroup: data.bloodGroup,
        emergencyContact: data.emergencyContact,
      },
    })

    // Audit event
    await db.auditEvent.create({
      data: {
        tenantId,
        action: 'CREATE',
        resourceType: 'Patient',
        resourceId: patient.id,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ firstName: patient.firstName, lastName: patient.lastName }),
      },
    })

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    console.error('[PATIENTS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
