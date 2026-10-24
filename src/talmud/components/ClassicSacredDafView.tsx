// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Volume2,
  Eye,
  Scale,
  Columns,
  Maximize2,
  Minimize2,
  Archive,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  AnalysisMode,
  SelectedDafTarget,
  TalmudSentence,
} from '../types/talmud';
import {
  SACRED_REALMS,
  SacredRealmId,
  REALM_COLUMN_CONFIGS,
  getBooksForRealm,
  buildCuratedSacredPage,
  numberToHebrewGematria,
  TORAH_BOOKS,
} from '../data/tanakhAndHalakhaData';
import { normalizeHebrewWord } from '../data/lexicon';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { PageFlip3DWrapper } from './PageFlip3DWrapper';
import { ReadingLineGuide } from './ReadingLineGuide';
import { PoskimHalachaMasterGrid } from './PoskimHalachaMasterGrid';
import { FullScreenModal } from './FullScreenModal';
import { WindowsWindowControls, CrystalDiamondJumpButton } from './WindowsWindowControls';
import { YalkutYosefKitzurSmartHub } from './YalkutYosefKitzurSmartHub';
import { TorahDafInterface } from './TorahDafInterface';
import { YALKUT_YOSEF_CURATED_SIMANIM } from '../data/yalkutYosefKitzurData';
import {
  translateToGeorgianLive,
  normalizeGeorgianJewishTerms,
} from '../utils/georgianTranslator';
import {
  extractCitationsFromText,
  buildWordCitationIndexMap,
  isSmallRefMarkerToken,
  SMALL_REF_LETTERS_HE,
  DetectedSacredCitation,
} from '../utils/talmudCitationDetector';

