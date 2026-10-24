import type { MarginCommentaryType } from '../components/VilnaPdfInteractiveViewer';

export const CIRCLE_MARKER_PATTERN = /^[⦸⊙◉◎⊛●○◐◑◒◓⊗⊕]$/u;

export function isCircleMarker(word: string): boolean {
  return CIRCLE_MARKER_PATTERN.test(word.replace(/[()\[\]\s]/g, ''));
}

export function detectSmallMarkerToken(
  rawWord: string,
  pdfH: number,
  section: string,
  context: { bodyFontHeight?: number; isolated?: boolean; isEntryStart?: boolean } = {}
): {
  isSmallMarker: boolean;
  key?: string;
  displayWord?: string;
  targetType?: MarginCommentaryType;
} {
  const clean = rawWord.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();

  if (clean.length > 5) return { isSmallMarker: false };

  const digitMatch = clean.match(/^[(\[]?([0-9]{1,2})[)\].,:;\-–—־]?$/);
  if (digitMatch) {
    return { isSmallMarker: true, key: digitMatch[1], displayWord: clean, targetType: 'torah-or' };
  }

  if (isCircleMarker(clean)) {
    return { isSmallMarker: true, key: 'גליון', displayWord: clean, targetType: 'gilyon-hashas' };
  }

  const bracketMatch = clean.match(/^[\[]([\u05D0-\u05EA]{1,2})[\]]$/);
  if (bracketMatch) {
    return { isSmallMarker: true, key: bracketMatch[1], displayWord: clean, targetType: 'gra' };
  }

  const doubleParenMatch = clean.match(/^\(\(([\u05D0-\u05EA]{1,2})\)\)$/);
  if (doubleParenMatch) {
    return { isSmallMarker: true, key: doubleParenMatch[1], displayWord: clean, targetType: 'bach' };
  }

  const singleParenMatch =
    clean.match(/^[()]([\u05D0-\u05EA]{1,2})[()]?[.:]?$/) || clean.match(/^([\u05D0-\u05EA]{1,2})[()][.:]?$/);
  if (singleParenMatch) {
    return { isSmallMarker: true, key: singleParenMatch[1], displayWord: clean, targetType: 'masoret' };
  }

  const dotMatch = clean.match(/^([\u05D0-\u05EA]{1,2})[.,:;\-–—־]$/);
  if (dotMatch) {
    return { isSmallMarker: true, key: dotMatch[1], displayWord: clean, targetType: 'ein-mishpat' };
  }

  const small = context.bodyFontHeight
    ? pdfH <= context.bodyFontHeight * 0.78
    : pdfH <= 8.5;
  const marginEntry = section === 'margin' && context.isEntryStart === true;
  if (/^[\u05D0-\u05EA]$/.test(clean) && context.isolated !== false && (small || marginEntry)) {
    return { isSmallMarker: true, key: clean, displayWord: clean, targetType: 'ein-mishpat' };
  }

  return { isSmallMarker: false };
}
