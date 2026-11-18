/**
 * What a physical key does in a layout, and how an edit of that key is
 * written back to the SmartSet file.
 */
import {
  defaultAction,
  locationToken,
  type Family,
  type Layer,
  type PhysicalKey,
} from './keyboard';
import {
  parseLayout,
  setAssignment,
  type Assignment,
  type Diagnostic,
  type ParsedLayout,
  type Rule,
} from './smartset';

export type BindingKind = Assignment['kind'];

export interface KeyBinding {
  /** Every rule of the location, including macros with co-triggers. */
  rules: Rule[];
  /** The rule fired by the key alone: a remap, a tap/hold or a direct macro. */
  primary?: Rule;
  /** Undefined for a native key; `macro` when only co-trigger macros exist. */
  kind?: BindingKind;
}

const isDirectMacro = (rule: Rule) =>
  rule.assignment.kind === 'macro' && rule.assignment.triggers.length === 1;

export function bindingAt(parsed: ParsedLayout, location: string): KeyBinding {
  const rules = parsed.rules.filter((rule) => rule.location === location);
  const primary =
    rules.find(isDirectMacro) ??
    rules.find((rule) => rule.assignment.kind !== 'macro');
  const kind = rules.length ? (primary?.assignment.kind ?? 'macro') : undefined;
  return { rules, primary, kind };
}

const LAYER_SWITCHES = ['kptoggle', 'kpshift'];
/** Layer switches must exist on both layers, as required by the manual. */
export const switchesLayer = (action: string) =>
  LAYER_SWITCHES.includes(action);

export type AssignResult =
  { ok: true; content: string } | { ok: false; error: Diagnostic };

/**
 * Writes the new behaviour of a key.
 * - A remap back to the native action deletes the rule.
 * - Leaving a direct macro deletes it; co-trigger variants survive.
 * - A layer switch is mirrored on the other layer.
 */
export function assignKey({
  content,
  family,
  key,
  layer,
  assignment,
  previous,
}: {
  content: string;
  family: Family;
  key: PhysicalKey;
  layer: Layer;
  assignment: Assignment;
  previous?: Assignment;
}): AssignResult {
  const location = locationToken(key, family, layer);
  const isNative =
    assignment.kind === 'remap' &&
    assignment.action === defaultAction(key, family, layer);
  let updated = setAssignment(
    content,
    family,
    location,
    isNative ? null : assignment,
  );
  if (assignment.kind !== 'macro' && previous?.kind === 'macro')
    updated = setAssignment(updated, family, location, null, [location]);

  const firstError = parseLayout(updated, family).diagnostics.find(
    (issue) => issue.severity === 'error',
  );
  if (firstError) return { ok: false, error: firstError };
  if (assignment.kind === 'remap' && switchesLayer(assignment.action)) {
    const otherLayer = layer === 'top' ? 'keypad' : 'top';
    updated = setAssignment(
      updated,
      family,
      locationToken(key, family, otherLayer),
      assignment,
    );
  }
  return { ok: true, content: updated };
}
