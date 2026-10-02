'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface AuditEvent {
  id: string
  actorId: string | null
  actorRole: string | null
  action: string
  resourceType: string
  resourceId: string | null
  outcome: string
  reason: string | null
  createdAt: string
}

const outcomeStyles: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  BLOCKED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function AuditSection() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [resourceFilter, setResourceFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => setEvents(d.data ?? d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const actionTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.action)))]
  const resourceTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.resourceType)))]

  const filteredEvents = events.filter((e) => {
    if (actionFilter !== 'ALL' && e.action !== actionFilter) return false
    if (resourceFilter !== 'ALL' && e.resourceType !== resourceFilter) return false
    return true
  })

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {actionTypes.map((a) => (
                <SelectItem key={a} value={a}>{a === 'ALL' ? 'All Actions' : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Resource</Label>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {resourceTypes.map((r) => (
                <SelectItem key={r} value={r}>{r === 'ALL' ? 'All Resources' : r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>{filteredEvents.length} event(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="hidden sm:table-cell">Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.slice(0, 50).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">
                        {event.actorRole ?? event.actorId ?? 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{event.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{event.resourceType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${outcomeStyles[event.outcome] ?? ''}`}>
                          {event.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {event.reason ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No audit events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
