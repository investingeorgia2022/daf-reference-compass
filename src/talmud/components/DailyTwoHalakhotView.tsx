// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Scale,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Volume2,
  Copy,
  Check,
  ArrowUpRight,
  Compass,
  HelpCircle,
  RotateCcw,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { WindowsWindowControls } from './WindowsWindowControls';
import { SearchableSelect } from './SearchableSelect';
import { SacredRealmId, numberToHebrewGematria } from '../data/tanakhAndHalakhaData';
import {
  YALKUT_YOSEF_CURATED_SIMANIM,
  YalkutCuratedSiman,
  YalkutSeifItem,
} from '../data/yalkutYosefKitzurData';
import { getHebrewDateInfo } from '../data/hebrewCalendarAndTzadikimData';

export type DailyHalakhaTrackId =
  | 'yalkut-yosef'
  | 'shulchan-aruch-mb'
  | 'shabbat-kashrut'
  | 'ben-ish-chai';

export interface DailySingleHalakhaCardData {
  slot: 1 | 2;
  slotLabelKa: string;
  slotLabelHe: string;
  simanId: string;
  bookId: string;
  simanNum: number;
  simanHe: string;
  seifHe: string;
  topicTitleHe: string;
  topicTitleKa: string;
  hebrewText: string;
  translationKa: string;
  halakhaLemaasehKa: string;
  maranSourceHe: string;
  maranSourceKa: string;
  minhagComparisonKa: string;
  practicalScenarioKa: string;
  quizQuestionKa: string;
  quizOptionsKa: string[];
  quizCorrectIndex: number;
  talmudLink: {
    tractateId: string;
    dafId: string;
    labelHe: string;
    labelKa: string;
  };
}

interface DailyTwoHalakhotPair {
  dayIndex: number; // 1..30 cycle + date hash
  pairThemeKa: string;
  pairThemeHe: string;
  halakha1: DailySingleHalakhaCardData;
  halakha2: DailySingleHalakhaCardData;
}

