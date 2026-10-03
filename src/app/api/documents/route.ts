import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List documents ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const where: Record<string, unknown> = {}
    const type = searchParams.get('type')
    if (type) where.documentType = type
    const status = searchParams.get('status')
    if (status) {
      if (status === 'VERIFIED') where.isVerified = true
      else if (status === 'UPLOADED' || status === 'OCR_PROCESSING' || status === 'OCR_COMPLETE' || status === 'REVIEW') {
        where.isVerified = false
      }
    }
    const patientId = searchParams.get('patientId')
    if (patientId) where.patientId = patientId

    const docs = await db.documentUpload.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        patientId: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        ocrExtracted: true,
        ocrConfidence: true,
        aiSummary: true,
        isVerified: true,
        verifiedBy: true,
        verifiedAt: true,
        uploadedAt: true,
        createdAt: true,
        patient: { select: { firstName: true, lastName: true } },
      },
    })

    const data = docs.map((d) => {
      // Determine display status
      let displayStatus = 'UPLOADED'
      if (d.isVerified) displayStatus = 'VERIFIED'
      else if (d.ocrConfidence !== null && d.verifiedBy === null) displayStatus = 'REVIEW'
      else if (d.ocrExtracted) displayStatus = 'OCR_COMPLETE'

      return {
        id: d.id,
        patientId: d.patientId ?? '',
        patientName: d.patient ? `${d.patient.firstName} ${d.patient.lastName}` : 'Unassigned',
        type: d.documentType,
        fileName: d.fileName,
        fileSize: d.fileSize ?? 0,
        fileType: d.mimeType ?? 'unknown',
        status: displayStatus,
        ocrText: d.ocrExtracted,
        ocrConfidence: d.ocrConfidence !== null ? Math.round(d.ocrConfidence * 100) : null,
        aiSummary: d.aiSummary,
        verifiedBy: d.verifiedBy,
        verifiedAt: d.verifiedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[DOCUMENTS_LIST]', error)
    return NextResponse.json({ data: [] })
  }
}

// ─── POST: Upload document ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const patientId = formData.get('patientId') as string | null
    const documentType = (formData.get('type') as string) || 'OTHER'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const fileName = file.name
    const fileSize = file.size
    const mimeType = file.type

    // Simulate OCR results based on document type
    const ocrTexts: Record<string, string> = {
      PRESCRIPTION: 'Rx: Metformin 500mg twice daily\nPatient: [Name]\nDate: [Date]\nDr: [Physician]',
      LAB_REPORT: 'Complete Blood Count\nWBC: 7200 /uL\nRBC: 4.8 M/uL\nHemoglobin: 14.2 g/dL\nPlatelets: 245 K/uL',
      ID_PROOF: 'Aadhaar Card\nName: [Patient Name]\nID: XXXX-XXXX-XXXX\nDOB: [Date of Birth]',
      INSURANCE_CARD: 'Insurance Provider: Star Health\nPolicy No: SH-2024-XXXXXX\nMember ID: M-XXXXX',
      DISCHARGE_SUMMARY: 'Discharge Summary\nAdmission Date: [Date]\nDischarge Date: [Date]\nDiagnosis: Type 2 Diabetes Mellitus\nTreatment: Medication + Diet Control',
      REFERRAL_LETTER: 'Referral Letter\nTo: [Specialist]\nFrom: [Referring Physician]\nReason: [Clinical justification]',
      OTHER: 'Document content extracted via OCR processing.',
    }

    const ocrText = ocrTexts[documentType] || ocrTexts.OTHER
    const ocrConfidence = 0.82 + Math.random() * 0.16 // 82-98%
    const aiSummaries: Record<string, string> = {
      PRESCRIPTION: 'Prescription for Metformin 500mg BID for diabetes management.',
      LAB_REPORT: 'CBC results within normal limits. No significant abnormalities detected.',
      ID_PROOF: 'Government-issued identification document. Identity verification pending.',
      INSURANCE_CARD: 'Health insurance card. Active policy with Star Health.',
      DISCHARGE_SUMMARY: 'Patient discharged with T2DM diagnosis. On medication and diet control.',
      REFERRAL_LETTER: 'Clinical referral for specialist consultation.',
      OTHER: 'Document processed. Summary pending review.',
    }

    const doc = await db.documentUpload.create({
      data: {
        patientId: patientId || null,
        documentType,
        fileName,
        fileSize,
        mimeType,
        storageUrl: null,
        ocrExtracted: ocrText,
        ocrConfidence,
        aiSummary: aiSummaries[documentType] || aiSummaries.OTHER,
        isVerified: false,
      },
    })

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error) {
    console.error('[DOCUMENTS_UPLOAD]', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

// ─── PUT: Update document status ──────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const existing = await db.documentUpload.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status === 'VERIFIED') {
      updateData.isVerified = true
      updateData.verifiedBy = 'Dr. Current User'
      updateData.verifiedAt = new Date()
    }

    const doc = await db.documentUpload.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: doc })
  } catch (error) {
    console.error('[DOCUMENTS_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}
