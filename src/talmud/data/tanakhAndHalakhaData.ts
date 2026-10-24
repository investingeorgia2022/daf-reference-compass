// @ts-nocheck
import { TalmudSentence } from '../types/talmud';
import {
  YALKUT_YOSEF_KITZUR_BOOKS,
  buildYalkutYosefSacredPage,
} from './yalkutYosefKitzurData';

export type SacredRealmId =
  | 'talmud'
  | 'siddur'
  | 'mishnayot'
  | 'torah'
  | 'neviim'
  | 'ketuvim'
  | 'rambam'
  | 'tur'
  | 'shulchan-aruch'
  | 'mishnah-berurah'
  | 'yalkut-yosef'
  | 'daily-halakhot'
  | 'sephardic-halakha'
  | 'blessings'
  | 'calendar';

export interface SacredRealmMeta {
  id: SacredRealmId;
  titleKa: string;
  titleHe: string;
  subtitleKa: string;
  category: 'tanakh' | 'talmud' | 'halakha' | 'blessings' | 'calendar';
  accentColor: string;
  continentLat: number;
  continentLon: number;
  badgeHe: string;
}

export const SACRED_REALMS: SacredRealmMeta[] = [
  {
    id: 'siddur',
    titleKa: 'სიდური • סידור כוונת הלב',
    titleHe: 'סידור התפילה • כוונת הלב השלם',
    subtitleKa:
      'ჩვეულებრივი სიდური და סידור כוונת הלב השלם (PDF ინტერაქტიული დაფი, ქავანოთი და ჰალახა)',
    category: 'blessings',
    accentColor: '#F59E0B',
    continentLat: 30,
    continentLon: 36,
    badgeHe: 'סידור כוונת הלב',
  },
  {
    id: 'torah',
    titleKa: 'თორა (ხუმაში)',
    titleHe: 'תורה • חמשה חומשי תורה',
    subtitleKa: 'მიკრაოთ გედოლოთის დაფი: ონკელოსი, რაში, იბნ ყეზრა, რამბანი, სფორნო, ორ ჰახაიმი',
    category: 'tanakh',
    accentColor: '#F59E0B',
    continentLat: 28,
    continentLon: 0,
    badgeHe: 'תורה',
  },
  {
    id: 'neviim',
    titleKa: 'ნევიიმ (წინასწარმეტყველნი)',
    titleHe: 'נביאים • ראשונים ואחרונים',
    subtitleKa: 'კლასიკური დაფი: თარგუმ იონათანი, რაში, რადაკი, მეცუდათ დავიდი, მეცუდათ ციონი, მალბიმი',
    category: 'tanakh',
    accentColor: '#10B981',
    continentLat: 24,
    continentLon: 72,
    badgeHe: 'נביאים',
  },
  {
    id: 'ketuvim',
    titleKa: 'ქეთუვიმ (წერილნი)',
    titleHe: 'כתובים • תהילים, משלי, איוב ומגילות',
    subtitleKa: 'კლასიკური დაფი: რაში, იბნ ყეზრა, მეცუდათ დავიდი, მეცუდათ ციონი, მალბიმი, მეირი',
    category: 'tanakh',
    accentColor: '#3B82F6',
    continentLat: 22,
    continentLon: 144,
    badgeHe: 'כתובים',
  },
  {
    id: 'mishnayot',
    titleKa: 'მიშნა (შისა სიდრეი მიშნა)',
    titleHe: 'ששה סדרי משנה • ברטנורא, קהתי ומפרשים',
    subtitleKa: '63 ტრაქტატი: ბარტენურა (רע״ב), ფინხას კეჰათი (קהתי), თოსაფოთ იომ ტოვი, რამბამი, თიფერეთ ისრაელი, მეირი',
    category: 'talmud',
    accentColor: '#C27803',
    continentLat: 20,
    continentLon: 180,
    badgeHe: 'משניות',
  },
  {
    id: 'talmud',
    titleKa: 'თალმუდ ბავლი 3D',
    titleHe: 'תלמוד בבלי • ש״ס וילנא',
    subtitleKa: 'ვილნის შასის კლასიკური დაფი: მიშნა, გემარა, რაში, თოსაფოთი და ყველა მეფორშიმი',
    category: 'talmud',
    accentColor: '#D97706',
    continentLat: 18,
    continentLon: 216,
    badgeHe: 'תלמוד',
  },
  {
    id: 'rambam',
    titleKa: 'რამბამი და ნოსე ქელიმ',
    titleHe: 'רמב״ם • משנה תורה ונושאי כליו',
    subtitleKa: 'ფრანკელის დაფი: ქესეფ მიშნე, მაგიდ მიშნე, რაავადი, ლეხემ მიშნე, მიგდალ ყოზი, მიშნე ლამელეხი',
    category: 'halakha',
    accentColor: '#8B5CF6',
    continentLat: 25,
    continentLon: 288,
    badgeHe: 'רמב״ם',
  },
  {
    id: 'tur',
    titleKa: 'ტურ-შულხან ყარუხი',
    titleHe: 'ארבעה טורים • בית יוסף ודרכי משה',
    subtitleKa: 'კლასიკური ტურის დაფი: ბეთ იოსეფი, დარხეი მოშე, ბახი (ב״ח), დריშა და ფერიშა',
    category: 'halakha',
    accentColor: '#EC4899',
    continentLat: -22,
    continentLon: 36,
    badgeHe: 'טור',
  },
  {
    id: 'shulchan-aruch',
    titleKa: 'შულხან ყარუხი (კლასიკური დაფი)',
    titleHe: 'שולחן ערוך • מרן והרמ״א עם נושאי כלים',
    subtitleKa: 'ლემბერგის/ვილნის დაფი: მახაბერი, რამა, ტაზი (ט״ז), შახი (ש״ך), მაგენ აბრაამი, ბეერ ჰეიტები',
    category: 'halakha',
    accentColor: '#14B8A6',
    continentLat: -24,
    continentLon: 108,
    badgeHe: 'שו״ע',
  },
  {
    id: 'mishnah-berurah',
    titleKa: 'მიშნა ბრურა (კლასიკური დაფი)',
    titleHe: 'משנה ברורה • ביאור הלכה ושער הציון',
    subtitleKa: 'ხაფეც ხაიმის დაფი: შულხან ყარუხი, მიშნა ბრურა, ბიურ ჰალახა, შაყარ ჰაციონი, ბეერ ჰაგოლა',
    category: 'halakha',
    accentColor: '#06B6D4',
    continentLat: -25,
    continentLon: 180,
    badgeHe: 'מ״ב',
  },
  {
    id: 'yalkut-yosef',
    titleKa: 'იალკუტ იოსეფი - კიცურ შულხან არუხი',
    titleHe: 'ילקוט יוסף - קיצור שולחן ערוך',
    subtitleKa:
      'მარან რაბი ოვადია იოსეფისა და რიშონ ლეციონ რაბი იცხაკ იოსეფის პრაქტიკული ჰალახის ჭკვიანი კოდექსი (4 ნაწილი: אורח חיים, יורה דעה, אבן העזר, חושן משפט)',
    category: 'halakha',
    accentColor: '#EA580C',
    continentLat: -18,
    continentLon: 215,
    badgeHe: 'ילקוט יוסף - קיצור שו״ע',
  },
  {
    id: 'daily-halakhot',
    titleKa: 'ყოველდღიური ორი ჰალახა',
    titleHe: 'שתי הלכות בכל יום • הלכה יומית',
    subtitleKa:
      '„ვინც ყოველდღე სწავლობს 2 ჰალახას, აღთქმული აქვს მომავალი სამყარო“ — დილისა და საღამოს ჰალახა თვითშემოწმებით',
    category: 'halakha',
    accentColor: '#10B981',
    continentLat: -14,
    continentLon: 195,
    badgeHe: 'ב׳ הלכות ביום',
  },
  {
    id: 'sephardic-halakha',
    titleKa: 'სეფარადული ჰალახის სკოლა',
    titleHe: 'בית המדרש להלכה ספרדית • פוסקי ספרד',
    subtitleKa: 'მარან ყოვადია იოსეფი, ბენ იშ ხაი, ქაფ ჰახაიმი, ორ ლეციონი (რავ ბენ ციონ აბა შაული), რავ მოშე ლევი',
    category: 'halakha',
    accentColor: '#F97316',
    continentLat: -22,
    continentLon: 252,
    badgeHe: 'הלכה ספרדית',
  },
  {
    id: 'calendar',
    titleKa: 'ებრაული ჰალახური კალენდარი',
    titleHe: 'לוח שנה הלכתי • הילולא דצדיקים',
    subtitleKa: 'ებრაულ-გრიგორიანული კალენდარი, წლიური დღესასწაულები, ცადიკების ჰილულა და ბიოგრაფიები',
    category: 'calendar',
    accentColor: '#EAB308',
    continentLat: -20,
    continentLon: 324,
    badgeHe: 'לוח שנה',
  },
];

export interface SacredBookItem {
  id: string;
  sefariaRef: string;
  nameKa: string;
  nameHe: string;
  subGroupKa: string;
  subGroupHe: string;
  chaptersCount: number;
  parshiot?: { id: string; nameKa: string; nameHe: string; startRef: string }[];
}

export const TORAH_BOOKS: SacredBookItem[] = [
  {
    id: 'Genesis',
    sefariaRef: 'Genesis',
    nameKa: 'ბერეშითი (დაბადება)',
    nameHe: 'בראשית',
    subGroupKa: 'ხუმაშ ბერეშითი',
    subGroupHe: 'חומש בראשית',
    chaptersCount: 50,
    parshiot: [
      { id: 'bereshit', nameKa: 'ბერეშით', nameHe: 'פרשת בראשית', startRef: '1' },
      { id: 'noach', nameKa: 'ნოახ', nameHe: 'פרשת נח', startRef: '6' },
      { id: 'lech-lecha', nameKa: 'ლეხ-ლეხა', nameHe: 'פרשת לך לך', startRef: '12' },
      { id: 'vayera', nameKa: 'ვაიერა', nameHe: 'פרשת וירא', startRef: '18' },
      { id: 'chayei-sarah', nameKa: 'ხაიე სარა', nameHe: 'פרשת חיי שרה', startRef: '23' },
      { id: 'toldot', nameKa: 'თოლდოთ', nameHe: 'פרשת תולדות', startRef: '25' },
      { id: 'vayetzei', nameKa: 'ვაიეცე', nameHe: 'פרשת ויצא', startRef: '28' },
      { id: 'vayishlach', nameKa: 'ვაიშლახ', nameHe: 'פרשת וישלח', startRef: '32' },
      { id: 'vayeshev', nameKa: 'ვაიეშევ', nameHe: 'פרשת וישב', startRef: '37' },
      { id: 'miketz', nameKa: 'მიკეც', nameHe: 'פרשת מקץ', startRef: '41' },
      { id: 'vayigash', nameKa: 'ვაიგაშ', nameHe: 'פרשת ויגש', startRef: '44' },
      { id: 'vayechi', nameKa: 'ვაიხი', nameHe: 'פרשת ויחי', startRef: '47' },
    ],
  },
  {
    id: 'Exodus',
    sefariaRef: 'Exodus',
    nameKa: 'შემოთი (გამოსვლა)',
    nameHe: 'שמות',
    subGroupKa: 'ხუმაშ შემოთი',
    subGroupHe: 'חומש שמות',
    chaptersCount: 40,
    parshiot: [
      { id: 'shemot', nameKa: 'შემოთ', nameHe: 'פרשת שמות', startRef: '1' },
      { id: 'vaera', nameKa: 'ვაერა', nameHe: 'פרשת וארא', startRef: '6' },
      { id: 'bo', nameKa: 'ბო', nameHe: 'פרשת בא', startRef: '10' },
      { id: 'beshalach', nameKa: 'ბეშალახ', nameHe: 'פרשת בשלח', startRef: '13' },
      { id: 'yitro', nameKa: 'ითრო', nameHe: 'פרשת יתרו', startRef: '18' },
      { id: 'mishpatim', nameKa: 'მიშფატიმ', nameHe: 'פרשת משפטים', startRef: '21' },
      { id: 'terumah', nameKa: 'თერუმა', nameHe: 'פרשת תרומה', startRef: '25' },
      { id: 'tetzaveh', nameKa: 'თეცავე', nameHe: 'פרשת תצוה', startRef: '27' },
      { id: 'ki-tisa', nameKa: 'ქი თისა', nameHe: 'פרשת כי תשא', startRef: '30' },
      { id: 'vayakhel', nameKa: 'ვაიაკჰელ', nameHe: 'פרשת ויקהל', startRef: '35' },
      { id: 'pekudei', nameKa: 'ფეკუდეი', nameHe: 'פרשת פקודי', startRef: '38' },
    ],
  },
  {
    id: 'Leviticus',
    sefariaRef: 'Leviticus',
    nameKa: 'ვაიკრა (ლევიანნი)',
    nameHe: 'ויקרא',
    subGroupKa: 'ხუმაშ ვაიკრა',
    subGroupHe: 'חומש ויקרא',
    chaptersCount: 27,
    parshiot: [
      { id: 'vayikra', nameKa: 'ვაიკრა', nameHe: 'פרשת ויקרא', startRef: '1' },
      { id: 'tzav', nameKa: 'ცავ', nameHe: 'פרשת צו', startRef: '6' },
      { id: 'shemini', nameKa: 'შემინი', nameHe: 'פרשת שמיני', startRef: '9' },
      { id: 'tazria', nameKa: 'თაზრიაყ', nameHe: 'פרשת תזריע', startRef: '12' },
      { id: 'metzora', nameKa: 'მეცორაყ', nameHe: 'פרשת מצורע', startRef: '14' },
      { id: 'acharei-mot', nameKa: 'ახარეი მოთ', nameHe: 'פרשת אחרי מות', startRef: '16' },
      { id: 'kedoshim', nameKa: 'კედოშიმ', nameHe: 'פרשת קדושים', startRef: '19' },
      { id: 'emor', nameKa: 'ემორ', nameHe: 'פרשת אמור', startRef: '21' },
      { id: 'behar', nameKa: 'ბეჰარ', nameHe: 'פרשת בהר', startRef: '25' },
      { id: 'bechukotai', nameKa: 'ბეხუკოთაი', nameHe: 'פרשת בחקתי', startRef: '26' },
    ],
  },
  {
    id: 'Numbers',
    sefariaRef: 'Numbers',
    nameKa: 'ბამიდბარი (რიცხვნი)',
    nameHe: 'במדבר',
    subGroupKa: 'ხუმაშ ბამიდბარი',
    subGroupHe: 'חומש במדבר',
    chaptersCount: 36,
    parshiot: [
      { id: 'bamidbar', nameKa: 'ბამიდბარ', nameHe: 'פרשת במדבר', startRef: '1' },
      { id: 'naso', nameKa: 'ნასო', nameHe: 'פרשת נשא', startRef: '4' },
      { id: 'behaalotcha', nameKa: 'ბეჰაყალოთხა', nameHe: 'פרשת בהעלתך', startRef: '8' },
      { id: 'shelach', nameKa: 'შელახ', nameHe: 'פרשת שלח', startRef: '13' },
      { id: 'korach', nameKa: 'კორახ', nameHe: 'פרשת קרח', startRef: '16' },
      { id: 'chukat', nameKa: 'ხუკათ', nameHe: 'פרשת חקת', startRef: '19' },
      { id: 'balak', nameKa: 'ბალაკ', nameHe: 'פרשת בלק', startRef: '22' },
      { id: 'pinchas', nameKa: 'ფინხას', nameHe: 'פרשת פינחס', startRef: '25' },
      { id: 'matot', nameKa: 'მატოთ', nameHe: 'פרשת מטות', startRef: '30' },
      { id: 'masei', nameKa: 'მასყეი', nameHe: 'פרשת מסעי', startRef: '33' },
    ],
  },
  {
    id: 'Deuteronomy',
    sefariaRef: 'Deuteronomy',
    nameKa: 'დევარიმი (მეორე რჯული)',
    nameHe: 'דברים',
    subGroupKa: 'ხუმაშ დევარიმი',
    subGroupHe: 'חומש דברים',
    chaptersCount: 34,
    parshiot: [
      { id: 'devarim', nameKa: 'დევარიმ', nameHe: 'פרשת דברים', startRef: '1' },
      { id: 'vaetchanan', nameKa: 'ვაეთხანან', nameHe: 'פרשת ואתחנן', startRef: '3' },
      { id: 'ekev', nameKa: 'ყეკევ', nameHe: 'פרשת עקב', startRef: '7' },
      { id: 'reeh', nameKa: 'რეე', nameHe: 'פרשת ראה', startRef: '11' },
      { id: 'shoftim', nameKa: 'შოფტიმ', nameHe: 'פרשת שופטים', startRef: '16' },
      { id: 'ki-tetzei', nameKa: 'ქი თეცე', nameHe: 'פרשת כי תצא', startRef: '21' },
      { id: 'ki-tavo', nameKa: 'ქი თავო', nameHe: 'פרשת כי תבוא', startRef: '26' },
      { id: 'nitzavim', nameKa: 'ნიცავიმ', nameHe: 'פרשת נצבים', startRef: '29' },
      { id: 'vayelech', nameKa: 'ვაიელეხ', nameHe: 'פרשת וילך', startRef: '31' },
      { id: 'haazinu', nameKa: 'ჰააზინუ', nameHe: 'פרשת האזינו', startRef: '32' },
      { id: 'vezot-haberakhah', nameKa: 'ვეზოთ ჰაბერახა', nameHe: 'פרשת וזאת הברכה', startRef: '33' },
    ],
  },
];

export const NEVIIM_BOOKS: SacredBookItem[] = [
  { id: 'Joshua', sefariaRef: 'Joshua', nameKa: 'იეჰოშუაყ', nameHe: 'יהושע', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 24 },
  { id: 'Judges', sefariaRef: 'Judges', nameKa: 'შოფტიმ (მსაჯულნი)', nameHe: 'שופטים', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 21 },
  { id: 'I_Samuel', sefariaRef: 'I Samuel', nameKa: 'შმუელ I (პირველი მეფეთა)', nameHe: 'שמואל א', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 31 },
  { id: 'II_Samuel', sefariaRef: 'II Samuel', nameKa: 'შმუელ II (მეორე მეფეთა)', nameHe: 'שמואל ב', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 24 },
  { id: 'I_Kings', sefariaRef: 'I Kings', nameKa: 'მელახიმ I (მესამე მეფეთა)', nameHe: 'מלכים א', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 22 },
  { id: 'II_Kings', sefariaRef: 'II Kings', nameKa: 'მელახიმ II (მეოთხე მეფეთა)', nameHe: 'מלכים ב', subGroupKa: 'ნევიიმ რიშონიმ', subGroupHe: 'נביאים ראשונים', chaptersCount: 25 },
  { id: 'Isaiah', sefariaRef: 'Isaiah', nameKa: 'იეშაყიაჰუ (ესაია)', nameHe: 'ישעיהו', subGroupKa: 'ნევიიმ ახარონიმ', subGroupHe: 'נביאים אחרונים', chaptersCount: 66 },
  { id: 'Jeremiah', sefariaRef: 'Jeremiah', nameKa: 'ირმიაჰუ (იერემია)', nameHe: 'ירמיהו', subGroupKa: 'ნევიიმ ახარონიმ', subGroupHe: 'נביאים אחרונים', chaptersCount: 52 },
  { id: 'Ezekiel', sefariaRef: 'Ezekiel', nameKa: 'იეხეზკელი (ეზეკიელი)', nameHe: 'יחזקאל', subGroupKa: 'ნევიიმ ახარონიმ', subGroupHe: 'נביאים אחרונים', chaptersCount: 48 },
  { id: 'Hosea', sefariaRef: 'Hosea', nameKa: 'ჰოშეაყ (ოსია)', nameHe: 'הושע', subGroupKa: 'თრეი ყასარ (12 მცირე წინასწარმეტყველი)', subGroupHe: 'תרי עשר', chaptersCount: 14 },
  { id: 'Joel', sefariaRef: 'Joel', nameKa: 'იოელი', nameHe: 'יואל', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 4 },
  { id: 'Amos', sefariaRef: 'Amos', nameKa: 'ყამოსი', nameHe: 'עמוס', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 9 },
  { id: 'Obadiah', sefariaRef: 'Obadiah', nameKa: 'ყოვადია (აბდია)', nameHe: 'עובדיה', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 1 },
  { id: 'Jonah', sefariaRef: 'Jonah', nameKa: 'იონა', nameHe: 'יונה', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 4 },
  { id: 'Micah', sefariaRef: 'Micah', nameKa: 'მიხა', nameHe: 'מיכה', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 7 },
  { id: 'Nahum', sefariaRef: 'Nahum', nameKa: 'ნახუმი', nameHe: 'נחום', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 3 },
  { id: 'Habakkuk', sefariaRef: 'Habakkuk', nameKa: 'ხაბაკუკი', nameHe: 'חבקוק', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 3 },
  { id: 'Zephaniah', sefariaRef: 'Zephaniah', nameKa: 'ცეფანია', nameHe: 'צפניה', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 3 },
  { id: 'Haggai', sefariaRef: 'Haggai', nameKa: 'ხაგაი', nameHe: 'חגי', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 2 },
  { id: 'Zechariah', sefariaRef: 'Zechariah', nameKa: 'ზეხარია', nameHe: 'זכריה', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 14 },
  { id: 'Malachi', sefariaRef: 'Malachi', nameKa: 'მალახი', nameHe: 'מלאכי', subGroupKa: 'თრეი ყასარ', subGroupHe: 'תרי עשר', chaptersCount: 3 },
];

