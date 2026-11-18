import { useState } from 'react';
import { ArrowDownToLine, Check } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Diagnostics } from '../components/Diagnostics';
import {
  createProfile,
  librarySchema,
  LIMITS,
  reidentify,
  type Profile,
} from '../domain/library';
import { familyOfFile, parseLayout, stripBom } from '../domain/smartset';
import type { Family } from '../domain/keyboard';
import { useI18n } from '../i18n/context';

/** A SmartSet `.txt` file becomes one profile; a `.json` library adds all of its profiles. */
export function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (profiles: Profile[]) => void;
}) {
  const { t, errorMessage } = useI18n();
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [family, setFamily] = useState<Family>('qwerty');
  const [name, setName] = useState(t.importer.defaultName);
  const [error, setError] = useState('');
  const [libraryProfiles, setLibraryProfiles] = useState<Profile[] | null>(
    null,
  );
  const parsed = parseLayout(text, family);

  const readFile = async (file?: File) => {
    if (!file) return;
    if (file.size > LIMITS.libraryBytes) {
      setError(t.importer.tooLarge);
      return;
    }
    try {
      const content = await file.text();
      setFilename(file.name);
      setName(file.name.replace(/\.txt$/i, ''));
      setError('');
      if (file.name.endsWith('.json')) {
        const library = librarySchema.parse(JSON.parse(content));
        setLibraryProfiles(reidentify(library.profiles));
        setText('');
      } else {
        setLibraryProfiles(null);
        setText(stripBom(content));
        setFamily(familyOfFile(file.name));
      }
    } catch (error) {
      setLibraryProfiles(null);
      setError(t.importer.failed(errorMessage(error)));
    }
  };
  const confirm = () => {
    onImport(libraryProfiles ?? [createProfile(name.trim(), family, text)]);
    onClose();
  };

  return (
    <Modal
      title={t.importer.title}
      description={t.importer.description}
      onClose={onClose}
      wide
    >
      <label
        className="upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void readFile(event.dataTransfer.files[0]);
        }}
      >
        <ArrowDownToLine size={26} />
        <strong>{filename || t.importer.drop}</strong>
        <span>{t.importer.browse}</span>
        <input
          type="file"
          accept=".txt,.json"
          onChange={(event) => {
            void readFile(event.target.files?.[0]);
          }}
        />
      </label>
      {libraryProfiles ? (
        <p className="inline-success">
          <Check size={16} />
          {t.importer.libraryCount(libraryProfiles.length)}
        </p>
      ) : (
        <>
          <div className="form-row">
            <label className="field">
              <span>{t.importer.name}</span>
              <input
                maxLength={LIMITS.nameLength}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.importer.family}</span>
              <select
                value={family}
                onChange={(event) => setFamily(event.target.value as Family)}
              >
                <option value="qwerty">QWERTY</option>
                <option value="dvorak">Dvorak</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>{t.importer.paste}</span>
            <textarea
              rows={7}
              className="code-input"
              spellCheck={false}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="[caps]>[lctrl]"
            />
          </label>
          <Diagnostics issues={parsed.diagnostics} />
          <p className="field-help">{t.importer.keptLines}</p>
        </>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="button" onClick={onClose}>
          {t.modal.cancel}
        </button>
        <button
          className="button button-primary"
          disabled={Boolean(error) || (!libraryProfiles && !name.trim())}
          onClick={confirm}
        >
          <ArrowDownToLine size={16} />
          {libraryProfiles
            ? t.importer.importCount(libraryProfiles.length)
            : t.importer.import}
        </button>
      </div>
    </Modal>
  );
}
