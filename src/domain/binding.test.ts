import { describe, expect, it } from 'vitest';
import { keyboard } from './keyboard';
import { parseLayout } from './smartset';
import { assignKey, bindingAt } from './binding';

const key = (id: string) => keyboard.keys.find((item) => item.id === id)!;
const assign = (
  content: string,
  id: string,
  assignment: Parameters<typeof assignKey>[0]['assignment'],
  previous?: Parameters<typeof assignKey>[0]['previous'],
) =>
  assignKey({
    content,
    family: 'qwerty',
    key: key(id),
    layer: 'top',
    assignment,
    previous,
  });

describe('Key bindings', () => {
  it('classifies a key by the rule its own press fires', () => {
    const parsed = parseLayout(
      '[a]>[b]\n{lctrl}{a}>{c}\n[caps]>[escape][t&h250][lctrl]\n{lctrl}{s}>{d}',
      'qwerty',
    );
    expect(bindingAt(parsed, 'a')).toMatchObject({ kind: 'remap' });
    expect(bindingAt(parsed, 'a').rules).toHaveLength(2);
    expect(bindingAt(parsed, 'caps').kind).toBe('tapHold');
    expect(bindingAt(parsed, 's')).toMatchObject({ kind: 'macro' });
    expect(bindingAt(parsed, 'q').kind).toBeUndefined();
  });

  it('removes the rule when a key is remapped to its native action', () => {
    const result = assign('[a]>[b]', 'a', { kind: 'remap', action: 'a' });
    expect(result).toEqual({ ok: true, content: '' });
  });

  it('replaces a direct macro but keeps its co-trigger variants', () => {
    const result = assign(
      '{a}>{c}\n{lctrl}{a}>{d}',
      'a',
      { kind: 'remap', action: 'b' },
      { kind: 'macro', triggers: ['a'], sequence: ['c'] },
    );
    expect(result).toEqual({ ok: true, content: '{lctrl}{a}>{d}\n[a]>[b]' });
  });

  it('mirrors layer switches on both layers', () => {
    const result = assign('', 'f1', { kind: 'remap', action: 'kptoggle' });
    expect(result.ok && result.content).toBe(
      '[f1]>[kptoggle]\n[kp-lwin]>[kptoggle]',
    );
  });

  it('reports invalid assignments without changing the layout', () => {
    const result = assign('', 'a', {
      kind: 'macro',
      triggers: ['a'],
      sequence: ['-lctrl', 'c'],
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'unbalancedMacro', line: 1 },
    });
  });
});
