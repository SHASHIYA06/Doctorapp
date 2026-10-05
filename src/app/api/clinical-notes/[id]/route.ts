import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Get single clinical note ───────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const note = await db.clinicalNote.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    if (!note) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 })
    }

    return NextResponse.json({ data: note })
  } catch (error) {
    console.error('[CLINICAL_NOTE_GET]', error)
    return NextResponse.json({ error: 'Failed to get clinical note' }, { status: 500 })
  }
}

// ─── PUT: Update clinical note (sign, edit) ──────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.clinicalNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.subjective !== undefined) updateData.subjective = body.subjective
    if (body.objective !== undefined) updateData.objective = body.objective
    if (body.assessment !== undefined) updateData.assessment = body.assessment
    if (body.plan !== undefined) updateData.plan = body.plan
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.noteType !== undefined) updateData.noteType = body.noteType
    if (body.modality !== undefined) updateData.modality = body.modality

    // Handle signing
    if (body.isSigned === true) {
      updateData.isSigned = true
      updateData.signedAt = new Date()
    }

    const updated = await db.clinicalNote.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        practitioner: { select: { id: true, name: true, specialization: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[CLINICAL_NOTE_UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update clinical note' }, { status: 500 })
  }
}

// ─── DELETE: Delete clinical note ────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.clinicalNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 })
    }

    if (existing.isSigned) {
      return NextResponse.json(
        { error: 'Cannot delete a signed clinical note' },
        { status: 403 }
      )
    }

    await db.clinicalNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CLINICAL_NOTE_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete clinical note' }, { status: 500 })
  }
}
