'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { toast } from '@/hooks/use-toast'

interface KnowledgeSource {
  id: string
  name: string
  modality: string
  sourceType: string
  evidenceLevel: string | null
  reviewStatus: string
  isActive: boolean
  createdAt: string
}

const reviewStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  UNDER_REVIEW: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function KnowledgeSection() {
  const { activeModality } = useAppStore()
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [modalityFilter, setModalityFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formModality, setFormModality] = useState(activeModality)
  const [formType, setFormType] = useState('TEXTBOOK')
  const [submitting, setSubmitting] = useState(false)

  const loadSources = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge')
      const data = await res.json()
      setSources(data.data ?? data.sources ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load sources', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSources() }, [])

  const filteredSources = modalityFilter === 'ALL'
    ? sources
    : sources.filter((s) => s.modality === modalityFilter)

  const handleAddSource = async () => {
    if (!formName.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          modality: formModality,
          sourceType: formType,
        }),
      })
      if (res.ok) {
        toast({ title: 'Source Added' })
        setAddDialogOpen(false)
        setFormName('')
        loadSources()
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewAction = async (sourceId: string, status: string) => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sourceId, reviewStatus: status }),
      })
      if (res.ok) {
        toast({ title: `Source ${status === 'APPROVED' ? 'Approved' : 'Rejected'}` })
        loadSources()
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="space-y-1">
          <Label>Modality Filter</Label>
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modalities</SelectItem>
              <SelectItem value="ALLOPATHY">Allopathy</SelectItem>
              <SelectItem value="AYURVEDA">Ayurveda</SelectItem>
              <SelectItem value="HOMEOPATHY">Homeopathy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-auto"><Plus className="h-4 w-4" /> Add Source</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Knowledge Source</DialogTitle>
              <DialogDescription>Register a new clinical knowledge source</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Harrison's Principles" />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXTBOOK">Textbook</SelectItem>
                      <SelectItem value="GUIDELINE">Guideline</SelectItem>
                      <SelectItem value="MONOGRAPH">Monograph</SelectItem>
                      <SelectItem value="JOURNAL">Journal</SelectItem>
                      <SelectItem value="PHARMACOPIA">Pharmacopia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSource} disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Sources
          </CardTitle>
          <CardDescription>{filteredSources.length} source(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Evidence</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell><ModalityBadge modality={source.modality} /></TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{source.sourceType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {source.evidenceLevel ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${reviewStatusStyles[source.reviewStatus] ?? ''}`}>
                        {source.reviewStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {source.reviewStatus === 'PENDING' || source.reviewStatus === 'UNDER_REVIEW' ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleReviewAction(source.id, 'APPROVED')}>
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600" onClick={() => handleReviewAction(source.id, 'REJECTED')}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sources found</TableCell>
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
