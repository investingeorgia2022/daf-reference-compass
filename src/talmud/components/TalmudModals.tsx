// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Volume2,
  Square,
  MessageSquarePlus,
  Share2,
  Copy,
  Check,
  Download,
  FileText,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { DafPageData, TalmudSentence } from '../types/talmud';
import { SearchableSelect } from './SearchableSelect';
import { ReadingLineGuide } from './ReadingLineGuide';
import { VilnaPdfInteractiveViewer } from './VilnaPdfInteractiveViewer';
import {
  sanitizeGeorgianText,
  translateWithTorahTalmudSpecServer,
} from '../utils/georgianTranslator';

export interface FullscreenSectionData {
  id: string;
  titleHe: string;
  titleKa: string;
  sentences: TalmudSentence[];
  isRashiScript?: boolean;
}

export interface TosafotDeepLinkRef {
  id: string;
  citeHe: string;
  citeEn?: string;
  tractateId?: string;
  dafId?: string;
  targetSectionId:
    | 'daf-section-mishnah'
    | 'daf-section-gemara'
    | 'daf-section-rashi'
    | 'daf-section-masoret'
    | 'daf-section-ein-mishpat';
  targetSectionLabelKa: string;
  targetSentenceId: string;
  targetSnippetHe: string;
  dafHeaderHe?: string;
  dafStartingTextHe?: string;
  dafStartingTextKa?: string;
}

export const REFERENCED_DAF_STARTING_TEXTS: Record<
  string,
  { headerHe: string; openingWordHe?: string; startingTextHe: string; startingTextKa: string }
