// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

interface ReadingLineGuideProps {
  /** Initial vertical offset in pixels inside the text field */
  initialY?: number;
  /** Whether the text field has a dark background */
  isDarkField?: boolean;
  /** Compact mode for narrower columns like Rashi / Tosafot / Margins */
  compact?: boolean;
  /** Optional label shown on hover/drag */
  fieldLabel?: string;
}

/**
 * Interactive Movable Reading Line (მოძრავი სანიშნე ხაზი) in Warm Cream, Beige & Wood palette.
 * - Marks the exact line the user is reading in the text.
 * - Moves automatically when the user taps/clicks any word or line in the parent text field.
 * - Can be dragged smoothly up/down via its side handle (mouse or touch).
 * - Includes ▲ / ▼ step buttons for line-by-line progression.
 */
export const ReadingLineGuide: React.FC<ReadingLineGuideProps> = ({
  initialY = 34,
  isDarkField = false,
  compact = false,
  fieldLabel,
}) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [contentY, setContentY] = useState<number>(initialY);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [clientHeight, setClientHeight] = useState<number>(260);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStateRef = useRef<{
    startClientY: number;
    startContentY: number;
  } | null>(null);

  const getParentField = useCallback((): HTMLElement | null => {
    return anchorRef.current?.parentElement || null;
  }, []);

  useEffect(() => {
    const parent = getParentField();
    if (!parent) return;

    const computedPos = window.getComputedStyle(parent).position;
    if (computedPos === 'static') {
      parent.style.position = 'relative';
    }

    const updateMetrics = () => {
      setScrollTop(parent.scrollTop || 0);
      setClientHeight(parent.clientHeight || 240);
    };

    updateMetrics();

    const handleParentScroll = () => {
      setScrollTop(parent.scrollTop || 0);
      setClientHeight(parent.clientHeight || 240);
    };

    const handleParentPointerDown = (e: MouseEvent | TouchEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;
      if (targetEl.closest('[data-reading-line-control="true"]')) return;
      if (targetEl.closest('button:not([role="button"])')) return;

      const clientY =
        'touches' in e
          ? e.touches[0]?.clientY
          : (e as MouseEvent).clientY;
      if (typeof clientY !== 'number') return;

      const rect = parent.getBoundingClientRect();
      const scaleY =
        rect.height > 0 && parent.offsetHeight > 0
          ? rect.height / parent.offsetHeight
          : 1;
      const relY = (clientY - rect.top) / scaleY;
      if (relY >= 4 && relY <= (parent.clientHeight || rect.height / scaleY) - 4) {
        const nextContentY = Math.max(12, Math.round(parent.scrollTop + relY + 6));
        setContentY(nextContentY);
        setScrollTop(parent.scrollTop || 0);
        setClientHeight(parent.clientHeight || 240);
      }
    };

    parent.addEventListener('scroll', handleParentScroll, { passive: true });
    parent.addEventListener('mousedown', handleParentPointerDown, { passive: true });
    parent.addEventListener('touchstart', handleParentPointerDown, { passive: true });
    window.addEventListener('resize', updateMetrics);

    return () => {
      parent.removeEventListener('scroll', handleParentScroll);
      parent.removeEventListener('mousedown', handleParentPointerDown);
      parent.removeEventListener('touchstart', handleParentPointerDown);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [getParentField]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY: number) => {
      const parent = getParentField();
      if (!parent || !dragStateRef.current) return;
      const rect = parent.getBoundingClientRect();
      const scaleY =
        rect.height > 0 && parent.offsetHeight > 0
          ? rect.height / parent.offsetHeight
          : 1;
      const dy = (clientY - dragStateRef.current.startClientY) / scaleY;
      const maxContentH = Math.max(parent.scrollHeight || 300, parent.clientHeight || 240);
      const nextY = Math.max(
        14,
        Math.min(maxContentH - 8, Math.round(dragStateRef.current.startContentY + dy))
      );
      setContentY(nextY);

      const relInViewport = (clientY - rect.top) / scaleY;
      if (parent.scrollHeight > parent.clientHeight) {
        if (relInViewport > parent.clientHeight - 28) {
          parent.scrollTop += 10;
          setScrollTop(parent.scrollTop);
        } else if (relInViewport < 28 && parent.scrollTop > 0) {
          parent.scrollTop -= 10;
          setScrollTop(parent.scrollTop);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      handleMove(e.touches[0].clientY);
    };

    const onEnd = () => {
      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, getParentField]);

  const stepLine = (deltaPx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const parent = getParentField();
    const maxH = parent ? Math.max(parent.scrollHeight, parent.clientHeight) : 1200;
    setContentY((prev) => {
      const next = Math.max(14, Math.min(maxH - 8, prev + deltaPx));
      if (parent && parent.scrollHeight > parent.clientHeight) {
        const visY = next - parent.scrollTop;
        if (visY > parent.clientHeight - 24) {
          parent.scrollTop = Math.min(
            parent.scrollHeight - parent.clientHeight,
            parent.scrollTop + Math.abs(deltaPx)
          );
          setScrollTop(parent.scrollTop);
        } else if (visY < 16 && parent.scrollTop > 0) {
          parent.scrollTop = Math.max(0, parent.scrollTop - Math.abs(deltaPx));
          setScrollTop(parent.scrollTop);
        }
      }
      return next;
    });
  };

  const rawVisualY = contentY - scrollTop;
  const minTopY = compact ? 38 : 42;
  const clampedVisualY = Math.max(minTopY, Math.min(Math.max(54, clientHeight - 10), rawVisualY));

  return (
    <div
      ref={anchorRef}
      data-reading-line-control="true"
      className="sticky top-0 left-0 right-0 w-full h-0 overflow-visible z-[8] pointer-events-none select-none"
    >
      <div
        style={{
          transform: `translateY(${clampedVisualY}px)`,
        }}
        className={`relative w-full transition-transform ${
          isDragging ? 'duration-0' : 'duration-150 ease-out'
        }`}
      >
        {/* Crystal Golden-Amber Reading Line Highlight Band — Clearly Visible Place Marker */}
        <div
          className={`w-full h-[22px] -mt-[18px] rounded-md pointer-events-none transition-all ${
            isDarkField
              ? isDragging
                ? 'bg-amber-400/30 border-b-2 border-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                : 'bg-amber-400/18 border-b-2 border-amber-500/70 shadow-[0_1px_6px_rgba(245,158,11,0.18)]'
              : isDragging
                ? 'bg-amber-300/35 border-b-2 border-amber-600 shadow-[0_2px_10px_rgba(217,119,6,0.28)]'
                : 'bg-amber-300/22 border-b-2 border-amber-500/75 shadow-[0_1px_6px_rgba(217,119,6,0.16)]'
          }`}
        />

        {/* Crystal Side Handle + Up/Down Line Stepper */}
        <div
          dir="ltr"
          data-reading-line-control="true"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const parent = getParentField();
            const currentScroll = parent?.scrollTop || 0;
            dragStateRef.current = {
              startClientY: e.clientY,
              startContentY: currentScroll + clampedVisualY,
            };
            setContentY(currentScroll + clampedVisualY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            if (e.touches.length !== 1) return;
            e.stopPropagation();
            const parent = getParentField();
            const currentScroll = parent?.scrollTop || 0;
            dragStateRef.current = {
              startClientY: e.touches[0].clientY,
              startContentY: currentScroll + clampedVisualY,
            };
            setContentY(currentScroll + clampedVisualY);
            setIsDragging(true);
          }}
          title={
            fieldLabel
              ? `ადგილის მომნიშვნელი ხაზი (${fieldLabel}) — გადაადგილეთ ხაზის მოსანიშნად`
              : 'ადგილის მომნიშვნელი ხაზი — გადაადგილეთ ხაზის მოსანიშნად'
          }
          className={`pointer-events-auto absolute -top-[12px] left-0.5 flex items-center gap-0.5 rounded-full border cursor-ns-resize touch-none transition-all opacity-85 hover:opacity-100 active:opacity-100 active:scale-95 shadow-sm ${
            compact ? 'px-1.5 py-0.5' : 'px-1.5 py-0.5 sm:px-2'
          } bg-white/95 border-amber-500/80 text-[#0F1E36] hover:bg-amber-50 backdrop-blur-md`}
        >
          <GripHorizontal className="w-3 h-3 text-amber-600" />
          {!compact && (
            <span className="inline-flex items-center gap-0.5">
              <button
                type="button"
                data-raw-btn="true"
                onClick={(e) => stepLine(-24, e)}
                title="ერთი ხაზით ზემოთ"
                className="p-0.5 rounded hover:bg-amber-200/70 text-[#0F1E36] cursor-pointer"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                data-raw-btn="true"
                onClick={(e) => stepLine(24, e)}
                title="ერთი ხაზით ქვემოთ"
                className="p-0.5 rounded hover:bg-amber-200/70 text-[#0F1E36] cursor-pointer"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
