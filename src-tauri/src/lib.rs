//! Tauri commands. Each command only checks its inputs and delegates to a module.

mod backup;
mod device;
mod error;
mod library;
mod smartset;
mod storage;

use backup::Backup;
use device::{Device, DeviceLayout, TransferResult};
use error::{io, Error, Result};
use std::{
    path::{Path, PathBuf},
    sync::{Mutex, MutexGuard},
};
use tauri::{Manager, State};

/// The v-Drive chosen by the user. Holding the lock serializes device access.
#[derive(Default)]
struct Connection(Mutex<Option<PathBuf>>);

impl Connection {
    fn lock(&self) -> Result<MutexGuard<'_, Option<PathBuf>>> {
        self.0.lock().map_err(|_| Error::ConnectionLocked)
    }
}

/// The connected drive, checked to still be mounted.
fn mounted_root(connection: &Option<PathBuf>) -> Result<&Path> {
    let root = connection.as_deref().ok_or(Error::NoDevice)?;
    device::check_mount(root)?;
    Ok(root)
}

fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf> {
    app.path().app_data_dir().map_err(io)
}
fn backup_dir(app: &tauri::AppHandle) -> Result<PathBuf> {
    Ok(data_dir(app)?.join("backups"))
}

#[tauri::command]
async fn load_library(app: tauri::AppHandle) -> Result<Option<String>> {
    library::load(&data_dir(&app)?)
}

#[tauri::command]
async fn save_library(app: tauri::AppHandle, content: String) -> Result<()> {
    library::save(&data_dir(&app)?, &content)
}

/// Saves to a user-chosen file. Never an alternative way to write on the
/// keyboard: that path has no backup and ignores the v-Drive constraints.
#[tauri::command]
async fn export_file(path: String, content: String) -> Result<()> {
    let path = PathBuf::from(path);
    let extension = path.extension().and_then(|extension| extension.to_str());
    if !path.is_absolute() || !matches!(extension, Some("txt" | "json")) {
        return Err(Error::InvalidExport);
    }
    if content.len() as u64 > library::MAX_BYTES {
        return Err(Error::ExportTooLarge);
    }
    if device::is_on_device(&path) {
        return Err(Error::ExportToDevice);
    }
    storage::atomic_write(&path, content.as_bytes())
}

#[tauri::command]
async fn detect_devices() -> Vec<Device> {
    device::detect()
}

#[tauri::command]
async fn connect_device(root: String, connection: State<'_, Connection>) -> Result<Device> {
    let root = device::check_mount(Path::new(&root))?;
    let found = device::inspect(&root)?;
    *connection.lock()? = Some(root);
    Ok(found)
}

#[tauri::command]
async fn read_device_layout(
    filename: String,
    connection: State<'_, Connection>,
) -> Result<DeviceLayout> {
    let guard = connection.lock()?;
    device::read_layout(mounted_root(&guard)?, &filename)
}

#[tauri::command]
async fn apply_device_layout(
    app: tauri::AppHandle,
    filename: String,
    content: String,
    expected_fingerprint: String,
    connection: State<'_, Connection>,
) -> Result<TransferResult> {
    let guard = connection.lock()?;
    device::apply(
        mounted_root(&guard)?,
        &backup_dir(&app)?,
        &filename,
        &content,
        &expected_fingerprint,
    )
}

#[tauri::command]
async fn list_backups(app: tauri::AppHandle) -> Result<Vec<Backup>> {
    backup::list(&backup_dir(&app)?)
}

#[tauri::command]
async fn read_backup(app: tauri::AppHandle, id: String) -> Result<String> {
    backup::read(&backup_dir(&app)?, &id)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Connection::default())
        .invoke_handler(tauri::generate_handler![
            load_library,
            save_library,
            export_file,
            detect_devices,
            connect_device,
            read_device_layout,
            apply_device_layout,
            list_backups,
            read_backup
        ])
        .run(tauri::generate_context!())
        .expect("Unable to start Advantage Studio");
}
