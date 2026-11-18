import { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../components/Modal';
import { LIMITS, type Profile } from '../domain/library';
import { useI18n } from '../i18n/context';

export function RenameModal({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  return (
    <Modal
      title={t.rename.title}
      description={t.rename.description}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name.trim(), description.trim());
          onClose();
        }}
      >
        <label className="field">
          <span>{t.rename.name}</span>
          <input
            required
            maxLength={LIMITS.nameLength}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t.rename.descriptionLabel}</span>
          <textarea
            maxLength={LIMITS.descriptionLength}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="modal-actions">
          <button className="button" type="button" onClick={onClose}>
            {t.modal.cancel}
          </button>
          <button className="button button-primary" disabled={!name.trim()}>
            <Check size={16} />
            {t.modal.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
