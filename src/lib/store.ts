'use client'

import { create } from 'zustand'

export type Section =
  | 'dashboard'
  | 'patients'
  | 'consent'
  | 'intake'
  | 'safety'
  | 'clinician-queue'
  | 'care-plans'
  | 'knowledge'
  | 'audit'
  | 'admin'

export type Modality = 'ALLOPATHY' | 'AYURVEDA' | 'HOMEOPATHY'

export type Role = 'PATIENT' | 'CLINICIAN' | 'ADMIN'

interface AppState {
  activeSection: Section
  setActiveSection: (section: Section) => void

  activeModality: Modality
  setActiveModality: (modality: Modality) => void

  activeRole: Role
  setActiveRole: (role: Role) => void

  selectedPatientId: string | null
  setSelectedPatientId: (id: string | null) => void

  selectedEncounterId: string | null
  setSelectedEncounterId: (id: string | null) => void

  notificationCount: number
  setNotificationCount: (count: number) => void

  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),

  activeModality: 'ALLOPATHY',
  setActiveModality: (modality) => set({ activeModality: modality }),

  activeRole: 'CLINICIAN',
  setActiveRole: (role) => set({ activeRole: role }),

  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  selectedEncounterId: null,
  setSelectedEncounterId: (id) => set({ selectedEncounterId: id }),

  notificationCount: 3,
  setNotificationCount: (count) => set({ notificationCount: count }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
