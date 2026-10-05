/**
 * CDS Workflow Component
 * Main component for Clinical Decision Support workflow in clinician dashboard
 */

import React, { useState, useEffect } from 'react';
import { CDSState, Recommendation, ClinicianDecision } from '@clinical-saas/cds-engine';

interface CDSWorkflowProps {
  sessionId: string;
  triageLevel: string;
  patientName: string;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  onComplete: (careplanId: string) => void;
  onCancel: () => void;
}

/**
 * CDS Workflow State
 */
interface WorkflowState {
  phase: string;
  loading: boolean;
  error?: string;
  cdsState?: CDSState;
  progressPercent: number;
}

export const CDSWorkflow: React.FC<CDSWorkflowProps> = ({
  sessionId,
  triageLevel,
  patientName,
  modality,
  onComplete,
  onCancel,
}) => {
  const [state, setState] = useState<WorkflowState>({
    phase: 'initialized',
    loading: false,
    progressPercent: 0,
  });

  // Load CDS session state
  useEffect(() => {
    const loadSession = async () => {
      try {
        setState((s) => ({ ...s, loading: true }));
        const response = await fetch(`/v1/cds/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load CDS session');
        const cdsState = await response.json();
        setState((s) => ({ ...s, cdsState, loading: false }));
      } catch (error) {
        setState((s) => ({
          ...s,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    loadSession();
  }, [sessionId]);

  const handleExecutePhase = async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const response = await fetch(`/v1/cds/sessions/${sessionId}/execute`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to execute phase');
      const result = await response.json();
      setState((s) => ({
        ...s,
        phase: result.phase,
        progressPercent: calculateProgress(result.phase),
        loading: false,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  };

  const calculateProgress = (phase: string): number => {
    const phases = [
      'initialized',
      'evidence_gathering',
      'analysis',
      'recommendation',
      'review',
      'draft_plan',
      'complete',
    ];
    const index = phases.indexOf(phase);
    return Math.round(((index + 1) / phases.length) * 100);
  };

  return (
    <div className="cds-workflow">
      <div className="workflow-header">
        <h2>Clinical Decision Support for {patientName}</h2>
        <div className="workflow-meta">
          <span className="triage-badge" data-level={triageLevel}>
            {triageLevel.toUpperCase()}
          </span>
          <span className="modality-badge">{modality}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${state.progressPercent}%` }}
            />
            <span className="progress-text">{state.progressPercent}%</span>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="error-alert">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {state.cdsState && (
        <>
          {state.phase === 'evidence_gathering' && (
            <EvidenceGatheringPhase
              sessionId={sessionId}
              onNext={handleExecutePhase}
              loading={state.loading}
            />
          )}

          {state.phase === 'recommendation' && (
            <RecommendationPhase
              sessionId={sessionId}
              recommendations={state.cdsState.recommendations}
              triageLevel={triageLevel}
              onNext={handleExecutePhase}
              onRecordDecision={() => {}}
              loading={state.loading}
            />
          )}

          {state.phase === 'review' && (
            <ReviewPhase
              sessionId={sessionId}
              recommendations={state.cdsState.recommendations}
              clinicianDecisions={state.cdsState.clinician_decisions}
              onNext={handleExecutePhase}
              loading={state.loading}
            />
          )}

          {state.phase === 'complete' && (
            <CompletionPhase
              careplanDraft={state.cdsState.draft_careplan}
              onComplete={() => onComplete(state.cdsState!.draft_careplan?.careplan_id || '')}
            />
          )}
        </>
      )}

      <div className="workflow-actions">
        <button onClick={onCancel} disabled={state.loading} className="btn-secondary">
          Cancel Session
        </button>
      </div>
    </div>
  );
};

/**
 * Evidence Gathering Phase Component
 */
interface EvidenceGatheringPhaseProps {
  sessionId: string;
  onNext: () => void;
  loading: boolean;
}

const EvidenceGatheringPhase: React.FC<EvidenceGatheringPhaseProps> = ({
  sessionId,
  onNext,
  loading,
}) => {
  const [vitalSigns, setVitalSigns] = useState({
    temperature_c: '',
    heart_rate_bpm: '',
    blood_pressure: '',
    respiratory_rate: '',
    oxygen_saturation: '',
  });

  const handleSubmitEvidence = async () => {
    try {
      const response = await fetch(`/v1/cds/sessions/${sessionId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vital_signs: vitalSigns }),
      });
      if (!response.ok) throw new Error('Failed to submit evidence');
      onNext();
    } catch (error) {
      console.error('Error submitting evidence:', error);
    }
  };

  return (
    <div className="phase-container evidence-gathering">
      <h3>Step 1: Gather Clinical Evidence</h3>
      <p className="phase-description">
        Please provide vital signs and clinical examination data to help the CDS generate accurate
        recommendations.
      </p>

      <form className="evidence-form">
        <fieldset>
          <legend>Vital Signs</legend>

          <label>
            Temperature (°C)
            <input
              type="number"
              step="0.1"
              min="35"
              max="42"
              value={vitalSigns.temperature_c}
              onChange={(e) =>
                setVitalSigns((s) => ({ ...s, temperature_c: e.target.value }))
              }
              placeholder="36.5"
            />
          </label>

          <label>
            Heart Rate (bpm)
            <input
              type="number"
              min="40"
              max="200"
              value={vitalSigns.heart_rate_bpm}
              onChange={(e) =>
                setVitalSigns((s) => ({ ...s, heart_rate_bpm: e.target.value }))
              }
              placeholder="72"
            />
          </label>

          <label>
            Blood Pressure (mmHg)
            <input
              type="text"
              value={vitalSigns.blood_pressure}
              onChange={(e) =>
                setVitalSigns((s) => ({ ...s, blood_pressure: e.target.value }))
              }
              placeholder="120/80"
            />
          </label>

          <label>
            Respiratory Rate (breaths/min)
            <input
              type="number"
              min="8"
              max="40"
              value={vitalSigns.respiratory_rate}
              onChange={(e) =>
                setVitalSigns((s) => ({ ...s, respiratory_rate: e.target.value }))
              }
              placeholder="16"
            />
          </label>

          <label>
            Oxygen Saturation (%)
            <input
              type="number"
              min="70"
              max="100"
              value={vitalSigns.oxygen_saturation}
              onChange={(e) =>
                setVitalSigns((s) => ({ ...s, oxygen_saturation: e.target.value }))
              }
              placeholder="98"
            />
          </label>
        </fieldset>

        <button
          type="button"
          onClick={handleSubmitEvidence}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Submitting...' : 'Submit Evidence & Continue'}
        </button>
      </form>
    </div>
  );
};

/**
 * Recommendation Phase Component
 */
interface RecommendationPhaseProps {
  sessionId: string;
  recommendations: Recommendation[];
  triageLevel: string;
  onNext: () => void;
  onRecordDecision: (decision: ClinicianDecision) => void;
  loading: boolean;
}

const RecommendationPhase: React.FC<RecommendationPhaseProps> = ({
  sessionId,
  recommendations,
  triageLevel,
  onNext,
  onRecordDecision,
  loading,
}) => {
  const [decisions, setDecisions] = useState<Record<string, string>>({});

  const handleDecisionChange = (recId: string, decision: string) => {
    setDecisions((d) => ({ ...d, [recId]: decision }));
  };

  const handleSubmitDecisions = async () => {
    try {
      for (const [recId, decision] of Object.entries(decisions)) {
        await fetch(`/v1/cds/sessions/${sessionId}/decisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation_id: recId,
            decision,
          }),
        });
      }
      onNext();
    } catch (error) {
      console.error('Error submitting decisions:', error);
    }
  };

  return (
    <div className="phase-container recommendations">
      <h3>Step 2: Evidence-Based Recommendations</h3>
      <p className="phase-description">
        Claude has generated the following recommendations based on the clinical evidence. Review
        and accept or override each recommendation.
      </p>

      {triageLevel === 'emergency' && (
        <div className="emergency-note">
          <strong>⚠️ Emergency Case:</strong> Recommendations support specialist evaluation. Do
          not delay emergency response.
        </div>
      )}

      <div className="recommendations-list">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.recommendation_id}
            recommendation={rec}
            decision={decisions[rec.recommendation_id] || 'pending'}
            onDecisionChange={(decision) =>
              handleDecisionChange(rec.recommendation_id, decision)
            }
          />
        ))}
      </div>

      <button
        onClick={handleSubmitDecisions}
        disabled={loading || Object.keys(decisions).length === 0}
        className="btn-primary"
      >
        {loading ? 'Submitting...' : 'Submit Review & Continue'}
      </button>
    </div>
  );
};

