// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { alignPageWithSefaria } from '../talmud/utils/sefariaTextOverlay';

const hs = (words: string[], section = 'gemara', top = 10) =>
  words.map((w, i) => ({ cleanWord: w, word: w, section, topPct: top, leftPct: 90 - i * 5, heightPct: 1 }));

describe('Sefaria text overlay', () => {
  it('replaces noisy scan letters with the exact Sefaria word', () => {
    const page = hs(['מאימתי', 'קורין', 'את', 'שמע', 'בערבין']);
    page[4].cleanWord = 'בערכין'; // OCR noise: כ instead of ב
    const s = { id: 'g1', hebrewText: 'מאימתי קורין את שמע בערבין' };
    const m = alignPageWithSefaria(page, { mainText: [s], rashi: [], tosafot: [] });
    expect(m.find((x) => x.hotspotIndex === 4)?.cleanWord).toBe('בערבין');
    expect(m.length).toBe(5);
  });

  it('assigns each page word to the sentence it really belongs to, whatever the array order', () => {
    const page = hs(['תנו', 'רבנן', 'משעה', 'שהכהנים', 'טובלין', 'אמר', 'רבי', 'יוחנן', 'הלכה', 'כוותיה']);
    const late = { id: 'g2', hebrewText: 'אמר רבי יוחנן הלכה כוותיה' };
    const early = { id: 'g1', hebrewText: 'תנו רבנן משעה שהכהנים טובלין' };
    const m = alignPageWithSefaria(page, { mainText: [late, early], rashi: [], tosafot: [] });
    expect(m.find((x) => x.hotspotIndex === 2)?.sentence.id).toBe('g1');
    expect(m.find((x) => x.hotspotIndex === 7)?.sentence.id).toBe('g2');
  });

  it('never rewrites reference markers', () => {
    const page = [...hs(['מאימתי', 'קורין', 'את']), { ...hs(['א'])[0], isSmallMarker: true, leftPct: 70 }];
    const s = { id: 'g1', hebrewText: 'מאימתי קורין את א' };
    const m = alignPageWithSefaria(page, { mainText: [s], rashi: [], tosafot: [] });
    expect(m.some((x) => x.hotspotIndex === 3)).toBe(false);
  });
});
