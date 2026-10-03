'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Users, CheckCircle2, XCircle, AlertTriangle, Video,
  Plus, ChevronLeft, ChevronRight, Search, Filter, Send, Stethoscope,
  Bell, Eye, Play, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore, type Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────

type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'TELEMEDICINE' | 'PROCEDURE' | 'CHECKUP'
type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
type ViewMode = 'day' | 'week'
type TimeSlot = 15 | 30 | 45 | 60
type ListFilter = 'today' | 'week' | 'all'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Practitioner {
  id: string
  name: string
  specialty: string
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  practitionerId: string
  practitionerName: string
  type: AppointmentType
  modality: Modality
  status: AppointmentStatus
  date: string
  startTime: string
  endTime: string
  duration: TimeSlot
  urgent: boolean
  notes: string | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
}

// ── Config ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  IN_PROGRESS: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  NO_SHOW: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  CONSULTATION: 'Consultation',
  FOLLOW_UP: 'Follow-up',
  TELEMEDICINE: 'Telemedicine',
  PROCEDURE: 'Procedure',
  CHECKUP: 'Checkup',
}

const TIME_SLOTS: TimeSlot[] = [15, 30, 45, 60]

const APPOINTMENT_TYPES: AppointmentType[] = ['CONSULTATION', 'FOLLOW_UP', 'TELEMEDICINE', 'PROCEDURE', 'CHECKUP']

const SLOT_TIMES = [
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { date: Date; isCurrentMonth: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
  }
  return cells
}

function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const start = new Date(baseDate)
  start.setDate(start.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date())
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return d >= startOfWeek && d < endOfWeek
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ────────────────────────────────────────────────────────────

