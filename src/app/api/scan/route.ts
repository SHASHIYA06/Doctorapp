import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── CDSCO Mock Registry Data ─────────────────────────────────────

const CDSCO_REGISTRY: Record<string, {
  registrationNumber: string
  status: string
  licenseHolder: string
  manufacturingSite: string
  approvalDate: string
}> = {
  paracetamol: {
    registrationNumber: 'CDSCO/DRUG/2019/04521',
    status: 'APPROVED',
    licenseHolder: 'USV Pvt Ltd',
    manufacturingSite: 'USV Plant, Thane, Maharashtra',
    approvalDate: '2019-03-15',
  },
  amoxicillin: {
    registrationNumber: 'CDSCO/DRUG/2018/03287',
    status: 'APPROVED',
    licenseHolder: 'Cipla Ltd',
    manufacturingSite: 'Cipla Plant, Goa',
    approvalDate: '2018-07-22',
  },
  metformin: {
    registrationNumber: 'CDSCO/DRUG/2017/01845',
    status: 'APPROVED',
    licenseHolder: 'Sun Pharmaceutical Industries Ltd',
    manufacturingSite: 'Sun Pharma, Halol, Gujarat',
    approvalDate: '2017-11-10',
  },
  omeprazole: {
    registrationNumber: 'CDSCO/DRUG/2020/05612',
    status: 'APPROVED',
    licenseHolder: 'Dr Reddys Laboratories Ltd',
    manufacturingSite: 'Dr Reddys, Bachupally, Hyderabad',
    approvalDate: '2020-01-08',
  },
  cetirizine: {
    registrationNumber: 'CDSCO/DRUG/2016/01234',
    status: 'APPROVED',
    licenseHolder: 'Mankind Pharma Ltd',
    manufacturingSite: 'Mankind Plant, Rudrapur, Uttarakhand',
    approvalDate: '2016-05-30',
  },
  azithromycin: {
    registrationNumber: 'CDSCO/DRUG/2019/07893',
    status: 'APPROVED',
    licenseHolder: 'Alkem Laboratories Ltd',
    manufacturingSite: 'Alkem Plant, Taloja, Maharashtra',
    approvalDate: '2019-09-12',
  },
  ibuprofen: {
    registrationNumber: 'CDSCO/DRUG/2015/00987',
    status: 'APPROVED',
    licenseHolder: 'Abbott India Ltd',
    manufacturingSite: 'Abbott Plant, Baddi, Himachal Pradesh',
    approvalDate: '2015-06-18',
  },
  atorvastatin: {
    registrationNumber: 'CDSCO/DRUG/2021/06234',
    status: 'APPROVED',
    licenseHolder: 'Lupin Ltd',
    manufacturingSite: 'Lupin Plant, Mandideep, Madhya Pradesh',
    approvalDate: '2021-04-25',
  },
}

function lookupCDSCO(medicineName: string) {
  const key = medicineName.toLowerCase().replace(/\s+/g, '')
  for (const [drugKey, info] of Object.entries(CDSCO_REGISTRY)) {
    if (key.includes(drugKey) || drugKey.includes(key)) {
      return info
    }
  }
  return null
}

// ─── Safety Profile Builder ──────────────────────────────────────

function buildSafetyProfile(medicine: {
  id: string
  name: string
  genericName?: string | null
  modality: string
  category: string
  isOTC: boolean
  isPrescription: boolean
  contraindications: Array<{ contraindication: string; reason?: string | null; severity: string }>
  interactions: Array<{ interactingWith: string; interactionType: string; severity: string; effect: string; recommendation?: string | null }>
  warnings: Array<{ warning: string; category: string }>
  sideEffects: Array<{ sideEffect: string; frequency?: string | null; severity: string; isReversible: boolean }>
  populationRules: Array<{ population: string; safetyCategory: string; rationale?: string | null }>
}) {
  return {
    riskLevel: medicine.contraindications.some(c => c.severity === 'ABSOLUTE') ? 'HIGH'
      : medicine.interactions.some(i => i.severity === 'SEVERE' || i.severity === 'MAJOR') ? 'MODERATE'
      : 'LOW',
    isOTC: medicine.isOTC,
    isPrescription: medicine.isPrescription,
    contraindications: medicine.contraindications.map(c => ({
      contraindication: c.contraindication,
      reason: c.reason,
      severity: c.severity,
    })),
    majorInteractions: medicine.interactions
      .filter(i => i.severity === 'MAJOR' || i.severity === 'SEVERE')
      .map(i => ({
        with: i.interactingWith,
        type: i.interactionType,
        effect: i.effect,
        recommendation: i.recommendation,
      })),
    warnings: medicine.warnings.map(w => ({ warning: w.warning, category: w.category })),
    commonSideEffects: medicine.sideEffects
      .filter(s => s.frequency === 'VERY_COMMON' || s.frequency === 'COMMON')
      .map(s => ({ sideEffect: s.sideEffect, frequency: s.frequency, severity: s.severity })),
    seriousSideEffects: medicine.sideEffects
      .filter(s => s.severity === 'SEVERE' || s.severity === 'LIFE_THREATENING')
      .map(s => ({ sideEffect: s.sideEffect, severity: s.severity, isReversible: s.isReversible })),
    populationSafety: medicine.populationRules.map(p => ({
      population: p.population,
      safetyCategory: p.safetyCategory,
      rationale: p.rationale,
    })),
  }
}

