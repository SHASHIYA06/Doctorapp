import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicineIds, medicineNames } = body as {
      medicineIds?: string[]
      medicineNames?: string[]
    }

    if ((!medicineIds || medicineIds.length === 0) && (!medicineNames || medicineNames.length === 0)) {
      return NextResponse.json({ error: 'Provide medicineIds or medicineNames' }, { status: 400 })
    }

    // Resolve medicine names to IDs if needed
    let allIds = medicineIds || []

    if (medicineNames && medicineNames.length > 0) {
      const found = await db.medicine.findMany({
        where: {
          OR: [
            ...medicineNames.map((n) => ({ name: { contains: n, mode: 'insensitive' } })),
            ...medicineNames.map((n) => ({ genericName: { contains: n, mode: 'insensitive' } })),
          ],
        },
        select: { id: true, name: true, modality: true },
      })
      allIds = [...allIds, ...found.map((f) => f.id)]
    }

    if (allIds.length === 0) {
      return NextResponse.json({ data: [], message: 'No medicines found matching the provided names' })
    }

    // Get all interactions for the specified medicines
    const interactions = await db.medicineInteraction.findMany({
      where: { medicineId: { in: allIds } },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            modality: true,
            category: true,
          },
        },
      },
      orderBy: { severity: 'desc' },
    })

    // Check for cross-reactions between the provided medicines
    const medicineDetails = await db.medicine.findMany({
      where: { id: { in: allIds } },
      include: {
        contraindications: true,
        populationRules: true,
        warnings: true,
      },
    })

    // Analyze pairwise interactions
    const pairwiseAnalysis: Array<{
      medicine1: string
      medicine2: string
      interaction: string
      severity: string
      effect: string
      recommendation: string
    }> = []

    for (const interaction of interactions) {
      const interactingName = interaction.interactingWith
      // Check if the interacting medicine is in our list
      const isPairwise = medicineDetails.some(
        (m) =>
          m.name.toLowerCase().includes(interactingName.toLowerCase()) ||
          m.genericName?.toLowerCase().includes(interactingName.toLowerCase())
      )
      if (isPairwise) {
        pairwiseAnalysis.push({
          medicine1: interaction.medicine.name,
          medicine2: interactingName,
          interaction: interaction.interactionType,
          severity: interaction.severity,
          effect: interaction.effect,
          recommendation: interaction.recommendation || 'Consult your doctor',
        })
      }
    }

    // Aggregate contraindications
    const allContraindications = medicineDetails.flatMap((m) =>
      m.contraindications.map((c) => ({ medicine: m.name, ...c }))
    )

    // Aggregate warnings
    const allWarnings = medicineDetails.flatMap((m) =>
      m.warnings.map((w) => ({ medicine: m.name, ...w }))
    )

    // Population safety
    const populationSafety = medicineDetails.flatMap((m) =>
      m.populationRules.map((p) => ({ medicine: m.name, ...p }))
    )

    // Overall safety score
    const severeInteractions = pairwiseAnalysis.filter((i) => i.severity === 'SEVERE' || i.severity === 'MAJOR').length
    const moderateInteractions = pairwiseAnalysis.filter((i) => i.severity === 'MODERATE').length
    const safetyScore = Math.max(0, 100 - severeInteractions * 30 - moderateInteractions * 10)

    return NextResponse.json({
      data: {
        medicines: medicineDetails.map((m) => ({ id: m.id, name: m.name, modality: m.modality })),
        pairwiseInteractions: pairwiseAnalysis,
        allInteractions: interactions,
        contraindications: allContraindications,
        warnings: allWarnings,
        populationSafety,
        safetyScore,
        riskLevel: safetyScore >= 80 ? 'LOW' : safetyScore >= 50 ? 'MODERATE' : safetyScore >= 20 ? 'HIGH' : 'CRITICAL',
      },
    })
  } catch (error) {
    console.error('Drug interactions error:', error)
    return NextResponse.json({ error: 'Failed to check drug interactions' }, { status: 500 })
  }
}
