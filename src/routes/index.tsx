import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BarChart3, ShoppingCart, Package, Users, Star, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">tokiq</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#fitur" className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-foreground transition-colors">Harga</a>
            <a href="#tentang" className="hover:text-foreground transition-colors">Tentang</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Masuk
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Coba Gratis
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-border">
          <Star className="w-3 h-3" />
          <span>Trial gratis 14 hari — tanpa kartu kredit</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
          Sistem POS untuk{' '}
          <span className="text-muted-foreground">UMKM Indonesia</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Kelola kasir, stok, laporan, dan bisnis kamu dalam satu platform. 
          Mulai dalam 5 menit, bukan 5 hari.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#fitur"
            className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-md hover:bg-muted transition-colors text-sm"
          >
            Lihat Fitur
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Semua yang kamu butuhkan</h2>
          <p className="text-muted-foreground">Satu akun, semua fitur. Tidak ada biaya tambahan.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border border-border rounded-lg p-5 hover:shadow-sm transition-shadow bg-card"
            >
              <div className="w-9 h-9 bg-muted rounded-md flex items-center justify-center mb-3">
                <feature.icon className="w-4.5 h-4.5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="bg-muted/50 border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Harga yang transparan</h2>
          <p className="text-muted-foreground mb-10">Tidak ada biaya tersembunyi, tidak ada kejutan.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="flex-1 border border-border bg-card rounded-lg p-6 text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Starter</p>
              <p className="text-3xl font-bold text-foreground mb-1">Rp 149.000</p>
              <p className="text-xs text-muted-foreground mb-4">/bulan</p>
              <ul className="space-y-2 mb-6">
                {['1 cabang', '3 kasir', 'Semua fitur POS', 'Laporan dasar'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="block text-center text-sm font-medium border border-border rounded-md py-2 hover:bg-muted transition-colors">
                Mulai Trial
              </a>
            </div>
            <div className="flex-1 border-2 border-primary bg-card rounded-lg p-6 text-left relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Populer
              </span>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pro</p>
              <p className="text-3xl font-bold text-foreground mb-1">Rp 299.000</p>
              <p className="text-xs text-muted-foreground mb-4">/bulan</p>
              <ul className="space-y-2 mb-6">
                {['Cabang tak terbatas', 'Staff tak terbatas', 'Semua fitur POS', 'Laporan lengkap', 'Export Excel & PDF', 'Multi-kasir & shift'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="block text-center text-sm font-medium bg-primary text-primary-foreground rounded-md py-2 hover:opacity-90 transition-opacity">
                Mulai Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <ShoppingCart className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">tokiq</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 tokiq. POS untuk UMKM Indonesia.
        </p>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'Kasir (POS)',
    description: 'Transaksi cepat dengan barcode, QRIS, tunai. Bisa offline saat internet mati.',
  },
  {
    icon: Package,
    title: 'Manajemen Stok',
    description: 'Stok real-time, stok opname, pembelian supplier, dan notifikasi stok menipis.',
  },
  {
    icon: BarChart3,
    title: 'Laporan Lengkap',
    description: 'Laporan penjualan, laba rugi, stok, dan kinerja kasir. Export ke Excel & PDF.',
  },
  {
    icon: Users,
    title: 'Multi-Staff',
    description: 'Kelola kasir, manajer, dan staf gudang dengan hak akses berbeda per role.',
  },
  {
    icon: Star,
    title: 'Program Poin',
    description: 'Loyalitas pelanggan dengan sistem poin yang bisa ditukar diskon.',
  },
  {
    icon: CheckCircle,
    title: 'Multi-Cabang',
    description: 'Kelola beberapa cabang dalam satu akun dengan laporan terpisah per cabang.',
  },
]
