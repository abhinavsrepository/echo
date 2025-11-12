import { test, expect } from '@playwright/test';

test.describe('Echo Widget', () => {
  test('should load the widget launcher', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#echo-widget-container')).toBeAttached();
  });

  test('should open chat on launcher click', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('#echo-widget-container');
    const shadowHost = await container.evaluateHandle((el) => el.shadowRoot);

    const launcher = await shadowHost.evaluateHandle((shadow) =>
      shadow?.querySelector('.echo-launcher')
    );

    if (launcher) {
      await launcher.asElement()?.click();
      await page.waitForTimeout(500);

      const widget = await shadowHost.evaluateHandle((shadow) =>
        shadow?.querySelector('.echo-widget')
      );

      expect(widget).toBeTruthy();
    }
  });

  test('should close chat on second click', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('#echo-widget-container');
    const shadowHost = await container.evaluateHandle((el) => el.shadowRoot);

    const launcher = await shadowHost.evaluateHandle((shadow) =>
      shadow?.querySelector('.echo-launcher')
    );

    if (launcher) {
      await launcher.asElement()?.click();
      await page.waitForTimeout(500);
      await launcher.asElement()?.click();
      await page.waitForTimeout(500);

      const widget = await shadowHost.evaluateHandle((shadow) =>
        shadow?.querySelector('.echo-widget')
      );

      expect(widget).toBeFalsy();
    }
  });
});
