import { describe, expect, it } from 'vitest';
import { actionCategories, actions } from '../domain/keyboard';
import { parseLayout } from '../domain/smartset';
import { bindingAt } from '../domain/binding';
import { en } from './en';
import { createTranslator, locales } from './translator';

/** Every leaf path of a catalog, e.g. `sidebar.editor`. */
const paths = (value: object, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' && !Array.isArray(child)
      ? paths(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
// Overrides of the model are optional per locale.
const required = (catalog: object) =>
  paths(catalog).filter((path) => !path.startsWith('actions.'));

describe('Translations', () => {
  it('gives every locale the keys of the English catalog', () => {
    for (const { id, messages } of locales)
      expect(required(messages), id).toEqual(required(en));
  });

  it('knows the category of every action and overrides only known actions', () => {
    for (const action of actions)
      expect(actionCategories).toContain(action.category);
    const tokens = new Set(actions.map((action) => action.token));
    for (const { messages } of locales)
      for (const token of [
        ...Object.keys(messages.actions.labels),
        ...Object.keys(messages.actions.names),
      ])
        expect(tokens).toContain(token);
  });

  it('describes keys, bindings and diagnostics in the chosen language', () => {
    const english = createTranslator('en');
    const french = createTranslator('fr');
    expect(english.actionName('esc')).toBe('Escape');
    expect(french.actionName('esc')).toBe('Échap');
    expect(french.actionLabel('enter')).toBe('Entrée');
    const parsed = parseLayout(
      '[caps]>[escape][t&h250][lctrl]\n{lctrl}{s}>{d}\n[zz]>[a]',
      'qwerty',
    );
    expect(english.bindingLabel(bindingAt(parsed, 'caps'))).toBe('Esc / Ctrl');
    expect(english.bindingLabel(bindingAt(parsed, 's'))).toBe('1 macro');
    expect(french.diagnostic(parsed.diagnostics[0])).toBe(
      'Position inconnue pour la famille QWERTY : zz.',
    );
  });

  it('names history entries, and keeps free text from older libraries', () => {
    const english = createTranslator('en');
    expect(english.historyLabel({ label: 'editKey', key: 'caps' })).toBe(
      'Edit Caps',
    );
    expect(english.historyLabel({ label: 'Avant restauration' })).toBe(
      'Avant restauration',
    );
  });

  it('turns backend error codes into messages', () => {
    const english = createTranslator('en');
    expect(english.errorMessage({ code: 'noDevice' })).toBe(
      'No keyboard connected.',
    );
    expect(
      english.errorMessage({
        code: 'transferFailed',
        cause: { code: 'io', detail: 'disk full' },
        restored: true,
        backupId: 'b1',
      }),
    ).toBe(
      'Incomplete transfer: System error: disk full. The original was written back. Local backup: b1.',
    );
    expect(english.errorMessage(new Error('boom'))).toBe('boom');
    expect(english.errorMessage({ code: 'unknown' })).toBe(
      '{"code":"unknown"}',
    );
  });
});