> = {
  'Berakhot:2a': {
    headerHe: 'מסכת ברכות דף ב ע״א',
    openingWordHe: 'מֵאֵימָתַי',
    startingTextHe:
      'מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּעַרְבִית? מִשָּׁעָה שֶׁהַכֹּהֲנִים נִכְנָסִין לֶאֱכוֹל בִּתְרוּמָתָן — תַּנָּא הֵיכָא קָאֵי דְּקָתָנֵי מֵאֵימָתַי?',
    startingTextKa:
      'როდიდან კითხულობენ შმას საღამოს? იმ საათიდან, როცა ქოჰენები შედიან თავიანთი თრუმის საჭმელად — სად დგას თანა, რომ იწყებს კითხვით „როდიდან“?',
  },
  'Berakhot:2b': {
    headerHe: 'מסכת ברכות דף ב ע״ב',
    openingWordHe: 'מָר',
    startingTextHe:
      'מָר קָרֵי לֵיהּ שְׁמַע וּמָר קָרֵי לֵיהּ תְּפִלָּה — מִשָּׁעָה שֶׁהֶעָנִי נִכְנָס לֶאֱכוֹל פִּתּוֹ בְּמֶלַח עַד שָׁעָה שֶׁעוֹמֵד מִלֶּאֱכוֹל.',
    startingTextKa:
      'ერთი ბრძენი ეყრდნობა ერთ მუხლს, მეორე კი — მეორეს: იმ საათიდან, როცა ღარიბი შედის თავისი პურის მარილით საჭმელად.',
  },
  'Berakhot:3a': {
    headerHe: 'מסכת ברכות דף ג ע״א',
    openingWordHe: 'שָׁלֹשׁ',
    startingTextHe:
      'שָׁלֹשׁ מִשְׁמָרוֹת הָוֵי הַלַּיְלָה, וְעַל כָּל מִשְׁמָר וּמִשְׁמָר יוֹשֵׁב הַקָּדוֹשׁ בָּרוּךְ הוּא וְשׁוֹאֵג כָּאֲרִי.',
    startingTextKa:
      'ღამე შედგება სამი გუშაგობისგან (მიშმარისგან), და თითოეულ გუშაგობაზე ზის წმინდა გამჩენი და გმინავს ტაძრის разрушების გამო.',
  },
  'Berakhot:26b': {
    headerHe: 'מסכת ברכות דף כו ע״ב',
    openingWordHe: 'תְּפִלּוֹת',
    startingTextHe:
      'תְּפִלַּת הַמִּנְחָה עַד הָעֶרֶב. רַבִּי יְהוּדָה אוֹמֵר: עַד פְּלַג הַמִּנְחָה. תְּפִלַּת הָעֶרֶב אֵין לָהּ קֶבַע.',
    startingTextKa:
      'მინხის ლოცვის დროა საღამომდე. რაბი იეჰუდა ამბობს: „ფლაგ ჰამინხამდე“ (მზის ჩასვლამდე 1.25 საათით ადრე), საიდანაც იწყება არვითის დრო.',
  },
  'Berakhot:33a': {
    headerHe: 'מסכת ברכות דף לג ע״א',
    openingWordHe: 'מַזְכִּירִין',
    startingTextHe:
      'מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים בִּתְחִיַּת הַמֵּתִים, וְשׁוֹאֲלִין הַגְּשָׁמִים בְּבִרְכַּת הַשָּׁנִים, וְהַבְדָּלָה בְּחוֹנֵן הַדַּעַת.',
    startingTextKa:
      'წვიმის ძლიერებას (გვუროთ გშამიმ) იხსენიებენ მკვდრეთით აღდგომის კურთხევაში, წვიმას ითხოვენ წლების კურთხევაში, ხოლო ჰავდალას — სიბრძნის მომნიჭებელში.',
  },
  'Shabbat:2a': {
    headerHe: 'מסכת שבת דף ב ע״א',
    openingWordHe: 'יְצִיאוֹת',
    startingTextHe:
      'יְצִיאוֹת הַשַּׁבָּת שְׁתַּיִם שֶׁהֵן אַרְבַּע בִּפְנִים, וּשְׁתַּיִם שֶׁהֵן אַרְבַּע בַּחוּץ. כֵּיצַד? הֶעָנִי עוֹמֵד בַּחוּץ וּבַעַל הַבַּיִת בִּפְנִים.',
    startingTextKa:
      'შაბათის გატანანი (იეციოთ ჰაშაბათ) არის ორი, რომელიც ოთხია შიგნით, და ორი, რომელიც ოთხია გარეთ. როგორ? ღარიბი დგას გარეთ და სახლის პატრონი — შიგნით.',
  },
  'Shabbat:21b': {
    headerHe: 'מסכת שבת דף כא ע״ב',
    openingWordHe: 'מַאי',
    startingTextHe:
      'מַאי חֲנוּכָּה? דְּתָנוּ רַבָּנַן: בְּכ״ה בְּכִסְלֵו יוֹמֵי דַחֲנוּכָּה תְּמָנְיָא אִינּוּן דְּלָא לְמִסְפַּד בְּהוֹן וּדְלָא לְהִתְעַנּוֹת בְּהוֹן.',
    startingTextKa:
      'რა არის ხანუქა? ასწავლეს ჩვენმა ბრძენებმა: ქისლევის 25-ში ხანუქის რვა დღეა, რომლებშიც აკრძალულია გლოვა და მარხვა.',
  },
  'Shabbat:23a': {
    headerHe: 'מסכת שבת דף כג ע״א',
    openingWordHe: 'מֵאֵימָתַי',
    startingTextHe:
      'מֵאֵימָתַי מַדְלִיקִין נֵר חֲנוּכָּה? מִשֶּׁתִּשְׁקַע הַחַמָּה עַד שֶׁתִּכְלֶה רֶגֶל מִן הַשּׁוּק — וּזְמַן קְרִיאַת שְׁמַע מִצֵּאת הַכּוֹכָבִים.',
    startingTextKa:
      'როდიდან ანთებენ ხანუქის სანთელს? მზის ჩასვლიდან ვიდრე ბაზრიდან ფეხი არ შეწყდება — ხოლო შემას კითხვის დრო ვარსკვლავების გამოსვლიდანაა.',
  },
  'Eruvin:2a': {
    headerHe: 'מסכת עירובין דף ב ע״א',
    openingWordHe: 'מָבוֹי',
    startingTextHe:
      'מָבוֹי שֶׁהוּא גָּבוֹהַּ לְמַעְלָה מֵעֶשְׂרִים אַמָּה יְמַעֵט. רַבִּי יְהוּדָה אוֹמֵר: אֵינוֹ צָרִיךְ. וְהָרָחָב מֵעֶשֶׂר אַמּוֹת יְמַעֵט.',
    startingTextKa:
      'შესახვევი (მავოი), რომელიც ოც წყრთაზე მაღალია, უნდა დადაბლდეს. რაბი იეჰუდა ამბობს: არ სჭირდება.',
  },
  'Eruvin:17b': {
    headerHe: 'מסכת עירובין דף יז ע״ב',
    openingWordHe: 'כַּמָּה',
    startingTextHe:
      'כַּמָּה הִיא מְזוֹן שְׁתֵּי סְעוּדוֹת? מָזוֹן שֶׁהוּא אוֹכֵל בְּחוֹל וְלֹא בְּשַׁבָּת — דִּבְרֵי רַבִּי מֵאִיר.',
    startingTextKa:
      'რა ოდენობისაა ორი ტრაპეზის საკვები (ერუვისთვის)? საკვები, რომელსაც კაცი ჭამს სადაგ დღეს — რაბი მეირის სიტყვებია.',
  },
  'Pesachim:2a': {
    headerHe: 'מסכת פסחים דף ב ע״א',
    openingWordHe: 'אוֹר',
    startingTextHe:
      'אוֹר לְאַרְבָּעָה עָשָׂר בּוֹדְקִין אֶת הֶחָמֵץ לְאוֹר הַנֵּר. כָּל מָקוֹם שֶׁאֵין מַכְנִיסִין בּוֹ חָמֵץ אֵין צָרִיךְ בְּדִיקָה.',
    startingTextKa:
      'თოთხმეტი ნისანის ღამეს ამოწმებენ ხამეცს სანთლის შუქზე. ყველა ადგილს, სადაც ხამეცი არ შეაქვთ, შემოწმება არ სჭირდება.',
  },
  'Pesachim:120b': {
    headerHe: 'מסכת פסחים דף קכ ע״ב',
    openingWordHe: 'הַפֶּסַח',
    startingTextHe:
      'הַפֶּסַח אַחַר חֲצוֹת מְטַמֵּא אֶת הַיָּדַיִם. הַפִּגּוּל וְהַנּוֹתָר מְטַמְּאִין אֶת הַיָּדַיִם — רָבָא אָמַר: זְמַן אֲכִילַת פֶּסַח עַד חֲצוֹת.',
    startingTextKa:
      'ფესახის მსხვერპლი შუაღამის შემდეგ აუწმინდურებს ხელებს — რავამ თქვა: ფესახის ჭამის დრო შუაღამემდეა.',
  },
  'Yoma:2a': {
    headerHe: 'מסכת יומא דף ב ע״א',
    openingWordHe: 'שִׁבְעַת',
    startingTextHe:
      'שִׁבְעַת יָמִים קוֹדֶם יוֹם הַכִּפּוּרִים מַפְרִישִׁין כֹּהֵן גָּדוֹל מִבֵּיתוֹ לְלִשְׁכַּת פַּרְהֶדְרִין, וּמַתְקִינִין לוֹ כֹּהֵן אַחֵר תַּחְתָּיו.',
    startingTextKa:
      'იომ ქიფურამდე შვიდი დღით ადრე ქოჰენ გადოლს გამოყოფენ თავისი სახლიდან პარჰედრინის პალატაში.',
  },
  'Sukkah:2a': {
    headerHe: 'מסכת סוכה דף ב ע״א',
    openingWordHe: 'סוּכָּה',
    startingTextHe:
      'סוּכָּה שֶׁהִיא גְּבוֹהָה לְמַעְלָה מֵעֶשְׂרִים אַמָּה פְּסוּלָה, וְרַבִּי יְהוּדָה מַכְשִׁיר. וְשֶׁאֵינָהּ גְּבוֹהָה עֲשָׂרָה טְפָחִים פְּסוּלָה.',
    startingTextKa:
      'სუკა, რომელიც ოც წყრთაზე (ამაზე) მაღალია, ფასულია (უვარგისია), ხოლო რაბი იეჰუდა ქაშერად მიიჩნევს.',
  },
  'Sukkah:28b': {
    headerHe: 'מסכת סוכה דף כח ע״ב',
    openingWordHe: 'ירדו',
    startingTextHe:
      'יָרְדוּ גְּשָׁמִים — מֵאֵימָתַי מוּתָּר לְפַנּוֹת? מִשֶּׁתִּסְרַח הַמִּקְפָּה. מָשְׁלוּ מָשָׁל: לְמָה הַדָּבָר דּוֹמֶה? לְעֶבֶד שֶׁבָּא לִמְזוֹג כּוֹס לְרַבּוֹ וְשָׁפַךְ לוֹ קִיתוֹן עַל פָּנָיו.',
    startingTextKa:
      'თუ წვიმა წამოვიდა, როდიდან შეიძლება სუკიდან გასვლა? იგავი: მსახურმა ბატონს ჭიქა მიართვა და ბატონმა მას დოქით წყალი სახეზე შეასხა.',
  },
  'Sukkah:42b': {
    headerHe: 'מסכת סוכה דף מב ע״ב',
    openingWordHe: 'לולב',
    startingTextHe:
      'לוּלָב וַעֲרָבָה שִׁשָּׁה וְשִׁבְעָה, הַהַלֵּל וְהַשִּׂמְחָה שְׁמוֹנָה, סוּכָּה וְנִיסּוּךְ הַמַּיִם שִׁבְעָה — מִמַּלְּאִין מַיִם מֵעֶרֶב יוֹם טוֹב לְנִיסּוּךְ הַמַּיִם.',
    startingTextKa:
      'ლულავი და არავა — ექვსი ან შვიდი დღე, ჰალელი და სიხარული — რვა დღე, სუკა და წყლის საღვრელი (ნისუხ ჰამაიმ) — შვიდი დღე.',
  },
  'Beitzah:2a': {
    headerHe: 'מסכת ביצה דף ב ע״א',
    openingWordHe: 'בֵּיצָה',
    startingTextHe:
      'בֵּיצָה שֶׁנּוֹלְדָה בְּיוֹם טוֹב — בֵּית שַׁמַּאי אוֹמְרִים: תֵּאָכֵל, וּבֵית הִלֵּל אוֹמְרִים: לֹא תֵּאָכֵל.',
    startingTextKa:
      'კვერცხი, რომელიც დაიდო იომ-ტოვზე (დღესასწაულზე) — ბეთ შამაი ამბობს: იჭმევა, ხოლო ბეთ ჰილელი ამბობს: არ იჭმევა.',
  },
  'Rosh_Hashanah:2a': {
    headerHe: 'מסכת ראש השנה דף ב ע״א',
    openingWordHe: 'אַרְבָּעָה',
    startingTextHe:
      'אַרְבָּעָה רָאשֵׁי שָׁנִים הֵם: בְּאֶחָד בְּנִיסָן רֹאשׁ הַשָּׁנָה לַמְּלָכִים וְלָרְגָלִים.',
    startingTextKa:
      'ოთხი ახალი წელია (როშ ჰაშანა): პირველ ნისანს არის ახალი წელი მეფეთათვის და დღესასწაულებისთვის.',
  },
  'Rosh_Hashanah:16a': {
    headerHe: 'מסכת ראש השנה דף טז ע״א',
    openingWordHe: 'בְּאַרְבָּעָה',
    startingTextHe:
      'בְּאַרְבָּעָה פְּרָקִים הָעוֹלָם נִידּוֹן: בַּפֶּסַח עַל הַתְּבוּאָה, בַּעֲצֶרֶת עַל פֵּירוֹת הָאִילָן, בְּרֹאשׁ הַשָּׁנָה כָּל בָּאֵי עוֹלָם עוֹבְרִין לְפָנָיו כִּבְנֵי מָרוֹן, וּבֶחָג נִידּוֹנִין עַל הַמַּיִם.',
    startingTextKa:
      'წელიწადის ოთხ დროს განისჯება სამყარო: ფესახზე — მოსავალზე, შავუოთზე — ხის ნაყოფზე, როშ ჰაშანას — ყოველი ქმნილება, ხოლო სუკოთზე — წყალზე.',
  },
  'Taanit:2a': {
    headerHe: 'מסכת תענית דף ב ע״א',
    openingWordHe: 'מֵאֵימָתַי',
    startingTextHe:
      'מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג. רַבִּי יְהוֹשֻׁעַ אוֹמֵר: מִיּוֹם טוֹב הָאַחֲרוֹן שֶׁל חָג.',
    startingTextKa:
      'როდიდან იხსენიებენ წვიმის ძლიერებას (გვუროთ გშამიმ)? რაბი ელიეზერი ამბობს: სუკოთის პირველი დღიდან. რაბი იეჰოშუა ამბობს: ბოლო დღიდან.',
  },
  'Taanit:5a': {
    headerHe: 'מסכת תענית דף ה ע״א',
    openingWordHe: 'אָמַר',
    startingTextHe:
      'אָמַר רַב נַחְמָן לֵימָא רַב שְׁמוּאֵל בַּר אִידִי... מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג.',
    startingTextKa:
      'ამარ რავ ნახმან... როდიდან იხსენიებენ წვიმის ძლიერებას (გვუროთ გშამიმ)? რაბი ელიეზერი ამბობს: სუკოთის პირველი იომ-ტოვიდან.',
  },
  'Megillah:2a': {
    headerHe: 'מסכת מגילה דף ב ע״א',
    openingWordHe: 'מְגִילָּה',
    startingTextHe:
      'מְגִילָּה נִקְרֵאת בְּאֶחָד עָשָׂר, בִּשְׁנֵים עָשָׂר, בִּשְׁלֹשָׁה עָשָׂר, בְּאַרְבָּעָה עָשָׂר, בַּחֲמִשָּׁה עָשָׂר — לֹא פָּחוֹת וְלֹא יוֹתֵר.',
    startingTextKa:
      'მეგილა იკითხება თერთმეტ, თორმეტ, ცამეტ, თოთხმეტ ან თხუთმეტ ადარს — არც ნაკლებ და არც მეტ დღეებში.',
  },
  'Chagigah:2a': {
    headerHe: 'מסכת חגיגה דף ב ע״א',
    openingWordHe: 'הַכֹּל',
    startingTextHe:
      'הַכֹּל חַיָּיבִין בִּרְאִיָּה, חוּץ מֵחֵרֵשׁ שׁוֹטֶה וְקָטָן וְטֻמְטוּם וְאַנְדְּרוֹגִינוֹס וְנָשִׁים וַעֲבָדִים שֶׁאֵינָם מְשֻׁחְרָרִים.',
    startingTextKa:
      'ყველა ვალდებულია გამოცხადდეს ტაძარში (რეია) დღესასწაულზე, გარდა სმენადაქვეითებულისა, შეურაცხადისა და მცირეწლოვანისა.',
  },
  'Yevamot:2a': {
    headerHe: 'מסכת יבמות דף ב ע״א',
    openingWordHe: 'חֲמֵשׁ',
    startingTextHe:
      'חֲמֵשׁ עֶשְׂרֵה נָשִׁים פּוֹטְרוֹת צָרוֹתֵיהֶן וְצָרוֹת צָרוֹתֵיהֶן מִן הַחֲלִיצָה וּמִן הַיִּבּוּם עַד סוֹף הָעוֹלָם.',
    startingTextKa:
      'თხუთმეტი კატეგორიის ქალი ათავისუფლებს თავის მეტოქე ცოლებს (ცაროთ) ხალიცისა და იბუმის ვალდებულებისგან.',
  },
  'Yevamot:74b': {
    headerHe: 'מסכת יבמות דף עד ע״ב',
    openingWordHe: 'הָעֶרֶב',
    startingTextHe:
      'וּבָא הַשֶּׁמֶשׁ וְטָהֵר — בִּיאַת שִׁמְשׁוֹ מְעַכַּבְתּוֹ מִלֶּאֱכוֹל בַּתְּרוּמָה, וְאֵין כַּפָּרָתוֹ מְעַכַּבְתּוֹ מִלֶּאֱכוֹל בַּתְּרוּמָה.',
    startingTextKa:
      '„და ჩავა მზე და განიწმინდება“ (ვაიკრა 22:7) — მზის ჩასვლა (ვარსკვლავების გამოსვლა) არის თერუმას ჭამის გადამწყვეტი პირობა.',
  },
  'Ketubot:2a': {
    headerHe: 'מסכת כתובות דף ב ע״א',
    openingWordHe: 'בְּתוּלָה',
    startingTextHe:
      'בְּתוּלָה נִשֵּׂאת לְיוֹם הָרְבִיעִי וְאַלְמָנָה לְיוֹם הַחֲמִישִׁי, שֶׁפַּעֲמַיִם בַּשַּׁבָּת בָּתֵּי דִינִין יוֹשְׁבִין בָּעֲיָרוֹת.',
    startingTextKa:
      'ქალწული ქორწინდება ოთხშაბათ დღეს, ხოლო ქვრივი — ხუთშაბათ დღეს, რადგან კვირაში ორჯერ იკრიბება სასამართლო.',
  },
  'Gittin:2a': {
    headerHe: 'מסכת גיטין דף ב ע״א',
    openingWordHe: 'הַמֵּבִיא',
    startingTextHe:
      'הַמֵּבִיא גֵּט מִמְּדִינַת הַיָּם צָרִיךְ שֶׁיֹּאמַר: בְּפָנַי נִכְתַּב וּבְפָנַי נֶחְתַּם.',
    startingTextKa:
      'ვინც მოაქვს გეტი (განქორწინების საბუთი) ზღვისგაღმა ქვეყნიდან, ვალდებულია თქვას: „ჩემ წინაშე დაიწერა და ჩემ წინაშე დაიბეჭდა“.',
  },
  'Kiddushin:2a': {
    headerHe: 'מסכת קידושין דף ב ע״א',
    openingWordHe: 'הָאִשָּׁה',
    startingTextHe:
      'הָאִשָּׁה נִקְנֵית בְּשָׁלֹשׁ דְּרָכִים וְקוֹנָה אֶת עַצְמָהּ בִּשְׁתֵּי דְּרָכִים: נִקְנֵית בְּכֶסֶף, בִּשְׁטָר וּבְבִיאָה.',
    startingTextKa:
      'ქალი დაინიშნება (კიდუშინით) სამი გზით: ვერცხლით (ფულით), საბუთით (შტარით) და თანაცხოვრებით.',
  },
  'Bava_Kamma:2a': {
    headerHe: 'מסכת בבא קמא דף ב ע״א',
    openingWordHe: 'אַרְבָּעָה',
    startingTextHe:
      'אַרְבָּעָה אֲבוֹת נְזִיקִין: הַשּׁוֹר וְהַבּוֹר וְהַמַּבְעֶה וְהַהֶבְעֵר. לֹא הֲרֵי הַשּׁוֹר כַּהֲרֵי הַמַּבְעֶה.',
    startingTextKa:
      'ზიანის ოთხი მთავარი კატეგორია (არბა აბოთ ნეზიკინ): ხარი (შორ), ორმო (ბორ), მავე და ხანძარი (ჰევერ).',
  },
  'Bava_Metzia:2a': {
    headerHe: 'מסכת בבא מציעא דף ב ע״א',
    openingWordHe: 'שְׁנַיִם',
    startingTextHe:
      'שְׁנַיִם אוֹחֲזִין בְּטַלִּית, זֶה אוֹמֵר אֲנִי מְצָאתִיהָ וְזֶה אוֹמֵר אֲנִי מְצָאתִיהָ — זֶה יִשָּׁבַע וְזֶה יִשָּׁבַע וְיַחְלוֹקוּ.',
    startingTextKa:
      'ორნი ეჭიდებიან ტალითს: ერთი ამბობს „მე ვიპოვე“ და მეორე ამბობს „მე ვიპოვე“ — ორივე დაიფიცებს და გაიყოფენ.',
  },
  'Bava_Batra:2a': {
    headerHe: 'מסכת בבא בתרא דף ב ע״א',
    openingWordHe: 'הַשּׁוּתָּפִין',
    startingTextHe:
      'הַשּׁוּתָּפִין שֶׁרָצוּ לַעֲשׂוֹת מְחִיצָה בֶּחָצֵר — בּוֹנִין אֶת הַכּוֹתֶל בָּאֶמְצַע.',
    startingTextKa:
      'მოზიარეები (პარტნიორები), რომლებმაც მოისურვეს ეზოში გამყოფი კედლის აშენება, აშენებენ კედელს შუაში.',
  },
  'Sanhedrin:2a': {
    headerHe: 'מסכת סנהדרין דף ב ע״א',
    openingWordHe: 'דִּינֵי',
    startingTextHe:
      'דִּינֵי מָמוֹנוֹת בִּשְׁלֹשָׁה, גְּזֵילוֹת וַחֲבָלוֹת בִּשְׁלֹשָׁה, נֶזֶק וַחֲצִי נֶזֶק תַּשְׁלוּמֵי כֶפֶל וְתַשְׁלוּמֵי אַרְבָּעָה וַחֲמִשָּׁה בִּשְׁלֹשָׁה.',
    startingTextKa:
      'ქონებრივი დავები განიხილება სამი მსაჯულის მიერ, ძარცვა და დაზიანება — სამის მიერ.',
  },
  'Shevuot:2a': {
    headerHe: 'מסכת שבועות דף ב ע״א',
    openingWordHe: 'שְׁבוּעוֹת',
    startingTextHe:
      'שְׁבוּעוֹת שְׁתַּיִם שֶׁהֵן אַרְבַּע, יְדִיעוֹת הַטּוּמְאָה שְׁתַּיִם שֶׁהֵן אַרְבַּע, יְצִיאוֹת הַשַּׁבָּת שְׁתַּיִם שֶׁהֵן אַרְבַּע.',
    startingTextKa:
      'ფიცნი (შევუოთ) არის ორი, რომელიც ოთხია; უწმინდურების ცოდნა არის ორი, რომელიც ოთხია; შაბათის გატანანი არის ორი, რომელიც ოთხია.',
  },
  'Avodah_Zarah:2a': {
    headerHe: 'מסכת עבודה זרה דף ב ע״א',
    openingWordHe: 'לִפְנֵי',
    startingTextHe:
      'לִפְנֵי אֵידֵיהֶן שֶׁל עוֹבְדֵי כוֹכָבִים שְׁלֹשָׁה יָמִים אָסוּר לָשֵׂאת וְלָתֵת עִמָּהֶם.',
    startingTextKa:
      'კერპთაყვანისმცემელთა დღესასწაულებამდე სამი დღით ადრე იკრძალება მათთან სავაჭრო გარიგება.',
  },
  'Zevachim:2a': {
    headerHe: 'מסכת זבחים דף ב ע״א',
    openingWordHe: 'כָּל',
    startingTextHe:
      'כָּל הַזְּבָחִים שֶׁנִּזְבְּחוּ שֶׁלֹּא לִשְׁמָן כְּשֵׁרִים, אֶלָּא שֶׁלֹּא עָלוּ לַבְּעָלִים לְשֵׁם חוֹבָה, חוּץ מִן הַפֶּסַח וּמִן הַחַטָּאת.',
    startingTextKa:
      'ყველა მსხვერპლი, რომელიც დაიკლა არა თავისი სახელით (შელო ლიშმან), ქაშერია, გარდა ფესახისა და ხატათისა.',
  },
  'Zevachim:56a': {
    headerHe: 'מסכת זבחים דף נו ע״א',
    openingWordHe: 'נאכלים',
    startingTextHe:
      'נֶאֱכָלִין לְיוֹם וָלַיְלָה עַד חֲצוֹת — מִדְּאוֹרַיְיתָא עַד עַמּוּד הַשַּׁחַר, וְרַבָּנַן גָּזְרוּ עַד חֲצוֹת הַלַּיְלָה.',
    startingTextKa:
      'მსხვერპლი იჭმევა ერთი დღე და ღამე შუაღამემდე — თორიდან ცისკრის სვეტამდეა, ხოლო ბრძენებმა დაადგინეს შუაღამემდე.',
  },
  'Zevachim:110b': {
    headerHe: 'מסכת זבחים דף קי ע״ב',
    openingWordHe: 'הַמְּמַלֵּא',
    startingTextHe:
      'הַמְּמַלֵּא מַיִם לְנִיסּוּךְ הַמַּיִם בֶּחָג — מְמַלְּאִין מִבְּעוֹד יוֹם אוֹ בַּלַּיְלָה וּמְנַסְּכִין עִם תָּמִיד שֶׁל שַׁחַר.',
    startingTextKa:
      'ვინც ავსებს წყალს სუკოთის წყლის საღვრელისთვის (ნისუხ ჰამაიმ) — ავსებენ საღამოდან ან ღამით და ღვრიან დილის თამიდის მსხვერპლთან ერთად.',
  },
  'Menachot:2a': {
    headerHe: 'מסכת מנחות דף ב ע״א',
    openingWordHe: 'כָּל',
    startingTextHe:
      'כָּל הַמְּנָחוֹת שֶׁנִּקְמְצוּ שֶׁלֹּא לִשְׁמָן כְּשֵׁרוֹת, אֶלָּא שֶׁלֹּא עָלוּ לַבְּעָלִים לְשֵׁם חוֹבָה.',
    startingTextKa:
      'ყველა მინხა (პურეულის შესაწირავი), რომლის კომეციც აღებულ იქნა არა თავისი სახელით, ქაშერია.',
  },
  'Chullin:2a': {
    headerHe: 'מסכת חולין דף ב ע״א',
    openingWordHe: 'הַכֹּל',
    startingTextHe:
      'הַכֹּל שׁוֹחֲטִין וּשְׁחִיטָתָן כְּשֵׁרָה, חוּץ מֵחֵרֵשׁ שׁוֹטֶה וְקָטָן שֶׁמָּא יְקַלְקְלוּ אֶת שְׁחִיטָתָן.',
    startingTextKa:
      'ყველას შეუძლია შეასრულოს შחיტა (რიტუალური დაკვლა) და მათი შחיტა ქაშერია, გარდა სმენადაქვეითებულისა, შეურაცხადისა და მცირეწლოვანისა.',
  },
  'Niddah:2a': {
    headerHe: 'מסכת נדה דף ב ע״א',
    openingWordHe: 'שַׁמַּאי',
    startingTextHe:
      'שַׁמַּאי אוֹמֵר: כָּל הַנָּשִׁים דַּיָּן שְׁעָתָן. וְהִלֵּל אוֹמֵר: מִפְּקִידָה לִפְקִידָה וַאֲפִלּוּ לְיָמִים הַרְבֵּה.',
    startingTextKa:
      'შამაი ამბობს: ყველა ქალისთვის საკმარისია მათი აღმოჩენის საათი (დაიან შაათან). ჰილელი კი ამბობს: შემოწმებიდან შემოწმებამდე.',
  },
};

