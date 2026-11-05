// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { buildDibburHamatchilLinks, wordsMatch, abbreviationSpan } from '@/talmud/utils/dibburHamatchilMatcher';
import { healLostNun, decodeLegacyHebrew } from '@/talmud/utils/legacyHebrewFont';

let n = 0;
type W = [string, string, ('.' | ':')?, ('"' | "'")?];
const row = (section: string, words: W[], top: number) =>
  words.map(([word, font, stopAfter, quoteAfter], i) => ({
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
    quoteAfter,
  }));
const body = (k: number): W[] => Array.from({ length: k }, () => ['פירושא', 'BODY'] as W);

describe('abbreviations between commentary and Gemara (Berakhot 3a)', () => {
  it("ר' matches רבי and דר' matches דרבי", () => {
    expect(wordsMatch("ר'", 'רבי')).toBe(true);
    expect(wordsMatch("דר'", 'דרבי')).toBe(true);
  });

  it('Gemara אדר"מ stands for Rashi\'s two words אדר\' מאיר', () => {
    expect(abbreviationSpan('אדר"מ', ["אדר'", 'מאיר', 'תרי'], 0)).toBe(2);
  });

  it('Rashi "קשיא דרבי מאיר אדר\' מאיר" links to Gemara "קשיא דר\' מאיר אדר"מ"', () => {
    const g = row('gemara', [['קשיא', 'G'], ['דר', 'G', undefined, "'"], ['מאיר', 'G'], ['אדר', 'G', undefined, '"'], ['מ', 'G'], ['תרי', 'G']], 10);
    const r = row('rashi', [['קשיא', 'R_DH'], ['דרבי', 'R_DH'], ['מאיר', 'R_DH'], ["אדר'", 'R_DH'], ['מאיר', 'R_DH', '.'], ...body(6)], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r]);
    for (const i of [0, 1, 2, 3, 4]) expect(roles.get(g[i].id)?.rashi).toBe('rashi:0');
    expect(roles.get(g[5].id)).toBeUndefined();
  });

  it('the quotation must start with the opening\'s first word, never its middle', () => {
    // Gemara has only "ר' אליעזר אי קסבר" — not "לאו ר' אליעזר היא".
    const g = row('gemara', [['ר', 'G', undefined, "'"], ['אליעזר', 'G'], ['אי', 'G'], ['קסבר', 'G']], 10);
    const r = row('rashi', [['לאו', 'R_DH'], ['ר', 'R_DH', undefined, "'"], ['אליעזר', 'R_DH'], ['היא', 'R_DH', '.'], ...body(6)], 60);
    const { links } = buildDibburHamatchilLinks([...g, ...r]);
    expect(links).toHaveLength(0);
  });

  it('an opening continuing onto the next Gemara line is still found', () => {
    const g = [
      ...row('gemara', [['ואב', 'G', undefined, '"'], ['א', 'G'], ['רישא', 'G'], ['לאו', 'G'], ['ר', 'G', undefined, "'"]], 10),
      ...row('gemara', [['אליעזר', 'G'], ['היא', 'G'], ['עד', 'G']], 12),
    ];
    const r = row('rashi', [['לאו', 'R_DH'], ['ר', 'R_DH', undefined, "'"], ['אליעזר', 'R_DH'], ['היא', 'R_DH', '.'], ...body(6)], 60);
    const { links } = buildDibburHamatchilLinks([...g, ...r]);
    expect(links).toHaveLength(1);
    expect(links[0].mainIds).toEqual([g[3].id, g[4].id, g[5].id, g[6].id]);
  });

  it('a word after ":" without a closing "." is not an opening', () => {
    const g = row('gemara', [['וקורא', 'G'], ['ושונה', 'G']], 10);
    const r = row('rashi', [['פירושא', 'BODY', ':'], ['וקורא', 'R_DH'], ['ושונה', 'BODY'], ...body(6)], 60);
    const { roles } = buildDibburHamatchilLinks([...g, ...r]);
    expect(roles.size).toBe(0);
  });
});

describe('lost nun next to quote marks', () => {
  it('keeps a lone abbreviation letter beside a quote mark apart', () => {
    expect(healLostNun('ש אימת כיון', { quoteAtStart: true })).toBe('ש אימת כיון');
    expect(healLostNun('רישא לאו ר', { quoteAtEnd: true })).toBe('רישא לאו ר');
  });

  it('never glues after a final letter, and a lone letter opens the next fragment (Berakhot 4a)', () => {
    expect(healLostNun('שהיה מכלים פ י מפיבשת')).toBe('שהיה מכלים פני מפיבשת');
    expect(healLostNun('שמו אלא ד יאל שמו')).toBe('שמו אלא דניאל שמו');
    expect(healLostNun('מה שא י עושה א י')).toBe('מה שאני עושה אני');
    expect(healLostNun('העבירה ת א היכא קאי')).toBe('העבירה תנא היכא קאי');
  });

  it('still restores נ inside the run', () => {
    expect(healLostNun('שתים לפ יה ושתים', { quoteAtStart: true, quoteAtEnd: true })).toBe('שתים לפניה ושתים');
  });

  it('a font printing נ as a control code keeps its spaces as word gaps', () => {
    // "משמרה ראשונה סימנא" in a Mac-Hebrew font whose נ is U+0005.
    expect(decodeLegacyHebrew('‡\u0005ÓÈÒ ‰\u0005Â˘‡¯ ‰¯Ó˘Ó')).toBe('משמרה ראשונה סימנא');
  });
});
