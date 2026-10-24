// @ts-nocheck
import { UILang } from '../types/talmud';
import {
  lookupSiddurLineTranslationKa,
  repairSiddurOcrLine,
  repairSiddurOcrWord,
  SIDDUR_WORD_LEXICON,
} from './siddurPdfCanonicalFixer';

const CLOUD_BACKEND_ORIGIN =
  'https://ais-pre-kreqvqjknxvke7ewnhj4hz-717879045090.europe-west2.run.app';

const translationCache = new Map<string, string>();

// Load persisted professional Torah & Talmud translations from localStorage
try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('talmud_prof_translation_cache_v5');
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, string>;
      Object.entries(parsed).forEach(([k, v]) => {
        if (k && v && !/[A-Za-z]{2,}/.test(v)) translationCache.set(k, v);
      });
    }
  }
} catch {
  // ignore storage errors
}

function persistCacheEntry(key: string, value: string) {
  if (/[A-Za-z]{2,}/.test(value)) return;
  translationCache.set(key, value);
  try {
    if (typeof window !== 'undefined' && translationCache.size <= 600) {
      const obj: Record<string, string> = {};
      let count = 0;
      for (const [k, v] of translationCache.entries()) {
        if (count++ > 450) break;
        obj[k] = v;
      }
      localStorage.setItem('talmud_prof_translation_cache_v5', JSON.stringify(obj));
    }
  } catch {
    // ignore quota errors
  }
}

export function getBackendUrl(path: string): string {
  if (typeof window !== 'undefined' && !window.location.protocol.startsWith('http')) {
    return `${CLOUD_BACKEND_ORIGIN}${path}`;
  }
  return path;
}

/**
 * Comprehensive Talmudic, Rashi, Tosafot & Torah Abbreviations mapped to full scholarly Hebrew/Aramaic
 */