export function AppointmentsSection() {
  const { activeModality, setActiveSection, setSelectedPatientId, selectedAppointmentId, setSelectedAppointmentId } = useAppStore()

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>('day')

  // Modality filter
  const [modalityFilter, setModalityFilter] = useState<Modality>(activeModality)

  // List filter
  const [listFilter, setListFilter] = useState<ListFilter>('today')

  // New appointment dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formPractitionerId, setFormPractitionerId] = useState('')
  const [formType, setFormType] = useState<AppointmentType>('CONSULTATION')
  const [formModality, setFormModality] = useState<Modality>(activeModality)
  const [formDate, setFormDate] = useState(formatDate(new Date()))
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState<TimeSlot>(30)
  const [formUrgent, setFormUrgent] = useState(false)
  const [formNotes, setFormNotes] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Detail dialog
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null)

  // Cancel dialog
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // ── Load Data ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [apptRes, patRes] = await Promise.all([
        fetch('/api/appointments').then((r) => r.json()),
        fetch('/api/patients').then((r) => r.json()),
      ])
      const apptList = (apptRes.data ?? apptRes.appointments ?? []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        patientId: (a.patientId ?? '') as string,
        patientName: (a.patientName ?? (a.patient ? `${(a.patient as Record<string, string>).firstName} ${(a.patient as Record<string, string>).lastName}` : 'Unknown')) as string,
        practitionerId: (a.practitionerId ?? '') as string,
        practitionerName: (a.practitionerName ?? 'Dr. Unknown') as string,
        type: (a.type ?? 'CONSULTATION') as AppointmentType,
        modality: (a.modality ?? 'ALLOPATHY') as Modality,
        status: (a.status ?? 'SCHEDULED') as AppointmentStatus,
        date: (a.date ?? formatDate(new Date())) as string,
        startTime: (a.startTime ?? '09:00') as string,
        endTime: (a.endTime ?? '09:30') as string,
        duration: (a.duration ?? 30) as TimeSlot,
        urgent: (a.urgent ?? false) as boolean,
        notes: (a.notes ?? null) as string | null,
        cancelReason: (a.cancelReason ?? null) as string | null,
        createdAt: (a.createdAt ?? new Date().toISOString()) as string,
        updatedAt: (a.updatedAt ?? new Date().toISOString()) as string,
      }))
      setAppointments(apptList)
      setPatients(patRes.data ?? patRes.patients ?? [])

      // Mock practitioners if none in data
      setPractitioners([
        { id: 'prac-1', name: 'Dr. Sharma', specialty: 'General Medicine' },
        { id: 'prac-2', name: 'Dr. Patel', specialty: 'Cardiology' },
        { id: 'prac-3', name: 'Dr. Gupta', specialty: 'Ayurveda' },
        { id: 'prac-4', name: 'Dr. Singh', specialty: 'Homeopathy' },
        { id: 'prac-5', name: 'Dr. Kumar', specialty: 'Pediatrics' },
      ])
    } catch {
      toast({ title: 'Error', description: 'Failed to load appointments', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Filtered Appointments ──────────────────────────────────────────────

  const filteredAppointments = useMemo(() => {
    let list = appointments.filter((a) => a.modality === modalityFilter)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.practitionerName.toLowerCase().includes(q) ||
          TYPE_LABELS[a.type].toLowerCase().includes(q)
      )
    }

    if (listFilter === 'today') {
      list = list.filter((a) => isToday(a.date))
    } else if (listFilter === 'week') {
      list = list.filter((a) => isThisWeek(a.date))
    }

    return list.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return a.startTime.localeCompare(b.startTime)
    })
  }, [appointments, modalityFilter, searchQuery, listFilter])

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const todayAppts = appointments.filter((a) => isToday(a.date) && a.modality === modalityFilter)
    return {
      today: todayAppts.length,
      upcoming: todayAppts.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length,
      completed: todayAppts.filter((a) => a.status === 'COMPLETED').length,
      cancelled: todayAppts.filter((a) => a.status === 'CANCELLED').length,
    }
  }, [appointments, modalityFilter])

  // ── Calendar Data ──────────────────────────────────────────────────────

  const calendarDays = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  )

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  const appointmentsForDate = (dateStr: string) =>
    appointments.filter((a) => a.date === dateStr && a.modality === modalityFilter)

  // ── Create Appointment ─────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formPatientId || !formPractitionerId) {
      toast({ title: 'Validation', description: 'Patient and practitioner are required', variant: 'destructive' })
      return
    }
    setFormSubmitting(true)
    try {
      const endTime = addMinutes(formStartTime, formDuration)
      const patient = patients.find((p) => p.id === formPatientId)
      const practitioner = practitioners.find((p) => p.id === formPractitionerId)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          practitionerId: formPractitionerId,
          practitionerName: practitioner?.name ?? 'Unknown',
          type: formType,
          modality: formModality,
          date: formDate,
          startTime: formStartTime,
          endTime,
          duration: formDuration,
          urgent: formUrgent,
          notes: formNotes || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Appointment Created', description: `${TYPE_LABELS[formType]} scheduled` })
        setCreateDialogOpen(false)
        resetForm()
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error ?? 'Failed to create appointment', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormPatientId('')
    setFormPractitionerId('')
    setFormType('CONSULTATION')
    setFormModality(activeModality)
    setFormDate(selectedDate)
    setFormStartTime('09:00')
    setFormDuration(30)
    setFormUrgent(false)
    setFormNotes('')
  }

  // ── Cancel Appointment ─────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!cancelAppt) return
    if (!cancelReason.trim()) {
      toast({ title: 'Validation', description: 'Cancel reason is required', variant: 'destructive' })
      return
    }
    setCancelSubmitting(true)
    try {
      const res = await fetch(`/api/appointments/${cancelAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancelReason }),
      })
      if (res.ok) {
        toast({ title: 'Appointment Cancelled' })
        setCancelAppt(null)
        setCancelReason('')
        setDetailAppt(null)
        loadData()
      } else {
        toast({ title: 'Error', description: 'Failed to cancel', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setCancelSubmitting(false)
    }
  }

  // ── Status Change ──────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: 'Status Updated', description: `Appointment ${status.toLowerCase()}` })
        loadData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  // ── Quick Actions ──────────────────────────────────────────────────────

  const handleStartConsultation = (appt: Appointment) => {
    setSelectedPatientId(appt.patientId)
    setActiveSection('clinical-notes')
  }

  const handleSendReminder = (appt: Appointment) => {
    toast({ title: 'Reminder Sent', description: `Reminder sent to ${appt.patientName}` })
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Appointments", value: stats.today, icon: Calendar, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-green-600 dark:text-green-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-gray-600 dark:text-gray-400' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 bg-muted ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Appointments</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-40"
            />
          </div>
          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
                <DialogDescription>Fill in appointment details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Modality Tabs (NEVER merge) */}
                <div className="space-y-2">
                  <Label>Care Modality</Label>
                  <div className="flex gap-2">
                    {(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as Modality[]).map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={formModality === m ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormModality(m)}
                      >
                        <ModalityBadge modality={m} className="border-0 p-0" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={formPatientId} onValueChange={setFormPatientId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Practitioner *</Label>
                    <Select value={formPractitionerId} onValueChange={setFormPractitionerId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {practitioners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.specialty})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as AppointmentType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select value={formStartTime} onValueChange={setFormStartTime}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SLOT_TIMES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Select value={String(formDuration)} onValueChange={(v) => setFormDuration(Number(v) as TimeSlot)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((s) => (
                          <SelectItem key={s} value={String(s)}>{s} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Urgent</Label>
                    <div className="flex items-center h-9">
                      <Button
                        type="button"
                        variant={formUrgent ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setFormUrgent(!formUrgent)}
                        className="gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {formUrgent ? 'Urgent' : 'Normal'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Optional notes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={formSubmitting}>
                  {formSubmitting ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modality Tabs (NEVER merge) */}
      <div className="flex gap-2">
        {(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as Modality[]).map((m) => (
          <Button
            key={m}
            variant={modalityFilter === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModalityFilter(m)}
            className="gap-1.5"
          >
            <ModalityBadge modality={m} className="border-0 p-0" />
          </Button>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> List View
          </TabsTrigger>
        </TabsList>

        {/* ── Calendar Tab ──────────────────────────────────────────────── */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{monthLabel}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setCurrentDate(new Date()); setSelectedDate(formatDate(new Date())) }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-5" />
                      <Button
                        variant={viewMode === 'day' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setViewMode('day')}
                      >
                        Day
                      </Button>
                      <Button
                        variant={viewMode === 'week' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setViewMode('week')}
                      >
                        Week
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'day' ? (
                    <>
                      {/* Month Grid */}
                      <div className="grid grid-cols-7 gap-px">
                        {DAYS_OF_WEEK.map((d) => (
                          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                            {d}
                          </div>
                        ))}
                        {calendarDays.map((cell, i) => {
                          const ds = formatDate(cell.date)
                          const dayAppts = appointmentsForDate(ds)
                          const isSelected = ds === selectedDate
                          const isT = isToday(ds)
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedDate(ds)}
                              className={`relative min-h-[3.5rem] p-1 text-left text-sm rounded-md transition-colors
                                ${cell.isCurrentMonth ? '' : 'text-muted-foreground/40'}
                                ${isSelected ? 'bg-primary/10 ring-1 ring-primary' : isT ? 'bg-muted' : 'hover:bg-muted/50'}
                              `}
                            >
                              <span className={`text-xs ${isT ? 'font-bold text-primary' : ''}`}>
                                {cell.date.getDate()}
                              </span>
                              {dayAppts.length > 0 && (
                                <div className="mt-0.5 flex flex-wrap gap-0.5">
                                  {dayAppts.slice(0, 3).map((a) => (
                                    <span
                                      key={a.id}
                                      className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[a.status].split(' ')[0]}`}
                                    />
                                  ))}
                                  {dayAppts.length > 3 && (
                                    <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Day Detail */}
                      <Separator className="my-3" />
                      <div>
                        <p className="text-sm font-semibold mb-2">
                          {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <ScrollArea className="max-h-64">
                          {appointmentsForDate(selectedDate).length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No appointments</p>
                          ) : (
                            <div className="space-y-2">
                              {appointmentsForDate(selectedDate).map((appt) => (
                                <div
                                  key={appt.id}
                                  className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors
                                    ${appt.urgent ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30' : ''}
                                  `}
                                  onClick={() => setDetailAppt(appt)}
                                >
                                  <div className="text-xs text-muted-foreground w-12 shrink-0">
                                    {appt.startTime}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium truncate">{appt.patientName}</span>
                                      {appt.urgent && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                                      {appt.type === 'TELEMEDICINE' && <Video className="h-3 w-3 text-blue-500 shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {appt.practitionerName} · {TYPE_LABELS[appt.type]}
                                    </p>
                                  </div>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[appt.status]}`}>
                                    {appt.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </>
                  ) : (
                    /* Week View */
                    <div className="grid grid-cols-7 gap-px overflow-x-auto">
                      {weekDays.map((day) => {
                        const ds = formatDate(day)
                        const dayAppts = appointmentsForDate(ds)
                        const isT = isToday(ds)
                        return (
                          <div key={ds} className="min-w-[5.5rem]">
                            <div className={`text-center text-xs font-medium py-1.5 rounded-t-md ${isT ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {DAYS_OF_WEEK[day.getDay()]} {day.getDate()}
                            </div>
                            <div className="border-x border-b rounded-b-md p-1 space-y-1 min-h-[6rem]">
                              {dayAppts.slice(0, 4).map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => setDetailAppt(a)}
                                  className={`w-full text-left text-[10px] p-1 rounded ${STATUS_COLORS[a.status].split(' ')[0]} truncate block`}
                                >
                                  {a.startTime} {a.patientName}
                                </button>
                              ))}
                              {dayAppts.length > 4 && (
                                <p className="text-[9px] text-muted-foreground text-center">+{dayAppts.length - 4} more</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Sidebar */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-80">
                    {appointments
                      .filter((a) => a.modality === modalityFilter && a.date >= formatDate(new Date()) && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
                      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                      .slice(0, 10)
                      .map((appt) => (
                        <button
                          key={appt.id}
                          onClick={() => setDetailAppt(appt)}
                          className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors mb-1 border"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{appt.patientName}</span>
                            {appt.urgent && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appt.date} · {appt.startTime} · {TYPE_LABELS[appt.type]}
                          </p>
                          <Badge className={`text-[9px] px-1 py-0 mt-1 ${STATUS_COLORS[appt.status]}`}>
                            {appt.status.replace('_', ' ')}
                          </Badge>
                        </button>
                      ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── List Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="list" className="mt-4 space-y-3">
          {/* List Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['today', 'week', 'all'] as ListFilter[]).map((f) => (
              <Button
                key={f}
                variant={listFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListFilter(f)}
              >
                {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All'}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Practitioner</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appt) => (
                    <TableRow
                      key={appt.id}
                      className={`cursor-pointer hover:bg-muted/50 ${appt.urgent ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                      onClick={() => setDetailAppt(appt)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{appt.patientName}</span>
                          {appt.urgent && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {appt.type === 'TELEMEDICINE' && <Video className="h-3 w-3 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{appt.practitionerName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[appt.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{appt.date}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{appt.startTime}–{appt.endTime}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[appt.status]}`}>
                          {appt.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Detail Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!detailAppt} onOpenChange={(open) => { if (!open) setDetailAppt(null) }}>
        <DialogContent className="sm:max-w-md">
          {detailAppt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailAppt.patientName}
                  {detailAppt.urgent && <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1"><AlertTriangle className="h-3 w-3" />Urgent</Badge>}
                </DialogTitle>
                <DialogDescription>
                  {TYPE_LABELS[detailAppt.type]} · {detailAppt.date} · {detailAppt.startTime}–{detailAppt.endTime}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Practitioner</p>
                    <p className="font-medium">{detailAppt.practitionerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-medium">{detailAppt.duration} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Modality</p>
                    <ModalityBadge modality={detailAppt.modality} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge className={`text-xs ${STATUS_COLORS[detailAppt.status]}`}>
                      {detailAppt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {detailAppt.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{detailAppt.notes}</p>
                    </div>
                  </>
                )}
                {detailAppt.cancelReason && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cancel Reason</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{detailAppt.cancelReason}</p>
                    </div>
                  </>
                )}
                <Separator />
                {/* Status Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {detailAppt.status === 'SCHEDULED' && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { handleStatusChange(detailAppt.id, 'CONFIRMED'); setDetailAppt(null) }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                      </Button>
                    )}
                    {(detailAppt.status === 'SCHEDULED' || detailAppt.status === 'CONFIRMED') && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { handleStatusChange(detailAppt.id, 'IN_PROGRESS'); setDetailAppt(null) }}>
                          <Play className="h-3.5 w-3.5" /> Start
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setCancelAppt(detailAppt); setDetailAppt(null) }}>
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </>
                    )}
                    {detailAppt.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { handleStatusChange(detailAppt.id, 'COMPLETED'); setDetailAppt(null) }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </Button>
                    )}
                    {(detailAppt.status === 'SCHEDULED' || detailAppt.status === 'CONFIRMED' || detailAppt.status === 'IN_PROGRESS') && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleStartConsultation(detailAppt)}>
                          <Stethoscope className="h-3.5 w-3.5" /> Start Consultation
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleSendReminder(detailAppt)}>
                          <Bell className="h-3.5 w-3.5" /> Send Reminder
                        </Button>
                      </>
                    )}
                    {detailAppt.status === 'CONFIRMED' && detailAppt.type !== 'TELEMEDICINE' && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { handleStatusChange(detailAppt.id, 'NO_SHOW'); setDetailAppt(null) }}>
                        <XCircle className="h-3.5 w-3.5" /> No Show
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!cancelAppt} onOpenChange={(open) => { if (!open) { setCancelAppt(null); setCancelReason('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {cancelAppt ? `${cancelAppt.patientName} — ${TYPE_LABELS[cancelAppt.type]} on ${cancelAppt.date}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-2">
              <Label>Reason for cancellation *</Label>
              <Textarea
                placeholder="Provide reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelAppt(null); setCancelReason('') }}>Keep</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelSubmitting}>
              {cancelSubmitting ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
