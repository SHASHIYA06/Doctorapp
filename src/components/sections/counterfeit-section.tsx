'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  AlertTriangle,
  Send,
  Camera,
  Trophy,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileWarning,
  MapPin,
  Building2,
  Hash,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

type ReportStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISMISSED'
type Severity = 'low' | 'moderate' | 'high' | 'critical'

interface CounterfeitReport {
  id: string
  medicineName: string
  batchNumber: string
  manufacturer: string
  purchaseLocation: string
  description: string
  severity: Severity
  status: ReportStatus
  submittedAt: string
}

const fallbackReports: CounterfeitReport[] = [
  { id: '1', medicineName: 'Dolo 650', batchNumber: 'DL-2025-447', manufacturer: 'Micro Labs (Suspected Fake)', purchaseLocation: 'Medical Store, Karol Bagh, Delhi', description: 'Tablets had unusual smell and crumbled easily. Packaging looked different from usual.', severity: 'high', status: 'UNDER_REVIEW', submittedAt: '2026-09-25' },
  { id: '2', medicineName: 'Amoxicillin 500mg', batchNumber: 'AMX-8821', manufacturer: 'Unknown Lab', purchaseLocation: 'Online - QuickMeds App', description: 'No hologram on strip. Batch number not found on CDSCO database.', severity: 'critical', status: 'CONFIRMED', submittedAt: '2026-09-18' },
  { id: '3', medicineName: 'Cetirizine 10mg', batchNumber: 'CET-3302', manufacturer: 'Cipla Ltd (Suspected Fake)', purchaseLocation: 'Pharmacy, Sector 18, Noida', description: 'Strip seal was tampered. Tablets discolored.', severity: 'moderate', status: 'SUBMITTED', submittedAt: '2026-09-28' },
  { id: '4', medicineName: 'Vitamin D3 60K', batchNumber: 'VD3-1100', manufacturer: 'Cadila (Fake Batch)', purchaseLocation: 'General Store, Patna', description: 'Capsule shells were transparent instead of opaque. No manufacturing date printed.', severity: 'low', status: 'DISMISSED', submittedAt: '2026-08-15' },
]

const statusIcon: Record<ReportStatus, React.ReactNode> = {
  SUBMITTED: <Clock className="h-4 w-4 text-blue-500" />,
  UNDER_REVIEW: <Eye className="h-4 w-4 text-amber-500" />,
  CONFIRMED: <CheckCircle2 className="h-4 w-4 text-red-600" />,
  DISMISSED: <XCircle className="h-4 w-4 text-gray-400" />,
}

const statusColor: Record<ReportStatus, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DISMISSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const severityColor: Record<Severity, string> = {
  low: 'border-green-400',
  moderate: 'border-amber-400',
  high: 'border-orange-500',
  critical: 'border-red-600',
}

