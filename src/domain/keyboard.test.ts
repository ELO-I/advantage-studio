import { describe, expect, it } from 'vitest';
import {
  defaultAction,
  findLocation,
  keyboard,
  locationToken,
} from './keyboard';
import { parseLayout, serializeRule } from './smartset';

describe('Advantage2 physical model', () => {
  it('defines every key and unique programmable location on both native families', () => {
    expect(
      keyboard.keys.filter((key) => key.group !== 'pedal' && key.editable),
    ).toHaveLength(84);
    for (const family of ['qwerty', 'dvorak'] as const) {
      const positions = keyboard.keys
        .filter((key) => key.editable)
        .flatMap((key) =>
          ['top', 'keypad'].map(
            (layer) => key.locations[family][layer as 'top' | 'keypad'],
          ),
        );
      expect(new Set(positions).size).toBe(positions.length);
      for (const key of keyboard.keys.filter((key) => key.editable)) {
        for (const layer of ['top', 'keypad'] as const) {
          const text = serializeRule(locationToken(key, family, layer), {
            kind: 'remap',
            action: defaultAction(key, family, layer),
          });
          expect(parseLayout(text, family).diagnostics, text).toEqual([]);
        }
      }
    }
  });
  it('resolves keypad exceptions and Dvorak positions instead of assuming kp- prefixes', () => {
    expect(findLocation('kp7', 'qwerty')?.key.id).toBe('u');
    expect(findLocation('kp-u', 'qwerty')).toBeUndefined();
    expect(findLocation("'", 'dvorak')?.key.id).toBe('q');
    expect(findLocation('kp-insert', 'qwerty')?.key.id).toBe('intl-\\');
    expect(findLocation('kp=', 'qwerty')?.key.id).toBe('8');
    expect(findLocation('program', 'qwerty')).toBeUndefined();
  });
});