// ─── GET: Search CDSCO Registry ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const modality = searchParams.get('modality') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Search medicines from database
    const where: Record<string, unknown> = { isActive: true }
    if (modality) where.modality = modality

    const searchTerms = query.split(/\s+/).filter(Boolean)
    where.OR = [
      { name: { contains: query, mode: 'insensitive' as const } },
      { genericName: { contains: query, mode: 'insensitive' as const } },
      { category: { contains: query, mode: 'insensitive' as const } },
      ...searchTerms.map(term => ({
        name: { contains: term, mode: 'insensitive' as const },
      })),
    ]

    const [medicines, total] = await Promise.all([
      db.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          ingredients: true,
          indications: {
            include: { issue: { select: { id: true, name: true, bodySystem: true } } },
          },
          contraindications: true,
          interactions: true,
          warnings: true,
          sideEffects: true,
          populationRules: true,
          recalls: { where: { isActive: true } },
          brands: { where: { isActive: true }, take: 5 },
        },
      }),
      db.medicine.count({ where }),
    ])

    // Enrich with CDSCO data and safety profiles
    const results = medicines.map((med) => {
      const cdscoInfo = lookupCDSCO(med.name) || lookupCDSCO(med.genericName || '')
      const activeRecalls = med.recalls.filter(r => r.isActive)

      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        modality: med.modality,
        category: med.category,
        form: med.form,
        strength: med.strength,
        manufacturer: med.manufacturer,
        isOTC: med.isOTC,
        isPrescription: med.isPrescription,
        cdscoRegistration: cdscoInfo || { status: 'NOT_FOUND', note: 'Medicine not found in CDSCO registry mock data' },
        recallStatus: activeRecalls.length > 0
          ? { hasActiveRecall: true, recalls: activeRecalls.map(r => ({ id: r.id, reason: r.reason, severity: r.severity, batchNumber: r.batchNumber, recallDate: r.recallDate })) }
          : { hasActiveRecall: false },
        safetyProfile: buildSafetyProfile(med),
        ingredients: med.ingredients.map(i => ({ ingredient: i.ingredient, quantity: i.quantity, role: i.role })),
        indications: med.indications.map(i => ({
          indication: i.indication,
          whyToUse: i.whyToUse,
          whenToUse: i.whenToUse,
          howToUseDaily: i.howToUseDaily,
          medianDose: i.medianDose,
          duration: i.duration,
          evidenceLevel: i.evidenceLevel,
          issue: i.issue,
        })),
        brands: med.brands.map(b => ({ brandName: b.brandName, manufacturer: b.manufacturer, mrp: b.mrp, packSize: b.packSize })),
      }
    })

    return NextResponse.json({
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      query,
    })
  } catch (error) {
    console.error('[SCAN_GET]', error)
    return NextResponse.json({ error: 'Failed to search medicines' }, { status: 500 })
  }
}

