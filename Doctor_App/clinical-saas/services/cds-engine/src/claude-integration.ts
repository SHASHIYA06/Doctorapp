/**
 * Claude Integration for CDS
 * Handles API calls, prompt engineering, response parsing, and safety guardrails
 */

import { Anthropic } from '@langchain/anthropic';
import { CDSMessage, ClaudeResponse, RecommendationExtract, CDSConfig, CDSState } from './types';

/**
 * Claude Client Wrapper with CDS-specific prompting
 */
export class ClaudeClient {
  private client: Anthropic;
  private config: CDSConfig;
  private readonly SYSTEM_PROMPT = `You are a clinical decision support assistant for a regulated multi-modal healthcare platform.

CRITICAL CONSTRAINTS:
1. Only recommend medicines within the patient's declared modality (allopathy/ayurveda/homeopathy)
2. Always cite evidence sources (monograph IDs) and confidence levels
3. When triage level is EMERGENCY, flag for clinician review but do not contradict triage decision
4. Always check for drug interactions; warn clinician of severity
5. Generate explicit reasoning: why this medicine for this patient in this context
6. Confidence scores: 0.9+ = high (most confident), 0.6-0.89 = medium, <0.6 = low (consider alternatives)
7. Never invent medicines; only recommend from provided monograph database
8. Always acknowledge uncertainty; suggest specialist referral if confidence <0.6
9. Provide reasoning chain for audit trail transparency

MODALITY-SPECIFIC RULES:
- Allopathy: Modern pharmacology, evidence-based dosing (mg/kg), supported by RCTs
- Ayurveda: Herbal formulations, dosha balancing, classical texts (Charaka Samhita, Sushruta Samhita)
- Homeopathy: Potency/dilution rules (D, C scales), constitutional typing, repertorization

WORKFLOW PHASES:
- evidence_gathering: Ask targeted questions to fill clinical picture gaps. Suggest: vitals, labs, duration, severity, impact on life
- analysis: Synthesize evidence. Generate differential diagnosis (top 3-5). Check for drug interactions.
- recommendation: Provide ranked recommendations with confidence, sources, contraindications, reasoning
- review: Acknowledge clinician decisions. If override: require explicit rationale for audit.

SAFETY GUARDRAILS:
- EMERGENCY context: Recommendations support specialist evaluation, not delay response
- Triage override: If triage=EMERGENCY and recommendation contradicts, mark as override-required
- Confidence floor: <0.6 confidence → recommend specialist consultation
- Modality boundary: Refuse cross-modality recommendations with clear explanation
- Drug interactions: Severe/contraindicated interactions → flag prominently

OUTPUT FORMAT:
When providing recommendations, use this JSON structure for parsing:
{
  "recommendations": [
    {
      "medicine_name": "string",
      "dose": "string",
      "frequency": "string",
      "duration": "string",
      "route": "string",
      "rationale": "string",
      "confidence_score": number (0.0-1.0),
      "contraindications": ["string"],
      "interactions": [{"drug_name": "string", "severity": "string", "recommendation": "string"}]
    }
  ],
  "differential_diagnosis": [
    {"diagnosis_name": "string", "confidence_score": number, "supporting_evidence": ["string"]}
  ],
  "safety_concerns": ["string"],
  "specialist_referral_needed": boolean,
  "specialist_type": "string"
}

Be concise, precise, and patient-centric. Always prioritize safety.`;

