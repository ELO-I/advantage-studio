import type { BindingKind } from '../domain/binding';
import { useI18n } from '../i18n/context';

/** Binding kinds in legend order. Colours come from `data-kind` (styles/tokens.css). */
const KINDS: BindingKind[] = ['remap', 'tapHold', 'macro'];

export function KeyLegend() {
  const { t } = useI18n();
  return (
    <div className="key-legend" aria-label={t.keyboard.legend}>
      <span>
        <i />
        {t.kinds.native}
      </span>
      {KINDS.map((kind) => (
        <span key={kind}>
          <i data-kind={kind} />
          {t.kinds[kind]}
        </span>
      ))}
    </div>
  );
}
