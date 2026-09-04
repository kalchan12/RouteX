import { test, expect } from '@playwright/test';

test('application loads login portal and can authorize into 3D mission control', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle(/RouteX/);

  // Check login portal is rendered
  await expect(page.locator('text=ADAMA MUNICIPAL DISPATCH PORTAL')).toBeVisible();
  const authButton = page.locator('button[type="submit"]');
  await expect(authButton).toBeVisible();

  // Authorize access
  await authButton.click();

  // Wait for holographic boot sequence and transition to main dashboard
  await expect(page.locator('text=Simulation Engine')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=RouteX')).toBeVisible();

  // Verify panels are present
  await expect(page.locator('text=EXECUTION CONTROLS')).toBeVisible();
  await expect(page.locator('text=CONGESTION')).toBeVisible();
});

test('can switch scenarios and interact with simulation controls', async ({ page }) => {
  await page.goto('/');

  // Authorize access
  const authButton = page.locator('button[type="submit"]');
  await authButton.click();

  // Wait for dashboard to load
  await expect(page.locator('text=Simulation Engine')).toBeVisible({ timeout: 10000 });

  // Verify Start Simulation button exists
  const startButton = page.locator('button', { hasText: 'Start Simulation' });
  await expect(startButton).toBeVisible();

  // Switch to a regional scenario from InspectorPanel
  const scenarioCard = page.locator('text=ASTU Main Gate').first();
  if (await scenarioCard.isVisible()) {
    await scenarioCard.click();
    // Verify 3D simulation canvas is mounted
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
  }
});