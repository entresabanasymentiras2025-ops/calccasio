import { test, expect, type Page } from '@playwright/test'

const press = async (page: Page, ...labels: string[]) => {
  for (const l of labels) await page.getByRole('button', { name: l, exact: true }).click()
}

test('fx-991ES PLUS: numbered MODE menu and exact fractions', async ({ page }) => {
  await page.goto('/calculator/fx-991es-plus')
  await press(page, '1', '÷', '3', '+', '1', '÷', '6', '=')
  await expect(page.getByRole('status')).toContainText('= 1/2')
  await press(page, 'MODE')
  await expect(page.getByRole('status')).toContainText('1:COMP')
})

test('fx-991MS: SD statistics with DT entry', async ({ page }) => {
  await page.goto('/calculator/fx-991ms')
  await press(page, 'MODE', 'MODE', '1')
  for (const v of ['2', '4', '9']) await press(page, v, 'M+')
  await expect(page.getByRole('status')).toContainText('n= 3')
  await press(page, 'SHIFT', 'S-VAR', '1')
  await expect(page.getByRole('status')).toContainText('= 5')
})

test('fx-9860GIII: main menu → GRAPH → DRAW renders a plot', async ({ page }) => {
  await page.goto('/calculator/fx-9860giii')
  await expect(page.getByTestId('screen-text')).toContainText('GRAPH')
  await press(page, '3')
  await expect(page.getByTestId('screen-text')).toContainText('Y1=X²-2')
  await press(page, 'F6')
  await expect(page.getByTestId('screen-text')).toContainText('Graph Y1, Y2')
  await press(page, 'F5', 'F1')
  await expect(page.getByTestId('screen-text')).toContainText('X=-1.414213562')
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-native-width', '128')
})

test('fx-9860GIII: RUN-MAT calculation', async ({ page }) => {
  await page.goto('/calculator/fx-9860giii')
  await press(page, '1', '1', '2', '×', '3', 'EXE')
  await expect(page.getByTestId('screen-text')).toContainText('36')
})

test('fx-CG50: colour screen and program run with INPUT', async ({ page }) => {
  await page.goto('/calculator/fx-cg50')
  await expect(page.locator('canvas')).toHaveAttribute('data-native-width', '384')
  await press(page, '6', 'F1')
  await expect(page.getByTestId('screen-text')).toContainText('N')
  await press(page, '4', 'EXE')
  await expect(page.getByTestId('screen-text')).toContainText('SUM= 30')
})

test('fx-CG100: TOOLS menu instead of F-keys', async ({ page }) => {
  await page.goto('/calculator/fx-cg100')
  await expect(page.getByRole('button', { name: 'F1', exact: true })).toHaveCount(0)
  await press(page, '3', 'TOOLS')
  await expect(page.getByTestId('screen-text')).toContainText('DRAW')
  await press(page, 'OK')
  await expect(page.getByTestId('screen-text')).toContainText('Graph Y1, Y2')
})

test('fx-CP400: CAS factor and solve from the touch UI', async ({ page }) => {
  await page.goto('/calculator/fx-cp400')
  const input = page.getByLabel('Input')
  await input.fill('x^2-5x+6')
  await page.getByRole('button', { name: 'factor', exact: true }).click()
  await expect(page.getByRole('log')).toContainText('(x-2)(x-3)')
  await input.fill('solve(x^2-2=0,x)')
  await input.press('Enter')
  await expect(page.getByRole('log')).toContainText('{x=-√(2), x=√(2)}')
  await page.getByRole('tab', { name: 'Graph' }).click()
  await expect(page.getByTestId('screen-text')).toContainText('Graph y1, y2')
})

test('FC-200V: compound interest SOLVE', async ({ page }) => {
  await page.goto('/calculator/fc-200v')
  await press(page, 'CMPD', '▼')
  await press(page, '3', '6', '0', 'EXE', '6', 'EXE', '2', '0', '0', '0', '0', '0', 'EXE', 'SOLVE')
  await expect(page.getByRole('status')).toContainText('PMT=-1199.10105031')
})

test('per-model memory is isolated between calculators', async ({ page }) => {
  await page.goto('/calculator/fx-991cw')
  await press(page, '7', '=', 'M+')
  await page.goto('/calculator/fx-991ex')
  await press(page, 'MR', '=')
  await expect(page.getByRole('status')).toContainText('= 0')
})

test('dark theme and fullscreen toggle', async ({ page }) => {
  await page.goto('/calculator/fx-991cw')
  await page.getByLabel('Theme').selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Fullscreen' }).click()
  await expect(page.locator('[data-fullscreen]')).toBeVisible()
  await press(page, '2', '+', '2', '=')
  await expect(page.getByRole('status')).toContainText('= 4')
})

test('PWA manifest and service worker are served', async ({ page, request }) => {
  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  expect((await manifest.json()).name).toBe('CASIO Emulator Hub')
  expect((await request.get('/sw.js')).ok()).toBe(true)
  const precache = await (await request.get('/precache-manifest.json')).json()
  expect(precache.some((f: string) => f.includes('ClassPadEngine'))).toBe(true)
  await page.goto('/')
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()))).toBe(true)
})

test('dev inspector is hidden in production unless opted in', async ({ page }) => {
  await page.goto('/dev/calculator-inspector')
  await expect(page.getByRole('heading', { name: 'Not available' })).toBeVisible()
  await page.goto('/dev/calculator-inspector?dev=1')
  await expect(page.getByRole('heading', { name: 'Calculator inspector' })).toBeVisible()
})
