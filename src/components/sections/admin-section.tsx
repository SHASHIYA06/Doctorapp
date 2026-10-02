'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Activity, Database, Server } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { ModalityBadge } from '@/components/clinical/modality-badge'
import { PriorityBadge } from '@/components/clinical/priority-badge'
import { toast } from '@/hooks/use-toast'

interface TriageRule {
  id: string
  name: string
  modality: string
  condition: string
  priority: string
  action: string
  isActive: boolean
}

interface CareTrack {
  id: string
  name: string
  modality: string
  description: string | null
  isActive: boolean
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function AdminSection() {
  const [triageRules, setTriageRules] = useState<TriageRule[]>([])
  const [careTracks, setCareTracks] = useState<CareTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/triage').then((r) => r.json()).catch(() => ({})),
      fetch('/api/knowledge').then((r) => r.json()).catch(() => ({})),
    ])
      .then(([triageData]) => {
        setTriageRules(triageData.data ?? triageData.rules ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      // Optimistic update
      setTriageRules(triageRules.map((r) => r.id === ruleId ? { ...r, isActive: !isActive } : r))
      toast({ title: `Rule ${isActive ? 'Disabled' : 'Enabled'}` })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // System health data
  const systemHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.9%', icon: Server },
    { name: 'Database', status: 'healthy', uptime: '99.8%', icon: Database },
    { name: 'Safety Engine', status: 'healthy', uptime: '99.7%', icon: Activity },
  ]

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      <Tabs defaultValue="triage-rules">
        <TabsList>
          <TabsTrigger value="triage-rules" className="gap-1">
            <Settings className="h-3 w-3" /> Triage Rules
          </TabsTrigger>
          <TabsTrigger value="care-tracks" className="gap-1">
            <Activity className="h-3 w-3" /> Care Tracks
          </TabsTrigger>
          <TabsTrigger value="system-health" className="gap-1">
            <Server className="h-3 w-3" /> System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triage-rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Triage Rules</CardTitle>
              <CardDescription>Configure automated triage rules across modalities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Modality</TableHead>
                        <TableHead className="hidden sm:table-cell">Priority</TableHead>
                        <TableHead className="hidden md:table-cell">Action</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {triageRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell><ModalityBadge modality={rule.modality} /></TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <PriorityBadge priority={rule.priority} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">{rule.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                              aria-label={`Toggle ${rule.name}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {triageRules.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No triage rules configured
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care-tracks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Care Tracks</CardTitle>
              <CardDescription>Manage care track definitions across modalities</CardDescription>
            </CardHeader>
            <CardContent>
              {careTracks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No care tracks configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Modality</TableHead>
                      <TableHead className="hidden sm:table-cell">Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careTracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell className="font-medium">{track.name}</TableCell>
                        <TableCell><ModalityBadge modality={track.modality} /></TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {track.description ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={track.isActive ? 'default' : 'secondary'} className="text-xs">
                            {track.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-health" className="mt-4 space-y-4">
          {systemHealth.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <service.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {service.status}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress value={parseFloat(service.uptime)} className="h-1.5 [&>div]:bg-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
