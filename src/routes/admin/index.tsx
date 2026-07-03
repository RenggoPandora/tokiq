import { createFileRoute, Link } from '@tanstack/react-router'
import {
  TrendingUp, Users, UserCheck, UserMinus, UserPlus,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { usePlatformStats, useMrrChart } from '@/hooks/use-admin'
import { formatRupiah } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats()
  const { data: mrrData, isLoading: mrrLoading } = useMrrChart(6)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan platform tokiq"
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              title="MRR"
              value={formatRupiah(stats?.mrr ?? 0)}
              subtitle="Monthly Recurring Revenue"
              icon={TrendingUp}
            />
            <MetricCard
              title="Aktif"
              value={stats?.activeSubscribers ?? 0}
              subtitle="Subscriber aktif"
              icon={UserCheck}
            />
            <MetricCard
              title="Trial"
              value={stats?.trialUsers ?? 0}
              subtitle="Dalam masa trial"
              icon={Users}
            />
            <MetricCard
              title="Baru Bulan Ini"
              value={stats?.newThisMonth ?? 0}
              subtitle="Pendaftar baru"
              icon={UserPlus}
            />
            <MetricCard
              title="Churn"
              value={stats?.churnedThisMonth ?? 0}
              subtitle="Tidak perpanjang"
              icon={UserMinus}
              variant={stats?.churnedThisMonth ? 'danger' : 'default'}
            />
          </>
        )}
      </div>

      {/* MRR Chart */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Revenue 6 Bulan Terakhir</p>
            <p className="text-xs text-muted-foreground">Total pembayaran terkonfirmasi per bulan</p>
          </div>
        </div>
        {mrrLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mrrData ?? []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}rb`
                    : String(v)
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

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Kelola Tenant', to: '/admin/tenants', desc: 'Lihat dan atur semua subscriber' },
          { label: 'Konfirmasi Pembayaran', to: '/admin/invoices', desc: 'Invoice yang menunggu konfirmasi' },
          { label: 'Kelola Paket', to: '/admin/plans', desc: 'Atur harga dan paket langganan' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  )
}
