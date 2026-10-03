'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Pill,
  FlaskConical,
  Syringe,
  ArrowRightLeft,
  LogIn,
  LogOut,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Activity,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────

type TimelineEventType =
  | 'ENCOUNTER'
  | 'PRESCRIPTION'
  | 'LAB_RESULT'
  | 'VACCINATION'
  | 'REFERRAL'
  | 'ADMISSION'
  | 'DISCHARGE'
  | 'NOTE'
  | 'FOLLOW_UP'

type TimelineModality = 'ALLOPATHY' | 'AYURVEDA' | 'HOMEOPATHY'

interface TimelineEvent {
  id: string
  patientId: string
  eventType: TimelineEventType
  modality: TimelineModality
  title: string
  description: string
  timestamp: string
  isSignificant: boolean
  data: Record<string, unknown>
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ── Constants ────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<TimelineEventType, { icon: React.ElementType; label: string }> = {
  ENCOUNTER: { icon: Stethoscope, label: 'Encounter' },
  PRESCRIPTION: { icon: Pill, label: 'Prescription' },
  LAB_RESULT: { icon: FlaskConical, label: 'Lab Result' },
  VACCINATION: { icon: Syringe, label: 'Vaccination' },
  REFERRAL: { icon: ArrowRightLeft, label: 'Referral' },
  ADMISSION: { icon: LogIn, label: 'Admission' },
  DISCHARGE: { icon: LogOut, label: 'Discharge' },
  NOTE: { icon: FileText, label: 'Clinical Note' },
  FOLLOW_UP: { icon: Calendar, label: 'Follow-up' },
}

const MODALITY_COLORS: Record<TimelineModality, { dot: string; line: string; bg: string; text: string }> = {
  ALLOPATHY: {
    dot: 'bg-teal-500 border-teal-600',
    line: 'bg-teal-300 dark:bg-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-950',
    text: 'text-teal-700 dark:text-teal-300',
  },
  AYURVEDA: {
    dot: 'bg-amber-500 border-amber-600',
    line: 'bg-amber-300 dark:bg-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
  },
  HOMEOPATHY: {
    dot: 'bg-purple-500 border-purple-600',
    line: 'bg-purple-300 dark:bg-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
  },
}

// ── Sample Data ──────────────────────────────────────────────────────────

const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    patientId: 'p-1',
    eventType: 'ADMISSION',
    modality: 'ALLOPATHY',
    title: 'Emergency Admission — Chest Pain',
    description: 'Patient admitted via ER with acute chest pain, BP 160/100, HR 110',
    timestamp: '2025-01-15T08:30:00Z',
    isSignificant: true,
    data: { ward: 'ICU', bed: 'B3', admittingDoctor: 'Dr. R. Sharma', vitals: { bp: '160/100', hr: 110, temp: 37.2 } },
  },
  {
    id: 'evt-2',
    patientId: 'p-1',
    eventType: 'ENCOUNTER',
    modality: 'ALLOPATHY',
    title: 'Cardiology Consultation',
    description: 'Cardiologist evaluation; ECG shows ST elevation; troponin elevated',
    timestamp: '2025-01-15T10:00:00Z',
    isSignificant: true,
    data: { doctor: 'Dr. A. Patel', department: 'Cardiology', findings: 'ST elevation V1-V4, Troponin I: 2.8 ng/mL' },
  },
  {
    id: 'evt-3',
    patientId: 'p-1',
    eventType: 'LAB_RESULT',
    modality: 'ALLOPATHY',
    title: 'Cardiac Biomarkers',
    description: 'Troponin I: 2.8 ng/mL (↑), CK-MB: 45 U/L (↑), BNP: 320 pg/mL',
    timestamp: '2025-01-15T11:30:00Z',
    isSignificant: true,
    data: { troponinI: '2.8 ng/mL', ckmb: '45 U/L', bnp: '320 pg/mL', referenceRange: 'Troponin <0.04, CK-MB <25, BNP <100' },
  },
  {
    id: 'evt-4',
    patientId: 'p-1',
    eventType: 'PRESCRIPTION',
    modality: 'ALLOPATHY',
    title: 'Anti-platelet & Statin Therapy',
    description: 'Aspirin 325mg, Clopidogrel 75mg, Atorvastatin 80mg',
    timestamp: '2025-01-15T12:00:00Z',
    isSignificant: false,
    data: { medications: ['Aspirin 325mg OD', 'Clopidogrel 75mg OD', 'Atorvastatin 80mg HS'] },
  },
  {
    id: 'evt-5',
    patientId: 'p-1',
    eventType: 'NOTE',
    modality: 'ALLOPATHY',
    title: 'Progress Note — Day 1',
    description: 'Patient stable on medications. Pain controlled. Monitoring continued.',
    timestamp: '2025-01-16T09:00:00Z',
    isSignificant: false,
    data: { noteType: 'PROGRESS', author: 'Dr. R. Sharma', content: 'Patient stable. Pain 2/10. Continue monitoring.' },
  },
  {
    id: 'evt-6',
    patientId: 'p-1',
    eventType: 'REFERRAL',
    modality: 'AYURVEDA',
    title: 'Ayurveda Cardiac Rehab Referral',
    description: 'Referred for post-MI cardiac rehabilitation with Arjuna therapy',
    timestamp: '2025-01-17T14:00:00Z',
    isSignificant: false,
    data: { referredTo: 'Vaidya S. Joshi', reason: 'Post-MI cardiac rehabilitation', therapy: 'Arjuna kwath + Pranayama' },
  },
  {
    id: 'evt-7',
    patientId: 'p-1',
    eventType: 'DISCHARGE',
    modality: 'ALLOPATHY',
    title: 'Discharge — Stable Condition',
    description: 'Discharged with medication plan and follow-up in 7 days',
    timestamp: '2025-01-18T10:00:00Z',
    isSignificant: true,
    data: { dischargeSummary: 'NSTEMI managed conservatively. Discharge meds: Aspirin, Clopidogrel, Atorvastatin, Metoprolol.', followUpDate: '2025-01-25' },
  },
  {
    id: 'evt-8',
    patientId: 'p-1',
    eventType: 'VACCINATION',
    modality: 'ALLOPATHY',
    title: 'Influenza Vaccine',
    description: 'Annual flu vaccine administered prior to discharge',
    timestamp: '2025-01-18T09:30:00Z',
    isSignificant: false,
    data: { vaccine: 'Influenza (Quadrivalent)', batchNo: 'FL2025-0412', site: 'Left deltoid' },
  },
  {
    id: 'evt-9',
    patientId: 'p-1',
    eventType: 'FOLLOW_UP',
    modality: 'ALLOPATHY',
    title: 'Cardiology Follow-up',
    description: 'Post-discharge follow-up appointment scheduled',
    timestamp: '2025-01-25T10:00:00Z',
    isSignificant: false,
    data: { doctor: 'Dr. A. Patel', department: 'Cardiology', type: 'POST_DISCHARGE' },
  },
  {
    id: 'evt-10',
    patientId: 'p-1',
    eventType: 'ENCOUNTER',
    modality: 'AYURVEDA',
    title: 'Ayurveda Wellness Consultation',
    description: 'Arjuna kwath prescribed; Pranayama and dietary modifications advised',
    timestamp: '2025-02-01T11:00:00Z',
    isSignificant: false,
    data: { practitioner: 'Vaidya S. Joshi', chikitsa: 'Hridya Rog Chikitsa', duration: '45 min' },
  },
  {
    id: 'evt-11',
    patientId: 'p-1',
    eventType: 'LAB_RESULT',
    modality: 'ALLOPATHY',
    title: 'Lipid Panel — Follow-up',
    description: 'Total Cholesterol: 185, LDL: 110, HDL: 45, TG: 150',
    timestamp: '2025-02-05T08:00:00Z',
    isSignificant: false,
    data: { totalChol: 185, ldl: 110, hdl: 45, triglycerides: 150 },
  },
  {
    id: 'evt-12',
    patientId: 'p-1',
    eventType: 'PRESCRIPTION',
    modality: 'AYURVEDA',
    title: 'Arjuna Kwath + Guggulu',
    description: 'Arjuna kwath 30ml BD, Guggulu 500mg BD',
    timestamp: '2025-02-01T11:30:00Z',
    isSignificant: false,
    data: { medications: ['Arjuna Twak Kwath 30ml BD', 'Guggulu 500mg BD'] },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// ── Component ────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function PatientTimelineSection() {
  const { selectedPatientId, setSelectedPatientId } = useAppStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  // Filters
  const [filterEventType, setFilterEventType] = useState<string>('ALL')
  const [filterModality, setFilterModality] = useState<string>('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const localPatientId = selectedPatientId ?? 'p-1'

  // ── Load patients ────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients')
      const json = await res.json()
      const list = json.data ?? json.patients ?? []
      setPatients(list)
    } catch {
      toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
    } finally {
      setPatientsLoading(false)
    }
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  // ── Load timeline ────────────────────────────────────────────────────
  const loadTimeline = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patient-timeline?patientId=${localPatientId}`)
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.events ?? []
        setEvents(list.length > 0 ? list : SAMPLE_EVENTS)
      } else {
        setEvents(SAMPLE_EVENTS)
      }
    } catch {
      setEvents(SAMPLE_EVENTS)
    } finally {
      setLoading(false)
    }
  }, [localPatientId])

  useEffect(() => { loadTimeline() }, [loadTimeline])

  // ── Filtered events ──────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (filterEventType !== 'ALL') {
      result = result.filter((e) => e.eventType === filterEventType)
    }
    if (filterModality !== 'ALL') {
      result = result.filter((e) => e.modality === filterModality)
    }
    if (filterDateFrom) {
      result = result.filter((e) => new Date(e.timestamp) >= new Date(filterDateFrom))
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((e) => new Date(e.timestamp) <= to)
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return result
  }, [events, filterEventType, filterModality, filterDateFrom, filterDateTo])

  // ── Stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const lastEncounter = sorted.find((e) => e.eventType === 'ENCOUNTER')
    const nextFollowUp = sorted
      .filter((e) => e.eventType === 'FOLLOW_UP' && new Date(e.timestamp) >= new Date())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]

    return {
      totalEvents: events.length,
      lastVisit: lastEncounter ? formatDate(lastEncounter.timestamp) : 'N/A',
      nextFollowUp: nextFollowUp ? formatDate(nextFollowUp.timestamp) : 'None scheduled',
    }
  }, [events])

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient Timeline</h2>
          <p className="text-sm text-muted-foreground">Visual event history across all modalities</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={localPatientId}
            onValueChange={(v) => setSelectedPatientId(v)}
          >
            <SelectTrigger className="w-[200px]">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patientsLoading ? (
                <SelectItem value="loading" disabled>Loading…</SelectItem>
              ) : patients.length === 0 ? (
                <SelectItem value="demo" disabled>Demo Patient</SelectItem>
              ) : (
                patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-xl font-bold">{stats.totalEvents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Visit</p>
              <p className="text-xl font-bold">{stats.lastVisit}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Follow-up</p>
              <p className="text-xl font-bold">{stats.nextFollowUp}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Event Type</label>
                    <Select value={filterEventType} onValueChange={setFilterEventType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Modality</label>
                    <Select value={filterModality} onValueChange={setFilterModality}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Modalities</SelectItem>
                        <SelectItem value="ALLOPATHY">Allopathy</SelectItem>
                        <SelectItem value="AYURVEDA">Ayurveda</SelectItem>
                        <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">From Date</label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">To Date</label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterEventType('ALL')
                      setFilterModality('ALL')
                      setFilterDateFrom('')
                      setFilterDateTo('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter badges */}
      {(filterEventType !== 'ALL' || filterModality !== 'ALL' || filterDateFrom || filterDateTo) && (
        <div className="flex flex-wrap gap-2">
          {filterEventType !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              {EVENT_TYPE_CONFIG[filterEventType as TimelineEventType]?.label ?? filterEventType}
              <button onClick={() => setFilterEventType('ALL')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {filterModality !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              {filterModality}
              <button onClick={() => setFilterModality('ALL')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {filterDateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {filterDateFrom}
              <button onClick={() => setFilterDateFrom('')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {filterDateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {filterDateTo}
              <button onClick={() => setFilterDateTo('')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Event Timeline</CardTitle>
          <CardDescription>{filteredEvents.length} events found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No events found</p>
              <p className="text-sm">Try adjusting the filters</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-0">
                  {filteredEvents.map((event, idx) => {
                    const typeCfg = EVENT_TYPE_CONFIG[event.eventType]
                    const modCfg = MODALITY_COLORS[event.modality]
                    const IconComp = typeCfg.icon
                    const isExpanded = expandedEvent === event.id

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        className="relative flex items-start gap-4 pb-6 last:pb-0"
                      >
                        {/* Dot + Icon */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={`
                              flex items-center justify-center rounded-full border-2
                              ${event.isSignificant ? 'h-10 w-10' : 'h-8 w-8'}
                              ${modCfg.dot}
                            `}
                          >
                            <IconComp
                              className={`${event.isSignificant ? 'h-5 w-5' : 'h-4 w-4'} text-white`}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 min-w-0 ${isExpanded ? '' : 'cursor-pointer'}`} onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                          <div className={`rounded-lg border p-3 ${modCfg.bg} transition-all hover:shadow-sm`}>
                            {/* Desktop: full layout */}
                            <div className="hidden sm:block">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-semibold text-sm ${event.isSignificant ? 'font-bold' : ''}`}>
                                      {event.title}
                                    </span>
                                    {event.isSignificant && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Significant</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {event.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <ModalityBadge modality={event.modality} />
                                  <Badge variant="outline" className="text-[10px]">
                                    {typeCfg.label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>{formatDate(event.timestamp)}</span>
                                <span>{formatTime(event.timestamp)}</span>
                                <span className="text-muted-foreground/60">{formatRelative(event.timestamp)}</span>
                              </div>
                            </div>

                            {/* Mobile: simplified layout */}
                            <div className="sm:hidden">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${event.isSignificant ? 'font-bold' : ''}`}>
                                  {event.title}
                                </span>
                                {event.isSignificant && (
                                  <Badge variant="destructive" className="text-[10px] px-1 py-0">!</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <ModalityBadge modality={event.modality} />
                                <span className="text-xs text-muted-foreground">{formatRelative(event.timestamp)}</span>
                              </div>
                            </div>

                            {/* Expandable detail */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <Separator className="my-2" />
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium text-muted-foreground">Event Data</p>
                                    <pre className="bg-background/50 rounded p-2 text-[11px] leading-relaxed overflow-x-auto max-h-48 overflow-y-auto">
                                      {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Expand indicator */}
                            <div className="flex items-center justify-center mt-1">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
