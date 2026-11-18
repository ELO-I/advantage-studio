import { useState } from 'react';
import { X } from 'lucide-react';
import {
  isModifierKey,
  keyboard,
  locationToken,
  type Family,
  type Layer,
} from '../../domain/keyboard';
import {
  formatMacroSequence,
  MAX_CO_TRIGGERS,
  textMacro,
  type Assignment,
} from '../../domain/smartset';
import { useI18n } from '../../i18n/context';
import type { Messages } from '../../i18n/en';

export interface MacroDraft {
  coTriggers: string[];
  /** SmartSet token list as typed by the user, e.g. `{-lctrl}{c}{+lctrl}`. */
  sequence: string;
}
type Macro = Extract<Assignment, { kind: 'macro' }>;

const QUICK_SEQUENCES: {
  id: string;
  label: (t: Messages) => string;
  append: boolean;
  tokens: string[];
}[] = [
  {
    id: 'copy',
    label: (t) => t.inspector.quick.copy,
    append: false,
    tokens: ['-lctrl', 'c', '+lctrl'],
  },
  {
    id: 'paste',
    label: (t) => t.inspector.quick.paste,
    append: false,
    tokens: ['-lctrl', 'v', '+lctrl'],
  },
  { id: 'd125', label: () => '+ 125 ms', append: true, tokens: ['d125'] },
  { id: 'd500', label: () => '+ 500 ms', append: true, tokens: ['d500'] },
];

export function MacroPanel({
  family,
  layer,
  value,
  onChange,
  macros,
  onLoad,
  onDelete,
  onError,
}: {
  family: Family;
  layer: Layer;
  value: MacroDraft;
  onChange: (value: MacroDraft) => void;
  /** Macros already defined on this key, with or without co-triggers. */
  macros: Macro[];
  onLoad: (macro: Macro) => void;
  onDelete: (macro: Macro) => void;
  onError: (message: string) => void;
}) {
  const { t, actionLabel } = useI18n();
  const [text, setText] = useState('');
  const modifierKeys = keyboard.keys.filter((key) =>
    isModifierKey(key, family),
  );
  const toggleCoTrigger = (token: string) =>
    onChange({
      ...value,
      coTriggers: value.coTriggers.includes(token)
        ? value.coTriggers.filter((item) => item !== token)
        : [...value.coTriggers, token],
    });
  const convertText = () => {
    const converted = textMacro(text);
    if (converted.unsupported.length)
      onError(t.inspector.unsupported(converted.unsupported.join(' ')));
    else
      onChange({ ...value, sequence: formatMacroSequence(converted.sequence) });
  };

  return (
    <>
      <p className="inspector-intro">{t.inspector.macroIntro}</p>
      <span className="field-label">
        {t.inspector.coTriggers}{' '}
        <small>{t.inspector.coTriggersHint(MAX_CO_TRIGGERS)}</small>
      </span>
      <div className="modifier-grid">
        {modifierKeys.map((key) => {
          const token = locationToken(key, family, layer);
          const active = value.coTriggers.includes(token);
          return (
            <button
              key={key.id}
              aria-pressed={active}
              disabled={!active && value.coTriggers.length === MAX_CO_TRIGGERS}
              onClick={() => toggleCoTrigger(token)}
            >
              {actionLabel(key.defaults[family].top)}
              <small>
                {key.id.startsWith('l') ? t.inspector.left : t.inspector.right}
              </small>
            </button>
          );
        })}
      </div>
      <label className="field">
        <span>
          {t.inspector.text} <small>{t.inspector.textHint}</small>
        </span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.inspector.textPlaceholder}
        />
      </label>
      <button className="button button-small" onClick={convertText}>
        {t.inspector.convert}
      </button>
      <label className="field">
        <span>{t.inspector.sequence}</span>
        <textarea
          className="code-input"
          rows={4}
          value={value.sequence}
          onChange={(event) =>
            onChange({ ...value, sequence: event.target.value })
          }
          placeholder="{-lctrl}{c}{+lctrl}"
          spellCheck={false}
        />
      </label>
      <div className="macro-quick">
        {QUICK_SEQUENCES.map(({ id, label, append, tokens }) => (
          <button
            key={id}
            onClick={() =>
              onChange({
                ...value,
                sequence:
                  (append ? value.sequence : '') + formatMacroSequence(tokens),
              })
            }
          >
            {label(t)}
          </button>
        ))}
      </div>
      <p className="field-help">{t.inspector.macroHelp}</p>
      {macros.length > 0 && (
        <div className="macro-variants">
          <span className="field-label">{t.inspector.keyMacros}</span>
          {macros.map((macro) => (
            <div key={macro.triggers.join('|')}>
              <button onClick={() => onLoad(macro)}>
                {macro.triggers
                  .map((token) => actionLabel(token.replace(/^kp-/, '')))
                  .join(' + ')}
              </button>
              <button
                className="icon-button"
                aria-label={t.inspector.deleteMacro}
                onClick={() => onDelete(macro)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
