'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FlaskConical,
  TestTube,
  Clock,
  CheckCircle2,
  AlertCircle,
  Beaker,
  Plus,
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
import { toast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────

type LabOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
type LabPriority = 'ROUTINE' | 'URGENT' | 'STAT'
type TestCategory = 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'MICROBIOLOGY' | 'RADIOLOGY' | 'PATHOLOGY'

interface LabTest {
  id: string
  testName: string
  testCode: string | null
  category: string | null
  status: string
  resultValue: string | null
  resultUnit: string | null
  referenceRange: string | null
  isAbnormal: boolean
  remarks: string | null
  completedAt: string | null
  createdAt: string
}

interface LabOrder {
  id: string
  orderNumber: string
  patientId: string
  patient?: { id: string; firstName: string; lastName: string }
  practitioner?: { id: string; name: string }
  status: LabOrderStatus
  priority: LabPriority
  modality: string
  notes: string | null
  orderedAt: string
  sampleCollectedAt: string | null
  completedAt: string | null
  createdAt: string
  tests: LabTest[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Constants ───────────────────────────────────────────────────────────

const STATUS_STEPS: LabOrderStatus[] = [
  'ORDERED',
  'SAMPLE_COLLECTED',
  'PROCESSING',
  'COMPLETED',
]

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; className: string }> = {
  ORDERED: {
    label: 'Ordered',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  SAMPLE_COLLECTED: {
    label: 'Sample Collected',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

const PRIORITY_CONFIG: Record<LabPriority, { label: string; className: string }> = {
  ROUTINE: {
    label: 'Routine',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  STAT: {
    label: 'STAT',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  HEMATOLOGY: Beaker,
  BIOCHEMISTRY: FlaskConical,
  MICROBIOLOGY: TestTube,
  RADIOLOGY: AlertCircle,
  PATHOLOGY: FlaskConical,
}

// Common tests with LOINC codes
const COMMON_TESTS: Array<{
  name: string
  loinc: string
  category: TestCategory
}> = [
  { name: 'Complete Blood Count (CBC)', loinc: '58410-2', category: 'HEMATOLOGY' },
  { name: 'Hemoglobin (Hb)', loinc: '718-7', category: 'HEMATOLOGY' },
  { name: 'HbA1c', loinc: '4548-4', category: 'BIOCHEMISTRY' },
  { name: 'Lipid Profile', loinc: '57698-3', category: 'BIOCHEMISTRY' },
  { name: 'Liver Function Test (LFT)', loinc: '24321-2', category: 'BIOCHEMISTRY' },
  { name: 'Kidney Function Test (KFT)', loinc: '62238-1', category: 'BIOCHEMISTRY' },
  { name: 'Thyroid Panel (TSH/T3/T4)', loinc: '48013-1', category: 'BIOCHEMISTRY' },
  { name: 'Blood Glucose Fasting', loinc: '2345-7', category: 'BIOCHEMISTRY' },
  { name: 'Blood Glucose Post-Prandial', loinc: '88362-6', category: 'BIOCHEMISTRY' },
  { name: 'Urinalysis', loinc: '24357-3', category: 'MICROBIOLOGY' },
  { name: 'ESR', loinc: '4537-7', category: 'HEMATOLOGY' },
  { name: 'CRP (C-Reactive Protein)', loinc: '1988-5', category: 'BIOCHEMISTRY' },
  { name: 'WBC Differential', loinc: '6718-6', category: 'HEMATOLOGY' },
  { name: 'Platelet Count', loinc: '777-3', category: 'HEMATOLOGY' },
  { name: 'Serum Electrolytes', loinc: '2951-2', category: 'BIOCHEMISTRY' },
  { name: 'Vitamin D (25-OH)', loinc: '1989-3', category: 'BIOCHEMISTRY' },
  { name: 'Vitamin B12', loinc: '2131-1', category: 'BIOCHEMISTRY' },
  { name: 'D-Dimer', loinc: '48067-7', category: 'BIOCHEMISTRY' },
  { name: 'Chest X-Ray', loinc: '58417-7', category: 'RADIOLOGY' },
  { name: 'ECG', loinc: '11556-8', category: 'RADIOLOGY' },
]

// ─── Animation ───────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ─── Component ───────────────────────────────────────────────────────────

export function LabOrdersSection() {
  const { selectedPatientId } = useAppStore()

  const [labOrders, setLabOrders] = useState<LabOrder[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryTab, setCategoryTab] = useState<string>('all')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState(selectedPatientId ?? '')
  const [formPriority, setFormPriority] = useState<LabPriority>('ROUTINE')
  const [formNotes, setFormNotes] = useState('')
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)

  // ─── Fetch patients ───────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => setPatients(d.data ?? d.patients ?? []))
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
      })
  }, [])

  // ─── Fetch lab orders ─────────────────────────────────────────────

  const loadLabOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
      if (selectedPatientId) params.set('patientId', selectedPatientId)
      const res = await fetch(`/api/lab-orders?${params.toString()}`)
      const json = await res.json()
      const raw = json.data ?? json.labOrders ?? []
      const mapped = raw.map((o: Record<string, unknown>) => {
        const patient = o.patient as { id: string; firstName: string; lastName: string } | undefined
        const practitioner = o.practitioner as { id: string; name: string } | undefined
        const tests = (Array.isArray(o.tests) ? o.tests : []) as LabTest[]
        return {
          id: o.id as string,
          orderNumber: (o.orderNumber ?? '') as string,
          patientId: (o.patientId ?? '') as string,
          patient,
          practitioner,
          status: (o.status ?? 'ORDERED') as LabOrderStatus,
          priority: (o.priority ?? 'ROUTINE') as LabPriority,
          modality: (o.modality ?? 'ALLOPATHY') as string,
          notes: (o.notes ?? null) as string | null,
          orderedAt: (o.orderedAt ?? o.createdAt ?? new Date().toISOString()) as string,
          sampleCollectedAt: (o.sampleCollectedAt ?? null) as string | null,
          completedAt: (o.completedAt ?? null) as string | null,
          createdAt: (o.createdAt ?? new Date().toISOString()) as string,
          tests,
        } as LabOrder
      })
      setLabOrders(mapped)
    } catch {
      toast({ title: 'Error', description: 'Failed to load lab orders', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, selectedPatientId])

  useEffect(() => { loadLabOrders() }, [loadLabOrders])

  // ─── Test toggle ──────────────────────────────────────────────────

  const toggleTest = (testName: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev)
      if (next.has(testName)) next.delete(testName)
      else next.add(testName)
      return next
    })
  }

  // ─── Create lab order ─────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formPatientId) {
      toast({ title: 'Validation', description: 'Select a patient', variant: 'destructive' })
      return
    }
    if (selectedTests.size === 0) {
      toast({ title: 'Validation', description: 'Select at least one test', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const tests = Array.from(selectedTests).map((name) => {
        const match = COMMON_TESTS.find((t) => t.name === name)
        return {
          testName: name,
          testCode: match?.loinc ?? '',
          category: match?.category ?? 'BIOCHEMISTRY',
        }
      })
      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          priority: formPriority,
          notes: formNotes || undefined,
          tests,
        }),
      })
      if (res.ok) {
        toast({ title: 'Lab Order Created', description: `Order with ${tests.length} test(s) placed` })
        setCreateOpen(false)
        resetForm()
        loadLabOrders()
      } else {
        toast({ title: 'Error', description: 'Failed to create lab order', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormPatientId(selectedPatientId ?? '')
    setFormPriority('ROUTINE')
    setFormNotes('')
    setSelectedTests(new Set())
  }

  // ─── Filtered orders by category tab ──────────────────────────────

  const filteredOrders = labOrders.filter((order) => {
    if (categoryTab === 'all') return true
    return order.tests?.some((t) => t.category === categoryTab)
  })

  // ─── Status timeline step index ───────────────────────────────────

  const getStepIndex = (status: LabOrderStatus): number => {
    if (status === 'CANCELLED') return -1
    return STATUS_STEPS.indexOf(status)
  }

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
            <FlaskConical className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lab & Diagnostics</h2>
            <p className="text-sm text-muted-foreground">Order tests, track results, and flag abnormal values</p>
          </div>
        </div>
        <Button
          className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => {
            resetForm()
            setCreateOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> New Lab Order
        </Button>
      </div>

      {/* Status Filter + Category Tabs */}
      <Tabs
        value={categoryTab}
        onValueChange={setCategoryTab}
        className="space-y-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              All
            </TabsTrigger>
            <TabsTrigger value="HEMATOLOGY" className="gap-1">
              <Beaker className="h-3 w-3" /> Hematology
            </TabsTrigger>
            <TabsTrigger value="BIOCHEMISTRY" className="gap-1">
              <FlaskConical className="h-3 w-3" /> Biochemistry
            </TabsTrigger>
            <TabsTrigger value="MICROBIOLOGY" className="gap-1">
              <TestTube className="h-3 w-3" /> Microbiology
            </TabsTrigger>
            <TabsTrigger value="RADIOLOGY" className="gap-1">
              Radiology
            </TabsTrigger>
            <TabsTrigger value="PATHOLOGY" className="gap-1">
              Pathology
            </TabsTrigger>
          </TabsList>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ORDERED">Ordered</SelectItem>
              <SelectItem value="SAMPLE_COLLECTED">Sample Collected</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* All tab contents share the same table */}
        {['all', 'HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'RADIOLOGY', 'PATHOLOGY'].map(
          (tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(
                  ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as LabOrderStatus[]
                ).map((st) => {
                  const count = filteredOrders.filter((o) => o.status === st).length
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

              {/* Lab orders table */}
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No lab orders found
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Tests</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ordered</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => {
                            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.ORDERED
                            const priCfg = PRIORITY_CONFIG[order.priority] ?? PRIORITY_CONFIG.ROUTINE
                            const hasAbnormal = order.tests?.some((t) => t.isAbnormal)
                            return (
                              <TableRow
                                key={order.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setDetailOpen(true)
                                }}
                              >
                                <TableCell className="font-mono text-sm font-medium">
                                  {order.orderNumber}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {order.patient
                                    ? `${order.patient.firstName} ${order.patient.lastName}`
                                    : '—'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-xs ${priCfg.className}`}>
                                    {priCfg.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {order.tests?.length ?? 0}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Badge className={`text-xs ${statusCfg.className}`}>
                                      {statusCfg.label}
                                    </Badge>
                                    {hasAbnormal && (
                                      <AlertCircle className="h-3 w-3 text-red-500" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(order.orderedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedOrder(order)
                                      setDetailOpen(true)
                                    }}
                                  >
                                    <FlaskConical className="h-4 w-4" />
                                  </Button>
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
          )
        )}
      </Tabs>

      {/* ─── Create Lab Order Dialog ─────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-teal-600" /> New Lab Order
            </DialogTitle>
            <DialogDescription>
              Select tests to order — LOINC codes are auto-assigned
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Patient & Priority */}
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
                <Label>Priority *</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as LabPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="STAT">STAT (Immediately)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Clinical notes for lab..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            {/* Test selection by category */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Tests</Label>
                <Badge variant="outline" className="text-xs">
                  {selectedTests.size} selected
                </Badge>
              </div>

              {/* Grouped by category */}
              {(
                ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'RADIOLOGY', 'PATHOLOGY'] as TestCategory[]
              ).map((cat) => {
                const catTests = COMMON_TESTS.filter((t) => t.category === cat)
                if (catTests.length === 0) return null
                const CatIcon = CATEGORY_ICONS[cat] ?? FlaskConical
                return (
                  <Card key={cat} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catTests.map((test) => {
                        const isSelected = selectedTests.has(test.name)
                        return (
                          <Button
                            key={test.name}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className={`justify-start text-xs h-auto py-2 px-3 ${
                              isSelected
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : ''
                            }`}
                            onClick={() => toggleTest(test.name)}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
                            ) : (
                              <Plus className="h-3 w-3 mr-1 shrink-0" />
                            )}
                            <span className="truncate">{test.name}</span>
                            <span className="ml-auto text-[10px] opacity-60 shrink-0">
                              {test.loinc}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  </Card>
                )
              })}
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
              {submitting ? 'Ordering...' : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Lab Order Detail Dialog ─────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-teal-600" />
                  {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.patient
                    ? `${selectedOrder.patient.firstName} ${selectedOrder.patient.lastName}`
                    : 'Unknown Patient'}{' '}
                  • Ordered {new Date(selectedOrder.orderedAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`text-xs ${STATUS_CONFIG[selectedOrder.status]?.className ?? ''}`}
                  >
                    {STATUS_CONFIG[selectedOrder.status]?.label ?? selectedOrder.status}
                  </Badge>
                  <Badge
                    className={`text-xs ${PRIORITY_CONFIG[selectedOrder.priority]?.className ?? ''}`}
                  >
                    {PRIORITY_CONFIG[selectedOrder.priority]?.label ?? selectedOrder.priority}
                  </Badge>
                  {selectedOrder.tests?.some((t) => t.isAbnormal) && (
                    <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1">
                      <AlertCircle className="h-3 w-3" /> Abnormal Results
                    </Badge>
                  )}
                </div>

                {/* Status Timeline */}
                <Card className="p-4">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Status Timeline
                  </p>
                  <div className="flex items-center gap-0">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedOrder.status)
                      const isCompleted = currentIdx >= idx && currentIdx !== -1
                      const isCurrent = currentIdx === idx
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCompleted
                                  ? 'bg-teal-600 text-white'
                                  : isCurrent
                                  ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-600 dark:bg-teal-900 dark:text-teal-200'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-[10px] mt-1 text-center ${
                                isCompleted || isCurrent
                                  ? 'text-teal-700 dark:text-teal-300 font-medium'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {STATUS_CONFIG[step].label}
                            </span>
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 ${
                                currentIdx > idx && currentIdx !== -1
                                  ? 'bg-teal-600'
                                  : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Results table */}
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <TestTube className="h-4 w-4" /> Test Results
                  </p>
                  {selectedOrder.tests?.length ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test</TableHead>
                            <TableHead>LOINC</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Reference Range</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.tests.map((test) => {
                            const CatIcon = CATEGORY_ICONS[test.category ?? ''] ?? FlaskConical
                            return (
                              <TableRow
                                key={test.id}
                                className={
                                  test.isAbnormal
                                    ? 'bg-red-50 dark:bg-red-950/30'
                                    : ''
                                }
                              >
                                <TableCell className="text-sm font-medium">
                                  {test.testName}
                                </TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">
                                  {test.testCode ?? '—'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <CatIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">
                                      {test.category
                                        ? test.category.charAt(0) +
                                          test.category.slice(1).toLowerCase()
                                        : '—'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {test.resultValue ? (
                                    <span
                                      className={`text-sm font-medium ${
                                        test.isAbnormal
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-teal-700 dark:text-teal-300'
                                      }`}
                                    >
                                      {test.resultValue}{' '}
                                      {test.resultUnit && (
                                        <span className="font-normal text-muted-foreground">
                                          {test.resultUnit}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Pending
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {test.referenceRange ?? '—'}
                                </TableCell>
                                <TableCell>
                                  {test.isAbnormal ? (
                                    <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1">
                                      <AlertCircle className="h-3 w-3" /> Abnormal
                                    </Badge>
                                  ) : test.status === 'COMPLETED' ? (
                                    <Badge className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Normal
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      {test.status}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tests in this order</p>
                  )}
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>Ordered: {new Date(selectedOrder.orderedAt).toLocaleString()}</span>
                  {selectedOrder.sampleCollectedAt && (
                    <span>
                      Sample collected: {new Date(selectedOrder.sampleCollectedAt).toLocaleString()}
                    </span>
                  )}
                  {selectedOrder.completedAt && (
                    <span>
                      Completed: {new Date(selectedOrder.completedAt).toLocaleString()}
                    </span>
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
