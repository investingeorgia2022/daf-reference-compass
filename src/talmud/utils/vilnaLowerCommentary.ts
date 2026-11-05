// Below the Gemara block, one commentary often ends and the other runs across the full page
// width. Those full-width lines belong to a single commentator: whichever column kept going
// after the other stopped. Splitting them by page side mixes Rashi and Tosafot.

export interface LowerRun {
  topPct: number;
  /** Horizontal centre on the reference layout (percent of page width). */
  centerPct: number;
  pdfH: number;
  section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';
}

const MAIN_MIN_H = 12.6;
const MAIN_MAX_H = 15.8;

export function assignFullWidthCommentaryRows<T extends LowerRun>(runs: T[]): void {
  const isMainType = (r: T) => r.pdfH >= MAIN_MIN_H && r.pdfH < MAIN_MAX_H;
  const mainRuns = runs.filter(
    (r) => (r.section === 'gemara' || r.section === 'mishnah') && isMainType(r) && r.centerPct > 36 && r.centerPct < 58
  );
  if (mainRuns.length === 0) return;
  const mainBottom = Math.max(...mainRuns.map((r) => r.topPct));

  const lower = runs
    .filter((r) => r.section !== 'margin' && r.section !== 'header' && r.pdfH < MAIN_MIN_H && r.topPct > mainBottom + 0.8)
    .sort((a, b) => a.topPct - b.topPct);
  if (lower.length === 0) return;

  const rows: T[][] = [];
  for (const r of lower) {
    const last = rows[rows.length - 1];
    if (last && last[0] && Math.abs(last[0].topPct - r.topPct) < 0.6) last.push(r);
    else rows.push([r]);
  }
  const fullWidth = rows.filter((row) => row.some((r) => r.centerPct > 38 && r.centerPct < 56));
  const firstRun = fullWidth[0]?.[0];
  if (!firstRun) return;
  const firstFull = firstRun.topPct;

  // The column that is still printed lower down (in its narrow form) is the one that continues.
  const lastNarrow = (sec: 'rashi' | 'tosafot') => {
    let t = -1;
    for (const r of runs) {
      if (r.section === sec && r.pdfH < MAIN_MIN_H && r.topPct > 9 && r.topPct < firstFull - 0.3) {
        t = Math.max(t, r.topPct);
      }
    }
    return t;
  };
  const rashiEnd = lastNarrow('rashi');
  const tosEnd = lastNarrow('tosafot');
  const owner: 'rashi' | 'tosafot' = rashiEnd > tosEnd + 1 ? 'rashi' : 'tosafot';
  for (const row of fullWidth) for (const r of row) r.section = owner;
}
