// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  GripHorizontal,
  BookOpen,
  ExternalLink,
  Loader2,
  Crosshair,
} from 'lucide-react';
import {
  DafPageData,
  SelectedDafTarget,
  TalmudSentence,
  AnalysisMode,
} from '../types/talmud';
import {
  TRACTATES,
  generateDafListForTractate,
  toHebrewDafNumber,
} from '../data/tractates';
import { getCuratedOrDynamicDaf } from '../data/curatedDapim';
import { getBuiltinSefariaCommentaries } from '../data/sefariaCommentators';
import {
  translateToGeorgianLive,
  normalizeGeorgianJewishTerms,
} from '../utils/georgianTranslator';
import { VilnaPdfInteractiveViewer, hasAuthenticVilnaScan } from './VilnaPdfInteractiveViewer';
import { CitedDafTextView } from './CitedDafTextView';
import { WindowsWindowControls } from './WindowsWindowControls';

export interface FloatingSourceCitationRequest {
  tractateId: string;
  dafId: string;
  citeHe?: string;
  citeEn?: string;
  citeKa?: string;
  snippetHe?: string;
  highlightSnippetHe?: string;
  originLabelKa?: string;
  sourceContextLabelKa?: string;
  originLabelHe?: string;
  anchorRect?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width?: number;
    height?: number;
  } | null;
}

export type FloatingSourceDafRequest = FloatingSourceCitationRequest;

