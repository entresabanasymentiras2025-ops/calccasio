import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'lcd'
export type LcdPreset = 'classic' | 'blue' | 'amber' | 'contrast'

export const LCD_PRESETS: Record<LcdPreset, { label: string; bg: string; fg: string }> = {
  classic: { label: 'Classic green', bg: '#b7c9a8', fg: '#10190f' },
  blue: { label: 'Blue grey', bg: '#b9c6cf', fg: '#0d1620' },
  amber: { label: 'Amber', bg: '#e9d39a', fg: '#2a1c05' },
  contrast: { label: 'High contrast', bg: '#ffffff', fg: '#000000' },
}

interface PreferencesState {
  theme: Theme
  lcd: LcdPreset
  setTheme: (t: Theme) => void
  setLcd: (p: LcdPreset) => void
}

/** UI preferences (persisted in localStorage). Calculator state is persisted separately per model. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      lcd: 'classic',
      setTheme: (theme) => set({ theme }),
      setLcd: (lcd) => set({ lcd }),
    }),
    { name: 'casio-emulator-hub:preferences' },
  ),
)

export function applyPreferences(theme: Theme, lcd: LcdPreset): void {
  const root = document.documentElement
  root.dataset.theme = theme === 'lcd' ? 'light' : theme
  root.dataset.appearance = theme
  root.style.setProperty('--color-lcd-bg', LCD_PRESETS[lcd].bg)
  root.style.setProperty('--color-lcd-fg', LCD_PRESETS[lcd].fg)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : theme === 'lcd' ? LCD_PRESETS[lcd].bg : '#f5f6fa')
}
