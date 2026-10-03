'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Clock,
  MessageSquare,
  Star,
  Monitor,
  FileText,
  Plus,
  Eye,
  Circle,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import type { Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────

type SessionStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

interface Practitioner {
  id: string
  name: string
  specialty: string
  modality: Modality
}

interface Session {
  id: string
  patientId: string
  patientName: string
  practitionerId: string
  practitionerName: string
  modality: Modality
  status: SessionStatus
  scheduledAt: string
  startedAt: string | null
  endedAt: string | null
  durationMinutes: number | null
  rating: number | null
  feedback: string | null
  isRecording: boolean
  notes: string
  prescriptionId: string | null
  followUpScheduled: boolean
  createdAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Style Maps ───────────────────────────────────────────────────────

const statusStyles: Record<SessionStatus, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  WAITING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COMPLETED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusDotColor: Record<SessionStatus, string> = {
  SCHEDULED: 'bg-slate-400',
  WAITING: 'bg-amber-500 animate-pulse',
  IN_PROGRESS: 'bg-green-500 animate-pulse',
  COMPLETED: 'bg-teal-500',
  CANCELLED: 'bg-red-500',
  FAILED: 'bg-red-500',
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const MODALITIES: Modality[] = ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY']

// ─── Component ────────────────────────────────────────────────────────

export function TelemedicineSection() {
  const { activeModality, setActiveModality } = useAppStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  // Modality tab
  const [modalityTab, setModalityTab] = useState<Modality>(activeModality)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formPractitionerId, setFormPractitionerId] = useState('')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Session detail / consultation dialog
  const [detailSession, setDetailSession] = useState<Session | null>(null)

  // Consultation state (simulated)
  const [inCall, setInCall] = useState(false)
  const [callElapsed, setCallElapsed] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [chatNotes, setChatNotes] = useState('')
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Post-consultation
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')

  // ─── Data Loading ─────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.patients ?? []
        setPatients(list)
        if (list.length > 0) setFormPatientId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/telemedicine?practitioners=true')
      .then((r) => r.json())
      .then((d) => {
        setPractitioners(d.practitioners ?? [])
      })
      .catch(() => {})
  }, [])

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('modality', modalityTab)
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      const res = await fetch(`/api/telemedicine?${params.toString()}`)
      const data = await res.json()
      setSessions(data.data ?? data.sessions ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load sessions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [modalityTab, filterStatus])

  useEffect(() => { loadSessions() }, [loadSessions])

  // ─── Call Timer ───────────────────────────────────────────────────

  useEffect(() => {
    if (inCall) {
      callTimerRef.current = setInterval(() => {
        setCallElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
  }, [inCall])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = {
    total: sessions.length,
    today: sessions.filter((s) => {
      const d = new Date(s.scheduledAt)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length,
    inProgress: sessions.filter((s) => s.status === 'IN_PROGRESS').length,
    avgRating: sessions.filter((s) => s.rating !== null).length > 0
      ? (sessions.filter((s) => s.rating !== null).reduce((a, s) => a + (s.rating ?? 0), 0) /
          sessions.filter((s) => s.rating !== null).length).toFixed(1)
      : '—',
  }

  // ─── Actions ──────────────────────────────────────────────────────

  const handleSchedule = async () => {
    if (!formPatientId || !formPractitionerId || !formScheduledAt) {
      toast({ title: 'Validation', description: 'Fill all required fields', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/telemedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          practitionerId: formPractitionerId,
          modality: modalityTab,
          scheduledAt: formScheduledAt,
          notes: formNotes,
        }),
      })
      if (res.ok) {
        toast({ title: 'Session Scheduled', description: 'Telemedicine session created' })
        setScheduleOpen(false)
        setFormNotes('')
        setFormScheduledAt('')
        loadSessions()
      } else {
        toast({ title: 'Error', description: 'Failed to schedule session', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinCall = (session: Session) => {
    setDetailSession(session)
    setInCall(true)
    setCallElapsed(0)
    setMicOn(true)
    setCamOn(true)
    setChatNotes('')
    setShowFeedback(false)
    toast({ title: 'Joined Call', description: `Connected with ${session.patientName}` })
  }

  const handleEndCall = async () => {
    setInCall(false)
    // Update session to completed
    if (detailSession) {
      try {
        await fetch('/api/telemedicine', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: detailSession.id, status: 'COMPLETED', durationMinutes: Math.round(callElapsed / 60) }),
        })
      } catch { /* silent */ }
    }
    setShowFeedback(true)
    toast({ title: 'Call Ended', description: `Duration: ${formatTime(callElapsed)}` })
  }

  const handleSubmitFeedback = async () => {
    if (detailSession) {
      try {
        await fetch('/api/telemedicine', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: detailSession.id, rating, feedback: feedbackText }),
        })
        toast({ title: 'Feedback Submitted' })
      } catch { /* silent */ }
    }
    setShowFeedback(false)
    setDetailSession(null)
    setRating(0)
    setFeedbackText('')
    loadSessions()
  }

  const handleCancelSession = async (id: string) => {
    try {
      const res = await fetch('/api/telemedicine', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CANCELLED' }),
      })
      if (res.ok) {
        toast({ title: 'Session Cancelled' })
        loadSessions()
        setDetailSession(null)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel', variant: 'destructive' })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: stats.total, icon: Monitor, color: 'text-slate-600 dark:text-slate-400' },
          { label: 'Today', value: stats.today, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Video, color: 'text-green-600 dark:text-green-400' },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'text-yellow-600 dark:text-yellow-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modality Tabs + Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs
          value={modalityTab}
          onValueChange={(v) => { setModalityTab(v as Modality); setActiveModality(v as Modality) }}
        >
          <TabsList>
            <TabsTrigger value="ALLOPATHY">Allopathy</TabsTrigger>
            <TabsTrigger value="AYURVEDA">Ayurveda</TabsTrigger>
            <TabsTrigger value="HOMEOPATHY">Homeopathy</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="WAITING">Waiting</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="sm:ml-auto">
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Schedule Telemedicine Session
                </DialogTitle>
                <DialogDescription>
                  For <ModalityBadge modality={modalityTab} /> modality
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={formPatientId} onValueChange={setFormPatientId}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Practitioner</Label>
                  <Select value={formPractitionerId} onValueChange={setFormPractitionerId}>
                    <SelectTrigger><SelectValue placeholder="Select practitioner" /></SelectTrigger>
                    <SelectContent>
                      {practitioners
                        .filter((p) => p.modality === modalityTab)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {p.specialty}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scheduled Time</Label>
                  <Input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Reason for consultation..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                <Button onClick={handleSchedule} disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Session List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sessions
            <ModalityBadge modality={modalityTab} className="ml-1" />
          </CardTitle>
          <CardDescription>Telemedicine sessions and remote consultations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Status dot */}
                  <div className="shrink-0">
                    <Circle className={`h-3 w-3 fill-current ${statusDotColor[session.status]}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{session.patientName} ↔ {session.practitionerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.scheduledAt).toLocaleString()}
                      {session.durationMinutes && ` • ${session.durationMinutes} min`}
                      {session.isRecording && ' • 🔴 Recording'}
                    </p>
                  </div>

                  {/* Badges */}
                  <Badge variant="outline" className={statusStyles[session.status]}>
                    {session.status.replace('_', ' ')}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDetailSession(session); setShowFeedback(false); setInCall(false) }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {(session.status === 'SCHEDULED' || session.status === 'WAITING') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs text-green-700 dark:text-green-400"
                        onClick={() => handleJoinCall(session)}
                      >
                        <Video className="h-3 w-3" /> Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No sessions found for this modality
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Consultation Dialog */}
      <Dialog
        open={!!detailSession || inCall || showFeedback}
        onOpenChange={(open) => {
          if (!open) {
            if (inCall) {
              setInCall(false)
            } else {
              setDetailSession(null)
              setShowFeedback(false)
              setInCall(false)
            }
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailSession && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {inCall ? <Video className="h-5 w-5 text-green-600" /> : <Monitor className="h-5 w-5" />}
                  {inCall ? 'Live Consultation' : 'Session Detail'}
                </DialogTitle>
                <DialogDescription>
                  {detailSession.patientName} ↔ {detailSession.practitionerName}
                  <ModalityBadge modality={detailSession.modality} className="ml-2" />
                </DialogDescription>
              </DialogHeader>

              {inCall ? (
                /* ─── Video Call UI ─── */
                <div className="grid gap-4 py-4">
                  {/* Video area */}
                  <div className="relative bg-slate-900 rounded-xl aspect-video flex items-center justify-center overflow-hidden">
                    {camOn ? (
                      <div className="text-center text-slate-400">
                        <Video className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-sm">Camera active</p>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500">
                        <VideoOff className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-sm">Camera off</p>
                      </div>
                    )}
                    {/* Timer */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                      {formatTime(callElapsed)}
                    </div>
                    {/* Recording indicator */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      🔴 REC
                    </div>
                    {/* Modality badge */}
                    <div className="absolute bottom-3 left-3">
                      <ModalityBadge modality={detailSession.modality} />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="lg"
                      variant={micOn ? 'outline' : 'destructive'}
                      className="rounded-full h-12 w-12 p-0"
                      onClick={() => setMicOn(!micOn)}
                    >
                      {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                      size="lg"
                      variant={camOn ? 'outline' : 'destructive'}
                      className="rounded-full h-12 w-12 p-0"
                      onClick={() => setCamOn(!camOn)}
                    >
                      {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="rounded-full h-12 w-12 p-0"
                      onClick={handleEndCall}
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Chat/Notes area */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm">
                      <MessageSquare className="h-4 w-4" /> Consultation Notes
                    </Label>
                    <Textarea
                      value={chatNotes}
                      onChange={(e) => setChatNotes(e.target.value)}
                      placeholder="Type notes during consultation..."
                      rows={4}
                    />
                  </div>
                </div>
              ) : showFeedback ? (
                /* ─── Post-Consultation Feedback ─── */
                <div className="grid gap-4 py-4">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-1">Consultation Complete</p>
                    <p className="text-sm text-muted-foreground">Duration: {formatTime(callElapsed)}</p>
                  </div>

                  <Separator />

                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Rate this consultation</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="sm"
                          className={`h-10 w-10 p-0 ${rating >= star ? 'text-yellow-500' : 'text-muted-foreground'}`}
                          onClick={() => setRating(star)}
                        >
                          <Star className={`h-6 w-6 ${rating >= star ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback text */}
                  <div className="space-y-2">
                    <Label>Feedback (optional)</Label>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Post-consultation actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => toast({ title: 'Prescription Created', description: 'New prescription drafted' })}>
                      <FileText className="h-4 w-4" /> Create Prescription
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => toast({ title: 'Follow-up Scheduled', description: 'Follow-up appointment created' })}>
                      <Clock className="h-4 w-4" /> Schedule Follow-up
                    </Button>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowFeedback(false); setDetailSession(null); loadSessions() }}>Skip</Button>
                    <Button onClick={handleSubmitFeedback} disabled={rating === 0}>Submit Feedback</Button>
                  </DialogFooter>
                </div>
              ) : (
                /* ─── Session Detail View ─── */
                <div className="grid gap-3 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <div className="mt-1">
                        <Badge variant="outline" className={statusStyles[detailSession.status]}>
                          {detailSession.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modality</span>
                      <div className="mt-1">
                        <ModalityBadge modality={detailSession.modality} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-muted-foreground">Patient</span>
                    <p className="font-medium mt-0.5">{detailSession.patientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Practitioner</span>
                    <p className="font-medium mt-0.5">{detailSession.practitionerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Scheduled</span>
                      <p className="mt-0.5">{new Date(detailSession.scheduledAt).toLocaleString()}</p>
                    </div>
                    {detailSession.durationMinutes && (
                      <div>
                        <span className="text-muted-foreground">Duration</span>
                        <p className="mt-0.5">{detailSession.durationMinutes} min</p>
                      </div>
                    )}
                  </div>

                  {detailSession.isRecording && (
                    <div className="flex items-center gap-2 text-red-600">
                      <Circle className="h-3 w-3 fill-current" />
                      <span className="text-xs font-medium">Session was recorded</span>
                    </div>
                  )}

                  {detailSession.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes</span>
                      <p className="mt-0.5">{detailSession.notes}</p>
                    </div>
                  )}

                  {detailSession.rating !== null && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground">Rating</span>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${(detailSession.rating ?? 0) >= star ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">{detailSession.rating}/5</span>
                        </div>
                      </div>
                      {detailSession.feedback && (
                        <div>
                          <span className="text-muted-foreground">Feedback</span>
                          <p className="mt-0.5">{detailSession.feedback}</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Prescription</span>
                      <p className="mt-0.5">{detailSession.prescriptionId ? '✓ Created' : '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Follow-up</span>
                      <p className="mt-0.5">{detailSession.followUpScheduled ? '✓ Scheduled' : '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail view footer actions */}
              {!inCall && !showFeedback && detailSession && (
                <DialogFooter>
                  {(detailSession.status === 'SCHEDULED' || detailSession.status === 'WAITING') && (
                    <Button className="gap-1" onClick={() => handleJoinCall(detailSession)}>
                      <Video className="h-4 w-4" /> Join Call
                    </Button>
                  )}
                  {detailSession.status === 'SCHEDULED' && (
                    <Button variant="outline" className="gap-1 text-red-600" onClick={() => handleCancelSession(detailSession.id)}>
                      <PhoneOff className="h-4 w-4" /> Cancel
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setDetailSession(null)}>Close</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
