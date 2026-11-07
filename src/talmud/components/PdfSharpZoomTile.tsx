// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { tintCitationHotspotsBlueOnCanvas, tintHotspotsInkOnCanvas } from '../utils/pdfCitationTint';

/**
 * When the daf is zoomed, re-renders only the visible part of the PDF page as vector output at the
 * on-screen resolution and lays it over the base image, so text stays crisp up to 1000%.
 * The base canvas keeps a fixed size (mobile canvases cannot hold a whole page at 10x).
 */
interface Props {
  baseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  pageRef: React.MutableRefObject<any>;
  tintRef: React.MutableRefObject<{ parsed: any[]; citSet: Set<string>; dhColors: Map<string, any> } | null>;
  filter?: string;
  renderKey: string;
}

type Rect = { l: number; t: number; w: number; h: number };

const MAX_TILE_PX = 4_000_000;

export const PdfSharpZoomTile: React.FC<Props> = ({ baseCanvasRef, pageRef, tintRef, filter, renderKey }) => {
  const tileRef = useRef<HTMLCanvasElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const scaleRef = useRef(1);
  const taskRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (tileRef.current) tileRef.current.style.display = 'none';
    setRect(null);
    window.dispatchEvent(new CustomEvent('talmud-sharp-tile-painted', { detail: { base: baseCanvasRef.current } }));
  }, [renderKey]);

  useEffect(() => {
    const render = async () => {
      const base = baseCanvasRef.current;
      const page = pageRef.current;
      const tile = tileRef.current;
      if (!base || !page || !tile) return;
      const box = base.getBoundingClientRect();
      const onScreenRatio = box.width / Math.max(1, base.offsetWidth);
      if (scaleRef.current < 2.5) {
        tile.style.display = 'none';
        setRect(null);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const x0 = Math.max(box.left, 0);
      const y0 = Math.max(box.top, 0);
      const x1 = Math.min(box.right, vw);
      const y1 = Math.min(box.bottom, vh);
      if (x1 <= x0 || y1 <= y0 || box.width <= 0) return;
      const r: Rect = {
        l: (x0 - box.left) / box.width,
        t: (y0 - box.top) / box.height,
        w: (x1 - x0) / box.width,
        h: (y1 - y0) / box.height,
      };
      const isTouch = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
      const dpr = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 3);
      let pxW = (x1 - x0) * dpr;
      let pxH = (y1 - y0) * dpr;
      const area = pxW * pxH;
      const maxPx = isTouch ? 2_000_000 : MAX_TILE_PX;
      if (area > maxPx) {
        const k = Math.sqrt(maxPx / area);
        pxW *= k;
        pxH *= k;
      }
      const vp1 = page.getViewport({ scale: 1 });
      const scale = pxW / (r.w * vp1.width);
      const viewport = page.getViewport({ scale });
      const seq = ++seqRef.current;
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(pxW));
      off.height = Math.max(1, Math.floor(pxH));
      const ctx = off.getContext('2d', isTouch ? { willReadFrequently: true } : undefined);
      const freeOff = () => { off.width = 0; off.height = 0; };
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, off.width, off.height);
      try {
        taskRef.current?.cancel?.();
      } catch {
        // ignore
      }
      try {
        const task = page.render({
          canvasContext: ctx,
          viewport,
          canvas: off,
          transform: [1, 0, 0, 1, -r.l * viewport.width, -r.t * viewport.height],
        });
        taskRef.current = task;
        await task.promise;
      } catch {
        freeOff();
        return;
      }
      if (seq !== seqRef.current) { freeOff(); return; }
      const tint = tintRef.current;
      if (tint) {
        // Same ink colours as the base image, mapped into the tile's coordinates.
        const map = (h: any) => {
          const fx = (v: number) => ((v / 100 - r.l) / r.w) * 100;
          const fy = (v: number) => ((v / 100 - r.t) / r.h) * 100;
          const out = {
            ...h,
            leftPct: fx(h.leftPct),
            topPct: fy(h.topPct),
            widthPct: h.widthPct / r.w,
            heightPct: h.heightPct / r.h,
          };
          if (h.inkLeftPct != null) out.inkLeftPct = fx(h.inkLeftPct);
          if (h.inkTopPct != null) out.inkTopPct = fy(h.inkTopPct);
          if (h.inkWidthPct != null) out.inkWidthPct = h.inkWidthPct / r.w;
          if (h.inkHeightPct != null) out.inkHeightPct = h.inkHeightPct / r.h;
          return out;
        };
        const visible = tint.parsed
          .filter((h) => h.leftPct + h.widthPct >= r.l * 100 && h.leftPct <= (r.l + r.w) * 100 &&
            h.topPct + h.heightPct >= r.t * 100 && h.topPct <= (r.t + r.h) * 100)
          .map(map);
        try {
          tintCitationHotspotsBlueOnCanvas(ctx, off.width, off.height, visible, tint.citSet);
          tintHotspotsInkOnCanvas(ctx, off.width, off.height, visible, tint.dhColors);
        } catch {
          // ignore
        }
      }
      // Position the tile in the same frame as its new pixels, so it never shows at the old spot.
      tile.style.left = `${r.l * 100}%`;
      tile.style.top = `${r.t * 100}%`;
      tile.style.width = `${r.w * 100}%`;
      tile.style.height = `${r.h * 100}%`;
      tile.width = off.width;
      tile.height = off.height;
      tile.getContext('2d')?.drawImage(off, 0, 0);
      tile.style.opacity = '0';
      tile.style.display = 'block';
      requestAnimationFrame(() => { if (tileRef.current === tile) tile.style.opacity = '1'; });
      freeOff();
      setRect(r);
      window.dispatchEvent(new CustomEvent('talmud-sharp-tile-painted', { detail: { base, canvas: tile, rect: r } }));
    };

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(render, 320);
    };
    const onZoom = (e: Event) => {
      const s = (e as CustomEvent).detail?.scale;
      if (typeof s === 'number') scaleRef.current = s;
      if (tileRef.current) tileRef.current.style.display = 'none';
      setRect(null);
      window.dispatchEvent(new CustomEvent('talmud-sharp-tile-painted', { detail: { base: baseCanvasRef.current } }));
      schedule();
    };
    const onMove = () => {
      if (scaleRef.current >= 2.5) schedule();
    };
    // While a pinch is in progress the tile would show a stale area; hide it at once.
    const onPinchMove = (e: TouchEvent) => {
      const tile = tileRef.current;
      if (tile && tile.style.display !== 'none') tile.style.display = 'none';
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    };
    window.addEventListener('touchmove', onPinchMove, { passive: true });
    const onMouseDrag = (e: MouseEvent) => { if (e.buttons) onPinchMove(e as any); };
    window.addEventListener('mousemove', onMouseDrag);
    window.addEventListener('talmud-zoom-state-change', onZoom);
    window.addEventListener('touchend', onMove, { passive: true });
    window.addEventListener('mouseup', onMove);
    window.addEventListener('wheel', onMove, { passive: true });
    window.addEventListener('scroll', onMove, { passive: true, capture: true });
    window.addEventListener('resize', onMove);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('talmud-zoom-state-change', onZoom);
      window.removeEventListener('touchend', onMove);
      window.removeEventListener('touchmove', onPinchMove);
      window.removeEventListener('mousemove', onMouseDrag);
      window.removeEventListener('mouseup', onMove);
      window.removeEventListener('wheel', onMove);
      window.removeEventListener('scroll', onMove, { capture: true } as any);
      window.removeEventListener('resize', onMove);
    };
  }, [baseCanvasRef, pageRef, tintRef, renderKey]);

  return (
    <canvas
      ref={tileRef}
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{
        display: rect ? 'block' : 'none',
        left: rect ? `${rect.l * 100}%` : 0,
        top: rect ? `${rect.t * 100}%` : 0,
        width: rect ? `${rect.w * 100}%` : 0,
        height: rect ? `${rect.h * 100}%` : 0,
        filter,
        transition: 'opacity 160ms ease-out',
      }}
    />
  );
};
