# CDS Engine (@clinical-saas/cds-engine)

Clinical Decision Support engine powered by LangGraph and Claude AI for multi-modal healthcare.

## Overview

The CDS Engine provides agentic clinical decision support with:

- **Deterministic Safety**: Works post-triage, respects deterministic emergency detection
- **Multi-Modal Support**: Allopathy, Ayurveda, Homeopathy with modality-enforced boundaries
- **Evidence-Based**: Integrates with licensed monograph database (RAG service)
- **Audit Trail**: Every recommendation linked to Claude reasoning chain and clinician decisions
- **Clinician Override**: Physicians can override with explicit rationale (logged for compliance)
- **Safety Guardrails**: Confidence scoring, drug interaction checking, specialist referral logic

## Architecture

### State Machine Phases

```
initialized
  ↓
evidence_gathering (Ask targeted questions)
  ↓
analysis (Generate differential diagnosis)
  ↓
recommendation (Provide evidence-based medicines)
  ↓
review (Clinician accepts/overrides)
  ↓
draft_plan (Generate SignedCarePlan for signing)
  ↓
complete (CDS session logged to audit trail)
```

### Key Files

- **types.ts** - TypeScript interfaces for CDS state, messages, evidence, recommendations
- **claude-integration.ts** - Claude API client with system prompt, safety enforcer
- **graph.ts** - LangGraph state machine implementation with node functions
- **index.ts** - Public API exports

## Usage

### Initialize CDS Session

```typescript
import { createCDSSession, CDSGraph } from '@clinical-saas/cds-engine';

const sessionInput = {
  tenant_id: 'tenant-123',
  patient_id: 'patient-456',
  clinician_id: 'clinician-789',
  encounter_id: 'encounter-012',
  modality: 'allopathy',
  triage_result: triageAssessmentFromTriage,
  patient_history: {
    chief_complaint: 'Fever and cough for 3 days',
    history_of_present_illness: '...',
    // ... more history
  },
};

const session = await createCDSSession(sessionInput);
```

### Execute CDS Workflow

```typescript
const config = {
  claude_api_key: process.env.ANTHROPIC_API_KEY,
  claude_model: 'claude-3-sonnet-20240229',
  max_tokens: 2048,
  temperature: 0.3, // Lower for medical use
  enable_monograph_lookup: true,
  enable_interaction_checking: true,
  confidence_threshold_low: 0.6,
  confidence_threshold_high: 0.85,
  max_recommendations: 5,
  emergency_override_allowed: true,
  emergency_require_rationale: true,
  audit_store_enabled: true,
};

const graph = new CDSGraph(config);

// Phase 1: Initialize
let state = await graph.initializeSession(session);

// Phase 2: Gather Evidence
state = await graph.gatherEvidence(state);
// Clinician provides evidence via API...

// Phase 3: Analyze
state = await graph.analyzeEvidence(state);

// Phase 4: Generate Recommendations
state = await graph.generateRecommendations(state);

// Phase 5: Safety Check
state = await graph.performSafetyCheck(state);

// Phase 6: Clinician Review (clinician makes decisions via API...)

// Phase 7: Draft Care Plan
state = await graph.draftCarePlan(state);

// Phase 8: Complete
state = await graph.completeCDSSession(state);
```

## Safety Guardrails

### 1. Modality Enforcement
- Allopathy: Modern pharmacology, RCT-based
- Ayurveda: Herbal formulations, classical texts
- Homeopathy: Potency/dilution rules

No cross-modality recommendations allowed.

### 2. Confidence Thresholds
- High: ≥0.85 (recommend directly)
- Medium: 0.6-0.84 (recommend with caution)
- Low: <0.6 (suggest specialist consultation)

### 3. Drug Interaction Checking
- Severe/contraindicated: Require clinician override + rationale
- Moderate: Warn but allow
- Minor: Document but proceed

### 4. Emergency Context
- If triage_level='emergency': CDS cannot contradict triage decision
- Recommendations support specialist evaluation, not delay response
- Override requires explicit clinician rationale

### 5. Audit Linkage
Every recommendation includes:
- Claude reasoning chain (why this medicine)
- Monograph sources (with versions)
- Clinician decision (accept/override) with timestamp
- Correlation ID for compliance tracing

## Configuration

Set environment variables:

```bash
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-sonnet-20240229
CDS_MAX_TOKENS=2048
CDS_TEMPERATURE=0.3
CDS_ENABLE_MONOGRAPH_LOOKUP=true
CDS_ENABLE_INTERACTION_CHECKING=true
```

## Integration Points

### Input
- TriageAssessment (from triage service)
- Patient history (from patient intake)
- Current medications (from patient record)
- Modality context (allopathy/ayurveda/homeopathy)

### Output
- Recommendations array (with confidence, sources, contraindications)
- CareplanDraft (ready for clinician signing with MFA)
- Audit events (logged to immutable store)

### Dependencies
- `@clinical-saas/domain` - FHIR types
- `@clinical-saas/audit-service` - Audit logging
- `@langchain/anthropic` - Claude API client
- `@langchain/langgraph` - State machine framework

## Testing

```bash
npm run test
```

## Type Checking

```bash
npm run type-check
```

## Building

```bash
npm run build
```

## Contributing

Follow the clinical safety guidelines:
1. All changes require medical review
2. Test with real clinical scenarios
3. Audit trail must be complete
4. Override rationales must be explicit
5. No shortcuts on safety checks

## License

Licensed under clinical compliance guidelines. See LICENSE.
