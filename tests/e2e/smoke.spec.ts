import { test, expect } from '@playwright/test';

test('application loads and simulation can start', async ({ page }) => {
  await page.goto('/');
  
  // Check page title
  await expect(page).toHaveTitle(/RouteX/);
  
  // Check header
  await expect(page.locator('h1')).toContainText('RouteX');
  
  // Check scenario selector is visible
  await expect(page.locator('select')).toBeVisible();
  
  // Check canvas container exists
  await expect(page.locator('.canvas-container')).toBeVisible();
  
  // Check controls are present
  await expect(page.locator('text=Controls')).toBeVisible();
  
  // Check metrics panel
  await expect(page.locator('text=Metrics')).toBeVisible();
});

test('can select different scenarios', async ({ page }) => {
  await page.goto('/');
  
  const select = page.locator('select');
  
  // Get all options
  const options = await select.locator('option').allTextContents();
  expect(options.length).toBeGreaterThan(1);
  
  // Select rush hour
  await select.selectOption('rush_hour');
  await expect(select).toHaveValue('rush_hour');
});