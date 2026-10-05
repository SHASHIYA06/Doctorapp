/**
 * Triage-CDS Integration Tests
 * Verify handoff from deterministic triage to agentic CDS
 */

import { TriageAssessment } from '@domain/types';
import { TriageCDSBoundary, TriageCDSOrchestrator } from '../triage-integration';
import { Recommendation } from '../types';
import { CDSConfig } from '../types';

describe('Triage-CDS Boundary Validation', () => {
  const validTriageAssessment: TriageAssessment = {
    triage_id: 'triage-123',
    patient_id: 'patient-456',
    timestamp: new Date().toISOString(),
    input_symptoms: ['fever', 'cough'],
    input_allergies: [],
    input_medications: [],
    input_conditions: [],
    input_flags: [],
    triage_level: 'routine',
    triggered_rules: ['rule-001'],
    rule_version_id: 'v1.0.0',
    clinician_path: 'routine_intake',
    patient_safe_message: 'Please proceed with intake',
    audit_event_id: 'audit-123',
  };

  test('should validate triage result with all required fields', () => {
    const result = TriageCDSBoundary.validateTriageResultForCDS(validTriageAssessment);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject triage result missing triage_id', () => {
    const invalidTriage = { ...validTriageAssessment, triage_id: '' };
    const result = TriageCDSBoundary.validateTriageResultForCDS(invalidTriage);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing triage_id');
  });

  test('should reject triage result missing rule_version_id', () => {
    const invalidTriage = { ...validTriageAssessment, rule_version_id: '' };
    const result = TriageCDSBoundary.validateTriageResultForCDS(invalidTriage);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing rule_version_id');
  });

  test('should require escalation info for emergency triage', () => {
    const emergencyTriage: TriageAssessment = {
      ...validTriageAssessment,
      triage_level: 'emergency',
      clinician_path: 'immediate_emergency',
      emergency_escalation_script: undefined,
      local_emergency_contact: '911',
    };

    const result = TriageCDSBoundary.validateTriageResultForCDS(emergencyTriage);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Emergency triage missing escalation script');
  });

  test('should validate emergency triage with complete info', () => {
    const emergencyTriage: TriageAssessment = {
      ...validTriageAssessment,
      triage_level: 'emergency',
      clinician_path: 'immediate_emergency',
      emergency_escalation_script: 'Patient needs immediate emergency services',
      local_emergency_contact: '911',
    };

    const result = TriageCDSBoundary.validateTriageResultForCDS(emergencyTriage);
    expect(result.valid).toBe(true);
  });
});

describe('CDS-Triage Boundary Enforcement', () => {
  const triageContext = {
    triage_assessment: {} as any,
    triage_level: 'emergency' as const,
    triggered_rules: ['chest_pain_rule'],
    rule_version_id: 'v1.0.0',
    emergency_escalation_required: true,
    emergency_contact: '911',
    emergency_script: 'Patient has chest pain. Call 911 immediately.',
  };

  const testRecommendations: Recommendation[] = [
    {
      recommendation_id: 'rec-1',
      medicine_name: 'Aspirin',
      dose: '325mg',
      frequency: 'stat',
      duration: '1 hour',
      route: 'oral',
      rationale: 'For acute coronary syndrome',
      confidence_score: 0.95,
      confidence_category: 'high',
      monograph_id: 'mono-1',
      sources: [],
      contraindications: [],
      interactions: [],
      relative_to_differential: 'ACS',
      reasoning_chain: 'High-risk presentation',
      requires_monitoring: true,
      monitoring_parameters: ['vital signs', 'cardiac rhythm'],
      timestamp: new Date().toISOString(),
    },
  ];

  test('should flag recommendations that delay emergency response', () => {
    const delayingRecommendations: Recommendation[] = [
      {
        ...testRecommendations[0],
        rationale: 'Wait and observe at home for 24 hours',
      },
    ];

    const result = TriageCDSBoundary.validateCDSAgainstTriage(
      triageContext,
      delayingRecommendations
    );

    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('delay'))).toBe(true);
  });

  test('should accept emergency recommendations with monitoring', () => {
    const result = TriageCDSBoundary.validateCDSAgainstTriage(
      triageContext,
      testRecommendations
    );

    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('should enforce urgent triage SLA', () => {
    const urgentContext = {
      ...triageContext,
      triage_level: 'urgent' as const,
      emergency_escalation_required: false,
      clinician_callback_sla_minutes: 120, // 2 hours
    };

    const slowRecommendation: Recommendation = {
      ...testRecommendations[0],
      duration: '7 days', // Exceeds 2-hour SLA
      confidence_category: 'high',
    };

    const result = TriageCDSBoundary.validateCDSAgainstTriage(urgentContext, [
      slowRecommendation,
    ]);

    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('SLA'))).toBe(true);
  });

  test('should prevent triage level downgrade', () => {
    const emergentContext = {
      ...triageContext,
      triage_level: 'emergency' as const,
    };

    const downgradingRecommendations: Recommendation[] = [
      {
        ...testRecommendations[0],
        rationale:
          'Symptoms are mild, no follow-up needed. Patient can self-manage at home with rest.',
      },
    ];

    const result = TriageCDSBoundary.validateCDSAgainstTriage(
      emergentContext,
      downgradingRecommendations
    );

    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.includes('downgrade'))
    ).toBe(true);
  });
});

