import { Routes, Route } from 'react-router-dom'
import { Layout } from './ui/components/Layout'
import { HomePage } from './ui/pages/HomePage'
import { CatalogPage } from './ui/pages/CatalogPage'
import { CalculatorPage } from './ui/pages/CalculatorPage'
import { FavoritesPage } from './ui/pages/FavoritesPage'
import { ComparePage } from './ui/pages/ComparePage'
import { DocsPage } from './ui/pages/DocsPage'
import { NotFoundPage } from './ui/pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculators" element={<CatalogPage />} />
        <Route path="/calculator/:id" element={<CalculatorPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
