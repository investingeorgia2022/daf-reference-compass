// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Scale,
  MapPin,
  Compass,
  Swords,
  BookOpen,
  Highlighter,
  Link2,
  Trash2,
  ArrowUpRight,
  Maximize2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { DafPageData } from '../types/talmud';
import {
  DebateDialogueTurn,
  DEFAULT_DEBATE_DIALOGUE,
  MACHLOKET_ARENA_DISPUTES,
  TALMUD_ATLAS_CITIES,
  TANAKH_IN_SHAS_CONCORDANCE,
  THIRTEEN_MIDDOT_HERMENEUTICS,
} from '../data/nextGenTwelveFeaturesData';
import { SearchableSelect } from './SearchableSelect';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';

export interface SharedPart3Props {
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
 * FEATURE #11: „ცოცხალი ბეთ-მიდრაში“ — მრავალხმიანი ხმოვანი დებატების თეატრი
 * ============================================================================ */
export const LiveBeitMidrashDebatePanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onHighlightSentence,
  onOpenFullscreen,
}) => {
  const [includeRashiTosafot, setIncludeRashiTosafot] = useState<boolean>(true);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedRate, setSpeedRate] = useState<number>(1.0);
  const timerRef = useRef<number | null>(null);

  const dynamicTurns: DebateDialogueTurn[] = useMemo(() => {
    const turns: DebateDialogueTurn[] = [];
    if (dafData.mishnah[0]) {
      turns.push({
        id: dafData.mishnah[0].id,
        role: 'tartzan',
        speakerTitleHe: 'תַּנָּא דְּמַתְנִיתִין (משנה)',
        speakerTitleKa: 'მიშნის თანაი (საწყისი კანონი)',
        hebrewText: dafData.mishnah[0].hebrewText,
        georgianText: sanitizeGeorgianText(
          dafData.mishnah[0].translationKa || dafData.mishnah[0].explanationKa
        ),
        pitch: 0.92,
        rate: 0.9,
        stageBadgeKa: 'მიშნა • საფუძველი',
      });
    }

    dafData.gemara.forEach((g, idx) => {
      const isQuestion = idx % 2 === 0;
      turns.push({
        id: g.id,
        role: isQuestion ? 'makshan' : 'tartzan',
        speakerTitleHe: isQuestion ? 'מַקְשָׁן (שואל הגמרא)' : 'תַּרְצָן (מתרץ הגמרא)',
        speakerTitleKa: isQuestion
          ? 'მაკშანი — კითხვის დამსმელი'
          : 'თარცანი — პასუხის გამცემი',
        hebrewText: g.hebrewText,
        georgianText: sanitizeGeorgianText(g.translationKa || g.explanationKa),
        pitch: isQuestion ? 1.14 : 0.86,
        rate: isQuestion ? 0.94 : 0.89,
        stageBadgeKa:
          g.sugyaStage?.labelKa || (isQuestion ? 'კუშია • კითხვა' : 'თერუცი • პასუხი'),
      });

      if (includeRashiTosafot && dafData.rashi[idx]) {
        const r = dafData.rashi[idx];
        turns.push({
          id: r.id,
          role: 'rashi',
          speakerTitleHe: `רש״י • ד״ה ${r.dibburHamatchil || ''}`,
          speakerTitleKa: `რაშის განმარტება (${r.dibburHamatchil || 'კომენტარი'})`,
          hebrewText: r.hebrewText,
          georgianText: sanitizeGeorgianText(r.translationKa || r.explanationKa),
          pitch: 1.0,
          rate: 0.88,
          stageBadgeKa: 'რაში • პშატი',
        });
      }

      if (includeRashiTosafot && dafData.tosafot[idx]) {
        const t = dafData.tosafot[idx];
        turns.push({
          id: t.id,
          role: 'tosafot',
          speakerTitleHe: `תוספות • ד״ה ${t.dibburHamatchil || ''}`,
          speakerTitleKa: `თოსაფოთის ანალიზი (${t.dibburHamatchil || 'დიალექტიკა'})`,
          hebrewText: t.hebrewText,
          georgianText: sanitizeGeorgianText(t.translationKa || t.explanationKa),
          pitch: 0.95,
          rate: 0.86,
          stageBadgeKa: 'თოსაფოთი • იუნი',
        });
      }
    });

    if (turns.length >= 2) return turns;
    return includeRashiTosafot
      ? DEFAULT_DEBATE_DIALOGUE
      : DEFAULT_DEBATE_DIALOGUE.filter((d) => d.role === 'makshan' || d.role === 'tartzan');
  }, [dafData, includeRashiTosafot]);

  const speakTurn = (turn: DebateDialogueTurn) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(turn.hebrewText);
      utter.lang = 'he-IL';
      utter.pitch = turn.pitch;
      utter.rate = Math.max(0.65, Math.min(1.5, turn.rate * speedRate));
      window.speechSynthesis.speak(utter);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }
    const currentTurn = dynamicTurns[activeTurnIdx];
    if (!currentTurn) {
      setIsPlaying(false);
      return;
    }
    onHighlightSentence(currentTurn.id);
    speakTurn(currentTurn);

    timerRef.current = window.setTimeout(() => {
      if (activeTurnIdx < dynamicTurns.length - 1) {
        setActiveTurnIdx((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, Math.round(5200 / speedRate));

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeTurnIdx, dynamicTurns, speedRate]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const roleStyleMap: Record<DebateDialogueTurn['role'], string> = {
    makshan: isDark
      ? 'border-rose-500/50 bg-rose-950/25 text-rose-200'
      : 'border-rose-700/45 bg-rose-50 text-rose-950',
    tartzan: isDark
      ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-200'
      : 'border-emerald-700/45 bg-emerald-50 text-emerald-950',
    rashi: isDark
      ? 'border-amber-500/50 bg-amber-950/25 text-amber-200'
      : 'border-amber-700/45 bg-amber-50 text-amber-950',
    tosafot: isDark
      ? 'border-sky-500/50 bg-sky-950/25 text-sky-200'
      : 'border-sky-700/45 bg-sky-50 text-sky-950',
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              11. „ცოცხალი ბეთ-მიდრაში“ — მრავალხმიანი ხმოვანი დებატების თეატრი ({tractateNameKa}{' '}
              {dafData.dafId})
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={includeRashiTosafot}
              onChange={(e) => {
                setIncludeRashiTosafot(e.target.checked);
                setActiveTurnIdx(0);
              }}
              className="accent-[#6B4226]"
            />
            <span>რაშისა და თოსაფოთის ხმების ჩართვა დიალოგში</span>
          </label>
        </div>

        <p className="text-xs opacity-85 leading-relaxed">
          სუგია იკითხება როლებში განსხვავებული ტემბრითა და ინტონაციით: <strong>მაკშანი</strong>{' '}
          (კითხვის დამსმელი), <strong>თარცანი</strong> (პასუხის გამცემი), <strong>რაში</strong> და{' '}
          <strong>თოსაფოთი</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-3.5 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'პაუზა' : 'დებატების გაშვება როლებში'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActiveTurnIdx(0);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="px-2.5 py-2 rounded-xl border border-[#8B5A2B]/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>თავიდან</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {[0.85, 1.0, 1.2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeedRate(spd)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                  speedRate === spd
                    ? 'bg-[#6B4226] text-[#FBF7F0]'
                    : 'bg-[#6B4226]/15 border border-[#8B5A2B]/30'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {dynamicTurns.map((turn, idx) => {
          const isCurrent = idx === activeTurnIdx;
          return (
            <div
              key={`${turn.id}-${idx}`}
              onClick={() => {
                setActiveTurnIdx(idx);
                onHighlightSentence(turn.id);
                speakTurn(turn);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'ring-2 ring-[#C49A6C] shadow-md ' + roleStyleMap[turn.role]
                  : isDark
                    ? 'bg-[#1D130D]/90 border-[#5C3A21] hover:border-[#C49A6C]/60'
                    : 'bg-[#FBF7F0] border-[#CBB89D] hover:border-[#6B4226]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold">{turn.speakerTitleKa}</span>
                  <span className="text-[11px] opacity-75">· {turn.stageBadgeKa}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span dir="rtl" className="font-serif text-xs font-bold text-[#C49A6C]">
                    {turn.speakerTitleHe}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFullscreen({
                        title: `${turn.speakerTitleKa} (${turn.speakerTitleHe})`,
                        subtitle: `${tractateNameKa} ${dafData.dafId} • ${turn.stageBadgeKa}`,
                        hebrewText: turn.hebrewText,
                        georgianText: turn.georgianText,
                      });
                    }}
                    className="p-1 rounded border border-[#8B5A2B]/35 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold leading-relaxed mb-1">
                {turn.hebrewText}
              </div>
              <div className="text-xs leading-relaxed opacity-90">{turn.georgianText}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #12: „თალმუდური ლოგიკის (ჰერმენევტიკის) რენტგენი“ — 13 მიდოთი
 * ============================================================================ */
export const TalmudicLogicHermeneuticsPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
  onOpenFullscreen,
}) => {
  const [selectedMiddahId, setSelectedMiddahId] = useState<string>(
    THIRTEEN_MIDDOT_HERMENEUTICS[0].id
  );
  const [applyDayoLimit, setApplyDayoLimit] = useState<boolean>(true);
  const [showPirchaTest, setShowPirchaTest] = useState<boolean>(false);

  const currentMiddah =
    THIRTEEN_MIDDOT_HERMENEUTICS.find((m) => m.id === selectedMiddahId) ||
    THIRTEEN_MIDDOT_HERMENEUTICS[0];

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            12. თალმუდური ლოგიკის რენტგენი — რაბი იშმაელის 13 მიდოთი და კალ-ვახომერის სასწორი
          </span>
        </div>

        <SearchableSelect
          label="აირჩიეთ ჰერმენევტიკული წესი (מידה מן י״ג מידות):"
          options={THIRTEEN_MIDDOT_HERMENEUTICS.map((m) => ({
            value: m.id,
            badgeHe: m.nameHe,
            label: `${m.number}. ${m.nameKa}`,
            sublabel: m.formulaKa,
          }))}
          value={selectedMiddahId}
          onChange={setSelectedMiddahId}
          isDark={isDark}
          compact
        />

        <div
          className={`p-3.5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black">{currentMiddah.nameKa}</div>
              <div className="text-xs font-bold text-[#C49A6C]">{currentMiddah.formulaKa}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span dir="rtl" className="font-serif text-lg font-black text-[#C49A6C]">
                {currentMiddah.nameHe}
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: `${currentMiddah.nameKa} (${currentMiddah.nameHe})`,
                    subtitle: currentMiddah.talmudExampleRefKa,
                    hebrewText: `${currentMiddah.formulaHe}\n\n${currentMiddah.talmudExampleTextHe}`,
                    georgianText: `${currentMiddah.definitionKa}\n\nმაგალითი შასიდან:\n${currentMiddah.talmudExampleTextKa}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed">{currentMiddah.definitionKa}</p>

          {/* Interactive 3D Balance Visual for Kal VaChomer / Premises */}
          {currentMiddah.kalPremiseKa && currentMiddah.chomerPremiseKa && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div
                  className={`p-3 rounded-xl border ${
                    isDark
                      ? 'bg-[#1D130D] border-emerald-500/40'
                      : 'bg-[#FFFDF9] border-emerald-700/40'
                  }`}
                >
                  <div className="text-[11px] font-extrabold text-emerald-500 mb-1">
                    წანამძღვარი A · მსუბუქი მხარე (הקל):
                  </div>
                  <div className="text-xs leading-relaxed">{currentMiddah.kalPremiseKa}</div>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#1D130D] border-amber-500/50' : 'bg-[#FFFDF9] border-amber-700/50'
                  }`}
                >
                  <div className="text-[11px] font-extrabold text-amber-500 mb-1">
                    წანამძღვარი B · მძიმე მხარე (החמור):
                  </div>
                  <div className="text-xs leading-relaxed">{currentMiddah.chomerPremiseKa}</div>
                </div>
              </div>

              {currentMiddah.conclusionKa && (
                <div className="p-3 rounded-xl bg-[#6B4226]/20 border border-[#C49A6C]/50 text-xs space-y-1.5">
                  <div className="font-extrabold text-[#C49A6C]">
                    ლოგიკური დასკვნა (הלימוד בקל וחומר):
                  </div>
                  <div>{currentMiddah.conclusionKa}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {currentMiddah.dayoRuleKa && (
                  <button
                    type="button"
                    onClick={() => setApplyDayoLimit((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border ${
                      applyDayoLimit
                        ? 'bg-[#2E6B3E] text-white border-emerald-400'
                        : 'bg-[#6B4226]/20 border-[#8B5A2B]/40'
                    }`}
                  >
                    {applyDayoLimit ? '„დაიოს“ შეზღუდვა ჩართულია (דיו) ✓' : '„დაიოს“ წესის ჩვენება'}
                  </button>
                )}
                {currentMiddah.pirchaCounterKa && (
                  <button
                    type="button"
                    onClick={() => setShowPirchaTest((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border ${
                      showPirchaTest
                        ? 'bg-rose-800 text-white border-rose-400'
                        : 'bg-[#6B4226]/20 border-[#8B5A2B]/40'
                    }`}
                  >
                    {showPirchaTest ? '„ფირხა“ (פירכא) ნაჩვენებია' : 'შეამოწმე „ფირხა“ (კონტრარგუმენტი)'}
                  </button>
                )}
              </div>

              {applyDayoLimit && currentMiddah.dayoRuleKa && (
                <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/40 text-xs">
                  <strong>„დაიო“ (דיו לבא מן הדין להיות כנדון):</strong> {currentMiddah.dayoRuleKa}
                </div>
              )}

              {showPirchaTest && currentMiddah.pirchaCounterKa && (
                <div className="p-2.5 rounded-xl bg-rose-950/25 border border-rose-500/40 text-xs">
                  <strong>კონტრარგუმენტი (פירכא):</strong> {currentMiddah.pirchaCounterKa}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-[#8B5A2B]/25 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold opacity-80">
                წყარო შასში: {currentMiddah.talmudExampleRefKa} ({currentMiddah.talmudExampleRefHe})
              </div>
              <div dir="rtl" className="font-serif text-sm font-bold text-[#C49A6C]">
                {currentMiddah.talmudExampleTextHe}
              </div>
              <div className="text-xs opacity-90">{currentMiddah.talmudExampleTextKa}</div>
            </div>
            {onNavigateToDaf && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToDaf(currentMiddah.targetTractateId, currentMiddah.targetDafId)
                }
                className="px-3 py-1.5 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <span>ამ დაფზე გადასვლა ({currentMiddah.targetDafId})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #13: 3D ისტორიულ-გეოგრაფიული ატლასი: „ერეც-ისრაელი და ბაბილონი“
 * ============================================================================ */
export const HistoricalGeographicalAtlasPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
}) => {
  const [regionFilter, setRegionFilter] = useState<'all' | 'bavel' | 'eretz-yisrael'>('all');
  const [selectedCityId, setSelectedCityId] = useState<string>(TALMUD_ATLAS_CITIES[0].id);
  const [secondCityId, setSecondCityId] = useState<string>(TALMUD_ATLAS_CITIES[1].id);

  const visibleCities = useMemo(() => {
    if (regionFilter === 'all') return TALMUD_ATLAS_CITIES;
    return TALMUD_ATLAS_CITIES.filter((c) => c.region === regionFilter);
  }, [regionFilter]);

  const activeCity =
    TALMUD_ATLAS_CITIES.find((c) => c.id === selectedCityId) || TALMUD_ATLAS_CITIES[0];
  const targetCity =
    TALMUD_ATLAS_CITIES.find((c) => c.id === secondCityId) || TALMUD_ATLAS_CITIES[1];

  const distanceMetrics = useMemo(() => {
    const dx = activeCity.mapX - targetCity.mapX;
    const dy = activeCity.mapY - targetCity.mapY;
    const rawUnits = Math.hypot(dx, dy);
    const km = Math.max(12, Math.round(rawUnits * 14.5));
    const parsaot = (km / 3.84).toFixed(1);
    const milin = (km / 0.96).toFixed(0);
    return { km, parsaot, milin };
  }, [activeCity, targetCity]);

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
            <Compass className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              13. 3D ისტორიულ-გეოგრაფიული ატლასი: ბაბილონისა (בבל) და ერეც-ისრაელის იეშივები
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'ყველა რეგიონი' },
                { id: 'bavel', label: 'ბაბილონი (בבל)' },
                { id: 'eretz-yisrael', label: 'ერეც-ისრაელი' },
              ] as const
            ).map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setRegionFilter(reg.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                  regionFilter === reg.id
                    ? 'bg-[#6B4226] text-[#FBF7F0]'
                    : 'bg-[#6B4226]/15 border border-[#8B5A2B]/30'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Cartographic Map */}
        <div
          className={`relative rounded-2xl border overflow-hidden p-3 ${
            isDark
              ? 'bg-gradient-to-br from-[#19110B] via-[#251910] to-[#1A120C] border-[#C49A6C]/40'
              : 'bg-gradient-to-br from-[#F4E8D1] via-[#E8D7B9] to-[#DEC7A1] border-[#6B4226]/45'
          }`}
        >
          <svg viewBox="0 0 100 80" className="w-full h-52 sm:h-60 select-none">
            {/* Mediterranean Coast & Kinneret / Jordan on Left; Euphrates & Tigris on Right */}
            <path
              d="M 10,10 Q 15,40 12,75"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              opacity="0.55"
            />
            <path
              d="M 28,22 L 28,68"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.1"
              opacity="0.65"
            />
            {/* Euphrates & Tigris Rivers in Babylonia */}
            <path
              d="M 58,15 Q 68,45 78,74"
              fill="none"
              stroke="#0EA5E9"
              strokeWidth="1.4"
              opacity="0.7"
            />
            <path
              d="M 70,14 Q 80,44 86,74"
              fill="none"
              stroke="#0284C7"
              strokeWidth="1.4"
              opacity="0.7"
            />

            {/* Connection Line between Active City and Second City */}
            <line
              x1={activeCity.mapX}
              y1={activeCity.mapY}
              x2={targetCity.mapX}
              y2={targetCity.mapY}
              stroke="#C49A6C"
              strokeWidth="0.9"
              strokeDasharray="2 1.5"
            />

            <text x="16" y="14" fontSize="3.3" fontWeight="bold" fill="#C49A6C">
              ארץ ישראל • ერეც-ისრაელი
            </text>
            <text x="64" y="14" fontSize="3.3" fontWeight="bold" fill="#C49A6C">
              בבל (נהר פרת וחידקל) • ბაბილონი
            </text>

            {visibleCities.map((city) => {
              const isSelected = city.id === activeCity.id;
              return (
                <g
                  key={city.id}
                  onClick={() => setSelectedCityId(city.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={city.mapX}
                    cy={city.mapY}
                    r={isSelected ? 3.2 : 2.2}
                    fill={isSelected ? '#10B981' : '#C49A6C'}
                    stroke="#FFFDF9"
                    strokeWidth="0.7"
                  />
                  <text
                    x={city.mapX}
                    y={city.mapY - 3.8}
                    textAnchor="middle"
                    fontSize="2.9"
                    fontWeight="bold"
                    fill={isDark ? '#FAF5EB' : '#21160F'}
                  >
                    {city.nameKa.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Yeshiva / City Details */}
        <div
          className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black">
                {activeCity.nameKa} — <span dir="rtl">{activeCity.nameHe}</span>
              </div>
              <div className="text-[11px] font-bold text-[#C49A6C]">
                {activeCity.regionLabelKa} · {activeCity.foundedEraKa}
              </div>
            </div>
            {onNavigateToDaf && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToDaf(activeCity.relatedTractateId, activeCity.relatedDafId)
                }
                className="px-3 py-1.5 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <span>
                  დაფზე გადასვლა ({activeCity.relatedTractateId} {activeCity.relatedDafId})
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs leading-relaxed">{activeCity.historicalSummaryKa}</p>

          <div className="text-xs">
            <strong className="text-[#C49A6C]">იეშივის მეთაურები და ბრძენნი:</strong>{' '}
            {activeCity.roshYeshivaSagesKa.join(' • ')}
          </div>
          <div className="text-xs">
            <strong className="text-[#C49A6C]">დაკავშირებული სუგია:</strong>{' '}
            {activeCity.relatedSugyaTitleKa}
          </div>

          {/* Talmudic Distance Calculator between Cities */}
          <div className="pt-2 border-t border-[#8B5A2B]/25 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C49A6C]" />
              <span>მანძილი ქალაქამდე:</span>
              <div className="w-[140px] sm:w-[170px] min-w-0">
                <SearchableSelect
                  value={secondCityId}
                  onChange={(val) => setSecondCityId(val)}
                  options={TALMUD_ATLAS_CITIES.map((c) => ({
                    value: c.id,
                    badgeHe: c.nameHe,
                    label: c.nameKa,
                  }))}
                  isDark={isDark}
                  compact
                  searchPlaceholder="ქალაქი..."
                />
              </div>
            </div>
            <div className="font-extrabold tabular-nums text-[#C49A6C]">
              ≈ {distanceMetrics.parsaot} ფარსა ({distanceMetrics.milin} მილი / {distanceMetrics.km}{' '}
              კმ)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #14: „მახლოკეთის (מחלוקת) არენა“ — ბრძენთა დაპირისპირების დაფა
 * ============================================================================ */
export const MachloketDebateArenaPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
  onOpenFullscreen,
}) => {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(
    MACHLOKET_ARENA_DISPUTES[0].id
  );

  const dispute =
    MACHLOKET_ARENA_DISPUTES.find((d) => d.id === selectedDisputeId) ||
    MACHLOKET_ARENA_DISPUTES[0];

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
            <Swords className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              14. „მახლოკეთის (מחלוקת) არენა“ — ბრძენთა ჰალახური დაპირისპირების სიმეტრიული დაფა
            </span>
          </div>
          {onNavigateToDaf && (
            <button
              type="button"
              onClick={() => onNavigateToDaf(dispute.tractateId, dispute.dafId)}
              className="px-3 py-1 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>
                დაფზე გადასვლა ({dispute.tractateId} {dispute.dafId})
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <SearchableSelect
          label="აირჩიეთ თალმუდური მახლოკეთი (מחלוקת התנאים והאמוראים):"
          options={MACHLOKET_ARENA_DISPUTES.map((d) => ({
            value: d.id,
            badgeHe: `${d.tractateId} ${d.dafId}`,
            label: d.titleKa,
            sublabel: d.topicKa,
          }))}
          value={selectedDisputeId}
          onChange={setSelectedDisputeId}
          isDark={isDark}
          compact
        />

        {/* Symmetrical 2-Column Arena: Side A vs Side B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Side A */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2 ${
              isDark
                ? 'bg-[#261911] border-amber-500/45'
                : 'bg-[#F7EBD5] border-[#8B5A2B]/50'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#8B5A2B]/25 pb-1.5">
              <span className="text-xs font-black text-[#C49A6C]">
                პოზიცია A · {dispute.sideA.sageKa}
              </span>
              <span dir="rtl" className="font-serif text-sm font-bold">
                {dispute.sideA.sageHe}
              </span>
            </div>
            <div dir="rtl" className="font-serif text-sm font-bold">
              {dispute.sideA.thesisHe}
            </div>
            <div className="text-xs font-bold">{dispute.sideA.thesisKa}</div>
            <div className="p-2 rounded-xl bg-[#6B4226]/15 text-xs space-y-1">
              <div className="font-extrabold text-[#C49A6C]">წყარო და არგუმენტი:</div>
              <div dir="rtl" className="font-serif text-xs">
                {dispute.sideA.proofPasukHe}
              </div>
              <div>{dispute.sideA.proofPasukKa}</div>
            </div>
            <div className="text-[11px] opacity-85">
              <strong>პასუხი ოპონენტს:</strong> {dispute.sideA.rebuttalKa}
            </div>
          </div>

          {/* Side B */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2 ${
              isDark
                ? 'bg-[#1F2419] border-emerald-500/45'
                : 'bg-[#EBF3E6] border-emerald-800/40'
            }`}
          >
            <div className="flex items-center justify-between border-b border-emerald-700/25 pb-1.5">
              <span className="text-xs font-black text-emerald-500">
                პოზიცია B · {dispute.sideB.sageKa}
              </span>
              <span dir="rtl" className="font-serif text-sm font-bold">
                {dispute.sideB.sageHe}
              </span>
            </div>
            <div dir="rtl" className="font-serif text-sm font-bold">
              {dispute.sideB.thesisHe}
            </div>
            <div className="text-xs font-bold">{dispute.sideB.thesisKa}</div>
            <div className="p-2 rounded-xl bg-emerald-900/15 text-xs space-y-1">
              <div className="font-extrabold text-emerald-500">წყარო და არგუმენტი:</div>
              <div dir="rtl" className="font-serif text-xs">
                {dispute.sideB.proofPasukHe}
              </div>
              <div>{dispute.sideB.proofPasukKa}</div>
            </div>
            <div className="text-[11px] opacity-85">
              <strong>პასუხი ოპონენტს:</strong> {dispute.sideB.rebuttalKa}
            </div>
          </div>
        </div>

        {/* Final Halacha Verdict Box */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/60 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>საბოლოო ჰალახური ვერდიქტი (פסק הלכה למעשה):</span>
            </span>
            <button
              type="button"
              onClick={() =>
                onOpenFullscreen({
                  title: dispute.titleKa,
                  subtitle: dispute.halachicRulePrincipleKa,
                  hebrewText: `${dispute.sideA.sageHe}: ${dispute.sideA.thesisHe}\n\n${dispute.sideB.sageHe}: ${dispute.sideB.thesisHe}\n\nפסק הלכה: ${dispute.finalHalachaHe}`,
                  georgianText: `${dispute.finalHalachaKa}\n\n${dispute.halachicRulePrincipleKa}`,
                })
              }
              className="p-1 rounded border border-emerald-500/40 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          </div>
          <div dir="rtl" className="font-serif text-sm font-bold text-emerald-200">
            {dispute.finalHalachaHe}
          </div>
          <div className="text-xs leading-relaxed">{dispute.finalHalachaKa}</div>
          <div className="text-[11px] font-extrabold text-[#C49A6C]">
            {dispute.halachicRulePrincipleKa} ({dispute.halachicRulePrincipleHe})
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #15: „შას-კონკორდანცია და ფასუკების ინდექსი“ (Tanakh-in-Shas Explorer)
 * ============================================================================ */
export const TanakhInShasConcordancePanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPasukim = useMemo(() => {
    if (!searchQuery.trim()) return TANAKH_IN_SHAS_CONCORDANCE;
    const q = searchQuery.toLowerCase();
    return TANAKH_IN_SHAS_CONCORDANCE.filter(
      (p) =>
        p.pasukRefKa.toLowerCase().includes(q) ||
        p.pasukRefHe.includes(q) ||
        p.fullPasukHe.includes(q) ||
        p.fullPasukKa.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-2.5 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            15. „შას-კონკორდანცია და ფასუკების ინდექსი“ — ბიბლიური ფასუკების დერაშები მთელ შასში
          </span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="მოძებნეთ ფასუკი ქართულად ან ებრაულად (მაგ. შემა, წვიმა, ბექორი, דברים)..."
          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
            isDark
              ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
              : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
          }`}
        />
      </div>

      {filteredPasukim.map((item) => (
        <div
          key={item.id}
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
            <span className="text-xs font-extrabold text-[#C49A6C]">{item.pasukRefKa}</span>
            <span dir="rtl" className="font-serif text-xs font-bold">
              {item.pasukRefHe}
            </span>
          </div>
          <div dir="rtl" className="font-serif text-base font-bold leading-relaxed">
            {item.fullPasukHe}
          </div>
          <div className="text-xs leading-relaxed opacity-90">{item.fullPasukKa}</div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-extrabold text-[#C49A6C]">
              სად განიმარტება ეს ფასუკი ბაბილონის თალმუდში:
            </div>
            {item.shasLocations.map((loc, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold">
                    {loc.tractateLabelKa} ({loc.tractateLabelHe})
                  </div>
                  <div dir="rtl" className="font-serif text-xs text-[#C49A6C]">
                    {loc.derashaSnippetHe}
                  </div>
                  <div className="text-xs opacity-90">{loc.derashaSummaryKa}</div>
                </div>
                {onNavigateToDaf && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDaf(loc.tractateId, loc.dafId)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>გადასვლა ({loc.dafId})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
 * FEATURE #16: „ციფრული კალამი და მარკერი დაფზე“ (Tzurat HaDaf Ink & Highlighter)
 * ============================================================================ */
interface DafHighlightRecord {
  id: string;
  dafKey: string;
  sentenceId: string;
  colorKey: 'kushya' | 'terutz' | 'halacha' | 'rashi-link' | 'aggadah';
  labelKa: string;
  snippetHe: string;
  customConnectionNoteKa: string;
}

const MARKER_COLORS = [
  {
    key: 'kushya' as const,
    labelKa: 'კუშია / კითხვა',
    badgeClass: 'bg-amber-500/25 border-amber-400 text-amber-200',
    dotClass: 'bg-amber-400',
  },
  {
    key: 'terutz' as const,
    labelKa: 'თერუცი / პასუხი',
    badgeClass: 'bg-emerald-500/25 border-emerald-400 text-emerald-200',
    dotClass: 'bg-emerald-400',
  },
  {
    key: 'halacha' as const,
    labelKa: 'ჰალახა / დასკვნა',
    badgeClass: 'bg-sky-500/25 border-sky-400 text-sky-200',
    dotClass: 'bg-sky-400',
  },
  {
    key: 'rashi-link' as const,
    labelKa: 'გემარა ⇄ რაში/თოსაფოთი',
    badgeClass: 'bg-purple-500/25 border-purple-400 text-purple-200',
    dotClass: 'bg-purple-400',
  },
  {
    key: 'aggadah' as const,
    labelKa: 'აგადა და მუსარი',
    badgeClass: 'bg-rose-500/25 border-rose-400 text-rose-200',
    dotClass: 'bg-rose-400',
  },
];

export const DafInkAndHighlighterPanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameKa,
  isDark,
  onHighlightSentence,
}) => {
  const currentDafKey = `${dafData.tractateId}:${dafData.dafId}`;
  const allSentences = useMemo(
    () => [...dafData.mishnah, ...dafData.gemara, ...dafData.rashi, ...dafData.tosafot],
    [dafData]
  );

  const [selectedColor, setSelectedColor] =
    useState<DafHighlightRecord['colorKey']>('kushya');
  const [selectedSentenceId, setSelectedSentenceId] = useState<string>(
    allSentences[0]?.id || ''
  );
  const [connectionNote, setConnectionNote] = useState<string>('');
  const [highlights, setHighlights] = useState<DafHighlightRecord[]>(() => {
    try {
      const raw = localStorage.getItem('talmud-daf-highlights-v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    if (allSentences[0]) {
      setSelectedSentenceId(allSentences[0].id);
    }
  }, [currentDafKey, allSentences]);

  useEffect(() => {
    try {
      localStorage.setItem('talmud-daf-highlights-v1', JSON.stringify(highlights));
    } catch {
      // ignore
    }
  }, [highlights]);

  const handleAddHighlight = () => {
    const target = allSentences.find((s) => s.id === selectedSentenceId) || allSentences[0];
    if (!target) return;
    const colorObj = MARKER_COLORS.find((c) => c.key === selectedColor) || MARKER_COLORS[0];
    const rec: DafHighlightRecord = {
      id: `hl-${Date.now()}`,
      dafKey: currentDafKey,
      sentenceId: target.id,
      colorKey: selectedColor,
      labelKa: colorObj.labelKa,
      snippetHe: target.hebrewText.slice(0, 80),
      customConnectionNoteKa:
        connectionNote.trim() ||
        `${tractateNameKa} ${dafData.dafId} — მონიშნულია კატეგორიით: ${colorObj.labelKa}`,
    };
    setHighlights((prev) => [rec, ...prev]);
    setConnectionNote('');
    onHighlightSentence(target.id);
  };

  const currentDafHighlights = highlights.filter((h) => h.dafKey === currentDafKey);

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            16. „ციფრული კალამი და მარკერი დაფზე“ — ფერადი კოდირება და გემარა ⇄ რაშის ხაზები
          </span>
        </div>

        {/* 5 Yeshiva Highlighter Colors */}
        <div className="flex flex-wrap gap-1.5">
          {MARKER_COLORS.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => setSelectedColor(col.key)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                selectedColor === col.key
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] shadow-sm'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
              <span>{col.labelKa}</span>
            </button>
          ))}
        </div>

        <SearchableSelect
          label="აირჩიეთ მოსანიშნი სტრიქონი მიმდინარე დაფიდან:"
          options={allSentences.map((s, idx) => ({
            value: s.id,
            badgeHe: s.source.toUpperCase(),
            label: `#${idx + 1} · ${s.hebrewText.slice(0, 55)}`,
            sublabel: sanitizeGeorgianText(s.translationKa).slice(0, 75),
          }))}
          value={selectedSentenceId}
          onChange={setSelectedSentenceId}
          isDark={isDark}
          compact
        />

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={connectionNote}
            onChange={(e) => setConnectionNote(e.target.value)}
            placeholder="დაამატეთ დამაკავშირებელი კომენტარი (მაგ. ეს რაში ხსნის თოსაფოთის კითხვას)..."
            className={`flex-1 min-w-[220px] px-3 py-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
                : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
            }`}
          />
          <button
            type="button"
            onClick={handleAddHighlight}
            className="px-3.5 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>დაფზე მონიშვნა და განათება</span>
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {currentDafHighlights.length === 0 ? (
            <div className="text-xs opacity-75 py-2">
              ამ დაფზე ჯერ არ არის ფერადი მარკერით მონიშნული სტრიქონები. აირჩიეთ ფერი და დააჭირეთ
              „დაფზე მონიშვნა და განათება“.
            </div>
          ) : (
            currentDafHighlights.map((hl) => {
              const colorObj =
                MARKER_COLORS.find((c) => c.key === hl.colorKey) || MARKER_COLORS[0];
              return (
                <div
                  key={hl.id}
                  onClick={() => onHighlightSentence(hl.sentenceId)}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 cursor-pointer ${
                    isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorObj.dotClass}`} />
                      <span className="text-xs font-extrabold text-[#C49A6C]">
                        {hl.labelKa}
                      </span>
                      <span className="text-[10px] opacity-75">
                        · დააწკაპუნეთ დაფზე გასანათებლად ↗
                      </span>
                    </div>
                    <div dir="rtl" className="font-serif text-sm font-bold">
                      {hl.snippetHe}
                    </div>
                    <div className="text-xs opacity-90">{hl.customConnectionNoteKa}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHighlights((prev) => prev.filter((item) => item.id !== hl.id));
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-900/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
