// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { searchDaf } from '../talmud/utils/dafSearch';
import { decodeLatinVerseText, decodeLegacyHebrewItems } from '../talmud/utils/legacyHebrewFont';

const spot = (id: string, word: string, section: string, i: number, quoteAfter?: string) => ({
  id, word, section, topPct: 10, leftPct: 90 - i * 5, heightPct: 1, widthPct: 4, quoteAfter,
});

describe('daf search', () => {
  const spots = [
    ...['דאמר', 'ר', 'יוחנן', 'איזהו', 'בן', 'העולם', 'הבא'].map((w, i) => spot(`g${i}`, w, 'mishnah', i, w === 'ר' ? "'" : undefined)),
    ...['קריאת', 'שמע', 'של', 'ערבית'].map((w, i) => spot(`t${i}`, w, 'tosafot', i)),
  ];
  it('finds רבי for the printed ר׳', () => {
    expect(searchDaf(spots, 'רבי יוחנן איזהו')[0].ids).toEqual(['g1', 'g2', 'g3']);
  });
  it('expands an abbreviation in the query: ק"ש finds קריאת שמע', () => {
    expect(searchDaf(spots, 'ק"ש')[0].ids).toEqual(['t0', 't1']);
  });
});

describe('scan text repair', () => {
  it('turns a control-code נ inside Unicode Hebrew into נ', () => {
    expect(decodeLegacyHebrewItems([{ str: 'יוח\u0015ן' }])[0].str).toBe('יוחנן');
  });
  it('decodes the Latin-encoded vowelled Torah Or verse font', () => {
    expect(decodeLatinVerseText('YxAce Lipal mYpPWe§')).toBe('ושננתם לבניך ודברת');
  });
});
