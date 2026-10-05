'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Pill,
  Plus,
  Check,
  Clock,
  AlertTriangle,
  Calendar,
  Timer,
  Utensils,
  ChevronDown,
  X,
  History,
  ClipboardList,
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

type Frequency = 'once' | 'twice' | 'thrice' | 'weekly' | 'as_needed'
type FoodInstruction = 'before' | 'after' | 'with' | 'empty_stomach' | 'any'

interface TimeSlot {
  time: string
  taken: boolean
}

interface DosageSchedule {
  id: string
  medicineName: string
  dosage: string
  frequency: Frequency
  timeSlots: TimeSlot[]
  startDate: string
  endDate: string
  instruction: FoodInstruction
  notes: string
}

interface DoseLog {
  date: string
  medicineName: string
  time: string
  taken: boolean
}

const fallbackSchedules: DosageSchedule[] = [
  { id: '1', medicineName: 'Metformin 500mg', dosage: '1 tablet', frequency: 'twice', timeSlots: [{ time: '08:00', taken: true }, { time: '20:00', taken: false }], startDate: '2026-09-01', endDate: '2026-12-01', instruction: 'after', notes: 'Take with meals to reduce GI side effects' },
  { id: '2', medicineName: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'once', timeSlots: [{ time: '07:00', taken: true }], startDate: '2026-08-15', endDate: '2027-02-15', instruction: 'any', notes: '' },
  { id: '3', medicineName: 'Atorvastatin 10mg', dosage: '1 tablet', frequency: 'once', timeSlots: [{ time: '22:00', taken: false }], startDate: '2026-09-10', endDate: '2027-03-10', instruction: 'after', notes: 'Take at bedtime' },
  { id: '4', medicineName: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'once', timeSlots: [{ time: '06:30', taken: false }], startDate: '2026-09-15', endDate: '2026-10-15', instruction: 'empty_stomach', notes: 'Take 30 min before breakfast' },
]

const fallbackDoseLog: DoseLog[] = [
  { date: '2026-10-02', medicineName: 'Metformin 500mg', time: '08:00', taken: true },
  { date: '2026-10-02', medicineName: 'Metformin 500mg', time: '20:00', taken: true },
  { date: '2026-10-02', medicineName: 'Amlodipine 5mg', time: '07:00', taken: true },
  { date: '2026-10-01', medicineName: 'Metformin 500mg', time: '08:00', taken: true },
  { date: '2026-10-01', medicineName: 'Metformin 500mg', time: '20:00', taken: false },
  { date: '2026-10-01', medicineName: 'Amlodipine 5mg', time: '07:00', taken: true },
  { date: '2026-09-30', medicineName: 'Metformin 500mg', time: '08:00', taken: true },
  { date: '2026-09-30', medicineName: 'Metformin 500mg', time: '20:00', taken: true },
]

const frequencyLabel: Record<Frequency, string> = {
  once: 'Once daily',
  twice: 'Twice daily',
  thrice: 'Thrice daily',
  weekly: 'Weekly',
  as_needed: 'As needed',
}

const instructionLabel: Record<FoodInstruction, string> = {
  before: 'Before food',
  after: 'After food',
  with: 'With food',
  empty_stomach: 'Empty stomach',
  any: 'Any time',
}

const instructionIcon: Record<FoodInstruction, React.ReactNode> = {
  before: <Utensils className="h-3 w-3 text-amber-500" />,
  after: <Utensils className="h-3 w-3 text-green-500" />,
  with: <Utensils className="h-3 w-3 text-blue-500" />,
  empty_stomach: <Utensils className="h-3 w-3 text-red-500" />,
  any: <Clock className="h-3 w-3 text-muted-foreground" />,
}

