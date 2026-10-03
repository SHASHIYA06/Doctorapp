'use client'

import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Stethoscope,
  FileText,
  BookOpen,
  ScrollText,
  Settings,
  Heart,
  Pill,
  Search,
  GitCompareArrows,
  ScanLine,
  MapPin,
  BarChart3,
  Mic,
  RotateCcw,
  Fingerprint,
  ShieldAlert,
  CalendarClock,
  GitCompare,
  Clock,
  Syringe,
} from 'lucide-react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type Section, type Role } from '@/lib/store'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { DashboardSection } from '@/components/sections/dashboard-section'
import { PatientsSection } from '@/components/sections/patients-section'
import { HealthIssuesSection } from '@/components/sections/health-issues-section'
import { MedicinesSection } from '@/components/sections/medicines-section'
import { SymptomCheckerSection } from '@/components/sections/symptom-checker-section'
import { DrugInteractionsSection } from '@/components/sections/drug-interactions-section'
import { ScanVerifySection } from '@/components/sections/scan-verify-section'
import { PharmacySection } from '@/components/sections/pharmacy-section'
import { ConsentSection } from '@/components/sections/consent-section'
import { IntakeSection } from '@/components/sections/intake-section'
import { SafetySection } from '@/components/sections/safety-section'
import { ClinicianQueueSection } from '@/components/sections/clinician-queue-section'
import { CarePlansSection } from '@/components/sections/care-plans-section'
import { KnowledgeSection } from '@/components/sections/knowledge-section'
import { AuditSection } from '@/components/sections/audit-section'
import { AnalyticsSection } from '@/components/sections/analytics-section'
import { VoiceSection } from '@/components/sections/voice-section'
import { RecallsSection } from '@/components/sections/recalls-section'
import { AdminSection } from '@/components/sections/admin-section'
import { AbhaSection } from '@/components/sections/abha-section'
import { CounterfeitSection } from '@/components/sections/counterfeit-section'
import { ExpiryTrackerSection } from '@/components/sections/expiry-tracker-section'
import { MedicineCompareSection } from '@/components/sections/medicine-compare-section'
import { DosageTrackerSection } from '@/components/sections/dosage-tracker-section'
import { VaccinationSection } from '@/components/sections/vaccination-section'

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
  roles: Role[]
  group?: string
}

const navItems: NavItem[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Overview' },
  // Patient Tools
  { id: 'symptom-checker', label: 'Symptom Checker', icon: Search, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'health-issues', label: 'Health Issues', icon: Heart, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'medicines', label: 'Medicine Catalog', icon: Pill, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'drug-interactions', label: 'Drug Interactions', icon: GitCompareArrows, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'scan-verify', label: 'Scan & Verify', icon: ScanLine, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'pharmacy', label: 'Pharmacy Finder', icon: MapPin, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'medicine-compare', label: 'Compare', icon: GitCompare, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'expiry-tracker', label: 'Expiry Tracker', icon: CalendarClock, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'dosage-tracker', label: 'Dosage Tracker', icon: Clock, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  // Clinical
  { id: 'patients', label: 'Patients', icon: Users, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'intake', label: 'Intake', icon: ClipboardList, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'clinician-queue', label: 'Clinician Queue', icon: Stethoscope, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'care-plans', label: 'Care Plans', icon: FileText, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Clinical' },
  // Intelligence
  { id: 'voice', label: 'Voice Triage', icon: Mic, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Intelligence' },
  { id: 'analytics', label: 'District Analytics', icon: BarChart3, roles: ['CLINICIAN', 'ADMIN'], group: 'Intelligence' },
  // Compliance & Safety
  { id: 'consent', label: 'Consent', icon: ShieldCheck, roles: ['CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, roles: ['CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'recalls', label: 'Recall Monitor', icon: RotateCcw, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'abha', label: 'ABHA', icon: Fingerprint, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'counterfeit', label: 'Counterfeit', icon: ShieldAlert, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Compliance' },
  // System
  { id: 'audit', label: 'Audit', icon: ScrollText, roles: ['ADMIN'], group: 'System' },
  { id: 'admin', label: 'Admin', icon: Settings, roles: ['ADMIN'], group: 'System' },
]

const sectionComponents: Record<Section, React.ComponentType> = {
  dashboard: DashboardSection,
  'symptom-checker': SymptomCheckerSection,
  'health-issues': HealthIssuesSection,
  medicines: MedicinesSection,
  'drug-interactions': DrugInteractionsSection,
  'scan-verify': ScanVerifySection,
  pharmacy: PharmacySection,
  patients: PatientsSection,
  consent: ConsentSection,
  intake: IntakeSection,
  safety: SafetySection,
  'clinician-queue': ClinicianQueueSection,
  'care-plans': CarePlansSection,
  knowledge: KnowledgeSection,
  audit: AuditSection,
  analytics: AnalyticsSection,
  voice: VoiceSection,
  recalls: RecallsSection,
  abha: AbhaSection,
  counterfeit: CounterfeitSection,
  'expiry-tracker': ExpiryTrackerSection,
  'medicine-compare': MedicineCompareSection,
  'dosage-tracker': DosageTrackerSection,
  vaccination: VaccinationSection,
  admin: AdminSection,
}

export function AppShell() {
  const { activeSection, setActiveSection, activeRole } = useAppStore()

  const visibleNavItems = navItems.filter((item) => item.roles.includes(activeRole))

  // Group nav items
  const groups = visibleNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const group = item.group || 'Navigation'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  // If active section is not visible, default to dashboard
  const effectiveSection = visibleNavItems.some((item) => item.id === activeSection)
    ? activeSection
    : 'dashboard'

  const ActiveSectionComponent = sectionComponents[effectiveSection]

  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-3">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-sm font-bold group-data-[collapsible=icon]:hidden">
                MedGovern AI
              </span>
            </div>
          </SidebarHeader>
          <Separator />
          <SidebarContent>
            {Object.entries(groups).map(([groupName, items]) => (
              <SidebarGroup key={groupName}>
                <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={effectiveSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="p-3">
            <Separator className="mb-2" />
            <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              <p className="font-medium">Role: {activeRole}</p>
              <p className="text-[10px]">v4.0 • ABHA + CDSCO + LASA</p>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1">
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <AppHeader />
          </div>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <ActiveSectionComponent />
          </main>
          <AppFooter />
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
