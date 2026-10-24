// @ts-nocheck
import {
  getEventsAndHilulotForDate,
  getHebrewDateInfo,
  FormattedHebrewDate,
  JewishAnnualEvent,
} from '../data/hebrewCalendarAndTzadikimData';
import {
  SIDDUR_PRAYER_SECTIONS,
  SiddurEditionId,
  SiddurPrayerSectionMeta,
} from '../data/siddurPdfCatalog';

export type DailyPrayerServiceId = 'shacharit' | 'mincha' | 'maariv' | 'birkat-hamazon';

export type NusachMaqamId = 'yerushalmi-rast' | 'sephardi-hijaz' | 'shabbat-bayat';

export type AudioGuideMode = 'melody-and-voice' | 'melody-only' | 'voice-only';

export interface QuickJumpLandmark {
  id: string;
  prayerSectionId: string;
  shortHe: string;
  shortKa: string;
  kavanatPage: number;
  classicPage: number;
  badgeType: 'morning' | 'shema-amidah' | 'torah-end' | 'mincha-maariv' | 'shabbat' | 'blessing';
}

export const SIDDUR_QUICK_JUMP_LANDMARKS: QuickJumpLandmark[] = [
  {
    id: 'lj-maftechot',
    prayerSectionId: 'maftechot-haskamot',
    shortHe: 'שער ומפתחות',
    shortKa: 'სარჩევი',
    kavanatPage: 3,
    classicPage: 10,
    badgeType: 'morning',
  },
  {
    id: 'lj-modeh-ani',
    prayerSectionId: 'modeh-ani-netilat',
    shortHe: 'מודה אני ונט״י',
    shortKa: 'მოდე ანი',
    kavanatPage: 29,
    classicPage: 10,
    badgeType: 'morning',
  },
  {
    id: 'lj-asher-yatzar',
    prayerSectionId: 'asher-yatzar-torah',
    shortHe: 'אשר יצר וברכות התורה',
    shortKa: 'აშერ იაცარ',
    kavanatPage: 30,
    classicPage: 15,
    badgeType: 'morning',
  },
  {
    id: 'lj-birkot-hashachar',
    prayerSectionId: 'birkot-hashachar',
    shortHe: 'ברכות השחר',
    shortKa: 'ბირქოთ ჰაშახარ',
    kavanatPage: 31,
    classicPage: 40,
    badgeType: 'morning',
  },
  {
    id: 'lj-patach-eliyahu',
    prayerSectionId: 'patach-eliyahu',
    shortHe: 'פתיחת אליהו',
    shortKa: 'პათახ ელიაჰუ',
    kavanatPage: 60,
    classicPage: 40,
    badgeType: 'morning',
  },
  {
    id: 'lj-tallit-tefillin',
    prayerSectionId: 'tallit-tefillin',
    shortHe: 'טלית ותפילין',
    shortKa: 'ტალით-თეფილინი',
    kavanatPage: 71,
    classicPage: 60,
    badgeType: 'morning',
  },
  {
    id: 'lj-korbanot',
    prayerSectionId: 'beit-haknesset-korbanot',
    shortHe: 'קורבנות וקטורת',
    shortKa: 'კეტორეთი',
    kavanatPage: 78,
    classicPage: 60,
    badgeType: 'morning',
  },
  {
    id: 'lj-baruch-sheamar',
    prayerSectionId: 'hodu-baruch-sheamar',
    shortHe: 'הודו וברוך שאמר',
    shortKa: 'ბარუხ შეამარ',
    kavanatPage: 122,
    classicPage: 80,
    badgeType: 'morning',
  },
  {
    id: 'lj-ashrei',
    prayerSectionId: 'ashrei-az-yashir-yishtabach',
    shortHe: 'אשרי וישתבח',
    shortKa: 'აშრეი',
    kavanatPage: 130,
    classicPage: 80,
    badgeType: 'morning',
  },
  {
    id: 'lj-kriat-shema',
    prayerSectionId: 'yotzer-or-kriat-shema',
    shortHe: 'קריאת שמע',
    shortKa: 'კრიათ შმა',
    kavanatPage: 144,
    classicPage: 100,
    badgeType: 'shema-amidah',
  },
  {
    id: 'lj-amidah',
    prayerSectionId: 'amidah-shacharit-intro',
    shortHe: 'תפילת העמידה (שמו״ע)',
    shortKa: 'ამიდა (შმონე ესრე)',
    kavanatPage: 164,
    classicPage: 130,
    badgeType: 'shema-amidah',
  },
  {
    id: 'lj-amidah-bakashot',
    prayerSectionId: 'amidah-middle-blessings',
    shortHe: 'ברכות אמצעיות (רפאנו/פרנסה)',
    shortKa: 'ამიდის თხოვნები',
    kavanatPage: 166,
    classicPage: 130,
    badgeType: 'shema-amidah',
  },
  {
    id: 'lj-tachanun',
    prayerSectionId: 'tachanun-vidui-13-middot',
    shortHe: 'תחנון וי״ג מידות',
    shortKa: 'თახანუნი',
    kavanatPage: 200,
    classicPage: 160,
    badgeType: 'torah-end',
  },
  {
    id: 'lj-sefer-torah',
    prayerSectionId: 'hotzaat-sefer-torah',
    shortHe: 'פתיחת הארון וספר תורה',
    shortKa: 'სეფერ თორა',
    kavanatPage: 217,
    classicPage: 160,
    badgeType: 'torah-end',
  },
  {
    id: 'lj-aleinu',
    prayerSectionId: 'ashrei-uva-letzion-aleinu',
    shortHe: 'ובא לציון ועלינו לשבח',
    shortKa: 'ალეინუ ლეშაბეახ',
    kavanatPage: 230,
    classicPage: 200,
    badgeType: 'torah-end',
  },
  {
    id: 'lj-mincha-arvit',
    prayerSectionId: 'mincha-arvit-seder',
    shortHe: 'מנחה וערבית • ק״ש על המיטה',
    shortKa: 'მინხა და არვითი',
    kavanatPage: 200,
    classicPage: 160,
    badgeType: 'mincha-maariv',
  },
  {
    id: 'lj-shabbat',
    prayerSectionId: 'shabbat-kodesh-seder',
    shortHe: 'שבת קודש • לכה דודי וקידוש',
    shortKa: 'შაბათ კოდეში',
    kavanatPage: 230,
    classicPage: 200,
    badgeType: 'shabbat',
  },
  {
    id: 'lj-birkat-hamazon',
    prayerSectionId: 'birkat-hamazon-berakhot',
    shortHe: 'ברכת המזון וברכות',
    shortKa: 'ბირქათ ჰამაზონი',
    kavanatPage: 250,
    classicPage: 200,
    badgeType: 'blessing',
  },
];

