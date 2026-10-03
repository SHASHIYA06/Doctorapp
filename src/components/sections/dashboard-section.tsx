'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Heart,
  Pill,
  AlertTriangle,
  Clock,
  GitCompare,
  RotateCcw,
  ClipboardList,
  UserPlus,
  Stethoscope,
  Search,
  ShieldCheck,
  Activity,
  Brain,
  Leaf,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Zap,
  Mic,
  ScanLine,
  FileWarning,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  OctagonAlert,
  Info,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import { useAppStore, type Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'

// ─── Types ─────────────────────────────────────────────────────────

interface DashboardStats {
  totalPatients: number
  healthIssues: number
  totalMedicines: number
  safetyAlerts: number
  pendingReviews: number
  drugInteractions: number
  activeRecalls: number
  carePlansToday: number
}

interface ModalityCount {
  ALLOPATHY: number
  AYURVEDA: number
  HOMEOPATHY: number
}

interface SafetyAlert {
  id: string
  patientName: string
  type: string
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  message: string
  createdAt: string
  acknowledged: boolean
}

interface RecallEntry {
  id: string
  medicineName: string
  manufacturer: string
  reason: string
  recallDate: string
  batchNumbers: string[]
  status: 'ACTIVE' | 'RESOLVED'
}

interface BodySystemData {
  name: string
  count: number
  color: string
}

interface EncounterData {
  month: string
  allopathy: number
  ayurveda: number
  homeopathy: number
}

// ─── Realistic Mock Data ───────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalPatients: 2847,
  healthIssues: 423,
  totalMedicines: 1856,
  safetyAlerts: 7,
  pendingReviews: 14,
  drugInteractions: 3,
  activeRecalls: 2,
  carePlansToday: 38,
}

const MOCK_MODALITY_COUNTS: ModalityCount = {
  ALLOPATHY: 1849,
  AYURVEDA: 687,
  HOMEOPATHY: 320,
}

const MOCK_HEALTH_MODALITY: ModalityCount = {
  ALLOPATHY: 298,
  AYURVEDA: 89,
  HOMEOPATHY: 36,
}

const MOCK_MEDICINE_MODALITY: ModalityCount = {
  ALLOPATHY: 1247,
  AYURVEDA: 412,
  HOMEOPATHY: 197,
}

const MOCK_ALERTS_SEVERITY = { CRITICAL: 2, HIGH: 3, MODERATE: 1, LOW: 1 }

const MOCK_ENCOUNTER_DATA: EncounterData[] = [
  { month: 'Apr', allopathy: 142, ayurveda: 58, homeopathy: 23 },
  { month: 'May', allopathy: 168, ayurveda: 72, homeopathy: 31 },
  { month: 'Jun', allopathy: 155, ayurveda: 65, homeopathy: 28 },
  { month: 'Jul', allopathy: 189, ayurveda: 81, homeopathy: 35 },
  { month: 'Aug', allopathy: 174, ayurveda: 74, homeopathy: 30 },
  { month: 'Sep', allopathy: 196, ayurveda: 88, homeopathy: 39 },
]

const MOCK_BODY_SYSTEMS: BodySystemData[] = [
  { name: 'Cardiovascular', count: 87, color: '#ef4444' },
  { name: 'Respiratory', count: 72, color: '#f97316' },
  { name: 'Musculoskeletal', count: 65, color: '#eab308' },
  { name: 'Digestive', count: 58, color: '#22c55e' },
  { name: 'Neurological', count: 51, color: '#06b6d4' },
  { name: 'Endocrine', count: 43, color: '#8b5cf6' },
  { name: 'Dermatological', count: 28, color: '#ec4899' },
  { name: 'Renal', count: 19, color: '#64748b' },
]

