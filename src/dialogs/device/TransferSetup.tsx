import { RefreshCw, ShieldCheck, Usb } from 'lucide-react';
import { Diagnostics } from '../../components/Diagnostics';
import { familyLabel } from '../../domain/keyboard';
import type { Profile } from '../../domain/library';
import type { ParsedLayout } from '../../domain/smartset';
import type { Device } from '../../services/platform';
import { useI18n } from '../../i18n/context';

/** Connected keyboard: choose the file to overwrite and review the transfer. */
export function TransferSetup({
  device,
  profile,
  parsed,
  targets,
  filename,
  canImport,
  busy,
  onFilename,
  onDisconnect,
  onImportCurrent,
}: {
  device: Device;
  profile: Profile;
  parsed: ParsedLayout;
  /** Existing layout files of the profile's family. */
  targets: string[];
  filename: string;
  canImport: boolean;
  busy: boolean;
  onFilename: (filename: string) => void;
  onDisconnect: () => void;
  onImportCurrent: () => void;
}) {
  const { t } = useI18n();
  const family = familyLabel(profile.family);
  return (
    <>
      <div className="connected-device">
        <Usb size={24} />
        <div>
          <strong>{device.name}</strong>
          <span>{device.version}</span>
          <small>{device.root}</small>
        </div>
        <button
          className="icon-button"
          aria-label={t.device.searchAgain}
          disabled={busy}
          onClick={onDisconnect}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <label className="field">
        <span>{t.device.file}</span>
        <select
          value={filename}
          disabled={busy}
          onChange={(event) => onFilename(event.target.value)}
        >
          {targets.map((target) => (
            <option key={target} value={target}>
              {target}
            </option>
          ))}
        </select>
      </label>
      {!targets.length && (
        <p className="inline-error">{t.device.noFile(family)}</p>
      )}
      <div className="transfer-summary">
        <span>{t.device.summary.configuration}</span>
        <strong>{profile.name}</strong>
        <span>{t.device.summary.family}</span>
        <strong>{family}</strong>
        <span>{t.device.summary.rules}</span>
        <strong>{parsed.rules.length}</strong>
        <span>{t.device.summary.backup}</span>
        <strong>
          <ShieldCheck size={14} />
          {t.device.summary.automatic}
        </strong>
      </div>
      <Diagnostics issues={parsed.diagnostics} />
      <p className="field-help">{t.device.hotkeyHelp}</p>
      <button
        className="text-button"
        disabled={!canImport || busy}
        onClick={onImportCurrent}
      >
        {t.device.importCurrent}
      </button>
    </>
  );
}
