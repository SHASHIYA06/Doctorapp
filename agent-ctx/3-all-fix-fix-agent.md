# Agent Context: 3-all-fix

## Task: Audit and Fix All 14 Section Components

### Summary
Fixed all 14 section components to properly integrate with backend API routes. Key categories of fixes:

1. **Missing API Routes Created** (3 new routes):
   - `/api/patient-timeline` — Timeline events from PatientTimelineEvent model
   - `/api/appointments/[id]` — PATCH/DELETE for appointment updates
   - `/api/clinical-notes/[id]` — GET/PUT/DELETE for note operations including signing

2. **API Method Mismatch Fixed** (1 route):
   - `/api/cds` — Added PUT handler (component used PUT, API only had GET/POST)

3. **Data Mapping Fixed** (8 components):
   - All components now properly map Prisma API response fields to component types
   - Handles both `json.data` and `json.<plural>` response shapes
   - Uses `Array.isArray()` checks before setting state

4. **Error Handling Fixed** (8 components):
   - Replaced all `.catch(() => {})` with proper toast error notifications
   - Added toast errors on API failure for inventory and discharge-summary

5. **Loading State Fixed** (1 component):
   - notifications-section: Spinner → Skeleton component

### Lint Status: PASS (0 errors)
### Dev Server: Running, APIs responding 200
