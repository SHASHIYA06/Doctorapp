import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST: Seed demo data ────────────────────────────────────────

export async function POST() {
  try {
    // Check if data already exists
    const existingTenants = await db.tenant.count()
    if (existingTenants > 0) {
      return NextResponse.json({
        message: 'Database already seeded. Use db:reset to clear first.',
        skipped: true,
      })
    }

    // ── 1. Create Tenant ────────────────────────────────────────
    const tenant = await db.tenant.create({
      data: {
        name: 'HealthBridge Medical Center',
        code: 'HBMC',
        jurisdiction: 'IN',
        isActive: true,
      },
    })

    // ── 2. Create Roles ─────────────────────────────────────────
    const adminRole = await db.role.create({
      data: {
        name: 'ADMIN',
        description: 'System administrator',
        permissions: JSON.stringify(['read', 'write', 'delete', 'admin']),
      },
    })

    const clinicianRole = await db.role.create({
      data: {
        name: 'CLINICIAN',
        description: 'Healthcare practitioner',
        permissions: JSON.stringify(['read', 'write', 'review', 'sign']),
      },
    })

    const patientRole = await db.role.create({
      data: {
        name: 'PATIENT',
        description: 'Patient user',
        permissions: JSON.stringify(['read_own', 'consent']),
      },
    })

    const curatorRole = await db.role.create({
      data: {
        name: 'KNOWLEDGE_CURATOR',
        description: 'Knowledge base curator',
        permissions: JSON.stringify(['read', 'write', 'review_knowledge']),
      },
    })

    // ── 3. Create Users ─────────────────────────────────────────
    const adminUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@healthbridge.io',
        name: 'Dr. Admin',
        role: 'ADMIN',
        roleId: adminRole.id,
        isActive: true,
      },
    })

    const clinician1 = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: 'priya.sharma@healthbridge.io',
        name: 'Dr. Priya Sharma',
        role: 'CLINICIAN',
        roleId: clinicianRole.id,
        isActive: true,
      },
    })

    const clinician2 = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: 'raj.patel@healthbridge.io',
        name: 'Dr. Raj Patel',
        role: 'CLINICIAN',
        roleId: clinicianRole.id,
        isActive: true,
      },
    })

    const clinician3 = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: 'anitha.rao@healthbridge.io',
        name: 'Dr. Anitha Rao',
        role: 'CLINICIAN',
        roleId: clinicianRole.id,
        isActive: true,
      },
    })

    const curatorUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: 'curator@healthbridge.io',
        name: 'Knowledge Curator',
        role: 'KNOWLEDGE_CURATOR',
        roleId: curatorRole.id,
        isActive: true,
      },
    })

    // ── 4. Create Practitioners ─────────────────────────────────
    const practitioner1 = await db.practitioner.create({
      data: {
        tenantId: tenant.id,
        userId: clinician1.id,
        name: 'Dr. Priya Sharma',
        specialization: 'General Medicine',
        modality: 'ALLOPATHY',
        licenseNumber: 'MBBS-2018-4521',
        isActive: true,
      },
    })

    const practitioner2 = await db.practitioner.create({
      data: {
        tenantId: tenant.id,
        userId: clinician2.id,
        name: 'Dr. Raj Patel',
        specialization: 'Ayurvedic Medicine',
        modality: 'AYURVEDA',
        licenseNumber: 'BAMS-2016-7893',
        isActive: true,
      },
    })

    const practitioner3 = await db.practitioner.create({
      data: {
        tenantId: tenant.id,
        userId: clinician3.id,
        name: 'Dr. Anitha Rao',
        specialization: 'Homeopathy',
        modality: 'HOMEOPATHY',
        licenseNumber: 'BHMS-2019-1234',
        isActive: true,
      },
    })

    // ── 5. Create Patients ──────────────────────────────────────
    const patient1 = await db.patient.create({
      data: {
        tenantId: tenant.id,
        userId: null,
        firstName: 'Arun',
        lastName: 'Kumar',
        dateOfBirth: '1985-03-15',
        gender: 'MALE',
        phone: '+91-9876543210',
        email: 'arun.kumar@email.com',
        address: JSON.stringify({ city: 'Bengaluru', state: 'Karnataka', pin: '560001' }),
        bloodGroup: 'O+',
        emergencyContact: JSON.stringify({ name: 'Meera Kumar', phone: '+91-9876543211', relation: 'Spouse' }),
        isActive: true,
      },
    })

    const patient2 = await db.patient.create({
      data: {
        tenantId: tenant.id,
        userId: null,
        firstName: 'Sunita',
        lastName: 'Devi',
        dateOfBirth: '1972-08-22',
        gender: 'FEMALE',
        phone: '+91-9123456780',
        email: 'sunita.devi@email.com',
        address: JSON.stringify({ city: 'Delhi', state: 'Delhi', pin: '110001' }),
        bloodGroup: 'A+',
        emergencyContact: JSON.stringify({ name: 'Ramesh Devi', phone: '+91-9123456781', relation: 'Son' }),
        isActive: true,
      },
    })

    const patient3 = await db.patient.create({
      data: {
        tenantId: tenant.id,
        userId: null,
        firstName: 'Vikram',
        lastName: 'Singh',
        dateOfBirth: '1995-11-08',
        gender: 'MALE',
        phone: '+91-9988776655',
        email: 'vikram.singh@email.com',
        address: JSON.stringify({ city: 'Mumbai', state: 'Maharashtra', pin: '400001' }),
        bloodGroup: 'B+',
        emergencyContact: JSON.stringify({ name: 'Karan Singh', phone: '+91-9988776656', relation: 'Father' }),
        isActive: true,
      },
    })

    const patient4 = await db.patient.create({
      data: {
        tenantId: tenant.id,
        userId: null,
        firstName: 'Lakshmi',
        lastName: 'Iyer',
        dateOfBirth: '1968-02-14',
        gender: 'FEMALE',
        phone: '+91-9876123456',
        email: 'lakshmi.iyer@email.com',
        address: JSON.stringify({ city: 'Chennai', state: 'Tamil Nadu', pin: '600001' }),
        bloodGroup: 'AB+',
        emergencyContact: JSON.stringify({ name: 'Ramesh Iyer', phone: '+91-9876123457', relation: 'Husband' }),
        isActive: true,
      },
    })

    const patient5 = await db.patient.create({
      data: {
        tenantId: tenant.id,
        userId: null,
        firstName: 'Deepak',
        lastName: 'Mehta',
        dateOfBirth: '1990-06-30',
        gender: 'MALE',
        phone: '+91-9765432100',
        email: 'deepak.mehta@email.com',
        address: JSON.stringify({ city: 'Pune', state: 'Maharashtra', pin: '411001' }),
        bloodGroup: 'O-',
        emergencyContact: JSON.stringify({ name: 'Neha Mehta', phone: '+91-9765432101', relation: 'Wife' }),
        isActive: true,
      },
    })

    // ── 6. Create Allergies ─────────────────────────────────────
    const allergies = await Promise.all([
      db.allergy.create({
        data: {
          patientId: patient1.id,
          substance: 'Penicillin',
          reaction: 'Anaphylaxis',
          severity: 'LIFE_THREATENING',
          verified: true,
        },
      }),
      db.allergy.create({
        data: {
          patientId: patient1.id,
          substance: 'Sulfa drugs',
          reaction: 'Skin rash',
          severity: 'MODERATE',
          verified: true,
        },
      }),
      db.allergy.create({
        data: {
          patientId: patient2.id,
          substance: 'Aspirin',
          reaction: 'GI upset',
          severity: 'MILD',
          verified: true,
        },
      }),
      db.allergy.create({
        data: {
          patientId: patient3.id,
          substance: 'Latex',
          reaction: 'Contact dermatitis',
          severity: 'MODERATE',
          verified: false,
        },
      }),
      db.allergy.create({
        data: {
          patientId: patient4.id,
          substance: 'Ibuprofen',
          reaction: 'Stomach pain',
          severity: 'MILD',
          verified: true,
        },
      }),
      db.allergy.create({
        data: {
          patientId: patient5.id,
          substance: 'Codeine',
          reaction: 'Respiratory depression',
          severity: 'SEVERE',
          verified: true,
        },
      }),
    ])

    // ── 7. Create Medications ───────────────────────────────────
    const medications = await Promise.all([
      db.medicationStatement.create({
        data: {
          patientId: patient1.id,
          medication: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          route: 'Oral',
          startDate: '2024-01-15',
          modality: 'ALLOPATHY',
          isActive: true,
          notes: 'For Type 2 Diabetes management',
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient1.id,
          medication: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          route: 'Oral',
          startDate: '2024-02-01',
          modality: 'ALLOPATHY',
          isActive: true,
          notes: 'For hypertension',
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient2.id,
          medication: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          route: 'Oral',
          startDate: '2023-06-10',
          modality: 'ALLOPATHY',
          isActive: true,
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient2.id,
          medication: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily at bedtime',
          route: 'Oral',
          startDate: '2023-06-10',
          modality: 'ALLOPATHY',
          isActive: true,
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient3.id,
          medication: 'Ashwagandha churna',
          dosage: '3g',
          frequency: 'Once daily with milk',
          route: 'Oral',
          startDate: '2024-03-01',
          modality: 'AYURVEDA',
          isActive: true,
          notes: 'For stress and anxiety',
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient4.id,
          medication: 'Warfarin',
          dosage: '5mg',
          frequency: 'Once daily',
          route: 'Oral',
          startDate: '2023-12-01',
          modality: 'ALLOPATHY',
          isActive: true,
          notes: 'Anticoagulation therapy - requires regular INR monitoring',
        },
      }),
      db.medicationStatement.create({
        data: {
          patientId: patient5.id,
          medication: 'Nux Vomica 30C',
          dosage: '3 pellets',
          frequency: 'Twice daily',
          route: 'Sublingual',
          startDate: '2024-04-15',
          modality: 'HOMEOPATHY',
          isActive: true,
          notes: 'For digestive issues',
        },
      }),
    ])

    // ── 8. Create Conditions ────────────────────────────────────
    await Promise.all([
      db.condition.create({
        data: {
          patientId: patient1.id,
          code: 'E11.9',
          name: 'Type 2 Diabetes Mellitus',
          modality: 'ALLOPATHY',
          status: 'CHRONIC',
          onsetDate: '2022-05-10',
        },
      }),
      db.condition.create({
        data: {
          patientId: patient1.id,
          code: 'I10',
          name: 'Essential Hypertension',
          modality: 'ALLOPATHY',
          status: 'CHRONIC',
          onsetDate: '2023-01-20',
        },
      }),
      db.condition.create({
        data: {
          patientId: patient2.id,
          code: 'I25.10',
          name: 'Atherosclerotic heart disease',
          modality: 'ALLOPATHY',
          status: 'CHRONIC',
          onsetDate: '2021-09-15',
        },
      }),
      db.condition.create({
        data: {
          patientId: patient3.id,
          code: 'F41.1',
          name: 'Generalized anxiety disorder',
          modality: 'ALLOPATHY',
          status: 'ACTIVE',
          onsetDate: '2024-01-05',
        },
      }),
      db.condition.create({
        data: {
          patientId: patient4.id,
          code: 'I48.91',
          name: 'Atrial fibrillation',
          modality: 'ALLOPATHY',
          status: 'CHRONIC',
          onsetDate: '2023-10-01',
        },
      }),
    ])

    // ── 9. Create Consents ──────────────────────────────────────
    await Promise.all([
      db.consent.create({
        data: {
          patientId: patient1.id,
          type: 'TREATMENT',
          modality: 'ALLOPATHY',
          status: 'GRANTED',
          grantedAt: new Date('2024-01-15'),
        },
      }),
      db.consent.create({
        data: {
          patientId: patient1.id,
          type: 'AI_ASSISTED',
          modality: 'ALLOPATHY',
          status: 'GRANTED',
          grantedAt: new Date('2024-01-15'),
          notes: 'Consented to AI-assisted care plan suggestions',
        },
      }),
      db.consent.create({
        data: {
          patientId: patient2.id,
          type: 'TREATMENT',
          modality: 'ALLOPATHY',
          status: 'GRANTED',
          grantedAt: new Date('2023-06-10'),
        },
      }),
      db.consent.create({
        data: {
          patientId: patient3.id,
          type: 'TREATMENT',
          modality: 'AYURVEDA',
          status: 'GRANTED',
          grantedAt: new Date('2024-03-01'),
        },
      }),
      db.consent.create({
        data: {
          patientId: patient4.id,
          type: 'TREATMENT',
          modality: 'ALLOPATHY',
          status: 'GRANTED',
          grantedAt: new Date('2023-12-01'),
        },
      }),
      db.consent.create({
        data: {
          patientId: patient5.id,
          type: 'TREATMENT',
          modality: 'HOMEOPATHY',
          status: 'GRANTED',
          grantedAt: new Date('2024-04-15'),
        },
      }),
      db.consent.create({
        data: {
          patientId: patient2.id,
          type: 'DATA_SHARING',
          modality: 'ALLOPATHY',
          status: 'PENDING',
          notes: 'Research data sharing request pending',
        },
      }),
    ])

    // ── 10. Create Encounters with Intakes ──────────────────────
    const encounter1 = await db.encounter.create({
      data: {
        patientId: patient1.id,
        tenantId: tenant.id,
        practitionerId: practitioner1.id,
        modality: 'ALLOPATHY',
        status: 'IN_PROGRESS',
        priority: 'ROUTINE',
        reason: 'Diabetes follow-up',
        startedAt: new Date('2024-06-01T09:00:00Z'),
      },
    })

    await db.intake.create({
      data: {
        encounterId: encounter1.id,
        chiefComplaint: 'Persistent fatigue and increased thirst over the past 2 weeks',
        historyOfPresentIllness: 'Patient reports worsening fatigue despite adequate sleep. Increased thirst and urination. Blood glucose readings at home ranging 180-220 mg/dL fasting. Currently on Metformin 500mg BD.',
        reviewOfSystems: JSON.stringify({
          constitutional: 'Fatigue, weight gain 2kg over 3 months',
          cardiovascular: 'No chest pain, no palpitations',
          respiratory: 'No shortness of breath',
          gastrointestinal: 'Increased thirst, increased urination',
          neurological: 'No headaches, no dizziness',
        }),
      },
    })

    const encounter2 = await db.encounter.create({
      data: {
        patientId: patient2.id,
        tenantId: tenant.id,
        modality: 'ALLOPATHY',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        reason: 'Chest discomfort evaluation',
        startedAt: new Date('2024-06-02T14:30:00Z'),
      },
    })

    await db.intake.create({
      data: {
        encounterId: encounter2.id,
        chiefComplaint: 'Mild chest discomfort on exertion for 1 week',
        historyOfPresentIllness: 'Progressive chest discomfort on climbing stairs, relieved by rest. No radiation. Associated with mild dyspnea. Known CAD, on Amlodipine and Atorvastatin.',
        reviewOfSystems: JSON.stringify({
          constitutional: 'No fever, no weight loss',
          cardiovascular: 'Chest discomfort on exertion, no palpitations, no edema',
          respiratory: 'Mild dyspnea on exertion',
          gastrointestinal: 'No nausea, no abdominal pain',
        }),
      },
    })

    const encounter3 = await db.encounter.create({
      data: {
        patientId: patient3.id,
        tenantId: tenant.id,
        modality: 'AYURVEDA',
        status: 'IN_PROGRESS',
        priority: 'ROUTINE',
        reason: 'Anxiety management',
        startedAt: new Date('2024-06-03T11:00:00Z'),
      },
    })

    await db.intake.create({
      data: {
        encounterId: encounter3.id,
        chiefComplaint: 'Anxiety and sleep disturbance',
        historyOfPresentIllness: 'Patient reports persistent anxiety affecting daily activities. Difficulty falling asleep. Currently taking Ashwagandha. Stress from work pressure.',
        reviewOfSystems: JSON.stringify({
          constitutional: 'Fatigue, difficulty sleeping',
          psychiatric: 'Anxiety, restlessness, poor concentration',
          neurological: 'Tension headaches',
        }),
      },
    })

    const encounter4 = await db.encounter.create({
      data: {
        patientId: patient4.id,
        tenantId: tenant.id,
        practitionerId: practitioner1.id,
        modality: 'ALLOPATHY',
        status: 'COMPLETED',
        priority: 'ROUTINE',
        reason: 'INR check and warfarin adjustment',
        startedAt: new Date('2024-05-28T10:00:00Z'),
        endedAt: new Date('2024-05-28T10:30:00Z'),
      },
    })

    await db.intake.create({
      data: {
        encounterId: encounter4.id,
        chiefComplaint: 'Regular INR monitoring visit',
        historyOfPresentIllness: 'On warfarin for atrial fibrillation. Last INR 2.8 (target 2.0-3.0). No bleeding issues.',
      },
    })

    // ── 11. Create Symptoms ─────────────────────────────────────
    await Promise.all([
      db.symptom.create({
        data: {
          patientId: patient1.id,
          encounterId: encounter1.id,
          name: 'Fatigue',
          severity: 'MODERATE',
          onset: '2 weeks ago',
          duration: 'Ongoing',
        },
      }),
      db.symptom.create({
        data: {
          patientId: patient1.id,
          encounterId: encounter1.id,
          name: 'Polydipsia',
          severity: 'MODERATE',
          onset: '2 weeks ago',
          duration: 'Ongoing',
        },
      }),
      db.symptom.create({
        data: {
          patientId: patient2.id,
          encounterId: encounter2.id,
          name: 'Chest discomfort',
          severity: 'SEVERE',
          onset: '1 week ago',
          duration: 'Progressive',
        },
      }),
      db.symptom.create({
        data: {
          patientId: patient3.id,
          encounterId: encounter3.id,
          name: 'Anxiety',
          severity: 'MODERATE',
          onset: '3 months ago',
          duration: 'Persistent',
        },
      }),
      db.symptom.create({
        data: {
          patientId: patient3.id,
          encounterId: encounter3.id,
          name: 'Insomnia',
          severity: 'MODERATE',
          onset: '2 months ago',
          duration: 'Nightly',
        },
      }),
    ])

    // ── 12. Create Triage Rules ─────────────────────────────────
    await Promise.all([
      db.triageRule.create({
        data: {
          name: 'Chest Pain Emergency',
          modality: 'ALLOPATHY',
          condition: JSON.stringify({ field: 'intake.chiefComplaint', operator: 'contains', value: 'chest pain' }),
          priority: 'EMERGENCY',
          action: 'ESCALATE',
          isActive: true,
        },
      }),
      db.triageRule.create({
        data: {
          name: 'Breathing Difficulty Emergency',
          modality: 'ALLOPATHY',
          condition: JSON.stringify({ field: 'intake.chiefComplaint', operator: 'contains', value: 'shortness of breath' }),
          priority: 'EMERGENCY',
          action: 'ESCALATE',
          isActive: true,
        },
      }),
      db.triageRule.create({
        data: {
          name: 'Severe Symptom Escalation',
          modality: 'ALLOPATHY',
          condition: JSON.stringify({ field: 'symptom.severity', operator: 'eq', value: 'SEVERE' }),
          priority: 'URGENT',
          action: 'NOTIFY',
          isActive: true,
        },
      }),
      db.triageRule.create({
        data: {
          name: 'Chronic Disease Follow-up',
          modality: 'ALLOPATHY',
          condition: JSON.stringify({ field: 'encounter.reason', operator: 'contains', value: 'follow-up' }),
          priority: 'ROUTINE',
          action: 'QUEUE',
          isActive: true,
        },
      }),
      db.triageRule.create({
        data: {
          name: 'Vata Imbalance Urgent',
          modality: 'AYURVEDA',
          condition: JSON.stringify({ field: 'intake.chiefComplaint', operator: 'contains', value: 'anxiety' }),
          priority: 'URGENT',
          action: 'QUEUE',
          isActive: true,
        },
      }),
      db.triageRule.create({
        data: {
          name: 'Acute Exacerbation Homeopathy',
          modality: 'HOMEOPATHY',
          condition: JSON.stringify({ field: 'symptom.severity', operator: 'eq', value: 'SEVERE' }),
          priority: 'URGENT',
          action: 'NOTIFY',
          isActive: true,
        },
      }),
    ])

    // ── 13. Create Knowledge Sources ─────────────────────────────
    await Promise.all([
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'Harrison\'s Principles of Internal Medicine',
          modality: 'ALLOPATHY',
          sourceType: 'TEXTBOOK',
          evidenceLevel: 'APPROVED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'NICE Clinical Guidelines',
          modality: 'ALLOPATHY',
          sourceType: 'GUIDELINE',
          evidenceLevel: 'APPROVED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'Charaka Samhita',
          modality: 'AYURVEDA',
          sourceType: 'TEXTBOOK',
          evidenceLevel: 'APPROVED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'Sushruta Samhita',
          modality: 'AYURVEDA',
          sourceType: 'TEXTBOOK',
          evidenceLevel: 'REVIEWED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'Organon of Medicine (Hahnemann)',
          modality: 'HOMEOPATHY',
          sourceType: 'TEXTBOOK',
          evidenceLevel: 'REVIEWED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'Indian Pharmacopoeia 2022',
          modality: 'ALLOPATHY',
          sourceType: 'PHARMACOPIA',
          evidenceLevel: 'APPROVED',
          jurisdiction: 'IN',
          reviewStatus: 'UNDER_REVIEW',
          isActive: true,
        },
      }),
      db.knowledgeSource.create({
        data: {
          tenantId: tenant.id,
          name: 'AYUSH Central Council - Ayurveda Formulary',
          modality: 'AYURVEDA',
          sourceType: 'PHARMACOPIA',
          evidenceLevel: 'APPROVED',
          jurisdiction: 'IN',
          reviewStatus: 'APPROVED',
          sourceUrl: 'https://ayush.gov.in',
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
        },
      }),
    ])

    // ── 14. Create Care Tracks ──────────────────────────────────
    await Promise.all([
      db.careTrack.create({
        data: {
          name: 'Diabetes Management Program',
          modality: 'ALLOPATHY',
          description: 'Comprehensive Type 2 Diabetes management with regular HbA1c monitoring, diet counseling, and medication review',
          isActive: true,
        },
      }),
      db.careTrack.create({
        data: {
          name: 'Cardiac Rehabilitation',
          modality: 'ALLOPATHY',
          description: 'Post-cardiac event rehabilitation with exercise, diet, and medication management',
          isActive: true,
        },
      }),
      db.careTrack.create({
        data: {
          name: 'Panchakarma Therapy Track',
          modality: 'AYURVEDA',
          description: 'Traditional Ayurvedic detoxification and rejuvenation program',
          isActive: true,
        },
      }),
      db.careTrack.create({
        data: {
          name: 'Constitutional Remedy Track',
          modality: 'HOMEOPATHY',
          description: 'Individualized homeopathic treatment based on constitutional analysis',
          isActive: true,
        },
      }),
      db.careTrack.create({
        data: {
          name: 'Chronic Pain Management',
          modality: 'ALLOPATHY',
          description: 'Multidisciplinary chronic pain management program',
          isActive: true,
        },
      }),
    ])

    // ── 15. Create Safety Alerts ────────────────────────────────
    await Promise.all([
      db.safetyAlert.create({
        data: {
          patientId: patient4.id,
          encounterId: encounter4.id,
          type: 'INTERACTION',
          severity: 'WARNING',
          message: 'Warfarin patient - verify no NSAID/Aspirin interactions. Current INR monitoring in progress.',
          source: 'DETERMINISTIC',
          status: 'ACTIVE',
          metadata: JSON.stringify({ medication: 'Warfarin', risk: 'bleeding' }),
        },
      }),
    ])

    // ── 16. Create Clinical Drafts ──────────────────────────────
    const draft1 = await db.clinicalDraft.create({
      data: {
        patientId: patient1.id,
        encounterId: encounter1.id,
        practitionerId: practitioner1.id,
        modality: 'ALLOPATHY',
        content: JSON.stringify({
          assessment: 'Type 2 Diabetes - suboptimal control on current Metformin 500mg BD',
          plan: [
            'Increase Metformin to 1000mg BD',
            'Add lifestyle modifications: 30min daily walk, dietary counseling',
            'Order HbA1c in 3 months',
            'Continue Lisinopril 10mg daily',
            'Monitor renal function',
          ],
          followUp: '3 months',
        }),
        aiGenerated: false,
        status: 'UNDER_REVIEW',
        reviewedBy: practitioner1.id,
        reviewedAt: new Date(),
        version: 1,
      },
    })

    const draft2 = await db.clinicalDraft.create({
      data: {
        patientId: patient2.id,
        encounterId: encounter2.id,
        modality: 'ALLOPATHY',
        content: JSON.stringify({
          assessment: 'Stable angina - worsening on current regimen',
          plan: [
            'Consider increasing Amlodipine to 10mg',
            'Add sublingual NTG PRN for acute episodes',
            'Order stress echocardiogram',
            'Cardiology referral if symptoms persist',
          ],
          followUp: '2 weeks',
        }),
        aiGenerated: true,
        citations: JSON.stringify([
          { source: 'NICE CG126', relevance: 'Stable angina management' },
        ]),
        status: 'DRAFT',
        version: 1,
      },
    })

    // ── 17. Create a Signed Care Plan ───────────────────────────
    await db.signedCarePlan.create({
      data: {
        patientId: patient4.id,
        practitionerId: practitioner1.id,
        draftId: null,
        modality: 'ALLOPATHY',
        content: JSON.stringify({
          assessment: 'Atrial fibrillation on Warfarin - stable INR',
          plan: [
            'Continue Warfarin 5mg daily',
            'INR check every 4 weeks',
            'Dietary counseling: consistent Vitamin K intake',
          ],
        }),
        signedBy: practitioner1.id,
        signedAt: new Date('2024-05-28T10:25:00Z'),
        isActive: true,
      },
    })

    // ── 18. Create Follow-ups ────────────────────────────────────
    await Promise.all([
      db.followUp.create({
        data: {
          patientId: patient1.id,
          type: 'LAB_REVIEW',
          scheduledAt: new Date('2024-09-01T09:00:00Z'),
          status: 'SCHEDULED',
          notes: 'HbA1c and renal function panel',
        },
      }),
      db.followUp.create({
        data: {
          patientId: patient2.id,
          type: 'CHECKUP',
          scheduledAt: new Date('2024-06-16T14:00:00Z'),
          status: 'SCHEDULED',
          notes: 'Follow-up after stress echo',
        },
      }),
      db.followUp.create({
        data: {
          patientId: patient4.id,
          type: 'MEDICATION_REVIEW',
          scheduledAt: new Date('2024-06-25T10:00:00Z'),
          status: 'SCHEDULED',
          notes: 'INR check and Warfarin dose review',
        },
      }),
    ])

    // ── 19. Create Appointments ─────────────────────────────────
    await Promise.all([
      db.appointment.create({
        data: {
          patientId: patient1.id,
          practitionerId: practitioner1.id,
          scheduledAt: new Date('2024-06-15T09:00:00Z'),
          duration: 30,
          modality: 'ALLOPATHY',
          status: 'CONFIRMED',
          notes: 'Diabetes follow-up',
        },
      }),
      db.appointment.create({
        data: {
          patientId: patient3.id,
          practitionerId: practitioner2.id,
          scheduledAt: new Date('2024-06-16T11:00:00Z'),
          duration: 45,
          modality: 'AYURVEDA',
          status: 'SCHEDULED',
          notes: 'Ayurvedic consultation for anxiety',
        },
      }),
      db.appointment.create({
        data: {
          patientId: patient5.id,
          practitionerId: practitioner3.id,
          scheduledAt: new Date('2024-06-17T15:00:00Z'),
          duration: 30,
          modality: 'HOMEOPATHY',
          status: 'SCHEDULED',
          notes: 'Homeopathic constitutional assessment',
        },
      }),
    ])

    // ── 20. Audit the seed event ────────────────────────────────
    await db.auditEvent.create({
      data: {
        tenantId: tenant.id,
        actorId: adminUser.id,
        actorRole: 'ADMIN',
        action: 'SEED',
        resourceType: 'System',
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          tenants: 1,
          users: 5,
          practitioners: 3,
          patients: 5,
          allergies: allergies.length,
          medications: medications.length,
          encounters: 4,
          drafts: 2,
        }),
      },
    })

    return NextResponse.json(
      {
        message: 'Database seeded successfully',
        data: {
          tenant: { id: tenant.id, name: tenant.name },
          users: 5,
          practitioners: 3,
          patients: 5,
          allergies: allergies.length,
          medications: medications.length,
          encounters: 4,
          careTracks: 5,
          knowledgeSources: 7,
          triageRules: 6,
          clinicalDrafts: 2,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[SEED_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
