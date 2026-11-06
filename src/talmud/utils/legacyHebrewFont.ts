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
const FINAL_END = /[ךםןףץ]$/;
const CLOSING_LETTER = /^[יוהךםןףץ]$/;
/** Word endings that never stand alone (שהכה|ים, כדת|יא). */
const ORPHAN_ENDING = /^(ים|ין|יא|יה)$/;

/** Some Mac-Hebrew fonts report the lost נ as a control character instead of a space. */
const CONTROL_NUN = /[\u0001-\u001f]/g;

export interface NunHealOptions {
  /** A quote mark (ק"ש, ר') touches the first word of the run. */
  quoteAtStart?: boolean;
  /** A quote mark touches the last word of the run. */
  quoteAtEnd?: boolean;
}

/**
 * Mac-Hebrew scans lose the letter נ (MacRoman 0xF0 has no Unicode twin), which PDF.js reports
 * as a plain space: לפניה arrives as "לפ יה", כנסים as "כ סים". A Hebrew word never ends in a
 * non-final כ/מ/נ/פ/צ and a lone letter is not a word, so such gaps are restored as נ —
 * except a lone letter next to a quote mark, which is part of an abbreviation (ק"ש אימת, לאו ר').
 */
export function healLostNun(text: string, opts: NunHealOptions = {}): string {
  const parts = text.split(' ');
  const out: string[] = [];
  let firstUntouched = true;
  parts.forEach((part, i) => {
    const prev = out[out.length - 1];
    const next = parts[i + 1];
    const prevIsQuotedLetter = opts.quoteAtStart && out.length === 1 && firstUntouched && prev?.length === 1;
    const partIsQuotedLetter = opts.quoteAtEnd && i === parts.length - 1 && part.length === 1;
    const canGlue =
      prev !== undefined &&
      !prevIsQuotedLetter &&
      !partIsQuotedLetter &&
      HEB.test(prev) &&
      HEB.test(part) &&
      // A final letter (ם ן ך ף ץ) always ends a word: the gap after it is a real space.
      !FINAL_END.test(prev);
    let join = false;
    if (canGlue) {
      if (NON_FINAL_END.test(prev)) join = true;
      // Two lone letters are one word split by its נ (ת א → תנא).
      else if (prev.length === 1 && part.length === 1) join = true;
      // A lone letter: word endings נ+י/ו/ה or a final letter close the previous fragment (שא י → שאני);
      // any other letter opens the following one (ד יאל → דניאל) unless it ends the run.
      else if (part.length === 1) join = CLOSING_LETTER.test(part) || !(next && HEB.test(next));
      else if (prev.length === 1) join = true;
      else if (ORPHAN_ENDING.test(part)) join = true;
    }
    if (join) {
      out[out.length - 1] = `${prev}נ${part}`;
      if (out.length === 1) firstUntouched = false;
    } else out.push(part);
  });
  return out.join(' ');
}

export function decodeLegacyHebrew(
  str: string,
  opts: NunHealOptions & { controlNunFont?: boolean } = {}
): string {
  if (!isLegacyHebrewRun(str)) return str;
  const isMac = Array.from(str).some((ch) => MAC_ONLY.has(ch));
  const hasControlNun = isMac && (opts.controlNunFont || /[\u0001-\u001f]/.test(str));
  const mapped = Array.from(str, (ch) => MAP.get(ch) ?? MIRROR[ch] ?? ch);
  let text = mapped.reverse().join('');
  if (!isMac) return text;
  // This font prints נ as a control code, so its spaces are real word gaps.
  if (hasControlNun) return text.replace(CONTROL_NUN, 'נ');
  return healLostNun(text, opts);
}

