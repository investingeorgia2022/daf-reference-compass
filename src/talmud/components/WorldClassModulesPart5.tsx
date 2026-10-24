// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Scale,
  Feather,
  Clock,
  Layers,
  Globe,
  CheckCircle2,
  ArrowUpRight,
  RotateCcw,
  Maximize2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SharedPart3Props } from './WorldClassModulesPart3';
import { SEDARIM, TRACTATES } from '../data/tractates';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';

/* ============================================================================
 * FEATURE #23: „ცოცხალი გემარა-რაში-თოსაფოთის 3D სინაფსური ხიდი“
 * (3D Synaptic Commentary Constellation & Animated Beam Visualizer)
 * ============================================================================ */
export const SynapticConstellationBridgePanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onHighlightSentence,
  onOpenFullscreen,
}) => {
  const [selectedGemaraIdx, setSelectedGemaraIdx] = useState<number>(0);
  const [activeSatellite, setActiveSatellite] = useState<'rashi' | 'tosafot' | 'mishnah' | 'halacha'>('rashi');

  const currentGemara = dafData.gemara[selectedGemaraIdx] || dafData.gemara[0];
  const linkedRashi = dafData.rashi[selectedGemaraIdx] || dafData.rashi[0];
  const linkedTosafot = dafData.tosafot[selectedGemaraIdx] || dafData.tosafot[0];
  const linkedMishnah = dafData.mishnah[0];

  const satellites = useMemo(
    () => [
      {
        id: 'mishnah' as const,
        titleKa: 'მიშნა (משנה • საფუძველი)',
        titleHe: 'מתניתין',
        x: 18,
        y: 22,
        color: '#F59E0B',
        hebrew: linkedMishnah?.hebrewText || 'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים',
        georgian: sanitizeGeorgianText(
          linkedMishnah?.translationKa || linkedMishnah?.explanationKa || 'საწყისი მიშნის კანონი'
        ),
        sentenceId: linkedMishnah?.id,
      },
      {
        id: 'rashi' as const,
        titleKa: 'რაში (רש״י • პშატი)',
        titleHe: linkedRashi?.dibburHamatchil || 'פירוש רש״י',
        x: 82,
        y: 22,
        color: '#10B981',
        hebrew: linkedRashi?.hebrewText || 'פֵּירוּשׁ רַשִׁ״י עַל הַגְּמָרָא',
        georgian: sanitizeGeorgianText(
          linkedRashi?.translationKa || linkedRashi?.explanationKa || 'რაშის პირდაპირი განმარტება'
        ),
        sentenceId: linkedRashi?.id,
      },
      {
        id: 'tosafot' as const,
        titleKa: 'თოსაფოთი (תוספות • იუნი)',
        titleHe: linkedTosafot?.dibburHamatchil || 'בעלי התוספות',
        x: 18,
        y: 78,
        color: '#38BDF8',
        hebrew: linkedTosafot?.hebrewText || 'וְאִם תֹּאמַר... וְיֵשׁ לוֹמַר',
        georgian: sanitizeGeorgianText(
          linkedTosafot?.translationKa ||
            linkedTosafot?.explanationKa ||
            'თოსაფოთის შედარებითი ანალიზი და დიალექტიკა'
        ),
        sentenceId: linkedTosafot?.id,
      },
      {
        id: 'halacha' as const,
        titleKa: 'პასაკ ჰალახა (רמב״ם ושו״ע)',
        titleHe: 'הלכה למעשה',
        x: 82,
        y: 78,
        color: '#EC4899',
        hebrew: `פְּסַק הֲלָכָה בְּמַסֶּכֶת ${tractateNameHe} דַּף ${dafData.dafId}`,
        georgian: `საბოლოო ჰალახური კოდიფიკაცია რამბამის „მიშნე თორასა“ და „შულხან არუხში“ (${tractateNameKa} ${dafData.dafId}-ის სუგიაზე დაყრდნობით).`,
        sentenceId: currentGemara?.id,
      },
    ],
    [linkedMishnah, linkedRashi, linkedTosafot, currentGemara, tractateNameHe, tractateNameKa, dafData.dafId]
  );

  const selectedSatObj = satellites.find((s) => s.id === activeSatellite) || satellites[1];

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
            <Network className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              23. ცოცხალი გემარა-რაში-თოსაფოთის 3D სინაფსური ხიდი ({tractateNameKa} {dafData.dafId})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {dafData.gemara.slice(0, 6).map((g, idx) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedGemaraIdx(idx);
                  onHighlightSentence(g.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                  selectedGemaraIdx === idx
                    ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm scale-105'
                    : 'bg-[#6B4226]/15 border border-[#8B5A2B]/30 hover:bg-[#6B4226]/30'
                }`}
              >
                სუგია #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Animated Synaptic SVG Constellation */}
        <div
          className={`relative rounded-2xl border overflow-hidden p-3 perspective-1200 ${
            isDark
              ? 'bg-gradient-to-br from-[#160F0A] via-[#22170F] to-[#140D08] border-[#C49A6C]/45'
              : 'bg-gradient-to-br from-[#F7EEDF] via-[#EDE0C8] to-[#E2D0B1] border-[#6B4226]/45'
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-full h-56 sm:h-64 select-none">
            <defs>
              <radialGradient id="gemaraCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C49A6C" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#6B4226" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Synaptic Beams from Center (50,50) to Satellites */}
            {satellites.map((sat) => {
              const isSelected = sat.id === activeSatellite;
              return (
                <g key={sat.id}>
                  <line
                    x1={50}
                    y1={50}
                    x2={sat.x}
                    y2={sat.y}
                    stroke={sat.color}
                    strokeWidth={isSelected ? '1.3' : '0.5'}
                    opacity={isSelected ? 0.9 : 0.35}
                  />
                  <line
                    x1={50}
                    y1={50}
                    x2={sat.x}
                    y2={sat.y}
                    stroke="#FAF5EB"
                    strokeWidth={isSelected ? '1.6' : '0.7'}
                    className="animate-synaptic-flow"
                    opacity={isSelected ? 0.95 : 0.45}
                  />
                </g>
              );
            })}

            {/* Center Core: Gemara Sugya */}
            <circle cx={50} cy={50} r={18} fill="url(#gemaraCoreGlow)" />
            <g
              onClick={() => {
                if (currentGemara) onHighlightSentence(currentGemara.id);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={50}
                cy={50}
                r={10.5}
                fill="#6B4226"
                stroke="#FAF5EB"
                strokeWidth="1.2"
              />
              <text
                x={50}
                y={49}
                textAnchor="middle"
                fontSize="3.8"
                fontWeight="bold"
                fill="#FAF5EB"
              >
                גמרא
              </text>
              <text
                x={50}
                y={53.5}
                textAnchor="middle"
                fontSize="2.7"
                fontWeight="bold"
                fill="#E8D8BE"
              >
                გემარის ბირთვი
              </text>
            </g>

            {/* 4 Orbiting Commentary Satellites */}
            {satellites.map((sat) => {
              const isSelected = sat.id === activeSatellite;
              return (
                <g
                  key={sat.id}
                  onClick={() => {
                    setActiveSatellite(sat.id);
                    if (sat.sentenceId) onHighlightSentence(sat.sentenceId);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={sat.x}
                    cy={sat.y}
                    r={isSelected ? 8.2 : 6.6}
                    fill={isDark ? '#1D130D' : '#FBF7F0'}
                    stroke={sat.color}
                    strokeWidth={isSelected ? '1.6' : '1'}
                  />
                  <text
                    x={sat.x}
                    y={sat.y - 0.5}
                    textAnchor="middle"
                    fontSize="2.8"
                    fontWeight="bold"
                    fill={sat.color}
                  >
                    {sat.titleHe.slice(0, 12)}
                  </text>
                  <text
                    x={sat.x}
                    y={sat.y + 3.2}
                    textAnchor="middle"
                    fontSize="2.3"
                    fontWeight="bold"
                    fill={isDark ? '#FAF5EB' : '#21160F'}
                  >
                    {sat.titleKa.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Synaptic Link Comparison Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedGemaraIdx}-${selectedSatObj.id}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C49A6C]" />
                <span className="text-xs font-black">
                  სინაფსური კავშირი: გემარა ➔ {selectedSatObj.titleKa}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: `გემარა ⇄ ${selectedSatObj.titleKa}`,
                    subtitle: `${tractateNameKa} ${dafData.dafId}`,
                    hebrewText: `${currentGemara?.hebrewText || ''}\n\n---\n\n${selectedSatObj.hebrew}`,
                    georgianText: `გემარა:\n${sanitizeGeorgianText(currentGemara?.translationKa || '')}\n\n${selectedSatObj.titleKa}:\n${selectedSatObj.georgian}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div
                onClick={() => currentGemara && onHighlightSentence(currentGemara.id)}
                className={`p-3 rounded-xl border cursor-pointer card-modern-lift ${
                  isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-white border-[#CBB89D]'
                }`}
              >
                <div className="text-[11px] font-extrabold text-[#C49A6C] mb-1">
                  ცენტრალური გემარა (დააწკაპუნეთ დაფზე გასანათებლად ↗):
                </div>
                <div dir="rtl" className="font-serif text-sm font-bold mb-1">
                  {currentGemara?.hebrewText}
                </div>
                <div className="text-xs opacity-90">
                  {sanitizeGeorgianText(currentGemara?.translationKa || '')}
                </div>
              </div>

              <div
                onClick={() =>
                  selectedSatObj.sentenceId && onHighlightSentence(selectedSatObj.sentenceId)
                }
                className={`p-3 rounded-xl border cursor-pointer card-modern-lift ${
                  isDark ? 'bg-[#1D130D] border-[#C49A6C]/50' : 'bg-white border-[#6B4226]/50'
                }`}
              >
                <div className="text-[11px] font-extrabold text-emerald-400 mb-1">
                  {selectedSatObj.titleKa} ({selectedSatObj.titleHe}):
                </div>
                <div dir="rtl" className="font-serif text-sm font-bold mb-1">
                  {selectedSatObj.hebrew}
                </div>
                <div className="text-xs opacity-90">{selectedSatObj.georgian}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #24: „ბეთ-დინის (בית דין) ჰალახური სასამართლო სიმულატორი“
 * (Interactive Beit Din Case Simulator — Dayanim Verdict Engine)
 * ============================================================================ */
interface BeitDinCaseItem {
  id: string;
  caseTitleKa: string;
  caseTitleHe: string;
  tractateId: string;
  dafId: string;
  claimantAKa: string;
  claimantAHe: string;
  claimantBKa: string;
  claimantBHe: string;
  legalPrincipleHe: string;
  legalPrincipleKa: string;
  verdictOptions: {
    id: string;
    labelKa: string;
    isHalacha: boolean;
    rulingExplanationKa: string;
  }[];
}

const BEIT_DIN_CASES: BeitDinCaseItem[] = [
  {
    id: 'case-bekhorot-17a',
    caseTitleKa: 'საქმე #1: საეჭვო ბექორი ქოჰენსა და მესაკუთრეს შორის (ბექოროთ 17a)',
    caseTitleHe: 'דִּין סְפֵק בְּכוֹר בֵּין הַכֹּהֵן לַבְּעָלִים (בכורות י״ז ע״א)',
    tractateId: 'Bekhorot',
    dafId: '17a',
    claimantAKa:
      'მოსარჩელე (ქოჰენი): „ეს ხბო პირველი ნაშიერია (ბექორი), რომელიც თორის კანონით მე მეკუთვნის!“',
    claimantAHe: 'טַעֲנַת הַכֹּהֵן: בְּכוֹר וַדַּאי הוּא וְלִי הוּא מַגִּיעַ מִן הַתּוֹרָה!',
    claimantBKa:
      'მოპასუხე (ისრაელი მესაკუთრე): „ძროხა უცხოტომელისგან ვიყიდე და შესაძლოა მანამდე უკვე ჰყავდა ნაშიერი — დამიმტკიცე, რომ ბექორია!“',
    claimantBHe: 'טַעֲנַת הַבְּעָלִים: סְפֵק בְּכוֹר הוּא — הָבֵא רְאָיָה וְטוֹל!',
    legalPrincipleHe: 'הַמּוֹצִיא מֵחֲבֵירוֹ עָלָיו הָרְאָיָה (ספק ממון לקולא וספק איסור לחומרא)',
    legalPrincipleKa:
      'ვინც მოყვასისგან ქონების წართმევას ითხოვს, მტკიცების ტვირთი მასზეა („ჰამოცი მეხავერო ალაივ ჰარაია“).',
    verdictOptions: [
      {
        id: 'v1',
        labelKa:
          'განაჩენი A: ცხოველს ეკრძალება გაპარსვა და მუშაობა სიწმინდის გამო, ხოლო ნაკლის (მუმის) გაჩენის შემდეგ რჩება პატრონს.',
        isHalacha: true,
        rulingExplanationKa:
          'פסק דין אמת! თქვენი განაჩენი სრულად ემთხვევა რაბი აკივას, რავასა და რამბამის პასაკს (ჰილხოთ ბექოროთ 5:3).',
      },
      {
        id: 'v2',
        labelKa: 'განაჩენი B: ცხოველი მტკიცებულების გარეშე დაუყოვნებლივ გადაეცეს ქოჰენს.',
        isHalacha: false,
        rulingExplanationKa:
          'შეცდომაა: საეჭვო ქონებრივ დავაში ქოჰენს არ შეუძლია მტკიცებულების გარეშე ქონების წაღება.',
      },
    ],
  },
  {
    id: 'case-bava-metzia-2a',
    caseTitleKa: 'საქმე #2: ორი კაცი ეჭიდება ერთ ტალითს (ბავა მეცია 2a)',
    caseTitleHe: 'שְׁנַיִם אוֹחֲזִין בְּטַלִּית (בבא מציעא ב׳ ע״א)',
    tractateId: 'Bava_Metzia',
    dafId: '2a',
    claimantAKa:
      'მოსარჩელე A: „მე ვიპოვე ეს ტალითი და მთლიანად ჩემია!“ (ხელით უჭირავს ნახევარზე მეტი)',
    claimantAHe: 'זֶה אוֹמֵר אֲנִי מְצָאתִיהָ וְכוּלָּהּ שֶׁלִּי!',
    claimantBKa:
      'მოსარჩელე B: „მე ვიპოვე და მთლიანად ჩემია!“ (მასაც თანაბრად უჭირავს ტალითის კიდე)',
    claimantBHe: 'וְזֶה אוֹמֵר אֲנִי מְצָאתִיהָ וְכוּלָּהּ שֶׁלִּי!',
    legalPrincipleHe: 'מוּחְזָקִים בְּשָׁוֶה — יִשָּׁבְעוּ שְׁנֵיהֶם וְיַחְלוֹקוּ',
    legalPrincipleKa:
      'როდესაც ორივე მხარე თანაბრად ფლობს ნივთს (მუხზაკი), ორივე დებს ფიცს („შვუათ ჰამიშნა“) და ნივთი შუაზე იყოფა.',
    verdictOptions: [
      {
        id: 'v1',
        labelKa:
          'განაჩენი A: თითოეულმა დადოს ფიცი, რომ ნახევარზე ნაკლები არ ეკუთვნის, და გაიყონ შუაზე (יחלוקו).',
        isHalacha: true,
        rulingExplanationKa:
          'פסק דין אמת! ეს არის მიშნისა და შულხან არუხის (ხოშენ მიშპატი 138:1) კლასიკური განაჩენი.',
      },
      {
        id: 'v2',
        labelKa: 'განაჩენი B: ტალითი დარჩეს სასამართლოში, სანამ ელია წინასწარმეტყველი არ მოვა.',
        isHalacha: false,
        rulingExplanationKa:
          '„יהא מונח עד שיבוא אליהו“ გამოიყენება მხოლოდ იქ, სადაც ერთ-ერთი მხარე заведомо ტყუის და ფიზიკური ფლობა არ ფიქსირდება.',
      },
    ],
  },
];

export const BeitDinCourtSimulatorPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(BEIT_DIN_CASES[0].id);
  const [pickedVerdict, setPickedVerdict] = useState<string | null>(null);

  const currentCase =
    BEIT_DIN_CASES.find((c) => c.id === selectedCaseId) || BEIT_DIN_CASES[0];
  const chosenOption = currentCase.verdictOptions.find((v) => v.id === pickedVerdict);

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
            <Scale className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              24. „ბეთ-დინის (בית דין) ჰალახური სასამართლო სიმულატორი“ — დაიანის სავარძელი
            </span>
          </div>
          {onNavigateToDaf && (
            <button
              type="button"
              onClick={() => onNavigateToDaf(currentCase.tractateId, currentCase.dafId)}
              className="px-3 py-1 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>
                საქმის დაფზე გადასვლა ({currentCase.tractateId} {currentCase.dafId})
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BEIT_DIN_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCaseId(c.id);
                setPickedVerdict(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                selectedCaseId === c.id
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
              }`}
            >
              {c.caseTitleKa}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div
            className={`p-3 rounded-xl border space-y-1 card-modern-lift ${
              isDark ? 'bg-[#261911] border-amber-500/40' : 'bg-[#F7EBD5] border-[#8B5A2B]/45'
            }`}
          >
            <div dir="rtl" className="font-serif text-sm font-bold text-[#C49A6C]">
              {currentCase.claimantAHe}
            </div>
            <div className="text-xs font-bold">{currentCase.claimantAKa}</div>
          </div>

          <div
            className={`p-3 rounded-xl border space-y-1 card-modern-lift ${
              isDark ? 'bg-[#1F2419] border-emerald-500/40' : 'bg-[#EBF3E6] border-emerald-800/40'
            }`}
          >
            <div dir="rtl" className="font-serif text-sm font-bold text-emerald-400">
              {currentCase.claimantBHe}
            </div>
            <div className="text-xs font-bold">{currentCase.claimantBKa}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#6B4226]/20 border border-[#C49A6C]/40 text-xs">
          <strong className="text-[#C49A6C]">ჰალახური პრინციპი ({currentCase.legalPrincipleHe}):</strong>{' '}
          {currentCase.legalPrincipleKa}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-extrabold text-[#C49A6C]">
            გამოიტანეთ ბეთ-დინის განაჩენი (פסק דין):
          </div>
          {currentCase.verdictOptions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setPickedVerdict(v.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all card-modern-lift ${
                pickedVerdict === v.id
                  ? v.isHalacha
                    ? 'bg-emerald-950/45 border-emerald-400 text-emerald-200'
                    : 'bg-rose-950/45 border-rose-400 text-rose-200'
                  : isDark
                    ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C]'
                    : 'bg-white border-[#CBB89D] hover:border-[#6B4226]'
              }`}
            >
              {v.labelKa}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {chosenOption && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`p-3.5 rounded-xl border-2 flex items-center gap-2.5 text-xs font-bold ${
                chosenOption.isHalacha
                  ? 'bg-emerald-950/35 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/35 border-rose-500 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{chosenOption.rulingExplanationKa}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #25: „სოფერის ცოცხალი კალიგრაფიის სტუდია“ (Sofer STaM Virtual Kulmus)
 * ============================================================================ */
const SOFER_LETTERS = [
  {
    letter: 'א',
    nameKa: 'ალეფი (אָלֶף)',
    taginKa: '7 ან 3 თაგინი (გვირგვინი)',
    secretKa:
      'ალეფი შედგება ზედა იუდისგან (י), ქვედა იუდისგან (י) და დამაკავშირებელი ვავისგან (ו) — გემატრიით 10+10+6 = 26 (უზენაესის ოთხასოვანი სახელი).',
  },
  {
    letter: 'ב',
    nameKa: 'ბეთი (בֵּית)',
    taginKa: '1 თაგი ზედა მარცხენა კიდეზე',
    secretKa:
      'თორა იწყება ასო ბეთით („ბერეშით“), რადგან ბეთი ნიშნავს „ბერახას“ (კურთხევას) და სახლს (בית המדרש).',
  },
  {
    letter: 'ש',
    nameKa: 'შინი (שִׁין)',
    taginKa: '3 თაგი თითოეულ თავზე (שעטנ״ז ג״ץ)',
    secretKa:
      'შინის სამი სვეტი განასახიერებს სამ მამამთავარს — აბრაამს, იცხაკსა და იაკობს, და თორის სამ გვირგვინს.',
  },
  {
    letter: 'ת',
    nameKa: 'თავი (תָּו)',
    taginKa: '1 თაგი მარცხენა სვეტზე',
    secretKa:
      'ასო „თავი“ არის „ემეთის“ (אמת — ჭეშმარიტების) ბეჭედი, რომელსაც მყარი ქუსლი აქვს, რადგან ჭეშმარიტება მარადიულად დგას.',
  },
];

export const SoferCalligraphyCanvasPanel: React.FC<SharedPart3Props> = ({ isDark }) => {
  const [selectedLetter, setSelectedLetter] = useState(SOFER_LETTERS[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw faint guide letter
    ctx.save();
    ctx.font = 'bold 130px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDark ? 'rgba(196, 154, 108, 0.16)' : 'rgba(107, 66, 38, 0.14)';
    ctx.fillText(selectedLetter.letter, canvas.width / 2, canvas.height / 2 + 8);
    ctx.restore();
  };

  useEffect(() => {
    clearCanvas();
  }, [selectedLetter, isDark]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';
    ctx.strokeStyle = isDark ? '#FAF5EB' : '#1E120A';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
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
            <Feather className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              25. „სოფერის ცოცხალი კალიგრაფიის სტუდია“ — ვირტუალური კულმუსი (קולמוס סופר)
            </span>
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3 py-1 rounded-xl border border-[#8B5A2B]/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>პერგამენტის გასუფთავება</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SOFER_LETTERS.map((item) => (
            <button
              key={item.letter}
              type="button"
              onClick={() => setSelectedLetter(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                selectedLetter.letter === item.letter
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
              }`}
            >
              <span className="font-serif text-sm mr-1.5">{item.letter}</span>
              <span>{item.nameKa}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div className="flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={260}
              height={190}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className={`rounded-2xl border-2 touch-none cursor-crosshair shadow-inner ${
                isDark ? 'bg-[#261910] border-[#C49A6C]/50' : 'bg-[#FDF8EE] border-[#6B4226]/50'
              }`}
            />
            <span className="text-[11px] opacity-75 mt-1">
              გადაატარეთ მაუსი ან თითი ასოს კონტურს კულმუსის მელნით დასაწერად
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#C49A6C]">{selectedLetter.nameKa}</span>
              <span className="font-serif text-2xl font-black">{selectedLetter.letter}</span>
            </div>
            <div className="text-xs font-bold text-emerald-400">
              გვირგვინები (תגין): {selectedLetter.taginKa}
            </div>
            <p className="text-xs leading-relaxed">{selectedLetter.secretKa}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #26: „თალმუდური დროის მანქანა — 2000 წლის ქრონოლოგიური პორტალი“
 * ============================================================================ */
const TALMUD_ERAS = [
  {
    id: 'era-zugot',
    years: 'ძვ. წ. 170 – ახ. წ. 10',
    titleKa: '1. ზუგოთი (הזוגות — წყვილთა ეპოქა)',
    titleHe: 'תקופת הזוגות',
    leadersKa: 'ჰილელ ჰაზაკენი და შამაი, იოსე ბენ იოეზერი, იეჰოშუა ბენ პერახია',
    centerKa: 'იერუსალიმი • ტაძრის დიდი სანჰედრინი (לשכת הגזית)',
    milestoneKa:
      'ჩამოყალიბდა ბეთ-ჰილელისა და ბეთ-შამაის სკოლები; ჰილელმა დაადგინა თორის განმარტების 7 ჰერმენევტიკული წესი.',
  },
  {
    id: 'era-tannaim',
    years: 'ახ. წ. 10 – 220 წ.',
    titleKa: '2. თანაიმი (תנאים — მიშნისა და ბარაითის ოსტატები)',
    titleHe: 'תקופת התנאים (חתימת המשנה)',
    leadersKa: 'რაბან იოხანან ბენ ზაქაი, რაბი ელიეზერი, რაბი იეჰოშუა, რაბი აკივა, რაბი იეჰუდა ჰანასი',
    centerKa: 'იავნე, ბნეი-ბრაკი, უშა, ბეთ-შეარიმი, ციფორი',
    milestoneKa:
      'ახ. წ. 200 წელს რაბი იეჰუდა ჰანასიმ (რაბენუ ჰაკადოშმა) დაასრულა 6 სედერისგან შემდგარი „მიშნის“ კოდიფიკაცია.',
  },
  {
    id: 'era-amoraim',
    years: 'ახ. წ. 220 – 500 წ.',
    titleKa: '3. ამორაიმი (אמוראים — გემარის შემოქმედნი)',
    titleHe: 'תקופת האמוראים (תלמוד בבלי וירושלמי)',
    leadersKa: 'რავი და შმუელი, რაბი იოხანანი და რეშ ლაკიში, აბაიე და რავა, რავ აში და რავინა',
    centerKa: 'სურა, ფუმბედითა, ნეჰარდეა, მახოზა (ბაბილონი) • ტვერია (ერეც-ისრაელი)',
    milestoneKa:
      'რავ აშიმ და რავინამ შეაჯამეს ბაბილონის თალმუდი (სוף הוראה — ახ. წ. 499 წ.), რომელიც იქცა მსოფლიო ებრაელობის უზენაეს კოდექსად.',
  },
  {
    id: 'era-rishonim',
    years: 'ახ. წ. 1000 – 1500 წ.',
    titleKa: '4. რიშონიმი (ראשונים — ოქროს კომენტატორები)',
    titleHe: 'תקופת הראשונים (רש״י, תוספות, רמב״ם)',
    leadersKa: 'რაში (ტრუა), ბაალეი ჰათოსაფოთი, რამბამი (მაიმონიდი), რიფი, როში, რამბანი',
    centerKa: 'საფრანგეთი, რაინლანდი, ესპანეთი, ეგვიპტე, ერეც-ისრაელი',
    milestoneKa:
      'შეიქმნა თალმუდის კლასიკური დაფის სტრუქტურა: გემარა ცენტრში, რაში შიდა სვეტში და თოსაფოთი გარე სვეტში.',
  },
  {
    id: 'era-acharonim',
    years: 'ახ. წ. 1500 – დღემდე',
    titleKa: '5. ახარონიმი (אחרונים — შულხან არუხი და ვილნის შასი)',
    titleHe: 'תקופת האחרונים ודפוס וילנא',
    leadersKa: 'რ. იოსეფ კარო (შულხან არუხი), რამა, მაჰარშა, ვილნის გაონი, რაბი აკივა ეგერი, ხაზონ იში',
    centerKa: 'ცფათი, ვილნა, ვარშავა, ბნეი-ბრაკი, იერუსალიმი',
    milestoneKa:
      '1880–1886 წლებში ძმები რომების სტამბაში დაიბეჭდა ლეგენდარული „ვილნის შასი“ (דפוס וילנא) 2711 დაფით.',
  },
];

export const TalmudicTimeMachinePortalPanel: React.FC<SharedPart3Props> = ({ isDark }) => {
  const [selectedEraIdx, setSelectedEraIdx] = useState<number>(2);
  const currentEra = TALMUD_ERAS[selectedEraIdx] || TALMUD_ERAS[2];

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
          <Clock className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            26. „თალმუდური დროის მანქანა“ — 2000 წლის ქრონოლოგიური პორტალი (ზუგოთიდან ვილნის შასამდე)
          </span>
        </div>

        {/* Era Timeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {TALMUD_ERAS.map((era, idx) => (
            <button
              key={era.id}
              type="button"
              onClick={() => setSelectedEraIdx(idx)}
              className={`p-2 rounded-xl border text-left cursor-pointer transition-all card-modern-lift ${
                selectedEraIdx === idx
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] shadow-sm'
                  : isDark
                    ? 'bg-[#241810] border-[#5C3A21]'
                    : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="text-[10px] font-bold opacity-80">{era.years}</div>
              <div className="text-xs font-extrabold truncate">{era.titleKa}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentEra.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-black text-[#C49A6C]">{currentEra.titleKa}</div>
              <div dir="rtl" className="font-serif text-sm font-bold">
                {currentEra.titleHe} · {currentEra.years}
              </div>
            </div>
            <div className="text-xs">
              <strong className="text-[#C49A6C]">ეპოქის ბრძენნი:</strong> {currentEra.leadersKa}
            </div>
            <div className="text-xs">
              <strong className="text-[#C49A6C]">სულიერი ცენტრები:</strong> {currentEra.centerKa}
            </div>
            <p className="text-xs leading-relaxed pt-1 border-t border-[#8B5A2B]/25">
              {currentEra.milestoneKa}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #27: „არამეულ-ებრაული მორფოლოგიური სკანერი და ფუძის დეკონსტრუქტორი“
 * ============================================================================ */
interface MorphologyEntry {
  wordHe: string;
  translitKa: string;
  prefixHe: string;
  prefixMeaningKa: string;
  shoreshHe: string;
  shoreshMeaningKa: string;
  suffixHe: string;
  suffixMeaningKa: string;
  binyanKa: string;
  hebrewParallelHe: string;
}

const MORPHOLOGY_SAMPLES: MorphologyEntry[] = [
  {
    wordHe: 'דְּקָתָנֵי',
    translitKa: 'დე-კა-თანეი',
    prefixHe: 'דְּ + קָא',
    prefixMeaningKa: '„რომელიც“ (דְּ) + აწმყო განგრძობითი ნაწილაკი (קָא)',
    shoreshHe: 'ת-נ-י',
    shoreshMeaningKa: 'სწავლება / მიშნის გადმოცემა (ש-נ-ה)',
    suffixHe: '—',
    suffixMeaningKa: 'მხოლობითი რიცხვი, მესამე პირი',
    binyanKa: 'პეალ (פְּעַל — არამეული)',
    hebrewParallelHe: 'שֶׁשּׁוֹנֶה הַתַּנָּא',
  },
  {
    wordHe: 'מַזְכִּירִין',
    translitKa: 'მაზქირინ',
    prefixHe: 'מַ',
    prefixMeaningKa: 'ჰიფილის (הפעיל) მიმღეობის თავსართი',
    shoreshHe: 'ז-כ-ר',
    shoreshMeaningKa: 'გახსენება / მოხსენიება ლოცვაში',
    suffixHe: 'יִן',
    suffixMeaningKa: 'მრავლობითი რიცხვის მიშნური დაბოლოება (-ין)',
    binyanKa: 'ჰიფილი (הִפְעִיל)',
    hebrewParallelHe: 'מַזְכִּירִים בַּתְּפִלָּה',
  },
  {
    wordHe: 'וְלִיתְנֵי',
    translitKa: 'ველითნეი',
    prefixHe: 'וְ + לִ',
    prefixMeaningKa: '„და“ (וְ) + კითხვით-მოთხოვნითი „დაე გვასწავლოს“ (לִ)',
    shoreshHe: 'ת-נ-י',
    shoreshMeaningKa: 'მიშნაში სწავლება',
    suffixHe: 'ֵי',
    suffixMeaningKa: 'არამეული კავშირებითი ფორმა',
    binyanKa: 'პეალ (פְּעַל)',
    hebrewParallelHe: 'וְלִשְׁנוֹת / שֶׁיִּשְׁנֶה',
  },
  {
    wordHe: 'אִיתְּמַר',
    translitKa: 'ითმარ',
    prefixHe: 'אִתְ',
    prefixMeaningKa: 'ვნებითი გვარის (אִתְפְּעֵל) თავსართი — „ითქვა“',
    shoreshHe: 'א-מ-ר',
    shoreshMeaningKa: 'თქმა / ამორაიმთა დებატის წარდგენა',
    suffixHe: '—',
    suffixMeaningKa: 'წარსული დრო, მესამე პირი',
    binyanKa: 'ითპეელ (אִתְפְּעֵל)',
    hebrewParallelHe: 'נֶאֱמַר בְּבֵית הַמִּדְרָשׁ',
  },
];

export const AramaicRootMorphologyScannerPanel: React.FC<SharedPart3Props> = ({ isDark }) => {
  const [selectedWord, setSelectedWord] = useState<MorphologyEntry>(MORPHOLOGY_SAMPLES[0]);

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
          <Layers className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            27. არამეულ-ებრაული მორფოლოგიური სკანერი და ფუძის (שורש) 3D დეკონსტრუქტორი
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MORPHOLOGY_SAMPLES.map((item) => (
            <button
              key={item.wordHe}
              type="button"
              onClick={() => setSelectedWord(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                selectedWord.wordHe === item.wordHe
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
              }`}
            >
              <span dir="rtl" className="font-serif text-sm mr-1.5">
                {item.wordHe}
              </span>
              <span>[{item.translitKa}]</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWord.wordHe}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          >
            {/* Prefix */}
            <div
              className={`p-3 rounded-xl border text-center space-y-1 ${
                isDark ? 'bg-[#241810] border-sky-500/40' : 'bg-[#F5EBD6] border-sky-700/40'
              }`}
            >
              <div className="text-[11px] font-extrabold text-sky-400">
                1. თავსართი (תחילית)
              </div>
              <div dir="rtl" className="font-serif text-xl font-black">
                {selectedWord.prefixHe}
              </div>
              <div className="text-xs opacity-90">{selectedWord.prefixMeaningKa}</div>
            </div>

            {/* 3-Letter Shoresh */}
            <div
              className={`p-3 rounded-xl border-2 text-center space-y-1 ${
                isDark ? 'bg-[#2A1B11] border-[#C49A6C]' : 'bg-[#FDF8EE] border-[#6B4226]'
              }`}
            >
              <div className="text-[11px] font-extrabold text-[#C49A6C]">
                2. სამასოვანი ფუძე (שורש)
              </div>
              <div dir="rtl" className="font-serif text-2xl font-black text-[#C49A6C]">
                {selectedWord.shoreshHe}
              </div>
              <div className="text-xs font-bold">{selectedWord.shoreshMeaningKa}</div>
            </div>

            {/* Suffix & Binyan */}
            <div
              className={`p-3 rounded-xl border text-center space-y-1 ${
                isDark
                  ? 'bg-[#241810] border-emerald-500/40'
                  : 'bg-[#F5EBD6] border-emerald-700/40'
              }`}
            >
              <div className="text-[11px] font-extrabold text-emerald-400">
                3. ბოლოსართი და ბინიანი
              </div>
              <div dir="rtl" className="font-serif text-xl font-black">
                {selectedWord.suffixHe}
              </div>
              <div className="text-xs opacity-90">
                {selectedWord.binyanKa} • ებრ.: {selectedWord.hebrewParallelHe}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #28: „შასის 3D ჰოლოგრაფიული გალაქტიკა — 63 ტრაქტატის კოსმოსური რუკა“
 * ============================================================================ */
export const ShasHolographicGalaxyPanel: React.FC<
  SharedPart3Props & { completedDapim?: string[] }
> = ({ isDark, onNavigateToDaf, completedDapim = [] }) => {
  const [selectedSederId, setSelectedSederId] = useState<string>(SEDARIM[1].id); // Moed default

  const sederTractates = useMemo(
    () => TRACTATES.filter((t) => t.sederId === selectedSederId),
    [selectedSederId]
  );

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
            <Globe className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              28. „შასის 3D ჰოლოგრაფიული გალაქტიკა“ — 6 სედერისა და 63 ტრაქტატის ორბიტალური რუკა
            </span>
          </div>
          <span className="text-xs font-bold text-[#C49A6C]">
            შესწავლილი დაფები: {completedDapim.length} / 2711
          </span>
        </div>

        {/* 6 Sedarim Orbital Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
          {SEDARIM.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSederId(s.id)}
              className={`p-2 rounded-xl border text-center cursor-pointer transition-all card-modern-lift ${
                selectedSederId === s.id
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] shadow-sm'
                  : isDark
                    ? 'bg-[#241810] border-[#5C3A21]'
                    : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div dir="rtl" className="font-serif text-xs font-black text-[#C49A6C]">
                {s.nameHe}
              </div>
              <div className="text-[11px] font-extrabold truncate">{s.nameKa.split(' ')[1]}</div>
            </button>
          ))}
        </div>

        {/* Tractate Constellation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {sederTractates.map((tr) => (
            <div
              key={tr.id}
              onClick={() => onNavigateToDaf && onNavigateToDaf(tr.id, '2a')}
              className={`p-3 rounded-xl border cursor-pointer card-modern-lift flex flex-col justify-between gap-2 ${
                isDark
                  ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C]'
                  : 'bg-[#F5EBD6] border-[#CBB89D] hover:border-[#6B4226]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-black text-[#C49A6C]">{tr.nameKa}</span>
                  <span dir="rtl" className="font-serif text-sm font-bold">
                    {tr.nameHe}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 line-clamp-2">
                  {tr.descriptionKa}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-extrabold pt-1 border-t border-[#8B5A2B]/20">
                <span>
                  {tr.chapters} თავი • {tr.lastDaf} დაფი
                </span>
                <span className="text-[#C49A6C] flex items-center gap-0.5">
                  გახსნა (2a) <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
