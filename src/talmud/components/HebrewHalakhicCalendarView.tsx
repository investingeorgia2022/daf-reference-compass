// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar,
  Flame,
  BookOpen,
  Scale,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
  Moon,
  Sun,
  Menu,
  Clock,
  Link2,
  ArrowUp,
  MapPin,
  X,
  ExternalLink,
  Check,
  Download,
} from 'lucide-react';
import {
  JEWISH_ANNUAL_EVENTS,
  TZADIKIM_HILULOT,
  TzadikBiography,
  JewishAnnualEvent,
  getEventsAndHilulotForDate,
  getHebrewDateInfo,
} from '../data/hebrewCalendarAndTzadikimData';
import { SacredRealmId } from '../data/tanakhAndHalakhaData';
import { WindowsWindowControls } from './WindowsWindowControls';
import { SearchableSelect } from './SearchableSelect';

interface HebrewHalakhicCalendarViewProps {
  isDark: boolean;
  onNavigateToRealm: (
    realmId: SacredRealmId,
    bookId?: string,
    chapter?: number,
    tractateId?: string,
    dafId?: string
  ) => void;
  externalSelectedDate?: Date;
  onSelectDateExternal?: (date: Date) => void;
  onOpenSiddurDailyPrayer?: (date: Date) => void;
  onBackHome?: () => void;
  onToggleTheme?: () => void;
  onOpenMenu?: () => void;
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

const GEORGIAN_MONTHS_SHORT = [
  'იან',
  'თებ',
  'მარ',
  'აპრ',
  'მაი',
  'ივნ',
  'ივლ',
  'აგვ',
  'სექ',
  'ოქტ',
  'ნოე',
  'დეკ',
];

const GEORGIAN_WEEKDAYS_FULL = [
  'კვირა',
  'ორშაბათი',
  'სამშაბათი',
  'ოთხშაბათი',
  'ხუთშაბათი',
  'პარასკევი',
  'შაბათი',
];

// Ordered from Sunday (index 0) to Saturday (index 6).
// When rendered inside a dir="rtl" 7-column grid, Sunday ('კვ.') is on the right
// and Saturday ('შაბ.') is on the far left — matching the Hebrew calendar screenshots!
const RTL_WEEKDAY_HEADERS = ['კვ.', 'ორშ.', 'სამ.', 'ოთხ.', 'ხუთშ.', 'პარ.', 'შაბ.'];

export interface HebrewMonthTabInfo {
  key: string;
  he: string;
  ka: string;
}

export const HEBREW_MONTH_TABS: HebrewMonthTabInfo[] = [
  { key: 'tishrei', he: 'תשרי', ka: 'თიშრი' },
  { key: 'cheshvan', he: 'חשוון', ka: 'ხეშვანი' },
  { key: 'kislev', he: 'כסלו', ka: 'ქისლევი' },
  { key: 'tevet', he: 'טבת', ka: 'ტევეთი' },
  { key: 'shevat', he: 'שבט', ka: 'შვატი' },
  { key: 'adar', he: 'אדר', ka: 'ადარი' },
  { key: 'nisan', he: 'ניסן', ka: 'ნისანი' },
  { key: 'iyar', he: 'אייר', ka: 'იარი' },
  { key: 'sivan', he: 'סיוון', ka: 'სივანი' },
  { key: 'tammuz', he: 'תמוז', ka: 'თამუზი' },
  { key: 'av', he: 'אב', ka: 'ავი' },
  { key: 'elul', he: 'אלול', ka: 'ელული' },
];

// Clean Hebrew Gematria matching the screenshot typography (א, ב, ..., י"א, ט"ו, כ"ז, ל)
const SCREENSHOT_GEMATRIA_DAYS = [
  '',
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'י"א',
  'י"ב',
  'י"ג',
  'י"ד',
  'ט"ו',
  'ט"ז',
  'י"ז',
  'י"ח',
  'י"ט',
  'כ',
  'כ"א',
  'כ"ב',
  'כ"ג',
  'כ"ד',
  'כ"ה',
  'כ"ו',
  'כ"ז',
  'כ"ח',
  'כ"ט',
  'ל',
];

export type DayCircleCategory = 'regular' | 'shabbat' | 'chag' | 'taanit' | 'moed';

export function getHebrewDayCategory(
  monthKey: string,
  hebrewDay: number,
  weekday: number
): DayCircleCategory {
  // Fast days (תענית) - Amber/Gold circle
  if (
    (monthKey === 'tishrei' && (hebrewDay === 3 || hebrewDay === 10)) ||
    (monthKey === 'tevet' && hebrewDay === 10) ||
    (monthKey === 'adar' && hebrewDay === 13) ||
    (monthKey === 'tammuz' && hebrewDay === 17) ||
    (monthKey === 'av' && hebrewDay === 9)
  ) {
    return 'taanit';
  }

  // Holidays & Yom Tov / Chol HaMoed / Erev Yom Kippur (חג) - Rose/Pink circle
  if (
    (monthKey === 'tishrei' &&
      (hebrewDay === 1 ||
        hebrewDay === 2 ||
        hebrewDay === 9 ||
        (hebrewDay >= 15 && hebrewDay <= 22))) ||
    (monthKey === 'kislev' && hebrewDay >= 25) ||
    (monthKey === 'tevet' && hebrewDay <= 2) ||
    (monthKey === 'shevat' && hebrewDay === 15) ||
    (monthKey === 'adar' && (hebrewDay === 14 || hebrewDay === 15)) ||
    (monthKey === 'nisan' && hebrewDay >= 14 && hebrewDay <= 21) ||
    (monthKey === 'iyar' && (hebrewDay === 14 || hebrewDay === 18)) ||
    (monthKey === 'sivan' && (hebrewDay === 6 || hebrewDay === 7)) ||
    (monthKey === 'av' && hebrewDay === 15)
  ) {
    return 'chag';
  }

  // Shabbat (שבת) - Warm Taupe circle
  if (weekday === 6) {
    return 'shabbat';
  }

  return 'regular';
}

export interface HebrewCalendarDayCell {
  hebrewDay: number;
  gematria: string;
  gregorianDate: Date;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  category: DayCircleCategory;
}

// Build the exact days (1..29/30) for a given Hebrew Year & Hebrew Month Key
function buildHebrewMonthCells(
  targetHebrewYear: number,
  targetMonthKey: string
): HebrewCalendarDayCell[] {
  const approxYear = targetHebrewYear - 3761;
  const scanStart = new Date(approxYear, 7, 15, 12, 0, 0); // Aug 15
  const scanEnd = new Date(approxYear + 1, 9, 25, 12, 0, 0); // Oct 25 next year

  const matchedDays: Map<number, HebrewCalendarDayCell> = new Map();

  for (
    let d = new Date(scanStart);
    d <= scanEnd;
    d.setDate(d.getDate() + 1)
  ) {
    const curDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    const info = getHebrewDateInfo(curDate);
    if (
      info.hebrewYearNum === targetHebrewYear &&
      info.hebrewMonthKey === targetMonthKey
    ) {
      if (!matchedDays.has(info.hebrewDayNum)) {
        const weekday = curDate.getDay();
        matchedDays.set(info.hebrewDayNum, {
          hebrewDay: info.hebrewDayNum,
          gematria:
            SCREENSHOT_GEMATRIA_DAYS[info.hebrewDayNum] || `${info.hebrewDayNum}`,
          gregorianDate: curDate,
          weekday,
          category: getHebrewDayCategory(targetMonthKey, info.hebrewDayNum, weekday),
        });
      }
    }
  }

  if (matchedDays.size >= 28) {
    return Array.from(matchedDays.values()).sort(
      (a, b) => a.hebrewDay - b.hebrewDay
    );
  }

  // Deterministic fallback if environment Intl lacks Hebrew calendar
  const monthIdx = Math.max(
    0,
    HEBREW_MONTH_TABS.findIndex((m) => m.key === targetMonthKey)
  );
  const baseStart = new Date(approxYear, 8 + monthIdx, 12, 12, 0, 0);
  const length = monthIdx % 2 === 0 ? 30 : 29;
  const fallbackCells: HebrewCalendarDayCell[] = [];
  for (let day = 1; day <= length; day++) {
    const dt = new Date(baseStart);
    dt.setDate(baseStart.getDate() + (day - 1));
    const weekday = dt.getDay();
    fallbackCells.push({
      hebrewDay: day,
      gematria: SCREENSHOT_GEMATRIA_DAYS[day] || `${day}`,
      gregorianDate: dt,
      weekday,
      category: getHebrewDayCategory(targetMonthKey, day, weekday),
    });
  }
  return fallbackCells;
}

// Compute accurate Sunrise (מזרח) and Sunset (שקיעה) + Full Zmanim for any date & city
interface CityCoords {
  id: string;
  nameKa: string;
  nameHe: string;
  lat: number;
  lng: number;
  tzOffset: number;
}

const ZMANIM_CITIES: CityCoords[] = [
  { id: 'tbilisi', nameKa: 'თბილისი', nameHe: 'טביליסי', lat: 41.7151, lng: 44.8271, tzOffset: 4 },
  { id: 'jerusalem', nameKa: 'იერუსალიმი', nameHe: 'ירושלים', lat: 31.7683, lng: 35.2137, tzOffset: 3 },
  { id: 'batumi', nameKa: 'ბათუმი', nameHe: 'בתומי', lat: 41.6168, lng: 41.6367, tzOffset: 4 },
  { id: 'kutaisi', nameKa: 'ქუთაისი', nameHe: 'כותאיסי', lat: 42.2679, lng: 42.718, tzOffset: 4 },
  { id: 'telaviv', nameKa: 'თელ-ავივი', nameHe: 'תל אביב', lat: 32.0853, lng: 34.7818, tzOffset: 3 },
  { id: 'newyork', nameKa: 'ნიუ-იორკი', nameHe: 'ניו יורק', lat: 40.7128, lng: -74.006, tzOffset: -4 },
];

function formatMinutesToHHMM(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function calculateDailyZmanim(date: Date, city: CityCoords) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar declination & equation of time approximation
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma);

