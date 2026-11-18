# Design system

Advantage Studio borrows the identity of Kinesis without copying its website, and the clarity of ZSA's Oryx editor without copying its interface. Values are defined once in [`src/styles/tokens.css`](../src/styles/tokens.css); components only use semantic roles, never a raw colour.

## Principles

1. **The keyboard is the main object.** As in Oryx, it sits in the centre, without a card around it. The interface stays neutral so that only the keys carry colour.
2. **The keyboard looks like the Advantage2.** Black keycaps and light legends, placed directly on the background, with no drawn key well. A tap / hold key shows the tap action as its main legend and the hold action small underneath. Keys reserved by the firmware (Program, Keypad) are light grey.
3. **One colour = one binding kind.** The same colour is used on the keyboard, in the legend, the customisation list and the inspector: components set the `data-kind` attribute, and only `tokens.css` maps a kind to a colour.
4. **Black to act, green for state.** Primary buttons are charcoal. Kinesis green marks a selection, a remap, a success or the focus.

## Colours

| Role                      | Value                  | Origin                                 |
| ------------------------- | ---------------------- | -------------------------------------- |
| Heading / primary button  | `#282828`              | Kinesis site headings                  |
| Body text                 | `#404040`              | Kinesis body text                      |
| Secondary text            | `#5f666d`              | Darkened Kinesis grey (5.5:1 contrast) |
| App background            | `#f6f8fb`              | Kinesis light background               |
| Accent (selection, focus) | `#3ccb9a`              | Kinesis “Buy Now” button               |
| Accent as text            | `#0f7a5a`              | Darkened accent (5.3:1 on white)       |
| Slate                     | `#7691a1` to `#1f2b32` | Kinesis navigation band                |
| Keycap                    | `#2d3034`              | Advantage2 hardware                    |

### Binding kinds

| Kind       | Background             | Legend    | Contrast |
| ---------- | ---------------------- | --------- | -------- |
| Native     | black keycap `#2d3034` | `#eef0f2` | 11.6:1   |
| Remap      | green `#3ccb9a`        | `#0b3326` | 6.7:1    |
| Tap / Hold | slate `#c9d6df`        | `#1f2b32` | 9.8:1    |
| Macro      | blue `#b9dcf0`         | `#0d3b57` | 8.2:1    |
| Selected   | white, green ring      | `#282828` | 14.7:1   |

## Typography

Inter, bundled locally (no network loading). Scale: 11 / 12 / 13 / 15 / 20 / 26 px; weights 400, 500, 600. Section labels use spaced capitals (`0.08em`), like the Kinesis navigation. No interface text under 11 px; only keyboard legends follow the key size.

## Shape

- Radii: 4 px (controls), 6 px (lists, compound fields), 8 px (panels, windows).
- 1 px borders. Shadows reserved for floating elements (windows, notification).
- Controls are 36 px high, 30 px in the compact version.
- 16 px Lucide icons, only when they carry meaning.

## Layout

- Sidebar: navigation, configurations, then keyboard and save status at the bottom, and the language choice.
- Main area: configuration name and actions (Export, Apply), layer tabs, keyboard, legend.
- Inspector anchored on the right; when empty, it explains what to do.

## Wording

Every text lives in [`src/i18n`](../src/i18n): English is the reference catalog, French follows it. Labels name the action (“Save action”, “Apply to keyboard”), and messages say what happened and what to do next.
