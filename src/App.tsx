import { useState } from 'react';
import {
  addProfiles,
  duplicateProfile,
  exceedsProfileLimit,
  LIMITS,
  removeProfile,
  type Library,
  type Profile,
} from './domain/library';
import { exportLayout, hasErrors, parseLayout } from './domain/smartset';
import {
  useLibrary,
  type SaveState,
  type StorageError,
} from './hooks/useLibrary';
import { useEditHistory } from './hooks/useEditHistory';
import { useToast } from './hooks/useToast';
import { download, type Device } from './services/platform';
import { useI18n } from './i18n/context';
import { Sidebar, type View } from './shell/Sidebar';
import { LibraryFailureScreen, LoadingScreen } from './shell/StartupScreen';
import { Toast } from './shell/Toast';
import { EditorView } from './editor/EditorView';
import { LibraryView } from './library/LibraryView';
import { HelpView } from './help/HelpView';
import { NewProfileModal } from './dialogs/NewProfileModal';
import { ImportModal } from './dialogs/ImportModal';
import { SourceModal } from './dialogs/SourceModal';
import { HistoryModal } from './dialogs/HistoryModal';
import { RenameModal } from './dialogs/RenameModal';
import { DeleteProfileModal } from './dialogs/DeleteProfileModal';
import { BackupModal } from './dialogs/BackupModal';
import { DeviceModal } from './dialogs/device/DeviceModal';

export default function App() {
  const store = useLibrary();
  if (store.loading) return <LoadingScreen />;
  if (!store.library)
    return (
      <LibraryFailureScreen
        error={store.storageError}
        onReplace={store.replace}
      />
    );
  return (
    <Workspace
      library={store.library}
      saveState={store.saveState}
      storageError={store.storageError}
      update={store.update}
      updateProfile={store.updateProfile}
    />
  );
}

type Dialog =
  | {
      type:
        | 'new'
        | 'import'
        | 'source'
        | 'history'
        | 'device'
        | 'backup'
        | 'rename';
    }
  | { type: 'delete'; profile: Profile };

function Workspace({
  library,
  saveState,
  storageError,
  update,
  updateProfile,
}: {
  library: Library;
  saveState: SaveState;
  storageError: StorageError | null;
  update: (transform: (library: Library) => Library) => void;
  updateProfile: (id: string, transform: (profile: Profile) => Profile) => void;
}) {
  const [view, setView] = useState<View>('editor');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const { t, errorMessage, storageErrorMessage } = useI18n();
  const toast = useToast();
  const profile =
    library.profiles.find((item) => item.id === library.selectedId) ??
    library.profiles[0];
  const history = useEditHistory(profile, updateProfile);
  const open = (type: Exclude<Dialog['type'], 'delete'>) => setDialog({ type });
  const close = () => setDialog(null);

  const select = (id: string) => {
    update((current) => ({ ...current, selectedId: id }));
    setView('editor');
  };
  const add = (profiles: Profile[]) => {
    if (exceedsProfileLimit(library, profiles.length)) {
      toast.notify(t.toast.profileLimit(LIMITS.profiles));
      return;
    }
    update((current) => addProfiles(current, profiles));
    setView('editor');
    toast.notify(t.toast.added(profiles.length));
  };
  const exportFile = async (
    content: string,
    filename: string,
    fileType: string,
    success: string,
  ) => {
    try {
      if (await download(content, filename, fileType)) toast.notify(success);
    } catch (error) {
      toast.notify(t.toast.exportFailed(errorMessage(error)));
    }
  };
  const exportProfile = () => {
    if (hasErrors(parseLayout(profile.content, profile.family))) return;
    void exportFile(
      exportLayout(profile.content),
      `${profile.family}.txt`,
      t.files.smartset,
      t.toast.layoutExported,
    );
  };
  const exportLibrary = () =>
    void exportFile(
      JSON.stringify(library, null, 2),
      'advantage-studio-library.json',
      t.files.library,
      t.toast.libraryExported,
    );

  const renderDialog = () => {
    switch (dialog?.type) {
      case 'new':
        return (
          <NewProfileModal onClose={close} onCreate={(item) => add([item])} />
        );
      case 'import':
        return <ImportModal onClose={close} onImport={add} />;
      case 'source':
        return (
          <SourceModal
            profile={profile}
            onClose={close}
            onSave={(content) =>
              history.edit(content, { change: 'editSource' })
            }
          />
        );
      case 'history':
        return (
          <HistoryModal
            profile={profile}
            onClose={close}
            onRestore={(content) =>
              history.edit(content, { change: 'restore' })
            }
          />
        );
      case 'device':
        return (
          <DeviceModal
            profile={profile}
            initialDevice={device}
            onDevice={setDevice}
            onClose={close}
            onImport={(item) => add([item])}
            notify={toast.notify}
          />
        );
      case 'backup':
        return <BackupModal onClose={close} onImport={(item) => add([item])} />;
      case 'rename':
        return (
          <RenameModal
            profile={profile}
            onClose={close}
            onSave={(name, description) =>
              updateProfile(profile.id, (current) => ({
                ...current,
                name,
                description,
              }))
            }
          />
        );
      case 'delete':
        return (
          <DeleteProfileModal
            profile={dialog.profile}
            onClose={close}
            onDelete={() =>
              update((current) => removeProfile(current, dialog.profile.id))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        profiles={library.profiles}
        selectedId={profile.id}
        view={view}
        saveState={saveState}
        deviceConnected={device !== null}
        onView={setView}
        onSelect={select}
        onDialog={open}
      />
      <div className="workspace">
        {storageError && (
          <div className="storage-banner" role="alert">
            {storageErrorMessage(storageError)}
            <button onClick={exportLibrary}>{t.app.exportLibrary}</button>
          </div>
        )}
        <main className={view === 'editor' ? 'editor-main' : 'page-main'}>
          {view === 'editor' && (
            <EditorView
              key={profile.id}
              profile={profile}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onEdit={history.edit}
              onUndo={history.undo}
              onRedo={history.redo}
              onExport={exportProfile}
              onOpenDialog={open}
            />
          )}
          {view === 'library' && (
            <LibraryView
              profiles={library.profiles}
              onOpen={select}
              onDuplicate={(source) =>
                add([duplicateProfile(source, t.app.copySuffix)])
              }
              onDelete={(item) => setDialog({ type: 'delete', profile: item })}
              onCreate={() => open('new')}
              onImport={() => open('import')}
              onExport={exportLibrary}
            />
          )}
          {view === 'help' && <HelpView onConnect={() => open('device')} />}
        </main>
      </div>
      {renderDialog()}
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
