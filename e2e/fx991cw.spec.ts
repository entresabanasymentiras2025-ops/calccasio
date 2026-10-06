import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/calculator/fx-991cw')
})

test('opens fx-991CW and evaluates 2 + 2 = 4', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'fx-991CW' })).toBeVisible()
  const display = page.getByRole('status')

  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '+', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()

  await expect(display).toContainText('= 4')
})

test('SHIFT + sin inserts the inverse sine secondary function', async ({ page }) => {
  const display = page.getByRole('status')

  await page.getByRole('button', { name: 'SHIFT', exact: true }).click()
  await page.getByRole('button', { name: 'sin⁻¹', exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: ')', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()

  await expect(display).toContainText('= 90')
})

test('expression state persists across a reload', async ({ page }) => {
  await page.getByRole('button', { name: '4', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('42')

  await page.reload()

  await expect(page.getByRole('status')).toContainText('42')
})

test('physical keyboard drives the calculator', async ({ page }) => {
  await expect(page.getByRole('status')).toBeVisible()
  await page.keyboard.press('3')
  await page.keyboard.press('+')
  await page.keyboard.press('4')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('status')).toContainText('= 7')
})

test('memory M+ / MR round-trip', async ({ page }) => {
  await page.getByRole('button', { name: '5', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await page.getByRole('button', { name: 'M+', exact: true }).click()

  await page.getByRole('button', { name: 'MR', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()

  await expect(page.getByRole('status')).toContainText('= 5')
})

test('HOME opens a real mode menu; a planned mode shows a clear message', async ({ page }) => {
  await page.getByRole('button', { name: 'HOME', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Calculate')

  await page.getByRole('button', { name: '▲', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()

  await expect(page.getByRole('status')).toContainText('not implemented')
})

test('change mode, leave, come back: the mode persists', async ({ page }) => {
  await page.getByRole('button', { name: 'HOME', exact: true }).click()
  await page.getByRole('button', { name: '▼', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.getByTestId('current-mode')).toHaveText('STAT')

  await page.goto('/calculators')
  await page.goto('/calculator/fx-991cw')
  await expect(page.getByTestId('current-mode')).toHaveText('STAT')
  await expect(page.getByRole('status')).toContainText('1-Variable')
})

test('EQUATION mode solves a quadratic through the keypad', async ({ page }) => {
  await page.getByRole('button', { name: 'HOME', exact: true }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '▼', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click() // Polynomial
  await page.getByRole('button', { name: '1', exact: true }).click() // degree 2
  for (const k of ['1', '=', '(−)', '5', '=', '6', '=']) await page.getByRole('button', { name: k, exact: true }).click()
  await expect(page.getByRole('status')).toContainText('x1=3')
  await expect(page.getByRole('status')).toContainText('x2=2')
})

test('reset clears the display back to 0', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('0')
})
