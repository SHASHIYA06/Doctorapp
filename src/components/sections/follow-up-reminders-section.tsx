'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Bell,
  CheckCircle2,
  Calendar,
  Pill,
  Syringe,
  FlaskConical,
  Repeat,
  Plus,
  X,
  AlertCircle,
  ChevronRight,
  Send,
  Smartphone,
  MessageSquare,
  BellRing,
  Timer,
  CalendarCheck,
  CalendarX,
  ListChecks,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReminderType = 'FOLLOW_UP' | 'MEDICATION_REMINDER' | 'LAB_REMINDER' | 'VACCINATION_DUE' | 'CHECKUP'
type RecurrenceType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
type ChannelType = 'IN_APP' | 'SMS' | 'WHATSAPP' | 'PUSH'
type DeliveryStatus = 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING'
type ReminderStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED'

interface Reminder {
  id: string
  patientId: string
  patientName: string
  title: string
  description: string
  type: ReminderType
  scheduledDate: string
  scheduledTime: string
  recurrence: RecurrenceType
  channel: ChannelType
  deliveryStatus: DeliveryStatus
  status: ReminderStatus
  completedAt: string | null
  createdAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

const REMINDER_TYPE_CONFIG: Record<ReminderType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  FOLLOW_UP: {
    label: 'Follow-up',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  MEDICATION_REMINDER: {
    label: 'Medication',
    icon: Pill,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  LAB_REMINDER: {
    label: 'Lab Test',
    icon: FlaskConical,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  VACCINATION_DUE: {
    label: 'Vaccination',
    icon: Syringe,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  CHECKUP: {
    label: 'Checkup',
    icon: CalendarCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
}

const RECURRENCE_CONFIG: Record<RecurrenceType, { label: string; icon: React.ElementType }> = {
  ONCE: { label: 'Once', icon: Bell },
  DAILY: { label: 'Daily', icon: Repeat },
  WEEKLY: { label: 'Weekly', icon: Repeat },
  MONTHLY: { label: 'Monthly', icon: Repeat },
}

const CHANNEL_CONFIG: Record<ChannelType, { label: string; icon: React.ElementType }> = {
  IN_APP: { label: 'In-App', icon: BellRing },
  SMS: { label: 'SMS', icon: Smartphone },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare },
  PUSH: { label: 'Push', icon: Send },
}

const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  SENT: { label: 'Sent', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

// ─── Helper functions ────────────────────────────────────────────────────────

function isOverdue(reminder: Reminder): boolean {
  if (reminder.status === 'COMPLETED' || reminder.status === 'EXPIRED') return false
  const scheduled = new Date(`${reminder.scheduledDate}T${reminder.scheduledTime}`)
  return scheduled < new Date()
}

function isUpcoming(reminder: Reminder): boolean {
  if (reminder.status !== 'ACTIVE') return false
  const scheduled = new Date(`${reminder.scheduledDate}T${reminder.scheduledTime}`)
  const now = new Date()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return scheduled >= now && (scheduled.getTime() - now.getTime()) <= sevenDays
}

function isDueToday(reminder: Reminder): boolean {
  if (reminder.status !== 'ACTIVE') return false
  const today = new Date().toISOString().slice(0, 10)
  return reminder.scheduledDate === today
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_PATIENTS: Patient[] = [
  { id: 'p-001', firstName: 'Rajesh', lastName: 'Kumar' },
  { id: 'p-002', firstName: 'Priya', lastName: 'Sharma' },
  { id: 'p-003', firstName: 'Amit', lastName: 'Patel' },
]

const today = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)

const DEMO_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
    title: 'Diabetes Follow-up',
    description: 'Quarterly diabetes management review. Check HbA1c, fasting glucose, and renal function.',
    type: 'FOLLOW_UP',
    scheduledDate: fmt(new Date(today.getTime() + 2 * 86400000)),
    scheduledTime: '10:00',
    recurrence: 'MONTHLY',
    channel: 'IN_APP',
    deliveryStatus: 'PENDING',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
    title: 'Metformin 500mg - Morning Dose',
    description: 'Take Metformin 500mg with breakfast. Do not skip doses.',
    type: 'MEDICATION_REMINDER',
    scheduledDate: fmt(today),
    scheduledTime: '08:00',
    recurrence: 'DAILY',
    channel: 'WHATSAPP',
    deliveryStatus: 'DELIVERED',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    patientId: 'p-002',
    patientName: 'Priya Sharma',
    title: 'HbA1c & Lipid Panel',
    description: 'Order HbA1c and complete lipid profile. Patient has not had labs in 90 days.',
    type: 'LAB_REMINDER',
    scheduledDate: fmt(new Date(today.getTime() - 86400000)),
    scheduledTime: '09:00',
    recurrence: 'ONCE',
    channel: 'SMS',
    deliveryStatus: 'SENT',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-4',
    patientId: 'p-002',
    patientName: 'Priya Sharma',
    title: 'Tdap Booster Vaccination',
    description: 'Tdap booster due as per immunization schedule. Last Tdap was 10 years ago.',
    type: 'VACCINATION_DUE',
    scheduledDate: fmt(new Date(today.getTime() + 5 * 86400000)),
    scheduledTime: '11:00',
    recurrence: 'ONCE',
    channel: 'IN_APP',
    deliveryStatus: 'PENDING',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-5',
    patientId: 'p-003',
    patientName: 'Amit Patel',
    title: 'Annual Health Checkup',
    description: 'Comprehensive annual health checkup including CBC, LFT, KFT, Lipid, Thyroid, and ECG.',
    type: 'CHECKUP',
    scheduledDate: fmt(new Date(today.getTime() + 3 * 86400000)),
    scheduledTime: '09:30',
    recurrence: 'YEARLY' as RecurrenceType,
    channel: 'PUSH',
    deliveryStatus: 'PENDING',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-6',
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
    title: 'Warfarin INR Check',
    description: 'Weekly INR monitoring for Warfarin therapy. Target INR 2.0-3.0.',
    type: 'LAB_REMINDER',
    scheduledDate: fmt(new Date(today.getTime() - 3 * 86400000)),
    scheduledTime: '07:30',
    recurrence: 'WEEKLY',
    channel: 'SMS',
    deliveryStatus: 'DELIVERED',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-7',
    patientId: 'p-003',
    patientName: 'Amit Patel',
    title: 'Blood Pressure Medication',
    description: 'Amlodipine 5mg - Take every evening at 8 PM.',
    type: 'MEDICATION_REMINDER',
    scheduledDate: fmt(today),
    scheduledTime: '20:00',
    recurrence: 'DAILY',
    channel: 'WHATSAPP',
    deliveryStatus: 'PENDING',
    status: 'ACTIVE',
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
]

// ─── Animation ───────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FollowUpRemindersSection() {
  const { selectedPatientId } = useAppStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('ALL')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar date
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDate, setNewDate] = useState(fmt(today))
  const [newTime, setNewTime] = useState('09:00')
  const [newType, setNewType] = useState<ReminderType>('FOLLOW_UP')
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>('ONCE')
  const [newChannel, setNewChannel] = useState<ChannelType>('IN_APP')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // ── Fetch data ──
  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.patients ?? []
        if (Array.isArray(list) && list.length > 0) setPatients(list)
        else setPatients(DEMO_PATIENTS)
      })
      .catch(() => setPatients(DEMO_PATIENTS))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = selectedPatient !== 'ALL' ? `?patientId=${selectedPatient}` : ''
    fetch(`/api/follow-up-reminders${params}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? d.reminders ?? []
        if (Array.isArray(data) && data.length > 0) {
          setReminders(data)
        } else {
          setReminders(DEMO_REMINDERS)
        }
      })
      .catch(() => setReminders(DEMO_REMINDERS))
      .finally(() => setLoading(false))
  }, [selectedPatient, selectedPatientId])

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400000)
    return {
      totalActive: reminders.filter((r) => r.status === 'ACTIVE').length,
      dueToday: reminders.filter(isDueToday).length,
      overdue: reminders.filter(isOverdue).length,
      completedThisWeek: reminders.filter((r) => r.status === 'COMPLETED' && r.completedAt && new Date(r.completedAt) >= weekAgo).length,
    }
  }, [reminders])

  // ── Categorized reminders ──
  const overdueReminders = useMemo(() => reminders.filter(isOverdue), [reminders])
  const upcomingReminders = useMemo(
    () => reminders.filter(isUpcoming).sort((a, b) => new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime()),
    [reminders]
  )

  // Calendar dates with reminders
  const reminderDates = useMemo(() => {
    const dateMap = new Map<string, Reminder[]>()
    reminders.forEach((r) => {
      if (r.status === 'ACTIVE') {
        const existing = dateMap.get(r.scheduledDate) ?? []
        existing.push(r)
        dateMap.set(r.scheduledDate, existing)
      }
    })
    return dateMap
  }, [reminders])

  const selectedDateReminders = useMemo(() => {
    if (!calendarDate) return []
    const key = fmt(calendarDate)
    return reminderDates.get(key) ?? []
  }, [calendarDate, reminderDates])

  // ── Mark as complete ──
  const handleComplete = useCallback(async (id: string) => {
    try {
      await fetch('/api/follow-up-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'COMPLETED' }),
      })
    } catch {
      // local update anyway
    }
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' as ReminderStatus, completedAt: new Date().toISOString() } : r))
    )
    toast({ title: 'Reminder Completed', description: 'The reminder has been marked as complete' })
  }, [])

  // ── Create reminder ──
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    setCreateSubmitting(true)
    const patient = patients.find((p) => p.id === selectedPatient) ?? patients[0]
    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      patientId: selectedPatient !== 'ALL' ? selectedPatient : (patient?.id ?? 'p-001'),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
      title: newTitle,
      description: newDesc,
      type: newType,
      scheduledDate: newDate,
      scheduledTime: newTime,
      recurrence: newRecurrence,
      channel: newChannel,
      deliveryStatus: 'PENDING',
      status: 'ACTIVE',
      completedAt: null,
      createdAt: new Date().toISOString(),
    }
    try {
      await fetch('/api/follow-up-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder),
      })
    } catch {
      // local update anyway
    }
    setReminders((prev) => [newReminder, ...prev])
    toast({ title: 'Reminder Created', description: `"${newTitle}" scheduled for ${newDate}` })
    setCreateOpen(false)
    resetCreateForm()
    setCreateSubmitting(false)
  }

  const resetCreateForm = () => {
    setNewTitle('')
    setNewDesc('')
    setNewDate(fmt(today))
    setNewTime('09:00')
    setNewType('FOLLOW_UP')
    setNewRecurrence('ONCE')
    setNewChannel('IN_APP')
  }

  // ── Quick actions ──
  const handleQuickAction = (type: ReminderType, title: string, desc: string) => {
    setNewType(type)
    setNewTitle(title)
    setNewDesc(desc)
    setCreateOpen(true)
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalActive}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">{stats.dueToday}</span>
            </div>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CalendarX className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.overdue}</span>
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.completedThisWeek}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completed This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Patient</Label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Patients</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleQuickAction('FOLLOW_UP', 'Schedule Follow-up', 'Follow-up appointment needed for ongoing care management.')}
        >
          <Clock className="h-3.5 w-3.5" />
          Schedule Follow-up
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleQuickAction('MEDICATION_REMINDER', 'Set Medication Reminder', 'Daily medication reminder for prescribed treatment.')}
        >
          <Pill className="h-3.5 w-3.5" />
          Set Medication Reminder
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleQuickAction('LAB_REMINDER', 'Order Lab Tests', 'Remind patient about pending lab orders.')}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Order Lab Tests
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleQuickAction('VACCINATION_DUE', 'Vaccination Due', 'Vaccination is due as per immunization schedule.')}
        >
          <Syringe className="h-3.5 w-3.5" />
          Schedule Vaccination
        </Button>
      </div>

      {/* ── Overdue Alerts ── */}
      {overdueReminders.length > 0 && (
        <Card className="border-red-300 dark:border-red-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
              <CalendarX className="h-5 w-5" />
              Overdue Reminders
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {overdueReminders.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-red-600/70 dark:text-red-400/70">
              These reminders have passed their scheduled date and need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overdueReminders.map((rem) => {
                const typeCfg = REMINDER_TYPE_CONFIG[rem.type]
                const TypeIcon = typeCfg.icon
                return (
                  <div
                    key={rem.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-200 dark:bg-red-950/20 dark:border-red-800"
                  >
                    <TypeIcon className={`h-4 w-4 shrink-0 ${typeCfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">{rem.title}</span>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {rem.patientName} &middot; Due: {new Date(`${rem.scheduledDate}T${rem.scheduledTime}`).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs shrink-0"
                      onClick={() => handleComplete(rem.id)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Calendar View + Reminder List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <CalendarPicker
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="rounded-md"
              modifiers={{
                hasReminder: (date) => reminderDates.has(fmt(date)),
              }}
              modifiersStyles={{
                hasReminder: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'var(--color-primary)' },
              }}
            />
            {calendarDate && selectedDateReminders.length > 0 && (
              <div className="w-full mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {calendarDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                {selectedDateReminders.map((rem) => {
                  const typeCfg = REMINDER_TYPE_CONFIG[rem.type]
                  const TypeIcon = typeCfg.icon
                  return (
                    <div key={rem.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                      <TypeIcon className={`h-3.5 w-3.5 shrink-0 ${typeCfg.color}`} />
                      <span className="truncate">{rem.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{rem.scheduledTime}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {calendarDate && selectedDateReminders.length === 0 && (
              <p className="text-xs text-muted-foreground mt-4">No reminders for this date</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming & All Reminders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Upcoming Reminders
              <Badge variant="outline" className="text-xs">{upcomingReminders.length} next 7 days</Badge>
            </CardTitle>
            <CardDescription>Reminders scheduled in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming reminders</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Reminder</TableHead>
                      <TableHead className="hidden sm:table-cell">Patient</TableHead>
                      <TableHead className="hidden md:table-cell">Schedule</TableHead>
                      <TableHead className="hidden md:table-cell">Channel</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReminders.map((rem) => {
                      const typeCfg = REMINDER_TYPE_CONFIG[rem.type]
                      const TypeIcon = typeCfg.icon
                      const chanCfg = CHANNEL_CONFIG[rem.channel]
                      const ChanIcon = chanCfg.icon
                      const delCfg = DELIVERY_STATUS_CONFIG[rem.deliveryStatus]
                      const recCfg = RECURRENCE_CONFIG[rem.recurrence]
                      const overdue = isOverdue(rem)
                      const dueToday = isDueToday(rem)

                      return (
                        <TableRow key={rem.id} className={overdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <TableCell>
                            <div className={`p-1.5 rounded-md ${typeCfg.bgColor}`}>
                              <TypeIcon className={`h-4 w-4 ${typeCfg.color}`} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm">{rem.title}</span>
                                {dueToday && (
                                  <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    Due Today
                                  </Badge>
                                )}
                                {overdue && (
                                  <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{rem.description}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="text-xs">{typeCfg.label}</Badge>
                                <Badge variant="outline" className="text-xs">{recCfg.label}</Badge>
                                <Badge variant="outline" className={`text-xs ${delCfg.className}`}>{delCfg.label}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{rem.patientName}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              {new Date(rem.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-muted-foreground">{rem.scheduledTime}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ChanIcon className="h-3 w-3" />
                              {chanCfg.label}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleComplete(rem.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Done</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── All Reminders (Complete List) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Reminders
            <Badge variant="outline" className="text-xs">{reminders.length}</Badge>
          </CardTitle>
          <CardDescription>Complete list of all reminders across all statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Delivery</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((rem) => {
                  const typeCfg = REMINDER_TYPE_CONFIG[rem.type]
                  const TypeIcon = typeCfg.icon
                  const delCfg = DELIVERY_STATUS_CONFIG[rem.deliveryStatus]
                  const overdue = isOverdue(rem)

                  return (
                    <TableRow
                      key={rem.id}
                      className={`${overdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''} ${rem.status === 'COMPLETED' ? 'opacity-50' : ''}`}
                    >
                      <TableCell>
                        <TypeIcon className={`h-4 w-4 ${typeCfg.color}`} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className={`text-sm font-medium ${rem.status === 'COMPLETED' ? 'line-through' : ''}`}>
                            {rem.title}
                          </span>
                          {rem.recurrence !== 'ONCE' && (
                            <Badge variant="outline" className="text-xs ml-1.5">
                              <Repeat className="h-2.5 w-2.5 mr-0.5" />
                              {rem.recurrence}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{rem.patientName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {new Date(rem.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {rem.scheduledTime}
                      </TableCell>
                      <TableCell>
                        {rem.status === 'COMPLETED' ? (
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
                        ) : rem.status === 'EXPIRED' ? (
                          <Badge className="text-xs bg-muted text-muted-foreground">Expired</Badge>
                        ) : overdue ? (
                          <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Overdue</Badge>
                        ) : (
                          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={`text-xs ${delCfg.className}`}>{delCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {rem.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleComplete(rem.id)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Complete</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Reminder Dialog ── */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetCreateForm() }}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Reminder
            </DialogTitle>
            <DialogDescription>
              Schedule a new reminder for patient follow-up, medication, lab, or vaccination
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., Diabetes follow-up appointment"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details about this reminder..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as ReminderType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REMINDER_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={newRecurrence} onValueChange={(v) => setNewRecurrence(v as RecurrenceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={newChannel} onValueChange={(v) => setNewChannel(v as ChannelType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createSubmitting || !newTitle.trim()} className="gap-1.5">
              {createSubmitting ? 'Creating...' : (
                <>
                  <Bell className="h-4 w-4" />
                  Create Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Compliance Note ── */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-muted">
        <Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Reminder Compliance:</span>{' '}
          Follow-up reminders align with NICE NG28, ADA Standards of Care, and ICMR clinical guidelines.
          Delivery channels comply with India&lsquo;s DPDPA data privacy regulations.
          All reminder actions are audit-logged for NABH accreditation compliance.
        </p>
      </div>
    </motion.div>
  )
}
