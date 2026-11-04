import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks } from '../talmud/utils/dibburHamatchilMatcher';

const w = (id: string, word: string, section: string, row: number, left: number, glyphH: number, stopAfter?: '.' | ':') => ({
  id, word, section, rowId: `${section}-${row}`, leftPct: left, topPct: 10 + row * 2, widthPct: 3, heightPct: 1.5, glyphH, ...(stopAfter ? { stopAfter } : {}),
});

describe('opening colour follows its column, measured per page', () => {
  it('a bold word in the Rashi column is Rashi even when much taller than the page body', () => {
    const hs = [
      w('g1', 'מאימתי', 'gemara', 1, 50, 13), w('g2', 'קורין', 'gemara', 1, 46, 13),
      w('r1', 'מאימתי', 'rashi', 1, 75, 11.6), w('r2', 'קורין', 'rashi', 1, 71, 11.6, '.'),
      ...Array.from({ length: 12 }, (_, i) => w(`rb${i}`, 'פירושא', 'rashi', 2 + Math.floor(i / 4), 75 - (i % 4) * 4, 10)),
    ];
    const { roles } = buildDibburHamatchilLinks(hs);
    expect(roles.get('r1')?.rashi).toBeTruthy();
    expect(roles.get('r1')?.tosafot).toBeUndefined();
    expect(roles.get('rb0')).toBeUndefined();
  });
});
