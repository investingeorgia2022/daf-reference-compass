// @ts-nocheck
import type { VilnaPdfHotspot, MarginCommentaryType } from '../components/VilnaPdfInteractiveViewer';

/**
 * Tints ONLY the dark ink glyph pixels of citation/linked hotspots on a 2D canvas into crisp Royal Blue (#1D4ED8),
 * leaving all light paper/parchment background pixels 100% untouched (no background box!).
 */
export function tintCitationHotspotsBlueOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  hotspots: VilnaPdfHotspot[],
  citationHotspotIds: Set<string>
): void {
  if (!ctx || canvasWidth <= 0 || canvasHeight <= 0 || citationHotspotIds.size === 0) {
    return;
  }

  for (const h of hotspots) {
    if (!citationHotspotIds.has(h.id)) continue;

    // Markers have an enlarged tap area; tint only their exact glyph box so
    // neighbouring letters of regular words never turn blue.
    const L = h.inkLeftPct ?? h.leftPct;
    const T = h.inkTopPct ?? h.topPct;
    const W = h.inkWidthPct ?? h.widthPct;
    const H = h.inkHeightPct ?? h.heightPct;
    const rx = Math.max(0, Math.floor((L / 100) * canvasWidth));
    const ry = Math.max(0, Math.floor((T / 100) * canvasHeight));
    const rw = Math.min(canvasWidth - rx, Math.ceil((W / 100) * canvasWidth) + 1);
    const rh = Math.min(canvasHeight - ry, Math.ceil((H / 100) * canvasHeight) + 1);

    if (rw <= 1 || rh <= 1) continue;

    try {
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;

      for (let p = 0; p < data.length; p += 4) {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const a = data[p + 3];
        if (a < 30) continue;

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Only tint ink pixels (lum < 0.84); leave paper pixels (lum >= 0.84) 100% untouched!
        if (lum < 0.84) {
          const inkStrength = Math.min(1, (0.86 - lum) / 0.58);
          // Royal Blue ink (#1D4ED8 -> R:29, G:78, B:216)
          data[p] = Math.round(r * (1 - inkStrength) + 29 * inkStrength);
          data[p + 1] = Math.round(g * (1 - inkStrength) + 78 * inkStrength);
          data[p + 2] = Math.round(b * (1 - inkStrength) + 216 * inkStrength);
        }
      }

      ctx.putImageData(imgData, rx, ry);
    } catch {
      // Ignore cross-origin or bounds errors if any
    }
  }
}

export type InkRgb = [number, number, number];
export const RASHI_INK: InkRgb = [21, 128, 61]; // #15803d
export const TOSAFOT_INK: InkRgb = [159, 18, 57]; // #9f1239

/**
 * Recolours only ink pixels of the given hotspots. `split` paints the right
 * (reading-first) half with `first` and the left half with `second`.
 */
export function tintHotspotsInkOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  hotspots: VilnaPdfHotspot[],
  colors: Map<string, { first: InkRgb; second?: InkRgb }>
): void {
  if (!ctx || canvasWidth <= 0 || canvasHeight <= 0 || colors.size === 0) return;
  for (const h of hotspots) {
    const c = colors.get(h.id);
    if (!c) continue;
    // The word box includes line spacing above the letters; tinting it would recolour the
    // descenders of the line above. Paint only the word's own letter band.
    const rx = Math.max(0, Math.floor((h.leftPct / 100) * canvasWidth));
    const ry = Math.max(0, Math.round(((h.topPct + h.heightPct * 0.22) / 100) * canvasHeight));
    const rw = Math.min(canvasWidth - rx, Math.ceil((h.widthPct / 100) * canvasWidth) + 1);
    const rh = Math.min(canvasHeight - ry, Math.floor(((h.heightPct * 0.8) / 100) * canvasHeight));
    if (rw <= 1 || rh <= 1) continue;
    try {
      const img = ctx.getImageData(rx, ry, rw, rh);
      const d = img.data;
      const mid = rw / 2;
      for (let p = 0; p < d.length; p += 4) {
        if (d[p + 3] < 30) continue;
        const lum = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255;
        if (lum >= 0.84) continue;
        const x = (p / 4) % rw;
        const col = c.second && x < mid ? c.second : c.first;
        const s = Math.min(1, (0.86 - lum) / 0.58);
        d[p] = Math.round(d[p] * (1 - s) + col[0] * s);
        d[p + 1] = Math.round(d[p + 1] * (1 - s) + col[1] * s);
        d[p + 2] = Math.round(d[p + 2] * (1 - s) + col[2] * s);
      }
      ctx.putImageData(img, rx, ry);
    } catch {
      // ignore
    }
  }
}
