'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Sparkles, FileCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface Draft {
  id: string
  patientId: string
  patientName: string
  modality: string
  content: string
  aiGenerated: boolean
  citations: string | null
  status: string
  createdAt: string
}

interface SignedPlan {
  id: string
  patientId: string
  patientName: string
  modality: string
  content: string
  patientSummary: string | null
  signedBy: string
  signedAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function CarePlansSection() {
  const { activeModality } = useAppStore()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [signedPlans, setSignedPlans] = useState<SignedPlan[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formModality, setFormModality] = useState(activeModality)
  const [formContent, setFormContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => setPatients(d.data ?? d.patients ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/care-plans?status=DRAFT').then((r) => r.json()),
      fetch('/api/care-plans?status=SIGNED').then((r) => r.json()),
    ])
      .then(([draftsData, signedData]) => {
        setDrafts(
          (draftsData.data ?? draftsData.plans ?? []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            patientId: (p.patientId ?? p.patient?.id ?? '') as string,
            patientName: p.patient
              ? `${(p.patient as Record<string, string>).firstName} ${(p.patient as Record<string, string>).lastName}`
              : 'Unknown',
            modality: (p.modality ?? 'ALLOPATHY') as string,
            content: (p.content ?? '') as string,
            aiGenerated: (p.aiGenerated ?? false) as boolean,
            citations: (p.citations ?? null) as string | null,
            status: (p.status ?? 'DRAFT') as string,
            createdAt: (p.createdAt ?? new Date().toISOString()) as string,
          }))
        )
        setSignedPlans(
          (signedData.data ?? signedData.plans ?? []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            patientId: (p.patientId ?? '') as string,
            patientName: p.patient
              ? `${(p.patient as Record<string, string>).firstName} ${(p.patient as Record<string, string>).lastName}`
              : 'Unknown',
            modality: (p.modality ?? 'ALLOPATHY') as string,
            content: (p.content ?? '') as string,
            patientSummary: (p.patientSummary ?? null) as string | null,
            signedBy: (p.signedBy ?? '') as string,
            signedAt: (p.signedAt ?? new Date().toISOString()) as string,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!formPatientId) {
      toast({ title: 'Validation', description: 'Select a patient', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          modality: formModality,
          content: formContent || 'New care plan draft',
          aiGenerated: false,
        }),
      })
      if (res.ok) {
        toast({ title: 'Draft Created' })
        setCreateDialogOpen(false)
        setFormPatientId(''); setFormContent('')
        // Refresh
        const data = await fetch('/api/care-plans?status=DRAFT').then((r) => r.json())
        setDrafts(data.data ?? data.plans ?? [])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create draft', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Care Plans
        </h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Draft</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Care Plan Draft</DialogTitle>
              <DialogDescription>Select patient and modality for the new draft</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Patient</Label>
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
              <div className="space-y-2">
                <Label>Plan Content</Label>
                <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts" className="gap-1">
            <FileText className="h-3 w-3" /> Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="signed" className="gap-1">
            <FileCheck className="h-3 w-3" /> Signed ({signedPlans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-3 mt-4">
          {drafts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No draft care plans</CardContent>
            </Card>
          ) : (
            drafts.map((draft, i) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedDraft(selectedDraft?.id === draft.id ? null : draft)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{draft.patientName}</span>
                          <ModalityBadge modality={draft.modality} />
                          {draft.aiGenerated && (
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 gap-1">
                              <Sparkles className="h-3 w-3" /> AI
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{draft.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {typeof draft.content === 'string' ? draft.content.substring(0, 100) : 'Care plan content'}
                        </p>
                      </div>
                    </div>
                    {selectedDraft?.id === draft.id && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-1">Full Content</p>
                        <ScrollArea className="max-h-40">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {typeof draft.content === 'string' ? draft.content : JSON.stringify(draft.content, null, 2)}
                          </p>
                        </ScrollArea>
                        {draft.citations && (
                          <>
                            <Separator className="my-2" />
                            <p className="text-sm font-medium mb-1">Citations</p>
                            <p className="text-xs text-muted-foreground">{draft.citations}</p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="signed" className="space-y-3 mt-4">
          {signedPlans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No signed care plans</CardContent>
            </Card>
          ) : (
            signedPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-medium">{plan.patientName}</span>
                      <ModalityBadge modality={plan.modality} />
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Signed
                      </Badge>
                    </div>
                    {plan.patientSummary && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Patient Summary:</span> {plan.patientSummary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Signed by {plan.signedBy} on {new Date(plan.signedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