describe('Triage-CDS Orchestrator', () => {
  const baseConfig: CDSConfig = {
    claude_api_key: 'test-key',
    claude_model: 'claude-3-sonnet-20240229',
    max_tokens: 2048,
    temperature: 0.3,
    enable_monograph_lookup: true,
    enable_interaction_checking: true,
    confidence_threshold_low: 0.6,
    confidence_threshold_high: 0.85,
    max_recommendations: 5,
    emergency_override_allowed: true,
    emergency_require_rationale: true,
    audit_store_enabled: true,
  };

  const triageContext = {
    triage_assessment: {} as any,
    triage_level: 'routine' as const,
    triggered_rules: ['rule-001'],
    rule_version_id: 'v1.0.0',
    emergency_escalation_required: false,
  };

  test('should create orchestrator for routine triage', () => {
    const orchestrator = new TriageCDSOrchestrator(triageContext, baseConfig);
    const decision = orchestrator.shouldInvokeCDS();

    expect(decision.shouldInvoke).toBe(true);
    expect(decision.reason).toContain('Routine case');
  });

  test('should invoke CDS for emergency triage', () => {
    const emergencyContext = {
      ...triageContext,
      triage_level: 'emergency' as const,
      emergency_escalation_required: true,
      emergency_contact: '911',
      emergency_script: 'Call emergency services',
    };

    const orchestrator = new TriageCDSOrchestrator(emergencyContext, baseConfig);
    const decision = orchestrator.shouldInvokeCDS();

    expect(decision.shouldInvoke).toBe(true);
    expect(decision.reason).toContain('Emergency detected');
  });

  test('should generate CDS init prompt for emergency', () => {
    const emergencyContext = {
      ...triageContext,
      triage_level: 'emergency' as const,
      emergency_escalation_required: true,
      emergency_contact: '911',
      emergency_script: 'Call emergency services',
    };

    const orchestrator = new TriageCDSOrchestrator(emergencyContext, baseConfig);
    const prompt = orchestrator.generateCDSInitPrompt();

    expect(prompt).toContain('EMERGENCY CONTEXT');
    expect(prompt).toContain('Do NOT delay emergency response');
    expect(prompt).toContain('911');
  });

  test('should enforce safety policies post-CDS for emergency', () => {
    const emergencyContext = {
      ...triageContext,
      triage_level: 'emergency' as const,
    };

    const orchestrator = new TriageCDSOrchestrator(emergencyContext, baseConfig);

    const state = {
      recommendations: [
        {
          recommendation_id: 'rec-1',
          medicine_name: 'Emergency Med',
          confidence_category: 'high' as const,
          requires_monitoring: false, // Missing monitoring for emergency
        },
      ],
    } as any;

    const result = orchestrator.enforceSafetyPoliciesPostCDS(state);

    expect(result.compliant).toBe(false);
    expect(result.warnings.some((w) => w.includes('monitoring'))).toBe(true);
  });

  test('should generate audit trail entry for handoff', () => {
    const orchestrator = new TriageCDSOrchestrator(triageContext, baseConfig);
    const entry = orchestrator.generateHandoffAuditEntry();

    expect(entry).toHaveProperty('event_type', 'triage_cds_handoff');
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('triage_level');
    expect(entry).toHaveProperty('triggered_rules');
  });
});

describe('Triage Context Extraction', () => {
  test('should extract context from routine triage', () => {
    const triageAssessment: TriageAssessment = {
      triage_id: 'triage-123',
      patient_id: 'patient-456',
      timestamp: new Date().toISOString(),
      input_symptoms: ['fever'],
      input_allergies: [],
      input_medications: [],
      input_conditions: [],
      input_flags: [],
      triage_level: 'routine',
      triggered_rules: ['rule-001'],
      rule_version_id: 'v1.0.0',
      clinician_path: 'routine_intake',
      patient_safe_message: 'Proceed with intake',
      audit_event_id: 'audit-123',
    };

    const context = TriageCDSBoundary.extractTriageContext(triageAssessment);

    expect(context.triage_level).toBe('routine');
    expect(context.triggered_rules).toContain('rule-001');
    expect(context.emergency_escalation_required).toBe(false);
  });

  test('should extract context from urgent triage with SLA', () => {
    const triageAssessment: TriageAssessment = {
      triage_id: 'triage-123',
      patient_id: 'patient-456',
      timestamp: new Date().toISOString(),
      input_symptoms: ['high fever', 'confusion'],
      input_allergies: [],
      input_medications: [],
      input_conditions: [],
      input_flags: [],
      triage_level: 'urgent',
      triggered_rules: ['urgent_infection_rule'],
      rule_version_id: 'v1.0.0',
      clinician_path: 'urgent_callback',
      patient_safe_message: 'Clinician will call you within 2 hours',
      audit_event_id: 'audit-123',
    };

    const context = TriageCDSBoundary.extractTriageContext(triageAssessment);

    expect(context.triage_level).toBe('urgent');
    expect(context.clinician_callback_sla_minutes).toBe(120); // 2 hours
  });
});
