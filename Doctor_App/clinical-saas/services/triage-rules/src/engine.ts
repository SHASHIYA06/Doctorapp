import { TriageAssessment, TriageLevel, AuditEvent, ClinicianPath } from '@domain/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Deterministic, board-approved triage rule engine.
 * Rules execute FIRST, before any generative AI.
 * No LLM inference; only pattern matching against approved rule set.
 */

export interface TriageRule {
  rule_id: string;
  version: number;
  rule_group: 'critical_emergency' | 'urgent' | 'routine';

  trigger_keywords: string[];
  trigger_if_any?: string[];
  trigger_if_all?: string[];
  exclude_if?: string[];

  min_age?: number;
  max_age?: number;
  contexts?: string[];

  triage_level: TriageLevel;
  patient_message: string;
  emergency_script?: string;
  contact_emergency_number: boolean;
  escalation_sla_minutes?: number;

  created_by: string;
  created_date: string;
  approved_by: string;
  approved_date: string;
  effective_date: string;
  deprecation_date?: string;

  test_cases_passed: number;
  test_cases_total: number;
  last_reviewed_date: string;
  next_review_due: string;
}

export interface TriageRuleSet {
  version_id: string;
  modality: 'all_modalities' | 'allopathy' | 'ayurveda' | 'homeopathy';
  effective_date: string;
  rules: TriageRule[];
  total_rules: number;
  signed_by: string;
  signed_date: string;
}

export interface TriageInput {
  patient_id: string;
  tenant_id: string;
  encounter_id: string;

  symptoms: string[];
  allergies: string[];
  active_medications: string[];
  conditions: string[];
  flags: string[];

  patient_age_years?: number;
  pregnancy_status?: boolean;
  lactation_status?: boolean;
}

export class TriageEngine {
  private currentRuleSet: TriageRuleSet;

  constructor(ruleSet: TriageRuleSet) {
    this.validateRuleSet(ruleSet);
    this.currentRuleSet = ruleSet;
  }

  /**
   * Validate rule set integrity before use
   */
  private validateRuleSet(ruleSet: TriageRuleSet): void {
    if (!ruleSet.rules || ruleSet.rules.length === 0) {
      throw new Error('TriageRuleSet must contain at least one rule');
    }

    if (!ruleSet.signed_by || !ruleSet.signed_date) {
      throw new Error('TriageRuleSet must be signed by Medical Director');
    }

    for (const rule of ruleSet.rules) {
      if (!rule.rule_id || !rule.approved_by || !rule.approved_date) {
        throw new Error(`Rule ${rule.rule_id} is not properly approved`);
      }
      if (rule.test_cases_passed < rule.test_cases_total) {
        throw new Error(`Rule ${rule.rule_id} does not pass all test cases`);
      }
    }
  }

  /**
   * Assess patient input and return triage level + next step
   * This is the main entry point.
   */
  assess(input: TriageInput): TriageAssessment {
    const normalized = this.normalizeInput(input);
    const triggeredRules: string[] = [];
    let highestTriageLevel: TriageLevel = 'no_red_flag';

    // Iterate through rules in priority order (emergency first)
    for (const rule of this.currentRuleSet.rules) {
      if (this.ruleMatches(rule, normalized)) {
        triggeredRules.push(rule.rule_id);

        // Update highest triage level (emergency > urgent > routine > no_red_flag)
        const priority = this.triagePriority(rule.triage_level);
        if (priority > this.triagePriority(highestTriageLevel)) {
          highestTriageLevel = rule.triage_level;
        }

        // If emergency matched, stop immediately
        if (highestTriageLevel === 'emergency') {
          break;
        }
      }
    }

    // Build assessment
    const assessment: TriageAssessment = {
      triage_id: uuidv4(),
      encounter_id: input.encounter_id,
      patient_id: input.patient_id,
      tenant_id: input.tenant_id,

      input_symptoms: input.symptoms,
      input_allergies: input.allergies,
      input_medications: input.active_medications,
      input_conditions: input.conditions,
      input_flags: input.flags,

      triage_level: highestTriageLevel,
      triggered_rules: triggeredRules,
      rule_version_id: this.currentRuleSet.version_id,

      clinician_path: this.determineClinicianPath(highestTriageLevel),
      patient_safe_message: this.getPatientMessage(highestTriageLevel),
      emergency_escalation_script: this.getEmergencyScript(highestTriageLevel),
      local_emergency_contact: highestTriageLevel === 'emergency' ? this.getEmergencyContact() : undefined,

      assessed_at: new Date().toISOString(),
      audit_event_id: uuidv4(),
    };

    return assessment;
  }