const ABBREVIATION_MAP: [RegExp, string][] = [
  [/ד["״]ה/g, 'דיבור המתחיל'],
  [/וכו['׳]/g, 'וכולי'],
  [/וכו/g, 'וכולי'],
  [/הקב["״]ה/g, 'הקדוש ברוך הוא'],
  [/ר["״]א/g, 'רבי אליעזר'],
  [/ר["״]י/g, 'רבי יהושע'],
  [/ר["״]ג/g, 'רבן גמליאל'],
  [/ר["״]ע/g, 'רבי עקיבא'],
  [/ר["״]מ/g, 'רבי מאיר'],
  [/ר["״]ש/g, 'רבי שמעון'],
  [/רשב["״]י/g, 'רבי שמעון בר יוחאי'],
  [/רשב["״]ג/g, 'רבן שמעון בן גמליאל'],
  [/רת["״]/g, 'רבינו תם'],
  [/ר["״]ת/g, 'רבינו תם'],
  [/ר["״]ח/g, 'רבינו חננאל'],
  [/ר["״]ג/g, 'רבינו גרשום'],
  [/רי["״]ף/g, 'רבי יצחק אלפסי'],
  [/רא["״]ש/g, 'רבינו אשר'],
  [/רשב["״]א/g, 'רבי שלמה בן אדרת'],
  [/ריטב["״]א/g, 'רבי יום טוב בן אברהם אשבילי'],
  [/רמב["״]ם/g, 'רבי משה בן מימון'],
  [/רמב["״]ן/g, 'רבי משה בן נחמן'],
  [/מהרש["״]א/g, 'מורנו הרב שמואל אליעזר איידלס'],
  [/מהר["״]ם/g, 'מורנו הרב מאיר'],
  [/ת["״]ר/g, 'תנו רבנן בברייתא'],
  [/ת["״]ש/g, 'תא שמע'],
  [/קמ["״]ל/g, 'קא משמע לן'],
  [/ש["״]מ/g, 'שמע מינה'],
  [/מנא["״]מ/g, 'מנא הני מילי'],
  [/מנל["״]ן/g, 'מנא לן'],
  [/ב["״]ש/g, 'בית שמאי'],
  [/ב["״]ה/g, 'בית הלל'],
  [/ב["״]ד/g, 'בית דין'],
  [/יו["״]ט/g, 'יום טוב'],
  [/חוה["״]מ/g, 'חול המועד'],
  [/ר["״]ה/g, 'ראש השנה'],
  [/רה["״]ש/g, 'ראש השנה'],
  [/יה["״]כ/g, 'יום הכיפורים'],
  [/יוה["״]כ/g, 'יום הכיפורים'],
  [/ק["״]ש/g, 'קריאת שמע'],
  [/בהמ["״]ז/g, 'ברכת המזון'],
  [/שמ["״]ע/g, 'שמונה עשרה'],
  [/ע["״]ש/g, 'עיין שם'],
  [/פירש["״]י/g, 'פירוש רשי'],
  [/רש["״]י/g, 'רשי'],
  [/תוס['׳]/g, 'תוספות'],
  [/אע["״]פ/g, 'אף על פי'],
  [/אע["״]ג/g, 'אף על גב'],
  [/אא["״]כ/g, 'אלא אם כן'],
  [/ע["״]כ/g, 'עד כאן'],
  [/עכ["״]ל/g, 'עד כאן לשונו'],
  [/ז["״]ל/g, 'זכרונו לברכה'],
  [/מ["״]ט/g, 'מאי טעמא'],
  [/ק["״]ו/g, 'קל וחומר'],
  [/גז["״]ש/g, 'גזירה שווה'],
  [/בהמ["״]ק/g, 'בית המקדש'],
  [/ש["״]ץ/g, 'שליח ציבור'],
  [/ס["״]ת/g, 'ספר תורה'],
  [/ע["״]א/g, 'עמוד א'],
  [/ע["״]ב/g, 'עמוד ב'],
  [/ב["״]ק/g, 'בבא קמא'],
  [/ב["״]מ/g, 'בבא מציעא'],
  [/ב["״]ב/g, 'בבא בתרא'],
  [/ע["״]ז/g, 'עבודה זרה'],
  [/ש["״]ע/g, 'שולחן ערוך'],
  [/שו["״]ע/g, 'שולחן ערוך'],
];

/**
 * Direct Aramaic, Mishnaic Hebrew & Torah technical terms -> Professional Georgian Torah & Talmud Equivalents
 */
const ARAMAIC_HEBREW_SCHOLARLY_GLOSSARY: Record<string, string> = {
  'מאימתי': 'რა დროიდან (מאימתי — მიშნის საწყისი კითხვა)',
  'תנא היכא קאי': 'რა წყაროს ეყრდნობა თანა (תנא היכא קאי)',
  'מנא הני מילי': 'საიდან მომდინარეობს ეს ჰალახა თორის ფასუკიდან (מנא הני מילי)',
  'מנא לן': 'საიდან ვსწავლობთ ამას თორაში (מנא לן)',
  'מאי טעמא': 'რა არის ჰალახური საფუძველი და მიზეზი (מאי טעמא)',
  'תנו רבנן': 'სწავლობდნენ ჩვენი ბრძენნი ბარაითაში (תנו רבנן)',
  'תנן': 'ვსწავლობთ მიშნაში (תנן)',
  'תניא': 'ნასწავლია ბარაითაში (תניא)',
  'אתמר': 'ითქვა ამორაიმთა შორის (אתמר)',
  'גופא': 'დავუბრუნდეთ თავად ძირითად ტექსტს (גופא)',
  'קא משמע לן': 'ეს გვასწავლის და გვიცხადებს ჩვენ (קא משמע לן)',
  'שמע מינה': 'აქედან ვასკვნით ჰალახურად (שמע מינה)',
  'תיובתא': 'გადამწყვეტი თალმუდური უარყოფაა (תיובתא)',
  'תיקו': 'საკითხი გადაუჭრელი რჩება — თეიკუ (תיקו)',
  'הלכתא': 'დადგენილი ჰალახაა (הלכתא)',
  'תא שמע': 'მოდი და ისმინე ჰალახური მტკიცებულება წყაროდან (תא שמע)',
  'איבעיא להו': 'ბეთ ჰამიდრაშში დაისვა ჰალახური კითხვა (איבעיא להו)',
  'בשלמא': 'გასაგებია სუგიის მიხედვით (בשלמא)',
  'אלא': 'მაგრამ აქ ჩნდება კითხვა (אלא)',
  'מיתיבי': 'შეეპასუხნენ ბრძენნი წყაროდან (מיתיבי)',
  'ורמינהו': 'დაუპირისპირეს წყაროები ერთმანეთს (ורמינהו)',
  'קל וחומר': 'კალ ვახომერი — მსჯელობა მცირიდან დიდზე (קל וחומר)',
  'גזירה שווה': 'გეზერა შავა — თორის ფასუკთა სიტყვიერი ანალოგია (גזירה שווה)',
  'מדאורייתא': 'მიდეორაითა — თორის კანონით (מדאורייתא)',
  'מדרבנן': 'მიდერაბანან — ბრძენთა დადგენილებით (מדרבנן)',
  'קריאת שמע': 'კრიათ შემაყ — შემაყ ისრაელის წაკითხვა (קריאת שמע)',
  'תרומה': 'თრუმა — ქოჰენის წმინდა ძღვენი (תרומה)',
  'כהן': 'ქოჰენი (כהן)',
  'כהנים': 'ქოჰენები (כהנים)',
  'כהן גדול': 'ქოჰენ გადოლი — უმაღლესი ქოჰენი (כהן גדול)',
  'פתיחת הארון': 'ფეთიხათ ჰაარონი — ჰეხალის / არონ ჰაკოდეშის გახსნა (פתיחת הארון)',
  'פתיחה': 'ფეთიხა (פתיחה)',
  'אברך': 'აბრეხი — თორის ახალგაზრდა ბრძენი (אברך)',
  'ספר תורה': 'სეფერ თორა (ספר תורה)',
  'עליה לתורה': 'ყალია — სეფერ თორაზე ასვლა (עליה לתורה)',
  'מוסיף': 'დამატებითი / მოსიფ (מוסיף)',
  'צאת הכוכבים': 'ცეთ ჰაქოხავიმი — ვარსკვლავების გამოსვლა (צאת הכוכבים)',
  'עמוד השחר': 'ყამუდ ჰაშახარი — ცისკრის ამოსვლა (עמוד השחר)',
  'בין השמשות': 'ბენ ჰაშმაშოთი — ბინდის გარდამავალი დრო (בין השמשות)',
  'בית המקדש': 'ბეთ ჰამიკდაში — იერუსალიმის წმინდა ტაძარი (בית המקדש)',
  'בית דין': 'ბეთ დინი — რაბინული სასამართლო (בית דין)',
  'בית המדרש': 'ბეთ ჰამიდრაში — თორის სასწავლო სახლი (בית המדרש)',
  'הקדוש ברוך הוא': 'ჰაკადოშ ბარუხ ჰუ — წმინდაა იგი, კურთხეული (הקדוש ברוך הוא)',
  'שכינה': 'შეხინა — ღვთაებრივი თანდასწრება (שכינה)',
  'משנה': 'მიშნა — ზეპირი თორის საფუძველი (משנה)',
  'גמרא': 'გემარა — თალმუდური ანალიზი და სუგია (גמרא)',
  'רשי': 'რაში — რაბი შლომო იცხაკის კომენტარი (רש״י)',
  'תוספות': 'თოსაფოთი — ფრანგ-გერმანელ ბრძენთა დიალექტიკური კომენტარი (תוספות)',
};

export function stripTalmudicReferenceHintsForTranslation(text: string): string {
  if (!text) return '';
  return (
    text
      // 1. Strip reversed PDF visual-order parenthetical hints like )דף לג.( or )סנהדרין דף קיג.(
      .replace(/\)[^()]{1,55}\(/g, ' ')
      // 2. Strip standard parenthetical citations/hints like (דף לג.), (.דף לג), (ברכות לג.), (שם), (א)
      .replace(/\([^()]{1,55}\)/g, ' ')
      // 3. Strip square-bracketed gloss/footnote markers like [א], [ב], [שם]
      .replace(/\[[^[\]]{1,40}\]/g, ' ')
      // 4. Strip unmatched single-letter or digit footnote markers like (א or א) or [א or א]
      .replace(/(?:^|\s)[(\[][\u05D0-\u05EA0-9]{1,2}(?=\s|$)/g, ' ')
      .replace(/(?:^|\s)[\u05D0-\u05EA0-9]{1,2}[)\]](?=\s|$)/g, ' ')
      // 5. Strip inline standalone Daf citations like "דף לג." or "דף כח:" or "דף טז ע״א"
      .replace(/\bדף\s+[\u05D0-\u05EA]{1,3}[.:]?(?:\s+ע["״'][אב])?/g, ' ')
      // 6. Strip standalone reference pointers like ע"ש, וע"ש, כו', וכו'
      .replace(/\b(?:וע["״']ש|ע["״']ש|וכו['׳]?|כו['׳])\b/g, ' ')
      // 7. Strip leftover stray parentheses/brackets
      .replace(/[()[\]]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

export function expandHebrewAbbreviations(text: string): string {
  if (!text) return '';
  let out = stripTalmudicReferenceHintsForTranslation(text).replace(/[\u0591-\u05C7]/g, '');
  for (const [pattern, replacement] of ABBREVIATION_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/[״׳]/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Pre-processes Sefaria English Talmud & Torah strings so literal secular idioms
 * become authentic Torah & Talmud specification terminology before translation into Georgian.
 */
export function prepareEnglishTalmudForScholarlyTranslation(enText: string): string {
  if (!enText) return '';
  return stripEmbeddedHebrewFromEnglish(enText)
    .replace(/\bGEMARA\b/g, 'Gemara:')
    .replace(/\bMISHNA\b/g, 'Mishnah:')
    .replace(/\bMISHNAH\b/g, 'Mishnah:')
    .replace(/\bThe Sages taught in a baraita\b/gi, 'In the Baraita our Rabbis taught')
    .replace(/\bThe Sages taught\b/gi, 'In the Baraita our Rabbis taught (Tanu Rabbanan)')
    .replace(/\bIt was taught in a baraita\b/gi, 'It was taught in a Baraita (Tanya)')
    .replace(/\bWe learned in a mishna\b/gi, 'We learned in the Mishnah (Tenan)')
    .replace(/\bWe learned in the mishna\b/gi, 'We learned in the Mishnah (Tenan)')
    .replace(/\bFrom where are these matters derived\b/gi, 'From which Torah Pasuk is this Halakha derived')
    .replace(/\bFrom where do we derive\b/gi, 'From which Torah Pasuk do we derive')
    .replace(/\bWhat is the reason\b/gi, 'What is the Halakhic reason (Mai Taama)')
    .replace(/\bCome and hear\b/gi, 'Come and hear a Halakhic proof (Ta Shma)')
    .replace(/\bConclude from it\b/gi, 'Conclude the Halakha from it (Shma Mina)')
    .replace(/\bA dilemma was raised before them\b/gi, 'A Halakhic question was raised in the Beit Midrash')
    .replace(/\ba fortiori\b/gi, 'Kal VaChomer (a fortiori inference)')
    .replace(/\bverbal analogy\b/gi, 'Gezerah Shavah (Torah verbal analogy)')
    .replace(/\bby Torah law\b/gi, 'by Torah law (Mideoraita)')
    .replace(/\bby rabbinic law\b/gi, 'by Rabbinic enactment (Miderabbanan)')
    .replace(/\bHigh Priest\b/gi, 'Kohen Gadol')
    .replace(/\bpriests\b/gi, 'Kohanim')
    .replace(/\bpriest\b/gi, 'Kohen')
    .replace(/\bteruma\b/gi, 'Terumah (sacred Kohen portion)')
    .replace(/\bheave-offering\b/gi, 'Terumah')
    .replace(/\btithe\b/gi, 'Maaser (tithe)')
    .replace(/\bphylacteries\b/gi, 'Tefillin')
    .replace(/\bfringes\b/gi, 'Tzitzit')
    .replace(/\bdoorpost scroll\b/gi, 'Mezuzah')
    .replace(/\bRecitation of Shema\b/gi, 'Kriyat Shema')
    .replace(/\bShema\b/g, 'Kriyat Shema')
    .replace(/\bGrace After Meals\b/gi, 'Birkat HaMazon (Grace After Meals)')
    .replace(/\bstanding prayer\b/gi, 'Amidah (Shmoneh Esrei prayer)')
    .replace(/\bDivine Presence\b/gi, 'Shekhinah (Divine Presence)')
    .replace(/\bHoly One, Blessed be He\b/gi, 'HaKadosh Baruch Hu')
    .replace(/\bTorah scroll\b/gi, 'Sefer Torah')
    .replace(/\bverse\b/gi, 'Torah Pasuk')
    .replace(/\bverses\b/gi, 'Torah Pesukim')
    .replace(/\bleavened bread\b/gi, 'Chametz')
    .replace(/\bunleavened bread\b/gi, 'Matzah')
    .replace(/\britual bath\b/gi, 'Mikveh')
    .replace(/\britual impurity\b/gi, 'ritual impurity (Tumah)')
    .replace(/\britually impure\b/gi, 'ritually impure (Tamei)')
    .replace(/\britually pure\b/gi, 'ritually pure (Tahor)')
    .replace(/\bHoly Temple\b/gi, 'Beit HaMikdash (Holy Temple)')
    .replace(/\bstudy hall\b/gi, 'Beit HaMidrash');
}

/**
 * Strips any stray Hebrew characters/nikud that got mixed into Georgian or Latin words
 * and enforces authentic Professional Torah & Talmudic Georgian terminology across all grammatical cases:
 * ("ქოჰენი", "ფეთიხა", "აბრეხი", "თრუმა", "კრიათ შემაყ", "მიშნა", "გემარა", "ბარაითა", "სუგია", "ჰალახა", "ფასუკი", "სეფერ თორა").
 */
export function normalizeGeorgianJewishTerms(text: string): string {
  if (!text) return '';
  return text
    .replace(/ოვაдия/g, 'ყოვადია')
    .replace(/ოვადია/g, 'ყოვადია')
    .replace(/შაარ ჰაციuni/g, 'შაყარ ჰაციუნი')
    .replace(/შაარ ჰაციუნ/g, 'შაყარ ჰაციუნ')
    .replace(/რავ ბენ ציון/g, 'რავ ბენ-ციონ')
    .replace(/სიمانიმის/g, 'სიმანიმის')
    .replace(/იაბია ომერ/g, 'იაბიაყ ომერ')
    .replace(/იახვე დაათ/g, 'იახვე დაყათ')
    .replace(/ეინ მიშპატ/g, 'ყეინ მიშპატ')
    .replace(/ეინ იაკოვ/g, 'ყეინ იაყკოვ')
    // Convert any Latin/English scholarly terms directly into Georgian before stripping stray Latin
    .replace(/\bHaKadosh Baruch Hu\b/gi, 'ჰაკადოშ ბარუხ ჰუ')
    .replace(/\bBeit HaMikdash\b/gi, 'ბეთ ჰამიკდაში')
    .replace(/\bBeit HaMidrash\b/gi, 'ბეთ ჰამიდრაში')
    .replace(/\bBeit Din\b/gi, 'ბეთ დინი')
    .replace(/\bKriyat Shema\b/gi, 'კრიათ შემაყ')
    .replace(/\bBirkat HaMazon\b/gi, 'ბირქათ ჰამაზონი')
    .replace(/\bShmoneh Esrei\b/gi, 'შმონე ესრე')
    .replace(/\bSefer Torah\b/gi, 'სეფერ თორა')
    .replace(/\bTorah Pasuk\b/gi, 'თორის ფასუკი')
    .replace(/\bTorah Pesukim\b/gi, 'თორის ფასუკები')
    .replace(/\bKohen Gadol\b/gi, 'ქოჰენ გადოლი')
    .replace(/\bKohanim\b/gi, 'ქოჰენები')
    .replace(/\bKohen\b/gi, 'ქოჰენი')
    .replace(/\bTerumah\b/gi, 'თრუმა')
    .replace(/\bMaaser\b/gi, 'მაასერი')
    .replace(/\bTefillin\b/gi, 'თფილინი')
    .replace(/\bTzitzit\b/gi, 'ციცითი')
    .replace(/\bMezuzah\b/gi, 'მეზუზა')
    .replace(/\bShekhinah\b/gi, 'შეხინა')
    .replace(/\bShechinah\b/gi, 'შეხინა')
    .replace(/\bChametz\b/gi, 'ხამეცი')
    .replace(/\bMatzah\b/gi, 'მაცა')
    .replace(/\bMikveh\b/gi, 'მიკვე')
    .replace(/\bMideoraita\b/gi, 'მიდეორაითა')
    .replace(/\bMiderabbanan\b/gi, 'მიდერაბანან')
    .replace(/\bKal VaChomer\b/gi, 'კალ ვახომერი')
    .replace(/\bGezerah Shavah\b/gi, 'გეზერა შავა')
    .replace(/\bTanu Rabbanan\b/gi, 'თანუ რაბანან')
    .replace(/\bMai Taama\b/gi, 'მაი ტაყამა')
    .replace(/\bTa Shma\b/gi, 'თა შმაყ')
    .replace(/\bShma Mina\b/gi, 'შმაყ მინა')
    .replace(/\bBaraita\b/gi, 'ბარაითა')
    .replace(/\bMishnah\b/gi, 'მიშნა')
    .replace(/\bMishna\b/gi, 'მიშნა')
    .replace(/\bGemara\b/gi, 'გემარა')
    .replace(/\bTalmud\b/gi, 'თალმუდი')
    .replace(/\bTorah\b/gi, 'თორა')
    .replace(/\bPasuk\b/gi, 'ფასუკი')
    .replace(/\bPesukim\b/gi, 'ფასუკები')
    .replace(/\bHalakha\b/gi, 'ჰალახა')
    .replace(/\bHalacha\b/gi, 'ჰალახა')
    .replace(/\bRashi\b/gi, 'რაში')
    .replace(/\bTosafot\b/gi, 'თოსაფოთი')
    .replace(/\bOnkelos\b/gi, 'ონკელოსი')
    .replace(/\bRamban\b/gi, 'რამბანი')
    .replace(/\bNachmanides\b/gi, 'რამბანი')
    .replace(/\bIbn Ezra\b/gi, 'იბნ ეზრა')
    .replace(/\bBaal HaTurim\b/gi, 'ბაალ ჰატურიმი')
    .replace(/\bSforno\b/gi, 'სფორნო')
    .replace(/\bShabbat\b/gi, 'შაბათი')
    .replace(/\bSukkot\b/gi, 'სუკოთი')
    .replace(/\bPesach\b/gi, 'ფესახი')
    .replace(/\bShavuot\b/gi, 'შავუოთი')
    .replace(/\bRosh Hashanah\b/gi, 'როშ ჰაშანა')
    .replace(/\bYom Kippur\b/gi, 'იომ ქიფური')
    .replace(/\bMoses\b/gi, 'მოშე')
    .replace(/\bMoshe\b/gi, 'მოშე')
    .replace(/\bAaron\b/gi, 'აჰარონი')
    .replace(/\bAharon\b/gi, 'აჰარონი')
    .replace(/\bIsrael\b/gi, 'ისრაელი')
    .replace(/\bYisrael\b/gi, 'ისრაელი')
    // 1. If a Hebrew letter or nikud got glued INSIDE a Georgian or Latin/Cyrillic word, remove it without splitting the word!
    .replace(/([\u10A0-\u10FFa-zA-Z\u0400-\u04FF])[\u0590-\u05FF\uFB1D-\uFB4F״׳']+([\u10A0-\u10FFa-zA-Z\u0400-\u04FF])/g, '$1$2')
    .replace(/([\u10A0-\u10FFa-zA-Z\u0400-\u04FF])[\u0590-\u05FF\uFB1D-\uFB4F״׳']+/g, '$1')
    .replace(/[\u0590-\u05FF\uFB1D-\uFB4F״׳']+([\u10A0-\u10FFa-zA-Z\u0400-\u04FF])/g, '$1')
    // 2. Remove any remaining standalone Hebrew letters or nikud marks inside Georgian prose
    .replace(/[\u0590-\u05FF\uFB1D-\uFB4F״׳]+/g, ' ')
    .replace(/\s*[-–—]\s*[-–—]+\s*/g, ' — ')
    .replace(/\(\s*[,.;:-]*\s*\)/g, '')
    .replace(/\[\s*[,.;:-]*\s*\]/g, '')
    .replace(/«\s*»/g, '')
    .replace(/„\s*“/g, '')
    .replace(/""/g, '')
    // 3. Enforce authentic Georgian Torah & Talmudic specification terminology & strict transliteration rules (ע=ყ, ק=კ, ת=ת, כ=ქ, ב=ბ/ვ, פ=ფ, ט=ט):
    .replace(/იეჰოშუა\s*\(იესო ნავეს ძე\)/g, 'იეჰოშუაყ')
    .replace(/იესო ნავეს ძე/g, 'იეჰოშუაყ')
    .replace(/იეჰოშუა(?!ყ)/g, 'იეჰოშუაყ')
    .replace(/შულხან არუხ/g, 'შულხან ყარუხ')
    .replace(/იორე დეა/g, 'იორე დეყა')
    .replace(/ებენ ჰაეზერ/g, 'ებენ ჰაყეზერ')
    .replace(/კოჰენ/g, 'ქოჰენ')
    .replace(/კოენ/g, 'ქოჰენ')
    .replace(/მღვდელმთავარ/g, 'ქოჰენ გადოლ')
    .replace(/უმაღლესი მღვდელ/g, 'ქოჰენ გადოლ')
    .replace(/მღვდლებ/g, 'ქოჰენებ')
    .replace(/მღვდელ/g, 'ქოჰენ')
    .replace(/პეტიხა/g, 'ფეთიხა')
    .replace(/ფეტიხა/g, 'ფეთიხა')
    .replace(/ავრეხ/g, 'აბრეხ')
    .replace(/ტერუმა/g, 'თრუმა')
    .replace(/თერუმა/g, 'თრუმა')
    .replace(/ტეფილინ/g, 'თფილინ')
    .replace(/ფილაქტერი/g, 'თფილინ')
    .replace(/კრიატ შმა/g, 'კრიათ შემაყ')
    .replace(/შემას კითხვა/g, 'კრიათ შემაყ')
    .replace(/შმას კითხვა/g, 'კრიათ შემაყ')
    .replace(/შემას წაკითხვა/g, 'კრიათ შემაყ')
    .replace(/თორის გრაგნილ/g, 'სეფერ თორ')
    .replace(/თორას გრაგნილ/g, 'სეფერ თორ')
    .replace(/წმინდა წერილის ლექს/g, 'თორის ფასუკ')
    .replace(/ბიბლიური ლექს/g, 'თორის ფასუკ')
    .replace(/თორის ლექს/g, 'თორის ფასუკ')
    .replace(/უფუარი პურ/g, 'მაც')
    .replace(/საფუვრიანი პურ/g, 'ხამეც')
    .replace(/რიტუალურ აბაზან/g, 'მიკვე')
    .replace(/სასწავლო დარბაზ/g, 'ბეთ ჰამიდრაშ')
    .replace(/წმინდა ტაძარ/g, 'ბეთ ჰამიკდაშ')
    .replace(/ღვთაებრივი თანდასწრებ/g, 'შეხინა — ღვთაებრივი თანდასწრებ')
    .replace(/ბარაიტ/g, 'ბარაით')
    .replace(/ჰალახურ კანონ/g, 'ჰალახ')
    .replace(/ტოსაფოტ/g, 'თოსაფოთ')
    .replace(/ტოსაფოთ/g, 'თოსაფოთ')
    .replace(/\s+([,.;:?!])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Ensures that Hebrew text tokens never have Georgian, Latin, or Cyrillic characters mixed inside the same word or sentence.
 */
export function sanitizePureHebrewText(text: string): string {
  if (!text) return '';
  return text
    .replace(/([\u0590-\u05FF\uFB1D-\uFB4F]+)[\u10A0-\u10FFa-zA-Z\u0400-\u04FF]+([\u0590-\u05FF\uFB1D-\uFB4F]+)/g, '$1$2')
    .replace(/([\u0590-\u05FF\uFB1D-\uFB4F]+)[\u10A0-\u10FFa-zA-Z\u0400-\u04FF]+/g, '$1')
    .replace(/[\u10A0-\u10FFa-zA-Z\u0400-\u04FF]+([\u0590-\u05FF\uFB1D-\uFB4F]+)/g, '$1')
    .replace(/[A-Za-z]+/g, '')
    .replace(/\(\s*[,.;:-]*\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeGeorgianText(text: string): string {
  return normalizeGeorgianJewishTerms(text);
}

/**
 * Cleans Sefaria English strings (which interleave bold Hebrew words inside English sentences)
 * so that only clean English sentences are sent to the translator.
 */
export function stripEmbeddedHebrewFromEnglish(enText: string): string {
  if (!enText) return '';
  return enText
    .replace(/[\u0590-\u05FF\uFB1D-\uFB4F״׳]+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function containsLatinButNoGeorgian(text: string): boolean {
  if (!text) return false;
  const hasLatin = /[A-Za-z]{4,}/.test(text);
  return hasLatin;
}

export function containsHebrewInsideGeorgian(text: string): boolean {
  if (!text) return false;
  return /[\u10A0-\u10FF]/.test(text) && /[\u0590-\u05FF]/.test(text);
}

/**
 * Professional Torah & Talmud Specification Translation via Server-Side Gemini Scholar Endpoint
 * with instant fallback to the Torah/Talmud Terminology Pipeline.
 */
export async function translateWithTorahTalmudSpecServer(
  text: string,
  options?: {
    hebrewOriginal?: string;
    sectionType?: 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'torah' | 'meforshim';
    tractate?: string;
    daf?: string;
    targetLang?: UILang;
  }
): Promise<string> {
  const raw = (text || '').trim();
  const heOrig = (options?.hebrewOriginal || '').trim();
  if (!raw && !heOrig) return '';

  const targetLang = options?.targetLang || 'ka';
  const secType = options?.sectionType || 'gemara';
  const cacheKey = `prof-spec:${targetLang}:${secType}:${(heOrig || raw).slice(0, 500)}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(getBackendUrl('/api/talmud/translate-professional'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: raw,
        hebrewOriginal: heOrig,
        sectionType: secType,
        tractate: options?.tractate || '',
        daf: options?.daf || '',
        targetLang,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.translation) {
        const cleaned =
          targetLang === 'ka'
            ? normalizeGeorgianJewishTerms(String(data.translation))
            : String(data.translation).trim();
        if (cleaned) {
          persistCacheEntry(cacheKey, cleaned);
          return cleaned;
        }
      }
    }
  } catch {
    // Fallback to live Torah/Talmud specification pipeline
  }

  return targetLang === 'ka'
    ? translateToGeorgianLive(raw || heOrig, raw && /[A-Za-z]{4,}/.test(raw) ? 'en' : 'iw')
    : translateTextToLangLive(raw || heOrig, targetLang, 'auto');
}

export interface TalmudTranslationContext {
  tractate?: string;
  daf?: string;
  section?: string;
  englishHint?: string;
}

export async function translateToGeorgianLive(
  text: string,
  sourceLang: 'iw' | 'en' | 'auto' = 'auto',
  context?: TalmudTranslationContext
): Promise<string> {
  const raw = (text || '').trim();
  if (!raw) return '';

  // Check exact Aramaic/Hebrew scholarly glossary match first
  const unvocalized = raw.replace(/[\u0591-\u05C7״׳".,;:?!]/g, '').trim();
  if (ARAMAIC_HEBREW_SCHOLARLY_GLOSSARY[unvocalized]) {
    return ARAMAIC_HEBREW_SCHOLARLY_GLOSSARY[unvocalized];
  }

  // Check Siddur canonical line translation or word lexicon
  if (/[\u0590-\u05FF]/.test(raw)) {
    const siddurLineKa = lookupSiddurLineTranslationKa(raw);
    if (siddurLineKa) {
      return siddurLineKa;
    }
    const repairedWord = repairSiddurOcrWord(unvocalized);
    if (SIDDUR_WORD_LEXICON[repairedWord]) {
      return SIDDUR_WORD_LEXICON[repairedWord].translationKa;
    }
    if (SIDDUR_WORD_LEXICON[unvocalized]) {
      return SIDDUR_WORD_LEXICON[unvocalized].translationKa;
    }
  }

  // If already in Georgian and doesn't have raw English sentences, strip any stray Hebrew & return normalized
  if (/[\u10A0-\u10FF]/.test(raw) && !/[A-Za-z]{4,}/.test(raw)) {
    return normalizeGeorgianJewishTerms(raw);
  }

  // 1. TOP TIER: Call backend Gemini AI Translation module (specialized in combined Talmudic Hebrew + Jewish Babylonian Aramaic)
  if (/[\u0590-\u05FF]/.test(raw)) {
    const aiCacheKey = `ka:gemini-v1:${context?.tractate || ''}:${context?.daf || ''}:${context?.section || ''}:${raw.slice(0, 400)}`;
    if (translationCache.has(aiCacheKey)) {
      return translationCache.get(aiCacheKey)!;
    }

    try {
      const res = await fetch(getBackendUrl('/api/talmud/translate-professional'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hebrewOriginal: raw,
          tractate: context?.tractate || '',
          daf: context?.daf || '',
          sectionType: context?.section || 'gemara',
          text: context?.englishHint || '',
          targetLang: 'ka',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.translation && /[\u10A0-\u10FF]/.test(data.translation)) {
          const geminiKa = normalizeGeorgianJewishTerms(data.translation)
            .replace(/[A-Za-z]{3,}/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          if (geminiKa) {
            persistCacheEntry(aiCacheKey, geminiKa);
            return geminiKa;
          }
        }
      }
    } catch {
      // Backend not reached or offline; fall through to local pipeline
    }
  }

  // Prepare source text with Torah & Talmud scholarly specification
  let cleanSource = raw;
  let effectiveSl = sourceLang;
  if (sourceLang === 'en' || /[A-Za-z]{4,}/.test(raw)) {
    const scholarlyEn = prepareEnglishTalmudForScholarlyTranslation(raw);
    if (scholarlyEn.length >= 3) {
      cleanSource = scholarlyEn;
      effectiveSl = 'en';
    }
  } else {
    const repairedHe = repairSiddurOcrLine(raw);
    const siddurLineRepairedKa = lookupSiddurLineTranslationKa(repairedHe);
    if (siddurLineRepairedKa) {
      return siddurLineRepairedKa;
    }
    cleanSource = expandHebrewAbbreviations(repairedHe);
  }

  const cacheKey = `ka:scholarly-v3:${effectiveSl}:${cleanSource.slice(0, 600)}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${effectiveSl}&tl=ka&dt=t&q=${encodeURIComponent(
      cleanSource.slice(0, 1350)
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const rawKa = data[0]
          .map((part: unknown) => (Array.isArray(part) ? String(part[0] || '') : ''))
          .join('');
        const finalKa = normalizeGeorgianJewishTerms(rawKa).replace(/[A-Za-z]{3,}/g, '').replace(/\s{2,}/g, ' ').trim();
        if (finalKa && /[\u10A0-\u10FF]/.test(finalKa)) {
          persistCacheEntry(cacheKey, finalKa);
          return finalKa;
        }
      }
    }
  } catch {
    // ignore network failure
  }

  const fallbackNormalized = normalizeGeorgianJewishTerms(raw).replace(/[A-Za-z]{3,}/g, '').replace(/\s{2,}/g, ' ').trim();
  return /[\u10A0-\u10FF]/.test(fallbackNormalized) ? fallbackNormalized : '';
}

export async function translateTalmudicLineLive(options: {
  text: string;
  tractate?: string;
  daf?: string;
  section?: string;
  englishHint?: string;
}): Promise<string> {
  return translateToGeorgianLive(options.text, 'iw', options);
}

/**
 * Translates any text into the requested target language with Torah & Talmudic specification:
 * 'ka' (Georgian), 'he' (Hebrew), 'en' (English), 'ru' (Russian), 'fr' (French), 'es' (Spanish), 'de' (German)
 */
export async function translateTextToLangLive(
  text: string,
  targetLang: UILang,
  sourceLang: 'iw' | 'en' | 'ka' | 'auto' = 'auto'
): Promise<string> {
  const raw = (text || '').trim();
  if (!raw) return '';
  if (targetLang === 'ka') {
    return translateToGeorgianLive(
      raw,
      sourceLang === 'ka' ? 'auto' : sourceLang
    );
  }
  if (targetLang === 'he') {
    return translateToModernHebrewLive(raw);
  }

  // For 'en', 'ru', 'fr', 'es', 'de': clean any embedded Hebrew if input is mixed English+Hebrew
  let cleanSource = raw;
  if (/[A-Za-z]{4,}/.test(raw) && /[\u0590-\u05FF]/.test(raw)) {
    cleanSource = prepareEnglishTalmudForScholarlyTranslation(raw) || raw;
  } else if (/[\u0590-\u05FF]/.test(raw) && !/[\u10A0-\u10FF]/.test(raw)) {
    cleanSource = expandHebrewAbbreviations(raw);
  }

  if (targetLang === 'en' && /^[A-Za-z0-9\s.,;:'"?!()-]+$/.test(cleanSource)) {
    return cleanSource;
  }

  const cacheKey = `${targetLang}:scholarly-v3:${sourceLang}:${cleanSource.slice(0, 500)}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      cleanSource.slice(0, 1200)
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((part: unknown) => (Array.isArray(part) ? String(part[0] || '') : ''))
          .join('')
          .replace(/[\u0590-\u05FF\uFB1D-\uFB4F]+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (translated) {
          persistCacheEntry(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch {
    // ignore
  }

  return cleanSource;
}

export async function translateToModernHebrewLive(text: string): Promise<string> {
  const clean = (text || '').trim();
  if (!clean) return '';

  const unvocalized = clean.replace(/[\u0591-\u05C7״׳".,;:?!]/g, '').trim();
  const expanded = expandHebrewAbbreviations(clean);
  if (expanded !== unvocalized && /[\u0590-\u05FF]/.test(expanded)) {
    return `${expanded} (ביאור עברי מדויק לפי פירוש רש״י והגמרא)`;
  }

  const cacheKey = `he:${clean.slice(0, 500)}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=iw&dt=t&q=${encodeURIComponent(
      clean.slice(0, 1000)
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const rawHe = data[0]
          .map((part: unknown) => (Array.isArray(part) ? String(part[0] || '') : ''))
          .join('');
        if (rawHe) {
          persistCacheEntry(cacheKey, rawHe);
          return rawHe;
        }
      }
    }
  } catch {
    // ignore
  }

  return clean;
}

// ============================================================================
// 3-STAGE SCHOLARLY HEBREW & ARAMAIC TO GEORGIAN PHONETIC TRANSLITERATION ENGINE
// Solves accurate pronunciation for BOTH unvocalized (no nikud) & vocalized words
// ============================================================================

const HEBREW_ABBREV_TRANSLIT_MAP: Record<string, string> = {
  'גמ׳': 'გემარა',
  'מתני׳': 'მათნითინ (მიშნა)',
  'רש״י': 'რაში',
  'תוס׳': 'თოსაფოთი',
  'ד״ה': 'დიბურ ჰამათხილ',
  'בא״ד': 'ბეოთან დიბურ',
  'ע״א': 'ყამუდ ალეფი',
  'ע״ב': 'ყამუდ ბეთი',
  'ר״ה': 'როშ ჰაშანა',
  'יו״ט': 'იომ ტოვი',
  'ב״ה': 'ბეთ ჰილელი',
  'ב״ש': 'ბეთ შამაი',
  'ת״ר': 'თანუ რაბანან',
  'ת״ש': 'თა შემაყ',
  'א״ר': 'ამარ რაბი',
  'קמ״ל': 'კამაშმაყ ლან',
  'מ״ט': 'მაი ტაყამა',
  'ש״מ': 'შემაყ მინა',
  'ה״נ': 'ჰახი ნამი',
  'ה״ק': 'ჰახი კაამარ',
  'כ״ש': 'ქოლ შექენ',
  'ק״ו': 'კალ ვახომერ',
  'גז״ש': 'გზერა შავა',
  'ב״ד': 'ბეთ დინი',
  'כה״ג': 'ქოჰენ გადოლი',
  'בהמ״ק': 'ბეთ ჰამიკდაში',
  'הקב״ה': 'ჰაკადოშ ბარუხ ჰუ',
  'רמב״ם': 'რამბამი',
  'שו״ע': 'შულხან ყარუხი',
  'או״ח': 'ორახ ხაიმი',
  'יו״ד': 'იორე დეყა',
  'אה״ע': 'ებენ ჰაყეზერი',
  'חו״מ': 'ხოშენ მიშფატი',
  'ב״ק': 'ბაბა კამა',
  'ב״מ': 'ბაბა მეციყა',
  'ב״ב': 'ბაბა ბათრა',
  'ע״ז': 'ყავოდა ზარა',
  'מ״ק': 'მოყედ კატანი',
};

const UNVOCALIZED_PHONETIC_LEXICON: Record<string, string> = {
  // Core Mishnah & Gemara (Berakhot, Taanit, Shabbat, Bava Metzia, Shas)
  מאימתי: 'მეიმათაი',
  קורין: 'კორინ',
  קוראים: 'კორაიმ',
  את: 'ეთ',
  שמע: 'შემაყ',
  בערבית: 'ბეყარვით',
  ערבית: 'ყარვით',
  בשחרית: 'ბეშახრით',
  שחרית: 'შახრით',
  מנחה: 'მინხა',
  במנחה: 'ბემინხა',
  מוסף: 'მუსაფ',
  במוסף: 'ბემუსაფ',
  נעילה: 'ნეყილა',
  משעה: 'მიშაყა',
  שעה: 'შაყა',
  שהכהנים: 'შეჰაქოჰანიმ',
  הכהנים: 'ჰაქოჰანიმ',
  כהנים: 'ქოჰანიმ',
  כהן: 'ქოჰენ',
  הכהן: 'ჰაქოჰენ',
  נכנסים: 'ნიხნასიმ',
  נכנסין: 'ნიხნასინ',
  לאכול: 'ლეეხოლ',
  בתרומתן: 'ბითრუმათან',
  תרומתן: 'თრუმათან',
  תרומה: 'თრუმა',
  בתרומה: 'ბითრუმა',
  עד: 'ყად',
  סוף: 'სოფ',
  האשמורת: 'ჰააშმორეთ',
  אשמורת: 'აშმორეთ',
  הראשונה: 'ჰარიშონა',
  ראשונה: 'რიშონა',
  ראשון: 'რიშონ',
  הראשון: 'ჰარიშონ',
  דברי: 'დივრეი',
  רבי: 'რაბი',
  רב: 'რავ',
  רבן: 'რაბან',
  רבנן: 'რაბანან',
  אליעזר: 'ელიყეზერ',
  יהושע: 'იეჰოშუაყ',
  גמליאל: 'გამლიელ',
  יהודה: 'იეჰუდა',
  מאיר: 'მეირ',
  יוסי: 'იოსი',
  שמעון: 'შიმყონ',
  עקיבא: 'ყაკივა',
  נחמיה: 'ნეხემია',
  טרפון: 'ტარფონ',
  ישמעאל: 'იშმაყელ',
  יוחנן: 'იოხანან',
  שמואל: 'შმუელ',
  אביי: 'აბაიე',
  רבא: 'რავა',
  רבבה: 'რაბა',
  רבה: 'რაბა',
  יוסף: 'იოსეფ',
  נחמן: 'ნახმან',
  יצחק: 'იცხაკ',
  ששת: 'შეშეთ',
  חסדא: 'ხისდა',
  הונא: 'ჰუნა',
  פפא: 'ფაფა',
  אשי: 'აში',
  רבינא: 'რავინა',
  זירא: 'ზეირა',
  כהנא: 'ქაჰანა',
  וחכמים: 'ვახახამიმ',
  חכמים: 'ხახამიმ',
  החכמים: 'ჰახახამიმ',
  אומרים: 'ომრიმ',
  אומר: 'ომერ',
  אמרו: 'ამრუ',
  אמר: 'ამარ',
  חצות: 'ხაცოთ',
  עמוד: 'ყამუდ',
  השחר: 'ჰაშახარ',
  שחר: 'შახარ',
  מעשה: 'მაყასე',
  שבאו: 'შებაუ',
  באו: 'ბაუ',
  בניו: 'ბანავ',
  מבית: 'მიბეთ',
  בית: 'ბეთ',
  הבית: 'ჰაბაით',
  המשתה: 'ჰამიშთე',
  משתה: 'მიშთე',
  לו: 'ლო',
  לא: 'ლო',
  ולא: 'ველო',
  קרינו: 'კარინუ',
  להם: 'ლაჰემ',
  אם: 'იმ',
  עלה: 'ყალა',
  חייבין: 'ხაიავინ',
  חייבים: 'ხაიავიმ',
  חייב: 'ხაიავ',
  פטור: 'ფატურ',
  מותר: 'მუთარ',
  אסור: 'ასურ',
  אתם: 'ათემ',
  לקרות: 'ლიკროთ',
  זו: 'ზო',
  זה: 'ზე',
  זאת: 'ზოთ',
  בלבד: 'ბილვად',
  אלא: 'ელა',
  כל: 'ქოლ',
  מה: 'მა',
  שאמרו: 'შეამრუ',
  מצותן: 'მიცვათან',
  הקטר: 'ჰეკტერ',
  חלבים: 'ხელავიმ',
  ואיברים: 'ვეეივარიმ',
  איברים: 'ეივარიმ',
  נאכלין: 'ნეეხალინ',
  ליום: 'ლეიომ',
  מיום: 'მიიომ',
  יום: 'იომ',
  היום: 'ჰაიომ',
  יומא: 'იომა',
  אחד: 'ეხად',
  כן: 'ქენ',
  למה: 'ლამა',
  להרחיק: 'ლეჰარხიკ',
  האדם: 'ჰაადამ',
  אדם: 'ადამ',
  מן: 'მინ',
  העבירה: 'ჰაყავერა',
  עבירה: 'ყავერა',
  מזכירין: 'მაზქირინ',
  מזכיר: 'მაზქირ',
  להזכיר: 'ლეჰაზქირ',
  גבורות: 'გვუროთ',
  גשמים: 'გეშამიმ',
  הגשמים: 'ჰაგეშამიმ',
  גשם: 'გეშემ',
  הגשם: 'ჰაგეშემ',
  טוב: 'ტოვ',
  של: 'შელ',
  חג: 'ხაგ',
  החג: 'ჰახაგ',
  בחג: 'ბახაგ',
  ובחג: 'უვახაგ',
  לחג: 'ლახაგ',
  האחרון: 'ჰაახარონ',
  אחרון: 'ახარონ',
  הואיל: 'ჰოილ',
  ואין: 'ვეეინ',
  אין: 'ეინ',
  סימן: 'სიმან',
  קללה: 'კლალა',
  ברכה: 'ბერახა',
  ברכות: 'ბერახოთ',
  בברכת: 'ბევირქათ',
  ברכת: 'ბირქათ',
  מפני: 'მიფნეი',
  לפני: 'ლიფნეი',
  פניו: 'ფანავ',
  שאינו: 'შეეინო',
  אינו: 'ეინო',
  שואל: 'შოელ',
  שואלין: 'შოალინ',
  משיב: 'მაშივ',
  הרוח: 'ჰარუახ',
  רוח: 'რუახ',
  ומוריד: 'უმორიდ',
  מוריד: 'მორიდ',
  העובר: 'ჰაყოვერ',
  עובר: 'ყოვერ',
  התיבה: 'ჰათევა',
  תיבה: 'თევა',
  שבעה: 'შივყა',
  במרחשון: 'ბემარხეშვან',
  מרחשון: 'მარხეშვან',
  חמשה: 'ხამიშა',
  עשר: 'ყასარ',
  עשרה: 'ყესრე',
  שמונה: 'შმონე',
  בו: 'ბო',
  תנא: 'თანა',
  דתנא: 'დეთანა',
  תנן: 'თნან',
  דתנן: 'დეთნან',
  תניא: 'თანია',
  תנו: 'თანუ',
  תני: 'თანი',
  דקתני: 'დეკათანი',
  קתני: 'კათანი',
  וליתני: 'ველითნი',
  ליתני: 'ლითნი',
  היכא: 'ჰეიხა',
  קאי: 'კაი',
  התם: 'ჰათამ',
  הכא: 'ჰახა',
  בתחיית: 'ბითხიათ',
  תחיית: 'თხიათ',
  המתים: 'ჰამეთიმ',
  מתים: 'მეთიმ',
  השנים: 'ჰაშანიმ',
  שנים: 'შანიმ',
  وهבדלה: 'ვეჰავდალა',
  והבדלה: 'ვეჰავდალა',
  הבדלה: 'ჰავდალა',
  בחונן: 'ბეხონენ',
  חונן: 'ხონენ',
  הדעת: 'ჰადაყათ',
  דעת: 'დაყათ',
  מאי: 'მაი',
  שנא: 'შნა',
  דשבקה: 'დეშავკა',
  שבקה: 'შავკა',
  מראש: 'მიროშ',
  ראש: 'როშ',
  השנה: 'ჰაშანა',
  שנה: 'შანა',
  קא: 'კა',
  סליק: 'სალიკ',
  נידונין: 'ნიდონინ',
  על: 'ყალ',
  המים: 'ჰამაიმ',
  מים: 'მაიმ',
  ואיידי: 'ვეაიדי',
  איידי: 'აიדי',
  נמי: 'ნამი',
  גמרא: 'გემარა',
  משנה: 'მიშნა',
  תוספות: 'თოსაფოთი',
  חברותא: 'ხავრუთა',
  פירוש: 'ფერუშ',
  מפרשים: 'მეფორშიმ',
  כלומר: 'ქლომარ',
  דהיינו: 'დეჰაინუ',
  שליח: 'შალიახ',
  ציבור: 'ციბურ',
  הציבור: 'ჰაციბურ',
  הארון: 'ჰაარონ',
  ארון: 'არონ',
  תפילה: 'თეფილა',
  תפילת: 'თეფილათ',
  בתפילה: 'ბეთეფილა',
  סוכה: 'სუქა',
  בסוכה: 'ბესუქა',
  במסכת: 'ბემასეხეთ',
  מסכת: 'მასეხეთ',
  בפרק: 'ბეფერეკ',
  פרק: 'ფერეკ',
  משל: 'მაშალ',
  לעבד: 'ლეყევედ',
  עבד: 'ყევედ',
  שבא: 'შება',
  למזוג: 'ლიმზოგ',
  כוס: 'ქოს',
  לרבו: 'ლერაბო',
  רבו: 'რაბო',
  ושפך: 'ვეშაფახ',
  קיתון: 'კითონ',
  סדר: 'სედერ',
  בסדר: 'ბესედერ',
  מועד: 'მოყედ',
  זרעים: 'ზერაყიმ',
  נשים: 'ნაშიმ',
  נזיקין: 'ნეზიკინ',
  קדשים: 'კოდაშიმ',
  טהרות: 'ტაჰაროთ',
  שבת: 'შაბათ',
  בשבת: 'ბეშაბათ',
  עירובין: 'ყერუვინ',
  פסחים: 'ფესახიმ',
  ביצה: 'ბეიცა',
  מגילה: 'მეგილა',
  תענית: 'თაყანით',
  חגיגה: 'ხაგიგა',
  יבמות: 'იევამოთ',
  כתובות: 'ქეთუბოთ',
  נדרים: 'ნედარიმ',
  נזיר: 'ნაზირ',
  סוטה: 'სოტა',
  גיטין: 'გიტინ',
  קידושין: 'კიდუშინ',
  בבא: 'ბაბა',
  קמא: 'კამა',
  מציעא: 'მეციყა',
  בתרא: 'ბათრა',
  סנהדרין: 'სანჰედრინ',
  מכות: 'მაქოთ',
  שבועות: 'შევუყოთ',
  חולין: 'ხულინ',
  מנחות: 'მენახოთ',
  בכורות: 'ბეხოროთ',
  ערכין: 'ყარახინ',
  תמורה: 'თემურა',
  כריתות: 'ქერითოთ',
  מעילה: 'მეყილა',
  תמיד: 'თამიდ',
  נידה: 'ნიდა',
  ואף: 'ვეაფ',
  אף: 'აფ',
  גב: 'გავ',
  מפסיקות: 'მაფსიკოთ',
  בין: 'ბეინ',
  לפי: 'ლეფი',
  מקום: 'მაკომ',
  בזמן: 'ბიზმან',
  זמן: 'ზმან',
  שסידר: 'შესიდერ',
  המשניות: 'ჰამიშნაიოთ',
  משניות: 'მიშნაიოთ',
  סידרם: 'სიდრამ',
  שמיני: 'შემინი',
  עצרת: 'ყაცერეთ',
  ספיקא: 'სფეიკა',
  מדרבנן: 'მიდერაბანან',
  דרבנן: 'დერაბანან',
  דאורייתא: 'დეორაითა',
  אורייתא: 'ორაითა',
  רחמנא: 'რახმანა',
  ישראל: 'ისრაელ',
  ירושלים: 'იერუშალაიმ',
  תורה: 'თორა',
  מצוה: 'მიცვა',
  מצוות: 'მიცვოთ',
  הלכה: 'ჰალახა',
  הלכות: 'ჰილხოთ',
  שולחן: 'შულხან',
  ערוך: 'ყარუხ',
  דכתיב: 'დიხთივ',
  כתיב: 'ქთივ',
  שנאמר: 'შენეემარ',
  איתמר: 'ითმარ',
  איבעיא: 'იბაყია',
  להו: 'ლეჰუ',
  תיובתא: 'თიუვთა',
  הלכתא: 'ჰილხეთა',
  קשיא: 'კაშია',
  תיקו: 'თეიკუ',
  מנא: 'მენა',
  הני: 'ჰანი',
  מילי: 'მილი',
  דאמר: 'დეამარ',
  קרא: 'კრა',
  גופא: 'გუფა',
  מר: 'მარ',
  הדר: 'ჰადარ',
  פשיטא: 'ფშიტა',
  מהו: 'მაჰუ',
  דתימא: 'დეთეიמא',
  קמשמע: 'კამაშმაყ',
  לן: 'ლან',
  איכא: 'იქა',
  ליכא: 'ლიქა',
  בינייהו: 'ბეინაიჰუ',
  לישנא: 'ლიშნა',
  אחרינא: 'ახრინა',
  רישא: 'რეიშა',
  סיפא: 'სეიფა',
  מציעתא: 'მეციყათა',
  ברייתא: 'ბარაითა',
  גזירה: 'გზერა',
  שווה: 'შავა',
  קל: 'კალ',
  וחומר: 'ვახომერ',
  סברא: 'სვარა',
  מילתא: 'მილთა',
  טעמא: 'ტაყამა',
  האי: 'ჰაი',
  הנהו: 'ჰანჰუ',
  איהו: 'იჰუ',
  איהי: 'იჰი',
  אינהו: 'ინჰუ',
  דילמא: 'დილმა',
  דלמא: 'დილმა',
  אפילו: 'აფილუ',
  הכי: 'ჰახი',
  השתא: 'ჰაშთა',
  לעולם: 'ლეყოლამ',
  עולם: 'ყოლამ',
  קודשא: 'კუდშა',
  בריך: 'ბრიხ',
  הוא: 'ჰუ',
  היא: 'ჰი',
  אנא: 'ანა',
  אנן: 'ანან',
  אתון: 'ათუნ',
  הבו: 'ჰავუ',
  זיל: 'ზილ',
  תא: 'თა',
  חזא: 'ხაზא',
  חזי: 'ხაზი',
  ידע: 'იადაყ',
  בעי: 'ბაყი',
  סבר: 'სავარ',
  אוקימתא: 'ოკიმთა',
  נפקא: 'ნაფკა',
  מינה: 'მინა',
};

/**
 * Vocalized (Nikud-aware) + Unvocalized (Phonotactic Reconstructor) Transliteration
 */
function transliterateSingleHebrewToken(token: string): string {
  const cleanPunct = token.replace(/^[^\u0590-\u05FF״׳']+|[^\u0590-\u05FF״׳']+$/g, '').trim();
  if (!cleanPunct) return '';

  // 1. Check exact abbreviation map
  if (HEBREW_ABBREV_TRANSLIT_MAP[cleanPunct]) {
    return HEBREW_ABBREV_TRANSLIT_MAP[cleanPunct];
  }

  const rawUnvocalized = cleanPunct.replace(/[\u0591-\u05C7]/g, '');
  const unvocalized = repairSiddurOcrWord(rawUnvocalized) || rawUnvocalized;

  // 1b. Check Siddur word lexicon transliteration
  if (SIDDUR_WORD_LEXICON[unvocalized]?.translitKa) {
    return SIDDUR_WORD_LEXICON[unvocalized].translitKa;
  }
  if (SIDDUR_WORD_LEXICON[rawUnvocalized]?.translitKa) {
    return SIDDUR_WORD_LEXICON[rawUnvocalized].translitKa;
  }

  // 2. Check exact unvocalized lexicon
  if (UNVOCALIZED_PHONETIC_LEXICON[unvocalized]) {
    return UNVOCALIZED_PHONETIC_LEXICON[unvocalized];
  }

  // 3. Check Prefix + Lexicon Stem (e.g. ו/ה/ב/כ/ל/מ/ש/ד + stem)
  const prefixRules: { prefix: string; ka: string }[] = [
    { prefix: 'ובה', ka: 'უვა' },
    { prefix: 'ולה', ka: 'ულა' },
    { prefix: 'ומה', ka: 'უმეჰა' },
    { prefix: 'ושה', ka: 'ვეშეჰა' },
    { prefix: 'ודה', ka: 'ვედეჰა' },
    { prefix: 'וה', ka: 'ვეჰა' },
    { prefix: 'וב', ka: 'უვ' },
    { prefix: 'ול', ka: 'ულე' },
    { prefix: 'ומ', ka: 'უმი' },
    { prefix: 'וכ', ka: 'უქე' },
    { prefix: 'וש', ka: 'ვეშე' },
    { prefix: 'וד', ka: 'ვედე' },
    { prefix: 'מה', ka: 'მეჰა' },
    { prefix: 'שה', ka: 'შეჰა' },
    { prefix: 'דה', ka: 'დეჰა' },
    { prefix: 'בה', ka: 'ბა' },
    { prefix: 'לה', ka: 'ლა' },
    { prefix: 'כה', ka: 'ქა' },
    { prefix: 'ה', ka: 'ჰა' },
    { prefix: 'ו', ka: 'ვე' },
    { prefix: 'ב', ka: 'ბე' },
    { prefix: 'ל', ka: 'ლე' },
    { prefix: 'כ', ka: 'ქე' },
    { prefix: 'מ', ka: 'მი' },
    { prefix: 'ש', ka: 'შე' },
    { prefix: 'ד', ka: 'დე' },
  ];

  for (const rule of prefixRules) {
    if (unvocalized.length > rule.prefix.length + 1 && unvocalized.startsWith(rule.prefix)) {
      const stem = unvocalized.slice(rule.prefix.length);
      if (UNVOCALIZED_PHONETIC_LEXICON[stem]) {
        return `${rule.ka}${UNVOCALIZED_PHONETIC_LEXICON[stem]}`;
      }
    }
  }

  // 4. If the token has Nikud (vowel points \u05B0-\u05BC, \u05C1-\u05C2), parse with full Nikud fidelity!
  const hasNikud = /[\u05B0-\u05BC\u05C1\u05C2]/.test(cleanPunct);
  if (hasNikud) {
    return transliterateVocalizedHebrew(cleanPunct);
  }

  // 5. Unvocalized Phonotactic Reconstructor (for any Hebrew/Aramaic word without Nikud)
  return reconstructUnvocalizedHebrewTranslit(unvocalized);
}

function transliterateVocalizedHebrew(vocalized: string): string {
  // Group each base Hebrew letter with its attached diacritics
  const clusters: { base: string; marks: string }[] = [];
  for (const ch of vocalized) {
    if (/[\u05D0-\u05EA]/.test(ch)) {
      clusters.push({ base: ch, marks: '' });
    } else if (clusters.length > 0 && /[\u0591-\u05C7]/.test(ch)) {
      clusters[clusters.length - 1].marks += ch;
    }
  }

  let result = '';
  for (let i = 0; i < clusters.length; i++) {
    const { base, marks } = clusters[i];
    const isFirst = i === 0;
    const isLast = i === clusters.length - 1;
    const nextCluster = clusters[i + 1];

    const hasDagesh = marks.includes('\u05BC');
    const hasShinDot = marks.includes('\u05C1');
    const hasSinDot = marks.includes('\u05C2');

    // Determine vowel on this cluster
    let vowel = '';
    if (marks.includes('\u05B7') || marks.includes('\u05B8') || marks.includes('\u05B2')) {
      vowel = 'ა'; // Patach, Kamatz, Chataf Patach
    } else if (
      marks.includes('\u05B5') ||
      marks.includes('\u05B6') ||
      marks.includes('\u05B1')
    ) {
      vowel = 'ე'; // Tzere, Segol, Chataf Segol
    } else if (marks.includes('\u05B4')) {
      vowel = 'ი'; // Chirik
    } else if (marks.includes('\u05B9') || marks.includes('\u05BA') || marks.includes('\u05B3')) {
      vowel = 'ო'; // Cholam, Chataf Kamatz
    } else if (marks.includes('\u05BB')) {
      vowel = 'უ'; // Kubutz
    } else if (marks.includes('\u05B0')) {
      // Shva: vocal ('ე') at start of word or after another shva, silent at end
      vowel = isFirst ? 'ე' : '';
    }

    // Special case: Vav as mater lectionis (Shuruk וּ or Cholam Male וֹ)
    if (base === 'ו') {
      if (hasDagesh && !vowel) {
        result += isFirst ? 'უ' : 'უ';
        continue;
      }
      if (marks.includes('\u05B9') || marks.includes('\u05BA')) {
        result += 'ო';
        continue;
      }
      if (!marks) {
        // Unmarked vav after cholam/chirik or medial
        if (!isFirst && !result.endsWith('ო') && !result.endsWith('უ')) {
          result += 'ო';
          continue;
        }
      }
    }

    // Special case: Yod as mater lectionis after Chirik/Tzere/Segol
    if (base === 'י' && !marks && !isFirst) {
      if (result.endsWith('ი')) continue;
      if (result.endsWith('ე')) {
        result += 'ი';
        continue;
      }
    }

    // Silent final ה or א without mappik
    if ((base === 'ה' || base === 'א') && isLast && !marks) {
      if (!/[აეიოუ]$/.test(result)) {
        result += 'ა';
      }
      continue;
    }

    let cons = '';
    switch (base) {
      case 'א':
        cons = '';
        break;
      case 'ב':
        cons = hasDagesh || isFirst ? 'ბ' : 'ვ';
        break;
      case 'ג':
        cons = 'გ';
        break;
      case 'ד':
        cons = 'დ';
        break;
      case 'ה':
        cons = 'ჰ';
        break;
      case 'ו':
        cons = isFirst && vowel === '' ? 'უ' : 'ვ';
        break;
      case 'ז':
        cons = 'ზ';
        break;
      case 'ח':
        cons = 'ხ';
        break;
      case 'ט':
        cons = 'ტ';
        break;
      case 'י':
        cons = vowel ? 'ი' : isFirst ? 'ი' : 'ი';
        break;
      case 'כ':
        cons = hasDagesh || isFirst ? 'ქ' : 'ხ';
        break;
      case 'ך':
        cons = 'ხ';
        break;
      case 'ל':
        cons = 'ლ';
        break;
      case 'מ':
      case 'ם':
        cons = 'მ';
        break;
      case 'נ':
      case 'ן':
        cons = 'ნ';
        break;
      case 'ס':
        cons = 'ს';
        break;
      case 'ע':
        cons = 'ყ';
        break;
      case 'פ':
        cons = 'ფ';
        break;
      case 'ף':
        cons = 'ფ';
        break;
      case 'צ':
      case 'ץ':
        cons = 'ც';
        break;
      case 'ק':
        cons = 'კ';
        break;
      case 'ר':
        cons = 'რ';
        break;
      case 'ש':
        cons = hasSinDot && !hasShinDot ? 'ს' : 'შ';
        break;
      case 'ת':
        cons = 'თ';
        break;
    }

    // Furtive patach on final ח/ע/ה (e.g., רוּחַ -> რუახ)
    if (isLast && (base === 'ח' || base === 'ע') && vowel === 'ა') {
      if (!result.endsWith('ა')) {
        result += 'ა' + cons;
      } else {
        result += cons;
      }
      continue;
    }

    if (cons === 'ი' && vowel === 'ი') {
      result += 'ი';
    } else {
      result += cons + vowel;
    }

    // If neither current nor next cluster gave a vowel and not end of word, prevent 3-consonant pileup
    if (
      !vowel &&
      cons &&
      !isLast &&
      nextCluster &&
      nextCluster.base !== 'ו' &&
      nextCluster.base !== 'י' &&
      isFirst
    ) {
      result += 'ე';
    }
  }

  return result.replace(/იი+/g, 'ი').replace(/უუ+/g, 'უ').replace(/ოო+/g, 'ო') || 'ებრ.';
}

function reconstructUnvocalizedHebrewTranslit(word: string): string {
  const clean = word.replace(/[^\u05D0-\u05EA]/g, '');
  if (!clean) return 'ებრ.';

  const chars = Array.from(clean);
  const len = chars.length;

  const mapConsonant = (ch: string, idx: number): string => {
    const isInitial = idx === 0;
    switch (ch) {
      case 'א':
        return '';
      case 'ב':
        return isInitial ? 'ბ' : 'ვ';
      case 'ג':
        return 'გ';
      case 'ד':
        return 'დ';
      case 'ה':
        return idx === len - 1 ? '' : 'ჰ';
      case 'ו':
        return isInitial ? 'ვ' : 'ო';
      case 'ז':
        return 'ზ';
      case 'ח':
        return 'ხ';
      case 'ט':
        return 'ტ';
      case 'י':
        return 'ი';
      case 'כ':
        return isInitial ? 'ქ' : 'ხ';
      case 'ך':
        return 'ხ';
      case 'ל':
        return 'ლ';
      case 'מ':
      case 'ם':
        return 'მ';
      case 'נ':
      case 'ן':
        return 'ნ';
      case 'ס':
        return 'ს';
      case 'ע':
        return 'ყ';
      case 'פ':
      case 'ף':
        return 'ფ';
      case 'צ':
      case 'ץ':
        return 'ც';
      case 'ק':
        return 'კ';
      case 'ר':
        return 'რ';
      case 'ש':
        return 'შ';
      case 'ת':
        return 'თ';
      default:
        return '';
    }
  };

  const isVowelLetter = (ch: string, idx: number): boolean => {
    if (ch === 'א' || ch === 'ע') return true;
    if (ch === 'ה' && idx === len - 1) return true;
    if (ch === 'ו' && idx > 0) return true;
    if (ch === 'י' && idx > 0) return true;
    return false;
  };

  let out = '';

  for (let i = 0; i < len; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    const prev = chars[i - 1];
    const isLast = i === len - 1;

    // Handle common word endings (suffixes)
    if (i === len - 2 && ch === 'י' && (next === 'ם' || next === 'ן')) {
      out += next === 'ם' ? 'იმ' : 'ინ';
      break;
    }
    if (i === len - 2 && ch === 'ו' && next === 'ת') {
      out += 'ოთ';
      break;
    }
    if (i === len - 2 && ch === 'י' && next === 'ת') {
      out += 'ით';
      break;
    }

    // Handle vowel letters (matres lectionis)
    if (ch === 'ע') {
      out += 'ყ';
      if (i === 0 && next !== 'ו' && next !== 'י') {
        out += 'ა';
      } else if (!isLast && next !== 'ו' && next !== 'י') {
        out += 'ა';
      }
      continue;
    }
    if (ch === 'א') {
      if (i === 0) {
        if (next === 'י') {
          out += 'ეი';
          i++;
          continue;
        }
        if (next === 'ו') {
          out += 'ო';
          i++;
          continue;
        }
        out += 'ა';
      } else if (isLast) {
        if (!/[აეიოუ]$/.test(out)) out += 'ა';
      } else if (!/[აეიოუ]$/.test(out)) {
        out += 'ა';
      }
      continue;
    }

    if (ch === 'ה' && isLast) {
      if (!/[აეიოუ]$/.test(out)) out += 'ა';
      continue;
    }

    if (ch === 'ו' && i > 0) {
      if (next === 'ו') {
        out += 'ვ';
        i++;
        continue;
      }
      if (!/[ოუ]$/.test(out)) {
        out += isLast ? 'ო' : next === 'ן' || next === 'ם' || next === 'ר' ? 'უ' : 'ო';
      }
      continue;
    }

    if (ch === 'י' && i > 0) {
      if (next === 'י') {
        out += 'აი';
        i++;
        continue;
      }
      if (!out.endsWith('ი')) {
        out += 'ი';
      }
      continue;
    }

    // Regular consonant
    const cons = mapConsonant(ch, i);
    out += cons;

    // Decide whether to insert an epenthetic vowel after this consonant
    if (!isLast && next && !isVowelLetter(next, i + 1)) {
      if (i === 0) {
        // Word-initial consonant before another consonant ALWAYS needs a vowel in Hebrew/Aramaic
        if (ch === 'ה') out += 'ა';
        else if (ch === 'מ') out += 'ი';
        else if (ch === 'ב' || ch === 'ל' || ch === 'כ' || ch === 'ש' || ch === 'ד' || ch === 'ו')
          out += 'ე';
        else if (next === 'ח' || next === 'ע' || next === 'ה' || ch === 'ח') out += 'ა';
        else out += 'ა';
      } else if (i === len - 2) {
        // Penultimate consonant before final consonant needs a vowel if preceded by consonant
        if (!/[აეიოუ]$/.test(out.slice(0, -cons.length))) {
          out += next === 'ת' || next === 'ם' || next === 'ן' ? 'ა' : 'ე';
        } else if (next === 'ת' || next === 'ך' || next === 'ם' || next === 'ן') {
          out += 'ა';
        }
      } else {
        // Medial consonant cluster: insert 'ა' or 'ე' so 3 consonants never collide
        const prevWasVowel = prev ? isVowelLetter(prev, i - 1) : false;
        if (!prevWasVowel) {
          out += 'ა';
        }
      }
    }
  }

  return (
    out
      .replace(/აა+/g, 'ა')
      .replace(/ეე+/g, 'ე')
      .replace(/იი+/g, 'ი')
      .replace(/ოო+/g, 'ო')
      .replace(/უუ+/g, 'უ') || 'ებრ.'
  );
}

export function transliterateHebrewToGeorgian(hebrewWord: string): string {
  if (!hebrewWord || !hebrewWord.trim()) return 'ებრ.';
  const tokens = hebrewWord.trim().split(/\s+/);
  const transliterated = tokens.map(transliterateSingleHebrewToken).filter(Boolean);
  return transliterated.join(' ') || 'ებრ.';
}