const PRACTICAL_SCENARIOS_AND_QUIZZES: {
  practical1: string;
  q1: string;
  opts1: string[];
  ans1: number;
  practical2: string;
  q2: string;
  opts2: string[];
  ans2: number;
}[] = [
  {
    practical1:
      'დილით გაღვიძებისთანავე, სანამ საწოლიდან ადგებით და ხელებს დაიბანთ, შეგიძლიათ და ვალდებული ხართ თქვათ „მოდე ანი“, რადგან მასში ღვთის სახელი (שם ה׳) არ არის ნახსენები.',
    q1: 'როდის წარმოითქმება „მოდე ანი“ დილით გაღვიძებისას?',
    opts1: [
      'მხოლოდ ხელების დაბანის (ნეტილათ იადაიმის) შემდეგ',
      'გაღვიძებისთანავე, ხელების დაბანამდე, მცირე პაუზით „ბეხემლას“ შემდეგ',
      'მხოლოდ სინაგოგაში მისვლისას',
    ],
    ans1: 1,
    practical2:
      'დილის ნეტილათ იადაიმის დროს ჯერ მარჯვენა ხელით ვიღებთ ნატლას, გადავცემთ მარცხენას და მარცხენათი ვასხამთ მარჯვენაზე, შემდეგ კი მონაცვლეობით 3-3-ჯერ ვიბანთ.',
    q2: 'რამდენჯერ და რა წესით ვიბანთ ხელებს დილით (נטילת ידיים שחרית)?',
    opts2: [
      'ერთხელ ორივე ხელზე ერთდროულად',
      'ჭურჭლიდან მონაცვლეობით (לסירוגין) 3-3-ჯერ მარჯვენა და მარცხენა ხელზე',
      'მხოლოდ მარჯვენა ხელზე 3-ჯერ',
    ],
    ans2: 1,
  },
  {
    practical1:
      'სეფარადული ტრადიციით (მარან შულხან არუხი და იალკუტ იოსეფი), ხელისა და თავის თფილინზე ითქმება მხოლოდ ერთი კურთხევა — „ლეჰანიახ თფილინ“, და მათ შორის საუბარი ან ნიშნის მიცემა აკრძალულია.',
    q1: 'რამდენ კურთხევას წარმოთქვამენ სეფარადები ხელისა და თავის თფილინის დადებისას (უწყვეტად)?',
    opts1: [
      'მხოლოდ ერთ კურთხევას — „ლეჰანიახ თფილინ“',
      'სამ სხვადასხვა კურთხევას',
      'კურთხევა საერთოდ არ ითქმება',
    ],
    ans1: 0,
    practical2:
      'დილის ლოცვამდე (შახრითამდე) საჭმლის ჭამა აკრძალულია, თუმცა წყლის, ჩაის ან ყავის დალევა ნებადართულია, რათა ადამიანმა შეძლოს მშვიდად და ყურადღებით (კავანით) ლოცვა.',
    q2: 'რა არის ნებადართული დილის ლოცვის (შახრითის) დაწყებამდე კავანისთვის?',
    opts2: [
      'სრული პურის სეუდა',
      'წყლის, ჩაის ან ყავის დალევა',
      'არაფრის დალევა არ შეიძლება, წყლისაც კი',
    ],
    ans2: 1,
  },
  {
    practical1:
      'თუ ადამიანი მიირთმევს პურს „კაბეცას“ (54 გრამი და მეტი) ოდენობით, ხელებს იბანს კურთხევით „ალ ნეტილათ იადაიმ“. ხოლო თუ 54 გრამზე ნაკლებს (მაგ. კაზაითს — 27 გრამს) ჭამს, იბანს კურთხევის გარეშე.',
    q1: 'რა რაოდენობის პურის ჭამისას წარმოითქმება კურთხევა „ალ ნეტილათ იადაიმ“?',
    opts1: [
      'კაბეცა (დაახლ. 54 გრამი) და მეტი',
      'ნებისმიერი ნამცეცის შეჭმისას',
      'მხოლოდ შაბათ დღეს',
    ],
    ans1: 0,
    practical2:
      'კურთხევების თანმიმდევრობისას მოქმედებს წესი „მაგა აშ“ (מג״ע א״ש): მეზონოთი, გეფენი, ეცი, ადამა, შეჰაკოლი. საეჭვო კურთხევისას კი ვმოქმედებთ „საფეკ ბერახოთ ლეჰაკელ“ (סב״ל) პრინციპით.',
    q2: 'რომელი კურთხევა ითქმება პირველად, თუ სუფრაზეა ნამცხვარი (მეზონოთი), ვაშლი (ჰაეცი) და წყალი (შეჰაკოლი)?',
    opts2: [
      'შეჰაკოლი (წყალი)',
      'მეზონოთი (מג״ע א״ש წესის მიხედვით)',
      'ჰაეცი (ვაშლი)',
    ],
    ans2: 1,
  },
  {
    practical1:
      'სეფარად ქალბატონთა წესია შაბათის სანთლებზე ჯერ წარმოთქვან კურთხევა „ლეჰადლიკ ნერ შელ შაბათ“ და მაშინვე აანთონ სანთლები („ოვერ ლაასიათან“).',
    q1: 'რა თანმიმდევრობით ანთებენ შაბათის სანთლებს სეფარადული ჰალახის (იალკუტ იოსეფის) მიხედვით?',
    opts1: [
      'ჯერ წარმოთქვამენ კურთხევას და მაშინვე ანთებენ სანთლებს',
      'ჯერ აქრობენ სანთელს და მერე ანთებენ',
      'სანთლებს ანთებენ შაბათის გასვლისას',
    ],
    ans1: 0,
    practical2:
      'პარასკევს სრულად მოხარშული მშრალი კერძის (მაგ. ხორცი, ქათამი, ბრინჯი) შაბათს მაცივრიდან გამოღება და შაბათის ფლატაზე დადება გასაცხელებლად ნებადართულია, რადგან „მშრალ საკვებში მოხარშვის შემდეგ ხელახალი მოხარშვა არ არსებობს“.',
    q2: 'რომელი კერძის დადებაა ნებადართული შაბათის ფლატაზე გასაცხელებლად იალკუტ იოსეფის მიხედვით?',
    opts2: [
      'უმი ხორცის',
      'პარასკევს სრულად მოხარშული მშრალი კერძის (דבר יבש שנתבשל כל צרכו)',
      'ცივი წყლის ასადუღებლად',
    ],
    ans2: 1,
  },
  {
    practical1:
      'საქონლის ან ფრინველის ხორცის ჭამის შემდეგ აუცილებელია სრული 6 საათის მოცდა რძის პროდუქტების მიღებამდე. ხოლო რძის შემდეგ (მაგარი დაძველებული ყველის გარდა) ხორცის საჭმელად საკმარისია ხელების დაბანა, პარვე საკვების დაღეჭვა და პირის გამოვლება.',
    q1: 'რამდენი საათი უნდა გავიდეს ხორცის (ან ქათმის) ჭამის დასრულებიდან რძის პროდუქტების მიღებამდე?',
    opts1: ['1 საათი', 'სრული 6 საათი (שש שעות שלמות)', '24 საათი'],
    ans1: 1,
    practical2:
      'ახალი ლითონისა და მინის (მათ შორის Pyrex/Duralex) სუფრის ჭურჭელი, რომელიც დამზადებულია არაებრაელის მიერ, საჭიროებს ქაშერ მიკვეში ჩაშვებას კურთხევით „ალ ტვილათ ქელი/ქელიმ“.',
    q2: 'რომელი მასალის ახალ ჭურჭელს სჭირდება მიკვეში ჩაშვება (טבילת כלים) კურთხევით?',
    opts2: [
      'მხოლოდ პლასტმასისა და ქაღალდის ჭურჭელს',
      'ლითონისა და მინის ჭურჭელს',
      'მხოლოდ ხის კოვზებს',
    ],
    ans2: 1,
  },
  {
    practical1:
      'მეზუზა მაგრდება ოთახში შესვლისას მარჯვენა წირთხლზე, სიმაღლის ზედა მესამედის დასაწყისში. სეფარადული წესით (მარან შულხან არუხი და იალკუტ იოსეფი) მეზუზა მაგრდება ვერტიკალურად (ზკუფა).',
    q1: 'როგორ მაგრდება მეზუზა კარის მარჯვენა წირთხლზე სეფარადული ჰალახის მიხედვით?',
    opts1: [
      'სწორად — ვერტიკალურად (זקופה), ზედა მესამედის დასაწყისში',
      'ჰორიზონტალურად კარის ქვედა ნაწილში',
      'მარცხენა წირთხლზე',
    ],
    ans1: 0,
    practical2:
      'ყოველი ადამიანისთვის დიდი მცნებაა წმინდა შემოსავლის მეათედის (10% — მაასერ ქესაფიმ) გამოყოფა თორის შემსწავლელთა და გაჭირვებულთა დასახმარებლად, რაზეც თორა გვპირდება კურთხევასა და ბარაქას („ასერ ბიშვილ შეთითასერ“).',
    q2: 'რამდენ პროცენტს შეადგენს „მაასერ ქესაფიმი“ (מעשר כספים) წმინდა შემოსავლიდან?',
    opts2: ['1%-ს', '10%-ს (ხოლო რჩეული ხომეში — 20%-ს)', '50%-ს'],
    ans2: 1,
  },
];

