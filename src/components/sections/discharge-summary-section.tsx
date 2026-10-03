'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Brain,
  Check,
  Lock,
  Printer,
  Plus,
  Activity,
  Trash2,
  User,
  Calendar,
  Stethoscope,
  ClipboardList,
  Pill,
  Salad,
  Dumbbell,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ── Types ──────────────────────────────────────────────────────

type DischargeCondition = 'STABLE' | 'IMPROVED' | 'CRITICAL' | 'EXPIRED'

interface DischargeMedication {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface DischargeSummary {
  id: string
  patientId: string
  patientName: string
  admissionDate: string
  dischargeDate: string
  admittingDiagnosis: string
  dischargeDiagnosis: string
  chiefComplaints: string[]
  investigationsSummary: string
  treatmentGiven: string
  conditionAtDischarge: DischargeCondition
  medications: DischargeMedication[]
  followUpInstructions: string
  dietAdvice: string
  activityRestrictions: string
  isSigned: boolean
  isLocked: boolean
  createdBy: string
  createdAt: string
}

// ── Mock Data ──────────────────────────────────────────────────

const mockPatients = [
  { id: 'p1', name: 'Rajesh Kumar Sharma', age: 58, gender: 'Male', uhid: 'UHID-2026-001' },
  { id: 'p2', name: 'Priya Nair', age: 34, gender: 'Female', uhid: 'UHID-2026-002' },
  { id: 'p3', name: 'Mohammed Asif', age: 72, gender: 'Male', uhid: 'UHID-2026-003' },
  { id: 'p4', name: 'Lakshmi Iyer', age: 45, gender: 'Female', uhid: 'UHID-2026-004' },
]

const mockSummaries: DischargeSummary[] = [
  {
    id: 'ds1',
    patientId: 'p1',
    patientName: 'Rajesh Kumar Sharma',
    admissionDate: '2026-09-28',
    dischargeDate: '2026-10-03',
    admittingDiagnosis: 'Acute Myocardial Infarction (STEMI)',
    dischargeDiagnosis: 'Acute Myocardial Infarction (STEMI) - Post Thrombolysis',
    chiefComplaints: ['Chest pain since 2 hours', 'Breathlessness', 'Sweating profusely'],
    investigationsSummary: 'ECG: ST elevation in V1-V4. Troponin I: 8.5 ng/mL (elevated). Echo: EF 45%, AWMA. Lipid profile: Total Cholesterol 268, LDL 185.',
    treatmentGiven: 'Thrombolysis with Tenecteplase. Antiplatelets (Aspirin + Clopidogrel). Statin (Atorvastatin 80mg). ACE inhibitor (Ramipril 2.5mg). Beta-blocker (Metoprolol 25mg). Heparin infusion for 24h.',
    conditionAtDischarge: 'IMPROVED',
    medications: [
      { id: 'm1', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: 'Lifelong' },
      { id: 'm2', name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', duration: '1 year' },
      { id: 'm3', name: 'Atorvastatin', dosage: '80mg', frequency: 'At bedtime', duration: 'Lifelong' },
      { id: 'm4', name: 'Ramipril', dosage: '2.5mg', frequency: 'Once daily', duration: 'Lifelong' },
      { id: 'm5', name: 'Metoprolol', dosage: '25mg', frequency: 'Twice daily', duration: 'Lifelong' },
    ],
    followUpInstructions: 'Cardiology OPD review in 7 days. Repeat Echo at 4-6 weeks. Stress test at 6 weeks if clinically stable. Watch for signs of heart failure.',
    dietAdvice: 'Low salt (<5g/day), low saturated fat diet. Include fruits, vegetables, whole grains. Avoid fried foods and red meat. Moderate protein intake.',
    activityRestrictions: 'No heavy lifting (>5kg) for 4 weeks. Gradual increase in walking - start with 10 min, increase by 5 min weekly. Avoid driving for 4 weeks. Cardiac rehabilitation referral.',
    isSigned: true,
    isLocked: true,
    createdBy: 'Dr. Anil Mehta',
    createdAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'ds2',
    patientId: 'p2',
    patientName: 'Priya Nair',
    admissionDate: '2026-09-30',
    dischargeDate: '2026-10-02',
    admittingDiagnosis: 'Acute Pyelonephritis',
    dischargeDiagnosis: 'Acute Pyelonephritis - Resolved',
    chiefComplaints: ['High grade fever since 3 days', 'Left flank pain', 'Burning micturition'],
    investigationsSummary: 'Urine R/E: Pus cells 40-50/hpf, RBCs 5-6/hpf. Urine culture: E. coli sensitive to Ciprofloxacin. CBC: WBC 14,200. Serum Creatinine 0.9 (normal).',
    treatmentGiven: 'IV Ciprofloxacin 200mg BD for 48h. Tab Ciprofloxacin 500mg BD thereafter. IV fluids. Antipyretics as needed.',
    conditionAtDischarge: 'STABLE',
    medications: [
      { id: 'm6', name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '5 more days' },
    ],
    followUpInstructions: 'Urine routine & culture repeat at 2 weeks. Nephrology OPD if recurrence. Maintain adequate hydration (2-3L/day).',
    dietAdvice: 'Plenty of oral fluids (2-3 litres/day). Avoid excessive caffeine. Normal diet otherwise.',
    activityRestrictions: 'No restrictions. Resume normal activities. Avoid prolonged sitting.',
    isSigned: false,
    isLocked: false,
    createdBy: 'Dr. Sunita Reddy',
    createdAt: '2026-10-02T11:00:00Z',
  },
]

// ── Helpers ────────────────────────────────────────────────────

const conditionBadge = (condition: DischargeCondition) => {
  const config: Record<DischargeCondition, { bg: string; text: string }> = {
    STABLE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    IMPROVED: { bg: 'bg-blue-100', text: 'text-blue-800' },
    CRITICAL: { bg: 'bg-orange-100', text: 'text-orange-800' },
    EXPIRED: { bg: 'bg-red-100', text: 'text-red-800' },
  }
  const c = config[condition]
  return <Badge className={`${c.bg} ${c.text} hover:${c.bg}`}>{condition}</Badge>
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Animation ──────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ──────────────────────────────────────────────────

export function DischargeSummarySection() {
  const { setActiveSection } = useAppStore()

  const [summaries, setSummaries] = useState<DischargeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [selectedSummary, setSelectedSummary] = useState<DischargeSummary | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)

  // New summary form state
  const [form, setForm] = useState({
    admissionDate: '',
    dischargeDate: new Date().toISOString().split('T')[0],
    admittingDiagnosis: '',
    dischargeDiagnosis: '',
    chiefComplaints: [] as string[],
    investigationsSummary: '',
    treatmentGiven: '',
    conditionAtDischarge: 'STABLE' as DischargeCondition,
    medications: [] as DischargeMedication[],
    followUpInstructions: '',
    dietAdvice: '',
    activityRestrictions: '',
  })
  const [newComplaint, setNewComplaint] = useState('')
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', duration: '' })

  // Fetch summaries
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch('/api/discharge-summary')
        if (res.ok) {
          const data = await res.json()
          setSummaries(data.summaries || mockSummaries)
        } else {
          setSummaries(mockSummaries)
        }
      } catch {
        setSummaries(mockSummaries)
      } finally {
        setLoading(false)
      }
    }
    fetchSummaries()
  }, [])

  const patientSummaries = useMemo(() => {
    if (!selectedPatientId) return summaries
    return summaries.filter(s => s.patientId === selectedPatientId)
  }, [summaries, selectedPatientId])

  const addComplaint = () => {
    if (!newComplaint.trim()) return
    setForm(prev => ({ ...prev, chiefComplaints: [...prev.chiefComplaints, newComplaint.trim()] }))
    setNewComplaint('')
  }

  const removeComplaint = (index: number) => {
    setForm(prev => ({ ...prev, chiefComplaints: prev.chiefComplaints.filter((_, i) => i !== index) }))
  }

  const addMedication = () => {
    if (!newMedication.name.trim()) return
    const med: DischargeMedication = {
      id: `med-${Date.now()}`,
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      duration: newMedication.duration,
    }
    setForm(prev => ({ ...prev, medications: [...prev.medications, med] }))
    setNewMedication({ name: '', dosage: '', frequency: '', duration: '' })
  }

  const removeMedication = (id: string) => {
    setForm(prev => ({ ...prev, medications: prev.medications.filter(m => m.id !== id) }))
  }

  const handleAIGenerate = async () => {
    if (!selectedPatientId) {
      toast({ title: 'Select a patient first', description: 'Choose a patient to generate AI summary.', variant: 'destructive' })
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          modality: 'ALLOPATHY',
          task: 'DISCHARGE_SUMMARY',
          patientContext: {
            admittingDiagnosis: form.admittingDiagnosis,
            chiefComplaints: form.chiefComplaints,
            treatmentGiven: form.treatmentGiven,
          },
        }),
      })
      const data = await res.json()
      if (data.draft?.content) {
        setForm(prev => ({
          ...prev,
          dischargeDiagnosis: prev.dischargeDiagnosis || 'AI Draft - Review Required',
          followUpInstructions: data.draft.content.substring(0, 500),
        }))
        toast({ title: 'AI Draft Generated', description: 'Review the AI-generated content before signing.' })
      } else {
        toast({ title: 'AI generation returned no content', description: 'Please fill manually.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'AI generation failed', description: 'Please fill the summary manually.', variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveSummary = () => {
    const patient = mockPatients.find(p => p.id === selectedPatientId)
    if (!patient || !form.admittingDiagnosis) {
      toast({ title: 'Missing required fields', description: 'Please select a patient and fill the admitting diagnosis.', variant: 'destructive' })
      return
    }

    const newSummary: DischargeSummary = {
      id: `ds-${Date.now()}`,
      patientId: selectedPatientId,
      patientName: patient.name,
      admissionDate: form.admissionDate,
      dischargeDate: form.dischargeDate,
      admittingDiagnosis: form.admittingDiagnosis,
      dischargeDiagnosis: form.dischargeDiagnosis,
      chiefComplaints: form.chiefComplaints,
      investigationsSummary: form.investigationsSummary,
      treatmentGiven: form.treatmentGiven,
      conditionAtDischarge: form.conditionAtDischarge,
      medications: form.medications,
      followUpInstructions: form.followUpInstructions,
      dietAdvice: form.dietAdvice,
      activityRestrictions: form.activityRestrictions,
      isSigned: false,
      isLocked: false,
      createdBy: 'Current Clinician',
      createdAt: new Date().toISOString(),
    }

    setSummaries(prev => [newSummary, ...prev])
    setShowNewForm(false)
    setForm({
      admissionDate: '',
      dischargeDate: new Date().toISOString().split('T')[0],
      admittingDiagnosis: '',
      dischargeDiagnosis: '',
      chiefComplaints: [],
      investigationsSummary: '',
      treatmentGiven: '',
      conditionAtDischarge: 'STABLE',
      medications: [],
      followUpInstructions: '',
      dietAdvice: '',
      activityRestrictions: '',
    })
    toast({ title: 'Discharge Summary Saved', description: `Summary for ${patient.name} saved as draft.` })
  }

  const handleSignSummary = (summaryId: string) => {
    setSummaries(prev =>
      prev.map(s => s.id === summaryId ? { ...s, isSigned: true } : s)
    )
    toast({ title: 'Summary Signed', description: 'Discharge summary has been signed by clinician.' })
  }

  const handleLockSummary = (summaryId: string) => {
    setSummaries(prev =>
      prev.map(s => s.id === summaryId ? { ...s, isLocked: true, isSigned: true } : s)
    )
    toast({ title: 'Summary Locked', description: 'Discharge summary is now locked and cannot be edited.' })
  }

  const handlePrint = (summary: DischargeSummary) => {
    const printContent = `
      <html>
      <head><title>Discharge Summary - ${summary.patientName}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
        .field { margin-bottom: 8px; }
        .label { font-weight: bold; }
        .meds-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .meds-table th, .meds-table td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 13px; }
      </style></head>
      <body>
        <h1>DISCHARGE SUMMARY</h1>
        <div class="field"><span class="label">Patient:</span> ${summary.patientName}</div>
        <div class="field"><span class="label">Admission Date:</span> ${formatDate(summary.admissionDate)}</div>
        <div class="field"><span class="label">Discharge Date:</span> ${formatDate(summary.dischargeDate)}</div>
        <div class="field"><span class="label">Admitting Diagnosis:</span> ${summary.admittingDiagnosis}</div>
        <div class="field"><span class="label">Discharge Diagnosis:</span> ${summary.dischargeDiagnosis}</div>
        <h2>Chief Complaints</h2>
        <ul>${summary.chiefComplaints.map(c => `<li>${c}</li>`).join('')}</ul>
        <h2>Investigations</h2>
        <p>${summary.investigationsSummary}</p>
        <h2>Treatment Given</h2>
        <p>${summary.treatmentGiven}</p>
        <div class="field"><span class="label">Condition at Discharge:</span> ${summary.conditionAtDischarge}</div>
        <h2>Discharge Medications</h2>
        <table class="meds-table">
          <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
          ${summary.medications.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join('')}
        </table>
        <h2>Follow-up Instructions</h2>
        <p>${summary.followUpInstructions}</p>
        <h2>Diet Advice</h2>
        <p>${summary.dietAdvice}</p>
        <h2>Activity Restrictions</h2>
        <p>${summary.activityRestrictions}</p>
        <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 10px;">
          <span class="label">Signed:</span> ${summary.isSigned ? 'Yes' : 'No'} | <span class="label">Locked:</span> ${summary.isLocked ? 'Yes' : 'No'}
        </div>
      </body></html>
    `
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(printContent)
      win.document.close()
      win.print()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Discharge Summary
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Create, review, and sign discharge summaries for patients
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSummaries(mockSummaries)
                toast({ title: 'Refreshed' })
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Summary
            </Button>
          </div>
        </div>
      </motion.div>

      {/* New Summary Form */}
      {showNewForm && (
        <motion.div {...fadeSlide}>
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Create New Discharge Summary
              </CardTitle>
              <CardDescription>Fill in all required fields. Use AI assist to draft content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Patient *</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {mockPatients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.uhid})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAIGenerate} disabled={aiLoading || !selectedPatientId} variant="outline" className="w-full">
                    {aiLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
                    AI Generate Summary
                  </Button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Admission Date *</label>
                  <Input type="date" value={form.admissionDate} onChange={e => setForm(prev => ({ ...prev, admissionDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Discharge Date</label>
                  <Input type="date" value={form.dischargeDate} onChange={e => setForm(prev => ({ ...prev, dischargeDate: e.target.value }))} />
                </div>
              </div>

              {/* Diagnoses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Admitting Diagnosis *</label>
                  <Input placeholder="e.g., Acute Myocardial Infarction" value={form.admittingDiagnosis} onChange={e => setForm(prev => ({ ...prev, admittingDiagnosis: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Discharge Diagnosis</label>
                  <Input placeholder="e.g., AMI - Post Thrombolysis" value={form.dischargeDiagnosis} onChange={e => setForm(prev => ({ ...prev, dischargeDiagnosis: e.target.value }))} />
                </div>
              </div>

              {/* Chief Complaints */}
              <div>
                <label className="text-sm font-medium mb-1 block">Chief Complaints</label>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Add a complaint" value={newComplaint} onChange={e => setNewComplaint(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComplaint()} />
                  <Button variant="outline" size="sm" onClick={addComplaint}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.chiefComplaints.map((c, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeComplaint(i)}>
                      {c} <Trash2 className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Investigations, Treatment */}
              <div>
                <label className="text-sm font-medium mb-1 block">Investigations Summary</label>
                <Textarea placeholder="Lab results, imaging findings..." rows={3} value={form.investigationsSummary} onChange={e => setForm(prev => ({ ...prev, investigationsSummary: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Treatment Given</label>
                <Textarea placeholder="Medications, procedures performed..." rows={3} value={form.treatmentGiven} onChange={e => setForm(prev => ({ ...prev, treatmentGiven: e.target.value }))} />
              </div>

              {/* Condition at Discharge */}
              <div>
                <label className="text-sm font-medium mb-1 block">Condition at Discharge</label>
                <Select value={form.conditionAtDischarge} onValueChange={(v) => setForm(prev => ({ ...prev, conditionAtDischarge: v as DischargeCondition }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STABLE">STABLE</SelectItem>
                    <SelectItem value="IMPROVED">IMPROVED</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discharge Medications */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Pill className="h-4 w-4" /> Medications on Discharge</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                  <Input placeholder="Medicine" value={newMedication.name} onChange={e => setNewMedication(prev => ({ ...prev, name: e.target.value }))} />
                  <Input placeholder="Dosage" value={newMedication.dosage} onChange={e => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))} />
                  <Input placeholder="Frequency" value={newMedication.frequency} onChange={e => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))} />
                  <Input placeholder="Duration" value={newMedication.duration} onChange={e => setNewMedication(prev => ({ ...prev, duration: e.target.value }))} />
                  <Button variant="outline" size="sm" onClick={addMedication}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
                {form.medications.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.medications.map(med => (
                        <TableRow key={med.id}>
                          <TableCell>{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.duration}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeMedication(med.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Follow-up, Diet, Activity */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Follow-up Instructions</label>
                <Textarea placeholder="OPD review schedule, repeat investigations..." rows={2} value={form.followUpInstructions} onChange={e => setForm(prev => ({ ...prev, followUpInstructions: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Salad className="h-4 w-4" /> Diet Advice</label>
                <Textarea placeholder="Dietary recommendations..." rows={2} value={form.dietAdvice} onChange={e => setForm(prev => ({ ...prev, dietAdvice: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Dumbbell className="h-4 w-4" /> Activity Restrictions</label>
                <Textarea placeholder="Physical activity limitations..." rows={2} value={form.activityRestrictions} onChange={e => setForm(prev => ({ ...prev, activityRestrictions: e.target.value }))} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                <Button onClick={handleSaveSummary}>
                  <Check className="h-4 w-4 mr-1" /> Save Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Patient Filter */}
      <motion.div {...fadeSlide}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Patients</SelectItem>
                  {mockPatients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {patientSummaries.length} summary{patientSummaries.length !== 1 ? 'ies' : 'y'} found
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary List */}
      <motion.div {...fadeSlide}>
        <div className="space-y-4">
          {patientSummaries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No discharge summaries found.</p>
                <p className="text-sm mt-1">Create a new summary to get started.</p>
              </CardContent>
            </Card>
          ) : (
            patientSummaries.map(summary => (
              <Card key={summary.id} className={selectedSummary?.id === summary.id ? 'border-primary ring-1 ring-primary/20' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {summary.patientName}
                        {conditionBadge(summary.conditionAtDischarge)}
                        {summary.isLocked && <Badge variant="secondary" className="text-[10px]"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
                        {summary.isSigned && !summary.isLocked && <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100"><Check className="h-3 w-3 mr-1" />Signed</Badge>}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Admit: {formatDate(summary.admissionDate)} → Discharge: {formatDate(summary.dischargeDate)} | By: {summary.createdBy}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => handlePrint(summary)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {!summary.isSigned && (
                        <Button variant="outline" size="sm" onClick={() => handleSignSummary(summary.id)}>
                          <Check className="h-4 w-4 mr-1" /> Sign
                        </Button>
                      )}
                      {summary.isSigned && !summary.isLocked && (
                        <Button variant="outline" size="sm" onClick={() => handleLockSummary(summary.id)}>
                          <Lock className="h-4 w-4 mr-1" /> Lock
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSummary(selectedSummary?.id === summary.id ? null : summary)}
                      >
                        {selectedSummary?.id === summary.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Detail */}
                {selectedSummary?.id === summary.id && (
                  <CardContent className="pt-0 space-y-4">
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Admitting Diagnosis</p>
                        <p className="text-sm">{summary.admittingDiagnosis}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Discharge Diagnosis</p>
                        <p className="text-sm">{summary.dischargeDiagnosis || '—'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Chief Complaints</p>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.chiefComplaints.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Investigations</p>
                      <p className="text-sm whitespace-pre-wrap">{summary.investigationsSummary}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Treatment Given</p>
                      <p className="text-sm whitespace-pre-wrap">{summary.treatmentGiven}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Pill className="h-3 w-3" /> Discharge Medications</p>
                      {summary.medications.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medicine</TableHead>
                              <TableHead>Dosage</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {summary.medications.map(med => (
                              <TableRow key={med.id}>
                                <TableCell className="font-medium">{med.name}</TableCell>
                                <TableCell>{med.dosage}</TableCell>
                                <TableCell>{med.frequency}</TableCell>
                                <TableCell>{med.duration}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No medications</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Follow-up</p>
                        <p className="text-sm whitespace-pre-wrap">{summary.followUpInstructions || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Salad className="h-3 w-3" /> Diet Advice</p>
                        <p className="text-sm whitespace-pre-wrap">{summary.dietAdvice || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Dumbbell className="h-3 w-3" /> Activity</p>
                        <p className="text-sm whitespace-pre-wrap">{summary.activityRestrictions || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
