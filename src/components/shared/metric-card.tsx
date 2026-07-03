import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const trendPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'border border-border rounded-lg p-5 bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            {title}
          </p>
          <p
            className={cn(
              'text-2xl font-bold font-mono tabular-nums leading-none',
              variant === 'success' && 'text-[var(--success)]',
              variant === 'warning' && 'text-[var(--warning)]',
              variant === 'danger' && 'text-destructive',
              variant === 'default' && 'text-foreground'
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-border">
          <span
            className={cn(
              'text-xs font-medium',
              trendPositive ? 'text-[var(--success)]' : 'text-destructive'
            )}
          >
            {trendPositive ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
