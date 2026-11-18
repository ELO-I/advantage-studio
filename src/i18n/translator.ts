/**
 * Turns domain values (actions, diagnostics, history entries, backend errors)
 * into text for one locale. Pure: usable in tests and outside React.
 */
import { findAction, familyLabel, normalizeToken } from '../domain/keyboard';
import type { Assignment, Diagnostic } from '../domain/smartset';
import type { KeyBinding } from '../domain/binding';
import { changes, type Change, type Snapshot } from '../domain/library';
import type { StorageError } from '../hooks/useLibrary';
import { en, type Messages } from './en';
import { fr } from './fr';

export const locales = [
  { id: 'en', name: 'English', intl: 'en-US', messages: en },
  { id: 'fr', name: 'Français', intl: 'fr-CA', messages: fr },
] as const;
export type Locale = (typeof locales)[number]['id'];
export const defaultLocale: Locale = 'en';
export const isLocale = (value: unknown): value is Locale =>
  locales.some((locale) => locale.id === value);

/** Error sent by the desktop backend: `{ code, ...details }` (`src-tauri/src/error.rs`). */
type BackendError =
  | {
      code: Exclude<
        keyof Messages['errors'],
        'io' | 'invalidLayout' | 'transferFailed'
      >;
    }
  | { code: 'io'; detail: string }
  | { code: 'invalidLayout'; line: number; detail: string }
  | {
      code: 'transferFailed';
      cause: BackendError;
      restored: boolean;
      backupId: string;
    };
const isBackendError = (error: unknown): error is BackendError =>
  typeof error === 'object' &&
  error !== null &&
  typeof (error as { code?: unknown }).code === 'string' &&
  (error as { code: string }).code in en.errors;

export function createTranslator(locale: Locale) {
  const { messages: t, intl } = locales.find((item) => item.id === locale)!;

  const actionLabel = (token: string) => {
    const normalized = normalizeToken(token);
    return (
      t.actions.labels[normalized] ?? findAction(normalized)?.label ?? token
    );
  };
  const actionName = (token: string) => {
    const normalized = normalizeToken(token);
    return t.actions.names[normalized] ?? findAction(normalized)?.name ?? token;
  };
  const assignmentLabel = (assignment: Assignment) => {
    switch (assignment.kind) {
      case 'remap':
        return actionLabel(assignment.action);
      case 'tapHold':
        return `${actionLabel(assignment.tap)} / ${actionLabel(assignment.hold)}`;
      case 'macro':
        return t.kinds.macro;
    }
  };
  /** Short summary of a key, e.g. for the customisation list. */
  const bindingLabel = (binding: KeyBinding) =>
    binding.primary
      ? assignmentLabel(binding.primary.assignment)
      : t.keyboard.macros(binding.rules.length);

  const diagnostic = (issue: Diagnostic) =>
    issue.code === 'unknownLocation'
      ? t.diagnostics.unknownLocation(familyLabel(issue.family), issue.location)
      : t.diagnostics[issue.code];

  /** Libraries written before history codes existed keep their free text. */
  const historyLabel = (snapshot: Pick<Snapshot, 'label' | 'key'>) => {
    if (!(changes as readonly string[]).includes(snapshot.label))
      return snapshot.label;
    const key = snapshot.key ? actionLabel(snapshot.key) : '';
    return t.history.changes[snapshot.label as Change](key);
  };

  const backendError = (error: BackendError): string => {
    switch (error.code) {
      case 'io':
        return `${t.errors.io}: ${error.detail}`;
      case 'invalidLayout':
        return `${t.errors.invalidLayout(error.line)} (${error.detail})`;
      case 'transferFailed':
        return t.errors.transferFailed(
          backendError(error.cause).replace(/\.$/, ''),
          error.restored,
          error.backupId,
        );
      default:
        return t.errors[error.code];
    }
  };
  /** Backend errors arrive as `{ code }` objects, JavaScript errors as Error. */
  const errorMessage = (error: unknown): string => {
    if (isBackendError(error)) return backendError(error);
    if (error instanceof Error) return error.message;
    return typeof error === 'object' ? JSON.stringify(error) : String(error);
  };

  const storageErrorMessage = ({ operation, cause }: StorageError) =>
    (operation === 'load' ? t.app.loadFailed : t.app.saveFailed)(
      errorMessage(cause),
    );

  const formatDate = (iso: string) => new Date(iso).toLocaleString(intl);

  return {
    locale,
    t,
    actionLabel,
    actionName,
    assignmentLabel,
    bindingLabel,
    diagnostic,
    historyLabel,
    errorMessage,
    storageErrorMessage,
    formatDate,
  };
}
export type Translator = ReturnType<typeof createTranslator>;
