'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Plus, Send, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface SymptomEntry {
  name: string
  severity: string
  onset: string
  duration: string
}

interface AllergyEntry {
  substance: string
  reaction: string
  severity: string
}

interface MedicationEntry {
  medication: string
  dosage: string
  frequency: string
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function IntakeSection() {
  const { activeModality } = useAppStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('')

  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [allergies, setAllergies] = useState<AllergyEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])

  // Add symptom form
  const [symName, setSymName] = useState('')
  const [symSeverity, setSymSeverity] = useState('MODERATE')
  const [symOnset, setSymOnset] = useState('')
  const [symDuration, setSymDuration] = useState('')

  // Add allergy form
  const [allSubstance, setAllSubstance] = useState('')
  const [allReaction, setAllReaction] = useState('')
  const [allSeverity, setAllSeverity] = useState('MODERATE')

  // Add medication form
  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('')
  const [medFreq, setMedFreq] = useState('')

  const [submitting, setSubmitting] = useState(false)

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

  const addSymptom = () => {
    if (!symName.trim()) return
    setSymptoms([...symptoms, { name: symName, severity: symSeverity, onset: symOnset, duration: symDuration }])
    setSymName(''); setSymSeverity('MODERATE'); setSymOnset(''); setSymDuration('')
  }

  const addAllergy = () => {
    if (!allSubstance.trim()) return
    setAllergies([...allergies, { substance: allSubstance, reaction: allReaction, severity: allSeverity }])
    setAllSubstance(''); setAllReaction(''); setAllSeverity('MODERATE')
  }

  const addMedication = () => {
    if (!medName.trim()) return
    setMedications([...medications, { medication: medName, dosage: medDosage, frequency: medFreq }])
    setMedName(''); setMedDosage(''); setMedFreq('')
  }

  const handleSubmit = async () => {
    if (!selectedPatientId || !chiefComplaint.trim()) {
      toast({ title: 'Validation Error', description: 'Patient and chief complaint are required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      // Create intake
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          modality: activeModality,
          chiefComplaint,
          historyOfPresentIllness: historyOfPresentIllness || null,
          symptoms,
          allergies,
          medications,
        }),
      })
      if (res.ok) {
        toast({ title: 'Intake Submitted', description: 'Encounter and intake created successfully' })
        setChiefComplaint(''); setHistoryOfPresentIllness('')
        setSymptoms([]); setAllergies([]); setMedications([])
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error ?? 'Failed to submit intake', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Clinical Intake
          </CardTitle>
          <CardDescription>Record patient symptoms, allergies, and medications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient & Modality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient..." /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Care Modality</Label>
              <div className="flex items-center gap-2 h-9">
                <ModalityBadge modality={activeModality} />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label>Chief Complaint *</Label>
            <Textarea
              placeholder="Describe the main reason for the visit..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
            />
          </div>

          {/* History of Present Illness */}
          <div className="space-y-2">
            <Label>History of Present Illness</Label>
            <Textarea
              placeholder="Detailed description of the current illness..."
              value={historyOfPresentIllness}
              onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Symptoms */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Symptoms</Label>
            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {s.name} ({s.severity})
                    <button onClick={() => setSymptoms(symptoms.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="Symptom name" value={symName} onChange={(e) => setSymName(e.target.value)} />
              <Select value={symSeverity} onValueChange={setSymSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILD">Mild</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="SEVERE">Severe</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Onset" value={symOnset} onChange={(e) => setSymOnset(e.target.value)} />
              <div className="flex gap-1">
                <Input placeholder="Duration" value={symDuration} onChange={(e) => setSymDuration(e.target.value)} />
                <Button size="icon" variant="outline" onClick={addSymptom} className="shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Allergies */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Allergies (On-the-fly)</Label>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a, i) => (
                  <Badge key={i} variant="outline" className="gap-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {a.substance}
                    <button onClick={() => setAllergies(allergies.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="Substance" value={allSubstance} onChange={(e) => setAllSubstance(e.target.value)} />
              <Input placeholder="Reaction" value={allReaction} onChange={(e) => setAllReaction(e.target.value)} />
              <Select value={allSeverity} onValueChange={setAllSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILD">Mild</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="SEVERE">Severe</SelectItem>
                  <SelectItem value="LIFE_THREATENING">Life Threatening</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={addAllergy} className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </div>

          <Separator />

          {/* Medications */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Medications (On-the-fly)</Label>
            {medications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {medications.map((m, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {m.medication} {m.dosage && `(${m.dosage})`}
                    <button onClick={() => setMedications(medications.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="Medication" value={medName} onChange={(e) => setMedName(e.target.value)} />
              <Input placeholder="Dosage" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} />
              <Input placeholder="Frequency" value={medFreq} onChange={(e) => setMedFreq(e.target.value)} />
              <Button variant="outline" onClick={addMedication} className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </div>

          <Separator />

          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Intake'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
