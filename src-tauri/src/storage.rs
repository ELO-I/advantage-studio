use crate::error::{io, Error, Result};
use std::{fs, io::Write, path::Path};

pub fn atomic_write(path: &Path, content: &[u8]) -> Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| io(format!("{}: no parent folder", path.display())))?;
    fs::create_dir_all(parent).map_err(|e| io(format!("{}: {e}", parent.display())))?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(io)?;
    temporary.write_all(content).map_err(io)?;
    temporary.as_file().sync_all().map_err(io)?;
    temporary
        .persist(path)
        .map_err(|e| io(format!("{}: {e}", path.display())))?;
    Ok(())
}

pub fn read_limited(path: &Path, limit: u64) -> Result<Vec<u8>> {
    let metadata =
        fs::symlink_metadata(path).map_err(|e| io(format!("{}: {e}", path.display())))?;
    if !metadata.file_type().is_file() || metadata.len() > limit {
        return Err(Error::FileTooLarge);
    }
    use std::io::Read;
    let mut content = Vec::new();
    fs::File::open(path)
        .map_err(io)?
        .take(limit + 1)
        .read_to_end(&mut content)
        .map_err(io)?;
    if content.len() as u64 > limit {
        return Err(Error::FileTooLarge);
    }
    Ok(content)
}
