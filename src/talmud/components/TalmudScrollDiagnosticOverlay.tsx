// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Activity,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  Target,
} from 'lucide-react';
import { ScrollCoordinateMetrics, SefariaResolvedDomAnchor } from '../utils/sefariaRefMapper';

interface TalmudScrollDiagnosticOverlayProps {
  metrics: ScrollCoordinateMetrics | null;
  activeAnchor: SefariaResolvedDomAnchor | null;
  isVisible: boolean;
  onToggleVisible: () => void;
  onTriggerRealign: () => void;
  isDark?: boolean;
}

export const TalmudScrollDiagnosticOverlay: React.FC<TalmudScrollDiagnosticOverlayProps> = ({
  metrics,
  activeAnchor,
  isVisible,
  onToggleVisible,
  onTriggerRealign,
  isDark = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [targetBoxRect, setTargetBoxRect] = useState<DOMRect | null>(null);

  // Poll or update target element bounding box coordinates for reticle highlighting
  useEffect(() => {
    if (!isVisible || !activeAnchor?.targetElement) {
      setTargetBoxRect(null);
      return;
    }

    const updateRect = () => {
      if (activeAnchor?.targetElement && document.body.contains(activeAnchor.targetElement)) {
        setTargetBoxRect(activeAnchor.targetElement.getBoundingClientRect());
      } else {
        setTargetBoxRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 180);
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [isVisible, activeAnchor]);

  if (!isVisible && !metrics) {
    return null;
  }

  const delta = metrics?.deltaPx ?? 0;
  const absDelta = Math.abs(delta);
  const isLocked = absDelta <= 5;
  const isWarning = absDelta > 5 && absDelta <= 35;
  const isError = absDelta > 35;

  return (
    <>
      {/* 1. VISUAL TARGET RETICLE HIGHLIGHT OVER THE CALCULATED DOM ELEMENT */}
      {isVisible && targetBoxRect && targetBoxRect.width > 0 && targetBoxRect.height > 0 && (
        <div
          data-diagnostic-target-reticle="true"
          style={{
            position: 'fixed',
            left: `${Math.max(0, targetBoxRect.left - 4)}px`,
            top: `${Math.max(0, targetBoxRect.top - 4)}px`,
            width: `${targetBoxRect.width + 8}px`,
            height: `${targetBoxRect.height + 8}px`,
            pointerEvents: 'none',
            zIndex: 290,
          }}
          className="transition-all duration-150 ease-out animate-pulse"
        >
          {/* Target Boundary Box with Glowing Amber Frame */}
          <div
            className={`w-full h-full rounded-md border-2 ${
              isLocked
                ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.55)] bg-emerald-500/10'
                : isWarning
                  ? 'border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.55)] bg-amber-500/10'
                  : 'border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.65)] bg-rose-500/10'
            }`}
          >
            {/* Corner crosshairs */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

            {/* Target Coordinate Badge */}
            <div className="absolute -top-6 right-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-600 text-white shadow-sm flex items-center gap-1 select-none">
              <Crosshair className="w-2.5 h-2.5" />
              <span>Y: {Math.round(metrics?.targetDocY ?? 0)}px</span>
              <span>· Δ {delta > 0 ? `+${delta}` : delta}px</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DIAGNOSTIC HUD BADGE & CONTROL PANEL (Docked Bottom-Right) */}
      <div
        id="talmud-scroll-diagnostic-hud"
        style={{ zIndex: 295 }}
        className={`fixed bottom-4 right-4 max-w-sm rounded-2xl border shadow-2xl transition-all duration-200 select-none ${
          isDark
            ? 'bg-[#1C130D]/95 border-[#8B5A2B]/60 text-[#FAF5EB] backdrop-blur-md'
            : 'bg-[#FBF6EA]/95 border-[#8B5A2B]/50 text-[#24150B] backdrop-blur-md'
        }`}
      >
        {/* HUD Header Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#8B5A2B]/25">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span className="text-[11px] font-extrabold tracking-wide">
              Scroll Coordinates & Sefaria Grid HUD
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onTriggerRealign}
              title="გასწორების ხელახლა გაშვება"
              className="p-1 rounded hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'გაშლა' : 'დაკეცვა'}
              className="p-1 rounded hover:bg-stone-500/20 text-stone-600 dark:text-stone-300 cursor-pointer"
            >
              {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={onToggleVisible}
              title="HUD-ის დახურვა"
              className="p-1 rounded hover:bg-rose-500/20 text-rose-500 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Status Pill Strip */}
        <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-b border-[#8B5A2B]/15 text-[10px]">
          <div className="flex items-center gap-1">
            {isLocked ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> 🎯 პოზიცია ზუსტია (Locked)
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-3 h-3" /> ⚠️ ცდომილება {absDelta}px
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                <AlertTriangle className="w-3 h-3" /> ❌ გადახრა {absDelta}px
              </span>
            )}
          </div>

          <span className="font-mono text-stone-500 dark:text-stone-400 text-[9.5px]">
            წესრიგი: {metrics?.recalculationCount ?? 0} კორექცია
          </span>
        </div>

        {/* Detailed Metrics Panel (when expanded) */}
        {!isCollapsed && metrics && (
          <div className="p-3 text-[10px] space-y-1.5 font-mono">
            {activeAnchor && (
              <div className="pb-1.5 border-b border-[#8B5A2B]/20">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-sans">
                  <span className="font-bold">წყარო / Sefaria Ref:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {activeAnchor.ref}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 font-sans text-[9.5px]">
                  <span>ტიპი: {activeAnchor.matchType}</span>
                  <span dir="rtl">{activeAnchor.labelHe}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
              <div className="text-stone-500 dark:text-stone-400">Target Element:</div>
              <div className="text-right truncate font-bold text-amber-700 dark:text-amber-300" title={metrics.elementId || '—'}>
                {metrics.elementId || '—'}
              </div>

              <div className="text-stone-500 dark:text-stone-400">Target Doc Y:</div>
              <div className="text-right font-bold">{metrics.targetDocY}px</div>

              <div className="text-stone-500 dark:text-stone-400">Calculated Target:</div>
              <div className="text-right font-bold text-blue-600 dark:text-blue-400">
                {metrics.calculatedTargetScrollTop}px
              </div>

              <div className="text-stone-500 dark:text-stone-400">Actual ScrollTop:</div>
              <div className="text-right font-bold">{metrics.currentScrollTop}px</div>

              <div className="text-stone-500 dark:text-stone-400">Offset Delta (Δ):</div>
              <div
                className={`text-right font-extrabold ${
                  isLocked ? 'text-emerald-600 dark:text-emerald-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}px
              </div>

              <div className="text-stone-500 dark:text-stone-400">Element Height:</div>
              <div className="text-right">{metrics.targetElementHeight}px</div>

              <div className="text-stone-500 dark:text-stone-400">Trigger Cause:</div>
              <div className="text-right text-[9px] text-amber-600 dark:text-amber-400 truncate">
                {metrics.cause}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-1 border-t border-[#8B5A2B]/15 font-sans">
              <span className="text-[9px] text-stone-500">ResizeObserver რეაგირებს Sefaria-ს დატვირთვაზე</span>
              <button
                type="button"
                onClick={onTriggerRealign}
                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9.5px] cursor-pointer transition-colors"
              >
                გასწორება
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
