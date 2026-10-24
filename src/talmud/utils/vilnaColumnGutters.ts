// Finds the blank vertical gutters that separate the side-margin columns (Ein Mishpat,
// Masoret HaShas, ...) from the main text block on a scanned Vilna page. Scans are printed
// at different scales, so fixed percentages misclassify margin text as main text.

export interface TextBoxPct {
  leftPct: number;
  rightPct: number;
  topPct: number;
}

export interface MarginGutters {
  left: number;
  right: number;
}

/** Reference gutters the coordinate-zone classifier was tuned on. */
export const REFERENCE_GUTTERS: MarginGutters = { left: 14.0, right: 80.4 };

export function findMarginGutters(boxes: TextBoxPct[]): MarginGutters {
  const BINS = 200;
  const bins = new Array<number>(BINS).fill(0);
  for (const b of boxes) {
    if (b.topPct < 12 || b.topPct > 60) continue;
    const a = Math.max(0, Math.floor((Math.min(b.leftPct, b.rightPct) / 100) * BINS));
    const z = Math.min(BINS, Math.ceil((Math.max(b.leftPct, b.rightPct) / 100) * BINS));
    for (let k = a; k < z; k++) bins[k] = (bins[k] ?? 0) + 1;
  }

  const gaps: Array<{ start: number; end: number }> = [];
  let s = -1;
  for (let k = 0; k <= BINS; k++) {
    if (k < BINS && bins[k] === 0) {
      if (s < 0) s = k;
    } else if (s >= 0) {
      gaps.push({ start: (s / BINS) * 100, end: (k / BINS) * 100 });
      s = -1;
    }
  }
  // Only gaps with text on both sides are gutters (not the blank page edges).
  const inner = gaps.filter((g) => g.start > 0 && g.end < 100);
  const mid = (g: { start: number; end: number }) => (g.start + g.end) / 2;

  const leftGap = inner.find((g) => mid(g) >= 8 && mid(g) <= 28);
  const rightCandidates = inner.filter((g) => mid(g) >= 72 && mid(g) <= 92);
  const rightGap = rightCandidates[rightCandidates.length - 1];

  return {
    left: leftGap ? mid(leftGap) : REFERENCE_GUTTERS.left,
    right: rightGap ? mid(rightGap) : REFERENCE_GUTTERS.right,
  };
}

/** Maps an x position (percent of page width) onto the reference layout. */
export function normalizeVilnaX(xPct: number, gutters: MarginGutters): number {
  const span = gutters.right - gutters.left;
  if (span < 30) return xPct;
  const ref = REFERENCE_GUTTERS;
  return ref.left + ((xPct - gutters.left) / span) * (ref.right - ref.left);
}
