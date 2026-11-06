/** Keep only printed ink; transparent paper can never become a highlight box. */
export function maskPrintedInk(pixels: Uint8ClampedArray): void {
  for (let p = 0; p < pixels.length; p += 4) {
    const luminance = (0.299 * (pixels[p] ?? 255) + 0.587 * (pixels[p + 1] ?? 255) + 0.114 * (pixels[p + 2] ?? 255)) / 255;
    pixels[p + 3] = luminance >= 0.84 ? 0 : Math.round((pixels[p + 3] ?? 0) * Math.min(1, (0.86 - luminance) / 0.58));
  }
}