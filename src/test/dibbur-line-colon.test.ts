import { describe, it, expect } from 'vitest';
import { extractDibburim } from '@/talmud/utils/dibburHamatchilMatcher';

const w = (id: string, word: string, row: number, left: number, extra: Record<string, unknown> = {}) => ({
  id, word, section: 'rashi', rowId: `r${row}`, leftPct: left, topPct: 10 + row * 2, widthPct: 3, heightPct: 1.5, ...extra,
});

describe('dibbur hamatchil after a line-end colon', () => {
  it('opens a new entry on the next line when the previous line ended with ":"', () => {
    const hs = [
      w('a', 'פירוש', 0, 75), w('b', 'בתרומתן', 0, 70, { stopAfter: ':' }),
      w('c', 'עד', 1, 75), w('d', 'חצות', 1, 70, { stopAfter: '.' }), w('e', 'כדי', 1, 65),
    ];
    const dh = extractDibburim(hs);
    expect(dh.map((p) => p.words.map((x) => x.word).join(' '))).toContain('עד חצות');
  });
});
