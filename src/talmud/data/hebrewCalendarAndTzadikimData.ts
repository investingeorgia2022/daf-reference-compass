// @ts-nocheck
import { SacredRealmId } from './tanakhAndHalakhaData';

export interface TzadikBiography {
  id: string;
  nameKa: string;
  nameHe: string;
  titleKa: string;
  eraKa: string;
  years: string;
  hebrewDateStr: string;
  hebrewMonthKey: string;
  hebrewDayNum: number;
  burialPlaceKa: string;
  magnumOpusKa: string;
  biographyKa: string;
  famousTeachingKa: string;
  famousTeachingHe: string;
  linkedRealm: SacredRealmId;
  linkedBookId?: string;
  linkedChapter?: number;
  linkedTractateId?: string;
  linkedDafId?: string;
}

export interface JewishAnnualEvent {
  id: string;
  titleKa: string;
  titleHe: string;
  hebrewDateLabel: string;
  hebrewMonthKey: string;
  hebrewDayNum: number;
  category: 'holiday' | 'fast' | 'rosh-chodesh' | 'special';
  summaryKa: string;
  fullDescriptionKa: string;
  halakhaLawsKa: string;
  torahLink: {
    labelKa: string;
    bookId: string;
    chapter: number;
  };
  talmudLink: {
    labelKa: string;
    tractateId: string;
    dafId: string;
  };
  halakhaLink: {
    labelKa: string;
    realmId: SacredRealmId;
    bookId: string;
    chapter: number;
  };
}

