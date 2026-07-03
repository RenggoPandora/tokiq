import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  TrendingUp, ShoppingCart, Tag, Award, Download,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSalesReport, useTopProducts } from '@/hooks/use-reports'
import { exportToExcel } from '@/lib/excel'
import { formatRupiah, formatDate } from '@/lib/utils'

export const Route = createFileRoute('/app/reports')({
  component: ReportsPage,
})

type RangeKey = '7d' | '30d' | '90d'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '90d', label: '90 Hari' },
]

function getDateRange(key: RangeKey): { start: string; end: string } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return { start: start.toISOString(), end: end.toISOString() }
}

function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const { start, end } = getDateRange(range)

  const { data: report, isLoading: reportLoading } = useSalesReport(start, end)
  const { data: topProducts, isLoading: topLoading } = useTopProducts(start, end)

  function handleExport() {
    if (!report?.daily?.length) return
    exportToExcel(
      report.daily.map((d) => ({
        Tanggal: d.date,
        'Total Omzet': d.total_revenue,
        'Jumlah Transaksi': d.transaction_count,
        'Total Diskon': d.total_discount,
      })),
      `laporan-penjualan-${range}-${new Date().toISOString().slice(0, 10)}`,
      'Laporan Penjualan'
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Laporan"
        description="Analisa performa penjualan bisnis kamu"
        action={
          <div className="flex gap-2">
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <Button
                  key={r.key}
                  size="sm"
                  variant={range === r.key ? 'default' : 'outline'}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={!report?.daily?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              title="Total Omzet"
              value={formatRupiah(report?.totalRevenue ?? 0)}
              subtitle={`${range === '7d' ? '7' : range === '30d' ? '30' : '90'} hari terakhir`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Total Transaksi"
              value={report?.totalTransactions ?? 0}
              subtitle="Transaksi selesai"
              icon={ShoppingCart}
            />
            <MetricCard
              title="Rata-rata Transaksi"
              value={formatRupiah(report?.avgOrderValue ?? 0)}
              subtitle="Per transaksi"
              icon={Award}
            />
            <MetricCard
              title="Total Diskon"
              value={formatRupiah(report?.totalDiscount ?? 0)}
              subtitle="Diskon diberikan"
              icon={Tag}
            />
          </>
        )}
      </div>

      {/* Sales chart */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">Omzet Harian</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(start, 'dd MMM')} – {formatDate(end, 'dd MMM yyyy')}
          </p>
        </div>
        {reportLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report?.daily ?? []} barSize={range === '90d' ? 6 : 16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                interval={range === '7d' ? 0 : range === '30d' ? 4 : 9}
              />
              <YAxis
                tickFormatter={(v) =>
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
                formatter={(value) => [formatRupiah(Number(value ?? 0)), 'Omzet']}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Bar dataKey="total_revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <p className="text-sm font-medium text-foreground mb-4">Produk Terlaris</p>
        {topLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (topProducts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data transaksi dalam periode ini.
          </p>
        ) : (
          <div className="space-y-2">
            {(topProducts ?? []).map((p, i) => {
              const maxQty = topProducts?.[0]?.quantity_sold ?? 1
              const pct = Math.round((p.quantity_sold / maxQty) * 100)
              return (
                <div key={p.product_id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="text-sm font-medium truncate">{p.product_name}</p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {p.quantity_sold} terjual
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground shrink-0 w-24 text-right">
                    {formatRupiah(p.revenue)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
