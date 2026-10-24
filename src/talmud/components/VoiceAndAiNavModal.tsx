// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Compass,
  ArrowRight,
  Loader2,
  Radio,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { DafPageData } from '../types/talmud';
import { TRACTATES, toHebrewDafNumber } from '../data/tractates';
import { SACRED_REALMS, getBooksForRealm, SacredRealmId } from '../data/tanakhAndHalakhaData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';
import { getBackendUrl } from '../utils/georgianTranslator';

interface VoiceAndAiNavModalProps {
  isOpen: boolean;
  initialTab: 'voice' | 'ai' | 'gemini';
  onClose: () => void;
  onNavigateToDaf: (
    tractateId: string,
    dafId: string,
    sectionId?: string,
    highlightQuery?: string
  ) => void;
  onNavigateToRealm?: (
    realmId: SacredRealmId,
    bookId?: string,
    chapter?: number,
    highlightQuery?: string
  ) => void;
  onPrevAmud: () => void;
  onNextAmud: () => void;
  currentDafData: DafPageData;
  isDark: boolean;
}

interface RelatedGlobalLocation {
  realmId?: SacredRealmId;
  bookId?: string;
  chapter?: number;
  tractateId: string;
  dafId: string;
  labelKa: string;
  labelHe: string;
}

interface AiNavigationMatch {
  id: string;
  tractateId: string;
  dafId: string;
  section: string;
  sectionLabelKa: string;
  realmId?: SacredRealmId;
  bookId?: string;
  chapter?: number;
  titleHe: string;
  titleKa: string;
  explanationKa: string;
  quotedSnippetHe: string;
  relatedLocations: RelatedGlobalLocation[];
}

interface GeminiCitedSource {
  id: string;
  titleKa: string;
  titleHe: string;
  realmId?: SacredRealmId;
  bookId?: string;
  chapter?: number;
  tractateId?: string;
  dafId?: string;
  section?: string;
  quotedSnippetHe: string;
  explanationKa: string;
}

interface GeminiAskResponse {
  question: string;
  answerKa: string;
  answerHe?: string;
  keyPointsKa?: string[];
  halachaTakeawayKa?: string;
  sources: GeminiCitedSource[];
  webSources?: { title: string; uri: string }[];
}

const VOICE_COMMAND_OPTIONS: SelectOption[] = [
  {
    value: 'nav:Taanit:2a',
    badgeHe: 'תענית ב.',
    label: 'გადადი თაანით 2a-ზე (מאימתי מזכירין גבורות גשמים)',
    sublabel: 'კლასიკური ვილნის გვერდი — წვიმის ძლიერების ხსენება',
  },
  {
    value: 'nav:Berakhot:2a',
    badgeHe: 'ברכות ב.',
    label: 'გადადი ბერახოთ 2a-ზე (מאימתי קורין את שמע)',
    sublabel: 'საღამოს კრიათ შმას დრო და ქოჰენების თრუმა',
  },
  {
    value: 'nav:Shabbat:2a',
    badgeHe: 'שבת ב.',
    label: 'გადადი შაბათ 2a-ზე (יציאות השבת)',
    sublabel: 'შაბათის კანონები და ჰოცაა',
  },
  {
    value: 'nav:Bava_Kamma:2a',
    badgeHe: 'בבא קמא ב.',
    label: 'გადადი ბაბა ქამა 2a-ზე (ארבעה אבות נזיקין)',
    sublabel: 'ზიანის ოთხი ძირითადი კატეგორია',
  },
  {
    value: 'nav:Pesachim:2a',
    badgeHe: 'פסחים ב.',
    label: 'გადადი ფესახიმ 2a-ზე (אור לארבעה עשר)',
    sublabel: 'ხამეცის ძებნა ფესახის წინ',
  },
  {
    value: 'scroll:daf-section-mishnah',
    badgeHe: 'משנה',
    label: 'აჩვენე მიშნის სექცია (משנה / מתני׳)',
    sublabel: 'გადასვლა მიმდინარე გვერდის მიშნის ტექსტზე',
  },
  {
    value: 'scroll:daf-section-gemara',
    badgeHe: 'גמרא',
    label: 'აჩვენე გემარის სექცია (גמרא / גמ׳)',
    sublabel: 'გადასვლა მიმდინარე გვერდის გემარის ტექსტზე',
  },
  {
    value: 'scroll:daf-section-rashi',
    badgeHe: 'רש״י',
    label: 'აჩვენე რაშის კომენტარი (רש״י)',
    sublabel: 'გადასვლა რაშის სვეტზე',
  },
  {
    value: 'scroll:daf-section-tosafot',
    badgeHe: 'תוספות',
    label: 'აჩვენე თოსაფოთის სექცია (תוספות)',
    sublabel: 'გადასვლა თოსაფოთის სვეტზე',
  },
  {
    value: 'read:mishnah',
    badgeHe: 'הקראת משנה',
    label: 'წაიკითხე მიშნა ხმამაღლა (Audio Mishnah)',
    sublabel: 'წაიკითხავს მიმდინარე გვერდის მიშნის ებრაულ ტექსტს',
  },
  {
    value: 'read:gemara',
    badgeHe: 'הקראת גמרא',
    label: 'წაიკითხე გემარა ხმამაღლა (Audio Gemara)',
    sublabel: 'წაიკითხავს მიმდინარე გვერდის გემარის ტექსტს',
  },
  {
    value: 'action:next',
    badgeHe: 'דף הבא',
    label: 'შემდეგი დაფი / ამუდი (Next Daf)',
    sublabel: 'გადასვლა მომდევნო გვერდზე',
  },
  {
    value: 'action:prev',
    badgeHe: 'דף הקודם',
    label: 'წინა დაფი / ამუდი (Previous Daf)',
    sublabel: 'დაბრუნება წინა გვერდზე',
  },
];

// Global Search Scope Dropdown Options — First and Default Option is "ყველგან" (Everywhere across all Sacred Realms)
const AI_SEARCH_SCOPE_OPTIONS: SelectOption[] = [
  {
    value: 'all',
    badgeHe: 'כל הארון',
    label: 'ყველგან (თორა, თანახი, მიშნა, თალმუდი, რამბამი, შულხან არუხი, ჰალახა)',
    sublabel: 'გლობალური ძიება მთელ ებრაულ ბიბლიოთეკაში — ყველა წიგნსა და კომენტარში',
  },
  {
    value: 'realm:torah',
    badgeHe: 'תורה',
    label: 'მხოლოდ თორაში (ხუმაში • რაში • ონკელოსი)',
    sublabel: 'ბერეშითი, შმოთი, ვაიკრა, ბამიდბარი, დევარიმი',
  },
  {
    value: 'realm:neviim',
    badgeHe: 'נביאים',
    label: 'მხოლოდ ნევიიმში (წინასწარმეტყველნი)',
    sublabel: 'იეჰოშუა, შოფტიმ, შმუელი, მელახიმ, იეშაიაჰუ, ირმიაჰუ, იეხეზკელი',
  },
  {
    value: 'realm:ketuvim',
    badgeHe: 'כתובים',
    label: 'მხოლოდ ქეთუვიმში (ფსალმუნები • იგავნი • მეგილოთ)',
    sublabel: 'თეჰილიმი, მიშლეი, იოვი, შირ ჰაშირიმი, რუთი, ეsteri, დანიელი',
  },
  {
    value: 'scope:mishnayot',
    badgeHe: 'משנה',
    label: 'მხოლოდ მიშნაში (ბარტენურა და კეჰათი)',
    sublabel: 'ექვსივე სედერის მიშნა ბარტენურასა და კეჰათის განმარტებებით',
  },
  {
    value: 'scope:gemara',
    badgeHe: 'תלמוד בבלי',
    label: 'მხოლოდ თალმუდ ბავლიში (გემარა • რაში • თოსაფოთი)',
    sublabel: 'ეძებს გემარის ძირითად ტექსტსა და სუგიებში',
  },
  {
    value: 'realm:rambam',
    badgeHe: 'רמב״ם',
    label: 'მხოლოდ რამბამში (მიშნე თორა • 14 წიგნი)',
    sublabel: 'ჰაიად ჰახაზაკა — მადდა, აჰავა, ზმანიმ, ნაშიმ, კედუშა, ნეზიკინ...',
  },
  {
    value: 'realm:tur',
    badgeHe: 'ארבעה טורים',
    label: 'მხოლოდ არბაა ტურიმში (ტური და ბეთ იოსეფი)',
    sublabel: 'ორახ ხაიმ, იორე დეა, ევენ ჰაეზერ, ხოშენ მიშპატ',
  },
  {
    value: 'realm:shulchan-aruch',
    badgeHe: 'שולחן ערוך',
    label: 'მხოლოდ შულხან არუხში (მარან იოსეფ კარო და რამა)',
    sublabel: 'საბოლოო ჰალახური კოდექსი ოთხივე ნაწილში',
  },
  {
    value: 'realm:mishnah-berurah',
    badgeHe: 'משנה ברורה',
    label: 'მხოლოდ მიშნა ბრურაში (ხაფეც ხაიმი • აშქენაზური ჰალახა)',
    sublabel: 'ორახ ხაიმის ყოველდღიური და შაბათის კანონები',
  },
  {
    value: 'realm:sephardic-halakha',
    badgeHe: 'הלכה ספרדית',
    label: 'მხოლოდ სფარდულ ჰალახაში (იალკუტ იოსეფი • ბენ იშ ხაი • ქაფ ჰახაიმი)',
    sublabel: 'მარან ოვადია იოსეფისა და სფარდ ფოსკიმთა დადგენილებები',
  },
  {
    value: 'current-daf',
    badgeHe: 'הדף הנוכחי',
    label: 'მხოლოდ მიმდინარე დაფზე',
    sublabel: 'ეძებს ზუსტ სიტყვას ან ფრაზას ახლა გახსნილ დაფზე',
  },
  {
    value: 'scope:rashi-tosafot',
    badgeHe: 'רש״י ותוס׳',
    label: 'მხოლოდ რაშიში და თოსაფოთში',
    sublabel: 'ეძებს რაშისა და თოსაფოთის განმარტებებში',
  },
  ...TRACTATES.map((t) => ({
    value: `tractate:${t.id}`,
    badgeHe: t.nameHe,
    label: `ტრაქტატი ${t.nameKa}`,
    sublabel: `ძიება მხოლოდ ტრაქტატ „${t.nameKa}“-ში (2a–${t.lastDaf}b)`,
  })),
];

const AI_QUICK_SUGGESTIONS: { label: string; query: string }[] = [
  { label: '📜 ბერეშით 1 (სამყაროს შექმნა)', query: 'ბერეშით სამყაროს შექმნა თორა' },
  { label: '⛰️ ათი მცნება (შმოთ 20)', query: 'ათი მცნება შმოთ სინაი' },
  { label: '🎵 ფსალმუნი 23 (תהילים כ״ג)', query: 'ფსალმუნი თეჰილიმ დავითი' },
  { label: '🌧️ წვიმა (თაანით 2a)', query: 'წვიმა გვუროთ გშამიმ' },
  { label: '🕯️ ხანუქა (შაბათ 21b)', query: 'ხანუქა შაბათ 21b' },
  { label: '⚖️ შულხან არუხი / რამბამი', query: 'შულხან არუხი რამბამი ჰალახა' },
  { label: '👑 იალკუტ იოსეფი (სფარდული ჰალახა)', query: 'იალკუტ იოსეფი ოვადია სფარდული' },
];

