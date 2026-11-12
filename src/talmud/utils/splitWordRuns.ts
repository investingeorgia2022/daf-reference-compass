export interface SplitWordRun {
  str: string;
  vpLeft: number;
  vpWidth: number;
  vpHeight: number;
  pdfH: number;
  section?: string;
}

const HEBREW_LETTER = /[\u05D0-\u05EA]/;

/**
 * `right` is read first (RTL); `left` follows it on the same line.
 * Two runs are one word when the glyphs touch, the font size matches, and
 * neither side of the junction is a space, punctuation, or bracket.
 */
export function shouldJoinSplitWordRuns(right: SplitWordRun, left: SplitWordRun): boolean {
  if (right.section && left.section && right.section !== left.section) return false;
  const tail = right.str.slice(-1);
  const head = left.str.slice(0, 1);
  if (!HEBREW_LETTER.test(tail) || !HEBREW_LETTER.test(head)) return false;
  const h = Math.max(right.pdfH, left.pdfH);
  if (Math.abs(right.pdfH - left.pdfH) > h * 0.15) return false;
  const gap = right.vpLeft - (left.vpLeft + left.vpWidth);
  const em = Math.max(right.vpHeight, left.vpHeight, 1);
  return gap <= em * 0.08 && gap >= -em * 0.35;
}
