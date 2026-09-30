/**
 * CDS Engine Type Definitions
 * LangGraph state machine for clinical decision support
 */

import {
  TriageAssessment,
  TriageLevel,
  Patient,
  MedicationStatement,
  AllergyIntolerance,
  SafetyAlert,
  AuditEvent,
} from '@domain/types';

/**
 * CDS Workflow Phases
 */
export type CDSPhase =
  | 'initialized'
  | 'evidence_gathering'
  | 'analysis'
  | 'recommendation'
  | 'review'
  | 'draft_plan'
  | 'complete';

/**
 * Clinical Message (Claude interaction)
 */
export interface CDSMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  token_count?: number;
}

/**
 * Patient History for CDS Analysis
 */
export interface PatientHistory {
  chief_complaint: string;
  history_of_present_illness: string;
  past_medical_history: string[];
  past_surgical_history: string[];
  medications_current: MedicationStatement[];
  allergies: AllergyIntolerance[];
  family_history: string;
  social_history: string;
  review_of_systems: string;
  date_captured: string;
}

/**
 * Vital Signs
 */
export interface VitalSigns {
  temperature_c?: number;
  heart_rate_bpm?: number;
  respiratory_rate?: number;
  blood_pressure?: string; // "120/80"
  oxygen_saturation?: number;
  blood_glucose?: number;
  weight_kg?: number;
  height_cm?: number;
  timestamp: string;
}

/**
 * Physical Examination
 */
export interface PhysicalExamination {
  general_appearance: string;
  head_neck: string;
  cardiovascular: string;
  respiratory: string;
  gastrointestinal: string;
  musculoskeletal: string;
  neurological: string;
  skin: string;
  other_findings: string;
  timestamp: string;
}

/**
 * Lab Result
 */
export interface LabResult {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  critical_flag?: boolean;
  timestamp: string;
}

/**
 * Severity Assessment
 */
export interface SeverityAssessment {
  severity_level: 'mild' | 'moderate' | 'severe' | 'critical';
  justification: string;
  duration_days: number;
  impact_on_daily_life: string;
}

/**
 * Gathered Clinical Evidence
 */
export interface ClinicalEvidence {
  patient_history: PatientHistory;
  vital_signs?: VitalSigns;
  physical_examination?: PhysicalExamination;
  lab_results: LabResult[];
  severity_assessment?: SeverityAssessment;
  additional_context: string;
  evidence_completeness_score: number; // 0.0-1.0
  last_updated: string;
}

/**
 * Differential Diagnosis Option
 */
export interface DiagnosisOption {
  diagnosis_id: string;
  diagnosis_name: string;
  icd_code?: string;
  confidence_score: number; // 0.0-1.0
  supporting_evidence: string[];
  against_evidence: string[];
  reasoning: string;
  requires_specialist_referral: boolean;
}

/**
 * Drug Interaction
 */
export interface Interaction {
  drug_a: string;
  drug_b: string;
  severity: 'minor' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  recommendation: string;
  mechanism: string;
}

/**
 * Monograph Match (from RAG service)
 */
export interface MonographMatch {
  monograph_id: string;
  medicine_name: string;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  recommended_dose: string;
  frequency: string;
  duration: string;
  route: string;
  contraindications: string[];
  warnings: string[];
  evidence_level: 'A' | 'B' | 'C'; // A=RCT, B=observational, C=expert
  source_version: string;
  last_updated: string;
}

/**
 * Single CDS Recommendation
 */
export interface Recommendation {
  recommendation_id: string;
  medicine_name: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  rationale: string;
  confidence_score: number; // 0.0-1.0
  confidence_category: 'high' | 'medium' | 'low';
  monograph_id: string;
  sources: string[]; // Reference codes, literature IDs
  contraindications: string[];
  interactions: Interaction[];
  relative_to_differential: string; // Which diagnosis this addresses
  reasoning_chain: string; // Full Claude reasoning
  requires_monitoring: boolean;
  monitoring_parameters?: string[];
  clinician_decision?: 'pending' | 'accepted' | 'overridden' | 'rejected';
  clinician_rationale?: string;
  timestamp: string;
}

/**
 * CDS Analysis Results
 */
