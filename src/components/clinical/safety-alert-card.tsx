'use client'

import { AlertTriangle, AlertCircle, Info, Siren } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SafetySeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'

const severityConfig: Record<SafetySeverity, {
  icon: React.ElementType
  className: string
  badgeClassName: string
  iconClassName: string
}> = {
  EMERGENCY: {
    icon: Siren,
    className: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950',
    badgeClassName: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  CRITICAL: {
    icon: AlertTriangle,
    className: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50',
    badgeClassName: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    iconClassName: 'text-red-500 dark:text-red-400',
  },
  WARNING: {
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50',
    badgeClassName: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    iconClassName: 'text-amber-500 dark:text-amber-400',
  },
  INFO: {
    icon: Info,
    className: 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/50',
    badgeClassName: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    iconClassName: 'text-teal-500 dark:text-teal-400',
  },
}

interface SafetyAlertCardProps {
  id: string
  type: string
  severity: SafetySeverity | string
  message: string
  source: string
  status: string
  createdAt: string
  onAcknowledge?: (id: string) => void
}

export function SafetyAlertCard({
  id,
  type,
  severity,
  message,
  source,
  status,
  createdAt,
  onAcknowledge,
}: SafetyAlertCardProps) {
  const config = severityConfig[severity as SafetySeverity] ?? severityConfig.WARNING
  const Icon = config.icon

  return (
    <Card className={`${config.className} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconClassName}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.badgeClassName}>
                {severity}
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                {type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {source}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">{message}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(createdAt).toLocaleString()}
              </span>
              {status === 'ACTIVE' && onAcknowledge && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledge(id)}
                  className="h-7 text-xs"
                >
                  Acknowledge
                </Button>
              )}
              {status === 'ACKNOWLEDGED' && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                  Acknowledged
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
