// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks } from '@/talmud/utils/dibburHamatchilMatcher';
import { healLostNun } from '@/talmud/utils/legacyHebrewFont';

let n = 0;
const row = (section: string, words: Array<[string, string, ('.' | ':')?]>, top: number) =>
  words.map(([word, font, stopAfter], i) => ({
    id: `${section}-${n++}`,
    word,
    section,
    rowId: `${section}-${top}`,
    leftPct: 90 - i * 8,
    topPct: top,
    widthPct: 7.5,
    heightPct: 1,
    glyphH: 11,
    font,
    stopAfter,
  }));
const gem = (words: string[]) => row('gemara', words.map((w) => [w, 'GEM'] as [string, string]), 10);

describe('typeface-driven dibbur hamatchil', () => {
  it('links a one-word opening to the Gemara', () => {
    const g = gem(['מאימתי', 'קורין', 'את', 'שמע']);
    const r = row('rashi', [['מאימתי', 'RASHI_DH', '.'], ['פירוש', 'BODY'], ['הדבר', 'BODY', ':'], ['ועוד', 'BODY'], ['כאן', 'BODY']], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r]);
    expect(roles.get(g[0].id)?.rashi).toBeTruthy();
    expect(roles.get(r[1].id)).toBeUndefined();
  });

  it('the column, not the PDF font id, names the commentator', () => {
    const g = gem(['קורין', 'את', 'שמע', 'בערבין']);
    // Two Tosafot entries in square type; one was misplaced into the Rashi column by the zone rules.
    const t = row('tosafot', [['קורין', 'TOS_DH', '.'], ['גוף', 'BODY', ':'], ['שמע', 'TOS_DH', '.'], ['גוף', 'BODY'], ['גוף', 'BODY'], ['והיינו', 'BODY'], ['דאמרינן', 'BODY']], 60);
    const stray = row('rashi', [['בערבין', 'TOS_DH', '.'], ['גוף', 'BODY'], ['גוף', 'BODY'], ['והיינו', 'BODY'], ['דאמרינן', 'BODY']], 70);
    const { roles } = buildDibburHamatchilLinks([...g, ...t, ...stray]);
    expect(roles.get(g[3].id)?.rashi).toBeTruthy();
    expect(roles.get(g[0].id)?.tosafot).toBeTruthy();
  });

  it('a word quoted by both Rashi and Tosafot is split green / bordeaux', () => {
    const g = gem(['מאימתי', 'קורין']);
    const r = row('rashi', [['מאימתי', 'RASHI_DH', '.'], ['גוף', 'BODY'], ['גוף', 'BODY'], ['והיינו', 'BODY'], ['דאמרינן', 'BODY']], 60);
    const t = row('tosafot', [['מאימתי', 'TOS_DH', '.'], ['גוף', 'BODY'], ['גוף', 'BODY'], ['והיינו', 'BODY'], ['דאמרינן', 'BODY']], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r, ...t]);
    expect(roles.get(g[0].id)).toMatchObject({ splitWord: true });
  });
});

describe('lost nun in Mac-Hebrew scans', () => {
  it('restores לפניה from "לפ יה"', () => {
    expect(healLostNun('שתים לפ יה ושתים')).toBe('שתים לפניה ושתים');
  });
});
