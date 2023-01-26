const { test } = require('@playwright/test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test.afterEach(async ({ page }) => {
    await page.request.fetch('/api/database/dump', {
      method: 'POST',
    });
  });

  test('a user should be able to signup when the strapi instance starts fresh', async ({
    page,
  }) => {
    await page.getByLabel('First name').fill('John');
    await page.getByLabel('Last name').fill('Smith');
    await page.getByLabel('Email').fill('test@testing.com');
    await page
      .getByLabel('Password*', {
        exact: true,
      })
      .fill('myTestPassw0rd');
    await page
      .getByLabel('Confirmation Password*', {
        exact: true,
      })
      .fill('myTestPassw0rd');

    await page.getByRole('button', { name: "Let's start" }).click();
  });
});
