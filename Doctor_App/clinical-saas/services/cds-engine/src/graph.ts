/**
 * LangGraph State Machine for CDS
 * Implements the state transitions and node execution logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CDSState,
  CDSPhase,
  CDSMessage,
  ClinicalEvidence,
  Recommendation,
  SafetyCheckResult,
  CDSConfig,
  CareplanDraft,
} from './types';
import { ClaudeClient, SafetyPolicyEnforcer } from './claude-integration';
import { createAuditPatterns } from '@audit/*';

/**
 * CDS Graph State Manager
 */
export class CDSGraph {
  private config: CDSConfig;
  private claudeClient: ClaudeClient;

  constructor(config: CDSConfig) {
    this.config = config;
    this.claudeClient = new ClaudeClient(config);
  }

  /**
   * Initialize CDS Session
   */
  async initializeSession(state: CDSState): Promise<Partial<CDSState>> {
    const systemMessage: CDSMessage = {
      role: 'system',
      content: `CDS Session initialized for patient ${state.patient_id}. Modality: ${state.modality}. Triage level: ${state.triage_level}.`,
      timestamp: new Date().toISOString(),
    };

    return {
      phase: 'evidence_gathering',
      phase_history: [
        ...(state.phase_history || []),
        {
          phase: 'evidence_gathering',
          timestamp: new Date().toISOString(),
          reason: 'Initial phase transition',
        },
      ],
      messages: [...state.messages, systemMessage],
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Gather Clinical Evidence
   */
  async gatherEvidence(state: CDSState): Promise<Partial<CDSState>> {
    try {
      // Generate targeted questions
      const questions = await this.claudeClient.generateEvidenceQuestions(state);

      const assistantMessage: CDSMessage = {
        role: 'assistant',
        content: `To complete the clinical picture, please provide:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
        timestamp: new Date().toISOString(),
      };

      // Add evidence gaps
      const gaps = questions.map((q) => q.substring(0, 50)); // First 50 chars as gap identifier

      return {
        messages: [...state.messages, assistantMessage],
        evidence_gaps: gaps,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        errors: [
          ...state.errors,
          {
            message: errorMessage,
            phase: 'evidence_gathering',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
        completion_status: 'error',
      };
    }
  }

  /**
   * Analyze Gathered Evidence
   */
  async analyzeEvidence(state: CDSState): Promise<Partial<CDSState>> {
    try {
      const extract = await this.claudeClient.analyzeEvidence(state);

      // Build analysis object
      const analysis = {
        session_id: state.session_id,
        differential_diagnosis: extract.differential_diagnosis || [],
        contraindications: extract.safety_concerns?.filter((s) => s.includes('contraindication')) || [],
        drug_interactions: [],
        monograph_matches: [],
        safety_concerns: extract.safety_concerns || [],
        specialist_referral_suggested: extract.specialist_referral_needed || false,
        specialist_type: extract.specialist_type,
        generated_at: new Date().toISOString(),
        model_version: this.config.claude_model,
        token_usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      const assistantMessage: CDSMessage = {
        role: 'assistant',
        content: `Analysis complete. Identified ${extract.differential_diagnosis.length} potential diagnoses. Safety concerns: ${extract.safety_concerns.length} items flagged.`,
        timestamp: new Date().toISOString(),
      };

      return {
        phase: 'recommendation',
        phase_history: [
          ...state.phase_history,
          {
            phase: 'recommendation',
            timestamp: new Date().toISOString(),
            reason: 'Analysis complete, moving to recommendations',
          },
        ],
        analysis,
        messages: [...state.messages, assistantMessage],
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        errors: [
          ...state.errors,
          {
            message: errorMessage,
            phase: 'analysis',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
        completion_status: 'error',
      };
    }
  }

  /**
   * Generate Recommendations
   */
  async generateRecommendations(state: CDSState): Promise<Partial<CDSState>> {
    try {
      if (!state.analysis) {
        throw new Error('Analysis not available for recommendations');
      }

      const recommendationsJson = await this.claudeClient.generateRecommendations(
        state,
        {
          recommendations: [],
          differential_diagnosis: state.analysis.differential_diagnosis,
          safety_concerns: state.analysis.safety_concerns,
          specialist_referral_needed: state.analysis.specialist_referral_suggested,
          specialist_type: state.analysis.specialist_type,
        }
      );

      // Parse recommendations (simplified parsing)
      const recommendations: Recommendation[] = state.analysis.differential_diagnosis
        .slice(0, this.config.max_recommendations)
        .map((diagnosis, index) => ({
          recommendation_id: uuidv4(),
          medicine_name: `Medicine for ${diagnosis.diagnosis_name}`,
          dose: '1 dose',
          frequency: 'as prescribed',
          duration: '7 days',
          route: 'oral',
          rationale: `Recommended for ${diagnosis.diagnosis_name} (${(diagnosis.confidence_score * 100).toFixed(0)}% confidence)`,
          confidence_score: diagnosis.confidence_score,
          confidence_category:
            diagnosis.confidence_score >= 0.85 ? 'high' : diagnosis.confidence_score >= 0.6 ? 'medium' : 'low',
          monograph_id: `mono_${index}`,
          sources: [],
          contraindications: [],
          interactions: [],
          relative_to_differential: diagnosis.diagnosis_name,
          reasoning_chain: recommendationsJson.substring(0, 200),
          requires_monitoring: diagnosis.confidence_score < 0.7,
          monitoring_parameters: ['vital signs', 'symptom response'],
          timestamp: new Date().toISOString(),
        }));

      const assistantMessage: CDSMessage = {
        role: 'assistant',
        content: `Generated ${recommendations.length} recommendations. Ready for clinician review.`,
        timestamp: new Date().toISOString(),
      };

      return {
        recommendations,
        messages: [...state.messages, assistantMessage],
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        errors: [
          ...state.errors,
          {
            message: errorMessage,
            phase: 'recommendation',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
        completion_status: 'error',
      };
    }
  }

  /**
   * Perform Safety Check
   */
  async performSafetyCheck(state: CDSState): Promise<Partial<CDSState>> {
    const safetyAlerts: string[] = [];

    // Check 1: Emergency context compliance
    if (state.triage_level === 'emergency') {
      for (const rec of state.recommendations) {
        const compliance = SafetyPolicyEnforcer.validateEmergencyContext(
          state.triage_level,
          rec.confidence_score,
          rec.clinician_decision === 'overridden'
        );
        if (!compliance.compliant) {
          safetyAlerts.push(`Emergency override warning: ${compliance.reason}`);
        }
      }
    }

    // Check 2: Low confidence recommendations
    for (const rec of state.recommendations) {
      if (rec.confidence_category === 'low') {
        safetyAlerts.push(`Low confidence recommendation: ${rec.medicine_name} (${(rec.confidence_score * 100).toFixed(0)}%)`);
      }
    }

    // Check 3: Interaction warnings
    for (const rec of state.recommendations) {
      for (const interaction of rec.interactions) {
        if (interaction.severity === 'severe' || interaction.severity === 'contraindicated') {
          safetyAlerts.push(`Drug interaction: ${interaction.drug_a} + ${interaction.drug_b} (${interaction.severity})`);
        }
      }
    }

    const result: SafetyCheckResult = {
      passed: safetyAlerts.length === 0,
      critical_alerts: state.safety_alerts,
      warnings: safetyAlerts,
      recommendations_flagged: state.recommendations
        .filter((r) => r.confidence_category === 'low')
        .map((r) => r.recommendation_id),
      requires_clinician_review: safetyAlerts.length > 0,
      reviewed_at: new Date().toISOString(),
    };

    return {
      phase: 'review',
      phase_history: [
        ...state.phase_history,
        {
          phase: 'review',
          timestamp: new Date().toISOString(),
          reason: `Safety check ${result.passed ? 'passed' : 'flagged warnings'}`,
        },
      ],
      safety_alerts: state.safety_alerts.concat(
        safetyAlerts.map((alert) => ({
          alert_id: uuidv4(),
          patient_id: state.patient_id,
          alert_type: 'cds_safety_flag',
          severity: 'medium',
          message: alert,
          resolved: false,
          created_at: new Date().toISOString(),
        }))
      ),
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Draft Care Plan
   */
  async draftCarePlan(state: CDSState): Promise<Partial<CDSState>> {
    const acceptedRecommendations = state.recommendations.filter(
      (r) => r.clinician_decision === 'accepted' || !r.clinician_decision
    );

    const careplan: CareplanDraft = {
      careplan_id: uuidv4(),
      patient_id: state.patient_id,
      encounter_id: state.encounter_id,
      modality: state.modality,
      triage_result: state.triage_result,
      medications: acceptedRecommendations.map((r) => ({
        medicine: r.medicine_name,
        dose: r.dose,
        frequency: r.frequency,
        duration: r.duration,
        rationale: r.rationale,
        monograph_id: r.monograph_id,
      })),
      lifestyle_recommendations: [
        'Follow clinical guidance',
        'Monitor for adverse reactions',
        'Follow up as recommended',
      ],
      follow_up_instructions: ['Return if symptoms worsen', 'Schedule follow-up visit in 1 week'],
      sources: state.recommendations.map((r) => r.monograph_id),
      created_by_cds_session: state.session_id,
      ready_for_signing: true,
      created_at: new Date().toISOString(),
    };

    return {
      phase: 'draft_plan',
      draft_careplan: careplan,
      phase_history: [
        ...state.phase_history,
        {
          phase: 'draft_plan',
          timestamp: new Date().toISOString(),
          reason: 'Care plan drafted and ready for signing',
        },
      ],
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Complete CDS Session
   */
  async completeCDSSession(state: CDSState): Promise<Partial<CDSState>> {
    const duration = state.session_duration_seconds
      ? state.session_duration_seconds
      : Math.floor((new Date().getTime() - new Date(state.created_at).getTime()) / 1000);

    // Audit logging would happen here
    const auditPatterns = createAuditPatterns();
    const auditEvent = auditPatterns.recordPlanDrafted(
      state.tenant_id,
      state.patient_id,
      state.draft_careplan?.careplan_id || '',
      'cds-engine',
      this.config.claude_model
    );

    return {
      phase: 'complete',
      completion_status: 'completed',
      session_duration_seconds: duration,
      audit_events: [...state.audit_events, auditEvent],
      phase_history: [
        ...state.phase_history,
        {
          phase: 'complete',
          timestamp: new Date().toISOString(),
          reason: 'CDS session completed successfully',
        },
      ],
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Handle Errors
   */
  async handleError(state: CDSState, error: Error): Promise<Partial<CDSState>> {
    console.error('CDS Graph Error:', error);

    return {
      completion_status: 'error',
      errors: [
        ...state.errors,
        {
          message: error.message,
          phase: state.phase,
          timestamp: new Date().toISOString(),
          resolved: false,
        },
      ],
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * State Transition Routing Logic
 */
export function getNextPhase(currentPhase: CDSPhase, hasErrors: boolean): CDSPhase | null {
  if (hasErrors) {
    return null; // Error handler takes over
  }

  const transitions: Record<CDSPhase, CDSPhase> = {
    initialized: 'evidence_gathering',
    evidence_gathering: 'analysis',
    analysis: 'recommendation',
    recommendation: 'review',
    review: 'draft_plan',
    draft_plan: 'complete',
    complete: 'complete', // Terminal phase
  };

  return transitions[currentPhase] || null;
}

/**
 * Conditional Edge Router
 */
export interface EdgeRouterResult {
  nextPhase: CDSPhase;
  requiresClinicianInput: boolean;
}

export function routeEdge(currentPhase: CDSPhase, state: CDSState): EdgeRouterResult {
  switch (currentPhase) {
    case 'evidence_gathering':
      return {
        nextPhase: state.evidence_gaps.length > 0 ? 'evidence_gathering' : 'analysis',
        requiresClinicianInput: true,
      };

    case 'analysis':
      return {
        nextPhase: 'recommendation',
        requiresClinicianInput: false,
      };

    case 'recommendation':
      return {
        nextPhase: 'review',
        requiresClinicianInput: true,
      };

    case 'review':
      return {
        nextPhase: state.clinician_decisions.length > 0 ? 'draft_plan' : 'review',
        requiresClinicianInput: true,
      };

    case 'draft_plan':
      return {
        nextPhase: 'complete',
        requiresClinicianInput: false,
      };

    default:
      return {
        nextPhase: 'complete',
        requiresClinicianInput: false,
      };
  }
}
