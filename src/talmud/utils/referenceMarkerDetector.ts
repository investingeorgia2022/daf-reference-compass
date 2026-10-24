import type { MarginCommentaryType } from '../components/VilnaPdfInteractiveViewer';

export const CIRCLE_MARKER_PATTERN = /^[⦸⊙◉◎⊛●○◐◑◒◓⊗⊕$]$/u;

export function isCircleMarker(word: string): boolean {
  return CIRCLE_MARKER_PATTERN.test(word.replace(/[()\[\]\s]/g, ''));
}

/** PDF streams may mirror punctuation before a printed entry number. */
export function getTorahOrNumber(word: string): string | undefined {
  return word.trim().match(/^[.,:;]?[(\[]?([0-9]{1,2})[)\].,:;\-–—־]?$/)?.[1];
}

export function canJoinMarkerFragments(a: string, b: string, combined: string): boolean {
  // Never join two letter-bearing runs: ו( + ו must remain two separate indices.
  if (/[א-ת]/.test(a) && /[א-ת]/.test(b)) return false;
  return /[()[\]]/.test(combined) && detectSmallMarkerToken(combined, 4, 'gemara').isSmallMarker;
}

export function detectSmallMarkerToken(
  rawWord: string,
  pdfH: number,
  section: string,
  context: { bodyFontHeight?: number; isolated?: boolean; isEntryStart?: boolean; abbreviation?: boolean; raised?: boolean } = {}
): {
  isSmallMarker: boolean;
  key?: string;
  displayWord?: string;
  targetType?: MarginCommentaryType;
} {
  const clean = rawWord.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();

  if (isCircleMarker(clean)) {
    return { isSmallMarker: true, key: 'גליון', displayWord: clean, targetType: 'gilyon-hashas' };
  }

  // Letters glued to a quote mark (ב"ח, ז"ל, ת') are abbreviations, never reference markers.
  if (context.abbreviation || /["'״׳`]/.test(clean)) return { isSmallMarker: false };

  const letters = clean.replace(/[^\u05D0-\u05EA]/g, '');
  // Short Hebrew words are not indices, even when surrounded by punctuation.
  const validIndex = !letters || /^[א-ת]$/.test(letters) || /^(?:י[א-ט]|[כלמנסעפצ][א-ט]|ט[וז])$/.test(letters);
  if (!validIndex || ['דף', 'שם', 'של', 'לו', 'כו'].includes(letters)) return { isSmallMarker: false };

  if (clean.length > 8) return { isSmallMarker: false };

  const small = context.bodyFontHeight
    ? pdfH <= context.bodyFontHeight * 0.78
    : pdfH <= 8.5;

  const digitKey = getTorahOrNumber(clean);
  if (digitKey) {
    // Torah Or numerals are printed raised and small next to the verse.
    if (context.bodyFontHeight && (!small || context.raised === false) && !(section === 'margin' && context.isEntryStart)) return { isSmallMarker: false };
    return { isSmallMarker: true, key: digitKey, displayWord: clean, targetType: 'torah-or' };
  }

  // Hagahot HaGra: [א] (PDF may mirror it as ]א[)
  const bracketMatch = clean.match(/^[\[\]]([\u05D0-\u05EA]{1,2})[\[\]]$/);
  if (bracketMatch?.[1]) {
    return { isSmallMarker: true, key: bracketMatch[1], displayWord: clean, targetType: 'gra' };
  }

  // Hagahot HaBach: letter closed by parentheses on BOTH sides — (א) or ((א)); PDF may mirror them.
  const doubleParenMatch = clean.match(/^[()]{1,2}([\u05D0-\u05EA]{1,2})[()]{1,2}$/);
  if (doubleParenMatch?.[1]) {
    return { isSmallMarker: true, key: doubleParenMatch[1], displayWord: clean, targetType: 'bach' };
  }

  const singleParenMatch =
    // Masoret HaShas: one-sided parenthesis — (ד or ד)
    clean.match(/^[()]([\u05D0-\u05EA]{1,2})[.:]?$/) || clean.match(/^([\u05D0-\u05EA]{1,2})[()][.:]?$/);
  if (singleParenMatch?.[1]) {
    return { isSmallMarker: true, key: singleParenMatch[1], displayWord: clean, targetType: 'masoret' };
  }

  // Ein Mishpat: a bare small letter (optionally followed by a dot) standing alone between words.
  const marginEntry = section === 'margin' && context.isEntryStart === true;
  const bare = clean.match(/^([\u05D0-\u05EA])[.,:;\-–—־]?$/);
  if (bare?.[1] && context.isolated !== false && ((small && context.raised !== false) || marginEntry)) {
    return { isSmallMarker: true, key: bare[1], displayWord: clean, targetType: 'ein-mishpat' };
  }

  return { isSmallMarker: false };
}
