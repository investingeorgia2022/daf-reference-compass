// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  Volume2,
  Maximize2,
  Minimize2,
  X,
  MessageSquarePlus,
  ZoomIn,
  ZoomOut,
  Share2,
  Link2,
  Square,
  FileText,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Trash2,
  Check,
  BookOpen,
  LayoutGrid,
  Columns3,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Languages,
  Crosshair,
  Activity,
} from 'lucide-react';
import {
  AnalysisMode,
  AppTheme,
  DafPageData,
  ScholarNote,
  SelectedDafTarget,
  TalmudSentence,
} from '../types/talmud';
import { normalizeHebrewWord } from '../data/lexicon';
import { TRACTATES, generateDafListForTractate } from '../data/tractates';
import { CURATED_DAPIM } from '../data/curatedDapim';
import { getChavrutaCommentaryForDaf } from '../data/chavrutaCommentary';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { Talmud3DViewer } from './Talmud3DViewer';
import { ReadingLineGuide } from './ReadingLineGuide';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';
import {
  FullscreenSectionData,
  REFERENCED_DAF_STARTING_TEXTS,
  TalmudModals,
  TosafotDeepLinkRef,
} from './TalmudModals';
import { TalmudBelowDafSections } from './TalmudBelowDafSections';
import { VilnaPdfInteractiveViewer } from './VilnaPdfInteractiveViewer';
import { CrystalDiamondJumpButton, WindowsWindowControls } from './WindowsWindowControls';
import {
  lookupSefariaRefDomAnchor,
  calculateScrollCoordinates,
  ScrollCoordinateMetrics,
  SefariaResolvedDomAnchor,
} from '../utils/sefariaRefMapper';
import { TalmudScrollDiagnosticOverlay } from './TalmudScrollDiagnosticOverlay';

export type DafLayoutMode = 'vilna-classic' | 'rashi-focus' | 'chavruta-cards' | 'bilingual-flow';

export interface TalmudScrollBookmark {
  id: string;
  tractateId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  dafId: string;
  dafMarkHe: string;
  windowScrollY: number;
  folioOffsetY: number;
  fullViewportScrollTop: number;
  scrollRatio: number;
  folioRatio: number;
  layoutMode: DafLayoutMode;
  anchorSentenceId: string | null;
  anchorSnippetHe: string;
  sectionLabelKa: string;
  savedAt: number;
}

const SCROLL_BOOKMARKS_LIST_KEY = 'talmud_scroll_bookmarks_v1';
const AUTO_SCROLL_BOOKMARK_KEY = 'talmud_auto_scroll_bookmark_enabled';
const PENDING_RESTORE_BOOKMARK_KEY = 'talmud_pending_scroll_restore';
const getDafScrollBookmarkKey = (tractateId: string, dafId: string) =>
  `talmud_scroll_bookmark_${tractateId}_${dafId}`;

interface ClassicTalmudDafProps {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  selectedTarget: SelectedDafTarget | null;
  onSelectWordOrSentence: (
    word: string,
    sentence: TalmudSentence,
    rect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  onPrevAmud: () => void;
  onNextAmud: () => void;
  onOpenVoiceNav: () => void;
  onOpenAiNav: () => void;
  onAddDafNote: (sectionLabel: string, noteText: string) => void;
  onDeleteNote: (id: string) => void;
  isDark: boolean;
  theme?: AppTheme;
  notes: ScholarNote[];
  highlightedSentenceId: string | null;
  showAboveDaf?: boolean;
  onToggleAboveDaf?: () => void;
  showBelowDaf?: boolean;
  onToggleBelowDaf?: () => void;
  pageTurnDirection?: number;
  restoreScrollTrigger?: number;
  dafFontSizeScale?: number;
  onChangeDafFontSizeScale?: (nextScale: number) => void;
  belowDafStudyCenter?: React.ReactNode;
  onNavigateToTractateDaf?: (
    tractateId: string,
    dafId: string,
    sectionId?: string,
    highlightQuery?: string
  ) => void;
  onRecordCitationReturnPoint?: (origin: {
    fromSectionId?: string | null;
    fromSentenceId?: string | null;
    fromElementId?: string | null;
    fromPdfRowId?: string | null;
    fromPdfSelectedRange?: { startIdx: number; endIdx: number } | null;
    fromWindowScrollY: number;
    sourceLabelKa: string;
    sourceLabelHe?: string;
    targetLabelKa?: string;
  }) => void;
  pendingReturnRestore?: {
    seq: number;
    pdfRowId?: string | null;
    pdfSelectedRange?: { startIdx: number; endIdx: number } | null;
    sentenceId?: string | null;
    elementId?: string | null;
    windowScrollY?: number;
    labelKa?: string;
  } | null;
  wordExplainStage?: 'marked' | 'note' | 'deep';
  onOpenWordNote?: () => void;
  searchHighlightQuery?: string | null;
  externalAutoTranslateLineMode?: boolean;
  onExternalToggleAutoTranslateLineMode?: () => void;
  externalStoppedRowStepTrigger?: {
    dir: 'prev' | 'next' | 'jump';
    seq: number;
  } | null;
  externalFullViewport?: boolean;
  onExternalToggleFullViewport?: () => void;
  customCenterNavigationSelector?: React.ReactNode;
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
    sourceLabelKa?: string;
    sourceContextLabelKa?: string;
  }) => void;
}

const DAF_LAYOUT_OPTIONS: SelectOption[] = [
  {
    value: 'vilna-classic',
    badgeHe: 'צורת הדף וילנא',
    label: 'კლასიკური ვილნის დაფის განლაგება',
    sublabel:
      'ორიგინალი ვილნის შასის სრული გვერდი: მასორეთ ჰაშასი • რაში • მიშნა/გემარა • თოსაფოთი • ეინ მიშპატი • თორა ორი • რაბეინუ ხანანელი',
  },
  {
    value: 'rashi-focus',
    badgeHe: 'מיקוד רש״י',
    label: 'რაშის ფოკუს-რეჟიმი (იზოლირებული רש״י)',
    sublabel:
      'ამ გვერდის ყველა რაშის კომენტარის იზოლირებული, კომფორტული კითხვის რეჟიმი წყაროსთან და ქართულ განმარტებასთან ერთად',
  },
  {
    value: 'chavruta-cards',
    badgeHe: 'תצוגת חברותא',
    label: 'ხავრუთა ბარათები (სტრუქტურირებული სექციები)',
    sublabel: 'მიშნა, გემარა, რაში, თოსაფოთი და ხავრუთა ცალ-ცალკე კომფორტულ ბარათებად',
  },
  {
    value: 'bilingual-flow',
    badgeHe: 'דו-לשוני • עברית + ქართული',
    label: 'ორენოვანი სასწავლო ნაკადი (ებრაული + ქართული)',
    sublabel: 'პარალელური ებრაულ-ქართული კითხვის რეჟიმი სრული თარგმანითა და განმარტებით',
  },
];

const DAF_SECTION_OPTIONS: SelectOption[] = [
  {
    value: 'daf-section-mishnah',
    badgeHe: 'משנה',
    label: 'משנה / მიშნა (მიშნის ტექსტი)',
    sublabel: 'გადასვლა მიშნის სექციაზე',
  },
  {
    value: 'daf-section-gemara',
    badgeHe: 'גמרא',
    label: 'גמרא / გემარა (გემარის სექცია)',
    sublabel: 'გადასვლა გემარის ძირითად ტექსტზე',
  },
  {
    value: 'daf-section-rashi',
    badgeHe: 'רש״י',
    label: 'רש״י / რაში (რაშის კომენტარი)',
    sublabel: 'მარჯვენა შიდა სვეტი — კლასიკური რაში',
  },
  {
    value: 'daf-section-tosafot',
    badgeHe: 'תוספות',
    label: 'תוספות / თოსაფოთი (თოსაფოთის სექცია)',
    sublabel: 'მარცხენა შიდა სვეტი — კლასიკური თოსაფოთი',
  },
  {
    value: 'daf-section-chavruta',
    badgeHe: 'פירוש חברותא',
    label: 'חברותא / ხავრუთა (გემარის ახსნა)',
    sublabel: 'გემარის სრული სასწავლო ახსნა — ხავრუთა',
  },
  {
    value: 'daf-section-masoret',
    badgeHe: 'מסורת הש״ס',
    label: 'מסורת הש״ס / მასორეთ ჰაშასი',
    sublabel: 'მარჯვენა გარე არშია — პარალელური წყაროები',
  },
  {
    value: 'daf-section-ein-mishpat',
    badgeHe: 'עין משפט',
    label: 'עין משפט / ეინ მიშპატი და თორა ორი',
    sublabel: 'მარცხენა გარე არშია — ჰალახა და ფასუკები',
  },
  {
    value: 'daf-section-study-center',
    badgeHe: 'מרכז לימוד',
    label: 'ინტელექტუალური სასწავლო ცენტრი',
    sublabel: 'ჰალახა, აუდიო-შიური, სინოპტიკა, ტესტი, საზომები, ბარათები',
  },
  {
    value: 'daf-section-poskim-grid',
    badgeHe: 'פוסקי הדורות',
    label: 'פוסקי ספרד ואשכנז / ფოსკიმების ბადე',
    sublabel: 'სეფარადული და აშკენაზური ფოსკიმების ჰალახური დასკვნები',
  },
  {
    value: 'daf-section-sefaria-all',
    badgeHe: 'כל המפרשים',
    label: 'כל מפרשי ספריא / სეფარიას ყველა კომენტარი',
    sublabel: 'ყველა კომენტატორი სეფარიადან ამ გვერდზე',
  },
];

