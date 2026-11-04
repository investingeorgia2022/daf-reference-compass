// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks, matchTokenAt, wordsMatch, splitSideAt } from '@/talmud/utils/dibburHamatchilMatcher';

// Vilna type sizes (pt): commentary body 11.2, bold Rashi 11.4, bold Tosafot 11.9, large Tosafot opening 16.4, Gemara 13.7.
const BODY = 11.2, RASHI_BOLD = 11.4, TOS_BOLD = 11.9, TOS_BIG = 16.4, GEM = 13.7;
let n = 0;
const row = (section: string, words: Array<[string, number, ('.' | ':')?]>, top: number) =>
  words.map(([word, glyphH, stopAfter], i) => ({
    id: `${section}-${n++}`,
    word,
    section,
    rowId: `${section}-${top}`,
    leftPct: 90 - i * 8,
    topPct: top,
    widthPct: 7.5,
    heightPct: 1,
    glyphH,
    stopAfter,
  }));
const gem = (words: string[], top = 10) => row('gemara', words.map((w) => [w, GEM] as [string, number]), top);
const body = (w: string): [string, number] => [w, BODY];
// Ordinary commentary prose so the page has a measurable body size.
const prose = () => [
  ...row('rashi', ['והיינו', 'דאמרינן', 'בגמרא', 'לקמן'].map(body), 80),
  ...row('tosafot', ['והיינו', 'דאמרינן', 'בגמרא', 'לקמן'].map(body), 85),
];

