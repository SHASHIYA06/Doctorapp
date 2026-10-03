'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ShieldAlert,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Package,
  FileText,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface RecallAlert {
  id: string
  medicineName: string
  manufacturer: string
  batchNo: string
  recallDate: string
  reason: string
  severity: 'critical' | 'moderate' | 'low'
  status: 'active' | 'resolved' | 'monitoring'
  affectedDistricts: string[]
  cdscoRefNo: string
  patientImpactCount: number
  description: string
}

const mockRecalls: RecallAlert[] = [
  {
    id: '1',
    medicineName: 'Dolo 650 (Paracetamol)',
    manufacturer: 'Micro Labs Ltd',
    batchNo: 'ML-2025-0892',
    recallDate: '2026-09-28',
    reason: 'Dissolution test failure - substandard quality',
    severity: 'critical',
    status: 'active',
    affectedDistricts: ['Bangalore Urban', 'Mysore', 'Tumkur'],
    cdscoRefNo: 'CDSCO/RC/2026/0847',
    patientImpactCount: 1240,
    description: 'Batch failed dissolution testing per IP standards. All units from this batch must be quarantined immediately.',
  },
  {
    id: '2',
    medicineName: 'Azithromycin 500mg',
    manufacturer: 'Alkem Laboratories',
    batchNo: 'ALK-2025-4521',
    recallDate: '2026-09-25',
    reason: 'Impurity above acceptable limits (N-nitrosamine)',
    severity: 'critical',
    status: 'active',
    affectedDistricts: ['Bangalore Urban', 'Bangalore Rural'],
    cdscoRefNo: 'CDSCO/RC/2026/0832',
    patientImpactCount: 890,
    description: 'N-nitrosamine impurity detected above ICH M7 acceptable intake. Immediate recall initiated per CDSCO directive.',
  },
  {
    id: '3',
    medicineName: 'Omeprazole 20mg',
    manufacturer: 'Dr. Reddy\'s',
    batchNo: 'DRL-2025-7234',
    recallDate: '2026-09-20',
    reason: 'Labeling error - incorrect dosage information',
    severity: 'moderate',
    status: 'monitoring',
    affectedDistricts: ['Mysore'],
    cdscoRefNo: 'CDSCO/RC/2026/0815',
    patientImpactCount: 320,
    description: 'Label states 40mg but capsule contains 20mg. Risk of under-dosing for patients.',
  },
  {
    id: '4',
    medicineName: 'Atorvastatin 10mg',
    manufacturer: 'Lupin Ltd',
    batchNo: 'LUP-2025-1987',
    recallDate: '2026-09-15',
    reason: 'Stability failure - degradation beyond specification',
    severity: 'moderate',
    status: 'resolved',
    affectedDistricts: ['Bangalore Urban'],
    cdscoRefNo: 'CDSCO/RC/2026/0798',
    patientImpactCount: 156,
    description: 'Assay results showed 87% of labeled potency at 6-month stability point. Below 90% specification.',
  },
  {
    id: '5',
    medicineName: 'Cetirizine 10mg',
    manufacturer: 'Cipla Ltd',
    batchNo: 'CPL-2025-3344',
    recallDate: '2026-09-10',
    reason: 'Packaging defect - child-resistant cap failure',
    severity: 'low',
    status: 'resolved',
    affectedDistricts: ['Mandya', 'Tumkur'],
    cdscoRefNo: 'CDSCO/RC/2026/0780',
    patientImpactCount: 45,
    description: 'Child-resistant packaging cap did not engage properly on select units. Replacement caps being distributed.',
  },
]

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  moderate: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
}

const statusColors: Record<string, string> = {
  active: 'bg-red-600 text-white',
  monitoring: 'bg-amber-600 text-white',
  resolved: 'bg-green-600 text-white',
}

export function RecallsSection() {
  const { selectedRecallId, setSelectedRecallId } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [expandedRecall, setExpandedRecall] = useState<string | null>(null)

  const filteredRecalls = mockRecalls.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!r.medicineName.toLowerCase().includes(q) && !r.manufacturer.toLowerCase().includes(q) && !r.batchNo.toLowerCase().includes(q)) {
        return false
      }
    }
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false
    return true
  })

  const selectedRecall = mockRecalls.find((r) => r.id === selectedRecallId)
  const activeCount = mockRecalls.filter((r) => r.status === 'active').length
  const criticalCount = mockRecalls.filter((r) => r.severity === 'critical').length

  const handleAcknowledge = (recallId: string) => {
    toast({ title: 'Recall Acknowledged', description: 'You have been registered as aware of this recall' })
  }

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
            <RotateCcw className="h-6 w-6 text-red-700 dark:text-red-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recall Monitor</h2>
            <p className="text-sm text-muted-foreground">CDSCO-integrated drug recall tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {activeCount > 0 && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <ShieldAlert className="h-3 w-3" />
              {activeCount} Active Recall{activeCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            CDSCO Feed Live
          </Badge>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-red-50 border-2 border-red-300 dark:bg-red-950 dark:border-red-700"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                {criticalCount} Critical Recall{criticalCount !== 1 ? 's' : ''} Active
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Immediate action required. Review affected batches and quarantine stock.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by medicine, manufacturer, or batch number..."
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-lg font-bold">{mockRecalls.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Recalls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-lg font-bold">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-lg font-bold">{mockRecalls.filter(r => r.status === 'monitoring').length}</p>
              <p className="text-[10px] text-muted-foreground">Monitoring</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-lg font-bold">{mockRecalls.filter(r => r.status === 'resolved').length}</p>
              <p className="text-[10px] text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recall Cards */}
      <div className="space-y-3">
        {filteredRecalls.map((recall, i) => {
          const isExpanded = expandedRecall === recall.id
          return (
            <motion.div
              key={recall.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`border-l-4 ${
                  recall.severity === 'critical' ? 'border-l-red-500' : recall.severity === 'moderate' ? 'border-l-amber-500' : 'border-l-green-500'
                } ${selectedRecallId === recall.id ? 'ring-1 ring-teal-500' : ''}`}
                onClick={() => setSelectedRecallId(recall.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      recall.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' : recall.severity === 'moderate' ? 'bg-amber-100 dark:bg-amber-900' : 'bg-green-100 dark:bg-green-900'
                    }`}>
                      <RotateCcw className={`h-5 w-5 ${
                        recall.severity === 'critical' ? 'text-red-600' : recall.severity === 'moderate' ? 'text-amber-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold">{recall.medicineName}</h3>
                        <Badge className={`text-[10px] ${severityColors[recall.severity]}`}>{recall.severity}</Badge>
                        <Badge className={`text-[10px] ${statusColors[recall.status]}`}>{recall.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{recall.manufacturer} • Batch: {recall.batchNo}</p>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {recall.reason}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recall.recallDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {recall.affectedDistricts.length} district{recall.affectedDistricts.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3">
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">CDSCO Reference</p>
                              <p className="text-sm font-mono">{recall.cdscoRefNo}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Patient Impact</p>
                              <p className="text-sm font-bold text-red-600">{recall.patientImpactCount.toLocaleString()} patients</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                            <p className="text-sm text-muted-foreground">{recall.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Affected Districts</p>
                            <div className="flex flex-wrap gap-1">
                              {recall.affectedDistricts.map((d) => (
                                <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleAcknowledge(recall.id) }} className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Acknowledge
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1">
                              <ExternalLink className="h-3 w-3" />
                              CDSCO Portal
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedRecall(isExpanded ? null : recall.id) }}
                        className="mt-2 text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Show less' : 'Show details'}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