export const TZADIKIM_HILULOT: TzadikBiography[] = [
  {
    id: 'maran-ovadia-yosef',
    nameKa: 'მარან რავ ყოვადია იოსეფი',
    nameHe: 'מרן הרב עובדיה יוסף זצ״ל',
    titleKa: 'რიშონ ლეციონი • თაობის უდიდესი ჰალახის კანონმდებელი („ფოსეკ ჰადორი“)',
    eraKa: 'ახარონიმი / თანამედროვე ეპოქა',
    years: '1920 – 2013 (ג׳ מרחשוון)',
    hebrewDateStr: 'ג׳ מרחשוון (3 ხეშვანი)',
    hebrewMonthKey: 'cheshvan',
    hebrewDayNum: 3,
    burialPlaceKa: 'სანჰედრიის სასაფლაო, იერუსალიმი',
    magnumOpusKa: 'იაბიაყ ომერი (יביע אומר), იახვე დაყათი (יחווה דעת), ხაზონ ყოვადია (חזון עובדיה), ტაჰარათ ჰაბაითი',
    biographyKa:
      'დაიბადა ბაღდადში 1920 წელს და 4 წლის ასაკში ოჯახთან ერთად ავიდა იერუსალიმში. სწავლობდა „ფორათ იოსეფის“ იეშივაში რავ ყეზრა ყატიას ხელმძღვანელობით. ფენომენალური ფოტოგრაფიული მეხსიერებით იცოდა მთელი ბაბილონისა და იერუსალიმის თალმუდი, რიშონიმები და ათასობით რესპონსა ზეპირად. აღადგინა მარან ბეთ იოსეფის უზენაესი ჰალახური ავტორიტეტი ერეც-ისრაელში და გამოსცა 50-ზე მეტი ფუნდამენტური ტომი.',
    famousTeachingKa:
      '„ჰალახის დადგენისას ჩვენი ვალია კოშკურა გავუნათოთ ხალხს თორის სიყვარულითა და ქოხა დეჰეთერათი (ნებადართულობის ძალით), როგორც მარან შულხან ყარუხი გვასწავლის.“',
    famousTeachingHe: 'כח דהיתרא עדיף — להחזיר עטרת מרן הבית יוסף ליושנה',
    linkedRealm: 'sephardic-halakha',
    linkedBookId: 'Yalkut_Yosef_OC',
    linkedChapter: 1,
    linkedTractateId: 'berakhot',
    linkedDafId: '2a',
  },
  {
    id: 'rashi-hakadosh',
    nameKa: 'რაში (რაბენუ შლომო იცხაკი)',
    nameHe: 'רש״י הקדוש • רבינו שלמה יצחקי זיע״א',
    titleKa: 'პარშანდათა — თორისა და თალმუდის უპირველესი განმმარტებელი',
    eraKa: 'რიშონიმი',
    years: '1040 – 1105 (כ״ט תמוז)',
    hebrewDateStr: 'כ״ט תמוז (29 თამუზი)',
    hebrewMonthKey: 'tammuz',
    hebrewDayNum: 29,
    burialPlaceKa: 'ტრუა (საფრანგეთი)',
    magnumOpusKa: 'რაშის კომენტარი მთელ თანახსა და ბაბილონის თალმუდზე',
    biographyKa:
      'დაიბადა საფრანგეთის ქალაქ ტრუაში. სწავლობდა მაინცისა და ვორმსის დიდ იეშივებში რაბენუ გერშომის მოწაფეებთან. ტრუაში დაბრუნების შემდეგ დააარსა ბეთ მიდრაში და შექმნა უკვდავი კომენტარი თორაზე, ნევიიმზე, ქეთუვიმსა და თალმუდზე. ხიდა (החיד״א) წერს, რომ რაშის გარეშე ბაბილონის თალმუდი დახურული წიგნი იქნებოდა.',
    famousTeachingKa: '„რაც არ უნდა ისწავლოს ადამიანმა თორაში, პირველი ნათელი ყოველთვის პეშატისა და მიდრაშის წმინდა კავშირია.“',
    famousTeachingHe: 'אני לא באתי אלא לפשוטו של מקרא ולאגדה המיישבת דברי המקרא',
    linkedRealm: 'torah',
    linkedBookId: 'Genesis',
    linkedChapter: 1,
    linkedTractateId: 'berakhot',
    linkedDafId: '2a',
  },
  {
    id: 'rambam-maimonides',
    nameKa: 'რამბამი (რაბენუ მოშე ბენ მაიმონი)',
    nameHe: 'הרמב״ם • רבינו משה בן מימון זיע״א',
    titleKa: '„ჰანეშერ ჰაგადოლ“ (დიდი არწივი) • მიშნე თორას ავტორი',
    eraKa: 'რიშონიმი',
    years: '1138 – 1204 (כ׳ טבת)',
    hebrewDateStr: 'כ׳ טבת (20 ტევეთი)',
    hebrewMonthKey: 'tevet',
    hebrewDayNum: 20,
    burialPlaceKa: 'ტიბერია (ტვერია), ისრაელი',
    magnumOpusKa: 'მიშნე თორა (იად ჰახაზაკა — 14 წიგნი), მორე ნევუხიმი, სეფერ ჰამიცვოთი, მიშნის კომენტარი',
    biographyKa:
      'დაიბადა კორდოვაში (ესპანეთი), მოღვაწეობდა მაროკოში, ერეც-ისრაელსა და ეგვიპტეში (ფუსტატში), სადაც იყო ეგვიპტის ებრაელთა ნაგიდი და სამეფო კარის მთავარი ექიმი. მან პირველმა მოახდინა მთელი ზეპირი თორის სრული სისტემატიზაცია 14 ტომად („იად ჰახაზაკა“) უნაკლო ივრითით. მასზე ნათქვამია: „მოშედან მოშემდე არ აღმდგარა მოშეს მსგავსი“.',
    famousTeachingKa: '„ისმინე ჭეშმარიტება მისგან, ვინც მას ამბობს, და შეიყვარე სიბრძნე და მშვიდობა.“',
    famousTeachingHe: 'ממשה עד משה לא קם כמשה • שמע האמת ממי שאמרה',
    linkedRealm: 'rambam',
    linkedBookId: 'Mishneh_Torah,_Foundations_of_the_Torah',
    linkedChapter: 1,
    linkedTractateId: 'shabbat',
    linkedDafId: '2a',
  },
  {
    id: 'maran-beit-yosef',
    nameKa: 'მარან რაბი იოსეფ კარო (ბეთ იოსეფი)',
    nameHe: 'מרן רבי יוסף קארו זיע״א • המחבר',
    titleKa: '„ჰამახაბერი“ • შულხან ყარუხის, ბეთ იოსეფისა და ქესეფ მიშნეს ავტორი',
    eraKa: 'რიშონიმისა და ახარონიმის გზაგასაყარი',
    years: '1488 – 1575 (י״ג ניסן)',
    hebrewDateStr: 'י״ג ניסן (13 ნისანი)',
    hebrewMonthKey: 'nisan',
    hebrewDayNum: 13,
    burialPlaceKa: 'ცფათი (საფედი), ისრაელი',
    magnumOpusKa: 'შულხან ყარუხი, ბეთ იოსეფი (ტურზე), ქესეფ მიშნე (რამბამზე), მაგიდ მეშარიმი',
    biographyKa:
      'ესპანეთიდან დევნის შემდეგ მოღვაწეობდა ნიკოპოლსა და ადრიანოპოლში, ხოლო 1536 წელს დამკვიდრდა წმინდა ქალაქ ცფათში. 32 წლის განმავლობაში წერდა მონუმენტურ „ბეთ იოსეფს“, სადაც შეაჯამა თალმუდიდან მოყოლებული ყველა ჰალახური წყარო, შემდეგ კი შექმნა „შულხან ყარუხი“ — მთელი ისრაელის უზენაესი ჰალახური კოდექსი.',
    famousTeachingKa: '„შულხან ყარუხი არის გაშლილი სუფრა, რათა ყოველმა ებრაელმა ნათლად და უშეცდომოდ იცოდეს უფლის გზა.“',
    famousTeachingHe: 'שולחן ערוך לפני כל ישראל לדעת את המעשה אשר יעשון',
    linkedRealm: 'shulchan-aruch',
    linkedBookId: 'Shulchan_Arukh,_Orach_Chayim',
    linkedChapter: 1,
    linkedTractateId: 'berakhot',
    linkedDafId: '2a',
  },
  {
    id: 'ben-ish-chai',
    nameKa: 'ბენ იშ ხაი (რაბენუ იოსეფ ხაიმი)',
    nameHe: 'הבן איש חי • רבינו יוסף חיים מבגדאד זיע״א',
    titleKa: 'ბაღდადისა და აღმოსავლეთის უდიდესი ხახამი, ფოსეკი და კაბალისტი',
    eraKa: 'ახარონიმი',
    years: '1834 – 1909 (י״ג אלול)',
    hebrewDateStr: 'י״ג אלול (13 ელული)',
    hebrewMonthKey: 'elul',
    hebrewDayNum: 13,
    burialPlaceKa: 'ბაღდადი (სიმბოლური მაცევა ზეთისხილის მთაზე, იერუსალიმში)',
    magnumOpusKa: 'ბენ იშ ხაი, რავ პეალიმი, ბენ იეჰოიადა (თალმუდის აგადაზე), ოდ იოსეფ ხაი',
    biographyKa:
      '50 წლის განმავლობაში უძღვებოდა ბაღდადის ებრაულ თემს. ყოველ შაბათს ათასობით მსმენელის წინაშე წარმოთქვამდა უღრმეს ქადაგებებს, სადაც არიზალის კაბალასა და პრაქტიკულ ჰალახას ერთ მთლიანობად აქსოვდა. დაწერა 100-ზე მეტი წიგნი თორის ყველა დარგში.',
    famousTeachingKa: '„როდესაც ჰალახა და კაბალის შინაგანი სინათლე ერთიანდება, ყოველი მცნება ცოცხლდება და ანათებს.“',
    famousTeachingHe: 'בן איש חי רב פעלים מקבצאל — חיבור הפשט והסוד בהלכה',
    linkedRealm: 'sephardic-halakha',
    linkedBookId: 'Ben_Ish_Chai_Halakhot',
    linkedChapter: 1,
    linkedTractateId: 'berakhot',
    linkedDafId: '2a',
  },
  {
    id: 'chafetz-chaim',
    nameKa: 'ხაფეც ხაიმი (რაბი ისრაელ მეირ ჰაქოჰენი)',
    nameHe: 'החפץ חיים • רבי ישראל מאיר הכהן מראדין זצ״ל',
    titleKa: '„მიშნა ბრურასა“ და „ხაფეც ხაიმის“ ავტორი',
    eraKa: 'ახარონიმი',
    years: '1838 – 1933 (כ״ד אלול)',
    hebrewDateStr: 'כ״ד אלול (24 ელული)',
    hebrewMonthKey: 'elul',
    hebrewDayNum: 24,
    burialPlaceKa: 'რადინი (ბელარუსი)',
    magnumOpusKa: 'მიშნა ბრურა (6 ტომი), ბიურ ჰალახა, შაყარ ჰაციუნი, ხაფეც ხაიმი, შმირათ ჰალაშონი, ლიკუტეი ჰალახოთი',
    biographyKa:
      'ცხოვრობდა უდიდესი თავმდაბლობითა და სიწმინდით ქალაქ რადინში. 28 წლის განმავლობაში წერდა 6-ტომიან „მიშნა ბრურას“ შულხან ყარუხის ორახ ხაიმზე, რომელიც გახდა ყოველდღიური ჰალახის უმთავრესი სახელმძღვანელო, აგრეთვე დაადგინა ენის სიწმინდის (შმირათ ჰალაშონის) კანონები.',
    famousTeachingKa: '„ვინ არის კაცი, რომელსაც სურს სიცოცხლე? — დაიცვას თავისი ენა ბოროტისგან და ბაგენი მზაკვრობისგან.“',
    famousTeachingHe: 'מי האיש החפץ חיים אוהב ימים לראות טוב — נצור לשונך מרע',
    linkedRealm: 'mishnah-berurah',
    linkedBookId: 'Mishnah_Berurah_1',
    linkedChapter: 1,
    linkedTractateId: 'berakhot',
    linkedDafId: '2a',
  },
  {
    id: 'rashbi-shimon-bar-yochai',
    nameKa: 'რაბი შიმონ ბარ იოხაი (რაშბი)',
    nameHe: 'רבי שמעון בר יוחאי (רשב״י) זיע״א',
    titleKa: 'წმინდა თანა • „ზოჰარ ჰაკადოშის“ ავტორი',
    eraKa: 'თანაიმი',
    years: 'II საუკუნე (י״ח אייר — ლაგ ბაყომერი)',
    hebrewDateStr: 'י״ח אייר (18 იარი — ლაგ ბაყომერი)',
    hebrewMonthKey: 'iyar',
    hebrewDayNum: 18,
    burialPlaceKa: 'მერონის მთა, გალილეა, ისრაელი',
    magnumOpusKa: 'სეფერ ჰაზოჰარი (ספר הזוהר), სწავლებანი მთელ მიშნასა და ბაბილონის თალმუდში',
    biographyKa:
      'რაბი ყაკივას უახლოესი მოწაფე. რომაელთა დევნის დროს თავის ძესთან, რაბი ელაზართან ერთად 13 წელი იმყოფებოდა ფექიინის გამოქვაბულში, სადაც სწავლობდა თორის უღრმეს საიდუმლოებებს და გამოეცხადა ელიაჰუ ჰანავი. მისი გარდაცვალების დღეს (ლაგ ბაყომერი) მან გაუმხილა მოწაფეებს „იდრა ზუტას“ საიდუმლოებანი.',
    famousTeachingKa: '„თორა, რომელიც შესწავლილია თავგანწირვითა და სიყვარულით, ანათებს სამყაროს და იცავს თაობებს.“',
    famousTeachingHe: 'יכול אני לפטור את כל העולם כולו מן הדין',
    linkedRealm: 'talmud',
    linkedTractateId: 'shabbat',
    linkedDafId: '33b',
  },
  {
    id: 'ari-hakadosh',
    nameKa: 'არი ჰაკადოში (რაბენუ იცხაკ ლურია აშკენაზი)',
    nameHe: 'האריז״ל • רבינו יצחק לוריא אשכנזי זיע״א',
    titleKa: 'ლურიანული კაბალის ფუძემდებელი • წმინდა არი',
    eraKa: 'ახარონიმი / კაბალისტები',
    years: '1534 – 1572 (ה׳ אב)',
    hebrewDateStr: 'ה׳ אב (5 ავი)',
    hebrewMonthKey: 'av',
    hebrewDayNum: 5,
    burialPlaceKa: 'ცფათის ძველი სასაფლაო, ისრაელი',
    magnumOpusKa: 'ყეც ხაიმი (עץ חיים), შმონა შეყარიმი, პრი ყეც ხაიმი, შაყარ ჰაკავანოთი (ჩაწერილი რაბი ხაიმ ვიტალის მიერ)',
    biographyKa:
      'დაიბადა იერუსალიმში, გაიზარდა ეგვიპტეში, სადაც ნილოსის კუნძულზე წლების მანძილზე განმარტოებით სწავლობდა ზოჰარს. 1570 წელს ავიდა ცფათში, სადაც სულ რაღაც ორ წელიწადში თავის უახლოეს მოწაფეს, რაბი ხაიმ ვიტალს გადასცა კაბალის მთელი სისტემა (ციმცუმი, შევირათ ჰაქელიმი, თიკუნი).',
    famousTeachingKa: '„ყოველი ლოცვის წინ ადამიანმა თავის თავზე უნდა მიიღოს მცნება: შეიყვარე მოყვასი შენი, ვითარცა თავი შენი.“',
    famousTeachingHe: 'הריני מקבל עלי מצות עשה של ואהבת לרעך כמוך',
    linkedRealm: 'sephardic-halakha',
    linkedBookId: 'Kaf_HaChaim_OC',
    linkedChapter: 1,
  },
  {
    id: 'baba-sali',
    nameKa: 'ბაბა სალი (რაბენუ ისრაელ აბუჰაცეირა)',
    nameHe: 'הבבא סאלי • סידנא רבי ישראל אבוחצירא זיע״א',
    titleKa: 'წმინდა ცადიკი და სასწაულმოქმედი აბუჰაცეირების დინასტიიდან',
    eraKa: 'თანამედროვე ეპოქა',
    years: '1889 – 1984 (ד׳ שבט)',
    hebrewDateStr: 'ד׳ שבט (4 შვატი)',
    hebrewMonthKey: 'shevat',
    hebrewDayNum: 4,
    burialPlaceKa: 'ნეთივოთი, ისრაელი',
    magnumOpusKa: 'აჰავათ ისრაელი, ტრადიციული ჰალახური და კაბალისტური დარიგებანი',
    biographyKa:
      'რაბი იაყკოვ აბუჰაცეირას („აბირ იაყკოვის“) შვილიშვილი. დაიბადა მაროკოს თაფილალეთში, იყო იეშივის ხელმძღვანელი და მთავარი რაბი, შემდეგ კი დამკვიდრდა ნეთივოთში. ცნობილი იყო თავისი წმინდა მარხვებით, უწყვეტი თორის სწავლითა და სასწაულებრივი კურთხევებით.',
    famousTeachingKa: '„რწმუნება (ემუნა) და თორის ერთგულება ხსნის ზეცის ყველა კარს.“',
    famousTeachingHe: 'צדיק גוזר והקדוש ברוך הוא מקיים',
    linkedRealm: 'ketuvim',
    linkedBookId: 'Psalms',
    linkedChapter: 121,
  },
  {
    id: 'rav-ben-zion-abba-shaul',
    nameKa: 'რავ ბენ-ციონ აბა შაული (ორ ლეციონი)',
    nameHe: 'הגאון רבי בן ציון אבא שאול זצ״ל • אור לציון',
    titleKa: '„ფორათ იოსეფის“ იეშივის ხელმძღვანელი (როშ იეშივა)',
    eraKa: 'თანამედროვე ეპოქა',
    years: '1924 – 1998 (י״ט תמוז)',
    hebrewDateStr: 'י״ט תמוז (19 თამუზი)',
    hebrewMonthKey: 'tammuz',
    hebrewDayNum: 19,
    burialPlaceKa: 'სანჰედრიის სასაფლაო, იერუსალიმი',
    magnumOpusKa: 'შუთ ორ ლეციონი (אור לציון — 4 ტომი ჰალახაში და ტომები თალმუდსა და მუსარზე)',
    biographyKa:
      'დაიბადა იერუსალიმში. მარან რავ ყოვადია იოსეფის თანაკლასელი და უახლოესი მეგობარი „ფორათ იოსეფის“ იეშივაში. ათწლეულების განმავლობაში აღზარდა ათასობით სეფარადი თალმიდ ხახამი და დადგინა იერუსალიმის სეფარადული ჰალახური სკოლის უმაღლესი სტანდარტი.',
    famousTeachingKa: '„თორის სიღრმე მოიპოვება მხოლოდ გულწრფელი შრომითა და თვალებისა და გულის სიწმინდით.“',
    famousTeachingHe: 'אור לציון — יגיעת התורה בקדושה ובענווה',
    linkedRealm: 'sephardic-halakha',
    linkedBookId: 'Or_LeTzion_Halakha',
    linkedChapter: 1,
  },
  {
    id: 'vilna-gaon',
    nameKa: 'ვილნის გაონი (ჰაგრა — რაბენუ ელიაჰუ ვილნიდან)',
    nameHe: 'הגאון מווילנא (הגר״א) • רבינו אליהו זיע״א',
    titleKa: 'ახარონიმების უდიდესი გენია • ბიურ ჰაგრას ავტორი',
    eraKa: 'ახარონიმი',
    years: '1720 – 1797 (י״ט תשרי)',
    hebrewDateStr: 'י״ט תשרי (19 თიშრეი — ხოლ ჰამოყედ სუქოთი)',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 19,
    burialPlaceKa: 'ვილნიუსი (ვილნა, ლიეტუვა)',
    magnumOpusKa: 'ბიურ ჰაგრა (შულხან ყარუხის ოთხივე ნაწილზე), ადერეთ ელიაჰუ (თორაზე), შნოთ ელიაჰუ (მიშნაზე)',
    biographyKa:
      'ბავშვობიდანვე ფლობდა ფენომენალურ ცოდნას მთელ წერილობით და ზეპირ თორაში, კაბალასა და მეცნიერებებში. მისმა ტექსტოლოგიურმა შესწორებებმა („ჰაგაჰოთ ჰაგრა“) და შულხან ყარუხის კომენტარმა („ბიურ ჰაგრა“) საფუძველი დაუდო თანამედროვე ლიტვური იეშივების სამყაროსა და „მიშნა ბრურას“.',
    famousTeachingKa: '„თორის ყოველი ასო შეიცავს მთელი სამყაროს წარსულს, აწმყოსა და მომავალს.“',
    famousTeachingHe: 'כל מה שהיה הווה ויהיה כלול בתורה מבראשית ועד לעיני כל ישראל',
    linkedRealm: 'shulchan-aruch',
    linkedBookId: 'Shulchan_Arukh,_Orach_Chayim',
    linkedChapter: 1,
  },
  {
    id: 'rav-moshe-feinstein',
    nameKa: 'რავ მოშე ფაინშტაინი (იგროთ მოშე)',
    nameHe: 'הגאון רבי משה פיינשטיין זצ״ל • אגרות משה',
    titleKa: 'XX საუკუნის აშკენაზური სამყაროს უზენაესი ფოსეკი',
    eraKa: 'თანამედროვე ეპოქა',
    years: '1895 – 1986 (י״ג אדר)',
    hebrewDateStr: 'י״ג אדר (13 ადარი — თაყანით ესთერი)',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 13,
    burialPlaceKa: 'ჰარ ჰამენუხოთი, იერუსალიმი',
    magnumOpusKa: 'იგროთ მოშე (אגרות משה — 9 ტომი ჰალახურ რესპონსებში), დიბროთ მოშე (თალმუდზე)',
    biographyKa:
      'დაიბადა უზდაში (ბელარუსი), იყო ლიუბანის რაბი, ხოლო 1937 წლიდან ნიუ-იორკის „მეთივთა თიფერეთ იერუშალაიმის“ ხელმძღვანელი. მის „იგროთ მოშეს“ მიმართავდა მთელი მსოფლიოს ებრაელობა უმძიმეს სამედიცინო, ტექნოლოგიურ, შაბათისა და საოჯახო ჰალახურ საკითხებზე.',
    famousTeachingKa: '„ჰალახური პასუხის გაცემა მოითხოვს აბსოლუტურ სიმართლეს გემარის წინაშე და უდიდეს თანაგრძნობას ადამიანის მიმართ.“',
    famousTeachingHe: 'אגרות משה — בירור הלכה לאמיתה של תורה',
    linkedRealm: 'talmud',
    linkedTractateId: 'shabbat',
    linkedDafId: '2a',
  },
];

