import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET: List insurance policies / claims / billing ─────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subroute = searchParams.get('subroute')

    // ── Subroute: claims ──
    if (subroute === 'claims') {
      const patientId = searchParams.get('patientId') || undefined
      const status = searchParams.get('status') || undefined

      const where: Record<string, unknown> = {}
      if (patientId) where.patientId = patientId
      if (status) where.status = status

      const claims = await db.insuranceClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          policy: { select: { id: true, providerName: true, policyNumber: true } },
        },
      })

      return NextResponse.json({ data: claims })
    }

    // ── Subroute: billing ──
    if (subroute === 'billing') {
      const patientId = searchParams.get('patientId') || undefined
      const status = searchParams.get('status') || undefined

      const where: Record<string, unknown> = {}
      if (patientId) where.patientId = patientId
      if (status) where.status = status

      const records = await db.billingRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      return NextResponse.json({ data: records })
    }

    // ── Default: list insurance policies ──
    const patientId = searchParams.get('patientId') || undefined
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const policies = await db.insurancePolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        claims: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    return NextResponse.json({ data: policies })
  } catch (error) {
    console.error('[INSURANCE_LIST]', error)
    return NextResponse.json({ error: 'Failed to list insurance records' }, { status: 500 })
  }
}

// ─── POST: Create insurance policy / claim / billing record ──────

const insuranceClaimSchema = z.object({
  claimNumber: z.string().min(1, 'claimNumber is required'),
  policyId: z.string().min(1, 'policyId is required'),
  patientId: z.string().min(1, 'patientId is required'),
  encounterId: z.string().optional(),
  claimType: z.string().optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED', 'PARTIALLY_SETTLED']).optional(),
  amountClaimed: z.number().optional(),
  amountApproved: z.number().optional(),
  amountSettled: z.number().optional(),
  denialReason: z.string().optional(),
  documents: z.string().optional(),
  submittedAt: z.string().optional(),
  processedAt: z.string().optional(),
  settledAt: z.string().optional(),
})

const insuranceBillingSchema = z.object({
  invoiceNumber: z.string().min(1, 'invoiceNumber is required'),
  patientId: z.string().min(1, 'patientId is required'),
  encounterId: z.string().optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']).optional(),
  consultationFee: z.number().optional(),
  medicineCharges: z.number().optional(),
  labCharges: z.number().optional(),
  procedureCharges: z.number().optional(),
  otherCharges: z.number().optional(),
  totalAmount: z.number().optional(),
  discount: z.number().optional(),
  tax: z.number().optional(),
  netAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
})

const insurancePolicySchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  providerName: z.string().min(1, 'providerName is required'),
  policyNumber: z.string().min(1, 'policyNumber is required'),
  groupNumber: z.string().optional(),
  planType: z.string().optional(),
  coverageType: z.string().optional(),
  abhaLinked: z.boolean().optional(),
  isAyushmanBharat: z.boolean().optional(),
  validFrom: z.string().min(1, 'validFrom is required'),
  validUntil: z.string().optional(),
  coPayPercentage: z.number().optional(),
  maxCoverage: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Create claim if claimNumber present ──
    if (body.claimNumber) {
      const parsed = insuranceClaimSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const {
        claimNumber,
        policyId,
        patientId,
        encounterId,
        claimType,
        status = 'SUBMITTED',
        amountClaimed,
        amountApproved,
        amountSettled,
        denialReason,
        documents,
        submittedAt,
        processedAt,
        settledAt,
      } = parsed.data

      // Check patient exists
      const patient = await db.patient.findUnique({ where: { id: patientId } })
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }

      const claim = await db.insuranceClaim.create({
        data: {
          claimNumber,
          policyId,
          patientId,
          encounterId,
          claimType,
          status,
          amountClaimed,
          amountApproved,
          amountSettled,
          denialReason,
          documents,
          submittedAt: submittedAt ? new Date(submittedAt) : undefined,
          processedAt: processedAt ? new Date(processedAt) : undefined,
          settledAt: settledAt ? new Date(settledAt) : undefined,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          policy: { select: { id: true, providerName: true, policyNumber: true } },
        },
      })

      return NextResponse.json({ data: claim }, { status: 201 })
    }

    // ── Create billing record if invoiceNumber present ──
    if (body.invoiceNumber) {
      const parsed = insuranceBillingSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const {
        invoiceNumber,
        patientId,
        encounterId,
        modality = 'ALLOPATHY',
        status = 'PENDING',
        consultationFee = 0,
        medicineCharges = 0,
        labCharges = 0,
        procedureCharges = 0,
        otherCharges = 0,
        totalAmount = 0,
        discount = 0,
        tax = 0,
        netAmount = 0,
        paidAmount = 0,
        paymentMethod,
        paymentRef,
        dueDate,
        paidAt,
      } = parsed.data

      // Check patient exists
      const patient = await db.patient.findUnique({ where: { id: patientId } })
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }

      const record = await db.billingRecord.create({
        data: {
          patientId,
          encounterId,
          invoiceNumber,
          modality,
          status,
          consultationFee,
          medicineCharges,
          labCharges,
          procedureCharges,
          otherCharges,
          totalAmount,
          discount,
          tax,
          netAmount,
          paidAmount,
          paymentMethod,
          paymentRef,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          paidAt: paidAt ? new Date(paidAt) : undefined,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      return NextResponse.json({ data: record }, { status: 201 })
    }

    // ── Default: create insurance policy ──
    const parsed = insurancePolicySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      providerName,
      policyNumber,
      groupNumber,
      planType,
      coverageType,
      abhaLinked = false,
      isAyushmanBharat = false,
      validFrom,
      validUntil,
      coPayPercentage = 0,
      maxCoverage,
      isActive = true,
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const policy = await db.insurancePolicy.create({
      data: {
        patientId,
        providerName,
        policyNumber,
        groupNumber,
        planType,
        coverageType,
        abhaLinked,
        isAyushmanBharat,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        coPayPercentage,
        maxCoverage,
        isActive,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ data: policy }, { status: 201 })
  } catch (error) {
    console.error('[INSURANCE_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create insurance record' }, { status: 500 })
  }
}
