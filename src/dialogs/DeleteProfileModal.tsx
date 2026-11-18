import { Modal } from '../components/Modal';
import type { Profile } from '../domain/library';
import { useI18n } from '../i18n/context';

export function DeleteProfileModal({
  profile,
  onDelete,
  onClose,
}: {
  profile: Profile;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      title={t.deleteProfile.title(profile.name)}
      description={t.deleteProfile.description}
      onClose={onClose}
    >
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          {t.modal.cancel}
        </button>
        <button
          className="button button-danger"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          {t.deleteProfile.confirm}
        </button>
      </div>
    </Modal>
  );
}
