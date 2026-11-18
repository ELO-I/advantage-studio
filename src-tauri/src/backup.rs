//! Copies of keyboard layout files, taken before every transfer.
//! One JSON file per backup, named after its UUID.

use crate::error::{io, Error, Result};
use crate::storage;
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

const MAX_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Backup {
    pub id: String,
    pub date: String,
    pub filename: String,
    pub device_name: String,
    /// Empty in listings: the content is only sent when restoring.
    pub content: String,
}

impl Backup {
    pub fn new(filename: &str, device_name: &str, content: &str) -> Self {
        Backup {
            id: uuid::Uuid::new_v4().to_string(),
            date: chrono::Utc::now().to_rfc3339(),
            filename: filename.into(),
            device_name: device_name.into(),
            content: content.into(),
        }
    }
}

pub fn write(dir: &Path, backup: &Backup) -> Result<()> {
    let bytes = serde_json::to_vec(backup).map_err(io)?;
    storage::atomic_write(&dir.join(format!("{}.json", backup.id)), &bytes)
}

fn read_file(path: &Path) -> Result<Backup> {
    serde_json::from_slice(&storage::read_limited(path, MAX_BYTES)?)
        .map_err(|e| io(format!("{}: {e}", path.display())))
}

/// Newest first, without file contents.
pub fn list(dir: &Path) -> Result<Vec<Backup>> {
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut backups = Vec::new();
    for entry in fs::read_dir(dir).map_err(io)? {
        let path = entry.map_err(io)?.path();
        if path
            .extension()
            .is_some_and(|extension| extension == "json")
        {
            let mut backup = read_file(&path)?;
            backup.content.clear();
            backups.push(backup);
        }
    }
    backups.sort_by(|a, b| b.date.cmp(&a.date));
    Ok(backups)
}

/// The id is parsed as a UUID so it can never escape the backup folder.
pub fn read(dir: &Path, id: &str) -> Result<String> {
    let id = uuid::Uuid::parse_str(id).map_err(|_| Error::InvalidBackupId)?;
    Ok(read_file(&dir.join(format!("{id}.json")))?.content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lists_without_content_and_reads_by_id() {
        let dir = tempfile::tempdir().unwrap();
        let backup = Backup::new("qwerty.txt", "Kinesis Advantage2", "[a]>[b]");
        write(dir.path(), &backup).unwrap();
        let listed = list(dir.path()).unwrap();
        assert_eq!(listed.len(), 1);
        assert!(listed[0].content.is_empty());
        assert_eq!(read(dir.path(), &backup.id).unwrap(), "[a]>[b]");
        assert!(read(dir.path(), "../library").is_err());
    }
}