const MOCK_SAFETY_ALERTS: SafetyAlert[] = [
  {
    id: 'sa-1',
    patientName: 'Aarav Sharma',
    type: 'Drug Interaction',
    severity: 'CRITICAL',
    message: 'Warfarin + Aspirin combination — elevated bleeding risk detected',
    createdAt: '2026-10-02T09:14:00Z',
    acknowledged: false,
  },
  {
    id: 'sa-2',
    patientName: 'Priya Nair',
    type: 'Allergy Alert',
    severity: 'CRITICAL',
    message: 'Penicillin allergy documented — Ciprofloxacin prescribed from same class',
    createdAt: '2026-10-02T08:52:00Z',
    acknowledged: false,
  },
  {
    id: 'sa-3',
    patientName: 'Vikram Patel',
    type: 'Red Flag',
    severity: 'HIGH',
    message: 'Chest pain + shortness of breath — immediate cardiac evaluation required',
    createdAt: '2026-10-02T08:30:00Z',
    acknowledged: false,
  },
  {
    id: 'sa-4',
    patientName: 'Ananya Iyer',
    type: 'Drug Interaction',
    severity: 'HIGH',
    message: 'Metformin contraindicated with eGFR < 30 — renal function declining',
    createdAt: '2026-10-02T07:45:00Z',
    acknowledged: false,
  },
  {
    id: 'sa-5',
    patientName: 'Rohan Deshmukh',
    type: 'Dose Alert',
    severity: 'MODERATE',
    message: 'Atorvastatin 80mg exceeds recommended starting dose for South Asian patients',
    createdAt: '2026-10-02T07:12:00Z',
    acknowledged: true,
  },
  {
    id: 'sa-6',
    patientName: 'Kavitha Reddy',
    type: 'Allergy Alert',
    severity: 'HIGH',
    message: 'Sulfonamide allergy — Furosemide contains sulfa moiety',
    createdAt: '2026-10-02T06:58:00Z',
    acknowledged: false,
  },
  {
    id: 'sa-7',
    patientName: 'Arjun Mehta',
    type: 'Lab Alert',
    severity: 'LOW',
    message: 'TSH 6.2 mIU/L — subclinical hypothyroidism, monitor in 6 weeks',
    createdAt: '2026-10-02T06:20:00Z',
    acknowledged: true,
  },
]

const MOCK_RECALLS: RecallEntry[] = [
  {
    id: 'rc-1',
    medicineName: 'Metformin XR 500mg',
    manufacturer: 'Sun Pharmaceutical Industries',
    reason: 'N-Nitrosodimethylamine (NDMA) impurity above acceptable daily intake limit',
    recallDate: '2026-09-28',
    batchNumbers: ['SMF2401A', 'SMF2401B', 'SMF2402A'],
    status: 'ACTIVE',
  },
  {
    id: 'rc-2',
    medicineName: 'Amlodipine Besylate 5mg',
    manufacturer: 'Lupin Limited',
    reason: 'Dissolution test failure — subpotent drug release at 30-minute time point',
    recallDate: '2026-09-25',
    batchNumbers: ['ALP2389C', 'ALP2390A'],
    status: 'ACTIVE',
  },
]

const MOCK_WING_DATA = {
  ALLOPATHY: {
    topIssues: ['Hypertension', 'Type 2 Diabetes', 'Coronary Artery Disease', 'COPD'],
    topMedicines: ['Metformin', 'Atorvastatin', 'Amlodipine', 'Omeprazole'],
    activeCarePlans: 24,
    color: 'teal',
  },
  AYURVEDA: {
    topIssues: ['Digestive Imbalance', 'Joint Pain (Sandhigata Vata)', 'Stress (Manas Dosha)', 'Skin Disorders'],
    topMedicines: ['Ashwagandha', 'Triphala', 'Brahmi', 'Guggulu'],
    activeCarePlans: 9,
    color: 'emerald',
  },
  HOMEOPATHY: {
    topIssues: ['Chronic Migraine', 'Allergic Rhinitis', 'Anxiety Disorder', 'Eczema'],
    topMedicines: ['Natrum Mur 200C', 'Arsenicum Alb 30C', 'Pulsatilla 200C', 'Sulphur 30C'],
    activeCarePlans: 5,
    color: 'violet',
  },
}

