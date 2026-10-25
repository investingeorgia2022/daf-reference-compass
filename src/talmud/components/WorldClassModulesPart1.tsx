// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Scale,
  Volume2,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Columns,
  ArrowUpRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Ruler,
  Calculator,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { DafPageData, TalmudSentence } from '../types/talmud';
import {
  HALACHA_BRIDGE_ITEMS,
  PARALLEL_SUGYOT_COMPARISONS,
  SOCRATIC_CHAVRUTA_QUESTIONS,
  TALMUDIC_REALIA_ITEMS,
  TalmudicRealiaItem,
} from '../data/worldClassFeaturesData';
import { getChavrutaCommentaryForDaf } from '../data/chavrutaCommentary';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';
import { PoskimHalachaMasterGrid } from './PoskimHalachaMasterGrid';

interface SharedModuleProps {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  isDark: boolean;
  onHighlightSentence: (sentenceId: string | null) => void;
  onNavigateToDaf?: (tractateId: string, dafId: string) => void;
  onOpenFullscreen: (data: {
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  }) => void;
}

/* ============================================================================
 * FEATURE #1: ჰალახის ცოცხალი ხიდი (גמרא → רמב״ם → טור → שולחן ערוך)
 * ============================================================================ */
export const HalachaBridgePanel: React.FC<SharedModuleProps> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onHighlightSentence,
  onOpenFullscreen,
}) => {
  const [selectedBridgeId, setSelectedBridgeId] = useState<string>('all');

  const bridgeOptions: SelectOption[] = [
    {
      value: 'all',
      badgeHe: `כל ההלכות (${HALACHA_BRIDGE_ITEMS.length})`,
      label: `ყველა ჰალახური ჯაჭვი ამ სუგიაზე (${HALACHA_BRIDGE_ITEMS.length})`,
    },
    ...HALACHA_BRIDGE_ITEMS.map((item, idx) => ({
      value: item.id,
      badgeHe: item.shulchanAruch.refHe,
      label: `${idx + 1}. ${item.topicKa}`,
      sublabel: item.topicHe,
    })),
  ];

  const visibleItems =
    selectedBridgeId === 'all'
      ? HALACHA_BRIDGE_ITEMS
      : HALACHA_BRIDGE_ITEMS.filter((i) => i.id === selectedBridgeId);

  return (
    <div className="space-y-3">
      <div
        className={`study-tool-intro py-2 border-b ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#EED9B9]'
            : 'bg-[#FBF7F0] border-[#CBB89D] text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              ჰალახის ხიდი
            </span>
          </div>
          <span dir="rtl" className="text-xs font-serif font-bold opacity-85">
            {tractateNameHe} {dafData.dafId}
          </span>
        </div>
        <SearchableSelect
          label="ჰალახური თემის გაფილტვრა:"
          wrapLabels
          options={bridgeOptions}
          value={selectedBridgeId}
          onChange={setSelectedBridgeId}
          isDark={isDark}
          compact
        />
      </div>

      {visibleItems.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className={`halacha-study-entry p-3 sm:p-4 rounded-2xl border space-y-3 ${
            isDark
              ? 'bg-[#1D130D]/95 border-[#5C3A21]'
              : 'bg-[#FBF7F0] border-[#8B5A2B]/40 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
            <div>
              <div className="text-xs font-extrabold">
                #{idx + 1} · {item.topicKa}
              </div>
              <div dir="rtl" className="text-xs font-serif opacity-80">
                {item.topicHe}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.sentenceId && (
                <button
                  type="button"
                  onClick={() => { if (item.sentenceId) onHighlightSentence(item.sentenceId); }}
                  className="px-2.5 py-1 rounded-lg bg-[#6B4226] text-[#FBF7F0] text-[11px] font-bold cursor-pointer hover:bg-[#7D4E2D] transition-colors"
                >
                  დაფზე ნახვა
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: item.topicKa,
                    subtitle: item.topicHe,
                    hebrewText: `${item.gemaraQuoteHe}\n\n${item.rambam.refHe}: ${item.rambam.textHe}\n\n${item.tur.refHe}: ${item.tur.textHe}\n\n${item.shulchanAruch.refHe}: ${item.shulchanAruch.textHe}`,
                    georgianText: `1. რამბამი (${item.rambam.refKa}):\n${item.rambam.textKa}\n\n2. ტური (${item.tur.refKa}):\n${item.tur.textKa}\n\n3. შულხან არუხი (${item.shulchanAruch.refKa}):\n${item.shulchanAruch.textKa}\n\nსაბოლოო ჰალახა:\n${item.shulchanAruch.psakSummaryKa}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer hover:bg-[#6B4226]/20"
                title="მთელ ეკრანზე გახსნა"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step 0: Gemara Root */}
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-[#281A11] border-[#6B4226]' : 'bg-[#EFE5D0] border-[#8B5A2B]/35'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold mb-1 text-[#C49A6C]">
              <span className="halacha-step-chip">I</span>
              <span>გემარის საფუძველი ({tractateNameKa} {dafData.dafId}):</span>
            </div>
            <div dir="rtl" className="font-serif text-sm font-bold">
              {item.gemaraQuoteHe}
            </div>
          </div>

          {/* 3-Column Codification Chain */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Rambam */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold text-[#C49A6C] flex items-center gap-1.5">
                    <span className="halacha-step-chip">II</span> რამბამი (רמב״ם)
                  </span>
                  <span dir="rtl" className="text-[11px] font-serif font-bold">
                    {item.rambam.refHe}
                  </span>
                </div>
                <div dir="rtl" className="font-serif text-xs leading-relaxed">
                  {item.rambam.textHe}
                </div>
                <div className="text-[11px] leading-snug opacity-90 pt-1 border-t border-[#8B5A2B]/20">
                  {item.rambam.textKa}
                </div>
              </div>
            </div>

            {/* Tur */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold text-[#C49A6C] flex items-center gap-1.5">
                    <span className="halacha-step-chip">III</span> არბაა ტურიმი (טור)
                  </span>
                  <span dir="rtl" className="text-[11px] font-serif font-bold">
                    {item.tur.refHe}
                  </span>
                </div>
                <div dir="rtl" className="font-serif text-xs leading-relaxed">
                  {item.tur.textHe}
                </div>
                <div className="text-[11px] leading-snug opacity-90 pt-1 border-t border-[#8B5A2B]/20">
                  {item.tur.textKa}
                </div>
              </div>
            </div>

            {/* Shulchan Aruch */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#2A1D13] border-[#C49A6C]/55' : 'bg-[#EDE0C7] border-[#6B4226]/50'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold text-[#C49A6C] flex items-center gap-1.5">
                    <span className="halacha-step-chip">IV</span> შულხან არუხი (שו״ע)
                  </span>
                  <span dir="rtl" className="text-[11px] font-serif font-bold">
                    {item.shulchanAruch.refHe}
                  </span>
                </div>
                <div dir="rtl" className="font-serif text-xs leading-relaxed font-bold">
                  {item.shulchanAruch.textHe}
                </div>
                <div className="text-[11px] leading-snug font-medium pt-1 border-t border-[#8B5A2B]/25">
                  {item.shulchanAruch.textKa}
                </div>
              </div>
            </div>
          </div>

          {/* Psak Halacha Summary */}
          <div
            className={`p-2.5 rounded-xl border text-xs font-semibold ${
              isDark
                ? 'bg-[#2E6B3E]/20 border-[#2E6B3E]/50 text-[#EED9B9]'
                : 'bg-[#2E6B3E]/10 border-[#2E6B3E]/40 text-[#1F472A]'
            }`}
          >
            <strong>საბოლოო ჰალახური დასკვნა (הלכה למעשה):</strong> {item.shulchanAruch.psakSummaryKa}
          </div>
        </motion.div>
      ))}

      {/* Step V: Full Late-Era Sephardic & Ashkenazi Poskim Master Grid */}
      <PoskimHalachaMasterGrid
        dafData={dafData}
        tractateNameHe={tractateNameHe}
        tractateNameKa={tractateNameKa}
        isDark={isDark}
        onHighlightSentence={onHighlightSentence}
        onOpenFullscreen={onOpenFullscreen}
      />
    </div>
  );
};

/* ============================================================================
 * FEATURE #2: სინქრონიზებული აუდიო-შიური და კარაოკე-ჰაილაითინგი (שיעור שמע מסונכרן)
 * ============================================================================ */
export const AudioShiurKaraokePanel: React.FC<SharedModuleProps> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onHighlightSentence,
}) => {
  const [sectionChoice, setSectionChoice] = useState<string>('all');
  const [speechRate, setSpeechRate] = useState<string>('0.9');
  const [includeGeorgian, setIncludeGeorgian] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const playingRef = useRef<boolean>(false);

  const chavrutaList =
    dafData.chavruta && dafData.chavruta.length > 0
      ? dafData.chavruta
      : getChavrutaCommentaryForDaf(
          dafData.tractateId,
          dafData.dafId,
          dafData.gemara,
          dafData.allCommentaries
        );

  const playlist: TalmudSentence[] = (() => {
    switch (sectionChoice) {
      case 'mishnah':
        return dafData.mishnah;
      case 'gemara':
        return dafData.gemara;
      case 'rashi':
        return dafData.rashi;
      case 'tosafot':
        return dafData.tosafot;
      case 'chavruta':
        return chavrutaList;
      default:
        return [...dafData.mishnah, ...dafData.gemara, ...dafData.rashi.slice(0, 5)];
    }
  })();

  const safeIdx = Math.min(currentIdx, Math.max(0, playlist.length - 1));
  const activeSentence = playlist[safeIdx];

  const stopAudio = () => {
    playingRef.current = false;
    setIsPlaying(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playFromIndex = (idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (idx < 0 || idx >= playlist.length) {
      stopAudio();
      return;
    }

    window.speechSynthesis.cancel();
    playingRef.current = true;
    setIsPlaying(true);
    setCurrentIdx(idx);

    const item = playlist[idx];
    onHighlightSentence(item.id);

    const utterHe = new SpeechSynthesisUtterance(item.hebrewText);
    utterHe.lang = 'he-IL';
    utterHe.rate = parseFloat(speechRate) || 0.9;

    utterHe.onend = () => {
      if (!playingRef.current) return;
      if (includeGeorgian && item.translationKa) {
        const utterKa = new SpeechSynthesisUtterance(sanitizeGeorgianText(item.translationKa));
        utterKa.lang = 'ka-GE';
        utterKa.rate = Math.min(1.3, (parseFloat(speechRate) || 0.9) * 1.05);
        utterKa.onend = () => {
          if (playingRef.current && idx + 1 < playlist.length) {
            playFromIndex(idx + 1);
          } else {
            stopAudio();
          }
        };
        utterKa.onerror = () => {
          if (playingRef.current && idx + 1 < playlist.length) {
            playFromIndex(idx + 1);
          } else {
            stopAudio();
          }
        };
        window.speechSynthesis.speak(utterKa);
      } else if (idx + 1 < playlist.length) {
        playFromIndex(idx + 1);
      } else {
        stopAudio();
      }
    };

    utterHe.onerror = () => {
      stopAudio();
    };

    window.speechSynthesis.speak(utterHe);
  };

  const sectionOptions: SelectOption[] = [
    {
      value: 'all',
      badgeHe: 'כל הדף',
      label: 'მთლიანი სასწავლო პროგრამა (მიშნა + გემარა + რაში)',
    },
    { value: 'mishnah', badgeHe: 'משנה', label: `მიშნა (${dafData.mishnah.length})` },
    { value: 'gemara', badgeHe: 'גמרא', label: `გემარა (${dafData.gemara.length})` },
    { value: 'rashi', badgeHe: 'רש״י', label: `რაში (${dafData.rashi.length})` },
    { value: 'tosafot', badgeHe: 'תוספות', label: `თოსაფოთი (${dafData.tosafot.length})` },
    { value: 'chavruta', badgeHe: 'חברותא', label: `ხავრუთა (${chavrutaList.length})` },
  ];

  const speedOptions: SelectOption[] = [
    { value: '0.75', badgeHe: '0.75x', label: '0.75x — ნელი და ღრმა კითხვა (בעיון)' },
    { value: '0.9', badgeHe: '0.90x', label: '0.90x — კლასიკური ბეთ-მიდრაშის ტემპი' },
    { value: '1.0', badgeHe: '1.00x', label: '1.00x — სტანდარტული სიჩქარე' },
    { value: '1.25', badgeHe: '1.25x', label: '1.25x — ბეკიუთის (בקיאות) სწრაფი ტემპი' },
    { value: '1.5', badgeHe: '1.50x', label: '1.50x — სწრაფი გამეორება (חזרה)' },
  ];

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              2. სინქრონიზებული აუდიო-შიური და კარაოკე-ჰაილაითინგი (שיעור שמע מסונכרן)
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#C49A6C]">
            სეგმენტი {safeIdx + 1} / { Math.max(1, playlist.length) }
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <SearchableSelect
            label="აუდიო-შიურის სექცია:"
            options={sectionOptions}
            value={sectionChoice}
            onChange={(val) => {
              stopAudio();
              setSectionChoice(val);
              setCurrentIdx(0);
            }}
            isDark={isDark}
            compact
          />
          <SearchableSelect
            label="კითხვის სიჩქარე (ტემპი):"
            options={speedOptions}
            value={speechRate}
            onChange={(val) => setSpeechRate(val)}
            isDark={isDark}
            compact
          />
        </div>

        {/* Karaoke Live Teleprompter Stage */}
        {activeSentence && (
          <div
            className={`p-4 rounded-2xl border-2 transition-all ${
              isPlaying
                ? isDark
                  ? 'bg-[#2B1B10] border-[#C49A6C] shadow-lg'
                  : 'bg-[#EFE4D0] border-[#6B4226] shadow-md'
                : isDark
                  ? 'bg-[#241810] border-[#5C3A21]'
                  : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold text-[#C49A6C]">
                {isPlaying ? '🔊 ახლა იკითხება და ჰაილაითდება დაფზე:' : 'მზადაა წასაკითხად:'}
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGeorgian}
                  onChange={(e) => setIncludeGeorgian(e.target.checked)}
                  className="accent-[#6B4226]"
                />
                <span>+ ქართული განმარტებით</span>
              </label>
            </div>
            <div dir="rtl" className="font-serif text-lg sm:text-xl font-bold leading-relaxed mb-2">
              {activeSentence.hebrewText}
            </div>
            <div className="text-xs sm:text-sm leading-relaxed opacity-95 border-t border-[#8B5A2B]/25 pt-2">
              {sanitizeGeorgianText(activeSentence.translationKa)}
            </div>
          </div>
        )}

        {/* Symmetric Player Controls */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              const prev = Math.max(0, safeIdx - 1);
              setCurrentIdx(prev);
              onHighlightSentence(playlist[prev]?.id || null);
              if (isPlaying) playFromIndex(prev);
            }}
            className={`py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#2B1D14] border-[#5C3A21] text-[#EED9B9] hover:border-[#C49A6C]'
                : 'bg-[#EFE5D0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
            }`}
          >
            <SkipBack className="w-4 h-4" />
            <span>წინა</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                stopAudio();
              } else {
                playFromIndex(safeIdx);
              }
            }}
            className="py-2.5 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'პაუზა' : 'დაკვრა'}</span>
          </button>

          <button
            type="button"
            onClick={stopAudio}
            className={`py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#2B1D14] border-[#5C3A21] text-[#EED9B9] hover:border-[#C49A6C]'
                : 'bg-[#EFE5D0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>გაჩერება</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = Math.min(playlist.length - 1, safeIdx + 1);
              setCurrentIdx(next);
              onHighlightSentence(playlist[next]?.id || null);
              if (isPlaying) playFromIndex(next);
            }}
            className={`py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#2B1D14] border-[#5C3A21] text-[#EED9B9] hover:border-[#C49A6C]'
                : 'bg-[#EFE5D0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
            }`}
          >
            <span>შემდეგი</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #3: პარალელური სუგიების სინოპტიკური შედარება (מסורת הש״ס)
 * ============================================================================ */
export const ParallelSugyotPanel: React.FC<SharedModuleProps> = ({
  isDark,
  onNavigateToDaf,
  onOpenFullscreen,
}) => {
  const [selectedParallelId, setSelectedParallelId] = useState<string>('all');

  const options: SelectOption[] = [
    {
      value: 'all',
      badgeHe: `כל ההשוואות (${PARALLEL_SUGYOT_COMPARISONS.length})`,
      label: `ყველა პარალელური სუგია (სინოპტიკური ტაბულა — ${PARALLEL_SUGYOT_COMPARISONS.length})`,
    },
    ...PARALLEL_SUGYOT_COMPARISONS.map((p) => ({
      value: p.id,
      badgeHe: `${p.sourceTitleHe} ⇄ ${p.parallelTitleHe}`,
      label: `${p.sourceTitleKa} ⇄ ${p.parallelTitleKa}`,
      sublabel: p.connectionTypeKa,
    })),
  ];

  const items =
    selectedParallelId === 'all'
      ? PARALLEL_SUGYOT_COMPARISONS
      : PARALLEL_SUGYOT_COMPARISONS.filter((p) => p.id === selectedParallelId);

  return (
    <div className="space-y-3">
      <div
        className={`p-3 rounded-xl border ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#CBB89D] text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Columns className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            3. პარალელური სუგიების სინოპტიკური შედარება (מסורת הש״ס • Synoptic Sugyot)
          </span>
        </div>
        <p className="text-xs opacity-85 mb-2.5">
          შეადარეთ მიმდინარე დაფის სუგია შასის სხვა ტრაქტატების პარალელურ მონაკვეთებს გვერდიგვერდ.
        </p>
        <SearchableSelect
          label="პარალელური ტრაქტატის არჩევა:"
          options={options}
          value={selectedParallelId}
          onChange={setSelectedParallelId}
          isDark={isDark}
          compact
        />
      </div>

      {items.map((comp) => (
        <div
          key={comp.id}
          className={`p-3.5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
            <div>
              <div className="text-xs font-extrabold text-[#C49A6C]">{comp.connectionTypeKa}</div>
              <div className="text-xs font-bold">
                {comp.sourceTitleKa} ⇄ {comp.parallelTitleKa}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onNavigateToDaf && (
                <button
                  type="button"
                  onClick={() => onNavigateToDaf(comp.parallelTractateId, comp.parallelDafId)}
                  className="px-2.5 py-1 rounded-lg bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>გადასვლა: {comp.parallelTitleKa}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: `${comp.sourceTitleKa} ⇄ ${comp.parallelTitleKa}`,
                    subtitle: comp.connectionTypeKa,
                    hebrewText: `${comp.sourceTitleHe}:\n${comp.sourceSnippetHe}\n\n${comp.parallelTitleHe}:\n${comp.parallelSnippetHe}`,
                    georgianText: `${comp.sourceTitleKa}:\n${comp.sourceSnippetKa}\n\n${comp.parallelTitleKa}:\n${comp.parallelSnippetKa}\n\nგანსხვავებები:\n• ${comp.keyDifferencesKa.join('\n• ')}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-[#C49A6C]">{comp.sourceTitleKa}</span>
                <span dir="rtl" className="text-xs font-serif font-bold">
                  {comp.sourceTitleHe}
                </span>
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold leading-relaxed mb-1.5">
                {comp.sourceSnippetHe}
              </div>
              <div className="text-xs leading-snug opacity-90">{comp.sourceSnippetKa}</div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#281A11] border-[#C49A6C]/50' : 'bg-[#EDE0C7] border-[#6B4226]/45'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-[#C49A6C]">
                  {comp.parallelTitleKa}
                </span>
                <span dir="rtl" className="text-xs font-serif font-bold">
                  {comp.parallelTitleHe}
                </span>
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold leading-relaxed mb-1.5">
                {comp.parallelSnippetHe}
              </div>
              <div className="text-xs leading-snug opacity-90">{comp.parallelSnippetKa}</div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-[#C49A6C]">
              სინოპტიკური დასკვნა და საერთო ფორმულები ({comp.highlightedWordsHe.join(' · ')}):
            </div>
            {comp.keyDifferencesKa.map((diff, i) => (
              <div key={i} className="leading-relaxed opacity-90">
                • {diff}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
 * FEATURE #4: სოკრატული „ხავრუთა-გამოწვევის“ რეჟიმი (חברותא בוחן)
 * ============================================================================ */
export const SocraticChallengePanel: React.FC<SharedModuleProps> = ({ isDark }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});

  const correctCount = SOCRATIC_CHAVRUTA_QUESTIONS.filter((q) => {
    const chosen = selectedAnswers[q.id];
    const opt = q.options.find((o) => o.id === chosen);
    return opt?.isCorrect;
  }).length;

  return (
    <div className="space-y-3">
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#CBB89D] text-[#2C1A10]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              4. სოკრატული „ხავრუთა-გამოწვევის“ რეჟიმი (חברותא בוחן • Socratic Mode)
            </span>
          </div>
          <p className="text-xs opacity-80 mt-1">
            გაეცით პასუხი გემარის კითხვებს (კუშიას) მანამ, სანამ რაშისა და თოსაფოთის პასუხი გაიხსნება!
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold shrink-0">
          შედეგი: {correctCount} / {SOCRATIC_CHAVRUTA_QUESTIONS.length}
        </div>
      </div>

      {SOCRATIC_CHAVRUTA_QUESTIONS.map((q, idx) => {
        const pickedId = selectedAnswers[q.id];
        const pickedOption = q.options.find((o) => o.id === pickedId);
        const isHintOpen = !!shownHints[q.id];

        return (
          <div
            key={q.id}
            className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#C49A6C]">
                გამოწვევა #{idx + 1} · {q.stageBadgeKa} ({q.stageBadgeHe})
              </span>
              <button
                type="button"
                onClick={() => setShownHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                className="px-2.5 py-1 rounded-lg border border-[#C49A6C]/50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#C49A6C]" />
                <span>{isHintOpen ? 'მინიშნების დამალვა' : 'მინიშნება'}</span>
              </button>
            </div>

            <div
              dir="rtl"
              className={`p-2.5 rounded-xl font-serif text-sm font-bold ${
                isDark ? 'bg-[#281A11] text-[#EED9B9]' : 'bg-[#EFE5D0] text-[#2C1A10]'
              }`}
            >
              {q.gemaraContextHe}
            </div>

            <div className="text-xs sm:text-sm font-bold leading-relaxed">{q.questionKa}</div>

            <AnimatePresence>
              {isHintOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="p-2.5 rounded-xl bg-[#6B4226]/20 border border-[#C49A6C]/45 text-xs"
                >
                  💡 <strong>მინიშნება:</strong> {q.hintKa}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const isSelected = pickedId === opt.id;
                let btnStyle = isDark
                  ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C]'
                  : 'bg-[#F5EBD6] border-[#CBB89D] hover:border-[#6B4226]';
                if (isSelected) {
                  btnStyle = opt.isCorrect
                    ? 'bg-[#2E6B3E] text-[#FBF7F0] border-[#2E6B3E]'
                    : 'bg-rose-800 text-white border-rose-600';
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-start gap-2 transition-all cursor-pointer ${btnStyle}`}
                  >
                    {isSelected ? (
                      opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <span className="font-extrabold uppercase">{opt.id}.</span>
                    )}
                    <span>{opt.textKa}</span>
                  </button>
                );
              })}
            </div>

            {pickedOption && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  isDark
                    ? 'bg-[#281A11] border-[#C49A6C]/50 text-[#FAF5EB]'
                    : 'bg-[#EFE4D0] border-[#6B4226]/50 text-[#2C1A10]'
                }`}
              >
                <div className="font-extrabold text-[#C49A6C] mb-1">
                  <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                  რაშისა და თოსაფოთის ანალიზი:
                </div>
                {q.rashiTosafotAnalysisKa}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================================
 * FEATURE #5: თალმუდური რეალიების, საზომებისა და მონეტების ატლასი + კალკულატორი
 * ============================================================================ */
export const RealiaAndMeasuresPanel: React.FC<SharedModuleProps> = ({
  isDark,
  onOpenFullscreen,
}) => {
  const [unitAmount, setUnitAmount] = useState<string>('1');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('amah');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const unitSpecs: Record<
    string,
    { labelKa: string; badgeHe: string; naehVal: number; chazonVal: number; metricUnit: string; descKa: string }
  > = {
    amah: {
      labelKa: 'ამა / წყრთა (אַמָּה = 6 ტეფახი)',
      badgeHe: 'אַמָּה',
      naehVal: 48.0,
      chazonVal: 57.6,
      metricUnit: 'სმ',
      descKa: 'სუქის სიმაღლე, შაბათის 2000 ამა და ტაძრის არქიტექტურა',
    },
    tefach: {
      labelKa: 'ტეფახი / ხელისგული (טֶפַח = 4 ეცბა)',
      badgeHe: 'טֶפַח',
      naehVal: 8.0,
      chazonVal: 9.6,
      metricUnit: 'სმ',
      descKa: 'ლულავის მინიმალური სიგრძე (4 ტეფახი) და სუქის კედლები',
    },
    reviit: {
      labelKa: 'რევიითი (רְבִיעִית הַלּוֹג)',
      badgeHe: 'רְבִיעִית',
      naehVal: 86,
      chazonVal: 150,
      metricUnit: 'მლ',
      descKa: 'კიდუშის ჭიქისა და სითხის კურთხევის ჰალახური საზომი',
    },
    kazayit: {
      labelKa: 'ქაზაითი / ზეთისხილის ოდენობა (כַּזַּיִת)',
      badgeHe: 'כַּזַּיִת',
      naehVal: 27,
      chazonVal: 38,
      metricUnit: 'გრამი / მლ',
      descKa: 'მაცის, მარორისა და პურის კურთხევის საბაზისო ერთეული',
    },
    seah: {
      labelKa: 'სეა (סְאָה = 6 კაბი = 24 ლოგი)',
      badgeHe: 'סְאָה',
      naehVal: 8.3,
      chazonVal: 14.4,
      metricUnit: 'ლიტრი',
      descKa: 'მიკვეს წყლის მოცულობა (40 სეა)',
    },
    sela: {
      labelKa: 'სელა (סֶלַע = 4 დინარი / ზუზი)',
      badgeHe: 'סֶלַע',
      naehVal: 19.2,
      chazonVal: 19.2,
      metricUnit: 'გ ვერცხლი',
      descKa: 'პირმშოს გამოსყიდვა — ფიდიონ ჰაბენი (5 სელა)',
    },
    zuz: {
      labelKa: 'ზუზი / დინარი (זוּז / דִּינָר)',
      badgeHe: 'זוּז',
      naehVal: 4.8,
      chazonVal: 4.8,
      metricUnit: 'გ ვერცხლი',
      descKa: 'ქეთუბის საბაზისო თანხა (200 ზუზი)',
    },
  };

  const activeSpec = unitSpecs[selectedUnitId] || unitSpecs.amah;
  const numericQty = Math.max(0, parseFloat(unitAmount) || 0);

  const renderRealiaSvg = (type: TalmudicRealiaItem['svgType']) => {
    return (
      <svg viewBox="0 0 120 72" className="w-24 h-16 shrink-0 rounded-xl border border-[#8B5A2B]/35 bg-[#EFE4D0] p-1.5">
        {type === 'four-species' && (
          <g stroke="#4A2E1B" strokeWidth="2" fill="none">
            <path d="M60 64 L60 8" stroke="#2E6B3E" strokeWidth="3" />
            <ellipse cx="36" cy="44" rx="10" ry="14" fill="#D4AF37" stroke="#6B4226" />
            <path d="M78 60 Q84 35 76 18" stroke="#38804B" strokeWidth="2" />
            <path d="M88 60 Q95 38 86 22" stroke="#5C3A21" strokeWidth="2" />
          </g>
        )}
        {type === 'amah-cubit' && (
          <g stroke="#4A2E1B" strokeWidth="1.8">
            <rect x="10" y="26" width="100" height="20" rx="3" fill="#C49A6C" />
            {[26, 43, 60, 77, 94].map((x) => (
              <line key={x} x1={x} y1="26" x2={x} y2="36" />
            ))}
          </g>
        )}
        {type === 'volume-cup' && (
          <g stroke="#4A2E1B" strokeWidth="2" fill="#C49A6C">
            <path d="M38 14 L82 14 L74 48 Q60 56 46 48 Z" />
            <line x1="60" y1="52" x2="60" y2="64" />
            <line x1="44" y1="64" x2="76" y2="64" />
          </g>
        )}
        {type === 'silver-coin' && (
          <g stroke="#4A2E1B" strokeWidth="2">
            <circle cx="60" cy="36" r="24" fill="#D8D4CC" />
            <circle cx="60" cy="36" r="19" fill="none" strokeDasharray="3 2" />
            <text x="60" y="41" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#2C1A10">
              שקל
            </text>
          </g>
        )}
        {(type === 'menorah-vessel' || type === 'oven-achnai') && (
          <g stroke="#4A2E1B" strokeWidth="2" fill="#C49A6C">
            <rect x="26" y="30" width="68" height="32" rx="3" />
            <rect x="22" y="22" width="10" height="10" />
            <rect x="88" y="22" width="10" height="10" />
          </g>
        )}
      </svg>
    );
  };

  const visibleRealia =
    categoryFilter === 'all'
      ? TALMUDIC_REALIA_ITEMS
      : TALMUDIC_REALIA_ITEMS.filter((r) => r.category === categoryFilter);

  return (
    <div className="space-y-3">
      {/* Live Halachic Measures & Coins Calculator */}
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            5. თალმუდური რეალიების, საზომებისა და მონეტების ატლასი + ცოცხალი კალკულატორი
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
          <div>
            <label className="block text-[11px] font-bold mb-1 opacity-85">რაოდენობა:</label>
            <input
              type="number"
              min="0.1"
              step="any"
              value={unitAmount}
              onChange={(e) => setUnitAmount(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                isDark
                  ? 'bg-[#281A11] border-[#5C3A21] text-[#FAF5EB]'
                  : 'bg-white border-[#8B5A2B]/45 text-[#2C1A10]'
              }`}
            />
          </div>
          <div className="sm:col-span-2">
            <SearchableSelect
              label="თალმუდური ერთეულის არჩევა:"
              options={Object.entries(unitSpecs).map(([id, s]) => ({
                value: id,
                badgeHe: s.badgeHe,
                label: s.labelKa,
                sublabel: s.descKa,
              }))}
              value={selectedUnitId}
              onChange={setSelectedUnitId}
              isDark={isDark}
              compact
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#EFE4D0] border-[#8B5A2B]/35'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">
              რაბი ხაიმ ნაეს სისტემა (שיטת הגר״ח נאה):
            </div>
            <div className="text-base sm:text-lg font-black text-[#C49A6C] mt-0.5 tabular-nums">
              {(numericQty * activeSpec.naehVal).toFixed(2)} {activeSpec.metricUnit}
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#281A11] border-[#C49A6C]/45' : 'bg-[#EDE0C7] border-[#6B4226]/45'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">
              ხაზონ იშის სისტემა (שיטת החזון איש):
            </div>
            <div className="text-base sm:text-lg font-black text-[#C49A6C] mt-0.5 tabular-nums">
              {(numericQty * activeSpec.chazonVal).toFixed(2)} {activeSpec.metricUnit}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter + Illustrated Realia Cards */}
      <SearchableSelect
        label="რეალიების ატლასის კატეგორია:"
        options={[
          { value: 'all', badgeHe: 'הכל', label: 'ყველა თალმუდური რეალია და საზომი' },
          { value: 'flora', badgeHe: 'צומח', label: 'დღესასწაულის მცენარეები (ოთხი სახეობა)' },
          { value: 'length', badgeHe: 'אורך', label: 'სიგრძის საზომები (ამა, ტეფახი)' },
          { value: 'volume', badgeHe: 'נפח', label: 'მოცულობის საზომები (რევიითი, სეა)' },
          { value: 'coins', badgeHe: 'מטבעות', label: 'მონეტები (სელა, ზუზი, პრუტა)' },
          { value: 'vessels', badgeHe: 'כלי המקדש', label: 'ტაძრის ჭურჭელი და სამსხვერპლო' },
        ]}
        value={categoryFilter}
        onChange={setCategoryFilter}
        isDark={isDark}
        compact
      />

      {visibleRealia.map((item) => (
        <div
          key={item.id}
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start gap-3 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          {renderRealiaSvg(item.svgType)}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold">{item.nameKa}</div>
                <div dir="rtl" className="text-xs font-serif font-bold text-[#C49A6C]">
                  {item.nameHe}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: item.nameKa,
                    subtitle: item.categoryLabelKa,
                    hebrewText: item.nameHe,
                    georgianText: `${item.descriptionKa}\n\n• ხაზონ იში: ${item.modernChazonIsh}\n• რაბი ხაიმ ნაე: ${item.modernChaimNaeh}\n• წყარო: ${item.talmudContextKa}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{item.descriptionKa}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold pt-1">
              <div className="px-2.5 py-1 rounded-lg bg-[#6B4226]/15 border border-[#8B5A2B]/30">
                <strong>ხაზონ იში:</strong> {item.modernChazonIsh}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#6B4226]/15 border border-[#8B5A2B]/30">
                <strong>რ. ხაიმ ნაე:</strong> {item.modernChaimNaeh}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