export function DosageTrackerSection() {
  const { selectedPatientId } = useAppStore()
  const [schedules, setSchedules] = useState<DosageSchedule[]>(fallbackSchedules)
  const [doseLog, setDoseLog] = useState<DoseLog[]>(fallbackDoseLog)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'once' as Frequency,
    time: '08:00',
    startDate: '',
    endDate: '',
    instruction: 'any' as FoodInstruction,
    notes: '',
  })

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const patientId = selectedPatientId || 'demo'
        const res = await fetch(`/api/dosage?patientId=${patientId}&includeLogs=true`)
        if (!res.ok) throw new Error('Failed to fetch dosage data')
        const json = await res.json()
        if (!cancelled && json?.data) {
          const apiSchedules = json.data.schedules || []
          if (apiSchedules.length > 0) {
            const mapped: DosageSchedule[] = apiSchedules.map((s: Record<string, unknown>) => {
              const freqMap: Record<string, Frequency> = { ONCE_DAILY: 'once', TWICE_DAILY: 'twice', THRICE_DAILY: 'thrice', WEEKLY: 'weekly', AS_NEEDED: 'as_needed' }
              const instrMap: Record<string, FoodInstruction> = { BEFORE_FOOD: 'before', AFTER_FOOD: 'after', WITH_FOOD: 'with', EMPTY_STOMACH: 'empty_stomach' }
              const logs = (s.doseLogs as Record<string, unknown>[]) || []
              return {
                id: s.id as string,
                medicineName: (s.medicineName as string) || '',
                dosage: (s.dosage as string) || '',
                frequency: freqMap[(s.frequency as string) || 'ONCE_DAILY'] || 'once',
                timeSlots: logs.length > 0 ? logs.map((l: Record<string, unknown>) => ({
                  time: new Date(l.takenAt as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                  taken: l.wasOnTime as boolean,
                })) : [{ time: '08:00', taken: false }],
                startDate: s.startDate ? new Date(s.startDate as string).toISOString().split('T')[0] : '',
                endDate: s.endDate ? new Date(s.endDate as string).toISOString().split('T')[0] : '',
                instruction: instrMap[(s.foodInstruction as string) || ''] || 'any',
                notes: (s.notes as string) || '',
              }
            })
            setSchedules(mapped)
          }
          // Build dose log from all schedule logs
          const allLogs: DoseLog[] = []
          for (const s of apiSchedules) {
            const logs = (s.doseLogs as Record<string, unknown>[]) || []
            for (const l of logs) {
              allLogs.push({
                date: new Date(l.takenAt as string).toISOString().split('T')[0],
                medicineName: (s.medicineName as string) || '',
                time: new Date(l.takenAt as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                taken: l.wasOnTime as boolean,
              })
            }
          }
          if (allLogs.length > 0) setDoseLog(allLogs)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'Dosage Data Error', description: 'Failed to load dosage schedules', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [selectedPatientId])

  const totalSlotsToday = schedules.reduce((acc, s) => acc + s.timeSlots.length, 0)
  const takenSlotsToday = schedules.reduce((acc, s) => acc + s.timeSlots.filter((t) => t.taken).length, 0)
  const missedDoses = doseLog.filter((d) => !d.taken).length

  const handleMarkTaken = (scheduleId: string, time: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s
        return {
          ...s,
          timeSlots: s.timeSlots.map((t) => (t.time === time ? { ...t, taken: !t.taken } : t)),
        }
      })
    )
    toast({ title: 'Dose Updated', description: 'Dose status has been toggled' })
  }

  const handleAddSchedule = () => {
    if (!formData.medicineName || !formData.dosage) {
      toast({ title: 'Missing Fields', description: 'Medicine name and dosage are required', variant: 'destructive' })
      return
    }
    const newSchedule: DosageSchedule = {
      id: String(schedules.length + 1),
      medicineName: formData.medicineName,
      dosage: formData.dosage,
      frequency: formData.frequency,
      timeSlots: [{ time: formData.time, taken: false }],
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || '',
      instruction: formData.instruction,
      notes: formData.notes,
    }
    setSchedules([...schedules, newSchedule])
    setShowForm(false)
    setFormData({ medicineName: '', dosage: '', frequency: 'once', time: '08:00', startDate: '', endDate: '', instruction: 'any', notes: '' })
    toast({ title: 'Schedule Added', description: `${formData.medicineName} schedule created` })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (<Card key={i}><CardContent className="p-4 space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /></CardContent></Card>))}
        </div>
        <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2 p-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /></div>))}</CardContent></Card>
      </div>
    )
  }

  if (!loading && !error && schedules.length === 0) {
    return (
      <motion.div {...fadeSlide} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30"><Pill className="h-6 w-6 text-sky-600" /></div>
          <div><h2 className="text-2xl font-bold tracking-tight">Dosage Tracker & Schedules</h2><p className="text-sm text-muted-foreground">No schedules found</p></div>
        </div>
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No dosage schedules available. Add a schedule to get started.</p></CardContent></Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
            <Pill className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dosage Tracker & Schedules</h2>
            <p className="text-sm text-muted-foreground">Manage medicine schedules and track daily doses</p>
          </div>
          <Button size="sm" className="ml-auto bg-sky-600 hover:bg-sky-700 text-white" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> Add Schedule
          </Button>
        </div>
      </motion.div>

      {/* Today's Progress & Missed Alert */}
      <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Today&apos;s Progress</p>
                <span className="text-sm font-bold text-sky-600">{takenSlotsToday}/{totalSlotsToday}</span>
              </div>
              <Progress value={totalSlotsToday > 0 ? (takenSlotsToday / totalSlotsToday) * 100 : 0} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {takenSlotsToday === totalSlotsToday ? 'All doses taken today! 🎉' : `${totalSlotsToday - takenSlotsToday} dose(s) remaining`}
              </p>
            </CardContent>
          </Card>
          {missedDoses > 0 && (
            <Card className="border-amber-300 dark:border-amber-700">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">{missedDoses} Missed Dose(s)</p>
                  <p className="text-xs text-muted-foreground">In the past 7 days. Review your dose log.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Add Schedule Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="border-sky-200 dark:border-sky-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Add New Schedule
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medicine Name *</Label>
                  <Input placeholder="e.g. Metformin 500mg" value={formData.medicineName} onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Dosage *</Label>
                  <Input placeholder="e.g. 1 tablet" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v as Frequency })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once daily</SelectItem>
                      <SelectItem value="twice">Twice daily</SelectItem>
                      <SelectItem value="thrice">Thrice daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="as_needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timing</Label>
                  <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Food Instruction</Label>
                  <Select value={formData.instruction} onValueChange={(v) => setFormData({ ...formData, instruction: v as FoodInstruction })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before food</SelectItem>
                      <SelectItem value="after">After food</SelectItem>
                      <SelectItem value="with">With food</SelectItem>
                      <SelectItem value="empty_stomach">Empty stomach</SelectItem>
                      <SelectItem value="any">Any time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="e.g. Take with meals" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <Button className="mt-4 bg-sky-600 hover:bg-sky-700 text-white" onClick={handleAddSchedule}>
                <Plus className="h-4 w-4 mr-2" /> Add Schedule
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Schedules */}
      <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-sky-600" />
              Active Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {schedules.map((schedule, idx) => {
              const taken = schedule.timeSlots.filter((t) => t.taken).length
              const total = schedule.timeSlots.length
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{schedule.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{schedule.dosage} • {frequencyLabel[schedule.frequency]}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {instructionIcon[schedule.instruction]}
                        <span className="ml-1">{instructionLabel[schedule.instruction]}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {schedule.timeSlots.map((slot) => (
                      <div key={slot.time} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border bg-muted/30">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono">{slot.time}</span>
                        <Button
                          size="sm"
                          variant={slot.taken ? 'default' : 'outline'}
                          className={`h-6 px-2 text-xs ${slot.taken ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                          onClick={() => handleMarkTaken(schedule.id, slot.time)}
                        >
                          {slot.taken ? <Check className="h-3 w-3 mr-1" /> : null}
                          {slot.taken ? 'Taken' : 'Mark'}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <Progress value={total > 0 ? (taken / total) * 100 : 0} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{taken}/{total} today</span>
                  </div>

                  {/* Notes & Dates */}
                  {schedule.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{schedule.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {schedule.startDate} → {schedule.endDate || 'Ongoing'}
                  </p>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dose Log History */}
      <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-sky-600" />
              Dose Log (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {doseLog.map((log, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{log.date}</span>
                <span className="font-mono text-xs w-12 shrink-0">{log.time}</span>
                <span className="flex-1 truncate">{log.medicineName}</span>
                {log.taken ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Taken</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Missed</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