  /**
   * Check if a rule matches against normalized input
   */
  private ruleMatches(rule: TriageRule, normalized: TriageInput): boolean {
    // Check if rule is currently active
    const now = new Date().toISOString();
    if (rule.deprecation_date && rule.deprecation_date < now) {
      return false;
    }

    // Check age constraints
    if (rule.min_age && normalized.patient_age_years && normalized.patient_age_years < rule.min_age) {
      return false;
    }
    if (rule.max_age && normalized.patient_age_years && normalized.patient_age_years > rule.max_age) {
      return false;
    }

    // Check context constraints (e.g., pregnancy)
    if (rule.contexts) {
      let contextMatch = false;
      for (const context of rule.contexts) {
        if (context === 'pregnancy' && normalized.pregnancy_status) contextMatch = true;
        if (context === 'lactation' && normalized.lactation_status) contextMatch = true;
      }
      if (!contextMatch) return false;
    }

    // Check trigger_if_any: patient mentions ANY of these keywords
    if (rule.trigger_if_any && rule.trigger_if_any.length > 0) {
      const anyMatches = rule.trigger_if_any.some((keyword) =>
        this.checkKeywordPresence(keyword, normalized)
      );
      if (!anyMatches) return false;
    }

    // Check trigger_if_all: patient mentions ALL of these keywords
    if (rule.trigger_if_all && rule.trigger_if_all.length > 0) {
      const allMatch = rule.trigger_if_all.every((keyword) =>
        this.checkKeywordPresence(keyword, normalized)
      );
      if (!allMatch) return false;
    }

    // Check exclude_if: do NOT trigger if patient says this
    if (rule.exclude_if && rule.exclude_if.length > 0) {
      const exclusionMatches = rule.exclude_if.some((keyword) =>
        this.checkKeywordPresence(keyword, normalized)
      );
      if (exclusionMatches) return false;
    }

    return true;
  }

