import { test, expect } from 'playwright-test-coverage';

test('has title', async ({ page }) => {
  // Arrange + Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle('JWT Pizza');
});