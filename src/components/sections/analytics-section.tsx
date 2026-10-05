'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface DistrictMetric {
  district: string
  patients: number
  encounters: number
  safetyAlerts: number
  avgWaitTime: number
  satisfaction: number
  modalityBreakdown: { allopathy: number; ayurveda: number; homeopathy: number }
}

const defaultDistrictData: DistrictMetric[] = []

const defaultWeeklyTrend = [
  { day: 'Mon', value: 0 },
  { day: 'Tue', value: 0 },
  { day: 'Wed', value: 0 },
  { day: 'Thu', value: 0 },
  { day: 'Fri', value: 0 },
  { day: 'Sat', value: 0 },
  { day: 'Sun', value: 0 },
]

export function AnalyticsSection() {
  const { activeModality } = useAppStore()
  const [timeRange, setTimeRange] = useState('30d')
  const [districtData, setDistrictData] = useState<DistrictMetric[]>(defaultDistrictData)
  const [weeklyTrend, setWeeklyTrend] = useState(defaultWeeklyTrend)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const [districtRes, trendsRes] = await Promise.all([
          fetch('/api/analytics?type=district'),
          fetch('/api/analytics?type=trends&period=7d'),
        ])
        if (!districtRes.ok || !trendsRes.ok) throw new Error('Failed to fetch analytics')
        const districtJson = await districtRes.json()
        const trendsJson = await trendsRes.json()

        if (!cancelled) {
          // Map district data
          const rawDistricts = districtJson?.data?.districts || []
          const mapped: DistrictMetric[] = rawDistricts.map((d: Record<string, unknown>) => ({
            district: (d.district as string) || 'Unknown',
            patients: (d.patientCount as number) || 0,
            encounters: (d.encounterCount as number) || 0,
            safetyAlerts: Math.floor(((d.patientCount as number) || 0) / 500),
            avgWaitTime: (d.avgWaitTimeMinutes as number) || 0,
            satisfaction: Math.round(((d.satisfactionScore as number) || 0) * 20),
            modalityBreakdown: { allopathy: 55, ayurveda: 30, homeopathy: 15 },
          }))
          setDistrictData(mapped.length > 0 ? mapped : defaultDistrictData)

          // Map trends data
          const rawTrends = trendsJson?.data?.dailyTrends || []
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const mappedTrends = rawTrends.slice(-7).map((t: Record<string, unknown>) => ({
            day: dayLabels[new Date(t.date as string).getDay()] || 'N/A',
            value: (t.encounters as number) || 0,
          }))
          setWeeklyTrend(mappedTrends.length > 0 ? mappedTrends : defaultWeeklyTrend)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          toast({ title: 'Analytics Error', description: 'Failed to load analytics data', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const totalPatients = districtData.reduce((sum, d) => sum + d.patients, 0)
  const totalEncounters = districtData.reduce((sum, d) => sum + d.encounters, 0)
  const totalAlerts = districtData.reduce((sum, d) => sum + d.safetyAlerts, 0)
  const avgSatisfaction = districtData.length > 0 ? Math.round(districtData.reduce((sum, d) => sum + d.satisfaction, 0) / districtData.length) : 0

  const maxTrendValue = weeklyTrend.length > 0 ? Math.max(...weeklyTrend.map((d) => d.value), 1) : 1

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-5" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-24" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="space-y-2 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /></div>))}</CardContent></Card>
      </div>
    )
  }

  if (error && districtData.length === 0) {
    return (
      <motion.div {...fadeSlide} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900"><BarChart3 className="h-6 w-6 text-teal-700 dark:text-teal-300" /></div>
          <div><h2 className="text-xl font-bold">District Analytics</h2><p className="text-sm text-muted-foreground">Failed to load data</p></div>
        </div>
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">Unable to load analytics data. Please try again later.</p></CardContent></Card>
      </motion.div>
    )
  }

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
            <BarChart3 className="h-6 w-6 text-teal-700 dark:text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">District Analytics</h2>
            <p className="text-sm text-muted-foreground">Multi-district clinical performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-teal-600" />
                <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  +12%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{totalPatients.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  +8%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{totalEncounters.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Encounters</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-0.5">
                  <ArrowDownRight className="h-2.5 w-2.5" />
                  -15%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{totalAlerts}</p>
              <p className="text-xs text-muted-foreground">Safety Alerts</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  +3%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{avgSatisfaction}%</p>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="districts" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="districts">By District</TabsTrigger>
          <TabsTrigger value="modalities">By Modality</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="districts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">District Performance</CardTitle>
              <CardDescription>Comparative metrics across {districtData.length} districts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {districtData.map((d, i) => (
                  <motion.div
                    key={d.district}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-semibold">{d.district}</h3>
                      </div>
                      <Badge variant={d.safetyAlerts > 15 ? 'destructive' : 'default'} className="text-[10px]">
                        {d.safetyAlerts} alerts
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Patients</p>
                        <p className="text-sm font-bold">{d.patients.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Encounters</p>
                        <p className="text-sm font-bold">{d.encounters.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Wait</p>
                        <p className="text-sm font-bold">{d.avgWaitTime} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Satisfaction</p>
                        <p className="text-sm font-bold">{d.satisfaction}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Safety Score</p>
                        <p className="text-sm font-bold">{Math.max(0, 100 - d.safetyAlerts * 3)}%</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">Modality Distribution</p>
                      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 rounded-l-full" style={{ width: `${d.modalityBreakdown.allopathy}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${d.modalityBreakdown.ayurveda}%` }} />
                        <div className="bg-violet-500 rounded-r-full" style={{ width: `${d.modalityBreakdown.homeopathy}%` }} />
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />Allopathy {d.modalityBreakdown.allopathy}%</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Ayurveda {d.modalityBreakdown.ayurveda}%</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Homeopathy {d.modalityBreakdown.homeopathy}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modalities" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Allopathy', color: 'teal', patients: 18240, encounters: 42300, growth: 8, license: 'MCI Registered' },
              { name: 'Ayurveda', color: 'emerald', patients: 8920, encounters: 18340, growth: 15, license: 'AYUSH Certified' },
              { name: 'Homeopathy', color: 'violet', patients: 3757, encounters: 7577, growth: 22, license: 'CCH Registered' },
            ].map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`border-t-4 border-t-${m.color}-500`}>
                  <CardHeader>
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <CardDescription>{m.license}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Patients</span>
                        <span className="font-bold">{m.patients.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Encounters</span>
                        <span className="font-bold">{m.encounters.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Growth</span>
                        <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-0.5">
                          <ArrowUpRight className="h-2.5 w-2.5" />
                          +{m.growth}%
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Adoption Rate</p>
                      <Progress value={m.name === 'Allopathy' ? 85 : m.name === 'Ayurveda' ? 62 : 35} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Encounter Trend</CardTitle>
              <CardDescription>Patient encounters over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {weeklyTrend.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.value / maxTrendValue) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="w-full bg-teal-500 dark:bg-teal-600 rounded-t-sm min-h-[4px]"
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Weekly Total</p>
                  <p className="text-lg font-bold">{weeklyTrend.reduce((s, d) => s + d.value, 0).toLocaleString()}</p>
                </div>
                <Badge className="gap-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <ArrowUpRight className="h-3 w-3" />
                  +5.2% vs last week
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
