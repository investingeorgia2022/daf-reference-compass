// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Search,
  Sparkles,
  Scale,
  Compass,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Filter,
} from 'lucide-react';
import { WindowsWindowControls } from './WindowsWindowControls';
import { SearchableSelect } from './SearchableSelect';
import { SacredBookItem, numberToHebrewGematria } from '../data/tanakhAndHalakhaData';
import {
  YalkutChelekId,
  YalkutTopicCategoryId,
  YALKUT_YOSEF_KITZUR_BOOKS,
  YALKUT_YOSEF_CHELEK_TABS,
  YALKUT_YOSEF_TOPIC_CATEGORIES,
  YALKUT_SMART_QUICK_QUESTIONS,
  YALKUT_YOSEF_CURATED_SIMANIM,
  getRecommendedYalkutSimanByCurrentHour,
  getOrBuildYalkutYosefSiman,
  YalkutCuratedSiman,
} from '../data/yalkutYosefKitzurData';

interface YalkutYosefKitzurSmartHubProps {
  isDark: boolean;
  currentBook: SacredBookItem;
  selectedChapter: number;
  onSelectBookAndSiman: (bookId: string, simanNum: number) => void;
  onNavigateToTalmudDaf?: (tractateId: string, dafId: string, sectionId?: string) => void;
  onOpenDailyTwoHalakhot?: () => void;
  showClassicDafBelow: boolean;
  onToggleShowClassicDafBelow: (show: boolean) => void;
}