interface FloatingSourceDafNoteWindowProps {
  request: FloatingSourceCitationRequest | null;
  onClose: () => void;
  onReturnAndFocusOrigin?: () => void;
  onOpenInMainTalmudView?: (tractateId: string, dafId: string) => void;
  onOpenInMainTalmud?: (tractateId: string, dafId: string) => void;
  onSelectWordOrSentence: (
    word: string,
    sentence: TalmudSentence,
    rect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  selectedTarget?: SelectedDafTarget | null;
  wordExplainStage?: 'none' | 'marked' | 'note' | 'deep';
  onOpenWordNote?: () => void;
  isDark: boolean;
}

function stripHtmlTags(raw: string): string {
  return (raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const FloatingSourceDafNoteWindow: React.FC<FloatingSourceDafNoteWindowProps> = ({
  request,
  onClose,
  onOpenInMainTalmudView,
  onOpenInMainTalmud,
  onSelectWordOrSentence,
  selectedTarget = null,
  wordExplainStage = 'none',
  onOpenWordNote,
  isDark,
}) => {
  const effectiveOpenInMainTalmud = onOpenInMainTalmudView || onOpenInMainTalmud;

  // Resolve canonical Tractate ID (case-insensitive / hyphen-tolerant)
  const resolveTractateMeta = useCallback((rawId: string) => {
    const norm = (rawId || 'Berakhot').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return (
      TRACTATES.find(
        (t) =>
          t.id.toLowerCase() === norm ||
          t.id.toLowerCase().replace(/_/g, '-') === rawId.trim().toLowerCase() ||
          t.nameEn.toLowerCase() === rawId.trim().toLowerCase() ||
          t.nameHe === rawId.trim() ||
          t.nameKa === rawId.trim()
      ) || TRACTATES[0]
    );
  }, []);

  const resolvedInitialSnippet =
    request?.snippetHe || request?.highlightSnippetHe || request?.citeHe || '';
  const resolvedOriginLabelKa =
    request?.originLabelKa || request?.sourceContextLabelKa || '';

  const [activeTractateId, setActiveTractateId] = useState<string>(() =>
    request ? resolveTractateMeta(request.tractateId).id : 'Berakhot'
  );
  const [activeDafId, setActiveDafId] = useState<string>(() => request?.dafId || '2a');
  const [activeCiteHe, setActiveCiteHe] = useState<string>(() => request?.citeHe || '');
  const [activeSnippetHe, setActiveSnippetHe] = useState<string>(() => resolvedInitialSnippet);
  const [deepLinkSeq, setDeepLinkSeq] = useState<number>(1);
  const [focusedSegmentInfo, setFocusedSegmentInfo] = useState<{
    sentence: TalmudSentence;
    topPct: number;
    leftPct: number;
    widthPct: number;
    heightPct: number;
    lineTextHe: string;
  } | null>(null);

  // Windows-style window states: Minimized (`—`), Maximized (`□` / `❐`), Zoom, Drag offset, and User Resize delta
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  // Start at 100% zoom inside the Source Window so the full Vilna PDF file is displayed cleanly just like the main Talmud Daf
  const [noteZoom, setNoteZoom] = useState<number>(100);
  const [viewTab, setViewTab] = useState<'classic' | 'text'>('classic');
  const [autoTranslateInNote, setAutoTranslateInNote] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeDelta, setResizeDelta] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [fallbackDomAnchorRect, setFallbackDomAnchorRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null>(null);
  const [viewportDims, setViewportDims] = useState<{ vw: number; vh: number }>(() => ({
    vw: typeof window !== 'undefined' ? window.innerWidth : 1200,
    vh: typeof window !== 'undefined' ? window.innerHeight : 820,
  }));

  const noteViewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    startX: number;
    startY: number;
    initW: number;
    initH: number;
  } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setViewportDims({ vw: window.innerWidth, vh: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync when a new external citation request arrives — always open as a compact dynamic callout (never full-screen)
  useEffect(() => {
    if (!request) return;
    const tr = resolveTractateMeta(request.tractateId);
    let cleanDaf = (request.dafId || '2a').trim().toLowerCase();
    if (/^\d+$/.test(cleanDaf)) cleanDaf = `${cleanDaf}a`;
    const nextSnippet =
      request.snippetHe || request.highlightSnippetHe || request.citeHe || '';
    setActiveTractateId(tr.id);
    setActiveDafId(cleanDaf);
    setActiveCiteHe(request.citeHe || `${tr.nameHe} ${cleanDaf}`);
    setActiveSnippetHe(nextSnippet);
    setFocusedSegmentInfo(null);
    setDeepLinkSeq((s) => s + 1);
    setIsMinimized(false);
    setIsMaximized(false);
    setNoteZoom(100);
    setDragOffset({ x: 0, y: 0 });
    setResizeDelta({ w: 0, h: 0 });

    if (typeof document !== 'undefined') {
      const originEl = document.querySelector(
        '[data-citation-origin-active="true"], [data-active-talmud-word="true"]'
      ) as HTMLElement | null;
      if (originEl) {
        const r = originEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setFallbackDomAnchorRect({
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            width: r.width,
            height: r.height,
          });
        }
      }
    }
  }, [request, resolveTractateMeta]);

  const currentTractate = useMemo(
    () => resolveTractateMeta(activeTractateId),
    [activeTractateId, resolveTractateMeta]
  );

  const dafList = useMemo(
    () => generateDafListForTractate(currentTractate.lastDaf),
    [currentTractate.lastDaf]
  );

  // Helper to enrich base Daf data with the exact cited snippet when viewing a dynamic Daf so the viewer immediately focuses on the exact cited phrase
  const buildEnrichedBaseDaf = useCallback(
    (trId: string, dafId: string, trNameHe: string, trNameKa: string, snippetHe: string) => {
      const base = getCuratedOrDynamicDaf(trId, dafId, trNameHe, trNameKa);
      const comms = getBuiltinSefariaCommentaries(trId, dafId);
      const cleanSnippet = (snippetHe || '').trim();
      let gemaraList = base.gemara;

      if (cleanSnippet.length >= 6) {
        const plainSnippetWords = cleanSnippet
          .replace(/[\u0591-\u05C7]/g, '')
          .split(/\s+/)
          .filter((w) => w.length >= 3);
        const alreadyExists = gemaraList.some((g) => {
          const gPlain = (g.hebrewText || '').replace(/[\u0591-\u05C7]/g, '');
          return plainSnippetWords.some((w) => gPlain.includes(w));
        });

        if (!alreadyExists && gemaraList.length > 0) {
          const focusedGemaraSent: TalmudSentence = {
            ...gemaraList[0],
            id: `cited-focus-${trId}-${dafId}`,
            source: 'gemara',
            dibburHamatchil: activeCiteHe || `${trNameHe} ${dafId}`,
            hebrewText: `${cleanSnippet} — ${gemaraList[0].hebrewText}`,
            translationHe: cleanSnippet,
            translationKa: `${trNameKa} ${dafId} (ციტირებული მონაკვეთი): ${gemaraList[0].translationKa}`,
          };
          gemaraList = [focusedGemaraSent, ...gemaraList.slice(1)];
        }
      }

      return {
        ...base,
        gemara: gemaraList,
        allCommentaries:
          base.allCommentaries && base.allCommentaries.length > 0
            ? base.allCommentaries
            : comms,
      };
    },
    [activeCiteHe]
  );

  // Build DafPageData for the cited source (instant curated/dynamic + live Sefaria enrichment)
  const [citedDafData, setCitedDafData] = useState<DafPageData>(() => {
    const tr = resolveTractateMeta(activeTractateId);
    return buildEnrichedBaseDaf(
      tr.id,
      activeDafId,
      tr.nameHe,
      tr.nameKa,
      resolvedInitialSnippet
    );
  });
  const [loadingLiveSource, setLoadingLiveSource] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const tr = currentTractate;
    const enrichedBase = buildEnrichedBaseDaf(
      tr.id,
      activeDafId,
      tr.nameHe,
      tr.nameKa,
      activeSnippetHe
    );
    setCitedDafData(enrichedBase);
    setDeepLinkSeq((s) => s + 1);

    const isCurated =
      (tr.id === 'Berakhot' && (activeDafId === '2a' || activeDafId === '2b')) ||
      (tr.id === 'Taanit' && (activeDafId === '2a' || activeDafId === '5a')) ||
      (tr.id === 'Shabbat' && (activeDafId === '2a' || activeDafId === '21b'));

    if (isCurated) {
      setLoadingLiveSource(false);
      return;
    }

    setLoadingLiveSource(true);
    fetch(
      `https://www.sefaria.org/api/texts/${encodeURIComponent(
        `${tr.id}.${activeDafId}`
      )}?commentary=1&context=0`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (cancelled || !data) return;
        const heArr: string[] = Array.isArray(data.he)
          ? data.he
              .flat()
              .map((s: unknown) => (typeof s === 'string' ? stripHtmlTags(s) : ''))
              .filter(Boolean)
          : [];
        const enArr: string[] = Array.isArray(data.text)
          ? data.text
              .flat()
              .map((s: unknown) => (typeof s === 'string' ? stripHtmlTags(s) : ''))
              .filter(Boolean)
          : [];

        if (heArr.length === 0) return;

        // Find the segment in Sefaria's array that best matches activeSnippetHe so we include it even if it's beyond index 8
        const snippetTokens = (activeSnippetHe || '')
          .replace(/[\u0591-\u05C7]/g, '')
          .split(/\s+/)
          .map((w) => w.replace(/[^א-ת]/g, ''))
          .filter((w) => w.length >= 3);

        let bestMatchIndex = 0;
        let bestMatchScore = 0;
        if (snippetTokens.length > 0) {
          heArr.forEach((rawSeg, idx) => {
            const plainSeg = rawSeg.replace(/[\u0591-\u05C7]/g, '');
            let score = 0;
            for (const tok of snippetTokens) {
              if (plainSeg.includes(tok)) score += 3;
            }
            if (score > bestMatchScore) {
              bestMatchScore = score;
              bestMatchIndex = idx;
            }
          });
        }

        const startSlice = Math.max(0, Math.min(bestMatchIndex - 2, heArr.length - 8));
        const slicedIndices = Array.from(
          { length: Math.min(8, heArr.length) },
          (_, k) => startSlice + k
        );

        const builtGemara: TalmudSentence[] = await Promise.all(
          slicedIndices.map(async (origIdx, i) => {
            const heText = heArr[origIdx] || '';
            const enText = enArr[origIdx] || '';
            let kaText = '';
            if (i < 4 || origIdx === bestMatchIndex) {
              try {
                kaText = await translateToGeorgianLive(
                  enText || heText,
                  enText ? 'en' : 'iw'
                );
              } catch {
                kaText = normalizeGeorgianJewishTerms(enText);
              }
            }
            return {
              id: `note-live-${tr.id}-${activeDafId}-g${origIdx + 1}`,
              source: 'gemara',
              hebrewText: heText,
              translationHe: heText,
              translationKa:
                kaText ||
                enrichedBase.gemara[0]?.translationKa ||
                `${tr.nameKa} ${activeDafId} — გემარის სუგია (მუხლი ${origIdx + 1}).`,
              explanationKa: `${tr.nameKa} ${activeDafId} (${tr.nameHe})`,
              explanationHe: heText,
            };
          })
        );

        let builtRashi = enrichedBase.rashi;
        let builtTosafot = enrichedBase.tosafot;
        if (Array.isArray(data.commentary) && data.commentary.length > 0) {
          const rItems = data.commentary
            .filter(
              (c: { collectiveTitle?: { en?: string }; he?: unknown }) =>
                typeof c.he === 'string' &&
                /Rashi/i.test(c.collectiveTitle?.en || '')
            )
            .slice(0, 5);
          const tItems = data.commentary
            .filter(
              (c: { collectiveTitle?: { en?: string }; he?: unknown }) =>
                typeof c.he === 'string' &&
                /Tosafot/i.test(c.collectiveTitle?.en || '')
            )
            .slice(0, 5);

          if (rItems.length > 0) {
            builtRashi = rItems.map(
              (c: { he: string; anchorText?: string }, idx: number) => ({
                id: `note-live-${tr.id}-${activeDafId}-r${idx + 1}`,
                source: 'rashi',
                dibburHamatchil: c.anchorText || 'ד״ה',
                hebrewText: stripHtmlTags(c.he),
                translationHe: stripHtmlTags(c.he),
                translationKa: `რაშის განმარტება (${tr.nameKa} ${activeDafId}).`,
                explanationKa: `რაში (${tr.nameKa} ${activeDafId})`,
                explanationHe: stripHtmlTags(c.he),
              })
            );
          }
          if (tItems.length > 0) {
            builtTosafot = tItems.map(
              (c: { he: string; anchorText?: string }, idx: number) => ({
                id: `note-live-${tr.id}-${activeDafId}-t${idx + 1}`,
                source: 'tosafot',
                dibburHamatchil: c.anchorText || 'ד״ה',
                hebrewText: stripHtmlTags(c.he),
                translationHe: stripHtmlTags(c.he),
                translationKa: `თოსაფოთის ანალიზი (${tr.nameKa} ${activeDafId}).`,
                explanationKa: `თოსაფოთი (${tr.nameKa} ${activeDafId})`,
                explanationHe: stripHtmlTags(c.he),
              })
            );
          }
        }

        if (!cancelled) {
          setCitedDafData((prev) => ({
            ...prev,
            gemara: builtGemara,
            rashi: builtRashi,
            tosafot: builtTosafot,
          }));
          // Re-trigger deep link auto-focus on the newly loaded Sefaria sentences
          setDeepLinkSeq((s) => s + 1);
        }
      })
      .catch(() => {
        // Keep curated/dynamic fallback
      })
      .finally(() => {
        if (!cancelled) setLoadingLiveSource(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTractate, activeDafId, activeSnippetHe, buildEnrichedBaseDaf]);

  // Step Previous / Next Daf inside the Floating Source Note Window
  const handlePrevDafInNote = useCallback(() => {
    setActiveDafId((cur) => {
      const idx = dafList.indexOf(cur);
      return idx > 0 ? dafList[idx - 1] : cur;
    });
  }, [dafList]);

  const handleNextDafInNote = useCallback(() => {
    setActiveDafId((cur) => {
      const idx = dafList.indexOf(cur);
      return idx >= 0 && idx < dafList.length - 1 ? dafList[idx + 1] : cur;
    });
  }, [dafList]);

  // Dragging & resizing handlers for moving/resizing the Floating Source Note Window
  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (dragStateRef.current) {
        setDragOffset({
          x: dragStateRef.current.initX + (clientX - dragStateRef.current.startX),
          y: dragStateRef.current.initY + (clientY - dragStateRef.current.startY),
        });
      } else if (resizeStateRef.current) {
        setResizeDelta({
          w: resizeStateRef.current.initW + (clientX - resizeStateRef.current.startX),
          h: resizeStateRef.current.initH + (clientY - resizeStateRef.current.startY),
        });
      }
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && (dragStateRef.current || resizeStateRef.current)) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onUp = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  if (!request || typeof document === 'undefined') return null;

  const dafNumInt = parseInt(activeDafId, 10) || 2;
  const dafMarkHe = `${toHebrewDafNumber(dafNumInt)}${activeDafId.endsWith('b') ? ':' : '.'}`;

  const primarySentence =
    focusedSegmentInfo?.sentence ||
    citedDafData.gemara[0] ||
    citedDafData.mishnah[0] ||
    citedDafData.rashi[0];

  // Dynamic, non-fullscreen sizing that adapts to content & available space around the clicked link
  const { vw, vh } = viewportDims;
  const isMobile = vw < 640;
  const contentCharLen = (primarySentence?.translationKa || '').length + (activeSnippetHe || '').length;
  const dynamicContentHeightBoost = Math.min(70, Math.round(contentCharLen * 0.22));

  const ar = request.anchorRect || fallbackDomAnchorRect;
  const hasValidAnchor =
    Boolean(ar) &&
    typeof ar?.left === 'number' &&
    typeof ar?.top === 'number' &&
    ((ar?.width ?? 0) > 0 || (ar?.height ?? 0) > 0);

  const anchorLeft = hasValidAnchor ? (ar!.left ?? vw / 2) : vw / 2 - 40;
  const anchorTop = hasValidAnchor ? (ar!.top ?? vh / 2) : vh / 2 - 12;
  const anchorWidth = hasValidAnchor ? Math.max(16, ar!.width ?? 64) : 80;
  const anchorHeight = hasValidAnchor ? Math.max(14, ar!.height ?? 22) : 24;
  const anchorRight = anchorLeft + anchorWidth;
  const anchorBottom = anchorTop + anchorHeight;
  const anchorCenterX = anchorLeft + anchorWidth / 2;
  const anchorCenterY = anchorTop + anchorHeight / 2;

  // Base dynamic dimensions (compact floating callout, NEVER full screen unless user clicks Maximize)
  const baseDynamicWidth = isMobile
    ? Math.min(vw - 24, Math.max(284, Math.round(vw * 0.86)))
    : Math.min(440, Math.max(340, Math.round(vw * 0.38)));

  const spaceAboveAnchor = Math.max(120, anchorTop - 22);
  const spaceBelowAnchor = Math.max(120, vh - anchorBottom - 22);
  const maxAvailableVerticalSpace = hasValidAnchor
    ? Math.max(spaceAboveAnchor, spaceBelowAnchor)
    : Math.round(vh * 0.56);

  const baseDynamicHeight = isMobile
    ? Math.min(
        Math.max(265, maxAvailableVerticalSpace - 10),
        Math.min(385, Math.round(vh * 0.47) + Math.round(dynamicContentHeightBoost * 0.4))
      )
    : Math.min(
        Math.max(300, Math.round(vh * 0.54)),
        360 + dynamicContentHeightBoost
      );

  const winWidth = isMaximized
    ? vw
    : isMinimized
      ? Math.min(vw - 20, 320)
      : Math.max(260, Math.min(vw - 16, baseDynamicWidth + resizeDelta.w));

  const winHeight = isMaximized
    ? vh
    : isMinimized
      ? 42
      : Math.max(230, Math.min(vh - 48, baseDynamicHeight + resizeDelta.h));

  // Determine placement ('left' | 'right' | 'bottom' | 'top') so the Note window sits right beside/near the link and points to it without covering it
  type CalloutPlacement = 'left' | 'right' | 'bottom' | 'top';
  let placement: CalloutPlacement = 'bottom';
  let baseLeft = Math.max(10, Math.round((vw - winWidth) / 2));
  let baseTop = Math.max(48, Math.round((vh - winHeight) / 2));

  const pointerGap = 14;

  if (hasValidAnchor && !isMaximized) {
    if (!isMobile && anchorLeft >= winWidth + pointerGap + 14) {
      // Place to the LEFT of the link, pointing RIGHT (▶) at the link
      placement = 'left';
      baseLeft = Math.round(anchorLeft - winWidth - pointerGap);
      baseTop = Math.max(
        16,
        Math.min(vh - winHeight - 16, Math.round(anchorCenterY - winHeight * 0.38))
      );
    } else if (!isMobile && vw - anchorRight >= winWidth + pointerGap + 14) {
      // Place to the RIGHT of the link, pointing LEFT (◀) at the link
      placement = 'right';
      baseLeft = Math.round(anchorRight + pointerGap);
      baseTop = Math.max(
        16,
        Math.min(vh - winHeight - 16, Math.round(anchorCenterY - winHeight * 0.38))
      );
    } else if (spaceBelowAnchor >= spaceAboveAnchor) {
      // Place BELOW the link, pointing UP (▲) at the link
      placement = 'bottom';
      baseLeft = Math.max(
        10,
        Math.min(vw - winWidth - 10, Math.round(anchorCenterX - winWidth / 2))
      );
      baseTop = Math.min(
        vh - winHeight - 10,
        Math.max(anchorBottom + pointerGap, 44)
      );
    } else {
      // Place ABOVE the link, pointing DOWN (▼) at the link
      placement = 'top';
      baseLeft = Math.max(
        10,
        Math.min(vw - winWidth - 10, Math.round(anchorCenterX - winWidth / 2))
      );
      baseTop = Math.max(
        10,
        Math.min(anchorTop - winHeight - pointerGap, vh - winHeight - 12)
      );
    }
  }

  const finalLeft = isMaximized
    ? 0
    : Math.max(6, Math.min(vw - winWidth - 6, baseLeft + dragOffset.x));
  const finalTop = isMaximized
    ? 0
    : Math.max(6, Math.min(vh - 44, baseTop + dragOffset.y));

  // Compute exact pointer beak coordinates along the Note Window edge so it points directly to the clicked link text
  const beakXInWindow = Math.max(
    22,
    Math.min(winWidth - 22, Math.round(anchorCenterX - finalLeft))
  );
  const beakYInWindow = Math.max(
    22,
    Math.min(winHeight - 22, Math.round(anchorCenterY - finalTop))
  );

  // Compute tip point on the Note Window border for the SVG connector line to the origin link text
  const windowAnchorPoint = (() => {
    if (placement === 'bottom') {
      return { x: finalLeft + beakXInWindow, y: finalTop };
    }
    if (placement === 'top') {
      return { x: finalLeft + beakXInWindow, y: finalTop + winHeight };
    }
    if (placement === 'left') {
      return { x: finalLeft + winWidth, y: finalTop + beakYInWindow };
    }
    return { x: finalLeft, y: finalTop + beakYInWindow };
  })();

  const borderColorHex = isDark ? '#C49A6C' : '#6B4226';
  const bgColorHex = isDark ? '#1B120C' : '#FAF3E3';

  return createPortal(
    <>
      {/* VISUAL POINTER CONNECTOR & ORIGIN LINK HIGHLIGHT RING (Points directly to the link text from which we navigated) */}
      {false && (
        <div className="fixed inset-0 pointer-events-none z-[277]">
          {/* Pulsing highlight frame around the origin citation link text */}
          <div
            style={{
              position: 'fixed',
              left: `${Math.round(anchorLeft - 4)}px`,
              top: `${Math.round(anchorTop - 3)}px`,
              width: `${Math.round(anchorWidth + 8)}px`,
              height: `${Math.round(anchorHeight + 6)}px`,
            }}
            className="rounded-md border-2 border-amber-500 bg-amber-400/20 shadow-[0_0_14px_rgba(245,158,11,0.65)] animate-pulse"
          />

          {/* Crisp SVG pointer line & arrowhead pointing from the Note Window beak to the clicked link text */}
          <svg className="w-full h-full overflow-visible">
            <defs>
              <marker
                id="source-note-origin-arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path
                  d="M 0 0 L 8 4 L 0 8 z"
                  fill={isDark ? '#F59E0B' : '#B45309'}
                />
              </marker>
            </defs>
            <line
              x1={windowAnchorPoint.x}
              y1={windowAnchorPoint.y}
              x2={anchorCenterX}
              y2={anchorCenterY}
              stroke={isDark ? '#F59E0B' : '#B45309'}
              strokeWidth="2.2"
              strokeDasharray="4 3"
              markerEnd="url(#source-note-origin-arrowhead)"
            />
          </svg>
        </div>
      )}

      <div
        style={
          isMaximized
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 280,
                width: '100vw',
                height: '100dvh',
              }
            : {
                position: 'fixed',
                left: `${finalLeft}px`,
                top: `${finalTop}px`,
                width: `${winWidth}px`,
                height: isMinimized ? 'auto' : `${winHeight}px`,
                zIndex: 278,
              }
        }
        onClick={(e) => e.stopPropagation()}
        className={`pointer-events-auto relative flex flex-col transition-shadow duration-200 ${
          isMaximized ? 'rounded-none border-0' : 'rounded-2xl border-2'
        } ${
          isDark
            ? 'bg-[#1B120C]/98 border-[#C49A6C]/80 text-[#FAF5EB] shadow-[0_18px_48px_rgba(0,0,0,0.82)]'
            : 'bg-[#FAF3E3]/98 border-[#6B4226]/80 text-[#2C1A10] shadow-[0_16px_44px_rgba(44,26,16,0.38)]'
        }`}
      >
        {/* CALLOUT POINTER BEAK ATTACHED TO THE NOTE WINDOW BORDER POINTING TO THE ORIGIN LINK TEXT */}
        {/* Beak on the window border pointing at the origin marker (no extra arrow or ring). */}
        {hasValidAnchor && !isMaximized && (
          <div
            aria-hidden="true"
            style={
              placement === 'bottom'
                ? {
                    position: 'absolute',
                    top: '-9px',
                    left: `${beakXInWindow - 8}px`,
                    width: '16px',
                    height: '16px',
                    backgroundColor: isDark ? '#2B1C12' : '#EAD9BC',
                    borderTop: `2px solid ${borderColorHex}`,
                    borderLeft: `2px solid ${borderColorHex}`,
                    transform: 'rotate(45deg)',
                    zIndex: 30,
                  }
                : placement === 'top'
                  ? {
                      position: 'absolute',
                      bottom: '-9px',
                      left: `${beakXInWindow - 8}px`,
                      width: '16px',
                      height: '16px',
                      backgroundColor: bgColorHex,
                      borderBottom: `2px solid ${borderColorHex}`,
                      borderRight: `2px solid ${borderColorHex}`,
                      transform: 'rotate(45deg)',
                      zIndex: 30,
                    }
                  : placement === 'left'
                    ? {
                        position: 'absolute',
                        right: '-9px',
                        top: `${beakYInWindow - 8}px`,
                        width: '16px',
                        height: '16px',
                        backgroundColor: bgColorHex,
                        borderTop: `2px solid ${borderColorHex}`,
                        borderRight: `2px solid ${borderColorHex}`,
                        transform: 'rotate(45deg)',
                        zIndex: 30,
                      }
                    : {
                        position: 'absolute',
                        left: '-9px',
                        top: `${beakYInWindow - 8}px`,
                        width: '16px',
                        height: '16px',
                        backgroundColor: bgColorHex,
                        borderBottom: `2px solid ${borderColorHex}`,
                        borderLeft: `2px solid ${borderColorHex}`,
                        transform: 'rotate(45deg)',
                        zIndex: 30,
                      }
            }
          />
        )}

        {/* INNER CLIPPED CONTAINER */}
        <div
          className={`flex flex-col flex-1 min-h-0 overflow-hidden ${
            isMaximized ? '' : 'rounded-[14px]'
          }`}
        >
          {/* TOP DRAGGABLE HEADER BAR WITH WINDOWS-STYLE MINIMIZE / MAXIMIZE / RESTORE / CLOSE CONTROLS */}
          <div
            onMouseDown={(e) => {
              if (isMaximized || (e.target as HTMLElement).closest('button')) return;
              dragStateRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initX: dragOffset.x,
                initY: dragOffset.y,
              };
            }}
            onTouchStart={(e) => {
              if (
                isMaximized ||
                e.touches.length !== 1 ||
                (e.target as HTMLElement).closest('button')
              ) {
                return;
              }
              dragStateRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                initX: dragOffset.x,
                initY: dragOffset.y,
              };
            }}
            className={`px-2.5 py-1.5 border-b flex items-center justify-between gap-2 select-none shrink-0 ${
              isMaximized ? '' : 'cursor-move'
            } ${
              isDark
                ? 'bg-gradient-to-r from-[#2B1C12] via-[#382417] to-[#24170F] border-[#C49A6C]/40'
                : 'bg-gradient-to-r from-[#EAD9BC] via-[#DFC9A3] to-[#EAD9BC] border-[#8B5A2B]/40'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <GripHorizontal className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[11.5px] font-black truncate">
                    წყარო: {currentTractate.nameKa} {activeDafId}
                  </span>
                  <span
                    dir="rtl"
                    className="font-serif text-xs font-black text-amber-600 dark:text-amber-300 shrink-0"
                  >
                    ({currentTractate.nameHe} {dafMarkHe})
                  </span>
                </div>
                {resolvedOriginLabelKa && !isMinimized && (
                  <div className="text-[9.5px] opacity-85 truncate">
                    ლინკიდან: {resolvedOriginLabelKa}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Windows-Style Window Controls (— / □ / ✕) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <WindowsWindowControls
                size="sm"
                isDark={isDark}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized((v) => !v)}
                isMaximized={isMaximized}
                onToggleMaximize={() => {
                  setIsMaximized((v) => !v);
                  setIsMinimized(false);
                }}
                onClose={onClose}
              />
            </div>
          </div>

          {/* BODY OF FLOATING SOURCE DAF NOTE WINDOW (Hidden when minimized via `—`) */}
          {!isMinimized && (
            <>
              {/* SECONDARY NAVIGATION, FOCUS & ZOOM TOOLBAR INSIDE THE NOTE WINDOW */}
              <div
                className={`px-2 py-1 border-b flex flex-wrap items-center justify-between gap-1 text-[10.5px] shrink-0 ${
                  isDark
                    ? 'bg-[#23170F] border-[#C49A6C]/30'
                    : 'bg-[#F3E6CE] border-[#8B5A2B]/30'
                }`}
              >
                {/* Prev / Next Daf Stepper + Re-Focus Button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevDafInNote}
                    className={`px-1.5 py-0.5 rounded-lg border font-extrabold flex items-center gap-0.5 cursor-pointer ${
                      isDark
                        ? 'bg-[#160F0A] hover:bg-[#312015] border-[#C49A6C]/40 text-[#FAF5EB]'
                        : 'bg-[#FAF5EB] hover:bg-[#E5D3B3] border-[#8B5A2B]/40 text-[#2C1A10]'
                    }`}
                    title="წინა დაფი"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <span className="px-1.5 py-0.5 rounded-lg font-black bg-amber-500/15 border border-amber-500/35">
                    {activeDafId} ({dafMarkHe})
                  </span>

                  <button
                    type="button"
                    onClick={handleNextDafInNote}
                    className={`px-1.5 py-0.5 rounded-lg border font-extrabold flex items-center gap-0.5 cursor-pointer ${
                      isDark
                        ? 'bg-[#160F0A] hover:bg-[#312015] border-[#C49A6C]/40 text-[#FAF5EB]'
                        : 'bg-[#FAF5EB] hover:bg-[#E5D3B3] border-[#8B5A2B]/40 text-[#2C1A10]'
                    }`}
                    title="შემდეგი დაფი"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeepLinkSeq((s) => s + 1)}
                    className="px-2 py-0.5 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="ზუსტად ციტირებულ მონაკვეთზე ფოკუსირება"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>ფოკუსი</span>
                  </button>
                </div>

                {/* Zoom & Optional Open in Main View Controls */}
                <div className="flex items-center gap-1">
                  {loadingLiveSource && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] text-amber-500 font-bold mr-0.5">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setNoteZoom((z) => Math.max(80, z - 15))}
                    className="p-0.5 rounded border border-[#8B5A2B]/35 hover:bg-amber-500/20 cursor-pointer"
                    title="დაპატარავება"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteZoom(100)}
                    className="px-1 py-0.5 rounded border border-[#8B5A2B]/35 text-[9.5px] font-black cursor-pointer"
                    title="საწყისი ზომა (100%)"
                  >
                    {noteZoom}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteZoom((z) => Math.min(220, z + 15))}
                    className="p-0.5 rounded border border-[#8B5A2B]/35 hover:bg-amber-500/20 cursor-pointer"
                    title="გადიდება"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>

                  {effectiveOpenInMainTalmud && (
                    <button
                      type="button"
                      onClick={() => {
                        effectiveOpenInMainTalmud(currentTractate.id, activeDafId);
                        onClose();
                      }}
                      title="ამ დაფის მთავარ ეკრანზე გახსნა"
                      className="px-1.5 py-0.5 rounded-lg bg-[#6B4226]/85 hover:bg-[#6B4226] text-[#FAF5EB] text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">მთავარში</span>
                    </button>
                  )}
                </div>
              </div>

              {/* EMBEDDED INTERACTIVE VILNA DAF VIEWPORT (Auto-scrolls directly to the cited segment) */}
              <div
                ref={noteViewportRef}
                data-source-note-scroll-viewport="true"
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const d = Math.hypot(
                      e.touches[1].clientX - e.touches[0].clientX,
                      e.touches[1].clientY - e.touches[0].clientY
                    );
                    pinchRef.current = { startDist: Math.max(18, d), startZoom: noteZoom };
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && pinchRef.current) {
                    const d = Math.hypot(
                      e.touches[1].clientX - e.touches[0].clientX,
                      e.touches[1].clientY - e.touches[0].clientY
                    );
                    const next = Math.round(
                      Math.max(
                        80,
                        Math.min(
                          220,
                          pinchRef.current.startZoom * (d / pinchRef.current.startDist)
                        )
                      )
                    );
                    setNoteZoom(next);
                  }
                }}
                onTouchEnd={() => {
                  pinchRef.current = null;
                }}
                style={{ overscrollBehavior: 'contain' }}
                className="flex-1 min-h-0 overflow-auto overscroll-contain p-1.5 bg-[#F2E6CF] dark:bg-[#140D08]"
              >
                <div
                  style={{
                    width: `${noteZoom}%`,
                    minWidth: '100%',
                    transformOrigin: 'top center',
                  }}
                  className="mx-auto"
                >
                  <div className="sticky top-0 z-30 mb-1.5 flex justify-center">
                    <div
                      role="tablist"
                      className={`inline-flex gap-1 rounded-full border p-0.5 text-[11px] font-semibold shadow-sm backdrop-blur ${
                        isDark ? 'border-amber-900/50 bg-black/60' : 'border-amber-800/25 bg-white/75'
                      }`}
                    >
                      {([
                        ['classic', 'კლასიკური დაფი'],
                        ['text', 'ტექსტი'],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={viewTab === key}
                          onClick={() => setViewTab(key)}
                          className={`rounded-full px-3 py-1 transition-colors ${
                            viewTab === key
                              ? 'bg-amber-700 text-amber-50'
                              : isDark
                                ? 'text-amber-200/80'
                                : 'text-amber-900/80'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {viewTab === 'text' ? (
                    <CitedDafTextView
                      dafData={citedDafData}
                      tractateNameHe={currentTractate.nameHe}
                      dafMarkHe={dafMarkHe}
                      snippetHe={activeSnippetHe}
                      loading={loadingLiveSource}
                      isDark={isDark}
                    />
                  ) : (
                  <VilnaPdfInteractiveViewer
                    dafData={citedDafData}
                    tractateNameHe={currentTractate.nameHe}
                    tractateNameKa={currentTractate.nameKa}
                    dafMarkHe={dafMarkHe}
                    effectiveMishnah={citedDafData.mishnah}
                    effectiveGemara={citedDafData.gemara}
                    effectiveRashi={citedDafData.rashi}
                    effectiveTosafot={citedDafData.tosafot}
                    isDark={isDark}
                    fontScaleRatio={noteZoom / 100}
                    selectedTarget={selectedTarget}
                    wordExplainStage={wordExplainStage}
                    onOpenWordNote={onOpenWordNote}
                    autoTranslateLineMode={autoTranslateInNote}
                    onToggleAutoTranslateLineMode={() => setAutoTranslateInNote((v) => !v)}
                    deepLinkedCitationLabelHe={
                      activeCiteHe || `${currentTractate.nameHe} ${dafMarkHe}`
                    }
                    deepLinkedCitationSnippetHe={activeSnippetHe}
                    deepLinkTriggerSeq={deepLinkSeq}
                    isFullScreen={isMaximized}
                    isEmbeddedInNoteWindow={true}
                    onDeepLinkTargetResolved={(info) => {
                      setFocusedSegmentInfo(info);
                    }}
                    onNavigateToCitation={(nextTrId, nextDafId, nextCiteHe, originCtx) => {
                      const resolvedNext = resolveTractateMeta(nextTrId);
                      setActiveTractateId(resolvedNext.id);
                      setActiveDafId(nextDafId);
                      setActiveCiteHe(nextCiteHe);
                      setActiveSnippetHe(originCtx?.contextSnippetHe || nextCiteHe);
                      setDeepLinkSeq((s) => s + 1);
                    }}
                    onSelectWordOrSentence={onSelectWordOrSentence}
                  />
                  )}
                </div>
              </div>

              {/* BOTTOM FOCUSED SEGMENT SUMMARY & GEORGIAN TRANSLATION STRIP */}
              {primarySentence && (
                <div
                  className={`px-2.5 py-1.5 border-t text-xs shrink-0 max-h-[88px] overflow-y-auto ${
                    isDark
                      ? 'bg-[#22160E] border-[#C49A6C]/35 text-[#FAF5EB]'
                      : 'bg-[#EFE1C6] border-[#8B5A2B]/35 text-[#2C1A10]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-extrabold text-[10.5px] text-[#8B5A2B] dark:text-amber-300 truncate">
                      🎯 ფოკუსირებული მონაკვეთი ({currentTractate.nameKa} {activeDafId}):
                    </span>
                    <span
                      dir="rtl"
                      className="font-serif font-bold text-[11px] text-amber-700 dark:text-amber-300 truncate max-w-[55%]"
                    >
                      {focusedSegmentInfo?.lineTextHe || activeCiteHe}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug font-medium">
                    {primarySentence.translationKa}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* DYNAMIC CORNER RESIZE HANDLE (Allows user to freely adjust the Note window dimensions) */}
        {!isMaximized && !isMinimized && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              resizeStateRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initW: resizeDelta.w,
                initH: resizeDelta.h,
              };
            }}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              e.stopPropagation();
              resizeStateRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                initW: resizeDelta.w,
                initH: resizeDelta.h,
              };
            }}
            title="გადასწიეთ კუთხე ფანჯრის ზომის შესაცვლელად"
            className="absolute bottom-0.5 right-0.5 w-4 h-4 cursor-nwse-resize z-30 flex items-end justify-end p-0.5 opacity-60 hover:opacity-100"
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current">
              <path d="M9 1v8H1L9 1z" />
            </svg>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
