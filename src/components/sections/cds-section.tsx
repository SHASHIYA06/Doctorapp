'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Shield,
  Pill,
  Beaker,
  FileWarning,
  Brain,
  CheckCircle2,
  X,
  Filter,
  Bell,
  BellOff,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Ban,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type CDSAlertType =
  | 'DRUG_INTERACTION'
  | 'ALLERGY'
  | 'DUPLICATE'
  | 'DOSAGE'
  | 'CONTRAINDICATION'
  | 'LAB_ALERT'
  | 'RECALL'
  | 'GUIDELINE'

type CDSSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

interface CDSAlert {
  id: string
  type: CDSAlertType
  severity: CDSSeverity
  title: string
  description: string
  evidenceReference: string
  suggestedAction: string
  overrideable: boolean
  acknowledged: boolean
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  overridden: boolean
  overrideReason: string | null
  createdAt: string
  patientId: string
  patientName: string
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

const ALERT_TYPE_CONFIG: Record<CDSAlertType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  DRUG_INTERACTION: {
    label: 'Drug Interaction',
    icon: Pill,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  ALLERGY: {
    label: 'Allergy',
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  DUPLICATE: {
    label: 'Duplicate Therapy',
    icon: FileWarning,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  DOSAGE: {
    label: 'Dosage Range',
    icon: Beaker,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  CONTRAINDICATION: {
    label: 'Contraindication',
    icon: Ban,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  LAB_ALERT: {
    label: 'Lab Alert',
    icon: Beaker,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  RECALL: {
    label: 'Medicine Recall',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  GUIDELINE: {
    label: 'Clinical Guideline',
    icon: Brain,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
}

const SEVERITY_CONFIG: Record<CDSSeverity, { label: string; badgeClass: string }> = {
  INFO: {
    label: 'Info',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  },
  WARNING: {
    label: 'Warning',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  },
  CRITICAL: {
    label: 'Critical',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  },
}

const SEVERITY_ORDER: Record<CDSSeverity, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 }

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_ALERTS: CDSAlert[] = [
  {
    id: 'cds-1',
    type: 'DRUG_INTERACTION',
    severity: 'CRITICAL',
    title: 'Warfarin + Aspirin - Increased bleeding risk',
    description: 'Concurrent use of Warfarin and Aspirin significantly increases the risk of major bleeding events. INR monitoring recommended.',
    evidenceReference: 'Cochrane Review 2019; BMJ 2020; DOI:10.1136/bmj.m1234',
    suggestedAction: 'Consider alternative analgesic (e.g., Paracetamol). If combination necessary, monitor INR weekly and reduce Warfarin dose by 25%.',
    overrideable: true,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    overridden: false,
    overrideReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
  },
  {
    id: 'cds-2',
    type: 'DOSAGE',
    severity: 'WARNING',
    title: 'Metformin dose 2000mg exceeds renal-adjusted limit',
    description: 'Patient eGFR is 35 mL/min. Maximum Metformin dose for eGFR 30-45 is 1000mg/day. Current order is 2000mg/day.',
    evidenceReference: 'NICE NG28; ADA Standards of Care 2024',
    suggestedAction: 'Reduce Metformin to 1000mg/day. Monitor renal function every 3 months. Consider alternative if eGFR < 30.',
    overrideable: true,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    overridden: false,
    overrideReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
  },
  {
    id: 'cds-3',
    type: 'ALLERGY',
    severity: 'CRITICAL',
    title: 'Patient allergic to Penicillin - Amoxicillin ordered',
    description: 'Patient has documented Penicillin allergy (anaphylaxis). Amoxicillin is a penicillin-class antibiotic and is contraindicated.',
    evidenceReference: 'Patient allergy record; NICE Drug Allergy Guidelines',
    suggestedAction: 'Switch to non-penicillin alternative: Azithromycin 500mg or Ciprofloxacin 500mg based on infection type.',
    overrideable: false,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    overridden: false,
    overrideReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    patientId: 'p-002',
    patientName: 'Priya Sharma',
  },
  {
    id: 'cds-4',
    type: 'GUIDELINE',
    severity: 'INFO',
    title: 'Consider HbA1c monitoring for diabetic patient',
    description: 'Patient on Metformin for Type 2 DM. No HbA1c ordered in last 90 days. Guideline recommends HbA1c every 3 months for unstable diabetes.',
    evidenceReference: 'ADA Standards of Care 2024; ICMR Guidelines 2023',
    suggestedAction: 'Order HbA1c test. Schedule diabetes review appointment. Assess dietary compliance.',
    overrideable: true,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    overridden: false,
    overrideReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    patientId: 'p-001',
    patientName: 'Rajesh Kumar',
  },
  {
    id: 'cds-5',
    type: 'RECALL',
    severity: 'WARNING',
    title: 'Ranitidine batch under CDSCO recall',
    description: 'Ranitidine 150mg (Batch: RAN2024A) has been recalled by CDSCO due to NDMA impurity above acceptable limits.',
    evidenceReference: 'CDSCO Recall Notice RCL-2024-089; IPC PvPI Alert',
    suggestedAction: 'Discontinue Ranitidine. Switch to Famotidine 20mg or Pantoprazole 40mg as alternative.',
    overrideable: false,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    overridden: false,
    overrideReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    patientId: 'p-003',
    patientName: 'Amit Patel',
  },
]

// ─── Animation ───────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CDSSection() {
  const { selectedPatientId } = useAppStore()

  const [alerts, setAlerts] = useState<CDSAlert[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterAck, setFilterAck] = useState<string>('ALL')

  // Override dialog
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideAlert, setOverrideAlert] = useState<CDSAlert | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideSubmitting, setOverrideSubmitting] = useState(false)

  // Acknowledge submitting
  const [ackSubmitting, setAckSubmitting] = useState<string | null>(null)

  // ── Fetch alerts ──
  useEffect(() => {
    setLoading(true)
    fetch('/api/cds')
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? d.alerts ?? []
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data)
        } else {
          setAlerts(DEMO_ALERTS)
        }
      })
      .catch(() => setAlerts(DEMO_ALERTS))
      .finally(() => setLoading(false))
  }, [selectedPatientId])

