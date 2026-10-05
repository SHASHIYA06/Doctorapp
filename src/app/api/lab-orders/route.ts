import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET: List lab orders ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (priority) where.priority = priority

    const labOrders = await db.labOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true } },
        tests: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ data: labOrders })
  } catch (error) {
    console.error('[LAB_ORDERS_LIST]', error)
    return NextResponse.json({ error: 'Failed to list lab orders' }, { status: 500 })
  }
}

// ─── POST: Create lab order ────────────────────────────────────────

const labTestSchema = z.object({
  testName: z.string().min(1, 'testName is required'),
  testCode: z.string().optional(),
  category: z.string().optional(),
})

const labOrderPostSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  practitionerId: z.string().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT', 'ASAP']).optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).optional(),
  notes: z.string().optional(),
  tests: z.array(labTestSchema).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = labOrderPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      practitionerId,
      priority = 'ROUTINE',
      modality = 'ALLOPATHY',
      notes,
      tests = [],
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Generate order number
    const count = await db.labOrder.count()
    const orderNumber = `LAB-${String(count + 1).padStart(6, '0')}`

    const labOrder = await db.labOrder.create({
      data: {
        patientId,
        practitionerId,
        orderNumber,
        status: 'ORDERED',
        priority,
        modality,
        notes,
        tests: {
          create: tests.map((t: Record<string, unknown>) => ({
            testName: (t.testName as string) || 'Unknown Test',
            testCode: (t.testCode as string) || undefined,
            category: (t.category as string) || undefined,
            status: 'ORDERED',
          })),
        },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true } },
        tests: true,
      },
    })

    return NextResponse.json({ data: labOrder }, { status: 201 })
  } catch (error) {
    console.error('[LAB_ORDERS_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create lab order' }, { status: 500 })
  }
}
