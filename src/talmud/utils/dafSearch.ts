// @ts-nocheck
import { abbreviationSpan, normalizeHebrewWord, wordsMatch, isInlineMarker } from './dibburHamatchilMatcher';

export interface SearchableSpot {
  id: string;
  word: string;
  section: string;
  topPct: number;
  leftPct: number;
  heightPct: number;
  widthPct: number;
  isSmallMarker?: boolean;
  quoteAfter?: string;
}

export interface DafSearchHit {
  ids: string[];
  section: string;
  score: number;
  contextBefore: string;
  match: string;
  contextAfter: string;
}

const plain = (w: string) => normalizeHebrewWord(w).replace(/[^א-ת"'״׳]/g, '');
const letters = (w: string) => plain(w).replace(/[^א-ת]/g, '');

const isShortened = (w: string) => /^[א-ת]+['\u05F3\u2019]$/.test(String(w || '').replace(/[\u0591-\u05C7]/g, '').replace(/[.:,;]+$/, '').trim());

/** Splits a query into words; quote marks inside a word are kept (ק"ש). */
export function tokenizeQuery(q: string): string[] {
  return q.replace(/[\u0591-\u05C7]/g, '').split(/[\s,.:;!?()[\]]+/).map((t) => t.trim()).filter((t) => letters(t));
}

/** How many daf words starting at pos the query word covers (0 = no match), with a quality 0..1. */
function matchWord(q: string, words: string[], pos: number, isLast: boolean): { used: number; quality: number } {
  const w = words[pos];
  if (!w) return { used: 0, quality: 0 };
  const lq = letters(q), lw = letters(w);
  if (lq === lw) return { used: 1, quality: 1 };
  // A geresh-shortened daf word (ר', כלומ') stands only for its known expansions, never for any word
  // that merely begins with the same letter: רבא is not ר'.
  if (isShortened(w) && !isShortened(q)) {
    const ok = lw === 'ר' ? ['רבי', 'רב', 'רבן'].includes(lq) : lw.length >= 3 && lq.startsWith(lw);
    return ok ? { used: 1, quality: 0.8 } : { used: 0, quality: 0 };
  }
  if (wordsMatch(q, w)) return { used: 1, quality: 0.85 };
  const span = abbreviationSpan(q, words, pos);
  if (span) return { used: span, quality: 0.8 };
  if (abbreviationSpan(w, [q], 0)) return { used: 1, quality: 0.8 };
  // The word being typed: a prefix of a daf word still counts.
  if (isLast && lq.length >= 2 && lw.startsWith(lq)) return { used: 1, quality: 0.6 };
  // Daf word written with a prefix letter (ו/ה/ב/ל/מ/ש/כ/ד) before the searched word.
  if (lq.length >= 2 && lw.length === lq.length + 1 && 'והבלמשכד'.includes(lw[0]) && lw.slice(1) === lq) return { used: 1, quality: 0.75 };
  return { used: 0, quality: 0 };
}

/** Finds a phrase anywhere on the daf, in every section, tolerating abbreviations, prefixes and line breaks. */
export function searchDaf<T extends SearchableSpot>(spots: T[], query: string, limit = 60): DafSearchHit[] {
  const q = tokenizeQuery(query);
  if (!q.length) return [];
  const hits: DafSearchHit[] = [];
  const sections = [...new Set(spots.map((s) => s.section))].filter((s) => s !== 'header');
  for (const section of sections) {
    const list = spots
      .filter((s) => s.section === section && !s.isSmallMarker && !isInlineMarker(s.word) && letters(s.word))
      .sort((a, b) => {
        const dy = a.topPct - b.topPct;
        if (Math.abs(dy) > Math.min(a.heightPct, b.heightPct) * 0.5) return dy;
        return b.leftPct + b.widthPct - (a.leftPct + a.widthPct);
      });
    const words = list.map((s) => (s.quoteAfter ? `${s.word}${s.quoteAfter}` : s.word));
    for (let s = 0; s < words.length; s++) {
      let p = s;
      let quality = 0;
      let ok = true;
      for (let i = 0; i < q.length; i++) {
        const m = matchWord(q[i], words, p, i === q.length - 1);
        if (!m.used) { ok = false; break; }
        quality += m.quality;
        p += m.used;
      }
      if (!ok) continue;
      const ctx = (a: number, b: number) => words.slice(Math.max(0, a), Math.max(0, b)).join(' ');
      hits.push({
        ids: list.slice(s, p).map((x) => x.id),
        section,
        score: quality / q.length,
        contextBefore: ctx(s - 4, s),
        match: ctx(s, p),
        contextAfter: ctx(p, p + 4),
      });
      s = p - 1;
    }
  }
  const order = ['mishnah', 'gemara', 'rashi', 'tosafot', 'margin'];
  return hits
    .sort((a, b) => b.score - a.score || order.indexOf(a.section) - order.indexOf(b.section))
    .slice(0, limit);
}
