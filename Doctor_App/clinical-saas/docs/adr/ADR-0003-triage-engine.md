# ADR-0003: Deterministic Triage Rule Engine & Red-Flag First Architecture

**Status:** Accepted  
**Decision Date:** 2026-09-29  
**Owner:** Safety Officer, Medical Director

## Context

Triage is the single most critical safety layer. If an emergency is missed, the platform has failed—no amount of later clinical review can undo harm. Therefore:

1. **Rules must be deterministic, not LLM-inferred.**
2. **Rules execute FIRST, before any generative AI.**
3. **Rules are versioned and board-approved.**
4. **Missed emergency = release blocker.**

## Decision

### 1. Triage Result Levels

```ts
type TriageLevel = 'emergency' | 'urgent' | 'routine' | 'no_red_flag';

interface TriageAssessment {
  assessment_id: string;
  patient_id: string;
  timestamp: string;
  input_symptoms: string[];
  input_allergies: string[];
  input_medications: string[];
  input_conditions: string[];
  input_flags: string[]; // e.g., 'pregnancy', 'fever_>39', 'chest_pain'

  triage_level: TriageLevel;
  triggered_rules: string[]; // Which rule IDs triggered
  rule_version_id: string; // Immutable version of rules used

  clinician_path: 'immediate_emergency' | 'urgent_callback' | 'routine_intake';
  patient_safe_message: string; // Plain-language next step
  emergency_escalation_script?: string; // If emergency, exact text to show/play
  local_emergency_contact?: string; // e.g., 108 (India ambulance)

  audit_event_id: string; // Link to audit trail
}
```

### 2. Red-Flag Rule Categories

**Critical Emergency (immediate 999/911/108 escalation):**
- Chest pain or pressure (any age)
- Difficulty breathing / respiratory distress
- Severe headache + stiff neck (meningitis suspect)
- Confusion / severe altered mental status
- Loss of consciousness
- Severe bleeding / trauma
- Poisoning / overdose disclosure
- Active suicidal ideation
- Severe allergic reaction / anaphylaxis

**Urgent (clinician callback within 2 hours):**
- High fever (>39°C) + severe symptoms
- Severe abdominal pain
- Signs of stroke (facial droop, arm weakness, speech)
- Suspected fracture / severe injury
- Severe dehydration
- Pregnancy complication (bleeding, severe pain, preeclampsia signs)
- Pediatric fever + abnormal behavior (deferred: pediatric exclusion MVP)
- Medication overdose (non-life-threatening)

**Routine (scheduled intake within 24 hours):**
- Mild-to-moderate symptoms
- Stable chronic disease
- Preventive inquiry
- Medicine refill request

**No red flag (can proceed with intake):**
- No symptoms disclosed
- Routine follow-up

### 3. Rule Format & Versioning

```ts
interface TriageRule {
  rule_id: string; // e.g., 'emergency_chest_pain_001'
  version: number; // 1, 2, 3, ...
  rule_group: 'critical_emergency' | 'urgent' | 'routine';
  
  // Matching logic
  trigger_keywords: string[]; // e.g., 'chest pain', 'shortness of breath'
  trigger_if_any: string[]; // Patient discloses ANY of these
  trigger_if_all?: string[]; // Patient discloses ALL of these (AND logic)
  exclude_if?: string[]; // Do not trigger if patient says this
  
  // Age & context filters
  min_age?: number;
  max_age?: number;
  contexts?: string[]; // e.g., 'pregnancy', 'severe_immunocompromise'
  
  // Response
  triage_level: TriageLevel;
  patient_message: string; // Calm, action-first, plain language
  emergency_script: string; // Exact wording for emergency (clinician approved)
  contact_emergency_number: boolean; // e.g., true for 108 (India)
  escalation_sla_minutes: number; // Callback SLA for urgent
  
  // Governance
  created_by: string; // Clinician ID
  created_date: string;
  approved_by: string; // Safety Officer ID
  approved_date: string;
  effective_date: string;
  deprecation_date?: string;
  
  // Audit
  test_cases_passed: number;
  test_cases_total: number;
  last_reviewed_date: string;
  next_review_due: string;
  change_log: ChangeEvent[];
}

interface TriageRuleSet {
  version_id: string; // e.g., 'rules_v2.3.1_prod'
  modality: 'all_modalities' | 'allopathy' | 'ayurveda' | 'homeopathy';
  effective_date: string;
  rules: TriageRule[];
  
  // Execution metadata
  total_rules: number;
  tested_on: { test_corpus: string; sensitivity: number; specificity: number }[];
  signed_by: string; // Medical Director
  signed_date: string;
}
```

### 4. Execution Flow

```
START
  ↓
[Patient discloses symptoms/flags]
  ↓
[Load triage rule set version_id from config]
  ↓
[For each rule in rule set, in priority order:]
  ├─ Match trigger_keywords / trigger_if_any / trigger_if_all
  ├─ Check exclusions (trigger_if_not)
  ├─ Apply age/context filters
  ├─ If matches: record triggered_rule_id, set triage_level
  ├─ Stop evaluation (first match wins)
  ↓
[Log triage assessment with rule version ID]
  ↓
[If EMERGENCY: show emergency script + contact info, END]
[If URGENT: create callback queue, END]
[If ROUTINE / NO_RED_FLAG: proceed to intake, END]
```

### 5. Testing & Approval Gate

Before any rule set goes to production:

**Test Corpus (100% pass mandatory):**
```
Test Case ID | Symptoms | Expected Triage | Actual | Pass?
─────────────┼──────────┼─────────────────┼────────┼──────
TC-001       | Chest pain + shortness of breath | EMERGENCY | EMERGENCY | ✓
TC-002       | Mild cough | NO_RED_FLAG | NO_RED_FLAG | ✓
TC-003       | Fever 38.5°C + stable vitals | ROUTINE | ROUTINE | ✓
...          | ...      | ...             | ...    | ...
```

**Sensitivity & Specificity:**
- Sensitivity (recall for emergency): **≥98%** (catch all true emergencies)
- Specificity: **≥85%** (avoid over-escalation)

**Sign-off:**
- [ ] Medical Director: approves rules
- [ ] Safety Officer: certifies test corpus
- [ ] Clinical Governance Board: reviews for modality appropriateness

**Release blocker:** Any emergency rule with <98% sensitivity = do not deploy.

### 6. Version Control & Rollback

```bash
# Rule versions stored in Git + database

rules/
├── v1.0.0/
│   ├── emergency_rules.json
│   ├── urgent_rules.json
│   └── TEST_CORPUS_RESULTS.md
├── v1.1.0/
│   ├── emergency_rules.json  # Added chest pain +fever check
│   ├── urgent_rules.json
│   └── TEST_CORPUS_RESULTS.md
└── v2.0.0/
    ├── emergency_rules.json  # Deprecated old meningitis rule
    ├── urgent_rules.json
    └── TEST_CORPUS_RESULTS.md
```

If a rule is discovered to be harmful (e.g., false negatives):
1. Immediately revert to prior version in production
2. Log rollback reason + affected patient cohort
3. Medical Director + Safety Officer post-mortem
4. Board review before re-deploying

---

## Implications

1. **Triage rule changes require Medical Director + Safety Officer approval.**
2. **Every triage decision is logged with rule version ID for audit.**
3. **Emergency path bypasses all other logic.**
4. **No LLM-generated triage; rules are deterministic.**
5. **Test corpus is public for transparency; results signed by Medical Director.**

---

## Related ADRs
- ADR-0001: Jurisdiction & Governance
- ADR-0004: LangGraph CDS Workflow (clinician triage override)
