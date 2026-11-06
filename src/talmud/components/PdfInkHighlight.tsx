// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { maskPrintedInk } from '../utils/pdfInkMask';

/** Small, transparent glyph masks avoid another full-page canvas allocation. */
export function PdfInkHighlight({ baseCanvasRef, spots, focusedIds }) {
  const [tile, setTile] = useState(null);
  useEffect(() => {
    const update = (event) => {
      if (event.detail?.base === baseCanvasRef.current) setTile(event.detail);
    };
    window.addEventListener('talmud-sharp-tile-painted', update);
    return () => window.removeEventListener('talmud-sharp-tile-painted', update);
  }, [baseCanvasRef]);
  return <div className="absolute inset-0 pointer-events-none z-40" aria-hidden="true">
    {spots.map((spot) => <InkWord key={spot.id} spot={spot} baseCanvasRef={baseCanvasRef} tile={tile} focused={focusedIds?.has(spot.id)} />)}
  </div>;
}

function InkWord({ spot, baseCanvasRef, tile, focused }) {
  const ref = useRef(null);
  const left = spot.inkLeftPct ?? spot.leftPct;
  const top = spot.inkTopPct ?? (spot.topPct + spot.heightPct * 0.22);
  const width = spot.inkWidthPct ?? spot.widthPct;
  const height = spot.inkHeightPct ?? spot.heightPct * 0.8;
  useEffect(() => {
    const canvas = ref.current;
    const base = baseCanvasRef.current;
    if (!canvas || !base?.width) return;
    const r = tile?.rect;
    const inside = r && left >= r.l * 100 && top >= r.t * 100 && left + width <= (r.l + r.w) * 100 && top + height <= (r.t + r.h) * 100;
    const source = inside ? tile.canvas : base;
    const sx = (inside ? (left / 100 - r.l) / r.w : left / 100) * source.width;
    const sy = (inside ? (top / 100 - r.t) / r.h : top / 100) * source.height;
    const sw = width / 100 * source.width / (inside ? r.w : 1);
    const sh = height / 100 * source.height / (inside ? r.h : 1);
    canvas.width = Math.max(1, Math.ceil(sw));
    canvas.height = Math.max(1, Math.ceil(sh));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    maskPrintedInk(image.data);
    ctx.putImageData(image, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue(focused ? '--reference-focus-gold' : '--reference-target-ink').trim();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (focused) ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }, [baseCanvasRef, tile, spot, left, top, width, height, focused]);
  return <canvas ref={ref} data-daf-ink-highlight={spot.id} data-focused-ink={focused ? 'true' : undefined}
    className="absolute pointer-events-none"
    style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }} />;
}