  constructor(config: CDSConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.claude_api_key,
    });
  }

  /**
   * Generate evidence gathering questions
   */
  async generateEvidenceQuestions(state: CDSState): Promise<string[]> {
    const prompt = `Patient context:
- Triage level: ${state.triage_level}
- Chief complaint: ${state.evidence.patient_history.chief_complaint}
- Current medications: ${state.evidence.patient_history.medications_current
      .map((m) => m.medication_name)
      .join(', ')}
- Allergies: ${state.evidence.patient_history.allergies.map((a) => a.allergen).join(', ')}

Current evidence gaps: ${state.evidence_gaps.join(', ')}

What are the top 5 additional questions we should ask to build a complete clinical picture? Format as bullet points.`;

    const response = await this.callClaude(
      state.messages,
      prompt,
      'evidence_gathering'
    );

    const questions = this.parseQuestions(response.content[0].text);
    return questions;
  }

  /**
   * Analyze evidence and generate differential diagnosis
   */
  async analyzeEvidence(state: CDSState): Promise<RecommendationExtract> {
    const prompt = `Analyze this clinical case:

TRIAGE CONTEXT:
- Triage level: ${state.triage_level}
- Triggered rules: ${state.triage_result.triggered_rules?.join(', ')}

PATIENT EVIDENCE:
- Chief complaint: ${state.evidence.patient_history.chief_complaint}
- HPI: ${state.evidence.patient_history.history_of_present_illness}
- PMH: ${state.evidence.patient_history.past_medical_history.join(', ')}
- Medications: ${state.evidence.patient_history.medications_current.map((m) => m.medication_name).join(', ')}
- Allergies: ${state.evidence.patient_history.allergies.map((a) => a.allergen).join(', ')}
${state.evidence.vital_signs ? `- Vitals: Temp ${state.evidence.vital_signs.temperature_c}C, HR ${state.evidence.vital_signs.heart_rate_bpm}, BP ${state.evidence.vital_signs.blood_pressure}` : ''}
${state.evidence.severity_assessment ? `- Severity: ${state.evidence.severity_assessment.severity_level} (${state.evidence.severity_assessment.justification})` : ''}

MODALITY: ${state.modality}

Generate:
1. Top 3-5 differential diagnoses with confidence scores and supporting evidence
2. Any contraindications or safety concerns
3. Drug interaction risks with current medications
4. Whether specialist referral is needed

Provide response in JSON format as specified in system prompt.`;

    const response = await this.callClaude(
      state.messages,
      prompt,
      'analysis'
    );

    const extract = this.parseRecommendationExtract(response.content[0].text);
    return extract;
  }

  /**
   * Generate clinical recommendations
   */
  async generateRecommendations(state: CDSState, analysis: RecommendationExtract): Promise<string> {
    const prompt = `Based on the analysis:
- Top differential: ${analysis.differential_diagnosis[0]?.diagnosis_name}
- Confidence: ${analysis.differential_diagnosis[0]?.confidence_score}
- Key evidence: ${analysis.differential_diagnosis[0]?.supporting_evidence.join(', ')}

Generate the top 3-5 evidence-based recommendations for treating this patient in the ${state.modality} modality.

For each recommendation, provide:
1. Medicine name + dose + frequency + duration
2. Confidence score (0.0-1.0) and why
3. Which differential diagnosis it addresses
4. Contraindications and drug interactions
5. Monitoring parameters
6. Reasoning chain (why this for this patient)

Format as JSON per system prompt.`;

    const response = await this.callClaude(
      state.messages,
      prompt,
      'recommendation'
    );

    return response.content[0].text;
  }

  /**
   * Acknowledge clinician override and log rationale
   */
  async acknowledgeOverride(
    state: CDSState,
    recommendationId: string,
    rationale: string
  ): Promise<string> {
    const recommendation = state.recommendations.find((r) => r.recommendation_id === recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const prompt = `Clinician override:
- Original recommendation: ${recommendation.medicine_name} ${recommendation.dose}
- Original confidence: ${recommendation.confidence_score}
- Clinician rationale: "${rationale}"

Provide a brief acknowledgment (2-3 sentences) of the override and any notes for the clinical record.`;

    const response = await this.callClaude(
      state.messages,
      prompt,
      'review'
    );

    return response.content[0].text;
  }

  /**
   * Core Claude API call with message history
   */
  private async callClaude(
    messageHistory: CDSMessage[],
    newPrompt: string,
    phase: string
  ): Promise<ClaudeResponse> {
    // Build message array from history + new prompt
    const messages = messageHistory
      .filter((m) => m.role !== 'system') // System prompt handled separately
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Add new user message
    messages.push({
      role: 'user',
      content: newPrompt,
    });

    try {
      const response = await this.client.messages.create({
        model: this.config.claude_model,
        max_tokens: this.config.max_tokens,
        system: this.SYSTEM_PROMPT,
        messages,
        temperature: this.config.temperature,
      });

      return response as unknown as ClaudeResponse;
    } catch (error) {
      console.error(`Claude API error in phase ${phase}:`, error);
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse evidence gathering questions from Claude response
   */
  private parseQuestions(response: string): string[] {
    const lines = response
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    return lines.slice(0, 5);
  }

  /**
   * Parse recommendation extract from Claude JSON response
   */
  private parseRecommendationExtract(response: string): RecommendationExtract {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const extract = JSON.parse(jsonMatch[0]) as RecommendationExtract;
      return extract;
    } catch (error) {
      console.error('Failed to parse recommendation extract:', error);
      throw new Error(
        `Invalid recommendation format from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Safety Policy Enforcer
 */
export class SafetyPolicyEnforcer {
  /**
   * Check if recommendation violates modality boundaries
   */
  static validateModalityBoundary(medicine: string, modality: string, knownModalities: Map<string, string>): boolean {
    const medicineModality = knownModalities.get(medicine.toLowerCase());
    if (medicineModality && medicineModality !== modality) {
      return false; // Cross-modality violation
    }
    return true;
  }

  /**
   * Check drug interaction severity
   */
  static checkInteractionSeverity(
    severity: string
  ): { allowed: boolean; requiresWarning: boolean; requiresOverride: boolean } {
    switch (severity.toLowerCase()) {
      case 'contraindicated':
        return { allowed: false, requiresWarning: true, requiresOverride: true };
      case 'severe':
        return { allowed: true, requiresWarning: true, requiresOverride: true };
      case 'moderate':
        return { allowed: true, requiresWarning: true, requiresOverride: false };
      case 'minor':
        return { allowed: true, requiresWarning: false, requiresOverride: false };
      default:
        return { allowed: true, requiresWarning: false, requiresOverride: false };
    }
  }

  /**
   * Validate recommendation against safety thresholds
   */
  static validateConfidenceThreshold(
    confidenceScore: number,
    thresholdLow: number,
    thresholdHigh: number
  ): { valid: boolean; requiresSpecialistReferral: boolean; category: 'high' | 'medium' | 'low' } {
    if (confidenceScore >= thresholdHigh) {
      return { valid: true, requiresSpecialistReferral: false, category: 'high' };
    } else if (confidenceScore >= thresholdLow) {
      return { valid: true, requiresSpecialistReferral: false, category: 'medium' };
    } else {
      return { valid: true, requiresSpecialistReferral: true, category: 'low' };
    }
  }

  /**
   * Check emergency context compliance
   */
  static validateEmergencyContext(
    triageLevel: string,
    recommendationConfidence: number,
    override: boolean
  ): { compliant: boolean; reason: string } {
    if (triageLevel === 'emergency' && override && recommendationConfidence < 0.8) {
      return {
        compliant: false,
        reason: 'Emergency overrides require high confidence (>0.8) or explicit clinician rationale',
      };
    }
    return { compliant: true, reason: '' };
  }
}
