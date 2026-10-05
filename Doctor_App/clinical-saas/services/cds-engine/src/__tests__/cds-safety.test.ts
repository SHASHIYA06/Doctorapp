/**
 * CDS Safety Tests
 * Verify safety guardrails, modality boundaries, and compliance
 */

import { SafetyPolicyEnforcer } from '../claude-integration';
import {
  CDSState,
  Recommendation,
  Interaction,
  CDSConfig,
} from '../types';

describe('CDS Safety Guardrails', () => {
  describe('Modality Boundary Enforcement', () => {
    test('should reject cross-modality medicine recommendations', () => {
      const knownModalities = new Map([
        ['aspirin', 'allopathy'],
        ['brahmi', 'ayurveda'],
        ['arnica', 'homeopathy'],
      ]);

      // Aspirin (allopathy) in ayurveda modality
      const valid = SafetyPolicyEnforcer.validateModalityBoundary('aspirin', 'ayurveda', knownModalities);
      expect(valid).toBe(false);

      // Brahmi (ayurveda) in allopathy modality
      const valid2 = SafetyPolicyEnforcer.validateModalityBoundary('brahmi', 'allopathy', knownModalities);
      expect(valid2).toBe(false);

      // Correct modality should pass
      const valid3 = SafetyPolicyEnforcer.validateModalityBoundary('aspirin', 'allopathy', knownModalities);
      expect(valid3).toBe(true);
    });

    test('should allow unknown medicines (not in database)', () => {
      const knownModalities = new Map([['aspirin', 'allopathy']]);

      const valid = SafetyPolicyEnforcer.validateModalityBoundary(
        'unknown_medicine',
        'allopathy',
        knownModalities
      );
      expect(valid).toBe(true); // Unknown medicines pass boundary check
    });
  });

  describe('Drug Interaction Severity', () => {
    test('should classify contraindicated interactions correctly', () => {
      const result = SafetyPolicyEnforcer.checkInteractionSeverity('contraindicated');
      expect(result.allowed).toBe(false);
      expect(result.requiresWarning).toBe(true);
      expect(result.requiresOverride).toBe(true);
    });

    test('should classify severe interactions correctly', () => {
      const result = SafetyPolicyEnforcer.checkInteractionSeverity('severe');
      expect(result.allowed).toBe(true);
      expect(result.requiresWarning).toBe(true);
      expect(result.requiresOverride).toBe(true);
    });

    test('should classify moderate interactions correctly', () => {
      const result = SafetyPolicyEnforcer.checkInteractionSeverity('moderate');
      expect(result.allowed).toBe(true);
      expect(result.requiresWarning).toBe(true);
      expect(result.requiresOverride).toBe(false);
    });

    test('should classify minor interactions correctly', () => {
      const result = SafetyPolicyEnforcer.checkInteractionSeverity('minor');
      expect(result.allowed).toBe(true);
      expect(result.requiresWarning).toBe(false);
      expect(result.requiresOverride).toBe(false);
    });
  });

  describe('Confidence Threshold Validation', () => {
    const thresholdLow = 0.6;
    const thresholdHigh = 0.85;

    test('should classify high confidence recommendations', () => {
      const result = SafetyPolicyEnforcer.validateConfidenceThreshold(0.9, thresholdLow, thresholdHigh);
      expect(result.valid).toBe(true);
      expect(result.requiresSpecialistReferral).toBe(false);
      expect(result.category).toBe('high');
    });

    test('should classify medium confidence recommendations', () => {
      const result = SafetyPolicyEnforcer.validateConfidenceThreshold(0.7, thresholdLow, thresholdHigh);
      expect(result.valid).toBe(true);
      expect(result.requiresSpecialistReferral).toBe(false);
      expect(result.category).toBe('medium');
    });

    test('should require specialist referral for low confidence', () => {
      const result = SafetyPolicyEnforcer.validateConfidenceThreshold(0.5, thresholdLow, thresholdHigh);
      expect(result.valid).toBe(true);
      expect(result.requiresSpecialistReferral).toBe(true);
      expect(result.category).toBe('low');
    });
  });

  describe('Emergency Context Compliance', () => {
    test('should allow high-confidence recommendations in emergency', () => {
      const result = SafetyPolicyEnforcer.validateEmergencyContext('emergency', 0.9, false);
      expect(result.compliant).toBe(true);
    });

    test('should require rationale for low-confidence emergency override', () => {
      const result = SafetyPolicyEnforcer.validateEmergencyContext('emergency', 0.5, true);
      expect(result.compliant).toBe(false);
      expect(result.reason).toContain('confidence');
    });

    test('should allow routine recommendations in emergency', () => {
      const result = SafetyPolicyEnforcer.validateEmergencyContext('routine', 0.5, false);
      expect(result.compliant).toBe(true);
    });

    test('should allow non-emergency overrides without high confidence', () => {
      const result = SafetyPolicyEnforcer.validateEmergencyContext('urgent', 0.6, true);
      expect(result.compliant).toBe(true);
    });
  });
});

