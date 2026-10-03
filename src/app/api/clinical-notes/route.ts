import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
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