interface TalmudModalsProps {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  dafMarkHe: string;
  isDark: boolean;
  hasSelectedTarget: boolean;
  effectiveMishnah: TalmudSentence[];
  effectiveGemara: TalmudSentence[];
  effectiveChavruta: TalmudSentence[];
  fullscreenSection: FullscreenSectionData | null;
  onCloseFullscreenSection: () => void;
  onUpdateFullscreenSentences: (sentences: TalmudSentence[]) => void;
  isSectionSpeaking: boolean;
  onSpeakSection: (sentences: TalmudSentence[]) => void;
  renderInlineInteractiveWords: (
    sentence: TalmudSentence,
    isRashiScript?: boolean,
    boldFirstWord?: boolean
  ) => React.ReactNode;
  addNoteModalOpen: boolean;
  onCloseAddNoteModal: () => void;
  onAddDafNote: (sectionLabel: string, noteText: string) => void;
  shareModalOpen: boolean;
  onCloseShareModal: () => void;
  showOnlinePdfModal: boolean;
  onCloseOnlinePdfModal: () => void;
  hoveredTosafotCitation: {
    link: TosafotDeepLinkRef;
    rect: { left: number; top: number; bottom: number; width: number };
  } | null;
  getCitationDafPreview: (link: TosafotDeepLinkRef) => {
    headerHe: string;
    startingTextHe: string;
    startingTextKa: string;
  };
  dafFontSizeScale?: number;
}