export interface DailyPrayerStep {
  stepId: string;
  order: number;
  prayerSectionId: string;
  titleHe: string;
  titleKa: string;
  noteHe: string;
  noteKa: string;
  kavanatPage: number;
  classicPage: number;
  status: 'required' | 'special-addition' | 'omitted-today';
  omittedReasonKa?: string;
}

export interface DailyHalakhicPrayerStatus {
  date: Date;
  hebrewInfo: FormattedHebrewDate;
  events: JewishAnnualEvent[];
  weekdayIndex: number; // 0 = Sun .. 6 = Shabbat
  weekdayHe: string;
  weekdayKa: string;
  isShabbat: boolean;
  isErevShabbat: boolean;
  isRoshChodesh: boolean;
  isTorahReadingDay: boolean;
  torahReadingReasonKa: string;
  isTachanunRecited: boolean;
  tachanunReasonKa: string;
  seasonDewRainHe: string;
  seasonDewRainKa: string;
  seasonBlessingHe: string;
  seasonBlessingKa: string;
  specialInsertions: Array<{
    id: string;
    titleHe: string;
    titleKa: string;
    detailKa: string;
    targetPrayerId: string;
  }>;
  recommendedService: DailyPrayerServiceId;
  services: Record<
    DailyPrayerServiceId,
    {
      id: DailyPrayerServiceId;
      nameHe: string;
      nameKa: string;
      timeRangeKa: string;
      steps: DailyPrayerStep[];
    }
  >;
}

const WEEKDAY_META: Array<{ he: string; ka: string }> = [
  { he: 'יום ראשון (א׳)', ka: 'კვირა (იომ რიშონ)' },
  { he: 'יום שני (ב׳ — קריאת התורה)', ka: 'ორშაბათი (იომ შენი)' },
  { he: 'יום שלישי (ג׳)', ka: 'სამშაბათი (იომ შლიში)' },
  { he: 'יום רביעי (ד׳)', ka: 'ოთხშაბათი (იომ რევიი)' },
  { he: 'יום חמישי (ה׳ — קריאת התורה)', ka: 'ხუთშაბათი (იომ ხამიში)' },
  { he: 'יום שישי (ערב שבת קודש)', ka: 'პარასკევი (ერევ შაბათი)' },
  { he: 'שבת קודש', ka: 'შაბათ კოდეში' },
];

export function getRecommendedPrayerServiceByHour(date: Date = new Date()): DailyPrayerServiceId {
  const hour = date.getHours();
  if (hour >= 4 && hour < 12) return 'shacharit';
  if (hour >= 12 && hour < 18) return 'mincha';
  return 'maariv';
}

