import { test, expect } from '@playwright/test';

/**
 * Login Test for Test User Account
 * 
 * Verifies that the test user (owner@test.com) can successfully log in
 * through the UI modal-based authentication system.
 */

const TEST_CREDENTIALS = {
    email: 'owner@test.com',
    password: 'test123',
};

test.describe('Test User Login Verification', () => {
    test('should successfully log in with test user credentials', async ({ page }) => {
        // Navigate to the application with signin query param to trigger auth modal
        // The baseURL (localhost:3001) should resolve to a site via middleware
        await page.goto('/?signin=true');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait for the auth modal dialog to appear
        // The AuthModal uses Radix UI Dialog component
        await page.waitForSelector('[role="dialog"]', { timeout: 15000 });

        // Take screenshot of login modal
        await page.screenshot({ path: 'test-results/login-modal.png' });

        // Wait for email input to be visible within the dialog
        const emailInput = page.locator('[role="dialog"] input[type="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 5000 });

        // Fill in email
        await emailInput.fill(TEST_CREDENTIALS.email);

        // Fill in password
        const passwordInput = page.locator('[role="dialog"] input[type="password"]');
        await passwordInput.fill(TEST_CREDENTIALS.password);

        // Take screenshot before submission
        await page.screenshot({ path: 'test-results/login-filled.png' });

        // Click the Sign In button within the dialog
        await page.locator('[role="dialog"] button[type="submit"]:has-text("Sign In")').click();

        // Wait for navigation/redirect after successful login
        // The SignIn component redirects to returnUrl (default '/') after successful login
        await page.waitForURL('/', { timeout: 15000 });

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Verify we're logged in by checking that the auth modal is closed
        const authDialog = page.locator('[role="dialog"]');
        await expect(authDialog).not.toBeVisible();

        // Take screenshot of successful login state
        await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });

        console.log('✅ Test user login successful');
    });

    test('should show error for invalid credentials', async ({ page }) => {
        // Navigate to the application with signin query param
        await page.goto('/?signin=true');

        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Wait for the auth modal dialog
        await page.waitForSelector('[role="dialog"]', { timeout: 15000 });

        // Fill in invalid credentials
        await page.locator('[role="dialog"] input[type="email"]').fill('invalid@test.com');
        await page.locator('[role="dialog"] input[type="password"]').fill('wrongpassword');

        // Click the Sign In button
        await page.locator('[role="dialog"] button[type="submit"]:has-text("Sign In")').click();

        // Wait for error message to appear within the dialog
        await page.waitForSelector('[role="dialog"] [role="alert"]', { timeout: 10000 });

        // Take screenshot of error state
        await page.screenshot({ path: 'test-results/login-error.png' });

        console.log('✅ Invalid credentials correctly rejected');
    });
});
