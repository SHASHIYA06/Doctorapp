# Task 3-c: Appointments Section Component

**Agent:** appointments-agent
**Date:** 2026-10-04

## Deliverable
Created `/home/z/my-project/src/components/sections/appointments-section.tsx`

## Key Implementation Details
- Stats cards (Today/Upcoming/Completed/Cancelled)
- Grid-based calendar with Day/Week toggle
- Month navigation with today button
- Day detail panel showing appointments for selected date
- Week view with 7-column layout
- Upcoming sidebar (next 10)
- List view with table and filters (today/week/all)
- New Appointment dialog with patient, practitioner, type, modality tabs (NEVER merged), date, time slots, duration, urgent flag
- Detail dialog with status-dependent actions
- Cancel dialog with required reason
- Quick actions: Start Consultation → clinical-notes, Send Reminder
- Status color coding: SCHEDULED=blue, CONFIRMED=green, IN_PROGRESS=teal, COMPLETED=gray, CANCELLED=red, NO_SHOW=amber
- Urgent flag with red highlight, telemedicine with Video icon
- Fetches from /api/appointments, /api/patients

## Dependencies Used
- useAppStore from @/lib/store
- ModalityBadge from @/components/clinical/modality-badge
- shadcn/ui: Card, Table, Button, Badge, Dialog, Select, Input, Tabs, Skeleton, ScrollArea, Separator, Textarea, Label
- lucide-react: Calendar, Clock, Users, CheckCircle2, XCircle, AlertTriangle, Video, Plus, etc.
- framer-motion for animations
- toast from @/hooks/use-toast
