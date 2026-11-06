// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  Volume2,
  Sparkles,
  BookOpen,
  Languages,
  FileText,
  BookmarkPlus,
  Layers,
  Loader2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  PanelBottom,
  Square,
} from 'lucide-react';
import {
  AnalysisMode,
  SefariaCommentaryItem,
  SelectedDafTarget,
  TalmudSentence,
  UILang,
  WordSentenceAnalysisResult,
} from '../types/talmud';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { ReadingLineGuide } from './ReadingLineGuide';
import { WindowsWindowControls } from './WindowsWindowControls';
import {
  containsLatinButNoGeorgian,
  sanitizeGeorgianText,
  translateTextToLangLive,
  translateToGeorgianLive,
} from '../utils/georgianTranslator';

interface WordSentencePopoverProps {
  target: SelectedDafTarget;
  analysis: WordSentenceAnalysisResult | null;
  loading: boolean;
  activeMode: AnalysisMode;
  onSelectMode: (mode: AnalysisMode) => void;
  onSelectWord?: (word: string, sentence: TalmudSentence, rect: DOMRect) => void;
  onClose: () => void;
  onAddNote: (noteText: string) => void;
  allCommentaries?: SefariaCommentaryItem[];
  isDark: boolean;
  uiLang: UILang;
  stage?: 'note' | 'deep';
  onOpenDeepStudy?: (mode?: AnalysisMode) => void;
  onBackToNote?: () => void;
}

const DROPDOWN_OPTIONS: SelectOption[] = [
  {
    value: 'word-he',
    badgeHe: 'מילה • עברית',
    label: 'სიტყვა: თარგმანი — ყივრითული (עברית)',
    sublabel: 'არჩეული სიტყვის თარგმანი თანამედროვე ებრაულ ენაზე',
  },
  {
    value: 'word-ka',
    badgeHe: 'מילה • גאורגית',
    label: 'სიტყვა: თარგმანი — ქართული',
    sublabel: 'არჩეული სიტყვის ზუსტი ქართული თარგმანი და ტრანსლიტერაცია',
  },
  {
    value: 'word-explain',
    badgeHe: 'מילה • ביאור',
    label: 'სიტყვა: სიტყვის განმარტება (שורש ודקדוק)',
    sublabel: 'ფუძე (შორეში), გრამატიკა და თალმუდური ეტიმოლოგია',
  },
  {
    value: 'sentence-he',
    badgeHe: 'משפט • עברית',
    label: 'წინადადება: თარგმანი — ყივრითული (עברית)',
    sublabel: 'მთლიანი წინადადების თარგმანი თანამედროვე ებრაულად',
  },
  {
    value: 'sentence-ka',
    badgeHe: 'משפט • גאורגית',
    label: 'წინადადება: თარგმანი — ქართული',
    sublabel: 'მთლიანი წინადადების სრული ქართული თარგმანი',
  },
  {
    value: 'sentence-explain',
    badgeHe: 'משפט • סוגיה',
    label: 'წინადადება: წინადადების განმარტება (שקלא וטריא)',
    sublabel: 'სუგიის ლოგიკა, რაშისა და თოსაფოთის ღრმა ანალიზი',
  },
  {
    value: 'source-lookup',
    badgeHe: 'מקור • פסוק מלא',
    label: 'წყაროს ძიება: მთლიანი ფასუკი / სრული წყარო (מקור הפסוק המלא)',
    sublabel: 'მოაქვს მთლიანი ფასუკი (თორა/თანახი), მიშნა, ბრაითა და პარალელური წყაროები',
  },
  {
    value: 'all-commentaries',
    badgeHe: 'מפרשי ספריא וחברותא',
    label: 'კომენტარები: ხავრუთა, რაში, თოსაფოთი და სეფარიას ყველა კომენტატორი',
    sublabel: 'ხავრუთა, რაში, თოსაფოთი, შტაინზალცი, მეირი, რაშბა, რიტვა, როში, რამბამი, შულხან არუხი...',
  },
];

const LANG_LABELS: Record<UILang, string> = {
  ka: 'ქართული',
  he: 'עברית',
  en: 'English (ინგლისური)',
  ru: 'Русский (რუსული)',
  fr: 'Français (ფრანგული)',
  es: 'Español (ესპანური)',
  de: 'Deutsch (გერმანული)',
};

