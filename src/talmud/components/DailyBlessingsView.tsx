// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  BookOpen,
  CheckCircle2,
  Volume2,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  DAILY_BLESSINGS_DATA,
  BLESSING_CATEGORIES,
  BlessingCategoryId,
  DailyBlessingItem,
} from '../data/dailyBlessingsData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';
import { FullScreenModal } from './FullScreenModal';
import { ReadingLineGuide } from './ReadingLineGuide';
import { WindowsWindowControls } from './WindowsWindowControls';
import { AppLanguage } from './SettingsModal';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';
import { AnalysisMode, SelectedDafTarget, TalmudSentence } from '../types/talmud';
import { normalizeHebrewWord } from '../data/lexicon';
import {
  extractCitationsFromText,
  isSmallRefMarkerToken,
} from '../utils/talmudCitationDetector';

interface DailyBlessingsViewProps {
  isDark: boolean;
  fontSize?: number;
  appLanguage?: AppLanguage;
  selectedBlessingIdx?: number;
  onChangeBlessingIdx?: (idx: number) => void;
  selectedTarget?: SelectedDafTarget | null;
  onSelectWord?: (word: string, contextText: string, sourceTitle: string) => void;
  onSelectWordOrSentence?: (
    word: string,
    sentence: TalmudSentence,
    anchorRect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  onNavigateToTalmudDaf?: (tractateId: string, dafId: string, sectionId?: string) => void;
  onOpenSiddurPdfView?: () => void;
  onOpenFullscreen?: (data: {
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  }) => void;
}

export const DailyBlessingsView: React.FC<DailyBlessingsViewProps> = ({
  isDark,
  fontSize = 18,
  appLanguage = 'ka',
  selectedBlessingIdx = 0,
  onChangeBlessingIdx,
  selectedTarget,
  onSelectWord,
  onSelectWordOrSentence,
  onNavigateToTalmudDaf,
  onOpenSiddurPdfView,
  onOpenFullscreen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BlessingCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlessingId, setSelectedBlessingId] = useState<string>('all');
  const [highlightedWordKey, setHighlightedWordKey] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [isBlessingsFullScreen, setIsBlessingsFullScreen] = useState<boolean>(false);
  const [isTopBarMinimized, setIsTopBarMinimized] = useState<boolean>(false);
  const [isTopBarMaximized, setIsTopBarMaximized] = useState<boolean>(false);
  const [isLineSweepMode, setIsLineSweepMode] = useState<boolean>(false);
  const [showLineGuide, setShowLineGuide] = useState<boolean>(false);
  const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());
  const lastSweepIdRef = useRef<string | null>(null);
  const [dafSyncOffsetY, setDafSyncOffsetY] = useState<number>(0);
  const [showNikud, setShowNikud] = useState<boolean>(() => {
    const saved = localStorage.getItem('talmud_blessings_nikud_v1');
    return saved !== null ? saved === 'true' : true;
  });
  const [localFullscreenData, setLocalFullscreenData] = useState<{
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('talmud_blessings_nikud_v1', String(showNikud));
  }, [showNikud]);

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

  const formatHebrew = (text: string): string =>
    showNikud ? text : text.replace(/[\u0591-\u05C7]/g, '');

  useEffect(() => {
    const catIds = BLESSING_CATEGORIES.map((c) => c.id);
    const onPrev = () => {
      const idx = catIds.indexOf(selectedCategory);
      const nextIdx = idx > 0 ? idx - 1 : catIds.length - 1;
      setSelectedCategory(catIds[nextIdx]);
      setSelectedBlessingId('all');
    };
    const onNext = () => {
      const idx = catIds.indexOf(selectedCategory);
      const nextIdx = idx < catIds.length - 1 ? idx + 1 : 0;
      setSelectedCategory(catIds[nextIdx]);
      setSelectedBlessingId('all');
    };
    window.addEventListener('global-page-prev', onPrev);
    window.addEventListener('global-page-next', onNext);
    return () => {
      window.removeEventListener('global-page-prev', onPrev);
      window.removeEventListener('global-page-next', onNext);
    };
  }, [selectedCategory]);

  const categorySelectOptions: SelectOption[] = useMemo(
    () =>
      BLESSING_CATEGORIES.map((c) => ({
        value: c.id,
        badgeHe: c.labelHe,
        label:
          appLanguage === 'en'
            ? `${c.icon} ${c.labelEn}`
            : appLanguage === 'he'
              ? `${c.icon} ${c.labelHe}`
              : `${c.icon} ${c.labelKa}`,
      })),
    [appLanguage]
  );

  const blessingSelectOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: `כל הברכות (${DAILY_BLESSINGS_DATA.length})`,
        label:
          appLanguage === 'en'
            ? `All Daily Blessings (${DAILY_BLESSINGS_DATA.length})`
            : appLanguage === 'he'
              ? `כל הברכות היומיות (${DAILY_BLESSINGS_DATA.length})`
              : `ყველა ყოველდღიური კურთხევა (${DAILY_BLESSINGS_DATA.length})`,
      },
      ...DAILY_BLESSINGS_DATA.map((b) => ({
        value: b.id,
        badgeHe: b.shortCodeHe,
        label:
          appLanguage === 'en'
            ? b.titleEn
            : appLanguage === 'he'
              ? b.titleHe
              : b.titleKa,
        sublabel: b.examplesKa.join(', '),
      })),
    ],
    [appLanguage]
  );

  const filteredBlessings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DAILY_BLESSINGS_DATA.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedBlessingId !== 'all' && item.id !== selectedBlessingId) return false;
      if (!q) return true;
      return (
        item.titleKa.toLowerCase().includes(q) ||
        item.titleHe.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.transliterationKa.toLowerCase().includes(q) ||
        item.translationKa.toLowerCase().includes(q) ||
        item.whenToSayKa.toLowerCase().includes(q) ||
        item.examplesKa.some((ex) => ex.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, selectedBlessingId, searchQuery]);

  // Quick food/occasion chips for 1-tap lookup
  const quickTriggerChips = [
    { labelKa: '🍞 პური (ჰამოცი)', labelHe: '🍞 לחם (המוציא)', labelEn: '🍞 Bread', q: 'პური' },
    { labelKa: '💧 წყალი / ყავა (შეჰაქოლ)', labelHe: '💧 מים / קפה (שהכל)', labelEn: '💧 Water / Coffee', q: 'წყალი' },
    { labelKa: '🍰 ნამცხვარი / ბრინჯი (მეზონოთ)', labelHe: '🍰 עוגה / אורז (מזונות)', labelEn: '🍰 Cake / Rice', q: 'ნამცხვარი' },
    { labelKa: '🍷 ღვინო (ჰაგაფენ)', labelHe: '🍷 יין (הגפן)', labelEn: '🍷 Wine', q: 'ღვინო' },
    { labelKa: '🍎 ხის ხილი (ჰაყეც)', labelHe: '🍎 פרי העץ', labelEn: '🍎 Tree Fruit', q: 'ვაშლი' },
    { labelKa: '🍌 ბანანი / ბოსტნეული (ჰაადამა)', labelHe: '🍌 בננה / ירקות (האדמה)', labelEn: '🍌 Banana / Veg', q: 'ბანანი' },
    { labelKa: '🙌 აშერ იაცარ (ტუალეტის შემდეგ)', labelHe: '🙌 אשר יצר', labelEn: '🙌 Asher Yatzar', q: 'აშერ იაცარ' },
    { labelKa: '🚗 გზის ლოცვა (თეფილათ ჰადერეხ)', labelHe: '🚗 תפילת הדרך', labelEn: '🚗 Traveler Prayer', q: 'გზა' },
  ];

  const triggerBlessingTranslation = useCallback(
    (item: DailyBlessingItem, anchorEl: HTMLElement, defaultWord: string, mode: AnalysisMode) => {
      if (!onSelectWordOrSentence) return;
      const cleanHeb = item.hebrewText
        .split(/\s+/)
        .filter((tok) => !isSmallRefMarkerToken(tok))
        .join(' ')
        .trim();

      let effectiveHeb = cleanHeb || item.hebrewText;
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
            if (!effectiveHeb.includes(cleanSel)) {
              effectiveHeb = `${effectiveHeb} • [მონიშნული ტექსტი: ${cleanSel}]`;
            }
          }
        }
      }

      const rect = anchorEl.getBoundingClientRect();
      const sent: TalmudSentence = {
        id: `blessing-${item.id}`,
        source: 'gemara',
        dibburHamatchil: `${item.titleHe} • ${item.shortCodeHe}`,
        hebrew: effectiveHeb,
        hebrewText: effectiveHeb,
        translationKa: `${sanitizeGeorgianText(item.translationKa)}\n\nწარმოთქმა: ${sanitizeGeorgianText(item.transliterationKa)}`,
        explanationKa: sanitizeGeorgianText(item.halakhaNoteKa),
      };
      onSelectWordOrSentence(effectiveWord, sent, rect, mode);
    },
    [onSelectWordOrSentence]
  );

  const renderInteractiveHebrewBlessing = (item: DailyBlessingItem) => {
    const displayedHeb = formatHebrew(item.hebrewText);
    const tokens = displayedHeb.split(/\s+/).filter(Boolean);
    const isSentenceSelected = selectedTarget?.sentence?.id === `blessing-${item.id}`;
    return (
      <div
        dir="rtl"
        style={{ fontSize: `${Math.max(19, fontSize + 2)}px`, lineHeight: 1.9 }}
        onMouseEnter={(e) => {
          if (isLineSweepMode && lastSweepIdRef.current !== item.id) {
            lastSweepIdRef.current = item.id;
            const targetEl = e.currentTarget as HTMLElement;
            const firstWord = tokens.find((w) => !isSmallRefMarkerToken(w)) || tokens[0] || '';
            triggerBlessingTranslation(item, targetEl, firstWord, 'sentence-ka');
          }
        }}
        className="font-serif text-right select-text"
      >
        {tokens.map((tok, i) => {
          if (isSmallRefMarkerToken(tok)) {
            return (
              <React.Fragment key={`${item.id}-w-${i}`}>
                <sup className="inline-block text-[0.65em] opacity-55 px-0.5 select-none">
                  {tok}
                </sup>{' '}
              </React.Fragment>
            );
          }
          const wordKey = `${item.id}-w-${i}`;
          const cleaned = normalizeHebrewWord(tok);
          const isWordSelected =
            highlightedWordKey === wordKey ||
            (isSentenceSelected &&
              Boolean(selectedTarget?.cleanWord) &&
              (selectedTarget?.cleanWord === cleaned || selectedTarget?.word === tok));
          const isSacredName =
            tok.includes('יְיָ') ||
            tok.includes('יי') ||
            tok.includes('אֱלֹהֵינוּ') ||
            tok.includes('אלהינו') ||
            tok.includes('בָּרוּךְ') ||
            tok.includes('ברוך') ||
            tok.includes('הָעוֹלָם') ||
            tok.includes('העולם');
          return (
            <React.Fragment key={wordKey}>
              <span
                data-daf-word="true"
                data-active-talmud-word={isWordSelected ? 'true' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  const wordEl = e.currentTarget as HTMLElement;
                  setHighlightedWordKey(wordKey);
                  setHighlightedCardId(item.id);
                  alignActiveWordAndLiftDaf(wordEl);
                  onSelectWord?.(tok, item.hebrewText, `${item.titleKa} (${item.titleHe})`);
                  triggerBlessingTranslation(item, wordEl, tok, 'word-ka');
                }}
                title="დააწკაპუნეთ სიტყვის მოსანიშნად და სრული განმარტების სანახავად"
                className={`inline-block px-1 py-0.5 rounded-md cursor-pointer transition-all ${
                  isWordSelected
                    ? 'bg-amber-400 text-[#1E120A] font-black ring-2 ring-[#5C3A21] shadow-md scale-105'
                    : isSacredName
                      ? isDark
                        ? 'text-amber-300 font-bold hover:bg-amber-500/30'
                        : 'text-[#6B3E1E] font-bold hover:bg-amber-500/25'
                      : 'hover:bg-amber-500/25 hover:text-amber-600 dark:hover:text-amber-300'
                }`}
              >
                {tok}
              </span>{' '}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const handleOpenCardFullscreen = (item: DailyBlessingItem) => {
    const payload = {
      title:
        appLanguage === 'en'
          ? `${item.titleEn} • ${item.titleHe}`
          : appLanguage === 'he'
            ? item.titleHe
            : `${item.titleKa} • ${item.titleHe}`,
      subtitle: `${item.categoryLabelKa} • ${item.shulchanAruchRef}`,
      hebrewText: formatHebrew(item.hebrewText),
      georgianText: `• ქართული ტრანსლიტერაცია (წარმოთქმა):\n${sanitizeGeorgianText(item.transliterationKa)}\n\n• ქართული თარგმანი:\n${sanitizeGeorgianText(item.translationKa)}\n\n• როდის ითქმება:\n${sanitizeGeorgianText(item.whenToSayKa)}\n\n• ჰალახური წესი (შულხან ყარუხი და ფოსკიმები):\n${sanitizeGeorgianText(item.halakhaNoteKa)}`,
    };
    if (onOpenFullscreen) {
      onOpenFullscreen(payload);
    } else {
      setLocalFullscreenData(payload);
    }
  };

  const handleSpeakHebrew = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'he-IL';
        utter.rate = 0.88;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={
        isBlessingsFullScreen
          ? `fixed inset-0 z-[150] w-screen h-[100dvh] m-0 p-2 sm:p-4 overflow-y-auto overflow-x-hidden space-y-4 ${
              isDark ? 'bg-[#120B07] text-[#FAF5EB]' : 'bg-[#FAF4E4] text-[#21140B]'
            }`
          : 'w-full max-w-[1680px] mx-auto px-2 sm:px-4 py-3 space-y-4 overflow-x-hidden'
      }
    >
      {/* UNIVERSAL DAF NAVIGATION BAR — DAILY BLESSINGS */}
      <div
        className={`${
          isTopBarMaximized ? 'fixed inset-2 z-[165] overflow-y-auto' : ''
        } px-3 py-2 rounded-2xl border shadow-sm ${
          isDark
            ? 'bg-[#2A1D15] border-[#C49A6C]/45 text-[#FAF5EB]'
            : 'bg-[#EADBC1] border-[#6E472B]/50 text-[#1E130A]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Prev/Next Category, Category Select, Blessing Select, Search */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                const catIds = BLESSING_CATEGORIES.map((c) => c.id);
                const idx = catIds.indexOf(selectedCategory);
                const nextIdx = idx > 0 ? idx - 1 : catIds.length - 1;
                setSelectedCategory(catIds[nextIdx]);
                setSelectedBlessingId('all');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
              title="წინა კატეგორია"
            >
              ◀ წინა
            </button>

            {/* Category Dropdown */}
            <div className="w-[170px] sm:w-[210px] min-w-0">
              <SearchableSelect
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val as BlessingCategoryId);
                  setSelectedBlessingId('all');
                }}
                options={BLESSING_CATEGORIES.map((c) => ({
                  value: c.id,
                  badgeHe: c.labelHe,
                  label: `${c.icon} ${c.labelHe} • ${c.labelKa}`,
                }))}
                isDark={isDark}
                compact
                searchPlaceholder="კატეგორია..."
              />
            </div>

            {/* Specific Blessing Dropdown */}
            <div className="w-[180px] sm:w-[225px] min-w-0">
              <SearchableSelect
                value={selectedBlessingId}
                onChange={(val) => setSelectedBlessingId(val)}
                options={[
                  {
                    value: 'all',
                    badgeHe: 'הכל',
                    label: `ყველა კურთხევა (${DAILY_BLESSINGS_DATA.length})`,
                  },
                  ...DAILY_BLESSINGS_DATA.map((b) => ({
                    value: b.id,
                    badgeHe: b.shortCodeHe,
                    label: `${b.shortCodeHe} • ${b.titleKa}`,
                  })),
                ]}
                isDark={isDark}
                compact
                searchPlaceholder="კურთხევა..."
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const catIds = BLESSING_CATEGORIES.map((c) => c.id);
                const idx = catIds.indexOf(selectedCategory);
                const nextIdx = idx < catIds.length - 1 ? idx + 1 : 0;
                setSelectedCategory(catIds[nextIdx]);
                setSelectedBlessingId('all');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
              title="შემდეგი კატეგორია"
            >
              შემდეგი ▶
            </button>

            {/* Compact Instant Search */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                isDark
                  ? 'bg-[#1D130C] border-[#C49A6C]/55 text-[#FAF5EB]'
                  : 'bg-[#FAF3E3] border-[#8B5A2B]/60 text-[#1E130A]'
              }`}
            >
              <Search className="w-3 h-3 opacity-65 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძიება (პური, წყალი, გზა)..."
                className="w-32 sm:w-40 bg-transparent text-[11px] font-bold outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded hover:bg-black/10 cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <VoiceSearchMicButton
                onTranscript={(text) => setSearchQuery(text)}
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>

          {/* Right: Reading Tools & Siddur PDF Link */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsLineSweepMode((v) => {
                  const next = !v;
                  lastSweepIdRef.current = null;
                  return next;
                });
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                isLineSweepMode
                  ? 'bg-amber-500 text-[#1F1209] border-amber-300 shadow-sm'
                  : 'bg-[#5C3A21] text-[#FAF5EB] border-[#C49A6C]/50'
              }`}
              title="სტრიქონზე გადატარებით თარგმნა"
            >
              🪄 სტრიქონი
            </button>

            <button
              type="button"
              onClick={() => setShowNikud((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                showNikud
                  ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                  : 'bg-[#5C3A21]/40 text-[#FAF5EB] border-[#C49A6C]/45'
              }`}
            >
              ניקוד
            </button>

            {onOpenSiddurPdfView && (
              <button
                type="button"
                onClick={onOpenSiddurPdfView}
                className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-amber-400/80 bg-[#5C3A21] text-amber-200 flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all"
              >
                <BookOpen className="w-3 h-3 text-amber-300 shrink-0" />
                <span>סידור PDF</span>
              </button>
            )}

            <WindowsWindowControls
              isMinimized={isTopBarMinimized}
              onToggleMinimize={() => setIsTopBarMinimized((v) => !v)}
              isMaximized={isTopBarMaximized}
              onToggleMaximize={() => setIsTopBarMaximized((v) => !v)}
              isFullScreen={isBlessingsFullScreen}
              onToggleFullScreen={() => {
                setIsBlessingsFullScreen((v) => {
                  const next = !v;
                  if (!next) {
                    setIsLineSweepMode(false);
                    lastSweepIdRef.current = null;
                  }
                  return next;
                });
              }}
              isDark={isDark}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Blessings Symmetrical Card Grid */}
      <div
        id="talmud-daf-folio-anchor"
        style={{
          transform: dafSyncOffsetY !== 0 && !isBlessingsFullScreen ? `translateY(${dafSyncOffsetY}px)` : undefined,
          transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="relative grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {showLineGuide && (
          <ReadingLineGuide
            initialY={110}
            isDarkField={isDark}
            fieldLabel="ყოველდღიური კურთხევები"
          />
        )}
        {filteredBlessings.map((item, idx) => {
          const isCardHighlighted =
            highlightedCardId === item.id || selectedBlessingIdx === idx;
          const isCollapsed = collapsedCardIds.has(item.id);
          const citations = extractCitationsFromText(
            `${item.shulchanAruchRef} ${item.hebrewText}`,
            `${item.halakhaNoteKa} ${item.shulchanAruchRef}`,
            'berakhot'
          );
          return (
            <div
              key={item.id}
              onClick={() => {
                setHighlightedCardId(item.id);
                onChangeBlessingIdx?.(idx);
              }}
              className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                isCardHighlighted
                  ? isDark
                    ? 'bg-[#261910] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.22)]'
                    : 'bg-[#FFFDF7] border-[#5C3A21] shadow-lg ring-2 ring-amber-400/50'
                  : isDark
                    ? 'bg-[#1D140D]/95 border-[#5C3A21] hover:border-[#C49A6C]'
                    : 'bg-[#FBF5E8] border-[#8B5A2B]/50 hover:border-[#5C3A21] shadow-sm'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#8B5A2B]/30 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#5C3A21] text-[#FAF5EB]">
                        {appLanguage === 'en'
                          ? item.categoryLabelEn
                          : appLanguage === 'he'
                            ? item.categoryLabelHe
                            : item.categoryLabelKa}
                      </span>
                      <span
                        dir="rtl"
                        className="px-2 py-0.5 rounded-lg text-xs font-serif font-bold bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300"
                      >
                        {item.shortCodeHe}
                      </span>
                      <span className="text-[10.5px] font-serif opacity-75">
                        {item.shulchanAruchRef}
                      </span>
                      {citations.slice(0, 2).map((cit) => {
                        const tapKey = `${item.id}-${cit.id}`;
                        const isTapped = highlightedWordKey === tapKey;
                        return (
                          <span
                            key={tapKey}
                            className="inline-flex items-center gap-1"
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isTapped) {
                                  if (cit.tractateId && cit.dafId && onNavigateToTalmudDaf) {
                                    onNavigateToTalmudDaf(
                                      cit.tractateId,
                                      cit.dafId,
                                      cit.sectionId || 'daf-section-gemara'
                                    );
                                  }
                                } else {
                                  setHighlightedWordKey(tapKey);
                                }
                              }}
                              className={`text-[10.5px] font-extrabold cursor-pointer transition-colors ${
                                isTapped
                                  ? 'text-emerald-800 dark:text-emerald-300 underline decoration-emerald-500 decoration-2'
                                  : 'text-[#047857] dark:text-emerald-400 hover:text-emerald-500'
                              }`}
                            >
                              {cit.labelKa}
                            </span>
                            {isTapped && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cit.tractateId && cit.dafId && onNavigateToTalmudDaf) {
                                    onNavigateToTalmudDaf(
                                      cit.tractateId,
                                      cit.dafId,
                                      cit.sectionId || 'daf-section-gemara'
                                    );
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white border border-emerald-300 text-[10px] font-extrabold cursor-pointer shadow-sm"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span>↗ გადასვლა: {cit.labelKa}</span>
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <h3 className="text-sm sm:text-base font-black leading-snug">
                      {appLanguage === 'en'
                        ? item.titleEn
                        : appLanguage === 'he'
                          ? item.titleHe
                          : sanitizeGeorgianText(item.titleKa)}
                    </h3>
                    <div
                      dir="rtl"
                      className="font-serif text-xs sm:text-sm font-bold text-[#C49A6C]"
                    >
                      {item.titleHe}
                    </div>
                  </div>

                  {/* Action Buttons: Speak + WindowsWindowControls */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakHebrew(item.hebrewText);
                      }}
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        isDark
                          ? 'bg-[#2C1D13] border-[#C49A6C]/50 text-[#FAF5EB] hover:bg-[#3B271A]'
                          : 'bg-[#FAF5EB] border-[#6E472B]/50 text-[#21140B] hover:bg-white'
                      }`}
                      title="ებრაული კურთხევის მოსმენა"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <WindowsWindowControls
                      isMinimized={isCollapsed}
                      onToggleMinimize={() => {
                        setCollapsedCardIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      isMaximized={false}
                      onToggleMaximize={() => handleOpenCardFullscreen(item)}
                      isFullScreen={false}
                      onToggleFullScreen={() => handleOpenCardFullscreen(item)}
                      isDark={isDark}
                      size="sm"
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-3 overflow-hidden"
                    >
                      {/* When to Say & Examples */}
                      <div
                        className={`p-2.5 rounded-xl border text-xs ${
                          isDark
                            ? 'bg-[#281A11]/80 border-[#5C3A21] text-[#E8D8BE]'
                            : 'bg-[#EFE3C9]/80 border-[#8B5A2B]/35 text-[#2B1A0E]'
                        }`}
                      >
                        <div className="font-bold">
                          {appLanguage === 'en' ? item.whenToSayEn : sanitizeGeorgianText(item.whenToSayKa)}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.examplesKa.map((ex) => (
                            <span
                              key={ex}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                isDark
                                  ? 'bg-[#1A110B] text-[#C49A6C] border border-[#5C3A21]'
                                  : 'bg-[#FAF5EB] text-[#4A2E1B] border border-[#8B5A2B]/35'
                              }`}
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Vocalized Hebrew Blessing Text (Interactive Word-by-Word) */}
                      <div
                        className={`p-3.5 rounded-xl border-2 ${
                          isDark
                            ? 'bg-[#170F0A] border-[#C49A6C]/55 text-[#FAF5EB]'
                            : 'bg-[#FFFDF9] border-[#6E472B]/55 text-[#1E120A]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider opacity-75 mb-1">
                          <span>
                            {appLanguage === 'en'
                              ? 'Hebrew Text • נוסח הברכה:'
                              : appLanguage === 'he'
                                ? 'נוסח הברכה המנוקד:'
                                : 'ებრაული ტექსტი • נוסח הברכה:'}
                          </span>
                          <BookOpen className="w-3.5 h-3.5 text-[#C49A6C]" />
                        </div>
                        {renderInteractiveHebrewBlessing(item)}
                      </div>

                      {/* Georgian Transliteration Box */}
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-[#2B1C12] border-amber-500/40 text-amber-100'
                            : 'bg-[#F5E8CE] border-[#6B4226]/45 text-[#21140B]'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#C49A6C] mb-1">
                          🗣️ ქართული ტრანსლიტერაცია (ზუსტი წარმოთქმა):
                        </div>
                        <div
                          style={{ fontSize: `${Math.max(13, fontSize - 2)}px` }}
                          className="font-extrabold leading-relaxed"
                        >
                          {sanitizeGeorgianText(item.transliterationKa)}
                        </div>
                      </div>

                      {/* Translation Box */}
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-[#1F140D] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-[#FAF5EB] border-[#8B5A2B]/35 text-[#21140B]'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#C49A6C] mb-1">
                          📖 {appLanguage === 'en' ? 'Meaning / Translation:' : 'შინაარსი და თარგმანი:'}
                        </div>
                        <div
                          style={{ fontSize: `${Math.max(13, fontSize - 2)}px` }}
                          className="leading-relaxed font-medium"
                        >
                          {appLanguage === 'en'
                            ? item.translationEn
                            : sanitizeGeorgianText(item.translationKa)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Practical Halakha Footer */}
              <div
                className={`p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                  isDark
                    ? 'bg-[#24180F] border-[#C49A6C]/40 text-[#E8D8BE]'
                    : 'bg-[#EBE0C8] border-[#6E472B]/40 text-[#2B1A0E]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-[#C49A6C]">ჰალახა: </span>
                  {sanitizeGeorgianText(item.halakhaNoteKa)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {localFullscreenData && (
        <FullScreenModal
          isOpen={Boolean(localFullscreenData)}
          onClose={() => setLocalFullscreenData(null)}
          title={localFullscreenData.title}
          subtitle={localFullscreenData.subtitle}
          hebrewText={localFullscreenData.hebrewText}
          georgianText={localFullscreenData.georgianText}
          isDark={isDark}
        />
      )}
    </div>
  );
};
