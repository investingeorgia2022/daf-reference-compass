// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { extractDibburim } from '@/talmud/utils/dibburHamatchilMatcher';

const w = (id, word, top, left, extra = {}) => ({
  id, word, section: 'tosafot', topPct: top, leftPct: left, widthPct: 2, heightPct: 1, font: extra.font || 'f3', ...extra,
});

describe('dibbur hamatchil split across lines', () => {
  it('joins an opening that starts after a line-end ":" and closes with "." on the next line', () => {
    const hs = [
      w('a', 'דבר', 10, 30), w('b', 'אחר', 10, 26, { stopAfter: ':' }),
      w('c', 'מברך', 11, 40, { font: 'f5' }), w('d', 'שתים', 11, 36, { font: 'f5' }),
      w('e', 'לפניה', 12, 40, { font: 'f2' }), w('f', 'ואחת', 12, 36, { font: 'f3', stopAfter: '.' }),
      w('g', 'פירוש', 12, 32),
    ];
    const dh = extractDibburim(hs);
    expect(dh.map((p) => p.words.map((x) => x.word).join(' '))).toContain('מברך שתים לפניה ואחת');
  });

  it('drops an opening after ":" that never reaches a "."', () => {
    const hs = [w('a', 'סוף', 10, 30, { stopAfter: ':' }), w('b', 'מלה', 11, 30), w('c', 'עוד', 11, 26, { stopAfter: ':' })];
    expect(extractDibburim(hs).length).toBe(0);
  });
});
