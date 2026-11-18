//! Server-side validation of SmartSet layouts before they reach the keyboard.
//! Same rules as `src/domain/smartset.ts`, from the same bundled model.

use crate::error::{Error, Result};
use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    sync::LazyLock,
};

/// Mirrored in `src/domain/smartset.ts`.
pub const MAX_LAYOUT_BYTES: usize = 256 * 1024;
const FAMILIES: [&str; 2] = ["qwerty", "dvorak"];
const MAX_HID_CODE: u16 = 255;
const MAX_CO_TRIGGERS: usize = 2;
const MACRO_DELAYS: [&str; 2] = ["d125", "d500"];
#[derive(Deserialize)]
struct Model {
    actions: Vec<Action>,
    aliases: HashMap<String, String>,
    keys: Vec<Key>,
    #[serde(rename = "modifierTokens")]
    modifiers: Vec<String>,
}
#[derive(Deserialize)]
struct Action {
    token: String,
}
#[derive(Deserialize)]
struct Key {
    editable: bool,
    locations: HashMap<String, HashMap<String, String>>,
    defaults: HashMap<String, HashMap<String, String>>,
}
static MODEL: LazyLock<Model> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../resources/advantage2.json"))
        .expect("Invalid bundled Advantage2 model")
});

/// Family of an editable layout file: `qwerty.txt`, or a hotkey profile
/// such as `a_qwerty.txt`. Any other name (state.txt, paths…) is refused.
pub fn family(filename: &str) -> Result<&'static str> {
    let hotkey_prefix = |prefix: &str| {
        prefix.is_empty()
            || prefix.len() == 2
                && prefix.ends_with('_')
                && prefix.as_bytes()[0].is_ascii_alphanumeric()
    };
    FAMILIES
        .into_iter()
        .find(|family| {
            filename
                .strip_suffix(&format!("{family}.txt"))
                .is_some_and(hotkey_prefix)
        })
        .ok_or(Error::InvalidFilename)
}
fn normalize(token: &str) -> &str {
    MODEL
        .aliases
        .get(token)
        .map(String::as_str)
        .unwrap_or(token)
}
/// A named action, or a decimal HID usage code written on 2 or 3 digits.
fn is_action(token: &str) -> bool {
    MODEL
        .actions
        .iter()
        .any(|action| action.token == normalize(token))
        || ((2..=3).contains(&token.len())
            && token.bytes().all(|b| b.is_ascii_digit())
            && token
                .parse::<u16>()
                .is_ok_and(|number| number <= MAX_HID_CODE))
}
fn is_macro_timing(token: &str) -> bool {
    MACRO_DELAYS.contains(&token)
        || token
            .strip_prefix("speed")
            .is_some_and(|speed| matches!(speed.as_bytes(), [b'1'..=b'9']))
}
fn is_modifier(key: &Key, family: &str) -> bool {
    MODEL.modifiers.contains(&key.defaults[family]["top"])
}
/// Reason a line is invalid, in English: shown as a technical detail only,
/// since the interface already reports the same rules in the user's language.
type LineResult<T> = std::result::Result<T, &'static str>;

