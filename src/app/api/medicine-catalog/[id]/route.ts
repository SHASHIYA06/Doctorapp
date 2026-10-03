import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const medicine = await db.medicine.findUnique({
      where: { id },
      include: {
        brands: true,
        ingredients: { orderBy: { role: 'asc' } },
        indications: {
          include: { issue: { select: { id: true, name: true, bodySystem: true } } },
          orderBy: { priority: 'asc' },
        },
        contraindications: { orderBy: { severity: 'desc' } },
        interactions: { orderBy: { severity: 'desc' } },
        warnings: { orderBy: { category: 'asc' } },
        sideEffects: { orderBy: [{ frequency: 'asc' }, { severity: 'desc' }] },
        ageRules: { orderBy: { minAge: 'asc' } },
        populationRules: { orderBy: { safetyCategory: 'asc' } },
        timingRules: true,
        foodInstructions: true,
        durationRules: true,
        monitoringRules: true,
        recalls: { where: { isActive: true }, orderBy: { recallDate: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
        treatmentPatterns: {
          include: {
            treatmentPattern: {
              include: { issues: { include: { issue: { select: { id: true, name: true } } } } },
            },
          },
        },
      },
    })

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    return NextResponse.json({ data: medicine })
  } catch (error) {
    console.error('Medicine detail GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch medicine' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const medicine = await db.medicine.update({
      where: { id },
      data: {
        name: body.name,
        genericName: body.genericName,
        category: body.category,
        subCategory: body.subCategory,
        form: body.form,
        strength: body.strength,
        isOTC: body.isOTC,
        isPrescription: body.isPrescription,
        isActive: body.isActive,
      },
    })
    return NextResponse.json({ data: medicine })
  } catch (error) {
    console.error('Medicine PUT error:', error)
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 })
  }
}
