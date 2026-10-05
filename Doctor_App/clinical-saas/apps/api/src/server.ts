/**
 * Express server setup with OpenAPI/Swagger endpoints
 * Safety-first middleware stack: auth → tenant isolation → RBAC → audit
 */

import express, { Express, Request, Response } from 'express';
import 'express-async-errors';
import { v4 as uuidv4 } from 'uuid';
import { TriageEngine, loadApprovedTriageRuleSet } from 'triage-rules';
import { auditStore, createAuditPatterns } from 'audit-service';
import {
  authenticate,
  enforceTenantIsolation,
  rbac,
  requireMFA,
  auditLog,
  AuthenticatedRequest,
} from './rbac';
import { OPENAPI_SPEC } from '../docs/api/openapi';
import cdsRoutes from './cds-routes';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware stack (in order)
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// ============================================================================
// HEALTH & OBSERVABILITY
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

app.get('/openapi.json', (req, res) => {
  res.json(OPENAPI_SPEC);
});

// ============================================================================
// PROTECTED ROUTES (all require auth + tenant isolation)
// ============================================================================

app.use('/v1', authenticate, enforceTenantIsolation);

// CDS Routes
app.use('/', cdsRoutes);

// ============================================================================
// PATIENT ROUTES
// ============================================================================

app.post(
  '/v1/patients',
  rbac('Patient', 'create'),
  auditLog('create'),
  async (req: AuthenticatedRequest, res) => {
    const { first_name, last_name, date_of_birth, gender, contact_phone } = req.body;

    // Validation
    if (!first_name || !last_name || !date_of_birth || !contact_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create patient
    const patientId = uuidv4();
    const auditPatterns = createAuditPatterns();

    const auditEvent = auditPatterns.recordPatientCreated(
      req.user!.tenant_id,
      patientId,
      req.user!.user_id
    );

    res.status(201).json({
      patient_id: patientId,
      audit_event_id: auditEvent.audit_id,
    });
  }
);

app.get(
  '/v1/patients/:patient_id',
  rbac('Patient', 'read'),
  async (req: AuthenticatedRequest, res) => {
    const { patient_id } = req.params;

    // TODO: Fetch from database
    res.json({
      patient_id,
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1980-01-15',
      contact_phone: '+91-9876543210',
    });
  }
);

// ============================================================================
// CONSENT ROUTES
// ============================================================================

app.post(
  '/v1/consents',
  rbac('Consent', 'create'),
  auditLog('create'),
  async (req: AuthenticatedRequest, res) => {
    const { patient_id, version, ai_training_consent } = req.body;
    const consentId = uuidv4();

    const auditPatterns = createAuditPatterns();
    const auditEvent = auditPatterns.recordConsentSigned(
      req.user!.tenant_id,
      patient_id,
      consentId,
      req.user!.user_id
    );

    res.status(201).json({
      consent_id: consentId,
      status: 'accepted',
      version,
      ai_training_consent,
      audit_event_id: auditEvent.audit_id,
    });
  }
);

// ============================================================================
// ENCOUNTER ROUTES
// ============================================================================

app.post(
  '/v1/encounters',
  rbac('Encounter', 'create'),
  auditLog('create'),
  async (req: AuthenticatedRequest, res) => {
    const { patient_id, type, modality, chief_complaint } = req.body;
    const encounterId = uuidv4();

    res.status(201).json({
      encounter_id: encounterId,
      patient_id,
      type,
      modality,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
  }
);

// ============================================================================
// TRIAGE ROUTES (DETERMINISTIC, NO LLM)
// ============================================================================

app.post(
  '/v1/triage/assess',
  rbac('TriageAssessment', 'create'),
  auditLog('execute'),
  async (req: AuthenticatedRequest, res) => {
    const {
      patient_id,
      encounter_id,
      symptoms = [],
      allergies = [],
      active_medications = [],
      conditions = [],
      flags = [],
    } = req.body;

    // Load approved triage rules
    const ruleSet = loadApprovedTriageRuleSet('v1.0.0');
    const engine = new TriageEngine(ruleSet);

    // Perform assessment (deterministic, no LLM)
    const assessment = engine.assess({
      patient_id,
      tenant_id: req.user!.tenant_id,
      encounter_id,
      symptoms,
      allergies,
      active_medications,
      conditions,
      flags,
      patient_age_years: 35,
    });

    // Record audit event
    const auditPatterns = createAuditPatterns();
    auditPatterns.recordTriageAssessed(
      req.user!.tenant_id,
      patient_id,
      assessment.triage_id,
      assessment.triage_level,
      assessment.rule_version_id
    );

    res.json(assessment);
  }
);

// ============================================================================
// CARE PLAN ROUTES
// ============================================================================

app.post(
  '/v1/care-plans/:plan_id/sign',
  rbac('CarePlan', 'sign'),
  requireMFA,
  auditLog('sign'),
  async (req: AuthenticatedRequest, res) => {
    const { plan_id } = req.params;
    const { clinician_id, override_safety_alerts, override_rationale } = req.body;

    if (override_safety_alerts && !override_rationale) {
      return res.status(400).json({
        error: 'Override rationale required when overriding safety alerts',
      });
    }

    // Record plan signing
    const auditPatterns = createAuditPatterns();
    const auditEvent = auditPatterns.recordPlanSigned(
      req.user!.tenant_id,
      '', // patient_id would be fetched from plan
      plan_id,
      clinician_id,
      '' // credential_id would be fetched
    );

    res.json({
      plan_id,
      signed_at: new Date().toISOString(),
      audit_event_id: auditEvent.audit_id,
    });
  }
);

// ============================================================================
// AUDIT ROUTES
// ============================================================================

app.post(
  '/v1/audit/export',
  rbac('AuditEvent', 'read'),
  async (req: AuthenticatedRequest, res) => {
    const { resource_type, resource_id } = req.body;

    // Query audit trail
    const events = auditStore.queryByResource(
      req.user!.tenant_id,
      resource_type,
      resource_id
    );

    res.json({
      events,
      export_date: new Date().toISOString(),
      total_events: events.length,
      signed_by: 'dpo@clinical-saas.local',
    });
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: any, req: Request, res: Response) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    request_id: req.headers['x-correlation-id'],
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(port, () => {
  console.log(`Clinical SaaS API running on port ${port}`);
  console.log(`OpenAPI docs: http://localhost:${port}/openapi.json`);
});

export default app;
