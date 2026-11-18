//! The Advantage2 v-Drive: detection, reading and verified in-place writing
//! of layout files. Older 2 MB drives only accept updates of existing files.

use crate::error::{io, Error, Result};
use crate::{backup, smartset, storage};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs::{self, OpenOptions},
    io::{Seek, Write},
    path::{Path, PathBuf},
};

/// Files every Advantage2 v-Drive has in its `active` folder.
const REQUIRED_FILES: [&str; 4] = ["qwerty.txt", "dvorak.txt", "state.txt", "version.txt"];
const MAX_INFO_BYTES: u64 = 8 * 1024;
const LAYOUT_LIMIT: u64 = smartset::MAX_LAYOUT_BYTES as u64;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub root: String,
    pub name: String,
    pub version: String,
    pub layouts: Vec<String>,
    pub fingerprint: String,
}
#[derive(Serialize)]
pub struct DeviceLayout {
    pub content: String,
    pub fingerprint: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferResult {
    pub backup_id: String,
    pub fingerprint: String,
}

pub fn fingerprint(content: &[u8]) -> String {
    format!("{:x}", Sha256::digest(content))
}

fn mounted_disks() -> sysinfo::Disks {
    sysinfo::Disks::new_with_refreshed_list()
}

/// Advantage2 v-Drives among the mounted disks.
pub fn detect() -> Vec<Device> {
    mounted_disks()
        .list()
        .iter()
        .filter_map(|disk| inspect(disk.mount_point()).ok())
        .collect()
}

/// Accepts only the root of a mounted disk, never a copy of a v-Drive folder.
pub fn check_mount(root: &Path) -> Result<PathBuf> {
    let root = root
        .canonicalize()
        .map_err(|e| io(format!("{}: {e}", root.display())))?;
    let mounted = mounted_disks().list().iter().any(|disk| {
        disk.mount_point()
            .canonicalize()
            .is_ok_and(|path| path == root)
    });
    if !mounted {
        return Err(Error::NotMountedRoot);
    }
    Ok(root)
}

/// True when `path` lies on a mounted v-Drive.
pub fn is_on_device(path: &Path) -> bool {
    mounted_disks()
        .list()
        .iter()
        .any(|disk| path.starts_with(disk.mount_point()) && inspect(disk.mount_point()).is_ok())
}

/// A regular file of the `active` folder; links and special files are refused.
fn regular_child(root: &Path, name: &str) -> Result<PathBuf> {
    let path = root.join("active").join(name);
    let metadata = fs::symlink_metadata(&path).map_err(|e| io(format!("{name}: {e}")))?;
    if !metadata.file_type().is_file() {
        return Err(Error::SpecialFile);
    }
    Ok(path)
}

fn is_advantage360(version: &str, state: &str) -> bool {
    version.to_lowercase().contains("360") || state.to_lowercase().contains("advantage360")
}

pub fn inspect(root: &Path) -> Result<Device> {
    let root = root
        .canonicalize()
        .map_err(|e| io(format!("{}: {e}", root.display())))?;
    let active = fs::symlink_metadata(root.join("active")).map_err(|_| Error::NotADevice)?;
    if !active.file_type().is_dir() {
        return Err(Error::SpecialFile);
    }
    for filename in REQUIRED_FILES {
        regular_child(&root, filename)?;
    }
    let version_bytes =
        storage::read_limited(&regular_child(&root, "version.txt")?, MAX_INFO_BYTES)?;
    let version = String::from_utf8_lossy(&version_bytes).trim().to_string();
    let state = storage::read_limited(&regular_child(&root, "state.txt")?, MAX_INFO_BYTES)?;
    if version.is_empty() || is_advantage360(&version, &String::from_utf8_lossy(&state)) {
        return Err(Error::UnsupportedFirmware);
    }
    let mut layouts: Vec<String> = fs::read_dir(root.join("active"))
        .map_err(io)?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_file()))
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter(|name| smartset::family(name).is_ok())
        .collect();
    layouts.sort();
    Ok(Device {
        root: root.to_string_lossy().into_owned(),
        name: "Kinesis Advantage2".into(),
        version,
        layouts,
        fingerprint: fingerprint(&version_bytes),
    })
}

pub fn read_layout(root: &Path, filename: &str) -> Result<DeviceLayout> {
    smartset::family(filename)?;
    inspect(root)?;
    let bytes = storage::read_limited(&regular_child(root, filename)?, LAYOUT_LIMIT)?;
    let fingerprint = fingerprint(&bytes);
    let content = String::from_utf8(bytes).map_err(|_| Error::NotText)?;
    Ok(DeviceLayout {
        content,
        fingerprint,
    })
}

