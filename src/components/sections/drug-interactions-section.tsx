'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill,
  Search,
  Plus,
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
  Loader2,
  ChevronRight,
  Syringe,
  Baby,
  Heart,
  Eye,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MedicineSearchResult {
  id: string
  name: string
  modality: string
  genericName?: string
}

interface SelectedMedicine {
  id: string
  name: string
}

interface PairwiseInteraction {
  medicine1: string
  medicine2: string
  interactionType: string
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  effect: string
  recommendation: string
}

interface PopulationSafety {
  pregnancy: { safe: boolean; note: string }
  lactation: { safe: boolean; note: string }
  pediatric: { safe: boolean; note: string }
  geriatric: { safe: boolean; note: string }
  hepaticImpairment: { safe: boolean; note: string }
  renalImpairment: { safe: boolean; note: string }
}

interface DrugInteractionResult {
  safetyScore: number
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  pairwiseInteractions: PairwiseInteraction[]
  contraindications: string[]
  warnings: string[]
  populationSafety: PopulationSafety
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const RISK_LEVEL_CONFIG: Record<string, {
  label: string
  className: string
  icon: React.ElementType
  iconColor: string
}> = {
  LOW: {
    label: 'Low Risk',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    icon: ShieldCheck,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  MODERATE: {
    label: 'Moderate Risk',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
    icon: AlertCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  HIGH: {
    label: 'High Risk',
    className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    icon: ShieldAlert,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  CRITICAL: {
    label: 'Critical Risk',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    icon: ShieldX,
    iconColor: 'text-red-600 dark:text-red-400',
  },
}

const SEVERITY_CELL_CONFIG: Record<string, string> = {
  LOW: 'text-green-700 dark:text-green-300',
  MODERATE: 'text-amber-700 dark:text-amber-300',
  HIGH: 'text-orange-700 dark:text-orange-300',
  CRITICAL: 'text-red-700 dark:text-red-300',
}

const SAFETY_SCORE_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  green: { bar: 'bg-green-500', text: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/30' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  orange: { bar: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  red: { bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/30' },
  critical: { bar: 'bg-red-700', text: 'text-red-900 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-950/50' },
}

function getSafetyTier(score: number): keyof typeof SAFETY_SCORE_COLORS {
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  if (score >= 40) return 'orange'
  if (score >= 20) return 'red'
  return 'critical'
}

const POPULATION_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  pregnancy: { label: 'Pregnancy', icon: Baby },
  lactation: { label: 'Lactation', icon: Baby },
  pediatric: { label: 'Pediatric', icon: Heart },
  geriatric: { label: 'Geriatric', icon: Heart },
  hepaticImpairment: { label: 'Hepatic Impairment', icon: Activity },
  renalImpairment: { label: 'Renal Impairment', icon: Activity },
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function DrugInteractionsSection() {
  // Medicine selection state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([])
  const [selectedMedicines, setSelectedMedicines] = useState<SelectedMedicine[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Results state
  const [results, setResults] = useState<DrugInteractionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllInteractions, setShowAllInteractions] = useState(false)

  // ── Search medicines ───────────────────────

  const searchMedicines = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/medicines?search=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      const list: MedicineSearchResult[] = data.data ?? data.medicines ?? []
      // Filter out already selected
      const selectedIds = selectedMedicines.map((m) => m.id)
      const filtered = list.filter((m) => !selectedIds.includes(m.id))
      setSearchResults(filtered)
      setShowDropdown(filtered.length > 0)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [selectedMedicines])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedicines(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchMedicines])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Medicine management ────────────────────

  const addMedicine = (medicine: MedicineSearchResult) => {
    if (!selectedMedicines.find((m) => m.id === medicine.id)) {
      setSelectedMedicines((prev) => [...prev, { id: medicine.id, name: medicine.name }])
    }
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
    searchInputRef.current?.focus()
  }

  const removeMedicine = (id: string) => {
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== id))
  }

  // ── Check interactions ─────────────────────

  const handleCheckInteractions = async () => {
    if (selectedMedicines.length < 2) {
      toast({
        title: 'Add more medicines',
        description: 'Please add at least 2 medicines to check interactions',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setResults(null)
    setShowAllInteractions(false)

    try {
      const res = await fetch('/api/drug-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineIds: selectedMedicines.map((m) => m.id),
          medicineNames: selectedMedicines.map((m) => m.name),
        }),
      })
      const data = await res.json()
      const result: DrugInteractionResult = data.data ?? data
      setResults(result)

      const riskLabel = RISK_LEVEL_CONFIG[result.riskLevel]?.label ?? result.riskLevel
      toast({
        title: 'Interaction Check Complete',
        description: `Safety score: ${result.safetyScore}/100 — ${riskLabel}`,
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to check drug interactions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ────────────────────────────────

  const safetyTier = results ? getSafetyTier(results.safetyScore) : null
  const tierColors = safetyTier ? SAFETY_SCORE_COLORS[safetyTier] : null

  const visibleInteractions = results?.pairwiseInteractions
    ? showAllInteractions
      ? results.pairwiseInteractions
      : results.pairwiseInteractions.slice(0, 5)
    : []

  // ── Render ─────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div {...fadeSlide} className="space-y-6">
        {/* ── Input Card ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Drug Interaction Checker
            </CardTitle>
            <CardDescription>
              Add medicines to check for potential drug-drug interactions and safety concerns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Medicine Search Input */}
            <div className="space-y-2">
              <Label>Add Medicines</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true)
                    }}
                    placeholder="Search medicines by name..."
                    className="pl-9"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {showDropdown && searchResults.length > 0 && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-lg z-20 overflow-hidden"
                    >
                      <ScrollArea className="max-h-56">
                        {searchResults.map((medicine) => (
                          <button
                            key={medicine.id}
                            type="button"
                            onClick={() => addMedicine(medicine)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-3"
                          >
                            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{medicine.name}</span>
                              {medicine.genericName && (
                                <span className="text-muted-foreground ml-1">({medicine.genericName})</span>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {medicine.modality}
                            </Badge>
                          </button>
                        ))}
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Selected Medicine Tags */}
            {selectedMedicines.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Selected Medicines ({selectedMedicines.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedMedicines.map((med) => (
                      <motion.span
                        key={med.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        <Pill className="h-3.5 w-3.5" />
                        {med.name}
                        <button
                          type="button"
                          onClick={() => removeMedicine(med.id)}
                          className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCheckInteractions}
                disabled={selectedMedicines.length < 2 || loading}
                className="gap-2 min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Check Interactions
                  </>
                )}
              </Button>
              {selectedMedicines.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMedicines([])
                    setSearchQuery('')
                    setResults(null)
                  }}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>

            {selectedMedicines.length > 0 && selectedMedicines.length < 2 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Add at least 2 medicines to check for interactions
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Loading Skeleton ────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ─────────────────────────── */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* ── Safety Score & Risk Meter ────── */}
              <Card className={tierColors ? `border-2 ${tierColors.bg}` : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Score Circle */}
                    <div className="text-center shrink-0">
                      <div className={`text-5xl font-bold tracking-tight ${tierColors?.text ?? ''}`}>
                        {results.safetyScore}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">of 100</div>
                    </div>

                    {/* Risk Meter & Level */}
                    <div className="flex-1 min-w-0 space-y-3 w-full">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold">Safety Score</span>
                        {(() => {
                          const riskCfg = RISK_LEVEL_CONFIG[results.riskLevel]
                          const RiskIcon = riskCfg?.icon ?? ShieldCheck
                          return (
                            <Badge variant="outline" className={`gap-1.5 ${riskCfg?.className ?? ''}`}>
                              <RiskIcon className={`h-3.5 w-3.5 ${riskCfg?.iconColor ?? ''}`} />
                              {riskCfg?.label ?? results.riskLevel}
                            </Badge>
                          )
                        })()}
                      </div>

                      {/* Visual Risk Meter */}
                      <div className="relative w-full">
                        <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                          {/* Background gradient segments */}
                          <div className="flex-1 bg-red-700/30" />
                          <div className="flex-1 bg-red-500/30" />
                          <div className="flex-1 bg-orange-500/30" />
                          <div className="flex-1 bg-amber-500/30" />
                          <div className="flex-1 bg-green-500/30" />
                        </div>
                        {/* Score indicator */}
                        <div
                          className="absolute top-0 left-0 h-4 rounded-full transition-all duration-700"
                          style={{ width: `${results.safetyScore}%` }}
                        >
                          <div className={`h-full w-full rounded-full ${tierColors?.bar ?? 'bg-green-500'}`} />
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Critical</span>
                        <span>High</span>
                        <span>Moderate</span>
                        <span>Low</span>
                        <span>Safe</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Pairwise Interactions Table ──── */}
              {results.pairwiseInteractions && results.pairwiseInteractions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Pairwise Interactions
                    </CardTitle>
                    <CardDescription>
                      {results.pairwiseInteractions.length} interaction{results.pairwiseInteractions.length !== 1 ? 's' : ''} detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Medicine 1</TableHead>
                            <TableHead className="min-w-[120px]">Medicine 2</TableHead>
                            <TableHead className="min-w-[100px]">Type</TableHead>
                            <TableHead className="min-w-[80px]">Severity</TableHead>
                            <TableHead className="min-w-[160px]">Effect</TableHead>
                            <TableHead className="min-w-[160px]">Recommendation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleInteractions.map((interaction, i) => {
                            const severityCfg = RISK_LEVEL_CONFIG[interaction.severity]
                            return (
                              <TableRow key={i}>
                                <TableCell className="font-medium text-sm">{interaction.medicine1}</TableCell>
                                <TableCell className="font-medium text-sm">{interaction.medicine2}</TableCell>
                                <TableCell className="text-sm">{interaction.interactionType}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${severityCfg?.className ?? ''}`}
                                  >
                                    {interaction.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-sm ${SEVERITY_CELL_CONFIG[interaction.severity] ?? ''}`}>
                                  {interaction.effect}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                                  {interaction.recommendation}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {results.pairwiseInteractions.length > 5 && (
                      <div className="mt-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllInteractions(!showAllInteractions)}
                          className="gap-1 text-muted-foreground"
                        >
                          {showAllInteractions ? (
                            <>Show less</>
                          ) : (
                            <>
                              Show all {results.pairwiseInteractions.length} interactions
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Contraindications & Warnings ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contraindications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldX className="h-5 w-5 text-red-500" />
                      Contraindications
                    </CardTitle>
                    <CardDescription>
                      {results.contraindications?.length ?? 0} contraindication(s) found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.contraindications && results.contraindications.length > 0 ? (
                      <ScrollArea className="max-h-64">
                        <ul className="space-y-2">
                          {results.contraindications.map((ci, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                              <span>{ci}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No contraindications detected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Warnings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Warnings
                    </CardTitle>
                    <CardDescription>
                      {results.warnings?.length ?? 0} warning(s) found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.warnings && results.warnings.length > 0 ? (
                      <ScrollArea className="max-h-64">
                        <ul className="space-y-2">
                          {results.warnings.map((warning, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                              <span>{warning}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No warnings detected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Population Safety ───────────── */}
              {results.populationSafety && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Population Safety
                    </CardTitle>
                    <CardDescription>
                      Safety considerations for special populations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(POPULATION_CONFIG).map(([key, cfg]) => {
                        const safetyInfo = results.populationSafety[key as keyof PopulationSafety]
                        if (!safetyInfo) return null
                        const Icon = cfg.icon
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`p-3 rounded-lg border ${
                              safetyInfo.safe
                                ? 'bg-green-50/50 border-green-200/50 dark:bg-green-950/20 dark:border-green-800/30'
                                : 'bg-red-50/50 border-red-200/50 dark:bg-red-950/20 dark:border-red-800/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className={`h-4 w-4 ${safetyInfo.safe ? 'text-green-600' : 'text-red-600'}`} />
                              <span className="text-sm font-medium">{cfg.label}</span>
                              {safetyInfo.safe ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                              )}
                            </div>
                            <p className={`text-xs ${
                              safetyInfo.safe
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {safetyInfo.note}
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Disclaimer ──────────────────────── */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-muted">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Disclaimer:</span>{' '}
            This tool checks for known drug interactions. Always consult your pharmacist or doctor
            before starting, stopping, or combining any medications. Interaction data may not cover
            all possible combinations or individual patient factors.
          </p>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
