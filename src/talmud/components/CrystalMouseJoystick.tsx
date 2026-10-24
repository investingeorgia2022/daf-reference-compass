// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MousePointer,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  GripHorizontal,
} from 'lucide-react';
import { WindowsWindowControls } from './WindowsWindowControls';

export type JoystickMode = 'mouse' | 'scroll';

interface CrystalMouseJoystickProps {
  isDark: boolean;
  onPrevDaf?: () => void;
  onNextDaf?: () => void;
  onAdjustFontScale?: (delta: number) => void;
  externalOpen?: boolean;
  onToggleExternalOpen?: () => void;
}

export const CrystalMouseJoystick: React.FC<CrystalMouseJoystickProps> = ({
  isDark,
  onPrevDaf,
  onNextDaf,
  externalOpen,
  onToggleExternalOpen,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [cursorEnabled, setCursorEnabled] = useState<boolean>(false);
  const [mode, setMode] = useState<JoystickMode>('mouse');

  // Draggable panel offset (dragged ONLY from top header bar so it never conflicts with analog stick!)
  const [panelOffset, setPanelOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const headerDragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  // Virtual Mouse Cursor viewport coordinates
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.5) : 500,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.42) : 340,
  }));

  // Analog stick deflection (-1..1 for x and y)
  const [stickVec, setStickVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const stickVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingStickRef = useRef<boolean>(false);
  const stickBaseRef = useRef<HTMLDivElement | null>(null);

  const [hoveredPreviewText, setHoveredPreviewText] = useState<string>('');
  const [clickRippleKey, setClickRippleKey] = useState<number>(0);
  const activeLineIndexRef = useRef<number>(-1);
  const highlightedDomElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof externalOpen === 'boolean') {
      setIsExpanded(externalOpen);
      if (externalOpen) {
        setIsMinimized(false);
        setCursorEnabled(true);
      } else {
        setCursorEnabled(false);
      }
    }
  }, [externalOpen]);

  const handleCloseJoystick = () => {
    setIsExpanded(false);
    setIsMaximized(false);
    setCursorEnabled(false);
    if (externalOpen && onToggleExternalOpen) {
      onToggleExternalOpen();
    }
  };

  const clearDomHighlight = useCallback(() => {
    if (highlightedDomElRef.current) {
      highlightedDomElRef.current.style.removeProperty('outline');
      highlightedDomElRef.current.style.removeProperty('outline-offset');
      highlightedDomElRef.current.style.removeProperty('box-shadow');
      highlightedDomElRef.current = null;
    }
  }, []);

  const applyDomHighlight = useCallback(
    (el: HTMLElement | null) => {
      if (highlightedDomElRef.current === el) return;
      clearDomHighlight();
      if (!el) return;
      highlightedDomElRef.current = el;
      el.style.outline = '2px solid rgba(245, 158, 11, 0.9)';
      el.style.outlineOffset = '2px';
      el.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.4)';
    },
    [clearDomHighlight]
  );

  useEffect(() => {
    if (!cursorEnabled) {
      clearDomHighlight();
    }
    return () => clearDomHighlight();
  }, [cursorEnabled, clearDomHighlight]);

  const inspectElementAtCursor = useCallback(
    (x: number, y: number) => {
      if (typeof document === 'undefined') return;
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!el || el.closest('[data-crystal-joystick="true"]')) {
        return;
      }
      const interactiveTarget =
        el.closest<HTMLElement>(
          'button, a, input, select, [role="button"], [data-sentence-id], [data-daf-line], [data-daf-word], .font-serif'
        ) || el;

      applyDomHighlight(interactiveTarget);

      const rawText =
        interactiveTarget.getAttribute('title') ||
        interactiveTarget.innerText ||
        interactiveTarget.textContent ||
        '';
      const cleanText = rawText.replace(/\s+/g, ' ').trim().slice(0, 60);
      setHoveredPreviewText(cleanText);
    },
    [applyDomHighlight]
  );

  const performVirtualMouseClick = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!cursorEnabled) {
      setCursorEnabled(true);
    }
    setClickRippleKey((k) => k + 1);

    const el = document.elementFromPoint(cursorPos.x, cursorPos.y) as HTMLElement | null;
    if (!el || el.closest('[data-crystal-joystick="true"]')) return;

    const clickTarget =
      el.closest<HTMLElement>(
        'button, a, input, select, [role="button"], [data-sentence-id], [data-daf-word]'
      ) || el;

    if (clickTarget instanceof HTMLInputElement || clickTarget instanceof HTMLSelectElement) {
      clickTarget.focus();
    }

    clickTarget.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: cursorPos.x,
        clientY: cursorPos.y,
      })
    );
    clickTarget.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: cursorPos.x,
        clientY: cursorPos.y,
      })
    );
    clickTarget.click();
  }, [cursorEnabled, cursorPos]);

  const stepLineOrScroll = useCallback(
    (direction: -1 | 1) => {
      if (typeof document === 'undefined') return;
      const rawNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-sentence-id], [data-daf-line]')
      ).filter((el) => {
        if (el.closest('[data-crystal-joystick="true"]')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.height > 8;
      });

      if (rawNodes.length === 0) {
        window.scrollBy({ top: direction * 90, behavior: 'smooth' });
        return;
      }

      rawNodes.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

      let nextIdx = activeLineIndexRef.current;
      if (nextIdx < 0 || nextIdx >= rawNodes.length) {
        const refY = cursorPos.y || window.innerHeight * 0.4;
        let bestIdx = 0;
        let bestDist = Infinity;
        rawNodes.forEach((el, idx) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - refY);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = idx;
          }
        });
        nextIdx = bestIdx + direction;
      } else {
        nextIdx += direction;
      }

      nextIdx = Math.max(0, Math.min(rawNodes.length - 1, nextIdx));
      activeLineIndexRef.current = nextIdx;
      const targetEl = rawNodes[nextIdx];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        applyDomHighlight(targetEl);
        setTimeout(() => {
          const rect = targetEl.getBoundingClientRect();
          setCursorPos({
            x: Math.max(24, Math.min(window.innerWidth - 24, rect.left + rect.width * 0.5)),
            y: Math.max(24, Math.min(window.innerHeight - 24, rect.top + rect.height / 2)),
          });
        }, 100);
      }
    },
    [cursorPos.y, applyDomHighlight]
  );

  // Smooth 60fps loop for analog stick movement
  useEffect(() => {
    if (!isExpanded) return;
    let rafId = 0;

    const tick = () => {
      const { x: vx, y: vy } = stickVecRef.current;
      const mag = Math.hypot(vx, vy);
      const speed = 9.5;

      if (mag > 0.06) {
        if (mode === 'mouse') {
          setCursorPos((prev) => {
            const nextX = Math.max(
              10,
              Math.min(window.innerWidth - 10, prev.x + vx * speed)
            );
            const nextY = Math.max(
              10,
              Math.min(window.innerHeight - 10, prev.y + vy * speed)
            );

            // Auto-scroll page when cursor reaches top/bottom edges
            const edgeThreshold = 64;
            if (nextY < edgeThreshold && vy < -0.15) {
              window.scrollBy({ top: vy * speed * 1.25, behavior: 'auto' });
            } else if (nextY > window.innerHeight - edgeThreshold && vy > 0.15) {
              window.scrollBy({ top: vy * speed * 1.25, behavior: 'auto' });
            }

            inspectElementAtCursor(nextX, nextY);
            return { x: nextX, y: nextY };
          });
        } else {
          // Direct 360° smooth page & container scroll
          window.scrollBy({
            left: vx * speed * 1.35,
            top: vy * speed * 1.5,
            behavior: 'auto',
          });
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isExpanded, mode, inspectElementAtCursor]);

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const base = stickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.38;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = maxRadius > 0 ? (Math.cos(angle) * clampedDist) / maxRadius : 0;
    const normY = maxRadius > 0 ? (Math.sin(angle) * clampedDist) / maxRadius : 0;

    stickVecRef.current = { x: normX, y: normY };
    setStickVec({ x: normX, y: normY });
    if (!cursorEnabled && mode === 'mouse') {
      setCursorEnabled(true);
    }
  };

  const resetStickToCenter = () => {
    isDraggingStickRef.current = false;
    stickVecRef.current = { x: 0, y: 0 };
    setStickVec({ x: 0, y: 0 });
  };

  return (
    <>
      {/* 1. ON-SCREEN VIRTUAL POINTER CURSOR (ONLY WHEN ENABLED) */}
      {cursorEnabled && isExpanded && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[260] overflow-hidden"
        >
          <AnimatePresence>
            {clickRippleKey > 0 && (
              <motion.div
                key={`cursor-click-${clickRippleKey}`}
                initial={{ scale: 0.3, opacity: 0.95 }}
                animate={{ scale: 2.1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42 }}
                style={{
                  left: `${cursorPos.x - 18}px`,
                  top: `${cursorPos.y - 18}px`,
                }}
                className="pointer-events-none fixed w-9 h-9 rounded-full border-2 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.9)]"
              />
            )}
          </AnimatePresence>

          <div
            style={{
              transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
            }}
            className="pointer-events-none fixed top-0 left-0 z-[265]"
          >
            <span className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-amber-300 border-2 border-[#2B1B10] shadow-[0_0_10px_#F59E0B]" />
            <svg
              viewBox="0 0 48 48"
              className="w-8 h-8 -ml-0.5 -mt-0.5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
            >
              <polygon
                points="3,3 36,16 22,22 31,36 25,40 16,26 9,37"
                fill="#F59E0B"
                stroke="#FFFBEB"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>

            {hoveredPreviewText && (
              <div className="mt-1 ml-5 px-2 py-0.5 rounded-lg border border-amber-400/80 bg-[#1E130B]/95 text-[#FAF5EB] text-[10px] font-bold shadow-md max-w-[190px] truncate">
                {hoveredPreviewText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SIMPLIFIED, CLEAN JOYSTICK WIDGET (OPENED FROM HEADER OR COMPACT PILL) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="simplified-joystick-pod"
            data-crystal-joystick="true"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.2 }}
            style={
              isMaximized
                ? { position: 'fixed', inset: '12px', zIndex: 270 }
                : {
                    position: 'fixed',
                    bottom: '76px',
                    left: '14px',
                    transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)`,
                    zIndex: 240,
                  }
            }
            className={`${
              isMaximized ? 'w-auto' : 'w-[224px]'
            } rounded-2xl border-2 shadow-2xl backdrop-blur-xl select-none pointer-events-auto overflow-hidden ${
              isDark
                ? 'bg-[#1D130C]/95 border-[#C49A6C]/70 text-[#FAF5EB]'
                : 'bg-[#FAF3E3]/96 border-[#8B5A2B]/70 text-[#21140B]'
            }`}
          >
            {/* Top Header Bar: Title on Left + Windows Controls in Top-Right Corner */}
            <div
              dir="ltr"
              onPointerDown={(e) => {
                if (isMaximized || (e.target as HTMLElement).closest('button')) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                headerDragRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: panelOffset.x,
                  initY: panelOffset.y,
                };
              }}
              onPointerMove={(e) => {
                if (!headerDragRef.current) return;
                setPanelOffset({
                  x: headerDragRef.current.initX + (e.clientX - headerDragRef.current.startX),
                  y: headerDragRef.current.initY + (e.clientY - headerDragRef.current.startY),
                });
              }}
              onPointerUp={() => {
                headerDragRef.current = null;
              }}
              onPointerCancel={() => {
                headerDragRef.current = null;
              }}
              className={`px-2.5 py-1.5 border-b flex items-center justify-between gap-2 cursor-move ${
                isDark
                  ? 'bg-[#2B1C12] border-[#C49A6C]/35'
                  : 'bg-[#EAD9BC] border-[#8B5A2B]/30'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <GripHorizontal className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <span className="text-[11px] font-black truncate">🕹️ ჯოისტიკი</span>
              </div>

              <WindowsWindowControls
                size="xs"
                isDark={isDark}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized((v) => !v)}
                isMaximized={isMaximized}
                onToggleMaximize={() => {
                  setIsMaximized((v) => !v);
                  setIsMinimized(false);
                }}
                onClose={handleCloseJoystick}
              />
            </div>

            {!isMinimized && (
              <div className="p-2.5 flex flex-col items-center gap-2.5">
                {/* Simple 2-Mode Switch: Mouse Cursor vs Direct Scroll */}
                <div className="grid grid-cols-2 gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('mouse');
                      setCursorEnabled(true);
                    }}
                    className={`py-1 px-2 rounded-xl border text-[10.5px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      mode === 'mouse'
                        ? 'bg-[#6B4226] text-[#FAF5EB] border-amber-400 shadow-xs'
                        : isDark
                          ? 'bg-[#261910] border-[#C49A6C]/30 text-[#E8D8BE]'
                          : 'bg-[#EFE3CC] border-[#8B5A2B]/30 text-[#2C1A10]'
                    }`}
                  >
                    <MousePointer className="w-3 h-3 shrink-0" />
                    <span>კურსორი</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('scroll');
                      setCursorEnabled(false);
                    }}
                    className={`py-1 px-2 rounded-xl border text-[10.5px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      mode === 'scroll'
                        ? 'bg-[#6B4226] text-[#FAF5EB] border-amber-400 shadow-xs'
                        : isDark
                          ? 'bg-[#261910] border-[#C49A6C]/30 text-[#E8D8BE]'
                          : 'bg-[#EFE3CC] border-[#8B5A2B]/30 text-[#2C1A10]'
                    }`}
                  >
                    <Move className="w-3 h-3 shrink-0" />
                    <span>სქროლი</span>
                  </button>
                </div>

                {/* Clean Analog Stick Well + 4 Directional Buttons */}
                <div
                  ref={stickBaseRef}
                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    isDraggingStickRef.current = true;
                    updateStickFromPointer(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingStickRef.current) return;
                    e.stopPropagation();
                    updateStickFromPointer(e.clientX, e.clientY);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    resetStickToCenter();
                  }}
                  onPointerCancel={resetStickToCenter}
                  className={`relative w-32 h-32 rounded-full border-2 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing ${
                    isDark
                      ? 'bg-[radial-gradient(circle_at_50%_50%,#3B2618_0%,#160E09_80%)] border-[#C49A6C]/70 shadow-inner'
                      : 'bg-[radial-gradient(circle_at_50%_50%,#F4E6CE_0%,#D5BE97_85%)] border-[#8B5A2B]/70 shadow-inner'
                  }`}
                >
                  {/* Up: Step Line / Scroll Up */}
                  <button
                    type="button"
                    onClick={() => stepLineOrScroll(-1)}
                    title="ზედა სტრიქონი / ზევით"
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-7 h-6 rounded-full hover:bg-amber-500/25 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Down: Step Line / Scroll Down */}
                  <button
                    type="button"
                    onClick={() => stepLineOrScroll(1)}
                    title="ქვედა სტრიქონი / ქვევით"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-7 h-6 rounded-full hover:bg-amber-500/25 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Left: Prev Page / Daf */}
                  <button
                    type="button"
                    onClick={() => onPrevDaf?.()}
                    title="წინა გვერდი / დაფი"
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-7 rounded-full hover:bg-amber-500/25 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Right: Next Page / Daf */}
                  <button
                    type="button"
                    onClick={() => onNextDaf?.()}
                    title="შემდეგი გვერდი / დაფი"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-7 rounded-full hover:bg-amber-500/25 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Center Thumbstick Knob */}
                  <motion.div
                    animate={{
                      x: stickVec.x * 32,
                      y: stickVec.y * 32,
                    }}
                    transition={
                      isDraggingStickRef.current
                        ? { type: 'tween', duration: 0.016 }
                        : { type: 'spring', stiffness: 360, damping: 22 }
                    }
                    className="pointer-events-none w-12 h-12 rounded-full border-2 border-[#FAF5EB] bg-[radial-gradient(circle_at_30%_25%,#FAF5EB_0%,#E8D8BE_45%,#C49A6C_80%,#5C3A21_100%)] text-[#2B1B10] shadow-lg flex items-center justify-center font-black text-[10px]"
                  >
                    🕹️
                  </motion.div>
                </div>

                {/* Bottom Action Button: Click under cursor */}
                <button
                  type="button"
                  onClick={performVirtualMouseClick}
                  className="w-full py-1.5 px-3 rounded-xl border border-amber-300/80 bg-gradient-to-r from-[#8B5A2B] to-[#5C3A21] hover:brightness-110 text-[#FAF5EB] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  <Crosshair className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>კლიკი (არჩევა)</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
