'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Play,
  ShieldAlert,
  Siren,
  FileWarning,
  BarChart3,
  Send,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  UserX,
  Pill,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { PriorityBadge } from '@/components/clinical/priority-badge'
import { SafetyAlertCard } from '@/components/clinical/safety-alert-card'
import { toast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface SafetyAlertData {
  id: string
  patientId: string
  type: string
  severity: string
  message: string
  source: string
  status: string
  createdAt: string
}

interface TriageResult {
  priority: string
  reasoning: string
  ruleIds?: string[]
}

interface RecallAlert {
  id: string
  medicineName: string
  manufacturer: string
  reason: string
  severity: string
  date: string
  status: string
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const triageColors: Record<string, string> = {
  EMERGENCY: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
  URGENT: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-200',
  ROUTINE: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EMERGENCY: { label: 'Emergency', color: 'text-red-600 dark:text-red-400', icon: Siren },
  CRITICAL: { label: 'Critical', color: 'text-red-600 dark:text-red-400', icon: ShieldAlert },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-400', icon: AlertTriangle },
  MODERATE: { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400', icon: FileWarning },
  LOW: { label: 'Low', color: 'text-green-600 dark:text-green-400', icon: CheckCircle },
}

export function SafetySection() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [alerts, setAlerts] = useState<SafetyAlertData[]>([])
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // Recall alerts
  const [recalls, setRecalls] = useState<RecallAlert[]>([])
  const [recallsLoading, setRecallsLoading] = useState(true)

  // Adverse event form
  const [showAdverseForm, setShowAdverseForm] = useState(false)
  const [adverseMedicine, setAdverseMedicine] = useState('')
  const [adverseReaction, setAdverseReaction] = useState('')
  const [adverseSeverity, setAdverseSeverity] = useState('')
  const [adverseSubmitting, setAdverseSubmitting] = useState(false)

  // Safety stats
  const safetyStats = {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL').length,
    acknowledgedCount: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
    pendingCount: alerts.filter((a) => a.status !== 'ACKNOWLEDGED').length,
    activeRecalls: recalls.length,
    recallCritical: recalls.filter((r) => r.severity === 'CRITICAL').length,
  }

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.patients ?? []
        setPatients(list)
        if (list.length > 0) setSelectedPatientId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedPatientId) return
    setLoading(true)
    fetch(`/api/safety?patientId=${selectedPatientId}`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.data ?? d.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedPatientId])

  // Fetch recalls
  useEffect(() => {
    setRecallsLoading(true)
    fetch('/api/recalls?status=ACTIVE&limit=5')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.recalls ?? []
        setRecalls(list)
      })
      .catch(() => setRecalls([]))
      .finally(() => setRecallsLoading(false))
  }, [])

  const handleRunSafetyCheck = async () => {
    if (!selectedPatientId) return
    setRunning(true)
    try {
      const res = await fetch('/api/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      })
      const data = await res.json()
      const newAlerts = data.data ?? data.alerts ?? alerts
      setAlerts(newAlerts)

      // Also run triage
      const triageRes = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId }),
      })
      const triageData = await triageRes.json()
      const assessment = triageData.data ?? triageData.assessment
      if (assessment) {
        setTriageResult({
          priority: assessment.priority,
          reasoning: assessment.reasoning ?? '',
        })
      }

      toast({ title: 'Safety Check Complete', description: `${newAlerts.length} alerts found` })
    } catch {
      toast({ title: 'Error', description: 'Failed to run safety check', variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await fetch('/api/safety', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status: 'ACKNOWLEDGED' }),
      })
      setAlerts(alerts.map((a) => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      toast({ title: 'Alert Acknowledged' })
    } catch {
      toast({ title: 'Error', description: 'Failed to acknowledge', variant: 'destructive' })
    }
  }

  const handleAdverseEventSubmit = async () => {
    if (!adverseMedicine || !adverseReaction || !adverseSeverity) {
      toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    setAdverseSubmitting(true)
    try {
      await fetch('/api/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          type: 'ADVERSE_EVENT',
          severity: adverseSeverity,
          message: `Adverse event: ${adverseReaction} with ${adverseMedicine}`,
        }),
      })
      toast({ title: 'Adverse Event Reported', description: 'The adverse event has been logged for review' })
      setShowAdverseForm(false)
      setAdverseMedicine('')
      setAdverseReaction('')
      setAdverseSeverity('')
      // Refresh alerts
      if (selectedPatientId) {
        const res = await fetch(`/api/safety?patientId=${selectedPatientId}`)
        const d = await res.json()
        setAlerts(d.data ?? d.alerts ?? alerts)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to report adverse event', variant: 'destructive' })
    } finally {
      setAdverseSubmitting(false)
    }
  }

  const redFlagCount = alerts.filter((a) => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL').length

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* ── Safety Stats Dashboard ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Activity className={`h-4 w-4 ${safetyStats.totalAlerts > 0 ? 'text-amber-600' : 'text-green-600'}`} />
              <span className="text-2xl font-bold">{safetyStats.totalAlerts}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Siren className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{safetyStats.criticalCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Critical Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{safetyStats.acknowledgedCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileWarning className={`h-4 w-4 ${safetyStats.activeRecalls > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`text-2xl font-bold ${safetyStats.activeRecalls > 0 ? 'text-red-600' : 'text-green-600'}`}>{safetyStats.activeRecalls}</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Recalls</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label>Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select patient..." /></SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleRunSafetyCheck} disabled={running || !selectedPatientId} className="gap-2 mt-auto">
          <Play className="h-4 w-4" />
          {running ? 'Running...' : 'Run Safety Check'}
        </Button>
        <Button
          variant="outline"
          className="gap-2 mt-auto"
          onClick={() => setShowAdverseForm(!showAdverseForm)}
        >
          <FileWarning className="h-4 w-4" />
          Report Adverse Event
        </Button>
      </div>

      {/* ── Adverse Event Report Form ── */}
      <AnimatePresence>
        {showAdverseForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-amber-600" />
                  Report Adverse Event
                </CardTitle>
                <CardDescription>
                  Log a suspected adverse drug reaction for CDSCO PvPI reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Medicine Name</Label>
                    <Input
                      placeholder="e.g. Metformin 500mg"
                      value={adverseMedicine}
                      onChange={(e) => setAdverseMedicine(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reaction Description</Label>
                    <Input
                      placeholder="e.g. Severe skin rash, nausea"
                      value={adverseReaction}
                      onChange={(e) => setAdverseReaction(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={adverseSeverity} onValueChange={setAdverseSeverity}>
                      <SelectTrigger><SelectValue placeholder="Select severity..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Mild</SelectItem>
                        <SelectItem value="MODERATE">Moderate</SelectItem>
                        <SelectItem value="HIGH">Severe</SelectItem>
                        <SelectItem value="CRITICAL">Life-threatening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAdverseEventSubmit}
                    disabled={adverseSubmitting}
                    className="gap-2"
                  >
                    {adverseSubmitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Report</>}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAdverseForm(false)}>Cancel</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reports are submitted to the Pharmacovigilance Programme of India (PvPI) as per CDSCO guidelines.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Flag Indicator */}
      {redFlagCount > 0 && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-100 border border-red-300 dark:bg-red-950 dark:border-red-700"
        >
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-semibold text-red-800 dark:text-red-200">
            {redFlagCount} Red Flag{redFlagCount !== 1 ? 's' : ''} Detected
          </span>
          <span className="text-xs text-red-700 dark:text-red-300 ml-2">
            — Requires immediate clinical attention
          </span>
        </motion.div>
      )}

      {/* ── CDSCO Recall Alerts ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-red-600" />
            CDSCO Recall Monitor
          </CardTitle>
          <CardDescription>
            Active medicine recalls from Central Drugs Standard Control Organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recallsLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : recalls.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4" />
              No active CDSCO recalls at this time
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recalls.map((recall) => {
                const sevCfg = SEVERITY_CONFIG[recall.severity] ?? SEVERITY_CONFIG.MODERATE
                const SevIcon = sevCfg.icon
                return (
                  <motion.div
                    key={recall.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                  >
                    <SevIcon className={`h-5 w-5 mt-0.5 shrink-0 ${sevCfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-red-800 dark:text-red-200">{recall.medicineName}</span>
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                          {recall.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recall.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {recall.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Manufacturer: {recall.manufacturer}</span>
                        <span>·</span>
                        <span>{new Date(recall.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage Result */}
      {triageResult && (
        <Card className={`border-2 ${triageColors[triageResult.priority] ?? ''}`}>
          <CardHeader>
            <CardTitle className="text-base">Triage Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <PriorityBadge priority={triageResult.priority} />
              <span className="font-semibold">{triageResult.priority} Priority</span>
            </div>
            {triageResult.reasoning && (
              <p className="text-sm text-muted-foreground">{triageResult.reasoning}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety Alerts Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Safety Alerts Feed
          </CardTitle>
          <CardDescription>{alerts.length} alert(s) for selected patient</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No safety alerts. Run a safety check to evaluate.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => {
                const sevCfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.MODERATE
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <SafetyAlertCard
                      id={alert.id}
                      type={alert.type}
                      severity={alert.severity}
                      message={alert.message}
                      source={alert.source}
                      status={alert.status}
                      createdAt={alert.createdAt}
                      onAcknowledge={handleAcknowledge}
                    />
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Safety Compliance Note ── */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-muted">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">CDSCO Compliance:</span>{' '}
          Safety monitoring conforms to the Pharmacovigilance Programme of India (PvPI) guidelines.
          Adverse events are processed through the National Co-ordination Centre (NCC) at IPC Ghaziabad.
        </p>
      </div>
    </motion.div>
  )
}
