import { Link } from 'react-router-dom'
import { calculatorCatalog } from '../../models/calculatorCatalog'
import { useFavoritesStore } from '../../storage/favoritesStore'
import { CalculatorCard } from '../components/CalculatorCard'

export function FavoritesPage() {
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const favorites = calculatorCatalog.filter((c) => favoriteIds.includes(c.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Favorites</h1>
      {favorites.length === 0 ? (
        <p className="text-neutral-500 mt-4">
          No favorites yet. Star a calculator from the{' '}
          <Link to="/calculators" className="text-brand-600 hover:underline">
            catalog
          </Link>{' '}
          to save it here.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((c) => (
            <CalculatorCard key={c.id} config={c} />
          ))}
        </div>
      )}
    </div>
  )
}