export const KETUVIM_BOOKS: SacredBookItem[] = [
  { id: 'Psalms', sefariaRef: 'Psalms', nameKa: 'თეჰილიმი (ფსალმუნნი)', nameHe: 'תהילים', subGroupKa: 'სეფერ ემეთ', subGroupHe: 'ספרי אמ״ת', chaptersCount: 150 },
  { id: 'Proverbs', sefariaRef: 'Proverbs', nameKa: 'მიშლეი (იგავნი სოლომონისა)', nameHe: 'משלי', subGroupKa: 'სეფერ ემეთ', subGroupHe: 'ספרי אמ״ת', chaptersCount: 31 },
  { id: 'Job', sefariaRef: 'Job', nameKa: 'იოვი (იობი)', nameHe: 'איוב', subGroupKa: 'სეფერ ემეთ', subGroupHe: 'ספרי אמ״ת', chaptersCount: 42 },
  { id: 'Song_of_Songs', sefariaRef: 'Song of Songs', nameKa: 'შირ ჰაშირიმი (ქებათა ქება)', nameHe: 'שיר השירים', subGroupKa: 'ხამეშ მეგილოთ', subGroupHe: 'חמש מגילות', chaptersCount: 8 },
  { id: 'Ruth', sefariaRef: 'Ruth', nameKa: 'რუთი', nameHe: 'רות', subGroupKa: 'ხამეშ მეგილოთ', subGroupHe: 'חמש מגילות', chaptersCount: 4 },
  { id: 'Lamentations', sefariaRef: 'Lamentations', nameKa: 'ეიხა (გოდება იერემიასი)', nameHe: 'איכה', subGroupKa: 'ხამეშ მეგილოთ', subGroupHe: 'חמש מגילות', chaptersCount: 5 },
  { id: 'Ecclesiastes', sefariaRef: 'Ecclesiastes', nameKa: 'კოჰელეთი (ეკლესიასტე)', nameHe: 'קהלת', subGroupKa: 'ხამეშ მეგილოთ', subGroupHe: 'חמש מגילות', chaptersCount: 12 },
  { id: 'Esther', sefariaRef: 'Esther', nameKa: 'ესთერი (მეგილათ ესთერ)', nameHe: 'אסתר', subGroupKa: 'ხამეშ მეგილოთ', subGroupHe: 'חמש מגילות', chaptersCount: 10 },
  { id: 'Daniel', sefariaRef: 'Daniel', nameKa: 'დანიელი', nameHe: 'דניאל', subGroupKa: 'ქეთუვიმ', subGroupHe: 'כתובים', chaptersCount: 12 },
  { id: 'Ezra', sefariaRef: 'Ezra', nameKa: 'ყეზრა', nameHe: 'עזרא', subGroupKa: 'ქეთუვიმ', subGroupHe: 'כתובים', chaptersCount: 10 },
  { id: 'Nehemiah', sefariaRef: 'Nehemiah', nameKa: 'ნეხემია', nameHe: 'נחמיה', subGroupKa: 'ქეთუვიმ', subGroupHe: 'כתובים', chaptersCount: 13 },
  { id: 'I_Chronicles', sefariaRef: 'I Chronicles', nameKa: 'დივრეი ჰაიამიმ I (პირველი ნეშტთა)', nameHe: 'דברי הימים א', subGroupKa: 'ქეთუვიმ', subGroupHe: 'כתובים', chaptersCount: 29 },
  { id: 'II_Chronicles', sefariaRef: 'II Chronicles', nameKa: 'დივრეი ჰაიამიმ II (მეორე ნეშტთა)', nameHe: 'דברי הימים ב', subGroupKa: 'ქეთუვიმ', subGroupHe: 'כתובים', chaptersCount: 36 },
];

export const RAMBAM_BOOKS: SacredBookItem[] = [
  { id: 'Mishneh_Torah,_Human_Dispositions', sefariaRef: 'Mishneh Torah, Human Dispositions', nameKa: 'სეფერ ჰამადაყ • ჰილხოთ დეყოთ', nameHe: 'ספר המדע • הלכות דעות', subGroupKa: '1. სეფერ ჰამადაყ (ცოდნის წიგნი)', subGroupHe: 'ספר המדע', chaptersCount: 7 },
  { id: 'Mishneh_Torah,_Foundations_of_the_Torah', sefariaRef: 'Mishneh Torah, Foundations of the Torah', nameKa: 'სეფერ ჰამადაყ • იესოდეი ჰათორა', nameHe: 'ספר המדע • הלכות יסודי התורה', subGroupKa: '1. სეფერ ჰამადაყ', subGroupHe: 'ספר המדע', chaptersCount: 10 },
  { id: 'Mishneh_Torah,_Torah_Study', sefariaRef: 'Mishneh Torah, Torah Study', nameKa: 'სეფერ ჰამადაყ • თალმუდ თორა', nameHe: 'ספר המדע • הלכות תלמוד תורה', subGroupKa: '1. სეფერ ჰამადაყ', subGroupHe: 'ספר המדע', chaptersCount: 7 },
  { id: 'Mishneh_Torah,_Repentance', sefariaRef: 'Mishneh Torah, Repentance', nameKa: 'სეფერ ჰამადაყ • ჰილხოთ თეშუვა', nameHe: 'ספר המדע • הלכות תשובה', subGroupKa: '1. სეფერ ჰამადაყ', subGroupHe: 'ספר המדע', chaptersCount: 10 },
  { id: 'Mishneh_Torah,_Reading_the_Shema', sefariaRef: 'Mishneh Torah, Reading the Shema', nameKa: 'სეფერ აჰავა • კრიათ შემაყ', nameHe: 'ספר אהבה • הלכות קריאת שמע', subGroupKa: '2. სეფერ აჰავა (სიყვარულის წიგნი)', subGroupHe: 'ספר אהבה', chaptersCount: 4 },
  { id: 'Mishneh_Torah,_Prayer_and_the_Priestly_Blessing', sefariaRef: 'Mishneh Torah, Prayer and the Priestly Blessing', nameKa: 'სეფერ აჰავა • თეფილა და ბირქათ ქოჰანიმ', nameHe: 'ספר אהבה • הלכות תפילה וברכת כהנים', subGroupKa: '2. სეფერ აჰავა', subGroupHe: 'ספר אהבה', chaptersCount: 15 },
  { id: 'Mishneh_Torah,_Blessings', sefariaRef: 'Mishneh Torah, Blessings', nameKa: 'სეფერ აჰავა • ჰილხოთ ბერახოთ', nameHe: 'ספר אהבה • הלכות ברכות', subGroupKa: '2. სეფერ აჰავა', subGroupHe: 'ספר אהבה', chaptersCount: 11 },
  { id: 'Mishneh_Torah,_Sabbath', sefariaRef: 'Mishneh Torah, Sabbath', nameKa: 'სეფერ ზემანიმ • ჰილხოთ შაბათ', nameHe: 'ספר זמנים • הלכות שבת', subGroupKa: '3. სეფერ ზემანიმ (დროთა წიგნი)', subGroupHe: 'ספר זמנים', chaptersCount: 30 },
  { id: 'Mishneh_Torah,_Leavened_and_Unleavened_Bread', sefariaRef: 'Mishneh Torah, Leavened and Unleavened Bread', nameKa: 'სეფერ ზემანიმ • ხამეც უმაცა', nameHe: 'ספר זמנים • הלכות חמץ ומצה', subGroupKa: '3. სეფერ ზემანიმ', subGroupHe: 'ספר זמנים', chaptersCount: 8 },
  { id: 'Mishneh_Torah,_Shofar,_Sukkah_and_Lulav', sefariaRef: 'Mishneh Torah, Shofar, Sukkah and Lulav', nameKa: 'სეფერ ზემანიმ • შოფარ, სუქა და ლულავი', nameHe: 'ספר זמנים • הלכות שופר וסוכה ולולב', subGroupKa: '3. სეფერ ზემანიმ', subGroupHe: 'ספר זמנים', chaptersCount: 8 },
  { id: 'Mishneh_Torah,_Marriage', sefariaRef: 'Mishneh Torah, Marriage', nameKa: 'სეფერ ნაშიმ • ჰილხოთ იშუთ', nameHe: 'ספר נשים • הלכות אישות', subGroupKa: '4. სეფერ ნაშიმ', subGroupHe: 'ספר נשים', chaptersCount: 25 },
  { id: 'Mishneh_Torah,_Forbidden_Foods', sefariaRef: 'Mishneh Torah, Forbidden Foods', nameKa: 'სეფერ კედუშა • მაახალოთ ასუროთ', nameHe: 'ספר קדושה • הלכות מאכלות אסורות', subGroupKa: '5. სეფერ კედუშა', subGroupHe: 'ספר קדושה', chaptersCount: 17 },
  { id: 'Mishneh_Torah,_Kings_and_Wars', sefariaRef: 'Mishneh Torah, Kings and Wars', nameKa: 'სეფერ შოფტიმ • ჰილხოთ მელახიმ უმილხამოთ', nameHe: 'ספר שופטים • הלכות מלכים ומלחמות', subGroupKa: '14. სეფერ შოფტიმ', subGroupHe: 'ספר שופטים', chaptersCount: 12 },
];

export const TUR_BOOKS: SacredBookItem[] = [
  { id: 'Tur,_Orach_Chaim', sefariaRef: 'Tur, Orach Chaim', nameKa: 'ტურ ორახ ხაიმი (ყოველდღიური და შაბათ-დღესასწაულის კანონები)', nameHe: 'טור אורח חיים', subGroupKa: 'არბაყა ტურიმ (I)', subGroupHe: 'אורח חיים', chaptersCount: 697 },
  { id: 'Tur,_Yoreh_Deah', sefariaRef: 'Tur, Yoreh Deah', nameKa: 'ტურ იორე დეყა (ქაშრუთი, ნიდა, გლოვა, ქველმოქმედება)', nameHe: 'טור יורה דעה', subGroupKa: 'არბაყა ტურიმ (II)', subGroupHe: 'יורה דעה', chaptersCount: 403 },
  { id: 'Tur,_Even_HaEzer', sefariaRef: 'Tur, Even HaEzer', nameKa: 'ტურ ებენ ჰაყეზერი (ქორწინება, კიდუშინი, ქეთუბა, გიტინი)', nameHe: 'טור אבן העזר', subGroupKa: 'არბაყა ტურიმ (III)', subGroupHe: 'אבן העזר', chaptersCount: 178 },
  { id: 'Tur,_Choshen_Mishpat', sefariaRef: 'Tur, Choshen Mishpat', nameKa: 'ტურ ხოშენ მიშფატი (სამოქალაქო სამართალი, დავები, ბეთ დინი)', nameHe: 'טור חושן משפט', subGroupKa: 'არბაყა ტურიმ (IV)', subGroupHe: 'חושן משפט', chaptersCount: 427 },
];

export const SHULCHAN_ARUCH_BOOKS: SacredBookItem[] = [
  { id: 'Shulchan_Arukh,_Orach_Chayim', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'შულხან ყარუხი • ორახ ხაიმი', nameHe: 'שולחן ערוך אורח חיים', subGroupKa: 'ნაწილი I — ორახ ხაიმი', subGroupHe: 'אורח חיים', chaptersCount: 697 },
  { id: 'Shulchan_Arukh,_Yoreh_Deah', sefariaRef: 'Shulchan Arukh, Yoreh Deah', nameKa: 'შულხან ყარუხი • იორე დეყა', nameHe: 'שולחן ערוך יורה דעה', subGroupKa: 'ნაწილი II — იორე დეყა', subGroupHe: 'יורה דעה', chaptersCount: 403 },
  { id: 'Shulchan_Arukh,_Even_HaEzer', sefariaRef: 'Shulchan Arukh, Even HaEzer', nameKa: 'შულხან ყარუხი • ებენ ჰაყეზერი', nameHe: 'שולחן ערוך אבן העזר', subGroupKa: 'ნაწილი III — ებენ ჰაყეზერი', subGroupHe: 'אבן העזר', chaptersCount: 178 },
  { id: 'Shulchan_Arukh,_Choshen_Mishpat', sefariaRef: 'Shulchan Arukh, Choshen Mishpat', nameKa: 'შულხან ყარუხი • ხოშენ მიშფატი', nameHe: 'שולחן ערוך חושן משפט', subGroupKa: 'ნაწილი IV — ხოშენ მიშფატი', subGroupHe: 'חושן משפט', chaptersCount: 427 },
];

