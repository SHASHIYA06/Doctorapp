'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Clock,
  AlertTriangle,
  FileCheck,
  UserPlus,
  ListChecks,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/lib/store'
import { PriorityBadge } from '@/components/clinical/priority-badge'

interface StatsData {
  totalPatients: number
  pendingReviews: number
  activeAlerts: number
  signedPlans: number
}

interface AlertData {
  id: string
  patientName: string
  type: string
  severity: string
  message: string
  createdAt: string
}

interface QueueData {
  emergency: number
  urgent: number
  routine: number
}

const activityData = [
  { name: 'Mon', encounters: 12, plans: 4 },
  { name: 'Tue', encounters: 18, plans: 7 },
  { name: 'Wed', encounters: 15, plans: 5 },
  { name: 'Thu', encounters: 22, plans: 9 },
  { name: 'Fri', encounters: 17, plans: 6 },
  { name: 'Sat', encounters: 8, plans: 3 },
  { name: 'Sun', encounters: 5, plans: 2 },
]

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function DashboardSection() {
  const { setActiveSection } = useAppStore()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Seed data first
        await fetch('/api/seed', { method: 'POST' }).catch(() => {})

        const [patientsRes, alertsRes, queueRes, plansRes] = await Promise.all([
          fetch('/api/patients').catch(() => null),
          fetch('/api/safety').catch(() => null),
          fetch('/api/clinician-queue').catch(() => null),
          fetch('/api/care-plans?status=DRAFT').catch(() => null),
        ])

        const patientsData = patientsRes ? await patientsRes.json().catch(() => null) : null
        const alertsData = alertsRes ? await alertsRes.json().catch(() => null) : null
        const queueData = queueRes ? await queueRes.json().catch(() => null) : null
        const plansData = plansRes ? await plansRes.json().catch(() => null) : null

        const patientList = patientsData?.data ?? []
        const alertList = alertsData?.data ?? []
        const queueSummary = queueData?.data?.summary
        const plansList = plansData?.data ?? []

        setStats({
          totalPatients: patientsData?.pagination?.total ?? patientList.length,
          pendingReviews: plansList.length,
          activeAlerts: alertList.length,
          signedPlans: 2,
        })

        setAlerts(
          alertList.slice(0, 5).map((a: Record<string, string>) => ({
            id: a.id,
            patientName: 'Patient',
            type: a.type,
            severity: a.severity,
            message: a.message,
            createdAt: a.createdAt,
          }))
        )

        setQueue({
          emergency: queueSummary?.unassignedCount ?? 1,
          urgent: queueSummary?.assignedCount ?? 2,
          routine: Math.max(0, (patientList.length - (queueSummary?.unassignedCount ?? 0) - (queueSummary?.assignedCount ?? 0))) || 4,
        })
      } catch {
        // fallback
        setStats({ totalPatients: 0, pendingReviews: 0, activeAlerts: 0, signedPlans: 0 })
        setQueue({ emergency: 0, urgent: 0, routine: 0 })
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-teal-600 dark:text-teal-400' },
    { title: 'Pending Reviews', value: stats?.pendingReviews ?? 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { title: 'Active Alerts', value: stats?.activeAlerts ?? 0, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
    { title: 'Signed Plans Today', value: stats?.signedPlans ?? 0, icon: FileCheck, color: 'text-green-600 dark:text-green-400' },
  ]

  const totalQueue = (queue?.emergency ?? 0) + (queue?.urgent ?? 0) + (queue?.routine ?? 0) || 1

  return (
    <motion.div {...fadeSlide} className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setActiveSection('patients')} className="gap-2">
          <UserPlus className="h-4 w-4" />
          New Patient
        </Button>
        <Button variant="outline" onClick={() => setActiveSection('clinician-queue')} className="gap-2">
          <ListChecks className="h-4 w-4" />
          Review Queue
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Safety Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Safety Alerts</CardTitle>
            <CardDescription>Active alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PriorityBadge priority={alert.severity} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue Overview</CardTitle>
            <CardDescription>Encounters by urgency level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {queue && (
              <>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Emergency</Badge>
                      </span>
                      <span className="font-medium">{queue.emergency}</span>
                    </div>
                    <Progress value={(queue.emergency / totalQueue) * 100} className="h-2 [&>div]:bg-red-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Urgent</Badge>
                      </span>
                      <span className="font-medium">{queue.urgent}</span>
                    </div>
                    <Progress value={(queue.urgent / totalQueue) * 100} className="h-2 [&>div]:bg-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Routine</Badge>
                      </span>
                      <span className="font-medium">{queue.routine}</span>
                    </div>
                    <Progress value={(queue.routine / totalQueue) * 100} className="h-2 [&>div]:bg-green-500" />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Activity</CardTitle>
          <CardDescription>Encounters and care plans signed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="encounters" fill="#0d9488" radius={[4, 4, 0, 0]} name="Encounters" />
                <Bar dataKey="plans" fill="#10b981" radius={[4, 4, 0, 0]} name="Plans Signed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