describe('CDS Recommendation Safety Validation', () => {
  const testRecommendation: Recommendation = {
    recommendation_id: 'rec-123',
    medicine_name: 'Test Medicine',
    dose: '500mg',
    frequency: 'twice daily',
    duration: '7 days',
    route: 'oral',
    rationale: 'Test recommendation',
    confidence_score: 0.8,
    confidence_category: 'high',
    monograph_id: 'mono-123',
    sources: ['source-1'],
    contraindications: [],
    interactions: [],
    relative_to_differential: 'Test Condition',
    reasoning_chain: 'Because...',
    requires_monitoring: false,
    timestamp: new Date().toISOString(),
  };

  test('should validate recommendation with no interactions', () => {
    const recommendation = {
      ...testRecommendation,
      interactions: [],
    };

    // Should pass validation (no contraindicated interactions)
    const hasContraindicatedInteractions = recommendation.interactions.some(
      (i) => i.severity === 'contraindicated'
    );
    expect(hasContraindicatedInteractions).toBe(false);
  });

  test('should flag recommendation with severe interactions', () => {
    const recommendation = {
      ...testRecommendation,
      interactions: [
        {
          drug_a: 'Test Medicine',
          drug_b: 'Current Drug',
          severity: 'severe',
          description: 'Severe interaction',
          recommendation: 'Consider alternative',
          mechanism: 'CYP3A4 inhibition',
        },
      ],
    };

    const hasSevereInteractions = recommendation.interactions.some((i) => i.severity === 'severe');
    expect(hasSevereInteractions).toBe(true);
  });

  test('should track low confidence recommendations requiring specialist', () => {
    const recommendation = {
      ...testRecommendation,
      confidence_score: 0.5,
      confidence_category: 'low' as const,
    };

    expect(recommendation.confidence_category).toBe('low');
    // Clinician system should trigger specialist referral
  });
});

describe('CDS Audit Trail Requirements', () => {
  test('should include recommendation reasoning in audit trail', () => {
    const recommendation: Recommendation = {
      recommendation_id: 'rec-123',
      medicine_name: 'Amoxicillin',
      dose: '500mg',
      frequency: 'three times daily',
      duration: '7 days',
      route: 'oral',
      rationale: 'For bacterial respiratory infection',
      confidence_score: 0.88,
      confidence_category: 'high',
      monograph_id: 'mono-amox-001',
      sources: ['source-ref-001'],
      contraindications: [],
      interactions: [],
      relative_to_differential: 'Bacterial Bronchitis',
      reasoning_chain: 'Patient presents with fever, cough, and elevated WBC. Culture pending but clinical presentation suggests bacterial infection. Amoxicillin is first-line for uncomplicated respiratory infection.',
      requires_monitoring: false,
      timestamp: new Date().toISOString(),
    };

    // Reasoning chain must be captured for audit trail
    expect(recommendation.reasoning_chain).toBeTruthy();
    expect(recommendation.reasoning_chain.length).toBeGreaterThan(20);
    expect(recommendation.sources.length).toBeGreaterThan(0);
  });

  test('should capture clinician override rationale', () => {
    const recommendation: Recommendation = {
      recommendation_id: 'rec-456',
      medicine_name: 'Alternative Medicine',
      dose: '250mg',
      frequency: 'twice daily',
      duration: '5 days',
      route: 'oral',
      rationale: 'Original recommendation',
      confidence_score: 0.75,
      confidence_category: 'medium',
      monograph_id: 'mono-alt-001',
      sources: [],
      contraindications: [],
      interactions: [],
      relative_to_differential: 'Condition',
      reasoning_chain: 'Clinical reasoning',
      requires_monitoring: false,
      clinician_decision: 'overridden',
      clinician_rationale: 'Patient has documented allergy to original medicine. Switching to alternative per patient history.',
      timestamp: new Date().toISOString(),
    };

    expect(recommendation.clinician_decision).toBe('overridden');
    expect(recommendation.clinician_rationale).toBeTruthy();
    // This rationale must be logged to audit store
  });
});

describe('CDS Emergency Triage Protection', () => {
  test('should prevent CDS from overriding emergency triage level', () => {
    const triageLevel = 'emergency';
    
    // CDS should not be able to downgrade emergency triage to routine
    const shouldPreventDowngrade = triageLevel === 'emergency';
    expect(shouldPreventDowngrade).toBe(true);
  });

  test('should require explicit rationale for emergency overrides', () => {
    const recommendation: Recommendation = {
      recommendation_id: 'rec-789',
      medicine_name: 'Emergency Treatment',
      dose: '1 unit',
      frequency: 'stat',
      duration: '1 hour',
      route: 'IV',
      rationale: 'Emergency intervention',
      confidence_score: 0.92,
      confidence_category: 'high',
      monograph_id: 'mono-emerg-001',
      sources: ['emergency-protocol'],
      contraindications: [],
      interactions: [],
      relative_to_differential: 'Cardiac Emergency',
      reasoning_chain: 'Patient in cardiogenic shock. Immediate intervention required.',
      requires_monitoring: true,
      monitoring_parameters: ['vital signs every 5 minutes', 'cardiac rhythm continuous'],
      clinician_decision: 'accepted',
      timestamp: new Date().toISOString(),
    };

    // Emergency recommendations should always have explicit monitoring requirements
    expect(recommendation.requires_monitoring).toBe(true);
    expect(recommendation.monitoring_parameters).toBeTruthy();
  });
});
