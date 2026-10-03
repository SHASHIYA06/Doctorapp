'use client'

import { create } from 'zustand'

export type Section =
  | 'dashboard'
  | 'patients'
  | 'health-issues'
  | 'medicines'
  | 'symptom-checker'
  | 'drug-interactions'
  | 'scan-verify'
  | 'pharmacy'
  | 'consent'
  | 'intake'
  | 'safety'
  | 'clinician-queue'
  | 'care-plans'
  | 'knowledge'
  | 'audit'
  | 'analytics'
  | 'voice'
  | 'recalls'
  | 'admin'
  | 'abha'
  | 'counterfeit'
  | 'expiry-tracker'
  | 'medicine-compare'
  | 'dosage-tracker'
  | 'vaccination'
  | 'prescriptions'
  | 'lab-orders'
  | 'appointments'
  | 'clinical-notes'
  | 'patient-timeline'
  | 'insurance'
  | 'billing'
  | 'inventory'
  | 'discharge-summary'
  | 'notifications'
  | 'referrals'
  | 'documents'
  | 'telemedicine'
  | 'cds'
  | 'follow-up-reminders'

export type Modality = 'ALLOPATHY' | 'AYURVEDA' | 'HOMEOPATHY'

export type Role = 'PATIENT' | 'CLINICIAN' | 'ADMIN'

export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'ur'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  ur: 'اردو',
}

interface AppState {
  activeSection: Section
  setActiveSection: (section: Section) => void
  activeModality: Modality
  setActiveModality: (modality: Modality) => void
  activeRole: Role
  setActiveRole: (role: Role) => void
  activeLanguage: Language
  setActiveLanguage: (lang: Language) => void
  selectedPatientId: string | null
  setSelectedPatientId: (id: string | null) => void
  selectedEncounterId: string | null
  setSelectedEncounterId: (id: string | null) => void
  selectedIssueId: string | null
  setSelectedIssueId: (id: string | null) => void
  selectedMedicineId: string | null
  setSelectedMedicineId: (id: string | null) => void
  selectedPharmacyId: string | null
  setSelectedPharmacyId: (id: string | null) => void
  selectedRecallId: string | null
  setSelectedRecallId: (id: string | null) => void
  selectedPrescriptionId: string | null
  setSelectedPrescriptionId: (id: string | null) => void
  selectedAppointmentId: string | null
  setSelectedAppointmentId: (id: string | null) => void
  isVoiceActive: boolean
  setIsVoiceActive: (active: boolean) => void
  scanResult: any | null
  setScanResult: (result: any | null) => void
  notificationCount: number
  setNotificationCount: (count: number) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  isAbhaLinked: boolean
  setIsAbhaLinked: (linked: boolean) => void
  unreadNotificationCount: number
  setUnreadNotificationCount: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
  activeModality: 'ALLOPATHY',
  setActiveModality: (modality) => set({ activeModality: modality }),
  activeRole: 'CLINICIAN',
  setActiveRole: (role) => set({ activeRole: role }),
  activeLanguage: 'en',
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),
  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  selectedEncounterId: null,
  setSelectedEncounterId: (id) => set({ selectedEncounterId: id }),
  selectedIssueId: null,
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
  selectedMedicineId: null,
  setSelectedMedicineId: (id) => set({ selectedMedicineId: id }),
  selectedPharmacyId: null,
  setSelectedPharmacyId: (id) => set({ selectedPharmacyId: id }),
  selectedRecallId: null,
  setSelectedRecallId: (id) => set({ selectedRecallId: id }),
  isVoiceActive: false,
  setIsVoiceActive: (active) => set({ isVoiceActive: active }),
  scanResult: null,
  setScanResult: (result) => set({ scanResult: result }),
  notificationCount: 3,
  setNotificationCount: (count) => set({ notificationCount: count }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  isAbhaLinked: false,
  setIsAbhaLinked: (linked) => set({ isAbhaLinked: linked }),
  selectedPrescriptionId: null,
  setSelectedPrescriptionId: (id) => set({ selectedPrescriptionId: id }),
  selectedAppointmentId: null,
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
  unreadNotificationCount: 0,
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
}))
