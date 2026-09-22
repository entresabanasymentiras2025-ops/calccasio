import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/calculators', label: 'Calculators' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/compare', label: 'Compare' },
  { to: '/docs', label: 'Docs' },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
            CASIO Emulator Hub
          </Link>
          <nav className="flex gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md font-medium transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-neutral-500 space-y-2">
          <p>
            <strong>Independent project, not affiliated with, sponsored by, or endorsed by CASIO Computer Co., Ltd.</strong> CASIO and its product
            names are trademarks of their respective owners, used here solely to identify which calculator behavior is being emulated. All
            interfaces, icons, and code in this project are original and independently implemented.
          </p>
          <p>© {new Date().getFullYear()} CASIO Emulator Hub — an independent educational project.</p>
        </div>
      </footer>
    </div>
  )
}
