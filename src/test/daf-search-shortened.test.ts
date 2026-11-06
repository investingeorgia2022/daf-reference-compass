import { describe, it, expect } from 'vitest';
import { searchDaf } from '@/talmud/utils/dafSearch';

const spots = ['רבא', "ר'", 'רץ', 'ורבא', 'רבי'].map((word, i) => ({
  id: String(i), word, section: 'gemara', topPct: i, leftPct: 1, heightPct: 1, widthPct: 1,
}));

describe('daf search shortened words', () => {
  it("רבא never matches ר' or רץ", () => {
    expect(searchDaf(spots, 'רבא').map((h) => h.match).sort()).toEqual(['ורבא', 'רבא']);
  });
  it("רבי still finds ר'", () => {
    expect(searchDaf(spots, 'רבי').map((h) => h.match)).toContain("ר'");
  });
});
