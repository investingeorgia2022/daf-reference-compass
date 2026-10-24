// @ts-nocheck
// TEMPORARY: user-provided version. Previous version backed up.
export function renderDynamicVilnaDafToCanvas(..._args: any[]) {
  return [];
}

export function tintCitationHotspotsBlueOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hotspots: any[],
  citSet: Set<string>
) {
  if (!ctx || !hotspots || !citSet) return;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#1D4ED8';

  for (const h of hotspots) {
    if (citSet.has(h.id) || h.isSmallMarker) {
      const x = ((h.inkLeftPct || h.leftPct) / 100) * width;
      const y = ((h.inkTopPct || h.topPct) / 100) * height;
      const w = ((h.inkWidthPct || h.widthPct) / 100) * width;
      const hPx = ((h.inkHeightPct || h.heightPct) / 100) * height;
      ctx.fillRect(x - 2, y - 2, w + 4, hPx + 4);
    }
  }

  ctx.restore();
}
