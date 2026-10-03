# Task 3-a: Create Comprehensive Seed Data Route

**Agent:** seed-data-agent
**Date:** 2026-10-03

## Work Summary

Rewrote `src/app/api/seed/route.ts` with comprehensive seed data:

- **124 Health Issues** across 14 body systems with ICD-10 codes, severity, chronicity, prevalence
- **80 Allopathy Medicines** with generic names, schedule types (OTC/SCHEDULE_H/SCHEDULE_H1/SCHEDULE_X/NARCOTIC), forms, strengths, manufacturers
- **53 Ayurveda Medicines** (single herbs + classical formulations + bhasma)
- **43 Homeopathy Medicines** (polychrests, constitutional, miasmatic)
- **6 CDSCO Medicine Recalls** (NDMA contamination, microbial limits, dissolution failure, etc.)
- **Hindi aliases** for 20+ key conditions
- **Trilingual translations** (Hindi, Tamil, Bengali) for all health issues
- **Wing approaches** (Allopathy/Ayurveda/Homeopathy) for all issues with specific overrides for key conditions

## Key Decisions
- Used inline Prisma nested creates for aliases, translations, wingApproaches (efficient single-write pattern)
- Body-system-level fallback wing approaches with per-condition overrides for 5 key conditions
- Schedule types stored in Medicine.subCategory field (schema doesn't have dedicated scheduleType field)
- Idempotency: skips seeding if >100 health issues already exist
- Cross-linked medicines to health issues via MedicineIndication for key drugs

## Lint Status
✅ Clean - no lint errors
