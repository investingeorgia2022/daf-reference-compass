// @ts-nocheck
export type BlessingCategoryId =
  | 'all'
  | 'bread-meal'
  | 'first-food'
  | 'after-food'
  | 'morning-body'
  | 'nature-travel-special';

export interface DailyBlessingItem {
  id: string;
  category: Exclude<BlessingCategoryId, 'all'>;
  categoryLabelKa: string;
  categoryLabelHe: string;
  categoryLabelEn: string;
  titleKa: string;
  titleHe: string;
  titleEn: string;
  shortCodeHe: string;
  whenToSayKa: string;
  whenToSayEn: string;
  examplesKa: string[];
  hebrewText: string;
  transliterationKa: string;
  translationKa: string;
  translationEn: string;
  halakhaNoteKa: string;
  shulchanAruchRef: string;
}

export const BLESSING_CATEGORIES: {
  id: BlessingCategoryId;
  labelKa: string;
  labelHe: string;
  labelEn: string;
  icon: string;
}[] = [
  {
    id: 'all',
    labelKa: 'ყველა კურთხევა',
    labelHe: 'כל הברכות',
    labelEn: 'All Blessings',
    icon: '✨',
  },
  {
    id: 'first-food',
    labelKa: 'საკვები და სასმელი (ჭამის წინ)',
    labelHe: 'ברכות הנהנין (ראשונות)',
    labelEn: 'Before Food & Drink',
    icon: '🍎',
  },
  {
    id: 'bread-meal',
    labelKa: 'პური და სუფრა (ჰამოცი / ბირქათ ჰამაზონი)',
    labelHe: 'ברכות הלחם והסעודה',
    labelEn: 'Bread & Meal Blessings',
    icon: '🍞',
  },
  {
    id: 'after-food',
    labelKa: 'ჭამის შემდგომი (მეყეინ შალოშ / ბორე ნეფაშოთ)',
    labelHe: 'ברכות אחרונות',
    labelEn: 'After-Food Blessings',
    icon: '🍇',
  },
  {
    id: 'morning-body',
    labelKa: 'დილის, სხეულისა და ძილის (აშერ იაცარ / შემაყ)',
    labelHe: 'ברכות השחר, הגוף והשינה',
    labelEn: 'Morning, Body & Bedtime',
    icon: '🌅',
  },
  {
    id: 'nature-travel-special',
    labelKa: 'გზის, სურნელის, ბუნებისა და დღესასწაულის',
    labelHe: 'תפילת הדרך, בשמים והראייה',
    labelEn: 'Travel, Fragrance & Nature',
    icon: '🌈',
  },
];

