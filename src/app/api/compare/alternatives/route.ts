import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Generic Alternatives Data (Indian Healthcare Context) ─────────

interface GenericAlternative {
  name: string
  genericName: string
  manufacturer: string
  isGeneric: boolean
  mrp: number
  janAushadhiPrice: number | null
  savingsPercent: number | null
  form: string
  strength: string
  isBioequivalent: boolean
  scheduleType: string
  isAvailableInIndia: boolean
}

// Jan Aushadhi (PMBJP) pricing data
const ALTERNATIVES_DB: Record<string, GenericAlternative[]> = {
  'paracetamol': [
    { name: 'Paracetamol (Janaushadhi)', genericName: 'Paracetamol 500mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 8, janAushadhiPrice: 8, savingsPercent: 77, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'O', isAvailableInIndia: true },
    { name: 'Dolo 650', genericName: 'Paracetamol 650mg', manufacturer: 'Micro Labs', isGeneric: false, mrp: 30, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '650mg', isBioequivalent: true, scheduleType: 'O', isAvailableInIndia: true },
    { name: 'Crocin Advance', genericName: 'Paracetamol 500mg', manufacturer: 'GSK', isGeneric: false, mrp: 35, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'O', isAvailableInIndia: true },
    { name: 'Calpol', genericName: 'Paracetamol 500mg', manufacturer: 'GSK', isGeneric: false, mrp: 32, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'O', isAvailableInIndia: true },
    { name: 'Pacimol', genericName: 'Paracetamol 500mg', manufacturer: 'IPCA', isGeneric: false, mrp: 28, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'O', isAvailableInIndia: true },
  ],
  'metformin': [
    { name: 'Metformin (Janaushadhi)', genericName: 'Metformin 500mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 15, janAushadhiPrice: 15, savingsPercent: 70, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Glycomet', genericName: 'Metformin 500mg', manufacturer: 'USV', isGeneric: false, mrp: 45, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Glucophage', genericName: 'Metformin 500mg', manufacturer: 'Merck', isGeneric: false, mrp: 55, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Obimet', genericName: 'Metformin 500mg', manufacturer: 'Abbott', isGeneric: false, mrp: 48, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Walaphage', genericName: 'Metformin 500mg', manufacturer: 'Alkem', isGeneric: false, mrp: 40, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
  ],
  'amlodipine': [
    { name: 'Amlodipine (Janaushadhi)', genericName: 'Amlodipine 5mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 18, janAushadhiPrice: 18, savingsPercent: 70, form: 'TABLET', strength: '5mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Amlong', genericName: 'Amlodipine 5mg', manufacturer: 'Micro Labs', isGeneric: false, mrp: 58, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '5mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Amlip', genericName: 'Amlodipine 5mg', manufacturer: 'Cipla', isGeneric: false, mrp: 52, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '5mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Norvasc', genericName: 'Amlodipine 5mg', manufacturer: 'Pfizer', isGeneric: false, mrp: 80, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '5mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
  ],
  'atorvastatin': [
    { name: 'Atorvastatin (Janaushadhi)', genericName: 'Atorvastatin 10mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 24, janAushadhiPrice: 24, savingsPercent: 70, form: 'TABLET', strength: '10mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Atorva', genericName: 'Atorvastatin 10mg', manufacturer: 'Zydus', isGeneric: false, mrp: 72, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '10mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Lipitor', genericName: 'Atorvastatin 10mg', manufacturer: 'Pfizer', isGeneric: false, mrp: 110, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '10mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Tonact', genericName: 'Atorvastatin 10mg', manufacturer: 'Lupin', isGeneric: false, mrp: 68, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '10mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
  ],
  'omeprazole': [
    { name: 'Omeprazole (Janaushadhi)', genericName: 'Omeprazole 20mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 18, janAushadhiPrice: 18, savingsPercent: 72, form: 'CAPSULE', strength: '20mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Omez', genericName: 'Omeprazole 20mg', manufacturer: 'Dr Reddy\'s', isGeneric: false, mrp: 62, janAushadhiPrice: null, savingsPercent: null, form: 'CAPSULE', strength: '20mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Omecip', genericName: 'Omeprazole 20mg', manufacturer: 'Cipla', isGeneric: false, mrp: 55, janAushadhiPrice: null, savingsPercent: null, form: 'CAPSULE', strength: '20mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
  ],
  'amoxicillin': [
    { name: 'Amoxicillin (Janaushadhi)', genericName: 'Amoxicillin 500mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 27, janAushadhiPrice: 27, savingsPercent: 68, form: 'CAPSULE', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Amoxil', genericName: 'Amoxicillin 500mg', manufacturer: 'GSK', isGeneric: false, mrp: 78, janAushadhiPrice: null, savingsPercent: null, form: 'CAPSULE', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
    { name: 'Mox', genericName: 'Amoxicillin 500mg', manufacturer: 'Cipla', isGeneric: false, mrp: 65, janAushadhiPrice: null, savingsPercent: null, form: 'CAPSULE', strength: '500mg', isBioequivalent: true, scheduleType: 'H', isAvailableInIndia: true },
  ],
  'azithromycin': [
    { name: 'Azithromycin (Janaushadhi)', genericName: 'Azithromycin 500mg', manufacturer: 'PMBJP', isGeneric: true, mrp: 30, janAushadhiPrice: 30, savingsPercent: 68, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H1', isAvailableInIndia: true },
    { name: 'Azithral', genericName: 'Azithromycin 500mg', manufacturer: 'Alembic', isGeneric: false, mrp: 88, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H1', isAvailableInIndia: true },
    { name: 'Zithromax', genericName: 'Azithromycin 500mg', manufacturer: 'Pfizer', isGeneric: false, mrp: 105, janAushadhiPrice: null, savingsPercent: null, form: 'TABLET', strength: '500mg', isBioequivalent: true, scheduleType: 'H1', isAvailableInIndia: true },
  ],
}

// ─── GET: Get generic alternatives ────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicineName = searchParams.get('medicineName') || ''

    if (!medicineName) {
      return NextResponse.json(
        { error: 'medicineName query parameter is required' },
        { status: 400 }
      )
    }

    const key = medicineName.toLowerCase().trim()

    // Look up from local alternatives DB
    let alternatives = ALTERNATIVES_DB[key] || null

    // Fallback: search database medicines with same generic name
    if (!alternatives) {
      const dbMed = await db.medicine.findFirst({
        where: {
          OR: [
            { name: { equals: medicineName, mode: 'insensitive' } },
            { genericName: { equals: medicineName, mode: 'insensitive' } },
            { name: { contains: medicineName, mode: 'insensitive' } },
            { genericName: { contains: medicineName, mode: 'insensitive' } },
          ],
        },
        select: { id: true, genericName: true, name: true, category: true },
      })

      if (dbMed && dbMed.genericName) {
        // Find medicines with same generic name
        const generics = await db.medicine.findMany({
          where: {
            genericName: { equals: dbMed.genericName, mode: 'insensitive' },
            id: { not: dbMed.id },
            isActive: true,
          },
          include: {
            brands: { take: 3 },
          },
          take: 10,
        })

        alternatives = generics.map((med) => ({
          name: med.name,
          genericName: med.genericName || med.name,
          manufacturer: med.manufacturer || 'Unknown',
          isGeneric: med.isGeneric,
          mrp: med.brands[0]?.mrp || 0,
          janAushadhiPrice: null,
          savingsPercent: null,
          form: med.form || 'TABLET',
          strength: med.strength || '',
          isBioequivalent: true,
          scheduleType: med.subCategory || 'H',
          isAvailableInIndia: true,
        }))
      }
    }

    if (!alternatives || alternatives.length === 0) {
      return NextResponse.json({
        data: {
          medicineName,
          alternatives: [],
          totalAlternatives: 0,
          message: `No generic alternatives found for "${medicineName}". Available medicines: ${Object.keys(ALTERNATIVES_DB).join(', ')}`,
          janAushadhiInfo: {
            scheme: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
            kendrasCount: '10,000+',
            website: 'https://janaushadhi.gov.in',
            helpline: '1800-180-6090',
            savings: 'Up to 50-90% off branded MRP',
          },
        },
      })
    }

    // Sort: Jan Aushadhi first, then by price ascending
    const sorted = [...alternatives].sort((a, b) => {
      if (a.janAushadhiPrice && !b.janAushadhiPrice) return -1
      if (!a.janAushadhiPrice && b.janAushadhiPrice) return 1
      return a.mrp - b.mrp
    })

    // Calculate best savings
    const brandedPrices = sorted.filter((a) => !a.isGeneric && a.mrp > 0)
    const janAushadhiOption = sorted.find((a) => a.janAushadhiPrice)
    const cheapestBranded = brandedPrices.length > 0
      ? Math.min(...brandedPrices.map((a) => a.mrp))
      : null
    const maxSavings = janAushadhiOption && cheapestBranded
      ? Math.round(((cheapestBranded - janAushadhiOption.janAushadhiPrice!) / cheapestBranded) * 100)
      : null

    return NextResponse.json({
      data: {
        medicineName,
        alternatives: sorted,
        totalAlternatives: sorted.length,
        bestSavings: {
          janAushadhiPrice: janAushadhiOption?.janAushadhiPrice || null,
          cheapestBranded,
          maxSavingsPercent: maxSavings,
        },
        janAushadhiInfo: {
          scheme: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
          kendrasCount: '10,000+',
          website: 'https://janaushadhi.gov.in',
          helpline: '1800-180-6090',
          savings: 'Up to 50-90% off branded MRP',
          qualityAssurance: 'All Janaushadhi medicines are NABL-accredited lab tested and meet WHO-GMP standards',
          nearbyKendraSearch: 'https://janaushadhi.gov.in/store-locator',
        },
      },
    })
  } catch (error) {
    console.error('[COMPARE_ALTERNATIVES_GET]', error)
    return NextResponse.json({ error: 'Failed to get generic alternatives' }, { status: 500 })
  }
}
