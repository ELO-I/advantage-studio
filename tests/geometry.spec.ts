import { test, expect } from '@playwright/test';

test('all keyboard keys remain separate and clickable after rotation and resizing', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'My Advantage2', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Pedals', { exact: true }).check();

  for (const width of [1440, 1100, 1050, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    const problems = await page
      .locator('.keyboard:not(.keyboard-compact)')
      .evaluate((board) => {
        type Point = { x: number; y: number };
        const boardRect = board.getBoundingClientRect();
        const keys = [...board.querySelectorAll<HTMLElement>('.key')].map(
          (element) => {
            const style = getComputedStyle(element);
            const matrix = new DOMMatrix(style.transform);
            const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
            const width = parseFloat(style.width),
              height = parseFloat(style.height);
            const x = boardRect.left + parseFloat(style.left),
              y = boardRect.top + parseFloat(style.top);
            const polygon = [
              { x: 0, y: 0 },
              { x: width, y: 0 },
              { x: width, y: height },
              { x: 0, y: height },
            ].map((point) => ({
              x: x + ox + matrix.a * (point.x - ox) + matrix.c * (point.y - oy),
              y: y + oy + matrix.b * (point.x - ox) + matrix.d * (point.y - oy),
            }));
            return { id: element.dataset.keyId!, element, polygon };
          },
        );
        const intersects = (a: Point[], b: Point[]) => {
          for (const polygon of [a, b]) {
            for (let i = 0; i < polygon.length; i++) {
              const start = polygon[i],
                end = polygon[(i + 1) % polygon.length];
              const axis = { x: -(end.y - start.y), y: end.x - start.x };
              const length = Math.hypot(axis.x, axis.y);
              const projection = (point: Point) =>
                (point.x * axis.x + point.y * axis.y) / length;
              const pa = a.map(projection),
                pb = b.map(projection);
              if (
                Math.min(Math.max(...pa), Math.max(...pb)) -
                  Math.max(Math.min(...pa), Math.min(...pb)) <=
                0.1
              )
                return false;
            }
          }
          return true;
        };
        const problems: string[] = [];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          for (const other of keys.slice(i + 1)) {
            if (intersects(key.polygon, other.polygon))
              problems.push(`${key.id} overlaps ${other.id}`);
          }
          const label = key.element.querySelector<HTMLElement>('.key-label')!;
          if (label.scrollWidth > label.clientWidth + 1)
            problems.push(`${key.id} label does not fit`);
          const rect = key.element.getBoundingClientRect();
          if (
            rect.left < boardRect.left - 0.1 ||
            rect.right > boardRect.right + 0.1 ||
            rect.top < boardRect.top - 0.1 ||
            rect.bottom > boardRect.bottom + 0.1
          )
            problems.push(`${key.id} outside keyboard`);
          const hit = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          if (hit?.closest('.key') !== key.element)
            problems.push(`${key.id} cannot be clicked at its center`);
        }
        return problems;
      });
    expect(problems, `Keyboard at ${width}px`).toEqual([]);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Pedals', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Key Del: Del', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete', exact: true }),
  ).toBeVisible();
});