const CURATED_AI_CORPUS: AiNavigationMatch[] = [
  {
    id: 'corpus-torah-genesis-1',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'თორა • ბერეშითი (დაბადება) თავი 1',
    realmId: 'torah',
    bookId: 'Genesis',
    chapter: 1,
    titleHe: 'ספר בראשית פרק א׳ — בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
    titleKa: 'თორა: ბერეშითი (დაბადება) თავი 1 — სამყაროს შექმნა, რაში და ონკელოსი',
    explanationKa:
      'თორის პირველი თავი — სამყაროს შექმნის ექვსი დღე და შაბათი, რაშის ფუნდამენტური კომენტარით („რაბი იცხაკმა თქვა...“) და თარგუმ ონკელოსით.',
    quotedSnippetHe:
      'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ. וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר.',
    relatedLocations: [
      { realmId: 'torah', bookId: 'Genesis', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'ბერეშითი 1', labelHe: 'בראשית א׳' },
      { realmId: 'talmud', tractateId: 'Chagigah', dafId: '12a', labelKa: 'ხაგიგა 12a — მაასე ბერეშით', labelHe: 'חגיגה יב.' },
    ],
  },
  {
    id: 'corpus-torah-exodus-20',
    tractateId: 'Shabbat',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'თორა • შმოთი (გამოსვლა) თავი 20',
    realmId: 'torah',
    bookId: 'Exodus',
    chapter: 20,
    titleHe: 'ספר שמות פרק כ׳ — עשרת הדברות (אָנֹכִי ה׳ אֱלֹהֶיךָ)',
    titleKa: 'თორა: შმოთი (გამოსვლა) თავი 20 — ათი მცნება სინაის მთაზე (עשרת הדברות)',
    explanationKa:
      'სინაის მთაზე თორის გადაცემა და ათი მცნება: რწმენა, შაბათის შენახვა (זכור את יום השבת לקדשו), მშობლების პატივისცემა და ზნეობრივი კანონები.',
    quotedSnippetHe:
      'אָנֹכִי ה׳ אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם מִבֵּית עֲבָדִים. זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ.',
    relatedLocations: [
      { realmId: 'torah', bookId: 'Exodus', chapter: 20, tractateId: 'Shabbat', dafId: '2a', labelKa: 'შმოთი 20 (ათი მცნება)', labelHe: 'שמות כ׳' },
      { realmId: 'talmud', tractateId: 'Shabbat', dafId: '2a', labelKa: 'შაბათი 2a', labelHe: 'שבת ב.' },
    ],
  },
  {
    id: 'corpus-ketuvim-psalms-23',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'ქეთუვიმ • თეჰილიმ (ფსალმუნები) 23',
    realmId: 'ketuvim',
    bookId: 'Psalms',
    chapter: 23,
    titleHe: 'ספר תהילים פרק כ״ג — מִזְמוֹר לְדָוִד ה׳ רֹעִי לֹא אֶחְסָר',
    titleKa: 'ქეთუვიმი: დავითის ფსალმუნები (თეჰილიმ) თავი 23 — უფალია ჩემი მწყემსი',
    explanationKa:
      'დავით მეფის უდიდესი ფსალმუნი ღმერთზე მინდობის, სულიერი სიმშვიდისა და საღვთო მფარველობის შესახებ, რაშისა და მეცუდოთის კომენტარებით.',
    quotedSnippetHe:
      'מִזְמוֹר לְדָוִד ה׳ רֹעִי לֹא אֶחְסָר. בִּנְאוֹת דֶּשֶׁא יַרְבִּיצֵנִי עַל מֵי מְנֻחוֹת יְנַהֲלֵנִי.',
    relatedLocations: [
      { realmId: 'ketuvim', bookId: 'Psalms', chapter: 23, tractateId: 'Berakhot', dafId: '2a', labelKa: 'თეჰილიმ 23', labelHe: 'תהילים כ״ג' },
      { realmId: 'ketuvim', bookId: 'Proverbs', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'მიშლეი (იგავნი) 1', labelHe: 'משלי א׳' },
    ],
  },
  {
    id: 'corpus-rambam-yesodei-1',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'რამბამი • ჰილხოთ იესოდეი ჰათორა 1',
    realmId: 'rambam',
    bookId: 'Mishneh_Torah,_Foundations_of_the_Torah',
    chapter: 1,
    titleHe: 'רמב״ם משנה תורה • הלכות יסודי התורה פרק א׳ — יסוד היסודות ועמוד החכמות',
    titleKa: 'რამბამი (მიშნე თორა): იესოდეი ჰათორა თავი 1 — საფუძველთა საფუძველი და სიბრძნის სვეტი',
    explanationKa:
      'რამბამის ჰალახური კოდექსის გახსნა: შემოქმედის არსებობის, ერთიანობისა და უსხეულობის ფუნდამენტური მცნება, კესეფ მიშნესა და მაგიდ მიშნეს კომენტარებით.',
    quotedSnippetHe:
      'יְסוֹד הַיְסוֹדוֹת וְעַמּוּד הַחָכְמוֹת, לֵידַע שֶׁיֵּשׁ שָׁם מָצוּי רִאשׁוֹן, וְהוּא מַמְצִיא כָּל נִמְצָא.',
    relatedLocations: [
      { realmId: 'rambam', bookId: 'Mishneh_Torah,_Foundations_of_the_Torah', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'რამბამი • იესოდეი ჰათორა 1', labelHe: 'רמב״ם יסודי התורה א׳' },
      { realmId: 'shulchan-aruch', bookId: 'Shulchan_Arukh,_Orach_Chayim', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'შულხან არუხი • ორახ ხაიმ 1', labelHe: 'שו״ע או״ח א׳' },
    ],
  },
  {
    id: 'corpus-shulchan-aruch-oc-1',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'შულხან არუხი • ორახ ხაიმ სიმანი 1',
    realmId: 'shulchan-aruch',
    bookId: 'Shulchan_Arukh,_Orach_Chayim',
    chapter: 1,
    titleHe: 'שולחן ערוך אורח חיים סימן א׳ — יתגבר כארי לעמוד בבוקר לעבודת בוראו',
    titleKa: 'შულხან არუხი (ორახ ხაიმ, სიმანი 1) — ლომივით გაძლიერდეს დილით შემოქმედის სამსახურისთვის',
    explanationKa:
      'მარან რაბი იოსეფ კაროსა და რამას (რ. მოშე ისერლესის) გახსნითი კანონი: დილის ადგომის წესი და „შვიתי ჰაშემ ლენეგდი თამიდ“.',
    quotedSnippetHe:
      'יִתְגַּבֵּר כַּאֲרִי לַעֲמוֹד בַּבֹּקֶר לַעֲבוֹדַת בּוֹרְאוֹ, שֶׁיְּהֵא הוּא מְעוֹרֵר הַשַּׁחַר.',
    relatedLocations: [
      { realmId: 'shulchan-aruch', bookId: 'Shulchan_Arukh,_Orach_Chayim', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'შულხან არუხი 1', labelHe: 'שו״ע או״ח א׳' },
      { realmId: 'mishnah-berurah', bookId: 'Mishnah_Berurah_1', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'მიშნა ბრურა 1', labelHe: 'משנה ברורה א׳' },
      { realmId: 'sephardic-halakha', bookId: 'Yalkut_Yosef_OC', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'იალკუტ იოსეფი 1', labelHe: 'ילקוט יוסף א׳' },
    ],
  },
  {
    id: 'corpus-sephardic-yalkut-yosef-1',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'სფარდული ჰალახა • იალკუტ იოსეფი და ბენ იშ ხაი',
    realmId: 'sephardic-halakha',
    bookId: 'Yalkut_Yosef_OC',
    chapter: 1,
    titleHe: 'הלכה ספרדית • מרן הרב עובדיה יוסף (ילקוט יוסף) ובן איש חי וכף החיים',
    titleKa: 'სფარდული ჰალახა: მარან ოვადია იოსეფი (იალკუტ იოსეფი), ბენ იშ ხაი და ქაფ ჰახაიმი',
    explanationKa:
      'სფარდული და ქართულ-ებრაული ტრადიციის უმაღლესი ჰალახური დადგენილებები: მოდე ანის, ნეტილათ იადაიმის, კურთხევებისა და შაბათის პრაქტიკული კანონები.',
    quotedSnippetHe:
      'מרן הרב עובדיה יוסף זצ״ל: מיד כשיתעורר האדם משנתו יאמר ״מודה אני לפניך מלך חי וקיים״ בלא נטילת ידיים.',
    relatedLocations: [
      { realmId: 'sephardic-halakha', bookId: 'Yalkut_Yosef_OC', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'იალკუტ იოსეფი 1', labelHe: 'ילקוט יוסף א׳' },
      { realmId: 'tur', bookId: 'Tur,_Orach_Chaim', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'ტური • ორახ ხაიმ 1', labelHe: 'טור או״ח א׳' },
    ],
  },
  {
    id: 'corpus-shabbat-21b-chanukah',
    tractateId: 'Shabbat',
    dafId: '21b',
    section: 'daf-section-gemara',
    sectionLabelKa: 'გემარა • შაბათი 21b (ხანუქა)',
    titleHe: 'מסכת שבת דף כ״א ע״ב — מאי חנוכה? נר איש וביתו ומהדרין מן המהדרין',
    titleKa: 'ტრაქტატი შაბათი, დაფი 21b — რა არის ხანუქა? (מאי חנוכה) და სანთლების ანთების წესი',
    explanationKa:
      'ხანუქის სასწაულის ისტორია (ზეთის დოქი კოჰენ გადოლის ბეჭდით) და ბეთ შამაისა და ბეთ ჰილელის კამათი მეჰადრინ მინ ჰამეჰადრინის სანთლების რაოდენობაზე.',
    quotedSnippetHe:
      'מַאי חֲנוּכָּה? דְּתָנוּ רַבָּנַן: בְּכ״ה בְּכִסְלֵיו יוֹמֵי דַחֲנוּכָּה תְּמָנְיָא אִינּוּן, לָא לְמִסְפַּד בְּהוֹן וְלָא לְהִתְעַנּוֹת בְּהוֹן.',
    relatedLocations: [
      { tractateId: 'Shabbat', dafId: '21b', labelKa: 'შაბათი 21b — მაი ხანუქა', labelHe: 'שבת כא:' },
      { realmId: 'rambam', bookId: 'Mishneh_Torah_Megillah_and_Chanukah', chapter: 3, tractateId: 'Shabbat', dafId: '21b', labelKa: 'რამბამი • ჰილხოთ ხანუქა', labelHe: 'רמב״ם חנוכה' },
    ],
  },
  {
    id: 'corpus-taanit-2a-mishnah',
    tractateId: 'Taanit',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'მიშნა • თაანით 2a',
    titleHe: 'מסכת תענית דף ב׳ ע״א — מאימתי מזכירין גבורות גשמים',
    titleKa: 'ტრაქტატი თაანითი, დაფი 2a — წვიმის ძლიერების ხსენება (גבורות גשמים)',
    explanationKa:
      'განიხილავს, თუ როდიდან ვამბობთ „მაშივ ჰარუახ უმორიდ ჰაგეშემ“ შმონე ესრეში (რაბი ელიეზერისა და რაბი იეჰოშუას კამათი) და სუკოთის წყლის საღვრელის (ניסוך המים) საიდუმლოს.',
    quotedSnippetHe:
      'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג. רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג.',
    relatedLocations: [
      { tractateId: 'Taanit', dafId: '2a', labelKa: 'თაანით 2a — მიშნა', labelHe: 'תענית ב.' },
      { tractateId: 'Rosh_Hashanah', dafId: '16a', labelKa: 'როშ ჰაშანა 16a — წყლის განკითხვა', labelHe: 'ראש השנה טז.' },
    ],
  },
  {
    id: 'corpus-taanit-2a-keys',
    tractateId: 'Taanit',
    dafId: '2a',
    section: 'daf-section-gemara',
    sectionLabelKa: 'გემარა • თაანით 2a',
    titleHe: 'מסכת תענית דף ב׳ ע״א — ג׳ מפתחות ביד הקב״ה',
    titleKa: 'ტრაქტატი თაანითი, დაფი 2a — სამი გასაღები უფლის ხელში (ג׳ מפתחות)',
    explanationKa:
      'რაბი იოხანანის სწავლება: სამი გასაღები უშუალოდ წმინდა გამჩენის ხელშია და არცერთ ანგელოზს არ გადაეცა — წვიმის გასაღები, მშობიარობის (სიცოცხლის) გასაღები და მკვდრეთით აღდგომის გასაღები.',
    quotedSnippetHe:
      'אָמַר רַבִּי יוֹחָנָן: שְׁלֹשָׁה מַפְתְּחוֹת בְּיָדוֹ שֶׁל הַקָּדוֹשׁ בָּרוֹךְ הוּא שֶׁלֹּא נִמְסְרוּ בְּיַד שָׁלִיחַ: מַפְתֵּחַ שֶׁל גְּשָׁמִים, וּמַפְתֵּחַ שֶׁל חַיָּה, וּמַפְתֵּחַ שֶׁל תְּחִיַּת הַמֵּתִים.',
    relatedLocations: [
      { tractateId: 'Taanit', dafId: '2a', labelKa: 'თაანით 2a — გემარა', labelHe: 'תענית ב.' },
      { tractateId: 'Taanit', dafId: '2b', labelKa: 'თაანით 2b — ნისუხ ჰამაიმ', labelHe: 'תענית ב:' },
    ],
  },
  {
    id: 'corpus-berakhot-2a-shema',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'მიშნა • ბერახოთ 2a',
    titleHe: 'מסכת ברכות דף ב׳ ע״א — מאימתי קורין את שמע בערבית',
    titleKa: 'ტრაქტატი ბერახოთი, დაფი 2a — საღამოს კრიათ შმა და ქოჰენების თრუმა',
    explanationKa:
      'თალმუდ ბავლის გახსნითი მიშნა: როდიდან კითხულობენ საღამოს შმას — ვარსკვლავების გამოსვლიდან (צאת הכוכבים), როდესაც განწმენდილი ქოჰენები შედიან თრუმის საჭმელად.',
    quotedSnippetHe:
      'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִים לֶאֱכוֹל בִּתְרוּמָתָן, עַד סוֹף הָאַשְׁמוּרָה הָרִאשׁוֹנָה.',
    relatedLocations: [
      { tractateId: 'Berakhot', dafId: '2a', labelKa: 'ბერახოთ 2a — კრიათ შმა', labelHe: 'ברכות ב.' },
      { realmId: 'torah', bookId: 'Deuteronomy', chapter: 6, tractateId: 'Berakhot', dafId: '2a', labelKa: 'დევარიმ 6:4 — შმა ისრაელ', labelHe: 'דברים ו׳' },
    ],
  },
  {
    id: 'corpus-mishnayot-bartenura-kehati',
    tractateId: 'Berakhot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'მიშნა • ბარტენურა და კეჰათი',
    realmId: 'mishnayot',
    bookId: 'Mishnah_Berakhot',
    chapter: 1,
    titleHe: 'ששה סדרי משנה • פירוש ברטנורא (רע״ב) ופירוש פנחס קהתי',
    titleKa: 'მიშნა ბარტენურას (רע״ב), კეჰათის (קהתי) და თოსაფოთ იომ ტოვის კომენტარებით',
    explanationKa:
      'რაბენუ ოვადია ბარტენურა და ფინხას კეჰათი სისტემურად განმარტავენ მიშნის თითოეულ სიტყვას, ტანაიმების კამათის საფუძველს და საბოლოო ჰალახურ დასკვნას.',
    quotedSnippetHe:
      'רע״ב (ברטנורא) ופירוש קהתי: מצוות עשה מן התורה לקרוא קריאת שמע פעמיים בכל יום — בערב ובבוקר, שנאמר ״בשכבך ובקומך״.',
    relatedLocations: [
      { realmId: 'mishnayot', bookId: 'Mishnah_Berakhot', chapter: 1, tractateId: 'Berakhot', dafId: '2a', labelKa: 'მიშნა ბერახოთ 1 (ბარტენურა)', labelHe: 'משנה ברכות א׳' },
      { tractateId: 'Berakhot', dafId: '2a', labelKa: 'თალმუდი ბერახოთ 2a', labelHe: 'ברכות ב.' },
    ],
  },
  {
    id: 'corpus-bava-kamma-2a',
    tractateId: 'Bava_Kamma',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'მიშნა • ბავა კამა 2a',
    titleHe: 'מסכת בבא קמא דף ב׳ ע״א — ארבעה אבות נזיקין',
    titleKa: 'ტრაქტატი ბავა კამა, დაფი 2a — ოთხი მთავარი ზიანი (ארבעה אבות נזיקין)',
    explanationKa:
      'სედერ ნეზიკინის პირველი სუგია ადგენს ქონებრივი პასუხისმგებლობის ოთხ ფუნდამენტურ კატეგორიას: შორი (ხარი), ბორი (ორმო), მავე და ჰევერი (ცეცხლი).',
    quotedSnippetHe:
      'אַרְבָּעָה אֲבוֹת נְזִיקִין: הַשּׁוֹר וְהַבּוֹר וְהַמַּבְעֶה וְהַהֶבְעֵר.',
    relatedLocations: [
      { tractateId: 'Bava_Kamma', dafId: '2a', labelKa: 'ბავა კამა 2a — აბოთ ნეზიკინ', labelHe: 'בבא קמא ב.' },
      { realmId: 'shulchan-aruch', bookId: 'Shulchan_Arukh_Choshen_Mishpat', chapter: 389, tractateId: 'Bava_Kamma', dafId: '2a', labelKa: 'ხოშენ მიშპატ 389', labelHe: 'חו״מ שפ״ט' },
    ],
  },
  {
    id: 'corpus-avot-1',
    tractateId: 'Avot',
    dafId: '2a',
    section: 'daf-section-mishnah',
    sectionLabelKa: 'მიშნა • ფირკეი ავოთ 1:1',
    realmId: 'mishnayot',
    bookId: 'Pirkei_Avot',
    chapter: 1,
    titleHe: 'פרקי אבות פרק א׳ משנה א׳ — משה קיבל תורה מסיני',
    titleKa: 'ფირკეი ავოთი (მამათა სწავლანი) 1:1 — მოშემ მიიღო თორა სინაიდან',
    explanationKa:
      'ზეპირი თორის გადაცემის ჯაჭვი მოშე რაბენუდან დიდი კრებულის კაცებამდე, ბარტენურასა და კეჰათის სრული კომენტარებით.',
    quotedSnippetHe:
      'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה.',
    relatedLocations: [
      { realmId: 'mishnayot', bookId: 'Pirkei_Avot', chapter: 1, tractateId: 'Avot', dafId: '2a', labelKa: 'ფირკეი ავოთ 1:1', labelHe: 'פרקי אבות א׳' },
    ],
  },
];