function buildDailyTwoHalakhotForDate(
  date: Date,
  trackId: DailyHalakhaTrackId
): DailyTwoHalakhotPair {
  const dayOfMonth = date.getDate(); // 1..31
  const month = date.getMonth(); // 0..11
  const totalSimanim = YALKUT_YOSEF_CURATED_SIMANIM.length;

  const trackOffset =
    trackId === 'yalkut-yosef'
      ? 0
      : trackId === 'shulchan-aruch-mb'
        ? 2
        : trackId === 'shabbat-kashrut'
          ? 7
          : 4;

  const baseIdx = ((dayOfMonth - 1) * 2 + month + trackOffset) % totalSimanim;
  const secondIdx = (baseIdx + 1) % totalSimanim;

  const siman1: YalkutCuratedSiman = YALKUT_YOSEF_CURATED_SIMANIM[baseIdx];
  const siman2: YalkutCuratedSiman =
    YALKUT_YOSEF_CURATED_SIMANIM[secondIdx] || YALKUT_YOSEF_CURATED_SIMANIM[0];

  const seif1: YalkutSeifItem = siman1.seifim[0];
  const seif2: YalkutSeifItem = siman2.seifim[siman2.seifim.length > 1 ? 1 : 0];

  const metaIdx = (dayOfMonth - 1) % PRACTICAL_SCENARIOS_AND_QUIZZES.length;
  const meta = PRACTICAL_SCENARIOS_AND_QUIZZES[metaIdx];

  return {
    dayIndex: ((dayOfMonth - 1) % 30) + 1,
    pairThemeKa: `${siman1.titleKa.split(' ')[0]} & ${siman2.titleKa.split(' ')[0]} — დღის 2 ფუნდამენტური ჰალახა`,
    pairThemeHe: `${siman1.simanHe} • ${siman2.simanHe}`,
    halakha1: {
      slot: 1,
      slotLabelKa: 'ჰალახა I • დილის სწავლება',
      slotLabelHe: 'הלכה א׳ • לימוד הבוקר',
      simanId: siman1.id,
      bookId: siman1.bookId,
      simanNum: siman1.simanNum,
      simanHe: siman1.simanHe,
      seifHe: seif1.seifHe,
      topicTitleHe: siman1.titleHe,
      topicTitleKa: `${siman1.titleKa} — ${seif1.titleKa}`,
      hebrewText: seif1.hebrewText,
      translationKa: seif1.translationKa,
      halakhaLemaasehKa: seif1.halakhaLemaasehKa,
      maranSourceHe: seif1.maranSourceHe,
      maranSourceKa: seif1.maranSourceKa,
      minhagComparisonKa:
        seif1.minhagComparisonKa ||
        'მარან შულხან არუხის, იალკუტ იოსეფისა და მიშნა ბრურას შეჯერებული პრაქტიკული დასკვნა.',
      practicalScenarioKa: meta.practical1,
      quizQuestionKa: meta.q1,
      quizOptionsKa: meta.opts1,
      quizCorrectIndex: meta.ans1,
      talmudLink: seif1.talmudLink || {
        tractateId: 'berakhot',
        dafId: '60b',
        labelHe: 'ברכות דף ס׳ ע״ב',
        labelKa: 'ბერახოთი 60b',
      },
    },
    halakha2: {
      slot: 2,
      slotLabelKa: 'ჰალახა II • საღამოს სწავლება',
      slotLabelHe: 'הלכה ב׳ • לימוד הערב',
      simanId: siman2.id,
      bookId: siman2.bookId,
      simanNum: siman2.simanNum,
      simanHe: siman2.simanHe,
      seifHe: seif2.seifHe,
      topicTitleHe: siman2.titleHe,
      topicTitleKa: `${siman2.titleKa} — ${seif2.titleKa}`,
      hebrewText: seif2.hebrewText,
      translationKa: seif2.translationKa,
      halakhaLemaasehKa: seif2.halakhaLemaasehKa,
      maranSourceHe: seif2.maranSourceHe,
      maranSourceKa: seif2.maranSourceKa,
      minhagComparisonKa:
        seif2.minhagComparisonKa ||
        'სეფარადული (იალკუტ იოსეფი, ბენ იშ ხაი) და აშკენაზური (მიშნა ბრურა) ჰალახის პრაქტიკული მიმოხილვა.',
      practicalScenarioKa: meta.practical2,
      quizQuestionKa: meta.q2,
      quizOptionsKa: meta.opts2,
      quizCorrectIndex: meta.ans2,
      talmudLink: seif2.talmudLink || {
        tractateId: 'megillah',
        dafId: '28b',
        labelHe: 'מגילה דף כ״ח ע״ב',
        labelKa: 'მეგილა 28b',
      },
    },
  };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const GEORGIAN_MONTHS = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

const TRACK_OPTIONS: {
  id: DailyHalakhaTrackId;
  labelHe: string;
  labelKa: string;
  subKa: string;
}[] = [
  {
    id: 'yalkut-yosef',
    labelHe: 'ילקוט יוסף - קיצור שו״ע',
    labelKa: 'იალკუტ იოსეფი - კიცურ შულხან არუხი',
    subKa: 'მარან რაბი ოვადია და რაბი იცხაკ იოსეფი',
  },
  {
    id: 'shulchan-aruch-mb',
    labelHe: 'שולחן ערוך ומשנה ברורה',
    labelKa: 'შულხან არუხი და მიშნა ბრურა',
    subKa: 'სეფარადული და აშკენაზური შედარებით',
  },
  {
    id: 'shabbat-kashrut',
    labelHe: 'הלכות שבת וכשרות',
    labelKa: 'შაბათისა და ქაშრუთის 2 ჰალახა',
    subKa: 'პრაქტიკული საოჯახო კოდექსი',
  },
  {
    id: 'ben-ish-chai',
    labelHe: 'בן איש חי וכף החיים',
    labelKa: 'ბენ იშ ხაი და ქაფ ჰახაიმი',
    subKa: 'სეფარადული და კაბალისტური ტრადიცია',
  },
];

interface DailyTwoHalakhotViewProps {
  isDark: boolean;
  externalDate?: Date;
  onChangeExternalDate?: (d: Date) => void;
  onNavigateToRealm?: (
    realmId: SacredRealmId,
    target?: { bookId?: string; chapter?: number; tractateId?: string; dafId?: string }
  ) => void;
  onNavigateToTalmudDaf?: (tractateId: string, dafId: string, sectionId?: string) => void;
}

export const DailyTwoHalakhotView: React.FC<DailyTwoHalakhotViewProps> = ({
  isDark,
  externalDate,
  onChangeExternalDate,
  onNavigateToRealm,
  onNavigateToTalmudDaf,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => externalDate || new Date());
  const [selectedTrack, setSelectedTrack] = useState<DailyHalakhaTrackId>('yalkut-yosef');
  const [showNikud, setShowNikud] = useState<boolean>(true);
  const [fontSizePx, setFontSizePx] = useState<number>(20);
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isBannerMinimized, setIsBannerMinimized] = useState<boolean>(false);
  const [isBannerMaximized, setIsBannerMaximized] = useState<boolean>(false);
  const [isToolbarMinimized, setIsToolbarMinimized] = useState<boolean>(false);
  const [isToolbarMaximized, setIsToolbarMaximized] = useState<boolean>(false);
  const [minimizedSlots, setMinimizedSlots] = useState<Record<number, boolean>>({});
  const [maximizedSlot, setMaximizedSlot] = useState<number | null>(null);

  // Completion map: { 'YYYY-MM-DD': { h1: boolean, h2: boolean } }
  const [completionMap, setCompletionMap] = useState<
    Record<string, { h1: boolean; h2: boolean }>
  >(() => {
    try {
      const raw = localStorage.getItem('daily_two_halakhot_progress_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (externalDate) {
      setSelectedDate(externalDate);
    }
  }, [externalDate]);

  useEffect(() => {
    try {
      localStorage.setItem('daily_two_halakhot_progress_v1', JSON.stringify(completionMap));
    } catch {
      // ignore storage errors
    }
  }, [completionMap]);

  const currentKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const todayProgress = completionMap[currentKey] || { h1: false, h2: false };
  const isBothCompletedToday = todayProgress.h1 && todayProgress.h2;

  const dailyPair = useMemo(
    () => buildDailyTwoHalakhotForDate(selectedDate, selectedTrack),
    [selectedDate, selectedTrack]
  );

  const hebrewDateDisplay = useMemo(
    () => getHebrewDateInfo(selectedDate),
    [selectedDate]
  );

  const totalLearnedHalakhotCount = useMemo(() => {
    let count = 0;
    Object.values(completionMap).forEach((entry) => {
      if (entry.h1) count += 1;
      if (entry.h2) count += 1;
    });
    return count;
  }, [completionMap]);

  const completedDaysCount = useMemo(() => {
    return Object.values(completionMap).filter((e) => e.h1 && e.h2).length;
  }, [completionMap]);

  const changeDateByDays = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      if (onChangeExternalDate) onChangeExternalDate(next);
      return next;
    });
  };

  useEffect(() => {
    const onGlobalPrev = () => changeDateByDays(-1);
    const onGlobalNext = () => changeDateByDays(1);
    window.addEventListener('global-page-prev', onGlobalPrev);
    window.addEventListener('global-page-next', onGlobalNext);
    return () => {
      window.removeEventListener('global-page-prev', onGlobalPrev);
      window.removeEventListener('global-page-next', onGlobalNext);
    };
  }, []);

  const jumpToDayOfMonth = (dayNum: number) => {
    const next = new Date(selectedDate);
    next.setDate(dayNum);
    setSelectedDate(next);
    if (onChangeExternalDate) onChangeExternalDate(next);
  };

  const toggleHalakhaLearned = (slot: 1 | 2) => {
    setCompletionMap((prev) => {
      const cur = prev[currentKey] || { h1: false, h2: false };
      const nextEntry =
        slot === 1 ? { ...cur, h1: !cur.h1 } : { ...cur, h2: !cur.h2 };
      return {
        ...prev,
        [currentKey]: nextEntry,
      };
    });
  };

  const markBothLearned = () => {
    setCompletionMap((prev) => ({
      ...prev,
      [currentKey]: { h1: true, h2: true },
    }));
  };

  const formatHebrewText = (txt: string) =>
    showNikud ? txt : txt.replace(/[\u0591-\u05C7]/g, '');

  const speakHebrewHalakha = (hebrewText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(hebrewText);
    utter.lang = 'he-IL';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  const handleCopyHalakha = (card: DailySingleHalakhaCardData) => {
    const textToCopy = `📖 ${card.slotLabelHe} (${card.slotLabelKa})\n${card.simanHe} ${card.seifHe} — ${card.topicTitleKa}\n\n${card.hebrewText}\n\nქართული განმარტება: ${card.translationKa}\n\n⚖️ ჰალახა ლემაასე: ${card.halakhaLemaasehKa}\nწყარო: ${card.maranSourceKa}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedSlot(card.slot);
      setTimeout(() => setCopiedSlot(null), 2000);
    }
  };

  const renderSingleHalakhaCard = (card: DailySingleHalakhaCardData) => {
    const isLearned = card.slot === 1 ? todayProgress.h1 : todayProgress.h2;
    const quizKey = `${currentKey}-slot-${card.slot}`;
    const selectedQuizOption = quizAnswers[quizKey];
    const isCardMinimized = Boolean(minimizedSlots[card.slot]);
    const isCardMaximized = maximizedSlot === card.slot;

    return (
      <motion.div
        key={`${currentKey}-${selectedTrack}-slot-${card.slot}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`${
          isCardMaximized ? 'fixed inset-2 z-[175] overflow-y-auto' : ''
        } rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-lg transition-all ${
          isLearned
            ? isDark
              ? 'bg-gradient-to-b from-[#1A2A1E] via-[#172119] to-[#141A15] border-emerald-500/70'
              : 'bg-gradient-to-b from-[#F0FDF4] via-[#FAFDF9] to-[#ECFDF5] border-emerald-600/60'
            : isDark
              ? 'bg-gradient-to-b from-[#281A11] via-[#1F140D] to-[#180F0A] border-amber-500/45'
              : 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E6] to-[#F3E6CE] border-[#8B5A2B]/45'
        }`}
      >
        <div className="space-y-3.5">
          {/* Card Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#8B5A2B]/30">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-serif font-black text-base shadow-sm border ${
                  card.slot === 1
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-[#1E1209] border-amber-200'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-300'
                }`}
              >
                {card.slot === 1 ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    dir="rtl"
                    className="font-serif text-sm sm:text-base font-black text-amber-500 dark:text-amber-300"
                  >
                    {card.slotLabelHe}
                  </span>
                  <span className="text-xs font-extrabold opacity-85">
                    • {card.slotLabelKa}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    dir="rtl"
                    className="font-serif text-xs font-black px-2 py-0.5 rounded bg-[#5C3A21] text-amber-300"
                  >
                    {card.simanHe} • {card.seifHe}
                  </span>
                  <span
                    dir="rtl"
                    className="font-serif text-xs font-bold opacity-85 truncate"
                  >
                    {card.topicTitleHe}
                  </span>
                </div>
              </div>
            </div>

            {/* Learned Toggle Button + Audio + Copy + Windows Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => speakHebrewHalakha(card.hebrewText)}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#2C1D13] hover:bg-[#3B271A] border-[#C49A6C]/40 text-amber-300'
                    : 'bg-[#F5E8D0] hover:bg-[#EAD7B7] border-[#8B5A2B]/40 text-[#4A2C17]'
                }`}
                title="ებრაული ტექსტის მოსმენა (הקראה קולית)"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleCopyHalakha(card)}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#2C1D13] hover:bg-[#3B271A] border-[#C49A6C]/40 text-[#FAF5EB]'
                    : 'bg-[#F5E8D0] hover:bg-[#EAD7B7] border-[#8B5A2B]/40 text-[#4A2C17]'
                }`}
                title="ჰალახის კოპირება გასაზიარებლად"
              >
                {copiedSlot === card.slot ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleHalakhaLearned(card.slot)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                  isLearned
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : isDark
                      ? 'bg-[#332115] hover:bg-[#462D1D] text-amber-200 border-amber-400/50'
                      : 'bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] border-[#8B5A2B]'
                }`}
              >
                {isLearned ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>შესწავლილია ✓</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 shrink-0" />
                    <span>შესწავლილად მონიშვნა</span>
                  </>
                )}
              </button>

              <WindowsWindowControls
                isMinimized={isCardMinimized}
                onToggleMinimize={() =>
                  setMinimizedSlots((prev) => ({
                    ...prev,
                    [card.slot]: !prev[card.slot],
                  }))
                }
                isMaximized={isCardMaximized}
                onToggleMaximize={() =>
                  setMaximizedSlot((prev) => (prev === card.slot ? null : card.slot))
                }
                isFullScreen={isCardMaximized}
                onToggleFullScreen={() =>
                  setMaximizedSlot((prev) => (prev === card.slot ? null : card.slot))
                }
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>

          {!isCardMinimized && (
            <>
          {/* Georgian Topic Heading */}
          <h3 className="text-base sm:text-lg font-black leading-snug">
            {card.topicTitleKa}
          </h3>

          {/* Original Vocalized Hebrew Halakha Box */}
          <div
            dir="rtl"
            style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.7 }}
            className={`p-3.5 sm:p-4 rounded-2xl font-serif border shadow-inner select-text ${
              isDark
                ? 'bg-[#140D08] border-[#5C3A21]/70 text-[#FAF5EB]'
                : 'bg-[#FFFDF9] border-[#C9B38C] text-[#160E07]'
            }`}
          >
            {formatHebrewText(card.hebrewText)}
          </div>

          {/* Georgian Translation & Explanation */}
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
              isDark
                ? 'bg-[#22160E] border-[#C49A6C]/35 text-[#F5EAD8]'
                : 'bg-[#FAF2E1] border-[#D5C3A1] text-[#23150C]'
            }`}
          >
            <div className="font-extrabold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>ქართული თარგმანი და განმარტება:</span>
            </div>
            <p className="font-medium">{card.translationKa}</p>
          </div>

          {/* Practical Halakha L'Maaseh Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
              isDark
                ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-100'
                : 'bg-emerald-50/90 border-emerald-600/40 text-emerald-950'
            }`}
          >
            <div className="font-extrabold text-emerald-600 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <Scale className="w-4 h-4 shrink-0" />
              <span>הלכה למעשה — პრაქტიკული დასკვნა:</span>
            </div>
            <p>{card.halakhaLemaasehKa}</p>
          </div>

          {/* Minhag Comparison & Practical Life Scenario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isDark
                  ? 'bg-amber-950/25 border-amber-500/35 text-amber-100'
                  : 'bg-amber-50/80 border-amber-600/35 text-[#3B2313]'
              }`}
            >
              <div className="font-extrabold text-amber-600 dark:text-amber-300 mb-0.5">
                🔍 ספרד מול אשכנז (მინჰაგების შედარება):
              </div>
              <p>{card.minhagComparisonKa}</p>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isDark
                  ? 'bg-sky-950/25 border-sky-500/35 text-sky-100'
                  : 'bg-sky-50/80 border-sky-600/35 text-sky-950'
              }`}
            >
              <div className="font-extrabold text-sky-600 dark:text-sky-300 mb-0.5">
                💡 პრაქტიკული მაგალითი ცხოვრებიდან:
              </div>
              <p>{card.practicalScenarioKa}</p>
            </div>
          </div>

          {/* Mini Interactive Self-Check Question */}
          <div
            className={`p-3 rounded-xl border text-xs ${
              isDark
                ? 'bg-[#1A110B] border-[#C49A6C]/35'
                : 'bg-[#FFFDF7] border-[#C9B38C]'
            }`}
          >
            <div className="font-extrabold flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-300">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>სწრაფი თვითშემოწმება: {card.quizQuestionKa}</span>
            </div>
            <div className="space-y-1.5">
              {card.quizOptionsKa.map((opt, oIdx) => {
                const isPicked = selectedQuizOption === oIdx;
                const isCorrect = oIdx === card.quizCorrectIndex;
                const showResult = selectedQuizOption !== undefined;

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() =>
                      setQuizAnswers((prev) => ({
                        ...prev,
                        [quizKey]: oIdx,
                      }))
                    }
                    className={`w-full text-left px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      showResult && isCorrect
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                        : showResult && isPicked && !isCorrect
                          ? 'bg-rose-600/20 border-rose-500 text-rose-600 dark:text-rose-300'
                          : isDark
                            ? 'bg-[#261910] hover:bg-[#332216] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-[#F8F1E3] hover:bg-[#EFE2C8] border-[#D5C3A1] text-[#23150C]'
                    }`}
                  >
                    <span>
                      {oIdx + 1}. {opt}
                    </span>
                    {showResult && isCorrect && (
                      <span className="text-[11px] font-black text-emerald-500 shrink-0">
                        ✓ სწორია!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer Sources & Direct Navigation Links */}
        {!isCardMinimized && (
        <div className="pt-3 border-t border-[#8B5A2B]/30 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] opacity-85">
            <span className="font-extrabold">წყარო: </span>
            <span dir="rtl" className="font-serif font-bold text-amber-600 dark:text-amber-300">
              {card.maranSourceHe}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onNavigateToRealm && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToRealm('yalkut-yosef', {
                    bookId: card.bookId,
                    chapter: card.simanNum,
                  })
                }
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-[#1E1209] border border-amber-200 hover:brightness-105 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>📜 სრული სიმანი იალკუტ იოსეფში</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onNavigateToTalmudDaf && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToTalmudDaf(
                    card.talmudLink.tractateId,
                    card.talmudLink.dafId,
                    'daf-section-gemara'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] border border-[#C49A6C]/55 flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>📖 გემარა: {card.talmudLink.labelKa}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
          </div>
        </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-2.5 pb-16">
      {/* UNIVERSAL DAF NAVIGATION BAR — DAILY TWO HALAKHOT */}
      <div
        className={`${
          isToolbarMaximized ? 'fixed inset-2 z-[165] overflow-y-auto' : ''
        } rounded-2xl border px-3 py-2 shadow-sm ${
          isDark
            ? 'bg-[#2A1D15] border-[#C49A6C]/45 text-[#FAF5EB]'
            : 'bg-[#EADBC1] border-[#6E472B]/50 text-[#1E130A]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Prev/Next Day, Track Selector, Day Selector */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
              title="წინა დღის 2 ჰალახა"
            >
              ◀ წინა
            </button>

            {/* Track Dropdown */}
            <div className="w-[180px] sm:w-[220px] min-w-0">
              <SearchableSelect
                value={selectedTrack}
                onChange={(val) => setSelectedTrack(val as DailyHalakhaTrackId)}
                options={TRACK_OPTIONS.map((tr) => ({
                  value: tr.id,
                  badgeHe: tr.labelHe,
                  label: `${tr.labelHe} • ${tr.labelKa}`,
                }))}
                isDark={isDark}
                compact
                searchPlaceholder="კურსი..."
              />
            </div>

            {/* Day of Month Dropdown */}
            <div className="w-[130px] sm:w-[155px] min-w-0">
              <SearchableSelect
                value={String(selectedDate.getDate())}
                onChange={(val) => jumpToDayOfMonth(parseInt(val, 10) || 1)}
                options={Array.from({ length: 30 }, (_, i) => i + 1).map((dNum) => ({
                  value: String(dNum),
                  badgeHe: numberToHebrewGematria(dNum),
                  label: `დღე ${dNum} (${numberToHebrewGematria(dNum)})`,
                }))}
                isDark={isDark}
                compact
                searchPlaceholder="დღე..."
              />
            </div>

            <button
              type="button"
              onClick={() => changeDateByDays(1)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
              title="შემდეგი დღის 2 ჰალახა"
            >
              შემდეგი ▶
            </button>

            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                if (onChangeExternalDate) onChangeExternalDate(now);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500 text-[#1E1209] border border-amber-300 cursor-pointer"
            >
              დღეს ({hebrewDateDisplay.hebrewFull})
            </button>
          </div>

          {/* Right: Complete Both, Nikud, Font Size, Layout */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={markBothLearned}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all flex items-center gap-1 ${
                isBothCompletedToday
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-amber-400 text-[#1E1209] border-amber-200 hover:brightness-105'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isBothCompletedToday
                  ? `შესრულებულია ✓ (${totalLearnedHalakhotCount})`
                  : `ორივეს მონიშვნა (${totalLearnedHalakhotCount})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowNikud((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                showNikud
                  ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C]'
                  : 'bg-[#5C3A21]/40 text-[#FAF5EB] border-[#C49A6C]/45'
              }`}
            >
              ניקוד
            </button>

            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.max(15, s - 2))}
              className="px-2 py-1 rounded-lg text-[11px] font-black border border-[#8B5A2B]/50 bg-[#FAF3E3] text-[#2C1D11] cursor-pointer"
              title="შრიფტის დაპატარავება"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.min(30, s + 2))}
              className="px-2 py-1 rounded-lg text-[11px] font-black border border-[#8B5A2B]/50 bg-[#FAF3E3] text-[#2C1D11] cursor-pointer"
              title="შრიფტის გადიდება"
            >
              A+
            </button>

            <button
              type="button"
              onClick={() =>
                setLayoutMode((m) => (m === 'side-by-side' ? 'stacked' : 'side-by-side'))
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-[#C49A6C]/50 bg-[#5C3A21] text-[#FAF5EB] flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>{layoutMode === 'side-by-side' ? '2 სვეტად' : '1 სვეტად'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* THE TWO DAILY HALAKHOT DAF CARDS — IMMEDIATELY ON SCREEN */}
      <div
        className={`grid gap-3.5 ${
          layoutMode === 'side-by-side' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {renderSingleHalakhaCard(dailyPair.halakha1)}
        {renderSingleHalakhaCard(dailyPair.halakha2)}
      </div>
    </div>
  );
};
