import { expect, type Page, test } from '@playwright/test';

// Stable seeded users supplied by the local demo environment.
const CLAIMANT = {
  email: 'claimant@demo.com',
  password: 'Claimant123!',
};

const ADMIN = {
  email: 'admin@demo.com',
  password: 'Admin123!',
};

// Reusable login flow prevents duplicated selectors and credentials in each test.
async function login(page: Page, user: typeof CLAIMANT) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  // Exact matching avoids selecting the separate "Show password" button.
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

// Logout also verifies that the browser returns to the public login page.
async function logout(page: Page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/);
}

test('invalid credentials do not create an authenticated session', async ({ page }) => {
  // Use a valid account name with an incorrect password so client-side validation passes.
  await page.goto('/login');
  await page.getByLabel('Email').fill(CLAIMANT.email);
  await page.getByLabel('Password', { exact: true }).fill('IncorrectPassword123!');

  // Capture the authentication response to confirm the backend rejects the credentials.
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/login') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Log In' }).click();
  const loginResponse = await loginResponsePromise;

  expect(loginResponse.status()).toBe(401);
  // Next.js also renders an empty route-announcer with role="alert", so match by text.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Invalid email or password' }),
  ).toHaveText('Invalid email or password');
  await expect(page).toHaveURL(/\/login$/);

  // Direct navigation must still be rejected because no authenticated cookie was created.
  await page.goto('/claims');
  await expect(page).toHaveURL(/\/login/);
});

test('claimant cannot access the admin claims page', async ({ page }) => {
  // Establish a real claimant session through the UI.
  await login(page, CLAIMANT);
  await expect(page).toHaveURL(/\/claims$/);

  // Attempt direct navigation to an administrator-only route.
  await page.goto('/admin/claims');

  // The application must redirect the claimant to their own claims page.
  await expect(page).toHaveURL(/\/claims$/);
  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
});

test('claimant submits a claim and admin moves it under review', async ({ page }) => {
  // A timestamp makes the claim easy to identify and prevents collisions between runs.
  const uniqueDescription = `Automation claim ${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  // Phase 1: authenticate as the claimant and open the protected submission form.
  await login(page, CLAIMANT);
  await expect(page).toHaveURL(/\/claims$/);
  await page.goto('/claims/new');
  await expect(page.getByRole('heading', { name: 'Submit New Claim' })).toBeVisible();

  // Complete incident details using accessible labels.
  await page.getByLabel(/when did the incident occur/i).fill(today);
  await page.getByLabel(/where did the incident occur/i).fill('Kuala Lumpur');
  await page.getByLabel(/claim amount/i).fill('1250.50');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Complete supporting details and verify them on the review step.
  await page.getByLabel(/describe what happened/i).fill(uniqueDescription);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText(uniqueDescription)).toBeVisible();

  // Begin listening before clicking so a fast POST response cannot be missed.
  const submitResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/claims') &&
      response.request().method() === 'POST',
  );
  // Scope the locator because the header also contains a Submit Claim button.
  await page
    .getByTestId('wizard-step-3')
    .getByRole('button', { name: 'Submit Claim', exact: true })
    .click();
  // The API response proves persistence succeeded and provides the new claim ID.
  const submitResponse = await submitResponsePromise;
  expect(submitResponse.ok()).toBeTruthy();
  const submittedClaim = (await submitResponse.json()) as { claimId: string };

  // Verify the claimant sees the persisted claim with its initial status.
  await expect(page).toHaveURL(/\/claims$/);
  const claimantRow = page.getByRole('row', { name: new RegExp(uniqueDescription) });
  await expect(claimantRow).toBeVisible();
  await expect(claimantRow.getByRole('status')).toHaveText('Submitted');

  // Phase 2: switch roles through the real logout/login flow.
  await logout(page);
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await page.goto('/admin/claims');

  // The admin table displays the first eight characters of each claim ID.
  const shortClaimId = submittedClaim.claimId.substring(0, 8);
  const adminRow = page.getByRole('row', { name: new RegExp(shortClaimId) });
  await expect(adminRow).toBeVisible();
  await adminRow.getByRole('combobox', { name: /update status/i }).selectOption('UNDER_REVIEW');

  // Listen for the status PATCH before confirming the modal action.
  const updateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/admin/claims/${submittedClaim.claimId}/status`) &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  // Assert both the backend response and the resulting status shown in the table.
  const updateResponse = await updateResponsePromise;
  expect(updateResponse.ok()).toBeTruthy();
  await expect(adminRow.getByRole('status')).toHaveText('Under Review');
});