export const JEWISH_ANNUAL_EVENTS: JewishAnnualEvent[] = [
  {
    id: 'rosh-hashanah',
    titleKa: 'როშ ჰაშანა • ებრაული ახალი წელი და განკითხვის დღე',
    titleHe: 'ראש השנה • יום הדין ותקיעת שופר',
    hebrewDateLabel: 'א׳–ב׳ תשרי (1–2 თიშრეი)',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 1,
    category: 'holiday',
    summaryKa: 'სამყაროსა და ადამიანის შექმნის დღე, შოფარის კურთხევა და გამჩენის გამეფება.',
    fullDescriptionKa:
      'როშ ჰაშანა (א׳–ב׳ תשרי) არის ადამ ჰარიშონის შექმნის დღე და მთელი კაცობრიობის განკითხვის დღე (יום הדין). ამ დღეს მთავარი მცნებაა შოფარის ხმის მოსმენა (תְּקִיעָה, שְׁבָרִים, תְּרוּעָה), მალხუიოთის, ზიხრონოთისა და შოფაროთის ლოცვები და სიმბოლური „სიმანიმის“ (ვაშლი თაფლში, ბროწეული, თავი) მიღება კეთილი და ტკბილი წლისთვის.',
    halakhaLawsKa:
      'შოფარის დაკვრა სრულდება ფეხზე მდგომარე (100 ხმა); თუ პირველი დღე შაბათს დაემთხვა, შოფარს უკრავენ მხოლოდ მეორე დღეს (გემარა როშ ჰაშანა 29b).',
    torahLink: {
      labelKa: 'თორა: ვაიკრა (ლევიანნი) თავი 23 — ზოხრონ თერუა',
      bookId: 'Leviticus',
      chapter: 23,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი როშ ჰაშანა דף 2a (ოთხი ახალი წელი)',
      tractateId: 'rosh_hashanah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: რამბამი • ჰილხოთ შოფარ თავი 1',
      realmId: 'rambam',
      bookId: 'Mishneh_Torah,_Shofar,_Sukkah_and_Lulav',
      chapter: 1,
    },
  },
  {
    id: 'yom-kippur',
    titleKa: 'იომ ქიფური • მიტევებისა და განწმენდის უწმინდესი დღე',
    titleHe: 'יום הכיפורים • שבת שבתון',
    hebrewDateLabel: 'י׳ תשרי (10 თიშრეი)',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 10,
    category: 'holiday',
    summaryKa: '25-საათიანი მარხვა, 5 ლოცვა (კოლ ნიდრეიდან ნეილამდე) და ტაძარში ქოჰენ გადოლის მსახურება.',
    fullDescriptionKa:
      'იომ ჰაქიფურიმი (י׳ תשרי) არის წელიწადის უწმინდესი დღე („შაბათ შაბათონ“), როდესაც მოშე რაბენუ მეორე ფილებით ჩამოვიდა სინაის მთიდან სრული მიტევების ნიშნად. მოქმედებს 5 აკრძალვა (ჭამა-სმა, დაბანა, ცხება, ტყავის ფეხსაცმელი, ცოლქმრული სიახლოვე) და სრულდება ქოჰენ გადოლის მსახურების მოგონება („სედერ ჰაავოდა“).',
    halakhaLawsKa:
      'იომ ქიფური მიუტევებს ცოდვებს ადამიანსა და გამჩენს შორის თეშუვით (მონანიებით), ხოლო ადამიანებს შორის ცოდვებს — მხოლოდ მოყვასისგან პატიების თხოვნის შემდეგ (მიშნა იომა 85b).',
    torahLink: {
      labelKa: 'თორა: ვაიკრა თავი 16 — ახარეი მოთ (ქოჰენ გადოლის მსახურება)',
      bookId: 'Leviticus',
      chapter: 16,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი იომა דף 2a',
      tractateId: 'yoma',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: რამბამი • ჰილხოთ თეშუვა თავი 1',
      realmId: 'rambam',
      bookId: 'Mishneh_Torah,_Repentance',
      chapter: 1,
    },
  },
  {
    id: 'sukkot-simchat-torah',
    titleKa: 'სუქოთი და სიმხათ თორა • კარვების დღესასწაული და ოთხი მცენარე',
    titleHe: 'חג הסוכות ושמחת תורה • ארבעת המינים',
    hebrewDateLabel: 'ט״ו–כ״ב תשרי (15–22 თიშრეი)',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 15,
    category: 'holiday',
    summaryKa: '7 დღე სუქაში ცხოვრება, არბაათ ჰამინიმის (ეთროგი, ლულავი, ჰადასი, არავა) კურთხევა და თორის ციკლის დასრულება.',
    fullDescriptionKa:
      'სუქოთი აღნიშნავს უდაბნოში ისრაელის ძეთა დიდების ღრუბლებით (ענני הכבוד) დაცვას. მთელი კვირის განმავლობაში ებრაელები სადილობენ და ცხოვრობენ სუქაში და აერთიანებენ ოთხ მცენარეს ისრაელის ერთიანობის ნიშნად. მერვე დღეს (შმინი აცერეთი / სიმხათ თორა) სრულდება და ხელახლა იწყება თორის წლიური კითხვა.',
    halakhaLawsKa:
      'სუქას სახურავი (სხახი) უნდა იყოს მცენარეული წარმოშობის, მიწიდან მოწყვეტილი, და მისი ჩრდილი უნდა სჭარბობდეს მზის სინათლეს.',
    torahLink: {
      labelKa: 'თორა: დევარიმი თავი 33 — ვეზოთ ჰაბერახა (სიმხათ თორის კითხვა)',
      bookId: 'Deuteronomy',
      chapter: 33,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი სუქა דף 2a (სუქას ზომები და სხახი)',
      tractateId: 'sukkah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: რამბამი • ჰილხოთ სუქა და ლულავი თავი 4',
      realmId: 'rambam',
      bookId: 'Mishneh_Torah,_Shofar,_Sukkah_and_Lulav',
      chapter: 4,
    },
  },
  {
    id: 'chanukah',
    titleKa: 'ხანუქა • სინათლისა და ტაძრის განახლების 8-დღიანი დღესასწაული',
    titleHe: 'חג החנוכה • נר חנוכה והלל',
    hebrewDateLabel: 'כ״ה כסלו – ב׳ טבת (25 ქისლევი – 2 ტევეთი)',
    hebrewMonthKey: 'kislev',
    hebrewDayNum: 25,
    category: 'holiday',
    summaryKa: 'ხაშმონაიმების გამარჯვება, მენორის ზეთის სასწაული, ხანუქიის ანთება („პირსუმეი ნისა“) და სრული ჰალელი.',
    fullDescriptionKa:
      '25 ქისლევს ხაშმონაიმებმა განწმინდეს იერუსალიმის ტაძარი და იპოვეს ქოჰენ გადოლის ბეჭდით დალუქული სუფთა ზეითუნის ზეთის მხოლოდ ერთი დოქი, რომელიც სასწაულებრივად 8 დღე ენთო. ბრძენებმა დააწესეს 8 დღე სანთლების ანთება („მეჰადრინ მინ ჰამეჰადრინ“ — ყოველ დღე თითო სანთლის მომატებით), ჰალელი და „ალ ჰანისიმი“.',
    halakhaLawsKa:
      'ხანუქის სანთლებით რაიმე საქმისთვის სარგებლობა აკრძალულია („ჰანეროთ ჰალალუ კოდეშ ჰემ“), ამიტომ მათ გვერდით ვანთებთ შამაშს.',
    torahLink: {
      labelKa: 'თორა: ბამიდბარი თავი 7–8 — ნესიიმების მიძღვნა და მენორის ანთება',
      bookId: 'Numbers',
      chapter: 8,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი შაბათი דף 21b (მაი ხანუქა?)',
      tractateId: 'shabbat',
      dafId: '21b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 670',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 670,
    },
  },
  {
    id: 'purim',
    titleKa: 'ფურიმი • მეგილათ ესთერის კითხვა და სასწაულებრივი ხსნა',
    titleHe: 'חג הפורים • מקרא מגילה ומשלוח מנות',
    hebrewDateLabel: 'י״ד–ט״ו אדר (14–15 ადარი)',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 14,
    category: 'holiday',
    summaryKa: 'ფურიმის 4 მცნება: მეგილათ ესთერის მოსმენა, მიშლოახ მანოთი, მატანოთ ლაევიონიმი და სეუდათ ფურიმი.',
    fullDescriptionKa:
      'სპარსეთის იმპერიაში მორდეხაისა და დედოფალ ესთერის მეშვეობით ჰამანის ბოროტი განზრახვა სასიკეთოდ შემოტრიალდა („ვენაჰაფოხ ჰუ“). 14 ადარს (ხოლო გალავნიან ქალაქებში, როგორიცაა იერუსალიმი — 15 ადარს, შუშან ფურიმს) იკითხება მეგილათ ესთერი საღამოსა და დილით.',
    halakhaLawsKa:
      'მეგილათ ესთერის ყველა სიტყვა მკაფიოდ უნდა მოისმინოს როგორც მამაკაცმა, ისე ქალმა, რადგან ქალებიც იმავე სასწაულში მონაწილეობდნენ.',
    torahLink: {
      labelKa: 'ქეთუვიმი: მეგილათ ესთერი თავი 1',
      bookId: 'Esther',
      chapter: 1,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი მეგილა דף 2a',
      tractateId: 'megillah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: მიშნა ბრურა • სიმანი 685–697 (ჰილხოთ მეგილა)',
      realmId: 'mishnah-berurah',
      bookId: 'Mishnah_Berurah_6',
      chapter: 688,
    },
  },
  {
    id: 'pesach',
    titleKa: 'ფესახი • ეგვიპტიდან გამოსვლისა და თავისუფლების დღესასწაული',
    titleHe: 'חג הפסח • ליל הסדר וחג המצות',
    hebrewDateLabel: 'ט״ו–כ״א ניסן (15–21 ნისანი)',
    hebrewMonthKey: 'nisan',
    hebrewDayNum: 15,
    category: 'holiday',
    summaryKa: 'ლეיל ჰასედერი, ჰაგადის თხრობა, მაცის ჭამა, ოთხი სასმისი, მარორი და ხამეცის სრული აკრძალვა.',
    fullDescriptionKa:
      '15 ნისნის ღამეს ტარდება ლეיל ჰასედერი, სადაც სრულდება თორის მცნება „ვეჰიგადთა ლებინხა“ (უამბე შენს შვილს ეგვიპტიდან გამოსვლის შესახებ), იჭმევა ხელით გამომცხვარი შმურა-მაცა, მწარე მწვანილი (მარორი) და ისმება 4 სასმისი ღვინო თავისუფლების 4 გამოთქმის შესაბამისად.',
    halakhaLawsKa:
      '14 ნისნის ღამეს სრულდება ბდიკათ ხამეცი სანთლის შუქზე, ხოლო დილით ხამეცის დაწვა (ბიურ ხამეცი). სეფარადული და აშკენაზური ტრადიციების შედარება იხილეთ ფოსკიმების ბადეში.',
    torahLink: {
      labelKa: 'თორა: შემოთი (გამოსვლა) თავი 12 — ფარაშათ ბო',
      bookId: 'Exodus',
      chapter: 12,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი ფესახიმ דף 2a (ორ ლე-არბაა ასარ)',
      tractateId: 'pesachim',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: რამბამი • ჰილხოთ ხამეც უმაცა თავი 1',
      realmId: 'rambam',
      bookId: 'Mishneh_Torah,_Leavened_and_Unleavened_Bread',
      chapter: 1,
    },
  },
  {
    id: 'shavuot',
    titleKa: 'შავუოთი • სინაის მთაზე თორის ბოძების დღესასწაული (მათან თორა)',
    titleHe: 'חג השבועות • זמן מתן תורתנו',
    hebrewDateLabel: 'ו׳ סיוון (6 სივანი)',
    hebrewMonthKey: 'sivan',
    hebrewDayNum: 6,
    category: 'holiday',
    summaryKa: 'ომერის 49 დღის დაგვირგვინება, თიკუნ ლეיל შავუოთი (მთელი ღამე თორის სწავლა), ათი მცნებისა და რუთის კითხვა.',
    fullDescriptionKa:
      '6 სივანს გამჩენი გამოეცხადა მთელ ისრაელის ერს სინაის მთაზე და უბოძა თორა და ათი მცნება (עשרת הדברות). მთელ ებრაულ სამყაროში მიღებულია შავუოთის ღამეს ფხიზლად დარჩენა („თიკუნ ლეיל შავუოთი“), რძის ნაწარმის მიღება და მეგილათ რუთის წაკითხვა.',
    halakhaLawsKa:
      'ვინც შავუოთის მთელ ღამეს ფხიზლად ატარებს თორის სწავლაში, დილის კურთხევების (ბირქოთ ჰაშახარის) წარმოთქმის წესში იხილეთ მარან ყოვადია იოსეფისა და მიშნა ბრურას დადგენილებანი.',
    torahLink: {
      labelKa: 'თორა: შემოთი თავი 19–20 — ფარაშათ ითრო (ათი მცნება)',
      bookId: 'Exodus',
      chapter: 20,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი შაბათი דף 88a (მათან თორა)',
      tractateId: 'shabbat',
      dafId: '88a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: სეფარადული ჰალახის სკოლა • ხაზონ ყოვადია და ბენ იშ ხაი',
      realmId: 'sephardic-halakha',
      bookId: 'Yalkut_Yosef_OC',
      chapter: 494,
    },
  },
  {
    id: 'tisha-bav',
    titleKa: 'თიშა ბეავი • პირველი და მეორე ტაძრის დანგრევის სამგლოვიარო მარხვა',
    titleHe: 'תשעה באב • תענית ומגילת איכה',
    hebrewDateLabel: 'ט׳ אב (9 ავი)',
    hebrewMonthKey: 'av',
    hebrewDayNum: 9,
    category: 'fast',
    summaryKa: '25-საათიანი მარხვა, მეგილათ ეიხასა და ქინოთის კითხვა და იერუსალიმის აღდგენის რწმენა.',
    fullDescriptionKa:
      '9 ავის დღეს დაინგრა როგორც სოლომონ მეფის პირველი ტაძარი, ისე მეორე ტაძარი იერუსალიმში. საღამოს და დილით იკითხება იერემია წინასწარმეტყველის „ეიხა“ (გოდება) და ქინოთი, ხოლო შუადღის შემდეგ ნუგეშის ლოცვა „ნახემ“.',
    halakhaLawsKa:
      'თიშა ბეავზე თორის სწავლა ნებადართულია მხოლოდ სამგლოვიარო ნაწილებში (ეიხა, იობი, იერემიას თავები და გემარა გიტინის „ჰანიზაკინის“ აგადა).',
    torahLink: {
      labelKa: 'ქეთუვიმი: მეგილათ ეიხა (გოდება იერემიასი) თავი 1',
      bookId: 'Lamentations',
      chapter: 1,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი თაანითი דף 26b',
      tractateId: 'taanit',
      dafId: '26b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 554',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 554,
    },
  },
  {
    id: 'tzom-gedaliah',
    titleKa: 'ცომ გედალია • გედალია ბენ ახიკამის მარხვა',
    titleHe: 'צום גדליה',
    hebrewDateLabel: 'ג׳ תשרי (3 თიშრი)',
    hebrewMonthKey: 'tishrei',
    hebrewDayNum: 3,
    category: 'fast',
    summaryKa: 'სاجარო მარხვა ცისკრიდან ვარსკვლავების გამოსვლამდე იუდეის მმართველის, გედალია ბენ ახიკამის მოსაგონებლად.',
    fullDescriptionKa:
      'პირველი ტაძრის დანგრევის შემდეგ დარჩენილი ებრაული მოსახლეობა გედალია ბენ ახიკამის გარშემო გაერთიანდა, მაგრამ მისი მკვლელობის შედეგად იუდეაში ებრაული თვითმმართველობა საბოლოოდ შეწყდა. ბრძენებმა დააწესეს მარხვა 3 თიშრის.',
    halakhaLawsKa:
      'მარხვა იწყება ცისკრის ამოსვლიდან (עמוד השחר) და სრულდება ვარსკვლავების გამოსვლისას (צאת הכוכבים). თუ 3 თიშრი შაბათს დაემთხვა, მარხვა გადადის კვირას (4 თიშრის).',
    torahLink: {
      labelKa: 'ნევიიმი: იერემია თავი 40–41',
      bookId: 'Jeremiah',
      chapter: 41,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი როშ ჰაშანა דף 18b',
      tractateId: 'rosh_hashanah',
      dafId: '18b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 549',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 549,
    },
  },
  {
    id: 'asara-btevet',
    titleKa: 'ასარა ბეტევეთი • 10 ტევეთის მარხვა (იერუსალიმის ალყის დაწყება)',
    titleHe: 'עשרה בטבת',
    hebrewDateLabel: 'י׳ טבת (10 ტევეთი)',
    hebrewMonthKey: 'tevet',
    hebrewDayNum: 10,
    category: 'fast',
    summaryKa: 'ბაბილონის მეფე ნაბუქოდონოსორის მიერ იერუსალიმის ალყის დაწყების დღე — საჯარო მარხვა.',
    fullDescriptionKa:
      '10 ტევეთს ბაბილონის მეფე ნაბუქოდონოსორმა ალყა შემოარტყა იერუსალიმს, რასაც მოჰყვა გალავნის გარღვევა და პირველი ტაძრის დანგრევა. იკითხება სლიხოთი, „ანენუ“ და თორის მონაკვეთი „ვაიხალ მოშე“.',
    halakhaLawsKa:
      'მარხვა იწყება ცისკრის ამოსვლიდან (עמוד השחר) ვარსკვლავების გამოსვლამდე. შახრითსა და მინხაზე იკითხება თორა (შემოთი 32:11) და მინხაზე ჰაფტარა „დირშუ ჰაშემ“.',
    torahLink: {
      labelKa: 'ნევიიმი: ეზეკიელი თავი 24',
      bookId: 'Ezekiel',
      chapter: 24,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი როშ ჰაშანა דף 18b',
      tractateId: 'rosh_hashanah',
      dafId: '18b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 550',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 550,
    },
  },
  {
    id: 'tu-bishvat',
    titleKa: 'ტუ ბიშვატი • ხეების ახალი წელი (ראש השנה לאילנות)',
    titleHe: 'ט"ו בשבט',
    hebrewDateLabel: 'ט״ו שבט (15 შვატი)',
    hebrewMonthKey: 'shevat',
    hebrewDayNum: 15,
    category: 'special',
    summaryKa: 'ხეების ახალი წელი (ბეთ ჰილელის მიხედვით), ერეც-ისრაელის 7 ნაყოფის კურთხევა და ტუ ბიშვატის სედერი.',
    fullDescriptionKa:
      'მიშნა როშ ჰაშანის პირველ თავში ბეთ ჰილელი ადგენს, რომ 15 შვატი არის ხეების ახალი წელი თერუმისა და მაასერის გამოსათვლელად. ამ დღეს მიღებულია ერეც-ისრაელის ხილის (ზეთისხილი, ფინიკი, ყურძენი, ლეღვი, ბროწეული) გასინჯვა და კურთხევების წარმოთქმა.',
    halakhaLawsKa:
      'ტუ ბიშვატზე არ იკითხება თახანუნი, აკრძალულია მარხვა. ახალი ხილის გასინჯვისას წარმოითქმება კურთხევა „შეჰეხეიანუ“.',
    torahLink: {
      labelKa: 'თორა: დევარიმი თავი 8 — შივათ ჰამინიმი (შვიდი სახეობა)',
      bookId: 'Deuteronomy',
      chapter: 8,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი როშ ჰაშანა דף 2a (ראש השנה לאילנות)',
      tractateId: 'rosh_hashanah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 131 და 225',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 225,
    },
  },
  {
    id: 'taanit-esther',
    titleKa: 'თაანით ესთერი • ესთერ დედოფლის მარხვა ფურიმის წინ',
    titleHe: 'תענית אסתר',
    hebrewDateLabel: 'י״ג אדר (13 ადარი)',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 13,
    category: 'fast',
    summaryKa: 'მარხვა ფურიმის წინა დღეს და „მახაცით ჰაშეკელის“ (ნახევარი შეკელის) გაცემის ტრადიცია მინხის წინ.',
    fullDescriptionKa:
      '13 ადარს ებრაელები შეიკრიბნენ თავდასაცავად და გამჩენის წინაშე მარხვითა და ლოცვით ითხოვეს წყალობა, როგორც დედოფალმა ესთერმა სთხოვა მორდეხაის. მინხის ლოცვის წინ გაიცემა „ზეხერ ლამახაცით ჰაშეკელ“ (სამი ნახევარ-მონეტა ქველმოქმედებაში).',
    halakhaLawsKa:
      'თუ 13 ადარი შაბათს დაემთხვა, მარხვა გადმოიწევს ხუთშაბათს (11 ადარს). მარხვა სრულდება ვარსკვლავების გამოსვლისას მეგილათ ესთერის მოსმენით.',
    torahLink: {
      labelKa: 'ქეთუვიმი: მეგილათ ესთერი თავი 4',
      bookId: 'Esther',
      chapter: 4,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი მეგილა דף 2a',
      tractateId: 'megillah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 686',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 686,
    },
  },
  {
    id: 'shushan-purim',
    titleKa: 'შუშან ფურიმი • ფურიმი იერუსალიმსა და უძველეს გალავნიან ქალაქებში',
    titleHe: 'שושן פורים',
    hebrewDateLabel: 'ט״ו אדר (15 ადარი)',
    hebrewMonthKey: 'adar',
    hebrewDayNum: 15,
    category: 'holiday',
    summaryKa: 'იერუსალიმსა და იოშუა ბინ ნუნის დროიდან გალავნიან ქალაქებში ფურიმი აღინიშნება 15 ადარს.',
    fullDescriptionKa:
      'შუშანის დედაქალაქში ებრაელებმა მტერზე გამარჯვება 14 ადარს დაასრულეს და 15 ადარს იზეიმეს. ბრძენებმა დაადგინეს, რომ ქალაქები, რომლებსაც იოშუა ბინ ნუნის ეპოქაში გალავანი ჰქონდათ (უპირველესად წმინდა იერუსალიმი), მეგილას კითხულობენ 15 ადარს.',
    halakhaLawsKa:
      '15 ადარს მთელ მსოფლიოში აკრძალულია თახანუნის თქმა და მარხვა, ხოლო იერუსალიმში სრულდება ფურიმის ოთხივე მცნება.',
    torahLink: {
      labelKa: 'ქეთუვიმი: მეგილათ ესთერი თავი 9',
      bookId: 'Esther',
      chapter: 9,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი მეგილა דף 2a (כרכים המוקפין חומה)',
      tractateId: 'megillah',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 688',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 688,
    },
  },
  {
    id: 'erev-pesach',
    titleKa: 'ერევ ფესახი • ხამეცის დაწვა, პირმშოთა მარხვა და სედერისთვის მზადება',
    titleHe: 'ערב פסח',
    hebrewDateLabel: 'י״ד ניסן (14 ნისანი)',
    hebrewMonthKey: 'nisan',
    hebrewDayNum: 14,
    category: 'holiday',
    summaryKa: 'პირმშოთა მარხვა (תענית בכורות), ხამეცის ჭამისა და დაწვის საბოლოო დროები და სედერის სამზადისი.',
    fullDescriptionKa:
      '14 ნისნის წინა ღამეს სრულდება ბდიკათ ხამეცი (ხამეცის შემოწმება სანთლის შუქზე), ხოლო 14 ნისნის დილით — პირმშოთა მარხვა (ან ტრაქტატის დასრულების სიუმი) და ხამეცის დაწვა (ბიურ ხამეცი) მეხუთე საათის ბოლომდე.',
    halakhaLawsKa:
      '14 ნისანს მეოთხე საათის შემდეგ ხამეცის ჭამა იკრძალება, ხოლო მეხუთე საათის ბოლომდე სრულდება ბიურ ხამეცი და „კოლ ხამირა“. მצה-ს ჭამა ამ დღეს იკრძალება, რათა სედერის ღამეს მაცა მადით შეიჭამოს.',
    torahLink: {
      labelKa: 'თორა: შემოთი თავი 12',
      bookId: 'Exodus',
      chapter: 12,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი ფესახიმ דף 2a (אור לארבעה עשר)',
      tractateId: 'pesachim',
      dafId: '2a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 443–471',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 443,
    },
  },
  {
    id: 'lag-baomer',
    titleKa: 'ლაგ ბაომერი • რაბი შიმონ ბარ იოხაის (რაშბის) ჰილულა',
    titleHe: 'ל"ג בעומר',
    hebrewDateLabel: 'י״ח אייר (18 იარი)',
    hebrewMonthKey: 'iyar',
    hebrewDayNum: 18,
    category: 'special',
    summaryKa: 'ომერის 33-ე დღე, რაბი აკივას მოწაფეთა ეპიდემიის შეწყვეტა და რაშბის ჰილულა მერონში.',
    fullDescriptionKa:
      'ომერის დათვლის 33-ე დღეს (18 იარს) შეწყდა რაბი აკივას 24,000 მოწაფის გარდაცვალება და ამავე დღეს აღესრულა წმინდა თანა რაბი შიმონ ბარ იოხაი, „ზოჰარის“ ავტორი, რომელმაც გარდაცვალების წინ გაამჟღავნა თორის უღრმესი საიდუმლოებანი.',
    halakhaLawsKa:
      'ლაგ ბაომერზე არ იკითხება თახანუნი და იხსნება ომერის დღეების გლოვის შეზღუდვები (აშკენაზურ ტრადიციაში ამ დღეს, ხოლო სეფარადულ ტრადიციაში 34-ე დღის დილიდან).',
    torahLink: {
      labelKa: 'თორა: ვაიკრა თავი 23 — სფირათ ჰაომერი',
      bookId: 'Leviticus',
      chapter: 23,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი იევამოთ דף 62b და შაბათი 33b',
      tractateId: 'shabbat',
      dafId: '33b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 493',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 493,
    },
  },
  {
    id: 'tzom-tammuz',
    titleKa: 'შივა ასარ ბეთამუზი • 17 თამუზის მარხვა (ბეინ ჰამეცარიმის დასაწყისი)',
    titleHe: 'שבעה עשר בתמוז',
    hebrewDateLabel: 'י״ז תמוז (17 თამუზი)',
    hebrewMonthKey: 'tammuz',
    hebrewDayNum: 17,
    category: 'fast',
    summaryKa: 'იერუსალიმის გალავნის გარღვევა და პირველი ფილების დამსხვრევა — სამკვირიანი გლოვის დასაწყისი.',
    fullDescriptionKa:
      'მიშნა თაანითის (26a) თანახმად, 17 თამუზს მოხდა ხუთი მძიმე განსაცდელი: მოშემ დაამსხვრია პირველი ფილები ოქროს ხბოს ცოდვის გამო, შეწყდა თამიდის მსხვერპლშეწირვა და გაირღვა იერუსალიმის გალავანი. ამ დღიდან იწყება „ბეინ ჰამეცარიმის“ 3 კვირა.',
    halakhaLawsKa:
      'მარხვა გრძელდება ცისკრიდან ვარსკვლავების გამოსვლამდე; თუ 17 თამუზი შაბათია, მარხვა გადადის კვირას (18 თამუზს).',
    torahLink: {
      labelKa: 'თორა: შემოთი თავი 32 — ვაიხალ მოშე',
      bookId: 'Exodus',
      chapter: 32,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი თაანითი דף 26a (חמשה דברים אירעו את אבותינו)',
      tractateId: 'taanit',
      dafId: '26a',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 549–551',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 551,
    },
  },
  {
    id: 'tu-bav',
    titleKa: 'ტუ ბეავი • სიყვარულის, შერიგებისა და თორის სწავლის მატების დღე',
    titleHe: 'ט"ו באב',
    hebrewDateLabel: 'ט״ו אב (15 ავი)',
    hebrewMonthKey: 'av',
    hebrewDayNum: 15,
    category: 'special',
    summaryKa: 'ისრაელის ტომების გაერთიანება, ტაძრისთვის შეშის მიტანის დასრულება და ღამით თორის სწავლის მატება.',
    fullDescriptionKa:
      'მიშნა თაანითის დასასრულს რაბან შიმონ ბენ გამლიელი ამბობს: „არ იყო ისრაელში 15 ავსა და იომ ქიფურზე უფრო სასიხარულო დღეები“. ამ დღიდან ღამეები იზრდება და იმატებს ღამით გემარის სწავლის ვალდებულება („דמוסיף יוסיף“).',
    halakhaLawsKa:
      '15 ავს არ იკითხება თახანუნი. ბაბა ბათრას (121b) თანახმად, 15 ავიდან მოყოლებული თალმიდ ხახამები უმატებენ ღამის სწავლის საათებს.',
    torahLink: {
      labelKa: 'ნევიიმი: მსაჯულნი (შოფტიმ) თავი 21',
      bookId: 'Judges',
      chapter: 21,
    },
    talmudLink: {
      labelKa: 'თალმუდი: ტრაქტატი თაანითი דף 26b და 30b',
      tractateId: 'taanit',
      dafId: '30b',
    },
    halakhaLink: {
      labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 131',
      realmId: 'shulchan-aruch',
      bookId: 'Shulchan_Arukh,_Orach_Chayim',
      chapter: 131,
    },
  },
];

