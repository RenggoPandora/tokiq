import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ShoppingCart, TrendingUp, Package, AlertCircle,
  ArrowRight, Plus,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  useTodaySummary, useSalesLast7Days,
  useLowStockCount, useActiveProductCount,
} from '@/hooks/use-tenant-dashboard'
import { formatRupiah } from '@/lib/utils'

export const Route = createFileRoute('/app/dashboard')({
  component: TenantDashboardPage,
})

function TenantDashboardPage() {
  const { data: today, isLoading: todayLoading } = useTodaySummary()
  const { data: sales7, isLoading: sales7Loading } = useSalesLast7Days()
  const { data: lowStockCount, isLoading: lowStockLoading } = useLowStockCount()
  const { data: productCount, isLoading: productLoading } = useActiveProductCount()

  const metricsLoading = todayLoading || lowStockLoading || productLoading

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description="Performa bisnis kamu hari ini"
        action={
          <Link to="/app/pos">
            <Button size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buka Kasir
            </Button>
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              title="Omzet Hari Ini"
              value={formatRupiah(today?.totalRevenue ?? 0)}
              subtitle="Total penjualan hari ini"
              icon={TrendingUp}
            />
            <MetricCard
              title="Transaksi"
              value={today?.totalTransactions ?? 0}
              subtitle="Jumlah transaksi hari ini"
              icon={ShoppingCart}
            />
            <MetricCard
              title="Produk Aktif"
              value={productCount ?? 0}
              subtitle="Produk yang tersedia"
              icon={Package}
            />
            <MetricCard
              title="Stok Menipis"
              value={lowStockCount ?? 0}
              subtitle="Produk perlu restock"
              icon={AlertCircle}
              variant={(lowStockCount ?? 0) > 0 ? 'warning' : 'default'}
            />
          </>
        )}
      </div>

      {/* Sales chart */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Penjualan 7 Hari Terakhir</p>
            <p className="text-xs text-muted-foreground">Total omzet harian</p>
          </div>
        </div>
        {sales7Loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sales7 ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
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
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Tambah Produk',
            to: '/app/products',
            desc: 'Kelola katalog produk toko',
            icon: Plus,
          },
          {
            label: 'Lihat Laporan',
            to: '/app/reports',
            desc: 'Laporan penjualan & keuangan',
            icon: TrendingUp,
          },
          {
            label: 'Cek Stok',
            to: '/app/stock',
            desc: 'Pantau dan update stok barang',
            icon: Package,
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
