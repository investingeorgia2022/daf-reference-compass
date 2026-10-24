// @ts-nocheck
export interface HalachaBridgeEntry {
  id: string;
  dafRef: string;
  topicKa: string;
  topicHe: string;
  gemaraQuoteHe: string;
  sentenceId?: string;
  rambam: {
    refHe: string;
    refKa: string;
    textHe: string;
    textKa: string;
  };
  tur: {
    refHe: string;
    refKa: string;
    textHe: string;
    textKa: string;
  };
  shulchanAruch: {
    refHe: string;
    refKa: string;
    textHe: string;
    textKa: string;
    psakSummaryKa: string;
  };
}

export interface ParallelSugyaComparison {
  id: string;
  sourceTractateId: string;
  sourceDafId: string;
  sourceTitleKa: string;
  sourceTitleHe: string;
  parallelTractateId: string;
  parallelDafId: string;
  parallelTitleKa: string;
  parallelTitleHe: string;
  connectionTypeKa: string;
  sourceSnippetHe: string;
  sourceSnippetKa: string;
  parallelSnippetHe: string;
  parallelSnippetKa: string;
  keyDifferencesKa: string[];
  highlightedWordsHe: string[];
}

export interface TalmudicRealiaItem {
  id: string;
  category: 'length' | 'volume' | 'coins' | 'vessels' | 'flora';
  categoryLabelKa: string;
  nameHe: string;
  nameKa: string;
  translitKa: string;
  modernChazonIsh: string;
  modernChaimNaeh: string;
  biblicalOrRabbinic: string;
  descriptionKa: string;
  talmudContextKa: string;
  dafRef: string;
  svgType: 'amah-cubit' | 'volume-cup' | 'silver-coin' | 'menorah-vessel' | 'four-species' | 'oven-achnai';
  baseMetricValue?: number; // e.g., cm, ml, or grams for live calculator
  baseChazonIshValue?: number;
  metricUnit?: string;
}

export interface TalmudFlashcard {
  id: string;
  termHe: string;
  translitKa: string;
  meaningKa: string;
  category: 'aramaic' | 'abbreviation' | 'logic' | 'user-saved';
  expandedHe?: string; // for Rashei Tevot
  exampleHe: string;
  exampleKa: string;
  boxLevel: number; // 1 = New/Again, 2 = Learning, 3 = Mastered
}

export interface SocraticChallengeQuestion {
  id: string;
  stageBadgeHe: string;
  stageBadgeKa: string;
  questionKa: string;
  gemaraContextHe: string;
  hintKa: string;
  options: {
    id: string;
    textKa: string;
    isCorrect: boolean;
  }[];
  rashiTosafotAnalysisKa: string;
}

export const HALACHA_BRIDGE_ITEMS: HalachaBridgeEntry[] = [
  {
    id: 'halacha-taanit-2a-1',
    dafRef: 'Taanit 2a',
    topicKa: 'წვიმის ძალების მოხსენიება („მაშივ ჰარუახ უმორიდ ჰაგეშემ“) შმონე ესრეში',
    topicHe: 'הזכרת גבורות גשמים בתפילת העמידה',
    gemaraQuoteHe: 'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג',
    sentenceId: 'taanit-2a-m1',
    rambam: {
      refHe: 'רמב״ם הלכות תפילה פרק ב׳ הלכה ט״ו',
      refKa: 'რამბამი, ჰილხოთ თეფილა, თავი 2, ჰალახა 15',
      textHe: 'מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים בִּתְחִיַּת הַמֵּתִים מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג בִּתְפִלַּת מוּסָף עַד יוֹם טוֹב הָרִאשׁוֹן שֶׁל פֶּסַח.',
      textKa: 'წვიმის ძალებს იხსენიებენ მეორე კურთხევაში (მკვდრეთით აღდგომის ბერახაში) სუქოთის ბოლო დღის — შმინი აცერეთის მუსაფის ლოცვიდან ფესახის პირველ დღემდე.',
    },
    tur: {
      refHe: 'טור אורח חיים סימן קי״ד',
      refKa: 'ტური, ორახ ხაიმი, სიმანი 114',
      textHe: 'מַתְחִילִין לוֹמַר מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם בְּמוּסָף שֶׁל שְׁמִינִי עֲצֶרֶת כְּדִבְרֵי רַבִּי יְהוֹשֻׁעַ.',
      textKa: 'ვიწყებთ „მაშივ ჰარუახ უმორიდ ჰაგეშემ“-ის თქმას შმინი აცერეთის მუსაფის ლოცვაში, რაბი იეჰოშუას აზრის შესაბამისად.',
    },
    shulchanAruch: {
      refHe: 'שולחן ערוך אורח חיים סימן קי״ד סעיף א׳–ב׳',
      refKa: 'შულხან არუხი, ორახ ხაიმი, სიმანი 114, სეიფი 1–2',
      textHe: 'אוֹמְרִים מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם מִתְּפִלַּת מוּסָף שֶׁל יוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג עַד תְּפִלַּת מוּסָף שֶׁל יוֹם טוֹב הָרִאשׁוֹן שֶׁל פֶּסַח.',
      textKa: 'ვამბობთ „მაშივ ჰარუახ უმორიდ ჰაგეშემ“-ს სუქოთის ბოლო დღის (შმინი აცერეთის) მუსაფის ლოცვიდან ფესახის პირველი დღის მუსაფამდე.',
      psakSummaryKa: 'საბოლოო ჰალახა დადგენილია რაბი იეჰოშუას მოსაზრების მიხედვით: წვიმის ხსენება იწყება შმინი აცერეთის მუსაფში, რათა სუქოთის დღეებში სუქაში ჯდომას წვიმამ ხელი არ შეუშალოს.',
    },
  },
  {
    id: 'halacha-taanit-2a-2',
    dafRef: 'Taanit 2a',
    topicKa: 'განსხვავება წვიმის „მოხსენიებასა“ (הזכרה) და წვიმის „თხოვნას“ (שאלה) შორის',
    topicHe: 'החילוק בין הזכרת גשמים לשאלת גשמים (ותן טל ומטר)',
    gemaraQuoteHe: 'אֵינוֹ שׁוֹאֵל אֶלָּא בְּבִרְכַּת הַשָּׁנִים, וּמַזְכִּיר בִּתְחִיַּת הַמֵּתִים',
    sentenceId: 'taanit-2a-g2',
    rambam: {
      refHe: 'רמב״ם הלכות תפילה פרק ב׳ הלכה ט״ז',
      refKa: 'რამბამი, ჰილხოთ თეფილა, თავი 2, ჰალახა 16',
      textHe: 'שְׁאֵלַת גְּשָׁמִים הִיא שֶׁיֹּאמַר וְתֵן טַל וּמָטָר בְּבִרְכַּת הַשָּׁנִים מִלֵּיל שִׁבְעָה בְּמַרְחֶשְׁוָן בְּאֶרֶץ יִשְׂרָאֵל.',
      textKa: 'წვიმის თხოვნა („ვეთენ ტალ უმატარ ლივრახა“) ითქმის „ბირქათ ჰაშანიმ“-ში (მე-9 კურთხევაში) ერეც ისრაელში 7 მარხეშვანიდან.',
    },
    tur: {
      refHe: 'טור אורח חיים סימן קי״ז',
      refKa: 'ტური, ორახ ხაიმი, სიმანი 117',
      textHe: 'שׁוֹאֲלִין גְּשָׁמִים בְּבִרְכַּת הַשָּׁנִים: בְּאֶרֶץ יִשְׂרָאֵל מִז׳ בְּמַרְחֶשְׁוָן, וּבְחוּץ לָאָרֶץ ס׳ יוֹם אַחַר תְּקוּפַת תִּשְׁרֵי.',
      textKa: 'წვიმას ითხოვენ წელიწადის კურთხევაში: ისრაელში 7 მარხეშვანიდან, ხოლო დიასპორაში თიშრეის ტკუფიდან მე-60 დღეს.',
    },
    shulchanAruch: {
      refHe: 'שולחן ערוך אורח חיים סימן קי״ז סעיף א׳',
      refKa: 'შულხან არუხი, ორახ ხაიმი, სიმანი 117, სეიფი 1',
      textHe: 'צָרִיךְ לִשְׁאֹל גְּשָׁמִים בְּבִרְכַּת הַשָּׁנִים, וְאִם טָעָה וְלֹא שָׁאַל — חוֹזֵר לְרֹאשׁ הַתְּפִלָּה.',
      textKa: 'აუცილებელია წვიმის თხოვნა „ბირქათ ჰაშანიმ“-ში, ხოლო თუ შეცდა და არ ითხოვა — ბრუნდება ლოცვის დასაწყისში (ან იმავე ბერახაში).',
      psakSummaryKa: 'გემარა განასხვავებს ქებას („მაშივ ჰარუახ“ მე-2 კურთხევაში) და საარსებო თხოვნას („ვეთენ ტალ უმატარ“ მე-9 კურთხევაში).',
    },
  },
  {
    id: 'halacha-taanit-2a-3',
    dafRef: 'Taanit 2a',
    topicKa: 'სამი გასაღები, რომელიც მხოლოდ გამჩენის ხელთაა (ג׳ מפתחות ביד הקב״ה)',
    topicHe: 'שלושה מפתחות שלא נמסרו ביד שליח וציון בתפילה',
    gemaraQuoteHe: 'שְׁלֹשָׁה מַפְתְּחוֹת בְּיָדוֹ שֶׁל הַקָּדוֹשׁ בָּרוּךְ הוּא שֶׁלֹּא נִמְסְרוּ בְּיַד שָׁלִיחַ',
    sentenceId: 'taanit-2a-g5',
    rambam: {
      refHe: 'רמב״ם הלכות תעניות פרק א׳ הלכה א׳',
      refKa: 'რამბამი, ჰილხოთ თაანიოთ, თავი 1, ჰალახა 1',
      textHe: 'מִצְוַת עֲשֵׂה מִן הַתּוֹרָה לִזְעֹק וּלְהָרִיעַ עַל כָּל צָרָה שֶׁתָּבוֹא עַל הַצִּבּוּר, וּבִפְרָט עַל עֲצִירַת גְּשָׁמִים.',
      textKa: 'თორის დადებითი მცნებაა ლოცვა და შეძახილი საზოგადოებაზე მოსული ყოველი განსაცდელისას, განსაკუთრებით კი წვიმის შეწყვეტის დროს.',
    },
    tur: {
      refHe: 'טור אורח חיים סימן תקע״ה',
      refKa: 'ტური, ორახ ხაიმი, სიმანი 575',
      textHe: 'מַפְתֵּחַ שֶׁל גְּשָׁמִים הוּא בְּיַד הַקָּדוֹשׁ בָּרוּךְ הוּא לְבַדּוֹ וְשָׁקוּל כִּתְחִיַּת הַמֵּתִים.',
      textKa: 'წვიმის გასაღები მხოლოდ წმინდა გამჩენის ხელთაა და იგი მკვდრეთით აღდგომის ტოლფასია.',
    },
    shulchanAruch: {
      refHe: 'שולחן ערוך אורח חיים סימן תקע״ה סעיף א׳',
      refKa: 'შულხან არუხი, ორახ ხაიმი, სიმანი 575, სეიფი 1',
      textHe: 'עַל עֲצִירַת גְּשָׁמִים גּוֹזְרִין תַּעֲנִיּוֹת וּמַרְבִּין בִּתְפִלָּה וּבִתְשׁוּבָה לִפְנֵי ה׳.',
      textKa: 'წვიმის დაგვიანებისას ინიშნება მარხვა და ძლიერდება ლოცვა და თეშუვა უფლის წინაშე.',
      psakSummaryKa: 'რადგან წვიმის, მშობიარობისა და მკვდრეთით აღდგომის გასაღები უშუალოდ უფლის ხელთაა, ლოცვა მიმართულია პირდაპირ გამჩენისადმი.',
    },
  },
];

