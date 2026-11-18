/**
 * SmartSet layout files: parsing, validation and line-preserving edits.
 * Syntax reference: Advantage2 user manual (June 2021), chapter « Programming ».
 */
import {
  findLocation,
  isAction,
  isModifierKey,
  normalizeToken,
  type Family,
} from './keyboard';

export type Assignment =
  | { kind: 'remap'; action: string }
  | { kind: 'tapHold'; tap: string; hold: string; delay: number }
  | { kind: 'macro'; triggers: string[]; sequence: string[] };
export interface Rule {
  line: number;
  location: string;
  assignment: Assignment;
}
/** What is wrong with a line; the message is written by the interface (`src/i18n`). */
export type Issue =
  | {
      code:
        | 'tooLarge'
        | 'notAscii'
        | 'unknownSyntax'
        | 'brackets'
        | 'remapSingleLocation'
        | 'invalidRemap'
        | 'modifierMacro'
        | 'coTriggers'
        | 'unbalancedMacro'
        | 'longMacro'
        | 'duplicate';
    }
  | { code: 'unknownLocation'; family: Family; location: string };
export type Diagnostic = Issue & {
  /** 0 for the whole file. */
  line: number;
  severity: 'error' | 'warning';
};
export interface ParsedLayout {
  rules: Rule[];
  diagnostics: Diagnostic[];
}

/** Application safety limit, mirrored in the Rust backend. */
export const MAX_LAYOUT_BYTES = 256 * 1024;
export const MAX_CO_TRIGGERS = 2;
const LONG_MACRO_TOKENS = 300;
const MACRO_DELAYS = /^d(125|500)$/;
const MACRO_SPEED = /^speed[1-9]$/;
const TAP_HOLD = /^t&h(\d{1,3})$/;

export const stripBom = (text: string) => text.replace(/^\uFEFF/, '');
const splitLines = (content: string) => stripBom(content).split(/\r?\n/);

export const hasErrors = (parsed: ParsedLayout) =>
  parsed.diagnostics.some((issue) => issue.severity === 'error');

/** `{a}{b}` ⇄ `['a', 'b']`. Returns null when the text is not a token list. */
export function parseMacroSequence(text: string): string[] | null {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return tokens(trimmed, '{');
}
export const formatMacroSequence = (sequence: string[]) =>
  sequence.map((token) => `{${token}}`).join('');

function tokens(text: string, bracket: '[' | '{'): string[] | null {
  const end = bracket === '[' ? ']' : '}';
  const result: string[] = [];
  let index = 0;
  while (index < text.length) {
    if (text[index] !== bracket) return null;
    const close = text.indexOf(end, index + 1);
    if (close === -1 || close === index + 1) return null;
    result.push(text.slice(index + 1, close).toLowerCase());
    index = close + 1;
  }
  return result;
}

type LineResult =
  | { error: Issue }
  | {
      location: string;
      assignment: Assignment;
      identity: string;
      warning?: Issue;
    };

function parseRemap(output: string[]): Assignment | null {
  if (output.length === 1 && isAction(output[0]))
    return { kind: 'remap', action: normalizeToken(output[0]) };
  const delay = output.length === 3 ? TAP_HOLD.exec(output[1]) : null;
  if (
    delay &&
    Number(delay[1]) >= 1 &&
    isAction(output[0]) &&
    isAction(output[2])
  )
    return {
      kind: 'tapHold',
      tap: normalizeToken(output[0]),
      hold: normalizeToken(output[2]),
      delay: Number(delay[1]),
    };
  return null;
}

/** Every pressed (−) action must be released (+) once, in order. */
function isBalancedSequence(sequence: string[]): boolean {
  const held = new Set<string>();
  for (const token of sequence) {
    const press = token[0];
    if (press === '-' || press === '+') {
      const action = normalizeToken(token.slice(1));
      if (!isAction(action)) return false;
      if (press === '-') {
        if (held.has(action)) return false;
        held.add(action);
      } else if (!held.delete(action)) return false;
    } else if (
      !isAction(token) &&
      !MACRO_SPEED.test(token) &&
      !MACRO_DELAYS.test(token)
    )
      return false;
  }
  return held.size === 0;
}

function parseLine(text: string, family: Family): LineResult {
  if (/[^\x20-\x7E]/.test(text)) return { error: { code: 'notAscii' } };
  const separator = text.indexOf('>');
  if (separator === -1) return { error: { code: 'unknownSyntax' } };
  const bracket = text.startsWith('[') ? '[' : '{';
  const source = tokens(text.slice(0, separator), bracket);
  const output = tokens(text.slice(separator + 1), bracket);
  if (!source?.length || !output?.length)
    return { error: { code: 'brackets' } };
  const location = source.at(-1)!;
  const physical = findLocation(location, family);
  if (!physical)
    return { error: { code: 'unknownLocation', family, location } };
  const coTriggers = source.slice(0, -1);
  const identity = bracket + [...coTriggers].sort().concat(location).join('|');

  if (bracket === '[') {
    if (coTriggers.length) return { error: { code: 'remapSingleLocation' } };
    const assignment = parseRemap(output);
    if (!assignment) return { error: { code: 'invalidRemap' } };
    return { location, assignment, identity };
  }

  if (isModifierKey(physical.key, family))
    return { error: { code: 'modifierMacro' } };
  const validCoTriggers =
    coTriggers.length <= MAX_CO_TRIGGERS &&
    new Set(source).size === source.length &&
    coTriggers.every((token) => {
      const coTrigger = findLocation(token, family);
      return (
        coTrigger?.layer === physical.layer &&
        isModifierKey(coTrigger.key, family)
      );
    });
  if (!validCoTriggers) return { error: { code: 'coTriggers' } };
  if (!isBalancedSequence(output))
    return { error: { code: 'unbalancedMacro' } };
  return {
    location,
    assignment: { kind: 'macro', triggers: source, sequence: output },
    identity,
    warning:
      output.length > LONG_MACRO_TOKENS ? { code: 'longMacro' } : undefined,
  };
}

