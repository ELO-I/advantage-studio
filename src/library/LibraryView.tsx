import {
  ArrowDownToLine,
  ArrowUpRight,
  Copy,
  Download,
  FolderHeart,
  Plus,
  Trash2,
} from 'lucide-react';
import { Keyboard } from '../components/Keyboard';
import { familyLabel } from '../domain/keyboard';
import { parseLayout } from '../domain/smartset';
import type { Profile } from '../domain/library';
import { useI18n } from '../i18n/context';

export function LibraryView({
  profiles,
  onOpen,
  onDuplicate,
  onDelete,
  onCreate,
  onImport,
  onExport,
}: {
  profiles: Profile[];
  onOpen: (id: string) => void;
  onDuplicate: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onCreate: () => void;
  onImport: () => void;
  onExport: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <div className="view-heading">
        <div>
          <h1>
            {t.library.title}
            <span className="count-badge">{profiles.length}</span>
          </h1>
        </div>
        <button className="button button-primary" onClick={onCreate}>
          <Plus size={16} />
          {t.library.newConfiguration}
        </button>
      </div>
      <div className="profile-grid">
        {profiles.map((profile) => {
          const parsed = parseLayout(profile.content, profile.family);
          return (
            <article className="profile-card" key={profile.id}>
              <div className="profile-card-heading">
                <span className="profile-family">
                  {familyLabel(profile.family)}
                </span>
                <div>
                  <button
                    className="icon-button"
                    aria-label={t.library.duplicateLabel(profile.name)}
                    title={t.library.duplicate}
                    onClick={() => onDuplicate(profile)}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t.library.deleteLabel(profile.name)}
                    title={t.library.delete}
                    disabled={profiles.length === 1}
                    onClick={() => onDelete(profile)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <button
                className="profile-preview"
                aria-label={t.library.open(profile.name)}
                onClick={() => onOpen(profile.id)}
              >
                <Keyboard
                  family={profile.family}
                  layer="top"
                  parsed={parsed}
                  compact
                />
              </button>
              <div className="profile-card-body">
                <h2>{profile.name}</h2>
                {profile.description && <p>{profile.description}</p>}
                <div>
                  <span>
                    {t.library.summary(
                      parsed.rules.length,
                      profile.history.length,
                    )}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={t.library.edit(profile.name)}
                    onClick={() => onOpen(profile.id)}
                  >
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        <button className="new-profile-card" onClick={onCreate}>
          <FolderHeart size={30} strokeWidth={1.3} />
          <span>
            {t.library.create} <Plus size={14} />
          </span>
        </button>
      </div>
      <div className="library-footer">
        <button className="button" onClick={onImport}>
          <ArrowDownToLine size={16} />
          {t.library.import}
        </button>
        <button className="button" onClick={onExport}>
          <Download size={16} />
          {t.library.exportAll}
        </button>
      </div>
    </>
  );
}