export const TalmudModals: React.FC<TalmudModalsProps> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  dafMarkHe,
  isDark,
  hasSelectedTarget,
  effectiveMishnah,
  effectiveGemara,
  effectiveChavruta,
  fullscreenSection,
  onCloseFullscreenSection,
  onUpdateFullscreenSentences,
  isSectionSpeaking,
  onSpeakSection,
  renderInlineInteractiveWords,
  addNoteModalOpen,
  onCloseAddNoteModal,
  onAddDafNote,
  shareModalOpen,
  onCloseShareModal,
  showOnlinePdfModal,
  onCloseOnlinePdfModal,
  hoveredTosafotCitation,
  getCitationDafPreview,
  dafFontSizeScale = 100,
}) => {
  const [fullscreenFontScale, setFullscreenFontScale] = useState<number>(dafFontSizeScale);
  const [isDoubleClickFullHeight, setIsDoubleClickFullHeight] = useState<boolean>(false);
  const [profTranslatingSection, setProfTranslatingSection] = useState<boolean>(false);

  const [noteSectionTarget, setNoteSectionTarget] = useState('მთლიანი დაფი (כל הדף)');
  const [customNoteText, setCustomNoteText] = useState('');

  const [shareSegmentKey, setShareSegmentKey] = useState<
    'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'chavruta'
  >('mishnah');
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string>('');

  useEffect(() => {
    setFullscreenFontScale(dafFontSizeScale || 100);
  }, [dafFontSizeScale]);

  const handleRunProfessionalSectionTranslation = async () => {
    if (!fullscreenSection || profTranslatingSection) return;
    setProfTranslatingSection(true);
    try {
      const updatedSentences = await Promise.all(
        fullscreenSection.sentences.map(async (sent) => {
          const rawHe = sent.hebrewText || sent.hebrew || '';
          const profKa = await translateWithTorahTalmudSpecServer(
            sent.translationKa || rawHe,
            {
              hebrewOriginal: rawHe,
              sectionType:
                sent.source === 'mishnah' ||
                sent.source === 'gemara' ||
                sent.source === 'rashi' ||
                sent.source === 'tosafot'
                  ? sent.source
                  : 'meforshim',
              tractate: tractateNameKa,
              daf: dafData.dafId,
              targetLang: 'ka',
            }
          );
          return {
            ...sent,
            translationKa: profKa || sent.translationKa,
          };
        })
      );
      onUpdateFullscreenSentences(updatedSentences);
    } finally {
      setProfTranslatingSection(false);
    }
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('tractate', dafData.tractateId);
    url.searchParams.set('daf', dafData.dafId);
    url.searchParams.set('section', shareSegmentKey);
    return url.toString();
  }, [dafData.tractateId, dafData.dafId, shareSegmentKey]);

  const activeShareSentences = useMemo(() => {
    switch (shareSegmentKey) {
      case 'mishnah':
        return effectiveMishnah;
      case 'gemara':
        return effectiveGemara;
      case 'rashi':
        return dafData.rashi;
      case 'tosafot':
        return dafData.tosafot;
      case 'chavruta':
        return effectiveChavruta;
      default:
        return effectiveMishnah;
    }
  }, [
    shareSegmentKey,
    effectiveMishnah,
    effectiveGemara,
    dafData.rashi,
    dafData.tosafot,
    effectiveChavruta,
  ]);

  useEffect(() => {
    if (!shareModalOpen || typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(0.5, '#FBF5E6');
    grad.addColorStop(1, '#F2E5C9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = '#181613';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 1008, 1008);
    ctx.strokeStyle = '#B4833E';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 984, 984);

    ctx.fillStyle = '#181613';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px "Frank Ruhl Libre", serif';
    ctx.fillText(`תלמוד בבלי • מסכת ${tractateNameHe} דף ${dafMarkHe}`, 540, 118);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 26px "Noto Sans Georgian", sans-serif';
    const secLabelMap: Record<string, string> = {
      mishnah: 'მიშნა (משנה)',
      gemara: 'გემარა (גמרא)',
      rashi: 'რაში (רש״י)',
      tosafot: 'თოსაფოთი (תוספות)',
      chavruta: 'ხავრუთა (חברותא)',
    };
    ctx.fillText(
      `${tractateNameKa} • ${dafData.amudKa} — ${secLabelMap[shareSegmentKey] || ''}`,
      540,
      162
    );

    ctx.strokeStyle = '#181613';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 188);
    ctx.lineTo(1000, 188);
    ctx.stroke();

    const firstSent = activeShareSentences[0];
    const heText = (
      firstSent?.hebrewText ||
      firstSent?.hebrew ||
      dafData.openingWordHe ||
      ''
    ).slice(0, 360);
    const kaText = sanitizeGeorgianText(
      firstSent?.translationKa || firstSent?.explanationKa || ''
    ).slice(0, 440);

    ctx.fillStyle = '#0F0D0A';
    ctx.font = 'bold 34px "Frank Ruhl Libre", serif';
    ctx.textAlign = 'right';
    const heWords = heText.split(/\s+/);
    let line = '';
    let y = 258;
    for (const w of heWords) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 880) {
        ctx.fillText(line, 980, y);
        line = w;
        y += 50;
        if (y > 540) break;
      } else {
        line = test;
      }
    }
    if (line && y <= 540) {
      ctx.fillText(line, 980, y);
      y += 55;
    }

    ctx.strokeStyle = '#C8A162';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(980, y);
    ctx.stroke();
    y += 52;

    ctx.fillStyle = '#1C1917';
    ctx.font = '600 26px "Noto Sans Georgian", sans-serif';
    ctx.textAlign = 'left';
    const kaWords = kaText.split(/\s+/);
    let kaLine = '';
    for (const w of kaWords) {
      const test = kaLine ? `${kaLine} ${w}` : w;
      if (ctx.measureText(test).width > 860) {
        ctx.fillText(kaLine, 100, y);
        kaLine = w;
        y += 42;
        if (y > 940) break;
      } else {
        kaLine = test;
      }
    }
    if (kaLine && y <= 940) {
      ctx.fillText(kaLine, 100, y);
    }

    ctx.fillStyle = '#6B4226';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Noto Sans Georgian", sans-serif';
    ctx.fillText('თალმუდ ბაბლი • ქართულ-ებრაული სასწავლო აკადემია', 540, 1012);

    try {
      setShareImageDataUrl(canvas.toDataURL('image/png'));
    } catch {
      // ignore
    }
  }, [
    shareModalOpen,
    shareSegmentKey,
    activeShareSentences,
    tractateNameHe,
    tractateNameKa,
    dafMarkHe,
    dafData.amudKa,
    dafData.openingWordHe,
  ]);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDownloadShareImage = () => {
    if (!shareImageDataUrl) return;
    const a = document.createElement('a');
    a.href = shareImageDataUrl;
    a.download = `Talmud-${dafData.tractateId}-${dafData.dafId}-${shareSegmentKey}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    const firstSent = activeShareSentences[0];
    const shareTitle = `${tractateNameKa} (${tractateNameHe}) דף ${dafData.dafId}`;
    const shareText = `${shareTitle}\n${firstSent?.hebrewText || firstSent?.hebrew || ''}\n\nქართული თარგმანი: ${sanitizeGeorgianText(
      firstSent?.translationKa || ''
    )}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    handleCopyShareLink();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* 1. FULLSCREEN SECTION READER MODAL */}
      <AnimatePresence>
        {fullscreenSection && (
          <motion.div
            key="fullscreen-section-reader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            data-fullscreen-section-active="true"
            className="fixed inset-0 z-[165] pointer-events-none flex justify-center"
          >
            <div
              onClick={onCloseFullscreenSection}
              className="fixed inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-auto"
            />

            <div
              style={
                isDoubleClickFullHeight
                  ? {
                      position: 'fixed',
                      top: '54px',
                      bottom: '64px',
                      width: 'min(96vw, 940px)',
                    }
                  : hasSelectedTarget
                    ? {
                        position: 'fixed',
                        top: '54px',
                        height: '39vh',
                        width: 'min(96vw, 940px)',
                      }
                    : {
                        position: 'fixed',
                        top: '56px',
                        bottom: '66px',
                        width: 'min(96vw, 940px)',
                      }
              }
              className={`pointer-events-auto z-[166] rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-200 ${
                isDark
                  ? 'bg-[#21160F]/98 border-[#C49A6C]/55 text-[#FAF5EB]'
                  : 'bg-[#FAF3E3]/98 border-[#6E472B]/60 text-[#21160F]'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
                  isDark ? 'bg-[#2D1F15] border-[#5C3A21]' : 'bg-[#E5D6BC] border-[#8B5A2B]/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-base font-black ${
                        isDark ? 'text-[#EED9B9]' : 'text-[#3B2313]'
                      }`}
                    >
                      {fullscreenSection.titleKa}
                    </span>
                    <span className="opacity-40">·</span>
                    <span dir="rtl" className="font-serif text-sm sm:text-lg font-black">
                      {fullscreenSection.titleHe}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    დააწკაპუნეთ ნებისმიერ სიტყვას — ახსნის ეკრანი სინქრონულად გაიხსნება სიტყვის ქვემოთ
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFullscreenFontScale((s) => Math.max(85, s - 15))}
                    className="p-1.5 rounded-lg bg-[#6B4226]/20 hover:bg-[#6B4226]/35 border border-[#8B5A2B]/40 cursor-pointer"
                    title="შრიფტის დაპატარავება"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums font-bold px-1">
                    {fullscreenFontScale}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setFullscreenFontScale((s) => Math.min(180, s + 15))}
                    className="p-1.5 rounded-lg bg-[#6B4226]/20 hover:bg-[#6B4226]/35 border border-[#8B5A2B]/40 cursor-pointer"
                    title="შრიფტის გადიდება"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDoubleClickFullHeight((v) => !v)}
                    className="p-1.5 rounded-lg bg-[#6B4226]/20 hover:bg-[#6B4226]/35 border border-[#8B5A2B]/40 cursor-pointer"
                    title="მთელ სიმაღლეზე გაშლა / სინქრონული ზომა"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRunProfessionalSectionTranslation}
                    disabled={profTranslatingSection}
                    className="px-2.5 py-1.5 rounded-lg bg-[#5C3A21] hover:bg-[#6B4226] text-[#FBF7F0] border border-[#C49A6C]/50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#EED9B9]" />
                    <span className="hidden sm:inline">
                      {profTranslatingSection ? 'ითარგმნება...' : 'პროფ. თარგმანი'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSpeakSection(fullscreenSection.sentences)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      isSectionSpeaking
                        ? 'bg-red-600 text-white border-red-400 animate-pulse'
                        : 'bg-[#6B4226]/25 hover:bg-[#6B4226]/40 border-[#8B5A2B]/40'
                    }`}
                  >
                    {isSectionSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">გაჩერება</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">წაკითხვა</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCloseFullscreenSection}
                    className="px-3 py-1.5 rounded-lg bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>დახურვა</span>
                  </button>
                </div>
              </div>

              <div
                data-doubleclick-scroll="true"
                className="relative flex-1 overflow-y-auto overscroll-contain p-4 pb-24 space-y-3"
              >
                <ReadingLineGuide
                  initialY={42}
                  isDarkField={isDark}
                  fieldLabel={fullscreenSection.titleKa}
                />
                {fullscreenSection.sentences.map((sent, idx) => (
                  <div
                    key={sent.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isDark
                        ? 'bg-[#2A1D14]/90 border-[#5C3A21]'
                        : 'bg-[#F3E8D2] border-[#B89F7D]'
                    }`}
                  >
                    <div
                      dir="rtl"
                      style={{
                        fontSize: `${Math.round((17 * fullscreenFontScale) / 100)}px`,
                        lineHeight: 1.65,
                      }}
                      className={`text-justify font-serif ${
                        isDark ? 'text-[#FAF5EB]' : 'text-[#1A110A]'
                      }`}
                    >
                      {renderInlineInteractiveWords(
                        sent,
                        fullscreenSection.isRashiScript,
                        idx === 0
                      )}
                    </div>

                    {sent.translationKa && (
                      <div
                        style={{
                          fontSize: `${Math.round((13.5 * fullscreenFontScale) / 100)}px`,
                        }}
                        className={`pt-2 border-t leading-relaxed font-medium ${
                          isDark
                            ? 'border-[#5C3A21] text-[#EED9B9]'
                            : 'border-[#B89F7D] text-[#2B1B10]'
                        }`}
                      >
                        <span className="font-bold text-[#8B5A2B] mr-1.5">ქართული თარგმანი:</span>
                        {sent.translationKa}
                      </div>
                    )}

                    {sent.explanationKa && sent.explanationKa !== sent.translationKa && (
                      <div className="text-xs opacity-90 leading-relaxed">
                        <span className="font-bold text-[#6B4226] mr-1.5">განმარტება:</span>
                        {sent.explanationKa}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ADD PERSONAL NOTE MODAL */}
      <AnimatePresence>
        {addNoteModalOpen && (
          <motion.div
            key="add-note-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onCloseAddNoteModal}
            className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              key="add-note-modal-card"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl border-2 p-5 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-[#1F150E] border-[#C49A6C]/60 text-[#FAF5EB]'
                  : 'bg-[#F5EBD6] border-[#6E472B] text-[#21160F]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#8B5A2B]/30 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-[#8B5A2B]" />
                  <h3 className="text-base font-black">
                    კომენტარის / საკუთარი შენიშვნის დამატება
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onCloseAddNoteModal}
                  className="p-1.5 rounded-lg hover:bg-[#6B4226]/20 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <SearchableSelect
                  label="აირჩიეთ დაფის სექცია შენიშვნისთვის:"
                  options={[
                    { value: 'მთლიანი დაფი (כל הדף)', badgeHe: 'כל הדף', label: 'მთლიანი დაფი' },
                    { value: 'მიშნა (משנה)', badgeHe: 'משנה', label: 'მიშნის სექცია' },
                    { value: 'გემარა (גמרא)', badgeHe: 'גמרא', label: 'გემარის სექცია' },
                    { value: 'რაში (רש״י)', badgeHe: 'רש״י', label: 'რაშის კომენტარი' },
                    { value: 'თოსაფოთი (תוספות)', badgeHe: 'תוספות', label: 'თოსაფოთის სექცია' },
                  ]}
                  value={noteSectionTarget}
                  onChange={(val) => setNoteSectionTarget(val)}
                  isDark={isDark}
                />

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    თქვენი კომენტარი / შენიშვნა ({tractateNameKa} {dafData.dafId}):
                  </label>
                  <textarea
                    rows={4}
                    value={customNoteText}
                    onChange={(e) => setCustomNoteText(e.target.value)}
                    placeholder="ჩაწერეთ თქვენი შენიშვნა, ხიდუში ან განმარტება..."
                    className={`w-full p-3 rounded-xl border text-xs sm:text-sm outline-none ${
                      isDark
                        ? 'bg-[#2A1D14] border-[#5C3A21] text-[#FAF5EB]'
                        : 'bg-[#FAF3E3] border-[#8B5A2B]/50 text-[#21160F]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onCloseAddNoteModal}
                    className="px-4 py-2 rounded-xl border border-[#8B5A2B]/50 text-xs font-bold cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customNoteText.trim()) return;
                      onAddDafNote(noteSectionTarget, customNoteText.trim());
                      setCustomNoteText('');
                      onCloseAddNoteModal();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] text-xs font-bold cursor-pointer"
                  >
                    კომენტარის შენახვა
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SHARE SEGMENT MODAL */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            key="share-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onCloseShareModal}
            className="fixed inset-0 z-[220] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              key="share-modal-card"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl border-2 p-5 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-[#1F150E] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#F5EBD6] border-[#6E472B] text-[#21160F]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#8B5A2B]/30 pb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#8B5A2B]" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black">
                      დაფის სეგმენტის გაზიარება • שיתוף קטע מהדף
                    </h3>
                    <p className="text-[11px] opacity-80">
                      {tractateNameKa} ({tractateNameHe}) • {dafData.amudKa}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseShareModal}
                  className="p-1.5 rounded-lg hover:bg-[#6B4226]/20 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <div className="text-xs font-bold mb-1.5">აირჩიეთ გასაზიარებელი სეგმენტი:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'mishnah', label: 'მიშნა (משנה)' },
                      { id: 'gemara', label: 'გემარა (גמרא)' },
                      { id: 'rashi', label: 'რაში (רש״י)' },
                      { id: 'tosafot', label: 'თოსაფოთი (תוספות)' },
                      { id: 'chavruta', label: 'ხავრუთა (חברותא)' },
                    ] as const
                  ).map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setShareSegmentKey(seg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        shareSegmentKey === seg.id
                          ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm'
                          : isDark
                            ? 'bg-[#2A1D14] text-[#EED9B9] border border-[#5C3A21]'
                            : 'bg-[#E5D6BC] text-[#21160F] border border-[#8B5A2B]/40'
                      }`}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>

              {shareImageDataUrl && (
                <div className="rounded-xl overflow-hidden border border-[#8B5A2B]/40 bg-[#2A1D14]/40 flex justify-center p-2">
                  <img
                    src={shareImageDataUrl}
                    alt="Talmud Daf Segment Preview"
                    className="max-h-52 w-auto rounded-lg shadow-md object-contain"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-xs font-bold">პირდაპირი ბმული ამ სეგმენტზე:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono outline-none ${
                      isDark
                        ? 'bg-[#2A1D14] border-[#5C3A21] text-[#FAF5EB]'
                        : 'bg-[#FAF3E3] border-[#8B5A2B]/50 text-[#21160F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {shareLinkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>დაკოპირდა!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ბმული</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#8B5A2B]/25">
                <button
                  type="button"
                  onClick={handleDownloadShareImage}
                  className="px-4 py-2 rounded-xl border border-[#8B5A2B]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#8B5A2B]" />
                  <span>სურათის ჩამოტვირთვა (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-5 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>გაზიარება</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. ONLINE VILNA SHAS PDF MODAL */}
      <AnimatePresence>
        {showOnlinePdfModal && (
          <motion.div
            key="online-vilna-pdf-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onCloseOnlinePdfModal}
            className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              key="online-vilna-pdf-modal-card"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-5xl h-[90vh] rounded-2xl border-2 p-3 sm:p-5 shadow-2xl flex flex-col gap-3 ${
                isDark
                  ? 'bg-[#1F150E] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#F5EBD6] border-[#6E472B] text-[#21160F]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#8B5A2B]/30 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#6B4226] text-[#FAF5EB] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black truncate">
                      თალმუდ ბაბლის ორიგინალი PDF გვერდი • ש״ס וילנא PDF ({tractateNameKa}{' '}
                      {dafData.dafId})
                    </h3>
                    <p className="text-[11px] opacity-80 truncate">
                      წყარო: HebrewBooks.org & Shas.org Daf PDF API • სრული 37 ტრაქტატი (2,711 დაფი)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/talmud/vilna-pdf?tractate=${encodeURIComponent(
                      dafData.tractateId
                    )}&daf=${encodeURIComponent(dafData.dafId)}&download=1`}
                    download={`Vilna-${dafData.tractateId}-${dafData.dafId}.pdf`}
                    className="px-3 py-1.5 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF ჩამოტვირთვა</span>
                  </a>

                  <a
                    href={`https://www.sefaria.org/${encodeURIComponent(
                      dafData.tractateId
                    )}.${encodeURIComponent(dafData.dafId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl border border-[#8B5A2B]/50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Sefaria</span>
                  </a>

                  <button
                    type="button"
                    onClick={onCloseOnlinePdfModal}
                    className="p-1.5 rounded-lg hover:bg-[#6B4226]/20 cursor-pointer"
                    title="დახურვა"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 w-full rounded-xl overflow-y-auto border border-[#8B5A2B]/40 bg-[#FAF4E4] p-2 sm:p-3 relative">
                <VilnaPdfInteractiveViewer
                  dafData={dafData}
                  tractateNameHe={tractateNameHe}
                  tractateNameKa={tractateNameKa}
                  dafMarkHe={dafMarkHe}
                  effectiveMishnah={effectiveMishnah}
                  effectiveGemara={effectiveGemara}
                  effectiveRashi={dafData.rashi || []}
                  effectiveTosafot={dafData.tosafot || []}
                  isDark={isDark}
                  fontScaleRatio={(dafFontSizeScale || 100) / 100}
                  selectedTarget={null}
                  onSelectWordOrSentence={() => {}}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. HOVER TOOLTIP PREVIEW FOR TALMUDIC CITATIONS WITHIN TOSAFOT ENTRIES */}
      <AnimatePresence>
        {hoveredTosafotCitation &&
          (() => {
            const preview = getCitationDafPreview(hoveredTosafotCitation.link);
            const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
            const tooltipWidth = Math.min(365, winW - 24);
            const centerX =
              hoveredTosafotCitation.rect.left + hoveredTosafotCitation.rect.width / 2;
            const clampedLeft = Math.max(
              12,
              Math.min(winW - tooltipWidth - 12, centerX - tooltipWidth / 2)
            );
            const showBelow = hoveredTosafotCitation.rect.top < 215;
            const topPos = showBelow
              ? Math.min(winH - 210, hoveredTosafotCitation.rect.bottom + 10)
              : Math.max(12, hoveredTosafotCitation.rect.top - 10);

            const heWords = (preview.startingTextHe || '').trim().split(/\s+/);
            const leadWordHe = heWords[0] || '';
            const restWordsHe = heWords.slice(1).join(' ');

            return (
              <motion.div
                key={`tosafot-cite-tooltip-${hoveredTosafotCitation.link.id}-${hoveredTosafotCitation.link.citeHe}`}
                initial={{ opacity: 0, y: showBelow ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: showBelow ? -4 : 4, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  left: `${clampedLeft}px`,
                  top: `${topPos}px`,
                  width: `${tooltipWidth}px`,
                  transform: showBelow ? 'none' : 'translateY(-100%)',
                }}
                className={`z-[285] pointer-events-none rounded-2xl border-2 p-3.5 shadow-[0_16px_42px_rgba(0,0,0,0.72),0_0_24px_rgba(196,154,108,0.42)] backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#1D130C]/98 border-[#C49A6C] text-[#FAF5EB]'
                    : 'bg-[#FFFDF8]/98 border-[#6B4226] text-[#1F140B]'
                }`}
              >
                <div
                  className={`flex items-center justify-between gap-2 pb-1.5 mb-2 border-b ${
                    isDark ? 'border-[#C49A6C]/35' : 'border-[#8B5A2B]/30'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-[#C49A6C] truncate">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      თოსაფოთის წყარო • {hoveredTosafotCitation.link.targetSectionLabelKa}
                    </span>
                  </span>
                  <span
                    dir="rtl"
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                    className={`text-xs font-black px-2 py-0.5 rounded-md shrink-0 ${
                      isDark
                        ? 'bg-[#362417] text-[#FDE68A] border border-[#C49A6C]/40'
                        : 'bg-[#EFE3CE] text-[#4A2E1B] border border-[#8B5A2B]/40'
                    }`}
                  >
                    {preview.headerHe}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-[9.5px] font-extrabold opacity-80 mb-1">
                    <span>დაფის საწყისი ტექსტი • תחילת הדף המצוטט:</span>
                    {hoveredTosafotCitation.link.citeHe && (
                      <span
                        dir="rtl"
                        className="font-serif font-black text-[#C49A6C]"
                      >
                        [{hoveredTosafotCitation.link.citeHe}]
                      </span>
                    )}
                  </div>
                  <div
                    dir="rtl"
                    style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}
                    className={`text-xs sm:text-[13.5px] leading-relaxed text-justify font-semibold p-2.5 rounded-xl border ${
                      isDark
                        ? 'bg-[#140D08] border-[#5C3A21] text-[#FAF5EB]'
                        : 'bg-[#FAF3E3] border-[#D4C5A9] text-[#110D08]'
                    }`}
                  >
                    {leadWordHe && (
                      <span className="font-black text-[1.25em] ml-1.5 text-[#B45309] dark:text-[#FDE68A]">
                        {leadWordHe}
                      </span>
                    )}
                    <span>{restWordsHe}</span>
                  </div>
                </div>

                {preview.startingTextKa && (
                  <p className="text-[10.5px] leading-snug opacity-95 line-clamp-2 mb-1.5 font-medium">
                    {preview.startingTextKa}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#8B5A2B]/20 text-[9.5px] font-extrabold text-[#C49A6C]">
                  <span>צורת הדף • תוספות</span>
                  <span>დააწკაპუნეთ დაფზე გადასასვლელად →</span>
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </>,
    document.body
  );
};
