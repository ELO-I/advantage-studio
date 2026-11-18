import { useState } from 'react';
import {
  ArrowRight,
  Code2,
  Download,
  History,
  Pencil,
  Redo2,
  Undo2,
  Usb,
} from 'lucide-react';
import {
  familyLabel,
  layers,
  type Layer,
  type PhysicalKey,
} from '../domain/keyboard';
import type { EditInfo, Profile } from '../domain/library';
import { hasErrors, parseLayout } from '../domain/smartset';
import { Keyboard } from '../components/Keyboard';
import { KeyLegend } from '../components/KeyLegend';
import { KeyInspector } from './inspector/KeyInspector';
import { ChangesPanel } from './ChangesPanel';
import { useI18n } from '../i18n/context';

export type EditorDialog = 'rename' | 'device' | 'source' | 'history';

export function EditorView({
  profile,
  canUndo,
  canRedo,
  onEdit,
  onUndo,
  onRedo,
  onExport,
  onOpenDialog,
}: {
  profile: Profile;
  canUndo: boolean;
  canRedo: boolean;
  onEdit: (content: string, info: EditInfo) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onOpenDialog: (dialog: EditorDialog) => void;
}) {
  const { t } = useI18n();
  const [layer, setLayer] = useState<Layer>('top');
  const [selected, setSelected] = useState<PhysicalKey | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showPedals, setShowPedals] = useState(false);
  const parsed = parseLayout(profile.content, profile.family);
  const invalid = hasErrors(parsed);

  /** Actions that rewrite the whole file invalidate the inspector's draft. */
  const deselectThen = (action: () => void) => () => {
    setSelected(null);
    action();
  };
  const openFileDialog = (dialog: 'source' | 'history') =>
    deselectThen(() => onOpenDialog(dialog));

  return (
    <>
      <div className="view-heading editor-heading">
        <div className="title-row">
          <h1 title={profile.name}>{profile.name}</h1>
          <button
            className="icon-button"
            title={t.editor.rename}
            aria-label={t.editor.renameLabel}
            onClick={() => onOpenDialog('rename')}
          >
            <Pencil size={16} />
          </button>
        </div>
        <div className="heading-actions">
          <button
            className="button"
            title={invalid ? t.editor.fixBeforeExport : t.editor.download}
            disabled={invalid}
            onClick={onExport}
          >
            <Download size={16} />
            {t.editor.exportTxt}
          </button>
          <button
            className="button button-primary"
            onClick={() => onOpenDialog('device')}
          >
            <Usb size={16} />
            {t.editor.apply}
          </button>
        </div>
      </div>
      <div className="editor-layout">
        <div className="editor-column">
          <section className="keyboard-panel">
            <div className="panel-top">
              <div>
                <span className="eyebrow">{t.editor.layout}</span>
                <span className="profile-family">
                  {familyLabel(profile.family)}
                </span>
              </div>
              <div className="editor-tools">
                <button
                  className="icon-button"
                  title={t.editor.undo}
                  aria-label={t.editor.undo}
                  disabled={!canUndo}
                  onClick={deselectThen(onUndo)}
                >
                  <Undo2 size={17} />
                </button>
                <button
                  className="icon-button"
                  title={t.editor.redo}
                  aria-label={t.editor.redo}
                  disabled={!canRedo}
                  onClick={deselectThen(onRedo)}
                >
                  <Redo2 size={17} />
                </button>
                <span className="toolbar-separator" />
                <button
                  className="icon-button"
                  title={t.editor.history}
                  aria-label={t.editor.history}
                  onClick={openFileDialog('history')}
                >
                  <History size={17} />
                </button>
                <button
                  className="icon-button"
                  title={t.editor.source}
                  aria-label={t.editor.source}
                  onClick={openFileDialog('source')}
                >
                  <Code2 size={19} />
                </button>
              </div>
            </div>
            <div className="layer-row">
              <div
                className="layer-switch"
                role="tablist"
                aria-label={t.editor.layer}
              >
                {layers.map((item, index) => (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={layer === item}
                    onClick={() => {
                      setLayer(item);
                      setSelected(null);
                    }}
                  >
                    <span>{index}</span>
                    {t.layers[item]}
                  </button>
                ))}
              </div>
              <label className="original-toggle">
                <input
                  type="checkbox"
                  checked={showOriginal}
                  onChange={(event) => setShowOriginal(event.target.checked)}
                />
                {t.editor.nativeLegends}
              </label>
            </div>
            <div className="keyboard-stage">
              <Keyboard
                family={profile.family}
                layer={layer}
                parsed={parsed}
                selected={selected?.id}
                onSelect={setSelected}
                showOriginal={showOriginal}
                showPedals={showPedals}
              />
            </div>
            <div className="keyboard-panel-footer">
              <KeyLegend />
              <label className="pedal-toggle">
                <input
                  type="checkbox"
                  checked={showPedals}
                  onChange={(event) => {
                    setShowPedals(event.target.checked);
                    if (!event.target.checked && selected?.group === 'pedal')
                      setSelected(null);
                  }}
                />
                {t.editor.pedals}
              </label>
            </div>
          </section>
          {invalid && (
            <button
              className="syntax-banner"
              onClick={openFileDialog('source')}
            >
              <Code2 size={19} />
              <div>
                <strong>{t.editor.invalidTitle}</strong>
                <span>{t.editor.invalidText}</span>
              </div>
              <ArrowRight size={18} />
            </button>
          )}
          <ChangesPanel
            family={profile.family}
            layer={layer}
            parsed={parsed}
            onSelect={setSelected}
          />
        </div>
        {selected ? (
          <KeyInspector
            key={`${profile.id}-${layer}-${selected.id}`}
            physicalKey={selected}
            family={profile.family}
            layer={layer}
            content={profile.content}
            parsed={parsed}
            onEdit={onEdit}
            onClose={() => setSelected(null)}
          />
        ) : (
          <aside className="inspector-placeholder">
            <h2>{t.editor.noKeyTitle}</h2>
            <p>{t.editor.noKeyText}</p>
          </aside>
        )}
      </div>
    </>
  );
}
