import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">404</h1>
      <p className="text-neutral-500 mt-2">Page not found.</p>
      <Link to="/" className="text-brand-600 hover:underline mt-4 inline-block">
        ← Back home
      </Link>
    </div>
  )
}