export const MISHNAH_BERURAH_BOOKS: SacredBookItem[] = [
  { id: 'Mishnah_Berurah_1', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი I (სიმანი 1–127: დილის კურთხევები, შემაყი, თეფილა)', nameHe: 'משנה ברורה חלק א׳ (סי׳ א–קכז)', subGroupKa: 'ხაფეც ხაიმი • ორახ ხაიმი', subGroupHe: 'חלק א׳', chaptersCount: 127 },
  { id: 'Mishnah_Berurah_2', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი II (სიმანი 128–241: ბირქათ ჰამაზონი, კურთხევები)', nameHe: 'משנה ברורה חלק ב׳ (סי׳ קכח–רמא)', subGroupKa: 'ხაფეც ხაიმი • ორახ ხაიმი', subGroupHe: 'חלק ב׳', chaptersCount: 241 },
  { id: 'Mishnah_Berurah_3', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი III (სიმანი 242–344: ჰილხოთ შაბათი I)', nameHe: 'משנה ברורה חלק ג׳ (הלכות שבת א׳)', subGroupKa: 'ხაფეც ხაიმი • შაბათი', subGroupHe: 'חלק ג׳', chaptersCount: 344 },
  { id: 'Mishnah_Berurah_4', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი IV (სიმანი 345–428: ყერუვინი და როშ ხოდეში)', nameHe: 'משנה ברורה חלק ד׳ (עירובין ור״ח)', subGroupKa: 'ხაფეც ხაიმი • შაბათი II', subGroupHe: 'חלק ד׳', chaptersCount: 428 },
  { id: 'Mishnah_Berurah_5', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი V (სიმანი 429–529: ფესახი და იომ ტოვი)', nameHe: 'משנה ברורה חלק ה׳ (פסח ויו״ט)', subGroupKa: 'ხაფეც ხაიმი • მოყადიმ', subGroupHe: 'חלק ה׳', chaptersCount: 529 },
  { id: 'Mishnah_Berurah_6', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მიშნა ბრურა • ნაწილი VI (სიმანი 530–697: როშ ჰაშანა, იომ ქიფური, სუქოთი, ხანუქა, ფურიმი)', nameHe: 'משנה ברורה חלק ו׳ (ימים נוראים, חנוכה ופורים)', subGroupKa: 'ხაფეც ხაიმი • მოყადიმ II', subGroupHe: 'חלק ו׳', chaptersCount: 697 },
];

export const SEPHARDIC_HALAKHA_BOOKS: SacredBookItem[] = [
  { id: 'Yalkut_Yosef_OC', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'ხაზონ ყოვადია და იალკუტ იოსეფი • ორახ ხაიმი (მარან რავ ყოვადია იოსეფი)', nameHe: 'חזון עובדיה וילקוט יוסף • אורח חיים', subGroupKa: 'მარან რავ ყოვადია იოსეფის სკოლა', subGroupHe: 'פסקי מרן עובדיה יוסף', chaptersCount: 697 },
  { id: 'Ben_Ish_Chai_Halakhot', sefariaRef: 'Ben Ish Chai', nameKa: 'ბენ იშ ხაი • შანა რიშონა და შნია (ბაღდადის და კაბალისტური ჰალახა)', nameHe: 'בן איש חי • הלכות שנה א׳ וב׳', subGroupKa: 'რაბენუ იოსეფ ხაიმი (ბაღდადი)', subGroupHe: 'רבנו יוסף חיים', chaptersCount: 54 },
  { id: 'Kaf_HaChaim_OC', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'ქაფ ჰახაიმი • რავ იაყაკოვ ხაიმ სოფერი (ფშატი და არიზალის კაბალა)', nameHe: 'כף החיים • רבי יעקב חיים סופר', subGroupKa: 'იერუსალიმის სეფარადული სკოლა', subGroupHe: 'כף החיים', chaptersCount: 697 },
  { id: 'Or_LeTzion_Halakha', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'ორ ლეციონი • ხახამ ბენ ციონ აბა შაული (ფორათ იოსეფის ტრადიცია)', nameHe: 'אור לציון • הגרב״צ אבא שאול', subGroupKa: 'იეშივა ფორათ იოსეფი', subGroupHe: 'אור לציון', chaptersCount: 100 },
  { id: 'Menuhat_Ahavah', sefariaRef: 'Shulchan Arukh, Orach Chayim', nameKa: 'მენუხათ აჰავა • რავ მოშე ლევი (შაბათისა და კურთხევების ფუნდამენტური ჰალახა)', nameHe: 'מנוחת אהבה • הגאון רבי משה לוי', subGroupKa: 'ქისე რახამიმის სკოლა', subGroupHe: 'מנוחת אהבה', chaptersCount: 60 },
];

// ALL 63 TRACTATES OF SHISHA SIDREI MISHNAH (ששה סדרי משנה) ACROSS ALL 6 SEDARIM
export const MISHNAYOT_BOOKS: SacredBookItem[] = [
  // 1. სედერ ზერაიმ (סדר זרעים — 11 ტრაქტატი)
  { id: 'Mishnah_Berakhot', sefariaRef: 'Mishnah Berakhot', nameKa: 'ბერახოთი (კურთხევანი)', nameHe: 'משנה ברכות', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 9 },
  { id: 'Mishnah_Peah', sefariaRef: 'Mishnah Peah', nameKa: 'ფეა (ყანის კიდე)', nameHe: 'משנה פאה', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 8 },
  { id: 'Mishnah_Demai', sefariaRef: 'Mishnah Demai', nameKa: 'დემაი (საეჭვო ნაყოფი)', nameHe: 'משנה דמאי', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 7 },
  { id: 'Mishnah_Kilayim', sefariaRef: 'Mishnah Kilayim', nameKa: 'ქილაიმი (შერეული თესლი)', nameHe: 'משנה כלאים', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 9 },
  { id: 'Mishnah_Sheviit', sefariaRef: 'Mishnah Sheviit', nameKa: 'შევიითი (შემიტის წელი)', nameHe: 'משנה שביעית', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 10 },
  { id: 'Mishnah_Terumot', sefariaRef: 'Mishnah Terumot', nameKa: 'თერუმოთი (შესაწირი ქოჰენისთვის)', nameHe: 'משנה תרומות', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 11 },
  { id: 'Mishnah_Maasrot', sefariaRef: 'Mishnah Maasrot', nameKa: 'მაასროთი (მეათედი)', nameHe: 'משנה מעשרות', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 5 },
  { id: 'Mishnah_Maaser_Sheni', sefariaRef: 'Mishnah Maaser Sheni', nameKa: 'მაასერ შენი (მეორე მეათედი)', nameHe: 'משנה מעשר שני', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 5 },
  { id: 'Mishnah_Challah', sefariaRef: 'Mishnah Challah', nameKa: 'ხალა (ცომის წილი)', nameHe: 'משנה חלה', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 4 },
  { id: 'Mishnah_Orlah', sefariaRef: 'Mishnah Orlah', nameKa: 'ორლა (ხის პირველი 3 წელი)', nameHe: 'משנה ערלה', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 3 },
  { id: 'Mishnah_Bikkurim', sefariaRef: 'Mishnah Bikkurim', nameKa: 'ბიქურიმი (პირველნაყოფნი)', nameHe: 'משנה ביכורים', subGroupKa: '1. სედერ ზერაიმ (סדר זרעים)', subGroupHe: 'סדר זרעים', chaptersCount: 4 },

  // 2. სედერ მოედი (סדר מועד — 12 ტრაქტატი)
  { id: 'Mishnah_Shabbat', sefariaRef: 'Mishnah Shabbat', nameKa: 'შაბათი (შაბათის კანონები)', nameHe: 'משנה שבת', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 24 },
  { id: 'Mishnah_Eruvin', sefariaRef: 'Mishnah Eruvin', nameKa: 'ერუვინი (საზღვრების გაერთიანება)', nameHe: 'משנה עירובין', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 10 },
  { id: 'Mishnah_Pesachim', sefariaRef: 'Mishnah Pesachim', nameKa: 'ფესახიმი (ფესახის კანონები)', nameHe: 'משנה פסחים', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 10 },
  { id: 'Mishnah_Shekalim', sefariaRef: 'Mishnah Shekalim', nameKa: 'შეკალიმი (ტაძრის ნახევარ-შეკელი)', nameHe: 'משנה שקלים', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 8 },
  { id: 'Mishnah_Yoma', sefariaRef: 'Mishnah Yoma', nameKa: 'იომა (იომ ქიფურის მსახურება)', nameHe: 'משנה יומא', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 8 },
  { id: 'Mishnah_Sukkah', sefariaRef: 'Mishnah Sukkah', nameKa: 'სუკა (კარავი და 4 სახეობა)', nameHe: 'משנה סוכה', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 5 },
  { id: 'Mishnah_Beitzah', sefariaRef: 'Mishnah Beitzah', nameKa: 'ბეცა (იომ ტოვის კანონები)', nameHe: 'משנה ביצה', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 5 },
  { id: 'Mishnah_Rosh_Hashanah', sefariaRef: 'Mishnah Rosh Hashanah', nameKa: 'როშ ჰაშანა (ახალი წელი და შოფარი)', nameHe: 'משנה ראש השנה', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 4 },
  { id: 'Mishnah_Taanit', sefariaRef: 'Mishnah Taanit', nameKa: 'თაანითი (მარხვები და წვიმის ლოცვა)', nameHe: 'משנה תענית', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 4 },
  { id: 'Mishnah_Megillah', sefariaRef: 'Mishnah Megillah', nameKa: 'მეგილა (ფურიმი და თორის კითხვა)', nameHe: 'משנה מגילה', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 4 },
  { id: 'Mishnah_Moed_Katan', sefariaRef: 'Mishnah Moed Katan', nameKa: 'მოედ კატანი (ხოლ ჰამოედი და გლოვა)', nameHe: 'משנה מועד קטן', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 3 },
  { id: 'Mishnah_Chagigah', sefariaRef: 'Mishnah Chagigah', nameKa: 'ხაგიგა (დღესასწაულის მსხვერპლი)', nameHe: 'משנה חגיגה', subGroupKa: '2. სედერ მოედი (סדר מועד)', subGroupHe: 'סדר מועד', chaptersCount: 3 },

  // 3. სედერ ნაშიმი (סדר נשים — 7 ტრაქტატი)
  { id: 'Mishnah_Yevamot', sefariaRef: 'Mishnah Yevamot', nameKa: 'იევამოთი (იბუმი და ხალიცა)', nameHe: 'משנה יבמות', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 16 },
  { id: 'Mishnah_Ketubot', sefariaRef: 'Mishnah Ketubot', nameKa: 'ქეთუბოთი (საქორწინო ხელშეკრულება)', nameHe: 'משנה כתובות', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 13 },
  { id: 'Mishnah_Nedarim', sefariaRef: 'Mishnah Nedarim', nameKa: 'ნედარიმი (აღთქმები და გაუქმება)', nameHe: 'משנה נדרים', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 11 },
  { id: 'Mishnah_Nazir', sefariaRef: 'Mishnah Nazir', nameKa: 'ნაზირი (ნაზირის აღთქმა)', nameHe: 'משנה נזיר', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 9 },
  { id: 'Mishnah_Sotah', sefariaRef: 'Mishnah Sotah', nameKa: 'სოტა (ერთგულების გამოცდა)', nameHe: 'משנה סוטה', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 9 },
  { id: 'Mishnah_Gittin', sefariaRef: 'Mishnah Gittin', nameKa: 'გიტინი (განქორწინების წერილი)', nameHe: 'משנה גיטין', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 9 },
  { id: 'Mishnah_Kiddushin', sefariaRef: 'Mishnah Kiddushin', nameKa: 'კიდუშინი (დაწინდვა და ქორწინება)', nameHe: 'משנה קידושין', subGroupKa: '3. სედერ ნაშიმი (סדר נשים)', subGroupHe: 'סדר נשים', chaptersCount: 4 },

  // 4. სედერ ნეზიკინი (סדר נזיקין — 10 ტრაქტატი)
  { id: 'Mishnah_Bava_Kamma', sefariaRef: 'Mishnah Bava Kamma', nameKa: 'ბაბა ქამა (ზიანის კანონები)', nameHe: 'משנה בבא קמא', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 10 },
  { id: 'Mishnah_Bava_Metzia', sefariaRef: 'Mishnah Bava Metzia', nameKa: 'ბაბა მეცია (ნაპოვნი და ქონებრივი სამართალი)', nameHe: 'משנה בבא מציעא', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 10 },
  { id: 'Mishnah_Bava_Batra', sefariaRef: 'Mishnah Bava Batra', nameKa: 'ბაბა ბათრა (საკუთრება და მემკვიდრეობა)', nameHe: 'משנה בבא בתרא', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 10 },
  { id: 'Mishnah_Sanhedrin', sefariaRef: 'Mishnah Sanhedrin', nameKa: 'სანჰედრინი (უმაღლესი სასამართლო)', nameHe: 'משנה סנהדרין', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 11 },
  { id: 'Mishnah_Makkot', sefariaRef: 'Mishnah Makkot', nameKa: 'მაქოთი (სასჯელები და თავშესაფარი ქალაქები)', nameHe: 'משנה מכות', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 3 },
  { id: 'Mishnah_Shevuot', sefariaRef: 'Mishnah Shevuot', nameKa: 'შევუოთი (ფიცის კანონები)', nameHe: 'משנה שבועות', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 8 },
  { id: 'Mishnah_Eduyot', sefariaRef: 'Mishnah Eduyot', nameKa: 'ედუიოთი (ბრძენთა მოწმობანი)', nameHe: 'משנה עדיות', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 8 },
  { id: 'Mishnah_Avodah_Zarah', sefariaRef: 'Mishnah Avodah Zarah', nameKa: 'ავოდა ზარა (კერპთაყვანისმცემლობის აკრძალვა)', nameHe: 'משנה עבודה זרה', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 5 },
  { id: 'Pirkei_Avot', sefariaRef: 'Pirkei Avot', nameKa: 'ფირკეი ავოთი (მამათა სწავლანი — მუსარი)', nameHe: 'משנה פרקי אבות', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 6 },
  { id: 'Mishnah_Horayot', sefariaRef: 'Mishnah Horayot', nameKa: 'ჰორაიოთი (სასამართლოს გადაწყვეტილებანი)', nameHe: 'משנה הוריות', subGroupKa: '4. სედერ ნეზიკინი (סדר נזיקין)', subGroupHe: 'סדר נזיקין', chaptersCount: 3 },

  // 5. სედერ კოდაშიმი (סדר קדשים — 11 ტრაქტატი)
  { id: 'Mishnah_Zevachim', sefariaRef: 'Mishnah Zevachim', nameKa: 'ზევახიმი (ტაძრის მსხვერპლშეწირვანი)', nameHe: 'משנה זבחים', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 14 },
  { id: 'Mishnah_Menachot', sefariaRef: 'Mishnah Menachot', nameKa: 'მენახოთი (პურეულის შესაწირი და ციცითი/თפילין)', nameHe: 'משנה מנחות', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 13 },
  { id: 'Mishnah_Chullin', sefariaRef: 'Mishnah Chullin', nameKa: 'ხულინი (შეხიტა და კაშრუთის კანონები)', nameHe: 'משנה חולין', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 12 },
  { id: 'Mishnah_Bekhorot', sefariaRef: 'Mishnah Bekhorot', nameKa: 'ბეხოროთი (პირმშოობის კანონები)', nameHe: 'משנה בכורות', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 9 },
  { id: 'Mishnah_Arakhin', sefariaRef: 'Mishnah Arakhin', nameKa: 'არახინი (ტაძრისთვის შეწირული შეფასებანი)', nameHe: 'משנה ערכין', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 9 },
  { id: 'Mishnah_Temurah', sefariaRef: 'Mishnah Temurah', nameKa: 'თემურა (სამსხვერპლო ცხოველის ჩანაცვლება)', nameHe: 'משנה תמורה', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 7 },
  { id: 'Mishnah_Keritot', sefariaRef: 'Mishnah Keritot', nameKa: 'ქერითოთი (ქარეთის სასჯელი და ხატათი)', nameHe: 'משנה כריתות', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 6 },
  { id: 'Mishnah_Meilah', sefariaRef: 'Mishnah Meilah', nameKa: 'მეილა (ტაძრის სიწმინდით სარგებლობა)', nameHe: 'משנה מעילה', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 6 },
  { id: 'Mishnah_Tamid', sefariaRef: 'Mishnah Tamid', nameKa: 'თამიდი (ყოველდღიური მსხვერპლი ტაძარში)', nameHe: 'משנה תמיד', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 7 },
  { id: 'Mishnah_Middot', sefariaRef: 'Mishnah Middot', nameKa: 'მიდოთი (წმინდა ტაძრის ზომები და აგებულება)', nameHe: 'משנה מידות', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 5 },
  { id: 'Mishnah_Kinnim', sefariaRef: 'Mishnah Kinnim', nameKa: 'კინიმი (ფრინველთა შესაწირის კანონები)', nameHe: 'משנה קינים', subGroupKa: '5. სედერ კოდაშიმი (סדר קדשים)', subGroupHe: 'סדר קדשים', chaptersCount: 3 },

  // 6. სედერ ტოჰოროთი (סדר טהרות — 12 ტრაქტატი)
  { id: 'Mishnah_Kelim', sefariaRef: 'Mishnah Kelim', nameKa: 'ქელიმი (ჭურჭლის სიწმინდე და ტუმა)', nameHe: 'משנה כלים', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 30 },
  { id: 'Mishnah_Oholot', sefariaRef: 'Mishnah Oholot', nameKa: 'ოჰოლოთი (კარვის ტუმა)', nameHe: 'משנה אהלות', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 18 },
  { id: 'Mishnah_Negaim', sefariaRef: 'Mishnah Negaim', nameKa: 'ნეგაიმი (ცარაათის კანონები)', nameHe: 'משנה נגעים', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 14 },
  { id: 'Mishnah_Parah', sefariaRef: 'Mishnah Parah', nameKa: 'ფარა (წითელი დეკეული — פרה אדומה)', nameHe: 'משנה פרה', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 12 },
  { id: 'Mishnah_Tahorot', sefariaRef: 'Mishnah Tahorot', nameKa: 'ტოჰოროთი (საკვების სიწმინდე)', nameHe: 'משנה טהרות', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 10 },
  { id: 'Mishnah_Mikvaot', sefariaRef: 'Mishnah Mikvaot', nameKa: 'მიკვაოთი (მიკვეს აგებულება და განწმენდა)', nameHe: 'משנה מקוואות', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 10 },
  { id: 'Mishnah_Niddah', sefariaRef: 'Mishnah Niddah', nameKa: 'ნიდა (ოჯახური სიწმინდის კანონები)', nameHe: 'משנה נידה', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 10 },
  { id: 'Mishnah_Makhshirin', sefariaRef: 'Mishnah Makhshirin', nameKa: 'მახშირინი (სითხით საკვების მომზადება)', nameHe: 'משנה מכשירין', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 6 },
  { id: 'Mishnah_Zavim', sefariaRef: 'Mishnah Zavim', nameKa: 'ზავიმი (ზავის სიწმინდის კანონები)', nameHe: 'משנה זבים', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 5 },
  { id: 'Mishnah_Tevul_Yom', sefariaRef: 'Mishnah Tevul Yom', nameKa: 'ტევულ იომი (მიკვეში განბანილი მზის ჩასვლამდე)', nameHe: 'משנה טבול יום', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 4 },
  { id: 'Mishnah_Yadayim', sefariaRef: 'Mishnah Yadayim', nameKa: 'იადაიმი (ხელების განბანა — נטילת ידיים)', nameHe: 'משנה ידיים', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 4 },
  { id: 'Mishnah_Uktzin', sefariaRef: 'Mishnah Uktzin', nameKa: 'უკცინი (ნაყოფის ყუნწი და ქერქი)', nameHe: 'משנה עוקצין', subGroupKa: '6. სედერ ტოჰოროთი (סדר טהרות)', subGroupHe: 'סדר טהרות', chaptersCount: 3 },
];

export interface MishnahCommentatorMeta {
  id: string;
  nameKa: string;
  nameHe: string;
  eraKa: string;
  descriptionKa: string;
}

export const MISHNAH_COMMENTATORS_CATALOG: MishnahCommentatorMeta[] = [
  {
    id: 'bartenura',
    nameKa: 'რაბენუ ოვადია ბარტენურა (רע״ב)',
    nameHe: 'רבי עובדיה מברטנורא (רע״ב)',
    eraKa: 'XV–XVI ს. • იტალია / იერუსალიმი',
    descriptionKa: 'მიშნის ყველაზე ფუნდამენტური კლასიკური კომენტარი, რომელიც ეფუძნება რაშისა და რამბამის განმარტებებს და გადმოსცემს თითოეული მიშნის პეშატსა და ჰალახურ დასკვნას.',
  },
  {
    id: 'kehati',
    nameKa: 'ფინხას კეჰათი (משניות מבוארות קהתי)',
    nameHe: 'פירוש רבי פנחס קהתי',
    eraKa: 'XX ს. • იერუსალიმი',
    descriptionKa: 'თანამედროვე კლასიკური სისტემური განმარტება: აერთიანებს რიშონიმებისა და ახარონიმების სწავლებას მკაფიო, ადვილად გასაგები სტრუქტურით და ჰალახური რეზიუმეთი.',
  },
  {
    id: 'tosafot-yom-tov',
    nameKa: 'თოსაფოთ იომ ტოვი (תוספות יום טוב)',
    nameHe: 'תוספות יום טוב • רבי יום טוב ליפמן הלר',
    eraKa: 'XVII ს. • პრაღა / კრაკოვი',
    descriptionKa: 'ღრმა ანალიტიკური კომენტარი ბარტენურასა და მიშნაზე; იკვლევს გემარის წყაროებს, წინააღმდეგობებს და ადგენს ტექსტის სიზუსტეს.',
  },
  {
    id: 'rambam-mishnah',
    nameKa: 'რამბამი — ფეირუშ ჰამიშნა (פירוש המשנה להרמב״ם)',
    nameHe: 'פירוש המשנה להרמב״ם',
    eraKa: 'XII ს. • ესპანეთი / ეგვიპტე (რიშონიმი)',
    descriptionKa: 'მაიმონიდესის (რამბამის) ფუნდამენტური კომენტარი მთელ მიშნაზე, რომელიც შეიცავს ფილოსოფიურ შესავლებს (სედერ ზერაიმ, ხელეკ, შმონა ფერაკიმ) და საბოლოო ჰალახურ პსაკს.',
  },
  {
    id: 'tiferet-yisrael',
    nameKa: 'თიფერეთ ისრაელი — იახინ და ბოაზ (תפארת ישראל)',
    nameHe: 'תפארת ישראל • יכין ובועז (רבי ישראל ליפשיץ)',
    eraKa: 'XIX ს. • გერმანია',
    descriptionKa: 'იყოფა ორ ნაწილად: „იახინ“ (ნათელი პუნქტობრივი განმარტება და ჰალახის რეზიუმე) და „ბოაზ“ (ღრმა თალმუდური პილპული და კვლევა).',
  },
  {
    id: 'meiri-mishnah',
    nameKa: 'რაბენუ ჰამეირი — ბეთ ჰაბეხირა (בית הבחירה להמאירי)',
    nameHe: 'בית הבחירה להמאירי',
    eraKa: 'XIII–XIV ს. • პროვანსი (რიშონიმი)',
    descriptionKa: 'სისტემური ენციკლოპედიური განმარტება, რომელიც აჯამებს მიშნის ლოგიკას, ეთიკას და ჰალახურ დასკვნებს.',
  },
  {
    id: 'melekhet-shlomo',
    nameKa: 'მელეხეთ შლომო (מלאכת שלמה)',
    nameHe: 'מלאכת שלמה • רבי שלמה עדני',
    eraKa: 'XVI–XVII ს. • იემენი / ცფათი / ხევრონი',
    descriptionKa: 'უძველეს ხელნაწერებზე დაფუძნებული სეფარადული კომენტარი, რომელიც აზუსტებს მიშნის ნუსხას (גירסאות) და ენობრივ ეტიმოლოგიას.',
  },
  {
    id: 'shenot-eliyahu',
    nameKa: 'შენოთ ელიაჰუ — ვილნის გაონი (שנות אליהו להגר״א)',
    nameHe: 'שנות אליהו • הגאון מווילנא (הגר״א)',
    eraKa: 'XVIII ს. • ვილნა',
    descriptionKa: 'ვილნის გაონის ლაკონური და უღრმესი განმარტება, რომელიც აკავშირებს მიშნას პირდაპირ წერილობით თორასთან, თოსეფთასთან და იერუსალიმის თალმუდთან.',
  },
  {
    id: 'rabbi-akiva-eiger',
    nameKa: 'ხიდუშეი რაბი აკივა ეგერი (רבי עקיבא איגר)',
    nameHe: 'תוספות רבי עקיבא איגר על המשנה',
    eraKa: 'XVIII–XIX ს. • პოზნანი',
    descriptionKa: 'ბრწყინვალე ანალიტიკური შენიშვნები, კითხვები (קושיות) და შეჯერებები მიშნასა და მის კომენტატორებზე.',
  },
  {
    id: 'rash-rosh',
    nameKa: 'რაში (ר״ש משאנץ) და როში (רא״ש) მიშნაზე',
    nameHe: 'פירוש הר״ש משאנץ והרא״ש',
    eraKa: 'XII–XIII ს. • საფრანგეთი / ესპანეთი (რიშონიმი)',
    descriptionKa: 'თოსაფისტთა სკოლის ფუნდამენტური კომენტარები (განსაკუთრებით სედერ ზერაიმსა და ტოჰოროთზე, სადაც ბაბილონის გემარა არ არის).',
  },
  {
    id: 'ikar-tyt',
    nameKa: 'იკარ თოსაფოთ იომ ტოვი (עיקר תוספות יום טוב)',
    nameHe: 'עיקר תוספות יום טוב',
    eraKa: 'XVIII ს. • კლასიკური კომპენდიუმი',
    descriptionKa: 'თოსაფოთ იომ ტოვის ძირითადი ანალიტიკური მარგალიტების კონცენტრირებული კრებული.',
  },
  {
    id: 'kaf-nachat',
    nameKa: 'ქაფ ნახათი და ჰონ აშირი (כף נחת / הון עשיר)',
    nameHe: 'כף נחת והון עשיר',
    eraKa: 'XVI–XVII ს. • სეფარადული და კაბალისტური ტრადიცია',
    descriptionKa: 'მოკლე, მკაფიო განმარტება და კაბალისტურ-მუსარული სიღრმეები მიშნის ტექსტზე.',
  },
];

export interface SacredDafColumnConfig {
  rightHeaderKa: string;
  rightHeaderHe: string;
  centerTopHeaderKa: string;
  centerTopHeaderHe: string;
  centerMainHeaderKa: string;
  centerMainHeaderHe: string;
  leftHeaderKa: string;
  leftHeaderHe: string;
  bottomLeftHeaderKa: string;
  bottomLeftHeaderHe: string;
  bottomRightHeaderKa: string;
  bottomRightHeaderHe: string;
}

export const REALM_COLUMN_CONFIGS: Record<SacredRealmId, SacredDafColumnConfig> = {
  torah: {
    rightHeaderKa: 'რაში • רש״י על התורה',
    rightHeaderHe: 'פירוש רש״י',
    centerTopHeaderKa: 'თარგუმ ონკელოსი • תרגום אונקלוס',
    centerTopHeaderHe: 'תרגום אונקלוס',
    centerMainHeaderKa: 'ხუმაშის ტექსტი (מקרא)',
    centerMainHeaderHe: 'פנים החומש • מקרא',
    leftHeaderKa: 'რამბანი და იბნ ყეზრა • רמב״ן ואבן עזרא',
    leftHeaderHe: 'רמב״ן / אבן עזרא',
    bottomLeftHeaderKa: 'ორ ჰახაიმი • אור החיים הקדוש',
    bottomLeftHeaderHe: 'אור החיים',
    bottomRightHeaderKa: 'სფორნო და ბაყალ ჰატურიმი • ספורנו ובעל הטורים',
    bottomRightHeaderHe: 'ספורנו / בעל הטורים',
  },
  neviim: {
    rightHeaderKa: 'რაში • רש״י על נביאים',
    rightHeaderHe: 'פירוש רש״י',
    centerTopHeaderKa: 'თარგუმ იონათანი • תרגום יונתן בן עוזיאל',
    centerTopHeaderHe: 'תרגום יונתן',
    centerMainHeaderKa: 'ნევიიმის ტექსტი (מקרא)',
    centerMainHeaderHe: 'נביאים • מקרא',
    leftHeaderKa: 'რადაკი (רד״ק) • רבי דוד קמחי',
    leftHeaderHe: 'פירוש הרד״ק',
    bottomLeftHeaderKa: 'მეცუდათ დავიდი • מצודת דוד',
    bottomLeftHeaderHe: 'מצודת דוד',
    bottomRightHeaderKa: 'მეცუდათ ციონი და მალბიმი • מצודת ציון ומלבי״ם',
    bottomRightHeaderHe: 'מצודת ציון / מלבי״ם',
  },
  ketuvim: {
    rightHeaderKa: 'რაში • רש״י על כתובים',
    rightHeaderHe: 'פירוש רש״י',
    centerTopHeaderKa: 'თარგუმი და მოკლე შინაარსი • תרגום כתובים',
    centerTopHeaderHe: 'תרגום ומבוא',
    centerMainHeaderKa: 'ქეთუვიმის ტექსტი (מקרא)',
    centerMainHeaderHe: 'כתובים • מקרא',
    leftHeaderKa: 'იბნ ყეზრა და მეირი • אבן עזרא והמאירי',
    leftHeaderHe: 'אבן עזרא / מאירי',
    bottomLeftHeaderKa: 'მეცუდათ დავიდი • מצודת דוד',
    bottomLeftHeaderHe: 'מצודת דוד',
    bottomRightHeaderKa: 'მალბიმი და ალშიხი • מלבי״ם ואלשיך',
    bottomRightHeaderHe: 'מלבי״ם / אלשיך',
  },
  rambam: {
    rightHeaderKa: 'ქესეფ მიშნე (მარან ბეთ იოსეფი) • כסף משנה',
    rightHeaderHe: 'כסף משנה',
    centerTopHeaderKa: 'ჰასაგოთ ჰარაავადი • השגות הראב״ד',
    centerTopHeaderHe: 'השגות הראב״ד',
    centerMainHeaderKa: 'რამბამი — მიშნე თორა (רמב״ם יד החזקה)',
    centerMainHeaderHe: 'רמב״ם • משנה תורה',
    leftHeaderKa: 'მაგიდ მიშნე • מגיד משנה',
    leftHeaderHe: 'מגיד משנה',
    bottomLeftHeaderKa: 'ლეხემ მიშნე და მიშნე ლამელეხი • לחם משנה ומשנה למלך',
    bottomLeftHeaderHe: 'לחם משנה / משנה למלך',
    bottomRightHeaderKa: 'მიგდალ ყოზი და ჰაგაჰოთ მაიმონიოთ • מגדל עוז והגהות מיימוניות',
    bottomRightHeaderHe: 'מגדל עוז / הגהות מיימוניות',
  },
  tur: {
    rightHeaderKa: 'ბეთ იოსეფი (მარან იოსეფ კარო) • בית יוסף',
    rightHeaderHe: 'בית יוסף',
    centerTopHeaderKa: 'ბახი (ბაით ხადაში) • ב״ח (בית חדש)',
    centerTopHeaderHe: 'ב״ח • בית חדש',
    centerMainHeaderKa: 'არბაყა ტურიმ — რაბენუ იაყაკოვ ბაყალ ჰატურიმი',
    centerMainHeaderHe: 'ארבעה טורים • רבנו יעקב',
    leftHeaderKa: 'დარხეი მოშე (რამა) • דרכי משה',
    leftHeaderHe: 'דרכי משה',
    bottomLeftHeaderKa: 'დריშა • דרישה (רבי יהושע פלק כ״ץ)',
    bottomLeftHeaderHe: 'דרישה',
    bottomRightHeaderKa: 'ფერიშა • פרישה',
    bottomRightHeaderHe: 'פרישה',
  },
  'shulchan-aruch': {
    rightHeaderKa: 'ტაზი (ტურეი ზაჰავი) • ט״ז (טורי זהב)',
    rightHeaderHe: 'ט״ז • טורי זהב',
    centerTopHeaderKa: 'ბეერ ჰაგოლა (წყაროები) • באר הגולה',
    centerTopHeaderHe: 'באר הגולה',
    centerMainHeaderKa: 'შულხან ყარუხი (მარანი და რამა) • שולחן ערוך ומפה',
    centerMainHeaderHe: 'שולחן ערוך • מחבר ורמ״א',
    leftHeaderKa: 'შახი / მაგენ აბრაამი • ש״ך / מגן אברהם',
    leftHeaderHe: 'מגן אברהם / ש״ך',
    bottomLeftHeaderKa: 'ბეერ ჰეიტები და ფითხეი თეშუვა • באר היטב ופתחי תשובה',
    bottomLeftHeaderHe: 'באר היטב / פתחי תשובה',
    bottomRightHeaderKa: 'ბიურ ჰაგრა (ვილნის გაონი) • ביאור הגר״א',
    bottomRightHeaderHe: 'ביאור הגר״א',
  },
  'mishnah-berurah': {
    rightHeaderKa: 'მიშნა ბრურა (ხაფეც ხაიმი) • משנה ברורה',
    rightHeaderHe: 'משנה ברורה',
    centerTopHeaderKa: 'ბეერ ჰეიტები • באר היטב',
    centerTopHeaderHe: 'באר היטב',
    centerMainHeaderKa: 'შულხან ყარუხი • ორახ ხაიმი (שולחן ערוך)',
    centerMainHeaderHe: 'שולחן ערוך • אורח חיים',
    leftHeaderKa: 'ბიურ ჰალახა • ביאור הלכה',
    leftHeaderHe: 'ביאור הלכה',
    bottomLeftHeaderKa: 'შაყარ ჰაციონი (წყაროები) • שער הציון',
    bottomLeftHeaderHe: 'שער הציון',
    bottomRightHeaderKa: 'ფისკეი თეშუვოთ და თანამედროვე ჰალახა • פסקי תשובות',
    bottomRightHeaderHe: 'פסקי תשובות',
  },
  'yalkut-yosef': {
    rightHeaderKa: 'მარან რაბი ოვადია იოსეფის წყაროები (იაბია ომერი, იახვე დაათი, ხაზონ ოვადია)',
    rightHeaderHe: 'מקורות מרן הגר״ע יוסף • יביע אומר וחזון עובדיה',
    centerTopHeaderKa: 'მარან შულხან არუხი (რაბი იოსეფ კარო) • שולחן ערוך',
    centerTopHeaderHe: 'שולחן ערוך • מרן הבית יוסף',
    centerMainHeaderKa: 'იალკუტ იოსეფი - კიცურ შულხან არუხი (ילקוט יוסף - קיצור שולחן ערוך)',
    centerMainHeaderHe: 'ילקוט יוסף - קיצור שולחן ערוך',
    leftHeaderKa: 'შედარებითი ჰალახა — სეფარადული და აშკენაზური მინჰაგი (ბენ იშ ხაი, ქაფ ჰახაიმი, მიშნა ბრურა)',
    leftHeaderHe: 'השוואת מנהגים • בן איש חי ומשנה ברורה',
    bottomLeftHeaderKa: 'ორ ლეციონი და მენუხათ აჰავა • אור לציון ומנוחת אהבה',
    bottomLeftHeaderHe: 'אור לציון / מנוחת אהבה',
    bottomRightHeaderKa: 'ჰალახა ლემაასე — პრაქტიკული დასკვნა • הלכה למעשה',
    bottomRightHeaderHe: 'הלכה למעשה • סיכום',
  },
  'sephardic-halakha': {
    rightHeaderKa: 'მარან რავ ყოვადია იოსეფი (იაბიაყ ომერი / იალკუტ იოსეფი)',
    rightHeaderHe: 'מרן הגר״ע יוסף • ילקוט יוסף',
    centerTopHeaderKa: 'მარან ჰახიდა (ბირქეი იოსეფი) • ברכי יוסף (החיד״א)',
    centerTopHeaderHe: 'ברכי יוסף • החיד״א',
    centerMainHeaderKa: 'მარან შულხან ყარუხი და სეფარადული ჰალახის კოდექსი',
    centerMainHeaderHe: 'פסקי מרן השולחן ערוך והלכה ספרדית',
    leftHeaderKa: 'ბენ იშ ხაი და ქაფ ჰახაიმი • בן איש חי וכף החיים',
    leftHeaderHe: 'בן איש חי / כף החיים',
    bottomLeftHeaderKa: 'ორ ლეციონი (რავ ბენ ციონ აბა შაული) • אור לציון',
    bottomLeftHeaderHe: 'אור לציון • הגרב״צ אבא שאול',
    bottomRightHeaderKa: 'მენუხათ აჰავა (რავ მოშე ლევი) და იშ მაცლიახი • מנוחת אהבה',
    bottomRightHeaderHe: 'מנוחת אהבה • הגר״מ לוי',
  },
  talmud: {
    rightHeaderKa: 'რაში',
    rightHeaderHe: 'רש״י',
    centerTopHeaderKa: 'მიშნა',
    centerTopHeaderHe: 'משנה',
    centerMainHeaderKa: 'გემარა',
    centerMainHeaderHe: 'גמרא',
    leftHeaderKa: 'თოსაფოთი',
    leftHeaderHe: 'תוספות',
    bottomLeftHeaderKa: 'მეფორშიმი',
    bottomLeftHeaderHe: 'מפרשים',
    bottomRightHeaderKa: 'ხავრუთა',
    bottomRightHeaderHe: 'חברותא',
  },
  mishnayot: {
    rightHeaderKa: 'ბარტენურა (რაბენუ ოვადია ბარტენურა • רע״ב)',
    rightHeaderHe: 'פירוש ברטנורא • רע״ב',
    centerTopHeaderKa: 'რამბამი — ფეირუშ ჰამიშნა და ჰალახის დასკვნა',
    centerTopHeaderHe: 'פירוש המשנה להרמב״ם והלכה',
    centerMainHeaderKa: 'შისა სიდრეი მიშნა — მატნითინი (גוף המשנה)',
    centerMainHeaderHe: 'ששה סדרי משנה • גוף המשנה',
    leftHeaderKa: 'ფინხას კეჰათის განმარტება (משניות קהתי המבוארות)',
    leftHeaderHe: 'פירוש פנחס קהתי',
    bottomRightHeaderKa: 'თოსაფოთ იომ ტოვი და იკარ თოსაფოთ იომ ტოვი • תוי״ט',
    bottomRightHeaderHe: 'תוספות יום טוב / עיקר תוי״ט',
    bottomLeftHeaderKa: 'თიფერეთ ისრაელი (יכין ובועז), მეირი, მელეხეთ შლომო და ჰაგრა',
    bottomLeftHeaderHe: 'תפארת ישראל / מאירי / הגר״א',
  },
  blessings: {
    rightHeaderKa: 'სეფარადული ჰალახა',
    rightHeaderHe: 'מנהג ספרד',
    centerTopHeaderKa: 'კურთხევის კატეგორია',
    centerTopHeaderHe: 'סדר ברכות',
    centerMainHeaderKa: 'ყოველდღიური კურთხევები',
    centerMainHeaderHe: 'ברכות השחר והנהנין',
    leftHeaderKa: 'აშკენაზური ჰალახა',
    leftHeaderHe: 'מנהג אשכנז',
    bottomLeftHeaderKa: 'შულხან ყარუხი',
    bottomLeftHeaderHe: 'שולחן ערוך',
    bottomRightHeaderKa: 'ფოსკიმები',
    bottomRightHeaderHe: 'פוסקים',
  },
  siddur: {
    rightHeaderKa: 'ფირუშ ქავანათ ჰალევი • פירוש כוונת הלב',
    rightHeaderHe: 'פירוש כוונת הלב',
    centerTopHeaderKa: 'ღვთის სახელთა ქავანოთი • כוונות השם',
    centerTopHeaderHe: 'כוונות השם',
    centerMainHeaderKa: 'სიდური • סידור כוונת הלב השלם',
    centerMainHeaderHe: 'סידור כוונת הלב השלם',
    leftHeaderKa: 'ჰალახა — შულხან არუხი და იალკუტ იოსეფი',
    leftHeaderHe: 'הלכות תפילה',
    bottomLeftHeaderKa: 'მასორეთ ჰაშასი',
    bottomLeftHeaderHe: 'מסורת הש״ס',
    bottomRightHeaderKa: 'ეინ მიშპატი',
    bottomRightHeaderHe: 'עין משפט',
  },
  'daily-halakhot': {
    rightHeaderKa: 'ჰალახა I (დილის სწავლება)',
    rightHeaderHe: 'הלכה א׳ • לימוד הבוקר',
    centerTopHeaderKa: 'შתי הלכות בכל יום (მეგილა 28b)',
    centerTopHeaderHe: 'שתי הלכות בכל יום',
    centerMainHeaderKa: 'ყოველდღიური ორი ჰალახა',
    centerMainHeaderHe: 'הלכה יומית • ב׳ הלכות',
    leftHeaderKa: 'ჰალახა II (საღამოს სწავლება)',
    leftHeaderHe: 'הלכה ב׳ • לימוד הערב',
    bottomLeftHeaderKa: 'მინჰაგების შედარება',
    bottomLeftHeaderHe: 'ספרד מול אשכנז',
    bottomRightHeaderKa: 'ჰალახა ლემაასე',
    bottomRightHeaderHe: 'הלכה למעשה',
  },
  calendar: {
    rightHeaderKa: 'ჰილულა',
    rightHeaderHe: 'הילולא',
    centerTopHeaderKa: 'თარიღი',
    centerTopHeaderHe: 'תאריך',
    centerMainHeaderKa: 'კალენდარი',
    centerMainHeaderHe: 'לוח שנה',
    leftHeaderKa: 'მოვლენები',
    leftHeaderHe: 'אירועים',
    bottomLeftHeaderKa: 'თორა',
    bottomLeftHeaderHe: 'תורה',
    bottomRightHeaderKa: 'ჰალახა',
    bottomRightHeaderHe: 'הלכה',
  },
};

export interface BuiltSacredPage {
  realmId: SacredRealmId;
  bookId: string;
  bookNameKa: string;
  bookNameHe: string;
  chapterNum: number;
  chapterHe: string;
  centerTopSentences: TalmudSentence[];
  centerMainSentences: TalmudSentence[];
  rightColSentences: TalmudSentence[];
  leftColSentences: TalmudSentence[];
  bottomRightSentences: TalmudSentence[];
  bottomLeftSentences: TalmudSentence[];
}

export function numberToHebrewGematria(num: number): string {
  if (num <= 0) return 'א׳';
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const units = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const h = hundreds[Math.floor((num % 1000) / 100)] || '';
  const rem = num % 100;
  if (rem === 15) return `${h}ט״ו`;
  if (rem === 16) return `${h}ט״ז`;
  const t = tens[Math.floor(rem / 10)] || '';
  const u = units[rem % 10] || '';
  const comb = `${h}${t}${u}`;
  if (comb.length === 1) return `${comb}׳`;
  return `${comb.slice(0, -1)}״${comb.slice(-1)}`;
}

export function buildCuratedSacredPage(
  realmId: SacredRealmId,
  book: SacredBookItem,
  chapterNum: number
): BuiltSacredPage {
  if (realmId === 'yalkut-yosef') {
    return buildYalkutYosefSacredPage(book, chapterNum);
  }
  const chHe = numberToHebrewGematria(chapterNum);
  const colCfg = REALM_COLUMN_CONFIGS[realmId];

  if (realmId === 'torah') {
    const isExodus = book.id === 'Exodus';
    const isLeviticus = book.id === 'Leviticus';
    const isNumbers = book.id === 'Numbers';
    const isDeuteronomy = book.id === 'Deuteronomy';

    const centerMain: TalmudSentence[] = isExodus
      ? [
          {
            id: `torah-${book.id}-${chapterNum}-1`,
            source: 'gemara',
            dibburHamatchil: 'א',
            hebrew:
              '°וְאֵלֶּה שְׁמוֹת בְּנֵי יִשְׂרָאֵל הַבָּאִים מִצְרָיְמָה אֵת יַעֲקֹב אִישׁ וּבֵיתוֹ בָּאוּ׃',
            translationKa:
              'და ეს არის სახელები ისრაელის ძეთა, რომელნიც ჩავიდნენ ეგვიპტეში იაკობთან ერთად — თითოეული კაცი თავისი სახლეულით ჩავიდა.',
            explanationKa:
              'შემოთ (გამოსვლა) 1:1 — მიკრაოთ გედოლოთის დასაწყისი. გამჩენი სიყვარულით კვლავ ჩამოთვლის იაკობის შვილებს სახელებით, როგორც ცის ვარსკვლავებს.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-2`,
            source: 'gemara',
            dibburHamatchil: 'ב',
            hebrew: '°רְאוּבֵן שִׁמְעוֹן לֵוִי וִיהוּדָה׃',
            translationKa: 'რეუვენი, შიმონი, ლევი და იეჰუდა.',
            explanationKa: 'შემოთ 1:2 — ლეას უფროსი ძეები.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-3`,
            source: 'gemara',
            dibburHamatchil: 'ג',
            hebrew: 'יִשָּׂשכָר זְבוּלֻן וּבִנְיָמִן׃',
            translationKa: 'ისახარი, ზებულუნი და ბინიამინი.',
            explanationKa: 'შემოთ 1:3 — ლეასა და რახელის ძეები.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-4`,
            source: 'gemara',
            dibburHamatchil: 'ד',
            hebrew: 'דָּן וְנַפְתָּלִי גָּד וְאָשֵׁר׃',
            translationKa: 'დანი და ნაფთალი, გადი და აშერი.',
            explanationKa: 'შემოთ 1:4 — ბილჰასა და ზილფას ძეები.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-5`,
            source: 'gemara',
            dibburHamatchil: 'ה',
            hebrew:
              '°וַיְהִי כָּל־נֶפֶשׁ יֹצְאֵי יֶרֶךְ־יַעֲקֹב שִׁבְעִים נָפֶשׁ וְיוֹסֵף הָיָה בְמִצְרָיִם׃',
            translationKa:
              'და იყო ყოველი სული, იაკობის წელიდან გამოსული — სამოცდაათი სული; ხოლო იოსეფი უკვე ეგვიპტეში იყო.',
            explanationKa:
              'შემოთ 1:5 — იოხევედი დაიბადა ეგვიპტის კარიბჭესთან („ბეინ ჰახომოთ“) და შეავსო სამოცდაათი სულის რიცხვი.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-6`,
            source: 'gemara',
            dibburHamatchil: 'ו',
            hebrew: '°וַיָּמָת יוֹסֵף וְכָל־אֶחָיו וְכֹל הַדּוֹר הַהוּא׃',
            translationKa: 'და გარდაიცვალა იოსეფი, მისი ყველა ძმა და მთელი ის თაობა.',
            explanationKa:
              'შემოთ 1:6 — სანამ თორმეტი ტომის მამამთავრები ცოცხლები იყვნენ, ეგვიპტელებმა ვერ შეძლეს ისრაელის დამონება.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-7`,
            source: 'gemara',
            dibburHamatchil: 'ז',
            hebrew:
              '°וּבְנֵי יִשְׂרָאֵל פָּרוּ וַיִּשְׁרְצוּ וַיִּרְבּוּ וַיַּעַצְמוּ בִּמְאֹד מְאֹד וַתִּמָּלֵא הָאָרֶץ אֹתָם׃ פ',
            translationKa:
              'ხოლო ისრაელის ძენი ნაყოფიერდებოდნენ, მრავლდებოდნენ, იზრდებოდნენ და მეტისმეტად ძლიერდებოდნენ, და აივსო ქვეყანა მათით. [פרשה פתוחה — פ]',
            explanationKa:
              'შემოთ 1:7 — პირველი ფარაშა ფეთუხა (פ) შემოთის დაფზე, ზუსტად ისე, როგორც დაბეჭდილ მიკრაოთ გედოლოთშია.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-8`,
            source: 'gemara',
            dibburHamatchil: 'ח',
            hebrew: '°וַיָּקָם מֶלֶךְ־חָדָשׁ עַל־מִצְרָיִם אֲשֶׁר לֹא־יָדַע אֶת־יוֹסֵף׃',
            translationKa:
              'და აღდგა ახალი მეფე ეგვიპტეზე, რომელმაც არ იცოდა იოსეფი.',
            explanationKa:
              'შემოთ 1:8 — რავი და შმუელი გემარა სოტაში (11a): ერთი ამბობს, რომ მართლაც ახალი მეფე იყო, ხოლო მეორე — რომ მისი ბრძანებულებები განახლდა.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-9`,
            source: 'gemara',
            dibburHamatchil: 'ט',
            hebrew:
              '°וַיֹּאמֶר אֶל־עַמּוֹ הִנֵּה עַם בְּנֵי יִשְׂרָאֵל רַב וְעָצוּם מִמֶּנּוּ׃',
            translationKa:
              'და უთხრა თავის ხალხს: აჰა, ისრაელის ძეთა ხალხი ჩვენზე მრავალრიცხოვანი და ძლიერია.',
            explanationKa: 'შემოთ 1:9 — ფარაონის შიში ისრაელის სულიერი და ფიზიკური გამრავლების წინაშე.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-10`,
            source: 'gemara',
            dibburHamatchil: 'י',
            hebrew:
              '°הָבָה נִתְחַכְּמָה לוֹ פֶּן־יִרְבֶּה וְהָיָה כִּי־תִקְרֶאנָה מִלְחָמָה וְנוֹסַף גַּם־הוּא עַל־שֹׂנְאֵינוּ וְנִלְחַם־בָּנוּ וְעָלָה מִן־הָאָרֶץ׃',
            translationKa:
              'მოდი, სიბრძნით მოვეკიდოთ მას, რათა არ გამრავლდეს და თუ ომი შეგვემთხვევა, ისიც არ შეუერთდეს ჩვენს მტრებს, არ შეგვებრძოლოს და არ გავიდეს ქვეყნიდან.',
            explanationKa:
              'შემოთ 1:10 — რაში და გემარა სოტა 11a: „ნითხაქმა ლო“ — ისრაელის მხსნელის წინააღმდეგ წყლით სცადეს ბრძოლა.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-11`,
            source: 'gemara',
            dibburHamatchil: 'יא',
            hebrew:
              '°וַיָּשִׂימוּ עָלָיו שָׂרֵי מִסִּים לְמַעַן עַנֹּתוֹ בְּסִבְלֹתָם וַיִּבֶן עָרֵי מִסְכְּנוֹת לְפַרְעֹה אֶת־פִּתֹם וְאֶת־רַעַמְסֵס׃',
            translationKa:
              'და დაუყენეს მას ხარკის უფროსები, რათა დაეტანჯათ მძიმე ტვირთით; და აუშენა მან საგანძურის ქალაქები ფარაონს — ფითომი და რაამსესი.',
            explanationKa: 'შემოთ 1:11 — ფითომისა და რაამსესის მშენებლობა.',
          },
          {
            id: `torah-${book.id}-${chapterNum}-12`,
            source: 'gemara',
            dibburHamatchil: 'יב',
            hebrew:
              '°וְכַאֲשֶׁר יְעַנּוּ אֹתוֹ כֵּן יִרְבֶּה וְכֵן יִפְרֹץ וַיָּקֻצוּ מִפְּנֵי בְּנֵי יִשְׂרָאֵל׃',
            translationKa:
              'მაგრამ რაც უფრო ტანჯავდნენ მას, მით უფრო მრავლდებოდა და მით უფრო ძლიერდებოდა; და შეძრწუნდნენ ისრაელის ძეთა წინაშე.',
            explanationKa:
              'შემოთ 1:12 — „კენ ირბე ვეხენ იფროც“ — სულიერი სიმტკიცე განსაცდელის დროს.',
          },
        ]
      : isLeviticus
        ? [
            {
              id: `torah-${book.id}-${chapterNum}-1`,
              source: 'gemara',
              dibburHamatchil: 'א',
              hebrew:
                '°וַיִּקְרָא אֶל־מֹשֶׁה וַיְדַבֵּר יְהוָה אֵלָיו מֵאֹהֶל מוֹעֵד לֵאמֹר׃',
              translationKa:
                'და მოუწოდა მოშეს და ელაპარაკა უფალი მას კრებულის კარვიდან (ოჰელ მოედიდან) და უთხრა:',
              explanationKa:
                'ვაიკრა (ლევიანნი) 1:1 — ყოველ საუბარს წინ უძღოდა სიყვარულით მოწოდება („ვაიკრა“ პატარა ალეფით — მოსეს თავმდაბლობის ნიშანი).',
            },
            {
              id: `torah-${book.id}-${chapterNum}-2`,
              source: 'gemara',
              dibburHamatchil: 'ב',
              hebrew:
                '°דַּבֵּר אֶל־בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם אָדָם כִּי־יַקְרִיב מִכֶּם קָרְבָּן לַיהוָה מִן־הַבְּהֵמָה מִן־הַבָּקָר וּמִן־הַצֹּאן תַּקְרִיבוּ אֶת־קָרְבַּנְכֶם׃',
              translationKa:
                'უთხარი ისრაელის ძეთ და გადაეცი მათ: როდესაც ადამიანი თქვენგან შესწირავს შესაწირავს (კორბანს) უფალს პირუტყვიდან — მსხვილფეხა და წვრილფეხა საქონლიდან შესწირეთ თქვენი შესაწირავი.',
              explanationKa: 'ვაიკრა 1:2 — კორბანის (დაახლოების) საფუძვლები.',
            },
            {
              id: `torah-${book.id}-${chapterNum}-3`,
              source: 'gemara',
              dibburHamatchil: 'ג',
              hebrew:
                '°אִם־עֹלָה קָרְבָּנוֹ מִן־הַבָּקָר זָכָר תָּמִים יַקְרִיבֶנּוּ אֶל־פֶּתַח אֹהֶל מוֹעֵד יַקְרִיב אֹתוֹ לִרְצֹנוֹ לִפְנֵי יְהוָה׃',
              translationKa:
                'თუ სრულადდასაწველია (ოლა) მისი შესაწირავი მსხვილფეხა საქონლიდან, უნაკლო მამრი უნდა შესწიროს; კრებულის კარვის შესასვლელთან მიიყვანოს იგი თავისი ნებით უფლის წინაშე.',
              explanationKa: 'ვაიკრა 1:3 — ოლას მსხვერპলშეწირვის ჰალახა.',
            },
            {
              id: `torah-${book.id}-${chapterNum}-4`,
              source: 'gemara',
              dibburHamatchil: 'ד',
              hebrew:
                '°וְסָמַךְ יָדוֹ עַל רֹאשׁ הָעֹלָה וְנִרְצָה לוֹ לְכַפֵּר עָלָיו׃',
              translationKa:
                'და დაადოს თავისი ხელი სრულადდასაწველის თავს (სმიხა), და სასურველი გახდება მისთვის მის გამოსასყიდად.',
              explanationKa: 'ვაიკრა 1:4 — სმიხის (ხელის დადების) მცნება ტაძარში.',
            },
          ]
        : isNumbers
          ? [
              {
                id: `torah-${book.id}-${chapterNum}-1`,
                source: 'gemara',
                dibburHamatchil: 'א',
                hebrew:
                  '°וַיְדַבֵּר יְהוָה אֶל־מֹשֶׁה בְּמִדְבַּר סִינַי בְּאֹהֶל מוֹעֵד בְּאֶחָד לַחֹדֶשׁ הַשֵּׁנִי בַּשָּׁנָה הַשֵּׁנִית לְצֵאתָם מֵאֶרֶץ מִצְרַיִם לֵאמֹר׃',
                translationKa:
                  'და ელაპარაკა უფალი მოშეს სინაის უდაბნოში, კრებულის კარავში, მეორე თვის პირველ დღეს, ეგვიპტის ქვეყნიდან მათი გამოსვლის მეორე წელს, და უთხრა:',
                explanationKa: 'ბამიდბარ (რიცხვნი) 1:1 — ისრაელის აღრიცხვა სიყვარულის ნიშნად.',
              },
              {
                id: `torah-${book.id}-${chapterNum}-2`,
                source: 'gemara',
                dibburHamatchil: 'ב',
                hebrew:
                  '°שְׂאוּ אֶת־רֹאשׁ כָּל־עֲדַת בְּנֵי־יִשְׂרָאֵל לְמִשְׁפְּחֹתָם לְבֵית אֲבֹתָם בְּמִסְפַּר שֵׁמוֹת כָּל־זָכָר לְגֻלְגְּלֹתָם׃',
                translationKa:
                  'აღრიცხეთ (აამაღლეთ თავი) ისრაელის ძეთა მთელი თემი მათი საგვარეულოებისა და მამის სახლების მიხედვით, სახელთა ჩამოთვლით, ყოველი მამაკაცი სულადობით.',
                explanationKa: 'ბამიდბარ 1:2 — ნახევარ-შეკელით აღრიცხვის საფუძველი.',
              },
              {
                id: `torah-${book.id}-${chapterNum}-3`,
                source: 'gemara',
                dibburHamatchil: 'ג',
                hebrew:
                  '°מִבֶּן עֶשְׂרִים שָׁנָה וָמַעְלָה כָּל־יֹצֵא צָבָא בְּיִשְׂרָאֵל תִּפְקְדוּ אֹתָם לְצִבְאֹתָם אַתָּה וְאַהֲרֹן׃',
                translationKa:
                  'ოცი წლის ასაკიდან და ზემოთ, ყველა ლაშქარში გამსვლელი ისრაელში — აღრიცხეთ ისინი მათი წყობების მიხედვით შენ და აჰარონმა.',
                explanationKa: 'ბამიდბარ 1:3 — ტომების მთავართა მონაწილეობა აღრიცხვაში.',
              },
            ]
          : isDeuteronomy
            ? [
                {
                  id: `torah-${book.id}-${chapterNum}-1`,
                  source: 'gemara',
                  dibburHamatchil: 'א',
                  hebrew:
                    '°אֵלֶּה הַדְּבָרִים אֲשֶׁר דִּבֶּר מֹשֶׁה אֶל־כָּל־יִשְׂרָאֵל בְּעֵבֶר הַיַּרְדֵּן בַּמִּדְבָּר בָּעֲרָבָה מוֹל סוּף בֵּין־פָּארָן וּבֵין־תֹּפֶל וְלָבָן וַחֲצֵרֹת וְדִי זָהָב׃',
                  translationKa:
                    'ეს არის სიტყვები, რომლებიც უთხრა მოშემ მთელ ისრაელს იორდანეს გაღმა, უდაბნოში, არავაში, სუფის პირდაპირ, ფარანსა და თოფელს, ლავანს, ხაცეროთსა და დი-ზაჰავს შორის.',
                  explanationKa:
                    'დევარიმ (მეორე რჯული) 1:1 — მოშე რაბენუს შეგონება ადგილის სახელებით, რათა დაეცვა ისრაელის ღირსება.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-2`,
                  source: 'gemara',
                  dibburHamatchil: 'ב',
                  hebrew:
                    '°אַחַד עָשָׂר יוֹם מֵחֹרֵב דֶּרֶךְ הַר־שֵׂעִיר עַד קָדֵשׁ בַּרְנֵעַ׃',
                  translationKa:
                    'თერთმეტი დღის სავალია ხორევიდან სეირის მთის გზით კადეშ-ბარნეამდე.',
                  explanationKa: 'დევარიმ 1:2 — სინაის მთიდან აღთქმულ მიწამდე გზის სისწრაფე.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-3`,
                  source: 'gemara',
                  dibburHamatchil: 'ג',
                  hebrew:
                    '°וַיְהִי בְּאַרְבָּעִים שָׁנָה בְּעַשְׁתֵּי־עָשָׂר חֹדֶשׁ בְּאֶחָד לַחֹדֶשׁ דִּבֶּר מֹשֶׁה אֶל־בְּנֵי יִשְׂרָאֵל כְּכֹל אֲשֶׁר צִוָּה יְהוָה אֹתוֹ אֲלֵהֶם׃',
                  translationKa:
                    'და იყო მეორმოცე წელს, მეთერთმეტე თვეს, თვის პირველ დღეს (შვატის თვის 1-ლ დღეს), ელაპარაკა მოშე ისრაელის ძეთ ყოველივეს, რაც უბრძანა უფალმა მას მათთვის.',
                  explanationKa: 'დევარიმ 1:3 — მიშნე თორის (თორის განმარტების) დაწყება როშ ხოდეშ შვატს.',
                },
              ]
            : [
                {
                  id: `torah-${book.id}-${chapterNum}-1`,
                  source: 'gemara',
                  dibburHamatchil: 'א',
                  hebrew:
                    '°בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃',
                  translationKa: 'დასაწყისში შექმნა ღმერთმა ცა და მიწა.',
                  explanationKa:
                    'ბერეშით 1:1 — სამყაროს შექმნა თორისა და ისრაელის გულისთვის, რომლებსაც ეწოდებათ „რეშით“ (დასაწყისი).',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-2`,
                  source: 'gemara',
                  dibburHamatchil: 'ב',
                  hebrew:
                    '°וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם׃',
                  translationKa:
                    'ხოლო მიწა იყო უსახური და უდაბური, ბნელი იდო უფსკრულის პირზე და სული ღვთისა იძვროდა წყალთა პირზე.',
                  explanationKa: 'ბერეშით 1:2 — დიდების ტახტი და მაშიახის სული წყალთა ზემოთ.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-3`,
                  source: 'gemara',
                  dibburHamatchil: 'ג',
                  hebrew: '°וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי־אוֹר׃',
                  translationKa: 'და თქვა ღმერთმა: „იქმნას ნათელი!“ და იქმნა ნათელი.',
                  explanationKa: 'ბერეშით 1:3 — პირველქმნილი ნათლის გაჩენა ღვთაებრივი სიტყვით.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-4`,
                  source: 'gemara',
                  dibburHamatchil: 'ד',
                  hebrew:
                    '°וַיַּרְא אֱלֹהִים אֶת־הָאוֹר כִּי־טוֹב וַיַּבְדֵּל אֱלֹהִים בֵּין הָאוֹר וּבֵין הַחֹשֶׁךְ׃',
                  translationKa:
                    'და იხილა ღმერთმა ნათელი, რომ კარგი იყო, და გაჰყო ღმერთმა ნათელი და ბნელი.',
                  explanationKa:
                    'ბერეშით 1:4 — „ორ ჰაგანუზი“ (დაფარული ნათელი), რომელიც ცადიკებისთვის შეინახა მომავალ სამყაროში (ხაგიგა 12a).',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-5`,
                  source: 'gemara',
                  dibburHamatchil: 'ה',
                  hebrew:
                    '°וַיִּקְרָא אֱלֹהִים לָאוֹר יוֹם וְלַחֹשֶׁךְ קָרָא לָיְלָה וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם אֶחָד׃ פ',
                  translationKa:
                    'და უწოდა ღმერთმა ნათელს დღე, ხოლო ბნელს უწოდა ღამე; და იყო საღამო და იყო დილა — დღე ერთი. [פרשה פתוחה — פ]',
                  explanationKa:
                    'ბერეშით 1:5 — „იომ ეხად“ (ერთადერთი დღე), როდესაც გამჩენი მარტო იყო სამყაროში ანგელოზთა შექმნამდე.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-6`,
                  source: 'gemara',
                  dibburHamatchil: 'ו',
                  hebrew:
                    '°וַיֹּאמֶר אֱלֹהִים יְהִי רָקִיעַ בְּתוֹךְ הַמָּיִם וִיהִי מַבְדִּיל בֵּין מַיִם לָמָיִם׃',
                  translationKa:
                    'და თქვა ღმერთმა: იყოს მყარი წყალთა შორის და ჰყოფდეს იგი წყალს წყლისაგან.',
                  explanationKa: 'ბერეშით 1:6 — მეორე დღის ქმნილება და ცის სიმყარე.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-7`,
                  source: 'gemara',
                  dibburHamatchil: 'ז',
                  hebrew:
                    '°וַיַּעַשׂ אֱלֹהִים אֶת־הָרָקִיעַ וַיַּבְדֵּל בֵּין הַמַּיִם אֲשֶׁר מִתַּחַת לָרָקִיעַ וּבֵין הַמַּיִם אֲשֶׁר מֵעַל לָרָקִיעַ וַיְהִי־כֵן׃',
                  translationKa:
                    'და შექმნა ღმერთმა მყარი, და განაცალკევა წყალი, რომელიც მყარის ქვემოთ იყო, იმ წყლისაგან, რომელიც მყარის ზემოთ იყო; და იქმნა ასე.',
                  explanationKa: 'ბერეშით 1:7 — ზედა და ქვედა წყლების გამიჯვნა.',
                },
                {
                  id: `torah-${book.id}-${chapterNum}-8`,
                  source: 'gemara',
                  dibburHamatchil: 'ח',
                  hebrew:
                    '°וַיִּקְרָא אֱלֹהִים לָרָקִיעַ שָׁמָיִם וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם שֵׁנִי׃ פ',
                  translationKa:
                    'და უწოდა ღმერთმა მყარს ცა (შამაიმ); და იყო საღამო და იყო დილა — დღე მეორე. [פרשה פתוחה — פ]',
                  explanationKa: 'ბერეშით 1:8 — „შამაიმ“ (ეშ უმაიმ — ცეცხლი და წყალი).',
                },
              ];

    const centerTop: TalmudSentence[] = isExodus
      ? [
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-1`,
            source: 'mishnah',
            dibburHamatchil: 'א',
            hebrew:
              'וְאִלֵּין שְׁמָהָת בְּנֵי יִשְׂרָאֵל דְּעָלוּ לְמִצְרָיִם עִם יַעֲקֹב גְּבַר וַאֲנָשׁ בֵּיתֵיהּ עָלוּ׃',
            translationKa:
              'ონკელოსი (1): და ეს არის სახელები ისრაელის ძეთა, რომელნიც შევიდნენ ეგვიპტეში იაკობთან ერთად — კაცი და მისი სახლეულის ხალხი შევიდნენ.',
            explanationKa: 'თარგუმ ონკელოსი შემოთ 1:1-ზე.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-2`,
            source: 'mishnah',
            dibburHamatchil: 'ב',
            hebrew: 'רְאוּבֵן שִׁמְעוֹן לֵוִי וִיהוּדָה׃ ג יִשָּׂשכָר זְבוּלֻן וּבִנְיָמִן׃ ד דָּן וְנַפְתָּלִי גָּד וְאָשֵׁר׃',
            translationKa:
              'ონკელოსი (2–4): რეუვენი, შიმონი, ლევი და იეჰუდა; ისახარი, ზებულუნი და ბინიამინი; დანი და ნაფთალი, გადი და აშერი.',
            explanationKa: 'თარგუმ ონკელოსი შემოთ 1:2–4-ზე.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-3`,
            source: 'mishnah',
            dibburHamatchil: 'ה',
            hebrew:
              'וַהֲוָה כָּל נַפְשָׁא נָפְקֵי יַרְכָּא דְיַעֲקֹב שַׁבְעִין נַפְשָׁן וְיוֹסֵף הֲוָה בְמִצְרָיִם׃ ו וּמִית יוֹסֵף וְכָל אֲחוֹהִי וְכָל דָּרָא הַהוּא׃',
            translationKa:
              'ონკელოსი (5–6): და იყო ყოველი სული, იაკობის საზარდულიდან გამოსული, სამოცდაათი სული, ხოლო იოსეფი იყო ეგვიპტეში. და მოკვდა იოსეფი, მისი ყველა ძმა და მთელი ის თაობა.',
            explanationKa: 'თარგუმ ონკელოსი შემოთ 1:5–6-ზე.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-4`,
            source: 'mishnah',
            dibburHamatchil: 'ז',
            hebrew:
              'וּבְנֵי יִשְׂרָאֵל נְפִישׁוּ וְאִתְיַלַּדוּ וּסְגִיאוּ וּתְקִיפוּ לַחֲדָא לַחֲדָא וְאִתְמְלִיאַת אַרְעָא מִנְּהוֹן׃ ח וְקָם מַלְכָּא חַדְתָּא עַל מִצְרָיִם דְּלָא מְקַיֵּים גְּזֵירַת יוֹסֵף׃',
            translationKa:
              'ონკელოსი (7–8): ხოლო ისრაელის ძენი გამრავლდნენ, იშვნენ, გაიზარდნენ და მეტისმეტად გაძლიერდნენ, და აივსო მიწა მათგან. და აღდგა ახალი მეფე ეგვიპტეზე, რომელიც არ ასრულებდა იოსეფის დადგენილებას.',
            explanationKa: 'თარგუმ ონკელოსი შემოთ 1:7–8-ზე.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-5`,
            source: 'mishnah',
            dibburHamatchil: 'ט',
            hebrew:
              'וַאֲמַר לְעַמֵּיהּ הָא עַמָּא בְּנֵי יִשְׂרָאֵל סַגִּיאִין וְתַקִּיפִין מִנַּנָא׃ י הָבוּ נִתְחַכַּם לְהוֹן דִּלְמָא יִסְגּוֹן וִיהֵי אֲרֵי יְעַרְעִנַּנָא קְרָב וְיִתּוֹסַף אַף הוּא עַל סָנְאַנָא וִיגִיחַ בַּנָא קְרָב וְיִסַּק מִן אַרְעָא׃',
            translationKa:
              'ონკელოსი (9–10): და უთხრა თავის ხალხს: აჰა, ისრაელის ძეთა ხალხი ჩვენზე მრავალი და ძლიერია. მოდი, სიბრძნით მოვექცეთ მათ, რათა არ გამრავლდნენ...',
            explanationKa: 'თარგუმ ონკელოსი შემოთ 1:9–10-ზე.',
          },
        ]
      : [
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-1`,
            source: 'mishnah',
            dibburHamatchil: 'א',
            hebrew:
              'בְּקַדְמִין בְּרָא יְיָ יָת שְׁמַיָּא וְיָת אַרְעָא׃ ב וְאַרְעָא הֲוָת צָדְיָא וְרֵיקַנְיָא וַחֲשׁוֹכָא עַל אַפֵּי תְהוֹמָא וְרוּחָא מִן קֳדָם יְיָ מְנַשְּׁבָא עַל אַפֵּי מַיָּא׃',
            translationKa:
              'ონკელოსი (1–2): თავდაპირველად შექმნა უფალმა ცა და მიწა; და მიწა იყო უკაცრიელი და ცარიელი, და ბნელი იდო უფსკრულის პირზე...',
            explanationKa: 'თარგუმ ონკელოსი — სინაის მთიდან გადმოცემული ავტორიტეტული არამეული თარგმანი.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-2`,
            source: 'mishnah',
            dibburHamatchil: 'ג',
            hebrew:
              'וַאֲמַר יְיָ יְהֵי נְהוֹרָא וַהֲוָה נְהוֹרָא׃ ד וַחֲזָא יְיָ יָת נְהוֹרָא אֲרֵי טָב וְאַפְרֵישׁ יְיָ בֵּין נְהוֹרָא וּבֵין חֲשׁוֹכָא׃ ה וּקְרָא יְיָ לִנְהוֹרָא יְמָמָא וְלַחֲשׁוֹכָא קְרָא לֵילְיָא וַהֲוָה רְמַשׁ וַהֲוָה צְפַר יוֹם חָד׃',
            translationKa:
              'ონკელოსი (3–5): და თქვა უფალმა: იყოს ნათელი, და იქმნა ნათელი. და იხილა უფალმა ნათელი, რომ კარგია, და განაცალკევა ნათელი და ბნელი. და უწოდა ნათელს დღე, ხოლო ბნელს უწოდა ღამე.',
            explanationKa: 'ონკელოსის სიტყვასიტყვითი და ჰალახურად დაზუსტებული არამეული ტექსტი.',
          },
          {
            id: `torah-onkelos-${book.id}-${chapterNum}-3`,
            source: 'mishnah',
            dibburHamatchil: 'ו',
            hebrew:
              'וַאֲמַר יְיָ יְהֵי רְקִיעָא בִּמְצַע מַיָּא וִיהֵי מַפְרֵישׁ בֵּין מַיָּא לְמַיָּא׃ ז וַעֲבַד יְיָ יָת רְקִיעָא וְאַפְרֵישׁ בֵּין מַיָּא דִּלְרַע לִרְקִיעָא וּבֵין מַיָּא דִּלְעֵילָּא לִרְקִיעָא וַהֲוָה כֵן׃',
            translationKa:
              'ონკელოსი (6–7): და თქვა უფალმა: იყოს მყარი წყალთა შუა და განაცალკევებდეს წყალს წყლისაგან.',
            explanationKa: 'თარგუმ ონკელოსი მეორე დღის ქმნილებაზე.',
          },
        ];

    const rightRashi: TalmudSentence[] = isExodus
      ? [
          {
            id: `torah-rashi-${book.id}-${chapterNum}-1`,
            source: 'rashi',
            dibburHamatchil: 'ואלה שמות בני ישראל.',
            hebrew:
              'ואלה שמות בני ישראל. אַף עַל פִּי שֶׁמְּנָאָן בְּחַיֵּיהֶם בִּשְׁמוֹתָם, חָזַר וּמְנָאָן בְּמִיתָתָן לְהוֹדִיעַ חִבָּתָן שֶׁנִּמְשְׁלוּ לַכּוֹכָבִים שֶׁמּוֹצִיאָן וּמַכְנִיסָן בְּמִסְפָּר וּבִשְׁמוֹתָם, שֶׁנֶּאֱמַר הַמּוֹצִיא בְמִסְפָּר צְבָאָם לְכֻלָּם בְּשֵׁם יִקְרָא (שבת דף כ״א:):',
            translationKa:
              'რაში (1): „და ეს არის სახელები ისრაელის ძეთა“ — მიუხედავად იმისა, რომ მათ სიცოცხლეშივე აღრიცხა სახელებით, გარდაცვალების შემდეგ კვლავ ჩამოთვალა სახელებით, რათა გვაუწყოს მათი სიყვარული: ისინი შედარებულნი არიან ვარსკვლავებს, რომლებსაც გამჩენი ითვლის და სახელებით მოუხმობს (შაბათი 21b).',
            explanationKa: 'פירש״י • შემოთ 1:1 (პირველი სვეტი).',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-2`,
            source: 'rashi',
            dibburHamatchil: 'הבאים מצרימה.',
            hebrew:
              'הבאים מצרימה. עַל שֵׁם הַשָּׁעָה קוֹרֵא אוֹתָם בָּאִים, שֶׁהָיָה דּוֹמֶה לָהֶם כְּאִלּוּ אוֹתָהּ שָׁעָה נִכְנְסוּ לְמִצְרַיִם, שֶׁכָּל זְמַן שֶׁהָיָה יוֹסֵף קַיָּם לֹא הָיָה עֲלֵיהֶם מַשְׂאוֹי שֶׁל מִצְרַיִם, וּמִשֶּׁמֵּת יוֹסֵף נָתְנוּ עֲלֵיהֶם עֹל (ברכות דף ב.):',
            translationKa:
              'რაში (1): „ჩამსვლელნი ეგვიპტეში“ — იმ საათის მიხედვით უწოდებს მათ „ჩამსვლელებს“, რადგან სანამ იოსეფი ცოცხალი იყო, მათზე არ იდო ეგვიპტის უღელი, ხოლო როცა იოსეფი გარდაიცვალა, დაადგეს მათ მონობის უღელი, თითქოს სწორედ იმ დღეს ჩავიდნენ ეგვიპტეში (ბერახოთი 2a).',
            explanationKa: 'פירש״י • შემოთ 1:1.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-3`,
            source: 'rashi',
            dibburHamatchil: 'את יעקב.',
            hebrew:
              'את יעקב. עַל שֵׁם יַעֲקֹב שֶׁבָּאוּ בִּשְׁבִילוֹ. ויהי כל נפש וגו׳ שבעים נפש. יוֹכֶבֶד הִשְׁלִימָה אֶת הַמִּנְיָן שֶׁנּוֹלְדָה בֵּין הַחוֹמוֹת בִּכְנִיסָתָן לָעִיר (בבא בתרא דף קכ״ג.):',
            translationKa:
              'რაში (5): „იაკობთან ერთად“ — იაკობის პატივსაცემად. „სამოცდაათი სული“ — იოხევედმა შეავსო სამოცდაათის რიცხვი, რადგან იგი დაიბადა ეგვიპტის კედლებს შორის ქალაქში შესვლისას (ბაბა ბათრა 123a).',
            explanationKa: 'פירש״י • შემოთ 1:5.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-4`,
            source: 'rashi',
            dibburHamatchil: 'ובני ישראל פרו וישרצו.',
            hebrew:
              'ובני ישראל פרו וישרצו. שֶׁהָיוּ יוֹלְדוֹת שִׁשָּׁה בְּכֶרֶס אֶחָד (סוטה דף י״א:). ויקם מלך חדש. רַב וּשְׁמוּאֵל, חַד אָמַר חָדָשׁ מַמָּשׁ, וְחַד אָמַר שֶׁנִּתְחַדְּשׁוּ גְּזֵירוֹתָיו (סוטה דף י״א. עירובין דף נ״ג.):',
            translationKa:
              'რაში (7–8): „და ისრაელის ძენი გამრავლდნენ“ — თითო მუცელზე ექვს ტყუპს შობდნენ (სოტა 11b). „და აღდგა ახალი მეფე“ — რავი და შმუელი: ერთი ამბობს, რომ მართლაც ახალი მეფე იყო, ხოლო მეორე — რომ განახლდა მისი ბრძანებულებები (სოტა 11a, ერუვინი 53a).',
            explanationKa: 'פירש״י • შემოთ 1:7–8 (მეორე სვეტი).',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-5`,
            source: 'rashi',
            dibburHamatchil: 'אשר לא ידע את יוסף.',
            hebrew:
              'אשר לא ידע את יוסף. עָשָׂה עַצְמוֹ כְּאִלּוּ לֹא יָדַע (סוטה דף י״א.). הבה נתחכמה לו. כָּל הָבָה לְשׁוֹן הַזְמָנָה וַהֲכָנָה לַדָּבָר הוּא, נִתְחַכְּמָה לְמוֹשִׁיעָן שֶׁל יִשְׂרָאֵל לְדוּנָם בְּמַיִם שֶׁכְּבָר נִשְׁבַּע שֶׁלֹּא יָבִיא מַבּוּל לָעוֹלָם:',
            translationKa:
              'რაში (8–10): „რომელმაც არ იცოდა იოსეფი“ — თავი მოიკატუნა, თითქოს არ იცნობდა (სოტა 11a). „მოდი, სიბრძნით მოვეკიდოთ მას“ — ყოველი „ჰავა“ ნიშნავს მომზადებას; მათ გადაწყვიტეს წყლით დაესაჯათ ისრაელი, რადგან გამჩენმა დაიფიცა, რომ წარღვნას აღარ მოავლენდა.',
            explanationKa: 'פירש״י • შემოთ 1:8–10.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-6`,
            source: 'rashi',
            dibburHamatchil: 'שרי מסים.',
            hebrew:
              'שרי מסים. שָׂרִים שֶׁגּוֹבִין מֵהֶם הַמַּס, וּמַהוּ הַמַּס שֶׁיִּבְנוּ עָרֵי מִסְכְּנוֹת לְפַרְעֹה. וכאשר יענו אתו כן ירבה. כֵּן רָבָה וְכֵן פָּרַץ, רוּחַ הַקֹּדֶשׁ אוֹמֶרֶת כֵּן, אַתֶּם אוֹמְרִים פֶּן יִרְבֶּה וַאֲנִי אוֹמֵר כֵּן יִרְבֶּה (סוטה דף י״א.):',
            translationKa:
              'რაში (11–12): „ხარკის უფროსები“ — უფროსები, რომლებიც აიძულებდნენ ფარაონის საგანძურის ქალაქების შენებას. „და რაც უფრო ტანჯავდნენ, მით უფრო მრავლდებოდა“ — წმინდა სული (რუახ ჰაკოდეში) პასუხობს: თქვენ ამბობთ „რათა არ გამრავლდეს“ (פן ירבה), მე კი ვამბობ „მით უფრო გამრავლდება“ (כן ירבה) (სოტა 11a).',
            explanationKa: 'פירש״י • შემოთ 1:11–12.',
          },
        ]
      : [
          {
            id: `torah-rashi-${book.id}-${chapterNum}-1`,
            source: 'rashi',
            dibburHamatchil: 'בראשית ברא.',
            hebrew:
              'בראשית ברא. אָמַר רַבִּי יִצְחָק: לֹא הָיָה צָרִיךְ לְהַתְחִיל אֶת הַתּוֹרָה אֶלָּא מִ״הַחֹדֶשׁ הַזֶּה לָכֶם״ שֶׁהִיא מִצְוָה רִאשׁוֹנָה שֶׁנִּצְטַוּוּ בָּהּ יִשְׂרָאֵל, וּמַה טַּעַם פָּתַח בִּבְרֵאשִׁית? מִשּׁוּם ״כֹּחַ מַעֲשָׂיו הִגִּיד לְעַמּוֹ לָתֵת לָהֶם נַחֲלַת גּוֹיִם״ (ברכות דף ב. שבת דף כ״א:):',
            translationKa:
              'რაში (1): თქვა რაბი იცხაკმა — თორა უნდა დაწყებულიყო პირველი მცნებით („ეს თვე იყოს თქვენთვის“), მაგრამ რატომ დაიწყო სამყაროს შექმნით? რათა ეუწყებინა თავისი ხალხისთვის თავის საქმეთა ძალა, რომ მთელი დედამიწა გამჩენს ეკუთვნის.',
            explanationKa: 'פירש״י • ბერეშით 1:1.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-2`,
            source: 'rashi',
            dibburHamatchil: 'ברא אלהים.',
            hebrew:
              'ברא אלהים. וְלֹא אָמַר בָּרָא ה׳, שֶׁבַּתְּחִלָּה עָלָה בְּמַחֲשָׁבָה לִבְרֹאתוֹ בְּמִדַּת הַדִּין, רָאָה שֶׁאֵין הָעוֹלָם מִתְקַיֵּם, הִקְדִּים מִדַּת רַחֲמִים וְשִׁתְּפָהּ לְמִדַּת הַדִּין (תענית דף ב.):',
            translationKa:
              'რაში (1): „შექმნა ელოჰიმმა“ — თავდაპირველად განზრახული იყო სამყაროს შექმნა მკაცრი სამართლის საზომით (მიდათ ჰადინი), მაგრამ იხილა, რომ სამყარო ვერ გაძლებდა, ამიტომ წინ წამოსწია წყალობის საზომი (მიდათ ჰარახამიმი) და შეუერთა იგი სამართალს.',
            explanationKa: 'פירש״י • ბერეშით 1:1.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-3`,
            source: 'rashi',
            dibburHamatchil: 'והארץ היתה תהו ובהו.',
            hebrew:
              'והארץ היתה תהו ובהו. תֹהוּ לְשׁוֹן תֵּמַהּ וְשִׁמָּמוֹן, שֶׁאָדָם תּוֹהֶה וּמִשְׁתּוֹמֵם עַל בֹּהוּ שֶׁבָּהּ. ורוח אלהים מרחפת. כִּסֵּא הַכָּבוֹד עוֹמֵד בָּאֲוִיר וּמְרַחֵף עַל פְּנֵי הַמַּיִם בְּרוּחַ פִּיו שֶׁל הַקָּדוֹשׁ בָּרוּךְ הוּא (חגיגה דף י״ב.):',
            translationKa:
              'რაში (2): „თოჰუ და ბოჰუ“ — განცვიფრება და სიცარიელე. „და ღვთის სული იძვროდა“ — დიდების ტახტი იდგა ჰაერში და იძვროდა წყალთა პირზე წმინდა გამჩენის ბაგეთა სუნთქვით (ხაგიგა 12a).',
            explanationKa: 'פירש״י • ბერეშით 1:2.',
          },
          {
            id: `torah-rashi-${book.id}-${chapterNum}-4`,
            source: 'rashi',
            dibburHamatchil: 'וירא אלהים את האור כי טוב.',
            hebrew:
              'וירא אלהים את האור כי טוב. אַף בָּזֶה אָנוּ צְרִיכִין לְדִבְרֵי אַגָּדָה: רָאָהוּ שֶׁאֵינוֹ כְּדַאי לְהִשְׁתַּמֵּשׁ בּוֹ רְשָׁעִים, וְהִבְדִּילוֹ לַצַּדִּיקִים לֶעָתִיד לָבוֹא (חגיגה דף י״ב.):',
            translationKa:
              'რაში (4): იხილა ღმერთმა ნათელი, რომ კარგი იყო — მიხვდა, რომ ბოროტეულნი არ იყვნენ ღირსნი ამ ზეციური ნათლით სარგებლობისა, ამიტომ გადაინახა იგი მართალთათვის (ცადიკებისთვის) მომავალ სამყაროში (ხაგიგა 12a).',
            explanationKa: 'פירש״י • ბერეშით 1:4.',
          },
        ];

    const leftRambanIbnEzra: TalmudSentence[] = [
      {
        id: `torah-ibnezra-${book.id}-${chapterNum}-1`,
        source: 'tosafot',
        dibburHamatchil: isExodus ? 'אבן עזרא • ואלה שמות.' : 'אבן עזרא • בראשית ברא.',
        hebrew: isExodus
          ? 'ואלה שמות. הַוָּ״ו מוֹסִיף עַל עִנְיָן רִאשׁוֹן שֶׁבְּסוֹף סֵפֶר בְּרֵאשִׁית, וְהִזְכִּיר שְׁמוֹת בְּנֵי יַעֲקֹב שֶׁהֵם שָׁרְשֵׁי שִׁבְטֵי יִשְׂרָאֵל (ברכות דף ב.):'
          : 'בראשית ברא. מִלַּת ״בְּרֵאשִׁית״ סְמוּכָה, וְהַטַּעַם עַל גְּזֵירַת הָאוֹר וְהַבְדָּלַת הַיּוֹם וְהַלַּיְלָה עַל פִּי דִּקְדּוּק לְשׁוֹן הַקֹּדֶשׁ:',
        translationKa: isExodus
          ? 'იბნ ეზრა: ასო „ვავ“ („და ეს არის სახელები“) აკავშირებს შემოთის წიგნს ბერეშითის დასასრულთან და ჩამოთვლის ისრაელის ტომთა ძირებს.'
          : 'იბნ ეზრა: წმინდა ენის გრამატიკული (დიკდუკის) სიზუსტით ხსნის სიტყვა „ბერეშითის“ კავშირს ნათლის გაჩენასთან.',
        explanationKa: 'რაბი აბრაამ იბნ ეზრას ლინგვისტური და რაციონალური პეშატ-კომენტარი.',
      },
    ];

    const bottomLeftOrHaChaim: TalmudSentence[] = [
      {
        id: `torah-ramban-${book.id}-${chapterNum}-1`,
        source: 'chavruta',
        dibburHamatchil: isExodus ? 'רמב״ן • ספר הגאולה.' : 'רמב״ן • בראשית ברא.',
        hebrew: isExodus
          ? 'רמב״ן • ספר הגאולה. הִשְׁלִים הַכָּתוּב סֵפֶר בְּרֵאשִׁית שֶׁהוּא סֵפֶר הַיְּצִירָה, וּבָא לְסֵפֶר שְׁמוֹת בְּעִנְיַן הַגָּלוּת וְהַגְּאֻלָּה עַד שֶׁשָּׁכְנָה שְׁכִינָה בַּמִּשְׁכָּן (שבת דף כ״א:):'
          : 'רמב״ן • בראשית ברא. הַקָּדוֹשׁ בָּרוּךְ הוּא בָּרָא כָּל הַנִּבְרָאִים מֵאַיִן מוחְלָט, וְאֵין אֶצְלֵנוּ בִּלְשׁוֹן הַקֹּדֶשׁ הוֹצָאַת יֵשׁ מֵאַיִן אֶלָּא בִּלְשׁוֹן ״בְּרִיאָה״:',
        translationKa: isExodus
          ? 'რამბანი (ნახმანიდესი): შემოთი არის ხსნის წიგნი (სეფერ ჰაგეულა), რომელიც სრულდება შכינის (ღვთაებრივი დიდების) დამკვიდრებით მიშკანში.'
          : 'რამბანი (ნახმანიდესი): წმინდამ, კურთხეულ იყოს იგი, შექმნა ყოველი ქმნილება აბსოლუტური არარაობიდან (იეშ მეაინ).',
        explanationKa: 'რამბანის ფილოსოფიურ-კაბალისტური ანალიზი მიკრაოთ გედოლოთის დაფზე.',
      },
    ];

    const bottomRightSforno: TalmudSentence[] = [
      {
        id: `torah-baalhaturim-${book.id}-${chapterNum}-1`,
        source: 'chavruta',
        dibburHamatchil: isExodus ? 'ואלה שמות.' : 'בראשית ברא.',
        hebrew: isExodus
          ? 'ואלה שמות. רָאשֵׁי תֵּיבוֹת ״וְאֵלֶּה שְׁמוֹת בְּנֵי יִשְׂרָאֵל הַבָּאִים מִצְרָיְמָה״ עוֹלֶה בְּגִימַטְרִיָּא שִׁבְעִים נֶפֶשׁ, וּבְסוֹפֵי תֵּיבוֹת רֶמֶז לִגְאֻלַּת מִצְרַיִם (פסחים דף ב. ברכות דף ב.):'
          : 'בראשית ברא. בְּגִימַטְרִיָּא ״בְּרֹאשׁ הַשָּׁנָה נִבְרָא הָעוֹלָם״, וְרֶמֶז לַעֲשֶׂרֶת הַדִּבְּרוֹת וְלַתּוֹרָה הַקְּדוֹשָׁה (ראש השנה דף י.):',
        translationKa: isExodus
          ? 'ბაალ ჰატურიმი: „ვეელე შემოთ ბნეი ისრაელ“ — საწყისი ასოებისა და გემატრიის საიდუმლო მიუთითებს სამოცდაათ სულსა და ეგვიპტიდან ხსნაზე.'
          : 'ბაალ ჰატურიმი: „ბერეშით ბარა“ გემატრიით უდრის „როშ ჰაშანას შეიქმნა სამყარო“ (როშ ჰაშანა 10b).',
        explanationKa: 'რაბი იაკოვ ბენ აშერის (ბაალ ჰატურიმი) გემატრიული და მასორული კომენტარი.',
      },
    ];

    return {
      realmId,
      bookId: book.id,
      bookNameKa: book.nameKa,
      bookNameHe: book.nameHe,
      chapterNum,
      chapterHe: chHe,
      centerTopSentences: centerTop.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      centerMainSentences: centerMain.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      rightColSentences: rightRashi.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      leftColSentences: leftRambanIbnEzra.map((s) => ({
        ...s,
        hebrewText: s.hebrewText || s.hebrew,
      })),
      bottomLeftSentences: bottomLeftOrHaChaim.map((s) => ({
        ...s,
        hebrewText: s.hebrewText || s.hebrew,
      })),
      bottomRightSentences: bottomRightSforno.map((s) => ({
        ...s,
        hebrewText: s.hebrewText || s.hebrew,
      })),
    };
  }

  // Dedicated Classic Mishnayot Daf Builder with Bartenura, Kehati, Rambam, Tosafot Yom Tov, Tiferet Yisrael & Meiri
  if (realmId === 'mishnayot') {
    const isBerakhot1 = book.id === 'Mishnah_Berakhot' && chapterNum === 1;
    const isTaanit1 = book.id === 'Mishnah_Taanit' && chapterNum === 1;
    const isAvot1 = book.id === 'Pirkei_Avot' && chapterNum === 1;
    const isShabbat1 = book.id === 'Mishnah_Shabbat' && chapterNum === 1;

    const centerMain: TalmudSentence[] = [
      {
        id: `mishnayot-${book.id}-${chapterNum}-m1`,
        source: 'mishnah',
        dibburHamatchil: `משנה א׳ (פרק ${chHe})`,
        hebrew: isBerakhot1
          ? 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִים לֶאֱכוֹל בִּתְרוּמָתָן, עַד סוֹף הָאַשְׁמוּרָה הָרִאשׁוֹנָה, דִּבְרֵי רַבִּי אֱלִיעֶזֶר. וַחֲכָמִים אוֹמְרִים: עַד חֲצוֹת. רַבָּן גַּמְלִיאֵל אוֹמֵר: עַד שֶׁיַּעֲלֶה עַמּוּד הַשַּׁחַר.'
          : isTaanit1
            ? 'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג. רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג. אָמַר לוֹ רַבִּי יְהוֹשֻׁעַ: הוֹאִיל וְאֵין הַגְּשָׁמִים אֶלָּא סִימַן קְלָלָה בַּחַג, לָמָּה הוּא מַזְכִּיר?'
            : isAvot1
              ? 'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה. הֵם אָמְרוּ שְׁלֹשָׁה דְבָרִים: הֱווּ מְתוּנִים בַּדִּין, וְהַעֲמִידוּ תַלְמִידִים הַרְבֵּה, וַעֲשׂוּ סְיָג לַתּוֹרָה.'
              : isShabbat1
                ? 'יְצִיאוֹת הַשַּׁבָּת שְׁתַּיִם שֶׁהֵן אַרְבַּע בִּפְנִים, וּשְׁתַּיִם שֶׁהֵן אַרְבַּע בַּחוּץ. כֵּיצַד? הֶעָנִי עוֹמֵד בַּחוּץ וּבַעַל הַבַּיִת בִּפְנִים: פָּשַׁט הֶעָנִי אֶת יָדוֹ לִפְנִים וְנָתַן לְתוֹךְ יָדוֹ שֶׁל בַּעַל הַבַּיִת — הֶעָנִי חַיָּב וּבַעַל הַבַּיִת פָּטוּר.'
                : `מִשְׁנָה א׳ בְּ${book.nameHe} פֶּרֶק ${chHe}: כָּל הָעוֹסֵק בְּהִלְכוֹת מַסֶּכֶת זוֹ לִשְׁמָהּ זּוֹכֶה לְכֶתֶר תּוֹרָה, וַחֲכָמִים קָבְעוּ גִּדְרֵי הַהֲלָכָה בְּפֶרֶק ${chHe} עַל פִּי הַמְּסוֹרָה מִסִּינַי.`,
        translationKa: isBerakhot1
          ? 'მიშნა 1: როდიდან კითხულობენ „შმას“ საღამოს? იმ დროიდან, როდესაც ქოჰენები შედიან თავიანთი თრუმის საჭმელად (ვარსკვლავების გამოსვლიდან), პირველი გუშაგობის ბოლომდე — ეს არის რაბი ელიეზერის სიტყვები. ხოლო ბრძენნი ამბობენ: შუაღამემდე. რაბან გამლიელი ამბობს: განთიადის სვეტის ამოსვლამდე.'
          : isTaanit1
            ? 'მიშნა 1: როდიდან იხსენიებენ წვიმის ძლიერებას („მაშივ ჰარუახ უმორიდ ჰაგეშემ“)? რაბი ელიეზერი ამბობს: სუკოთის პირველი სადღესასწაულო დღიდან. რაბი იეჰოშუა ამბობს: დღესასწაულის უკანასკნელი დღიდან (შმინი აცერეთიდან).'
            : isAvot1
              ? 'მიშნა 1: მოშემ მიიღო თორა სინაიდან და გადასცა იეჰოშუას, იეჰოშუამ — უხუცესებს, უხუცესებმა — წინასწარმეტყველებს, ხოლო წინასწარმეტყველებმა გადასცეს დიდი კრებულის კაცებს (ანშეი ქნესეთ ჰაგდოლა). მათ თქვეს სამი რამ: იყავით დინჯნი სამართალში, აღზარდეთ მრავალი მოწაფე და გაუკეთეთ ზღუდე (სიაგი) თორას.'
              : isShabbat1
                ? 'მიშნა 1: შაბათზე საგნის გატანა (ჰოცაა) არის ორი, რომელიც ოთხია შიგნით, და ორი, რომელიც ოთხია გარეთ. როგორ? ღარიბი დგას გარეთ (საჯარო სივრცეში) და სახლის პატრონი შიგნით (კერძო სივრცეში)...'
                : `${book.nameKa}, თავი ${chapterNum}, მიშნა 1: აყალიბებს ამ ტრაქტატის ფუნდამენტურ ჰალახურ პრინციპებსა და ტანაიმების (תנאים) მსჯელობას.`,
        explanationKa: 'შისა სიდრეი მიშნის ძირითადი ტექსტი (גוף המשנה). დააწკაპუნეთ ნებისმიერ სიტყვაზე: პირველ დაჭერაზე მოინიშნება სიტყვა და მასთან დაკავშირებული ბარტენურა/კეჰათი, მეორე დაჭერაზე კი გაიხსნება Note ფანჯარა.',
      },
      {
        id: `mishnayot-${book.id}-${chapterNum}-m2`,
        source: 'mishnah',
        dibburHamatchil: `משנה ב׳ (פרק ${chHe})`,
        hebrew: isBerakhot1
          ? 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּשַׁחֲרִית? מִשֶּׁיַּכִּיר בֵּין תְּכֵלֶת לְלָבָן. רַבִּי אֱלִיעֶזֶר אוֹמֵר: בֵּין תְּכֵלֶת לְכַרְתִּי. וְגוֹמְרָהּ עַד הָנֵץ הַחַמָּה. רַבִּי יְהוֹשֻׁעַ אוֹמֵר: עַד שָׁלֹשׁ שָׁעוֹת, שֶׁכֵּן דֶּרֶךְ בְּנֵי מְלָכִים לַעֲמוֹד בְּשָׁלֹשׁ שָׁעוֹת.'
          : isAvot1
            ? 'שִׁמְעוֹן הַצַּדִּיק הָיָה מִשְּׁיָרֵי כְנֶסֶת הַגְּדוֹלָה. הוּא הָיָה אוֹמֵר: עַל שְׁלֹשָׁה דְבָרִים הָעוֹלָם עוֹמֵד: עַל הַתּוֹרָה, וְעַל הָעֲבוֹדָה, וְעַל גְּמִילוּת חֲסָדִים.'
            : `מִשְׁנָה ב׳ בְּ${book.nameHe} פֶּרֶק ${chHe}: בֵּיאוּר פרטי הַדִּינִים וְהַחִלּוּקִים בֵּין דִּבְרֵי תַּנָּא קַמָּא לְדִבְרֵי חֲכָמִים, וְהַהֲלָכָה כְּדִבְרֵי חֲכָמִים.`,
        translationKa: isBerakhot1
          ? 'მიშნა 2: როდიდან კითხულობენ „შმას“ დილით (შახრითში)? მას შემდეგ, რაც ადამიანი გაარჩევს ცისფერს (თხელეთს) თეთრისგან. რაბი ელიეზერი ამბობს: ცისფერს პრასისფერისგან (მწვანისგან). რაბი იეჰოშუა ამბობს: დღის მესამე საათამდე.'
          : isAvot1
            ? 'მიშნა 2: შიმონ ჰაცადიკი იყო დიდი კრებულის უკანასკნელ წევრთაგანი. იგი ამბობდა: სამ რამეზე დგას სამყარო — თორაზე, ღვთისმსახურებაზე (ავოდა / ლოცვა) და სიკეთის ქმნაზე (გმილუთ ხასადიმ).'
            : `${book.nameKa}, თავი ${chapterNum}, მიშნა 2: განიხილავს თანა კამასა და ბრძენთა (חכמים) შორის არსებულ ჰალახურ ნიუანსებს.`,
        explanationKa: 'მეორე მიშნა სრული ორმხრივი კავშირით ბარტენურასთან, კეჰათისთან და თოსაფოთ იომ ტოვთან.',
      },
    ];

    const rightBartenura: TalmudSentence[] = [
      {
        id: `mishnayot-bartenura-${book.id}-${chapterNum}-1`,
        source: 'rashi',
        dibburHamatchil: isBerakhot1
          ? 'רע״ב (ברטנורא) • ד״ה מאימתי קורין את שמע'
          : isAvot1
            ? 'רע״ב (ברטנורא) • ד״ה משה קיבל תורה מסיני'
            : `רע״ב (ברטנורא) • ${book.nameHe} פרק ${chHe} מ״א`,
        hebrew: isBerakhot1
          ? 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִית — תַּנָּא אִקְרָאֵי קָאֵי דִּכְתִיב ״בְּשָׁכְבְּךָ וּבְקוּמֶךָ״, וּקְדִים תָּנֵי זְמַן שְׁכִיבָה דְּהַיְנוּ עַרְבִית מִשּׁוּם דִּבְבְרִיאַת הָעוֹלָם כְּתִיב ״וַיְהִי עֶרֶב וַיְהִי בֹקֶר״. מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִים — כֹּהֲנִים שֶׁנִּטְמְאוּ וְטָבְלוּ וְהֶעֱרִיב שִׁמְשָׁן וְהִגִּיעַ זְמַן צֵאת הַכּוֹכָבִים.'
          : isAvot1
            ? 'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי — לְפִי שֶׁמַּסֶּכֶת זוֹ אֵינָהּ מְיֻסֶּדֶת עַל פֵּרוּשׁ מִצְוָה מִמִּצְוֹת הַתּוֹרָה כִּשְׁאָר מַסֶּכְתּוֹת שֶׁבַּמִּשְׁנָה, אֶלָּא כֻּלָּהּ מוּסָרִים וּמִדּוֹת טוֹבוֹת, לְכָךְ הִתְחִיל הַתַּנָּא ״מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי״ לוֹמַר לְךָ שֶׁהַמִּדּוֹת וְהַמּוּסָרִים שֶׁבְּמַסֶּכֶת זוֹ גַּם הֵם נִתְּנוּ מִסִּינַי.'
            : `רַבֵּנוּ עוֹבַדְיָה מִבַּרְטְנוּרָא (רע״ב): מְבָאֵר מִלּוֹת הַמִּשְׁנָה עַל פִּי סוּגְיַת הַגְּמָרָא וּפֵירוּשׁ רַשִׁ״י וְהָרַמְבַּ״ם, וּפוֹסֵק הֲלָכָה כְּדִבְרֵי חֲכָמִים בְּפֶרֶק ${chHe}.`,
        translationKa: isBerakhot1
          ? 'ბარტენურა (רע״ב): „როდიდან კითხულობენ შმას საღამოს“ — თანა ეყრდნობა თორის მუხლს „დაწოლისას და ადგომისას“ და იწყებს საღამოთი, რადგან სამყაროს შექმნისას წერია „და იყო საღამო და იყო დილა“. „ქოჰენები შედიან თრუმის საჭმელად“ — იგულისხმება ვარსკვლავების გამოსვლის (צאת הכוכבים) დრო.'
          : isAvot1
            ? 'ბარტენურა (רע״ב): „მოშემ მიიღო თორა სინაიდან“ — ვინაიდან ეს ტრაქტატი ეძღვნება ზნეობას, ეთიკასა და კეთილ თვისებებს (מידות ומוסר), თანამ დაიწყო ამ სიტყვებით, რათა გვასწავლოს, რომ ეთიკური ნორმებიც უშუალოდ სინაის მთაზეა მოცემული.'
            : `რაბენუ ოვადია ბარტენურა (רע״ב): ხსნის მიშნის თითოეულ ტერმინს გემარაზე, რაშისა და რამბამზე დაყრდნობით და ადგენს საბოლოო ჰალახას.`,
        explanationKa: 'რაბენუ ოვადია ბარტენურა (רע״ב) — მიშნის უპირველესი კლასიკური კომენტატორი.',
      },
      {
        id: `mishnayot-bartenura-${book.id}-${chapterNum}-2`,
        source: 'rashi',
        dibburHamatchil: 'רע״ב • ד״ה עד חצות / משיכיר',
        hebrew:
          'וַחֲכָמִים אוֹמְרִים עַד חֲצוֹת — מִן הַתּוֹרָה זְמַנָּהּ כָּל הַלַּיְלָה, אֶלָּא שֶׁחֲכָמִים עָשׂוּ סְיָג לַתּוֹרָה כְּדֵי לְהַרְחִיק אֶת הָאָדָם מִן הָעֲבֵירָה שֶׁלֹּא יֹאמַר יֵשׁ לִי עוֹד שָׁהוּת וְיִישַׁן כָּל הַלַּיְלָה.',
        translationKa:
          'ბარტენურა (רע״ב): „ხოლო ბრძენნი ამბობენ: შუაღამემდე“ — თორის კანონით შმას კითხვის დრო მთელი ღამეა განთიადამდე, მაგრამ ბრძენებმა გაუკეთეს ზღუდე (სიაგი), რათა ადამიანმა არ გადადოს კითხვა და არ ჩაეძინოს.',
        explanationKa: 'ბარტენურას განმარტება ჰალახური ზღუდის (סייג לתורה) შესახებ.',
      },
    ];

    const leftKehati: TalmudSentence[] = [
      {
        id: `mishnayot-kehati-${book.id}-${chapterNum}-1`,
        source: 'tosafot',
        dibburHamatchil: isBerakhot1
          ? 'פירוש קהתי • הקדמה וביאור משנה א׳'
          : `פירוש פנחס קהתי • ${book.nameHe} פרק ${chHe}`,
        hebrew: isBerakhot1
          ? 'פֵּירוּשׁ קְהָתִי: מִצְוַת עֲשֵׂה מִן הַתּוֹרָה לִקְרוֹא קְרִיאַת שְׁמַע פַּעֲמַיִם בְּכָל יוֹם — בָּעֶרֶב וּבַבֹּקֶר, שֶׁנֶּאֱמַר: ״וְדִבַּרְתָּ בָּם... בְּשָׁכְבְּךָ וּבְקוּמֶךָ״. מִשְׁנָתֵנוּ דָּנָה בִּזְמַן קְרִיאַת שְׁמַע שֶׁל עַרְבִית: הַתְחָלַת זְמַנָּהּ הִיא מִצֵּאת הַכּוֹכָבִים, שֶׁהִיא הַשָּׁעָה שֶׁכֹּהֲנִים שֶׁטָּבְלוּ מִטֻּמְאָתָם רַשָּׁאִים לֶאֱכוֹל תְּרוּמָה.'
          : isAvot1
            ? 'פֵּירוּשׁ קְהָתִי: מַסֶּכֶת אָבוֹת מְיֻחֶדֶת בְּכָךְ שֶׁהִיא מְבִיאָה אֶת שַׁלְשֶׁלֶת הַקַּבָּלָה שֶׁל תּוֹרָה שֶׁבְּעַל פֶּה מִמֹּשֶׁה רַבֵּנוּ וְעַד חַכְמֵי הַמִּשְׁנָה, וּמְלַמֶּדֶת הַנְהָגוֹת יְשָׁרוֹת וּמִדּוֹת טוֹבוֹת שֶׁהֵן יְסוֹד קִיּוּם הַתּוֹרָה.'
            : `פֵּירוּשׁ פִּנְחָס קְהָתִי (משניות מבוארות): מַקְדִּים אֶת רֶקַע הַסּוּגְיָה וְהַמּוּשָׂגִים הַהֲלָכְתִיִּים בְּפֶרֶק ${chHe}, מְפָרֵשׁ מִלָּה בְּמִלָּה בְּשָׂפָה בְּרוּרָה וּמְסַכֵּם אֶת פְּסַק הַהֲלָכָה.`,
        translationKa: isBerakhot1
          ? 'ფინხას კეჰათის განმარტება (קהתי): თორის ქმედებითი მცნებაა (מצוות עשה) „კრიათ შმას“ წაკითხვა დღეში ორჯერ — საღამოს და დილით, როგორც ნათქვამია: „და ილაპარაკე მათზე... დაწოლისას და ადგომისას“. ჩვენი მიშნა ადგენს საღამოს შმას დროის დასაწყისს (ვარსკვლავების გამოსვლა) და მის დასასრულს სამი ტანას (რაბი ელიეზერი, ბრძენნი, რაბან გამლიელი) მიხედვით.'
          : isAvot1
            ? 'ფინხას კეჰათის განმარტება (קהתי): ტრაქტატი ავოთი წარმოადგენს ზეპირი თორის გადაცემის უწყვეტ ჯაჭვს (שלשלת הקבלה) მოშე რაბენუდან მიშნის ბრძენებამდე და გვასწავლის სულიერ სრულყოფილებას.'
            : `ფინხას კეჰათის განმარტება (משניות קהתי): წარმოადგენს თავის სისტემურ შესავალს, ტერმინთა ახსნას და თითოეული მიშნის მკაფიო ანალიზს.`,
        explanationKa: 'ფინხას კეჰათი (פירוש קהתי) — ყველაზე პოპულარული სისტემური და მკაფიო კომენტარი მიშნაზე.',
      },
      {
        id: `mishnayot-kehati-${book.id}-${chapterNum}-2`,
        source: 'tosafot',
        dibburHamatchil: 'קהתי • סיכום ההלכה במשנה',
        hebrew:
          'הֲלָכָה (קהתי): הֲלָכָה כְּחֲכָמִים וּכְרַבָּן גַּמְלִיאֵל — לְכַתְּחִלָּה יֵשׁ לִקְרוֹא קְרִיאַת שְׁמַע שֶׁל עַרְבִית קֹדֶם חֲצוֹת הַלַּיְלָה, וּבְדִיעֲבַד אִם עָבַר וְלֹא קָרָא — קוֹרֵא וְיוֹצֵא יְדֵי חוֹבָתוֹ עַד שֶׁיַּעֲלֶה עַמּוּד הַשַּׁחַר.',
        translationKa:
          'კეჰათი (ჰალახური დასკვნა): ჰალახა დგინდება ბრძენთა და რაბან გამლიელის მიხედვით — თავდაპირველად (ლეხათხილა) ადამიანმა საღამოს შმა უნდა წაიკითხოს შუაღამემდე, ხოლო თუ ვერ მოასწრო (ბედიავად), კითხულობს კურთხევებით განთიადის ამოსვლამდე.',
        explanationKa: 'კეჰათის პრაქტიკული ჰალახური შეჯამება.',
      },
    ];

    const centerTopRambam: TalmudSentence[] = [
      {
        id: `mishnayot-rambam-${book.id}-${chapterNum}-1`,
        source: 'mishnah',
        dibburHamatchil: 'פירוש המשנה להרמב״ם ופסק ההלכה',
        hebrew:
          'פֵּירוּשׁ הַמִּשְׁנָה לְהָרַמְבַּ״ם: דַּע שֶׁתְּחִלַּת זְמַן קְרִיאַת שְׁמַע שֶׁל לַיְלָה הוּא מִצֵּאת הַכּוֹכָבִים, וְהַהֲלָכָה כַּחֲכָמִים שֶׁאָמְרוּ עַד חֲצוֹת לְהַרְחִיק מִן הַפְּשִׁיעָה, וְאִם אֵחַר — קוֹרֵא עַד עֲלוֹת הַשַּׁחַר.',
        translationKa:
          'რამბამი (פירוש המשנה להרמב״ם): იცოდე, რომ ღამის შმას კითხვის დრო იწყება ვარსკვლავების გამოსვლიდან; ჰალახა არის ბრძენთა მიხედვით, რათა ადამიანი განერიდოს დაუდევრობას.',
        explanationKa: 'მაიმონიდესის (რამბამის) ორიგინალური კომენტარი მიშნაზე.',
      },
    ];

    const bottomRightTyt: TalmudSentence[] = [
      {
        id: `mishnayot-tyt-${book.id}-${chapterNum}-1`,
        source: 'chavruta',
        dibburHamatchil: 'תוספות יום טוב (תוי״ט) ועיקר תוי״ט',
        hebrew:
          'תּוֹסְפוֹת יוֹם טוֹב: דִּבְרֵי הָרַעַ״ב מְבֹאָרִים עַל פִּי הַגְּמָרָא בְּדַף ב׳ ע״א, וּבֵיאֵר לָמָּה לֹא תָּנָא הַמִּשְׁנָה בְּפֵרוּשׁ ״מִצֵּאת הַכּוֹכָבִים״ — כְּדֵי לְלַמְּדֵנוּ אַגַּב אוֹרְחָא דִּין הָעֶרֶב שֶׁמֶשׁ בִּתְרוּמָה דְּלָא בָּעֵינַן כַּפָּרָה.',
        translationKa:
          'თოსაფოთ იომ ტოვი (תוי״ט): ხსნის, თუ რატომ არ თქვა მიშნამ პირდაპირ „ვარსკვლავების გამოსვლიდან“ და რატომ ახსენა ქოჰენების მიერ თრუმის ჭამა — რათა პარალელურად გვასწავლოს ჰალახა, რომ განწმენდილ ქოჰენს თრუმის საჭმელად მზის ჩასვლა ჰყოფნის და მეორე დღის მსხვერპლს არ ელოდება.',
        explanationKa: 'რაბი იომ ტოვ ლიფმან ჰელერის (תוספות יום טוב) ანალიტიკური კომენტარი.',
      },
    ];

    const bottomLeftTiferetMeiri: TalmudSentence[] = [
      {
        id: `mishnayot-tiferet-${book.id}-${chapterNum}-1`,
        source: 'chavruta',
        dibburHamatchil: 'תפארת ישראל (יכין ובועז) • מאירי • שנות אליהו להגר״א',
        hebrew:
          'תִּפְאֶרֶת יִשְׂרָאֵל (יָכִין) וְהַמְּאִירִי: בְּקַבָּלַת עֹל מַלְכוּת שָׁמַיִם בְּעַרְבִית וּבְשַׁחֲרִית מְחַבֵּר הָאָדָם אֶת הַיּוֹם וְהַלַּיְלָה בְּיִחוּד ה׳, וּבִשְׁנוֹת אֵלִיָּהוּ לְהַגְּרָ״א מְבָאֵר דִּקְדּוּק לְשׁוֹן הַמִּשְׁנָה מִן הַפְּסוּקִים.',
        translationKa:
          'თიფერეთ ისრაელი (იახინ და ბოაზ), რაბენუ ჰამეირი და ვილნის გაონი (შენოთ ელიაჰუ): საღამოსა და დილის შმას კითხვით ადამიანი აერთიანებს დღესა და ღამეს გამჩენის მეუფების ქვეშ.',
        explanationKa: 'თიფერეთ ისრაელის, მეირის, მელეხეთ შლომოსა და ვილნის გაონის (הגר״א) კომენტარების სინთეზი.',
      },
    ];

    return {
      realmId,
      bookId: book.id,
      bookNameKa: book.nameKa,
      bookNameHe: book.nameHe,
      chapterNum,
      chapterHe: chHe,
      centerTopSentences: centerTopRambam.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      centerMainSentences: centerMain.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      rightColSentences: rightBartenura.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      leftColSentences: leftKehati.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      bottomLeftSentences: bottomLeftTiferetMeiri.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
      bottomRightSentences: bottomRightTyt.map((s) => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    };
  }

  // Generic rich classic Daf builder for Nevi'im, Ketuvim, Rambam, Tur, Shulchan Aruch, Mishnah Berurah, Sephardic Halakha
  const centerMain: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-main-1`,
      source: 'gemara',
      dibburHamatchil: `סעיף / פסוק א׳ (${chHe})`,
      hebrew:
        realmId === 'rambam'
          ? `יְסוֹד הַיְסוֹדוֹת וְעַמּוּד הַחָכְמוֹת לֵידַע שֶׁיֵּשׁ שָׁם מָצוּי רִאשׁוֹן, וְהוּא מַמְצִיא כָּל נִמְצָא, וְכָל הַנִּמְצָאִים מִשָּׁמַיִם וָאָרֶץ וּמַה שֶּׁבֵּינֵיהֶם לֹא נִמְצְאוּ אֶלָּא מֵאֲמִתַּת הִמָּצְאוֹ (${book.nameHe} פרק ${chHe}).`
          : realmId === 'tur'
            ? `יְהוּדָה בֶּן תֵּימָא אוֹמֵר: הֱוֵי עַז כַּנָּמֵר, וְקַל כַּנֶּשֶׁר, וְרָץ כַּצְּבִי, וְגִבּוֹר כָּאֲרִי לַעֲשׂוֹת רְצוֹן אָבִיךָ שֶׁבַּשָּׁמַיִם (${book.nameHe} סימן ${chHe}).`
            : realmId === 'shulchan-aruch' || realmId === 'mishnah-berurah' || realmId === 'sephardic-halakha'
              ? `יִתְגַּבֵּר כַּאֲרִי לַעֲמֹד בַּבֹּקֶר לַעֲבוֹדַת בּוֹרְאוֹ, שֶׁיְּהֵא הוּא מְעוֹרֵר הַשַּׁחַר. הגה (רמ״א): וְעַל כָּל פָּנִים לֹא יְאַחֵר זְמַן הַתְּפִלָּה שֶׁהַצִּבּוּר מִתְפַּלְּלִין (${book.nameHe} סימן ${chHe}).`
              : `הַלְלוּיָהּ אֹדֶה יְהוָה בְּכָל־לֵבָב בְּסוֹד יְשָׁרִים וְעֵדָה׃ גְּדֹלִים מַעֲשֵׂי יְהוָה דְּרוּשִׁים לְכָל־חֶפְצֵיהֶם (${book.nameHe} פרק ${chHe}).`,
      translationKa:
        realmId === 'rambam'
          ? `რამბამი (${book.nameKa}, თავი ${chapterNum}): საფუძველთა საფუძველი და სიბრძნეთა სვეტია ვიცოდეთ, რომ არსებობს პირველადი არსი, რომელიც წარმოშობს ყოველ არსებულს ცაში და მიწაზე.`
          : realmId === 'tur'
            ? `არბაა ტურიმი (${book.nameKa}, სიმანი ${chapterNum}): იეჰუდა ბენ თეიმა ამბობს — იყავი მტკიცე როგორც ვეფხვი, მსუბუქი როგორც არწივი, სწრაფი როგორც ქურციკი და ძლიერი როგორც ლომი შენი ზეციერი მამის ნების აღსასრულებლად.`
            : realmId === 'shulchan-aruch' || realmId === 'mishnah-berurah' || realmId === 'sephardic-halakha'
              ? `შულხან ყარუხი (${book.nameKa}, სიმანი ${chapterNum}): გამხნევდეს ლომივით, რათა დილით ადრე ადგეს თავისი გამჩენის სამსახურისთვის ისე, რომ თავად აღვიძებდეს განთიადს. რამა (הגה): და ყოველ შემთხვევაში არ გადააცილოს საზოგადოებრივი ლოცვის დროს.`
              : `${book.nameKa}, თავი ${chapterNum} (${chHe}): დიდებულია უფლის საქმენი, გამოკვლეული ყველა მისი მოყვარულის მიერ; სიბრძნის დასაწყისია უფლის მოშიშება.`,
      explanationKa: `${colCfg.centerMainHeaderKa} — ძირითადი ტექსტი. გადაატარეთ მაუსი ნებისმიერ წინადადებას და ყველა დაკავშირებული კომენტატორი დაფის გარშემო მყისიერად განათდება.`,
    },
    {
      id: `${realmId}-${book.id}-${chapterNum}-main-2`,
      source: 'gemara',
      dibburHamatchil: `סעיף / פסוק ב׳ (${chHe})`,
      hebrew:
        realmId === 'rambam'
          ? `וִידִיעַת דָּבָר זֶה מִצְוַת עֲשֵׂה, שֶׁנֶּאֱמַר: ״אָנֹכִי ה׳ אֱלֹהֶיךָ״, וְכָל הַמַּעֲלֶה עַל דַּעְתּוֹ שֶׁיֵּשׁ שָׁם אֵל אַחֵר זוּלָתוֹ עוֹבֵר בְּלֹא תַעֲשֶׂה.`
          : `שִׁוִּיתִי ה׳ לְנֶגְדִּי תָמִיד כִּי מִימִינִי בַּל אֶמּוֹט — זֶה כְּלָל גָּדוֹל בַּתּוֹרָה וּבְמַעֲלוֹת הַצַּדִּיקִים הַהוֹלְכִים לִפְנֵי הָאֱלֹהִים.`,
      translationKa:
        realmId === 'rambam'
          ? 'და ამ ჭეშმარიტების ცოდნა არის ქმედებითი მცნება (მიცვათ ასე), როგორც ნათქვამია: „მე ვარ უფალი, შენი ღმერთი“.'
          : '„წარმოვიდგენ უფალს ჩემს წინაშე მუდამ“ — ეს არის უდიდესი კანონი თორაში და მართალთა (ცადიკთა) სულიერ საფეხურებზე.',
      explanationKa: 'მეორე მუხლი / სეიფი სრული ორმხრივი კავშირით გარშემო მდებარე ნოსე ქელიმთან და მეფორშიმთან.',
    },
  ];

  const centerTop: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-top-1`,
      source: 'mishnah',
      dibburHamatchil: colCfg.centerTopHeaderHe,
      hebrew:
        realmId === 'rambam'
          ? `הַשָּׂגוֹת הָרַאֲבַ״ד: אָמַר אַבְרָהָם — הַדְּבָרִים הָאֵלּוּ נְכוֹנִים בְּעִקְּרֵי הָאֱמוּנָה, וְעַיֵּן בְּסֵפֶר הַמַּדָּע בְּדִבְרֵי הַגְּאוֹנִים.`
          : `מָקוֹר הַדִּין מִן הַתַּלְמוּד הַבַּבְלִי מַסֶּכֶת בְּרָכוֹת וּמִדְּבָרֵי הָרִאשׁוֹנִים זִכְרוֹנָם לִבְרָכָה.`,
      translationKa: `${colCfg.centerTopHeaderKa}: განმარტავს ძირითადი ტექსტის პირველწყაროს თალმუდსა და რიშონიმების ტრადიციაში.`,
      explanationKa: colCfg.centerTopHeaderKa,
    },
  ];

  const rightCol: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-right-1`,
      source: 'rashi',
      dibburHamatchil: `${colCfg.rightHeaderHe} • א׳`,
      hebrew:
        realmId === 'rambam'
          ? `כֶּסֶף מִשְׁנֶה (מָרָן בֵּית יוֹסֵף): מְקוֹרוֹ שֶׁל רַבֵּנוּ הָרַמְבַּ״ם מִגְּמָרָא מַסֶּכֶת מַכּוֹת דַּף כ״ג ע״ב, שֶׁמִּצְוַת אָנֹכִי ה׳ הִיא רֵאשִׁית תַּרְיַ״ג מִצְוֹת.`
          : realmId === 'mishnah-berurah'
            ? `מִשְׁנָה בְּרוּרָה ס״ק א׳: יִתְגַּבֵּר כַּאֲרִי — רְצוֹנוֹ לוֹמַר שֶׁיִּתְגַּבֵּר עַל יִצְרוֹ הַמַּסִּיתוֹ בַּבֹּקֶר בְּטַעֲנוֹת שֶׁל צִנָּה אוֹ עַצְלוּת, וְיָקוּם בִּזְרִיזוּת לַעֲבוֹדַת הַבּוֹרֵא.`
            : realmId === 'sephardic-halakha'
              ? `מָרָן הָרַב עוֹבַדְיָה יוֹסֵף זצ״ל (יַלְקוּט יוֹסֵף / יַבִּיעַ אוֹמֵר): הֲלָכָה כְּדִבְרֵי מָרָן הַשֻּׁלְחָן עָרוּךְ שֶׁקִּבַּלְנוּ הוֹרָאוֹתָיו, וְיֵשׁ לְהַקְדִּים קִימַת הַבֹּקֶר בְּשִׂמְחָה וּבְכַוָּנַת הַלֵּב.`
              : `${colCfg.rightHeaderHe}: בֵּיאוּר מְפֹרָט עַל תֵּיבוֹת הַפָּסוּק וְהַהֲלָכָה בְּסִימָן ${chHe} עַל פִּי פְּשַׁט הַדְּבָרִים וּמְסוֹרֶת חֲזַ״ל.`,
      translationKa:
        realmId === 'rambam'
          ? 'ქესეფ მიშნე (მარან ბეთ იოსეფი): რამბამის წყაროა გემარა მაქოთი 23b, სადაც დადგენილია, რომ „ანოხი ჰაშემ“ არის 613 მცნების უპირველესი საფუძველი.'
          : realmId === 'mishnah-berurah'
            ? 'მიშნა ბრურა (სეიფ კატან 1): „გამხნევდეს ლომივით“ — ანუ სძლიოს თავის იეცერ ჰარას (ცდუნებას), რომელიც დილით სიცივის ან სიზარმაცის მიზეზით აყოვნებს, და სწრაფად წამოდგეს გამჩენის სამსახურისთვის.'
            : realmId === 'sephardic-halakha'
              ? 'მარან რავ ყოვადია იოსეფი (იაბიაყ ომერი / იალკუტ იოსეფი): ჰალახა დგინდება მარან შულხან ყარუხის მიხედვით; დილის კურთხევები წარმოითქმება სიხარულითა და მკაფიო დიქციით.'
              : `${colCfg.rightHeaderKa}: დეტალური კლასიკური განმარტება პირველ მუხლზე.`,
      explanationKa: colCfg.rightHeaderKa,
    },
  ];

  const leftCol: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-left-1`,
      source: 'tosafot',
      dibburHamatchil: `${colCfg.leftHeaderHe} • א׳`,
      hebrew:
        realmId === 'rambam'
          ? `מַגִּיד מִשְׁנֶה: וְדַע שֶׁדִּבְרֵי רַבֵּנוּ בְּפֶרֶק זֶה מְבֹאָרִים בְּסֵפֶר מוֹרֵה הַנְּבוֹכִים וּבְהַקְדָּמַת פֵּירוּשׁ הַמִּשְׁנָיוֹת.`
          : realmId === 'mishnah-berurah'
            ? `בֵּיאוּר הֲלָכָה ד״ה יִתְגַּבֵּר: עַיֵּן בְּבֵית יוֹסֵף וּבְדַרְכֵי מֹשֶׁה שֶׁהֵבִיאוּ דִּבְרֵי הַזֹּהַר הַקָּדוֹשׁ עַל מַעֲלַת הַקָּם בַּחֲצוֹת לַיְלָה לַעֲסֹק בַּתּוֹרָה.`
            : realmId === 'sephardic-halakha'
              ? `בֶּן אִישׁ חַי וְכַף הַחַיִּים: עַל פִּי סוֹדוֹת הָאֲרִ״י הַקָּדוֹשׁ זיע״א יֵשׁ לְכַוֵּן בְּקוּמוֹ בַּבֹּקֶר בְּמוֹדֶה אֲנִי בְּהַפְסָקָה בֵּין ״בְּחֶמְלָה״ לְ״רַבָּה אֱמוּנָתֶךָ״.`
              : `${colCfg.leftHeaderHe}: הַשְׁוָאַת הַמְּקוֹרוֹת וְעִיּוּן הֲלָכָה בְּפֶרֶק ${chHe} מִסֵּפֶר ${book.nameHe}.`,
      translationKa:
        realmId === 'rambam'
          ? 'მაგიდ მიშნე: რამბამის ეს სიტყვები ეფუძნება მის ფუნდამენტურ სწავლებას მიშნის კომენტარის შესავალსა და „მორე ნევუხიმში“.'
          : realmId === 'mishnah-berurah'
            ? 'ბიურ ჰალახა: იხილეთ ბეთ იოსეფი და დარხეი მოშე, რომლებიც მოიხმობენ წმინდა ზოჰარის სიტყვებს შუაღამისას თორის სასწავლად ადგომის უდიდეს ღირსებაზე.'
            : realmId === 'sephardic-halakha'
              ? 'ბენ იშ ხაი და ქაფ ჰახაიმი: არი ჰაკადოშის კაბალისტური ტრადიციით, დილით „მოდე ანის“ თქმისას უნდა გაკეთდეს მცირე პაუზა სიტყვა „ბეხემლასა“ და „რაბა ემუნათეხას“ შორის.'
              : `${colCfg.leftHeaderKa}: ღრმა ანალიტიკური კომენტარი და წყაროთა შედარება.`,
      explanationKa: colCfg.leftHeaderKa,
    },
  ];

  const bottomLeft: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-bl-1`,
      source: 'chavruta',
      dibburHamatchil: colCfg.bottomLeftHeaderHe,
      hebrew:
        realmId === 'sephardic-halakha'
          ? `אוֹר לְצִיּוֹן (הַגָּאוֹן רַבִּי בֶּן צִיּוֹן אַבָּא שָׁאוּל זצ״ל): בְּדִין הַבְּרָכוֹת יֵשׁ לָחוּשׁ לִסְפֵק בְּרָכוֹת לְהָקֵל — סב״ל — וּלְהַקְפִּיד עַל עֲנִיַּת אָמֵן בְּכָל כֹּחוֹ.`
          : `${colCfg.bottomLeftHeaderHe}: צִיּוּן מְקוֹרוֹת הַהֲלָכָה וְהַמִּדְרָשׁ לְפֶרֶק ${chHe}.`,
      translationKa:
        realmId === 'sephardic-halakha'
          ? 'ორ ლეციონი (რავ ბენ ციონ აბა შაული): კურთხევების საკითხში მკაცრად ვიცავთ „საფეკ ბერახოთ ლეჰაკელ“ პრინციპს და განსაკუთრებულ ყურადღებას ვუთმობთ „ამენის“ მკაფიოდ წარმოთქმას.'
          : `${colCfg.bottomLeftHeaderKa}: წყაროთა და პრაქტიკულ დასკვნათა შეჯამება.`,
      explanationKa: colCfg.bottomLeftHeaderKa,
    },
  ];

  const bottomRight: TalmudSentence[] = [
    {
      id: `${realmId}-${book.id}-${chapterNum}-br-1`,
      source: 'chavruta',
      dibburHamatchil: colCfg.bottomRightHeaderHe,
      hebrew:
        realmId === 'sephardic-halakha'
          ? `מְנוּחַת אַהֲבָה (הַגָּאוֹן רַבִּי מֹשֶׁה לֵוִי זצ״ל): בֵּיאוּר מַעֲשִׂי מְדֻיָּק בְּסֵדֶר הַתְּפִלָּה וְהַבְּרָכוֹת וְדִינֵי שַׁבָּת כְּמִנְהַג קְהִלּוֹת הַסְּפָרַדִּים וְעֵדוֹת הַמִּזְרָח.`
          : `${colCfg.bottomRightHeaderHe}: סִכּוּם הָעִיּוּן וְהַהֲלָכָה לְמַעֲשֶׂה בְּפֶרֶק ${chHe}.`,
      translationKa:
        realmId === 'sephardic-halakha'
          ? 'მენუხათ აჰავა (რავ მოშე ლევი): პრაქტიკული ჰალახის დეტალური გზამკვლევი სეფარადული და აღმოსავლური თემების ტრადიციით.'
          : `${colCfg.bottomRightHeaderKa}: პრაქტიკული დასკვნა და დამატებითი განმარტება.`,
      explanationKa: colCfg.bottomRightHeaderKa,
    },
  ];

  return {
    realmId,
    bookId: book.id,
    bookNameKa: book.nameKa,
    bookNameHe: book.nameHe,
    chapterNum,
    chapterHe: chHe,
    centerTopSentences: centerTop.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    centerMainSentences: centerMain.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    rightColSentences: rightCol.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    leftColSentences: leftCol.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    bottomLeftSentences: bottomLeft.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
    bottomRightSentences: bottomRight.map(s => ({ ...s, hebrewText: s.hebrewText || s.hebrew })),
  };
}

export function getBooksForRealm(realmId: SacredRealmId): SacredBookItem[] {
  switch (realmId) {
    case 'torah':
      return TORAH_BOOKS;
    case 'neviim':
      return NEVIIM_BOOKS;
    case 'ketuvim':
      return KETUVIM_BOOKS;
    case 'mishnayot':
      return MISHNAYOT_BOOKS;
    case 'rambam':
      return RAMBAM_BOOKS;
    case 'tur':
      return TUR_BOOKS;
    case 'shulchan-aruch':
      return SHULCHAN_ARUCH_BOOKS;
    case 'mishnah-berurah':
      return MISHNAH_BERURAH_BOOKS;
    case 'yalkut-yosef':
    case 'daily-halakhot':
      return YALKUT_YOSEF_KITZUR_BOOKS;
    case 'sephardic-halakha':
      return SEPHARDIC_HALAKHA_BOOKS;
    default:
      return TORAH_BOOKS;
  }
}
