import { test, expect } from 'playwright-test-coverage';
import { login, loginAdmin, loginFranchisee } from './test-utils';

test('has title', async ({ page }) => {
  // Arrange + Act
  await page.goto('/');

  // Assert
  await expect(page).toHaveTitle('JWT Pizza');
});

test.describe('user', () => {
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
    await page.route('*/**/api/order', async (route) => {
      const orderRes = {orders: [{id: 1, items: [{price: .001}, {price: .002}], date: '2024-10-08'}]}
      expect(route.request().method()).toBe('GET')
      await route.fulfill({json: orderRes})
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
    await expect(page.getByRole('table')).toContainText('Date')
    await expect(page.getByRole('table')).toContainText('0.003')
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
})

test('order pizzas', async ({page}) => {
  // Arrange
  await login(page)
  await page.route('*/**/api/order/menu', async (route) => {
    if (route.request().method() == 'GET') {
      const menuRes = [{
        "id": 1,
        "title": "Pepperoni",
        "image": "pizza2.png",
        "price": 0.0042,
        "description": "Spicy treat"
      }]
      await route.fulfill({json: menuRes})
    }
  });
  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() == 'POST') {
      const orderReq = {
        "items": [
          {menuId: 1, description: 'Pepperoni', price: 0.0042}
        ],
        "storeId": '1',
        "franchiseId": 1
      }
      const orderRes = {
        "order": {...orderReq, "id": 1},
        jwt: "abc.def.ghi"
      }
      expect(route.request().postDataJSON()).toMatchObject(orderReq)
      await route.fulfill({json: orderRes})
    }
  })
  await page.route('*/**/api/franchise', async (route) => {
    if (route.request().method() == 'GET') {
      const frachiseRes = [{
        "id": 1,
        "name": "SuperPie",
        "stores": [
          {
            "id": 1,
            "name": "Orem"
          }
        ]
      }]
      await route.fulfill({json: frachiseRes})
    }
  });

  // Act - Select Pizzas
  await page.goto('/')
  await page.getByRole('link', {name: 'Order'}).click();
  await page.getByRole('button', {name: 'Pepperoni'}).click();

  // Assert - Select Pizzas
  await expect(page.getByText('Selected pizzas')).toBeVisible();
  await expect(page.getByText('Selected pizzas')).toContainText('1');

  // Act - Checkout
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('button', {name: 'Checkout'}).click();

  // Assert - Checkout
  await expect(page.getByRole('button', {name: 'Pay now'})).toBeVisible()
  await expect(page.getByRole('table')).toContainText('1 pie')
  await expect(page.getByRole('table')).toContainText('0.004')

  // Act - Payment
  await page.getByRole('button', {name: 'Pay now'}).click()

  // Assert - Payment
  await expect(page.getByText('Here is your JWT Pizza')).toBeVisible();
  await expect(page.getByText('abc.def.ghi')).toBeVisible();
})

test.describe('footer navigation', () => {
  test('franchise', async ({page}) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.getByRole('link', {name: 'franchise'}).click()

    await expect(page.getByRole('heading', {name: 'So you want'})).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Unleash'})).toBeVisible()
  })

  test('about', async ({page}) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.getByRole('link', {name: 'about'}).click()

    await expect(page.getByRole('heading', {name: 'secret sauce'})).toBeVisible()
    await expect(page.getByRole('heading', {name: 'employees'})).toBeVisible()
  })

  test('history', async ({page}) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.getByRole('link', {name: 'history'}).click()

    await expect(page.getByRole('heading', {name: 'Mama Rucci'})).toBeVisible()
  })
})