export const YalkutYosefKitzurSmartHub: React.FC<YalkutYosefKitzurSmartHubProps> = ({
  isDark,
  currentBook,
  selectedChapter,
  onSelectBookAndSiman,
  onNavigateToTalmudDaf,
  onOpenDailyTwoHalakhot,
  showClassicDafBelow,
  onToggleShowClassicDafBelow,
}) => {
  const [selectedChelek, setSelectedChelek] = useState<YalkutChelekId | 'all'>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<YalkutTopicCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [directSimanInput, setDirectSimanInput] = useState<string>(String(selectedChapter));
  const [isSmartHubMinimized, setIsSmartHubMinimized] = useState(false);
  const [isSmartHubMaximized, setIsSmartHubMaximized] = useState(false);
  const [isSimanCardMinimized, setIsSimanCardMinimized] = useState(false);
  const [isSimanCardMaximized, setIsSimanCardMaximized] = useState(false);
  const [expandedSeifIndex, setExpandedSeifIndex] = useState<number | null>(null);

  const recommendedSiman = useMemo(() => getRecommendedYalkutSimanByCurrentHour(), []);

  const activeSimanData: YalkutCuratedSiman = useMemo(
    () => getOrBuildYalkutYosefSiman(currentBook, selectedChapter),
    [currentBook, selectedChapter]
  );

  const filteredCuratedSimanim = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return YALKUT_YOSEF_CURATED_SIMANIM.filter((item) => {
      if (selectedChelek !== 'all' && item.chelekId !== selectedChelek) return false;
      if (selectedTopicId !== 'all' && item.topicCategoryId !== selectedTopicId) return false;
      if (!q) return true;
      const hay = [
        item.titleHe,
        item.titleKa,
        item.summaryKa,
        item.simanHe,
        String(item.simanNum),
        ...item.keywords,
        ...item.seifim.map((s) => `${s.titleKa} ${s.hebrewText} ${s.translationKa} ${s.halakhaLemaasehKa}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [selectedChelek, selectedTopicId, searchQuery]);

  const handleJumpToCuratedSiman = (siman: YalkutCuratedSiman) => {
    setDirectSimanInput(String(siman.simanNum));
    onSelectBookAndSiman(siman.bookId, siman.simanNum);
  };

  const handleDirectSimanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(directSimanInput.trim(), 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      const maxCh = currentBook.chaptersCount || 697;
      const clamped = Math.min(maxCh, Math.max(1, parsed));
      let targetBookId = currentBook.id;
      if (currentBook.id.startsWith('Yalkut_Yosef_Kitzur_OC')) {
        if (clamped <= 241) targetBookId = 'Yalkut_Yosef_Kitzur_OC_1';
        else if (clamped <= 428) targetBookId = 'Yalkut_Yosef_Kitzur_OC_2';
        else targetBookId = 'Yalkut_Yosef_Kitzur_OC_3';
      }
      onSelectBookAndSiman(targetBookId, clamped);
    }
  };

  return (
    <div
      className={`${
        isSmartHubMaximized ? 'fixed inset-2 z-[165] overflow-y-auto' : 'w-full'
      } rounded-2xl border transition-all duration-300 shadow-lg overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-[#291B12] via-[#21150E] to-[#1A100A] border-amber-500/40 text-[#FAF5EB]'
          : 'bg-gradient-to-b from-[#F9F1E1] via-[#F2E5CE] to-[#EAD7B7] border-[#8B5A2B]/45 text-[#23150C]'
      }`}
    >
      {/* TOP ROYAL BANNER FOR YALKUT YOSEF - KITZUR SHULCHAN ARUCH */}
      <div
        className={`px-3.5 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-gradient-to-r from-[#3B2313] via-[#4D2E18] to-[#2E1B0E] border-amber-500/35'
            : 'bg-gradient-to-r from-[#5C3A21] via-[#704628] to-[#4A2E19] border-[#8B5A2B]/40 text-[#FAF5EB]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-[#1E1209] flex items-center justify-center font-serif font-black text-base shadow-md shrink-0 border border-amber-200">
            י״י
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                dir="rtl"
                className="font-serif text-base sm:text-lg font-black text-amber-300 tracking-wide"
              >
                ילקוט יוסף - קיצור שולחן ערוך
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#FAF5EB]">
                • იალკუტ იოსეფი - კიცურ შულხან არუხი
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 border border-amber-300/50 text-amber-200">
                ჭკვიანი ნავიგაცია
              </span>
            </div>
            <p className="text-[11px] text-[#E8D8BE] truncate">
              მარან რაბი ოვადია იოსეფისა (זצוק״ל) და რიშონ ლეციონ რაბი იცხაკ იოსეფის (שליט״א) პრაქტიკული ჰალახის კოდექსი
            </p>
          </div>
        </div>

        {/* Time-of-Day Smart Halakha Recommender + Daily 2 Halakhot + View Mode Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {onOpenDailyTwoHalakhot && (
            <button
              type="button"
              onClick={onOpenDailyTwoHalakhot}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-300 shadow-sm hover:brightness-105 flex items-center gap-1.5 cursor-pointer transition-all"
              title="ყოველდღიური ორი ჰალახის ეკრანზე გადასვლა (שתי הלכות בכל יום)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>ყოველდღიური 2 ჰალახა</span>
              <span dir="rtl" className="font-serif font-black">
                (ב׳ הלכות)
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleJumpToCuratedSiman(recommendedSiman)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-[#1F1209] border border-amber-200 shadow-sm hover:brightness-105 flex items-center gap-1.5 cursor-pointer transition-all"
            title="დღისა და საათის შესაბამისი ჰალახის მყისიერი გახსნა"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>დღის ჰალახა:</span>
            <span dir="rtl" className="font-serif font-black">
              {recommendedSiman.simanHe}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleShowClassicDafBelow(!showClassicDafBelow)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
              showClassicDafBelow
                ? 'bg-emerald-700/90 text-white border-emerald-400/60'
                : 'bg-[#2B1B10]/80 text-[#FAF5EB] border-[#C49A6C]/50 hover:bg-[#3A2416]'
            }`}
            title="კლასიკური დაფის (צורת הדף) ჩვენება ან დამალვა ჭკვიანი ნავიგატორის ქვემოთ"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>{showClassicDafBelow ? 'צורת הדף: ჩართ.' : 'צורת הדף: გამორთ.'}</span>
          </button>

          <WindowsWindowControls
            isMinimized={isSmartHubMinimized}
            onToggleMinimize={() => setIsSmartHubMinimized((v) => !v)}
            isMaximized={isSmartHubMaximized}
            onToggleMaximize={() => setIsSmartHubMaximized((v) => !v)}
            isFullScreen={isSmartHubMaximized}
            onToggleFullScreen={() => setIsSmartHubMaximized((v) => !v)}
            isDark={true}
            size="sm"
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isSmartHubMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 space-y-3.5">
              {/* 1) 4-CHELEK SMART TABS (אורח חיים • יורה דעה • אבן העזר • חושן משפט) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {YALKUT_YOSEF_CHELEK_TABS.map((tab) => {
                  const isActive = selectedChelek === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedChelek(tab.id);
                        setSelectedTopicId('all');
                        if (tab.id !== 'all') {
                          const firstMatchingSiman = YALKUT_YOSEF_CURATED_SIMANIM.find(
                            (s) => s.chelekId === tab.id
                          );
                          onSelectBookAndSiman(
                            tab.defaultBookId,
                            firstMatchingSiman ? firstMatchingSiman.simanNum : 1
                          );
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-2 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 text-[#1E1209] border-amber-200 shadow-md scale-[1.01]'
                          : isDark
                            ? 'bg-[#2C1D13] hover:bg-[#3A271A] border-[#C49A6C]/35 text-[#FAF5EB]'
                            : 'bg-[#FAF4E8] hover:bg-[#EFE2C9] border-[#8B5A2B]/35 text-[#2C1A10]'
                      }`}
                    >
                      <span
                        dir="rtl"
                        className={`font-serif text-xs sm:text-sm font-black px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-[#1E1209]/15 text-[#1E1209]'
                            : isDark
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-[#E5D3B3] text-[#4A2C17]'
                        }`}
                      >
                        {tab.labelHe}
                      </span>
                      <span>{tab.labelKa}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2) SMART SEARCH + DIRECT SIMAN JUMPER + VOLUME SELECTOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                {/* Search Input */}
                <div className="lg:col-span-6 relative">
                  <Search className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ჭკვიანი ძიება იალკუტ იოსეფში: სიმანი (89, 263), თემა (ხორცი და რძე, თფილინი, შაბათი, מוקצה)..."
                    className={`w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm font-bold border outline-none transition-all ${
                      isDark
                        ? 'bg-[#170F0A] border-[#C49A6C]/45 text-[#FAF5EB] placeholder-[#C49A6C]/60 focus:border-amber-400'
                        : 'bg-[#FFFDF9] border-[#8B5A2B]/45 text-[#1E1209] placeholder-[#6E472B]/65 focus:border-[#5C3A21]'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer"
                    >
                      გასუფთავება
                    </button>
                  )}
                </div>

                {/* Volume / Chelek Book Selector */}
                <div className="lg:col-span-3">
                  <SearchableSelect
                    value={currentBook.id}
                    onChange={(val) => onSelectBookAndSiman(val, 1)}
                    options={YALKUT_YOSEF_KITZUR_BOOKS.map((b) => ({
                      value: b.id,
                      badgeHe: b.nameHe,
                      label: `${b.nameHe} — ${b.subGroupKa}`,
                    }))}
                    isDark={isDark}
                    searchPlaceholder="აირჩიეთ ტომი..."
                  />
                </div>

                {/* Direct Siman Jumper */}
                <form
                  onSubmit={handleDirectSimanSubmit}
                  className="lg:col-span-3 flex items-center gap-1.5"
                >
                  <div
                    className={`flex-1 flex items-center rounded-xl border px-2.5 py-1.5 ${
                      isDark
                        ? 'bg-[#170F0A] border-[#C49A6C]/45'
                        : 'bg-[#FFFDF9] border-[#8B5A2B]/45'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold opacity-75 mr-1.5 shrink-0">
                      სიმანი (סימן):
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={currentBook.chaptersCount || 697}
                      value={directSimanInput}
                      onChange={(e) => setDirectSimanInput(e.target.value)}
                      className="w-full text-xs sm:text-sm font-black bg-transparent outline-none text-center"
                    />
                    <span
                      dir="rtl"
                      className="font-serif text-xs font-black text-amber-500 shrink-0 ml-1"
                    >
                      {numberToHebrewGematria(parseInt(directSimanInput, 10) || selectedChapter)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-b from-[#6B4226] to-[#4A2C17] text-[#FAF5EB] border border-amber-400/60 hover:brightness-110 cursor-pointer shrink-0 shadow-sm"
                  >
                    გადასვლა
                  </button>
                </form>
              </div>

              {/* 3) SMART QUICK HALAKHA QUESTION PILLS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold opacity-85">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>სწრაფი ჰალახური კითხვები და ყველაზე ხშირი სიმანები:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {YALKUT_SMART_QUICK_QUESTIONS.map((qItem) => {
                    const isCurrent =
                      currentBook.id === qItem.bookId && selectedChapter === qItem.simanNum;
                    return (
                      <button
                        key={qItem.id}
                        type="button"
                        onClick={() => {
                          setDirectSimanInput(String(qItem.simanNum));
                          onSelectBookAndSiman(qItem.bookId, qItem.simanNum);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-[#1E1209] border-amber-300 shadow-sm'
                            : isDark
                              ? 'bg-[#25180F] hover:bg-[#352216] border-[#C49A6C]/35 text-[#FAF5EB]'
                              : 'bg-[#FFFDF8] hover:bg-[#F3E5CE] border-[#8B5A2B]/35 text-[#2C1A10]'
                        }`}
                      >
                        <span>{qItem.icon}</span>
                        <span>{qItem.labelKa}</span>
                        <span
                          dir="rtl"
                          className={`font-serif text-[10px] font-black px-1.5 py-0.2 rounded ${
                            isCurrent
                              ? 'bg-[#1E1209]/15 text-[#1E1209]'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {qItem.labelHe.split('•')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4) 8-CATEGORY SMART TOPIC TREE */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-1.5 pt-1">
                {YALKUT_YOSEF_TOPIC_CATEGORIES.map((cat) => {
                  const isSelected = selectedTopicId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(cat.id);
                        if (cat.chelekId !== 'all') {
                          setSelectedChelek(cat.chelekId);
                        }
                        const firstInTopic = YALKUT_YOSEF_CURATED_SIMANIM.find(
                          (s) => cat.id === 'all' || s.topicCategoryId === cat.id
                        );
                        if (firstInTopic) {
                          handleJumpToCuratedSiman(firstInTopic);
                        }
                      }}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#6B4226] to-[#3E2412] text-[#FAF5EB] border-amber-400 shadow-md ring-1 ring-amber-400/50'
                          : isDark
                            ? 'bg-[#1E140D]/90 hover:bg-[#2C1D13] border-[#C49A6C]/30 text-[#FAF5EB]'
                            : 'bg-[#FBF6EC] hover:bg-[#F1E4CE] border-[#8B5A2B]/30 text-[#23150C]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">{cat.icon}</span>
                        <span
                          dir="rtl"
                          className={`font-serif text-[10px] font-black px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-amber-400/25 text-amber-200'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {cat.simanimRangeHe}
                        </span>
                      </div>
                      <div className="text-[11px] font-extrabold leading-tight line-clamp-2">
                        {cat.titleKa}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 5) CURATED SIMANIM STRIP + ACTIVE SIMAN SMART HALAKHA EXPLORER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                {/* Left Column: Matching Simanim List */}
                <div
                  className={`lg:col-span-4 rounded-2xl border p-2.5 flex flex-col gap-2 max-h-[430px] overflow-y-auto ${
                    isDark
                      ? 'bg-[#170F0A]/90 border-[#C49A6C]/35'
                      : 'bg-[#FFFDF8] border-[#8B5A2B]/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#8B5A2B]/25">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <Compass className="w-4 h-4 text-amber-500" />
                      <span>სიმანების ჭკვიანი სარჩევი ({filteredCuratedSimanim.length})</span>
                    </div>
                    <span dir="rtl" className="font-serif text-xs font-bold text-amber-500">
                      סימנים נבחרים
                    </span>
                  </div>

                  {filteredCuratedSimanim.length === 0 ? (
                    <div className="p-4 text-center text-xs opacity-75">
                      ამ ფილტრით სიმანი ვერ მოიძებნა. სცადეთ სხვა საძიებო სიტყვა ან აირჩიეთ „ყველა თემა“.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredCuratedSimanim.map((simItem) => {
                        const isSelected =
                          simItem.simanNum === selectedChapter &&
                          simItem.chelekId === activeSimanData.chelekId;
                        return (
                          <button
                            key={simItem.id}
                            type="button"
                            onClick={() => handleJumpToCuratedSiman(simItem)}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent border-amber-400 shadow-sm'
                                : isDark
                                  ? 'bg-[#22160F] hover:bg-[#2F1F15] border-[#5C3A21]/50'
                                  : 'bg-[#F8F1E3] hover:bg-[#EFE2C8] border-[#D5C3A1]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  dir="rtl"
                                  className="font-serif text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-[#1E1209]"
                                >
                                  {simItem.simanHe}
                                </span>
                                <span
                                  dir="rtl"
                                  className="font-serif text-xs font-bold text-amber-600 dark:text-amber-300 truncate"
                                >
                                  {simItem.titleHe}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold mt-1 leading-snug">
                                {simItem.titleKa}
                              </p>
                              <p className="text-[11px] opacity-75 line-clamp-1 mt-0.5">
                                {simItem.summaryKa}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Active Siman Interactive Halakha & Se'ifim Breakdown */}
                <div
                  className={`${
                    isSimanCardMaximized ? 'fixed inset-2 z-[170] overflow-y-auto' : 'lg:col-span-8'
                  } rounded-2xl border p-3 sm:p-4 flex flex-col gap-3 ${
                    isDark
                      ? 'bg-[#1D130C]/95 border-amber-500/40'
                      : 'bg-[#FFFDF9] border-[#8B5A2B]/40'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-[#8B5A2B]/30">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const prevSim = Math.max(1, selectedChapter - 1);
                            setDirectSimanInput(String(prevSim));
                            onSelectBookAndSiman(currentBook.id, prevSim);
                          }}
                          className="h-7 px-2 rounded-lg border border-[#C49A6C]/45 hover:bg-amber-500/20 text-[10.5px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                          title="წინა სიმანი"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                          <span>წინა</span>
                        </button>
                        <span
                          dir="rtl"
                          className="font-serif text-sm sm:text-base font-black px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-[#1E1209] shadow-sm"
                        >
                          {activeSimanData.simanHe}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSim = Math.min(
                              currentBook.chaptersCount || 697,
                              selectedChapter + 1
                            );
                            setDirectSimanInput(String(nextSim));
                            onSelectBookAndSiman(currentBook.id, nextSim);
                          }}
                          className="h-7 px-2 rounded-lg border border-[#C49A6C]/45 hover:bg-amber-500/20 text-[10.5px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                          title="შემდეგი სიმანი"
                        >
                          <span>შემდეგი</span>
                          <ChevronLeft className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <h3
                          dir="rtl"
                          className="font-serif text-base sm:text-lg font-black text-amber-600 dark:text-amber-300"
                        >
                          {activeSimanData.titleHe}
                        </h3>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold mt-1">
                        {activeSimanData.titleKa}
                      </h4>
                      <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                        {activeSimanData.summaryKa}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="hidden sm:flex px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>הלכה למעשה • პრაქტიკული პსაკი</span>
                      </span>
                      <WindowsWindowControls
                        isMinimized={isSimanCardMinimized}
                        onToggleMinimize={() => setIsSimanCardMinimized((v) => !v)}
                        isMaximized={isSimanCardMaximized}
                        onToggleMaximize={() => setIsSimanCardMaximized((v) => !v)}
                        isFullScreen={isSimanCardMaximized}
                        onToggleFullScreen={() => setIsSimanCardMaximized((v) => !v)}
                        isDark={isDark}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Se'ifim Cards */}
                  {!isSimanCardMinimized && (
                  <div className="space-y-2.5">
                    {activeSimanData.seifim.map((seif, idx) => {
                      const isExpanded = expandedSeifIndex === null || expandedSeifIndex === idx;
                      return (
                        <div
                          key={`${activeSimanData.id}-seif-${seif.seifNum}`}
                          className={`rounded-xl border p-3 transition-all ${
                            isDark
                              ? 'bg-[#261910] border-[#C49A6C]/35'
                              : 'bg-[#FBF6EB] border-[#C9B38C]'
                          }`}
                        >
                          <div
                            onClick={() =>
                              setExpandedSeifIndex((prev) => (prev === idx ? null : idx))
                            }
                            className="flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                dir="rtl"
                                className="font-serif text-xs font-black px-2 py-0.5 rounded bg-[#5C3A21] text-amber-300"
                              >
                                {seif.seifHe}
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold">
                                {seif.titleKa}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-500">
                              {isExpanded ? 'სრულად ჩანს' : 'გაშლა'}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 space-y-2.5">
                              {/* Original Hebrew Text from Kitzur Shulchan Aruch Yalkut Yosef */}
                              <div
                                dir="rtl"
                                className={`p-2.5 rounded-xl font-serif text-base sm:text-lg leading-relaxed border ${
                                  isDark
                                    ? 'bg-[#19100A] border-[#5C3A21]/60 text-[#FAF5EB]'
                                    : 'bg-[#FFFDF9] border-[#D5C3A1] text-[#181009]'
                                }`}
                              >
                                {seif.hebrewText}
                              </div>

                              {/* Georgian Translation */}
                              <div className="text-xs sm:text-sm leading-relaxed font-medium">
                                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                  ქართული განმარტება:{' '}
                                </span>
                                {seif.translationKa}
                              </div>

                              {/* Practical Halakha L'Maaseh Box */}
                              <div
                                className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                  isDark
                                    ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-100'
                                    : 'bg-emerald-50 border-emerald-600/35 text-emerald-950'
                                }`}
                              >
                                <div className="font-extrabold flex items-center gap-1.5 mb-0.5 text-emerald-600 dark:text-emerald-300">
                                  <Scale className="w-3.5 h-3.5 shrink-0" />
                                  <span>הלכה למעשה — პრაქტიკული ჰალახური დასკვნა:</span>
                                </div>
                                <p>{seif.halakhaLemaasehKa}</p>
                              </div>

                              {/* Minhag Comparison (Sephardic vs Ashkenazi) if available */}
                              {seif.minhagComparisonKa && (
                                <div
                                  className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                    isDark
                                      ? 'bg-amber-950/30 border-amber-500/35 text-amber-100'
                                      : 'bg-amber-50/90 border-amber-600/35 text-[#3B2313]'
                                  }`}
                                >
                                  <span className="font-extrabold text-amber-600 dark:text-amber-300">
                                    🔍 მინჰაგების შედარება (ספרד מול אשכנז):{' '}
                                  </span>
                                  {seif.minhagComparisonKa}
                                </div>
                              )}

                              {/* Footer Row: Maran Sources & Direct Talmud Daf Jump */}
                              <div className="pt-1.5 border-t border-[#8B5A2B]/25 flex flex-wrap items-center justify-between gap-2">
                                <div className="text-[11px] opacity-85 flex items-center gap-1.5 flex-wrap">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="font-extrabold">წყარო:</span>
                                  <span dir="rtl" className="font-serif font-bold text-amber-600 dark:text-amber-300">
                                    {seif.maranSourceHe}
                                  </span>
                                  <span>({seif.maranSourceKa})</span>
                                </div>

                                {seif.talmudLink && onNavigateToTalmudDaf && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onNavigateToTalmudDaf(
                                        seif.talmudLink!.tractateId,
                                        seif.talmudLink!.dafId,
                                        'daf-section-gemara'
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-[#6B4226] to-[#4A2C17] text-[#FAF5EB] border border-amber-400/60 hover:brightness-110 flex items-center gap-1 cursor-pointer shadow-sm"
                                  >
                                    <span>📖 გემარის წყარო: {seif.talmudLink.labelKa}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
