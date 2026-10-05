'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  CreditCard,
  Receipt,
  IndianRupee,
  Check,
  AlertTriangle,
  FileText,
  Plus,
  X,
  Clock,
  User,
  Upload,
  ChevronDown,
  TrendingUp,
  Ban,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────

type PlanType = 'INDIVIDUAL' | 'FAMILY' | 'GROUP' | 'CORPORATE'
type CoverageType = 'CASHLESS' | 'REIMBURSEMENT'
type PolicyStatus = 'ACTIVE' | 'EXPIRED'
type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'SETTLED'
type InvoiceStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'INSURANCE'
type LineItemType = 'CONSULTATION' | 'MEDICINES' | 'LAB' | 'PROCEDURES' | 'OTHER'

interface InsurancePolicy {
  id: string
  patientId: string
  providerName: string
  policyNumber: string
  planType: PlanType
  coverageType: CoverageType
  abhaLinked: boolean
  ayushmanBharat: boolean
  coPayPercent: number
  maxCoverage: number
  status: PolicyStatus
  validFrom: string
  validTo: string
}

interface Claim {
  id: string
  policyId: string
  patientId: string
  amount: number
  type: string
  status: ClaimStatus
  submittedAt: string
  updatedAt: string
  documents: string[]
  denialReason?: string
  approvedAmount?: number
}