export const WordSentencePopover: React.FC<WordSentencePopoverProps> = ({
  target,
  analysis,
  loading,
  activeMode,
  onSelectMode,
  onSelectWord,
  onClose,
  onAddNote,
  allCommentaries = [],
  isDark,
  uiLang,
  stage = 'deep',
  onOpenDeepStudy,
  onBackToNote,
}) => {
  const [showAllModes, setShowAllModes] = useState(false);
  const [noteInputOpen, setNoteInputOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);
  const [isNoteMaximized, setIsNoteMaximized] = useState(false);
  // Default to false so the explanation popover stands directly underneath the selected word
  const [dockBottomMode, setDockBottomMode] = useState(false);
  const [isSectionReaderOpen, setIsSectionReaderOpen] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  // Dragging & Zooming state for the explanation screen
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [popoverZoom, setPopoverZoom] = useState<number>(100);
  const dragStartRef = useRef<{ clientX: number; clientY: number; origX: number; origY: number } | null>(
    null
  );
  const pinchStartDistRef = useRef<{ dist: number; startZoom: number } | null>(null);
  const popoverContainerRef = useRef<HTMLDivElement | null>(null);
  const touchScrollGuardYRef = useRef<number | null>(null);
  const touchScrollGuardXRef = useRef<number | null>(null);

  // Prevent scroll-chaining to the underlying Talmud Daf when scrolling inside "ღრმა შესწავლა" or "Note" reaches the top or bottom boundary
  useEffect(() => {
    const rootEl = popoverContainerRef.current;
    if (!rootEl) return;

    const findScrollableAncestorInPopover = (
      startNode: EventTarget | null,
      deltaY: number,
      deltaX: number
    ): { canScrollVertically: boolean; canScrollHorizontally: boolean } => {
      let el = startNode instanceof HTMLElement ? startNode : null;
      let canScrollVertically = false;
      let canScrollHorizontally = false;

      while (el && rootEl.contains(el)) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 1
        ) {
          // deltaY > 0 means finger moves top-to-bottom (pulling down toward scrollTop === 0)
          if (deltaY > 0 && el.scrollTop > 0) {
            canScrollVertically = true;
          }
          // deltaY < 0 means finger moves bottom-to-top (pushing up toward scrollHeight)
          if (deltaY < 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) {
            canScrollVertically = true;
          }
        }

        if (
          (overflowX === 'auto' || overflowX === 'scroll') &&
          el.scrollWidth > el.clientWidth + 1
        ) {
          canScrollHorizontally = true;
        }

        if (el === rootEl) break;
        el = el.parentElement;
      }

      return { canScrollVertically, canScrollHorizontally };
    };

    const onTouchStartNative = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchScrollGuardYRef.current = e.touches[0].clientY;
        touchScrollGuardXRef.current = e.touches[0].clientX;
      } else {
        touchScrollGuardYRef.current = null;
        touchScrollGuardXRef.current = null;
      }
    };

    const onTouchMoveNative = (e: TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length !== 1 || touchScrollGuardYRef.current === null || touchScrollGuardXRef.current === null) {
        return;
      }
      if (dragStartRef.current) return;

      const curY = e.touches[0].clientY;
      const curX = e.touches[0].clientX;
      const dy = curY - touchScrollGuardYRef.current;
      const dx = curX - touchScrollGuardXRef.current;
      touchScrollGuardYRef.current = curY;
      touchScrollGuardXRef.current = curX;

      const { canScrollVertically, canScrollHorizontally } = findScrollableAncestorInPopover(
        e.target,
        dy,
        dx
      );

      if (Math.abs(dx) > Math.abs(dy)) {
        if (!canScrollHorizontally && e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      if (!canScrollVertically && e.cancelable) {
        e.preventDefault();
      }
    };

    const onWheelNative = (e: WheelEvent) => {
      e.stopPropagation();
      const dy = -e.deltaY;
      const dx = -e.deltaX;
      const { canScrollVertically } = findScrollableAncestorInPopover(e.target, dy, dx);
      if (!canScrollVertically && Math.abs(e.deltaY) >= Math.abs(e.deltaX) && e.cancelable) {
        e.preventDefault();
      }
    };

    rootEl.addEventListener('touchstart', onTouchStartNative, { passive: true });
    rootEl.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    rootEl.addEventListener('wheel', onWheelNative, { passive: false });

    return () => {
      rootEl.removeEventListener('touchstart', onTouchStartNative);
      rootEl.removeEventListener('touchmove', onTouchMoveNative);
      rootEl.removeEventListener('wheel', onWheelNative);
    };
  }, [stage, isFullscreen, isWindowMinimized, activeMode, showAllModes]);

  // Live Georgian translation map for any Sefaria commentary that only had English
  const [translatedCommKa, setTranslatedCommKa] = useState<Record<string, string>>({});
  const [savedToFlashcards, setSavedToFlashcards] = useState<boolean>(false);

  useEffect(() => {
    setSavedToFlashcards(false);
  }, [target.word, target.sentence.id]);

  const handleSaveWordToSrs = () => {
    try {
      const raw = localStorage.getItem('talmud-flashcards-srs-v1');
      const list = raw ? JSON.parse(raw) : [];
      const newCard = {
        id: `fc-word-${Date.now()}`,
        termHe: target.word,
        translitKa: analysis?.wordTransliterationGeorgian || target.word,
        meaningKa:
          analysis?.wordTranslationGeorgian ||
          sanitizeGeorgianText(target.sentence.translationKa) ||
          target.word,
        category: 'user-saved',
        exampleHe: target.sentence.hebrewText,
        exampleKa: sanitizeGeorgianText(target.sentence.translationKa),
        boxLevel: 1,
      };
      localStorage.setItem('talmud-flashcards-srs-v1', JSON.stringify([newCard, ...list]));
      setSavedToFlashcards(true);
    } catch {
      setSavedToFlashcards(true);
    }
  };
  // Multi-language translation state when uiLang is en/ru/fr/es/de
  const [multiLangTrans, setMultiLangTrans] = useState<{
    word: string;
    sentence: string;
    explanation: string;
  }>({ word: '', sentence: '', explanation: '' });

  useEffect(() => {
    if (uiLang === 'ka' || uiLang === 'he') {
      setMultiLangTrans({ word: '', sentence: '', explanation: '' });
      return;
    }
    let cancelled = false;
    (async () => {
      const [wTrans, sTrans, eTrans] = await Promise.all([
        translateTextToLangLive(target.word, uiLang, 'iw'),
        translateTextToLangLive(target.sentence.hebrewText, uiLang, 'iw'),
        translateTextToLangLive(
          target.sentence.explanationHe || target.sentence.hebrewText,
          uiLang,
          'iw'
        ),
      ]);
      if (!cancelled) {
        setMultiLangTrans({
          word: wTrans,
          sentence: sTrans,
          explanation: eTrans,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target.word, target.sentence.id, uiLang]);

  // Live tracked bounding rect of the active word after synchronized Daf scroll/lift
  const [liveWordRect, setLiveWordRect] = useState(target.rect);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setLiveWordRect(target.rect);

    if (typeof window === 'undefined') return;

    let rafId = 0;
    const startTime = performance.now();

    const syncRect = () => {
      const hasFullscreenReader = Boolean(
        document.querySelector('[data-fullscreen-section-active="true"]')
      );
      setIsSectionReaderOpen(hasFullscreenReader);

      const activeNodes = document.querySelectorAll('[data-active-talmud-word="true"]');
      const activeEl =
        activeNodes.length > 0
          ? (activeNodes[activeNodes.length - 1] as HTMLElement)
          : null;
      if (activeEl) {
        const r = activeEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setLiveWordRect({
            top: r.top,
            left: r.left,
            bottom: r.bottom,
            right: r.right,
            width: r.width,
            height: r.height,
          });
        }
      }
      if (performance.now() - startTime < 750) {
        rafId = requestAnimationFrame(syncRect);
      }
    };

    rafId = requestAnimationFrame(syncRect);

    const handleResizeOrScroll = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
      syncRect();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [target.word, target.sentence.id, target.rect]);

  // Translate top Sefaria commentaries into Georgian if they are in English
  useEffect(() => {
    if (activeMode !== 'all-commentaries' && !showAllModes) return;
    let cancelled = false;
    (async () => {
      for (const comm of allCommentaries.slice(0, 12)) {
        if (cancelled) break;
        const candidate = comm.translationKa || comm.en || '';
        if (containsLatinButNoGeorgian(candidate) && !translatedCommKa[comm.id]) {
          const ka = await translateToGeorgianLive(comm.en || comm.he, comm.en ? 'en' : 'iw');
          if (!cancelled && ka) {
            setTranslatedCommKa((prev) => ({ ...prev, [comm.id]: ka }));
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMode, showAllModes, allCommentaries]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      setDragOffset({
        x: dragStartRef.current.origX + dx,
        y: dragStartRef.current.origY + dy,
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const viewportW = viewportSize.w;
  const viewportH = viewportSize.h;
  const bottomNavClearance = 64;

  // Symmetrical width centered on screen
  const popWidth = isSectionReaderOpen
    ? Math.min(920, Math.round(viewportW * 0.96))
    : Math.min(680, viewportW - 12);
  const baseLeft = Math.round((viewportW - popWidth) / 2);

  // Position cleanly RIGHT BELOW the active word
  const splitReaderBottom = Math.round(54 + viewportH * 0.39 + 6);
  const safeWordBottom = Math.max(0, Math.min(viewportH, liveWordRect.bottom));
  const directlyUnderWordTop = Math.max(
    58,
    Math.min(Math.round(safeWordBottom + 8), Math.round(viewportH * 0.44))
  );
  const baseTop = isSectionReaderOpen
    ? splitReaderBottom
    : dockBottomMode
      ? Math.max(directlyUnderWordTop, Math.round(viewportH * 0.44))
      : directlyUnderWordTop;

  const finalLeft = Math.max(
    6,
    Math.min(viewportW - popWidth - 6, baseLeft + dragOffset.x)
  );
  const finalTop = Math.max(
    54,
    Math.min(viewportH - 260, baseTop + dragOffset.y)
  );
  const maxPopHeight = Math.max(260, viewportH - finalTop - bottomNavClearance);

  // Extract interactive words from the active sentence so the user can step or tap any word right inside the popover
  const sentenceWords = React.useMemo(() => {
    const raw = (target.sentence.hebrewText || '').trim().split(/\s+/).filter(Boolean);
    return raw;
  }, [target.sentence.hebrewText]);

  const cleanWordToken = (w: string) =>
    w.replace(/[^\u0590-\u05FF\uFB1D-\uFB4F״׳']/g, '').trim() || w;

  const currentWordIdx = React.useMemo(() => {
    const targetClean = cleanWordToken(target.word);
    const idx = sentenceWords.findIndex((w) => cleanWordToken(w) === targetClean);
    return idx >= 0 ? idx : 0;
  }, [sentenceWords, target.word]);

  const handleStepWord = (delta: number) => {
    if (!onSelectWord || sentenceWords.length === 0) return;
    const nextIdx = (currentWordIdx + delta + sentenceWords.length) % sentenceWords.length;
    const nextWord = cleanWordToken(sentenceWords[nextIdx]);
    if (nextWord) {
      const dummyRect = new DOMRect(
        liveWordRect.left,
        liveWordRect.top,
        liveWordRect.width,
        liveWordRect.height
      );
      onSelectWord(nextWord, target.sentence, dummyRect);
    }
  };

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    e.preventDefault();
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX: dragOffset.x,
      origY: dragOffset.y,
    };
    setIsDragging(true);
  };

  const handleDragTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = {
        dist: Math.hypot(dx, dy),
        startZoom: popoverZoom,
      };
      return;
    }
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStartRef.current = {
        clientX: t.clientX,
        clientY: t.clientY,
        origX: dragOffset.x,
        origY: dragOffset.y,
      };
      setIsDragging(true);
    }
  };

  const handleDragTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      if (pinchStartDistRef.current.dist > 10) {
        const ratio = newDist / pinchStartDistRef.current.dist;
        const nextZoom = Math.round(
          Math.max(70, Math.min(165, pinchStartDistRef.current.startZoom * ratio))
        );
        setPopoverZoom(nextZoom);
      }
      return;
    }
    if (e.touches.length === 1 && dragStartRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragStartRef.current.clientX;
      const dy = t.clientY - dragStartRef.current.clientY;
      setDragOffset({
        x: dragStartRef.current.origX + dx,
        y: dragStartRef.current.origY + dy,
      });
    }
  };

  const handleDragTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    pinchStartDistRef.current = null;
  };

  const stopSpeakingHebrew = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
  };

  const speakHebrew = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakingAudio) {
        stopSpeakingHebrew();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'he-IL';
      utter.rate = 0.88;
      utter.onstart = () => setIsSpeakingAudio(true);
      utter.onend = () => setIsSpeakingAudio(false);
      utter.onerror = () => setIsSpeakingAudio(false);
      setIsSpeakingAudio(true);
      window.speechSynthesis.speak(utter);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(noteText.trim());
    setNoteText('');
    setNoteInputOpen(false);
  };

  const sourceBadgeMap: Record<string, { he: string; ka: string }> = {
    mishnah: { he: 'משנה', ka: 'მიშნა' },
    gemara: { he: 'גמרא', ka: 'გემარა' },
    rashi: { he: 'רש״י', ka: 'რაში' },
    tosafot: { he: 'תוספות', ka: 'თოსაფოთი' },
    chavruta: { he: 'פירוש חברותא', ka: 'ხავრუთა' },
    meforshim: {
      he: target.sentence.commentatorNameHe || 'מפרשים',
      ka: target.sentence.commentatorNameKa || 'კომენტარი',
    },
  };

  const srcInfo = sourceBadgeMap[target.sentence.source] || sourceBadgeMap.gemara;

  // STAGE 2: Compact Note-like Popover Window directly below or above the word depending on its vertical position on the Daf
  if (stage === 'note') {
    const noteW = Math.min(390, viewportW - 16);
    const clampedCenterX = Math.max(16, Math.min(viewportW - 16, liveWordRect.left + liveWordRect.width / 2));
    const noteLeft = Math.max(8, Math.min(viewportW - noteW - 8, Math.round(clampedCenterX - noteW / 2)));
    const safeWordTop = Math.max(0, Math.min(viewportH, liveWordRect.top));
    const effectiveBottom = Math.max(safeWordTop, Math.min(viewportH, liveWordRect.bottom));
    const spaceBelow = viewportH - effectiveBottom - 82;
    const spaceAbove = safeWordTop - 64;
    // Prefer below if there's comfortable space, otherwise place above
    const placeBelow = spaceBelow >= 220 || (spaceBelow >= spaceAbove && spaceBelow >= 150);
    const noteTopPx = Math.max(58, Math.min(viewportH - 210, Math.round(effectiveBottom + 10)));
    const noteBottomPx = Math.max(76, Math.min(viewportH - 180, Math.round(viewportH - safeWordTop + 10)));
    const arrowLeftPx = Math.max(18, Math.min(noteW - 24, Math.round(clampedCenterX - noteLeft - 6)));

    const shortWordMeaning =
      sanitizeGeorgianText(analysis?.wordTranslationGeorgian) ||
      sanitizeGeorgianText(target.sentence.translationKa).slice(0, 95) ||
      target.word;
    const shortSentenceMeaning =
      sanitizeGeorgianText(analysis?.sentenceTranslationGeorgian || target.sentence.translationKa) ||
      'მიმდინარეობს განმარტების მომზადება...';

    const safeMaxHeight = placeBelow
      ? Math.max(160, viewportH - noteTopPx - 70)
      : Math.max(160, Math.min(viewportH - noteBottomPx - 56, 420));

    return (
      <motion.div
        ref={popoverContainerRef}
        initial={{ opacity: 0, y: placeBelow ? -6 : 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        style={
          isNoteMaximized
            ? {
                position: 'fixed',
                inset: '12px',
                zIndex: 328,
                overscrollBehavior: 'contain',
              }
            : {
                position: 'fixed',
                ...(placeBelow
                  ? {
                      top: `${noteTopPx}px`,
                      maxHeight: `${safeMaxHeight}px`,
                    }
                  : {
                      bottom: `${noteBottomPx}px`,
                      maxHeight: `${safeMaxHeight}px`,
                    }),
                left: `${noteLeft}px`,
                width: `${noteW}px`,
                zIndex: 325,
                overscrollBehavior: 'contain',
              }
        }
        className={`rounded-2xl border-2 shadow-[0_18px_48px_rgba(44,29,17,0.38)] p-3 flex flex-col gap-2 relative overflow-y-auto overscroll-contain scrollbar-thin ${
          isDark
            ? 'bg-[#261A11]/98 border-[#C49A6C]/75 text-[#FAF5EB] backdrop-blur-xl'
            : 'bg-[#FDF9F0]/99 border-[#A68256]/80 text-[#2C1D11] backdrop-blur-xl'
        }`}
      >
        {/* Portal keeps the pointer outside the scrollable note, which previously clipped it. */}
        {!isNoteMaximized && liveWordRect.bottom > 0 && liveWordRect.top < viewportH && createPortal(
          <div
            aria-hidden="true"
            data-word-note-pointer="true"
            className={isDark ? 'bg-[#261A11] border-[#C49A6C]/75' : 'bg-[#FDF9F0] border-[#A68256]/80'}
            style={{
              position: 'fixed',
              left: `${noteLeft + arrowLeftPx - 2}px`,
              top: `${placeBelow ? noteTopPx - 7 : viewportH - noteBottomPx - 9}px`,
              width: '16px',
              height: '16px',
              borderStyle: 'solid',
              borderRightWidth: placeBelow ? 0 : 2,
              borderBottomWidth: placeBelow ? 0 : 2,
              borderTopWidth: placeBelow ? 2 : 0,
              borderLeftWidth: placeBelow ? 2 : 0,
              transform: 'rotate(45deg)',
              zIndex: 326,
              pointerEvents: 'none',
            }}
          />, document.body
        )}

        {/* Header Row: Selected Word (Always shown in FULL, never truncated) + Transliteration + Audio Play/Stop + Note Toggle + Windows Controls */}
        <div className="flex flex-col gap-1 pb-1.5 border-b border-[#A68256]/35">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <span
                dir="rtl"
                className={`px-3 py-0.5 rounded-lg border font-serif text-lg sm:text-xl font-extrabold leading-snug break-words ${
                  target.word.trim().includes(' ') ? '' : 'whitespace-nowrap shrink-0'
                } ${
                  isDark
                    ? 'bg-[#3C281B] border-[#C49A6C]/60 text-[#F7EFE0]'
                    : 'bg-[#F4EAD5] border-[#A68256]/60 text-[#2C1D11]'
                }`}
              >
                {target.word}
              </span>

              <div className="flex flex-wrap items-center gap-1 text-[10.5px] font-bold min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-[#8B6234]/15 text-[#6B4226] dark:text-[#EED9B9] whitespace-nowrap shrink-0">
                  {srcInfo.ka} • {srcInfo.he}
                </span>
                {analysis?.wordTransliterationGeorgian && (
                  <span className="opacity-85 whitespace-nowrap">
                    [{sanitizeGeorgianText(analysis.wordTransliterationGeorgian)}]
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setNoteInputOpen((v) => !v)}
                title="პირადი შენიშვნის ჩაწერა (Note)"
                className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => speakHebrew(target.word)}
                title={isSpeakingAudio ? 'აუდიოს გამორთვა (Stop)' : 'წაკითხვა (Audio)'}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                  isSpeakingAudio
                    ? 'bg-red-700 text-white border border-red-400 animate-pulse'
                    : ''
                }`}
              >
                {isSpeakingAudio ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <WindowsWindowControls
                isMinimized={isWindowMinimized}
                onToggleMinimize={() => setIsWindowMinimized((v) => !v)}
                isMaximized={isNoteMaximized}
                onToggleMaximize={() => setIsNoteMaximized((v) => !v)}
                onClose={onClose}
                isDark={isDark}
                size="xs"
              />
            </div>
          </div>

          {analysis?.wordRootAndGrammar && !isWindowMinimized && (
            <div className="text-[10.5px] opacity-80 leading-snug break-words px-0.5">
              {analysis.wordRootAndGrammar}
            </div>
          )}
        </div>

        {/* Minimal Word & Context Note Body */}
        {!isWindowMinimized && (
          <>
            <div className="space-y-1.5 text-xs leading-relaxed">
              <div
                className={`p-2 rounded-xl border ${
                  isDark
                    ? 'bg-[#1D130C]/90 border-[#5C3A21]/70 text-[#F7EFE0]'
                    : 'bg-[#F6EFE0] border-[#D5C2A3] text-[#2C1D11]'
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 mb-0.5">
                  {target.word.trim().includes(' ')
                    ? 'მონიშნული ტექსტის განხილვა (Note):'
                    : 'სიტყვის მნიშვნელობა (Note):'}
                </div>
                <div className="font-bold text-[12.5px] leading-snug">
                  {loading && !analysis ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      მზადდება მოკლე განმარტება...
                    </span>
                  ) : (
                    shortWordMeaning
                  )}
                </div>
              </div>

              <div className="px-1 text-[11px] opacity-90 line-clamp-2">
                <span className="font-bold">კონტექსტი: </span>
                {shortSentenceMeaning}
              </div>

              {noteInputOpen && (
                <form onSubmit={handleSaveNote} className="pt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="ჩაწერეთ შენიშვნა ამ სიტყვაზე..."
                    className={`flex-1 px-2.5 py-1.5 rounded-xl border text-xs focus:outline-none ${
                      isDark
                        ? 'bg-[#18100A] border-[#C49A6C]/50 text-[#FAF5EB]'
                        : 'bg-white border-[#8B6234]/50 text-[#2C1D11]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    შენახვა
                  </button>
                </form>
              )}
            </div>

            {/* Footer Button: Open Deep Explanation Screen */}
            <div className="pt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenDeepStudy && onOpenDeepStudy('word-explain')}
                className="flex-1 py-2 px-3 rounded-xl font-extrabold text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8B6234]" />
                <span>ღრმა შესწავლა • ახსნის ეკრანი</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenDeepStudy && onOpenDeepStudy('all-commentaries')}
                title="ყველა კომენტატორის ნახვა"
                className="py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>מפרשים ({allCommentaries.length})</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={popoverContainerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStartDistRef.current = {
            dist: Math.hypot(dx, dy),
            startZoom: popoverZoom,
          };
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && pinchStartDistRef.current) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const newDist = Math.hypot(dx, dy);
          if (pinchStartDistRef.current.dist > 10) {
            const ratio = newDist / pinchStartDistRef.current.dist;
            setPopoverZoom(
              Math.round(Math.max(70, Math.min(165, pinchStartDistRef.current.startZoom * ratio)))
            );
          }
        }
      }}
      onTouchEnd={() => {
        pinchStartDistRef.current = null;
      }}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: '8px',
              zIndex: 298,
              overscrollBehavior: 'contain',
            }
          : {
              position: 'fixed',
              top: `${finalTop}px`,
              left: `${finalLeft}px`,
              width: `${popWidth}px`,
              maxHeight: `${maxPopHeight}px`,
              transform: `scale(${popoverZoom / 100})`,
              transformOrigin: 'top center',
              zIndex: 295,
              overscrollBehavior: 'contain',
            }
      }
      className={`rounded-2xl border-2 shadow-[0_20px_60px_rgba(44,29,17,0.45)] transition-all duration-150 flex flex-col overflow-hidden overscroll-contain ${
        isFullscreen ? 'max-h-[calc(100vh-16px)]' : ''
      } ${
        isDark
          ? 'bg-[#21160F]/98 border-[#C49A6C]/70 text-[#FAF5EB] backdrop-blur-2xl'
          : 'bg-[#FDF9F0]/99 border-[#A68256]/75 text-[#2C1D11] backdrop-blur-xl'
      }`}
    >
      {/* Top Drag Handle & Zoom Control Strip */}
      <div
        onMouseDown={!isFullscreen ? handleDragMouseDown : undefined}
        onTouchStart={!isFullscreen ? handleDragTouchStart : undefined}
        onTouchMove={!isFullscreen ? handleDragTouchMove : undefined}
        onTouchEnd={!isFullscreen ? handleDragTouchEnd : undefined}
        className={`px-3 py-1.5 rounded-t-2xl border-b flex items-center justify-between gap-2 cursor-move select-none touch-none ${
          isDark
            ? 'bg-gradient-to-r from-[#2D1F15] via-[#3E2A1C] to-[#2D1F15] border-[#C49A6C]/35 text-[#EED9B9]'
            : 'bg-gradient-to-r from-[#F3E9D7] via-[#FAF3E6] to-[#F3E9D7] border-[#A68256]/35 text-[#2C1D11]'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold min-w-0 flex-1">
          {onBackToNote && (
            <button
              type="button"
              onClick={onBackToNote}
              className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer shrink-0"
              title="Note ფანჯარაზე დაბრუნება"
            >
              ← Note
            </button>
          )}
          <Move className="w-3.5 h-3.5 shrink-0 text-[#8B6234]" />
          <span className="truncate">
            {isFullscreen
              ? 'მთელ ეკრანზე რეჟიმი'
              : isSectionReaderOpen
                ? 'სინქრონული სპლიტ-ეკრანი (ტექსტი + ახსნა)'
                : 'ღრმა შესწავლისა და ახსნის ეკრანი'}
          </span>
        </div>

        {/* Zoom, Dock & Fullscreen Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {!isFullscreen && !isSectionReaderOpen && (
            <button
              type="button"
              onClick={() => {
                setDockBottomMode((v) => !v);
                setDragOffset({ x: 0, y: 0 });
              }}
              title="ქვედა დოკ-პანელის რეჟიმი / სიტყვის ქვეშ მიბმა"
              className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                dockBottomMode
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/40'
              }`}
            >
              <PanelBottom className="w-3 h-3" />
              <span className="hidden sm:inline">დოკი</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setPopoverZoom((z) => Math.max(70, z - 10))}
            title="დაპატარავება (Zoom Out)"
            className="p-1 rounded-full bg-[#6B4226]/20 hover:bg-[#6B4226]/35 border border-[#8B5A2B]/40 cursor-pointer shrink-0"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono font-bold px-1 min-w-[34px] text-center shrink-0">
            {popoverZoom}%
          </span>
          <button
            type="button"
            onClick={() => setPopoverZoom((z) => Math.min(160, z + 10))}
            title="გადიდება (Zoom In)"
            className="p-1 rounded-full bg-[#6B4226]/20 hover:bg-[#6B4226]/35 border border-[#8B5A2B]/40 cursor-pointer shrink-0"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          {(popoverZoom !== 100 || dragOffset.x !== 0 || dragOffset.y !== 0) && (
            <button
              type="button"
              onClick={() => {
                setPopoverZoom(100);
                setDragOffset({ x: 0, y: 0 });
              }}
              title="საწყის ზომაზე და პოზიციაზე დაბრუნება"
              className="p-1 rounded-full bg-[#6B4226]/20 hover:bg-[#6B4226]/35 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <WindowsWindowControls
            isMinimized={isWindowMinimized}
            onToggleMinimize={() => setIsWindowMinimized((v) => !v)}
            isMaximized={isFullscreen}
            onToggleMaximize={() => setIsFullscreen((v) => !v)}
            onClose={onClose}
            isDark={isDark}
            size="xs"
          />
        </div>
      </div>

      {/* Header: Selected Word & Source (Row 1: Word + Source on left, Action buttons pushed all the way to top right; Row 2: Full-width sentence word strip) */}
      <div
        onMouseDown={!isFullscreen ? handleDragMouseDown : undefined}
        onTouchStart={!isFullscreen ? handleDragTouchStart : undefined}
        onTouchMove={!isFullscreen ? handleDragTouchMove : undefined}
        onTouchEnd={!isFullscreen ? handleDragTouchEnd : undefined}
        className={`px-3 pt-1.5 pb-2 border-b flex flex-col gap-1.5 cursor-move select-none touch-none ${
          isDark ? 'border-[#5C3A21] bg-[#2B1D14]/90' : 'border-[#CBB89D] bg-[#EDE2CC]'
        }`}
      >
        {/* Top Row: Selected Word + Source on Left | Orange-highlighted Action Buttons Pushed All the Way to the Top on Right */}
        <div className="w-full flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              dir="rtl"
              className={`px-2.5 py-0.5 rounded-lg border font-serif text-lg sm:text-xl font-bold shadow-inner break-words ${
                target.word.trim().includes(' ') ? '' : 'whitespace-nowrap shrink-0'
              } ${
                isDark
                  ? 'bg-[#6B4226]/30 border-[#C49A6C]/50 text-[#FAF5EB]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/45 text-[#2C1A10]'
              }`}
            >
              {target.word}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold leading-tight">
                <span className={isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'}>{srcInfo.ka}</span>
                <span aria-hidden="true">·</span>
                <span dir="rtl" className="font-serif whitespace-nowrap">
                  {srcInfo.he}
                </span>
                {analysis?.wordTransliterationGeorgian && (
                  <span className={`truncate ${isDark ? 'text-[#DECAA8]' : 'text-[#5C3A21]'}`}>
                    [{sanitizeGeorgianText(analysis.wordTransliterationGeorgian)}]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Pushed All the Way to the Top Right */}
          <div className="flex items-center gap-1 shrink-0 self-start -mt-0.5">
            {sentenceWords.length > 1 && onSelectWord && (
              <>
                <button
                  type="button"
                  onClick={() => handleStepWord(-1)}
                  title="წინა სიტყვა წინადადებაში"
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1D130D]/70 hover:bg-[#3A271B] text-[#EED9B9] border border-[#5C3A21]'
                      : 'bg-[#FAF5EB]/80 hover:bg-[#D6C5A9] text-[#4A2E1B] border border-[#CBB89D]'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepWord(1)}
                  title="შემდეგი სიტყვა წინადადებაში"
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1D130D]/70 hover:bg-[#3A271B] text-[#EED9B9] border border-[#5C3A21]'
                      : 'bg-[#FAF5EB]/80 hover:bg-[#D6C5A9] text-[#4A2E1B] border border-[#CBB89D]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => speakHebrew(target.word)}
              title={isSpeakingAudio ? 'აუდიოს გამორთვა (Stop)' : 'წაკითხვა (אודיו)'}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                isSpeakingAudio
                  ? 'bg-red-700 text-white border border-red-400 animate-pulse'
                  : isDark
                    ? 'bg-[#1D130D]/70 hover:bg-[#3A271B] text-[#EED9B9] border border-[#5C3A21]'
                    : 'bg-[#FAF5EB]/80 hover:bg-[#D6C5A9] text-[#4A2E1B] border border-[#CBB89D]'
              }`}
            >
              {isSpeakingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAllModes((v) => !v)}
              title="ყველა განმარტების ერთად ჩვენება"
              className={`p-1 rounded-lg transition-colors cursor-pointer border ${
                showAllModes
                  ? isDark
                    ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                    : 'bg-[#6B4226] text-[#FAF5EB] border-[#4A2E1B]'
                  : isDark
                    ? 'bg-[#1D130D]/70 hover:bg-[#3A271B] text-[#C49A6C] border-[#5C3A21]'
                    : 'bg-[#FAF5EB]/80 hover:bg-[#D6C5A9] text-[#5C3A21] border-[#CBB89D]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-[#1D130D]/70 hover:bg-[#3A271B] text-[#C49A6C] hover:text-white border-[#5C3A21]'
                  : 'bg-[#FAF5EB]/80 hover:bg-[#D6C5A9] text-[#5C3A21] hover:text-[#2C1A10] border-[#CBB89D]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Green-highlighted Interactive Sentence Word Strip Expanded to 100% Full Width */}
        <div
          dir="rtl"
          className={`w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2 rounded-xl border ${
            isDark
              ? 'bg-[#1D130D]/80 border-[#5C3A21]/80'
              : 'bg-[#FAF5EB]/90 border-[#CBB89D]'
          }`}
        >
          {sentenceWords.map((rawW, idx) => {
            const cleaned = cleanWordToken(rawW);
            const isCurrent = idx === currentWordIdx;
            return (
              <button
                key={`${rawW}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectWord && cleaned) {
                    const dummyRect = new DOMRect(
                      liveWordRect.left,
                      liveWordRect.top,
                      liveWordRect.width,
                      liveWordRect.height
                    );
                    onSelectWord(cleaned, target.sentence, dummyRect);
                  }
                }}
                className={`px-2 py-0.5 rounded-lg font-serif text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#6B4226] text-[#FBF7F0] font-black shadow-sm scale-105'
                    : isDark
                      ? 'text-[#DECAA8] hover:bg-[#3A271B] hover:text-[#FAF5EB]'
                      : 'text-[#4A2E1B] hover:bg-[#6B4226]/15 hover:text-[#2C1A10]'
                }`}
                title={`სიტყვის არჩევა: ${cleaned}`}
              >
                {rawW}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filterable Dropdown Selector + Quick Switcher */}
      <div
        style={{ overscrollBehavior: 'contain' }}
        className={`p-3.5 space-y-3 flex-1 overflow-y-auto overscroll-contain ${
          isWindowMinimized ? 'hidden' : ''
        }`}
      >
        <SearchableSelect
          label="აირჩიეთ თარგმანი ან განმარტება (სიტყვა / წინადადება):"
          options={DROPDOWN_OPTIONS}
          value={activeMode}
          onChange={(val) => {
            onSelectMode(val as AnalysisMode);
            setShowAllModes(false);
          }}
          isDark={isDark}
          searchPlaceholder="გაფილტრეთ: ყივრითული, ქართული, განმარტება..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Word Group */}
          <div
            className={`p-2 rounded-xl border min-w-0 ${
              isDark ? 'bg-[#2A1D14]/80 border-[#5C3A21]' : 'bg-[#EDE2CC]/80 border-[#CBB89D]'
            }`}
          >
            <div
              className={`text-[10.5px] font-bold mb-1.5 flex items-center justify-between gap-1 ${
                isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
              }`}
            >
              <span className="truncate">სიტყვა (מילה)</span>
              <Languages className="w-3 h-3 shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'word-he', label: 'ყივრითული' },
                  { id: 'word-ka', label: 'ქართული' },
                  { id: 'word-explain', label: 'განმარტება' },
                ] as { id: AnalysisMode; label: string }[]
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(btn.id);
                    setShowAllModes(false);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center truncate transition-all cursor-pointer ${
                    activeMode === btn.id && !showAllModes
                      ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm'
                      : isDark
                        ? 'bg-[#1D130D] text-[#EED9B9] hover:bg-[#3A271B]'
                        : 'bg-[#FBF7F0] text-[#2C1A10] hover:bg-[#DFCFB4]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sentence Group */}
          <div
            className={`p-2 rounded-xl border min-w-0 ${
              isDark ? 'bg-[#2A1D14]/80 border-[#5C3A21]' : 'bg-[#EDE2CC]/80 border-[#CBB89D]'
            }`}
          >
            <div
              className={`text-[10.5px] font-bold mb-1.5 flex items-center justify-between gap-1 ${
                isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
              }`}
            >
              <span className="truncate">წინადადება (משפט)</span>
              <FileText className="w-3 h-3 shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'sentence-he', label: 'ყივრითული' },
                  { id: 'sentence-ka', label: 'ქართული' },
                  { id: 'sentence-explain', label: 'განმარტება' },
                ] as { id: AnalysisMode; label: string }[]
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(btn.id);
                    setShowAllModes(false);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center truncate transition-all cursor-pointer ${
                    activeMode === btn.id && !showAllModes
                      ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm'
                      : isDark
                        ? 'bg-[#1D130D] text-[#EED9B9] hover:bg-[#3A271B]'
                        : 'bg-[#FBF7F0] text-[#2C1A10] hover:bg-[#DFCFB4]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dedicated Full Source / Pasuk Finder & Sefaria Commentaries Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onSelectMode('source-lookup');
              setShowAllModes(false);
            }}
            className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
              activeMode === 'source-lookup' && !showAllModes
                ? 'bg-[#5C3A21] text-[#FBF7F0] border-[#C49A6C] shadow-md'
                : isDark
                  ? 'bg-[#2A1D14] border-[#5C3A21] text-[#EED9B9] hover:bg-[#3A271B]'
                  : 'bg-[#EFE5D0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-[#DFCFB4]'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">მთლიანი წყარო / ფასუკი</span>
            </div>
            <span dir="rtl" className="font-serif text-xs font-bold whitespace-nowrap">
              מקור הפסוק
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectMode('all-commentaries');
              setShowAllModes(false);
            }}
            className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
              activeMode === 'all-commentaries' && !showAllModes
                ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] shadow-md'
                : isDark
                  ? 'bg-[#2A1D14] border-[#5C3A21] text-[#EED9B9] hover:bg-[#3A271B]'
                  : 'bg-[#EFE5D0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-[#DFCFB4]'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">სეფარიას კომენტარები ({allCommentaries.length})</span>
            </div>
            <span dir="rtl" className="font-serif text-xs font-bold whitespace-nowrap">
              מפרשים
            </span>
          </button>
        </div>

        {/* Result Content Area with Movable Reading Line */}
        <div
          style={{ overscrollBehavior: 'contain' }}
          className={`relative rounded-xl border p-3.5 overflow-y-auto overscroll-contain transition-all ${
            isFullscreen ? 'max-h-[65vh] text-base' : 'max-h-60'
          } ${
            isDark
              ? 'bg-[#1A110B] border-[#5C3A21] text-[#FAF5EB]'
              : 'bg-[#FCF9F2] border-[#CBB89D] text-[#2C1A10]'
          }`}
        >
          <ReadingLineGuide
            initialY={28}
            isDarkField={isDark}
            fieldLabel="ახსნის ეკრანი"
          />

          {uiLang !== 'ka' && uiLang !== 'he' && multiLangTrans.word && (
            <div
              className={`mb-2.5 p-2.5 rounded-lg border text-xs ${
                isDark
                  ? 'bg-[#6B4226]/25 border-[#C49A6C]/40 text-[#EED9B9]'
                  : 'bg-[#EFE5D0] border-[#8B5A2B]/35 text-[#2C1A10]'
              }`}
            >
              <div className="font-extrabold text-[11px] uppercase tracking-wider mb-1">
                {LANG_LABELS[uiLang]}:
              </div>
              <div className="font-bold text-sm mb-1">{multiLangTrans.word}</div>
              {multiLangTrans.sentence && (
                <div className="opacity-90 leading-relaxed">{multiLangTrans.sentence}</div>
              )}
            </div>
          )}
          {loading && !analysis ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#B8860B]" />
              <span>მიმდინარეობს თალმუდური ტექსტის ქართული ანალიზი...</span>
            </div>
          ) : analysis ? (
            showAllModes ? (
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <div className="font-bold text-[#B8860B] mb-0.5">
                    1. სიტყვა — ყივრითული (עברית):
                  </div>
                  <div dir="rtl" className="font-serif text-base">
                    {analysis.wordTranslationHebrew}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[#B8860B] mb-0.5">2. სიტყვა — ქართული:</div>
                  <div className="font-medium text-sm">{analysis.wordTranslationGeorgian}</div>
                </div>
                <div>
                  <div className="font-bold text-[#B8860B] mb-0.5">3. სიტყვის განმარტება:</div>
                  <div className="text-[11px] opacity-80 mb-0.5">{analysis.wordRootAndGrammar}</div>
                  <div>{analysis.wordExplanationGeorgian}</div>
                </div>
                <hr className={isDark ? 'border-[#5C3A21]' : 'border-[#CBB89D]'} />
                <div>
                  <div className="font-bold text-[#8B5A2B] mb-0.5">
                    4. წინადადება — ყივრითული (עברית):
                  </div>
                  <div dir="rtl" className="font-serif text-sm">
                    {analysis.sentenceTranslationHebrew}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[#8B5A2B] mb-0.5">5. წინადადება — ქართული:</div>
                  <div>{analysis.sentenceTranslationGeorgian}</div>
                </div>
                <div>
                  <div className="font-bold text-[#8B5A2B] mb-0.5">6. წინადადების განმარტება:</div>
                  <div>{analysis.sentenceExplanationGeorgian}</div>
                </div>
                {analysis.sourceDetails && (
                  <>
                    <hr className={isDark ? 'border-[#5C3A21]' : 'border-[#CBB89D]'} />
                    <div>
                      <div className="font-bold text-[#6B4226] mb-0.5">
                        7. წყაროს ძიება — {analysis.sourceDetails.citationKa} (
                        {analysis.sourceDetails.citationHe}):
                      </div>
                      <div
                        dir="rtl"
                        className="font-serif text-base font-bold my-1 p-2 rounded bg-[#6B4226]/15 border border-[#8B5A2B]/40"
                      >
                        {analysis.sourceDetails.fullOriginalTextHe}
                      </div>
                      <div className="font-medium mt-1">
                        {analysis.sourceDetails.fullTextTranslationKa}
                      </div>
                      <div className="text-[11px] opacity-85 mt-1">
                        {analysis.sourceDetails.contextAndDerashaKa}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {activeMode === 'word-he' && (
                  <div>
                    <div
                      className={`text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      სიტყვის თარგმანი — თანამედროვე ებრაული (עברית):
                    </div>
                    <div dir="rtl" className="font-serif text-lg font-bold leading-snug">
                      {analysis.wordTranslationHebrew}
                    </div>
                    <div
                      dir="rtl"
                      className={`text-xs font-serif mt-2 leading-relaxed ${
                        isDark ? 'text-[#DECAA8]' : 'text-[#3D2516]'
                      }`}
                    >
                      {analysis.wordExplanationHebrew}
                    </div>
                  </div>
                )}

                {activeMode === 'word-ka' && (
                  <div>
                    <div
                      className={`text-[11px] font-semibold mb-1 flex items-center justify-between ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      <span>სიტყვის თარგმანი — ქართული:</span>
                    </div>
                    <div className="text-base font-bold leading-snug">
                      {sanitizeGeorgianText(analysis.wordTranslationGeorgian)}
                    </div>
                    {analysis.wordRootAndGrammar && (
                      <div
                        className={`text-xs mt-1.5 px-2 py-1 rounded inline-block ${
                          isDark
                            ? 'bg-[#2B1D14] text-[#EED9B9]'
                            : 'bg-[#EFE5D0] text-[#4A2E1B] font-medium'
                        }`}
                      >
                        {analysis.wordRootAndGrammar}
                      </div>
                    )}
                    {analysis.wordExplanationGeorgian && (
                      <p className="text-xs leading-relaxed mt-2 opacity-90">
                        {sanitizeGeorgianText(analysis.wordExplanationGeorgian)}
                      </p>
                    )}
                  </div>
                )}

                {activeMode === 'word-explain' && (
                  <div>
                    <div
                      className={`text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      სიტყვის გრამატიკული და თალმუდური განმარტება:
                    </div>
                    <div
                      className={`text-xs font-semibold mb-1.5 ${
                        isDark ? 'text-[#DECAA8]' : 'text-[#3D2516]'
                      }`}
                    >
                      {analysis.wordRootAndGrammar}
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {sanitizeGeorgianText(analysis.wordExplanationGeorgian)}
                    </p>
                    <p
                      dir="rtl"
                      className={`text-xs font-serif mt-2 pt-2 border-t leading-relaxed ${
                        isDark
                          ? 'border-[#5C3A21] text-[#DECAA8]'
                          : 'border-[#CBB89D] text-[#3D2516]'
                      }`}
                    >
                      {analysis.wordExplanationHebrew}
                    </p>
                  </div>
                )}

                {activeMode === 'sentence-he' && (
                  <div>
                    <div
                      className={`text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      წინადადების თარგმანი — თანამედროვე ებრაული (עברית):
                    </div>
                    <div dir="rtl" className="font-serif text-base font-medium leading-relaxed">
                      {analysis.sentenceTranslationHebrew}
                    </div>
                  </div>
                )}

                {activeMode === 'sentence-ka' && (
                  <div>
                    <div
                      className={`text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      წინადადების თარგმანი — ქართული:
                    </div>
                    <p className="text-sm sm:text-base font-medium leading-relaxed">
                      {sanitizeGeorgianText(analysis.sentenceTranslationGeorgian)}
                    </p>
                  </div>
                )}

                {activeMode === 'sentence-explain' && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[11px] font-semibold ${
                          isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                        }`}
                      >
                        წინადადების განმარტება სუგიაში:
                      </span>
                      {analysis.sugyaRole && (
                        <span
                          className={`text-[10px] font-semibold ${
                            isDark ? 'text-[#C49A6C]' : 'text-[#6B4226]'
                          }`}
                        >
                          {analysis.sugyaRole}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {sanitizeGeorgianText(analysis.sentenceExplanationGeorgian)}
                    </p>
                  </div>
                )}

                {activeMode === 'source-lookup' && analysis.sourceDetails && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isDark
                            ? 'bg-[#6B4226]/30 text-[#EED9B9] border border-[#C49A6C]/40'
                            : 'bg-[#EFE5D0] text-[#4A2E1B] border border-[#8B5A2B]/40'
                        }`}
                      >
                        {analysis.sourceDetails.sourceCategoryKa} •{' '}
                        {analysis.sourceDetails.sourceCategoryHe}
                      </span>
                      <span
                        dir="rtl"
                        className={`font-serif text-xs font-bold ${
                          isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                        }`}
                      >
                        {analysis.sourceDetails.citationHe}
                      </span>
                    </div>

                    <div
                      className={`text-xs font-bold ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      წყარო: {analysis.sourceDetails.citationKa}
                    </div>

                    <div
                      dir="rtl"
                      className={`p-2.5 rounded-lg border font-serif text-base sm:text-lg font-bold leading-relaxed ${
                        isDark
                          ? 'bg-[#241810] border-[#C49A6C]/40 text-[#FAF5EB]'
                          : 'bg-[#F5EBD6] border-[#8B5A2B]/40 text-[#2C1A10]'
                      }`}
                    >
                      {analysis.sourceDetails.fullOriginalTextHe}
                    </div>

                    <div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                          isDark ? 'text-[#C49A6C]' : 'text-[#6B4226]'
                        }`}
                      >
                        მთლიანი ფასუკის / წყაროს ქართული თარგმანი:
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        {analysis.sourceDetails.fullTextTranslationKa}
                      </p>
                    </div>
                  </div>
                )}

                {activeMode === 'all-commentaries' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold ${
                          isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                        }`}
                      >
                        სეფარიას კომენტატორები ამ გვერდზე ({allCommentaries.length}):
                      </span>
                    </div>

                    <div className="space-y-2">
                      {allCommentaries.slice(0, 15).map((comm) => {
                        const kaText =
                          translatedCommKa[comm.id] ||
                          (!containsLatinButNoGeorgian(comm.translationKa || '')
                            ? comm.translationKa
                            : '');
                        return (
                          <div
                            key={comm.id}
                            className={`p-2.5 rounded-lg border ${
                              isDark
                                ? 'bg-[#241810]/90 border-[#5C3A21]'
                                : 'bg-[#F5EBD6] border-[#CBB89D]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span
                                className={`text-xs font-bold ${
                                  isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                                }`}
                              >
                                {comm.commentatorKa}
                              </span>
                              <span
                                dir="rtl"
                                className={`font-serif text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isDark
                                    ? 'bg-[#362519] text-[#FAF5EB]'
                                    : 'bg-[#DFCFB4] text-[#2C1A10]'
                                }`}
                              >
                                {comm.heRef}
                              </span>
                            </div>
                            <div
                              dir="rtl"
                              className="font-serif text-sm leading-relaxed text-right mb-1"
                            >
                              {comm.he}
                            </div>
                            {kaText && (
                              <div
                                className={`text-[11px] leading-snug pt-1 border-t ${
                                  isDark
                                    ? 'border-[#5C3A21] text-[#DECAA8]'
                                    : 'border-[#CBB89D] text-[#3D2516]'
                                }`}
                              >
                                {kaText}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>

        {/* Footer: Add Personal Gloss / Note & Save to Flashcards */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
          {!noteInputOpen ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNoteInputOpen(true)}
                className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#2A1D14] hover:bg-[#3A271B] text-[#EED9B9] border border-[#5C3A21]'
                    : 'bg-[#E6DAC2] hover:bg-[#DDD0B6] text-[#2C1A10] border border-[#8B5A2B]/40'
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>კომენტარის / შენიშვნის (הגהה) ჩაწერა</span>
              </button>

              <button
                type="button"
                onClick={handleSaveWordToSrs}
                className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  savedToFlashcards
                    ? 'bg-[#2E6B3E] text-[#FBF7F0] border border-[#2E6B3E]'
                    : 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] border border-[#C49A6C]/50'
                }`}
              >
                <span>
                  {savedToFlashcards ? 'ფლეშ-ბარათებში შენახულია ✓' : '+ ფლეშ-ბარათებში შენახვა'}
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveNote} className="w-full flex items-center gap-1.5">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="ჩაწერეთ თქვენი ხიდუში ან შენიშვნა..."
                className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#1D130D] border-[#C49A6C]/50 text-[#FAF5EB]'
                    : 'bg-white border-[#8B5A2B]/50 text-[#2C1A10]'
                }`}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6B4226] text-[#FBF7F0] hover:bg-[#7D4E2D] cursor-pointer"
              >
                შენახვა
              </button>
              <button
                type="button"
                onClick={() => setNoteInputOpen(false)}
                className="p-1.5 rounded-lg text-xs opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {loading && analysis && (
            <div className="flex items-center gap-1 text-[10px] text-[#B8860B]">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>AI აზუსტებს...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
