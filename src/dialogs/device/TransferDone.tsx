import { Check } from 'lucide-react';
import { reloadShortcut } from '../../domain/smartset';
import { Step } from './Step';
import { useI18n } from '../../i18n/context';

/** Writing is verified; the keyboard still has to reload the file itself. */
export function TransferDone({
  filename,
  backupId,
}: {
  filename: string;
  backupId: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <div className="transfer-success">
        <Check size={28} />
        <div>
          <strong>{filename}</strong>
          <span>{t.device.success}</span>
        </div>
      </div>
      <Step number={1} title={t.device.reloadTitle}>
        {t.device.reloadText} <kbd>{reloadShortcut(filename)}</kbd>.
      </Step>
      <Step number={2} title={t.device.closeTitle}>
        {t.device.closeText} <kbd>Program + F1</kbd>.
      </Step>
      <p className="field-help">{t.device.previous(backupId.slice(0, 8))}</p>
    </>
  );
}
