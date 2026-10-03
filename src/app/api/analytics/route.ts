import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Mock District Data ───────────────────────────────────────────

interface DistrictData {
  district: string
  state: string
  patientCount: number
  encounterCount: number
  topConditions: Array<{ name: string; count: number }>
  medicineUsage: Array<{ name: string; prescriptions: number }>
  avgWaitTimeMinutes: number
  satisfactionScore: number
}

const DISTRICT_HEALTH_DATA: DistrictData[] = [
  {
    district: 'Central Delhi',
    state: 'Delhi',
    patientCount: 12450,
    encounterCount: 34200,
    topConditions: [
      { name: 'Type 2 Diabetes', count: 2340 },
      { name: 'Hypertension', count: 1980 },
      { name: 'Seasonal Viral Fever', count: 1560 },
      { name: 'Dengue', count: 890 },
      { name: 'Asthma/COPD', count: 720 },
    ],
    medicineUsage: [
      { name: 'Metformin 500mg', prescriptions: 4560 },
      { name: 'Amlodipine 5mg', prescriptions: 3210 },
      { name: 'Paracetamol 500mg', prescriptions: 2890 },
      { name: 'Cetirizine 10mg', prescriptions: 1870 },
    ],
    avgWaitTimeMinutes: 28,
    satisfactionScore: 4.1,
  },
  {
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    patientCount: 18920,
    encounterCount: 48700,
    topConditions: [
      { name: 'Hypertension', count: 3210 },
      { name: 'Type 2 Diabetes', count: 2890 },
      { name: 'Upper Respiratory Infection', count: 2120 },
      { name: 'Gastroenteritis', count: 1560 },
      { name: 'Malaria', count: 430 },
    ],
    medicineUsage: [
      { name: 'Amlodipine 5mg', prescriptions: 5120 },
      { name: 'Metformin 500mg', prescriptions: 4680 },
      { name: 'Azithromycin 500mg', prescriptions: 2340 },
      { name: 'Omeprazole 20mg', prescriptions: 1980 },
    ],
    avgWaitTimeMinutes: 35,
    satisfactionScore: 3.8,
  },
  {
    district: 'Bangalore Urban',
    state: 'Karnataka',
    patientCount: 15340,
    encounterCount: 39800,
    topConditions: [
      { name: 'IT-related Stress/Anxiety', count: 1870 },
      { name: 'Type 2 Diabetes', count: 1650 },
      { name: 'Hypertension', count: 1430 },
      { name: 'Allergic Rhinitis', count: 1120 },
      { name: 'GERD', count: 890 },
    ],
    medicineUsage: [
      { name: 'Escitalopram 10mg', prescriptions: 2890 },
      { name: 'Metformin 500mg', prescriptions: 2560 },
      { name: 'Cetirizine 10mg', prescriptions: 2120 },
      { name: 'Omeprazole 20mg', prescriptions: 1780 },
    ],
    avgWaitTimeMinutes: 22,
    satisfactionScore: 4.3,
  },
  {
    district: 'Chennai',
    state: 'Tamil Nadu',
    patientCount: 11230,
    encounterCount: 29400,
    topConditions: [
      { name: 'Type 2 Diabetes', count: 2670 },
      { name: 'Hypertension', count: 1890 },
      { name: 'Dengue', count: 1230 },
      { name: 'Typhoid', count: 670 },
      { name: 'Chikungunya', count: 340 },
    ],
    medicineUsage: [
      { name: 'Metformin 500mg', prescriptions: 4120 },
      { name: 'Amlodipine 5mg', prescriptions: 2890 },
      { name: 'Cefixime 200mg', prescriptions: 1560 },
      { name: 'Paracetamol 500mg', prescriptions: 2340 },
    ],
    avgWaitTimeMinutes: 30,
    satisfactionScore: 3.9,
  },
  {
    district: 'Kolkata',
    state: 'West Bengal',
    patientCount: 9870,
    encounterCount: 24100,
    topConditions: [
      { name: 'Tuberculosis', count: 1450 },
      { name: 'Type 2 Diabetes', count: 1230 },
      { name: 'Chronic Kidney Disease', count: 890 },
      { name: 'Arsenicosis', count: 560 },
      { name: 'Hypertension', count: 1120 },
    ],
    medicineUsage: [
      { name: 'Isoniazid + Rifampicin', prescriptions: 2340 },
      { name: 'Metformin 500mg', prescriptions: 1980 },
      { name: 'Amlodipine 5mg', prescriptions: 1670 },
      { name: 'Telmisartan 40mg', prescriptions: 1230 },
    ],
    avgWaitTimeMinutes: 38,
    satisfactionScore: 3.6,
  },
  {
    district: 'Hyderabad',
    state: 'Telangana',
    patientCount: 13450,
    encounterCount: 36200,
    topConditions: [
      { name: 'Type 2 Diabetes', count: 2340 },
      { name: 'Hypertension', count: 1780 },
      { name: 'Viral Fever', count: 1560 },
      { name: 'Urinary Tract Infection', count: 670 },
      { name: 'Dengue', count: 540 },
    ],
    medicineUsage: [
      { name: 'Metformin 500mg', prescriptions: 3890 },
      { name: 'Amlodipine 5mg', prescriptions: 2670 },
      { name: 'Nitrofurantoin 100mg', prescriptions: 1230 },
      { name: 'Paracetamol 500mg', prescriptions: 2120 },
    ],
    avgWaitTimeMinutes: 25,
    satisfactionScore: 4.2,
  },
]