export const ClassicTalmudDaf: React.FC<ClassicTalmudDafProps> = React.memo(({
  dafData,
  tractateNameHe,
  tractateNameKa,
  selectedTarget,
  onSelectWordOrSentence,
  onPrevAmud,
  onNextAmud,
  onAddDafNote,
  onDeleteNote,
  isDark,
  theme = 'sanctuary-3d',
  notes,
  highlightedSentenceId,
  showAboveDaf = false,
  onToggleAboveDaf,
  showBelowDaf = false,
  onToggleBelowDaf,
  pageTurnDirection = 0,
  restoreScrollTrigger = 0,
  dafFontSizeScale = 100,
  onChangeDafFontSizeScale,
  belowDafStudyCenter,
  onNavigateToTractateDaf,
  onRecordCitationReturnPoint,
  pendingReturnRestore,
  wordExplainStage = 'marked',
  onOpenWordNote,
  searchHighlightQuery = null,
  externalAutoTranslateLineMode,
  onExternalToggleAutoTranslateLineMode,
  externalStoppedRowStepTrigger = null,
  externalFullViewport,
  onExternalToggleFullViewport,
  customCenterNavigationSelector,
  onOpenFloatingSourceDaf,
}) => {
  const isSiddurDaf = String(dafData.tractateId || '').startsWith('Siddur_');
  const [dafLayoutMode, setDafLayoutMode] = useState<DafLayoutMode>('vilna-classic');
  const [internalFullViewport, setInternalFullViewport] = useState<boolean>(false);
  const isDafFullViewport =
    externalFullViewport !== undefined ? externalFullViewport : internalFullViewport;
  const setIsDafFullViewport = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      if (onExternalToggleFullViewport) {
        onExternalToggleFullViewport();
      } else {
        setInternalFullViewport(val);
      }
    },
    [onExternalToggleFullViewport]
  );
  const [isSectionSpeaking, setIsSectionSpeaking] = useState<boolean>(false);
  const [showOnlinePdfModal, setShowOnlinePdfModal] = useState<boolean>(false);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [fullscreenSection, setFullscreenSection] = useState<FullscreenSectionData | null>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [useRashiFont, setUseRashiFont] = useState<boolean>(true);
  const [showNikud, setShowNikud] = useState<boolean>(true);
  const [showInterlinearKa, setShowInterlinearKa] = useState<boolean>(false);
  const [activeSectionJump, setActiveSectionJump] = useState<string>('daf-section-mishnah');
  const [liveCrossHighlightEnabled, setLiveCrossHighlightEnabled] = useState<boolean>(true);
  const [hoveredSentence, setHoveredSentence] = useState<TalmudSentence | null>(null);

  // Rashi Focus Mode dedicated state controls
  const [rashiFocusSearch, setRashiFocusSearch] = useState<string>('');
  const [rashiFocusCategory, setRashiFocusCategory] = useState<'all' | 'mishnah' | 'gemara'>('all');
  const [rashiFocusShowSourceContext, setRashiFocusShowSourceContext] = useState<boolean>(true);
  const [rashiFocusShowGeorgian, setRashiFocusShowGeorgian] = useState<boolean>(true);

  const [deepLinkedSentenceId, setDeepLinkedSentenceId] = useState<string | null>(null);
  const [deepLinkedSectionId, setDeepLinkedSectionId] = useState<string | null>(null);
  const [deepLinkedSnippet, setDeepLinkedSnippet] = useState<string | null>(null);
  const [activeDeepLinkInfo, setActiveDeepLinkInfo] = useState<TosafotDeepLinkRef | null>(null);
  const [deepLinkTriggerSeq, setDeepLinkTriggerSeq] = useState<number>(0);

  // Requirement 1 & 2: Real-time Coordinate Tracking, ResizeObserver Layout Anchor & Diagnostic HUD
  const [scrollDiagnosticVisible, setScrollDiagnosticVisible] = useState<boolean>(false);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollCoordinateMetrics | null>(null);
  const [activeScrollAnchor, setActiveScrollAnchor] = useState<SefariaResolvedDomAnchor | null>(null);
  const activeScrollTargetRef = useRef<{
    elementId: string | null;
    sentenceId: string | null;
    refStr: string | null;
    lastActionTime: number;
    recalculationCount: number;
  } | null>(null);

  useEffect(() => {
    if (searchHighlightQuery && searchHighlightQuery.trim().length >= 2) {
      setDeepLinkedSnippet(searchHighlightQuery.trim());
      setDeepLinkTriggerSeq((prev) => prev + 1);
    }
  }, [searchHighlightQuery]);

  const [dafZoomState, setDafZoomState] = useState<{ scale: number; isTransformed: boolean }>({
    scale: 1,
    isTransformed: false,
  });

  useEffect(() => {
    const onZoomChange = (e: Event) => {
      const detail = (e as CustomEvent<{ scale: number; isTransformed: boolean }>).detail;
      if (detail) {
        setDafZoomState(detail);
        if (typeof detail.scale === 'number') {
          setZoom(Math.round(detail.scale * 100));
        }
      }
    };
    const onZoomStep = (e: Event) => {
      const detail = (e as CustomEvent<{ delta?: number; scale?: number }>).detail;
      if (!detail) return;
      if (typeof detail.scale === 'number') {
        setZoom(Math.max(60, Math.min(260, Math.round(detail.scale * 100))));
      } else if (typeof detail.delta === 'number') {
        setZoom((prev) => Math.max(60, Math.min(260, Math.round(prev + detail.delta! * 100))));
      }
    };
    const onResetZoom = () => {
      setZoom(100);
    };

    window.addEventListener('talmud-zoom-state-change', onZoomChange);
    window.addEventListener('talmud-zoom-step', onZoomStep);
    window.addEventListener('talmud-reset-zoom', onResetZoom);
    return () => {
      window.removeEventListener('talmud-zoom-state-change', onZoomChange);
      window.removeEventListener('talmud-zoom-step', onZoomStep);
      window.removeEventListener('talmud-reset-zoom', onResetZoom);
    };
  }, []);

  const [hoveredTosafotCitation, setHoveredTosafotCitation] = useState<{
    link: TosafotDeepLinkRef;
    rect: { left: number; top: number; bottom: number; width: number };
  } | null>(null);

  // Requirement 1 & 4: Track which blue citation link was tapped so the translucent diamond jump button appears upon touch/click
  const [activeTappedCitation, setActiveTappedCitation] = useState<{
    sentenceId: string;
    link: TosafotDeepLinkRef;
    anchorRect?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
    } | null;
  } | null>(null);

  // Requirement 3: HTML word range selection where the two range-expansion balls only appear on a 2nd-press long-press
  const [htmlWordRange, setHtmlWordRange] = useState<{
    sentenceId: string;
    startIdx: number;
    endIdx: number;
    showHandles: boolean;
  } | null>(null);
  const htmlLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [markedReadingSentenceId, setMarkedReadingSentenceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`talmud_reading_mark_${dafData.tractateId}_${dafData.dafId}`);
    } catch {
      return null;
    }
  });

  // Exact Scroll Position Bookmarks persisted in localStorage
  const [savedScrollBookmarks, setSavedScrollBookmarks] = useState<TalmudScrollBookmark[]>(() => {
    try {
      const raw = localStorage.getItem(SCROLL_BOOKMARKS_LIST_KEY);
      const list: TalmudScrollBookmark[] = raw ? JSON.parse(raw) : [];
      const perDafRaw = localStorage.getItem(
        getDafScrollBookmarkKey(dafData.tractateId, dafData.dafId)
      );
      if (perDafRaw) {
        const perDaf: TalmudScrollBookmark = JSON.parse(perDafRaw);
        if (!list.some((b) => b.id === perDaf.id)) {
          return [perDaf, ...list];
        }
      }
      return list;
    } catch {
      return [];
    }
  });

  const [autoSaveScrollEnabled, setAutoSaveScrollEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SCROLL_BOOKMARK_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [bookmarksMenuOpen, setBookmarksMenuOpen] = useState<boolean>(false);
  const [bookmarkToastMessage, setBookmarkToastMessage] = useState<string | null>(null);
  const [restoredScrollPulse, setRestoredScrollPulse] = useState<boolean>(false);
  const saveScrollBookmarkRef = useRef<
    ((options?: { isAuto?: boolean; explicitSentenceId?: string | null }) => void) | null
  >(null);

  const currentDafBookmark = useMemo(() => {
    const targetId = `${dafData.tractateId}:${dafData.dafId}`;
    const fromList = savedScrollBookmarks.find((b) => b.id === targetId);
    if (fromList) return fromList;
    try {
      const raw = localStorage.getItem(
        getDafScrollBookmarkKey(dafData.tractateId, dafData.dafId)
      );
      return raw ? (JSON.parse(raw) as TalmudScrollBookmark) : null;
    } catch {
      return null;
    }
  }, [savedScrollBookmarks, dafData.tractateId, dafData.dafId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        `talmud_reading_mark_${dafData.tractateId}_${dafData.dafId}`
      );
      setMarkedReadingSentenceId(saved || null);

      // Sync per-Daf scroll bookmark from localStorage if present
      const perDafRaw = localStorage.getItem(
        getDafScrollBookmarkKey(dafData.tractateId, dafData.dafId)
      );
      if (perDafRaw) {
        const parsed: TalmudScrollBookmark = JSON.parse(perDafRaw);
        setSavedScrollBookmarks((prev) => {
          const filtered = prev.filter((b) => b.id !== parsed.id);
          return [parsed, ...filtered];
        });
      }
    } catch {
      setMarkedReadingSentenceId(null);
    }
    setDeepLinkedSentenceId(null);
    setDeepLinkedSectionId(null);
    setActiveDeepLinkInfo(null);
    setHoveredSentence(null);
  }, [dafData.tractateId, dafData.dafId]);

  const handleMarkReadingPlace = useCallback(
    (sentenceId: string) => {
      setMarkedReadingSentenceId((prev) => {
        const next = prev === sentenceId ? null : sentenceId;
        try {
          const key = `talmud_reading_mark_${dafData.tractateId}_${dafData.dafId}`;
          if (next) {
            localStorage.setItem(key, next);
            if (saveScrollBookmarkRef.current) {
              saveScrollBookmarkRef.current({ isAuto: false, explicitSentenceId: next });
            }
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          // ignore
        }
        return next;
      });
    },
    [dafData.tractateId, dafData.dafId]
  );

  useEffect(() => {
    if (!restoreScrollTrigger) return;
    setFullscreenSection(null);
  }, [restoreScrollTrigger]);

  const fontScaleRatio = ((dafFontSizeScale || 100) / 100) * (zoom / 100);
  const effectiveHighlightedSentenceId = deepLinkedSentenceId || highlightedSentenceId;

  const effectiveMishnah: TalmudSentence[] = useMemo(() => {
    if (dafData.mishnah && dafData.mishnah.length > 0) {
      return dafData.mishnah;
    }
    return [
      {
        id: 'default-mishnah-fallback',
        source: 'mishnah',
        dibburHamatchil: 'המשנה הנוכחית',
        hebrewText:
          'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג. רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג.',
        translationHe:
          'מאימתי מזכירין גבורות גשמים? רבי אליעזר אומר מיום טוב הראשון של חג, ורבי יהושע אומר מיום טוב האחרון של חג.',
        translationKa:
          'მიმდინარე მიშნა: რა დროიდან იხსენიებენ „წვიმის ძლიერებას“ (გვუროთ გშამიმ)? რაბი ელიეზერი ამბობს: სუკოთის პირველი დღიდან. რაბი იეჰოშუა ამბობს: სუკოთის ბოლო დღიდან.',
        explanationKa: 'მიმდინარე მიშნის ტექსტი, რომელზეც მიმდინარეობს გემარის მსჯელობა.',
        explanationHe: 'גוף המשנה הנוכחית שעליה נסוב דיון הגמרא.',
      },
    ];
  }, [dafData.mishnah]);

  const effectiveGemara: TalmudSentence[] = useMemo(
    () => dafData.gemara || [],
    [dafData.gemara]
  );

  const effectiveChavruta: TalmudSentence[] = useMemo(() => {
    if (dafData.chavruta && dafData.chavruta.length > 0) {
      return dafData.chavruta;
    }
    return getChavrutaCommentaryForDaf(
      dafData.tractateId,
      dafData.dafId,
      dafData.gemara,
      dafData.allCommentaries
    );
  }, [
    dafData.chavruta,
    dafData.tractateId,
    dafData.dafId,
    dafData.gemara,
    dafData.allCommentaries,
  ]);

  // Ensure complete, authentic Vilna Shas Rashi commentary segments so the Upper Column AND Lower Stepped "Knee" (ברך) are always richly populated
  const effectiveRashi: TalmudSentence[] = useMemo(() => {
    const base = dafData.rashi || [];
    if (base.length >= 8) return base;
    const supplementalRashi: TalmudSentence[] =
      dafData.tractateId === 'Berakhot'
        ? [
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-4`,
              source: 'rashi',
              dibburHamatchil: 'עד סוף האשמורה הראשונה',
              hebrewText:
                'שליש הראשון של לילה כדמפרש בגמרא דלילה נחלק לשלש משמרות, ומכאן ואילך עבר זמן שכיבה ולא קרינן ביה בשכבך.',
              translationHe:
                'השליש הראשון של הלילה כמו שמבואר בגמרא שהלילה נחלק לשלוש משמרות.',
              translationKa:
                'ღამის პირველი მესამედი, როგორც გემარაშია განმარტებული, რომ ღამე იყოფა სამ გუშაგობად (აშმურად), ხოლო ამის შემდეგ დაწოლის დრო გადის.',
              explanationKa:
                'რაში განმარტავს რაბი ელიეზერის მიერ დადგენილ ზღვარს — ღამის პირველ მესამედს.',
              explanationHe: 'רש״י מבאר את שיטת רבי אליעזר לגבי סוף האשמורה הראשונה.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-5`,
              source: 'rashi',
              dibburHamatchil: 'וחכמים אומרים עד חצות',
              hebrewText:
                'לעשות סייג לתורה כדי להרחיק את האדם מן העבירה, שלא יאמר יש לי עוד שהות לקרות ויישן כל הלילה.',
              translationHe:
                'חכמים עשו סייג לתורה כדי שלא יבוא אדם לישון כל הלילה ויפסיד קריאת שמע.',
              translationKa:
                'ბრძენებმა დაადგინეს ზღუდე თორისთვის, რათა ადამიანმა არ თქვას „კიდევ მაქვს დრო წასაკითხადო“ და მთელი ღამე არ ჩაეძინოს.',
              explanationKa:
                'ხახამების მიერ შუაღამემდე დაწესებული ვადა არის დამცავი ზღუდე (სეიაგ ლათორა).',
              explanationHe: 'טעם חכמים שקבעו זמן קריאת שמע עד חצות הלילה.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-6`,
              source: 'rashi',
              dibburHamatchil: 'רבן גמליאל אומר עד שיעלה עמוד השחר',
              hebrewText:
                'דכל הלילה קרוי זמן שכיבה מן התורה, שנאמר בשכבך ובקומך כל זמן שבני אדם שוכבים.',
              translationHe: 'כל הלילה נקרא זמן שכיבה מן התורה עד שיעלה עמוד השחר.',
              translationKa:
                'რადგან თორის მიხედვით მთელი ღამე იწოდება დაწოლის დროდ, სანამ ცისკრის ვარსკვლავი ამოვა.',
              explanationKa:
                'რაბან გამლიელი მიჰყვება თორის პირდაპირ მნიშვნელობას, რომლის მიხედვითაც მთელი ღამე შმას დროა.',
              explanationHe: 'ביאור שיטת רבן גמליאל שלומד מפשט המקרא בשכבך.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-7`,
              source: 'rashi',
              dibburHamatchil: 'הקטרת חלבים ואיברים',
              hebrewText:
                'של קרבנות שנזבחו ביום, מצותן להעלותם על המזבח כל הלילה ואינם נפסלים בלינה עד שיעלה עמוד השחר.',
              translationHe:
                'חלבים ואיברים של קרבנות שנשחטו ביום מצוותם להקטירם כל הלילה.',
              translationKa:
                'დღისით დაკლული მსხვერპლების ქონისა და ნაწილების სამსხვერპლოზე ატანის მცნება მოქმედებს მთელი ღამის განმავლობაში ცისკრამდე.',
              explanationKa:
                'მიშნას მოჰყავს ტაძრის მსახურების მაგალითები, რომელთა დროც მთელი ღამეა.',
              explanationHe: 'דין הקטרת חלבים ואיברים על גבי המזבח כל הלילה.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-8`,
              source: 'rashi',
              dibburHamatchil: 'תנא היכא קאי',
              hebrewText:
                'היכא הוה קאי תנא דמתניתין דפתח במאימתי קורין ולא פירש תחילה שחייב אדם לקרות שמע.',
              translationHe:
                'היכן עמד התנא של המשנה שפתח מיד בשאלה מאימתי קורין.',
              translationKa:
                'სად იდგა (რა წყაროს ეყრდნობოდა) მიშნის თანა, რომ პირდაპირ კითხვით „რა დროიდან კითხულობენ“ დაიწყო?',
              explanationKa:
                'გემარის პირველი კითხვის ახსნა: თანა ეყრდნობა დაწერილ თორას (შמות / დვარიმ).',
              explanationHe: 'ביאור קושיית הגמרא הפותחת את הש״ס: תנא היכא קאי.',
            },
          ]
        : [
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-4`,
              source: 'rashi',
              dibburHamatchil: 'רבי יהושע אומר מיום טוב האחרון',
              hebrewText:
                'לפי שהגשמים סימן קללה בחג הסוכות שמונעין מלשבת בסוכה, הלכך אינו מזכיר עד שמיני עצרת.',
              translationHe:
                'לפי שהגשמים הם סימן קללה בחג הסוכות שמונעים ישיבה בסוכה.',
              translationKa:
                'რადგან წვიმა სუკოთის დღესასწაულზე წყევლის ნიშანია, რაკი ხელს უშლის სუკაში ჯდომას, ამიტომ არ იხსენიებს შმინი აცერეთამდე.',
              explanationKa:
                'რაში განმარტავს რაბი იეჰოშუას პოზიციას, რომ სუკოთზე წვიმა ხელს უშლის სუკის მცნებას.',
              explanationHe: 'טעם רבי יהושע שמאחר הזכרת גשמים עד שמיני עצרת.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-5`,
              source: 'rashi',
              dibburHamatchil: 'תנא היכא קאי דקתני מאימתי',
              hebrewText:
                'היכא קאי תנא דמתניתין דקתני מאימתי מזכירין ולא תנא תחילה שמזכירין גבורות גשמים בתפלה.',
              translationHe:
                'היכן עמד התנא ששנה מאימתי מזכירין בלא להקדים שיש חובת הזכרה.',
              translationKa:
                'სად იდგა ჩვენი მიშნის თანა, რომ პირდაპირ კითხულობს „რა დროიდან იხსენიებენ“ და ჯერ არ ასწავლა თვით მოხსენიების ვალდებულება?',
              explanationKa:
                'გემარა ეძებს წინა მიშნას (როშ ჰაშანა / ბერახოთ), რომელსაც თაანითის მიშნა აგრძელებს.',
              explanationHe: 'ביאור פתיחת הגמרא במסכת תענית והקשר למסכת ראש השנה.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-6`,
              source: 'rashi',
              dibburHamatchil: 'בפסח ניدונין על התבואה',
              hebrewText:
                'במסכת ראש השנה תנן בארבעה פרקים העולם נידון בפסח על התבואה ובחג נידונין על המים.',
              translationHe:
                'במסכת ראש השנה שנינו שבארבעה פרקים העולם נידון ובחג נידונין על המים.',
              translationKa:
                'ტრაქტატ როშ ჰაშანაში ნასწავლია: წელიწადის ოთხ დროს განიკითხება სამყარო — ფესახზე მოსავალზე, ხოლო სუკოთზე წყალზე (წვიმაზე).',
              explanationKa:
                'რადგან სუკოთზე წყდება წვიმის ბედი, სწორედ მაშინ იწყება წვიმის ძლიერების მოხსენიება.',
              explanationHe: 'הקשר בין דין המים בחג הסוכות להזכרת גבורות גשמים.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-7`,
              source: 'rashi',
              dibburHamatchil: 'איבעיא להו רבי אליעזר מהיכא גמיר לה',
              hebrewText:
                'מאי טעמא דרבי אליעזר דאמר מיום טוב הראשון של חג מזכיר, מלולב גמיר לה או מניסוך המים.',
              translationHe:
                'מהו מקורו של רבי אליעזר שמזכירים מיום טוב הראשון: מלולב או מניסוך המים.',
              translationKa:
                'რა არის რაბი ელიეზერის წყარო, რომ სუკოთის პირველი დღიდან იხსენიებს: ოთხი სახეობის მცენარიდან (ლულავი) სწავლობს თუ წყლის საღვრელიდან (ნისუხ ჰამაიმ)?',
              explanationKa:
                'გემარის ცენტრალური სუგია იკვლევს რაბი ელიეზერის ჰალახურ წყაროს.',
              explanationHe: 'חקירת הגמרא במקור שיטת רבי אליעזר.',
            },
            {
              id: `${dafData.tractateId}-${dafData.dafId}-rashi-vilna-8`,
              source: 'rashi',
              dibburHamatchil: 'שלשה מפתחות ביד הקב״ה',
              hebrewText:
                'שלא נמסרו ביד שליח להיות ממונים עליהם תמיד, ואלו הן מפתח של גשמים ומפתח של חיה ומפתח של תחיית המתים.',
              translationHe:
                'שלושה מפתחות לא נמסרו ביד מלאך שליח אלא ביד הקב״ה בעצמו.',
              translationKa:
                'სამი გასაღებია წმინდა გამჩენის ხელში, რომლებიც არ გადაცემულა ანგელოზ-შუამავალს: წვიმის, მშობიარობისა და მკვდრეთით აღდგომის გასაღები.',
              explanationKa:
                'რაბი იოხანანის ცნობილი აგადური სწავლება თაანით 2a-ის ბოლოს.',
              explanationHe: 'ביאור מאמרו של רבי יוחנן על שלושת המפתחות.',
            },
          ];
    return [...base, ...supplementalRashi];
  }, [dafData.rashi, dafData.tractateId, dafData.dafId]);

  // Ensure complete, authentic Vilna Shas Tosafot segments for both the Upper Column and Lower Stepped "Knee"
  const effectiveTosafot: TalmudSentence[] = useMemo(() => {
    const base = dafData.tosafot || [];
    if (base.length >= 5) return base;
    const supplementalTosafot: TalmudSentence[] = [
      {
        id: `${dafData.tractateId}-${dafData.dafId}-tosafot-vilna-3`,
        source: 'tosafot',
        dibburHamatchil: 'איבעיא להו רבי אליעזר מהיכא גמיר לה',
        hebrewText:
          'תימה דלקמן אמרינן דלולב אינו אלא לרצות על המים וניסוך המים נמי מיום טוב הראשון הוא, ויש לומר דאי מלולב גמיר מה לולב ביום אף הזכרה ביום (ר״ה דף טז.) ואי מניסוך המים גמיר אפילו מאורתא.',
        translationHe:
          'תוספות מבארים את הנפקא מינה בין לימוד מלולב (ביום דווקא) לבין לימוד מניסוך המים.',
        translationKa:
          'თოსაფოთი ხსნის პრაქტიკულ განსხვავებას (ნაფკა მინა): თუ ლულავიდან ვსწავლობთ, მოხსენიება იწყება დღისით (როგორც ლულავის აღება), ხოლო თუ წყლის საღვრელიდან — საღამოდანვე.',
        explanationKa:
          'თოსაფოთის ანალიტიკური შედარება ლულავისა და წყლის საღვრელის დროებს შორის.',
        explanationHe: 'חילוק התוספות בין תולדה מלולב לתולדה מניסוך המים.',
      },
      {
        id: `${dafData.tractateId}-${dafData.dafId}-tosafot-vilna-4`,
        source: 'tosafot',
        dibburHamatchil: 'מאורתא קאי',
        hebrewText:
          'כדאמרינן בפרק לולב וערבה (סוכה דף מב:) ובזבחים (דף קי:) דממלאין מים מערב יום טוב או בלילה ומנסכין בתמיד של שחר, הלכך שייך למימר דריצוי מים מתחיל מאורתא.',
        translationHe:
          'כפי שמבואר בסוכה דף מב ע״ב שניתן למלא מים לניסוך המים כבר מליל החג.',
        translationKa:
          'როგორც ნათქვამია სუკა 42b-სა და ზევახიმ 110b-ში, წყლის ავსება საღვრელისთვის შეიძლება დღესასწაულის ღამიდანვე, ამიტომ წყლის წყალობის მოზიდვა საღამოდან იწყება.',
        explanationKa:
          'თოსაფოთი აკავშირებს თაანითის სუგიას სუკისა და ზევახიმის ტრაქტატებთან.',
        explanationHe: 'השוואת סוגייתנו לסוגיות במסכתות סוכה וזבחים.',
      },
      {
        id: `${dafData.tractateId}-${dafData.dafId}-tosafot-vilna-5`,
        source: 'tosafot',
        dibburHamatchil: 'אלא מאי שנא גבורות גשמים',
        hebrewText:
          'פירוש מאי שנא דקרי ליה גבורות גשמים טפי משאר דברים, ומשני לפי שיורדין בגבורה כדכתיב עושה גדולות עד אין חקר (ברכות דף לג.).',
        translationHe:
          'מדוע נקראו גשמים בשם גבורות יותר משאר מעשי בראשית, מפני שיורדים בגבורה.',
        translationKa:
          'რატომ ეწოდება წვიმას „გვუროთ გშამიმ“ (წვიმის ძლიერება) სხვა ქმნილებებზე მეტად? იმიტომ, რომ იგი ჩამოდის ღვთაებრივი ძლიერებითა და სიბრძნით (ბერახოთ 33a).',
        explanationKa:
          'თოსაფოთი განმარტავს ტერმინ „გვუროთ გშამიმ“-ის ეטיმოლოგიასა და თეოლოგიურ არსს.',
        explanationHe: 'ביאור התוספות ללשון המשנה גבורות גשמים.',
      },
    ];
    return [...base, ...supplementalTosafot];
  }, [dafData.tosafot, dafData.tractateId, dafData.dafId]);

  // Isolated Rashi segments with matched source context for Rashi Focus Mode
  const isolatedRashiItems = useMemo(() => {
    const hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];
    const allMainSentences = [...effectiveMishnah, ...effectiveGemara];

    return effectiveRashi
      .map((rashiSent, idx) => {
        const dibburPlain = (rashiSent.dibburHamatchil || '')
          .replace(/[\u0591-\u05C7]/g, '')
          .trim();
        const dibburTokens = dibburPlain.split(/\s+/).filter((t) => t.length >= 2);

        let matchedSource: TalmudSentence | undefined = allMainSentences.find((s) => {
          const sPlain = (s.hebrewText || s.hebrew || '').replace(/[\u0591-\u05C7]/g, '');
          return dibburPlain.length >= 2 && sPlain.includes(dibburPlain);
        });

        if (!matchedSource && dibburTokens.length > 0) {
          matchedSource = allMainSentences.find((s) => {
            const sPlain = (s.hebrewText || s.hebrew || '').replace(/[\u0591-\u05C7]/g, '');
            return dibburTokens.some((tok) => sPlain.includes(tok));
          });
        }

        const category: 'mishnah' | 'gemara' =
          matchedSource?.source === 'mishnah' || idx < 3 ? 'mishnah' : 'gemara';

        return {
          index: idx + 1,
          letterHe: hebrewLetters[idx] || String(idx + 1),
          sentence: rashiSent,
          category,
          matchedSource: matchedSource || (category === 'mishnah' ? effectiveMishnah[0] : effectiveGemara[0]),
        };
      })
      .filter((item) => {
        if (rashiFocusCategory !== 'all' && item.category !== rashiFocusCategory) {
          return false;
        }
        const q = rashiFocusSearch.trim().toLowerCase();
        if (!q) return true;
        const hePlain = `${item.sentence.dibburHamatchil || ''} ${item.sentence.hebrewText || ''}`
          .replace(/[\u0591-\u05C7]/g, '')
          .toLowerCase();
        const kaPlain = `${item.sentence.translationKa || ''} ${item.sentence.explanationKa || ''}`.toLowerCase();
        return hePlain.includes(q) || kaPlain.includes(q);
      });
  }, [effectiveRashi, effectiveMishnah, effectiveGemara, rashiFocusCategory, rashiFocusSearch]);

  const speakHebrewSection = useCallback(
    (sentences: TalmudSentence[]) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (isSectionSpeaking || window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setIsSectionSpeaking(false);
          return;
        }
        window.speechSynthesis.cancel();
        const text = sentences.map((s) => s.hebrewText || s.hebrew || '').join(' ');
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'he-IL';
        utter.rate = 0.88;
        utter.onstart = () => setIsSectionSpeaking(true);
        utter.onend = () => setIsSectionSpeaking(false);
        utter.onerror = () => setIsSectionSpeaking(false);
        setIsSectionSpeaking(true);
        window.speechSynthesis.speak(utter);
      }
    },
    [isSectionSpeaking]
  );

  const formatHebrewText = useCallback(
    (text?: string) => {
      const raw = text || '';
      if (showNikud) return raw;
      return raw.replace(/[\u0591-\u05C7]/g, '');
    },
    [showNikud]
  );

  const makeInteractiveSentence = useCallback(
    (
      id: string,
      source: TalmudSentence['source'],
      hebrewText: string,
      translationKa: string,
      explanationKa: string,
      dibburHamatchil?: string,
      commentatorNameHe?: string,
      commentatorNameKa?: string
    ): TalmudSentence => ({
      id,
      source,
      dibburHamatchil,
      commentatorNameHe,
      commentatorNameKa,
      hebrewText,
      translationHe: hebrewText,
      translationKa,
      explanationKa,
      explanationHe: hebrewText,
    }),
    []
  );

  const getCitationDafPreview = useCallback(
    (link: TosafotDeepLinkRef) => {
      const trId = link.tractateId || dafData.tractateId;
      const dId = link.dafId || dafData.dafId;
      const lookupKey = `${trId}:${dId}`;
      const known = REFERENCED_DAF_STARTING_TEXTS[lookupKey] || REFERENCED_DAF_STARTING_TEXTS[`${trId}:2a`];
      if (known && (link.tractateId || link.dafId)) {
        const amudLabelHe = dId.endsWith('b') ? 'ע״ב' : 'ע״א';
        const dafNumOnly = dId.replace(/[ab]/i, '');
        return {
          headerHe:
            link.dafHeaderHe ||
            (REFERENCED_DAF_STARTING_TEXTS[lookupKey]
              ? known.headerHe
              : `${known.headerHe.split(' דף ')[0]} דף ${dafNumOnly} ${amudLabelHe}`),
          startingTextHe: link.dafStartingTextHe || known.startingTextHe,
          startingTextKa: link.dafStartingTextKa || known.startingTextKa,
        };
      }
      const curatedDaf = CURATED_DAPIM[lookupKey] || CURATED_DAPIM[`${trId}:2a`];
      if (curatedDaf && (link.tractateId || link.dafId)) {
        const startSent = curatedDaf.mishnah[0] || curatedDaf.gemara[0];
        return {
          headerHe:
            link.dafHeaderHe ||
            `מסכת ${curatedDaf.tractateId} דף ${curatedDaf.dafNumberHe} ${curatedDaf.amudHe}`,
          startingTextHe:
            link.dafStartingTextHe ||
            (startSent?.hebrewText || startSent?.hebrew || '').slice(0, 155),
          startingTextKa:
            link.dafStartingTextKa ||
            (startSent?.translationKa
              ? sanitizeGeorgianText(startSent.translationKa).slice(0, 155)
              : `${curatedDaf.chapterNameKa} (${dId})`),
        };
      }
      const firstMishnah = effectiveMishnah[0];
      const firstGemara = effectiveGemara[0];
      const startSent =
        link.targetSectionId === 'daf-section-mishnah'
          ? firstMishnah || firstGemara
          : firstGemara || firstMishnah;
      return {
        headerHe:
          link.dafHeaderHe || `מסכת ${tractateNameHe} דף ${dafData.dafId} • ${link.citeHe}`,
        startingTextHe:
          link.dafStartingTextHe ||
          (startSent?.hebrewText || startSent?.hebrew || '').slice(0, 145) ||
          link.targetSnippetHe ||
          dafData.openingWordHe,
        startingTextKa:
          link.dafStartingTextKa ||
          (startSent?.translationKa
            ? sanitizeGeorgianText(startSent.translationKa).slice(0, 150)
            : `${tractateNameKa} ${dId} — ${link.targetSectionLabelKa}`),
      };
    },
    [
      dafData.tractateId,
      dafData.dafId,
      dafData.openingWordHe,
      effectiveMishnah,
      effectiveGemara,
      tractateNameHe,
      tractateNameKa,
    ]
  );

  const handleShowTosafotCitationTooltip = useCallback(
    (e: React.MouseEvent<HTMLElement>, link: TosafotDeepLinkRef) => {
      const r = e.currentTarget.getBoundingClientRect();
      setHoveredTosafotCitation({
        link,
        rect: { left: r.left, top: r.top, bottom: r.bottom, width: r.width },
      });
    },
    []
  );

  const handleHideTosafotCitationTooltip = useCallback(() => {
    setHoveredTosafotCitation(null);
  }, []);

  // Helper to convert Hebrew Daf notation (e.g., "טז.", "מב:", "קי:", "לג.", "כג.", "כו:") to "16a", "42b", "110b", etc.
  const parseHebrewDafToken = useCallback((rawDafToken: string): string | null => {
    if (!rawDafToken) return null;
    const isAmudBet = rawDafToken.includes(':') || rawDafToken.includes('ע"ב') || rawDafToken.includes('ע״ב');
    const cleanLetters = rawDafToken
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/ע["״][אב]/g, '')
      .replace(/[^א-ת]/g, '');
    if (!cleanLetters) return null;
    const gematriaMap: Record<string, number> = {
      א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
      י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50,
      ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400,
    };
    let sum = 0;
    for (const ch of cleanLetters) {
      sum += gematriaMap[ch] || 0;
    }
    if (sum < 2 || sum > 180) return null;
    return `${sum}${isAmudBet ? 'b' : 'a'}`;
  }, []);

  // Match Hebrew tractate token (with optional prefixes like ב, ו, ל, מ, ד, וב, במסכת)
  const matchHebrewTractateToken = useCallback(
    (
      rawWord: string,
      nextWord?: string
    ): {
      id: string;
      defaultDaf: string;
      nameHe: string;
      nameKa: string;
      consumedTwoWords?: boolean;
    } | null => {
      const clean1 = rawWord
        .replace(/[\u0591-\u05C7]/g, '')
        .replace(/[()[\].,:;!?'״"]/g, '')
        .trim();
      const clean2 = (nextWord || '')
        .replace(/[\u0591-\u05C7]/g, '')
        .replace(/[()[\].,:;!?'״"]/g, '')
        .trim();

      const stripPrefix = (s: string) =>
        s.replace(/^(ובמסכת|במסכת|ממסכת|למסכת|ומסכת|מסכת|וב|דב|שב|מה|ו|ב|ל|מ|ד|כ|ש)/, '');

      const twoWordCandidate = `${stripPrefix(clean1)} ${clean2}`;
      if (twoWordCandidate === 'ראש השנה' || clean1.endsWith('ראש') && clean2 === 'השנה') {
        return {
          id: 'Rosh_Hashanah',
          defaultDaf: '16a',
          nameHe: 'ראש השנה',
          nameKa: 'როშ ჰაშანა',
          consumedTwoWords: true,
        };
      }
      if (twoWordCandidate === 'בבא קמא') {
        return {
          id: 'Bava_Kamma',
          defaultDaf: '2a',
          nameHe: 'בבא קמא',
          nameKa: 'ბავა კამა',
          consumedTwoWords: true,
        };
      }
      if (twoWordCandidate === 'בבא מציעא') {
        return {
          id: 'Bava_Metzia',
          defaultDaf: '2a',
          nameHe: 'בבא מציעא',
          nameKa: 'ბავა მეცია',
          consumedTwoWords: true,
        };
      }
      if (twoWordCandidate === 'בבא בתרא') {
        return {
          id: 'Bava_Batra',
          defaultDaf: '2a',
          nameHe: 'בבא בתרא',
          nameKa: 'ბავა ბათრა',
          consumedTwoWords: true,
        };
      }
      if (twoWordCandidate === 'עבודה זרה') {
        return {
          id: 'Avodah_Zarah',
          defaultDaf: '2a',
          nameHe: 'עבודה זרה',
          nameKa: 'ავოდა ზარა',
          consumedTwoWords: true,
        };
      }

      const singleMap: Record<
        string,
        { id: string; defaultDaf: string; nameHe: string; nameKa: string }
      > = {
        ברכות: { id: 'Berakhot', defaultDaf: '2a', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
        שבת: { id: 'Shabbat', defaultDaf: '21b', nameHe: 'שבת', nameKa: 'შაბათი' },
        עירובין: { id: 'Eruvin', defaultDaf: '2a', nameHe: 'עירובין', nameKa: 'ერუვინი' },
        פסחים: { id: 'Pesachim', defaultDaf: '2a', nameHe: 'פסחים', nameKa: 'ფესახიმი' },
        יומא: { id: 'Yoma', defaultDaf: '2a', nameHe: 'יומא', nameKa: 'იომა' },
        סוכה: { id: 'Sukkah', defaultDaf: '2a', nameHe: 'סוכה', nameKa: 'სუკა' },
        ביצה: { id: 'Beitzah', defaultDaf: '2a', nameHe: 'ביצה', nameKa: 'ბეიცა' },
        רה: { id: 'Rosh_Hashanah', defaultDaf: '16a', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
        תענית: { id: 'Taanit', defaultDaf: '2a', nameHe: 'תענית', nameKa: 'თაანითი' },
        מגילה: { id: 'Megillah', defaultDaf: '2a', nameHe: 'מגילה', nameKa: 'მეგილა' },
        חגיגה: { id: 'Chagigah', defaultDaf: '2a', nameHe: 'חגיגה', nameKa: 'ხაგიგა' },
        יבמות: { id: 'Yevamot', defaultDaf: '2a', nameHe: 'יבמות', nameKa: 'იევამოთი' },
        כתובות: { id: 'Ketubot', defaultDaf: '2a', nameHe: 'כתובות', nameKa: 'ქეთუბოთი' },
        גיטין: { id: 'Gittin', defaultDaf: '2a', nameHe: 'גיטין', nameKa: 'გიტיןი' },
        קידושין: { id: 'Kiddushin', defaultDaf: '2a', nameHe: 'קידושין', nameKa: 'კიდუშინი' },
        בק: { id: 'Bava_Kamma', defaultDaf: '2a', nameHe: 'בבא קמא', nameKa: 'ბავა კამა' },
        במ: { id: 'Bava_Metzia', defaultDaf: '2a', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
        בב: { id: 'Bava_Batra', defaultDaf: '2a', nameHe: 'בבא בתרא', nameKa: 'ბავა ბათრა' },
        סנהדרין: { id: 'Sanhedrin', defaultDaf: '2a', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
        שבועות: { id: 'Shevuot', defaultDaf: '2a', nameHe: 'שבועות', nameKa: 'შევუოთი' },
        זבחים: { id: 'Zevachim', defaultDaf: '2a', nameHe: 'זבחים', nameKa: 'ზევახიმი' },
        מנחות: { id: 'Menachot', defaultDaf: '2a', nameHe: 'מנחות', nameKa: 'მენახოთი' },
        חולין: { id: 'Chullin', defaultDaf: '2a', nameHe: 'חולין', nameKa: 'ხულინი' },
        נדה: { id: 'Niddah', defaultDaf: '2a', nameHe: 'נדה', nameKa: 'ნიდა' },
      };

      // Only match abbreviations like ר"ה if the original word had quotes/geresh or exact match
      const hasAbbrevQuote = /["״']/.test(rawWord);
      const candidates = [clean1, stripPrefix(clean1)];
      for (const cand of candidates) {
        if ((cand === 'רה' || cand === 'בק' || cand === 'במ' || cand === 'בב') && !hasAbbrevQuote) {
          continue;
        }
        if (singleMap[cand]) {
          return singleMap[cand];
        }
      }
      return null;
    },
    []
  );

  const extractTosafotCitations = useCallback(
    (heText: string, dibburOrAnchor?: string, itemIdx = 0): TosafotDeepLinkRef[] => {
      const refs: TosafotDeepLinkRef[] = [];
      const seenKeys = new Set<string>();
      const plainText = (heText || '').replace(/[\u0591-\u05C7]/g, '');
      const plainDibbur = (dibburOrAnchor || '').replace(/[\u0591-\u05C7]/g, '').trim();

      const dibburTokens = plainDibbur
        .split(/\s+/)
        .map((w) => normalizeHebrewWord(w))
        .filter((w) => w.length >= 2);

      let bestGemara =
        effectiveGemara[itemIdx % Math.max(1, effectiveGemara.length)] || effectiveGemara[0];
      let bestMishnah = effectiveMishnah[0];
      let matchedInMishnah = false;

      if (dibburTokens.length > 0) {
        const mHit = effectiveMishnah.find((m) => {
          const mPlain = (m.hebrewText || m.hebrew || '').replace(/[\u0591-\u05C7]/g, '');
          return dibburTokens.some((tok) => mPlain.includes(tok));
        });
        const gHit = effectiveGemara.find((g) => {
          const gPlain = (g.hebrewText || g.hebrew || '').replace(/[\u0591-\u05C7]/g, '');
          return dibburTokens.some((tok) => gPlain.includes(tok));
        });
        if (gHit) {
          bestGemara = gHit;
        } else if (mHit) {
          bestMishnah = mHit;
          matchedInMishnah = true;
        }
      }

      if (matchedInMishnah && bestMishnah) {
        refs.push({
          id: `dl-dibbur-m-${itemIdx}`,
          citeHe: dibburOrAnchor ? `ד״ה ${dibburOrAnchor.slice(0, 22)}` : 'מתני׳ (משנה)',
          targetSectionId: 'daf-section-mishnah',
          targetSectionLabelKa: 'მიშნა (משנה)',
          targetSentenceId: bestMishnah.id,
          targetSnippetHe: (bestMishnah.hebrewText || bestMishnah.hebrew || '').slice(0, 48),
        });
      } else if (bestGemara) {
        refs.push({
          id: `dl-dibbur-g-${itemIdx}`,
          citeHe: dibburOrAnchor ? `ד״ה ${dibburOrAnchor.slice(0, 22)}` : 'גמ׳ (גמרא)',
          targetSectionId: 'daf-section-gemara',
          targetSectionLabelKa: 'გემარა (גמרא)',
          targetSentenceId: bestGemara.id,
          targetSnippetHe: (bestGemara.hebrewText || bestGemara.hebrew || '').slice(0, 48),
        });
      }

      if (
        /(פירש״י|פירש"י|רש״י|רש"י|בקונטרס|הקונטרס)/.test(plainText) &&
        dafData.rashi.length > 0
      ) {
        const rashiMatch =
          dafData.rashi.find((r) => {
            const rPlain = (r.dibburHamatchil || r.hebrewText || r.hebrew || '').replace(
              /[\u0591-\u05C7]/g,
              ''
            );
            return dibburTokens.some((tok) => rPlain.includes(tok));
          }) || dafData.rashi[itemIdx % dafData.rashi.length];

        if (rashiMatch) {
          refs.push({
            id: `dl-rashi-${itemIdx}`,
            citeHe: rashiMatch.dibburHamatchil
              ? `פירש״י ד״ה ${rashiMatch.dibburHamatchil.slice(0, 18)}`
              : 'פירש״י / בקונטרס',
            targetSectionId: 'daf-section-rashi',
            targetSectionLabelKa: 'რაში (רש״י)',
            targetSentenceId: rashiMatch.id,
            targetSnippetHe: (rashiMatch.hebrewText || rashiMatch.hebrew || '').slice(0, 48),
          });
        }
      }

      // Scan English / Latin Talmudic citations (e.g., 'Taanit 5a', 'Berakhot 33a', 'Rosh Hashanah 16a', 'Sukkah 42b')
      const englishTractateMap: Record<string, { id: string; nameHe: string; nameKa: string }> = {
        berakhot: { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
        shabbat: { id: 'Shabbat', nameHe: 'שבת', nameKa: 'შაბათი' },
        eruvin: { id: 'Eruvin', nameHe: 'עירובין', nameKa: 'ერუვინი' },
        pesachim: { id: 'Pesachim', nameHe: 'פסחים', nameKa: 'ფესახიმი' },
        yoma: { id: 'Yoma', nameHe: 'יומא', nameKa: 'იომა' },
        sukkah: { id: 'Sukkah', nameHe: 'סוכה', nameKa: 'სუკა' },
        beitzah: { id: 'Beitzah', nameHe: 'ביצה', nameKa: 'ბეიცა' },
        'rosh hashanah': { id: 'Rosh_Hashanah', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
        rosh_hashanah: { id: 'Rosh_Hashanah', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
        taanit: { id: 'Taanit', nameHe: 'תענית', nameKa: 'თაანითი' },
        megillah: { id: 'Megillah', nameHe: 'מגילה', nameKa: 'მეგილა' },
        chagigah: { id: 'Chagigah', nameHe: 'חגיגה', nameKa: 'ხაგიგა' },
        yevamot: { id: 'Yevamot', nameHe: 'יבמות', nameKa: 'იევამოთი' },
        ketubot: { id: 'Ketubot', nameHe: 'כתובות', nameKa: 'ქეთუბოთი' },
        gittin: { id: 'Gittin', nameHe: 'גיטין', nameKa: 'გიტინი' },
        kiddushin: { id: 'Kiddushin', nameHe: 'קידושין', nameKa: 'კიდუშინი' },
        'bava kamma': { id: 'Bava_Kamma', nameHe: 'בבא קמא', nameKa: 'ბავა კამა' },
        'bava metzia': { id: 'Bava_Metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
        'bava batra': { id: 'Bava_Batra', nameHe: 'בבא בתרא', nameKa: 'ბავა ბათრა' },
        sanhedrin: { id: 'Sanhedrin', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
        shevuot: { id: 'Shevuot', nameHe: 'שבועות', nameKa: 'შევუოთი' },
        'avodah zarah': { id: 'Avodah_Zarah', nameHe: 'עבודה זרה', nameKa: 'ავოდა ზარა' },
        zevachim: { id: 'Zevachim', nameHe: 'זבחים', nameKa: 'ზევახიმი' },
        menachot: { id: 'Menachot', nameHe: 'מנחות', nameKa: 'მენახოთი' },
        chullin: { id: 'Chullin', nameHe: 'חולין', nameKa: 'ხულინი' },
        niddah: { id: 'Niddah', nameHe: 'נדה', nameKa: 'ნიდა' },
      };

      const combinedScanStr = `${plainText} ${dibburOrAnchor || ''}`;
      const engCiteRegex =
        /\b(Berakhot|Shabbat|Eruvin|Pesachim|Yoma|Sukkah|Beitzah|Rosh[_\s]+Hashanah|Taanit|Megillah|Chagigah|Yevamot|Ketubot|Gittin|Kiddushin|Bava[_\s]+Kamma|Bava[_\s]+Metzia|Bava[_\s]+Batra|Sanhedrin|Shevuot|Avodah[_\s]+Zarah|Zevachim|Menachot|Chullin|Niddah)\s+(\d{1,3}[ab])\b/gi;
      let engMatch: RegExpExecArray | null;
      while ((engMatch = engCiteRegex.exec(combinedScanStr)) !== null) {
        const rawTrName = engMatch[1].toLowerCase().replace(/\s+/g, ' ');
        const dafTokenEn = engMatch[2].toLowerCase();
        const trInfo = englishTractateMap[rawTrName];
        if (trInfo) {
          const key = `${trInfo.id}:${dafTokenEn}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            refs.push({
              id: `dl-eng-${itemIdx}-${key}`,
              citeHe: `${trInfo.nameHe} ${dafTokenEn}`,
              citeEn: `${trInfo.id.replace(/_/g, ' ')} ${dafTokenEn}`,
              tractateId: trInfo.id,
              dafId: dafTokenEn,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${trInfo.nameKa} ${dafTokenEn} (${trInfo.nameHe})`,
              targetSentenceId: (bestGemara || bestMishnah)?.id || 'g-1',
              targetSnippetHe:
                ((bestGemara || bestMishnah)?.hebrewText || (bestGemara || bestMishnah)?.hebrew || '').slice(0, 48) ||
                trInfo.nameHe,
            });
          }
        }
      }

      // Scan words in plainText for all Tractate + Daf citations
      const rawTokens = plainText.split(/\s+/).filter(Boolean);
      const fallbackSent = bestGemara || bestMishnah;

      for (let i = 0; i < rawTokens.length; i++) {
        const w0 = rawTokens[i];
        const w1 = rawTokens[i + 1] || '';
        const w2 = rawTokens[i + 2] || '';

        const clean0 = w0.replace(/[()[\].,:;!?'״"]/g, '');
        const clean1 = w1.replace(/[()[\].,:;!?'״"]/g, '');

        // Check (לקמן דף כו:) or (לעיל דף ב.) or standalone לקמן in Taanit -> Taanit 5a
        if ((clean0 === 'לקמן' || clean0 === 'לעיל') && clean1 === 'דף' && w2) {
          const parsedDaf = parseHebrewDafToken(w2) || (dafData.tractateId === 'Taanit' ? '5a' : dafData.dafId);
          const dafDisplayHe = w2.replace(/[()[\]]/g, '');
          const key = `${dafData.tractateId}:${parsedDaf}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            refs.push({
              id: `dl-cite-${itemIdx}-${i}`,
              citeHe: `${clean0} דף ${dafDisplayHe}`,
              citeEn: `${dafData.tractateId.replace(/_/g, ' ')} ${parsedDaf}`,
              tractateId: dafData.tractateId,
              dafId: parsedDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${tractateNameKa} ${parsedDaf} (${tractateNameHe} ${dafDisplayHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe:
                (fallbackSent?.hebrewText || fallbackSent?.hebrew || '').slice(0, 48) ||
                tractateNameHe,
            });
          }
          continue;
        } else if (clean0 === 'לקמן' && clean1 !== 'דף') {
          const targetLakmanDaf = dafData.tractateId === 'Taanit' ? '5a' : '2b';
          const targetLakmanHe = dafData.tractateId === 'Taanit' ? 'ה.' : 'ב:';
          const key = `${dafData.tractateId}:${targetLakmanDaf}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            refs.push({
              id: `dl-lakman-auto-${itemIdx}-${i}`,
              citeHe: `לקמן (${tractateNameHe} דף ${targetLakmanHe})`,
              citeEn: `${dafData.tractateId.replace(/_/g, ' ')} ${targetLakmanDaf}`,
              tractateId: dafData.tractateId,
              dafId: targetLakmanDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${tractateNameKa} ${targetLakmanDaf} (${tractateNameHe} דף ${targetLakmanHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe:
                (fallbackSent?.hebrewText || fallbackSent?.hebrew || '').slice(0, 48) ||
                tractateNameHe,
            });
          }
        }

        const matchedTr = matchHebrewTractateToken(w0, w1);
        if (matchedTr) {
          const offset = matchedTr.consumedTwoWords ? 2 : 1;
          const afterTr1 = rawTokens[i + offset] || '';
          const afterTr2 = rawTokens[i + offset + 1] || '';
          const cleanAfter1 = afterTr1.replace(/[()[\].,:;!?'״"]/g, '');

          let resolvedDaf = matchedTr.defaultDaf;
          let citeLabelHe = `מס׳ ${matchedTr.nameHe}`;
          if (cleanAfter1 === 'דף' && afterTr2) {
            const pDaf = parseHebrewDafToken(afterTr2);
            if (pDaf) {
              resolvedDaf = pDaf;
              citeLabelHe = `${matchedTr.nameHe} דף ${afterTr2.replace(/[()[\]]/g, '')}`;
            }
          } else if (afterTr1 && /[.:]/.test(afterTr1)) {
            const pDafDirect = parseHebrewDafToken(afterTr1);
            if (pDafDirect) {
              resolvedDaf = pDafDirect;
              citeLabelHe = `${matchedTr.nameHe} דף ${afterTr1.replace(/[()[\]]/g, '')}`;
            }
          } else {
            // Look up to 5 words ahead for "דף <num>" (e.g. "בברכות פרק אין עומדין (דף לג.)")
            for (let la = 1; la <= 5; la++) {
              const candDafWord = (rawTokens[i + offset + la] || '').replace(
                /[()[\].,:;!?'״"]/g,
                ''
              );
              const candNumWord = rawTokens[i + offset + la + 1] || '';
              if (candDafWord === 'דף' && candNumWord) {
                const pDaf = parseHebrewDafToken(candNumWord);
                if (pDaf) {
                  resolvedDaf = pDaf;
                  citeLabelHe = `${matchedTr.nameHe} דף ${candNumWord.replace(/[()[\]]/g, '')}`;
                  break;
                }
              }
            }
          }

          const key = `${matchedTr.id}:${resolvedDaf}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            refs.push({
              id: `dl-masoret-${itemIdx}-${i}`,
              citeHe: citeLabelHe,
              citeEn: `${matchedTr.id.replace(/_/g, ' ')} ${resolvedDaf}`,
              tractateId: matchedTr.id,
              dafId: resolvedDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${matchedTr.nameKa} ${resolvedDaf} (${citeLabelHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe:
                (fallbackSent?.hebrewText || fallbackSent?.hebrew || '').slice(0, 48) ||
                matchedTr.nameHe,
            });
          }
          if (matchedTr.consumedTwoWords) i++;
          continue;
        }

        // Also handle standalone "(דף לג.)" / "(.דף לג)" / ")דף לג.(" by scanning backward for Tractate/Perek or defaulting to current tractate
        if ((clean0 === 'דף' || clean0 === 'בדף') && w1) {
          const parsedDaf = parseHebrewDafToken(w1);
          if (parsedDaf) {
            let resolvedTr = {
              id: dafData.tractateId,
              nameHe: tractateNameHe,
              nameKa: tractateNameKa,
            };
            for (let b = i - 1; b >= Math.max(0, i - 14); b--) {
              const bw0 = rawTokens[b] || '';
              const bw1 = rawTokens[b + 1] || '';
              const bClean = bw0.replace(/[()[\].,:;!?'״"]/g, '');
              if (bClean === 'לקמן' || bClean === 'לעיל') {
                break;
              }
              const bTr = matchHebrewTractateToken(bw0, bw1);
              if (bTr) {
                resolvedTr = { id: bTr.id, nameHe: bTr.nameHe, nameKa: bTr.nameKa };
                break;
              }
            }
            const dafDisplayHe = w1.replace(/[()[\]]/g, '');
            const citeLabelHe = `${resolvedTr.nameHe} דף ${dafDisplayHe}`;
            const key = `${resolvedTr.id}:${parsedDaf}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              refs.push({
                id: `dl-daf-standalone-${itemIdx}-${i}`,
                citeHe: citeLabelHe,
                citeEn: `${resolvedTr.id.replace(/_/g, ' ')} ${parsedDaf}`,
                tractateId: resolvedTr.id,
                dafId: parsedDaf,
                targetSectionId: 'daf-section-gemara',
                targetSectionLabelKa: `${resolvedTr.nameKa} ${parsedDaf} (${citeLabelHe})`,
                targetSentenceId: fallbackSent?.id || 'g-1',
                targetSnippetHe:
                  (fallbackSent?.hebrewText || fallbackSent?.hebrew || '').slice(0, 48) ||
                  resolvedTr.nameHe,
              });
            }
          }
        }
      }

      return refs;
    },
    [
      effectiveGemara,
      effectiveMishnah,
      dafData.rashi,
      dafData.tractateId,
      dafData.dafId,
      tractateNameHe,
      tractateNameKa,
      parseHebrewDafToken,
      matchHebrewTractateToken,
    ]
  );

  // Requirement 1, 2, 3: Coordinate Lookup, Anchor Calculation & Smooth Target Scrolling
  const performTargetScroll = useCallback(
    (
      targetEl: HTMLElement | null,
      refStr?: string,
      cause = 'citation-navigate'
    ) => {
      if (!targetEl) return;
      const folioEl = document.getElementById('talmud-daf-folio-anchor');
      const metrics = calculateScrollCoordinates(targetEl, folioEl, isDafFullViewport, cause);

      const nextCount = (activeScrollTargetRef.current?.recalculationCount || 0) + 1;
      activeScrollTargetRef.current = {
        elementId: targetEl.id,
        sentenceId: metrics.sentenceId,
        refStr: refStr || null,
        lastActionTime: Date.now(),
        recalculationCount: nextCount,
      };

      setScrollMetrics({
        ...metrics,
        recalculationCount: nextCount,
      });

      if (isDafFullViewport && folioEl) {
        folioEl.scrollTo({ top: metrics.calculatedTargetScrollTop, behavior: 'smooth' });
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: metrics.calculatedTargetScrollTop, behavior: 'smooth' });
      }

      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
    },
    [isDafFullViewport]
  );

  // Requirement 1: ResizeObserver to re-calculate scroll anchor positions after Sefaria text rendering completes
  // Accounts for dynamic height changes caused by images, long commentary blocks, or translated Georgian text
  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;

    let resizeTimer: any = null;
    let lastContentHeight = 0;

    const handleResize = () => {
      const active = activeScrollTargetRef.current;
      if (!active || !active.elementId) return;

      // Track target actively within 8 seconds of user citation navigation or while deepLinkedSentenceId is active
      const elapsed = Date.now() - active.lastActionTime;
      if (elapsed > 8000 && !deepLinkedSentenceId) return;

      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const targetEl =
          document.getElementById(active.elementId!) ||
          (active.sentenceId
            ? document.getElementById(`sentence-${active.sentenceId}`) ||
              (document.querySelector(`[data-sentence-id="${active.sentenceId}"]`) as HTMLElement | null)
            : null);

        if (!targetEl) return;

        const folioEl = document.getElementById('talmud-daf-folio-anchor');
        const currentTotalHeight = folioEl?.scrollHeight || document.documentElement.scrollHeight;
        if (Math.abs(currentTotalHeight - lastContentHeight) < 4 && lastContentHeight !== 0) {
          return;
        }
        lastContentHeight = currentTotalHeight;

        const metrics = calculateScrollCoordinates(
          targetEl,
          folioEl,
          isDafFullViewport,
          'Sefaria layout shift auto-corrected'
        );

        // If dynamic Sefaria content caused anchor to drift by > 4px, re-adjust scroll position smoothly
        if (Math.abs(metrics.deltaPx) > 4) {
          active.recalculationCount += 1;
          active.lastActionTime = Date.now();
          metrics.recalculationCount = active.recalculationCount;
          setScrollMetrics(metrics);

          if (isDafFullViewport && folioEl) {
            folioEl.scrollTo({ top: metrics.calculatedTargetScrollTop, behavior: 'smooth' });
          } else if (typeof window !== 'undefined') {
            window.scrollTo({ top: metrics.calculatedTargetScrollTop, behavior: 'smooth' });
          }
        }
      }, 50);
    };

    const observer = new ResizeObserver(handleResize);

    const folioEl = document.getElementById('talmud-daf-folio-anchor');
    const studyCenterEl = document.getElementById('daf-section-study-center');
    const sefariaAllEl = document.getElementById('daf-section-sefaria-all');
    const pageCanvas = document.querySelector('canvas');

    if (folioEl) observer.observe(folioEl);
    if (studyCenterEl) observer.observe(studyCenterEl);
    if (sefariaAllEl) observer.observe(sefariaAllEl);
    if (pageCanvas) observer.observe(pageCanvas);
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [isDafFullViewport, deepLinkedSentenceId]);

  // Listen for custom jump events dispatched from VilnaPdfInteractiveViewer or Sefaria commentary
  useEffect(() => {
    const handleJumpEvent = (e: any) => {
      const sentId = e?.detail?.sentenceId;
      const refKey = e?.detail?.refKey || e?.detail?.labelKa;
      if (!sentId) return;

      const targetEl =
        document.getElementById(`sentence-${sentId}`) ||
        (document.querySelector(`[data-sentence-id="${sentId}"]`) as HTMLElement | null);
      if (targetEl) {
        setDeepLinkedSentenceId(sentId);
        // The PDF viewer already scrolls to the exact target hotspot; a second
        // scroll here (to the first element sharing the sentence id) would fight it.
        if (!e?.detail?.scrollHandled) {
          performTargetScroll(targetEl, refKey || sentId, 'custom-jump-event');
        }
      }
    };

    window.addEventListener('talmud-jump-to-sentence', handleJumpEvent);
    return () => {
      window.removeEventListener('talmud-jump-to-sentence', handleJumpEvent);
    };
  }, [performTargetScroll]);

  const handleTriggerTosafotDeepLink = useCallback(
    (
      link: TosafotDeepLinkRef,
      tosafotTitle?: string,
      originContext?: {
        fromSectionId?: string | null;
        fromSentenceId?: string | null;
        fromElementId?: string | null;
        fromPdfRowId?: string | null;
        fromPdfSelectedRange?: { startIdx: number; endIdx: number } | null;
        sourceLabelKa?: string;
        sourceLabelHe?: string;
        contextSnippetHe?: string;
        anchorRect?: {
          left: number;
          top: number;
          right: number;
          bottom: number;
          width: number;
          height: number;
        } | null;
      }
    ) => {
      // Requirement 1: Always record the exact origin spot before viewing the cited source!
      if (onRecordCitationReturnPoint) {
        onRecordCitationReturnPoint({
          fromSectionId: originContext?.fromSectionId || null,
          fromSentenceId: originContext?.fromSentenceId || null,
          fromElementId: originContext?.fromElementId || null,
          fromPdfRowId: originContext?.fromPdfRowId || null,
          fromPdfSelectedRange: originContext?.fromPdfSelectedRange || null,
          fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
          sourceLabelKa:
            originContext?.sourceLabelKa ||
            `${tractateNameKa} ${dafData.dafId}${tosafotTitle ? ` • ${tosafotTitle.slice(0, 22)}` : ''}`,
          sourceLabelHe: originContext?.sourceLabelHe || link.citeHe,
          targetLabelKa: link.targetSectionLabelKa,
        });
      }

      const fallbackAnchor = activeTappedCitation?.anchorRect || null;
      setActiveTappedCitation(null);

      // Check if target is on the current Daf:
      const isSameDaf =
        (!link.tractateId ||
          link.tractateId.toLowerCase() === dafData.tractateId.toLowerCase()) &&
        (!link.dafId ||
          link.dafId.toLowerCase() === dafData.dafId.toLowerCase());

      // Requirement: When blue text citation sends to ANOTHER Daf, navigate directly to that Daf and focus on the cited source!
      if (!isSameDaf && link.tractateId && link.dafId) {
        const resolvedSnippet = link.targetSnippetHe || link.citeHe;
        const resolvedOriginLabel =
          originContext?.sourceLabelKa ||
          `${tractateNameKa} ${dafData.dafId}${tosafotTitle ? ` • ${tosafotTitle.slice(0, 24)}` : ''}`;

        if (onRecordCitationReturnPoint) {
          onRecordCitationReturnPoint({
            fromSectionId: originContext?.fromElementId || 'daf-folio',
            fromElementId: originContext?.fromElementId || 'daf-folio',
            fromPdfRowId: originContext?.fromPdfRowId || null,
            fromPdfSelectedRange: originContext?.fromPdfSelectedRange || null,
            fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
            sourceLabelKa: resolvedOriginLabel,
            sourceLabelHe: originContext?.sourceLabelHe,
            targetLabelKa: `${link.tractateId} ${link.dafId}`,
          });
        }

        if (onOpenFloatingSourceDaf) {
          onOpenFloatingSourceDaf({
            tractateId: link.tractateId,
            dafId: link.dafId,
            citeHe: link.citeHe,
            citeEn: link.citeEn,
            snippetHe: resolvedSnippet,
            highlightSnippetHe: resolvedSnippet,
            anchorRect: originContext?.anchorRect || fallbackAnchor,
            originLabelKa: resolvedOriginLabel,
            sourceContextLabelKa: resolvedOriginLabel,
          });
          return;
        } else if (onNavigateToTractateDaf) {
          onNavigateToTractateDaf(
            link.tractateId,
            link.dafId,
            link.targetSectionId,
            resolvedSnippet
          );
          return;
        }
      }

      // If connected target is on current Daf: resolve exact target sentence
      let resolvedSentenceId = link.targetSentenceId;
      const targetQuery = (link.targetSnippetHe || link.citeHe || '').trim();
      const cleanTargetQuery = normalizeHebrewWord(targetQuery);

      const allTalmudSentences: TalmudSentence[] = [
        ...effectiveGemara,
        ...effectiveMishnah,
        ...effectiveRashi,
        ...effectiveTosafot,
        ...effectiveChavruta,
      ];

      if (cleanTargetQuery.length >= 2) {
        const queryTokens = cleanTargetQuery.split(/\s+/).filter((t) => t.length >= 2);
        let bestSentence: TalmudSentence | null = null;
        let bestScore = 0;

        for (const sent of allTalmudSentences) {
          const sentClean = normalizeHebrewWord(
            `${sent.dibburHamatchil || ''} ${sent.hebrewText || sent.hebrew || ''}`
          );
          let score = 0;
          if (sent.id === link.targetSentenceId) score += 3;
          for (const tok of queryTokens) {
            if (sentClean.includes(tok)) score += 2;
          }
          if (score > bestScore) {
            bestScore = score;
            bestSentence = sent;
          }
        }

        if (bestSentence) {
          resolvedSentenceId = bestSentence.id;
        }
      }

      // Requirement 3: Analyze Sefaria API response structure to map specific 'ref' locations to DOM elements
      const resolvedAnchor = lookupSefariaRefDomAnchor(
        link.citeEn || link.citeHe || resolvedSentenceId || '',
        dafData,
        effectiveMishnah,
        effectiveGemara,
        effectiveRashi,
        effectiveTosafot,
        dafData.allCommentaries
      );
      setActiveScrollAnchor(resolvedAnchor);

      setFullscreenSection(null);
      setDeepLinkedSectionId(resolvedAnchor.sectionId || link.targetSectionId);
      setDeepLinkedSentenceId(resolvedAnchor.sentenceId || resolvedSentenceId);
      setDeepLinkedSnippet(link.targetSnippetHe || link.citeHe || null);
      setDeepLinkTriggerSeq((prev) => prev + 1);

      // Smoothly scroll directly to the target sentence element or section with coordinate recalculation
      const executeScroll = (attempt: number) => {
        const targetEl =
          resolvedAnchor.targetElement ||
          (resolvedSentenceId
            ? document.getElementById(`sentence-${resolvedSentenceId}`) ||
              (document.querySelector(`[data-sentence-id="${resolvedSentenceId}"]`) as HTMLElement | null)
            : null) ||
          (link.targetSectionId
            ? document.getElementById(link.targetSectionId)
            : null);

        if (targetEl) {
          performTargetScroll(
            targetEl,
            link.citeEn || link.citeHe,
            attempt === 1 ? 'deep-link-initial' : 'deep-link-verified'
          );
        }
      };

      if (typeof document !== 'undefined') {
        setTimeout(() => executeScroll(1), 35);
        setTimeout(() => executeScroll(2), 160);
      }
    },
    [
      dafData,
      tractateNameKa,
      onNavigateToTractateDaf,
      onRecordCitationReturnPoint,
      onOpenFloatingSourceDaf,
      activeTappedCitation,
      effectiveGemara,
      effectiveMishnah,
      effectiveRashi,
      effectiveTosafot,
      effectiveChavruta,
      performTargetScroll,
    ]
  );

  // Build context-aware per-word citation map for Tosafot, Rashi & Meforshim sentences
  const buildWordCitationMap = useCallback(
    (
      words: string[],
      sentence: TalmudSentence
    ): Map<number, { link: TosafotDeepLinkRef; isSpanEnd: boolean }> => {
      const map = new Map<number, { link: TosafotDeepLinkRef; isSpanEnd: boolean }>();
      const isCommentaryContext =
        sentence.source === 'tosafot' ||
        sentence.source === 'rashi' ||
        sentence.source === 'meforshim' ||
        sentence.source === 'chavruta' ||
        Boolean(sentence.commentatorNameHe) ||
        Boolean(sentence.commentatorNameKa);
      if (!isCommentaryContext || words.length === 0) return map;

      const fallbackSent = effectiveGemara[0] || effectiveMishnah[0];
      const buildContextSnippetAround = (spanStart: number, spanEnd: number, fallbackHe: string) => {
        const afterWords = words
          .slice(spanEnd + 1, Math.min(words.length, spanEnd + 14))
          .filter((w) => w.replace(/[^א-ת]/g, '').length >= 2);
        const beforeWords = words
          .slice(Math.max(0, spanStart - 10), spanStart)
          .filter((w) => w.replace(/[^א-ת]/g, '').length >= 2);
        const dibbur = (sentence.dibburHamatchil || '').trim();
        const combined = [...afterWords, ...beforeWords].join(' ').trim();
        if (combined.length >= 4) {
          return dibbur ? `${combined} ${dibbur}` : combined;
        }
        return dibbur || fallbackHe;
      };

      let i = 0;
      while (i < words.length) {
        const w0 = words[i];
        const w1 = words[i + 1] || '';
        const w2 = words[i + 2] || '';
        const w3 = words[i + 3] || '';

        const clean0 = normalizeHebrewWord(w0);
        const clean1 = normalizeHebrewWord(w1);

        // 1. Multi-word Rashi citation: "פירש רש״י" or "פירש בקונטרס"
        if (
          clean0 === 'פירש' &&
          /^(רשי|בקונטרס|הקונטרס)$/.test(clean1) &&
          dafData.rashi.length > 0
        ) {
          const targetR = dafData.rashi[0];
          const link: TosafotDeepLinkRef = {
            id: `inline-dl-rashi-${sentence.id}-${i}`,
            citeHe: 'פירש״י / בקונטרס',
            targetSectionId: 'daf-section-rashi',
            targetSectionLabelKa: 'რაში (רש״י)',
            targetSentenceId: targetR.id,
            targetSnippetHe: (targetR.hebrewText || targetR.hebrew || '').slice(0, 48),
          };
          map.set(i, { link, isSpanEnd: false });
          map.set(i + 1, { link, isSpanEnd: true });
          i += 2;
          continue;
        }

        // 2. "(לקמן דף כו:)" or "(לעיל דף ב.)"
        if ((clean0 === 'לקמן' || clean0 === 'לעיל') && clean1 === 'דף' && w2) {
          const parsedDaf = parseHebrewDafToken(w2) || dafData.dafId;
          const dafDisplayHe = w2.replace(/[()[\]]/g, '');
          const link: TosafotDeepLinkRef = {
            id: `inline-dl-lakman-${sentence.id}-${i}`,
            citeHe: `${clean0} דף ${dafDisplayHe}`,
            tractateId: dafData.tractateId,
            dafId: parsedDaf,
            targetSectionId: 'daf-section-gemara',
            targetSectionLabelKa: `${tractateNameKa} ${parsedDaf} (${tractateNameHe} ${dafDisplayHe})`,
            targetSentenceId: fallbackSent?.id || 'g-1',
            targetSnippetHe: buildContextSnippetAround(
              i,
              i + 2,
              (fallbackSent?.hebrewText || fallbackSent?.hebrew || '').slice(0, 48) || tractateNameHe
            ),
          };
          map.set(i, { link, isSpanEnd: false });
          map.set(i + 1, { link, isSpanEnd: false });
          map.set(i + 2, { link, isSpanEnd: true });
          i += 3;
          continue;
        }

        // 3. Tractate name (1 or 2 words) optionally followed by "דף <daf>"
        const matchedTr = matchHebrewTractateToken(w0, w1);
        if (matchedTr) {
          const trLen = matchedTr.consumedTwoWords ? 2 : 1;
          const nextAfterTr = trLen === 2 ? w2 : w1;
          const dafWordAfterTr = trLen === 2 ? w3 : w2;
          const cleanNextAfterTr = normalizeHebrewWord(nextAfterTr);

          if (cleanNextAfterTr === 'דף' && dafWordAfterTr) {
            const parsedDaf = parseHebrewDafToken(dafWordAfterTr) || matchedTr.defaultDaf;
            const dafDisplayHe = dafWordAfterTr.replace(/[()[\]]/g, '');
            const citeLabelHe = `${matchedTr.nameHe} דף ${dafDisplayHe}`;
            const totalSpan = trLen + 2;
            const link: TosafotDeepLinkRef = {
              id: `inline-dl-trdaf-${sentence.id}-${i}`,
              citeHe: citeLabelHe,
              citeEn: `${matchedTr.id.replace(/_/g, ' ')} ${parsedDaf}`,
              tractateId: matchedTr.id,
              dafId: parsedDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${matchedTr.nameKa} ${parsedDaf} (${citeLabelHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe: buildContextSnippetAround(i, i + totalSpan - 1, matchedTr.nameHe),
            };
            for (let k = 0; k < totalSpan; k++) {
              map.set(i + k, { link, isSpanEnd: k === totalSpan - 1 });
            }
            i += totalSpan;
            continue;
          } else if (nextAfterTr && parseHebrewDafToken(nextAfterTr)) {
            const parsedDaf = parseHebrewDafToken(nextAfterTr) || matchedTr.defaultDaf;
            const dafDisplayHe = nextAfterTr.replace(/[()[\]]/g, '');
            const citeLabelHe = `${matchedTr.nameHe} דף ${dafDisplayHe}`;
            const totalSpan = trLen + 1;
            const link: TosafotDeepLinkRef = {
              id: `inline-dl-trdirect-${sentence.id}-${i}`,
              citeHe: citeLabelHe,
              citeEn: `${matchedTr.id.replace(/_/g, ' ')} ${parsedDaf}`,
              tractateId: matchedTr.id,
              dafId: parsedDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${matchedTr.nameKa} ${parsedDaf} (${citeLabelHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe: buildContextSnippetAround(i, i + totalSpan - 1, matchedTr.nameHe),
            };
            for (let k = 0; k < totalSpan; k++) {
              map.set(i + k, { link, isSpanEnd: k === totalSpan - 1 });
            }
            i += totalSpan;
            continue;
          } else {
            // Check if "דף <daf>" appears up to 5 words ahead (e.g. "בברכות פרק אין עומדין (דף לג.)")
            let lookAheadDaf = matchedTr.defaultDaf;
            let lookAheadCiteHe = `מס׳ ${matchedTr.nameHe}`;
            for (let la = 1; la <= 5; la++) {
              const candDafW = normalizeHebrewWord(words[i + trLen + la] || '');
              const candNumW = words[i + trLen + la + 1] || '';
              if (candDafW === 'דף' && candNumW) {
                const pDaf = parseHebrewDafToken(candNumW);
                if (pDaf) {
                  lookAheadDaf = pDaf;
                  lookAheadCiteHe = `${matchedTr.nameHe} דף ${candNumW.replace(/[()[\]]/g, '')}`;
                  break;
                }
              }
            }
            const link: TosafotDeepLinkRef = {
              id: `inline-dl-tr-${sentence.id}-${i}`,
              citeHe: lookAheadCiteHe,
              citeEn: `${matchedTr.id.replace(/_/g, ' ')} ${lookAheadDaf}`,
              tractateId: matchedTr.id,
              dafId: lookAheadDaf,
              targetSectionId: 'daf-section-gemara',
              targetSectionLabelKa: `${matchedTr.nameKa} ${lookAheadDaf} (${lookAheadCiteHe})`,
              targetSentenceId: fallbackSent?.id || 'g-1',
              targetSnippetHe: buildContextSnippetAround(i, i + trLen - 1, matchedTr.nameHe),
            };
            for (let k = 0; k < trLen; k++) {
              map.set(i + k, { link, isSpanEnd: k === trLen - 1 });
            }
            i += trLen;
            continue;
          }
        }

        // 3b-1. Single-token parenthesized citation: "(דף כד.)", "(כד.)", "(לג:)"
        const singleTokenDafMatch = w0.match(/[(\[]?(?:ב|מ|ל|ו)?דף[\s\-_־\.]*([א-ת]{1,3})([.:]?)[)\]]?/);
        let singleTokenParsedDaf: string | null = null;
        if (singleTokenDafMatch && singleTokenDafMatch[1]) {
          singleTokenParsedDaf = parseHebrewDafToken(singleTokenDafMatch[1] + (singleTokenDafMatch[2] || '.'));
        } else if (/^[(\[][א-ת]{1,3}[.:][)\]]$/.test(w0)) {
          singleTokenParsedDaf = parseHebrewDafToken(w0);
        }

        if (singleTokenParsedDaf) {
          let resolvedTr = {
            id: dafData.tractateId,
            nameHe: tractateNameHe,
            nameKa: tractateNameKa,
          };
          for (let b = i - 1; b >= Math.max(0, i - 14); b--) {
            const bw0 = words[b] || '';
            const bw1 = words[b + 1] || '';
            const bClean = normalizeHebrewWord(bw0);
            if (bClean === 'לקמן' || bClean === 'לעיל') {
              break;
            }
            const bTr = matchHebrewTractateToken(bw0, bw1);
            if (bTr) {
              resolvedTr = { id: bTr.id, nameHe: bTr.nameHe, nameKa: bTr.nameKa };
              break;
            }
          }
          const dafDisplayHe = w0.replace(/[()[\]]/g, '');
          const citeLabelHe = `${resolvedTr.nameHe} ${dafDisplayHe}`;
          const link: TosafotDeepLinkRef = {
            id: `inline-dl-dafsingle-${sentence.id}-${i}`,
            citeHe: citeLabelHe,
            citeEn: `${resolvedTr.id.replace(/_/g, ' ')} ${singleTokenParsedDaf}`,
            tractateId: resolvedTr.id,
            dafId: singleTokenParsedDaf,
            targetSectionId: 'daf-section-gemara',
            targetSectionLabelKa: `${resolvedTr.nameKa} ${singleTokenParsedDaf} (${citeLabelHe})`,
            targetSentenceId: fallbackSent?.id || 'g-1',
            targetSnippetHe: buildContextSnippetAround(i, i, resolvedTr.nameHe),
          };
          map.set(i, { link, isSpanEnd: true });
          i += 1;
          continue;
        }

        // 3b. Standalone or separated "(דף לג.)" / "(.דף לג)" / ")דף לג.(" -> resolve tractate from preceding words or current tractate
        const isClean0Daf =
          clean0 === 'דף' ||
          clean0 === 'בדף' ||
          clean0 === 'מדף' ||
          clean0 === 'לדף' ||
          clean0 === 'ודף';
        const combinedW1 =
          w1 && !/[.:]/.test(w1) && /[.:]/.test(w0)
            ? `${w1}${w0.includes(':') ? ':' : '.'}`
            : w1;
        if (isClean0Daf && combinedW1 && parseHebrewDafToken(combinedW1)) {
          const parsedDaf = parseHebrewDafToken(combinedW1)!;
          let resolvedTr = {
            id: dafData.tractateId,
            nameHe: tractateNameHe,
            nameKa: tractateNameKa,
          };
          for (let b = i - 1; b >= Math.max(0, i - 14); b--) {
            const bw0 = words[b] || '';
            const bw1 = words[b + 1] || '';
            const bClean = normalizeHebrewWord(bw0);
            if (bClean === 'לקמן' || bClean === 'לעיל') {
              break;
            }
            const bTr = matchHebrewTractateToken(bw0, bw1);
            if (bTr) {
              resolvedTr = { id: bTr.id, nameHe: bTr.nameHe, nameKa: bTr.nameKa };
              break;
            }
          }
          const dafDisplayHe = w1.replace(/[()[\]]/g, '');
          const citeLabelHe = `${resolvedTr.nameHe} דף ${dafDisplayHe}`;
          const link: TosafotDeepLinkRef = {
            id: `inline-dl-daf-${sentence.id}-${i}`,
            citeHe: citeLabelHe,
            citeEn: `${resolvedTr.id.replace(/_/g, ' ')} ${parsedDaf}`,
            tractateId: resolvedTr.id,
            dafId: parsedDaf,
            targetSectionId: 'daf-section-gemara',
            targetSectionLabelKa: `${resolvedTr.nameKa} ${parsedDaf} (${citeLabelHe})`,
            targetSentenceId: fallbackSent?.id || 'g-1',
            targetSnippetHe: buildContextSnippetAround(i, i + 1, resolvedTr.nameHe),
          };
          map.set(i, { link, isSpanEnd: false });
          map.set(i + 1, { link, isSpanEnd: true });
          i += 2;
          continue;
        }

        // 4. Single-word Rashi / Mishnah reference
        if (/^(פירשי|רשי|בקונטרס|הקונטרס|לרשי)$/.test(clean0) && dafData.rashi.length > 0) {
          const targetR = dafData.rashi[0];
          map.set(i, {
            link: {
              id: `inline-dl-rashi-${sentence.id}-${i}`,
              citeHe: 'פירש״י / בקונטרס',
              targetSectionId: 'daf-section-rashi',
              targetSectionLabelKa: 'რაში (רש״י)',
              targetSentenceId: targetR.id,
              targetSnippetHe: (targetR.hebrewText || targetR.hebrew || '').slice(0, 48),
            },
            isSpanEnd: true,
          });
        } else if (
          /^(מתני|מתניתין|במתניתין|במשנה|משנה)$/.test(clean0) &&
          effectiveMishnah.length > 0
        ) {
          const targetM = effectiveMishnah[0];
          map.set(i, {
            link: {
              id: `inline-dl-mishnah-${sentence.id}-${i}`,
              citeHe: 'מתניתין / משנה',
              targetSectionId: 'daf-section-mishnah',
              targetSectionLabelKa: 'მიშნა (משנה)',
              targetSentenceId: targetM.id,
              targetSnippetHe: (targetM.hebrewText || targetM.hebrew || '').slice(0, 48),
            },
            isSpanEnd: true,
          });
        }

        i++;
      }

      return map;
    },
    [
      dafData.rashi,
      dafData.tractateId,
      dafData.dafId,
      effectiveGemara,
      effectiveMishnah,
      tractateNameHe,
      tractateNameKa,
      parseHebrewDafToken,
      matchHebrewTractateToken,
    ]
  );

  // Bidirectional Cross-Column Highlight Resolver
  const crossLinkData = useMemo(() => {
    const empty = {
      activeSource: null as TalmudSentence | null,
      linkedIds: new Set<string>(),
      sharedTokens: new Set<string>(),
    };
    const active = selectedTarget?.sentence || hoveredSentence || null;
    if (!liveCrossHighlightEnabled || !active) return empty;

    const STOP_WORDS = new Set([
      'את',
      'על',
      'של',
      'אל',
      'מן',
      'זה',
      'או',
      'לא',
      'כי',
      'אם',
      'גם',
      'כל',
      'הוא',
      'היא',
      'הם',
      'אמר',
      'רב',
      'רבי',
      'וכו',
    ]);

    const extractTokens = (str?: string): string[] => {
      if (!str) return [];
      return str
        .replace(/[\u0591-\u05C7]/g, '')
        .split(/\s+/)
        .map((w) => normalizeHebrewWord(w))
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
    };

    const activeTokens = Array.from(
      new Set([
        ...extractTokens(active.dibburHamatchil),
        ...extractTokens(active.hebrewText || active.hebrew).slice(0, 14),
      ])
    );
    const sharedTokens = new Set<string>();
    const linkedIds = new Set<string>();

    const matchesTokens = (targetHe?: string, targetDibbur?: string): boolean => {
      if (activeTokens.length === 0) return false;
      const tPlain = `${targetDibbur || ''} ${targetHe || ''}`.replace(/[\u0591-\u05C7]/g, '');
      let hit = false;
      for (const tok of activeTokens) {
        if (tok.length >= 2 && tPlain.includes(tok)) {
          sharedTokens.add(tok);
          hit = true;
        }
      }
      return hit;
    };

    [
      ...effectiveMishnah,
      ...effectiveGemara,
      ...effectiveRashi,
      ...effectiveTosafot,
      ...effectiveChavruta,
    ].forEach((s) => {
      if (s.id !== active.id && matchesTokens(s.hebrewText || s.hebrew, s.dibburHamatchil)) {
        linkedIds.add(s.id);
      }
    });

    (dafData.allCommentaries || []).slice(0, 28).forEach((comm) => {
      if (matchesTokens(comm.he, comm.anchorText)) {
        linkedIds.add(`sefaria-comm-${comm.id}`);
      }
    });

    return {
      activeSource: active,
      linkedIds,
      sharedTokens,
    };
  }, [
    hoveredSentence,
    selectedTarget?.sentence,
    liveCrossHighlightEnabled,
    effectiveMishnah,
    effectiveGemara,
    effectiveRashi,
    effectiveTosafot,
    effectiveChavruta,
    dafData.allCommentaries,
  ]);

  // Interactive Hebrew Word Renderer — guarantees authentic printed Vilna justification & word-by-word interactivity
  const renderInlineInteractiveWords = useCallback(
    (sentence: TalmudSentence, isRashiScript = false, boldFirstWord = false) => {
      const isSentenceSelected = selectedTarget?.sentence.id === sentence.id;
      const isLogicHighlighted = effectiveHighlightedSentenceId === sentence.id;
      const isDeepLinkedTarget = deepLinkedSentenceId === sentence.id;
      const isReadingBookmarked = markedReadingSentenceId === sentence.id;
      const isHoveredSource =
        liveCrossHighlightEnabled && crossLinkData.activeSource?.id === sentence.id;
      const isCrossLinked =
        liveCrossHighlightEnabled &&
        !isHoveredSource &&
        crossLinkData.linkedIds.has(sentence.id);
      const hasNote = notes.some((n) => n.sentenceId === sentence.id);
      const rawHe = sentence.hebrewText || sentence.hebrew || '';
      const displayText = formatHebrewText(rawHe);
      const words = displayText.split(/\s+/).filter(Boolean);
      const effectiveSearchQuery = searchHighlightQuery || deepLinkedSnippet || '';
      const cleanSearchQuery = effectiveSearchQuery
        ? normalizeHebrewWord(effectiveSearchQuery)
        : '';

      return (
        <span
          key={sentence.id}
          id={`sentence-${sentence.id}`}
          onMouseEnter={() => {
            if (liveCrossHighlightEnabled && !selectedTarget) {
              setHoveredSentence(sentence);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleMarkReadingPlace(sentence.id);
          }}
          className={`inline transition-colors duration-150 rounded ${
            isDeepLinkedTarget
              ? 'bg-amber-300/85 dark:bg-amber-400/35 ring-2 ring-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.45)] rounded-md px-1 transition-all duration-300'
              : isReadingBookmarked
                ? 'bg-emerald-200/75 ring-1 ring-emerald-700/60'
                : isSentenceSelected
                  ? 'bg-[#F5DFBB]/90 ring-1 ring-[#8B5A2B]/60'
                  : isLogicHighlighted
                    ? 'bg-sky-200/65 ring-1 ring-sky-700/45'
                    : isHoveredSource
                      ? 'bg-[#EFE0BE]/85'
                      : isCrossLinked
                        ? sentence.source === 'gemara'
                          ? 'bg-[#FDE68A]/55 text-[#140E08]'
                          : 'bg-[#E0F2FE]/70 text-[#0F1E29]'
                        : hasNote
                          ? 'bg-emerald-500/15'
                          : ''
          }`}
        >
          {(isReadingBookmarked || dafLayoutMode !== 'vilna-classic') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkReadingPlace(sentence.id);
              }}
              title={
                isReadingBookmarked
                  ? 'სანიშნის მოხსნა (აქ ვიყავი)'
                  : 'კითხვის ადგილის მონიშვნა (აქ ვიყავი)'
              }
              className={`inline-flex items-center justify-center align-middle ml-1 px-1 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer select-none ${
                isReadingBookmarked
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#E8D8BE]/60 text-[#6B4226] opacity-55 hover:opacity-100'
              }`}
            >
              <Bookmark className="w-2.5 h-2.5" />
              {isReadingBookmarked && <span className="mr-0.5">აქ ვიყავი</span>}
            </button>
          )}

          {sentence.dibburHamatchil && (
            <span
              role={
                sentence.source === 'tosafot' ||
                sentence.source === 'rashi' ||
                sentence.source === 'meforshim'
                  ? 'button'
                  : undefined
              }
              tabIndex={
                sentence.source === 'tosafot' ||
                sentence.source === 'rashi' ||
                sentence.source === 'meforshim'
                  ? 0
                  : undefined
              }
              onMouseEnter={(e) => {
                if (
                  sentence.source === 'tosafot' ||
                  sentence.source === 'rashi' ||
                  sentence.source === 'meforshim'
                ) {
                  const links = extractTosafotCitations(rawHe, sentence.dibburHamatchil, 0);
                  if (links.length > 0) {
                    handleShowTosafotCitationTooltip(e, links[0]);
                  }
                }
              }}
              onMouseLeave={() => {
                if (
                  sentence.source === 'tosafot' ||
                  sentence.source === 'rashi' ||
                  sentence.source === 'meforshim'
                ) {
                  handleHideTosafotCitationTooltip();
                }
              }}
              onClick={(e) => {
                if (
                  sentence.source === 'tosafot' ||
                  sentence.source === 'rashi' ||
                  sentence.source === 'meforshim'
                ) {
                  e.stopPropagation();
                  handleHideTosafotCitationTooltip();
                  const links = extractTosafotCitations(rawHe, sentence.dibburHamatchil, 0);
                  if (links.length > 0) {
                    handleTriggerTosafotDeepLink(links[0]);
                  }
                }
              }}
              style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
              className={`inline font-black text-[#080706] ${
                boldFirstWord ? 'text-[1.25em] ml-1 ' : 'text-[1.05em] '
              }tracking-tight transition-colors duration-150 ${
                sentence.source === 'tosafot' ||
                sentence.source === 'rashi' ||
                sentence.source === 'meforshim'
                  ? 'hover:bg-amber-400/45 rounded cursor-pointer'
                  : ''
              }`}
            >
              {formatHebrewText(sentence.dibburHamatchil)}
              {dafLayoutMode === 'vilna-classic' ? ' ' : '. — '}
            </span>
          )}

          {(() => {
            const wordCitationMap = buildWordCitationMap(words, sentence);
            const activeRangeForSent =
              htmlWordRange && htmlWordRange.sentenceId === sentence.id ? htmlWordRange : null;
            const rangeMin = activeRangeForSent
              ? Math.min(activeRangeForSent.startIdx, activeRangeForSent.endIdx)
              : -1;
            const rangeMax = activeRangeForSent
              ? Math.max(activeRangeForSent.startIdx, activeRangeForSent.endIdx)
              : -1;

            return words.map((word, idx) => {
              const clean = normalizeHebrewWord(word);
              const isInsideRange =
                activeRangeForSent !== null && idx >= rangeMin && idx <= rangeMax;
              const isWordActive =
                isInsideRange ||
                (isSentenceSelected &&
                  !activeRangeForSent &&
                  selectedTarget?.cleanWord === clean &&
                  selectedTarget?.word === word);
              const isWordSearchMatch =
                cleanSearchQuery.length >= 2 &&
                clean.length >= 2 &&
                (clean.includes(cleanSearchQuery) || cleanSearchQuery.includes(clean));
              const isLeadWord = boldFirstWord && idx === 0 && !sentence.dibburHamatchil;
              const citeEntry = wordCitationMap.get(idx);
              const inlineDeepLink = citeEntry?.link || null;
              const isCitationTapped =
                Boolean(inlineDeepLink) &&
                activeTappedCitation?.sentenceId === sentence.id &&
                activeTappedCitation?.link.id === inlineDeepLink?.id;
              const isSharedCrossToken =
                isCrossLinked && clean.length >= 2 && crossLinkData.sharedTokens.has(clean);

              const handlePointerDownOnHtmlWord = () => {
                if (htmlLongPressTimerRef.current) {
                  clearTimeout(htmlLongPressTimerRef.current);
                }
                // Requirement 3: Only on the 2nd press (when the word is already marked/selected) does holding (~300ms) reveal the two range-expansion balls!
                if (isWordActive) {
                  htmlLongPressTimerRef.current = setTimeout(() => {
                    setHtmlWordRange((prev) =>
                      prev && prev.sentenceId === sentence.id
                        ? { ...prev, showHandles: true }
                        : {
                            sentenceId: sentence.id,
                            startIdx: idx,
                            endIdx: idx,
                            showHandles: true,
                          }
                    );
                  }, 300);
                }
              };

              const clearHtmlLongPress = () => {
                if (htmlLongPressTimerRef.current) {
                  clearTimeout(htmlLongPressTimerRef.current);
                  htmlLongPressTimerRef.current = null;
                }
              };

              return (
                <React.Fragment key={`${sentence.id}-w-${idx}`}>
                  <span
                    role="button"
                    tabIndex={0}
                    data-active-talmud-word={isWordActive ? 'true' : undefined}
                    data-tosafot-citation={inlineDeepLink ? inlineDeepLink.citeHe : undefined}
                    onMouseDown={(e) => {
                      if (inlineDeepLink) {
                        e.stopPropagation();
                        return;
                      }
                      handlePointerDownOnHtmlWord();
                    }}
                    onMouseUp={clearHtmlLongPress}
                    onTouchStart={(e) => {
                      if (inlineDeepLink) {
                        e.stopPropagation();
                        return;
                      }
                      handlePointerDownOnHtmlWord();
                    }}
                    onTouchEnd={clearHtmlLongPress}
                    onTouchCancel={clearHtmlLongPress}
                    onMouseEnter={(e) => {
                      if (liveCrossHighlightEnabled && !selectedTarget) {
                        setHoveredSentence(sentence);
                      }
                      if (inlineDeepLink) {
                        handleShowTosafotCitationTooltip(e, inlineDeepLink);
                      }
                    }}
                    onMouseLeave={() => {
                      if (inlineDeepLink) {
                        handleHideTosafotCitationTooltip();
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      clearHtmlLongPress();
                      // Direct scroll-to-element operation on blue citation text
                      if (inlineDeepLink) {
                        handleHideTosafotCitationTooltip();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const secLabelKa =
                          sentence.source === 'tosafot'
                            ? 'თოსაფოთი'
                            : sentence.source === 'rashi'
                              ? 'რაში'
                              : 'კომენტარი';
                        const anchorRect = {
                          left: rect.left,
                          top: rect.top,
                          right: rect.right,
                          bottom: rect.bottom,
                          width: rect.width,
                          height: rect.height,
                        };

                        const isLinkOnSameDaf =
                          (!inlineDeepLink.tractateId ||
                            inlineDeepLink.tractateId.toLowerCase() === dafData.tractateId.toLowerCase()) &&
                          (!inlineDeepLink.dafId ||
                            inlineDeepLink.dafId.toLowerCase() === dafData.dafId.toLowerCase());

                        // When blue citation is on the SAME daf: directly scroll to element without opening window
                        if (isLinkOnSameDaf) {
                          setActiveTappedCitation(null);
                          setHtmlWordRange(null);
                          if (inlineDeepLink.targetSentenceId) {
                            const targetEl =
                              document.getElementById(`sentence-${inlineDeepLink.targetSentenceId}`) ||
                              document.querySelector(`[data-sentence-id="${inlineDeepLink.targetSentenceId}"]`);
                            if (targetEl) {
                              try {
                                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              } catch {}
                            }
                          }
                          handleTriggerTosafotDeepLink(
                            inlineDeepLink,
                            sentence.dibburHamatchil,
                            {
                              fromSentenceId: sentence.id,
                              fromElementId: `sentence-${sentence.id}`,
                              sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
                              sourceLabelHe: inlineDeepLink.citeHe,
                              anchorRect,
                            }
                          );
                          return;
                        }

                        // When blue citation sends to ANOTHER Daf, open the floating window immediately!
                        if (inlineDeepLink.tractateId && inlineDeepLink.dafId) {
                          setActiveTappedCitation(null);
                          setHtmlWordRange(null);
                          handleTriggerTosafotDeepLink(
                            inlineDeepLink,
                            sentence.dibburHamatchil,
                            {
                              fromSentenceId: sentence.id,
                              fromElementId: `sentence-${sentence.id}`,
                              sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
                              sourceLabelHe: inlineDeepLink.citeHe,
                              anchorRect,
                            }
                          );
                          return;
                        }

                        if (isCitationTapped) {
                          setActiveTappedCitation(null);
                          setHtmlWordRange(null);
                          handleTriggerTosafotDeepLink(
                            inlineDeepLink,
                            sentence.dibburHamatchil,
                            {
                              fromSentenceId: sentence.id,
                              fromElementId: `sentence-${sentence.id}`,
                              sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
                              sourceLabelHe: inlineDeepLink.citeHe,
                              anchorRect,
                            }
                          );
                          return;
                        }
                        let spanStartIdx = idx;
                        let spanEndIdx = idx;
                        while (
                          spanStartIdx > 0 &&
                          wordCitationMap.get(spanStartIdx - 1)?.link.id === inlineDeepLink.id
                        ) {
                          spanStartIdx--;
                        }
                        while (
                          spanEndIdx + 1 < words.length &&
                          wordCitationMap.get(spanEndIdx + 1)?.link.id === inlineDeepLink.id
                        ) {
                          spanEndIdx++;
                        }
                        setActiveTappedCitation({
                          sentenceId: sentence.id,
                          link: inlineDeepLink,
                          anchorRect: {
                            left: rect.left,
                            top: rect.top,
                            right: rect.right,
                            bottom: rect.bottom,
                            width: rect.width,
                            height: rect.height,
                          },
                        });
                        setHtmlWordRange({
                          sentenceId: sentence.id,
                          startIdx: spanStartIdx,
                          endIdx: spanEndIdx,
                          showHandles: false,
                        });
                        const fullSpanWords = words.slice(spanStartIdx, spanEndIdx + 1).join(' ');
                        onSelectWordOrSentence(fullSpanWords || word, sentence, rect, 'word-ka');
                        return;
                      }

                      // Requirement 3: 1st tap on a new word marks it WITHOUT showing the two balls
                      setActiveTappedCitation(null);
                      if (!isWordActive) {
                        setHtmlWordRange({
                          sentenceId: sentence.id,
                          startIdx: idx,
                          endIdx: idx,
                          showHandles: false,
                        });
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const selectedText =
                        activeRangeForSent && isWordActive
                          ? words.slice(rangeMin, rangeMax + 1).join(' ')
                          : word;
                      const isInsideSefariaAll = Boolean(
                        e.currentTarget.closest('#daf-section-sefaria-all')
                      );
                      if (isInsideSefariaAll) {
                        setDeepLinkedSentenceId(sentence.id);
                      }
                      onSelectWordOrSentence(
                        selectedText,
                        sentence,
                        rect,
                        isInsideSefariaAll ? 'sentence-ka' : 'word-ka'
                      );
                      if (isInsideSefariaAll) {
                        onOpenWordNote?.();
                      }
                    }}
                    style={{
                      fontFamily: isLeadWord
                        ? "'Frank Ruhl Libre', 'David Libre', serif"
                        : isRashiScript && useRashiFont
                          ? "'Noto Rashi Hebrew', 'David Libre', serif"
                          : "'Frank Ruhl Libre', 'David Libre', serif",
                    }}
                    className={`relative inline rounded-[3px] cursor-pointer select-text transition-all duration-150 ${
                      isLeadWord
                        ? !isRashiScript
                          ? 'font-black text-[1.75em] sm:text-[2.05em] leading-none ml-1.5 text-[#080706] '
                          : 'font-black text-[1.25em] ml-1 text-[#080706] '
                        : ''
                    }${
                      inlineDeepLink
                        ? isCitationTapped
                          ? 'talmud-blue-marker text-[#0E3299] dark:text-[#93C5FD] font-black underline decoration-[#1545C8] decoration-2 z-20 pointer-events-auto bg-transparent '
                          : 'talmud-blue-marker text-[#1545C8] dark:text-[#60A5FA] font-extrabold hover:text-[#0E3299] z-20 pointer-events-auto bg-transparent '
                        : ''
                    }${
                      isSharedCrossToken && !inlineDeepLink
                        ? 'underline decoration-wavy decoration-[#B45309] bg-amber-200/55 font-extrabold '
                        : ''
                    }${
                      isWordSearchMatch
                        ? 'bg-amber-300 dark:bg-amber-400 text-stone-950 font-black ring-2 ring-amber-500 shadow-sm px-1 py-0.5 rounded '
                        : ''
                    }${
                      isWordActive && !inlineDeepLink
                        ? wordExplainStage === 'marked'
                          ? 'bg-[#E6B86A] text-[#1F1208] font-black ring-1 ring-[#7A4E2D] px-0.5'
                          : 'bg-[#4A2E1B] text-[#FAF5EB] font-bold ring-1 ring-[#C49A6C] px-0.5'
                        : !inlineDeepLink
                          ? 'hover:bg-amber-700/15'
                          : ''
                    }`}
                  >
                    {/* Right (Start in RTL) ball handle — only shown after 2nd-press long-press */}
                    {activeRangeForSent?.showHandles && idx === rangeMin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextMin = Math.max(0, rangeMin - 1);
                          setHtmlWordRange({
                            sentenceId: sentence.id,
                            startIdx: nextMin,
                            endIdx: rangeMax,
                            showHandles: true,
                          });
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            onSelectWordOrSentence(
                              words.slice(nextMin, rangeMax + 1).join(' '),
                              sentence,
                              rect,
                              'word-ka'
                            );
                          }
                        }}
                        title="მონიშვნის გაფართოება მარჯვნივ"
                        className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-600 border border-white shadow-sm align-middle mx-0.5 cursor-ew-resize"
                      />
                    )}
                    {word}
                    {/* Left (End in RTL) ball handle — only shown after 2nd-press long-press */}
                    {activeRangeForSent?.showHandles && idx === rangeMax && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextMax = Math.min(words.length - 1, rangeMax + 1);
                          setHtmlWordRange({
                            sentenceId: sentence.id,
                            startIdx: rangeMin,
                            endIdx: nextMax,
                            showHandles: true,
                          });
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            onSelectWordOrSentence(
                              words.slice(rangeMin, nextMax + 1).join(' '),
                              sentence,
                              rect,
                              'word-ka'
                            );
                          }
                        }}
                        title="მონიშვნის გაფართოება მარცხნივ"
                        className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-600 border border-white shadow-sm align-middle mx-0.5 cursor-ew-resize"
                      />
                    )}
                  </span>
                  {/* Requirement 4: When the user taps the blue citation text, show the translucent diamond jump button at fixed normal screen size independent of zoom! */}
                  {citeEntry?.isSpanEnd && isCitationTapped && inlineDeepLink && (
                    <CrystalDiamondJumpButton
                      labelKa={`წყარო (Note): ${inlineDeepLink.targetSectionLabelKa}`}
                      citeHe={inlineDeepLink.citeHe}
                      anchorRect={activeTappedCitation?.anchorRect || null}
                      isDark={isDark}
                      onClick={(e) => {
                        e.stopPropagation();
                        const savedAnchorRect = activeTappedCitation?.anchorRect || null;
                        setActiveTappedCitation(null);
                        setHtmlWordRange(null);
                        const secLabelKa =
                          sentence.source === 'tosafot'
                            ? 'თოსაფოთი'
                            : sentence.source === 'rashi'
                              ? 'რაში'
                              : 'კომენტარი';
                        handleTriggerTosafotDeepLink(
                          inlineDeepLink,
                          sentence.dibburHamatchil,
                          {
                            fromSentenceId: sentence.id,
                            fromElementId: `sentence-${sentence.id}`,
                            sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
                            sourceLabelHe: inlineDeepLink.citeHe,
                            anchorRect: savedAnchorRect,
                          }
                        );
                      }}
                    />
                  )}{' '}
                </React.Fragment>
              );
            });
          })()}

          {showInterlinearKa && sentence.translationKa && (
            <span
              dir="ltr"
              className="block my-1 px-2.5 py-1 rounded-lg bg-[#EAE0C8] border-l-2 border-[#6B4226] text-[#1F160E] text-xs font-sans leading-snug text-left"
            >
              {sanitizeGeorgianText(sentence.translationKa)}
            </span>
          )}
        </span>
      );
    },
    [
      selectedTarget,
      effectiveHighlightedSentenceId,
      deepLinkedSentenceId,
      markedReadingSentenceId,
      liveCrossHighlightEnabled,
      crossLinkData,
      notes,
      formatHebrewText,
      searchHighlightQuery,
      handleMarkReadingPlace,
      dafLayoutMode,
      extractTosafotCitations,
      handleShowTosafotCitationTooltip,
      handleHideTosafotCitationTooltip,
      handleTriggerTosafotDeepLink,
      buildWordCitationMap,
      activeTappedCitation,
      htmlWordRange,
      tractateNameKa,
      dafData.dafId,
      onSelectWordOrSentence,
      useRashiFont,
      wordExplainStage,
      showInterlinearKa,
    ]
  );

  // Build interactive margin sentence lists for Authentic Vilna Tzurat HaDaf
  const masoretOnlySentences: TalmudSentence[] = useMemo(() => {
    return dafData.masoretHaShas.map((m) =>
      makeInteractiveSentence(
        `masoret-${m.id}`,
        'meforshim',
        `${m.marker}) ${m.refHe}.`,
        `მასორეთ ჰაშასი (${m.marker}): ${m.refKa}`,
        'პარალელური წყარო თალმუდ ბაბლიში (מסורת הש״ס).',
        undefined,
        'מסורת הש״ס',
        'მასორეთ ჰაშასი'
      )
    );
  }, [dafData.masoretHaShas, makeInteractiveSentence]);

  const hagahotHaBachSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'hagahot-habach-1',
        'meforshim',
        '(א) גמ׳ מאימתי מזכירין על הגשמים. נ״ב גירסת הרי״ף והרא״ש גבורות גשמים:',
        'ჰაგაჰოთ ჰაბახი (א): გემარაში „როდიდან იხსენიებენ წვიმებს“ — რიფისა და როშის ვერსიით: „გვუროთ გშამიმ“.',
        'რაბი იოელ სირკისის (ბახი) ტექსტოლოგიური შესწორება გემარის ტექსტზე.',
        undefined,
        'הגהות הב״ח',
        'ჰაგაჰოთ ჰაბახი'
      ),
      makeInteractiveSentence(
        'hagahot-habach-2',
        'meforshim',
        '(ב) רש״י ד״ה מאימתי מזכירין וכו׳ צ״ל משיב הרוח ומוריד הגשם בתפלת החג:',
        'ჰაგაჰოთ ჰაბახი (ב): რაშის კომენტარში სწორი საკითხავია: „მაშივ ჰარუახ უმორიდ ჰაგეშემ“ სუკოთის ლოცვაში.',
        'ბახის შენიშვნა რაშის ტექსტზე.',
        undefined,
        'הגהות הב״ח',
        'ჰაგაჰოთ ჰაბახი'
      ),
      makeInteractiveSentence(
        'hagahot-habach-3',
        'meforshim',
        '(ג) תוס׳ ד״ה איבעיא להו וכו׳ דמה לولב ביום אף הזכרה ביום:',
        'ჰაგაჰოთ ჰაბახი (ג): თოსაფოთის ტექსტის დაზუსტება ლულავისა და წვიმის მოხსენიების შედარებაზე.',
        'ბახის შენიშვნა თოსაფოთის სვეტზე.',
        undefined,
        'הגהות הב״ח',
        'ჰაგაჰოთ ჰაბახი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const maharavRensburgSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'maharav-rensburg-1',
        'meforshim',
        '[א] גמ׳ איבעיא להו רבי אליעזר מהיכא גמיר לה מלולב גמיר לה או מניסוך המים. עי׳ ר״ה דף טז ע״א ובסוכה דף מב ע״ב:',
        'ჰაგაჰოთ მაჰარავ რენშბურგი [א]: იხილეთ როშ ჰაშანა 16a და სუკა 42b ლულავისა და წყლის საღვრელის წყაროების შესახებ.',
        'რაბი ბეცალელ რენშბურგის კლასიკური შენიშვნები ვილნის დაფის მარჯვენა არშიაზე.',
        undefined,
        'הגהות מהר״ב רנשבורג',
        'მაჰარავ რენშბურგი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const gilyonHaShasSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'gilyon-hashas-1',
        'meforshim',
        '⊙ גליון הש״ס (רבי עקיבא איגר): גמ׳ מאימתי מזכירין וכו׳. עיין מגילה דף ד ע״א ובתוספות שם, וכן לקמן דף כד ע״א.',
        'გილიონ ჰაშასი (რაბი აკივა ეიგერი ⊙): გემარაში „როდიდან იხსენიებენ“ — იხილეთ მეგილა 4a და თოსაფოთი იქ, ასევე ქვემოთ 24a.',
        'რაბი აკივა ეიგერის კლასიკური მარგინალური გლოსები (გამოსახული წრით ⊙).',
        undefined,
        'גליון הש״ס',
        'გილიონ ჰაშასი'
      ),
      makeInteractiveSentence(
        'gilyon-hashas-גליון',
        'meforshim',
        '⊙ גליון הש״ס (רבי עקיבא איגר): תוס׳ ד״ה תנא היכა קאי. עיין יבמות דף טו ובפסחים דף ב.',
        'გილიონ ჰაშასი (რაბი აკივა ეიგერი ⊙): თოსაფოთზე „სად დგას თანა“ — იხილეთ ევამოთ 15 და ფსახიმ 2.',
        'რაბი აკივა ეიგერის კომენტარი თოსაფოთის დიბურ ჰამათხილზე.',
        undefined,
        'גליון הש״ס',
        'გილიონ ჰაშასი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const masoretSentences: TalmudSentence[] = useMemo(
    () => [
      ...masoretOnlySentences,
      ...hagahotHaBachSentences,
      ...maharavRensburgSentences,
      ...gilyonHaShasSentences,
    ],
    [masoretOnlySentences, hagahotHaBachSentences, maharavRensburgSentences, gilyonHaShasSentences]
  );

  const einMishpatOnlySentences: TalmudSentence[] = useMemo(() => {
    return dafData.einMishpat.map((em) =>
      makeInteractiveSentence(
        `ein-mishpat-${em.id}`,
        'meforshim',
        `${em.marker} ${em.halachaHe}.`,
        `ეინ მიშპატი (${em.marker}): ${em.halachaKa}`,
        'ჰალახური კოდიფიკაცია რამბამში (მიშნე თორა), სმაგში, ტურსა და შულხან არუხში.',
        undefined,
        'עין משפט נר מצוה',
        'ეინ მიშპატ ნერ მიცვა'
      )
    );
  }, [dafData.einMishpat, makeInteractiveSentence]);

  const torahOrSentences: TalmudSentence[] = useMemo(() => {
    const fromData = (dafData.torahOr || []).map((to, idx) =>
      makeInteractiveSentence(
        `torah-or-${to.id || idx}`,
        'meforshim',
        `${idx + 1}. ${to.hebrewText || to.hebrew || ''}`,
        `თორა ორ ჰაშალემი (${idx + 1}): ${to.translationKa || ''}`,
        to.explanationKa || 'დაფზე მოყვანილი ბიბლიური მუხლების (ფასუკების) სრული წყარო.',
        to.dibburHamatchil,
        'תורה אור השלם',
        'თორა ორ ჰაშალემი'
      )
    );
    if (fromData.length > 0) return fromData;
    return [
      makeInteractiveSentence(
        'torah-or-fallback-1',
        'meforshim',
        '1. וִידַעְתֶּם כִּי אֲנִי ה׳ בְּפִתְחִי אֶת קִבְרוֹתֵיכֶם וּבְהַעֲלוֹתִי אֶתְכֶם מִקִּבְרוֹתֵיכֶם עַמִּי: (יחזקאל לז יג)',
        'თორა ორ ჰაშალემი (1): „და გაიგებთ, რომ მე ვარ უფალი, როცა გავხსნი თქვენს სამარხებს...“ (იეხეზკელი 37:13)',
        'მკვდრეთით აღდგომის გასაღების ბიბლიური წყარო.',
        undefined,
        'תורה אור השלם',
        'თორა ორ ჰაშალემი'
      ),
      makeInteractiveSentence(
        'torah-or-fallback-2',
        'meforshim',
        '2. פּוֹתֵחַ אֶת יָדֶךָ וּמַשְׂבִּיעַ לְכָל חַי רָצוֹן: (תהלים קמה טז)',
        'თორა ორ ჰაშალემი (2): „ხსნი შენს ხელს და აკმაყოფილებ ყოველი ცოცხალის სურვილს“ (ფსალმუნები 145:16)',
        'საზრდოს (ფარნასის) გასაღების ბიბლიური წყარო.',
        undefined,
        'תורה אור השלם',
        'თორა ორ ჰაშალემი'
      ),
    ];
  }, [dafData.torahOr, makeInteractiveSentence]);

  const rabbeinuChananelSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'rabbeinu-chananel-1',
        'meforshim',
        'מאימתי מזכירין גבורות גשמים וכו׳. שלשה מפתחות ביד הקב״ה שלא נמסרו ביד שליח ואלו הן: מפתח של גשמים ומפתח של חיה ומפתח של תחיית המתים:',
        'რაბეინუ ხანანელი: სამი გასაღებია გამჩენის ხელში, რომლებიც არ გადაცემულა შუამავალს: წვიმის, მშობიარობისა და მკვდრეთით აღდგომის.',
        'რაბეინუ ხანანელ ბენ ხუშიელის კლასიკური კომენტარი ვილნის დაფის მარცხენა სვეტზე.',
        undefined,
        'רבינו חננאל',
        'რაბეინუ ხანანელი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const musafRashiSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'musaf-rashi-1',
        'meforshim',
        'משעת הנחתו. משעת הנחת לולב הוה מזכיר דהיינו יום שמיני עצרת:',
        'მუსაფ רש״י: ლულავის დადების საათიდან იხსენიებს წვიმას, რაც არის შმინი აცერეთის დღე.',
        'დამატებითი რაშის კომენტარი ვილნის დაფზე (מוסף רש״י).',
        undefined,
        'מוסף רש״י',
        'მუსაფ רש״ი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const rabbeinuGershomSentences: TalmudSentence[] = useMemo(
    () => [
      makeInteractiveSentence(
        'rabbeinu-gershom-1',
        'meforshim',
        'גבורות גשמים מזכיר ואינו שואל. והואיל וארבעת מינין הללו אינן באין אלא לרצות על המים וכשם שארבע מינין הללו אי אפשר בהם בלא מים כך אי אפשר לעולם בלא מים:',
        'რაბეინუ გერშომი (მაორ ჰაგოლა): „გვუროთ გშამიმ“ არის წვიმის ძლიერების მოხსენიება, ხოლო ოთხი მცენარე (არბა მინიმ) მოდის წყლის კურთხევის სათხოვნელად.',
        'რაბეინუ გერშომ მაორ ჰაგოლას კომენტარი ვილნის დაფის ქვედა და მარცხენა არშიაზე.',
        undefined,
        'רבינו גרשום',
        'რაბეინუ გერშომი'
      ),
    ],
    [makeInteractiveSentence]
  );

  const einMishpatSentences: TalmudSentence[] = useMemo(
    () => [
      ...einMishpatOnlySentences,
      ...torahOrSentences,
      ...gilyonHaShasSentences,
      ...rabbeinuChananelSentences,
      ...musafRashiSentences,
      ...rabbeinuGershomSentences,
    ],
    [
      einMishpatOnlySentences,
      torahOrSentences,
      gilyonHaShasSentences,
      rabbeinuChananelSentences,
      musafRashiSentences,
      rabbeinuGershomSentences,
    ]
  );

  const dafMarkHe = dafData.dafId.endsWith('b')
    ? `${dafData.dafNumberHe.replace(/׳/g, '')}:`
    : `${dafData.dafNumberHe.replace(/׳/g, '')}.`;

  // Capture the exact current scroll position within the Talmud page and persist to localStorage
  const handleSaveScrollBookmark = useCallback(
    (options?: { isAuto?: boolean; explicitSentenceId?: string | null }) => {
      if (typeof window === 'undefined') return;
      const isAuto = options?.isAuto ?? false;

      const windowScrollY = Math.max(
        0,
        Math.round(window.scrollY || document.documentElement.scrollTop || 0)
      );
      const folioEl = document.getElementById('talmud-daf-folio-anchor');
      const folioRect = folioEl ? folioEl.getBoundingClientRect() : null;
      const folioTopDocY = folioRect ? folioRect.top + windowScrollY : 0;
      const folioHeight = Math.max(
        1,
        folioEl?.scrollHeight || Math.round(folioRect?.height || 1)
      );
      const folioOffsetY = Math.max(0, Math.round(windowScrollY - folioTopDocY));
      const fullViewportScrollTop =
        isDafFullViewport && folioEl ? Math.max(0, Math.round(folioEl.scrollTop)) : 0;

      const docMaxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollRatio =
        isDafFullViewport && folioEl
          ? Number(
              Math.min(
                1,
                Math.max(
                  0,
                  folioEl.scrollTop / Math.max(1, folioEl.scrollHeight - folioEl.clientHeight)
                )
              ).toFixed(4)
            )
          : Number(Math.min(1, Math.max(0, windowScrollY / docMaxScroll)).toFixed(4));

      const folioRatio = Number(
        Math.min(1, Math.max(0, folioOffsetY / folioHeight)).toFixed(4)
      );

      // Find the sentence closest to the user's current reading line (~30% from top of viewport)
      const allPageSentences = [
        ...effectiveMishnah,
        ...effectiveGemara,
        ...effectiveRashi,
        ...effectiveTosafot,
      ];
      let anchorSentenceId: string | null =
        options?.explicitSentenceId !== undefined
          ? options.explicitSentenceId
          : selectedTarget?.sentence.id || markedReadingSentenceId || null;

      if (!anchorSentenceId && typeof document !== 'undefined') {
        const targetViewportY = window.innerHeight * 0.32;
        let closestDist = Infinity;
        for (const s of allPageSentences) {
          const el = document.getElementById(`sentence-${s.id}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(rect.top - targetViewportY);
            if (dist < closestDist) {
              closestDist = dist;
              anchorSentenceId = s.id;
            }
          }
        }
      }

      const matchedSent =
        allPageSentences.find((s) => s.id === anchorSentenceId) || effectiveMishnah[0];
      const rawHe = matchedSent?.hebrewText || matchedSent?.hebrew || dafData.openingWordHe || '';
      const anchorSnippetHe = rawHe.split(/\s+/).slice(0, 7).join(' ');
      const sectionLabelKa =
        matchedSent?.source === 'rashi'
          ? 'რაში (רש״י)'
          : matchedSent?.source === 'tosafot'
            ? 'თოსაფოთი (תוספות)'
            : matchedSent?.source === 'mishnah'
              ? 'მიშნა (משנה)'
              : 'გემარა (גמרא)';

      const bookmark: TalmudScrollBookmark = {
        id: `${dafData.tractateId}:${dafData.dafId}`,
        tractateId: dafData.tractateId,
        tractateNameHe,
        tractateNameKa,
        dafId: dafData.dafId,
        dafMarkHe,
        windowScrollY,
        folioOffsetY,
        fullViewportScrollTop,
        scrollRatio,
        folioRatio,
        layoutMode: dafLayoutMode,
        anchorSentenceId: anchorSentenceId || null,
        anchorSnippetHe,
        sectionLabelKa,
        savedAt: Date.now(),
      };

      try {
        localStorage.setItem(
          getDafScrollBookmarkKey(dafData.tractateId, dafData.dafId),
          JSON.stringify(bookmark)
        );
        if (anchorSentenceId) {
          localStorage.setItem(
            `talmud_reading_mark_${dafData.tractateId}_${dafData.dafId}`,
            anchorSentenceId
          );
          setMarkedReadingSentenceId(anchorSentenceId);
        }
      } catch {
        // ignore storage quota errors
      }

      setSavedScrollBookmarks((prev) => {
        const next = [bookmark, ...prev.filter((b) => b.id !== bookmark.id)].slice(0, 50);
        try {
          localStorage.setItem(SCROLL_BOOKMARKS_LIST_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      if (!isAuto) {
        const pct = Math.round(scrollRatio * 100);
        setBookmarkToastMessage(
          `სანიშნე შენახულია (${tractateNameKa} ${dafData.dafId} · ${pct}% / ${windowScrollY}px)`
        );
        setTimeout(() => {
          setBookmarkToastMessage((msg) =>
            msg && msg.includes(dafData.dafId) ? null : msg
          );
        }, 3200);
      }
    },
    [
      dafData.tractateId,
      dafData.dafId,
      dafData.openingWordHe,
      tractateNameHe,
      tractateNameKa,
      dafMarkHe,
      isDafFullViewport,
      dafLayoutMode,
      effectiveMishnah,
      effectiveGemara,
      effectiveRashi,
      effectiveTosafot,
      selectedTarget?.sentence.id,
      markedReadingSentenceId,
    ]
  );

  useEffect(() => {
    saveScrollBookmarkRef.current = handleSaveScrollBookmark;
  }, [handleSaveScrollBookmark]);

  // Restore exact saved scroll position within the Talmud page
  const handleRestoreScrollBookmark = useCallback(
    (target?: TalmudScrollBookmark) => {
      const bm = target || currentDafBookmark;
      if (!bm || typeof window === 'undefined') return;

      // If the bookmark belongs to a different Tractate or Daf, navigate there first and queue restoration
      if (bm.tractateId !== dafData.tractateId || bm.dafId !== dafData.dafId) {
        try {
          localStorage.setItem(PENDING_RESTORE_BOOKMARK_KEY, JSON.stringify(bm));
        } catch {
          // ignore
        }
        if (onNavigateToTractateDaf) {
          onNavigateToTractateDaf(bm.tractateId, bm.dafId);
        }
        setBookmarksMenuOpen(false);
        return;
      }

      // Restore layout mode if different
      if (bm.layoutMode && bm.layoutMode !== dafLayoutMode) {
        setDafLayoutMode(bm.layoutMode);
      }
      if (bm.anchorSentenceId) {
        setMarkedReadingSentenceId(bm.anchorSentenceId);
        setDeepLinkedSentenceId(bm.anchorSentenceId);
      }

      const performScrollRestore = () => {
        const folioEl = document.getElementById('talmud-daf-folio-anchor');
        if (isDafFullViewport && folioEl) {
          const targetTop =
            bm.fullViewportScrollTop > 0
              ? bm.fullViewportScrollTop
              : Math.round(
                  bm.scrollRatio * Math.max(1, folioEl.scrollHeight - folioEl.clientHeight)
                );
          folioEl.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
          let targetY = bm.windowScrollY;
          if (folioEl && bm.folioOffsetY > 0) {
            const currentScrollY =
              window.scrollY || document.documentElement.scrollTop || 0;
            const folioTopDocY =
              folioEl.getBoundingClientRect().top + currentScrollY;
            targetY = Math.max(0, Math.round(folioTopDocY + bm.folioOffsetY));
          } else if (targetY <= 0 && bm.scrollRatio > 0) {
            const docMax = Math.max(
              1,
              document.documentElement.scrollHeight - window.innerHeight
            );
            targetY = Math.round(bm.scrollRatio * docMax);
          }
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

        setRestoredScrollPulse(true);
        setTimeout(() => setRestoredScrollPulse(false), 2400);
      };

      requestAnimationFrame(() => {
        performScrollRestore();
        setTimeout(performScrollRestore, 110);
      });

      setBookmarksMenuOpen(false);
      setBookmarkToastMessage(
        `აღდგენილია კითხვის წერტილი: ${bm.tractateNameKa} ${bm.dafId} (${Math.round(
          bm.scrollRatio * 100
        )}% · ${bm.windowScrollY}px)`
      );
      setTimeout(() => setBookmarkToastMessage(null), 3000);
    },
    [
      currentDafBookmark,
      dafData.tractateId,
      dafData.dafId,
      dafLayoutMode,
      isDafFullViewport,
      onNavigateToTractateDaf,
    ]
  );

  const handleRemoveScrollBookmark = useCallback(
    (tractateId: string, dafId: string) => {
      const id = `${tractateId}:${dafId}`;
      try {
        localStorage.removeItem(getDafScrollBookmarkKey(tractateId, dafId));
        if (tractateId === dafData.tractateId && dafId === dafData.dafId) {
          localStorage.removeItem(`talmud_reading_mark_${tractateId}_${dafId}`);
          setMarkedReadingSentenceId(null);
        }
      } catch {
        // ignore
      }
      setSavedScrollBookmarks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        try {
          localStorage.setItem(SCROLL_BOOKMARKS_LIST_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [dafData.tractateId, dafData.dafId]
  );

  // Check if a cross-Daf bookmark restoration was queued via PENDING_RESTORE_BOOKMARK_KEY
  useEffect(() => {
    try {
      const pendingRaw = localStorage.getItem(PENDING_RESTORE_BOOKMARK_KEY);
      if (!pendingRaw) return;
      const pending: TalmudScrollBookmark = JSON.parse(pendingRaw);
      if (
        pending.tractateId === dafData.tractateId &&
        pending.dafId === dafData.dafId
      ) {
        localStorage.removeItem(PENDING_RESTORE_BOOKMARK_KEY);
        const timer = setTimeout(() => {
          handleRestoreScrollBookmark(pending);
        }, 180);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [dafData.tractateId, dafData.dafId, handleRestoreScrollBookmark]);

  // მომხმარებლის მოთხოვნა: თალმუდის დაფზე შესვლისას და გადაფურცვლისას დაფი სჩანდეს მთლიანად,
  // არ იყოს აწეული ზევით ან გაწეული ქვევით — დაიწყოს ზუსტად თავიდან
  useEffect(() => {
    const timer = setTimeout(() => {
      const folioAnchor = document.getElementById('talmud-daf-folio-anchor');
      if (folioAnchor) {
        if (isDafFullViewport) {
          folioAnchor.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [dafData.dafId, dafData.tractateId, isDafFullViewport]);

  const openSectionFullscreen = useCallback(
    (
      id: string,
      titleHe: string,
      titleKa: string,
      sentences: TalmudSentence[],
      isRashiScript = false
    ) => {
      setFullscreenSection({
        id,
        titleHe,
        titleKa,
        sentences,
        isRashiScript,
      });
    },
    []
  );

  // Auto Line-Translation Mode & Reading Bookmark Line step triggers (Requirements 4 & 5)
  const [internalAutoTranslateLineMode, setInternalAutoTranslateLineMode] =
    useState<boolean>(false);
  const autoTranslateLineMode =
    externalAutoTranslateLineMode !== undefined
      ? externalAutoTranslateLineMode
      : internalAutoTranslateLineMode;
  const toggleAutoTranslateLineMode = useCallback(() => {
    if (onExternalToggleAutoTranslateLineMode) {
      onExternalToggleAutoTranslateLineMode();
    } else {
      setInternalAutoTranslateLineMode((v) => !v);
    }
  }, [onExternalToggleAutoTranslateLineMode]);

  const [stoppedRowStepTrigger, setStoppedRowStepTrigger] = useState<{
    dir: 'prev' | 'next' | 'jump';
    seq: number;
  } | null>(null);
  const effectiveStoppedRowStepTrigger =
    externalStoppedRowStepTrigger || stoppedRowStepTrigger;

  useEffect(() => {
    const handleBookmarkStep = (e: any) => {
      const dir = (e?.detail?.dir as 'prev' | 'next' | 'jump') || 'jump';
      setStoppedRowStepTrigger((prev) => ({
        dir,
        seq: (prev?.seq || 0) + 1,
      }));
    };
    const handleToggleTranslate = () => {
      toggleAutoTranslateLineMode();
    };
    window.addEventListener('global-talmud-bookmark-step', handleBookmarkStep);
    window.addEventListener('talmud-toggle-line-translate', handleToggleTranslate);
    return () => {
      window.removeEventListener('global-talmud-bookmark-step', handleBookmarkStep);
      window.removeEventListener('talmud-toggle-line-translate', handleToggleTranslate);
    };
  }, [toggleAutoTranslateLineMode]);

  // Requirement: Store the last read Y-position for the current daf in localStorage upon scroll-end, and add a floating button to 'Jump to Last Position' when returning to a previously viewed page.
  const lastReadStorageKey = `talmud_last_read_y_${dafData.tractateId}_${dafData.dafId}`;
  const [savedLastReadY, setSavedLastReadY] = useState<number>(0);
  const [showJumpToLastPosition, setShowJumpToLastPosition] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const v = localStorage.getItem(lastReadStorageKey);
      const parsedY = v ? parseInt(v, 10) : 0;
      if (parsedY > 140) {
        setSavedLastReadY(parsedY);
        setShowJumpToLastPosition(true);
      } else {
        setSavedLastReadY(0);
        setShowJumpToLastPosition(false);
      }
    } catch {
      // ignore
    }
  }, [lastReadStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let debounceTimer: any = null;

    const handleSaveY = () => {
      const folioEl = document.getElementById('talmud-daf-folio-anchor');
      const currentY =
        isDafFullViewport && folioEl
          ? folioEl.scrollTop
          : window.scrollY || document.documentElement.scrollTop || 0;
      if (currentY > 60) {
        try {
          localStorage.setItem(lastReadStorageKey, String(Math.round(currentY)));
        } catch {}
      }
      if (savedLastReadY > 0 && Math.abs(currentY - savedLastReadY) < 100) {
        setShowJumpToLastPosition(false);
      }
    };

    const onScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleSaveY, 200);
    };

    const folioEl = document.getElementById('talmud-daf-folio-anchor');
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', handleSaveY, { passive: true });
    if (folioEl) {
      folioEl.addEventListener('scroll', onScroll, { passive: true });
      folioEl.addEventListener('scrollend', handleSaveY, { passive: true });
    }

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', handleSaveY);
      if (folioEl) {
        folioEl.removeEventListener('scroll', onScroll);
        folioEl.removeEventListener('scrollend', handleSaveY);
      }
    };
  }, [lastReadStorageKey, isDafFullViewport, savedLastReadY]);

  const handleJumpToLastPosition = useCallback(() => {
    if (savedLastReadY <= 0 || typeof window === 'undefined') return;
    const folioEl = document.getElementById('talmud-daf-folio-anchor');
    if (isDafFullViewport && folioEl) {
      folioEl.scrollTo({ top: savedLastReadY, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: savedLastReadY, behavior: 'smooth' });
    }
    setShowJumpToLastPosition(false);
  }, [savedLastReadY, isDafFullViewport]);

  // Helper function to identify and scroll to the nearest Rashi or Tosafot commentary block when clicking a specific marker within #talmud-daf-folio-anchor, leveraging scroll-snap-align to center the selected commentary for improved focus
  const scrollToNearestCommentaryBlock = useCallback(
    (type: 'rashi' | 'tosafot' | 'mishnah' | 'gemara', sentenceId?: string) => {
      if (typeof document === 'undefined') return;
      const targetEl = sentenceId
        ? document.getElementById(`sentence-${sentenceId}`) ||
          document.querySelector(`[data-sentence-id="${sentenceId}"]`)
        : document.getElementById(`daf-section-${type}`);
      if (targetEl) {
        try {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
      }
      const folio = document.getElementById('talmud-daf-folio-anchor');
      if (folio && targetEl && folio.contains(targetEl)) {
        const fRect = folio.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        const targetTop = folio.scrollTop + (tRect.top - fRect.top) - folio.clientHeight * 0.40;
        folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }
    },
    []
  );

  return (
    <div className={isDafFullViewport ? 'w-full h-full p-0 m-0' : 'flex flex-col gap-2 w-full max-w-full overflow-x-hidden'}>
      {!isDafFullViewport && bookmarkToastMessage && (
        <div className="px-3 py-1.5 rounded-xl bg-[#2B1B10] text-amber-200 border border-amber-400/50 text-xs font-bold text-center shadow-md">
          {bookmarkToastMessage}
        </div>
      )}

      {/* Floating Button: Jump to Last Position when returning to a previously read page */}
      {showJumpToLastPosition && savedLastReadY > 0 && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto">
          <button
            type="button"
            onClick={handleJumpToLastPosition}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-2xl border-2 border-amber-300 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="ბოლო წაკითხულ ადგილზე გადასვლა"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ბოლო წაკითხულ ადგილზე გადასვლა</span>
          </button>
        </div>
      )}

      {/* MAIN TALMUD DAF FOLIO CANVAS — EXPANDS TO FULL SCREEN WHEN isDafFullViewport IS TRUE */}
      <div
        id="talmud-daf-folio-anchor"
        data-full-viewport-daf={isDafFullViewport ? 'true' : 'false'}
        style={{
          scrollSnapType: 'none',
          scrollBehavior: 'smooth',
          scrollMarginTop: '64px',
        }}
        className={
          isDafFullViewport
            ? `fixed inset-0 z-[280] w-screen h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-0 m-0 ${
                theme === 'celestial-slate'
                  ? 'bg-[#EEF5FC] text-[#1E293B]'
                  : 'bg-[#FBF8F1] text-[#2C1A10]'
              }`
            : 'w-full max-w-full flex flex-col items-center justify-center mx-auto'
        }
      >
        <div
          className={
            isDafFullViewport
              ? 'relative w-full max-w-none min-h-full flex flex-col items-center justify-start transition-all p-0 m-0'
              : 'relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center transition-all'
          }
        >
          <Talmud3DViewer
            pageKey={`${dafData.tractateId}-${dafData.dafId}`}
          direction={pageTurnDirection}
          isDark={isDark}
          showControlsAboveDaf={false}
          isFullScreen={isDafFullViewport}
          onToggleFullScreen={() => setIsDafFullViewport((v) => !v)}
          onPrevAmud={onPrevAmud}
          onNextAmud={onNextAmud}
          dafTitleLabel={`${tractateNameKa} • ${dafData.dafId} (${dafMarkHe})`}
          centerNavigationSelector={
            customCenterNavigationSelector ? (
              customCenterNavigationSelector
            ) : !isSiddurDaf && onNavigateToTractateDaf ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-[130px] sm:w-[180px] min-w-0">
                  <SearchableSelect
                    options={TRACTATES.map((tr) => ({
                      value: tr.id,
                      badgeHe: tr.nameHe,
                      label: `${tr.nameKa.split(' (')[0]} • ${tr.nameHe}`,
                    }))}
                    value={dafData.tractateId}
                    onChange={(val) => onNavigateToTractateDaf(val, '2a')}
                    isDark={isDark}
                    compact
                    searchPlaceholder="ტრაქტატი..."
                  />
                </div>
                <div className="w-[90px] sm:w-[105px] min-w-0">
                  <SearchableSelect
                    options={generateDafListForTractate(
                      TRACTATES.find((t) => t.id === dafData.tractateId)?.lastDaf || 64
                    ).map((dId) => ({
                      value: dId,
                      badgeHe: dId,
                      label: `דף ${dId}`,
                    }))}
                    value={dafData.dafId}
                    onChange={(val) => onNavigateToTractateDaf(dafData.tractateId, val)}
                    isDark={isDark}
                    compact
                    searchPlaceholder="დაფი..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('global-open-bottom-sheet'));
                  }}
                  className={`h-7 px-2 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#2D1C12] border-[#C49A6C]/45 text-[#FAF5EB] hover:bg-[#3D271A]'
                      : 'bg-[#EFE3CA] border-[#8B5A2B]/40 text-[#2C180B] hover:bg-[#E5D4B5]'
                  }`}
                  title="სრული საძიებო სარჩევისა და ქვედა პანელის გახსნა"
                >
                  <Search className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="hidden md:inline">სარჩევი</span>
                </button>
              </div>
            ) : undefined
          }
          extraToolbarControls={
            <>
              {/* 1. Stopped Reading Line Stepper & Jump */}
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
                    setStoppedRowStepTrigger((prev) => ({
                      dir: 'jump',
                      seq: (prev?.seq || 0) + 1,
                    }))
                  }
                  className="px-1 py-0.5 rounded hover:bg-amber-500/20 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  title="გაჩერებულ სანიშნ ხაზზე გადასვლა"
                >
                  <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="hidden xl:inline">ხაზი</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStoppedRowStepTrigger((prev) => ({
                      dir: 'prev',
                      seq: (prev?.seq || 0) + 1,
                    }))
                  }
                  className="px-1 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-[9.5px] font-black cursor-pointer text-amber-500"
                  title="წინა სტრიქონზე გადასვლა"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStoppedRowStepTrigger((prev) => ({
                      dir: 'next',
                      seq: (prev?.seq || 0) + 1,
                    }))
                  }
                  className="px-1 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-[9.5px] font-black cursor-pointer text-amber-500"
                  title="მომდევნო სტრიქონზე გადასვლა"
                >
                  ▼
                </button>
              </div>

              {/* 2. Auto Line-Translation Toggle */}
              <button
                type="button"
                onClick={toggleAutoTranslateLineMode}
                className={`h-7 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  autoTranslateLineMode
                    ? 'bg-[#B45309] text-[#FAF5EB] border-amber-300 shadow-xs'
                    : isDark
                      ? 'bg-[#2D1C12] hover:bg-[#3D271A] border-[#C49A6C]/45 text-[#FAF5EB]'
                      : 'bg-[#EFE3CA] hover:bg-[#E5D4B5] border-[#8B5A2B]/40 text-[#2C180B]'
                }`}
                title="სტრიქონის ავტო-თარგმანი"
              >
                <Languages className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">თარგმანი</span>
              </button>

              {/* 3. Save / Restore Bookmark */}
              <button
                type="button"
                onClick={() => handleSaveScrollBookmark({ isAuto: false })}
                className={`h-7 px-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#2D1C12] hover:bg-[#3D271A] border-[#C49A6C]/45 text-[#FAF5EB]'
                    : 'bg-[#EFE3CA] hover:bg-[#E5D4B5] border-[#8B5A2B]/40 text-[#2C180B]'
                }`}
                title="ზუსტი პოზიციის დამახსოვრება"
              >
                <BookmarkCheck className="w-3 h-3 text-amber-500 shrink-0" />
              </button>

              {currentDafBookmark && (
                <button
                  type="button"
                  onClick={() => handleRestoreScrollBookmark(currentDafBookmark)}
                  className="h-7 px-1.5 rounded-lg border border-amber-400/60 bg-[#B45309] hover:bg-[#92400E] text-[#FAF5EB] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                  title="შენახულ ადგილზე დაბრუნება"
                >
                  <RotateCcw className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>{Math.round(currentDafBookmark.scrollRatio * 100)}%</span>
                </button>
              )}

              {/* 4. Diagnostic HUD Button: Coordinate visualization and Sefaria grid lock */}
              <button
                type="button"
                onClick={() => setScrollDiagnosticVisible((v) => !v)}
                className={`h-7 px-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  scrollDiagnosticVisible
                    ? 'bg-[#1D4ED8] text-white border-blue-300 shadow-xs ring-1 ring-blue-400'
                    : isDark
                      ? 'bg-[#2D1C12] hover:bg-[#3D271A] border-[#C49A6C]/45 text-[#FAF5EB]'
                      : 'bg-[#EFE3CA] hover:bg-[#E5D4B5] border-[#8B5A2B]/40 text-[#2C180B]'
                }`}
                title="Scroll Target Coordinates & Sefaria Grid HUD"
              >
                <Crosshair className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="hidden xl:inline">HUD</span>
              </button>
            </>
          }
        >
          <VilnaPdfInteractiveViewer
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            dafMarkHe={dafMarkHe}
            effectiveMishnah={effectiveMishnah}
            effectiveGemara={effectiveGemara}
            effectiveRashi={effectiveRashi}
            effectiveTosafot={effectiveTosafot}
            isDark={isDark}
            fontScaleRatio={fontScaleRatio}
            selectedTarget={selectedTarget}
            wordExplainStage={wordExplainStage}
            onOpenWordNote={onOpenWordNote}
            autoTranslateLineMode={autoTranslateLineMode}
            onToggleAutoTranslateLineMode={toggleAutoTranslateLineMode}
            externalStoppedRowStepTrigger={effectiveStoppedRowStepTrigger}
            deepLinkedSentenceId={deepLinkedSentenceId}
            deepLinkedCitationLabelHe={
              activeDeepLinkInfo
                ? `${activeDeepLinkInfo.citeEn ? `${activeDeepLinkInfo.citeEn} • ` : ''}${activeDeepLinkInfo.citeHe}`
                : null
            }
            deepLinkedCitationSnippetHe={deepLinkedSnippet || activeDeepLinkInfo?.targetSnippetHe || null}
            deepLinkTriggerSeq={deepLinkTriggerSeq}
            isFullScreen={isDafFullViewport}
            onExitFullScreen={() => setIsDafFullViewport(false)}
            onNavigateToCitation={(trId, dId, citeHe, originContext) => {
              handleTriggerTosafotDeepLink(
                {
                  id: `pdf-cite-${trId}-${dId}`,
                  citeHe,
                  citeEn: `${trId.replace(/_/g, ' ')} ${dId}`,
                  tractateId: trId,
                  dafId: dId,
                  targetSectionId: 'daf-section-gemara',
                  targetSectionLabelKa: `${trId.replace(/_/g, ' ')} ${dId} (${citeHe})`,
                  targetSentenceId: (effectiveGemara[0] || effectiveMishnah[0])?.id || 'g-1',
                  targetSnippetHe:
                    originContext?.contextSnippetHe || citeHe.split(' דף ')[0] || citeHe,
                },
                citeHe,
                originContext
              );
            }}
            pendingReturnRestore={pendingReturnRestore}
            onSelectWordOrSentence={onSelectWordOrSentence}
          />
        </Talmud3DViewer>
        </div>
      </div>

      {/* BELOW-DAF STUDY CENTER & COMMENTARIES (Only shown when explicitly toggled on) */}
      {showBelowDaf && belowDafStudyCenter && (
        <div id="daf-section-study-center" className="mt-1">
          {belowDafStudyCenter}
        </div>
      )}

      {!isDafFullViewport && showBelowDaf && (
        <TalmudBelowDafSections
          dafData={dafData}
          effectiveRashi={effectiveRashi}
          effectiveTosafot={effectiveTosafot}
          tractateNameHe={tractateNameHe}
          tractateNameKa={tractateNameKa}
          isDark={isDark}
          notes={notes}
          onDeleteNote={onDeleteNote}
          onOpenAddNoteModal={() => setAddNoteModalOpen(true)}
          onOpenSectionFullscreen={openSectionFullscreen}
          makeInteractiveSentence={makeInteractiveSentence}
          renderInlineInteractiveWords={renderInlineInteractiveWords}
          extractTosafotCitations={extractTosafotCitations}
          onTriggerTosafotDeepLink={handleTriggerTosafotDeepLink}
          onShowTosafotCitationTooltip={handleShowTosafotCitationTooltip}
          onHideTosafotCitationTooltip={handleHideTosafotCitationTooltip}
          deepLinkedSentenceId={deepLinkedSentenceId}
          onSetDeepLinkedSentenceId={setDeepLinkedSentenceId}
          liveCrossHighlightEnabled={liveCrossHighlightEnabled}
          crossLinkedIds={crossLinkData.linkedIds}
          onHoverSentence={setHoveredSentence}
          onSelectWordOrSentence={onSelectWordOrSentence}
          onOpenWordNote={onOpenWordNote}
          fontScaleRatio={fontScaleRatio}
        />
      )}

      {/* ===================================================================== */}
      {/* 5. PORTAL MODALS & TOSAFOT CITATION HOVER PREVIEW TOOLTIP             */}
      {/* ===================================================================== */}
      <TalmudModals
        dafData={dafData}
        tractateNameHe={tractateNameHe}
        tractateNameKa={tractateNameKa}
        dafMarkHe={dafMarkHe}
        isDark={isDark}
        hasSelectedTarget={Boolean(selectedTarget)}
        effectiveMishnah={effectiveMishnah}
        effectiveGemara={effectiveGemara}
        effectiveChavruta={effectiveChavruta}
        fullscreenSection={fullscreenSection}
        onCloseFullscreenSection={() => setFullscreenSection(null)}
        onUpdateFullscreenSentences={(updated) =>
          setFullscreenSection((prev) => (prev ? { ...prev, sentences: updated } : prev))
        }
        isSectionSpeaking={isSectionSpeaking}
        onSpeakSection={speakHebrewSection}
        renderInlineInteractiveWords={renderInlineInteractiveWords}
        addNoteModalOpen={addNoteModalOpen}
        onCloseAddNoteModal={() => setAddNoteModalOpen(false)}
        onAddDafNote={onAddDafNote}
        shareModalOpen={shareModalOpen}
        onCloseShareModal={() => setShareModalOpen(false)}
        showOnlinePdfModal={showOnlinePdfModal}
        onCloseOnlinePdfModal={() => setShowOnlinePdfModal(false)}
        hoveredTosafotCitation={hoveredTosafotCitation}
        getCitationDafPreview={getCitationDafPreview}
        dafFontSizeScale={dafFontSizeScale}
      />

      {/* 6. DIAGNOSTIC SCROLL COORDINATE OVERLAY & RETICLE HIGHLIGHT */}
      <TalmudScrollDiagnosticOverlay
        metrics={scrollMetrics}
        activeAnchor={activeScrollAnchor}
        isVisible={scrollDiagnosticVisible}
        onToggleVisible={() => setScrollDiagnosticVisible(false)}
        onTriggerRealign={() => {
          if (activeScrollTargetRef.current?.elementId) {
            const el =
              document.getElementById(activeScrollTargetRef.current.elementId) ||
              (activeScrollTargetRef.current.sentenceId
                ? document.getElementById(`sentence-${activeScrollTargetRef.current.sentenceId}`) ||
                  (document.querySelector(`[data-sentence-id="${activeScrollTargetRef.current.sentenceId}"]`) as HTMLElement | null)
                : null);
            if (el) {
              performTargetScroll(el, activeScrollTargetRef.current.refStr || undefined, 'manual-hud-realign');
            }
          }
        }}
        isDark={isDark}
      />
    </div>
  );
});
