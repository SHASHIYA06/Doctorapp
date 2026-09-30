/**
 * CDS API Routes
 * REST endpoints for Clinical Decision Support workflow
 */

import express, { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createCDSSession,
  CDSGraph,
  CDSState,
  CDSSessionInput,
  CDSConfig,
  CDSPhase,
} from '@clinical-saas/cds-engine';
import {
  TriageCDSBoundary,
  TriageCDSOrchestrator,
  orchestrateTriageCDSWorkflow,
} from '@clinical-saas/cds-engine';
import { rbac, requireMFA, auditLog, AuthenticatedRequest } from './rbac';
import { auditStore, createAuditPatterns } from 'audit-service';

const router = Router();

// In-memory session store (production: use database)
const cdsSessionStore = new Map<string, CDSState>();

// CDS Configuration
const cdsConfig: CDSConfig = {
  claude_api_key: process.env.ANTHROPIC_API_KEY || '',
  claude_model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  max_tokens: parseInt(process.env.CDS_MAX_TOKENS || '2048'),
  temperature: parseFloat(process.env.CDS_TEMPERATURE || '0.3'),
  enable_monograph_lookup: process.env.CDS_ENABLE_MONOGRAPH_LOOKUP !== 'false',
  enable_interaction_checking: process.env.CDS_ENABLE_INTERACTION_CHECKING !== 'false',
  confidence_threshold_low: 0.6,
  confidence_threshold_high: 0.85,
  max_recommendations: 5,
  emergency_override_allowed: true,
  emergency_require_rationale: true,
  audit_store_enabled: true,
};

// ============================================================================
// CDS SESSION ROUTES
// ============================================================================

/**
 * POST /v1/cds/sessions/from-triage
 * Create CDS session from triage result (triage-to-CDS handoff)
 */
router.post(
  '/v1/cds/sessions/from-triage',
  rbac('CDSSession', 'create'),
  auditLog('create'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { triage_assessment, encounter_id, modality } = req.body;

      // Validation
      if (!triage_assessment || !encounter_id || !modality) {
        return res.status(400).json({
          error: 'Missing required fields: triage_assessment, encounter_id, modality',
        });
      }

      // Orchestrate triage-CDS handoff
      const handoffResult = await orchestrateTriageCDSWorkflow(triage_assessment, cdsConfig);

      if (!handoffResult.valid) {
        return res.status(400).json({
          error: 'Triage validation failed',
          details: handoffResult.errors,
        });
      }

      if (!handoffResult.cdsInitialized) {
        return res.status(400).json({
          error: 'CDS not initialized for this triage result',
          details: handoffResult.errors,
        });
      }

      // Create CDS session
      const sessionInput: CDSSessionInput = {
        tenant_id: req.user!.tenant_id,
        patient_id: triage_assessment.patient_id,
        clinician_id: req.user!.user_id,
        encounter_id,
        modality: modality as 'allopathy' | 'ayurveda' | 'homeopathy',
        triage_result: triage_assessment,
      };

      const session = await createCDSSession(sessionInput);

      // Record triage-CDS handoff in audit trail
      const auditPatterns = createAuditPatterns();
      const orchestrator = new TriageCDSOrchestrator(
        handoffResult.triageContext!,
        cdsConfig
      );
      const handoffEntry = orchestrator.generateHandoffAuditEntry();

      cdsSessionStore.set(session.session_id, session);

      res.status(201).json({
        session_id: session.session_id,
        status: 'initialized',
        phase: session.phase,
        modality: session.modality,
        triage_level: session.triage_level,
        triage_integration: {
          triage_id: triage_assessment.triage_id,
          rule_version: triage_assessment.rule_version_id,
          triggered_rules: triage_assessment.triggered_rules,
        },
      });
    } catch (error) {
      console.error('Error creating CDS session from triage:', error);
      res.status(500).json({
        error:
          process.env.NODE_ENV === 'production'
            ? 'Failed to create CDS session from triage'
            : (error as Error).message,
      });
    }
  }
);

/**
 * POST /v1/cds/sessions
 * Initialize a new CDS session for a patient
 */
