import { describe, expect, it, vi } from 'vitest';
import { detectSmallMarkerToken } from '../talmud/utils/referenceMarkerDetector';
import { findScrollParent, getTargetScrollTop, scrollToTarget } from '../talmud/utils/scrollToTarget';

describe('isolated Vilna markers', () => {
  it.each(['⦸', '⊙', '◐'])('recognizes circular %s as Gilyon', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara')).toMatchObject({ isSmallMarker: true, key: 'גליון', targetType: 'gilyon-hashas' });
  });
  it('recognizes superscript dalet relative to body text', () => {
    expect(detectSmallMarkerToken('ד', 9, 'gemara', { bodyFontHeight: 14 })).toMatchObject({ isSmallMarker: true, key: 'ד', targetType: 'ein-mishpat' });
  });
  it.each(['ב(', 'צ)', '(ק', '(א)'])('recognizes single-parenthesis %s', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').targetType).toBe('masoret');
  });
  it.each(['דברים', 'אמרו', 'כדי', 'ב', 'ד'])('leaves normal text %s untouched', (word) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').isSmallMarker).toBe(false);
  });
  it('does not mark regular margin letters without entry context', () => {
    expect(detectSmallMarkerToken('ד', 12, 'margin').isSmallMarker).toBe(false);
  });
  it.each([['((א))', 'bach'], ['[א]', 'gra'], ['(1)', 'torah-or']])('routes %s', (word, type) => {
    expect(detectSmallMarkerToken(word, 12, 'gemara').targetType).toBe(type);
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