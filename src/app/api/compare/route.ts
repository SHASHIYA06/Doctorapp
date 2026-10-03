import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Medicine Comparison Data (Indian Healthcare Context) ──────────

interface MedicineCompareData {
  name: string
  genericName: string
  category: string
  form: string
  typicalStrength: string
  manufacturer: string
  isGeneric: boolean
  isOTC: boolean
  mrp: number // INR
  janAushadhiPrice: number | null // INR (Pradhan Mantri Bhartiya Janaushadhi Pariyojana)
  savingsPercent: number | null
  scheduleType: string // H, H1, O, X, etc.
  commonUses: string[]
  sideEffects: string[]
  contraindications: string[]
  dosageRange: string
  onsetOfAction: string
  durationOfAction: string
  foodInstruction: string
  pregnancyCategory: string
  monitoringRequired: string[]
}

// Indian market pricing data (approximate MRP as of 2025)
const MEDICINE_PRICE_DB: Record<string, MedicineCompareData> = {
  'paracetamol': {
    name: 'Paracetamol',
    genericName: 'Paracetamol (Acetaminophen)',
    category: 'ANALGESIC',
    form: 'TABLET',
    typicalStrength: '500mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: true,
    mrp: 35,
    janAushadhiPrice: 8,
    savingsPercent: 77,
    scheduleType: 'O',
    commonUses: ['Fever', 'Headache', 'Mild to moderate pain', 'Dengue fever management'],
    sideEffects: ['Hepatotoxicity (overdose)', 'Nausea', 'Rash'],
    contraindications: ['Severe hepatic impairment', 'Alcohol dependence'],
    dosageRange: '500-1000mg every 4-6 hours (max 4g/day)',
    onsetOfAction: '30-60 minutes',
    durationOfAction: '4-6 hours',
    foodInstruction: 'Can be taken with or without food',
    pregnancyCategory: 'B (Safe)',
    monitoringRequired: ['Liver function (prolonged use)'],
  },
  'ibuprofen': {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'NSAID',
    form: 'TABLET',
    typicalStrength: '400mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: true,
    mrp: 40,
    janAushadhiPrice: 12,
    savingsPercent: 70,
    scheduleType: 'O',
    commonUses: ['Pain', 'Inflammation', 'Fever', 'Dysmenorrhea', 'Arthritis'],
    sideEffects: ['GI irritation', 'Peptic ulcer', 'Renal impairment', 'Dizziness'],
    contraindications: ['Active peptic ulcer', 'Third trimester pregnancy', 'Severe heart failure'],
    dosageRange: '200-400mg every 4-6 hours (max 1200mg/day OTC)',
    onsetOfAction: '30-60 minutes',
    durationOfAction: '4-6 hours',
    foodInstruction: 'Take with food or after meals',
    pregnancyCategory: 'C (First/Second), D (Third)',
    monitoringRequired: ['Renal function', 'Blood pressure', 'GI symptoms'],
  },
  'metformin': {
    name: 'Metformin',
    genericName: 'Metformin HCl',
    category: 'ANTIDIABETIC',
    form: 'TABLET',
    typicalStrength: '500mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 50,
    janAushadhiPrice: 15,
    savingsPercent: 70,
    scheduleType: 'H',
    commonUses: ['Type 2 Diabetes Mellitus', 'Insulin resistance', 'PCOS (off-label)'],
    sideEffects: ['GI upset', 'Lactic acidosis (rare)', 'Vitamin B12 deficiency (long-term)', 'Diarrhea'],
    contraindications: ['Severe renal impairment (eGFR <30)', 'Metabolic acidosis', 'Before iodinated contrast'],
    dosageRange: '500mg once daily, titrate to max 2550mg/day',
    onsetOfAction: 'Days to weeks (full effect)',
    durationOfAction: '24 hours (sustained release)',
    foodInstruction: 'Take with meals to reduce GI side effects',
    pregnancyCategory: 'B (Limited data)',
    monitoringRequired: ['HbA1c (every 3 months)', 'Renal function', 'Vitamin B12 (annual)'],
  },
  'amlodipine': {
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    category: 'ANTIHYPERTENSIVE',
    form: 'TABLET',
    typicalStrength: '5mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 60,
    janAushadhiPrice: 18,
    savingsPercent: 70,
    scheduleType: 'H',
    commonUses: ['Hypertension', 'Angina pectoris', 'Raynaud\'s phenomenon'],
    sideEffects: ['Peripheral edema', 'Headache', 'Flushing', 'Dizziness', 'Palpitations'],
    contraindications: ['Severe aortic stenosis', 'Cardiogenic shock', 'Unstable angina (not controlled)'],
    dosageRange: '2.5-10mg once daily',
    onsetOfAction: '2-4 hours',
    durationOfAction: '24 hours',
    foodInstruction: 'Can be taken with or without food',
    pregnancyCategory: 'C (Use only if clearly needed)',
    monitoringRequired: ['Blood pressure', 'Ankle edema'],
  },
  'atorvastatin': {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'STATIN',
    form: 'TABLET',
    typicalStrength: '10mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 80,
    janAushadhiPrice: 24,
    savingsPercent: 70,
    scheduleType: 'H',
    commonUses: ['Hyperlipidemia', 'Dyslipidemia', 'Cardiovascular risk reduction', 'Post-MI'],
    sideEffects: ['Myalgia', 'Hepatotoxicity', 'Rhabdomyolysis (rare)', 'GI upset'],
    contraindications: ['Active liver disease', 'Pregnancy', 'Breastfeeding'],
    dosageRange: '10-80mg once daily',
    onsetOfAction: '2 weeks (lipid effect)',
    durationOfAction: '24 hours',
    foodInstruction: 'Take at bedtime (best with circadian rhythm)',
    pregnancyCategory: 'X (Contraindicated)',
    monitoringRequired: ['Lipid profile (3 monthly)', 'Liver function', 'CK if muscle symptoms'],
  },
  'omeprazole': {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'PPI',
    form: 'CAPSULE',
    typicalStrength: '20mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 65,
    janAushadhiPrice: 18,
    savingsPercent: 72,
    scheduleType: 'H',
    commonUses: ['GERD', 'Peptic ulcer', 'H. pylori eradication', 'Gastritis', 'Zollinger-Ellison'],
    sideEffects: ['Headache', 'GI upset', 'Osteoporosis (long-term)', 'B12 deficiency', 'C. difficile risk'],
    contraindications: ['Concomitant rilpivirine', 'Concomitant nelfinavir'],
    dosageRange: '20-40mg once daily before breakfast',
    onsetOfAction: '1-2 hours',
    durationOfAction: '24 hours',
    foodInstruction: 'Take 30 minutes before breakfast on empty stomach',
    pregnancyCategory: 'C',
    monitoringRequired: ['Magnesium (long-term)', 'B12 (long-term)', 'Bone density (long-term)'],
  },
  'amoxicillin': {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'ANTIBIOTIC',
    form: 'CAPSULE',
    typicalStrength: '500mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 85,
    janAushadhiPrice: 27,
    savingsPercent: 68,
    scheduleType: 'H',
    commonUses: ['Bacterial infections', 'Otitis media', 'Sinusitis', 'UTI', 'H. pylori eradication', 'Dental infections'],
    sideEffects: ['Diarrhea', 'Rash', 'Allergic reaction', 'Nausea', 'Superinfection'],
    contraindications: ['Penicillin allergy', 'Infectious mononucleosis'],
    dosageRange: '250-500mg every 8 hours',
    onsetOfAction: '1-2 hours',
    durationOfAction: '8 hours',
    foodInstruction: 'Can be taken with or without food',
    pregnancyCategory: 'B',
    monitoringRequired: ['Renal function (dose adjustment)', 'Signs of allergy'],
  },
  'cephalexin': {
    name: 'Cephalexin',
    genericName: 'Cephalexin',
    category: 'ANTIBIOTIC',
    form: 'CAPSULE',
    typicalStrength: '500mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 110,
    janAushadhiPrice: 35,
    savingsPercent: 68,
    scheduleType: 'H1',
    commonUses: ['Skin infections', 'UTI', 'Respiratory infections', 'Bone infections', 'Pharyngitis'],
    sideEffects: ['Diarrhea', 'Rash', 'Nausea', 'Abdominal pain', 'C. difficile colitis'],
    contraindications: ['Cephalosporin allergy', 'Penicillin allergy (cross-reactivity risk)'],
    dosageRange: '250-500mg every 6 hours',
    onsetOfAction: '1-2 hours',
    durationOfAction: '6 hours',
    foodInstruction: 'Can be taken with or without food',
    pregnancyCategory: 'B',
    monitoringRequired: ['Renal function (dose adjustment)'],
  },
  'cefixime': {
    name: 'Cefixime',
    genericName: 'Cefixime',
    category: 'ANTIBIOTIC',
    form: 'TABLET',
    typicalStrength: '200mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 130,
    janAushadhiPrice: 42,
    savingsPercent: 68,
    scheduleType: 'H1',
    commonUses: ['UTI', 'Otitis media', 'Pharyngitis', 'Tonsillitis', 'Gonorrhea'],
    sideEffects: ['Diarrhea', 'Rash', 'Nausea', 'Headache', 'Dyspepsia'],
    contraindications: ['Cephalosporin allergy'],
    dosageRange: '200-400mg once daily or 200mg twice daily',
    onsetOfAction: '1-2 hours',
    durationOfAction: '12-24 hours',
    foodInstruction: 'Can be taken with or without food',
    pregnancyCategory: 'B',
    monitoringRequired: ['Renal function (dose adjustment)'],
  },
  'azithromycin': {
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    category: 'ANTIBIOTIC',
    form: 'TABLET',
    typicalStrength: '500mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 95,
    janAushadhiPrice: 30,
    savingsPercent: 68,
    scheduleType: 'H1',
    commonUses: ['Respiratory infections', 'Community-acquired pneumonia', 'Chlamydia', 'Typhoid', 'Skin infections'],
    sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain', 'QT prolongation', 'Hepatotoxicity'],
    contraindications: ['Macrolide allergy', 'Concomitant artemether/lumefantrine (caution)', 'Severe hepatic impairment'],
    dosageRange: '500mg day 1, then 250mg days 2-5 (or 500mg × 3 days)',
    onsetOfAction: '2-3 hours',
    durationOfAction: '24-96 hours (extended tissue half-life)',
    foodInstruction: 'Take 1 hour before or 2 hours after food',
    pregnancyCategory: 'B',
    monitoringRequired: ['QT interval (with other QT-prolonging drugs)', 'Liver function'],
  },
  'montelukast': {
    name: 'Montelukast',
    genericName: 'Montelukast Sodium',
    category: 'LEUKOTRIENE_MODIFIER',
    form: 'TABLET',
    typicalStrength: '10mg',
    manufacturer: 'Generic',
    isGeneric: true,
    isOTC: false,
    mrp: 120,
    janAushadhiPrice: 38,
    savingsPercent: 68,
    scheduleType: 'H',
    commonUses: ['Asthma prophylaxis', 'Allergic rhinitis', 'Exercise-induced bronchoconstriction'],
    sideEffects: ['Headache', 'Abdominal pain', 'Neuropsychiatric events (FDA warning)', 'Cough'],
    contraindications: ['Phenylketonuria (chewable form)', 'Not for acute asthma attacks'],
    dosageRange: '10mg once daily (adults), 5mg (children 6-14), 4mg (2-5)',
    onsetOfAction: 'Hours to days (not for acute relief)',
    durationOfAction: '24 hours',
    foodInstruction: 'Take in the evening',
    pregnancyCategory: 'B',
    monitoringRequired: ['Neuropsychiatric symptoms', 'Asthma control assessment'],
  },
}

