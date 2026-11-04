// @ts-nocheck
/**
 * Many classic Vilna PDFs (HebrewBooks / Shas.org) embed old 8-bit Hebrew fonts without a
 * Unicode map, so PDF.js reports Latin look-alikes instead of Hebrew letters, stored in
 * visual (right-to-left reversed) order. Two layouts occur:
 *  - Windows-1255 style: à..ú (U+00E0–U+00FA) → א..ת
 *  - Mac Hebrew style:   MacRoman bytes 0xE0–0xFA (‡ · ‚ „ ‰ Â …) → א..ת
 * This restores real Hebrew, in reading order, so every scan gets the same text engine.
 */
const MAC_ROMAN_E0_FA =
  '\u2021\u00b7\u201a\u201e\u2030\u00c2\u00ca\u00c1\u00cb\u00c8\u00cd\u00ce\u00cf\u00cc\u00d3\u00d4\uf8ff\u00d2\u00da\u00db\u00d9\u0131\u02c6\u02dc\u00af\u02d8\u02d9';

const MAP = new Map<string, string>();
for (let i = 0; i <= 0x1a; i++) {
  const heb = String.fromCharCode(0x05d0 + i);
  MAP.set(String.fromCharCode(0x00e0 + i), heb);
  MAP.set(MAC_ROMAN_E0_FA[i], heb);
}

const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[' };

export function isLegacyHebrewRun(str: string): boolean {
  if (!str || /[\u05d0-\u05ea]/.test(str)) return false;
  let hits = 0;
  for (const ch of str) if (MAP.has(ch)) hits++;
  return hits > 0 && hits >= Math.ceil(str.replace(/[\s\d.,:;'"()[\]\-]/g, '').length * 0.6);
}

const MAC_ONLY = new Set(Array.from(MAC_ROMAN_E0_FA).filter((c) => c.charCodeAt(0) > 0xff || c === '\u00b7'));
const HEB = /^[\u05d0-\u05ea]+$/;
const NON_FINAL_END = /[כמנפצ]$/;
/** Word endings that never stand alone (שהכה|ים, כדת|יא). */
const ORPHAN_ENDING = /^(ים|ין|יא|יה)$/;

/**
 * Mac-Hebrew scans lose the letter נ (MacRoman 0xF0 has no Unicode twin), which PDF.js reports
 * as a plain space: לפניה arrives as "לפ יה", כנסים as "כ סים". A Hebrew word never ends in a
 * non-final כ/מ/נ/פ/צ and a lone letter is not a word, so such gaps are restored as נ.
 */
export function healLostNun(text: string): string {
  const parts = text.split(' ');
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    const join =
      prev !== undefined &&
      HEB.test(prev) &&
      HEB.test(part) &&
      (NON_FINAL_END.test(prev) || prev.length === 1 || part.length === 1 || ORPHAN_ENDING.test(part));
    if (join) out[out.length - 1] = `${prev}נ${part}`;
    else out.push(part);
  }
  return out.join(' ');
}

export function decodeLegacyHebrew(str: string): string {
  if (!isLegacyHebrewRun(str)) return str;
  const mapped = Array.from(str, (ch) => MAP.get(ch) ?? MIRROR[ch] ?? ch);
  const text = mapped.reverse().join('');
  const isMac = Array.from(str).some((ch) => MAC_ONLY.has(ch));
  return isMac ? healLostNun(text) : text;
}

/** Returns text items with legacy-font runs decoded; geometry is untouched. */
export function decodeLegacyHebrewItems<T extends { str?: unknown }>(items: T[]): T[] {
  return items.map((it) => {
    const s = typeof it?.str === 'string' ? it.str : '';
    const d = decodeLegacyHebrew(s);
    return d === s ? it : { ...it, str: d };
  });
}