  const latRad = (city.lat * Math.PI) / 180;
  const zenithRad = (90.833 * Math.PI) / 180;
  const cosHA =
    Math.cos(zenithRad) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);
  const clampedCosHA = Math.max(-0.99, Math.min(0.99, cosHA));
  const haDeg = (Math.acos(clampedCosHA) * 180) / Math.PI;

  const solarNoonMin = 720 - 4 * city.lng - eqTime + city.tzOffset * 60;
  const sunriseMin = solarNoonMin - haDeg * 4;
  const sunsetMin = solarNoonMin + haDeg * 4;
  const shaahZmanitGra = (sunsetMin - sunriseMin) / 12;
  const alotMin = sunriseMin - 72;
  const tzeitMin = sunsetMin + 42;
  const shaahZmanitMga = (tzeitMin - alotMin) / 12;

  return {
    alotHaShachar: formatMinutesToHHMM(alotMin),
    misheyakir: formatMinutesToHHMM(sunriseMin - 50),
    sunrise: formatMinutesToHHMM(sunriseMin),
    sofZmanShemaMga: formatMinutesToHHMM(alotMin + shaahZmanitMga * 3),
    sofZmanShemaGra: formatMinutesToHHMM(sunriseMin + shaahZmanitGra * 3),
    sofZmanTefilaGra: formatMinutesToHHMM(sunriseMin + shaahZmanitGra * 4),
    chatzot: formatMinutesToHHMM(solarNoonMin),
    minchaGedola: formatMinutesToHHMM(solarNoonMin + shaahZmanitGra * 0.5),
    minchaKetana: formatMinutesToHHMM(sunriseMin + shaahZmanitGra * 9.5),
    plagHaMincha: formatMinutesToHHMM(sunriseMin + shaahZmanitGra * 10.75),
    candleLighting: formatMinutesToHHMM(sunsetMin - 18),
    sunset: formatMinutesToHHMM(sunsetMin),
    tzeitHaKochavim: formatMinutesToHHMM(sunsetMin + 28),
    rabbeinuTam: formatMinutesToHHMM(sunsetMin + 72),
  };
}

// Chronological Jewish Events definition for the "מועדים · ებრაული მოვლენები" feed
interface UpcomingCalendarEventItem {
  id: string;
  titleHe: string;
  titleKa: string;
  hebrewMonthKey: string;
  hebrewDayNum: number;
  hasHalakhaBtn: boolean;
  linkedAnnualEventId: string;
}

const CALENDAR_MOADIM_SCHEDULE: UpcomingCalendarEventItem[] = [
  {
    id: 'moed-rosh-hashanah',
    titleHe: 'ראש השנה',
    titleKa: 'როშ ჰაშანა',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 1,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'rosh-hashanah',
  },
  {
    id: 'moed-tzom-gedaliah',
    titleHe: 'צום גדליה',
    titleKa: 'ცომ გედალია',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 3,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'tzom-gedaliah',
  },
  {
    id: 'moed-yom-kippur',
    titleHe: 'יום כיפור',
    titleKa: 'იომ ქიფური',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 10,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'yom-kippur',
  },
  {
    id: 'moed-sukkot',
    titleHe: 'סוכות',
    titleKa: 'სუქოთი',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 15,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'sukkot-simchat-torah',
  },
  {
    id: 'moed-simchat-torah',
    titleHe: 'שמחת תורה',
    titleKa: 'სიმხათ თორა',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 22,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'sukkot-simchat-torah',
  },
  {
    id: 'moed-chanukah',
    titleHe: 'חנוכה',
    titleKa: 'ხანუქა',
    hebrewMonthKey: 'kislev',
    hebrewDayNum: 25,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'chanukah',
  },
  {
    id: 'moed-asara-btevet',
    titleHe: 'עשרה בטבת',
    titleKa: 'ასარა ბეტევეთი',
    hebrewMonthKey: 'tevet',
    hebrewDayNum: 10,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'asara-btevet',
  },
  {
    id: 'moed-tu-bishvat',
    titleHe: 'ט"ו בשבט',
    titleKa: 'ტუ ბიშვატი',
    hebrewMonthKey: 'shevat',
    hebrewDayNum: 15,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'tu-bishvat',
  },
  {
    id: 'moed-taanit-esther',
    titleHe: 'תענית אסתר',
    titleKa: 'თაანით ესთერი',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 13,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'taanit-esther',
  },
  {
    id: 'moed-purim',
    titleHe: 'פורים',
    titleKa: 'ფურიმი',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 14,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'purim',
  },
  {
    id: 'moed-shushan-purim',
    titleHe: 'שושן פורים',
    titleKa: 'შუშან ფურიმი',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 15,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'shushan-purim',
  },
  {
    id: 'moed-erev-pesach',
    titleHe: 'ערב פסח',
    titleKa: 'ერევ ფესახი',
    hebrewMonthKey: 'nisan',
    hebrewDayNum: 14,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'erev-pesach',
  },
  {
    id: 'moed-pesach',
    titleHe: 'פסח',
    titleKa: 'ფესახი',
    hebrewMonthKey: 'nisan',
    hebrewDayNum: 15,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'pesach',
  },
  {
    id: 'moed-lag-baomer',
    titleHe: 'ל"ג בעומר',
    titleKa: 'ლაგ ბაომერი',
    hebrewMonthKey: 'iyar',
    hebrewDayNum: 18,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'lag-baomer',
  },
  {
    id: 'moed-shavuot',
    titleHe: 'שבועות',
    titleKa: 'შავუოთი',
    hebrewMonthKey: 'sivan',
    hebrewDayNum: 6,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'shavuot',
  },
  {
    id: 'moed-tzom-tammuz',
    titleHe: 'שבעה עשר בתמוז',
    titleKa: '17 თამუზის მარხვა',
    hebrewMonthKey: 'tammuz',
    hebrewDayNum: 17,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'tzom-tammuz',
  },
  {
    id: 'moed-tisha-bav',
    titleHe: 'תשעה באב',
    titleKa: 'თიშა ბეავი',
    hebrewMonthKey: 'av',
    hebrewDayNum: 9,
    hasHalakhaBtn: true,
    linkedAnnualEventId: 'tisha-bav',
  },
  {
    id: 'moed-tu-bav',
    titleHe: 'ט"ו באב',
    titleKa: 'ტუ ბეავი',
    hebrewMonthKey: 'av',
    hebrewDayNum: 15,
    hasHalakhaBtn: false,
    linkedAnnualEventId: 'tu-bav',
  },
];

