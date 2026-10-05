/**
 * Immutable audit event store
 * Append-only, never mutable, indexed for query
 * Every clinical decision is traceable to source + actor + time
 */

import { AuditEvent, AuditEventType, UserRole } from '@domain/types';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEventInput {
  event_type: AuditEventType;
  actor_id?: string;
  actor_role?: UserRole;
  resource_type: string;
  resource_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'sign' | 'execute';
  details: {
    description: string;
    ip_address?: string;
    session_id?: string;
    model_used?: string;
    model_version?: string;
    rule_version_id?: string;
    policy_decision?: string;
  };
  correlation_id?: string;
}

/**
 * Append-only audit event store
 * In production, this is backed by an immutable database (e.g., PostgreSQL with triggers)
 */
export class AuditEventStore {
  private events: AuditEvent[] = [];

  /**
   * Append a new audit event (immutable)
   * Returns the audit_id for correlation
   */
  record(tenantId: string, input: AuditEventInput): AuditEvent {
    const event: AuditEvent = {
      audit_id: uuidv4(),
      tenant_id: tenantId,
      event_type: input.event_type,
      timestamp: new Date().toISOString(),
      actor_id: input.actor_id,
      actor_role: input.actor_role,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      action: input.action,
      status: 'success',
      details: input.details,
      correlation_id: input.correlation_id || uuidv4(),
      created_at: new Date().toISOString(),
    };

    this.events.push(Object.freeze(event)); // Immutable
    return event;
  }

  /**
   * Record an error event
   */
  recordError(tenantId: string, input: AuditEventInput, error: string): AuditEvent {
    return this.record(tenantId, {
      ...input,
      details: {
        ...input.details,
        description: `${input.details.description} [ERROR]`,
      },
    });
  }

  /**
   * Query events by correlation ID (for tracing a chain of actions)
   */
  queryByCorrelationId(tenantId: string, correlationId: string): AuditEvent[] {
    return this.events.filter(
      (e) => e.tenant_id === tenantId && e.correlation_id === correlationId
    );
  }

  /**
   * Query events by resource (what happened to this patient/plan/etc?)
   */
  queryByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string
  ): AuditEvent[] {
    return this.events.filter(
      (e) =>
        e.tenant_id === tenantId &&
        e.resource_type === resourceType &&
        e.resource_id === resourceId
    );
  }

  /**
   * Query events by actor (what did this clinician do?)
   */
  queryByActor(tenantId: string, actorId: string): AuditEvent[] {
    return this.events.filter((e) => e.tenant_id === tenantId && e.actor_id === actorId);
  }

  /**
   * Query events within a time range
   */
  queryByTimeRange(tenantId: string, startTime: string, endTime: string): AuditEvent[] {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return this.events.filter((e) => {
      const eventTime = new Date(e.timestamp);
      return e.tenant_id === tenantId && eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Export audit trail for a specific resource (for compliance/review)
   */
  exportResourceTrail(
    tenantId: string,
    resourceType: string,
    resourceId: string
  ): AuditEvent[] {
    return this.queryByResource(tenantId, resourceType, resourceId);
  }

  /**
   * Compliance: verify no unauthorized mutations
   * In production, database-level write triggers enforce this
   */
  verifyImmutability(): boolean {
    for (const event of this.events) {
      if (Object.isFrozen(event) === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all events for tenant (for debugging/analysis)
   */
  getAllEvents(tenantId: string): AuditEvent[] {
    return this.events.filter((e) => e.tenant_id === tenantId);
  }
}

/**
 * Singleton audit store instance
 * In production, this is a database service
 */
export const auditStore = new AuditEventStore();

/**
 * Audit event recording patterns
 */

export interface AuditPatterns {
  recordPatientCreated(tenantId: string, patientId: string, actorId: string): AuditEvent;
  recordConsentSigned(
    tenantId: string,
    patientId: string,
    consentId: string,
    actorId: string
  ): AuditEvent;
  recordIntakeCompleted(
    tenantId: string,
    patientId: string,
    intakeId: string,
    encounterId: string
  ): AuditEvent;
  recordTriageAssessed(
    tenantId: string,
    patientId: string,
    triageId: string,
    triageLevel: string,
    ruleVersionId: string
  ): AuditEvent;
  recordPlanDrafted(
    tenantId: string,
    patientId: string,
    draftId: string,
    modelUsed: string,
    modelVersion: string
  ): AuditEvent;
  recordPlanSigned(
    tenantId: string,
    patientId: string,
    planId: string,
    clinicianId: string,
    credentialId: string
  ): AuditEvent;
  recordRetrievalExecuted(
    tenantId: string,
    patientId: string,
    query: string,
    resultCount: number,
    sources: string[]
  ): AuditEvent;
}

export function createAuditPatterns(): AuditPatterns {
  return {
    recordPatientCreated(tenantId, patientId, actorId) {
      return auditStore.record(tenantId, {
        event_type: 'patient_created',
        actor_id: actorId,
        resource_type: 'Patient',
        resource_id: patientId,
        action: 'create',
        details: {
          description: `Patient registered`,
        },
      });
    },

    recordConsentSigned(tenantId, patientId, consentId, actorId) {
      return auditStore.record(tenantId, {
        event_type: 'consent_signed',
        actor_id: actorId,
        resource_type: 'Consent',
        resource_id: consentId,
        action: 'sign',
        details: {
          description: `Patient consent signed for ${patientId}`,
        },
      });
    },

    recordIntakeCompleted(tenantId, patientId, intakeId, encounterId) {
      return auditStore.record(tenantId, {
        event_type: 'intake_completed',
        resource_type: 'IntakeResponse',
        resource_id: intakeId,
        action: 'create',
        details: {
          description: `Intake completed for encounter ${encounterId}`,
        },
      });
    },

    recordTriageAssessed(tenantId, patientId, triageId, triageLevel, ruleVersionId) {
      return auditStore.record(tenantId, {
        event_type: 'triage_assessed',
        resource_type: 'TriageAssessment',
        resource_id: triageId,
        action: 'execute',
        details: {
          description: `Triage assessment: ${triageLevel}`,
          rule_version_id: ruleVersionId,
        },
      });
    },

    recordPlanDrafted(tenantId, patientId, draftId, modelUsed, modelVersion) {
      return auditStore.record(tenantId, {
        event_type: 'plan_drafted',
        resource_type: 'ClinicalDraft',
        resource_id: draftId,
        action: 'create',
        details: {
          description: `Clinical plan drafted via AI`,
          model_used: modelUsed,
          model_version: modelVersion,
        },
      });
    },

    recordPlanSigned(tenantId, patientId, planId, clinicianId, credentialId) {
      return auditStore.record(tenantId, {
        event_type: 'plan_signed',
        actor_id: clinicianId,
        actor_role: 'clinician',
        resource_type: 'SignedCarePlan',
        resource_id: planId,
        action: 'sign',
        details: {
          description: `Care plan signed by clinician`,
        },
      });
    },

    recordRetrievalExecuted(tenantId, patientId, query, resultCount, sources) {
      return auditStore.record(tenantId, {
        event_type: 'retrieval_executed',
        resource_type: 'Patient',
        resource_id: patientId,
        action: 'execute',
        details: {
          description: `Knowledge retrieval: ${query}`,
        },
      });
    },
  };
}
