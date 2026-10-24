// @ts-nocheck
import { TRACTATES } from '../data/tractates';
import { numberToHebrewGematria } from '../data/tanakhAndHalakhaData';

export interface DetectedSacredCitation {
  id: string;
  labelHe: string;
  labelKa: string;
  citeHe?: string;
  rawMatch?: string;
  category?: string;
  realmId?: string;
  bookId?: string;
  tractateId?: string;
  dafId?: string;
  chapterNum?: number;
  verseNum?: number;
  sectionId?: string;
}

const HEBREW_TRACTATE_LOOKUP: Array<{
  keys: string[];
  tractateId: string;
  nameHe: string;
  nameKa: string;
}> = [
  { keys: ['ברכות', 'בברכות', 'דברכות', 'מברכות'], tractateId: 'berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  { keys: ['שבת', 'בשבת', 'דשבת', 'משבת'], tractateId: 'shabbat', nameHe: 'שבת', nameKa: 'შაბათი' },
  { keys: ['עירובין', 'בעירובין', 'דעירובין', 'עירובי'], tractateId: 'eruvin', nameHe: 'עירובין', nameKa: 'ერუვინი' },
  { keys: ['פסחים', 'בפסחים', 'דפסחים'], tractateId: 'pesachim', nameHe: 'פסחים', nameKa: 'ფესახიმი' },
  { keys: ['שקלים', 'בשקלים'], tractateId: 'shekalim', nameHe: 'שקלים', nameKa: 'შეკალიმი' },
  { keys: ['יומא', 'ביומא', 'דיומא'], tractateId: 'yoma', nameHe: 'יומא', nameKa: 'იომა' },
  { keys: ['סוכה', 'בסוכה', 'דסוכה'], tractateId: 'sukkah', nameHe: 'סוכה', nameKa: 'სუქა' },
  { keys: ['ביצה', 'בביצה', 'דביצה'], tractateId: 'beitzah', nameHe: 'ביצה', nameKa: 'ბეიცა' },
  { keys: ['ראש השנה', 'בראש השנה', 'ר"ה', 'ברה', 'בר"ה'], tractateId: 'rosh-hashanah', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
  { keys: ['תענית', 'בתענית', 'דתענית', 'תעניות'], tractateId: 'taanit', nameHe: 'תענית', nameKa: 'თაანითი' },
  { keys: ['מגילה', 'במגילה', 'דמגילה'], tractateId: 'megillah', nameHe: 'מגילה', nameKa: 'მეგილა' },
  { keys: ['מועד קטן', 'במועד קטן', 'מו"ק', 'במו"ק'], tractateId: 'moed-katan', nameHe: 'מועד קטן', nameKa: 'მოედ კატანი' },
  { keys: ['חגיגה', 'בחגיגה', 'דחגיגה'], tractateId: 'chagigah', nameHe: 'חגיגה', nameKa: 'ხაგიგა' },
  { keys: ['יבמות', 'ביבמות', 'דיבמות'], tractateId: 'yevamot', nameHe: 'יבמות', nameKa: 'იევამოთი' },
  { keys: ['כתובות', 'בכתובות', 'דכתובות'], tractateId: 'ketubot', nameHe: 'כתובות', nameKa: 'ქეთუბოთი' },
  { keys: ['נדרים', 'בנדרים', 'דנדרים'], tractateId: 'nedarim', nameHe: 'נדרים', nameKa: 'ნედარიმი' },
  { keys: ['נזיר', 'בנזיר', 'דנזיר'], tractateId: 'nazir', nameHe: 'נזיר', nameKa: 'ნაზირი' },
  { keys: ['סוטה', 'בסוטה', 'דסוטה'], tractateId: 'sotah', nameHe: 'סוטה', nameKa: 'სოტა' },
  { keys: ['גיטין', 'בגיטין', 'דגיטין'], tractateId: 'gittin', nameHe: 'גיטין', nameKa: 'გიტინი' },
  { keys: ['קידושין', 'בקידושין', 'דקידושין'], tractateId: 'kiddushin', nameHe: 'קידושין', nameKa: 'კიდუშინი' },
  { keys: ['בבא קמא', 'בבבא קמא', 'ב"ק', 'בב"ק'], tractateId: 'bava-kamma', nameHe: 'בבא קמא', nameKa: 'ბავა კამა' },
  { keys: ['בבא מציעא', 'בבבא מציעא', 'ב"מ', 'בב"מ'], tractateId: 'bava-metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
  { keys: ['בבא בתרא', 'בבבא בתרא', 'ב"ב', 'בב"ב'], tractateId: 'bava-batra', nameHe: 'בבא בתרא', nameKa: 'ბავა ბათრა' },
  { keys: ['סנהדרין', 'בסנהדרין', 'דסנהדרין'], tractateId: 'sanhedrin', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
  { keys: ['מכות', 'במכות', 'דמכות'], tractateId: 'makkot', nameHe: 'מכות', nameKa: 'მაქოთი' },
  { keys: ['שבועות', 'בשבועות', 'דשבועות'], tractateId: 'shevuot', nameHe: 'שבועות', nameKa: 'შევუოთი' },
  { keys: ['עבודה זרה', 'בעבודה זרה', 'ע"ז', 'בע"ז'], tractateId: 'avodah-zarah', nameHe: 'עבודה זרה', nameKa: 'ავოდა ზარა' },
  { keys: ['הוריות', 'בהוריות'], tractateId: 'horayot', nameHe: 'הוריות', nameKa: 'ჰორაიოთი' },
  { keys: ['זבחים', 'בזבחים', 'דזבחים'], tractateId: 'zevachim', nameHe: 'זבחים', nameKa: 'ზევახიმი' },
  { keys: ['מנחות', 'במנחות', 'דמנחות'], tractateId: 'menachot', nameHe: 'מנחות', nameKa: 'მენახოთი' },
  { keys: ['חולין', 'בחולין', 'דחולין'], tractateId: 'chullin', nameHe: 'חולין', nameKa: 'ხულინი' },
  { keys: ['בכורות', 'בבכורות'], tractateId: 'bekhorot', nameHe: 'בכורות', nameKa: 'ბეხოროთი' },
  { keys: ['ערכין', 'בערכין'], tractateId: 'arakhin', nameHe: 'ערכין', nameKa: 'არახინი' },
  { keys: ['תמורה', 'בתמורה'], tractateId: 'temurah', nameHe: 'תמורה', nameKa: 'თემურა' },
  { keys: ['כריתות', 'בכריתות'], tractateId: 'keritot', nameHe: 'כריתות', nameKa: 'ქერითოთი' },
  { keys: ['מעילה', 'במעילה'], tractateId: 'meilah', nameHe: 'מעילה', nameKa: 'მეილა' },
  { keys: ['נדה', 'בנדה', 'דנדה'], tractateId: 'niddah', nameHe: 'נדה', nameKa: 'ნიდა' },
];

const HEBREW_PEREK_TO_TRACTATE_LOOKUP: Array<{
  perekTokens: string[];
  tractateId: string;
  nameHe: string;
  nameKa: string;
}> = [
  { perekTokens: ['אין עומדין', 'מאמתי', 'היה קורא', 'תפלת השחר', 'כיצד מברכין', 'הרואה'], tractateId: 'berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  { perekTokens: ['מאيمתי מזכירין', 'סדר תעניות', 'במה מדליקין', 'כירה', 'כל כתבי'], tractateId: 'taanit', nameHe: 'תענית', nameKa: 'თაანითი' },
  { perekTokens: ['יציאות השבת', 'במה אשה', 'כל הכלים'], tractateId: 'shabbat', nameHe: 'שבת', nameKa: 'შაბათი' },
  { perekTokens: ['אור לארבעה עשר', 'כל שעה', 'ערבי פסחים'], tractateId: 'pesachim', nameHe: 'פסחים', nameKa: 'ფესახიმი' },
  { perekTokens: ['ארבעה ראשי שנים', 'אם אינן מכירין', 'ראוהו בית דין'], tractateId: 'rosh-hashanah', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
  { perekTokens: ['שבעת ימים', 'טרף בקלפי', 'יום הכפורים'], tractateId: 'yoma', nameHe: 'יומא', nameKa: 'იომა' },
  { perekTokens: ['סוכה שהיא גבוהה', 'הישן תחת המטה', 'לולב הגזול'], tractateId: 'sukkah', nameHe: 'סוכה', nameKa: 'სუქა' },
  { perekTokens: ['דיני ממונות', 'אחד דיני ממונות', 'חלק', 'כל ישראל'], tractateId: 'sanhedrin', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
  { perekTokens: ['ארבעה אבות', 'כיצד הרגל', 'המניח', 'הכונס', 'החובל', 'הגוזל'], tractateId: 'bava-kamma', nameHe: 'בבא קמא', nameKa: 'ბავა კამა' },
  { perekTokens: ['שנים אוחזין', 'אלו מציאות', 'המפקיד', 'הזהב', 'איזהו נשך'], tractateId: 'bava-metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
  { perekTokens: ['השותפין', 'לא יחפור', 'חזקת הבתים', 'המוכר את הספינה'], tractateId: 'bava-batra', nameHe: 'בבא בתרא', nameKa: 'ბავა ბათრა' },
];

const HEBREW_GEMATRIA_MAP: Record<string, number> = {
  א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
  י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50,
  ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200,
};

export const SMALL_REF_LETTERS_HE = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר',
];

export function isSmallRefMarkerToken(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^[([*«"]?([א-ת])[)\]*»"']*$/);
  if (match && (trimmed.includes('(') || trimmed.includes(')') || trimmed.includes('[') || trimmed.includes(']') || trimmed.includes('*'))) {
    return match[1];
  }
  return null;
}

export function parseHebrewNumberToken(rawToken: string): number | null {
  if (!rawToken) return null;
  const letters = rawToken.replace(/[^א-ת]/g, '');
  if (!letters || letters.length > 3) return null;
  if (letters === 'דף' || letters === 'פרק' || letters === 'סימן' || letters === 'שם') return null;
  let num = 0;
  for (const ch of letters) {
    const val = HEBREW_GEMATRIA_MAP[ch];
    if (!val) return null;
    num += val;
  }
  return num >= 1 && num <= 700 ? num : null;
}

export function parseHebrewDafToken(rawToken: string, nextToken?: string): string | null {
  if (!rawToken) return null;
  const cleaned = rawToken.replace(/^[([{"'״׳.,;:-]+/, '');
  let side: 'a' | 'b' = 'a';
  if (cleaned.includes(':') || rawToken.includes(':')) side = 'b';
  if (
    nextToken &&
    (nextToken.includes('ע"ב') ||
      nextToken.includes('ע״ב') ||
      nextToken.includes(':'))
  ) {
    side = 'b';
  }
  const lettersOnly = cleaned.replace(/[^א-ת]/g, '');
  if (!lettersOnly || lettersOnly.length > 3) return null;
  if (lettersOnly === 'דף' || lettersOnly === 'שם' || lettersOnly === 'פרק') return null;

  let num = 0;
  for (const ch of lettersOnly) {
    const val = HEBREW_GEMATRIA_MAP[ch];
    if (!val) return null;
    num += val;
  }
  if (num < 2 || num > 176) return null;
  return `${num}${side}`;
}

function matchHebrewTractateToken(
  word1: string,
  word2?: string
): { tractateId: string; nameHe: string; nameKa: string; consumedTwoWords: boolean } | null {
  const clean1 = word1.replace(/[^\u05D0-\u05EA"״']/g, '');
  const clean2 = (word2 || '').replace(/[^\u05D0-\u05EA"״']/g, '');
  const twoWord = clean2 ? `${clean1} ${clean2}` : '';

  for (const entry of HEBREW_TRACTATE_LOOKUP) {
    for (const k of entry.keys) {
      const kNorm = k.replace(/״/g, '"');
      if (twoWord && twoWord.replace(/״/g, '"') === kNorm) {
        return {
          tractateId: entry.tractateId,
          nameHe: entry.nameHe,
          nameKa: entry.nameKa,
          consumedTwoWords: true,
        };
      }
      if (clean1.replace(/״/g, '"') === kNorm) {
        return {
          tractateId: entry.tractateId,
          nameHe: entry.nameHe,
          nameKa: entry.nameKa,
          consumedTwoWords: false,
        };
      }
    }
  }
  return null;
}

export function extractCitationsFromText(
  hebrewText: string,
  georgianText: string,
  defaultTractateId = 'berakhot'
): DetectedSacredCitation[] {
  const found: DetectedSacredCitation[] = [];
  const seen = new Set<string>();

  const defaultTractateMeta =
    TRACTATES.find((t) => t.id === defaultTractateId) || TRACTATES[0];

  if (hebrewText) {
    const rawTokens = hebrewText.split(/\s+/).filter(Boolean);
    for (let i = 0; i < rawTokens.length; i++) {
      const w0 = rawTokens[i];
      const w1 = rawTokens[i + 1];

      // 1) Explicit Tractate + Daf
      const matchedTr = matchHebrewTractateToken(w0, w1);
      if (matchedTr) {
        const offset = matchedTr.consumedTwoWords ? 2 : 1;
        const afterTr1 = rawTokens[i + offset] || '';
        const afterTr2 = rawTokens[i + offset + 1] || '';
        const cleanAfter1 = afterTr1.replace(/[^\u05D0-\u05EA]/g, '');
        let dafTokenIdx = i + offset;
        let foundDafId: string | null = null;

        if (cleanAfter1 === 'דף') {
          dafTokenIdx = i + offset + 1;
          foundDafId = parseHebrewDafToken(afterTr2, rawTokens[dafTokenIdx + 1]);
        } else {
          foundDafId = parseHebrewDafToken(afterTr1, afterTr2);
        }

        if (!foundDafId) {
          for (let look = offset; look <= offset + 6 && i + look < rawTokens.length; look++) {
            const tok = rawTokens[i + look] || '';
            const tokClean = tok.replace(/[^\u05D0-\u05EA]/g, '');
            if (
              tokClean === 'דף' ||
              tokClean === 'בדף' ||
              tokClean === 'מדף' ||
              tokClean === 'לדף' ||
              tokClean === 'ודף'
            ) {
              const cand =
                parseHebrewDafToken(rawTokens[i + look + 1] || '', rawTokens[i + look + 2]) ||
                parseHebrewDafToken(rawTokens[i + look - 1] || '', tok);
              if (cand) {
                foundDafId = cand;
                break;
              }
            }
          }
        }

        if (foundDafId) {
          const key = `${matchedTr.tractateId}:${foundDafId}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push({
              id: key,
              tractateId: matchedTr.tractateId,
              dafId: foundDafId,
              labelHe: `${matchedTr.nameHe} ${foundDafId}`,
              labelKa: `${matchedTr.nameKa} ${foundDafId}`,
              sectionId: 'daf-section-gemara',
            });
          }
        }
      }

      // 2) Standalone "(דף לג.)" or "(.דף לג)" or visual order "כד. דף"
      const w0Clean = w0.replace(/[^\u05D0-\u05EA]/g, '');
      const isW0DafWord =
        w0Clean === 'דף' ||
        w0Clean === 'בדף' ||
        w0Clean === 'מדף' ||
        w0Clean === 'לדף' ||
        w0Clean === 'ודף';
      if (isW0DafWord && (w1 || rawTokens[i - 1])) {
        const standaloneDafId =
          (w1 ? parseHebrewDafToken(w1, rawTokens[i + 2]) : null) ||
          (i > 0 ? parseHebrewDafToken(rawTokens[i - 1], w0) : null);
        if (standaloneDafId) {
          let resolvedTractate = {
            tractateId: defaultTractateId,
            nameHe: defaultTractateMeta.nameHe,
            nameKa: defaultTractateMeta.nameKa,
          };
          let foundTractateInWindow = false;
          for (let back = 1; back <= 14 && i - back >= 0; back++) {
            const bw0 = rawTokens[i - back];
            const bw1 = rawTokens[i - back + 1];
            const prevTr = matchHebrewTractateToken(bw0, bw1);
            if (prevTr) {
              resolvedTractate = {
                tractateId: prevTr.tractateId,
                nameHe: prevTr.nameHe,
                nameKa: prevTr.nameKa,
              };
              foundTractateInWindow = true;
              break;
            }
          }

          if (!foundTractateInWindow) {
            const windowText = rawTokens
              .slice(Math.max(0, i - 14), i + 1)
              .join(' ')
              .replace(/[^\u05D0-\u05EA\s]/g, '');
            for (const pEntry of HEBREW_PEREK_TO_TRACTATE_LOOKUP) {
              if (pEntry.perekTokens.some((pt) => windowText.includes(pt))) {
                resolvedTractate = {
                  tractateId: pEntry.tractateId,
                  nameHe: pEntry.nameHe,
                  nameKa: pEntry.nameKa,
                };
                break;
              }
            }
          }

          const key = `${resolvedTractate.tractateId}:${standaloneDafId}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push({
              id: key,
              tractateId: resolvedTractate.tractateId,
              dafId: standaloneDafId,
              labelHe: `${resolvedTractate.nameHe} דף ${standaloneDafId}`,
              labelKa: `${resolvedTractate.nameKa} ${standaloneDafId}`,
              sectionId: 'daf-section-gemara',
            });
          }
        }
      }

      // 3) Chapter / Siman citation ("פרק ג", "סימן ב")
      if ((w0Clean === 'פרק' || w0Clean === 'סימן') && w1) {
        const chNum = parseHebrewNumberToken(w1);
        if (chNum) {
          const key = `ch:${chNum}`;
          if (!seen.has(key)) {
            seen.add(key);
            const gem = numberToHebrewGematria(chNum);
            found.push({
              id: key,
              chapterNum: chNum,
              labelHe: `${w0Clean} ${gem}`,
              labelKa: `${w0Clean === 'סימן' ? 'სიმანი' : 'თავი'} ${chNum}`,
            });
          }
        }
      }
    }
  }

  // 4) Georgian or English Daf references in translation/explanation
  if (georgianText) {
    for (const tr of TRACTATES) {
      const escapedKa = tr.nameKa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEn = tr.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?:${escapedKa}|${escapedEn})\\s*(?:დაფი\\s*)?(\\d{1,3}[abAB]?)`,
        'gi'
      );
      let m: RegExpExecArray | null;
      while ((m = regex.exec(georgianText)) !== null) {
        const rawDaf = m[1].toLowerCase();
        const normalizedDaf =
          rawDaf.endsWith('a') || rawDaf.endsWith('b') ? rawDaf : `${rawDaf}a`;
        const key = `${tr.id}:${normalizedDaf}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({
            id: key,
            tractateId: tr.id,
            dafId: normalizedDaf,
            labelHe: `${tr.nameHe} ${normalizedDaf}`,
            labelKa: `${tr.nameKa} ${normalizedDaf}`,
            sectionId: 'daf-section-gemara',
          });
        }
      }
    }
  }

  return found;
}

export function buildWordCitationIndexMap(
  words: string[],
  defaultTractateId = 'berakhot'
): Map<number, DetectedSacredCitation> {
  const map = new Map<number, DetectedSacredCitation>();
  const defaultTractateMeta =
    TRACTATES.find((t) => t.id === defaultTractateId) || TRACTATES[0];

  for (let i = 0; i < words.length; i++) {
    const w0 = words[i] || '';
    const w1 = words[i + 1] || '';

    const matchedTr = matchHebrewTractateToken(w0, w1);
    if (matchedTr) {
      const offset = matchedTr.consumedTwoWords ? 2 : 1;
      const after1 = words[i + offset] || '';
      const after2 = words[i + offset + 1] || '';
      const cleanAfter1 = after1.replace(/[^\u05D0-\u05EA]/g, '');
      let spanEnd = i + offset;
      let foundDafId: string | null = null;

      const isCleanAfter1Daf =
        cleanAfter1 === 'דף' ||
        cleanAfter1 === 'בדף' ||
        cleanAfter1 === 'מדף' ||
        cleanAfter1 === 'לדף' ||
        cleanAfter1 === 'ודף';
      if (isCleanAfter1Daf) {
        spanEnd = i + offset + 1;
        foundDafId = parseHebrewDafToken(after2, words[spanEnd + 1]);
        if (
          foundDafId &&
          words[spanEnd + 1] &&
          (words[spanEnd + 1].includes('ע"א') ||
            words[spanEnd + 1].includes('ע״א') ||
            words[spanEnd + 1].includes('ע"ב') ||
            words[spanEnd + 1].includes('ע״ב'))
        ) {
          spanEnd += 1;
        }
      } else {
        foundDafId = parseHebrewDafToken(after1, after2);
      }

      if (!foundDafId) {
        for (let look = offset; look <= offset + 6 && i + look < words.length; look++) {
          const tok = words[i + look] || '';
          const tokClean = tok.replace(/[^\u05D0-\u05EA]/g, '');
          if (
            tokClean === 'דף' ||
            tokClean === 'בדף' ||
            tokClean === 'מדף' ||
            tokClean === 'לדף' ||
            tokClean === 'ודף'
          ) {
            const candNext = parseHebrewDafToken(
              words[i + look + 1] || '',
              words[i + look + 2]
            );
            if (candNext) {
              foundDafId = candNext;
              spanEnd = i + look + 1;
              break;
            }
            const candPrev = parseHebrewDafToken(words[i + look - 1] || '', tok);
            if (candPrev) {
              foundDafId = candPrev;
              spanEnd = i + look;
              break;
            }
          }
        }
      }

      if (foundDafId) {
        const cit: DetectedSacredCitation = {
          id: `${matchedTr.tractateId}:${foundDafId}`,
          tractateId: matchedTr.tractateId,
          dafId: foundDafId,
          labelHe: `${matchedTr.nameHe} ${foundDafId}`,
          labelKa: `${matchedTr.nameKa} ${foundDafId}`,
          sectionId: 'daf-section-gemara',
        };
        for (let k = i; k <= spanEnd; k++) {
          map.set(k, cit);
        }
        i = spanEnd;
        continue;
      }
    }

    const w0Clean = w0.replace(/[^\u05D0-\u05EA]/g, '');
    const isW0DafWord =
      w0Clean === 'דף' ||
      w0Clean === 'בדף' ||
      w0Clean === 'מדף' ||
      w0Clean === 'לדף' ||
      w0Clean === 'ודף';
    if (isW0DafWord && (w1 || words[i - 1])) {
      const nextDafId = w1 ? parseHebrewDafToken(w1, words[i + 2]) : null;
      const prevDafId = !nextDafId && i > 0 ? parseHebrewDafToken(words[i - 1], w0) : null;
      const standaloneDafId = nextDafId || prevDafId;
      if (standaloneDafId) {
        const spanStart = prevDafId ? Math.max(0, i - 1) : i;
        let spanEnd = nextDafId ? i + 1 : i;
        if (
          nextDafId &&
          words[i + 2] &&
          (words[i + 2].includes('ע"א') ||
            words[i + 2].includes('ע״א') ||
            words[i + 2].includes('ע"ב') ||
            words[i + 2].includes('ע״ב'))
        ) {
          spanEnd = i + 2;
        }
        let resolvedTractate = {
          tractateId: defaultTractateId,
          nameHe: defaultTractateMeta.nameHe,
          nameKa: defaultTractateMeta.nameKa,
        };
        let foundTr = false;
        for (let back = 1; back <= 14 && i - back >= 0; back++) {
          const prevTr = matchHebrewTractateToken(
            words[i - back] || '',
            words[i - back + 1] || ''
          );
          if (prevTr) {
            resolvedTractate = {
              tractateId: prevTr.tractateId,
              nameHe: prevTr.nameHe,
              nameKa: prevTr.nameKa,
            };
            foundTr = true;
            break;
          }
        }
        if (!foundTr) {
          const windowText = words
            .slice(Math.max(0, i - 14), i + 1)
            .join(' ')
            .replace(/[^\u05D0-\u05EA\s]/g, '');
          for (const pEntry of HEBREW_PEREK_TO_TRACTATE_LOOKUP) {
            if (pEntry.perekTokens.some((pt) => windowText.includes(pt))) {
              resolvedTractate = {
                tractateId: pEntry.tractateId,
                nameHe: pEntry.nameHe,
                nameKa: pEntry.nameKa,
              };
              break;
            }
          }
        }
        const cit: DetectedSacredCitation = {
          id: `${resolvedTractate.tractateId}:${standaloneDafId}`,
          tractateId: resolvedTractate.tractateId,
          dafId: standaloneDafId,
          labelHe: `${resolvedTractate.nameHe} דף ${standaloneDafId}`,
          labelKa: `${resolvedTractate.nameKa} ${standaloneDafId}`,
          sectionId: 'daf-section-gemara',
        };
        for (let k = spanStart; k <= spanEnd; k++) {
          map.set(k, cit);
        }
        i = spanEnd;
      }
    }
  }

  return map;
}