export interface FormattedHebrewDate {
  hebrewFull: string;
  hebrewDayGematria: string;
  hebrewMonthHe: string;
  hebrewMonthKa: string;
  hebrewMonthKey: string;
  hebrewDayNum: number;
  hebrewYearNum: number;
}

const HEBREW_MONTH_MAP: Record<string, { ka: string; key: string }> = {
  תשרי: { ka: 'თიშრეი', key: 'tishrei' },
  חשון: { ka: 'ხეშვანი', key: 'cheshvan' },
  חשוון: { ka: 'ხეშვანი', key: 'cheshvan' },
  מרחשוון: { ka: 'მარხეშვანი', key: 'cheshvan' },
  כסלו: { ka: 'ქისლევი', key: 'kislev' },
  טבת: { ka: 'ტევეთი', key: 'tevet' },
  שבט: { ka: 'შვატი', key: 'shevat' },
  אדר: { ka: 'ადარი', key: 'adar' },
  'אדר א׳': { ka: 'ადარ I', key: 'adar' },
  'אדר ב׳': { ka: 'ადარ II', key: 'adar' },
  ניסן: { ka: 'ნისანი', key: 'nisan' },
  אייר: { ka: 'იარი', key: 'iyar' },
  סיוון: { ka: 'სივანი', key: 'sivan' },
  סיון: { ka: 'სივანი', key: 'sivan' },
  תמוז: { ka: 'თამუზი', key: 'tammuz' },
  אב: { ka: 'ავი', key: 'av' },
  אלול: { ka: 'ელული', key: 'elul' },
};

