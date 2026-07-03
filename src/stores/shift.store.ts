import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shift } from '@/types/app.types'

interface ShiftStore {
  activeShift: Shift | null
  openShift: (shift: Shift) => void
  closeShift: () => void
}

export const useShiftStore = create<ShiftStore>()(
  persist(
    (set) => ({
      activeShift: null,
      openShift: (shift) => set({ activeShift: shift }),
      closeShift: () => set({ activeShift: null }),
    }),
    { name: 'tokiq-shift' }
  )
)
