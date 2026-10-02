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
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['PATIENT', 'CLINICIAN', 'ADMIN'] },
  { id: 'patients', label: 'Patients', icon: Users, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'consent', label: 'Consent', icon: ShieldCheck, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'intake', label: 'Intake', icon: ClipboardList, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'clinician-queue', label: 'Clinician Queue', icon: Stethoscope, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'care-plans', label: 'Care Plans', icon: FileText, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, roles: ['CLINICIAN', 'ADMIN'] },
  { id: 'audit', label: 'Audit', icon: ScrollText, roles: ['ADMIN'] },
  { id: 'admin', label: 'Admin', icon: Settings, roles: ['ADMIN'] },
]

const sectionComponents: Record<Section, React.ComponentType> = {
  dashboard: DashboardSection,
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
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => (
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
        </SidebarContent>
        <SidebarFooter className="p-3">
          <Separator className="mb-2" />
          <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <p className="font-medium">Role: {activeRole}</p>
            <p className="text-[10px]">v1.0.0</p>
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
