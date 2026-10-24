// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  GitBranch,
  BookMarked,
  Users,
  StickyNote,
  Send,
  Loader2,
  CheckCircle2,
  Trash2,
  Maximize2,
  X,
  Scale,
  Volume2,
  Columns,
  HelpCircle,
  Calculator,
  Brain,
  Calendar,
  Network,
  FileSpreadsheet,
  HardDrive,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Swords,
  BookOpen,
  Highlighter,
  Award,
  Heart,
  Timer,
  GitMerge,
  Type,
  Mic,
  Feather,
  Clock,
  Layers,
  Globe,
  Zap,
  Archive,
  Smartphone,
  Download,
} from 'lucide-react';
import { DafPageData, ScholarNote, UILang } from '../types/talmud';
import { ARAMAIC_KEY_TERMS, TALMUD_SAGES } from '../data/lexicon';
import { getChavrutaCommentaryForDaf } from '../data/chavrutaCommentary';
import { INITIAL_FLASHCARDS, TalmudFlashcard } from '../data/worldClassFeaturesData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { ReadingLineGuide } from './ReadingLineGuide';
import { OfflineLibraryPanel } from './OfflineLibraryPanel';
import { WindowsWindowControls } from './WindowsWindowControls';
import { getBackendUrl, sanitizeGeorgianText } from '../utils/georgianTranslator';
import {
  AudioShiurKaraokePanel,
  HalachaBridgePanel,
  ParallelSugyotPanel,
  RealiaAndMeasuresPanel,
  SocraticChallengePanel,
} from './WorldClassModulesPart1';
import {
  DafYomiCalendarAndSiyumPanel,
  FlashcardsSpacedRepetitionPanel,
  ManuscriptsAndChiddushimStudioPanel,
  SageDynastyNetworkPanel,
} from './WorldClassModulesPart2';
import {
  LiveBeitMidrashDebatePanel,
  TalmudicLogicHermeneuticsPanel,
  HistoricalGeographicalAtlasPanel,
  MachloketDebateArenaPanel,
  TanakhInShasConcordancePanel,
  DafInkAndHighlighterPanel,
} from './WorldClassModulesPart3';
import {
  GematriaNotarikonLabPanel,
  YeshivaSemichaExamPanel,
  EinYaakovAggadahPanel,
  ChavrutaSederTimerPanel,
  SugyaFlowchartBuilderPanel,
  SoferRashiScriptTrainerPanel,
} from './WorldClassModulesPart4';
import {
  SynapticConstellationBridgePanel,
  BeitDinCourtSimulatorPanel,
  SoferCalligraphyCanvasPanel,
  TalmudicTimeMachinePortalPanel,
  AramaicRootMorphologyScannerPanel,
  ShasHolographicGalaxyPanel,
} from './WorldClassModulesPart5';
import { PoskimHalachaMasterGrid } from './PoskimHalachaMasterGrid';
import { DailyBlessingsView } from './DailyBlessingsView';

