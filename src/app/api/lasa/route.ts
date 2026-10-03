import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── LASA (Look-Alike Sound-Alike) Master Data ────────────────────
// Uses tall-man letter notation (capitalized distinguishing letters)
// Reference: ISMP (Institute for Safe Medication Practices) + Indian context

const LASA_MASTER_DATA = [
  {
    medicineA: 'hydrALAZINE',
    medicineB: 'hydrOXYzine',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.92,
    isHighRisk: true,
    tallManLetterA: 'hydrALAZINE',
    tallManLetterB: 'hydrOXYzine',
    category: 'Antihypertensive vs Antihistamine',
    clinicalRisk: 'Hydralazine is an antihypertensive (vasodilator); Hydroxyzine is an antihistamine with sedative properties. Wrong drug can cause severe hypotension or excessive sedation.',
    recommendation: 'Use tall-man lettering on all labels, storage bins, and prescriptions. Store in separate locations. Require dual verification before dispensing.',
    indianBrands: { a: ['Apresoline', 'Hydrallaz'], b: ['Atarax', 'Hyzine'] },
  },
  {
    medicineA: 'predniSONE',
    medicineB: 'prednisoLONE',
    matchType: 'LOOK_ALIKE',
    similarityScore: 0.96,
    isHighRisk: false,
    tallManLetterA: 'predniSONE',
    tallManLetterB: 'prednisoLONE',
    category: 'Corticosteroids',
    clinicalRisk: 'Prednisone requires hepatic conversion to prednisolone. In hepatic impairment, prednisolone is preferred. Dose differences can lead to under/over-treatment.',
    recommendation: 'Clearly specify salt form. Default to prednisolone in pediatric and hepatic impairment patients.',
    indianBrands: { a: ['Wysolone', 'Omnacortil'], b: ['Predforte', 'Macpred'] },
  },
  {
    medicineA: 'vinCRIStine',
    medicineB: 'vinBLAStine',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.88,
    isHighRisk: true,
    tallManLetterA: 'vinCRIStine',
    tallManLetterB: 'vinBLAStine',
    category: 'Antineoplastic (Vinca Alkaloids)',
    clinicalRisk: 'FATAL if confused. Vincristine is given IV only (intrathecal administration is FATAL). Vinblastine dosing is different. Multiple deaths reported from vincristine-vinblastine confusion globally.',
    recommendation: 'MANDATORY: Vincristine must be dispensed in a unique overwrap bag labeled "FOR IV USE ONLY — FATAL IF GIVEN INTRATHECALLY". Store separately. Independent double-check before administration.',
    indianBrands: { a: ['Cristine', 'Oncrin'], b: ['Velban', 'Cytoblastin'] },
  },
  {
    medicineA: 'metroNIDAZOLE',
    medicineB: 'metroCLOPRAMIDE',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.78,
    isHighRisk: false,
    tallManLetterA: 'metroNIDAZOLE',
    tallManLetterB: 'metroCLOPRAMIDE',
    category: 'Antibiotic vs Antiemetic',
    clinicalRisk: 'Metronidazole is an antibiotic/antiprotozoal; Metoclopramide is an antiemetic/prokinetic. Wrong drug can lead to untreated infection or unnecessary side effects.',
    recommendation: 'Use brand name alongside generic. Verify indication before dispensing.',
    indianBrands: { a: ['Flagyl', 'Metrogyl'], b: ['Reglan', 'Perinorm', 'Empro'] },
  },
  {
    medicineA: 'cloBAZAM',
    medicineB: 'clonazepam',
    matchType: 'LOOK_ALIKE',
    similarityScore: 0.82,
    isHighRisk: false,
    tallManLetterA: 'cloBAZAM',
    tallManLetterB: 'clonazepam',
    category: 'Benzodiazepines',
    clinicalRisk: 'Both are benzodiazepines but with different indications and potencies. Clobazam is used as adjunct in epilepsy; Clonazepam for seizures, panic disorder. Dose confusion can occur.',
    recommendation: 'Specify full generic name. Include indication on prescription. Highlight 5mg clobazam ≠ 0.5mg clonazepam.',
    indianBrands: { a: ['Frisium', 'Clobakem'], b: ['Rivotril', 'Clonotril'] },
  },
  {
    medicineA: 'celecoxib',
    medicineB: 'ceftazidime',
    matchType: 'LOOK_ALIKE',
    similarityScore: 0.74,
    isHighRisk: false,
    tallManLetterA: 'celecoxib',
    tallManLetterB: 'ceftazidime',
    category: 'NSAID vs Antibiotic',
    clinicalRisk: 'Celecoxib is a COX-2 selective NSAID; Ceftazidime is a cephalosporin antibiotic. Completely different therapeutic classes. Wrong drug = untreated infection or unnecessary NSAID risks.',
    recommendation: 'Store in different alphabet sections. Include therapeutic class on labels. Verify indication before dispensing.',
    indianBrands: { a: ['Celebrex', 'Celact'], b: ['Fortaz', 'Ceftum'] },
  },
  {
    medicineA: 'tolTERODINE',
    medicineB: 'tolAZamide',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.80,
    isHighRisk: false,
    tallManLetterA: 'tolTERODINE',
    tallManLetterB: 'tolAZamide',
    category: 'Antimuscarinic vs Sulfonylurea',
    clinicalRisk: 'Tolterodine is for overactive bladder; Tolazamide is an oral hypoglycemic. Wrong drug can cause severe hypoglycemia or untreated urinary symptoms.',
    recommendation: 'Include indication on prescription. Use brand name alongside generic. Separate storage for antidiabetics.',
    indianBrands: { a: ['Detrol', 'Tolterod'], b: ['Tolinase'] },
  },
  // Additional Indian-context LASA pairs
  {
    medicineA: 'chlorproMAZINE',
    medicineB: 'chlorproPAMIDE',
    matchType: 'LOOK_ALIKE',
    similarityScore: 0.90,
    isHighRisk: true,
    tallManLetterA: 'chlorproMAZINE',
    tallManLetterB: 'chlorproPAMIDE',
    category: 'Antipsychotic vs Sulfonylurea',
    clinicalRisk: 'Chlorpromazine is a phenothiazine antipsychotic; Chlorpropamide is a long-acting sulfonylurea. Confusion can cause severe hypoglycemia or unnecessary sedation.',
    recommendation: 'CRITICAL: Use tall-man lettering. Never store together. Include diagnosis on prescription.',
    indianBrands: { a: ['Largactil', 'Thorazine'], b: ['Diabinese'] },
  },
  {
    medicineA: 'ephedrine',
    medicineB: 'epinephrine',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.85,
    isHighRisk: true,
    tallManLetterA: 'ePHEDrine',
    tallManLetterB: 'epiNEPHrine',
    category: 'Sympathomimetics',
    clinicalRisk: 'Ephedrine is a sympathomimetic with different potency; Epinephrine (adrenaline) is used in anaphylaxis and cardiac arrest. Dose confusion can be FATAL.',
    recommendation: 'CRITICAL: Always use INN (epinephrine) not adrenaline in writing. Different storage. Auto-alert on look-alike names.',
    indianBrands: { a: ['Ephedrine'], b: ['Adrenalin', 'EpiPen'] },
  },
  {
    medicineA: 'dobutamine',
    medicineB: 'dopamine',
    matchType: 'SOUND_ALIKE',
    similarityScore: 0.83,
    isHighRisk: true,
    tallManLetterA: 'DOBUtamine',
    tallManLetterB: 'DOPamine',
    category: 'Inotropes',
    clinicalRisk: 'Both are inotropes but with different receptor profiles. Dobutamine is primarily β1; Dopamine has dose-dependent effects. Wrong drug/dose in ICU can be FATAL.',
    recommendation: 'CRITICAL: Tall-man lettering on all ICU infusions. Standardized concentrations. Independent double-check.',
    indianBrands: { a: ['Dobutrex'], b: ['Intropin', 'Dopastat'] },
  },
]

