//! The user's configuration library, stored as one JSON file.
//! The front end validates its full schema; this side only refuses
//! content that is clearly not a library before replacing the file.

use crate::error::{io, Error, Result};
use crate::storage;
use std::path::Path;

/// Mirrored in `src/domain/library.ts` (`LIMITS.libraryBytes`).
pub const MAX_BYTES: u64 = 64 * 1024 * 1024;
const FILENAME: &str = "library.json";

pub fn load(data_dir: &Path) -> Result<Option<String>> {
    let path = data_dir.join(FILENAME);
    if !path.exists() {
        return Ok(None);
    }
    String::from_utf8(storage::read_limited(&path, MAX_BYTES)?)
        .map(Some)
        .map_err(io)
}

pub fn save(data_dir: &Path, content: &str) -> Result<()> {
    if content.len() as u64 > MAX_BYTES {
        return Err(Error::LibraryTooLarge);
    }
    let parsed: serde_json::Value =
        serde_json::from_str(content).map_err(|_| Error::InvalidLibrary)?;
    if parsed["version"] != 1 || !parsed["profiles"].is_array() {
        return Err(Error::InvalidLibrary);
    }
    storage::atomic_write(&data_dir.join(FILENAME), content.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_and_refuses_foreign_json() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(load(dir.path()).unwrap(), None);
        let library = r#"{"version":1,"selectedId":"a","profiles":[]}"#;
        save(dir.path(), library).unwrap();
        assert_eq!(load(dir.path()).unwrap().as_deref(), Some(library));
        assert!(save(dir.path(), r#"{"version":2,"profiles":[]}"#).is_err());
        assert!(save(dir.path(), "not json").is_err());
        assert_eq!(load(dir.path()).unwrap().as_deref(), Some(library));
    }
}
