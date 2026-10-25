// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  BookOpen,
  Sparkles,
  Search,
  Maximize2,
  ArrowUpRight,
  CheckCircle2,
  Columns,
  Award,
  Download,
  Smartphone,
  Archive,
  ChevronDown,
  ChevronUp,
  Volume2,
  X,
} from 'lucide-react';
import { DafPageData } from '../types/talmud';
import {
  POSEK_AUTHORITY_PROFILES,
  COMPARATIVE_POSKIM_TOPICS,
  PosekAuthorityProfile,
} from '../data/poskimHalachaGridData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { FullScreenModal } from './FullScreenModal';
import { ReadingLineGuide } from './ReadingLineGuide';
import { WindowsWindowControls, CrystalDiamondJumpButton } from './WindowsWindowControls';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';
import { extractCitationsFromText, DetectedSacredCitation } from '../utils/talmudCitationDetector';

function speakHebrewText(text: string) {
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
}

function stripFootnoteAndReferenceMarkers(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ' ')
    .replace(/<i[^>]*class=["'][^"']*footnote[^"']*["'][^>]*>[\s\S]*?<\/i>/gi, ' ')
    .replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]+/g, ' ')
    .replace(/[*†‡§¶]+/g, ' ')
    .replace(/\[(?:\d+|[א-ת]{1,2}|[a-zA-Z])\]/g, ' ')
    .replace(/\((?:\d+|[א-ת]{1,2})\)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface PoskimHalachaMasterGridProps {
  dafData?: DafPageData;
  dafId?: string;
  tractateNameHe: string;
  tractateNameKa: string;
  isDark: boolean;
  onHighlightSentence?: (sentenceId: string | null) => void;
  onNavigateToDaf?: (tractateId: string, dafId: string) => void;
  onOpenFullscreen?: (data: {
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  }) => void;
  compactOnDaf?: boolean;
}

export const PoskimHalachaMasterGrid: React.FC<PoskimHalachaMasterGridProps> = ({
  dafData,
  dafId,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onHighlightSentence,
  onNavigateToDaf,
  onOpenFullscreen,
  compactOnDaf = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'matrix' | 'live-daf'>('grid');
  const [traditionFilter, setTraditionFilter] = useState<'all' | 'sephardic' | 'ashkenazi'>('all');
  const [selectedPosekId, setSelectedPosekId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [showNikud, setShowNikud] = useState<boolean>(true);
  const [isLineSweepMode, setIsLineSweepMode] = useState<boolean>(false);
  const [collapsedPosekIds, setCollapsedPosekIds] = useState<Record<string, boolean>>({});
  const [tappedCiteKey, setTappedCiteKey] = useState<string | null>(null);
  const [tappedCiteRect, setTappedCiteRect] = useState<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null>(null);
  const [isGridMinimized, setIsGridMinimized] = useState<boolean>(false);
  const [isGridMaximized, setIsGridMaximized] = useState<boolean>(false);
  const [activeLineTranslation, setActiveLineTranslation] = useState<{
    id: string;
    titleKa: string;
    hebrewLine: string;
    georgianTranslation: string;
    isLoading?: boolean;
  } | null>(null);
  const lastTranslatedLineKeyRef = useRef<string>('');
  const [localFullscreen, setLocalFullscreen] = useState<{
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  } | null>(null);

  const togglePosekCollapse = useCallback((id: string) => {
    setCollapsedPosekIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const triggerLineTranslation = useCallback(
    async (id: string, titleKa: string, hebrewText: string, fallbackKa: string) => {
      const cleanedLine = stripFootnoteAndReferenceMarkers(hebrewText);
      if (!cleanedLine) return;

      const cacheKey = `${id}::${cleanedLine}`;
      if (lastTranslatedLineKeyRef.current === cacheKey) return;
      lastTranslatedLineKeyRef.current = cacheKey;

      setActiveLineTranslation({
        id,
        titleKa,
        hebrewLine: cleanedLine,
        georgianTranslation: sanitizeGeorgianText(fallbackKa) || 'მიმდინარეობს სტრიქონის ზუსტი თარგმნა...',
        isLoading: true,
      });

      try {
        const res = await fetch('/api/translate/georgian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedLine,
            sourceLang: 'he',
            context: `Halacha Posek Ruling (${titleKa}) — translate ONLY the provided Hebrew/Aramaic text accurately into natural Georgian, ignoring footnote markers.`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.translation) {
            setActiveLineTranslation((prev) =>
              prev && prev.hebrewLine === cleanedLine
                ? {
                    ...prev,
                    georgianTranslation: sanitizeGeorgianText(data.translation),
                    isLoading: false,
                  }
                : prev
            );
            return;
          }
        }
      } catch {
        // fallback
      }
      setActiveLineTranslation((prev) =>
        prev && prev.hebrewLine === cleanedLine ? { ...prev, isLoading: false } : prev
      );
    },
    []
  );

  // Merge user text selection with active line translation when line-sweep mode is enabled
  useEffect(() => {
    if (!isLineSweepMode) return;
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const rawSelected = sel ? sel.toString().trim() : '';
      if (!rawSelected || rawSelected.length < 2) return;
      const cleanedSelected = stripFootnoteAndReferenceMarkers(rawSelected);
      if (!cleanedSelected) return;

      setActiveLineTranslation((prev) => {
        const combinedHebrew =
          prev?.hebrewLine && !cleanedSelected.includes(prev.hebrewLine)
            ? `${prev.hebrewLine} • ${cleanedSelected}`
            : cleanedSelected;
        const id = prev?.id || 'poskim-selection';
        const titleKa = prev?.titleKa || 'მონიშნული ჰალახური ფრაგმენტი';
        setTimeout(() => {
          triggerLineTranslation(id, titleKa, combinedHebrew, prev?.georgianTranslation || '');
        }, 10);
        return prev;
      });
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isLineSweepMode, triggerLineTranslation]);

  const formatHebrewWithNikudOption = (text: string) =>
    showNikud ? text : text.replace(/[\u0591-\u05C7]/g, '');

  const posekSelectOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: `כל הפוסקים (${POSEK_AUTHORITY_PROFILES.length})`,
        label: `ყველა ფოსეკი — სეფარადული და აშკენაზური ბადე (${POSEK_AUTHORITY_PROFILES.length})`,
      },
      ...POSEK_AUTHORITY_PROFILES.map((p) => ({
        value: p.id,
        badgeHe: p.tradition === 'sephardic' ? 'ספרד' : 'אשכנז',
        label: `${p.nameKa} — ${p.magnumOpusKa.split('•')[0].trim()}`,
        sublabel: `${p.nameHe} (${p.years})`,
      })),
    ],
    []
  );

  const topicSelectOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: 'כל הנושאים',
        label: `ყველა შედარებითი ჰალახური საკითხი (${COMPARATIVE_POSKIM_TOPICS.length})`,
      },
      ...COMPARATIVE_POSKIM_TOPICS.map((t) => ({
        value: t.id,
        badgeHe: t.sugyaRefHe,
        label: t.topicKa,
        sublabel: t.shulchanAruchRef,
      })),
    ],
    []
  );

  const filteredPoskim = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return POSEK_AUTHORITY_PROFILES.filter((p) => {
      if (traditionFilter !== 'all' && p.tradition !== traditionFilter) return false;
      if (selectedPosekId !== 'all' && p.id !== selectedPosekId) return false;
      if (!q) return true;
      return (
        p.nameKa.toLowerCase().includes(q) ||
        p.nameHe.toLowerCase().includes(q) ||
        p.magnumOpusKa.toLowerCase().includes(q) ||
        p.magnumOpusHe.toLowerCase().includes(q) ||
        p.methodologyKa.toLowerCase().includes(q) ||
        p.cityKa.toLowerCase().includes(q)
      );
    });
  }, [traditionFilter, selectedPosekId, searchQuery]);

  const sephardicCount = POSEK_AUTHORITY_PROFILES.filter((p) => p.tradition === 'sephardic').length;
  const ashkenaziCount = POSEK_AUTHORITY_PROFILES.filter((p) => p.tradition === 'ashkenazi').length;

  const effectiveDafId = dafData?.dafId || dafId || '2a';
  const firstGemaraSentence = dafData?.gemara?.[0] || dafData?.mishnah?.[0];
  const firstGemaraSnippetHe = firstGemaraSentence?.hebrewText || '';
  const firstGemaraSnippetKa = sanitizeGeorgianText(firstGemaraSentence?.translationKa || '');

  const handleOpenPosekFullscreen = (posek: PosekAuthorityProfile) => {
    const payload = {
      title: `${posek.nameKa} (${posek.years})`,
      subtitle: `${posek.titleKa} • ${posek.cityKa}`,
      hebrewText: formatHebrewWithNikudOption(
        `${posek.nameHe}\nחיבורו המרכזי: ${posek.magnumOpusHe}\nכלל פסיקה: ${posek.keyRuleHe}\n\nפסק בסוגיה (${tractateNameHe} ${effectiveDafId}):\n${posek.rulingOnCurrentSugyaHe}`
      ),
      georgianText: `• ტრადიცია: ${posek.traditionLabelKa}\n• მთავარი ნაშრომები: ${posek.magnumOpusKa}\n• სხვა თხზულებები: ${posek.otherWorksKa.join(', ')}\n\n• ჰალახური მეთოდოლოგია:\n${posek.methodologyKa}\n\n• ოქროს ჰალახური წესი:\n${posek.keyRuleKa}\n\n• გადაწყვეტილება მიმდინარე სუგიაზე (${tractateNameKa} ${effectiveDafId}):\n${posek.rulingOnCurrentSugyaKa}`,
    };
    if (onOpenFullscreen) {
      onOpenFullscreen(payload);
    } else {
      setLocalFullscreen(payload);
    }
  };

  return (
    <div
      className={
        isGridMaximized
          ? `fixed inset-2 z-[265] overflow-y-auto rounded-2xl border-2 p-4 sm:p-6 shadow-2xl space-y-3.5 ${
              isDark ? 'bg-[#18100A] border-[#C49A6C] text-[#FAF5EB]' : 'bg-[#F8EFE0] border-[#6B4226] text-[#21150C]'
            }`
          : 'space-y-3.5'
      }
    >
      {/* Header Banner */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-[#23160E] via-[#1B110B] to-[#2B1B10] border-[#C49A6C]/55 text-[#FAF5EB]'
            : 'bg-gradient-to-br from-[#FFFDF8] via-[#F4E9D5] to-[#E8D7B9] border-[#6B4226]/55 text-[#21150C]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#C49A6C] to-[#6B4226] text-[#FAF5EB] shadow-md shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-sm font-black tracking-tight leading-snug">
                ბოლო ეპოქის ჰალახის კანონმდებელთა ძლიერი ბადე
                <span dir="rtl" className="font-serif"> • פוסקי הדורות האחרונים (ספרד ואשכנז)</span>
              </h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#6B4226] text-[#FAF5EB] border border-[#C49A6C]/50">
                {POSEK_AUTHORITY_PROFILES.length} უმაღლესი ფოსეკი
              </span>
              <p className="text-[10px] sm:text-[11px] opacity-75 leading-relaxed mt-1.5 line-clamp-3">
                რავ ყოვადია იოსეფი • რავ ბენ ციონ აბა შაული • ბენ იშ ხაი • ქაფ ჰახაიმი • რავ მოშე ლევი • მიშნა ბრურა • რავ ოირბახი • რავ განცფრიდი/გრენცფილდი • რავ მოშე ფაინშტეინი • ხაზონ იში და სხვ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsLineSweepMode((v) => {
                  const next = !v;
                  if (!next) setActiveLineTranslation(null);
                  return next;
                });
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                isLineSweepMode
                  ? 'bg-emerald-800 text-white border-emerald-400 shadow-sm'
                  : isDark
                    ? 'bg-[#2B1B10] border-[#C49A6C]/50 text-[#EED9B9]'
                    : 'bg-[#FBF7F0] border-[#6B4226]/50 text-[#3B2313]'
              }`}
              title="სტრიქონის მონიშვნისა და თარგმნის რეჟიმი"
            >
              <span>📏 სტრიქონის თარგმნა: {isLineSweepMode ? 'ჩართ.' : 'გამორთ.'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNikud((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                showNikud
                  ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                  : isDark
                    ? 'bg-[#2B1B10] border-[#C49A6C]/50 text-[#EED9B9]'
                    : 'bg-[#FBF7F0] border-[#6B4226]/50 text-[#3B2313]'
              }`}
              title="ნიკუდის (ניקוד) ჩართვა / გამორთვა"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EED9B9]" />
              <span>ניקוד / ნიკუდი: {showNikud ? 'ჩართ.' : 'გამორთ.'}</span>
            </button>
            <WindowsWindowControls
              isMinimized={isGridMinimized}
              onToggleMinimize={() => setIsGridMinimized((v) => !v)}
              isMaximized={isGridMaximized}
              onToggleMaximize={() => {
                setIsGridMinimized(false);
                setIsGridMaximized((v) => !v);
              }}
              isDark={isDark}
              size="sm"
            />
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-3">
          {[
            {
              id: 'grid' as const,
              label: `1. ფოსკიმების სრული ბადე (${POSEK_AUTHORITY_PROFILES.length})`,
              badgeHe: 'פוסקי ספרד ואשכנז',
            },
            {
              id: 'matrix' as const,
              label: '2. სეფარადული vs აშკენაზური მატრიცა',
              badgeHe: 'טבלת השוואה',
            },
            {
              id: 'live-daf' as const,
              label: `3. დაფის (${tractateNameKa} ${effectiveDafId}) ფსაკი`,
              badgeHe: 'הלכה למעשה בדף',
            },
          ].map((tab) => {
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  active
                    ? 'bg-[#6B4226] text-[#FAF5EB] border-[#EED9B9] shadow-md'
                    : isDark
                      ? 'bg-[#1A110B]/85 border-[#5C3A21] text-[#EED9B9] hover:border-[#C49A6C]'
                      : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
                }`}
              >
                <span className="min-w-0 flex-1 text-left leading-snug">{tab.label}</span>
                <span dir="rtl" className="text-[10px] font-serif opacity-85 shrink-0">
                  {tab.badgeHe}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar for Grid Mode */}
        {viewMode === 'grid' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  id: 'all' as const,
                  label: `ყველა (${POSEK_AUTHORITY_PROFILES.length})`,
                  he: 'כל הפוסקים',
                },
                {
                  id: 'sephardic' as const,
                  label: `სეფარადული (${sephardicCount})`,
                  he: 'פוסקי ספרד',
                },
                {
                  id: 'ashkenazi' as const,
                  label: `აშკენაზური (${ashkenaziCount})`,
                  he: 'פוסקי אשכנז',
                },
              ].map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => {
                    setTraditionFilter(tr.id);
                    setSelectedPosekId('all');
                  }}
                  className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    traditionFilter === tr.id
                      ? 'bg-[#5C3A21] text-[#FAF5EB] border-[#C49A6C] shadow-sm'
                      : isDark
                        ? 'bg-[#1D130D] border-[#5C3A21] text-[#EED9B9]'
                        : 'bg-[#EFE5D0] border-[#8B5A2B]/35 text-[#2C1A10]'
                  }`}
                >
                  <span>{tr.label}</span>
                  <span dir="rtl" className="pill-hebrew-optional font-serif text-[10px] opacity-80">
                    ({tr.he})
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SearchableSelect
                label="ფოსეკის / კანონმდებლის არჩევა (გაფილტვრით):"
                options={posekSelectOptions}
                value={selectedPosekId}
                onChange={setSelectedPosekId}
                placeholder="მოძებნეთ: ყოვადია იოსეფი, აბა შაული, ბენ იშ ხაი, მიშნა ბრურა, ოირბახი..."
                isDark={isDark}
                compact
              />

              <div>
                <div className="text-[11px] font-bold mb-1 opacity-80">
                  სწრაფი ძიება სახელით, წიგნით ან ქალაქით:
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="მაგ: იაბია ომერი, ორ ლეციონი, მენუხათ აჰავა, იგროთ მოშე, გრენცფილდი..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isDark
                        ? 'bg-[#17100B] border-[#5C3A21] text-[#FAF5EB] focus:border-[#C49A6C]'
                        : 'bg-white border-[#8B5A2B]/45 text-[#2C1A10] focus:border-[#6B4226]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW MODE 1: POSKIM MASTER GRID (CARDS FOR ALL SEPHARDIC & ASHKENAZI) */}
      {/* ===================================================================== */}
      {viewMode === 'grid' && (
        <div
          className={`grid grid-cols-1 ${
            compactOnDaf ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
          } gap-3`}
        >
          {filteredPoskim.map((posek) => {
            const isSephardic = posek.tradition === 'sephardic';
            const isCollapsed = Boolean(collapsedPosekIds[posek.id]);
            const citations = extractCitationsFromText(
              `${posek.rulingOnCurrentSugyaHe} ${posek.rulingOnCurrentSugyaKa} ${posek.keyRuleHe}`,
              dafData?.tractateId || 'berakhot'
            );
            return (
              <motion.div
                key={posek.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
                onMouseEnter={() => {
                  if (isLineSweepMode) {
                    triggerLineTranslation(
                      posek.id,
                      posek.nameKa,
                      `${posek.keyRuleHe} • ${posek.rulingOnCurrentSugyaHe}`,
                      `${posek.keyRuleKa} — ${posek.rulingOnCurrentSugyaKa}`
                    );
                  }
                }}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                  isDark
                    ? 'bg-gradient-to-b from-[#23170F]/95 to-[#18100A]/95 border-[#5C3A21] hover:border-[#C49A6C]/80 shadow-md'
                    : 'bg-gradient-to-b from-[#FFFDF9] to-[#F3E8D2] border-[#8B5A2B]/45 hover:border-[#6B4226] shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Row: Tradition Pill + Years + Fullscreen + Collapse */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${
                        isSephardic
                          ? isDark
                            ? 'bg-amber-900/40 border-amber-400/60 text-amber-200'
                            : 'bg-amber-100 border-amber-700/40 text-amber-950'
                          : isDark
                            ? 'bg-sky-900/40 border-sky-400/60 text-sky-200'
                            : 'bg-sky-100 border-sky-700/40 text-sky-950'
                      }`}
                    >
                      {isSephardic ? '🕍 სეფარადული (ספרד)' : '📜 აშკენაზური (אשכנז)'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono font-bold opacity-75">
                        {posek.years} • {posek.cityKa}
                      </span>
                      <WindowsWindowControls
                        isMinimized={isCollapsed}
                        onToggleMinimize={() => togglePosekCollapse(posek.id)}
                        isMaximized={false}
                        onToggleMaximize={() => handleOpenPosekFullscreen(posek)}
                        isDark={isDark}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Posek Name (Georgian + Hebrew) */}
                  <div
                    onClick={() => togglePosekCollapse(posek.id)}
                    className="border-b border-[#8B5A2B]/25 pb-2 cursor-pointer"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h4
                        className={`text-sm sm:text-base font-black ${
                          isDark ? 'text-[#FAF5EB]' : 'text-[#2C1A10]'
                        }`}
                      >
                        {posek.nameKa}
                      </h4>
                      <span
                        dir="rtl"
                        className={`font-serif text-sm sm:text-base font-bold ${
                          isDark ? 'text-[#EED9B9]' : 'text-[#5C3A21]'
                        }`}
                      >
                        {posek.nameHe}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold opacity-80 mt-0.5">{posek.titleKa}</div>
                  </div>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        key="posek-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden space-y-2"
                      >
                        {/* Magnum Opus Box */}
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isDark
                              ? 'bg-[#160F0A]/90 border-[#5C3A21]'
                              : 'bg-[#EDE1C9]/80 border-[#8B5A2B]/35'
                          }`}
                        >
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C49A6C] mb-0.5">
                            მთავარი კოდექსი / რესპონსა (חיבורו המרכזי):
                          </div>
                          <div className="text-xs font-extrabold">{posek.magnumOpusKa}</div>
                          <div dir="rtl" className="text-xs font-serif font-bold opacity-90 mt-0.5">
                            {formatHebrewWithNikudOption(posek.magnumOpusHe)}
                          </div>
                        </div>

                        {/* Methodology */}
                        <div className="text-xs leading-relaxed">
                          <span className="font-extrabold text-[#C49A6C]">მეთოდოლოგია: </span>
                          {posek.methodologyKa}
                        </div>

                        {/* Key Halakhic Principle */}
                        <div
                          className={`p-2 rounded-xl border text-[11px] ${
                            isDark
                              ? 'bg-[#2B1B10]/70 border-[#C49A6C]/35 text-[#EED9B9]'
                              : 'bg-[#F8EFE0] border-[#8B5A2B]/35 text-[#3B2313]'
                          }`}
                        >
                          <div className="font-extrabold mb-0.5">⚖️ ოქროს ჰალახური პრინციპი:</div>
                          <div>{posek.keyRuleKa}</div>
                          <div dir="rtl" className="font-serif font-bold text-xs mt-0.5 opacity-90">
                            {formatHebrewWithNikudOption(posek.keyRuleHe)}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ruling on Current Daf Sugya Footer */}
                <div
                  className={`p-2.5 rounded-xl border space-y-1.5 ${
                    isDark
                      ? 'bg-[#26180F] border-[#C49A6C]/45'
                      : 'bg-[#E9DBC0] border-[#6B4226]/45'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#C49A6C]">
                      ფსაკი დაფის სუგიაზე ({tractateNameKa} {effectiveDafId}):
                    </span>
                    {onHighlightSentence && firstGemaraSentence && (
                      <button
                        type="button"
                        onClick={() => onHighlightSentence(firstGemaraSentence.id)}
                        className="px-2 py-0.5 rounded-md bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>დაფზე ჩვენება</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] leading-snug font-medium">
                    {posek.rulingOnCurrentSugyaKa}
                  </div>
                  <div dir="rtl" className="font-serif text-xs font-bold opacity-85">
                    {formatHebrewWithNikudOption(posek.rulingOnCurrentSugyaHe)}
                  </div>

                  {citations.length > 0 && onNavigateToDaf && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[10px] font-bold opacity-75">წყარო:</span>
                      {citations.map((cit: DetectedSacredCitation, cIdx: number) => {
                        const citeKey = `${posek.id}-${cit.tractateId}-${cit.dafId}-${cIdx}`;
                        const isTapped = tappedCiteKey === citeKey;
                        return (
                          <span
                            key={citeKey}
                            className="inline-flex items-center gap-1"
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (isTapped) {
                                  setTappedCiteKey(null);
                                  setTappedCiteRect(null);
                                  if (cit.tractateId !== '__CURRENT__') {
                                    onNavigateToDaf(cit.tractateId, cit.dafId);
                                  }
                                } else {
                                  setTappedCiteKey(citeKey);
                                  setTappedCiteRect({
                                    left: rect.left,
                                    top: rect.top,
                                    right: rect.right,
                                    bottom: rect.bottom,
                                    width: rect.width,
                                    height: rect.height,
                                  });
                                }
                              }}
                              className={`text-[10.5px] font-extrabold cursor-pointer transition-colors ${
                                isTapped
                                  ? 'text-[#0E3299] dark:text-[#93C5FD] underline decoration-[#1545C8] decoration-2'
                                  : 'text-[#1545C8] dark:text-[#60A5FA] hover:text-[#0E3299]'
                              }`}
                            >
                              {cit.labelKa}
                            </span>
                            {isTapped && (
                              <CrystalDiamondJumpButton
                                labelKa={`წყარო (Note): ${cit.labelKa}`}
                                citeHe={cit.citeHe}
                                anchorRect={tappedCiteRect}
                                isDark={isDark}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTappedCiteKey(null);
                                  setTappedCiteRect(null);
                                  if (cit.tractateId !== '__CURRENT__') {
                                    onNavigateToDaf(cit.tractateId, cit.dafId);
                                  }
                                }}
                              />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 2: SEPHARDIC VS ASHKENAZI COMPARATIVE MATRIX                */}
      {/* ===================================================================== */}
      {viewMode === 'matrix' && (
        <div className="space-y-3.5">
          <div
            className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
            }`}
          >
            <SearchableSelect
              label="აირჩიეთ შედარებითი ჰალახური საკითხი (სეფარადული vs აშკენაზური ფოსკიმები):"
              options={topicSelectOptions}
              value={selectedTopicId}
              onChange={setSelectedTopicId}
              isDark={isDark}
              compact
            />
          </div>

          {COMPARATIVE_POSKIM_TOPICS.filter(
            (t) => selectedTopicId === 'all' || t.id === selectedTopicId
          ).map((topic) => (
            <div
              key={topic.id}
              className={`p-4 rounded-2xl border space-y-3.5 ${
                isDark
                  ? 'bg-[#1D130D]/95 border-[#C49A6C]/50'
                  : 'bg-[#FBF7F0] border-[#6B4226]/50 shadow-sm'
              }`}
            >
              <div className="border-b border-[#8B5A2B]/30 pb-2.5 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs sm:text-sm font-black">{topic.topicKa}</div>
                  <div dir="rtl" className="font-serif text-xs sm:text-sm font-bold text-[#C49A6C]">
                    {topic.topicHe} • {topic.shulchanAruchRef}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#6B4226] text-[#FAF5EB]">
                  {topic.sugyaRefKa}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-[#281A11] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#8B5A2B]/35'
                }`}
              >
                <strong className="text-[#C49A6C]">ჰალახური შეკითხვა: </strong>
                {topic.questionKa}
              </div>

              {/* 2-Column Side-by-Side Sephardic vs Ashkenazi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Column 1: Sephardic Poskim */}
                <div
                  className={`p-3 rounded-2xl border space-y-2.5 ${
                    isDark
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-amber-50/70 border-amber-700/35'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
                    <span className="text-xs font-black text-[#C49A6C]">
                      🕍 სეფარადული ფოსკიმების ბადე
                    </span>
                    <span dir="rtl" className="font-serif text-xs font-bold">
                      פוסקי ספרד ועדות המזרח
                    </span>
                  </div>

                  {topic.sephardicRulings.map((r) => (
                    <div
                      key={r.posekId}
                      className={`p-2.5 rounded-xl border space-y-1 ${
                        isDark
                          ? 'bg-[#1D130D]/90 border-[#5C3A21]'
                          : 'bg-white/90 border-[#8B5A2B]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black">{r.posekNameKa}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#6B4226] text-[#FAF5EB]">
                          {r.verdictBadgeKa}
                        </span>
                      </div>
                      <div dir="rtl" className="text-[11px] font-serif font-bold text-[#C49A6C]">
                        {r.posekNameHe} • {r.workHe}
                      </div>
                      <div className="text-xs leading-relaxed">{r.rulingKa}</div>
                      <div dir="rtl" className="font-serif text-xs opacity-85 pt-0.5">
                        {r.rulingHe}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2: Ashkenazi Poskim */}
                <div
                  className={`p-3 rounded-2xl border space-y-2.5 ${
                    isDark
                      ? 'bg-sky-950/20 border-sky-500/40'
                      : 'bg-sky-50/70 border-sky-700/35'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-sky-500/30 pb-1.5">
                    <span className="text-xs font-black text-sky-400">
                      📜 აშკენაზური ფოსკიმების ბადე
                    </span>
                    <span dir="rtl" className="font-serif text-xs font-bold">
                      פוסקי אשכנז וליטא
                    </span>
                  </div>

                  {topic.ashkenaziRulings.map((r) => (
                    <div
                      key={r.posekId}
                      className={`p-2.5 rounded-xl border space-y-1 ${
                        isDark
                          ? 'bg-[#1D130D]/90 border-[#5C3A21]'
                          : 'bg-white/90 border-[#8B5A2B]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black">{r.posekNameKa}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-800 text-white">
                          {r.verdictBadgeKa}
                        </span>
                      </div>
                      <div dir="rtl" className="text-[11px] font-serif font-bold text-sky-400">
                        {r.posekNameHe} • {r.workHe}
                      </div>
                      <div className="text-xs leading-relaxed">{r.rulingKa}</div>
                      <div dir="rtl" className="font-serif text-xs opacity-85 pt-0.5">
                        {r.rulingHe}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Halacha Lemaaseh Synthesis */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed font-semibold ${
                  isDark
                    ? 'bg-gradient-to-r from-[#2B1B10] to-[#1F140C] border-[#C49A6C]/60 text-[#FAF5EB]'
                    : 'bg-gradient-to-r from-[#EDE0C7] to-[#F7EFE0] border-[#6B4226]/60 text-[#21150C]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 text-emerald-500 -mt-0.5" />
                {topic.practicalConclusionKa}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 3: LIVE DAF POSKIM CONSILIUM FOR CURRENT TRACTATE & DAF      */}
      {/* ===================================================================== */}
      {viewMode === 'live-daf' && (
        <div
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark
              ? 'bg-[#1D130D] border-[#C49A6C]/55 text-[#FAF5EB]'
              : 'bg-[#FBF7F0] border-[#6B4226]/55 text-[#21150C]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5A2B]/30 pb-2.5">
            <div>
              <div className="text-xs sm:text-sm font-black">
                მიმდინარე დაფის ჰალახური კონსილიუმი: {tractateNameKa} • დაფი {effectiveDafId}
              </div>
              <div dir="rtl" className="font-serif text-xs sm:text-sm font-bold text-[#C49A6C]">
                פסקי גדולי הדורות על מסכת {tractateNameHe} דף {effectiveDafId}
              </div>
            </div>
            {onHighlightSentence && firstGemaraSentence && (
              <button
                type="button"
                onClick={() => onHighlightSentence(firstGemaraSentence.id)}
                className="px-3 py-1.5 rounded-xl bg-[#6B4226] text-[#FAF5EB] text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
              >
                <span>სუგიის მონიშვნა დაფზე</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {firstGemaraSnippetHe && (
            <div
              className={`p-3 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#261910] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#8B5A2B]/35'
              }`}
            >
              <div className="text-[11px] font-extrabold text-[#C49A6C]">
                დაფის საბაზისო სუგია ({tractateNameKa} {effectiveDafId}):
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold">
                {firstGemaraSnippetHe}
              </div>
              {firstGemaraSnippetKa && (
                <div className="text-xs opacity-90">{firstGemaraSnippetKa}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                nameKa: 'რავ ყოვადია იოსეფი (יביע אומר)',
                tradition: 'სეფარადული',
                textKa: `მარანის „შულხან არუხისა“ და „იაბია ომერის“ მიხედვით, ${tractateNameKa}-ის (${effectiveDafId}) სუგიაში პრაქტიკული ჰალახა მისდევს რიშონიმების უმრავლესობას (რამბამი, რიფი, როში) და კურთხევებში იცავს „საფეკ ბერახოთ ლეჰაკელ“ პრინციპს.`,
              },
              {
                nameKa: 'რავ ბენ ციონ აბა შაული (אור לציון)',
                tradition: 'სეფარადული',
                textKa: `„ორ ლეციონის“ განმარტებით, ${tractateNameKa} ${effectiveDafId}-ის მსჯელობაში ძირითადი კანონი მარანის მიხედვით დგინდება, ხოლო იქ, სადაც კურთხევის ეჭვი არ არის, „ლექათხილა“ ითვალისწინებენ ბენ იშ ხაის წესსაც.`,
              },
              {
                nameKa: 'ბენ იშ ხაი & ქაფ ჰახაიმი',
                tradition: 'სეფარადულ-კაბალისტური',
                textKa: `აერთიანებს ${tractateNameKa} ${effectiveDafId}-ის ფშატსა და არიზალის კაბალისტურ ქავანას; „ქაფ ჰახაიმი“ მოუწოდებს ყველა ძირითადი აზრის გათვალისწინებისკენ მცნების სრულყოფილად შესასრულებლად.`,
              },
              {
                nameKa: 'რავ მოშე ლევი (מנוחת אהבה / ברכת ה׳)',
                tradition: 'სეფარადული იუნი',
                textKa: `გემარის ლოგიკური ანალიზით („სვარა“) ხსნის ${tractateNameKa} ${effectiveDafId}-ში მოყვანილ თანაიმებისა და ამორაიმების კამათს და გამოჰყავს მკაფიო პრაქტიკული დასკვნა.`,
              },
              {
                nameKa: 'მიშნა ბრურა (החפץ חיים)',
                tradition: 'აშკენაზური',
                textKa: `„მიშნა ბრურასა“ და „ბიურ ჰალახას“ მიხედვით, ${tractateNameKa} ${effectiveDafId}-ის თორისმიერ საკითხებში მოქმედებს „საფეკ დეორაითა ლეხუმრა“, ხოლო რაბინულ კანონებში — რამასა და ახარონიმების შეჯერებული პრაქტიკა.`,
              },
              {
                nameKa: 'რავ მოშე ფაინშტეინი & რავ ოირბახი',
                tradition: 'აშკენაზური (אגרות משה / מנחת שלמה)',
                textKa: `„დიბროთ მოშესა“ და „ჰალიხოთ შლომოს“ ანალიზით, ${tractateNameKa} ${effectiveDafId}-ის პრინციპები პირდაპირ გამოიყენება თანამედროვე რეალობასა და საზოგადოებრივ ლოცვაში.`,
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#8B5A2B]/35'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#C49A6C]">{card.nameKa}</span>
                  <span className="text-[10px] font-bold opacity-75">{card.tradition}</span>
                </div>
                <p className="text-xs leading-relaxed">{card.textKa}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {localFullscreen && (
        <FullScreenModal
          isOpen={Boolean(localFullscreen)}
          onClose={() => setLocalFullscreen(null)}
          title={localFullscreen.title}
          subtitle={localFullscreen.subtitle}
          hebrewText={localFullscreen.hebrewText}
          georgianText={localFullscreen.georgianText}
          isDark={isDark}
        />
      )}

      {isLineSweepMode && (
        <ReadingLineGuide isDarkField={isDark} fieldLabel="ფოსკიმების სტრიქონი" />
      )}

      <AnimatePresence>
        {isLineSweepMode && activeLineTranslation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[150] w-[94vw] max-w-2xl rounded-2xl border-2 p-3.5 shadow-2xl backdrop-blur-md ${
              isDark
                ? 'bg-[#1D130B]/95 border-[#C49A6C] text-[#FAF5EB]'
                : 'bg-[#FFFDF8]/95 border-[#6B4226] text-[#21150C]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#6B4226] text-[#FAF5EB]">
                📏 სტრიქონის თარგმნა • {activeLineTranslation.titleKa}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => speakHebrewText(activeLineTranslation.hebrewLine)}
                  className="p-1.5 rounded-lg bg-[#6B4226]/20 hover:bg-[#6B4226]/40 cursor-pointer"
                  title="წაკითხვა"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLineTranslation(null)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div dir="rtl" className="font-serif text-sm font-bold mb-1 text-[#C49A6C]">
              {activeLineTranslation.hebrewLine}
            </div>
            <div className="text-xs sm:text-sm font-semibold leading-relaxed">
              {activeLineTranslation.georgianTranslation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
