import { actionCategories, actions } from '../../domain/keyboard';
import { useI18n } from '../../i18n/context';

export interface TapHoldDraft {
  tap: string;
  hold: string;
  delay: number;
}
const DELAY_MS = { min: 1, max: 999 };

function ActionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (token: string) => void;
}) {
  const { t, actionLabel, actionName } = useI18n();
  const known = actions.some((action) => action.token === value);
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {!known && <option value={value}>{value}</option>}
        {actionCategories.map((category) => (
          <optgroup label={t.categories[category]} key={category}>
            {actions
              .filter((action) => action.category === category)
              .map((action) => (
                <option key={action.token} value={action.token}>
                  {actionLabel(action.token)} — {actionName(action.token)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function TapHoldPanel({
  value,
  onChange,
}: {
  value: TapHoldDraft;
  onChange: (value: TapHoldDraft) => void;
}) {
  const { t } = useI18n();
  const setDelay = (delay: number) => onChange({ ...value, delay });
  return (
    <>
      <p className="inspector-intro">{t.inspector.tapHoldIntro}</p>
      <ActionSelect
        label={t.inspector.tap}
        value={value.tap}
        onChange={(tap) => onChange({ ...value, tap })}
      />
      <ActionSelect
        label={t.inspector.hold}
        value={value.hold}
        onChange={(hold) => onChange({ ...value, hold })}
      />
      <label className="field">
        <span>
          {t.inspector.holdThreshold} <strong>{value.delay} ms</strong>
        </span>
        <input
          type="range"
          min={DELAY_MS.min}
          max={DELAY_MS.max}
          value={value.delay}
          onChange={(event) => setDelay(Number(event.target.value))}
        />
        <input
          aria-label={t.inspector.delay}
          type="number"
          min={DELAY_MS.min}
          max={DELAY_MS.max}
          value={value.delay}
          onChange={(event) => setDelay(Number(event.target.value))}
        />
      </label>
      <p className="field-help">{t.inspector.tapHoldHelp}</p>
    </>
  );
}