export const HebrewHalakhicCalendarView: React.FC<HebrewHalakhicCalendarViewProps> = ({
  isDark,
  onNavigateToRealm,
  externalSelectedDate,
  onSelectDateExternal,
  onOpenSiddurDailyPrayer,
  onBackHome,
  onToggleTheme,
  onOpenMenu,
}) => {
  // Default to October 8, 2026 (27 Tishrei 5787) if current system date is Oct 2026, or today
  const today = useMemo(() => new Date(), []);
  const initialDate = externalSelectedDate || today;
  const initialHeb = useMemo(() => getHebrewDateInfo(initialDate), [initialDate]);

  const [activeTopTab, setActiveTopTab] = useState<'calendar' | 'zmanim'>('calendar');
  const [activeHebrewYear, setActiveHebrewYear] = useState<number>(initialHeb.hebrewYearNum);
  const [activeHebrewMonthKey, setActiveHebrewMonthKey] = useState<string>(
    initialHeb.hebrewMonthKey || 'tishrei'
  );
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(initialDate);
  const selectedDate = externalSelectedDate || internalSelectedDate;

  const [selectedCityId, setSelectedCityId] = useState<string>('tbilisi');
  const [fontScaleStep, setFontScaleStep] = useState<number>(0); // 0 = 100%, 1 = 108%, 2 = 116%
  const [isGoogleCalModalOpen, setIsGoogleCalModalOpen] = useState<boolean>(false);
  const [googleCalConnected, setGoogleCalConnected] = useState<boolean>(() => {
    try {
      return localStorage.getItem('talmud_gcal_connected_v1') === 'true';
    } catch {
      return false;
    }
  });

  const [selectedTzadikModal, setSelectedTzadikModal] = useState<TzadikBiography | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<JewishAnnualEvent | null>(null);
  const [litCandleIds, setLitCandleIds] = useState<Record<string, boolean>>({});
  const [isCalCardMinimized, setIsCalCardMinimized] = useState(false);
  const [isCalCardMaximized, setIsCalCardMaximized] = useState(false);
  const [isCalCardFullScreen, setIsCalCardFullScreen] = useState(false);
  const [isMoadimMinimized, setIsMoadimMinimized] = useState(false);
  const [isMoadimMaximized, setIsMoadimMaximized] = useState(false);
  const [isHilulotMinimized, setIsHilulotMinimized] = useState(false);
  const [isZmanimMaximized, setIsZmanimMaximized] = useState(false);
  const [isZmanimMinimized, setIsZmanimMinimized] = useState(false);

  const selectedCity = useMemo(
    () => ZMANIM_CITIES.find((c) => c.id === selectedCityId) || ZMANIM_CITIES[0],
    [selectedCityId]
  );

  const handleChooseDate = (nextDate: Date) => {
    setInternalSelectedDate(nextDate);
    if (onSelectDateExternal) {
      onSelectDateExternal(nextDate);
    }
  };

  // Jump to Today ('დღეს' button)
  const handleJumpToToday = () => {
    const now = new Date();
    const hebNow = getHebrewDateInfo(now);
    setActiveHebrewYear(hebNow.hebrewYearNum);
    setActiveHebrewMonthKey(hebNow.hebrewMonthKey);
    handleChooseDate(now);
  };

  // Navigate Previous / Next Hebrew Month
  const handlePrevHebrewMonth = () => {
    const curIdx = HEBREW_MONTH_TABS.findIndex((m) => m.key === activeHebrewMonthKey);
    if (curIdx <= 0) {
      const nextKey = HEBREW_MONTH_TABS[HEBREW_MONTH_TABS.length - 1].key;
      const nextYear = activeHebrewYear - 1;
      setActiveHebrewYear(nextYear);
      setActiveHebrewMonthKey(nextKey);
      const cells = buildHebrewMonthCells(nextYear, nextKey);
      if (cells[0]) handleChooseDate(cells[0].gregorianDate);
    } else {
      const nextKey = HEBREW_MONTH_TABS[curIdx - 1].key;
      setActiveHebrewMonthKey(nextKey);
      const cells = buildHebrewMonthCells(activeHebrewYear, nextKey);
      if (cells[0]) handleChooseDate(cells[0].gregorianDate);
    }
  };

  const handleNextHebrewMonth = () => {
    const curIdx = HEBREW_MONTH_TABS.findIndex((m) => m.key === activeHebrewMonthKey);
    if (curIdx >= HEBREW_MONTH_TABS.length - 1) {
      const nextKey = HEBREW_MONTH_TABS[0].key;
      const nextYear = activeHebrewYear + 1;
      setActiveHebrewYear(nextYear);
      setActiveHebrewMonthKey(nextKey);
      const cells = buildHebrewMonthCells(nextYear, nextKey);
      if (cells[0]) handleChooseDate(cells[0].gregorianDate);
    } else {
      const nextKey = HEBREW_MONTH_TABS[curIdx + 1].key;
      setActiveHebrewMonthKey(nextKey);
      const cells = buildHebrewMonthCells(activeHebrewYear, nextKey);
      if (cells[0]) handleChooseDate(cells[0].gregorianDate);
    }
  };

  useEffect(() => {
    const onPrev = () => handlePrevHebrewMonth();
    const onNext = () => handleNextHebrewMonth();
    window.addEventListener('global-page-prev', onPrev);
    window.addEventListener('global-page-next', onNext);
    return () => {
      window.removeEventListener('global-page-prev', onPrev);
      window.removeEventListener('global-page-next', onNext);
    };
  }, [activeHebrewYear, activeHebrewMonthKey]);

  // Cells for the currently selected Hebrew month
  const monthCells = useMemo(
    () => buildHebrewMonthCells(activeHebrewYear, activeHebrewMonthKey),
    [activeHebrewYear, activeHebrewMonthKey]
  );

  // Leading empty slots before day א in the 7-column RTL grid (0 = Sunday .. 6 = Saturday)
  const leadingEmptyCount = monthCells[0]?.weekday ?? 0;

  const activeMonthMeta = useMemo(
    () =>
      HEBREW_MONTH_TABS.find((m) => m.key === activeHebrewMonthKey) ||
      HEBREW_MONTH_TABS[0],
    [activeHebrewMonthKey]
  );

  const selectedDayDetails = useMemo(
    () => getEventsAndHilulotForDate(selectedDate),
    [selectedDate]
  );

  const selectedDayZmanim = useMemo(
    () => calculateDailyZmanim(selectedDate, selectedCity),
    [selectedDate, selectedCity]
  );

  const selectedHebrewDayCleanGematria = useMemo(() => {
    const n = selectedDayDetails.hebrewInfo.hebrewDayNum;
    return SCREENSHOT_GEMATRIA_DAYS[n] || selectedDayDetails.hebrewInfo.hebrewDayGematria;
  }, [selectedDayDetails]);

  // Calculate chronological upcoming Jewish events starting from selectedDate
  const upcomingMoadimList = useMemo(() => {
    const baseMidnight = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0,
      0,
      0
    );

    const results: {
      item: UpcomingCalendarEventItem;
      eventDate: Date;
      daysRemaining: number;
      monthShortKa: string;
      monthFullKa: string;
      weekdayKa: string;
      dayOfMonth: number;
      annualEventObj: JewishAnnualEvent;
    }[] = [];

    // Scan the next 370 days from selectedDate to find the next occurrence of each holiday
    const foundIds = new Set<string>();
    for (let offset = 0; offset <= 370; offset++) {
      const candidate = new Date(baseMidnight);
      candidate.setDate(baseMidnight.getDate() + offset);
      const heb = getHebrewDateInfo(candidate);

      for (const sched of CALENDAR_MOADIM_SCHEDULE) {
        if (
          !foundIds.has(sched.id) &&
          heb.hebrewMonthKey === sched.hebrewMonthKey &&
          heb.hebrewDayNum === sched.hebrewDayNum
        ) {
          foundIds.add(sched.id);
          const linkedObj =
            JEWISH_ANNUAL_EVENTS.find((e) => e.id === sched.linkedAnnualEventId) ||
            JEWISH_ANNUAL_EVENTS[0];
          results.push({
            item: sched,
            eventDate: candidate,
            daysRemaining: offset,
            monthShortKa: GEORGIAN_MONTHS_SHORT[candidate.getMonth()],
            monthFullKa: GEORGIAN_MONTHS[candidate.getMonth()],
            weekdayKa: GEORGIAN_WEEKDAYS_FULL[candidate.getDay()],
            dayOfMonth: candidate.getDate(),
            annualEventObj: linkedObj,
          });
        }
      }
    }

    return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [selectedDate]);

  const featuredNextEvent = upcomingMoadimList[0] || null;
  const followingEvents = upcomingMoadimList.slice(1);

  // Generate & download .ics calendar file for Google Calendar / Apple Calendar
  const handleDownloadIcsCalendar = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Georgian Jewish Calendar//לוח שנה עברי//KA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const ev of upcomingMoadimList) {
      const y = ev.eventDate.getFullYear();
      const m = String(ev.eventDate.getMonth() + 1).padStart(2, '0');
      const d = String(ev.eventDate.getDate()).padStart(2, '0');
      const nextDay = new Date(ev.eventDate);
      nextDay.setDate(ev.eventDate.getDate() + 1);
      const ny = nextDay.getFullYear();
      const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nd = String(nextDay.getDate()).padStart(2, '0');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.item.id}-${y}@torah-talmud-ka`);
      lines.push(`DTSTART;VALUE=DATE:${y}${m}${d}`);
      lines.push(`DTEND;VALUE=DATE:${ny}${nm}${nd}`);
      lines.push(`SUMMARY:${ev.item.titleHe} • ${ev.item.titleKa}`);
      lines.push(
        `DESCRIPTION:${ev.annualEventObj.summaryKa.replace(/\n/g, ' ')} | ჰალახა: ${ev.annualEventObj.halakhaLawsKa.replace(/\n/g, ' ')}`
      );
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hebrew-events-${activeHebrewYear}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setGoogleCalConnected(true);
    try {
      localStorage.setItem('talmud_gcal_connected_v1', 'true');
    } catch {
      // ignore
    }
  };

  const buildGoogleCalendarUrl = (ev: (typeof upcomingMoadimList)[0]) => {
    const y = ev.eventDate.getFullYear();
    const m = String(ev.eventDate.getMonth() + 1).padStart(2, '0');
    const d = String(ev.eventDate.getDate()).padStart(2, '0');
    const nextDay = new Date(ev.eventDate);
    nextDay.setDate(ev.eventDate.getDate() + 1);
    const ny = nextDay.getFullYear();
    const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
    const nd = String(nextDay.getDate()).padStart(2, '0');

    const title = encodeURIComponent(`${ev.item.titleHe} · ${ev.item.titleKa}`);
    const details = encodeURIComponent(
      `${ev.annualEventObj.summaryKa}\n\nჰალახა: ${ev.annualEventObj.halakhaLawsKa}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${y}${m}${d}/${ny}${nm}${nd}&details=${details}`;
  };

  const fontScalePercent = fontScaleStep === 0 ? 100 : fontScaleStep === 1 ? 108 : 116;

  return (
    <div
      style={{ fontSize: `${fontScalePercent}%` }}
      className={`w-full max-w-2xl mx-auto pb-28 px-2 sm:px-4 transition-colors duration-300 ${
        isDark ? 'text-[#FAF5EB]' : 'text-[#2C1E14]'
      }`}
    >
      {/* UNIVERSAL DAF NAVIGATION BAR — HEBREW CALENDAR & ZMANIM */}
      <div
        className={`px-3 py-2 mb-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-sm ${
          isDark
            ? 'bg-[#2A1D15] border-[#C49A6C]/45 text-[#FAF5EB]'
            : 'bg-[#EADBC1] border-[#6E472B]/50 text-[#1E130A]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevHebrewMonth}
            className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
            title="წინა თვე"
          >
            ◀ წინა თვე
          </button>

          <div className="w-[170px] sm:w-[210px] min-w-0">
            <SearchableSelect
              value={activeHebrewMonthKey}
              onChange={(mKey) => {
                setActiveHebrewMonthKey(mKey);
                const cells = buildHebrewMonthCells(activeHebrewYear, mKey);
                if (cells[0]) {
                  handleChooseDate(cells[0].gregorianDate);
                }
              }}
              options={HEBREW_MONTH_TABS.map((m) => ({
                value: m.key,
                badgeHe: m.he,
                label: `${m.he} • ${m.ka} (${activeHebrewYear})`,
              }))}
              isDark={isDark}
              compact
              searchPlaceholder="თვე..."
            />
          </div>

          <button
            type="button"
            onClick={handleNextHebrewMonth}
            className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-[#C49A6C]/55 bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#7A4E2D] cursor-pointer transition-all"
            title="შემდეგი თვე"
          >
            შემდეგი თვე ▶
          </button>

          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500 text-[#1E1209] border border-amber-300 cursor-pointer"
          >
            დღეს
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTopTab('calendar')}
            className={`px-3 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTopTab === 'calendar'
                ? 'bg-amber-500 text-[#1E1209] border-amber-300 shadow-xs'
                : 'bg-[#5C3A21] text-[#FAF5EB] border-[#C49A6C]/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>კალენდარი (לוח שנה)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTopTab('zmanim')}
            className={`px-3 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTopTab === 'zmanim'
                ? 'bg-amber-500 text-[#1E1209] border-amber-300 shadow-xs'
                : 'bg-[#5C3A21] text-[#FAF5EB] border-[#C49A6C]/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>სრული დროები (זמנים)</span>
          </button>
        </div>
      </div>

      {activeTopTab === 'calendar' ? (
        <>

          {/* =====================================================================
              4. MAIN HEBREW MONTH CALENDAR CARD (Screenshot 2 & 3)
             ===================================================================== */}
          <div
            className={`${
              isCalCardFullScreen
                ? 'fixed inset-0 z-[170] overflow-y-auto rounded-none m-0'
                : isCalCardMaximized
                  ? 'fixed inset-2 z-[165] overflow-y-auto rounded-3xl m-0'
                  : 'rounded-[30px] mb-6'
            } p-4 sm:p-6 border transition-all ${
              isDark
                ? 'bg-[#211710] border-[#C49A6C]/35 shadow-2xl'
                : 'bg-[#F3EFE6] border-[#E2D9C8] shadow-[0_10px_30px_rgba(92,61,36,0.08)]'
            }`}
          >
            {/* 4A. Month & Year Navigation Header (<   תשרי / (5787) 5787   დღეს  >) */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#DCD2C0]/60 dark:border-[#5C3A21]/50">
              <button
                type="button"
                onClick={handlePrevHebrewMonth}
                title="წინა თვე"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-[#2E2016] text-[#FAF5EB] hover:bg-[#3B291C]'
                    : 'bg-[#EAE3D5] text-[#5C3D24] hover:bg-[#DFD5C3]'
                }`}
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <div className="text-center">
                <div
                  dir="rtl"
                  className={`font-serif text-2xl sm:text-3xl font-black leading-none ${
                    isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                  }`}
                >
                  {activeMonthMeta.he}
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold mt-1 ${
                    isDark ? 'text-[#63D2C2]' : 'text-[#287D70]'
                  }`}
                >
                  ({activeHebrewYear}) {activeHebrewYear}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 ${
                    isDark
                      ? 'bg-[#3A281B] text-[#FAF5EB] border border-[#C49A6C]/40 hover:bg-[#4A3322]'
                      : 'bg-[#DDD5C7] text-[#3B2616] hover:bg-[#D0C6B4] shadow-inner'
                  }`}
                >
                  დღეს
                </button>

                <button
                  type="button"
                  onClick={handleNextHebrewMonth}
                  title="შემდეგი თვე"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isDark
                      ? 'bg-[#2E2016] text-[#FAF5EB] hover:bg-[#3B291C]'
                      : 'bg-[#EAE3D5] text-[#5C3D24] hover:bg-[#DFD5C3]'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.2]" />
                </button>

                <WindowsWindowControls
                  isMinimized={isCalCardMinimized}
                  onToggleMinimize={() => setIsCalCardMinimized((v) => !v)}
                  isMaximized={isCalCardMaximized}
                  onToggleMaximize={() => setIsCalCardMaximized((v) => !v)}
                  isFullScreen={isCalCardFullScreen}
                  onToggleFullScreen={() => setIsCalCardFullScreen((v) => !v)}
                  isDark={isDark}
                  size="sm"
                />
              </div>
            </div>

            {!isCalCardMinimized && (
              <>

            {/* 4B. Horizontal Scrollable Hebrew Months Strip (RTL: תשרי, חשוון, כסלו, טבת, שבט, אדר...) */}
            <div
              dir="rtl"
              className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-3.5 border-b border-[#DCD2C0]/60 dark:border-[#5C3A21]/50"
            >
              {HEBREW_MONTH_TABS.map((m) => {
                const isActive = m.key === activeHebrewMonthKey;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setActiveHebrewMonthKey(m.key);
                      const cells = buildHebrewMonthCells(activeHebrewYear, m.key);
                      if (cells[0]) {
                        handleChooseDate(cells[0].gregorianDate);
                      }
                    }}
                    className={`min-w-[82px] sm:min-w-[90px] py-2.5 px-3 rounded-2xl text-center shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#4E3624] text-[#FAF5EB] border border-[#D4AF37]/60 shadow-md'
                          : 'bg-[#D8CFC0] text-[#2B1B10] shadow-inner font-black'
                        : isDark
                          ? 'bg-[#2B1E14] text-[#DECAA9] hover:bg-[#38271B]'
                          : 'bg-[#FAF7F2] text-[#4A3523] shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:bg-[#EFE9DE]'
                    }`}
                  >
                    <div className="font-serif text-base sm:text-lg font-black leading-tight">
                      {m.he}
                    </div>
                    <div className="text-[11px] font-semibold opacity-80 mt-0.5">{m.ka}</div>
                  </button>
                );
              })}
            </div>

            {/* 4C. Weekday Column Headers (RTL Grid: კვ. on right -> შაბ. on left) */}
            <div dir="rtl" className="grid grid-cols-7 gap-2 pt-4 pb-2 text-center">
              {RTL_WEEKDAY_HEADERS.map((label) => (
                <div
                  key={label}
                  dir="ltr"
                  className={`text-xs sm:text-sm font-extrabold ${
                    isDark ? 'text-[#DECAA9]' : 'text-[#5C4430]'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 4D. Circular Hebrew Gematria Day Orbs Grid (dir="rtl") */}
            <div dir="rtl" className="grid grid-cols-7 gap-y-3 gap-x-2 py-2 justify-items-center">
              {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full pointer-events-none"
                />
              ))}

              {monthCells.map((cell) => {
                const isSelected =
                  cell.gregorianDate.toDateString() === selectedDate.toDateString();

                // Match the exact color palette from Screenshot 2
                let circleClasses = '';
                let dotColorClass = '';

                if (isSelected) {
                  // Selected Day / Moed (Mint/Teal orb like כ"ז in Screenshot 2)
                  circleClasses = isDark
                    ? 'bg-[#246B60] text-[#E6FFF9] ring-2 ring-[#7CE5D5] shadow-lg scale-105'
                    : 'bg-[#BCE3DC] text-[#11695D] shadow-[0_4px_12px_rgba(25,115,102,0.22)] scale-105';
                } else if (cell.category === 'chag') {
                  // Holiday (Rose-pink orb like א, ב, ט, ט"ו..כ"ב in Screenshot 2)
                  circleClasses = isDark
                    ? 'bg-[#5A232D] text-[#FFD6DE] hover:bg-[#6E2B37]'
                    : 'bg-[#F7D6DA] text-[#A61E34] shadow-[0_3px_8px_rgba(166,30,52,0.1)] hover:brightness-98';
                  dotColorClass = 'bg-[#E36D7E]';
                } else if (cell.category === 'taanit') {
                  // Fast day (Warm Amber-Gold orb like ג, י in Screenshot 2)
                  circleClasses = isDark
                    ? 'bg-[#593D16] text-[#FFE3B3] hover:bg-[#6E4C1C]'
                    : 'bg-[#F6E2BC] text-[#A35C0F] shadow-[0_3px_8px_rgba(163,92,15,0.1)] hover:brightness-98';
                  dotColorClass = 'bg-[#D99B38]';
                } else if (cell.category === 'shabbat') {
                  // Shabbat (Warm Taupe orb like ח, כ"ט in Screenshot 2)
                  circleClasses = isDark
                    ? 'bg-[#3B2E23] text-[#E8D8BE] hover:bg-[#4A3A2C]'
                    : 'bg-[#E2DAD0] text-[#6D563E] shadow-[0_3px_8px_rgba(109,86,62,0.1)] hover:brightness-98';
                  dotColorClass = 'bg-[#A9957E]';
                } else {
                  // Regular day (Crisp White/Ivory orb)
                  circleClasses = isDark
                    ? 'bg-[#2B1E15] text-[#FAF5EB] hover:bg-[#38271C] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#2A1B10] shadow-[0_3px_10px_rgba(0,0,0,0.06)] hover:bg-white';
                }

                return (
                  <button
                    key={cell.hebrewDay}
                    type="button"
                    onClick={() => handleChooseDate(cell.gregorianDate)}
                    title={`${cell.gematria} ${activeMonthMeta.he} • ${cell.gregorianDate.getDate()} ${GEORGIAN_MONTHS[cell.gregorianDate.getMonth()]}, ${cell.gregorianDate.getFullYear()}`}
                    className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-serif text-base sm:text-lg font-black transition-all cursor-pointer active:scale-95 ${circleClasses}`}
                  >
                    <span>{cell.gematria}</span>
                    {dotColorClass && (
                      <span
                        className={`absolute bottom-1 left-1.5 w-2 h-2 rounded-full ${dotColorClass}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 4E. Color Legend Row (Screenshot 2 & 3: מועדים ●  תענית ●  חג ●  שבת ●) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-5 pb-4 border-b border-[#DCD2C0]/60 dark:border-[#5C3A21]/50 text-xs sm:text-sm font-serif font-bold">
              <div className="flex items-center gap-1.5">
                <span dir="rtl">מועדים</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#82B8AD] inline-block" />
              </div>
              <div className="flex items-center gap-1.5">
                <span dir="rtl">תענית</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#EBC06D] inline-block" />
              </div>
              <div className="flex items-center gap-1.5">
                <span dir="rtl">חג</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#EB8C9B] inline-block" />
              </div>
              <div className="flex items-center gap-1.5">
                <span dir="rtl">שבת</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#C5B49E] inline-block" />
              </div>
            </div>

            {/* 4F. Selected Day Sunrise (מזרח) & Sunset (שקיעה) Summary Box (Screenshot 3) */}
            <div className="pt-5 space-y-4">
              <h3
                className={`text-center text-lg sm:text-xl font-black ${
                  isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                }`}
              >
                არჩეული დღე:{' '}
                <span dir="rtl" className="font-serif">
                  {selectedHebrewDayCleanGematria} {selectedDayDetails.hebrewInfo.hebrewMonthHe}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Left Card: Sunrise (מזרח) */}
                <div
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    isDark
                      ? 'bg-[#2B1E15] border border-[#C49A6C]/30 shadow-md'
                      : 'bg-[#FAF8F5] shadow-[0_4px_14px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* Golden Sunrise Icon with Upward Arrow (matching Screenshot 3) */}
                  <svg
                    viewBox="0 0 32 32"
                    className="w-7 h-7 text-[#E0A12E] mb-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4v7" />
                    <path d="M12.5 7.5L16 4l3.5 3.5" />
                    <path d="M8 22a8 8 0 0 1 16 0" />
                    <line x1="4" y1="22" x2="28" y2="22" />
                    <line x1="7" y1="26" x2="25" y2="26" />
                  </svg>
                  <div
                    dir="rtl"
                    className={`font-serif text-xs sm:text-sm font-bold ${
                      isDark ? 'text-[#DECAA9]' : 'text-[#7A6855]'
                    }`}
                  >
                    מזרח
                  </div>
                  <div
                    className={`text-lg sm:text-xl font-black tabular-nums mt-0.5 ${
                      isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                    }`}
                  >
                    {selectedDayZmanim.sunrise}
                  </div>
                </div>

                {/* Right Card: Sunset (שקיעה) */}
                <div
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    isDark
                      ? 'bg-[#2B1E15] border border-[#C49A6C]/30 shadow-md'
                      : 'bg-[#FAF8F5] shadow-[0_4px_14px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* Indigo Sunset Icon with Downward Arrow (matching Screenshot 3) */}
                  <svg
                    viewBox="0 0 32 32"
                    className="w-7 h-7 text-[#5B68DF] mb-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4v7" />
                    <path d="M12.5 7.5L16 11l3.5-3.5" />
                    <path d="M8 22a8 8 0 0 1 16 0" />
                    <line x1="4" y1="22" x2="28" y2="22" />
                    <line x1="7" y1="26" x2="25" y2="26" />
                  </svg>
                  <div
                    dir="rtl"
                    className={`font-serif text-xs sm:text-sm font-bold ${
                      isDark ? 'text-[#DECAA9]' : 'text-[#7A6855]'
                    }`}
                  >
                    שקיעה
                  </div>
                  <div
                    className={`text-lg sm:text-xl font-black tabular-nums mt-0.5 ${
                      isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                    }`}
                  >
                    {selectedDayZmanim.sunset}
                  </div>
                </div>
              </div>

              {/* Centered Gregorian Date in Georgian (e.g., 8 ოქტომბერი, 2026) */}
              <div
                className={`text-center text-sm sm:text-base font-semibold pt-1 ${
                  isDark ? 'text-[#DECAA9]' : 'text-[#6E5A44]'
                }`}
              >
                {selectedDate.getDate()} {GEORGIAN_MONTHS[selectedDate.getMonth()]},{' '}
                {selectedDate.getFullYear()}
              </div>

              {/* Quick Selected Day Actions: Open Siddur Prayers & View Tzadikim Hilula */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSiddurDailyPrayer) {
                      onOpenSiddurDailyPrayer(selectedDate);
                    } else {
                      onNavigateToRealm('siddur');
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#362417] text-[#FAF5EB] border border-[#C49A6C]/50 hover:bg-[#47301F]'
                      : 'bg-[#E5DEC9] text-[#3B2616] hover:bg-[#D8CEB8]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>დღის ლოცვები სიდურში</span>
                  <span dir="rtl" className="font-serif font-bold">
                    · תפילות היום
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToRealm('daily-halakhot')}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-800/80'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-500/40 hover:bg-emerald-200/80'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>ყოველდღიური 2 ჰალახა</span>
                  <span dir="rtl" className="font-serif font-bold">
                    · ב׳ הלכות
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToRealm('yalkut-yosef')}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-amber-900/60 text-amber-200 border border-amber-400/50 hover:bg-amber-800/70'
                      : 'bg-amber-100 text-amber-950 border border-amber-500/40 hover:bg-amber-200/80'
                  }`}
                >
                  <span dir="rtl" className="font-serif font-black">
                    ילקוט יוסף - קיצור שו״ע
                  </span>
                </button>

                {selectedDayDetails.events[0] && (
                  <button
                    type="button"
                    onClick={() => setSelectedEventModal(selectedDayDetails.events[0])}
                    className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isDark
                        ? 'bg-[#173833] text-[#7CE5D5] border border-[#4CA89A]/50'
                        : 'bg-[#DCECE8] text-[#15695D] hover:bg-[#CBE3DD]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{selectedDayDetails.events[0].titleKa.split('•')[0]}</span>
                  </button>
                )}
              </div>
            </div>
            </>
            )}
          </div>

          {/* =====================================================================
              5. JEWISH EVENTS SECTION (Screenshot 1 & 3: 📅 מועדים · ებრაული მოვლენები)
             ===================================================================== */}
          <div
            className={`${
              isMoadimMaximized
                ? 'fixed inset-2 z-[165] overflow-y-auto rounded-3xl m-0'
                : 'rounded-[30px] mb-6'
            } p-4 sm:p-6 border space-y-4 ${
              isDark
                ? 'bg-[#211710] border-[#C49A6C]/35 shadow-2xl'
                : 'bg-[#FAF8F4] border-[#E5DEC9] shadow-[0_10px_30px_rgba(92,61,36,0.07)]'
            }`}
          >
            {/* Section Title: 📅 מועדים · ებრაული მოვლენები */}
            <div className="flex items-center justify-between gap-2.5 pb-1">
              <div className="flex items-center gap-2.5">
                <Calendar
                  className={`w-5 h-5 ${isDark ? 'text-[#D4AF37]' : 'text-[#6E4F35]'}`}
                />
                <h3
                  className={`text-base sm:text-lg font-black flex items-center gap-1.5 ${
                    isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                  }`}
                >
                  <span dir="rtl" className="font-serif">
                    מועדים
                  </span>
                  <span>· ებრაული მოვლენები</span>
                </h3>
              </div>
              <WindowsWindowControls
                isMinimized={isMoadimMinimized}
                onToggleMinimize={() => setIsMoadimMinimized((v) => !v)}
                isMaximized={isMoadimMaximized}
                onToggleMaximize={() => setIsMoadimMaximized((v) => !v)}
                isDark={isDark}
                size="sm"
              />
            </div>

            {!isMoadimMinimized && (
              <>

            {/* 5A. Featured "შემდეგი მოვლენა" (Next Event) Banner Card */}
            {featuredNextEvent && (
              <div
                onClick={() => setSelectedEventModal(featuredNextEvent.annualEventObj)}
                className={`rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all hover:scale-[1.005] ${
                  isDark
                    ? 'bg-gradient-to-br from-[#2B1F16] via-[#1C2E2B] to-[#163832] border-[#4CA89A]/50'
                    : 'bg-gradient-to-br from-[#EFEBE2] via-[#EBF2EF] to-[#DFEFEA] border-[#C9C3B6]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div
                      className={`text-xs sm:text-sm font-extrabold ${
                        isDark ? 'text-[#D4AF37]' : 'text-[#7A5434]'
                      }`}
                    >
                      შემდეგი მოვლენა
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-semibold pt-2 ${
                        isDark ? 'text-[#E8D8BE]' : 'text-[#6E5A44]'
                      }`}
                    >
                      <span dir="rtl" className="font-serif font-bold">
                        {featuredNextEvent.item.titleHe}
                      </span>{' '}
                      · {featuredNextEvent.weekdayKa}, {featuredNextEvent.dayOfMonth}{' '}
                      {featuredNextEvent.monthFullKa}
                    </div>

                    <div
                      className={`text-sm sm:text-base font-black ${
                        isDark ? 'text-[#63D2C2]' : 'text-[#1B7A6E]'
                      }`}
                    >
                      {featuredNextEvent.daysRemaining === 0
                        ? 'დღეს არის!'
                        : `დარჩა ${featuredNextEvent.daysRemaining} დღე`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-3">
                    <span
                      dir="rtl"
                      className={`font-serif text-xl sm:text-2xl font-black ${
                        isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                      }`}
                    >
                      {featuredNextEvent.item.titleHe}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventModal(featuredNextEvent.annualEventObj);
                      }}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                        isDark
                          ? 'bg-[#3A281B] text-[#FAF5EB] border border-[#C49A6C]/50 hover:bg-[#4A3322]'
                          : 'bg-[#DDD6C7] text-[#3B2616] hover:bg-[#CFC6B4]'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 stroke-[2]" />
                      <span dir="rtl" className="font-serif font-extrabold">
                        הלכות
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5B. Chronological Upcoming Events List Cards (matching Screenshot 1 & 3) */}
            <div className="space-y-3">
              {followingEvents.map((ev) => (
                <div
                  key={ev.item.id}
                  onClick={() => setSelectedEventModal(ev.annualEventObj)}
                  className={`rounded-2xl px-4 py-3.5 border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005] ${
                    isDark
                      ? 'bg-[#281C14] border-[#5C3A21]/60 hover:border-[#C49A6C]/60'
                      : 'bg-[#F6F3EC] border-[#E6DFD1] hover:bg-[#EFEAE0]'
                  }`}
                >
                  {/* Left: Short Month + Big Day Number + "<days> · <Hebrew Name> დღე" */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="text-center min-w-[36px]">
                      <div
                        className={`text-[11px] font-bold leading-tight ${
                          isDark ? 'text-[#DECAA9]' : 'text-[#7A6855]'
                        }`}
                      >
                        {ev.monthShortKa}
                      </div>
                      <div
                        className={`text-lg sm:text-xl font-black tabular-nums leading-tight ${
                          isDark ? 'text-[#FAF5EB]' : 'text-[#5C3A21]'
                        }`}
                      >
                        {ev.dayOfMonth}
                      </div>
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isDark ? 'text-[#DECAA9]' : 'text-[#6E5A44]'
                      }`}
                    >
                      <span className="tabular-nums">{ev.daysRemaining}</span>
                      {' · '}
                      <span dir="rtl" className="font-serif font-bold">
                        {ev.item.titleHe}
                      </span>{' '}
                      დღე
                    </div>
                  </div>

                  {/* Right: Bold Hebrew Event Title + Optional "📖 הלכות" Pill Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      dir="rtl"
                      className={`font-serif text-base sm:text-lg font-black ${
                        isDark ? 'text-[#FAF5EB]' : 'text-[#2D1A0E]'
                      }`}
                    >
                      {ev.item.titleHe}
                    </span>

                    {ev.item.hasHalakhaBtn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventModal(ev.annualEventObj);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                          isDark
                            ? 'bg-[#3A281B] text-[#FAF5EB] border border-[#C49A6C]/50 hover:bg-[#4A3322]'
                            : 'bg-[#E2DBD0] text-[#3B2616] hover:bg-[#D4CBB9]'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 stroke-[2]" />
                        <span dir="rtl" className="font-serif font-extrabold">
                          הלכות
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 5C. Google Calendar Connection Banner (Screenshot 1 bottom) */}
            <div
              className={`rounded-2xl p-4 sm:p-5 border text-center space-y-3 mt-2 ${
                isDark
                  ? 'bg-[#172E2A]/80 border-[#4CA89A]/45 text-[#E6FFF9]'
                  : 'bg-[#EBF2F0] border-[#BFD4CE] text-[#4A5552]'
              }`}
            >
              <p className="text-xs sm:text-sm font-semibold leading-relaxed max-w-md mx-auto">
                დააკავშირე შენი Google Calendar — დღესასწაულები ავტომატურად დაემატება შენს
                კალენდარში
              </p>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsGoogleCalModalOpen(true)}
                  className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 ${
                    googleCalConnected
                      ? 'bg-emerald-600 text-white'
                      : isDark
                        ? 'bg-[#2C6B60] text-[#FAF5EB] hover:bg-[#368275]'
                        : 'bg-[#C9DDD8] text-[#1A2E2B] hover:bg-[#B8D2CC]'
                  }`}
                >
                  {googleCalConnected ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>დაკავშირებულია (Google Calendar)</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>დაკავშირება</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </>
            )}
          </div>

          {/* =====================================================================
              6. TZADIKIM HILULOT SECTION FOR SELECTED DATE
             ===================================================================== */}
          <div
            className={`rounded-[30px] p-4 sm:p-6 border space-y-3 ${
              isDark
                ? 'bg-[#211710] border-[#C49A6C]/35'
                : 'bg-[#FAF8F4] border-[#E5DEC9] shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>
                  ამ დღის ცადიკების ჰილულა (הילולא דצדיקים —{' '}
                  <span dir="rtl" className="font-serif">
                    {selectedHebrewDayCleanGematria} {selectedDayDetails.hebrewInfo.hebrewMonthHe}
                  </span>
                  ):
                </span>
              </h4>
              <WindowsWindowControls
                isMinimized={isHilulotMinimized}
                onToggleMinimize={() => setIsHilulotMinimized((v) => !v)}
                isDark={isDark}
                size="sm"
              />
            </div>

            {!isHilulotMinimized && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedDayDetails.tzadikim.map((tz) => {
                const isLit = !!litCandleIds[tz.id];
                return (
                  <div
                    key={tz.id}
                    onClick={() => setSelectedTzadikModal(tz)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isDark
                        ? 'bg-[#2B1E14] hover:bg-[#38271B] border-[#5C3A21]'
                        : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] border-[#DFD5C3]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-black truncate">{tz.nameKa}</div>
                      <div
                        dir="rtl"
                        className="font-serif text-xs font-bold text-[#B07D48] dark:text-[#D4AF37] truncate"
                      >
                        {tz.nameHe}
                      </div>
                      <div className="text-[11px] opacity-75 truncate">{tz.hebrewDateStr}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLitCandleIds((prev) => ({ ...prev, [tz.id]: !prev[tz.id] }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer ${
                        isLit
                          ? 'bg-amber-500 text-[#21140B] shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                          : isDark
                            ? 'bg-[#3D2B1D] text-[#FAF5EB]'
                            : 'bg-[#DDD5C7] text-[#3B2616]'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isLit ? 'ანთია' : 'სანთელი'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </>
      ) : (
        /* =====================================================================
           TAB 2: זמנים 🕒 სრული დროები (FULL HALAKHIC ZMANIM VIEW)
           ===================================================================== */
        <div
          className={`${
            isZmanimMaximized
              ? 'fixed inset-2 z-[165] overflow-y-auto rounded-3xl m-0'
              : 'rounded-[30px]'
          } p-4 sm:p-6 border space-y-5 ${
            isDark
              ? 'bg-[#211710] border-[#C49A6C]/35 shadow-2xl'
              : 'bg-[#F3EFE6] border-[#E2D9C8] shadow-[0_10px_30px_rgba(92,61,36,0.08)]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCD2C0]/60 dark:border-[#5C3A21]/50 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#287D70]" />
                <span>זמנים · სრული ჰალახური დროები</span>
              </h2>
              <p className="text-xs opacity-80 mt-0.5">
                არჩეული დღე:{' '}
                <span dir="rtl" className="font-serif font-bold">
                  {selectedHebrewDayCleanGematria} {selectedDayDetails.hebrewInfo.hebrewMonthHe}
                </span>{' '}
                • {selectedDate.getDate()} {GEORGIAN_MONTHS[selectedDate.getMonth()]},{' '}
                {selectedDate.getFullYear()}
              </p>
            </div>

            {/* City Selector Pills */}
            <div className="flex flex-wrap gap-1.5">
              {ZMANIM_CITIES.map((c) => {
                const active = c.id === selectedCityId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCityId(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                      active
                        ? 'bg-[#287D70] text-white shadow-sm'
                        : isDark
                          ? 'bg-[#2E2016] text-[#DECAA9]'
                          : 'bg-[#FAF7F2] text-[#4A3523] border border-[#DFD5C3]'
                    }`}
                  >
                    {c.nameKa}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                he: 'עמוד השחר',
                ka: 'ალოთ ჰაშახარი (ცისკარი)',
                time: selectedDayZmanim.alotHaShachar,
              },
              {
                he: 'משיכיר (טלית ותפילין)',
                ka: 'მიშეიაქირი (ტალითი და თეფილინი)',
                time: selectedDayZmanim.misheyakir,
              },
              {
                he: 'נץ החמה / מזרח',
                ka: 'ნეც ჰახამა (მზის ამოსვლა)',
                time: selectedDayZmanim.sunrise,
              },
              {
                he: 'סוף זמן ק"ש (מג"א)',
                ka: 'შემას ბოლო დრო (მაგენ აბრაამი)',
                time: selectedDayZmanim.sofZmanShemaMga,
              },
              {
                he: 'סוף זמן ק"ש (גר"א)',
                ka: 'შემას ბოლო დრო (გრა)',
                time: selectedDayZmanim.sofZmanShemaGra,
              },
              {
                he: 'סוף זמן תפילה',
                ka: 'შახრითის ლოცვის ბოლო დრო',
                time: selectedDayZmanim.sofZmanTefilaGra,
              },
              {
                he: 'חצות היום והלילה',
                ka: 'ხაცოთი (შუადღე / შუაღამე)',
                time: selectedDayZmanim.chatzot,
              },
              {
                he: 'מנחה גדולה',
                ka: 'მინხა გედოლა',
                time: selectedDayZmanim.minchaGedola,
              },
              {
                he: 'מנחה קטנה',
                ka: 'მინხა კეტანა',
                time: selectedDayZmanim.minchaKetana,
              },
              {
                he: 'פלג המנחה',
                ka: 'პელეგ ჰამინხა',
                time: selectedDayZmanim.plagHaMincha,
              },
              {
                he: 'הדלקת נרות',
                ka: 'სანთლების ანთება (შაბათი / დღესასწაული)',
                time: selectedDayZmanim.candleLighting,
              },
              {
                he: 'שקיעה',
                ka: 'შკიყა (მზის ჩასვლა)',
                time: selectedDayZmanim.sunset,
              },
              {
                he: 'צאת הכוכבים',
                ka: 'ცეთ ჰაქოხავიმი (ვარსკვლავების გამოსვლა)',
                time: selectedDayZmanim.tzeitHaKochavim,
              },
              {
                he: 'צאת הכוכבים (רבינו תם)',
                ka: 'რაბენუ თამის დრო (72 წუთი)',
                time: selectedDayZmanim.rabbeinuTam,
              },
            ].map((zm) => (
              <div
                key={zm.he}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-[#2B1E14] border-[#5C3A21]/60'
                    : 'bg-[#FAF8F5] border-[#E4DDD0] shadow-xs'
                }`}
              >
                <div>
                  <div
                    dir="rtl"
                    className={`font-serif text-sm sm:text-base font-black ${
                      isDark ? 'text-[#D4AF37]' : 'text-[#5C3A21]'
                    }`}
                  >
                    {zm.he}
                  </div>
                  <div className="text-xs font-semibold opacity-80">{zm.ka}</div>
                </div>
                <div className="text-base sm:text-lg font-black tabular-nums px-3 py-1 rounded-xl bg-[#BCE3DC]/40 dark:bg-[#173833] text-[#11695D] dark:text-[#7CE5D5]">
                  {zm.time}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTopTab('calendar')}
              className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-[#DDD5C7] text-[#3B2616] cursor-pointer"
            >
              ← კალენდარზე დაბრუნება
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. FLOATING BOTTOM-LEFT 'T' & BOTTOM-RIGHT '↑' BUTTONS (Screenshot 1 & 3)
         ===================================================================== */}
      <button
        type="button"
        onClick={() => setFontScaleStep((s) => (s + 1) % 3)}
        title="შრიფტის ზომის შეცვლა (T)"
        className={`fixed bottom-6 left-5 z-40 w-12 h-12 rounded-full border flex items-center justify-center font-serif text-xl font-bold transition-all cursor-pointer active:scale-95 ${
          isDark
            ? 'bg-[#2B1E15]/95 border-[#C49A6C]/50 text-[#FAF5EB] shadow-xl'
            : 'bg-[#FAF8F4]/95 border-[#E2D9C8] text-[#5C3D24] shadow-[0_6px_20px_rgba(92,61,36,0.16)]'
        }`}
      >
        T
      </button>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="ზემოთ ასვლა"
        className={`fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          isDark
            ? 'bg-[#2B1E15]/95 border-[#C49A6C]/50 text-[#FAF5EB] shadow-xl'
            : 'bg-[#FAF8F4]/95 border-[#E2D9C8] text-[#5C3D24] shadow-[0_6px_20px_rgba(92,61,36,0.16)]'
        }`}
      >
        <ArrowUp className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* =====================================================================
          8. GOOGLE CALENDAR CONNECTION & EXPORT MODAL
         ===================================================================== */}
      <AnimatePresence>
        {isGoogleCalModalOpen && (
          <motion.div
            key="gcal-connect-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsGoogleCalModalOpen(false)}
            className="fixed inset-0 z-[185] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-[#1E150F] border-[#4CA89A] text-[#FAF5EB]'
                  : 'bg-[#FAF8F4] border-[#78B5AA] text-[#2D1A0E]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#DCD2C0]/60 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-[#1E7A6D]" />
                    <span>Google Calendar-თან დაკავშირება</span>
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    დაამატეთ ყველა ებრაული დღესასწაული და მარხვა თქვენს Google Calendar-ში
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoogleCalModalOpen(false)}
                  className="p-2 rounded-full border border-[#C49A6C]/40 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadIcsCalendar}
                  className="w-full py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer bg-[#1E7A6D] hover:bg-[#176156] text-white shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>მთელი წლის დღესასწაულების ფაილის (.ics) ჩამოტვირთვა და სინქრონიზაცია</span>
                </button>

                <div className="text-xs font-bold opacity-80 pt-1">
                  ან დაამატეთ უახლოესი დღესასწაულები პირდაპირ Google Calendar-ში:
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {upcomingMoadimList.slice(0, 8).map((ev) => (
                    <a
                      key={ev.item.id}
                      href={buildGoogleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setGoogleCalConnected(true);
                        try {
                          localStorage.setItem('talmud_gcal_connected_v1', 'true');
                        } catch {
                          // ignore
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all ${
                        isDark
                          ? 'bg-[#2B1E14] hover:bg-[#38271B] border-[#5C3A21]'
                          : 'bg-[#F3EFE6] hover:bg-[#EAE3D5] border-[#E2D9C8]'
                      }`}
                    >
                      <div>
                        <span dir="rtl" className="font-serif font-black mr-1.5">
                          {ev.item.titleHe}
                        </span>
                        <span>
                          · {ev.item.titleKa} ({ev.dayOfMonth} {ev.monthFullKa})
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[#1E7A6D] dark:text-[#63D2C2] font-extrabold shrink-0">
                        <span>+ Google Calendar</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          9. EVENT HALAKHA & SOURCES MODAL ("📖 הלכות" BUTTON MODAL)
         ===================================================================== */}
      <AnimatePresence>
        {selectedEventModal && (
          <motion.div
            key="event-details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEventModal(null)}
            className="fixed inset-0 z-[185] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#FAF8F4] border-[#C9B38C] text-[#21140B]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#8B5A2B]/30 pb-3">
                <div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#DDD6C7] text-[#3B2616]">
                    {selectedEventModal.hebrewDateLabel}
                  </span>
                  <h3 className="text-lg font-black mt-2">{selectedEventModal.titleKa}</h3>
                  <div dir="rtl" className="font-serif text-base font-bold text-[#1E7A6D] dark:text-[#63D2C2]">
                    {selectedEventModal.titleHe}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="p-2 rounded-full border border-[#C49A6C]/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed">
                {selectedEventModal.fullDescriptionKa}
              </p>

              <div
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                  isDark
                    ? 'bg-[#172E2A]/60 border-[#4CA89A]/40 text-[#E6FFF9]'
                    : 'bg-[#EBF2F0] border-[#BFD4CE] text-[#1A2E2B]'
                }`}
              >
                <strong>📖 הלכות · ჰალახური კანონები:</strong> {selectedEventModal.halakhaLawsKa}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToRealm(
                      selectedEventModal.halakhaLink.realmId,
                      selectedEventModal.halakhaLink.bookId,
                      selectedEventModal.halakhaLink.chapter
                    );
                    setSelectedEventModal(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#1E7A6D] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{selectedEventModal.halakhaLink.labelKa}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToRealm(
                      'torah',
                      selectedEventModal.torahLink.bookId,
                      selectedEventModal.torahLink.chapter
                    );
                    setSelectedEventModal(null);
                  }}
                  className="px-4 py-2 rounded-full bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{selectedEventModal.torahLink.labelKa}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToRealm(
                      'talmud',
                      undefined,
                      undefined,
                      selectedEventModal.talmudLink.tractateId,
                      selectedEventModal.talmudLink.dafId
                    );
                    setSelectedEventModal(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#5C3A21] text-[#FAF5EB] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{selectedEventModal.talmudLink.labelKa}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          10. TZADIK / RABBI FULL BIOGRAPHY MODAL
         ===================================================================== */}
      <AnimatePresence>
        {selectedTzadikModal && (
          <motion.div
            key="tzadik-bio-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTzadikModal(null)}
            className="fixed inset-0 z-[185] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#FAF8F4] border-[#C9B38C] text-[#21140B]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#8B5A2B]/35 pb-3">
                <div>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-[#6B4226] text-[#FAF5EB]">
                    ჰილულა: {selectedTzadikModal.hebrewDateStr}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-1">
                    {selectedTzadikModal.nameKa}
                  </h3>
                  <div dir="rtl" className="font-serif text-base font-bold text-[#C49A6C]">
                    {selectedTzadikModal.nameHe}
                  </div>
                  <p className="text-xs opacity-85">{selectedTzadikModal.titleKa}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTzadikModal(null)}
                  className="p-2 rounded-xl border border-[#C49A6C]/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#6B4226]/15 border border-[#8B5A2B]/35">
                    <strong>ეპოქა და წლები:</strong> {selectedTzadikModal.eraKa} ({selectedTzadikModal.years})
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#6B4226]/15 border border-[#8B5A2B]/35 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C49A6C] shrink-0" />
                    <span>
                      <strong>ציון / განსასვენებელი:</strong> {selectedTzadikModal.burialPlaceKa}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#6B4226]/15 border border-[#8B5A2B]/35">
                  <strong>მთავარი თხზულებები (חיבורים):</strong> {selectedTzadikModal.magnumOpusKa}
                </div>

                <div>
                  <h4 className="font-black mb-1">ცხოვრების ისტორია და ბიოგრაფია:</h4>
                  <p>{selectedTzadikModal.biographyKa}</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#C49A6C]/60 bg-[#2C1D13] text-[#FAF5EB] space-y-1">
                  <div dir="rtl" className="font-serif text-sm sm:text-base font-bold text-[#F5DFBB]">
                    ״{selectedTzadikModal.famousTeachingHe}״
                  </div>
                  <div className="text-xs italic">{selectedTzadikModal.famousTeachingKa}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#8B5A2B]/30">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToRealm(
                      selectedTzadikModal.linkedRealm,
                      selectedTzadikModal.linkedBookId,
                      selectedTzadikModal.linkedChapter,
                      selectedTzadikModal.linkedTractateId,
                      selectedTzadikModal.linkedDafId
                    );
                    setSelectedTzadikModal(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#1E7A6D] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ამ ცადიკის სწავლებაზე გადასვლა</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