export const DAILY_BLESSINGS_DATA: DailyBlessingItem[] = [
  // =========================================================================
  // 1. BREAD & MEAL BLESSINGS (ברכות הלחם והסעודה)
  // =========================================================================
  {
    id: 'netilat-yadayim',
    category: 'bread-meal',
    categoryLabelKa: 'პური და სუფრა',
    categoryLabelHe: 'ברכות הסעודה',
    categoryLabelEn: 'Bread & Meal',
    titleKa: 'ყალ ნეტილათ იადაიმ — ხელების დაბანა პურის წინ',
    titleHe: 'ברכת על נטילת ידיים',
    titleEn: 'Al Netilat Yadayim — Washing Hands for Bread',
    shortCodeHe: 'נטילת ידיים',
    whenToSayKa: 'წარმოითქმება პურის ჭამის წინ, ჭურჭლით (ნატლათი) ხელების დაბანის შემდეგ და გამშრალებამდე.',
    whenToSayEn: 'Recited after washing hands with a vessel before eating bread, prior to drying them.',
    examplesKa: ['პური', 'ხალა', 'მაცა', 'ხელების დაბანა', 'ნეტილა'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ עַל נְטִילַת יָדָיִם:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, აშერ კიდეშანუ ბემიცვოთავ, ვეცივანუ ყალ ნეტილათ იადაიმ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელმაც გვაკურთხა თავისი მცნებებით და გვიბრძანა ხელების განბანა.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who sanctified us with His commandments and commanded us regarding the washing of hands.',
    halakhaNoteKa:
      'შულხან ყარუხისა (ორახ ხაიმ 158) და რავ ყოვადია იოსეფის მიხედვით, კურთხევა ითქმება 54 გრამზე (ქაბეცა) მეტი პურის ჭამისას. ბენ იშ ხაისა და მიშნა ბრურას მიხედვით, ჯერ მარჯვენა ხელზე ვასხამთ წყალს 3-ჯერ, შემდეგ მარცხენაზე 3-ჯერ.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן קנ״ח',
  },
  {
    id: 'hamotzi-lechem',
    category: 'bread-meal',
    categoryLabelKa: 'პური და სუფრა',
    categoryLabelHe: 'ברכות הסעודה',
    categoryLabelEn: 'Bread & Meal',
    titleKa: 'ჰამოცი ლეხემ მინ ჰაარეც — პურის კურთხევა',
    titleHe: 'ברכת המוציא לחם מן הארץ',
    titleEn: 'HaMotzi Lechem Min HaAretz — Blessing on Bread',
    shortCodeHe: 'המוציא',
    whenToSayKa: 'წარმოითქმება ხორბლის, ქერის, ჭვავის, შვრიის ან спельта-ს პურზე, ხალაზე და მაცაზე.',
    whenToSayEn: 'Recited before eating bread, Challah, or Matzah made from the five grains.',
    examplesKa: ['პური', 'ხალა', 'მაცა', 'ლავაში', 'თონის პური'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ჰამოცი ლეხემ მინ ჰაარეც.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელსაც გამოაქვს პური მიწიდან.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who brings forth bread from the earth.',
    halakhaNoteKa:
      'ჰალახა (ორახ ხაიმ 167): სიტყვა „ჰამოცი“-ს წინ მცირე პაუზას ვაკეთებთ, რათა ასო „მემ“ არ შეერწყას წინა სიტყვას. კურთხევის დასრულებისთანავე პურს მარილში ვაწობთ და ვჭამთ საუბრის გარეშე.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן קס״ז',
  },
  {
    id: 'birkat-hamazon',
    category: 'bread-meal',
    categoryLabelKa: 'პური და სუფრა',
    categoryLabelHe: 'ברכות הסעודה',
    categoryLabelEn: 'Bread & Meal',
    titleKa: 'ბირქათ ჰამაზონი — პურის ჭამის შემდგომი კურთხევა',
    titleHe: 'ברכת המזון (קצרה ומהודרת)',
    titleEn: 'Birkat HaMazon — Grace After Meals',
    shortCodeHe: 'ברכת המזון',
    whenToSayKa: 'წარმოითქმება პურით ტრაპეზის (მინიმუმ ქაზაითი — 27 გრამი პურის) დასრულების შემდეგ.',
    whenToSayEn: 'Recited after eating at least a kezayit (27g) of bread.',
    examplesKa: ['პურის შემდეგ', 'სადილი', 'სუფრის დასრულება', 'ბირქათ ჰამაზონი'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ בְּחֵן בְּחֶסֶד וּבְרַחֲמִים, הוּא נוֹתֵן לֶחֶם לְכָל בָּשָׂר כִּי לְעוֹלָם חַסְדּוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָסַר לָנוּ וְאַל יֶחְסַר לָנוּ מָזוֹן תָּמִיד לְעוֹלָם וָעֶד. בָּרוּךְ אַתָּה יְיָ, הַזָּן אֶת הַכֹּל:\nנוֹדֶה לְךָ יְיָ אֱלֹהֵינוּ עַל שֶׁהִנְחַלְתָּ לַאֲבוֹתֵינוּ אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה... בָּרוּךְ אַתָּה יְיָ, עַל הָאָרֶץ וְעַל הַמָּזוֹן:\nרַחֵם יְיָ אֱלֹהֵינוּ עָלֵינוּ וְעַל יִשְׂרָאֵל עַמָּךְ וְעַל יְרוּשָׁלַיִם עִירָךְ... בָּרוּךְ אַתָּה יְיָ, בּוֹנֵה יְרוּשָׁלָיִם. אָמֵן:\nבָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָאֵל אָבִינוּ מַלְכֵּנוּ... הוּא הֵטִיב הוּא מֵטִיב הוּא יֵיטִיב לָנוּ:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ჰაზან ეთ ჰაყოლამ კულო ბეტუვო ბეხენ ბეხესედ უვერახამიმ, ჰუ ნოთენ ლეხემ ლეხოლ ბასარ ქი ლეყოლამ ხასდო... ბარუხ ათა ადონაი, ჰაზან ეთ ჰაქოლ. ... ბარუხ ათა ადონაი, ყალ ჰაარეც ვეყალ ჰამაზონ. ... ბარუხ ათა ადონაი, ბონე იერუშალაიმ. ამენ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელიც ასაზრდოებს მთელ სამყაროს თავისი სიკეთით, მადლით, წყალობითა და გულმოწყალებით... კურთხეული ხარ შენ, უფალო, რომელიც ასაზრდოებს ყოველივეს. გმადლობთ მიწისა და საზრდოსათვის... კურთხეული ხარ შენ, უფალო, იერუსალიმის აღმშენებელო. ამენ.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who nourishes the entire world in His goodness, with grace, kindness, and mercy... Blessed are You, Lord, Who nourishes all.',
    halakhaNoteKa:
      'ბირქათ ჰამაზონი თორისმიერი მცნებაა („ვეახალთა ვესავაყთა უვერახთა“). ითქმება მჯდომარე მდგომარეობაში, სუფრასთან, ხელების დაბანის (მაიმ ახარონიმ) შემდეგ.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן קפ״ד',
  },

  // =========================================================================
  // 2. FIRST BLESSINGS ON FOOD & DRINK (ברכות הנהנין — ראשונות)
  // =========================================================================
  {
    id: 'borei-minei-mezonot',
    category: 'first-food',
    categoryLabelKa: 'საკვები და სასმელი',
    categoryLabelHe: 'ברכות הנהנין',
    categoryLabelEn: 'Food & Drink',
    titleKa: 'ბორე მინე მეზონოთ — ნამცხვრის, ფუნთუშის, მაკარონისა და ბრინჯის კურთხევა',
    titleHe: 'ברכת בורא מיני מזונות',
    titleEn: 'Borei Minei Mezonot — Cake, Pastry, Pasta & Rice',
    shortCodeHe: 'מזונות',
    whenToSayKa: 'წარმოითქმება 5 მარცვლეულისგან გამომცხვარ ტკბილეულზე, ნამცხვარზე, ხაჭაპურზე (მცირე რაოდენობით), მაკარონსა და მოხარშულ ბრინჯზე.',
    whenToSayEn: 'Recited on cakes, pastries, cookies, pasta, cereals made of the five grains, and cooked rice.',
    examplesKa: ['ნამცხვარი', 'ფუნთუშა', 'ორცხობილა', 'მაკარონი', 'ბრინჯი', 'ქადები', 'კრუასანი'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי מְזוֹנוֹת:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე მინე მეზონოთ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, მრავალგვარი საზრდოს შემქმნელო.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates various kinds of sustenance.',
    halakhaNoteKa:
      'შენიშვნა: ბრინჯზე პირველი კურთხევაა „ბორე მინე მეზონოთ“, მაგრამ მისი ჭამის შემდეგ ითქმება „ბორე ნეფაშოთ“ (და არა „ყალ ჰამიხია“). თუ ადამიანი ჭამს „მეზონოთ“-ს დანაყრების რაოდენობით (კვებაყ სეყუდა — 216 გრამზე მეტს), იბანს ხელებს და ამბობს „ჰამოცი“-ს.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן קס״ח וסימן ר״ח',
  },
  {
    id: 'borei-peri-hagafen',
    category: 'first-food',
    categoryLabelKa: 'საკვები და სასმელი',
    categoryLabelHe: 'ברכות הנהנין',
    categoryLabelEn: 'Food & Drink',
    titleKa: 'ბორე ფერი ჰაგაფენ — ღვინისა და ყურძნის წვენის კურთხევა',
    titleHe: 'ברכת בורא פרי הגפן',
    titleEn: 'Borei Peri HaGafen — Wine & Grape Juice',
    shortCodeHe: 'הגפן',
    whenToSayKa: 'წარმოითქმება ნატურალურ ქაშერ ღვინოსა და სუფთა ყურძნის წვენზე (კიდუშზე, ჰავდალაზე და ყოველდღე).',
    whenToSayEn: 'Recited before drinking kosher wine or pure grape juice.',
    examplesKa: ['ღვინო', 'ყურძნის წვენი', 'კიდუში', 'ჰავდალა'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე ფერი ჰაგაფენ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, ვაზის ნაყოფის შემქმნელო.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates the fruit of the vine.',
    halakhaNoteKa:
      'სეფარადული ტრადიციით (რავ ყოვადია იოსეფი, ბენ იშ ხაი) წარმოითქმება „ფერი ჰაგაფენ“ (დაგეშის გარეშე ფე-ში: פְּרִי), ხოლო აშკენაზურით — „პრი ჰაგაფენ“. ღვინის კურთხევა ფარავს სხვა სასმელებსაც, რომლებიც სუფრაზეა.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ב',
  },
  {
    id: 'borei-peri-haetz',
    category: 'first-food',
    categoryLabelKa: 'საკვები და სასმელი',
    categoryLabelHe: 'ברכות הנהנין',
    categoryLabelEn: 'Food & Drink',
    titleKa: 'ბორე ფერი ჰაყეც — ხის ხილისა და თხილეულის კურთხევა',
    titleHe: 'ברכת בורא פרי העץ',
    titleEn: 'Borei Peri HaEtz — Tree Fruits & Nuts',
    shortCodeHe: 'העץ',
    whenToSayKa: 'წარმოითქმება მრავალწლიანი ხის ნაყოფზე: ყურძენი, ლეღვი, ბროწეული, ზეთისხილი, ფინიკი, ვაშლი, მსხალი, ატამი, ფორთოხალი, ნიგოზი, ნუში.',
    whenToSayEn: 'Recited before eating fruits that grow on perennial trees and tree nuts.',
    examplesKa: ['ვაშლი', 'ყურძენი', 'ბროწეული', 'ლეღვი', 'ზეთისხილი', 'ფინიკი', 'ფორთოხალი', 'ატამი', 'ნიგოზი', 'თხილი'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָעֵץ:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე ფერი ჰაყეც.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, ხის ნაყოფის შემქმნელო.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates the fruit of the tree.',
    halakhaNoteKa:
      'თუ სუფრაზე რამდენიმე ხილია, უპირატესობა ენიჭება ერეც ისრაელის 7 სახეობას (ზეთისხილი, ფინიკი, ყურძენი, ლეღვი, ბროწეული — „მაგეყ ეშ“).',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ב וסימן רי״א',
  },
  {
    id: 'borei-peri-haadama',
    category: 'first-food',
    categoryLabelKa: 'საკვები და სასმელი',
    categoryLabelHe: 'ברכות הנהנין',
    categoryLabelEn: 'Food & Drink',
    titleKa: 'ბორე ფერი ჰაადამა — ბოსტნეულის, ბანანის, საზამთროსა და მარწყვის კურთხევა',
    titleHe: 'ברכת בורא פרי האדמה',
    titleEn: 'Borei Peri HaAdama — Vegetables, Bananas, Melons & Berries',
    shortCodeHe: 'האדמה',
    whenToSayKa: 'წარმოითქმება მიწის ნაყოფზე, ბოსტნეულზე, მწვანილზე, ბანანზე, ანანასზე, საზამთროზე, ნესვზე, მარწყვსა და მიწის თხილზე (არაქისზე).',
    whenToSayEn: 'Recited before eating vegetables, greens, bananas, pineapples, watermelons, strawberries, and peanuts.',
    examplesKa: ['ბანანი', 'საზამთრო', 'ნესვი', 'მარწყვი', 'ანანასი', 'კიტრი', 'პომიდორი', 'კარტოფილი', 'არაქისი'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָאֲדָמָה:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე ფერი ჰაადამა.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, მიწის ნაყოფის შემქმნელო.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates the fruit of the ground.',
    halakhaNoteKa:
      'მნიშვნელოვანი კანონი: თუ ეჭვი გეპარებათ ხილი ხისაა თუ მიწის, შეგიძლიათ წარმოთქვათ „ბორე ფერი ჰაადამა“, რადგან ხეც მიწიდან იზრდება. ბანანსა და მარწყვზე ყოველთვის ითქმება „ჰაადამა“.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ג',
  },
  {
    id: 'shehakol-nihya-bidvaro',
    category: 'first-food',
    categoryLabelKa: 'საკვები და სასმელი',
    categoryLabelHe: 'ברכות הנהנין',
    categoryLabelEn: 'Food & Drink',
    titleKa: 'შეჰაქოლ ნიჰია ბიდვარო — წყლის, ყავის, ჩაის, ხორცის, თევზის, რძისა და ტკბილეულის კურთხევა',
    titleHe: 'ברכת שהכל נהיה בדברו',
    titleEn: 'Shehakol Nihya Bidvaro — Water, Drinks, Meat, Dairy, Eggs & Sweets',
    shortCodeHe: 'שהכל',
    whenToSayKa: 'წარმოითქმება წყალზე, ყავაზე, ჩაიზე, წვენებზე, ხორცზე, თევზზე, კვერცხზე, ყველზე, რძის ნაწარმზე, სოკოსა და შოკოლადზე.',
    whenToSayEn: 'Recited on water, coffee, tea, juice, meat, poultry, fish, eggs, cheese, mushrooms, and chocolate.',
    examplesKa: ['წყალი', 'ყავა', 'ჩაი', 'წვენი', 'ხორცი', 'თევზი', 'ყველი', 'კვერცხი', 'შოკოლადი', 'სოკო'],
    hebrewText: 'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהַכֹּל נִהְיָה בִּדְבָרוֹ:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, შეჰაქოლ ნიჰია ბიდვარო.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომლის სიტყვითაც შეიქმნა ყოველივე.',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, by Whose word everything came into being.',
    halakhaNoteKa:
      'სეფარადული ტრადიციით წარმოითქმება „ნიჰია“ (נִהְיָה — კამაცით), ხოლო აშკენაზურით — „ნიჰიე“ (נִהְיֶה). ნებისმიერ საეჭვო საკვებზე „შეჰაქოლ“ ასრულებს ვალდებულებას.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ד',
  },

  // =========================================================================
  // 3. AFTER-FOOD BLESSINGS (ברכות אחרונות)
  // =========================================================================
  {
    id: 'meein-shalosh',
    category: 'after-food',
    categoryLabelKa: 'ჭამის შემდგომი',
    categoryLabelHe: 'ברכות אחרונות',
    categoryLabelEn: 'After-Food',
    titleKa: 'მეყეინ შალოშ (ყალ ჰამიხია / ყალ ჰაგაფენ / ყალ ჰაყეც)',
    titleHe: 'ברכת מעין שלוש (על המחיה / על הגפן / על העץ)',
    titleEn: 'Me’ein Shalosh — After Cake, Wine, or Seven Species Fruits',
    shortCodeHe: 'מעין שלוש',
    whenToSayKa: 'წარმოითქმება ქაზაითი (27 გრამი) ნამცხვრის/მეზონოთის, ან 7 სახეობის ხილის (ყურძენი, ლეღვი, ბროწეული, ზეთისხილი, ფინიკი), ან რებიყითი (86 მლ) ღვინის მიღების შემდეგ.',
    whenToSayEn: 'Recited after eating 27g of grain pastry (Al HaMichya), Seven Species fruit (Al HaEtz), or drinking 86ml of wine (Al HaGafen).',
    examplesKa: ['ნამცხვრის შემდეგ', 'ღვინის შემდეგ', 'ყურძნის შემდეგ', 'ფინიკის შემდეგ', 'ყალ ჰამიხია'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה (לְיַיִן: עַל הַגֶּפֶן וְעַל פְּרִי הַגֶּפֶן / לְפֵרוֹת שִׁבְעַת הַמִּינִים: עַל הָעֵץ וְעַל פְּרִי הָעֵץ) וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמָּךְ וְעַל יְרוּשָׁלַיִם עִירָךְ... בָּרוּךְ אַתָּה יְיָ, עַל הָאָרֶץ וְעַל הַמִּחְיָה (אוֹ: וְעַל פְּרִי הַגֶּפֶן / וְעַל הַפֵּרוֹת):',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ყალ ჰამიხია ვეყალ ჰაქალქალა (ღვინოზე: ყალ ჰაგეფენ ვეყალ ფერი ჰაგეფენ / 7 სახეობის ხილზე: ყალ ჰაყეც ვეყალ ფერი ჰაყეც) ვეყალ თენუვათ ჰასადე... ბარუხ ათა ადონაი, ყალ ჰაარეც ვეყალ ჰამიხია (ვეყალ ჰაფეროთ).',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, საზრდოსა და რჩენისათვის (ვაზისა და მისი ნაყოფისათვის / ხისა და მისი ნაყოფისათვის) და მინდვრის მოსავლისათვის და სასურველი, კეთილი და ვრცელი მიწისათვის... კურთხეული ხარ შენ, უფალო, მიწისა და საზრდოსათვის (ნაყოფთაათვის).',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, for the sustenance and the nourishment (for the vine / for the tree) and for the produce of the field... Blessed are You, Lord, for the Land and for the sustenance.',
    halakhaNoteKa:
      'ითქმება იმავე ადგილას, სადაც მივირთვით საკვები, სანამ საკვები ჯერ კიდევ არ გადამუშავებულა (72 წუთის განმავლობაში).',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ח',
  },
  {
    id: 'borei-nefashot',
    category: 'after-food',
    categoryLabelKa: 'ჭამის შემდგომი',
    categoryLabelHe: 'ברכות אחרונות',
    categoryLabelEn: 'After-Food',
    titleKa: 'ბორე ნეფაშოთ — წყლის, სასმელის, ხილისა და სხვა საკვების შემდგომი კურთხევა',
    titleHe: 'ברכת בורא נפשות רבות',
    titleEn: 'Borei Nefashot — General After-Blessing for Food & Drink',
    shortCodeHe: 'בורא נפשות',
    whenToSayKa: 'წარმოითქმება 86 მლ სასმელის (წყალი, ჩაი, წვენი) ან 27 გრამი ხილის, ბოსტნეულის, ხორცის, თევზის, კვერცხის, ყველის, ბრინჯისა და შოკოლადის მიღების შემდეგ.',
    whenToSayEn: 'Recited after drinking 86ml of water/beverages or eating 27g of regular fruits, vegetables, meat, fish, dairy, or rice.',
    examplesKa: ['წყლის დალევის შემდეგ', 'ვაშლის შემდეგ', 'ხორცის შემდეგ', 'ბრინჯის შემდეგ', 'ბორე ნეფაშოთ'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא נְפָשׁוֹת רַבּוֹת וְחֶסְרוֹנָן, עַל כָּל מַה שֶּׁבָּרָאתָ לְהַחֲיוֹת בָּהֶם נֶפֶשׁ כָּל חָי. בָּרוּךְ חֵי הָעוֹלָמִים:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე ნეფაშოთ რაბოთ ვეხესრონან, ყალ ქოლ მა შებარათა ლეჰახაიოთ ბაჰემ ნეფეშ ქოლ ხაი. ბარუხ ხეი ჰაყოლამიმ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელიც ქმნის მრავალ სულდგმულს და მათ საჭიროებებს, ყოველივე იმისათვის, რაც შექმენი, რათა აცოცხლო მათით ყოველი ცოცხალი სული. კურთხეულია სამყაროთა სიცოცხლე!',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates numerous living beings and their needs, for all that You have created with which to sustain the soul of every living thing. Blessed is the Life of the worlds.',
    halakhaNoteKa:
      'რავ ყოვადია იოსეფისა და მიშნა ბრურას მიხედვით, ცხელ ჩაისა და ყავაზე, რომელსაც ნელ-ნელა სვამენ, „ბორე ნეფაშოთ“ ითქმება მხოლოდ მაშინ, თუ რებიყითი (86 მლ) დაილია უწყვეტად (4–7 წუთის შუალედში).',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ר״ז',
  },

  // =========================================================================
  // 4. MORNING, BODY & BEDTIME BLESSINGS (ברכות השחר, הגוף והשינה)
  // =========================================================================
  {
    id: 'modeh-ani',
    category: 'morning-body',
    categoryLabelKa: 'დილისა და სხეულის',
    categoryLabelHe: 'ברכות השחר והגוף',
    categoryLabelEn: 'Morning & Body',
    titleKa: 'მოდე ანი — გაღვიძებისთანავე სათქმელი მადლობა',
    titleHe: 'מודה אני לפניך',
    titleEn: 'Modeh Ani — Upon Awakening in the Morning',
    shortCodeHe: 'מודה אני',
    whenToSayKa: 'წარმოითქმება დილით თვალის გახელისთანავე, საწოლიდან ადგომამდე და ხელების დაბანამდეც კი.',
    whenToSayEn: 'Recited immediately upon waking up in the morning, even before washing hands.',
    examplesKa: ['დილით გაღვიძება', 'მოდე ანი', 'საწოლში'],
    hebrewText:
      'מוֹדֶה (לְאִשָּׁה: מוֹדָה) אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ:',
    transliterationKa:
      'მოდე (ქალისთვის: მოდა) ანი ლეფანეხა მელეხ ხაი ვეკაიამ, შეჰეხეზართა ბი ნიშმათი ბეხემლა, რაბა ემუნათეხა.',
    translationKa:
      'ვმადლობ შენს წინაშე, ცოცხალო და მარადიულო მეუფევ, რომ დამიბრუნე ჩემი სული გულმოწყალებით; დიდია შენი ერთგულება!',
    translationEn:
      'I gratefully thank You, living and enduring King, for You have mercifully restored my soul within me; great is Your faithfulness.',
    halakhaNoteKa:
      'ვინაიდან „მოდე ანი“-ში არ არის ნახსენები ღმერთის წმინდა სახელი, მისი თქმა ნებადართულია და სავალდებულოა ხელების დაბანამდე (ნეტილათ იადაიმამდე). სიტყვა „ბეხემლა“-ს შემდეგ მცირე პაუზა კეთდება.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן א׳',
  },
  {
    id: 'asher-yatzar',
    category: 'morning-body',
    categoryLabelKa: 'დილისა და სხეულის',
    categoryLabelHe: 'ברכות השחר והגוף',
    categoryLabelEn: 'Morning & Body',
    titleKa: 'აშერ იაცარ — საპირფარეშოდან გამოსვლისა და ჯანმრთელობის კურთხევა',
    titleHe: 'ברכת אשר יצר את האדם בחכמה',
    titleEn: 'Asher Yatzar — Blessing for Bodily Health (After Restroom)',
    shortCodeHe: 'אשר יצר',
    whenToSayKa: 'წარმოითქმება ყოველ ჯერზე საპირფარეშოთი სარგებლობისა და ხელების დაბანა-გამშრალების შემდეგ, აგრეთვე დილის კურთხევებში.',
    whenToSayEn: 'Recited after using the restroom and washing/drying hands, and during morning blessings.',
    examplesKa: ['ტუალეტის შემდეგ', 'საპირფარეშო', 'ჯანმრთელობა', 'აშერ იაცარ'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה, וּבָרָא בוֹ נְקָבִים נְקָבִים, חֲלוּלִים חֲלוּלִים. גָּלוּי וְיָדוּעַ לִפְנֵי כִסֵּא כְבוֹדֶךָ, שֶׁאִם יִפָּתֵחַ אֶחָד מֵהֶם, אוֹ יִסָּתֵם אֶחָד מֵהֶם, אִי אֶפְשָׁר לְהִתְקַיֵּם וְלַעֲמוֹד לְפָנֶיךָ אֲפִילוּ שָׁעָה אֶחָת. בָּרוּךְ אַתָּה יְיָ, רוֹפֵא כָל בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, აშერ იაცარ ეთ ჰაადამ ბეხოხმა, უვარა ვო ნეკავიმ ნეკავიმ, ხალულიმ ხალულიმ. გალუი ვეიადუაყ ლიფნე ხისე ხევოდეხა, შეიმ იფათეახ ეხად მეჰემ, ო ისათემ ეხად მეჰემ, ი ეფშარ ლეჰითკაიემ ველაყამოდ ლეფანეხა აფილუ შაყა ეხათ. ბარუხ ათა ადონაი, როფე ხოლ ბასარ უმაფლი ლაყასოთ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელმაც შექმნა ადამიანი სიბრძნით და გაუჩინა მას მრავალი სარქველი და მრავალი ღრუ. ცხადია და ცნობილია შენი დიდების ტახტის წინაშე, რომ თუ გაიხსნება ერთი მათგანი ან დაიხშობა ერთი მათგანი, შეუძლებელი იქნება არსებობა და დგომა შენს წინაშე თუნდაც ერთი საათით. კურთხეული ხარ შენ, უფალო, ყოველი ხორციელის მკურნალო და საოცრებათა მოქმედო!',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who formed man with wisdom and created within him many openings and many cavities... Blessed are You, Lord, Healer of all flesh Who performs wonders.',
    halakhaNoteKa:
      'რამასა და ბენ იშ ხაის წესით, ვინც „აშერ იაცარ“-ს მთელი გულითა და ქავანით კითხულობს, მთელი ცხოვრება დაცულია მძიმე სნეულებისგან.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ו׳',
  },
  {
    id: 'birkot-hatorah',
    category: 'morning-body',
    categoryLabelKa: 'დილისა და სხეულის',
    categoryLabelHe: 'ברכות השחר והגוף',
    categoryLabelEn: 'Morning & Body',
    titleKa: 'ბირქოთ ჰათორა — თორის სწავლის კურთხევები',
    titleHe: 'ברכות התורה',
    titleEn: 'Birkot HaTorah — Blessings Before Studying Torah',
    shortCodeHe: 'ברכות התורה',
    whenToSayKa: 'წარმოითქმება ყოველ დილით თორის, მიშნის, თალმუდის ან ჰალახის სწავლის დაწყებამდე.',
    whenToSayEn: 'Recited every morning before studying any written or oral Torah.',
    examplesKa: ['თორის სწავლა', 'დილის ლოცვა', 'ბირქოთ ჰათორა'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל דִּבְרֵי תוֹרָה: וְהַעֲרֶב נָא יְיָ אֱלֹהֵינוּ אֶת דִּבְרֵי תוֹרָתְךָ בְּפִינוּ וּבְפִיפִיּוֹת עַמְּךָ בֵּית יִשְׂרָאֵל... בָּרוּךְ אַתָּה יְיָ, הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל:\nבָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה יְיָ, נוֹתֵן הַתּוֹרָה:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, აშერ კიდეშანუ ბემიცვოთავ ვეცივანუ ყალ დივრე თორა. ვეჰაყარევ ნა ადონაი ელოჰენუ ეთ დივრე თორათეხა ბეფინუ... ბარუხ ათა ადონაი, ჰამელამედ თორა ლეყამო ისრაელ. ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, აშერ ბახარ ბანუ მიქოლ ჰაყამიმ ვენათან ლანუ ეთ თორათო. ბარუხ ათა ადონაი, ნოთენ ჰათორა.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელმაც გვაკურთხა თავისი მცნებებით და გვიბრძანა თორის სიტყვებზე ზრუნვა. დაატკბე, უფალო ღმერთო ჩვენო, შენი თორის სიტყვები ჩვენს ბაგეებში... კურთხეული ხარ შენ, უფალო, თორის მომცემო!',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who sanctified us with His commandments and commanded us regarding the words of Torah... Blessed are You, Lord, Giver of the Torah.',
    halakhaNoteKa:
      'თორის კურთხევების გარეშე აკრძალულია თორის სიტყვების წარმოთქმა; კურთხევის თქმისთანავე ამბობენ ბირქათ ქოჰანიმის ფასუკებს („იევარეხეხა ადონაი ვეიშმერეხა...“).',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן מ״ז',
  },
  {
    id: 'shema-al-hamita',
    category: 'morning-body',
    categoryLabelKa: 'დილისა და სხეულის',
    categoryLabelHe: 'ברכות השחר והגוף',
    categoryLabelEn: 'Morning & Body',
    titleKa: 'კრიათ შემაყ ყალ ჰამიტა და ჰამაფილ — ძილისწინა კურთხევა',
    titleHe: 'קריאת שמע על המיטה וברכת המפיל',
    titleEn: 'Kriat Shema Al HaMitah & HaMapil — Bedtime Blessing',
    shortCodeHe: 'המפיל',
    whenToSayKa: 'წარმოითქმება ღამით, დაძინების წინ, მიტევების ლოცვასთან და „შემაყ ისრაელ“-თან ერთად.',
    whenToSayEn: 'Recited at night right before going to sleep.',
    examplesKa: ['ძილის წინ', 'ღამის ლოცვა', 'შემაყი', 'ჰამაფილი'],
    hebrewText:
      'שְׁמַע יִשְׂרָאֵל יְיָ אֱלֹהֵינוּ יְיָ אֶחָד: בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:\nבָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּפִּיל חֶבְלֵי שֵׁנָה עַל עֵינָי וּתְנוּמָה עַל עַפְעַפָּי, וּמֵאִיר לְאִישׁוֹן בַּת עָיִן. יְהִי רָצוֹן מִלְּפָנֶיךָ יְיָ אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתַּשְׁכִּיבֵנִי לְשָׁלוֹם וְתַעֲמִידֵנִי לְחַיִּים טוֹבִים וּלְשָׁלוֹם... בָּרוּךְ אַתָּה יְיָ, הַמֵּאִיר לָעוֹלָם כֻּלּוֹ בִּכְבוֹדוֹ:',
    transliterationKa:
      'შემაყ ისრაელ ადონაი ელოჰენუ ადონაი ეხად. ბარუხ შემ ქევოდ მალხუთო ლეყოლამ ვაყედ. ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ჰამაფილ ხევლე შენა ყალ ყენაი უთენუმა ყალ ყაფყაფაი... ბარუხ ათა ადონაი, ჰამეირ ლაყოლამ კულო ბიხვოდო.',
    translationKa:
      'ისმინე, ისრაელ, უფალი ღმერთი ჩვენი — უფალი ერთია! კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელიც ჰფენს ძილის საბურველს ჩემს თვალებს და თვლემას ჩემს ქუთუთოებს... დამაწვინე მშვიდობით და წამომაყენე კეთილი სიცოცხლისა და მშვიდობისათვის. კურთხეული ხარ შენ, უფალო, რომელიც ანათებს მთელ სამყაროს თავისი დიდებით.',
    translationEn:
      'Hear, O Israel, the Lord is our God, the Lord is One... Blessed are You, Lord our God, King of the Universe, Who casts the bonds of sleep upon my eyes and slumber upon my eyelids... Blessed are You, Lord, Who illuminates the entire world with His glory.',
    halakhaNoteKa:
      'დაძინების წინ ადამიანი გულით პატიობს ყველას, ვინც მას აწყენინა („ჰარენი მოხელ ვესოლეახ“), რათა მისი სული სუფთა ავიდეს ზეცად.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן רל״ט',
  },

  // =========================================================================
  // 5. TRAVEL, FRAGRANCE, NATURE & SPECIAL OCCASIONS (תפילת הדרך, בשמים והראייה)
  // =========================================================================
  {
    id: 'tefillat-haderech',
    category: 'nature-travel-special',
    categoryLabelKa: 'გზის, სურნელისა და ბუნების',
    categoryLabelHe: 'ברכות הדרך, הריח והראייה',
    categoryLabelEn: 'Travel, Fragrance & Nature',
    titleKa: 'თეფილათ ჰადერეხ — მგზავრობისა და გზის კურთხევა',
    titleHe: 'תפילת הדרך',
    titleEn: 'Tefillat HaDerech — Traveler’s Prayer',
    shortCodeHe: 'תפילת הדרך',
    whenToSayKa: 'წარმოითქმება ქალაქიდან გასვლისას, საქალაქთაშორისო მგზავრობისას ან თვითმფრინავით ფრენისას.',
    whenToSayEn: 'Recited when setting out on an intercity journey by car, train, ship, or airplane.',
    examplesKa: ['გზა', 'მგზავრობა', 'ფრენა', 'თვითმფრინავი', 'მანქანა', 'თეფილათ ჰადერეხ'],
    hebrewText:
      'יְהִי רָצוֹן מִלְּפָנֶיךָ יְיָ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם, וְתַצְעִידֵנוּ לְשָׁלוֹם, וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתִסְמְכֵנוּ לְשָׁלוֹם, וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם (וְאִם דַּעְתּוֹ לַחֲזוֹר מִיָּד אוֹמֵר: וְתַחְזִירֵנוּ לְשָׁלוֹם). וְתַצִּילֵנוּ מִכַּף כָּל אוֹיֵב וְאוֹרֵב וְלִסְטִים וְחַיּוֹת רָעוֹת בַּדֶּרֶךְ, וּמִכָּל מִינֵי פּוּרְעָנִיּוֹת הַמִּתְרַגְּשׁוֹת וּבָאוֹת לָעוֹלָם. וְתִשְׁלַח בְּרָכָה בְּכָל מַעֲשֵׂה יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ, וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ, כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה. בָּרוּךְ אַתָּה יְיָ, שׁוֹמֵעַ תְּפִלָּה:',
    transliterationKa:
      'იეჰი რაცონ მილეფანეხა ადონაი ელოჰენუ ველოჰე ავოთენუ, შეთოლიხენუ ლეშალომ, ვეთაცყიდენუ ლეშალომ, ვეთადრიხენუ ლეშალომ, ვეთისმეხენუ ლეშალომ, ვეთაგიყენუ ლიმხოზ ხეფცენუ ლეხაიმ ულესიმხა ულეშალომ (უკან დაბრუნებისას: ვეთახზირენუ ლეშალომ). ვეთაცილენუ მიქაფ ქოლ ოიევ ვეორევ ველისტიმ... ბარუხ ათა ადონაი, შომეაყ თეფილა.',
    translationKa:
      'იყოს ნება შენი, უფალო ღმერთო ჩვენო და მამათა ჩვენთა ღმერთო, რომ წაგვიყვანო მშვიდობით, გვატარო მშვიდობით, გვიწინამძღვრო მშვიდობით და მიგვიყვანო ჩვენს დანიშნულების ადგილამდე სიცოცხლით, სიხარულითა და მშვიდობით (და დაგვაბრუნო მშვიდობით). დაგვიფარე ყოველგვარი მტრისა, ჩასაფრებულისა და გზის ხიფათისაგან... კურთხეული ხარ შენ, უფალო, ლოცვის შემსმენელო!',
    translationEn:
      'May it be Your will, Lord our God and God of our forefathers, that You lead us toward peace, guide our footsteps toward peace, and make us reach our desired destination for life, joy, and peace... Blessed are You, Lord, Who hears prayer.',
    halakhaNoteKa:
      'რავ ყოვადია იოსეფის მიხედვით, ღმერთის სახელით („ბარუხ ათა ადონაი, შომეაყ თეფილა“) ითქმება მაშინ, როცა ქალაქგარეთ მგზავრობა მინიმუმ ერთ პარსას (დაახლ. 4 კმ / 72 წუთის სავალს) შეადგენს ან სხვა კურთხევას მიებმება.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן ק״י',
  },
  {
    id: 'shehecheyanu',
    category: 'nature-travel-special',
    categoryLabelKa: 'გზის, სურნელისა და ბუნების',
    categoryLabelHe: 'ברכות הדרך, הריח והראייה',
    categoryLabelEn: 'Travel, Fragrance & Nature',
    titleKa: 'შეჰეხეიანუ — ახალი სეზონის ხილის, ახალი სამოსისა და დღესასწაულის კურთხევა',
    titleHe: 'ברכת שהחיינו וקיימנו והגיענו לזמן הזה',
    titleEn: 'Shehecheyanu — New Seasonal Fruit, New Garment & Festivals',
    shortCodeHe: 'שהחיינו',
    whenToSayKa: 'წარმოითქმება სეზონის ახალი ხილის პირველად გასინჯვისას, ახალი მნიშვნელოვანი სამოსის ჩაცმისას, დღესასწაულებზე და დიდი სიხარულისას.',
    whenToSayEn: 'Recited when tasting a new seasonal fruit for the first time, wearing an important new garment, or on Jewish festivals.',
    examplesKa: ['ახალი ხილი', 'ახალი ტანსაცმელი', 'დღესასწაული', 'შეჰეხეიანუ'],
    hebrewText:
      'בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה:',
    transliterationKa:
      'ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, შეჰეხეიანუ ვეკიემანუ ვეჰიგიყანუ ლაზმან ჰაზე.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, რომელმაც გვაცოცხლა, შეგვინახა და მოგვაწია ამ დროს!',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who has kept us alive, sustained us, and brought us to this season.',
    halakhaNoteKa:
      'ახალ ხილზე ჯერ ითქმება „შეჰეხეიანუ“ (ან ჯერ „ბორე ფერი ჰაყეც“ და მაშინვე „შეჰეხეიანუ“ — მიშნა ბრურასა და იალკუტ იოსეფის მიხედვით უმჯობესია ჯერ ხილის კურთხევა ან შეჰეხეიანუ ხილის დანახვისას და შემდეგ კურთხევა).',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן רכ״ג וסימן רכ״ה',
  },
  {
    id: 'besamim-fragrance',
    category: 'nature-travel-special',
    categoryLabelKa: 'გზის, სურნელისა და ბუნების',
    categoryLabelHe: 'ברכות הדרך, הריח והראייה',
    categoryLabelEn: 'Travel, Fragrance & Nature',
    titleKa: 'ბირქოთ ჰარეახ — სურნელოვანი მცენარეებისა და სუნამოს კურთხევა',
    titleHe: 'ברכות הבשמים והריח (עצי / עשבי / מיני בשמים)',
    titleEn: 'Blessings on Fragrances & Spices (Besamim)',
    shortCodeHe: 'בשמים',
    whenToSayKa: 'წარმოითქმება მურტის (ჰადასის), ვარდის, როზმარინის, პიტნის, ლიმონის ან სურნელების ყნოსვის წინ (მათ შორის ჰავდალაზე).',
    whenToSayEn: 'Recited before smelling fragrant shrubs, herbs, spices, or edible fruits.',
    examplesKa: ['სურნელი', 'ჰადასი', 'ვარდი', 'პიტნა', 'მიხაკი', 'ბესამიმი', 'ჰავდალა'],
    hebrewText:
      'עַל עֲצֵי בְשָׂמִים (הֲדַס, וֶרֶד): בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא עֲצֵי בְשָׂמִים:\nעַל עִשְׂבֵי בְשָׂמִים (נַעְנַע): בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא עִשְׂבֵי בְשָׂמִים:\nעַל כָּל שְׁאָר בְּשָׂמִים: בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי בְשָׂמִים:\nעַל פְּרִי רֵיחָנִי (אֶתְרוֹג, לִימוֹן): בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַנּוֹתֵן רֵיחַ טוֹב בַּפֵּרוֹת:',
    transliterationKa:
      'ხის/ბუჩქის სურნელზე (ჰადასი, ვარდი): ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ბორე ყაცე ვესამიმ.\nბალახოვან სურნელზე (პიტნა): ... ბორე ყისვე ვესამიმ.\nყველა სხვა სურნელზე (მიხაკი, დარიჩინი): ... ბორე მინე ვესამიმ.\nსურნელოვან ხილზე (ეთროგი, ლიმონი): ... ჰანოთენ რეახ ტოვ ბაფეროთ.',
    translationKa:
      'კურთხეული ხარ შენ, უფალო ღმერთო ჩვენო, სამყაროს მეუფევ, სურნელოვანი ხეების / სურნელოვანი ბალახების / მრავალგვარი სურნელების შემქმნელო (ან: ნაყოფთა შორის კეთილი სურნელის მიმცემო).',
    translationEn:
      'Blessed are You, Lord our God, King of the Universe, Who creates fragrant woods / fragrant herbs / various kinds of spices (or: Who gives a pleasant fragrance to fruits).',
    halakhaNoteKa:
      'ბენ იშ ხაისა და ქაფ ჰახაიმის მიხედვით, თუ ადამიანს ეჭვი ეპარება მცენარე ხისაა თუ ბალახის, შეუძლია თქვას „ბორე მინე ვესამიმ“.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימןרט״ז',
  },
  {
    id: 'lightning-thunder-rainbow',
    category: 'nature-travel-special',
    categoryLabelKa: 'გზის, სურნელისა და ბუნების',
    categoryLabelHe: 'ברכות הדרך, הריח והראייה',
    categoryLabelEn: 'Travel, Fragrance & Nature',
    titleKa: 'ელვის, ქუხილისა და ცისარტყელის კურთხევები',
    titleHe: 'ברכות הברק, הרעם והקשת בענן',
    titleEn: 'Blessings on Lightning, Thunder & Rainbow',
    shortCodeHe: 'ברק ורעם וקשת',
    whenToSayKa: 'წარმოითქმება ელვის დანახვისას, ჭექა-ქუხილის გაგონებისას და ცაზე ცისარტყელის გამოჩენისას.',
    whenToSayEn: 'Recited upon seeing lightning, hearing thunder, or seeing a rainbow in the clouds.',
    examplesKa: ['ელვა', 'ჭექა-ქუხილი', 'ქუხილი', 'ცისარტყელა', 'ბუნება'],
    hebrewText:
      'עַל הַבָּרָק: בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית:\nעַל הָרַעַם: בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁכֹּחוֹ וּגְבוּרָתוֹ מָלֵא עוֹלָם:\nעַל הַקֶּשֶׁת: בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, זוֹכֵר הַבְּרִית וְנֶאֱמָן בִּבְרִיתוֹ וְקַיָּם בְּמַאֲמָרוֹ:',
    transliterationKa:
      'ელვაზე: ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ყოსე მაყასე ვერეშით.\nქუხილზე: ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, შექოხო უგევურათო მალე ყოლამ.\nცისარტყელაზე: ბარუხ ათა ადონაი ელოჰენუ მელეხ ჰაყოლამ, ზოხერ ჰაბრით ვენეემან ბივრითო ვეკაიამ ბემაამარო.',
    translationKa:
      'ელვაზე: ...რომელიც იქმს შესაქმის საქმეს.\nქუხილზე: ...რომლის ძალითა და ძლიერებით სავსეა სამყარო.\nცისარტყელაზე: ...რომელსაც ახსოვს აღთქმა, ერთგულია თავისი აღთქმისა და მტკიცეა თავის სიტყვაში.',
    translationEn:
      'On Lightning: ...Who performs the work of Creation.\nOn Thunder: ...Whose strength and might fill the world.\nOn a Rainbow: ...Who remembers the covenant, is faithful to His covenant, and fulfills His word.',
    halakhaNoteKa:
      'ელვისა და ქუხილის კურთხევა ითქმება მაშინვე (თოხ ქედე დიბურ — 3 წამში). ცისარტყელას დიდხანს არ აკვირდებიან, არამედ ერთხელ შეხედავენ და მაშინვე წარმოთქვამენ კურთხევას.',
    shulchanAruchRef: 'שולחן ערוך אורח חיים סימן רכ״ז וסימן רכ״ט',
  },
];
