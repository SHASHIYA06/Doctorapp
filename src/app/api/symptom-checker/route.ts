import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, age, gender, modality } = body as {
      symptoms: string[]
      age?: number
      gender?: string
      modality?: string
    }

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    // Search for health issues matching the symptoms
    const matchedIssues = await db.healthIssue.findMany({
      where: {
        isActive: true,
        OR: symptoms.flatMap((s) => [
          { name: { contains: s, mode: 'insensitive' } },
          { description: { contains: s, mode: 'insensitive' } },
          { symptomGroup: { contains: s, mode: 'insensitive' } },
          { clinicalDomain: { contains: s, mode: 'insensitive' } },
        ]),
      },
      take: 20,
      include: {
        aliases: true,
        translations: { where: { language: 'hi' } },
        wingApproaches: modality ? { where: { modality } } : true,
        indications: {
          where: modality ? { medicine: { modality } } : {},
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                modality: true,
                category: true,
                form: true,
                strength: true,
                isOTC: true,
                isPrescription: true,
              },
            },
          },
          orderBy: { priority: 'asc' },
          take: 5,
        },
      },
    })

    // Also search aliases
    const aliasMatches = await db.healthIssueAlias.findMany({
      where: {
        OR: symptoms.map((s) => ({ alias: { contains: s, mode: 'insensitive' } })),
      },
      take: 20,
      include: {
        issue: {
          include: {
            wingApproaches: modality ? { where: { modality } } : true,
            indications: {
              where: modality ? { medicine: { modality } } : {},
              include: {
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    modality: true,
                    category: true,
                    form: true,
                    strength: true,
                    isOTC: true,
                    isPrescription: true,
                  },
                },
              },
              orderBy: { priority: 'asc' },
              take: 5,
            },
          },
        },
      },
    })

    // Merge and deduplicate
    const seen = new Set(matchedIssues.map((i) => i.id))
    const allIssues = [
      ...matchedIssues,
      ...aliasMatches.filter((a) => !seen.has(a.issueId)).map((a) => a.issue),
    ]

    // Sort by relevance (issues with more symptom matches first)
    const scored = allIssues.map((issue) => {
      let score = 0
      for (const s of symptoms) {
        if (issue.name.toLowerCase().includes(s.toLowerCase())) score += 3
        if (issue.symptomGroup?.toLowerCase().includes(s.toLowerCase())) score += 2
        if (issue.description?.toLowerCase().includes(s.toLowerCase())) score += 1
      }
      return { ...issue, _score: score }
    })
    scored.sort((a, b) => b._score - a._score)

    // Safety warnings
    const warnings: string[] = []
    if (age !== undefined && age < 2) warnings.push('Infant: Always consult pediatrician before any medication')
    if (age !== undefined && age > 65) warnings.push('Elderly: Dose adjustment may be needed')
    if (gender === 'FEMALE' && body.isPregnant) warnings.push('Pregnancy: Many medicines are contraindicated')

    return NextResponse.json({
      data: scored.slice(0, 15),
      meta: { symptomsSearched: symptoms, age, gender, modality, warnings },
    })
  } catch (error) {
    console.error('Symptom checker error:', error)
    return NextResponse.json({ error: 'Failed to check symptoms' }, { status: 500 })
  }
}