export const PARALLEL_SUGYOT_COMPARISONS: ParallelSugyaComparison[] = [
  {
    id: 'parallel-taanit-berakhot',
    sourceTractateId: 'Taanit',
    sourceDafId: '2a',
    sourceTitleKa: 'თაანით 2a (תענית ב׳ ע״א)',
    sourceTitleHe: 'תענית דף ב׳ ע״א',
    parallelTractateId: 'Berakhot',
    parallelDafId: '2a',
    parallelTitleKa: 'ბერახოთ 2a (ברכות ב׳ ע״א)',
    parallelTitleHe: 'ברכות דף ב׳ ע״א',
    connectionTypeKa: 'מסורת הש״ס • „მეემათაი“ (מֵאֵימָתַי) — მიშნის გახსნის სტრუქტურა და ტრაქტატთა კავშირი',
    sourceSnippetHe: 'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי? תַּנָּא הָתָם קָאֵי.',
    sourceSnippetKa: '„როდიდან იხსენიებენ წვიმის ძალებს?“ — სად იდგა თანაი, რომ პირდაპირ კითხვით „როდიდან“ დაიწყო? თანაი ეყრდნობა ტრაქტატ როშ ჰაშანასა და ბერახოთს.',
    parallelSnippetHe: 'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִים לֶאֱכֹל בִּתְרוּמָתָן. תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי?',
    parallelSnippetKa: '„როდიდან კითხულობენ შმას საღამოს?“ — იმ საათიდან, როცა ქოჰენები შედიან თერუმის საჭმელად. სად იდგა თანაი, რომ კითხვით „როდიდან“ დაიწყო?',
    keyDifferencesKa: [
      'ბერახოთ 2a-ში გემარა ხსნის, რომ თანაი ეყრდნობა წმინდა წერილს (თორის მცნებას „ბეშოხბეხა უვკუმეხა“), ხოლო თაანით 2a-ში თანაი ეყრდნობა როშ ჰაშანას მიშნას (სუქოთზე წყლის განკითხვას).',
      'ორივე ტრაქტატში გემარა იყენებს იდენტურ არამეულ ფორმულას: „თანა ჰეიხა კაეი დეკათანი მეემათაი“ (תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי).',
    ],
    highlightedWordsHe: ['מֵאֵימָתַי', 'תַּנָּא', 'הֵיכָא', 'קָאֵי', 'דְּקָתָנֵי'],
  },
  {
    id: 'parallel-taanit-rosh-hashanah',
    sourceTractateId: 'Taanit',
    sourceDafId: '2a',
    sourceTitleKa: 'თაანით 2a (תענית ב׳ ע״א)',
    sourceTitleHe: 'תענית דף ב׳ ע״א',
    parallelTractateId: 'Rosh_Hashanah',
    parallelDafId: '16a',
    parallelTitleKa: 'როშ ჰაშანა 16a (ראש השנה ט״ז ע״א)',
    parallelTitleHe: 'ראש השנה דף ט״ז ע״א',
    connectionTypeKa: 'מסורת הש״ס • სუქოთის დღესასწაულზე წყლის განკითხვა და წყლის საღვრელი (ניסוך המים)',
    sourceSnippetHe: 'וּבֶחָג נִדּוֹנִין עַל הַמַּיִם, וְכֵיוָן דְּתָנָא בֶּחָג נִדּוֹנִין עַל הַמַּיִם — תָּנָא מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים.',
    sourceSnippetKa: '„და სუქოთის დღესასწაულზე განიკითხებიან წყალზე“ — და რადგან იქ ასწავლა წყალზე განკითხვა, აქ ასწავლა როდიდან ვიხსენიებთ წვიმის ძალებს.',
    parallelSnippetHe: 'בְּאַרְבָּעָה פְּרָקִים הָעוֹלָם נִדּוֹן: בַּפֶּסַח עַל הַתְּבוּאָה, בַּעֲצֶרֶת עַל פֵּרוֹת הָאִילָן, וּבֶחָג נִדּוֹנִין עַל הַמַּיִם. מִפְּנֵי מָה אָמְרָה תּוֹרָה נַסְּכוּ לְפָנַי מַיִם בֶּחָג?',
    parallelSnippetKa: '„წელიწადის ოთხ დროს განიკითხება სამყარო: ფესახზე მოსავალზე, შავუოთზე ხის ნაყოფზე, ხოლო სუქოთზე განიკითხებიან წყალზე. რატომ თქვა თორამ: დაღვარეთ ჩემს წინაშე წყალი სუქოთზე?“',
    keyDifferencesKa: [
      'როშ ჰაშანა 16a ადგენს კოსმიური განკითხვის თარიღს (სუქოთი) და წყლის საღვრელის (ניסוך המים) საიდუმლოს.',
      'თაანით 2a ამ განკითხვას გარდაქმნის ყოველდღიური ლოცვის (შმონე ესრეს) პრაქტიკულ კანონად.',
    ],
    highlightedWordsHe: ['וּבֶחָג', 'נִדּוֹנִין', 'עַל', 'הַמַּיִם'],
  },
  {
    id: 'parallel-taanit-megillah',
    sourceTractateId: 'Taanit',
    sourceDafId: '2a',
    sourceTitleKa: 'თაანით 2a (תענית ב׳ ע״א)',
    sourceTitleHe: 'תענית דף ב׳ ע״א',
    parallelTractateId: 'Megillah',
    parallelDafId: '18a',
    parallelTitleKa: 'მეგილა 18a (מגילה י״ח ע״א)',
    parallelTitleHe: 'מגילה דף י״ח ע״א',
    connectionTypeKa: 'מסורת הש״ס • შმონე ესრეს კურთხევათა წესრიგი და „გევუროთ“ (גבורות)',
    sourceSnippetHe: 'תָּנֵי תַּנָּא קַמֵּיהּ דְּרַב נַחְמָן: מַזְכִּיר בִּתְחִיַּת הַמֵּתִים וְשׁוֹאֵל בְּבִרְכַּת הַשָּׁנִים.',
    sourceSnippetKa: 'ასწავლა თანაიმ რავ ნახმანის წინაშე: იხსენიებს მკვდრეთით აღდგომის კურთხევაში და ითხოვს წელიწადის კურთხევაში.',
    parallelSnippetHe: 'וּמִנַּיִן שֶׁאוֹמְרִים גְּבוּרוֹת בַּשְּׁנִיָּה? וְכֵיוָן דְּתַּחִיַּת הַמֵּתִים גְּבוּרָה הִיא — תִּקְּנוּ בָּהּ גְּבוּרוֹת גְּשָׁמִים.',
    parallelSnippetKa: '„და საიდან ვიცით, რომ ძლიერებას (გევუროთ) ვამბობთ მეორე კურთხევაში? და რადგან მკვდრეთით აღდგომა უფლის ძლიერებაა, მასშივე დააწესეს წვიმის ძლიერების მოხსენიება.“',
    keyDifferencesKa: [
      'მეგილა 18a აანალიზებს 18 კურთხევის თანმიმდევრობის ბიბლიურ საფუძვლებს, ხოლო თაანით 2a ადარებს წვიმას და მკვდრეთით აღდგომას („შაკულა იერიდათ გეშამიმ ქეთხიათ ჰამეთიმ“).',
    ],
    highlightedWordsHe: ['גְּבוּרוֹת', 'בִּתְחִיַּת', 'הַמֵּתִים', 'בְּבִרְכַּת', 'הַשָּׁנִים'],
  },
];

