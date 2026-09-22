import { test, expect } from '@playwright/test'

test('home page shows hero and links to the catalog', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your calculators. Anywhere.' })).toBeVisible()
  await page.getByRole('link', { name: 'Explore calculators' }).click()
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

test('a planned (not yet implemented) calculator shows an honest "Coming soon" state', async ({ page }) => {
  await page.goto('/calculator/fx-9750giii')
  await expect(page.getByText('Coming soon')).toBeVisible()
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
  await expect(page.getByText('Feature')).toBeVisible()
  await expect(page.getByText('Graphing')).toBeVisible()
})
