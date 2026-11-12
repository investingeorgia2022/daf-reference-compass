// @ts-nocheck
import { installGeminiFetchHeaders } from './utils/geminiSettings';
installGeminiFetchHeaders();
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { loadAppSettings, readPreference, writePreference } from './utils/appPreferences';
import {
  BookOpen,
  Sun,
  Moon,
  ScrollText,
  Sparkles,
  Compass,
  Calendar,
  Award,
  Layers,
  Loader2,
  Library,
  Search,
  CheckCircle2,
  Smartphone,
  Settings,
  Eye,
  EyeOff,
  ArrowUpDown,
  Globe,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Mic,
  History,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  WifiOff,
  X,
  Users,
  HeartHandshake,
  Flame,
  Menu,
  Undo2,
  Scale,
  Plus,
  Coins,
  Bookmark,
  Maximize2,
  Minimize2,
  Languages,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Minus,
  Square,
  Gamepad2,
  Scroll,
  Crown,
  BookMarked,
  BookKey,
  SunMedium,
  CalendarCheck,
  Archive,
} from 'lucide-react';
import {
  AnalysisMode,
  AppSettings,
  AppTheme,
  CitationReturnPoint,
  DafPageData,
  MasoretRef,
  RecentlyViewedDaf,
  ScholarNote,
  SefariaCommentaryItem,
  SelectedDafTarget,
  SourceLookupResult,
  TalmudSentence,
  UILang,
  WordSentenceAnalysisResult,
} from './types/talmud';
import {
  SEDARIM,
  TRACTATES,
  generateDafListForTractate,
  toHebrewDafNumber,
} from './data/tractates';
import {
  getCuratedOrDynamicDaf,
  getInitialActiveMishnahForTractate,
} from './data/curatedDapim';
import { findLexiconEntry, normalizeHebrewWord } from './data/lexicon';
import { findBuiltinSourceForText } from './data/sourceDatabase';
import {
  getBuiltinSefariaCommentaries,
  mapSefariaCommentatorMeta,
} from './data/sefariaCommentators';
import { SearchableSelect, SelectOption } from './components/SearchableSelect';
import { VoiceSearchMicButton } from './components/VoiceSearchMicButton';
import { WindowsWindowControls } from './components/WindowsWindowControls';
import { ClassicTalmudDaf } from './components/ClassicTalmudDaf';
import { WordSentencePopover } from './components/WordSentencePopover';
import { SmartStudyPanels } from './components/SmartStudyPanels';
import { VoiceAndAiNavModal } from './components/VoiceAndAiNavModal';
import { SettingsModal, LANGUAGE_OPTIONS } from './components/SettingsModal';
import { ExportProjectModal } from './components/ExportProjectModal';
import { CascadingTalmudMishnahSelectorModal } from './components/CascadingTalmudMishnahSelectorModal';
import { MishnahMapModal, MishnahGuideModal, useMishnahChapter } from './components/MishnahGuide';
import { OfflineLibraryPanel } from './components/OfflineLibraryPanel';
import { SACRED_REALMS, SacredRealmId } from './data/tanakhAndHalakhaData';
import { ClassicSacredDafView } from './components/ClassicSacredDafView';
import { DailyBlessingsView } from './components/DailyBlessingsView';
import { SiddurInteractiveView } from './components/SiddurInteractiveView';
import { DailyTwoHalakhotView } from './components/DailyTwoHalakhotView';
import {
  FloatingSourceDafNoteWindow,
  FloatingSourceDafRequest,
} from './components/FloatingSourceDafNoteWindow';
import { GalacticGlobeAndAiGreeter } from './components/GalacticGlobeAndAiGreeter';
import { SpinningCrystalCrownMagenDavidEmblem, AnimatedMiniGlobeIcon, AnimatedGlobeIconWrapper } from './components/CrystalGlobeHelpers';
import { CrystalMouseJoystick } from './components/CrystalMouseJoystick';
import { DafCompletionConfetti, emitDafCompletedCelebration } from './components/DafCompletionConfetti';
import { HebrewHalakhicCalendarView } from './components/HebrewHalakhicCalendarView';
import { PageFlip3DWrapper, playBookPageTurnSound } from './components/PageFlip3DWrapper';
import {
  TopLeftLogoInterfacesMenu,
  DailyStudyDedicationRibbon,
  CommunityModalsManager,
  useLiveOnlinePresence,
  RegisteredScholarUser,
  StudyDedicationItem,
} from './components/CommunityHubModals';
import {
  getAllOfflineStorageStats,
  getDafFromOfflineStorage,
  saveDafToOfflineStorage,
  pruneStaleOfflineCache,
} from './utils/offlineTalmudStorage';
import {
  containsLatinButNoGeorgian,
  getBackendUrl,
  normalizeGeorgianJewishTerms,
  translateToGeorgianLive,
  translateToModernHebrewLive,
  translateWithTorahTalmudSpecServer,
  transliterateHebrewToGeorgian,
} from './utils/georgianTranslator';

const UI_STRINGS: Record<
  UILang,
  {
    appTitle: string;
    appSubtitle: string;
    sederLabel: string;
    tractateLabel: string;
    dafLabel: string;
    searchPlaceholder: string;
    dafYomiBadge: string;
    completedCount: string;
    loadingSefaria: string;
    globeBtn: string;
    abovePanel: string;
    belowPanel: string;
    historyBtn: string;
    offlineShas: string;
    blessingsBtn: string;
    settingsBtn: string;
    voiceNav: string;
    aiSearch: string;
    studyCenter: string;
    commentaries: string;
    onlineLabel: string;
  }
> = {
  ka: {
    appTitle: 'თალმუდ ბავლი 3D • תלמוד בבלי',
    appSubtitle:
      'ვილნის შასის სრული კოდექსი • სიტყვებისა და წინადადებების ყივრითულ-ქართული ანალიზი',
    sederLabel: 'სედერი (סדר)',
    tractateLabel: 'მასეხეთი / ტრაქტატი (מסכת)',
    dafLabel: 'დაფი / გვერდი (דף)',
    searchPlaceholder: 'ძიება ტრაქტატში ან გვერდზე...',
    dafYomiBadge: 'დღის დაფი (דף היומי)',
    completedCount: 'შესწავლილი დაფი',
    loadingSefaria: 'იტვირთება ორიგინალი ტექსტი და ყველა კომენტატორი Sefaria-დან...',
    globeBtn: '3D გლობუსი',
    abovePanel: 'ზედა პანელი',
    belowPanel: 'ქვედა პანელი',
    historyBtn: 'ისტორია',
    offlineShas: 'ოფლაინ შასი',
    blessingsBtn: 'კურთხევები',
    settingsBtn: 'პარამეტრები',
    voiceNav: 'ხმოვანი',
    aiSearch: 'AI ძიება',
    studyCenter: 'ცენტრი 30+',
    commentaries: 'მეფორშიმი',
    onlineLabel: 'ონლაინ',
  },
  he: {
    appTitle: 'תלמוד בבלי • מהדורת וילנא 3D',
    appSubtitle: 'ש״ס וילנא אינטראקטיבי עם תרגום וביאור מילה במילה לעברית ולגאורגית',
    sederLabel: 'סדר בש״ס',
    tractateLabel: 'מסכת',
    dafLabel: 'דף ועמוד',
    searchPlaceholder: 'חיפוש מסכת או דף...',
    dafYomiBadge: 'דף היומי',
    completedCount: 'דפים שנלמדו',
    loadingSefaria: 'טוען טקסט ומפרשים ממאגר ספריא...',
    globeBtn: 'גלובוס 3D',
    abovePanel: 'לוח עליון',
    belowPanel: 'לוח תחתון',
    historyBtn: 'היסטוריה',
    offlineShas: 'ש״ס אופליין',
    blessingsBtn: 'ברכות',
    settingsBtn: 'הגדרות',
    voiceNav: 'קולי',
    aiSearch: 'חיפוש AI',
    studyCenter: 'מרכז 30+',
    commentaries: 'מפרשים',
    onlineLabel: 'מחוברים',
  },
  en: {
    appTitle: 'Talmud Bavli 3D • Vilna Edition',
    appSubtitle: 'Interactive Vilna Shas with Word & Sentence Hebrew/Georgian Analysis',
    sederLabel: 'Seder (Order)',
    tractateLabel: 'Masechet (Tractate)',
    dafLabel: 'Daf / Folio',
    searchPlaceholder: 'Search tractate or folio...',
    dafYomiBadge: 'Daf Yomi',
    completedCount: 'Completed Dapim',
    loadingSefaria: 'Loading live text & all commentators from Sefaria...',
    globeBtn: '3D Globe',
    abovePanel: 'Top Panel',
    belowPanel: 'Bottom Panel',
    historyBtn: 'History',
    offlineShas: 'Offline Shas',
    blessingsBtn: 'Blessings',
    settingsBtn: 'Settings',
    voiceNav: 'Voice',
    aiSearch: 'AI Search',
    studyCenter: 'Center 30+',
    commentaries: 'Commentaries',
    onlineLabel: 'Online',
  },
  ru: {
    appTitle: 'Вавилонский Талмуд 3D • Виленское издание',
    appSubtitle: 'Интерактивный Виленский Шас с пословным и построчным анализом',
    sederLabel: 'Седер (Раздел)',
    tractateLabel: 'Масехет (Трактат)',
    dafLabel: 'Даф / Лист',
    searchPlaceholder: 'Поиск трактата или листа...',
    dafYomiBadge: 'Даф Йоми',
    completedCount: 'Изучено листов',
    loadingSefaria: 'Загрузка оригинального текста и всех комментаторов из Sefaria...',
    globeBtn: '3D Глобус',
    abovePanel: 'Верх. панель',
    belowPanel: 'Нижн. панель',
    historyBtn: 'История',
    offlineShas: 'Офлайн Шас',
    blessingsBtn: 'Брахот',
    settingsBtn: 'Настройки',
    voiceNav: 'Голос',
    aiSearch: 'AI Поиск',
    studyCenter: 'Центр 30+',
    commentaries: 'Мефоршим',
    onlineLabel: 'Онлайн',
  },
  fr: {
    appTitle: 'Talmud de Babylone 3D • Édition de Vilna',
    appSubtitle: 'Shas de Vilna interactif avec analyse mot à mot et commentaires',
    sederLabel: 'Séder (Ordre)',
    tractateLabel: 'Massékhet (Traité)',
    dafLabel: 'Daf / Folio',
    searchPlaceholder: 'Rechercher un traité ou un folio...',
    dafYomiBadge: 'Daf Yomi',
    completedCount: 'Dapim étudiés',
    loadingSefaria: 'Chargement du texte et de tous les commentateurs depuis Sefaria...',
    globeBtn: 'Globe 3D',
    abovePanel: 'Panneau haut',
    belowPanel: 'Panneau bas',
    historyBtn: 'Historique',
    offlineShas: 'Shas hors-ligne',
    blessingsBtn: 'Bénédictions',
    settingsBtn: 'Paramètres',
    voiceNav: 'Voix',
    aiSearch: 'Recherche IA',
    studyCenter: 'Centre 30+',
    commentaries: 'Commentaires',
    onlineLabel: 'En ligne',
  },
  es: {
    appTitle: 'Talmud de Babilonia 3D • Edición de Vilna',
    appSubtitle: 'Shas de Vilna interactivo con análisis palabra por palabra y comentarios',
    sederLabel: 'Séder (Orden)',
    tractateLabel: 'Masejet (Tratado)',
    dafLabel: 'Daf / Folio',
    searchPlaceholder: 'Buscar tratado o folio...',
    dafYomiBadge: 'Daf Yomi',
    completedCount: 'Dapim completados',
    loadingSefaria: 'Cargando texto original y comentaristas desde Sefaria...',
    globeBtn: 'Globo 3D',
    abovePanel: 'Panel sup.',
    belowPanel: 'Panel inf.',
    historyBtn: 'Historial',
    offlineShas: 'Shas offline',
    blessingsBtn: 'Bendiciones',
    settingsBtn: 'Ajustes',
    voiceNav: 'Voz',
    aiSearch: 'Búsqueda IA',
    studyCenter: 'Centro 30+',
    commentaries: 'Comentarios',
    onlineLabel: 'En línea',
  },
  de: {
    appTitle: 'Babylonischer Talmud 3D • Wilnaer Ausgabe',
    appSubtitle: 'Interaktiver Wilnaer Schas mit Wort-für-Wort-Analyse und Kommentaren',
    sederLabel: 'Seder (Ordnung)',
    tractateLabel: 'Massechet (Traktat)',
    dafLabel: 'Daf / Blatt',
    searchPlaceholder: 'Traktat oder Blatt suchen...',
    dafYomiBadge: 'Daf Jomi',
    completedCount: 'Gelernte Dapim',
    loadingSefaria: 'Originaltext und alle Kommentatoren werden von Sefaria geladen...',
    globeBtn: '3D-Globus',
    abovePanel: 'Oberes Panel',
    belowPanel: 'Unteres Panel',
    historyBtn: 'Verlauf',
    offlineShas: 'Offline-Schas',
    blessingsBtn: 'Segenssprüche',
    settingsBtn: 'Einstellungen',
    voiceNav: 'Sprache',
    aiSearch: 'KI-Suche',
    studyCenter: 'Zentrum 30+',
    commentaries: 'Kommentare',
    onlineLabel: 'Online',
  },
};

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenSefariaTextArray(input: unknown): string[] {
  if (!input) return [];
  if (typeof input === 'string') {
    const cleaned = stripHtmlTags(input);
    return cleaned ? [cleaned] : [];
  }
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      out.push(...flattenSefariaTextArray(item));
    }
    return out;
  }
  return [];
}

function stripHebrewNikud(str: string): string {
  return str.replace(/[\u0591-\u05C7]/g, '').trim();
}