interface ClassicSacredDafViewProps {
  realmId: SacredRealmId;
  onChangeRealm: (realm: SacredRealmId) => void;
  initialBookId?: string;
  initialChapter?: number;
  isDark: boolean;
  dafFontSizeScale: number;
  onChangeDafFontSizeScale?: (updater: number | ((prev: number) => number)) => void;
  selectedTarget?: SelectedDafTarget | null;
  onSelectWordOrSentence: (
    word: string,
    sentence: TalmudSentence,
    anchorRect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  onOpenWordNote?: (
    word: string,
    sentence: TalmudSentence,
    anchorRect: DOMRect
  ) => void;
  searchHighlightQuery?: string;
  showAboveDaf?: boolean;
  onToggleAboveDaf?: () => void;
  showBelowDaf?: boolean;
  onToggleBelowDaf?: () => void;
  onNavigateToTalmudDaf?: (tractateId: string, dafId: string, sectionId?: string) => void;
  onRecordCitationReturnPoint?: (origin: {
    fromBookId?: string;
    fromBookNameKa?: string;
    fromBookNameHe?: string;
    fromChapter?: number;
    fromSentenceId?: string | null;
    fromElementId?: string | null;
    fromWindowScrollY: number;
    sourceLabelKa: string;
    sourceLabelHe?: string;
    targetLabelKa?: string;
  }) => void;
  pendingReturnRestore?: {
    seq?: number;
    restoreTrigger?: number;
    fromBookId?: string;
    fromChapter?: number;
    fromSentenceId?: string | null;
    fromElementId?: string | null;
    fromWindowScrollY?: number;
  } | null;
  onOpenFloatingSourceDaf?: (req: {
    tractateId: string;
    dafId: string;
    citeHe: string;
    citeEn?: string;
    snippetHe?: string;
    highlightSnippetHe?: string;
    anchorRect?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
    } | null;
    originLabelKa?: string;
    sourceContextLabelKa?: string;
  }) => void;
  onOpenVoiceNav?: () => void;
  onOpenAiNav?: () => void;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ClassicSacredDafView: React.FC<ClassicSacredDafViewProps> = React.memo(({
  realmId,
  onChangeRealm,
  initialBookId,
  initialChapter,
  isDark,
  dafFontSizeScale,
  onChangeDafFontSizeScale,
  selectedTarget,
  onSelectWordOrSentence,
  onOpenWordNote,
  searchHighlightQuery = '',
  showAboveDaf = true,
  onToggleAboveDaf,
  showBelowDaf = true,
  onToggleBelowDaf,
  onNavigateToTalmudDaf,
  onRecordCitationReturnPoint,
  onOpenFloatingSourceDaf,
  onOpenVoiceNav,
  onOpenAiNav,
}) => {
  const books = useMemo(() => getBooksForRealm(realmId), [realmId]);
  const [selectedBookId, setSelectedBookId] = useState<string>(
    initialBookId && books.some((b) => b.id === initialBookId)
      ? initialBookId
      : books[0]?.id || 'Genesis'
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 1);
  const [selectedParashaId, setSelectedParashaId] = useState<string>('all');
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const [showRashiScript, setShowRashiScript] = useState<boolean>(true);
  const [showNikud, setShowNikud] = useState<boolean>(() => {
    const saved = localStorage.getItem('talmud_sacred_nikud_v1');
    return saved !== null ? saved === 'true' : true;
  });
  const [showGeorgianTranslation, setShowGeorgianTranslation] = useState<boolean>(true);
  const [isLineSweepMode, setIsLineSweepMode] = useState<boolean>(false);
  const [showLineGuide, setShowLineGuide] = useState<boolean>(true);
  const [isSelectorRibbonOpen, setIsSelectorRibbonOpen] = useState<boolean>(false);
  const [collapsedSentenceIds, setCollapsedSentenceIds] = useState<Set<string>>(new Set());
  const lastSweepSentenceIdRef = useRef<string | null>(null);
  const pinchStateRef = useRef<{ dist: number; startScale: number } | null>(null);

  // Requirement 1 & 4: Track which blue citation link was tapped so the translucent diamond jump button appears upon touch/click
  const [activeTappedCitation, setActiveTappedCitation] = useState<{
    sentenceId: string;
    cit: DetectedSacredCitation;
    anchorRect?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
    } | null;
  } | null>(null);
  const [isHeaderToolbarMinimized, setIsHeaderToolbarMinimized] = useState<boolean>(false);
  const [isHeaderToolbarMaximized, setIsHeaderToolbarMaximized] = useState<boolean>(false);
  const [isSacredDafMinimized, setIsSacredDafMinimized] = useState<boolean>(false);
  const [minimizedSacredCols, setMinimizedSacredCols] = useState<Record<string, boolean>>({});
  const [isBelowCardsMinimized, setIsBelowCardsMinimized] = useState<boolean>(false);
  const [isBelowCardsMaximized, setIsBelowCardsMaximized] = useState<boolean>(false);

  // Requirement 3: Word range selection where the two range-expansion balls only appear on a 2nd-press long-press
  const [sacredWordRange, setSacredWordRange] = useState<{
    sentenceId: string;
    startIdx: number;
    endIdx: number;
    showHandles: boolean;
  } | null>(null);
  const sacredLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAuthenticPdfMode, setIsAuthenticPdfMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('talmud_sacred_pdf_mode_v3');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSacredDafFullScreen, setIsSacredDafFullScreen] = useState<boolean>(false);
  const [selectedSchoolAccent, setSelectedSchoolAccent] = useState<'classic' | 'sephardic' | 'ashkenazi'>('classic');
  const [dafSyncOffsetY, setDafSyncOffsetY] = useState<number>(0);
  const [sacredPanX, setSacredPanX] = useState<number>(0);
  const [sacredPanY, setSacredPanY] = useState<number>(0);
  const [sacredZoom, setSacredZoom] = useState<number>(100);
  const [isSacredPanMode, setIsSacredPanMode] = useState<boolean>(false);
  const sacredDragRef = React.useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);
  const [liveCrossHighlight, setLiveCrossHighlight] = useState<boolean>(true);
  const [hoveredSentence, setHoveredSentence] = useState<TalmudSentence | null>(null);
  const [loadingLiveSefaria, setLoadingLiveSefaria] = useState<boolean>(false);
  const [liveMainSentences, setLiveMainSentences] = useState<TalmudSentence[] | null>(null);
  const [liveRightSentences, setLiveRightSentences] = useState<TalmudSentence[] | null>(null);
  const [liveLeftSentences, setLiveLeftSentences] = useState<TalmudSentence[] | null>(null);
  const [showYalkutClassicDafBelow, setShowYalkutClassicDafBelow] = useState<boolean>(true);
  const [fullscreenModal, setFullscreenModal] = useState<{
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('talmud_sacred_pdf_mode_v3', String(isAuthenticPdfMode));
  }, [isAuthenticPdfMode]);

  useEffect(() => {
    if (!selectedTarget) {
      setDafSyncOffsetY(0);
    }
  }, [selectedTarget]);

  const alignActiveWordAndLiftDaf = useCallback((el: HTMLElement) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const desiredScreenY = isMobile ? 64 : 74;

    const scrollBox = el.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollBox && scrollBox.scrollHeight > scrollBox.clientHeight + 4) {
      const boxRect = scrollBox.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetOffsetInBox = Math.min(28, boxRect.height * 0.14);
      const deltaInBox = elRect.top - (boxRect.top + targetOffsetInBox);
      if (Math.abs(deltaInBox) > 3) {
        scrollBox.scrollTop = Math.max(0, scrollBox.scrollTop + deltaInBox);
      }
    }

    requestAnimationFrame(() => {
      const updatedRect = el.getBoundingClientRect();
      const popoverSafeCeiling = Math.max(desiredScreenY + 34, vh * 0.44 - 58);

      if (updatedRect.bottom > popoverSafeCeiling || updatedRect.top > desiredScreenY + 24) {
        const neededLift = updatedRect.top - desiredScreenY;
        setDafSyncOffsetY((prev) => {
          const nextOffset = prev - neededLift;
          const clamped = Math.max(-Math.round(vh * 0.72), Math.min(0, nextOffset));
          return Math.abs(clamped - prev) > 2 ? clamped : prev;
        });
      } else if (updatedRect.top < 54) {
        const pushDown = 58 - updatedRect.top;
        setDafSyncOffsetY((prev) => Math.min(0, prev + pushDown));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTarget || typeof document === 'undefined') return;
    const timer = setTimeout(() => {
      const activeNodes = document.querySelectorAll('[data-active-talmud-word="true"]');
      const activeEl =
        activeNodes.length > 0
          ? (activeNodes[activeNodes.length - 1] as HTMLElement)
          : null;
      if (activeEl) {
        alignActiveWordAndLiftDaf(activeEl);
      }
    }, 25);
    return () => clearTimeout(timer);
  }, [selectedTarget, alignActiveWordAndLiftDaf]);

  const sacredPdfViewportRef = useRef<HTMLDivElement | null>(null);
  const [sacredA4Scale, setSacredA4Scale] = useState<number>(1);

  useEffect(() => {
    if (!isAuthenticPdfMode || typeof window === 'undefined') {
      setSacredA4Scale(1);
      return;
    }
    const updateA4Scale = () => {
      const containerEl = sacredPdfViewportRef.current;
      const availableWidth = containerEl?.clientWidth || window.innerWidth || 820;
      const targetA4Width = 794; // Standard 96-DPI A4 paper width (210mm)
      if (availableWidth < targetA4Width + 16) {
        const nextScale = Math.max(0.38, Math.min(1, (availableWidth - 12) / targetA4Width));
        setSacredA4Scale(Number(nextScale.toFixed(4)));
      } else {
        setSacredA4Scale(1);
      }
    };
    updateA4Scale();
    window.addEventListener('resize', updateA4Scale);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && sacredPdfViewportRef.current) {
      ro = new ResizeObserver(updateA4Scale);
      ro.observe(sacredPdfViewportRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateA4Scale);
      if (ro) ro.disconnect();
    };
  }, [isAuthenticPdfMode]);

  useEffect(() => {
    localStorage.setItem('talmud_sacred_nikud_v1', String(showNikud));
  }, [showNikud]);

  const formatHebrewWithNikud = (text: string): string =>
    showNikud ? text : text.replace(/[\u0591-\u05C7]/g, '');

  useEffect(() => {
    const validBook =
      initialBookId && books.some((b) => b.id === initialBookId)
        ? initialBookId
        : books[0]?.id || 'Genesis';
    setSelectedBookId(validBook);
    setSelectedChapter(initialChapter || 1);
    setSelectedParashaId('all');
  }, [realmId, initialBookId, initialChapter, books]);

  const currentBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || books[0],
    [books, selectedBookId]
  );

  const realmMeta = useMemo(
    () => SACRED_REALMS.find((r) => r.id === realmId) || SACRED_REALMS[0],
    [realmId]
  );

  const colConfig = REALM_COLUMN_CONFIGS[realmId] || REALM_COLUMN_CONFIGS.torah;

  const curatedPage = useMemo(
    () => buildCuratedSacredPage(realmId, currentBook, selectedChapter),
    [realmId, currentBook, selectedChapter]
  );

  // Fetch live chapter/siman and commentaries from Sefaria API with graceful fallback
  useEffect(() => {
    if (realmId === 'torah') return;
    let cancelled = false;
    setLoadingLiveSefaria(true);
    setLiveMainSentences(null);
    setLiveRightSentences(null);
    setLiveLeftSentences(null);

    const ref = `${currentBook.sefariaRef}.${selectedChapter}`;
    fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=1&context=0`)
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (cancelled || !data) return;
        const heArr: string[] = Array.isArray(data.he)
          ? data.he.flat().map((s: unknown) => (typeof s === 'string' ? stripHtml(s) : '')).filter(Boolean)
          : [];
        const enArr: string[] = Array.isArray(data.text)
          ? data.text.flat().map((s: unknown) => (typeof s === 'string' ? stripHtml(s) : '')).filter(Boolean)
          : [];

        if (heArr.length > 0) {
          const slicedHe = heArr.slice(0, 8);
          const builtMain: TalmudSentence[] = await Promise.all(
            slicedHe.map(async (heText, i) => {
              const enText = enArr[i] || '';
              let kaText = '';
              if (i < 4) {
                try {
                  kaText = await translateToGeorgianLive(
                    enText || heText,
                    enText ? 'en' : 'iw'
                  );
                } catch {
                  kaText = '';
                }
              }
              if (kaText && !/[\u10A0-\u10FF]/.test(kaText)) {
                kaText = '';
              }
              return {
                id: `live-${realmId}-${currentBook.id}-${selectedChapter}-${i + 1}`,
                source: 'gemara',
                dibburHamatchil: `${
                  realmId === 'neviim' || realmId === 'ketuvim'
                    ? 'פסוק'
                    : 'סעיף / הלכה'
                } ${numberToHebrewGematria(i + 1)}`,
                hebrew: heText,
                hebrewText: heText,
                translationKa:
                  kaText ||
                  `${currentBook.nameKa} (${selectedChapter}:${i + 1}) — კლასიკური მუხლი და ჰალახური წყარო.`,
                explanationKa: `${colConfig.centerMainHeaderKa} (${currentBook.nameHe} ${numberToHebrewGematria(selectedChapter)}:${numberToHebrewGematria(i + 1)})`,
              };
            })
          );
          if (!cancelled) {
            setLiveMainSentences(builtMain);
          }
        }

        if (Array.isArray(data.commentary) && data.commentary.length > 0) {
          const commItems = data.commentary.filter(
            (c: { he?: unknown }) => typeof c.he === 'string' && c.he.trim().length > 10
          );
          const rashiLike = commItems
            .filter((c: { collectiveTitle?: { en?: string } }) =>
              /Rashi|Kesef|Beit Yosef|Taz|Mishnah Berurah|Yosef/i.test(
                c.collectiveTitle?.en || ''
              )
            )
            .slice(0, 4);
          const tosafotLike = commItems
            .filter(
              (c: { collectiveTitle?: { en?: string } }) =>
                !/Rashi|Kesef|Beit Yosef|Taz|Mishnah Berurah|Yosef/i.test(
                  c.collectiveTitle?.en || ''
                )
            )
            .slice(0, 4);

          if (rashiLike.length > 0 && !cancelled) {
            setLiveRightSentences(
              rashiLike.map((c: { he: string; sourceHeRef?: string; collectiveTitle?: { he?: string } }, idx: number) => ({
                id: `live-right-${idx}`,
                source: 'rashi',
                dibburHamatchil: c.collectiveTitle?.he || c.sourceHeRef || colConfig.rightHeaderHe,
                hebrew: stripHtml(c.he),
                translationKa: `${colConfig.rightHeaderKa} — კლასიკური განმარტება Sefaria-ს ბაზიდან.`,
                explanationKa: colConfig.rightHeaderKa,
              }))
            );
          }

          if (tosafotLike.length > 0 && !cancelled) {
            setLiveLeftSentences(
              tosafotLike.map((c: { he: string; sourceHeRef?: string; collectiveTitle?: { he?: string } }, idx: number) => ({
                id: `live-left-${idx}`,
                source: 'tosafot',
                dibburHamatchil: c.collectiveTitle?.he || c.sourceHeRef || colConfig.leftHeaderHe,
                hebrew: stripHtml(c.he),
                translationKa: `${colConfig.leftHeaderKa} — ანალიტიკური კომენტარი Sefaria-ს ბაზიდან.`,
                explanationKa: colConfig.leftHeaderKa,
              }))
            );
          }
        }
      })
      .catch(() => {
        // Fallback to curated page silently
      })
      .finally(() => {
        if (!cancelled) setLoadingLiveSefaria(false);
      });

    return () => {
      cancelled = true;
    };
  }, [realmId, currentBook, selectedChapter, colConfig]);

  const hasCuratedYalkutSiman = useMemo(
    () =>
      realmId === 'yalkut-yosef' &&
      YALKUT_YOSEF_CURATED_SIMANIM.some((s) => s.simanNum === selectedChapter),
    [realmId, selectedChapter]
  );

  const activeMainSentences =
    hasCuratedYalkutSiman
      ? curatedPage.centerMainSentences
      : liveMainSentences || curatedPage.centerMainSentences;
  const activeRightSentences =
    hasCuratedYalkutSiman
      ? curatedPage.rightColSentences
      : liveRightSentences || curatedPage.rightColSentences;
  const activeLeftSentences =
    hasCuratedYalkutSiman
      ? curatedPage.leftColSentences
      : liveLeftSentences || curatedPage.leftColSentences;
  const activeTopSentences = curatedPage.centerTopSentences;
  const activeBottomLeft = curatedPage.bottomLeftSentences;
  const activeBottomRight = curatedPage.bottomRightSentences;

  // Bidirectional Cross-Highlighting Engine across all columns of the Daf
  const crossHighlightedIds = useMemo(() => {
    const set = new Set<string>();
    if (!liveCrossHighlight || !hoveredSentence) return set;

    const allRight = activeRightSentences;
    const allLeft = activeLeftSentences;
    const allTop = activeTopSentences;
    const allBL = activeBottomLeft;
    const allBR = activeBottomRight;
    const allMain = activeMainSentences;

    if (hoveredSentence.source === 'gemara') {
      const idx = Math.max(0, allMain.findIndex((s) => s.id === hoveredSentence.id));
      if (allRight[idx % allRight.length]) set.add(allRight[idx % allRight.length].id);
      if (allLeft[idx % allLeft.length]) set.add(allLeft[idx % allLeft.length].id);
      if (allTop[idx % allTop.length]) set.add(allTop[idx % allTop.length].id);
      if (allBL[idx % allBL.length]) set.add(allBL[idx % allBL.length].id);
      if (allBR[idx % allBR.length]) set.add(allBR[idx % allBR.length].id);
    } else {
      // Hovering on a commentary highlights the corresponding main text sentence(s)!
      allMain.forEach((m, idx) => {
        if (idx === 0 || hoveredSentence.id.endsWith(`-${idx + 1}`)) {
          set.add(m.id);
        }
      });
      if (set.size === 0 && allMain[0]) {
        set.add(allMain[0].id);
      }
    }
    return set;
  }, [
    liveCrossHighlight,
    hoveredSentence,
    activeMainSentences,
    activeRightSentences,
    activeLeftSentences,
    activeTopSentences,
    activeBottomLeft,
    activeBottomRight,
  ]);

  const bookOptions: SelectOption[] = useMemo(
    () =>
      books.map((b) => ({
        value: b.id,
        badgeHe: b.nameHe,
        label: b.nameKa,
        sublabel: `${b.subGroupKa} • ${b.chaptersCount} თავი/სიმანი`,
      })),
    [books]
  );

  const parashaOptions: SelectOption[] = useMemo(() => {
    const out: SelectOption[] = [
      { value: 'all', badgeHe: 'כל הפרשיות', label: 'ყველა ფარაშა (54 კვირის თავი)' },
    ];
    for (const b of TORAH_BOOKS) {
      if (b.parshiot) {
        for (const p of b.parshiot) {
          out.push({
            value: `${b.id}:${p.startRef}:${p.id}`,
            badgeHe: p.nameHe.replace('פרשת ', ''),
            label: `${p.nameKa} (${b.nameKa.split(' ')[0]})`,
            sublabel: `${b.nameKa} • თავი ${p.startRef}`,
          });
        }
      }
    }
    return out;
  }, []);

  const chapterOptions: SelectOption[] = useMemo(() => {
    const count = Math.min(currentBook.chaptersCount || 50, 700);
    const arr: SelectOption[] = [];
    for (let i = 1; i <= count; i++) {
      const gem = numberToHebrewGematria(i);
      arr.push({
        value: String(i),
        badgeHe: `${gem}`,
        label:
          realmId === 'tur' ||
          realmId === 'shulchan-aruch' ||
          realmId === 'mishnah-berurah' ||
          realmId === 'yalkut-yosef' ||
          realmId === 'sephardic-halakha'
            ? `სიმანი ${i} (סימן ${gem})`
            : `თავი / פרק ${i} (${gem})`,
      });
    }
    return arr;
  }, [currentBook, realmId]);

  const handlePrevChapter = () => {
    setPageTurnDirection(-1);
    if (selectedChapter > 1) {
      setSelectedChapter((c) => c - 1);
    } else {
      const curBookIdx = books.findIndex((b) => b.id === currentBook.id);
      if (curBookIdx > 0) {
        const prevBook = books[curBookIdx - 1];
        setSelectedBookId(prevBook.id);
        setSelectedChapter(1);
      }
    }
  };

  const handleNextChapter = () => {
    setPageTurnDirection(1);
    if (selectedChapter < currentBook.chaptersCount) {
      setSelectedChapter((c) => c + 1);
    } else {
      const curBookIdx = books.findIndex((b) => b.id === currentBook.id);
      if (curBookIdx >= 0 && curBookIdx < books.length - 1) {
        const nextBook = books[curBookIdx + 1];
        setSelectedBookId(nextBook.id);
        setSelectedChapter(1);
      }
    }
  };

  const [focusedSacredCol, setFocusedSacredCol] = useState<
    'right' | 'centerTop' | 'centerMain' | 'left' | 'bottomRight' | 'bottomLeft'
  >('centerMain');

  const colActionHandlersRef = useRef({
    handlePrevChapter,
    handleNextChapter,
    focusedSacredCol,
    colConfig,
    activeRightSentences,
    activeTopSentences,
    activeMainSentences,
    activeLeftSentences,
    activeBottomRight,
    activeBottomLeft,
    emitSacredColFocus: (
      _col: 'right' | 'centerTop' | 'centerMain' | 'left' | 'bottomRight' | 'bottomLeft',
      _isMin?: boolean
    ) => {},
    openSectionInFullscreen: (
      _ka: string,
      _he: string,
      _s: TalmudSentence[]
    ) => {},
  });

  const emitSacredColFocus = useCallback(
    (
      colKey: 'right' | 'centerTop' | 'centerMain' | 'left' | 'bottomRight' | 'bottomLeft',
      isMinOverride?: boolean
    ) => {
      setFocusedSacredCol((prev) => (prev === colKey ? prev : colKey));
      const map: Record<string, { he: string; ka: string }> = {
        right: { he: colConfig.rightHeaderHe, ka: colConfig.rightHeaderKa },
        centerTop: { he: colConfig.centerTopHeaderHe, ka: colConfig.centerTopHeaderKa },
        centerMain: { he: colConfig.centerMainHeaderHe, ka: colConfig.centerMainHeaderKa },
        left: { he: colConfig.leftHeaderHe, ka: colConfig.leftHeaderKa },
        bottomRight: { he: colConfig.bottomRightHeaderHe, ka: colConfig.bottomRightHeaderKa },
        bottomLeft: { he: colConfig.bottomLeftHeaderHe, ka: colConfig.bottomLeftHeaderKa },
      };
      const meta = map[colKey] || map.centerMain;
      const isMin =
        isMinOverride !== undefined ? isMinOverride : Boolean(minimizedSacredCols[colKey]);
      window.dispatchEvent(
        new CustomEvent('global-daf-pane-focus', {
          detail: {
            paneId: colKey,
            titleHe: meta.he,
            titleKa: meta.ka,
            isMinimized: isMin,
            isMaximized: false,
          },
        })
      );
    },
    [colConfig, minimizedSacredCols]
  );

  const lastEmittedFocusRef = useRef<string>('');
  useEffect(() => {
    if (realmId === 'torah') return;
    const isMin = Boolean(minimizedSacredCols[focusedSacredCol]);
    const sig = `${realmId}:${focusedSacredCol}:${isMin}`;
    if (lastEmittedFocusRef.current === sig) return;
    lastEmittedFocusRef.current = sig;
    emitSacredColFocus(focusedSacredCol);
  }, [realmId, focusedSacredCol, minimizedSacredCols, emitSacredColFocus]);

  useEffect(() => {
    if (realmId === 'torah') return;
    const onGlobalPrev = () => colActionHandlersRef.current.handlePrevChapter();
    const onGlobalNext = () => colActionHandlersRef.current.handleNextChapter();
    const onSacredDafStep = (e: Event) => {
      const detail = (e as CustomEvent<{ dir: 'prev' | 'next' }>).detail;
      if (detail?.dir === 'prev') colActionHandlersRef.current.handlePrevChapter();
      else if (detail?.dir === 'next') colActionHandlersRef.current.handleNextChapter();
    };
    const onPaneAction = (e: Event) => {
      const detail = (
        e as CustomEvent<{ paneId: string; action: 'minimize' | 'maximize' | 'fullscreen' }>
      ).detail;
      if (!detail) return;
      const handlers = colActionHandlersRef.current;
      const key = (detail.paneId || handlers.focusedSacredCol) as
        | 'right'
        | 'centerTop'
        | 'centerMain'
        | 'left'
        | 'bottomRight'
        | 'bottomLeft';
      if (detail.action === 'minimize') {
        setMinimizedSacredCols((p) => {
          const nextVal = !p[key];
          setTimeout(() => handlers.emitSacredColFocus(key, nextVal), 0);
          return { ...p, [key]: nextVal };
        });
      } else if (detail.action === 'maximize' || detail.action === 'fullscreen') {
        if (key === 'right') {
          handlers.openSectionInFullscreen(handlers.colConfig.rightHeaderKa, handlers.colConfig.rightHeaderHe, handlers.activeRightSentences);
        } else if (key === 'centerTop') {
          handlers.openSectionInFullscreen(handlers.colConfig.centerTopHeaderKa, handlers.colConfig.centerTopHeaderHe, handlers.activeTopSentences);
        } else if (key === 'centerMain') {
          handlers.openSectionInFullscreen(handlers.colConfig.centerMainHeaderKa, handlers.colConfig.centerMainHeaderHe, handlers.activeMainSentences);
        } else if (key === 'left') {
          handlers.openSectionInFullscreen(handlers.colConfig.leftHeaderKa, handlers.colConfig.leftHeaderHe, handlers.activeLeftSentences);
        } else if (key === 'bottomRight') {
          handlers.openSectionInFullscreen(handlers.colConfig.bottomRightHeaderKa, handlers.colConfig.bottomRightHeaderHe, handlers.activeBottomRight);
        } else if (key === 'bottomLeft') {
          handlers.openSectionInFullscreen(handlers.colConfig.bottomLeftHeaderKa, handlers.colConfig.bottomLeftHeaderHe, handlers.activeBottomLeft);
        }
      }
    };
    window.addEventListener('global-page-prev', onGlobalPrev);
    window.addEventListener('global-page-next', onGlobalNext);
    window.addEventListener('sacred-daf-step', onSacredDafStep);
    window.addEventListener('global-daf-pane-action', onPaneAction);
    return () => {
      window.removeEventListener('global-page-prev', onGlobalPrev);
      window.removeEventListener('global-page-next', onGlobalNext);
      window.removeEventListener('sacred-daf-step', onSacredDafStep);
      window.removeEventListener('global-daf-pane-action', onPaneAction);
    };
  }, [realmId]);

  const openSectionInFullscreen = (
    titleKa: string,
    titleHe: string,
    sentences: TalmudSentence[]
  ) => {
    setFullscreenModal({
      title: `${titleKa} • ${currentBook.nameKa} (${selectedChapter})`,
      subtitle: `${titleHe} • ${currentBook.nameHe} ${numberToHebrewGematria(selectedChapter)}`,
      hebrewText: sentences
        .map((s) =>
          s.dibburHamatchil
            ? `${s.dibburHamatchil}: ${s.hebrewText || (s as unknown as { hebrew?: string }).hebrew || ''}`
            : s.hebrewText || (s as unknown as { hebrew?: string }).hebrew || ''
        )
        .join('\n\n'),
      georgianText: sentences
        .map((s) => `${s.translationKa || ''}${s.explanationKa ? `\nგანმარტება: ${s.explanationKa}` : ''}`)
        .join('\n\n'),
    });
  };

  useEffect(() => {
    colActionHandlersRef.current = {
      handlePrevChapter,
      handleNextChapter,
      focusedSacredCol,
      colConfig,
      activeRightSentences,
      activeTopSentences,
      activeMainSentences,
      activeLeftSentences,
      activeBottomRight,
      activeBottomLeft,
      emitSacredColFocus,
      openSectionInFullscreen,
    };
  });

  const toggleSentenceCollapsed = useCallback((id: string) => {
    setCollapsedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCitationNavigate = useCallback(
    (
      cit: DetectedSacredCitation,
      fromSent?: TalmudSentence,
      anchorRect?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
      } | null
    ) => {
      if (onRecordCitationReturnPoint) {
        onRecordCitationReturnPoint({
          fromBookId: selectedBookId,
          fromBookNameKa: currentBook.nameKa,
          fromBookNameHe: currentBook.nameHe,
          fromChapter: selectedChapter,
          fromSentenceId: fromSent?.id || null,
          fromElementId: fromSent ? `sacred-sentence-${fromSent.id}` : null,
          fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
          sourceLabelKa: `${currentBook.nameKa} ${selectedChapter}${fromSent?.dibburHamatchil ? ` • ${fromSent.dibburHamatchil.slice(0, 18)}` : ''}`,
          sourceLabelHe: cit.labelHe,
          targetLabelKa: cit.labelKa,
        });
      }
      const fallbackRect = activeTappedCitation?.anchorRect || null;
      setActiveTappedCitation(null);

      // Requirement 2: Stay on the current Sacred Daf interface and open the cited Talmud Daf inside the floating Source Daf Note Window right beside the citation!
      if (cit.tractateId && cit.dafId && onOpenFloatingSourceDaf) {
        const sentHeb =
          fromSent?.hebrewText || (fromSent as unknown as { hebrew?: string })?.hebrew || '';
        const dibbur = fromSent?.dibburHamatchil || '';
        const contextPhrase = `${dibbur} ${sentHeb}`.trim().slice(0, 120) || cit.labelHe;
        const originLabel = `${currentBook.nameKa} ${selectedChapter}${
          dibbur ? ` • ${dibbur.slice(0, 18)}` : ''
        }`;
        onOpenFloatingSourceDaf({
          tractateId: cit.tractateId,
          dafId: cit.dafId,
          citeHe: cit.labelHe || `${cit.tractateId} ${cit.dafId}`,
          citeEn: `${cit.tractateId.replace(/_/g, ' ')} ${cit.dafId}`,
          snippetHe: contextPhrase,
          highlightSnippetHe: contextPhrase,
          anchorRect: anchorRect || fallbackRect,
          originLabelKa: originLabel,
          sourceContextLabelKa: originLabel,
        });
        return;
      }

      if (cit.tractateId && cit.dafId && onNavigateToTalmudDaf) {
        onNavigateToTalmudDaf(cit.tractateId, cit.dafId, cit.sectionId || 'daf-section-gemara');
        return;
      }
      if (cit.chapterNum && cit.chapterNum >= 1 && cit.chapterNum <= (currentBook.chaptersCount || 700)) {
        setPageTurnDirection(cit.chapterNum >= selectedChapter ? 1 : -1);
        setSelectedChapter(cit.chapterNum);
      }
    },
    [
      onOpenFloatingSourceDaf,
      onNavigateToTalmudDaf,
      onRecordCitationReturnPoint,
      selectedBookId,
      currentBook.nameKa,
      currentBook.nameHe,
      currentBook.chaptersCount,
      selectedChapter,
      activeTappedCitation,
    ]
  );

  const triggerSentenceWithSelectionOption = useCallback(
    (sent: TalmudSentence, anchorEl: HTMLElement, defaultWord: string, mode: AnalysisMode) => {
      const rawHeb =
        sent.hebrewText || (sent as unknown as { hebrew?: string }).hebrew || '';
      const cleanHeb = rawHeb
        .split(/\s+/)
        .filter((tok) => !isSmallRefMarkerToken(tok))
        .join(' ')
        .trim();

      let effectiveSentence: TalmudSentence = {
        ...sent,
        hebrewText: cleanHeb || rawHeb,
      };
      let effectiveWord = defaultWord;

      if (typeof window !== 'undefined' && window.getSelection) {
        const sel = window.getSelection();
        const selStr = sel ? sel.toString().trim() : '';
        if (selStr && selStr.length >= 2) {
          const cleanSel = selStr
            .split(/\s+/)
            .filter((tok) => !isSmallRefMarkerToken(tok))
            .join(' ')
            .trim();
          if (cleanSel) {
            effectiveWord = cleanSel;
            if (!effectiveSentence.hebrewText.includes(cleanSel)) {
              effectiveSentence = {
                ...effectiveSentence,
                hebrewText: `${effectiveSentence.hebrewText} • [მონიშნული ტექსტი: ${cleanSel}]`,
              };
            }
          }
        }
      }

      const rect = anchorEl.getBoundingClientRect();
      onSelectWordOrSentence(effectiveWord, effectiveSentence, rect, mode);
    },
    [onSelectWordOrSentence]
  );

  const renderInteractiveSentenceBlock = (
    sent: TalmudSentence,
    isRashiFont: boolean,
    isMainColumn: boolean,
    isCommentaryGridCard = false
  ) => {
    const rawHeb =
      sent.hebrewText || (sent as unknown as { hebrew?: string }).hebrew || '';
    const displayedHeb = formatHebrewWithNikud(rawHeb);
    const isDirectHover = hoveredSentence?.id === sent.id;
    const isCrossLinked = crossHighlightedIds.has(sent.id);
    const qCleanHe = normalizeHebrewWord(searchHighlightQuery || '');
    const isSearchMatched =
      Boolean(searchHighlightQuery?.trim()) &&
      ((qCleanHe.length >= 2 && normalizeHebrewWord(rawHeb).includes(qCleanHe)) ||
        (sent.translationKa || '')
          .toLowerCase()
          .includes((searchHighlightQuery || '').trim().toLowerCase()));
    const isSentenceSelected = selectedTarget?.sentence?.id === sent.id || isSearchMatched;
    const words = displayedHeb.split(/\s+/).filter(Boolean);
    const isCollapsed = collapsedSentenceIds.has(sent.id);
    const wordCitationMap = buildWordCitationIndexMap(words);

    return (
      <div
        key={sent.id}
        id={`sacred-sentence-${sent.id}`}
        data-search-matched={isSearchMatched ? 'true' : undefined}
        onMouseEnter={(e) => {
          if (liveCrossHighlight) setHoveredSentence(sent);
          if (isLineSweepMode && lastSweepSentenceIdRef.current !== sent.id) {
            lastSweepSentenceIdRef.current = sent.id;
            const targetEl = e.currentTarget as HTMLElement;
            const firstMeaningfulWord =
              words.find((w) => !isSmallRefMarkerToken(w)) || words[0] || '';
            triggerSentenceWithSelectionOption(sent, targetEl, firstMeaningfulWord, 'sentence-ka');
          }
        }}
        onClick={(e) => {
          const targetEl = e.currentTarget as HTMLElement;
          alignActiveWordAndLiftDaf(targetEl);
          const firstMeaningfulWord =
            words.find((w) => !isSmallRefMarkerToken(w)) || words[0] || '';
          triggerSentenceWithSelectionOption(sent, targetEl, firstMeaningfulWord, 'sentence-ka');
          if (isCommentaryGridCard && onOpenWordNote) {
            onOpenWordNote(firstMeaningfulWord, sent, targetEl.getBoundingClientRect());
          }
        }}
        className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm min-w-0 max-w-full overflow-hidden break-words ${
          isSentenceSelected
            ? 'bg-[#FDE68A]/75 border-2 border-[#B45309] ring-2 ring-[#D97706]/50 shadow-md text-[#1E130A]'
            : isDirectHover
              ? 'bg-[#FDE68A]/55 border-[#B45309] shadow-md'
              : isCrossLinked
                ? isMainColumn
                  ? 'bg-[#FDE68A]/45 border-[#D97706] shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-[#BAE6FD]/45 border-[#0284C7] shadow-[0_0_15px_rgba(2,132,199,0.28)]'
                : 'bg-white/88 border-sky-300/65 hover:border-sky-500 text-[#091326]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {sent.dibburHamatchil ? (
              <span
                dir="rtl"
                className="text-xs font-extrabold px-2 py-0.5 rounded bg-sky-100/90 text-[#091326] border border-sky-300/60"
              >
                {formatHebrewWithNikud(sent.dibburHamatchil)}
              </span>
            ) : (
              <span className="text-[10px] font-bold opacity-60">•</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isCrossLinked && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-700 text-white">
                დაკავშირებულია
              </span>
            )}
            <WindowsWindowControls
              isMinimized={isCollapsed}
              onToggleMinimize={() => toggleSentenceCollapsed(sent.id)}
              isMaximized={false}
              onToggleMaximize={() =>
                openSectionInFullscreen(
                  sent.dibburHamatchil || currentBook.nameKa,
                  sent.dibburHamatchil || currentBook.nameHe,
                  [sent]
                )
              }
              isDark={false}
              size="sm"
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key={`${sent.id}-body`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                dir="rtl"
                style={{
                  fontSize: `${Math.round(((isMainColumn ? 18 : 14.5) * dafFontSizeScale) / 100)}px`,
                  lineHeight: 1.62,
                }}
                className={`text-justify select-text text-[#091326] ${
                  isRashiFont && showRashiScript ? 'font-rashi' : 'font-serif'
                }`}
              >
                {words.map((word, wIdx) => {
                  const citForWord = wordCitationMap.get(wIdx);
                  const markerLetter = !citForWord ? isSmallRefMarkerToken(word) : null;
                  if (markerLetter) {
                    return (
                      <React.Fragment key={`${sent.id}-w-${wIdx}`}>
                        <sup
                          title="სქოლიოს / კომენტატორის მინიშნება (არ ითარგმნება სტრიქონთან ერთად)"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block text-[0.65em] font-serif font-bold opacity-55 px-0.5 select-none"
                        >
                          {word}
                        </sup>{' '}
                      </React.Fragment>
                    );
                  }

                  const nextWordCit = wordCitationMap.get(wIdx + 1);
                  const isCitSpanEnd = Boolean(citForWord && nextWordCit?.id !== citForWord.id);
                  const isCitTapped =
                    Boolean(citForWord) &&
                    activeTappedCitation?.sentenceId === sent.id &&
                    activeTappedCitation?.cit.id === citForWord?.id;

                  const activeRangeForSent =
                    sacredWordRange && sacredWordRange.sentenceId === sent.id
                      ? sacredWordRange
                      : null;
                  const rangeMin = activeRangeForSent
                    ? Math.min(activeRangeForSent.startIdx, activeRangeForSent.endIdx)
                    : -1;
                  const rangeMax = activeRangeForSent
                    ? Math.max(activeRangeForSent.startIdx, activeRangeForSent.endIdx)
                    : -1;
                  const isInsideRange =
                    activeRangeForSent !== null && wIdx >= rangeMin && wIdx <= rangeMax;

                  const cleaned = normalizeHebrewWord(word);
                  const isWordSelected =
                    isInsideRange ||
                    (isSentenceSelected &&
                      !activeRangeForSent &&
                      Boolean(selectedTarget?.cleanWord) &&
                      (selectedTarget?.cleanWord === cleaned || selectedTarget?.word === word));

                  // Requirement 1 & 4: Citation words have ONLY their letters in blue initially; tapping reveals the translucent diamond jump button at fixed normal screen size!
                  if (citForWord) {
                    return (
                      <React.Fragment key={`${sent.id}-w-${wIdx}`}>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (isCitTapped) {
                              setActiveTappedCitation(null);
                              setSacredWordRange(null);
                              handleCitationNavigate(citForWord, sent, {
                                left: rect.left,
                                top: rect.top,
                                right: rect.right,
                                bottom: rect.bottom,
                                width: rect.width,
                                height: rect.height,
                              });
                            } else {
                              let spanStart = wIdx;
                              let spanEnd = wIdx;
                              while (
                                spanStart > 0 &&
                                wordCitationMap.get(spanStart - 1)?.id === citForWord.id
                              ) {
                                spanStart--;
                              }
                              while (
                                spanEnd + 1 < words.length &&
                                wordCitationMap.get(spanEnd + 1)?.id === citForWord.id
                              ) {
                                spanEnd++;
                              }
                              setSacredWordRange({
                                sentenceId: sent.id,
                                startIdx: spanStart,
                                endIdx: spanEnd,
                                showHandles: false,
                              });
                              setActiveTappedCitation({
                                sentenceId: sent.id,
                                cit: citForWord,
                                anchorRect: {
                                  left: rect.left,
                                  top: rect.top,
                                  right: rect.right,
                                  bottom: rect.bottom,
                                  width: rect.width,
                                  height: rect.height,
                                },
                              });
                            }
                          }}
                          title={`1-ლი დაჭერა: გადასვლის ღილაკის ჩვენება • მე-2 დაჭერა: გადასვლა (${citForWord.labelKa})`}
                          className={`inline-block font-extrabold transition-colors cursor-pointer ${
                            isCitTapped
                              ? 'text-[#0E3299] dark:text-[#93C5FD] underline decoration-[#1545C8] decoration-2'
                              : 'text-[#1545C8] dark:text-[#60A5FA] hover:text-[#0E3299]'
                          }`}
                        >
                          {word}
                        </span>
                        {isCitSpanEnd && isCitTapped && (
                          <CrystalDiamondJumpButton
                            labelKa={`წყარო (Note): ${citForWord.labelKa}`}
                            citeHe={citForWord.labelHe}
                            anchorRect={activeTappedCitation?.anchorRect || null}
                            isDark={isDark}
                            onClick={(e) => {
                              e.stopPropagation();
                              const savedRect = activeTappedCitation?.anchorRect || null;
                              setActiveTappedCitation(null);
                              setSacredWordRange(null);
                              handleCitationNavigate(citForWord, sent, savedRect);
                            }}
                          />
                        )}{' '}
                      </React.Fragment>
                    );
                  }

                  const handleSacredWordPointerDown = () => {
                    if (sacredLongPressTimerRef.current) {
                      clearTimeout(sacredLongPressTimerRef.current);
                    }
                    // Requirement 3: Only on the 2nd press (when the word is already marked/colored) does a long-press (~300ms) reveal the two range-expansion balls!
                    if (isWordSelected) {
                      sacredLongPressTimerRef.current = setTimeout(() => {
                        setSacredWordRange((prev) =>
                          prev && prev.sentenceId === sent.id
                            ? { ...prev, showHandles: true }
                            : {
                                sentenceId: sent.id,
                                startIdx: wIdx,
                                endIdx: wIdx,
                                showHandles: true,
                              }
                        );
                      }, 300);
                    }
                  };

                  const clearSacredWordLongPress = () => {
                    if (sacredLongPressTimerRef.current) {
                      clearTimeout(sacredLongPressTimerRef.current);
                      sacredLongPressTimerRef.current = null;
                    }
                  };

                  return (
                    <React.Fragment key={`${sent.id}-w-${wIdx}`}>
                      <span
                        data-daf-word="true"
                        data-active-talmud-word={isWordSelected ? 'true' : undefined}
                        onMouseDown={handleSacredWordPointerDown}
                        onMouseUp={clearSacredWordLongPress}
                        onTouchStart={handleSacredWordPointerDown}
                        onTouchEnd={clearSacredWordLongPress}
                        onTouchCancel={clearSacredWordLongPress}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSacredWordLongPress();
                          setActiveTappedCitation(null);
                          if (!isWordSelected) {
                            setSacredWordRange({
                              sentenceId: sent.id,
                              startIdx: wIdx,
                              endIdx: wIdx,
                              showHandles: false,
                            });
                          }
                          const wordEl = e.currentTarget as HTMLElement;
                          alignActiveWordAndLiftDaf(wordEl);
                          const effectiveSelectedWord =
                            activeRangeForSent && isWordSelected
                              ? words.slice(rangeMin, rangeMax + 1).join(' ')
                              : word;
                          triggerSentenceWithSelectionOption(
                            sent,
                            wordEl,
                            effectiveSelectedWord,
                            'word-ka'
                          );
                          if (isCommentaryGridCard && onOpenWordNote) {
                            onOpenWordNote(effectiveSelectedWord, sent, wordEl.getBoundingClientRect());
                          }
                        }}
                        className={`inline-block rounded px-1 transition-all cursor-pointer ${
                          isWordSelected
                            ? 'bg-[#F59E0B] text-[#110B06] font-black ring-2 ring-[#78350F] shadow-md'
                            : 'hover:bg-[#D97706]/30'
                        }`}
                      >
                        {activeRangeForSent?.showHandles && wIdx === rangeMin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextMin = Math.max(0, rangeMin - 1);
                              setSacredWordRange({
                                sentenceId: sent.id,
                                startIdx: nextMin,
                                endIdx: rangeMax,
                                showHandles: true,
                              });
                              const wordEl = e.currentTarget.parentElement as HTMLElement;
                              if (wordEl) {
                                triggerSentenceWithSelectionOption(
                                  sent,
                                  wordEl,
                                  words.slice(nextMin, rangeMax + 1).join(' '),
                                  'word-ka'
                                );
                              }
                            }}
                            title="მონიშვნის გაფართოება მარჯვნივ"
                            className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-700 border border-white shadow-sm align-middle mx-0.5 cursor-ew-resize"
                          />
                        )}
                        {word}
                        {activeRangeForSent?.showHandles && wIdx === rangeMax && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextMax = Math.min(words.length - 1, rangeMax + 1);
                              setSacredWordRange({
                                sentenceId: sent.id,
                                startIdx: rangeMin,
                                endIdx: nextMax,
                                showHandles: true,
                              });
                              const wordEl = e.currentTarget.parentElement as HTMLElement;
                              if (wordEl) {
                                triggerSentenceWithSelectionOption(
                                  sent,
                                  wordEl,
                                  words.slice(rangeMin, nextMax + 1).join(' '),
                                  'word-ka'
                                );
                              }
                            }}
                            title="მონიშვნის გაფართოება მარცხნივ"
                            className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-700 border border-white shadow-sm align-middle mx-0.5 cursor-ew-resize"
                          />
                        )}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </div>

              {showGeorgianTranslation && sent.translationKa && (
                <div
                  className={`mt-2 pt-1.5 border-t text-xs leading-relaxed font-medium ${
                    isAuthenticPdfMode || isSentenceSelected
                      ? 'border-[#8B5A2B]/35 text-[#21140B]'
                      : isDark
                        ? 'border-[#5C3A21]/50 text-[#E8D8BE]'
                        : 'border-[#D5C3A1] text-[#2C1A10]'
                  }`}
                >
                  {sent.translationKa}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (realmId === 'torah') {
    return (
      <TorahDafInterface
        onChangeRealm={onChangeRealm}
        initialBookId={initialBookId}
        initialChapter={initialChapter}
        isDark={isDark}
        dafFontSizeScale={dafFontSizeScale}
        onChangeDafFontSizeScale={onChangeDafFontSizeScale}
        selectedTarget={selectedTarget}
        onSelectWordOrSentence={onSelectWordOrSentence}
        searchHighlightQuery={searchHighlightQuery}
        onNavigateToTalmudDaf={onNavigateToTalmudDaf}
        onRecordCitationReturnPoint={onRecordCitationReturnPoint}
        onOpenFloatingSourceDaf={onOpenFloatingSourceDaf}
        onOpenVoiceNav={onOpenVoiceNav}
        onOpenAiNav={onOpenAiNav}
      />
    );
  }

  return (
    <div className="w-full space-y-2 pb-16">
      {/* UNIVERSAL DAF NAVIGATION BAR — ALWAYS DIRECTLY ABOVE THE SACRED DAF */}
      <div
        className={`${
          isHeaderToolbarMaximized ? 'fixed inset-2 z-[260] overflow-y-auto' : ''
        } p-2.5 sm:p-3 rounded-2xl border shadow-md transition-all ${
          isDark
            ? 'bg-[#20150E]/95 border-[#C49A6C]/50 text-[#FAF5EB]'
            : 'bg-[#EADBC1]/95 border-[#6E472B]/50 text-[#1E130A]'
        }`}
      >
        {/* UNIFIED MULTI-COLUMN MASTER FILTERING MECHANISM (მრავალსვეტიანი ჭკვიანი გაფილტვრა — მშვიდი სამეფო დიზაინი) */}
        <div className="space-y-2.5">
          {/* TOP CONTROLS ROW: PREV / NEXT CHAPTER BUTTONS + FULL-WIDTH RESPONSIVE 4-COLUMN FILTER GRID */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 w-full">
            {/* Quick Prev / Next Step Buttons */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 shrink-0">
              <button
                type="button"
                data-flat-btn="true"
                onClick={handlePrevChapter}
                className={`px-3 py-2 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0 ${
                  isDark
                    ? 'bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] border-[#C49A6C]/60'
                    : 'bg-[#8C6239] hover:bg-[#7A4E2D] text-[#FAF5EB] border-[#4A2E1B]'
                }`}
                title="წინა თავი / სიმანი (◀)"
              >
                <span>◀ წინა</span>
              </button>

              <button
                type="button"
                data-flat-btn="true"
                onClick={handleNextChapter}
                className={`px-3 py-2 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0 ${
                  isDark
                    ? 'bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] border-[#C49A6C]/60'
                    : 'bg-[#8C6239] hover:bg-[#7A4E2D] text-[#FAF5EB] border-[#4A2E1B]'
                }`}
                title="შემდეგი თავი / სიმანი (▶)"
              >
                <span>შემდეგი ▶</span>
              </button>
            </div>

            {/* SYMMETRICAL 4-COLUMN MODERN FILTER SELECTORS — 100% FULL WIDTH ON EVERY COLUMN */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                parashaOptions.length > 1 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
              } gap-2 flex-1 min-w-0 w-full items-end`}
            >
              {/* COLUMN 1: სასწავლო სივრცე / კოდექსი */}
              <div className="w-full min-w-0">
                <SearchableSelect
                  label="სასწავლო სივრცე / კოდექსი:"
                  options={SACRED_REALMS.map((r) => ({
                    value: r.id,
                    badgeHe: r.badgeHe,
                    label: r.titleKa,
                    sublabel: r.subtitleKa,
                  }))}
                  value={realmId}
                  onChange={(val) => onChangeRealm(val as SacredRealmId)}
                  isDark={isDark}
                  compact
                  searchPlaceholder="მოძებნეთ სივრცე..."
                />
              </div>

              {/* COLUMN 2: წიგნი / ნაწილი (ספר) — FULL WIDTH */}
              <div className="w-full min-w-0">
                <SearchableSelect
                  label="წიგნი / ნაწილი (ספר):"
                  options={bookOptions}
                  value={currentBook.id}
                  onChange={(val) => {
                    setSelectedBookId(val);
                    setSelectedChapter(1);
                  }}
                  isDark={isDark}
                  compact
                  searchPlaceholder="მოძებნეთ წიგნი..."
                />
              </div>

              {/* PARASHA SELECTOR (ყველა ფარაშა — გაფილტვრის თვისებით) */}
              {parashaOptions.length > 1 && (
                <div className="w-full min-w-0">
                  <SearchableSelect
                    label="ყველა ფარაშა (54 פרשות):"
                    options={parashaOptions}
                    value={selectedParashaId}
                    onChange={(val) => {
                      setSelectedParashaId(val);
                      if (val && val !== 'all') {
                        const [bId, startCh] = val.split(':');
                        onChangeRealm('torah');
                        if (bId) setSelectedBookId(bId);
                        if (startCh) {
                          const ch = parseInt(startCh, 10) || 1;
                          setPageTurnDirection(ch >= selectedChapter ? 1 : -1);
                          setSelectedChapter(ch);
                        }
                      }
                    }}
                    isDark={isDark}
                    compact
                    searchPlaceholder="მოძებნეთ ფარაშა..."
                  />
                </div>
              )}

              {/* COLUMN 3: თავი / სიმანი (פרק / סימן) — GUARANTEED FULL WIDTH */}
              <div className="w-full min-w-0">
                <SearchableSelect
                  label="თავი / სიმანი (פרק / סימן):"
                  options={chapterOptions}
                  value={String(selectedChapter)}
                  onChange={(val) => {
                    const nextCh = parseInt(val, 10) || 1;
                    setPageTurnDirection(nextCh >= selectedChapter ? 1 : -1);
                    setSelectedChapter(nextCh);
                  }}
                  isDark={isDark}
                  compact
                  searchPlaceholder="მოძებნეთ თავი ან სიმანი..."
                />
              </div>

              {/* COLUMN 4: UNIFIED READING & TRANSLATION MODES (CALM SANCTUARY SEGMENTED BUTTONS) */}
              <div className="w-full min-w-0">
                <span
                  className={`block text-[10.5px] font-bold tracking-tight mb-1 truncate ${
                    isDark ? 'text-[#E8D8BE]' : 'text-[#3E2412]'
                  }`}
                >
                  კითხვისა და ტექსტის რეჟიმები:
                </span>
                <div
                  className={`p-1 rounded-xl border grid grid-cols-3 gap-1 w-full ${
                    isDark ? 'bg-[#180E08]/85 border-[#5C3A21]' : 'bg-[#FAF3E3] border-[#8B5A2B]/40'
                  }`}
                >
                  {/* Georgian Translation Toggle */}
                  <button
                    type="button"
                    data-flat-btn="true"
                    onClick={() => setShowGeorgianTranslation((v) => !v)}
                    className={`py-1 px-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap border text-center truncate ${
                      showGeorgianTranslation
                        ? isDark
                          ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-xs'
                          : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-xs'
                        : isDark
                          ? 'text-[#E8D8BE] hover:text-white hover:bg-white/5 border-transparent'
                          : 'text-[#2C1A10] hover:text-black hover:bg-black/5 border-transparent'
                    }`}
                    title="ქართული თარგმანის ჩართვა / გამორთვა"
                  >
                    ქართული
                  </button>

                  {/* Nikud Toggle */}
                  <button
                    type="button"
                    data-flat-btn="true"
                    onClick={() => setShowNikud((v) => !v)}
                    className={`py-1 px-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap border text-center truncate ${
                      showNikud
                        ? isDark
                          ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-xs'
                          : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-xs'
                        : isDark
                          ? 'text-[#E8D8BE] hover:text-white hover:bg-white/5 border-transparent'
                          : 'text-[#2C1A10] hover:text-black hover:bg-black/5 border-transparent'
                    }`}
                    title="ნიკუდის (ხმოვნების) ჩართვა / გამორთვა"
                  >
                    <span dir="rtl" className="font-serif">ניקוד</span>
                  </button>

                  {/* Line Sweep Toggle */}
                  <button
                    type="button"
                    data-flat-btn="true"
                    onClick={() => {
                      setIsLineSweepMode((v) => {
                        const next = !v;
                        lastSweepSentenceIdRef.current = null;
                        return next;
                      });
                    }}
                    className={`py-1 px-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap border text-center truncate ${
                      isLineSweepMode
                        ? isDark
                          ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-xs'
                          : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-xs'
                        : isDark
                          ? 'text-[#E8D8BE] hover:text-white hover:bg-white/5 border-transparent'
                          : 'text-[#2C1A10] hover:text-black hover:bg-black/5 border-transparent'
                    }`}
                    title="სტრიქონზე გადატარებით თარგმნა (Line Sweep)"
                  >
                    სტრიქონი
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY TOOLS ROW: CALM ZOOM CONTROLS, ADVANCED ACCENTS TOGGLE & WINDOWS CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#8B5A2B]/25">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Zoom Buttons with Calm Palette */}
              <div
                className={`flex items-center gap-1 p-0.5 rounded-xl border ${
                  isDark ? 'bg-[#180E08]/85 border-[#5C3A21]' : 'bg-[#FAF3E3] border-[#8B5A2B]/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSacredZoom((z) => Math.max(70, z - 12))}
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center cursor-pointer transition-all ${
                    isDark ? 'hover:bg-white/10 text-[#E8D8BE]' : 'hover:bg-black/5 text-[#2C1D11]'
                  }`}
                  title="დაპატარავება"
                >
                  －
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSacredZoom(100);
                    setSacredPanX(0);
                    setSacredPanY(0);
                    setDafSyncOffsetY(0);
                    if (onChangeDafFontSizeScale) onChangeDafFontSizeScale(100);
                  }}
                  className={`px-2 h-7 rounded-lg font-mono font-black text-[11px] flex items-center justify-center cursor-pointer transition-all ${
                    isDark ? 'hover:bg-white/10 text-amber-300' : 'hover:bg-black/5 text-[#6B4226]'
                  }`}
                  title="საწყის ზომაზე დაბრუნება (100%)"
                >
                  {sacredZoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setSacredZoom((z) => Math.min(200, z + 12))}
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center cursor-pointer transition-all ${
                    isDark ? 'hover:bg-white/10 text-[#E8D8BE]' : 'hover:bg-black/5 text-[#2C1D11]'
                  }`}
                  title="გადიდება"
                >
                  ＋
                </button>
              </div>

              {/* Optional Halakhic Accent & Yalkut Yosef Hub Toggle */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => setIsSelectorRibbonOpen((v) => !v)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                  isSelectorRibbonOpen
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#2B1D14] text-[#E8D8BE] border-[#5C3A21] hover:border-[#C49A6C]'
                      : 'bg-[#FAF3E3] text-[#2C1A10] border-[#8B5A2B]/40 hover:bg-[#F2E5D0]'
                }`}
                title="ჰალახის სკოლისა და სპეციალური ჰაბის გაფართოება"
              >
                <span>სკოლა & ჰაბი</span>
                {isSelectorRibbonOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Windows Controls in Calm Sanctuary Finish */}
            <div className="flex items-center gap-1.5 shrink-0">
              <WindowsWindowControls
                isMinimized={isHeaderToolbarMinimized}
                onToggleMinimize={() => setIsHeaderToolbarMinimized((v) => !v)}
                isMaximized={isHeaderToolbarMaximized}
                onToggleMaximize={() => {
                  setIsHeaderToolbarMinimized(false);
                  setIsHeaderToolbarMaximized((v) => !v);
                }}
                isFullScreen={isSacredDafFullScreen}
                onToggleFullScreen={() => setIsSacredDafFullScreen((v) => !v)}
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* OPTIONAL FILTERABLE SEARCHABLE DRAWER (Only shown when user clicks "📚 სარჩევი") */}
        <AnimatePresence initial={false}>
          {!isHeaderToolbarMinimized && isSelectorRibbonOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-2.5 mt-2 border-t border-[#8B5A2B]/30 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
                  <SearchableSelect
                    label="სასწავლო სივრცე / კოდექსი:"
                    options={SACRED_REALMS.map((r) => ({
                      value: r.id,
                      badgeHe: r.badgeHe,
                      label: r.titleKa,
                      sublabel: r.subtitleKa,
                    }))}
                    value={realmId}
                    onChange={(val) => onChangeRealm(val as SacredRealmId)}
                    isDark={isDark}
                    searchPlaceholder="მოძებნეთ სივრცე..."
                  />

                  <SearchableSelect
                    label="წიგნი / ნაწილი (ספר):"
                    options={bookOptions}
                    value={currentBook.id}
                    onChange={(val) => {
                      setSelectedBookId(val);
                      setSelectedChapter(1);
                    }}
                    isDark={isDark}
                    searchPlaceholder="მოძებნეთ წიგნი..."
                  />

                  <SearchableSelect
                    label="ჰალახის / თანახის სკოლა:"
                    options={[
                      { value: 'classic', badgeHe: 'צורת הדף', label: 'კლასიკური დაფის ვიზუალი (Tzurat HaDaf)' },
                      { value: 'sephardic', badgeHe: 'ספרד', label: 'სეფარადული ჰალახის აქცენტი' },
                      { value: 'ashkenazi', badgeHe: 'אשכנז', label: 'აშკენაზური ჰალახის აქცენტი' },
                    ]}
                    value={selectedSchoolAccent}
                    onChange={(val) => setSelectedSchoolAccent(val as 'classic' | 'sephardic' | 'ashkenazi')}
                    isDark={isDark}
                    searchPlaceholder="აირჩიეთ რეჟიმი..."
                  />

                  <SearchableSelect
                    label="თავი / სიმანი (פרק / סימן):"
                    options={chapterOptions}
                    value={String(selectedChapter)}
                    onChange={(val) => {
                      const nextCh = parseInt(val, 10) || 1;
                      setPageTurnDirection(nextCh >= selectedChapter ? 1 : -1);
                      setSelectedChapter(nextCh);
                    }}
                    isDark={isDark}
                    searchPlaceholder="მოძებნეთ თავი ან სიმანი..."
                  />
                </div>

                {(realmId === 'yalkut-yosef' ||
                  (realmId === 'sephardic-halakha' && currentBook.id.startsWith('Yalkut_Yosef'))) && (
                  <YalkutYosefKitzurSmartHub
                    isDark={isDark}
                    currentBook={currentBook}
                    selectedChapter={selectedChapter}
                    onSelectBookAndSiman={(nextBookId, nextSiman) => {
                      if (realmId !== 'yalkut-yosef' && nextBookId.startsWith('Yalkut_Yosef_Kitzur')) {
                        onChangeRealm('yalkut-yosef');
                      }
                      setSelectedBookId(nextBookId);
                      setPageTurnDirection(nextSiman >= selectedChapter ? 1 : -1);
                      setSelectedChapter(nextSiman);
                      setIsSelectorRibbonOpen(false);
                    }}
                    onNavigateToTalmudDaf={onNavigateToTalmudDaf}
                    onOpenDailyTwoHalakhot={() => onChangeRealm('daily-halakhot')}
                    showClassicDafBelow={showYalkutClassicDafBelow}
                    onToggleShowClassicDafBelow={setShowYalkutClassicDafBelow}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SACRED DAF IS ALWAYS IMMEDIATELY VISIBLE ON SCREEN */}
      <>

          {/* REALISTIC 3D BOOK PAGE-TURN ANIMATION WRAPPER AROUND THE CLASSIC DAF */}
          <PageFlip3DWrapper
            pageKey={`${realmId}-${currentBook.id}-${selectedChapter}`}
            direction={pageTurnDirection}
            isDark={isDark}
            pageLabelHe={`${currentBook.nameHe} • ${numberToHebrewGematria(selectedChapter)}`}
            pageLabelKa={`${currentBook.nameKa} • თავი/სიმანი ${selectedChapter}`}
            onPrevPage={handlePrevChapter}
            onNextPage={handleNextChapter}
          >
        <div
          ref={sacredPdfViewportRef}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 8 : -8;
              setSacredZoom((z) => Math.max(70, Math.min(200, z + delta)));
            }
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              pinchStateRef.current = {
                dist: Math.hypot(dx, dy),
                startScale: sacredZoom,
              };
              sacredDragRef.current = null;
              return;
            }
            if (e.touches.length === 1 && (isSacredPanMode || sacredZoom > 102)) {
              const t = e.touches[0];
              sacredDragRef.current = {
                startX: t.clientX,
                startY: t.clientY,
                initX: sacredPanX,
                initY: sacredPanY,
              };
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && pinchStateRef.current) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const dist = Math.hypot(dx, dy);
              if (pinchStateRef.current.dist > 10) {
                const ratio = dist / pinchStateRef.current.dist;
                const nextZoom = Math.round(
                  Math.max(70, Math.min(200, pinchStateRef.current.startScale * ratio))
                );
                setSacredZoom(nextZoom);
              }
              return;
            }
            if (e.touches.length === 1 && sacredDragRef.current) {
              const t = e.touches[0];
              setSacredPanX(sacredDragRef.current.initX + (t.clientX - sacredDragRef.current.startX));
              setSacredPanY(sacredDragRef.current.initY + (t.clientY - sacredDragRef.current.startY));
            }
          }}
          onTouchEnd={() => {
            sacredDragRef.current = null;
            pinchStateRef.current = null;
          }}
          onMouseDown={(e) => {
            if (isSacredPanMode || sacredZoom > 102) {
              sacredDragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initX: sacredPanX,
                initY: sacredPanY,
              };
            }
          }}
          onMouseMove={(e) => {
            if (sacredDragRef.current) {
              setSacredPanX(sacredDragRef.current.initX + (e.clientX - sacredDragRef.current.startX));
              setSacredPanY(sacredDragRef.current.initY + (e.clientY - sacredDragRef.current.startY));
            }
          }}
          onMouseUp={() => {
            sacredDragRef.current = null;
          }}
          onMouseLeave={() => {
            sacredDragRef.current = null;
          }}
          style={{
            transform: dafSyncOffsetY !== 0 && !isSacredDafFullScreen ? `translateY(${dafSyncOffsetY}px)` : undefined,
            transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
            touchAction: isSacredPanMode ? 'none' : 'pan-x pan-y',
          }}
          className={
            isSacredDafFullScreen
              ? 'fixed inset-0 z-[150] w-screen h-[100dvh] m-0 p-0 bg-[#FAF4E4] flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden'
              : isAuthenticPdfMode
                ? 'w-full max-w-full flex justify-center items-start py-2 px-1 overflow-x-auto overflow-y-visible'
                : 'w-full'
          }
        >
        {isSacredDafFullScreen && (
          <div className="sticky top-0 z-30 w-full px-2.5 py-1.5 bg-[#FAF3E3] dark:bg-[#1B120B]/95 border-b border-[#C8B28E] dark:border-amber-200/50 text-[#2C1D11] dark:text-[#FAF5EB] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setIsSacredDafFullScreen(false);
                  setIsLineSweepMode(false);
                  lastSweepSentenceIdRef.current = null;
                }}
                className="p-1.5 rounded-lg bg-[#6B4226] text-[#FAF5EB] flex items-center gap-1 text-xs font-extrabold cursor-pointer"
                title="უკან დაბრუნება"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>უკან</span>
              </button>
              <div className="text-xs font-black truncate">
                {currentBook.nameKa} • <span dir="rtl" className="font-serif text-[#6B4226] dark:text-amber-300">{currentBook.nameHe} {numberToHebrewGematria(selectedChapter)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(sacredZoom !== 100 || sacredPanX !== 0 || sacredPanY !== 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSacredZoom(100);
                    setSacredPanX(0);
                    setSacredPanY(0);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500 text-[#1F1209] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>100%</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSacredDafFullScreen(false);
                  setIsLineSweepMode(false);
                  lastSweepSentenceIdRef.current = null;
                }}
                className="px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>გამოსვლა</span>
              </button>
            </div>
          </div>
        )}
        <div
          id="talmud-daf-folio-anchor"
          data-paper-format={isAuthenticPdfMode || isSacredDafFullScreen ? 'A4' : undefined}
          style={
            isAuthenticPdfMode || isSacredDafFullScreen
              ? {
                  width: '794px',
                  minWidth: '794px',
                  maxWidth: '794px',
                  height: isSacredDafFullScreen
                    ? `${Math.max(1123, Math.round(((typeof window !== 'undefined' ? window.innerHeight : 1123) - 42) / sacredA4Scale))}px`
                    : '1123px',
                  minHeight: isSacredDafFullScreen
                    ? `${Math.max(1123, Math.round(((typeof window !== 'undefined' ? window.innerHeight : 1123) - 42) / sacredA4Scale))}px`
                    : '1123px',
                  maxHeight: isSacredDafFullScreen ? undefined : '1123px',
                  aspectRatio: isSacredDafFullScreen ? undefined : '210 / 297',
                  zoom: `${Math.round((sacredA4Scale * (dafFontSizeScale || 100) * sacredZoom) / 100)}%`,
                  transform:
                    sacredPanX !== 0 || sacredPanY !== 0
                      ? `translate3d(${sacredPanX}px, ${sacredPanY}px, 0)`
                      : undefined,
                  cursor: isSacredPanMode ? 'grab' : undefined,
                  boxShadow: isSacredDafFullScreen
                    ? 'none'
                    : isDark
                      ? '0 22px 55px rgba(0,0,0,0.78), 0 0 0 2px #8B5A2B, inset 0 0 0 4px #FAF4E4, inset 0 0 0 5px rgba(110,71,43,0.45), inset 0 0 48px rgba(139,90,43,0.14)'
                      : '0 18px 42px rgba(92,58,33,0.28), 0 0 0 2px #8B5A2B, inset 0 0 0 4px #FAF4E4, inset 0 0 0 5px rgba(110,71,43,0.45), inset 0 0 48px rgba(139,90,43,0.11)',
                }
              : {
                  transform:
                    sacredPanX !== 0 || sacredPanY !== 0
                      ? `translate3d(${sacredPanX}px, ${sacredPanY}px, 0)`
                      : undefined,
                }
          }
          className={`relative crystal-daf-folio overflow-hidden ${
            isAuthenticPdfMode || isSacredDafFullScreen
              ? `w-[794px] min-w-[794px] max-w-[794px] shrink-0 mx-auto text-[#091326] px-5 pt-4 pb-4 flex flex-col justify-between ${
                  isSacredDafFullScreen ? 'rounded-none border-0' : 'h-[1123px] min-h-[1123px] max-h-[1123px] aspect-[210/297] rounded-2xl'
                }`
              : 'rounded-3xl p-3 sm:p-5 text-[#091326]'
          }`}
        >
          {showLineGuide && (
            <ReadingLineGuide
              initialY={140}
              isDarkField={isDark && !isAuthenticPdfMode}
              fieldLabel={`${currentBook.nameKa} ${selectedChapter}`}
            />
          )}

          {/* CLASSIC VILNA / MIKRAOT GEDOLOT ARCHED CROWN HEADER WITH WINDOWS DAF CONTROLS */}
          <div className="shrink-0 flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b-2 border-[#8B5A2B]/45">
            <div className="text-center flex-1 min-w-0">
              <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-3 sm:px-5 py-1 sm:py-1.5 rounded-2xl border border-[#8B5A2B]/50 bg-[#6B4226]/10 max-w-full">
                <span className="text-[11px] sm:text-sm font-extrabold truncate">
                  {currentBook.nameKa}
                </span>
                <span className="opacity-40">•</span>
                <span dir="rtl" className="font-serif text-sm sm:text-2xl font-black whitespace-nowrap">
                  {currentBook.nameHe} — {numberToHebrewGematria(selectedChapter)}
                </span>
                {selectedSchoolAccent !== 'classic' && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/25 border border-amber-500/50 text-amber-900 dark:text-amber-200">
                    {selectedSchoolAccent === 'sephardic' ? 'ספרד • სეფარადული აქცენტი' : 'אשכנז • აშკენაზური აქცენტი'}
                  </span>
                )}
              </div>
              {loadingLiveSefaria && (
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#8B6234]">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span className="truncate">იტვირთება ორიგინალი ტექსტი Sefaria-დან...</span>
                </div>
              )}
            </div>
            <WindowsWindowControls
              isMinimized={isSacredDafMinimized}
              onToggleMinimize={() => setIsSacredDafMinimized((v) => !v)}
              isMaximized={isSacredDafFullScreen}
              onToggleMaximize={() => setIsSacredDafFullScreen((v) => !v)}
              isFullScreen={isSacredDafFullScreen}
              onToggleFullScreen={() => setIsSacredDafFullScreen((v) => !v)}
              isDark={isDark && !isAuthenticPdfMode}
              size="sm"
            />
          </div>

          {!isSacredDafMinimized && (
            <>
              {/* 3-COLUMN CLASSIC TZURAT HADAF / MIKRAOT GEDOLOT / NOSEI KELIM GRID WITH SYMMETRICAL SCROLLABLE PANELS */}
              <div
                className={
                  isAuthenticPdfMode
                    ? 'flex-1 min-h-0 grid grid-cols-12 gap-3 items-stretch overflow-hidden'
                    : 'grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch'
                }
              >
                {/* RIGHT OUTER COLUMN */}
                <div
                  onMouseEnter={() => emitSacredColFocus('right')}
                  onClick={() => emitSacredColFocus('right')}
                  className={
                    isAuthenticPdfMode
                      ? 'col-span-3 h-full min-h-0 flex flex-col gap-2 min-w-0 overflow-hidden'
                      : 'lg:col-span-3 flex flex-col gap-2 min-w-0'
                  }
                >
                  <div
                    className={`px-2.5 py-2 rounded-xl crystal-daf-header border border-sky-300/65 flex items-center justify-between gap-1.5 font-extrabold text-xs shrink-0 text-[#091326] ${
                      focusedSacredCol === 'right' ? 'crystal-daf-pane-focused ' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div dir="rtl" className="font-serif text-xs sm:text-sm font-black truncate">
                        {colConfig.rightHeaderHe}
                      </div>
                      <div className="text-[10px] opacity-85 truncate">{colConfig.rightHeaderKa}</div>
                    </div>
                  </div>
                  {!minimizedSacredCols['right'] && (
                    <div
                      className={`space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-1 ${
                        isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[540px]'
                      }`}
                    >
                      {activeRightSentences.map((s) =>
                        renderInteractiveSentenceBlock(s, true, false)
                      )}
                    </div>
                  )}
                </div>

                {/* CENTER SACRED PILLAR (Targum/Hasagot Top + Main Sacred Text Center) */}
                <div
                  className={
                    isAuthenticPdfMode
                      ? 'col-span-6 h-full min-h-0 flex flex-col gap-2.5 min-w-0 overflow-hidden'
                      : 'lg:col-span-6 flex flex-col gap-3 min-w-0'
                  }
                >
                  {/* Center Top Box (Targum Onkelos / Yonatan / Raavad / Bach / Be'er HaGolah / Chida) */}
                  <div
                    onMouseEnter={() => emitSacredColFocus('centerTop')}
                    onClick={() => emitSacredColFocus('centerTop')}
                    className={`p-2.5 sm:p-3 rounded-2xl crystal-daf-pane flex flex-col ${
                      focusedSacredCol === 'centerTop' ? 'crystal-daf-pane-focused ' : ''
                    }${isAuthenticPdfMode ? 'flex-1 min-h-0 overflow-hidden' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-sky-300/60 shrink-0">
                      <span className="text-xs font-extrabold truncate">{colConfig.centerTopHeaderKa}</span>
                      <span dir="rtl" className="font-serif text-xs sm:text-sm font-black">
                        {colConfig.centerTopHeaderHe}
                      </span>
                    </div>
                    {!minimizedSacredCols['centerTop'] && (
                      <div
                        className={`space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2.5 ${
                          isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[200px]'
                        }`}
                      >
                        {activeTopSentences.map((s) =>
                          renderInteractiveSentenceBlock(s, false, false)
                        )}
                      </div>
                    )}
                  </div>

                  {/* Center Main Sacred Text Box (Torah / Neviim / Ketuvim / Rambam / Tur / Shulchan Aruch) */}
                  <div
                    onMouseEnter={() => emitSacredColFocus('centerMain')}
                    onClick={() => emitSacredColFocus('centerMain')}
                    className={`p-3 sm:p-4 rounded-2xl crystal-daf-pane flex flex-col ${
                      focusedSacredCol === 'centerMain' ? 'crystal-daf-pane-focused ' : ''
                    }${isAuthenticPdfMode ? 'flex-[1.55] min-h-0 overflow-hidden' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b-2 border-[#8B5A2B]/40 shrink-0">
                      <span className="text-xs sm:text-sm font-black truncate">
                        {colConfig.centerMainHeaderKa}
                      </span>
                      <span dir="rtl" className="font-serif text-sm sm:text-lg font-black">
                        {colConfig.centerMainHeaderHe}
                      </span>
                    </div>
                    {!minimizedSacredCols['centerMain'] && (
                      <div
                        className={`space-y-3 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-3 ${
                          isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[340px]'
                        }`}
                      >
                        {activeMainSentences.map((s) =>
                          renderInteractiveSentenceBlock(s, false, true)
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* LEFT OUTER COLUMN */}
                <div
                  onMouseEnter={() => emitSacredColFocus('left')}
                  onClick={() => emitSacredColFocus('left')}
                  className={
                    isAuthenticPdfMode
                      ? 'col-span-3 h-full min-h-0 flex flex-col gap-2 min-w-0 overflow-hidden'
                      : 'lg:col-span-3 flex flex-col gap-2 min-w-0'
                  }
                >
                  <div
                    className={`px-2.5 py-2 rounded-xl crystal-daf-header border border-sky-300/65 flex items-center justify-between gap-1.5 font-extrabold text-xs shrink-0 text-[#091326] ${
                      focusedSacredCol === 'left' ? 'crystal-daf-pane-focused ' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div dir="rtl" className="font-serif text-xs sm:text-sm font-black truncate">
                        {colConfig.leftHeaderHe}
                      </div>
                      <div className="text-[10px] opacity-85 truncate">{colConfig.leftHeaderKa}</div>
                    </div>
                  </div>
                  {!minimizedSacredCols['left'] && (
                    <div
                      className={`space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2.5 ${
                        isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[540px]'
                      }`}
                    >
                      {activeLeftSentences.map((s) =>
                        renderInteractiveSentenceBlock(s, true, false)
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM DUAL COMMENTARY BAND */}
              <div
                className={
                  isAuthenticPdfMode
                    ? 'h-[168px] shrink-0 mt-2.5 pt-2 border-t-2 border-[#8B5A2B]/40 grid grid-cols-2 gap-3 overflow-hidden'
                    : 'mt-4 pt-3 border-t-2 border-[#8B5A2B]/40 grid grid-cols-1 md:grid-cols-2 gap-3.5'
                }
              >
                <div
                  onMouseEnter={() => emitSacredColFocus('bottomRight')}
                  onClick={() => emitSacredColFocus('bottomRight')}
                  className={`p-2.5 rounded-2xl crystal-daf-pane flex flex-col ${
                    focusedSacredCol === 'bottomRight' ? 'crystal-daf-pane-focused ' : ''
                  }${isAuthenticPdfMode ? 'h-full min-h-0 overflow-hidden' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-sky-300/60 shrink-0">
                    <span className="text-xs font-extrabold truncate">{colConfig.bottomRightHeaderKa}</span>
                    <span dir="rtl" className="font-serif text-sm font-black">
                      {colConfig.bottomRightHeaderHe}
                    </span>
                  </div>
                  {!minimizedSacredCols['bottomRight'] && (
                    <div
                      className={`space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2.5 ${
                        isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[240px]'
                      }`}
                    >
                      {activeBottomRight.map((s) =>
                        renderInteractiveSentenceBlock(s, true, false)
                      )}
                    </div>
                  )}
                </div>

                <div
                  onMouseEnter={() => emitSacredColFocus('bottomLeft')}
                  onClick={() => emitSacredColFocus('bottomLeft')}
                  className={`p-2.5 rounded-2xl crystal-daf-pane flex flex-col ${
                    focusedSacredCol === 'bottomLeft' ? 'crystal-daf-pane-focused ' : ''
                  }${isAuthenticPdfMode ? 'h-full min-h-0 overflow-hidden' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-[#8B5A2B]/30 shrink-0">
                    <span className="text-xs font-extrabold truncate">{colConfig.bottomLeftHeaderKa}</span>
                    <span dir="rtl" className="font-serif text-sm font-black">
                      {colConfig.bottomLeftHeaderHe}
                    </span>
                  </div>
                  {!minimizedSacredCols['bottomLeft'] && (
                    <div
                      className={`space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2.5 ${
                        isAuthenticPdfMode ? 'flex-1 min-h-0' : 'max-h-[240px]'
                      }`}
                    >
                      {activeBottomLeft.map((s) =>
                        renderInteractiveSentenceBlock(s, true, false)
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </PageFlip3DWrapper>

      {/* RESPONSIVE CSS GRID COMMENTARY CARDS (#daf-section-sefaria-all PARITY WITH TALMUD INTERFACE) */}
      {showBelowDaf && (
        <section
          id="daf-section-sefaria-all"
          className={
            isBelowCardsMaximized
              ? `fixed inset-2 z-[260] overflow-y-auto p-3.5 sm:p-5 rounded-3xl border-2 shadow-2xl ${
                  isDark
                    ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                    : 'bg-[#F5E9D3] border-[#8B5A2B] text-[#1E130A]'
                }`
              : `relative z-20 p-3.5 sm:p-5 pb-20 rounded-3xl border shadow-lg overflow-visible ${
                  isDark
                    ? 'bg-[#1D140D]/95 border-[#C49A6C]/45 text-[#FAF5EB]'
                    : 'bg-[#F5E9D3] border-[#8B5A2B]/45 text-[#1E130A]'
                }`
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#8B5A2B]/35">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  ყველა კომენტატორი ბარათებად • {currentBook.nameKa} ({selectedChapter})
                </span>
              </h3>
              <p className="text-[11px] opacity-80">
                რაში, თოსაფოთი და კლასიკური მეფარშიმი ცალკე ბარათებად, წყაროებზე მყისიერი გადასვლითა და გლუვი გაშლით
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleBelowDaf && (
                <button
                  type="button"
                  onClick={onToggleBelowDaf}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#C49A6C]/45 bg-[#5C3A21] text-[#FAF5EB] cursor-pointer"
                >
                  პანელის დამალვა
                </button>
              )}
              <WindowsWindowControls
                isMinimized={isBelowCardsMinimized}
                onToggleMinimize={() => setIsBelowCardsMinimized((v) => !v)}
                isMaximized={isBelowCardsMaximized}
                onToggleMaximize={() => {
                  setIsBelowCardsMinimized(false);
                  setIsBelowCardsMaximized((v) => !v);
                }}
                onClose={onToggleBelowDaf}
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-stretch ${isBelowCardsMinimized ? 'hidden' : ''}`}>
            {[
              ...activeRightSentences.map((s) => ({
                sent: s,
                badgeHe: colConfig.rightHeaderHe,
                badgeKa: colConfig.rightHeaderKa,
              })),
              ...activeLeftSentences.map((s) => ({
                sent: s,
                badgeHe: colConfig.leftHeaderHe,
                badgeKa: colConfig.leftHeaderKa,
              })),
              ...activeBottomRight.map((s) => ({
                sent: s,
                badgeHe: colConfig.bottomRightHeaderHe,
                badgeKa: colConfig.bottomRightHeaderKa,
              })),
              ...activeBottomLeft.map((s) => ({
                sent: s,
                badgeHe: colConfig.bottomLeftHeaderHe,
                badgeKa: colConfig.bottomLeftHeaderKa,
              })),
            ].map(({ sent, badgeHe, badgeKa }) => (
              <div
                key={`grid-card-${sent.id}`}
                className={`p-3 rounded-2xl border shadow-md transition-all min-w-0 max-w-full overflow-hidden flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#25180F] border-[#C49A6C]/40'
                    : 'bg-[#FFFDF8] border-[#8B5A2B]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-[#8B5A2B]/25 min-w-0">
                  <span className="text-[11px] font-extrabold text-[#6B4226] dark:text-amber-300 truncate">
                    {badgeKa}
                  </span>
                  <span dir="rtl" className="font-serif text-xs font-black shrink-0">
                    {badgeHe}
                  </span>
                </div>
                <div className="min-w-0 max-w-full overflow-x-hidden overflow-y-auto max-h-[360px] pr-0.5">
                  {renderInteractiveSentenceBlock(sent, true, false, true)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </>

      {fullscreenModal && (
        <FullScreenModal
          isOpen={Boolean(fullscreenModal)}
          onClose={() => setFullscreenModal(null)}
          title={fullscreenModal.title}
          subtitle={fullscreenModal.subtitle}
          hebrewText={fullscreenModal.hebrewText}
          georgianText={fullscreenModal.georgianText}
          isDark={isDark}
        />
      )}

      {/* EMBEDDED SEPHARDIC & ASHKENAZI POSKIM MASTER GRID WHEN USER OPENS BELOW-DAF */}
      {showBelowDaf &&
        (realmId === 'rambam' ||
          realmId === 'tur' ||
          realmId === 'shulchan-aruch' ||
          realmId === 'mishnah-berurah' ||
          realmId === 'sephardic-halakha') && (
          <div className="pt-2">
            <PoskimHalachaMasterGrid
              dafData={curatedPage as unknown as never}
              tractateNameHe={currentBook.nameHe}
              tractateNameKa={currentBook.nameKa}
              dafId={String(selectedChapter)}
              isDark={isDark}
            />
          </div>
        )}
    </div>
  );
});
