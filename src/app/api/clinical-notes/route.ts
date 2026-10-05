import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET: List clinical notes ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const noteType = searchParams.get('noteType') || undefined
    const modality = searchParams.get('modality') || undefined

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (noteType) where.noteType = noteType
    if (modality) where.modality = modality

    const notes = await db.clinicalNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: notes })
  } catch (error) {
    console.error('[CLINICAL_NOTES_LIST]', error)
    return NextResponse.json({ error: 'Failed to list clinical notes' }, { status: 500 })
  }
}

// ─── POST: Create clinical note ──────────────────────────────────

const clinicalNotePostSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  encounterId: z.string().optional(),
  practitionerId: z.string().optional(),
  noteType: z.enum(['SOAP', 'PROGRESS', 'DISCHARGE', 'REFERRAL', 'CONSULTATION']).optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  summary: z.string().optional(),
  isSigned: z.boolean().optional(),
  signedAt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = clinicalNotePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      patientId,
      encounterId,
      practitionerId,
      noteType = 'SOAP',
      modality = 'ALLOPATHY',
      subjective,
      objective,
      assessment,
      plan,
      summary,
      isSigned = false,
      signedAt,
    } = parsed.data

    // Check patient exists
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const note = await db.clinicalNote.create({
      data: {
        patientId,
        encounterId,
        practitionerId,
        noteType,
        modality,
        subjective,
        objective,
        assessment,
        plan,
        summary,
        isSigned,
        signedAt: signedAt ? new Date(signedAt) : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: note }, { status: 201 })
  } catch (error) {
    console.error('[CLINICAL_NOTES_CREATE]', error)
    return NextResponse.json({ error: 'Failed to create clinical note' }, { status: 500 })
  }
}
