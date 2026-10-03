import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { zai } from 'z-ai-web-dev-sdk'

// ─── Validation Schema ────────────────────────────────────────────

const medicineRagSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  modality: z.string().default('ALLOPATHY'),
  language: z.string().default('en'),
  patientId: z.string().optional(),
  includeInteractions: z.boolean().default(true),
  includeContraindications: z.boolean().default(true),
  includeTreatmentPatterns: z.boolean().default(true),
})

// ─── POST: Medicine Knowledge RAG ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = medicineRagSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      query,
      modality,
      language,
      patientId,
      includeInteractions,
      includeContraindications,
      includeTreatmentPatterns,
    } = parsed.data

    // ── Step 1: Search medicines from database ──
    const medicines = await db.medicine.findMany({
      where: {
        isActive: true,
        modality,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: {
        ingredients: true,
        indications: {
          include: { issue: { select: { id: true, name: true, bodySystem: true } } },
        },
        contraindications: includeContraindications,
        interactions: includeInteractions,
        warnings: true,
        sideEffects: true,
        populationRules: true,
        recalls: { where: { isActive: true } },
        brands: { where: { isActive: true }, take: 3 },
      },
    })

    // ── Step 2: Search related health issues ──
    const healthIssues = await db.healthIssue.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { symptomGroup: { contains: query, mode: 'insensitive' } },
          { aliases: { some: { alias: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      take: 5,
      include: {
        wingApproaches: { where: { modality } },
        aliases: { where: { language } },
        translations: { where: { language } },
      },
    })

    // ── Step 3: Search treatment patterns ──
    let treatmentPatterns: Array<{
      id: string
      name: string
      modality: string
      description: string | null
      evidenceLevel: string | null
      frequency: number
      medicines: Array<{ medicineId: string; isPrimary: boolean; notes: string | null; medicine: { name: string } }>
    }> = []

    if (includeTreatmentPatterns) {
      treatmentPatterns = await db.treatmentPattern.findMany({
        where: {
          modality,
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: {
          medicines: {
            include: {
              medicine: { select: { name: true } },
            },
          },
        },
      })
    }

    // ── Step 4: Check patient context if provided ──
    let patientContext = null
    if (patientId) {
      const [patient, allergies, activeMeds] = await Promise.all([
        db.patient.findUnique({
          where: { id: patientId },
          select: { id: true, firstName: true, lastName: true, bloodGroup: true, dateOfBirth: true, gender: true },
        }),
        db.allergy.findMany({
          where: { patientId },
          select: { substance: true, reaction: true, severity: true },
        }),
        db.medicationStatement.findMany({
          where: { patientId, isActive: true },
          select: { medication: true, dosage: true, frequency: true },
        }),
      ])

      if (patient) {
        patientContext = {
          patient: { id: patient.id, name: `${patient.firstName} ${patient.lastName}`, bloodGroup: patient.bloodGroup, dateOfBirth: patient.dateOfBirth, gender: patient.gender },
          allergies,
          activeMedications: activeMeds,
        }

        // Check for interactions with found medicines
        if (includeInteractions && activeMeds.length > 0 && medicines.length > 0) {
          const interactionAlerts: Array<{ medicine: string; interactingWith: string; effect: string; severity: string }> = []
          for (const med of medicines) {
            for (const interaction of med.interactions) {
              const matchesPatientMed = activeMeds.some(m =>
                m.medication.toLowerCase().includes(interaction.interactingWith.toLowerCase()) ||
                interaction.interactingWith.toLowerCase().includes(m.medication.toLowerCase())
              )
              if (matchesPatientMed) {
                interactionAlerts.push({
                  medicine: med.name,
                  interactingWith: interaction.interactingWith,
                  effect: interaction.effect,
                  severity: interaction.severity,
                })
              }
            }
            // Check allergies
            for (const allergy of allergies) {
              const matchesMed = med.ingredients.some(i =>
                i.ingredient.toLowerCase().includes(allergy.substance.toLowerCase()) ||
                allergy.substance.toLowerCase().includes(i.ingredient.toLowerCase())
              )
              if (matchesMed) {
                interactionAlerts.push({
                  medicine: med.name,
                  interactingWith: `Allergy: ${allergy.substance}`,
                  effect: `Patient is allergic to ${allergy.substance} (${allergy.reaction || 'unknown reaction'})`,
                  severity: allergy.severity === 'LIFE_THREATENING' ? 'SEVERE' : 'MAJOR',
                })
              }
            }
          }
          patientContext = { ...patientContext, interactionAlerts }
        }
      }
    }

    // ── Step 5: Build knowledge context for AI ──
    const knowledgeContext = {
      query,
      modality,
      foundMedicines: medicines.map(m => ({
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        form: m.form,
        strength: m.strength,
        ingredients: m.ingredients.map(i => `${i.ingredient} ${i.quantity || ''}`).join(', '),
        indications: m.indications.map(i => i.indication).join('; '),
        contraindications: includeContraindications ? m.contraindications.map(c => c.contraindication).join('; ') : undefined,
        interactions: includeInteractions ? m.interactions.map(i => `${i.interactingWith}: ${i.effect}`).join('; ') : undefined,
        warnings: m.warnings.map(w => w.warning).join('; '),
        sideEffects: m.sideEffects.map(s => s.sideEffect).join('; '),
        hasActiveRecall: m.recalls.length > 0,
        brands: m.brands.map(b => b.brandName).join(', '),
      })),
      foundHealthIssues: healthIssues.map(h => ({
        name: h.name,
        bodySystem: h.bodySystem,
        clinicalDomain: h.clinicalDomain,
        severity: h.severity,
        chronicity: h.chronicity,
        approach: h.wingApproaches[0]?.approach,
        commonMedicines: h.wingApproaches[0]?.commonMedicines,
        redFlags: h.wingApproaches[0]?.redFlags,
        localNames: h.aliases.map(a => a.alias).join(', '),
      })),
      foundTreatmentPatterns: treatmentPatterns.map(t => ({
        name: t.name,
        description: t.description,
        evidenceLevel: t.evidenceLevel,
        frequency: t.frequency,
        medicines: t.medicines.map(m => `${m.medicine.name}${m.isPrimary ? ' (primary)' : ''}`).join(', '),
      })),
      patientContext: patientContext ? {
        allergies: patientContext.allergies.map(a => a.substance),
        activeMedications: patientContext.activeMedications.map(m => m.medication),
        interactionAlerts: patientContext.interactionAlerts?.map(a => `${a.medicine} + ${a.interactingWith}: ${a.effect}`),
      } : null,
    }

    // ── Step 6: AI-Enhanced Response via z-ai-web-dev-sdk ──
    let aiResponse: string | null = null
    let evidenceCitations: Array<{ source: string; type: string; confidence: string }> = []

    try {
      const sdk = zai()
      const llm = sdk.llm()

      const systemPrompt = `You are a clinical medicine knowledge assistant for the Indian healthcare system. You support three modalities: Allopathy, Ayurveda, and Homeopathy (NEVER merge these — they are separate care tracks).

Your role:
- Provide evidence-based medicine information
- Reference CDSCO (Central Drugs Standard Control Organisation) guidelines
- Include safety warnings, contraindications, and drug interactions
- Consider Indian population factors (prevalence of TB, diabetes, dengue, etc.)
- Respect modality isolation — treatment advice must stay within the specified modality
- When patient context is available, personalize recommendations and flag safety concerns
- Always include evidence citations where available
- Be conservative with recommendations — prioritize patient safety

Format your response clearly with sections:
1. Summary
2. Medicine Information (if applicable)
3. Safety Considerations
4. Treatment Approach (modality-specific)
5. Evidence & Citations
6. Disclaimer

Respond in ${language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : language === 'ta' ? 'Tamil' : 'English'}.`

      const userPrompt = `Query: ${query}
Modality: ${modality}

Knowledge Base Context:
${JSON.stringify(knowledgeContext, null, 2)}

Please provide a comprehensive clinical answer based on the above context and your training data.`

      const response = await llm.chat({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      aiResponse = response.choices?.[0]?.message?.content || response.content || null

      // Build citations
      evidenceCitations = [
        ...medicines.map(m => ({ source: `Medicine DB: ${m.name}`, type: 'DATABASE', confidence: m.indications[0]?.evidenceLevel || 'MODERATE' })),
        ...healthIssues.map(h => ({ source: `Health Issue: ${h.name}`, type: 'TAXONOMY', confidence: h.wingApproaches[0]?.evidenceLevel || 'MODERATE' })),
        ...treatmentPatterns.map(t => ({ source: `Treatment Pattern: ${t.name}`, type: 'CLINICAL_CONSENSUS', confidence: t.evidenceLevel || 'MODERATE' })),
      ]
    } catch (aiError) {
      console.error('[MEDICINE_RAG_AI]', aiError)
      // Fallback: provide structured response without AI enhancement
      aiResponse = buildFallbackResponse(query, modality, knowledgeContext)
      evidenceCitations = medicines.map(m => ({ source: `Medicine DB: ${m.name}`, type: 'DATABASE', confidence: 'MODERATE' }))
    }

    // ── Step 7: Compile final response ──
    const result = {
      query,
      modality,
      language,
      aiResponse,
      medicines: medicines.map(m => ({
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        form: m.form,
        strength: m.strength,
        modality: m.modality,
        manufacturer: m.manufacturer,
        isOTC: m.isOTC,
        isPrescription: m.isPrescription,
        ingredients: m.ingredients.map(i => ({ ingredient: i.ingredient, quantity: i.quantity, role: i.role })),
        indications: m.indications.map(i => ({ indication: i.indication, whyToUse: i.whyToUse, whenToUse: i.whenToUse, howToUseDaily: i.howToUseDaily, medianDose: i.medianDose, duration: i.duration, evidenceLevel: i.evidenceLevel, issue: i.issue })),
        contraindications: includeContraindications ? m.contraindications.map(c => ({ contraindication: c.contraindication, reason: c.reason, severity: c.severity, population: c.population })) : [],
        interactions: includeInteractions ? m.interactions.map(i => ({ interactingWith: i.interactingWith, interactionType: i.interactionType, severity: i.severity, effect: i.effect, recommendation: i.recommendation })) : [],
        warnings: m.warnings.map(w => ({ warning: w.warning, category: w.category })),
        sideEffects: m.sideEffects.map(s => ({ sideEffect: s.sideEffect, frequency: s.frequency, severity: s.severity, isReversible: s.isReversible, management: s.management })),
        populationSafety: m.populationRules.map(p => ({ population: p.population, safetyCategory: p.safetyCategory, rationale: p.rationale })),
        hasActiveRecall: m.recalls.length > 0,
        recalls: m.recalls.map(r => ({ reason: r.reason, severity: r.severity, batchNumber: r.batchNumber })),
        brands: m.brands.map(b => ({ brandName: b.brandName, manufacturer: b.manufacturer, mrp: b.mrp })),
      })),
      healthIssues: healthIssues.map(h => ({
        id: h.id,
        name: h.name,
        code: h.code,
        bodySystem: h.bodySystem,
        clinicalDomain: h.clinicalDomain,
        severity: h.severity,
        chronicity: h.chronicity,
        approach: h.wingApproaches[0]?.approach,
        commonMedicines: h.wingApproaches[0]?.commonMedicines,
        lifestyleAdvice: h.wingApproaches[0]?.lifestyleAdvice,
        whenToSeeDoctor: h.wingApproaches[0]?.whenToSeeDoctor,
        redFlags: h.wingApproaches[0]?.redFlags,
        evidenceLevel: h.wingApproaches[0]?.evidenceLevel,
        localNames: h.aliases.map(a => a.alias),
        translation: h.translations[0]?.name,
      })),
      treatmentPatterns: treatmentPatterns.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        evidenceLevel: t.evidenceLevel,
        frequency: t.frequency,
        medicines: t.medicines.map(m => ({
          medicineName: m.medicine.name,
          isPrimary: m.isPrimary,
          sequence: m.notes,
        })),
      })),
      patientContext,
      safetyWarnings: [
        ...(patientContext?.interactionAlerts?.map(a => ({
          type: 'INTERACTION' as const,
          severity: a.severity,
          message: `${a.medicine} + ${a.interactingWith}: ${a.effect}`,
        })) ?? []),
        ...medicines.filter(m => m.recalls.length > 0).map(m => ({
          type: 'RECALL' as const,
          severity: 'CRITICAL' as const,
          message: `${m.name} has an active recall: ${m.recalls[0].reason}`,
        })),
      ],
      evidenceCitations,
      disclaimer: 'This information is for clinical decision support only. All recommendations must be reviewed and approved by a qualified healthcare practitioner before patient administration. This does not replace professional medical advice.',
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[MEDICINE_RAG]', error)
    return NextResponse.json({ error: 'Failed to process medicine knowledge query' }, { status: 500 })
  }
}

// ─── Fallback Response Builder (when AI is unavailable) ───────────

function buildFallbackResponse(
  query: string,
  modality: string,
  context: {
    foundMedicines: Array<Record<string, unknown>>
    foundHealthIssues: Array<Record<string, unknown>>
    foundTreatmentPatterns: Array<Record<string, unknown>>
    patientContext: Record<string, unknown> | null
  }
): string {
  const modalityLabel = modality === 'ALLOPATHY' ? 'Allopathy' : modality === 'AYURVEDA' ? 'Ayurveda' : 'Homeopathy'

  let response = `## Medicine Knowledge Query: "${query}"\n\n`
  response += `**Modality:** ${modalityLabel}\n\n`

  if (context.foundMedicines.length > 0) {
    response += `### Medicines Found\n`
    for (const med of context.foundMedicines) {
      response += `- **${med.name}**${med.genericName ? ` (${med.genericName})` : ''}\n`
      response += `  - Category: ${med.category || 'N/A'} | Form: ${med.form || 'N/A'} | Strength: ${med.strength || 'N/A'}\n`
      if (med.ingredients) response += `  - Ingredients: ${med.ingredients}\n`
      if (med.indications) response += `  - Indications: ${med.indications}\n`
      if (med.contraindications) response += `  - ⚠️ Contraindications: ${med.contraindications}\n`
      if (med.interactions) response += `  - ⚠️ Interactions: ${med.interactions}\n`
      if (med.hasActiveRecall) response += `  - 🚨 **ACTIVE RECALL**\n`
    }
    response += '\n'
  }

  if (context.foundHealthIssues.length > 0) {
    response += `### Related Health Issues\n`
    for (const issue of context.foundHealthIssues) {
      response += `- **${issue.name}** (${issue.bodySystem})\n`
      if (issue.approach) response += `  - ${modalityLabel} Approach: ${issue.approach}\n`
      if (issue.redFlags) response += `  - 🚩 Red Flags: ${issue.redFlags}\n`
    }
    response += '\n'
  }

  if (context.foundTreatmentPatterns.length > 0) {
    response += `### Treatment Patterns\n`
    for (const pattern of context.foundTreatmentPatterns) {
      response += `- **${pattern.name}** (Evidence: ${pattern.evidenceLevel || 'N/A'})\n`
      if (pattern.medicines) response += `  - Medicines: ${pattern.medicines}\n`
    }
    response += '\n'
  }

  if (context.patientContext) {
    response += `### Patient-Safety Considerations\n`
    const pc = context.patientContext as Record<string, unknown>
    if (Array.isArray(pc.interactionAlerts) && pc.interactionAlerts.length > 0) {
      response += `**⚠️ Interaction Alerts:**\n`
      for (const alert of pc.interactionAlerts as string[]) {
        response += `- ${alert}\n`
      }
    }
    response += '\n'
  }

  response += `### Disclaimer\nThis information is for clinical decision support only. All recommendations must be reviewed by a qualified healthcare practitioner.`

  return response
}
