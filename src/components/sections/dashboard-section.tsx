'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  BookOpen,
  Search,
  ShieldCheck,
  Activity,
  Brain,
  Leaf,
  FlaskConical,
  Database,
  TrendingUp,
  Zap,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { PriorityBadge } from '@/components/clinical/priority-badge'

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

interface AlertData {
  id: string
  patientName: string
  type: string
  severity: string
  message: string
  createdAt: string
}

interface BodySystemData {
  name: string
  count: number
}

interface KnowledgeStats {
  totalIssues: number
  totalMedicines: number
  totalIndications: number
  totalInteractions: number
}

// ─── Animation Presets ─────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const staggerChild = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: i * 0.04 },
})

// ─── Modality Config ──────────────────────────────────────────────

const MODALITY_CONFIG = {
  ALLOPATHY: {
    label: 'Allopathy',
    icon: FlaskConical,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    bar: '#0d9488',
  },
  AYURVEDA: {
    label: 'Ayurveda',
    icon: Leaf,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    bar: '#059669',
  },
  HOMEOPATHY: {
    label: 'Homeopathy',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    bar: '#7c3aed',
  },
} as const

const BODY_SYSTEM_COLORS = [
  '#0d9488',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#2563eb',
  '#db2777',
  '#65a30d',
  '#0891b2',
  '#9333ea',
]

// ─── Safe JSON fetch helper ───────────────────────────────────────

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ─── Component ────────────────────────────────────────────────────

