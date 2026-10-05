# Clinical SaaS Platform

A clinician-governed, multi-modal healthcare decision-support platform for allopathic medicine, Ayurveda, and homeopathy.

## Core Principles

- **Safety First**: Deterministic triage rules execute before any generative AI. Emergencies bypass all other logic.
- **Clinician Authority**: Only credentialed clinicians sign treatment plans. AI provides education and next steps only.
- **Transparent Governance**: All clinical decisions are traceable, versioned, and auditable.
- **Commercial Firewall**: Supplier marketplace is completely separated from clinical workflow.
- **Patient Privacy**: FHIR-based architecture, encrypted at rest, tenant-isolated, immutable audit trails.

## Project Structure

```
clinical-saas/
├── apps/                      # User-facing applications
│   ├── patient-web/          # Patient intake & PWA
│   ├── clinician-web/        # Clinician dashboard & signing
│   ├── admin-web/            # Tenant & governance admin
│   ├── api/                  # REST API & GraphQL gateway
│   ├── voice-gateway/        # Phone/WebRTC intake
│   └── worker/               # Background jobs
├── services/                  # Business logic microservices
│   ├── triage-rules/         # Deterministic red-flag engine
│   ├── medication-safety/    # Licensed drug data & interactions
│   ├── ai-orchestrator/      # LangGraph clinical CDS
│   ├── rag-service/          # Knowledge retrieval & citations
│   ├── audit/                # Immutable event store
│   └── commerce/             # Supplier & fulfillment
├── packages/                  # Shared libraries
│   ├── domain/               # FHIR types & core models
│   ├── policy/               # Authorization & governance
│   ├── ui/                   # Design system components
│   ├── config/               # Prompt & rule contracts
│   └── evals/                # Test corpus & benchmarks
├── infra/                     # Infrastructure as Code
│   ├── terraform/            # Cloud resources
│   ├── kubernetes/           # K8s manifests
│   └── github/               # CI/CD workflows
└── docs/                      # Architecture & operations
    ├── adr/                  # Architecture decision records
    ├── api/                  # OpenAPI specs
    └── runbooks/             # Incident & operational guides
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
pnpm install
pnpm run build
```

### Development

```bash
pnpm run dev
```

### Testing

```bash
pnpm run test
```

## Safety & Governance

See [docs/adr/](docs/adr/) for architecture decisions on:
- Jurisdiction & legal framework
- Clinical governance board roles
- Practitioner credential verification
- Licensed medicine sources
- Triage rule versioning & approval
- Audit event contracts

## Architecture Patterns

- **LangGraph**: Durable, typed workflows with explicit state management and human interrupts
- **Multi-agent RAG**: Specialist agents (intake, triage, evidence, safety, drafting, quality) with policy enforcement
- **API-first**: FHIR R4 compliant, OpenAPI contracts, zero trust, audit-logged mutations
- **Observability**: Redacted telemetry, incident playbooks, monthly drill compliance

## Contributing

All code changes require:
1. Type safety (no `any`)
2. Audit event logging
3. RBAC enforcement
4. Citation tracing (for clinical content)
5. Clinical reviewer sign-off (for triage/medicine/prompts)

## License

Proprietary - Medical use only with appropriate clinical governance approval.