export const TALMUDIC_REALIA_ITEMS: TalmudicRealiaItem[] = [
  {
    id: 'realia-four-species',
    category: 'flora',
    categoryLabelKa: 'დღესასწაულის მცენარეები და ტაძრის რიტუალი',
    nameHe: 'אַרְבַּעַת הַמִּינִים וְנִיסּוּךְ הַמַּיִם',
    nameKa: 'ოთხი სახეობა (ლულავი, ეთროგი, ჰადასი, არავა) და წყლის საღვრელი',
    translitKa: 'არბაათ ჰამინიმ ვენისუხ ჰამაიმ',
    modernChazonIsh: 'ლულავის სიგრძე: მინ. 4 ტეფახი (~38.4 სმ)',
    modernChaimNaeh: 'ლულავის სიგრძე: მინ. 4 ტეფახი (~32 სმ)',
    biblicalOrRabbinic: 'თორის მცნება (דאורייתא) და სინაის ტრადიცია (הלכה למשה מסיני)',
    descriptionKa:
      'რაბი ელიეზერის მიხედვით (თაანით 2a), სუქოთის ოთხი სახეობა სიმბოლურად უკავშირდება წყალს: ლულავი (პალმა) იზრდება წყლიან ხეობებში, ჰადასი (მირტი) და არავა (ტირიფი) წყლის პირას, ხოლო ეთროგი საჭიროებს უხვ მორწყვას.',
    talmudContextKa: 'თაანით 2a–2b: ოთხი სახეობა მოიპოვებს გამჩენის კეთილგანწყობას წვიმისათვის.',
    dafRef: 'Taanit 2a',
    svgType: 'four-species',
    baseMetricValue: 32,
    baseChazonIshValue: 38.4,
    metricUnit: 'სმ (4 ტეფახი)',
  },
  {
    id: 'realia-amah-cubit',
    category: 'length',
    categoryLabelKa: 'სიგრძის საზომი ერთეულები',
    nameHe: 'אַמָּה וְטֶפַח',
    nameKa: 'ამა (წყრთა) და ტეფახი (ხელისგულის სიგანე)',
    translitKa: 'ამა ვე-ტეფახ',
    modernChazonIsh: '1 ამა = 57.6 სმ (1 ტეფახი = 9.6 სმ)',
    modernChaimNaeh: '1 ამა = 48.0 სმ (1 ტეფახი = 8.0 სმ)',
    biblicalOrRabbinic: 'თორისა და რაბინული საზომი სტანდარტი (6 ტეფახი = 1 ამა)',
    descriptionKa:
      'თალმუდის ძირითადი არქიტექტურული და ჰალახური საზომი: გამოიყენება სუქის სიმაღლის (მინ. 10 ტეფახი, მაქს. 20 ამა), შაბათის საზღვრის (2000 ამა) და მიკვეს მოცულობის (1x1x3 ამა) გამოსათვლელად.',
    talmudContextKa: 'შასის ყველა ტრაქტატი: 1 ამა = 6 ტეფახი = 24 ეცბა (თითის სიგანე).',
    dafRef: 'Eruvin 4a / Sukkah 2a',
    svgType: 'amah-cubit',
    baseMetricValue: 48,
    baseChazonIshValue: 57.6,
    metricUnit: 'სმ',
  },
  {
    id: 'realia-reviit-kazayit',
    category: 'volume',
    categoryLabelKa: 'მოცულობისა და საკვების საზომები',
    nameHe: 'רְבִיעִית, כַּזַּיִת וּסְאָה',
    nameKa: 'რევიითი, ქაზაითი და სეა (მოცულობის საზომები)',
    translitKa: 'რევიით, ქაზაით, სეა',
    modernChazonIsh: 'რევიითი = 150 მლ • ქაზაითი = 33–45 გ • სეა = 14.4 ლ',
    modernChaimNaeh: 'რევიითი = 86 მლ • ქაზაითი = 27 გ • სეა = 8.3 ლ',
    biblicalOrRabbinic: 'ჰალახური მოცულობის ერთეული (1.5 კვერცხის მოცულობა = 1 რევიითი)',
    descriptionKa:
      'გამოიყენება კიდუშის სასმისის, მაცის ჭამის, მარორისა და წვიმის ნალექის სიღრმის (თაანითში: რამდენი წვიმა უნდა მოვიდეს, რომ მარხვა შეწყდეს — „მელო კელი“) გასაზომად.',
    talmudContextKa: 'თაანით 6a / ბერახოთ 41a: 1 სეა = 6 კაბი = 24 ლოგი = 96 რევიითი.',
    dafRef: 'Taanit 6a',
    svgType: 'volume-cup',
    baseMetricValue: 86,
    baseChazonIshValue: 150,
    metricUnit: 'მლ (რევიითი)',
  },
  {
    id: 'realia-sela-zuz',
    category: 'coins',
    categoryLabelKa: 'თალმუდური მონეტები და ვერცხლის წონა',
    nameHe: 'סֶלַע, דִּינָר (זוּז) וּפְרוּטָה',
    nameKa: 'სელა, დინარი (ზუზი) და პრუტა',
    translitKa: 'სელა, დინარ (ზუზ), პრუტა',
    modernChazonIsh: '1 სელა = 19.2 გ სუფთა ვერცხლი • 1 ზუზი = 4.8 გ ვერცხლი',
    modernChaimNaeh: '1 სელა = 19.2 გ ვერცხლი • 1 პრუტა = 0.025 გ ვერცხლი',
    biblicalOrRabbinic: '1 სელა (ტეტრადრაქმა) = 4 დინარი (ზუზი) = 24 მაა = 768 პრუტა',
    descriptionKa:
      'ძველი იუდეისა და ბაბილონის ფულადი სისტემა: ქეთუბის საბაზისო თანხა (200 ზუზი), პირმშოს გამოსყიდვა — ფიდიონ ჰაბენი (5 სელა = ~96 გრამი სუფთა ვერცხლი) და მინიმალური ქონებრივი ღირებულება (შავე პრუტა).',
    talmudContextKa: 'ბავა მეცია / ქეთუბოთ 10b / ბექოროთ 50a.',
    dafRef: 'Bava Metzia 44a',
    svgType: 'silver-coin',
    baseMetricValue: 4.8,
    baseChazonIshValue: 4.8,
    metricUnit: 'გრამი ვერცხლი (ზუზი)',
  },
  {
    id: 'realia-mizbeach-nisuch',
    category: 'vessels',
    categoryLabelKa: 'ტაძრის სამსხვერპლო და წყლის საღვრელი',
    nameHe: 'מִזְבַּח הָעוֹלָה וְסִפְלֵי הַכֶּסֶף (נִיסּוּךְ הַמַּיִם)',
    nameKa: 'ტაძრის სამსხვერპლო და ვერცხლის თასები (ნისუხ ჰამაიმ)',
    translitKa: 'მიზბახ ჰაოლა ვესიფლეი ჰაქესეფ',
    modernChazonIsh: 'სამსხვერპლოს სიგანე: 32x32 ამა (~18.4 მ), სიმაღლე: 10 ამა (~5.8 მ)',
    modernChaimNaeh: 'სამსხვერპლოს სიგანე: 32x32 ამა (~15.3 მ), სიმაღლე: 10 ამა (~4.8 მ)',
    biblicalOrRabbinic: 'სამსხვერპლოს სამხრეთ-დასავლეთ რქაზე მოთავსებული 2 ვერცხლის თასი',
    descriptionKa:
      'სუქოთის 7 დღის განმავლობაში შილოახის წყაროდან ოქროს დოქით (3 ლოგი მოცულობის) მოჰქონდათ წყალი და ღვინოსთან ერთად ასხამდნენ სამსხვერპლოს ვერცხლის თასებში, რათა წელიწადი წვიმით კურთხეული ყოფილიყო.',
    talmudContextKa: 'თაანით 2a–2b / სუქა 48a–49a.',
    dafRef: 'Taanit 2b',
    svgType: 'menorah-vessel',
    baseMetricValue: 1035,
    baseChazonIshValue: 1800,
    metricUnit: 'მლ (3 ლოგი ოქროს დოქი)',
  },
];

