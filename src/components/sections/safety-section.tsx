'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Play, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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

export function SafetySection() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [alerts, setAlerts] = useState<SafetyAlertData[]>([])
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

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

  const redFlagCount = alerts.filter((a) => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL').length

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
      </div>

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
        </motion.div>
      )}

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

      {/* Safety Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Safety Alerts
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
            <div className="space-y-3">
              {alerts.map((alert) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