describe('dibbur hamatchil matching', () => {
  it('matches words ignoring prefixes and nikud', () => {
    expect(wordsMatch('וּמֵאֵימָתַי', 'מאימתי')).toBe(true);
    expect(wordsMatch('קורין', 'שמע')).toBe(false);
  });

  it('expands an abbreviation into one main word per initial', () => {
    expect(matchTokenAt('אע"פ', ['אף', 'על', 'פי', 'כן'], 0)).toBe(3);
  });

  it('only bold Rashi words form a Rashi opening; plain body words are never linked', () => {
    const g = gem(['מאימתי', 'קורין', 'את', 'שמע', 'בערבין']);
    const r = row('rashi', [['קורין', RASHI_BOLD], ['את', RASHI_BOLD], ['שמע', RASHI_BOLD, '.'], body('בערבין'), body('מאימתי')], 30);
    const { roles } = buildDibburHamatchilLinks([...prose(), ...g, ...r]);
    expect(roles.get(g[1].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(g[3].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(g[0].id)).toBeUndefined();
    expect(roles.get(g[4].id)).toBeUndefined();
    expect(roles.get(r[3].id)).toBeUndefined();
  });

  it('a Tosafot opening (large first word, bold continuation) is linked as Tosafot, not Rashi', () => {
    const g = gem(['מאימתי', 'קורין', 'את', 'שמע']);
    const t = row('tosafot', [['מאימתי', TOS_BIG], ['קורין', TOS_BOLD], ['וכו', TOS_BOLD], body('פירוש')], 50);
    const { roles } = buildDibburHamatchilLinks([...prose(), ...g, ...t]);
    expect(roles.get(g[0].id)).toEqual({ tosafot: 'tosafot:0' });
    expect(roles.get(g[1].id)).toEqual({ tosafot: 'tosafot:0' });
    expect(roles.get(t[2].id)).toEqual({ tosafot: 'tosafot:0' });
    expect(roles.get(t[3].id)).toBeUndefined();
  });

  it('a word quoted by both Rashi and Tosafot is split between them', () => {
    const g = gem(['מאימתי', 'קורין']);
    const r = row('rashi', [['מאימתי', RASHI_BOLD], ['קורין', RASHI_BOLD, '.'], body('x')], 30);
    const t = row('tosafot', [['מאימתי', TOS_BIG], ['קורין', TOS_BOLD, '.'], body('x')], 50);
    const { roles } = buildDibburHamatchilLinks([...prose(), ...g, ...r, ...t]);
    expect(roles.get(g[0].id)).toEqual({ rashi: 'rashi:0', tosafot: 'tosafot:0', splitWord: true });
  });

  it('two openings on one line are separated by the printed period', () => {
    const g = gem(['קורין', 'את', 'שמע', 'משעה', 'שהכהנים', 'נכנסים']);
    const r = row('rashi', [['קורין', RASHI_BOLD], ['את', RASHI_BOLD], ['שמע', RASHI_BOLD, '.'], ['פירוש', BODY, ':'], ['משעה', RASHI_BOLD], ['שהכהנים', RASHI_BOLD, '.']], 30);
    const { links } = buildDibburHamatchilLinks([...prose(), ...g, ...r]);
    expect(links.map((l) => l.dhIds.length)).toEqual([3, 2]);
  });

  it('ignores blue markers inside a quotation', () => {
    const g = row('gemara', [['מאימתי', GEM], ['א', GEM], ['קורין', GEM]], 10);
    (g[1] as any).isSmallMarker = true;
    const r = row('rashi', [['מאימתי', RASHI_BOLD], ['קורין', RASHI_BOLD, '.'], body('x')], 30);
    const { roles } = buildDibburHamatchilLinks([...prose(), ...g, ...r]);
    expect(roles.get(g[2].id)?.rashi).toBe('rashi:0');
    expect(roles.get(g[1].id)).toBeUndefined();
  });

  it('a split single word: right half Rashi, left half Tosafot', () => {
    expect(splitSideAt(80, { left: 0, width: 100 })).toBe('rashi');
    expect(splitSideAt(20, { left: 0, width: 100 })).toBe('tosafot');
  });
});
import { wordsMatch as wm } from '../talmud/utils/dibburHamatchilMatcher';
describe('plural endings', () => {
  it('matches Rashi טובלים with Gemara טובלין', () => { expect(wm('טובלים', 'טובלין')).toBe(true); });
  it('does not merge unrelated words', () => { expect(wm('טובלים', 'טובלת')).toBe(false); });
});

describe('repeated identical quotations', () => {
  it('two identical Rashi openings bind to the first and second occurrences in order', () => {
    const g1 = gem(['אמר', 'מר', 'קורין'], 10);
    const g2 = gem(['אמר', 'מר', 'בערבין'], 20);
    const r1 = row('rashi', [['אמר', RASHI_BOLD], ['מר', RASHI_BOLD, '.'], ['פירוש', BODY, ':']], 40);
    const r2 = row('rashi', [['אמר', RASHI_BOLD], ['מר', RASHI_BOLD, '.'], body('היינו')], 60);
    const { roles } = buildDibburHamatchilLinks([...prose(), ...g1, ...g2, ...r1, ...r2]);
    expect(roles.get(g1[0].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(g2[0].id)).toEqual({ rashi: 'rashi:1' });
  });
});

describe('structural opening rule (scan letter sizes ignored)', () => {
  it('a Rashi-column opening is green even when OCR reports a Tosafot-like height', () => {
    const g = gem(['קשיא', 'דרבי', 'מאיר']);
    const r = row('rashi', [['קשיא', 18.6], ['דרבי', 18.6], ['מאיר', 18.6, '.'], ['לעיל', 18.6]], 30);
    const { roles } = buildDibburHamatchilLinks([...g, ...r]);
    expect(roles.get(g[0].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(r[3].id)).toBeUndefined();
  });
  it('an opening without a period stops after 5 words; the rest stays uncoloured', () => {
    const r = row('rashi', ['א1','ב1','ג1','ד1','ה1','ו1','ז1'].map((w) => ['מילה' + w.length + w, BODY] as [string, number]), 30);
    const { roles } = buildDibburHamatchilLinks(r);
    expect(roles.get(r[4].id)).toBeDefined();
    expect(roles.get(r[5].id)).toBeUndefined();
  });
});
