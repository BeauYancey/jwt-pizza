import { test, expect } from 'playwright-test-coverage';
import { login } from './test-utils';

test('has title', async ({ page }) => {
  // Arrange + Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle('JWT Pizza');
});

test('register', async ({page}) => {
  // Arrange
  await page.route('*/**/api/auth', async (route) => {
    const regReq = {email: 'demo@test.com', password: 'testp@ssword', name: 'Demo User'}
    const regRes = {user: {id: 1, email: 'demo@test.com', name: 'Demo User', token: 'abc.def.ghi', roles: [{role: 'diner'}]}}
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toMatchObject(regReq)
    await route.fulfill({json: regRes})
  })

  // Act
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Full name').fill('Demo User');
  await page.getByPlaceholder('Email address').fill('demo@test.com');
  await page.getByPlaceholder('Password').fill('testp@ssword');
  await page.getByRole('button', {name: 'Register'}).click();

  // Assert
  await expect(page.getByRole('link', {name: 'DU'})).toBeVisible();
  await page.getByRole('link', { name: 'DU' }).click();
  await expect(page.getByText('Demo User')).toBeVisible();
  await expect(page.getByText('demo@test.com')).toBeVisible();
})

test('login', async ({page}) => {
  // Arrange
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = {email: 'demo@test.com', password: 'testp@ssword'}
    const loginRes = {user: {id: 1, email: 'demo@test.com', name: 'Demo User', token: 'abc.def.ghi', roles: [{role: 'diner'}]}}
    expect(route.request().method()).toBe('PUT')
    expect(route.request().postDataJSON()).toMatchObject(loginReq)
    await route.fulfill({json: loginRes})
  })

  // Act
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('demo@test.com');
  await page.getByPlaceholder('Password').fill('testp@ssword');
  await page.getByRole('button', {name: 'Login'}).click();

  // Assert
  await expect(page.getByRole('link', {name: 'DU'})).toBeVisible();
  await page.getByRole('link', { name: 'DU' }).click();
  await expect(page.getByText('Demo User')).toBeVisible();
  await expect(page.getByText('demo@test.com')).toBeVisible();
})

test('logout', async ({page}) => {
  // Arrange
  await login(page)
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      const logoutRes = {message: 'logout successful'}
      await route.fulfill({json: logoutRes})
    }
  })

  await page.getByRole('link', {name: 'Logout'}).click()

  // Assert
  await expect(page.getByRole('link', {name: 'Login'})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Register'})).toBeVisible();
  await expect(page.getByRole('link', {name: 'DU'})).not.toBeVisible();
})