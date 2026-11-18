import { useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { Modal } from '../components/Modal';
import { LIMITS, type Profile } from '../domain/library';
import { useI18n } from '../i18n/context';

export function HistoryModal({
  profile,
  onClose,
  onRestore,
}: {
  profile: Profile;
  onClose: () => void;
  onRestore: (content: string) => void;
}) {
  const { t, formatDate, historyLabel } = useI18n();
  const [selected, setSelected] = useState(profile.history[0]?.id);
  const snapshot = profile.history.find((item) => item.id === selected);
  return (
    <Modal
      title={t.history.title}
      description={t.history.description(LIMITS.historyLength)}
      onClose={onClose}
      wide
    >
      {profile.history.length === 0 ? (
        <div className="empty-panel">
          <History size={32} />
          <h3>{t.history.emptyTitle}</h3>
          <p>{t.history.emptyText}</p>
        </div>
      ) : (
        <div className="history-layout">
          <div className="history-list">
            {profile.history.map((item) => (
              <button
                key={item.id}
                className={selected === item.id ? 'selected' : ''}
                onClick={() => setSelected(item.id)}
              >
                <RotateCcw size={15} />
                <div>
                  <strong>{historyLabel(item)}</strong>
                  <span>{formatDate(item.date)}</span>
                </div>
              </button>
            ))}
          </div>
          <pre className="history-preview">
            {snapshot?.content || t.history.native}
          </pre>
        </div>
      )}
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          {t.modal.closeButton}
        </button>
        <button
          className="button button-primary"
          disabled={!snapshot || snapshot.content === profile.content}
          onClick={() => {
            if (snapshot) onRestore(snapshot.content);
            onClose();
          }}
        >
          <RotateCcw size={16} />
          {t.history.restore}
        </button>
      </div>
    </Modal>
  );
}
