// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Brain,
  RotateCcw,
  Plus,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Download,
  Network,
  FileSpreadsheet,
  Copy,
  Check,
  Maximize2,
  ArrowUpRight,
} from 'lucide-react';
import { DafPageData, ScholarNote } from '../types/talmud';
import {
  getDafYomiSchedule,
  MANUSCRIPT_VARIANTS,
  SAGE_DYNASTY_NODES,
  TalmudFlashcard,
} from '../data/worldClassFeaturesData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';

interface SharedPart2Props {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  isDark: boolean;
  notes: ScholarNote[];
  completedDapim: string[];
  onToggleDafComplete: (dafKey: string) => void;
  onNavigateToDaf?: (tractateId: string, dafId: string) => void;
  flashcards: TalmudFlashcard[];
  onUpdateFlashcardBox: (cardId: string, newBox: number) => void;
  onAddCustomFlashcard: (termHe: string, translitKa: string, meaningKa: string) => void;
  onOpenFullscreen: (data: {
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  }) => void;
}

/* ============================================================================
 * FEATURE #6: არამეული ტერმინებისა და აბრევიატურების (ראשי תיבות) Spaced-Repetition
 * ============================================================================ */
export const FlashcardsSpacedRepetitionPanel: React.FC<SharedPart2Props> = ({
  isDark,
  flashcards,
  onUpdateFlashcardBox,
  onAddCustomFlashcard,
}) => {
  const [boxFilter, setBoxFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTermHe, setNewTermHe] = useState<string>('');
  const [newTranslitKa, setNewTranslitKa] = useState<string>('');
  const [newMeaningKa, setNewMeaningKa] = useState<string>('');

  const filteredCards = useMemo(() => {
    return flashcards.filter((c) => {
      if (boxFilter !== 'all' && String(c.boxLevel) !== boxFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      return true;
    });
  }, [flashcards, boxFilter, categoryFilter]);

  const safeIdx = Math.min(currentCardIdx, Math.max(0, filteredCards.length - 1));
  const activeCard = filteredCards[safeIdx];

  const boxCounts = {
    1: flashcards.filter((c) => c.boxLevel === 1).length,
    2: flashcards.filter((c) => c.boxLevel === 2).length,
    3: flashcards.filter((c) => c.boxLevel === 3).length,
  };

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
            <Brain className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              6. არამეული ლექსიკისა და აბრევიატურების (ראשי תיבות) Spaced-Repetition ფლეშ-ბარათები
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-[#6B4226] text-[#FBF7F0] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ახალი ბარათი</span>
          </button>
        </div>

        {/* Leitner Spaced Repetition Box Filter */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'all', label: `ყველა (${flashcards.length})` },
            { id: '1', label: `ყუთი 1 · ახალი (${boxCounts[1]})` },
            { id: '2', label: `ყუთი 2 · ვსწავლობ (${boxCounts[2]})` },
            { id: '3', label: `ყუთი 3 · ვიცი (${boxCounts[3]})` },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBoxFilter(b.id);
                setCurrentCardIdx(0);
                setIsFlipped(false);
              }}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border truncate cursor-pointer transition-all ${
                boxFilter === b.id
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : isDark
                    ? 'bg-[#241810] border-[#5C3A21] text-[#EED9B9]'
                    : 'bg-[#EFE5D0] border-[#8B5A2B]/35 text-[#2C1A10]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <SearchableSelect
          label="ბარათების კატეგორია:"
          options={[
            { value: 'all', badgeHe: 'הכל', label: 'ყველა კატეგორია (არამეული + ראשי תיבות)' },
            { value: 'abbreviation', badgeHe: 'ראשי תיבות', label: 'თალმუდური აბრევიატურები (ת״ר, קמ״ל, ס״ד...)' },
            { value: 'aramaic', badgeHe: 'ארמית', label: 'არამეული საბაზისო ლექსიკა' },
            { value: 'logic', badgeHe: 'שקלא וטריא', label: 'სუგიის ლოგიკური ფორმულები' },
            { value: 'user-saved', badgeHe: 'שלי', label: 'დაფიდან შენახული პირადი სიტყვები' },
          ]}
          value={categoryFilter}
          onChange={(val) => {
            setCategoryFilter(val);
            setCurrentCardIdx(0);
            setIsFlipped(false);
          }}
          isDark={isDark}
          compact
        />

        {/* Optional Add Card Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTermHe.trim() || !newMeaningKa.trim()) return;
                onAddCustomFlashcard(
                  newTermHe.trim(),
                  newTranslitKa.trim() || newTermHe.trim(),
                  newMeaningKa.trim()
                );
                setNewTermHe('');
                setNewTranslitKa('');
                setNewMeaningKa('');
                setShowAddForm(false);
              }}
              className={`p-3 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#8B5A2B]/35'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  dir="rtl"
                  placeholder="ებრაული / არამეული სიტყვა..."
                  value={newTermHe}
                  onChange={(e) => setNewTermHe(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border bg-white text-[#2C1A10]"
                />
                <input
                  type="text"
                  placeholder="ქართული ტრანსლიტერაცია..."
                  value={newTranslitKa}
                  onChange={(e) => setNewTranslitKa(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border bg-white text-[#2C1A10]"
                />
                <input
                  type="text"
                  placeholder="ქართული მნიშვნელობა..."
                  value={newMeaningKa}
                  onChange={(e) => setNewMeaningKa(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border bg-white text-[#2C1A10]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold cursor-pointer"
              >
                ბარათის შენახვა Spaced-Repetition დასტაში
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Interactive 3D Flip Card */}
        {activeCard ? (
          <div className="space-y-2.5">
            <div
              onClick={() => setIsFlipped((v) => !v)}
              className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all select-none ${
                isDark
                  ? 'bg-gradient-to-b from-[#2B1B10] to-[#1D130D] border-[#C49A6C]/65 shadow-lg'
                  : 'bg-gradient-to-b from-[#FFFDF9] to-[#EFE4D0] border-[#6B4226]/55 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold opacity-75 mb-3">
                <span>
                  ბარათი {safeIdx + 1} / {filteredCards.length} · ყუთი #{activeCard.boxLevel}
                </span>
                <span className="flex items-center gap-1 text-[#C49A6C]">
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isFlipped ? 'უკანა მხარე (ახსნა)' : 'დააწკაპუნეთ გადასაბრუნებლად'}
                </span>
              </div>

              <div dir="rtl" className="font-serif text-2xl sm:text-3xl font-black mb-1.5">
                {activeCard.termHe}
              </div>
              {activeCard.expandedHe && (
                <div dir="rtl" className="font-serif text-sm font-bold text-[#C49A6C] mb-1">
                  ראשי תיבות: {activeCard.expandedHe}
                </div>
              )}
              <div className="text-xs font-extrabold opacity-85 mb-2">
                [{activeCard.translitKa}]
              </div>

              <AnimatePresence mode="wait">
                {isFlipped ? (
                  <motion.div
                    key="card-back"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="pt-3 border-t border-[#8B5A2B]/30 space-y-1.5"
                  >
                    <div className="text-sm sm:text-base font-extrabold text-[#C49A6C]">
                      {activeCard.meaningKa}
                    </div>
                    <div dir="rtl" className="font-serif text-xs opacity-90">
                      {activeCard.exampleHe}
                    </div>
                    <div className="text-xs opacity-85">{activeCard.exampleKa}</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="card-front-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs opacity-70 pt-2"
                  >
                    დააჭირეთ ბარათს ქართული განმარტებისა და მაგალითის სანახავად
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spaced Repetition Rating Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateFlashcardBox(activeCard.id, 1);
                  setIsFlipped(false);
                  setCurrentCardIdx((prev) => (prev + 1) % filteredCards.length);
                }}
                className="py-2 rounded-xl border border-rose-700/50 bg-rose-900/20 text-xs font-extrabold cursor-pointer hover:bg-rose-900/35"
              >
                ყუთი 1 · გასამეორებელია
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateFlashcardBox(activeCard.id, 2);
                  setIsFlipped(false);
                  setCurrentCardIdx((prev) => (prev + 1) % filteredCards.length);
                }}
                className="py-2 rounded-xl border border-[#C49A6C]/50 bg-[#6B4226]/30 text-xs font-extrabold cursor-pointer hover:bg-[#6B4226]/50"
              >
                ყუთი 2 · ვსწავლობ
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateFlashcardBox(activeCard.id, 3);
                  setIsFlipped(false);
                  setCurrentCardIdx((prev) => (prev + 1) % filteredCards.length);
                }}
                className="py-2 rounded-xl bg-[#2E6B3E] text-[#FBF7F0] text-xs font-extrabold cursor-pointer hover:bg-[#38804B]"
              >
                ყუთი 3 · სრულად ვიცი ✓
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-center py-6 opacity-75">ამ ყუთში ბარათები არ არის.</div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #7: „დაფ იომის“ (דף היומי) კალენდარი, სტრიქი და სიუმის ტრეკერი
 * ============================================================================ */
