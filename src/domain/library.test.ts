import { describe, expect, it } from 'vitest';
import { parseLayout } from './smartset';
import {
  addProfiles,
  checkpoint,
  createLibrary,
  createProfile,
  duplicateProfile,
  fromPreset,
  librarySchema,
  LIMITS,
  exceedsProfileLimit,
  recordEdit,
  removeProfile,
  undoEdit,
} from './library';

describe('Portable configuration library', () => {
  it('round-trips history and rejects a dangling selected profile', () => {
    const library = createLibrary('My Advantage2');
    library.profiles[0] = checkpoint(library.profiles[0], { change: 'edit' });
    expect(librarySchema.parse(JSON.parse(JSON.stringify(library)))).toEqual(
      library,
    );
    expect(
      librarySchema.safeParse({ ...library, selectedId: 'missing' }).success,
    ).toBe(false);
  });
  it('generates an actual Colemak preset on the QWERTY family with valid keypad exceptions', () => {
    const profile = fromPreset('colemak', 'Colemak');
    const parsed = parseLayout(profile.content, profile.family);
    expect(parsed.diagnostics).toEqual([]);
    expect(
      parsed.rules.find((rule) => rule.location === 'e')?.assignment,
    ).toEqual({ kind: 'remap', action: 'f' });
    expect(
      parsed.rules.find((rule) => rule.location === 'kp8')?.assignment,
    ).toEqual({ kind: 'remap', action: 'u' });
    expect(fromPreset('dvorak', 'Dvorak').content).toBe('');
  });
  it('records an edit as a restorable version and undoes it', () => {
    const profile = createProfile('Test', 'qwerty', '[a]>[b]');
    const edited = recordEdit(profile, '[a]>[c]', {
      change: 'editKey',
      key: 'a',
    });
    expect(edited.content).toBe('[a]>[c]');
    expect(edited.history[0]).toMatchObject({
      content: '[a]>[b]',
      label: 'editKey',
      key: 'a',
    });
    expect(undoEdit(edited)).toMatchObject({
      content: '[a]>[b]',
      history: [],
    });
    expect(undoEdit(profile)).toBe(profile);
  });
  it('adds, duplicates and removes profiles while keeping one selected', () => {
    const library = createLibrary('My Advantage2');
    const copy = duplicateProfile(
      { ...library.profiles[0], name: 'x'.repeat(LIMITS.nameLength) },
      ' · copy',
    );
    expect(copy.name).toHaveLength(LIMITS.nameLength);
    expect(copy.name.endsWith(' · copy')).toBe(true);
    const added = addProfiles(library, [copy]);
    expect(added.selectedId).toBe(copy.id);
    const removed = removeProfile(added, copy.id);
    expect(removed.profiles).toEqual(library.profiles);
    expect(removed.selectedId).toBe(library.profiles[0].id);
    expect(removeProfile(library, library.profiles[0].id)).toBe(library);
  });
  it('refuses to grow the library past its limit', () => {
    const library = createLibrary('My Advantage2');
    expect(exceedsProfileLimit(library, LIMITS.profiles - 1)).toBe(false);
    expect(exceedsProfileLimit(library, LIMITS.profiles)).toBe(true);
  });
});