export function buildDailyHalakhicPrayerStatus(date: Date): DailyHalakhicPrayerStatus {
  const calData = getEventsAndHilulotForDate(date);
  const hebrewInfo = calData.hebrewInfo || getHebrewDateInfo(date);
  const weekdayIndex = date.getDay();
  const weekday = WEEKDAY_META[weekdayIndex] || WEEKDAY_META[0];

  const isShabbat = weekdayIndex === 6;
  const isErevShabbat = weekdayIndex === 5;
  const isRoshChodesh =
    hebrewInfo.hebrewDayNum === 1 ||
    hebrewInfo.hebrewDayNum === 30 ||
    calData.events.some((e) => e.category === 'rosh-chodesh');

  const hasHoliday = calData.events.some((e) => e.category === 'holiday');
  const hasFast = calData.events.some((e) => e.category === 'fast');

  // Determine winter vs summer liturgical season (Mashiv HaRuach vs Morid HaTal)
  const mKey = hebrewInfo.hebrewMonthKey;
  const dNum = hebrewInfo.hebrewDayNum;
  const isSummerSeason =
    (mKey === 'nisan' && dNum >= 15) ||
    mKey === 'iyar' ||
    mKey === 'sivan' ||
    mKey === 'tammuz' ||
    mKey === 'av' ||
    mKey === 'elul' ||
    (mKey === 'tishrei' && dNum < 22);

  const seasonDewRainHe = isSummerSeason ? 'מוֹרִיד הַטָּל' : 'מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם';
  const seasonDewRainKa = isSummerSeason
    ? 'ზაფხულის წესი: „მორიდ ჰატალ“ (ამიდის მე-2 კურთხევაში)'
    : 'ზამთრის წესი: „მაშივ ჰარუახ უმორიდ ჰაგეშემ“ (ამიდის მე-2 კურთხევაში)';

  const isBarechAleinuWinter =
    !isSummerSeason && !(mKey === 'tishrei' && dNum < 7);
  const seasonBlessingHe = isBarechAleinuWinter
    ? 'בָּרֵךְ עָלֵינוּ (וְתֵן טַל וּמָטָר לִבְרָכָה)'
    : 'בָּרְכֵנוּ ה׳ אֱלֹהֵינוּ (תֵּן בְּרָכָה)';
  const seasonBlessingKa = isBarechAleinuWinter
    ? 'მე-9 კურთხევა: „ბარეხ ალეინუ — ვეთენ ტალ უმატარ ლივრახა“'
    : 'მე-9 კურთხევა: „ბარხენუ — თენ ბრახა“';

  // Determine whether Tachanun is recited today
  let isTachanunRecited = true;
  let tachanunReasonKa = 'დღეს იკითხება სრული თახანუნი, ვიდუი და 13 მიდოთი (გვ. 200).';
  if (isShabbat) {
    isTachanunRecited = false;
    tachanunReasonKa = 'შაბათ კოდეშზე თახანუნი და ნეფილათ აპაიმი არ იკითხება.';
  } else if (isRoshChodesh) {
    isTachanunRecited = false;
    tachanunReasonKa = 'როშ ხოდეშზე თახანუნი არ იკითხება.';
  } else if (mKey === 'nisan') {
    isTachanunRecited = false;
    tachanunReasonKa = 'ნისანის თვის ყველა დღეს თახანუნი არ იკითხება.';
  } else if (mKey === 'tishrei' && dNum >= 9) {
    isTachanunRecited = false;
    tachanunReasonKa = 'ერევ იომ კიფურიდან თიშრეის ბოლომდე თახანუნი არ იკითხება.';
  } else if (hasHoliday) {
    isTachanunRecited = false;
    tachanunReasonKa = `დღესასწაულის გამო (${calData.events[0]?.titleKa || 'მოედი'}) თახანუნი არ იკითხება.`;
  }

  // Determine if Sefer Torah is read today
  const isMonOrThu = weekdayIndex === 1 || weekdayIndex === 4;
  const isTorahReadingDay =
    isShabbat || isRoshChodesh || hasHoliday || hasFast || isMonOrThu;
  let torahReadingReasonKa = 'დღეს სეფერ თორა არ გამოაბრძანება.';
  if (isShabbat) {
    torahReadingReasonKa = 'შაბათ კოდეში: კვირის ფარაშის კითხვა (7 ალია + მაფტირი და ჰაფტარა, გვ. 217).';
  } else if (isRoshChodesh) {
    torahReadingReasonKa = 'როშ ხოდეში: სეფერ თორის კითხვა (4 ალია — „უვერაშეი ხოდშეიხემ“, გვ. 217).';
  } else if (hasHoliday) {
    torahReadingReasonKa = 'სადღესასწაულო თორის კითხვა და ფეთიხათ ჰაარონი (გვ. 217).';
  } else if (hasFast) {
    torahReadingReasonKa = 'მარხვის დღე: იკითხება „ვაიხალ მოშე“ შახარითსა და მინხაზე (გვ. 217).';
  } else if (isMonOrThu) {
    torahReadingReasonKa = `${
      weekdayIndex === 1 ? 'ორშაბათი' : 'ხუთშაბათი'
    }: კვირის ფარაშის დასაწყისის კითხვა (3 ალია — ქოჰენი, ლევი, ისრაელი, გვ. 217).`;
  }

  const specialInsertions: DailyHalakhicPrayerStatus['specialInsertions'] = [
    {
      id: 'ins-season-2',
      titleHe: seasonDewRainHe,
      titleKa: seasonDewRainKa,
      detailKa: 'წარმოითქმება ამიდის მე-2 კურთხევაში („ათა გიბორ“).',
      targetPrayerId: 'amidah-shacharit-intro',
    },
    {
      id: 'ins-season-9',
      titleHe: seasonBlessingHe,
      titleKa: seasonBlessingKa,
      detailKa: 'წარმოითქმება ამიდის მე-9 კურთხევაში (გვ. 166).',
      targetPrayerId: 'amidah-middle-blessings',
    },
  ];

  if (isRoshChodesh) {
    specialInsertions.push({
      id: 'ins-yaaleh-veyavo',
      titleHe: 'יַעֲלֶה וְיָבֹא • הַלֵּל וּמוּסָף רֹאשׁ חֹדֶשׁ',
      titleKa: 'როშ ხოდეში: ემატება „იაალე ვეიავო“, ჰალელი და მუსაფი',
      detailKa: 'არ დაგავიწყდეთ „იაალე ვეიავოს“ ჩართვა ამიდაში („რecე“-ში) და ბირქათ ჰამაზონში!',
      targetPrayerId: 'amidah-middle-blessings',
    });
  }

  if (isShabbat || isErevShabbat) {
    specialInsertions.push({
      id: 'ins-shabbat',
      titleHe: isShabbat ? 'תְּפִלּוֹת שַׁבָּת קֹדֶשׁ • רְצֵה וְהַחֲלִיצֵנוּ' : 'קַבָּלַת שַׁבָּת • לְכָה דוֹדִי',
      titleKa: isShabbat
        ? 'შაბათის ამიდა (7 კურთხევა), კიდუში და „რecე ვეჰახალიცენუ“ ბირქათ ჰამაზონში'
        : 'პარასკევი საღამო: კაბალათ შაბათი და „ლეხა დოდი“',
      detailKa: 'შაბათზე არ იდება თეფილინი და არ იკითხება თახანუნი.',
      targetPrayerId: 'shabbat-kodesh-seder',
    });
  }

  if (isMonOrThu && !isShabbat && !hasHoliday && isTachanunRecited) {
    specialInsertions.push({
      id: 'ins-mon-thu',
      titleHe: 'וְהוּא רַחוּם • הוֹצָאַת סֵפֶר תּוֹרָה (ב׳ וה׳)',
      titleKa: 'ორშაბათი/ხუთშაბათი: გაფართოებული თახანუნი და სეფერ თორის გამო봉ება (3 ალია)',
      detailKa: 'ამიდის შემდეგ იკითხება ვიდუი, 13 მიდოთი და იხსნება არონ ჰაკოდეში (გვ. 217).',
      targetPrayerId: 'hotzaat-sefer-torah',
    });
  }

  const shacharitSteps: DailyPrayerStep[] = [
    {
      stepId: 'sh-1',
      order: 1,
      prayerSectionId: 'modeh-ani-netilat',
      titleHe: 'מודה אני ונטילת ידיים שחרית',
      titleKa: 'მოდე ანი და ხელების დაბანა',
      noteHe: 'מיד בהקיץ משנתו קודם שיוריד רגליו',
      noteKa: 'გაღვიძებისთანავე და დილის ნეტილათ იადაიმი',
      kavanatPage: 29,
      classicPage: 10,
      status: 'required',
    },
    {
      stepId: 'sh-2',
      order: 2,
      prayerSectionId: 'asher-yatzar-torah',
      titleHe: 'אשר יצר • ברכות התורה • אלהי נשמה',
      titleKa: 'აშერ იაცარ, თორის კურთხევები და ელოჰაი ნეშამა',
      noteHe: 'ברכות התורה וברכת כהנים קודם לימוד',
      noteKa: 'სავალდებულოა ნებისმიერი თორის სიტყვის წარმოთქმამდე',
      kavanatPage: 30,
      classicPage: 15,
      status: 'required',
    },
    {
      stepId: 'sh-3',
      order: 3,
      prayerSectionId: 'birkot-hashachar',
      titleHe: 'סדר ברכות השחר השלם',
      titleKa: 'ბირქოთ ჰაშახარ — 18 კურთხევა',
      noteHe: 'הנותן לשכוי בינה עד המעביר חבלי שינה',
      noteKa: 'დილის 18 სამადლობელი კურთხევა ქავანით',
      kavanatPage: 31,
      classicPage: 40,
      status: 'required',
    },
    {
      stepId: 'sh-4',
      order: 4,
      prayerSectionId: 'tallit-tefillin',
      titleHe: isShabbat ? 'עטיפת טלית של שבת (ללא תפילין)' : 'עטיפת טלית והנחת תפילין',
      titleKa: isShabbat
        ? 'ტალითით შემოსვა (შაბათზე თეფილინი არ იდება)'
        : 'ტალითით შემოსვა და თეფილინის დადება',
      noteHe: isShabbat ? 'שבת קודש היא עצמה אות — אין מניחין תפילין' : 'מעלין בקודש: טלית ואח״כ תפילין',
      noteKa: isShabbat
        ? 'შაბათი თავად არის „ოთ“ (ნიშანი), ამიტომ იცვამენ მხოლოდ ტალითს'
        : 'ჯერ ტალითი, შემდეგ ხელისა და თავის თეფილინი (გვ. 71–72)',
      kavanatPage: 71,
      classicPage: 60,
      status: isShabbat ? 'special-addition' : 'required',
    },
    {
      stepId: 'sh-5',
      order: 5,
      prayerSectionId: 'beit-haknesset-korbanot',
      titleHe: 'פרשת העקידה • הקורבנות ופיטום הקטורת',
      titleKa: 'აკედა, კორბანოთი და ფიტუმ ჰაკეტორეთი',
      noteHe: 'קריאת הקטורת מתוך הכתב בסידור מילה במילה',
      noteKa: 'კეტორეთის კითხვა სიდურიდან სიტყვასიტყვით',
      kavanatPage: 78,
      classicPage: 60,
      status: 'required',
    },
    {
      stepId: 'sh-6',
      order: 6,
      prayerSectionId: 'hodu-baruch-sheamar',
      titleHe: 'הודו לה׳ • ברוך שאמר • פסוקי דזמרה',
      titleKa: 'ჰოდუ, ბარუხ შეამარ და ფესუკეი დეზიმრა',
      noteHe: 'אין להפסיק בדיבור מברוך שאמר עד אחר ישתבח',
      noteKa: 'საუბრით შეწყვეტა აკრძალულია იშთაბახის ბოლომდე',
      kavanatPage: 122,
      classicPage: 80,
      status: 'required',
    },
    {
      stepId: 'sh-7',
      order: 7,
      prayerSectionId: 'ashrei-az-yashir-yishtabach',
      titleHe: 'אשרי (פותח את ידך) • אז ישיר • ישתבח',
      titleKa: 'აშრეი, პოთეახ ეთ იადეხა, აზ იაშირ და იშთაბახი',
      noteHe: 'חובה לכוון בפסוק פותח את ידך ומשביע לכל חי רצון',
      noteKa: 'სავალდებულოა ქავანა მუხლზე „პოთეახ ეთ იადეხა“',
      kavanatPage: 130,
      classicPage: 80,
      status: 'required',
    },
    {
      stepId: 'sh-8',
      order: 8,
      prayerSectionId: 'yotzer-or-kriat-shema',
      titleHe: 'יוצר אור • אהבת עולם • קריאת שמע',
      titleKa: 'იოცერ ორ, აჰავათ ოლამ და კრიათ შმა',
      noteHe: 'קבלת עול מלכות שמים בשמע ישראל וברוך שם כבוד מלכותו',
      noteKa: 'ცათა სასუფევლის უღლის მიღება „შმა ისრაელში“',
      kavanatPage: 144,
      classicPage: 100,
      status: 'required',
    },
    {
      stepId: 'sh-9',
      order: 9,
      prayerSectionId: 'amidah-shacharit-intro',
      titleHe: `תפילת העמידה (שמו״ע) • ${seasonDewRainHe}`,
      titleKa: `ამიდა (შმონე ესრე) • ${isSummerSeason ? 'მორიდ ჰატალ' : 'მაშივ ჰარუახ'}`,
      noteHe: `היום אומרים בגבורות: ${seasonDewRainHe} • ובברכת השנים: ${seasonBlessingHe}`,
      noteKa: `${seasonDewRainKa} • ${seasonBlessingKa}`,
      kavanatPage: 164,
      classicPage: 130,
      status: 'required',
    },
    {
      stepId: 'sh-10',
      order: 10,
      prayerSectionId: 'tachanun-vidui-13-middot',
      titleHe: 'תחנון • וידוי וי״ג מידות • נפילת אפים',
      titleKa: 'თახანუნი, ვიდუი და 13 მიდოთი',
      noteHe: isTachanunRecited
        ? 'אומרים וידוי, י״ג מידות ונפילת אפים'
        : 'היום אין אומרים תחנון ונפילת אפים',
      noteKa: tachanunReasonKa,
      kavanatPage: 200,
      classicPage: 160,
      status: isTachanunRecited ? 'required' : 'omitted-today',
      omittedReasonKa: isTachanunRecited ? undefined : tachanunReasonKa,
    },
    {
      stepId: 'sh-11',
      order: 11,
      prayerSectionId: 'hotzaat-sefer-torah',
      titleHe: 'פתיחת הארון והוצאת ספר תורה • בריך שמיה',
      titleKa: 'ფეთიხათ ჰაარონი და სეფერ თორის კითხვა',
      noteHe: isTorahReadingDay
        ? 'היום מוציאין ספר תורה וקורין בפרשה'
        : 'היום אין הוצאת ספר תורה',
      noteKa: torahReadingReasonKa,
      kavanatPage: 217,
      classicPage: 160,
      status: isTorahReadingDay ? 'special-addition' : 'omitted-today',
      omittedReasonKa: isTorahReadingDay ? undefined : torahReadingReasonKa,
    },
    {
      stepId: 'sh-12',
      order: 12,
      prayerSectionId: 'ashrei-uva-letzion-aleinu',
      titleHe: 'אשרי • ובא לציון • שיר של יום • עלינו לשבח',
      titleKa: 'აშრეი, უვა ლეციონ, დღის ფსალმუნი და ალეინუ',
      noteHe: 'קדושה דסידרא בובא לציון ועלינו לשבח מעומד',
      noteKa: 'შახარითის დასკვნა — უვა ლეციონი და ალეინუ ლეშაბეახ',
      kavanatPage: 230,
      classicPage: 200,
      status: 'required',
    },
  ];

  const minchaSteps: DailyPrayerStep[] = [
    {
      stepId: 'mn-1',
      order: 1,
      prayerSectionId: 'beit-haknesset-korbanot',
      titleHe: 'קורבנות מנחה ופיטום הקטורת קודם מנחה',
      titleKa: 'მინხის კორბანოთი და ფიტუმ ჰაკეტორეთი',
      noteHe: 'אמירת הקטורת ופרשת התמיד קודם אשרי של מנחה',
      noteKa: 'კეტორეთისა და თამიდის კითხვა მინხის წინ',
      kavanatPage: 78,
      classicPage: 60,
      status: 'required',
    },
    {
      stepId: 'mn-2',
      order: 2,
      prayerSectionId: 'ashrei-az-yashir-yishtabach',
      titleHe: 'אשרי יושבי ביתך • וחצי קדיש',
      titleKa: 'აშრეი იოშვეი ბეითეხა და ხაცი კადიში',
      noteHe: 'כוונת פותח את ידך בתפילת המנחה',
      noteKa: '145-ე ფსალმუნი („აშრეი“) მინხის ამიდის წინ',
      kavanatPage: 130,
      classicPage: 80,
      status: 'required',
    },
    {
      stepId: 'mn-3',
      order: 3,
      prayerSectionId: 'amidah-shacharit-intro',
      titleHe: `שמונה עשרה של מנחה • ${seasonDewRainHe}`,
      titleKa: 'მინხის ამიდა (შმონე ესრე)',
      noteHe: 'לעולם יהא אדם זהיר בתפילת המנחה שהרי אליהו נענה במנחה',
      noteKa: `${seasonDewRainKa} • ${seasonBlessingKa}`,
      kavanatPage: 164,
      classicPage: 130,
      status: 'required',
    },
    {
      stepId: 'mn-4',
      order: 4,
      prayerSectionId: 'tachanun-vidui-13-middot',
      titleHe: 'תחנון ונפילת אפים של מנחה',
      titleKa: 'მინხის თახანუნი და ნეფილათ აპაიმი',
      noteHe: isTachanunRecited && !isErevShabbat
        ? 'וידוי, י״ג מידות ונפילת אפים'
        : 'אין אומרים תחנון במנחה היום',
      noteKa:
        isTachanunRecited && !isErevShabbat
          ? 'მინხის თახანუნი და 13 მიდოთი (გვ. 200)'
          : 'დღეს მინხაზე თახანუნი არ იკითხება.',
      kavanatPage: 200,
      classicPage: 160,
      status: isTachanunRecited && !isErevShabbat ? 'required' : 'omitted-today',
      omittedReasonKa:
        isTachanunRecited && !isErevShabbat
          ? undefined
          : 'დღეს მინხაზე თახანუნი არ იკითხება.',
    },
    {
      stepId: 'mn-5',
      order: 5,
      prayerSectionId: 'ashrei-uva-letzion-aleinu',
      titleHe: 'למנצח בנגינות • קדיש תתקבל • עלינו לשבח',
      titleKa: 'ლამნაცეახ (67-ე ფსალმუნი), კადიში და ალეინუ',
      noteHe: 'סיום תפילת המנחה בעלינו לשבח',
      noteKa: 'მინხის დასკვნა „ალეინუ ლეშაბეახით“',
      kavanatPage: 230,
      classicPage: 200,
      status: 'required',
    },
  ];

  const maarivSteps: DailyPrayerStep[] = [
    ...(isErevShabbat || isShabbat
      ? [
          {
            stepId: 'ar-0',
            order: 1,
            prayerSectionId: 'shabbat-kodesh-seder',
            titleHe: 'קבלת שבת • לכה דודי • מזמור שיר ליום השבת',
            titleKa: 'კაბალათ შაბათი და ლეხა დოდი',
            noteHe: 'בואי בשלום עטרת בעלה',
            noteKa: 'შაბათის დედოფლის მიღება საღამოს ლოცვის წინ',
            kavanatPage: 230,
            classicPage: 200,
            status: 'special-addition' as const,
          },
        ]
      : []),
    {
      stepId: 'ar-1',
      order: isErevShabbat || isShabbat ? 2 : 1,
      prayerSectionId: 'mincha-arvit-seder',
      titleHe: 'והוא רחום • ברכו • קריאת שמע של ערבית והשכיבנו',
      titleKa: 'ვეჰუ რახუმ, ბარხუ, არვითის კრიათ შმა და ჰაშკივენუ',
      noteHe: 'מעריב ערבים, אהבת עולם, שמע ישראל, אמת ואמונה והשכיבנו',
      noteKa: 'საღამოს კრიათ შმა და მისი ოთხი კურთხევა (გვ. 200)',
      kavanatPage: 200,
      classicPage: 160,
      status: 'required',
    },
    {
      stepId: 'ar-2',
      order: isErevShabbat || isShabbat ? 3 : 2,
      prayerSectionId: 'amidah-shacharit-intro',
      titleHe: `שמונה עשרה של ערבית (בחשאי) • ${seasonDewRainHe}`,
      titleKa: 'არვითის ამიდა (შმონე ესრე)',
      noteHe: `היום מזכירים: ${seasonDewRainHe} • ${seasonBlessingHe}`,
      noteKa: `${seasonDewRainKa} • ${seasonBlessingKa}`,
      kavanatPage: 164,
      classicPage: 130,
      status: 'required',
    },
    {
      stepId: 'ar-3',
      order: isErevShabbat || isShabbat ? 4 : 3,
      prayerSectionId: 'ashrei-uva-letzion-aleinu',
      titleHe: 'קדיש תתקבל • ברכו • עלינו לשבח',
      titleKa: 'კადიშ თითკაბელი და ალეინუ ლეშაბეახ',
      noteHe: 'עלינו לשבח מעומד ובכוונה בסיום ערבית',
      noteKa: 'არვითის დასკვნა „ალეინუ ლეშაბეახით“',
      kavanatPage: 230,
      classicPage: 200,
      status: 'required',
    },
    {
      stepId: 'ar-4',
      order: isErevShabbat || isShabbat ? 5 : 4,
      prayerSectionId: 'mincha-arvit-seder',
      titleHe: 'סדר קריאת שמע על המיטה • ברכת המפיל',
      titleKa: 'ძილისწინა კრიათ შმა და „ჰამაფილის“ კურთხევა',
      noteHe: 'מחילת כולם, שמע ישראל וברכת המפיל חבלי שינה',
      noteKa: 'ძილის წინ მიტევების ლოცვა, შმა და ჰამაფილი',
      kavanatPage: 200,
      classicPage: 160,
      status: 'required',
    },
  ];

  const birkatSteps: DailyPrayerStep[] = [
    {
      stepId: 'bh-1',
      order: 1,
      prayerSectionId: 'birkat-hamazon-berakhot',
      titleHe: 'סדר ברכת המזון השלם (ד׳ ברכות)',
      titleKa: 'ბირქათ ჰამაზონი — პურის ტრაპეზის შემდგომი 4 კურთხევა',
      noteHe: isShabbat
        ? 'היום מוסיפין רצה והחליצנו בברכת בונה ירושלים'
        : isRoshChodesh
          ? 'היום מוסיפין יעלה ויבוא בברכת בונה ירושלים'
          : 'הזן את הכל • נודה לך • בונה ירושלים • הטוב והמטיב',
      noteKa: isShabbat
        ? 'შაბათზე ემატება „რecე ვეჰახალიცენუ“ მე-3 კურთხევაში!'
        : isRoshChodesh
          ? 'როშ ხოდეშზე ემატება „იაალე ვეიავო“ მე-3 კურთხევაში!'
          : 'ოთხივე კურთხევა იკითხება მჯდომარე მდგომარეობაში სიდურიდან (გვ. 250).',
      kavanatPage: 250,
      classicPage: 200,
      status: 'required',
    },
    {
      stepId: 'bh-2',
      order: 2,
      prayerSectionId: 'asher-yatzar-torah',
      titleHe: 'ברכת אשר יצר בכוונת הלב',
      titleKa: 'აშერ იაცარ — სხეულის ჯანმრთელობის კურთხევა',
      noteHe: 'רופא כל בשר ומפליא לעשות',
      noteKa: 'დღის განმავლობაში წარმოსათქმელი უმნიშვნელოვანესი კურთხევა (გვ. 30)',
      kavanatPage: 30,
      classicPage: 15,
      status: 'required',
    },
  ];

  return {
    date,
    hebrewInfo,
    events: calData.events,
    weekdayIndex,
    weekdayHe: weekday.he,
    weekdayKa: weekday.ka,
    isShabbat,
    isErevShabbat,
    isRoshChodesh,
    isTorahReadingDay,
    torahReadingReasonKa,
    isTachanunRecited,
    tachanunReasonKa,
    seasonDewRainHe,
    seasonDewRainKa,
    seasonBlessingHe,
    seasonBlessingKa,
    specialInsertions,
    recommendedService: getRecommendedPrayerServiceByHour(date),
    services: {
      shacharit: {
        id: 'shacharit',
        nameHe: 'תפילת שחרית',
        nameKa: 'შახარითი (დილის ლოცვა)',
        timeRangeKa: '04:30 – 12:00',
        steps: shacharitSteps,
      },
      mincha: {
        id: 'mincha',
        nameHe: 'תפילת מנחה',
        nameKa: 'მინხა (შუადღის ლოცვა)',
        timeRangeKa: '12:30 – 18:15',
        steps: minchaSteps,
      },
      maariv: {
        id: 'maariv',
        nameHe: 'תפילת ערבית (מעריב)',
        nameKa: 'არვითი / მაარივი (საღამოს ლოცვა)',
        timeRangeKa: '18:15 – 04:00',
        steps: maarivSteps,
      },
      'birkat-hamazon': {
        id: 'birkat-hamazon',
        nameHe: 'ברכת המזון וברכות',
        nameKa: 'ბირქათ ჰამაზონი და კურთხევები',
        timeRangeKa: 'მთელი დღე',
        steps: birkatSteps,
      },
    },
  };
}

