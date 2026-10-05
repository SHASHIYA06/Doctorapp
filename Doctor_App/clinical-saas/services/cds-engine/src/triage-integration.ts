/**
 * CDS-Triage Integration Layer
 * Handles handoff from deterministic triage to agentic CDS
 * Ensures triage decisions are never contradicted by CDS
 */

import { TriageAssessment, TriageLevel } from '@domain/types';
import { CDSState, Recommendation, CDSConfig } from './types';
import { SafetyPolicyEnforcer } from './claude-integration';

/**
 * Triage Context for CDS
 */
export interface TriageContext {
  triage_assessment: TriageAssessment;
  triage_level: TriageLevel;
  triggered_rules: string[];
  rule_version_id: string;
  emergency_escalation_required: boolean;
  emergency_contact?: string;
  emergency_script?: string;
  clinician_callback_sla_minutes?: number;
}

/**
 * CDS-Triage Boundary Validator
 */
export class TriageCDSBoundary {
  /**
   * Validate that CDS does not contradict triage decision
   */
  static validateCDSAgainstTriage(
    triageContext: TriageContext,
    cdsRecommendations: Recommendation[]
  ): {
    valid: boolean;
    violations: string[];
    flagged_recommendations: string[];
  } {
    const violations: string[] = [];
    const flagged: string[] = [];

    // Rule 1: Emergency Triage Escalation Lock
    if (triageContext.triage_level === 'emergency') {
      const hasRecommendationsThatDelayResponse = cdsRecommendations.some((rec) => {
        // Check if recommendation suggests delay (e.g., "wait and observe")
        const delayKeywords = [
          'observe',
          'wait',
          'monitor at home',
          'routine follow-up',
          'schedule appointment',
        ];
        const suggestsDelay = delayKeywords.some((kw) =>
          rec.rationale.toLowerCase().includes(kw)
        );
        return suggestsDelay;
      });

      if (hasRecommendationsThatDelayResponse) {
        violations.push(
          'CDS recommendations suggest delay, but triage level is EMERGENCY. Emergency escalation must proceed immediately.'
        );
        flagged.push(...cdsRecommendations.map((r) => r.recommendation_id));
      }
    }

    // Rule 2: Urgent Triage SLA Respect
    if (triageContext.triage_level === 'urgent' && triageContext.clinician_callback_sla_minutes) {
      const recommendationsWithLongWait = cdsRecommendations.filter((rec) => {
        const durationMatch = rec.duration.match(/(\d+)\s*(day|week|month)/i);
        if (durationMatch) {
          const value = parseInt(durationMatch[1]);
          const unit = durationMatch[2].toLowerCase();

          // Convert to hours
          let hours = 0;
          if (unit === 'day') hours = value * 24;
          else if (unit === 'week') hours = value * 24 * 7;
          else if (unit === 'month') hours = value * 24 * 30;

          // Check if exceeds SLA
          const slaHours = triageContext.clinician_callback_sla_minutes / 60;
          return hours > slaHours && rec.confidence_category === 'high';
        }
        return false;
      });

      if (recommendationsWithLongWait.length > 0) {
        violations.push(
          `${recommendationsWithLongWait.length} recommendations exceed urgent callback SLA of ${triageContext.clinician_callback_sla_minutes} minutes`
        );
        flagged.push(...recommendationsWithLongWait.map((r) => r.recommendation_id));
      }
    }

    // Rule 3: No Triage Level Downgrade
    if (triageContext.triage_level === 'emergency' || triageContext.triage_level === 'urgent') {
      const recommenderCreatesRiskOfDowngrade = cdsRecommendations.some((rec) => {
        // Check if recommendation could enable inappropriate downgrade
        const riskKeywords = ['mild symptoms', 'no follow-up', 'self-limiting'];
        return riskKeywords.some((kw) => rec.rationale.toLowerCase().includes(kw));
      });

      if (recommenderCreatesRiskOfDowngrade) {
        violations.push('CDS recommendations could enable inappropriate triage downgrade');
        flagged.push(
          ...cdsRecommendations
            .filter((rec) =>
              ['mild symptoms', 'no follow-up', 'self-limiting'].some((kw) =>
                rec.rationale.toLowerCase().includes(kw)
              )
            )
            .map((r) => r.recommendation_id)
        );
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      flagged_recommendations: flagged,
    };
  }

  /**
   * Validate triage result before CDS initialization
   */
  static validateTriageResultForCDS(triageAssessment: TriageAssessment): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!triageAssessment.triage_id) errors.push('Missing triage_id');
    if (!triageAssessment.triage_level) errors.push('Missing triage_level');
    if (!triageAssessment.rule_version_id) errors.push('Missing rule_version_id');
    if (!triageAssessment.triggered_rules || triageAssessment.triggered_rules.length === 0) {
      errors.push('No triggered rules recorded');
    }

