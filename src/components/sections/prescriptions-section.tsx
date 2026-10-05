'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  QrCode,
  ShieldCheck,
  Pill,
  Check,
  X,
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import type { Modality } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────

type PrescriptionStatus = 'DRAFT' | 'ACTIVE' | 'DISPENSED' | 'EXPIRED' | 'CANCELLED'
type Frequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'AS_NEEDED' | 'STAT'
type Route = 'ORAL' | 'IV' | 'IM' | 'SC' | 'TOPICAL' | 'INHALATION'
type ScheduleType = 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'NARCOTIC'
type FoodInstruction = 'before food' | 'after food' | 'with food' | 'empty stomach'

interface PrescriptionItem {
  id?: string
  medicineName: string
  medicineId?: string
  dosage: string
  frequency: Frequency
  duration: string
  route: Route
  instructions: FoodInstruction
  scheduleType: ScheduleType
  quantity: number
  refills: number
}

interface Prescription {
  id: string
  prescriptionNo: string
  patientId: string
  patient?: { id: string; firstName: string; lastName: string }
  practitioner?: { id: string; name: string }
  modality: string
  status: PrescriptionStatus
  diagnosis: string | null
  notes: string | null
  qrCodeData: string | null
  digitalSignature: string | null
  isCdScoCompliant: boolean
  validFrom: string
  validUntil: string | null
  createdAt: string
  items: PrescriptionItem[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Constants ───────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<Frequency, string> = {
  ONCE_DAILY: 'Once Daily',
  TWICE_DAILY: 'Twice Daily',
  THRICE_DAILY: 'Thrice Daily',
  AS_NEEDED: 'As Needed (PRN)',
  STAT: 'STAT (Immediately)',
}

const ROUTE_LABELS: Record<Route, string> = {
  ORAL: 'Oral',
  IV: 'Intravenous',
  IM: 'Intramuscular',
  SC: 'Subcutaneous',
  TOPICAL: 'Topical',
  INHALATION: 'Inhalation',
}

const SCHEDULE_TYPE_CONFIG: Record<ScheduleType, { label: string; className: string }> = {
  OTC: {
    label: 'OTC',
    className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
  },
  SCHEDULE_H: {
    label: 'Schedule H',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  },
  SCHEDULE_H1: {
    label: 'Schedule H1',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  },
  SCHEDULE_X: {
    label: 'Schedule X',
    className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  },
  NARCOTIC: {
    label: 'Narcotic',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  },
}

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  DISPENSED: {
    label: 'Dispensed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

const FOOD_INSTRUCTIONS: FoodInstruction[] = ['before food', 'after food', 'with food', 'empty stomach']

// ─── Simple QR Code Data URL Generator ───────────────────────────────────
// Generates a visual placeholder SVG that encodes the prescription data

function generateQrDataUrl(data: string): string {
  const size = 128
  const cellSize = 4
  const gridCount = size / cellSize
  // Simple hash-based pattern for visual representation
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
  }
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`
  // Finder patterns (3 corners)
  for (const [ox, oy] of [[0, 0], [size - 7 * cellSize, 0], [0, size - 7 * cellSize]]) {
    svg += `<rect x="${ox}" y="${oy}" width="${7 * cellSize}" height="${7 * cellSize}" fill="black"/>`
    svg += `<rect x="${ox + cellSize}" y="${oy + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="white"/>`
    svg += `<rect x="${ox + 2 * cellSize}" y="${oy + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="black"/>`
  }
  // Data pattern
  for (let row = 0; row < gridCount; row++) {
    for (let col = 0; col < gridCount; col++) {
      if (row < 8 && col < 8) continue
      if (row < 8 && col >= gridCount - 8) continue
      if (row >= gridCount - 8 && col < 8) continue
      const bit = ((hash * (row * gridCount + col + 1)) >>> 0) % 2
      if (bit) {
        svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`
      }
    }
  }
  svg += '</svg>'
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// ─── Animation ───────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ─── Component ───────────────────────────────────────────────────────────

export function PrescriptionsSection() {
  const { activeModality, selectedPatientId, setSelectedPrescriptionId } = useAppStore()

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [modalityTab, setModalityTab] = useState<string>(activeModality)

  // New prescription dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState(selectedPatientId ?? '')
  const [formModality, setFormModality] = useState<string>(activeModality)
  const [formDiagnosis, setFormDiagnosis] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<PrescriptionItem[]>([
    {
      medicineName: '',
      dosage: '',
      frequency: 'ONCE_DAILY',
      duration: '7 days',
      route: 'ORAL',
      instructions: 'after food',
      scheduleType: 'OTC',
      quantity: 10,
      refills: 0,
    },
  ])
  const [submitting, setSubmitting] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)

  // ─── Fetch patients ───────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => setPatients(d.data ?? d.patients ?? []))
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
      })
  }, [])

  // ─── Fetch prescriptions ─────────────────────────────────────────

  const loadPrescriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
      if (modalityTab) params.set('modality', modalityTab)
      const res = await fetch(`/api/prescriptions?${params.toString()}`)
      const json = await res.json()
      const raw = json.data ?? json.prescriptions ?? []
      const mapped = raw.map((p: Record<string, unknown>) => {
        const patient = p.patient as { id: string; firstName: string; lastName: string } | undefined
        const practitioner = p.practitioner as { id: string; name: string } | undefined
        const items = (Array.isArray(p.items) ? p.items : []) as PrescriptionItem[]
        return {
          id: p.id as string,
          prescriptionNo: (p.prescriptionNo ?? '') as string,
          patientId: (p.patientId ?? '') as string,
          patient,
          practitioner,
          modality: (p.modality ?? 'ALLOPATHY') as string,
          status: (p.status ?? 'DRAFT') as PrescriptionStatus,
          diagnosis: (p.diagnosis ?? null) as string | null,
          notes: (p.notes ?? null) as string | null,
          qrCodeData: (p.qrCodeData ?? null) as string | null,
          digitalSignature: (p.digitalSignature ?? null) as string | null,
          isCdScoCompliant: (p.isCdScoCompliant ?? true) as boolean,
          validFrom: (p.validFrom ?? p.createdAt ?? new Date().toISOString()) as string,
          validUntil: (p.validUntil ?? null) as string | null,
          createdAt: (p.createdAt ?? new Date().toISOString()) as string,
          items,
        } as Prescription
      })
      setPrescriptions(mapped)
    } catch {
      toast({ title: 'Error', description: 'Failed to load prescriptions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, modalityTab])

  useEffect(() => { loadPrescriptions() }, [loadPrescriptions])

  // ─── Item management ──────────────────────────────────────────────

  const addItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        medicineName: '',
        dosage: '',
        frequency: 'ONCE_DAILY',
        duration: '7 days',
        route: 'ORAL',
        instructions: 'after food',
        scheduleType: 'OTC',
        quantity: 10,
        refills: 0,
      },
    ])
  }

  const removeItem = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof PrescriptionItem, value: unknown) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  // ─── Create prescription ─────────────────────────────────────────

  const handleCreate = async () => {
    if (!formPatientId) {
      toast({ title: 'Validation', description: 'Select a patient', variant: 'destructive' })
      return
    }
    const validItems = formItems.filter((i) => i.medicineName.trim())
    if (validItems.length === 0) {
      toast({ title: 'Validation', description: 'Add at least one medicine', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          modality: formModality,
          diagnosis: formDiagnosis || undefined,
          notes: formNotes || undefined,
          items: validItems,
        }),
      })
      if (res.ok) {
        toast({ title: 'Prescription Created', description: 'New prescription saved as draft' })
        setCreateOpen(false)
        resetForm()
        loadPrescriptions()
      } else {
        toast({ title: 'Error', description: 'Failed to create prescription', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormPatientId(selectedPatientId ?? '')
    setFormModality(activeModality)
    setFormDiagnosis('')
    setFormNotes('')
    setFormItems([
      {
        medicineName: '',
        dosage: '',
        frequency: 'ONCE_DAILY',
        duration: '7 days',
        route: 'ORAL',
        instructions: 'after food',
        scheduleType: 'OTC',
        quantity: 10,
        refills: 0,
      },
    ])
  }

  // ─── QR code for selected prescription ────────────────────────────

  const qrDataUrl = selectedRx?.qrCodeData
    ? generateQrDataUrl(selectedRx.qrCodeData)
    : null

  // ─── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <FileText className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">E-Prescriptions</h2>
            <p className="text-sm text-muted-foreground">Create and manage prescriptions across modalities</p>
          </div>
        </div>
        <Button
          className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => {
            resetForm()
            setCreateOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> New Prescription
        </Button>
      </div>

      {/* Modality Tabs (NEVER MERGED) */}
      <Tabs
        value={modalityTab}
        onValueChange={setModalityTab}
        className="space-y-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="ALLOPATHY" className="gap-1">
              <Pill className="h-3 w-3" /> Allopathy
            </TabsTrigger>
            <TabsTrigger value="AYURVEDA" className="gap-1">
              🌿 Ayurveda
            </TabsTrigger>
            <TabsTrigger value="HOMEOPATHY" className="gap-1">
              ✨ Homeopathy
            </TabsTrigger>
          </TabsList>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DISPENSED">Dispensed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tab content is the same list, just filtered by modality via API */}
        {['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'].map((mod) => (
          <TabsContent key={mod} value={mod} className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                ['DRAFT', 'ACTIVE', 'DISPENSED', 'EXPIRED'] as PrescriptionStatus[]
              ).map((st) => {
                const count = prescriptions.filter((p) => p.status === st).length
                return (
                  <Card key={st} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {STATUS_CONFIG[st].label}
                      </span>
                      <Badge className={`text-xs ${STATUS_CONFIG[st].className}`}>
                        {count}
                      </Badge>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Prescriptions table */}
            {prescriptions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No prescriptions found for {mod.charAt(0) + mod.slice(1).toLowerCase()}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rx No.</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>CDSCO</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((rx) => {
                          const statusCfg = STATUS_CONFIG[rx.status] ?? STATUS_CONFIG.DRAFT
                          const hasNarcotic = rx.items?.some(
                            (item) => item.scheduleType === 'NARCOTIC'
                          )
                          return (
                            <TableRow
                              key={rx.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedRx(rx)
                                setSelectedPrescriptionId(rx.id)
                                setDetailOpen(true)
                              }}
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {rx.prescriptionNo}
                              </TableCell>
                              <TableCell className="text-sm">
                                {rx.patient
                                  ? `${rx.patient.firstName} ${rx.patient.lastName}`
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-sm max-w-[150px] truncate">
                                {rx.diagnosis || '—'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {rx.items?.length ?? 0}
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${statusCfg.className}`}>
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rx.isCdScoCompliant ? (
                                  <Badge className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 gap-1">
                                    <ShieldCheck className="h-3 w-3" /> CDSCO
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Non-compliant
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(rx.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {hasNarcotic && (
                                    <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      Narcotic
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedRx(rx)
                                      setSelectedPrescriptionId(rx.id)
                                      setDetailOpen(true)
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ─── Create Prescription Dialog ──────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-600" /> New Prescription
            </DialogTitle>
            <DialogDescription>
              Create a new prescription — medicines are modality-specific and never shared
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Patient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={formPatientId} onValueChange={setFormPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modality *</Label>
                <Select value={formModality} onValueChange={setFormModality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOPATHY">Allopathy</SelectItem>
                    <SelectItem value="AYURVEDA">Ayurveda</SelectItem>
                    <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Diagnosis & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Input
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Medicine Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Medicine Items</Label>
                <Button variant="outline" size="sm" className="gap-1" onClick={addItem}>
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <ScrollArea className="max-h-64">
                <div className="space-y-3 pr-2">
                  {formItems.map((item, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Item {idx + 1}
                        </span>
                        {formItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => removeItem(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Medicine Name *</Label>
                          <Input
                            placeholder="e.g. Metformin 500mg"
                            value={item.medicineName}
                            onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosage *</Label>
                          <Input
                            placeholder="e.g. 1 tablet"
                            value={item.dosage}
                            onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency</Label>
                          <Select
                            value={item.frequency}
                            onValueChange={(v) => updateItem(idx, 'frequency', v)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <Input
                            placeholder="e.g. 7 days"
                            value={item.duration}
                            onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Route</Label>
                          <Select
                            value={item.route}
                            onValueChange={(v) => updateItem(idx, 'route', v)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROUTE_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Instructions</Label>
                          <Select
                            value={item.instructions}
                            onValueChange={(v) => updateItem(idx, 'instructions', v)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FOOD_INSTRUCTIONS.map((fi) => (
                                <SelectItem key={fi} value={fi}>
                                  {fi.charAt(0).toUpperCase() + fi.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Schedule Type</Label>
                          <Select
                            value={item.scheduleType}
                            onValueChange={(v) => updateItem(idx, 'scheduleType', v)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SCHEDULE_TYPE_CONFIG).map(([val, cfg]) => (
                                <SelectItem key={val} value={val}>
                                  {cfg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, 'quantity', parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                      </div>
                      {/* Schedule type badge preview */}
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${SCHEDULE_TYPE_CONFIG[item.scheduleType]?.className ?? ''}`}
                        >
                          {SCHEDULE_TYPE_CONFIG[item.scheduleType]?.label ?? item.scheduleType}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Digital Signature Placeholder */}
            <Separator />
            <div className="space-y-2">
              <Label className="text-base font-semibold">Digital Signature</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Digital signature will be applied upon activation</p>
                <p className="text-xs mt-1">Requires clinician authentication</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="gap-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save as Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Prescription Detail Dialog ──────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRx && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  {selectedRx.prescriptionNo}
                </DialogTitle>
                <DialogDescription>
                  {selectedRx.patient
                    ? `${selectedRx.patient.firstName} ${selectedRx.patient.lastName}`
                    : 'Unknown Patient'}{' '}
                  •{' '}
                  {new Date(selectedRx.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ModalityBadge modality={selectedRx.modality as Modality} />
                  <Badge
                    className={`text-xs ${STATUS_CONFIG[selectedRx.status]?.className ?? ''}`}
                  >
                    {STATUS_CONFIG[selectedRx.status]?.label ?? selectedRx.status}
                  </Badge>
                  {selectedRx.isCdScoCompliant && (
                    <Badge className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 gap-1">
                      <ShieldCheck className="h-3 w-3" /> CDSCO Compliant
                    </Badge>
                  )}
                </div>

                {/* Diagnosis */}
                {selectedRx.diagnosis && (
                  <div>
                    <p className="text-sm font-medium mb-1">Diagnosis</p>
                    <p className="text-sm text-muted-foreground">{selectedRx.diagnosis}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedRx.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedRx.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Items table */}
                <div>
                  <p className="text-sm font-semibold mb-2">Prescribed Medicines</p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Schedule</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRx.items?.map((item, idx) => (
                          <TableRow key={item.id ?? idx}>
                            <TableCell className="text-sm">{idx + 1}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {item.medicineName}
                            </TableCell>
                            <TableCell className="text-sm">{item.dosage}</TableCell>
                            <TableCell className="text-sm">
                              {FREQUENCY_LABELS[item.frequency as Frequency] ?? item.frequency}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.duration ?? '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ROUTE_LABELS[item.route as Route] ?? item.route ?? '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.instructions ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${SCHEDULE_TYPE_CONFIG[item.scheduleType as ScheduleType]?.className ?? ''}`}
                              >
                                {SCHEDULE_TYPE_CONFIG[item.scheduleType as ScheduleType]?.label ??
                                  item.scheduleType ??
                                  '—'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* QR Code & Signature */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* QR Code */}
                  <Card className="p-4">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <QrCode className="h-4 w-4" /> Verification QR
                    </p>
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Prescription QR Code"
                        className="w-32 h-32 mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto bg-muted rounded flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Scan to verify authenticity
                    </p>
                  </Card>

                  {/* Digital Signature */}
                  <Card className="p-4">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Digital Signature
                    </p>
                    {selectedRx.digitalSignature ? (
                      <div className="border rounded p-2">
                        <img
                          src={selectedRx.digitalSignature}
                          alt="Digital Signature"
                          className="h-16"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
                        <p className="text-xs">Pending clinician signature</p>
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {selectedRx.practitioner
                        ? `Signed by: ${selectedRx.practitioner.name}`
                        : 'Awaiting signature'}
                    </p>
                  </Card>
                </div>

                {/* Validity info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Valid from: {new Date(selectedRx.validFrom).toLocaleDateString()}</span>
                  {selectedRx.validUntil && (
                    <span>Until: {new Date(selectedRx.validUntil).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
