'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  ScanLine,
  CheckCircle2,
  Eye,
  Search,
  File,
  Plus,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────

type DocType =
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'ID_PROOF'
  | 'INSURANCE_CARD'
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL_LETTER'
  | 'OTHER'

type DocStatus = 'UPLOADED' | 'OCR_PROCESSING' | 'OCR_COMPLETE' | 'REVIEW' | 'VERIFIED'

const DOC_TYPES: { value: DocType; label: string; icon: React.ElementType }[] = [
  { value: 'PRESCRIPTION', label: 'Prescription', icon: FileText },
  { value: 'LAB_REPORT', label: 'Lab Report', icon: ScanLine },
  { value: 'ID_PROOF', label: 'ID Proof', icon: ShieldCheck },
  { value: 'INSURANCE_CARD', label: 'Insurance Card', icon: ShieldCheck },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary', icon: FileText },
  { value: 'REFERRAL_LETTER', label: 'Referral Letter', icon: File },
  { value: 'OTHER', label: 'Other', icon: File },
]

interface Document {
  id: string
  patientId: string
  patientName: string
  type: DocType
  fileName: string
  fileSize: number
  fileType: string
  status: DocStatus
  ocrText: string | null
  ocrConfidence: number | null
  aiSummary: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

// ─── Style Maps ───────────────────────────────────────────────────────

const docTypeIcons: Record<DocType, React.ElementType> = {
  PRESCRIPTION: FileText,
  LAB_REPORT: ScanLine,
  ID_PROOF: ShieldCheck,
  INSURANCE_CARD: ShieldCheck,
  DISCHARGE_SUMMARY: FileText,
  REFERRAL_LETTER: File,
  OTHER: File,
}

const statusStyles: Record<DocStatus, string> = {
  UPLOADED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  OCR_PROCESSING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  OCR_COMPLETE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  REVIEW: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const statusSteps: DocStatus[] = ['UPLOADED', 'OCR_PROCESSING', 'OCR_COMPLETE', 'REVIEW', 'VERIFIED']

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ────────────────────────────────────────────────────────

export function DocumentsSection() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Upload form
  const [uploadOpen, setUploadOpen] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formDocType, setFormDocType] = useState<DocType>('PRESCRIPTION')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Detail dialog
  const [detailDoc, setDetailDoc] = useState<Document | null>(null)

