import { describe, it, expect } from 'vitest';
import { getGilyonNoteByOrder } from '../talmud/utils/pdfMarkerNavigation';
import { getTorahOrEntryHotspots } from '../talmud/utils/torahOrNavigation';

const m = (word: string, topPct: number, extra: object = {}) => ({ section: 'margin', word, topPct, leftPct: 80, ...extra });

describe('margin navigation order', () => {
  it('the n-th Gilyon marker opens the n-th note ending with ":"', () => {
    const g = { marginCommType: 'gilyon-hashas' };
    const spots = [m('גליון', 1, g), m('גמ', 2, g), m('עיין:', 3, g), m('רש"י', 4, g), m('שם:', 5, g)];
    expect(getGilyonNoteByOrder(spots, 0, 'right').map(s => s.word)).toEqual(['גמ', 'עיין:']);
    expect(getGilyonNoteByOrder(spots, 1, 'right').map(s => s.word)).toEqual(['רש"י', 'שם:']);
  });

  it('a Torah Or entry includes its verse and source up to the next number', () => {
    const t = (word: string, top: number, key: string) => m(word, top, { marginCommType: 'torah-or', marginEntryKey: key });
    const spots = [t('4.', 10, '3'), t('תהלה', 10, '3'), t('שמך', 11, '3'), t('תהלים', 12, '4'), t('5.', 13, '4')];
    expect(getTorahOrEntryHotspots(spots, '4', 'right').map(s => s.word)).toEqual(['4.', 'תהלה', 'שמך', 'תהלים']);
  });
});
