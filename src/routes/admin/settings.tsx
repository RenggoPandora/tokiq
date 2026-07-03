import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Pengaturan Admin"
        description="Konfigurasi platform tokiq"
      />
      <EmptyState
        icon={Settings}
        title="Belum ada pengaturan"
        description="Implementasi penuh akan tersedia di Phase berikutnya."
      />
    </div>
  )
}