/**
 * Single Recommendation Card
 */
interface RecommendationCardProps {
  recommendation: Recommendation;
  decision: string;
  onDecisionChange: (decision: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  decision,
  onDecisionChange,
}) => {
  return (
    <div className={`recommendation-card confidence-${recommendation.confidence_category}`}>
      <div className="rec-header">
        <h4>{recommendation.medicine_name}</h4>
        <span className="confidence-badge" data-category={recommendation.confidence_category}>
          {(recommendation.confidence_score * 100).toFixed(0)}% confidence
        </span>
      </div>

      <div className="rec-details">
        <p>
          <strong>Dose:</strong> {recommendation.dose} {recommendation.frequency}
        </p>
        <p>
          <strong>Duration:</strong> {recommendation.duration}
        </p>
        <p>
          <strong>Route:</strong> {recommendation.route}
        </p>
        <p>
          <strong>Rationale:</strong> {recommendation.rationale}
        </p>

        {recommendation.interactions.length > 0 && (
          <div className="interactions-section">
            <strong>Drug Interactions:</strong>
            <ul>
              {recommendation.interactions.map((interaction, i) => (
                <li key={i} className={`interaction-${interaction.severity}`}>
                  {interaction.drug_a} + {interaction.drug_b}: {interaction.severity}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.requires_monitoring && (
          <div className="monitoring-section">
            <strong>Monitoring Required:</strong>
            <ul>
              {recommendation.monitoring_parameters?.map((param, i) => (
                <li key={i}>{param}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rec-decision">
        <label>
          <input
            type="radio"
            name={`decision-${recommendation.recommendation_id}`}
            value="accept"
            checked={decision === 'accept'}
            onChange={(e) => onDecisionChange(e.target.value)}
          />
          Accept
        </label>
        <label>
          <input
            type="radio"
            name={`decision-${recommendation.recommendation_id}`}
            value="override"
            checked={decision === 'override'}
            onChange={(e) => onDecisionChange(e.target.value)}
          />
          Override
        </label>
        <label>
          <input
            type="radio"
            name={`decision-${recommendation.recommendation_id}`}
            value="reject"
            checked={decision === 'reject'}
            onChange={(e) => onDecisionChange(e.target.value)}
          />
          Reject
        </label>
      </div>
    </div>
  );
};

/**
 * Review Phase Component
 */
interface ReviewPhaseProps {
  sessionId: string;
  recommendations: Recommendation[];
  clinicianDecisions: ClinicianDecision[];
  onNext: () => void;
  loading: boolean;
}

const ReviewPhase: React.FC<ReviewPhaseProps> = ({
  sessionId,
  recommendations,
  clinicianDecisions,
  onNext,
  loading,
}) => {
  const acceptedCount = clinicianDecisions.filter((d) => d.decision === 'accept').length;
  const overriddenCount = clinicianDecisions.filter((d) => d.decision === 'override').length;

  return (
    <div className="phase-container review">
      <h3>Step 3: Review & Finalize</h3>
      <p className="phase-description">
        Summary of clinician decisions. Care plan will be generated from accepted recommendations.
      </p>

      <div className="review-summary">
        <div className="summary-stat">
          <span className="label">Accepted:</span>
          <span className="value">{acceptedCount}</span>
        </div>
        <div className="summary-stat">
          <span className="label">Overridden:</span>
          <span className="value">{overriddenCount}</span>
        </div>
        <div className="summary-stat">
          <span className="label">Total:</span>
          <span className="value">{recommendations.length}</span>
        </div>
      </div>

      <div className="decision-summary">
        {clinicianDecisions.map((decision) => {
          const rec = recommendations.find((r) => r.recommendation_id === decision.recommendation_id);
          return (
            <div key={decision.recommendation_id} className={`decision-item decision-${decision.decision}`}>
              <span className="medicine">{rec?.medicine_name}</span>
              <span className="decision-label">{decision.decision}</span>
              {decision.rationale && <span className="rationale">{decision.rationale}</span>}
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Generating Care Plan...' : 'Generate & Review Care Plan'}
      </button>
    </div>
  );
};

/**
 * Completion Phase Component
 */
interface CompletionPhaseProps {
  careplanDraft?: any;
  onComplete: () => void;
}

const CompletionPhase: React.FC<CompletionPhaseProps> = ({ careplanDraft, onComplete }) => {
  return (
    <div className="phase-container completion">
      <h3>✓ CDS Session Complete</h3>
      <p className="phase-description">
        Care plan has been drafted and is ready for clinician review and signing.
      </p>

      {careplanDraft && (
        <div className="careplan-preview">
          <h4>Care Plan Summary</h4>
          <div className="medications">
            <h5>Medications:</h5>
            <ul>
              {careplanDraft.medications?.map((med: any, i: number) => (
                <li key={i}>
                  {med.medicine} - {med.dose} {med.frequency} for {med.duration}
                </li>
              ))}
            </ul>
          </div>
          <div className="instructions">
            <h5>Follow-up Instructions:</h5>
            <ul>
              {careplanDraft.follow_up_instructions?.map((instr: string, i: number) => (
                <li key={i}>{instr}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button onClick={onComplete} className="btn-primary">
        Proceed to Care Plan Signing
      </button>
    </div>
  );
};

export default CDSWorkflow;
