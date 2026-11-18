import { useEffect, useState } from 'react';
import { ArchiveRestore, ArrowDownToLine } from 'lucide-react';
import { Modal } from '../components/Modal';
import { createProfile, type Profile } from '../domain/library';
import { familyOfFile } from '../domain/smartset';
import { useAsyncTask } from '../hooks/useAsyncTask';
import { useI18n } from '../i18n/context';
import {
  desktop,
  download,
  listBackups,
  readBackup,
  type Backup,
} from '../services/platform';

export function BackupModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (profile: Profile) => void;
}) {
  const { t, errorMessage, formatDate } = useI18n();
  const [backups, setBackups] = useState<Backup[]>([]);
  const { busy, error, setError, run } = useAsyncTask();
  useEffect(() => {
    if (desktop)
      void listBackups()
        .then(setBackups)
        .catch((error: unknown) => setError(errorMessage(error)));
  }, [setError, errorMessage]);
  const saveCopy = (backup: Backup) =>
    run(async () => {
      await download(
        await readBackup(backup.id),
        `backup-${backup.filename}`,
        t.files.smartset,
      );
    });
  const restore = (backup: Backup) =>
    run(async () => {
      const content = await readBackup(backup.id);
      onImport(
        createProfile(
          t.backups.profileName(backup.filename),
          familyOfFile(backup.filename),
          content,
        ),
      );
      onClose();
    });
  return (
    <Modal
      title={t.backups.title}
      description={t.backups.description}
      onClose={onClose}
      wide
    >
      {!backups.length && (
        <div className="empty-panel">
          <ArchiveRestore size={32} />
          <h3>{desktop ? t.backups.firstTransfer : t.backups.desktopOnly}</h3>
          <p>{t.backups.separate}</p>
        </div>
      )}
      <div className="backup-list">
        {backups.map((backup) => (
          <div key={backup.id}>
            <ArchiveRestore size={20} />
            <div>
              <strong>{backup.filename}</strong>
              <span>
                {formatDate(backup.date)} · {backup.deviceName}
              </span>
            </div>
            <button
              className="icon-button"
              title={t.backups.download}
              aria-label={t.backups.downloadLabel(backup.filename)}
              disabled={busy}
              onClick={() => {
                void saveCopy(backup);
              }}
            >
              <ArrowDownToLine size={16} />
            </button>
            <button
              className="button button-small"
              disabled={busy}
              onClick={() => {
                void restore(backup);
              }}
            >
              {t.backups.restore}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          {t.modal.closeButton}
        </button>
      </div>
    </Modal>
  );
}