export interface CDSAnalysis {
  session_id: string;
  differential_diagnosis: DiagnosisOption[];
  contraindications: string[];
  drug_interactions: Interaction[];
  monograph_matches: MonographMatch[];
  safety_concerns: string[];
  specialist_referral_suggested: boolean;
  specialist_type?: string;
  generated_at: string;
  model_version: string;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Clinician Decision on Recommendation
 */
export interface ClinicianDecision {
  recommendation_id: string;
  decision: 'accept' | 'override' | 'request_alternative' | 'reject';
  rationale?: string;
  override_justification?: string; // Required if overriding
  timestamp: string;
  clinician_id: string;
}

/**
 * Draft Care Plan Integration
 */
export interface CareplanDraft {
  careplan_id: string;
  patient_id: string;
  encounter_id: string;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  triage_result: TriageAssessment;
  medications: Array<{
    medicine: string;
    dose: string;
    frequency: string;
    duration: string;
    rationale: string;
    monograph_id: string;
  }>;
  lifestyle_recommendations: string[];
  follow_up_instructions: string[];
  sources: string[]; // Monograph IDs used
  created_by_cds_session: string; // CDS session ID
  ready_for_signing: boolean;
  created_at: string;
}

/**
 * CDS Session State (LangGraph State)
 */
export interface CDSState {
  // Identity & Context
  session_id: string;
  tenant_id: string;
  patient_id: string;
  clinician_id: string;
  encounter_id: string;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';

  // Triage Context
  triage_result: TriageAssessment;
  triage_level: TriageLevel;

  // Workflow State
  phase: CDSPhase;
  phase_history: Array<{
    phase: CDSPhase;
    timestamp: string;
    reason?: string;
  }>;

  // Claude Conversation
  messages: CDSMessage[];
  message_history_summary?: string;

  // Evidence Accumulation
  evidence: ClinicalEvidence;
  evidence_gaps: string[]; // Suggested next questions

  // Analysis Results
  analysis?: CDSAnalysis;

  // Recommendations
  recommendations: Recommendation[];
  top_recommendation?: Recommendation;

  // Clinician Actions
  clinician_decisions: ClinicianDecision[];

  // Care Plan Output
  draft_careplan?: CareplanDraft;

  // Safety & Compliance
  safety_alerts: SafetyAlert[];
  triage_override_allowed: boolean; // Based on triage level
  audit_correlation_id: string;
  audit_events: AuditEvent[];

  // Error Tracking
  errors: Array<{
    message: string;
    phase: CDSPhase;
    timestamp: string;
    resolved: boolean;
  }>;

  // Metadata
  created_at: string;
  last_updated: string;
  session_duration_seconds?: number;
  completion_status: 'in_progress' | 'completed' | 'error' | 'cancelled';
}

/**
 * CDS Session Input (initialization)
 */
export interface CDSSessionInput {
  tenant_id: string;
  patient_id: string;
  clinician_id: string;
  encounter_id: string;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  triage_result: TriageAssessment;
  patient_history?: PatientHistory;
}

/**
 * CDS Session Output (completion)
 */
export interface CDSSessionOutput {
  session_id: string;
  recommendations: Recommendation[];
  careplan_draft: CareplanDraft;
  audit_trail: AuditEvent[];
  session_summary: string;
  total_duration_seconds: number;
}

/**
 * Claude Request Payload
 */
export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
}

/**
 * Claude Response
 */
export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Structured Recommendation Extract from Claude
 */
export interface RecommendationExtract {
  recommendations: Array<{
    medicine_name: string;
    dose: string;
    frequency: string;
    duration: string;
    route: string;
    rationale: string;
    confidence_score: number;
    contraindications: string[];
    interactions: Array<{
      drug_name: string;
      severity: string;
      recommendation: string;
    }>;
  }>;
  differential_diagnosis: Array<{
    diagnosis_name: string;
    confidence_score: number;
    supporting_evidence: string[];
  }>;
  safety_concerns: string[];
  specialist_referral_needed: boolean;
  specialist_type?: string;
}

/**
 * Safety Check Result
 */
export interface SafetyCheckResult {
  passed: boolean;
  critical_alerts: SafetyAlert[];
  warnings: string[];
  recommendations_flagged: string[]; // Recommendation IDs
  requires_clinician_review: boolean;
  reviewed_at: string;
}

/**
 * CDS Configuration
 */
export interface CDSConfig {
  claude_api_key: string;
  claude_model: string;
  max_tokens: number;
  temperature: number;
  enable_monograph_lookup: boolean;
  enable_interaction_checking: boolean;
  confidence_threshold_low: number; // Default 0.6
  confidence_threshold_high: number; // Default 0.85
  max_recommendations: number; // Default 5
  emergency_override_allowed: boolean;
  emergency_require_rationale: boolean;
  audit_store_enabled: boolean;
}