const isQuoteItem = (it: unknown) => /^\s*["'\u05F3\u05F4`]+\s*$/.test(String((it as { str?: unknown })?.str ?? ''));
const itemX = (it: unknown) => Number((it as { transform?: number[] })?.transform?.[4]) || 0;
const itemY = (it: unknown) => Number((it as { transform?: number[] })?.transform?.[5]) || 0;

/** Returns text items with legacy-font runs decoded; geometry is untouched. */
export function decodeLegacyHebrewItems<T extends { str?: unknown }>(items: T[]): T[] {
  // Fonts that print נ as a control code anywhere on the page do so everywhere.
  const controlNunFonts = new Set<string>();
  for (const it of items) {
    const s = typeof it?.str === 'string' ? it.str : '';
    const font = (it as { fontName?: string }).fontName;
    if (font && /[\u0001-\u001f]/.test(s) && isLegacyHebrewRun(s)) controlNunFonts.add(font);
  }
  // Vowelled verse fonts (Torah Or) print Hebrew as Latin letters with separate nikud glyph items.
  const latinVerseFonts = new Set<string>();
  for (const it of items) {
    const s = typeof it?.str === 'string' ? it.str : '';
    const font = (it as { fontName?: string }).fontName;
    if (font && s && LATIN_NIKUD_ONLY.test(s)) latinVerseFonts.add(font);
  }
  return items.map((it, i) => {
    const font = (it as { fontName?: string }).fontName;
    if (font && latinVerseFonts.has(font)) return decodeLatinVerseItem(it);
    return repairControlNun(decodeItem(it, i));
  });
  function decodeItem(it: T, i: number): T {
    const s = typeof it?.str === 'string' ? it.str : '';
    if (!isLegacyHebrewRun(s)) return it;
    // A quote item printed right beside this run: visually left = touches the reading end.
    let quoteAtStart = false;
    let quoteAtEnd = false;
    for (const n of [items[i - 1], items[i + 1]]) {
      if (!n || !isQuoteItem(n) || Math.abs(itemY(n) - itemY(it)) > 3) continue;
      if (itemX(n) < itemX(it)) quoteAtEnd = true;
      else quoteAtStart = true;
    }
    const font = (it as { fontName?: string }).fontName;
    const d = decodeLegacyHebrew(s, { quoteAtStart, quoteAtEnd, controlNunFont: !!font && controlNunFonts.has(font) });
    return d === s ? it : { ...it, str: d };
  }
}

const LATIN_NIKUD_ONLY = /^[\u00A4-\u00A9\u0178]+$/;
const LATIN_VERSE_MAP: Record<string, string> = {
  '`': 'א', a: 'ב', b: 'ג', c: 'ד', d: 'ה', e: 'ו', f: 'ז', g: 'ח', h: 'ט', i: 'י', j: 'ך', k: 'כ',
  l: 'ל', m: 'ם', n: 'מ', o: 'ן', p: 'נ', q: 'ס', r: 'ע', s: 'ף', t: 'פ', u: 'ץ', v: 'צ', w: 'ק',
  x: 'ר', y: 'ש', z: 'ת',
  // Vowel/dagesh-bearing variants observed in the Vilna verse font.
  A: 'ב', B: 'ג', C: 'ד', D: 'ה', E: 'ו', F: 'ו', G: 'ח', H: 'ט', I: 'י', K: 'ך', L: 'ך', M: 'כ',
  N: 'ל', O: 'מ', P: 'נ', R: 'ו', T: 'פ', U: 'ש', V: 'צ', W: 'ש', X: 'ר', Y: 'ת', Z: 'ת',
  '\u00F5': 'א', '\u00F7': 'ל',
};

/** Decodes a Latin-encoded vowelled verse run (visual order) into Hebrew; nikud glyphs vanish. */
export function decodeLatinVerseText(s: string): string {
  const mapped = Array.from(s.replace(/[\u00A4-\u00A9\u0178\u00F7]/g, ''), (ch) => LATIN_VERSE_MAP[ch] ?? (/[A-Za-z]/.test(ch) ? '' : ch));
  return mapped.reverse().join('').replace(/\s+/g, ' ');
}

function decodeLatinVerseItem<T extends { str?: unknown }>(it: T): T {
  const s = typeof it?.str === 'string' ? it.str : '';
  if (!s || LATIN_NIKUD_ONLY.test(s)) return { ...it, str: '' };
  return { ...it, str: decodeLatinVerseText(s) };
}

/** Any Hebrew run (decoded or Unicode) may still carry נ as a control code: יוח\x15ן → יוחנן. */
function repairControlNun<T extends { str?: unknown }>(it: T): T {
  const s = typeof it?.str === 'string' ? it.str : '';
  return /[\u05D0-\u05EA][\u0001-\u001f]|[\u0001-\u001f][\u05D0-\u05EA]/.test(s)
    ? { ...it, str: s.replace(/[\u0001-\u001f]/g, 'נ') }
    : it;
}
