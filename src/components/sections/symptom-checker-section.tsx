'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Plus,
  X,
  Search,
  AlertTriangle,
  Activity,
  Heart,
  Brain,
  ShieldAlert,
  Pill,
  Leaf,
  FlaskConical,
  ChevronRight,
  Info,
  Loader2,
  Thermometer,
  Zap,
  Mic,
  Sparkles,
  Siren,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import type { Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface WingApproach {
  modality: string
  approach: string
  commonMedicines: string[]
}

interface SafetyWarning {
  type: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

interface MatchedIssue {
  id: string
  name: string
  bodySystem: string
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  relevanceScore: number
  description: string
  wingApproaches: WingApproach[]
  topMedicines: { name: string; modality: string }[]
  safetyWarnings: SafetyWarning[]
}

interface SymptomCheckResult {
  matchedIssues: MatchedIssue[]
  summary: string
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const COMMON_SYMPTOMS = [
  'headache', 'fever', 'cough', 'cold', 'fatigue', 'body pain',
  'nausea', 'dizziness', 'chest pain', 'breathing difficulty',
  'stomach pain', 'back pain', 'joint pain', 'skin rash',
  'sore throat', 'vomiting', 'diarrhea', 'constipation',
  'anxiety', 'depression', 'insomnia', 'pet dard',
  'sir dard', 'bukhar', 'khasi', 'dast',
]

const AGE_OPTIONS = [
  { value: '0-2', label: '0–2 years (Infant)' },
  { value: '3-12', label: '3–12 years (Child)' },
  { value: '13-17', label: '13–17 years (Adolescent)' },
  { value: '18-39', label: '18–39 years (Young Adult)' },
  { value: '40-59', label: '40–59 years (Middle Age)' },
  { value: '60-74', label: '60–74 years (Senior)' },
  { value: '75+', label: '75+ years (Elderly)' },
]

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

const MODALITY_CONFIG: Record<Modality, { label: string; icon: React.ElementType; color: string }> = {
  ALLOPATHY: { label: 'Allopathy', icon: Pill, color: 'text-teal-600 dark:text-teal-400' },
  AYURVEDA: { label: 'Ayurveda', icon: Leaf, color: 'text-emerald-600 dark:text-emerald-400' },
  HOMEOPATHY: { label: 'Homeopathy', icon: FlaskConical, color: 'text-violet-600 dark:text-violet-400' },
}

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
  MODERATE: { label: 'Moderate', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700' },
}

const BODY_SYSTEM_ICONS: Record<string, React.ElementType> = {
  NERVOUS: Brain,
  CARDIOVASCULAR: Heart,
  RESPIRATORY: Activity,
  MUSCULOSKELETAL: Zap,
  DIGESTIVE: Thermometer,
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function SymptomCheckerSection() {
  const { activeModality, setActiveSection } = useAppStore()

  // Form state
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [symptomInput, setSymptomInput] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [modality, setModality] = useState<Modality>(activeModality)

  // Suggestion state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Results state
  const [results, setResults] = useState<SymptomCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)

  // Lab values state
  const [labValues, setLabValues] = useState<Array<{ test: string; value: number }>>([])
  const [labTestInput, setLabTestInput] = useState('')
  const [labValueInput, setLabValueInput] = useState('')
  const [showLabInput, setShowLabInput] = useState(false)

  // Live AI suggestions state
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const liveDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Clinical assistant detailed response
  const [clinicalResponse, setClinicalResponse] = useState<{
    aiEnhancedResponse?: string | null
    knowledgeBaseResponse?: {
      conditionName: string
      patientFriendlySummary: string
      allopathy: Array<{ medicineName: string; genericName: string; dosage: string; frequency: string; reasoning: string; isFirstLine: boolean; isPrescription: boolean; indianBrandNames: string[]; janAushadhiAvailable: boolean; janAushadhiPrice?: string; sideEffects: string[]; precautions: string[] }>
      ayurveda: Array<{ medicineName: string; genericName: string; dosage: string; frequency: string; reasoning: string; isFirstLine: boolean; sideEffects: string[]; precautions: string[] }>
      homeopathy: Array<{ medicineName: string; genericName: string; dosage: string; frequency: string; reasoning: string; isFirstLine: boolean; sideEffects: string[]; precautions: string[] }>
      lifestyle: string[]
      diet: string[]
      redFlags: string[]
      followUp: string[]
      whenToSeeDoctor: string
    } | null
    labInterpretations?: Array<{ testName: string; value: number; unit: string; status: string; clinicalSignificance: string; recommendedAction: string }>
    matchedConditions?: Array<{ key: string; name: string; confidence: number }>
    disclaimer?: string
  } | null>(null)

  const LAB_TEST_OPTIONS = [
    'HbA1c', 'Fasting Glucose', 'Total Cholesterol', 'LDL', 'HDL', 'Triglycerides',
    'TSH', 'Free T4', 'Hemoglobin', 'Creatinine', 'eGFR', 'Vitamin D', 'Vitamin B12',
    'Ferritin', 'ALT', 'AST', 'CRP', 'ESR', 'PSA', 'Uric Acid',
  ]

  // Red flag detection
  const RED_FLAG_SYMPTOMS = new Set(['chest pain', 'breathing difficulty', 'severe headache', 'sudden vision loss', 'slurred speech', 'weakness on one side', 'severe bleeding', 'high fever', 'seizure', 'loss of consciousness'])
  const detectedRedFlags = symptoms.filter((s) => RED_FLAG_SYMPTOMS.has(s.toLowerCase()))

  // ── Symptom management ─────────────────────

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim().toLowerCase()
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed])
    }
    setSymptomInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeSymptom = (symptom: string) => {
    setSymptoms((prev) => prev.filter((s) => s !== symptom))
  }

  const handleSymptomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && symptomInput.trim()) {
      e.preventDefault()
      addSymptom(symptomInput)
    }
    if (e.key === 'Backspace' && !symptomInput && symptoms.length > 0) {
      setSymptoms((prev) => prev.slice(0, -1))
    }
  }

  const handleSymInputChange = (value: string) => {
    setSymptomInput(value)
    if (value.trim()) {
      const lower = value.toLowerCase()
      const filtered = COMMON_SYMPTOMS.filter(
        (s) => s.includes(lower) && !symptoms.includes(s)
      )
      setFilteredSuggestions(filtered.slice(0, 8))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Submit handler ─────────────────────────

  const handleCheckSymptoms = async () => {
    if (symptoms.length === 0) {
      toast({ title: 'Add symptoms', description: 'Please add at least one symptom', variant: 'destructive' })
      return
    }
    if (!age) {
      toast({ title: 'Select age group', description: 'Please select your age range', variant: 'destructive' })
      return
    }
    if (!gender) {
      toast({ title: 'Select gender', description: 'Please select your gender', variant: 'destructive' })
      return
    }

    setLoading(true)
    setResults(null)
    setExpandedIssue(null)

    try {
      const res = await fetch('/api/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, age, gender, modality }),
      })
      const data = await res.json()
      const result: SymptomCheckResult = data.data ?? data
      setResults(result)
      toast({
        title: 'Symptom Check Complete',
        description: `${result.matchedIssues?.length ?? 0} possible conditions found`,
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to check symptoms', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ────────────────────────────────

  const canSubmit = symptoms.length > 0 && age && gender

  const getSeverityBadge = (severity: string) => {
    const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.MODERATE
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400'
    if (score >= 60) return 'text-orange-600 dark:text-orange-400'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getWarningIcon = (severity: string) => {
    if (severity === 'CRITICAL') return <ShieldAlert className="h-4 w-4 text-red-500" />
    if (severity === 'WARNING') return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <Info className="h-4 w-4 text-teal-500" />
  }

  // ── Render ─────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div {...fadeSlide} className="space-y-6">
        {/* ── Red Flag Detection Banner ── */}
        {detectedRedFlags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950"
          >
            <Siren className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200 text-sm">
                Red Flag Symptoms Detected!
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                The following symptoms require immediate medical attention:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedRedFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                    {flag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 font-medium">
                Please seek emergency care or call 108 (India Emergency) immediately.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Input Card ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Symptom Checker
            </CardTitle>
            <CardDescription>
              Enter your symptoms to get potential health insights across modalities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Symptom Tags Input */}
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <AnimatePresence>
                  {symptoms.map((symptom) => (
                    <motion.span
                      key={symptom}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {symptom}
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom)}
                        className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={symptomInput}
                    onChange={(e) => handleSymInputChange(e.target.value)}
                    onKeyDown={handleSymptomKeyDown}
                    onFocus={() => {
                      if (symptomInput.trim()) handleSymInputChange(symptomInput)
                    }}
                    placeholder={symptoms.length === 0 ? 'Type a symptom (e.g. headache, fever, pet dard)...' : 'Add more...'}
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="border rounded-lg bg-popover shadow-md overflow-hidden z-10"
                  >
                    <ScrollArea className="max-h-48">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addSymptom(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          {suggestion}
                        </button>
                      ))}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
              {symptoms.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Press Enter or select from suggestions to add symptoms
                </p>
              )}
            </div>

            {/* Age, Gender, Modality Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div className="space-y-2">
                <Label>Age Group</Label>
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modality */}
              <div className="space-y-2">
                <Label>Treatment Modality</Label>
                <Select value={modality} onValueChange={(v) => setModality(v as Modality)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODALITY_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lab Values Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Lab Values (Optional)</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowLabInput(!showLabInput)}>
                  <Plus className="h-3 w-3" />
                  {showLabInput ? 'Hide' : 'Add Lab Values'}
                </Button>
              </div>
              {showLabInput && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select value={labTestInput} onValueChange={setLabTestInput}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select test..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LAB_TEST_OPTIONS.map((test) => (
                          <SelectItem key={test} value={test}>{test}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Value"
                      value={labValueInput}
                      onChange={(e) => setLabValueInput(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!labTestInput || !labValueInput}
                      onClick={() => {
                        const num = parseFloat(labValueInput)
                        if (!isNaN(num)) {
                          setLabValues([...labValues, { test: labTestInput, value: num }])
                          setLabTestInput('')
                          setLabValueInput('')
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  {labValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {labValues.map((lv, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1 bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                          {lv.test}: {lv.value}
                          <button onClick={() => setLabValues(labValues.filter((_, i) => i !== idx))} className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">e.g., HbA1c: 7.8, Total Cholesterol: 360, TSH: 8.5 — helps the AI give specific medicine recommendations</p>
                </div>
              )}
              {labValues.length > 0 && !showLabInput && (
                <div className="flex flex-wrap gap-1.5">
                  {labValues.map((lv, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                      {lv.test}: {lv.value}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Check Button */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleCheckSymptoms}
                disabled={!canSubmit || loading}
                className="gap-2 min-w-[180px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Check Symptoms
                  </>
                )}
              </Button>
              {/* Voice Input Button */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveSection('voice')}
              >
                <Mic className="h-4 w-4" />
                Voice Input
              </Button>
              {/* Ask the Doctor AI — Clinical Assistant */}
              <Button
                variant="outline"
                className="gap-2"
                disabled={symptoms.length === 0 || aiLoading}
                onClick={async () => {
                  setAiLoading(true)
                  setAiResult(null)
                  setClinicalResponse(null)
                  try {
                    const queryText = symptoms.join(', ')
                    const res = await fetch('/api/clinical-assistant', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        query: queryText,
                        labValues: labValues.length > 0 ? labValues : undefined,
                        modality: modality,
                        language: 'en',
                        includeAllWings: true,
                      }),
                    })
                    const data = await res.json()
                    if (data.data) {
                      setClinicalResponse(data.data)
                      setAiResult(data.data.aiEnhancedResponse || data.data.knowledgeBaseResponse?.patientFriendlySummary || null)
                      toast({ title: '🩺 Doctor AI Analysis Complete', description: 'Detailed clinical guidance with medicines, dosages, and reasoning loaded below' })
                    } else {
                      setAiResult('Clinical analysis is currently unavailable. Please try again later.')
                      toast({ title: 'AI Unavailable', variant: 'destructive' })
                    }
                  } catch {
                    setAiResult('AI clinical analysis is currently unavailable. Please try again later.')
                    toast({ title: 'AI Unavailable', variant: 'destructive' })
                  } finally {
                    setAiLoading(false)
                  }
                }}
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Ask Doctor AI
              </Button>
              {symptoms.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSymptoms([])
                    setSymptomInput('')
                    setResults(null)
                    setAiResult(null)
                  }}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
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
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
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
              {/* Summary */}
              {results.summary && (
                <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
                  {results.summary}
                </div>
              )}

              {/* Matched Issues */}
              {results.matchedIssues && results.matchedIssues.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Possible Conditions ({results.matchedIssues.length})
                  </h3>
                  {results.matchedIssues.map((issue, index) => {
                    const SystemIcon = BODY_SYSTEM_ICONS[issue.bodySystem?.toUpperCase()] ?? Activity
                    const isExpanded = expandedIssue === issue.id
                    const wingForModality = issue.wingApproaches?.find(
                      (w) => w.modality === modality
                    )

                    return (
                      <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            {/* Issue Header */}
                            <button
                              type="button"
                              onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                              className="w-full text-left p-4 flex items-start gap-4 hover:bg-accent/30 transition-colors"
                            >
                              <div className="shrink-0 mt-0.5">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <SystemIcon className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-base">{issue.name}</span>
                                  {getSeverityBadge(issue.severity)}
                                  <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                                    {issue.bodySystem}
                                  </Badge>
                                </div>
                                {issue.description && (
                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                    {issue.description}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground">Relevance</span>
                                    <div className="w-24">
                                      <Progress
                                        value={issue.relevanceScore}
                                        className="h-2"
                                      />
                                    </div>
                                    <span className={`text-sm font-semibold ${getRelevanceColor(issue.relevanceScore)}`}>
                                      {issue.relevanceScore}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight
                                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </button>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                                    {/* Wing Approach for Selected Modality */}
                                    <div className="pt-4">
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <ModalityBadge modality={modality} />
                                        <span>Approach</span>
                                      </h4>
                                      {wingForModality ? (
                                        <div className="space-y-2">
                                          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                            {wingForModality.approach}
                                          </p>
                                          {wingForModality.commonMedicines && wingForModality.commonMedicines.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                              {wingForModality.commonMedicines.map((med) => (
                                                <Badge key={med} variant="secondary" className="text-xs">
                                                  {med}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                          No specific {MODALITY_CONFIG[modality].label} approach documented for this condition
                                        </p>
                                      )}
                                    </div>

                                    <Separator />

                                    {/* All Wing Approaches */}
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2">All Modality Approaches</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {issue.wingApproaches?.map((wing) => {
                                          const WingIcon = MODALITY_CONFIG[wing.modality as Modality]?.icon ?? Pill
                                          const wingColor = MODALITY_CONFIG[wing.modality as Modality]?.color ?? 'text-muted-foreground'
                                          return (
                                            <div
                                              key={wing.modality}
                                              className="p-3 rounded-lg border bg-card"
                                            >
                                              <div className="flex items-center gap-2 mb-2">
                                                <WingIcon className={`h-4 w-4 ${wingColor}`} />
                                                <ModalityBadge modality={wing.modality} />
                                              </div>
                                              <p className="text-xs text-muted-foreground line-clamp-3">
                                                {wing.approach}
                                              </p>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Top Recommended Medicines */}
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2">Top Recommended Medicines</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {issue.topMedicines?.map((med, i) => (
                                          <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                              <Badge
                                                variant="outline"
                                                className="gap-1.5 cursor-default"
                                              >
                                                {MODALITY_CONFIG[med.modality as Modality]?.label?.charAt(0) ?? '?'}
                                                <span className="text-muted-foreground">·</span>
                                                {med.name}
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{med.name} ({MODALITY_CONFIG[med.modality as Modality]?.label ?? med.modality})</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                        {(!issue.topMedicines || issue.topMedicines.length === 0) && (
                                          <p className="text-sm text-muted-foreground italic">No specific medicines listed</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Safety Warnings */}
                                    {issue.safetyWarnings && issue.safetyWarnings.length > 0 && (
                                      <>
                                        <Separator />
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            Safety Warnings
                                          </h4>
                                          <div className="space-y-2">
                                            {issue.safetyWarnings.map((warning, i) => (
                                              <div
                                                key={i}
                                                className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/50 dark:bg-amber-950/30 dark:border-amber-800/30"
                                              >
                                                {getWarningIcon(warning.severity)}
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200 uppercase">
                                                    {warning.type}
                                                  </span>
                                                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                                                    {warning.message}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No matching conditions found for the given symptoms.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adding more specific symptoms or different terms.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Analysis Result / Clinical Assistant Response ── */}
        <AnimatePresence>
          {(aiResult || clinicalResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-4"
            >
              {/* Lab Interpretations */}
              {clinicalResponse?.labInterpretations && clinicalResponse.labInterpretations.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-blue-600" />
                      Lab Value Interpretation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clinicalResponse.labInterpretations.map((lab, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${lab.status.includes('CRITICAL') ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700' : lab.status === 'HIGH' || lab.status === 'LOW' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700' : 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700'}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{lab.testName}</span>
                            <Badge variant="outline" className={lab.status.includes('CRITICAL') ? 'bg-red-100 text-red-800 border-red-300' : lab.status === 'HIGH' || lab.status === 'LOW' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-green-100 text-green-800 border-green-300'}>
                              {lab.value} {lab.unit} — {lab.status}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2">{lab.clinicalSignificance}</p>
                          <p className="text-sm mt-1 font-medium">Action: {lab.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matched Conditions from KB */}
              {clinicalResponse?.matchedConditions && clinicalResponse.matchedConditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Possible Conditions:</span>
                  {clinicalResponse.matchedConditions.map((mc, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1 bg-primary/5">
                      {mc.name}
                      <span className="text-xs text-muted-foreground">({mc.confidence}%)</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Knowledge Base Structured Response */}
              {clinicalResponse?.knowledgeBaseResponse && (
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                      {clinicalResponse.knowledgeBaseResponse.conditionName} — Structured Clinical Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Allopathy */}
                    {clinicalResponse.knowledgeBaseResponse.allopathy.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <Pill className="h-4 w-4 text-teal-600" /> 💊 Allopathy Recommendations
                        </h4>
                        <div className="space-y-3">
                          {clinicalResponse.knowledgeBaseResponse.allopathy.map((med, idx) => (
                            <div key={idx} className="p-3 rounded-lg border bg-card space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{med.medicineName}</span>
                                <span className="text-sm text-muted-foreground">({med.genericName})</span>
                                {med.isFirstLine && <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-xs">⭐ First-line</Badge>}
                                {med.isPrescription && <Badge variant="outline" className="text-xs">🔒 Prescription</Badge>}
                                {med.janAushadhiAvailable && <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-300">💊 Jan Aushadhi</Badge>}
                              </div>
                              {med.indianBrandNames?.length > 0 && (
                                <p className="text-xs text-muted-foreground">Indian Brands: {med.indianBrandNames.join(', ')}</p>
                              )}
                              <p className="text-sm"><strong>Dosage:</strong> {med.dosage} — {med.frequency} — {med.duration}</p>
                              <p className="text-sm text-muted-foreground"><strong>Why this medicine?</strong> {med.reasoning}</p>
                              {med.precautions?.length > 0 && <p className="text-xs"><strong>Precautions:</strong> {med.precautions.join('; ')}</p>}
                              {med.sideEffects?.length > 0 && <p className="text-xs"><strong>Side Effects:</strong> {med.sideEffects.join('; ')}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Ayurveda */}
                    {clinicalResponse.knowledgeBaseResponse.ayurveda.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <Leaf className="h-4 w-4 text-emerald-600" /> 🌿 Ayurveda Recommendations
                        </h4>
                        <div className="space-y-3">
                          {clinicalResponse.knowledgeBaseResponse.ayurveda.map((med, idx) => (
                            <div key={idx} className="p-3 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{med.medicineName}</span>
                                <span className="text-sm text-muted-foreground">({med.genericName})</span>
                                {med.isFirstLine && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">⭐ First-line</Badge>}
                              </div>
                              <p className="text-sm"><strong>Dosage:</strong> {med.dosage} — {med.frequency} — {med.duration}</p>
                              <p className="text-sm text-muted-foreground"><strong>Why?</strong> {med.reasoning}</p>
                              {med.precautions?.length > 0 && <p className="text-xs"><strong>Precautions:</strong> {med.precautions.join('; ')}</p>}
                              {med.sideEffects?.length > 0 && <p className="text-xs"><strong>Side Effects:</strong> {med.sideEffects.join('; ')}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Homeopathy */}
                    {clinicalResponse.knowledgeBaseResponse.homeopathy.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <FlaskConical className="h-4 w-4 text-violet-600" /> 🔮 Homeopathy Recommendations
                        </h4>
                        <div className="space-y-3">
                          {clinicalResponse.knowledgeBaseResponse.homeopathy.map((med, idx) => (
                            <div key={idx} className="p-3 rounded-lg border bg-violet-50/30 dark:bg-violet-950/20 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{med.medicineName}</span>
                                <span className="text-sm text-muted-foreground">({med.genericName})</span>
                                {med.isFirstLine && <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-xs">⭐ First-line</Badge>}
                              </div>
                              <p className="text-sm"><strong>Dosage:</strong> {med.dosage} — {med.frequency} — {med.duration}</p>
                              <p className="text-sm text-muted-foreground"><strong>Why?</strong> {med.reasoning}</p>
                              {med.precautions?.length > 0 && <p className="text-xs"><strong>Precautions:</strong> {med.precautions.join('; ')}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Lifestyle */}
                    {clinicalResponse.knowledgeBaseResponse.lifestyle.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">🏃 Lifestyle Advice</h4>
                        <ul className="text-sm space-y-1 list-disc pl-4">
                          {clinicalResponse.knowledgeBaseResponse.lifestyle.map((l, idx) => <li key={idx}>{l}</li>)}
                        </ul>
                      </div>
                    )}
                    {/* Diet */}
                    {clinicalResponse.knowledgeBaseResponse.diet.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">🥗 Diet Advice</h4>
                        <ul className="text-sm space-y-1 list-disc pl-4">
                          {clinicalResponse.knowledgeBaseResponse.diet.map((d, idx) => <li key={idx}>{d}</li>)}
                        </ul>
                      </div>
                    )}
                    {/* Red Flags */}
                    {clinicalResponse.knowledgeBaseResponse.redFlags.length > 0 && (
                      <div className="p-3 rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                          <Siren className="h-4 w-4" /> 🚩 Red Flags — Seek Immediate Help
                        </h4>
                        <ul className="text-sm space-y-1 list-disc pl-4 text-red-700 dark:text-red-300">
                          {clinicalResponse.knowledgeBaseResponse.redFlags.filter(f => f.startsWith('🚩')).map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {/* Follow-up */}
                    {clinicalResponse.knowledgeBaseResponse.followUp.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">📅 Follow-up</h4>
                        <ul className="text-sm space-y-1 list-disc pl-4">
                          {clinicalResponse.knowledgeBaseResponse.followUp.map((f, idx) => <li key={idx}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    {/* When to see doctor */}
                    {clinicalResponse.knowledgeBaseResponse.whenToSeeDoctor && (
                      <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600" /> When to See a Doctor
                        </h4>
                        <p className="text-sm">{clinicalResponse.knowledgeBaseResponse.whenToSeeDoctor}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Enhanced Response (Markdown) */}
              {aiResult && (
                <Card className="border-teal-200 dark:border-teal-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-teal-600" />
                      🩺 Doctor AI — Comprehensive Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[500px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {aiResult}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              {clinicalResponse?.disclaimer && (
                <div className="p-3 rounded-lg bg-muted/40 border border-muted text-xs text-muted-foreground">
                  {clinicalResponse.disclaimer}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Disclaimer ──────────────────────── */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-muted">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Disclaimer:</span>{' '}
            This is for informational purposes only. Always consult a qualified healthcare professional
            for proper diagnosis and treatment. Results are based on symptom matching and should not be
            considered a medical diagnosis.
          </p>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
