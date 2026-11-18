import { useState } from 'react';
import { Keyboard, LoaderCircle, ShieldCheck } from 'lucide-react';
import { createLibrary, type Library } from '../domain/library';
import { ImportModal } from '../dialogs/ImportModal';
import { useI18n } from '../i18n/context';
import type { StorageError } from '../hooks/useLibrary';

export function LoadingScreen() {
  const { t } = useI18n();
  return (
    <div className="app-loading">
      <Keyboard size={38} />
      <h1>Advantage Studio</h1>
      <LoaderCircle className="spin" size={20} />
      <p>{t.app.loading}</p>
    </div>
  );
}

/** The stored library could not be read: it is kept untouched until the user decides. */
export function LibraryFailureScreen({
  error,
  onReplace,
}: {
  error: StorageError | null;
  onReplace: (library: Library) => void;
}) {
  const { t, storageErrorMessage } = useI18n();
  const [importing, setImporting] = useState(false);
  const startEmpty = () => {
    if (window.confirm(t.app.confirmEmpty))
      onReplace(createLibrary(t.app.defaultProfileName));
  };
  return (
    <div className="app-loading">
      <ShieldCheck size={35} />
      <h1>{t.app.failureTitle}</h1>
      {error && <p className="inline-error">{storageErrorMessage(error)}</p>}
      <button className="button" onClick={() => setImporting(true)}>
        {t.app.importLibrary}
      </button>
      <p>{t.app.emptyAdvice}</p>
      <button className="text-button" onClick={startEmpty}>
        {t.app.createEmpty}
      </button>
      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={(profiles) =>
            onReplace({ version: 1, selectedId: profiles[0].id, profiles })
          }
        />
      )}
    </div>
  );
}