test.describe('franchise', () => {
  test('login franchisee', async ({page}) => {
    await loginFranchisee(page);
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

    await expect(page.getByRole('heading', {name: 'Test Franchise'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Create Store'})).toBeVisible()

    await page.getByRole('link', { name: 'DU' }).click();
    await expect(page.getByText('Franchisee on 1')).toBeVisible()
  })

  test('create store', async ({page}) => {
    await loginFranchisee(page);
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await page.getByRole('button', {name: 'Create Store'}).click()
    await page.getByPlaceholder('store name').fill('Test Store')

    await page.route('*/**/api/franchise/1/store', async (route) => {
      if (route.request().method() == 'POST') {
        const franRes = {id:1,franchiseId:1,name:"Test Store"}
        await route.fulfill({json: franRes})
      }
    })
    await page.route('*/**/api/franchise/1', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: [{id: 1, name: "Test Store", totalRevenue: 0}]}]
        await route.fulfill({json: franRes})
      }
    })

    await page.getByRole('button', {name: 'Create'}).click()
    
    await expect(page.getByRole('table')).toContainText('Test Store')
  })

  test('close store', async ({page}) => {
    await loginFranchisee(page);
    await page.route('*/**/api/franchise/1', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: [{id: 1, name: "Test Store", totalRevenue: 0}]}]
        await route.fulfill({json: franRes})
      }
    })
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('table')).toBeVisible()
    await page.getByRole('button', {name: 'Close'}).click()
    await expect(page.getByRole('heading', {name: 'Sorry'})).toBeVisible()
    await page.route('*/**/api/franchise/1/store/1', async (route) => {
      if (route.request().method() == 'DELETE') {
        const deleteRes = {message:"store deleted"}
        await route.fulfill({json: deleteRes})
      }
    })
    await page.route('*/**/api/franchise/1', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: []}]
        await route.fulfill({json: franRes})
      }
    })
    await page.getByRole('button', {name: 'Close'}).click()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('table')).not.toContainText('Test Franchise')
  })
})

test.describe('admin', async () => {
  test('admin dashboard', async ({page}) => {
    await loginAdmin(page)
    await page.route('*/**/api/franchise', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: [{id: 1, name: "Test Store", totalRevenue: 0}]}]
        await route.fulfill({json: franRes})
      }
    })
    await page.getByLabel('Global').getByRole('link', { name: 'Admin' }).click();

    await expect(page.getByRole('heading', {name: "Mama Ricci's kitchen"})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Add Franchise'})).toBeVisible()
    await expect(page.getByRole('table')).toContainText('Test Franchise')
    await expect(page.getByRole('table')).toContainText('Test Store')
  })

  test('close franchise', async ({page}) => {
    await loginAdmin(page)
    await page.route('*/**/api/franchise', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: []}]
        await route.fulfill({json: franRes})
      }
    })
    await page.getByLabel('Global').getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('button', {name: 'Close'}).click()
    await expect(page.getByRole('heading')).toContainText('Sorry to see you go')
    await expect(page.getByRole('button', {name: 'Close'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Cancel'})).toBeVisible()

    await page.route('*/**/api/franchise/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        const deleteRes = {message: 'franchise deleted'}
        await route.fulfill({json: deleteRes})
      }
    })
    await page.route('*/**/api/franchise', async (route) => {
      if (route.request().method() == 'GET') {
        const franRes = []
        await route.fulfill({json: franRes})
      }
    })

    await page.getByRole('button', {name: 'Close'}).click()

    await expect(page.getByRole('table')).not.toContainText('Test Franchise')
    await expect(page.getByRole('button', {name: 'Add Franchise'})).toBeVisible()
  })

  test('create franchise', async ({page}) => {
    await loginAdmin(page)
    await page.route('*/**/api/franchise', async (route) => {
      if (route.request().method() == 'GET') {
        await route.fulfill({json: []})
      }
    })
    await page.getByLabel('Global').getByRole('link', { name: 'Admin' }).click(); 
    await page.getByRole('button', {name: 'Add Franchise'}).click()
    await page.getByPlaceholder('franchise name').fill('Test Franchise')
    await page.getByPlaceholder('franchisee admin email').fill('demo@test.com')

    await page.route('*/**/api/franchise', async (route) => {
      const newFranchise = {name: 'Test Franchise', admins: [{id: 1, name: 'Demo User', email: 'demo@test.com'}], stores: []}
      if (route.request().method() === 'POST') {
        const postReq = {name: 'Test Franchise', admins: [{email: 'demo@test.com'}], stores: []}
        expect(route.request().postDataJSON()).toMatchObject(postReq)
        await route.fulfill({json: newFranchise})
      }
      if (route.request().method() === 'GET') {
        await route.fulfill({json: [newFranchise]})
      }
    })
    await page.getByRole('button', {name: 'Create'}).click()

    await expect(page.getByRole('table')).toContainText('Test Franchise')
  })
})