export const DafYomiCalendarAndSiyumPanel: React.FC<SharedPart2Props> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  completedDapim,
  onToggleDafComplete,
  onNavigateToDaf,
}) => {
  const [weekStartOffset, setWeekStartOffset] = useState<number>(-1);
  const [jumpFeedback, setJumpFeedback] = useState<string | null>(null);

  const todayItem = useMemo(() => getDafYomiSchedule(1, 0)[0], []);
  const schedule = useMemo(() => getDafYomiSchedule(7, weekStartOffset), [weekStartOffset]);

  const shasTotalAmudim = 5422; // 2,711 Dapim * 2 Amudim
  const shasPercent = Math.min(100, (completedDapim.length / shasTotalAmudim) * 100);

  const handleJumpToDaf = (targetTractateId: string, targetDafId: string, labelKa?: string) => {
    if (onNavigateToDaf) {
      onNavigateToDaf(targetTractateId, targetDafId);
    }
    setJumpFeedback(
      `გადასვლა შესრულდა: ${labelKa || `${targetTractateId} ${targetDafId}`}`
    );
    setTimeout(() => setJumpFeedback(null), 2800);

    if (typeof document !== 'undefined') {
      const scrollUp = () => {
        const anchor = document.getElementById('talmud-daf-folio-anchor');
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      requestAnimationFrame(scrollUp);
      setTimeout(scrollUp, 120);
    }
  };

  const downloadSiyumCertificate = () => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 850);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(1, '#E8D8BE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 850);

    ctx.strokeStyle = '#4A2E1B';
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, 1128, 778);
    ctx.strokeStyle = '#C49A6C';
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, 1096, 746);

    ctx.fillStyle = '#2C1A10';
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px "Frank Ruhl Libre", serif';
    ctx.fillText('תעודת סיום והוקרה • תלמוד בבלי', 600, 160);

    ctx.fillStyle = '#6B4226';
    ctx.font = 'bold 32px "Noto Sans Georgian", sans-serif';
    ctx.fillText('თალმუდ ბავლის შესწავლისა და სიუმის სერტიფიკატი', 600, 225);

    ctx.fillStyle = '#21160F';
    ctx.font = 'bold 28px "Noto Sans Georgian", sans-serif';
    ctx.fillText(`მიმდინარე ტრაქტატი: ${tractateNameKa} (${tractateNameHe}) • דף ${dafData.dafId}`, 600, 340);
    ctx.fillText(`შესწავლილი გვერდების რაოდენობა: ${completedDapim.length}`, 600, 410);

    ctx.font = 'bold 26px "Frank Ruhl Libre", serif';
    ctx.fillText('״הַדְרָן עָלָךְ וְהַדְרָךְ עֲלָן, דַּעְתָּן עָלָךְ וְדַעְתָּךְ עֲלָן״', 600, 520);

    ctx.font = '20px "Noto Sans Georgian", sans-serif';
    ctx.fillText(`თარიღი: ${new Date().toLocaleDateString('ka-GE')}`, 600, 650);

    const link = document.createElement('a');
    link.download = `Siyum-Certificate-${dafData.tractateId}-${dafData.dafId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isTodayActiveA =
    todayItem &&
    dafData.tractateId === todayItem.tractateId &&
    dafData.dafId === `${todayItem.dafNumber}a`;
  const isTodayActiveB =
    todayItem &&
    dafData.tractateId === todayItem.tractateId &&
    dafData.dafId === `${todayItem.dafNumber}b`;

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              7. „დაფ იომის“ (דף היומי) მე-14 ციკლის კალენდარი, სტრიქი და სიუმის ტრეკერი
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#6B4226] text-[#FBF7F0] text-[11px] font-extrabold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#EED9B9]" />
              <span>სტრიქი: {Math.max(1, completedDapim.length)} დღე</span>
            </span>
            <button
              type="button"
              onClick={downloadSiyumCertificate}
              className="px-2.5 py-1 rounded-lg border border-[#C49A6C] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer hover:bg-[#6B4226]/25"
            >
              <Award className="w-3.5 h-3.5 text-[#C49A6C]" />
              <span>სიუმის სერტიფიკატი (PNG)</span>
            </button>
          </div>
        </div>

        {jumpFeedback && (
          <div className="px-3 py-2 rounded-xl bg-emerald-900/35 border border-emerald-500/60 text-xs font-extrabold flex items-center justify-between gap-2 text-emerald-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{jumpFeedback}</span>
            </span>
            <span className="text-[10px] opacity-80">თალმუდის დაფი განახლდა ↑</span>
          </div>
        )}

        {/* Today's Daf Yomi Highlight Card */}
        {todayItem && (
          <div
            onClick={() =>
              handleJumpToDaf(
                todayItem.tractateId,
                todayItem.dafId,
                `${todayItem.tractateNameKa} ${todayItem.dafId} (დღის დაფი)`
              )
            }
            className={`p-3 rounded-xl border-2 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer transition-all ${
              isDark
                ? 'bg-[#281A11] border-[#C49A6C]/70 hover:border-[#FAF5EB]'
                : 'bg-[#EFE4D0] border-[#6B4226]/65 hover:border-[#3D2516]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-[#C49A6C]">
                  დღევანდელი გლობალური „დაფ იომი“ ({todayItem.dateStr}):
                </span>
                {(isTodayActiveA || isTodayActiveB) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold">
                    გახსნილია დაფზე ({dafData.dafId}) ✓
                  </span>
                )}
              </div>
              <div className="text-sm font-black mt-0.5">
                {todayItem.tractateNameKa} • დაფი {todayItem.dafNumber} ({todayItem.tractateNameHe} דף{' '}
                {todayItem.dafId})
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpToDaf(
                    todayItem.tractateId,
                    `${todayItem.dafNumber}a`,
                    `${todayItem.tractateNameKa} ${todayItem.dafNumber}a`
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95 ${
                  isTodayActiveA
                    ? 'bg-emerald-700 text-white border border-emerald-300'
                    : 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] border border-[#C49A6C]/50'
                }`}
              >
                <span>დღის დაფზე გადასვლა ({todayItem.dafNumber}a)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpToDaf(
                    todayItem.tractateId,
                    `${todayItem.dafNumber}b`,
                    `${todayItem.tractateNameKa} ${todayItem.dafNumber}b`
                  );
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95 ${
                  isTodayActiveB
                    ? 'bg-emerald-700 text-white border border-emerald-300'
                    : isDark
                      ? 'bg-[#3A2416] hover:bg-[#4E3220] text-[#FAF5EB] border border-[#C49A6C]/50'
                      : 'bg-[#D8C3A5] hover:bg-[#CBB08A] text-[#2C1A10] border border-[#6B4226]/50'
                }`}
                title="დღევანდელი დაფის უკანა გვერდზე (עמוד ב) გადასვლა"
              >
                <span>{todayItem.dafNumber}b (ע״ב)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Shas Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span>მთლიანი შასის პროგრესი (2,711 დაფი / 5,422 გვერდი):</span>
            <span className="tabular-nums">
              {completedDapim.length} შესწავლილი ({shasPercent.toFixed(2)}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#6B4226]/25 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6B4226] to-[#C49A6C] transition-all duration-500"
              style={{ width: `${Math.max(2, shasPercent)}%` }}
            />
          </div>
        </div>

        {/* Week Navigation Bar for Daf Yomi Schedule */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-extrabold opacity-85">
            დაფ იომის კალენდარი (დააწკაპუნეთ ნებისმიერ დღეს დაფზე გადასასვლელად):
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWeekStartOffset((prev) => prev - 7)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#EFE4D0] border-[#8B5A2B]/40 hover:border-[#6B4226] text-[#2C1A10]'
              }`}
            >
              ← წინა 7 დღე
            </button>
            {weekStartOffset !== -1 && (
              <button
                type="button"
                onClick={() => setWeekStartOffset(-1)}
                className="px-2.5 py-1 rounded-lg bg-[#6B4226] text-[#FBF7F0] text-[11px] font-extrabold cursor-pointer"
              >
                დღეს
              </button>
            )}
            <button
              type="button"
              onClick={() => setWeekStartOffset((prev) => prev + 7)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#EFE4D0] border-[#8B5A2B]/40 hover:border-[#6B4226] text-[#2C1A10]'
              }`}
            >
              შემდეგი 7 დღე →
            </button>
          </div>
        </div>

        {/* 7-Day Daf Yomi Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {schedule.map((day) => {
            const key = `${day.tractateId}:${day.dafId}`;
            const done = completedDapim.includes(key);
            const isCurrentA =
              dafData.tractateId === day.tractateId && dafData.dafId === `${day.dafNumber}a`;
            const isCurrentB =
              dafData.tractateId === day.tractateId && dafData.dafId === `${day.dafNumber}b`;
            const isCurrentDayOpen = isCurrentA || isCurrentB;

            return (
              <div
                key={`${day.dateStr}-${day.dayOffset}`}
                onClick={() =>
                  handleJumpToDaf(
                    day.tractateId,
                    day.dafId,
                    `${day.tractateNameKa} ${day.dafId}`
                  )
                }
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  isCurrentDayOpen
                    ? isDark
                      ? 'bg-[#342215] border-2 border-emerald-400 shadow-md'
                      : 'bg-[#E5D3B3] border-2 border-emerald-700 shadow-sm'
                    : day.dayOffset === 0
                      ? isDark
                        ? 'bg-[#2B1B10] border-[#C49A6C] hover:border-[#FAF5EB]'
                        : 'bg-[#EDE0C7] border-[#6B4226] hover:border-[#2C1A10]'
                      : isDark
                        ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C]'
                        : 'bg-[#F5EBD6] border-[#CBB89D] hover:border-[#6B4226]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold opacity-80">
                      {day.dayOffset === -1
                        ? `გუშინ (${day.dateStr})`
                        : day.dayOffset === 0
                          ? `დღეს (${day.dateStr})`
                          : day.dayOffset === 1
                            ? `ხვალ (${day.dateStr})`
                            : day.dateStr}
                    </span>
                    {isCurrentDayOpen && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-700 text-white text-[9px] font-extrabold">
                        გახსნილია ({dafData.dafId}) ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold truncate mt-0.5">
                    {day.tractateNameKa} {day.dafId} ({day.tractateNameHe})
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDafComplete(key);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      done
                        ? 'bg-[#2E6B3E] text-white'
                        : 'bg-[#6B4226]/20 border border-[#8B5A2B]/40 hover:bg-[#6B4226]/35'
                    }`}
                  >
                    {done ? 'შესწავლილია ✓' : 'მონიშვნა'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJumpToDaf(
                        day.tractateId,
                        `${day.dafNumber}a`,
                        `${day.tractateNameKa} ${day.dafNumber}a`
                      );
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer transition-all active:scale-95 ${
                      isCurrentA
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0]'
                    }`}
                    title={`გადასვლა: ${day.tractateNameKa} ${day.dafNumber}a`}
                  >
                    <span>{day.dafNumber}a</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJumpToDaf(
                        day.tractateId,
                        `${day.dafNumber}b`,
                        `${day.tractateNameKa} ${day.dafNumber}b`
                      );
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer transition-all active:scale-95 ${
                      isCurrentB
                        ? 'bg-emerald-700 text-white'
                        : isDark
                          ? 'bg-[#3A2416] hover:bg-[#4E3220] text-[#FAF5EB] border border-[#C49A6C]/45'
                          : 'bg-[#D8C3A5] hover:bg-[#CBB08A] text-[#2C1A10] border border-[#6B4226]/45'
                    }`}
                    title={`გადასვლა: ${day.tractateNameKa} ${day.dafNumber}b`}
                  >
                    <span>{day.dafNumber}b</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #8: ბრძენთა ქრონოლოგიური გენეალოგია და „რაბი–მოწაფის“ ინტერაქტიული გრაფი
 * ============================================================================ */
export const SageDynastyNetworkPanel: React.FC<SharedPart2Props> = ({
  isDark,
  onOpenFullscreen,
}) => {
  const [eraFilter, setEraFilter] = useState<string>('all');

  const visibleSages =
    eraFilter === 'all'
      ? SAGE_DYNASTY_NODES
      : SAGE_DYNASTY_NODES.filter((s) => s.eraCategory === eraFilter);

  return (
    <div className="space-y-3">
      <div
        className={`p-3 rounded-xl border space-y-2.5 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#CBB89D] text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            8. ბრძენთა ქრონოლოგიური გენეალოგია და „რაბი–მოწაფის“ გრაფი (שלשלת הקבלה)
          </span>
        </div>
        <SearchableSelect
          label="ეპოქისა და თაობის ფილტრი:"
          options={[
            { value: 'all', badgeHe: 'כל הדורות', label: 'ყველა ეპოქა (თანაიმი → ამორაიმი → რიშონიმი)' },
            { value: 'tannaim', badgeHe: 'תנאים', label: 'თანაიმი — მიშნის ბრძენნი (ერეც ისრაელი)' },
            { value: 'amoraim', badgeHe: 'אמוראים', label: 'ამორაიმი — გემარის ბრძენნი (ტვერია და ბაბილონი)' },
            { value: 'rishonim', badgeHe: 'ראשונים', label: 'რიშონიმი — რაში და თოსაფოთი' },
          ]}
          value={eraFilter}
          onChange={setEraFilter}
          isDark={isDark}
          compact
        />
      </div>

      {visibleSages.map((sage) => (
        <div
          key={sage.id}
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
            <div>
              <div className="text-xs font-extrabold">{sage.nameKa}</div>
              <div className="text-[11px] opacity-80">
                {sage.generationLabelKa} · {sage.academyKa} ({sage.regionKa})
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span dir="rtl" className="font-serif text-base font-bold text-[#C49A6C]">
                {sage.nameHe}
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: `${sage.nameKa} (${sage.nameHe})`,
                    subtitle: `${sage.generationLabelKa} • ${sage.academyKa}`,
                    hebrewText: sage.famousMaximHe,
                    georgianText: `${sage.titleKa}\n\n• მასწავლებლები: ${sage.teachersKa.join(', ')}\n• მოწაფეები: ${sage.disciplesKa.join(', ')}\n• ბარ-ფლუგთა (ოპონენტი): ${sage.barPlugtaKa}\n\nსწავლება:\n${sage.famousMaximKa}\n\nროლი მიმდინარე დაფზე:\n${sage.roleOnCurrentDafKa}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-[#6B4226]/15 border border-[#8B5A2B]/30">
              <div className="font-extrabold text-[#C49A6C]">მასწავლებლები (רבותיו):</div>
              <div>{sage.teachersKa.join(' • ')}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#6B4226]/15 border border-[#8B5A2B]/30">
              <div className="font-extrabold text-[#C49A6C]">მოწაფეები (תלמידיו):</div>
              <div>{sage.disciplesKa.join(' • ')}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#6B4226]/15 border border-[#8B5A2B]/30">
              <div className="font-extrabold text-[#C49A6C]">ბარ-ფლუგთა (בר פלוגתא):</div>
              <div>{sage.barPlugtaKa}</div>
            </div>
          </div>

          <div className="text-xs leading-relaxed">
            <strong>როლი დაფზე:</strong> {sage.roleOnCurrentDafKa}
          </div>
          <div className="p-2.5 rounded-xl bg-[#6B4226]/10 border border-[#8B5A2B]/25 text-xs">
            <div dir="rtl" className="font-serif font-bold mb-0.5">
              {sage.famousMaximHe}
            </div>
            <div className="opacity-90">{sage.famousMaximKa}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
 * FEATURE #9: ხელნაწერთა ვარიანტებისა (דקדוקי סופרים) და „ხიდუშების“ სტუდია
 * ============================================================================ */
export const ManuscriptsAndChiddushimStudioPanel: React.FC<SharedPart2Props> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  notes,
}) => {
  const [chiddushTitle, setChiddushTitle] = useState<string>(
    `ხიდუში და წყაროთა ფურცელი — ${tractateNameKa} ${dafData.dafId}`
  );
  const [chiddushBody, setChiddushBody] = useState<string>('');
  const [copiedSheet, setCopiedSheet] = useState<boolean>(false);

  const compiledSourceSheetText = useMemo(() => {
    const mishnahPart = dafData.mishnah
      .map((m) => `${m.hebrewText}\nქართული: ${sanitizeGeorgianText(m.translationKa)}`)
      .join('\n\n');
    const gemaraPart = dafData.gemara
      .slice(0, 3)
      .map((g) => `${g.hebrewText}\nქართული: ${sanitizeGeorgianText(g.translationKa)}`)
      .join('\n\n');
    const notesPart =
      notes.length > 0
        ? notes.map((n, i) => `${i + 1}. [${n.word}]: ${n.noteText}`).join('\n')
        : 'პირადი შენიშვნები ჯერ არ არის დამატებული.';

    return `===================================================
${chiddushTitle}
מסכת ${tractateNameHe} דף ${dafData.dafId} • ${tractateNameKa} ${dafData.dafId}
===================================================

[I. მიშნა • משנה]
${mishnahPart}

[II. გემარა • גמרא]
${gemaraPart}

[III. პირადი ხიდუში და ანალიზი • חידושי תורה]
${chiddushBody || 'ჩაწერეთ თქვენი ჰალახური ან აგადური ანალიზი ზემოთ მოცემულ ველში...'}

[IV. შენიშვნები • הגהות]
${notesPart}
`;
  }, [chiddushTitle, chiddushBody, dafData, tractateNameHe, tractateNameKa, notes]);

  const handleDownloadSourceSheet = () => {
    if (typeof document === 'undefined') return;
    const blob = new Blob([compiledSourceSheetText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daf-Mekorot-${dafData.tractateId}-${dafData.dafId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-2 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            9. ხელნაწერთა ვარიანტებისა (דקדוקי סופרים) და „ხიდუშების“ საექსპორტო სტუდია
          </span>
        </div>
        <p className="text-xs opacity-85">
          შეადარეთ ვილნის ბეჭდური ტექსტი უძველეს ხელნაწერებს (მიუნხენის კოდექსი 95, ვატიკანისა და
          ოქსფორდის ხელნაწერები) და მოამზადეთ საკუთარი სასწავლო ფურცელი (דף מקורות) ჩამოსატვირთად.
        </p>
      </div>

      {/* Part A: Manuscript Variants */}
      {MANUSCRIPT_VARIANTS.map((ms) => (
        <div
          key={ms.id}
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[#C49A6C]">{ms.sectionLabelKa}</span>
            <span dir="rtl" className="text-xs font-serif font-bold">
              {ms.manuscriptSourceHe}
            </span>
          </div>
          <div className="text-[11px] font-bold opacity-85">{ms.manuscriptSourceKa}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="text-[10px] font-extrabold opacity-75 mb-1">
                ვილნის ბეჭდური გამოცემა (דפוס וילנא):
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold">
                {ms.vilnaPrintedHe}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#281A11] border-[#C49A6C]/50' : 'bg-[#EDE0C7] border-[#6B4226]/45'
              }`}
            >
              <div className="text-[10px] font-extrabold text-[#C49A6C] mb-1">
                ხელნაწერის გირსა (נוסח כתב היד):
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold">
                {ms.manuscriptReadingHe}
              </div>
            </div>
          </div>

          <div className="text-xs leading-relaxed">{ms.differenceAnalysisKa}</div>
          <div className="text-[11px] font-semibold text-[#C49A6C]">
            <strong>ტექსტოლოგიური მნიშვნელობა:</strong> {ms.halachicOrTextualImpactKa}
          </div>
        </div>
      ))}

      {/* Part B: Chiddushim & Source Sheet Studio */}
      <div
        className={`p-3.5 rounded-2xl border space-y-2.5 ${
          isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
        }`}
      >
        <div className="text-xs font-extrabold text-[#C49A6C]">
          სასწავლო ფურცლისა (דף מקורות) და პირადი ხიდუშის გენერატორი:
        </div>
        <input
          type="text"
          value={chiddushTitle}
          onChange={(e) => setChiddushTitle(e.target.value)}
          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
            isDark
              ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
              : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
          }`}
        />
        <textarea
          rows={3}
          value={chiddushBody}
          onChange={(e) => setChiddushBody(e.target.value)}
          placeholder="ჩაწერეთ თქვენი ხიდუში, შეჯამება ან შიურის გეგმა..."
          className={`w-full px-3 py-2 rounded-xl text-xs border ${
            isDark
              ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
              : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
          }`}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(compiledSourceSheetText);
              setCopiedSheet(true);
              setTimeout(() => setCopiedSheet(false), 1800);
            }}
            className="px-3 py-2 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSheet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSheet ? 'დაკოპირდა!' : 'წყაროთა ფურცლის კოპირება'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSourceSheet}
            className="px-3 py-2 rounded-xl border border-[#C49A6C] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-[#6B4226]/20"
          >
            <Download className="w-3.5 h-3.5 text-[#C49A6C]" />
            <span>ჩამოტვირთვა (.TXT დოკუმენტი)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
