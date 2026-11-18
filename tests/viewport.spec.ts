import { test, expect, type Page } from '@playwright/test';

async function expectEditorFits(page: Page) {
  const problems = await page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollHeight > innerHeight)
      problems.push('page scrolls vertically');
    if (document.documentElement.scrollWidth > innerWidth)
      problems.push('page scrolls horizontally');
    const selectors = [
      '.keyboard',
      '.keyboard-panel-footer',
      '.inspector-footer',
      '.heading-actions',
      '.sidebar-bottom',
    ];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        if (
          rect.top < -0.5 ||
          rect.bottom > innerHeight + 0.5 ||
          rect.left < -0.5 ||
          rect.right > innerWidth + 0.5
        )
          problems.push(`${selector} outside window`);
      }
    }
    for (const element of document.querySelectorAll('.keyboard-stage .key')) {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      if (hit?.closest('.key') !== element)
        problems.push(
          `key ${element.getAttribute('data-key-id')} is not reachable`,
        );
    }
    return problems;
  });
  expect(problems).toEqual([]);
  await expect(
    page.getByRole('button', { name: 'Apply to keyboard', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await expect(
    page.getByRole('button', { name: 'Save action', exact: true }),
  ).toBeInViewport({ ratio: 1 });
}

test('the editor fits laptop, compact and wide windows with fixed save controls', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Key A: A', exact: true }).click();
  for (const [width, height] of [
    [900, 600],
    [1024, 640],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [2560, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await expectEditorFits(page);
    await page.getByRole('tab', { name: 'Macro', exact: true }).click();
    await expectEditorFits(page);
    await page.getByRole('tab', { name: 'Tap', exact: true }).click();
    await expectEditorFits(page);
    await page.getByRole('tab', { name: 'Key', exact: true }).click();
    await page.getByLabel('Pedals', { exact: true }).check();
    await expectEditorFits(page);
    await page.getByLabel('Pedals', { exact: true }).uncheck();
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  const footer = await page.locator('.inspector-footer').boundingBox();
  await page.locator('.action-grid').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await page.locator('.inspector-footer').boundingBox()).toEqual(footer);
  await page.locator('.action-grid').evaluate((element) => {
    element.scrollTop = 0;
  });

  await page.getByRole('button', { name: 'Modifiers', exact: true }).click();
  await page.getByRole('button', { name: 'Left Ctrl', exact: true }).click();
  await page.getByRole('button', { name: 'Save action', exact: true }).click();
  await expect(page.locator('.changes-panel')).not.toHaveAttribute('open');
  await expectEditorFits(page);
  await page.locator('.changes-heading').click();
  await expectEditorFits(page);
  await page.locator('.changes-heading').click();
  await page.getByRole('tab', { name: '1 Keypad', exact: true }).click();
  await page.getByRole('button', { name: 'Key U: KP 7', exact: true }).click();
  await expectEditorFits(page);
});
