// Links Rashi / Tosafot "dibbur hamatchil" openings on a Vilna PDF scan to the
// Gemara/Mishnah words they quote. Pure logic: works on hotspot-like boxes.

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
}

export interface DhLink {
  key: string;
  commentator: DhCommentator;
  /** Hotspot ids of the opening words inside Rashi/Tosafot. */
  dhIds: string[];
  /** Hotspot ids of the quoted words in the main text. */
  mainIds: string[];
}

/** Per-hotspot interactive role. A shared main-text word may carry both sides. */
export interface DhHotspotRole {
  rashi?: string; // link key
  tosafot?: string;
  /** For a single shared word: which horizontal half belongs to Rashi (RTL: right half first). */
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

/** Filler words that end a quotation ("etc.") and are not looked up in the Gemara. */
const ETC = new Set(['וכו', 'וכו׳', 'וגו', 'כו', 'וגומר', 'וכולי']);

export function isAbbreviation(word: string): boolean {
  const w = normalizeHebrewWord(word);
  return ABBREV_MARK.test(w.slice(0, -1)) && plain(w).length >= 2;
}

function stripPrefixes(w: string): string[] {
  const out = [w];
  let cur = w;
  for (let i = 0; i < 2 && cur.length > 2 && PREFIXES.includes(cur[0]); i++) {
    cur = cur.slice(1);
    out.push(cur);
  }
  return out;
}

/** Do two single words match, ignoring nikud, final letters and up to two prefix letters? */
export function wordsMatch(a: string, b: string): boolean {
  const pa = plain(normalizeHebrewWord(a));
  const pb = plain(normalizeHebrewWord(b));
  if (!pa || !pb) return false;
  if (pa === pb) return true;
  const va = stripPrefixes(pa);
  const vb = stripPrefixes(pb);
  return va.some((x) => x.length >= 2 && vb.includes(x));
}

/**
 * Tries to match one DH token at main[pos]. Returns how many main words it
 * consumed (0 = no match). Abbreviations (ראשי תיבות) like אע"פ consume one
 * main word per initial letter.
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
        const mw = plain(normalizeHebrewWord(main[pos + k]));
        const cands = stripPrefixes(mw);
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

/**
 * Splits a commentary section into openings. A new comment starts at the
 * beginning of the section or after a word ending with ':'. The opening runs
 * until the first word ending with '.' (or '-'), capped at 10 words.
 */
export function extractDibburim<T extends DhHotspotLike>(ordered: T[]): T[][] {
  const out: T[][] = [];
  let atStart = true;
  let cur: T[] | null = null;
  for (const h of ordered) {
    if (h.isSmallMarker) continue;
    const raw = String(h.word || '');
    if (atStart) { cur = []; atStart = false; }
    if (cur) {
      const n = normalizeHebrewWord(raw);
      if (n) cur.push(h);
      if (/[.\-–־]\s*$/.test(raw) || cur.length >= 10) {
        if (cur.length > 0 && cur.length < 10) out.push(cur);
        cur = null;
      }
    }
    if (/:\s*$/.test(raw)) { atStart = true; cur = null; }
  }
  return out;
}

function findInMain(tokens: string[], main: string[], from: number): { start: number; end: number } | null {
  const toks = tokens.filter((t) => !ETC.has(plain(normalizeHebrewWord(t))) && plain(normalizeHebrewWord(t)).length > 0);
  if (toks.length === 0) return null;
  // One-word openings are ambiguous; require at least 2 letters and exact match.
  const search = (startAt: number) => {
    for (let s = startAt; s < main.length; s++) {
      let p = s;
      let ok = true;
      for (const t of toks) {
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
  const main = readingOrder(
    hotspots.filter((h) => (h.section === 'gemara' || h.section === 'mishnah') && !h.isSmallMarker && normalizeHebrewWord(h.word))
  );
  const mainWords = main.map((h) => h.word);
  const links: DhLink[] = [];
  const roles = new Map<string, DhHotspotRole>();

  for (const commentator of ['rashi', 'tosafot'] as DhCommentator[]) {
    const ordered = readingOrder(hotspots.filter((h) => h.section === commentator));
    let cursor = 0;
    extractDibburim(ordered).forEach((dh, i) => {
      const found = findInMain(dh.map((h) => h.word), mainWords, cursor);
      if (!found) return;
      const toks = dh.filter((h) => !ETC.has(plain(normalizeHebrewWord(h.word))));
      if (toks.length === 1 && plain(normalizeHebrewWord(toks[0].word)).length < 3) return;
      cursor = found.start;
      const key = `${commentator}:${i}`;
      const link: DhLink = {
        key,
        commentator,
        dhIds: dh.map((h) => h.id),
        mainIds: main.slice(found.start, found.end + 1).map((h) => h.id),
      };
      links.push(link);
      for (const id of link.dhIds) roles.set(id, { ...(roles.get(id) || {}), [commentator]: key });
    });
  }

  // Main-text roles; shared quotations are split in half (first half Rashi, second half Tosafot).
  const rashiByMain = new Map<string, DhLink>();
  for (const l of links) if (l.commentator === 'rashi') for (const id of l.mainIds) rashiByMain.set(id, l);
  for (const l of links) {
    if (l.commentator === 'rashi') continue;
    const overlap = l.mainIds.filter((id) => rashiByMain.has(id));
    if (overlap.length === 0) {
      for (const id of l.mainIds) roles.set(id, { ...(roles.get(id) || {}), tosafot: l.key });
      continue;
    }
    if (overlap.length === 1) {
      const id = overlap[0];
      roles.set(id, { rashi: rashiByMain.get(id)!.key, tosafot: l.key, splitWord: true });
    } else {
      const half = Math.ceil(overlap.length / 2);
      overlap.forEach((id, k) => {
        if (k < half) roles.set(id, { rashi: rashiByMain.get(id)!.key });
        else roles.set(id, { tosafot: l.key });
      });
    }
    for (const id of l.mainIds) if (!rashiByMain.has(id)) roles.set(id, { tosafot: l.key });
  }
  for (const [id, l] of rashiByMain) if (!roles.has(id)) roles.set(id, { rashi: l.key });
  return { links, roles };
}

/** For a split single word, which side was tapped? RTL: right half = Rashi. */
export function splitSideAt(clientX: number, rect: { left: number; width: number }): DhCommentator {
  return clientX >= rect.left + rect.width / 2 ? 'rashi' : 'tosafot';
}
