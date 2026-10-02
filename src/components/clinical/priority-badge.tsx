'use client'

import { Badge } from '@/components/ui/badge'

type Priority = 'EMERGENCY' | 'URGENT' | 'ROUTINE'

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  EMERGENCY: {
    label: 'Emergency',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
  },
  ROUTINE: {
    label: 'Routine',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  },
}

interface PriorityBadgeProps {
  priority: Priority | string
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority as Priority] ?? {
    label: priority,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ''}`}>
      {config.label}
    </Badge>
  )
}
