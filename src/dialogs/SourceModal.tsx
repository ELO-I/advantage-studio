import { useState } from 'react';
import { Check, FileCode2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Diagnostics } from '../components/Diagnostics';
import { familyLabel } from '../domain/keyboard';
import type { Profile } from '../domain/library';
import { parseLayout } from '../domain/smartset';
import { useI18n } from '../i18n/context';

/** Raw SmartSet editor, for lines the visual editor cannot express. */
export function SourceModal({
  profile,
  onClose,
  onSave,
}: {
  profile: Profile;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const { t } = useI18n();
  const [content, setContent] = useState(profile.content);
  const parsed = parseLayout(content, profile.family);
  return (
    <Modal
      title={t.source.title}
      description={t.source.description(familyLabel(profile.family))}
      onClose={onClose}
      wide
    >
      <div className="source-heading">
        <span>
          <FileCode2 size={16} />
          {profile.family}.txt
        </span>
        <span>{t.source.rules(parsed.rules.length)}</span>
      </div>
      <textarea
        aria-label={t.source.code}
        className="source-editor"
        rows={16}
        value={content}
        spellCheck={false}
        onChange={(event) => setContent(event.target.value)}
      />
      <Diagnostics issues={parsed.diagnostics} />
      <p className="field-help">
        {t.source.remap} <code>[caps]&gt;[lctrl]</code> · {t.source.macro}{' '}
        <code>{'{a}>{-lctrl}{c}{+lctrl}'}</code> · {t.source.disable}{' '}
        <code>*</code>
      </p>
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          {t.modal.cancel}
        </button>
        <button
          className="button button-primary"
          disabled={content === profile.content}
          onClick={() => {
            onSave(content);
            onClose();
          }}
        >
          <Check size={16} />
          {t.modal.save}
        </button>
      </div>
    </Modal>
  );
}
