/**
 * Everything that differs between the browser and the Tauri desktop app:
 * persistence, file export and the keyboard's v-Drive (desktop only).
 */
import { invoke, isTauri } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { librarySchema, type Library } from '../domain/library';

export const desktop = isTauri();
/** Installers published by the release workflow (.github/workflows/verify.yml). */
export const DOWNLOAD_URL =
  'https://github.com/ELO-I/advantage-studio/releases/latest';
const STORAGE_KEY = 'advantage-studio.library.v1';
export interface Device {
  root: string;
  name: string;
  version: string;
  layouts: string[];
  fingerprint: string;
}
export interface DeviceLayout {
  content: string;
  fingerprint: string;
}
export interface TransferResult {
  backupId: string;
  fingerprint: string;
}
export interface Backup {
  id: string;
  date: string;
  filename: string;
  deviceName: string;
}

/** Null when no library was saved yet. */
export async function loadLibrary(): Promise<Library | null> {
  const raw = desktop
    ? await invoke<string | null>('load_library')
    : localStorage.getItem(STORAGE_KEY);
  return raw ? librarySchema.parse(JSON.parse(raw)) : null;
}
export async function saveLibrary(library: Library): Promise<void> {
  const content = JSON.stringify(librarySchema.parse(library));
  if (desktop) await invoke('save_library', { content });
  else localStorage.setItem(STORAGE_KEY, content);
}
/**
 * Returns false when the user cancels the save dialog.
 * `fileType` names the file type in the desktop save dialog.
 */
export async function download(
  content: string,
  filename: string,
  fileType: string,
): Promise<boolean> {
  if (desktop) {
    const extension = filename.split('.').at(-1)!;
    const path = await save({
      defaultPath: filename,
      filters: [{ name: fileType, extensions: [extension] }],
    });
    if (path) await invoke('export_file', { path, content });
    return Boolean(path);
  }
  const url = URL.createObjectURL(
    new Blob([content], {
      type: filename.endsWith('.json')
        ? 'application/json'
        : 'text/plain;charset=utf-8',
    }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function chooseDevice(title: string): Promise<Device | null> {
  const root = await open({ directory: true, multiple: false, title });
  return typeof root === 'string' ? connectDevice(root) : null;
}
export const detectDevices = () => invoke<Device[]>('detect_devices');
export const connectDevice = (root: string) =>
  invoke<Device>('connect_device', { root });
export const readDeviceLayout = (filename: string) =>
  invoke<DeviceLayout>('read_device_layout', { filename });
export const applyDeviceLayout = (
  filename: string,
  content: string,
  expectedFingerprint: string,
) =>
  invoke<TransferResult>('apply_device_layout', {
    filename,
    content,
    expectedFingerprint,
  });
export const listBackups = () => invoke<Backup[]>('list_backups');
export const readBackup = (id: string) => invoke<string>('read_backup', { id });
