'use client'

import { Badge } from '@/components/ui/badge'
import type { Modality } from '@/lib/store'

const modalityConfig: Record<Modality, { label: string; className: string }> = {
  ALLOPATHY: {
    label: 'Allopathy',
    className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
  },
  AYURVEDA: {
    label: 'Ayurveda',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700',
  },
  HOMEOPATHY: {
    label: 'Homeopathy',
    className: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-700',
  },
}

interface ModalityBadgeProps {
  modality: Modality | string
  className?: string
}

export function ModalityBadge({ modality, className }: ModalityBadgeProps) {
  const config = modalityConfig[modality as Modality] ?? {
    label: modality,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ''}`}>
      {config.label}
    </Badge>
  )
}