    // Emergency rules must have escalation info
    if (triageAssessment.triage_level === 'emergency') {
      if (!triageAssessment.emergency_escalation_script) {
        errors.push('Emergency triage missing escalation script');
      }
      if (!triageAssessment.local_emergency_contact) {
        errors.push('Emergency triage missing local emergency contact');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract triage context for CDS
   */
  static extractTriageContext(triageAssessment: TriageAssessment): TriageContext {
    return {
      triage_assessment: triageAssessment,
      triage_level: triageAssessment.triage_level,
      triggered_rules: triageAssessment.triggered_rules || [],
      rule_version_id: triageAssessment.rule_version_id,
      emergency_escalation_required: triageAssessment.triage_level === 'emergency',
      emergency_contact: triageAssessment.local_emergency_contact,
      emergency_script: triageAssessment.emergency_escalation_script,
      clinician_callback_sla_minutes:
        triageAssessment.triage_level === 'urgent' ? 120 : undefined, // 2 hours for urgent
    };
  }
}

/**
 * CDS Triage Workflow Orchestrator
 */
export class TriageCDSOrchestrator {
  private triageContext: TriageContext;
  private config: CDSConfig;

  constructor(triageContext: TriageContext, config: CDSConfig) {
    this.triageContext = triageContext;
    this.config = config;
  }

  /**
   * Determine if CDS should be invoked for this triage result
   */
  shouldInvokeCDS(): {
    shouldInvoke: boolean;
    reason: string;
  } {
    // Emergency: CDS provides supporting analysis but must not delay escalation
    if (this.triageContext.triage_level === 'emergency') {
      return {
        shouldInvoke: true,
        reason: 'Emergency detected. CDS will provide decision support for specialist consultation.',
      };
    }

    // Urgent: CDS helps clinician prepare for callback
    if (this.triageContext.triage_level === 'urgent') {
      return {
        shouldInvoke: true,
        reason: 'Urgent case. CDS will generate recommendations within callback SLA.',
      };
    }

    // Routine: CDS provides full decision support
    if (this.triageContext.triage_level === 'routine') {
      return {
        shouldInvoke: true,
        reason: 'Routine case. CDS will generate comprehensive recommendations.',
      };
    }

    // No red flag: CDS still useful for detailed analysis
    if (this.triageContext.triage_level === 'no_red_flag') {
      return {
        shouldInvoke: true,
        reason: 'No immediate red flag. CDS will provide preventive recommendations.',
      };
    }

    return {
      shouldInvoke: false,
      reason: 'Unknown triage level',
    };
  }

  /**
   * Generate CDS initialization prompt based on triage context
   */
  generateCDSInitPrompt(): string {
    const { triage_level, triggered_rules, rule_version_id } = this.triageContext;

    let prompt = `TRIAGE CONTEXT FOR CDS SESSION\n`;
    prompt += `========================================\n`;
    prompt += `Triage Level: ${triage_level.toUpperCase()}\n`;
    prompt += `Rule Set Version: ${rule_version_id}\n`;
    prompt += `Triggered Rules: ${triggered_rules.join(', ')}\n\n`;

    if (triage_level === 'emergency') {
      prompt += `⚠️ EMERGENCY CONTEXT ⚠️\n`;
      prompt += `This patient has been triaged as EMERGENCY.\n`;
      prompt += `Local emergency contact: ${this.triageContext.emergency_contact}\n`;
      prompt += `CDS role: Support specialist evaluation. Do NOT delay emergency response.\n`;
      prompt += `Recommendations should address immediate stabilization and transport.\n\n`;
    } else if (triage_level === 'urgent') {
      prompt += `⚠️ URGENT CONTEXT\n`;
      prompt += `This patient requires callback within ${this.triageContext.clinician_callback_sla_minutes} minutes.\n`;
      prompt += `CDS recommendations must be actionable within this timeframe.\n\n`;
    } else if (triage_level === 'routine') {
      prompt += `ℹ️ ROUTINE CASE\n`;
      prompt += `Patient scheduled for standard intake. CDS will provide comprehensive recommendations.\n\n`;
    }

    return prompt;
  }

  /**
   * Enforce safety policies post-CDS
   */
  enforceSafetyPoliciesPostCDS(state: CDSState): {
    compliant: boolean;
    warnings: string[];
    actions: string[];
  } {
    const warnings: string[] = [];
    const actions: string[] = [];

    // Policy 1: Emergency recommendations must include monitoring
    if (this.triageContext.triage_level === 'emergency') {
      const unmonitoredEmergencyRecs = state.recommendations.filter(
        (rec) => rec.confidence_category === 'high' && !rec.requires_monitoring
      );

      if (unmonitoredEmergencyRecs.length > 0) {
        warnings.push(
          'Emergency recommendations should include continuous monitoring requirements'
        );
        actions.push(
          'Add monitoring parameters to: ' +
            unmonitoredEmergencyRecs.map((r) => r.medicine_name).join(', ')
        );
      }
    }

    // Policy 2: Low confidence recommendations in urgent cases
    if (this.triageContext.triage_level === 'urgent') {
      const lowConfUrgent = state.recommendations.filter(
        (rec) => rec.confidence_category === 'low'
      );

      if (lowConfUrgent.length > 0) {
        warnings.push(
          `${lowConfUrgent.length} low-confidence recommendations in urgent case. Consider specialist consultation.`
        );
        actions.push(
          'Flag for clinician review: ' +
            lowConfUrgent.map((r) => r.medicine_name).join(', ')
        );
      }
    }

    // Policy 3: Contraindicated interactions
    const contraindicated = state.recommendations.filter((rec) =>
      rec.interactions.some((i) => i.severity === 'contraindicated')
    );

    if (contraindicated.length > 0) {
      warnings.push(`${contraindicated.length} recommendations have contraindicated interactions`);
      actions.push(
        'Block recommendations: ' +
          contraindicated.map((r) => r.medicine_name).join(', ')
      );
    }

    return {
      compliant: warnings.length === 0,
      warnings,
      actions,
    };
  }

  /**
   * Generate audit trail entry for triage-CDS handoff
   */
  generateHandoffAuditEntry(): object {
    return {
      event_type: 'triage_cds_handoff',
      timestamp: new Date().toISOString(),
      triage_level: this.triageContext.triage_level,
      triggered_rules: this.triageContext.triggered_rules,
      rule_version_id: this.triageContext.rule_version_id,
      cds_invoked: this.shouldInvokeCDS().shouldInvoke,
      cds_init_prompt: this.generateCDSInitPrompt(),
      context: 'Patient triaged successfully. Initiating CDS session.',
    };
  }
}

/**
 * Triage-CDS Integration Workflow
 */
export async function orchestrateTriageCDSWorkflow(
  triageAssessment: TriageAssessment,
  config: CDSConfig
): Promise<{
  valid: boolean;
  triageContext?: TriageContext;
  cdsInitialized: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Step 1: Validate triage result
  const triageValidation = TriageCDSBoundary.validateTriageResultForCDS(triageAssessment);
  if (!triageValidation.valid) {
    errors.push(...triageValidation.errors);
    return { valid: false, cdsInitialized: false, errors };
  }

  // Step 2: Extract triage context
  const triageContext = TriageCDSBoundary.extractTriageContext(triageAssessment);

  // Step 3: Create orchestrator
  const orchestrator = new TriageCDSOrchestrator(triageContext, config);

  // Step 4: Check if CDS should be invoked
  const invocationDecision = orchestrator.shouldInvokeCDS();
  if (!invocationDecision.shouldInvoke) {
    errors.push(`CDS not invoked: ${invocationDecision.reason}`);
    return { valid: false, triageContext, cdsInitialized: false, errors };
  }

  return {
    valid: true,
    triageContext,
    cdsInitialized: true,
    errors: [],
  };
}