export const INITIAL_FLASHCARDS: TalmudFlashcard[] = [
  {
    id: 'fc-1',
    termHe: 'מֵאֵימָתַי',
    translitKa: 'მეემათაი',
    meaningKa: 'როდიდან? რა დროიდან?',
    category: 'aramaic',
    exampleHe: 'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים',
    exampleKa: 'როდიდან იხსენიებენ წვიმის ძალებს?',
    boxLevel: 1,
  },
  {
    id: 'fc-2',
    termHe: 'תַּנָּא הֵיכָא קָאֵי',
    translitKa: 'თანა ჰეიხა კაეი',
    meaningKa: 'სად დგას (რას ეყრდნობა) თანაი?',
    category: 'logic',
    exampleHe: 'תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי',
    exampleKa: 'სად იდგა თანაი, რომ პირდაპირ „როდიდან“ ასწავლა?',
    boxLevel: 1,
  },
  {
    id: 'fc-3',
    termHe: 'ת״ר',
    expandedHe: 'תָּנוּ רַבָּנָן',
    translitKa: 'თანუ რაბანან (თ"რ)',
    meaningKa: 'ასწავლეს ჩვენმა ბრძენებმა (ბრაითის შესავალი)',
    category: 'abbreviation',
    exampleHe: 'ת״ר מֵאֵימָתַי שׁוֹאֲלִין אֶת הַגְּשָׁמִים',
    exampleKa: 'ასწავლეს ბრძენებმა: როდიდან ითხოვენ წვიმას?',
    boxLevel: 1,
  },
  {
    id: 'fc-4',
    termHe: 'קמ״ל',
    expandedHe: 'קָא מַשְׁמַע לַן',
    translitKa: 'კა მაშმა ლან (კმ"ლ)',
    meaningKa: 'ამით გვასწავლის / გვაუწყებს ახალ ჰალახურ აზრს',
    category: 'abbreviation',
    exampleHe: 'הָא קמ״ל דְּתַחִיַּת הַמֵּתִים שְׁקוּלָה כִּגְשָׁמִים',
    exampleKa: 'ამით გვასწავლის, რომ მკვდრეთით აღდგომა წვიმის ტოლფასია.',
    boxLevel: 1,
  },
  {
    id: 'fc-5',
    termHe: 'ס״ד / ה״א',
    expandedHe: 'סָלְקָא דַּעְתָּךְ / הֲוָה אָמֵינָא',
    translitKa: 'სალკა დაათახ / ჰავა ამინა',
    meaningKa: 'შეიძლება გეფიქრა / ვიტყოდით (საწყისი ვარაუდი უარყოფამდე)',
    category: 'abbreviation',
    exampleHe: 'ס״ד אָמֵינָא הַזְכָּרָה וּשְׁאֵלָה חֲדָא מִילְּתָא הִיא',
    exampleKa: 'შეიძლება გეფიქრა, რომ მოხსენიება და თხოვნა ერთი და იგივეა.',
    boxLevel: 1,
  },
  {
    id: 'fc-6',
    termHe: 'איבעיא להו',
    translitKa: 'იბაია ლეჰუ',
    meaningKa: 'დაებადათ კითხვა / დაისვა სასწავლო დილემა ბეთ-მიდრაშში',
    category: 'logic',
    exampleHe: 'אִיבַּעְיָא לְהוּ: מַאי טַעְמָא דְּרַבִּי אֱלִיעֶזֶר?',
    exampleKa: 'დაისვა კითხვა: რა არის რაბი ელიეზერის არგუმენტის საფუძველი?',
    boxLevel: 1,
  },
  {
    id: 'fc-7',
    termHe: 'מנ״מ',
    expandedHe: 'מְנָא הָנֵי מִילֵּי',
    translitKa: 'მენა ჰანეი მილეი (მნ"მ)',
    meaningKa: 'საიდან ვიცით ეს სიტყვები? (რა არის ბიბლიური წყარო?)',
    category: 'abbreviation',
    exampleHe: 'מנ״מ דְּבֶחָג נִדּוֹנִין עַל הַמַּיִם?',
    exampleKa: 'საიდან ვიცით თორიდან, რომ სუქოთზე წყალზე განიკითხებიან?',
    boxLevel: 1,
  },
  {
    id: 'fc-8',
    termHe: 'תֵּיקוּ',
    expandedHe: 'תִּיקוּם (תִּשְׁבִּי יְתָרֵץ קֻשְׁיוֹת וּבָעָיוֹת)',
    translitKa: 'თეიკუ',
    meaningKa: 'დარჩეს გადაუჭრელად (ელიაჰუ წინასწარმეტყველი გადაჭრის კითხვებს)',
    category: 'logic',
    exampleHe: 'בָּעֲיָא הָא וְעָלְתָה בְּתֵיקוּ',
    exampleKa: 'ეს კითხვა დაისვა და დარჩა „თეიკუ“-დ (გადაუჭრელად).',
    boxLevel: 1,
  },
];