router.post(
  '/v1/cds/sessions',
  rbac('CDSSession', 'create'),
  auditLog('create'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { patient_id, encounter_id, modality, triage_result, patient_history } = req.body;

      // Validation
      if (!patient_id || !encounter_id || !modality || !triage_result) {
        return res.status(400).json({
          error: 'Missing required fields: patient_id, encounter_id, modality, triage_result',
        });
      }

      if (!['allopathy', 'ayurveda', 'homeopathy'].includes(modality)) {
        return res.status(400).json({ error: 'Invalid modality' });
      }

      // Create session input
      const sessionInput: CDSSessionInput = {
        tenant_id: req.user!.tenant_id,
        patient_id,
        clinician_id: req.user!.user_id,
        encounter_id,
        modality: modality as 'allopathy' | 'ayurveda' | 'homeopathy',
        triage_result,
        patient_history,
      };

      // Create session
      const session = await createCDSSession(sessionInput);
      cdsSessionStore.set(session.session_id, session);

      // Audit log
      const auditPatterns = createAuditPatterns();
      auditPatterns.recordPlanDrafted(
        req.user!.tenant_id,
        patient_id,
        session.session_id,
        'cds-service',
        cdsConfig.claude_model
      );

      res.status(201).json({
        session_id: session.session_id,
        status: 'initialized',
        phase: session.phase,
        modality: session.modality,
        triage_level: session.triage_level,
      });
    } catch (error) {
      console.error('Error creating CDS session:', error);
      res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Failed to create CDS session' : (error as Error).message,
      });
    }
  }
);

/**
 * POST /v1/cds/sessions/:session_id/validate-against-triage
 * Validate CDS recommendations against triage decision
 */
router.post(
  '/v1/cds/sessions/:session_id/validate-against-triage',
  rbac('CDSSession', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;

      const session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Extract triage context
      const triageContext = TriageCDSBoundary.extractTriageContext(session.triage_result);

      // Validate recommendations against triage
      const validation = TriageCDSBoundary.validateCDSAgainstTriage(
        triageContext,
        session.recommendations
      );

      res.json({
        session_id,
        valid: validation.valid,
        violations: validation.violations,
        flagged_recommendations: validation.flagged_recommendations,
        triage_level: session.triage_level,
        recommendations_count: session.recommendations.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to validate recommendations against triage' });
    }
  }
);

/**
 * GET /v1/cds/sessions/:session_id
 * Get CDS session state
 */
router.get(
  '/v1/cds/sessions/:session_id',
  rbac('CDSSession', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;

      const session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Check tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        session_id: session.session_id,
        phase: session.phase,
        completion_status: session.completion_status,
        recommendations_count: session.recommendations.length,
        clinician_decisions_count: session.clinician_decisions.length,
        safety_alerts_count: session.safety_alerts.length,
        last_updated: session.last_updated,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve CDS session' });
    }
  }
);

/**
 * OLD GET /v1/cds/sessions/:session_id (keeping for reference)
 * Get CDS session state
 */

/**
 * POST /v1/cds/sessions/:session_id/evidence
 * Provide clinical evidence for a CDS session
 */
