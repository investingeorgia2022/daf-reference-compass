import { describe, expect, it } from 'vitest';
import { hasAuthenticVilnaScan } from '@/talmud/components/VilnaPdfInteractiveViewer';
import { bestSnippetMatch } from '@/talmud/components/CitedDafTextView';

describe('cited daf source window', () => {
  it('does not treat Megillah 20b as having a printed scan (no substitute page)', () => {
    expect(hasAuthenticVilnaScan('Megillah', '20b')).toBe(false);
  });

  it('has no bundled scans after the daf reset', () => {
    expect(hasAuthenticVilnaScan('Berakhot', '2a')).toBe(false);
  });

  it('highlights the passage matching the cited phrase', () => {
    const s = (id: string, hebrewText: string) => ({ id, hebrewText }) as never;
    const list = [s('a', 'אין קורין את המגילה'), s('b', 'כל הלילה כשר לקצירת העומר ולהקטר חלבים')];
    expect(bestSnippetMatch(list, 'כל הלילה כשר לקצירת העומר')).toBe(1);
  });
});