export const SOCRATIC_CHAVRUTA_QUESTIONS: SocraticChallengeQuestion[] = [
  {
    id: 'soc-1',
    stageBadgeHe: 'קושיא בגמרא',
    stageBadgeKa: 'გემარის პირველი კითხვა',
    questionKa:
      'რატომ სვამს გემარა კითხვას: „თანა ჰეიხა კაეი დეკათანი მეემათაი“ (სად იდგა თანაი, რომ პირდაპირ კითხვით „როდიდან“ დაიწყო)?',
    gemaraContextHe: 'תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי?',
    hintKa: 'დააკვირდით: მიშნას ჯერ არ უთქვამს თვითონ ვალდებულება („უნდა მოვიხსენიოთ წვიმა“), არამედ პირდაპირ კითხულობს „როდიდან?“',
    options: [
      {
        id: 'a',
        textKa: 'რადგან მიშნამ პირდაპირ დრო იკითხა („როდიდან“) ისე, რომ ჯერ თავად წვიმის მოხსენიების ვალდებულება არ დაუდგენია — ამიტომ ეყრდნობა წინა ტრაქტატს (როშ ჰაშანას, სადაც სუქოთზე წყლის განკითხვა ისწავლება).',
        isCorrect: true,
      },
      {
        id: 'b',
        textKa: 'რადგან თანაის დაავიწყდა პირველი თავის ჩაწერა.',
        isCorrect: false,
      },
      {
        id: 'c',
        textKa: 'რადგან წვიმის მოხსენიება მხოლოდ ზაფხულში ხდება.',
        isCorrect: false,
      },
    ],
    rashiTosafotAnalysisKa:
      'რაში ხსნის: თანაი ეყრდნობა ტრაქტატ როშ ჰაშანას („და სუქოთზე განიკითხებიან წყალზე“). თოსაფოთი კი ამატებს, რომ ის ასევე ეყრდნობა ტრაქტატ ბერახოთს, სადაც უკვე ნახსენები იყო წვიმის ძალები მეორე კურთხევაში.',
  },
  {
    id: 'soc-2',
    stageBadgeHe: 'מחלוקת תנאים',
    stageBadgeKa: 'თანაიმთა კამათი მიშნაში',
    questionKa:
      'რა არის მთავარი მიზეზი, რის გამოც რაბი იეჰოშუა ამბობს, რომ წვიმას სუქოთის პირველ დღეს კი არა, მხოლოდ ბოლო დღეს (შმინი აცერეთს) ვიხსენიებთ?',
    gemaraContextHe: 'רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג. אָמַר לוֹ רַבִּי יְהוֹשֻׁעַ: הוֹאִיל וְאֵין הַגְּשָׁמִים אֶלָּא סִימַן קְלָלָה בֶּחָג — לָמָּה מַזְכִּיר?',
    hintKa: 'სუქოთის 7 დღის განმავლობაში მცნებაა სუქაში (კარავში) ჯდომა. რა მოხდება, თუ ამ დროს ძლიერი წვიმა წამოვა?',
    options: [
      {
        id: 'a',
        textKa: 'რადგან სუქოთის დღეებში წვიმა ხელს უშლის სუქაში ჯდომის მცნებას და ითვლება არასასურველ ნიშნად („სიმან კლალა“).',
        isCorrect: true,
      },
      {
        id: 'b',
        textKa: 'რადგან ისრაელში სუქოთის დროს წყალი საერთოდ არ სჭირდებათ.',
        isCorrect: false,
      },
      {
        id: 'c',
        textKa: 'რადგან შმონე ესრე სუქოთის პირველ დღეს არ იკითხება.',
        isCorrect: false,
      },
    ],
    rashiTosafotAnalysisKa:
      'რაში განმარტავს: როგორც მონა, რომელიც ბატონს ჭიქას უვსებს და ბატონი სახეში შეასხამს წყალს („არ მინდა შენი მსახურება“) — ასევე წვიმა სუქოთზე გვაიძულებს დავტოვოთ სუქა.',
  },
  {
    id: 'soc-3',
    stageBadgeHe: 'הבחנה הלכתית',
    stageBadgeKa: 'მოხსენიება vs თხოვნა',
    questionKa:
      'როგორ უპასუხა რაბი ელიეზერმა რაბი იეჰოშუას კითხვას და რა განსხვავებაა „მაშივ ჰარუახ“-სა და „ვეთენ ტალ უმატარ“-ს შორის?',
    gemaraContextHe: 'אָמַר לוֹ רַבִּי אֱלִיעֶזֶר: אַף אֲנִי לֹא אָמַרְתִּי לִשְׁאֹל, אֶלָּא לְהַזְכִּיר: מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם בְּעוֹנָתוֹ!',
    hintKa: 'დაუკვირდით სიტყვას „ბეონათო“ (בעונתו — თავის დროზე).',
    options: [
      {
        id: 'a',
        textKa: 'რაბი ელიეზერმა უთხრა: მე არ მითქვამს წვიმის თხოვნა („ლაშაოლ“), არამედ მხოლოდ გამჩენის ძლიერების მოხსენიება („ლეჰაზქირ“), რომ იგი აჩენს წვიმას თავის დროზე („ბეონათო“).',
        isCorrect: true,
      },
      {
        id: 'b',
        textKa: 'რაბი ელიეზერმა უარყო თავისი პირველი სიტყვები.',
        isCorrect: false,
      },
      {
        id: 'c',
        textKa: 'ორივე ფრაზა მხოლოდ ფესახზე ითქმის.',
        isCorrect: false,
      },
    ],
    rashiTosafotAnalysisKa:
      'აქედან გამომდინარეობს ფუნდამენტური ჰალახური დაყოფა: „ჰაზქარა“ (მოხსენიება — მე-2 კურთხევაში) და „შეელა“ (თხოვნა — მე-9 კურთხევაში).',
  },
];

