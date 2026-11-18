/**
 * English messages: the reference catalog. Every other locale must provide
 * the same keys (`Messages`), which TypeScript checks at build time.
 */
const plural = (count: number, one: string, other: string) =>
  `${count} ${count === 1 ? one : other}`;

export const en = {
  app: {
    loading: 'Opening your library…',
    loadFailed: (error: string) =>
      `Unable to read the library: ${error}. The original file is kept.`,
    saveFailed: (error: string) =>
      `Unable to save: ${error}. Export the library to keep your changes.`,
    exportLibrary: 'Export my library',
    failureTitle: 'Your library is kept',
    importLibrary: 'Import a library',
    emptyAdvice:
      'To start an empty library, first keep a copy of the original file.',
    createEmpty: 'Create an empty library',
    confirmEmpty:
      'Creating an empty library will replace the current file. Did you keep a copy of the original?',
    defaultProfileName: 'My Advantage2',
    copySuffix: ' · copy',
  },
  toast: {
    added: (count: number) =>
      count === 1 ? 'Configuration added' : `${count} configurations added`,
    profileLimit: (max: number) =>
      `The library holds at most ${max} configurations.`,
    exportFailed: (error: string) => `Export failed: ${error}`,
    layoutExported: 'Configuration exported',
    libraryExported: 'Library exported with its history',
    transferred:
      'Configuration written and verified. Finish the reload on the keyboard.',
    close: 'Dismiss notification',
  },
  sidebar: {
    navigation: 'Main navigation',
    editor: 'Editor',
    library: 'My configurations',
    configurations: 'Configurations',
    newConfiguration: 'New configuration',
    seeAll: (count: number) => `See all ${count} configurations`,
    import: 'Import a configuration',
    deviceSelected: 'v-Drive selected',
    connect: 'Connect the keyboard',
    saved: 'Saved locally',
    saving: 'Saving…',
    saveError: 'Save failed',
    backups: 'Keyboard backups',
    help: 'Getting started',
    language: 'Language',
    desktopApp: 'Desktop app',
  },
  modal: {
    defaultDescription: 'Settings of your Advantage2.',
    close: 'Close window',
    cancel: 'Cancel',
    closeButton: 'Close',
    save: 'Save',
  },
  kinds: {
    native: 'Native',
    remap: 'Remap',
    tapHold: 'Tap / Hold',
    macro: 'Macro',
  },
  keyboard: {
    label: (layer: string) => `Advantage2 keyboard, ${layer} layer`,
    legend: 'Key legend',
    key: (original: string, description: string, customised: boolean) =>
      `Key ${original}: ${description}${customised ? ', customised' : ''}`,
    reserved: 'Key reserved by the Kinesis firmware',
    reservedLabels: { program: 'Prog', keypad: 'KP' } as Record<string, string>,
    macros: (count: number) => plural(count, 'macro', 'macros'),
  },
  layers: { top: 'Main', keypad: 'Keypad' },
  categories: {
    characters: 'Characters',
    functions: 'Functions',
    navigation: 'Navigation',
    modifiers: 'Modifiers',
    media: 'Media',
    keypad: 'Keypad',
    other: 'Other',
  },
  /**
   * Overrides of the English labels and names of `resources/advantage2.json`,
   * by action token. English uses the model as is.
   */
  actions: {
    labels: {} as Record<string, string>,
    names: {} as Record<string, string>,
  },
  diagnostics: {
    valid: 'Valid SmartSet syntax',
    line: (line: number) => `Line ${line}`,
    file: 'File',
    tooLarge: 'File too large (256 KB maximum).',
    notAscii: 'A SmartSet configuration must only contain ASCII tokens.',
    unknownSyntax:
      'Unrecognised line: use [position]>[action] or {position}>{actions}.',
    brackets: 'Incorrect brackets or braces.',
    unknownLocation: (family: string, location: string) =>
      `Unknown position for the ${family} family: ${location}.`,
    remapSingleLocation: 'A remap must target a single position.',
    invalidRemap:
      'Unknown action or incorrect Tap / Hold syntax (delay from 1 to 999 ms).',
    modifierMacro: 'A modifier position cannot trigger a macro on its own.',
    coTriggers:
      'A macro accepts up to two modifiers of the same layer as co-triggers.',
    unbalancedMacro:
      'Invalid macro: check the actions and the press (−) / release (+) pairs.',
    longMacro: 'Long macro: check your firmware capacity before transferring.',
    duplicate: 'Duplicate declaration: remove the extra line.',
  },
  history: {
    title: 'Configuration history',
    description: (max: number) =>
      `The last ${max} versions are kept automatically. Restoring creates a new save point.`,
    emptyTitle: 'Every change leaves a trace',
    emptyText: 'Your history will appear here after the first change.',
    native: 'Native layout · no remap',
    restore: 'Restore this version',
    changes: {
      edit: () => 'Edit the configuration',
      editKey: (key: string) => `Edit ${key}`,
      resetKey: (key: string) => `Reset ${key}`,
      deleteMacro: () => 'Delete a macro',
      editSource: () => 'Edit the SmartSet file',
      restore: () => 'Before restoring',
      redo: () => 'Before redoing',
    },
  },
  editor: {
    rename: 'Rename',
    renameLabel: 'Rename the configuration',
    fixBeforeExport: 'Fix the SmartSet syntax before exporting',
    download: 'Download the SmartSet file',
    exportTxt: 'Export .txt',
    apply: 'Apply to keyboard',
    layout: 'Layout',
    undo: 'Undo',
    redo: 'Redo',
    history: 'History',
    source: 'View the SmartSet file',
    layer: 'Keyboard layer',
    nativeLegends: 'Native legends',
    pedals: 'Pedals',
    invalidTitle: 'The configuration has lines to fix',
    invalidText: 'Open the SmartSet view to check them before transferring.',
    noKeyTitle: 'No key selected',
    noKeyText:
      'Click a key on the keyboard to remap it, give it a tap and a hold action, or attach a macro.',
    customisations: 'Customisations',
    filterCustomisations: 'Filter customisations',
    filter: 'Filter…',
  },
  inspector: {
    title: 'Configure a key',
    close: 'Close the inspector',
    layer: { top: 'Main layer', keypad: 'Keypad layer' },
    actionType: 'Action type',
    modes: { remap: 'Key', tapHold: 'Tap', macro: 'Macro' },
    macroSyntax: 'Use a sequence of tokens between braces.',
    saved: 'Action saved',
    modifierHelp:
      'SmartSet reserves modifier positions: they can accompany a macro, but not trigger it on their own.',
    save: 'Save action',
    reset: 'Reset this key',
    searchAction: 'Search an action',
    searchPlaceholder: 'Search a key…',
    noAction: 'No action found.',
    bothLayers: ' · Will be assigned to both layers.',
    shutdownWarning: 'This action immediately shuts down a Windows PC.',
    tapHoldIntro: 'One action when tapped. Another when you hold the key.',
    tap: 'Tap',
    hold: 'Hold',
    holdThreshold: 'Hold threshold',
    delay: 'Delay in milliseconds',
    tapHoldHelp:
      'Requires a firmware compatible with Tap / Hold. Best on function or thumb keys.',
    macroIntro: 'A shortcut or a sequence of actions, triggered by this key.',
    coTriggers: 'Co-triggers',
    coTriggersHint: (max: number) => `optional · ${max} maximum`,
    left: 'L',
    right: 'R',
    text: 'Text to type',
    textHint: 'US system keyboard',
    textPlaceholder: 'E.g. Hello!',
    convert: 'Convert to sequence',
    unsupported: (characters: string) =>
      `Unsupported characters: ${characters}. Use a key macro suited to your system layout.`,
    sequence: 'SmartSet sequence',
    quick: { copy: 'Copy', paste: 'Paste' },
    macroHelp:
      'Characters depend on the system layout. Accepted pauses are 125 and 500 ms.',
    keyMacros: 'Macros of this key',
    deleteMacro: 'Delete this macro',
  },
  library: {
    title: 'My configurations',
    newConfiguration: 'New configuration',
    duplicate: 'Duplicate',
    duplicateLabel: (name: string) => `Duplicate ${name}`,
    delete: 'Delete',
    deleteLabel: (name: string) => `Delete ${name}`,
    open: (name: string) => `Open ${name}`,
    edit: (name: string) => `Edit ${name}`,
    summary: (rules: number, versions: number) =>
      `${plural(rules, 'rule', 'rules')} · ${plural(versions, 'version', 'versions')}`,
    create: 'Create a configuration',
    import: 'Import',
    exportAll: 'Export the whole library',
  },
  help: {
    title: 'Help',
    edit: {
      title: '1. Edit the keys',
      text: 'Click a key, choose an action, then save it. The main layer and the Keypad layer are independent.',
      colors:
        'A key’s colour shows its type: green for a remap, slate for a tap / hold, blue for a macro. The small legends can show its native function.',
    },
    connect: {
      title: '2. Connect the v-Drive',
      powerUser: 'Enable Power User mode with',
      powerUserKeys: 'Program + Shift + Escape',
      openDrive: ', then open the drive with',
      detected:
        'In the desktop app, the drive is detected automatically. You can also select its root manually.',
      button: 'Connect my keyboard',
    },
    apply: {
      title: '3. Apply and reload',
      text: 'Choose an existing file, then click Apply. The app backs up the original, writes the configuration and checks the content read back.',
      reloadQwerty: 'Reload QWERTY with',
      reloadDvorak: ', Dvorak with',
      reloadHotkey: ', or a hotkey profile with',
      hotkeyKeys: 'Program + its letter',
    },
    restore: {
      title: '4. Restore a configuration',
      text: 'The history keeps the latest versions of each configuration. Keyboard backups keep the files replaced during transfers.',
      export:
        'Export your .json library regularly to find it on another computer.',
    },
    notesTitle: 'Advantage2 specifics',
    notes: [
      [
        'Two layers per layout',
        'Main and Keypad. The physical Program and Keypad keys remain reserved for the firmware.',
      ],
      [
        'Native family and custom layout',
        'A Colemak configuration uses the QWERTY family here. A file based on Dvorak uses other position tokens: choose the right family when importing.',
      ],
      [
        'System language',
        'The keyboard sends key codes. The characters shown represent US actions; the characters actually typed depend on your OS layout. The text macro generator assumes a US layout.',
      ],
      [
        'Firmware and older v-Drives',
        'Tap / Hold requires a compatible firmware. On a 2 MB v-Drive, files must have been initialised by the keyboard before editing. The app updates existing files without replacing them by renaming.',
      ],
      [
        'End of session',
        'Eject the drive from your OS before closing the v-Drive with Program + F1. Keep the keyboard connected during a transfer.',
      ],
      [
        'Hotkey profiles',
        'With the v-Drive closed and the right family active, press Program + F2 then a letter or digit to create the file on the keyboard. You can then select it when transferring.',
      ],
    ] as [string, string][],
  },
  newProfile: {
    title: 'New configuration',
    description: 'Starting layout',
    defaultName: 'My new layout',
    presets: {
      qwerty: 'Original layout',
      dvorak: 'Native Dvorak layout',
      colemak: 'An alternative on a QWERTY base.',
    },
    name: 'Configuration name',
    create: 'Create the configuration',
  },
  rename: {
    title: 'Your configuration details',
    description:
      'Give it a name that is easy to find and a few words to describe it.',
    name: 'Name',
    descriptionLabel: 'Description',
  },
  deleteProfile: {
    title: (name: string) => `Delete “${name}”?`,
    description:
      'The configuration and its history will be removed from this library. Keyboard backups are kept.',
    confirm: 'Delete the configuration',
  },
  source: {
    title: 'SmartSet configuration',
    description: (family: string) =>
      `The ${family} family file contains the differences from the native layout.`,
    rules: (count: number) => plural(count, 'rule', 'rules'),
    code: 'SmartSet code',
    remap: 'Remap:',
    macro: 'Macro:',
    disable: 'Disable a line: prefix',
  },
  importer: {
    title: 'Import a configuration',
    description:
      'Load a SmartSet .txt file or an Advantage Studio .json library.',
    defaultName: 'Imported configuration',
    tooLarge: 'The file exceeds 64 MB.',
    failed: (error: string) => `Import failed: ${error}`,
    drop: 'Drop a file here',
    browse: 'or click to select it · .txt / .json',
    libraryCount: (count: number) =>
      `${plural(count, 'configuration', 'configurations')} will be added to your library.`,
    name: 'Name',
    family: 'Native family of the file',
    paste: 'Or paste the SmartSet content',
    keptLines:
      'Unrecognised lines are kept. You can fix them in the SmartSet view before a transfer.',
    import: 'Import',
    importCount: (count: number) =>
      `Import ${plural(count, 'configuration', 'configurations')}`,
  },
  backups: {
    title: 'Keyboard backups',
    description:
      'Every transfer keeps the original file on this computer. Restoring adds it to your library for inspection and transfer.',
    firstTransfer: 'Your first transfer will create a backup',
    desktopOnly: 'Available in the desktop app',
    separate:
      'These backups are separate from the history of your configurations.',
    download: 'Download the backup',
    downloadLabel: (filename: string) => `Download ${filename}`,
    restore: 'Restore to library',
    profileName: (filename: string) => `Backup · ${filename}`,
  },
  device: {
    titleDone: 'The configuration is on your keyboard',
    title: 'Apply to the Advantage2',
    descriptionDone:
      'Writing was verified. The keyboard still has to reload the layout.',
    description:
      'The transfer writes a SmartSet file and keeps a local backup of the original.',
    desktopTitle: 'Install with the desktop app',
    desktopText:
      'This web version lets you build your configuration and export it. To install it on the keyboard automatically, with a backup of the original and a check after writing, download the desktop app.',
    desktopDownload: 'Download the desktop app',
    desktopManual:
      'You can also export the .txt file, copy it to the v-Drive yourself, then reload it on the keyboard.',
    reconnect: 'Reconnect the keyboard',
    done: 'Done',
    transferring: 'Transferring…',
    apply: 'Apply to keyboard',
    profileName: (filename: string) => `From the keyboard · ${filename}`,
    chooseRoot: 'Select the root of the Advantage2 v-Drive',
    powerUserTitle: 'Enable Power User mode',
    powerUserKeys: 'Program + Shift + Escape',
    powerUserText: ' · once, if the mode is disabled.',
    openDriveTitle: 'Open the v-Drive',
    openDriveText: ' · the drive may take a dozen seconds to appear.',
    available: 'Keyboard available',
    waiting: 'Waiting for the v-Drive…',
    selectManually: 'Select the v-Drive manually',
    searchAgain: 'Search for the keyboard again',
    file: 'File to update',
    noFile: (family: string) =>
      `No ${family} family file exists on this keyboard.`,
    summary: {
      configuration: 'Configuration',
      family: 'Family',
      rules: 'Custom rules',
      backup: 'Backup first',
      automatic: 'Automatic',
    },
    hotkeyHelp:
      'For a hotkey profile, first create its file on the keyboard with Program + F2. The app updates existing files, including on older 2 MB v-Drives.',
    importCurrent: 'Import this file into my library',
    success: 'File backed up, written and read back successfully',
    reloadTitle: 'Reload the configuration',
    reloadText: 'On the keyboard, press',
    closeTitle: 'Close the v-Drive after use',
    closeText: 'Eject the drive from your system, then press',
    previous: (reference: string) =>
      `The previous version is available in the keyboard backups. Reference: ${reference}.`,
  },
  files: {
    smartset: 'SmartSet configuration',
    library: 'Advantage Studio library',
  },
  /** Errors reported by the desktop backend, by code (`src-tauri/src/error.rs`). */
  errors: {
    io: 'System error',
    connectionLocked: 'The keyboard connection is locked.',
    noDevice: 'No keyboard connected.',
    notMountedRoot:
      'Select the root of the mounted ADVANTAGE2 or KINESIS KB drive, not a backup folder.',
    notADevice:
      'This folder does not contain an Advantage2 v-Drive (missing active folder).',
    specialFile:
      'Symbolic links and special files are not accepted on the v-Drive.',
    unsupportedFirmware: 'The firmware does not match a supported Advantage2.',
    notText: 'This file is not a UTF-8 / ASCII text file.',
    fileTooLarge: 'The file is not regular or exceeds the allowed size.',
    invalidFilename: 'SmartSet file name not allowed.',
    invalidLayout: (line: number) =>
      `Invalid SmartSet configuration, line ${line}`,
    changedSinceRead:
      'The keyboard file changed since it was read. Reconnect the keyboard to read its configuration again before transferring.',
    changedDuringTransfer:
      'The file changed while the transfer was being prepared. No change applied.',
    verificationFailed:
      'The content read back differs from the expected configuration.',
    transferFailed: (cause: string, restored: boolean, backup: string) =>
      `Incomplete transfer: ${cause}. ${
        restored
          ? 'The original was written back.'
          : 'Automatic restoration failed; use the local backup.'
      } Local backup: ${backup}.`,
    invalidExport: 'Export to a .txt or .json file.',
    exportTooLarge: 'Export too large.',
    exportToDevice:
      'To write to the keyboard, use Apply to keyboard so a backup is kept and the v-Drive is respected.',
    libraryTooLarge: 'Library too large (64 MB).',
    invalidLibrary: 'Invalid library.',
    invalidBackupId: 'Invalid backup identifier.',
  },
};

export type Messages = typeof en;
