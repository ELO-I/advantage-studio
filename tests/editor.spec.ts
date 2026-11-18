import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'My Advantage2', exact: true }),
  ).toBeVisible();
});

test('remap, persist, undo, redo and export a real SmartSet file', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page
    .getByRole('button', { name: 'Key Caps: Caps', exact: true })
    .click();
  await page.getByRole('button', { name: 'Modifiers', exact: true }).click();
  await page.getByRole('button', { name: 'Left Ctrl', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Key Caps: Ctrl, customised',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', {
      name: 'Key Caps: Ctrl, customised',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Key Caps: Caps', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export .txt', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('qwerty.txt');
  expect(await readFile((await download.path())!, 'utf8')).toBe(
    '[caps]>[lctrl]\r\n',
  );
  expect(errors).toEqual([]);
});

test('keypad editing uses the correct physical token and leaves the top layer alone', async ({
  page,
}) => {
  await page.getByRole('tab', { name: '1 Keypad', exact: true }).click();
  await page.getByRole('button', { name: 'Key U: KP 7', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search an action', exact: true })
    .fill('Escape');
  await page.getByRole('button', { name: 'Escape', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await page
    .getByRole('button', { name: 'View the SmartSet file', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'SmartSet code', exact: true }),
  ).toHaveValue('[kp7]>[escape]');
  await page.getByRole('button', { name: 'Close window', exact: true }).click();
  await page.getByRole('tab', { name: '0 Main', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Key U: U', exact: true }),
  ).toBeVisible();
});

test('creates presets, duplicates configurations and exports the complete library', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'New configuration', exact: true })
    .click();
  await page.getByRole('button', { name: /Colemak An alternative/ }).click();
  await page
    .getByLabel('Configuration name', { exact: true })
    .fill('My Colemak');
  await page
    .getByRole('button', { name: 'Create the configuration', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'My Colemak', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Key E: F, customised',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: /My configurations/ }).click();
  await page
    .getByRole('button', { name: 'Duplicate My Colemak', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'My Colemak · copy', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /My configurations/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Export the whole library',
      exact: true,
    })
    .click();
  const file = await downloadPromise;
  const library = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(library.profiles).toHaveLength(3);
  expect(library.version).toBe(1);
});

test('builds tap/hold and balanced macros without losing existing remaps', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Key Caps: Caps', exact: true })
    .click();
  await page.getByRole('tab', { name: 'Tap', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await page.getByRole('button', { name: 'Key A: A', exact: true }).click();
  await page.getByRole('tab', { name: 'Macro', exact: true }).click();
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await page
    .getByRole('button', { name: 'View the SmartSet file', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'SmartSet code', exact: true }),
  ).toHaveValue('[caps]>[escape][t&h250][lctrl]\n{a}>{-lctrl}{c}{+lctrl}');
});

test('preserves unsupported imports and blocks invalid exports, then permits repair', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Import a configuration', exact: true })
    .click();
  await page
    .getByLabel('Or paste the SmartSet content', { exact: true })
    .fill('[caps]>[lctrl]\nunknown line');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Export .txt', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'View the SmartSet file', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'SmartSet code', exact: true }),
  ).toHaveValue('[caps]>[lctrl]\nunknown line');
  await page
    .getByRole('textbox', { name: 'SmartSet code', exact: true })
    .fill('[caps]>[lctrl]\n*unknown line');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Export .txt', exact: true }),
  ).toBeEnabled();
});

test('explains desktop transfer requirements and remains usable at smaller widths', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Apply to keyboard', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Install with the desktop app',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', { name: 'Download the desktop app', exact: true }),
  ).toHaveAttribute('href', /\/releases\/latest$/);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.setViewportSize({ width: 1100, height: 850 });
  await expect(
    page.getByRole('button', { name: 'Key Q: Q', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1100);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('button', { name: 'Apply to keyboard', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test('switches the interface to French and remembers the choice', async ({
  page,
}) => {
  await page
    .getByRole('combobox', { name: 'Language', exact: true })
    .selectOption('fr');
  await expect(
    page.getByRole('button', { name: 'Appliquer au clavier', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Touche Caps : Caps', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Langue', exact: true })
    .selectOption('en');
  await expect(
    page.getByRole('button', { name: 'Key Caps: Caps', exact: true }),
  ).toBeVisible();
});
