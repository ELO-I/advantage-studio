import { useState } from 'react';
import {
  Check,
  CornerDownLeft,
  Fingerprint,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';
import {
  defaultAction,
  isModifierKey,
  locationToken,
  type Family,
  type Layer,
  type PhysicalKey,
} from '../../domain/keyboard';
import {
  formatMacroSequence,
  parseMacroSequence,
  removeLocation,
  setAssignment,
  type Assignment,
  type ParsedLayout,
} from '../../domain/smartset';
import { assignKey, bindingAt, type BindingKind } from '../../domain/binding';
import type { EditInfo } from '../../domain/library';
import { useI18n } from '../../i18n/context';
import { RemapPanel } from './RemapPanel';
import { TapHoldPanel, type TapHoldDraft } from './TapHoldPanel';
import { MacroPanel, type MacroDraft } from './MacroPanel';

/** Each mode keeps its own draft, so switching tabs never loses input. */
interface Draft {
  remap: string;
  tapHold: TapHoldDraft;
  macro: MacroDraft;
}
type Feedback = { tone: 'error' | 'success'; message: string };

const DEFAULT_TAP_HOLD: TapHoldDraft = {
  tap: 'escape',
  hold: 'lctrl',
  delay: 250,
};
const MODES: { id: BindingKind; Icon: typeof Zap }[] = [
  { id: 'remap', Icon: CornerDownLeft },
  { id: 'tapHold', Icon: Fingerprint },
  { id: 'macro', Icon: Zap },
];

function initialDraft(nativeAction: string, current?: Assignment): Draft {
  return {
    remap: current?.kind === 'remap' ? current.action : nativeAction,
    tapHold:
      current?.kind === 'tapHold'
        ? { tap: current.tap, hold: current.hold, delay: current.delay }
        : DEFAULT_TAP_HOLD,
    macro:
      current?.kind === 'macro'
        ? {
            coTriggers: current.triggers.slice(0, -1),
            sequence: formatMacroSequence(current.sequence),
          }
        : { coTriggers: [], sequence: '' },
  };
}

export function KeyInspector({
  physicalKey,
  family,
  layer,
  content,
  parsed,
  onEdit,
  onClose,
}: {
  physicalKey: PhysicalKey;
  family: Family;
  layer: Layer;
  content: string;
  parsed: ParsedLayout;
  onEdit: (content: string, info: EditInfo) => void;
  onClose: () => void;
}) {
  const { t, actionLabel, actionName, diagnostic } = useI18n();
  const location = locationToken(physicalKey, family, layer);
  const nativeAction = defaultAction(physicalKey, family, layer);
  const binding = bindingAt(parsed, location);
  const current = binding.primary?.assignment;
  const macros = binding.rules.flatMap((rule) =>
    rule.assignment.kind === 'macro' ? [rule.assignment] : [],
  );
  const isModifier = isModifierKey(physicalKey, family);
  const keyName = actionLabel(physicalKey.defaults[family].top);
  /** History entries name the key by its native action, in any language. */
  const keyEdit = (change: 'editKey' | 'resetKey'): EditInfo => ({
    change,
    key: physicalKey.defaults[family].top,
  });

  const [mode, setMode] = useState<BindingKind>(current?.kind ?? 'remap');
  const [draft, setDraft] = useState(() => initialDraft(nativeAction, current));
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const updateDraft = <Part extends keyof Draft>(
    part: Part,
    value: Draft[Part],
  ) => {
    setDraft((previous) => ({ ...previous, [part]: value }));
    setFeedback(null);
  };
  const fail = (message: string) => setFeedback({ tone: 'error', message });

  const draftAssignment = (): Assignment | null => {
    if (mode === 'remap') return { kind: 'remap', action: draft.remap };
    if (mode === 'tapHold') return { kind: 'tapHold', ...draft.tapHold };
    const sequence = parseMacroSequence(draft.macro.sequence);
    if (!sequence) return null;
    return {
      kind: 'macro',
      triggers: [...draft.macro.coTriggers, location],
      sequence,
    };
  };
  const save = () => {
    const assignment = draftAssignment();
    if (!assignment) {
      fail(t.inspector.macroSyntax);
      return;
    }
    const result = assignKey({
      content,
      family,
      key: physicalKey,
      layer,
      assignment,
      previous: current,
    });
    if (!result.ok) {
      fail(diagnostic(result.error));
      return;
    }
    onEdit(result.content, keyEdit('editKey'));
    setFeedback({ tone: 'success', message: t.inspector.saved });
  };
  const loadMacro = (macro: Extract<Assignment, { kind: 'macro' }>) => {
    setMode('macro');
    updateDraft('macro', initialDraft(nativeAction, macro).macro);
  };
  const deleteMacro = (macro: Extract<Assignment, { kind: 'macro' }>) =>
    onEdit(setAssignment(content, family, location, null, macro.triggers), {
      change: 'deleteMacro',
    });
  const reset = () => {
    onEdit(removeLocation(content, family, location), keyEdit('resetKey'));
    onClose();
  };

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <span className="eyebrow">{t.inspector.title}</span>
        <button
          className="icon-button"
          aria-label={t.inspector.close}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="selected-key-summary">
        <div className="key-preview">{keyName}</div>
        <div>
          <h2>{actionName(physicalKey.defaults[family].top)}</h2>
          <span>{t.inspector.layer[layer]}</span>
          <code>{location}</code>
        </div>
      </div>
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label={t.inspector.actionType}
      >
        {MODES.map(({ id, Icon }) => (
          <button
            role="tab"
            key={id}
            aria-selected={mode === id}
            disabled={id === 'macro' && isModifier}
            onClick={() => {
              setMode(id);
              setFeedback(null);
            }}
          >
            <Icon size={15} />
            {t.inspector.modes[id]}
          </button>
        ))}
      </div>
      <div className={`inspector-body inspector-body-${mode}`}>
        {mode === 'remap' && (
          <RemapPanel
            nativeAction={nativeAction}
            action={draft.remap}
            onChange={(action) => updateDraft('remap', action)}
          />
        )}
        {mode === 'tapHold' && (
          <TapHoldPanel
            value={draft.tapHold}
            onChange={(value) => updateDraft('tapHold', value)}
          />
        )}
        {mode === 'macro' && (
          <MacroPanel
            family={family}
            layer={layer}
            value={draft.macro}
            onChange={(value) => updateDraft('macro', value)}
            macros={macros}
            onLoad={loadMacro}
            onDelete={deleteMacro}
            onError={fail}
          />
        )}
        {isModifier && <p className="field-help">{t.inspector.modifierHelp}</p>}
        {feedback?.tone === 'error' && (
          <p className="inline-error" role="alert">
            {feedback.message}
          </p>
        )}
        {feedback?.tone === 'success' && (
          <p className="inline-success" role="status">
            <Check size={15} />
            {feedback.message}
          </p>
        )}
      </div>
      <div className="inspector-footer">
        <button className="button button-primary" onClick={save}>
          <Check size={16} />
          {t.inspector.save}
        </button>
        <button
          className="text-button"
          disabled={!binding.rules.length}
          onClick={reset}
        >
          <RotateCcw size={14} />
          {t.inspector.reset}
        </button>
      </div>
    </aside>
  );
}
