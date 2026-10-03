import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const issue = await db.healthIssue.findUnique({
      where: { id },
      include: {
        aliases: true,
        translations: true,
        wingApproaches: { orderBy: { modality: 'asc' } },
        indications: {
          include: { medicine: { select: { id: true, name: true, modality: true, category: true, form: true, strength: true } } },
          orderBy: { priority: 'asc' },
        },
        patternIssues: {
          include: { treatmentPattern: { include: { medicines: { include: { medicine: true } } } } },
        },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Health issue not found' }, { status: 404 })
    }

    return NextResponse.json({ data: issue })
  } catch (error) {
    console.error('Health issue detail GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch health issue' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const issue = await db.healthIssue.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        severity: body.severity,
        chronicity: body.chronicity,
        prevalence: body.prevalence,
        isActive: body.isActive,
      },
    })
    return NextResponse.json({ data: issue })
  } catch (error) {
    console.error('Health issue PUT error:', error)
    return NextResponse.json({ error: 'Failed to update health issue' }, { status: 500 })
  }
}