interface LineItem {
  id: string
  type: LineItemType
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Invoice {
  id: string
  patientId: string
  invoiceNumber: string
  lineItems: LineItem[]
  subtotal: number
  discount: number
  tax: number
  netAmount: number
  status: InvoiceStatus
  dueDate: string
  createdAt: string
  payments: Payment[]
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  reference: string
  paidAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ── Constants ────────────────────────────────────────────────────────────

const INSURANCE_PROVIDERS = [
  'Star Health',
  'ICICI Lombard',
  'HDFC ERGO',
  'New India Assurance',
  'Bajaj Allianz',
  'Max Bupa',
  'Religare Health',
  'United India Insurance',
  'Oriental Insurance',
  'National Insurance',
]

const GST_RATE = 0.18

const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  APPROVED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  PARTIALLY_APPROVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SETTLED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

// ── Sample Data ──────────────────────────────────────────────────────────

const SAMPLE_POLICIES: InsurancePolicy[] = [
  {
    id: 'pol-1',
    patientId: 'p-1',
    providerName: 'Star Health',
    policyNumber: 'SH-2025-78432',
    planType: 'FAMILY',
    coverageType: 'CASHLESS',
    abhaLinked: true,
    ayushmanBharat: false,
    coPayPercent: 10,
    maxCoverage: 500000,
    status: 'ACTIVE',
    validFrom: '2025-01-01',
    validTo: '2026-01-01',
  },
  {
    id: 'pol-2',
    patientId: 'p-1',
    providerName: 'New India Assurance',
    policyNumber: 'NIA-2024-9210',
    planType: 'INDIVIDUAL',
    coverageType: 'REIMBURSEMENT',
    abhaLinked: false,
    ayushmanBharat: true,
    coPayPercent: 0,
    maxCoverage: 500000,
    status: 'ACTIVE',
    validFrom: '2024-04-01',
    validTo: '2025-04-01',
  },
]

const SAMPLE_CLAIMS: Claim[] = [
  {
    id: 'clm-1',
    policyId: 'pol-1',
    patientId: 'p-1',
    amount: 85000,
    type: 'Hospitalization',
    status: 'SETTLED',
    submittedAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-02-05T14:00:00Z',
    documents: ['Discharge Summary', 'Bills', 'Lab Reports'],
    approvedAmount: 76500,
  },
  {
    id: 'clm-2',
    policyId: 'pol-1',
    patientId: 'p-1',
    amount: 12000,
    type: 'Outpatient',
    status: 'UNDER_REVIEW',
    submittedAt: '2025-03-01T09:00:00Z',
    updatedAt: '2025-03-02T11:00:00Z',
    documents: ['Prescription', 'Pharmacy Bill'],
  },
  {
    id: 'clm-3',
    policyId: 'pol-2',
    patientId: 'p-1',
    amount: 3500,
    type: 'Lab Investigation',
    status: 'REJECTED',
    submittedAt: '2025-02-10T08:00:00Z',
    updatedAt: '2025-02-15T16:00:00Z',
    documents: ['Lab Report'],
    denialReason: 'Investigation not covered under policy terms. Pre-authorization was not obtained.',
  },
]

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    patientId: 'p-1',
    invoiceNumber: 'INV-2025-001',
    lineItems: [
      { id: 'li-1', type: 'CONSULTATION', description: 'Cardiology Consultation', quantity: 1, unitPrice: 1500, amount: 1500 },
      { id: 'li-2', type: 'LAB', description: 'Troponin I + CK-MB', quantity: 1, unitPrice: 1800, amount: 1800 },
      { id: 'li-3', type: 'MEDICINES', description: 'Aspirin 325mg (30 tabs)', quantity: 1, unitPrice: 45, amount: 45 },
      { id: 'li-4', type: 'MEDICINES', description: 'Clopidogrel 75mg (30 tabs)', quantity: 1, unitPrice: 120, amount: 120 },
      { id: 'li-5', type: 'PROCEDURES', description: 'ECG', quantity: 1, unitPrice: 500, amount: 500 },
    ],
    subtotal: 3965,
    discount: 0,
    tax: 713.7,
    netAmount: 4678.7,
    status: 'PAID',
    dueDate: '2025-02-15',
    createdAt: '2025-01-18T10:00:00Z',
    payments: [
      { id: 'pay-1', invoiceId: 'inv-1', amount: 4678.7, method: 'INSURANCE', reference: 'CLM-SH-78432', paidAt: '2025-02-05T14:00:00Z' },
    ],
  },
  {
    id: 'inv-2',
    patientId: 'p-1',
    invoiceNumber: 'INV-2025-002',
    lineItems: [
      { id: 'li-6', type: 'CONSULTATION', description: 'Ayurveda Consultation', quantity: 1, unitPrice: 800, amount: 800 },
      { id: 'li-7', type: 'MEDICINES', description: 'Arjuna Kwath (30 days)', quantity: 1, unitPrice: 350, amount: 350 },
      { id: 'li-8', type: 'MEDICINES', description: 'Guggulu 500mg (60 tabs)', quantity: 1, unitPrice: 280, amount: 280 },
    ],
    subtotal: 1430,
    discount: 100,
    tax: 239.4,
    netAmount: 1569.4,
    status: 'PENDING',
    dueDate: '2025-03-15',
    createdAt: '2025-02-01T12:00:00Z',
    payments: [],
  },
  {
    id: 'inv-3',
    patientId: 'p-1',
    invoiceNumber: 'INV-2025-003',
    lineItems: [
      { id: 'li-9', type: 'CONSULTATION', description: 'Follow-up Consultation', quantity: 1, unitPrice: 1500, amount: 1500 },
      { id: 'li-10', type: 'LAB', description: 'Lipid Panel', quantity: 1, unitPrice: 800, amount: 800 },
    ],
    subtotal: 2300,
    discount: 0,
    tax: 414,
    netAmount: 2714,
    status: 'OVERDUE',
    dueDate: '2025-02-28',
    createdAt: '2025-02-05T09:00:00Z',
    payments: [],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  return status !== 'PAID' && status !== 'CANCELLED' && new Date(dueDate) < new Date()
}

function claimStatusFlow(current: ClaimStatus): ClaimStatus[] {
  const flow: ClaimStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SETTLED']
  const altFlow: ClaimStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'PARTIALLY_APPROVED', 'SETTLED']
  const rejectFlow: ClaimStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED']

  if (current === 'PARTIALLY_APPROVED') return altFlow
  if (current === 'REJECTED') return rejectFlow
  return flow
}

