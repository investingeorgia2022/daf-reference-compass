import { describe, it, expect } from 'vitest';
import { decodeLegacyHebrew } from '../talmud/utils/legacyHebrewFont';

describe('legacy Vilna font decoding', () => {
  it('decodes Windows-1255 style Rashi runs into reading order', () => {
    expect(decodeLegacyHebrew('øîà éî')).toBe('מי אמר');
  });
  it('decodes Mac Hebrew style headings', () => {
    expect(decodeLegacyHebrew('ÔÈ˘„˜ÂÓ‰ ÈÏÂÒÙ ÏÎ')).toBe('כל פסולי המוקדשין');
  });
  it('leaves real Unicode Hebrew untouched', () => {
    expect(decodeLegacyHebrew('לאחזוקינהו.')).toBe('לאחזוקינהו.');
  });
});
