// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { WindowsWindowControls } from './WindowsWindowControls';
import { PageFlip3DWrapper } from './PageFlip3DWrapper';

export interface Talmud3DViewerProps {
  pageKey: string;
  direction: number; // 1 = next daf, -1 = prev daf, 0 = direct select
  isDark: boolean;
  showControlsAboveDaf?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onPrevAmud?: () => void;
  onNextAmud?: () => void;
  dafTitleLabel?: string;
  centerNavigationSelector?: React.ReactNode;
  extraToolbarControls?: React.ReactNode;
  belowToolbarDrawer?: React.ReactNode;
  children: React.ReactNode;
}

export const Talmud3DViewer: React.FC<Talmud3DViewerProps> = ({
  pageKey,
  direction,
  isDark,
  showControlsAboveDaf = true,
  isFullScreen = false,
  onToggleFullScreen,
  onPrevAmud,
  onNextAmud,
  dafTitleLabel,
  centerNavigationSelector,
  extraToolbarControls,
  belowToolbarDrawer,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isToolbarMinimized, setIsToolbarMinimized] = useState<boolean>(false);

  // Gesture & 3D Transform State (Fixed transform-origin to eliminate content jitter during pinch-zoom & pan)
  const [scale, setScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [tiltX, setTiltX] = useState<number>(0);
  const [tiltY, setTiltY] = useState<number>(0);
  const [is3DTiltActive, setIs3DTiltActive] = useState<boolean>(false);
  const [isPanDragEnabled, setIsPanDragEnabled] = useState<boolean>(true);
  const [isAreaZoomMode, setIsAreaZoomMode] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [showResetAfterRelease, setShowResetAfterRelease] = useState<boolean>(false);
  const [focusedAreaName, setFocusedAreaName] = useState<string | null>(null);

  // Content bounding-box clamping helper for smooth 1:1 pan & pinch-to-zoom without jitter
  const clampPanToContentBounds = useCallback(
    (rawX: number, rawY: number, targetScale: number): { x: number; y: number } => {
      const el = containerRef.current;
      const baseW = el?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 820);
      const baseH = el?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 1100);
      const scaledW = baseW * targetScale;
      const scaledH = baseH * targetScale;

      const maxX = Math.max(120, Math.round((scaledW - baseW) / 2 + baseW * 0.35));
      const maxYTop = Math.max(160, Math.round(baseH * 0.4));
      const maxYBottom = Math.max(240, Math.round(scaledH * 0.95));

      return {
        x: Math.round(Math.max(-maxX, Math.min(maxX, rawX)) * 10) / 10,
        y: Math.round(Math.max(-maxYBottom, Math.min(maxYTop, rawY)) * 10) / 10,
      };
    },
    []
  );

  // Track whether the current touch/mouse interaction moved the Daf so we block all other triggers
  const didMoveDafRef = useRef<boolean>(false);
  const lastMoveEndTimestampRef = useRef<number>(0);

  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startMidX: number;
    startMidY: number;
    startPanX: number;
    startPanY: number;
    containerCenterX: number;
    containerTopY: number;
  } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startPanX: number;
    startPanY: number;
    startScrollTop?: number;
    startTime: number;
    hadMultiTouch?: boolean;
    isDraggingWindow?: boolean;
  } | null>(null);

  // Live one-finger drag writes the transform straight to the DOM once per frame (no React re-render per touchmove).
  const transformElRef = useRef<HTMLDivElement | null>(null);
  const livePanRef = useRef<{ x: number; y: number } | null>(null);
  const panRafRef = useRef<number | null>(null);
  const applyLivePan = useCallback((x: number, y: number, s: number) => {
    livePanRef.current = { x, y };
    // Write synchronously: iOS Safari can defer rAF callbacks until the finger lifts.
    const el = transformElRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${s})`;
  }, []);

  const isZoomed = scale > 1.02 || isPanDragEnabled;

  const isTransformed =
    Math.abs(scale - 1) > 0.02 ||
    Math.abs(panX) > 4 ||
    Math.abs(panY) > 4 ||
    Math.abs(tiltX) > 0.5 ||
    Math.abs(tiltY) > 0.5;

  const resetTransform = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setTiltX(0);
    setTiltY(0);
    setIs3DTiltActive(false);
    setIsAreaZoomMode(false);
    setShowResetAfterRelease(false);
    setFocusedAreaName(null);
  }, []);

  // Reset zoom/pan when changing to a new Daf page
  useEffect(() => {
    resetTransform();
  }, [pageKey, resetTransform]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        delete document.body.dataset.talmudPanning;
      }
    };
  }, []);

  // Focus & zoom on a specific section of the Talmud Daf using smooth pan offset (no transformOrigin jump)
  const focusSpecificArea = (
    label: string,
    ox: number,
    oy: number,
    targetScale = 1.75,
    tx = 2,
    ty = 0
  ) => {
    if (focusedAreaName === label && scale > 1.1) {
      resetTransform();
      return;
    }
    const el = containerRef.current;
    const baseW = el?.clientWidth || 820;
    const baseH = el?.clientHeight || 1100;
    const targetPanX = ((50 - ox) / 100) * baseW * targetScale;
    const targetPanY = -(oy / 100) * baseH * (targetScale - 1);
    const clamped = clampPanToContentBounds(targetPanX, targetPanY, targetScale);
    setPanX(clamped.x);
    setPanY(clamped.y);
    setScale(targetScale);
    if (is3DTiltActive) {
      setTiltX(tx);
      setTiltY(ty);
    }
    setFocusedAreaName(label);
    setShowResetAfterRelease(true);
  };

  // Listen for direct jump-to-target events from small index markers (e.g. (א) -> הגהות הב"ח) or external reset requests
  useEffect(() => {
    const onFocusTargetPct = (e: Event) => {
      const detail = (e as CustomEvent<{ ox: number; oy: number; targetScale?: number; scrollHandled?: boolean; keepScale?: boolean }>).detail;
      if (!detail) return;
      // keepScale: only re-centre horizontally when the reader has already zoomed in.
      if (detail.keepScale && scale <= 1.02) return;
      if (detail.keepScale) detail.targetScale = scale;
      const ox = Math.max(2, Math.min(98, detail.ox));
      const oy = Math.max(2, Math.min(98, detail.oy));

      const el = containerRef.current;
      const baseW = el?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 820);
      const baseH = el?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 1100);
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : baseH;

      // Ensure smooth focus without jarring double-translation:
      // Vertical alignment is handled cleanly by container scrolling (scrollTop / window.scrollTo)
      // while horizontal pan smoothly centers the target column when zoomed.
      const hasZoom = typeof detail.targetScale === 'number' && detail.targetScale > 1.05;
      const nextScale = hasZoom ? Math.max(scale > 1.05 ? scale : 1.25, detail.targetScale || 1.25) : 1;
      const targetPanX = nextScale > 1.02 ? (0.5 - ox / 100) * baseW * nextScale : 0;
      const targetPanY = 0;

      const clamped = clampPanToContentBounds(targetPanX, targetPanY, nextScale);
      setPanX(clamped.x);
      setPanY(clamped.y);
      setScale(nextScale);
      if (nextScale > 1.02) {
        setShowResetAfterRelease(true);
      }

      // The PDF marker owns scrolling after this zoom transition settles.
      if (detail.scrollHandled) return;

      // Ensure the folio scrolls directly and accurately to the exact target line
      const folioEl = document.getElementById('talmud-daf-folio-anchor');
      const contentEl = containerRef.current;
      if (isFullScreen && folioEl && folioEl.scrollHeight > folioEl.clientHeight) {
        if (contentEl && folioEl.contains(contentEl)) {
          const fRect = folioEl.getBoundingClientRect();
          const cRect = contentEl.getBoundingClientRect();
          const targetY = folioEl.scrollTop + (cRect.top - fRect.top) + (oy / 100) * cRect.height;
          folioEl.scrollTo({ top: Math.max(0, targetY - folioEl.clientHeight * 0.42), behavior: 'smooth' });
        } else {
          const targetScroll = (oy / 100) * folioEl.scrollHeight - folioEl.clientHeight * 0.42;
          folioEl.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      } else if (typeof window !== 'undefined') {
        const targetContainer = contentEl || folioEl;
        if (targetContainer) {
          const rect = targetContainer.getBoundingClientRect();
          const targetDocY =
            window.scrollY +
            rect.top +
            (oy / 100) * rect.height -
            window.innerHeight * 0.42;
          window.scrollTo({ top: Math.max(0, targetDocY), behavior: 'smooth' });
        }
      }
    };
    const onExternalReset = () => {
      resetTransform();
    };
    const onZoomStep = (e: Event) => {
      const detail = (e as CustomEvent<{ delta?: number; scale?: number }>).detail;
      if (!detail) return;
      if (typeof detail.scale === 'number') {
        const next = Math.max(0.7, Math.min(10.0, detail.scale));
        setScale(next);
        if (next <= 1.02) {
          setPanX(0);
          setPanY(0);
        }
      } else if (typeof detail.delta === 'number') {
        setScale((prev) => {
          const next = Math.max(0.7, Math.min(10.0, prev + (detail.delta ?? 0)));
          if (next <= 1.02) {
            setPanX(0);
            setPanY(0);
          }
          return Math.round(next * 100) / 100;
        });
      }
    };
    window.addEventListener('talmud-focus-target-pct', onFocusTargetPct);
    window.addEventListener('talmud-reset-zoom', onExternalReset);
    window.addEventListener('talmud-zoom-step', onZoomStep);
    return () => {
      window.removeEventListener('talmud-focus-target-pct', onFocusTargetPct);
      window.removeEventListener('talmud-reset-zoom', onExternalReset);
      window.removeEventListener('talmud-zoom-step', onZoomStep);
    };
  }, [resetTransform, clampPanToContentBounds, scale, isFullScreen]);

  // Broadcast zoom state so the Full-Screen top header bar can also display a compact reset button without covering the Daf
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('talmud-zoom-state-change', {
          detail: { scale, isTransformed },
        })
      );
    }
  }, [scale, isTransformed]);

  // Trackpad two-finger pinch-to-zoom (ctrlKey/metaKey + wheel) up to 500% without transformOrigin jitter
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.008;
        setScale((prev) => {
          const next = Number(Math.max(0.75, Math.min(10.0, prev + delta)).toFixed(3));
          if (next <= 1.01) {
            setPanX(0);
            setPanY(0);
            setShowResetAfterRelease(false);
          } else {
            setShowResetAfterRelease(true);
          }
          return next;
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // High-performance Multi-Touch Pinch-to-Zoom & 1:1 Touch-Drag Panning Engine
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    didMoveDafRef.current = false;
    if (
      typeof document !== 'undefined' &&
      (document.querySelector('[data-fullscreen-section-active="true"]') ||
        document.body.dataset.talmudWordSelecting === 'true')
    ) {
      return;
    }
    if (e.touches.length === 2) {
      didMoveDafRef.current = true;
      if (typeof document !== 'undefined') {
        document.body.dataset.talmudPanning = 'true';
      }
      setIsInteracting(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const rect = containerRef.current?.getBoundingClientRect();

      pinchRef.current = {
        startDist: Math.max(20, dist),
        startScale: scale,
        startMidX: midX,
        startMidY: midY,
        startPanX: panX,
        startPanY: panY,
        containerCenterX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        containerTopY: rect ? rect.top : 100,
      };
      dragRef.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      if (transformElRef.current) transformElRef.current.style.transition = 'none';
      dragRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
        startPanX: panX,
        startPanY: panY,
        startTime: Date.now(),
        hadMultiTouch: false,
        // Measured once so touchmove never forces a layout pass.
        baseW: containerRef.current?.clientWidth || window.innerWidth,
        baseH: containerRef.current?.clientHeight || window.innerHeight,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      typeof document !== 'undefined' &&
      document.body.dataset.talmudWordSelecting === 'true'
    ) {
      dragRef.current = null;
      return;
    }
    if (e.touches.length === 2 && pinchRef.current) {
      didMoveDafRef.current = true;
      if (dragRef.current) dragRef.current.hadMultiTouch = true;
      if (typeof document !== 'undefined') {
        document.body.dataset.talmudPanning = 'true';
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const ratio = dist / pinchRef.current.startDist;
      const nextScale = Number(
        Math.max(0.75, Math.min(10.0, pinchRef.current.startScale * ratio)).toFixed(3)
      );
      setScale(nextScale);

      // Compute focal-point aware pan so the point between the user's two fingers stays locked under the fingers without jitter
      const scaleRatio = nextScale / pinchRef.current.startScale;
      const focalOffsetX =
        (pinchRef.current.startMidX - pinchRef.current.containerCenterX - pinchRef.current.startPanX) *
        (1 - scaleRatio);
      const focalOffsetY =
        (pinchRef.current.startMidY - pinchRef.current.containerTopY - pinchRef.current.startPanY) *
        (1 - scaleRatio);

      const rawPanX =
        pinchRef.current.startPanX + (midX - pinchRef.current.startMidX) + focalOffsetX;
      const rawPanY =
        pinchRef.current.startPanY + (midY - pinchRef.current.startMidY) + focalOffsetY;
      const clamped = clampPanToContentBounds(rawPanX, rawPanY, nextScale);
      setPanX(clamped.x);
      setPanY(clamped.y);
    } else if (e.touches.length === 1 && dragRef.current) {
      const t = e.touches[0];
      dragRef.current.lastX = t.clientX;
      dragRef.current.lastY = t.clientY;
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      const movedDist = Math.hypot(dx, dy);

      if (movedDist > 4) {
        // Set once per drag: touching body attributes every frame restyles the whole page.
        if (!didMoveDafRef.current && typeof document !== 'undefined') {
          document.body.dataset.talmudPanning = 'true';
        }
        didMoveDafRef.current = true;
        if (scale > 1.01 || isPanDragEnabled) {
          // No React state here: a re-render would reset the live DOM transform mid-drag.
          const d = dragRef.current;
          const baseW = d.baseW, baseH = d.baseH;
          const maxX = Math.max(120, (baseW * scale - baseW) / 2 + baseW * 0.35);
          const maxYTop = Math.max(160, baseH * 0.4);
          const maxYBottom = Math.max(240, baseH * scale * 0.95);
          const x = Math.max(-maxX, Math.min(maxX, d.startPanX + dx));
          const y = Math.max(-maxYBottom, Math.min(maxYTop, d.startPanY + dy));
          applyLivePan(x, y, scale);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (didMoveDafRef.current) {
      lastMoveEndTimestampRef.current = Date.now();
    }
    if (e.touches.length === 0 && typeof document !== 'undefined') {
      setTimeout(() => {
        delete document.body.dataset.talmudPanning;
      }, 380);
    }
    if (pinchRef.current && e.touches.length < 2) {
      pinchRef.current = null;
      setIsInteracting(false);
      if (scale > 1.03 || Math.abs(panX) > 6 || Math.abs(panY) > 6) {
        setShowResetAfterRelease(true);
      } else {
        resetTransform();
      }
    }
    if (e.touches.length === 0 && transformElRef.current) {
      const el = transformElRef.current;
      requestAnimationFrame(() => { el.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'; });
    }
    if (livePanRef.current) {
      if (panRafRef.current != null) { cancelAnimationFrame(panRafRef.current); panRafRef.current = null; }
      const p = livePanRef.current;
      livePanRef.current = null;
      setPanX(p.x);
      setPanY(p.y);
    }
    if (dragRef.current && e.touches.length === 0) {
      const completedDrag = dragRef.current;
      dragRef.current = null;
      setIsInteracting(false);

      // Horizontal swipe page turn when not zoomed in and not selecting text
      const isSelectingWord =
        typeof document !== 'undefined' &&
        document.body.dataset.talmudWordSelecting === 'true';
      if (
        !completedDrag.hadMultiTouch &&
        !isSelectingWord &&
        scale <= 1.05 &&
        !isPanDragEnabled
      ) {
        const endX = e.changedTouches?.[0]?.clientX ?? completedDrag.lastX;
        const endY = e.changedTouches?.[0]?.clientY ?? completedDrag.lastY;
        const dx = endX - completedDrag.startX;
        const dy = endY - completedDrag.startY;
        const elapsed = Date.now() - (completedDrag.startTime || 0);
        if (
          Math.abs(dx) >= 42 &&
          Math.abs(dx) > Math.abs(dy) * 1.15 &&
          elapsed < 950
        ) {
          if (dx < 0) {
            onNextAmud?.();
          } else {
            onPrevAmud?.();
          }
          return;
        }
      }

      if (isTransformed) {
        setShowResetAfterRelease(true);
      }
    }
  };

  // Global high-performance mouse drag listener using requestAnimationFrame (60fps/120fps fluid pan & scroll without stutter or jumping)
  useEffect(() => {
    let rafId: number | null = null;

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      if (
        typeof document !== 'undefined' &&
        document.body.dataset.talmudWordSelecting === 'true'
      ) {
        dragRef.current = null;
        setIsInteracting(false);
        return;
      }

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const movedDist = Math.hypot(dx, dy);

      if (movedDist > 3) {
        didMoveDafRef.current = true;
        dragRef.current.isDraggingWindow = true;
        if (typeof document !== 'undefined') {
          document.body.dataset.talmudPanning = 'true';
        }
        setIsInteracting(true);

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          if (!dragRef.current) return;

          const folioEl = document.getElementById('talmud-daf-folio-anchor');
          if (isFullScreen && scale <= 1.02 && folioEl && folioEl.scrollHeight > folioEl.clientHeight) {
            folioEl.scrollTop = dragRef.current.startScrollTop - dy;
          } else {
            const clamped = clampPanToContentBounds(
              dragRef.current.startPanX + dx,
              dragRef.current.startPanY + dy,
              scale
            );
            setPanX(clamped.x);
            setPanY(clamped.y);
          }
        });
      }
    };

    const onGlobalMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (didMoveDafRef.current) {
        lastMoveEndTimestampRef.current = Date.now();
      }
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          delete document.body.dataset.talmudPanning;
        }, 320);
      }
      if (dragRef.current) {
        dragRef.current = null;
        setIsInteracting(false);
        if (isTransformed) {
          setShowResetAfterRelease(true);
        }
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove, { passive: false });
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [isFullScreen, scale, isTransformed, clampPanToContentBounds]);

  // Mouse drag when Pan mode or Zoom is active
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    didMoveDafRef.current = false;
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) {
      return;
    }
    if ((isPanDragEnabled || scale > 1.01) && e.button === 0) {
      const folioEl = document.getElementById('talmud-daf-folio-anchor');
      const startScroll = folioEl ? folioEl.scrollTop : (typeof window !== 'undefined' ? window.scrollY : 0);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startPanX: panX,
        startPanY: panY,
        startScrollTop: startScroll,
        startTime: Date.now(),
        isDraggingWindow: false,
      };
    }
  };

  // Capture-phase click blocker: if the user was moving/panning/scrolling the Daf, block ALL click triggers!
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      didMoveDafRef.current ||
      Date.now() - lastMoveEndTimestampRef.current < 420 ||
      (typeof document !== 'undefined' && document.body.dataset.talmudPanning === 'true')
    ) {
      e.stopPropagation();
      e.preventDefault();
      didMoveDafRef.current = false;
      return;
    }

    if (!isAreaZoomMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    e.stopPropagation();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const relX = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
        const relY = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
        const nextScale =
          scale < 1.5 ? 1.8 : scale < 2.5 ? 2.8 : scale < 3.8 ? 4.0 : scale < 4.8 ? 5.0 : 1;
        if (nextScale === 1) {
          resetTransform();
        } else {
          focusSpecificArea(`არეალი (${Math.round(relX)}%, ${Math.round(relY)}%)`, relX, relY, nextScale);
        }
      }
    }
  };

  return (
    <div
      className={isFullScreen ? 'relative w-full max-w-none h-full p-0 m-0' : 'relative w-full max-w-full'}
      data-daf-zoomed={isZoomed ? 'true' : 'false'}
      data-daf-pan-mode={isPanDragEnabled ? 'true' : 'false'}
    >
      {/* Streamlined Daf Window Bar with Windows Controls (Shown only when enabled and NOT in Fullscreen) */}
      {showControlsAboveDaf && !isFullScreen && (
        <>
          <div
            className={`flex items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 mb-1.5 rounded-xl border text-[11px] w-full shadow-sm transition-all overflow-x-auto overflow-y-hidden scrollbar-none ${
              isDark
                ? 'bg-[#20150E]/95 border-[#C49A6C]/40 text-[#FAF5EB]'
                : 'bg-[#FAF4E4] border-[#8B5A2B]/35 text-[#2C180B]'
            }`}
          >
            {/* Left: Direct Page Flip & Tractate/Daf Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {onPrevAmud && (
                <button
                  type="button"
                  onClick={onPrevAmud}
                  className={`h-7 px-2 rounded-lg border font-extrabold text-[10.5px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
                    isDark
                      ? 'bg-[#2D1C12] hover:bg-[#3D271A] border-[#C49A6C]/45 text-[#FAF5EB]'
                      : 'bg-[#EFE3CA] hover:bg-[#E5D4B5] border-[#8B5A2B]/40 text-[#2C180B]'
                  }`}
                  title="წინა გვერდზე გადაფურცვლა"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">წინა</span>
                </button>
              )}

              {centerNavigationSelector ? (
                centerNavigationSelector
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-lg border text-[11px] sm:text-xs font-black truncate whitespace-nowrap inline-block ${
                    isDark
                      ? 'bg-[#2D1C12] border-[#C49A6C]/45 text-amber-300'
                      : 'bg-[#EFE3CA] border-[#8B5A2B]/40 text-[#5C3A21]'
                  }`}
                >
                  {dafTitleLabel || 'ვილნას დაფი'}
                </span>
              )}

              {onNextAmud && (
                <button
                  type="button"
                  onClick={onNextAmud}
                  className={`h-7 px-2 rounded-lg border font-extrabold text-[10.5px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
                    isDark
                      ? 'bg-[#2D1C12] hover:bg-[#3D271A] border-[#C49A6C]/45 text-[#FAF5EB]'
                      : 'bg-[#EFE3CA] hover:bg-[#E5D4B5] border-[#8B5A2B]/40 text-[#2C180B]'
                  }`}
                  title="შემდეგ გვერდზე გადაფურცვლა"
                >
                  <span className="hidden sm:inline">შემდეგი</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-500" />
                </button>
              )}
            </div>

            {/* Center/Right: Extra Study Controls, Compact Zoom, Area Focus, and Windows Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
              {!isToolbarMinimized && (
                <>
                  {extraToolbarControls}

                  {/* Compact Zoom Pill */}
                  <div
                    className={`h-7 px-1 rounded-lg border flex items-center gap-0.5 ${
                      isDark
                        ? 'bg-[#2D1C12] border-[#C49A6C]/40 text-[#FAF5EB]'
                        : 'bg-[#EFE3CA] border-[#8B5A2B]/35 text-[#2C180B]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setScale((s) => {
                          const next = Number(Math.max(0.85, s - 0.35).toFixed(2));
                          if (next <= 1) resetTransform();
                          else setShowResetAfterRelease(true);
                          return next;
                        })
                      }
                      className="p-1 rounded hover:bg-[#8B5A2B]/20 cursor-pointer flex items-center justify-center"
                      title="დაშორება (Zoom Out)"
                    >
                      <ZoomOut className="w-3 h-3 text-amber-500" />
                    </button>

                    <button
                      type="button"
                      onClick={isTransformed ? resetTransform : undefined}
                      title={isTransformed ? 'საწყის ზომაზე დაბრუნება (100%)' : 'მიმდინარე ზუმი'}
                      className={`font-black text-[10px] text-center select-none px-1 rounded ${
                        isTransformed
                          ? 'cursor-pointer bg-[#7D2E2E]/30 text-amber-400 underline decoration-dotted'
                          : ''
                      }`}
                    >
                      {Math.round(scale * 100)}%
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScale((s) => Number(Math.min(10.0, s + 0.35).toFixed(2)));
                        setShowResetAfterRelease(true);
                      }}
                      className="p-1 rounded hover:bg-[#8B5A2B]/20 cursor-pointer flex items-center justify-center"
                      title="მიახლოება (Zoom In)"
                    >
                      <ZoomIn className="w-3 h-3 text-amber-500" />
                    </button>
                  </div>

                  {/* Area Focus Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAreaZoomMode((v) => !v);
                      setIsPanDragEnabled(false);
                    }}
                    className={`h-7 px-2 rounded-lg border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                      isAreaZoomMode
                        ? 'bg-[#B45309] text-[#FAF5EB] border-amber-300'
                        : isDark
                          ? 'bg-[#2D1C12] border-[#C49A6C]/40 text-[#FAF5EB] hover:bg-[#3D271A]'
                          : 'bg-[#EFE3CA] border-[#8B5A2B]/35 text-[#2C180B] hover:bg-[#E5D4B5]'
                    }`}
                    title="კონკრეტული არეალის მიახლოება კლიკით"
                  >
                    <Crosshair className="w-3 h-3 shrink-0 text-amber-500" />
                    <span className="hidden xl:inline">ფოკუსი</span>
                  </button>

                  {(scale > 1.03 || isTransformed || showResetAfterRelease) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPanDragEnabled((v) => !v);
                          setIsAreaZoomMode(false);
                        }}
                        className={`h-7 px-2 rounded-lg font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-all ${
                          isPanDragEnabled
                            ? 'bg-[#B45309] text-[#FAF5EB]'
                            : isDark
                              ? 'bg-[#3A2416] text-[#FAF5EB]'
                              : 'bg-[#D9C4A5] text-[#2C180B]'
                        }`}
                        title="მიახლოებული გვერდის გადაადგილება (Pan)"
                      >
                        <Move className="w-3 h-3" />
                        <span className="hidden sm:inline">გადაადგილება</span>
                      </button>

                      <button
                        type="button"
                        onClick={resetTransform}
                        className="h-7 px-2 rounded-lg bg-[#7D2E2E] hover:bg-[#913737] text-[#FAF5EB] font-black text-[10px] flex items-center gap-1 cursor-pointer border border-amber-300/30"
                        title="საწყის ზომაზე დაბრუნება (100%)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>100%</span>
                      </button>
                    </>
                  )}
                </>
              )}

              {/* In Fullscreen mode: show ONLY the single collapse "✕" button, no windows controls */}
              {isFullScreen ? (
                <button
                  type="button"
                  data-raw-btn="true"
                  data-flat-btn="true"
                  onClick={onToggleFullScreen}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border shadow-sm ${
                    isDark
                      ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/50 text-rose-200'
                      : 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800'
                  }`}
                  title="სრული ეკრანის ჩაკეცვა"
                  aria-label="სრული ეკრანის ჩაკეცვა"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <WindowsWindowControls
                  isMinimized={isToolbarMinimized}
                  onToggleMinimize={() => setIsToolbarMinimized((v) => !v)}
                  isMaximized={isFullScreen}
                  onToggleMaximize={onToggleFullScreen}
                  isFullScreen={isFullScreen}
                  onToggleFullScreen={onToggleFullScreen}
                  minimizeTitle="ხელსაწყოების ზოლის ჩაკეცვა / გაშლა"
                  maximizeTitle="დაფის გაშლა"
                  fullScreenTitle="დაფის მთელ ეკრანზე გაშლა"
                  isDark={isDark}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Expandable Drawer right under the Daf Window Bar */}
          {!isToolbarMinimized && belowToolbarDrawer}
        </>
      )}

      {/* Flat Page Flip Wrapper around Pinch-to-Zoom & Pan Viewport — ALWAYS VISIBLE ON SCREEN */}
      <PageFlip3DWrapper
        pageKey={pageKey}
        direction={direction >= 0 ? 1 : -1}
        isDark={isDark}
        pageLabelKa={dafTitleLabel}
        onPrevPage={onPrevAmud}
        onNextPage={onNextAmud}
      >
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          style={{
            touchAction: scale > 1.02 || isPanDragEnabled ? 'none' : 'pan-y',
          }}
          className={`w-full max-w-full overflow-x-hidden ${
            isAreaZoomMode
              ? 'cursor-zoom-in'
              : isPanDragEnabled || scale > 1.02
                ? 'cursor-grab active:cursor-grabbing'
                : ''
          }`}
        >
          <div
            ref={transformElRef}
            style={{
              transformOrigin: '50% 0%',
              transform: isTransformed
                ? `translate3d(${panX}px, ${panY}px, 0px) scale(${scale})`
                : undefined,
              transition: isInteracting
                ? 'none'
                : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="w-full max-w-full will-change-transform"
          >
            {children}
          </div>
        </div>
      </PageFlip3DWrapper>
    </div>
  );
};
