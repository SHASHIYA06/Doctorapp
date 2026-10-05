# ADR-0001: Jurisdiction, Clinical Governance, and Regulatory Framework

**Status:** Accepted (Foundation Phase 0)  
**Decision Date:** 2026-09-29  
**Owner:** Medical Director, Legal Counsel, DPO  

## Context

This platform is a clinical decision-support system serving patients in multiple medical modalities (allopathic, Ayurveda, homeopathy). Before any patient engagement or knowledge base deployment, we must establish:

1. **Geographic & regulatory jurisdiction** — which laws apply?
2. **Clinical governance bodies** — who approves clinical content, triage rules, and AI prompts?
3. **Data protection & consent** — what legal basis and consent forms are required?
4. **Practitioner credential verification** — how do we verify each clinician's qualifications and scope?
5. **Interoperability standards** — do we map to FHIR, ABDM (India), or other frameworks?

## Decision

### 1. Initial Market: India (Assumption)

**Jurisdiction:** India (expandable post-MVP)  
**Regulatory Regime:**
- Digital Personal Data Protection Act, 2023 (DPDP) – data protection baseline
- Drugs & Cosmetics Act, 1940 – medicine/pharmacy regulation
- Telemedicine Practice Guidelines, 2020 – remote consultation rules
- Medical Council of India regulations – practitioner scope
- Professional regulations for Ayurveda (CCM) and Homeopathy (CHB)

**Pre-launch gates:**
- [ ] Written opinion from Indian legal counsel on DPDP compliance
- [ ] Written opinion on telemedicine scope and practice limitations
- [ ] Confirmation of pharmacy/e-pharmacy fulfilment requirements
- [ ] Confirmation of practitioner credential standards per modality

### 2. Clinical Governance Structure

**Mandatory bodies before go-live:**

| Role | Responsibility | Composition |
|------|-----------------|-------------|
| **Clinical Governance Board** | Approve triage rules, medicine content, red-flag policies | 1 allopathic MD, 1 Ayurvedic clinician, 1 homeopathic clinician, 1 independent safety officer, 1 nurse/triage lead |
| **Medical Director** | Ultimate accountability for patient safety; signs off all clinical releases | Licensed physician (allopathy) with 5+ years clinical experience |
| **Data Protection Officer (DPO)** | DPDP compliance, data protection impact assessments, consent, breach response | Legal or privacy professional trained in healthcare data law |
| **AI Safety Review Board** | Reviews model changes, red-team findings, incidents, vendor approvals | AI Lead, Clinical Safety Officer, Security Lead, CTO |
| **Content Review Council** | Source licensing, medicine monograph curation, evidence labeling, recertification | Modality leads, pharmacist, quality reviewer |

**Meeting cadence:**
- Clinical Governance Board: monthly (or weekly pre-launch)
- AI Safety Review Board: monthly + incident-driven
- Content Review Council: bi-weekly (during knowledge ingestion)

### 3. Practitioner Credential Verification

**Allopathic Physicians:**
- Registered with Indian Medical Association (IMA) or state medical council
- Valid medical license, not suspended/revoked
- Scope: diagnosis, treatment, prescription within their specialization
- Credential expiry: annual re-verification

**Ayurvedic Clinicians:**
- Registered with Central Council of Indian Medicine (CCIM)
- Recognized Bachelor of Ayurvedic Medicine & Surgery (BAMS) or higher
- Scope: Ayurvedic diagnosis and treatment only
- Cross-modality prescription (e.g., allopathic medicines) not permitted without legal clarity

**Homeopathic Clinicians:**
- Registered with Central Council of Homeopathy (CCH)
- Recognized Bachelor of Homeopathic Medicine & Surgery (BHMS) or higher
- Scope: homeopathic remedies and potencies only
- Scope limited to conditions compatible with homeopathic education

**Verification process:**
1. Practitioner submits registration certificate + identity proof
2. Auto-check against public registrar (IMA, CCIM, CCH online databases)
3. Manual review by Clinical Governance Board
4. Credential stored with expiry date and scope tags
5. Monthly automated check for license revocation/suspension

**Scope enforcement in code:**
```ts
// Example: Clinician can only sign plans in their scope
can_sign_plan(clinician, modality, condition) {
  if (clinician.expired) return false;
  if (!clinician.scopes.includes(modality)) return false;
  if (condition.requires_multi_modality && !clinician.cleared_for_cross_modal) return false;
  return true;
}
```

### 4. Data Protection & Consent (DPDP Act)

**Lawful Basis:** Patient consent + clinical necessity  
**Consent Form:** Versioned, plain-language, clinician-specific, re-consentable

**Minimum required disclosures:**
- Purpose (clinical decision support + outcome follow-up)
- Data collected (demographics, medical history, symptoms, medicines, allergies)
- Retention period (per applicable law + policy)
- Processing for AI training (explicit opt-in; default NO training on personal data)
- Access controls (only treating clinician + clinic admin + safety review)
- Patient rights (access, correction, deletion, export, complaints)
- Grievance contact

**Consent versioning:** Each consent form has version date, change log, and patient signature timestamp. No retroactive changes.

**Data deletion & export:**
- Patients may request export in FHIR format (HL7 standard)
- Patients may request deletion; audit trail is retained but PHI is scrubbed

### 5. FHIR & ABDM Interoperability

**FHIR R4 mapping (mandatory for future integration):**
- Patient → FHIR:Patient
- Consent → FHIR:Consent (versioned, include decision log)
- Medical history → FHIR:Condition + MedicationStatement + AllergyIntolerance
- Symptoms → FHIR:Observation
- Triage → FHIR:RiskAssessment
- Care plan → FHIR:CarePlan (signed, modality-tagged)
- Audit events → FHIR:AuditEvent

**ABDM (India's Ayushman Bharat Digital Mission):**
- Not required for MVP but design for future compliance
- Patient can link health record; no automatic push until explicit consent
- Use ABDM APIs only after patient grants access token

---

## Implications

1. **No MVP launch without Medical Director + DPO sign-off.**
2. **Triage rules cannot be deployed without Clinical Governance Board approval.**
3. **Medicine monographs must cite source and be reviewed by relevant modality lead.**
4. **All clinical AI prompts must be versioned and approved before release.**
5. **Every patient record must have a signed, dated consent in the audit trail.**
6. **Data residency and breach response SLAs are DPO responsibility.**

---

## ADR Links

- ADR-0002: Licensed Medicine Sources & Knowledge Ingestion
- ADR-0003: Triage Rule Versioning & Red-Flag Engine
- ADR-0004: LangGraph Clinician CDS Workflow
- ADR-0005: Audit Event Schema & Immutable Logging
- ADR-0006: Commercial Firewall & Supplier Marketplace