/// Rewrites an open file from its start and truncates the remainder.
fn overwrite(file: &mut fs::File, bytes: &[u8]) -> Result<()> {
    file.rewind().map_err(io)?;
    file.write_all(bytes).map_err(io)?;
    file.set_len(bytes.len() as u64).map_err(io)?;
    file.sync_all().map_err(io)
}

/// Backs up, writes in place and reads back a layout file.
/// `expected_fingerprint` proves the file has not changed since the user read it.
pub fn apply(
    root: &Path,
    backup_dir: &Path,
    filename: &str,
    content: &str,
    expected_fingerprint: &str,
) -> Result<TransferResult> {
    let family = smartset::family(filename)?;
    smartset::validate(content, family)?;
    let device = inspect(root)?;
    let original = read_layout(root, filename)?;
    if original.fingerprint != expected_fingerprint {
        return Err(Error::ChangedSinceRead);
    }
    let backup = backup::Backup::new(filename, &device.name, &original.content);
    backup::write(backup_dir, &backup)?;

    let target = regular_child(root, filename)?;
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .open(&target)
        .map_err(|e| io(format!("{filename}: {e}")))?;
    // Check once more after opening, immediately before the first mutation.
    if fingerprint(&storage::read_limited(&target, LAYOUT_LIMIT)?) != original.fingerprint {
        return Err(Error::ChangedDuringTransfer);
    }
    let written = overwrite(&mut file, content.as_bytes()).and_then(|_| {
        if storage::read_limited(&target, LAYOUT_LIMIT)? != content.as_bytes() {
            return Err(Error::VerificationFailed);
        }
        Ok(())
    });
    if let Err(error) = written {
        let restored = overwrite(&mut file, original.content.as_bytes()).is_ok();
        return Err(Error::TransferFailed {
            cause: Box::new(error),
            restored,
            backup_id: backup.id,
        });
    }
    Ok(TransferResult {
        backup_id: backup.id,
        fingerprint: fingerprint(content.as_bytes()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> tempfile::TempDir {
        let temp = tempfile::tempdir().unwrap();
        fs::create_dir(temp.path().join("active")).unwrap();
        for (filename, content) in [
            ("qwerty.txt", "[caps]>[lctrl]\r\n"),
            ("dvorak.txt", ""),
            ("state.txt", "layout=qwerty"),
            ("version.txt", "1.0.521.us (4MB)"),
        ] {
            fs::write(temp.path().join("active").join(filename), content).unwrap();
        }
        temp
    }
    #[test]
    fn backs_up_writes_and_verifies_existing_file() {
        let drive = fixture();
        let backups = tempfile::tempdir().unwrap();
        let before = read_layout(drive.path(), "qwerty.txt").unwrap();
        let result = apply(
            drive.path(),
            backups.path(),
            "qwerty.txt",
            "[a]>[b]\r\n",
            &before.fingerprint,
        )
        .unwrap();
        assert_eq!(
            read_layout(drive.path(), "qwerty.txt").unwrap().content,
            "[a]>[b]\r\n"
        );
        assert_eq!(
            backup::read(backups.path(), &result.backup_id).unwrap(),
            before.content
        );
    }
    #[test]
    fn prevents_stale_writes_new_files_and_invalid_content() {
        let drive = fixture();
        let backups = tempfile::tempdir().unwrap();
        let before = read_layout(drive.path(), "qwerty.txt").unwrap();
        for (filename, content, hash) in [
            ("qwerty.txt", "[a]>[b]", "old-hash"),
            ("a_qwerty.txt", "[a]>[b]", &before.fingerprint),
            ("state.txt", "", &before.fingerprint),
            ("qwerty.txt", "[program]>[null]", &before.fingerprint),
        ] {
            assert!(apply(drive.path(), backups.path(), filename, content, hash).is_err());
        }
        assert_eq!(
            read_layout(drive.path(), "qwerty.txt").unwrap().content,
            before.content
        );
        assert_eq!(fs::read_dir(backups.path()).unwrap().count(), 0);
    }
    #[test]
    fn refuses_advantage360_drives() {
        let drive = fixture();
        fs::write(drive.path().join("active/version.txt"), "360 Pro 1.0").unwrap();
        assert!(inspect(drive.path()).is_err());
    }
    #[cfg(unix)]
    #[test]
    fn refuses_symlink_layouts() {
        let drive = fixture();
        let external = tempfile::NamedTempFile::new().unwrap();
        fs::remove_file(drive.path().join("active/qwerty.txt")).unwrap();
        std::os::unix::fs::symlink(external.path(), drive.path().join("active/qwerty.txt"))
            .unwrap();
        assert!(inspect(drive.path()).is_err());
    }
}