  // ─── Data Loading ─────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d.patients ?? []
        setPatients(list)
        if (list.length > 0) setFormPatientId(list[0].id)
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' })
      })
  }, [])

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'ALL') params.set('type', filterType)
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/documents?${params.toString()}`)
      const data = await res.json()
      setDocuments(data.data ?? data.documents ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, searchQuery])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === 'VERIFIED').length,
    pendingReview: documents.filter((d) => d.status === 'REVIEW').length,
    ocrProcessed: documents.filter((d) => d.ocrConfidence !== null).length,
  }

  // ─── Actions ──────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!formPatientId || !selectedFile) {
      toast({ title: 'Validation', description: 'Select patient and file', variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('patientId', formPatientId)
      formData.append('type', formDocType)
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        toast({ title: 'Document Uploaded', description: 'OCR processing will begin automatically' })
        setUploadOpen(false)
        setSelectedFile(null)
        loadDocuments()
      } else {
        toast({ title: 'Error', description: 'Failed to upload document', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleVerify = async (docId: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, status: 'VERIFIED' }),
      })
      if (res.ok) {
        toast({ title: 'Document Verified', description: 'Document has been verified successfully' })
        loadDocuments()
        setDetailDoc(null)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to verify document', variant: 'destructive' })
    }
  }

  const handleSendToReview = async (docId: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, status: 'REVIEW' }),
      })
      if (res.ok) {
        toast({ title: 'Sent to Review', description: 'Document moved to review queue' })
        loadDocuments()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update document', variant: 'destructive' })
    }
  }

  // ─── Filtered docs ────────────────────────────────────────────────

  const filteredDocs = documents.filter((doc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !doc.fileName.toLowerCase().includes(q) &&
        !doc.patientName.toLowerCase().includes(q) &&
        !doc.type.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: stats.total, icon: File, color: 'text-slate-600 dark:text-slate-400' },
          { label: 'Verified', value: stats.verified, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
          { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'OCR Processed', value: stats.ocrProcessed, icon: ScanLine, color: 'text-teal-600 dark:text-teal-400' },
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="w-56 pl-8 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {DOC_TYPES.map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="UPLOADED">Uploaded</SelectItem>
              <SelectItem value="OCR_PROCESSING">OCR Processing</SelectItem>
              <SelectItem value="OCR_COMPLETE">OCR Complete</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:ml-auto">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </DialogTitle>
                <DialogDescription>Upload a document with OCR and AI processing</DialogDescription>
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

                {/* Document Type */}
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={formDocType} onValueChange={(v) => setFormDocType(v as DocType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload (drag-and-drop visual, file input) */}
                <div className="space-y-2">
                  <Label>File</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors"
                    onClick={() => document.getElementById('doc-file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation()
                      const file = e.dataTransfer.files?.[0]
                      if (file) setSelectedFile(file)
                    }}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {selectedFile ? (
                      <div className="text-sm">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-muted-foreground">{formatFileSize(selectedFile.size)} • {selectedFile.type || 'unknown'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click to select or drag &amp; drop a file here
                      </p>
                    )}
                    <input
                      id="doc-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setSelectedFile(file)
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null) }}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? 'Uploading...' : 'Upload & Process'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>Uploaded documents with OCR processing and verification workflow</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDocs.map((doc) => {
                const TypeIcon = docTypeIcons[doc.type]
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.patientName} • {formatFileSize(doc.fileSize)} • {DOC_TYPES.find((d) => d.value === doc.type)?.label}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusStyles[doc.status]}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailDoc(doc)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {doc.status === 'REVIEW' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs text-green-700 dark:text-green-400"
                          onClick={() => handleVerify(doc.id)}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Verify
                        </Button>
                      )}
                      {doc.status === 'OCR_COMPLETE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleSendToReview(doc.id)}
                        >
                          <Eye className="h-3 w-3" /> Review
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              {filteredDocs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No documents found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={(open) => !open && setDetailDoc(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const I = docTypeIcons[detailDoc.type]; return <I className="h-5 w-5" /> })()}
                  Document Detail
                </DialogTitle>
                <DialogDescription>{detailDoc.fileName}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-sm">
                {/* Workflow steps */}
                <div>
                  <Label className="text-xs text-muted-foreground">Verification Workflow</Label>
                  <div className="flex items-center gap-1 mt-2">
                    {statusSteps.map((step, i) => {
                      const stepIdx = statusSteps.indexOf(detailDoc.status)
                      const isDone = i <= stepIdx
                      const isCurrent = step === detailDoc.status
                      return (
                        <div key={step} className="flex items-center gap-1">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-teal-500 text-white'
                                : isDone
                                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isDone ? '✓' : i + 1}
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`h-0.5 w-4 ${isDone && i < stepIdx ? 'bg-teal-400' : 'bg-muted'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {statusSteps.map((step) => (
                      <span key={step} className="text-[9px] text-muted-foreground w-6 text-center">
                        {step === 'OCR_PROCESSING' ? 'OCR' : step.slice(0, 4)}
                      </span>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium mt-0.5">{DOC_TYPES.find((d) => d.value === detailDoc.type)?.label}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-0.5">
                      <Badge variant="outline" className={statusStyles[detailDoc.status]}>
                        {detailDoc.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Patient</span>
                    <p className="font-medium mt-0.5">{detailDoc.patientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File Size</span>
                    <p className="mt-0.5">{formatFileSize(detailDoc.fileSize)}</p>
                  </div>
                </div>

                {/* OCR Results */}
                {detailDoc.ocrText && (
                  <>
                    <Separator />
                    <div>
                      <Label className="flex items-center gap-1">
                        <ScanLine className="h-3.5 w-3.5" /> OCR Result
                      </Label>
                      <div className="mt-2 p-3 rounded-md bg-muted/50 text-xs max-h-32 overflow-y-auto">
                        {detailDoc.ocrText}
                      </div>
                      {detailDoc.ocrConfidence !== null && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">OCR Confidence</span>
                            <span className="font-medium">{detailDoc.ocrConfidence}%</span>
                          </div>
                          <Progress
                            value={detailDoc.ocrConfidence}
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* AI Summary */}
                {detailDoc.aiSummary && (
                  <div>
                    <Label className="flex items-center gap-1">
                      🤖 AI Summary
                    </Label>
                    <div className="mt-2 p-3 rounded-md border text-xs">
                      {detailDoc.aiSummary}
                    </div>
                  </div>
                )}

                {/* Verification Info */}
                {detailDoc.verifiedBy && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs font-medium">Verified by {detailDoc.verifiedBy}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(detailDoc.verifiedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-muted-foreground">Uploaded</span>
                  <p className="mt-0.5">{new Date(detailDoc.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <DialogFooter>
                {detailDoc.status === 'REVIEW' && (
                  <Button className="gap-1" onClick={() => handleVerify(detailDoc.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Verify Document
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDetailDoc(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
