import { useState } from 'react';
import { ArrowRight, Check, Search } from 'lucide-react';
import { actionCategories, actions } from '../../domain/keyboard';
import { switchesLayer } from '../../domain/binding';
import { useI18n } from '../../i18n/context';

/** Windows shutdown: worth a warning before it lands on a key. */
const DANGEROUS_ACTION = 'shutdn';

export function RemapPanel({
  nativeAction,
  action,
  onChange,
}: {
  nativeAction: string;
  action: string;
  onChange: (action: string) => void;
}) {
  const { t, actionLabel, actionName } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(actionCategories[0]);
  const query = search.toLowerCase();
  // English names stay searchable in every language.
  const visible = actions.filter((item) =>
    query
      ? [actionName(item.token), actionLabel(item.token), item.name, item.token]
          .join(' ')
          .toLowerCase()
          .includes(query)
      : item.category === category,
  );

  return (
    <>
      <div className="mapping-preview">
        <span>{actionLabel(nativeAction)}</span>
        <ArrowRight size={16} />
        <strong data-kind="remap">{actionLabel(action)}</strong>
      </div>
      <label className="search-field">
        <Search size={16} />
        <input
          aria-label={t.inspector.searchAction}
          placeholder={t.inspector.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {!query && (
        <div className="category-tabs">
          {actionCategories.map((item) => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {t.categories[item]}
            </button>
          ))}
        </div>
      )}
      <div className="action-grid">
        {visible.map((item) => (
          <button
            key={item.token}
            title={actionName(item.token)}
            aria-label={actionName(item.token)}
            aria-pressed={action === item.token}
            onClick={() => onChange(item.token)}
          >
            <span>{actionLabel(item.token)}</span>
            {action === item.token && <Check size={12} />}
          </button>
        ))}
        {!visible.length && <p className="muted">{t.inspector.noAction}</p>}
      </div>
      <p className="field-help">
        {actionName(action)}
        {switchesLayer(action) && t.inspector.bothLayers}
      </p>
      {action === DANGEROUS_ACTION && (
        <p className="inline-warning">{t.inspector.shutdownWarning}</p>
      )}
    </>
  );
}
