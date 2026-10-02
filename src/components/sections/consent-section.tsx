'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface ConsentRecord {
  id: string
  patientId: string
  type: string
  modality: string
  status: string
  grantedAt: string | null
  revokedAt: string | null
  notes: string | null
  createdAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  GRANTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  EXPIRED: 'bg-muted text-muted-foreground',
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function ConsentSection() {
  const { activeModality } = useAppStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formType, setFormType] = useState('TREATMENT')
  const [formModality, setFormModality] = useState(activeModality)
  const [formNotes, setFormNotes] = useState('')
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

  const loadConsents = useCallback(async () => {
    if (!selectedPatientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/consent?patientId=${selectedPatientId}`)
      const data = await res.json()
      setConsents(data.data ?? data.consents ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load consents', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedPatientId])

  useEffect(() => { loadConsents() }, [loadConsents])

  const handleGrant = async (consentId: string) => {
    try {
      const res = await fetch('/api/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: consentId, status: 'GRANTED' }),
      })
      if (res.ok) {
        toast({ title: 'Consent Granted' })
        loadConsents()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to grant consent', variant: 'destructive' })
    }
  }

  const handleRevoke = async (consentId: string) => {
    try {
      const res = await fetch('/api/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: consentId, status: 'REVOKED' }),
      })
      if (res.ok) {
        toast({ title: 'Consent Revoked' })
        loadConsents()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke consent', variant: 'destructive' })
    }
  }

  const handleAddConsent = async () => {
    if (!selectedPatientId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          type: formType,
          modality: formModality,
          notes: formNotes || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Consent Created' })
        setAddDialogOpen(false)
        setFormType('TREATMENT'); setFormNotes('')
        loadConsents()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create consent', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="space-y-1">
          <Label>Select Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose patient..." />
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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-auto">
              <Plus className="h-4 w-4" />
              Add Consent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Consent</DialogTitle>
              <DialogDescription>Create a consent record for the selected patient</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Consent Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TREATMENT">Treatment</SelectItem>
                    <SelectItem value="DATA_SHARING">Data Sharing</SelectItem>
                    <SelectItem value="AI_ASSISTED">AI Assisted</SelectItem>
                    <SelectItem value="RESEARCH">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modality</Label>
                <Select value={formModality} onValueChange={setFormModality}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOPATHY">Allopathy</SelectItem>
                    <SelectItem value="AYURVEDA">Ayurveda</SelectItem>
                    <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddConsent} disabled={submitting}>
                {submitting ? 'Saving...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Consent Records
          </CardTitle>
          <CardDescription>Manage patient consent for treatment and data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.type.replace('_', ' ')}</TableCell>
                    <TableCell><ModalityBadge modality={c.modality} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[c.status] ?? ''}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {c.status === 'PENDING' && (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleGrant(c.id)}>
                            <CheckCircle2 className="h-3 w-3" /> Grant
                          </Button>
                        )}
                        {c.status === 'GRANTED' && (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600" onClick={() => handleRevoke(c.id)}>
                            <XCircle className="h-3 w-3" /> Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {consents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No consent records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
