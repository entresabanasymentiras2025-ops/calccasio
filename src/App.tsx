import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './ui/components/Layout'
import { HomePage } from './ui/pages/HomePage'

// Route-level code splitting: only the home page ships in the entry chunk.
const CatalogPage = lazy(() => import('./ui/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })))
const CalculatorPage = lazy(() => import('./ui/pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })))
const FavoritesPage = lazy(() => import('./ui/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const ComparePage = lazy(() => import('./ui/pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const DocsPage = lazy(() => import('./ui/pages/DocsPage').then((m) => ({ default: m.DocsPage })))
const DevInspectorPage = lazy(() => import('./ui/pages/DevInspectorPage').then((m) => ({ default: m.DevInspectorPage })))
const NotFoundPage = lazy(() => import('./ui/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

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
          <Route path="/dev/calculator-inspector" element={<DevInspectorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
  )
}

export default App
