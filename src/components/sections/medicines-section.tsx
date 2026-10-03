'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Pill,
  Leaf,
  Sparkles,
  AlertTriangle,
  Shield,
  Clock,
  Utensils,
  Baby,
  Heart,
  Eye,
  Activity,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import type { Modality } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────

interface Ingredient {
  id: string
  name: string
  role: 'ACTIVE' | 'EXCIPIENT'
  strength?: string
  unit?: string
}

interface Indication {
  id: string
  condition: string
  whyToUse: string
  whenToUse: string
  howToUseDaily: string
  medianDose: string
  duration: string
}

interface Contraindication {
  id: string
  condition: string
  severity: 'ABSOLUTE' | 'RELATIVE'
  reason: string
}

interface DrugInteraction {
  id: string
  interactingDrug: string
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE'
  effect: string
  recommendation: string
}

interface Warning {
  id: string
  category: 'BLACK_BOX' | 'PRESCRIBING' | 'PATIENT' | 'PREGNANCY'
  message: string
}

interface SideEffect {
  id: string
  name: string
  frequency: 'VERY_COMMON' | 'COMMON' | 'UNCOMMON' | 'RARE'
  severity: string
}

interface AgeRule {
  id: string
  minAge?: number
  maxAge?: number
  doseAdjustment: string
  notes: string
}

interface PopulationRule {
  id: string
  population: string
  pregnancySafety: 'SAFE' | 'CAUTION' | 'AVOID' | 'CONTRAINDICATED'
  notes: string
}

interface TimingRule {
  id: string
  whenToTake: 'BEFORE_MEAL' | 'WITH_MEAL' | 'AFTER_MEAL' | 'EMPTY_STOMACH' | 'BEDTIME' | 'ANY'
  offsetMinutes?: number
  instructions: string
}

interface FoodInstruction {
  id: string
  type: 'AVOID' | 'TAKE_WITH' | 'LIMIT'
  item: string
  reason: string
}

interface DurationRule {
  id: string
  minDuration?: number
  maxDuration?: number
  defaultDuration: number
  unit: string
  notes: string
}

interface MonitoringRule {
  id: string
  parameter: string
  frequency: string
  threshold?: string
  action?: string
}

interface ActiveRecall {
  id: string
  reason: string
  date: string
  status: string
  details?: string
}

interface MedicineDetail {
  id: string
  name: string
  genericName: string
  modality: Modality | string
  category: string
  form: string
  strength: string
  isOTC: boolean
  brandNames: string[]
  ingredients: Ingredient[]
  indications: Indication[]
  contraindications: Contraindication[]
  drugInteractions: DrugInteraction[]
  warnings: Warning[]
  sideEffects: SideEffect[]
  ageRules: AgeRule[]
  populationRules: PopulationRule[]
  timingRules: TimingRule[]
  foodInstructions: FoodInstruction[]
  durationRules: DurationRule[]
  monitoringRules: MonitoringRule[]
  activeRecalls: ActiveRecall[]
}

interface MedicineListItem {
  id: string
  name: string
  genericName: string
  modality: Modality | string
  category: string
  form: string
  strength: string
  isOTC: boolean
  contraindicationCount: number
  interactionCount: number
  sideEffectCount: number
}

interface CatalogResponse {
  data: MedicineListItem[]
  total: number
  page: number
  limit: number
}

// ─── Color Maps ──────────────────────────────────────────────────────────

const MODALITY_COLORS: Record<string, { bg: string; text: string; border: string; tab: string; tabActive: string }> = {
  ALLOPATHY: {
    bg: 'bg-teal-50 dark:bg-teal-950',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    tab: 'data-[state=active]:bg-teal-600 data-[state=active]:text-white',
    tabActive: 'bg-teal-600 text-white',
  },
  AYURVEDA: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    tab: 'data-[state=active]:bg-emerald-600 data-[state=active]:text-white',
    tabActive: 'bg-emerald-600 text-white',
  },
  HOMEOPATHY: {
    bg: 'bg-violet-50 dark:bg-violet-950',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-300 dark:border-violet-700',
    tab: 'data-[state=active]:bg-violet-600 data-[state=active]:text-white',
    tabActive: 'bg-violet-600 text-white',
  },
}

