'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Bell,
  BellOff,
  Clock,
  Package,
  Search,
  ArrowUpDown,
  ShieldCheck,
  X,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface TrackedMedicine {
  id: string
  name: string
  batchNumber: string
  expiryDate: string
  quantity: number
  verified: boolean
  snoozedUntil: string | null
}

const mockMedicines: TrackedMedicine[] = [
  { id: '1', name: 'Metformin 500mg', batchNumber: 'MET-2027-001', expiryDate: '2026-03-15', quantity: 30, verified: true, snoozedUntil: null },
  { id: '2', name: 'Amlodipine 5mg', batchNumber: 'AML-2026-044', expiryDate: '2026-10-20', quantity: 28, verified: true, snoozedUntil: null },
  { id: '3', name: 'Atorvastatin 10mg', batchNumber: 'ATO-2026-112', expiryDate: '2026-04-05', quantity: 15, verified: false, snoozedUntil: null },
  { id: '4', name: 'Omeprazole 20mg', batchNumber: 'OMP-2028-022', expiryDate: '2028-06-30', quantity: 20, verified: true, snoozedUntil: null },
  { id: '5', name: 'Cetirizine 10mg', batchNumber: 'CET-2026-099', expiryDate: '2026-02-28', quantity: 10, verified: true, snoozedUntil: '2026-04-01' },
  { id: '6', name: 'Pantoprazole 40mg', batchNumber: 'PAN-2027-015', expiryDate: '2027-11-15', quantity: 14, verified: true, snoozedUntil: null },
]

function getDaysUntilExpiry(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpiryColor(days: number): string {
  if (days < 0) return 'text-red-600'
  if (days < 7) return 'text-red-500'
  if (days < 30) return 'text-orange-500'
  return 'text-green-600'
}

function getExpiryBgColor(days: number): string {
  if (days < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200'
  if (days < 7) return 'bg-red-50 dark:bg-red-900/20 border-red-200'
  if (days < 30) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'
  return 'bg-green-50 dark:bg-green-900/20 border-green-200'
}

function getMilestoneCheck(days: number, milestone: number): boolean {
  return days <= milestone && days > 0
}

type SortOption = 'soonest' | 'latest' | 'alpha'
type FilterTab = 'all' | 'expired' | 'expiring' | 'safe'

export function ExpiryTrackerSection() {
  const [showForm, setShowForm] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('soonest')
  const [searchQuery, setSearchQuery] = useState('')
  const [medicines, setMedicines] = useState(mockMedicines)
  const [formData, setFormData] = useState({ name: '', batchNumber: '', expiryDate: '', quantity: '' })

  const filteredMedicines = useMemo(() => {
    let list = [...medicines]
    if (searchQuery) {
      list = list.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    list.sort((a, b) => {
      if (sortOption === 'soonest') return getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
      if (sortOption === 'latest') return getDaysUntilExpiry(b.expiryDate) - getDaysUntilExpiry(a.expiryDate)
      return a.name.localeCompare(b.name)
    })
    return list
  }, [medicines, sortOption, searchQuery])

  const tabFilter = (tab: FilterTab) => {
    return filteredMedicines.filter((m) => {
      const days = getDaysUntilExpiry(m.expiryDate)
      if (tab === 'expired') return days < 0
      if (tab === 'expiring') return days >= 0 && days < 30
      if (tab === 'safe') return days >= 30
      return true
    })
  }

  const expiredCount = medicines.filter((m) => getDaysUntilExpiry(m.expiryDate) < 0).length
  const expiringCount = medicines.filter((m) => { const d = getDaysUntilExpiry(m.expiryDate); return d >= 0 && d < 30 }).length

  const handleSnooze = (id: string, duration: string) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const snoozeDate = new Date()
        if (duration === '1w') snoozeDate.setDate(snoozeDate.getDate() + 7)
        else snoozeDate.setMonth(snoozeDate.getMonth() + 1)
        return { ...m, snoozedUntil: snoozeDate.toISOString().split('T')[0] }
      })
    )
    toast({ title: 'Snoozed', description: `Expiry alert snoozed for ${duration === '1w' ? '1 week' : '1 month'}` })
  }

  const handleAdd = () => {
    if (!formData.name || !formData.expiryDate) {
      toast({ title: 'Missing Fields', description: 'Medicine name and expiry date are required', variant: 'destructive' })
      return
    }
    const newMed: TrackedMedicine = {
      id: String(medicines.length + 1),
      name: formData.name,
      batchNumber: formData.batchNumber || 'N/A',
      expiryDate: formData.expiryDate,
      quantity: parseInt(formData.quantity) || 0,
      verified: false,
      snoozedUntil: null,
    }
    setMedicines([...medicines, newMed])
    setShowForm(false)
    setFormData({ name: '', batchNumber: '', expiryDate: '', quantity: '' })
    toast({ title: 'Medicine Tracked', description: `${formData.name} added to expiry tracker` })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <CalendarClock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Expiry Date Tracker</h2>
            <p className="text-sm text-muted-foreground">Track medicine expiry dates and get timely alerts</p>
          </div>
          <Button size="sm" className="ml-auto bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> Add Medicine
          </Button>
        </div>
      </motion.div>

      {/* Alerts Banner */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <motion.div {...fadeSlide} transition={{ delay: 0.05 }}>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {expiredCount > 0 && `${expiredCount} medicine(s) expired! `}
                {expiringCount > 0 && `${expiringCount} expiring within 30 days.`}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">Please dispose expired medicines safely and replace expiring ones.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Medicine Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Track New Medicine
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medicine Name *</Label>
                  <Input placeholder="e.g. Metformin 500mg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input placeholder="e.g. MET-2027-001" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="e.g. 30" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
              </div>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add to Tracker
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search & Sort */}
      <motion.div {...fadeSlide} transition={{ delay: 0.1 }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search medicines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Expiry Soonest</SelectItem>
              <SelectItem value="latest">Latest Expiry</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Tracked Items */}
      <motion.div {...fadeSlide} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({filteredMedicines.length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredCount})</TabsTrigger>
                <TabsTrigger value="expiring">Expiring Soon ({expiringCount})</TabsTrigger>
                <TabsTrigger value="safe">Safe</TabsTrigger>
              </TabsList>
              {(['all', 'expired', 'expiring', 'safe'] as FilterTab[]).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tabFilter(tab).map((med, idx) => {
                      const days = getDaysUntilExpiry(med.expiryDate)
                      return (
                        <motion.div
                          key={med.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`p-3 rounded-lg border ${getExpiryBgColor(days)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{med.name}</span>
                                {med.verified && <ShieldCheck className="h-3 w-3 text-green-600" />}
                                {med.snoozedUntil && (
                                  <Badge variant="outline" className="text-xs">
                                    <BellOff className="h-3 w-3 mr-1" /> Snoozed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Batch: {med.batchNumber} • Qty: {med.quantity} • Exp: {med.expiryDate}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-sm ${getExpiryColor(days)}`}>
                                {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                              </p>
                            </div>
                          </div>

                          {/* Milestones */}
                          <div className="flex items-center gap-3 mt-2">
                            {([7, 14, 30] as const).map((milestone) => (
                              <div key={milestone} className="flex items-center gap-1 text-xs">
                                {days <= milestone && days > 0 ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-muted-foreground">{milestone}d</span>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  <Bell className="h-3 w-3 mr-1" /> Snooze
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleSnooze(med.id, '1w')}>1 Week</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(med.id, '1m')}>1 Month</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      )
                    })}
                    {tabFilter(tab).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">No medicines in this category</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
