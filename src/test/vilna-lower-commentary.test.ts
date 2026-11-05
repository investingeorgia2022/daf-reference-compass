// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { assignFullWidthCommentaryRows } from '@/talmud/utils/vilnaLowerCommentary';

const run = (section, topPct, centerPct, pdfH = 10.5) => ({ section, topPct, centerPct, pdfH });

describe('full-width commentary below the Gemara', () => {
  it('gives the whole line to Tosafot when Rashi has already ended', () => {
    const runs = [
      run('gemara', 45, 47, 13.5),
      run('rashi', 55, 70),
      run('tosafot', 62, 25),
      // full-width line at 66%: side rules had split it into rashi / gemara / tosafot
      run('rashi', 66, 72),
      run('gemara', 66, 47),
      run('tosafot', 66, 22),
    ];
    assignFullWidthCommentaryRows(runs);
    expect(runs.slice(3).map((r) => r.section)).toEqual(['tosafot', 'tosafot', 'tosafot']);
  });

  it('gives the line to Rashi when Rashi is the column that continues', () => {
    const runs = [run('gemara', 45, 47, 13.5), run('tosafot', 50, 25), run('rashi', 60, 70), run('tosafot', 64, 30), run('gemara', 64, 47)];
    assignFullWidthCommentaryRows(runs);
    expect(runs[3].section).toBe('rashi');
    expect(runs[4].section).toBe('rashi');
  });

  it('leaves the Gemara itself untouched', () => {
    const runs = [run('gemara', 45, 47, 13.5), run('rashi', 40, 70)];
    assignFullWidthCommentaryRows(runs);
    expect(runs[0].section).toBe('gemara');
  });
});
