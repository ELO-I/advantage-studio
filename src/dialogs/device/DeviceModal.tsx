import { useState } from 'react';
import { ArrowRight, Download, LoaderCircle, Usb } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { createProfile, type Profile } from '../../domain/library';
import type { Family } from '../../domain/keyboard';
import { exportLayout, hasErrors, parseLayout } from '../../domain/smartset';
import {
  applyDeviceLayout,
  chooseDevice,
  connectDevice,
  desktop,
  DOWNLOAD_URL,
  type Device,
} from '../../services/platform';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import { useI18n } from '../../i18n/context';
import { useDeviceLayout, useDeviceScan } from './useDevice';
import { DeviceSearch } from './DeviceSearch';
import { TransferSetup } from './TransferSetup';
import { TransferDone } from './TransferDone';

/** Layout files of a family: `qwerty.txt` and hotkey profiles like `a_qwerty.txt`. */
const familyFiles = (device: Device | null, family: Family) =>
  device?.layouts.filter((name) => name.endsWith(`${family}.txt`)) ?? [];

/**
 * Transfer flow: find the v-Drive → choose the file → write → reload on the keyboard.
 * The connected device is lifted to the app so it survives closing this window.
 */
export function DeviceModal({
  profile,
  initialDevice,
  onDevice,
  onClose,
  onImport,
  notify,
}: {
  profile: Profile;
  initialDevice: Device | null;
  onDevice: (device: Device | null) => void;
  onClose: () => void;
  onImport: (profile: Profile) => void;
  notify: (message: string) => void;
}) {
  const { t } = useI18n();
  const [device, setDevice] = useState(initialDevice);
  const [chosenFile, setChosenFile] = useState('');
  const { busy, error, setError, run } = useAsyncTask();
  const [backupId, setBackupId] = useState<string | null>(null);
  const devices = useDeviceScan(desktop && !device, setError);

  const parsed = parseLayout(profile.content, profile.family);
  const targets = familyFiles(device, profile.family);
  const defaultFile = `${profile.family}.txt`;
  const filename = targets.includes(chosenFile)
    ? chosenFile
    : targets.includes(defaultFile)
      ? defaultFile
      : (targets[0] ?? '');
  const current = useDeviceLayout(device, filename, setError);

  const selectDevice = (next: Device | null) => {
    setDevice(next);
    onDevice(next);
  };
  const connect = (root?: string) =>
    run(async () => {
      const found = root
        ? await connectDevice(root)
        : await chooseDevice(t.device.chooseRoot);
      if (found) selectDevice(found);
    });
  const apply = () =>
    run(async () => {
      if (!current) return;
      const result = await applyDeviceLayout(
        filename,
        exportLayout(profile.content),
        current.fingerprint,
      );
      setBackupId(result.backupId);
      notify(t.toast.transferred);
    });
  const importCurrent = () => {
    if (!current) return;
    onImport(
      createProfile(
        t.device.profileName(filename),
        profile.family,
        current.content,
      ),
    );
    onClose();
  };

  const transferred = backupId !== null;
  const canApply =
    !busy && Boolean(current) && Boolean(filename) && !hasErrors(parsed);

  return (
    <Modal
      title={transferred ? t.device.titleDone : t.device.title}
      description={
        transferred ? t.device.descriptionDone : t.device.description
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {!desktop ? (
        <div className="empty-panel">
          <Usb size={32} />
          <h3>{t.device.desktopTitle}</h3>
          <p>{t.device.desktopText}</p>
          <a
            className="button button-primary"
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} />
            {t.device.desktopDownload}
          </a>
          <p>{t.device.desktopManual}</p>
        </div>
      ) : transferred ? (
        <TransferDone filename={filename} backupId={backupId} />
      ) : !device ? (
        <DeviceSearch
          devices={devices}
          busy={busy}
          onConnect={(root) => void connect(root)}
        />
      ) : (
        <TransferSetup
          device={device}
          profile={profile}
          parsed={parsed}
          targets={targets}
          filename={filename}
          canImport={Boolean(current)}
          busy={busy}
          onFilename={(name) => {
            setChosenFile(name);
            setError('');
          }}
          onDisconnect={() => selectDevice(null)}
          onImportCurrent={importCurrent}
        />
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}{' '}
          <button className="text-button" onClick={() => selectDevice(null)}>
            {t.device.reconnect}
          </button>
        </p>
      )}
      <div className="modal-actions">
        <button className="button" disabled={busy} onClick={onClose}>
          {transferred ? t.device.done : t.modal.closeButton}
        </button>
        {desktop && device && !transferred && (
          <button
            className="button button-primary"
            disabled={!canApply}
            onClick={() => void apply()}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
            {busy ? t.device.transferring : t.device.apply}
          </button>
        )}
      </div>
    </Modal>
  );
}
