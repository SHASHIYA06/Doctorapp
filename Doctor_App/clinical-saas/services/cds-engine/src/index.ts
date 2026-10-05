/**
 * CDS Engine Exports
 * Public API for Clinical Decision Support
 */

export {
  CDSState,
  CDSPhase,
  CDSMessage,
  PatientHistory,
  VitalSigns,
  PhysicalExamination,
  LabResult,
  SeverityAssessment,
  ClinicalEvidence,
  DiagnosisOption,
  Interaction,
  MonographMatch,
  Recommendation,
  CDSAnalysis,
  ClinicianDecision,
  CareplanDraft,
  CDSSessionInput,
  CDSSessionOutput,
  CDSConfig,
  SafetyCheckResult,
  RecommendationExtract,
} from './types';

export { ClaudeClient, SafetyPolicyEnforcer } from './claude-integration';

export { CDSGraph, getNextPhase, routeEdge, type EdgeRouterResult } from './graph';

export {
  TriageCDSBoundary,
  TriageCDSOrchestrator,
  orchestrateTriageCDSWorkflow,
  type TriageContext,
} from './triage-integration';

/**
 * Factory function to create a new CDS session
 */
export async function createCDSSession(sessionInput: any): Promise<any> {
  // This will be used by the API layer
  const now = new Date().toISOString();

  return {
    session_id: require('uuid').v4(),
    tenant_id: sessionInput.tenant_id,
    patient_id: sessionInput.patient_id,
    clinician_id: sessionInput.clinician_id,
    encounter_id: sessionInput.encounter_id,
    modality: sessionInput.modality,
    triage_result: sessionInput.triage_result,
    triage_level: sessionInput.triage_result.triage_level,
    phase: 'initialized',
    phase_history: [],
    messages: [],
    evidence: {
      patient_history: sessionInput.patient_history || {
        chief_complaint: '',
        history_of_present_illness: '',
        past_medical_history: [],
        past_surgical_history: [],
        medications_current: [],
        allergies: [],
        family_history: '',
        social_history: '',
        review_of_systems: '',
        date_captured: now,
      },
      vital_signs: undefined,
      physical_examination: undefined,
      lab_results: [],
      severity_assessment: undefined,
      additional_context: '',
      evidence_completeness_score: 0.3,
      last_updated: now,
    },
    evidence_gaps: [],
    recommendations: [],
    clinician_decisions: [],
    safety_alerts: [],
    triage_override_allowed: sessionInput.triage_result.triage_level !== 'emergency',
    audit_correlation_id: require('uuid').v4(),
    audit_events: [],
    errors: [],
    created_at: now,
    last_updated: now,
    completion_status: 'in_progress',
  };
}

export default {
  createCDSSession,
  CDSGraph,
  ClaudeClient,
  SafetyPolicyEnforcer,
};
