'use client'

import { Bell, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore, type Modality, type Role } from '@/lib/store'

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

export function AppHeader() {
  const {
    activeModality,
    setActiveModality,
    activeRole,
    setActiveRole,
    notificationCount,
  } = useAppStore()

  const modalities: Modality[] = ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6" role="banner">
      {/* Logo & Title */}
      <div className="flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        <div className="hidden sm:block">
          <h1 className="text-base font-bold leading-tight">MedGovern AI</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Clinician-Governed Multi-Modality Platform
          </p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Modality Selector */}
      <div className="flex items-center gap-1" role="group" aria-label="Care modality selector">
        {modalities.map((m) => (
          <Button
            key={m}
            variant="ghost"
            size="sm"
            onClick={() => setActiveModality(m)}
            className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${
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

      {/* Notification Bell */}
      <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-600 text-white">
            {notificationCount}
          </Badge>
        )}
      </Button>
    </header>
  )
}
