import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const bodySystem = searchParams.get('bodySystem') || ''
    const clinicalDomain = searchParams.get('clinicalDomain') || ''
    const modality = searchParams.get('modality') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }

    if (bodySystem) where.bodySystem = bodySystem
    if (clinicalDomain) where.clinicalDomain = clinicalDomain

    if (search) {
      const aliasMatches = await db.healthIssueAlias.findMany({
        where: { alias: { contains: search, mode: 'insensitive' } },
        select: { issueId: true },
      })
      const aliasIds = [...new Set(aliasMatches.map((a) => a.issueId))]

      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { symptomGroup: { contains: search, mode: 'insensitive' } },
        ...(aliasIds.length > 0 ? [{ id: { in: aliasIds } }] : []),
      ]
    }

    const [issues, total] = await Promise.all([
      db.healthIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          aliases: { take: 5 },
          translations: { where: { language: 'hi' }, take: 1 },
          wingApproaches: modality ? { where: { modality } } : true,
          _count: { select: { indications: true } },
        },
      }),
      db.healthIssue.count({ where }),
    ])

    const bodySystems = await db.healthIssue.findMany({
      where: { isActive: true },
      select: { bodySystem: true },
      distinct: ['bodySystem'],
      orderBy: { bodySystem: 'asc' },
    })

    return NextResponse.json({
      data: issues,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: { bodySystems: bodySystems.map((b) => b.bodySystem) },
    })
  } catch (error) {
    console.error('Health issues GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch health issues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const issue = await db.healthIssue.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        bodySystem: body.bodySystem,
        clinicalDomain: body.clinicalDomain,
        symptomGroup: body.symptomGroup,
        severity: body.severity || 'MODERATE',
        chronicity: body.chronicity || 'ACUTE',
        prevalence: body.prevalence,
        isSubtype: body.isSubtype || false,
        parentIssueId: body.parentIssueId,
      },
    })
    return NextResponse.json({ data: issue }, { status: 201 })
  } catch (error) {
    console.error('Health issue POST error:', error)
    return NextResponse.json({ error: 'Failed to create health issue' }, { status: 500 })
  }
}
