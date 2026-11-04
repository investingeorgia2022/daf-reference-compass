import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks } from '../talmud/utils/dibburHamatchilMatcher';

// Scans with one flat glyph height (HebrewBooks) find openings by ":" … "." structure.
const w = (id: string, word: string, section: string, row: number, left: number) => ({
  id, word, section, rowId: `${section}-${row}`, leftPct: left, topPct: 10 + row * 2, widthPct: 3, heightPct: 1.5, glyphH: 10.9,
});

describe('flat-height dibbur hamatchil', () => {
  it('links a Rashi opening after ":" up to "." without colouring the body', () => {
    const hs = [
      w('m1', 'אמר', 'gemara', 0, 55), w('m2', 'ליה', 'gemara', 0, 50), w('m3', 'רבא', 'gemara', 0, 45),
      w('r0', 'וכן:', 'rashi', 0, 75),
      w('r1', 'אמר', 'rashi', 1, 78), w('r2', 'ליה.', 'rashi', 1, 74),
      w('r3', 'כלומר', 'rashi', 1, 70), w('r4', 'רבא:', 'rashi', 1, 66),
      ...Array.from({ length: 40 }, (_, i) => w(`f${i}`, 'פירוש', 'rashi', 3 + Math.floor(i / 4), 78 - (i % 4) * 4)),
    ];
    const { links, roles } = buildDibburHamatchilLinks(hs);
    expect(links).toHaveLength(1);
    expect(links[0].dhIds).toEqual(['r1', 'r2']);
    expect(links[0].mainIds).toEqual(['m1', 'm2']);
    expect(roles.has('r3')).toBe(false);
    expect(roles.has('m3')).toBe(false);
  });
});
