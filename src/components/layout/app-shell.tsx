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
import { DashboardSection } from '@/components/sections/dashboard-section'
import { PatientsSection } from '@/components/sections/patients-section'
import { HealthIssuesSection } from '@/components/sections/health-issues-section'
import { MedicinesSection } from '@/components/sections/medicines-section'
import { SymptomCheckerSection } from '@/components/sections/symptom-checker-section'
import { DrugInteractionsSection } from '@/components/sections/drug-interactions-section'
import { ConsentSection } from '@/components/sections/consent-section'
import { IntakeSection } from '@/components/sections/intake-section'
import { SafetySection } from '@/components/sections/safety-section'
import { ClinicianQueueSection } from '@/components/sections/clinician-queue-section'
import { CarePlansSection } from '@/components/sections/care-plans-section'
import { KnowledgeSection } from '@/components/sections/knowledge-section'
import { AuditSection } from '@/components/sections/audit-section'
import { AdminSection } from '@/components/sections/admin-section'

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
  roles: Role[]
  group?: string
}

const navItems: NavItem[] = [
  // Patient-accessible sections (also for clinicians/admin)
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Overview' },
  { id: 'symptom-checker', label: 'Symptom Checker', icon: Search, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'health-issues', label: 'Health Issues', icon: Heart, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'medicines', label: 'Medicine Catalog', icon: Pill, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  { id: 'drug-interactions', label: 'Drug Interactions', icon: GitCompareArrows, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'], group: 'Patient Tools' },
  // Clinician/Admin sections
  { id: 'patients', label: 'Patients', icon: Users, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'intake', label: 'Intake', icon: ClipboardList, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'clinician-queue', label: 'Clinician Queue', icon: Stethoscope, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'care-plans', label: 'Care Plans', icon: FileText, roles: ['CLINICIAN', 'ADMIN'], group: 'Clinical' },
  { id: 'consent', label: 'Consent', icon: ShieldCheck, roles: ['CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, roles: ['CLINICIAN', 'ADMIN'], group: 'Compliance' },
  { id: 'audit', label: 'Audit', icon: ScrollText, roles: ['ADMIN'], group: 'System' },
  { id: 'admin', label: 'Admin', icon: Settings, roles: ['ADMIN'], group: 'System' },
]

const sectionComponents: Record<Section, React.ComponentType> = {
  dashboard: DashboardSection,
  'symptom-checker': SymptomCheckerSection,
  'health-issues': HealthIssuesSection,
  medicines: MedicinesSection,
  'drug-interactions': DrugInteractionsSection,
  patients: PatientsSection,
  consent: ConsentSection,
  intake: IntakeSection,
  safety: SafetySection,
  'clinician-queue': ClinicianQueueSection,
  'care-plans': CarePlansSection,
  knowledge: KnowledgeSection,
  audit: AuditSection,
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
            <p className="text-[10px]">v2.0.0 • PostgreSQL</p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <AppHeader />
        </div>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <ActiveSectionComponent />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
