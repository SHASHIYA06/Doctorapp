import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Validation Schemas ───────────────────────────────────────────

const runTriageSchema = z.object({
  encounterId: z.string().min(1, 'Encounter ID is required'),
})

// ─── GET: List triage rules ──────────────────────────────────────

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const modality = searchParams.get('modality')

    const where: Record<string, unknown> = { isActive: true }
    if (modality) where.modality = modality

    const rules = await db.triageRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: rules })
  } catch (error) {
    console.error('[TRIAGE_RULES_LIST]', error)
    return NextResponse.json({ error: 'Failed to list triage rules' }, { status: 500 })
  }
}

// ─── POST: Run triage assessment ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = runTriageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { encounterId } = parsed.data

    // Get encounter with related data
    const encounter = await db.encounter.findUnique({
      where: { id: encounterId },
      include: {
        intake: true,
        patient: {
          include: {
            symptoms: { where: { encounterId } },
            allergies: true,
            medicationStatements: { where: { isActive: true } },
            safetyAlerts: { where: { status: 'ACTIVE', severity: { in: ['EMERGENCY', 'CRITICAL'] } } },
          },
        },
      },
    })

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
    }

    // Get active triage rules for this modality
    const rules = await db.triageRule.findMany({
      where: { modality: encounter.modality, isActive: true },
    })

    // Evaluate triage
    let priority: 'EMERGENCY' | 'URGENT' | 'ROUTINE' = 'ROUTINE'
    const triggeredRuleIds: string[] = []
    const reasoning: string[] = []

    // Check for active emergency/critical safety alerts
    const hasEmergencyAlerts = encounter.patient.safetyAlerts.length > 0
    if (hasEmergencyAlerts) {
      priority = 'EMERGENCY'
      reasoning.push(`Patient has ${encounter.patient.safetyAlerts.length} active emergency/critical safety alerts`)
    }

    // Evaluate triage rules
    for (const rule of rules) {
      try {
        const condition = JSON.parse(rule.condition)
        const isMatch = evaluateCondition(condition, encounter)

        if (isMatch) {
          triggeredRuleIds.push(rule.id)
          reasoning.push(`Rule triggered: ${rule.name} → ${rule.priority}`)

          // Upgrade priority if rule demands higher
          if (rule.priority === 'EMERGENCY') {
            priority = 'EMERGENCY'
          } else if (rule.priority === 'URGENT' && priority === 'ROUTINE') {
            priority = 'URGENT'
          }
        }
      } catch {
        // Skip malformed rule conditions
        reasoning.push(`Rule skipped (parse error): ${rule.name}`)
      }
    }

    // Check symptom severity
    const hasSevereSymptom = encounter.patient.symptoms.some((s) => s.severity === 'SEVERE')
    if (hasSevereSymptom && priority === 'ROUTINE') {
      priority = 'URGENT'
      reasoning.push('Severe symptom detected - upgraded to URGENT')
    }

    // Check chief complaint red flags
    if (encounter.intake?.chiefComplaint) {
      const complaint = encounter.intake.chiefComplaint.toLowerCase()
      const redFlags = ['chest pain', 'breathing difficulty', 'severe bleeding', 'suicidal', 'anaphylaxis']
      if (redFlags.some((flag) => complaint.includes(flag))) {
        priority = 'EMERGENCY'
        reasoning.push('Red flag chief complaint detected - set to EMERGENCY')
      }
    }

    // Create triage assessment
    const assessment = await db.triageAssessment.create({
      data: {
        encounterId,
        priority,
        ruleIds: JSON.stringify(triggeredRuleIds),
        reasoning: reasoning.join('; '),
      },
    })

    // Update encounter priority
    await db.encounter.update({
      where: { id: encounterId },
      data: { priority },
    })

    // Audit
    await db.auditEvent.create({
      data: {
        tenantId: encounter.tenantId,
        action: 'TRIAGE_ASSESS',
        resourceType: 'TriageAssessment',
        resourceId: assessment.id,
        patientId: encounter.patientId,
        encounterId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ priority, triggeredRuleCount: triggeredRuleIds.length }),
      },
    })

    return NextResponse.json({
      data: assessment,
      summary: { priority, triggeredRules: triggeredRuleIds.length, reasoning },
    })
  } catch (error) {
    console.error('[TRIAGE_ASSESS]', error)
    return NextResponse.json({ error: 'Failed to run triage assessment' }, { status: 500 })
  }
}

// ─── Condition evaluator ─────────────────────────────────────────

function evaluateCondition(
  condition: Record<string, unknown>,
  encounter: Record<string, unknown>
): boolean {
  // Simple condition evaluation
  // Supports: { field: "path", operator: "eq|ne|in|contains", value: any }
  try {
    const field = condition.field as string
    const operator = condition.operator as string
    const value = condition.value

    // Get nested value from encounter
    const fieldValue = field.split('.').reduce((obj, key) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key]
      return undefined
    }, encounter as unknown)

    switch (operator) {
      case 'eq':
        return fieldValue === value
      case 'ne':
        return fieldValue !== value
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(value as string)
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      default:
        return false
    }
  } catch {
    return false
  }
}