export function DashboardSection() {
  const { setActiveSection } = useAppStore()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [modalityCounts, setModalityCounts] = useState<ModalityCount>({
    ALLOPATHY: 0,
    AYURVEDA: 0,
    HOMEOPATHY: 0,
  })
  const [bodySystems, setBodySystems] = useState<BodySystemData[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeStats>({
    totalIssues: 0,
    totalMedicines: 0,
    totalIndications: 0,
    totalInteractions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)

  // ── Auto-seed on first load ────────────────────────────────────
  const autoSeed = useCallback(async () => {
    // Check if data exists already
    const issuesCheck = await safeFetch<{
      pagination?: { total: number }
    }>('/api/health-issues?limit=1')

    const issueCount = issuesCheck?.pagination?.total ?? 0
    if (issueCount === 0) {
      await safeFetch('/api/seed', { method: 'POST' })
    }
    setSeeded(true)
  }, [])

  // ── Load all dashboard data ────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const [
        patientsRes,
        issuesRes,
        medsRes,
        safetyRes,
        plansRes,
        medAllopathyRes,
        medAyurvedaRes,
        medHomeopathyRes,
      ] = await Promise.all([
        safeFetch<{ pagination?: { total: number }; data?: unknown[] }>('/api/patients?limit=1'),
        safeFetch<{
          pagination?: { total: number }
          data?: Array<{ bodySystem?: string; _count?: { indications?: number } }>
          filters?: { bodySystems?: string[] }
        }>('/api/health-issues?limit=50'),
        safeFetch<{
          pagination?: { total: number }
          data?: Array<{ id: string; recalls?: unknown[]; _count?: { interactions?: number } }>
        }>('/api/medicine-catalog?limit=50'),
        safeFetch<{ data?: Array<Record<string, string>> }>('/api/safety'),
        safeFetch<{ data?: unknown[] }>('/api/care-plans?status=DRAFT'),
        safeFetch<{ pagination?: { total: number } }>('/api/medicine-catalog?limit=1&modality=ALLOPATHY'),
        safeFetch<{ pagination?: { total: number } }>('/api/medicine-catalog?limit=1&modality=AYURVEDA'),
        safeFetch<{ pagination?: { total: number } }>('/api/medicine-catalog?limit=1&modality=HOMEOPATHY'),
      ])

      // ── Core stats ──
      const totalPatients = patientsRes?.pagination?.total ?? 0
      const totalIssues = issuesRes?.pagination?.total ?? 0
      const totalMeds = medsRes?.pagination?.total ?? 0
      const safetyData = safetyRes?.data ?? []
      const plansData = plansRes?.data ?? []

      // Count active recalls from medicine data
      const medList = medsRes?.data ?? []
      const recallCount = medList.filter(
        (m) => m.recalls && Array.isArray(m.recalls) && m.recalls.length > 0
      ).length

      // Count total indications from issues data
      const issueList = issuesRes?.data ?? []
      const totalIndications = issueList.reduce(
        (sum, issue) => sum + (issue._count?.indications ?? 0),
        0
      )

      // Count total interactions from medicine data
      const totalInteractions = medList.reduce(
        (sum, med) => sum + (med._count?.interactions ?? 0),
        0
      )

      setStats({
        totalPatients,
        healthIssues: totalIssues,
        totalMedicines: totalMeds,
        safetyAlerts: safetyData.length,
        pendingReviews: plansData.length,
        drugInteractions: 0,
        activeRecalls: recallCount,
        carePlansToday: plansData.length,
      })

      // ── Modality counts ──
      setModalityCounts({
        ALLOPATHY: medAllopathyRes?.pagination?.total ?? 0,
        AYURVEDA: medAyurvedaRes?.pagination?.total ?? 0,
        HOMEOPATHY: medHomeopathyRes?.pagination?.total ?? 0,
      })

      // ── Body system distribution ──
      const bsMap = new Map<string, number>()
      for (const issue of issueList) {
        const bs = issue.bodySystem || 'Other'
        bsMap.set(bs, (bsMap.get(bs) ?? 0) + 1)
      }
      const bsData = Array.from(bsMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      setBodySystems(bsData)

      // ── Safety alerts ──
      setAlerts(
        safetyData.slice(0, 6).map((a: Record<string, string>) => ({
          id: a.id,
          patientName: a.patientName ?? 'Patient',
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt,
        }))
      )

      // ── Knowledge stats ──
      setKnowledge({
        totalIssues,
        totalMedicines: totalMeds,
        totalIndications,
        totalInteractions,
      })
    } catch {
      setStats({
        totalPatients: 0,
        healthIssues: 0,
        totalMedicines: 0,
        safetyAlerts: 0,
        pendingReviews: 0,
        drugInteractions: 0,
        activeRecalls: 0,
        carePlansToday: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function init() {
      await autoSeed()
      await loadDashboard()
    }
    init()
  }, [autoSeed, loadDashboard])

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg col-span-2" />
        </div>
      </div>
    )
  }

  // ── Stats cards config ─────────────────────────────────────────
  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/50',
    },
    {
      title: 'Health Issues',
      value: stats?.healthIssues ?? 0,
      icon: Heart,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
    },
    {
      title: 'Medicines',
      value: stats?.totalMedicines ?? 0,
      icon: Pill,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      sub: [
        `Allopathy: ${modalityCounts.ALLOPATHY}`,
        `Ayurveda: ${modalityCounts.AYURVEDA}`,
        `Homeopathy: ${modalityCounts.HOMEOPATHY}`,
      ].join(' · '),
    },
    {
      title: 'Safety Alerts',
      value: stats?.safetyAlerts ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'Pending Reviews',
      value: stats?.pendingReviews ?? 0,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/50',
    },
    {
      title: 'Drug Interactions',
      value: stats?.drugInteractions ?? 0,
      icon: GitCompare,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/50',
    },
    {
      title: 'Active Recalls',
      value: stats?.activeRecalls ?? 0,
      icon: RotateCcw,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/50',
    },
    {
      title: 'Care Plans Today',
      value: stats?.carePlansToday ?? 0,
      icon: ClipboardList,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
  ]

  // ── Quick actions config ───────────────────────────────────────
  const quickActions = [
    { label: 'New Patient', icon: UserPlus, section: 'patients' as const, variant: 'default' as const },
    { label: 'Symptom Checker', icon: Stethoscope, section: 'symptom-checker' as const, variant: 'outline' as const },
    { label: 'Medicine Catalog', icon: BookOpen, section: 'medicines' as const, variant: 'outline' as const },
    { label: 'Health Issues', icon: Search, section: 'health-issues' as const, variant: 'outline' as const },
    { label: 'Drug Interactions', icon: ShieldCheck, section: 'drug-interactions' as const, variant: 'outline' as const },
  ]

  const totalModality =
    modalityCounts.ALLOPATHY + modalityCounts.AYURVEDA + modalityCounts.HOMEOPATHY || 1

  // ── Render ─────────────────────────────────────────────────────
  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* ─── Row 1: Stats Cards (8 cards, 2 rows of 4) ──────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.slice(0, 4).map((stat, i) => (
          <motion.div key={stat.title} {...staggerChild(i)}>
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-teal-300 dark:hover:border-l-teal-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                    {stat.sub && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{stat.sub}</p>
                    )}
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.slice(4, 8).map((stat, i) => (
          <motion.div key={stat.title} {...staggerChild(i + 4)}>
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-teal-300 dark:hover:border-l-teal-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                    {stat.sub && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{stat.sub}</p>
                    )}
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Row 2: Three-Wing Distribution + Body System Chart ─ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Three-Wing Distribution */}
        <motion.div {...staggerChild(8)}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-base">Three-Wing Distribution</CardTitle>
              </div>
              <CardDescription>
                Medicines by treatment modality — {totalModality} total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(
                Object.entries(MODALITY_CONFIG) as Array<
                  [keyof typeof MODALITY_CONFIG, (typeof MODALITY_CONFIG)[keyof typeof MODALITY_CONFIG]]
                >
              ).map(([key, config]) => {
                const count = modalityCounts[key]
                const pct = Math.round((count / totalModality) * 100)
                const Icon = config.icon
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-md p-1.5 ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{count}</span>
                        <Badge variant="outline" className="text-xs">
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: config.bar }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Body System Distribution */}
        <motion.div {...staggerChild(9)}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-base">Body System Distribution</CardTitle>
              </div>
              <CardDescription>
                Health issues by body system — top {bodySystems.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bodySystems.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No body system data available
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bodySystems}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-20"
                        horizontal={false}
                      />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Issues">
                        {bodySystems.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={BODY_SYSTEM_COLORS[index % BODY_SYSTEM_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Row 3: Safety Alerts + Quick Actions + Knowledge ──── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Safety Alerts */}
        <motion.div {...staggerChild(10)}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base">Recent Safety Alerts</CardTitle>
              </div>
              <CardDescription>
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''} requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                  <ShieldCheck className="h-8 w-8 mb-2 text-green-500" />
                  <span>All clear — no active alerts</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                    >
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          alert.severity === 'EMERGENCY'
                            ? 'text-red-500'
                            : alert.severity === 'CRITICAL'
                              ? 'text-orange-500'
                              : 'text-amber-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <PriorityBadge priority={alert.severity} />
                          <Badge variant="outline" className="text-[10px]">
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...staggerChild(11)}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </div>
              <CardDescription>Navigate to key clinical tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.label}
                      variant={action.variant}
                      className="justify-start gap-3 h-11"
                      onClick={() => setActiveSection(action.section)}
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Knowledge Stats */}
        <motion.div {...staggerChild(12)}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <CardTitle className="text-base">Knowledge Stats</CardTitle>
              </div>
              <CardDescription>Clinical knowledge base summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: 'Total Health Issues',
                  value: knowledge.totalIssues,
                  icon: Heart,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/50',
                },
                {
                  label: 'Total Medicines',
                  value: knowledge.totalMedicines,
                  icon: Pill,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                },
                {
                  label: 'Total Indications',
                  value: knowledge.totalIndications,
                  icon: TrendingUp,
                  color: 'text-teal-600 dark:text-teal-400',
                  bg: 'bg-teal-50 dark:bg-teal-950/50',
                },
                {
                  label: 'Total Drug Interactions',
                  value: knowledge.totalInteractions,
                  icon: GitCompare,
                  color: 'text-violet-600 dark:text-violet-400',
                  bg: 'bg-violet-50 dark:bg-violet-950/50',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-md p-1.5 ${item.bg}`}>
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value.toLocaleString()}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}


