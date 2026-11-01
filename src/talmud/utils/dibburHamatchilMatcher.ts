// @ts-nocheck
// Links Rashi / Tosafot "dibbur hamatchil" openings on a Vilna PDF scan to the
// Gemara/Mishnah words they quote. Pure logic: works on hotspot-like boxes.
//
// How an opening is recognised (Vilna typesetting, every tractate):
// - Rashi: the opening is printed in BOLD Rashi script — slightly taller than the body script.
// - Tosafot: the opening is printed in square letters (never Rashi script): the first word is
//   large, the rest is bold square type, clearly taller than the body script.
// - The opening ends with "." / ":" or with וכו'. Small reference markers (א, 1, 2 …) are skipped.

export type DhCommentator = 'rashi' | 'tosafot';

export interface DhHotspotLike {
  id: string;
  word: string;
  section: string;
  rowId: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  isSmallMarker?: boolean;
  /** Printed glyph height (pt) of the PDF run this word came from. */
  glyphH?: number;
  /** A "." or ":" is printed right after the word. */
  stopAfter?: '.' | ':';
}

export interface DhLink {
  key: string;
  commentator: DhCommentator;
  /** Hotspot ids of the opening words inside Rashi/Tosafot. */
  dhIds: string[];
  /** Hotspot ids of the quoted words in the main text. */
  mainIds: string[];
}

/** Per-hotspot interactive role. A shared main-text word carries both sides. */
export interface DhHotspotRole {
  rashi?: string; // link key
  tosafot?: string;
  /** Word quoted by both: right half Rashi (green), left half Tosafot (bordeaux). */
  splitWord?: boolean;
}

