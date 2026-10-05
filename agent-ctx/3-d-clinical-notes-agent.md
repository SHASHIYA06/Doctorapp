# Task 3-d: Clinical Notes Section Component

**Agent:** clinical-notes-agent
**Date:** 2026-10-04

## Deliverable
Created `/home/z/my-project/src/components/sections/clinical-notes-section.tsx`

## Key Implementation Details
- New Note form with patient selector, type (SOAP/PROGRESS/DISCHARGE/REFERRAL/PROCEDURE), modality tabs (NEVER merged), practitioner attribution
- SOAP fields with color-coded left borders: S=blue, O=green, A=amber, P=teal
- Each SOAP field has icon (User/Activity/Stethoscope/Heart), placeholder text, and proper label
- Vital Signs Quick-Add: BP, HR, Temp, SpO2, RR, Weight with units and placeholders
- Vitals displayed as badges in Objective section
- Diagnosis suggestions panel in Assessment field with 10 common diagnoses
- AI Summary button calls /api/ai-draft, appends to Plan with [AI Summary] prefix; local fallback
- Sign & Lock dialog with practitioner attribution and timestamp
- Notes list: search, filter by type, animated cards with signed/draft status
- Detail panel: sticky right column with full SOAP rendering, vitals, AI summary, timestamps, Sign action
- Fetches from /api/clinical-notes, /api/patients

## Dependencies Used
- useAppStore from @/lib/store
- ModalityBadge from @/components/clinical/modality-badge
- shadcn/ui: Card, Button, Badge, Dialog, Select, Input, Textarea, Tabs, Skeleton, ScrollArea, Separator, Label
- lucide-react: FileText, PenLine, Lock, Unlock, Brain, Heart, Activity, Stethoscope, Plus, etc.
- framer-motion for animations
- toast from @/hooks/use-toast
