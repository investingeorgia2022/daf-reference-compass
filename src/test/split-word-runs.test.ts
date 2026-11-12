import { describe, it, expect } from 'vitest';
import { shouldJoinSplitWordRuns } from '@/talmud/utils/splitWordRuns';

const run = (str: string, vpLeft: number, vpWidth: number) => ({ str, vpLeft, vpWidth, vpHeight: 10, pdfH: 10, section: 'rashi' });

describe('split word runs', () => {
  it('joins touching fragments of one word (או + תו.)', () => {
    expect(shouldJoinSplitWordRuns(run('או', 100, 12), run('תו.', 88, 12))).toBe(true);
  });
  it('keeps separate words with a normal word gap apart', () => {
    expect(shouldJoinSplitWordRuns(run('או', 100, 12), run('תו', 84, 12))).toBe(false);
  });
  it('never joins across punctuation', () => {
    expect(shouldJoinSplitWordRuns(run('או.', 100, 12), run('תו', 88, 12))).toBe(false);
  });
});
