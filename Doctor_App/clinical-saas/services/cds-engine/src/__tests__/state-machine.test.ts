/**
 * State Machine Tests
 * Verify state transitions, node execution, and workflow correctness
 */

import {
  calculateSessionProgress,
  validateCDSState,
  captureStateSnapshot,
  routeClinicianDecision,
} from '../state-machine';
import { CDSState, CDSPhase, ClinicianDecision, Recommendation } from '../types';

describe('State Machine Phase Tracking', () => {
  test('should calculate progress for initialized phase', () => {
    const state: Partial<CDSState> = { phase: 'initialized' };
    const progress = calculateSessionProgress(state as CDSState);

    expect(progress.phase).toBe(1);
    expect(progress.totalPhases).toBe(7);
    expect(progress.percentComplete).toBe(Math.round((1 / 7) * 100));
    expect(progress.phaseName).toContain('INITIALIZED');
  });

  test('should calculate progress for evidence gathering phase', () => {
    const state: Partial<CDSState> = { phase: 'evidence_gathering' };
    const progress = calculateSessionProgress(state as CDSState);

    expect(progress.phase).toBe(2);
    expect(progress.percentComplete).toBeGreaterThan(14);
    expect(progress.phaseName).toContain('EVIDENCE');
  });

  test('should calculate progress for complete phase', () => {
    const state: Partial<CDSState> = { phase: 'complete' };
    const progress = calculateSessionProgress(state as CDSState);

    expect(progress.phase).toBe(7);
    expect(progress.percentComplete).toBe(100);
  });
});

describe('CDS State Validation', () => {
  const validState: CDSState = {
    session_id: 'session-123',
    tenant_id: 'tenant-456',
    patient_id: 'patient-789',
    clinician_id: 'clinician-012',
    encounter_id: 'encounter-345',
    modality: 'allopathy',
    triage_result: {} as any,
    triage_level: 'routine',
    phase: 'initialized',
    phase_history: [],
    messages: [],
    evidence: {
      patient_history: {
        chief_complaint: 'Fever',
        history_of_present_illness: 'Started yesterday',
        past_medical_history: [],
        past_surgical_history: [],
        medications_current: [],
        allergies: [],
        family_history: 'None',
        social_history: 'Non-smoker',
        review_of_systems: 'Unremarkable except fever',
        date_captured: new Date().toISOString(),
      },
      lab_results: [],
      evidence_completeness_score: 0.5,
      last_updated: new Date().toISOString(),
      additional_context: '',
    },
    evidence_gaps: [],
    recommendations: [],
    clinician_decisions: [],
    safety_alerts: [],
    triage_override_allowed: true,
    audit_correlation_id: 'corr-123',
    audit_events: [],
    errors: [],
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    completion_status: 'in_progress',
  };

  test('should validate correct state', () => {
    const result = validateCDSState(validState);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing session_id', () => {
    const state = { ...validState, session_id: '' };
    const result = validateCDSState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing session_id');
  });

  test('should detect missing patient_id', () => {
    const state = { ...validState, patient_id: '' };
    const result = validateCDSState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing patient_id');
  });

  test('should detect inconsistent phase and completion status', () => {
    const state = {
      ...validState,
      phase: 'complete' as CDSPhase,
      completion_status: 'in_progress' as const,
    };
    const result = validateCDSState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('completion_status'))).toBe(true);
  });

  test('should detect missing analysis in recommendation phase', () => {
    const state: CDSState = {
      ...validState,
      phase: 'recommendation',
      analysis: undefined,
    };
    const result = validateCDSState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Phase is recommendation but analysis is undefined');
  });

  test('should detect missing chief complaint', () => {
    const state: CDSState = {
      ...validState,
      evidence: {
        ...validState.evidence,
        patient_history: {
          ...validState.evidence.patient_history,
          chief_complaint: '',
        },
      },
    };
    const result = validateCDSState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Patient history missing chief complaint');
  });
});