const NON_TALMUD_REALM_IDS: SacredRealmId[] = [
  'torah',
  'neviim',
  'ketuvim',
  'mishnayot',
  'rambam',
  'tur',
  'shulchan-aruch',
  'mishnah-berurah',
  'sephardic-halakha',
];

function searchAcrossCorpus(
  query: string,
  scope: string,
  currentDafData: DafPageData
): AiNavigationMatch[] {
  const qClean = query.trim().toLowerCase();
  const qNoNikud = query.trim().replace(/[\u0591-\u05C7]/g, '');
  const results: AiNavigationMatch[] = [];

  // 1. Search inside currently open Daf sentences (Mishnah, Gemara, Rashi, Tosafot)
  const canSearchCurrentDaf =
    scope === 'all' ||
    scope === 'current-daf' ||
    scope === `tractate:${currentDafData.tractateId}` ||
    scope === 'scope:mishnayot' ||
    scope === 'scope:gemara' ||
    scope === 'scope:rashi-tosafot';

  if (canSearchCurrentDaf && qClean.length > 0) {
    const trObj = TRACTATES.find((t) => t.id === currentDafData.tractateId);
    const trNameKa = trObj?.nameKa || currentDafData.tractateId;
    const trNameHe = trObj?.nameHe || currentDafData.tractateId;

    const groups: {
      list: typeof currentDafData.gemara;
      secId: string;
      secLabel: string;
      allowedScopes: string[];
    }[] = [
      {
        list: currentDafData.mishnah || [],
        secId: 'daf-section-mishnah',
        secLabel: 'მიშნა (משנה)',
        allowedScopes: ['all', 'current-daf', 'scope:mishnayot', `tractate:${currentDafData.tractateId}`],
      },
      {
        list: currentDafData.gemara || [],
        secId: 'daf-section-gemara',
        secLabel: 'გემარა (גמרא)',
        allowedScopes: ['all', 'current-daf', 'scope:gemara', `tractate:${currentDafData.tractateId}`],
      },
      {
        list: currentDafData.rashi || [],
        secId: 'daf-section-rashi',
        secLabel: 'რაში (רש״י)',
        allowedScopes: ['all', 'current-daf', 'scope:rashi-tosafot', `tractate:${currentDafData.tractateId}`],
      },
      {
        list: currentDafData.tosafot || [],
        secId: 'daf-section-tosafot',
        secLabel: 'თოსაფოთი (תוספות)',
        allowedScopes: ['all', 'current-daf', 'scope:rashi-tosafot', `tractate:${currentDafData.tractateId}`],
      },
    ];

    for (const grp of groups) {
      if (!grp.allowedScopes.includes(scope)) continue;
      for (const s of grp.list) {
        const heRaw = s.hebrewText || (s as unknown as { hebrew?: string }).hebrew || '';
        const hePlain = heRaw.replace(/[\u0591-\u05C7]/g, '');
        const kaTrans = (s.translationKa || '').toLowerCase();
        const kaExpl = (s.explanationKa || '').toLowerCase();
        const dh = (s.dibburHamatchil || '').replace(/[\u0591-\u05C7]/g, '');

        const matches =
          (qNoNikud.length >= 2 && (hePlain.includes(qNoNikud) || dh.includes(qNoNikud))) ||
          kaTrans.includes(qClean) ||
          kaExpl.includes(qClean);

        if (matches) {
          results.push({
            id: `live-daf-${s.id}`,
            tractateId: currentDafData.tractateId,
            dafId: currentDafData.dafId,
            section: grp.secId,
            sectionLabelKa: `${grp.secLabel} • ${trNameKa} ${currentDafData.dafId}`,
            titleHe: `${trNameHe} דף ${currentDafData.dafId} • ${s.dibburHamatchil || grp.secLabel}`,
            titleKa: `${trNameKa} ${currentDafData.dafId} — ${grp.secLabel}`,
            explanationKa: s.translationKa || s.explanationKa || '',
            quotedSnippetHe: heRaw.slice(0, 220),
            relatedLocations: [
              {
                tractateId: currentDafData.tractateId,
                dafId: currentDafData.dafId,
                labelKa: `${trNameKa} ${currentDafData.dafId}`,
                labelHe: `${trNameHe} ${currentDafData.dafId}`,
              },
            ],
          });
        }
      }
    }
  }

  // 2. Search Curated Global Corpus (Torah, Tanakh, Mishnah, Talmud, Rambam, Tur, Shulchan Aruch, Halakha)
  for (const item of CURATED_AI_CORPUS) {
    if (scope === 'current-daf' && item.tractateId !== currentDafData.tractateId) continue;
    if (scope.startsWith('realm:')) {
      const targetRealm = scope.replace('realm:', '');
      if ((item.realmId || 'talmud') !== targetRealm) continue;
    }
    if (scope.startsWith('tractate:')) {
      const targetTr = scope.replace('tractate:', '');
      if (item.tractateId !== targetTr) continue;
    }
    if (scope === 'scope:mishnayot' && item.section !== 'daf-section-mishnah' && item.realmId !== 'mishnayot') {
      continue;
    }
    if (scope === 'scope:gemara' && (item.realmId && item.realmId !== 'talmud')) {
      continue;
    }
    if (scope === 'scope:rashi-tosafot' && item.section !== 'daf-section-rashi' && item.section !== 'daf-section-tosafot') {
      continue;
    }

    if (!qClean) {
      results.push(item);
      continue;
    }

    const haystack = `${item.titleKa} ${item.titleHe} ${item.explanationKa} ${item.quotedSnippetHe} ${item.sectionLabelKa}`
      .toLowerCase()
      .replace(/[\u0591-\u05C7]/g, '');
    const tokens = qClean.split(/\s+/).filter((t) => t.length >= 2);
    const anyTokenMatches =
      tokens.length === 0 ||
      tokens.some((tok) => haystack.includes(tok.replace(/[\u0591-\u05C7]/g, '')));

    if (anyTokenMatches && !results.some((r) => r.id === item.id)) {
      results.push(item);
    }
  }

  // 3. Search across all Sacred Realms books (Torah, Neviim, Ketuvim, Mishnayot, Rambam, Tur, Shulchan Aruch, Mishnah Berurah, Sephardic Halakha)
  for (const rId of NON_TALMUD_REALM_IDS) {
    if (scope.startsWith('realm:') && scope !== `realm:${rId}`) continue;
    if (scope.startsWith('tractate:') || scope === 'current-daf' || scope === 'scope:gemara' || scope === 'scope:rashi-tosafot') continue;
    if (scope === 'scope:mishnayot' && rId !== 'mishnayot') continue;

    const realmMeta = SACRED_REALMS.find((r) => r.id === rId);
    const books = getBooksForRealm(rId);
    for (const bk of books) {
      const bookHaystack = `${bk.nameKa} ${bk.nameHe} ${bk.id} ${bk.subGroupKa} ${realmMeta?.titleKa || ''} ${realmMeta?.titleHe || ''}`.toLowerCase();
      const isRealmScopedWithoutQuery = scope === `realm:${rId}` && !qClean;
      const matchesBook =
        isRealmScopedWithoutQuery ||
        (qClean.length >= 2 &&
          qClean
            .split(/\s+/)
            .filter((t) => t.length >= 2)
            .some((tok) => bookHaystack.includes(tok)));

      if (matchesBook) {
        const chMatch = qClean.match(/\b(\d{1,3})\b/);
        const targetChapter = chMatch
          ? Math.max(1, Math.min(bk.chaptersCount, parseInt(chMatch[1], 10) || 1))
          : 1;
        const matchId = `global-book-${rId}-${bk.id}-${targetChapter}`;
        if (!results.some((r) => r.id === matchId)) {
          results.push({
            id: matchId,
            realmId: rId,
            bookId: bk.id,
            chapter: targetChapter,
            tractateId: 'Berakhot',
            dafId: '2a',
            section: 'daf-section-mishnah',
            sectionLabelKa: `${realmMeta?.titleKa || rId} • ${bk.nameKa} (თავი/სიმანი ${targetChapter})`,
            titleHe: `${bk.nameHe} • פרק / סימן ${targetChapter}`,
            titleKa: `${bk.nameKa} — თავი / სიმანი ${targetChapter} (${realmMeta?.titleKa || ''})`,
            explanationKa: `${bk.subGroupKa} • ${realmMeta?.subtitleKa || ''}`,
            quotedSnippetHe: `${bk.nameHe} (${realmMeta?.titleHe || ''}) — פרק ${targetChapter}`,
            relatedLocations: [
              {
                realmId: rId,
                bookId: bk.id,
                chapter: targetChapter,
                tractateId: 'Berakhot',
                dafId: '2a',
                labelKa: `${bk.nameKa} ${targetChapter}`,
                labelHe: `${bk.nameHe} ${targetChapter}`,
              },
            ],
          });
        }
      }
    }
  }

  // 4. Check if query matches any of the 37 Tractate names or Daf numbers directly
  for (const tr of TRACTATES) {
    if (scope.startsWith('realm:')) continue;
    if (scope.startsWith('tractate:') && scope !== `tractate:${tr.id}`) continue;
    const trMatch =
      qClean &&
      (qClean.includes(tr.nameKa.toLowerCase()) ||
        qClean.includes(tr.nameHe) ||
        qClean.includes(tr.nameEn.toLowerCase()) ||
        qClean.includes(tr.id.toLowerCase()));

    if (trMatch) {
      const dafNumMatch = qClean.match(/(\d{1,3})\s*([abאב.:]?)/);
      const targetDaf = dafNumMatch
        ? `${Math.max(2, Math.min(tr.lastDaf, parseInt(dafNumMatch[1], 10) || 2))}${
            dafNumMatch[2] === 'b' || dafNumMatch[2] === 'ב' || dafNumMatch[2] === ':' ? 'b' : 'a'
          }`
        : '2a';

      if (!results.some((r) => r.tractateId === tr.id && r.dafId === targetDaf && !r.realmId)) {
        results.push({
          id: `tractate-direct-${tr.id}-${targetDaf}`,
          realmId: 'talmud',
          tractateId: tr.id,
          dafId: targetDaf,
          section: 'daf-section-mishnah',
          sectionLabelKa: `ტრაქტატი ${tr.nameKa} • დაფი ${targetDaf}`,
          titleHe: `מסכת ${tr.nameHe} דף ${targetDaf}`,
          titleKa: `ტრაქტატი ${tr.nameKa}, დაფი ${targetDaf}`,
          explanationKa: tr.descriptionKa,
          quotedSnippetHe: `מסכת ${tr.nameHe} (${tr.sederKa}) — דף ${targetDaf}`,
          relatedLocations: [
            { tractateId: tr.id, dafId: '2a', labelKa: `${tr.nameKa} 2a`, labelHe: `${tr.nameHe} ב.` },
            { tractateId: tr.id, dafId: '2b', labelKa: `${tr.nameKa} 2b`, labelHe: `${tr.nameHe} ב:` },
          ],
        });
      }
    }
  }

  if (results.length === 0) {
    if (scope.startsWith('tractate:')) {
      const trId = scope.replace('tractate:', '');
      const tr = TRACTATES.find((t) => t.id === trId) || TRACTATES[0];
      return [
        {
          id: `fallback-${tr.id}`,
          realmId: 'talmud',
          tractateId: tr.id,
          dafId: '2a',
          section: 'daf-section-gemara',
          sectionLabelKa: `ტრაქტატი ${tr.nameKa} • 2a`,
          titleHe: `מסכת ${tr.nameHe} דף ב׳ ע״א`,
          titleKa: `ტრაქტატი ${tr.nameKa}, დაფი 2a — ძიება: „${query || tr.nameKa}“`,
          explanationKa: tr.descriptionKa,
          quotedSnippetHe: `חיפוש ב${tr.nameHe}: ${query || tr.nameHe}`,
          relatedLocations: [
            { tractateId: tr.id, dafId: '2a', labelKa: `${tr.nameKa} 2a`, labelHe: `${tr.nameHe} ב.` },
          ],
        },
      ];
    }
    return CURATED_AI_CORPUS.slice(0, 6);
  }

  return results.slice(0, 10);
}