// Accurate 14th Daf Yomi Cycle Calculator (Cycle 14 started Jan 5, 2020; 2,711 Dapim total)
const DAF_YOMI_SHAS_SEQUENCE: { tractateId: string; nameHe: string; nameKa: string; dapim: number }[] = [
  { tractateId: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთ', dapim: 63 },
  { tractateId: 'Shabbat', nameHe: 'שבת', nameKa: 'შაბათ', dapim: 156 },
  { tractateId: 'Eruvin', nameHe: 'עירובין', nameKa: 'ერუვინ', dapim: 104 },
  { tractateId: 'Pesachim', nameHe: 'פסחים', nameKa: 'ფესახიმ', dapim: 120 },
  { tractateId: 'Rosh_Hashanah', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა', dapim: 56 }, // includes Shekalim offset in standard cycle
  { tractateId: 'Yoma', nameHe: 'יומא', nameKa: 'იომა', dapim: 87 },
  { tractateId: 'Sukkah', nameHe: 'סוכה', nameKa: 'სუქა', dapim: 55 },
  { tractateId: 'Beitzah', nameHe: 'ביצה', nameKa: 'ბეიცა', dapim: 39 },
  { tractateId: 'Taanit', nameHe: 'תענית', nameKa: 'თაანით', dapim: 30 },
  { tractateId: 'Megillah', nameHe: 'מגילה', nameKa: 'მეგილა', dapim: 31 },
  { tractateId: 'Moed_Katan', nameHe: 'מועד קטן', nameKa: 'მოედ კატან', dapim: 28 },
  { tractateId: 'Chagigah', nameHe: 'חגיגה', nameKa: 'ხაგიგა', dapim: 26 },
  { tractateId: 'Yevamot', nameHe: 'יבמות', nameKa: 'იევამოთ', dapim: 121 },
  { tractateId: 'Ketubot', nameHe: 'כתובות', nameKa: 'ქეთუბოთ', dapim: 111 },
  { tractateId: 'Nedarim', nameHe: 'נדרים', nameKa: 'ნედარიმ', dapim: 90 },
  { tractateId: 'Nazir', nameHe: 'נזיר', nameKa: 'ნაზირ', dapim: 65 },
  { tractateId: 'Sotah', nameHe: 'סוטה', nameKa: 'სოტა', dapim: 48 },
  { tractateId: 'Gittin', nameHe: 'גיטין', nameKa: 'გიტინ', dapim: 89 },
  { tractateId: 'Kiddushin', nameHe: 'קידושין', nameKa: 'კიდუშინ', dapim: 81 },
  { tractateId: 'Bava_Kamma', nameHe: 'בבא קמא', nameKa: 'ბავא კამა', dapim: 118 },
  { tractateId: 'Bava_Metzia', nameHe: 'בבא מציעא', nameKa: 'ბავא მეცია', dapim: 118 },
  { tractateId: 'Bava_Batra', nameHe: 'בבא בתרא', nameKa: 'ბავא ბათრა', dapim: 175 },
  { tractateId: 'Sanhedrin', nameHe: 'סנהדרין', nameKa: 'სანჰედრინ', dapim: 112 },
  { tractateId: 'Makkot', nameHe: 'מכות', nameKa: 'მაქოთ', dapim: 23 },
  { tractateId: 'Shevuot', nameHe: 'שבועות', nameKa: 'შევუოთ', dapim: 48 },
  { tractateId: 'Avodah_Zarah', nameHe: 'עבודה זרה', nameKa: 'ავოდა ზარა', dapim: 75 },
  { tractateId: 'Horayot', nameHe: 'הוריות', nameKa: 'ჰორაიოთ', dapim: 13 },
  { tractateId: 'Zevachim', nameHe: 'זבחים', nameKa: 'ზევახიმ', dapim: 119 },
  { tractateId: 'Menachot', nameHe: 'מנחות', nameKa: 'მენახოთ', dapim: 109 },
  { tractateId: 'Chullin', nameHe: 'חולין', nameKa: 'ხულინ', dapim: 141 },
  { tractateId: 'Bekhorot', nameHe: 'בכורות', nameKa: 'ბექოროთ', dapim: 60 },
  { tractateId: 'Arakhin', nameHe: 'ערכין', nameKa: 'არახინ', dapim: 33 },
  { tractateId: 'Temurah', nameHe: 'תמורה', nameKa: 'თემურა', dapim: 33 },
  { tractateId: 'Keritot', nameHe: 'כריתות', nameKa: 'ქერითოთ', dapim: 27 },
  { tractateId: 'Meilah', nameHe: 'מעילה', nameKa: 'მეილა', dapim: 36 },
  { tractateId: 'Niddah', nameHe: 'נדה', nameKa: 'ნიდა', dapim: 72 },
];

export interface DafYomiDayItem {
  dateStr: string;
  dayOffset: number;
  tractateId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  dafNumber: number;
  dafId: string;
}

export function getDafYomiSchedule(daysRange = 7, startOffset = -1): DafYomiDayItem[] {
  const cycleStart = Date.UTC(2020, 0, 5); // Jan 5, 2020
  const totalDapim = DAF_YOMI_SHAS_SEQUENCE.reduce((acc, t) => acc + t.dapim, 0);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 86400000;

  const result: DafYomiDayItem[] = [];
  for (let i = 0; i < daysRange; i++) {
    const offset = startOffset + i;
    const targetUtc = todayUtc + offset * msPerDay;
    const daysSinceStart = Math.floor((targetUtc - cycleStart) / msPerDay);
    let idx = ((daysSinceStart % totalDapim) + totalDapim) % totalDapim;

    let chosenTractate = DAF_YOMI_SHAS_SEQUENCE[0];
    let dafNum = 2;
    for (const tr of DAF_YOMI_SHAS_SEQUENCE) {
      if (idx < tr.dapim) {
        chosenTractate = tr;
        dafNum = idx + 2;
        break;
      }
      idx -= tr.dapim;
    }

    // Clamp dafNum for Rosh_Hashanah (which includes 22 Shekalim dapim in the 2711 cycle count)
    if (chosenTractate.tractateId === 'Rosh_Hashanah' && dafNum > 35) {
      dafNum = ((dafNum - 2) % 34) + 2;
    }

    const dt = new Date(targetUtc);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    result.push({
      dateStr,
      dayOffset: offset,
      tractateId: chosenTractate.tractateId,
      tractateNameHe: chosenTractate.nameHe,
      tractateNameKa: chosenTractate.nameKa,
      dafNumber: dafNum,
      dafId: `${dafNum}a`,
    });
  }
  return result;
}

export interface SageNetworkNode {
  id: string;
  nameHe: string;
  nameKa: string;
  titleKa: string;
  eraCategory: 'tannaim' | 'amoraim' | 'rishonim';
  generationLabelKa: string;
  academyHe: string;
  academyKa: string;
  regionKa: string;
  teachersKa: string[];
  disciplesKa: string[];
  barPlugtaKa: string; // Primary debate partner (בר פלוגתא)
  famousMaximHe: string;
  famousMaximKa: string;
  roleOnCurrentDafKa: string;
}

export const SAGE_DYNASTY_NODES: SageNetworkNode[] = [
  {
    id: 'sage-yochanan-ben-zakkai',
    nameHe: 'רַבָּן יוֹחָנָן בֶּן זַכַּאי',
    nameKa: 'რაბან იოხანან ბენ ზაქაი (რიბაზი)',
    titleKa: 'იავნეს სულიერი ცენტრის დამაარსებელი',
    eraCategory: 'tannaim',
    generationLabelKa: 'თანაიმთა I თაობა (ახ. წ. I ს.)',
    academyHe: 'יְרוּשָׁלַיִם / יַבְנֶה',
    academyKa: 'იერუსალიმი → იავნე',
    regionKa: 'ერეც ისრაელი',
    teachersKa: ['ჰილელ ჰაზაკენი', 'შამაი ჰაზაკენი'],
    disciplesKa: [
      'რაბი ელიეზერ ბენ ჰურკანოსი',
      'რაბი იეჰოშუა ბენ ხანანია',
      'რაბი აკივა (შემდგომი ხაზი)',
    ],
    barPlugtaKa: 'სადუკეველნი და ბაითოსიანნი',
    famousMaximHe: 'אִם לָמַדְתָּ תּוֹרָה הַרְבֵּה, אַל תַּחֲזִיק טוֹבָה לְעַצְמְךָ כִּי לְכָךְ נוֹצָרְתָּ',
    famousMaximKa: '„თუ ბევრი თორა ისწავლე, ნუ მიიწერ ამას საკუთარ დამსახურებად, რადგან სწორედ ამისთვის ხარ შექმნილი.“',
    roleOnCurrentDafKa: 'რ. ელიეზერისა და რ. იეჰოშუას საერთო მასწავლებელი, რომელმაც გადაარჩინა ზეპირი თორა.',
  },
  {
    id: 'sage-eliezer',
    nameHe: 'רַבִּי אֱלִיעֶזֶר בֶּן הוּרְקָנוֹס',
    nameKa: 'რაბი ელიეზერ ბენ ჰურკანოსი („რაბი ელიეზერ ჰაგადოლი“)',
    titleKa: '„ბორ სუდ შეეინო მეაბედ ტიფა“ (შელესილი ჭა, რომელიც წვეთს არ კარგავს)',
    eraCategory: 'tannaim',
    generationLabelKa: 'თანაიმთა II თაობა (ახ. წ. 80–120)',
    academyHe: 'יַבְנֶה / לוֹד',
    academyKa: 'იავნესა და ლოდის ბეთ-მიდრაში',
    regionKa: 'ერეც ისრაელი',
    teachersKa: ['რაბან იოხანან ბენ ზაქაი'],
    disciplesKa: ['რაბი აკივა'],
    barPlugtaKa: 'რაბი იეჰოშუა ბენ ხანანია (მუდმივი ჰალახური ოპონენტი)',
    famousMaximHe: 'יְהִי כְבוֹד חֲבֵרְךָ חָבִיב עָלֶיךָ כְּשֶׁלָּךְ',
    famousMaximKa: '„იყოს შენი მეგობრის პატივი შენთვის ისევე ძვირფასი, როგორც საკუთარი.“',
    roleOnCurrentDafKa: 'თაანით 2a-ის მიშნის პირველი ავტორი: ადგენს წვიმის ძალების მოხსენიებას სუქოთის პირველი დღიდან ლულავის 4 სახეობის საფუძველზე.',
  },
  {
    id: 'sage-yehoshua',
    nameHe: 'רַבִּי יְהוֹשֻׁעַ בֶּן חֲנַנְיָה',
    nameKa: 'რაბი იეჰოშუა ბენ ხანანია',
    titleKa: 'იავნეს სანჰედრინის ავ-ბეთ-დინი და ტაძრის ლევიანი მგალობელი',
    eraCategory: 'tannaim',
    generationLabelKa: 'თანაიმთა II თაობა (ახ. წ. 80–120)',
    academyHe: 'יַבְנֶה / פְּקִיעִין',
    academyKa: 'იავნე / ფკიინი',
    regionKa: 'ერეც ისრაელი',
    teachersKa: ['რაბან იოხანან ბენ ზაქაი'],
    disciplesKa: ['რაბი აკივა', 'რაბი იშმაელი'],
    barPlugtaKa: 'რაბი ელიეზერ ბენ ჰურკანოსი',
    famousMaximHe: 'לֹא בַשָּׁמַיִם הִיא',
    famousMaximKa: '„ის (თორა) ცაში აღარ არის!“ — ჰალახა დგინდება ბრძენთა უმრავლესობით.',
    roleOnCurrentDafKa: 'თაანით 2a-ში ადგენს საბოლოო ჰალახას: წვიმის ხსენება იწყება მხოლოდ შმინი აცერეთს, რადგან სუქოთზე წვიმა სუქაში ჯდომას ხელს უშლის.',
  },
  {
    id: 'sage-akiva',
    nameHe: 'רַבִּי עֲקִיבָא בֶּן יוֹסֵף',
    nameKa: 'რაბი აკივა ბენ იოსეფი',
    titleKa: 'ზეპირი თორის სისტემატიზატორი (მიშნის საფუძველი)',
    eraCategory: 'tannaim',
    generationLabelKa: 'თანაიმთა III თაობა (ახ. წ. 110–135)',
    academyHe: 'בְּנֵי בְּרַק',
    academyKa: 'ბნეი ბრაკის დიდი იეშივა',
    regionKa: 'ერეც ისრაელი',
    teachersKa: ['რაბი ელიეზერი', 'რაბი იეჰოშუა', 'ნახუმ იშ გამზუ'],
    disciplesKa: ['რაბი მეირი', 'რაბი იეჰუდა ბარ ილაი', 'რაბი შიმონ ბარ იოხაი'],
    barPlugtaKa: 'რაბი იშმაელი',
    famousMaximHe: 'וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ — זֶה כְּלָל גָּדוֹל בַּתּוֹרָה',
    famousMaximKa: '„გიყვარდეს მოყვასი შენი, ვითარცა თავი შენი — ეს არის უდიდესი პრინციპი თორაში.“',
    roleOnCurrentDafKa: 'თაანით 2a–2b: განმარტავს წყლის საღვრელისა (ניסוך המים) და ოთხი სახეობის კავშირს წვიმის კურთხევასთან.',
  },
  {
    id: 'sage-yochanan-amora',
    nameHe: 'רַבִּי יוֹחָנָן בַּר נַפָּחָא',
    nameKa: 'რაბი იოხანან ბარ ნაფახა',
    titleKa: 'ტვერიის იეშივის მეთაური და იერუსალიმის თალმუდის მთავარი ავტორი',
    eraCategory: 'amoraim',
    generationLabelKa: 'ამორაიმთა II თაობა (ახ. წ. III ს.)',
    academyHe: 'טְבֶרְיָה',
    academyKa: 'ტვერიის აკადემია',
    regionKa: 'ერეც ისრაელი (გალილეა)',
    teachersKa: ['რაბი იეჰუდა ჰანასი (რაბი)', 'რაბი ჰოშაია'],
    disciplesKa: ['რაბი ამი', 'რაბი ასი', 'რაბი ელაზარ ბენ ფადათი'],
    barPlugtaKa: 'რეშ ლაკიში (რაბი შიმონ ბენ ლაკიში)',
    famousMaximHe: 'שְׁלֹשָׁה מַפְתְּחוֹת בְּיָדוֹ שֶׁל הַקָּדוֹשׁ בָּרוּךְ הוּא שֶׁלֹּא נִמְסְרוּ בְּיַד שָׁלִיחַ',
    famousMaximKa: '„სამი გასაღებია წმინდა გამჩენის ხელში, რომლებიც არ გადაცემულა არცერთ დესპანს: წვიმის, მშობიარობისა და მკვდრეთით აღდგომის.“',
    roleOnCurrentDafKa: 'თაანით 2a-ის ცნობილი აგადური და ჰალახური სწავლების ავტორი „სამი გასაღების“ შესახებ.',
  },
  {
    id: 'sage-rava-abbaye',
    nameHe: 'אַבַּיֵּי וְרָבָא',
    nameKa: 'აბაიე და რავა (הוויות דאביי ורבא)',
    titleKa: 'ბაბილონის თალმუდის დიალექტიკის ორი უდიდესი სვეტი',
    eraCategory: 'amoraim',
    generationLabelKa: 'ამორაიმთა IV თაობა (ახ. წ. IV ს.)',
    academyHe: 'פּוּמְבְּדִיתָא / מָחוֹזָא',
    academyKa: 'ფუმბედითა და მახოზა',
    regionKa: 'ბაბილონი (בבל)',
    teachersKa: ['რაბა ბარ ნახმანი', 'რავ იოსეფი', 'რავ ნახმანი'],
    disciplesKa: ['რავ ფაფა', 'რავ ჰუნა ბრეი დერავ იეჰოშუა'],
    barPlugtaKa: 'აბაიე და რავა ერთმანეთის მუდმივი ოპონენტები არიან (ჰალახა რავას მიხედვითაა, გარდა יע״ל קג״ם-ისა)',
    famousMaximHe: 'הֲוָיוֹת דְּאַבַּיֵּי וְרָבָא — דָּבָר גָּדוֹל',
    famousMaximKa: '„აბაიესა და რავას ჰალახური დებატები — დიდი საქმეა.“',
    roleOnCurrentDafKa: 'ბაბილონური შაქლა ვეტარიის (კითხვა-პასუხის) ანალიტიკური სტრუქტურის მთავარი არქიტექტორები.',
  },
  {
    id: 'sage-rashi',
    nameHe: 'רש״י (רַבִּי שְׁלֹמֹה יִצְחָקִי)',
    nameKa: 'რაში — რაბი შლომო იცხაკი',
    titleKa: '„ფარშანდათა“ — თორისა და თალმუდის უდიდესი განმმარტებელი',
    eraCategory: 'rishonim',
    generationLabelKa: 'რიშონიმი (1040–1105 წწ.)',
    academyHe: 'טְרוֹיְשׂ / ווֹרְמַיְיזָא',
    academyKa: 'ტრუა (საფრანგეთი) / ვორმსი და მაინცი',
    regionKa: 'აშქენაზი და צרפת (საფრანგეთი)',
    teachersKa: ['რაბი იაკოვ ბენ იაკარი', 'რაბი იცხაკ ჰალევი'],
    disciplesKa: ['რაბენუ თამი (შვილიშვილი)', 'რაშბამი (შვილიშვილი)', 'რაბი შმაია'],
    barPlugtaKa: 'ბაალეი ჰათოსაფოთი (რომლებიც აგრძელებენ და აკრიტიკებენ რაშის ხაზს)',
    famousMaximHe: 'לֹא בָּאתִי אֶלָּא לִפְשׁוּטוֹ שֶׁל מִקְרָא וּלְיַשֵּׁב סוּגְיַת הַשַּׁ״ס',
    famousMaximKa: 'ყოველ დაფზე მარჯვენა (შიდა) სვეტში განმარტავს გემარის თითოეულ სიტყვასა და ფარულ ლოგიკურ გადასვლას.',
    roleOnCurrentDafKa: 'ხსნის, რომ თაანითის თანაი ეყრდნობა ტრაქტატ როშ ჰაშანას („და სუქოთზე განიკითხებიან წყალზე“).',
  },
];

export interface ManuscriptVariantEntry {
  id: string;
  dafRef: string;
  sectionLabelKa: string;
  vilnaPrintedHe: string;
  manuscriptSourceHe: string;
  manuscriptSourceKa: string;
  manuscriptReadingHe: string;
  differenceAnalysisKa: string;
  halachicOrTextualImpactKa: string;
}

export const MANUSCRIPT_VARIANTS: ManuscriptVariantEntry[] = [
  {
    id: 'ms-taanit-2a-munich',
    dafRef: 'Taanit 2a',
    sectionLabelKa: 'გემარის გახსნა (תנא היכא קאי)',
    vilnaPrintedHe: 'תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי? תַּנָּא הָתָם קָאֵי דְּתְנַן...',
    manuscriptSourceHe: 'כתב יד מינכן 95 (Codex Munich 95, שנת 1342)',
    manuscriptSourceKa: 'მიუნხენის კოდექსი 95 (1342 წ. — ერთადერთი სრული შუასაუკუნეების ხელნაწერი მთელ შასზე)',
    manuscriptReadingHe: 'תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי מַזְכִּירִין? תַּנָּא אֵראשׁ הַשָּׁנָה קָאֵי...',
    differenceAnalysisKa:
      'მიუნხენის ხელნაწერში პირდაპირ გემარის ტექსტშივეა დაკონკრეტებული სიტყვები „ათანა აროშ ჰაშანა კაეი“ (თანაი როშ ჰაშანაზე დგას), მაშინ როცა ვილნის ბეჭდურ გამოცემაში წერია ზოგადად „ჰათამ კაეი“ (იქ დგას) და „როშ ჰაშანას“ მხოლოდ რაში განმარტავს.',
    halachicOrTextualImpactKa:
      'ადასტურებს რაშის კომენტარის უძველეს ტექსტოლოგიურ სიზუსტეს: რაშიმ შემოინახა უძველესი აშქენაზური და ბაბილონური გირსა (ვერსია).',
  },
  {
    id: 'ms-taanit-2a-bach',
    dafRef: 'Taanit 2a',
    sectionLabelKa: 'ჰაგაჰოთ ჰაბახი (הגהות הב״ח)',
    vilnaPrintedHe: 'רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג הוּא מַזְכִּיר',
    manuscriptSourceHe: 'הגהות הב״ח (רבי יואל סירקיש) וכתב יד וטיקן 134',
    manuscriptSourceKa: 'ბახის კრიტიკული შესწორება (הגהות הב״ח) და ვატიკანის ხელნაწერი 134',
    manuscriptReadingHe: 'מִשְּׁמִינִי עֲצֶרֶת שֶׁהוּא יוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג מַזְכִּיר בְּמוּסָף',
    differenceAnalysisKa:
      'ვატიკანის ხელნაწერი და რიშონიმთა ციტატები აზუსტებენ, რომ „სუქოთის ბოლო დღე“ გულისხმობს შმინი აცერეთის მუსაფის ლოცვას, როცა წყლის საღვრელის რიტუალი სრულდება.',
    halachicOrTextualImpactKa:
      'ეს ვარიანტი პირდაპირ აისახა შულხან არუხის კოდიფიკაციაში (ორახ ხაიმი 114:1).',
  },
  {
    id: 'ms-taanit-2a-oxford',
    dafRef: 'Taanit 2a',
    sectionLabelKa: 'სამი გასაღების აგადა (ג׳ מפתחות)',
    vilnaPrintedHe: 'שְׁלֹשָׁה מַפְתְּחוֹת בְּיָדוֹ שֶׁל הַקָּדוֹשׁ בָּרוּךְ הוּא שֶׁלֹּא נִמְסְרוּ בְּיַד שָׁלִיחַ',
    manuscriptSourceHe: 'כתב יד אוקספורד (Bodleian) ודפוס שונצינו / פזארו',
    manuscriptSourceKa: 'ოქსფორდის (ბოდლიანის) ხელნაწერი და სონჩინოს პირველი ბეჭდური გამოცემა',
    manuscriptReadingHe: 'שְׁלֹשָׁה מַפְתְּחוֹת לֹא נִמְסְרוּ לֹא לְמַלְאָךְ וְלֹא לְשָׂרָף אֶלָּא בְּיַד הַקב״ה בְּעַצְמוֹ',
    differenceAnalysisKa:
      'ოქსფორდის ხელნაწერი აძლიერებს ფორმულირებას: „არ გადაცემულა არც ანგელოზს და არც სერაფიმს, არამედ თავად წმინდა გამჩენის ხელთაა“.',
    halachicOrTextualImpactKa:
      'ხაზს უსვამს, რომ წვიმისა და საზრდოს თხოვნა ლოცვაში მიემართება უშუალოდ შემოქმედს ყოველგვარი შუამავლის გარეშე.',
  },
];

