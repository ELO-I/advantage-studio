import { ArrowRight, FolderOpen, Usb } from 'lucide-react';
import type { Device } from '../../services/platform';
import { Step } from './Step';
import { useI18n } from '../../i18n/context';

/** Guides the user to mount the v-Drive, then lists the detected keyboards. */
export function DeviceSearch({
  devices,
  busy,
  onConnect,
}: {
  devices: Device[];
  busy: boolean;
  /** Without a root, the user picks the drive in a folder dialog. */
  onConnect: (root?: string) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <Step number={1} title={t.device.powerUserTitle}>
        <kbd>{t.device.powerUserKeys}</kbd>
        {t.device.powerUserText}
      </Step>
      <Step number={2} title={t.device.openDriveTitle}>
        <kbd>Program + F1</kbd>
        {t.device.openDriveText}
      </Step>
      <div className="device-detection">
        <span className="status-dot" />
        <strong>
          {devices.length ? t.device.available : t.device.waiting}
        </strong>
        <span>ADVANTAGE2 / KINESIS KB</span>
      </div>
      {devices.map((device) => (
        <button
          key={device.root}
          className="detected-device"
          disabled={busy}
          onClick={() => onConnect(device.root)}
        >
          <Usb size={20} />
          <div>
            <strong>{device.name}</strong>
            <span>{device.root}</span>
          </div>
          <ArrowRight size={18} />
        </button>
      ))}
      <button
        className="button full-width"
        disabled={busy}
        onClick={() => onConnect()}
      >
        <FolderOpen size={16} />
        {t.device.selectManually}
      </button>
    </>
  );
}