const HEBREW_DAYS_GEMATRIA = [
  '',
  'א׳',
  'ב׳',
  'ג׳',
  'ד׳',
  'ה׳',
  'ו׳',
  'ז׳',
  'ח׳',
  'ט׳',
  'י׳',
  'י״א',
  'י״ב',
  'י״ג',
  'י״ד',
  'ט״ו',
  'ט״ז',
  'י״ז',
  'י״ח',
  'י״ט',
  'כ׳',
  'כ״א',
  'כ״ב',
  'כ״ג',
  'כ״ד',
  'כ״ה',
  'כ״ו',
  'כ״ז',
  'כ״ח',
  'כ״ט',
  'ל׳',
];

export function getHebrewDateInfo(date: Date): FormattedHebrewDate {
  try {
    const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date);

    const dayStr = parts.find((p) => p.type === 'day')?.value || '1';
    const monthHeRaw = parts.find((p) => p.type === 'month')?.value || 'תשרי';
    const yearStr = parts.find((p) => p.type === 'year')?.value || '5787';

    const dayNum = Math.max(1, Math.min(30, parseInt(dayStr.replace(/\D/g, ''), 10) || 1));
    const yearNum = parseInt(yearStr.replace(/\D/g, ''), 10) || 5787;
    const cleanMonthHe = monthHeRaw.replace(/^ב/, '').trim();
    const mapped = HEBREW_MONTH_MAP[cleanMonthHe] || { ka: cleanMonthHe, key: 'tishrei' };
    const dayGem = HEBREW_DAYS_GEMATRIA[dayNum] || `${dayNum}`;

    return {
      hebrewFull: `${dayGem} ${cleanMonthHe} ה׳תשפ״ז`,
      hebrewDayGematria: dayGem,
      hebrewMonthHe: cleanMonthHe,
      hebrewMonthKa: mapped.ka,
      hebrewMonthKey: mapped.key,
      hebrewDayNum: dayNum,
      hebrewYearNum: yearNum,
    };
  } catch {
    const fallbackDay = ((date.getDate() + 14) % 29) + 1;
    const dayGem = HEBREW_DAYS_GEMATRIA[fallbackDay] || 'א׳';
    return {
      hebrewFull: `${dayGem} תשרי ה׳תשפ״ז`,
      hebrewDayGematria: dayGem,
      hebrewMonthHe: 'תשרי',
      hebrewMonthKa: 'თიშრეი',
      hebrewMonthKey: 'tishrei',
      hebrewDayNum: fallbackDay,
      hebrewYearNum: 5787,
    };
  }
}

