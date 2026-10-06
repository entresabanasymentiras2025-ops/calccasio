import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { usePreferences, applyPreferences, LCD_PRESETS, type Theme, type LcdPreset } from '../../storage/preferencesStore'
import { LegalNotice } from './LegalNotice'

const navItems = [
  { to: '/calculators', label: 'Calculators' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/compare', label: 'Compare' },
  { to: '/docs', label: 'Docs' },
]

function Logo() {
  // Original mark: a rounded keypad glyph. Not derived from any manufacturer logo.
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-brand-600">
      <rect x="3" y="2" width="18" height="20" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="6" y="5" width="12" height="4" rx="1" fill="currentColor" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={8 + c * 4} cy={13 + r * 3} r="1.1" fill="currentColor" />))}
    </svg>
  )
}

export function Layout() {
  const { theme, lcd, setTheme, setLcd } = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => applyPreferences(theme, lcd), [theme, lcd])

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-black px-3 py-1 rounded z-50">
        Skip to content
      </a>
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
            <Logo />
            <span>CASIO Emulator Hub</span>
          </Link>
          <button type="button" className="sm:hidden px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-sm" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((v) => !v)}>
            Menu
          </button>
          <nav id="main-nav" className={`${menuOpen ? 'flex' : 'hidden'} sm:flex absolute sm:static top-14 inset-x-0 sm:inset-auto flex-col sm:flex-row gap-1 text-sm bg-white dark:bg-neutral-950 sm:bg-transparent p-3 sm:p-0 border-b sm:border-0 border-neutral-200 dark:border-neutral-800`} aria-label="Main">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <label className="flex items-center gap-1 px-2 text-xs text-neutral-500">
              <span className="sr-only">Theme</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1 py-1" aria-label="Theme">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="lcd">Calculator LCD</option>
              </select>
            </label>
            <label className="flex items-center gap-1 px-2 text-xs text-neutral-500">
              <span className="sr-only">LCD colours</span>
              <select value={lcd} onChange={(e) => setLcd(e.target.value as LcdPreset)} className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1 py-1" aria-label="LCD colours">
                {(Object.keys(LCD_PRESETS) as LcdPreset[]).map((p) => (
                  <option key={p} value={p}>
                    LCD: {LCD_PRESETS[p].label}
                  </option>
                ))}
              </select>
            </label>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-neutral-500 space-y-2">
          <LegalNotice />
          <p>All interfaces, icons and code in this project are original and independently implemented. © {new Date().getFullYear()} CASIO Emulator Hub — an independent educational project.</p>
        </div>
      </footer>
    </div>
  )
}
