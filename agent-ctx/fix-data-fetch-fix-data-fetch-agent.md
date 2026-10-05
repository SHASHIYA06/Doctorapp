# Task fix-data-fetch - Fix Data Fetch Agent

## Summary
Fixed 22 data fetching mismatches across all 10 section components where frontend code was reading from incorrect property names that didn't match the actual API response format.

## Root Cause
All API routes return data wrapped in `{ data: ... }` format, but the frontend components were using resource-specific property names like `json.patients`, `json.alerts`, `json.consents`, `A.patient`, etc.

## Fix Strategy
Used the `json.data ?? json.oldName ?? fallback` pattern for every fix, ensuring backward compatibility if the API format ever changes again.

## Files Modified (10)
- dashboard-section.tsx (5 fixes)
- patients-section.tsx (1 fix)
- consent-section.tsx (2 fixes)
- intake-section.tsx (1 fix)
- safety-section.tsx (4 fixes)
- clinician-queue-section.tsx (1 fix)
- care-plans-section.tsx (4 fixes)
- knowledge-section.tsx (1 fix)
- audit-section.tsx (1 fix)
- admin-section.tsx (1 fix)

## Verification
- ESLint passes with zero errors
- No component rewrites, only targeted minimal fixes
