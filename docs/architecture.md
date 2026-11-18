# Architecture and validation

## Organisation

| Location                                                            | Responsibility                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resources/advantage2.json`                                         | Physical positions, actions (with their English labels and names), aliases and QWERTY/Dvorak defaults. Data shared by TypeScript and Rust.                                                                                |
| `src/domain`                                                        | Pure business rules, without React, Tauri or text: keyboard model (`keyboard`), SmartSet syntax (`smartset`), key behaviour and how it is written (`binding`), library, history and limits (`library`). Tested by Vitest. |
| `src/i18n`                                                          | Interface text. `en.ts` is the reference catalog, `fr.ts` follows it; `translator.ts` turns domain values (actions, diagnostics, history entries, backend error codes) into text; `useI18n()` gives it to components.     |
| `src/services/platform.ts`                                          | Single contact point with the platform: browser storage or Tauri files, export, v-Drive access.                                                                                                                           |
| `src/hooks`                                                         | Reusable React state: library and save queue, undo/redo, notification, asynchronous action.                                                                                                                               |
| `src/components`                                                    | Shared elements: keyboard, legend, diagnostics, modal window.                                                                                                                                                             |
| `src/shell`, `src/editor`, `src/library`, `src/help`, `src/dialogs` | One feature per folder. The key inspector has one panel per mode; the transfer to the keyboard has one step per screen and its detection hooks.                                                                           |
| `src/App.tsx`                                                       | Composition: loading screen, then the workspace that connects views, windows and library actions.                                                                                                                         |
| `src/styles`                                                        | Design tokens (`tokens.css`, see [design.md](design.md)) then one sheet per area, imported in order by `index.css`.                                                                                                       |
| `src-tauri/src/lib.rs`                                              | IPC commands: check their inputs and delegate to modules.                                                                                                                                                                 |
| `src-tauri/src/error.rs`                                            | Errors sent to the interface as codes (`{ "code": … }`); the interface writes the message in the user's language.                                                                                                         |
| `src-tauri/src/device.rs`                                           | v-Drive detection and identification, reading, verified in-place writing.                                                                                                                                                 |
| `src-tauri/src/smartset.rs`                                         | Independent validation of files before any write to the keyboard.                                                                                                                                                         |
| `src-tauri/src/library.rs`, `backup.rs`                             | Library file and backups of replaced files.                                                                                                                                                                               |
| `src-tauri/src/storage.rs`                                          | Bounded reads and atomic writes.                                                                                                                                                                                          |
| `scripts/run-native.js`                                             | Runs Tauri or Cargo with the optional local build environment.                                                                                                                                                            |
| `tests`                                                             | Playwright user journeys; desktop tests only mock the IPC bridge.                                                                                                                                                         |

Dependencies go one way: interface → hooks → services → domain. The domain knows neither React nor the platform.

One keyboard and one firmware format: no plugin layer or premature multi-keyboard abstraction. Positions and keywords are explicit hardware data. Presets produce the same SmartSet rules as manual edits.

Coordinates describe a flat diagram. Each thumb cluster follows a three-column grid, with a common 18° rotation around the cluster centre. Key positions keep this grid after rotation; large keys span two rows. `mainHeight` and `height` define the area of the keyboard alone and with the pedals, without changing physical positions or SmartSet tokens.

On desktop, `src/styles/editor.css` fits the editor into the available window height. The keyboard keeps its proportions and adapts to the width **and** the height of its area. The inspector keeps its controls fixed; actions and forms scroll inside it. The customisation list is collapsed by default. Narrow windows use an icon side rail, with accessible names and tooltips. On mobile, the layout stays vertical. The Tauri window opens maximised and accepts a minimum size of 900 × 600.

## Languages

The interface is in English by default; French is also available, from the language selector at the bottom of the sidebar. The choice is a preference of the browser or desktop app (`localStorage`), separate from the library.

No text is built outside `src/i18n`:

- the domain reports diagnostics as codes (`{ code: 'duplicate', line }`) and history entries as changes (`{ label: 'editKey', key: 'caps' }`);
- the Rust backend reports errors as codes (`src-tauri/src/error.rs`); only system error details stay in their original wording;
- action labels and names come from `resources/advantage2.json` in English, and a catalog may override them by token.

To add a language, copy `src/i18n/fr.ts`, translate it, and add it to `locales` in `src/i18n/translator.ts`. TypeScript refuses a catalog that misses a key, and `translator.test.ts` checks the same at run time.

Libraries saved before history codes existed keep their free-text labels, shown as is.

## SmartSet format

Active lines use the syntaxes `[source]>[action]`, `[source]>[tap][t&h250][hold]` or `{trigger}>{sequence}`. Lines disabled with `*` and unrecognised imported lines are kept: an error blocks export and transfer until it is fixed. Exported files use CRLF.

The firmware provides two layers, not an arbitrary number of QMK layers. The reserved Program and Keypad keys cannot be reprogrammed in the editor. Layer-switch remaps are applied to both layers of the same location, as the manual requires. Text macros map to the keys of a US host keyboard; they are not Unicode injection, and unsupported characters are reported.

The size limit is an application safeguard, not an estimate of the keyboard's free memory. The firmware and its macro capacity depend on the hardware revision. Undocumented features are not invented.

## Transfer

The backend requires a mounted volume containing the expected `active` structure (`qwerty.txt`, `dvorak.txt`, `state.txt`, `version.txt`). It refuses special files and symbolic links. Only allowed SmartSet configuration names can be targeted; `state.txt` and the firmware are excluded.

A SHA-256 fingerprint prevents replacing a layout changed since it was read. A second check happens right before writing. The original is backed up in local data before any change. The existing file is written in place, truncated if needed, synced and read back. This respects older v-Drives, which do not support creating a layout file or replacing it by renaming. On failure, the backend tries to write the original back and keeps the local backup.

Native commands run on the Tauri asynchronous runtime to keep the interface thread free during disk access. Read/transfer commands share a connection lock. Ordinary exports cannot be used as an alternative path to write to an identified v-Drive. The app does not eject the drive automatically and does not trigger the hardware reload.

## Distribution

The same web build (`dist`, with relative asset paths) serves two purposes: Tauri bundles it in the desktop app, and GitHub Pages hosts it as the web app (`.github/workflows/pages.yml`). The web app has every feature except writing to the keyboard: it offers the `.txt` export and links to the desktop installers, which a version tag publishes as a GitHub release (`.github/workflows/verify.yml`). The download link is `DOWNLOAD_URL` in `src/services/platform.ts`.

## Local data

The versioned library is validated by Zod and saved by atomic replacement on desktop. Saves are queued so an older state can never overwrite a newer change. An unreadable library shows an error and stays untouched. Each profile keeps up to 50 revisions; the JSON export includes this history.

The browser version uses `localStorage`. No remote service, account, telemetry or font loaded from the Internet: the Inter font is bundled in the build (`@fontsource-variable/inter`). Tauri permissions are limited to file dialogs and the app's own commands.

## Validation

- Domain tests (one file per module): physical positions on both families/layers, official syntax, aliases, balanced macros, delays, conservative import, CRLF export, key classification and writing (back to native, kept macros, mirrored layer switch), library, history, limits and presets.
- Translation tests: every catalog has every key, action overrides only target known actions, labels, diagnostics, history entries and backend error codes in each language.
- Rust tests: allowed file names, SmartSet validation, original backup, write/read, refusal of stale fingerprints, invalid targets and Advantage360, library and backups.
- Browser tests: remap and persistence, undo/redo, real export, presets and duplication, keypad, tap/hold, macros, import repair, adaptation to different sizes and language switch.
- Desktop journeys with mocked IPC: selected file, original fingerprint passed on, reload instructions after success, no false success on error.
- Geometric regression in the browser: key outlines after rotation, no overlaps, contained legends and clickable areas at 1440, 1100, 1050 and 390 px, with the pedals shown.
- Height regression: seven windows from 900 × 600 to 2560 × 1080, inspector open in all three modes, pedals and Keypad layer; no page scroll, reachable keys and visible controls. The save button keeps its position while the actions scroll.

The Linux build has been run. Tests do not replace a trial on a physical Advantage2, especially for the 2 MB v-Drive quirk. Windows and macOS builds are prepared in CI and still need to be run and checked on those systems. The project is independent from Kinesis and ZSA.

## Reference sources

- [Official Advantage2 manual, June 2021](https://kinesis-ergo.com/wp-content/uploads/Adv2-Users-Manual-US_6-22-21.pdf): syntaxes, layers, profiles, commands and v-Drive restrictions.
- [Official Advantage2 support](https://kinesis-ergo.com/support/advantage2/): hardware and SmartSet.
- [KinesisCorporation/SmartSetApps](https://github.com/KinesisCorporation/SmartSetApps): check of keywords and positions. No Pascal code copied into the app.
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/): dependencies and desktop platforms.
