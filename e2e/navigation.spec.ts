import { test, expect } from '@playwright/test'

test('home page shows hero and links to the catalog', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Calculadoras científicas y gráficas en tu navegador' })).toBeVisible()
  await expect(page.getByText('Your calculators. Anywhere.')).toBeVisible()
  await expect(page.getByRole('contentinfo').getByTestId('legal-notice')).toContainText('no afiliado')
  await page.getByRole('link', { name: 'Explorar calculadoras' }).click()
  await expect(page).toHaveURL(/\/calculators$/)
})

test('catalog search filters results and links to a direct calculator URL', async ({ page }) => {
  await page.goto('/calculators')
  await page.getByPlaceholder('Buscar calculadora...').fill('fx-991CW')
  await expect(page.getByRole('heading', { name: 'fx-991CW' })).toBeVisible()
  await page.getByRole('link', { name: 'Open' }).click()
  await expect(page).toHaveURL(/\/calculator\/fx-991cw$/)
})

test('fx-991EX shares the ClassWiz engine and is genuinely playable too', async ({ page }) => {
  await page.goto('/calculator/fx-991ex')
  await page.getByRole('button', { name: '6', exact: true }).click()
  await page.getByRole('button', { name: '×', exact: true }).click()
  await page.getByRole('button', { name: '7', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('= 42')
})

test('partial models label their unbuilt features as coming soon', async ({ page }) => {
  await page.goto('/calculator/fx-991cw')
  await expect(page.getByText('Spreadsheet — coming soon')).toBeVisible()
  await expect(page.getByText('🟡 Partial implementation')).toBeVisible()
})

test('catalog type filter is reflected in the URL', async ({ page }) => {
  await page.goto('/calculators')
  await page.getByRole('button', { name: 'Financiera' }).click()
  await expect(page).toHaveURL(/type=financial/)
  await expect(page.getByRole('heading', { name: 'FC-200V' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'fx-991CW' })).toHaveCount(0)
})

test('per-calculator SEO title', async ({ page }) => {
  await page.goto('/calculator/fx-cg50')
  await expect(page).toHaveTitle('fx-CG50 Emulator — Graphing Calculator Online | CASIO Emulator Hub')
})

test('unknown calculator id shows a not-found message', async ({ page }) => {
  await page.goto('/calculator/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Calculator not found' })).toBeVisible()
})

test('favorites page reflects starring a calculator from the catalog', async ({ page }) => {
  await page.goto('/calculators')
  await page.getByPlaceholder('Buscar calculadora...').fill('fx-991CW')
  await page.getByRole('button', { name: 'Add to favorites' }).click()

  await page.goto('/favorites')
  await expect(page.getByText('fx-991CW')).toBeVisible()
})

test('compare page shows a functional diff between two models', async ({ page }) => {
  await page.goto('/compare')
  await expect(page.getByRole('columnheader', { name: 'Feature' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Graphing', exact: true })).toBeVisible()
  await page.getByLabel('Calculator B').selectOption('fx-82ms')
  await expect(page).toHaveURL(/b=fx-82ms/)
})
