import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// SEED-V2: Comprehensive seed for ALL new models
// Idempotent — checks if data exists before creating
// ============================================================

// Helper: date offset from now
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function hoursFromNow(hours: number): Date {
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seedAll() {
  // Reset per-request state
  const SUMMARY: Record<string, number> = {}
  const LOGS: string[] = []

  function log(section: string, message: string) {
    const entry = `[${section}] ${message}`
    LOGS.push(entry)
    console.log(entry)
  }

  function addCount(section: string, count: number) {
    SUMMARY[section] = (SUMMARY[section] || 0) + count
  }

  // ── Fetch existing patients (to link data) ──
  const allPatients = await db.patient.findMany({
    orderBy: { createdAt: 'asc' },
  })

  // Build a map by firstName+lastName → most recent patient
  const patientMap = new Map<string, typeof allPatients[0]>()
  for (const p of allPatients) {
    const key = `${p.firstName} ${p.lastName}`
    if (!patientMap.has(key)) {
      patientMap.set(key, p)
    }
  }

  const rahul = patientMap.get('Rahul Kumar')
  const priya = patientMap.get('Priya Sharma')
  const anjali = patientMap.get('Anjali Joshi')
  const vikram = patientMap.get('Vikram Singh')
  const sunita = patientMap.get('Sunita Gupta')
  const amit = patientMap.get('Amit Patel')
  const meena = patientMap.get('Meena Nair')
  const suresh = patientMap.get('Suresh Reddy')

  log('BOOT', `Found ${allPatients.length} patients, ${patientMap.size} unique names`)
  log('BOOT', `Rahul=${!!rahul} Priya=${!!priya} Anjali=${!!anjali} Vikram=${!!vikram} Sunita=${!!sunita} Amit=${!!amit} Meena=${!!meena} Suresh=${!!suresh}`)

  // Get first tenant for practitioner creation
  const firstTenant = await db.tenant.findFirst()
  const tenantId = firstTenant?.id
  log('BOOT', `Tenant: ${tenantId || 'NONE'}`)

  // ════════════════════════════════════════════
  // 1. PRACTITIONERS (always ensure our specific ones exist)
  // ════════════════════════════════════════════
  try {
    const practitionerDefs = [
      { name: 'Dr. Arvind Kumar', specialization: 'Cardiologist', modality: 'ALLOPATHY', licenseNumber: 'MC-2019-4521' },
      { name: 'Dr. Sunita Sharma', specialization: 'General Medicine', modality: 'ALLOPATHY', licenseNumber: 'MC-2018-7834' },
      { name: 'Dr. Rajesh Patel', specialization: 'Kayachikitsa', modality: 'AYURVEDA', licenseNumber: 'AYU-2020-1123' },
      { name: 'Dr. Meera Iyer', specialization: 'Classical Homeopathy', modality: 'HOMEOPATHY', licenseNumber: 'HOM-2017-5678' },
      { name: 'Dr. Vikram Singh', specialization: 'Orthopedics', modality: 'ALLOPATHY', licenseNumber: 'MC-2016-3345' },
      { name: 'Dr. Priya Nair', specialization: 'Neurology', modality: 'ALLOPATHY', licenseNumber: 'MC-2021-9912' },
    ]

    for (const p of practitionerDefs) {
      const exists = await db.practitioner.findFirst({ where: { name: p.name } })
      if (!exists) {
        await db.practitioner.create({
          data: {
            ...(tenantId ? { tenantId } : {}),
            name: p.name,
            specialization: p.specialization,
            modality: p.modality,
            licenseNumber: p.licenseNumber,
            isActive: true,
          },
        })
        addCount('Practitioners', 1)
      }
    }
    log('Practitioners', `Created ${SUMMARY['Practitioners'] || 0} new practitioners (ensured 6 exist by name)`)
  } catch (e: any) {
    log('Practitioners', `Error: ${e.message}`)
  }

  // Fetch practitioners for linking
  const practitioners = await db.practitioner.findMany({ where: { name: { in: ['Dr. Arvind Kumar', 'Dr. Sunita Sharma', 'Dr. Rajesh Patel', 'Dr. Meera Iyer', 'Dr. Vikram Singh', 'Dr. Priya Nair'] } } })
  const drArvind = practitioners.find(p => p.name === 'Dr. Arvind Kumar')
  const drSunitaSharma = practitioners.find(p => p.name === 'Dr. Sunita Sharma')
  const drRajesh = practitioners.find(p => p.name === 'Dr. Rajesh Patel')
  const drMeera = practitioners.find(p => p.name === 'Dr. Meera Iyer')
  const drVikramSingh = practitioners.find(p => p.name === 'Dr. Vikram Singh')
  const drPriyaNair = practitioners.find(p => p.name === 'Dr. Priya Nair')
  log('Practitioners', `Linked: Arvind=${!!drArvind} Sunita=${!!drSunitaSharma} Rajesh=${!!drRajesh} Meera=${!!drMeera} Vikram=${!!drVikramSingh} Priya=${!!drPriyaNair}`)

  // ════════════════════════════════════════════
  // 2. PRESCRIPTIONS
  // ════════════════════════════════════════════
  try {
    const existingPrescriptions = await db.prescription.count()
    if (existingPrescriptions < 8) {
      const prescriptionDefs = [
        {
          prescriptionNo: 'RX-000001',
          patient: rahul,
          practitioner: drArvind,
          modality: 'ALLOPATHY',
          status: 'ACTIVE',
          diagnosis: 'Type 2 Diabetes Mellitus with Hypertension',
          items: [
            { medicineName: 'Metformin', dosage: '500mg', frequency: 'TWICE_DAILY', duration: 'Ongoing', route: 'ORAL', instructions: 'After food', scheduleType: 'SCHEDULE_H', sequence: 1 },
            { medicineName: 'Atorvastatin', dosage: '10mg', frequency: 'ONCE_DAILY', duration: 'Ongoing', route: 'ORAL', instructions: 'At bedtime', scheduleType: 'SCHEDULE_H', sequence: 2 },
            { medicineName: 'Amlodipine', dosage: '5mg', frequency: 'ONCE_DAILY', duration: 'Ongoing', route: 'ORAL', instructions: 'After food', scheduleType: 'SCHEDULE_H', sequence: 3 },
          ],
        },
        {
          prescriptionNo: 'RX-000002',
          patient: priya,
          practitioner: drRajesh,
          modality: 'AYURVEDA',
          status: 'ACTIVE',
          diagnosis: 'Generalized Anxiety Disorder (Vata Vikara)',
          items: [
            { medicineName: 'Ashwagandha', dosage: '500mg', frequency: 'TWICE_DAILY', duration: '3 months', route: 'ORAL', instructions: 'After food with warm milk', sequence: 1 },
            { medicineName: 'Triphala', dosage: '1gm', frequency: 'ONCE_DAILY', duration: 'Ongoing', route: 'ORAL', instructions: 'At bedtime with warm water', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000003',
          patient: anjali,
          practitioner: drMeera,
          modality: 'HOMEOPATHY',
          status: 'ACTIVE',
          diagnosis: 'Chronic Migraine with Menstrual Trigger',
          items: [
            { medicineName: 'Natrum Mur', dosage: '200C', frequency: 'ONCE_DAILY', duration: 'As per response', route: 'ORAL', instructions: 'Empty stomach, 30 min before food', sequence: 1 },
            { medicineName: 'Pulsatilla', dosage: '30C', frequency: 'ONCE_DAILY', duration: 'As per response', route: 'ORAL', instructions: 'Empty stomach, evening dose', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000004',
          patient: vikram,
          practitioner: drArvind,
          modality: 'ALLOPATHY',
          status: 'DISPENSED',
          diagnosis: 'Gastroesophageal Reflux Disease',
          items: [
            { medicineName: 'Omeprazole', dosage: '20mg', frequency: 'ONCE_DAILY', duration: '4 weeks', route: 'ORAL', instructions: 'Before breakfast', scheduleType: 'SCHEDULE_H', sequence: 1 },
            { medicineName: 'Pantoprazole', dosage: '40mg', frequency: 'ONCE_DAILY', duration: '4 weeks', route: 'ORAL', instructions: 'Before breakfast (alternate)', scheduleType: 'SCHEDULE_H', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000005',
          patient: sunita,
          practitioner: drRajesh,
          modality: 'AYURVEDA',
          status: 'DRAFT',
          diagnosis: 'Type 2 Diabetes (Prameha)',
          items: [
            { medicineName: 'Brahmi', dosage: '500mg', frequency: 'TWICE_DAILY', duration: '2 months', route: 'ORAL', instructions: 'After food', sequence: 1 },
            { medicineName: 'Guggulu', dosage: '250mg', frequency: 'THRICE_DAILY', duration: '2 months', route: 'ORAL', instructions: 'After food with warm water', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000006',
          patient: amit,
          practitioner: drMeera,
          modality: 'HOMEOPATHY',
          status: 'EXPIRED',
          diagnosis: 'Chronic Skin Eruption',
          validUntil: daysFromNow(-30),
          items: [
            { medicineName: 'Arsenicum Alb', dosage: '30C', frequency: 'ONCE_DAILY', duration: '7 days', route: 'ORAL', instructions: 'Empty stomach', sequence: 1 },
            { medicineName: 'Sulphur', dosage: '200C', frequency: 'AS_NEEDED', duration: 'Single dose weekly', route: 'ORAL', instructions: 'Empty stomach, Sunday morning', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000007',
          patient: meena,
          practitioner: drArvind,
          modality: 'ALLOPATHY',
          status: 'ACTIVE',
          diagnosis: 'Post-PCI Dual Antiplatelet Therapy',
          items: [
            { medicineName: 'Clopidogrel', dosage: '75mg', frequency: 'ONCE_DAILY', duration: '12 months', route: 'ORAL', instructions: 'After food', scheduleType: 'SCHEDULE_H', sequence: 1 },
            { medicineName: 'Aspirin', dosage: '75mg', frequency: 'ONCE_DAILY', duration: 'Lifelong', route: 'ORAL', instructions: 'After food', scheduleType: 'OTC', sequence: 2 },
          ],
        },
        {
          prescriptionNo: 'RX-000008',
          patient: suresh,
          practitioner: drRajesh,
          modality: 'AYURVEDA',
          status: 'ACTIVE',
          diagnosis: 'Immunity Deficiency (Ojas Kshaya)',
          items: [
            { medicineName: 'Guduchi', dosage: '500mg', frequency: 'TWICE_DAILY', duration: '3 months', route: 'ORAL', instructions: 'After food with warm water', sequence: 1 },
            { medicineName: 'Amalaki', dosage: '500mg', frequency: 'TWICE_DAILY', duration: '3 months', route: 'ORAL', instructions: 'After food', sequence: 2 },
          ],
        },
      ]

      for (const def of prescriptionDefs) {
        if (!def.patient) continue
        const exists = await db.prescription.findUnique({ where: { prescriptionNo: def.prescriptionNo } })
        if (!exists) {
          await db.prescription.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              prescriptionNo: def.prescriptionNo,
              modality: def.modality,
              status: def.status,
              diagnosis: def.diagnosis,
              validFrom: new Date(),
              validUntil: def.validUntil || daysFromNow(90),
              isCdScoCompliant: def.modality === 'ALLOPATHY',
              items: {
                create: def.items.map(item => ({
                  medicineName: item.medicineName,
                  dosage: item.dosage,
                  frequency: item.frequency,
                  duration: item.duration,
                  route: item.route,
                  instructions: item.instructions,
                  scheduleType: (item as any).scheduleType,
                  sequence: item.sequence,
                })),
              },
            },
          })
          addCount('Prescriptions', 1)
        }
      }
      log('Prescriptions', `Created ${SUMMARY['Prescriptions'] || 0} new prescriptions`)
    } else {
      log('Prescriptions', `Skipped — ${existingPrescriptions} already exist`)
    }
  } catch (e: any) {
    log('Prescriptions', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 3. LAB ORDERS
  // ════════════════════════════════════════════
  try {
    const existingLabOrders = await db.labOrder.count()
    if (existingLabOrders < 6) {
      const labOrderDefs = [
        {
          orderNumber: 'LBO-000001', patient: rahul, practitioner: drArvind,
          status: 'COMPLETED', priority: 'URGENT',
          tests: [
            { testName: 'Complete Blood Count', testCode: '58410-2', category: 'HEMATOLOGY', status: 'COMPLETED', resultValue: '13.2', resultUnit: 'g/dL', referenceRange: '12.0-16.0', isAbnormal: false, remarks: 'Within normal limits', completedAt: daysFromNow(-2) },
            { testName: 'HbA1c', testCode: '4548-4', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '8.2', resultUnit: '%', referenceRange: '<6.5', isAbnormal: true, remarks: 'Poor glycemic control', completedAt: daysFromNow(-2) },
            { testName: 'Lipid Profile - Total Cholesterol', testCode: '2093-3', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '248', resultUnit: 'mg/dL', referenceRange: '<200', isAbnormal: true, remarks: 'Hyperlipidemia', completedAt: daysFromNow(-2) },
            { testName: 'Lipid Profile - LDL', testCode: '13457-7', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '168', resultUnit: 'mg/dL', referenceRange: '<100', isAbnormal: true, remarks: 'Elevated LDL', completedAt: daysFromNow(-2) },
            { testName: 'Lipid Profile - HDL', testCode: '14646-3', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '38', resultUnit: 'mg/dL', referenceRange: '>40', isAbnormal: true, remarks: 'Low HDL', completedAt: daysFromNow(-2) },
          ],
        },
        {
          orderNumber: 'LBO-000002', patient: priya, practitioner: drSunitaSharma,
          status: 'COMPLETED', priority: 'ROUTINE',
          tests: [
            { testName: 'TSH', testCode: '3016-3', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '2.4', resultUnit: 'mIU/L', referenceRange: '0.4-4.0', isAbnormal: false, completedAt: daysFromNow(-5) },
            { testName: 'T4 Free', testCode: '3024-0', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '1.2', resultUnit: 'ng/dL', referenceRange: '0.8-1.8', isAbnormal: false, completedAt: daysFromNow(-5) },
            { testName: 'SGOT/AST', testCode: 'AST', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '22', resultUnit: 'U/L', referenceRange: '10-40', isAbnormal: false, completedAt: daysFromNow(-5) },
            { testName: 'SGPT/ALT', testCode: 'ALT', category: 'BIOCHEMISTRY', status: 'COMPLETED', resultValue: '28', resultUnit: 'U/L', referenceRange: '7-56', isAbnormal: false, completedAt: daysFromNow(-5) },
          ],
        },
        {
          orderNumber: 'LBO-000003', patient: vikram, practitioner: drVikramSingh,
          status: 'PROCESSING', priority: 'ROUTINE',
          sampleCollectedAt: daysFromNow(-1),
          tests: [
            { testName: 'Complete Blood Count', testCode: '58410-2', category: 'HEMATOLOGY', status: 'PROCESSING' },
            { testName: 'KFT - Creatinine', testCode: '2160-0', category: 'BIOCHEMISTRY', status: 'PROCESSING' },
            { testName: 'KFT - BUN', testCode: '3094-0', category: 'BIOCHEMISTRY', status: 'ORDERED' },
            { testName: 'CRP Quantitative', testCode: '1988-5', category: 'BIOCHEMISTRY', status: 'ORDERED' },
          ],
        },
        {
          orderNumber: 'LBO-000004', patient: anjali, practitioner: drMeera,
          status: 'ORDERED', priority: 'ROUTINE',
          tests: [
            { testName: 'Urinalysis - Routine', testCode: '24356-8', category: 'PATHOLOGY', status: 'ORDERED' },
            { testName: 'Random Blood Glucose', testCode: '2345-7', category: 'BIOCHEMISTRY', status: 'ORDERED' },
          ],
        },
        {
          orderNumber: 'LBO-000005', patient: sunita, practitioner: drRajesh,
          status: 'SAMPLE_COLLECTED', priority: 'ROUTINE',
          sampleCollectedAt: daysFromNow(0),
          tests: [
            { testName: 'Lipid Profile', testCode: 'LP', category: 'BIOCHEMISTRY', status: 'ORDERED' },
            { testName: 'HbA1c', testCode: '4548-4', category: 'BIOCHEMISTRY', status: 'ORDERED' },
          ],
        },
        {
          orderNumber: 'LBO-000006', patient: amit, practitioner: drSunitaSharma,
          status: 'COMPLETED', priority: 'ROUTINE',
          tests: [
            { testName: 'Complete Blood Count', testCode: '58410-2', category: 'HEMATOLOGY', status: 'COMPLETED', resultValue: '14.1', resultUnit: 'g/dL', referenceRange: '12.0-16.0', isAbnormal: false, completedAt: daysFromNow(-3) },
            { testName: 'ESR', testCode: '4537-7', category: 'HEMATOLOGY', status: 'COMPLETED', resultValue: '48', resultUnit: 'mm/hr', referenceRange: '0-20', isAbnormal: true, remarks: 'Elevated ESR — possible inflammatory process', completedAt: daysFromNow(-3) },
          ],
        },
      ]

      for (const def of labOrderDefs) {
        if (!def.patient) continue
        const exists = await db.labOrder.findUnique({ where: { orderNumber: def.orderNumber } })
        if (!exists) {
          await db.labOrder.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              orderNumber: def.orderNumber,
              status: def.status,
              priority: def.priority,
              sampleCollectedAt: (def as any).sampleCollectedAt,
              completedAt: def.status === 'COMPLETED' ? daysFromNow(-1) : undefined,
              tests: {
                create: def.tests.map(t => ({
                  testName: t.testName,
                  testCode: t.testCode,
                  category: t.category,
                  status: t.status,
                  resultValue: t.resultValue,
                  resultUnit: t.resultUnit,
                  referenceRange: t.referenceRange,
                  isAbnormal: t.isAbnormal || false,
                  remarks: t.remarks,
                  completedAt: t.completedAt,
                })),
              },
            },
          })
          addCount('LabOrders', 1)
        }
      }
      log('LabOrders', `Created ${SUMMARY['LabOrders'] || 0} new lab orders`)
    } else {
      log('LabOrders', `Skipped — ${existingLabOrders} already exist`)
    }
  } catch (e: any) {
    log('LabOrders', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 4. APPOINTMENTS
  // ════════════════════════════════════════════
  try {
    const existingAppointments = await db.appointment.count()
    if (existingAppointments < 10) {
      const appointmentDefs = [
        { appointmentNo: 'APT-000001', patient: rahul, practitioner: drArvind, type: 'CONSULTATION', modality: 'ALLOPATHY', status: 'COMPLETED', scheduledAt: daysFromNow(-3), duration: 30, reason: 'Hypertension follow-up' },
        { appointmentNo: 'APT-000002', patient: priya, practitioner: drRajesh, type: 'FOLLOW_UP', modality: 'AYURVEDA', status: 'CONFIRMED', scheduledAt: daysFromNow(1), duration: 20, reason: 'Anxiety management review' },
        { appointmentNo: 'APT-000003', patient: anjali, practitioner: drMeera, type: 'CONSULTATION', modality: 'HOMEOPATHY', status: 'SCHEDULED', scheduledAt: daysFromNow(3), duration: 45, reason: 'Migraine assessment' },
        { appointmentNo: 'APT-000004', patient: vikram, practitioner: drVikramSingh, type: 'FOLLOW_UP', modality: 'ALLOPATHY', status: 'SCHEDULED', scheduledAt: daysFromNow(5), duration: 15, reason: 'Post-surgical knee review' },
        { appointmentNo: 'APT-000005', patient: sunita, practitioner: drArvind, type: 'CONSULTATION', modality: 'ALLOPATHY', status: 'CONFIRMED', scheduledAt: daysFromNow(2), duration: 30, reason: 'Diabetes control review' },
        { appointmentNo: 'APT-000006', patient: amit, practitioner: drRajesh, type: 'TELEMEDICINE', modality: 'AYURVEDA', status: 'SCHEDULED', scheduledAt: daysFromNow(4), duration: 20, reason: 'Chronic pain tele-consult' },
        { appointmentNo: 'APT-000007', patient: meena, practitioner: drArvind, type: 'CONSULTATION', modality: 'ALLOPATHY', status: 'CANCELLED', scheduledAt: daysFromNow(6), duration: 30, reason: 'Post-PCI follow-up', cancelledReason: 'Patient travelling' },
        { appointmentNo: 'APT-000008', patient: suresh, practitioner: drRajesh, type: 'FOLLOW_UP', modality: 'AYURVEDA', status: 'SCHEDULED', scheduledAt: daysFromNow(7), duration: 20, reason: 'Immunity booster follow-up' },
        { appointmentNo: 'APT-000009', patient: rahul, practitioner: drPriyaNair, type: 'CONSULTATION', modality: 'ALLOPATHY', status: 'SCHEDULED', scheduledAt: daysFromNow(10), duration: 60, reason: 'Comprehensive cardiac evaluation', isUrgent: true },
        { appointmentNo: 'APT-000010', patient: priya, practitioner: drSunitaSharma, type: 'TELEMEDICINE', modality: 'ALLOPATHY', status: 'SCHEDULED', scheduledAt: daysFromNow(14), duration: 15, reason: 'Tele-consult for medication refill' },
      ]

      for (const def of appointmentDefs) {
        if (!def.patient) continue
        const exists = await db.appointment.findUnique({ where: { appointmentNo: def.appointmentNo } })
        if (!exists) {
          await db.appointment.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              appointmentNo: def.appointmentNo,
              type: def.type,
              modality: def.modality,
              status: def.status,
              scheduledAt: def.scheduledAt,
              duration: def.duration,
              reason: def.reason,
              isUrgent: (def as any).isUrgent || false,
              cancelledReason: (def as any).cancelledReason,
            },
          })
          addCount('Appointments', 1)
        }
      }
      log('Appointments', `Created ${SUMMARY['Appointments'] || 0} new appointments`)
    } else {
      log('Appointments', `Skipped — ${existingAppointments} already exist`)
    }
  } catch (e: any) {
    log('Appointments', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 5. CLINICAL NOTES
  // ════════════════════════════════════════════
  try {
    const existingNotes = await db.clinicalNote.count()
    if (existingNotes < 6) {
      const noteDefs = [
        {
          patient: rahul, practitioner: drArvind, noteType: 'SOAP', modality: 'ALLOPATHY',
          subjective: 'Patient reports occasional headache and dizziness for past 2 weeks. Compliance with medications improved. No chest pain or palpitations.',
          objective: 'BP 148/92 mmHg. Pulse 78/min regular. No peripheral edema. Heart sounds S1S2 normal. Fundoscopy: AV nicking present.',
          assessment: 'Essential hypertension — suboptimal control. Need to uptitrate Amlodipine to 10mg. HbA1c 8.2% indicates poor diabetic control.',
          plan: '1. Amlodipine 5mg → 10mg OD. 2. Add Telmisartan 40mg OD. 3. Repeat BP in 2 weeks. 4. Diabetic diet counseling. 5. Follow-up in 14 days.',
        },
        {
          patient: priya, practitioner: drRajesh, noteType: 'SOAP', modality: 'AYURVEDA',
          subjective: 'Patient reports persistent anxiety, restlessness, and disturbed sleep. Worsening before menses. Appetite reduced.',
          objective: 'Vata-pitta prakriti. Pulse: vata-predominant, 88/min. Tongue: slightly coated. No tremors. Weight stable at 58kg.',
          assessment: 'Vata-vikara with pitta-anubandha — Chittodvega (anxiety disorder). Nidana: stress, irregular diet, delayed sleep. Samprapti: vata vitiates manovaha srotas.',
          plan: '1. Ashwagandha 500mg BD after food. 2. Brahmi Ghrita 10ml HS. 3. Shirodhara weekly x 6 sessions. 4. Dashamoolarishta 15ml BD. 5. Lifestyle: regular dinacharya, abhyanga with Brahmi oil. 6. Review in 3 weeks.',
        },
        {
          patient: anjali, practitioner: drMeera, noteType: 'SOAP', modality: 'HOMEOPATHY',
          subjective: 'Recurring left-sided migraine since 5 years. Throbbing pain with nausea and photophobia. Worsens pre-menstrually. Triggers: bright light, missed meals. Awakens from sleep.',
          objective: 'No neurological deficits on exam. BP 118/76. Mild cervical muscle tension. TMJ tenderness left side.',
          assessment: 'Chronic migraine with menstrual trigger — Natrum Mur constitution. Sycotic miasm. Suppressed grief history.',
          plan: '1. Natrum Mur 200C — morning dose, empty stomach. 2. Pulsatilla 30C — evening during menses. 3. Iris Versicolor 30C as intercurrent if needed. 4. Avoid coffee, strong smells. 5. Maintain headache diary. 6. Follow-up in 4 weeks.',
        },
        {
          patient: vikram, practitioner: drVikramSingh, noteType: 'PROGRESS', modality: 'ALLOPATHY',
          subjective: 'Post-operative day 5 following right total knee replacement. Pain well-controlled. Physiotherapy progressing. Able to bear partial weight.',
          objective: 'Wound: clean, dry, no erythema. ROM: 10°-85° flexion. Quad strength: 3+/5. No DVT signs. Crutches — partial weight-bearing.',
          assessment: 'Post-op day 5 — satisfactory progress. No complications. Continue rehabilitation.',
          plan: '1. Continue physiotherapy daily. 2. Tab. Tramadol 50mg BD PRN for pain. 3. Suture removal on day 12. 4. Follow-up at 2 weeks. 5. Target ROM 0°-110° by 6 weeks.',
        },
        {
          patient: sunita, practitioner: drArvind, noteType: 'SOAP', modality: 'ALLOPATHY',
          subjective: 'Known T2DM x 8 years. Reports increased thirst and polyuria. Fasting sugars 180-220 mg/dL at home. Occasional hypoglycemia with current regimen.',
          objective: 'BMI 29.4. BP 132/84. Fasting glucose 196 mg/dL. No diabetic complications on fundoscopy. Feet: intact sensation, no ulcers.',
          assessment: 'Type 2 Diabetes — uncontrolled on current regimen. Needs treatment intensification. Evaluate for insulin initiation.',
          plan: '1. Metformin 1gm BD. 2. Add Sitagliptin 100mg OD. 3. If not controlled in 4 weeks — consider basal insulin. 4. HbA1c, KFT, urine albumin in 4 weeks. 5. Diet: 1500 kcal, low GI. 6. Diabetic education revisit.',
        },
        {
          patient: amit, practitioner: drRajesh, noteType: 'SOAP', modality: 'AYURVEDA',
          subjective: 'Chronic lower back pain x 3 years. Stiffness in morning, improves with movement. Pain radiates to left leg occasionally. Vata-aggravating lifestyle (excessive travel, cold exposure).',
          objective: 'SLR test positive left side at 60°. L4-L5 tenderness. Vata-predominant prakriti. Pulse: vata, 72/min. X-ray: mild disc degeneration L4-L5.',
          assessment: 'Katishoola (low back pain) — Vata vyadhi with Kapha-kshata (disc degeneration). Avarana by kapha. Gridhrasi (sciatica) component.',
          plan: '1. Guggulu 250mg TDS after food. 2. Rasnaerandadi Kashaya 15ml BD. 3. Kati Basti daily x 7 days, then weekly. 4. Basti (Matra) with Sahacharadi Taila. 5. Avoid cold, heavy lifting. 6. Gentle yoga — Pawanmuktasana series. 7. Review in 3 weeks.',
        },
      ]

      for (const def of noteDefs) {
        if (!def.patient) continue
        // Use a unique combination to avoid duplicates
        const existing = await db.clinicalNote.findFirst({
          where: {
            patientId: def.patient.id,
            noteType: def.noteType,
            modality: def.modality,
          },
        })
        if (!existing) {
          await db.clinicalNote.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              noteType: def.noteType,
              modality: def.modality,
              subjective: def.subjective,
              objective: def.objective,
              assessment: def.assessment,
              plan: def.plan,
            },
          })
          addCount('ClinicalNotes', 1)
        }
      }
      log('ClinicalNotes', `Created ${SUMMARY['ClinicalNotes'] || 0} new clinical notes`)
    } else {
      log('ClinicalNotes', `Skipped — ${existingNotes} already exist`)
    }
  } catch (e: any) {
    log('ClinicalNotes', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 6. INSURANCE POLICIES + CLAIMS
  // ════════════════════════════════════════════
  try {
    const existingPolicies = await db.insurancePolicy.count()
    if (existingPolicies < 4) {
      const policyDefs = [
        { patient: rahul, providerName: 'Star Health', policyNumber: 'SH-2024-78432', planType: 'INDIVIDUAL', coverageType: 'CASHLESS', isAyushmanBharat: false, maxCoverage: 500000, coPayPercentage: 10 },
        { patient: priya, providerName: 'ICICI Lombard', policyNumber: 'IL-2024-11290', groupNumber: 'GRP-FAMILY-003', planType: 'FAMILY', coverageType: 'REIMBURSEMENT', isAyushmanBharat: false, maxCoverage: 800000, coPayPercentage: 20 },
        { patient: vikram, providerName: 'HDFC ERGO', policyNumber: 'HE-PMJAY-2024-001', planType: 'INDIVIDUAL', coverageType: 'CASHLESS', isAyushmanBharat: true, maxCoverage: 500000, coPayPercentage: 0 },
        { patient: sunita, providerName: 'New India Assurance', policyNumber: 'NIA-2024-67521', groupNumber: 'GRP-CORP-012', planType: 'GROUP', coverageType: 'CASHLESS', isAyushmanBharat: false, maxCoverage: 300000, coPayPercentage: 15 },
      ]

      const createdPolicies: { id: string; patientId: string; patient: typeof rahul }[] = []

      for (const def of policyDefs) {
        if (!def.patient) continue
        const exists = await db.insurancePolicy.findFirst({ where: { policyNumber: def.policyNumber } })
        if (!exists) {
          const policy = await db.insurancePolicy.create({
            data: {
              patientId: def.patient.id,
              providerName: def.providerName,
              policyNumber: def.policyNumber,
              groupNumber: def.groupNumber,
              planType: def.planType,
              coverageType: def.coverageType,
              isAyushmanBharat: def.isAyushmanBharat,
              maxCoverage: def.maxCoverage,
              coPayPercentage: def.coPayPercentage,
              validFrom: daysFromNow(-180),
              validUntil: daysFromNow(185),
              isActive: true,
            },
          })
          createdPolicies.push({ id: policy.id, patientId: def.patient.id, patient: def.patient })
          addCount('InsurancePolicies', 1)
        }
      }
      log('InsurancePolicies', `Created ${SUMMARY['InsurancePolicies'] || 0} new policies`)

      // Claims
      const existingClaims = await db.insuranceClaim.count()
      if (existingClaims < 3 && createdPolicies.length >= 3) {
        const claimDefs = [
          { claimNumber: 'CLM-000001', policyIdx: 0, patientId: rahul?.id, claimType: 'CASHLESS', status: 'APPROVED', amountClaimed: 45000, amountApproved: 40500, amountSettled: 40500, settledAt: daysFromNow(-5) },
          { claimNumber: 'CLM-000002', policyIdx: 1, patientId: priya?.id, claimType: 'REIMBURSEMENT', status: 'UNDER_REVIEW', amountClaimed: 12000, processedAt: daysFromNow(-2) },
          { claimNumber: 'CLM-000003', policyIdx: 2, patientId: vikram?.id, claimType: 'CASHLESS', status: 'REJECTED', amountClaimed: 85000, denialReason: 'Pre-existing condition not covered in waiting period' },
        ]

        for (const def of claimDefs) {
          if (!def.patientId) continue
          const exists = await db.insuranceClaim.findUnique({ where: { claimNumber: def.claimNumber } })
          if (!exists) {
            await db.insuranceClaim.create({
              data: {
                policyId: createdPolicies[def.policyIdx]?.id || createdPolicies[0]?.id,
                patientId: def.patientId,
                claimNumber: def.claimNumber,
                claimType: def.claimType,
                status: def.status,
                amountClaimed: def.amountClaimed,
                amountApproved: (def as any).amountApproved,
                amountSettled: (def as any).amountSettled,
                denialReason: (def as any).denialReason,
                submittedAt: daysFromNow(-7),
                processedAt: (def as any).processedAt,
                settledAt: (def as any).settledAt,
              },
            })
            addCount('InsuranceClaims', 1)
          }
        }
        log('InsuranceClaims', `Created ${SUMMARY['InsuranceClaims'] || 0} new claims`)
      } else {
        log('InsuranceClaims', `Skipped — ${existingClaims} already exist or no policies`)
      }
    } else {
      log('InsurancePolicies', `Skipped — ${existingPolicies} already exist`)
    }
  } catch (e: any) {
    log('InsuranceClaims', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 7. BILLING RECORDS
  // ════════════════════════════════════════════
  try {
    const existingBilling = await db.billingRecord.count()
    if (existingBilling < 5) {
      const billingDefs = [
        { invoiceNumber: 'INV-000001', patient: rahul, modality: 'ALLOPATHY', status: 'PAID', consultationFee: 800, medicineCharges: 650, labCharges: 1200, totalAmount: 2650, discount: 0, tax: 146, netAmount: 2796, paidAmount: 2796, paymentMethod: 'UPI', paymentRef: 'UPI-RAZOR-88421', paidAt: daysFromNow(-2), dueDate: daysFromNow(15) },
        { invoiceNumber: 'INV-000002', patient: priya, modality: 'AYURVEDA', status: 'PENDING', consultationFee: 600, medicineCharges: 450, totalAmount: 1050, discount: 50, tax: 55, netAmount: 1055, paidAmount: 0, dueDate: daysFromNow(15) },
        { invoiceNumber: 'INV-000003', patient: vikram, modality: 'ALLOPATHY', status: 'PAID', consultationFee: 1500, medicineCharges: 3200, labCharges: 2800, procedureCharges: 150000, totalAmount: 157500, discount: 10000, tax: 8163, netAmount: 155663, paidAmount: 155663, paymentMethod: 'INSURANCE', paidAt: daysFromNow(-5), dueDate: daysFromNow(0) },
        { invoiceNumber: 'INV-000004', patient: sunita, modality: 'ALLOPATHY', status: 'OVERDUE', consultationFee: 700, labCharges: 900, totalAmount: 1600, tax: 88, netAmount: 1688, paidAmount: 0, dueDate: daysFromNow(-7) },
        { invoiceNumber: 'INV-000005', patient: anjali, modality: 'HOMEOPATHY', status: 'PAID', consultationFee: 500, medicineCharges: 300, totalAmount: 800, tax: 44, netAmount: 844, paidAmount: 844, paymentMethod: 'CASH', paidAt: daysFromNow(-1), dueDate: daysFromNow(15) },
      ]

      for (const def of billingDefs) {
        if (!def.patient) continue
        const exists = await db.billingRecord.findUnique({ where: { invoiceNumber: def.invoiceNumber } })
        if (!exists) {
          await db.billingRecord.create({
            data: {
              patientId: def.patient.id,
              invoiceNumber: def.invoiceNumber,
              modality: def.modality,
              status: def.status,
              consultationFee: def.consultationFee,
              medicineCharges: def.medicineCharges || 0,
              labCharges: def.labCharges || 0,
              procedureCharges: def.procedureCharges || 0,
              otherCharges: 0,
              totalAmount: def.totalAmount,
              discount: def.discount || 0,
              tax: def.tax || 0,
              netAmount: def.netAmount,
              paidAmount: def.paidAmount,
              paymentMethod: def.paymentMethod,
              paymentRef: (def as any).paymentRef,
              dueDate: def.dueDate,
              paidAt: (def as any).paidAt,
            },
          })
          addCount('BillingRecords', 1)
        }
      }
      log('BillingRecords', `Created ${SUMMARY['BillingRecords'] || 0} new billing records`)
    } else {
      log('BillingRecords', `Skipped — ${existingBilling} already exist`)
    }
  } catch (e: any) {
    log('BillingRecords', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 8. DISCHARGE SUMMARIES
  // ════════════════════════════════════════════
  try {
    const existingDischarge = await db.dischargeSummary.count()
    if (existingDischarge < 2) {
      const dischargeDefs = [
        {
          patient: rahul, practitioner: drArvind, summaryNumber: 'DS-000001', modality: 'ALLOPATHY',
          admissionDate: daysFromNow(-5), dischargeDate: daysFromNow(-1),
          admittingDiagnosis: 'NSTEMI (Non-ST Elevation Myocardial Infarction)',
          dischargeDiagnosis: 'NSTEMI — Post PCI to LAD. Hypertension. Type 2 Diabetes Mellitus.',
          chiefComplaints: JSON.stringify(['Chest pain for 2 hours', 'Sweating', 'Breathlessness']),
          investigations: JSON.stringify(['Troponin I: 2.8 ng/mL (↑)', 'ECG: ST depression V3-V6', 'Echo: EF 45%, RWMA in LAD territory', 'Coronary Angiography: 90% proximal LAD']),
          treatmentGiven: 'Antiplatelet loading (Aspirin 325mg + Clopidogrel 600mg). PCI with DES to proximal LAD. Heparin infusion 24h. Statins, ACE inhibitors, beta-blockers initiated.',
          conditionAtDischarge: 'STABLE',
          medicationsOnDischarge: JSON.stringify(['Aspirin 75mg OD', 'Clopidogrel 75mg OD', 'Atorvastatin 80mg HS', 'Metoprolol 25mg BD', 'Ramipril 2.5mg OD', 'Metformin 500mg BD']),
          followUpInstructions: 'Cardiology follow-up in 7 days. Cardiac rehab enrollment. Dual antiplatelet therapy for 12 months. Repeat lipid profile in 6 weeks.',
          dietAdvice: 'Low salt, low fat, diabetic diet. Avoid fried foods. Plenty of fruits and vegetables.',
          restrictions: 'No heavy lifting >5kg for 4 weeks. No driving for 1 week. Gradual increase in activity.',
        },
        {
          patient: vikram, practitioner: drVikramSingh, summaryNumber: 'DS-000002', modality: 'ALLOPATHY',
          admissionDate: daysFromNow(-7), dischargeDate: daysFromNow(-2),
          admittingDiagnosis: 'Osteoarthritis Right Knee — Total Knee Replacement',
          dischargeDiagnosis: 'Post-operative Right Total Knee Replacement. Osteoarthritis knee grade IV.',
          chiefComplaints: JSON.stringify(['Right knee pain 5 years', 'Difficulty walking', 'Night pain']),
          investigations: JSON.stringify(['X-ray: Grade IV OA changes right knee', 'Pre-op: Hb 13.2, Cr 0.9, ECG normal', 'Post-op X-ray: TKR well-placed']),
          treatmentGiven: 'Right total knee replacement under spinal anesthesia. Cemented cruciate-retaining prosthesis. Post-op: IV antibiotics 48h, analgesics, DVT prophylaxis. Physiotherapy from day 1.',
          conditionAtDischarge: 'IMPROVED',
          medicationsOnDischarge: JSON.stringify(['Tramadol 50mg BD PRN', 'Paracetamol 650mg TDS', 'Rivaroxaban 10mg OD x 14 days', 'Calcium + Vitamin D supplementation']),
          followUpInstructions: 'Suture removal day 12. Orthopedic follow-up at 2 weeks. Continue physiotherapy. Target flexion 110° by 6 weeks.',
          dietAdvice: 'High protein diet for wound healing. Calcium-rich foods. Adequate hydration.',
          restrictions: 'Partial weight-bearing with walker x 4 weeks. No squatting/cross-legged sitting for 6 weeks. Avoid falls.',
        },
      ]

      for (const def of dischargeDefs) {
        if (!def.patient) continue
        const exists = await db.dischargeSummary.findUnique({ where: { summaryNumber: def.summaryNumber } })
        if (!exists) {
          await db.dischargeSummary.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              summaryNumber: def.summaryNumber,
              modality: def.modality,
              admissionDate: def.admissionDate,
              dischargeDate: def.dischargeDate,
              admittingDiagnosis: def.admittingDiagnosis,
              dischargeDiagnosis: def.dischargeDiagnosis,
              chiefComplaints: def.chiefComplaints,
              investigations: def.investigations,
              treatmentGiven: def.treatmentGiven,
              conditionAtDischarge: def.conditionAtDischarge,
              medicationsOnDischarge: def.medicationsOnDischarge,
              followUpInstructions: def.followUpInstructions,
              dietAdvice: def.dietAdvice,
              restrictions: def.restrictions,
            },
          })
          addCount('DischargeSummaries', 1)
        }
      }
      log('DischargeSummaries', `Created ${SUMMARY['DischargeSummaries'] || 0} new discharge summaries`)
    } else {
      log('DischargeSummaries', `Skipped — ${existingDischarge} already exist`)
    }
  } catch (e: any) {
    log('DischargeSummaries', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 9. REFERRALS
  // ════════════════════════════════════════════
  try {
    const existingReferrals = await db.referral.count()
    if (existingReferrals < 3) {
      const referralDefs = [
        {
          patient: rahul, fromPractitioner: drArvind, toPractitioner: drRajesh,
          referralNumber: 'REF-000001', modality: 'ALLOPATHY', targetModality: 'AYURVEDA',
          reason: 'Cardiac rehabilitation — Ayurvedic supportive care for post-PCI recovery. Patient interested in integrative approach for lifestyle modification.',
          clinicalSummary: 'Post NSTEMI, PCI to LAD on dual antiplatelet therapy. EF 45%. Hypertension and T2DM comorbid. Needs cardiac rehab and stress management.',
          urgency: 'ROUTINE', status: 'PENDING', referredSpeciality: 'Kayachikitsa',
        },
        {
          patient: priya, fromPractitioner: drSunitaSharma, toPractitioner: drMeera,
          referralNumber: 'REF-000002', modality: 'ALLOPATHY', targetModality: 'HOMEOPATHY',
          reason: 'Chronic migraine — patient not responding adequately to conventional prophylaxis. Homeopathic consultation for constitutional treatment.',
          clinicalSummary: 'Chronic migraine x 5 years. Failed Topiramate and Propranolol prophylaxis. Currently on Rizatriptan PRN. 8-10 attacks/month. Menstrual trigger.',
          urgency: 'ROUTINE', status: 'ACCEPTED', referredSpeciality: 'Classical Homeopathy',
          respondedAt: daysFromNow(-1),
        },
        {
          patient: sunita, fromPractitioner: drRajesh, toPractitioner: drArvind,
          referralNumber: 'REF-000003', modality: 'AYURVEDA', targetModality: 'ALLOPATHY',
          reason: 'Uncontrolled Type 2 Diabetes despite Ayurvedic management. Fasting sugars consistently >180. Needs allopathic treatment intensification and evaluation for insulin therapy.',
          clinicalSummary: 'T2DM x 8 years. Managed with Ayurvedic formulations (Guggulu, Brahmi) for past 2 years. HbA1c 9.1%. Fasting glucose 196 mg/dL. No diabetic complications yet.',
          urgency: 'URGENT', status: 'COMPLETED', referredSpeciality: 'Diabetology',
          respondedAt: daysFromNow(-3), completedAt: daysFromNow(-1),
        },
      ]

      for (const def of referralDefs) {
        if (!def.patient || !def.fromPractitioner) continue
        const exists = await db.referral.findUnique({ where: { referralNumber: def.referralNumber } })
        if (!exists) {
          await db.referral.create({
            data: {
              patientId: def.patient.id,
              fromPractitionerId: def.fromPractitioner.id,
              toPractitionerId: def.toPractitioner?.id,
              referralNumber: def.referralNumber,
              modality: def.modality,
              targetModality: def.targetModality,
              reason: def.reason,
              clinicalSummary: def.clinicalSummary,
              urgency: def.urgency,
              status: def.status,
              referredSpeciality: def.referredSpeciality,
              respondedAt: (def as any).respondedAt,
              completedAt: (def as any).completedAt,
            },
          })
          addCount('Referrals', 1)
        }
      }
      log('Referrals', `Created ${SUMMARY['Referrals'] || 0} new referrals`)
    } else {
      log('Referrals', `Skipped — ${existingReferrals} already exist`)
    }
  } catch (e: any) {
    log('Referrals', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 10. NOTIFICATIONS
  // ════════════════════════════════════════════
  try {
    const existingNotifications = await db.appNotification.count()
    if (existingNotifications < 8) {
      const notificationDefs = [
        { type: 'PRESCRIPTION', category: 'INFO', title: 'Prescription Ready', message: 'Your prescription RX-000001 has been generated by Dr. Arvind Kumar. Please visit the pharmacy to collect your medicines.', patient: rahul, isRead: true, readAt: daysFromNow(-1) },
        { type: 'APPOINTMENT', category: 'WARNING', title: 'Appointment Reminder', message: 'You have an appointment with Dr. Rajesh Patel tomorrow at 10:00 AM. Please arrive 15 minutes early.', patient: priya, isRead: false },
        { type: 'RECALL', category: 'CRITICAL', title: 'Drug Recall Alert', message: 'Ranitidine (all brands) has been recalled by CDSCO due to NDMA impurity. If you are taking this medication, contact your doctor immediately.', patient: vikram, isRead: false },
        { type: 'SAFETY', category: 'URGENT', title: 'Drug Interaction Warning', message: 'Potential interaction detected between Warfarin and Aspirin — increased bleeding risk. Your doctor has been notified.', patient: meena, isRead: false },
        { type: 'LAB_RESULT', category: 'INFO', title: 'Lab Results Available', message: 'Your lab results for LBO-000001 are now available. HbA1c is above the target range. Please schedule a follow-up.', patient: rahul, isRead: true, readAt: daysFromNow(-2) },
        { type: 'FOLLOW_UP', category: 'INFO', title: 'Follow-up Due', message: 'You are due for a follow-up consultation with Dr. Arvind Kumar. Last visit was 14 days ago.', patient: rahul, isRead: false },
        { type: 'REFERRAL', category: 'INFO', title: 'Referral Update', message: 'Your referral to Dr. Meera Iyer (Homeopathy) has been accepted. Please call to schedule your appointment.', patient: priya, isRead: true, readAt: daysFromNow(-1) },
        { type: 'BILLING', category: 'WARNING', title: 'Payment Overdue', message: 'Invoice INV-000004 for ₹1,688 is overdue by 7 days. Please make the payment at the earliest to avoid late fees.', patient: sunita, isRead: false },
      ]

      for (const def of notificationDefs) {
        // Use title as unique identifier to avoid duplicates
        const exists = await db.appNotification.findFirst({ where: { title: def.title } })
        if (!exists) {
          await db.appNotification.create({
            data: {
              patientId: def.patient?.id,
              type: def.type,
              category: def.category,
              title: def.title,
              message: def.message,
              isRead: def.isRead,
              readAt: (def as any).readAt,
              channel: 'IN_APP',
            },
          })
          addCount('Notifications', 1)
        }
      }
      log('Notifications', `Created ${SUMMARY['Notifications'] || 0} new notifications`)
    } else {
      log('Notifications', `Skipped — ${existingNotifications} already exist`)
    }
  } catch (e: any) {
    log('Notifications', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 11. DOCUMENT UPLOADS
  // ════════════════════════════════════════════
  try {
    const existingDocs = await db.documentUpload.count()
    if (existingDocs < 4) {
      const docDefs = [
        {
          patient: rahul, practitioner: drArvind,
          documentType: 'LAB_REPORT', fileName: 'rahul_lab_report_2024.pdf', fileSize: 245000, mimeType: 'application/pdf',
          ocrExtracted: 'CBC: Hb 13.2 g/dL, WBC 7200, Platelets 2.4L. HbA1c: 8.2%. Lipid: Total Chol 248, LDL 168, HDL 38, TG 210.',
          ocrConfidence: 0.92, isVerified: true, verifiedBy: drArvind?.id, verifiedAt: daysFromNow(-1),
        },
        {
          patient: priya, practitioner: drRajesh,
          documentType: 'PRESCRIPTION', fileName: 'priya_ayurveda_rx.jpg', fileSize: 89000, mimeType: 'image/jpeg',
          ocrExtracted: 'Ashwagandha 500mg BD. Triphala 1gm HS. Dr. Rajesh Patel, BAMS.',
          ocrConfidence: 0.78, isVerified: false,
        },
        {
          patient: anjali,
          documentType: 'ID_PROOF', fileName: 'anjali_aadhaar.pdf', fileSize: 520000, mimeType: 'application/pdf',
          ocrExtracted: 'Aadhaar Number: XXXX-XXXX-4321. Name: Anjali Joshi. DOB: 15/06/1990.',
          ocrConfidence: 0.95, isVerified: true, verifiedBy: 'SYSTEM', verifiedAt: daysFromNow(-10),
        },
        {
          patient: vikram,
          documentType: 'INSURANCE_CARD', fileName: 'vikram_pmjay_card.jpg', fileSize: 156000, mimeType: 'image/jpeg',
          ocrExtracted: 'PM-JAY Card. Name: Vikram Singh. ID: HE-PMJAY-2024-001. Hospital: Empanelled.',
          ocrConfidence: 0.88, isVerified: false,
        },
      ]

      for (const def of docDefs) {
        if (!def.patient) continue
        const exists = await db.documentUpload.findFirst({ where: { fileName: def.fileName } })
        if (!exists) {
          await db.documentUpload.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              documentType: def.documentType,
              fileName: def.fileName,
              fileSize: def.fileSize,
              mimeType: def.mimeType,
              ocrExtracted: def.ocrExtracted,
              ocrConfidence: def.ocrConfidence,
              isVerified: def.isVerified,
              verifiedBy: (def as any).verifiedBy,
              verifiedAt: (def as any).verifiedAt,
            },
          })
          addCount('DocumentUploads', 1)
        }
      }
      log('DocumentUploads', `Created ${SUMMARY['DocumentUploads'] || 0} new document uploads`)
    } else {
      log('DocumentUploads', `Skipped — ${existingDocs} already exist`)
    }
  } catch (e: any) {
    log('DocumentUploads', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 12. TELEMEDICINE SESSIONS
  // ════════════════════════════════════════════
  try {
    const existingTele = await db.telemedicineSession.count()
    if (existingTele < 3) {
      const teleDefs = [
        {
          patient: amit, practitioner: drRajesh,
          modality: 'AYURVEDA', status: 'COMPLETED', platform: 'BUILT_IN',
          duration: 1200, notes: 'Discussed chronic pain management. Adjusted Guggulu dosage. Recommended Kati Basti sessions.',
          rating: 4, feedback: 'Good consultation, clear advice on Ayurvedic treatment approach.',
          startedAt: daysFromNow(-2), endedAt: daysFromNow(-2),
        },
        {
          patient: priya, practitioner: drSunitaSharma,
          modality: 'ALLOPATHY', status: 'IN_PROGRESS', platform: 'BUILT_IN',
          notes: 'Tele-consultation for medication refill in progress.',
          startedAt: new Date(),
        },
        {
          patient: rahul, practitioner: drArvind,
          modality: 'ALLOPATHY', status: 'SCHEDULED', platform: 'BUILT_IN',
          notes: 'Scheduled tele-consultation for post-discharge cardiac follow-up.',
        },
      ]

      for (const def of teleDefs) {
        if (!def.patient) continue
        // Use patient + status + modality combination for idempotency
        const exists = await db.telemedicineSession.findFirst({
          where: {
            patientId: def.patient.id,
            status: def.status,
            modality: def.modality,
          },
        })
        if (!exists) {
          await db.telemedicineSession.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              modality: def.modality,
              status: def.status,
              platform: def.platform,
              duration: (def as any).duration,
              notes: def.notes,
              rating: (def as any).rating,
              feedback: (def as any).feedback,
              startedAt: (def as any).startedAt,
              endedAt: (def as any).endedAt,
            },
          })
          addCount('TelemedicineSessions', 1)
        }
      }
      log('TelemedicineSessions', `Created ${SUMMARY['TelemedicineSessions'] || 0} new sessions`)
    } else {
      log('TelemedicineSessions', `Skipped — ${existingTele} already exist`)
    }
  } catch (e: any) {
    log('TelemedicineSessions', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 13. CDS ALERTS
  // ════════════════════════════════════════════
  try {
    const existingCDS = await db.cDSAlert.count()
    if (existingCDS < 5) {
      const cdsDefs = [
        {
          patient: meena, practitioner: drArvind,
          alertType: 'DRUG_INTERACTION', severity: 'CRITICAL',
          title: 'Major Drug Interaction: Warfarin + Aspirin',
          description: 'Concurrent use of Warfarin and Aspirin significantly increases bleeding risk. INR monitoring is essential. Consider PPI gastroprotection if combination is necessary.',
          evidence: 'BMJ 2023; FDA Black Box Warning',
          suggestedAction: 'Review necessity of combination. If required, reduce Aspirin to 75mg and monitor INR weekly. Consider PPI gastroprotection.',
          isOverrideable: true,
        },
        {
          patient: rahul, practitioner: drArvind,
          alertType: 'ALLERGY', severity: 'CRITICAL',
          title: 'Allergy Alert: Penicillin → Amoxicillin',
          description: 'Patient has documented Penicillin allergy. Amoxicillin is a penicillin-class antibiotic and is CONTRAINDICATED.',
          evidence: 'Patient allergy record; NICE Clinical Guideline CG183',
          suggestedAction: 'Select alternative antibiotic: Azithromycin or Doxycycline. Do NOT prescribe any penicillin-class drug.',
          isOverrideable: false,
        },
        {
          patient: rahul, practitioner: drArvind,
          alertType: 'DOSAGE', severity: 'WARNING',
          title: 'Dosage Warning: Metformin Renal Adjustment',
          description: 'Patient creatinine clearance estimated at 35 mL/min. Current Metformin 1000mg/day exceeds renal-adjusted limit of 850mg/day per NICE guidelines.',
          evidence: 'NICE NG28; FDA Metformin labeling update 2016',
          suggestedAction: 'Reduce Metformin to 500mg BD (1000mg/day). Monitor renal function every 3 months. Consider DPP-4 inhibitor add-on.',
          isOverrideable: true,
        },
        {
          alertType: 'RECALL', severity: 'WARNING',
          title: 'CDSCO Drug Recall: Ranitidine',
          description: 'CDSCO has ordered recall of all Ranitidine products due to NDMA (N-Nitrosodimethylamine) impurity above acceptable limits. NDMA is a probable human carcinogen.',
          evidence: 'CDSCO Notice DC/BR/2024/012; FDA Drug Safety Communication',
          suggestedAction: 'Discontinue Ranitidine immediately. Substitute with Famotidine 20mg BD or Omeprazole 20mg OD. Counsel patient on the recall.',
          isOverrideable: false,
        },
        {
          patient: sunita, practitioner: drArvind,
          alertType: 'GUIDELINE', severity: 'INFO',
          title: 'Guideline Reminder: HbA1c Monitoring',
          description: 'Patient has uncontrolled T2DM (last HbA1c >9%). Per ADA 2024 guidelines, HbA1c should be monitored every 3 months until at target (<7%), then every 6 months.',
          evidence: 'ADA Standards of Medical Care in Diabetes 2024; RSSDI Clinical Practice Recommendations',
          suggestedAction: 'Order HbA1c if not done in past 3 months. Consider treatment intensification. Schedule diabetic education session.',
          isOverrideable: true,
        },
      ]

      for (const def of cdsDefs) {
        // Use title for idempotency
        const exists = await db.cDSAlert.findFirst({ where: { title: def.title } })
        if (!exists) {
          await db.cDSAlert.create({
            data: {
              patientId: def.patient?.id,
              practitionerId: def.practitioner?.id,
              alertType: def.alertType,
              severity: def.severity,
              title: def.title,
              description: def.description,
              evidence: def.evidence,
              suggestedAction: def.suggestedAction,
              isOverrideable: def.isOverrideable,
            },
          })
          addCount('CDSAlerts', 1)
        }
      }
      log('CDSAlerts', `Created ${SUMMARY['CDSAlerts'] || 0} new CDS alerts`)
    } else {
      log('CDSAlerts', `Skipped — ${existingCDS} already exist`)
    }
  } catch (e: any) {
    log('CDSAlerts', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 14. FOLLOW-UP REMINDERS
  // ════════════════════════════════════════════
  try {
    const existingReminders = await db.followUpReminder.count()
    if (existingReminders < 6) {
      const reminderDefs = [
        { patient: rahul, practitioner: drArvind, type: 'FOLLOW_UP', title: 'Cardiology Follow-up', description: 'Post-NSTEMI follow-up. Review medications, check BP, repeat ECG.', scheduledAt: daysFromNow(5), isCompleted: false, channel: 'IN_APP', recurrence: 'ONCE' },
        { patient: rahul, practitioner: drArvind, type: 'MEDICATION_REMINDER', title: 'Metformin Dosage Reminder', description: 'Take Metformin 500mg after breakfast and dinner. Do not skip doses.', scheduledAt: daysFromNow(0), isCompleted: false, channel: 'SMS', recurrence: 'DAILY' },
        { patient: priya, practitioner: drRajesh, type: 'LAB_REMINDER', title: 'Thyroid Function Test Due', description: 'Annual thyroid panel recheck. Last done 11 months ago.', scheduledAt: daysFromNow(14), isCompleted: false, channel: 'IN_APP', recurrence: 'ONCE' },
        { patient: anjali, type: 'VACCINATION_DUE', title: 'HPV Vaccination Due', description: 'HPV vaccine dose 2 of 3 is due. Schedule appointment for administration.', scheduledAt: daysFromNow(-3), isCompleted: false, channel: 'SMS', recurrence: 'ONCE' },
        { patient: sunita, practitioner: drArvind, type: 'CHECKUP', title: 'Annual Diabetic Checkup', description: 'Comprehensive annual checkup: HbA1c, KFT, fundoscopy, foot examination, urine albumin.', scheduledAt: daysFromNow(21), isCompleted: false, channel: 'IN_APP', recurrence: 'YEARLY' },
        { patient: amit, practitioner: drRajesh, type: 'FOLLOW_UP', title: 'Pain Management Review', description: 'Review Ayurvedic treatment efficacy for chronic back pain. Assess need for Kati Basti sessions.', scheduledAt: daysFromNow(-2), isCompleted: true, completedAt: daysFromNow(-2), channel: 'IN_APP', recurrence: 'ONCE' },
      ]

      for (const def of reminderDefs) {
        if (!def.patient) continue
        // Use patient + title for idempotency
        const exists = await db.followUpReminder.findFirst({
          where: {
            patientId: def.patient.id,
            title: def.title,
          },
        })
        if (!exists) {
          await db.followUpReminder.create({
            data: {
              patientId: def.patient.id,
              practitionerId: def.practitioner?.id,
              type: def.type,
              title: def.title,
              description: def.description,
              scheduledAt: def.scheduledAt,
              isCompleted: def.isCompleted,
              completedAt: (def as any).completedAt,
              channel: def.channel,
              recurrence: def.recurrence,
            },
          })
          addCount('FollowUpReminders', 1)
        }
      }
      log('FollowUpReminders', `Created ${SUMMARY['FollowUpReminders'] || 0} new reminders`)
    } else {
      log('FollowUpReminders', `Skipped — ${existingReminders} already exist`)
    }
  } catch (e: any) {
    log('FollowUpReminders', `Error: ${e.message}`)
  }

  // ════════════════════════════════════════════
  // 15. PATIENT TIMELINE EVENTS (Rahul Kumar)
  // ════════════════════════════════════════════
  try {
    const existingTimeline = await db.patientTimelineEvent.count()
    if (existingTimeline < 12 && rahul) {
      const timelineDefs = [
        { eventType: 'ADMISSION', eventDate: daysFromNow(-5), title: 'Hospital Admission', description: 'Admitted to Cardiology ICU via Emergency with chest pain. Diagnosis: NSTEMI.', modality: 'ALLOPATHY', isSignificant: true },
        { eventType: 'LAB_RESULT', eventDate: daysFromNow(-4), title: 'Troponin Result', description: 'Troponin I: 2.8 ng/mL (elevated). Confirms NSTEMI diagnosis.', modality: 'ALLOPATHY', data: JSON.stringify({ testName: 'Troponin I', resultValue: '2.8 ng/mL', isAbnormal: true }), isSignificant: true },
        { eventType: 'PRESCRIPTION', eventDate: daysFromNow(-4), title: 'Antiplatelet Loading', description: 'Aspirin 325mg + Clopidogrel 600mg loading dose administered.', modality: 'ALLOPATHY', data: JSON.stringify({ prescriptionNo: 'STAT-LOAD' }), isSignificant: true },
        { eventType: 'NOTE', eventDate: daysFromNow(-3), title: 'Cardiology Consultation Note', description: 'PCI planned for LAD lesion. EF 45%. Discussed risks and consent obtained.', modality: 'ALLOPATHY', isSignificant: false },
        { eventType: 'PRESCRIPTION', eventDate: daysFromNow(-1), title: 'Discharge Medications', description: 'Discharged on Aspirin 75mg, Clopidogrel 75mg, Atorvastatin 80mg, Metoprolol 25mg BD, Ramipril 2.5mg, Metformin 500mg BD.', modality: 'ALLOPATHY', data: JSON.stringify({ prescriptionNo: 'RX-000001' }), isSignificant: true },
        { eventType: 'DISCHARGE', eventDate: daysFromNow(-1), title: 'Hospital Discharge', description: 'Discharged in STABLE condition. Post PCI to LAD. Discharge summary DS-000001 generated.', modality: 'ALLOPATHY', isSignificant: true },
        { eventType: 'FOLLOW_UP', eventDate: daysFromNow(5), title: 'Cardiology Follow-up Scheduled', description: 'Follow-up appointment with Dr. Arvind Kumar in 7 days. Cardiac rehab enrollment pending.', modality: 'ALLOPATHY', isSignificant: false },
        { eventType: 'VACCINATION', eventDate: daysFromNow(-30), title: 'Influenza Vaccination', description: 'Influenza vaccine (Fluarix Tetra) administered. Batch: FLU-2024-0892.', modality: 'ALLOPATHY', data: JSON.stringify({ vaccineName: 'Influenza', batchNumber: 'FLU-2024-0892' }), isSignificant: false },
        { eventType: 'REFERRAL', eventDate: daysFromNow(-1), title: 'Cross-Modality Referral', description: 'Referred to Dr. Rajesh Patel (Ayurveda) for cardiac rehabilitation and lifestyle modification support.', modality: 'ALLOPATHY', data: JSON.stringify({ referralNumber: 'REF-000001', targetModality: 'AYURVEDA' }), isSignificant: true },
        { eventType: 'LAB_RESULT', eventDate: daysFromNow(-2), title: 'HbA1c Result', description: 'HbA1c 8.2% — above target of <7%. Poor glycemic control. Diabetic management needs intensification.', modality: 'ALLOPATHY', data: JSON.stringify({ testName: 'HbA1c', resultValue: '8.2%', isAbnormal: true }), isSignificant: true },
        { eventType: 'NOTE', eventDate: daysFromNow(-2), title: 'SOAP Note: Hypertension Follow-up', description: 'BP 148/92 — suboptimal. Amlodipine uptitrated to 10mg. Telmisartan added.', modality: 'ALLOPATHY', isSignificant: false },
        { eventType: 'FOLLOW_UP', eventDate: daysFromNow(-60), title: 'Previous Outpatient Visit', description: 'Routine follow-up. BP controlled on Amlodipine 5mg. Diabetes stable on Metformin 500mg BD.', modality: 'ALLOPATHY', isSignificant: false },
      ]

      for (const def of timelineDefs) {
        // Use patient + title + eventType for idempotency
        const exists = await db.patientTimelineEvent.findFirst({
          where: {
            patientId: rahul.id,
            title: def.title,
            eventType: def.eventType,
          },
        })
        if (!exists) {
          await db.patientTimelineEvent.create({
            data: {
              patientId: rahul.id,
              eventType: def.eventType,
              eventDate: def.eventDate,
              title: def.title,
              description: def.description,
              modality: def.modality,
              data: def.data,
              isSignificant: def.isSignificant,
            },
          })
          addCount('TimelineEvents', 1)
        }
      }
      log('TimelineEvents', `Created ${SUMMARY['TimelineEvents'] || 0} new timeline events`)
    } else {
      log('TimelineEvents', `Skipped — ${existingTimeline} already exist or no Rahul patient`)
    }
  } catch (e: any) {
    log('TimelineEvents', `Error: ${e.message}`)
  }

  // ── FINAL SUMMARY ──
  const totalCreated = Object.values(SUMMARY).reduce((sum, n) => sum + n, 0)
  log('DONE', `Total new records created: ${totalCreated}`)

  return {
    success: true,
    totalCreated,
    breakdown: SUMMARY,
    logs: LOGS,
  }
}

// ============================================================
// GET /api/seed-v2
// ============================================================
export async function GET() {
  try {
    const result = await seedAll()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('SEED-V2 FATAL:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/seed-v2
// ============================================================
export async function POST() {
  try {
    const result = await seedAll()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('SEED-V2 FATAL:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
