// @ts-nocheck
// TEMPORARY: user-provided version. Previous version backed up.
import type { MarginCommentaryType } from '../components/VilnaPdfInteractiveViewer';

export function detectSmallMarkerToken(
  rawWord: string,
  pdfH: number,
  section: string
): {
  isSmallMarker: boolean;
  key?: string;
  displayWord?: string;
  targetType?: MarginCommentaryType;
} {
  const clean = rawWord.trim();

  if (clean.length > 5) return { isSmallMarker: false };

  const digitMatch = clean.match(/^[(\[]?([0-9]{1,2})[)\].,:;\-–—־]?$/);
  if (digitMatch) {
    return { isSmallMarker: true, key: digitMatch[1], displayWord: clean, targetType: 'torah-or' };
  }

  const isCircle = /^[⊙◉◎⊛●○]$/.test(clean) || /^[\(\[][⊙◉◎⊛●○\*•°][\)\]]$/.test(clean);
  if (isCircle) {
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
    clean.match(/^[\(]([\u05D0-\u05EA]{1,2})[\)]?$/) || clean.match(/^([\u05D0-\u05EA]{1,2})[\)]$/);
  if (singleParenMatch) {
    return { isSmallMarker: true, key: singleParenMatch[1], displayWord: clean, targetType: 'masoret' };
  }

  const dotMatch = clean.match(/^([\u05D0-\u05EA]{1,2})[.,:;\-–—־]$/);
  if (dotMatch) {
    return { isSmallMarker: true, key: dotMatch[1], displayWord: clean, targetType: 'ein-mishpat' };
  }

  if (clean.length === 1 && /[\u05D0-\u05EA]/.test(clean) && (pdfH < 10.5 || section === 'margin')) {
    return { isSmallMarker: true, key: clean, displayWord: clean, targetType: 'ein-mishpat' };
  }

  return { isSmallMarker: false };
}
