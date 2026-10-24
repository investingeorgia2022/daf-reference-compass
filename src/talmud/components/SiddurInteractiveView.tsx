// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  Layers,
  Calendar,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle2,
  Circle,
  Compass,
  Music,
  Sun,
  Sunset,
  Moon,
  Utensils,
  Languages,
  Maximize2,
  Search,
} from 'lucide-react';
import {
  AnalysisMode,
  ScholarNote,
  SelectedDafTarget,
  TalmudSentence,
} from '../types/talmud';
import { toHebrewDafNumber } from '../data/tractates';
import {
  SIDDUR_CATEGORIES,
  SIDDUR_EDITIONS,
  SIDDUR_PRAYER_SECTIONS,
  SiddurEditionId,
  buildSiddurDafPageData,
  findSiddurSectionForPage,
} from '../data/siddurPdfCatalog';
import {
  SIDDUR_QUICK_JUMP_LANDMARKS,
  NUSACH_MAQAM_OPTIONS,
  DailyPrayerServiceId,
  NusachMaqamId,
  AudioGuideMode,
  buildDailyHalakhicPrayerStatus,
  buildAudioVersesForSiddurSection,
  playCantorialMaqamNote,
} from '../utils/siddurDailyAndAudioEngine';
import { SacredRealmId } from '../data/tanakhAndHalakhaData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { WindowsWindowControls } from './WindowsWindowControls';
import { ClassicTalmudDaf } from './ClassicTalmudDaf';
import { HebrewHalakhicCalendarView } from './HebrewHalakhicCalendarView';

