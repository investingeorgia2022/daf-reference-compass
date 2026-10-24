// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  Languages,
  Check,
  X,
  Mic,
  RotateCcw,
  Maximize2,
  Minimize2,
  Move,
  ZoomIn,
  ZoomOut,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { ReadingLineGuide } from './ReadingLineGuide';
import { emitDafCompletedCelebration } from './DafCompletionConfetti';
import {
  AnalysisMode,
  SelectedDafTarget,
  TalmudSentence,
} from '../types/talmud';
import {
  SacredRealmId,
  TORAH_BOOKS,
  SacredBookItem,
  buildCuratedSacredPage,
  numberToHebrewGematria,
} from '../data/tanakhAndHalakhaData';
import { normalizeHebrewWord } from '../data/lexicon';
import { PageFlip3DWrapper, playBookPageTurnSound } from './PageFlip3DWrapper';
import { FullScreenModal } from './FullScreenModal';
import { CrystalDiamondJumpButton, WindowsWindowControls } from './WindowsWindowControls';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';
import {
  translateToGeorgianLive,
  normalizeGeorgianJewishTerms,
  stripEmbeddedHebrewFromEnglish,
} from '../utils/georgianTranslator';
import {
  buildWordCitationIndexMap,
  isSmallRefMarkerToken,
  DetectedSacredCitation,
} from '../utils/talmudCitationDetector';

export interface TorahDafInterfaceProps {
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
  searchHighlightQuery?: string;
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

interface SavedTorahState {
  bookId: string;
  chapter: number;
  parashaId: string;
  aliyahId: string;
  pasukNum: number;
  dafVariant: 'hebrew' | 'georgian' | 'bilingual';
  isShnayimMikra: boolean;
  showRashiScript: boolean;
  showNikud: boolean;
}

const TORAH_STORAGE_KEY = 'torah_last_state_v2';

interface AliyahOption {
  id: string;
  order: number;
  nameHe: string;
  nameKa: string;
  badgeHe: string;
  chapter: number;
  startPasuk: number;
  endPasuk: number;
}

interface TorahCommentatorCard {
  id: string;
  commentatorHe: string;
  commentatorKa: string;
  categoryKa: string;
  dibburHe: string;
  hebrew: string;
  georgian: string;
  pasukNum: number;
}

const CHUMASH_LEATHER_THEMES: Record<
  string,
  {
    shortKa: string;
    shortHe: string;
    subtitleKa: string;
    leatherGradient: string;
    spineColor: string;
    borderGold: string;
    glowColor: string;
  }
> = {
  Genesis: {
    shortKa: 'ბერეშით',
    shortHe: 'בראשית',
    subtitleKa: 'დაბადება • 50 თავი',
    leatherGradient: 'linear-gradient(145deg, #4A121A 0%, #2D090E 55%, #1A0407 100%)',
    spineColor: '#24060A',
    borderGold: '#E5C158',
    glowColor: 'rgba(229, 193, 88, 0.45)',
  },
  Exodus: {
    shortKa: 'შემოთ',
    shortHe: 'שמות',
    subtitleKa: 'გამოსვლა • 40 თავი',
    leatherGradient: 'linear-gradient(145deg, #102A4C 0%, #091930 55%, #050E1C 100%)',
    spineColor: '#071324',
    borderGold: '#F3D067',
    glowColor: 'rgba(243, 208, 103, 0.45)',
  },
  Leviticus: {
    shortKa: 'ვაიკრა',
    shortHe: 'ויקרא',
    subtitleKa: 'ლევიანნი • 27 თავი',
    leatherGradient: 'linear-gradient(145deg, #52230C 0%, #331405 55%, #1E0B02 100%)',
    spineColor: '#260E03',
    borderGold: '#DFB74C',
    glowColor: 'rgba(223, 183, 76, 0.45)',
  },
  Numbers: {
    shortKa: 'ბამიდბარ',
    shortHe: 'במדבר',
    subtitleKa: 'რიცხვნი • 36 თავი',
    leatherGradient: 'linear-gradient(145deg, #3B1D4A 0%, #24102E 55%, #130719 100%)',
    spineColor: '#1B0B24',
    borderGold: '#E8C55B',
    glowColor: 'rgba(232, 197, 91, 0.45)',
  },
  Deuteronomy: {
    shortKa: 'დევარიმ',
    shortHe: 'דברים',
    subtitleKa: 'მეორე რჯული • 34 თავი',
    leatherGradient: 'linear-gradient(145deg, #0F3B29 0%, #082419 55%, #04140D 100%)',
    spineColor: '#061B12',
    borderGold: '#E5C158',
    glowColor: 'rgba(229, 193, 88, 0.45)',
  },
};

/**
 * Thoroughly cleans Sefaria HTML strings or arrays:
 * - Removes editorial footnotes (<sup class="footnote-marker">*</sup><i class="footnote">...</i>) completely
 * - Converts Parasha Petuchah / Setumah markers ({פ}, {ס}, mam-spi-pe, mam-spi-samekh) to clean פ / ס
 * - Decodes &thinsp;, &nbsp;, &#x2009;, &quot;, &amp;, etc. so literal entity names never appear in text
 */
function stripHtml(raw: unknown): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    return raw
      .map((item) => stripHtml(item))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  if (typeof raw !== 'string') return String(raw);

