'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Heart,
  Brain,
  Leaf,
  Filter,
  ChevronRight,
  AlertTriangle,
  Stethoscope,
  Pill,
  FlaskConical,
  Activity,
  ChevronLeft,
  X,
  Info,
  ShieldCheck,
  Clock,
  Languages,
  FileText,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface HealthIssueAlias {
  id: string
  alias: string
  language: string
}

interface HealthIssueTranslation {
  id: string
  language: string
  name: string
  description: string | null
}

interface HealthIssueWing {
  id: string
  modality: string
  approach: string
  commonMedicines: string | null
  lifestyleAdvice: string | null
  whenToSeeDoctor: string | null
  redFlags: string | null
  evidenceLevel: string | null
}

interface MedicineIndication {
  id: string
  medicine: {
    id: string
    name: string
    modality: string
    category: string | null
    form: string | null
    strength: string | null
  }
  indication: string
  howToUseDaily: string | null
  medianDose: string | null
  duration: string | null
  priority: number
  evidenceLevel: string | null
}

interface HealthIssueListItem {
  id: string
  code: string | null
  name: string
  description: string | null
  bodySystem: string
  clinicalDomain: string
  symptomGroup: string
  severity: string
  chronicity: string
  prevalence: string | null
  aliases: HealthIssueAlias[]
  translations: HealthIssueTranslation[]
  wingApproaches: HealthIssueWing[]
  _count?: { indications: number }
}

