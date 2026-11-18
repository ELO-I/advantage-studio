/** Physical model of the Advantage2: keys, positions and actions. */
import data from '../../resources/advantage2.json';

export type Family = 'qwerty' | 'dvorak';
export type Layer = 'top' | 'keypad';
export type PhysicalKey = (typeof data.keys)[number];
export type KeyAction = (typeof data.actions)[number];

export const keyboard = data;
export const actions = data.actions;
export const modifiers = data.modifierTokens;
/** Order of the action categories in the editor; labels live in `src/i18n`. */
export const actionCategories = [
  'characters',
  'functions',
  'navigation',
  'modifiers',
  'media',
  'keypad',
  'other',
] as const;
export type ActionCategory = (typeof actionCategories)[number];
export const layers: Layer[] = ['top', 'keypad'];
export const familyLabel = (family: Family) => family.toUpperCase();

const actionMap = new Map(actions.map((action) => [action.token, action]));
const MAX_HID_CODE = 255;

export function normalizeToken(token: string): string {
  const lower = token.toLowerCase();
  return (data.aliases as Record<string, string>)[lower] ?? lower;
}
export const findAction = (token: string): KeyAction | undefined =>
  actionMap.get(normalizeToken(token));
/** A named action, or a decimal HID usage code written on 2 or 3 digits. */
export function isAction(token: string): boolean {
  return (
    actionMap.has(normalizeToken(token)) ||
    (/^\d{2,3}$/.test(token) && Number(token) <= MAX_HID_CODE)
  );
}
export function findLocation(token: string, family: Family) {
  const lower = token.toLowerCase();
  for (const key of keyboard.keys) {
    if (!key.editable) continue;
    for (const layer of ['top', 'keypad'] as const) {
      if (key.locations[family][layer].toLowerCase() === lower)
        return { key, layer };
    }
  }
  return undefined;
}
export function defaultAction(key: PhysicalKey, family: Family, layer: Layer) {
  return key.defaults[family][layer];
}
export function locationToken(key: PhysicalKey, family: Family, layer: Layer) {
  return key.locations[family][layer];
}
/** Keys whose native action is a modifier (Shift, Ctrl, Alt, Win). */
export const isModifierKey = (key: PhysicalKey, family: Family) =>
  modifiers.includes(key.defaults[family].top);