// ─── POST: Verify a Medicine ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode, batchNumber, medicineName } = body as {
      barcode?: string
      batchNumber?: string
      medicineName?: string
    }

    if (!barcode && !batchNumber && !medicineName) {
      return NextResponse.json(
        { error: 'At least one of barcode, batchNumber, or medicineName is required' },
        { status: 400 }
      )
    }

    // Find medicine by name
    let medicine = null
    if (medicineName) {
      medicine = await db.medicine.findFirst({
        where: {
          isActive: true,
          OR: [
            { name: { contains: medicineName, mode: 'insensitive' } },
            { genericName: { contains: medicineName, mode: 'insensitive' } },
          ],
        },
        include: {
          ingredients: true,
          indications: { include: { issue: { select: { id: true, name: true } } } },
          contraindications: true,
          interactions: true,
          warnings: true,
          sideEffects: true,
          populationRules: true,
          ageRules: true,
          timingRules: true,
          foodInstructions: true,
          durationRules: true,
          monitoringRules: true,
          recalls: { where: { isActive: true } },
          brands: { where: { isActive: true } },
        },
      })
    }

    // Check for active recalls by batch number
    let recallMatch = null
    if (batchNumber) {
      recallMatch = await db.medicineRecall.findFirst({
        where: { batchNumber, isActive: true },
        include: { medicine: { select: { id: true, name: true, genericName: true } } },
      })
    }

    // Build verification result
    const cdscoInfo = medicine ? (lookupCDSCO(medicine.name) || lookupCDSCO(medicine.genericName || '')) : null

    const verification = {
      verified: !!medicine,
      verificationMethod: medicineName ? 'NAME_MATCH' : batchNumber ? 'BATCH_LOOKUP' : 'BARCODE_SCAN',
      medicine: medicine ? {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        modality: medicine.modality,
        category: medicine.category,
        form: medicine.form,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
      } : null,
      cdscoRegistration: cdscoInfo || { status: medicine ? 'NOT_IN_REGISTRY' : 'UNKNOWN' },
      recallStatus: {
        hasActiveRecall: (medicine?.recalls.length ?? 0) > 0 || !!recallMatch,
        recalls: [
          ...(medicine?.recalls.map(r => ({
            id: r.id,
            reason: r.reason,
            severity: r.severity,
            batchNumber: r.batchNumber,
            recallDate: r.recallDate,
          })) ?? []),
          ...(recallMatch ? [{
            id: recallMatch.id,
            reason: recallMatch.reason,
            severity: recallMatch.severity,
            batchNumber: recallMatch.batchNumber,
            recallDate: recallMatch.recallDate,
            medicine: recallMatch.medicine,
          }] : []),
        ],
      },
      safetyProfile: medicine ? buildSafetyProfile(medicine) : null,
      ingredients: medicine?.ingredients.map(i => ({ ingredient: i.ingredient, quantity: i.quantity, role: i.role })) ?? [],
      indications: medicine?.indications.map(i => ({
        indication: i.indication,
        whyToUse: i.whyToUse,
        whenToUse: i.whenToUse,
        howToUseDaily: i.howToUseDaily,
        medianDose: i.medianDose,
        duration: i.duration,
        evidenceLevel: i.evidenceLevel,
      })) ?? [],
      contraindications: medicine?.contraindications.map(c => ({
        contraindication: c.contraindication,
        reason: c.reason,
        severity: c.severity,
        population: c.population,
      })) ?? [],
      ageRestrictions: medicine?.ageRules.map(a => ({
        ageGroup: a.ageGroup,
        minAge: a.minAge,
        maxAge: a.maxAge,
        doseAdjustment: a.doseAdjustment,
        caution: a.caution,
        isContraindicated: a.isContraindicated,
      })) ?? [],
      timingInstructions: medicine?.timingRules.map(t => ({
        timing: t.timing,
        instruction: t.instruction,
        reason: t.reason,
      })) ?? [],
      foodInstructions: medicine?.foodInstructions.map(f => ({
        food: f.food,
        instruction: f.instruction,
        reason: f.reason,
      })) ?? [],
      durationGuidance: medicine?.durationRules.map(d => ({
        minDuration: d.minDuration,
        maxDuration: d.maxDuration,
        defaultDuration: d.defaultDuration,
        condition: d.condition,
        reviewBy: d.reviewBy,
      })) ?? [],
      monitoringRequirements: medicine?.monitoringRules.map(m => ({
        parameter: m.parameter,
        frequency: m.frequency,
        threshold: m.threshold,
        action: m.action,
      })) ?? [],
      barcode: barcode || null,
      batchNumber: batchNumber || null,
    }

    return NextResponse.json({ data: verification })
  } catch (error) {
    console.error('[SCAN_POST]', error)
    return NextResponse.json({ error: 'Failed to verify medicine' }, { status: 500 })
  }
}