export function getEventsAndHilulotForDate(date: Date): {
  hebrewInfo: FormattedHebrewDate;
  events: JewishAnnualEvent[];
  tzadikim: TzadikBiography[];
} {
  const hebrewInfo = getHebrewDateInfo(date);
  const exactEvents = JEWISH_ANNUAL_EVENTS.filter(
    (ev) =>
      ev.hebrewMonthKey === hebrewInfo.hebrewMonthKey &&
      Math.abs(ev.hebrewDayNum - hebrewInfo.hebrewDayNum) <= 1
  );

  // Also check Shabbat / Rosh Chodesh
  const extraEvents: JewishAnnualEvent[] = [];
  if (hebrewInfo.hebrewDayNum === 1 || hebrewInfo.hebrewDayNum === 30) {
    extraEvents.push({
      id: `rosh-chodesh-${hebrewInfo.hebrewMonthKey}`,
      titleKa: `როშ ხოდეშ ${hebrewInfo.hebrewMonthKa} • ახალი ებრაული თვის დასაწყისი`,
      titleHe: `ראש חודש ${hebrewInfo.hebrewMonthHe}`,
      hebrewDateLabel: `${hebrewInfo.hebrewDayGematria} ${hebrewInfo.hebrewMonthHe}`,
      hebrewMonthKey: hebrewInfo.hebrewMonthKey,
      hebrewDayNum: hebrewInfo.hebrewDayNum,
      category: 'rosh-chodesh',
      summaryKa: 'იაალე ვეიავო, ჰალელი, თორის კითხვა (4 ალია) და მუსაფის ლოცვა.',
      fullDescriptionKa: `როშ ხოდეში (${hebrewInfo.hebrewMonthHe}) არის პირველი მცნება, რომელიც მიეცა ისრაელის ერს ეგვიპტიდან გამოსვლის წინ („ჰახოდეშ ჰაზე ლახემ“). ამ დღეს იკითხება ჰალელი, ამიდასა და ბირქათ ჰამაზონში ემატება „იაალე ვეიავო“ და სრულდება როშ ხოდეშის მუსაფი.`,
      halakhaLawsKa: 'როშ ხოდეშზე აკრძალულია მარხვა და სამგლოვიარო გოდება; სასურველია სადღესასწაულო ტრაპეზი.',
      torahLink: {
        labelKa: 'თორა: ბამიდბარი თავი 28 — უვერაშეი ხოდშეიხემ',
        bookId: 'Numbers',
        chapter: 28,
      },
      talmudLink: {
        labelKa: 'თალმუდი: ტრაქტატი როშ ჰაშანა דף 20a (კידוש החודש)',
        tractateId: 'rosh_hashanah',
        dafId: '20a',
      },
      halakhaLink: {
        labelKa: 'ჰალახა: შულხან ყარუხი • ორახ ხაიმი სიმანი 417–428',
        realmId: 'shulchan-aruch',
        bookId: 'Shulchan_Arukh,_Orach_Chayim',
        chapter: 417,
      },
    });
  }

  if (date.getDay() === 6) {
    extraEvents.push({
      id: `shabbat-kodesh-${date.toISOString().slice(0, 10)}`,
      titleKa: 'შაბათ კოდეში • წმინდა შაბათი და კვირის ფარაშის კითხვა',
      titleHe: 'שבת קודש • קריאת התורה ומוסף',
      hebrewDateLabel: `${hebrewInfo.hebrewDayGematria} ${hebrewInfo.hebrewMonthHe}`,
      hebrewMonthKey: hebrewInfo.hebrewMonthKey,
      hebrewDayNum: hebrewInfo.hebrewDayNum,
      category: 'special',
      summaryKa: 'შაბათის სანთლები, სამი სეუდა, კრიათ ჰათორა (7 ალია + მაფტირი და ჰაფტარა).',
      fullDescriptionKa: 'შაბათი არის სამყაროს შექმნის გვირგვინი და გამჩენთან მარადიული აღთქმის ნიშანი („ოთ ჰი לעולם“).',
      halakhaLawsKa: 'შაბათის დაცვა უდრის მთელი თორის ყველა მცნების შესრულებას.',
      torahLink: {
        labelKa: 'თორა: შემოთი თავი 20 (ზახორ ეთ იომ ჰაშაბათ)',
        bookId: 'Exodus',
        chapter: 20,
      },
      talmudLink: {
        labelKa: 'თალმუდი: ტრაქტატი შაბათი דף 2a',
        tractateId: 'shabbat',
        dafId: '2a',
      },
      halakhaLink: {
        labelKa: 'ჰალახა: რამბამი • ჰილხოთ შაბათ თავი 1',
        realmId: 'rambam',
        bookId: 'Mishneh_Torah,_Sabbath',
        chapter: 1,
      },
    });
  }

  // Match Tzadikim by exact date or deterministic daily rotation so every clicked date displays Tzadikim Hilulot!
  const exactTzadikim = TZADIKIM_HILULOT.filter(
    (tz) =>
      tz.hebrewMonthKey === hebrewInfo.hebrewMonthKey &&
      tz.hebrewDayNum === hebrewInfo.hebrewDayNum
  );

  const idx1 = (hebrewInfo.hebrewDayNum + date.getMonth() * 3) % TZADIKIM_HILULOT.length;
  const idx2 = (idx1 + 4) % TZADIKIM_HILULOT.length;
  const dailyTzadikim =
    exactTzadikim.length > 0
      ? exactTzadikim
      : [TZADIKIM_HILULOT[idx1], TZADIKIM_HILULOT[idx2]];

  return {
    hebrewInfo,
    events: [...exactEvents, ...extraEvents],
    tzadikim: dailyTzadikim,
  };
}