export const VoiceAndAiNavModal: React.FC<VoiceAndAiNavModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  onNavigateToDaf,
  onNavigateToRealm,
  onPrevAmud,
  onNextAmud,
  currentDafData,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'ai' | 'gemini'>(initialTab);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'ka-GE' | 'he-IL' | 'en-US'>('ka-GE');
  const [transcript, setTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState(
    'დააჭირეთ 3D მიკროფონის ღილაკს და წარმოთქვით ბრძანება (მაგ.: „თაანით 2a“, „ბერახოთ 2a“, „მიშნა“, „თოსაფოთი“, „წაიკითხე მიშნა“)'
  );
  const [selectedVoiceCmd, setSelectedVoiceCmd] = useState('nav:Taanit:2a');
  const [selectedVoiceTractate, setSelectedVoiceTractate] = useState(currentDafData.tractateId);
  const [selectedVoiceDaf, setSelectedVoiceDaf] = useState(currentDafData.dafId);

  const [aiQuery, setAiQuery] = useState('');
  // Default search scope is 'all' ("ყველგან") as requested by the user!
  const [searchScope, setSearchScope] = useState<string>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiNavigationMatch[]>(() =>
    searchAcrossCorpus('', 'all', currentDafData)
  );

  // Ask Gemini AI with clickable rabbinic sources state
  const [geminiQuestion, setGeminiQuestion] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<GeminiAskResponse>({
    question: 'როდის იწყება საღამოს „შემას“ კითხვა და სად წერია ეს თორაში, თალმუდსა და შულხან არუხში?',
    answerKa:
      'საღამოს „შემა ისრაელის“ კითხვის დრო იწყება ვარსკვლავების გამოსვლიდან (צאת הכוכבים), როდესაც კოჰენები ტვილას შემდეგ კვლავ იღებენ თერუმის ჭამის უფლებას. ეს კანონი ეფუძნება თორის პასუკს „בשכבך ובקומך“ (დაწოლისას და ადგომისას), იხსნება ბერახოთის პირველივე მიშნასა და გემარაში (2a–2b) და დადგენილია ჰალახად რამბამსა და შულხან არუხში (ორახ ხაიმ, სიმანი 235). ქვემოთ მოცემულ თითოეულ წყაროზე დაჭერით პირდაპირ გადახვალთ შესაბამის წიგნსა და დაფზე!',
    answerHe:
      'זמן קריאת שמע של ערבית מתחיל מצאת הכוכבים (משעה שהכהנים נכנסים לאכול בתרומתן), ונלמד מן הפסוק ״בשכבך ובקומך״ (דברים ו׳, ז׳), כמבואר במשנה ובגמרא מסכת ברכות דף ב׳ ע״א–ע״ב, וברמב״ם ובשולחן ערוך אורח חיים סימן רל״ה.',
    keyPointsKa: [
      'დაწყების დრო: ვარსკვლავების გამოსვლა (צאת הכוכבים — 3 საშუალო ვარსკვლავის გამოჩენა).',
      'რაბი ელიეზერი: პირველი გუშაგის დასრულებამდე (შუაღამის მესამედი).',
      'ბრძენები (חכמים): შუაღამემდე (חצות הלילה), რათა ადამიანი ცოდვას განერიდოს.',
      'რაბან გამლიელი: ცისკრის ამოსვლამდე (עמוד השחר) — ძირითადი კანონით.',
    ],
    halachaTakeawayKa:
      'შულხან არუხი (ორახ ხაიმ 235:1–3): საღამოს შემა იკითხება ვარსკვლავების გამოსვლიდან შუაღამემდე, ხოლო თუ დააგვიანდა — ცისკრის ამოსვლამდე კურთხევებით.',
    sources: [
      {
        id: 'gem-src-1',
        titleKa: 'თალმუდი • ბერახოთ 2a — მიშნა: საღამოს შემას კითხვის დრო',
        titleHe: 'מסכת ברכות דף ב׳ ע״א — מאימתי קורין את שמע בערבין',
        realmId: 'talmud',
        tractateId: 'Berakhot',
        dafId: '2a',
        section: 'daf-section-mishnah',
        quotedSnippetHe: 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִין',
        explanationKa: 'შასის პირველი მიშნა: საღამოს შემას კითხვის დაწყებისა და დასრულების დროები.',
      },
      {
        id: 'gem-src-2',
        titleKa: 'თალმუდი • ბერახოთ 2b — გემარა: ვარსკვლავების გამოსვლა (צאת הכוכבים)',
        titleHe: 'מסכת ברכות דף ב׳ ע״ב — צאת הכוכבים הוא גמר ביאת השמש',
        realmId: 'talmud',
        tractateId: 'Berakhot',
        dafId: '2b',
        section: 'daf-section-gemara',
        quotedSnippetHe: 'מִשּׁוּם דְּקָא בָּעֵי לְמִתְנֵי סיפא',
        explanationKa: 'გემარა ადგენს, რომ ვარსკვლავების გამოსვლა არის ღამის დადგომის უტყუარი ნიშანი.',
      },
      {
        id: 'gem-src-3',
        titleKa: 'თორა • დევარიმი (რჯული) თავი 6 — შემა ისრაელი (שמע ישראל)',
        titleHe: 'חומש דברים פרק ו׳ — שמע ישראל ה׳ אלהינו ה׳ אחד',
        realmId: 'torah',
        bookId: 'Deuteronomy',
        chapter: 6,
        tractateId: 'Berakhot',
        dafId: '2a',
        quotedSnippetHe: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד',
        explanationKa: 'თორის წყარო შემას კითხვის მცნებისთვის საღამოს და დილით („בשכבך ובקומך“).',
      },
      {
        id: 'gem-src-4',
        titleKa: 'შულხან არუხი • ორახ ხაიმ, სიმანი 1 და 235',
        titleHe: 'שולחן ערוך אורח חיים — הלכות קריאת שמע ותפילה',
        realmId: 'shulchan-aruch',
        bookId: 'Shulchan_Arukh,_Orach_Chayim',
        chapter: 1,
        tractateId: 'Berakhot',
        dafId: '2a',
        quotedSnippetHe: 'יִתְגַּבֵּר כַּאֲרִי לַעֲמֹד בַּבֹּקֶר לַעֲבוֹדַת בּוֹרְאוֹ',
        explanationKa: 'პრაქტიკული ჰალახა ლოცვისა და შემას კითხვის შესახებ შულხან არუხში.',
      },
      {
        id: 'gem-src-5',
        titleKa: 'რამბამი (მიშნე თორა) • ჰილხოთ კრიათ შემა, თავი 1',
        titleHe: 'רמב״ם משנה תורה — ספר אהבה, הלכות קריאת שמע פרק א׳',
        realmId: 'rambam',
        bookId: 'Mishneh_Torah,_Reading_the_Shema',
        chapter: 1,
        tractateId: 'Berakhot',
        dafId: '2a',
        quotedSnippetHe: 'פְּעָמַיִם בְּכָל יוֹם קוֹרִין אֶת שְׁמַע בָּעֶרֶב וּבַבֹּקֶר',
        explanationKa: 'რამბამის კოდიფიკაცია დღეში ორჯერ შემას კითხვის მცნებაზე.',
      },
    ],
  });

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const speechHandledRef = useRef<boolean>(false);
  const latestInterimRef = useRef<string>('');
  const dictationInputRef = useRef<HTMLInputElement | null>(null);
  const autoRunTimerRef = useRef<number | null>(null);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveMicMode, setLiveMicMode] = useState<'idle' | 'speech-api' | 'ai-recorder' | 'live-dictation'>('idle');
  const [isSpeakingVoiceModal, setIsSpeakingVoiceModal] = useState(false);

  const stopAllRecording = (stopMediaRecorder = true) => {
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    setAudioLevel(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (stopMediaRecorder && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (stopMediaRecorder && mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (stopMediaRecorder && audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (autoRunTimerRef.current) {
      window.clearTimeout(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }
    setIsListening(false);
    setLiveMicMode('idle');
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Listen for native Android SpeechRecognizer callback if invoked via Android bridge
  useEffect(() => {
    (window as any).__onAndroidVoiceResult = (spokenText: string) => {
      setIsListening(false);
      setLiveMicMode('idle');
      if (spokenText && spokenText.trim()) {
        processSpokenTranscript(spokenText.trim());
      }
    };
    return () => {
      delete (window as any).__onAndroidVoiceResult;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAllRecording();
    }
  }, [isOpen]);

  const speakHebrewText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakingVoiceModal) {
        window.speechSynthesis.cancel();
        setIsSpeakingVoiceModal(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'he-IL';
      utter.rate = 0.88;
      utter.onstart = () => setIsSpeakingVoiceModal(true);
      utter.onend = () => setIsSpeakingVoiceModal(false);
      utter.onerror = () => setIsSpeakingVoiceModal(false);
      setIsSpeakingVoiceModal(true);
      window.speechSynthesis.speak(utter);
    }
  };

  const executeCommandCode = (cmd: string, spokenQuery?: string) => {
    setSelectedVoiceCmd(cmd);
    if (cmd.startsWith('nav:')) {
      const [, trId, dId] = cmd.split(':');
      onNavigateToDaf(trId, dId, 'daf-section-gemara', spokenQuery);
      setVoiceFeedback(`სრულდება: გადასვლა ${trId} ${dId}-ზე`);
      setTimeout(() => onClose(), 380);
    } else if (cmd.startsWith('scroll:')) {
      const sectionId = cmd.replace('scroll:', '');
      onNavigateToDaf(currentDafData.tractateId, currentDafData.dafId, sectionId, spokenQuery);
      setVoiceFeedback('სრულდება: სექციაზე გადასვლა');
      setTimeout(() => onClose(), 380);
    } else if (cmd === 'read:mishnah') {
      const text = currentDafData.mishnah.map((s) => s.hebrewText).join(' ');
      speakHebrewText(text || currentDafData.gemara[0]?.hebrewText || '');
      setVoiceFeedback('მიმდინარეობს მიშნის ხმოვანი წაკითხვა (הקראת המשנה)...');
    } else if (cmd === 'read:gemara') {
      const text = currentDafData.gemara.map((s) => s.hebrewText).join(' ');
      speakHebrewText(text);
      setVoiceFeedback('მიმდინარეობს გემარის ხმოვანი წაკითხვა (הקראת הגמרא)...');
    } else if (cmd === 'action:next') {
      onNextAmud();
      setVoiceFeedback('გადავედით შემდეგ დაფზე');
      setTimeout(() => onClose(), 350);
    } else if (cmd === 'action:prev') {
      onPrevAmud();
      setVoiceFeedback('დავბრუნდით წინა დაფზე');
      setTimeout(() => onClose(), 350);
    }
  };

  const extractSpokenDafId = (s: string): string => {
    const explicitMatch = s.match(/\b(\d{1,3})\s*([abაბ])\b/i);
    if (explicitMatch) {
      const num = explicitMatch[1];
      const side = explicitMatch[2].toLowerCase();
      return `${num}${side === 'ბ' || side === 'b' ? 'b' : 'a'}`;
    }
    const isBet = s.includes('ბეთ') || s.includes('მეორე გვერდ') || s.includes('უკანა') || s.includes('b');
    const amudSuffix = isBet ? 'b' : 'a';
    if (s.includes('ხუთ') || s.includes('5')) return `5${amudSuffix}`;
    if (s.includes('ოთხ') || s.includes('4')) return `4${amudSuffix}`;
    if (s.includes('სამ') || s.includes('3')) return `3${amudSuffix}`;
    if (s.includes('ორ') || s.includes('2')) return `2${amudSuffix}`;
    return '2a';
  };

  const processSpokenTranscript = (spoken: string) => {
    const clean = spoken.trim();
    if (!clean) return;
    speechHandledRef.current = true;
    setTranscript(clean);
    const s = clean.toLowerCase();
    const targetDaf = extractSpokenDafId(s);

    if (s.includes('შემდეგ') || s.includes('მომდევნო') || s.includes('წინ გადა') || s.includes('next') || s.includes('הבא')) {
      executeCommandCode('action:next', clean);
      return;
    }
    if (s.includes('წინა') || s.includes('უკან') || s.includes('prev') || s.includes('הקודם')) {
      executeCommandCode('action:prev', clean);
      return;
    }
    if (s.includes('თაანით') || s.includes('თანით') || s.includes('taanit') || s.includes('תענית') || s.includes('წვიმ')) {
      executeCommandCode(`nav:Taanit:${targetDaf}`, clean);
      return;
    }
    if (s.includes('ბერახოთ') || s.includes('ბრახოთ') || s.includes('berakhot') || s.includes('ברכות') || s.includes('შემა') || s.includes('შმა')) {
      executeCommandCode(`nav:Berakhot:${targetDaf}`, clean);
      return;
    }
    if (s.includes('შაბათ') || s.includes('shabbat') || s.includes('שבת')) {
      executeCommandCode(`nav:Shabbat:${targetDaf}`, clean);
      return;
    }
    if (s.includes('ფესახ') || s.includes('pesach') || s.includes('פסחים')) {
      executeCommandCode(`nav:Pesachim:${targetDaf}`, clean);
      return;
    }
    if (s.includes('თოსაფოთ') || s.includes('tosafot') || s.includes('תוספות')) {
      executeCommandCode('scroll:daf-section-tosafot', clean);
      return;
    }
    if (s.includes('რაში') || s.includes('rashi') || s.includes('רש"י') || s.includes('רשי')) {
      executeCommandCode('scroll:daf-section-rashi', clean);
      return;
    }
    if (s.includes('მიშნა') || s.includes('mishnah') || s.includes('משנה')) {
      if (s.includes('წაიკითხ') || s.includes('ხმა') || s.includes('read')) {
        executeCommandCode('read:mishnah', clean);
      } else {
        executeCommandCode('scroll:daf-section-mishnah', clean);
      }
      return;
    }
    if (s.includes('გემარა') || s.includes('gemara') || s.includes('גמרא')) {
      if (s.includes('წაიკითხ') || s.includes('ხმა') || s.includes('read')) {
        executeCommandCode('read:gemara', clean);
      } else {
        executeCommandCode('scroll:daf-section-gemara', clean);
      }
      return;
    }

    for (const tr of TRACTATES) {
      if (
        s.includes(tr.nameKa.toLowerCase()) ||
        s.includes(tr.nameHe) ||
        s.includes(tr.nameEn.toLowerCase())
      ) {
        executeCommandCode(`nav:${tr.id}:${targetDaf}`, clean);
        return;
      }
    }

    // If user only said a daf number like "დაფი 3a" or "მეორე გვერდი"
    if (s.includes('დაფ') || s.includes('გვერდ') || /\b\d+[abაბ]\b/i.test(s)) {
      executeCommandCode(`nav:${currentDafData.tractateId}:${targetDaf}`, clean);
      return;
    }

    setActiveTab('ai');
    setAiQuery(clean);
    handleRunAiNav(clean);
  };

  const activateInteractiveVoiceAssistantMode = () => {
    setIsListening(false);
    setLiveMicMode('live-dictation');
    setVoiceFeedback(
      '⚠️ ბრაუზერმა მიკროფონის პირდაპირი წვდომა შეზღუდა — გამოიყენეთ კლავიატურის მიკროფონი ქვედა ველში ან დააჭირეთ მზა ხმოვან ბრძანებას.'
    );
    setTimeout(() => {
      if (dictationInputRef.current) {
        dictationInputRef.current.focus();
      }
    }, 80);
  };

  const startMediaRecorderFallback = async (fromParallel = false) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      if (!fromParallel) activateInteractiveVoiceAssistantMode();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      // Set up real-time AudioContext analyser so we detect when the user speaks and stops speaking
      let spokeAtLeastOnce = false;
      let lastVoiceTime = Date.now();
      const recordStartTime = Date.now();

      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const norm = Math.min(100, Math.round(avg * 2.4));
            setAudioLevel(norm);

            const now = Date.now();
            if (norm > 14) {
              if (!spokeAtLeastOnce) {
                spokeAtLeastOnce = true;
                if (!speechHandledRef.current) {
                  setVoiceFeedback('🎙️ ისმის თქვენი ხმა... ვუსმენ და ვწერ ბრძანებას...');
                }
              }
              lastVoiceTime = now;
            }

            // Auto-stop and transcribe as soon as user finishes speaking (850ms silence after speech)
            // OR after 3.8s total recording time
            if (
              (spokeAtLeastOnce && now - lastVoiceTime > 850 && now - recordStartTime > 1100) ||
              now - recordStartTime > 3800
            ) {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
              return;
            }
            vadRafRef.current = requestAnimationFrame(checkVolume);
          };
          vadRafRef.current = requestAnimationFrame(checkVolume);
        }
      } catch {
        // Fallback timer if AudioContext is unavailable
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (vadRafRef.current) {
          cancelAnimationFrame(vadRafRef.current);
          vadRafRef.current = null;
        }
        setAudioLevel(0);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch {
            // ignore
          }
          audioContextRef.current = null;
        }
        setIsListening(false);
        setLiveMicMode('idle');

        // If browser SpeechRecognition already handled and wrote the transcript, no need to overwrite
        if (speechHandledRef.current) return;
        if (latestInterimRef.current.trim().length > 0) {
          processSpokenTranscript(latestInterimRef.current.trim());
          return;
        }
        if (chunks.length === 0) return;

        const cleanMime = (recorder.mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
        const blob = new Blob(chunks, { type: cleanMime });
        setTranscribingAudio(true);
        setVoiceFeedback('⏳ მიმდინარეობს ქართული ხმოვანი ბრძანების დამუშავება...');

        try {
          const reader = new FileReader();
          const base64Audio: string = await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const resStr = String(reader.result || '');
              const b64 = resStr.includes(',') ? resStr.split(',')[1] : resStr;
              resolve(b64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const res = await fetch(getBackendUrl('/api/talmud/voice-transcribe'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: cleanMime,
              lang: voiceLang,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const spoken = (data.transcript || '').trim();
            if (spoken) {
              speechHandledRef.current = true;
              setTranscript(spoken);
              setVoiceFeedback(`✅ ჩაიწერა: „${spoken}“`);
              setTimeout(() => {
                processSpokenTranscript(spoken);
              }, 400);
              return;
            }
          }
          if (latestInterimRef.current.trim()) {
            processSpokenTranscript(latestInterimRef.current.trim());
            return;
          }
          setVoiceFeedback(
            '🎙️ გთხოვთ ჩაწეროთ ან წარმოთქვათ ბრძანება ქვედა ველში (მაგ.: „ბერახოთ 2a“, „თაანით 5a“, „მიშნა“, „შემდეგი დაფი“).'
          );
          if (dictationInputRef.current) {
            dictationInputRef.current.focus();
          }
        } catch {
          if (!fromParallel) activateInteractiveVoiceAssistantMode();
        } finally {
          setTranscribingAudio(false);
        }
      };

      setIsListening(true);
      if (!fromParallel) {
        setLiveMicMode('ai-recorder');
        setVoiceFeedback(
          '🎙️ მიკროფონი ჩართულია! წარმოთქვით ბრძანება ქართულად (მაგ. „თაანით 2a“, „მიშნა“, „შემდეგი დაფი“) — ტექსტი ავტომატურად ჩაიწერება.'
        );
      }
      recorder.start(250);

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4200);
    } catch {
      if (!fromParallel) activateInteractiveVoiceAssistantMode();
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      stopAllRecording(false);
      const pendingText = latestInterimRef.current.trim() || transcript.trim();
      if (pendingText && !speechHandledRef.current) {
        processSpokenTranscript(pendingText);
      }
      return;
    }

    speechHandledRef.current = false;
    latestInterimRef.current = '';
    setTranscript('');

    // 1. Check Native Android Bridge if running inside Android APK
    if (typeof window !== 'undefined' && (window as any).AndroidTalmud?.startVoiceRecognition) {
      try {
        setIsListening(true);
        setLiveMicMode('speech-api');
        (window as any).AndroidTalmud.startVoiceRecognition(voiceLang);
        return;
      } catch {
        // continue to web fallback
      }
    }

    // 2. Prefer Browser SpeechRecognition cleanly first (without simultaneous getUserMedia mic contention!)
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      startMediaRecorderFallback(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = voiceLang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.onstart = () => {
        setIsListening(true);
        setLiveMicMode('speech-api');
        setVoiceFeedback(
          '🎙️ გისმენთ ქართულად... წარმოთქვით ტრაქტატი, დაფი ან ბრძანება (მაგ. „თაანით 2a“, „ბერახოთ 3a“, „მიშნა“, „შემდეგი დაფი“)'
        );
      };
      rec.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += t;
          } else {
            interim += t;
          }
        }
        if (interim) {
          latestInterimRef.current = interim;
          setTranscript(interim);
          setVoiceFeedback(`🎙️ ისმის: „${interim}“...`);
        }
        if (finalStr) {
          latestInterimRef.current = finalStr;
          setTranscript(finalStr);
          stopAllRecording(true);
          processSpokenTranscript(finalStr);
        }
      };
      rec.onerror = () => {
        recognitionRef.current = null;
        if (!speechHandledRef.current && latestInterimRef.current.trim()) {
          processSpokenTranscript(latestInterimRef.current.trim());
        } else if (!speechHandledRef.current) {
          startMediaRecorderFallback(false);
        }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (!speechHandledRef.current && latestInterimRef.current.trim()) {
          stopAllRecording(true);
          processSpokenTranscript(latestInterimRef.current.trim());
        } else if (!speechHandledRef.current) {
          setIsListening(false);
          setLiveMicMode('idle');
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      startMediaRecorderFallback(false);
    }
  };

  const normalizeAiTractateAndDaf = (rawTractate?: string, rawDaf?: string) => {
    const cleanTr = (rawTractate || '').trim();
    const cleanTrLower = cleanTr.toLowerCase().replace(/\s+/g, '_');
    const foundTr =
      TRACTATES.find(
        (t) =>
          t.id.toLowerCase() === cleanTrLower ||
          t.nameEn.toLowerCase().replace(/\s+/g, '_') === cleanTrLower ||
          t.nameKa.toLowerCase() === cleanTr.toLowerCase() ||
          t.nameHe === cleanTr ||
          cleanTr.toLowerCase().includes(t.nameEn.toLowerCase()) ||
          cleanTr.includes(t.nameHe) ||
          cleanTr.toLowerCase().includes(t.nameKa.toLowerCase())
      ) || TRACTATES[0];

    const dafMatch = (rawDaf || '2a').match(/(\d{1,3})\s*([abABאב.:]?)/);
    let resolvedDaf = '2a';
    if (dafMatch) {
      const num = Math.max(2, Math.min(foundTr.lastDaf, parseInt(dafMatch[1], 10) || 2));
      const sideRaw = dafMatch[2] || 'a';
      const isBet = sideRaw === 'b' || sideRaw === 'B' || sideRaw === 'ב' || sideRaw === ':';
      resolvedDaf = `${num}${isBet ? 'b' : 'a'}`;
    }
    return { tractateId: foundTr.id, dafId: resolvedDaf };
  };

  const navigateToExactSource = (target: {
    realmId?: SacredRealmId;
    bookId?: string;
    chapter?: number;
    tractateId?: string;
    dafId?: string;
    section?: string;
    quotedSnippetHe?: string;
    titleKa?: string;
  }) => {
    const highlightText =
      (target.quotedSnippetHe && target.quotedSnippetHe.trim()) ||
      aiQuery.trim() ||
      target.titleKa ||
      '';

    if (target.realmId && target.realmId !== 'talmud' && onNavigateToRealm) {
      onNavigateToRealm(
        target.realmId,
        target.bookId,
        target.chapter || 1,
        highlightText
      );
      onClose();
      return;
    }

    const norm = normalizeAiTractateAndDaf(target.tractateId, target.dafId);
    onNavigateToDaf(
      norm.tractateId,
      norm.dafId,
      target.section || 'daf-section-gemara',
      highlightText
    );
    onClose();
  };

  const handleAskGemini = async (qOverride?: string) => {
    const q = (qOverride ?? geminiQuestion).trim();
    if (!q) return;

    setGeminiLoading(true);
    const localMatches = searchAcrossCorpus(q, 'all', currentDafData);
    const mappedLocalSources: GeminiCitedSource[] = localMatches.slice(0, 5).map((m, idx) => ({
      id: `local-gem-src-${idx}-${m.id}`,
      titleKa: `${m.sectionLabelKa} — ${m.titleKa}`,
      titleHe: m.titleHe,
      realmId: m.realmId || 'talmud',
      bookId: m.bookId,
      chapter: m.chapter,
      tractateId: m.tractateId,
      dafId: m.dafId,
      section: m.section,
      quotedSnippetHe: m.quotedSnippetHe,
      explanationKa: m.explanationKa,
    }));

    try {
      const res = await fetch(getBackendUrl('/api/talmud/ask-gemini'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.answerKa || data.sources)) {
          const apiSources: GeminiCitedSource[] = Array.isArray(data.sources)
            ? data.sources.map((s: any, idx: number) => ({
                id: `api-gem-src-${idx}-${Date.now()}`,
                titleKa: s.labelKa || s.titleKa || `${s.tractateId || s.bookId || 'წყარო'} ${s.dafId || s.chapter || ''}`,
                titleHe: s.labelHe || s.titleHe || s.quoteHe || s.quotedSnippetHe || '',
                realmId: (String(s.realmId || 'talmud').replace(/_/g, '-') as SacredRealmId),
                bookId: s.bookId,
                chapter: typeof s.chapter === 'number' ? s.chapter : Number(s.chapter) || 1,
                tractateId: s.tractateId || 'Berakhot',
                dafId: s.dafId || '2a',
                section: s.section || 'daf-section-gemara',
                quotedSnippetHe: s.quoteHe || s.quotedSnippetHe || '',
                explanationKa: s.explanationKa || '',
              }))
            : [];
          const combinedSources = [...apiSources, ...mappedLocalSources].slice(0, 6);
          setGeminiResponse({
            question: q,
            answerKa:
              data.answerKa ||
              `კითხვაზე „${q}“ ნაპოვნია პირდაპირი წყაროები თორაში, მიშნაში, თალმუდსა და ჰალახის კოდექსებში. დააჭირეთ ქვემოთ მოცემულ ნებისმიერ წყაროს ზუსტ ადგილზე გადასასვლელად.`,
            answerHe: data.summaryHe || data.answerHe || mappedLocalSources[0]?.quotedSnippetHe || '',
            keyPointsKa: Array.isArray(data.keyPointsKa) ? data.keyPointsKa : [],
            halachaTakeawayKa: data.halachaTakeawayKa || '',
            sources: combinedSources.length > 0 ? combinedSources : mappedLocalSources,
            webSources: Array.isArray(data.webSources) ? data.webSources : [],
          });
          setGeminiLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to curated intelligent synthesis below
    }

    const top = localMatches[0];
    setGeminiResponse({
      question: q,
      answerKa: top
        ? `${top.explanationKa} — ეს საკითხი დეტალურად განიხილება წყაროში: ${top.sectionLabelKa} (${top.titleKa}). ქვემოთ მოცემულ წყაროებზე დაჭერით პირდაპირ გადახვალთ შესაბამის წიგნსა და დაფზე და მოინიშნება ზუსტი ადგილი.`
        : `თქვენს კითხვაზე („${q}“) მოძიებულია კლასიკური წყაროები თორადან, თალმუდიდან, რამბამიდან და შულხან არუხიდან. დააჭირეთ ნებისმიერ წყაროს პირდაპირ გადასასვლელად.`,
      answerHe: top?.quotedSnippetHe || 'ראה במקורות שלהלן בתורה, במשנה, בתלמוד ובפוסקים.',
      sources: mappedLocalSources,
    });
    setGeminiLoading(false);
  };

  const handleRunAiNav = async (qOverride?: string, scopeOverride?: string) => {
    const q = (qOverride ?? aiQuery).trim();
    const activeScope = scopeOverride ?? searchScope;

    const localMatches = searchAcrossCorpus(q, activeScope, currentDafData);
    setAiResults(localMatches);

    if (!q) return;

    setAiLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/talmud/ai-navigate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, scope: activeScope }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.tractateId || data.titleHe || data.realmId)) {
          const norm = normalizeAiTractateAndDaf(data.tractateId, data.dafId);
          const resolvedRealm: SacredRealmId =
            (data.realmId as SacredRealmId) || localMatches[0]?.realmId || 'talmud';
          const aiTopMatch: AiNavigationMatch = {
            id: `ai-live-${Date.now()}`,
            realmId: resolvedRealm,
            bookId: data.bookId || localMatches[0]?.bookId,
            chapter: Number(data.chapter) || localMatches[0]?.chapter || 1,
            tractateId: norm.tractateId,
            dafId: norm.dafId,
            section: data.section || localMatches[0]?.section || 'daf-section-gemara',
            sectionLabelKa:
              data.sectionLabelKa ||
              (resolvedRealm !== 'talmud'
                ? `AI ნაპოვნი წყარო • ${data.bookId || resolvedRealm} ${data.chapter || 1}`
                : `AI ნაპოვნი სუგია • ${norm.tractateId} ${norm.dafId}`),
            titleHe: data.titleHe || localMatches[0]?.titleHe || '',
            titleKa: data.titleKa || localMatches[0]?.titleKa || '',
            explanationKa: data.explanationKa || localMatches[0]?.explanationKa || '',
            quotedSnippetHe: data.quotedSnippetHe || localMatches[0]?.quotedSnippetHe || '',
            relatedLocations:
              Array.isArray(data.relatedLocations) && data.relatedLocations.length > 0
                ? data.relatedLocations
                : localMatches[0]?.relatedLocations || [],
          };
          setAiResults((prev) => {
            const withoutDup = prev.filter(
              (item) =>
                !(
                  item.tractateId === aiTopMatch.tractateId &&
                  item.dafId === aiTopMatch.dafId &&
                  item.bookId === aiTopMatch.bookId &&
                  item.titleHe === aiTopMatch.titleHe
                )
            );
            return [aiTopMatch, ...withoutDup].slice(0, 10);
          });
        }
      }
    } catch {
      // Keep local matches
    } finally {
      setAiLoading(false);
    }
  };

  const voiceTractateObj =
    TRACTATES.find((t) => t.id === selectedVoiceTractate) || TRACTATES[0];
  const voiceDafOptions: SelectOption[] = [];
  for (let d = 2; d <= voiceTractateObj.lastDaf; d++) {
    const heNum = toHebrewDafNumber(d);
    voiceDafOptions.push({
      value: `${d}a`,
      badgeHe: `דף ${heNum} ע״א`,
      label: `დაფი ${d}a`,
    });
    voiceDafOptions.push({
      value: `${d}b`,
      badgeHe: `דף ${heNum} ע״ב`,
      label: `დაფი ${d}b`,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voice-ai-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.44, ease: 'easeInOut' }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        >
          <motion.div
            key="voice-ai-modal-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#21160F] border-[#C49A6C]/50 text-[#FAF5EB]'
                : 'bg-[#FAF5EB] border-[#4A2E1B]/50 text-[#21160F]'
            }`}
          >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#5C3A21] via-[#C49A6C] to-[#8C6239]" />

        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-[#4A3020] bg-[#2B1D14]' : 'border-[#C49A6C]/60 bg-[#E8D8BE]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B,0_6px_14px_rgba(92,58,33,0.4)]'
                  : isDark
                    ? 'bg-[#362418] text-[#E8D8BE] hover:bg-[#463020]'
                    : 'bg-[#FAF5EB] text-[#3B2313] border border-[#8C6239]/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>ხმოვანი ნავიგაცია</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-b from-[#6B4226] via-[#5C3A21] to-[#3B2313] text-[#FAF5EB] border border-[#C49A6C]/60 shadow-[0_3px_0_#21150D,0_6px_14px_rgba(92,58,33,0.4)]'
                  : isDark
                    ? 'bg-[#362418] text-[#E8D8BE] hover:bg-[#463020]'
                    : 'bg-[#FAF5EB] text-[#3B2313] border border-[#8C6239]/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>გლობალური AI ნავიგაცია (כל הארון)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gemini')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'gemini'
                  ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 text-[#FAF5EB] border border-amber-300 shadow-[0_3px_0_#451a03,0_6px_14px_rgba(217,119,6,0.45)]'
                  : isDark
                    ? 'bg-[#362418] text-[#E8D8BE] hover:bg-[#463020]'
                    : 'bg-[#FAF5EB] text-[#3B2313] border border-[#8C6239]/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>ჰკითხე Gemini-ს (წყაროებით)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#4A3020]/40 hover:bg-[#4A3020]/70 text-[#FAF5EB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {activeTab === 'voice' ? (
            <div className="space-y-4">
              {/* Language Switcher for Voice Recognition */}
              <div className="flex items-center justify-center gap-2">
                {(
                  [
                    { id: 'ka-GE', label: '🇬🇪 ქართული' },
                    { id: 'he-IL', label: '🇮🇱 עברית' },
                    { id: 'en-US', label: '🇺🇸 English' },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setVoiceLang(l.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                      voiceLang === l.id
                        ? 'bg-[#5C3A21] text-[#FAF5EB] border border-[#C49A6C]/60 shadow'
                        : isDark
                          ? 'bg-[#2E1F15] text-[#E8D8BE]'
                          : 'bg-[#E8D8BE] text-[#3B2313]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* 3D Microphone Orb + Active Voice Dictation Box */}
              <div
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                  isListening
                    ? isDark
                      ? 'bg-red-950/35 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                      : 'bg-red-100 border-red-500'
                    : isDark
                      ? 'bg-[#2B1D14]/85 border-[#8C6239]/45'
                      : 'bg-[#EFE4D0] border-[#8C6239]/45'
                }`}
              >
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isListening
                      ? 'bg-gradient-to-b from-red-400 via-red-500 to-red-700 text-white shadow-[0_6px_0_#7f1d1d,0_0_35px_rgba(239,68,68,0.85)] animate-pulse scale-105'
                      : 'bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border-2 border-[#FAF5EB] shadow-[0_6px_0_#4A2E1B,0_12px_25px_rgba(92,58,33,0.45)] hover:translate-y-[-2px] active:translate-y-[2px]'
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <div className="mt-3 text-sm font-extrabold flex items-center gap-1.5">
                  {isListening && <Radio className="w-4 h-4 text-red-400 animate-ping" />}
                  <span>
                    {isListening
                      ? 'მიკროფონი ჩართულია — წარმოთქვით ბრძანება!'
                      : 'დააჭირეთ 3D მიკროფონს ხმოვანი მართვისთვის'}
                  </span>
                </div>
                <p className="text-xs opacity-85 mt-1 max-w-md">{voiceFeedback}</p>

                {isListening && (
                  <div className="w-full max-w-xs mt-2">
                    <div className="h-2 w-full rounded-full bg-[#21160F] overflow-hidden border border-red-500/40">
                      <div
                        style={{ width: `${Math.max(12, audioLevel)}%` }}
                        className="h-full bg-gradient-to-r from-[#E8D8BE] via-red-500 to-rose-400 transition-all duration-75"
                      />
                    </div>
                  </div>
                )}

                {/* Live Voice Dictation & Instant Auto-Trigger Input (Works on 100% of Android APK & Mobile Keyboards!) */}
                <div className="w-full max-w-md mt-3">
                  <div className="flex gap-2">
                    <input
                      ref={dictationInputRef}
                      type="text"
                      value={transcript}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTranscript(val);
                        if (autoRunTimerRef.current) {
                          window.clearTimeout(autoRunTimerRef.current);
                        }
                        if (val.trim().length >= 3) {
                          autoRunTimerRef.current = window.setTimeout(() => {
                            processSpokenTranscript(val);
                          }, 1100);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && transcript.trim()) {
                          if (autoRunTimerRef.current) {
                            window.clearTimeout(autoRunTimerRef.current);
                          }
                          processSpokenTranscript(transcript);
                        }
                      }}
                      placeholder="🎙️ ილაპარაკეთ მიკროფონში ან კლავიატურის მიკროფონით (მაგ. თაანით 2a, მიშნა)..."
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        isListening
                          ? isDark
                            ? 'bg-[#1D130C] border-[#C49A6C] text-[#FAF5EB] ring-2 ring-[#C49A6C]/40'
                            : 'bg-white border-[#5C3A21] text-[#21160F] ring-2 ring-[#5C3A21]/40'
                          : isDark
                            ? 'bg-[#1D130C] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-[#FAF5EB] border-[#8C6239] text-[#21160F]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => processSpokenTranscript(transcript || 'თაანით 2a')}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B] whitespace-nowrap"
                    >
                      გაშვება
                    </button>
                  </div>
                </div>

                {/* When Microphone is active, show instant 1-tap spoken simulation buttons right inside the orb */}
                {isListening && (
                  <div className="mt-3 pt-3 border-t border-[#C49A6C]/30 w-full">
                    <div className="text-[11px] font-bold text-[#DECAA9] mb-2">
                      ⚡ აირჩიეთ ან წარმოთქვით ხმოვანი ბრძანება:
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {[
                        { label: '🎙️ „თაანით 2a“', text: 'თაანით 2a' },
                        { label: '🎙️ „ბერახოთ 2a“', text: 'ბერახოთ 2a' },
                        { label: '🎙️ „წაიკითხე მიშნა“', text: 'წაიკითხე მიშნა' },
                        { label: '🎙️ „წაიკითხე გემარა“', text: 'წაიკითხე გემარა' },
                        { label: '🎙️ „შემდეგი დაფი“', text: 'შემდეგი დაფი' },
                        { label: '🎙️ „წინა დაფი“', text: 'წინა დაფი' },
                        { label: '🎙️ „თოსაფოთი“', text: 'თოსაფოთი' },
                        { label: '🎙️ „რაში“', text: 'რაში' },
                      ].map((b) => (
                        <button
                          key={b.text}
                          type="button"
                          onClick={() => processSpokenTranscript(b.text)}
                          className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#5C3A21] text-[#FAF5EB] hover:bg-[#6E472B] shadow cursor-pointer"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {transcribingAudio && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#DECAA9] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>მიმდინარეობს ხმის AI დამუშავება...</span>
                  </div>
                )}
              </div>

              {/* 1-Tap Quick Voice Action Pills */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  სწრაფი ხმოვანი ბრძანებები (1 დაჭერით):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🔊 წაიკითხე მიშნა', cmd: 'read:mishnah' },
                    { label: '🔊 წაიკითხე გემარა', cmd: 'read:gemara' },
                    { label: '📖 თაანით 2a', cmd: 'nav:Taanit:2a' },
                    { label: '📖 ბერახოთ 2a', cmd: 'nav:Berakhot:2a' },
                    { label: '➡️ შემდეგი დაფი', cmd: 'action:next' },
                    { label: '⬅️ წინა დაფი', cmd: 'action:prev' },
                    { label: '🔍 მიშნა', cmd: 'scroll:daf-section-mishnah' },
                    { label: '🔍 თოსაფოთი', cmd: 'scroll:daf-section-tosafot' },
                  ].map((item) => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => executeCommandCode(item.cmd)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                        isDark
                          ? 'bg-[#2E1F15] hover:bg-[#3D291C] text-[#FAF5EB] border border-[#C49A6C]/40 shadow-[0_2px_0_#1A110B]'
                          : 'bg-[#E8D8BE] hover:bg-[#DECAA9] text-[#2B1B10] border border-[#5C3A21]/40 shadow-[0_2px_0_#8C6239]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Voice Commands in a Searchable Dropdown */}
              <SearchableSelect
                label="ყველა ხმოვანი ბრძანება დროფდაუნში (აირჩიეთ და შესრულდება):"
                options={VOICE_COMMAND_OPTIONS}
                value={selectedVoiceCmd}
                onChange={(cmd) => executeCommandCode(cmd)}
                isDark={isDark}
                searchPlaceholder="მოძებნეთ ბრძანება (მიშნა, გემარა, თაანით, წაკითხვა)..."
              />

              {/* Direct Tractate + Daf Selector inside Voice Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-[#8C6239]/25 items-end">
                <div className="sm:col-span-6">
                  <SearchableSelect
                    label="ტრაქტატის არჩევა:"
                    options={TRACTATES.map((t) => ({
                      value: t.id,
                      badgeHe: t.nameHe,
                      label: t.nameKa,
                    }))}
                    value={selectedVoiceTractate}
                    onChange={(trId) => {
                      setSelectedVoiceTractate(trId);
                      setSelectedVoiceDaf('2a');
                    }}
                    isDark={isDark}
                  />
                </div>
                <div className="sm:col-span-3">
                  <SearchableSelect
                    label="დაფი:"
                    options={voiceDafOptions}
                    value={selectedVoiceDaf}
                    onChange={(d) => setSelectedVoiceDaf(d)}
                    isDark={isDark}
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToDaf(selectedVoiceTractate, selectedVoiceDaf);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-full text-xs font-bold cursor-pointer bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B]"
                  >
                    გადასვლა
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'ai' ? (
            <div className="space-y-4">
              {/* 1. CLEAR SEARCH SCOPE DROPDOWN WITH "ყველგან" (EVERYWHERE) AS DEFAULT */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-[#2B1D14]/75 border-[#C49A6C]/40'
                    : 'bg-[#F5EBDC] border-[#B89768]'
                }`}
              >
                <SearchableSelect
                  label="სად ვეძებოთ? (გლობალური ძიების არეალი — ნაგულისხმევად მონიშნულია „ყველგან“ მთელ ბიბლიოთეკაში):"
                  options={AI_SEARCH_SCOPE_OPTIONS}
                  value={searchScope}
                  onChange={(nextScope) => {
                    setSearchScope(nextScope);
                    handleRunAiNav(aiQuery, nextScope);
                  }}
                  isDark={isDark}
                  searchPlaceholder="აირჩიეთ „ყველგან“, თორა, ნევიიმი, ქეთუვიმი, მიშნა, თალმუდი, რამბამი, ტური, შულხან არუხი..."
                />
                <div className="mt-1.5 text-[11px] opacity-80 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {searchScope === 'all'
                      ? '✅ არჩეულია: „ყველგან“ — გლობალური ძიება თორაში, ნევიიმში, ქეთუვიმში, მიშნაში, თალმუდში, რამბამში, ტურსა და შულხან არუხში.'
                      : '🎯 ძიება გაფილტრულია თქვენ მიერ არჩეული წიგნით / განყოფილებით.'}
                  </span>
                  {searchScope !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchScope('all');
                        handleRunAiNav(aiQuery, 'all');
                      }}
                      className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold cursor-pointer shrink-0 bg-amber-500/20 border border-amber-500/50"
                    >
                      ყველგან ძიებაზე დაბრუნება
                    </button>
                  )}
                </div>
              </div>

              {/* 2. MAIN AI SEARCH INPUT BAR + ASK GEMINI BUTTON */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAiNav();
                }}
                className="flex flex-wrap sm:flex-nowrap gap-2"
              >
                <div
                  className={`flex-1 min-w-[200px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border ${
                    isDark
                      ? 'bg-[#1D130C] border-[#C49A6C]/55 text-[#FAF5EB]'
                      : 'bg-[#FFFDF9] border-[#8C6239] text-[#21160F]'
                  }`}
                >
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => {
                      const nextQ = e.target.value;
                      setAiQuery(nextQ);
                      setAiResults(searchAcrossCorpus(nextQ, searchScope, currentDafData));
                    }}
                    placeholder="ჩაწერეთ საძიებო სიტყვა, პასუკი, სუგია, წიგნი ან კითხვა (ქართულად / ებრაულად)..."
                    className="flex-1 min-w-0 bg-transparent text-xs font-semibold outline-none"
                  />
                  {aiQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiQuery('');
                        setAiResults(searchAcrossCorpus('', searchScope, currentDafData));
                      }}
                      title="გასუფთავება"
                      className="p-1 rounded-full opacity-75 hover:opacity-100 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <VoiceSearchMicButton
                    onTranscript={(spoken) => {
                      setAiQuery(spoken);
                      setAiResults(searchAcrossCorpus(spoken, searchScope, currentDafData));
                    }}
                    isDark={isDark}
                    size="sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B]"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Compass className="w-4 h-4" />
                  )}
                  <span>AI ძიება</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const qToAsk = aiQuery.trim() || 'როდის იწყება საღამოს შემას კითხვა?';
                    setGeminiQuestion(qToAsk);
                    setActiveTab('gemini');
                    handleAskGemini(qToAsk);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 text-[#FAF5EB] border border-amber-300 shadow-[0_3px_0_#451a03]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ჰკითხე Gemini-ს</span>
                </button>
              </form>

              {/* 3. QUICK 1-CLICK SEARCH SUGGESTION CHIPS ACROSS ALL REALMS */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold opacity-80">
                  გლობალური სწრაფი საძიებო თემები (თორა • ნახი • მიშნა • თალმუდი • რამბამი • შულხან არუხი):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchScope('all');
                      setAiQuery('');
                      setAiResults(searchAcrossCorpus('', 'all', currentDafData));
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer border ${
                      searchScope === 'all' && !aiQuery
                        ? 'ring-2 ring-amber-500 font-black bg-amber-500/20'
                        : isDark
                          ? 'bg-[#2E1F15] border-[#C49A6C]/35'
                          : 'bg-[#E8D8BE] border-[#8C6239]/40'
                    }`}
                  >
                    🌐 ყველგან (მთელი წმინდა ბიბლიოთეკა)
                  </button>
                  {AI_QUICK_SUGGESTIONS.map((chip) => (
                    <button
                      key={chip.query}
                      type="button"
                      onClick={() => {
                        setAiQuery(chip.query);
                        handleRunAiNav(chip.query, searchScope);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer border ${
                        isDark
                          ? 'bg-[#2E1F15] hover:bg-[#3D291C] border-[#C49A6C]/35 text-[#FAF5EB]'
                          : 'bg-[#E8D8BE] hover:bg-[#DECAA9] border-[#8C6239]/40 text-[#21160F]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. MULTI-RESULT LIST WITH EXACT JUMP & HIGHLIGHT ACROSS ALL REALMS */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-extrabold opacity-85 px-1">
                  <span>
                    ნაპოვნი წყაროები ({aiResults.length}): დააჭირეთ სასურველ წყაროს ზუსტ ადგილზე გადასასვლელად
                  </span>
                </div>

                {aiResults.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                      isDark
                        ? 'bg-[#2B1D14]/90 border-[#C49A6C]/45 hover:border-[#E8D8BE]'
                        : 'bg-[#F5EBDC] border-[#B89768] hover:border-[#6B4226]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 mb-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{item.sectionLabelKa}</span>
                        </div>
                        <div className="text-xs font-extrabold">{item.titleKa}</div>
                        <div dir="rtl" className="font-serif text-sm sm:text-base font-black mt-0.5">
                          {item.titleHe}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigateToExactSource(item)}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B] hover:brightness-105 active:translate-y-[1px]"
                        >
                          <span>გადასვლა ზუსტ ადგილზე</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      dir="rtl"
                      onClick={() => navigateToExactSource(item)}
                      title="დააჭირეთ ამ წყაროზე პირდაპირ გადასასვლელად და ტექსტის მოსანიშნად"
                      className={`p-2.5 rounded-xl border font-serif text-sm font-bold cursor-pointer transition-all hover:scale-[1.005] ${
                        isDark
                          ? 'bg-[#1D130C] border-[#5C3A21] text-[#FAF3E3]'
                          : 'bg-[#FFFDF9] border-[#C8B28E] text-[#21160F]'
                      }`}
                    >
                      {item.quotedSnippetHe}
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">{item.explanationKa}</p>

                    {item.relatedLocations && item.relatedLocations.length > 0 && (
                      <div className="pt-2 border-t border-[#8C6239]/25 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 mr-1">
                          პარალელური წყაროები (დააჭირეთ გადასასვლელად):
                        </span>
                        {item.relatedLocations.map((loc, idx) => (
                          <button
                            key={`${item.id}-${loc.tractateId}-${loc.dafId}-${loc.bookId || ''}-${idx}`}
                            type="button"
                            onClick={() =>
                              navigateToExactSource({
                                realmId: loc.realmId || 'talmud',
                                bookId: loc.bookId,
                                chapter: loc.chapter,
                                tractateId: loc.tractateId,
                                dafId: loc.dafId,
                                section: item.section || 'daf-section-gemara',
                                quotedSnippetHe: item.quotedSnippetHe,
                                titleKa: loc.labelKa,
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                              isDark
                                ? 'bg-[#1D130C] hover:bg-[#362418] border-[#C49A6C]/45 text-[#FAF5EB]'
                                : 'bg-[#FFFDF9] hover:bg-[#E8D8BE] border-[#8C6239]/50 text-[#2B1B10]'
                            }`}
                          >
                            <span>{loc.labelKa}</span>
                            <span dir="rtl" className="font-serif opacity-80">
                              ({loc.labelHe})
                            </span>
                            <ArrowRight className="w-3 h-3 opacity-75" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ============================================================================
               TAB 3: ASK GEMINI AI WITH CLICKABLE RABBINIC SOURCES (שאל את Gemini + מקורות)
               ============================================================================ */
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark
                    ? 'bg-[#2B1D14]/85 border-amber-500/45'
                    : 'bg-[#F5EBDC] border-amber-700/45'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    დაუსვით ნებისმიერი კითხვა Gemini AI-ს — პასუხთან ერთად მიიღებთ პირდაპირ გადასასვლელ წყაროებს!
                  </span>
                </div>
                <p className="text-[11px] opacity-85">
                  Gemini მოგიძებნით პასუხს თორაში, ნევიიმში, ქეთუვიმში, მიშნაში, თალმუდში, რამბამსა და შულხან არუხში. დააჭირეთ დაბრუნებულ ნებისმიერ წყაროს და აპლიკაცია პირდაპირ გადაგიყვანთ ზუსტ წიგნსა და დაფზე!
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskGemini();
                  }}
                  className="mt-3 flex flex-wrap sm:flex-nowrap gap-2"
                >
                  <div
                    className={`flex-1 min-w-[200px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border ${
                      isDark
                        ? 'bg-[#1D130C] border-[#C49A6C]/60 text-[#FAF5EB]'
                        : 'bg-[#FFFDF9] border-[#8C6239] text-[#21160F]'
                    }`}
                  >
                    <input
                      type="text"
                      value={geminiQuestion}
                      onChange={(e) => setGeminiQuestion(e.target.value)}
                      placeholder="დასვით კითხვა (მაგ.: რა კანონია ნაპოვნი ნივთის დაბრუნებაზე? როდის იკითხება შემა? რა არის ჰანუკის სანთლების წესი?)..."
                      className="flex-1 min-w-0 bg-transparent text-xs font-semibold outline-none"
                    />
                    <VoiceSearchMicButton
                      onTranscript={(spoken) => setGeminiQuestion(spoken)}
                      isDark={isDark}
                      size="sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={geminiLoading}
                    className="px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 text-[#FAF5EB] border border-amber-300 shadow-[0_3px_0_#451a03]"
                  >
                    {geminiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>კითხვის გაგზავნა</span>
                  </button>
                </form>

                {/* Quick sample questions for 1-tap Gemini Q&A */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[
                    'როდის იწყება საღამოს „შემას“ კითხვა?',
                    'რა კანონია ნაპოვნი ნივთის (השבת אבידה) დაბრუნებაზე?',
                    'როგორ ინთება ჰანუკის სანთლები შაბათსა და კვირის დღეებში?',
                    'სად წერია წვიმის ძალების მოხსენიება და თაანითის კანონები?',
                    'რატომ შეიქმნა ადამიანი ერთადერთი (სანჰედრინი 37a)?',
                    'სწავლა უფრო დიდია თუ საქმე (კידუშინი 40b)?',
                  ].map((sampleQ) => (
                    <button
                      key={sampleQ}
                      type="button"
                      onClick={() => {
                        setGeminiQuestion(sampleQ);
                        handleAskGemini(sampleQ);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold cursor-pointer border ${
                        isDark
                          ? 'bg-[#1D130C] hover:bg-[#362418] border-[#C49A6C]/40 text-[#FAF5EB]'
                          : 'bg-[#FFFDF9] hover:bg-[#E8D8BE] border-[#8C6239]/45 text-[#2B1B10]'
                      }`}
                    >
                      ❓ {sampleQ}
                    </button>
                  ))}
                </div>
              </div>

              {/* GEMINI ANSWER + CLICKABLE SOURCES CARD */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark
                    ? 'bg-[#251810] border-[#C49A6C]/55'
                    : 'bg-[#FFFDF9] border-[#8C6239]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#8C6239]/30 pb-2">
                  <div className="text-xs font-black text-amber-600 dark:text-amber-300">
                    🤖 Gemini AI-ს პასუხი კითხვაზე: „{geminiResponse.question}“
                  </div>
                  {geminiLoading && (
                    <span className="text-[11px] font-bold flex items-center gap-1 text-amber-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      მუშავდება...
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                  {geminiResponse.answerKa}
                </p>

                {geminiResponse.answerHe && (
                  <div
                    dir="rtl"
                    className={`p-2.5 rounded-xl border font-serif text-sm font-bold ${
                      isDark
                        ? 'bg-[#1A110B] border-[#5C3A21] text-[#FAF3E3]'
                        : 'bg-[#F5EBDC] border-[#C49A6C] text-[#21160F]'
                    }`}
                  >
                    {geminiResponse.answerHe}
                  </div>
                )}

                {geminiResponse.keyPointsKa && geminiResponse.keyPointsKa.length > 0 && (
                  <div
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDark
                        ? 'bg-[#1E140D] border-[#C49A6C]/40'
                        : 'bg-[#FAF3E6] border-[#C49A6C]/60'
                    }`}
                  >
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>მთავარი თეზისები და დასკვნები:</span>
                    </div>
                    <ul className="space-y-1">
                      {geminiResponse.keyPointsKa.map((pt, idx) => (
                        <li key={idx} className="text-xs font-semibold flex items-start gap-2 leading-relaxed">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/25 border border-amber-500/50 text-[10px] font-black shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {geminiResponse.halachaTakeawayKa && (
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark
                        ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-100'
                        : 'bg-emerald-50 border-emerald-600/40 text-emerald-950'
                    }`}
                  >
                    <div className="text-[10.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300 mb-0.5">
                      ⚖️ პრაქტიკული ჰალახა (הלכה למעשה):
                    </div>
                    <div className="text-xs font-bold leading-relaxed">
                      {geminiResponse.halachaTakeawayKa}
                    </div>
                  </div>
                )}

                {/* CLICKABLE SOURCES LIST RETURNED BY GEMINI */}
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-extrabold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      პასუხში მოყვანილი წყაროები ({geminiResponse.sources.length}) — დააჭირეთ ნებისმიერ წყაროს პირდაპირ გადასასვლელად:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {geminiResponse.sources.map((src) => (
                      <div
                        key={src.id}
                        onClick={() => navigateToExactSource(src)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.005] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isDark
                            ? 'bg-[#2E1F15] hover:bg-[#3A271B] border-[#C49A6C]/50'
                            : 'bg-[#F5EBDC] hover:bg-[#E8D8BE] border-[#8C6239]/55'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-xs font-extrabold flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/25 border border-amber-500/50">
                              {src.realmId && src.realmId !== 'talmud'
                                ? SACRED_REALMS.find((r) => r.id === src.realmId)?.titleKa || src.realmId
                                : `თალმუდი • ${src.tractateId || 'Berakhot'} ${src.dafId || '2a'}`}
                            </span>
                            <span>{src.titleKa}</span>
                          </div>
                          {src.titleHe && (
                            <div dir="rtl" className="font-serif text-xs sm:text-sm font-black opacity-95">
                              {src.titleHe}
                            </div>
                          )}
                          {src.quotedSnippetHe && (
                            <div
                              dir="rtl"
                              className="font-serif text-xs opacity-90 px-2 py-1 rounded bg-black/15 border border-[#C49A6C]/30"
                            >
                              „{src.quotedSnippetHe}“
                            </div>
                          )}
                          {src.explanationKa && (
                            <div className="text-[11px] opacity-85">{src.explanationKa}</div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToExactSource(src);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#2B1B10] border border-[#FAF5EB] shadow-[0_3px_0_#4A2E1B]"
                        >
                          <span>გადასვლა წყაროზე</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GOOGLE SEARCH GROUNDING WEB SOURCES */}
                {geminiResponse.webSources && geminiResponse.webSources.length > 0 && (
                  <div className="pt-2 border-t border-[#8C6239]/25 space-y-1.5">
                    <div className="text-[11px] font-extrabold flex items-center gap-1.5 text-sky-600 dark:text-sky-300">
                      <Globe className="w-3.5 h-3.5" />
                      <span>🌐 Gemini Google Search-ის ვებ-წყაროები ({geminiResponse.webSources.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {geminiResponse.webSources.map((ws, idx) => (
                        <a
                          key={`${ws.uri}-${idx}`}
                          href={ws.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 border transition-all ${
                            isDark
                              ? 'bg-[#1A2636] hover:bg-[#23354C] border-sky-400/40 text-sky-100'
                              : 'bg-sky-50 hover:bg-sky-100 border-sky-600/40 text-sky-950'
                          }`}
                        >
                          <span className="truncate max-w-[240px]">{ws.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
