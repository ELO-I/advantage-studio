import { useState } from 'react';
import { ArrowRight, ChevronRight, Search } from 'lucide-react';
import {
  keyboard,
  locationToken,
  type Family,
  type Layer,
  type PhysicalKey,
} from '../domain/keyboard';
import type { ParsedLayout } from '../domain/smartset';
import { bindingAt } from '../domain/binding';
import { useI18n } from '../i18n/context';

/** Collapsible list of the customised keys of the current layer. */
export function ChangesPanel({
  family,
  layer,
  parsed,
  onSelect,
}: {
  family: Family;
  layer: Layer;
  parsed: ParsedLayout;
  onSelect: (key: PhysicalKey) => void;
}) {
  const { t, actionLabel, bindingLabel } = useI18n();
  const [filter, setFilter] = useState('');
  const changes = keyboard.keys.flatMap((key) => {
    const binding = bindingAt(parsed, locationToken(key, family, layer));
    return binding.kind ? [{ key, binding, kind: binding.kind }] : [];
  });
  if (!changes.length) return null;
  const nativeLabel = (key: PhysicalKey) =>
    actionLabel(key.defaults[family].top);
  const query = filter.toLowerCase();
  const visible = changes.filter(({ key }) =>
    `${key.id} ${nativeLabel(key)}`.toLowerCase().includes(query),
  );

  return (
    <details className="changes-panel">
      <summary className="changes-heading">
        <h2>
          {t.editor.customisations}
          <span className="count-badge">{changes.length}</span>
        </h2>
        <ChevronRight size={16} />
      </summary>
      <div className="changes-filter">
        <label className="search-field small-search">
          <Search size={15} />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label={t.editor.filterCustomisations}
            placeholder={t.editor.filter}
          />
        </label>
      </div>
      <div className="changes-list">
        {visible.map(({ key, binding, kind }) => (
          <button key={key.id} onClick={() => onSelect(key)}>
            <span className="mini-key">{nativeLabel(key)}</span>
            <ArrowRight size={13} />
            <strong>{bindingLabel(binding)}</strong>
            <span className="change-type" data-kind={kind}>
              {t.kinds[kind]}
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
    </details>
  );
}