export function parseLayout(content: string, family: Family): ParsedLayout {
  const rules: Rule[] = [];
  const diagnostics: Diagnostic[] = [];
  const seen = new Set<string>();
  const report = (
    line: number,
    issue: Issue,
    severity: Diagnostic['severity'] = 'error',
  ) => diagnostics.push({ ...issue, line, severity });

  if (new TextEncoder().encode(content).length > MAX_LAYOUT_BYTES)
    report(0, { code: 'tooLarge' });
  splitLines(content).forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trim();
    if (!text || text.startsWith('*')) return;
    const result = parseLine(text, family);
    if ('error' in result) {
      report(line, result.error);
      return;
    }
    if (seen.has(result.identity)) report(line, { code: 'duplicate' });
    seen.add(result.identity);
    if (result.warning) report(line, result.warning, 'warning');
    rules.push({
      line,
      location: result.location,
      assignment: result.assignment,
    });
  });
  return { rules, diagnostics };
}

export function serializeRule(
  location: string,
  assignment: Assignment,
): string {
  switch (assignment.kind) {
    case 'remap':
      return `[${location}]>[${assignment.action}]`;
    case 'tapHold':
      return `[${location}]>[${assignment.tap}][t&h${assignment.delay}][${assignment.hold}]`;
    case 'macro':
      return `${formatMacroSequence(assignment.triggers)}>${formatMacroSequence(assignment.sequence)}`;
  }
}

/**
 * Replaces the rule of one location, or deletes it with `null`.
 * Remaps and tap/hold share a slot; each macro is identified by its triggers.
 * Unrelated lines, disabled rules and other macros survive untouched.
 */
export function setAssignment(
  content: string,
  family: Family,
  location: string,
  assignment: Assignment | null,
  macroTriggers?: string[],
): string {
  const triggers =
    assignment?.kind === 'macro' ? assignment.triggers : macroTriggers;
  const replaced = new Set(
    parseLayout(content, family)
      .rules.filter(
        (rule) =>
          rule.location === location &&
          (triggers
            ? rule.assignment.kind === 'macro' &&
              rule.assignment.triggers.join('|') === triggers.join('|')
            : rule.assignment.kind !== 'macro'),
      )
      .map((rule) => rule.line - 1),
  );
  const replacement = assignment ? serializeRule(location, assignment) : null;
  let placed = false;
  const updated: string[] = [];
  splitLines(content).forEach((line, index) => {
    if (!replaced.has(index)) updated.push(line);
    else if (!placed && replacement) {
      updated.push(replacement);
      placed = true;
    }
  });
  if (!placed && replacement) {
    while (updated.at(-1) === '') updated.pop();
    updated.push(replacement);
  }
  return updated.join('\n');
}

/** Removes every rule (remap, tap/hold and macros) of a location. */
export function removeLocation(
  content: string,
  family: Family,
  location: string,
): string {
  const removed = new Set(
    parseLayout(content, family)
      .rules.filter((rule) => rule.location === location)
      .map((rule) => rule.line - 1),
  );
  return splitLines(content)
    .filter((_, index) => !removed.has(index))
    .join('\n');
}

/** SmartSet files use CRLF and end with a line break when not empty. */
export function exportLayout(content: string): string {
  const body = stripBom(content)
    .replace(/\r?\n/g, '\r\n')
    .replace(/(?:\r\n)+$/, '');
  return body.trim() ? `${body}\r\n` : body;
}

/** Guesses the layout family from a SmartSet file name (`a_dvorak.txt`). */
export const familyOfFile = (filename: string): Family =>
  /dvorak/i.test(filename) ? 'dvorak' : 'qwerty';

/** Keyboard shortcut that makes the Advantage2 reload a layout file. */
export function reloadShortcut(filename: string): string {
  if (filename === 'qwerty.txt') return 'Program + F3';
  if (filename === 'dvorak.txt') return 'Program + F4';
  return `Program + ${filename[0]?.toUpperCase()}`;
}

const UNSHIFTED: Record<string, string> = {
  ' ': 'space',
  '\n': 'enter',
  '\t': 'tab',
  '-': 'hyphen',
  '[': 'obrack',
  ']': 'cbrack',
};
const SHIFTED: Record<string, string> = {
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: 'hyphen',
  '+': '=',
  '{': 'obrack',
  '}': 'cbrack',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
  '|': '\\',
  '~': '`',
};

/** Text is translated to US HID keys, never guessed for unsupported Unicode. */
export function textMacro(text: string): {
  sequence: string[];
  unsupported: string[];
} {
  const sequence: string[] = [];
  const unsupported = new Set<string>();
  for (const character of text) {
    const shift = /[A-Z]/.test(character) || character in SHIFTED;
    const token =
      SHIFTED[character] ?? UNSHIFTED[character] ?? character.toLowerCase();
    if (!isAction(token)) unsupported.add(character);
    else if (shift) sequence.push('-lshift', token, '+lshift');
    else sequence.push(token);
  }
  return { sequence, unsupported: [...unsupported] };
}
