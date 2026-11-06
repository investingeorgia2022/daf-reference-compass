// Below the Gemara block, one commentary often ends and the other runs across the full page
// width. Those full-width lines belong to a single commentator: whichever column kept going
// after the other stopped. Splitting them by page side mixes Rashi and Tosafot.
// The Gemara itself often ends with full-width lines too: a printed line set mostly in the
// Gemara's own body type is Gemara wherever it reaches, never commentary.

export interface LowerRun {
  topPct: number;
  /** Horizontal centre on the reference layout (percent of page width). */
  centerPct: number;
  pdfH: number;
  section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';
  /** Printed characters in the run (weights type-size votes). */
  chars?: number;
}

const MAIN_MIN_H = 12.6;
const MAIN_MAX_H = 15.8;

function groupRows<T extends LowerRun>(runs: T[]): T[][] {
  const rows: T[][] = [];
  for (const r of [...runs].sort((a, b) => a.topPct - b.topPct)) {
    const last = rows[rows.length - 1];
    if (last && last.some((x) => Math.abs(x.topPct - r.topPct) < 0.9)) last.push(r);
    else rows.push([r]);
  }
  return rows;
}

export function assignFullWidthCommentaryRows<T extends LowerRun>(runs: T[]): void {
  const isMainType = (r: T) => r.pdfH >= MAIN_MIN_H && r.pdfH < MAIN_MAX_H;
  const weight = (r: T) => Math.max(1, r.chars ?? 1);

  // The Gemara body type: the most printed main-type size on the page.
  const sizes = new Map<number, number>();
  for (const r of runs) {
    if (!isMainType(r) || r.section === 'margin' || r.section === 'header') continue;
    const k = Math.round(r.pdfH * 10);
    sizes.set(k, (sizes.get(k) || 0) + weight(r));
  }
  let bodyH = 0;
  let bodyN = 0;
  for (const [k, n] of sizes) if (n > bodyN) { bodyH = k / 10; bodyN = n; }
  const isBody = (r: T) => bodyH > 0 && Math.abs(r.pdfH - bodyH) < 0.35;

  // Rows printed mostly in the Gemara body type are Gemara rows (below the top commentary lines).
  const body = runs.filter((r) => r.section !== 'margin' && r.section !== 'header' && r.topPct >= 9);
  const gemaraRuns = new Set<T>();
  for (const row of groupRows(body)) {
    const total = row.reduce((s, r) => s + weight(r), 0);
    const main = row.filter(isBody).reduce((s, r) => s + weight(r), 0);
    if (total > 0 && main / total >= 0.6) {
      for (const r of row) gemaraRuns.add(r);
      for (const r of row) {
        if (isBody(r) && (r.section === 'rashi' || r.section === 'tosafot')) r.section = 'gemara';
      }
    }
  }

  const mainRuns = runs.filter(
    (r) => (r.section === 'gemara' || r.section === 'mishnah') && isMainType(r) && r.centerPct > 36 && r.centerPct < 58
  );
  if (mainRuns.length === 0) return;
  const mainBottom = Math.max(...mainRuns.map((r) => r.topPct));

  // Every word on a printed commentary line below the Gemara follows that line's commentator,
  // whatever its letter size: enlarged opening words of a dibbur stay with their own line.
  const lower = runs.filter(
    (r) => r.section !== 'margin' && r.section !== 'header' && r.topPct > mainBottom + 0.8
  );
  if (lower.length === 0) return;

  const rows = groupRows(lower).filter((row) => !row.some((r) => gemaraRuns.has(r)));
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