// ─── GET: Compare two medicines ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicineA = searchParams.get('medicineA') || ''
    const medicineB = searchParams.get('medicineB') || ''

    if (!medicineA || !medicineB) {
      return NextResponse.json(
        { error: 'Both medicineA and medicineB query parameters are required' },
        { status: 400 }
      )
    }

    const keyA = medicineA.toLowerCase().trim()
    const keyB = medicineB.toLowerCase().trim()

    // Look up from local price DB first, then from database
    let dataA: MedicineCompareData | null = MEDICINE_PRICE_DB[keyA] || null
    let dataB: MedicineCompareData | null = MEDICINE_PRICE_DB[keyB] || null

    // Fallback to database lookup
    if (!dataA) {
      const dbMed = await db.medicine.findFirst({
        where: {
          OR: [
            { name: { equals: medicineA, mode: 'insensitive' } },
            { genericName: { equals: medicineA, mode: 'insensitive' } },
            { name: { contains: medicineA, mode: 'insensitive' } },
            { genericName: { contains: medicineA, mode: 'insensitive' } },
          ],
        },
        include: {
          brands: { take: 5 },
          sideEffects: { take: 5 },
          contraindications: { take: 5 },
          interactions: { take: 5 },
          warnings: { take: 3 },
        },
      })

      if (dbMed) {
        dataA = {
          name: dbMed.name,
          genericName: dbMed.genericName || dbMed.name,
          category: dbMed.category,
          form: dbMed.form || 'TABLET',
          typicalStrength: dbMed.strength || '',
          manufacturer: dbMed.manufacturer || 'Generic',
          isGeneric: dbMed.isGeneric,
          isOTC: dbMed.isOTC,
          mrp: dbMed.brands[0]?.mrp || 0,
          janAushadhiPrice: null,
          savingsPercent: null,
          scheduleType: dbMed.subCategory || 'H',
          commonUses: [],
          sideEffects: dbMed.sideEffects.map((s) => s.sideEffect),
          contraindications: dbMed.contraindications.map((c) => c.contraindication),
          dosageRange: '',
          onsetOfAction: '',
          durationOfAction: '',
          foodInstruction: '',
          pregnancyCategory: '',
          monitoringRequired: [],
        }
      }
    }

    if (!dataB) {
      const dbMed = await db.medicine.findFirst({
        where: {
          OR: [
            { name: { equals: medicineB, mode: 'insensitive' } },
            { genericName: { equals: medicineB, mode: 'insensitive' } },
            { name: { contains: medicineB, mode: 'insensitive' } },
            { genericName: { contains: medicineB, mode: 'insensitive' } },
          ],
        },
        include: {
          brands: { take: 5 },
          sideEffects: { take: 5 },
          contraindications: { take: 5 },
          interactions: { take: 5 },
          warnings: { take: 3 },
        },
      })

      if (dbMed) {
        dataB = {
          name: dbMed.name,
          genericName: dbMed.genericName || dbMed.name,
          category: dbMed.category,
          form: dbMed.form || 'TABLET',
          typicalStrength: dbMed.strength || '',
          manufacturer: dbMed.manufacturer || 'Generic',
          isGeneric: dbMed.isGeneric,
          isOTC: dbMed.isOTC,
          mrp: dbMed.brands[0]?.mrp || 0,
          janAushadhiPrice: null,
          savingsPercent: null,
          scheduleType: dbMed.subCategory || 'H',
          commonUses: [],
          sideEffects: dbMed.sideEffects.map((s) => s.sideEffect),
          contraindications: dbMed.contraindications.map((c) => c.contraindication),
          dosageRange: '',
          onsetOfAction: '',
          durationOfAction: '',
          foodInstruction: '',
          pregnancyCategory: '',
          monitoringRequired: [],
        }
      }
    }

    if (!dataA || !dataB) {
      const missing = !dataA && !dataB ? `${medicineA} and ${medicineB}` : !dataA ? medicineA : medicineB
      return NextResponse.json(
        { error: `Medicine not found: ${missing}. Available medicines: ${Object.keys(MEDICINE_PRICE_DB).join(', ')}` },
        { status: 404 }
      )
    }

    // Calculate comparison metrics
    const priceDifference = dataA.mrp - dataB.mrp
    const cheaperMedicine = priceDifference < 0 ? dataA.name : priceDifference > 0 ? dataB.name : 'Same price'
    const priceDiffPercent = dataA.mrp > 0
      ? Math.abs(Math.round((priceDifference / Math.max(dataA.mrp, dataB.mrp)) * 100))
      : 0

    // Jan Aushadhi savings comparison
    const bestJanAushadhiA = dataA.janAushadhiPrice
      ? { price: dataA.janAushadhiPrice, savings: dataA.savingsPercent }
      : null
    const bestJanAushadhiB = dataB.janAushadhiPrice
      ? { price: dataB.janAushadhiPrice, savings: dataB.savingsPercent }
      : null

    // Same category check
    const sameCategory = dataA.category === dataB.category
    const sharedSideEffects = dataA.sideEffects.filter((se) =>
      dataB.sideEffects.some((bse) => bse.toLowerCase().includes(se.toLowerCase().split(' ')[0]))
    )
    const sharedContraindications = dataA.contraindications.filter((ci) =>
      dataB.contraindications.some((bci) => bci.toLowerCase().includes(ci.toLowerCase().split(' ')[0]))
    )

    return NextResponse.json({
      data: {
        medicineA: dataA,
        medicineB: dataB,
        comparison: {
          sameCategory,
          priceDifference: {
            amount: Math.abs(priceDifference),
            percent: priceDiffPercent,
            cheaper: cheaperMedicine,
            unit: 'INR per strip/bottle (approx)',
          },
          janAushadhiSavings: {
            medicineA: bestJanAushadhiA,
            medicineB: bestJanAushadhiB,
            note: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) prices. Available at 10,000+ Janaushadhi Kendras across India.',
          },
          sharedSideEffects,
          sharedContraindications,
          categoryMatch: sameCategory
            ? `Both are ${dataA.category} — direct comparison valid`
            : `Different categories (${dataA.category} vs ${dataB.category}) — compare only if clinically relevant`,
        },
      },
    })
  } catch (error) {
    console.error('[COMPARE_GET]', error)
    return NextResponse.json({ error: 'Failed to compare medicines' }, { status: 500 })
  }
}
