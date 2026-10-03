import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const modality = searchParams.get('modality') || ''
    const category = searchParams.get('category') || ''
    const issueId = searchParams.get('issueId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }

    if (modality) where.modality = modality
    if (category) where.category = category

    if (issueId) {
      const indicationMeds = await db.medicineIndication.findMany({
        where: { issueId },
        select: { medicineId: true },
      })
      where.id = { in: [...new Set(indicationMeds.map((i) => i.medicineId))] }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subCategory: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [medicines, total] = await Promise.all([
      db.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          ingredients: { take: 3 },
          indications: {
            take: 3,
            include: { issue: { select: { id: true, name: true } } },
          },
          _count: {
            select: {
              contraindications: true,
              interactions: true,
              sideEffects: true,
              warnings: true,
            },
          },
          recalls: { where: { isActive: true }, take: 1 },
        },
      }),
      db.medicine.count({ where }),
    ])

    const categories = await db.medicine.findMany({
      where: { isActive: true, ...(modality ? { modality } : {}) },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return NextResponse.json({
      data: medicines,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: { categories: categories.map((c) => c.category) },
    })
  } catch (error) {
    console.error('Medicine catalog GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const medicine = await db.medicine.create({
      data: {
        name: body.name,
        genericName: body.genericName,
        modality: body.modality || 'ALLOPATHY',
        category: body.category,
        subCategory: body.subCategory,
        form: body.form,
        strength: body.strength,
        packSize: body.packSize,
        manufacturer: body.manufacturer,
        isGeneric: body.isGeneric || false,
        isOTC: body.isOTC || false,
        isPrescription: body.isPrescription !== false,
      },
    })
    return NextResponse.json({ data: medicine }, { status: 201 })
  } catch (error) {
    console.error('Medicine POST error:', error)
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 })
  }
}
