/** The user's configuration library: profiles, their history and limits. */
import { z } from 'zod';
import { type Family, keyboard, locationToken } from './keyboard';
import { MAX_LAYOUT_BYTES, setAssignment } from './smartset';

export const LIMITS = {
  nameLength: 80,
  descriptionLength: 400,
  historyLength: 50,
  profiles: 200,
  /** Mirrored in the Rust backend. */
  libraryBytes: 64 * 1024 * 1024,
} as const;

/** Kinds of change recorded in the history; their wording lives in `src/i18n`. */
export const changes = [
  'edit',
  'editKey',
  'resetKey',
  'deleteMacro',
  'editSource',
  'restore',
  'redo',
] as const;
export type Change = (typeof changes)[number];
const snapshotSchema = z.object({
  id: z.string(),
  date: z.string(),
  content: z.string(),
  /** A `Change`. Free text in libraries written before it existed. */
  label: z.string(),
  /** Physical key of an `editKey` / `resetKey` change. */
  key: z.string().optional(),
});
export const profileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(LIMITS.nameLength),
  description: z.string().max(LIMITS.descriptionLength),
  family: z.enum(['qwerty', 'dvorak']),
  content: z.string().max(MAX_LAYOUT_BYTES),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(snapshotSchema).max(LIMITS.historyLength),
});
export const librarySchema = z
  .object({
    version: z.literal(1),
    selectedId: z.string(),
    profiles: z.array(profileSchema).min(1).max(LIMITS.profiles),
  })
  .superRefine((value, ctx) => {
    const ids = new Set(value.profiles.map((profile) => profile.id));
    if (ids.size !== value.profiles.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate profile identifiers.',
      });
    if (!ids.has(value.selectedId))
      ctx.addIssue({
        code: 'custom',
        message: 'Selected profile not found.',
      });
  });
export type Profile = z.infer<typeof profileSchema>;
export type Library = z.infer<typeof librarySchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;

export function createProfile(
  name: string,
  family: Family,
  content = '',
  description = '',
): Profile {
  const date = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    family,
    content,
    description,
    createdAt: date,
    updatedAt: date,
    history: [],
  };
}
export function createLibrary(profileName: string): Library {
  const profile = createProfile(profileName, 'qwerty');
  return { version: 1, selectedId: profile.id, profiles: [profile] };
}

/* ---------- History ---------- */

/** What an edit did, e.g. `{ change: 'editKey', key: 'caps' }`. */
export interface EditInfo {
  change: Change;
  key?: string;
}

/** Saves the current content as a restorable version. */
export function checkpoint(
  profile: Profile,
  { change, key }: EditInfo,
): Profile {
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    content: profile.content,
    label: change,
    ...(key && { key }),
  };
  return {
    ...profile,
    history: [snapshot, ...profile.history].slice(0, LIMITS.historyLength),
  };
}
export const recordEdit = (
  profile: Profile,
  content: string,
  info: EditInfo,
): Profile => ({ ...checkpoint(profile, info), content });

/** Returns to the latest version and drops it from the history. */
export function undoEdit(profile: Profile): Profile {
  const [previous, ...older] = profile.history;
  if (!previous) return profile;
  return { ...profile, content: previous.content, history: older };
}

/* ---------- Library operations ---------- */

export const exceedsProfileLimit = (library: Library, added: number) =>
  library.profiles.length + added > LIMITS.profiles;
/** Appends profiles and selects the first one. */
export function addProfiles(library: Library, profiles: Profile[]): Library {
  return {
    ...library,
    selectedId: profiles[0].id,
    profiles: [...library.profiles, ...profiles],
  };
}
/** Removes a profile; the library always keeps at least one. */
export function removeProfile(library: Library, id: string): Library {
  const profiles = library.profiles.filter((profile) => profile.id !== id);
  if (!profiles.length) return library;
  return {
    ...library,
    profiles,
    selectedId: library.selectedId === id ? profiles[0].id : library.selectedId,
  };
}
/** `copySuffix` is appended to the name, which is shortened to fit. */
export const duplicateProfile = (
  source: Profile,
  copySuffix: string,
): Profile =>
  createProfile(
    source.name.slice(0, LIMITS.nameLength - copySuffix.length) + copySuffix,
    source.family,
    source.content,
    source.description,
  );
/** Imported profiles get new identities so they never collide. */
export const reidentify = (profiles: Profile[]): Profile[] =>
  profiles.map((profile) => ({ ...profile, id: crypto.randomUUID() }));

/* ---------- Presets ---------- */

/** Starting layouts; their descriptions live in `src/i18n`. */
export const presets = [
  { id: 'qwerty', name: 'QWERTY', family: 'qwerty' },
  { id: 'dvorak', name: 'Dvorak', family: 'dvorak' },
  { id: 'colemak', name: 'Colemak', family: 'qwerty' },
] as const;
export type PresetId = (typeof presets)[number]['id'];

const QWERTY_LETTERS = 'qwertyuiopasdfghjkl;zxcvbnm';
const COLEMAK_LETTERS = 'qwfpgjluy;arstdhneiozxcvbkm';

/** Colemak is written as remaps of the QWERTY family, on both layers. */
function colemakContent(): string {
  let content = '';
  [...QWERTY_LETTERS].forEach((qwerty, index) => {
    const colemak = COLEMAK_LETTERS[index];
    if (qwerty === colemak) return;
    const key = keyboard.keys.find((key) => key.id === qwerty)!;
    for (const layer of ['top', 'keypad'] as const)
      content = setAssignment(
        content,
        'qwerty',
        locationToken(key, 'qwerty', layer),
        { kind: 'remap', action: colemak },
      );
  });
  return content;
}

export function fromPreset(
  id: PresetId,
  name: string,
  description = '',
): Profile {
  const preset = presets.find((preset) => preset.id === id)!;
  const content = id === 'colemak' ? colemakContent() : '';
  return createProfile(name, preset.family, content, description);
}
