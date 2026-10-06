import { test, expect } from '@playwright/test'

test('history panel records past calculations and can reuse one', async ({ page }) => {
  await page.goto('/calculator/fx-991cw')
  await page.getByRole('button', { name: '8', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('= 8')

  await page.getByRole('button', { name: 'History', exact: true }).click()
  const history = page.getByRole('region', { name: 'History' })
  await expect(history).toContainText('= 8')

  await history.getByRole('button', { name: 'Repeat 8' }).click()
  await expect(page.getByRole('status')).toContainText('8')
  await history.getByRole('button', { name: 'Clear history' }).click()
  await expect(history).toContainText('No calculations yet.')
})

test('calculator is usable at a mobile viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/calculator/fx-991cw')
  await expect(page.getByRole('status')).toBeVisible()

  await page.getByRole('button', { name: '7', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('= 7')

  const box = await page.locator('[data-keyboard-grid]').boundingBox()
  expect(box?.width).toBeLessThanOrEqual(390)
})

test('no uncaught page errors while using the calculator', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('/calculator/fx-991cw')
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '÷', exact: true }).click()
  await page.getByRole('button', { name: '0', exact: true }).click()
  await page.getByRole('button', { name: '=', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Math ERROR')
  expect(errors).toEqual([])
})
