import { describe, expect, it } from 'vitest';
import {
  DAF_PDF_CACHE_LIMIT,
  isPdfBuffer,
  readCachedDafPdf,
  selectPdfCacheEvictions,
  writeCachedDafPdf,
} from '../talmud/utils/dafPdfCache';

const pdfBytes = () => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]).buffer;
const htmlBytes = () => new TextEncoder().encode('<!DOCTYPE html><html></html>').buffer;

describe('stored daf scans', () => {
  it('accepts only bytes that really start with the PDF signature', () => {
    expect(isPdfBuffer(pdfBytes())).toBe(true);
    expect(isPdfBuffer(htmlBytes())).toBe(false);
    expect(isPdfBuffer(new ArrayBuffer(0))).toBe(false);
    expect(isPdfBuffer(null)).toBe(false);
  });

  it('never hands a stored HTML fallback back to the reader as a scan', async () => {
    await expect(readCachedDafPdf('/api/talmud/vilna-pdf?tractate=Berakhot&daf=2a')).resolves.toBeNull();
  });

  it('keeps the newest scans and drops the oldest once the cache is full', () => {
    const entries = Array.from({ length: DAF_PDF_CACHE_LIMIT + 3 }, (_, i) => ({
      url: `daf-${i}`,
      savedAt: 1000 + i,
    }));
    expect(selectPdfCacheEvictions(entries)).toEqual(['daf-0', 'daf-1', 'daf-2']);
    expect(selectPdfCacheEvictions(entries.slice(0, DAF_PDF_CACHE_LIMIT))).toEqual([]);
  });

  it('refuses to store a non-PDF payload and still never throws', async () => {
    await expect(writeCachedDafPdf('daf-x', htmlBytes())).resolves.toBeUndefined();
  });
});

describe('offline daf database', () => {
  it('never evicts dafim saved on purpose, even far past the limit', async () => {
    const { selectPdfCacheEvictions: pick } = await import('../talmud/utils/dafPdfCache');
    const pinned = Array.from({ length: 200 }, (_, i) => ({ url: `p-${i}`, savedAt: i, pinned: true }));
    const loose = Array.from({ length: DAF_PDF_CACHE_LIMIT + 1 }, (_, i) => ({ url: `l-${i}`, savedAt: 500 + i }));
    expect(pick([...pinned, ...loose])).toEqual(['l-0']);
  });

  it('reads the tractate back from a saved scan address', async () => {
    const { talmudDafPdfUrl, tractateFromDafPdfUrl } = await import('../talmud/utils/dafPdfCache');
    expect(tractateFromDafPdfUrl(talmudDafPdfUrl('Bava_Kamma', '12b'))).toBe('Bava_Kamma');
    expect(tractateFromDafPdfUrl('/chumash-pdf/Genesis-1.pdf')).toBeNull();
  });
});