interface HealthIssueDetail extends HealthIssueListItem {
  isSubtype: boolean
  parentIssueId: string | null
  isActive: boolean
  indications: MedicineIndication[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ──────────────────────────────────────────────
// Constants & Config
// ──────────────────────────────────────────────

const BODY_SYSTEMS = [
  'RESPIRATORY',
  'CARDIOVASCULAR',
  'GASTROINTESTINAL',
  'NEUROLOGICAL',
  'MUSCULOSKELETAL',
  'DERMATOLOGICAL',
  'ENDOCRINE',
  'GENITOURINARY',
  'IMMUNOLOGICAL',
  'PSYCHIATRIC',
  'ENT',
  'OPHTHALMOLOGICAL',
  'HEMATOLOGICAL',
] as const

const BODY_SYSTEM_ICONS: Record<string, React.ReactNode> = {
  RESPIRATORY: <Activity className="h-3.5 w-3.5" />,
  CARDIOVASCULAR: <Heart className="h-3.5 w-3.5" />,
  GASTROINTESTINAL: <Leaf className="h-3.5 w-3.5" />,
  NEUROLOGICAL: <Brain className="h-3.5 w-3.5" />,
  MUSCULOSKELETAL: <Activity className="h-3.5 w-3.5" />,
  DERMATOLOGICAL: <Stethoscope className="h-3.5 w-3.5" />,
  ENDOCRINE: <FlaskConical className="h-3.5 w-3.5" />,
  GENITOURINARY: <Pill className="h-3.5 w-3.5" />,
  IMMUNOLOGICAL: <ShieldCheck className="h-3.5 w-3.5" />,
  PSYCHIATRIC: <Brain className="h-3.5 w-3.5" />,
  ENT: <Stethoscope className="h-3.5 w-3.5" />,
  OPHTHALMOLOGICAL: <Stethoscope className="h-3.5 w-3.5" />,
  HEMATOLOGICAL: <Activity className="h-3.5 w-3.5" />,
}

const SEVERITY_CONFIG: Record<
  string,
  { label: string; className: string; pulse: boolean }
> = {
  MILD: {
    label: 'Mild',
    className:
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    pulse: false,
  },
  MODERATE: {
    label: 'Moderate',
    className:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
    pulse: false,
  },
  SEVERE: {
    label: 'Severe',
    className:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    pulse: false,
  },
  CRITICAL: {
    label: 'Critical',
    className:
      'bg-red-200 text-red-900 border-red-400 dark:bg-red-900 dark:text-red-100 dark:border-red-600',
    pulse: true,
  },
}

const CHRONICITY_CONFIG: Record<string, { label: string; className: string }> = {
  ACUTE: {
    label: 'Acute',
    className:
      'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700',
  },
  CHRONIC: {
    label: 'Chronic',
    className:
      'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  },
  ACUTE_ON_CHRONIC: {
    label: 'Acute on Chronic',
    className:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-700',
  },
}

const MODALITY_CONFIG: Record<
  string,
  {
    label: string
    icon: React.ReactNode
    bgClass: string
    textClass: string
    borderClass: string
    cardBg: string
  }
> = {
  ALLOPATHY: {
    label: 'Allopathy',
    icon: <Pill className="h-4 w-4" />,
    bgClass: 'bg-teal-600',
    textClass: 'text-teal-700 dark:text-teal-300',
    borderClass: 'border-teal-300 dark:border-teal-700',
    cardBg: 'bg-teal-50 dark:bg-teal-950/30',
  },
  AYURVEDA: {
    label: 'Ayurveda',
    icon: <Leaf className="h-4 w-4" />,
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    cardBg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  HOMEOPATHY: {
    label: 'Homeopathy',
    icon: <FlaskConical className="h-4 w-4" />,
    bgClass: 'bg-violet-600',
    textClass: 'text-violet-700 dark:text-violet-300',
    borderClass: 'border-violet-300 dark:border-violet-700',
    cardBg: 'bg-violet-50 dark:bg-violet-950/30',
  },
}

const EVIDENCE_CONFIG: Record<string, { label: string; className: string }> = {
  STRONG: {
    label: 'Strong Evidence',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  MODERATE: {
    label: 'Moderate Evidence',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  LIMITED: {
    label: 'Limited Evidence',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  TRADITIONAL: {
    label: 'Traditional Use',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const staggerChild = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity] ?? {
    label: severity,
    className: 'bg-muted text-muted-foreground',
    pulse: false,
  }
  return (
    <Badge
      variant="outline"
      className={`text-xs ${config.className} ${config.pulse ? 'animate-pulse' : ''}`}
    >
      {config.label}
    </Badge>
  )
}

function ChronicityBadge({ chronicity }: { chronicity: string }) {
  const config = CHRONICITY_CONFIG[chronicity] ?? {
    label: chronicity,
    className: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function EvidenceBadge({ level }: { level: string | null }) {
  if (!level) return null
  const config = EVIDENCE_CONFIG[level] ?? {
    label: level,
    className: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function BodySystemTab({
  system,
  selected,
  onClick,
}: {
  system: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
        ${
          selected
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
    >
      {BODY_SYSTEM_ICONS[system] ?? <Filter className="h-3.5 w-3.5" />}
      {system.charAt(0) + system.slice(1).toLowerCase()}
    </button>
  )
}

function WingPanel({
  wing,
  modality,
  medicines,
}: {
  wing: HealthIssueWing | undefined
  modality: string
  medicines: MedicineIndication[]
}) {
  const config = MODALITY_CONFIG[modality] ?? MODALITY_CONFIG.ALLOPATHY
  const modalityMedicines = medicines.filter(
    (m) => m.medicine.modality === modality
  )

  if (!wing) {
    return (
      <div className="space-y-4 p-1">
        <div
          className={`rounded-lg border ${config.borderClass} ${config.cardBg} p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${config.bgClass} text-white`}>
              {config.icon}
            </div>
            <h4 className={`font-semibold ${config.textClass}`}>
              {config.label} Approach
            </h4>
          </div>
          <p className="text-sm text-muted-foreground">
            No {config.label.toLowerCase()} approach data available for this
            condition yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-1">
      {/* Approach Summary */}
      <div
        className={`rounded-lg border ${config.borderClass} ${config.cardBg} p-4 space-y-3`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${config.bgClass} text-white`}>
            {config.icon}
          </div>
          <h4 className={`font-semibold ${config.textClass}`}>
            {config.label} Approach
          </h4>
          <EvidenceBadge level={wing.evidenceLevel} />
        </div>
        <p className="text-sm leading-relaxed">{wing.approach}</p>
      </div>

      {/* Lifestyle Advice */}
      {wing.lifestyleAdvice && (
        <div className="rounded-lg border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h5 className="font-medium text-sm">Lifestyle Advice</h5>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {wing.lifestyleAdvice}
          </p>
        </div>
      )}

      {/* When to See Doctor */}
      {wing.whenToSeeDoctor && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h5 className="font-medium text-sm">When to See a Doctor</h5>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            {wing.whenToSeeDoctor}
          </p>
        </div>
      )}

      {/* Red Flags */}
      {wing.redFlags && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h5 className="font-medium text-sm text-red-800 dark:text-red-200">
              Red Flags
            </h5>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
            {wing.redFlags}
          </p>
        </div>
      )}

      {/* Related Medicines */}
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          <h5 className="font-medium text-sm">
            Related Medicines ({modalityMedicines.length})
          </h5>
        </div>
        {modalityMedicines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No medicines listed for this modality.
          </p>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {modalityMedicines.map((ind) => (
                <motion.div
                  key={ind.id}
                  {...staggerChild}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-md border border-border/50 p-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${config.bgClass}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {ind.medicine.name}
                      </span>
                      {ind.medicine.form && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {ind.medicine.form}
                        </Badge>
                      )}
                      {ind.medicine.strength && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {ind.medicine.strength}
                        </Badge>
                      )}
                    </div>
                    {ind.indication && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ind.indication}
                      </p>
                    )}
                    {ind.howToUseDaily && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">Dose:</span>{' '}
                        {ind.howToUseDaily}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export function HealthIssuesSection() {
  const { selectedIssueId, setSelectedIssueId } = useAppStore()

  // State
  const [issues, setIssues] = useState<HealthIssueListItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [bodySystemFilters, setBodySystemFilters] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [bodySystem, setBodySystem] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedDone, setSeedDone] = useState(false)

  // Detail panel
  const [detail, setDetail] = useState<HealthIssueDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeWing, setActiveWing] = useState('ALLOPATHY')

  // ──────────────────────────────────────────
  // Auto-seed on first load
  // ──────────────────────────────────────────
  useEffect(() => {
    if (seedDone) return
    const doSeed = async () => {
      setSeeding(true)
      try {
        await fetch('/api/seed', { method: 'POST' })
      } catch {
        // silent — seed may already exist
      } finally {
        setSeeding(false)
        setSeedDone(true)
      }
    }
    doSeed()
  }, [seedDone])

  // ──────────────────────────────────────────
  // Fetch issues list
  // ──────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    if (!seedDone) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (bodySystem) params.set('bodySystem', bodySystem)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/health-issues?${params.toString()}`)
      const data = await res.json()
      setIssues(data.data ?? [])
      if (data.pagination) setPagination(data.pagination)
      if (data.filters?.bodySystems) {
        setBodySystemFilters(data.filters.bodySystems)
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [search, bodySystem, page, seedDone])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  // ──────────────────────────────────────────
  // Fetch detail
  // ──────────────────────────────────────────
  const openDetail = async (issueId: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    setSelectedIssueId(issueId)
    setActiveWing('ALLOPATHY')
    try {
      const res = await fetch(`/api/health-issues/${issueId}`)
      const data = await res.json()
      setDetail(data.data ?? null)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setDetail(null)
    setSelectedIssueId(null)
  }

  // ──────────────────────────────────────────
  // Pagination helpers
  // ──────────────────────────────────────────
  const handlePrev = () => setPage((p) => Math.max(1, p - 1))
  const handleNext = () => setPage((p) => Math.min(pagination.totalPages, p + 1))

  // ──────────────────────────────────────────
  // Active body system filter tabs
  // ──────────────────────────────────────────
  const activeSystems = bodySystemFilters.length > 0 ? bodySystemFilters : [...BODY_SYSTEMS]

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Health Issue Explorer
          </h2>
          <p className="text-sm text-muted-foreground">
            Search conditions across Allopathy, Ayurveda &amp; Homeopathy
          </p>
        </div>
        {seeding && (
          <Badge
            variant="outline"
            className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 animate-pulse"
          >
            <Clock className="h-3 w-3 mr-1" />
            Seeding database...
          </Badge>
        )}
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder='Search issues... (e.g. "pet dard", "sir dard", "bukhar")'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={bodySystem || 'ALL'}
          onValueChange={(v) => {
            setBodySystem(v === 'ALL' ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All Body Systems" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Body Systems</SelectItem>
            {activeSystems.map((sys) => (
              <SelectItem key={sys} value={sys}>
                {sys.charAt(0) + sys.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Body System Filter Tabs ── */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-1 min-w-max">
          <BodySystemTab
            system="ALL"
            selected={bodySystem === ''}
            onClick={() => {
              setBodySystem('')
              setPage(1)
            }}
          />
          {activeSystems.map((sys) => (
            <BodySystemTab
              key={sys}
              system={sys}
              selected={bodySystem === sys}
              onClick={() => {
                setBodySystem(sys)
                setPage(1)
              }}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* ── Issues Grid ── */}
      <div className="grid gap-3">
        {loading ? (
          // Skeleton loading
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No health issues found</p>
            <p className="text-xs mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {issues.map((issue, idx) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer hover:shadow-md transition-all group border-l-4 ${
                      selectedIssueId === issue.id
                        ? 'border-l-primary shadow-md'
                        : 'border-l-transparent hover:border-l-primary/40'
                    }`}
                    onClick={() => openDetail(issue.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">
                              {issue.name}
                            </h3>
                            {issue.code && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 shrink-0"
                              >
                                {issue.code}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {issue.description ?? issue.symptomGroup ?? ''}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-muted/50"
                        >
                          {issue.bodySystem
                            .charAt(0)
                            .concat(issue.bodySystem.slice(1).toLowerCase())}
                        </Badge>
                        <SeverityBadge severity={issue.severity} />
                        <ChronicityBadge chronicity={issue.chronicity} />
                        {issue._count?.indications !== undefined && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {issue._count.indications} med
                            {issue._count.indications !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Hindi aliases preview */}
                      {issue.aliases?.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Languages className="h-3 w-3 text-muted-foreground shrink-0" />
                          {issue.aliases.slice(0, 3).map((alias) => (
                            <span
                              key={alias.id}
                              className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded"
                            >
                              {alias.alias}
                            </span>
                          ))}
                          {issue.aliases.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{issue.aliases.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} &middot;{' '}
            {pagination.total} total issues
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= pagination.totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail Panel (Slide-over) ── */}
      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Detail Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-base">Issue Details</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeDetail}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1">
                  <div className="p-5 space-y-5">
                    {detailLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-32 w-full" />
                      </div>
                    ) : detail ? (
                      <>
                        {/* Issue Name & Description */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold">
                                {detail.name}
                              </h3>
                              {detail.code && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Code: {detail.code}
                                </p>
                              )}
                            </div>
                          </div>

                          {detail.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {detail.description}
                            </p>
                          )}

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-muted/50"
                            >
                              {detail.bodySystem}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-muted/50"
                            >
                              {detail.clinicalDomain}
                            </Badge>
                            <SeverityBadge severity={detail.severity} />
                            <ChronicityBadge chronicity={detail.chronicity} />
                            {detail.prevalence && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-muted/50"
                              >
                                {detail.prevalence}
                              </Badge>
                            )}
                          </div>
                        </motion.div>

                        {/* Hindi Aliases */}
                        {detail.aliases?.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: 0.05 }}
                            className="rounded-lg border border-border p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <Languages className="h-4 w-4 text-primary" />
                              <h4 className="font-medium text-sm">
                                Aliases &amp; Translations
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {detail.aliases.map((alias) => (
                                <Badge
                                  key={alias.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {alias.alias}{' '}
                                  <span className="text-muted-foreground ml-1">
                                    ({alias.language})
                                  </span>
                                </Badge>
                              ))}
                            </div>
                            {detail.translations?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                                {detail.translations.map((t) => (
                                  <Badge
                                    key={t.id}
                                    variant="outline"
                                    className="text-xs bg-primary/5"
                                  >
                                    {t.language}: {t.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Three-Wing Comparison Tabs */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.1 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">
                              Three-Wing Comparison
                            </h4>
                          </div>
                          <Tabs
                            value={activeWing}
                            onValueChange={setActiveWing}
                            className="w-full"
                          >
                            <TabsList className="w-full grid grid-cols-3 h-auto p-1">
                              {(
                                ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as const
                              ).map((mod) => {
                                const cfg = MODALITY_CONFIG[mod]
                                return (
                                  <TabsTrigger
                                    key={mod}
                                    value={mod}
                                    className={`flex items-center gap-1.5 text-xs data-[state=active]:${cfg.bgClass} data-[state=active]:text-white py-2`}
                                  >
                                    {cfg.icon}
                                    {cfg.label}
                                  </TabsTrigger>
                                )
                              })}
                            </TabsList>

                            {(
                              ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as const
                            ).map((mod) => (
                              <TabsContent key={mod} value={mod} className="mt-3">
                                <WingPanel
                                  wing={detail.wingApproaches?.find(
                                    (w) => w.modality === mod
                                  )}
                                  modality={mod}
                                  medicines={detail.indications ?? []}
                                />
                              </TabsContent>
                            ))}
                          </Tabs>
                        </motion.div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Failed to load issue details</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
