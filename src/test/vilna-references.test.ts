import { describe, expect, it, vi } from 'vitest';
import { detectSmallMarkerToken, canJoinMarkerFragments } from '../talmud/utils/referenceMarkerDetector';
import { findScrollParent, getTargetScrollTop, scrollToTarget } from '../talmud/utils/scrollToTarget';
import { findMarginGutters, normalizeVilnaX } from '../talmud/utils/vilnaColumnGutters';

describe('isolated Vilna markers', () => {
  it.each(['.1', '.2', '.3'])('recognizes mirrored Torah Or entry %s', (word) => {
    expect(detectSmallMarkerToken(word, 7.44, 'margin', { bodyFontHeight: 7.44, isEntryStart: true }).key).toBe(word.slice(1));
  });
  it('preserves the two separate raised vav indices instead of the malformed ו(ו token', () => {
    expect(canJoinMarkerFragments('ו(', 'ו', 'ו(ו')).toBe(false);
    expect(detectSmallMarkerToken('ו(', 7.44, 'gemara', { bodyFontHeight: 13.68 }).targetType).toBe('masoret');
    expect(detectSmallMarkerToken('ו(ו', 7.44, 'gemara', { bodyFontHeight: 13.68 }).isSmallMarker).toBe(false);
  });
  it('rejoins a split closing parenthesis for Bach without losing the marker', () => {
    expect(canJoinMarkerFragments('(א', ')', '(א)')).toBe(true);
  });
  it('rejects a small but baseline-aligned ordinary commentary letter', () => {
    expect(detectSmallMarkerToken('ו', 6.72, 'rashi', { bodyFontHeight: 11.94, isolated: true, raised: false }).isSmallMarker).toBe(false);
  });
  it('retains a genuinely raised isolated Ein Mishpat letter', () => {
    expect(detectSmallMarkerToken('ו', 7.44, 'gemara', { bodyFontHeight: 13.68, isolated: true, raised: true }).targetType).toBe('ein-mishpat');
  });
  it.each(['⦸', '⊙', '◐'])('recognizes circular %s as Gilyon', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara')).toMatchObject({ isSmallMarker: true, key: 'גליון', targetType: 'gilyon-hashas' });
  });
  it('recognizes superscript dalet relative to body text', () => {
    expect(detectSmallMarkerToken('ד', 9, 'gemara', { bodyFontHeight: 14 })).toMatchObject({ isSmallMarker: true, key: 'ד', targetType: 'ein-mishpat' });
  });
  it.each(['ב(', 'צ)', '(ק', 'ד('])('recognizes single-parenthesis %s', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').targetType).toBe('masoret');
  });
  it.each(['דברים', 'אמרו', 'כדי', 'ב', 'ד', ')דף', '(שם)', 'של)', '(לו)', 'כא.'])('leaves normal text %s untouched', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').isSmallMarker).toBe(false);
  });
  it('does not mark regular margin letters without entry context', () => {
    expect(detectSmallMarkerToken('ד', 12, 'margin').isSmallMarker).toBe(false);
  });
  it.each([['((א))', 'bach'], ['(א)', 'bach'], [')א(', 'bach'], ['[א]', 'gra'], [']א[', 'gra'], ['(1)', 'torah-or'], ['2', 'torah-or'], ['$', 'gilyon-hashas']])('routes %s', (word, type) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').targetType).toBe(type);
  });
  it('never marks a letter that belongs to an abbreviation such as (ויקרא כ"ב)', () => {
    expect(detectSmallMarkerToken('(ב', 5, 'rashi', { bodyFontHeight: 6.7, abbreviation: true }).isSmallMarker).toBe(false);
    expect(detectSmallMarkerToken('ב"', 5, 'rashi', { bodyFontHeight: 6.7 }).isSmallMarker).toBe(false);
  });
  it('marks a raised Torah Or numeral but not a body-size number', () => {
    expect(detectSmallMarkerToken('2', 7, 'gemara', { bodyFontHeight: 13.7 }).targetType).toBe('torah-or');
    expect(detectSmallMarkerToken('2', 13.7, 'gemara', { bodyFontHeight: 13.7 }).isSmallMarker).toBe(false);
  });
});

describe('Vilna margin gutters', () => {
  it('finds the side-column gaps on a larger-scale scan (Berakhot 2a layout)', () => {
    const boxes = [
      { leftPct: 9, rightPct: 19, topPct: 20 },
      { leftPct: 20, rightPct: 85.5, topPct: 20 },
      { leftPct: 86.5, rightPct: 96, topPct: 20 },
    ];
    const g = findMarginGutters(boxes);
    expect(g.left).toBeCloseTo(19.5, 0);
    expect(g.right).toBeCloseTo(86, 0);
    // A margin letter at 17.7% is margin; text just inside the gutter is main text.
    expect(normalizeVilnaX(17.7, g)).toBeLessThan(14);
    expect(normalizeVilnaX(21, g)).toBeGreaterThan(14);
  });
});

describe('transformed nested scroll navigation', () => {
  it('uses container scroll units, not scaled screen pixels', () => {
    const container = document.createElement('div');
    const target = document.createElement('div');
    container.style.overflowY = 'auto';
    container.append(target);
    document.body.append(container);
    for (const [key, value] of Object.entries({ clientHeight: 400, offsetHeight: 400, scrollHeight: 2000, scrollTop: 100, clientTop: 0 })) {
      Object.defineProperty(container, key, { configurable: true, value });
    }
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 800 } as DOMRect);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 900, height: 40 } as DOMRect);
    expect(findScrollParent(target)).toBe(container);
    expect(getTargetScrollTop(target, container)).toBe(342);
    container.remove();
  });
  it('ignores an outdated click when a newer target is requested', () => {
    vi.useFakeTimers();
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const a = vi.spyOn(first, 'getBoundingClientRect');
    const b = vi.spyOn(second, 'getBoundingClientRect');
    scrollToTarget(first);
    scrollToTarget(second);
    vi.runAllTimers();
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    first.remove(); second.remove();
    vi.useRealTimers();
  });
});