const NIKUD = /[\u0591-\u05C7]/g;
const ABBREV_MARK = /["'\u05F3\u05F4\u201C\u201D\u2019]/;
const PREFIXES = ['ו', 'ש', 'ב', 'כ', 'ל', 'מ', 'ה', 'ד'];

export function normalizeHebrewWord(raw: string): string {
  return String(raw || '')
    .replace(NIKUD, '')
    .replace(/[^\u05D0-\u05EA"'\u05F3\u05F4]/g, '')
    .replace(/^["'\u05F3\u05F4]+|["'\u05F3\u05F4]+$/g, '');
}

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const plain = (w: string) => w.replace(/["'\u05F3\u05F4]/g, '').replace(/[ךםןףץ]/g, (c) => FINALS[c]);
const plainWord = (w: string) => plain(normalizeHebrewWord(w));

/** Filler words that end a quotation ("etc.") and are not looked up in the Gemara. */
const ETC = new Set(['וכו', 'וגו', 'כו', 'וגומר', 'וכולי']);
/** Section headings inside the commentary that are never quoted text. */
const HEADINGS = new Set(['גמ', 'מתני', 'גמרא', 'משנה']);

export function isAbbreviation(word: string): boolean {
  const w = normalizeHebrewWord(word);
  return ABBREV_MARK.test(w.slice(0, -1)) && plain(w).length >= 2;
}

function stripPrefixes(w: string): string[] {
  const out = [w];
  let cur = w;
  for (let i = 0; i < 2 && cur.length > 3 && PREFIXES.includes(cur[0]); i++) {
    cur = cur.slice(1);
    out.push(cur);
  }
  return out;
}

/** Do two single words match, ignoring nikud, final letters and up to two prefix letters? */
export function wordsMatch(a: string, b: string): boolean {
  const pa = plainWord(a);
  const pb = plainWord(b);
  if (!pa || !pb) return false;
  if (pa === pb) return true;
  const va = stripPrefixes(pa);
  const vb = stripPrefixes(pb);
  return va.some((x) => x.length >= 3 && vb.includes(x));
}

/**
 * Tries to match one DH token at main[pos]. Returns how many main words it
 * consumed (0 = no match). Abbreviations (ראשי תיבות) like אע"פ / ק"ש consume one
 * full main word per initial letter.
 */
export function matchTokenAt(token: string, main: string[], pos: number): number {
  if (pos >= main.length) return 0;
  if (wordsMatch(token, main[pos])) return 1;
  const norm = normalizeHebrewWord(token);
  if (isAbbreviation(norm)) {
    const letters = plain(norm).split('');
    // Allow an attached prefix on the abbreviation (e.g. ואע"פ)
    for (const start of [0, 1]) {
      const ls = letters.slice(start);
      if (ls.length < 2 || pos + ls.length > main.length) continue;
      let ok = true;
      for (let k = 0; k < ls.length; k++) {
        const cands = stripPrefixes(plainWord(main[pos + k]));
        if (!cands.some((c) => c[0] === ls[k])) { ok = false; break; }
      }
      if (ok) return ls.length;
    }
  }
  return 0;
}

/** Orders hotspots of one section in reading order (rows top→bottom, words right→left). */
export function readingOrder<T extends DhHotspotLike>(hotspots: T[]): T[] {
  return [...hotspots].sort((a, b) => {
    const dy = a.topPct - b.topPct;
    if (Math.abs(dy) > Math.min(a.heightPct, b.heightPct) * 0.5) return dy;
    return b.leftPct + b.widthPct - (a.leftPct + a.widthPct);
  });
}

/** Most common glyph height among the given words, weighted by letters. */
function modeHeight(words: DhHotspotLike[]): number {
  const count = new Map<number, number>();
  for (const h of words) {
    if (!h.glyphH) continue;
    const k = Math.round(h.glyphH * 10);
    count.set(k, (count.get(k) || 0) + Math.max(1, plainWord(h.word).length));
  }
  let best = 0;
  let bestN = 0;
  for (const [k, n] of count) if (n > bestN) { best = k; bestN = n; }
  return best / 10;
}

/** Which commentator's opening type is this word printed in (null = body text)? */
export function dibburStyle(h: DhHotspotLike, bodyH: number): DhCommentator | null {
  if (!h.glyphH || !bodyH || h.isSmallMarker) return null;
  const r = h.glyphH / bodyH;
  if (r > 1.006 && r < 1.045) return 'rashi'; // bold Rashi script
  if ((r >= 1.045 && r < 1.15) || (r > 1.38 && r < 1.7)) return 'tosafot'; // bold / large square letters
  if (r >= 1.15 && r <= 1.38) {
    // Enlarged chapter-opening word: belongs to whichever column it is printed in.
    return h.section === 'rashi' || h.section === 'tosafot' ? (h.section as DhCommentator) : null;
  }
  return null;
}

/** Large square opening word of Tosafot (wherever the zone rules placed it). */
function isLargeTosafotWord(h: DhHotspotLike, bodyH: number): boolean {
  if ((h.section !== 'gemara' && h.section !== 'mishnah') || h.isSmallMarker || !h.glyphH || !bodyH) return false;
  const r = h.glyphH / bodyH;
  return r > 1.38 && r < 1.7 && !HEADINGS.has(plainWord(h.word));
}

interface Piece<T> { commentator: DhCommentator; words: T[] }

/**
 * Finds every opening in the Rashi and Tosafot columns. Openings are contiguous runs of
 * opening-type words; a run cut at the end of a line continues on the next line of the same column.
 */
export function extractDibburim<T extends DhHotspotLike>(hotspots: T[]): Piece<T>[] {
  const comm0 = hotspots.filter(
    (h) => (h.section === 'rashi' || h.section === 'tosafot') && !h.isSmallMarker && plainWord(h.word)
  );
  const bodyH = modeHeight(comm0);
  if (!bodyH) return [];
  // Large Tosafot opening words printed beside the Gemara are sometimes grouped with Gemara lines.
  const comm = [...comm0, ...hotspots.filter((h) => isLargeTosafotWord(h, bodyH))];

  // Split every printed row into column segments at wide horizontal gaps.
  const rows = new Map<string, T[]>();
  for (const h of comm) rows.set(h.rowId, [...(rows.get(h.rowId) || []), h]);
  const segs: Array<{ words: T[]; top: number; h: number; left: number; right: number }> = [];
  for (const words of rows.values()) {
    words.sort((a, b) => b.leftPct + b.widthPct - (a.leftPct + a.widthPct));
    let cur: T[] = [];
    for (const w of words) {
      const prev = cur[cur.length - 1];
      if (prev && prev.leftPct - (w.leftPct + w.widthPct) > 1.6) {
        segs.push(mk(cur));
        cur = [];
      }
      cur.push(w);
    }
    if (cur.length) segs.push(mk(cur));
  }
  function mk(words: T[]) {
    return {
      words,
      top: Math.min(...words.map((w) => w.topPct)),
      h: Math.max(...words.map((w) => w.heightPct)),
      left: Math.min(...words.map((w) => w.leftPct)),
      right: Math.max(...words.map((w) => w.leftPct + w.widthPct)),
    };
  }
  segs.sort((a, b) => a.top - b.top || b.right - a.right);

  const pieces: Piece<T>[] = [];
  const pending = new Map<number, Piece<T>>();
  segs.forEach((seg, si) => {
    let cur: Piece<T> | null = null;
    const carried = pending.get(si);
    seg.words.forEach((w, wi) => {
      const style = dibburStyle(w, bodyH);
      if (wi === 0 && carried && style === carried.commentator) cur = carried;
      if (style && cur && cur.commentator === style) cur.words.push(w);
      else if (style) {
        cur = { commentator: style, words: [w] };
        pieces.push(cur);
      } else cur = null;
      if (cur && (w.stopAfter || ETC.has(plainWord(w.word)))) cur = null;
    });
    if (cur) {
      // Opening still open: an enlarged first word forms its own segment, so first look for the
      // segment printed right after it on the same baseline.
      const bottom = seg.top + seg.h;
      const sameLine = segs.findIndex(
        (n, j) =>
          j !== si &&
          dibburStyle(n.words[0], bodyH) === cur!.commentator &&
          n.right <= seg.left + 0.6 &&
          seg.left - n.right < 1.2 &&
          Math.abs(n.top + n.h - bottom) < Math.max(0.6, n.h * 0.6)
      );
      if (sameLine >= 0 && !pending.has(sameLine)) {
        pending.set(sameLine, cur);
        return;
      }
      // Otherwise continue on the next line of this column.
      for (let j = si + 1; j < segs.length; j++) {
        const n = segs[j];
        if (n.top <= seg.top + seg.h * 0.4) continue;
        if (n.top > seg.top + seg.h * 3.2) break;
        const overlap = Math.min(n.right, seg.right) - Math.max(n.left, seg.left);
        if (overlap > 0.4 * Math.min(n.right - n.left, seg.right - seg.left)) {
          pending.set(j, cur);
          break;
        }
      }
    }
  });
  return pieces;
}

function findInMain(tokens: string[], main: string[], from: number): { start: number; end: number } | null {
  if (tokens.length === 0) return null;
  const search = (startAt: number) => {
    for (let s = startAt; s < main.length; s++) {
      let p = s;
      let ok = true;
      for (const t of tokens) {
        const used = matchTokenAt(t, main, p);
        if (!used) { ok = false; break; }
        p += used;
      }
      if (ok) return { start: s, end: p - 1 };
    }
    return null;
  };
  return search(from) || (from > 0 ? search(0) : null);
}

/** Builds Rashi/Tosafot ↔ main-text links for one page. */
export function buildDibburHamatchilLinks<T extends DhHotspotLike>(hotspots: T[]): {
  links: DhLink[];
  roles: Map<string, DhHotspotRole>;
} {
  const commBodyH = modeHeight(
    hotspots.filter((h) => (h.section === 'rashi' || h.section === 'tosafot') && !h.isSmallMarker)
  );
  const mainAll = hotspots.filter(
    (h) =>
      (h.section === 'gemara' || h.section === 'mishnah') &&
      !h.isSmallMarker &&
      plainWord(h.word) &&
      !isLargeTosafotWord(h, commBodyH)
  );
  // Small inline citations such as (דף ג.) are not part of the quoted text.
  const mainH = modeHeight(mainAll);
  const main = readingOrder(mainAll.filter((h) => !mainH || !h.glyphH || h.glyphH >= mainH * 0.8));
  const mainWords = main.map((h) => h.word);
  const links: DhLink[] = [];
  const roles = new Map<string, DhHotspotRole>();
  const cursor: Record<DhCommentator, number> = { rashi: 0, tosafot: 0 };
  const counter: Record<DhCommentator, number> = { rashi: 0, tosafot: 0 };

  for (const piece of extractDibburim(hotspots)) {
    const words = piece.words.filter((h) => {
      const p = plainWord(h.word);
      return p && !ETC.has(p) && !HEADINGS.has(p);
    });
    if (words.length === 0) continue;
    let found: { start: number; end: number } | null = null;
    const minK = words.length === 1 ? 1 : 2;
    // Longest verbatim prefix first; then (for split abbreviations like קמ"ל) skip up to two leading tokens.
    outer: for (let skip = 0; skip <= Math.max(0, Math.min(2, words.length - 2)); skip++) {
      for (let k = words.length - skip; k >= (skip ? 2 : minK); k--) {
        if (k === 1 && plainWord(words[skip].word).length < 4) break;
        found = findInMain(words.slice(skip, skip + k).map((h) => h.word), mainWords, cursor[piece.commentator]);
        if (found) break outer;
      }
    }
    const key = `${piece.commentator}:${counter[piece.commentator]++}`;
    if (!found) {
      // Still an opening: colour it in its column even when the quotation is not on this page.
      for (const h of piece.words) {
        if (h.section === 'rashi' || h.section === 'tosafot' || isLargeTosafotWord(h, commBodyH)) {
          roles.set(h.id, { [piece.commentator]: key });
        }
      }
      continue;
    }
    cursor[piece.commentator] = found.start;
    const link: DhLink = {
      key,
      commentator: piece.commentator,
      dhIds: piece.words.map((h) => h.id),
      mainIds: main.slice(found.start, found.end + 1).map((h) => h.id),
    };
    links.push(link);
    for (const id of link.dhIds) roles.set(id, { [piece.commentator]: key });
  }

  // Main-text roles: Rashi green, Tosafot bordeaux, words quoted by both are split in half.
  for (const l of links) {
    for (const id of l.mainIds) {
      const r: DhHotspotRole = { ...(roles.get(id) || {}) };
      if (!r[l.commentator]) r[l.commentator] = l.key;
      if (r.rashi && r.tosafot) r.splitWord = true;
      roles.set(id, r);
    }
  }
  return { links, roles };
}

/** For a split word, which side was tapped? RTL: right half = Rashi. */
export function splitSideAt(clientX: number, rect: { left: number; width: number }): DhCommentator {
  return clientX >= rect.left + rect.width / 2 ? 'rashi' : 'tosafot';
}