// ─── Count-Up Animation Hook ───────────────────────────────────────

function useCountUp(end: number, duration: number = 1200, startOnMount: boolean = true) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!startOnMount) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration, startOnMount])

  return count
}

// ─── Sub-Components ────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  subtitle,
  trend,
  trendUp,
  delay = 0,
  extra,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  value: number
  subtitle: string
  trend?: string
  trendUp?: boolean
  delay?: number
  extra?: React.ReactNode
}) {
  const animatedValue = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold tracking-tight">{animatedValue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {trend && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  trendUp
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                }`}
              >
                {trendUp ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                {trend}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
          {extra && <div className="mt-2">{extra}</div>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

function SeverityIcon({ severity }: { severity: SafetyAlert['severity'] }) {
  switch (severity) {
    case 'CRITICAL':
      return <OctagonAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
    case 'HIGH':
      return <CircleAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
    case 'MODERATE':
      return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    case 'LOW':
      return <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
  }
}

function SeverityBadge({ severity }: { severity: SafetyAlert['severity'] }) {
  const config: Record<SafetyAlert['severity'], { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-800' },
    HIGH: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-800' },
    MODERATE: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-800' },
    LOW: { bg: 'bg-sky-100 dark:bg-sky-950', text: 'text-sky-800 dark:text-sky-200', border: 'border-sky-300 dark:border-sky-800' },
  }
  const c = config[severity]
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${c.bg} ${c.text} ${c.border}`}>
      {severity}
    </Badge>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Chart Tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard Component ──────────────────────────────────────