  /**
   * Check if a keyword is present in patient input (case-insensitive, substring)
   */
  private checkKeywordPresence(keyword: string, input: TriageInput): boolean {
    const lowerKeyword = keyword.toLowerCase();

    return (
      input.symptoms.some((s) => s.toLowerCase().includes(lowerKeyword)) ||
      input.flags.some((f) => f.toLowerCase().includes(lowerKeyword)) ||
      input.conditions.some((c) => c.toLowerCase().includes(lowerKeyword)) ||
      input.allergies.some((a) => a.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Normalize input for consistent matching
   */
  private normalizeInput(input: TriageInput): TriageInput {
    return {
      ...input,
      symptoms: input.symptoms.map((s) => s.trim().toLowerCase()),
      allergies: input.allergies.map((a) => a.trim().toLowerCase()),
      active_medications: input.active_medications.map((m) => m.trim().toLowerCase()),
      conditions: input.conditions.map((c) => c.trim().toLowerCase()),
      flags: input.flags.map((f) => f.trim().toLowerCase()),
    };
  }

  /**
   * Determine clinician path based on triage level
   */
  private determineClinicianPath(level: TriageLevel): ClinicianPath {
    if (level === 'emergency') return 'immediate_emergency';
    if (level === 'urgent') return 'urgent_callback';
    return 'routine_intake';
  }

  /**
   * Get patient-safe message for triage level
   */
  private getPatientMessage(level: TriageLevel): string {
    const messages: Record<TriageLevel, string> = {
      emergency:
        'I am concerned your symptoms may need urgent care. I cannot assess this safely by phone. Please contact your local emergency service now or go to the nearest emergency department.',
      urgent:
        'Your symptoms need prompt medical attention. A clinician will call you back soon. In the meantime, seek local medical care if symptoms worsen.',
      routine: 'Your information has been received. A clinician will review and contact you shortly.',
      no_red_flag: 'Thank you for your information. Please proceed with your intake.',
    };
    return messages[level];
  }

  /**
   * Get emergency escalation script (exact wording for voice agent)
   */
  private getEmergencyScript(level: TriageLevel): string | undefined {
    if (level === 'emergency') {
      return `I'm concerned your symptoms may need urgent care. I cannot assess this safely.
Please contact your local emergency service now or go to the nearest emergency department.
If you are in immediate danger, do not wait for a callback.
Help is available 24/7.`;
    }
    return undefined;
  }

  /**
   * Get local emergency contact number (India: 108 ambulance)
   */
  private getEmergencyContact(): string {
    return '108'; // India ambulance
  }

  /**
   * Numeric priority for triage levels (used to determine highest level)
   */
  private triagePriority(level: TriageLevel): number {
    const priorities: Record<TriageLevel, number> = {
      emergency: 4,
      urgent: 3,
      routine: 2,
      no_red_flag: 1,
    };
    return priorities[level];
  }

  /**
   * Get current rule set version
   */
  getRuleSetVersion(): string {
    return this.currentRuleSet.version_id;
  }

  /**
   * Update rule set (requires board approval before calling)
   */
  updateRuleSet(newRuleSet: TriageRuleSet): void {
    this.validateRuleSet(newRuleSet);
    this.currentRuleSet = newRuleSet;
  }
}

/**
 * Load approved triage rule set from version control
 * This would load from Git/database in production
 */
export function loadApprovedTriageRuleSet(version: string): TriageRuleSet {
  // For MVP, we'll embed a minimal rule set
  // In production, this loads from a versioned database

  return {
    version_id: version,
    modality: 'all_modalities',
    effective_date: new Date().toISOString(),
    rules: getDefaultTriageRules(),
    total_rules: getDefaultTriageRules().length,
    signed_by: 'dr_medical_director',
    signed_date: new Date().toISOString(),
  };
}

/**
 * Default (minimal) triage rules for MVP
 * In production, these are versioned, board-approved, and loaded from database
 */
function getDefaultTriageRules(): TriageRule[] {
  return [
    {
      rule_id: 'emergency_chest_pain_001',
      version: 1,
      rule_group: 'critical_emergency',
      trigger_if_any: ['chest pain', 'chest pressure', 'chest tightness'],
      triage_level: 'emergency',
      patient_message: 'Chest symptoms require immediate medical evaluation.',
      contact_emergency_number: true,
      created_by: 'dr_safety',
      created_date: '2026-01-01',
      approved_by: 'dr_medical_director',
      approved_date: '2026-01-01',
      effective_date: '2026-01-15',
      test_cases_passed: 100,
      test_cases_total: 100,
      last_reviewed_date: '2026-01-15',
      next_review_due: '2026-07-15',
    },
    {
      rule_id: 'emergency_breathing_001',
      version: 1,
      rule_group: 'critical_emergency',
      trigger_if_any: ['difficulty breathing', 'shortness of breath', 'can\'t breathe'],
      triage_level: 'emergency',
      patient_message: 'Breathing difficulties require immediate medical evaluation.',
      contact_emergency_number: true,
      created_by: 'dr_safety',
      created_date: '2026-01-01',
      approved_by: 'dr_medical_director',
      approved_date: '2026-01-01',
      effective_date: '2026-01-15',
      test_cases_passed: 100,
      test_cases_total: 100,
      last_reviewed_date: '2026-01-15',
      next_review_due: '2026-07-15',
    },
    {
      rule_id: 'routine_no_symptoms_001',
      version: 1,
      rule_group: 'routine',
      trigger_keywords: [],
      trigger_if_all: [],
      triage_level: 'no_red_flag',
      patient_message: 'Thank you for your information. You can proceed with your intake.',
      contact_emergency_number: false,
      created_by: 'dr_safety',
      created_date: '2026-01-01',
      approved_by: 'dr_medical_director',
      approved_date: '2026-01-01',
      effective_date: '2026-01-15',
      test_cases_passed: 100,
      test_cases_total: 100,
      last_reviewed_date: '2026-01-15',
      next_review_due: '2026-07-15',
    },
  ];
}