router.post(
  '/v1/cds/sessions/:session_id/evidence',
  rbac('CDSSession', 'update'),
  auditLog('update'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;
      const { vital_signs, physical_examination, lab_results, additional_context } = req.body;

      const session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update evidence
      if (vital_signs) {
        session.evidence.vital_signs = {
          ...vital_signs,
          timestamp: new Date().toISOString(),
        };
      }

      if (physical_examination) {
        session.evidence.physical_examination = {
          ...physical_examination,
          timestamp: new Date().toISOString(),
        };
      }

      if (lab_results) {
        session.evidence.lab_results = lab_results.map((result: any) => ({
          ...result,
          timestamp: new Date().toISOString(),
        }));
      }

      if (additional_context) {
        session.evidence.additional_context = additional_context;
      }

      // Update completeness score
      const evidenceItems = [
        session.evidence.vital_signs ? 1 : 0,
        session.evidence.physical_examination ? 1 : 0,
        session.evidence.lab_results.length > 0 ? 1 : 0,
        session.evidence.additional_context ? 1 : 0,
      ];
      session.evidence.evidence_completeness_score = evidenceItems.filter((v) => v === 1).length / 4;

      // Update session
      session.evidence.last_updated = new Date().toISOString();
      cdsSessionStore.set(session_id, session);

      res.json({
        session_id,
        evidence_completeness_score: session.evidence.evidence_completeness_score,
        phase: session.phase,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update evidence' });
    }
  }
);

/**
 * POST /v1/cds/sessions/:session_id/execute
 * Execute the next CDS workflow phase
 */
router.post(
  '/v1/cds/sessions/:session_id/execute',
  rbac('CDSSession', 'execute'),
  auditLog('execute'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;

      let session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Execute CDS graph
      const graph = new CDSGraph(cdsConfig);

      switch (session.phase) {
        case 'initialized':
          session = { ...session, ...(await graph.initializeSession(session)) };
          break;
        case 'evidence_gathering':
          session = { ...session, ...(await graph.gatherEvidence(session)) };
          break;
        case 'analysis':
          session = { ...session, ...(await graph.analyzeEvidence(session)) };
          break;
        case 'recommendation':
          session = { ...session, ...(await graph.generateRecommendations(session)) };
          break;
        case 'review':
          session = { ...session, ...(await graph.performSafetyCheck(session)) };
          break;
        case 'draft_plan':
          session = { ...session, ...(await graph.draftCarePlan(session)) };
          break;
        case 'complete':
          session = { ...session, ...(await graph.completeCDSSession(session)) };
          break;
        default:
          return res.status(400).json({ error: `Unknown phase: ${session.phase}` });
      }

      // Update session store
      cdsSessionStore.set(session_id, session);

      res.json({
        session_id,
        phase: session.phase,
        completion_status: session.completion_status,
        recommendations_count: session.recommendations.length,
        next_phase: session.completion_status === 'completed' ? null : 'next phase',
      });
    } catch (error) {
      console.error('Error executing CDS session:', error);
      res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Failed to execute CDS session' : (error as Error).message,
      });
    }
  }
);

/**
 * GET /v1/cds/sessions/:session_id/recommendations
 * Get recommendations for a CDS session
 */
router.get(
  '/v1/cds/sessions/:session_id/recommendations',
  rbac('CDSSession', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;

      const session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        session_id,
        recommendations: session.recommendations.map((r) => ({
          recommendation_id: r.recommendation_id,
          medicine_name: r.medicine_name,
          dose: r.dose,
          frequency: r.frequency,
          duration: r.duration,
          confidence_score: r.confidence_score,
          confidence_category: r.confidence_category,
          rationale: r.rationale,
          contraindications: r.contraindications,
          requires_monitoring: r.requires_monitoring,
          clinician_decision: r.clinician_decision,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve recommendations' });
    }
  }
);

/**
 * POST /v1/cds/sessions/:session_id/decisions
 * Record clinician decision on a recommendation
 */
router.post(
  '/v1/cds/sessions/:session_id/decisions',
  rbac('CDSSession', 'update'),
  auditLog('update'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;
      const { recommendation_id, decision, override_justification } = req.body;

      let session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate decision
      if (!['accept', 'override', 'request_alternative', 'reject'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision' });
      }

      // Override requires justification
      if (decision === 'override' && !override_justification) {
        return res.status(400).json({ error: 'Override requires justification' });
      }

      // Find recommendation and update it
      const recommendationIndex = session.recommendations.findIndex(
        (r) => r.recommendation_id === recommendation_id
      );
      if (recommendationIndex === -1) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }

      session.recommendations[recommendationIndex].clinician_decision =
        decision as any;
      session.recommendations[recommendationIndex].clinician_rationale =
        override_justification;

      // Record decision
      session.clinician_decisions.push({
        recommendation_id,
        decision: decision as any,
        rationale: override_justification,
        timestamp: new Date().toISOString(),
        clinician_id: req.user!.user_id,
      });

      // Update session
      cdsSessionStore.set(session_id, session);

      res.json({
        session_id,
        recommendation_id,
        decision,
        recorded_at: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record clinician decision' });
    }
  }
);

/**
 * GET /v1/cds/sessions/:session_id/careplan
 * Get draft care plan from CDS session
 */
router.get(
  '/v1/cds/sessions/:session_id/careplan',
  rbac('CDSSession', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { session_id } = req.params;

      const session = cdsSessionStore.get(session_id);
      if (!session) {
        return res.status(404).json({ error: 'CDS session not found' });
      }

      // Tenant isolation
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!session.draft_careplan) {
        return res.status(404).json({ error: 'Care plan not yet drafted' });
      }

      res.json(session.draft_careplan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve care plan' });
    }
  }
);

export default router;
