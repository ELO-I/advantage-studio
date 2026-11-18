import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import {
  fromPreset,
  LIMITS,
  presets,
  type PresetId,
  type Profile,
} from '../domain/library';
import { useI18n } from '../i18n/context';

export function NewProfileModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (profile: Profile) => void;
}) {
  const { t } = useI18n();
  const [preset, setPreset] = useState<PresetId>('qwerty');
  const [name, setName] = useState(t.newProfile.defaultName);
  return (
    <Modal
      title={t.newProfile.title}
      description={t.newProfile.description}
      onClose={onClose}
    >
      <div className="preset-list">
        {presets.map((item) => (
          <button
            className={preset === item.id ? 'selected' : ''}
            key={item.id}
            onClick={() => setPreset(item.id)}
          >
            <div>
              <strong>{item.name}</strong>
              <p>{t.newProfile.presets[item.id]}</p>
            </div>
            <span className="radio-indicator">
              {preset === item.id && <Check size={14} />}
            </span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(
            fromPreset(preset, name.trim(), t.newProfile.presets[preset]),
          );
          onClose();
        }}
      >
        <label className="field">
          <span>{t.newProfile.name}</span>
          <input
            maxLength={LIMITS.nameLength}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="button" onClick={onClose}>
            {t.modal.cancel}
          </button>
          <button className="button button-primary" disabled={!name.trim()}>
            <Plus size={16} />
            {t.newProfile.create}
          </button>
        </div>
      </form>
    </Modal>
  );
}
