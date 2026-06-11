export type Modifier = "mod" | "shift" | "alt";

export type Hotkey = {
  key: string;
  mods: Modifier[];
};

export function matchHotkey(e: KeyboardEvent, hotkey: Hotkey): boolean {
  // On macOS, holding Option turns letter keys into alternate glyphs
  // (e.g. ⌥+D → "∂", ⌥+⇧+D → "Í"), so `e.key` no longer matches the binding.
  // Fall back to `e.code` ("KeyD") which is layout- and modifier-independent.
  const wantKey = hotkey.key.toLowerCase();
  const gotKey = e.key.toLowerCase();
  const codeKey = e.code.startsWith("Key") ? e.code.slice(3).toLowerCase() : "";
  if (gotKey !== wantKey && codeKey !== wantKey) return false;
  const wantMod = hotkey.mods.includes("mod");
  const wantShift = hotkey.mods.includes("shift");
  const wantAlt = hotkey.mods.includes("alt");
  const hasMod = e.metaKey || e.ctrlKey;
  if (wantMod !== hasMod) return false;
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;
  return true;
}

/**
 * Match a canonical accelerator string from the Rust side ("super+KeyK",
 * "super+alt+KeyN") against a KeyboardEvent. The key part is a W3C `code`
 * value, so the comparison is layout-independent; modifiers are matched
 * strictly (an extra held modifier does not match).
 */
export function matchAccelerator(e: KeyboardEvent, accelerator: string): boolean {
  if (!accelerator) return false;
  let wantMeta = false;
  let wantAlt = false;
  let wantShift = false;
  let wantCtrl = false;
  let code = "";
  for (const part of accelerator.split("+")) {
    const p = part.trim();
    if (!p) continue;
    const lower = p.toLowerCase();
    if (lower === "super") wantMeta = true;
    else if (lower === "alt") wantAlt = true;
    else if (lower === "shift") wantShift = true;
    else if (lower === "ctrl") wantCtrl = true;
    else code = p;
  }
  if (!code) return false;
  return (
    e.code === code &&
    e.metaKey === wantMeta &&
    e.altKey === wantAlt &&
    e.shiftKey === wantShift &&
    e.ctrlKey === wantCtrl
  );
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

export function modSymbol(): string {
  return isMac() ? "⌘" : "Ctrl";
}

export function shortcutLabel(hotkey: Hotkey): string {
  const parts: string[] = [];
  if (hotkey.mods.includes("mod")) parts.push(modSymbol());
  if (hotkey.mods.includes("shift")) parts.push("⇧");
  if (hotkey.mods.includes("alt")) parts.push(isMac() ? "⌥" : "Alt");
  parts.push(hotkey.key.length === 1 ? hotkey.key.toUpperCase() : hotkey.key);
  return parts.join(isMac() ? "" : "+");
}