// ── Component ────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function InsuranceSection() {
  const { selectedPatientId, setSelectedPatientId } = useAppStore()

  // Data state
  const [patients, setPatients] = useState<Patient[]>([])
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [patientsLoading, setPatientsLoading] = useState(true)

  // Dialog state
  const [addPolicyOpen, setAddPolicyOpen] = useState(false)
  const [addClaimOpen, setAddClaimOpen] = useState(false)
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [claimDetailOpen, setClaimDetailOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Insurance form state
  const [formProvider, setFormProvider] = useState('')
  const [formPolicyNumber, setFormPolicyNumber] = useState('')
  const [formPlanType, setFormPlanType] = useState<PlanType>('INDIVIDUAL')
  const [formCoverageType, setFormCoverageType] = useState<CoverageType>('CASHLESS')
  const [formAbhaLinked, setFormAbhaLinked] = useState(false)
  const [formAyushman, setFormAyushman] = useState(false)
  const [formCoPay, setFormCoPay] = useState('10')
  const [formMaxCoverage, setFormMaxCoverage] = useState('500000')

  // Claim form state
  const [claimAmount, setClaimAmount] = useState('')
  const [claimType, setClaimType] = useState('')
  const [claimDocs, setClaimDocs] = useState('')
  const [claimPolicyId, setClaimPolicyId] = useState('')

  // Invoice form state
  const [invoiceLineItems, setInvoiceLineItems] = useState<LineItem[]>([
    { id: 'new-1', type: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ])
  const [invoiceDiscount, setInvoiceDiscount] = useState('0')
  const [invoiceDueDate, setInvoiceDueDate] = useState('')

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI')
  const [payReference, setPayReference] = useState('')

  const localPatientId = selectedPatientId ?? 'p-1'

  // ── Load patients ────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients')
      const json = await res.json()
      setPatients(json.data ?? json.patients ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
    } finally {
      setPatientsLoading(false)
    }
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  // ── Load insurance data ──────────────────────────────────────────────
  const loadInsurance = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/insurance?patientId=${localPatientId}`)
      if (res.ok) {
        const json = await res.json()
        const raw = json.data ?? json.policies
        if (Array.isArray(raw) && raw.length > 0) {
          setPolicies(raw)
        } else {
          setPolicies(SAMPLE_POLICIES)
        }
        // Load claims separately
        try {
          const claimsRes = await fetch(`/api/insurance?subroute=claims&patientId=${localPatientId}`)
          if (claimsRes.ok) {
            const claimsJson = await claimsRes.json()
            const claimsRaw = claimsJson.data ?? claimsJson.claims
            setClaims(Array.isArray(claimsRaw) && claimsRaw.length > 0 ? claimsRaw : SAMPLE_CLAIMS)
          } else {
            setClaims(SAMPLE_CLAIMS)
          }
        } catch {
          setClaims(SAMPLE_CLAIMS)
        }
      } else {
        setPolicies(SAMPLE_POLICIES)
        setClaims(SAMPLE_CLAIMS)
      }
    } catch {
      setPolicies(SAMPLE_POLICIES)
      setClaims(SAMPLE_CLAIMS)
    } finally {
      setLoading(false)
    }
  }, [localPatientId])

  useEffect(() => { loadInsurance() }, [loadInsurance])

  // ── Load billing data ────────────────────────────────────────────────
  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch(`/api/billing?patientId=${localPatientId}`)
      if (res.ok) {
        const json = await res.json()
        const raw = json.data ?? json.invoices
        if (Array.isArray(raw) && raw.length > 0) {
          setInvoices(raw)
        } else {
          setInvoices(SAMPLE_INVOICES)
        }
      } else {
        setInvoices(SAMPLE_INVOICES)
      }
    } catch {
      setInvoices(SAMPLE_INVOICES)
    }
  }, [localPatientId])

  useEffect(() => { loadBilling() }, [loadBilling])

  // ── Invoice calculations ─────────────────────────────────────────────
  const invoiceCalculations = useMemo(() => {
    const subtotal = invoiceLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discount = parseFloat(invoiceDiscount) || 0
    const afterDiscount = subtotal - discount
    const tax = afterDiscount * GST_RATE
    const netAmount = afterDiscount + tax
    return { subtotal, discount, tax, netAmount }
  }, [invoiceLineItems, invoiceDiscount])

  // ── Stats ────────────────────────────────────────────────────────────
  const billingStats = useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.status === 'PAID' || i.status === 'PARTIALLY_PAID')
      .reduce((sum, i) => sum + i.payments.reduce((pSum, p) => pSum + p.amount, 0), 0)

    const pendingAmount = invoices
      .filter((i) => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID')
      .reduce((sum, i) => {
        const paid = i.payments.reduce((pSum, p) => pSum + p.amount, 0)
        return sum + (i.netAmount - paid)
      }, 0)

    const overdueAmount = invoices
      .filter((i) => isOverdue(i.dueDate, i.status))
      .reduce((sum, i) => {
        const paid = i.payments.reduce((pSum, p) => pSum + p.amount, 0)
        return sum + (i.netAmount - paid)
      }, 0)

    const claimsPending = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length

    return { totalRevenue, pendingAmount, overdueAmount, claimsPending }
  }, [invoices, claims])

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleAddPolicy = () => {
    const newPolicy: InsurancePolicy = {
      id: `pol-${Date.now()}`,
      patientId: localPatientId,
      providerName: formProvider,
      policyNumber: formPolicyNumber,
      planType: formPlanType,
      coverageType: formCoverageType,
      abhaLinked: formAbhaLinked,
      ayushmanBharat: formAyushman,
      coPayPercent: parseInt(formCoPay) || 0,
      maxCoverage: parseInt(formMaxCoverage) || 0,
      status: 'ACTIVE',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    }
    setPolicies((prev) => [...prev, newPolicy])
    setAddPolicyOpen(false)
    toast({ title: 'Policy Added', description: `${formProvider} policy added successfully` })
    // Reset form
    setFormProvider('')
    setFormPolicyNumber('')
    setFormPlanType('INDIVIDUAL')
    setFormCoverageType('CASHLESS')
    setFormAbhaLinked(false)
    setFormAyushman(false)
    setFormCoPay('10')
    setFormMaxCoverage('500000')
  }

  const handleAddClaim = () => {
    const newClaim: Claim = {
      id: `clm-${Date.now()}`,
      policyId: claimPolicyId,
      patientId: localPatientId,
      amount: parseFloat(claimAmount) || 0,
      type: claimType,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: claimDocs.split(',').map((d) => d.trim()).filter(Boolean),
    }
    setClaims((prev) => [...prev, newClaim])
    setAddClaimOpen(false)
    toast({ title: 'Claim Submitted', description: `₹${claimAmount} claim submitted for review` })
    setClaimAmount('')
    setClaimType('')
    setClaimDocs('')
    setClaimPolicyId('')
  }

  const handleAddInvoice = () => {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      patientId: localPatientId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      lineItems: invoiceLineItems.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      })),
      subtotal: invoiceCalculations.subtotal,
      discount: invoiceCalculations.discount,
      tax: invoiceCalculations.tax,
      netAmount: invoiceCalculations.netAmount,
      status: 'PENDING',
      dueDate: invoiceDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      payments: [],
    }
    setInvoices((prev) => [...prev, newInvoice])
    setAddInvoiceOpen(false)
    toast({ title: 'Invoice Created', description: `${newInvoice.invoiceNumber} for ${formatCurrency(invoiceCalculations.netAmount)}` })
    setInvoiceLineItems([{ id: 'new-1', type: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0, amount: 0 }])
    setInvoiceDiscount('0')
    setInvoiceDueDate('')
  }

  const handleRecordPayment = () => {
    if (!selectedInvoice) return
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: selectedInvoice.id,
      amount: parseFloat(payAmount) || 0,
      method: payMethod,
      reference: payReference,
      paidAt: new Date().toISOString(),
    }

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== selectedInvoice.id) return inv
        const updatedPayments = [...inv.payments, newPayment]
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        let newStatus: InvoiceStatus = inv.status
        if (totalPaid >= inv.netAmount) newStatus = 'PAID'
        else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID'
        return { ...inv, payments: updatedPayments, status: newStatus }
      })
    )

    setRecordPaymentOpen(false)
    toast({ title: 'Payment Recorded', description: `${formatCurrency(parseFloat(payAmount))} via ${payMethod}` })
    setPayAmount('')
    setPayMethod('UPI')
    setPayReference('')
  }

  const addLineItem = () => {
    setInvoiceLineItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, type: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0, amount: 0 },
    ])
  }

  const removeLineItem = (id: string) => {
    setInvoiceLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoiceLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        updated.amount = updated.quantity * updated.unitPrice
        return updated
      })
    )
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Insurance & Billing</h2>
          <p className="text-sm text-muted-foreground">Manage insurance policies, claims, and billing</p>
        </div>
        <Select value={localPatientId} onValueChange={(v) => setSelectedPatientId(v)}>
          <SelectTrigger className="w-[200px]">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patientsLoading ? (
              <SelectItem value="loading" disabled>Loading…</SelectItem>
            ) : patients.length === 0 ? (
              <SelectItem value="demo" disabled>Demo Patient</SelectItem>
            ) : (
              patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Total Revenue</p>
              <p className="text-lg font-bold">{formatCurrency(billingStats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Pending</p>
              <p className="text-lg font-bold">{formatCurrency(billingStats.pendingAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Overdue</p>
              <p className="text-lg font-bold">{formatCurrency(billingStats.overdueAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Claims Pending</p>
              <p className="text-lg font-bold">{billingStats.claimsPending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="insurance" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="insurance" className="gap-1.5">
            <Shield className="h-4 w-4" />
            Insurance
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* ── Insurance Tab ─────────────────────────────────────────────── */}
        <TabsContent value="insurance" className="space-y-6 mt-6">
          {/* Policies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Insurance Policies</CardTitle>
                <CardDescription>Active and expired policies</CardDescription>
              </div>
              <Dialog open={addPolicyOpen} onOpenChange={setAddPolicyOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Add Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Insurance Policy</DialogTitle>
                    <DialogDescription>Enter policy details for this patient</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Provider</Label>
                      <Select value={formProvider} onValueChange={setFormProvider}>
                        <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                        <SelectContent>
                          {INSURANCE_PROVIDERS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Policy Number</Label>
                      <Input value={formPolicyNumber} onChange={(e) => setFormPolicyNumber(e.target.value)} placeholder="e.g., SH-2025-12345" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Plan Type</Label>
                        <Select value={formPlanType} onValueChange={(v) => setFormPlanType(v as PlanType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            <SelectItem value="FAMILY">Family</SelectItem>
                            <SelectItem value="GROUP">Group</SelectItem>
                            <SelectItem value="CORPORATE">Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Coverage Type</Label>
                        <Select value={formCoverageType} onValueChange={(v) => setFormCoverageType(v as CoverageType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASHLESS">Cashless</SelectItem>
                            <SelectItem value="REIMBURSEMENT">Reimbursement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={formAbhaLinked} onCheckedChange={setFormAbhaLinked} />
                        <Label className="text-sm">ABHA Linked</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={formAyushman} onCheckedChange={setFormAyushman} />
                        <Label className="text-sm">PM-JAY (Ayushman Bharat)</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Co-pay %</Label>
                        <Input type="number" value={formCoPay} onChange={(e) => setFormCoPay(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Max Coverage (₹)</Label>
                        <Input type="number" value={formMaxCoverage} onChange={(e) => setFormMaxCoverage(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddPolicyOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddPolicy} disabled={!formProvider || !formPolicyNumber}>Add Policy</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : policies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No policies found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <motion.div
                      key={policy.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border p-4 ${policy.status === 'EXPIRED' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{policy.providerName}</span>
                            <Badge variant="outline" className="text-[10px]">{policy.planType}</Badge>
                            <Badge variant="outline" className="text-[10px]">{policy.coverageType}</Badge>
                            {policy.ayushmanBharat && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px]">PM-JAY</Badge>
                            )}
                            {policy.abhaLinked && (
                              <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-[10px]">ABHA ✓</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Policy: {policy.policyNumber} • Co-pay: {policy.coPayPercent}% • Max: {formatCurrency(policy.maxCoverage)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Valid: {formatDate(policy.validFrom)} — {formatDate(policy.validTo)}
                          </p>
                        </div>
                        <Badge className={policy.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }>
                          {policy.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claims */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Claims</CardTitle>
                <CardDescription>Insurance claim tracking & status</CardDescription>
              </div>
              <Dialog open={addClaimOpen} onOpenChange={setAddClaimOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" /> New Claim
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit New Claim</DialogTitle>
                    <DialogDescription>Submit an insurance claim for reimbursement</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Policy</Label>
                      <Select value={claimPolicyId} onValueChange={setClaimPolicyId}>
                        <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                        <SelectContent>
                          {policies.filter((p) => p.status === 'ACTIVE').map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.providerName} ({p.policyNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Claim Amount (₹)</Label>
                      <Input type="number" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Claim Type</Label>
                      <Select value={claimType} onValueChange={setClaimType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hospitalization">Hospitalization</SelectItem>
                          <SelectItem value="Outpatient">Outpatient</SelectItem>
                          <SelectItem value="Lab Investigation">Lab Investigation</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                          <SelectItem value="Day Care">Day Care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Documents (comma-separated)</Label>
                      <Input value={claimDocs} onChange={(e) => setClaimDocs(e.target.value)} placeholder="Discharge Summary, Bills" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddClaimOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddClaim} disabled={!claimPolicyId || !claimAmount}>Submit Claim</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Claim ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                        <TableHead className="w-[60px]">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-xs">{claim.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm">{claim.type}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(claim.amount)}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${CLAIM_STATUS_COLORS[claim.status]}`}>
                              {claim.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                            {formatDate(claim.submittedAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedClaim(claim)
                                setClaimDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claim Detail Dialog */}
          <Dialog open={claimDetailOpen} onOpenChange={setClaimDetailOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Claim Detail</DialogTitle>
                <DialogDescription>
                  {selectedClaim?.id} — {selectedClaim?.type}
                </DialogDescription>
              </DialogHeader>
              {selectedClaim && (
                <div className="space-y-4 py-2">
                  {/* Status flow */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Claim Progress</Label>
                    <div className="flex items-center gap-1 mt-2">
                      {claimStatusFlow(selectedClaim.status).map((step, idx, arr) => {
                        const currentIdx = arr.indexOf(selectedClaim.status)
                        const isDone = idx <= currentIdx
                        const isCurrent = step === selectedClaim.status
                        return (
                          <div key={step} className="flex items-center gap-1">
                            <div className={`flex items-center justify-center rounded-full h-6 px-2 text-[10px] font-medium
                              ${isCurrent ? CLAIM_STATUS_COLORS[step] : isDone ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}
                            `}>
                              {isDone && !isCurrent ? <Check className="h-3 w-3 mr-0.5" /> : null}
                              {step.replace(/_/g, ' ')}
                            </div>
                            {idx < arr.length - 1 && (
                              <ChevronDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatCurrency(selectedClaim.amount)}</span></div>
                    {selectedClaim.approvedAmount != null && (
                      <div><span className="text-muted-foreground">Approved:</span> <span className="font-medium text-teal-600">{formatCurrency(selectedClaim.approvedAmount)}</span></div>
                    )}
                    <div><span className="text-muted-foreground">Submitted:</span> {formatDate(selectedClaim.submittedAt)}</div>
                    <div><span className="text-muted-foreground">Updated:</span> {formatDate(selectedClaim.updatedAt)}</div>
                  </div>

                  {selectedClaim.documents.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Documents</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedClaim.documents.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] gap-1">
                            <FileText className="h-3 w-3" /> {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedClaim.denialReason && (
                    <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Ban className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-sm text-red-800 dark:text-red-200">Denial Reason</span>
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300">{selectedClaim.denialReason}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Billing Tab ───────────────────────────────────────────────── */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          {/* Invoice List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Invoices</CardTitle>
                <CardDescription>Invoice management & payment tracking</CardDescription>
              </div>
              <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                    <DialogDescription>Add line items, discount and generate invoice</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    {/* Line Items */}
                    <div>
                      <Label className="text-sm font-medium">Line Items</Label>
                      <div className="space-y-2 mt-2">
                        {invoiceLineItems.map((item, idx) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-3">
                              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Type</Label>}
                              <Select value={item.type} onValueChange={(v) => updateLineItem(item.id, 'type', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONSULTATION">Consultation</SelectItem>
                                  <SelectItem value="MEDICINES">Medicines</SelectItem>
                                  <SelectItem value="LAB">Lab</SelectItem>
                                  <SelectItem value="PROCEDURES">Procedures</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3">
                              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Description</Label>}
                              <Input className="h-8 text-xs" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Item name" />
                            </div>
                            <div className="col-span-2">
                              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                              <Input className="h-8 text-xs" type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-2">
                              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Price (₹)</Label>}
                              <Input className="h-8 text-xs" type="number" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="col-span-1 text-right text-xs font-medium">
                              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Amt</Label>}
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </div>
                            <div className="col-span-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(item.id)} disabled={invoiceLineItems.length === 1}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addLineItem}>
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                    </div>

                    <Separator />

                    {/* Calculations */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoiceCalculations.subtotal)}</span></div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Discount (₹)</span>
                        <Input className="h-7 w-28 text-xs text-right" type="number" value={invoiceDiscount} onChange={(e) => setInvoiceDiscount(e.target.value)} />
                      </div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Tax (18% GST)</span><span>{formatCurrency(invoiceCalculations.tax)}</span></div>
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Net Amount</span>
                        <span className="text-teal-600 dark:text-teal-400">{formatCurrency(invoiceCalculations.netAmount)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Due Date</Label>
                      <Input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddInvoiceOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddInvoice} disabled={invoiceCalculations.subtotal === 0}>Create Invoice</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No invoices found</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {invoices.map((invoice) => {
                      const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
                      const overdue = isOverdue(invoice.dueDate, invoice.status)
                      return (
                        <motion.div
                          key={invoice.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-lg border p-4 ${overdue ? 'border-red-300 dark:border-red-700' : ''}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{invoice.invoiceNumber}</span>
                                <Badge className={`text-[10px] ${INVOICE_STATUS_COLORS[invoice.status]}`}>
                                  {invoice.status.replace(/_/g, ' ')}
                                </Badge>
                                {overdue && (
                                  <Badge variant="destructive" className="text-[10px] gap-0.5">
                                    <AlertTriangle className="h-3 w-3" /> Overdue
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3" />
                                  Net: {formatCurrency(invoice.netAmount)}
                                </span>
                                {paid > 0 && (
                                  <span className="text-green-600 dark:text-green-400">
                                    Paid: {formatCurrency(paid)}
                                  </span>
                                )}
                                <span>Due: {formatDate(invoice.dueDate)}</span>
                                <span className="hidden sm:inline">Created: {formatDate(invoice.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Line items count */}
                              <Badge variant="outline" className="text-[10px]">
                                {invoice.lineItems.length} items
                              </Badge>
                              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs"
                                  onClick={() => {
                                    setSelectedInvoice(invoice)
                                    setPayAmount(String(invoice.netAmount - paid))
                                    setRecordPaymentOpen(true)
                                  }}
                                >
                                  <CreditCard className="h-3 w-3" /> Record Payment
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Line items breakdown (expandable) */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {invoice.lineItems.map((li) => (
                              <div key={li.id} className="flex justify-between text-xs text-muted-foreground">
                                <span>{li.description || li.type}</span>
                                <span>{formatCurrency(li.amount)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Payments list */}
                          {invoice.payments.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-[10px] font-medium text-muted-foreground mb-1">Payments</p>
                              {invoice.payments.map((pay) => (
                                <div key={pay.id} className="flex justify-between text-xs">
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-500" />
                                    {pay.method} • Ref: {pay.reference || 'N/A'}
                                  </span>
                                  <span className="font-medium">{formatCurrency(pay.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Record Payment Dialog */}
          <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  {selectedInvoice && `For ${selectedInvoice.invoiceNumber} — Balance: ${formatCurrency(selectedInvoice.netAmount - selectedInvoice.payments.reduce((s, p) => s + p.amount, 0))}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Payment Amount (₹)</Label>
                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reference Number</Label>
                  <Input value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="Transaction ID / Cheque No." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>Cancel</Button>
                <Button onClick={handleRecordPayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
