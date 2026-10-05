import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'
import {
  CLINICAL_CONDITIONS,
  interpretLabValue,
  getDoctorLikeResponse,
  matchSymptomsToConditions,
  type Modality,
  type MedicineRecommendation,
} from '@/lib/clinical-knowledge-base'

// ═══════════════════════════════════════════════════════════════════════
// CLINICAL ASSISTANT — Doctor-Like Response Engine
// Uses knowledge base + AI for comprehensive, detailed clinical guidance
// NEVER merges wings — Allopathy, Ayurveda, Homeopathy are separate
// ═══════════════════════════════════════════════════════════════════════

const clinicalAssistantSchema = z.object({
  query: z.string().min(1, 'Please describe your symptoms or health concern'),
  labValues: z.array(z.object({
    test: z.string(),
    value: z.number(),
  })).optional(),
  modality: z.enum(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']).default('ALLOPATHY'),
  language: z.string().default('en'),
  patientAge: z.number().optional(),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  includeAllWings: z.boolean().default(true),
})

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam',
  pa: 'Punjabi', or: 'Odia', ur: 'Urdu',
}

function formatMedicineRec(rec: MedicineRecommendation): string {
  let s = `### ${rec.medicineName} (${rec.genericName})\n`
  if (rec.indianBrandNames.length > 0) {
    s += `**Indian Brands:** ${rec.indianBrandNames.join(', ')}\n`
  }
  s += `**Dosage:** ${rec.dosage}\n`
  s += `**Frequency:** ${rec.frequency}\n`
  s += `**Duration:** ${rec.duration}\n`
  s += `**Route:** ${rec.route}\n`
  if (rec.isFirstLine) s += `⭐ **FIRST-LINE TREATMENT**\n`
  if (rec.isPrescription) s += `🔒 **PRESCRIPTION MEDICINE** — Requires doctor's prescription\n`
  else s += `🟢 **Available without prescription**\n`
  if (rec.janAushadhiAvailable) {
    s += `💊 **Jan Aushadhi Available** — Affordable generic version available at Jan Aushadhi stores\n`
    if (rec.janAushadhiPrice) s += `   Jan Aushadhi Price: ${rec.janAushadhiPrice}\n`
  }
  if (rec.mrp) s += `   MRP: ${rec.mrp}\n`
  s += `\n**WHY this medicine?**\n${rec.reasoning}\n`
  s += `\n**Precautions:**\n${rec.precautions.map(p => `• ${p}`).join('\n')}\n`
  s += `\n**Side Effects:**\n${rec.sideEffects.map(e => `• ${e}`).join('\n')}\n`
  s += `\n**Do NOT use if:**\n${rec.contraindications.map(c => `• ${c}`).join('\n')}\n`
  return s
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = clinicalAssistantSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { query, labValues, modality, language, patientAge, patientGender, includeAllWings } = parsed.data

    // ── Step 1: Match symptoms to conditions from knowledge base ──
    const matchedConditions = matchSymptomsToConditions(query)

    // ── Step 2: Find direct condition match ──
    let directMatch: string | null = null
    for (const [key] of Object.entries(CLINICAL_CONDITIONS)) {
      const condition = CLINICAL_CONDITIONS[key]
      if (
        query.toLowerCase().includes(condition.name.toLowerCase()) ||
        query.toLowerCase().includes(key.replace(/-/g, ' ')) ||
        condition.name.toLowerCase().includes(query.toLowerCase())
      ) {
        directMatch = key
        break
      }
    }

    // Also check for lab values that indicate conditions
    if (!directMatch && labValues && labValues.length > 0) {
      for (const lv of labValues) {
        if (lv.test.toLowerCase().includes('hba1c') && lv.value >= 6.5) directMatch = 'type-2-diabetes'
        else if ((lv.test.toLowerCase().includes('cholesterol') || lv.test.toLowerCase().includes('ldl')) && lv.value > 240) directMatch = 'hyperlipidemia'
        else if (lv.test.toLowerCase().includes('tsh') && lv.value > 4.5) directMatch = 'hypothyroidism'
        else if (lv.test.toLowerCase().includes('hemoglobin') && lv.value < 12) directMatch = 'anemia-iron-deficiency'
        else if (lv.test.toLowerCase().includes('glucose') && lv.value > 125) directMatch = 'type-2-diabetes'
      }
    }

    // ── Step 3: Get structured response from knowledge base ──
    const kbResponse = directMatch
      ? getDoctorLikeResponse(directMatch, labValues, modality)
      : matchedConditions.length > 0
        ? getDoctorLikeResponse(matchedConditions[0].conditionKey, labValues, modality)
        : null

    // ── Step 4: Interpret lab values ──
    const labInterpretations = labValues
      ?.map(lv => interpretLabValue(lv.test, lv.value))
      .filter(Boolean) ?? []

    // ── Step 5: Build comprehensive response with AI enhancement ──
    let aiEnhancedContent: string | null = null

    try {
      const zai = await ZAI.create()
      const targetLanguage = LANGUAGE_MAP[language] || 'English'

      // Build the system prompt — this is what makes it act like a REAL doctor
      const systemPrompt = `You are an EXPERT CLINICAL DOCTOR AI assistant for the Indian healthcare system. You provide DETAILED, COMPREHENSIVE medical guidance that a REAL doctor would give to a patient.

CRITICAL RULES:
1. You MUST give SPECIFIC medicine names with DOSAGES, FREQUENCY, and DURATION — NOT vague advice
2. You MUST explain WHY each medicine is recommended — the clinical reasoning
3. You MUST give INDIAN BRAND NAMES for medicines commonly available in India
4. You MUST mention Jan Aushadhi (affordable generic) availability and prices where applicable
5. You MUST provide DETAILED precautions, side effects, and contraindications
6. You MUST give specific LIFESTYLE and DIET advice with actionable details
7. You MUST interpret any LAB VALUES provided with reference ranges and clinical significance
8. You MUST flag RED FLAGS that require emergency medical attention
9. You MUST follow up recommendations — what tests to repeat and when
10. You support THREE separate care tracks that are NEVER merged:
   - ALLOPATHY (Conventional Medicine) — evidence-based, with specific drug names and dosages
   - AYURVEDA (Traditional Indian Medicine) — with classical references (Charaka/Sushruta Samhita), specific herbs, formulations, dosages
   - HOMEOPATHY — with specific remedies, potencies, and indications from Materia Medica

RESPONSE FORMAT — Be EXTREMELY DETAILED and COMPREHENSIVE:
1. 📊 CONDITION OVERVIEW — What it is, how common, who is affected
2. 🔬 LAB INTERPRETATION — If lab values provided: interpret EACH value with reference range, status, clinical significance, and specific action
3. 💊 ALLOPATHY RECOMMENDATIONS — For EACH medicine: Name, Generic name, Indian brands, Dosage, Frequency, Duration, WHY (clinical reasoning with guideline references), Precautions, Side effects, Contraindications, Jan Aushadhi info
4. 🌿 AYURVEDA RECOMMENDATIONS — For EACH medicine: Name, Classical reference, Dosage, Duration, WHY (Ayurvedic reasoning), Precautions, Side effects, Contraindications
5. 🔮 HOMEOPATHY RECOMMENDATIONS — For EACH remedy: Name, Potency, Frequency, WHY (homeopathic indication), Precautions
6. 🏃 LIFESTYLE ADVICE — Specific, actionable daily recommendations
7. 🥗 DIET ADVICE — Specific foods to eat and avoid with Indian dietary context
8. 🚩 RED FLAGS — When to seek IMMEDIATE medical attention
9. 📅 FOLLOW-UP — When to see doctor again, what tests to repeat
10. ⚕️ DISCLAIMER

IMPORTANT: Write at least 500-800 words. Be as detailed and specific as a real doctor consultation. Include specific numbers, dosages, and timeframes. Never give vague advice like "consult a doctor" without also giving specific interim guidance.

Respond in ${targetLanguage}.`

      // Build user prompt with all context
      let userPrompt = `PATIENT QUERY: "${query}"\n`
      userPrompt += `Preferred Modality: ${modality}\n`
      if (includeAllWings) userPrompt += `Show ALL three wings (Allopathy, Ayurveda, Homeopathy)\n`
      if (patientAge) userPrompt += `Patient Age: ${patientAge}\n`
      if (patientGender) userPrompt += `Patient Gender: ${patientGender}\n`

      if (labValues && labValues.length > 0) {
        userPrompt += `\nLAB VALUES PROVIDED:\n`
        for (const lv of labValues) {
          userPrompt += `- ${lv.test}: ${lv.value}\n`
        }
      }

      if (kbResponse) {
        userPrompt += `\nKNOWLEDGE BASE DATA (use this as foundation, enhance with your expertise):\n`
        userPrompt += `Condition: ${kbResponse.conditionName}\n`

        // Add structured medicine data
        if (kbResponse.allopathyRecommendations.length > 0) {
          userPrompt += `\nALLOPATHY MEDICINES FROM KNOWLEDGE BASE:\n`
          for (const rec of kbResponse.allopathyRecommendations) {
            userPrompt += formatMedicineRec(rec) + '\n'
          }
        }
        if (kbResponse.ayurvedaRecommendations.length > 0) {
          userPrompt += `\nAYURVEDA MEDICINES FROM KNOWLEDGE BASE:\n`
          for (const rec of kbResponse.ayurvedaRecommendations) {
            userPrompt += formatMedicineRec(rec) + '\n'
          }
        }
        if (kbResponse.homeopathyRecommendations.length > 0) {
          userPrompt += `\nHOMEOPATHY REMEDIES FROM KNOWLEDGE BASE:\n`
          for (const rec of kbResponse.homeopathyRecommendations) {
            userPrompt += formatMedicineRec(rec) + '\n'
          }
        }

        userPrompt += `\nLIFESTYLE ADVICE: ${kbResponse.lifestyleAdvice.join('; ')}\n`
        userPrompt += `DIET ADVICE: ${kbResponse.dietAdvice.join('; ')}\n`
        userPrompt += `RED FLAGS: ${kbResponse.safetyWarnings.join('; ')}\n`
        userPrompt += `FOLLOW-UP: ${kbResponse.followUpAdvice.join('; ')}\n`
        userPrompt += `WHEN TO SEE DOCTOR: ${kbResponse.whenToSeeDoctor}\n`
      }

      if (labInterpretations.length > 0) {
        userPrompt += `\nLAB VALUE INTERPRETATIONS:\n`
        for (const lab of labInterpretations) {
          userPrompt += `- ${lab.testName}: ${lab.value} ${lab.unit} [Reference: ${lab.referenceRange}] → ${lab.status}\n`
          userPrompt += `  Clinical Significance: ${lab.clinicalSignificance}\n`
          userPrompt += `  Recommended Action: ${lab.recommendedAction}\n`
          userPrompt += `  Follow-up Tests: ${lab.followUpTests.join(', ')}\n`
        }
      }

      if (matchedConditions.length > 0 && !directMatch) {
        userPrompt += `\nPOSSIBLE CONDITIONS (matched from symptoms):\n`
        for (const mc of matchedConditions) {
          userPrompt += `- ${mc.conditionName} (confidence: ${Math.round(mc.confidence * 100)}%)\n`
        }
      }

      userPrompt += `\nProvide a COMPREHENSIVE, DETAILED clinical response as a real doctor would. Include specific medicine names, dosages, Indian brand names, reasoning, and actionable advice. Be thorough — this patient needs complete guidance.`

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' }
      })

      aiEnhancedContent = completion.choices?.[0]?.message?.content || null
    } catch (aiError) {
      console.error('[CLINICAL_ASSISTANT_AI]', aiError)
      // AI failed — use knowledge base response as fallback
    }

    // ── Step 6: Compile final comprehensive response ──
    const result = {
      query,
      modality,
      language,
      matchedConditions: matchedConditions.map(mc => ({
        key: mc.conditionKey,
        name: mc.conditionName,
        confidence: Math.round(mc.confidence * 100),
      })),
      directMatch: directMatch ? {
        key: directMatch,
        name: CLINICAL_CONDITIONS[directMatch]?.name || directMatch,
      } : null,
      labInterpretations: labInterpretations.map(lab => ({
        testName: lab.testName,
        value: lab.value,
        unit: lab.unit,
        referenceRange: lab.referenceRange,
        status: lab.status,
        clinicalSignificance: lab.clinicalSignificance,
        recommendedAction: lab.recommendedAction,
        followUpTests: lab.followUpTests,
        associatedConditions: lab.associatedConditions,
      })),
      knowledgeBaseResponse: kbResponse ? {
        conditionName: kbResponse.conditionName,
        patientFriendlySummary: kbResponse.patientFriendlySummary,
        allopathy: kbResponse.allopathyRecommendations,
        ayurveda: kbResponse.ayurvedaRecommendations,
        homeopathy: kbResponse.homeopathyRecommendations,
        lifestyle: kbResponse.lifestyleAdvice,
        diet: kbResponse.dietAdvice,
        redFlags: kbResponse.safetyWarnings,
        followUp: kbResponse.followUpAdvice,
        whenToSeeDoctor: kbResponse.whenToSeeDoctor,
      } : null,
      aiEnhancedResponse: aiEnhancedContent,
      disclaimer: '⚕️ DISCLAIMER: This is clinical decision-support information from an AI system, NOT a medical prescription. All medicine recommendations must be reviewed and approved by a qualified registered medical practitioner (RMP) before use. This does NOT replace professional medical advice, diagnosis, or treatment. Never start, stop, or change any medication without consulting your doctor. In emergencies, call 108 (India) or go to nearest hospital immediately. The three care modalities (Allopathy, Ayurveda, Homeopathy) are independent and should never be self-combined without practitioner guidance.',
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[CLINICAL_ASSISTANT]', error)
    return NextResponse.json({ error: 'Failed to process clinical query' }, { status: 500 })
  }
}
