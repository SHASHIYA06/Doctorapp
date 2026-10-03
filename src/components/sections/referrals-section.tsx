'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRightLeft,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Stethoscope,
  Plus,
  Filter,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────

type ReferralUrgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY'
type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
type Modality = 'ALLOPATHY' | 'AYURVEDA' | 'HOMEOPATHY'

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Ophthalmology',
  'ENT', 'Psychiatry', 'Oncology', 'Pulmonology', 'Gastroenterology',
  'Nephrology', 'Endocrinology', 'Urology', 'General Surgery', 'Pediatrics', 'OB-GYN',
] as const

interface Practitioner {
  id: string
  name: string
  specialty: string
  modality: Modality
}

interface Referral {
  id: string
  patientId: string
  patientName: string
  fromPractitionerId: string
  fromPractitionerName: string
  fromModality: Modality
  toPractitionerId: string
  toPractitionerName: string
  toModality: Modality
  specialty: string
  urgency: ReferralUrgency
  status: ReferralStatus
  clinicalSummary: string
  reason: string
  notes: string
  createdAt: string
  updatedAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Style Maps ───────────────────────────────────────────────────────

const urgencyStyles: Record<ReferralUrgency, string> = {
  ROUTINE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  URGENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  EMERGENCY: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusStyles: Record<ReferralStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  COMPLETED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const urgencyIcons: Record<ReferralUrgency, React.ReactNode> = {
  ROUTINE: <Clock className="h-3 w-3" />,
  URGENT: <AlertTriangle className="h-3 w-3" />,
  EMERGENCY: <AlertTriangle className="h-3 w-3" />,
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ─── Component ────────────────────────────────────────────────────────

export function ReferralsSection() {
  const { activeModality } = useAppStore()

  const [patients, setPatients] = useState<Patient[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL')
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL')

  // New referral form
  const [addOpen, setAddOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formToPractitionerId, setFormToPractitionerId] = useState('')
  const [formSpecialty, setFormSpecialty] = useState(SPECIALTIES[0])
  const [formUrgency, setFormUrgency] = useState<ReferralUrgency>('ROUTINE')
  const [formToModality, setFormToModality] = useState<Modality>('ALLOPATHY')
  const [formClinicalSummary, setFormClinicalSummary] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Detail dialog
  const [detailReferral, setDetailReferral] = useState<Referral | null>(null)

  // ─── Data Loading ─────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.patients ?? []
        setPatients(list)
        if (list.length > 0) setFormPatientId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/referrals?practitioners=true')
      .then((r) => r.json())
      .then((d) => {
        setPractitioners(d.practitioners ?? [])
      })
      .catch(() => {})
  }, [])

  const loadReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (filterUrgency !== 'ALL') params.set('urgency', filterUrgency)
      if (filterSpecialty !== 'ALL') params.set('specialty', filterSpecialty)
      const res = await fetch(`/api/referrals?${params.toString()}`)
      const data = await res.json()
      setReferrals(data.data ?? data.referrals ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load referrals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterUrgency, filterSpecialty])

  useEffect(() => { loadReferrals() }, [loadReferrals])

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === 'PENDING').length,
    accepted: referrals.filter((r) => r.status === 'ACCEPTED').length,
    completed: referrals.filter((r) => r.status === 'COMPLETED').length,
  }

  // ─── Actions ──────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formPatientId || !formToPractitionerId) {
      toast({ title: 'Validation', description: 'Select patient and to-practitioner', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          toPractitionerId: formToPractitionerId,
          specialty: formSpecialty,
          urgency: formUrgency,
          toModality: formToModality,
          fromModality: activeModality,
          clinicalSummary: formClinicalSummary,
          reason: formReason,
          notes: formNotes,
        }),
      })
      if (res.ok) {
        toast({ title: 'Referral Created', description: 'Referral has been submitted successfully' })
        setAddOpen(false)
        setFormClinicalSummary('')
        setFormReason('')
        setFormNotes('')
        loadReferrals()
      } else {
        toast({ title: 'Error', description: 'Failed to create referral', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: ReferralStatus) => {
    try {
      const res = await fetch('/api/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        toast({ title: `Referral ${newStatus}`, description: `Status updated to ${newStatus}` })
        loadReferrals()
        setDetailReferral(null)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update referral', variant: 'destructive' })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: ArrowRightLeft, color: 'text-slate-600 dark:text-slate-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
          { label: 'Completed', value: stats.completed, icon: Stethoscope, color: 'text-teal-600 dark:text-teal-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Urgency</SelectItem>
              <SelectItem value="ROUTINE">Routine</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Specialty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Specialties</SelectItem>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Create Referral
                </DialogTitle>
                <DialogDescription>Cross-practitioner referral with cross-modality support</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Patient */}
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={formPatientId} onValueChange={setFormPatientId}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cross-modality row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>From Modality</Label>
                    <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50">
                      <ModalityBadge modality={activeModality} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>To Modality</Label>
                    <Select value={formToModality} onValueChange={(v) => setFormToModality(v as Modality)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALLOPATHY">Allopathy</SelectItem>
                        <SelectItem value="AYURVEDA">Ayurveda</SelectItem>
                        <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* To Practitioner */}
                <div className="space-y-2">
                  <Label>To Practitioner</Label>
                  <Select value={formToPractitionerId} onValueChange={setFormToPractitionerId}>
                    <SelectTrigger><SelectValue placeholder="Select practitioner" /></SelectTrigger>
                    <SelectContent>
                      {practitioners
                        .filter((p) => p.modality === formToModality)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {p.specialty}
                          </SelectItem>
                        ))}
                      {practitioners.filter((p) => p.modality === formToModality).length === 0 && (
                        <SelectItem value="__none" disabled>No practitioners for this modality</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialty + Urgency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Select value={formSpecialty} onValueChange={(v) => setFormSpecialty(v as typeof SPECIALTIES[number])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select value={formUrgency} onValueChange={(v) => setFormUrgency(v as ReferralUrgency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUTINE">Routine</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clinical Summary */}
                <div className="space-y-2">
                  <Label>Clinical Summary</Label>
                  <Textarea
                    value={formClinicalSummary}
                    onChange={(e) => setFormClinicalSummary(e.target.value)}
                    placeholder="Brief clinical summary for the receiving practitioner..."
                    rows={3}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label>Reason for Referral</Label>
                  <Input
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="e.g., Second opinion, specialized care..."
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Referral'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Referral Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Referrals
          </CardTitle>
          <CardDescription>Cross-practitioner referral management with cross-modality support</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.patientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <ModalityBadge modality={r.fromModality} />
                          <span className="text-xs text-muted-foreground">→</span>
                          <ModalityBadge modality={r.toModality} />
                        </div>
                      </TableCell>
                      <TableCell>{r.specialty}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${urgencyStyles[r.urgency]}`}>
                          {urgencyIcons[r.urgency]}
                          {r.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[r.status]}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailReferral(r)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {r.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs text-green-700 dark:text-green-400"
                                onClick={() => handleStatusUpdate(r.id, 'ACCEPTED')}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs text-red-700 dark:text-red-400"
                                onClick={() => handleStatusUpdate(r.id, 'REJECTED')}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No referrals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailReferral} onOpenChange={(open) => !open && setDetailReferral(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailReferral && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Referral Detail
                </DialogTitle>
                <DialogDescription>
                  Referral for {detailReferral.patientName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Urgency</span>
                    <div className="mt-1">
                      <Badge variant="outline" className={`gap-1 ${urgencyStyles[detailReferral.urgency]}`}>
                        {urgencyIcons[detailReferral.urgency]}
                        {detailReferral.urgency}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge variant="outline" className={statusStyles[detailReferral.status]}>
                        {detailReferral.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground">From</span>
                  <p className="font-medium mt-0.5">{detailReferral.fromPractitionerName}</p>
                  <ModalityBadge modality={detailReferral.fromModality} className="mt-1" />
                </div>
                <div>
                  <span className="text-muted-foreground">To</span>
                  <p className="font-medium mt-0.5">{detailReferral.toPractitionerName}</p>
                  <ModalityBadge modality={detailReferral.toModality} className="mt-1" />
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground">Specialty</span>
                  <p className="font-medium mt-0.5">{detailReferral.specialty}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Clinical Summary</span>
                  <p className="mt-0.5">{detailReferral.clinicalSummary || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reason</span>
                  <p className="mt-0.5">{detailReferral.reason || '—'}</p>
                </div>
                {detailReferral.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-0.5">{detailReferral.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="mt-0.5">{new Date(detailReferral.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated</span>
                    <p className="mt-0.5">{new Date(detailReferral.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                {detailReferral.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-1 text-green-700 dark:text-green-400"
                      onClick={() => handleStatusUpdate(detailReferral.id, 'ACCEPTED')}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Accept Referral
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1 text-red-700 dark:text-red-400"
                      onClick={() => handleStatusUpdate(detailReferral.id, 'REJECTED')}
                    >
                      <XCircle className="h-4 w-4" /> Reject Referral
                    </Button>
                  </>
                )}
                {detailReferral.status === 'ACCEPTED' && (
                  <Button
                    className="gap-1"
                    onClick={() => handleStatusUpdate(detailReferral.id, 'COMPLETED')}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark Completed
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDetailReferral(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
