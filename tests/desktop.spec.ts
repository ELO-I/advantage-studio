import { test, expect, type Page } from '@playwright/test';

async function mockDesktop(page: Page, rejectTransfer = false) {
  await page.addInitScript(
    ({ rejectTransfer }) => {
      const device = {
        root: '/media/ADVANTAGE2',
        name: 'Kinesis Advantage2',
        version: '1.0.521.us (4MB)',
        layouts: ['qwerty.txt', 'dvorak.txt'],
        fingerprint: 'device-version',
      };
      const bridge = {
        calls: [] as { command: string; args: Record<string, unknown> }[],
        invoke: async (command: string, args: Record<string, unknown> = {}) => {
          bridge.calls.push({ command, args });
          switch (command) {
            case 'load_library':
              return localStorage.getItem('desktop-library');
            case 'save_library':
              localStorage.setItem('desktop-library', String(args.content));
              return;
            case 'detect_devices':
              return [device];
            case 'connect_device':
              return device;
            case 'read_device_layout':
              return {
                content: '[caps]>[lctrl]\r\n',
                fingerprint: 'original-sha256',
              };
            case 'apply_device_layout':
              if (rejectTransfer) throw { code: 'changedSinceRead' };
              return {
                backupId: '2e541248-e555-426c-b210-465243bc0d35',
                fingerprint: 'new-sha256',
              };
            default:
              throw `Unmocked IPC command: ${command}`;
          }
        },
      };
      Object.assign(window, { isTauri: true, __TAURI_INTERNALS__: bridge });
    },
    { rejectTransfer },
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Apply to keyboard', exact: true })
    .click();
  await page
    .getByRole('button', { name: /Kinesis Advantage2.*\/media\/ADVANTAGE2/ })
    .click();
  await expect(page.getByLabel('File to update')).toHaveValue('qwerty.txt');
}

test('desktop connection passes the original fingerprint and guides physical reload after verified transfer', async ({
  page,
}) => {
  await mockDesktop(page);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Apply to keyboard', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'The configuration is on your keyboard',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Program + F3', { exact: true })).toBeVisible();
  await expect(page.getByText('Program + F1', { exact: true })).toBeVisible();
  const calls = await page.evaluate(() => {
    const bridge = (
      window as unknown as {
        __TAURI_INTERNALS__: {
          calls: { command: string; args: Record<string, unknown> }[];
        };
      }
    ).__TAURI_INTERNALS__;
    return bridge.calls;
  });
  expect(
    calls.find((call) => call.command === 'apply_device_layout')?.args,
  ).toEqual({
    filename: 'qwerty.txt',
    content: '',
    expectedFingerprint: 'original-sha256',
  });
});

test('a changed device file shows the transfer error without reporting success', async ({
  page,
}) => {
  await mockDesktop(page, true);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Apply to keyboard', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'The keyboard file changed since it was read',
  );
  await expect(
    page.getByRole('heading', {
      name: 'The configuration is on your keyboard',
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reconnect the keyboard', exact: true }),
  ).toBeVisible();
});
