// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks, wordsMatch } from '@/talmud/utils/dibburHamatchilMatcher';

let n = 0;
const row = (section: string, words: Array<[string, string, ('.' | ':')?]>, top: number) =>
  words.map(([word, font, stopAfter], i) => ({
    id: `${section}-${n++}`, word, section, rowId: `${section}-${top}`,
    leftPct: 90 - i * 6, topPct: top, widthPct: 5.5, heightPct: 1, glyphH: 11, font, stopAfter,
  }));
const body = (): Array<[string, string, ('.' | ':')?]> => [['גוף', 'BODY'], ['גוף', 'BODY'], ['והיינו', 'BODY'], ['דאמרינן', 'BODY'], ['ומסתברא', 'BODY'], ['כדפרישית', 'BODY'], ['לעיל', 'BODY', ':']];

describe('word-level Rashi/Tosafot state', () => {
  it("Tosafot וכו׳ starting where Rashi starts covers Rashi's whole quotation", () => {
    const g = row('gemara', ['מאימתי', 'קורין', 'את', 'שמע', 'בערבין', 'משעה'].map((w) => [w, 'GEM']), 10);
    const r = row('rashi', [['מאימתי', 'R', ''], ['קורין', 'R'], ['את', 'R'], ['שמע', 'R'], ['בערבין', 'R', '.'], ...body()], 60);
    const t = row('tosafot', [['מאימתי', 'T'], ['קורין', 'T'], ['וכו', 'T', '.'], ...body()], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r, ...t]);
    for (let i = 0; i < 5; i++) expect(roles.get(g[i].id)?.splitWord).toBe(true);
    expect(roles.get(g[5].id)).toBeUndefined();
  });

  it('without וכו׳ only the shared words are split; the rest stay Rashi-only', () => {
    const g = row('gemara', ['מאימתי', 'קורין', 'את', 'שמע'].map((w) => [w, 'GEM']), 10);
    const r = row('rashi', [['מאימתי', 'R'], ['קורין', 'R'], ['את', 'R'], ['שמע', 'R', '.'], ...body()], 60);
    const t = row('tosafot', [['מאימתי', 'T'], ['קורין', 'T', '.'], ...body()], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r, ...t]);
    expect(roles.get(g[1].id)?.splitWord).toBe(true);
    expect(roles.get(g[2].id)?.splitWord).toBeFalsy();
    expect(roles.get(g[3].id)?.rashi).toBeTruthy();
  });

  it('a repeated phrase goes to the next free occurrence for the same commentator', () => {
    const g = row('gemara', ['עד', 'שיעלה', 'עמוד', 'השחר', 'מצותן', 'עד', 'שיעלה', 'עמוד', 'השחר'].map((w) => [w, 'GEM']), 10);
    const r1 = row('rashi', [['עד', 'R'], ['שיעלה', 'R'], ['עמוד', 'R'], ['השחר', 'R', '.'], ...body()], 60);
    const r2 = row('rashi', [['עד', 'R'], ['שיעלה', 'R'], ['עמוד', 'R'], ['השחר', 'R', '.'], ...body()], 62);
    const { links } = buildDibburHamatchilLinks([...g, ...r1, ...r2]);
    expect(links[0].mainIds[0]).toBe(g[0].id);
    expect(links[1].mainIds[0]).toBe(g[5].id);
  });

  it('words of two letters or more never match by substituting letters', () => {
    expect(wordsMatch('ודומו', 'ואומר')).toBe(false);
    expect(wordsMatch('ודומו', 'ורומו')).toBe(false);
    expect(wordsMatch('שמע', 'בית')).toBe(false);
    expect(wordsMatch('ודומו', 'ודומו')).toBe(true);
  });

  it('any reference marker inside a quotation is transparent', async () => {
    const { isInlineMarker, stripGluedMarker } = await import('../talmud/utils/dibburHamatchilMatcher');
    for (const m of ['ג)', '(ד)', '[א]', '7', '⊙', '(ב']) expect(isInlineMarker(m)).toBe(true);
    expect(isInlineMarker('אמר')).toBe(false);
    expect(stripGluedMarker('ב)איזהו')).toBe('איזהו');
  });
});