interface SiddurInteractiveViewProps {
  isDark: boolean;
  selectedTarget: SelectedDafTarget | null;
  onSelectWordOrSentence: (
    word: string,
    sentence: TalmudSentence,
    rect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  onOpenVoiceNav: () => void;
  onOpenAiNav: () => void;
  onAddDafNote: (sectionLabel: string, noteText: string) => void;
  onDeleteNote: (id: string) => void;
  notes: ScholarNote[];
  highlightedSentenceId: string | null;
  showAboveDaf?: boolean;
  onToggleAboveDaf?: () => void;
  showBelowDaf?: boolean;
  onToggleBelowDaf?: () => void;
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
  onOpenDailyBlessingsGuide?: () => void;
  externalCalendarDate?: Date;
  onChangeExternalCalendarDate?: (date: Date) => void;
  onNavigateToRealm?: (
    realmId: SacredRealmId,
    bookId?: string,
    chapter?: number,
    tractateId?: string,
    dafId?: string
  ) => void;
}

const COMPLETED_PRAYERS_STORAGE_KEY = 'siddur_daily_completed_steps_v1';

export const SiddurInteractiveView: React.FC<SiddurInteractiveViewProps> = ({
  isDark,
  selectedTarget,
  onSelectWordOrSentence,
  onOpenVoiceNav,
  onOpenAiNav,
  onAddDafNote,
  onDeleteNote,
  notes,
  highlightedSentenceId,
  showAboveDaf = true,
  onToggleAboveDaf,
  showBelowDaf = true,
  onToggleBelowDaf,
  dafFontSizeScale = 100,
  onChangeDafFontSizeScale,
  belowDafStudyCenter,
  onNavigateToTractateDaf,
  onRecordCitationReturnPoint,
  pendingReturnRestore,
  wordExplainStage = 'marked',
  onOpenWordNote,
  searchHighlightQuery = null,
  onOpenFloatingSourceDaf,
  onOpenDailyBlessingsGuide,
  externalCalendarDate,
  onChangeExternalCalendarDate,
  onNavigateToRealm,
}) => {
  const [editionId, setEditionId] = useState<SiddurEditionId>('kavanat-halev');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>('modeh-ani-netilat');
  const [selectedPage, setSelectedPage] = useState<number>(29);
  const [pageTurnDirection, setPageTurnDirection] = useState<number>(0);
  const [isSiddurDeckMinimized, setIsSiddurDeckMinimized] = useState<boolean>(true);
  const [isSiddurDeckMaximized, setIsSiddurDeckMaximized] = useState<boolean>(false);
  const [siddurAutoTranslateLineMode, setSiddurAutoTranslateLineMode] = useState<boolean>(false);
  const [siddurFullViewport, setSiddurFullViewport] = useState<boolean>(false);
  const [siddurRowStepTrigger, setSiddurRowStepTrigger] = useState<{
    dir: 'prev' | 'next' | 'jump';
    seq: number;
  } | null>(null);

  // Quick-Jump Breadcrumb dropdown states
  const [openBreadcrumbDropdown, setOpenBreadcrumbDropdown] = useState<
    'edition' | 'category' | 'prayer' | 'page' | null
  >(null);

  // Daily Prayer Mode & HebrewHalakhicCalendarView integration states (collapsed by default so user lands immediately on the Daf)
  const [isDailyPrayerModeOpen, setIsDailyPrayerModeOpen] = useState<boolean>(false);
  const [isInlineCalendarOpen, setIsInlineCalendarOpen] = useState<boolean>(false);
  const [internalCalendarDate, setInternalCalendarDate] = useState<Date>(() => new Date());
  const activeCalendarDate = externalCalendarDate || internalCalendarDate;

  const handleSetCalendarDate = useCallback(
    (nextDate: Date) => {
      setInternalCalendarDate(nextDate);
      if (onChangeExternalCalendarDate) {
        onChangeExternalCalendarDate(nextDate);
      }
    },
    [onChangeExternalCalendarDate]
  );

  const dailyStatus = useMemo(
    () => buildDailyHalakhicPrayerStatus(activeCalendarDate),
    [activeCalendarDate]
  );

  const [activeServiceId, setActiveServiceId] = useState<DailyPrayerServiceId>(() =>
    dailyStatus.recommendedService
  );

  const [completedStepIdsByDate, setCompletedStepIdsByDate] = useState<
    Record<string, string[]>
  >(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(COMPLETED_PRAYERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const dateKeyStr = useMemo(
    () => activeCalendarDate.toISOString().slice(0, 10),
    [activeCalendarDate]
  );

  const completedStepsForActiveDate = useMemo(
    () => new Set(completedStepIdsByDate[dateKeyStr] || []),
    [completedStepIdsByDate, dateKeyStr]
  );

  const toggleDailyStepCompleted = useCallback(
    (stepId: string) => {
      setCompletedStepIdsByDate((prev) => {
        const currentList = prev[dateKeyStr] || [];
        const exists = currentList.includes(stepId);
        const nextList = exists
          ? currentList.filter((id) => id !== stepId)
          : [...currentList, stepId];
        const nextState = { ...prev, [dateKeyStr]: nextList };
        try {
          window.localStorage.setItem(
            COMPLETED_PRAYERS_STORAGE_KEY,
            JSON.stringify(nextState)
          );
        } catch {
          // ignore storage errors
        }
        return nextState;
      });
    },
    [dateKeyStr]
  );

  // Melodic Audio Guide States (collapsed by default so user lands immediately on the Daf)
  const [isSiddurTopBarMinimized, setIsSiddurTopBarMinimized] = useState<boolean>(false);
  const [isSiddurTopBarMaximized, setIsSiddurTopBarMaximized] = useState<boolean>(false);
  const [isDailyPrayerMaximized, setIsDailyPrayerMaximized] = useState<boolean>(false);
  const [isAudioGuideExpanded, setIsAudioGuideExpanded] = useState<boolean>(false);
  const [isAudioGuideMaximized, setIsAudioGuideMaximized] = useState<boolean>(false);
  const [selectedMaqamId, setSelectedMaqamId] = useState<NusachMaqamId>('yerushalmi-rast');
  const [audioGuideMode, setAudioGuideMode] = useState<AudioGuideMode>('melody-and-voice');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlayingAudioGuide, setIsPlayingAudioGuide] = useState<boolean>(false);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const activeEdition = useMemo(
    () => SIDDUR_EDITIONS.find((e) => e.id === editionId) || SIDDUR_EDITIONS[0],
    [editionId]
  );

  const filteredPrayers = useMemo(() => {
    if (selectedCategoryId === 'all') return SIDDUR_PRAYER_SECTIONS;
    return SIDDUR_PRAYER_SECTIONS.filter((s) => s.categoryId === selectedCategoryId);
  }, [selectedCategoryId]);

  const activePrayerSection = useMemo(
    () =>
      SIDDUR_PRAYER_SECTIONS.find((s) => s.id === selectedPrayerId) ||
      findSiddurSectionForPage(editionId, selectedPage),
    [selectedPrayerId, editionId, selectedPage]
  );

  const activeCategoryMeta = useMemo(
    () =>
      SIDDUR_CATEGORIES.find((c) => c.id === activePrayerSection.categoryId) ||
      SIDDUR_CATEGORIES[0],
    [activePrayerSection.categoryId]
  );

  const activeMaqam = useMemo(
    () =>
      NUSACH_MAQAM_OPTIONS.find((m) => m.id === selectedMaqamId) ||
      NUSACH_MAQAM_OPTIONS[0],
    [selectedMaqamId]
  );

  const audioVerses = useMemo(
    () => buildAudioVersesForSiddurSection(activePrayerSection, editionId),
    [activePrayerSection, editionId]
  );

  // Stop audio helper
  const stopAudioPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlayingAudioGuide(false);
    if (wordTimerRef.current) {
      window.clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      } catch {
        // ignore
      }
      htmlAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  // Reset verse index when changing prayer section
  useEffect(() => {
    stopAudioPlayback();
    setActiveVerseIndex(0);
    setActiveWordIndex(0);
  }, [activePrayerSection.id, stopAudioPlayback]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  // Play a specific verse with Melodic Maqam accompaniment + synchronized word-by-word highlight + vocal TTS
  const startPlayingVerseAtIndex = useCallback(
    (verseIdx: number) => {
      const targetVerse = audioVerses[verseIdx];
      if (!targetVerse) {
        stopAudioPlayback();
        return;
      }

      if (wordTimerRef.current) {
        window.clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
      if (htmlAudioRef.current) {
        try {
          htmlAudioRef.current.pause();
        } catch {
          // ignore
        }
        htmlAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }

      isPlayingRef.current = true;
      setIsPlayingAudioGuide(true);
      setActiveVerseIndex(verseIdx);
      setActiveWordIndex(0);

      // Ensure Web Audio API context is ready for traditional Maqam notes
      if (typeof window !== 'undefined' && !audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }

      const words = targetVerse.words.length > 0 ? targetVerse.words : ['בָּרוּךְ'];
      const wordIntervalMs = Math.max(240, Math.round(520 / playbackSpeed));

      // Play opening cantorial note immediately if melody is enabled
      if (audioGuideMode !== 'voice-only' && audioCtxRef.current) {
        playCantorialMaqamNote(audioCtxRef.current, activeMaqam, 0, 0.65, false);
      }

      let curWord = 0;
      wordTimerRef.current = window.setInterval(() => {
        if (!isPlayingRef.current) return;
        curWord += 1;
        if (curWord < words.length) {
          setActiveWordIndex(curWord);
          if (audioGuideMode !== 'voice-only' && audioCtxRef.current) {
            const isLast = curWord === words.length - 1;
            playCantorialMaqamNote(
              audioCtxRef.current,
              activeMaqam,
              curWord,
              isLast ? 0.85 : Math.min(0.65, (wordIntervalMs / 1000) * 1.1),
              isLast
            );
          }
        } else {
          // Completed words of this verse
          if (wordTimerRef.current) {
            window.clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
          }
          // If melody-only mode, advance to next verse automatically after brief cadence pause
          if (audioGuideMode === 'melody-only') {
            window.setTimeout(() => {
              if (!isPlayingRef.current) return;
              if (verseIdx + 1 < audioVerses.length) {
                startPlayingVerseAtIndex(verseIdx + 1);
              } else {
                stopAudioPlayback();
              }
            }, 650);
          }
        }
      }, wordIntervalMs);

      // If voice is enabled, play Hebrew vocal recitation via /api/tts with speechSynthesis fallback
      if (audioGuideMode !== 'melody-only' && typeof window !== 'undefined') {
        const ttsText = targetVerse.chantHebrew.slice(0, 260);
        const audio = new Audio(
          `/api/tts?lang=he&text=${encodeURIComponent(ttsText)}`
        );
        audio.playbackRate = playbackSpeed;
        htmlAudioRef.current = audio;

        const handleVoiceEnded = () => {
          if (!isPlayingRef.current) return;
          if (wordTimerRef.current) {
            window.clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
          }
          if (audioGuideMode !== 'voice-only' && audioCtxRef.current) {
            playCantorialMaqamNote(audioCtxRef.current, activeMaqam, 0, 0.85, true);
          }
          window.setTimeout(() => {
            if (!isPlayingRef.current) return;
            if (verseIdx + 1 < audioVerses.length) {
              startPlayingVerseAtIndex(verseIdx + 1);
            } else {
              stopAudioPlayback();
            }
          }, 500);
        };

        audio.onended = handleVoiceEnded;
        audio.onerror = () => {
          // Fallback to Web Speech API if /api/tts fails
          if ('speechSynthesis' in window && isPlayingRef.current) {
            try {
              const utter = new SpeechSynthesisUtterance(ttsText);
              utter.lang = 'he-IL';
              utter.rate = Math.max(0.75, Math.min(1.2, playbackSpeed * 0.92));
              utter.onend = handleVoiceEnded;
              utter.onerror = handleVoiceEnded;
              window.speechSynthesis.speak(utter);
              return;
            } catch {
              // ignore
            }
          }
        };

        audio.play().catch(() => {
          if (audio.onerror) {
            (audio.onerror as () => void)();
          }
        });
      }
    },
    [
      audioVerses,
      stopAudioPlayback,
      playbackSpeed,
      audioGuideMode,
      activeMaqam,
    ]
  );

  const handleTogglePlayAudioGuide = useCallback(() => {
    if (isPlayingAudioGuide) {
      stopAudioPlayback();
    } else {
      startPlayingVerseAtIndex(activeVerseIndex);
    }
  }, [isPlayingAudioGuide, stopAudioPlayback, startPlayingVerseAtIndex, activeVerseIndex]);

  const handleSelectEdition = useCallback(
    (nextEdition: SiddurEditionId) => {
      setEditionId(nextEdition);
      const sec =
        SIDDUR_PRAYER_SECTIONS.find((s) => s.id === selectedPrayerId) ||
        SIDDUR_PRAYER_SECTIONS[0];
      const nextPage =
        nextEdition === 'classic-siddur' ? sec.classicPage : sec.kavanatPage;
      setSelectedPage(nextPage);
      setOpenBreadcrumbDropdown(null);
    },
    [selectedPrayerId]
  );

  const handleSelectPrayer = useCallback(
    (prayerId: string) => {
      const sec = SIDDUR_PRAYER_SECTIONS.find((s) => s.id === prayerId);
      if (!sec) return;
      setSelectedPrayerId(sec.id);
      const targetPage =
        editionId === 'classic-siddur' ? sec.classicPage : sec.kavanatPage;
      setPageTurnDirection(targetPage >= selectedPage ? 1 : -1);
      setSelectedPage(targetPage);
      setOpenBreadcrumbDropdown(null);
    },
    [editionId, selectedPage]
  );

  const handleSelectPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.max(1, Math.min(activeEdition.totalPages, nextPage));
      setPageTurnDirection(clamped >= selectedPage ? 1 : -1);
      setSelectedPage(clamped);
      const matchedSec = findSiddurSectionForPage(editionId, clamped);
      if (matchedSec) {
        setSelectedPrayerId(matchedSec.id);
      }
      setOpenBreadcrumbDropdown(null);
    },
    [activeEdition.totalPages, selectedPage, editionId]
  );

  const handlePrevPage = useCallback(() => {
    const pages = activeEdition.bundledPages;
    const prevBundled = [...pages].reverse().find((p) => p < selectedPage);
    if (prevBundled !== undefined) {
      handleSelectPage(prevBundled);
    } else if (pages.length > 0) {
      handleSelectPage(pages[pages.length - 1]);
    }
  }, [activeEdition.bundledPages, selectedPage, handleSelectPage]);

  const handleNextPage = useCallback(() => {
    const pages = activeEdition.bundledPages;
    const nextBundled = pages.find((p) => p > selectedPage);
    if (nextBundled !== undefined) {
      handleSelectPage(nextBundled);
    } else if (pages.length > 0) {
      handleSelectPage(pages[0]);
    }
  }, [activeEdition.bundledPages, selectedPage, handleSelectPage]);

  // Listen to global bottom-bar page turn events ('global-page-prev' / 'global-page-next' / 'sacred-daf-step')
  useEffect(() => {
    const onGlobalPrev = () => handlePrevPage();
    const onGlobalNext = () => handleNextPage();
    window.addEventListener('global-page-prev', onGlobalPrev);
    window.addEventListener('global-page-next', onGlobalNext);
    return () => {
      window.removeEventListener('global-page-prev', onGlobalPrev);
      window.removeEventListener('global-page-next', onGlobalNext);
    };
  }, [handlePrevPage, handleNextPage]);

  const handleStepPrayerSection = useCallback(
    (delta: number) => {
      const curIdx = SIDDUR_PRAYER_SECTIONS.findIndex(
        (s) => s.id === activePrayerSection.id
      );
      const nextIdx =
        (curIdx + delta + SIDDUR_PRAYER_SECTIONS.length) %
        SIDDUR_PRAYER_SECTIONS.length;
      const nextSec = SIDDUR_PRAYER_SECTIONS[nextIdx];
      if (nextSec) {
        handleSelectPrayer(nextSec.id);
      }
    },
    [activePrayerSection.id, handleSelectPrayer]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: 'כל התפילות',
        label: 'ყველა განყოფილება (მთელი სიდური)',
        sublabel: `${SIDDUR_PRAYER_SECTIONS.length} ძირითადი ლოცვა და სედერი`,
      },
      ...SIDDUR_CATEGORIES.map((c) => ({
        value: c.id,
        badgeHe: c.nameHe,
        label: c.nameKa,
        sublabel: c.subtitleKa,
      })),
    ],
    []
  );

