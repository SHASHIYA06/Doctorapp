import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// Clinician-governed AI clinical draft generation
// IMPORTANT: AI output is a DRAFT requiring human clinician review.
// This system does NOT autonomously diagnose, prescribe, or replace clinician judgment.

const SAFETY_POLICY = `SAFETY POLICY - HIGHEST PRIORITY:
- You are a clinical decision-support tool, NOT an autonomous doctor.
- NEVER make definitive diagnoses.
- NEVER prescribe specific medications or dosages.
- NEVER replace clinician judgment.
- If you lack sufficient evidence, state "INSUFFICIENT EVIDENCE - REQUIRES CLINICIAN EVALUATION".
- If the situation involves emergency indicators, state "EMERGENCY INDICATORS DETECTED - IMMEDIATE CLINICAL ATTENTION REQUIRED".
- All output is a DRAFT requiring explicit clinician sign-off before any patient sees it.
- Commercial considerations must NEVER influence clinical recommendations.`

const MODALITY_POLICIES: Record<string, string> = {
  ALLOPATHY: `MODALITY: ALLOPATHY (Conventional Medicine)
- Use evidence-based conventional medical terminology
- Reference standard clinical guidelines (WHO, NICE, ICMR where applicable)
- Standard diagnostic and therapeutic approaches
- Pharmacovigilance considerations apply`,

  AYURVEDA: `MODALITY: AYURVEDA (Traditional Indian Medicine)
- Use Ayurvedic terminology (Dosha, Prakriti, Vikriti, etc.)
- Reference Ayurvedic classical texts (Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya)
- Consider Nadi Pariksha, tongue diagnosis, etc.
- Note: Ayurvedic recommendations require qualified Ayurvedic practitioner review
- Herb-drug interactions must be flagged if patient is on allopathic medications`,

  HOMEOPATHY: `MODALITY: HOMEOPATHY
- Use homeopathic terminology (Materia Medica, Repertory, Potency, etc.)
- Reference standard homeopathic references (Kent's Repertory, Boericke's Materia Medica)
- Consider constitutional remedy approach
- Note: Homeopathic recommendations require qualified homeopathic practitioner review
- Do NOT recommend stopping existing allopathic medications without clinician approval`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, encounterId, modality, task, patientContext } = body

    // Validate required fields
    if (!patientId || !modality || !task) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, modality, task' },
        { status: 400 }
      )
    }

    // Validate modality isolation
    if (!['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'].includes(modality)) {
      return NextResponse.json(
        { error: 'Invalid modality. Must be ALLOPATHY, AYURVEDA, or HOMEOPATHY' },
        { status: 400 }
      )
    }

    // Check patient exists
    const patient = await db.patient.findUnique({
      where: { id: patientId },
      include: {
        allergies: true,
        medicationStatements: { where: { isActive: true } },
        conditions: { where: { status: 'ACTIVE' } },
        symptoms: { orderBy: { createdAt: 'desc' }, take: 10 },
        consents: { where: { status: 'GRANTED' } }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check AI consent
    const aiConsent = patient.consents.find(c => c.type === 'AI_ASSISTED' && c.modality === modality)
    if (!aiConsent) {
      return NextResponse.json(
        { error: 'AI_ASSISTED consent not granted for this modality', code: 'CONSENT_REQUIRED' },
        { status: 403 }
      )
    }

    // Build context packet (minimum necessary context - never dump entire patient record)
    const contextPacket = {
      requestId: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      modality,
      jurisdiction: 'IN',
      role: 'CLINICIAN',
      consent: { aiAssisted: true, modality },
      patientContext: {
        demographics: { age: patient.dateOfBirth, gender: patient.gender, bloodGroup: patient.bloodGroup },
        allergies: patient.allergies.map(a => ({ substance: a.substance, severity: a.severity, reaction: a.reaction })),
        activeMedications: patient.medicationStatements.map(m => ({ medication: m.medication, dosage: m.dosage, frequency: m.frequency, modality: m.modality })),
        activeConditions: patient.conditions.map(c => ({ name: c.name, code: c.code })),
        recentSymptoms: patient.symptoms.map(s => ({ name: s.name, severity: s.severity, onset: s.onset }))
      },
      task,
      excludedContext: ['address', 'phone', 'email', 'emergencyContact'] // PHI exclusions
    }

    // Assemble prompt with deterministic hierarchy
    const systemPrompt = [
      SAFETY_POLICY,
      '',
      MODALITY_POLICIES[modality],
      '',
      'JURISDICTION: India (IN)',
      'AUDIENCE: CLINICIAN (draft for clinician review only)',
      '',
      'OUTPUT REQUIREMENTS:',
      '- Structure your response as a clinical draft with clear sections',
      '- Include differential considerations where appropriate',
      '- Flag any safety concerns (allergies, interactions, contraindications)',
      '- Mark all recommendations as DRAFT - PENDING CLINICIAN REVIEW',
      '- If evidence is insufficient, explicitly state so rather than fabricating',
      '- Include relevant citations/references where possible',
      '- Do NOT include specific medication dosages (clinician determines dosage)',
      '- Note any follow-up recommendations',
      '- If emergency indicators present, flag prominently'
    ].join('\n')

    const userPrompt = `CLINICAL TASK: ${task}

PATIENT CONTEXT (modality: ${modality}):
${JSON.stringify(contextPacket.patientContext, null, 2)}

Generate a clinical draft for clinician review. Remember: this is a DRAFT that requires explicit clinician sign-off.`

    // Call LLM via z-ai-web-dev-sdk
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'disabled' }
    })

    const aiContent = completion.choices[0]?.message?.content

    if (!aiContent) {
      return NextResponse.json(
        { error: 'AI generation failed - empty response', code: 'AI_GENERATION_FAILED' },
        { status: 500 }
      )
    }

    // Store the clinical draft
    const draft = await db.clinicalDraft.create({
      data: {
        patientId,
        encounterId: encounterId || null,
        modality,
        content: JSON.stringify({
          task,
          draft: aiContent,
          contextPacketId: contextPacket.requestId,
          generatedAt: new Date().toISOString()
        }),
        aiGenerated: true,
        citations: JSON.stringify([]),
        safetyFlags: JSON.stringify([]),
        status: 'DRAFT'
      }
    })

    // Create audit event
    const tenant = await db.tenant.findFirst()
    if (tenant) {
      await db.auditEvent.create({
        data: {
          tenantId: tenant.id,
          actorRole: 'AI_SYSTEM',
          patientId,
          encounterId: encounterId || null,
          action: 'AI_DRAFT_GENERATED',
          resourceType: 'ClinicalDraft',
          resourceId: draft.id,
          outcome: 'SUCCESS',
          metadata: JSON.stringify({
            modality,
            task,
            contextPacketId: contextPacket.requestId,
            aiGenerated: true
          })
        }
      })
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        content: aiContent,
        modality,
        status: 'DRAFT',
        aiGenerated: true,
        contextPacketId: contextPacket.requestId,
        createdAt: draft.createdAt
      },
      contextPacket,
      safetyDisclaimer: 'AI-generated clinical content is a DRAFT requiring appropriate human review. This system does not autonomously diagnose, prescribe, or replace clinician judgment.'
    })

  } catch (error) {
    console.error('AI draft generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
