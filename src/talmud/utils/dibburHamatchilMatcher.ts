// @ts-nocheck
// Links Rashi / Tosafot "dibbur hamatchil" openings on a Vilna PDF scan to the
// Gemara/Mishnah words they quote. Pure logic: works on hotspot-like boxes.
//
// How an opening is recognised (Vilna typesetting, every tractate): see extractDibburim —
// punctuation bounds the opening, its own typeface names the commentator. Small reference
// markers (א, 1, 2 …) are skipped.

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
  /** PDF font resource of the printed run. */
  font?: string;
  /** A separate geresh / gershayim printed right after the word (ר' / ק"ש). */
  quoteAfter?: '"' | "'";
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

/** A word cut short with a geresh: ר' (רבי), דר' (דרבי), כלומ' (כלומר). */
function isTruncated(raw: string): boolean {
  const s = String(raw || '').replace(NIKUD, '').replace(/[.:,;]+$/, '').trim();
  return /['\u05F3\u2019]$/.test(s) && !ABBREV_MARK.test(s.slice(0, -1));
}

/** Do two single words match, ignoring nikud, final letters and up to two prefix letters? */
export function wordsMatch(a: string, b: string): boolean {
  const pa = plainWord(a);
  const pb = plainWord(b);
  if (!pa || !pb) return false;
  if (pa === pb) return true;
  // ר' = רבי, דר' = דרבי: a geresh-shortened word matches the full word it begins.
  if (isTruncated(a) && !isTruncated(b) && !isAbbreviation(b) && pb.length > pa.length && pb.startsWith(pa)) return true;
  if (isTruncated(b) && !isTruncated(a) && !isAbbreviation(a) && pa.length > pb.length && pa.startsWith(pb)) return true;
  // Hebrew plural -ים and Aramaic plural -ין are the same word (טובלים / טובלין).
  const plur = (w: string) => (w.length >= 4 && /י[מנ]$/.test(w) ? w.slice(0, -1) : w);
  if (plur(pa) === plur(pb) && plur(pa) !== pa) return true;
  const va = stripPrefixes(pa);
  const vb = stripPrefixes(pb);
  if (va.some((x) => x.length >= 3 && vb.includes(x))) return true;
  return isSkeletonMatch(toOCRSkeleton(pa), toOCRSkeleton(pb));
}

/** Collapses letters the scans' OCR confuses (ש/ס, א/ל, ב/כ, ה/ח/ת, ד/ר/ו, י/ז/נ, מ/ם, ע/צ). */
export function toOCRSkeleton(word: string): string {
  return plain(String(word || ''))
    .replace(/[^א-ת]/g, '')
    .replace(/[שס]/g, 'S')
    .replace(/[אל]/g, 'A')
    .replace(/[בכ]/g, 'B')
    .replace(/[החת]/g, 'H')
    .replace(/[דרו]/g, 'D')
    .replace(/[יזנ]/g, 'V')
    .replace(/[מ]/g, 'M')
    .replace(/[עצ]/g, 'E');
}

/** Equal skeletons (≥3 letters) match; long words (≥5) tolerate one differing letter. */
export function isSkeletonMatch(a: string, b: string): boolean {
  if (a.length < 3 || b.length < 3) return false;
  if (a === b) return true;
  if (a.length !== b.length || a.length < 5) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false;
  return true;
}

/**
 * Tries to match one DH token at main[pos]. Returns how many main words it
 * consumed (0 = no match). Abbreviations (ראשי תיבות) like אע"פ / ק"ש consume one
 * full main word per initial letter.
 */
export function matchTokenAt(token: string, main: string[], pos: number): number {
  if (pos >= main.length) return 0;
  if (wordsMatch(token, main[pos])) return 1;
  return abbreviationSpan(token, main, pos);
}

/**
 * How many full words at words[pos…] an abbreviation stands for (0 = none). The abbreviation's
 * letters are split into consecutive pieces, each beginning one of the words: אע"פ = אף על פי,
 * ק"ש = קריאת שמע, אדר"מ = אדר' מאיר (piece "אדר" begins the shortened אדר').
 */
export function abbreviationSpan(abbr: string, words: string[], pos: number): number {
  const norm = normalizeHebrewWord(abbr);
  if (!isAbbreviation(norm)) return 0;
  const full = plain(norm);
  // Pieces begin the words themselves; prefixes are written inside the abbreviation (וק"ש).
  const variants = (w: string) => {
    const p = plainWord(w);
    return p ? [p] : [];
  };
  const fits = (letters: string, start: number, n: number): boolean => {
    const split = (idx: number, j: number): boolean => {
      if (j === n) return idx === letters.length;
      const remainingWords = n - j - 1;
      for (let len = 1; idx + len + remainingWords <= letters.length; len++) {
        const piece = letters.slice(idx, idx + len);
        if (variants(words[start + j]).some((v) => v.startsWith(piece)) && split(idx + len, j + 1)) return true;
      }
      return false;
    };
    return split(0, 0);
  };
  // An attached prefix (ואע"פ) may stand outside the expanded words.
  const options = PREFIXES.includes(full[0]) && full.length > 2 ? [full, full.slice(1)] : [full];
  for (const letters of options) {
    for (let n = 2; n <= letters.length && pos + n <= words.length; n++) {
      if (fits(letters, pos, n)) return n;
    }
  }
  return 0;
}

/**
 * Aligns a quotation with the main text starting at main[pos]. Abbreviations may appear on either
 * side (Rashi אדר' מאיר ↔ Gemara אדר"מ). Returns the index after the last main word, or -1.
 */
function alignAt(tokens: string[], main: string[], pos: number): number {
  let i = 0;
  let p = pos;
  while (i < tokens.length) {
    if (p >= main.length) return -1;
    if (wordsMatch(tokens[i], main[p])) { i++; p++; continue; }
    const mainUsed = abbreviationSpan(tokens[i], main, p);
    if (mainUsed) { i++; p += mainUsed; continue; }
    const tokUsed = abbreviationSpan(main[p], tokens, i);
    if (tokUsed) { i += tokUsed; p++; continue; }
    return -1;
  }
  return p;
}

interface Token<T> { text: string; hs: T[] }

/**
 * Joins words the scan printed apart around a separate quote mark: ק + " + ש → ק"ש, ר + ' → ר'.
 * Hotspots must be in reading order.
 */
function toTokens<T extends DhHotspotLike>(hs: T[]): Token<T>[] {
  const out: Token<T>[] = [];
  for (let i = 0; i < hs.length; i++) {
    const h = hs[i];
    const next = hs[i + 1];
    if (h.quoteAfter === '"' && next && next.rowId === h.rowId && plainWord(next.word).length <= 2) {
      out.push({ text: `${normalizeHebrewWord(h.word)}"${normalizeHebrewWord(next.word)}`, hs: [h, next] });
      i++;
      continue;
    }
    out.push({ text: h.quoteAfter ? `${normalizeHebrewWord(h.word)}'` : h.word, hs: [h] });
  }
  return out;
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
export const MAX_DH_WORDS = 5;
/** Openings bounded by their own typeface may quote a longer passage. */
export const MAX_TYPEFACE_DH_WORDS = 10;

const endsWith = (w: string, ch: string) => String(w || '').trim().endsWith(ch);

/** Most common font among the given words, weighted by letters (the body script). */
function modeFont(words: DhHotspotLike[]): string | undefined {
  const count = new Map<string, number>();
  for (const h of words) {
    if (!h.font) continue;
    count.set(h.font, (count.get(h.font) || 0) + Math.max(1, plainWord(h.word).length));
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [k, n] of count) if (n > bestN) { best = k; bestN = n; }
  return best;
}

/**
 * Finds every opening. Vilna typesetting rules:
 * - An entry starts at the column start (clean space) or right after the previous entry's ":";
 *   its opening ends at the first "." (or וכו׳ / MAX_DH_WORDS).
 * - The opening is printed in its own typeface — Rashi's in bold Rashi script, Tosafot's in
 *   square letters — so the typeface (PDF font resource), not the page side, names the commentator.
 *   Each opening typeface is bound to the commentator whose entries use it most; a page without
 *   Tosafot therefore simply yields Rashi openings on both sides.
 * - Scans without font information fall back to the column the words were printed in.
 */
export function extractDibburim<T extends DhHotspotLike>(hotspots: T[]): Piece<T>[] {
  const comm = hotspots.filter(
    (h) => (h.section === 'rashi' || h.section === 'tosafot') && !h.isSmallMarker && plainWord(h.word)
  );
  const bodyH = modeHeight(comm);
  const raw: Array<Piece<T> & { bodyFont?: string }> = [];
  for (const sec of ['rashi', 'tosafot'] as const) {
    // Each column has its own body script; the opening typeface is anything else.
    const bodyFont = modeFont(comm.filter((h) => h.section === sec));
    const isOpeningType = (h: T) => !bodyFont || !h.font || h.font !== bodyFont;
    const words = readingOrder(
      hotspots.filter(
        (h) =>
          !h.isSmallMarker &&
          plainWord(h.word) &&
          (h.section === sec || (sec === 'tosafot' && isLargeTosafotWord(h, bodyH)))
      )
    );
    // With a distinct opening typeface the run itself bounds the opening; without one, cap it.
    const maxWords = bodyFont ? MAX_TYPEFACE_DH_WORDS : MAX_DH_WORDS;
    let open = true;
    let cur: Piece<T> | null = null;
    // An opening is only real once its closing "." (or וכו׳) is printed.
    const drop = () => {
      if (cur) raw.splice(raw.indexOf(cur), 1);
      cur = null;
    };
    for (const w of words) {
      const p = plainWord(w.word);
      const colon = w.stopAfter === ':' || endsWith(w.word, ':');
      const dot = w.stopAfter === '.' || endsWith(w.word, '.');
      if (open && !HEADINGS.has(p)) {
        if (cur && cur.words.length > 0 && bodyFont && w.font === bodyFont && w.font !== cur.words[0].font) {
          // Body script resumed without a printed "." — that was not an opening.
          drop();
          open = false;
        } else {
          if (!cur) {
            if (bodyFont && !isOpeningType(w)) {
              // No opening typeface here: the entry continues in body text.
              open = false;
              if (colon) open = true;
              continue;
            }
            cur = { commentator: sec, words: [], bodyFont };
            raw.push(cur);
          }
          cur.words.push(w);
          if (dot || ETC.has(p)) { open = false; cur = null; }
          else if (cur.words.length >= maxWords) { drop(); open = false; }
        }
      }
      if (colon) {
        drop();
        open = true;
      }
    }
    drop();
  }

  // The commentator is the column the opening was printed in (geometric zone); PDF font IDs
  // are per-line OCR artefacts and never vote on identity — they only bound the opening.
  return raw;
}

function findInMain(
  tokens: string[],
  main: string[],
  from: number,
  claimed: Set<number>
): { start: number; end: number } | null {
  if (tokens.length === 0) return null;
  const free = (a: number, b: number) => {
    for (let i = a; i <= b; i++) if (claimed.has(i)) return false;
    return true;
  };
  const search = (startAt: number) => {
    for (let s = startAt; s < main.length; s++) {
      if (claimed.has(s)) continue;
      const p = alignAt(tokens, main, s);
      // Words already quoted by this commentator's earlier opening are never taken again.
      if (p > s && free(s, p - 1)) return { start: s, end: p - 1 };
    }
    return null;
  };
  return search(Math.max(0, from - 3)) || (from > 3 ? search(0) : null);
}

function free(a: number, b: number, set: Set<number>): boolean {
  for (let i = a; i <= b; i++) if (set.has(i)) return false;
  return true;
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
  const main = toTokens(readingOrder(mainAll.filter((h) => !mainH || !h.glyphH || h.glyphH >= mainH * 0.8)));
  const mainWords = main.map((t) => t.text);
  const links: DhLink[] = [];
  const roles = new Map<string, DhHotspotRole>();
  const cursor: Record<DhCommentator, number> = { rashi: 0, tosafot: 0 };
  const counter: Record<DhCommentator, number> = { rashi: 0, tosafot: 0 };

  // Word-level state: each commentator claims main words independently. Rashi links first,
  // so Tosafot can join (split half/half) but never steal its own earlier claims.
  const claimed: Record<DhCommentator, Set<number>> = { rashi: new Set(), tosafot: new Set() };
  const spans: Array<{ key: string; start: number; end: number }> = [];
  const pieces = extractDibburim(hotspots);
  const ordered = [...pieces.filter((p) => p.commentator === 'rashi'), ...pieces.filter((p) => p.commentator === 'tosafot')];
  for (const piece of ordered) {
    const hasEtc = piece.words.some((h) => ETC.has(plainWord(h.word)));
    const words = piece.words.filter((h) => {
      const p = plainWord(h.word);
      return p && !ETC.has(p) && !HEADINGS.has(p);
    });
    if (words.length === 0) continue;
    const toks = toTokens(words);
    let found: { start: number; end: number } | null = null;
    // The quotation always begins with the opening's first word — never from its middle or end.
    // One-word openings quote one word; longer ones need at least two matching words.
    const minK = toks.length === 1 ? 1 : 2;
    for (let k = toks.length; k >= minK; k--) {
      if (k === 1 && plainWord(toks[0].text).length < 2) break;
      found = findInMain(toks.slice(0, k).map((t) => t.text), mainWords, cursor[piece.commentator], claimed[piece.commentator]);
      if (found) break;
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
    // Commentaries follow the text in order: an identical later quote binds to the next occurrence.
    cursor[piece.commentator] = found.start + 1;
    // וכו׳: a Tosafot opening that starts where a longer Rashi quotation starts quotes all of it.
    if (piece.commentator === 'tosafot' && hasEtc) {
      const r = spans.find((x) => x.start === found!.start && x.end > found!.end);
      if (r && free(found.start, r.end, claimed.tosafot)) found = { start: found.start, end: r.end };
    }
    for (let i = found.start; i <= found.end; i++) claimed[piece.commentator].add(i);
    if (piece.commentator === 'rashi') spans.push({ key, start: found.start, end: found.end });
    const link: DhLink = {
      key,
      commentator: piece.commentator,
      dhIds: piece.words.map((h) => h.id),
      mainIds: main.slice(found.start, found.end + 1).flatMap((t) => t.hs.map((h) => h.id)),
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