  const prayerOptions: SelectOption[] = useMemo(
    () =>
      filteredPrayers.map((p) => {
        const pg = editionId === 'classic-siddur' ? p.classicPage : p.kavanatPage;
        return {
          value: p.id,
          badgeHe: `${p.nameHe.split('•')[0].trim()} (עמ׳ ${pg})`,
          label: p.nameKa,
          sublabel: `${p.subtitleKa} • გვ. ${pg}`,
        };
      }),
    [filteredPrayers, editionId]
  );

  const pageOptions: SelectOption[] = useMemo(() => {
    const bundledSet = new Set(activeEdition.bundledPages);
    const list: SelectOption[] = [];
    for (let p = 1; p <= activeEdition.totalPages; p++) {
      const sec = findSiddurSectionForPage(editionId, p);
      const isBundled = bundledSet.has(p);
      const hebNum = toHebrewDafNumber(Math.max(2, p));
      list.push({
        value: String(p),
        badgeHe: `עמ׳ ${hebNum} (${p})`,
        label: isBundled
          ? `გვერდი ${p} • ${sec.nameKa}`
          : `გვერდი ${p} (${sec.nameKa})`,
        sublabel: isBundled
          ? `★ ორიგინალი PDF დაფი (${sec.nameHe})`
          : sec.nameHe,
      });
    }
    return list;
  }, [activeEdition, editionId]);