export interface NusachMaqamMeta {
  id: NusachMaqamId;
  nameHe: string;
  nameKa: string;
  subtitleKa: string;
  scaleHz: number[]; // Traditional modal frequencies in Hz
  droneHz: number;
}

export const NUSACH_MAQAM_OPTIONS: NusachMaqamMeta[] = [
  {
    id: 'yerushalmi-rast',
    nameHe: 'נוסח ירושלמי • מקאם רסט (Rast)',
    nameKa: 'იერუსალიმური ნუსახი • მაკამ რასტი',
    subtitleKa: 'შახარითის, კურთხევებისა და კრიათ შმას საზეიმო ტრადიციული ჰანგი',
    // C4, D4, E4-quarter-flat (~320Hz), F4, G4, A4, Bb4 (~466Hz), C5
    scaleHz: [261.63, 293.66, 320.0, 349.23, 392.0, 440.0, 466.16, 523.25],
    droneHz: 130.81,
  },
  {
    id: 'sephardi-hijaz',
    nameHe: 'נוסח ספרדי • מקאם חיג׳אז (Hijaz)',
    nameKa: 'სეფარადული ქავანა • მაკამ ხიჯაზი',
    subtitleKa: 'ამიდას (შმონე ესრეს), 13 მიდოთისა და თახანუნის ღრმა ვედრების ჰანგი',
    // D4, Eb4, F#4, G4, A4, Bb4, C5, D5 (Hijaz intervals)
    scaleHz: [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33],
    droneHz: 146.83,
  },
  {
    id: 'shabbat-bayat',
    nameHe: 'נוסח שבת והלל • מקאם ביאת (Bayat)',
    nameKa: 'შაბათისა და ჰალელის • მაკამ ბაიათი',
    subtitleKa: 'ლეხა დოდის, ფესუკეი დეზიმრას და ბირქათ ჰამაზონის თბილი მელოდია',
    // D4, E4-half-flat (~320Hz), F4, G4, A4, Bb4, C5, D5
    scaleHz: [293.66, 320.0, 349.23, 392.0, 440.0, 466.16, 523.25, 587.33],
    droneHz: 146.83,
  },
];

