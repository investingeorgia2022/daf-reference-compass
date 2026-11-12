// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { assignPrintedSections } from '@/talmud/utils/vilnaCommentaryStreams';

// Runs in the scan's content-stream order. Rashi: body f5 + openings f4; Tosafot: body f5 +
// openings f12 and a large initial f9; Gemara in its own body type.
const r = (str, pdfH, font, topPct = 40) => ({ str, pdfH, font, topPct, section: 'gemara' });

const page = () => [
  r('מסכת', 20, 'title', 2),
  r('אישתבועי למה ליה', 11.4, 'f4'),
  r('גוף פירוש רש"י', 11.2, 'f5'),
  r('דלא מיעצר', 11.4, 'f4'),
  r('עוד פירוש רש"י', 11.2, 'f5'),
  // Rashi's last full-width line under the Gemara, reaching into the other half of the page
  r('והרי יש כאן חמשה', 11.2, 'f5', 80),
  r('בימות', 16.4, 'f9', 6),
  r('החמה אמר משיב הרוח', 11.9, 'f12', 6),
  r('גוף תוספות', 11.2, 'f5'),
  r('גילהי דליליא', 11.9, 'f12', 75),
  r('פירוש תוספות', 11.2, 'f5', 75),
  r('דלא מיעצר וכי מאחר', 13.7, 'f19'),
  r('דלא מיעצר עוד גמרא', 13.7, 'f19'),
];

describe('Rashi / Tosafot from text streams, not page position', () => {
  it('keeps every Rashi run Rashi up to the first Tosafot opening, wherever it is printed', () => {
    const runs = page();
    assignPrintedSections(runs);
    expect(runs.slice(1, 6).map((x) => x.section)).toEqual(['rashi', 'rashi', 'rashi', 'rashi', 'rashi']);
  });

  it('gives Tosafot its large initial, openings and body', () => {
    const runs = page();
    assignPrintedSections(runs);
    expect(runs.slice(6, 11).map((x) => x.section)).toEqual(['tosafot', 'tosafot', 'tosafot', 'tosafot', 'tosafot']);
  });

  it('labels the Gemara by its body type and the title as header', () => {
    const runs = page();
    assignPrintedSections(runs);
    expect(runs[0].section).toBe('header');
    expect(runs.slice(11).map((x) => x.section)).toEqual(['gemara', 'gemara']);
  });

  it('treats a page with a single commentary stream as Rashi', () => {
    const runs = [r('דלא מיעצר', 11.4, 'f4'), r('גוף', 11.2, 'f5'), r('ועוד', 11.4, 'f4'), r('גוף', 11.2, 'f5'), r('גמרא כאן', 13.7, 'f19')];
    assignPrintedSections(runs);
    expect(runs.slice(0, 4).every((x) => x.section === 'rashi')).toBe(true);
  });
});

describe('chapter-opening Rashi word in square type', () => {
  it('a lone main-type word leading into Rashi script belongs to Rashi', async () => {
    const { assignPrintedSections } = await import('@/talmud/utils/vilnaCommentaryStreams');
    const runs: any[] = [
      { section: 'gemara', pdfH: 14, str: 'מאימתי', font: 'F1' },
      { section: 'gemara', pdfH: 10.5, str: 'מזכירין גבורות גשמים. מדקתני', font: 'F2' },
      { section: 'gemara', pdfH: 10.5, str: 'בגבורה כלומר שמשבחין:', font: 'F2' },
      ...Array.from({ length: 6 }, () => ({ section: 'gemara', pdfH: 14, str: 'מאימתי מזכירין גבורות גשמים רבי אליעזר אומר', font: 'F1' })),
    ];
    assignPrintedSections(runs);
    expect(runs[0].section).toBe('rashi');
    expect(runs[3].section).toBe('gemara');
  });
});
