import { Check, X } from 'lucide-react';
import { useI18n } from '../i18n/context';

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Check size={17} />
      <span>{message}</span>
      <button
        className="icon-button"
        aria-label={t.toast.close}
        onClick={onDismiss}
      >
        <X size={15} />
      </button>
    </div>
  );
}