const MODALITY_ICONS: Record<string, React.ElementType> = {
  ALLOPATHY: Pill,
  AYURVEDA: Leaf,
  HOMEOPATHY: Sparkles,
}

const POPULATION_SAFETY_COLORS: Record<string, string> = {
  SAFE: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  CAUTION: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  AVOID: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  CONTRAINDICATED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
}

const INTERACTION_SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  MODERATE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  MAJOR: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  SEVERE: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
}

const WARNING_CATEGORY_COLORS: Record<string, string> = {
  BLACK_BOX: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  PRESCRIBING: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  PATIENT: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  PREGNANCY: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
}

const SIDE_EFFECT_FREQ_COLORS: Record<string, string> = {
  VERY_COMMON: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  COMMON: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  UNCOMMON: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  RARE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const CONTRA_SEVERITY_COLORS: Record<string, string> = {
  ABSOLUTE: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  RELATIVE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
}

const CATEGORIES = [
  'ALL',
  'ANALGESIC',
  'ANTIBIOTIC',
  'GI',
  'ANTIHYPERTENSIVE',
  'ANTIDIABETIC',
  'ANTIHISTAMINE',
  'CORTICOSTEROID',
  'ANTICOAGULANT',
  'BRONCHODILATOR',
  'STATIN',
  'NSAID',
  'ANTIFUNGAL',
  'ANTIVIRAL',
  'DIURETIC',
] as const

const TIMING_LABELS: Record<string, string> = {
  BEFORE_MEAL: 'Before Meal',
  WITH_MEAL: 'With Meal',
  AFTER_MEAL: 'After Meal',
  EMPTY_STOMACH: 'Empty Stomach',
  BEDTIME: 'Bedtime',
  ANY: 'Any Time',
}

const FOOD_TYPE_COLORS: Record<string, string> = {
  AVOID: 'text-red-600 dark:text-red-400',
  TAKE_WITH: 'text-green-600 dark:text-green-400',
  LIMIT: 'text-amber-600 dark:text-amber-400',
}

const FOOD_TYPE_LABELS: Record<string, string> = {
  AVOID: 'Avoid',
  TAKE_WITH: 'Take With',
  LIMIT: 'Limit',
}

// ─── Animation Presets ───────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

// ─── Sub-components ──────────────────────────────────────────────────────

function SafetyBadges({
  contraindicationCount,
  interactionCount,
  sideEffectCount,
}: {
  contraindicationCount: number
  interactionCount: number
  sideEffectCount: number
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {contraindicationCount > 0 && (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          {contraindicationCount} Contra
        </Badge>
      )}
      {interactionCount > 0 && (
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {interactionCount} Interactions
        </Badge>
      )}
      {sideEffectCount > 0 && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <Info className="h-3 w-3 mr-1" />
          {sideEffectCount} Side Effects
        </Badge>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h3 className="font-semibold text-base">{title}</h3>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      )}
    </div>
  )
}

