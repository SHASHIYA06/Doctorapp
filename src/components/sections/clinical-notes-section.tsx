'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, PenLine, Lock, Unlock, Brain, Heart, Activity, Stethoscope,
  Plus, Search, Check, ChevronRight, X, Sparkles, Save, Clock, User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────

type NoteType = 'SOAP' | 'PROGRESS' | 'DISCHARGE' | 'REFERRAL' | 'PROCEDURE'

interface VitalSigns {
  bp?: string
  hr?: string
  temp?: string
  spo2?: string
  rr?: string
  weight?: string
}

interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface ClinicalNote {
  id: string
  patientId: string
  patientName: string
  type: NoteType
  modality: Modality
  soap: SOAPData
  vitals: VitalSigns
  signed: boolean
  signedBy: string | null
  signedAt: string | null
  practitionerName: string
  summary: string | null
  createdAt: string
  updatedAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ── Config ───────────────────────────────────────────────────────────────

const NOTE_TYPES: NoteType[] = ['SOAP', 'PROGRESS', 'DISCHARGE', 'REFERRAL', 'PROCEDURE']

const SOAP_COLORS = {
  subjective: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  objective: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20',
  assessment: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  plan: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/20',
}

const SOAP_LABELS = {
  subjective: { letter: 'S', label: 'Subjective', color: 'text-blue-700 dark:text-blue-300', icon: User },
  objective: { letter: 'O', label: 'Objective', color: 'text-green-700 dark:text-green-300', icon: Activity },
  assessment: { letter: 'A', label: 'Assessment', color: 'text-amber-700 dark:text-amber-300', icon: Stethoscope },
  plan: { letter: 'P', label: 'Plan', color: 'text-teal-700 dark:text-teal-300', icon: Heart },
}

const VITAL_FIELDS: { key: keyof VitalSigns; label: string; unit: string; placeholder: string }[] = [
  { key: 'bp', label: 'BP', unit: 'mmHg', placeholder: '120/80' },
  { key: 'hr', label: 'HR', unit: 'bpm', placeholder: '72' },
  { key: 'temp', label: 'Temp', unit: '°C', placeholder: '37.0' },
  { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
  { key: 'rr', label: 'RR', unit: '/min', placeholder: '16' },
  { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '70' },
]

const COMMON_DIAGNOSES = [
  'Hypertension', 'Type 2 Diabetes', 'Acute Bronchitis', 'Migraine',
  'Gastroesophageal Reflux', 'Anxiety Disorder', 'Osteoarthritis', 'Asthma',
  'Urinary Tract Infection', 'Iron Deficiency Anemia',
]

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ────────────────────────────────────────────────────────────

export function ClinicalNotesSection() {
  const { activeModality, selectedPatientId } = useAppStore()

  // Data
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Modality filter
  const [modalityFilter, setModalityFilter] = useState<Modality>(activeModality)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<NoteType | 'ALL'>('ALL')

  // New note form
  const [isCreating, setIsCreating] = useState(false)
  const [formPatientId, setFormPatientId] = useState(selectedPatientId ?? '')
  const [formType, setFormType] = useState<NoteType>('SOAP')
  const [formModality, setFormModality] = useState<Modality>(activeModality)
  const [formSOAP, setFormSOAP] = useState<SOAPData>({ subjective: '', objective: '', assessment: '', plan: '' })
  const [formVitals, setFormVitals] = useState<VitalSigns>({})
  const [formPractitioner, setFormPractitioner] = useState('Dr. Sharma')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // AI summary
  const [aiGenerating, setAiGenerating] = useState(false)

  // Detail view
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null)

  // Sign dialog
  const [signDialogNote, setSignDialogNote] = useState<ClinicalNote | null>(null)
  const [signSubmitting, setSignSubmitting] = useState(false)

  // Diagnosis suggestions
  const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false)

  // ── Load Data ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [notesRes, patRes] = await Promise.all([
        fetch('/api/clinical-notes').then((r) => r.json()),
        fetch('/api/patients').then((r) => r.json()),
      ])
      const rawNotes = notesRes.data ?? notesRes.notes ?? []
      const noteList = rawNotes.map((n: Record<string, unknown>) => {
        const patient = n.patient as Record<string, string> | undefined
        const practitioner = n.practitioner as Record<string, string> | undefined
        return {
          id: n.id as string,
          patientId: (n.patientId ?? '') as string,
          patientName: (patient ? `${patient.firstName} ${patient.lastName}` : (n.patientName ?? 'Unknown')) as string,
          type: ((n.noteType ?? n.type ?? 'SOAP') as string) as NoteType,
          modality: (n.modality ?? 'ALLOPATHY') as Modality,
          soap: {
            subjective: ((n.subjective ?? (n.soap as Record<string, string>)?.subjective ?? '') as string),
            objective: ((n.objective ?? (n.soap as Record<string, string>)?.objective ?? '') as string),
            assessment: ((n.assessment ?? (n.soap as Record<string, string>)?.assessment ?? '') as string),
            plan: ((n.plan ?? (n.soap as Record<string, string>)?.plan ?? '') as string),
          } as SOAPData,
          vitals: (n.vitals ?? {}) as VitalSigns,
          signed: (n.isSigned ?? n.signed ?? false) as boolean,
          signedBy: (n.signedBy ?? (practitioner ? practitioner.name : null)) as string | null,
          signedAt: (n.signedAt ?? null) as string | null,
          practitionerName: (practitioner ? practitioner.name : (n.practitionerName ?? 'Unknown')) as string,
          summary: (n.summary ?? null) as string | null,
          createdAt: (n.createdAt ?? new Date().toISOString()) as string,
          updatedAt: (n.updatedAt ?? new Date().toISOString()) as string,
        }
      })
      setNotes(noteList)
      setPatients(patRes.data ?? patRes.patients ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load clinical notes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Filtered Notes ─────────────────────────────────────────────────────

  const filteredNotes = useMemo(() => {
    let list = notes.filter((n) => n.modality === modalityFilter)

    if (typeFilter !== 'ALL') {
      list = list.filter((n) => n.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (n) =>
          n.patientName.toLowerCase().includes(q) ||
          n.soap.subjective.toLowerCase().includes(q) ||
          n.soap.assessment.toLowerCase().includes(q) ||
          n.practitionerName.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, modalityFilter, typeFilter, searchQuery])

  // ── SOAP Update Helper ─────────────────────────────────────────────────

  const updateSOAP = (field: keyof SOAPData, value: string) => {
    setFormSOAP((prev) => ({ ...prev, [field]: value }))
  }

  const updateVital = (key: keyof VitalSigns, value: string) => {
    setFormVitals((prev) => ({ ...prev, [key]: value }))
  }

  // ── AI Summary ─────────────────────────────────────────────────────────

  const handleAISummary = async () => {
    if (!formSOAP.subjective && !formSOAP.objective && !formSOAP.assessment) {
      toast({ title: 'No Content', description: 'Add some clinical content first', variant: 'destructive' })
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLINICAL_SUMMARY',
          context: {
            subjective: formSOAP.subjective,
            objective: formSOAP.objective,
            assessment: formSOAP.assessment,
            plan: formSOAP.plan,
            vitals: formVitals,
            modality: formModality,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const summary = data.summary ?? data.content ?? ''
        if (summary) {
          // Append AI summary to the plan field
          updateSOAP('plan', formSOAP.plan ? `${formSOAP.plan}\n\n[AI Summary]: ${summary}` : `[AI Summary]: ${summary}`)
          toast({ title: 'AI Summary Generated', description: 'Added to Plan section' })
        }
      } else {
        toast({ title: 'AI Error', description: 'Failed to generate summary', variant: 'destructive' })
      }
    } catch {
      // Fallback: generate a local summary
      const localSummary = `Patient presents with ${formSOAP.subjective.slice(0, 100) || 'reported symptoms'}. Assessment: ${formSOAP.assessment.slice(0, 100) || 'pending'}.`
      updateSOAP('plan', formSOAP.plan ? `${formSOAP.plan}\n\n[AI Summary]: ${localSummary}` : `[AI Summary]: ${localSummary}`)
      toast({ title: 'AI Summary (Local)', description: 'Generated locally as fallback' })
    } finally {
      setAiGenerating(false)
    }
  }

  // ── Save Note ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formPatientId) {
      toast({ title: 'Validation', description: 'Select a patient', variant: 'destructive' })
      return
    }
    setFormSubmitting(true)
    try {
      const patient = patients.find((p) => p.id === formPatientId)
      const res = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          type: formType,
          modality: formModality,
          soap: formSOAP,
          vitals: formVitals,
          practitionerName: formPractitioner,
        }),
      })
      if (res.ok) {
        toast({ title: 'Note Saved', description: `${formType} note created` })
        resetForm()
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error ?? 'Failed to save note', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setFormSubmitting(false)
    }
  }

  // ── Sign Note ──────────────────────────────────────────────────────────

  const handleSign = async () => {
    if (!signDialogNote) return
    setSignInSubmitting(true)
    try {
      const res = await fetch(`/api/clinical-notes/${signDialogNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signed: true,
          signedBy: signDialogNote.practitionerName,
          signedAt: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast({ title: 'Note Signed', description: 'Note is now locked' })
        setSignDialogNote(null)
        setSelectedNote(null)
        loadData()
      } else {
        toast({ title: 'Error', description: 'Failed to sign note', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSignInSubmitting(false)
    }
  }

  // ── Reset Form ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setIsCreating(false)
    setFormPatientId(selectedPatientId ?? '')
    setFormType('SOAP')
    setFormModality(activeModality)
    setFormSOAP({ subjective: '', objective: '', assessment: '', plan: '' })
    setFormVitals({})
    setFormPractitioner('Dr. Sharma')
    setShowDiagnosisSuggestions(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Clinical Notes</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-48"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NoteType | 'ALL')}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {NOTE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={() => { setIsCreating(true); resetForm(); setIsCreating(true) }}>
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Modality Tabs (NEVER merge) */}
      <div className="flex gap-2">
        {(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as Modality[]).map((m) => (
          <Button
            key={m}
            variant={modalityFilter === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModalityFilter(m)}
            className="gap-1.5"
          >
            <ModalityBadge modality={m} className="border-0 p-0" />
          </Button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Note List or Create Form */}
        <div className={selectedNote ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {isCreating ? (
            /* ── Create Form ─────────────────────────────────────────────── */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PenLine className="h-4 w-4" />
                    New Clinical Note
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Patient, Type, Modality Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={formPatientId} onValueChange={setFormPatientId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Note Type</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as NoteType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Care Modality</Label>
                    <div className="flex gap-2 flex-wrap h-9 items-center">
                      {(['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as Modality[]).map((m) => (
                        <Button
                          key={m}
                          type="button"
                          variant={formModality === m ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormModality(m)}
                        >
                          <ModalityBadge modality={m} className="border-0 p-0" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Practitioner */}
                <div className="space-y-2">
                  <Label>Practitioner</Label>
                  <Input
                    value={formPractitioner}
                    onChange={(e) => setFormPractitioner(e.target.value)}
                    placeholder="Dr. Name"
                    className="max-w-xs"
                  />
                </div>

                <Separator />

                {/* Vital Signs Quick-Add (in Objective section) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-semibold">Vital Signs</Label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {VITAL_FIELDS.map(({ key, label, unit, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{label} ({unit})</Label>
                        <Input
                          placeholder={placeholder}
                          value={formVitals[key] ?? ''}
                          onChange={(e) => updateVital(key, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* SOAP Fields */}
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => {
                  const config = SOAP_LABELS[field]
                  const IconComp = config.icon
                  return (
                    <div
                      key={field}
                      className={`border-l-4 rounded-r-md p-4 ${SOAP_COLORS[field]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${config.color}`}>{config.letter}</span>
                          <span className={`text-sm font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                          <IconComp className={`h-4 w-4 ${config.color}`} />
                        </div>
                        {field === 'assessment' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={() => setShowDiagnosisSuggestions(!showDiagnosisSuggestions)}
                          >
                            <Sparkles className="h-3 w-3" />
                            {showDiagnosisSuggestions ? 'Hide' : 'Suggestions'}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={
                          field === 'subjective'
                            ? 'Patient reports...'
                            : field === 'objective'
                            ? 'Physical exam findings, vitals...'
                            : field === 'assessment'
                            ? 'Diagnosis, clinical impression...'
                            : 'Treatment plan, orders, referrals...'
                        }
                        value={formSOAP[field]}
                        onChange={(e) => updateSOAP(field, e.target.value)}
                        rows={field === 'subjective' || field === 'plan' ? 4 : 3}
                        className="bg-white dark:bg-gray-950"
                      />
                      {/* Diagnosis Suggestions */}
                      {field === 'assessment' && showDiagnosisSuggestions && (
                        <div className="mt-2 p-2 border rounded-md bg-white dark:bg-gray-950">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Common Diagnoses</p>
                          <div className="flex flex-wrap gap-1">
                            {COMMON_DIAGNOSES.map((d) => (
                              <button
                                key={d}
                                type="button"
                                className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
                                onClick={() => {
                                  const current = formSOAP.assessment
                                  updateSOAP('assessment', current ? `${current}, ${d}` : d)
                                  setShowDiagnosisSuggestions(false)
                                }}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Objective field shows vitals inline */}
                      {field === 'objective' && Object.values(formVitals).some((v) => v) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {VITAL_FIELDS.map(({ key, label, unit }) => {
                            const val = formVitals[key]
                            if (!val) return null
                            return (
                              <Badge key={key} variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                {label}: {val} {unit}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                <Separator />

                {/* Actions Row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleAISummary}
                      disabled={aiGenerating}
                    >
                      <Brain className="h-4 w-4" />
                      {aiGenerating ? 'Generating...' : 'AI Summary'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                    <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={formSubmitting}>
                      <Save className="h-4 w-4" />
                      {formSubmitting ? 'Saving...' : 'Save Note'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ── Notes List ──────────────────────────────────────────────── */
            <div className="space-y-3">
              {filteredNotes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No clinical notes found</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setIsCreating(true) }}>
                      <Plus className="h-4 w-4" /> Create First Note
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredNotes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className={`hover:shadow-md transition-shadow cursor-pointer ${
                        selectedNote?.id === note.id ? 'ring-1 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium">{note.patientName}</span>
                              <ModalityBadge modality={note.modality} />
                              <Badge variant="outline" className="text-xs">{note.type}</Badge>
                              {note.signed ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1 text-xs">
                                  <Lock className="h-3 w-3" /> Signed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Unlock className="h-3 w-3" /> Draft
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {note.soap.subjective
                                ? `S: ${note.soap.subjective.substring(0, 80)}`
                                : 'No subjective data'
                              }
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {note.practitionerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Detail Panel ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNote && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {selectedNote.type} Note
                      <ModalityBadge modality={selectedNote.modality} className="text-[10px]" />
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedNote(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {selectedNote.patientName}
                    {selectedNote.signed ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5 text-[10px]">
                        <Lock className="h-2.5 w-2.5" /> Locked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-0.5">
                        <Unlock className="h-2.5 w-2.5" /> Editable
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[28rem]">
                    <div className="space-y-3">
                      {/* Vital Signs */}
                      {selectedNote.vitals && Object.values(selectedNote.vitals).some((v) => v) && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Vital Signs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {VITAL_FIELDS.map(({ key, label, unit }) => {
                              const val = selectedNote.vitals[key]
                              if (!val) return null
                              return (
                                <Badge key={key} variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                  {label}: {val} {unit}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* SOAP Sections */}
                      {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => {
                        const config = SOAP_LABELS[field]
                        const value = selectedNote.soap[field]
                        const IconComp = config.icon
                        return (
                          <div
                            key={field}
                            className={`border-l-4 rounded-r-md p-3 ${SOAP_COLORS[field]}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-sm font-bold ${config.color}`}>{config.letter}</span>
                              <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                              <IconComp className={`h-3 w-3 ${config.color}`} />
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {value || <span className="text-muted-foreground italic">Not documented</span>}
                            </p>
                          </div>
                        )
                      })}

                      {/* AI Summary */}
                      {selectedNote.summary && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <Brain className="h-3 w-3" /> AI Summary
                            </p>
                            <p className="text-sm">{selectedNote.summary}</p>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Attribution & Timestamp */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {selectedNote.practitionerName}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Created: {new Date(selectedNote.createdAt).toLocaleString()}
                        </p>
                        {selectedNote.signedAt && (
                          <p className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Signed: {new Date(selectedNote.signedAt).toLocaleString()} by {selectedNote.signedBy}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {!selectedNote.signed && (
                        <>
                          <Separator />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 w-full"
                              onClick={() => setSignDialogNote(selectedNote)}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Sign & Lock
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sign/Lock Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!signDialogNote} onOpenChange={(open) => { if (!open) setSignDialogNote(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Sign & Lock Note
            </DialogTitle>
            <DialogDescription>
              This will digitally sign and lock the note. It cannot be edited after signing.
            </DialogDescription>
          </DialogHeader>
          {signDialogNote && (
            <div className="py-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-medium">{signDialogNote.patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{signDialogNote.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Practitioner</span>
                  <span className="font-medium">{signDialogNote.practitionerName}</span>
                </div>
                <Separator />
                <p className="text-muted-foreground text-xs">
                  Signing as <strong>{signDialogNote.practitionerName}</strong> on{' '}
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogNote(null)}>Cancel</Button>
            <Button onClick={handleSign} disabled={signSubmitting} className="gap-1.5">
              <Check className="h-4 w-4" />
              {signSubmitting ? 'Signing...' : 'Confirm & Sign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
