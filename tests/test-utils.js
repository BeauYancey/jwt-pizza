
export async function login(page) {
	await page.route('*/**/api/auth', async (route) => {
		if (route.request().method() == 'PUT') {
			const loginRes = {user: {id: 1, email: 'demo@test.com', name: 'Demo User', token: 'abc.def.ghi', roles: [{role: 'diner'}]}}
			await route.fulfill({json: loginRes})
		}
  })

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('demo@test.com');
  await page.getByPlaceholder('Password').fill('testp@ssword');
  await page.getByRole('button', {name: 'Login'}).click();
}

export async function loginAdmin(page) {
  await page.route('*/**/api/auth', async (route) => {
		if (route.request().method() == 'PUT') {
			const loginRes = {user: {id: 1, email: 'demo@test.com', name: 'Demo User', token: 'abc.def.ghi', roles: [{role: 'admin'}]}}
			await route.fulfill({json: loginRes})
		}
  })

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('demo@test.com');
  await page.getByPlaceholder('Password').fill('testp@ssword');
  await page.getByRole('button', {name: 'Login'}).click();
}

export async function loginFranchisee(page) {
  await page.route('*/**/api/auth', async (route) => {
		if (route.request().method() == 'PUT') {
			const loginRes = {user: {id: 1, email: 'demo@test.com', name: 'Demo User', token: 'abc.def.ghi', roles: [{role: 'diner'}, {role: 'franchisee', objectId: 1}]}}
			await route.fulfill({json: loginRes})
		}
  })
  await page.route('*/**/api/franchise/1', async (route) => {
    if (route.request().method() == 'GET') {
			const franRes = [{id: 1, name: 'Test Franchise', admins: [{id: 1, email: 'demo@test.com', name: 'Demo User'}], stores: []}]
			await route.fulfill({json: franRes})
		}
  })

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('demo@test.com');
  await page.getByPlaceholder('Password').fill('testp@ssword');
  await page.getByRole('button', {name: 'Login'}).click();
}