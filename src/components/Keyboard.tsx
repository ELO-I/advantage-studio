import type { CSSProperties } from 'react';
import {
  defaultAction,
  keyboard,
  locationToken,
  type Family,
  type Layer,
  type PhysicalKey,
} from '../domain/keyboard';
import type { ParsedLayout } from '../domain/smartset';
import { bindingAt, type KeyBinding } from '../domain/binding';
import { useI18n } from '../i18n/context';
import type { Translator } from '../i18n/translator';

/** Font size steps for long legends; widths come from the keyboard model. */
const legendSize = (legend: string) =>
  legend.length > 7
    ? 'key-label-small'
    : legend.length > 4
      ? 'key-label-medium'
      : '';

interface KeyFace {
  /** Big legend: the action, or the tap action of a tap/hold. */
  legend: string;
  /** Small legend: the hold action, or the native legend when asked. */
  subLegend?: string;
  /** Full description for assistive technologies and tooltips. */
  description: string;
}

function keyFace(
  { t, actionLabel, assignmentLabel }: Translator,
  key: PhysicalKey,
  binding: KeyBinding,
  family: Family,
  layer: Layer,
  showOriginal: boolean,
): KeyFace {
  const assignment = binding.primary?.assignment;
  const description =
    // Reserved by the firmware: shown, never remappable.
    t.keyboard.reservedLabels[key.id] ??
    (assignment
      ? assignmentLabel(assignment)
      : actionLabel(defaultAction(key, family, layer)));
  const original = actionLabel(key.defaults[family].top);
  if (assignment?.kind === 'tapHold')
    return {
      legend: actionLabel(assignment.tap),
      subLegend: actionLabel(assignment.hold),
      description,
    };
  const showNative = showOriginal && binding.kind && key.group !== 'function';
  return {
    legend: description,
    subLegend: showNative ? original : undefined,
    description,
  };
}

export function Keyboard({
  family,
  layer,
  parsed,
  selected,
  onSelect,
  showOriginal = false,
  showPedals = false,
  compact = false,
}: {
  family: Family;
  layer: Layer;
  parsed: ParsedLayout;
  selected?: string;
  onSelect?: (key: PhysicalKey) => void;
  showOriginal?: boolean;
  showPedals?: boolean;
  /** Static preview: keys are not interactive. */
  compact?: boolean;
}) {
  const translator = useI18n();
  const { t, actionLabel } = translator;
  const height = showPedals ? keyboard.height : keyboard.mainHeight;
  const KeyElement = compact ? 'span' : 'button';
  return (
    <div
      className={`keyboard ${compact ? 'keyboard-compact' : ''}`}
      style={
        {
          aspectRatio: `${keyboard.width} / ${height}`,
          '--keyboard-ratio': keyboard.width / height,
        } as CSSProperties
      }
      aria-label={t.keyboard.label(t.layers[layer])}
    >
      {keyboard.keys
        .filter((key) => showPedals || key.group !== 'pedal')
        .map((key) => {
          const location = locationToken(key, family, layer);
          const binding = bindingAt(parsed, location);
          const face = keyFace(
            translator,
            key,
            binding,
            family,
            layer,
            showOriginal,
          );
          const original = actionLabel(key.defaults[family].top);
          const classes = [
            'key',
            `key-${key.group}`,
            selected === key.id && 'key-selected',
          ];
          return (
            <KeyElement
              key={key.id}
              data-key-id={key.id}
              type={compact ? undefined : 'button'}
              disabled={compact ? undefined : !key.editable}
              className={classes.filter(Boolean).join(' ')}
              data-kind={binding.kind}
              style={{
                left: `${(key.x / keyboard.width) * 100}%`,
                top: `${(key.y / height) * 100}%`,
                width: `${(key.w / keyboard.width) * 100}%`,
                height: `${(key.h / height) * 100}%`,
                transform: `rotate(${key.rotation}deg)`,
              }}
              aria-pressed={compact ? undefined : selected === key.id}
              aria-label={t.keyboard.key(
                original,
                face.description,
                Boolean(binding.kind),
              )}
              title={
                key.editable
                  ? `${original} → ${face.description} · ${location}`
                  : t.keyboard.reserved
              }
              onClick={() => onSelect?.(key)}
            >
              <span className={`key-label ${legendSize(face.legend)}`}>
                {face.legend}
              </span>
              {face.subLegend && (
                <small className="key-sublabel">{face.subLegend}</small>
              )}
            </KeyElement>
          );
        })}
    </div>
  );
}
