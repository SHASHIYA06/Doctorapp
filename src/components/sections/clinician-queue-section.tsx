'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, CheckCircle2, Edit3, XCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { PriorityBadge } from '@/components/clinical/priority-badge'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface QueueItem {
  id: string
  patientId: string
  patientName: string
  chiefComplaint: string
  modality: string
  priority: string
  status: string
  safetyAlertCount: number
  createdAt: string
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function ClinicianQueueSection() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewItem, setReviewItem] = useState<QueueItem | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [signingItem, setSigningItem] = useState<QueueItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/clinician-queue')
      .then((r) => r.json())
      .then((d) => {
        const queueData = d.data ?? d
        const items = (queueData.unassigned ?? []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          patientId: (e.patientId ?? e.patient?.id ?? '') as string,
          patientName: (e.patient?.firstName && e.patient?.lastName)
            ? `${e.patient.firstName} ${e.patient.lastName}`
            : 'Unknown',
          chiefComplaint: (e.intake?.chiefComplaint ?? e.reason ?? 'No complaint') as string,
          modality: (e.modality ?? 'ALLOPATHY') as string,
          priority: (e.priority ?? 'ROUTINE') as string,
          status: (e.status ?? 'IN_PROGRESS') as string,
          safetyAlertCount: (e.safetyAlertCount ?? 0) as number,
          createdAt: (e.createdAt ?? new Date().toISOString()) as string,
        }))
        setQueue(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (item: QueueItem) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: item.patientId,
          encounterId: item.id,
          modality: item.modality,
          content: { plan: 'Approved from clinician queue', notes: reviewNotes },
        }),
      })
      if (res.ok) {
        toast({ title: 'Approved', description: 'Care plan draft created' })
        setReviewItem(null)
        setQueue(queue.filter((q) => q.id !== item.id))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to approve', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSign = async () => {
    if (!signingItem) return
    setSubmitting(true)
    try {
      toast({ title: 'Plan Signed', description: 'Care plan has been signed off' })
      setSignDialogOpen(false)
      setSigningItem(null)
      setQueue(queue.filter((q) => q.id !== signingItem.id))
    } catch {
      toast({ title: 'Error', description: 'Failed to sign', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (item: QueueItem) => {
    setSubmitting(true)
    try {
      toast({ title: 'Rejected', description: 'Encounter sent back for review' })
      setReviewItem(null)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Sort by priority
  const sortedQueue = [...queue].sort((a, b) => {
    const order: Record<string, number> = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 }
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Clinician Review Queue
          </CardTitle>
          <CardDescription>{queue.length} encounter(s) awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No encounters in queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQueue.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setReviewItem(item)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{item.patientName}</span>
                            <PriorityBadge priority={item.priority} />
                            <ModalityBadge modality={item.modality} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {item.chiefComplaint}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.safetyAlertCount > 0 && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {item.safetyAlertCount} alert{item.safetyAlertCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" /> Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Panel Dialog */}
      <AnimatePresence>
        {reviewItem && (
          <Dialog open={!!reviewItem} onOpenChange={(open) => !open && setReviewItem(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Encounter</DialogTitle>
                <DialogDescription>
                  {reviewItem.patientName} — {reviewItem.chiefComplaint}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={reviewItem.priority} />
                  <ModalityBadge modality={reviewItem.modality} />
                  <Badge variant="outline">{reviewItem.status}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-1">Chief Complaint</p>
                  <p className="text-sm text-muted-foreground">{reviewItem.chiefComplaint}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Safety Alerts</p>
                  {reviewItem.safetyAlertCount === 0 ? (
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {reviewItem.safetyAlertCount} alert(s) — review before proceeding
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Review Notes</p>
                  <Textarea
                    placeholder="Add clinical notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" className="gap-1" onClick={() => handleReject(reviewItem)} disabled={submitting}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button variant="outline" className="gap-1" onClick={() => { setReviewItem(null) }} disabled={submitting}>
                  <Edit3 className="h-4 w-4" /> Modify
                </Button>
                <Button className="gap-1" onClick={() => handleApprove(reviewItem)} disabled={submitting}>
                  <CheckCircle2 className="h-4 w-4" /> {submitting ? 'Processing...' : 'Approve'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Sign-off Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign-Off Confirmation</DialogTitle>
            <DialogDescription>Confirm that you have reviewed and approve this care plan</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSign} disabled={submitting}>
              {submitting ? 'Signing...' : 'Confirm Sign-Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