function isMishnahMarkerStart(he: string, en: string = ''): boolean {
  const plainHe = stripHebrewNikud(he);
  const headHe = plainHe.slice(0, 28);
  if (
    /^מתני(׳|'|״|תין)?(\s|:|$)/.test(headHe) ||
    /^משנה(\s|:|$)/.test(headHe) ||
    headHe.startsWith('מתני׳') ||
    headHe.startsWith("מתני'") ||
    headHe.startsWith('מתניתין')
  ) {
    return true;
  }
  const headEn = en.trim().slice(0, 24);
  if (/^MISHNAH\b/i.test(headEn)) {
    return true;
  }
  return false;
}

function isGemaraMarkerStart(he: string, en: string = ''): boolean {
  const plainHe = stripHebrewNikud(he);
  const headHe = plainHe.slice(0, 24);
  if (
    /^גמ(׳|'|״|רא)?(\s|:|$)/.test(headHe) ||
    headHe.startsWith('גמ׳') ||
    headHe.startsWith("גמ'") ||
    headHe.startsWith('גמרא')
  ) {
    return true;
  }
  const headEn = en.trim().slice(0, 24);
  if (/^GEMARA\b/i.test(headEn)) {
    return true;
  }
  return false;
}

interface ClassifiedSegment {
  kind: 'mishnah' | 'gemara';
  he: string;
  en: string;
}

function classifyDafSegments(
  heSegments: string[],
  enSegments: string[],
  isFirstDaf2a: boolean
): {
  newMishnahSegments: ClassifiedSegment[];
  gemaraSegments: ClassifiedSegment[];
  hasGemaraBeforeFirstNewMishnah: boolean;
} {
  // First, split any single segment that embeds both Gemara and a mid-segment "מתני׳" or "גמ׳"
  const expanded: { he: string; en: string }[] = [];
  for (let i = 0; i < heSegments.length; i++) {
    const he = heSegments[i];
    const en = enSegments[i] || '';
    const plain = stripHebrewNikud(he);

    const midMatniMatch = plain.slice(12).search(/\b(מתני׳|מתני'|מתניתין)\s/);
    const midGemaraMatch = plain.slice(12).search(/\b(גמ׳|גמ')\s/);

    if (midMatniMatch !== -1) {
      const rawSplitIdx = he.search(/(מתני׳|מתני'|מתניתין)/);
      if (rawSplitIdx > 10) {
        expanded.push({ he: he.slice(0, rawSplitIdx).trim(), en });
        expanded.push({ he: he.slice(rawSplitIdx).trim(), en: 'MISHNAH. ' + en });
        continue;
      }
    } else if (midGemaraMatch !== -1) {
      const rawSplitIdx = he.search(/(גמ׳|גמ')/);
      if (rawSplitIdx > 10) {
        expanded.push({ he: he.slice(0, rawSplitIdx).trim(), en });
        expanded.push({ he: he.slice(rawSplitIdx).trim(), en: 'GEMARA. ' + en });
        continue;
      }
    }
    expanded.push({ he, en });
  }

  const newMishnahSegments: ClassifiedSegment[] = [];
  const gemaraSegments: ClassifiedSegment[] = [];
  let inMishnah = isFirstDaf2a;
  let seenFirstNewMishnah = false;
  let hasGemaraBeforeFirstNewMishnah = false;

  for (let i = 0; i < expanded.length; i++) {
    const { he, en } = expanded[i];
    if (!he.trim()) continue;

    if (isMishnahMarkerStart(he, en)) {
      inMishnah = true;
      seenFirstNewMishnah = true;
    } else if (isGemaraMarkerStart(he, en)) {
      inMishnah = false;
    } else if (isFirstDaf2a && i === 0) {
      inMishnah = true;
      seenFirstNewMishnah = true;
    } else if (isFirstDaf2a && i > 0 && inMishnah) {
      // On 2a, unless English still says Mishnah and we haven't hit Gemara, segment 1+ is Gemara
      const enLooksLikeMishnah = /^MISHNAH\b/i.test(en.trim());
      if (!enLooksLikeMishnah) {
        inMishnah = false;
      }
    } else if (!isFirstDaf2a && inMishnah) {
      // On 2b+, a multi-segment Mishnah continues only until Gemara starts
      const enLooksLikeGemara = /^GEMARA\b/i.test(en.trim());
      if (enLooksLikeGemara) {
        inMishnah = false;
      } else {
        // Usually each Mishnah in Sefaria Bavli is 1 segment unless the next segment is still before "גמ׳"
        // Check if any subsequent segment within 2 steps has "גמ׳"
        const nextHasGemaraMarker = expanded
          .slice(i + 1, i + 4)
          .some((item) => isGemaraMarkerStart(item.he, item.en));
        if (!nextHasGemaraMarker) {
          inMishnah = false;
        }
      }
    }

    if (inMishnah) {
      seenFirstNewMishnah = true;
      newMishnahSegments.push({ kind: 'mishnah', he, en });
    } else {
      if (!seenFirstNewMishnah && !isFirstDaf2a) {
        hasGemaraBeforeFirstNewMishnah = true;
      }
      gemaraSegments.push({ kind: 'gemara', he, en });
    }
  }

  return {
    newMishnahSegments,
    gemaraSegments,
    hasGemaraBeforeFirstNewMishnah,
  };
}

const cascadingMenuContainerVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.38,
      ease: [0.32, 0.72, 0, 1] as const,
      when: 'afterChildren',
      staggerChildren: 0.045,
      staggerDirection: -1, // Folds back in exact reverse order before container closes
    },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1] as const,
      when: 'beforeChildren',
      staggerChildren: 0.055, // Sequentially appears one by one
      delayChildren: 0.04,
    },
  },
};

const cascadingMenuItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    transition: {
      duration: 0.22,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = readPreference('talmud_theme_3d');
    return (saved as AppTheme) || 'sanctuary-3d';
  });

  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);

  const [uiLang, setUiLang] = useState<UILang>(() => settings.uiLang || 'ka');
  const [dafFontSizeScale, setDafFontSizeScale] = useState<number>(
    () => settings.dafFontSizeScale ?? 100
  );
  const [showAboveDaf, setShowAboveDaf] = useState<boolean>(false);
  const [showBelowDaf, setShowBelowDaf] = useState<boolean>(false);
  const [isDafMobileFullscreen, setIsDafMobileFullscreen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [isRecentDropdownOpen, setIsRecentDropdownOpen] = useState<boolean>(false);
  const [showReturnToDafPearl, setShowReturnToDafPearl] = useState<boolean>(false);
  const [pearlDirection, setPearlDirection] = useState<'up' | 'down'>('up');

  const [selectedSederId, setSelectedSederId] = useState<string>('all');
  const [selectedTractateId, setSelectedTractateId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tractate');
      if (p && TRACTATES.some((tr) => tr.id === p)) return p;
    }
    return 'Taanit';
  });
  const [selectedDafId, setSelectedDafId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const d = new URLSearchParams(window.location.search).get('daf');
      if (d && /^\d+[ab]$/.test(d)) return d;
    }
    return '2a';
  });
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const [restoreScrollTrigger, setRestoreScrollTrigger] = useState<number>(0);

  // Recently Viewed Talmud Pages persisted in localStorage
  const [recentlyViewedDapim, setRecentlyViewedDapim] = useState<RecentlyViewedDaf[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_recently_viewed_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentSortOrder, setRecentSortOrder] = useState<'recent' | 'tractate'>('recent');

  const sortedRecentlyViewedDapim = useMemo(() => {
    if (recentSortOrder === 'recent') {
      return recentlyViewedDapim;
    }
    return [...recentlyViewedDapim].sort((a, b) => {
      const idxA = TRACTATES.findIndex((tr) => tr.id === a.tractateId);
      const idxB = TRACTATES.findIndex((tr) => tr.id === b.tractateId);
      const orderA = idxA === -1 ? 999 : idxA;
      const orderB = idxB === -1 ? 999 : idxB;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a.dafId, 10) || 2;
      const numB = parseInt(b.dafId, 10) || 2;
      if (numA !== numB) return numA - numB;
      return a.dafId.localeCompare(b.dafId);
    });
  }, [recentlyViewedDapim, recentSortOrder]);

  const [dafData, setDafData] = useState<DafPageData>(() =>
    getCuratedOrDynamicDaf('Taanit', '2a', 'תענית', 'თაანით')
  );
  const [loadingDaf, setLoadingDaf] = useState<boolean>(false);

  // Interactive word/sentence selection + dropdown mode
  const [selectedTarget, setSelectedTarget] = useState<SelectedDafTarget | null>(null);
  const [activeMode, setActiveMode] = useState<AnalysisMode>('word-ka');
  const [analysisResult, setAnalysisResult] = useState<WordSentenceAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisCache, setAnalysisCache] = useState<
    Record<string, WordSentenceAnalysisResult>
  >({});

  // Personal scholar notes & completed dapim persisted in localStorage
  const [notes, setNotes] = useState<ScholarNote[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_scholar_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedDapim, setCompletedDapim] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_completed_dapim');
      return saved ? JSON.parse(saved) : ['Taanit:2a'];
    } catch {
      return ['Taanit:2a'];
    }
  });

  const [highlightedSentenceId, setHighlightedSentenceId] = useState<string | null>(null);
  const [wordExplainStage, setWordExplainStage] = useState<'none' | 'marked' | 'note' | 'deep'>('none');
  const [searchHighlightQuery, setSearchHighlightQuery] = useState<string>('');
  const [workspaceTab, setWorkspaceTab] = useState<'daf' | 'controls' | 'study-hub'>('daf');
  const [isGlobalBottomSheetOpen, setIsGlobalBottomSheetOpen] = useState<boolean>(false);
  const [isCascadingSelectorOpen, setIsCascadingSelectorOpen] = useState<boolean>(false);
  const globalBottomBarTouchRef = useRef<{ startY: number; startX: number } | null>(null);
  // Bottom dock stays visible; a downward swipe folds it so only the search globe remains.
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [dockPanelHeight, setDockPanelHeight] = useState<number>(64);
  const dockObserverRef = useRef<ResizeObserver | null>(null);
  const dockPanelRef = useCallback((el: HTMLDivElement | null) => {
    dockObserverRef.current?.disconnect();
    dockObserverRef.current = null;
    if (!el) return;
    setDockPanelHeight(el.offsetHeight || 64);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setDockPanelHeight(el.offsetHeight || 64));
    ro.observe(el);
    dockObserverRef.current = ro;
  }, []);
  const lastBottomNavClickRef = useRef<number>(0);
  const [voiceAiModalState, setVoiceAiModalState] = useState<{
    isOpen: boolean;
    initialTab: 'voice' | 'ai';
  }>({ isOpen: false, initialTab: 'voice' });
  const [isOfflineLibraryModalOpen, setIsOfflineLibraryModalOpen] = useState<boolean>(false);
  useEffect(() => {
    const open = () => setIsOfflineLibraryModalOpen(true);
    window.addEventListener('talmud-open-offline-library', open);
    return () => window.removeEventListener('talmud-open-offline-library', open);
  }, []);
  const [isJoystickOpen, setIsJoystickOpen] = useState<boolean>(false);
  const [isStudyCenterCollapsed, setIsStudyCenterCollapsed] = useState<boolean>(false);
  const [activeRealm, setActiveRealm] = useState<SacredRealmId>('talmud');
  const [realmTarget, setRealmTarget] = useState<{ bookId?: string; chapter?: number }>({});
  const [citationReturnStack, setCitationReturnStack] = useState<CitationReturnPoint[]>([]);
  const [globalFocusedPane, setGlobalFocusedPane] = useState<{
    paneId: string;
    titleHe: string;
    titleKa: string;
    isMinimized: boolean;
    isMaximized: boolean;
  } | null>(null);

  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          paneId: string;
          titleHe: string;
          titleKa: string;
          isMinimized: boolean;
          isMaximized: boolean;
        }>
      ).detail;
      if (detail) {
        setGlobalFocusedPane(detail);
      }
    };
    const onOpenBottomSheet = () => {
      setIsGlobalBottomSheetOpen(true);
    };
    window.addEventListener('global-daf-pane-focus', onFocus);
    window.addEventListener('global-open-bottom-sheet', onOpenBottomSheet);
    return () => {
      window.removeEventListener('global-daf-pane-focus', onFocus);
      window.removeEventListener('global-open-bottom-sheet', onOpenBottomSheet);
    };
  }, []);
  const [pendingReturnRestore, setPendingReturnRestore] = useState<
    | (CitationReturnPoint & {
        restoreTrigger: number;
        seq: number;
        pdfRowId?: string | null;
        pdfSelectedRange?: { startIdx: number; endIdx: number } | null;
        sentenceId?: string | null;
        elementId?: string | null;
        windowScrollY?: number;
        labelKa?: string;
      })
    | null
  >(null);

  const handleRecordCitationReturnPoint = useCallback(
    (origin: {
      fromBookId?: string;
      fromBookNameKa?: string;
      fromBookNameHe?: string;
      fromChapter?: number;
      fromSectionId?: string | null;
      fromSentenceId?: string | null;
      fromElementId?: string | null;
      fromPdfRowId?: string | null;
      fromPdfSelectedRange?: { startIdx: number; endIdx: number } | null;
      fromWindowScrollY: number;
      sourceLabelKa: string;
      sourceLabelHe?: string;
      targetLabelKa?: string;
    }) => {
      const tr = TRACTATES.find((item) => item.id === selectedTractateId) || TRACTATES[0];
      const point: CitationReturnPoint = {
        id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fromRealm: activeRealm,
        fromTractateId: tr.id,
        fromTractateNameKa: tr.nameKa,
        fromTractateNameHe: tr.nameHe,
        fromDafId: selectedDafId,
        fromBookId: origin.fromBookId,
        fromBookNameKa: origin.fromBookNameKa,
        fromBookNameHe: origin.fromBookNameHe,
        fromChapter: origin.fromChapter,
        fromSectionId: origin.fromSectionId ?? null,
        fromSentenceId: origin.fromSentenceId ?? null,
        fromElementId: origin.fromElementId ?? null,
        fromPdfRowId: origin.fromPdfRowId ?? null,
        fromPdfSelectedRange: origin.fromPdfSelectedRange ?? null,
        fromWindowScrollY:
          typeof origin.fromWindowScrollY === 'number'
            ? origin.fromWindowScrollY
            : typeof window !== 'undefined'
              ? window.scrollY
              : 0,
        sourceLabelKa: origin.sourceLabelKa,
        sourceLabelHe: origin.sourceLabelHe,
        targetLabelKa: origin.targetLabelKa,
        timestamp: Date.now(),
      };
      setCitationReturnStack((prev) => [point, ...prev.slice(0, 14)]);
    },
    [activeRealm, selectedTractateId, selectedDafId]
  );

  const handleReturnToCitationOrigin = useCallback(() => {
    if (citationReturnStack.length === 0) return;
    const [top, ...rest] = citationReturnStack;
    setCitationReturnStack(rest);

    const targetRealm = (top.fromRealm as SacredRealmId) || 'talmud';
    setActiveRealm(targetRealm);

    if (targetRealm === 'talmud') {
      setSelectedSederId('all');
      setSelectedTractateId(top.fromTractateId);
      setSelectedDafId(top.fromDafId);
      const tr =
        TRACTATES.find((item) => item.id === top.fromTractateId) || TRACTATES[0];
      const instantBase = getCuratedOrDynamicDaf(
        tr.id,
        top.fromDafId,
        tr.nameHe,
        tr.nameKa
      );
      const instantComms = getBuiltinSefariaCommentaries(tr.id, top.fromDafId);
      setDafData({
        ...instantBase,
        allCommentaries:
          instantBase.allCommentaries && instantBase.allCommentaries.length > 0
            ? instantBase.allCommentaries
            : instantComms,
      });
    } else if (top.fromBookId) {
      setRealmTarget({ bookId: top.fromBookId, chapter: top.fromChapter || 1 });
    }

    const nowSeq = Date.now();
    setPendingReturnRestore({
      ...top,
      restoreTrigger: nowSeq,
      seq: nowSeq,
      pdfRowId: top.fromPdfRowId,
      pdfSelectedRange: top.fromPdfSelectedRange,
      sentenceId: top.fromSentenceId,
      elementId: top.fromElementId,
      windowScrollY: top.fromWindowScrollY,
      labelKa: top.sourceLabelKa,
    });

    const restoreExactDomPosition = () => {
      if (top.fromElementId) {
        const el = document.getElementById(top.fromElementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      if (top.fromSentenceId) {
        const sentEl = document.getElementById(`daf-sent-${top.fromSentenceId}`);
        if (sentEl) {
          sentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedSentenceId(top.fromSentenceId);
          return;
        }
      }
      if (typeof top.fromWindowScrollY === 'number') {
        window.scrollTo({ top: top.fromWindowScrollY, behavior: 'smooth' });
      }
    };

    requestAnimationFrame(restoreExactDomPosition);
    setTimeout(restoreExactDomPosition, 180);
    setTimeout(restoreExactDomPosition, 420);
  }, [citationReturnStack]);
  const [isGlobeOpen, setIsGlobeOpen] = useState<boolean>(true);
  const [floatingSourceDafRequest, setFloatingSourceDafRequest] =
    useState<FloatingSourceDafRequest | null>(null);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDedicationModalOpen, setIsDedicationModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<RegisteredScholarUser | null>(() => {
    try {
      const saved = localStorage.getItem('talmud_registered_user_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeDedication, setActiveDedication] = useState<StudyDedicationItem>({
    id: 'ded-default',
    type: 'leilui-nishmat',
    typeLabelKa: 'სულის მოსამაღლებლად (לעילוי נשמת)',
    typeLabelHe: 'לעילוי נשמת',
    honoreeNameKa: 'მარან რავ ოვაдия იოსეფი ბენ გორჯია და ყველა წმინდა ცადიკი',
    honoreeNameHe: 'מרן עובדיה בן גורג׳יה זצוק״ל',
    sponsorNameKa: 'ბეთ-მიდრაშის საზოგადოება',
    noteKa: 'დღევანდელი სწავლა ეძღვნება სულის საოხად და მთელი ისრაელის კეთილდღეობისთვის.',
  });
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineCachedCount, setOfflineCachedCount] = useState<number>(0);
  const [globalBottomSearchQuery, setGlobalBottomSearchQuery] = useState<string>('');
  const [isBottomSearchFocused, setIsBottomSearchFocused] = useState<boolean>(false);
  const bottomSearchInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Real-time Georgian Voice-to-Text state for Search Bar
  const [isRealtimeVoiceActive, setIsRealtimeVoiceActive] = useState<boolean>(false);
  const realtimeSpeechRecRef = useRef<any>(null);

  const handleToggleRealtimeVoiceSearch = useCallback(() => {
    if (isRealtimeVoiceActive && realtimeSpeechRecRef.current) {
      try {
        realtimeSpeechRecRef.current.stop();
      } catch {
        // ignore
      }
      realtimeSpeechRecRef.current = null;
      setIsRealtimeVoiceActive(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'ka-GE'; // Real-time Georgian voice-to-text
      rec.continuous = true;
      rec.interimResults = true;

      // Expand bottom drawer so user sees search bar live
      setIsGlobalBottomSheetOpen(true);
      setIsBottomSearchFocused(true);

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const text = (finalTranscript + interimTranscript).trim();
        if (text) {
          setGlobalBottomSearchQuery(text);
          setSearchHighlightQuery(text);
        }
      };

      rec.onerror = () => {
        setIsRealtimeVoiceActive(false);
        realtimeSpeechRecRef.current = null;
      };

      rec.onend = () => {
        setIsRealtimeVoiceActive(false);
        realtimeSpeechRecRef.current = null;
      };

      rec.start();
      realtimeSpeechRecRef.current = rec;
      setIsRealtimeVoiceActive(true);
    } catch {
      setIsRealtimeVoiceActive(false);
    }
  }, [isRealtimeVoiceActive]);

  const handleExecuteSearch = useCallback(() => {
    const q = globalBottomSearchQuery.trim();
    if (!q) {
      bottomSearchInputRef.current?.focus();
      return;
    }
    setSearchHighlightQuery(q);

    // 1. Check if matching any tractate name
    const matchTr = TRACTATES.find(
      (tr) =>
        tr.nameKa.toLowerCase().includes(q.toLowerCase()) ||
        tr.nameHe.includes(q) ||
        tr.nameEn.toLowerCase().includes(q.toLowerCase())
    );
    if (matchTr) {
      if (activeRealm !== 'talmud') setActiveRealm('talmud');
      if (matchTr.id !== selectedTractateId) {
        setSelectedTractateId(matchTr.id);
        setSelectedDafId('2a');
      }
      setIsGlobalBottomSheetOpen(false);
      return;
    }

    // 2. Check if matching any sentence on current daf
    const allSentences = [
      ...(dafData.mishnah || []),
      ...(dafData.gemara || []),
      ...(dafData.rashi || []),
      ...(dafData.tosafot || []),
    ];
    const matchSent = allSentences.find(
      (s) =>
        (s.translationKa || '').toLowerCase().includes(q.toLowerCase()) ||
        (s.hebrewText || '').includes(q)
    );
    if (matchSent) {
      setHighlightedSentenceId(matchSent.id);
      setIsGlobalBottomSheetOpen(false);
      const anchorEl = document.getElementById('talmud-daf-folio-anchor');
      if (anchorEl) {
        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // 3. If no local match, open AI & global search modal with the query
    setVoiceAiModalState({ isOpen: true, initialTab: 'ai' });
    setIsGlobalBottomSheetOpen(false);
  }, [globalBottomSearchQuery, selectedTractateId, activeRealm, dafData]);

  useEffect(() => {
    return () => {
      if (realtimeSpeechRecRef.current) {
        try {
          realtimeSpeechRecRef.current.stop();
        } catch {
          // ignore
        }
        realtimeSpeechRecRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const syncOfflineCount = async () => {
      await pruneStaleOfflineCache();
      const st = await getAllOfflineStorageStats();
      setOfflineCachedCount(st.totalDapimCount);
    };
    void syncOfflineCount();
    const onOnline = () => setIsOnlineStatus(true);
    const onOffline = () => setIsOnlineStatus(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('talmud-offline-updated', syncOfflineCount);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('talmud-offline-updated', syncOfflineCount);
    };
  }, []);

  // Cache of the active Mishnah at the end of each Daf (keyed by `${tractateId}:${dafId}`)
  const activeMishnahByDafRef = useRef<Record<string, TalmudSentence[]>>({});

  const isDark = theme === 'sanctuary-3d' || theme === 'royal-sapphire';
  const t = UI_STRINGS[uiLang] || UI_STRINGS.ka;

  const cycleNextTheme = useCallback(() => {
    setTheme((prev) => {
      const isCurrentlyDark = prev === 'sanctuary-3d' || prev === 'royal-sapphire';
      return isCurrentlyDark ? 'parchment-day' : 'sanctuary-3d';
    });
  }, []);

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    if (typeof next.dafFontSizeScale === 'number') {
      setDafFontSizeScale(next.dafFontSizeScale);
    }
    if (next.uiLang !== uiLang) {
      setUiLang(next.uiLang);
    }
    try {
      localStorage.setItem('talmud_app_settings_v2', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleChangeDafFontSizeScale = useCallback((nextScale: number) => {
    const clamped = Math.max(70, Math.min(180, Math.round(nextScale)));
    setDafFontSizeScale(clamped);
    setSettings((prev) => {
      const updated = { ...prev, dafFontSizeScale: clamped };
      try {
        localStorage.setItem('talmud_app_settings_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Live 3D/Canvas and Font Zoom synchronization state
  const [liveTalmudZoomScale, setLiveTalmudZoomScale] = useState<number>(1);

  useEffect(() => {
    const onZoomState = (e: Event) => {
      const detail = (e as CustomEvent<{ scale?: number }>).detail;
      if (detail && typeof detail.scale === 'number') {
        setLiveTalmudZoomScale(detail.scale);
      }
    };
    window.addEventListener('talmud-zoom-state-change', onZoomState);
    return () => window.removeEventListener('talmud-zoom-state-change', onZoomState);
  }, []);

  const handleStepZoomIn = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('talmud-zoom-step', {
        detail: { delta: 0.15 },
      })
    );
    handleChangeDafFontSizeScale(dafFontSizeScale + 6);
  }, [dafFontSizeScale, handleChangeDafFontSizeScale]);

  const handleStepZoomOut = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('talmud-zoom-step', {
        detail: { delta: -0.15 },
      })
    );
    handleChangeDafFontSizeScale(dafFontSizeScale - 6);
  }, [dafFontSizeScale, handleChangeDafFontSizeScale]);

  const handleResetZoomScale = useCallback(() => {
    window.dispatchEvent(new CustomEvent('talmud-reset-zoom'));
    handleChangeDafFontSizeScale(100);
    setLiveTalmudZoomScale(1);
  }, [handleChangeDafFontSizeScale]);

  useEffect(() => {
    writePreference('talmud_theme_3d', theme);
  }, [theme]);

  useEffect(() => {
    writePreference('talmud_ui_lang', uiLang);
    document.documentElement.lang = uiLang;
    setSettings((prev) => {
      const updated = { ...prev, uiLang };
      try {
        localStorage.setItem('talmud_app_settings_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [uiLang]);

  // Dynamic Header & Bottom Navigation Bar visibility synchronized with scrolling
  const [hideBarsOnScroll, setHideBarsOnScroll] = useState<boolean>(false);
  const [isScrolledCompact, setIsScrolledCompact] = useState<boolean>(false);
  const lastScrollPosRef = useRef<Map<EventTarget, number>>(new Map());
  const scrollDeltaAccumRef = useRef<number>(0);
  const manualRevealLockUntilRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const isGlobeOpenRef = useRef<boolean>(isGlobeOpen);
  isGlobeOpenRef.current = isGlobeOpen;

  const handleRevealBothBars = useCallback(() => {
    manualRevealLockUntilRef.current = Date.now() + 900;
    scrollDeltaAccumRef.current = 0;
    touchStartYRef.current = null;
    setHideBarsOnScroll(false);
    setIsScrolledCompact(false);
  }, []);

  // Guarantee top panel is visible by default whenever entering Torah interface (or switching realms / closing Globe)
  useEffect(() => {
    manualRevealLockUntilRef.current = Date.now() + 900;
    scrollDeltaAccumRef.current = 0;
    touchStartYRef.current = null;
    setHideBarsOnScroll(false);
    setIsScrolledCompact(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activeRealm, isGlobeOpen]);

  useEffect(() => {
    const handleRevealAndScrollTop = () => {
      handleRevealBothBars();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.scrollingElement) {
        document.scrollingElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      const dafFolio = document.getElementById('talmud-daf-folio-anchor');
      if (dafFolio) {
        dafFolio.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      document
        .querySelectorAll('[data-daf-scroll-pane="true"], .overflow-y-auto')
        .forEach((el) => {
          try {
            (el as HTMLElement).scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          } catch {
            // ignore
          }
        });
    };
    window.addEventListener('torah-reveal-top-panel', handleRevealAndScrollTop);
    window.addEventListener('torah-scroll-to-top', handleRevealAndScrollTop);
    return () => {
      window.removeEventListener('torah-reveal-top-panel', handleRevealAndScrollTop);
      window.removeEventListener('torah-scroll-to-top', handleRevealAndScrollTop);
    };
  }, [handleRevealBothBars]);

  // Synchronize documentElement dark mode class with current theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark]);

  // Fullscreen Daf on Mobile & Desktop (დაფის გაშლა მთლიან მობილურის ეკრანზე — In-App Pure Viewport Fullscreen)
  const handleToggleDafFullscreen = useCallback(() => {
    setIsDafMobileFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDafMobileFullscreen) {
        setIsDafMobileFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDafMobileFullscreen]);

  useEffect(() => {
    const handler = () => handleToggleDafFullscreen();
    window.addEventListener('global-toggle-daf-fullscreen', handler);
    return () => window.removeEventListener('global-toggle-daf-fullscreen', handler);
  }, [handleToggleDafFullscreen]);

  // Monitor scroll position to show/hide the floating Pearl "Return to Talmud Daf" button
  // AND dynamically hide/show BOTH the fixed top header & fixed bottom bar in 100% sync with scrolling
  useEffect(() => {
    const isIgnoredControlTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest('header') ||
          target.closest('[data-modern-dock="true"]') ||
          target.closest('[data-searchable-select-portal="true"]') ||
          target.closest('[data-globe-control="true"]') ||
          target.classList.contains('marquee-auto-scroll') ||
          target.classList.contains('marquee-text-wrap')
      );
    };

    let dafVisRaf = 0;
    const checkDafVisibility = () => {
      dafVisRaf = 0;
      if (isGlobeOpenRef.current) return;
      const winY = window.scrollY || document.documentElement.scrollTop || 0;
      const el = document.getElementById('talmud-daf-folio-anchor');
      if (!el) {
        const shouldShow = winY > 150;
        setShowReturnToDafPearl((prev) => (prev === shouldShow ? prev : shouldShow));
        if (shouldShow) setPearlDirection('up');
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const isScrolledPastTop = r.top < -120 || winY > 220;
      const isScrolledBelowView = r.top > vh * 0.48;
      if (isScrolledPastTop) {
        setPearlDirection((prev) => (prev === 'up' ? prev : 'up'));
        setShowReturnToDafPearl((prev) => (prev ? prev : true));
      } else if (isScrolledBelowView) {
        setPearlDirection((prev) => (prev === 'down' ? prev : 'down'));
        setShowReturnToDafPearl((prev) => (prev ? prev : true));
      } else {
        setShowReturnToDafPearl((prev) => (prev ? false : prev));
      }
    };

    const scheduleCheckDafVisibility = () => {
      if (!dafVisRaf) {
        dafVisRaf = requestAnimationFrame(checkDafVisibility);
      }
    };

    const handleDynamicScroll = (e?: Event) => {
      if (isGlobeOpenRef.current) return;
      scheduleCheckDafVisibility();
      if (Date.now() < manualRevealLockUntilRef.current) return;

      const target = (e?.target as HTMLElement | Document | Window) || window;
      if (isIgnoredControlTarget(target)) return;

      let currentY = 0;
      if (
        target === window ||
        target === document ||
        target === document.documentElement ||
        target === document.body
      ) {
        currentY = window.scrollY || document.documentElement.scrollTop || 0;
        const compact = currentY > 36;
        setIsScrolledCompact((prev) => (prev === compact ? prev : compact));
      } else if (target instanceof HTMLElement) {
        currentY = target.scrollTop || 0;
      }

      const prevY = lastScrollPosRef.current.get(target) ?? currentY;
      const delta = currentY - prevY;
      lastScrollPosRef.current.set(target, currentY);

      if (Math.abs(delta) < 2) return;

      const winY = window.scrollY || document.documentElement.scrollTop || 0;
      if (winY < 16 && currentY < 16 && delta < 0) {
        scrollDeltaAccumRef.current = 0;
        setHideBarsOnScroll((prev) => (prev ? false : prev));
        return;
      }

      if (
        (delta > 0 && scrollDeltaAccumRef.current < 0) ||
        (delta < 0 && scrollDeltaAccumRef.current > 0)
      ) {
        scrollDeltaAccumRef.current = delta;
      } else {
        scrollDeltaAccumRef.current += delta;
      }

      if (scrollDeltaAccumRef.current > 18) {
        setHideBarsOnScroll((prev) => (prev ? prev : true));
        scrollDeltaAccumRef.current = 0;
      } else if (scrollDeltaAccumRef.current < -14) {
        setHideBarsOnScroll((prev) => (prev ? false : prev));
        scrollDeltaAccumRef.current = 0;
      }
    };

    const handleWheelGlobal = (e: WheelEvent) => {
      if (isGlobeOpenRef.current) return;
      if (Date.now() < manualRevealLockUntilRef.current) return;
      if (e.ctrlKey || e.metaKey) return;
      if (isIgnoredControlTarget(e.target)) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      if (e.deltaY > 18) {
        setHideBarsOnScroll(true);
      } else if (e.deltaY < -14) {
        setHideBarsOnScroll(false);
      }
    };

    const handleTouchStartGlobal = (e: TouchEvent) => {
      if (isGlobeOpenRef.current || isIgnoredControlTarget(e.target)) {
        touchStartYRef.current = null;
        return;
      }
      if (e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      } else {
        touchStartYRef.current = null;
      }
    };

    const handleTouchMoveGlobal = (e: TouchEvent) => {
      if (isGlobeOpenRef.current) return;
      if (Date.now() < manualRevealLockUntilRef.current) return;
      if (isIgnoredControlTarget(e.target)) return;
      if (e.touches.length !== 1 || touchStartYRef.current === null) return;
      if (document.body.dataset.talmudPanning === 'true') return;
      const currentTouchY = e.touches[0].clientY;
      const fingerDeltaY = touchStartYRef.current - currentTouchY; // > 0 means swiping up (scrolling down)
      if (fingerDeltaY > 28) {
        setHideBarsOnScroll(true);
        touchStartYRef.current = currentTouchY;
      } else if (fingerDeltaY < -22) {
        setHideBarsOnScroll(false);
        touchStartYRef.current = currentTouchY;
      }
    };

    const handleRevealEvent = () => {
      manualRevealLockUntilRef.current = Date.now() + 900;
      scrollDeltaAccumRef.current = 0;
      setHideBarsOnScroll(false);
    };

    window.addEventListener('scroll', handleDynamicScroll, { passive: true, capture: true });
    window.addEventListener('wheel', handleWheelGlobal, { passive: true });
    window.addEventListener('touchstart', handleTouchStartGlobal, { passive: true });
    window.addEventListener('touchmove', handleTouchMoveGlobal, { passive: true });
    window.addEventListener('resize', checkDafVisibility, { passive: true });
    window.addEventListener('reveal-top-header-bar', handleRevealEvent);
    return () => {
      if (dafVisRaf) cancelAnimationFrame(dafVisRaf);
      window.removeEventListener('scroll', handleDynamicScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('wheel', handleWheelGlobal);
      window.removeEventListener('touchstart', handleTouchStartGlobal);
      window.removeEventListener('touchmove', handleTouchMoveGlobal);
      window.removeEventListener('resize', checkDafVisibility);
      window.removeEventListener('reveal-top-header-bar', handleRevealEvent);
    };
  }, []);

  useEffect(() => {
    writePreference('talmud_scholar_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    writePreference('talmud_completed_dapim', JSON.stringify(completedDapim));
  }, [completedDapim]);

  const [sharedCalendarDate, setSharedCalendarDate] = useState<Date>(() => new Date());

  const currentTractate = useMemo(
    () => TRACTATES.find((tr) => tr.id === selectedTractateId) || TRACTATES[0],
    [selectedTractateId]
  );

  const [isMishnahMapOpen, setIsMishnahMapOpen] = useState(false);
  const [isMishnahGuideOpen, setIsMishnahGuideOpen] = useState(false);
  const dafMishnahHe = useMemo(
    () => (dafData.mishnah || []).map((m) => m.hebrew || m.hebrewText || '').filter(Boolean),
    [dafData.mishnah]
  );
  const mishnahChapter = useMishnahChapter(
    currentTractate.id,
    selectedDafId,
    dafMishnahHe,
    isMishnahMapOpen || isMishnahGuideOpen
  );
  const mishnahPct = useMemo(() => {
    const len = (arr) => (arr || []).reduce((n, x) => n + (x.hebrew || x.hebrewText || '').length, 0);
    const m = len(dafData.mishnah), g = len(dafData.gemara);
    return m + g > 0 ? Math.round((m / (m + g)) * 100) : 0;
  }, [dafData.mishnah, dafData.gemara]);

  // Sync selectedSederId to the active Daf's Seder so filter windows always display the active Daf by default
  useEffect(() => {
    if (currentTractate?.sederId && selectedSederId !== currentTractate.sederId) {
      setSelectedSederId(currentTractate.sederId);
    }
  }, [currentTractate?.sederId]);

  const { onlineCount, activeScholars } = useLiveOnlinePresence(
    activeRealm,
    `${currentTractate.nameHe} ${selectedDafId}`
  );

  const handleNavigateRealmOrTalmud = useCallback(
    (
      realmId: SacredRealmId,
      bookId?: string,
      chapter?: number,
      tractateId?: string,
      dafId?: string
    ) => {
      manualRevealLockUntilRef.current = Date.now() + 900;
      scrollDeltaAccumRef.current = 0;
      setHideBarsOnScroll(false);
      setActiveRealm(realmId);
      if (bookId || chapter) {
        setRealmTarget({ bookId, chapter });
      }
      if (realmId === 'talmud' && tractateId) {
        const canon = TRACTATES.find((tr) => tr.id.toLowerCase() === tractateId.toLowerCase());
        setSelectedTractateId(canon ? canon.id : tractateId);
        if (dafId) setSelectedDafId(dafId);
      }
    },
    []
  );

  // Record current Daf in Recently Viewed list
  useEffect(() => {
    setRecentlyViewedDapim((prev) => {
      const entry: RecentlyViewedDaf = {
        tractateId: currentTractate.id,
        dafId: selectedDafId,
        tractateNameHe: currentTractate.nameHe,
        tractateNameKa: currentTractate.nameKa,
        timestamp: Date.now(),
      };
      const filtered = prev.filter(
        (item) => !(item.tractateId === entry.tractateId && item.dafId === entry.dafId)
      );
      const updated = [entry, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('talmud_recently_viewed_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [currentTractate, selectedDafId]);

  const sederOptions: SelectOption[] = useMemo(() => {
    return [
      {
        value: 'all',
        badgeHe: 'כל הש״ס',
        label: 'ყველა სედერი (6 სედერი • 37 ტრაქტატი)',
        sublabel: 'ბაბილონის თალმუდის სრული კატალოგი',
      },
      ...SEDARIM.map((s) => ({
        value: s.id,
        badgeHe: s.nameHe,
        label: `${s.nameKa} (${s.nameEn})`,
        sublabel: `სედერი ${s.nameKa}`,
      })),
    ];
  }, []);

  const filteredTractates = useMemo(() => {
    if (selectedSederId === 'all') return TRACTATES;
    return TRACTATES.filter((tr) => tr.sederId === selectedSederId);
  }, [selectedSederId]);

  const tractateOptions: SelectOption[] = useMemo(() => {
    return filteredTractates.map((tr) => ({
      value: tr.id,
      badgeHe: tr.nameHe,
      label: `${tr.nameKa} • ${tr.nameEn}`,
      sublabel: `${tr.descriptionKa} (2a–${tr.lastDaf}b • ${tr.chapters} თავი)`,
    }));
  }, [filteredTractates]);

  const dafList = useMemo(
    () => generateDafListForTractate(currentTractate.lastDaf),
    [currentTractate]
  );

  const dafOptions: SelectOption[] = useMemo(() => {
    return dafList.map((dafId) => {
      const num = parseInt(dafId, 10);
      const isB = dafId.endsWith('b');
      const dafHe = toHebrewDafNumber(num);
      const amudSign = isB ? ':' : '.';
      return {
        value: dafId,
        badgeHe: `דף ${dafHe}${amudSign}`,
        label: `დაფი ${dafId} (${currentTractate.nameKa} ${dafHe} ${isB ? 'ע״ב' : 'ע״א'})`,
        sublabel: isB ? 'უკანა გვერდი — ამუდ ბეთი (עמוד ב׳)' : 'წინა გვერდი — ამუდ ალეფი (עמוד א׳)',
      };
    });
  }, [dafList, currentTractate]);

  // Load Daf data (Curated or live Sefaria with full Commentary Connections)
  useEffect(() => {
    let cancelled = false;
    setSelectedTarget(null);
    setWordExplainStage('none');
    setHighlightedSentenceId(null);

    const baseData = getCuratedOrDynamicDaf(
      currentTractate.id,
      selectedDafId,
      currentTractate.nameHe,
      currentTractate.nameKa
    );

    const builtinComms = getBuiltinSefariaCommentaries(currentTractate.id, selectedDafId);
    const initialDafPayload: DafPageData = {
      ...baseData,
      allCommentaries:
        baseData.allCommentaries && baseData.allCommentaries.length > 0
          ? baseData.allCommentaries
          : builtinComms,
    };
    setDafData(initialDafPayload);

    const isFullyCurated =
      (currentTractate.id === 'Berakhot' &&
        (selectedDafId === '2a' || selectedDafId === '2b' || selectedDafId === '9a' || selectedDafId === '9b')) ||
      (currentTractate.id === 'Taanit' &&
        (selectedDafId === '2a' || selectedDafId === '2b' || selectedDafId === '5a')) ||
      (currentTractate.id === 'Shabbat' &&
        (selectedDafId === '2a' || selectedDafId === '21b')) ||
      (currentTractate.id === 'Bava_Metzia' &&
        (selectedDafId === '2a' || selectedDafId === '21a')) ||
      (currentTractate.id === 'Pesachim' &&
        (selectedDafId === '2a' || selectedDafId === '108a')) ||
      (currentTractate.id === 'Sanhedrin' && selectedDafId === '37a') ||
      (currentTractate.id === 'Kiddushin' && selectedDafId === '40b') ||
      (currentTractate.id === 'Bava_Kamma' && selectedDafId === '2a') ||
      (currentTractate.id === 'Sukkah' && selectedDafId === '45b') ||
      (currentTractate.id === 'Ketubot' && selectedDafId === '17a');

    if (baseData.mishnah && baseData.mishnah.length > 0) {
      activeMishnahByDafRef.current[`${currentTractate.id}:${selectedDafId}`] =
        baseData.mishnah;
    }

    // Check IndexedDB local offline cache first so previously viewed or pack-downloaded Dapim load instantaneously offline!
    getDafFromOfflineStorage(currentTractate.id, selectedDafId).then((cachedRec) => {
      if (cancelled) return;
      if (
        cachedRec &&
        cachedRec.dafData &&
        cachedRec.dafData.tractateId === currentTractate.id &&
        cachedRec.dafData.dafId === selectedDafId &&
        cachedRec.dafData.gemara?.length > 0 &&
        !(
          currentTractate.id !== 'Taanit' &&
          (cachedRec.dafData.gemara[0]?.id?.toLowerCase().includes('taanit') ||
            cachedRec.dafData.gemara[0]?.hebrewText?.includes('גבורות גשמים') ||
            cachedRec.dafData.gemara[0]?.explanationKa?.includes('თაანით'))
        )
      ) {
        setDafData(cachedRec.dafData);
      } else {
        saveDafToOfflineStorage(initialDafPayload, 'viewed');
      }
    });

    async function resolvePreviousActiveMishnah(): Promise<TalmudSentence[]> {
      const dafIdx = dafList.indexOf(selectedDafId);
      if (dafIdx <= 0) {
        return getInitialActiveMishnahForTractate(currentTractate.id);
      }

      // 1. Check in-memory cache of preceding dapim
      for (let i = dafIdx - 1; i >= 0; i--) {
        const prevDaf = dafList[i];
        const cached = activeMishnahByDafRef.current[`${currentTractate.id}:${prevDaf}`];
        if (cached && cached.length > 0) {
          return [cached[cached.length - 1]];
        }
      }

      // 2. Scan up to 3 preceding dapim (and 2a) from Sefaria to find the latest Mishnah before this Daf
      const candidateDapim: string[] = [];
      for (let i = dafIdx - 1; i >= Math.max(0, dafIdx - 3); i--) {
        candidateDapim.push(dafList[i]);
      }
      if (!candidateDapim.includes('2a')) {
        candidateDapim.push('2a');
      }

      for (const candDaf of candidateDapim) {
        try {
          const resp = await fetch(
            `https://www.sefaria.org/api/texts/${encodeURIComponent(
              `${currentTractate.id}.${candDaf}`
            )}?commentary=0&context=0`
          );
          if (!resp.ok) continue;
          const j = await resp.json();
          const hSegs = flattenSefariaTextArray(j.he).slice(0, 16);
          const eSegs = flattenSefariaTextArray(j.text).slice(0, 16);
          const parsed = classifyDafSegments(hSegs, eSegs, candDaf === '2a');
          if (parsed.newMishnahSegments.length > 0) {
            const lastM =
              parsed.newMishnahSegments[parsed.newMishnahSegments.length - 1];
            const kaTrans = await translateToGeorgianLive(
              lastM.en || lastM.he,
              lastM.en ? 'en' : 'iw'
            );
            const foundSentence: TalmudSentence = {
              id: `${currentTractate.id}-${candDaf}-active-m`,
              source: 'mishnah',
              dibburHamatchil: `המשנה הנוכחית (מדף ${candDaf})`,
              hebrewText: lastM.he,
              translationHe: lastM.he,
              translationKa:
                kaTrans ||
                `მიმდინარე მიშნა გვერდიდან ${candDaf}, რომელზეც გრძელდება გემარის მსჯელობა.`,
              explanationKa: `მიმდინარე მიშნა (${currentTractate.nameKa} ${candDaf}), რომელზეც აგებულია ამ გვერდის გემარა.`,
              explanationHe: `המשנה מדף ${candDaf} שעליה נסוב המשך הגמרא.`,
              sugyaStage: {
                type: 'mishnah',
                labelHe: `המשנה הנוכחית (מדף ${candDaf})`,
                labelKa: `მიმდინარე მიშნა (დაფი ${candDaf}-დან)`,
              },
            };
            activeMishnahByDafRef.current[`${currentTractate.id}:${candDaf}`] = [
              foundSentence,
            ];
            return [foundSentence];
          }
        } catch {
          // continue
        }
      }

      return getInitialActiveMishnahForTractate(currentTractate.id);
    }

    async function enrichFromSefaria() {
      if (!isFullyCurated) {
        setLoadingDaf(true);
      }

      try {
        const ref = `${currentTractate.id}.${selectedDafId}`;
        const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(
          ref
        )}?commentary=1&context=1`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Sefaria fetch error');
        const json = await response.json();
        if (cancelled) return;

        // Extract ALL linked commentaries & cross-references from Sefaria
        const rawLinks: Record<string, unknown>[] = Array.isArray(json.commentary)
          ? json.commentary
          : [];

        const extractedCommentaries: SefariaCommentaryItem[] = [];
        const seenCommentaries = new Set<string>();

        for (let idx = 0; idx < rawLinks.length; idx++) {
          const item = rawLinks[idx];
          const rawHeText = flattenSefariaTextArray(item.he).join(' ');
          const heText = rawHeText.replace(/[A-Za-z]/g, '').replace(/\s+/g, ' ').trim();
          const enText = flattenSefariaTextArray(item.text).join(' ');
          if (!heText) continue;

          const rawTitleEn = String(
            item.collectiveTitle && typeof item.collectiveTitle === 'object'
              ? (item.collectiveTitle as Record<string, unknown>).en || item.index_title || 'Commentator'
              : item.index_title || item.type || 'Commentator'
          );
          const rawTitleHe = String(
            item.collectiveTitle && typeof item.collectiveTitle === 'object'
              ? (item.collectiveTitle as Record<string, unknown>).he || 'מפרש'
              : 'מפרש'
          );
          const rawCat = String(item.category || item.type || 'Commentary');
          const refStr = String(item.ref || item.sourceRef || `${rawTitleEn}-${idx}`);
          if (seenCommentaries.has(refStr)) continue;
          seenCommentaries.add(refStr);

          const mappedMeta = mapSefariaCommentatorMeta(rawTitleEn, rawTitleHe, rawCat);

          extractedCommentaries.push({
            id: `sef-comm-${idx}`,
            commentatorEn: rawTitleEn,
            commentatorHe: mappedMeta.he,
            commentatorKa: mappedMeta.ka,
            category: rawCat,
            categoryKa: mappedMeta.categoryKa,
            ref: refStr,
            heRef: String(item.heRef || item.sourceHeRef || mappedMeta.he),
            anchorText: item.anchorText ? stripHtmlTags(String(item.anchorText)) : undefined,
            anchorVerse: typeof item.anchorVerse === 'number' ? item.anchorVerse : undefined,
            he: heText,
            en: enText,
            translationKa: '',
          });

          if (extractedCommentaries.length >= 160) break;
        }

        const mergedCommentaries = [
          ...builtinComms,
          ...extractedCommentaries.filter(
            (ext) => !builtinComms.some((b) => b.commentatorHe === ext.commentatorHe && b.he.slice(0, 25) === ext.he.slice(0, 25))
          ),
        ];

        // Also extract all Rashi and Tosafot from Sefaria so curated dapim also have 100% complete Rashi & Tosafot
        const allRashiLinks = extractedCommentaries.filter(
          (c) =>
            c.commentatorEn.toLowerCase().includes('rashi') ||
            c.commentatorHe.includes('רש"י') ||
            c.commentatorHe.includes('רש״י')
        );
        const allTosafotLinks = extractedCommentaries.filter(
          (c) =>
            c.commentatorEn.toLowerCase().includes('tosafot') ||
            c.commentatorHe.includes('תוספות')
        );

        if (isFullyCurated) {
          const extraRashi: TalmudSentence[] = [];
          for (let idx = 0; idx < allRashiLinks.length; idx++) {
            const r = allRashiLinks[idx];
            const cleanHe = r.he;
            const alreadyInBase = baseData.rashi.some(
              (br) =>
                br.hebrewText.slice(0, 18) === cleanHe.slice(0, 18) ||
                (br.dibburHamatchil && cleanHe.startsWith(br.dibburHamatchil.slice(0, 10)))
            );
            if (!alreadyInBase) {
              const splitParts = cleanHe.split(/[-–:]/);
              const dibbur =
                splitParts.length > 1
                  ? splitParts[0].trim()
                  : cleanHe.split(' ').slice(0, 3).join(' ');
              const body =
                splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
              const ka = await translateToGeorgianLive(r.en || r.he, r.en ? 'en' : 'iw');
              extraRashi.push({
                id: `${currentTractate.id}-${selectedDafId}-r-extra-${idx + 1}`,
                source: 'rashi',
                dibburHamatchil: dibbur,
                hebrewText: body,
                translationHe: cleanHe,
                translationKa: ka || 'რაშის კლასიკური განმარტება გემარის მოცემულ სტრიქონზე.',
                explanationKa: `რაშის განმარტება (${r.heRef || r.ref}): ${ka || cleanHe}`,
                explanationHe: `פירוש רש"י על הסוגיה בדף ${selectedDafId}.`,
              });
            }
          }

          const extraTosafot: TalmudSentence[] = [];
          for (let idx = 0; idx < allTosafotLinks.length; idx++) {
            const tos = allTosafotLinks[idx];
            const cleanHe = tos.he;
            const alreadyInBase = baseData.tosafot.some(
              (bt) =>
                bt.hebrewText.slice(0, 18) === cleanHe.slice(0, 18) ||
                (bt.dibburHamatchil && cleanHe.startsWith(bt.dibburHamatchil.slice(0, 10)))
            );
            if (!alreadyInBase) {
              const splitParts = cleanHe.split(/[-–:]/);
              const dibbur =
                splitParts.length > 1
                  ? splitParts[0].trim()
                  : cleanHe.split(' ').slice(0, 4).join(' ');
              const body =
                splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
              const ka = await translateToGeorgianLive(tos.en || tos.he, tos.en ? 'en' : 'iw');
              extraTosafot.push({
                id: `${currentTractate.id}-${selectedDafId}-t-extra-${idx + 1}`,
                source: 'tosafot',
                dibburHamatchil: dibbur,
                hebrewText: body,
                translationHe: cleanHe,
                translationKa: ka || 'თოსაფოთის შედარებითი ანალიზი და კითხვა-პასუხი.',
                explanationKa: `თოსაფოთის დიალექტიკური განმარტება (${tos.heRef || tos.ref}): ${ka || cleanHe}`,
                explanationHe: `חידושי התוספות על הסוגיה בדף ${selectedDafId}.`,
              });
            }
          }

          if (!cancelled) {
            setDafData((prev) => {
              const updatedCurated: DafPageData = {
                ...prev,
                rashi: extraRashi.length > 0 ? [...baseData.rashi, ...extraRashi] : prev.rashi,
                tosafot: extraTosafot.length > 0 ? [...baseData.tosafot, ...extraTosafot] : prev.tosafot,
                allCommentaries:
                  mergedCommentaries.length > 0 ? mergedCommentaries : prev.allCommentaries,
              };
              saveDafToOfflineStorage(updatedCurated, 'viewed');
              return updatedCurated;
            });
          }
          return;
        }

        // For non-curated dapim, accurately classify Mishnah vs Gemara segments!
        const heSegments = flattenSefariaTextArray(json.he);
        const enSegments = flattenSefariaTextArray(json.text);

        if (heSegments.length > 0) {
          const isFirstDaf2a = selectedDafId === '2a';
          const {
            newMishnahSegments,
            gemaraSegments,
            hasGemaraBeforeFirstNewMishnah,
          } = classifyDafSegments(heSegments, enSegments, isFirstDaf2a);

          const rashiLinks = allRashiLinks;
          const tosafotLinks = allTosafotLinks;
          const masoretLinks = extractedCommentaries
            .filter(
              (c) =>
                c.category.toLowerCase().includes('talmud') ||
                c.category.toLowerCase().includes('tanakh')
            )
            .slice(0, 4);

          const masoretItems: MasoretRef[] =
            masoretLinks.length > 0
              ? masoretLinks.map((m, idx) => ({
                  id: `mas-live-${idx}`,
                  marker: ['א', 'ב', 'ג', 'ד'][idx] || 'א',
                  refHe: m.heRef,
                  refKa: `${m.commentatorKa} (${m.ref})`,
                }))
              : baseData.masoretHaShas;

          // PHASE 1: Instant update with Sefaria Hebrew text so Daf transitions feel immediate (<300ms)
          if (!cancelled) {
            const quickMishnah: TalmudSentence[] =
              newMishnahSegments.length > 0
                ? newMishnahSegments.map((seg, idx) => ({
                    id: `${currentTractate.id}-${selectedDafId}-m-new-${idx + 1}`,
                    source: 'mishnah',
                    dibburHamatchil: isFirstDaf2a ? undefined : `מתני׳ דף ${selectedDafId}`,
                    hebrewText: seg.he,
                    translationHe: seg.he,
                    translationKa:
                      baseData.mishnah[idx]?.translationKa ||
                      `მიშნა (${currentTractate.nameKa} ${selectedDafId}, მონაკვეთი ${idx + 1}).`,
                    explanationKa:
                      baseData.mishnah[idx]?.explanationKa ||
                      `მიშნა (${currentTractate.nameKa} ${selectedDafId}).`,
                    explanationHe: `משנה בדף ${selectedDafId} במסכת ${currentTractate.nameHe}.`,
                    sugyaStage: {
                      type: 'mishnah',
                      labelHe: isFirstDaf2a ? 'מתני׳ • משנה' : `מתני׳ חדשה בדף זה (${selectedDafId})`,
                      labelKa: isFirstDaf2a
                        ? 'მიშნა (დაფის დასაწყისი)'
                        : `ახალი მიშნა ამ დაფზე (${selectedDafId})`,
                    },
                  }))
                : baseData.mishnah;

            const quickGemara: TalmudSentence[] =
              gemaraSegments.length > 0
                ? gemaraSegments.map((seg, idx) => ({
                    id: `${currentTractate.id}-${selectedDafId}-g${idx + 1}`,
                    source: 'gemara',
                    hebrewText: seg.he,
                    translationHe: seg.he,
                    translationKa:
                      baseData.gemara[idx % Math.max(1, baseData.gemara.length)]?.translationKa ||
                      `გემარის სუგია (${currentTractate.nameKa} ${selectedDafId}, მონაკვეთი ${idx + 1}).`,
                    explanationKa:
                      baseData.gemara[idx % Math.max(1, baseData.gemara.length)]?.explanationKa ||
                      `გემარის სუგია (მონაკვეთი ${idx + 1}) — ${currentTractate.nameKa} ${selectedDafId}.`,
                    explanationHe: `סוגיית הגמרא בדף ${selectedDafId} (קטע ${idx + 1}).`,
                    sugyaStage: {
                      type: idx % 2 === 0 ? 'question' : 'answer',
                      labelHe: idx % 2 === 0 ? 'שקלא וטריא' : 'תירוץ הגמרא',
                      labelKa: idx % 2 === 0 ? 'სუგიის განხილვა' : 'გემარის განმარტება',
                    },
                  }))
                : baseData.gemara;

            const quickRashi: TalmudSentence[] =
              rashiLinks.length > 0
                ? rashiLinks.map((r, idx) => {
                    const cleanHe = r.he;
                    const splitParts = cleanHe.split(/[-–:]/);
                    const dibbur =
                      splitParts.length > 1
                        ? splitParts[0].trim()
                        : cleanHe.split(' ').slice(0, 3).join(' ');
                    const body =
                      splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
                    return {
                      id: `${currentTractate.id}-${selectedDafId}-r${idx + 1}`,
                      source: 'rashi',
                      dibburHamatchil: dibbur,
                      hebrewText: body,
                      translationHe: cleanHe,
                      translationKa:
                        baseData.rashi[idx % Math.max(1, baseData.rashi.length)]?.translationKa ||
                        'რაშის კლასიკური განმარტება გემარის მოცემულ სტრიქონზე.',
                      explanationKa: `რაშის განმარტება (${r.heRef || r.ref}).`,
                      explanationHe: `פירוש רש"י על הסוגיה בדף ${selectedDafId}.`,
                    };
                  })
                : baseData.rashi;

            const quickTosafot: TalmudSentence[] =
              tosafotLinks.length > 0
                ? tosafotLinks.map((tos, idx) => {
                    const cleanHe = tos.he;
                    const splitParts = cleanHe.split(/[-–:]/);
                    const dibbur =
                      splitParts.length > 1
                        ? splitParts[0].trim()
                        : cleanHe.split(' ').slice(0, 4).join(' ');
                    const body =
                      splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
                    return {
                      id: `${currentTractate.id}-${selectedDafId}-t${idx + 1}`,
                      source: 'tosafot',
                      dibburHamatchil: dibbur,
                      hebrewText: body,
                      translationHe: cleanHe,
                      translationKa:
                        baseData.tosafot[idx % Math.max(1, baseData.tosafot.length)]
                          ?.translationKa || 'თოსაფოთის შედარებითი ანალიზი და კითხვა-პასუხი.',
                      explanationKa: `თოსაფოთის დიალექტიკური განმარტება (${tos.heRef || tos.ref}).`,
                      explanationHe: `חידושי התוספות על הסוגיה בדף ${selectedDafId}.`,
                    };
                  })
                : baseData.tosafot;

            setDafData({
              ...baseData,
              openingWordHe: heSegments[0].split(' ')[0] || baseData.openingWordHe,
              mishnah: quickMishnah,
              gemara: quickGemara,
              rashi: quickRashi,
              tosafot: quickTosafot,
              masoretHaShas: masoretItems,
              allCommentaries: mergedCommentaries,
            });
            setLoadingDaf(false);
          }

          // PHASE 2: Background live Georgian translations for top segments
          const newMishnahItems: TalmudSentence[] = await Promise.all(
            newMishnahSegments.map(async (seg, idx) => {
              const ka = await translateToGeorgianLive(
                seg.en || seg.he,
                seg.en ? 'en' : 'iw'
              );
              const labelKa = isFirstDaf2a
                ? 'მიშნა (დაფის დასაწყისი)'
                : `ახალი მიშნა ამ დაფზე (${selectedDafId})`;
              const labelHe = isFirstDaf2a
                ? 'מתני׳ • משנה'
                : `מתני׳ חדשה בדף זה (${selectedDafId})`;
              return {
                id: `${currentTractate.id}-${selectedDafId}-m-new-${idx + 1}`,
                source: 'mishnah',
                dibburHamatchil: isFirstDaf2a ? undefined : `מתני׳ דף ${selectedDafId}`,
                hebrewText: seg.he,
                translationHe: seg.he,
                translationKa:
                  ka ||
                  baseData.mishnah[idx]?.translationKa ||
                  `მიშნა (${currentTractate.nameKa} ${selectedDafId}, მონაკვეთი ${idx + 1}).`,
                explanationKa: `${labelKa}: ${
                  ka || `${currentTractate.nameKa} ${selectedDafId}`
                }`,
                explanationHe: `משנה בדף ${selectedDafId} במסכת ${currentTractate.nameHe}.`,
                sugyaStage: {
                  type: 'mishnah',
                  labelHe,
                  labelKa,
                },
              };
            })
          );

          let finalMishnahItems: TalmudSentence[] = [];
          if (newMishnahItems.length === 0) {
            const prevMishnah = await resolvePreviousActiveMishnah();
            finalMishnahItems = prevMishnah.map((pm, idx) => ({
              ...pm,
              id: `${currentTractate.id}-${selectedDafId}-prev-m-${idx + 1}`,
              dibburHamatchil: pm.dibburHamatchil || 'המשנה הנוכחית (מהדף הקודם)',
              sugyaStage: {
                type: 'mishnah',
                labelHe: 'המשנה הנוכחית (נמשך בגמרא)',
                labelKa: 'მიმდინარე მიშნა (წინა დაფიდან — გრძელდება გემარა)',
              },
            }));
            activeMishnahByDafRef.current[`${currentTractate.id}:${selectedDafId}`] =
              finalMishnahItems;
          } else if (hasGemaraBeforeFirstNewMishnah && !isFirstDaf2a) {
            const prevMishnah = await resolvePreviousActiveMishnah();
            const taggedPrevMishnah = prevMishnah.map((pm, idx) => ({
              ...pm,
              id: `${currentTractate.id}-${selectedDafId}-prev-m-${idx + 1}`,
              dibburHamatchil: 'משנה קודמת (המשך הגמרא בדף זה)',
              sugyaStage: {
                type: 'mishnah' as const,
                labelHe: 'משנה קודמת (המשך הגמרא בדף זה)',
                labelKa: 'წინა მიშნა (ამ დაფზე ჯერ კიდევ გრძელდება მისი გემარა)',
              },
            }));
            finalMishnahItems = [...taggedPrevMishnah, ...newMishnahItems];
            activeMishnahByDafRef.current[`${currentTractate.id}:${selectedDafId}`] = [
              newMishnahItems[newMishnahItems.length - 1],
            ];
          } else {
            finalMishnahItems = newMishnahItems;
            activeMishnahByDafRef.current[`${currentTractate.id}:${selectedDafId}`] = [
              newMishnahItems[newMishnahItems.length - 1],
            ];
          }

          const gemaraItems: TalmudSentence[] = await Promise.all(
            gemaraSegments.map(async (seg, idx) => {
              const fallbackKa =
                baseData.gemara[idx % Math.max(1, baseData.gemara.length)]?.translationKa ||
                `გემარის სუგია (${currentTractate.nameKa} ${selectedDafId}, მონაკვეთი ${idx + 1}).`;
              const kaText =
                idx < 8
                  ? (await translateToGeorgianLive(
                      seg.en || seg.he,
                      seg.en ? 'en' : 'iw'
                    )) || fallbackKa
                  : fallbackKa;
              return {
                id: `${currentTractate.id}-${selectedDafId}-g${idx + 1}`,
                source: 'gemara',
                hebrewText: seg.he,
                translationHe: seg.he,
                translationKa: kaText,
                explanationKa: `გემარის სუგია (მონაკვეთი ${idx + 1}) — ${currentTractate.nameKa} ${selectedDafId}: ${kaText}`,
                explanationHe: `סוגיית הגמרא בדף ${selectedDafId} (קטע ${idx + 1}).`,
                sugyaStage: {
                  type: idx % 2 === 0 ? 'question' : 'answer',
                  labelHe: idx % 2 === 0 ? 'שקלא וטריא' : 'תירוץ הגמרא',
                  labelKa: idx % 2 === 0 ? 'სუგიის განხილვა' : 'გემარის განმარტება',
                },
              };
            })
          );

          const rashiTranslations = await Promise.all(
            rashiLinks.map(async (r, idx) => {
              const fallbackKa =
                baseData.rashi[idx % Math.max(1, baseData.rashi.length)]?.translationKa ||
                'რაშის კლასიკური განმარტება გემარის მოცემულ სტრიქონზე.';
              if (idx >= 8) return fallbackKa;
              const ka = await translateToGeorgianLive(r.en || r.he, r.en ? 'en' : 'iw');
              return ka || fallbackKa;
            })
          );

          const rashiItems: TalmudSentence[] =
            rashiLinks.length > 0
              ? rashiLinks.map((r, idx) => {
                  const cleanHe = r.he;
                  const splitParts = cleanHe.split(/[-–:]/);
                  const dibbur =
                    splitParts.length > 1
                      ? splitParts[0].trim()
                      : cleanHe.split(' ').slice(0, 3).join(' ');
                  const body =
                    splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
                  return {
                    id: `${currentTractate.id}-${selectedDafId}-r${idx + 1}`,
                    source: 'rashi',
                    dibburHamatchil: dibbur,
                    hebrewText: body,
                    translationHe: cleanHe,
                    translationKa: rashiTranslations[idx],
                    explanationKa: `რაშის განმარტება (${r.heRef || r.ref}): ${rashiTranslations[idx]}`,
                    explanationHe: `פירוש רש"י על הסוגיה בדף ${selectedDafId}.`,
                  };
                })
              : baseData.rashi;

          const tosafotTranslations = await Promise.all(
            tosafotLinks.map(async (tos, idx) => {
              const fallbackKa =
                baseData.tosafot[idx % Math.max(1, baseData.tosafot.length)]?.translationKa ||
                'თოსაფოთის შედარებითი ანალიზი და კითხვა-პასუხი.';
              if (idx >= 6) return fallbackKa;
              const ka = await translateToGeorgianLive(tos.en || tos.he, tos.en ? 'en' : 'iw');
              return ka || fallbackKa;
            })
          );

          const tosafotItems: TalmudSentence[] =
            tosafotLinks.length > 0
              ? tosafotLinks.map((tos, idx) => {
                  const cleanHe = tos.he;
                  const splitParts = cleanHe.split(/[-–:]/);
                  const dibbur =
                    splitParts.length > 1
                      ? splitParts[0].trim()
                      : cleanHe.split(' ').slice(0, 4).join(' ');
                  const body =
                    splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : cleanHe;
                  return {
                    id: `${currentTractate.id}-${selectedDafId}-t${idx + 1}`,
                    source: 'tosafot',
                    dibburHamatchil: dibbur,
                    hebrewText: body,
                    translationHe: cleanHe,
                    translationKa: tosafotTranslations[idx],
                    explanationKa: `თოსაფოთის დიალექტიკური განმარტება (${tos.heRef || tos.ref}): ${tosafotTranslations[idx]}`,
                    explanationHe: `חידושי התוספות על הסוגיה בדף ${selectedDafId}.`,
                  };
                })
              : baseData.tosafot;

          if (!cancelled) {
            const enrichedDafPayload: DafPageData = {
              ...baseData,
              openingWordHe: heSegments[0].split(' ')[0] || baseData.openingWordHe,
              mishnah: finalMishnahItems,
              gemara: gemaraItems.length > 0 ? gemaraItems : baseData.gemara,
              rashi: rashiItems,
              tosafot: tosafotItems,
              masoretHaShas: masoretItems,
              allCommentaries: mergedCommentaries,
            };
            setDafData(enrichedDafPayload);
            saveDafToOfflineStorage(enrichedDafPayload, 'viewed');
          }
        }
      } catch {
        // Keep instantaneous fallback
      } finally {
        if (!cancelled) setLoadingDaf(false);
      }
    }

    if (activeRealm !== 'talmud' || isGlobeOpen) {
      return () => {
        cancelled = true;
      };
    }

    enrichFromSefaria();

    return () => {
      cancelled = true;
    };
  }, [currentTractate, selectedDafId, activeRealm, isGlobeOpen]);

  // When searchHighlightQuery is active and dafData updates, locate the matching sentence/word and highlight + scroll to it
  useEffect(() => {
    if (!searchHighlightQuery.trim()) return;
    const qRaw = searchHighlightQuery.trim();
    const qLower = qRaw.toLowerCase();
    const qCleanHe = normalizeHebrewWord(qRaw);
    const qTokensHe = qRaw
      .split(/[\s,.:;?!()[\]"'„“״׳—–-]+/)
      .map((w) => normalizeHebrewWord(w))
      .filter((w) => w.length >= 2);

    const allSentences: TalmudSentence[] = [
      ...(dafData.mishnah || []),
      ...(dafData.gemara || []),
      ...(dafData.rashi || []),
      ...(dafData.tosafot || []),
      ...(dafData.chavruta || []),
      ...(dafData.meforshim || []),
    ];
    if (allSentences.length === 0) return;

    const matchedSentence =
      allSentences.find((s) => {
        const heNorm = normalizeHebrewWord(s.hebrewText || '');
        const kaLower = (s.translationKa || '').toLowerCase();
        const expLower = (s.explanationKa || '').toLowerCase();
        if (qCleanHe.length >= 2 && heNorm.includes(qCleanHe)) return true;
        if (qTokensHe.length >= 2) {
          const hitCount = qTokensHe.filter((tok) => heNorm.includes(tok)).length;
          if (hitCount >= Math.min(2, qTokensHe.length)) return true;
        }
        if (qLower.length >= 2 && (kaLower.includes(qLower) || expLower.includes(qLower))) return true;
        const words = qLower.split(/\s+/).filter((w) => w.length >= 3);
        return words.some(
          (w) =>
            kaLower.includes(w) ||
            expLower.includes(w) ||
            (normalizeHebrewWord(w).length >= 2 && heNorm.includes(normalizeHebrewWord(w)))
        );
      }) || allSentences[0];

    if (matchedSentence) {
      setHighlightedSentenceId(matchedSentence.id);
      const heWords = (matchedSentence.hebrewText || '').trim().split(/\s+/).filter(Boolean);
      const matchedWord =
        heWords.find((w) => {
          const nw = normalizeHebrewWord(w);
          return (
            nw &&
            ((qCleanHe.length >= 2 && (nw.includes(qCleanHe) || qCleanHe.includes(nw))) ||
              qTokensHe.some((tok) => nw.includes(tok) || tok.includes(nw)))
          );
        }) ||
        heWords[0] ||
        qRaw;

      const timer = window.setTimeout(() => {
        const sentEl = document.getElementById(`sentence-${matchedSentence.id}`);
        if (sentEl) {
          const scrollCol = sentEl.closest('.overflow-y-auto') as HTMLElement | null;
          if (scrollCol) {
            const elRect = sentEl.getBoundingClientRect();
            const colRect = scrollCol.getBoundingClientRect();
            const deltaTop = elRect.top - colRect.top - colRect.height * 0.25;
            scrollCol.scrollTo({
              top: Math.max(0, scrollCol.scrollTop + deltaTop),
              behavior: 'smooth',
            });
          }
          sentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const r = sentEl.getBoundingClientRect();
          setSelectedTarget({
            word: matchedWord,
            cleanWord: normalizeHebrewWord(matchedWord) || matchedWord,
            sentence: matchedSentence,
            rect: {
              top: r.top,
              left: r.left,
              bottom: r.bottom,
              right: r.right,
              width: Math.min(120, r.width),
              height: Math.min(36, r.height),
            },
          });
          setWordExplainStage('marked');
        }
      }, 360);
      return () => window.clearTimeout(timer);
    }
  }, [searchHighlightQuery, dafData]);

  // 3-Stage Word & Sentence Selection Handler:
  // Tap 1: Marks word/sentence in soft color + cross-highlights related Rashi/Tosafot/Commentary entries across the Daf.
  // Tap 2 (on already marked word/sentence): Opens compact Note window right below/above the word.
  // From Note window: User can open the full Deep Explanation Screen.
  const latestSelectReqIdRef = useRef(0);

  const handleSelectWordOrSentence = useCallback(
    async (
      word: string,
      sentence: TalmudSentence,
      rect: DOMRect,
      initialMode?: AnalysisMode
    ) => {
      const reqId = ++latestSelectReqIdRef.current;
      const cleanWord = normalizeHebrewWord(word);
      const isSameTarget =
        selectedTarget &&
        selectedTarget.sentence.id === sentence.id &&
        selectedTarget.cleanWord === cleanWord;

      setHighlightedSentenceId(sentence.id);

      const targetObj: SelectedDafTarget = {
        word,
        cleanWord,
        sentence,
        rect: {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        },
      };

      setSelectedTarget(targetObj);
      if (initialMode) {
        setActiveMode(initialMode);
      }

      if (wordExplainStage === 'deep') {
        // User is inside the Deep Study Window: tapping any word explains it immediately right inside the window!
        setWordExplainStage('deep');
      } else if (wordExplainStage === 'note') {
        // User is inside the Note Window: tapping another word keeps note window open with the new word
        if (isSameTarget) {
          setWordExplainStage('deep');
        } else {
          setWordExplainStage('note');
        }
      } else if (wordExplainStage === 'marked') {
        if (isSameTarget) {
          setWordExplainStage('note');
        } else {
          setWordExplainStage('marked');
        }
      } else {
        setWordExplainStage('marked');
      }

      const heSnippetKey = (sentence.hebrewText || sentence.hebrew || '').slice(0, 32);
      const cacheKey = `${activeRealm}:${currentTractate.id}:${selectedDafId}:${sentence.id}:${heSnippetKey}:${cleanWord}`;
      if (analysisCache[cacheKey]) {
        const cached = analysisCache[cacheKey];
        if (initialMode === 'source-lookup' && !cached.sourceDetails) {
          // Proceed to fetch sourceDetails
        } else {
          setAnalysisResult(cached);
          return;
        }
      }

      const lex = findLexiconEntry(word);
      const builtinSource: SourceLookupResult | undefined =
        sentence.sourceDetails ||
        findBuiltinSourceForText(`${word} ${sentence.hebrewText}`) ||
        undefined;

      // Ensure sentence Georgian translation is truly Georgian (never raw English)
      let initialSentenceKa = sentence.translationKa || '';
      if (!initialSentenceKa || containsLatinButNoGeorgian(initialSentenceKa)) {
        initialSentenceKa = 'მიმდინარეობს ქართული თარგმანის მომზადება...';
      }

      const instantResult: WordSentenceAnalysisResult = {
        wordTranslationHebrew:
          lex?.translationHe || `משמעות המילה "${word}" בהקשר הסוגיה: ${sentence.translationHe || sentence.hebrewText}`,
        wordTranslationGeorgian:
          lex?.translationKa ||
          `სიტყვა „${word}“ (${transliterateHebrewToGeorgian(word)})`,
        wordTransliterationGeorgian: lex?.translitKa || transliterateHebrewToGeorgian(word),
        wordRootAndGrammar:
          lex?.rootAndGrammar || 'ებრაულ-არამეული კანონიკური ლექსიკური ერთეული',
        wordExplanationGeorgian:
          lex?.explanationKa || sentence.explanationKa || initialSentenceKa,
        wordExplanationHebrew: lex?.explanationHe || sentence.explanationHe || sentence.hebrewText,
        sentenceTranslationHebrew: sentence.translationHe || sentence.hebrewText,
        sentenceTranslationGeorgian: initialSentenceKa,
        sentenceExplanationGeorgian: sentence.explanationKa || initialSentenceKa,
        sentenceExplanationHebrew: sentence.explanationHe || sentence.hebrewText,
        sugyaRole: sentence.sugyaStage
          ? `${sentence.sugyaStage.labelKa} (${sentence.sugyaStage.labelHe})`
          : `წყარო: ${sentence.source.toUpperCase()}`,
        sourceDetails: builtinSource,
      };

      // Immediately update analysisResult synchronously so the Note window NEVER shows a stale previous word!
      setAnalysisResult(instantResult);

      // Immediately ensure Georgian translations are populated even if offline/APK or non-lexicon word
      const needsWordKa = !lex?.translationKa;
      const needsSentKa =
        !sentence.translationKa ||
        containsLatinButNoGeorgian(sentence.translationKa) ||
        sentence.translationKa.includes('თალმუდის ორიგინალური სტრიქონი');
      const needsExplainKa =
        !sentence.explanationKa ||
        containsLatinButNoGeorgian(sentence.explanationKa) ||
        sentence.explanationKa.includes('ვილნას შასის კლასიკური ტექსტი');

      if (needsWordKa || needsSentKa || needsExplainKa || !builtinSource) {
        setAnalysisLoading(true);
        try {
          // 1) Try live Google Translate first for instant reliable Georgian text
          const [liveWordKa, liveWordHe, liveSentKa, liveExplainKa] = await Promise.all([
            needsWordKa ? translateToGeorgianLive(word, 'iw') : Promise.resolve(lex?.translationKa || ''),
            needsWordKa ? translateToModernHebrewLive(word) : Promise.resolve(lex?.translationHe || ''),
            needsSentKa
              ? translateToGeorgianLive(
                  containsLatinButNoGeorgian(sentence.translationKa)
                    ? sentence.translationKa
                    : sentence.hebrewText,
                  containsLatinButNoGeorgian(sentence.translationKa) ? 'en' : 'iw'
                )
              : Promise.resolve(sentence.translationKa),
            needsExplainKa
              ? translateToGeorgianLive(
                  containsLatinButNoGeorgian(sentence.explanationKa)
                    ? sentence.explanationKa
                    : sentence.hebrewText,
                  containsLatinButNoGeorgian(sentence.explanationKa) ? 'en' : 'iw'
                )
              : Promise.resolve(sentence.explanationKa),
          ]);

          if (reqId !== latestSelectReqIdRef.current) return;

          const updatedWithLive: WordSentenceAnalysisResult = {
            ...instantResult,
            wordTranslationGeorgian:
              lex?.translationKa ||
              normalizeGeorgianJewishTerms(liveWordKa) ||
              instantResult.wordTranslationGeorgian,
            wordTranslationHebrew:
              lex?.translationHe || liveWordHe || instantResult.wordTranslationHebrew,
            wordExplanationGeorgian:
              lex?.explanationKa ||
              (liveWordKa
                ? `სიტყვა „${word}“ (${instantResult.wordTransliterationGeorgian}) ნიშნავს: „${normalizeGeorgianJewishTerms(
                    liveWordKa
                  )}“. კონტექსტი: ${
                    normalizeGeorgianJewishTerms(liveSentKa) || instantResult.sentenceTranslationGeorgian
                  }`
                : normalizeGeorgianJewishTerms(liveExplainKa) || instantResult.wordExplanationGeorgian),
            sentenceTranslationGeorgian:
              normalizeGeorgianJewishTerms(liveSentKa) || instantResult.sentenceTranslationGeorgian,
            sentenceExplanationGeorgian:
              normalizeGeorgianJewishTerms(liveExplainKa) || instantResult.sentenceExplanationGeorgian,
          };

          setAnalysisResult(updatedWithLive);

          // 2) Also query Gemini backend (works in both Web and Android APK via getBackendUrl)
          const res = await fetch(getBackendUrl('/api/talmud/analyze'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word,
              sentence: sentence.hebrewText,
              sourceType: sentence.source,
              tractate: activeRealm === 'siddur' ? 'სიდური כוונת הלב' : currentTractate.nameKa,
              daf: selectedDafId,
            }),
          });

          if (reqId !== latestSelectReqIdRef.current) return;

          if (res.ok) {
            const aiData = await res.json();
            const isGenericWordFallback =
              !aiData.wordTranslationGeorgian ||
              aiData.wordTranslationGeorgian.includes('თალმუდური ტერმინი მოცემულ სუგიაში');
            const isGenericExplainFallback =
              !aiData.wordExplanationGeorgian ||
              aiData.wordExplanationGeorgian.includes('წარმოადგენს მსჯელობის საკვანძო ელემენტს');
            const isGenericSentFallback =
              !aiData.sentenceTranslationGeorgian ||
              aiData.sentenceTranslationGeorgian.includes('თალმუდის სტრიქონის კონტექსტუალური თარგმანი');

            const merged: WordSentenceAnalysisResult = {
              wordTranslationHebrew:
                lex?.translationHe ||
                (!isGenericWordFallback ? aiData.wordTranslationHebrew : '') ||
                updatedWithLive.wordTranslationHebrew,
              wordTranslationGeorgian:
                lex?.translationKa ||
                (!isGenericWordFallback
                  ? normalizeGeorgianJewishTerms(aiData.wordTranslationGeorgian)
                  : '') ||
                updatedWithLive.wordTranslationGeorgian,
              wordTransliterationGeorgian:
                lex?.translitKa ||
                (!isGenericWordFallback ? aiData.wordTransliterationGeorgian : '') ||
                updatedWithLive.wordTransliterationGeorgian,
              wordRootAndGrammar:
                lex?.rootAndGrammar ||
                (!isGenericWordFallback ? aiData.wordRootAndGrammar : '') ||
                updatedWithLive.wordRootAndGrammar,
              wordExplanationGeorgian:
                lex?.explanationKa ||
                (!isGenericExplainFallback
                  ? normalizeGeorgianJewishTerms(aiData.wordExplanationGeorgian)
                  : '') ||
                updatedWithLive.wordExplanationGeorgian,
              wordExplanationHebrew:
                lex?.explanationHe ||
                (!isGenericExplainFallback ? aiData.wordExplanationHebrew : '') ||
                updatedWithLive.wordExplanationHebrew,
              sentenceTranslationHebrew:
                (!isGenericSentFallback ? aiData.sentenceTranslationHebrew : '') ||
                updatedWithLive.sentenceTranslationHebrew,
              sentenceTranslationGeorgian:
                (!needsSentKa ? sentence.translationKa : '') ||
                (!isGenericSentFallback
                  ? normalizeGeorgianJewishTerms(aiData.sentenceTranslationGeorgian)
                  : '') ||
                updatedWithLive.sentenceTranslationGeorgian,
              sentenceExplanationGeorgian:
                (!needsExplainKa ? sentence.explanationKa : '') ||
                (!isGenericSentFallback
                  ? normalizeGeorgianJewishTerms(aiData.sentenceExplanationGeorgian)
                  : '') ||
                updatedWithLive.sentenceExplanationGeorgian,
              sentenceExplanationHebrew:
                aiData.sentenceExplanationHebrew || updatedWithLive.sentenceExplanationHebrew,
              sugyaRole: aiData.sugyaRole || updatedWithLive.sugyaRole,
              sourceDetails: aiData.sourceDetails || builtinSource,
            };
            if (reqId === latestSelectReqIdRef.current) {
              setAnalysisResult(merged);
            }
            setAnalysisCache((prev) => ({ ...prev, [cacheKey]: merged }));
          } else {
            setAnalysisCache((prev) => ({ ...prev, [cacheKey]: updatedWithLive }));
          }
        } catch {
          // Keep live Google translation fallback
        } finally {
          if (reqId === latestSelectReqIdRef.current) {
            setAnalysisLoading(false);
          }
        }
      } else {
        setAnalysisCache((prev) => ({ ...prev, [cacheKey]: instantResult }));
      }
    },
    [activeRealm, currentTractate, selectedDafId, analysisCache, selectedTarget, wordExplainStage]
  );

  // If user switches to 'source-lookup' and sourceDetails isn't populated yet, fetch it on demand
  const handleSelectMode = useCallback(
    async (mode: AnalysisMode) => {
      setActiveMode(mode);
      if (
        mode === 'source-lookup' &&
        selectedTarget &&
        analysisResult &&
        !analysisResult.sourceDetails
      ) {
        const builtin = findBuiltinSourceForText(
          `${selectedTarget.word} ${selectedTarget.sentence.hebrewText}`
        );
        if (builtin) {
          setAnalysisResult((prev) => (prev ? { ...prev, sourceDetails: builtin } : prev));
          return;
        }

        setAnalysisLoading(true);
        try {
          const res = await fetch(getBackendUrl('/api/talmud/source-lookup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word: selectedTarget.word,
              sentence: selectedTarget.sentence.hebrewText,
              tractate: currentTractate.nameKa,
              daf: selectedDafId,
            }),
          });
          if (res.ok) {
            const srcData: SourceLookupResult = await res.json();
            setAnalysisResult((prev) =>
              prev ? { ...prev, sourceDetails: srcData } : prev
            );
          }
        } catch {
          // Keep default fallback inside WordSentencePopover
        } finally {
          setAnalysisLoading(false);
        }
      }
    },
    [selectedTarget, analysisResult, currentTractate, selectedDafId]
  );

  const handlePrevAmud = useCallback(
    (fromBottomBar = false) => {
      if (fromBottomBar) {
        lastBottomNavClickRef.current = Date.now();
        setHideBarsOnScroll(false);
      }
      setPageTurnDirection(-1);
      setSelectedTarget(null);
      setWordExplainStage('none');
      setSearchHighlightQuery('');
      playBookPageTurnSound();
      const idx = dafList.indexOf(selectedDafId);
      if (idx > 0) {
        setSelectedDafId(dafList[idx - 1]);
      } else {
        const trIdx = TRACTATES.findIndex((t) => t.id === currentTractate.id);
        const prevTr =
          trIdx > 0 ? TRACTATES[trIdx - 1] : TRACTATES[TRACTATES.length - 1];
        const prevDafList = generateDafListForTractate(prevTr.lastDaf);
        setSelectedTractateId(prevTr.id);
        setSelectedDafId(prevDafList[prevDafList.length - 1] || '2a');
      }
    },
    [dafList, selectedDafId, currentTractate]
  );

  const handleNextAmud = useCallback(
    (fromBottomBar = false) => {
      if (fromBottomBar) {
        lastBottomNavClickRef.current = Date.now();
        setHideBarsOnScroll(false);
      }
      setPageTurnDirection(1);
      setSelectedTarget(null);
      setWordExplainStage('none');
      setSearchHighlightQuery('');
      playBookPageTurnSound();
      const idx = dafList.indexOf(selectedDafId);
      if (idx >= 0 && idx < dafList.length - 1) {
        setSelectedDafId(dafList[idx + 1]);
      } else {
        const trIdx = TRACTATES.findIndex((t) => t.id === currentTractate.id);
        const nextTr =
          trIdx >= 0 && trIdx < TRACTATES.length - 1
            ? TRACTATES[trIdx + 1]
            : TRACTATES[0];
        setSelectedTractateId(nextTr.id);
        setSelectedDafId('2a');
      }
    },
    [dafList, selectedDafId, currentTractate]
  );

  const handleAddNote = (noteText: string) => {
    if (!selectedTarget) return;
    const newNote: ScholarNote = {
      id: `note-${Date.now()}`,
      tractateId: currentTractate.id,
      dafId: selectedDafId,
      sentenceId: selectedTarget.sentence.id,
      word: selectedTarget.word,
      hebrewSnippet: selectedTarget.sentence.hebrewText.slice(0, 90),
      noteText,
      createdAt: new Date().toLocaleDateString('ka-GE'),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleAddDafNote = (sectionLabel: string, noteText: string) => {
    const firstSentence =
      dafData.mishnah[0] || dafData.gemara[0] || dafData.rashi[0];
    const newNote: ScholarNote = {
      id: `note-${Date.now()}`,
      tractateId: currentTractate.id,
      dafId: selectedDafId,
      sentenceId: firstSentence?.id || `${currentTractate.id}-${selectedDafId}`,
      word: sectionLabel,
      hebrewSnippet: firstSentence ? firstSentence.hebrewText.slice(0, 90) : `${currentTractate.nameHe} ${selectedDafId}`,
      noteText,
      createdAt: new Date().toLocaleDateString('ka-GE'),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleDafComplete = (dafKey: string) => {
    const isMarkingComplete = !completedDapim.includes(dafKey);
    setCompletedDapim((prev) =>
      prev.includes(dafKey) ? prev.filter((k) => k !== dafKey) : [...prev, dafKey]
    );
    if (isMarkingComplete) {
      const [trId, dId] = dafKey.split(':');
      const trObj = TRACTATES.find((tr) => tr.id === trId) || currentTractate;
      emitDafCompletedCelebration({
        dafKey,
        labelKa: `${trObj.nameKa} • დაფი ${dId || selectedDafId}`,
        labelHe: `${trObj.nameHe} דף ${dId || selectedDafId}`,
      });
    }
  };

  const handleNavigateFromVoiceOrAi = useCallback(
    (tractateId: string, dafId: string, sectionId?: string, highlightQuery?: string) => {
      const cleanTractate =
        TRACTATES.find(
          (tr) =>
            tr.id.toLowerCase() === tractateId.trim().toLowerCase() ||
            tr.nameKa === tractateId.trim() ||
            tr.nameHe === tractateId.trim()
        ) ||
        TRACTATES.find((tr) => tr.id === tractateId) ||
        currentTractate;

      let cleanDafId = dafId.trim().toLowerCase();
      if (/^\d+$/.test(cleanDafId)) {
        cleanDafId = `${cleanDafId}a`;
      }
      const validDapim = generateDafListForTractate(cleanTractate.lastDaf);
      if (!validDapim.includes(cleanDafId)) {
        cleanDafId = validDapim[0] || '2a';
      }

      setActiveRealm('talmud');
      setWorkspaceTab('daf');
      setPageTurnDirection(1);
      setSelectedSederId('all');
      setSelectedTractateId(cleanTractate.id);
      setSelectedDafId(cleanDafId);
      setSelectedTarget(null);
      setWordExplainStage('none');
      setSearchHighlightQuery(highlightQuery ? highlightQuery.trim() : '');
      setRestoreScrollTrigger((c) => c + 1);

      const instantBase = getCuratedOrDynamicDaf(
        cleanTractate.id,
        cleanDafId,
        cleanTractate.nameHe,
        cleanTractate.nameKa
      );
      const instantComms = getBuiltinSefariaCommentaries(cleanTractate.id, cleanDafId);
      setDafData({
        ...instantBase,
        allCommentaries:
          instantBase.allCommentaries && instantBase.allCommentaries.length > 0
            ? instantBase.allCommentaries
            : instantComms,
      });

      const scrollToTarget = () => {
        if (sectionId) {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        const anchorEl = document.getElementById('talmud-daf-folio-anchor');
        if (anchorEl) {
          anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      requestAnimationFrame(scrollToTarget);
      setTimeout(scrollToTarget, 140);
    },
    [currentTractate]
  );

  const activeLangObj =
    LANGUAGE_OPTIONS.find((l) => l.id === uiLang) || LANGUAGE_OPTIONS[0];

  const barsHidden = hideBarsOnScroll;

  return (
    <div
      data-talmud-app="true"
      className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden ${
        isDafMobileFullscreen ? 'pt-0 pb-0' : `${barsHidden ? 'pt-0' : 'pt-[54px] sm:pt-[58px]'} ${isDockCollapsed ? 'pb-0' : 'pb-28'}`
      } transition-all duration-300 ${
        theme === 'celestial-slate'
          ? 'bg-[#EBF3FB] text-[#1E293B]'
          : isDark
            ? 'bg-[#0B1524] text-[#E2E8F0]'
            : 'bg-[#EBF4FF] text-[#12241A]'
      }`}
    >
      {/* FIXED DYNAMIC TOP HEADER — DAY (SOFT SKY BLUE / LIGHT WOOD) & NIGHT (CELESTIAL NAVY) */}
      <header
        data-crystal-bar="true"
        className={`fixed top-0 left-0 right-0 z-[95] w-full max-w-[100vw] box-border px-2 sm:px-4 lg:px-6 ${
          isScrolledCompact ? 'py-1 sm:py-1.5' : 'py-1.5 sm:py-2'
        } ${
          theme === 'celestial-slate'
            ? 'bg-[#EBF3FB]/98 border-b border-[#BED4EB] shadow-[0_2px_14px_rgba(30,58,95,0.08)] text-[#1E293B]'
            : isDark
              ? 'bg-[#0F1E33]/98 border-b border-[#1E3352] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
              : 'bg-[#F2F7FC]/98 border-b border-[#CFE1F4] shadow-[0_2px_14px_rgba(15,35,60,0.06)]'
        } backdrop-blur-xl flex items-center justify-between gap-2 transition-all duration-500 ease-in-out ${
          barsHidden || isDafMobileFullscreen
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Left Brand Zone: Just Master Crown Menu Trigger */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsLogoMenuOpen((v) => !v)}
            title="აპლიკაციის მენიუ — კრისტალური სამეფო გვირგვინი და მბრუნავი მაგენ დავითი"
            className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border shadow-xs shrink-0 border-[#C49A6C] dark:border-[#C49A6C]/60 bg-gradient-to-b from-[#FAF5EB] to-[#E8D8BE] dark:from-[#3D2617] dark:to-[#24160D] text-amber-900 dark:text-amber-200 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <SpinningCrystalCrownMagenDavidEmblem size={28} />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-600 text-white border border-white dark:border-[#24160D] flex items-center justify-center z-30 shadow-xs">
              <Menu className="w-2 h-2" />
            </span>
          </button>
        </div>

        {/* Center-Right Workspace Tab Concept Switcher + Quick Controls (Smooth scroll, never overlaps brand) */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap scroll-smooth crystal-pocket py-1">
          {/* Tab Concept Switcher with Light Wood styling */}
          <div
            className={`inline-flex items-center p-0.5 rounded-xl border shrink-0 shadow-xs ${
              isDark
                ? 'bg-[#152338] border-[#253D63]'
                : 'bg-[#EFE3D3] border-[#DECAB3]'
            }`}
          >
            {(
              [
                { id: 'daf', icon: '📜', labelKa: 'დაფი', title: 'წმინდა დაფის მთავარი ეკრანი' },
                { id: 'controls', icon: '🧭', labelKa: 'ტრაქტატი', title: 'კასკადური სარჩევი (სედერი • ტრაქტატი • ფერეკი • მიშნა)' },
                { id: 'study-hub', icon: '🏛️', labelKa: 'ცენტრი 30+', title: '30+ სასწავლო მოდული და მეფორშიმი' },
              ] as const
            ).map((tab) => {
              const active = workspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setWorkspaceTab(tab.id);
                    if (tab.id === 'daf') {
                      setShowAboveDaf(false);
                      document
                        .getElementById('talmud-daf-folio-anchor')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else if (tab.id === 'controls') {
                      setIsCascadingSelectorOpen(true);
                    } else if (tab.id === 'study-hub') {
                      setShowBelowDaf(true);
                      setIsStudyCenterCollapsed(false);
                      setTimeout(() => {
                        document
                          .getElementById('daf-section-study-center')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 80);
                    }
                  }}
                  title={tab.title}
                  className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? isDark
                        ? 'bg-[#E6A64C] text-[#140A02] shadow-xs'
                        : 'bg-[#D49B45] text-[#140A02] shadow-xs'
                      : isDark
                        ? 'text-[#CBD5E1] hover:text-white hover:bg-white/10'
                        : 'text-[#4A2E1B] hover:text-black hover:bg-white/60'
                  }`}
                >
                  <span className="inline-flex items-center gap-1 truncate">
                    <AnimatedGlobeIconWrapper duration={6}>
                      <span className="text-xs select-none">{tab.icon}</span>
                    </AnimatedGlobeIconWrapper>
                    <span>{tab.labelKa}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Settings Trigger inside scrollable toolbar */}
          <button
            type="button"
            onClick={() => {
              setIsSettingsModalOpen(true);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            className={`h-8 sm:h-9 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              isDark
                ? 'bg-[#152338] hover:bg-[#203656] border-[#253D63] text-[#FAF5EB]'
                : 'bg-white hover:bg-[#FAF4EC] border-[#DECAB3] text-[#1A0F07]'
            }`}
            title="პარამეტრების მენიუ"
          >
            <AnimatedGlobeIconWrapper duration={6.5}>
              <Settings className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            </AnimatedGlobeIconWrapper>
            <span className="hidden sm:inline">პარამეტრები</span>
          </button>

          {/* Export & Download Trigger inside scrollable toolbar */}
          <button
            type="button"
            onClick={() => {
              setIsExportModalOpen(true);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            className={`h-8 sm:h-9 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              isDark
                ? 'bg-amber-950/70 hover:bg-amber-900 border-amber-600/50 text-amber-200'
                : 'bg-amber-100/80 hover:bg-amber-200/90 border-amber-400 text-amber-950'
            }`}
            title="პროექტისა და კოდის ექსპორტი (Source Code ZIP, Full ZIP, APK)"
          >
            <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-extrabold">ექსპორტი</span>
          </button>

          {/* 0a) Live Online Users Counter & Modern Auth Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsAuthModalOpen(true);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            title="ამჟამად აპლიკაციაში ონლაინ მყოფი მომხმარებლები და რეგისტრაცია"
            className="h-8 sm:h-9 px-2.5 rounded-xl border border-emerald-600/70 bg-emerald-100 hover:bg-emerald-200/90 dark:bg-emerald-950/90 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse shrink-0" />
            <AnimatedGlobeIconWrapper duration={5.5}>
              <Users className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-300 shrink-0" />
            </AnimatedGlobeIconWrapper>
            <span className="tabular-nums font-black text-emerald-950 dark:text-emerald-100">{onlineCount}</span>
            <span className="hidden xl:inline text-[11px] font-black text-emerald-950 dark:text-emerald-100">
              {currentUser ? currentUser.fullName.split(' ')[0] : t.onlineLabel}
            </span>
          </button>

          {/* 0b) 3D Galactic Globe Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsGlobeOpen(true);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            title="გალაქტიკური 3D გლობუსი"
            className="h-8 sm:h-9 px-2.5 rounded-xl border border-[#C5B49D] dark:border-amber-500/30 bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] text-[#120B04] dark:text-[#FAF5EB] text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-all"
          >
            <AnimatedMiniGlobeIcon sizeClass="w-5 h-5 sm:w-5.5 sm:h-5.5" iconSizeClass="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden lg:inline">{t.globeBtn}</span>
          </button>

          {/* 0c) Crystal Mouse Joystick & Smart Line Navigator Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsJoystickOpen((v) => !v);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            title="კრისტალური ჯოისტიკი & ვირტუალური მაუსი (სტრიქონებზე გადასვლა, ეკრანზე მოძრაობა, იად-თორა)"
            className={`h-8 sm:h-9 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-xs ${
              isJoystickOpen
                ? 'bg-[#78350F] dark:bg-amber-600 text-white border-[#4E2106] dark:border-amber-300 shadow-sm ring-1 ring-[#78350F]/40'
                : 'border-[#C5B49D] dark:border-amber-500/30 bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] text-[#120B04] dark:text-[#FAF5EB]'
            }`}
          >
            <AnimatedGlobeIconWrapper duration={6}>
              <Gamepad2 className="w-4 h-4 text-amber-700 dark:text-amber-400 stroke-[2.2] shrink-0" />
            </AnimatedGlobeIconWrapper>
            <span className="hidden lg:inline">ჯოისტიკი</span>
          </button>

          {/* 1) Above-Daf Show/Hide Button */}
          <button
            type="button"
            onClick={() => setShowAboveDaf((v) => !v)}
            className={`h-8 sm:h-9 min-w-[32px] sm:min-w-[36px] px-2.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              showAboveDaf
                ? 'bg-[#78350F] dark:bg-amber-600 text-white border-[#4E2106] dark:border-amber-300 shadow-sm'
                : 'bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] border-[#C5B49D] dark:border-amber-500/30 text-[#120B04] dark:text-[#FAF5EB]'
            }`}
            title="თალმუდის დაფის ზემოთ არსებული პანელის გამოჩენა / დამალვა"
          >
            <span className="flex flex-col items-center justify-center leading-none">
              <span className="w-3.5 sm:w-4 h-[2px] rounded-full bg-current mb-[2px]" />
              <AnimatedGlobeIconWrapper duration={5.8}>
                {showAboveDaf ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </AnimatedGlobeIconWrapper>
            </span>
            <span className="hidden xl:inline whitespace-nowrap">
              {t.abovePanel}
            </span>
          </button>

          {/* 2) Below-Daf Show/Hide Button */}
          <button
            type="button"
            onClick={() => setShowBelowDaf((v) => !v)}
            className={`h-8 sm:h-9 min-w-[32px] sm:min-w-[36px] px-2.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              showBelowDaf
                ? 'bg-[#78350F] dark:bg-amber-600 text-white border-[#4E2106] dark:border-amber-300 shadow-sm'
                : 'bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] border-[#C5B49D] dark:border-amber-500/30 text-[#120B04] dark:text-[#FAF5EB]'
            }`}
            title="თალმუდის დაფის ქვემოთ არსებული პანელის გამოჩენა / დამალვა"
          >
            <span className="flex flex-col items-center justify-center leading-none">
              <AnimatedGlobeIconWrapper duration={5.8}>
                {showBelowDaf ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </AnimatedGlobeIconWrapper>
              <span className="w-3.5 sm:w-4 h-[2px] rounded-full bg-current mt-[2px]" />
            </span>
            <span className="hidden xl:inline whitespace-nowrap">
              {t.belowPanel}
            </span>
          </button>

          {/* 2b) Recently Viewed Pages Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsRecentDropdownOpen((v) => !v);
              setIsLangDropdownOpen(false);
            }}
            className={`h-8 sm:h-9 min-w-[32px] sm:min-w-[36px] px-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              isRecentDropdownOpen
                ? 'bg-[#78350F] dark:bg-amber-600 text-white border-[#4E2106] dark:border-amber-300 shadow-sm'
                : 'bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] border-[#C5B49D] dark:border-amber-500/30 text-[#120B04] dark:text-[#FAF5EB]'
            }`}
            title="ბოლოს ნანახი დაფები (Recently Viewed)"
          >
            <AnimatedGlobeIconWrapper duration={6.2}>
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            </AnimatedGlobeIconWrapper>
            <span className="hidden xl:inline whitespace-nowrap">{t.historyBtn}</span>
          </button>

          {/* 2c) Full Offline Library Button */}
          <button
            type="button"
            onClick={() => {
              setIsOfflineLibraryModalOpen(true);
              setIsRecentDropdownOpen(false);
              setIsLangDropdownOpen(false);
            }}
            className={`h-8 sm:h-9 min-w-[32px] sm:min-w-[36px] px-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              !isOnlineStatus
                ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-600 text-[#422006] dark:text-[#FAF5EB] shadow-sm'
                : 'bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] border-[#C5B49D] dark:border-amber-500/30 text-[#120B04] dark:text-[#FAF5EB]'
            }`}
            title="სრული ოფლაინ ბიბლიოთეკა და ტრაქტატების ჩამომტვირთავი"
          >
            <AnimatedGlobeIconWrapper duration={6}>
              {!isOnlineStatus ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-amber-800 dark:text-[#DECAA9] shrink-0" />
              )}
            </AnimatedGlobeIconWrapper>
            <span className="hidden xl:inline whitespace-nowrap">{t.offlineShas}</span>
            {offlineCachedCount > 0 && (
              <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[10px] bg-[#6B4226] border border-[#C49A6C]/60 text-[#FAF5EB] font-bold">
                {offlineCachedCount}
              </span>
            )}
          </button>

          {/* 3) Language Dropdown Trigger — Animated Mini Globe Icon */}
          <button
            type="button"
            onClick={() => {
              setIsLangDropdownOpen((v) => !v);
              setIsRecentDropdownOpen(false);
            }}
            className={`h-8 sm:h-9 px-2 rounded-xl border text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              isLangDropdownOpen
                ? 'bg-[#78350F] dark:bg-amber-600 text-white border-[#4E2106] dark:border-amber-300 shadow-sm'
                : 'bg-white dark:bg-[#201812] hover:bg-[#FAF6F0] dark:hover:bg-[#2C211A] border-[#C5B49D] dark:border-amber-500/30 text-[#120B04] dark:text-[#FAF5EB]'
            }`}
            title="ენის არჩევა (7 ენა)"
          >
            <AnimatedMiniGlobeIcon sizeClass="w-5 h-5" iconSizeClass="w-2.5 h-2.5" />
            <span className="uppercase tracking-tight font-black">{activeLangObj.short}</span>
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform duration-300 ${
                isLangDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* 3a) Direct Torah / Chumash Access (Icon-only) */}
          <button
            type="button"
            onClick={() => setActiveRealm((prev) => (prev === 'torah' ? 'talmud' : 'torah'))}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              activeRealm === 'torah'
                ? 'bg-[#C89456] text-[#140A02] border-[#8C5D2A] shadow-sm ring-1 ring-[#C89456]/40'
                : 'bg-white hover:bg-[#FAF4EC] dark:bg-[#152338] dark:hover:bg-[#203656] border-[#DECAB3] dark:border-[#253D63] text-amber-800 dark:text-amber-300'
            }`}
            title="ხუმაში • חומש — წმინდა თორა და צורת הדף"
            aria-label="ხუმაში"
          >
            <AnimatedGlobeIconWrapper duration={6}>
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </AnimatedGlobeIconWrapper>
          </button>

          {/* 3a-1) Direct Siddur Access (Icon-only) */}
          <button
            type="button"
            onClick={() => setActiveRealm((prev) => (prev === 'siddur' ? 'talmud' : 'siddur'))}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              activeRealm === 'siddur'
                ? 'bg-[#C89456] text-[#140A02] border-[#8C5D2A] shadow-sm ring-1 ring-[#C89456]/40'
                : 'bg-white hover:bg-[#FAF4EC] dark:bg-[#152338] dark:hover:bg-[#203656] border-[#DECAB3] dark:border-[#253D63] text-amber-700 dark:text-amber-300'
            }`}
            title="სიდური • סידור כוונת הלב — ლოცვები და კავანოთი"
            aria-label="სიდური"
          >
            <AnimatedGlobeIconWrapper duration={5.5}>
              <Flame className="w-4 h-4 stroke-[2.2]" />
            </AnimatedGlobeIconWrapper>
          </button>

          {/* 3a-2) Direct Yalkut Yosef Access (Icon-only) */}
          <button
            type="button"
            onClick={() =>
              setActiveRealm((prev) => (prev === 'yalkut-yosef' ? 'talmud' : 'yalkut-yosef'))
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              activeRealm === 'yalkut-yosef'
                ? 'bg-[#C89456] text-[#140A02] border-[#8C5D2A] shadow-sm ring-1 ring-[#C89456]/40'
                : 'bg-white hover:bg-[#FAF4EC] dark:bg-[#152338] dark:hover:bg-[#203656] border-[#DECAB3] dark:border-[#253D63] text-amber-800 dark:text-amber-300'
            }`}
            title="იალკუტ იოსეფი • ילקוט יוסף — ჰალახა და შულხან არუხი"
            aria-label="იალკუტ იოსეფი"
          >
            <AnimatedGlobeIconWrapper duration={6.2}>
              <Scale className="w-4 h-4 stroke-[2.2]" />
            </AnimatedGlobeIconWrapper>
          </button>

          {/* 3a-3) Direct Daily Two Halakhot Access (Icon-only) */}
          <button
            type="button"
            onClick={() =>
              setActiveRealm((prev) => (prev === 'daily-halakhot' ? 'talmud' : 'daily-halakhot'))
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              activeRealm === 'daily-halakhot'
                ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm ring-1 ring-emerald-600/40'
                : 'bg-white hover:bg-[#FAF4EC] dark:bg-[#152338] dark:hover:bg-[#203656] border-[#DECAB3] dark:border-[#253D63] text-emerald-800 dark:text-emerald-300'
            }`}
            title="ყოველდღიური 2 ჰალახა • שתי הלכות בכל יום"
            aria-label="2 ჰალახა"
          >
            <AnimatedGlobeIconWrapper duration={6}>
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </AnimatedGlobeIconWrapper>
          </button>

          {/* 3b) Direct Daily Blessings Access (Icon-only, not gift icon) */}
          <button
            type="button"
            onClick={() =>
              setActiveRealm((prev) => (prev === 'blessings' ? 'talmud' : 'blessings'))
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 shadow-xs ${
              activeRealm === 'blessings'
                ? 'bg-[#C89456] text-[#140A02] border-[#8C5D2A] shadow-sm'
                : 'bg-white hover:bg-[#FAF4EC] dark:bg-[#152338] dark:hover:bg-[#203656] border-[#DECAB3] dark:border-[#253D63] text-amber-800 dark:text-amber-300'
            }`}
            title="ყოველდღიური კურთხევები • ברכות הנהנין והמצוות"
            aria-label="კურთხევები"
          >
            <AnimatedGlobeIconWrapper duration={6}>
              <HeartHandshake className="w-4 h-4 stroke-[2.2]" />
            </AnimatedGlobeIconWrapper>
          </button>
        </div>

        {/* Fixed day/night switch — always pinned to the top-right corner */}
        <button
          type="button"
          onClick={cycleNextTheme}
          className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
          title={isDark ? 'დღის რეჟიმი' : 'ღამის რეჟიმი'}
          aria-label={isDark ? 'დღის რეჟიმზე გადასვლა' : 'ღამის რეჟიმზე გადასვლა'}
        >
          <AnimatedGlobeIconWrapper duration={6}>
            {isDark ? <Sun className="w-4 h-4 stroke-[2.25]" /> : <Moon className="w-4 h-4 stroke-[2.25]" />}
          </AnimatedGlobeIconWrapper>
        </button>
      </header>

      {/* VIEWPORT-CLAMPED RECENTLY VIEWED DAFIM DROPDOWN (SOFT SLOW FADE-IN / FADE-OUT) */}
      <AnimatePresence>
        {isRecentDropdownOpen && (
          <>
            <motion.div
              key="recent-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onClick={() => setIsRecentDropdownOpen(false)}
              className="fixed inset-0 z-[125] bg-black/25"
            />
            <motion.div
              key="recent-dropdown-panel"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed top-[62px] sm:top-[68px] left-3 right-3 mx-auto w-[calc(100vw-24px)] max-w-[350px] sm:left-auto sm:right-6 sm:mx-0 sm:w-80 box-border rounded-2xl border-2 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-2xl z-[130] ${
                isDark
                  ? 'bg-[#21160F]/98 border-[#C49A6C]/70 text-[#FAF5EB]'
                  : 'bg-[#FAF5EB]/98 border-[#4A2E1B]/70 text-[#21160F]'
              }`}
            >
              <div className="px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wider opacity-85 border-b border-[#8C6239]/35 mb-2 flex items-center justify-between gap-2">
                <span className="truncate">ბოლოს ნანახი დაფები</span>
                <span dir="rtl" className="shrink-0">דפים אחרונים</span>
              </div>
              {/* Sort Mode Toggle: Most Recently Viewed vs Tractate Order */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5 p-1 rounded-xl bg-black/15 border border-[#8C6239]/30">
                <button
                  type="button"
                  onClick={() => setRecentSortOrder('recent')}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer truncate ${
                    recentSortOrder === 'recent'
                      ? 'bg-gradient-to-b from-[#6B4226] to-[#4A2E1B] text-[#FAF5EB] shadow-sm border border-[#C49A6C]/60'
                      : isDark
                        ? 'text-[#E8D8BE]/75 hover:text-[#FAF5EB]'
                        : 'text-[#3B2313]/75 hover:text-[#21160F]'
                  }`}
                  title="დალაგება ბოლოს ნანახის მიხედვით (Most Recently Viewed)"
                >
                  ბოლოს ნანახით
                </button>
                <button
                  type="button"
                  onClick={() => setRecentSortOrder('tractate')}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer truncate ${
                    recentSortOrder === 'tractate'
                      ? 'bg-gradient-to-b from-[#6B4226] to-[#4A2E1B] text-[#FAF5EB] shadow-sm border border-[#C49A6C]/60'
                      : isDark
                        ? 'text-[#E8D8BE]/75 hover:text-[#FAF5EB]'
                        : 'text-[#3B2313]/75 hover:text-[#21160F]'
                  }`}
                  title="დალაგება ტრაქტატების კანონიკური რიგით (Tractate Order)"
                >
                  ტრაქტატის რიგით
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                {sortedRecentlyViewedDapim.map((item) => {
                  const isCurrent =
                    item.tractateId === currentTractate.id && item.dafId === selectedDafId;
                  const tractateOrderIndex =
                    TRACTATES.findIndex((tr) => tr.id === item.tractateId) + 1;
                  return (
                    <button
                      key={`${item.tractateId}:${item.dafId}`}
                      type="button"
                      onClick={() => {
                        handleNavigateFromVoiceOrAi(item.tractateId, item.dafId);
                        setIsRecentDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer box-border ${
                        isCurrent
                          ? 'bg-[#5C3A21] text-[#FAF5EB] shadow-sm'
                          : isDark
                            ? 'hover:bg-[#332217] text-[#F5ECDA] bg-[#2B1B10]/60'
                            : 'hover:bg-[#E8D8BE] text-[#21160F] bg-[#EFE4D0]/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-extrabold flex items-center gap-1.5">
                          {recentSortOrder === 'tractate' && tractateOrderIndex > 0 && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9.5px] bg-[#8C6239]/35 border border-[#C49A6C]/40">
                              #{tractateOrderIndex}
                            </span>
                          )}
                          <span className="truncate">
                            {item.tractateNameKa} • {item.dafId}
                          </span>
                        </div>
                        <div
                          dir="rtl"
                          className={`text-[11px] font-serif truncate ${
                            isCurrent ? 'text-[#E8D8BE]' : 'text-[#8C6239]'
                          }`}
                        >
                          {item.tractateNameHe} דף {item.dafId}
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEWPORT-CLAMPED LANGUAGE DROPDOWN (SOFT SLOW FADE-IN / FADE-OUT) */}
      <AnimatePresence>
        {isLangDropdownOpen && (
          <>
            <motion.div
              key="lang-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onClick={() => setIsLangDropdownOpen(false)}
              className="fixed inset-0 z-[125] bg-black/25"
            />
            <motion.div
              key="lang-dropdown-panel"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed top-[62px] sm:top-[68px] left-3 right-3 mx-auto w-[calc(100vw-24px)] max-w-[260px] sm:left-auto sm:right-4 sm:mx-0 sm:w-60 box-border rounded-2xl border-2 p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-2xl z-[130] ${
                isDark
                  ? 'bg-[#21160F]/98 border-[#C49A6C]/70 text-[#FAF5EB]'
                  : 'bg-[#FAF5EB]/98 border-[#4A2E1B]/70 text-[#21160F]'
              }`}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider opacity-80 border-b border-[#8C6239]/30 mb-1.5">
                ენის არჩევა • Language
              </div>
              <div className="space-y-1">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = uiLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setUiLang(lang.id);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer box-border ${
                        active
                          ? 'bg-[#5C3A21] text-[#FAF5EB] shadow-sm'
                          : isDark
                            ? 'hover:bg-[#332217] text-[#F5ECDA]'
                            : 'hover:bg-[#E8D8BE] text-[#21160F]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-black uppercase min-w-[28px] text-left">
                          {lang.short}
                        </span>
                        <span className="truncate">{lang.native}</span>
                      </div>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DAILY STUDY DEDICATION & SINGLE-LINE QUICK ACCESS REALMS RIBBON (Hidden in Siddur & Torah so user lands directly on Daf) */}
      {showAboveDaf && activeRealm !== 'siddur' && activeRealm !== 'torah' && (
        <DailyStudyDedicationRibbon
          activeDedication={activeDedication}
          onOpenDedicationModal={() => setIsDedicationModalOpen(true)}
          activeRealm={activeRealm}
          onSelectRealm={(r) => setActiveRealm(r)}
          isDark={isDark}
        />
      )}



      {/* MAIN TZURAT HADAF 3D FOLIO CANVAS — TALMUD, TANAKH, HALAKHA SCHOOLS, BLESSINGS OR CALENDAR */}
      {!isGlobeOpen && (
      <main
        id="talmud-main-content"
        style={{
          scrollSnapType: isDafMobileFullscreen ? 'none' : 'y proximity',
          scrollPaddingTop: '64px',
        }}
        className={`w-full max-w-[1920px] mx-auto transition-all ${
          isDafMobileFullscreen ? 'p-0 m-0 max-w-none' : 'px-1 sm:px-3 lg:px-5 py-1.5'
        }`}
      >
        {activeRealm === 'calendar' ? (
          <HebrewHalakhicCalendarView
            isDark={isDark}
            onNavigateToRealm={handleNavigateRealmOrTalmud}
            externalSelectedDate={sharedCalendarDate}
            onSelectDateExternal={(d) => setSharedCalendarDate(d)}
            onOpenSiddurDailyPrayer={(d) => {
              setSharedCalendarDate(d);
              setActiveRealm('siddur');
            }}
            onBackHome={() => setActiveRealm('talmud')}
            onToggleTheme={cycleNextTheme}
            onOpenMenu={() => setIsLogoMenuOpen((v) => !v)}
          />
        ) : activeRealm === 'siddur' ? (
          <SiddurInteractiveView
            isDark={isDark}
            selectedTarget={selectedTarget}
            wordExplainStage={wordExplainStage === 'none' ? 'marked' : wordExplainStage}
            onSelectWordOrSentence={handleSelectWordOrSentence}
            onOpenWordNote={() => setWordExplainStage('note')}
            onOpenVoiceNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'voice' })
            }
            onOpenAiNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'ai' })
            }
            onAddDafNote={handleAddDafNote}
            onDeleteNote={handleDeleteNote}
            notes={notes}
            highlightedSentenceId={highlightedSentenceId}
            searchHighlightQuery={searchHighlightQuery}
            showAboveDaf={showAboveDaf}
            onToggleAboveDaf={() => setShowAboveDaf((v) => !v)}
            showBelowDaf={showBelowDaf}
            onToggleBelowDaf={() => setShowBelowDaf((v) => !v)}
            dafFontSizeScale={dafFontSizeScale}
            onChangeDafFontSizeScale={handleChangeDafFontSizeScale}
            onNavigateToTractateDaf={(trId, dId, secId, hlQuery) =>
              handleNavigateFromVoiceOrAi(trId, dId, secId, hlQuery)
            }
            onOpenFloatingSourceDaf={(req) => setFloatingSourceDafRequest(req)}
            onRecordCitationReturnPoint={handleRecordCitationReturnPoint}
            pendingReturnRestore={pendingReturnRestore}
            onOpenDailyBlessingsGuide={() => setActiveRealm('blessings')}
            externalCalendarDate={sharedCalendarDate}
            onChangeExternalCalendarDate={(d) => setSharedCalendarDate(d)}
            onNavigateToRealm={handleNavigateRealmOrTalmud}
          />
        ) : activeRealm === 'daily-halakhot' ? (
          <DailyTwoHalakhotView
            isDark={isDark}
            externalDate={sharedCalendarDate}
            onChangeExternalDate={(d) => setSharedCalendarDate(d)}
            onNavigateToRealm={(realmId, target) =>
              handleNavigateRealmOrTalmud(
                realmId,
                target?.bookId,
                target?.chapter,
                target?.tractateId,
                target?.dafId
              )
            }
            onNavigateToTalmudDaf={(trId, dId, secId) => {
              handleRecordCitationReturnPoint({
                fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
                sourceLabelKa: 'ყოველდღიური 2 ჰალახა (ב׳ הלכות ביום)',
                targetLabelKa: `${trId} ${dId}`,
              });
              handleNavigateFromVoiceOrAi(trId, dId, secId);
            }}
          />
        ) : activeRealm === 'blessings' ? (
          <DailyBlessingsView
            isDark={isDark}
            fontSize={Math.round((18 * dafFontSizeScale) / 100)}
            appLanguage={uiLang}
            selectedTarget={selectedTarget}
            onSelectWordOrSentence={handleSelectWordOrSentence}
            onOpenSiddurPdfView={() => setActiveRealm('siddur')}
            onNavigateToTalmudDaf={(trId, dId, secId) => {
              handleRecordCitationReturnPoint({
                fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
                sourceLabelKa: 'ყოველდღიური ბერახოთი / სიდური',
                targetLabelKa: `${trId} ${dId}`,
              });
              handleNavigateFromVoiceOrAi(trId, dId, secId);
            }}
          />
        ) : activeRealm !== 'talmud' ? (
          <ClassicSacredDafView
            realmId={activeRealm}
            onChangeRealm={(r) => setActiveRealm(r)}
            initialBookId={realmTarget.bookId}
            initialChapter={realmTarget.chapter}
            isDark={isDark}
            dafFontSizeScale={dafFontSizeScale}
            onChangeDafFontSizeScale={handleChangeDafFontSizeScale}
            selectedTarget={selectedTarget}
            onSelectWordOrSentence={handleSelectWordOrSentence}
            onOpenWordNote={(word, sentence, rect) => {
              handleSelectWordOrSentence(word, sentence, rect, 'word-ka');
              setWordExplainStage('note');
            }}
            searchHighlightQuery={searchHighlightQuery}
            showAboveDaf={showAboveDaf}
            onToggleAboveDaf={() => setShowAboveDaf((v) => !v)}
            showBelowDaf={showBelowDaf}
            onToggleBelowDaf={() => setShowBelowDaf((v) => !v)}
            onNavigateToTalmudDaf={(trId, dId, secId) =>
              handleNavigateFromVoiceOrAi(trId, dId, secId)
            }
            onOpenFloatingSourceDaf={(req) => setFloatingSourceDafRequest(req)}
            onRecordCitationReturnPoint={handleRecordCitationReturnPoint}
            pendingReturnRestore={pendingReturnRestore}
            onOpenVoiceNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'voice' })
            }
            onOpenAiNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'ai' })
            }
          />
        ) : (
          <ClassicTalmudDaf
            dafData={dafData}
            tractateNameHe={currentTractate.nameHe}
            tractateNameKa={currentTractate.nameKa}
            selectedTarget={selectedTarget}
            wordExplainStage={
              wordExplainStage === 'none' ? 'marked' : wordExplainStage
            }
            onSelectWordOrSentence={handleSelectWordOrSentence}
            onOpenWordNote={() => setWordExplainStage('note')}
            onPrevAmud={() => handlePrevAmud(false)}
            onNextAmud={() => handleNextAmud(false)}
            onOpenVoiceNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'voice' })
            }
            onOpenAiNav={() =>
              setVoiceAiModalState({ isOpen: true, initialTab: 'ai' })
            }
            onAddDafNote={handleAddDafNote}
            onDeleteNote={handleDeleteNote}
            isDark={isDark}
            theme={theme}
            notes={notes}
            highlightedSentenceId={highlightedSentenceId}
            searchHighlightQuery={searchHighlightQuery}
            showAboveDaf={showAboveDaf}
            onToggleAboveDaf={() => setShowAboveDaf((v) => !v)}
            showBelowDaf={showBelowDaf}
            onToggleBelowDaf={() => setShowBelowDaf((v) => !v)}
            pageTurnDirection={pageTurnDirection}
            restoreScrollTrigger={restoreScrollTrigger}
            dafFontSizeScale={dafFontSizeScale}
            onChangeDafFontSizeScale={handleChangeDafFontSizeScale}
            onNavigateToTractateDaf={(trId, dId, secId, hlQuery) =>
              handleNavigateFromVoiceOrAi(trId, dId, secId, hlQuery)
            }
            onOpenFloatingSourceDaf={(req) => setFloatingSourceDafRequest(req)}
            onRecordCitationReturnPoint={handleRecordCitationReturnPoint}
            pendingReturnRestore={pendingReturnRestore}
            externalFullViewport={isDafMobileFullscreen}
            onExternalToggleFullViewport={handleToggleDafFullscreen}
            belowDafStudyCenter={
              showBelowDaf ? (
                <SmartStudyPanels
                  dafData={dafData}
                  tractateNameHe={currentTractate.nameHe}
                  tractateNameKa={currentTractate.nameKa}
                  isDark={isDark}
                  uiLang={uiLang}
                  notes={notes}
                  onDeleteNote={handleDeleteNote}
                  onHighlightSentence={(id) => {
                    setHighlightedSentenceId(null);
                    setTimeout(() => {
                      setHighlightedSentenceId(id);
                      const anchorEl = document.getElementById('talmud-daf-folio-anchor');
                      if (anchorEl) {
                        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 25);
                  }}
                  completedDapim={completedDapim}
                  onToggleDafComplete={handleToggleDafComplete}
                  onNavigateToDaf={(trId, dId) => {
                    handleRecordCitationReturnPoint({
                      fromSectionId: 'daf-section-study-center',
                      fromElementId: 'daf-section-study-center',
                      fromWindowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
                      sourceLabelKa: `${currentTractate.nameKa} ${selectedDafId} • სასწავლო ცენტრი`,
                      targetLabelKa: `${trId} ${dId}`,
                    });
                    handleNavigateFromVoiceOrAi(trId, dId);
                  }}
                  isCollapsed={!showBelowDaf || isStudyCenterCollapsed}
                  onToggleCollapse={() => {
                    if (!showBelowDaf) {
                      setShowBelowDaf(true);
                      setIsStudyCenterCollapsed(false);
                    } else {
                      setIsStudyCenterCollapsed((v) => !v);
                    }
                  }}
                />
              ) : null
            }
          />
        )}
      </main>
      )}

      {/* TOP-LEFT LOGO MASTER INTERFACES MENU */}
      <TopLeftLogoInterfacesMenu
        isOpen={isLogoMenuOpen}
        onClose={() => setIsLogoMenuOpen(false)}
        activeRealm={activeRealm}
        onSelectRealm={(r) => setActiveRealm(r)}
        onOpenGlobe={() => setIsGlobeOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDedicationModal={() => setIsDedicationModalOpen(true)}
        isDark={isDark}
      />

      {/* GALACTIC 3D GLOBE OPENING SCREEN & AI KACUNA GREETER */}
      <GalacticGlobeAndAiGreeter
        isGlobeOpen={isGlobeOpen}
        onCloseGlobe={() => setIsGlobeOpen(false)}
        onOpenGlobe={() => setIsGlobeOpen(true)}
        onSelectRealm={handleNavigateRealmOrTalmud}
        activeRealm={activeRealm}
        bottomSheetExpanded={isGlobalBottomSheetOpen}
      />

      {/* AUTH / ONLINE USERS, STUDY DEDICATION, AND FINANCE/ALIYOT MODALS */}
      <CommunityModalsManager
        authModalOpen={isAuthModalOpen}
        onCloseAuthModal={() => setIsAuthModalOpen(false)}
        dedicationModalOpen={isDedicationModalOpen}
        onCloseDedicationModal={() => setIsDedicationModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
        activeDedication={activeDedication}
        onSelectDedication={setActiveDedication}
        onlineCount={onlineCount}
        activeScholars={activeScholars}
        isDark={isDark}
        uiLang={uiLang}
      />

      {/* FLOATING SOURCE DAF NOTE WINDOW (Requirement 2: Opens cited Daf right inside the current interface without switching screens!) */}
      <FloatingSourceDafNoteWindow
        request={floatingSourceDafRequest}
        onClose={() => setFloatingSourceDafRequest(null)}
        onOpenInMainTalmud={(trId, dId) => {
          setFloatingSourceDafRequest(null);
          handleNavigateFromVoiceOrAi(trId, dId);
        }}
        isDark={isDark}
        onSelectWordOrSentence={handleSelectWordOrSentence}
      />

      {/* UNIFIED STRETCHING BOTTOM NAVIGATION PANEL — SPRING PHYSICS & SLEEK MODERN FILTERING */}
      {!isGlobeOpen && activeRealm !== 'torah' && (
        <>
          <AnimatePresence>
            {isGlobalBottomSheetOpen && (
              <motion.div
                key="global-bottom-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setIsGlobalBottomSheetOpen(false)}
                className="fixed inset-0 z-[205] bg-slate-950/45 backdrop-blur-xs"
              />
            )}
          </AnimatePresence>

          <motion.nav
            data-modern-dock="true"
            aria-label="ქვედა ნავიგაციის პანელი"
            initial={false}
            animate={{
              y: isDockCollapsed && !isGlobalBottomSheetOpen ? dockPanelHeight - 6 : 0,
              opacity: 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 170,
              damping: 26,
              mass: 1,
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                globalBottomBarTouchRef.current = {
                  startY: e.touches[0].clientY,
                  startX: e.touches[0].clientX,
                };
              }
            }}
            onTouchEnd={(e) => {
              if (!globalBottomBarTouchRef.current || e.changedTouches.length !== 1) return;
              const dy = e.changedTouches[0].clientY - globalBottomBarTouchRef.current.startY;
              const dx = e.changedTouches[0].clientX - globalBottomBarTouchRef.current.startX;
              globalBottomBarTouchRef.current = null;
              if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
                if (dy < 0 && isDockCollapsed) {
                  setIsDockCollapsed(false);
                } else if (dy < 0 && !isGlobalBottomSheetOpen) {
                  setIsGlobalBottomSheetOpen(true);
                } else if (dy > 0 && isGlobalBottomSheetOpen) {
                  setIsGlobalBottomSheetOpen(false);
                } else if (dy > 0) {
                  setIsDockCollapsed(true);
                }
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-[290] pointer-events-none flex flex-col items-center px-0 w-full transition-opacity"
          >
            {/* Curtain pull tab — rises above the panel edge */}
            <div className="relative z-10 flex justify-center" style={{ marginBottom: -22, height: 30 }}>
              {/* Concave pocket cut into the panel's top edge */}
              <span
                aria-hidden="true"
                className={`absolute top-[7px] left-1/2 -translate-x-1/2 w-[62px] h-[30px] rounded-b-[31px] border border-t-0 shadow-[inset_0_6px_10px_rgba(0,0,0,0.28)] ${
                  theme === 'celestial-slate'
                    ? 'bg-[#C9DAEC] border-[#94B8DC]'
                    : isDark
                      ? 'bg-[#120B06] border-[#4A3322]'
                      : 'bg-[#E9DCC6] border-[#D8C7B0]'
                }`}
              />
              <motion.button
                type="button"
                data-raw-btn="true"
                data-flat-btn="true"
                onTouchStart={(e) => {
                  (e.currentTarget as any)._sy = e.touches[0]?.clientY ?? 0;
                  (e.currentTarget as any)._moved = false;
                }}
                onTouchMove={(e) => {
                  const sy = (e.currentTarget as any)._sy ?? 0;
                  if (Math.abs((e.touches[0]?.clientY ?? sy) - sy) > 10) (e.currentTarget as any)._moved = true;
                }}
                onClick={(e) => {
                  if ((e.currentTarget as any)._moved) { (e.currentTarget as any)._moved = false; return; }
                  if (isDockCollapsed) { setIsDockCollapsed(false); return; }
                  window.dispatchEvent(new CustomEvent('talmud-open-daf-search'));
                }}
                whileTap={{ scale: 0.9 }}
                aria-label="ძებნა დაფზე (ზემოთ/ქვემოთ გაწევით — პანელის გაშლა/ჩაკეცვა)"
                title="ძებნა დაფზე"
                style={{ pointerEvents: 'auto' }}
                className="relative -top-[14px]"
              >
                <AnimatedMiniGlobeIcon sizeClass="w-11 h-11" iconSizeClass="w-5 h-5" search />
              </motion.button>
            </div>
            {/* SINGLE UNIFIED PANEL THAT STRETCHES ACROSS THE FULL SCREEN WIDTH */}
            <motion.div
              ref={dockPanelRef}
              layout
              transition={{
                layout: { type: 'spring', stiffness: 140, damping: 22, mass: 1.1 },
              }}
              style={{
                pointerEvents: isDockCollapsed && !isGlobalBottomSheetOpen ? 'none' : 'auto',
              }}
              className={`w-full max-w-none rounded-t-[20px] sm:rounded-t-[26px] backdrop-blur-2xl border-t overflow-hidden select-none transition-colors ${
                theme === 'celestial-slate'
                  ? 'bg-[#E2EDF8]/98 border-[#94B8DC] text-[#1E293B] shadow-[0_-12px_44px_rgba(30,58,95,0.16)]'
                  : isDark
                    ? 'bg-[#1C130D]/98 border-[#4A3322] text-[#FAF5EB] shadow-[0_-14px_48px_rgba(0,0,0,0.7)]'
                    : 'bg-[#F9F4EB]/98 border-[#D8C7B0] text-[#2C190D] shadow-[0_-12px_44px_rgba(60,35,15,0.12)]'
              }`}
            >
              {/* TOP STRETCH HANDLE + SINGLE-LINE DOCK BAR WITH FLAT MODERN BUTTONS */}
              <div className="px-2.5 sm:px-3.5 pt-[22px] pb-2 flex flex-col gap-1">

                {/* SINGLE HORIZONTAL ROW: STATIC LEFT/RIGHT PAGE-TURN BUTTONS + SLIDING ICON-ONLY TRACK IN CENTER */}
                <div data-crystal-bar="true" className="flex items-center justify-between gap-2">
                  {/* LEFT STATIC PAGE-TURNING BUTTON (წინა დაფი — მხოლოდ აიკონი, სტატიკური) */}
                  <button
                    type="button"
                    data-raw-btn="true"
                    data-flat-btn="true"
                    onClick={() => {
                      lastBottomNavClickRef.current = Date.now();
                      setHideBarsOnScroll(false);
                      if (activeRealm === 'talmud') {
                        handlePrevAmud(true);
                      } else {
                        playBookPageTurnSound();
                        window.dispatchEvent(new CustomEvent('global-page-prev'));
                        window.dispatchEvent(
                          new CustomEvent('sacred-daf-step', { detail: { dir: 'prev' } })
                        );
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                    title="წინა დაფზე გადაფურცვლა"
                    aria-label="წინა დაფი"
                  >
                    <AnimatedGlobeIconWrapper duration={5}>
                      <ArrowRight className="w-4 h-4 stroke-[2.25] shrink-0" />
                    </AnimatedGlobeIconWrapper>
                  </button>

                  {/* MIDDLE HORIZONTALLY SLIDING ICON-ONLY BUTTONS TRACK (აქეთ-იქით დაცურავს, მხოლოდ აიკონები) */}
                  <div
                    onWheel={(e) => {
                      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 crystal-pocket py-1 touch-pan-x scroll-smooth"
                  >
                    <button
                      type="button"
                      data-raw-btn="true"
                      onClick={() => setIsMishnahMapOpen(true)}
                      className="mishnah-pill"
                      title="მიმდინარე ტრაქტატის მიშნები"
                      aria-label="მიშნა"
                    >
                      <ScrollText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>მიშნა</span>
                      <span className="he" dir="rtl">משנה</span>
                    </button>
                    {/* 2. Current Tractate & Daf Indicator Pill (Quick Selector Opener) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => setIsCascadingSelectorOpen(true)}
                      className="h-9 px-3 rounded-xl border border-[#C5B49D] dark:border-amber-400/40 bg-white/95 hover:bg-[#FAF4EC] dark:bg-[#201812] dark:hover:bg-[#2B2018] text-[#140C04] dark:text-[#FAF5EB] flex items-center gap-1.5 shrink-0 cursor-pointer font-black text-xs shadow-xs transition-all active:scale-95"
                      title="კასკადური სარჩევი • 4 სვეტიანი არჩევა (სედერი • ტრაქტატი • ფერეკი • მიშნა)"
                    >
                      <AnimatedGlobeIconWrapper duration={6}>
                        <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      </AnimatedGlobeIconWrapper>
                      <span className="truncate max-w-[110px] sm:max-w-[150px] font-black text-[11px] sm:text-xs">
                        {activeRealm === 'talmud'
                          ? `${currentTractate.nameKa.split(' (')[0]} ${selectedDafId}`
                          : SACRED_REALMS.find((r) => r.id === activeRealm)?.titleKa || 'თალმუდი'}
                      </span>
                    </button>

                    {/* 3. Expand Daf to Full Mobile / Desktop Screen (დაფის გაშლა მთლიან ეკრანზე) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={handleToggleDafFullscreen}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95 ${
                        isDafMobileFullscreen
                          ? 'bg-amber-500 text-stone-950 font-black border-amber-400 shadow-sm ring-2 ring-amber-400/40'
                          : 'bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border-stone-300/70 dark:border-white/10'
                      }`}
                      title={
                        isDafMobileFullscreen
                          ? 'მთლიანი ეკრანიდან გამოსვლა'
                          : 'დაფის გაშლა მთლიან მობილურის ეკრანზე (Fullscreen)'
                      }
                      aria-label="მთლიან ეკრანზე გაშლა"
                    >
                      <AnimatedGlobeIconWrapper duration={6}>
                        {isDafMobileFullscreen ? (
                          <Minimize2 className="w-4 h-4 stroke-[2.25] shrink-0" />
                        ) : (
                          <Maximize2 className="w-4 h-4 stroke-[2.25] shrink-0" />
                        )}
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* Offline daf database */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => setIsOfflineLibraryModalOpen(true)}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="დაფების ბაზა ტელეფონში"
                      aria-label="დაფების ბაზა ტელეფონში"
                    >
                      <AnimatedGlobeIconWrapper duration={6}>
                        <HardDrive className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 4. Bookmark / Jump to Stopped Line (სანიშნე — ბოლოს შეჩერებულ ხაზზე გადასვლა) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('global-talmud-bookmark-step', {
                            detail: { dir: 'jump' },
                          })
                        );
                      }}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="სანიშნე — ბოლოს შეჩერებულ სტრიქონზე გადასვლა (Bookmark Jump)"
                      aria-label="სანიშნე"
                    >
                      <AnimatedGlobeIconWrapper duration={5.5}>
                        <Bookmark className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 5. Stopped Line Stepper (წინა / შემდეგი სტრიქონი) */}
                    <div className="flex items-center gap-0.5 rounded-xl border border-stone-300/70 dark:border-white/10 bg-white/90 dark:bg-stone-800/85 p-0.5 shrink-0 shadow-xs">
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('global-talmud-bookmark-step', {
                              detail: { dir: 'prev' },
                            })
                          );
                        }}
                        className="w-7 h-8 rounded-lg hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        title="წინა სტრიქონზე გადასვლა"
                        aria-label="წინა სტრიქონი"
                      >
                        <AnimatedGlobeIconWrapper duration={4.5}>
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        </AnimatedGlobeIconWrapper>
                      </button>
                      <div className="w-[1px] h-4 bg-stone-300 dark:bg-white/15" />
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('global-talmud-bookmark-step', {
                              detail: { dir: 'next' },
                            })
                          );
                        }}
                        className="w-7 h-8 rounded-lg hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        title="შემდეგ სტრიქონზე გადასვლა"
                        aria-label="შემდეგი სტრიქონი"
                      >
                        <AnimatedGlobeIconWrapper duration={4.5}>
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </AnimatedGlobeIconWrapper>
                      </button>
                    </div>

                    {/* 6. Line Translation Mode Toggle */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('talmud-toggle-line-translate')
                        );
                      }}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="სტრიქონის ავტო-თარგმანი / ახსნა (ქართულად)"
                      aria-label="ხაზის თარგმანი"
                    >
                      <AnimatedGlobeIconWrapper duration={6}>
                        <Languages className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 7. Modern Interactive Zoom Controls (Working ZoomOut, Live % / Reset, ZoomIn) */}
                    <div className="flex items-center gap-0.5 rounded-xl border border-stone-300/80 dark:border-amber-400/25 bg-white/95 dark:bg-stone-900/90 p-0.5 shrink-0 shadow-sm backdrop-blur-md">
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={handleStepZoomOut}
                        className="w-7 h-8 rounded-lg hover:bg-amber-500/15 dark:hover:bg-white/10 text-stone-700 dark:text-amber-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        title="ზუმის დაპატარავება (-15%)"
                        aria-label="დაპატარავება"
                      >
                        <AnimatedGlobeIconWrapper duration={5}>
                          <ZoomOut className="w-3.5 h-3.5 stroke-[2.2]" />
                        </AnimatedGlobeIconWrapper>
                      </button>
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={handleResetZoomScale}
                        className="px-2 h-8 rounded-lg hover:bg-amber-500/20 text-stone-900 dark:text-amber-300 flex items-center gap-1 justify-center cursor-pointer text-[11px] font-black font-mono tracking-tight transition-colors group active:scale-95"
                        title="საწყის ზომაზე დაბრუნება (100%)"
                        aria-label="100% ზომა"
                      >
                        <span>{Math.round(liveTalmudZoomScale * 100)}%</span>
                        {Math.round(liveTalmudZoomScale * 100) !== 100 && (
                          <AnimatedGlobeIconWrapper duration={4}>
                            <RotateCcw className="w-2.5 h-2.5 opacity-70 group-hover:rotate-180 transition-transform duration-300 text-amber-600 dark:text-amber-400" />
                          </AnimatedGlobeIconWrapper>
                        )}
                      </button>
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={handleStepZoomIn}
                        className="w-7 h-8 rounded-lg hover:bg-amber-500/15 dark:hover:bg-white/10 text-stone-700 dark:text-amber-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        title="ზუმის გადიდება (+15%)"
                        aria-label="გადიდება"
                      >
                        <AnimatedGlobeIconWrapper duration={5}>
                          <ZoomIn className="w-3.5 h-3.5 stroke-[2.2]" />
                        </AnimatedGlobeIconWrapper>
                      </button>
                    </div>

                    {/* 8. Active-Field Windows Collapse / Minimize Button (Icon-Only) */}
                    {globalFocusedPane && (
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('global-daf-pane-action', {
                              detail: {
                                paneId: globalFocusedPane.paneId,
                                action: 'minimize',
                              },
                            })
                          )
                        }
                        className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border shrink-0 relative active:scale-95 ${
                          globalFocusedPane.isMinimized
                            ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                            : 'bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border-stone-300/70 dark:border-white/10'
                        }`}
                        title={
                          globalFocusedPane.isMinimized
                            ? `${globalFocusedPane.titleKa} — ჩაკეცილი ველის აღდგენა`
                            : `${globalFocusedPane.titleKa} — ამ ველის ჩაკეცვა (Windows Minimize)`
                        }
                        aria-label="ველის ჩაკეცვა"
                      >
                        <AnimatedGlobeIconWrapper duration={5}>
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </AnimatedGlobeIconWrapper>
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </button>
                    )}

                    {/* 9. Active-Field Windows Expand / Maximize Button (Icon-Only) */}
                    {globalFocusedPane && (
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('global-daf-pane-action', {
                              detail: {
                                paneId: globalFocusedPane.paneId,
                                action: 'maximize',
                              },
                            })
                          )
                        }
                        className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 relative shadow-xs active:scale-95"
                        title={`${globalFocusedPane.titleKa} — ამ ველის გაშლა (Windows Expand)`}
                        aria-label="ველის გაშლა"
                      >
                        <AnimatedGlobeIconWrapper duration={5}>
                          <Square className="w-3.5 h-3.5 stroke-[2.2]" />
                        </AnimatedGlobeIconWrapper>
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </button>
                    )}

                    {/* 10. Dedicated Real-Time Georgian Voice-to-Text Input for Search Bar */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={handleToggleRealtimeVoiceSearch}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95 relative ${
                        isRealtimeVoiceActive
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/60 animate-pulse'
                          : 'bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200'
                      }`}
                      title={
                        isRealtimeVoiceActive
                          ? 'ქართული ხმოვანი ჩაწერის შეჩერება (მიმდინარეობს პირდაპირი ჩაწერა...)'
                          : 'ქართული ხმოვანი ძიება საძიებო ზოლში (Real-time Voice-to-Text)'
                      }
                      aria-label="ქართული ხმოვანი ძიება"
                    >
                      <AnimatedGlobeIconWrapper duration={4}>
                        <Mic
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isRealtimeVoiceActive
                              ? 'text-white'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                      </AnimatedGlobeIconWrapper>
                      {isRealtimeVoiceActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                      )}
                    </button>

                    {/* 11. AI Analysis & Search (Icon-Only) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() =>
                        setVoiceAiModalState({ isOpen: true, initialTab: 'ai' })
                      }
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 border border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="AI ანალიზი და ჭკვიანი ძიება"
                      aria-label="AI ანალიზი"
                    >
                      <AnimatedGlobeIconWrapper duration={5.5}>
                        <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 12. Recently Viewed Dapim (Icon-Only) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => setIsRecentDropdownOpen((v) => !v)}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 border border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="ბოლოს ნანახი დაფები"
                      aria-label="ისტორია"
                    >
                      <AnimatedGlobeIconWrapper duration={6}>
                        <History className="w-4 h-4 shrink-0" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 13. Galactic Globe / Orbs Portal (Icon-Only) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => setIsGlobeOpen(true)}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 border border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="გალაქტიკური გლობუსის / ბურთულების გახსნა"
                      aria-label="გლობუსი"
                    >
                      <AnimatedMiniGlobeIcon sizeClass="w-6 h-6" iconSizeClass="w-3.5 h-3.5" />
                    </button>

                    {/* 14. Settings Modal (Icon-Only) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 border border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                      title="პარამეტრები"
                      aria-label="პარამეტრები"
                    >
                      <AnimatedGlobeIconWrapper duration={6.5}>
                        <Settings className="w-4 h-4 shrink-0" />
                      </AnimatedGlobeIconWrapper>
                    </button>

                    {/* 15. Toggle Daf Completed (Triggers Celebratory Confetti) */}
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={() =>
                        handleToggleDafComplete(`${currentTractate.id}:${selectedDafId}`)
                      }
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95 ${
                        completedDapim.includes(`${currentTractate.id}:${selectedDafId}`)
                          ? 'bg-emerald-500/25 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-white/90 dark:bg-stone-800/85 hover:bg-emerald-500/15 border-stone-300/70 dark:border-white/10 text-stone-800 dark:text-stone-200'
                      }`}
                      title={
                        completedDapim.includes(`${currentTractate.id}:${selectedDafId}`)
                          ? 'დაფი შესწავლილია ✓'
                          : 'მონიშნე დაფი შესწავლილად (Completed)'
                      }
                      aria-label="მონიშნე შესწავლილად"
                    >
                      <AnimatedGlobeIconWrapper duration={5.5}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </AnimatedGlobeIconWrapper>
                    </button>
                  </div>

                  {/* RIGHT STATIC PAGE-TURNING BUTTON (შემდეგი დაფი — მხოლოდ აიკონი, სტატიკური) */}
                  <button
                    type="button"
                    data-raw-btn="true"
                    data-flat-btn="true"
                    onClick={() => {
                      lastBottomNavClickRef.current = Date.now();
                      setHideBarsOnScroll(false);
                      if (activeRealm === 'talmud') {
                        handleNextAmud(true);
                      } else {
                        playBookPageTurnSound();
                        window.dispatchEvent(new CustomEvent('global-page-next'));
                        window.dispatchEvent(
                          new CustomEvent('sacred-daf-step', { detail: { dir: 'next' } })
                        );
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-white/90 dark:bg-stone-800/85 hover:bg-amber-500/15 text-stone-800 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-300/70 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs active:scale-95"
                    title="შემდეგ დაფზე გადაფურცვლა"
                    aria-label="შემდეგი დაფი"
                  >
                    <AnimatedGlobeIconWrapper duration={5}>
                      <ArrowLeft className="w-4 h-4 stroke-[2.25] shrink-0" />
                    </AnimatedGlobeIconWrapper>
                  </button>
                </div>
              </div>

              {/* EXPANDING BODY OF THE SAME PANEL (SPRING PHYSICS + SLEEK MODERN FILTERING) */}
              <AnimatePresence initial={false}>
                {isGlobalBottomSheetOpen && (
                  <motion.div
                    key="global-panel-expanded-body"
                    variants={cascadingMenuContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`max-h-[calc(100dvh-85px)] overflow-y-auto overscroll-contain no-scrollbar border-t transition-colors ${
                      theme === 'celestial-slate'
                        ? 'bg-[#EBF3FB] text-[#1E293B] border-[#94B8DC]'
                        : isDark
                          ? 'bg-[#1C130D] text-[#FAF5EB] border-[#3D2919]'
                          : 'bg-[#FAF5EC] text-[#2C180B] border-[#E2D4C3]'
                    }`}
                  >
                    <div className="px-3.5 sm:px-5 py-3 flex flex-col gap-3">
                      {/* ROW 1: INSTANT TEXT SEARCH WITH CONTINUOUS RUNNING TICKER (STICKY AT TOP SO KEYBOARD NEVER HIDES IT) */}
                      <motion.div
                        variants={cascadingMenuItemVariants}
                        className={`sticky top-0 z-30 pb-1 pt-0.5 flex flex-col gap-2 transition-colors ${
                          theme === 'celestial-slate' ? 'bg-[#EBF3FB]' : isDark ? 'bg-[#1C130D]' : 'bg-[#FAF5EC]'
                        }`}
                      >
                        <div
                          onClick={() => {
                            bottomSearchInputRef.current?.focus();
                            setIsBottomSearchFocused(true);
                          }}
                          className={`relative flex items-center gap-2 border rounded-xl px-3 py-2 transition-all cursor-text overflow-hidden ${
                            theme === 'celestial-slate'
                              ? 'bg-white/95 border-[#94B8DC] text-[#1E293B] focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20'
                              : isDark
                                ? 'bg-[#261A11] border-[#4A3322] text-[#FAF5EB] focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-400/20'
                                : 'bg-white border-[#D6C4AD] text-[#2C180B] focus-within:border-[#8B5A2B] focus-within:ring-2 focus-within:ring-[#8B5A2B]/15 shadow-xs'
                          }`}
                        >
                          <Search
                            className={`w-4 h-4 shrink-0 z-20 ${
                              theme === 'celestial-slate' ? 'text-sky-600' : 'text-amber-500/90'
                            }`}
                          />
                          
                          {/* Continuous Running Marquee Ticker (მორბენალი სტრიქონი) when search field is empty & idle */}
                          {!globalBottomSearchQuery && !isBottomSearchFocused && (
                            <div className="absolute inset-y-0 left-9 right-32 pointer-events-none flex items-center overflow-hidden">
                              <div
                                className={`search-marquee-track text-xs font-medium select-none ${
                                  theme === 'celestial-slate'
                                    ? 'text-slate-500'
                                    : 'text-amber-200/70'
                                }`}
                              >
                                <span className="mr-8">ძიება ტექსტში, ტრაქტატში ან დაფზე (ქართულად / ებრაულად)...</span>
                                <span className="mr-8 font-serif" dir="rtl">חיפוש בטקסט, במסכת או בדף (עברית / גיאורגית)...</span>
                                <span className="mr-8">ძიება ტექსტში, ტრაქტატში ან დაფზე (ქართულად / ებრაულად)...</span>
                                <span className="mr-8 font-serif" dir="rtl">חיפוש בטקסט, במסכת או בדף (עברית / גיאורגית)...</span>
                              </div>
                            </div>
                          )}

                          <input
                            ref={bottomSearchInputRef}
                            type="text"
                            value={globalBottomSearchQuery}
                            onFocus={() => {
                              setIsBottomSearchFocused(true);
                              setHideBarsOnScroll(false);
                              setTimeout(() => {
                                bottomSearchInputRef.current?.scrollIntoView({
                                  block: 'nearest',
                                  behavior: 'smooth',
                                });
                              }, 100);
                            }}
                            onBlur={() => setIsBottomSearchFocused(false)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGlobalBottomSearchQuery(val);
                              setSearchHighlightQuery(val.trim());
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleExecuteSearch();
                              }
                            }}
                            placeholder={isBottomSearchFocused ? "ჩაწერეთ საძიებო სიტყვა..." : ""}
                            className={`flex-1 min-w-0 bg-transparent text-xs font-medium outline-none z-10 ${
                              theme === 'celestial-slate'
                                ? 'text-[#0F172A] placeholder:text-slate-400'
                                : 'text-[#FAF5EB] placeholder:text-stone-400'
                            }`}
                          />
                          {globalBottomSearchQuery && (
                            <div className="flex items-center gap-0.5 z-20 shrink-0 bg-stone-200/90 dark:bg-stone-800/90 rounded-lg p-0.5 border border-stone-300 dark:border-stone-700">
                              <button
                                type="button"
                                data-raw-btn="true"
                                data-flat-btn="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.dispatchEvent(
                                    new CustomEvent('global-talmud-bookmark-step', {
                                      detail: { dir: 'prev' },
                                    })
                                  );
                                }}
                                className="w-5 h-6 rounded flex items-center justify-center hover:bg-amber-500/25 text-stone-700 dark:text-stone-300 cursor-pointer text-[9px] font-black active:scale-95"
                                title="წინა დამთხვევაზე გადასვლა"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                data-raw-btn="true"
                                data-flat-btn="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.dispatchEvent(
                                    new CustomEvent('global-talmud-bookmark-step', {
                                      detail: { dir: 'next' },
                                    })
                                  );
                                }}
                                className="w-5 h-6 rounded flex items-center justify-center hover:bg-amber-500/25 text-stone-700 dark:text-stone-300 cursor-pointer text-[9px] font-black active:scale-95"
                                title="შემდეგ დამთხვევაზე გადასვლა"
                              >
                                ▼
                              </button>
                            </div>
                          )}
                          {globalBottomSearchQuery && (
                            <button
                              type="button"
                              data-raw-btn="true"
                              data-flat-btn="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGlobalBottomSearchQuery('');
                                setSearchHighlightQuery('');
                              }}
                              className={`p-1 rounded-full cursor-pointer z-20 ${
                                theme === 'celestial-slate'
                                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  : 'text-stone-400 hover:text-white hover:bg-white/10'
                              }`}
                              title="ძიების გასუფთავება"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="z-20 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <VoiceSearchMicButton
                              onTranscript={(spoken) => {
                                setGlobalBottomSearchQuery(spoken);
                                setSearchHighlightQuery(spoken.trim());
                              }}
                              size="sm"
                            />
                          </div>

                          {/* DEDICATED SEARCH EXECUTION BUTTON (ძიების გაშვება) */}
                          <button
                            type="button"
                            data-raw-btn="true"
                            data-flat-btn="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteSearch();
                            }}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0 z-20 ${
                              theme === 'celestial-slate'
                                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                            }`}
                            title="ძიების გაშვება • Execute Search"
                            aria-label="ძიება"
                          >
                            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span className="font-bold">ძიება</span>
                          </button>
                        </div>

                        {/* Instant Search Results Strip */}
                        {globalBottomSearchQuery.trim().length > 0 && (
                          <div className="bg-[#241912] border border-[#4A3322] rounded-xl p-2 max-h-36 overflow-y-auto flex flex-col gap-1">
                            {TRACTATES.filter(
                              (tr) =>
                                tr.nameKa.toLowerCase().includes(globalBottomSearchQuery.trim().toLowerCase()) ||
                                tr.nameHe.includes(globalBottomSearchQuery.trim()) ||
                                tr.nameEn.toLowerCase().includes(globalBottomSearchQuery.trim().toLowerCase())
                            )
                              .slice(0, 5)
                              .map((tr) => (
                                <button
                                  key={`bottom-search-tr-${tr.id}`}
                                  type="button"
                                  data-raw-btn="true"
                                  data-flat-btn="true"
                                  onClick={() => {
                                    setActiveRealm('talmud');
                                    setSelectedTractateId(tr.id);
                                    setSelectedDafId('2a');
                                    setGlobalBottomSearchQuery('');
                                    setIsGlobalBottomSheetOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer text-[#FAF5EB]"
                                >
                                  <span className="font-bold text-[#FAF5EB] truncate">
                                    ტრაქტატი: {tr.nameKa}
                                  </span>
                                  <span dir="rtl" className="font-serif font-bold text-amber-400 shrink-0">
                                    {tr.nameHe}
                                  </span>
                                </button>
                              ))}
                            {[
                              ...(dafData.mishnah || []),
                              ...(dafData.gemara || []),
                              ...(dafData.rashi || []),
                              ...(dafData.tosafot || []),
                            ]
                              .filter(
                                (s) =>
                                  (s.translationKa || '')
                                    .toLowerCase()
                                    .includes(globalBottomSearchQuery.trim().toLowerCase()) ||
                                  (s.hebrewText || '').includes(globalBottomSearchQuery.trim())
                              )
                              .slice(0, 6)
                              .map((s) => (
                                <button
                                  key={`bottom-search-sent-${s.id}`}
                                  type="button"
                                  data-raw-btn="true"
                                  data-flat-btn="true"
                                  onClick={() => {
                                    setHighlightedSentenceId(s.id);
                                    setIsGlobalBottomSheetOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer text-[#FAF5EB]"
                                >
                                  <span className="font-semibold text-stone-200 truncate flex-1">
                                    {s.translationKa}
                                  </span>
                                  <span
                                    dir="rtl"
                                    className="font-serif text-[11px] font-bold text-amber-300 truncate max-w-[40%]"
                                  >
                                    {s.hebrewText}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </motion.div>

                      {/* ROW 2: ALL SACRED REALMS ICON-ONLY BUTTONS (WRAPPED IN STAGGERED ITEM VARIANT) */}
                      <motion.div
                        variants={cascadingMenuItemVariants}
                        className="w-full"
                      >
                        <div
                          onWheel={(e) => {
                            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                              e.currentTarget.scrollLeft += e.deltaY;
                            }
                          }}
                          className={`flex items-center gap-2 p-2 rounded-2xl border overflow-x-auto no-scrollbar touch-pan-x transition-colors ${
                            theme === 'celestial-slate'
                              ? 'bg-[#E2EDF8] border-[#BED4EB]'
                              : 'bg-[#251A13] border-[#3E2B1E]'
                          }`}
                        >
                          {[
                            { id: 'talmud' as SacredRealmId, icon: <Scroll className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'תלמוד בבלי', ka: 'თალმუდი' },
                            { id: 'torah' as SacredRealmId, icon: <BookOpen className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'חומש • תורה', ka: 'თორა (ხუმაში)' },
                            { id: 'neviim' as SacredRealmId, icon: <Compass className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'נביאים', ka: 'ნევიიმ (წინასწარმეტყველნი)' },
                            { id: 'ketuvim' as SacredRealmId, icon: <BookMarked className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'כתובים', ka: 'ქეთუვიმ (წმინდა წერილები)' },
                            { id: 'mishnayot' as SacredRealmId, icon: <Layers className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'משניות', ka: 'მიშნაიოთ (შქვსი სედერი)' },
                            { id: 'siddur' as SacredRealmId, icon: <Flame className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'סידור כוונת הלב', ka: 'სიდური (ლოცვები)' },
                            { id: 'rambam' as SacredRealmId, icon: <Crown className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'משנה תורה לרמב"ם', ka: 'რამბამი' },
                            { id: 'tur' as SacredRealmId, icon: <Library className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'ארבעה טורים', ka: 'არბაა ტურიმი' },
                            { id: 'shulchan-aruch' as SacredRealmId, icon: <BookKey className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'שולחן ערוך', ka: 'შულხან არუხი' },
                            { id: 'mishnah-berurah' as SacredRealmId, icon: <SunMedium className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'משנה ברורה', ka: 'მიშნა ბრურა' },
                            { id: 'yalkut-yosef' as SacredRealmId, icon: <Scale className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'ילקוט יוסף', ka: 'იალკუტ იოსები' },
                            { id: 'daily-halakhot' as SacredRealmId, icon: <CalendarCheck className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'שתי הלכות ביום', ka: 'ყოველდღიური ჰალახა' },
                            { id: 'sephardic-halakha' as SacredRealmId, icon: <Award className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'הלכה ספרדית', ka: 'სეფარდული ჰალახა' },
                            { id: 'calendar' as SacredRealmId, icon: <Calendar className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'לוח שנה עברי וזמנים', ka: 'ებრაული კალენდარი და ზმანიმები' },
                            { id: 'blessings' as SacredRealmId, icon: <HeartHandshake className="w-4.5 h-4.5 stroke-[2.2]" />, he: 'מאה ברכות', ka: 'ყოველდღიური კურთხევები' },
                          ].map((realmItem, rIdx) => {
                            const isActive = activeRealm === realmItem.id;
                            return (
                              <button
                                key={realmItem.id}
                                type="button"
                                data-raw-btn="true"
                                data-flat-btn="true"
                                onClick={() => {
                                  setActiveRealm(realmItem.id);
                                  setIsGlobalBottomSheetOpen(false);
                                }}
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95 border select-none ${
                                  isActive
                                    ? 'bg-[#4F6832] text-white border-[#64843F] font-bold shadow-sm ring-1 ring-white/20'
                                    : theme === 'celestial-slate'
                                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-[#BED4EB]'
                                      : 'bg-[#2E2017] hover:bg-[#3D2C20] text-stone-300 hover:text-white border-[#4A3425]'
                                }`}
                                title={`${realmItem.ka} • ${realmItem.he}`}
                                aria-label={realmItem.ka}
                              >
                                <AnimatedGlobeIconWrapper duration={5 + (rIdx % 4) * 0.4}>
                                  {realmItem.icon}
                                </AnimatedGlobeIconWrapper>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* ROW 3: CASCADING FILTER MODAL QUICK LAUNCHER (WRAPPED IN STAGGERED ITEM VARIANT + SOFT CALM PALETTE) */}
                      <motion.div
                        variants={cascadingMenuItemVariants}
                        className="w-full"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsGlobalBottomSheetOpen(false);
                            setIsCascadingSelectorOpen(true);
                          }}
                          className={`w-full py-2.5 px-3.5 rounded-xl border font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.99] ${
                            theme === 'celestial-slate'
                              ? 'bg-[#E0EFFC] hover:bg-[#D5E9FA] border-[#94B8DC] text-[#0F172A]'
                              : 'bg-[#281D15] hover:bg-[#33251B] border-[#4A3425] text-[#FAF5EB]'
                          }`}
                        >
                          <Layers className={`w-4 h-4 shrink-0 ${theme === 'celestial-slate' ? 'text-sky-600' : 'text-[#E5B87E]'}`} />
                          <span className="truncate">კასკადური სარჩევი • 4 სვეტიანი ფილტრაცია (სედერი • ტრაქტატი • ფერეკი • მიშნა)</span>
                        </button>
                      </motion.div>

                      {/* ROW 4: 3 SYMMETRICAL MODERN FILTER SELECTORS FOR SHAS (WRAPPED IN STAGGERED ITEM VARIANT) */}
                      <motion.div
                        variants={cascadingMenuItemVariants}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                      >
                        <SearchableSelect
                          label={t.sederLabel}
                          options={sederOptions}
                          value={selectedSederId}
                          onChange={(val) => {
                            setSelectedSederId(val);
                            if (val !== 'all') {
                              const firstInSeder = TRACTATES.find((tr) => tr.sederId === val);
                              if (firstInSeder) {
                                setSelectedTractateId(firstInSeder.id);
                                setSelectedDafId('2a');
                              }
                            }
                          }}
                          placeholder={t.searchPlaceholder}
                          variant="modern"
                          compact
                          theme={theme}
                          isDark={isDark}
                        />

                        <SearchableSelect
                          label={t.tractateLabel}
                          options={tractateOptions}
                          value={selectedTractateId}
                          onChange={(val) => {
                            if (activeRealm !== 'talmud') setActiveRealm('talmud');
                            setSelectedTractateId(val);
                            setSelectedDafId('2a');
                          }}
                          placeholder={t.searchPlaceholder}
                          variant="modern"
                          compact
                          theme={theme}
                          isDark={isDark}
                        />

                        <SearchableSelect
                          label={t.dafLabel}
                          options={dafOptions}
                          value={selectedDafId}
                          onChange={(val) => {
                            if (activeRealm !== 'talmud') setActiveRealm('talmud');
                            const curIdx = dafList.indexOf(selectedDafId);
                            const nextIdx = dafList.indexOf(val);
                            setPageTurnDirection(nextIdx >= curIdx ? 1 : -1);
                            setSelectedDafId(val);
                            setIsGlobalBottomSheetOpen(false);
                          }}
                          placeholder={t.searchPlaceholder}
                          variant="modern"
                          compact
                          theme={theme}
                          isDark={isDark}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.nav>
        </>
      )}

      {/* WORD & SENTENCE INTERACTIVE POPOVER (Stage 2: Compact Note Window -> Stage 3: Deep Explanation Screen) */}
      <AnimatePresence>
        {selectedTarget && (wordExplainStage === 'note' || wordExplainStage === 'deep') && (
          <WordSentencePopover
            key={`word-sentence-popover-${wordExplainStage}`}
            target={selectedTarget}
            analysis={analysisResult}
            loading={analysisLoading}
            activeMode={activeMode}
            onSelectMode={handleSelectMode}
            onSelectWord={(word, sentence, rect) =>
              handleSelectWordOrSentence(word, sentence, rect, activeMode)
            }
            onClose={() => {
              setSelectedTarget(null);
              setWordExplainStage('none');
            }}
            onAddNote={handleAddNote}
            allCommentaries={dafData.allCommentaries}
            isDark={isDark}
            uiLang={uiLang}
            stage={wordExplainStage === 'note' ? 'note' : 'deep'}
            onOpenDeepStudy={(mode) => {
              if (mode) handleSelectMode(mode);
              setWordExplainStage('deep');
            }}
            onBackToNote={() => setWordExplainStage('note')}
          />
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL (Font Size + Recently Viewed + 7 Languages + 4 Themes + Nikud) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        dafFontSizeScale={dafFontSizeScale}
        onChangeDafFontSizeScale={handleChangeDafFontSizeScale}
        showAboveDaf={showAboveDaf}
        onToggleAboveDaf={(val) => setShowAboveDaf(val)}
        showBelowDaf={showBelowDaf}
        onToggleBelowDaf={(val) => setShowBelowDaf(val)}
        theme={theme}
        onToggleTheme={cycleNextTheme}
        onSelectTheme={(nextTheme) => setTheme(nextTheme)}
        isDark={isDark}
        recentlyViewedDapim={recentlyViewedDapim}
        onSelectRecentDaf={(tractateId, dafId) => {
          handleNavigateFromVoiceOrAi(tractateId, dafId);
        }}
      />

      {/* EXPORT PROJECT & DOWNLOADS MODAL */}
      <ExportProjectModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        isDark={isDark}
      />

      {/* VOICE & AI NAVIGATION MODAL */}
      <VoiceAndAiNavModal
        isOpen={voiceAiModalState.isOpen}
        initialTab={voiceAiModalState.initialTab}
        onClose={() => setVoiceAiModalState((prev) => ({ ...prev, isOpen: false }))}
        onNavigateToDaf={handleNavigateFromVoiceOrAi}
        onNavigateToRealm={(realmId, bookId, chapter, highlightQuery) => {
          setSearchHighlightQuery(highlightQuery ? highlightQuery.trim() : '');
          handleNavigateRealmOrTalmud(realmId as SacredRealmId, bookId, chapter);
        }}
        onPrevAmud={() => handlePrevAmud(true)}
        onNextAmud={() => handleNextAmud(true)}
        currentDafData={dafData}
        isDark={isDark}
      />

      {/* FULL OFFLINE TRACTATE PACK DOWNLOADER & WORKBOX CACHE MODAL */}
      <AnimatePresence>
        {isOfflineLibraryModalOpen && (
          <motion.div
            key="offline-library-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            onClick={() => setIsOfflineLibraryModalOpen(false)}
            className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              key="offline-library-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border-2 p-4 sm:p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#1D140E] border-[#C49A6C]/55 text-[#FAF5EB]'
                  : 'bg-[#EDE0C8] border-[#6B4226] text-[#21150B]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#8C6239]/35">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#6B4226] text-[#FAF5EB] border border-[#C49A6C]/60">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold font-serif-ka">
                      სრული ოფლაინ ბიბლიოთეკა • Full Offline Tractate Pack Downloader
                    </h3>
                    <p className="text-[11px] opacity-80">
                      Workbox Service Worker + IndexedDB • წაიკითხეთ ნანახი და ჩამოტვირთული დაფები ინტერნეტის გარეშე
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOfflineLibraryModalOpen(false)}
                  className="p-2 rounded-xl border border-[#C49A6C]/40 hover:bg-[#6B4226]/30 transition-colors cursor-pointer"
                  title="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <OfflineLibraryPanel
                currentDafData={dafData}
                isDark={isDark}
                onNavigateToDaf={(tractateId, dafId) => {
                  handleNavigateFromVoiceOrAi(tractateId, dafId);
                  setIsOfflineLibraryModalOpen(false);
                }}
                onCloseModal={() => setIsOfflineLibraryModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MishnahMapModal
        open={isMishnahMapOpen}
        onClose={() => setIsMishnahMapOpen(false)}
        onOpenGuide={() => { setIsMishnahMapOpen(false); setIsMishnahGuideOpen(true); }}
        data={mishnahChapter}
        tractateNameKa={currentTractate.nameKa}
        dafId={selectedDafId}
        mishnahPct={mishnahPct}
      />
      <MishnahGuideModal
        open={isMishnahGuideOpen}
        onClose={() => setIsMishnahGuideOpen(false)}
        data={mishnahChapter}
        tractateNameKa={currentTractate.nameKa}
        tractateNameHe={currentTractate.nameHe}
        dafId={selectedDafId}
      />

      {/* 4-COLUMN CASCADING MISHNAH & TALMUD SELECTOR MODAL (EXACT SPEC MATCH) */}
      <CascadingTalmudMishnahSelectorModal
        isOpen={isCascadingSelectorOpen}
        onClose={() => setIsCascadingSelectorOpen(false)}
        initialSederId={currentTractate?.sederId || 'moed'}
        initialTractateId={dafData?.tractateId || selectedTractateId}
        initialDafId={dafData?.dafId || selectedDafId}
        initialChapter={1}
        initialMishnah={1}
        isDark={isDark}
        theme={theme}
        recentlyViewedDapim={recentlyViewedDapim}
        onClearHistory={() => {
          setRecentlyViewedDapim([]);
          localStorage.removeItem('talmud_recently_viewed_v1');
        }}
        onSelectDaf={(trId, dafId) => {
          if (activeRealm !== 'talmud') setActiveRealm('talmud');
          setSelectedTractateId(trId);
          setSelectedDafId(dafId);
        }}
        onSelectMishnah={(trId, chapter, mishnah) => {
          if (activeRealm !== 'talmud') setActiveRealm('talmud');
          setSelectedTractateId(trId);
          const tr = TRACTATES.find((t) => t.id === trId);
          const totalCh = tr?.chapters || 5;
          const lastD = tr?.lastDaf || 64;
          const targetDafNum = Math.min(
            lastD,
            Math.max(2, Math.round((chapter / totalCh) * (lastD - 2) + 2))
          );
          setSelectedDafId(`${targetDafNum}a`);
          setHighlightedSentenceId(`${trId}-init-m1`);
        }}
      />

      {/* CRYSTAL MOUSE JOYSTICK & SMART LINE/SCREEN CONTROLLER */}
      <CrystalMouseJoystick
        isDark={isDark}
        onPrevDaf={() => {
          if (activeRealm === 'talmud') {
            handlePrevAmud(true);
          } else {
            window.dispatchEvent(new CustomEvent('global-page-prev'));
          }
        }}
        onNextDaf={() => {
          if (activeRealm === 'talmud') {
            handleNextAmud(true);
          } else {
            window.dispatchEvent(new CustomEvent('global-page-next'));
          }
        }}
        onAdjustFontScale={(delta) =>
          setDafFontSizeScale((prev) => Math.max(70, Math.min(160, prev + delta)))
        }
        externalOpen={isJoystickOpen}
        onToggleExternalOpen={() => setIsJoystickOpen((v) => !v)}
      />

      {/* SUBTLE CELEBRATORY CONFETTI ANIMATION WHEN A DAF IS MARKED COMPLETED */}
      <DafCompletionConfetti />
    </div>
  );
}

export default App;
