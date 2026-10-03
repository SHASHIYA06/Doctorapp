'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  Pill,
  Calendar,
  AlertTriangle,
  Shield,
  FlaskConical,
  Clock,
  ArrowRightLeft,
  IndianRupee,
  Settings,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type Section } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

// ── Types ──────────────────────────────────────────────────────

type NotificationType =
  | 'PRESCRIPTION'
  | 'APPOINTMENT'
  | 'RECALL'
  | 'SAFETY'
  | 'LAB_RESULT'
  | 'FOLLOW_UP'
  | 'REFERRAL'
  | 'BILLING'
  | 'SYSTEM'

type NotificationCategory = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL'

interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionLabel?: string
  actionSection?: Section
  patientName?: string
  metadata?: Record<string, string>
}

// ── Constants ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; label: string; color: string }> = {
  PRESCRIPTION: { icon: Pill, label: 'Prescription', color: 'text-violet-600' },
  APPOINTMENT: { icon: Calendar, label: 'Appointment', color: 'text-blue-600' },
  RECALL: { icon: AlertTriangle, label: 'Recall', color: 'text-red-600' },
  SAFETY: { icon: Shield, label: 'Safety', color: 'text-emerald-600' },
  LAB_RESULT: { icon: FlaskConical, label: 'Lab Result', color: 'text-cyan-600' },
  FOLLOW_UP: { icon: Clock, label: 'Follow-up', color: 'text-amber-600' },
  REFERRAL: { icon: ArrowRightLeft, label: 'Referral', color: 'text-indigo-600' },
  BILLING: { icon: IndianRupee, label: 'Billing', color: 'text-orange-600' },
  SYSTEM: { icon: Settings, label: 'System', color: 'text-gray-600' },
}

