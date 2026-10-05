import { NextRequest, NextResponse } from 'next/server'

// Discharge Summary API — returns mock data for frontend consumption
// In production, this would query the database with Prisma

const mockSummaries = [
  {
    id: 'ds1',
    patientId: 'p1',
    patientName: 'Rajesh Kumar Sharma',
    admissionDate: '2026-09-28',
    dischargeDate: '2026-10-03',
    admittingDiagnosis: 'Acute Myocardial Infarction (STEMI)',
    dischargeDiagnosis: 'Acute Myocardial Infarction (STEMI) - Post Thrombolysis',
    chiefComplaints: ['Chest pain since 2 hours', 'Breathlessness', 'Sweating profusely'],
    investigationsSummary: 'ECG: ST elevation in V1-V4. Troponin I: 8.5 ng/mL (elevated). Echo: EF 45%, AWMA.',
    treatmentGiven: 'Thrombolysis with Tenecteplase. Antiplatelets (Aspirin + Clopidogrel). Statin (Atorvastatin 80mg).',
    conditionAtDischarge: 'IMPROVED',
    medications: [
      { id: 'm1', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: 'Lifelong' },
      { id: 'm2', name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', duration: '1 year' },
      { id: 'm3', name: 'Atorvastatin', dosage: '80mg', frequency: 'At bedtime', duration: 'Lifelong' },
    ],
    followUpInstructions: 'Cardiology OPD review in 7 days. Repeat Echo at 4-6 weeks.',
    dietAdvice: 'Low salt, low saturated fat diet.',
    activityRestrictions: 'No heavy lifting for 4 weeks. Gradual walking increase.',
    isSigned: true,
    isLocked: true,
    createdBy: 'Dr. Anil Mehta',
    createdAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'ds2',
    patientId: 'p2',
    patientName: 'Priya Nair',
    admissionDate: '2026-09-30',
    dischargeDate: '2026-10-02',
    admittingDiagnosis: 'Acute Pyelonephritis',
    dischargeDiagnosis: 'Acute Pyelonephritis - Resolved',
    chiefComplaints: ['High grade fever since 3 days', 'Left flank pain', 'Burning micturition'],
    investigationsSummary: 'Urine R/E: Pus cells 40-50/hpf. Urine culture: E. coli sensitive to Ciprofloxacin.',
    treatmentGiven: 'IV Ciprofloxacin 200mg BD for 48h. Tab Ciprofloxacin 500mg BD thereafter.',
    conditionAtDischarge: 'STABLE',
    medications: [
      { id: 'm6', name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '5 more days' },
    ],
    followUpInstructions: 'Urine routine & culture repeat at 2 weeks.',
    dietAdvice: 'Plenty of oral fluids (2-3 litres/day).',
    activityRestrictions: 'No restrictions. Resume normal activities.',
    isSigned: false,
    isLocked: false,
    createdBy: 'Dr. Sunita Reddy',
    createdAt: '2026-10-02T11:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')

  let summaries = [...mockSummaries]
  if (patientId) {
    summaries = summaries.filter(s => s.patientId === patientId)
  }

  return NextResponse.json({ summaries })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, admittingDiagnosis, dischargeDiagnosis, conditionAtDischarge } = body

    if (!patientId || !admittingDiagnosis) {
      return NextResponse.json({ error: 'Missing required fields: patientId, admittingDiagnosis' }, { status: 400 })
    }

    // In production, save to database with Prisma
    return NextResponse.json({
      success: true,
      summary: {
        id: `ds-${Date.now()}`,
        patientId,
        admittingDiagnosis,
        dischargeDiagnosis: dischargeDiagnosis || '',
        conditionAtDischarge: conditionAtDischarge || 'STABLE',
        isSigned: false,
        isLocked: false,
        createdAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
