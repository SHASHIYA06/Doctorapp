import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const runSafetyChecksSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  encounterId: z.string().optional(),
  medications: z.array(z.string()).optional(), // medication names to check
})

const acknowledgeAlertSchema = z.object({
  id: z.string().min(1, 'Alert ID is required'),
  acknowledgedBy: z.string().min(1, 'Acknowledged by is required'),
})

// ─── Known drug interactions (deterministic) ─────────────────────

const DRUG_INTERACTIONS: Record<string, Record<string, string>> = {
  warfarin: {
    aspirin: 'Increased bleeding risk - avoid concurrent use',
    ibuprofen: 'Increased bleeding risk - consider alternative analgesic',
    amiodarone: 'Enhanced anticoagulant effect - reduce warfarin dose',
  },
  metformin: {
    cimetidine: 'Increased metformin levels - monitor for lactic acidosis',
  },
  lisinopril: {
    potassium_chloride: 'Risk of hyperkalemia - monitor potassium levels',
    spironolactone: 'Risk of hyperkalemia - avoid combination or monitor closely',
  },
  aspirin: {
    ibuprofen: 'Increased GI toxicity - avoid concurrent use',
  },
}

// ─── Red flag symptoms ───────────────────────────────────────────

const RED_FLAG_SYMPTOMS = [
  { pattern: /chest pain/i, message: 'Chest pain - rule out cardiac emergency', severity: 'EMERGENCY' },
  { pattern: /shortness of breath/i, message: 'Dyspnea - evaluate for respiratory emergency', severity: 'CRITICAL' },
  { pattern: /severe bleeding/i, message: 'Severe bleeding - immediate assessment required', severity: 'EMERGENCY' },
  { pattern: /suicidal/i, message: 'Suicidal ideation - immediate psychiatric evaluation', severity: 'EMERGENCY' },
  { pattern: /anaphylax/i, message: 'Anaphylaxis suspected - emergency intervention', severity: 'EMERGENCY' },
  { pattern: /stroke/i, message: 'Stroke symptoms - activate stroke protocol', severity: 'EMERGENCY' },
  { pattern: /seizure/i, message: 'Seizure activity - neurological evaluation required', severity: 'CRITICAL' },
]

// ─── GET: List safety alerts ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const alerts = await db.safetyAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('[SAFETY_LIST]', error)
    return NextResponse.json({ error: 'Failed to list safety alerts' }, { status: 500 })
  }
}

// ─── POST: Run deterministic safety checks ───────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = runSafetyChecksSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { patientId, encounterId, medications } = parsed.data
    const alerts: Array<{
      type: string
      severity: string
      message: string
      source: string
      metadata?: string
    }> = []

    // 1. Allergy check
    const allergies = await db.allergy.findMany({ where: { patientId } })
    const activeMeds = medications ?? (
      await db.medicationStatement.findMany({
        where: { patientId, isActive: true },
      })
    ).map((m) => m.medication.toLowerCase())

    for (const allergy of allergies) {
      const substance = allergy.substance.toLowerCase()
      for (const med of activeMeds) {
        const medLower = med.toLowerCase()
        if (medLower.includes(substance) || substance.includes(medLower)) {
          alerts.push({
            type: 'ALLERGY',
            severity: allergy.severity === 'LIFE_THREATENING' ? 'EMERGENCY' : 'CRITICAL',
            message: `Allergy alert: Patient is allergic to ${allergy.substance} (${allergy.reaction || 'unknown reaction'}, severity: ${allergy.severity}) but has active medication: ${med}`,
            source: 'DETERMINISTIC',
            metadata: JSON.stringify({ allergyId: allergy.id, substance: allergy.substance, medication: med }),
          })
        }
      }
    }

    // 2. Drug interaction check
    if (activeMeds.length > 1) {
      for (let i = 0; i < activeMeds.length; i++) {
        for (let j = i + 1; j < activeMeds.length; j++) {
          const med1 = activeMeds[i].toLowerCase().replace(/\s+/g, '_')
          const med2 = activeMeds[j].toLowerCase().replace(/\s+/g, '_')

          const interaction = DRUG_INTERACTIONS[med1]?.[med2] || DRUG_INTERACTIONS[med2]?.[med1]
          if (interaction) {
            alerts.push({
              type: 'INTERACTION',
              severity: 'WARNING',
              message: `Drug interaction: ${activeMeds[i]} + ${activeMeds[j]} - ${interaction}`,
              source: 'DETERMINISTIC',
              metadata: JSON.stringify({ medication1: activeMeds[i], medication2: activeMeds[j], interaction }),
            })
          }
        }
      }
    }

    // 3. Red flag symptom check
    const symptoms = await db.symptom.findMany({
      where: { patientId, encounterId: encounterId ?? undefined },
    })

    for (const symptom of symptoms) {
      for (const redFlag of RED_FLAG_SYMPTOMS) {
        if (redFlag.pattern.test(symptom.name)) {
          alerts.push({
            type: 'RED_FLAG',
            severity: redFlag.severity,
            message: `Red flag symptom: ${symptom.name} - ${redFlag.message}`,
            source: 'DETERMINISTIC',
            metadata: JSON.stringify({ symptomId: symptom.id, symptomName: symptom.name }),
          })
        }
      }
    }

    // Persist alerts to database
    const createdAlerts = await Promise.all(
      alerts.map((alert) =>
        db.safetyAlert.create({
          data: {
            patientId,
            encounterId: encounterId ?? null,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            source: alert.source,
            metadata: alert.metadata,
          },
        })
      )
    )

    // Audit
    const patient = await db.patient.findUnique({ where: { id: patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        action: 'SAFETY_CHECK',
        resourceType: 'SafetyAlert',
        patientId,
        encounterId: encounterId ?? null,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ alertCount: createdAlerts.length }),
      },
    })

    return NextResponse.json({ data: createdAlerts, summary: { total: createdAlerts.length } })
  } catch (error) {
    console.error('[SAFETY_CHECK]', error)
    return NextResponse.json({ error: 'Failed to run safety checks' }, { status: 500 })
  }
}

// ─── PUT: Acknowledge safety alert ───────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = acknowledgeAlertSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, acknowledgedBy } = parsed.data

    const existing = await db.safetyAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Safety alert not found' }, { status: 404 })
    }

    if (existing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Alert already ${existing.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    const alert = await db.safetyAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    })

    // Audit
    const patient = await db.patient.findUnique({ where: { id: existing.patientId } })
    await db.auditEvent.create({
      data: {
        tenantId: patient?.tenantId ?? 'unknown',
        actorId: acknowledgedBy,
        action: 'ACKNOWLEDGE',
        resourceType: 'SafetyAlert',
        resourceId: id,
        patientId: existing.patientId,
        outcome: 'SUCCESS',
      },
    })

    return NextResponse.json({ data: alert })
  } catch (error) {
    console.error('[SAFETY_ACKNOWLEDGE]', error)
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
  }
}
