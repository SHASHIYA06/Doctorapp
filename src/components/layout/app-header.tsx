'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Stethoscope, Globe, ScanLine, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { useAppStore, type Modality, type Role, type Language, LANGUAGE_LABELS, type Section } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const modalityColors: Record<Modality, string> = {
  ALLOPATHY: 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800',
  AYURVEDA: 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800',
  HOMEOPATHY: 'bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800',
}

const modalityInactiveColors: Record<Modality, string> = {
  ALLOPATHY: 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900',
  AYURVEDA: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900',
  HOMEOPATHY: 'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900',
}

const roleLabels: Record<Role, string> = {
  PATIENT: 'Patient',
  CLINICIAN: 'Clinician',
  ADMIN: 'Admin',
}

interface CommandAction {
  id: Section | string
  label: string
  section?: Section
  action?: () => void
  shortcut?: string
}

const commandActions: CommandAction[] = [
  { id: 'dashboard', label: 'Go to Dashboard', section: 'dashboard', shortcut: '⌘1' },
  { id: 'patients', label: 'Go to Patients', section: 'patients', shortcut: '⌘2' },
  { id: 'scan-verify', label: 'Scan & Verify Medicine', section: 'scan-verify', shortcut: '⌘S' },
  { id: 'pharmacy', label: 'Find Pharmacy', section: 'pharmacy' },
  { id: 'symptom-checker', label: 'Symptom Checker', section: 'symptom-checker' },
  { id: 'voice', label: 'Voice Triage', section: 'voice' },
  { id: 'recalls', label: 'Recall Monitor', section: 'recalls' },
  { id: 'safety', label: 'Safety Alerts', section: 'safety' },
  { id: 'care-plans', label: 'Care Plans', section: 'care-plans' },
  { id: 'analytics', label: 'District Analytics', section: 'analytics' },
  { id: 'consent', label: 'Consent Management', section: 'consent' },
  { id: 'intake', label: 'Clinical Intake', section: 'intake' },
  { id: 'knowledge', label: 'Knowledge Base', section: 'knowledge' },
  { id: 'audit', label: 'Audit Trail', section: 'audit' },
]

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'safety' | 'recall' | 'system' | 'triage'
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Critical Safety Alert',
    description: 'Drug interaction detected: Warfarin + Aspirin for Patient #3',
    time: '2 min ago',
    type: 'safety',
    read: false,
  },
  {
    id: '2',
    title: 'CDSCO Recall Notice',
    description: 'Dolo 650 Batch ML-2025-0892 recalled - dissolution failure',
    time: '15 min ago',
    type: 'recall',
    read: false,
  },
  {
    id: '3',
    title: 'Voice Triage Escalation',
    description: 'Patient Sunita Devi escalated - anaphylaxis suspected',
    time: '22 min ago',
    type: 'triage',
    read: false,
  },
  {
    id: '4',
    title: 'Care Plan Signed',
    description: 'Dr. Meera Singh signed care plan for Rajesh Kumar',
    time: '1 hr ago',
    type: 'system',
    read: true,
  },
  {
    id: '5',
    title: 'New Patient Registered',
    description: 'Ananya Reddy added to Bangalore Urban district',
    time: '2 hr ago',
    type: 'system',
    read: true,
  },
]

const notificationTypeIcons: Record<string, string> = {
  safety: '🔴',
  recall: '⚠️',
  triage: '🎤',
  system: 'ℹ️',
}

export function AppHeader() {
  const {
    activeModality,
    setActiveModality,
    activeRole,
    setActiveRole,
    activeLanguage,
    setActiveLanguage,
    notificationCount,
    setActiveSection,
  } = useAppStore()

  const [commandOpen, setCommandOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications)

  const modalities: Modality[] = ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCommandSelect = useCallback((action: CommandAction) => {
    setCommandOpen(false)
    if (action.section) {
      setActiveSection(action.section)
    }
    if (action.action) {
      action.action()
    }
  }, [setActiveSection])

  const handleScanMedicine = useCallback(() => {
    setActiveSection('scan-verify')
    toast({ title: 'Scan & Verify', description: 'Navigate to the scanner to verify a medicine' })
  }, [setActiveSection])

  const handleMarkAllRead = useCallback(() => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast({ title: 'All notifications marked as read' })
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 bg-background" role="banner">
      {/* Logo & Title */}
      <div className="flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        <div className="hidden md:block">
          <h1 className="text-base font-bold leading-tight">MedGovern AI</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Clinician-Governed Multi-Modality Platform
          </p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Scan Medicine Quick Action */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleScanMedicine}
        className="hidden sm:flex h-8 gap-1.5 text-xs border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950"
      >
        <ScanLine className="h-3.5 w-3.5 text-teal-600" />
        Scan Medicine
      </Button>

      {/* Command Palette Trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCommandOpen(true)}
        className="h-8 gap-2 text-xs text-muted-foreground w-44 sm:w-56 justify-start"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="truncate">Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Modality Selector */}
      <div className="flex items-center gap-1" role="group" aria-label="Care modality selector">
        {modalities.map((m) => (
          <Button
            key={m}
            variant="ghost"
            size="sm"
            onClick={() => setActiveModality(m)}
            className={`h-8 px-2 sm:px-3 text-xs font-medium rounded-md transition-all ${
              activeModality === m
                ? modalityColors[m]
                : modalityInactiveColors[m]
            }`}
            aria-pressed={activeModality === m}
          >
            {m.charAt(0) + m.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">{LANGUAGE_LABELS[activeLanguage]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([code, label]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setActiveLanguage(code)}
              className={activeLanguage === code ? 'font-semibold bg-accent' : ''}
            >
              <span className="flex-1">{label}</span>
              {activeLanguage === code && (
                <Badge variant="secondary" className="text-[9px] px-1 ml-1">{code}</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5">
              Role
            </Badge>
            {roleLabels[activeRole]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(roleLabels) as Role[]).map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => setActiveRole(role)}
              className={activeRole === role ? 'font-semibold' : ''}
            >
              {roleLabels[role]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Bell with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-600 text-white">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          {notifications.slice(0, 5).map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className={`flex flex-col items-start gap-1 p-3 ${!notif.read ? 'bg-accent/50' : ''}`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm">{notificationTypeIcons[notif.type]}</span>
                <span className={`text-sm flex-1 ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</span>
                {!notif.read && <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{notif.description}</p>
              <span className="text-[10px] text-muted-foreground pl-6">{notif.time}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-center text-xs text-teal-600 dark:text-teal-400 justify-center">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Command Palette Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search sections, actions, patients..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {commandActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleCommandSelect(action)}
              >
                <Search className="h-4 w-4" />
                <span>{action.label}</span>
                {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setCommandOpen(false); handleScanMedicine(); }}>
              <ScanLine className="h-4 w-4" />
              <span>Scan Medicine Barcode</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setCommandOpen(false); setActiveSection('voice'); }}>
              <span>🎤</span>
              <span>Start Voice Triage</span>
            </CommandItem>
            <CommandItem onSelect={() => { setCommandOpen(false); setActiveSection('recalls'); }}>
              <span>⚠️</span>
              <span>Check Recall Alerts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
