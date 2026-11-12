// Decides which printed text every run of a Vilna scan belongs to — Gemara, Rashi or Tosafot —
// without looking at where on the page it sits.
//
// * Type size separates the main text from commentary: the Gemara is set in its own large body
//   type, the commentaries in the small commentary script.
// * The scan stores each commentary as one continuous text stream (Rashi's stream first, then
//   Tosafot's), whatever columns or full-width lines it flows through.
// * Each commentator opens its dibburim in its own typeface. The point in the commentary stream
//   where Rashi's opening typeface stops and Tosafot's begins is where Tosafot starts.

export type PrintedSection = 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';

export interface StreamRun {
  /** Section decided so far; only 'margin' and 'header' are kept as given. */
  section: PrintedSection;
  pdfH: number;
  font?: string;
  str: string;
  /** Top of the run (percent of page height); only used to recognise the page title. */
  topPct?: number;
  /** Main-text label to use when the run is Gemara-type text ('mishnah' or 'gemara'). */
  mainSection?: 'mishnah' | 'gemara';
}

const MAIN_MIN_H = 12.6;
const MAIN_MAX_H = 15.8;

const letterCount = (s: string) => s.replace(/[\s.,:;'"`()[\]{}״׳\-–—0-9]/g, '').length;

type Kind = 'main' | 'comm' | 'tall' | 'small' | 'other' | 'apart';

/** Runs must be given in the scan's own content-stream order. */
export function assignPrintedSections<T extends StreamRun>(runs: T[]): void {
  const text = runs.filter((r) => r.section !== 'margin' && r.section !== 'header');
  if (text.length === 0) return;

  // Gemara body type: the most printed size in the main-type range.
  const bodyH = dominantSize(text.filter((r) => r.pdfH >= MAIN_MIN_H && r.pdfH < MAIN_MAX_H));
  const isMainBody = (r: T) => bodyH > 0 && Math.abs(r.pdfH - bodyH) < 0.35;
  const isCommScript = (r: T) => r.pdfH >= 9 && r.pdfH < (bodyH > 0 ? bodyH - 0.8 : MAIN_MIN_H);

  const kinds: Kind[] = text.map((r) => {
    if (isMainBody(r)) return 'main';
    if (isCommScript(r)) return 'comm';
    if (r.pdfH >= MAIN_MAX_H) return 'tall';
    if (r.pdfH < 9) return 'small';
    return 'other';
  });

  // A long stretch of tiny type is its own text (e.g. Rabbeinu Chananel printed under the page),
  // not part of Rashi or Tosafot; short tiny runs are markers and citations inside a text.
  for (let i = 0; i < kinds.length; ) {
    if (kinds[i] !== 'small') { i++; continue; }
    let j = i;
    let letters = 0;
    while (j < kinds.length && kinds[j] === 'small') letters += letterCount(text[j]?.str ?? ""), j++;
    if (letters >= 80) for (let k = i; k < j; k++) kinds[k] = 'apart';
    i = j;
  }

  // Runs whose size alone does not decide follow their neighbours in the stream: enlarged
  // opening words lead the text after them, small marks and odd sizes belong to the text around them.
  const settled = kinds.map((k) => (k === 'main' || k === 'comm' ? k : null));
  const nearest = (i: number, step: 1 | -1): 'main' | 'comm' | null => {
    for (let j = i + step; j >= 0 && j < settled.length; j += step) {
      const k = settled[j];
      if (k) return k;
    }
    return null;
  };
  const resolved: Array<'main' | 'comm' | 'header' | 'apart'> = kinds.map((k, i) => {
    if (k === 'main' || k === 'comm' || k === 'apart') return k;
    const before = nearest(i, -1);
    const after = nearest(i, 1);
    // The page title is printed before any text in the stream.
    if (k === 'tall' && !before && (text[i]?.topPct ?? 0) < 6) return 'header';
    if (k === 'tall') return after ?? before ?? 'main';
    if (k === 'other') {
      // Odd mid sizes inside a commentary stream stay commentary; otherwise they are main type.
      if (before === 'comm' && after === 'comm') return 'comm';
      return 'main';
    }
    return before ?? after ?? 'comm';
  });

  // A chapter's first Rashi opens with one word in square (main-text) type, followed at once by
  // Rashi script: a lone main-type word that leads straight into commentary belongs to it.
  for (let i = 0; i < resolved.length; ) {
    if (resolved[i] !== 'main') { i++; continue; }
    let j = i;
    while (j < resolved.length && resolved[j] === 'main') j++;
    const words = text.slice(i, j).map((r) => r.str).join(' ').split(/\s+/).filter((w) => letterCount(w) > 0);
    const prev = i > 0 ? resolved[i - 1] : undefined;
    if (words.length === 1 && resolved[j] === 'comm' && prev !== 'main') {
      for (let k = i; k < j; k++) resolved[k] = 'comm';
    }
    i = j;
  }

  const comm: T[] = [];
  text.forEach((r, i) => {
    if (resolved[i] === 'apart') r.section = 'margin';
    else if (resolved[i] === 'header') r.section = 'header';
    else if (resolved[i] === 'main') r.section = r.mainSection ?? 'gemara';
    else comm.push(r);
  });
  if (comm.length === 0) return;

  const split = findCommentarySplit(comm);
  comm.forEach((r, i) => {
    r.section = i < split.tosafotFrom ? split.firstIs : 'tosafot';
  });
}

interface Split {
  /** Index in the commentary stream where Tosafot begins (length = no Tosafot). */
  tosafotFrom: number;
  /** Commentator of the stream before tosafotFrom. */
  firstIs: 'rashi' | 'tosafot';
}

export function findCommentarySplit(comm: StreamRun[]): Split {
  const weight = (r: StreamRun) => Math.max(1, letterCount(r.str));
  const bodyFont = dominantFont(comm.filter((r) => r.pdfH < MAIN_MIN_H));
  const bodyH = dominantSize(comm.filter((r) => r.font === bodyFont && r.pdfH < MAIN_MIN_H));

  // Typefaces other than the shared body script: dibbur openings, and on some scans a
  // commentator's own body script. Small citation and marker type appears in both and is ignored.
  const openings: Array<{ pos: number; font: string; chars: number; h: number }> = [];
  comm.forEach((r, pos) => {
    if (!r.font || r.font === bodyFont || letterCount(r.str) < 2) return;
    if (r.pdfH < bodyH * 0.85) return;
    // Another font resource at the body size is the same script (an encoding variant).
    if (r.pdfH < MAIN_MAX_H && Math.abs(r.pdfH - bodyH) <= 0.1) return;
    openings.push({ pos, font: r.font, chars: weight(r), h: r.pdfH });
  });

  const fonts = Array.from(new Set(openings.map((o) => o.font)));
  const whole = (): Split => {
    // One commentator only: Tosafot's openings are set larger than Rashi's.
    const sized = openings.filter((o) => o.h < MAIN_MIN_H);
    const n = sized.reduce((s, o) => s + o.chars, 0);
    const avg = n ? sized.reduce((s, o) => s + o.h * o.chars, 0) / n : 0;
    return { tosafotFrom: comm.length, firstIs: avg > 0 && avg - bodyH >= 0.45 ? 'tosafot' : 'rashi' };
  };
  if (fonts.length < 2) return whole();

  // The split point is where the typefaces found only before it and those found only after it
  // are both best represented: each commentator keeps its own typefaces.
  // Tosafot's stream opens with an enlarged initial word, so those runs are the candidate
  // starting points; a scan without enlarged initials considers every typeface run.
  const scoreAt = (k: number) => {
    let ownBefore = 0;
    let ownAfter = 0;
    let leak = 0;
    for (const f of fonts) {
      let b = 0;
      let a = 0;
      for (const x of openings) {
        if (x.font !== f) continue;
        if (x.pos < k) b += x.chars;
        else a += x.chars;
      }
      if (b >= 0.85 * (a + b)) ownBefore += b;
      else if (a >= 0.85 * (a + b)) ownAfter += a;
      leak += Math.min(a, b);
    }
    if (Math.min(ownBefore, ownAfter) < 6) return null;
    // A typeface printed on the wrong side of the split counts against it.
    return Math.min(ownBefore, ownAfter) - leak;
  };
  const pick = (cands: typeof openings) => {
    let found: { k: number; score: number } | null = null;
    for (const o of cands) {
      const score = scoreAt(o.pos);
      if (score !== null && (!found || score > found.score)) found = { k: o.pos, score };
    }
    return found;
  };
  const best = pick(openings.filter((o) => o.h >= MAIN_MAX_H)) ?? pick(openings);
  if (!best) return whole();

  // Tosafot may begin by finishing an entry from the previous page, before its first opening.
  // Its stream then starts where the text restarts at the top of the page, provided every
  // typeface printed between that restart and the opening is new there (not one of Rashi's).
  let start = best.k;
  for (let i = best.k; i > 0; i--) {
    const prevTop = comm[i - 1]?.topPct;
    const top = comm[i]?.topPct;
    if (prevTop === undefined || top === undefined || prevTop - top <= 10) continue;
    const between = openings.filter((o) => o.pos >= i && o.pos < best.k);
    const rashiTypeface = between.some((o) => openings.some((x) => x.pos < i && x.font === o.font));
    if (!rashiTypeface) start = i;
    break;
  }
  return { tosafotFrom: start, firstIs: 'rashi' };
}

function dominantSize(runs: StreamRun[]): number {
  const sizes = new Map<number, number>();
  for (const r of runs) {
    const k = Math.round(r.pdfH * 10);
    sizes.set(k, (sizes.get(k) || 0) + Math.max(1, letterCount(r.str)));
  }
  let best = 0;
  let n = 0;
  for (const [k, c] of sizes) if (c > n) { best = k / 10; n = c; }
  return best;
}

function dominantFont(runs: StreamRun[]): string | undefined {
  const fonts = new Map<string, number>();
  for (const r of runs) {
    if (!r.font) continue;
    fonts.set(r.font, (fonts.get(r.font) || 0) + Math.max(1, letterCount(r.str)));
  }
  let best: string | undefined;
  let n = 0;
  for (const [f, c] of fonts) if (c > n) { best = f; n = c; }
  return best;
}