fn tokens(text: &str, open: char) -> LineResult<Vec<String>> {
    let close = if open == '[' { ']' } else { '}' };
    let mut remaining = text;
    let mut result = Vec::new();
    while !remaining.is_empty() {
        remaining = remaining
            .strip_prefix(open)
            .ok_or("incorrect brackets or braces")?;
        let index = remaining.find(close).ok_or("incomplete token")?;
        if index == 0 {
            return Err("empty token");
        }
        result.push(remaining[..index].to_ascii_lowercase());
        remaining = &remaining[index + 1..];
    }
    Ok(result)
}
fn position(token: &str, family: &str) -> Option<(&'static Key, &'static str)> {
    for key in MODEL.keys.iter().filter(|key| key.editable) {
        for (layer, value) in &key.locations[family] {
            if value == token {
                return Some((key, layer.as_str()));
            }
        }
    }
    None
}
pub fn validate(content: &str, family: &str) -> Result<()> {
    if !FAMILIES.contains(&family) {
        return Err(Error::InvalidFilename);
    }
    if content.len() > MAX_LAYOUT_BYTES {
        return Err(Error::FileTooLarge);
    }
    let mut seen = HashSet::new();
    for (index, line) in content.trim_start_matches('\u{feff}').lines().enumerate() {
        let text = line.trim();
        if text.is_empty() || text.starts_with('*') {
            continue;
        }
        let result = validate_line(text, family, &mut seen);
        if let Err(detail) = result {
            return Err(Error::InvalidLayout {
                line: index + 1,
                detail: detail.into(),
            });
        }
    }
    Ok(())
}
fn validate_line(text: &str, family: &str, seen: &mut HashSet<String>) -> LineResult<()> {
    if !text.bytes().all(|b| (32..=126).contains(&b)) {
        return Err("tokens must be ASCII");
    }
    let (source, output) = text.split_once('>').ok_or("missing > separator")?;
    let bracket = if source.starts_with('[') { '[' } else { '{' };
    let source = tokens(source, bracket)?;
    let output = tokens(output, bracket)?;
    let location = source.last().ok_or("missing position")?;
    let (key, layer) = position(location, family).ok_or("unknown position for this family")?;
    if output.is_empty() {
        return Err("missing action");
    }
    if bracket == '[' {
        if source.len() != 1 {
            return Err("a remap targets a single position");
        }
        let tap_hold = output.len() == 3
            && is_action(&output[0])
            && is_action(&output[2])
            && output[1].strip_prefix("t&h").is_some_and(|delay| {
                delay.len() <= 3
                    && delay
                        .parse::<u16>()
                        .is_ok_and(|value| (1..=999).contains(&value))
            });
        if !(output.len() == 1 && is_action(&output[0]) || tap_hold) {
            return Err("invalid remap or tap / hold");
        }
    } else {
        if is_modifier(key, family) {
            return Err("a modifier position cannot trigger a macro on its own");
        }
        if source.len() > MAX_CO_TRIGGERS + 1
            || source.iter().collect::<HashSet<_>>().len() != source.len()
        {
            return Err("at most two co-triggers, without duplicates");
        }
        for token in &source[..source.len() - 1] {
            let (co_key, co_layer) = position(token, family).ok_or("unknown co-trigger")?;
            if co_layer != layer || !is_modifier(co_key, family) {
                return Err("co-trigger is not a modifier of the same layer");
            }
        }
        let mut held = HashSet::new();
        for token in &output {
            if token.starts_with(['-', '+']) {
                let action = normalize(&token[1..]).to_string();
                if !is_action(&action) {
                    return Err("unknown macro action");
                }
                if token.starts_with('-') {
                    if !held.insert(action) {
                        return Err("key pressed twice without release");
                    }
                } else if !held.remove(&action) {
                    return Err("release without press");
                }
            } else if !is_action(token) && !is_macro_timing(token) {
                return Err("unknown macro action or delay");
            }
        }
        if !held.is_empty() {
            return Err("keys left pressed in the macro");
        }
    }
    let mut identity = source[..source.len() - 1].to_vec();
    identity.sort();
    identity.push(location.clone());
    if !seen.insert(format!("{bracket}{}", identity.join("|"))) {
        return Err("duplicate declaration");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn valid_examples() {
        for content in [
            "[caps]>[lctrl]",
            "[u]>[a]\n",
            "[lshift]>[esc][t&h250][lshift]",
            "{lctrl}{a}>{-lctrl}{c}{+lctrl}",
            "[kp7]>[f14]\r\n{kp-q}>{h}{d500}{i}",
            "* Disabled rule\n",
        ] {
            assert!(validate(content, "qwerty").is_ok(), "{content}");
        }
    }
    #[test]
    fn rejects_invalid_macros_and_positions() {
        for content in [
            "[program]>[a]",
            "[keypad]>[b]",
            "{lctrl}>{a}",
            "{a}>{-lctrl}{c}",
            "{a}>{d250}",
            "{lctrl}{kp-a}>{c}",
            "[a]>[b]\n[A]>[c]",
            "[kp-u]>[a]",
            "{a}>{speed0}",
        ] {
            assert!(validate(content, "qwerty").is_err(), "{content}");
        }
    }
    #[test]
    fn restricts_names() {
        for filename in [
            "../qwerty.txt",
            "state.txt",
            "do_not_edit.txt",
            "ab_qwerty.txt",
            "QWERTY.txt",
        ] {
            assert!(family(filename).is_err());
        }
        for filename in ["qwerty.txt", "dvorak.txt", "1_qwerty.txt", "a_dvorak.txt"] {
            assert!(family(filename).is_ok());
        }
    }
}