// Traditional cantorial phrase contour (scale degree indices 0..7)
const CANTORIAL_CONTOUR = [0, 2, 3, 4, 3, 2, 4, 5, 4, 3, 2, 1, 2, 0];

/**
 * Plays a warm plucked Kinnor/Oud + soft Cantorial harmonic note in the chosen Maqam scale
 * using Web Audio API so every word/phrase of the prayer has an authentic traditional melody.
 */
export function playCantorialMaqamNote(
  audioCtx: AudioContext,
  maqam: NusachMaqamMeta,
  stepIndex: number,
  durationSec = 0.55,
  isCadenceEnd = false
): void {
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const scaleIdx = isCadenceEnd
      ? 0
      : CANTORIAL_CONTOUR[stepIndex % CANTORIAL_CONTOUR.length] % maqam.scaleHz.length;
    const freq = maqam.scaleHz[scaleIdx] || 293.66;

    // 1. Main warm cantorial triangle/sine voice with gentle vibrato
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle cantorial vibrato (5.2 Hz)
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(5.2, now);
    lfoGain.gain.setValueAtTime(2.2, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Warm octave harmonic (Kinnor resonance)
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCadenceEnd ? maqam.droneHz : freq * 0.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1350, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.045, now + durationSec * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    subOsc.start(now);
    lfo.start(now);

    osc.stop(now + durationSec + 0.02);
    subOsc.stop(now + durationSec + 0.02);
    lfo.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio context restriction errors
  }
}

