/**
 * OpenAPI 3.0 specification for Clinical SaaS REST API
 * FHIR R4 compliant endpoints with audit trails
 */

export const OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'Clinical SaaS API',
    version: '0.1.0',
    description: 'Clinician-governed multi-modal healthcare decision-support API',
    contact: {
      name: 'Clinical Safety Board',
      email: 'safety@clinical-saas.local',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/v1',
      description: 'Development',
    },
    {
      url: 'https://api.clinical-saas.io/v1',
      description: 'Production',
    },
  ],
  paths: {
    '/patients': {
      post: {
        summary: 'Register a new patient',
        operationId: 'registerPatient',
        tags: ['Patient'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['first_name', 'last_name', 'date_of_birth', 'contact_phone'],
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  date_of_birth: { type: 'string', format: 'date' },
                  gender: {
                    type: 'string',
                    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                  },
                  contact_phone: { type: 'string' },
                  contact_email: { type: 'string', format: 'email' },
                  preferred_language: {
                    type: 'string',
                    enum: ['en', 'hi', 'kn', 'ta', 'te', 'ml'],
                    default: 'en',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Patient created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    patient_id: { type: 'string', format: 'uuid' },
                    audit_event_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
      get: {
        summary: 'Get patient profile (self or clinician)',
        operationId: 'getPatient',
        tags: ['Patient'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'patient_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            required: true,
          },
        ],
        responses: {
          200: {
            description: 'Patient profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' },
              },
            },
          },
          403: { description: 'Forbidden' },
          404: { description: 'Patient not found' },
        },
      },
    },
    '/consents': {
      post: {
        summary: 'Create and sign patient consent',
        operationId: 'signConsent',
        tags: ['Consent'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patient_id', 'version'],
                properties: {
                  patient_id: { type: 'string', format: 'uuid' },
                  version: { type: 'integer' },
                  ai_training_consent: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Consent signed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    consent_id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['accepted', 'draft'] },
                    audit_event_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/encounters': {
      post: {
        summary: 'Start a new clinical encounter',
        operationId: 'startEncounter',
        tags: ['Encounter'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patient_id', 'type', 'modality'],
                properties: {
                  patient_id: { type: 'string', format: 'uuid' },
                  type: { type: 'string', enum: ['intake', 'follow_up', 'telehealth', 'voice_intake'] },
                  modality: {
                    type: 'string',
                    enum: ['allopathy', 'ayurveda', 'homeopathy'],
                  },
                  chief_complaint: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Encounter started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    encounter_id: { type: 'string', format: 'uuid' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/triage/assess': {
      post: {
        summary: 'Perform deterministic triage assessment',
        operationId: 'triageAssess',
        tags: ['Triage'],
        security: [{ bearerAuth: [] }],
        description:
          'Deterministic rule-based triage. Rules execute FIRST, before any clinical AI. No LLM inference.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patient_id', 'encounter_id', 'symptoms'],
                properties: {
                  patient_id: { type: 'string', format: 'uuid' },
                  encounter_id: { type: 'string', format: 'uuid' },
                  symptoms: { type: 'array', items: { type: 'string' } },
                  allergies: { type: 'array', items: { type: 'string' } },
                  active_medications: { type: 'array', items: { type: 'string' } },
                  flags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Triage assessment',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    triage_id: { type: 'string', format: 'uuid' },
                    triage_level: {
                      type: 'string',
                      enum: ['emergency', 'urgent', 'routine', 'no_red_flag'],
                    },
                    patient_safe_message: { type: 'string' },
                    emergency_escalation_script: { type: 'string' },
                    local_emergency_contact: { type: 'string' },
                    triggered_rules: { type: 'array', items: { type: 'string' } },
                    rule_version_id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/care-plans/{plan_id}/sign': {
      post: {
        summary: 'Sign a care plan (clinician only, MFA required)',
        operationId: 'signCarePlan',
        tags: ['CarePlan'],
        security: [{ bearerAuth: [] }, { mfaToken: [] }],
        parameters: [
          {
            name: 'plan_id',
            in: 'path',
            schema: { type: 'string', format: 'uuid' },
            required: true,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clinician_id'],
                properties: {
                  clinician_id: { type: 'string', format: 'uuid' },
                  override_safety_alerts: { type: 'boolean', default: false },
                  override_rationale: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Care plan signed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plan_id: { type: 'string', format: 'uuid' },
                    signed_at: { type: 'string', format: 'date-time' },
                    audit_event_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/audit/export': {
      post: {
        summary: 'Export audit trail (compliance)',
        operationId: 'exportAuditTrail',
        tags: ['Audit'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resource_type', 'resource_id'],
                properties: {
                  resource_type: { type: 'string' },
                  resource_id: { type: 'string', format: 'uuid' },
                  start_date: { type: 'string', format: 'date-time' },
                  end_date: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Audit trail exported',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    events: { type: 'array' },
                    export_date: { type: 'string', format: 'date-time' },
                    signed_by: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Patient: {
        type: 'object',
        properties: {
          patient_id: { type: 'string', format: 'uuid' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          contact_phone: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'OIDC JWT token. MFA claim must be true for sensitive operations.',
      },
      mfaToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-MFA-Token',
        description: 'One-time MFA verification token',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
