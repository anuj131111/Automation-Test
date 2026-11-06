import { test, expect } from '@playwright/test';

test('adds the MFC-J4355DW printer to the cart', async ({ page }) => {
  await page.goto('https://www.brother-usa.com/p/inkjet-printers/MFCJ4355DW', {
    waitUntil: 'load',
  });

  await expect(
    page.getByRole('heading', {
      name: 'Brother MFC-J4355DW Wireless INKvestment Color Inkjet All-in-One Printer',
    }),
  ).toBeVisible();

  const acceptCookies = page.getByRole('button', { name: 'Accept All Cookies' });
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click();
  }

  const promoOverlay = page.locator('#mcp-overlay');
  for (let attempt = 0; attempt < 10 && !(await promoOverlay.isVisible()); attempt++) {
    await page.waitForTimeout(500);
  }
  if (await promoOverlay.isVisible()) {
    await promoOverlay.click();
  }

  await page.locator('#pdpAddToCartBtn_MFCJ4355DW').click();

  await expect(
    page.getByRole('button', { name: 'My cart, number of items: 1' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Updated Quantity 1');
});