interface SmartStudyPanelsProps {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  isDark: boolean;
  uiLang: UILang;
  notes: ScholarNote[];
  onDeleteNote: (id: string) => void;
  onHighlightSentence: (sentenceId: string | null) => void;
  completedDapim: string[];
  onToggleDafComplete: (dafKey: string) => void;
  onNavigateToDaf?: (tractateId: string, dafId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type PanelTab =
  | 'halacha-bridge'
  | 'audio-shiur'
  | 'parallel-sugyot'
  | 'socratic-quiz'
  | 'realia-measures'
  | 'flashcards-srs'
  | 'daf-yomi-tracker'
  | 'sage-dynasty'
  | 'manuscripts-studio'
  | 'offline-library'
  | 'live-debate-theater'
  | 'hermeneutics-logic'
  | 'historical-atlas'
  | 'machloket-arena'
  | 'tanakh-concordance'
  | 'daf-highlighter'
  | 'gematria-lab'
  | 'semicha-exam'
  | 'ein-yaakov'
  | 'seder-timer'
  | 'sugya-flowchart'
  | 'sofer-rashi-trainer'
  | 'synaptic-bridge'
  | 'beit-din-court'
  | 'sofer-calligraphy'
  | 'time-machine'
  | 'aramaic-morphology'
  | 'shas-galaxy'
  | 'poskim-master-grid'
  | 'daily-blessings'
  | 'sugya-map'
  | 'chavruta'
  | 'lexicon'
  | 'sages'
  | 'notes';

export const SmartStudyPanels: React.FC<SmartStudyPanelsProps> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  uiLang,
  notes,
  onDeleteNote,
  onHighlightSentence,
  completedDapim,
  onToggleDafComplete,
  onNavigateToDaf,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('halacha-bridge');
  const [isStudyCenterMaximized, setIsStudyCenterMaximized] = useState<boolean>(false);
  const [isActiveTabMinimized, setIsActiveTabMinimized] = useState<boolean>(false);
  const [isActiveTabMaximized, setIsActiveTabMaximized] = useState<boolean>(false);
  const [chavrutaQuestion, setChavrutaQuestion] = useState('');
  const [chavrutaHistory, setChavrutaHistory] = useState<{ q: string; a: string }[]>([]);
  const [chavrutaLoading, setChavrutaLoading] = useState(false);
  const [termFilter, setTermFilter] = useState('');
  const [flashcards, setFlashcards] = useState<TalmudFlashcard[]>(() => {
    try {
      const saved = localStorage.getItem('talmud-flashcards-srs-v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FLASHCARDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('talmud-flashcards-srs-v1', JSON.stringify(flashcards));
    } catch {
      // ignore
    }
  }, [flashcards]);

  const handleUpdateFlashcardBox = (cardId: string, newBox: number) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, boxLevel: newBox } : c))
    );
  };

  const handleAddCustomFlashcard = (
    termHe: string,
    translitKa: string,
    meaningKa: string
  ) => {
    const newCard: TalmudFlashcard = {
      id: `fc-user-${Date.now()}`,
      termHe,
      translitKa,
      meaningKa,
      category: 'user-saved',
      exampleHe: `${tractateNameHe} ${dafData.dafId}: ${termHe}`,
      exampleKa: `${tractateNameKa} ${dafData.dafId} — მომხმარებლის მიერ შენახული ტერმინი`,
      boxLevel: 1,
    };
    setFlashcards((prev) => [newCard, ...prev]);
  };

  const [fullscreenModal, setFullscreenModal] = useState<{
    title: string;
    subtitle?: string;
    hebrewText?: string;
    georgianText: string;
  } | null>(null);

  const currentDafKey = `${dafData.tractateId}:${dafData.dafId}`;
  const isDafCompleted = completedDapim.includes(currentDafKey);

  const allCoreSentences = [...dafData.mishnah, ...dafData.gemara];

  const handleAskChavruta = async (presetQuestion?: string) => {
    const q = (presetQuestion || chavrutaQuestion).trim();
    if (!q) return;
    if (!presetQuestion) setChavrutaQuestion('');

    setChavrutaLoading(true);
    try {
      const dafExcerpt = allCoreSentences
        .map((s) => `${s.hebrewText} (${s.translationKa})`)
        .join('\n');

      const res = await fetch(getBackendUrl('/api/talmud/chavruta'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          tractateHebrew: tractateNameHe,
          tractateGeorgian: tractateNameKa,
          daf: dafData.dafId,
          dafExcerpt,
          language: uiLang,
        }),
      });
      const data = await res.json();
      setChavrutaHistory((prev) => [{ q, a: data.reply || 'პასუხი ვერ მოიძებნა.' }, ...prev]);
    } catch {
      setChavrutaHistory((prev) => [
        {
          q,
          a: `ამ სუგიაში (${tractateNameKa} ${dafData.dafId}) განიხილება მიშნისა და გემარის ძირითადი კამათი (შაქლა ვეტარია), რაშისა და თოსაფოთის შედარებითი ანალიზით.`,
        },
        ...prev,
      ]);
    } finally {
      setChavrutaLoading(false);
    }
  };

  const stageColorMap: Record<string, string> = {
    mishnah: isDark
      ? 'border-[#C49A6C]/50 bg-[#6B4226]/30 text-[#EED9B9]'
      : 'border-[#8B5A2B]/40 bg-[#EFE5D0] text-[#4A2E1B]',
    question: isDark
      ? 'border-rose-400/50 bg-rose-500/15 text-rose-300'
      : 'border-rose-800/40 bg-rose-100 text-rose-950',
    answer: isDark
      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
      : 'border-emerald-800/40 bg-emerald-100 text-emerald-950',
    proof: isDark
      ? 'border-[#C49A6C]/50 bg-[#5C3A21]/30 text-[#FAF5EB]'
      : 'border-[#8B5A2B]/40 bg-[#E6D7BE] text-[#2C1A10]',
    refutation: isDark
      ? 'border-[#B8860B]/50 bg-[#B8860B]/20 text-[#EED9B9]'
      : 'border-[#8B5A2B]/50 bg-[#DFCFB4] text-[#4A2E1B]',
    resolution: isDark
      ? 'border-[#C49A6C]/50 bg-[#6B4226]/35 text-[#FAF5EB]'
      : 'border-[#6B4226]/40 bg-[#EFE5D0] text-[#2C1A10]',
    halacha: isDark
      ? 'border-teal-400/50 bg-teal-500/15 text-teal-300'
      : 'border-teal-800/40 bg-teal-100 text-teal-950',
  };

  const filteredTerms = ARAMAIC_KEY_TERMS.filter((t) => {
    if (!termFilter.trim()) return true;
    const q = termFilter.toLowerCase();
    return (
      t.termHe.includes(q) ||
      t.translitKa.toLowerCase().includes(q) ||
      t.meaningKa.toLowerCase().includes(q)
    );
  });

  return (
    <div data-study-center="true"
      className={
        isStudyCenterMaximized
          ? `fixed inset-2 z-[320] overflow-y-auto rounded-2xl border-2 transition-colors shadow-2xl ${
              isDark
                ? 'bg-[#241810] border-[#C49A6C] text-[#FAF5EB]'
                : 'bg-[#EDE2CC] border-[#8B5A2B] text-[#2C1A10]'
            }`
          : `rounded-2xl border overflow-hidden transition-colors ${
              isDark
                ? 'bg-[#241810]/95 border-[#C49A6C]/35 text-[#FAF5EB]'
                : 'bg-[#EDE2CC] border-[#8B5A2B]/35 text-[#2C1A10] shadow-md'
            }`
      }
    >
      <header className="study-center-header">
        <div className="study-center-title"><BookOpen /><h2>სასწავლო ცენტრი</h2><span>{tractateNameKa} {dafData.dafId}</span></div>
        <div className="study-center-actions">
          <Button variant="ghost" size="sm" onClick={() => onToggleDafComplete(currentDafKey)} aria-pressed={isDafCompleted} className="study-completion"><CheckCircle2 />{isDafCompleted ? 'შესწავლილია' : 'შესწავლილად მონიშვნა'}</Button>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-expanded={!isCollapsed} title={isCollapsed ? 'ჩვენება' : 'დამალვა'} aria-label={isCollapsed ? 'ჩვენება' : 'დამალვა'}>{isCollapsed ? <ChevronDown /> : <ChevronUp />}</Button>
          <Button variant="ghost" size="icon" onClick={() => { if (isCollapsed) onToggleCollapse?.(); setIsStudyCenterMaximized(v => !v); }} title={isStudyCenterMaximized ? 'დაბრუნება' : 'სრული ეკრანი'} aria-label={isStudyCenterMaximized ? 'დაბრუნება' : 'სრული ეკრანი'}>{isStudyCenterMaximized ? <X /> : <Maximize2 />}</Button>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="smart-study-panels-collapsible-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >

      {/* Searchable Dropdown for Study Tool Selection */}
      <div
        className={`px-3.5 pt-3 pb-2 border-b ${
          isDark ? 'border-[#5C3A21] bg-[#241810]/60' : 'border-[#CBB89D] bg-[#E8DCC4]/60'
        }`}
      >
        <SearchableSelect
          label="სასწავლო ინსტრუმენტი"
          wrapLabels
          options={
            [
              {
                value: 'halacha-bridge',
                badgeHe: '1 · גמרא להלכה',
                label: '1. ჰალახის ცოცხალი ხიდი (გემარა → რამბამი → ტური → შულხან არუხი)',
              },
              {
                value: 'audio-shiur',
                badgeHe: '2 · שיעור שמע',
                label: '2. სინქრონიზებული აუდიო-შიური და კარაოკე-ჰაილაითინგი',
              },
              {
                value: 'parallel-sugyot',
                badgeHe: '3 · מסורת הש״ס',
                label: '3. პარალელური სუგიების სინოპტიკური შედარება (Synoptic Sugyot)',
              },
              {
                value: 'socratic-quiz',
                badgeHe: '4 · חברותא בוחן',
                label: '4. სოკრატული „ხავრუთა-გამოწვევის“ რეჟიმი (კითხვა-პასუხის ტესტი)',
              },
              {
                value: 'realia-measures',
                badgeHe: '5 · שיעורי תורה',
                label: '5. თალმუდური რეალიების, საზომებისა და მონეტების ატლასი + კალკულატორი',
              },
              {
                value: 'flashcards-srs',
                badgeHe: '6 · כרטיסיות זיכרון',
                label: '6. არამეული ლექსიკისა და ראשי תיבות-ის Spaced-Repetition ფლეშ-ბარათები',
              },
              {
                value: 'daf-yomi-tracker',
                badgeHe: '7 · דף היומי וסיום',
                label: '7. „დაფ იომის“ კალენდარი, სტრიქი და სიუმის სერტიფიკატი',
              },
              {
                value: 'sage-dynasty',
                badgeHe: '8 · שלשלת הקבלה',
                label: '8. ბრძენთა ქრონოლოგიური გენეალოგია და „რაბი–მოწაფის“ გრაფი',
              },
              {
                value: 'manuscripts-studio',
                badgeHe: '9 · דקדוקי סופרים',
                label: '9. ხელნაწერთა ვარიანტებისა (მიუნხენი 95 / ბახი) და „ხიდუშების“ სტუდია',
              },
              {
                value: 'offline-library',
                badgeHe: '10 · ספריית אופליין',
                label: '10. სრული ოფლაინ ბიბლიოთეკა • ტრაქტატების პაკეტების ჩამოტვირთვა (Workbox)',
              },
              {
                value: 'live-debate-theater',
                badgeHe: '11 · קולות בית המדרש',
                label: '11. „ცოცხალი ბეთ-მიდრაში“ — მრავალხმიანი ხმოვანი დებატების თეატრი (მაკშანი/თარცანი)',
              },
              {
                value: 'hermeneutics-logic',
                badgeHe: '12 · י״ג מידות וקל וחומר',
                label: '12. თალმუდური ლოგიკის რენტგენი — 13 მიდოთი და კალ-ვახომერის სასწორი',
              },
              {
                value: 'historical-atlas',
                badgeHe: '13 · אטלס בבל וא״י',
                label: '13. 3D ისტორიულ-გეოგრაფიული ატლასი: ბაბილონისა და ერეც-ისრაელის იეშივები',
              },
              {
                value: 'machloket-arena',
                badgeHe: '14 · זירת המחלוקת',
                label: '14. „მახლოკეთის (מחלוקת) არენა“ — ბრძენთა დაპირისპირების სიმეტრიული დაფა',
              },
              {
                value: 'tanakh-concordance',
                badgeHe: '15 · תנ״ך בש״ס',
                label: '15. „შას-კონკორდანცია და ფასუკების ინდექსი“ (Tanakh-in-Shas Explorer)',
              },
              {
                value: 'daf-highlighter',
                badgeHe: '16 · סימון צורת הדף',
                label: '16. „ციფრული კალამი და მარკერი დაფზე“ — ფერადი კოდირება და კავშირები',
              },
              {
                value: 'gematria-lab',
                badgeHe: '17 · גימטריא ונוטריקון',
                label: '17. გემატრიის, ნოტარიკონისა და ათბაშის (א״ת ב״ש) ინტერაქტიული ლაბორატორია',
              },
              {
                value: 'semicha-exam',
                badgeHe: '18 · מבחן סמיכה',
                label: '18. „იეშივის გამოცდა და სმიხის (סמיכה) სერტიფიკატი“ (ბეკიუთი • იუნი • ჰორაა)',
              },
              {
                value: 'ein-yaakov',
                badgeHe: '19 · עין יעקב ומוסר',
                label: '19. „ეინ იაკოვი“ — თალმუდური სიბრძნის, იგავებისა და მუსარის საგანძური',
              },
              {
                value: 'seder-timer',
                badgeHe: '20 · שעון סדר ישיבה',
                label: '20. „ხავრუთა-ტაიმერი (სედერ-ტაიმერი)“ და იეშივის ფოკუს-სესიები',
              },
              {
                value: 'sugya-flowchart',
                badgeHe: '21 · תרשים זרימה לסוגיא',
                label: '21. „შაქლა ვეტარიას“ ცოცხალი გონებრივი რუკა (Interactive Sugya Flowchart)',
              },
              {
                value: 'sofer-rashi-trainer',
                badgeHe: '22 · כתב רש״י וראשי תיבות',
                label: '22. „სოფერის ოსტატობა“ — რაშის შრიფტისა და ראשי תיבות-ის ტრენაჟორი',
              },
              {
                value: 'synaptic-bridge',
                badgeHe: '23 · גשר סינפטי תלת-ממדי',
                label: '23. ცოცხალი გემარა-რაში-თოსაფოთის 3D სინაფსური ხიდი (Animated Beams)',
              },
              {
                value: 'beit-din-court',
                badgeHe: '24 · סימולטור בית דין',
                label: '24. „ბეთ-დინის (בית דין) ჰალახური სასამართლო სიმულატორი“ — დაიანის განაჩენი',
              },
              {
                value: 'sofer-calligraphy',
                badgeHe: '25 · קולמוס סופר סת״ם',
                label: '25. „სოფერის ცოცხალი კალიგრაფიის სტუდია“ — ვირტუალური კულმუსი და თაგინი',
              },
              {
                value: 'time-machine',
                badgeHe: '26 · מנהרת הזמן התלמודית',
                label: '26. „თალმუდური დროის მანქანა“ — 2000 წლის ქრონოლოგიური პორტალი',
              },
              {
                value: 'aramaic-morphology',
                badgeHe: '27 · מפרק שורשים ובניינים',
                label: '27. არამეულ-ებრაული მორფოლოგიური სკანერი და ფუძის (שורש) 3D დეკონსტრუქტორი',
              },
              {
                value: 'shas-galaxy',
                badgeHe: '28 · גלקסיית הש״ס',
                label: '28. „შასის 3D ჰოლოგრაფიული გალაქტიკა“ — 6 სედერისა და 63 ტრაქტატის რუკა',
              },
              {
                value: 'poskim-master-grid',
                badgeHe: '29 · פוסקי הדורות (ספרד ואשכנז)',
                label: '29. ფოსკიმების დიდი ბადე — სეფარადული და აშკენაზური ჰალახის კანონმდებლები (ყოვადია იოსეფი, აბა შაული, ბენ იშ ხაი, ქაფ ჰახაიმი, მოშე ლევი, მიშნა ბრურა, ოირბახი, ფაინშტეინი, გრენცფილდი)',
              },
              {
                value: 'daily-blessings',
                badgeHe: '30 · סדר ברכות יומיות',
                label: '30. ყოველდღიური კურთხევების გზამკვლევი (ברכות הנהנין, השחר והדרך)',
              },
              {
                value: 'sugya-map',
                badgeHe: 'שקלא וטריא',
                label: 'სუგიის ლოგიკური რუკა (მიშნა და გემარა)',
              },
              {
                value: 'chavruta',
                badgeHe: 'פירוש חברותא',
                label: 'ხავრუთა (חברותא) — გემარის გაშლილი კომენტარი და AI პარტნიორი',
              },
              {
                value: 'lexicon',
                badgeHe: 'ארמית',
                label: 'არამეული ტერმინების ლექსიკონი',
              },
              {
                value: 'sages',
                badgeHe: 'חכמי הש״ס',
                label: 'თანაიმი და ამორაიმი (ბიოგრაფიები)',
              },
              {
                value: 'notes',
                badgeHe: `הגהות (${notes.length})`,
                label: `პირადი შენიშვნები და კომენტარები (${notes.length})`,
              },
            ] as SelectOption[]
          }
          value={activeTab}
          onChange={(val) => { setActiveTab(val as PanelTab); setIsActiveTabMinimized(false); }}
          isDark={isDark}
          compact
        />
      </div>

      {/* Classic 5 Beit Midrash Navigation Tabs */}
      <div
        className={`study-core-tabs flex gap-1 p-2 border-b w-full overflow-x-auto ${
          isDark ? 'border-[#5C3A21] bg-[#1D130D]/90' : 'border-[#CBB89D] bg-[#E5D7BE]'
        }`}
      >
        {(
          [
            { id: 'sugya-map', label: 'სუგია', icon: GitBranch },
            { id: 'chavruta', label: 'ხავრუთა', icon: Sparkles },
            { id: 'lexicon', label: 'არამეული', icon: BookMarked },
            { id: 'sages', label: 'ბრძენნი', icon: Users },
            { id: 'notes', label: `შენიშვნა (${notes.length})`, icon: StickyNote },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm'
                  : isDark
                    ? 'bg-[#2B1D14] text-[#EED9B9] border border-[#5C3A21] hover:border-[#C49A6C]'
                    : 'bg-[#FBF7F0] text-[#2C1A10] border border-[#CBB89D] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className={
          isActiveTabMinimized
            ? 'hidden'
            : isActiveTabMaximized
              ? `fixed inset-2 z-[270] overflow-y-auto rounded-2xl border-2 p-4 sm:p-6 shadow-2xl space-y-3 ${
                  isDark
                    ? 'bg-[#1D130D] border-[#C49A6C] text-[#FAF5EB]'
                    : 'bg-[#FAF4E4] border-[#8B5A2B] text-[#2C1A10]'
                }`
              : 'study-tool-content relative p-3 sm:p-4 space-y-3'
        }
      >
        {isActiveTabMaximized && (
          <div className="sticky top-0 z-30 pb-2 mb-3 border-b border-[#8B5A2B]/30 flex items-center justify-between bg-inherit">
            <span className="text-xs font-black">
              სრული ეკრანი • {tractateNameKa} {dafData.dafId} ({activeTab})
            </span>
            <WindowsWindowControls
              isMinimized={false}
              onToggleMinimize={() => {
                setIsActiveTabMaximized(false);
                setIsActiveTabMinimized(true);
              }}
              isMaximized={true}
              onToggleMaximize={() => setIsActiveTabMaximized(false)}
              onClose={() => setIsActiveTabMaximized(false)}
              isDark={isDark}
              size="sm"
            />
          </div>
        )}

        {activeTab === 'halacha-bridge' && (
          <HalachaBridgePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'audio-shiur' && (
          <AudioShiurKaraokePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'parallel-sugyot' && (
          <ParallelSugyotPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'socratic-quiz' && (
          <SocraticChallengePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'realia-measures' && (
          <RealiaAndMeasuresPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'flashcards-srs' && (
          <FlashcardsSpacedRepetitionPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            notes={notes}
            completedDapim={completedDapim}
            onToggleDafComplete={onToggleDafComplete}
            onNavigateToDaf={onNavigateToDaf}
            flashcards={flashcards}
            onUpdateFlashcardBox={handleUpdateFlashcardBox}
            onAddCustomFlashcard={handleAddCustomFlashcard}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'daf-yomi-tracker' && (
          <DafYomiCalendarAndSiyumPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            notes={notes}
            completedDapim={completedDapim}
            onToggleDafComplete={onToggleDafComplete}
            onNavigateToDaf={onNavigateToDaf}
            flashcards={flashcards}
            onUpdateFlashcardBox={handleUpdateFlashcardBox}
            onAddCustomFlashcard={handleAddCustomFlashcard}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'sage-dynasty' && (
          <SageDynastyNetworkPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            notes={notes}
            completedDapim={completedDapim}
            onToggleDafComplete={onToggleDafComplete}
            onNavigateToDaf={onNavigateToDaf}
            flashcards={flashcards}
            onUpdateFlashcardBox={handleUpdateFlashcardBox}
            onAddCustomFlashcard={handleAddCustomFlashcard}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'manuscripts-studio' && (
          <ManuscriptsAndChiddushimStudioPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            notes={notes}
            completedDapim={completedDapim}
            onToggleDafComplete={onToggleDafComplete}
            onNavigateToDaf={onNavigateToDaf}
            flashcards={flashcards}
            onUpdateFlashcardBox={handleUpdateFlashcardBox}
            onAddCustomFlashcard={handleAddCustomFlashcard}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'offline-library' && (
          <OfflineLibraryPanel
            currentDafData={dafData}
            isDark={isDark}
            onNavigateToDaf={(tractateId, dafId) => {
              onNavigateToDaf?.(tractateId, dafId);
            }}
          />
        )}

        {activeTab === 'live-debate-theater' && (
          <LiveBeitMidrashDebatePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'hermeneutics-logic' && (
          <TalmudicLogicHermeneuticsPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'historical-atlas' && (
          <HistoricalGeographicalAtlasPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'machloket-arena' && (
          <MachloketDebateArenaPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'tanakh-concordance' && (
          <TanakhInShasConcordancePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'daf-highlighter' && (
          <DafInkAndHighlighterPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'gematria-lab' && (
          <GematriaNotarikonLabPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'semicha-exam' && (
          <YeshivaSemichaExamPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'ein-yaakov' && (
          <EinYaakovAggadahPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'seder-timer' && (
          <ChavrutaSederTimerPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'sugya-flowchart' && (
          <SugyaFlowchartBuilderPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'sofer-rashi-trainer' && (
          <SoferRashiScriptTrainerPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'synaptic-bridge' && (
          <SynapticConstellationBridgePanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'beit-din-court' && (
          <BeitDinCourtSimulatorPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'sofer-calligraphy' && (
          <SoferCalligraphyCanvasPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'time-machine' && (
          <TalmudicTimeMachinePortalPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'aramaic-morphology' && (
          <AramaicRootMorphologyScannerPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'shas-galaxy' && (
          <ShasHolographicGalaxyPanel
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            completedDapim={completedDapim}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'poskim-master-grid' && (
          <PoskimHalachaMasterGrid
            dafData={dafData}
            tractateNameHe={tractateNameHe}
            tractateNameKa={tractateNameKa}
            isDark={isDark}
            onHighlightSentence={onHighlightSentence}
            onNavigateToDaf={onNavigateToDaf}
            onOpenFullscreen={setFullscreenModal}
          />
        )}

        {activeTab === 'daily-blessings' && (
          <DailyBlessingsView
            isDark={isDark}
            onOpenFullscreen={setFullscreenModal}
          />
        )}
        {activeTab === 'sugya-map' && (
          <div className="space-y-2.5">
            <p className="text-xs opacity-80 leading-relaxed">
              <strong>შაქლა ვეტარია (שקלא וטריא):</strong> დააწკაპუნეთ ნებისმიერ ბარათს, რათა თალმუდის დაფი ავტომატურად გადავიდეს შესაბამის მონაკვეთზე.
            </p>
            {allCoreSentences.map((s, idx) => {
              const stage = s.sugyaStage || {
                type: s.source === 'mishnah' ? 'mishnah' : 'question',
                labelHe: s.source === 'mishnah' ? 'משנה' : 'גמרא',
                labelKa: s.source === 'mishnah' ? 'მიშნა' : 'გემარა',
              };
              const badgeStyle = stageColorMap[stage.type] || stageColorMap.mishnah;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onHighlightSentence(s.id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#1D130D]/90 border-[#5C3A21] hover:border-[#C49A6C]'
                      : 'bg-[#FBF7F0] border-[#CBB89D] hover:border-[#6B4226]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}
                    >
                      #{idx + 1} · {stage.labelKa} ({stage.labelHe})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenModal({
                          title: `${stage.labelKa} (${stage.labelHe}) — ნაბიჯი #${idx + 1}`,
                          hebrewText: s.hebrewText,
                          georgianText: `${sanitizeGeorgianText(s.translationKa)}\n\n${sanitizeGeorgianText(s.explanationKa)}`,
                        });
                      }}
                      className={`p-1 rounded cursor-pointer ${
                        isDark
                          ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                          : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                      }`}
                      title="მთელ ეკრანზე გახსნა"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div dir="rtl" className="font-serif text-sm font-bold mb-1">
                    {s.hebrewText}
                  </div>
                  <div className="text-xs opacity-90 leading-snug">
                    {sanitizeGeorgianText(s.translationKa)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'chavruta' && (
          <div className="space-y-3">
            {/* Built-in Chavruta Running Elucidation of the Current Daf */}
            <div className="space-y-2">
              <div
                className={`text-xs font-extrabold flex items-center justify-between ${
                  isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                }`}
              >
                <span>
                  פירוש חברותא • ხავრუთას კომენტარი გემარაზე ({tractateNameKa} {dafData.dafId}):
                </span>
              </div>
              {(
                dafData.chavruta && dafData.chavruta.length > 0
                  ? dafData.chavruta
                  : getChavrutaCommentaryForDaf(
                      dafData.tractateId,
                      dafData.dafId,
                      dafData.gemara,
                      dafData.allCommentaries
                    )
              ).map((chav) => (
                <div
                  key={chav.id}
                  onClick={() => onHighlightSentence(chav.id)}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-[#1D130D]/90 border-[#5C3A21] hover:border-[#C49A6C]'
                      : 'bg-[#FBF7F0] border-[#8B5A2B]/35 hover:border-[#6B4226]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      dir="rtl"
                      className={`font-serif font-black text-sm ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      {chav.dibburHamatchil || 'פירוש חברותא'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenModal({
                          title: chav.commentatorNameKa || 'ხავრუთა (פירוש חברותא)',
                          subtitle: chav.dibburHamatchil,
                          hebrewText: chav.hebrewText,
                          georgianText: `${sanitizeGeorgianText(chav.translationKa)}\n\n${sanitizeGeorgianText(chav.explanationKa)}`,
                        });
                      }}
                      className={`p-1 rounded cursor-pointer shrink-0 ${
                        isDark
                          ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                          : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                      }`}
                      title="მთელ ეკრანზე გახსნა (ისრით)"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div dir="rtl" className="font-serif text-sm leading-relaxed">
                    {chav.hebrewText}
                  </div>
                  <div className="leading-relaxed font-medium">
                    {sanitizeGeorgianText(chav.translationKa)}
                  </div>
                  {chav.explanationKa && (
                    <div className="text-[11px] opacity-80 pt-1 border-t border-[#8B5A2B]/25">
                      {sanitizeGeorgianText(chav.explanationKa)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs opacity-85 leading-relaxed pt-2 border-t border-[#8B5A2B]/25">
              დაუსვით კითხვა <strong>AI ხავრუთას (חברותא)</strong> მიმდინარე დაფის (
              {tractateNameKa} {dafData.dafId}) შესახებ:
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'რა განსხვავებაა რაშისა და თოსაფოთის პოზიციებს შორის ამ დაფზე?',
                'შეაჯამე ამ გვერდის მთავარი ჰალახური დასკვნა',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAskChavruta(preset)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C] text-[#EED9B9]'
                      : 'bg-[#FBF7F0] border-[#CBB89D] hover:border-[#6B4226] text-[#2C1A10]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskChavruta();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chavrutaQuestion}
                onChange={(e) => setChavrutaQuestion(e.target.value)}
                placeholder="ჰკითხეთ ხავრუთას ამ სუგიაზე..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
                    : 'bg-[#FBF7F0] border-[#8B5A2B]/50 text-[#2C1A10]'
                }`}
              />
              <button
                type="submit"
                disabled={chavrutaLoading}
                className="px-3.5 py-2 rounded-xl bg-[#6B4226] text-[#FBF7F0] font-bold text-xs hover:bg-[#7D4E2D] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {chavrutaLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            <div className="space-y-3 pt-1">
              {chavrutaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-bold ${isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'}`}>
                      კითხვა: {item.q}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenModal({
                          title: `AI ხავრუთა: ${item.q}`,
                          georgianText: item.a,
                        })
                      }
                      className={`p-1 rounded cursor-pointer shrink-0 ${
                        isDark
                          ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                          : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                      }`}
                      title="მთელ ეკრანზე გახსნა"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lexicon' && (
          <div className="space-y-2.5">
            <input
              type="text"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              placeholder="გაფილტრეთ არამეული ტერმინი..."
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
                  : 'bg-[#FBF7F0] border-[#8B5A2B]/50 text-[#2C1A10]'
              }`}
            />
            {filteredTerms.map((term) => (
              <div
                key={term.termHe}
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1D130D]/90 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-bold text-xs ${isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'}`}>
                    [{term.translitKa}]
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span dir="rtl" className="font-serif text-base font-bold">
                      {term.termHe}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenModal({
                          title: `${term.translitKa} (${term.termHe})`,
                          hebrewText: `${term.termHe} — ${term.meaningHe}`,
                          georgianText: `${term.meaningKa}\n\n${term.usageKa}`,
                        })
                      }
                      className={`p-1 rounded cursor-pointer ${
                        isDark
                          ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                          : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                      }`}
                      title="მთელ ეკრანზე გახსნა"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs font-semibold mb-1">{term.meaningKa}</div>
                <div className="text-[11px] opacity-80">{term.usageKa}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sages' && (
          <div className="space-y-2.5">
            {TALMUD_SAGES.map((sage) => (
              <div
                key={sage.nameHe}
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#1D130D]/90 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <div className={`font-bold text-xs ${isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'}`}>
                      {sage.nameKa}
                    </div>
                    <div className="text-[10px] opacity-75">
                      {sage.era || sage.eraKa} · {sage.academy || sage.generationKa}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span dir="rtl" className="font-serif text-base font-bold">
                      {sage.nameHe}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenModal({
                          title: `${sage.nameKa} (${sage.nameHe})`,
                          subtitle: `${sage.era || sage.eraKa || ''} • ${sage.academy || sage.generationKa || ''}`,
                          georgianText: `${sage.bioKa}${sage.keyTeachingsKa ? `\n\nმთავარი სწავლება: ${sage.keyTeachingsKa}` : ''}`,
                        })
                      }
                      className={`p-1 rounded cursor-pointer ${
                        isDark
                          ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                          : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                      }`}
                      title="მთელ ეკრანზე გახსნა"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-1.5">{sage.bioKa}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-2.5">
            {notes.length === 0 ? (
              <div className="text-xs text-center py-8 opacity-75">
                თქვენ ჯერ არ დაგიმატებიათ პირადი შენიშვნა. დააჭირეთ დაფზე ღილაკს „კომენტარის დამატება“.
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.sentenceId) onHighlightSentence(n.sentenceId);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer ${
                    isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      dir="rtl"
                      className={`font-serif font-bold text-sm ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                      }`}
                    >
                      {n.word}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-60">{n.createdAt}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenModal({
                            title: `პირადი კომენტარი / შენიშვნა (${n.createdAt})`,
                            hebrewText: n.hebrewSnippet || n.word,
                            georgianText: n.noteText,
                          });
                        }}
                        className={`p-1 rounded cursor-pointer ${
                          isDark
                            ? 'hover:bg-[#6B4226]/30 text-[#EED9B9]'
                            : 'hover:bg-[#EFE5D0] text-[#5C3A21]'
                        }`}
                        title="მთელ ეკრანზე გახსნა"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(n.id);
                        }}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">{n.noteText}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal when double-clicking any Study Panel card */}
      <AnimatePresence>
      {fullscreenModal && (
        <motion.div
          key="smart-panel-fullscreen-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.44, ease: 'easeInOut' }}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            key="smart-panel-fullscreen-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full max-w-3xl max-h-[90vh] rounded-3xl border-2 p-5 sm:p-7 flex flex-col gap-4 overflow-y-auto shadow-2xl ${
              isDark
                ? 'bg-[#1D130D] border-[#C49A6C]/60 text-[#FAF5EB]'
                : 'bg-[#FBF7F0] border-[#8B5A2B]/60 text-[#2C1A10]'
            }`}
          >
            <ReadingLineGuide
              initialY={78}
              isDarkField={isDark}
              fieldLabel="მთელ ეკრანზე სასწავლო ტექსტი"
            />
            <div className="flex items-center justify-between gap-3 border-b border-[#8B5A2B]/35 pb-3">
              <div>
                <h3
                  className={`text-base sm:text-xl font-black ${
                    isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                  }`}
                >
                  {fullscreenModal.title}
                </h3>
                {fullscreenModal.subtitle && (
                  <p className="text-xs opacity-75">{fullscreenModal.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFullscreenModal(null)}
                className="p-2 rounded-full bg-[#6B4226] text-[#FBF7F0] font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {fullscreenModal.hebrewText && (
              <div
                dir="rtl"
                className="p-4 rounded-2xl border border-[#8B5A2B]/40 bg-[#6B4226]/10 font-serif text-xl sm:text-2xl font-bold leading-relaxed text-right"
              >
                {fullscreenModal.hebrewText}
              </div>
            )}
            <div className="text-sm sm:text-lg leading-relaxed whitespace-pre-line font-medium">
              {fullscreenModal.georgianText}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