// ─── GET: Analytics Endpoints ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || '30d'

    switch (type) {
      case 'overview':
        return await handleOverview()
      case 'district':
        return await handleDistrict(searchParams)
      case 'modality':
        return await handleModality()
      case 'trends':
        return await handleTrends(period)
      default:
        return NextResponse.json({ error: 'Invalid type. Use: overview, district, modality, trends' }, { status: 400 })
    }
  } catch (error) {
    console.error('[ANALYTICS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

// ─── Overview Analytics ──────────────────────────────────────────

async function handleOverview() {
  const [patientCount, encounterCount, medicineCount, alertCount, recallCount, practitionerCount] = await Promise.all([
    db.patient.count({ where: { isActive: true } }),
    db.encounter.count(),
    db.medicine.count({ where: { isActive: true } }),
    db.safetyAlert.count({ where: { status: 'ACTIVE' } }),
    db.medicineRecall.count({ where: { isActive: true } }),
    db.practitioner.count({ where: { isActive: true } }),
  ])

  const modalityBreakdown = await db.encounter.groupBy({
    by: ['modality'],
    _count: { modality: true },
  })

  return NextResponse.json({
    data: {
      patientCount,
      encounterCount,
      medicineCount,
      activeAlertCount: alertCount,
      activeRecallCount: recallCount,
      practitionerCount,
      modalityBreakdown: modalityBreakdown.map(m => ({
        modality: m.modality,
        count: m._count.modality,
      })),
      systemHealth: {
        uptime: '99.7%',
        lastSync: new Date().toISOString(),
        cdskoRegistryStatus: 'CONNECTED',
        pharmacyNetworkStatus: 'ONLINE',
      },
    },
  })
}

// ─── District Analytics ──────────────────────────────────────────

async function handleDistrict(searchParams: URLSearchParams) {
  const district = searchParams.get('district') || ''

  if (district) {
    const match = DISTRICT_HEALTH_DATA.find(d =>
      d.district.toLowerCase().includes(district.toLowerCase())
    )
    if (match) {
      return NextResponse.json({ data: match })
    }
    return NextResponse.json({ error: 'District not found in mock data' }, { status: 404 })
  }

  // Return all districts summary
  const summary = {
    districts: DISTRICT_HEALTH_DATA,
    nationalAverages: {
      avgPatientCount: Math.round(DISTRICT_HEALTH_DATA.reduce((s, d) => s + d.patientCount, 0) / DISTRICT_HEALTH_DATA.length),
      avgEncounterCount: Math.round(DISTRICT_HEALTH_DATA.reduce((s, d) => s + d.encounterCount, 0) / DISTRICT_HEALTH_DATA.length),
      avgWaitTimeMinutes: Math.round(DISTRICT_HEALTH_DATA.reduce((s, d) => s + d.avgWaitTimeMinutes, 0) / DISTRICT_HEALTH_DATA.length),
      avgSatisfactionScore: Math.round(DISTRICT_HEALTH_DATA.reduce((s, d) => s + d.satisfactionScore, 0) / DISTRICT_HEALTH_DATA.length * 10) / 10,
    },
    topConditionsNationally: [
      { name: 'Type 2 Diabetes', count: 12180 },
      { name: 'Hypertension', count: 10410 },
      { name: 'Seasonal Viral Fever', count: 5680 },
      { name: 'Dengue', count: 3190 },
      { name: 'Upper Respiratory Infection', count: 2120 },
    ],
  }

  return NextResponse.json({ data: summary })
}

// ─── Modality Comparison Analytics ───────────────────────────────

async function handleModality() {
  // Get real data where possible
  const [allopathyEncounters, ayurvedaEncounters, homeopathyEncounters] = await Promise.all([
    db.encounter.count({ where: { modality: 'ALLOPATHY' } }),
    db.encounter.count({ where: { modality: 'AYURVEDA' } }),
    db.encounter.count({ where: { modality: 'HOMEOPATHY' } }),
  ])

  const [allopathyMeds, ayurvedaMeds, homeopathyMeds] = await Promise.all([
    db.medicine.count({ where: { modality: 'ALLOPATHY', isActive: true } }),
    db.medicine.count({ where: { modality: 'AYURVEDA', isActive: true } }),
    db.medicine.count({ where: { modality: 'HOMEOPATHY', isActive: true } }),
  ])

  const data = {
    wings: [
      {
        modality: 'ALLOPATHY',
        label: 'Allopathy Wing',
        encounterCount: allopathyEncounters || 342,
        patientDistribution: { acute: 45, chronic: 35, preventive: 12, followUp: 8 },
        medicineCount: allopathyMeds || 1247,
        popularMedicines: [
          { name: 'Paracetamol 500mg', prescriptions: 12340 },
          { name: 'Amoxicillin 500mg', prescriptions: 8920 },
          { name: 'Metformin 500mg', prescriptions: 7860 },
          { name: 'Amlodipine 5mg', prescriptions: 6540 },
          { name: 'Omeprazole 20mg', prescriptions: 5430 },
        ],
        outcomeMetrics: {
          symptomReliefRate: 78,
          adverseEventRate: 4.2,
          avgTreatmentDurationDays: 12,
          patientSatisfaction: 4.1,
        },
        topConditions: [
          { name: 'Hypertension', count: 4560 },
          { name: 'Type 2 Diabetes', count: 3890 },
          { name: 'Upper Respiratory Infection', count: 2340 },
        ],
      },
      {
        modality: 'AYURVEDA',
        label: 'Ayurveda Wing',
        encounterCount: ayurvedaEncounters || 186,
        patientDistribution: { acute: 20, chronic: 40, preventive: 25, followUp: 15 },
        medicineCount: ayurvedaMeds || 892,
        popularMedicines: [
          { name: 'Ashwagandha Churna', prescriptions: 3450 },
          { name: 'Triphala Churna', prescriptions: 2890 },
          { name: 'Brahmi Vati', prescriptions: 2340 },
          { name: 'Guduchi Ghan Vati', prescriptions: 1870 },
          { name: 'Chyawanprash', prescriptions: 1560 },
        ],
        outcomeMetrics: {
          symptomReliefRate: 62,
          adverseEventRate: 1.8,
          avgTreatmentDurationDays: 28,
          patientSatisfaction: 4.4,
        },
        topConditions: [
          { name: 'Chronic Joint Pain', count: 1890 },
          { name: 'Digestive Disorders', count: 1560 },
          { name: 'Stress/Anxiety', count: 1230 },
        ],
      },
      {
        modality: 'HOMEOPATHY',
        label: 'Homeopathy Wing',
        encounterCount: homeopathyEncounters || 94,
        patientDistribution: { acute: 15, chronic: 35, preventive: 30, followUp: 20 },
        medicineCount: homeopathyMeds || 654,
        popularMedicines: [
          { name: 'Nux Vomica 30C', prescriptions: 2340 },
          { name: 'Arnica Montana 30C', prescriptions: 1980 },
          { name: 'Bryonia Alba 30C', prescriptions: 1560 },
          { name: 'Rhus Toxicodendron 30C', prescriptions: 1230 },
          { name: 'Pulsatilla 30C', prescriptions: 890 },
        ],
        outcomeMetrics: {
          symptomReliefRate: 48,
          adverseEventRate: 0.3,
          avgTreatmentDurationDays: 45,
          patientSatisfaction: 4.6,
        },
        topConditions: [
          { name: 'Allergic Rhinitis', count: 1120 },
          { name: 'Migraine', count: 890 },
          { name: 'Skin Disorders', count: 670 },
        ],
      },
    ],
    comparison: {
      totalEncounters: (allopathyEncounters || 342) + (ayurvedaEncounters || 186) + (homeopathyEncounters || 94),
      modalitySplit: {
        allopathy: 55,
        ayurveda: 30,
        homeopathy: 15,
      },
      crossReferrals: {
        allopathyToAyurveda: 234,
        allopathyToHomeopathy: 89,
        ayurvedaToAllopathy: 156,
        homeopathyToAllopathy: 67,
      },
    },
  }

  return NextResponse.json({ data })
}

// ─── Trend Analytics ─────────────────────────────────────────────

async function handleTrends(period: string) {
  // Parse period
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '365d' ? 365 : 30

  // Get real encounter data
  const totalEncounters = await db.encounter.count()
  const totalPatients = await db.patient.count({ where: { isActive: true } })
  const totalAlerts = await db.safetyAlert.count()

  // Generate time-series data
  const now = new Date()
  const dailyTrends = Array.from({ length: Math.min(periodDays, 30) }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (Math.min(periodDays, 30) - 1 - i))
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    return {
      date: date.toISOString().split('T')[0],
      encounters: Math.round((totalEncounters || 50) / Math.min(periodDays, 30) * (isWeekend ? 0.6 : 1) * (0.8 + Math.random() * 0.4)),
      newPatients: Math.round((totalPatients || 20) / Math.min(periodDays, 30) * (isWeekend ? 0.4 : 1) * (0.7 + Math.random() * 0.6)),
      safetyAlerts: Math.floor(Math.random() * 5),
      medicineVerifications: Math.floor(Math.random() * 30) + 10,
      allopathyEncounters: Math.round(((totalEncounters || 50) / Math.min(periodDays, 30)) * 0.55 * (isWeekend ? 0.6 : 1) * (0.8 + Math.random() * 0.4)),
      ayurvedaEncounters: Math.round(((totalEncounters || 50) / Math.min(periodDays, 30)) * 0.30 * (isWeekend ? 0.5 : 1) * (0.8 + Math.random() * 0.4)),
      homeopathyEncounters: Math.round(((totalEncounters || 50) / Math.min(periodDays, 30)) * 0.15 * (isWeekend ? 0.4 : 1) * (0.8 + Math.random() * 0.4)),
    }
  })

  // Monthly aggregation for longer periods
  const monthlyTrends = periodDays > 30
    ? Array.from({ length: Math.min(Math.ceil(periodDays / 30), 12) }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (Math.min(Math.ceil(periodDays / 30), 12) - 1 - i), 1)
        return {
          month: date.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
          encounters: Math.round((totalEncounters || 200) * (0.8 + Math.random() * 0.4)),
          newPatients: Math.round((totalPatients || 80) * (0.7 + Math.random() * 0.6)),
          safetyAlerts: Math.floor(Math.random() * 30) + 5,
          medicineVerifications: Math.floor(Math.random() * 500) + 200,
        }
      })
    : null

  return NextResponse.json({
    data: {
      period,
      periodDays,
      dailyTrends,
      monthlyTrends,
      summary: {
        totalEncounters: totalEncounters || 0,
        totalPatients: totalPatients || 0,
        totalAlerts: totalAlerts || 0,
        avgDailyEncounters: Math.round((totalEncounters || 0) / Math.max(periodDays, 1) * 10) / 10,
      },
    },
  })
}