function DetailIndications({ indications }: { indications: Indication[] }) {
  if (indications.length === 0) return <p className="text-sm text-muted-foreground">No indications listed.</p>
  return (
    <div className="space-y-4">
      {indications.map((ind) => (
        <Card key={ind.id} className="border-l-4 border-l-teal-400 dark:border-l-teal-600">
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold text-sm">{ind.condition}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground font-medium block mb-0.5">Why to Use</span>
                <span>{ind.whyToUse}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block mb-0.5">When to Use</span>
                <span>{ind.whenToUse}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block mb-0.5">How to Use (Daily)</span>
                <span>{ind.howToUseDaily}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block mb-0.5">Median Dose</span>
                <span className="font-mono">{ind.medianDose}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground font-medium block mb-0.5">Duration</span>
                <span>{ind.duration}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DetailContraindications({ items }: { items: Contraindication[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No contraindications listed.</p>
  return (
    <div className="space-y-2">
      {items.map((c) => (
        <div key={c.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Badge variant="outline" className={`shrink-0 text-xs ${CONTRA_SEVERITY_COLORS[c.severity] ?? ''}`}>
            {c.severity}
          </Badge>
          <div>
            <div className="text-sm font-medium">{c.condition}</div>
            <div className="text-xs text-muted-foreground">{c.reason}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailDrugInteractions({ items }: { items: DrugInteraction[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No drug interactions listed.</p>
  return (
    <div className="space-y-2">
      {items.map((di) => (
        <div key={di.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Badge variant="outline" className={`shrink-0 text-xs ${INTERACTION_SEVERITY_COLORS[di.severity] ?? ''}`}>
            {di.severity}
          </Badge>
          <div className="min-w-0">
            <div className="text-sm font-medium">{di.interactingDrug}</div>
            <div className="text-xs text-muted-foreground">Effect: {di.effect}</div>
            <div className="text-xs text-muted-foreground">Recommendation: {di.recommendation}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailWarnings({ items }: { items: Warning[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No warnings listed.</p>
  return (
    <div className="space-y-2">
      {items.map((w) => (
        <div key={w.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Badge variant="outline" className={`shrink-0 text-xs ${WARNING_CATEGORY_COLORS[w.category] ?? ''}`}>
            {w.category.replace('_', ' ')}
          </Badge>
          <p className="text-sm">{w.message}</p>
        </div>
      ))}
    </div>
  )
}

function DetailSideEffects({ items }: { items: SideEffect[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No side effects listed.</p>
  return (
    <div className="space-y-2">
      {items.map((se) => (
        <div key={se.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <span className="text-sm flex-1">{se.name}</span>
          <Badge variant="outline" className={`text-xs ${SIDE_EFFECT_FREQ_COLORS[se.frequency] ?? ''}`}>
            {se.frequency.replace('_', ' ')}
          </Badge>
          <Badge variant="secondary" className="text-xs">{se.severity}</Badge>
        </div>
      ))}
    </div>
  )
}

function DetailIngredients({ items }: { items: Ingredient[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No ingredients listed.</p>
  return (
    <div className="space-y-1">
      {items.map((ing) => (
        <div key={ing.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
          <Badge variant="outline" className={`text-xs shrink-0 ${ing.role === 'ACTIVE' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' : 'bg-muted text-muted-foreground'}`}>
            {ing.role}
          </Badge>
          <span className="font-medium">{ing.name}</span>
          {ing.strength && <span className="text-muted-foreground">{ing.strength}{ing.unit ? ` ${ing.unit}` : ''}</span>}
        </div>
      ))}
    </div>
  )
}

function DetailAgeRules({ items }: { items: AgeRule[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No age-specific rules.</p>
  return (
    <div className="space-y-2">
      {items.map((ar) => (
        <div key={ar.id} className="p-3 rounded-lg bg-muted/50 text-sm">
          <div className="font-medium mb-1">
            Age: {ar.minAge ?? 0} – {ar.maxAge ?? '∞'} years
          </div>
          <div className="text-muted-foreground">Dose: {ar.doseAdjustment}</div>
          {ar.notes && <div className="text-xs text-muted-foreground mt-1">{ar.notes}</div>}
        </div>
      ))}
    </div>
  )
}

function DetailPopulationRules({ items }: { items: PopulationRule[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No population-specific rules.</p>
  return (
    <div className="space-y-2">
      {items.map((pr) => (
        <div key={pr.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
          <Badge variant="outline" className={`shrink-0 text-xs ${POPULATION_SAFETY_COLORS[pr.pregnancySafety] ?? ''}`}>
            {pr.pregnancySafety}
          </Badge>
          <div>
            <div className="font-medium">{pr.population}</div>
            <div className="text-xs text-muted-foreground">{pr.notes}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailTimingRules({ items }: { items: TimingRule[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No timing rules.</p>
  return (
    <div className="space-y-2">
      {items.map((tr) => (
        <div key={tr.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs shrink-0">
            {TIMING_LABELS[tr.whenToTake] ?? tr.whenToTake}
          </Badge>
          <span>{tr.instructions}</span>
          {tr.offsetMinutes != null && (
            <span className="text-xs text-muted-foreground">({tr.offsetMinutes} min offset)</span>
          )}
        </div>
      ))}
    </div>
  )
}

function DetailFoodInstructions({ items }: { items: FoodInstruction[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No food instructions.</p>
  return (
    <div className="space-y-2">
      {items.map((fi) => (
        <div key={fi.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
          <Utensils className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <div>
            <span className={`font-medium ${FOOD_TYPE_COLORS[fi.type] ?? ''}`}>
              {FOOD_TYPE_LABELS[fi.type] ?? fi.type}: {fi.item}
            </span>
            <div className="text-xs text-muted-foreground">{fi.reason}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailDurationRules({ items }: { items: DurationRule[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No duration rules.</p>
  return (
    <div className="space-y-2">
      {items.map((dr) => (
        <div key={dr.id} className="p-3 rounded-lg bg-muted/50 text-sm">
          <div className="font-medium mb-1">
            Default: {dr.defaultDuration} {dr.unit}
            {dr.minDuration != null && dr.maxDuration != null && (
              <span className="text-muted-foreground ml-2">(Range: {dr.minDuration}–{dr.maxDuration} {dr.unit})</span>
            )}
          </div>
          {dr.notes && <div className="text-xs text-muted-foreground">{dr.notes}</div>}
        </div>
      ))}
    </div>
  )
}

function DetailMonitoringRules({ items }: { items: MonitoringRule[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No monitoring rules.</p>
  return (
    <div className="space-y-2">
      {items.map((mr) => (
        <div key={mr.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium">{mr.parameter}</div>
            <div className="text-xs text-muted-foreground">Frequency: {mr.frequency}</div>
            {mr.threshold && <div className="text-xs text-muted-foreground">Threshold: {mr.threshold}</div>}
            {mr.action && <div className="text-xs text-muted-foreground">Action: {mr.action}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailActiveRecalls({ items }: { items: ActiveRecall[] }) {
  if (items.length === 0) return (
    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
      <CheckCircle className="h-4 w-4" />
      No active recalls
    </div>
  )
  return (
    <div className="space-y-2">
      {items.map((ar) => (
        <div key={ar.id} className="p-3 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950 text-sm">
          <div className="font-semibold text-red-800 dark:text-red-200 mb-1">Recall: {ar.reason}</div>
          <div className="text-xs text-red-700 dark:text-red-300">Date: {new Date(ar.date).toLocaleDateString()}</div>
          <div className="text-xs text-red-700 dark:text-red-300">Status: {ar.status}</div>
          {ar.details && <div className="text-xs text-muted-foreground mt-1">{ar.details}</div>}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function MedicinesSection() {
  const { activeModality, setActiveModality, selectedIssueId } = useAppStore()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modality, setModality] = useState<Modality>(activeModality)
  const [category, setCategory] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [medicines, setMedicines] = useState<MedicineListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sync modality from store
  useEffect(() => {
    setModality(activeModality)
  }, [activeModality])

  // Fetch catalog
  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('modality', modality)
      if (category && category !== 'ALL') params.set('category', category)
      if (selectedIssueId) params.set('issueId', selectedIssueId)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/medicine-catalog?${params.toString()}`)
      const data: CatalogResponse = await res.json()
      setMedicines(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setMedicines([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, modality, category, selectedIssueId, page])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, modality, category, selectedIssueId])

  // Fetch medicine detail
  const handleSelectMedicine = async (id: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/medicine-catalog/${id}`)
      const data = await res.json()
      setSelectedMedicine(data.data ?? data)
    } catch {
      setSelectedMedicine(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleModalityChange = (value: string) => {
    const m = value as Modality
    setModality(m)
    setActiveModality(m)
  }

  const modalityConfig = MODALITY_COLORS[modality] ?? MODALITY_COLORS.ALLOPATHY
  const ModalityIcon = MODALITY_ICONS[modality] ?? Pill

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Modality Tabs ── */}
      <Tabs value={modality} onValueChange={handleModalityChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="ALLOPATHY"
            className="gap-1.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Allopathy</span>
          </TabsTrigger>
          <TabsTrigger
            value="AYURVEDA"
            className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Ayurveda</span>
          </TabsTrigger>
          <TabsTrigger
            value="HOMEOPATHY"
            className="gap-1.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Homeopathy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={modality} className="mt-4">
          {/* ── Results header ── */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ModalityIcon className="h-4 w-4" />
              <span>
                {total} medicine{total !== 1 ? 's' : ''} found
                {category !== 'ALL' && ` in ${category}`}
                {selectedIssueId && ' (filtered by issue)'}
              </span>
            </div>
            {totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {/* ── Medicine Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-lg" />
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No medicines found.</p>
              <p className="text-xs mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {medicines.map((med) => {
                const mColors = MODALITY_COLORS[med.modality] ?? MODALITY_COLORS.ALLOPATHY
                const MIcon = MODALITY_ICONS[med.modality] ?? Pill
                return (
                  <motion.div key={med.id} variants={staggerItem}>
                    <Dialog open={detailOpen && selectedMedicine?.id === med.id} onOpenChange={(open) => { if (!open) setDetailOpen(false) }}>
                      <DialogTrigger asChild>
                        <Card
                          className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${mColors.border}`}
                          onClick={() => handleSelectMedicine(med.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${mColors.bg}`}>
                                <MIcon className={`h-5 w-5 ${mColors.text}`} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm truncate">{med.name}</span>
                                  <Badge variant="outline" className={`text-xs shrink-0 ${med.isOTC ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'}`}>
                                    {med.isOTC ? 'OTC' : 'Rx'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{med.genericName}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">{med.category}</Badge>
                                  <Badge variant="outline" className="text-xs">{med.form}</Badge>
                                  <Badge variant="outline" className="text-xs font-mono">{med.strength}</Badge>
                                </div>
                                <SafetyBadges
                                  contraindicationCount={med.contraindicationCount}
                                  interactionCount={med.interactionCount}
                                  sideEffectCount={med.sideEffectCount}
                                />
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
                        <ScrollArea className="max-h-[85vh]">
                          <div className="p-6 space-y-6">
                            {detailLoading ? (
                              <div className="space-y-3">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-32 w-full" />
                              </div>
                            ) : selectedMedicine ? (
                              <>
                                {/* ── Detail Header ── */}
                                <div className="space-y-2">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl">{selectedMedicine.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={`text-xs ${modalityConfig.border} ${modalityConfig.text} ${modalityConfig.bg}`}>
                                      {selectedMedicine.modality}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${selectedMedicine.isOTC ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'}`}>
                                      {selectedMedicine.isOTC ? 'OTC' : 'Prescription'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">{selectedMedicine.category}</Badge>
                                    <Badge variant="outline" className="text-xs">{selectedMedicine.form}</Badge>
                                    <Badge variant="outline" className="text-xs font-mono">{selectedMedicine.strength}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Generic: <span className="font-medium">{selectedMedicine.genericName}</span>
                                  </p>
                                </div>

                                {/* ── Active Recalls Alert ── */}
                                {selectedMedicine.activeRecalls.length > 0 && (
                                  <div className="p-4 rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950">
                                    <SectionHeader icon={AlertTriangle} title="Active Recalls" count={selectedMedicine.activeRecalls.length} />
                                    <DetailActiveRecalls items={selectedMedicine.activeRecalls} />
                                  </div>
                                )}

                                <Separator />

                                {/* ── Accordion Sections ── */}
                                <Accordion type="multiple" defaultValue={['indications', 'composition', 'contraindications', 'interactions']} className="space-y-1">
                                  {/* Indications */}
                                  <AccordionItem value="indications">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-teal-500" />
                                        <span className="font-semibold">Indications</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.indications.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailIndications indications={selectedMedicine.indications} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Brand Names & Composition */}
                                  <AccordionItem value="composition">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Pill className="h-4 w-4 text-blue-500" />
                                        <span className="font-semibold">Brand Names &amp; Composition</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.ingredients.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                      {selectedMedicine.brandNames.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-medium mb-2">Brand Names</h4>
                                          <div className="flex flex-wrap gap-1.5">
                                            {selectedMedicine.brandNames.map((bn, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">{bn}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Ingredients / Composition</h4>
                                        <DetailIngredients items={selectedMedicine.ingredients} />
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Contraindications */}
                                  <AccordionItem value="contraindications">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span className="font-semibold">Contraindications</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.contraindications.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailContraindications items={selectedMedicine.contraindications} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Drug Interactions */}
                                  <AccordionItem value="interactions">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <span className="font-semibold">Drug Interactions</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.drugInteractions.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailDrugInteractions items={selectedMedicine.drugInteractions} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Warnings */}
                                  <AccordionItem value="warnings">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-orange-500" />
                                        <span className="font-semibold">Warnings</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.warnings.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailWarnings items={selectedMedicine.warnings} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Side Effects */}
                                  <AccordionItem value="side-effects">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-pink-500" />
                                        <span className="font-semibold">Side Effects</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.sideEffects.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailSideEffects items={selectedMedicine.sideEffects} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Age Rules */}
                                  <AccordionItem value="age-rules">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Baby className="h-4 w-4 text-sky-500" />
                                        <span className="font-semibold">Age / Pediatric Dosing</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.ageRules.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailAgeRules items={selectedMedicine.ageRules} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Population Rules */}
                                  <AccordionItem value="population-rules">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-rose-500" />
                                        <span className="font-semibold">Population Rules (Pregnancy Safety)</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.populationRules.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailPopulationRules items={selectedMedicine.populationRules} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Timing Rules */}
                                  <AccordionItem value="timing-rules">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-indigo-500" />
                                        <span className="font-semibold">Timing Rules</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.timingRules.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailTimingRules items={selectedMedicine.timingRules} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Food Instructions */}
                                  <AccordionItem value="food-instructions">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Utensils className="h-4 w-4 text-yellow-600" />
                                        <span className="font-semibold">Food Instructions</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.foodInstructions.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailFoodInstructions items={selectedMedicine.foodInstructions} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Duration Rules */}
                                  <AccordionItem value="duration-rules">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-teal-500" />
                                        <span className="font-semibold">Duration Rules</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.durationRules.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailDurationRules items={selectedMedicine.durationRules} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Monitoring Rules */}
                                  <AccordionItem value="monitoring-rules">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-cyan-500" />
                                        <span className="font-semibold">Monitoring Rules</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.monitoringRules.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailMonitoringRules items={selectedMedicine.monitoringRules} />
                                    </AccordionContent>
                                  </AccordionItem>

                                  {/* Active Recalls (in accordion too) */}
                                  <AccordionItem value="recalls">
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <span className="font-semibold">Active Recalls</span>
                                        <Badge variant="secondary" className="text-xs">{selectedMedicine.activeRecalls.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DetailActiveRecalls items={selectedMedicine.activeRecalls} />
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Could not load medicine details.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
