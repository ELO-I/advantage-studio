/**
 * Regenerates the README screenshots in docs/assets.
 * Run with the dev server started (npm run dev): npm run screenshots
 */
import { chromium } from '@playwright/test';

const out = 'docs/assets';
const base = 'http://127.0.0.1:1420';
const size = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 };

const mockTauri = () => {
  const device = {
    root: '/run/media/ADVANTAGE2',
    name: 'Kinesis Advantage2',
    version: '1.0.521.us (4MB)',
    layouts: ['qwerty.txt', 'dvorak.txt', 'g_qwerty.txt'],
    fingerprint: 'v',
  };
  globalThis.isTauri = true;
  globalThis.__TAURI_INTERNALS__ = {
    invoke: async (command, args = {}) => {
      switch (command) {
        case 'load_library':
          return globalThis.localStorage.getItem('desktop-library');
        case 'save_library':
          globalThis.localStorage.setItem(
            'desktop-library',
            String(args.content),
          );
          return;
        case 'detect_devices':
          return [device];
        case 'connect_device':
          return device;
        case 'read_device_layout':
          return { content: '', fingerprint: 'f' };
        case 'list_backups':
          return [];
        default:
          throw { code: 'noDevice' };
      }
    },
  };
};

async function buildProfile(page) {
  await page.goto(base);
  await page
    .getByRole('button', { name: 'New configuration', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: /Colemak/ }).click();
  await page
    .getByLabel('Configuration name', { exact: true })
    .fill('Colemak · home row');
  await page
    .getByRole('button', { name: 'Create the configuration', exact: true })
    .click();
  // Caps: Escape on tap, Ctrl on hold
  await page
    .getByRole('button', { name: 'Key Caps: Caps', exact: true })
    .click();
  await page.getByRole('tab', { name: 'Tap', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  // Home thumb key: copy macro
  await page
    .getByRole('button', { name: 'Key Home: Home', exact: true })
    .click();
  await page.getByRole('tab', { name: 'Macro', exact: true }).click();
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  // End thumb key: paste macro
  await page.getByRole('button', { name: 'Key End: End', exact: true }).click();
  await page.getByRole('tab', { name: 'Macro', exact: true }).click();
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await page
    .getByRole('button', { name: 'Close the inspector', exact: true })
    .click();
  const toast = page.getByRole('button', {
    name: 'Dismiss notification',
    exact: true,
  });
  if (await toast.isVisible()) await toast.click();
}

const browser = await chromium.launch();
try {
  const page = await (await browser.newContext(size)).newPage();
  await buildProfile(page);
  await page.getByRole('button', { name: /^Key Caps: Esc \/ Ctrl/ }).click();
  await page.screenshot({ path: `${out}/editor.png` });
  await page.getByRole('button', { name: /^Key E: F/ }).click();
  await page.getByRole('button', { name: 'Navigation', exact: true }).click();
  await page.screenshot({ path: `${out}/remap.png` });
  await page
    .getByRole('button', { name: 'Close the inspector', exact: true })
    .click();
  await page.getByRole('button', { name: /My configurations/ }).click();
  await page
    .getByRole('button', { name: 'Duplicate Colemak · home row', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Dismiss notification', exact: true })
    .click();
  await page.getByRole('button', { name: /My configurations/ }).click();
  await page.screenshot({ path: `${out}/library.png` });

  const desktop = await browser.newContext(size);
  await desktop.addInitScript(mockTauri);
  const app = await desktop.newPage();
  await buildProfile(app);
  await app
    .getByRole('button', { name: 'Apply to keyboard', exact: true })
    .click();
  await app
    .getByRole('button', { name: /Kinesis Advantage2.*ADVANTAGE2/ })
    .click();
  await app.getByRole('combobox').first().waitFor();
  await app.screenshot({ path: `${out}/transfer.png` });
} finally {
  await browser.close();
}
