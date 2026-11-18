import { useEffect, useRef, useState } from 'react';
import { loadLibrary, saveLibrary } from '../services/platform';
import { createLibrary, type Library, type Profile } from '../domain/library';
import { useI18n } from '../i18n/context';

export type SaveState = 'saved' | 'saving' | 'error';
/** Kept as data so the message follows the interface language. */
export type StorageError = { operation: 'load' | 'save'; cause: unknown };

/**
 * Loads the library once, then persists every change in order:
 * a slow save can never overwrite a more recent state.
 */
export function useLibrary() {
  const { t } = useI18n();
  const [library, setLibrary] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
  /** Only the first load names the default profile: no reload on language change. */
  const defaultName = useRef(t.app.defaultProfileName);
  const queue = useRef(Promise.resolve());
  const latest = useRef<Library | null>(null);

  useEffect(() => {
    let active = true;
    loadLibrary()
      .then((loaded) => {
        if (!active) return;
        const current = loaded ?? createLibrary(defaultName.current);
        latest.current = current;
        setLibrary(current);
      })
      .catch((cause: unknown) => {
        if (active) setStorageError({ operation: 'load', cause });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const replace = (next: Library) => {
    latest.current = next;
    setLibrary(next);
    setSaving(true);
    queue.current = queue.current.then(async () => {
      try {
        await saveLibrary(next);
        if (latest.current === next) setSaving(false);
        setStorageError(null);
      } catch (cause) {
        setStorageError({ operation: 'save', cause });
      }
    });
  };
  const update = (transform: (library: Library) => Library) => {
    if (latest.current) replace(transform(latest.current));
  };
  const updateProfile = (
    id: string,
    transform: (profile: Profile) => Profile,
  ) =>
    update((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === id
          ? { ...transform(profile), updatedAt: new Date().toISOString() }
          : profile,
      ),
    }));

  const saveState: SaveState = storageError
    ? 'error'
    : saving
      ? 'saving'
      : 'saved';
  return {
    library,
    loading,
    storageError,
    saveState,
    update,
    updateProfile,
    replace,
  };
}
