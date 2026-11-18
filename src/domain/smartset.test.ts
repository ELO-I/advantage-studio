import { describe, expect, it } from 'vitest';
import {
  exportLayout,
  familyOfFile,
  formatMacroSequence,
  parseLayout,
  parseMacroSequence,
  reloadShortcut,
  removeLocation,
  serializeRule,
  setAssignment,
  textMacro,
} from './smartset';

describe('SmartSet parsing and editing', () => {
  it('reads official examples, aliases, CRLF, co-triggers, delays and HID decimal codes', () => {
    const content =
      '\uFEFF[caps]>[lctrl]\r\n[lshift]>[esc][t&h250][lshift]\r\n{rctrl}{g}>{speed9}{g}{d500}{o}\r\n[enter]>[088]\r\n';
    const parsed = parseLayout(content, 'qwerty');
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.rules).toHaveLength(4);
    expect(parsed.rules[1].assignment).toEqual({
      kind: 'tapHold',
      tap: 'escape',
      hold: 'lshift',
      delay: 250,
    });
  });
  it('preserves disabled, unknown and co-trigger lines when editing a different assignment', () => {
    const original =
      '*[caps]>[escape]\n[a]>[b]\n{lctrl}{a}>{c}\nunknown firmware directive\n';
    const edited = setAssignment(original, 'qwerty', 'a', {
      kind: 'remap',
      action: 'f14',
    });
    expect(edited).toBe(
      '*[caps]>[escape]\n[a]>[f14]\n{lctrl}{a}>{c}\nunknown firmware directive\n',
    );
    expect(parseLayout(edited, 'qwerty').diagnostics[0].line).toBe(4);
    const macro = setAssignment(edited, 'qwerty', 'a', {
      kind: 'macro',
      triggers: ['a'],
      sequence: ['-lctrl', 'c', '+lctrl'],
    });
    expect(macro).toContain('{lctrl}{a}>{c}');
    expect(setAssignment(macro, 'qwerty', 'a', null, ['a'])).not.toContain(
      '{a}>{-lctrl}',
    );
    expect(removeLocation(macro, 'qwerty', 'a')).toContain(
      'unknown firmware directive',
    );
    expect(removeLocation(macro, 'qwerty', 'a')).not.toContain('{lctrl}{a}');
  });
  it('rejects invalid positions, unbalanced modifiers, unsupported delays and duplicate rules', () => {
    for (const content of [
      '[program]>[a]',
      '[keypad]>[a]',
      '[kp-u]>[a]',
      '[a]>[not-an-action]',
      '[a]>[escape][t&h0][lctrl]',
      '[a]>[escape][t&h1000][lctrl]',
      '{a}>{-lctrl}{c}',
      '{a}>{+lctrl}',
      '{a}>{d250}',
      '{lctrl}>{a}',
      '{lctrl}{kp-a}>{c}',
      '[a]>[b]\n[A]>[c]',
    ]) {
      expect(
        parseLayout(content, 'qwerty').diagnostics.some(
          (issue) => issue.severity === 'error',
        ),
        content,
      ).toBe(true);
    }
  });
  it('exports native empty layouts without adding rules and normalizes line endings', () => {
    expect(exportLayout('')).toBe('');
    expect(exportLayout('[a]>[b]\n[c]>[d]\n')).toBe('[a]>[b]\r\n[c]>[d]\r\n');
    expect(exportLayout(exportLayout('[a]>[b]\n'))).toBe(
      exportLayout('[a]>[b]\n'),
    );
  });
  it('converts US text with balanced shift actions and reports unsupported Unicode', () => {
    const macro = textMacro('Hi!\n');
    expect(macro.unsupported).toEqual([]);
    expect(
      parseLayout(
        serializeRule('a', {
          kind: 'macro',
          triggers: ['a'],
          sequence: macro.sequence,
        }),
        'qwerty',
      ).diagnostics,
    ).toEqual([]);
    expect(macro.sequence).toContain('-lshift');
    expect(macro.sequence.at(-1)).toBe('enter');
    expect(textMacro('été 🐈').unsupported).toEqual(['é', '🐈']);
  });
  it('reads and writes macro token lists', () => {
    expect(parseMacroSequence('{-LCtrl}{c}{+lctrl}')).toEqual([
      '-lctrl',
      'c',
      '+lctrl',
    ]);
    expect(parseMacroSequence('')).toEqual([]);
    expect(parseMacroSequence('{a}b')).toBeNull();
    expect(formatMacroSequence(['d125', 'a'])).toBe('{d125}{a}');
  });
  it('names the reload shortcut and family of SmartSet files', () => {
    expect(reloadShortcut('qwerty.txt')).toBe('Program + F3');
    expect(reloadShortcut('dvorak.txt')).toBe('Program + F4');
    expect(reloadShortcut('g_qwerty.txt')).toBe('Program + G');
    expect(familyOfFile('a_dvorak.txt')).toBe('dvorak');
    expect(familyOfFile('Mon clavier.txt')).toBe('qwerty');
  });
});
