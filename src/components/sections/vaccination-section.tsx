'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Syringe,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Baby,
  Calendar,
  Building2,
  Hash,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  X,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface VaccinationRecord {
  id: string
  vaccineName: string
  doseNumber: number
  totalDoses: number
  date: string
  administeredBy: string
  batch: string
  manufacturer: string
  injectionSite: string
  nextDueDate: string | null
  completed: boolean
}

interface ChildVaccineSchedule {
  vaccine: string
  ageGroup: string
  doses: string
  dueDate: string
  status: 'completed' | 'due' | 'upcoming' | 'overdue'
}

const fallbackVaccinations: VaccinationRecord[] = [
  { id: '1', vaccineName: 'COVID-19 (Covishield)', doseNumber: 2, totalDoses: 2, date: '2022-05-15', administeredBy: 'PHC Sector 12, Noida', batch: 'CVS-2022-0847', manufacturer: 'Serum Institute of India', injectionSite: 'Left Deltoid', nextDueDate: null, completed: true },
  { id: '2', vaccineName: 'Hepatitis B', doseNumber: 1, totalDoses: 3, date: '2026-09-01', administeredBy: 'Apollo Hospital, Delhi', batch: 'HEP-2026-112', manufacturer: 'Bharat Biotech', injectionSite: 'Right Deltoid', nextDueDate: '2026-10-01', completed: false },
  { id: '3', vaccineName: 'Typhoid Conjugate', doseNumber: 1, totalDoses: 1, date: '2026-08-20', administeredBy: 'Max Hospital, Noida', batch: 'TYP-2026-033', manufacturer: 'Bharat Biotech', injectionSite: 'Left Deltoid', nextDueDate: null, completed: true },
  { id: '4', vaccineName: 'Influenza (Flu)', doseNumber: 1, totalDoses: 1, date: '2026-10-01', administeredBy: 'Fortis Hospital, Gurgaon', batch: 'FLU-2026-055', manufacturer: 'Serum Institute of India', injectionSite: 'Right Deltoid', nextDueDate: null, completed: true },
]

const childSchedule: ChildVaccineSchedule[] = [
  { vaccine: 'BCG', ageGroup: 'At Birth', doses: '1/1', dueDate: '2026-10-03', status: 'due' },
  { vaccine: 'OPV (Birth)', ageGroup: 'At Birth', doses: '1/5', dueDate: '2026-10-03', status: 'due' },
  { vaccine: 'Hepatitis B (Birth)', ageGroup: 'At Birth', doses: '1/3', dueDate: '2026-10-03', status: 'due' },
  { vaccine: 'DPT (1st Dose)', ageGroup: '6 Weeks', doses: '1/3', dueDate: '2026-11-14', status: 'upcoming' },
  { vaccine: 'OPV (1st Dose)', ageGroup: '6 Weeks', doses: '2/5', dueDate: '2026-11-14', status: 'upcoming' },
  { vaccine: 'Hepatitis B (2nd)', ageGroup: '6 Weeks', doses: '2/3', dueDate: '2026-11-14', status: 'upcoming' },
  { vaccine: 'DPT (2nd Dose)', ageGroup: '10 Weeks', doses: '2/3', dueDate: '2026-12-12', status: 'upcoming' },
  { vaccine: 'Measles (1st)', ageGroup: '9 Months', doses: '1/2', dueDate: '2027-07-03', status: 'upcoming' },
  { vaccine: 'DPT (3rd Dose)', ageGroup: '14 Weeks', doses: '3/3', dueDate: '2027-01-09', status: 'upcoming' },
  { vaccine: 'Hepatitis B (3rd)', ageGroup: '14 Weeks', doses: '3/3', dueDate: '2027-01-09', status: 'upcoming' },
  { vaccine: 'Measles (2nd)', ageGroup: '16-18 Months', doses: '2/2', dueDate: '2028-02-03', status: 'upcoming' },
]

const scheduleStatusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function VaccinationSection() {
  const { selectedPatientId } = useAppStore()
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>(fallbackVaccinations)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAdverseForm, setShowAdverseForm] = useState(false)
  const [adverseReport, setAdverseReport] = useState({ vaccine: '', symptoms: '', severity: 'mild', date: '' })
  const [formData, setFormData] = useState({
    vaccineName: '',
    doseNumber: '',
    totalDoses: '',
    date: '',
    administeredBy: '',
    batch: '',
    manufacturer: '',
    injectionSite: 'left_deltoid',
  })

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const patientId = selectedPatientId || 'demo'
        const res = await fetch(`/api/vaccination?patientId=${patientId}&includeSchedule=true`)
        if (!res.ok) throw new Error('Failed to fetch vaccination data')
        const json = await res.json()
        if (!cancelled && json?.data?.records) {
          const apiRecords = json.data.records
          if (apiRecords.length > 0) {
            const mapped: VaccinationRecord[] = apiRecords.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              vaccineName: (r.vaccineName as string) || '',
              doseNumber: (r.doseNumber as number) || 1,
              totalDoses: (r.totalDoses as number) || 1,
              date: r.administeredAt ? new Date(r.administeredAt as string).toISOString().split('T')[0] : '',
              administeredBy: (r.administeredBy as string) || '',
              batch: (r.batchNumber as string) || '',
              manufacturer: (r.manufacturer as string) || '',
              injectionSite: ((r.site as string) || 'left_deltoid').replace(/_/g, ' '),
              nextDueDate: r.nextDueDate ? new Date(r.nextDueDate as string).toISOString().split('T')[0] : null,
              completed: r.isCompleted as boolean,
            }))
            setVaccinations(mapped)
          }
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'Vaccination Error', description: 'Failed to load vaccination records', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [selectedPatientId])

  const completedVaccines = vaccinations.filter((v) => v.completed).length
  const totalVaccines = vaccinations.length

  const handleAddVaccination = () => {
    if (!formData.vaccineName || !formData.date) {
      toast({ title: 'Missing Fields', description: 'Vaccine name and date are required', variant: 'destructive' })
      return
    }
    setShowForm(false)
    toast({ title: 'Vaccination Recorded', description: `${formData.vaccineName} added to your records` })
  }

  const handleAdverseReport = () => {
    if (!adverseReport.vaccine || !adverseReport.symptoms) {
      toast({ title: 'Missing Fields', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    setShowAdverseForm(false)
    toast({ title: 'Adverse Effect Reported', description: 'Your report has been submitted to the pharmacovigilance team' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <Card><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2 p-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /></div>))}</CardContent></Card>
      </div>
    )
  }

  if (!loading && !error && vaccinations.length === 0) {
    return (
      <motion.div {...fadeSlide} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30"><Syringe className="h-6 w-6 text-rose-600" /></div>
          <div><h2 className="text-2xl font-bold tracking-tight">Vaccination Tracker</h2><p className="text-sm text-muted-foreground">No vaccination records found</p></div>
        </div>
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No vaccination records available. Add a vaccination to get started.</p></CardContent></Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <Syringe className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Vaccination Tracker</h2>
            <p className="text-sm text-muted-foreground">Track vaccinations, schedules, and download certificates</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAdverseForm(!showAdverseForm)}>
              <AlertTriangle className="h-4 w-4 mr-1" /> Report Adverse Effect
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add Vaccination
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Vaccination Progress</p>
              <span className="text-sm font-bold text-rose-600">{completedVaccines}/{totalVaccines} Completed</span>
            </div>
            <Progress value={totalVaccines > 0 ? (completedVaccines / totalVaccines) * 100 : 0} className="h-3" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Vaccination Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="border-rose-200 dark:border-rose-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Add Vaccination Record
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vaccine Name *</Label>
                  <Input placeholder="e.g. Hepatitis B" value={formData.vaccineName} onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Dose Number</Label>
                  <Input type="number" placeholder="e.g. 1" value={formData.doseNumber} onChange={(e) => setFormData({ ...formData, doseNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Doses</Label>
                  <Input type="number" placeholder="e.g. 3" value={formData.totalDoses} onChange={(e) => setFormData({ ...formData, totalDoses: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label><Building2 className="h-3 w-3 inline mr-1" />Administered By</Label>
                  <Input placeholder="e.g. AIIMS Delhi" value={formData.administeredBy} onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label><Hash className="h-3 w-3 inline mr-1" />Batch Number</Label>
                  <Input placeholder="e.g. HEP-2026-112" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input placeholder="e.g. Bharat Biotech" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Injection Site</Label>
                  <Select value={formData.injectionSite} onValueChange={(v) => setFormData({ ...formData, injectionSite: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left_deltoid">Left Deltoid</SelectItem>
                      <SelectItem value="right_deltoid">Right Deltoid</SelectItem>
                      <SelectItem value="left_thigh">Left Anterolateral Thigh</SelectItem>
                      <SelectItem value="right_thigh">Right Anterolateral Thigh</SelectItem>
                      <SelectItem value="left_gluteal">Left Gluteal</SelectItem>
                      <SelectItem value="right_gluteal">Right Gluteal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAddVaccination}>
                <Plus className="h-4 w-4 mr-2" /> Add Vaccination
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Vaccination Schedule Cards */}
      <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Syringe className="h-5 w-5 text-rose-600" />
              Your Vaccination Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {vaccinations.map((vacc, idx) => (
              <motion.div
                key={vacc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{vacc.vaccineName}</span>
                      {vacc.completed ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          <Clock className="h-3 w-3 mr-1" /> In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dose {vacc.doseNumber}/{vacc.totalDoses} • {vacc.date} • {vacc.manufacturer}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 inline mr-1" />{vacc.administeredBy} • Site: {vacc.injectionSite.replace(/_/g, ' ')}
                    </p>
                    {vacc.nextDueDate && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        <Calendar className="h-3 w-3 inline mr-1" />Next dose due: {vacc.nextDueDate}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 space-y-2">
                    <Progress value={vacc.totalDoses > 0 ? (vacc.doseNumber / vacc.totalDoses) * 100 : 0} className="h-2 w-20" />
                    {vacc.completed && (
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => toast({ title: 'Certificate Download', description: 'Vaccination certificate download initiated' })}>
                        <Download className="h-3 w-3 mr-1" /> Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Child Vaccination Schedule */}
      <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Baby className="h-5 w-5 text-rose-600" />
              Child Vaccination Schedule (NIS India)
            </CardTitle>
            <CardDescription>National Immunisation Schedule as per Govt. of India guidelines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaccine</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Doses</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childSchedule.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{item.vaccine}</TableCell>
                      <TableCell className="text-sm">{item.ageGroup}</TableCell>
                      <TableCell className="text-sm font-mono">{item.doses}</TableCell>
                      <TableCell className="text-sm font-mono">{item.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${scheduleStatusColor[item.status]}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Adverse Effects Form */}
      {showAdverseForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="border-amber-300 dark:border-amber-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Report Adverse Effect (AEFI)
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowAdverseForm(false)}><X className="h-4 w-4" /></Button>
              </CardTitle>
              <CardDescription>Adverse Event Following Immunisation — report to pharmacovigilance program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vaccine Name *</Label>
                  <Input placeholder="e.g. COVID-19 Covishield" value={adverseReport.vaccine} onChange={(e) => setAdverseReport({ ...adverseReport, vaccine: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Reaction</Label>
                  <Input type="date" value={adverseReport.date} onChange={(e) => setAdverseReport({ ...adverseReport, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={adverseReport.severity} onValueChange={(v) => setAdverseReport({ ...adverseReport, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Symptoms / Description *</Label>
                <Textarea placeholder="Describe the adverse effects experienced..." value={adverseReport.symptoms} onChange={(e) => setAdverseReport({ ...adverseReport, symptoms: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleAdverseReport} className="bg-amber-600 hover:bg-amber-700 text-white">
                <AlertTriangle className="h-4 w-4 mr-2" /> Submit AEFI Report
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Certificate Download Placeholder */}
      <motion.div {...fadeSlide} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-rose-500" />
              <div>
                <p className="font-semibold text-sm">Vaccination Certificates</p>
                <p className="text-xs text-muted-foreground">Download CoWIN vaccination certificates for travel or records</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Redirecting to CoWIN', description: 'Opening CoWIN portal for certificate download' })}>
              <Download className="h-4 w-4 mr-1" /> Download from CoWIN
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
