import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks, matchTokenAt, wordsMatch, splitSideAt } from '@/talmud/utils/dibburHamatchilMatcher';

let n = 0;
const row = (section: string, words: string[], top: number) =>
  words.map((word, i) => ({
    id: `${section}-${n++}`,
    word,
    section,
    rowId: `${section}-${top}`,
    leftPct: 90 - i * 8,
    topPct: top,
    widthPct: 6,
    heightPct: 1,
  }));

describe('dibbur hamatchil matching', () => {
  it('matches words ignoring prefixes and nikud', () => {
    expect(wordsMatch('וּמֵאֵימָתַי', 'מאימתי')).toBe(true);
    expect(wordsMatch('קורין', 'שמע')).toBe(false);
  });

  it('expands an abbreviation into one main word per initial', () => {
    expect(matchTokenAt('אע"פ', ['אף', 'על', 'פי', 'כן'], 0)).toBe(3);
  });

  it('links Rashi to green main text and Tosafot to bordeaux', () => {
    const gemara = row('gemara', ['מאימתי', 'קורין', 'את', 'שמע', 'בערבין'], 10);
    const rashi = row('rashi', ['מאימתי.', 'פירוש', 'דבר:'], 30);
    const tos = row('tosafot', ['את', 'שמע.', 'פירוש:'], 50);
    const { roles } = buildDibburHamatchilLinks([...gemara, ...rashi, ...tos]);
    expect(roles.get(gemara[0].id)?.rashi).toBeTruthy();
    expect(roles.get(gemara[2].id)?.tosafot).toBeTruthy();
    expect(roles.get(gemara[1].id)).toBeUndefined();
    expect(roles.get(rashi[0].id)?.rashi).toBeTruthy();
  });

  it('splits a shared quotation: first half Rashi, second half Tosafot', () => {
    const gemara = row('gemara', ['מאימתי', 'קורין', 'את', 'שמע'], 10);
    const rashi = row('rashi', ['מאימתי', 'קורין', 'את', 'שמע.', 'x:'], 30);
    const tos = row('tosafot', ['מאימתי', 'קורין', 'את', 'שמע.', 'x:'], 50);
    const { roles } = buildDibburHamatchilLinks([...gemara, ...rashi, ...tos]);
    expect(roles.get(gemara[0].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(gemara[1].id)).toEqual({ rashi: 'rashi:0' });
    expect(roles.get(gemara[2].id)).toEqual({ tosafot: 'tosafot:0' });
    expect(roles.get(gemara[3].id)).toEqual({ tosafot: 'tosafot:0' });
  });

  it('ignores blue markers inside a quotation', () => {
    const g = row('gemara', ['מאימתי', 'א', 'קורין'], 10);
    (g[1] as any).isSmallMarker = true;
    const rashi = row('rashi', ['מאימתי', 'קורין.', 'x:'], 30);
    const { roles } = buildDibburHamatchilLinks([...g, ...rashi]);
    expect(roles.get(g[2].id)?.rashi).toBe('rashi:0');
    expect(roles.get(g[1].id)).toBeUndefined();
  });

  it('a split single word: right half Rashi, left half Tosafot', () => {
    expect(splitSideAt(80, { left: 0, width: 100 })).toBe('rashi');
    expect(splitSideAt(20, { left: 0, width: 100 })).toBe('tosafot');
  });
});
