//! Errors sent to the interface as `{ "code": …, …details }`.
//! The interface writes the message in the user's language
//! (`src/i18n`, key `errors.<code>`), so no text is built here.

use serde::Serialize;
use std::fmt::Display;

#[derive(Debug, Serialize)]
#[serde(
    tag = "code",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Error {
    /// Operating system or library error, with its own (untranslated) text.
    Io {
        detail: String,
    },
    ConnectionLocked,
    NoDevice,
    NotMountedRoot,
    NotADevice,
    SpecialFile,
    UnsupportedFirmware,
    NotText,
    FileTooLarge,
    InvalidFilename,
    /// `detail` is a short English description of the first invalid rule.
    InvalidLayout {
        line: usize,
        detail: String,
    },
    ChangedSinceRead,
    ChangedDuringTransfer,
    VerificationFailed,
    TransferFailed {
        cause: Box<Error>,
        restored: bool,
        backup_id: String,
    },
    InvalidExport,
    ExportTooLarge,
    ExportToDevice,
    LibraryTooLarge,
    InvalidLibrary,
    InvalidBackupId,
}

pub type Result<T> = std::result::Result<T, Error>;

/// Wraps a system error; callers prefix it with the path when useful.
pub fn io(error: impl Display) -> Error {
    Error::Io {
        detail: error.to_string(),
    }
}