// ─── GET: Check for LASA matches ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicineName = searchParams.get('medicineName') || ''
    const includeAll = searchParams.get('includeAll') === 'true'

    // If no specific medicine and not requesting all, return error
    if (!medicineName && !includeAll) {
      return NextResponse.json(
        { error: 'Provide medicineName query parameter or set includeAll=true' },
        { status: 400 }
      )
    }

    // Also check database for any stored LASA alerts
    const dbAlerts = await db.lASAAlert.findMany()

    // Merge database alerts with master data
    const allLasAData = [
      ...LASA_MASTER_DATA,
      ...dbAlerts.map((alert) => ({
        medicineA: alert.medicineA,
        medicineB: alert.medicineB,
        matchType: alert.matchType,
        similarityScore: alert.similarityScore,
        isHighRisk: alert.isHighRisk,
        tallManLetterA: alert.tallManLetterA || alert.medicineA,
        tallManLetterB: alert.tallManLetterB || alert.medicineB,
        category: 'Database LASA Alert',
        clinicalRisk: '',
        recommendation: '',
        indianBrands: { a: [], b: [] },
      })),
    ]

    if (includeAll) {
      return NextResponse.json({
        data: {
          alerts: allLasAData,
          total: allLasAData.length,
          highRiskCount: allLasAData.filter((a) => a.isHighRisk).length,
          soundAlikeCount: allLasAData.filter((a) => a.matchType === 'SOUND_ALIKE').length,
          lookAlikeCount: allLasAData.filter((a) => a.matchType === 'LOOK_ALIKE').length,
        },
      })
    }

    // Find matches for the specified medicine
    const normalizedName = medicineName.toLowerCase().replace(/[^a-z]/g, '')
    const matches = allLasAData.filter((alert) => {
      const a = alert.medicineA.toLowerCase().replace(/[^a-z]/g, '')
      const b = alert.medicineB.toLowerCase().replace(/[^a-z]/g, '')
      return a === normalizedName || b === normalizedName ||
        a.includes(normalizedName) || b.includes(normalizedName) ||
        normalizedName.includes(a) || normalizedName.includes(b)
    }).map((alert) => {
      // Determine which is the queried medicine and which is the confusable
      const a = alert.medicineA.toLowerCase().replace(/[^a-z]/g, '')
      const isQueriedA = a === normalizedName || a.includes(normalizedName) || normalizedName.includes(a)

      return {
        queriedMedicine: isQueriedA ? alert.tallManLetterA : alert.tallManLetterB,
        confusableMedicine: isQueriedA ? alert.tallManLetterB : alert.tallManLetterA,
        queriedBrands: isQueriedA ? alert.indianBrands.a : alert.indianBrands.b,
        confusableBrands: isQueriedA ? alert.indianBrands.b : alert.indianBrands.a,
        matchType: alert.matchType,
        similarityScore: alert.similarityScore,
        isHighRisk: alert.isHighRisk,
        category: alert.category,
        clinicalRisk: alert.clinicalRisk,
        recommendation: alert.recommendation,
      }
    })

    // Sort: high risk first, then by similarity score descending
    matches.sort((a, b) => {
      if (a.isHighRisk !== b.isHighRisk) return a.isHighRisk ? -1 : 1
      return b.similarityScore - a.similarityScore
    })

    return NextResponse.json({
      data: {
        medicineName,
        hasLASAMatches: matches.length > 0,
        matchCount: matches.length,
        matches,
        safetyGuidance: matches.length > 0
          ? {
              action: matches.some((m) => m.isHighRisk)
                ? 'HIGH_RISK_ALERT'
                : 'CAUTION',
              message: matches.some((m) => m.isHighRisk)
                ? '⚠️ HIGH RISK LASA conflict detected. Tall-man lettering and dual verification required before dispensing.'
                : 'LASA conflict detected. Use tall-man lettering and verify with patient indication.',
              regulatoryReference: 'NMC India Pharmacy Practice Regulations 2015, ISMP Tall-Man Lettering List',
            }
          : null,
      },
    })
  } catch (error) {
    console.error('[LASA_GET]', error)
    return NextResponse.json({ error: 'Failed to check LASA matches' }, { status: 500 })
  }
}
