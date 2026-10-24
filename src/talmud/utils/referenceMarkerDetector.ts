/**
 * Reference-marker detection for the Vilna Tzurat HaDaf page.
 *
 * A token is a marker ONLY when the WHOLE token (after trimming) is an isolated
 * marker: bracketed letters, a lone digit, a circle symbol, or a tiny superscript
 * letter. Letters that sit inside a regular word are never matched — every
 * pattern below is anchored with ^...$ and the key must be a valid marker index.
 */

export type MarkerTargetType =
  | 'bach'
  | 'masoret'
  | 'ein-mishpat'
  | 'torah-or'
  | 'gra'
  | 'gilyon-hashas';

export type DafSection = 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';

export interface MarkerDetection {
  isSmallMarker: boolean;
  targetType?: MarkerTargetType;
  key?: string;
  displayWord?: string;
}

/** Max font height (PDF units) for a letter in running text to count as a superscript marker. */
export const SUPERSCRIPT_MAX_PDF_HEIGHT = 7.2;

const NOT_A_MARKER: MarkerDetection = { isSmallMarker: false };

/** Valid marker index: א..ט, י..צ optionally + unit (יא, כג), and טו / טז. Max value 99. */
const MARKER_KEY = '(?:[\\u05D0-\\u05D8]|[\\u05D9\\u05DB\\u05DC\\u05DE\\u05E0\\u05E1\\u05E2\\u05E4\\u05E6][\\u05D0-\\u05D8]?|\\u05D8[\\u05D5\\u05D6])';
const PUNCT = '[.:]?';

const RE_BACH = new RegExp(
  `^(?:\\(${MARKER_KEY}${PUNCT}\\)|\\)${MARKER_KEY}${PUNCT}\\()${PUNCT}$`
);
const RE_GRA = new RegExp(
  `^(?:\\[${MARKER_KEY}${PUNCT}\\]|\\]${MARKER_KEY}${PUNCT}\\[)${PUNCT}$`
);
// Single-paren markers rarely exceed 29 per page; capping at כט avoids words like (לו / כו).
const SHORT_KEY = '(?:[\\u05D0-\\u05D9\\u05DB]|[\\u05D9\\u05DB][\\u05D0-\\u05D8])';
const RE_MASORET = new RegExp(`^(?:${SHORT_KEY}${PUNCT}\\)|\\(${SHORT_KEY}${PUNCT})${PUNCT}$`);
const RE_TORAH_OR = /^[(\[]?([0-9]{1,2})[)\].,:;]?$/;
const RE_GILYON = /^(?:[⊙◉◎⊛●○]|[(\[][⊙◉◎⊛●○*•°][)\]]|\(o\)|\(O\)|\(0\)|\(\*\)|\(•\))$/;
const RE_BARE_LETTER = new RegExp(`^${MARKER_KEY}[.,:;]?$`);

/** Single letters that are usually prefixes/abbreviation fragments in running text. */
const COMMON_TEXT_LETTERS = new Set(['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'ד', 'כ', 'ע', 'כו', 'ר']);

const lettersOf = (s: string) => s.replace(/[^\u05D0-\u05EA]/g, '');

export function detectSmallMarkerToken(
  rawToken: string,
  pdfHeight: number,
  section: DafSection
): MarkerDetection {
  const s = (rawToken || '').trim();
  if (!s || section === 'header') return NOT_A_MARKER;
  const key = lettersOf(s);

  if (RE_BACH.test(s)) return { isSmallMarker: true, targetType: 'bach', key, displayWord: `(${key})` };
  if (RE_GRA.test(s)) return { isSmallMarker: true, targetType: 'gra', key, displayWord: `[${key}]` };
  if (RE_GILYON.test(s)) {
    return { isSmallMarker: true, targetType: 'gilyon-hashas', key: 'גליון', displayWord: '⊙' };
  }

  const digit = s.match(RE_TORAH_OR);
  if (digit) return { isSmallMarker: true, targetType: 'torah-or', key: digit[1], displayWord: digit[1] };

  // Single-paren letter: only when it is the whole token, e.g. "א)" or "(יב".
  if (RE_MASORET.test(s) && key !== 'כו') {
    return { isSmallMarker: true, targetType: 'masoret', key, displayWord: `${key})` };
  }

  // Bare letter: in the margin column any isolated index letter is an Ein Mishpat entry;
  // in body text it must be a tiny superscript and not a common prefix letter.
  if (RE_BARE_LETTER.test(s)) {
    const isMarker =
      section === 'margin' ||
      (pdfHeight > 0 && pdfHeight <= SUPERSCRIPT_MAX_PDF_HEIGHT && !COMMON_TEXT_LETTERS.has(key));
    if (isMarker) return { isSmallMarker: true, targetType: 'ein-mishpat', key, displayWord: key };
  }

  return NOT_A_MARKER;
}
