import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlatformStats, useMrrChart } from '@/hooks/use-admin'
import { formatRupiah } from '@/lib/utils'
import { TrendingUp, Users, UserPlus, UserMinus } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsPage,
})

function AdminReportsPage() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats()
  const { data: mrr6, isLoading: mrr6Loading } = useMrrChart(6)
  const { data: mrr12, isLoading: mrr12Loading } = useMrrChart(12)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Laporan Platform"
        description="Pertumbuhan revenue dan subscriber"
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              title="MRR Saat Ini"
              value={formatRupiah(stats?.mrr ?? 0)}
              subtitle="Estimasi revenue bulanan"
              icon={TrendingUp}
            />
            <MetricCard
              title="Subscriber Aktif"
              value={stats?.activeSubscribers ?? 0}
              subtitle="Tenant status aktif"
              icon={Users}
            />
            <MetricCard
              title="Baru Bulan Ini"
              value={stats?.newThisMonth ?? 0}
              subtitle="Pendaftar bulan ini"
              icon={UserPlus}
            />
            <MetricCard
              title="Churn Bulan Ini"
              value={stats?.churnedThisMonth ?? 0}
              subtitle="Tidak perpanjang"
              icon={UserMinus}
              variant={stats?.churnedThisMonth ? 'danger' : 'default'}
            />
          </>
        )}
      </div>

      {/* Revenue Area Chart — 6 bulan */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">Revenue 6 Bulan Terakhir</p>
          <p className="text-xs text-muted-foreground">Total pembayaran terkonfirmasi</p>
        </div>
        {mrr6Loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrr6 ?? []}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : `${(v / 1_000).toFixed(0)}rb`
                }
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatRupiah(Number(value ?? 0)), 'Revenue']}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#mrrGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue Bar Chart — 12 bulan */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">Revenue 12 Bulan Terakhir</p>
          <p className="text-xs text-muted-foreground">Perbandingan antar bulan</p>
        </div>
        {mrr12Loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mrr12 ?? []} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : `${(v / 1_000).toFixed(0)}rb`
                }
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatRupiah(Number(value ?? 0)), 'Revenue']}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Bar dataKey="mrr" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
