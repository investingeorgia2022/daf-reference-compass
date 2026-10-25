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
