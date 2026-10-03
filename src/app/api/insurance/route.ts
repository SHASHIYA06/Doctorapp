import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Create claim if claimNumber present ──
    if (body.claimNumber) {
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
      } = body

      if (!policyId || !patientId) {
        return NextResponse.json(
          { error: 'policyId and patientId are required for claims' },
          { status: 400 }
        )
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
      } = body

      if (!patientId) {
        return NextResponse.json(
          { error: 'patientId is required for billing' },
          { status: 400 }
        )
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
    } = body

    if (!patientId || !providerName || !policyNumber) {
      return NextResponse.json(
        { error: 'patientId, providerName, and policyNumber are required' },
        { status: 400 }
      )
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