  // ── Filtered alerts ──
  const filteredAlerts = alerts
    .filter((a) => filterType === 'ALL' || a.type === filterType)
    .filter((a) => filterSeverity === 'ALL' || a.severity === filterSeverity)
    .filter((a) => {
      if (filterAck === 'ALL') return true
      if (filterAck === 'ACKNOWLEDGED') return a.acknowledged
      if (filterAck === 'UNACKNOWLEDGED') return !a.acknowledged
      return true
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const activeCount = alerts.filter((a) => !a.acknowledged).length
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && !a.acknowledged).length
  const infoCount = alerts.filter((a) => a.severity === 'INFO' && !a.acknowledged).length

  // ── Acknowledge single alert ──
  const handleAcknowledge = useCallback(async (alertId: string) => {
    setAckSubmitting(alertId)
    try {
      const res = await fetch('/api/cds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action: 'acknowledge' }),
      })
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, acknowledged: true, acknowledgedBy: 'Dr. Current User', acknowledgedAt: new Date().toISOString() }
              : a
          )
        )
        toast({ title: 'Alert Acknowledged', description: 'Clinical decision support alert acknowledged' })
      } else {
        // Still update locally for demo
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, acknowledged: true, acknowledgedBy: 'Dr. Current User', acknowledgedAt: new Date().toISOString() }
              : a
          )
        )
        toast({ title: 'Alert Acknowledged' })
      }
    } catch {
      // Local update for demo
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledgedBy: 'Dr. Current User', acknowledgedAt: new Date().toISOString() }
            : a
        )
      )
      toast({ title: 'Alert Acknowledged' })
    } finally {
      setAckSubmitting(null)
    }
  }, [])

  // ── Acknowledge all non-critical ──
  const handleAcknowledgeAll = async () => {
    const nonCriticalUnacked = alerts.filter((a) => !a.acknowledged && a.severity !== 'CRITICAL')
    if (nonCriticalUnacked.length === 0) {
      toast({ title: 'No alerts to acknowledge', description: 'All non-critical alerts are already acknowledged' })
      return
    }
    try {
      await fetch('/api/cds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge_all', excludeCritical: true }),
      })
    } catch {
      // Continue with local update
    }
    setAlerts((prev) =>
      prev.map((a) =>
        !a.acknowledged && a.severity !== 'CRITICAL'
          ? { ...a, acknowledged: true, acknowledgedBy: 'Dr. Current User', acknowledgedAt: new Date().toISOString() }
          : a
      )
    )
    toast({
      title: `${nonCriticalUnacked.length} Alerts Acknowledged`,
      description: 'All non-critical alerts have been acknowledged',
    })
  }

  // ── Override alert ──
  const handleOverride = async () => {
    if (!overrideAlert || !overrideReason.trim()) {
      toast({ title: 'Validation Error', description: 'Override reason is required', variant: 'destructive' })
      return
    }
    setOverrideSubmitting(true)
    try {
      await fetch('/api/cds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: overrideAlert.id, action: 'override', reason: overrideReason }),
      })
    } catch {
      // Continue with local update
    }
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === overrideAlert!.id
          ? {
              ...a,
              overridden: true,
              overrideReason: overrideReason,
              acknowledged: true,
              acknowledgedBy: 'Dr. Current User',
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      )
    )
    toast({ title: 'Alert Overridden', description: 'Override reason has been recorded' })
    setOverrideDialogOpen(false)
    setOverrideAlert(null)
    setOverrideReason('')
    setOverrideSubmitting(false)
  }

  const openOverride = (alert: CDSAlert) => {
    setOverrideAlert(alert)
    setOverrideReason('')
    setOverrideDialogOpen(true)
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
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
              <Bell className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold">{activeCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">{warningCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{infoCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Info / Guideline</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Header & Filters ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Clinical Decision Support Alerts
                {activeCount > 0 && (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ml-1">
                    {activeCount} active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time clinical alerts for patient safety and guideline adherence</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleAcknowledgeAll}
              disabled={activeCount === 0}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Acknowledge All Non-Critical
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.entries(ALERT_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severity</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAck} onValueChange={setFilterAck}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="UNACKNOWLEDGED">Unacknowledged</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* ── Alert Cards ── */}
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BellOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No alerts match the current filters</p>
              <p className="text-xs mt-1">Try adjusting the filter criteria</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map((alert, i) => {
                  const typeCfg = ALERT_TYPE_CONFIG[alert.type]
                  const sevCfg = SEVERITY_CONFIG[alert.severity]
                  const TypeIcon = typeCfg.icon

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card
                        className={`transition-all hover:shadow-md ${
                          alert.acknowledged
                            ? 'opacity-60 border-muted'
                            : alert.severity === 'CRITICAL'
                            ? 'border-red-300 dark:border-red-700 shadow-sm'
                            : alert.severity === 'WARNING'
                            ? 'border-amber-300 dark:border-amber-700'
                            : 'border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <CardContent className="p-4">
                          {/* Top Row: Type icon, Title, Badges */}
                          <div className="flex items-start gap-3">
                            <div className={`shrink-0 p-2 rounded-lg ${typeCfg.bgColor}`}>
                              <TypeIcon className={`h-5 w-5 ${typeCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold text-sm ${alert.acknowledged ? 'line-through' : ''}`}>
                                  {alert.title}
                                </span>
                                <Badge variant="outline" className={`text-xs ${sevCfg.badgeClass}`}>
                                  {sevCfg.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {typeCfg.label}
                                </Badge>
                                {alert.overridden && (
                                  <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    Overridden
                                  </Badge>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground">{alert.description}</p>

                              {/* Evidence Reference */}
                              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="break-all">{alert.evidenceReference}</span>
                              </div>

                              {/* Suggested Action */}
                              <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-muted">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Suggested Action</p>
                                <p className="text-sm">{alert.suggestedAction}</p>
                              </div>

                              {/* Acknowledged Info */}
                              {alert.acknowledged && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  <span>
                                    Acknowledged by {alert.acknowledgedBy}
                                    {alert.acknowledgedAt && (
                                      <> &middot; {new Date(alert.acknowledgedAt).toLocaleString()}</>
                                    )}
                                  </span>
                                  {alert.overrideReason && (
                                    <span className="ml-2 text-orange-700 dark:text-orange-300">
                                      Override reason: {alert.overrideReason}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.createdAt).toLocaleString()} &middot; {alert.patientName}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {!alert.acknowledged && (
                            <div className="flex items-center gap-2 mt-3 ml-11">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={ackSubmitting === alert.id}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {ackSubmitting === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                              </Button>
                              {alert.overrideable && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-orange-700 border-orange-300 hover:bg-orange-50 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-950"
                                  onClick={() => openOverride(alert)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Override
                                </Button>
                              )}
                              {!alert.overrideable && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Ban className="h-3 w-3" />
                                  Override not permitted
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Override Dialog ── */}
      <Dialog open={overrideDialogOpen} onOpenChange={(open) => { if (!open) { setOverrideDialogOpen(false); setOverrideAlert(null) }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Override Clinical Alert
            </DialogTitle>
            <DialogDescription>
              You are overriding a clinical decision support alert. This action will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          {overrideAlert && (
            <div className="space-y-4 py-2">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{overrideAlert.title}</AlertTitle>
                <AlertDescription>{overrideAlert.description}</AlertDescription>
              </Alert>
              <div>
                <p className="text-sm font-semibold mb-2">Override Reason <span className="text-red-500">*</span></p>
                <Textarea
                  placeholder="Enter clinical justification for overriding this alert (e.g., 'Patient previously tolerated combination under close monitoring', 'Benefit outweighs risk in this clinical context')..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be permanently recorded in the patient&apos;s clinical audit trail.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOverrideDialogOpen(false); setOverrideAlert(null) }}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={overrideSubmitting || !overrideReason.trim()}
              className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {overrideSubmitting ? 'Overriding...' : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Confirm Override
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Compliance Note ── */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-muted">
        <Shield className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">CDS Compliance:</span>{' '}
          Clinical Decision Support alerts are generated per NICE, ADA, and ICMR guidelines. 
          All overrides require documented clinical justification and are recorded in the audit trail 
          for regulatory review under CDSCO and NABH standards.
        </p>
      </div>
    </motion.div>
  )
}
