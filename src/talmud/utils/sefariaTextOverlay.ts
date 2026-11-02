// Aligns the words read from a Vilna PDF text layer (positions are exact, letters may be
// noisy) with the clean Sefaria Unicode text of the same daf. The scan stays untouched; only
// the invisible word layer gets the exact Sefaria spelling and its true sentence.
import { normalizeHebrewWord } from '../data/lexicon';

export interface OverlayWord {
  cleanWord: string;
  word: string;
  section: string;
  isSmallMarker?: boolean;
  topPct: number;
  leftPct: number;
  heightPct: number;
}

export interface OverlaySentence {
  id: string;
  hebrewText?: string;
  hebrew?: string;
  translationHe?: string;
}

export interface OverlayMatch<S> {
  hotspotIndex: number;
  word: string;
  cleanWord: string;
  sentence: S;
}

const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const fold = (w: string) => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]);

/** Letter similarity 0..1 (Levenshtein, final letters folded). */
export function wordSimilarity(a: string, b: string): number {
  a = fold(a);
  b = fold(b);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

export function sentenceWords(s: OverlaySentence): { word: string; clean: string }[] {
  const raw = (s.hebrewText || s.hebrew || s.translationHe || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&thinsp;/g, ' ');
  return raw
    .split(/[\s\u05BE\-–—]+/)
    .map((w) => ({ word: w.replace(/[\u0591-\u05C7]/g, '').replace(/[.,:;!?()[\]{}]/g, ''), clean: normalizeHebrewWord(w) }))
    .filter((w) => w.clean.length > 0);
}

const MIN_SIM = 0.5;
const GAP = -0.6;

/** Semi-global alignment: every sentence word is consumed, the page sequence has free ends. */
function alignSentence(words: string[], page: string[]) {
  const n = words.length;
  const m = page.length;
  const W = m + 1;
  const score = new Float32Array((n + 1) * W);
  const back = new Uint8Array((n + 1) * W); // 1 diag, 2 up (skip sentence word), 3 left (skip page word)
  for (let i = 1; i <= n; i++) {
    score[i * W] = i * GAP;
    back[i * W] = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = wordSimilarity(words[i - 1], page[j - 1]);
      const d = score[(i - 1) * W + j - 1] + (sim >= MIN_SIM ? 2 * sim - 0.5 : -1);
      const u = score[(i - 1) * W + j] + GAP;
      const l = score[i * W + j - 1] + (i === n ? 0 : GAP);
      let best = d;
      let b = 1;
      if (u > best) { best = u; b = 2; }
      if (l > best) { best = l; b = 3; }
      score[i * W + j] = best;
      back[i * W + j] = b;
    }
  }
  let j = m;
  // Free trailing end: pick the best column in the last row.
  let bestJ = 0;
  for (let k = 0; k <= m; k++) if (score[n * W + k] > score[n * W + bestJ]) bestJ = k;
  const total = score[n * W + bestJ];
  j = bestJ;
  let i = n;
  const pairs: [number, number][] = [];
  while (i > 0 && j > 0) {
    const b = back[i * W + j];
    if (b === 1) {
      if (wordSimilarity(words[i - 1], page[j - 1]) >= MIN_SIM) pairs.push([i - 1, j - 1]);
      i--; j--;
    } else if (b === 2) i--;
    else j--;
  }
  return { total, pairs };
}

const SECTION_SOURCES: Record<string, 'text' | 'rashi' | 'tosafot'> = {
  gemara: 'text', mishnah: 'text', rashi: 'rashi', tosafot: 'tosafot',
};

/** Returns, for every confidently aligned page word, its exact Sefaria spelling and sentence. */
export function alignPageWithSefaria<S extends OverlaySentence>(
  hotspots: OverlayWord[],
  text: { mainText: S[]; rashi: S[]; tosafot: S[] }
): OverlayMatch<S>[] {
  const out: OverlayMatch<S>[] = [];
  const groups: Record<'text' | 'rashi' | 'tosafot', number[]> = { text: [], rashi: [], tosafot: [] };
  hotspots.forEach((h, idx) => {
    const g = SECTION_SOURCES[h.section];
    if (g && !h.isSmallMarker && h.cleanWord) groups[g].push(idx);
  });
  const sources = { text: text.mainText, rashi: text.rashi, tosafot: text.tosafot };
  for (const key of ['text', 'rashi', 'tosafot'] as const) {
    const idxs = groups[key].slice().sort((a, b) => {
      const A = hotspots[a];
      const B = hotspots[b];
      if (Math.abs(A.topPct - B.topPct) > Math.min(A.heightPct, B.heightPct) * 0.5) return A.topPct - B.topPct;
      return B.leftPct - A.leftPct; // right-to-left
    });
    if (!idxs.length) continue;
    const page = idxs.map((i) => hotspots[i].cleanWord);
    const cands: { score: number; s: S; pairs: [number, number][]; words: { word: string; clean: string }[] }[] = [];
    for (const s of sources[key] || []) {
      const words = sentenceWords(s);
      if (words.length < 2) continue;
      const { total, pairs } = alignSentence(words.map((w) => w.clean), page);
      if (pairs.length >= Math.min(3, words.length) && total > words.length * 0.4) {
        cands.push({ score: total, s, pairs, words });
      }
    }
    cands.sort((a, b) => b.score - a.score);
    const taken = new Set<number>();
    for (const c of cands) {
      // Drop a weaker sentence whose location is mostly already claimed.
      const free = c.pairs.filter(([, pj]) => !taken.has(pj));
      if (free.length < c.pairs.length * 0.6) continue;
      for (const [wi, pj] of free) {
        taken.add(pj);
        out.push({ hotspotIndex: idxs[pj], word: c.words[wi].word, cleanWord: c.words[wi].clean, sentence: c.s });
      }
    }
  }
  return out;
}