export function CounterfeitSection() {
  const [reports, setReports] = useState<CounterfeitReport[]>(fallbackReports)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [formData, setFormData] = useState({
    medicineName: '',
    batchNumber: '',
    manufacturer: '',
    purchaseLocation: '',
    description: '',
    severity: 'moderate' as Severity,
  })

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/counterfeit')
        if (!res.ok) throw new Error('Failed to fetch counterfeit reports')
        const json = await res.json()
        if (!cancelled && json?.data) {
          const apiReports = Array.isArray(json.data) ? json.data : []
          if (apiReports.length > 0) {
            const mapped: CounterfeitReport[] = apiReports.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              medicineName: (r.medicineName as string) || '',
              batchNumber: (r.batchNumber as string) || '',
              manufacturer: (r.manufacturer as string) || '',
              purchaseLocation: (r.purchaseLocation as string) || '',
              description: (r.description as string) || '',
              severity: ((r.severity as string)?.toLowerCase() || 'moderate') as Severity,
              status: (r.status as ReportStatus) || 'SUBMITTED',
              submittedAt: r.createdAt ? new Date(r.createdAt as string).toISOString().split('T')[0] : '',
            }))
            setReports(mapped)
          }
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'Counterfeit Data Error', description: 'Failed to load counterfeit reports', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const confirmedCount = reports.filter((r) => r.status === 'CONFIRMED').length
  const underReviewCount = reports.filter((r) => r.status === 'UNDER_REVIEW').length
  const totalReports = reports.length
  const pointsEarned = confirmedCount * 50 + underReviewCount * 10

  const handleSubmit = () => {
    if (!formData.medicineName || !formData.batchNumber) {
      toast({ title: 'Missing Fields', description: 'Medicine name and batch number are required', variant: 'destructive' })
      return
    }
    toast({ title: 'Report Submitted', description: 'Your counterfeit medicine report has been submitted for review' })
    setFormData({ medicineName: '', batchNumber: '', manufacturer: '', purchaseLocation: '', description: '', severity: 'moderate' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (<Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-24" /></CardContent></Card>))}
        </div>
        <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2 p-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /></div>))}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Counterfeit Medicine Reporting</h2>
            <p className="text-sm text-muted-foreground">Report suspected fake or substandard medicines</p>
          </div>
        </div>
      </motion.div>

      {/* Warning Banner */}
      <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Counterfeit medicines can be life-threatening!</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              Fake medicines may contain wrong active ingredients, incorrect doses, or harmful substances. Always purchase from licensed pharmacies and verify batch numbers on the CDSCO portal.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileWarning className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{totalReports}</p>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmed Fake</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Eye className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{underReviewCount}</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Report Form */}
      <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Report Fake Medicine
            </CardTitle>
            <CardDescription>Provide details about the suspected counterfeit medicine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><Hash className="h-3 w-3 inline mr-1" />Medicine Name *</Label>
                <Input placeholder="e.g. Dolo 650" value={formData.medicineName} onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Batch Number *</Label>
                <Input placeholder="e.g. DL-2025-447" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label><Building2 className="h-3 w-3 inline mr-1" />Manufacturer</Label>
                <Input placeholder="e.g. Micro Labs Ltd" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label><MapPin className="h-3 w-3 inline mr-1" />Purchase Location</Label>
                <Input placeholder="e.g. Medical Store, Karol Bagh" value={formData.purchaseLocation} onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label><MessageSquare className="h-3 w-3 inline mr-1" />Description</Label>
              <Textarea placeholder="Describe what made you suspect this medicine..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v as Severity })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — Minor packaging difference</SelectItem>
                    <SelectItem value="moderate">Moderate — Tampered seal</SelectItem>
                    <SelectItem value="high">High — Wrong appearance/smell</SelectItem>
                    <SelectItem value="critical">Critical — No batch on CDSCO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label><Camera className="h-3 w-3 inline mr-1" />Photo Evidence</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground hover:border-red-400 transition-colors cursor-pointer">
                  <Camera className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs">Click to upload photo</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white">
              <Send className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Reports & Gamification */}
      <motion.div {...fadeSlide} transition={{ delay: 0.2 }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {reports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-3 rounded-lg border-l-4 ${severityColor[report.severity]} border bg-card`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{report.medicineName}</p>
                        <p className="text-xs text-muted-foreground">Batch: {report.batchNumber} • {report.manufacturer}</p>
                        <p className="text-xs text-muted-foreground mt-1">{report.purchaseLocation}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${statusColor[report.status]}`}>
                        <span className="mr-1">{statusIcon[report.status]}</span>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{report.submittedAt}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Gamification Badge */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <Trophy className="h-12 w-12 text-amber-500" />
              <div>
                <p className="font-bold text-lg">FakeMedicineHunter</p>
                <p className="text-xs text-muted-foreground">Citizen Safety Badge</p>
              </div>
              <div className="w-full">
                <p className="text-3xl font-bold text-amber-600">{pointsEarned}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </div>
              <Progress value={(pointsEarned / 500) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{500 - pointsEarned} pts to next level</p>
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <TrendingUp className="h-3 w-3" />
                <span>Keep reporting to level up!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
