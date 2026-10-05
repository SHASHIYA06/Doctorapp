// Core domain types for clinical SaaS platform

// ============================================================================
// IDENTITY & AUTHENTICATION
// ============================================================================

export type UserRole = 'patient' | 'clinician' | 'admin' | 'safety_officer' | 'content_reviewer';
export type ClinicianType = 'allopathic_physician' | 'ayurvedic_clinician' | 'homeopathic_clinician';
export type ClinicianScope = 'allopathy' | 'ayurveda' | 'homeopathy';

export interface User {
  user_id: string;
  tenant_id: string;
  email: string;
  phone?: string;
  preferred_language: 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml';
  roles: UserRole[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Practitioner extends User {
  clinician_type: ClinicianType;
  scopes: ClinicianScope[];
  credential: {
    license_number: string;
    issuing_body: string; // e.g., 'IMA', 'CCIM', 'CCH'
    issue_date: string;
    expiry_date: string;
    verified: boolean;
    verified_at?: string;
    verification_method: 'auto_registry_check' | 'manual_review';
  };
  multi_modal_scope?: boolean; // Can sign across modalities if true
  mfa_enabled: boolean;
}

export interface Tenant {
  tenant_id: string;
  name: string;
  domain: string;
  country: string;
  language: string;
  modalities_supported: ClinicianScope[];
  contact_email: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// CONSENT & PRIVACY
// ============================================================================

export type ConsentStatus = 'draft' | 'accepted' | 'revoked' | 'expired';

export interface ConsentForm {
  consent_id: string;
  patient_id: string;
  tenant_id: string;
  version: number;
  version_date: string;

  purpose: string;
  data_collected: string[];
  retention_period_days: number;
  sharing_with_clinician_only: boolean;

  ai_training_consent: boolean;
  ai_training_explicit: boolean;

  data_export_allowed: boolean;
  data_deletion_allowed: boolean;

  status: ConsentStatus;
  accepted_at?: string;
  accepted_by_user_id?: string;
  revoked_at?: string;

  change_log: ChangeEvent[];
  audit_event_id: string;
}

export interface ChangeEvent {
  timestamp: string;
  change_type: 'created' | 'updated' | 'deprecated' | 'revoked';
  actor_id?: string;
  reason?: string;
}

// ============================================================================
// PATIENT & CLINICAL HISTORY
// ============================================================================

export interface Patient {
  patient_id: string;
  tenant_id: string;

  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contact_phone: string;
  contact_email?: string;
  preferred_language: string;

  is_pregnant?: boolean;
  is_lactating?: boolean;
  is_minor?: boolean;
  guardian_id?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  created_at: string;
  updated_at: string;
}

export interface MedicationStatement {
  medication_id: string;
  patient_id: string;
  tenant_id: string;

  medicine_name: string;
  dosage: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation';
  frequency: string;
  prescribed_date?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;

  prescribed_by?: string;
  reason?: string;

  created_at: string;
  updated_at: string;
}

export interface AllergyIntolerance {
  allergy_id: string;
  patient_id: string;
  tenant_id: string;

  substance: string;
  category: 'medication' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  status: 'active' | 'resolved' | 'entered_in_error';

  onset_date?: string;
  asserted_date: string;

  created_at: string;
}

export interface Condition {
  condition_id: string;
  patient_id: string;
  tenant_id: string;

  code: string;
  display: string;
  onset_date?: string;
  status: 'active' | 'resolved' | 'remission';
  is_chronic: boolean;

  created_at: string;
}

// ============================================================================
// ENCOUNTER & INTAKE
// ============================================================================

export type EncounterType = 'intake' | 'follow_up' | 'telehealth' | 'voice_intake';

export interface Encounter {
  encounter_id: string;
  patient_id: string;
  tenant_id: string;

  type: EncounterType;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';

  started_at: string;
  ended_at?: string;
  clinician_id?: string;

  chief_complaint?: string;
  duration_of_complaint?: string;
  severity?: 'mild' | 'moderate' | 'severe';

  created_at: string;
}

export interface IntakeResponse {
  intake_id: string;
  encounter_id: string;
  patient_id: string;
  tenant_id: string;

  questions_answered: Record<string, string>;

  voice_transcript?: string;
  voice_transcript_confirmed: boolean;
  transcript_corrected_by_patient?: Record<string, string>;
  recording_consent_given?: boolean;
  recording_id?: string;

  completed_at: string;
  audit_event_id: string;
}

// ============================================================================
// TRIAGE & SAFETY
// ============================================================================

export type TriageLevel = 'emergency' | 'urgent' | 'routine' | 'no_red_flag';
export type ClinicianPath = 'immediate_emergency' | 'urgent_callback' | 'routine_intake';

export interface TriageAssessment {
  triage_id: string;
  encounter_id: string;
  patient_id: string;
  tenant_id: string;

  input_symptoms: string[];
  input_allergies: string[];
  input_medications: string[];
  input_conditions: string[];
  input_flags: string[];

  triage_level: TriageLevel;
  triggered_rules: string[];
  rule_version_id: string;

  clinician_path: ClinicianPath;
  patient_safe_message: string;
  emergency_escalation_script?: string;
  local_emergency_contact?: string;

  assessed_at: string;
  audit_event_id: string;
}

export interface SafetyAlert {
  alert_id: string;
  patient_id: string;
  tenant_id: string;

  alert_type: 'allergy' | 'interaction' | 'contraindication' | 'duplication' | 'missing_data';
  severity: 'info' | 'warning' | 'critical';

  source_medicine?: string;
  target_medicine?: string;
  reason: string;

  clinician_notified: boolean;
  override_rationale?: string;
  overridden_by?: string;

  created_at: string;
}

// ============================================================================
// CARE PLAN & CLINICAL DECISION SUPPORT
// ============================================================================

export type PlanStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'declined';

export interface ClinicalDraft {
  draft_id: string;
  encounter_id: string;
  patient_id: string;
  tenant_id: string;
  clinician_id: string;

  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  status: 'generated' | 'reviewed' | 'signed' | 'rejected';

  problem_list: string[];
  assessment: string;
  plan_narrative: string;

  recommendations: {
    action: string;
    type: 'medicine' | 'lifestyle' | 'investigation' | 'referral' | 'education';
    duration_days?: number;
  }[];

  cited_sources: SourceCitation[];

  missing_information?: string[];
  safety_alerts?: SafetyAlert[];

  confidence_score?: number;
  uncertainty_notes?: string;

  created_at: string;
  ai_model_used?: string;
  model_version?: string;
}

export interface SourceCitation {
  source_id: string;
  source_type: 'monograph' | 'guideline' | 'literature' | 'clinical_knowledge';
  title: string;
  url?: string;
  confidence: 'primary' | 'secondary';
  chunk_id?: string;
  retrieval_score?: number;
}

export interface SignedCarePlan {
  plan_id: string;
  encounter_id: string;
  patient_id: string;
  tenant_id: string;
  clinician_id: string;

  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  status: PlanStatus;

  problem_list: string[];
  assessment: string;
  plan: string;

  counselling: string;
  warning_signs: string[];
  follow_up_schedule: string;
  escalation_contact: string;

  duration_days?: number;

  clinician_signature: string;
  clinician_credential_id: string;
  signed_at: string;

  draft_id?: string;
  clinician_edits?: string;

  version: number;
  is_current: boolean;

  audit_event_id: string;
}

// ============================================================================
// AUDIT & EVENTS
// ============================================================================

export type AuditEventType =
  | 'user_login'
  | 'patient_created'
  | 'consent_signed'
  | 'intake_completed'
  | 'triage_assessed'
  | 'plan_drafted'
  | 'plan_signed'
  | 'plan_rejected'
  | 'safety_alert_created'
  | 'safety_alert_overridden'
  | 'model_called'
  | 'retrieval_executed'
  | 'data_exported'
  | 'data_deleted'
  | 'system_error';

export interface AuditEvent {
  audit_id: string;
  tenant_id: string;

  event_type: AuditEventType;
  timestamp: string;
  actor_id?: string;
  actor_role?: UserRole;

  resource_type: string;
  resource_id: string;

  action: 'create' | 'read' | 'update' | 'delete' | 'sign' | 'execute';
  status: 'success' | 'failure' | 'partial';

  details: {
    description: string;
    ip_address?: string;
    session_id?: string;
    model_used?: string;
    model_version?: string;
    rule_version_id?: string;
    retrieval_trace?: SourceCitation[];
    policy_decision?: string;
  };

  error?: string;

  correlation_id: string;

  created_at: string;
}

// ============================================================================
// MEDICINE & PHARMACOLOGY
// ============================================================================

export interface MedicineMonograph {
  monograph_id: string;
  tenant_id: string;

  canonical_name: string;
  brand_names: string[];
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  formulation: 'tablet' | 'liquid' | 'powder' | 'capsule' | 'cream' | 'injection';
  strength: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation';
  country: string;

  active_ingredients: { name: string; quantity_per_unit: string }[];
  patient_summary: string;

  indications: {
    indication: string;
    evidence_level: 'high' | 'moderate' | 'low' | 'traditional' | 'anecdotal';
  }[];

  contraindications: string[];
  warnings: string[];
  common_interactions: { medicine: string; severity: 'mild' | 'moderate' | 'severe' }[];

  source_url: string;
  source_date: string;
  reviewer_id: string;
  review_date: string;
  expiry_date: string;
  approval_state: 'draft' | 'approved' | 'deprecated';

  created_at: string;
  updated_at: string;
}

// ============================================================================
// MODALITY-SPECIFIC CONTEXT
// ============================================================================

export interface ModalityContext {
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  disclaimer: string;
  evidence_standard: string;
  permitted_claims: string[];
  scope_limitations: string[];
}