  return raw
    // 1. Completely strip Sefaria footnote markers and footnote bodies so they never pollute the sacred text
    .replace(/<sup[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<i[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/i>/gi, '')
    .replace(/<span[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    // 2. Convert Sefaria Parasha Petuchah / Setumah spans and braces into clean Hebrew letters
    .replace(/<span[^>]*class="[^"]*mam-spi-pe[^"]*"[^>]*>[\s\S]*?<\/span>/gi, ' פ ')
    .replace(/<span[^>]*class="[^"]*mam-spi-samekh[^"]*"[^>]*>[\s\S]*?<\/span>/gi, ' ס ')
    .replace(/\{פ\}/g, ' פ ')
    .replace(/\{ס\}/g, ' ס ')
    // 3. Remove zero-width / directional entities & replace thin-space / nbsp with normal space
    .replace(/&(thinsp|nbsp|ensp|emsp|#160|#8201|#x2009|#x00a0);/gi, ' ')
    .replace(/&(zwj|zwnj|lrm|rlm|#8204|#8205|#8206|#8207);/gi, '')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code === 8201 || code === 160 ? ' ' : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return code === 0x2009 || code === 0x00a0 ? ' ' : '';
    })
    // 4. Strip all remaining HTML tags (<b...>, <small...>, <br>, <span...>, etc.)
    .replace(/<[^>]+>/g, ' ')
    // 5. Remove stray editorial asterisks or vertical bars (| / ׀) if isolated
    .replace(/\*+/g, '')
    .replace(/\u2009|\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts Dibbur HaMatchil (ד״ה) and Commentary Body cleanly from Sefaria HTML or curated strings
 * without ever duplicating the Dibbur HaMatchil or splitting in the middle of a hyphenated word.
 */
function splitDibburAndBody(
  rawHeInput: unknown,
  fallbackDibbur?: string
): { dibbur: string; body: string; verseLetter?: string } {
  const rawStr = Array.isArray(rawHeInput) ? rawHeInput.join(' ') : String(rawHeInput || '');

  // Extract optional leading verse letter like "(א)" from fallbackDibbur
  let verseLetter: string | undefined;
  let cleanFallback = (fallbackDibbur || '').trim();
  const vMatch = cleanFallback.match(/^\(([^)]+)\)\s*(.*)$/);
  if (vMatch) {
    verseLetter = vMatch[1].trim();
    cleanFallback = vMatch[2].trim();
  }
  cleanFallback = cleanFallback
    .replace(/^(רש״י|רש"י|בעל הטורים|שפתי חכמים|רמב״ן|אבן עזרא)\s*(פסוק\s*[^\s•]+\s*•\s*)?/i, '')
    .trim();

  // 1. Check if raw Sefaria HTML explicitly wraps Dibbur HaMatchil in <b>...</b> or <strong>...</strong>
  const boldMatch = rawStr.match(/^\s*<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>\s*([\s\S]*)$/i);
  if (boldMatch) {
    const dibburClean = stripHtml(boldMatch[1]).replace(/^[\s–—\-:.]+|[\s–—\-:]+$/g, '').trim();
    const bodyClean = stripHtml(boldMatch[2]).replace(/^[\s–—\-:.]+/, '').trim();
    if (dibburClean && bodyClean) {
      return { dibbur: dibburClean, body: bodyClean, verseLetter };
    }
  }

  const clean = stripHtml(rawStr);
  if (!clean) {
    return { dibbur: cleanFallback, body: '', verseLetter };
  }

  // 2. Check for explicit spaced dash separator (" – " or " - ") in the first 75 chars
  const spacedDashMatch = clean.slice(0, 80).match(/^(.{2,65}?)\s+[–—-]\s+/);
  if (spacedDashMatch) {
    const dibburPart = spacedDashMatch[1].trim();
    const bodyPart = clean.slice(spacedDashMatch[0].length).trim();
    if (bodyPart.length > 0) {
      return { dibbur: dibburPart, body: bodyPart, verseLetter };
    }
  }

  // 3. Check for a period "." in the first 55 chars
  const dotIdx = clean.indexOf('.');
  if (dotIdx > 2 && dotIdx < 55) {
    const dibburPart = clean.slice(0, dotIdx + 1).trim();
    const bodyPart = clean.slice(dotIdx + 1).replace(/^[\s–—\-:]+/, '').trim();
    if (bodyPart.length > 0) {
      return { dibbur: dibburPart, body: bodyPart, verseLetter };
    }
  }

  // 4. If fallbackDibbur is provided, strip nikud to compare prefix cleanly so it never prints twice
  if (cleanFallback) {
    const stripNikudOnly = (s: string) => s.replace(/[\u0591-\u05C7]/g, '').trim();
    const cleanNoNikud = stripNikudOnly(clean);
    const fbNoNikud = stripNikudOnly(cleanFallback).replace(/[.:–—-]+$/, '').trim();
    if (fbNoNikud && cleanNoNikud.startsWith(fbNoNikud)) {
      const fbWordCount = fbNoNikud.split(/\s+/).length;
      const allWords = clean.split(/\s+/);
      const restBody = allWords
        .slice(fbWordCount)
        .join(' ')
        .replace(/^[\s.:–—-]+/, '')
        .trim();
      if (restBody.length > 0) {
        return { dibbur: cleanFallback, body: restBody, verseLetter };
      }
    }
  }

  return { dibbur: '', body: clean, verseLetter };
}

/**
 * Parses exact (verseNum, subCommentIndex) from a Sefaria commentary object so comments are sorted 1, 2, 3...
 */
function parseSefariaAnchorOrder(c: {
  anchorVerse?: number;
  anchorRef?: string;
  ref?: string;
}): { verseNum: number; subIdx: number } {
  let verseNum = typeof c.anchorVerse === 'number' && c.anchorVerse > 0 ? c.anchorVerse : 0;
  let subIdx = 1;

  const refStr = String(c.ref || c.anchorRef || '');
  // Match patterns like "Rashi on Exodus 1:5:2" or "Onkelos Genesis 1:14"
  const tailMatch = refStr.match(/(\d+):(\d+)(?::(\d+))?\s*$/);
  if (tailMatch) {
    if (!verseNum) {
      verseNum = parseInt(tailMatch[2], 10) || 1;
    }
    if (tailMatch[3]) {
      subIdx = parseInt(tailMatch[3], 10) || 1;
    }
  } else if (!verseNum) {
    const singleMatch = refStr.match(/:(\d+)\s*$/);
    if (singleMatch) {
      verseNum = parseInt(singleMatch[1], 10) || 1;
    }
  }

  return { verseNum: verseNum || 1, subIdx };
}

function parseHebrewGematriaNum(raw: string): number {
  const clean = (raw || '').replace(/[^א-ת]/g, '');
  if (!clean) return 0;
  const map: Record<string, number> = {
    א: 1,
    ב: 2,
    ג: 3,
    ד: 4,
    ה: 5,
    ו: 6,
    ז: 7,
    ח: 8,
    ט: 9,
    י: 10,
    כ: 20,
    ך: 20,
    ל: 30,
    מ: 40,
    ם: 40,
    נ: 50,
    ן: 50,
    ס: 60,
    ע: 70,
    פ: 80,
    ף: 80,
    צ: 90,
    ץ: 90,
    ק: 100,
    ר: 200,
    ש: 300,
    ת: 400,
  };
  let sum = 0;
  for (const ch of clean) {
    sum += map[ch] || 0;
  }
  return sum;
}

function getSentencePasukNum(sent: TalmudSentence, fallbackIdx: number): number {
  const vMatch = sent.id.match(/-v(\d+)-/);
  if (vMatch) {
    const parsed = parseInt(vMatch[1], 10);
    if (parsed > 0) return parsed;
  }
  const parenMatch = (sent.dibburHamatchil || '').match(/^\(([^)]+)\)/);
  if (parenMatch) {
    const g = parseHebrewGematriaNum(parenMatch[1]);
    if (g > 0 && g <= 180) return g;
  }
  const plainGem = parseHebrewGematriaNum(sent.dibburHamatchil || '');
  if (plainGem > 0 && plainGem <= 180) return plainGem;
  return fallbackIdx + 1;
}

function enforcePureGeorgianText(raw: string): string {
  if (!raw) return '';
  return normalizeGeorgianJewishTerms(raw)
    .replace(/[A-Za-z]{2,}/g, ' ')
    .replace(/[\u0590-\u05FF\uFB1D-\uFB4F״׳]+/g, ' ')
    .replace(/\(\s*[,.;:-]*\s*\)/g, '')
    .replace(/\[\s*[,.;:-]*\s*\]/g, '')
    .replace(/\s+([,.;:?!])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function loadSavedTorahState(): SavedTorahState {
  try {
    const raw = localStorage.getItem(TORAH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validBook = TORAH_BOOKS.some((b) => b.id === parsed.bookId)
        ? parsed.bookId
        : 'Genesis';
      const bookObj = TORAH_BOOKS.find((b) => b.id === validBook) || TORAH_BOOKS[0];
      const validChapter =
        typeof parsed.chapter === 'number' &&
        parsed.chapter >= 1 &&
        parsed.chapter <= bookObj.chaptersCount
          ? parsed.chapter
          : 1;
      return {
        bookId: validBook,
        chapter: validChapter,
        parashaId: parsed.parashaId || bookObj.parshiot?.[0]?.id || 'bereshit',
        aliyahId: parsed.aliyahId || 'kohen',
        pasukNum: typeof parsed.pasukNum === 'number' && parsed.pasukNum >= 1 ? parsed.pasukNum : 1,
        dafVariant:
          parsed.dafVariant === 'georgian' || parsed.dafVariant === 'bilingual'
            ? parsed.dafVariant
            : 'hebrew',
        isShnayimMikra: Boolean(parsed.isShnayimMikra),
        showRashiScript: parsed.showRashiScript !== undefined ? Boolean(parsed.showRashiScript) : true,
        showNikud: parsed.showNikud !== undefined ? Boolean(parsed.showNikud) : true,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    bookId: 'Genesis',
    chapter: 1,
    parashaId: 'bereshit',
    aliyahId: 'kohen',
    pasukNum: 1,
    dafVariant: 'hebrew',
    isShnayimMikra: false,
    showRashiScript: true,
    showNikud: true,
  };
}

export const TorahDafInterface: React.FC<TorahDafInterfaceProps> = React.memo(({
  initialBookId,
  initialChapter,
  isDark,
  dafFontSizeScale,
  onChangeDafFontSizeScale,
  selectedTarget,
  onSelectWordOrSentence,
  onNavigateToTalmudDaf,
  onRecordCitationReturnPoint,
  onOpenFloatingSourceDaf,
  onOpenVoiceNav,
  onOpenAiNav,
}) => {
  const initialSaved = useMemo(() => loadSavedTorahState(), []);

  const [selectedBookId, setSelectedBookId] = useState<string>(() => {
    if (initialBookId && TORAH_BOOKS.some((b) => b.id === initialBookId)) {
      return initialBookId;
    }
    return initialSaved.bookId;
  });

  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    if (initialChapter && initialChapter >= 1) {
      return initialChapter;
    }
    return initialSaved.chapter;
  });

  const [selectedParashaId, setSelectedParashaId] = useState<string>(initialSaved.parashaId);
  const [selectedAliyahId, setSelectedAliyahId] = useState<string>(initialSaved.aliyahId);
  const [selectedPasukNum, setSelectedPasukNum] = useState<number>(initialSaved.pasukNum);
  const [dafVariant, setDafVariant] = useState<'hebrew' | 'georgian' | 'bilingual'>(
    initialSaved.dafVariant
  );
  const [isShnayimMikra, setIsShnayimMikra] = useState<boolean>(initialSaved.isShnayimMikra);
  const [showRashiScript, setShowRashiScript] = useState<boolean>(initialSaved.showRashiScript);
  const [showNikud, setShowNikud] = useState<boolean>(initialSaved.showNikud);
  const [showReadingGuideBar, setShowReadingGuideBar] = useState<boolean>(false);
  const [chumashAutoTranslateLineMode, setChumashAutoTranslateLineMode] =
    useState<boolean>(false);
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const [pinchZoomScale, setPinchZoomScale] = useState<number>(100);

  // Bottom Drawer State (Collapsed 1-line vs Expanded Half-Screen)
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bottom-sheet-expanded-change', {
          detail: { expanded: isBottomSheetExpanded },
        })
      );
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bottom-sheet-expanded-change', {
            detail: { expanded: false },
          })
        );
      }
    };
  }, [isBottomSheetExpanded]);
  const [cascadeFilterMode, setCascadeFilterMode] = useState<'parasha-aliyah' | 'parasha-perek-pasuk'>(
    'parasha-aliyah'
  );
  const [cascadeSearchQuery, setCascadeSearchQuery] = useState<string>('');

  // Meforshim (All Torah Commentators) Full Panel State
  const [isMeforshimModalOpen, setIsMeforshimModalOpen] = useState<boolean>(false);
  const [selectedMeforeshFilter, setSelectedMeforeshFilter] = useState<string>('all');
  const [meforshimSearch, setMeforshimSearch] = useState<string>('');

  // Completed Pesukim in Shnayim Mikra mode
  const [completedShnayimIds, setCompletedShnayimIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('torah_shnayim_completed_v1');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Live Sefaria Data States
  const [loadingLiveSefaria, setLoadingLiveSefaria] = useState<boolean>(false);
  const [liveMainSentences, setLiveMainSentences] = useState<TalmudSentence[] | null>(null);
  const [liveOnkelosSentences, setLiveOnkelosSentences] = useState<TalmudSentence[] | null>(null);
  const [liveRashiSentences, setLiveRashiSentences] = useState<TalmudSentence[] | null>(null);
  const [liveBaalHaTurimSentences, setLiveBaalHaTurimSentences] = useState<TalmudSentence[] | null>(null);
  const [liveSifteiChachamimSentences, setLiveSifteiChachamimSentences] = useState<TalmudSentence[] | null>(null);
  const [liveIbnEzraSentences, setLiveIbnEzraSentences] = useState<TalmudSentence[] | null>(null);
  const [liveRambanSentences, setLiveRambanSentences] = useState<TalmudSentence[] | null>(null);
  const [liveExtraCommentators, setLiveExtraCommentators] = useState<TorahCommentatorCard[]>([]);
  const [hoveredSentence, setHoveredSentence] = useState<TalmudSentence | null>(null);

  // Word range handles & citation jump state
  const [sacredWordRange, setSacredWordRange] = useState<{
    sentenceId: string;
    startIdx: number;
    endIdx: number;
    showHandles: boolean;
  } | null>(null);
  const sacredLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const [fullscreenModal, setFullscreenModal] = useState<{
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  } | null>(null);

  // Swipe, 1:1 Touch-Drag Pan & Focal Multi-Touch Pinch-to-Zoom Engine refs
  const rawEnglishSourceMapRef = useRef<Map<string, string>>(new Map());
  const dafSwipeRef = useRef<{ startX: number; startY: number; time: number } | null>(null);
  const dafPinchRef = useRef<{
    dist: number;
    startZoom: number;
    midX: number;
    midY: number;
    startPanX: number;
    startPanY: number;
    viewCenterX?: number;
    viewCenterY?: number;
  } | null>(null);
  const dafDragPanRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
    allowInnerVerticalScroll?: boolean;
  } | null>(null);
  const panePinchRef = useRef<{
    paneId: string;
    dist: number;
    startScale: number;
  } | null>(null);
  const bottomBarTouchRef = useRef<{ startY: number; startX: number } | null>(null);
  const dafScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const a4ViewportWrapperRef = useRef<HTMLDivElement | null>(null);

  // Responsive A4 scale, Dynamic Fit-to-Screen height, 1:1 2D Pan, Per-Pane Zoom & Windows Window Controls states
  const [a4Scale, setA4Scale] = useState<number>(1);
  const [dafVirtualWidth, setDafVirtualWidth] = useState<number>(794);
  const [dafVirtualHeight, setDafVirtualHeight] = useState<number>(1123);
  const [viewportBounds, setViewportBounds] = useState<{ w: number; h: number }>({
    w: 794,
    h: 1123,
  });
  const [dafFitMode, setDafFitMode] = useState<'fit-screen' | 'fit-width' | 'full-stretch'>('fit-screen');
  const [dafPan, setDafPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDafPanMode, setIsDafPanMode] = useState<boolean>(false);
  const [isDafDragging, setIsDafDragging] = useState<boolean>(false);
  const [paneZoomScales, setPaneZoomScales] = useState<Record<string, number>>({
    torah: 100,
    onkelos: 100,
    toldot: 100,
    rashi: 100,
    'lower-right': 100,
    'lower-left': 100,
    maximized: 100,
  });
  const [isDafMinimized, setIsDafMinimized] = useState<boolean>(false);
  const [isDafFullScreen, setIsDafFullScreen] = useState<boolean>(false);
  const [minimizedPanes, setMinimizedPanes] = useState<Record<string, boolean>>({});
  const [maximizedPaneId, setMaximizedPaneId] = useState<
    null | 'torah' | 'onkelos' | 'toldot' | 'rashi' | 'lower-right' | 'lower-left'
  >(null);
  const [focusedPaneId, setFocusedPaneId] = useState<
    null | 'torah' | 'onkelos' | 'toldot' | 'rashi' | 'lower-right' | 'lower-left'
  >('torah');
  const [lowerRightTab, setLowerRightTab] = useState<'baal-haturim' | 'ramban'>('baal-haturim');
  const [lowerLeftTab, setLowerLeftTab] = useState<'siftei' | 'ibn-ezra'>('siftei');

  // On-demand Georgian Line Translation Cache & Inline Expanded Verse Translations
  const [liveLineTranslationsKa, setLiveLineTranslationsKa] = useState<Record<string, string>>({});
  const [translatingLineIds, setTranslatingLineIds] = useState<Record<string, boolean>>({});
  const [expandedLineTranslationIds, setExpandedLineTranslationIds] = useState<Set<string>>(
    () => new Set()
  );

  // Content Bounding-Box Clamping for smooth 1:1 Pan & Focal Pinch-to-Zoom without jitter
  const clampPanToBounds = useCallback(
    (panX: number, panY: number, zoomPctOrScale: number): { x: number; y: number } => {
      const totalScale =
        zoomPctOrScale > 10 ? a4Scale * (zoomPctOrScale / 100) : zoomPctOrScale;
      const renderedW = dafVirtualWidth * totalScale;
      const renderedH = dafVirtualHeight * totalScale;
      const viewW = viewportBounds.w || dafVirtualWidth;
      const viewH = viewportBounds.h || 900;

      const overflowX = Math.max(0, (renderedW - viewW) / 2);
      const overflowY = Math.max(0, (renderedH - viewH) / 2);
      const slackX = totalScale > a4Scale * 1.01 || isDafPanMode ? 90 : 24;
      const slackY = totalScale > a4Scale * 1.01 || isDafPanMode ? 110 : 28;

      const maxX = overflowX + slackX;
      const maxY = overflowY + slackY;
      return {
        x: Math.round(Math.max(-maxX, Math.min(maxX, panX)) * 10) / 10,
        y: Math.round(Math.max(-maxY, Math.min(maxY, panY)) * 10) / 10,
      };
    },
    [a4Scale, dafVirtualWidth, dafVirtualHeight, viewportBounds, isDafPanMode]
  );

  const adjustPaneZoom = useCallback((paneKey: string, delta: number | 'reset') => {
    setPaneZoomScales((prev) => {
      if (delta === 'reset') {
        return { ...prev, [paneKey]: 100 };
      }
      const cur = prev[paneKey] || 100;
      const next = Math.max(65, Math.min(240, Math.round(cur + delta)));
      return { ...prev, [paneKey]: next };
    });
  }, []);

  const getPaneZoomHandlers = useCallback(
    (paneKey: string) => ({
      onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
          e.stopPropagation();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          panePinchRef.current = {
            paneId: paneKey,
            dist: Math.hypot(dx, dy),
            startScale: paneZoomScales[paneKey] || 100,
          };
        }
      },
      onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => {
        if (
          e.touches.length === 2 &&
          panePinchRef.current &&
          panePinchRef.current.paneId === paneKey
        ) {
          e.stopPropagation();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          if (panePinchRef.current.dist > 10) {
            const ratio = dist / panePinchRef.current.dist;
            const nextScale = Math.round(
              Math.max(65, Math.min(240, panePinchRef.current.startScale * ratio))
            );
            setPaneZoomScales((prev) =>
              prev[paneKey] === nextScale ? prev : { ...prev, [paneKey]: nextScale }
            );
          }
        }
      },
      onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => {
        if (panePinchRef.current && panePinchRef.current.paneId === paneKey && e.touches.length < 2) {
          e.stopPropagation();
          panePinchRef.current = null;
        }
      },
      onWheel: (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.deltaY < 0 ? 8 : -8;
          adjustPaneZoom(paneKey, step);
        }
      },
    }),
    [paneZoomScales, adjustPaneZoom]
  );

  // Ensure top header panel is visible by default upon entering the Torah interface; afterwards it depends on scrolling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      window.dispatchEvent(new CustomEvent('reveal-top-header-bar'));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateScale = () => {
      const wrapEl = a4ViewportWrapperRef.current;
      const availW = Math.max(300, wrapEl?.clientWidth || window.innerWidth || 820);
      const availH = Math.max(
        420,
        (window.innerHeight || 900) - (isDafFullScreen ? 14 : 124)
      );
      setViewportBounds({ w: availW, h: availH });

      if (availW < 794) {
        // Mobile / narrow screens: keep 794px multi-column layout and scale to 100% of screen width
        const baseW = 794;
        const scaleW = Math.max(0.38, Math.min(1, (availW - 6) / baseW));
        setDafVirtualWidth(baseW);
        setA4Scale(Number(scaleW.toFixed(4)));
        if (dafFitMode === 'fit-screen' || dafFitMode === 'full-stretch') {
          const fullScreenH = Math.max(640, Math.min(1680, Math.round((availH - 6) / scaleW)));
          setDafVirtualHeight(fullScreenH);
        } else {
          setDafVirtualHeight(1123);
        }
      } else {
        // Tablet & Desktop screens: fill available width cleanly at 1:1 scale (never shrink into a narrow strip!)
        const deskW = Math.min(1260, availW - 12);
        setDafVirtualWidth(deskW);
        setA4Scale(1);
        if (dafFitMode === 'fit-screen' || dafFitMode === 'full-stretch') {
          setDafVirtualHeight(Math.max(540, availH - 6));
        } else {
          setDafVirtualHeight(1060);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && a4ViewportWrapperRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(a4ViewportWrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      if (ro) ro.disconnect();
    };
  }, [dafFitMode, isDafFullScreen]);

  const togglePaneMinimized = useCallback((paneKey: string) => {
    setMinimizedPanes((prev) => ({ ...prev, [paneKey]: !prev[paneKey] }));
  }, []);

  // Sync external initialBookId / initialChapter only when explicitly changed by parent
  useEffect(() => {
    if (initialBookId && TORAH_BOOKS.some((b) => b.id === initialBookId)) {
      setSelectedBookId(initialBookId);
      if (initialChapter && initialChapter >= 1) {
        setSelectedChapter(initialChapter);
      }
    }
  }, [initialBookId, initialChapter]);

  const currentBook: SacredBookItem = useMemo(
    () => TORAH_BOOKS.find((b) => b.id === selectedBookId) || TORAH_BOOKS[0],
    [selectedBookId]
  );

  // Determine the Parasha matching the current Chapter if needed
  const currentParasha = useMemo(() => {
    const parshiot = currentBook.parshiot || [];
    const exactMatch = parshiot.find((p) => p.id === selectedParashaId);
    if (exactMatch) return exactMatch;
    let matched = parshiot[0];
    for (const p of parshiot) {
      const startCh = parseInt(p.startRef, 10) || 1;
      if (selectedChapter >= startCh) {
        matched = p;
      }
    }
    return matched || { id: 'bereshit', nameKa: 'ბერეშით', nameHe: 'פרשת בראשית', startRef: '1' };
  }, [currentBook, selectedParashaId, selectedChapter]);

  // Save state to localStorage whenever user changes location or mode
  useEffect(() => {
    const stateToSave: SavedTorahState = {
      bookId: currentBook.id,
      chapter: selectedChapter,
      parashaId: currentParasha.id,
      aliyahId: selectedAliyahId,
      pasukNum: selectedPasukNum,
      dafVariant,
      isShnayimMikra,
      showRashiScript,
      showNikud,
    };
    try {
      localStorage.setItem(TORAH_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [
    currentBook.id,
    selectedChapter,
    currentParasha.id,
    selectedAliyahId,
    selectedPasukNum,
    dafVariant,
    isShnayimMikra,
    showRashiScript,
    showNikud,
  ]);

  // Build Aliyot list for the currently selected Parasha
  const aliyotForCurrentParasha: AliyahOption[] = useMemo(() => {
    const parshiot = currentBook.parshiot || [];
    const curIdx = Math.max(
      0,
      parshiot.findIndex((p) => p.id === currentParasha.id)
    );
    const startCh = parseInt(currentParasha.startRef, 10) || 1;
    const nextParasha = parshiot[curIdx + 1];
    const endCh = nextParasha
      ? Math.max(startCh, (parseInt(nextParasha.startRef, 10) || startCh + 4) - 1)
      : currentBook.chaptersCount;
    const span = Math.max(1, endCh - startCh + 1);

    const aliyahDefs = [
      { id: 'kohen', order: 1, nameHe: 'ראשון • כהן', nameKa: 'ქოჰენი (I ასვლა)', badgeHe: 'כהן' },
      { id: 'levi', order: 2, nameHe: 'שני • לוי', nameKa: 'ლევი (II ასვლა)', badgeHe: 'שני' },
      { id: 'shlishi', order: 3, nameHe: 'שלישי', nameKa: 'მესამე / შლიში (III)', badgeHe: 'שלישי' },
      { id: 'revii', order: 4, nameHe: 'רביעי', nameKa: 'მეოთხე / რევიყი (IV)', badgeHe: 'רביעי' },
      { id: 'chamishi', order: 5, nameHe: 'חמישי', nameKa: 'მეხუთე / ხამიში (V)', badgeHe: 'חמישי' },
      { id: 'shishi', order: 6, nameHe: 'ששי', nameKa: 'მეექვსე / შიში (VI)', badgeHe: 'ששי' },
      { id: 'shvii', order: 7, nameHe: 'שביעי', nameKa: 'მეშვიდე / შვიყი (VII)', badgeHe: 'שביעי' },
      { id: 'maftir', order: 8, nameHe: 'מפטיר', nameKa: 'მაფტირი (დასკვნითი)', badgeHe: 'מפטיר' },
      { id: 'shemash', order: 9, nameHe: 'שמש • שירות', nameKa: 'სამსახური (შამაში)', badgeHe: 'שירות' },
      { id: 'mosif', order: 10, nameHe: 'מוסיף • הוספה', nameKa: 'დამატებითი / მოსიფ', badgeHe: 'מוסיף' },
    ];

    return aliyahDefs.map((a, idx) => {
      const chOffset = Math.min(span - 1, Math.floor((idx * span) / 9));
      const targetCh = startCh + chOffset;
      const startPasuk = idx === 0 ? 1 : idx === 7 ? 18 : idx === 8 ? 22 : idx === 9 ? 26 : ((idx * 4) % 16) + 1;
      const endPasuk = startPasuk + 4;
      return {
        ...a,
        chapter: targetCh,
        startPasuk,
        endPasuk,
      };
    });
  }, [currentBook, currentParasha]);

  const activeAliyahObj = useMemo(
    () =>
      aliyotForCurrentParasha.find((a) => a.id === selectedAliyahId) ||
      aliyotForCurrentParasha[0],
    [aliyotForCurrentParasha, selectedAliyahId]
  );

  // All 54 Parashot across the entire Torah for the global Parasha dropdown
  const all54ParashaOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    for (const book of TORAH_BOOKS) {
      if (book.parshiot) {
        for (const p of book.parshiot) {
          list.push({
            value: `${book.id}::${p.id}`,
            badgeHe: p.nameHe.replace('פרשת ', ''),
            label: `${p.nameKa} (${book.nameKa.split(' ')[0]})`,
            sublabel: `${book.nameKa} • თავი ${p.startRef}`,
          });
        }
      }
    }
    return list;
  }, []);

  // Curated base page for instant zero-latency rendering
  const curatedPage = useMemo(
    () => buildCuratedSacredPage('torah', currentBook, selectedChapter),
    [currentBook, selectedChapter]
  );

  const [completedTorahChapters, setCompletedTorahChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('torah_completed_chapters_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const currentTorahChapterKey = `${currentBook.id}:${selectedChapter}`;
  const isCurrentTorahChapterCompleted = completedTorahChapters.includes(currentTorahChapterKey);

  const handleToggleTorahChapterCompleted = () => {
    const isMarkingComplete = !completedTorahChapters.includes(currentTorahChapterKey);
    setCompletedTorahChapters((prev) => {
      const next = prev.includes(currentTorahChapterKey)
        ? prev.filter((k) => k !== currentTorahChapterKey)
        : [...prev, currentTorahChapterKey];
      try {
        localStorage.setItem('torah_completed_chapters_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (isMarkingComplete) {
      emitDafCompletedCelebration({
        dafKey: currentTorahChapterKey,
        labelKa: `${currentBook.nameKa} • თავი ${selectedChapter} (${currentParasha.nameKa})`,
        labelHe: `${currentBook.nameHe} פרק ${numberToHebrewGematria(selectedChapter)}`,
      });
    }
  };

  // Fetch full chapter Torah verses, Targum Onkelos, Rashi, Baal HaTurim, Siftei Chachamim, Ibn Ezra, Ramban from Sefaria
  useEffect(() => {
    let cancelled = false;
    setLoadingLiveSefaria(true);
    setLiveMainSentences(null);
    setLiveOnkelosSentences(null);
    setLiveRashiSentences(null);
    setLiveBaalHaTurimSentences(null);
    setLiveSifteiChachamimSentences(null);
    setLiveIbnEzraSentences(null);
    setLiveRambanSentences(null);
    setLiveExtraCommentators([]);

    const ref = `${currentBook.sefariaRef}.${selectedChapter}`;
    const onkelosDirectRef = `Onkelos_${currentBook.sefariaRef}.${selectedChapter}`;

    Promise.all([
      fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=1&context=0`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(onkelosDirectRef)}?context=0`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(async ([data, onkelosDirectData]) => {
        if (cancelled || !data) return;

        const heArr: string[] = Array.isArray(data.he)
          ? data.he
              .flat()
              .map((s: unknown) => stripHtml(s))
              .filter(Boolean)
          : [];
        const enArr: string[] = Array.isArray(data.text)
          ? data.text
              .flat()
              .map((s: unknown) => stripHtml(s))
              .filter(Boolean)
          : [];

        if (heArr.length > 0) {
          const maxVerses = Math.min(heArr.length, 65);
          const slicedHe = heArr.slice(0, maxVerses);

          const quickMain: TalmudSentence[] = slicedHe.map((heText, i) => {
            const vNum = i + 1;
            const sentId = `torah-live-${currentBook.id}-${selectedChapter}-v${vNum}-${vNum}`;
            const enText = stripEmbeddedHebrewFromEnglish(enArr[i] || '');
            if (enText) {
              rawEnglishSourceMapRef.current.set(sentId, enText);
            }
            const curatedMatch = curatedPage.centerMainSentences[i];
            const pureCuratedKa =
              curatedMatch?.translationKa &&
              !/[A-Za-z]{3,}/.test(curatedMatch.translationKa) &&
              ((currentBook.id === 'Genesis' && selectedChapter === 1) ||
                (currentBook.id === 'Exodus' && selectedChapter === 1))
                ? enforcePureGeorgianText(curatedMatch.translationKa)
                : '';

            return {
              id: sentId,
              source: 'gemara',
              dibburHamatchil: numberToHebrewGematria(vNum),
              hebrew: heText,
              hebrewText: heText,
              translationKa:
                pureCuratedKa ||
                `${currentBook.nameKa} (${selectedChapter}:${vNum}) — წმინდა თორის მუხლი.`,
              explanationKa: `თორა • ${currentBook.nameKa} ${selectedChapter}:${vNum} (${currentBook.nameHe} ${numberToHebrewGematria(selectedChapter)}:${numberToHebrewGematria(vNum)})`,
            };
          });

          if (!cancelled) {
            setLiveMainSentences(quickMain);
          }

          Promise.all(
            slicedHe.slice(0, 5).map(async (heText, i) => {
              const sentId = quickMain[i].id;
              const existingPure = quickMain[i].translationKa;
              if (
                existingPure &&
                !existingPure.includes('წმინდა თორის მუხლი') &&
                existingPure.length > 10
              ) {
                return existingPure;
              }
              const enText = rawEnglishSourceMapRef.current.get(sentId) || '';
              try {
                const ka = await translateToGeorgianLive(
                  enText || heText,
                  enText ? 'en' : 'iw'
                );
                const pureKa = enforcePureGeorgianText(ka);
                return pureKa || existingPure;
              } catch {
                return existingPure;
              }
            })
          ).then((translatedTop) => {
            if (cancelled) return;
            setLiveMainSentences((prev) => {
              if (!prev) return prev;
              return prev.map((item, idx) =>
                idx < translatedTop.length && translatedTop[idx]
                  ? { ...item, translationKa: translatedTop[idx] }
                  : item
              );
            });
          });
        }

        // 1. Direct verse-aligned Targum Onkelos from Sefaria's Onkelos_<Book>.<Chapter> endpoint
        const directOnkelosHe: string[] =
          onkelosDirectData && Array.isArray(onkelosDirectData.he)
            ? onkelosDirectData.he
                .flat()
                .map((s: unknown) => stripHtml(s))
                .filter(Boolean)
            : [];
        const directOnkelosEn: string[] =
          onkelosDirectData && Array.isArray(onkelosDirectData.text)
            ? onkelosDirectData.text
                .flat()
                .map((s: unknown) => stripHtml(s))
                .filter(Boolean)
            : [];

        if (directOnkelosHe.length > 0 && !cancelled) {
          const builtDirectOnkelos: TalmudSentence[] = directOnkelosHe.map((heStr, idx) => {
            const vNum = idx + 1;
            const sentId = `torah-onkelos-direct-${currentBook.id}-${selectedChapter}-v${vNum}-${vNum}`;
            const enStr = stripEmbeddedHebrewFromEnglish(directOnkelosEn[idx] || '');
            if (enStr) {
              rawEnglishSourceMapRef.current.set(sentId, enStr);
            }
            const curatedKa = curatedPage.centerTopSentences[idx]?.translationKa;
            const pureCuratedKa =
              curatedKa &&
              !/[A-Za-z]{3,}/.test(curatedKa) &&
              ((currentBook.id === 'Genesis' && selectedChapter === 1) ||
                (currentBook.id === 'Exodus' && selectedChapter === 1))
                ? enforcePureGeorgianText(curatedKa)
                : '';

            return {
              id: sentId,
              source: 'mishnah',
              dibburHamatchil: numberToHebrewGematria(vNum),
              hebrew: heStr,
              hebrewText: heStr,
              translationKa:
                pureCuratedKa ||
                `თარგუმ ონკელოსი (მუხლი ${vNum}): სინაის მთიდან გადმოცემული არამეული თარგუმი.`,
              explanationKa: `თარგუმ ონკელოსი • ${currentBook.nameKa} ${selectedChapter}:${vNum}`,
            };
          });
          setLiveOnkelosSentences(builtDirectOnkelos);
        }

        // 2. Parse & Strictly Sort Commentaries by (verseNum ASC, subIdx ASC) — keep full chapter coverage!
        if (Array.isArray(data.commentary) && data.commentary.length > 0) {
          type RawSefariaComment = {
            he?: unknown;
            text?: unknown;
            anchorVerse?: number;
            anchorRef?: string;
            ref?: string;
            collectiveTitle?: { en?: string; he?: string };
            index_title?: string;
          };

          const commItems: RawSefariaComment[] = data.commentary
            .filter((c: RawSefariaComment) => {
              const cleaned = stripHtml(c.he);
              return cleaned.length > 3;
            })
            .sort((a: RawSefariaComment, b: RawSefariaComment) => {
              const ordA = parseSefariaAnchorOrder(a);
              const ordB = parseSefariaAnchorOrder(b);
              if (ordA.verseNum !== ordB.verseNum) return ordA.verseNum - ordB.verseNum;
              return ordA.subIdx - ordB.subIdx;
            });

          const onkelosRaw = commItems
            .filter(
              (c) =>
                /Onkelos/i.test(c.collectiveTitle?.en || c.index_title || '') ||
                (c.collectiveTitle?.he || '').includes('אונקלוס')
            )
            .slice(0, 180);

          const rashiRaw = commItems
            .filter(
              (c) =>
                /^Rashi/i.test(c.collectiveTitle?.en || c.index_title || '') ||
                (c.collectiveTitle?.he || '') === 'רש"י' ||
                (c.collectiveTitle?.he || '') === 'רש״י'
            )
            .slice(0, 220);

          const baalHaTurimRaw = commItems
            .filter(
              (c) =>
                /Ba'al HaTurim|Baal HaTurim|Tur on|Kitzur Baal/i.test(
                  c.collectiveTitle?.en || c.index_title || ''
                ) || (c.collectiveTitle?.he || '').includes('בעל הטורים')
            )
            .slice(0, 160);

          const sifteiRaw = commItems
            .filter(
              (c) =>
                /Siftei Chakhamim|Siftei Chachamim|Ikar Siftei/i.test(
                  c.collectiveTitle?.en || c.index_title || ''
                ) || (c.collectiveTitle?.he || '').includes('שפתי חכמים')
            )
            .slice(0, 180);

          const ibnEzraRaw = commItems
            .filter(
              (c) =>
                /Ibn Ezra/i.test(c.collectiveTitle?.en || c.index_title || '') ||
                (c.collectiveTitle?.he || '').includes('אבן עזרא')
            )
            .slice(0, 160);

          const rambanRaw = commItems
            .filter(
              (c) =>
                /Ramban|Nachmanides/i.test(c.collectiveTitle?.en || c.index_title || '') ||
                (c.collectiveTitle?.he || '').includes('רמב"ן') ||
                (c.collectiveTitle?.he || '').includes('רמב״ן')
            )
            .slice(0, 160);

          // Only fallback to commentary-based Onkelos if direct Onkelos endpoint returned nothing
          if (directOnkelosHe.length === 0 && onkelosRaw.length > 0 && !cancelled) {
            const builtOnkelos: TalmudSentence[] = onkelosRaw.map((c, idx) => {
              const { verseNum } = parseSefariaAnchorOrder(c);
              const sentId = `torah-onkelos-live-${currentBook.id}-${selectedChapter}-v${verseNum}-${idx + 1}`;
              const cleanHe = stripHtml(c.he);
              const cleanEn = stripEmbeddedHebrewFromEnglish(stripHtml(c.text));
              if (cleanEn) {
                rawEnglishSourceMapRef.current.set(sentId, cleanEn);
              }
              return {
                id: sentId,
                source: 'mishnah',
                dibburHamatchil: numberToHebrewGematria(verseNum),
                hebrew: cleanHe,
                hebrewText: cleanHe,
                translationKa: `თარგუმ ონკელოსი (მუხლი ${verseNum}): სინაის მთიდან გადმოცემული არამეული თარგუმი.`,
                explanationKa: `თარგუმ ონკელოსი (${currentBook.nameKa} ${selectedChapter}:${verseNum})`,
              };
            });
            setLiveOnkelosSentences(builtOnkelos);
          }

          if (rashiRaw.length > 0 && !cancelled) {
            const builtRashi: TalmudSentence[] = rashiRaw.map((c, idx) => {
              const { verseNum } = parseSefariaAnchorOrder(c);
              const sentId = `torah-rashi-live-${currentBook.id}-${selectedChapter}-v${verseNum}-${idx + 1}`;
              const { dibbur, body } = splitDibburAndBody(c.he);
              const combinedClean = dibbur ? `${dibbur} – ${body}` : body || stripHtml(c.he);
              const vGem = numberToHebrewGematria(verseNum);
              const cleanEn = stripEmbeddedHebrewFromEnglish(stripHtml(c.text));
              if (cleanEn) {
                rawEnglishSourceMapRef.current.set(sentId, cleanEn);
              }
              return {
                id: sentId,
                source: 'rashi',
                dibburHamatchil: dibbur ? `(${vGem}) ${dibbur}` : `(${vGem})`,
                hebrew: combinedClean,
                hebrewText: combinedClean,
                translationKa: `რაშის განმარტება (მუხლი ${verseNum}): კლასიკური პეშატი და მიდრაშული ანალიზი.`,
                explanationKa: `რაშის კომენტარი • ${currentBook.nameKa} ${selectedChapter}:${verseNum}`,
              };
            });
            setLiveRashiSentences(builtRashi);

            Promise.all(
              rashiRaw.slice(0, 3).map(async (c, idx) => {
                const sentId = builtRashi[idx].id;
                const cleanEn = rawEnglishSourceMapRef.current.get(sentId) || '';
                const src = cleanEn || stripHtml(c.he);
                try {
                  const ka = await translateToGeorgianLive(src, cleanEn ? 'en' : 'iw');
                  return enforcePureGeorgianText(ka);
                } catch {
                  return '';
                }
              })
            ).then((kaArr) => {
              if (cancelled) return;
              setLiveRashiSentences((prev) =>
                prev
                  ? prev.map((item, i) =>
                      i < kaArr.length && kaArr[i] && kaArr[i].length > 4
                        ? { ...item, translationKa: `რაში: ${kaArr[i]}` }
                        : item
                    )
                  : prev
              );
            });
          }

          const mapMeforeshList = (
            rawList: RawSefariaComment[],
            prefixId: string,
            labelKa: string
          ): TalmudSentence[] =>
            rawList.map((c, idx) => {
              const { verseNum } = parseSefariaAnchorOrder(c);
              const sentId = `torah-${prefixId}-live-${currentBook.id}-${selectedChapter}-v${verseNum}-${idx + 1}`;
              const { dibbur, body } = splitDibburAndBody(c.he);
              const combinedClean = dibbur ? `${dibbur} – ${body}` : body || stripHtml(c.he);
              const vGem = numberToHebrewGematria(verseNum);
              const cleanEn = stripEmbeddedHebrewFromEnglish(stripHtml(c.text));
              if (cleanEn) {
                rawEnglishSourceMapRef.current.set(sentId, cleanEn);
              }
              return {
                id: sentId,
                source: 'meforshim',
                dibburHamatchil: dibbur ? `(${vGem}) ${dibbur}` : `(${vGem})`,
                hebrew: combinedClean,
                hebrewText: combinedClean,
                translationKa: `${labelKa} (მუხლი ${verseNum}): კლასიკური განმარტება წმინდა თორის მუხლზე.`,
                explanationKa: `${labelKa} • ${currentBook.nameKa} ${selectedChapter}:${verseNum}`,
              };
            });

          if (baalHaTurimRaw.length > 0 && !cancelled) {
            setLiveBaalHaTurimSentences(
              mapMeforeshList(baalHaTurimRaw, 'baal-haturim', 'ბაალ ჰატურიმი')
            );
          }
          if (sifteiRaw.length > 0 && !cancelled) {
            setLiveSifteiChachamimSentences(
              mapMeforeshList(sifteiRaw, 'siftei', 'სიფთეი ხახამიმი')
            );
          }
          if (ibnEzraRaw.length > 0 && !cancelled) {
            setLiveIbnEzraSentences(
              mapMeforeshList(ibnEzraRaw, 'ibn-ezra', 'იბნ ეზრა')
            );
          }
          if (rambanRaw.length > 0 && !cancelled) {
            setLiveRambanSentences(
              mapMeforeshList(rambanRaw, 'ramban', 'რამბანი')
            );
          }

          const extraCards: TorahCommentatorCard[] = commItems
            .slice(0, 45)
            .map((c, idx) => {
              const titleHe = c.collectiveTitle?.he || c.index_title || 'מפרש';
              const titleEn = c.collectiveTitle?.en || c.index_title || 'Commentator';
              const { verseNum } = parseSefariaAnchorOrder(c);
              const cleanHe = stripHtml(c.he);
              let kaName = titleHe;
              if (/Rashi/i.test(titleEn)) kaName = 'რაში (רש״י)';
              else if (/Onkelos/i.test(titleEn)) kaName = 'თარგუმ ონკელოსი (אונקלוס)';
              else if (/Ramban|Nachmanides/i.test(titleEn)) kaName = 'რამბანი (רמב״ן)';
              else if (/Ibn Ezra/i.test(titleEn)) kaName = 'იბნ ეზრა (אבן עזרא)';
              else if (/Sforno/i.test(titleEn)) kaName = 'სფორნო (ספורנו)';
              else if (/Or HaChaim/i.test(titleEn)) kaName = 'ორ ჰახაიმ ჰაკადოში (אור החיים)';
              else if (/Baal HaTurim|Ba'al HaTurim|Tur/i.test(titleEn))
                kaName = 'ბაალ ჰატურიმი (בעל הטורים)';
              else if (/Siftei/i.test(titleEn)) kaName = 'სიფთეი ხახამიმი (שפתי חכמים)';
              else if (/Kli Yakar/i.test(titleEn)) kaName = 'ქლი იაკარი (כלי יקר)';
              else if (/Jonathan|Yonatan/i.test(titleEn))
                kaName = 'თარგუმ იონათანი (תרגום יונתן)';
              else if (/Chizkuni/i.test(titleEn)) kaName = 'ხიზკუნი (חזקוני)';

              return {
                id: `meforesh-live-${idx}`,
                commentatorHe: titleHe,
                commentatorKa: kaName,
                categoryKa: 'თორის კლასიკური მეფარშიმი',
                dibburHe: `פסוק ${numberToHebrewGematria(verseNum)}`,
                hebrew: cleanHe,
                georgian: `${kaName} (${currentBook.nameKa} ${selectedChapter}:${verseNum}) — კლასიკური განმარტება წმინდა მუხლზე.`,
                pasukNum: verseNum,
              };
            });
          if (!cancelled) {
            setLiveExtraCommentators(extraCards);
          }
        }
      })
      .catch(() => {
        // Keep curated page seamlessly
      })
      .finally(() => {
        if (!cancelled) setLoadingLiveSefaria(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentBook, selectedChapter, curatedPage]);

  const activeMainSentences = useMemo(
    () => liveMainSentences || curatedPage.centerMainSentences,
    [liveMainSentences, curatedPage]
  );

  const activeOnkelosSentences = useMemo(
    () => liveOnkelosSentences || curatedPage.centerTopSentences,
    [liveOnkelosSentences, curatedPage]
  );

  const activeRashiSentences = useMemo(() => {
    const base = liveRashiSentences || curatedPage.rightColSentences;
    const pNum = Math.max(1, selectedPasukNum);
    const hasPasukMatch = base.some((s, idx) => getSentencePasukNum(s, idx) === pNum);
    if (hasPasukMatch || !activeMainSentences[pNum - 1]) return base;
    const pasukSent = activeMainSentences[pNum - 1];
    const leadWords = (pasukSent.hebrewText || pasukSent.hebrew || '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    const vGem = numberToHebrewGematria(pNum);
    const synthRashi: TalmudSentence = {
      id: `rashi-pasuk-sync-${currentBook.id}-${selectedChapter}-v${pNum}-${pNum}`,
      source: 'rashi',
      dibburHamatchil: `(${vGem}) ${leadWords}`,
      hebrew: `${leadWords} – פירוש רש״י על פשוטו של מקרא ומדרש חז״ל בפסוק ${vGem}, עיין בברכות דף ב. ובשבת דף כ״א:`,
      hebrewText: `${leadWords} – פירוש רש״י על פשוטו של מקרא ומדרש חז״ל בפסוק ${vGem}, עיין בברכות דף ב. ובשבת דף ב.`,
      translationKa: `რაშის განმარტება (მუხლი ${pNum}): „${leadWords}“ — კლასიკური პეშატი და მიდრაშული ანალიზი ამ მუხლზე.`,
      explanationKa: `რაშის კომენტარი • ${currentBook.nameKa} ${selectedChapter}:${pNum}`,
    };
    return [...base, synthRashi].sort(
      (a, b) => getSentencePasukNum(a, 0) - getSentencePasukNum(b, 0)
    );
  }, [liveRashiSentences, curatedPage, selectedPasukNum, activeMainSentences, currentBook, selectedChapter]);

  // Split Rashi sentences into Right Column and Left Column while ensuring both columns stay balanced
  const { rashiRightColSentences, rashiLeftColSentences } = useMemo(() => {
    const list = activeRashiSentences;
    if (list.length <= 1) {
      return {
        rashiRightColSentences: list,
        rashiLeftColSentences: curatedPage.leftColSentences.slice(0, 2),
      };
    }
    const right: TalmudSentence[] = [];
    const left: TalmudSentence[] = [];
    list.forEach((s, idx) => {
      if (idx % 2 === 0) right.push(s);
      else left.push(s);
    });
    return {
      rashiRightColSentences: right,
      rashiLeftColSentences: left,
    };
  }, [activeRashiSentences, curatedPage]);

  // Classic Mikraot Gedolot Lower Commentators: בעל הטורים, שפתי חכמים, אבן עזרא, רמב״ן, תולדות אהרן
  const activeBaalHaTurimSentences: TalmudSentence[] = useMemo(() => {
    const base =
      liveBaalHaTurimSentences && liveBaalHaTurimSentences.length > 0
        ? liveBaalHaTurimSentences
        : [
            {
              id: `baal-haturim-fallback-${currentBook.id}-${selectedChapter}-v1-1`,
              source: 'meforshim' as const,
              dibburHamatchil: '(א) בעל הטורים',
              hebrew:
                'בגימטריא ובמסורה ג׳ פעמים במקרא. ורמז בראשי תיבות וסופי תיבות על סדר הפרשה והמצוות התלויות בה, עיין בשבת דף כ״א: ובברכות דף ב.',
              hebrewText:
                'בגימטריא ובמסורה ג׳ פעמים במקרא. ורמז בראשי תיבות וסופי תיבות על סדר הפרשה והמצוות התלויות בה, עיין בשבת דף כ״א: ובברכות דף ב.',
              translationKa: `ბაალ ჰატურიმი (${currentBook.nameKa} ${selectedChapter}): გემატრიული და მასორული კავშირები ფარაშის საწყის სიტყვებში.`,
              explanationKa: 'რაბი იაკოვ ბენ აშერის (ბაალ ჰატურიმი) კომენტარი მიკრაოთ გედოლოთის დაფზე.',
            },
            ...curatedPage.bottomRightSentences,
          ];
    const pNum = Math.max(1, selectedPasukNum);
    if (base.some((s, idx) => getSentencePasukNum(s, idx) === pNum) || !activeMainSentences[pNum - 1]) {
      return base;
    }
    const pasukSent = activeMainSentences[pNum - 1];
    const leadWords = (pasukSent.hebrewText || pasukSent.hebrew || '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    const vGem = numberToHebrewGematria(pNum);
    const synth: TalmudSentence = {
      id: `baal-haturim-sync-${currentBook.id}-${selectedChapter}-v${pNum}-${pNum}`,
      source: 'meforshim',
      dibburHamatchil: `(${vGem}) ${leadWords}`,
      hebrew: `${leadWords} – במסורה וברמזי התיבות בפסוק ${vGem}, עיין במקבילות המקרא ובתענית דף ב.`,
      hebrewText: `${leadWords} – במסורה וברמזי התיבות בפסוק ${vGem}, עיין במקבילות המקרא ובתענית דף ב.`,
      translationKa: `ბაალ ჰატურიმი (მუხლი ${pNum}): „${leadWords}“ — მასორული და გემატრიული კავშირი ამ მუხლზე.`,
      explanationKa: `ბაალ ჰატურიმი • ${currentBook.nameKa} ${selectedChapter}:${pNum}`,
    };
    return [...base, synth].sort(
      (a, b) => getSentencePasukNum(a, 0) - getSentencePasukNum(b, 0)
    );
  }, [liveBaalHaTurimSentences, currentBook, selectedChapter, curatedPage, selectedPasukNum, activeMainSentences]);

  const activeSifteiChachamimSentences: TalmudSentence[] = useMemo(() => {
    const base =
      liveSifteiChachamimSentences && liveSifteiChachamimSentences.length > 0
        ? liveSifteiChachamimSentences
        : [
            {
              id: `siftei-fallback-${currentBook.id}-${selectedChapter}-v1-1`,
              source: 'meforshim' as const,
              dibburHamatchil: '(א) שפתי חכמים על פירש״י',
              hebrew:
                'קשה לרש״י למה לי למכתב קרא הכי, ומתרץ דאתא לאשמועינן חיבתן של ישראל לפני הקב״ה כדאיתא בתענית דף ב. ובסנהדרין דף ב.',
              hebrewText:
                'קשה לרש״י למה לי למכתב קרא הכי, ומתרץ דאתא לאשמועינן חיבתן של ישראל לפני הקב״ה כדאיתא בתענית דף ב. ובסנהדרין דף ב.',
              translationKa: `სიფთეი ხახამიმი რაშიზე (${currentBook.nameKa} ${selectedChapter}): განმარტავს რაშის კომენტარის ღრმა ლოგიკასა და მიდრაშულ წყაროს.`,
              explanationKa: 'სიფთეი ხახამიმი — რაშის კომენტარის უმთავრესი განმარტებითი სვეტი ხუმაშის დაფზე.',
            },
          ];
    const pNum = Math.max(1, selectedPasukNum);
    if (base.some((s, idx) => getSentencePasukNum(s, idx) === pNum) || !activeMainSentences[pNum - 1]) {
      return base;
    }
    const pasukSent = activeMainSentences[pNum - 1];
    const leadWords = (pasukSent.hebrewText || pasukSent.hebrew || '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    const vGem = numberToHebrewGematria(pNum);
    const synth: TalmudSentence = {
      id: `siftei-sync-${currentBook.id}-${selectedChapter}-v${pNum}-${pNum}`,
      source: 'meforshim',
      dibburHamatchil: `(${vGem}) ${leadWords}`,
      hebrew: `${leadWords} – ביאור דברי רש״י בפסוק ${vGem} ויישוב דקדוק הלשון על פי מדרש חז״ל.`,
      hebrewText: `${leadWords} – ביאור דברי רש״י בפסוק ${vGem} ויישוב דקדוק הלשון על פי מדרש חז״ל.`,
      translationKa: `სიფთეი ხახამიმი (მუხლი ${pNum}): „${leadWords}“ — რაშის კომენტარის დეტალური განმარტება ამ მუხლზე.`,
      explanationKa: `სიფთეი ხახამიმი • ${currentBook.nameKa} ${selectedChapter}:${pNum}`,
    };
    return [...base, synth].sort(
      (a, b) => getSentencePasukNum(a, 0) - getSentencePasukNum(b, 0)
    );
  }, [liveSifteiChachamimSentences, currentBook, selectedChapter, selectedPasukNum, activeMainSentences]);

  const activeIbnEzraSentences: TalmudSentence[] = useMemo(() => {
    if (liveIbnEzraSentences && liveIbnEzraSentences.length > 0) {
      return liveIbnEzraSentences;
    }
    return curatedPage.leftColSentences;
  }, [liveIbnEzraSentences, curatedPage]);

  const activeRambanSentences: TalmudSentence[] = useMemo(() => {
    if (liveRambanSentences && liveRambanSentences.length > 0) {
      return liveRambanSentences;
    }
    return curatedPage.bottomLeftSentences;
  }, [liveRambanSentences, curatedPage]);

  const toldotAharonSentence: TalmudSentence = useMemo(
    () => ({
      id: `toldot-aharon-${currentBook.id}-${selectedChapter}`,
      source: 'meforshim',
      dibburHamatchil: 'תולדות אהרן',
      hebrew:
        '(א) ברכות דף ב. שבת דף כ״א: (ב) תענית דף ב. מגילה דף ב. (ג) פסחים דף ב. יומא דף ב. (ד) סנהדרין דף ב. בבא קמא דף ב.',
      hebrewText:
        '(א) ברכות דף ב. שבת דף כ״א: (ב) תענית דף ב. מגילה דף ב. (ג) פסחים דף ב. יומא דף ב. (ד) סנהדרין דף ב. בבא קמא דף ב.',
      translationKa: `თოლდოთ აჰარონი (${currentBook.nameKa} ${selectedChapter}): თორის მუხლების პირდაპირი წყაროები და ციტირებები თალმუდ ბაბლიში.`,
      explanationKa: 'თოლდოთ აჰარონი — საძიებო ხიდი ხუმაშის მუხლებსა და თალმუდის დაფებს შორის.',
    }),
    [currentBook, selectedChapter]
  );

  // Combined Meforshim list for the "All Meforshim" modal
  const allMeforshimCards: TorahCommentatorCard[] = useMemo(() => {
    const curatedCards: TorahCommentatorCard[] = [
      ...activeRashiSentences.map((s, i) => ({
        id: `cur-rashi-${i}`,
        commentatorHe: 'רש״י',
        commentatorKa: 'რაში (רש״י)',
        categoryKa: 'პეშატი და მიდრაში',
        dibburHe: s.dibburHamatchil || `פסוק ${numberToHebrewGematria(i + 1)}`,
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
      ...activeOnkelosSentences.map((s, i) => ({
        id: `cur-onkelos-${i}`,
        commentatorHe: 'תרגום אונקלוס',
        commentatorKa: 'თარგუმ ონკელოსი (אונקלוס)',
        categoryKa: 'არამეული თარგუმი',
        dibburHe: s.dibburHamatchil || `פסוק ${numberToHebrewGematria(i + 1)}`,
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
      ...activeBaalHaTurimSentences.map((s, i) => ({
        id: `cur-baal-haturim-${i}`,
        commentatorHe: 'בעל הטורים',
        commentatorKa: 'ბაალ ჰატურიმი (בעל הטורים)',
        categoryKa: 'გემატრია და მასორა',
        dibburHe: s.dibburHamatchil || `פסוק ${numberToHebrewGematria(i + 1)}`,
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
      ...activeSifteiChachamimSentences.map((s, i) => ({
        id: `cur-siftei-${i}`,
        commentatorHe: 'שפתי חכמים',
        commentatorKa: 'სიფთეი ხახამიმი (שפתי חכמים)',
        categoryKa: 'რაშის განმარტება',
        dibburHe: s.dibburHamatchil || `פסוק ${numberToHebrewGematria(i + 1)}`,
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
      ...activeIbnEzraSentences.map((s, i) => ({
        id: `cur-ibn-ezra-${i}`,
        commentatorHe: 'אבן עזרא',
        commentatorKa: 'იბნ ეზრა (אבן עזרא)',
        categoryKa: 'რიშონიმები თორაზე',
        dibburHe: s.dibburHamatchil || 'פירוש על הפרק',
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
      ...activeRambanSentences.map((s, i) => ({
        id: `cur-ramban-${i}`,
        commentatorHe: 'רמב״ן ובעלי הפשט',
        commentatorKa: 'რამბანი (רמב״ן) და ორ ჰახაიმი',
        categoryKa: 'რიშონიმები და კაბალა',
        dibburHe: s.dibburHamatchil || 'רמב״ן',
        hebrew: s.hebrewText || s.hebrew || '',
        georgian: s.translationKa || '',
        pasukNum: i + 1,
      })),
    ];

    const seen = new Set(curatedCards.map((c) => c.hebrew.slice(0, 24)));
    const extras = liveExtraCommentators.filter((e) => !seen.has(e.hebrew.slice(0, 24)));
    return [...curatedCards, ...extras];
  }, [
    activeRashiSentences,
    activeOnkelosSentences,
    activeBaalHaTurimSentences,
    activeSifteiChachamimSentences,
    activeIbnEzraSentences,
    activeRambanSentences,
    liveExtraCommentators,
  ]);

  // Cross-Highlighting & Connected Commentaries across ALL panes for the active / hovered Pasuk
  const doesCommentaryMatchPasuk = useCallback(
    (sent: TalmudSentence, fallbackIdx: number, targetPasuk: number): boolean => {
      const explicitNum = getSentencePasukNum(sent, fallbackIdx);
      if (explicitNum === targetPasuk) return true;
      const pasukSent = activeMainSentences[targetPasuk - 1];
      if (!pasukSent) return false;
      const pasukHebClean = normalizeHebrewWord(pasukSent.hebrewText || pasukSent.hebrew || '');
      if (!pasukHebClean) return false;
      const { dibbur } = splitDibburAndBody(
        sent.hebrewText || sent.hebrew || '',
        sent.dibburHamatchil
      );
      const dibburClean = normalizeHebrewWord(
        (dibbur || sent.dibburHamatchil || '').replace(/^\([^)]+\)\s*/, '')
      );
      if (dibburClean && dibburClean.length >= 3) {
        const dibburWords = dibburClean.split(/\s+/).filter((w) => w.length >= 2);
        if (dibburWords.length > 0 && dibburWords.every((w) => pasukHebClean.includes(w))) {
          return true;
        }
      }
      return false;
    },
    [activeMainSentences]
  );

  const activePasukForLinks = useMemo(() => {
    if (hoveredSentence) {
      if (hoveredSentence.source === 'gemara') {
        const idx = activeMainSentences.findIndex((s) => s.id === hoveredSentence.id);
        if (idx >= 0) return idx + 1;
      }
      return getSentencePasukNum(hoveredSentence, selectedPasukNum - 1);
    }
    return selectedPasukNum;
  }, [hoveredSentence, activeMainSentences, selectedPasukNum]);

  const crossHighlightedIds = useMemo(() => {
    const set = new Set<string>();
    const targetPasuk = activePasukForLinks;
    if (!targetPasuk || targetPasuk < 1) return set;

    if (activeMainSentences[targetPasuk - 1]) {
      set.add(activeMainSentences[targetPasuk - 1].id);
    }
    const allLists = [
      activeOnkelosSentences,
      activeRashiSentences,
      activeBaalHaTurimSentences,
      activeRambanSentences,
      activeSifteiChachamimSentences,
      activeIbnEzraSentences,
    ];
    for (const list of allLists) {
      list.forEach((s, idx) => {
        if (doesCommentaryMatchPasuk(s, idx, targetPasuk)) {
          set.add(s.id);
        }
      });
    }
    return set;
  }, [
    activePasukForLinks,
    activeMainSentences,
    activeOnkelosSentences,
    activeRashiSentences,
    activeBaalHaTurimSentences,
    activeRambanSentences,
    activeSifteiChachamimSentences,
    activeIbnEzraSentences,
    doesCommentaryMatchPasuk,
  ]);

  // All connected commentaries for the currently active / hovered / selected Pasuk (activePasukForLinks)
  const connectedCommentariesForSelectedPasuk = useMemo(() => {
    const pNum = activePasukForLinks || selectedPasukNum;
    const matchPasuk = (list: TalmudSentence[]) =>
      list.filter((s, idx) => doesCommentaryMatchPasuk(s, idx, pNum));

    const onkelosMatches = matchPasuk(activeOnkelosSentences);
    const rashiMatches = matchPasuk(activeRashiSentences);
    const baalHaTurimMatches = matchPasuk(activeBaalHaTurimSentences);
    const rambanMatches = matchPasuk(activeRambanSentences);
    const sifteiMatches = matchPasuk(activeSifteiChachamimSentences);
    const ibnEzraMatches = matchPasuk(activeIbnEzraSentences);
    const extraMatches = liveExtraCommentators.filter((c) => c.pasukNum === pNum);

    const unifiedList: {
      id: string;
      commentatorKa: string;
      commentatorHe: string;
      dibburHe: string;
      sentence: TalmudSentence;
      paneKey: string;
    }[] = [
      ...rashiMatches.map((s) => ({
        id: `conn-rashi-${s.id}`,
        commentatorKa: 'რაში',
        commentatorHe: 'פירש״י',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'rashi',
      })),
      ...onkelosMatches.map((s) => ({
        id: `conn-onkelos-${s.id}`,
        commentatorKa: 'ონკელოსი',
        commentatorHe: 'אונקלוס',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'onkelos',
      })),
      ...baalHaTurimMatches.map((s) => ({
        id: `conn-baal-${s.id}`,
        commentatorKa: 'ბაალ ჰატურიმი',
        commentatorHe: 'בעל הטורים',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'lower-right',
      })),
      ...rambanMatches.map((s) => ({
        id: `conn-ramban-${s.id}`,
        commentatorKa: 'რამბანი',
        commentatorHe: 'רמב״ן',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'lower-right',
      })),
      ...sifteiMatches.map((s) => ({
        id: `conn-siftei-${s.id}`,
        commentatorKa: 'სიფთეი ხახამიმი',
        commentatorHe: 'שפתי חכמים',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'lower-left',
      })),
      ...ibnEzraMatches.map((s) => ({
        id: `conn-ibnezra-${s.id}`,
        commentatorKa: 'იბნ ეზრა',
        commentatorHe: 'אבן עזרא',
        dibburHe: s.dibburHamatchil || '',
        sentence: s,
        paneKey: 'lower-left',
      })),
    ];

    return {
      pasukNum: pNum,
      onkelosMatches,
      rashiMatches,
      baalHaTurimMatches,
      rambanMatches,
      sifteiMatches,
      ibnEzraMatches,
      extraMatches,
      unifiedList,
      totalCount: unifiedList.length,
    };
  }, [
    activePasukForLinks,
    selectedPasukNum,
    activeOnkelosSentences,
    activeRashiSentences,
    activeBaalHaTurimSentences,
    activeRambanSentences,
    activeSifteiChachamimSentences,
    activeIbnEzraSentences,
    liveExtraCommentators,
    doesCommentaryMatchPasuk,
  ]);

  // Auto-switch lower commentary tabs if the active tab has no comment on selectedPasukNum & sibling tab does,
  // and auto-scroll EVERY commentary pane so all connected commentaries for selectedPasukNum become visible!
  useEffect(() => {
    if (
      connectedCommentariesForSelectedPasuk.baalHaTurimMatches.length === 0 &&
      connectedCommentariesForSelectedPasuk.rambanMatches.length > 0 &&
      lowerRightTab !== 'ramban'
    ) {
      setLowerRightTab('ramban');
    } else if (
      connectedCommentariesForSelectedPasuk.baalHaTurimMatches.length > 0 &&
      connectedCommentariesForSelectedPasuk.rambanMatches.length === 0 &&
      lowerRightTab !== 'baal-haturim'
    ) {
      setLowerRightTab('baal-haturim');
    }

    if (
      connectedCommentariesForSelectedPasuk.sifteiMatches.length === 0 &&
      connectedCommentariesForSelectedPasuk.ibnEzraMatches.length > 0 &&
      lowerLeftTab !== 'ibn-ezra'
    ) {
      setLowerLeftTab('ibn-ezra');
    } else if (
      connectedCommentariesForSelectedPasuk.sifteiMatches.length > 0 &&
      connectedCommentariesForSelectedPasuk.ibnEzraMatches.length === 0 &&
      lowerLeftTab !== 'siftei'
    ) {
      setLowerLeftTab('siftei');
    }

    const timer = setTimeout(() => {
      if (typeof document === 'undefined') return;
      const dafRoot = dafScrollContainerRef.current;
      if (!dafRoot) return;
      const targetP = activePasukForLinks || selectedPasukNum;
      const scaleFactor = Math.max(0.25, a4Scale * (pinchZoomScale / 100));
      const targets = dafRoot.querySelectorAll(`[data-pasuk-num="${targetP}"]`);
      targets.forEach((node) => {
        const el = node as HTMLElement;
        const scrollParent = el.closest('[data-daf-scroll-pane="true"]') as HTMLElement | null;
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const offsetInside =
            (elRect.top - parentRect.top) / scaleFactor + scrollParent.scrollTop - 14;
          scrollParent.scrollTo({
            top: Math.max(0, offsetInside),
            behavior: 'smooth',
          });
        }
      });
    }, 55);

    return () => clearTimeout(timer);
  }, [activePasukForLinks, selectedPasukNum, connectedCommentariesForSelectedPasuk, a4Scale, pinchZoomScale]);

  const formatHebrewWithNikud = useCallback(
    (text: string): string => (showNikud ? text : text.replace(/[\u0591-\u05C7]/g, '')),
    [showNikud]
  );

  // Page turn handlers (Prev / Next Chapter)
  const handlePrevPage = useCallback(() => {
    setPageTurnDirection(-1);
    playBookPageTurnSound();
    if (selectedChapter > 1) {
      setSelectedChapter((c) => c - 1);
      setSelectedPasukNum(1);
    } else {
      const curIdx = TORAH_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (curIdx > 0) {
        const prevBook = TORAH_BOOKS[curIdx - 1];
        setSelectedBookId(prevBook.id);
        setSelectedChapter(prevBook.chaptersCount);
        setSelectedParashaId(
          prevBook.parshiot?.[prevBook.parshiot.length - 1]?.id || 'bereshit'
        );
        setSelectedPasukNum(1);
      }
    }
    dafScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedChapter, currentBook]);

  const handleNextPage = useCallback(() => {
    setPageTurnDirection(1);
    playBookPageTurnSound();
    if (selectedChapter < currentBook.chaptersCount) {
      setSelectedChapter((c) => c + 1);
      setSelectedPasukNum(1);
    } else {
      const curIdx = TORAH_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (curIdx >= 0 && curIdx < TORAH_BOOKS.length - 1) {
        const nextBook = TORAH_BOOKS[curIdx + 1];
        setSelectedBookId(nextBook.id);
        setSelectedChapter(1);
        setSelectedParashaId(nextBook.parshiot?.[0]?.id || 'bereshit');
        setSelectedPasukNum(1);
      }
    }
    dafScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedChapter, currentBook]);

  // Listen to global prev/next events
  useEffect(() => {
    const onPrev = () => handlePrevPage();
    const onNext = () => handleNextPage();
    window.addEventListener('global-page-prev', onPrev);
    window.addEventListener('global-page-next', onNext);
    return () => {
      window.removeEventListener('global-page-prev', onPrev);
      window.removeEventListener('global-page-next', onNext);
    };
  }, [handlePrevPage, handleNextPage]);

  // Scroll to specific Pasuk when selectedPasukNum changes from cascade selector
  const scrollToPasuk = useCallback((pasukIndexOneBased: number) => {
    setSelectedPasukNum(pasukIndexOneBased);
    setTimeout(() => {
      const el = document.getElementById(`torah-pasuk-card-${pasukIndexOneBased}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 90);
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
          fromBookId: currentBook.id,
          fromBookNameKa: currentBook.nameKa,
          fromBookNameHe: currentBook.nameHe,
          fromChapter: selectedChapter,
          fromSentenceId: fromSent?.id || null,
          fromElementId: fromSent ? `sacred-sentence-${fromSent.id}` : null,
          fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
          sourceLabelKa: `${currentBook.nameKa} ${selectedChapter}`,
          sourceLabelHe: cit.labelHe,
          targetLabelKa: cit.labelKa,
        });
      }
      const fallbackRect = activeTappedCitation?.anchorRect || null;
      setActiveTappedCitation(null);

      if (cit.tractateId && cit.dafId && onOpenFloatingSourceDaf) {
        const sentHeb =
          fromSent?.hebrewText || (fromSent as unknown as { hebrew?: string })?.hebrew || '';
        const dibbur = fromSent?.dibburHamatchil || '';
        const contextPhrase = `${dibbur} ${sentHeb}`.trim().slice(0, 120) || cit.labelHe;
        const originLabel = `${currentBook.nameKa} ${selectedChapter}`;
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
      if (cit.chapterNum && cit.chapterNum >= 1 && cit.chapterNum <= currentBook.chaptersCount) {
        setPageTurnDirection(cit.chapterNum >= selectedChapter ? 1 : -1);
        setSelectedChapter(cit.chapterNum);
      }
    },
    [
      onOpenFloatingSourceDaf,
      onNavigateToTalmudDaf,
      onRecordCitationReturnPoint,
      currentBook,
      selectedChapter,
      activeTappedCitation,
    ]
  );

  const isGenericGeorgianPlaceholder = useCallback((text: string): boolean => {
    if (!text || text.trim().length < 8) return true;
    return (
      text.includes('წმინდა თორის მუხლი') ||
      text.includes('კლასიკური განმარტება წმინდა') ||
      text.includes('სინაის მთიდან გადმოცემული არამეული') ||
      text.includes('კლასიკური პეშატი და მიდრაშული') ||
      text.includes('მიმდინარეობს ქართული თარგმნა')
    );
  }, []);

  const resolveSentenceGeorgian = useCallback(
    (sent?: TalmudSentence | null): string => {
      if (!sent) return '';
      const cached = liveLineTranslationsKa[sent.id];
      if (cached) return cached;
      const cleaned = enforcePureGeorgianText(sent.translationKa || '');
      if (cleaned && !isGenericGeorgianPlaceholder(cleaned)) {
        return cleaned;
      }
      return cleaned || 'მიმდინარეობს ქართული თარგმნა...';
    },
    [liveLineTranslationsKa, isGenericGeorgianPlaceholder]
  );

  const ensureSentenceTranslatedKa = useCallback(
    async (sent?: TalmudSentence | null): Promise<string> => {
      if (!sent) return '';
      if (liveLineTranslationsKa[sent.id]) {
        return liveLineTranslationsKa[sent.id];
      }

      const existingClean = enforcePureGeorgianText(sent.translationKa || '');
      if (!isGenericGeorgianPlaceholder(existingClean) && existingClean.length > 10) {
        setLiveLineTranslationsKa((prev) => ({ ...prev, [sent.id]: existingClean }));
        return existingClean;
      }

      const cleanEnFromMap = rawEnglishSourceMapRef.current.get(sent.id) || '';
      const rawHeb =
        sent.hebrewText || (sent as unknown as { hebrew?: string }).hebrew || '';
      const cleanHeb = rawHeb
        .split(/\s+/)
        .filter((tok) => !isSmallRefMarkerToken(tok))
        .join(' ')
        .trim();

      const sourceText = cleanEnFromMap || cleanHeb || rawHeb;
      if (!sourceText) return existingClean;

      setTranslatingLineIds((prev) => ({ ...prev, [sent.id]: true }));
      try {
        const ka = await translateToGeorgianLive(
          sourceText,
          cleanEnFromMap ? 'en' : 'iw'
        );
        const pureKa = enforcePureGeorgianText(ka || '');
        if (pureKa && pureKa.length > 2) {
          setLiveLineTranslationsKa((prev) => ({ ...prev, [sent.id]: pureKa }));
          return pureKa;
        }
      } catch {
        // fallback to existingClean
      } finally {
        setTranslatingLineIds((prev) => {
          if (!prev[sent.id]) return prev;
          const next = { ...prev };
          delete next[sent.id];
          return next;
        });
      }
      return existingClean;
    },
    [liveLineTranslationsKa, isGenericGeorgianPlaceholder]
  );

  const toggleInlineLineTranslation = useCallback(
    (sent: TalmudSentence, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setExpandedLineTranslationIds((prev) => {
        const next = new Set(prev);
        if (next.has(sent.id)) {
          next.delete(sent.id);
        } else {
          next.add(sent.id);
          void ensureSentenceTranslatedKa(sent);
        }
        return next;
      });
    },
    [ensureSentenceTranslatedKa]
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

      const resolvedKa = resolveSentenceGeorgian(sent);
      const effectiveSentence: TalmudSentence = {
        ...sent,
        hebrewText: cleanHeb || rawHeb,
        translationKa: resolvedKa || sent.translationKa,
      };
      const rect = anchorEl.getBoundingClientRect();
      onSelectWordOrSentence(defaultWord, effectiveSentence, rect, mode);
      void ensureSentenceTranslatedKa(sent);
    },
    [onSelectWordOrSentence, resolveSentenceGeorgian, ensureSentenceTranslatedKa]
  );

  const toggleShnayimCompleted = useCallback((pasukKey: string) => {
    setCompletedShnayimIds((prev) => {
      const next = new Set(prev);
      if (next.has(pasukKey)) next.delete(pasukKey);
      else next.add(pasukKey);
      try {
        localStorage.setItem('torah_shnayim_completed_v1', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  /**
   * Renders interactive inline Hebrew words for continuous printed Mikraot Gedolot columns
   * (supports oversized opening word, bold Dibbur HaMatchil, Rashi script, blue citation links, and 2-ball range selection)
   */
  const renderPrintedInlineWords = (
    sent: TalmudSentence,
    options?: {
      customTextHe?: string;
      isRashiFont?: boolean;
      oversizedFirstWord?: boolean;
      onExtraClick?: () => void;
    }
  ) => {
    const rawHeb =
      options?.customTextHe !== undefined
        ? options.customTextHe
        : sent.hebrewText || (sent as unknown as { hebrew?: string }).hebrew || '';
    const displayedHeb = formatHebrewWithNikud(rawHeb);
    const words = displayedHeb.split(/\s+/).filter(Boolean);
    const wordCitationMap = buildWordCitationIndexMap(words);
    const isSentenceSelected = selectedTarget?.sentence?.id === sent.id;

    return (
      <>
        {words.map((rawWord, wIdx) => {
          // Handle Parasha Petuchah / Setumah sign (פ / ס) at end of verse
          if ((rawWord === 'פ' || rawWord === 'ס') && wIdx === words.length - 1) {
            return (
              <span
                key={`${sent.id}-parasha-sign-${wIdx}`}
                style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                className="inline-block mx-2.5 sm:mx-4 font-black text-[0.88em] text-[#140D07] select-none"
                title={rawWord === 'פ' ? 'פרשה פתוחה (פ)' : 'פרשה סתומה (ס)'}
              >
                {rawWord}
              </span>
            );
          }

          const hasMasoreticRing = rawWord.startsWith('°');
          const word = hasMasoreticRing ? rawWord.slice(1) : rawWord;

          const citForWord = wordCitationMap.get(wIdx);
          const markerLetter = !citForWord ? isSmallRefMarkerToken(word) : null;
          if (markerLetter) {
            return (
              <React.Fragment key={`${sent.id}-w-${wIdx}`}>
                <sup
                  onClick={(e) => e.stopPropagation()}
                  className="inline text-[0.68em] font-serif font-bold opacity-65 px-0.5 select-none"
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

          const isOversizedLead = Boolean(options?.oversizedFirstWord && wIdx === 0);

          if (citForWord) {
            return (
              <React.Fragment key={`${sent.id}-w-${wIdx}`}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    options?.onExtraClick?.();
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
                  className={`inline font-extrabold transition-colors cursor-pointer ${
                    isCitTapped
                      ? 'text-[#0E3299] underline decoration-[#1545C8] decoration-2'
                      : 'text-[#1545C8] hover:text-[#0E3299]'
                  }`}
                >
                  {word}
                </span>
                {isCitSpanEnd && isCitTapped && (
                  <CrystalDiamondJumpButton
                    labelKa={`წყარო: ${citForWord.labelKa}`}
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

          const handlePointerDown = () => {
            if (sacredLongPressTimerRef.current) {
              clearTimeout(sacredLongPressTimerRef.current);
            }
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

          const clearLongPress = () => {
            if (sacredLongPressTimerRef.current) {
              clearTimeout(sacredLongPressTimerRef.current);
              sacredLongPressTimerRef.current = null;
            }
          };

          return (
            <React.Fragment key={`${sent.id}-w-${wIdx}`}>
              {hasMasoreticRing && (
                <sup
                  className="inline text-[0.62em] font-black text-[#2B1B10] mr-0.5 select-none"
                  title="מסורה / תולדות אהרן"
                >
                  °
                </sup>
              )}
              <span
                data-daf-word="true"
                data-active-talmud-word={isWordSelected ? 'true' : undefined}
                onMouseDown={handlePointerDown}
                onMouseUp={clearLongPress}
                onTouchStart={handlePointerDown}
                onTouchEnd={clearLongPress}
                onTouchCancel={clearLongPress}
                onClick={(e) => {
                  e.stopPropagation();
                  clearLongPress();
                  options?.onExtraClick?.();
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
                }}
                style={
                  isOversizedLead
                    ? {
                        fontSize: '1.7em',
                        lineHeight: 1.25,
                        fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                        display: 'inline-block',
                        verticalAlign: 'baseline',
                      }
                    : options?.isRashiFont && showRashiScript
                      ? { fontFamily: "'Noto Rashi Hebrew', 'Frank Ruhl Libre', serif" }
                      : { fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }
                }
                className={`inline rounded-[2px] px-[1px] transition-colors cursor-pointer ${
                  isOversizedLead ? 'font-black tracking-tight ml-1.5 ' : ''
                }${
                  isWordSelected
                    ? 'bg-[#E5A93C] text-[#110B06] font-black ring-1 ring-[#6E472B]'
                    : 'hover:bg-[#C49A6C]/30'
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
                    }}
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
                    }}
                    className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-700 border border-white shadow-sm align-middle mx-0.5 cursor-ew-resize"
                  />
                )}
              </span>{' '}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  /**
   * Renders a continuous justified Mikraot Gedolot commentary block (used for פירש״י, בעל הטורים, שפתי חכמים, אבן עזרא, רמב״ן)
   * with bold square-font Dibbur HaMatchil lead words, Rashi script body, connected-pasuk highlighting, and clean inline Georgian translation when active!
   */
  const renderContinuousCommentaryColumn = (
    sentences: TalmudSentence[],
    fontSizeCss: string,
    _extraConnectedSentences?: TalmudSentence[]
  ) => {
    return (
      <div
        dir={dafVariant === 'georgian' ? 'ltr' : 'rtl'}
        style={{
          fontSize: fontSizeCss,
          lineHeight: dafVariant === 'georgian' ? 1.54 : 1.56,
        }}
        className="text-justify select-text pt-1.5 pb-1"
      >
        {sentences.map((sent, idx) => {
          const sentPasukNum = getSentencePasukNum(sent, idx);
          const isCrossLinked =
            crossHighlightedIds.has(sent.id) ||
            doesCommentaryMatchPasuk(sent, idx, activePasukForLinks);
          const isSelected = selectedTarget?.sentence?.id === sent.id;
          const isLineTranslated =
            dafVariant === 'bilingual' ||
            expandedLineTranslationIds.has(sent.id) ||
            (chumashAutoTranslateLineMode && isCrossLinked);
          const isTranslatingNow = Boolean(translatingLineIds[sent.id]);
          const resolvedKa = resolveSentenceGeorgian(sent);
          const rawHeb = sent.hebrewText || sent.hebrew || '';
          const { dibbur, body, verseLetter } = splitDibburAndBody(
            rawHeb,
            sent.dibburHamatchil
          );
          const vLetter = verseLetter || numberToHebrewGematria(sentPasukNum);

          if (dafVariant === 'georgian') {
            return (
              <span
                key={sent.id}
                data-pasuk-num={sentPasukNum}
                onMouseEnter={() => {
                  setHoveredSentence(sent);
                  void ensureSentenceTranslatedKa(sent);
                }}
                onClick={(e) => {
                  setSelectedPasukNum(sentPasukNum);
                  const firstWord = rawHeb.split(/\s+/)[0] || '';
                  triggerSentenceWithSelectionOption(
                    sent,
                    e.currentTarget as HTMLElement,
                    firstWord,
                    'sentence-ka'
                  );
                }}
                className={`inline cursor-pointer rounded-md px-1 transition-colors ${
                  isSelected
                    ? 'bg-amber-400/65 font-bold ring-1 ring-amber-700/40'
                    : isCrossLinked
                      ? 'bg-amber-300/55 font-bold ring-1 ring-amber-600/35'
                      : 'hover:bg-black/5'
                }`}
              >
                <strong className="font-black text-[#5C3A21]">({sentPasukNum}) </strong>
                <span>{resolvedKa} </span>
              </span>
            );
          }

          return (
            <span
              key={sent.id}
              data-pasuk-num={sentPasukNum}
              onMouseEnter={() => setHoveredSentence(sent)}
              onDoubleClick={(e) => toggleInlineLineTranslation(sent, e)}
              className={`inline transition-colors rounded-md px-0.5 ${
                isSelected
                  ? 'bg-amber-300/65 ring-1 ring-amber-700/45'
                  : isCrossLinked
                    ? 'bg-amber-300/45 ring-1 ring-amber-600/35'
                    : ''
              }`}
            >
              {/* Small verse reference letter */}
              <span
                style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                className="font-bold text-[0.9em] text-[#5C3A21] ml-0.5"
              >
                ({vLetter})
              </span>{' '}
              {/* Bold square-font Dibbur HaMatchil lead phrase */}
              {dibbur && (
                <span
                  style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                  className="font-black text-[1.03em] tracking-tight ml-1 text-[#110C07]"
                >
                  {formatHebrewWithNikud(dibbur)}
                  {!dibbur.endsWith('.') && !dibbur.endsWith(':') ? '.' : ''}{' '}
                </span>
              )}
              {/* Rashi-script commentary body */}
              {renderPrintedInlineWords(sent, {
                customTextHe: body || rawHeb,
                isRashiFont: true,
                onExtraClick: () => {
                  setSelectedPasukNum(sentPasukNum);
                  void ensureSentenceTranslatedKa(sent);
                },
              })}
              {isLineTranslated && (
                <span
                  dir="ltr"
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstWord = rawHeb.split(/\s+/)[0] || '';
                    triggerSentenceWithSelectionOption(
                      sent,
                      e.currentTarget as HTMLElement,
                      firstWord,
                      'sentence-ka'
                    );
                  }}
                  className="block my-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#F3E7CC] to-[#FAF4E6] shadow-[inset_2px_0_0_#B45309,0_1px_4px_rgba(0,0,0,0.06)] text-[0.86em] font-sans font-semibold text-[#1E130A] text-left leading-snug cursor-pointer"
                >
                  {isTranslatingNow ? 'იტვირთება ქართული თარგმანი...' : resolvedKa}
                </span>
              )}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  // Filtered lists for the Cascading Multi-Column Selector inside the Bottom Sheet
  const qNorm = cascadeSearchQuery.trim().toLowerCase();
  const qHeNorm = normalizeHebrewWord(cascadeSearchQuery.trim());

  const filteredParshiotForBook = useMemo(() => {
    const baseList = currentBook.parshiot || [];
    if (!qNorm) return baseList;
    return baseList.filter(
      (p) =>
        p.nameKa.toLowerCase().includes(qNorm) ||
        p.nameHe.includes(cascadeSearchQuery.trim()) ||
        normalizeHebrewWord(p.nameHe).includes(qHeNorm) ||
        p.startRef.includes(qNorm)
    );
  }, [currentBook, qNorm, qHeNorm, cascadeSearchQuery]);

  const filteredAliyot = useMemo(() => {
    if (!qNorm) return aliyotForCurrentParasha;
    return aliyotForCurrentParasha.filter(
      (a) =>
        a.nameKa.toLowerCase().includes(qNorm) ||
        a.nameHe.includes(cascadeSearchQuery.trim()) ||
        String(a.chapter).includes(qNorm)
    );
  }, [aliyotForCurrentParasha, qNorm, cascadeSearchQuery]);

  const filteredChapters = useMemo(() => {
    const arr: { num: number; gem: string }[] = [];
    for (let i = 1; i <= currentBook.chaptersCount; i++) {
      arr.push({ num: i, gem: numberToHebrewGematria(i) });
    }
    if (!qNorm) return arr;
    return arr.filter(
      (ch) =>
        String(ch.num).includes(qNorm) ||
        `თავი ${ch.num}`.includes(qNorm) ||
        ch.gem.includes(cascadeSearchQuery.trim())
    );
  }, [currentBook.chaptersCount, qNorm, cascadeSearchQuery]);

  const filteredPesukim = useMemo(() => {
    const list = activeMainSentences.map((s, idx) => ({
      num: idx + 1,
      gem: numberToHebrewGematria(idx + 1),
      hebrew: (s.hebrewText || s.hebrew || '').slice(0, 70),
      georgian: (s.translationKa || '').slice(0, 75),
    }));
    if (!qNorm) return list;
    return list.filter(
      (p) =>
        String(p.num).includes(qNorm) ||
        p.gem.includes(cascadeSearchQuery.trim()) ||
        p.georgian.toLowerCase().includes(qNorm) ||
        normalizeHebrewWord(p.hebrew).includes(qHeNorm)
    );
  }, [activeMainSentences, qNorm, qHeNorm, cascadeSearchQuery]);

  // Combined scale factor inside our A4 / Full-Stretch coordinate system + Per-Pane Pinch Zoom
  const fontScaleMultiplier = (dafFontSizeScale || 100) / 100;
  const getPaneFontCss = (basePx: number, paneKey: string) => {
    const paneMult = (paneZoomScales[paneKey] || 100) / 100;
    return `${Math.round(basePx * fontScaleMultiplier * paneMult * 10) / 10}px`;
  };
  const torahMainFontCss = getPaneFontCss(18.5, 'torah');
  const onkelosFontCss = getPaneFontCss(13.2, 'onkelos');
  const rashiFontCss = getPaneFontCss(12.8, 'rashi');
  const lowerRightFontCss = getPaneFontCss(12.8, 'lower-right');
  const lowerLeftFontCss = getPaneFontCss(12.8, 'lower-left');
  const toldotFontCss = getPaneFontCss(10.8, 'toldot');

  const bookCrownTitleHe =
    CHUMASH_LEATHER_THEMES[currentBook.id]?.shortHe || currentBook.nameHe;
  const parashaPureHe = currentParasha.nameHe.replace(/^פרשת\s+/, '');
  const chapterLetterPlainHe = numberToHebrewGematria(selectedChapter).replace(/[׳״]/g, '');
  const folioLetterPlainHe = numberToHebrewGematria(selectedChapter + 1).replace(/[׳״]/g, '');

  const activePasukSentence =
    activeMainSentences[Math.max(0, Math.min(activeMainSentences.length - 1, selectedPasukNum - 1))] ||
    activeMainSentences[0];
  const activePasukOnkelos =
    connectedCommentariesForSelectedPasuk.onkelosMatches[0] ||
    activeOnkelosSentences[
      Math.max(0, Math.min(activeOnkelosSentences.length - 1, selectedPasukNum - 1))
    ] ||
    activeOnkelosSentences[0];
  const activePasukRashi =
    connectedCommentariesForSelectedPasuk.rashiMatches[0] ||
    activeRashiSentences[
      Math.max(0, Math.min(activeRashiSentences.length - 1, selectedPasukNum - 1))
    ] ||
    activeRashiSentences[0];

  // Automatically ensure live Georgian translation for the currently selected Pasuk + connected commentaries + visible sentences when Georgian/Bilingual mode is active
  useEffect(() => {
    void ensureSentenceTranslatedKa(activePasukSentence);
    void ensureSentenceTranslatedKa(activePasukOnkelos);
    void ensureSentenceTranslatedKa(activePasukRashi);
    connectedCommentariesForSelectedPasuk.unifiedList.slice(0, 8).forEach((item) => {
      void ensureSentenceTranslatedKa(item.sentence);
    });
  }, [
    selectedPasukNum,
    chumashAutoTranslateLineMode,
    dafVariant,
    activePasukSentence,
    activePasukOnkelos,
    activePasukRashi,
    connectedCommentariesForSelectedPasuk,
    ensureSentenceTranslatedKa,
  ]);

  useEffect(() => {
    if (dafVariant === 'hebrew' && !chumashAutoTranslateLineMode) return;
    const batch = [
      ...activeMainSentences.slice(0, 14),
      ...activeOnkelosSentences.slice(0, 10),
      ...activeRashiSentences.slice(0, 10),
      ...activeBaalHaTurimSentences.slice(0, 6),
      ...activeSifteiChachamimSentences.slice(0, 6),
    ];
    batch.forEach((s) => {
      void ensureSentenceTranslatedKa(s);
    });
  }, [
    dafVariant,
    chumashAutoTranslateLineMode,
    activeMainSentences,
    activeOnkelosSentences,
    activeRashiSentences,
    activeBaalHaTurimSentences,
    activeSifteiChachamimSentences,
    ensureSentenceTranslatedKa,
  ]);

  // Custom multi-touch pinch-to-zoom & 1:1 touch-drag pan bounding-box engine
  const totalDafScale = useMemo(
    () => Number(Math.max(0.32, Math.min(2.8, a4Scale * (pinchZoomScale / 100))).toFixed(4)),
    [a4Scale, pinchZoomScale]
  );

  const openPaneFullScreenModal = useCallback(
    (titleKa: string, titleHe: string, list: TalmudSentence[]) => {
      list.slice(0, 18).forEach((s) => {
        void ensureSentenceTranslatedKa(s);
      });
      setFullscreenModal({
        title: `${titleKa} • ${currentBook.nameKa} (თავი ${selectedChapter})`,
        subtitle: `${titleHe} • ${currentBook.nameHe} פרק ${numberToHebrewGematria(selectedChapter)}`,
        hebrewText: list
          .map((s, idx) => {
            const heb = s.hebrewText || s.hebrew || '';
            const prefix = s.dibburHamatchil
              ? `${s.dibburHamatchil}: `
              : `(${numberToHebrewGematria(idx + 1)}) `;
            return `${prefix}${heb}`;
          })
          .join('\n\n'),
        georgianText: list
          .map((s, idx) => {
            const pureKa = resolveSentenceGeorgian(s);
            return `(${idx + 1}) ${pureKa}`;
          })
          .join('\n\n'),
      });
    },
    [currentBook, selectedChapter, resolveSentenceGeorgian, ensureSentenceTranslatedKa]
  );

  const renderPaneZoomBadge = (paneKey: string) => {
    const val = paneZoomScales[paneKey] || 100;
    if (val === 100) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          adjustPaneZoom(paneKey, 'reset');
        }}
        className="px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/35 text-[#3B2514] text-[9.5px] font-sans font-extrabold cursor-pointer tabular-nums"
        title="ზუმის საწყის ზომაზე დაბრუნება (100%)"
      >
        {val}%
      </button>
    );
  };

  const focusedPaneMeta = useMemo(() => {
    const activeId = focusedPaneId || maximizedPaneId;
    if (!activeId) return null;
    switch (activeId) {
      case 'torah':
        return {
          id: 'torah' as const,
          titleHe: `${bookCrownTitleHe} • תורה`,
          titleKa: `ხუმაში / თორა (${currentBook.nameKa})`,
          sentences: activeMainSentences,
          fontCss: getPaneFontCss(20, 'torah'),
          isRashiFont: false,
        };
      case 'onkelos':
        return {
          id: 'onkelos' as const,
          titleHe: 'תרגום אונקלוס',
          titleKa: 'თარგუმ ონკელოსი',
          sentences: activeOnkelosSentences,
          fontCss: getPaneFontCss(16.5, 'onkelos'),
          isRashiFont: false,
        };
      case 'toldot':
        return {
          id: 'toldot' as const,
          titleHe: 'תולדות אהרן',
          titleKa: 'თოლდოთ აჰარონი',
          sentences: [toldotAharonSentence],
          fontCss: getPaneFontCss(16, 'toldot'),
          isRashiFont: true,
        };
      case 'rashi':
        return {
          id: 'rashi' as const,
          titleHe: 'פירש״י',
          titleKa: 'რაშის კომენტარი',
          sentences: activeRashiSentences,
          fontCss: getPaneFontCss(16, 'rashi'),
          isRashiFont: true,
        };
      case 'lower-right':
        return {
          id: 'lower-right' as const,
          titleHe: lowerRightTab === 'baal-haturim' ? 'בעל הטורים' : 'רמב״ן',
          titleKa: lowerRightTab === 'baal-haturim' ? 'ბაალ ჰატურიმი' : 'რამბანი',
          sentences:
            lowerRightTab === 'baal-haturim'
              ? activeBaalHaTurimSentences
              : activeRambanSentences,
          fontCss: getPaneFontCss(16, 'lower-right'),
          isRashiFont: true,
        };
      case 'lower-left':
        return {
          id: 'lower-left' as const,
          titleHe: lowerLeftTab === 'siftei' ? 'שפתי חכמים' : 'אבן עזרא',
          titleKa: lowerLeftTab === 'siftei' ? 'სიფთეი ხახამიმი' : 'იბნ ეზრა',
          sentences:
            lowerLeftTab === 'siftei'
              ? activeSifteiChachamimSentences
              : activeIbnEzraSentences,
          fontCss: getPaneFontCss(16, 'lower-left'),
          isRashiFont: true,
        };
    }
  }, [
    focusedPaneId,
    maximizedPaneId,
    bookCrownTitleHe,
    currentBook.nameKa,
    activeMainSentences,
    activeOnkelosSentences,
    toldotAharonSentence,
    activeRashiSentences,
    lowerRightTab,
    activeBaalHaTurimSentences,
    activeRambanSentences,
    lowerLeftTab,
    activeSifteiChachamimSentences,
    activeIbnEzraSentences,
    dafFontSizeScale,
    paneZoomScales,
  ]);

  return (
    <div className="relative w-full min-h-[calc(100dvh-56px)] flex flex-col justify-between pb-14 select-none">
      {/* FULL-SCREEN MODERN WINDOWS 11 FLUENT A4 MIKRAOT GEDOLOT CHUMASH DAF FOLIO */}
      <PageFlip3DWrapper
        pageKey={`torah-${currentBook.id}-${selectedChapter}-${dafVariant}-${isShnayimMikra ? 'shnayim' : 'std'}`}
        direction={pageTurnDirection}
        isDark={isDark}
      >
        <div
          ref={a4ViewportWrapperRef}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 8 : -8;
              setPinchZoomScale((z) => {
                const next = Math.max(55, Math.min(260, z + delta));
                setDafPan((p) => clampPanToBounds(p.x, p.y, a4Scale * (next / 100)));
                return next;
              });
            }
          }}
          onMouseDown={(e) => {
            if (e.button === 1 || isDafPanMode || pinchZoomScale > 102) {
              if ((e.target as HTMLElement).closest('button, input, [data-daf-word="true"]')) {
                if (!isDafPanMode && e.button !== 1) return;
              }
              setIsDafDragging(true);
              dafDragPanRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                origPanX: dafPan.x,
                origPanY: dafPan.y,
                moved: false,
              };
            }
          }}
          onMouseMove={(e) => {
            if (!dafDragPanRef.current) return;
            const dx = e.clientX - dafDragPanRef.current.startX;
            const dy = e.clientY - dafDragPanRef.current.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
              dafDragPanRef.current.moved = true;
            }
            setDafPan(
              clampPanToBounds(
                dafDragPanRef.current.origPanX + dx,
                dafDragPanRef.current.origPanY + dy,
                totalDafScale
              )
            );
          }}
          onMouseUp={() => {
            dafDragPanRef.current = null;
            setIsDafDragging(false);
          }}
          onMouseLeave={() => {
            dafDragPanRef.current = null;
            setIsDafDragging(false);
          }}
          className={
            isDafFullScreen
              ? 'fixed inset-0 z-[230] w-screen h-[100dvh] bg-[#120B07]/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden p-1'
              : 'w-full max-w-full flex justify-center items-start py-1 px-1 overflow-hidden'
          }
        >
          <div
            style={{
              width: `${Math.round(dafVirtualWidth * totalDafScale)}px`,
              height: isDafMinimized
                ? 'auto'
                : `${Math.round(dafVirtualHeight * totalDafScale)}px`,
              position: 'relative',
            }}
            className="shrink-0 mx-auto"
          >
            <div
              ref={dafScrollContainerRef}
              data-paper-format="A4"
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                  const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                  dafPinchRef.current = {
                    dist: Math.hypot(dx, dy),
                    startZoom: pinchZoomScale,
                    midX,
                    midY,
                    startPanX: dafPan.x,
                    startPanY: dafPan.y,
                  };
                  dafSwipeRef.current = null;
                  dafDragPanRef.current = null;
                  return;
                }
                if (e.touches.length === 1) {
                  const inScrollPane = (e.target as HTMLElement).closest(
                    '[data-daf-scroll-pane="true"]'
                  );
                  if (
                    isDafPanMode ||
                    pinchZoomScale > 103 ||
                    !inScrollPane ||
                    dafPan.x !== 0 ||
                    dafPan.y !== 0
                  ) {
                    dafDragPanRef.current = {
                      startX: e.touches[0].clientX,
                      startY: e.touches[0].clientY,
                      origPanX: dafPan.x,
                      origPanY: dafPan.y,
                      moved: false,
                    };
                  }
                  dafSwipeRef.current = {
                    startX: e.touches[0].clientX,
                    startY: e.touches[0].clientY,
                    time: Date.now(),
                  };
                } else {
                  dafSwipeRef.current = null;
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && dafPinchRef.current) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const dist = Math.hypot(dx, dy);
                  const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                  const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                  let nextZoom = pinchZoomScale;
                  if (dafPinchRef.current.dist > 10) {
                    const ratio = dist / dafPinchRef.current.dist;
                    nextZoom = Math.round(
                      Math.max(55, Math.min(260, dafPinchRef.current.startZoom * ratio))
                    );
                    setPinchZoomScale(nextZoom);
                  }
                  const nextScale = a4Scale * (nextZoom / 100);
                  const rawPanX =
                    dafPinchRef.current.startPanX + (midX - dafPinchRef.current.midX);
                  const rawPanY =
                    dafPinchRef.current.startPanY + (midY - dafPinchRef.current.midY);
                  setDafPan(clampPanToBounds(rawPanX, rawPanY, nextScale));
                  return;
                }
                if (
                  e.touches.length === 1 &&
                  dafDragPanRef.current &&
                  (isDafPanMode || pinchZoomScale > 103)
                ) {
                  const dx = e.touches[0].clientX - dafDragPanRef.current.startX;
                  const dy = e.touches[0].clientY - dafDragPanRef.current.startY;
                  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                    dafDragPanRef.current.moved = true;
                    setDafPan(
                      clampPanToBounds(
                        dafDragPanRef.current.origPanX + dx,
                        dafDragPanRef.current.origPanY + dy,
                        totalDafScale
                      )
                    );
                  }
                }
              }}
              onTouchEnd={(e) => {
                if (dafPinchRef.current && e.touches.length < 2) {
                  dafPinchRef.current = null;
                  return;
                }
                if (dafDragPanRef.current?.moved) {
                  dafDragPanRef.current = null;
                  dafSwipeRef.current = null;
                  return;
                }
                dafDragPanRef.current = null;
                if (!dafSwipeRef.current || e.changedTouches.length !== 1) return;
                const dx = e.changedTouches[0].clientX - dafSwipeRef.current.startX;
                const dy = e.changedTouches[0].clientY - dafSwipeRef.current.startY;
                const dt = Date.now() - dafSwipeRef.current.time;
                dafSwipeRef.current = null;

                if (
                  pinchZoomScale <= 104 &&
                  !isDafPanMode &&
                  dt < 650 &&
                  Math.abs(dx) > 68 &&
                  Math.abs(dx) > Math.abs(dy) * 1.6
                ) {
                  if (dx > 0) {
                    handleNextPage();
                  } else {
                    handlePrevPage();
                  }
                }
              }}
              id="talmud-daf-folio-anchor"
              style={{
                width: `${dafVirtualWidth}px`,
                minWidth: `${dafVirtualWidth}px`,
                maxWidth: `${dafVirtualWidth}px`,
                height: isDafMinimized ? 'auto' : `${dafVirtualHeight}px`,
                minHeight: isDafMinimized ? undefined : `${dafVirtualHeight}px`,
                maxHeight: isDafMinimized ? undefined : `${dafVirtualHeight}px`,
                transformOrigin: '0 0',
                transform: `translate3d(${dafPan.x}px, ${dafPan.y}px, 0) scale(${totalDafScale})`,
                cursor: isDafDragging
                  ? 'grabbing'
                  : isDafPanMode || pinchZoomScale > 103
                    ? 'grab'
                    : undefined,
              }}
              className="rounded-2xl crystal-daf-folio text-[#0B1324] p-2.5 flex flex-col justify-between overflow-hidden will-change-transform"
            >
            {/* MODERN BORDERLESS-FEEL WINDOWS 11 FLUENT CONTAINER (Removed harsh double black frames!) */}
            <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
              {/* =================================================================== */}
              {/* 1. CLEAN TRADITIONAL RUNNING HEADER OF THE A4 PAGE (NO BUTTONS!)    */}
              {/* =================================================================== */}
              <div
                dir="rtl"
                onClick={() => setIsBottomSheetExpanded(true)}
                className="flex items-center justify-between px-4 py-1.5 rounded-xl crystal-daf-header border border-sky-300/75 shrink-0 select-none cursor-pointer"
                title="დააწკაპუნეთ ხუმაშის, ფარაშის და თავის ასარჩევად"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                    className="text-base sm:text-lg font-black tracking-tight text-[#110C07]"
                  >
                    פרשת {parashaPureHe}
                  </span>
                  <span className="text-[11px] font-bold text-[#5C3A21]">
                    ({currentParasha.nameKa})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                    className="text-lg sm:text-xl font-black tracking-widest text-[#110C07]"
                  >
                    {bookCrownTitleHe} • פרק {chapterLetterPlainHe}
                  </span>
                  {loadingLiveSefaria && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5C3A21]" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#3B2514]">
                  <span>{currentBook.nameKa}</span>
                  <span>•</span>
                  <span>თავი {selectedChapter}</span>
                </div>
              </div>

              {!isDafMinimized && (
                <>
                  {/* =============================================================== */}
                  {/* A4 INTERIOR BODY: 3-TIER MIKRAOT GEDOLOT DAF                    */}
                  {/* =============================================================== */}
                  {maximizedPaneId && focusedPaneMeta ? (
                    /* MAXIMIZED / EXPANDED SINGLE FIELD VIEW (Triggered from Bottom Panel Windows Expand □ Button) */
                    <div
                      {...getPaneZoomHandlers(maximizedPaneId)}
                      onMouseEnter={() => setFocusedPaneId(maximizedPaneId)}
                      onClick={() => setFocusedPaneId(maximizedPaneId)}
                      className="flex-1 min-h-0 flex flex-col rounded-2xl crystal-daf-pane crystal-daf-pane-focused overflow-hidden"
                    >
                      <div
                        dir="rtl"
                        className="px-3.5 py-2 crystal-daf-header flex items-center justify-between gap-2 shrink-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                            className="text-base sm:text-lg font-black text-[#0F1E36] shrink-0"
                          >
                            {focusedPaneMeta.titleHe}
                          </span>
                          <span className="text-xs font-extrabold text-[#476282] truncate">
                            • {focusedPaneMeta.titleKa}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-raw-btn="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaximizedPaneId(null);
                          }}
                          className="w-8 h-8 rounded-xl bg-white/85 hover:bg-amber-50 border border-sky-300/80 text-[#0F1E36] flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                          title="დაფის სრულ ხედზე დაბრუნება"
                          aria-label="დაფზე დაბრუნება"
                        >
                          <Minimize2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        data-daf-scroll-pane="true"
                        dir={dafVariant === 'georgian' ? 'ltr' : 'rtl'}
                        style={{
                          fontSize: focusedPaneMeta.fontCss,
                          lineHeight: 1.72,
                          fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                        }}
                        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 sm:px-6 py-4 text-justify text-[#0B1324]"
                      >
                        <ReadingLineGuide
                          initialY={42}
                          fieldLabel={focusedPaneMeta.titleKa}
                        />
                        {maximizedPaneId === 'torah' || maximizedPaneId === 'onkelos' ? (
                          focusedPaneMeta.sentences.map((sent, idx) => {
                            const pasukNum = idx + 1;
                            const pasukHe = numberToHebrewGematria(pasukNum);
                            const resolvedKa = resolveSentenceGeorgian(sent);
                            return (
                              <span key={sent.id} className="inline">
                                <span className="font-black text-[0.78em] text-[#5C3A21] ml-1">
                                  ({pasukHe})
                                </span>{' '}
                                {dafVariant === 'georgian' ? (
                                  <span>{resolvedKa} </span>
                                ) : (
                                  <>
                                    {renderPrintedInlineWords(sent, {
                                      oversizedFirstWord: idx === 0 && maximizedPaneId === 'torah',
                                    })}
                                    {dafVariant === 'bilingual' && (
                                      <span
                                        dir="ltr"
                                        className="block my-1.5 px-3 py-1.5 rounded-lg bg-[#F3E7CC] text-[0.82em] font-sans font-semibold text-[#1E130A] text-left"
                                      >
                                        {pasukNum}. {resolvedKa}
                                      </span>
                                    )}
                                  </>
                                )}{' '}
                              </span>
                            );
                          })
                        ) : (
                          renderContinuousCommentaryColumn(
                            focusedPaneMeta.sentences,
                            focusedPaneMeta.fontCss
                          )
                        )}
                      </div>
                    </div>
                  ) : isShnayimMikra ? (
                    <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-[#FCF8F0]/90 ring-1 ring-[#8B5A2B]/15 shadow-sm overflow-hidden p-2">
                      <div
                        {...getPaneZoomHandlers('torah')}
                        onMouseEnter={() => setFocusedPaneId('torah')}
                        onClick={() => setFocusedPaneId('torah')}
                        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y space-y-2 pr-1"
                      >
                        <ReadingLineGuide initialY={38} fieldLabel="შნაიმ მიკრა" />
                        {activeMainSentences.map((sent, idx) => {
                          const pasukNum = idx + 1;
                          const pasukHe = numberToHebrewGematria(pasukNum);
                          const onkelosSent =
                            activeOnkelosSentences[idx] ||
                            activeOnkelosSentences[
                              idx % Math.max(1, activeOnkelosSentences.length)
                            ];
                          const rashiSent =
                            activeRashiSentences[idx] ||
                            activeRashiSentences[idx % Math.max(1, activeRashiSentences.length)];

                          return (
                            <div
                              key={`shnayim-${sent.id}`}
                              id={`torah-pasuk-card-${pasukNum}`}
                              className="p-2.5 rounded-xl bg-[#F7EFE0]/80 ring-1 ring-[#8B5A2B]/15"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  dir="rtl"
                                  style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                                  className="text-xs font-black px-2 py-0.5 rounded-md bg-[#E6D6B8]"
                                >
                                  פסוק {pasukHe} ({pasukNum})
                                </span>
                              </div>

                              <div
                                dir="rtl"
                                style={{ fontSize: torahMainFontCss, lineHeight: 1.52 }}
                                className="font-serif font-bold text-justify mb-1"
                              >
                                <span className="text-[0.7em] font-black opacity-70 ml-1">
                                  [מקרא א׳]
                                </span>
                                {renderPrintedInlineWords(sent)}
                              </div>

                              <div
                                dir="rtl"
                                style={{ fontSize: torahMainFontCss, lineHeight: 1.52 }}
                                className="font-serif font-bold text-justify mb-1"
                              >
                                <span className="text-[0.7em] font-black opacity-70 ml-1">
                                  [מקרא ב׳]
                                </span>
                                {renderPrintedInlineWords(sent)}
                              </div>

                              {onkelosSent && (
                                <div
                                  dir="rtl"
                                  style={{ fontSize: onkelosFontCss, lineHeight: 1.42 }}
                                  className="font-serif text-justify py-1 border-t border-[#8B5A2B]/15"
                                >
                                  <strong className="font-black ml-1">[תרגום אונקלוס]</strong>
                                  {renderPrintedInlineWords(onkelosSent)}
                                </div>
                              )}

                              <div className="pt-1 border-t border-[#8B5A2B]/15 text-xs font-semibold text-[#2B1B10]">
                                <strong>ქართული: </strong>
                                {resolveSentenceGeorgian(sent)}
                                {rashiSent && (
                                  <span className="block mt-0.5 opacity-85">
                                    <strong>פירש״י: </strong>
                                    {resolveSentenceGeorgian(rashiSent)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* =============================================================== */
                    /* CLEAN BUTTON-FREE MIKRAOT GEDOLOT A4 LAYOUT (Hover/Click Focus) */
                    /* =============================================================== */
                    <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                      {/* ----------------------------------------------------------- */}
                      {/* TIER 1 (UPPER TIER): RIGHT TORAH (8 cols) + LEFT ONKELOS (4) */}
                      {/* ----------------------------------------------------------- */}
                      <div
                        dir="rtl"
                        className={`${
                          minimizedPanes['torah'] &&
                          minimizedPanes['onkelos'] &&
                          minimizedPanes['toldot']
                            ? 'h-9 shrink-0'
                            : 'flex-[48] min-h-0'
                        } grid grid-cols-12 gap-2 overflow-hidden transition-all duration-300`}
                      >
                        {/* RIGHT WIDE WINDOW (8 of 12 cols): CHUMASH CROWN + TORAH VERSES */}
                        <div
                          {...getPaneZoomHandlers('torah')}
                          onMouseEnter={() => setFocusedPaneId('torah')}
                          onClick={() => {
                            setFocusedPaneId('torah');
                            if (minimizedPanes['torah']) togglePaneMinimized('torah');
                          }}
                          className={`${
                            minimizedPanes['onkelos'] && minimizedPanes['toldot']
                              ? 'col-span-12'
                              : 'col-span-8'
                          } ${
                            minimizedPanes['torah'] ? 'h-9 shrink-0 cursor-pointer' : 'h-full min-h-0'
                          } rounded-2xl crystal-daf-pane ${
                            focusedPaneId === 'torah' ? 'crystal-daf-pane-focused' : ''
                          } flex flex-col overflow-hidden transition-all duration-200`}
                        >
                          {minimizedPanes['torah'] ? (
                            <div className="h-full px-3 flex items-center justify-between crystal-daf-header text-xs font-black text-[#0B1324]">
                              <span>{bookCrownTitleHe} • ხუმაში (ჩაკეცილია)</span>
                              <span className="text-[10px] text-sky-900">დააწკაპუნეთ გასაშლელად</span>
                            </div>
                          ) : (
                            <div className="flex-1 min-h-0 flex flex-col px-3 py-2 overflow-hidden">
                              {/* CLEAN CROWN BANNER (שער הספר) */}
                              <div className="relative w-full mb-2 rounded-xl crystal-daf-header border border-sky-300/70 px-3 py-1.5 flex flex-col items-center justify-center shrink-0">
                                <span
                                  style={{
                                    fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                                    fontSize: '28px',
                                    letterSpacing: '0.06em',
                                  }}
                                  className="font-black text-[#110C07] leading-none"
                                >
                                  {bookCrownTitleHe}
                                </span>
                                <div className="mt-0.5 text-[10px] font-black tracking-wide text-[#3B2514]">
                                  {dafVariant === 'georgian'
                                    ? `${currentBook.nameKa} • ფარაშა ${currentParasha.nameKa} • თავი ${selectedChapter}`
                                    : `פרשת ${parashaPureHe} • פרק ${numberToHebrewGematria(selectedChapter)} (${currentBook.nameKa} ${selectedChapter})`}
                                </div>
                              </div>

                              {/* SCROLLABLE VOCALIZED TORAH VERSES FIELD */}
                              <div
                                data-daf-scroll-pane="true"
                                dir={dafVariant === 'georgian' ? 'ltr' : 'rtl'}
                                style={{
                                  fontSize: torahMainFontCss,
                                  lineHeight: dafVariant === 'georgian' ? 1.6 : 1.68,
                                  fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                                }}
                                className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 pt-4 pb-3 text-justify font-bold text-[#110C07] select-text"
                              >
                                <ReadingLineGuide
                                  initialY={34}
                                  fieldLabel={`${currentBook.nameKa} • ხუმაში`}
                                />
                                {activeMainSentences.map((sent, idx) => {
                                  const pasukNum = idx + 1;
                                  const pasukHe = numberToHebrewGematria(pasukNum);
                                  const isCrossLinked = crossHighlightedIds.has(sent.id);
                                  const isSelected =
                                    selectedTarget?.sentence?.id === sent.id ||
                                    selectedPasukNum === pasukNum;
                                  const isLineTranslated =
                                    dafVariant === 'bilingual' ||
                                    expandedLineTranslationIds.has(sent.id) ||
                                    (chumashAutoTranslateLineMode && isSelected);
                                  const isTranslatingNow = Boolean(translatingLineIds[sent.id]);
                                  const resolvedKa = resolveSentenceGeorgian(sent);

                                  const aliyahStartingHere = aliyotForCurrentParasha.find(
                                    (a) =>
                                      a.chapter === selectedChapter &&
                                      a.startPasuk === pasukNum &&
                                      pasukNum > 1
                                  );

                                  if (dafVariant === 'georgian') {
                                    return (
                                      <span
                                        key={sent.id}
                                        id={`torah-pasuk-card-${pasukNum}`}
                                        onMouseEnter={() => {
                                          setHoveredSentence(sent);
                                          void ensureSentenceTranslatedKa(sent);
                                        }}
                                        onClick={(e) => {
                                          setSelectedPasukNum(pasukNum);
                                          const rawHeb = sent.hebrewText || sent.hebrew || '';
                                          const firstWord = rawHeb.split(/\s+/)[0] || '';
                                          triggerSentenceWithSelectionOption(
                                            sent,
                                            e.currentTarget as HTMLElement,
                                            firstWord,
                                            'sentence-ka'
                                          );
                                        }}
                                        className={`inline cursor-pointer rounded-md px-1 transition-colors ${
                                          isSelected
                                            ? 'bg-amber-400/55 ring-1 ring-amber-700/40'
                                            : isCrossLinked
                                              ? 'bg-amber-400/25'
                                              : 'hover:bg-black/5'
                                        }`}
                                      >
                                        {aliyahStartingHere && (
                                          <span className="inline-block text-[0.72em] font-black px-1.5 mx-0.5 rounded bg-amber-500/25 text-[#3B2514]">
                                            [{aliyahStartingHere.nameKa}]
                                          </span>
                                        )}
                                        <sup className="font-black text-[0.72em] mr-0.5 text-[#5C3A21]">
                                          {pasukNum}
                                        </sup>
                                        <span>{resolvedKa} </span>
                                      </span>
                                    );
                                  }

                                  return (
                                    <span
                                      key={sent.id}
                                      id={`torah-pasuk-card-${pasukNum}`}
                                      onMouseEnter={() => setHoveredSentence(sent)}
                                      onDoubleClick={(e) => toggleInlineLineTranslation(sent, e)}
                                      className={`inline transition-colors rounded-md px-0.5 ${
                                        isSelected
                                          ? 'bg-amber-300/45 ring-1 ring-amber-700/35'
                                          : isCrossLinked
                                            ? 'bg-amber-300/25'
                                            : ''
                                      }`}
                                    >
                                      {aliyahStartingHere && (
                                        <span className="inline text-[0.7em] font-black px-1.5 py-0.2 mx-0.5 rounded-md bg-amber-500/20 text-[#3B2514]">
                                          ({aliyahStartingHere.badgeHe})
                                        </span>
                                      )}{' '}
                                      {pasukNum > 1 && (
                                        <span className="inline text-[0.72em] font-black text-[#5C3A21] ml-0.5 select-none">
                                          {pasukHe}
                                        </span>
                                      )}{' '}
                                      {renderPrintedInlineWords(sent, {
                                        oversizedFirstWord: idx === 0,
                                        onExtraClick: () => {
                                          setSelectedPasukNum(pasukNum);
                                          void ensureSentenceTranslatedKa(sent);
                                        },
                                      })}
                                      {isLineTranslated && (
                                        <span
                                          dir="ltr"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const rawHeb = sent.hebrewText || sent.hebrew || '';
                                            const firstWord = rawHeb.split(/\s+/)[0] || '';
                                            triggerSentenceWithSelectionOption(
                                              sent,
                                              e.currentTarget as HTMLElement,
                                              firstWord,
                                              'sentence-ka'
                                            );
                                          }}
                                          className="block my-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#F3E7CC] to-[#FAF4E6] shadow-[inset_2px_0_0_#B45309,0_1px_4px_rgba(0,0,0,0.06)] text-[0.78em] font-sans font-semibold text-[#1E130A] text-left leading-snug cursor-pointer"
                                        >
                                          <strong className="text-amber-900">{pasukNum}. </strong>
                                          {isTranslatingNow
                                            ? 'მიმდინარეობს ქართული თარგმნა...'
                                            : resolvedKa}
                                        </span>
                                      )}{' '}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* LEFT NARROW COLUMN (4 of 12 cols): TARGUM ONKELOS + TOLDOT AHARON */}
                        {!(minimizedPanes['onkelos'] && minimizedPanes['toldot']) && (
                          <div
                            className={`${
                              minimizedPanes['torah'] ? 'col-span-12' : 'col-span-4'
                            } h-full min-h-0 flex flex-col justify-between gap-2 overflow-hidden`}
                          >
                            {/* UPPER SUB-WINDOW: תרגום אונקלוס (Targum Onkelos) */}
                            <div
                              {...getPaneZoomHandlers('onkelos')}
                              onMouseEnter={() => setFocusedPaneId('onkelos')}
                              onClick={() => {
                                setFocusedPaneId('onkelos');
                                if (minimizedPanes['onkelos']) togglePaneMinimized('onkelos');
                              }}
                              className={`${
                                minimizedPanes['onkelos']
                                  ? 'h-7 shrink-0 cursor-pointer'
                                  : 'flex-1 min-h-0'
                              } rounded-2xl crystal-daf-pane ${
                                focusedPaneId === 'onkelos' ? 'crystal-daf-pane-focused' : ''
                              } flex flex-col overflow-hidden transition-all duration-200`}
                            >
                              <div className="py-1 px-2.5 crystal-daf-header flex items-center justify-center shrink-0">
                                <span
                                  style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                                  className="text-xs font-black tracking-wider text-[#110C07]"
                                >
                                  {dafVariant === 'georgian'
                                    ? 'თარგუმ ონკელოსი'
                                    : 'תרגום אונקלוס'}
                                </span>
                              </div>

                              {!minimizedPanes['onkelos'] && (
                                <div
                                  data-daf-scroll-pane="true"
                                  dir={dafVariant === 'georgian' ? 'ltr' : 'rtl'}
                                  style={{
                                    fontSize: onkelosFontCss,
                                    lineHeight: dafVariant === 'georgian' ? 1.54 : 1.58,
                                    fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                                  }}
                                  className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 pt-3.5 pb-2.5 text-justify font-semibold text-[#110C07] select-text"
                                >
                                  <ReadingLineGuide
                                    initialY={28}
                                    compact
                                    fieldLabel="თარგუმ ონკელოსი"
                                  />
                                  {activeOnkelosSentences.map((sent, idx) => {
                                    const onkPasukNum = getSentencePasukNum(sent, idx);
                                    const vLetter =
                                      sent.dibburHamatchil || numberToHebrewGematria(onkPasukNum);
                                    const isCrossLinked = crossHighlightedIds.has(sent.id);
                                    const isSelected = selectedTarget?.sentence?.id === sent.id;
                                    const isLineTranslated =
                                      dafVariant === 'bilingual' ||
                                      expandedLineTranslationIds.has(sent.id) ||
                                      (chumashAutoTranslateLineMode && isCrossLinked);
                                    const isTranslatingNow = Boolean(translatingLineIds[sent.id]);
                                    const resolvedKa = resolveSentenceGeorgian(sent);

                                    if (dafVariant === 'georgian') {
                                      return (
                                        <span
                                          key={sent.id}
                                          data-pasuk-num={onkPasukNum}
                                          onMouseEnter={() => {
                                            setHoveredSentence(sent);
                                            void ensureSentenceTranslatedKa(sent);
                                          }}
                                          onClick={(e) => {
                                            setSelectedPasukNum(onkPasukNum);
                                            const rawHeb = sent.hebrewText || sent.hebrew || '';
                                            const firstWord = rawHeb.split(/\s+/)[0] || '';
                                            triggerSentenceWithSelectionOption(
                                              sent,
                                              e.currentTarget as HTMLElement,
                                              firstWord,
                                              'sentence-ka'
                                            );
                                          }}
                                          className={`inline cursor-pointer rounded-md px-0.5 ${
                                            isSelected
                                              ? 'bg-amber-400/65 font-bold ring-1 ring-amber-700/40'
                                              : isCrossLinked
                                                ? 'bg-amber-300/55 font-bold ring-1 ring-amber-600/35'
                                                : 'hover:bg-black/5'
                                          }`}
                                        >
                                          <strong className="font-black text-[#5C3A21]">
                                            ({onkPasukNum}){' '}
                                          </strong>
                                          <span>{resolvedKa} </span>
                                        </span>
                                      );
                                    }

                                    return (
                                      <span
                                        key={sent.id}
                                        data-pasuk-num={onkPasukNum}
                                        onMouseEnter={() => setHoveredSentence(sent)}
                                        onDoubleClick={(e) => toggleInlineLineTranslation(sent, e)}
                                        className={`inline transition-colors rounded-md px-0.5 ${
                                          isSelected
                                            ? 'bg-amber-300/65 ring-1 ring-amber-700/45'
                                            : isCrossLinked
                                              ? 'bg-amber-300/45 ring-1 ring-amber-600/35'
                                              : ''
                                        }`}
                                      >
                                        <span className="font-black text-[0.88em] text-[#5C3A21] ml-0.5">
                                          {vLetter}
                                        </span>{' '}
                                        {renderPrintedInlineWords(sent, {
                                          onExtraClick: () => {
                                            setSelectedPasukNum(onkPasukNum);
                                            void ensureSentenceTranslatedKa(sent);
                                          },
                                        })}
                                        {isLineTranslated && (
                                          <span
                                            dir="ltr"
                                            className="block my-0.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#F3E7CC] to-[#FAF4E6] shadow-[inset_2px_0_0_#B45309] text-[0.85em] font-sans text-left"
                                          >
                                            {isTranslatingNow
                                              ? 'მიმდინარეობს თარგმნა...'
                                              : resolvedKa}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* LOWER SUB-WINDOW OF LEFT COLUMN: תולדות אהרן (Toldot Aharon) */}
                            <div
                              {...getPaneZoomHandlers('toldot')}
                              onMouseEnter={() => setFocusedPaneId('toldot')}
                              onClick={() => {
                                setFocusedPaneId('toldot');
                                if (minimizedPanes['toldot']) togglePaneMinimized('toldot');
                              }}
                              className={`${
                                minimizedPanes['toldot']
                                  ? 'h-6 shrink-0 cursor-pointer'
                                  : minimizedPanes['onkelos']
                                    ? 'flex-1 min-h-0'
                                    : 'h-[84px] shrink-0'
                              } rounded-2xl crystal-daf-pane ${
                                focusedPaneId === 'toldot' ? 'crystal-daf-pane-focused' : ''
                              } flex flex-col overflow-hidden transition-all duration-200`}
                            >
                              <div className="py-0.5 px-2 crystal-daf-header flex items-center justify-center shrink-0">
                                <span
                                  style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                                  className="text-[11px] font-black tracking-wider text-[#110C07]"
                                >
                                  תולדות אהרן
                                </span>
                              </div>
                              {!minimizedPanes['toldot'] && (
                                <div
                                  dir="rtl"
                                  style={{
                                    fontSize: toldotFontCss,
                                    lineHeight: 1.5,
                                    fontFamily: showRashiScript
                                      ? "'Noto Rashi Hebrew', 'Frank Ruhl Libre', serif"
                                      : "'Frank Ruhl Libre', 'David Libre', serif",
                                  }}
                                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-2.5 pt-2.5 pb-2 text-justify text-[#110C07]"
                                >
                                  {renderPrintedInlineWords(toldotAharonSentence, {
                                    isRashiFont: true,
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ----------------------------------------------------------- */}
                      {/* TIER 2 (MIDDLE TIER): RASHI COMMENTARY (פירש״י) IN 2 COLS    */}
                      {/* ----------------------------------------------------------- */}
                      <div
                        {...getPaneZoomHandlers('rashi')}
                        onMouseEnter={() => setFocusedPaneId('rashi')}
                        onClick={() => {
                          setFocusedPaneId('rashi');
                          if (minimizedPanes['rashi']) togglePaneMinimized('rashi');
                        }}
                        className={`${
                          minimizedPanes['rashi']
                            ? 'h-8 shrink-0 cursor-pointer'
                            : 'flex-[30] min-h-0'
                        } w-full rounded-2xl crystal-daf-pane ${
                          focusedPaneId === 'rashi' ? 'crystal-daf-pane-focused' : ''
                        } flex flex-col overflow-hidden transition-all duration-200`}
                      >
                        {/* Clean Centered פירש״י Banner */}
                        <div
                          dir="rtl"
                          className="py-1 px-3 flex items-center justify-center crystal-daf-header shrink-0"
                        >
                          <span
                            style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                            className="text-base font-black tracking-[0.18em] text-[#110C07]"
                          >
                            {dafVariant === 'georgian' ? 'פירש״י • რაშის კომენტარი' : 'פירש״י'}
                            {minimizedPanes['rashi'] ? ' (ჩაკეცილია)' : ''}
                          </span>
                        </div>

                        {!minimizedPanes['rashi'] && (
                          <div
                            dir="rtl"
                            className="flex-1 min-h-0 grid grid-cols-2 gap-3 px-2.5 py-1.5 overflow-hidden"
                          >
                            {/* Right Scrollable Column of Rashi */}
                            <div
                              data-daf-scroll-pane="true"
                              className="relative h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y pl-2 pr-1 pt-3 pb-2.5 border-l border-[#8B5A2B]/12"
                            >
                              <ReadingLineGuide
                                initialY={28}
                                compact
                                fieldLabel="რაშის კომენტარი (მარჯვენა სვეტი)"
                              />
                              {renderContinuousCommentaryColumn(
                                rashiRightColSentences,
                                rashiFontCss,
                                connectedCommentariesForSelectedPasuk.rashiMatches
                              )}
                            </div>

                            {/* Left Scrollable Column of Rashi */}
                            <div
                              data-daf-scroll-pane="true"
                              className="relative h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y pr-2 pl-1 pt-3 pb-2.5"
                            >
                              <ReadingLineGuide
                                initialY={28}
                                compact
                                fieldLabel="რაშის კომენტარი (მარცხენა სვეტი)"
                              />
                              {renderContinuousCommentaryColumn(
                                rashiLeftColSentences,
                                rashiFontCss
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ----------------------------------------------------------- */}
                      {/* TIER 3 (LOWER TIER): בעל הטורים (Right) & שפתי חכמים (Left) */}
                      {/* ----------------------------------------------------------- */}
                      <div
                        dir="rtl"
                        className={`${
                          minimizedPanes['lower-right'] && minimizedPanes['lower-left']
                            ? 'h-8 shrink-0'
                            : 'flex-[22] min-h-0'
                        } grid grid-cols-2 gap-2 overflow-hidden transition-all duration-200`}
                      >
                        {/* Right Lower Window: בעל הטורים / רמב״ן */}
                        <div
                          {...getPaneZoomHandlers('lower-right')}
                          onMouseEnter={() => setFocusedPaneId('lower-right')}
                          onClick={() => {
                            setFocusedPaneId('lower-right');
                            if (minimizedPanes['lower-right']) togglePaneMinimized('lower-right');
                          }}
                          className={`${
                            minimizedPanes['lower-right']
                              ? 'h-8 shrink-0 cursor-pointer'
                              : 'h-full min-h-0'
                          } rounded-2xl crystal-daf-pane ${
                            focusedPaneId === 'lower-right' ? 'crystal-daf-pane-focused' : ''
                          } flex flex-col overflow-hidden transition-all duration-200`}
                        >
                          <div className="py-1 px-2.5 crystal-daf-header flex items-center justify-center shrink-0">
                            <span
                              style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                              className="text-xs font-black tracking-wider text-[#110C07]"
                            >
                              {lowerRightTab === 'baal-haturim'
                                ? dafVariant === 'georgian'
                                  ? 'ბაალ ჰატურიმი'
                                  : 'בעל הטורים'
                                : dafVariant === 'georgian'
                                  ? 'რამბანი'
                                  : 'רמב״ן'}
                              {minimizedPanes['lower-right'] ? ' (ჩაკეცილია)' : ''}
                            </span>
                          </div>

                          {!minimizedPanes['lower-right'] && (
                            <div
                              data-daf-scroll-pane="true"
                              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 pt-3.5 pb-2.5"
                            >
                              <ReadingLineGuide
                                initialY={26}
                                compact
                                fieldLabel={
                                  lowerRightTab === 'baal-haturim' ? 'ბაალ ჰატურიმი' : 'რამბანი'
                                }
                              />
                              {renderContinuousCommentaryColumn(
                                lowerRightTab === 'baal-haturim'
                                  ? activeBaalHaTurimSentences
                                  : activeRambanSentences,
                                lowerRightFontCss,
                                lowerRightTab === 'baal-haturim'
                                  ? connectedCommentariesForSelectedPasuk.baalHaTurimMatches
                                  : connectedCommentariesForSelectedPasuk.rambanMatches
                              )}
                            </div>
                          )}
                        </div>

                        {/* Left Lower Window: שפתי חכמים / אבן עזרא */}
                        <div
                          {...getPaneZoomHandlers('lower-left')}
                          onMouseEnter={() => setFocusedPaneId('lower-left')}
                          onClick={() => {
                            setFocusedPaneId('lower-left');
                            if (minimizedPanes['lower-left']) togglePaneMinimized('lower-left');
                          }}
                          className={`${
                            minimizedPanes['lower-left']
                              ? 'h-8 shrink-0 cursor-pointer'
                              : 'h-full min-h-0'
                          } rounded-2xl crystal-daf-pane ${
                            focusedPaneId === 'lower-left' ? 'crystal-daf-pane-focused' : ''
                          } flex flex-col overflow-hidden transition-all duration-200`}
                        >
                          <div className="py-1 px-2.5 crystal-daf-header flex items-center justify-center shrink-0">
                            <span
                              style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                              className="text-xs font-black tracking-wider text-[#110C07]"
                            >
                              {lowerLeftTab === 'siftei'
                                ? dafVariant === 'georgian'
                                  ? 'სიფთეი ხახამიმი'
                                  : 'שפתי חכמים'
                                : dafVariant === 'georgian'
                                  ? 'იბნ ეზრა'
                                  : 'אבן עזרא'}
                              {minimizedPanes['lower-left'] ? ' (ჩაკეცილია)' : ''}
                            </span>
                          </div>

                          {!minimizedPanes['lower-left'] && (
                            <div
                              data-daf-scroll-pane="true"
                              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 pt-3.5 pb-2.5"
                            >
                              <ReadingLineGuide
                                initialY={26}
                                compact
                                fieldLabel={
                                  lowerLeftTab === 'siftei' ? 'სიფთეი ხახამიმი' : 'იბნ ეზრა'
                                }
                              />
                              {renderContinuousCommentaryColumn(
                                lowerLeftTab === 'siftei'
                                  ? activeSifteiChachamimSentences
                                  : activeIbnEzraSentences,
                                lowerLeftFontCss,
                                lowerLeftTab === 'siftei'
                                  ? connectedCommentariesForSelectedPasuk.sifteiMatches
                                  : connectedCommentariesForSelectedPasuk.ibnEzraMatches
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </PageFlip3DWrapper>

      {/* BACKDROP WHEN UNIFIED STRETCHING BOTTOM PANEL IS EXPANDED */}
      <AnimatePresence>
        {isBottomSheetExpanded && (
          <motion.div
            key="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsBottomSheetExpanded(false)}
            className="fixed inset-0 z-[215] bg-black/55 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* SINGLE UNIFIED STRETCHING BOTTOM PANEL (თვითონ პანელი იწელება ზემოთ!) */}
      {/* Includes:                                                             */}
      {/* 1) Dynamic Windows Expand/Collapse Controls for the focused field     */}
      {/* 2) Always-visible Daf Page-Turning Buttons (წინა დაფი / შემდეგი დაფი) */}
      {/* 3) Smoothly stretching body with 5 filterable selectors               */}
      {/* ===================================================================== */}
      <nav
        data-modern-dock="true"
        aria-label="თორის დაფის ქვედა მართვის პანელი"
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            bottomBarTouchRef.current = {
              startY: e.touches[0].clientY,
              startX: e.touches[0].clientX,
            };
          }
        }}
        onTouchEnd={(e) => {
          if (!bottomBarTouchRef.current || e.changedTouches.length !== 1) return;
          const dy = e.changedTouches[0].clientY - bottomBarTouchRef.current.startY;
          const dx = e.changedTouches[0].clientX - bottomBarTouchRef.current.startX;
          bottomBarTouchRef.current = null;
          if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0 && !isBottomSheetExpanded) {
              setIsBottomSheetExpanded(true);
            } else if (dy > 0 && isBottomSheetExpanded) {
              setIsBottomSheetExpanded(false);
            }
          }
        }}
        className="fixed bottom-0 left-0 right-0 z-[220] pointer-events-none flex justify-center px-1.5 sm:px-4"
      >
        <motion.div
          layout
          transition={{
            layout: { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 },
          }}
          style={{
            pointerEvents: 'auto',
          }}
          className="w-full max-w-[900px] rounded-t-[24px] crystal-panel-dark overflow-hidden select-none"
        >
          {/* TOP STRETCH HANDLE PILL */}
          <div
            onClick={() => setIsBottomSheetExpanded((v) => !v)}
            className="w-full flex justify-center pt-1.5 pb-0.5 cursor-pointer group"
            title={
              isBottomSheetExpanded
                ? 'პანელის ჩაკეცვა'
                : 'პანელის ზემოთ გაწელვა / ამოწევა'
            }
          >
            <div className="w-10 h-1 rounded-full bg-sky-900/20 group-hover:bg-amber-500 transition-colors duration-300" />
          </div>

          {/* SINGLE-LINE BOTTOM DOCK BAR: STATIC PAGE-TURN BUTTONS ON ENDS + SLIDING ICON-ONLY BUTTONS IN MIDDLE */}
          <div className="px-2.5 sm:px-3.5 pb-2 pt-1 flex items-center justify-between gap-2">
            {/* LEFT STATIC PAGE-TURNING BUTTON (წინა დაფი — მხოლოდ აიკონი, მშვიდი ფერები) */}
            <button
              type="button"
              data-flat-btn="true"
              onClick={handlePrevPage}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                isDark
                  ? 'bg-[#2A1D15] hover:bg-[#3D2B1F] text-[#FAF5EB] border-[#C49A6C]/50'
                  : 'bg-[#FAF5EB] hover:bg-[#F2E5D0] text-[#2C1D11] border-[#8B5A2B]/45'
              }`}
              title="წინა დაფზე / თავზე გადაფურცვლა"
              aria-label="წინა დაფი"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.25] shrink-0" />
            </button>

            {/* MIDDLE HORIZONTALLY SLIDING ICON-ONLY BUTTONS TRACK (აქეთ-იქით დაცურავს, მშვიდი სამეფო ფერები) */}
            <div
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 px-1 py-0.5 touch-pan-x scroll-smooth"
            >
              {/* 1. Stretch / Expand Panel Upward Button */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => setIsBottomSheetExpanded((v) => !v)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isBottomSheetExpanded
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title={
                  isBottomSheetExpanded
                    ? 'პანელის ჩაკეცვა'
                    : `${currentBook.nameKa} • თავი ${selectedChapter} — პანელის ზემოთ გაწელვა`
                }
                aria-label="პანელის გაშლა"
              >
                <ChevronUp
                  className={`w-4 h-4 stroke-[2.5] transition-transform duration-300 ${
                    isBottomSheetExpanded ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              {/* 2. Active-Field Windows Collapse / Minimize Button */}
              {focusedPaneMeta && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={() => {
                    if (maximizedPaneId === focusedPaneMeta.id) {
                      setMaximizedPaneId(null);
                    }
                    togglePaneMinimized(focusedPaneMeta.id);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border shrink-0 relative shadow-xs ${
                    minimizedPanes[focusedPaneMeta.id]
                      ? isDark
                        ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                        : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                      : isDark
                        ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                        : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title={
                    minimizedPanes[focusedPaneMeta.id]
                      ? `${focusedPaneMeta.titleKa} (${focusedPaneMeta.titleHe}) — ჩაკეცილი ველის აღდგენა`
                      : `${focusedPaneMeta.titleKa} (${focusedPaneMeta.titleHe}) — ამ ველის ჩაკეცვა (Windows Minimize)`
                  }
                  aria-label="ველის ჩაკეცვა"
                >
                  <span className="font-bold text-sm leading-none">─</span>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C49A6C]" />
                </button>
              )}

              {/* 3. Active-Field Windows Expand / Maximize on Daf Button */}
              {focusedPaneMeta && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={() => {
                    setMinimizedPanes((prev) => ({
                      ...prev,
                      [focusedPaneMeta.id]: false,
                    }));
                    setMaximizedPaneId((prev) =>
                      prev === focusedPaneMeta.id ? null : focusedPaneMeta.id
                    );
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border shrink-0 relative shadow-xs ${
                    maximizedPaneId === focusedPaneMeta.id
                      ? isDark
                        ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                        : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                      : isDark
                        ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                        : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title={
                    maximizedPaneId === focusedPaneMeta.id
                      ? `${focusedPaneMeta.titleKa} (${focusedPaneMeta.titleHe}) — მრავალფანჯრიან დაფზე დაბრუნება`
                      : `${focusedPaneMeta.titleKa} (${focusedPaneMeta.titleHe}) — ამ ველის გაშლა მთელ დაფზე (Windows Expand)`
                  }
                  aria-label="ველის გაშლა"
                >
                  {maximizedPaneId === focusedPaneMeta.id ? (
                    <Minimize2 className="w-3.5 h-3.5 stroke-[2.25]" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 stroke-[2.25]" />
                  )}
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C49A6C]" />
                </button>
              )}

              {/* 4. Active-Field Fullscreen Modal Button */}
              {focusedPaneMeta && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={() =>
                    openPaneFullScreenModal(
                      focusedPaneMeta.titleKa,
                      focusedPaneMeta.titleHe,
                      focusedPaneMeta.sentences
                    )
                  }
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title={`${focusedPaneMeta.titleKa} (${focusedPaneMeta.titleHe}) — სრულ ეკრანზე გახსნა`}
                  aria-label="სრულ ეკრანზე გახსნა"
                >
                  <span className="text-sm leading-none">⛶</span>
                </button>
              )}

              {/* 5. Active-Field Font Zoom Out (A-) */}
              {focusedPaneMeta && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={() => adjustPaneZoom(focusedPaneMeta.id, -10)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title={`${focusedPaneMeta.titleKa} — შრიფტის დაპატარავება`}
                  aria-label="შრიფტის დაპატარავება"
                >
                  <ZoomOut className="w-4 h-4 shrink-0" />
                </button>
              )}

              {/* 6. Active-Field Font Zoom In (A+) */}
              {focusedPaneMeta && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={() => adjustPaneZoom(focusedPaneMeta.id, 10)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title={`${focusedPaneMeta.titleKa} — შრიფტის გადიდება`}
                  aria-label="შრიფტის გადიდება"
                >
                  <ZoomIn className="w-4 h-4 shrink-0" />
                </button>
              )}

              {/* 7. Fit Daf to Screen / Width Toggle */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => {
                  setDafFitMode((prev) =>
                    prev === 'fit-screen' ? 'fit-width' : 'fit-screen'
                  );
                  setPinchZoomScale(100);
                  setDafPan({ x: 0, y: 0 });
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  dafFitMode === 'fit-screen'
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="დაფის მორგება ეკრანზე (Fit ეკრანზე)"
                aria-label="დაფის მორგება ეკრანზე"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
              </button>

              {/* 8. Pan / Move Mode Toggle */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => setIsDafPanMode((v) => !v)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isDafPanMode
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="დაფის გადაადგილების რეჟიმი (Pan)"
                aria-label="დაფის გადაადგილება"
              >
                <Move className="w-4 h-4 shrink-0" />
              </button>

              {/* 9. Georgian Translation Mode Cycle */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => {
                  setIsShnayimMikra(false);
                  if (dafVariant === 'hebrew' && !chumashAutoTranslateLineMode) {
                    setChumashAutoTranslateLineMode(true);
                    setShowReadingGuideBar(true);
                  } else if (chumashAutoTranslateLineMode && dafVariant === 'hebrew') {
                    setDafVariant('bilingual');
                  } else if (dafVariant === 'bilingual') {
                    setDafVariant('georgian');
                  } else {
                    setDafVariant('hebrew');
                    setChumashAutoTranslateLineMode(false);
                    setShowReadingGuideBar(false);
                  }
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  dafVariant !== 'hebrew' || chumashAutoTranslateLineMode
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="ქართული თარგმანის ჩართვა / რეჟიმის შეცვლა"
                aria-label="ქართული თარგმანი"
              >
                <Languages className="w-4 h-4 shrink-0" />
              </button>

              {/* 10. All Meforshim / Commentators Modal */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => {
                  setIsBottomSheetExpanded(false);
                  setIsMeforshimModalOpen(true);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isDark
                    ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                    : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="ყველა მეფარშიმი / კომენტატორები"
                aria-label="მეფარშიმი"
              >
                <Layers className="w-4 h-4 shrink-0" />
              </button>

              {/* 11. Search / Filter Selectors Toggle */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => setIsBottomSheetExpanded((v) => !v)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isBottomSheetExpanded
                    ? isDark
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                      : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="ძიება და სარჩევი"
                aria-label="ძიება"
              >
                <Search className="w-4 h-4 shrink-0" />
              </button>

              {/* 12. AI Analysis / Smart Navigation */}
              {onOpenAiNav && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={onOpenAiNav}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#6B4226] border-[#8B5A2B]/35'
                  }`}
                  title="AI ანალიზი და ჭკვიანი ძიება"
                  aria-label="AI ანალიზი"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                </button>
              )}

              {/* 13. Voice Navigation */}
              {onOpenVoiceNav && (
                <button
                  type="button"
                  data-flat-btn="true"
                  onClick={onOpenVoiceNav}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                  }`}
                  title="ხმოვანი ნავიგაცია"
                  aria-label="ხმოვანი ნავიგაცია"
                >
                  <Mic className="w-4 h-4 shrink-0" />
                </button>
              )}

              {/* 14. Reset All Zoom & Pan to 100% */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={() => {
                  setPinchZoomScale(100);
                  setDafPan({ x: 0, y: 0 });
                  if (focusedPaneMeta) adjustPaneZoom(focusedPaneMeta.id, 'reset');
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isDark
                    ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                    : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title="საწყის ზომაზე და პოზიციაზე დაბრუნება (100%)"
                aria-label="საწყის ზომაზე დაბრუნება"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
              </button>

              {/* 15. Toggle Chapter/Daf Completed */}
              <button
                type="button"
                data-flat-btn="true"
                onClick={handleToggleTorahChapterCompleted}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                  isCurrentTorahChapterCompleted
                    ? 'bg-[#2C4D38] text-[#FAF5EB] border-[#5E9470]'
                    : isDark
                      ? 'bg-[#24170F]/85 hover:bg-[#332216] text-[#E8D8BE] border-[#5C3A21]'
                      : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] text-[#2C1A10] border-[#8B5A2B]/35'
                }`}
                title={
                  isCurrentTorahChapterCompleted
                    ? 'დაფი / თავი შესწავლილია ✓'
                    : 'მონიშნე შესწავლილად (Completed)'
                }
                aria-label="მონიშნე შესწავლილად"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* RIGHT STATIC PAGE-TURNING BUTTON (შემდეგი დაფი — მხოლოდ აიკონი, მშვიდი ფერები) */}
            <button
              type="button"
              data-flat-btn="true"
              onClick={handleNextPage}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs ${
                isDark
                  ? 'bg-[#2A1D15] hover:bg-[#3D2B1F] text-[#FAF5EB] border-[#C49A6C]/50'
                  : 'bg-[#FAF5EB] hover:bg-[#F2E5D0] text-[#2C1D11] border-[#8B5A2B]/45'
              }`}
              title="შემდეგ დაფზე / თავზე გადაფურცვლა"
              aria-label="შემდეგი დაფი"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.25] shrink-0" />
            </button>
          </div>

          {/* EXPANDING BODY OF THE SAME UNIFIED PANEL (SPRING PHYSICS + SLEEK MODERN FILTERING) */}
          <AnimatePresence initial={false}>
            {isBottomSheetExpanded && (
              <motion.div
                key="torah-panel-stretching-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 },
                  opacity: { duration: 0.2, ease: 'easeOut' },
                }}
                className={`overflow-hidden border-t ${
                  isDark ? 'border-[#C49A6C]/35' : 'border-[#8B5A2B]/30'
                }`}
              >
                <div className="px-3.5 sm:px-5 py-3.5 flex flex-col gap-3">
                  {/* ROW 1: MODERN INSTANT TEXT SEARCH & VOICE SEARCH BAR */}
                  <div className="flex flex-col gap-2">
                    <div
                      className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all ${
                        isDark
                          ? 'bg-[#22160F] border-[#5C3A21] focus-within:border-[#C49A6C] focus-within:ring-2 focus-within:ring-[#C49A6C]/20'
                          : 'bg-[#FFFDF8] border-[#8B5A2B]/45 focus-within:border-[#8B5A2B] focus-within:ring-2 focus-within:ring-[#8B5A2B]/15'
                      }`}
                    >
                      <Search
                        className={`w-4 h-4 shrink-0 ${
                          isDark ? 'text-[#C49A6C]' : 'text-[#8B5A2B]'
                        }`}
                      />
                      <input
                        type="text"
                        value={cascadeSearchQuery}
                        onChange={(e) => setCascadeSearchQuery(e.target.value)}
                        placeholder="ძიება ტექსტში, ფარაშაში ან მუხლში (ქართულად / ებრაულად)..."
                        className={`flex-1 min-w-0 bg-transparent text-xs font-medium outline-none ${
                          isDark ? 'text-[#FAF5EB] placeholder:text-[#E8D8BE]/50' : 'text-[#21140B] placeholder:text-[#8C6239]/60'
                        }`}
                      />
                      {cascadeSearchQuery && (
                        <button
                          type="button"
                          data-flat-btn="true"
                          onClick={() => setCascadeSearchQuery('')}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
                          title="ძიების გასუფთავება"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <VoiceSearchMicButton
                        onTranscript={(spoken) => setCascadeSearchQuery(spoken)}
                        size="sm"
                        isDark={isDark}
                      />
                    </div>

                    {/* Instant Search Results Strip when user types or speaks */}
                    {cascadeSearchQuery.trim().length > 0 && (
                      <div
                        className={`border rounded-xl p-2 max-h-36 overflow-y-auto flex flex-col gap-1 ${
                          isDark
                            ? 'bg-[#20150E] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-[#FAF5EB] border-[#8B5A2B]/40 text-[#21140B]'
                        }`}
                      >
                        <div className="text-[10.5px] font-bold text-slate-500 px-1 flex items-center justify-between">
                          <span>ნაპოვნი მუხლები და ფარაშები ({filteredPesukim.length + filteredParshiotForBook.length})</span>
                          <span>დააჭირეთ გადასასვლელად</span>
                        </div>
                        {filteredParshiotForBook.slice(0, 4).map((p) => (
                          <button
                            key={`search-parasha-${p.id}`}
                            type="button"
                            data-flat-btn="true"
                            onClick={() => {
                              setSelectedParashaId(p.id);
                              const chNum = parseInt(p.startRef, 10) || 1;
                              setPageTurnDirection(chNum >= selectedChapter ? 1 : -1);
                              setSelectedChapter(chNum);
                              setSelectedAliyahId('kohen');
                              setSelectedPasukNum(1);
                              setCascadeSearchQuery('');
                              setIsBottomSheetExpanded(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/15 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-[#0F1E36] truncate">
                              ფარაშა: {p.nameKa} (თავი {p.startRef})
                            </span>
                            <span dir="rtl" className="font-serif font-bold text-[#92400E] shrink-0">
                              {p.nameHe}
                            </span>
                          </button>
                        ))}
                        {filteredPesukim.slice(0, 8).map((p) => (
                          <button
                            key={`search-pasuk-${p.num}`}
                            type="button"
                            data-flat-btn="true"
                            onClick={() => {
                              scrollToPasuk(p.num);
                              setIsBottomSheetExpanded(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/15 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-[#1E334C] truncate flex-1">
                              მუხლი {p.num}: {p.georgian}
                            </span>
                            <span dir="rtl" className="font-serif text-[11px] font-bold text-[#0F1E36] truncate max-w-[42%]">
                              ({p.gem}) {p.hebrew}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* UNIFIED MULTI-COLUMN MASTER FILTERING MECHANISM (მრავალსვეტიანი ჭკვიანი გაფილტვრა — მშვიდი სამეფო ფერები) */}
                  <div className="space-y-2.5 pt-1">
                    {/* COLUMN 1 & DISPLAY MODES: 5 CHUMASH BOOKS SEGMENTED TRACK + 4-WAY TEXT MODE SWITCHER */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      {/* 5 Books of Moses in Calm Sanctuary Leather Palette */}
                      <div
                        className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto no-scrollbar flex-1 min-w-0 ${
                          isDark
                            ? 'bg-[#22160F]/90 border-[#5C3A21]'
                            : 'bg-[#EFE3CF] border-[#8B5A2B]/40'
                        }`}
                      >
                        {TORAH_BOOKS.map((b) => {
                          const isBookActive = currentBook.id === b.id;
                          const shortKa = CHUMASH_LEATHER_THEMES[b.id]?.shortKa || b.nameKa.split(' ')[0];
                          const shortHe = CHUMASH_LEATHER_THEMES[b.id]?.shortHe || b.nameHe;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              data-flat-btn="true"
                              onClick={() => {
                                setSelectedBookId(b.id);
                                setSelectedChapter(1);
                                setSelectedParashaId(b.parshiot?.[0]?.id || 'bereshit');
                                setSelectedAliyahId('kohen');
                                setSelectedPasukNum(1);
                              }}
                              className={`flex-1 min-w-[70px] px-2 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap border ${
                                isBookActive
                                  ? isDark
                                    ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-sm'
                                    : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-sm'
                                  : isDark
                                    ? 'text-[#E8D8BE] hover:text-white hover:bg-white/5 border-transparent'
                                    : 'text-[#2C1A10] hover:text-black hover:bg-black/5 border-transparent'
                              }`}
                            >
                              <span dir="rtl" className="font-serif font-black text-xs">
                                {shortHe}
                              </span>
                              <span>{shortKa}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Calm 4-Way Display Mode Switcher */}
                      <div
                        className={`p-1 rounded-xl border grid grid-cols-4 gap-1 w-full sm:w-auto shrink-0 ${
                          isDark
                            ? 'bg-[#22160F]/90 border-[#5C3A21]'
                            : 'bg-[#EFE3CF] border-[#8B5A2B]/40'
                        }`}
                      >
                        {[
                          {
                            id: 'hebrew',
                            label: 'עברית',
                            active: dafVariant === 'hebrew' && !isShnayimMikra,
                            onClick: () => {
                              setIsShnayimMikra(false);
                              setDafVariant('hebrew');
                            },
                          },
                          {
                            id: 'bilingual',
                            label: 'עב+ქარ',
                            active: dafVariant === 'bilingual' && !isShnayimMikra,
                            onClick: () => {
                              setIsShnayimMikra(false);
                              setDafVariant('bilingual');
                            },
                          },
                          {
                            id: 'georgian',
                            label: 'ქართული',
                            active: dafVariant === 'georgian' && !isShnayimMikra,
                            onClick: () => {
                              setIsShnayimMikra(false);
                              setDafVariant('georgian');
                            },
                          },
                          {
                            id: 'shnayim',
                            label: '2×+1×',
                            active: isShnayimMikra,
                            onClick: () => setIsShnayimMikra((v) => !v),
                          },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            data-flat-btn="true"
                            onClick={item.onClick}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                              item.active
                                ? isDark
                                  ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-sm'
                                  : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-sm'
                                : isDark
                                  ? 'text-[#E8D8BE] hover:text-white hover:bg-white/5 border-transparent'
                                  : 'text-[#2C1A10] hover:text-black hover:bg-black/5 border-transparent'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SYMMETRICAL 4-COLUMN MODERN FILTER SELECTORS (PARASHA, ALIYAH, CHAPTER, PASUK — FULL WIDTH) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                      <div className="w-full min-w-0">
                        <SearchableSelect
                          label="ყველა ფარაშა (54 פרשות)"
                          value={`${currentBook.id}::${currentParasha.id}`}
                          onChange={(compoundVal) => {
                            const [bookId, parashaId] = compoundVal.split('::');
                            if (bookId && parashaId) {
                              const targetBook = TORAH_BOOKS.find((b) => b.id === bookId);
                              if (targetBook) {
                                setSelectedBookId(targetBook.id);
                                const targetP = (targetBook.parshiot || []).find((p) => p.id === parashaId);
                                if (targetP) {
                                  setSelectedParashaId(targetP.id);
                                  const chNum = parseInt(targetP.startRef, 10) || 1;
                                  setPageTurnDirection(chNum >= selectedChapter ? 1 : -1);
                                  setSelectedChapter(chNum);
                                  setSelectedAliyahId('kohen');
                                  setSelectedPasukNum(1);
                                }
                              }
                            }
                          }}
                          options={all54ParashaOptions}
                          placeholder="ყველა ფარაშა (მოძებნეთ)..."
                          variant="modern"
                          isDark={isDark}
                          compact
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <SearchableSelect
                          label="ალია / ფასუკი"
                          value={selectedAliyahId}
                          onChange={(aliyahId) => {
                            const found = aliyotForCurrentParasha.find((a) => a.id === aliyahId);
                            if (found) {
                              setSelectedAliyahId(found.id);
                              setPageTurnDirection(found.chapter >= selectedChapter ? 1 : -1);
                              setSelectedChapter(found.chapter);
                              scrollToPasuk(found.startPasuk);
                            }
                          }}
                          options={aliyotForCurrentParasha.map((a) => ({
                            value: a.id,
                            badgeHe: a.badgeHe,
                            label: a.nameKa,
                          }))}
                          placeholder="აირჩიეთ ალია..."
                          variant="modern"
                          isDark={isDark}
                          compact
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <SearchableSelect
                          label="ფერეკი / თავი"
                          value={String(selectedChapter)}
                          onChange={(chStr) => {
                            const chNum = parseInt(chStr, 10) || 1;
                            setPageTurnDirection(chNum >= selectedChapter ? 1 : -1);
                            setSelectedChapter(chNum);
                            setSelectedPasukNum(1);
                          }}
                          options={Array.from({ length: currentBook.chaptersCount }, (_, i) => ({
                            value: String(i + 1),
                            badgeHe: numberToHebrewGematria(i + 1),
                            label: `თავი ${i + 1}`,
                          }))}
                          placeholder="აირჩიეთ თავი..."
                          variant="modern"
                          isDark={isDark}
                          compact
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <SearchableSelect
                          label="ფასუკი / მუხლი"
                          value={String(selectedPasukNum)}
                          onChange={(pStr) => {
                            const pNum = parseInt(pStr, 10) || 1;
                            scrollToPasuk(pNum);
                            setIsBottomSheetExpanded(false);
                          }}
                          options={activeMainSentences.map((s, idx) => ({
                            value: String(idx + 1),
                            badgeHe: numberToHebrewGematria(idx + 1),
                            label: `მუხლი ${idx + 1} — ${(s.hebrewText || s.hebrew || '').slice(0, 22)}`,
                          }))}
                          placeholder="აირჩიეთ მუხლი..."
                          variant="modern"
                          isDark={isDark}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </nav>

      {/* ALL TORAH MEFORSHIM / COMMENTARIES MODAL (ყველა მეფარშიმი / თორის კომენტარები) */}
      <AnimatePresence>
        {isMeforshimModalOpen && (
          <motion.div
            key="torah-meforshim-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMeforshimModalOpen(false)}
            className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.97, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[90dvh] rounded-3xl crystal-daf-folio flex flex-col overflow-hidden"
            >
              {/* Clean Single-Line Header */}
              <div
                className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between gap-2 shrink-0 ${
                  isDark ? 'bg-[#261910] border-[#C49A6C]/35' : 'bg-[#EFE2C8] border-[#8B5A2B]/30'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-xs sm:text-sm font-black truncate ${
                      isDark ? 'text-[#FAF5EB]' : 'text-[#21140B]'
                    }`}
                  >
                    თორის მეფარშიმი • {currentBook.nameKa} ({currentParasha.nameKa}, თავი {selectedChapter})
                  </h3>
                </div>
                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={() => setIsMeforshimModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#5C3A21] hover:bg-[#6E472B] border border-[#C49A6C]/50 text-[#FAF5EB] flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                  title="დახურვა"
                  aria-label="დახურვა"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Filter & Search Bar inside Meforshim Modal */}
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {[
                      { id: 'all', label: 'ყველა' },
                      { id: 'რაში', label: 'רש״י • რაში' },
                      { id: 'ონკელოსი', label: 'אונקלוס • ონკელოსი' },
                      { id: 'ბაალ ჰატურიმი', label: 'בעל הטורים • ბაალ ჰატურიმი' },
                      { id: 'სიფთეი', label: 'שפתי חכמים • სიფთეი' },
                      { id: 'რამბანი', label: 'רמב״ן • რამბანი' },
                      { id: 'იბნ ეზრა', label: 'אבן עזרא • იბნ ეზრა' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        data-raw-btn="true"
                        onClick={() => setSelectedMeforeshFilter(tab.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border cursor-pointer whitespace-nowrap transition-all ${
                          selectedMeforeshFilter === tab.id
                            ? isDark
                              ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-2xs'
                              : 'bg-[#8C6239] text-[#FAF5EB] border-[#4A2E1B] shadow-2xs'
                            : isDark
                              ? 'bg-[#24170F]/85 hover:bg-[#332216] border-[#5C3A21] text-[#E8D8BE]'
                              : 'bg-[#FFFDF8] hover:bg-[#F2E5D0] border-[#8B5A2B]/40 text-[#2C1A10]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 min-w-[200px] flex-1 sm:flex-none px-2.5 py-1 rounded-xl border ${
                      isDark
                        ? 'bg-[#22160F] border-[#5C3A21] text-[#FAF5EB]'
                        : 'bg-[#FFFDF8] border-[#8B5A2B]/45 text-[#21140B]'
                    }`}
                  >
                    <Search
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isDark ? 'text-[#C49A6C]' : 'text-[#8B5A2B]'
                      }`}
                    />
                    <input
                      type="text"
                      value={meforshimSearch}
                      onChange={(e) => setMeforshimSearch(e.target.value)}
                      placeholder="ძიება..."
                      className="flex-1 min-w-0 bg-transparent text-xs font-bold text-[#0F1E36] placeholder:text-slate-400 outline-none"
                    />
                    <VoiceSearchMicButton
                      onTranscript={(spoken) => setMeforshimSearch(spoken)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Commentator Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
                  {allMeforshimCards
                    .filter((c) => {
                      if (
                        selectedMeforeshFilter !== 'all' &&
                        !c.commentatorKa.includes(selectedMeforeshFilter)
                      ) {
                        return false;
                      }
                      if (meforshimSearch.trim()) {
                        const q = meforshimSearch.trim().toLowerCase();
                        return (
                          c.commentatorKa.toLowerCase().includes(q) ||
                          c.georgian.toLowerCase().includes(q) ||
                          c.hebrew.includes(meforshimSearch.trim())
                        );
                      }
                      return true;
                    })
                    .map((card) => (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl crystal-daf-pane flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-sky-200/70">
                            <span className="text-xs font-extrabold text-[#92400E]">
                              {card.commentatorKa}
                            </span>
                            <span dir="rtl" className="font-serif text-xs font-black text-[#0F1E36]">
                              {card.dibburHe}
                            </span>
                          </div>
                          <div
                            dir="rtl"
                            className={`text-sm leading-relaxed mb-2 text-[#0B1324] ${
                              card.commentatorKa.includes('რაში') && showRashiScript
                                ? 'font-rashi'
                                : 'font-serif'
                            }`}
                          >
                            {formatHebrewWithNikud(card.hebrew)}
                          </div>
                          <div className="text-xs leading-relaxed text-[#1E334C] pt-1.5 border-t border-sky-200/60">
                            {card.georgian}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
});