  const siddurDafData = useMemo(
    () => buildSiddurDafPageData(editionId, activePrayerSection.id, selectedPage),
    [editionId, activePrayerSection.id, selectedPage]
  );

  const activeServiceObj =
    dailyStatus.services[activeServiceId] || dailyStatus.services.shacharit;

  const completedCountInActiveService = useMemo(
    () =>
      activeServiceObj.steps.filter((st) =>
        completedStepsForActiveDate.has(st.stepId)
      ).length,
    [activeServiceObj.steps, completedStepsForActiveDate]
  );

  const activeAudioVerse = audioVerses[activeVerseIndex] || audioVerses[0];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-3 lg:px-5 pt-0.5 pb-2 flex flex-col gap-1.5">
      {/* OPTIONAL SEARCHABLE SIDDUR INDEX DRAWER (Only shown when user clicks "სარჩევი" / showAboveDaf) */}
      {showAboveDaf && (
        <div
          className={`w-full p-2.5 sm:p-3 rounded-2xl border flex flex-col gap-2 transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-b from-[#2A1D15]/95 to-[#1F150E]/95 border-[#C49A6C]/40 shadow-lg text-[#FAF5EB]'
              : 'bg-gradient-to-b from-[#EFE4D0] to-[#DECAA9] border-[#6E472B]/45 shadow-md text-[#21160F]'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 items-end">
            <SearchableSelect
              label="1. ლოცვის განყოფილება (סדר התפילה)"
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={(val) => {
                setSelectedCategoryId(val);
                if (val !== 'all') {
                  const firstInCat = SIDDUR_PRAYER_SECTIONS.find(
                    (s) => s.categoryId === val
                  );
                  if (firstInCat) {
                    handleSelectPrayer(firstInCat.id);
                  }
                }
              }}
              placeholder="მოძებნეთ განყოფილება..."
              isDark={isDark}
              compact
            />

            <SearchableSelect
              label="2. ლოცვა და სედერი (תפילה וכוונות)"
              options={prayerOptions}
              value={activePrayerSection.id}
              onChange={handleSelectPrayer}
              placeholder="მოძებნეთ ლოცვა (მაგ. מודה אני, שמונה עשרה)..."
              isDark={isDark}
              compact
            />

            <SearchableSelect
              label="3. PDF დაფი / გვერდი (עמוד בסידור)"
              options={pageOptions}
              value={String(selectedPage)}
              onChange={(val) => handleSelectPage(parseInt(val, 10) || 29)}
              placeholder="გვერდის ნომერი..."
              isDark={isDark}
              compact
            />
          </div>
        </div>
      )}

      {/* UNIFIED SIDDUR DAF ON SCREEN WITH SIMPLE SINGLE-LINE NAVIGATION BAR */}
      <ClassicTalmudDaf
        dafData={siddurDafData}
        tractateNameHe={activeEdition.nameHe}
        tractateNameKa={activeEdition.shortKa}
        selectedTarget={selectedTarget}
        onSelectWordOrSentence={onSelectWordOrSentence}
        onPrevAmud={handlePrevPage}
        onNextAmud={handleNextPage}
        onOpenVoiceNav={onOpenVoiceNav}
        onOpenAiNav={onOpenAiNav}
        onAddDafNote={onAddDafNote}
        onDeleteNote={onDeleteNote}
        isDark={isDark}
        notes={notes}
        highlightedSentenceId={highlightedSentenceId}
        showAboveDaf={showAboveDaf}
        onToggleAboveDaf={onToggleAboveDaf}
        showBelowDaf={showBelowDaf}
        onToggleBelowDaf={onToggleBelowDaf}
        pageTurnDirection={pageTurnDirection}
        dafFontSizeScale={dafFontSizeScale}
        onChangeDafFontSizeScale={onChangeDafFontSizeScale}
        belowDafStudyCenter={belowDafStudyCenter}
        onNavigateToTractateDaf={onNavigateToTractateDaf}
        onRecordCitationReturnPoint={onRecordCitationReturnPoint}
        pendingReturnRestore={pendingReturnRestore}
        wordExplainStage={wordExplainStage}
        onOpenWordNote={onOpenWordNote}
        searchHighlightQuery={searchHighlightQuery}
        externalAutoTranslateLineMode={siddurAutoTranslateLineMode}
        onExternalToggleAutoTranslateLineMode={() =>
          setSiddurAutoTranslateLineMode((v) => !v)
        }
        externalStoppedRowStepTrigger={siddurRowStepTrigger}
        externalFullViewport={siddurFullViewport}
        onExternalToggleFullViewport={() => setSiddurFullViewport((v) => !v)}
        onOpenFloatingSourceDaf={onOpenFloatingSourceDaf}
        customCenterNavigationSelector={
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Siddur Edition Selector */}
            <div className="w-[140px] sm:w-[170px] min-w-0">
              <SearchableSelect
                value={editionId}
                onChange={(val) => handleSelectEdition(val as SiddurEditionId)}
                options={SIDDUR_EDITIONS.map((ed) => ({
                  value: ed.id,
                  badgeHe: ed.nameHe,
                  label: `${ed.shortKa} • ${ed.nameHe}`,
                }))}
                isDark={isDark}
                compact
                searchPlaceholder="გამოცემა..."
              />
            </div>

            {/* 2. Prayer Section Selector */}
            <div className="w-[170px] sm:w-[230px] min-w-0">
              <SearchableSelect
                value={activePrayerSection.id}
                onChange={(val) => handleSelectPrayer(val)}
                options={SIDDUR_PRAYER_SECTIONS.map((sec) => {
                  const pg =
                    editionId === 'classic-siddur' ? sec.classicPage : sec.kavanatPage;
                  return {
                    value: sec.id,
                    badgeHe: sec.nameHe.split('•')[0].trim(),
                    label: `${sec.nameKa.split('(')[0].trim()} • ${sec.nameHe.split('•')[0].trim()} (გვ. ${pg})`,
                  };
                })}
                isDark={isDark}
                compact
                searchPlaceholder="ლოცვა..."
              />
            </div>

            {/* 3. Direct Page Selector */}
            <div className="w-[95px] sm:w-[115px] min-w-0">
              <SearchableSelect
                value={String(selectedPage)}
                onChange={(val) => handleSelectPage(parseInt(val, 10) || 29)}
                options={activeEdition.bundledPages.map((pg) => ({
                  value: String(pg),
                  badgeHe: `עמ׳ ${toHebrewDafNumber(Math.max(2, pg))}`,
                  label: `გვ. ${pg} (עמ׳ ${toHebrewDafNumber(Math.max(2, pg))})`,
                }))}
                isDark={isDark}
                compact
                searchPlaceholder="გვერდი..."
              />
            </div>

            {onToggleAboveDaf && (
              <button
                type="button"
                onClick={onToggleAboveDaf}
                className={`h-7 px-2 rounded-lg border text-[10.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                  showAboveDaf
                    ? 'bg-[#B45309] text-[#FAF5EB] border-amber-300 shadow-xs'
                    : isDark
                      ? 'bg-[#1D130D] border-[#C49A6C]/45 text-[#E8D8BE] hover:bg-[#2E1F14]'
                      : 'bg-[#FAF5EB] border-[#8B5A2B]/45 text-[#5C3A21] hover:bg-[#EFE3CA]'
                }`}
                title="სიდურის საძიებო სარჩევის გახსნა / დახურვა"
              >
                <Search className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">სარჩევი</span>
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};