const CATEGORY_CONFIG: Record<NotificationCategory, { bg: string; text: string }> = {
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800' },
  WARNING: { bg: 'bg-amber-100', text: 'text-amber-800' },
  URGENT: { bg: 'bg-orange-100', text: 'text-orange-800' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' },
}

// ── Mock Data ──────────────────────────────────────────────────

const now = new Date()

const mockNotifications: Notification[] = [
  {
    id: 'n1', type: 'RECALL', category: 'CRITICAL', title: 'CDSCO Drug Recall Alert',
    message: 'Dolo 650 (Batch ML-2025-0892) recalled due to dissolution test failure. Quarantine all stock immediately.',
    isRead: false, createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    actionLabel: 'View Recalls', actionSection: 'recalls', patientName: undefined,
  },
  {
    id: 'n2', type: 'PRESCRIPTION', category: 'INFO', title: 'New Prescription Signed',
    message: 'Dr. Anil Mehta signed prescription #RX-2026-452 for Rajesh Kumar Sharma (Aspirin 75mg + Atorvastatin 80mg).',
    isRead: false, createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    actionLabel: 'View Prescription', actionSection: 'prescriptions', patientName: 'Rajesh Kumar Sharma',
  },
  {
    id: 'n3', type: 'LAB_RESULT', category: 'WARNING', title: 'Critical Lab Result',
    message: 'Troponin I level 8.5 ng/mL (critical high) for patient Mohammed Asif. Immediate clinical attention required.',
    isRead: false, createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    actionLabel: 'View Lab Orders', actionSection: 'lab-orders', patientName: 'Mohammed Asif',
  },
  {
    id: 'n4', type: 'APPOINTMENT', category: 'INFO', title: 'Upcoming Appointment',
    message: 'Priya Nair has an appointment at 10:30 AM today with Dr. Sunita Reddy (Nephrology follow-up).',
    isRead: true, createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Appointments', actionSection: 'appointments', patientName: 'Priya Nair',
  },
  {
    id: 'n5', type: 'SAFETY', category: 'URGENT', title: 'Drug Interaction Alert',
    message: 'Potential interaction: Clopidogrel + Omeprazole (reduced antiplatelet effect). Patient: Rajesh Kumar Sharma.',
    isRead: false, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Interactions', actionSection: 'drug-interactions', patientName: 'Rajesh Kumar Sharma',
  },
  {
    id: 'n6', type: 'FOLLOW_UP', category: 'INFO', title: 'Follow-up Reminder',
    message: 'Lakshmi Iyer is due for post-discharge follow-up in 2 days (Cardiology OPD). Echo repeat pending.',
    isRead: true, createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Follow-ups', actionSection: 'follow-up-reminders', patientName: 'Lakshmi Iyer',
  },
  {
    id: 'n7', type: 'BILLING', category: 'WARNING', title: 'Insurance Claim Pending',
    message: 'Insurance claim for Priya Nair (₹45,000) pending for 5 days. New India Assurance — approval awaited.',
    isRead: false, createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Billing', actionSection: 'billing', patientName: 'Priya Nair',
  },
  {
    id: 'n8', type: 'REFERRAL', category: 'INFO', title: 'Specialist Referral Received',
    message: 'Referral from Dr. Gupta (General Medicine) for Mohammed Asif to Cardiology — chest pain evaluation.',
    isRead: true, createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Referrals', actionSection: 'referrals', patientName: 'Mohammed Asif',
  },
  {
    id: 'n9', type: 'SYSTEM', category: 'INFO', title: 'System Update Completed',
    message: 'Clinical decision support rules updated to v2026.10.3. New interaction checks for NOACs added.',
    isRead: true, createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n10', type: 'SAFETY', category: 'CRITICAL', title: 'Allergy Alert — Near Miss',
    message: 'Attempted prescription of Ciprofloxacin for Mohammed Asif who has a documented Ciprofloxacin allergy (rash). Prescription blocked.',
    isRead: false, createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    actionLabel: 'View Safety Alerts', actionSection: 'safety', patientName: 'Mohammed Asif',
  },
  {
    id: 'n11', type: 'PRESCRIPTION', category: 'INFO', title: 'Prescription Renewal Due',
    message: 'Lakshmi Iyer\'s prescription for Metformin 500mg expires in 3 days. Renewal required.',
    isRead: false, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Prescriptions', actionSection: 'prescriptions', patientName: 'Lakshmi Iyer',
  },
  {
    id: 'n12', type: 'LAB_RESULT', category: 'INFO', title: 'Lab Results Ready',
    message: 'Complete blood count and lipid panel results now available for Rajesh Kumar Sharma.',
    isRead: true, createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    actionLabel: 'View Lab Orders', actionSection: 'lab-orders', patientName: 'Rajesh Kumar Sharma',
  },
]

// ── Helpers ────────────────────────────────────────────────────

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// ── Animation ──────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ──────────────────────────────────────────────────

export function NotificationsSection() {
  const { setActiveSection } = useAppStore()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'ALL' | NotificationType>('ALL')
  const [filterCategory, setFilterCategory] = useState<'ALL' | NotificationCategory>('ALL')
  const [filterRead, setFilterRead] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || mockNotifications)
        } else {
          setNotifications(mockNotifications)
        }
      } catch {
        setNotifications(mockNotifications)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  // Stats
  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.isRead).length
    const critical = notifications.filter(n => n.category === 'CRITICAL').length
    const today = notifications.filter(n => {
      const diffMs = Date.now() - new Date(n.createdAt).getTime()
      return diffMs < 24 * 60 * 60 * 1000
    }).length
    return { total, unread, critical, today }
  }, [notifications])

  // Filtered
  const filtered = useMemo(() => {
    let items = [...notifications]
    if (filterType !== 'ALL') items = items.filter(n => n.type === filterType)
    if (filterCategory !== 'ALL') items = items.filter(n => n.category === filterCategory)
    if (filterRead === 'READ') items = items.filter(n => n.isRead)
    if (filterRead === 'UNREAD') items = items.filter(n => !n.isRead)
    // Sort: unread first, then by date
    items.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return items
  }, [notifications, filterType, filterCategory, filterRead])

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    toast({ title: 'All notifications marked as read' })
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast({ title: 'Notification deleted' })
  }

  const handleAction = (notification: Notification) => {
    if (notification.actionSection) {
      setActiveSection(notification.actionSection)
    }
    if (!notification.isRead) {
      toggleRead(notification.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeSlide}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notifications Center
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Unified alerts for prescriptions, safety, recalls, and more
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={stats.unread === 0}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div {...fadeSlide} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BellOff className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Unread</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{stats.unread}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.today}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeSlide}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" /> Filters:
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRead} onValueChange={(v) => setFilterRead(v as typeof filterRead)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Read & Unread</SelectItem>
                  <SelectItem value="UNREAD">Unread Only</SelectItem>
                  <SelectItem value="READ">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification List */}
      <motion.div {...fadeSlide}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>
              {filtered.length} notification{filtered.length !== 1 ? 's' : ''} — {stats.unread} unread
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications match your filters.</p>
                </div>
              ) : (
                <div>
                  {filtered.map((notification, index) => {
                    const typeCfg = TYPE_CONFIG[notification.type]
                    const catCfg = CATEGORY_CONFIG[notification.category]
                    const TypeIcon = typeCfg.icon
                    const isExpanded = expandedId === notification.id

                    return (
                      <div key={notification.id}>
                        <div
                          className={`flex gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-primary/[0.03]' : ''
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : notification.id)}
                        >
                          {/* Type Icon */}
                          <div className={`mt-0.5 shrink-0 ${typeCfg.color}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium text-sm ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </span>
                                  <Badge className={`${catCfg.bg} ${catCfg.text} text-[10px] px-1.5 py-0 hover:${catCfg.bg}`}>
                                    {notification.category}
                                  </Badge>
                                  {!notification.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => toggleRead(notification.id)}
                              title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                            >
                              {notification.isRead ? <BellOff className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                              onClick={() => deleteNotification(notification.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pl-12">
                            <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                              <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                              {notification.patientName && (
                                <p className="text-xs text-muted-foreground">
                                  Patient: <span className="font-medium">{notification.patientName}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {typeCfg.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(notification.createdAt).toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                {notification.actionLabel && notification.actionSection && (
                                  <Button size="sm" onClick={() => handleAction(notification)}>
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    {notification.actionLabel}
                                  </Button>
                                )}
                                {!notification.isRead && (
                                  <Button variant="outline" size="sm" onClick={() => toggleRead(notification.id)}>
                                    <Check className="h-3.5 w-3.5 mr-1" /> Mark as Read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {index < filtered.length - 1 && <Separator />}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