export function DashboardSection() {
  const { setActiveSection } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<SafetyAlert[]>(MOCK_SAFETY_ALERTS)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Seed + fetch on mount
  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        // Seed database on first load
        await fetch('/api/seed', { method: 'POST' }).catch(() => {})

        // Fetch real data from APIs in parallel
        const [patientsRes, safetyRes, queueRes, plansRes, medsRes] = await Promise.allSettled([
          fetch('/api/patients?limit=1'),
          fetch('/api/safety'),
          fetch('/api/clinician-queue'),
          fetch('/api/care-plans?status=DRAFT'),
          fetch('/api/medications'),
        ])

        // We use mock data as base, but overlay real counts if available
        if (mounted) {
          // Update stats with real data if available
          if (patientsRes.status === 'fulfilled' && patientsRes.value.ok) {
            const d = await patientsRes.value.json().catch(() => null)
            if (d?.pagination?.total) {
              MOCK_STATS.totalPatients = Math.max(MOCK_STATS.totalPatients, d.pagination.total)
            }
          }
          if (safetyRes.status === 'fulfilled' && safetyRes.value.ok) {
            const d = await safetyRes.value.json().catch(() => null)
            const alertList = d?.data ?? d?.alerts ?? []
            if (Array.isArray(alertList) && alertList.length > 0) {
              MOCK_STATS.safetyAlerts = alertList.length
            }
          }
          if (queueRes.status === 'fulfilled' && queueRes.value.ok) {
            const d = await queueRes.value.json().catch(() => null)
            const summary = d?.data?.summary
            if (summary) {
              MOCK_STATS.pendingReviews = (summary.unassignedCount ?? 0) + (summary.assignedCount ?? 0)
            }
          }
          if (plansRes.status === 'fulfilled' && plansRes.value.ok) {
            const d = await plansRes.value.json().catch(() => null)
            const plansList = d?.data ?? d?.plans ?? []
            if (Array.isArray(plansList)) {
              MOCK_STATS.carePlansToday = plansList.length
            }
          }
          setDataLoaded(true)
        }
      } catch {
        // Fall back to mock data
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }, [])

  // ─── New Feature KPIs ────────────────────────────────────────
  const [newKpis, setNewKpis] = useState({ prescriptions: 0, labOrders: 0, appointments: 0, cdsAlerts: 0, reminders: 0, notifications: 0 })

  useEffect(() => {
    async function fetchNewKpis() {
      try {
        const [rxRes, labRes, aptRes, cdsRes, remRes, notifRes] = await Promise.allSettled([
          fetch('/api/prescriptions').then(r => r.json()),
          fetch('/api/lab-orders').then(r => r.json()),
          fetch('/api/appointments').then(r => r.json()),
          fetch('/api/cds').then(r => r.json()),
          fetch('/api/follow-up-reminders').then(r => r.json()),
          fetch('/api/notifications').then(r => r.json()),
        ])
        setNewKpis({
          prescriptions: rxRes.status === 'fulfilled' ? (rxRes.value?.data?.length ?? 0) : 0,
          labOrders: labRes.status === 'fulfilled' ? (labRes.value?.data?.length ?? 0) : 0,
          appointments: aptRes.status === 'fulfilled' ? (aptRes.value?.data?.length ?? 0) : 0,
          cdsAlerts: cdsRes.status === 'fulfilled' ? (cdsRes.value?.data?.length ?? 0) : 0,
          reminders: remRes.status === 'fulfilled' ? (remRes.value?.data?.length ?? 0) : 0,
          notifications: notifRes.status === 'fulfilled' ? (notifRes.value?.data?.length ?? 0) : 0,
        })
      } catch { /* ignore */ }
    }
    fetchNewKpis()
  }, [])

  if (loading) return <DashboardSkeleton />

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged)
  const activeRecalls = MOCK_RECALLS.filter((r) => r.status === 'ACTIVE')

  // ─── Row 1: KPI Stats Cards ────────────────────────────────────────

  const statCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={Users}
        iconBg="bg-teal-100 dark:bg-teal-950"
        iconColor="text-teal-600 dark:text-teal-400"
        title="Total Patients"
        value={MOCK_STATS.totalPatients}
        subtitle={`${MOCK_MODALITY_COUNTS.ALLOPATHY.toLocaleString('en-IN')} Allo · ${MOCK_MODALITY_COUNTS.AYURVEDA.toLocaleString('en-IN')} Ayur · ${MOCK_MODALITY_COUNTS.HOMEOPATHY.toLocaleString('en-IN')} Hom`}
        trend="+12%"
        trendUp={true}
        delay={0}
      />
      <StatCard
        icon={Heart}
        iconBg="bg-rose-100 dark:bg-rose-950"
        iconColor="text-rose-600 dark:text-rose-400"
        title="Active Health Issues"
        value={MOCK_STATS.healthIssues}
        subtitle="Across all three modalities"
        delay={0.05}
        extra={
          <div className="flex gap-1.5">
            <ModalityBadge modality="ALLOPATHY" className="text-[9px] px-1 py-0" />
            <span className="text-[10px] font-medium text-muted-foreground">{MOCK_HEALTH_MODALITY.ALLOPATHY}</span>
            <ModalityBadge modality="AYURVEDA" className="text-[9px] px-1 py-0" />
            <span className="text-[10px] font-medium text-muted-foreground">{MOCK_HEALTH_MODALITY.AYURVEDA}</span>
            <ModalityBadge modality="HOMEOPATHY" className="text-[9px] px-1 py-0" />
            <span className="text-[10px] font-medium text-muted-foreground">{MOCK_HEALTH_MODALITY.HOMEOPATHY}</span>
          </div>
        }
      />
      <StatCard
        icon={Pill}
        iconBg="bg-amber-100 dark:bg-amber-950"
        iconColor="text-amber-600 dark:text-amber-400"
        title="Medicine Catalog"
        value={MOCK_STATS.totalMedicines}
        subtitle="Formulary across all wings"
        delay={0.1}
        extra={
          <div className="flex gap-1.5 text-[10px]">
            <span className="text-teal-700 dark:text-teal-300 font-medium">{MOCK_MEDICINE_MODALITY.ALLOPATHY} Allo</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">{MOCK_MEDICINE_MODALITY.AYURVEDA} Ayur</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-violet-700 dark:text-violet-300 font-medium">{MOCK_MEDICINE_MODALITY.HOMEOPATHY} Hom</span>
          </div>
        }
      />
      <StatCard
        icon={AlertTriangle}
        iconBg={MOCK_STATS.safetyAlerts > 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'}
        iconColor={MOCK_STATS.safetyAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
        title="Safety Alerts"
        value={MOCK_STATS.safetyAlerts}
        subtitle={MOCK_STATS.safetyAlerts > 0 ? 'Immediate attention required' : 'All clear'}
        trend={MOCK_STATS.safetyAlerts > 0 ? `${unacknowledgedAlerts.length} unacked` : undefined}
        trendUp={MOCK_STATS.safetyAlerts === 0}
        delay={0.15}
        extra={
          <div className="flex gap-1.5 flex-wrap">
            {MOCK_ALERTS_SEVERITY.CRITICAL > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">{MOCK_ALERTS_SEVERITY.CRITICAL} Critical</Badge>}
            {MOCK_ALERTS_SEVERITY.HIGH > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">{MOCK_ALERTS_SEVERITY.HIGH} High</Badge>}
            {MOCK_ALERTS_SEVERITY.MODERATE > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">{MOCK_ALERTS_SEVERITY.MODERATE} Mod</Badge>}
            {MOCK_ALERTS_SEVERITY.LOW > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">{MOCK_ALERTS_SEVERITY.LOW} Low</Badge>}
          </div>
        }
      />
      <StatCard
        icon={RotateCcw}
        iconBg={activeRecalls.length > 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'}
        iconColor={activeRecalls.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
        title="Active Recalls"
        value={activeRecalls.length}
        subtitle={activeRecalls.length > 0 ? 'CDSCO — action required' : 'No active recalls'}
        delay={0.2}
        extra={
          activeRecalls.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">CDSCO Active</span>
            </div>
          ) : undefined
        }
      />
      <StatCard
        icon={ClipboardList}
        iconBg="bg-sky-100 dark:bg-sky-950"
        iconColor="text-sky-600 dark:text-sky-400"
        title="Pending Reviews"
        value={MOCK_STATS.pendingReviews}
        subtitle="Clinician queue awaiting review"
        delay={0.25}
      />
    </div>
  )

  // ─── Row 1b: New Feature KPI Cards ────────────────────────────────

  const newKpiRow = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      <StatCard icon={Pill} iconBg="bg-teal-100 dark:bg-teal-950" iconColor="text-teal-600 dark:text-teal-400" title="Prescriptions" value={newKpis.prescriptions} subtitle="Active & recent Rx" delay={0.16} />
      <StatCard icon={FlaskConical} iconBg="bg-emerald-100 dark:bg-emerald-950" iconColor="text-emerald-600 dark:text-emerald-400" title="Lab Orders" value={newKpis.labOrders} subtitle="Tests ordered & pending" delay={0.18} />
      <StatCard icon={Stethoscope} iconBg="bg-amber-100 dark:bg-amber-950" iconColor="text-amber-600 dark:text-amber-400" title="Appointments" value={newKpis.appointments} subtitle="Scheduled & upcoming" delay={0.20} />
      <StatCard icon={AlertTriangle} iconBg="bg-red-100 dark:bg-red-950" iconColor="text-red-600 dark:text-red-400" title="CDS Alerts" value={newKpis.cdsAlerts} subtitle="Clinical decision support" delay={0.22} />
      <StatCard icon={Clock} iconBg="bg-violet-100 dark:bg-violet-950" iconColor="text-violet-600 dark:text-violet-400" title="Reminders" value={newKpis.reminders} subtitle="Follow-ups & meds" delay={0.24} />
      <StatCard icon={FileWarning} iconBg="bg-sky-100 dark:bg-sky-950" iconColor="text-sky-600 dark:text-sky-400" title="Notifications" value={newKpis.notifications} subtitle="Unread alerts" delay={0.26} />
    </motion.div>
  )

  // ─── Row 2: Analytics Charts ───────────────────────────────────────

  const analyticsRow = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Left: Patient Encounters by Modality (Stacked Bar) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Patient Encounters by Modality</CardTitle>
          <CardDescription className="text-xs">6-month trend across all three wings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ENCOUNTER_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allopathy" name="Allopathy" stackId="encounters" fill="#0d9488" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ayurveda" name="Ayurveda" stackId="encounters" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="homeopathy" name="Homeopathy" stackId="encounters" fill="#7c3aed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Right: Body System Distribution (Horizontal Bar) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Body System Distribution</CardTitle>
          <CardDescription className="text-xs">Active health issues by anatomical system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_BODY_SYSTEMS} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Issues" radius={[0, 3, 3, 0]}>
                  {MOCK_BODY_SYSTEMS.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ─── Row 3: Three-Wing Overview ────────────────────────────────────

  const wingOverview = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {(Object.entries(MOCK_WING_DATA) as [Modality, typeof MOCK_WING_DATA.ALLOPATHY][]).map(
        ([modality, data], idx) => {
          const colorConfig: Record<string, { border: string; headerBg: string; headerText: string; iconBg: string; iconText: string; dot: string }> = {
            teal: {
              border: 'border-teal-200 dark:border-teal-800',
              headerBg: 'bg-teal-50 dark:bg-teal-950',
              headerText: 'text-teal-900 dark:text-teal-100',
              iconBg: 'bg-teal-100 dark:bg-teal-900',
              iconText: 'text-teal-600 dark:text-teal-400',
              dot: 'bg-teal-500',
            },
            emerald: {
              border: 'border-emerald-200 dark:border-emerald-800',
              headerBg: 'bg-emerald-50 dark:bg-emerald-950',
              headerText: 'text-emerald-900 dark:text-emerald-100',
              iconBg: 'bg-emerald-100 dark:bg-emerald-900',
              iconText: 'text-emerald-600 dark:text-emerald-400',
              dot: 'bg-emerald-500',
            },
            violet: {
              border: 'border-violet-200 dark:border-violet-800',
              headerBg: 'bg-violet-50 dark:bg-violet-950',
              headerText: 'text-violet-900 dark:text-violet-100',
              iconBg: 'bg-violet-100 dark:bg-violet-900',
              iconText: 'text-violet-600 dark:text-violet-400',
              dot: 'bg-violet-500',
            },
          }
          const c = colorConfig[data.color]
          const WingIcon = modality === 'ALLOPATHY' ? Activity : modality === 'AYURVEDA' ? Leaf : FlaskConical

          return (
            <Card key={modality} className={`border ${c.border}`}>
              <CardHeader className={`pb-2 ${c.headerBg} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.iconBg}`}>
                      <WingIcon className={`h-4 w-4 ${c.iconText}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-sm font-semibold ${c.headerText}`}>
                        {modality === 'ALLOPATHY' ? 'Allopathy Wing' : modality === 'AYURVEDA' ? 'Ayurveda Wing' : 'Homeopathy Wing'}
                      </CardTitle>
                    </div>
                  </div>
                  <ModalityBadge modality={modality} />
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Top Health Issues</p>
                  <div className="space-y-1">
                    {data.topIssues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${c.dot} shrink-0`} />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Top Medicines</p>
                  <div className="flex flex-wrap gap-1">
                    {data.topMedicines.map((med, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-[11px] text-muted-foreground">Active Care Plans</span>
                  <span className="text-sm font-semibold">{data.activeCarePlans}</span>
                </div>
              </CardContent>
            </Card>
          )
        }
      )}
    </motion.div>
  )

  // ─── Row 4: Safety & Recalls Feed ──────────────────────────────────

  const safetyRecallsRow = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Left: Safety Alerts Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              Safety Alerts Timeline
            </CardTitle>
            <Badge variant="destructive" className="text-[10px]">
              {unacknowledgedAlerts.length} Unacknowledged
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            <AnimatePresence>
              {alerts.map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs transition-colors ${
                    alert.acknowledged
                      ? 'bg-muted/40 border-border/50 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-red-50/50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                      : 'bg-background border-border'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <SeverityIcon severity={alert.severity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium truncate">{alert.patientName}</span>
                      <SeverityBadge severity={alert.severity} />
                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(alert.createdAt)}</span>
                      {alert.acknowledged && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 shrink-0"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Ack
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Right: CDSCO Recall Monitor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-orange-500" />
              CDSCO Recall Monitor
            </CardTitle>
            {activeRecalls.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <Badge variant="destructive" className="text-[10px]">
                  {activeRecalls.length} Active
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {MOCK_RECALLS.map((recall, idx) => (
              <motion.div
                key={recall.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`p-3 rounded-lg border ${
                  recall.status === 'ACTIVE'
                    ? 'bg-red-50/40 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    : 'bg-muted/40 border-border/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{recall.medicineName}</p>
                    <p className="text-[11px] text-muted-foreground">{recall.manufacturer}</p>
                  </div>
                  <Badge
                    variant={recall.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {recall.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{recall.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {recall.batchNumbers.map((batch) => (
                      <Badge key={batch} variant="outline" className="text-[9px] px-1 py-0 font-mono">
                        {batch}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {new Date(recall.recallDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ─── Row 5: Quick Actions Grid ─────────────────────────────────────

  const quickActions = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Jump to common clinical workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: UserPlus, label: 'New Patient', section: 'patients' as const, color: 'teal' },
              { icon: Search, label: 'Symptom Check', section: 'symptom-checker' as const, color: 'emerald' },
              { icon: ScanLine, label: 'Scan Medicine', section: 'medicines' as const, color: 'amber' },
              { icon: GitCompare, label: 'Drug Check', section: 'drug-interactions' as const, color: 'rose' },
              { icon: FileWarning, label: 'View Recalls', section: 'safety' as const, color: 'red' },
              { icon: Mic, label: 'Voice Triage', section: 'intake' as const, color: 'violet' },
              { icon: Pill, label: 'Prescriptions', section: 'prescriptions' as const, color: 'teal' },
              { icon: FlaskConical, label: 'Lab Orders', section: 'lab-orders' as const, color: 'emerald' },
              { icon: Stethoscope, label: 'Appointments', section: 'appointments' as const, color: 'amber' },
              { icon: Brain, label: 'CDS Alerts', section: 'cds' as const, color: 'red' },
              { icon: ShieldCheck, label: 'Insurance', section: 'insurance' as const, color: 'violet' },
              { icon: Activity, label: 'Timeline', section: 'patient-timeline' as const, color: 'teal' },
            ].map((action, idx) => {
              const colorMap: Record<string, { bg: string; hover: string; text: string }> = {
                teal: { bg: 'bg-teal-50 dark:bg-teal-950', hover: 'hover:bg-teal-100 dark:hover:bg-teal-900', text: 'text-teal-700 dark:text-teal-300' },
                emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300' },
                amber: { bg: 'bg-amber-50 dark:bg-amber-950', hover: 'hover:bg-amber-100 dark:hover:bg-amber-900', text: 'text-amber-700 dark:text-amber-300' },
                rose: { bg: 'bg-rose-50 dark:bg-rose-950', hover: 'hover:bg-rose-100 dark:hover:bg-rose-900', text: 'text-rose-700 dark:text-rose-300' },
                red: { bg: 'bg-red-50 dark:bg-red-950', hover: 'hover:bg-red-100 dark:hover:bg-red-900', text: 'text-red-700 dark:text-red-300' },
                violet: { bg: 'bg-violet-50 dark:bg-violet-950', hover: 'hover:bg-violet-100 dark:hover:bg-violet-900', text: 'text-violet-700 dark:text-violet-300' },
              }
              const c = colorMap[action.color]

              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + idx * 0.04 }}
                  onClick={() => setActiveSection(action.section)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 ${c.bg} ${c.hover} ${c.text} transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{action.label}</span>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ─── Assemble Dashboard ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {statCards}
      {newKpiRow}
      {analyticsRow}
      {wingOverview}
      {safetyRecallsRow}
      {quickActions}
    </div>
  )
}
