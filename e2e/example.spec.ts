import { test, expect } from '@playwright/test';

test('has title and search form', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Biciregistro/);

  // Expect the main search form to be visible.
  const searchInput = page.getByPlaceholder('Ingresa el número de serie de la bici');
  await expect(searchInput).toBeVisible();
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');

  // Click the main login button in the header.
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  
  // Click the "Ciclista" option in the dropdown using its test ID.
  await page.getByTestId('login-cyclist').click();

  // Expect to be on the auth page in login mode.
  await expect(page).toHaveURL('/auth?mode=login');
  await expect(page.getByRole('heading', { name: 'Biciregistro' })).toBeVisible();
});