/**
 * Strips bracketed Kavanot annotations (e.g. [אדון הכל היה הוה ויהיה] or [א]) so vocal TTS chants the pure Hebrew prayer words smoothly.
 */
export function cleanHebrewPrayerForVocalChant(rawHe: string): string {
  return rawHe
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[:•—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface PrayerAudioVerseItem {
  id: string;
  sectionTagHe: string;
  sectionTagKa: string;
  dibburHe: string;
  fullHebrew: string;
  chantHebrew: string;
  words: string[];
  translationKa: string;
  explanationKa: string;
}

export function buildAudioVersesForSiddurSection(
  section: SiddurPrayerSectionMeta,
  editionId: SiddurEditionId
): PrayerAudioVerseItem[] {
  const items: PrayerAudioVerseItem[] = [];

  section.mishnahPrayers.forEach((p, idx) => {
    const chantHe = cleanHebrewPrayerForVocalChant(p.hebrew);
    items.push({
      id: `${section.id}-prayer-${idx}`,
      sectionTagHe: 'נוסח התפילה העיקרי',
      sectionTagKa: 'ძირითადი ლოცვა',
      dibburHe: p.dibburHe,
      fullHebrew: p.hebrew,
      chantHebrew: chantHe,
      words: p.hebrew.split(/\s+/).filter(Boolean),
      translationKa: p.translationKa,
      explanationKa: p.explanationKa,
    });
  });

  section.gemaraKavanot.forEach((k, idx) => {
    const chantHe = cleanHebrewPrayerForVocalChant(k.hebrew);
    items.push({
      id: `${section.id}-kavana-${idx}`,
      sectionTagHe: editionId === 'kavanat-halev' ? 'כוונת הלב ומקור הש״ס' : 'עיון תפילה ומקור הש״ס',
      sectionTagKa: 'ქავანა და წყარო',
      dibburHe: k.dibburHe,
      fullHebrew: k.hebrew,
      chantHebrew: chantHe,
      words: k.hebrew.split(/\s+/).filter(Boolean),
      translationKa: k.translationKa,
      explanationKa: k.explanationKa,
    });
  });

  section.rashiKavanatHaLev.forEach((r, idx) => {
    const chantHe = cleanHebrewPrayerForVocalChant(r.hebrew);
    items.push({
      id: `${section.id}-perush-${idx}`,
      sectionTagHe: 'פירוש כוונת הלב',
      sectionTagKa: 'ფირუშ ქავანათ ჰალევი',
      dibburHe: r.dibburHe,
      fullHebrew: r.hebrew,
      chantHebrew: chantHe,
      words: r.hebrew.split(/\s+/).filter(Boolean),
      translationKa: r.translationKa,
      explanationKa: r.explanationKa,
    });
  });

  return items;
}
