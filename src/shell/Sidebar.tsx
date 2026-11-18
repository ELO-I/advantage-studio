import {
  ArchiveRestore,
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  FolderHeart,
  Languages,
  LoaderCircle,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react';
import type { Profile } from '../domain/library';
import type { SaveState } from '../hooks/useLibrary';
import { useI18n } from '../i18n/context';
import { isLocale, locales } from '../i18n/translator';
import { desktop, DOWNLOAD_URL } from '../services/platform';

export type View = 'editor' | 'library' | 'help';
const VISIBLE_PROFILES = 12;

interface Props {
  profiles: Profile[];
  selectedId: string;
  view: View;
  saveState: SaveState;
  deviceConnected: boolean;
  onView: (view: View) => void;
  onSelect: (id: string) => void;
  onDialog: (dialog: 'new' | 'import' | 'backup' | 'device') => void;
}

export function Sidebar({
  profiles,
  selectedId,
  view,
  saveState,
  deviceConnected,
  onView,
  onSelect,
  onDialog,
}: Props) {
  const { t } = useI18n();
  const saveLabels: Record<SaveState, string> = {
    saved: t.sidebar.saved,
    saving: t.sidebar.saving,
    error: t.sidebar.saveError,
  };
  const deviceLabel = deviceConnected
    ? t.sidebar.deviceSelected
    : t.sidebar.connect;
  return (
    <aside className="sidebar">
      <a
        href="#"
        className="brand"
        onClick={(event) => {
          event.preventDefault();
          onView('editor');
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          A2
        </span>
        <span className="brand-name">
          Advantage <strong>Studio</strong>
        </span>
      </a>
      <nav aria-label={t.sidebar.navigation}>
        {(
          [
            { id: 'editor', label: t.sidebar.editor, Icon: SlidersHorizontal },
            { id: 'library', label: t.sidebar.library, Icon: FolderHeart },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            className={view === id ? 'active' : ''}
            aria-label={label}
            title={label}
            onClick={() => onView(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {id === 'library' && <small>{profiles.length}</small>}
          </button>
        ))}
      </nav>
      <div className="eyebrow sidebar-section-label">
        <span>{t.sidebar.configurations}</span>
        <button
          className="icon-button"
          title={t.sidebar.newConfiguration}
          aria-label={t.sidebar.newConfiguration}
          onClick={() => onDialog('new')}
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="sidebar-profiles">
        {profiles.slice(0, VISIBLE_PROFILES).map((item) => (
          <button
            className={item.id === selectedId ? 'selected' : ''}
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            <span className="profile-dot" />
            <span>{item.name}</span>
          </button>
        ))}
        {profiles.length > VISIBLE_PROFILES && (
          <button onClick={() => onView('library')}>
            {t.sidebar.seeAll(profiles.length)}
          </button>
        )}
      </div>
      <button
        className="sidebar-import"
        aria-label={t.sidebar.import}
        title={t.sidebar.import}
        onClick={() => onDialog('import')}
      >
        <ArrowDownToLine size={16} />
        <span>{t.sidebar.import}</span>
      </button>
      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <button
            className={`device-chip ${deviceConnected ? 'connected' : ''}`}
            title={deviceLabel}
            onClick={() => onDialog('device')}
          >
            <span
              className={`status-dot ${deviceConnected ? 'connected' : ''}`}
            />
            <span>{deviceLabel}</span>
            <ChevronRight size={14} />
          </button>
          <span
            className={`save-status ${saveState === 'error' ? 'save-error' : ''}`}
            title={saveLabels[saveState]}
          >
            {saveState === 'saved' && <Check size={13} />}
            {saveState === 'saving' && (
              <LoaderCircle size={13} className="spin" />
            )}
            {saveState === 'error' && <TriangleAlert size={13} />}
            <span>{saveLabels[saveState]}</span>
          </span>
        </div>
        <nav>
          <button
            aria-label={t.sidebar.backups}
            title={t.sidebar.backups}
            onClick={() => onDialog('backup')}
          >
            <ArchiveRestore size={16} />
            <span>{t.sidebar.backups}</span>
          </button>
          <button
            className={view === 'help' ? 'active' : ''}
            aria-label={t.sidebar.help}
            title={t.sidebar.help}
            onClick={() => onView('help')}
          >
            <BookOpen size={16} />
            <span>{t.sidebar.help}</span>
          </button>
          {!desktop && (
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t.device.desktopDownload}
              title={t.device.desktopDownload}
            >
              <Download size={16} />
              <span>{t.sidebar.desktopApp}</span>
            </a>
          )}
        </nav>
        <div className="app-version">Advantage Studio · 0.1.0</div>
      </div>
      <LanguageSelect />
    </aside>
  );
}

/**
 * A native select laid over an icon and the language name, so it stays
 * usable when the sidebar collapses to icons or to a mobile header.
 */
function LanguageSelect() {
  const { t, locale, setLocale } = useI18n();
  const current = locales.find((item) => item.id === locale)!;
  return (
    <label className="language-select" title={t.sidebar.language}>
      <Languages size={16} />
      <span>{current.name}</span>
      <select
        aria-label={t.sidebar.language}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        {locales.map((item) => (
          <option key={item.id} value={item.id} lang={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
