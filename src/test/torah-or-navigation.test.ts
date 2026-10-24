import { describe, expect, it } from 'vitest';
import { getTorahOrEntryHotspots, getTorahOrSentenceId } from '../talmud/utils/torahOrNavigation';

const spots = [
  { word: 'תורה אור השלם', section: 'margin', marginCommType: 'torah-or', topPct: 18, leftPct: 9 },
  { word: '.1', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '1', topPct: 19, leftPct: 18 },
  { word: 'ושננתם', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '1', topPct: 19, leftPct: 9 },
  { word: 'דברים ו ז', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '1', topPct: 21, leftPct: 9 },
  { word: '.2', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '2', topPct: 22, leftPct: 18 },
  { word: 'ויהי ערב', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '2', topPct: 23, leftPct: 9 },
  { word: 'בראשית א ה', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '2', topPct: 24, leftPct: 9 },
  { word: 'ויקרא כב ז', section: 'margin', marginCommType: 'torah-or', marginEntryKey: '3', topPct: 27, leftPct: 9 },
];

describe('exact Torah Or quotation navigation', () => {
  it.each([['1', 'דברים ו ז'], ['2', 'בראשית א ה'], ['3', 'ויקרא כב ז']])('number %s targets its own biblical quotation', (key, reference) => {
    const entry = getTorahOrEntryHotspots(spots, key, 'left');
    expect(entry.at(-1)?.word).toBe(reference);
    expect(entry.every(s => s.marginEntryKey === key)).toBe(true);
  });
  it('retains the continuation rows, not just the number row', () => {
    expect(getTorahOrEntryHotspots(spots, '2', 'left').map(s => s.word)).toEqual(['.2', 'ויהי ערב', 'בראשית א ה']);
  });
  it('does not substitute a heading or another quotation for a missing entry', () => {
    expect(getTorahOrEntryHotspots(spots, '4', 'left')).toEqual([]);
  });
  it('does not use the opposite margin as an exact match', () => {
    expect(getTorahOrEntryHotspots(spots, '1', 'right')).toEqual([]);
  });
  it('uses the printed ordinal rather than treating arbitrary data IDs as numbers', () => {
    expect(getTorahOrSentenceId([{ id: 'deuteronomy' }, { id: 'genesis' }], '2')).toBe('torah-or-genesis');
  });
  it('keeps the zero-based fallback compatible with the commentary section IDs', () => {
    expect(getTorahOrSentenceId([{}], '1')).toBe('torah-or-0');
  });
});