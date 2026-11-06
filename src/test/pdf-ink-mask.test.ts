import { describe, expect, it } from 'vitest';
import { maskPrintedInk } from '../talmud/utils/pdfInkMask';

describe('letter-only destination highlights', () => {
  it('leaves white and light paper completely transparent', () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 240, 235, 220, 255]);
    maskPrintedInk(pixels);
    expect([pixels[3], pixels[7]]).toEqual([0, 0]);
  });
  it('retains dark printed letters and never fills transparent pixels', () => {
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 20, 20, 20, 0]);
    maskPrintedInk(pixels);
    expect([pixels[3], pixels[7]]).toEqual([255, 0]);
  });
});