describe('Clinician Decision Routing', () => {
  const testRecommendation: Recommendation = {
    recommendation_id: 'rec-123',
    medicine_name: 'Test Medicine',
    dose: '500mg',
    frequency: 'twice daily',
    duration: '7 days',
    route: 'oral',
    rationale: 'Test',
    confidence_score: 0.8,
    confidence_category: 'high',
    monograph_id: 'mono-123',
    sources: [],
    contraindications: [],
    interactions: [],
    relative_to_differential: 'Test',
    reasoning_chain: 'Test',
    requires_monitoring: false,
    timestamp: new Date().toISOString(),
  };

  test('should route accept decision', () => {
    const decision: ClinicianDecision = {
      recommendation_id: 'rec-123',
      decision: 'accept',
      timestamp: new Date().toISOString(),
      clinician_id: 'clinician-123',
    };

    const result = routeClinicianDecision(decision, testRecommendation);
    expect(result).toBe('accept');
  });

  test('should route override decision with justification', () => {
    const decision: ClinicianDecision = {
      recommendation_id: 'rec-123',
      decision: 'override',
      override_justification: 'Patient has allergy to recommended medicine',
      timestamp: new Date().toISOString(),
      clinician_id: 'clinician-123',
    };

    const result = routeClinicianDecision(decision, testRecommendation);
    expect(result).toBe('override');
  });

  test('should reject override without justification', () => {
    const decision: ClinicianDecision = {
      recommendation_id: 'rec-123',
      decision: 'override',
      timestamp: new Date().toISOString(),
      clinician_id: 'clinician-123',
    };

    expect(() => routeClinicianDecision(decision, testRecommendation)).toThrow(
      'Override requires justification'
    );
  });

  test('should route request_alternative decision', () => {
    const decision: ClinicianDecision = {
      recommendation_id: 'rec-123',
      decision: 'request_alternative',
      timestamp: new Date().toISOString(),
      clinician_id: 'clinician-123',
    };

    const result = routeClinicianDecision(decision, testRecommendation);
    expect(result).toBe('request_alternative');
  });

  test('should route reject decision', () => {
    const decision: ClinicianDecision = {
      recommendation_id: 'rec-123',
      decision: 'reject',
      timestamp: new Date().toISOString(),
      clinician_id: 'clinician-123',
    };

    const result = routeClinicianDecision(decision, testRecommendation);
    expect(result).toBe('reject');
  });
});

describe('State Snapshots for Debugging', () => {
  test('should capture state snapshot with key metrics', () => {
    const state: CDSState = {
      session_id: 'session-123',
      tenant_id: 'tenant-456',
      patient_id: 'patient-789',
      clinician_id: 'clinician-012',
      encounter_id: 'encounter-345',
      modality: 'allopathy',
      triage_result: {} as any,
      triage_level: 'routine',
      phase: 'recommendation',
      phase_history: [],
      messages: [],
      evidence: {
        patient_history: {
          chief_complaint: 'Fever',
          history_of_present_illness: '',
          past_medical_history: [],
          past_surgical_history: [],
          medications_current: [],
          allergies: [],
          family_history: '',
          social_history: '',
          review_of_systems: '',
          date_captured: new Date().toISOString(),
        },
        lab_results: [],
        evidence_completeness_score: 0.75,
        last_updated: new Date().toISOString(),
        additional_context: '',
      },
      evidence_gaps: [],
      recommendations: [
        {
          recommendation_id: 'rec-1',
          medicine_name: 'Med 1',
          dose: '500mg',
          frequency: 'twice',
          duration: '7d',
          route: 'oral',
          rationale: 'test',
          confidence_score: 0.8,
          confidence_category: 'high',
          monograph_id: 'mono-1',
          sources: [],
          contraindications: [],
          interactions: [],
          relative_to_differential: 'test',
          reasoning_chain: 'test',
          requires_monitoring: false,
          timestamp: new Date().toISOString(),
        },
      ],
      clinician_decisions: [],
      safety_alerts: [],
      triage_override_allowed: true,
      audit_correlation_id: 'corr-123',
      audit_events: [],
      errors: [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      completion_status: 'in_progress',
    };

    const snapshot = captureStateSnapshot(state);

    expect(snapshot).toHaveProperty('session_id');
    expect(snapshot).toHaveProperty('phase', 'recommendation');
    expect(snapshot).toHaveProperty('completion_status', 'in_progress');
    expect(snapshot).toHaveProperty('recommendations_count', 1);
    expect(snapshot).toHaveProperty('evidence_completeness');
    expect(snapshot).toHaveProperty('safety_alerts_count', 0);
  });
});
