// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { Loader2, ChevronUp, ChevronDown, GripHorizontal, X, Copy, BookOpen, Check } from 'lucide-react';
import {
  DafPageData,
  TalmudSentence,
  AnalysisMode,
  SelectedDafTarget,
} from '../types/talmud';
import { normalizeHebrewWord } from '../data/lexicon';
import { detectSmallMarkerToken, isCircleMarker, getTorahOrNumber, canJoinMarkerFragments } from '../utils/referenceMarkerDetector';
import { findMarginGutters, normalizeVilnaX, REFERENCE_GUTTERS } from '../utils/vilnaColumnGutters';
import { assignFullWidthCommentaryRows } from '../utils/vilnaLowerCommentary';
import { scrollToTarget } from '../utils/scrollToTarget';
import { getTorahOrEntryHotspots, getTorahOrSentenceId } from '../utils/torahOrNavigation';
import { getIndependentMarkerBoxes, getGilyonNote, getGilyonNoteByOrder, getExactMarginEntry } from '../utils/pdfMarkerNavigation';
import { parseBiblicalCitation } from '../utils/biblicalCitation';
import { BiblicalVerseWindow } from './BiblicalVerseWindow';
import { ReferenceOriginLabel } from './ReferenceOriginLabel';
import {
  translateToGeorgianLive,
  normalizeGeorgianJewishTerms,
  stripTalmudicReferenceHintsForTranslation,
} from '../utils/georgianTranslator';
import {
  CANONICAL_SIDDUR_PAGE_ROWS,
  matchCanonicalSiddurRow,
  repairSiddurOcrWord,
  repairSiddurOcrLine,
  lookupSiddurLineTranslationKa,
} from '../utils/siddurPdfCanonicalFixer';
import { tintCitationHotspotsBlueOnCanvas, tintHotspotsInkOnCanvas, RASHI_INK, TOSAFOT_INK } from '../utils/pdfCitationTint';
import { buildDibburHamatchilLinks, splitSideAt } from '../utils/dibburHamatchilMatcher';
import { decodeLegacyHebrewItems } from '../utils/legacyHebrewFont';
import {
  CrystalDiamondJumpButton,
  WindowsWindowControls,
} from './WindowsWindowControls';

// Configure PDF.js worker using Vite asset URL (with public static fallback)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || '/pdf.worker.min.mjs';
}

export type MarginCommentaryType =
  | 'bach'
  | 'masoret'
  | 'ein-mishpat'
  | 'torah-or'
  | 'gra'
  | 'gilyon-hashas'
  | 'musaf-rashi'
  | 'rabbeinu-chananel';

export interface VilnaPdfHotspot {
  id: string;
  word: string;
  cleanWord: string;
  section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  sentence: TalmudSentence;
  rowId: string;
  lineTextHe?: string;
  isSmallMarker?: boolean;
  markerTargetType?: MarginCommentaryType;
  markerKey?: string;
  marginCommType?: MarginCommentaryType;
  marginEntryKey?: string;
  targetSentenceId?: string;
  /** Exact glyph box of a marker (hit area may be padded larger); used for blue tinting. */
  inkLeftPct?: number;
  inkTopPct?: number;
  inkWidthPct?: number;
  inkHeightPct?: number;
  /** Printed glyph height of the PDF run (pt); separates bold dibbur-hamatchil type from body text. */
  glyphH?: number;
  /** PDF font resource of the printed run (opening typeface vs body script). */
  font?: string;
  /** 'sefaria' when the letters were replaced by the aligned Sefaria Unicode word. */
  textSource?: 'pdf' | 'sefaria';
  /** A "." or ":" is printed right after this word. */
  stopAfter?: '.' | ':';
  /** A separate geresh (ר') or gershayim (ק"ש) is printed right after this word. */
  quoteAfter?: '"' | "'";
}

export interface PdfDafLine {
  rowId: string;
  section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';
  topPct: number;
  heightPct: number;
  leftPct: number;
  widthPct: number;
  lineTextHe: string;
  sentence: TalmudSentence;
  firstHotspotId: string;
}

interface BlinkingTargetRegion {
  key: string;
  labelHe: string;
  labelKa: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  hotspotIds: Set<string>;
  activatedAt: number;
  originMarker?: string;
}

interface VilnaPdfInteractiveViewerProps {
  dafData: DafPageData;
  tractateNameHe: string;
  tractateNameKa: string;
  dafMarkHe: string;
  effectiveMishnah: TalmudSentence[];
  effectiveGemara: TalmudSentence[];
  effectiveRashi: TalmudSentence[];
  effectiveTosafot: TalmudSentence[];
  isDark: boolean;
  fontScaleRatio: number;
  selectedTarget: SelectedDafTarget | null;
  wordExplainStage?: 'none' | 'marked' | 'note' | 'deep';
  onOpenWordNote?: () => void;
  autoTranslateLineMode?: boolean;
  onToggleAutoTranslateLineMode?: () => void;
  externalStoppedRowStepTrigger?: { dir: 'prev' | 'next' | 'jump'; seq: number } | null;
  deepLinkedSentenceId?: string | null;
  deepLinkedCitationLabelHe?: string | null;
  deepLinkedCitationSnippetHe?: string | null;
  deepLinkTriggerSeq?: number;
  isFullScreen?: boolean;
  onExitFullScreen?: () => void;
  isEmbeddedInNoteWindow?: boolean;
  onDeepLinkTargetResolved?: (info: {
    sentence: TalmudSentence;
    topPct: number;
    leftPct: number;
    widthPct: number;
    heightPct: number;
    lineTextHe: string;
  }) => void;
  onNavigateToCitation?: (
    tractateId: string,
    dafId: string,
    citeHe: string,
    originContext?: {
      fromPdfRowId?: string | null;
      fromPdfSelectedRange?: { startIdx: number; endIdx: number } | null;
      sourceLabelKa?: string;
      sourceLabelHe?: string;
      contextSnippetHe?: string;
      anchorRect?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        width: number;
        height: number;
      } | null;
    }
  ) => void;
  pendingReturnRestore?: {
    seq: number;
    pdfRowId?: string | null;
    pdfSelectedRange?: { startIdx: number; endIdx: number } | null;
    labelKa?: string;
  } | null;
  onSelectWordOrSentence: (
    word: string,
    sentence: TalmudSentence,
    rect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
}

// Bundled Vilna PDFs (public/vilna-pdf/). Empty: every daf currently loads from the online scan source.
const EXACT_VILNA_PDF_MAP: Record<string, string> = {};

/** True only when the real printed scan of this exact daf ships with the app. */
export function hasAuthenticVilnaScan(tractateId: string, dafId: string): boolean {
  return Boolean(EXACT_VILNA_PDF_MAP[`${tractateId}:${(dafId || '').toLowerCase()}`]);
}

const BUNDLED_KAVANAT_HALEV_PAGES = [
  1, 2, 3, 4, 5, 20, 29, 30, 31, 32, 35, 40, 45, 50, 60, 71, 72, 75, 78, 100,
  122, 123, 130, 144, 145, 160, 164, 165, 166, 200, 217, 230, 250,
];

const BUNDLED_CLASSIC_SIDDUR_PAGES = [10, 15, 40, 60, 80, 100, 130, 160, 200];

function isExactBundledSiddurPage(tractateId: string, dafId: string): boolean {
  if (!tractateId.startsWith('Siddur_')) return false;
  const pageNum = Math.max(1, parseInt(dafId.replace(/[^\d]/g, ''), 10) || 29);
  if (tractateId === 'Siddur_Classic') {
    return BUNDLED_CLASSIC_SIDDUR_PAGES.includes(pageNum);
  }
  return BUNDLED_KAVANAT_HALEV_PAGES.includes(pageNum);
}

function resolveFallbackBundledSiddurPdfUrl(tractateId: string, dafId: string): string {
  const pageNum = Math.max(1, parseInt(dafId.replace(/[^\d]/g, ''), 10) || 29);
  if (tractateId === 'Siddur_Classic') {
    const chosen =
      BUNDLED_CLASSIC_SIDDUR_PAGES[pageNum % BUNDLED_CLASSIC_SIDDUR_PAGES.length] || 10;
    return `/siddur-pdf/classic-siddur-${chosen}.pdf`;
  }
  const interiorPages = BUNDLED_KAVANAT_HALEV_PAGES.filter((p) => p >= 29);
  const chosen = interiorPages[pageNum % interiorPages.length] || 29;
  return `/siddur-pdf/kavanat-halev-${chosen}.pdf`;
}

function resolveFallbackBundledChumashPdfUrl(tractateId: string, dafId: string): string {
  const rawBook = tractateId.replace(/^Chumash_/, '') || 'Genesis';
  const validBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
  const book = validBooks.includes(rawBook) ? rawBook : 'Genesis';
  const pageNum = Math.max(1, parseInt(dafId.replace(/[^\d]/g, ''), 10) || 1);
  const cycled = ((pageNum - 1) % 6) + 1;
  return `/chumash-pdf/${book}-${cycled}.pdf`;
}

function resolveAuthenticVilnaPdfCloneUrl(tractateId: string, dafId: string): string {
  if (tractateId.startsWith('Chumash_')) {
    const rawBook = tractateId.replace(/^Chumash_/, '') || 'Genesis';
    const validBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
    const book = validBooks.includes(rawBook) ? rawBook : 'Genesis';
    const pageNum = Math.max(1, parseInt(dafId.replace(/[^\d]/g, ''), 10) || 1);
    if (pageNum >= 1 && pageNum <= 6) {
      return `/chumash-pdf/${book}-${pageNum}.pdf`;
    }
    return `/api/chumash-pdf/${book}/${pageNum}`;
  }

  if (tractateId.startsWith('Siddur_')) {
    const pageNum = Math.max(1, parseInt(dafId.replace(/[^\d]/g, ''), 10) || 29);
    if (tractateId === 'Siddur_Classic') {
      if (BUNDLED_CLASSIC_SIDDUR_PAGES.includes(pageNum)) {
        return `/siddur-pdf/classic-siddur-${pageNum}.pdf`;
      }
      const chosen =
        BUNDLED_CLASSIC_SIDDUR_PAGES[pageNum % BUNDLED_CLASSIC_SIDDUR_PAGES.length] || 10;
      return `/siddur-pdf/classic-siddur-${chosen}.pdf`;
    }
    if (BUNDLED_KAVANAT_HALEV_PAGES.includes(pageNum)) {
      return `/siddur-pdf/kavanat-halev-${pageNum}.pdf`;
    }
    const interiorPages = BUNDLED_KAVANAT_HALEV_PAGES.filter((p) => p >= 29);
    const chosen = interiorPages[pageNum % interiorPages.length] || 29;
    return `/siddur-pdf/kavanat-halev-${chosen}.pdf`;
  }

  const exact = EXACT_VILNA_PDF_MAP[`${tractateId}:${dafId}`];
  if (exact) return exact;

  return `/api/talmud/vilna-pdf?tractate=${encodeURIComponent(tractateId)}&daf=${encodeURIComponent(dafId)}`;
}

const MARGIN_COMM_LABELS: Record<
  MarginCommentaryType,
  { he: string; ka: string }
> = {
  bach: { he: 'הגהות הב״ח', ka: 'ჰაგაჰოთ ჰაბახი' },
  masoret: { he: 'מסורת הש״ס', ka: 'მასორეთ ჰაშასი' },
  'ein-mishpat': { he: 'עין משפט נר מצוה', ka: 'ეინ მიშპატი' },
  'torah-or': { he: 'תורה אור השלם', ka: 'თორა ორი' },
  gra: { he: 'הגהות הגר״א', ka: 'ჰაგაჰოთ ჰაგრა' },
  'gilyon-hashas': { he: 'גליון הש״ס (רבי עקיבא איגר)', ka: 'გილიონ ჰაშასი (რაბი აკივა ეიგერი)' },
  'musaf-rashi': { he: 'מוסף רש״י', ka: 'მუსაფ რაში' },
  'rabbeinu-chananel': { he: 'רבינו חננאל', ka: 'რაბეინუ ხანანელი' },
};

const HEBREW_STOP_WORDS = new Set([
  'את',
  'על',
  'של',
  'לא',
  'או',
  'אם',
  'כי',
  'זה',
  'כל',
  'בו',
  'לו',
  'לה',
  'הוא',
  'היא',
  'אמר',
  'תנא',
  'רב',
  'רבי',
  'אי',
  'הא',
  'עד',
  'מן',
  'אלא',
  'כמו',
  'פי',
  'כך',
  'יש',
  'אין',
]);

function stripHebrewPrefix(clean: string): string {
  if (clean.length <= 3) return clean;
  return clean.replace(/^(וב|דב|שב|מה|וה|ה|ו|ב|ל|מ|ד|כ|ש)/, '');
}

function getWordVisualGlyphWeight(word: string): number {
  let w = 0;
  for (const ch of word) {
    if ('יוןז,.;:\'"״׳()[]1234567890'.includes(ch)) w += 0.52;
    else if ('שמםסעצאחת'.includes(ch)) w += 1.08;
    else w += 0.92;
  }
  return Math.max(0.5, w);
}

/**
 * Classifies a word's x/y coordinate + font height on the Vilna Daf into its canonical commentary/text zone,
 * properly handling wide Gemara lines, wide top Rashi/Tosafot lines, and wide bottom Tosafot lines so lines are never split in half!
 */
function classifyVilnaCoordinateZone(
  leftPct: number,
  topPct: number,
  isAmudBet: boolean,
  pdfH = 11.2
): 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin' {
  if (leftPct < 14.0 || leftPct > 80.2) {
    return 'margin';
  }
  if (topPct < 4.5 && pdfH >= 15.5) return 'header';

  const rashiSideIsRight = !isAmudBet;

  // Top lines of the outer columns hold only commentary: a bold opening word (e.g. Rashi's
  // מאימתי) stays in its column whatever its size. The central block is never affected.
  if (topPct < 9.0 && pdfH < 15.8 && (leftPct > 61.8 || leftPct < 33.2)) {
    if (leftPct > 61.8) return rashiSideIsRight ? 'rashi' : 'tosafot';
    return rashiSideIsRight ? 'tosafot' : 'rashi';
  }

  // Square font (pdfH >= 12.6) inside the main body (between 31% and 80.2%) is always Mishnah or Gemara
  // (unless it is a single bold lead word at the very start of Rashi/Tosafot on the outer column edge)
  if (pdfH >= 12.6 && pdfH < 15.8 && leftPct >= 32.5) {
    return topPct < 31.2 ? 'mishnah' : 'gemara';
  }

  // Top 4 lines above the Mishnah/Gemara center box (topPct < 9.0%):
  // Rashi and Tosafot meet in the middle at x = 47.1%
  if (topPct < 9.0 && pdfH < 12.6) {
    if (leftPct >= 47.1) {
      return rashiSideIsRight ? 'rashi' : 'tosafot';
    }
    return rashiSideIsRight ? 'tosafot' : 'rashi';
  }

  // Lower full-width Tosafot / Rashi below Gemara (topPct >= 65.5% and Rashi script pdfH < 12.6):
  if (topPct >= 65.5 && pdfH < 12.6) {
    // Below the Gemara each commentary keeps its own side of the page.
    if (leftPct >= 47.1) return rashiSideIsRight ? 'rashi' : 'tosafot';
    return rashiSideIsRight ? 'tosafot' : 'rashi';
  }

  if (leftPct > 61.8) {
    return rashiSideIsRight ? 'rashi' : 'tosafot';
  }
  if (leftPct < 33.2) {
    return rashiSideIsRight ? 'tosafot' : 'rashi';
  }
  if (topPct < 31.2) return 'mishnah';
  return 'gemara';
}

/**
 * Parses a Hebrew Daf folio token (e.g., "לג.", "לג.(", ".לג)", "כח:(", "ד:(", "קיג.(", "טז.", "מב:") into "33a", "28b", etc.
 */
function parsePdfHebrewDafToken(
  rawDafToken: string,
  requirePunct = false
): string | null {
  if (!rawDafToken) return null;
  if (requirePunct && !/[.:]/.test(rawDafToken) && !/ע["״'][אב]/.test(rawDafToken)) {
    return null;
  }
  const isAmudBet =
    rawDafToken.includes(':') ||
    rawDafToken.includes('ע"ב') ||
    rawDafToken.includes('ע״ב') ||
    rawDafToken.includes("ע'ב");
  const cleanLetters = rawDafToken
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/ע["״'][אב]/g, '')
    .replace(/[^א-ת]/g, '');
  if (!cleanLetters || cleanLetters.length > 3) return null;

  // Exclude common short Hebrew words so only canonical Gematria numerals match
  const nonNumberWords = new Set([
    'דף', 'בדף', 'מדף', 'לדף', 'שם', 'פרק', 'בפרק', 'אין', 'על', 'אל', 'לא',
    'כל', 'כי', 'אם', 'או', 'גם', 'רק', 'עד', 'מן', 'בן', 'רב', 'רבי', 'תנא',
    'גמ', 'וכו', 'כו', 'זה', 'זו', 'יש', 'לו', 'לה', 'הם', 'הן', 'אף', 'אך',
  ]);
  if (nonNumberWords.has(cleanLetters)) return null;

  // Must follow canonical descending Hebrew Gematria structure (hundreds -> tens -> units)
  if (!/^[ק-ת]?([יכךלמםנןסעפףצץ][א-ט]?|טו|טז|[א-ט])$/.test(cleanLetters)) {
    return null;
  }

  const gematriaMap: Record<string, number> = {
    א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
    י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50,
    ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400,
  };
  let sum = 0;
  for (const ch of cleanLetters) {
    sum += gematriaMap[ch] || 0;
  }
  if (sum < 2 || sum > 176) return null;
  return `${sum}${isAmudBet ? 'b' : 'a'}`;
}

function matchPdfHebrewTractate(
  rawWord1?: string,
  rawWord2?: string
): {
  id: string;
  defaultDaf: string;
  nameHe: string;
  nameKa: string;
  consumedTwoWords?: boolean;
} | null {
  if (!rawWord1) return null;
  const clean1 = rawWord1
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[()[\].,:;!?'״"]/g, '')
    .trim();
  const clean2 = (rawWord2 || '')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[()[\].,:;!?'״"]/g, '')
    .trim();

  const stripPrefix = (s: string) =>
    s.replace(/^(ובמסכת|במסכת|ממסכת|למסכת|ומסכת|מסכת|וב|דב|שב|מה|ו|ב|ל|מ|ד|כ|ש)/, '');

  const twoWord = `${stripPrefix(clean1)} ${clean2}`;
  if (twoWord === 'ראש השנה' || (clean1.endsWith('ראש') && clean2 === 'השנה')) {
    return {
      id: 'Rosh_Hashanah',
      defaultDaf: '16a',
      nameHe: 'ראש השנה',
      nameKa: 'როშ ჰაშანა',
      consumedTwoWords: true,
    };
  }
  if (twoWord === 'בבא קמא') {
    return {
      id: 'Bava_Kamma',
      defaultDaf: '2a',
      nameHe: 'בבא קמא',
      nameKa: 'ბავა კამა',
      consumedTwoWords: true,
    };
  }
  if (twoWord === 'בבא מציעא') {
    return {
      id: 'Bava_Metzia',
      defaultDaf: '2a',
      nameHe: 'בבא מציעא',
      nameKa: 'ბავა მეცია',
      consumedTwoWords: true,
    };
  }
  if (twoWord === 'בבא בתרא') {
    return {
      id: 'Bava_Batra',
      defaultDaf: '2a',
      nameHe: 'בבא בתרא',
      nameKa: 'ბავა ბათრა',
      consumedTwoWords: true,
    };
  }
  if (twoWord === 'עבודה זרה') {
    return {
      id: 'Avodah_Zarah',
      defaultDaf: '2a',
      nameHe: 'עבודה זרה',
      nameKa: 'ავოდა ზარა',
      consumedTwoWords: true,
    };
  }

  const singleMap: Record<
    string,
    { id: string; defaultDaf: string; nameHe: string; nameKa: string }
  > = {
    ברכות: { id: 'Berakhot', defaultDaf: '2a', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
    שבת: { id: 'Shabbat', defaultDaf: '21b', nameHe: 'שבת', nameKa: 'შაბათი' },
    עירובין: { id: 'Eruvin', defaultDaf: '2a', nameHe: 'עירובין', nameKa: 'ერუვინი' },
    פסחים: { id: 'Pesachim', defaultDaf: '2a', nameHe: 'פסחים', nameKa: 'ფესახიმი' },
    יומא: { id: 'Yoma', defaultDaf: '2a', nameHe: 'יומא', nameKa: 'იომა' },
    סוכה: { id: 'Sukkah', defaultDaf: '2a', nameHe: 'סוכה', nameKa: 'სუკა' },
    ביצה: { id: 'Beitzah', defaultDaf: '2a', nameHe: 'ביצה', nameKa: 'ბეიცა' },
    רה: { id: 'Rosh_Hashanah', defaultDaf: '16a', nameHe: 'ראש השנה', nameKa: 'როშ ჰაშანა' },
    תענית: { id: 'Taanit', defaultDaf: '2a', nameHe: 'תענית', nameKa: 'თაანითი' },
    מגילה: { id: 'Megillah', defaultDaf: '2a', nameHe: 'מגילה', nameKa: 'მეგილა' },
    חגיגה: { id: 'Chagigah', defaultDaf: '2a', nameHe: 'חגיגה', nameKa: 'ხაგიგა' },
    יבמות: { id: 'Yevamot', defaultDaf: '2a', nameHe: 'יבמות', nameKa: 'იევამოთი' },
    כתובות: { id: 'Ketubot', defaultDaf: '2a', nameHe: 'כתובות', nameKa: 'ქეთუბოთი' },
    נדרים: { id: 'Nedarim', defaultDaf: '2a', nameHe: 'נדרים', nameKa: 'ნედარიმი' },
    נזיר: { id: 'Nazir', defaultDaf: '2a', nameHe: 'נזיר', nameKa: 'ნაზირი' },
    סוטה: { id: 'Sotah', defaultDaf: '2a', nameHe: 'סוטה', nameKa: 'სოტა' },
    גיטין: { id: 'Gittin', defaultDaf: '2a', nameHe: 'גיטין', nameKa: 'გიტინი' },
    קידושין: { id: 'Kiddushin', defaultDaf: '2a', nameHe: 'קידושין', nameKa: 'კიდუშინი' },
    בק: { id: 'Bava_Kamma', defaultDaf: '2a', nameHe: 'בבא קמא', nameKa: 'ბავა კამა' },
    במ: { id: 'Bava_Metzia', defaultDaf: '2a', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
    בב: { id: 'Bava_Batra', defaultDaf: '2a', nameHe: 'בבא בתרא', nameKa: 'ბავა ბათრა' },
    סנהדרין: { id: 'Sanhedrin', defaultDaf: '2a', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
    מכות: { id: 'Makkot', defaultDaf: '2a', nameHe: 'מכות', nameKa: 'მაკოთი' },
    שבועות: { id: 'Shevuot', defaultDaf: '2a', nameHe: 'שבועות', nameKa: 'შევუოთი' },
    זבחים: { id: 'Zevachim', defaultDaf: '2a', nameHe: 'זבחים', nameKa: 'ზევახიმი' },
    מנחות: { id: 'Menachot', defaultDaf: '2a', nameHe: 'מנחות', nameKa: 'მენახოთი' },
    חולין: { id: 'Chullin', defaultDaf: '2a', nameHe: 'חולין', nameKa: 'ხულინი' },
    נדה: { id: 'Niddah', defaultDaf: '2a', nameHe: 'נדה', nameKa: 'ნიდა' },
  };

  const hasAbbrevQuote = /["״']/.test(rawWord1);
  for (const cand of [clean1, stripPrefix(clean1)]) {
    if ((cand === 'רה' || cand === 'בק' || cand === 'במ' || cand === 'בב') && !hasAbbrevQuote) {
      continue;
    }
    if (singleMap[cand]) {
      return singleMap[cand];
    }
  }
  return null;
}

const FAMOUS_PEREK_TRACTATE_MAP: Record<
  string,
  { id: string; nameHe: string; nameKa: string }
> = {
  'אין עומדין': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'תפלת השחר': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'היה קורא': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'כיצד מברכין': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'שלשה שאכלו': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'הרואה': { id: 'Berakhot', nameHe: 'ברכות', nameKa: 'ბერახოთი' },
  'בראשונה': { id: 'Yoma', nameHe: 'יומא', nameKa: 'იომა' },
  'לולב וערבה': { id: 'Sukkah', nameHe: 'סוכה', nameKa: 'სუკა' },
  'לולב הגזול': { id: 'Sukkah', nameHe: 'סוכה', nameKa: 'სუკა' },
  'במה מדליקין': { id: 'Shabbat', nameHe: 'שבת', nameKa: 'შაბათი' },
  'כלל גדול': { id: 'Shabbat', nameHe: 'שבת', nameKa: 'შაბათი' },
  'אלו מציאות': { id: 'Bava_Metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
  'המפקיד': { id: 'Bava_Metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
  'הזהב': { id: 'Bava_Metzia', nameHe: 'בבא מציעא', nameKa: 'ბავა მეცია' },
  'חלק': { id: 'Sanhedrin', nameHe: 'סנהדרין', nameKa: 'სანჰედრინი' },
};

function resolvePdfHotspotDafCitation(
  idx: number,
  allHotspots: VilnaPdfHotspot[],
  currentTractateId: string,
  currentTractateHe: string,
  currentTractateKa: string
): {
  startIdx: number;
  endIdx: number;
  markStartIdx: number;
  markEndIdx: number;
  tractateId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  dafId: string;
  citeHe: string;
  contextSnippetHe: string;
} | null {
  const spot = allHotspots[idx];
  if (!spot) return null;

  const isDafWord = (w?: string) =>
    Boolean(
      w &&
        /^(דף|בדף|מדף|לדף|ודף)$/.test(
          w.replace(/[\u0591-\u05C7()[\].,:;!?'״"]/g, '').trim()
        )
    );

  if (spot.isSmallMarker && !isDafWord(spot.word)) return null;

  let dafWordIdx = -1;
  let numWordIdx = -1;
  let parsedDaf: string | null = null;
  let startIdx = idx;
  let endIdx = idx;
  let explicitTractate: {
    id: string;
    nameHe: string;
    nameKa: string;
  } | null = null;

  const prevSpot = allHotspots[idx - 1];
  const nextSpot = allHotspots[idx + 1];

  // Combine token with any adjacent punctuation from the partner word (e.g. "(.דף כד)" where the dot is attached to ".דף")
  const parseWithPartnerPunct = (numWord: string, partnerWord: string) => {
    const direct = parsePdfHebrewDafToken(numWord);
    if (direct && (/[.:]/.test(numWord) || /ע["״'][אב]/.test(numWord))) {
      return direct;
    }
    if (partnerWord.includes(':')) {
      return parsePdfHebrewDafToken(`${numWord}:`) || direct;
    }
    if (partnerWord.includes('.')) {
      return parsePdfHebrewDafToken(`${numWord}.`) || direct;
    }
    return direct;
  };

  // Single-token check: "(דף כד.)" / "(דף כד:)" in a single hotspot
  const singleDafMatch = spot.word.match(/[(\[]?(?:ב|מ|ל|ו)?דף[\s\-_־\.]*([א-ת]{1,3})([.:]?)[)\]]?/);
  if (singleDafMatch && singleDafMatch[1]) {
    const cand = parsePdfHebrewDafToken(singleDafMatch[1] + (singleDafMatch[2] || '.'));
    if (cand) {
      parsedDaf = cand;
      startIdx = idx;
      endIdx = idx;
      numWordIdx = idx;
      dafWordIdx = idx;
    }
  } else if (/^[(\[][א-ת]{1,3}[.:][)\]]$/.test(spot.word)) {
    const cand = parsePdfHebrewDafToken(spot.word, true);
    if (cand) {
      parsedDaf = cand;
      startIdx = idx;
      endIdx = idx;
      numWordIdx = idx;
    }
  }

  // Case 1a: Tapped "דף" (e.g. ")דף" or "(דף" or "(.דף") followed by Daf number (e.g. "כד." or "כד)")
  if (
    !parsedDaf &&
    isDafWord(spot.word) &&
    nextSpot &&
    nextSpot.section === spot.section &&
    parseWithPartnerPunct(nextSpot.word, spot.word)
  ) {
    dafWordIdx = idx;
    numWordIdx = idx + 1;
    parsedDaf = parseWithPartnerPunct(nextSpot.word, spot.word);
    startIdx = idx;
    endIdx = idx + 1;
  }
  // Case 1b: Tapped "דף" when the Daf number is the preceding hotspot on the same row/section (visual RTL order)
  else if (
    !parsedDaf &&
    isDafWord(spot.word) &&
    prevSpot &&
    prevSpot.section === spot.section &&
    parseWithPartnerPunct(prevSpot.word, spot.word)
  ) {
    dafWordIdx = idx;
    numWordIdx = idx - 1;
    parsedDaf = parseWithPartnerPunct(prevSpot.word, spot.word);
    startIdx = idx - 1;
    endIdx = idx;
  }
  // Case 2a: Tapped the Daf number token itself (e.g. "כד.(" or "כד.") preceded by "דף"
  else if (
    prevSpot &&
    prevSpot.section === spot.section &&
    isDafWord(prevSpot.word) &&
    parseWithPartnerPunct(spot.word, prevSpot.word)
  ) {
    dafWordIdx = idx - 1;
    numWordIdx = idx;
    parsedDaf = parseWithPartnerPunct(spot.word, prevSpot.word);
    startIdx = idx - 1;
    endIdx = idx;
  }
  // Case 2b: Tapped the Daf number token itself followed by "דף" (visual RTL order)
  else if (
    nextSpot &&
    nextSpot.section === spot.section &&
    isDafWord(nextSpot.word) &&
    parseWithPartnerPunct(spot.word, nextSpot.word)
  ) {
    dafWordIdx = idx + 1;
    numWordIdx = idx;
    parsedDaf = parseWithPartnerPunct(spot.word, nextSpot.word);
    startIdx = idx;
    endIdx = idx + 1;
  }
  // Case 3: Tapped a Tractate token (e.g. "בברכות" or ")סנהדרין")
  else {
    const trMatch = matchPdfHebrewTractate(spot.word, nextSpot?.word);
    if (trMatch) {
      const trLen = trMatch.consumedTwoWords ? 2 : 1;
      explicitTractate = {
        id: trMatch.id,
        nameHe: trMatch.nameHe,
        nameKa: trMatch.nameKa,
      };
      startIdx = idx;
      endIdx = idx + trLen - 1;
      // Look up to 6 words ahead in the same section for "דף <num>" (e.g. "בברכות פרק אין עומדין )דף לג.(")
      for (let k = idx + trLen; k <= Math.min(allHotspots.length - 2, idx + trLen + 5); k++) {
        if (allHotspots[k].section !== spot.section) break;
        if (
          isDafWord(allHotspots[k].word) &&
          allHotspots[k + 1]?.section === spot.section &&
          parsePdfHebrewDafToken(allHotspots[k + 1].word)
        ) {
          parsedDaf = parsePdfHebrewDafToken(allHotspots[k + 1].word);
          dafWordIdx = k;
          numWordIdx = k + 1;
          if (k === idx + trLen) {
            endIdx = k + 1;
          }
          break;
        }
      }
      if (!parsedDaf) {
        const directNext = allHotspots[idx + trLen];
        if (directNext && directNext.section === spot.section) {
          const directDaf = parsePdfHebrewDafToken(directNext.word, true);
          if (directDaf) {
            parsedDaf = directDaf;
            numWordIdx = idx + trLen;
            endIdx = idx + trLen;
          }
        }
      }
    }
  }

  if (!parsedDaf) return null;

  // Resolve Tractate if not explicitly tapped in Case 3:
  // Scan backward up to 18 hotspots in the same section from dafWordIdx to find the nearest Tractate or Perek name
  if (!explicitTractate && dafWordIdx >= 0) {
    for (let k = dafWordIdx - 1; k >= Math.max(0, dafWordIdx - 18); k--) {
      const candSpot = allHotspots[k];
      if (!candSpot || candSpot.section !== spot.section) break;
      const cleanCand = candSpot.word
        .replace(/[\u0591-\u05C7()[\].,:;!?'״"]/g, '')
        .trim();

      if (cleanCand === 'לקמן' || cleanCand === 'לעיל') {
        explicitTractate = {
          id: currentTractateId,
          nameHe: currentTractateHe,
          nameKa: currentTractateKa,
        };
        if (k === dafWordIdx - 1) startIdx = k;
        break;
      }

      const tr1 = matchPdfHebrewTractate(candSpot.word, allHotspots[k + 1]?.word);
      if (tr1) {
        explicitTractate = {
          id: tr1.id,
          nameHe: tr1.nameHe,
          nameKa: tr1.nameKa,
        };
        if (k >= dafWordIdx - 2) startIdx = k;
        break;
      }

      const nextCand = allHotspots[k + 1];
      if (nextCand && nextCand.section === spot.section) {
        const cleanNext = nextCand.word
          .replace(/[\u0591-\u05C7()[\].,:;!?'״"]/g, '')
          .trim();
        const twoWordPerek = `${cleanCand} ${cleanNext}`;
        if (FAMOUS_PEREK_TRACTATE_MAP[twoWordPerek]) {
          explicitTractate = FAMOUS_PEREK_TRACTATE_MAP[twoWordPerek];
          break;
        }
      }
      if (FAMOUS_PEREK_TRACTATE_MAP[cleanCand]) {
        explicitTractate = FAMOUS_PEREK_TRACTATE_MAP[cleanCand];
        break;
      }
    }
  }

  // Fallback to current tractate (or Berakhot if daf number exceeds Taanit's 31 dapim)
  if (!explicitTractate) {
    const dafNumInt = parseInt(parsedDaf, 10);
    if (currentTractateId === 'Taanit' && dafNumInt > 31) {
      explicitTractate = {
        id: 'Berakhot',
        nameHe: 'ברכות',
        nameKa: 'ბერახოთი',
      };
    } else {
      explicitTractate = {
        id: currentTractateId,
        nameHe: currentTractateHe,
        nameKa: currentTractateKa,
      };
    }
  }

  const dafTokenDisplay =
    numWordIdx >= 0
      ? allHotspots[numWordIdx].word.replace(/[()[\]]/g, '').trim()
      : parsedDaf;

  // Build contextSnippetHe from surrounding words in the same commentary/gemara section so the Source Note Window can focus on the exact cited sugya segment
  const contextWords: string[] = [];
  const minScan = Math.max(0, startIdx - 10);
  const maxScan = Math.min(allHotspots.length - 1, endIdx + 14);
  // Prefer words immediately following the citation (usually the quoted phrase itself), then preceding words
  for (let k = endIdx + 1; k <= maxScan; k++) {
    const hs = allHotspots[k];
    if (!hs || hs.section !== spot.section || hs.isSmallMarker) continue;
    const cw = hs.cleanWord;
    if (cw.length >= 2 && !isDafWord(hs.word)) {
      contextWords.push(cw);
    }
  }
  for (let k = startIdx - 1; k >= minScan; k--) {
    const hs = allHotspots[k];
    if (!hs || hs.section !== spot.section || hs.isSmallMarker) continue;
    const cw = hs.cleanWord;
    if (cw.length >= 2 && !isDafWord(hs.word)) {
      contextWords.push(cw);
    }
  }

  return {
    startIdx,
    endIdx,
    // Blue highlight covers only the daf reference itself ("(דף ז:)" / "דף ז:"), never the lead word (לקמן / tractate name).
    markStartIdx:
      dafWordIdx >= 0 && numWordIdx >= 0
        ? Math.min(dafWordIdx, numWordIdx)
        : numWordIdx >= 0
          ? numWordIdx
          : Math.min(startIdx, endIdx),
    markEndIdx:
      dafWordIdx >= 0 && numWordIdx >= 0
        ? Math.max(dafWordIdx, numWordIdx)
        : numWordIdx >= 0
          ? numWordIdx
          : Math.max(startIdx, endIdx),
    tractateId: explicitTractate.id,
    tractateNameHe: explicitTractate.nameHe,
    tractateNameKa: explicitTractate.nameKa,
    dafId: parsedDaf,
    citeHe: `${explicitTractate.nameHe} דף ${dafTokenDisplay}`,
    contextSnippetHe:
      contextWords.slice(0, 14).join(' ') || `${explicitTractate.nameHe} דף ${dafTokenDisplay}`,
  };
}

/**
 * Matches a PDF word + row context to the best TalmudSentence in dafData
 */
function matchHotspotToSentence(
  word: string,
  rowText: string,
  section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin',
  effectiveMishnah: TalmudSentence[],
  effectiveGemara: TalmudSentence[],
  effectiveRashi: TalmudSentence[],
  effectiveTosafot: TalmudSentence[],
  dafData: DafPageData
): TalmudSentence {
  const cleanW = normalizeHebrewWord(word);
  const pool =
    section === 'rashi'
      ? effectiveRashi
      : section === 'tosafot'
        ? effectiveTosafot
        : section === 'mishnah'
          ? effectiveMishnah
          : [...effectiveGemara, ...effectiveMishnah];

  if (pool.length > 0 && cleanW.length >= 2) {
    const rowWords = rowText
      .split(/\s+/)
      .map((w) => normalizeHebrewWord(w))
      .filter((w) => w.length >= 2);

    let bestSent = pool[0];
    let bestScore = -1;

    for (const s of pool) {
      const sPlain = normalizeHebrewWord(
        `${s.dibburHamatchil || ''} ${s.hebrewText || s.hebrew || ''}`
      );
      let score = 0;
      if (sPlain.includes(cleanW)) score += 4;
      for (const rw of rowWords) {
        if (sPlain.includes(rw)) score += 2;
      }
      if (score > bestScore) {
        bestScore = score;
        bestSent = s;
      }
    }
    if (bestSent) {
      if (rowText && rowText.trim().length > 2) {
        return {
          ...bestSent,
          hebrewText: rowText.trim(),
        };
      }
      return bestSent;
    }
  }

  const fallbackSent =
    effectiveMishnah[0] ||
    effectiveGemara[0] || {
      id: `${dafData.tractateId}-${dafData.dafId}-${section}-auto`,
      source: section === 'rashi' || section === 'tosafot' ? section : 'gemara',
      hebrewText: rowText || word,
      translationHe: rowText || word,
      translationKa: 'თალმუდის ორიგინალური სტრიქონი ვილნას დაფიდან.',
      explanationKa: 'ვილნას შასის კლასიკური ტექსტი და კომენტარი.',
      explanationHe: rowText || word,
    };

  return {
    ...fallbackSent,
    hebrewText: rowText && rowText.trim().length > 1 ? rowText.trim() : fallbackSent.hebrewText,
  };
}

/**
 * Extracts exact per-word RTL coordinates AND small index markers ((א), (א, א, 1..9, [א])
 * + marginal commentary entries (הגהות הב"ח, מסורת הש"ס, עין משפט, תורה אור, הגהות הגר"א)
 * from PDF.js textContent.
 */
function extractHotspotsFromTextContent(
  items: Array<Record<string, unknown>>,
  viewport: pdfjsLib.PageViewport,
  isAmudBet: boolean,
  effectiveMishnah: TalmudSentence[],
  effectiveGemara: TalmudSentence[],
  effectiveRashi: TalmudSentence[],
  effectiveTosafot: TalmudSentence[],
  dafData: DafPageData
): VilnaPdfHotspot[] {
  interface RawPdfRun {
    str: string;
    quoteAdjacent?: boolean;
    vpLeft: number;
    vpTop: number;
    vpWidth: number;
    vpHeight: number;
    pdfH: number;
    /** PDF font resource of the run: separates opening typefaces from the body script. */
    font?: string;
    leftPct: number;
    topPct: number;
    section: 'header' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'margin';
    marginCommType?: MarginCommentaryType;
    marginEntryKey?: string;
  }

  const vpW = Math.max(1, viewport.width);
  const vpH = Math.max(1, viewport.height);
  const initialRuns: RawPdfRun[] = [];
  const stopMarks: Array<{ leftPct: number; rightPct: number; baselinePct: number; mark: '.' | ':' }> = [];
  const quoteMarks: Array<{ leftPct: number; rightPct: number; baselinePct: number; mark: '"' | "'" }> = [];
  const isSiddurPdf = dafData.tractateId.startsWith('Siddur_');
  const isChumashPdf = dafData.tractateId.startsWith('Chumash_');

  // Locate the real gutters between the side margins and the main text on this scan.
  const marginGutters =
    isSiddurPdf || isChumashPdf
      ? REFERENCE_GUTTERS
      : findMarginGutters(
          items
            .filter((it) => String(it.str || '').trim() && Array.isArray(it.transform))
            .map((it) => {
              const t = it.transform as number[];
              const w = Math.max(2, Number(it.width) || 0);
              const [x1, y1] = viewport.convertToViewportPoint(Number(t[4]) || 0, Number(t[5]) || 0);
              const [x2] = viewport.convertToViewportPoint((Number(t[4]) || 0) + w, Number(t[5]) || 0);
              return {
                leftPct: (Math.min(x1, x2) / vpW) * 100,
                rightPct: (Math.max(x1, x2) / vpW) * 100,
                topPct: (y1 / vpH) * 100,
              };
            })
        );

  for (const rawItem of items) {
    let str = String(rawItem.str || '').trim();
    if (isSiddurPdf || isChumashPdf) {
      // Strip decorative border ASCII characters from scanned Siddur/Chumash OCR while keeping Hebrew, digits, and brackets
      str = str
        .replace(/[^\u0590-\u05FF0-9()\[\].,:;'"״׳\s\-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    // Quote marks are kept briefly: they reveal abbreviations (ב"ח) and are dropped in Step 1.
    const isQuoteOnly = /^["'״׳`]+$/.test(str);
    const transform = rawItem.transform as number[] | undefined;
    // Separate quote runs (ר' / ק"ש in Mac-Hebrew scans): remember them so the word they follow
    // keeps its abbreviation mark for dibbur-hamatchil matching.
    if (isQuoteOnly && transform && transform.length >= 6) {
      const [qx1, qy] = viewport.convertToViewportPoint(Number(transform[4]) || 0, Number(transform[5]) || 0);
      const [qx2] = viewport.convertToViewportPoint((Number(transform[4]) || 0) + Math.max(1, Number(rawItem.width) || 2), Number(transform[5]) || 0);
      quoteMarks.push({
        leftPct: (Math.min(qx1, qx2) / vpW) * 100,
        rightPct: (Math.max(qx1, qx2) / vpW) * 100,
        baselinePct: (qy / vpH) * 100,
        mark: /["״]/.test(str) || str.length > 1 ? '"' : "'",
      });
    }
    // Standalone "." / ":" runs end a dibbur hamatchil; remember where they sit before dropping them.
    if (str && /^[.:'"״׳\s]+$/.test(str) && /[.:]/.test(str) && transform && transform.length >= 6) {
      const [sx1, sy] = viewport.convertToViewportPoint(Number(transform[4]) || 0, Number(transform[5]) || 0);
      const [sx2] = viewport.convertToViewportPoint((Number(transform[4]) || 0) + Math.max(1, Number(rawItem.width) || 2), Number(transform[5]) || 0);
      stopMarks.push({
        leftPct: (Math.min(sx1, sx2) / vpW) * 100,
        rightPct: (Math.max(sx1, sx2) / vpW) * 100,
        baselinePct: (sy / vpH) * 100,
        mark: str.includes(':') ? ':' : '.',
      });
    }
    // Accept Hebrew letters, digits (for Torah Or 1..9), and parentheses/brackets (for (א), [א])
    if (!str || (!isQuoteOnly && !/[\u0590-\u05FF0-9\(\)\[\]]/.test(str) && !isCircleMarker(str))) continue;
    // Skip pure punctuation like standalone "." or ":" unless it's a bracket, digit or quote
    if (!isQuoteOnly && /^[.,:;'"״׳\-–—]+$/.test(str)) continue;

    if (!transform || transform.length < 6) continue;

    const pdfX = Number(transform[4]) || 0;
    const pdfY = Number(transform[5]) || 0;
    const pdfH = Math.max(
      5.5,
      Math.hypot(Number(transform[2]) || 0, Number(transform[3]) || 0) ||
        Number(rawItem.height) ||
        10
    );
    const pdfW = Math.max(2, Number(rawItem.width) || str.length * 5);

    const [vpX1, vpBaselineY] = viewport.convertToViewportPoint(pdfX, pdfY);
    const [vpX2, vpTopY] = viewport.convertToViewportPoint(
      pdfX + pdfW,
      pdfY + pdfH * 0.88
    );

    const vpLeft = Math.min(vpX1, vpX2);
    const vpWidth = Math.max(2.5, Math.abs(vpX2 - vpX1));
    const vpHeight = Math.max(6.5, Math.abs(vpBaselineY - vpTopY) * 1.16);
    const vpTop = Math.min(vpBaselineY, vpTopY) - vpHeight * 0.08;

    const leftPct = (vpLeft / vpW) * 100;
    const topPct = (vpTop / vpH) * 100;

    if (leftPct < -2 || leftPct > 100 || topPct < -2 || topPct > 100) continue;

    let section: RawPdfRun['section'];
    if (isChumashPdf) {
      if (topPct < 6.5) {
        section = 'header';
      } else if (topPct < 48.5) {
        // Upper Mikraot Gedolot tier: Right wide Torah column ('mishnah') + Left Targum Onkelos column ('gemara')
        section = leftPct >= 35.5 ? 'mishnah' : 'gemara';
      } else if (topPct < 74.0) {
        // Middle tier: Rashi commentary (פירש״י)
        section = 'rashi';
      } else {
        // Lower tier: Baal HaTurim, Siftei Chachamim, Ramban, Ibn Ezra
        section = 'tosafot';
      }
    } else if (isSiddurPdf) {
      if (topPct < 11.5 && (pdfH < 8.5 || str.includes('שויתי') || str.includes('נהורא'))) {
        section = 'header';
      } else if (topPct >= 66.0 && pdfH < 9.2) {
        // Bottom פירוש כוונת הלב / עיון תפלה commentary section on Siddur page
        section = 'rashi';
      } else if (pdfH >= 11.4 && topPct < 66.0) {
        section = 'mishnah';
      } else {
        section = 'gemara';
      }
    } else {
      section = classifyVilnaCoordinateZone(
        normalizeVilnaX(leftPct + (vpWidth / vpW) * 50, marginGutters),
        topPct,
        isAmudBet,
        pdfH
      );
    }

    initialRuns.push({
      str,
      vpLeft,
      vpTop,
      vpWidth,
      vpHeight,
      pdfH,
      font: typeof rawItem.fontName === 'string' ? rawItem.fontName : undefined,
      leftPct,
      topPct,
      section,
    });
  }

  if (initialRuns.length === 0) return [];

  if (!isSiddurPdf && !isChumashPdf) {
    // Full-width commentary lines below the Gemara belong to one commentator, never split by side.
    const probe = initialRuns.map((r) => ({
      run: r,
      topPct: r.topPct,
      pdfH: r.pdfH,
      section: r.section,
      centerPct: normalizeVilnaX(r.leftPct + (r.vpWidth / vpW) * 50, marginGutters),
    }));
    (globalThis as any).__dbgRuns0 = initialRuns.map((r) => ({ s: r.str, sec: r.section, t: r.topPct, l: r.leftPct, h: r.pdfH }));
    assignFullWidthCommentaryRows(probe);
    for (const p of probe) p.run.section = p.section;
    (globalThis as any).__dbgRuns1 = initialRuns.map((r) => ({ s: r.str, sec: r.section, t: r.topPct, l: r.leftPct, h: r.pdfH }));
  }

  // Enlarged opening words of Rashi / Tosafot sit in the top commentary lines but are taller than
  // commentary script, so the zone rules call them header/mishnah/margin. Give them the column of
  // the commentary text printed on the same baseline right next to them.
  if (!isSiddurPdf && !isChumashPdf) {
    // The Gemara's own square type is not an enlarged opening: its first line sits beside the commentary too.
    const mainSizes = new Map<number, number>();
    for (const r of initialRuns) {
      if (r.pdfH < 12.6 || r.pdfH >= 15.8) continue;
      const k = Math.round(r.pdfH * 10);
      mainSizes.set(k, (mainSizes.get(k) || 0) + r.str.length);
    }
    let mainBodyH = 0;
    let mainBodyN = 0;
    for (const [k, c] of mainSizes) if (c > mainBodyN) { mainBodyH = k / 10; mainBodyN = c; }
    for (const r of initialRuns) {
      if (r.topPct >= 9 || r.pdfH < 12.9 || r.pdfH > 18.5) continue;
      if (mainBodyH && Math.abs(r.pdfH - mainBodyH) < 0.6) continue;
      if (r.section === 'rashi' || r.section === 'tosafot' || r.section === 'gemara') continue;
      const rBottom = r.vpTop + r.vpHeight;
      const rRight = r.vpLeft + r.vpWidth;
      let best: { gap: number; section: RawPdfRun['section'] } | null = null;
      for (const o of initialRuns) {
        if (o === r || (o.section !== 'rashi' && o.section !== 'tosafot') || o.pdfH >= 12.6) continue;
        if (Math.abs(o.vpTop + o.vpHeight - rBottom) > Math.max(4, o.vpHeight * 0.6)) continue;
        const gap = Math.max(o.vpLeft - rRight, r.vpLeft - (o.vpLeft + o.vpWidth), 0);
        if (gap / vpW > 0.035) continue;
        if (!best || gap < best.gap) best = { gap, section: o.section };
      }
      if (best) r.section = best.section;
    }
  }

  // Step 1: Pre-merge adjacent bracket/parenthesis tokens in stream order
  // (e.g., "(" + "א" + ")" -> "(א)" for Hagahot HaBach, "(" + "א" -> "(א" for Masoret HaShas)
  const runs: RawPdfRun[] = [];
  for (let i = 0; i < initialRuns.length; i++) {
    const cur = { ...initialRuns[i] };
    while (
      i + 1 < initialRuns.length &&
      Math.abs(initialRuns[i + 1].topPct - cur.topPct) < 0.65 &&
      Math.abs(
        initialRuns[i + 1].leftPct - (cur.leftPct + (cur.vpWidth / vpW) * 100)
      ) < 1.25 &&
      /^[()\[\]\u05D0-\u05EA]{1,4}$/.test(cur.str + initialRuns[i + 1].str) &&
      // A complete one-sided marker followed by another letter is TWO indices, not a word.
      canJoinMarkerFragments(cur.str, initialRuns[i + 1].str, cur.str + initialRuns[i + 1].str) &&
      (/[\(\)\[\]]/.test(cur.str) || /[\(\)\[\]]/.test(initialRuns[i + 1].str))
    ) {
      const nxt = initialRuns[++i];
      const minVpLeft = Math.min(cur.vpLeft, nxt.vpLeft);
      const maxVpRight = Math.max(cur.vpLeft + cur.vpWidth, nxt.vpLeft + nxt.vpWidth);
      cur.str = cur.str + nxt.str;
      cur.vpLeft = minVpLeft;
      cur.vpWidth = maxVpRight - minVpLeft;
      cur.leftPct = (minVpLeft / vpW) * 100;
      cur.pdfH = Math.min(cur.pdfH, nxt.pdfH);
      cur.quoteAdjacent = cur.quoteAdjacent || nxt.quoteAdjacent;
    }
    // A quote mark glued to a letter makes it an abbreviation (ב"ח, כ"ב) — remember that before
    // the quote itself is discarded, so the letter is never mistaken for a reference marker.
    if (/^["'״׳`]+$/.test(cur.str.trim())) {
      const touchesQuote = (r?: RawPdfRun) => {
        if (!r) return false;
        const rRight = r.leftPct + (r.vpWidth / vpW) * 100;
        const qRight = cur.leftPct + (cur.vpWidth / vpW) * 100;
        const gap = Math.max(cur.leftPct - rRight, r.leftPct - qRight);
        return (
          Math.abs(r.topPct - cur.topPct) < 0.65 &&
          gap < 0.6 &&
          Math.abs(r.pdfH - cur.pdfH) <= Math.max(0.8, cur.pdfH * 0.25)
        );
      };
      const prevKept = runs[runs.length - 1];
      if (touchesQuote(prevKept)) prevKept.quoteAdjacent = true;
      const nextRaw = initialRuns[i + 1];
      if (touchesQuote(nextRaw)) nextRaw.quoteAdjacent = true;
      continue;
    }
    // Discard lonely bracket without any letter or digit
    if (!/[\u0590-\u05FF0-9]/.test(cur.str) && !isCircleMarker(cur.str) && !/^[()[\]]{1,2}$/.test(cur.str)) continue;
    runs.push(cur);
  }

  // Step 2: Walk margin runs to tag commentary type and entry key.
  // CRITICAL: Maintain SEPARATE state for Left Margin (leftPct < 50) and Right Margin (leftPct >= 50)
  // so commentary headers and entry keys from opposite sides of the Daf folio NEVER cross-contaminate!
  // Vilna layout: Ein Mishpat sits on the OUTER margin (left on amud A, right on amud B).
  let leftMarginComm: MarginCommentaryType = isAmudBet ? 'masoret' : 'ein-mishpat';
  let leftMarginKey: string | undefined;
  let rightMarginComm: MarginCommentaryType = isAmudBet ? 'ein-mishpat' : 'masoret';
  let rightMarginKey: string | undefined;

  // Walk each margin column top-to-bottom (right-to-left within a line) so a commentary header
  // applies to the entries printed below it, regardless of the PDF stream order.
  const marginWalk = runs
    .filter((r) => r.section === 'margin')
    .sort((a, b) => {
      const sideDiff = Number(a.leftPct >= 50) - Number(b.leftPct >= 50);
      if (sideDiff !== 0) return sideDiff;
      const ya = a.vpTop + a.vpHeight * 0.5;
      const yb = b.vpTop + b.vpHeight * 0.5;
      if (Math.abs(ya - yb) > Math.max(2, Math.min(a.vpHeight, b.vpHeight) * 0.5)) return ya - yb;
      return b.vpLeft + b.vpWidth - (a.vpLeft + a.vpWidth);
    });
  for (const run of marginWalk) {
    if (run.section === 'margin') {
      const isRightCol = run.leftPct >= 50;
      let activeMarginComm = isRightCol ? rightMarginComm : leftMarginComm;
      let activeMarginKey = isRightCol ? rightMarginKey : leftMarginKey;

      const s = run.str;
      if (s.includes('מסורת הש') || s.includes('מסורת הש״ס')) {
        activeMarginComm = 'masoret';
        activeMarginKey = undefined;
      } else if (s.includes('הגהות הב') || s.includes('הגהות הב״ח')) {
        activeMarginComm = 'bach';
        activeMarginKey = undefined;
      } else if (s.includes('עין משפט') || s.includes('נר מצוה')) {
        activeMarginComm = 'ein-mishpat';
        activeMarginKey = undefined;
      } else if (s.includes('תורה אור')) {
        activeMarginComm = 'torah-or';
        activeMarginKey = undefined;
      } else if (s.includes('גליון הש') || s.includes('גליון הש״ס') || s.includes('גליון הש"ס')) {
        activeMarginComm = 'gilyon-hashas';
        activeMarginKey = 'גליון';
      } else if (
        s.includes('הגהות הגר') ||
        s.includes('הגהות מהר')
      ) {
        activeMarginComm = 'gra';
        activeMarginKey = undefined;
      } else if (s.includes('מוסף רש')) {
        activeMarginComm = 'musaf-rashi';
        activeMarginKey = 'א';
      } else if (s.includes('רבינו חננאל')) {
        activeMarginComm = 'rabbeinu-chananel';
        activeMarginKey = 'א';
      }

      // Check the first token of the run (or full token) for entry key markers:
      const firstTok = (s.split(/\s+/)[0] || '').trim();

      // Check Torah Or digits (e.g. "2.", "2", "2-", "[2]")
      const torahOrKey = activeMarginComm === 'torah-or' ? getTorahOrNumber(firstTok) : undefined;
      if (torahOrKey) {
        activeMarginKey = torahOrKey;
        if (!activeMarginComm || activeMarginComm === 'ein-mishpat') {
          activeMarginComm = 'torah-or';
        }
      } else if (
        activeMarginComm === 'bach' &&
        /^[\(\)]{1,2}[\u05D0-\u05EA]{1,2}[\(\)]{1,2}$/.test(firstTok)
      ) {
        activeMarginKey = firstTok.replace(/[^\u05D0-\u05EA]/g, '');
      } else if (
        activeMarginComm === 'masoret' &&
        (/^[\(\)][\u05D0-\u05EA]{1,2}$/.test(firstTok) ||
          /^[\u05D0-\u05EA]{1,2}[\(\)]$/.test(firstTok))
      ) {
        activeMarginKey = firstTok.replace(/[^\u05D0-\u05EA]/g, '');
      } else if (
        (activeMarginComm === 'ein-mishpat' || !activeMarginComm) &&
        /^[\u05D0-\u05EA][.,:;\-–—־]?$/.test(firstTok)
      ) {
        activeMarginKey = firstTok.replace(/[^\u05D0-\u05EA]/g, '');
        activeMarginComm = 'ein-mishpat';
      } else if (
        activeMarginComm === 'gra' &&
        /^[\[\(\]][\u05D0-\u05EA]{1,2}[\]\)]?$/.test(firstTok)
      ) {
        activeMarginKey = firstTok.replace(/[^\u05D0-\u05EA]/g, '');
      }

      run.marginCommType = activeMarginComm;
      run.marginEntryKey = activeMarginKey;

      if (isRightCol) {
        rightMarginComm = activeMarginComm;
        rightMarginKey = activeMarginKey;
      } else {
        leftMarginComm = activeMarginComm;
        leftMarginKey = activeMarginKey;
      }
    }
  }

  // Step 3: Group runs into horizontal rows within each column/section.
  // Also absorb inline small markers / parenthetical citations and bold Dibbur lead words that sit on the exact same physical line!
  interface RowBucket {
    id: string;
    section: RawPdfRun['section'];
    centerY: number;
    avgH: number;
    minLeftPct: number;
    maxRightPct: number;
    runs: RawPdfRun[];
  }

  const sortedRunsForRows = [...runs].sort((a, b) => {
    const ya = a.vpTop + a.vpHeight * 0.5;
    const yb = b.vpTop + b.vpHeight * 0.5;
    if (Math.abs(ya - yb) > 4) return ya - yb;
    return b.leftPct - a.leftPct;
  });

  const rowBuckets: RowBucket[] = [];
  for (const run of sortedRunsForRows) {
    const runCenterY = run.vpTop + run.vpHeight * 0.5;
    const runRightPct = run.leftPct + (run.vpWidth / vpW) * 100;
    let matchedBucket: RowBucket | null = null;

    for (const b of rowBuckets) {
      const sameVerticalLine =
        Math.abs(b.centerY - runCenterY) <= Math.max(b.avgH, run.vpHeight) * 0.62;
      if (!sameVerticalLine) continue;

      if (b.section === run.section) {
        matchedBucket = b;
        break;
      }

      // If a run is an inline small marker/citation or a bold lead word sitting horizontally adjacent to this bucket in the main body, keep it on the same line!
      // Never move text between columns: Rashi and Tosafot touch at the top of the page, and the
      // first Gemara line sits right beside them — absorbing them mixes three texts into one line.
      const isComm = (s: RawPdfRun['section']) => s === 'rashi' || s === 'tosafot';
      const crossesColumns =
        (isComm(b.section) && isComm(run.section)) ||
        ((run.section === 'mishnah' || run.section === 'gemara') && run.pdfH >= 12.6 && run.pdfH < 15.5) ||
        ((b.section === 'mishnah' || b.section === 'gemara') && isComm(run.section) && run.pdfH >= 9.6 && run.pdfH < 12.6);
      if (
        !crossesColumns &&
        b.section !== 'margin' &&
        run.section !== 'margin' &&
        b.section !== 'header' &&
        run.section !== 'header'
      ) {
        const horizGap =
          run.leftPct > b.maxRightPct
            ? run.leftPct - b.maxRightPct
            : b.minLeftPct > runRightPct
              ? b.minLeftPct - runRightPct
              : 0;
        const isInlineCitationOrLead =
          run.pdfH < 9.6 ||
          run.pdfH >= 15.5 ||
          b.avgH >= 15.5 ||
          (Math.abs(b.avgH - run.vpHeight) < 1.8 && horizGap < 1.6);
        if (horizGap < 1.8 && isInlineCitationOrLead) {
          run.section = b.section;
          matchedBucket = b;
          break;
        }
      }
    }

    if (matchedBucket) {
      matchedBucket.runs.push(run);
      const n = matchedBucket.runs.length;
      matchedBucket.centerY = (matchedBucket.centerY * (n - 1) + runCenterY) / n;
      matchedBucket.avgH = (matchedBucket.avgH * (n - 1) + run.vpHeight) / n;
      matchedBucket.minLeftPct = Math.min(matchedBucket.minLeftPct, run.leftPct);
      matchedBucket.maxRightPct = Math.max(matchedBucket.maxRightPct, runRightPct);
    } else {
      rowBuckets.push({
        id: `${run.section}-row-${Math.round(runCenterY)}-${Math.round(run.leftPct)}`,
        section: run.section,
        centerY: runCenterY,
        avgH: run.vpHeight,
        minLeftPct: run.leftPct,
        maxRightPct: runRightPct,
        runs: [run],
      });
    }
  }

  // CRITICAL FOR MULTI-WORD SELECTION:
  // Sort rows FIRST by section (so Mishnah, Gemara, Rashi, Tosafot each form a contiguous sequence of words),
  // and THEN top-to-bottom within each section!
  const sectionSortRank: Record<string, number> = {
    header: 0,
    mishnah: 1,
    gemara: 2,
    rashi: 3,
    tosafot: 4,
    margin: 5,
  };
  rowBuckets.sort((a, b) => {
    const secDiff = (sectionSortRank[a.section] ?? 9) - (sectionSortRank[b.section] ?? 9);
    if (secDiff !== 0) return secDiff;
    return a.centerY - b.centerY;
  });

  const hotspots: VilnaPdfHotspot[] = [];
  let globalIdx = 0;
  const usedCanonicalRowTopPcts = new Set<number>();
  const siddurPageNum = isSiddurPdf
    ? parseInt(String(dafData.dafId).replace(/[^0-9]/g, ''), 10) || 29
    : 0;

  for (const bucket of rowBuckets) {
    // Sort runs in this row from right to left (Hebrew reading order: largest vpLeft + vpWidth first)
    bucket.runs.sort((a, b) => b.vpLeft + b.vpWidth - (a.vpLeft + a.vpWidth));

    const bucketTopPct = Math.max(
      0.2,
      Math.min(99, ((bucket.centerY - bucket.avgH * 0.5) / vpH) * 100)
    );
    const bucketHeightPct = Math.max(1.2, Math.min(6, (bucket.avgH / vpH) * 100));

    // If this is a Siddur PDF and matches a Canonical Siddur Row, emit clean full-word boxes!
    if (isSiddurPdf) {
      const canonicalSpec = matchCanonicalSiddurRow(
        dafData.tractateId,
        dafData.dafId,
        bucketTopPct
      );
      if (canonicalSpec) {
        if (!usedCanonicalRowTopPcts.has(canonicalSpec.topPct)) {
          usedCanonicalRowTopPcts.add(canonicalSpec.topPct);
          const canonicalRowId = `siddur-canon-row-${siddurPageNum}-${Math.round(canonicalSpec.topPct * 10)}`;
          let effectiveWords = canonicalSpec.words;
          if (!effectiveWords || effectiveWords.length === 0) {
            const rawWords = canonicalSpec.lineTextHe
              .split(/\s+/)
              .map((w) => w.trim())
              .filter((w) => w.length > 0 && /[\u0590-\u05FF0-9]/.test(w));
            const rowLeft =
              canonicalSpec.leftPct ?? Math.max(16.8, Math.min(42, bucket.minLeftPct));
            const rowRight =
              canonicalSpec.rightPct ?? Math.min(82.5, Math.max(68, bucket.maxRightPct));
            const spanPct = Math.max(8, rowRight - rowLeft);
            const weights = rawWords.map((w) => getWordVisualGlyphWeight(w) + 0.22);
            const totalWeight = Math.max(
              0.5,
              weights.reduce((acc, v) => acc + v, 0)
            );
            let cursorRight = rowRight;
            effectiveWords = rawWords.map((w, idx) => {
              const wPct = (weights[idx] / totalWeight) * spanPct;
              const wLeft =
                idx === rawWords.length - 1
                  ? rowLeft
                  : Math.max(rowLeft, cursorRight - wPct);
              const box = {
                word: w,
                leftPct: Number(wLeft.toFixed(2)),
                rightPct: Number(cursorRight.toFixed(2)),
              };
              cursorRight = Math.max(rowLeft, wLeft - 0.12);
              return box;
            });
          }

          const canonicalSentence: TalmudSentence = {
            id: canonicalRowId,
            source:
              canonicalSpec.section === 'rashi'
                ? 'rashi'
                : canonicalSpec.section === 'gemara'
                  ? 'gemara'
                  : 'mishnah',
            dibburHamatchil: effectiveWords.slice(0, 3).map((w) => w.word).join(' '),
            hebrew: canonicalSpec.lineTextHe,
            hebrewText: canonicalSpec.lineTextHe,
            translationKa: canonicalSpec.translationKa,
            explanationKa:
              canonicalSpec.explanationKa ||
              `${canonicalSpec.translationKa} — განმარტებითი სიდური „ქავანათ ჰალევი“ (გვ. ${siddurPageNum}).`,
          };
          const rowTop = canonicalSpec.topPct;
          const rowH =
            canonicalSpec.heightPct ||
            Math.max(canonicalSpec.section === 'mishnah' ? 2.5 : 1.85, bucketHeightPct);
          for (const wb of effectiveWords) {
            const cleanWord = normalizeHebrewWord(wb.word);
            if (!cleanWord) continue;
            hotspots.push({
              id: `pdf-word-${globalIdx++}`,
              word: wb.word,
              cleanWord,
              section: canonicalSpec.section || bucket.section,
              leftPct: wb.leftPct,
              topPct: rowTop,
              widthPct: Math.max(1.2, wb.rightPct - wb.leftPct),
              heightPct: rowH,
              sentence: canonicalSentence,
              rowId: canonicalRowId,
              lineTextHe: canonicalSpec.lineTextHe,
              isSmallMarker: false,
            });
          }
        }
        continue;
      }

      // For non-canonical Siddur rows:
      // 1) Filter out interlinear small-font OCR noise runs that overlap larger runs on the same line (like "וזעו", "לזנו", "[כמו חי העולמים]")
      const maxRunVpH = Math.max(...bucket.runs.map((r) => r.vpHeight), 1);
      bucket.runs = bucket.runs.filter((r) => {
        const plain = r.str.replace(/[^\u0590-\u05FF]/g, '');
        if (/^(וזעו|לזנו|וזהו|יאהדונהי|אהיה)$/.test(plain)) return false;
        if (r.vpHeight < maxRunVpH * 0.68 && bucket.runs.length > 1) {
          const rLeft = r.leftPct;
          const rRight = r.leftPct + (r.vpWidth / vpW) * 100;
          const overlapsLarger = bucket.runs.some((other) => {
            if (other === r || other.vpHeight < maxRunVpH * 0.75) return false;
            const oLeft = other.leftPct;
            const oRight = other.leftPct + (other.vpWidth / vpW) * 100;
            return Math.min(rRight, oRight) - Math.max(rLeft, oLeft) > -0.6;
          });
          if (overlapsLarger) return false;
        }
        return true;
      });

      // 2) Merge horizontally adjacent split-syllable runs in RTL reading order when gap is tiny
      const mergedSiddurRuns: RawPdfRun[] = [];
      for (let rIdx = 0; rIdx < bucket.runs.length; rIdx++) {
        const cur = { ...bucket.runs[rIdx] };
        while (rIdx + 1 < bucket.runs.length) {
          const nxt = bucket.runs[rIdx + 1];
          const curLeftPct = cur.leftPct;
          const nxtRightPct = nxt.leftPct + (nxt.vpWidth / vpW) * 100;
          const gapPct = curLeftPct - nxtRightPct;
          const curLetters = cur.str.replace(/[^\u05D0-\u05EA]/g, '').length;
          const nxtLetters = nxt.str.replace(/[^\u05D0-\u05EA]/g, '').length;
          const hasSpace = /\s/.test(cur.str.trim()) || /\s/.test(nxt.str.trim());
          if (
            !hasSpace &&
            gapPct >= -0.8 &&
            gapPct <= 1.75 &&
            (curLetters <= 2 || nxtLetters <= 2) &&
            curLetters + nxtLetters <= 9
          ) {
            rIdx++;
            const minVpLeft = Math.min(cur.vpLeft, nxt.vpLeft);
            const maxVpRight = Math.max(cur.vpLeft + cur.vpWidth, nxt.vpLeft + nxt.vpWidth);
            cur.str = `${cur.str.trim()}${nxt.str.trim()}`;
            cur.vpLeft = minVpLeft;
            cur.vpWidth = maxVpRight - minVpLeft;
            cur.leftPct = (minVpLeft / vpW) * 100;
            cur.vpHeight = Math.max(cur.vpHeight, nxt.vpHeight);
          } else {
            break;
          }
        }
        mergedSiddurRuns.push(cur);
      }
      bucket.runs = mergedSiddurRuns;
      if (bucket.runs.length === 0) continue;
    }

    const ordinaryHeights = bucket.runs.filter(r => /[א-ת]{3}/.test(r.str) && !/^[()[\]]/.test(r.str)).map(r => r.pdfH).sort((a, b) => a - b);
    const bodyFontHeight = ordinaryHeights.length
      ? ordinaryHeights[Math.floor(ordinaryHeights.length / 2)]
      : Math.max(...bucket.runs.map((r) => r.pdfH));

    // Rejoin reference markers that the PDF splits into separate runs: "(" + "א" + ")" -> "(א)", "[" + "א" + "]" -> "[א]".
    if (!isSiddurPdf && bucket.runs.length > 1) {
      const isPiece = (s: string) => /^[()\[\]]{1,2}$|^[\u05D0-\u05EA]{1,2}$/.test(s);
      const isMarkerShape = (s: string) =>
        /^[()\[\]]{0,2}[\u05D0-\u05EA]{1,2}[()\[\]]{0,2}$/.test(s);
      const joined: RawPdfRun[] = [];
      for (let rIdx = 0; rIdx < bucket.runs.length; rIdx++) {
        const cur = { ...bucket.runs[rIdx] };
        while (rIdx + 1 < bucket.runs.length) {
          const nxt = bucket.runs[rIdx + 1];
          const a = cur.str.trim();
          const b = nxt.str.trim();
          const small = Math.max(cur.pdfH, nxt.pdfH) <= bodyFontHeight * 0.8;
          const curR = cur.vpLeft + cur.vpWidth;
          const nxtR = nxt.vpLeft + nxt.vpWidth;
          const gapPx = Math.max(cur.vpLeft - nxtR, nxt.vpLeft - curR);
          const near = gapPx <= Math.max(3, cur.vpHeight * 0.6);
          // RTL: the run further right is read first.
          const combined = cur.vpLeft >= nxt.vpLeft ? `${a}${b}` : `${b}${a}`;
          const hasBracket = /[()\[\]]/.test(combined);
          if (small && near && hasBracket && canJoinMarkerFragments(a, b, combined) && (isPiece(a) || isMarkerShape(a)) && isPiece(b) && isMarkerShape(combined)) {
            rIdx++;
            const minL = Math.min(cur.vpLeft, nxt.vpLeft);
            const maxR = Math.max(curR, nxtR);
            cur.str = combined;
            cur.vpLeft = minL;
            cur.vpWidth = maxR - minL;
            cur.leftPct = (minL / vpW) * 100;
            cur.vpHeight = Math.max(cur.vpHeight, nxt.vpHeight);
            cur.pdfH = Math.max(cur.pdfH, nxt.pdfH);
            cur.quoteAdjacent = cur.quoteAdjacent || nxt.quoteAdjacent;
          } else {
            break;
          }
        }
        joined.push(cur);
      }
      bucket.runs = joined;
    }
    // A tiny letter touching a same-size quote mark is part of an abbreviation (ב"ח, ז"ל), never a marker.
    const abbreviationRuns = new Set<RawPdfRun>();
    if (!isSiddurPdf) {
      const quoteOnly = /^["'״׳`]/;
      const quoteEnd = /["'״׳`]$/;
      const touches = (a: RawPdfRun, o?: RawPdfRun) => {
        if (!o) return false;
        const aR = a.vpLeft + a.vpWidth;
        const oR = o.vpLeft + o.vpWidth;
        const gap = Math.max(a.vpLeft - oR, o.vpLeft - aR);
        const sameSize = Math.abs(o.pdfH - a.pdfH) <= Math.max(0.8, a.pdfH * 0.25);
        return sameSize && gap <= Math.max(2, a.vpHeight * 0.5);
      };
      bucket.runs.forEach((r, idx) => {
        const prev = bucket.runs[idx - 1];
        const next = bucket.runs[idx + 1];
        if (
          (touches(r, next) && quoteOnly.test(next.str.trim())) ||
          (touches(r, prev) && quoteEnd.test(prev.str.trim()))
        ) {
          abbreviationRuns.add(r);
        }
      });
    }
    const bodyRuns = bucket.runs.filter((r) => r.pdfH >= bodyFontHeight * 0.85 && /[א-ת]{2}/.test(r.str));
    const bodyBaseline = bodyRuns.length
      ? bodyRuns.reduce((sum, r) => sum + r.vpTop + r.vpHeight, 0) / bodyRuns.length
      : null;
    const markerContext = (run, token, tokenIdx = 0) => ({
      bodyFontHeight,
      raised: bodyBaseline === null ? false : bodyBaseline - (run.vpTop + run.vpHeight) >= Math.max(0.8, run.vpHeight * 0.15),
      isolated: run.str.trim() === token,
      isEntryStart: bucket.section === 'margin' && run === bucket.runs[0] && tokenIdx === 0,
      abbreviation: abbreviationRuns.has(run) || run.quoteAdjacent === true,
    });
    // Margin columns of Ein Mishpat / Torah Or contain bracketed code numbers ([ד], (קכ"ג)) that are not markers.
    const checkMarker = (run, token, tokenIdx = 0) => {
      const m = detectSmallMarkerToken(token, run.pdfH, bucket.section, markerContext(run, token, tokenIdx));
      if (
        m.isSmallMarker &&
        bucket.section === 'margin' &&
        (run.marginCommType === 'ein-mishpat' || run.marginCommType === 'torah-or') &&
        m.targetType !== 'ein-mishpat' &&
        m.targetType !== 'torah-or'
      ) {
        return { isSmallMarker: false } as ReturnType<typeof detectSmallMarkerToken>;
      }
      return m;
    };
    const rawLineJoined = bucket.runs
      .filter((r) => !checkMarker(r, r.str.trim()).isSmallMarker)
      .map((r) => r.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const baseLineTextHe =
      stripTalmudicReferenceHintsForTranslation(rawLineJoined) || rawLineJoined;
    const lineTextHe = isSiddurPdf
      ? repairSiddurOcrLine(baseLineTextHe) || baseLineTextHe
      : baseLineTextHe;

    const baseRowSentence = matchHotspotToSentence(
      bucket.runs[0]?.str || '',
      lineTextHe,
      bucket.section,
      effectiveMishnah,
      effectiveGemara,
      effectiveRashi,
      effectiveTosafot,
      dafData
    );
    const siddurCanonicalRowSpec = isSiddurPdf
      ? matchCanonicalSiddurRow(dafData.tractateId, dafData.dafId, bucketTopPct)
      : null;
    const siddurCanonicalKa = isSiddurPdf
      ? siddurCanonicalRowSpec?.translationKa || lookupSiddurLineTranslationKa(lineTextHe)
      : null;
    const rowSentence: TalmudSentence =
      isSiddurPdf && siddurCanonicalKa
        ? {
            ...baseRowSentence,
            hebrew: siddurCanonicalRowSpec?.lineTextHe || lineTextHe,
            hebrewText: siddurCanonicalRowSpec?.lineTextHe || lineTextHe,
            translationKa: siddurCanonicalKa,
            explanationKa:
              siddurCanonicalRowSpec?.explanationKa ||
              baseRowSentence.explanationKa ||
              siddurCanonicalKa,
          }
        : baseRowSentence;

    // Split each PDF run into individual words from RIGHT to LEFT
    for (const run of bucket.runs) {
      const effectiveRunStr = isSiddurPdf
        ? repairSiddurOcrLine(run.str) || run.str
        : run.str;
      const tokens = effectiveRunStr
        .split(/\s+/)
        .map((t) => (isSiddurPdf ? repairSiddurOcrWord(t.trim()) || t.trim() : t.trim()))
        .filter((t) => t.length > 0);

      if (tokens.length === 0) continue;

      if (tokens.length === 1) {
        const rawTok = tokens[0];
        const markerCheck = checkMarker(run, rawTok);
        const cleanWord = markerCheck.isSmallMarker
          ? markerCheck.key || rawTok.replace(/[^\u05D0-\u05EA0-9]/g, '')
          : normalizeHebrewWord(rawTok) || rawTok.replace(/[^\u05D0-\u05EA0-9]/g, '');
        if (!cleanWord) continue;

        const leftPct = Math.max(0.2, Math.min(99, (run.vpLeft / vpW) * 100));
        const topPct = Math.max(0.2, Math.min(99, (run.vpTop / vpH) * 100));
        const widthPct = Math.max(
          markerCheck.isSmallMarker ? 2.4 : 0.9,
          Math.min(45, (run.vpWidth / vpW) * 100)
        );
        const heightPct = Math.max(
          markerCheck.isSmallMarker ? 2.2 : 0.9,
          Math.min(6, (run.vpHeight / vpH) * 100)
        );

        hotspots.push({
          id: `pdf-word-${globalIdx++}`,
          word: markerCheck.displayWord || rawTok,
          cleanWord,
          section: bucket.section,
          leftPct: markerCheck.isSmallMarker ? Math.max(0.1, leftPct - 0.35) : leftPct,
          topPct: markerCheck.isSmallMarker ? Math.max(0.1, topPct - 0.25) : topPct,
          widthPct,
          heightPct,
          sentence: rowSentence,
          rowId: bucket.id,
          lineTextHe,
          isSmallMarker: markerCheck.isSmallMarker,
          markerTargetType: markerCheck.targetType || run.marginCommType,
          markerKey: markerCheck.key || run.marginEntryKey,
          marginCommType: run.marginCommType,
          marginEntryKey: run.marginEntryKey,
          glyphH: run.pdfH,
          font: run.font,
          ...(markerCheck.isSmallMarker
            ? {
                inkLeftPct: leftPct,
                inkTopPct: topPct,
                inkWidthPct: Math.min(45, (run.vpWidth / vpW) * 100),
                inkHeightPct: Math.min(6, (run.vpHeight / vpH) * 100),
              }
            : {}),
        });
      } else {
        // Multi-word PDF run: merge any standalone bracket/punctuation tokens into their neighbor,
        // then partition run.vpWidth proportionally in RTL order (word 0 is rightmost) with zero dead zone between words!
        const mergedTokens: string[] = [];
        for (let t = 0; t < tokens.length; t++) {
          const tok = tokens[t];
          if (/^[()\[\]]+$/.test(tok)) {
            if (mergedTokens.length > 0) {
              mergedTokens[mergedTokens.length - 1] += tok;
            } else if (t + 1 < tokens.length) {
              tokens[t + 1] = tok + tokens[t + 1];
            }
          } else {
            mergedTokens.push(tok);
          }
        }
        const effectiveTokens = mergedTokens.length > 0 ? mergedTokens : tokens;
        const weights = effectiveTokens.map((w) => getWordVisualGlyphWeight(w) + 0.18);
        const totalGlyphWeight = Math.max(
          0.5,
          weights.reduce((acc, v) => acc + v, 0)
        );

        let cursorRight = run.vpLeft + run.vpWidth;

        for (let i = 0; i < effectiveTokens.length; i++) {
          const rawTok = effectiveTokens[i];
          const markerCheck = checkMarker(run, rawTok, i);
          const cleanWord = markerCheck.isSmallMarker
            ? markerCheck.key || rawTok.replace(/[^\u05D0-\u05EA0-9]/g, '')
            : normalizeHebrewWord(rawTok) || rawTok.replace(/[^\u05D0-\u05EA0-9]/g, '');
          const wordW = Math.max(
            3,
            (weights[i] / totalGlyphWeight) * run.vpWidth
          );
          const wordLeft =
            i === effectiveTokens.length - 1
              ? run.vpLeft
              : Math.max(run.vpLeft, cursorRight - wordW);
          const actualWordW = Math.max(3, cursorRight - wordLeft);

          if (cleanWord) {
            const rawLeftPct = Math.max(0.2, Math.min(99, (wordLeft / vpW) * 100));
            const rawTopPct = Math.max(0.2, Math.min(99, (run.vpTop / vpH) * 100));
            const widthPct = Math.max(
              markerCheck.isSmallMarker ? 2.4 : 0.8,
              Math.min(35, (actualWordW / vpW) * 100)
            );
            const heightPct = Math.max(
              markerCheck.isSmallMarker ? 2.2 : 0.9,
              Math.min(6, (run.vpHeight / vpH) * 100)
            );
            const leftPct = markerCheck.isSmallMarker
              ? Math.max(0.1, rawLeftPct - 0.3)
              : rawLeftPct;
            const topPct = markerCheck.isSmallMarker
              ? Math.max(0.1, rawTopPct - 0.2)
              : rawTopPct;

            hotspots.push({
              id: `pdf-word-${globalIdx++}`,
              word: markerCheck.displayWord || rawTok,
              cleanWord,
              section: bucket.section,
              leftPct,
              topPct,
              widthPct,
              heightPct,
              sentence: rowSentence,
              rowId: bucket.id,
              lineTextHe,
              isSmallMarker: markerCheck.isSmallMarker,
              markerTargetType: markerCheck.targetType || run.marginCommType,
              markerKey: markerCheck.key || run.marginEntryKey,
              marginCommType: run.marginCommType,
              marginEntryKey: run.marginEntryKey,
              glyphH: run.pdfH,
          font: run.font,
              ...(markerCheck.isSmallMarker
                ? {
                    inkLeftPct: rawLeftPct,
                    inkTopPct: rawTopPct,
                    inkWidthPct: Math.min(35, (actualWordW / vpW) * 100),
                    inkHeightPct: Math.min(6, (run.vpHeight / vpH) * 100),
                  }
                : {}),
            });
          }

          cursorRight = wordLeft;
        }
      }
    }
  }

  // Also ensure any canonical Siddur prayer row with explicit wordBoxes that wasn't matched to an existing OCR bucket (e.g. if OCR missed the entire line) is emitted!
  if (isSiddurPdf && CANONICAL_SIDDUR_PAGE_ROWS[siddurPageNum]) {
    for (const spec of CANONICAL_SIDDUR_PAGE_ROWS[siddurPageNum]) {
      if (usedCanonicalRowTopPcts.has(spec.topPct) || !spec.words || spec.words.length === 0) {
        continue;
      }
      usedCanonicalRowTopPcts.add(spec.topPct);
      const canonicalRowId = `siddur-canon-row-${siddurPageNum}-${Math.round(spec.topPct * 10)}`;
      const canonicalSentence: TalmudSentence = {
        id: canonicalRowId,
        source:
          spec.section === 'rashi'
            ? 'rashi'
            : spec.section === 'gemara'
              ? 'gemara'
              : 'mishnah',
        dibburHamatchil: spec.words.slice(0, 3).map((w) => w.word).join(' '),
        hebrew: spec.lineTextHe,
        hebrewText: spec.lineTextHe,
        translationKa: spec.translationKa,
        explanationKa:
          spec.explanationKa ||
          `${spec.translationKa} — განმარტებითი სიდური „ქავანათ ჰალევი“ (გვ. ${siddurPageNum}).`,
      };
      const rowTop = spec.topPct;
      const rowH = spec.heightPct || 2.8;
      for (const wb of spec.words) {
        const cleanWord = normalizeHebrewWord(wb.word);
        if (!cleanWord) continue;
        hotspots.push({
          id: `pdf-word-${globalIdx++}`,
          word: wb.word,
          cleanWord,
          section: spec.section || 'mishnah',
          leftPct: wb.leftPct,
          topPct: rowTop,
          widthPct: Math.max(1.2, wb.rightPct - wb.leftPct),
          heightPct: rowH,
          sentence: canonicalSentence,
          rowId: canonicalRowId,
          lineTextHe: spec.lineTextHe,
          isSmallMarker: false,
        });
      }
    }
  }

  if (isSiddurPdf && hotspots.length > 1) {
    hotspots.sort((a, b) => {
      if (Math.abs(a.topPct - b.topPct) > 0.9) {
        return a.topPct - b.topPct;
      }
      return b.leftPct - a.leftPct;
    });
    hotspots.forEach((h, i) => {
      h.id = `pdf-word-${i}`;
    });
  }

  // Attach printed "." / ":" (separate PDF runs) to the commentary word they follow (RTL: on its left).
  const usedStopMarks = new Set<(typeof stopMarks)[number]>();
  for (const h of hotspots) {
    if (h.section !== 'rashi' && h.section !== 'tosafot' && h.marginCommType !== 'gilyon-hashas') continue;
    if (/[.:]["'״׳]?$/.test(h.word.trim())) {
      h.stopAfter = /:["'״׳]?$/.test(h.word.trim()) ? ':' : '.';
      continue;
    }
    const bottom = h.topPct + h.heightPct;
    const mark = stopMarks.find(
      (m) =>
        m.rightPct >= h.leftPct - 1.1 &&
        m.rightPct <= h.leftPct + 0.5 &&
        m.baselinePct <= bottom + h.heightPct * 0.35 &&
        m.baselinePct >= h.topPct + h.heightPct * 0.3
    );
    if (mark) {
      h.stopAfter = mark.mark;
      usedStopMarks.add(mark);
    }
  }
  // Justified lines often push a closing ":" (or ".") to the far end of the line, away from its
  // word. Such a mark still closes the last word printed before it on that line, so the entry on
  // the next line opens a new dibbur hamatchil.
  for (const m of stopMarks) {
    if (usedStopMarks.has(m)) continue;
    let best: VilnaPdfHotspot | null = null;
    let bestGap = Infinity;
    for (const h of hotspots) {
      if ((h.section !== 'rashi' && h.section !== 'tosafot') || h.isSmallMarker || h.stopAfter) continue;
      const bottom = h.topPct + h.heightPct;
      if (m.baselinePct > bottom + h.heightPct * 0.35 || m.baselinePct < h.topPct + h.heightPct * 0.3) continue;
      const gap = h.leftPct - m.rightPct;
      if (gap < -0.5 || gap > 4.5) continue;
      if (gap < bestGap) { bestGap = gap; best = h; }
    }
    if (!best) continue;
    // Only the line's last word may own a distant mark: no other word may sit between them.
    const between = hotspots.some(
      (o) =>
        o !== best &&
        o.section === best!.section &&
        o.rowId === best!.rowId &&
        o.leftPct + o.widthPct > m.rightPct &&
        o.leftPct + o.widthPct <= best!.leftPct + 0.2
    );
    if (!between) best.stopAfter = m.mark;
  }

  // Attach separate quote runs to the word they follow (RTL: on its left): ר' / ק"ש stay abbreviations.
  // Each quote belongs to the one word whose left edge it touches most closely.
  for (const m of quoteMarks) {
    let best: VilnaPdfHotspot | null = null;
    let bestGap = Infinity;
    for (const h of hotspots) {
      if (h.section === 'margin' || h.section === 'header' || h.isSmallMarker) continue;
      if (/["'״׳]/.test(h.word)) continue;
      const bottom = h.topPct + h.heightPct;
      if (m.baselinePct > bottom + h.heightPct * 0.35 || m.baselinePct < h.topPct + h.heightPct * 0.2) continue;
      const gap = Math.abs(m.rightPct - h.leftPct);
      if (m.rightPct < h.leftPct - 1.0 || m.rightPct > h.leftPct + 0.6 || gap >= bestGap) continue;
      best = h;
      bestGap = gap;
    }
    if (best) best.quoteAfter = m.mark;
  }

  return getIndependentMarkerBoxes(hotspots);
}

export const VilnaPdfInteractiveViewer: React.FC<VilnaPdfInteractiveViewerProps> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  dafMarkHe,
  effectiveMishnah,
  effectiveGemara,
  effectiveRashi,
  effectiveTosafot,
  isDark,
  selectedTarget,
  wordExplainStage = 'none',
  onOpenWordNote,
  autoTranslateLineMode = false,
  onToggleAutoTranslateLineMode,
  externalStoppedRowStepTrigger,
  deepLinkedSentenceId,
  deepLinkedCitationLabelHe,
  deepLinkedCitationSnippetHe,
  deepLinkTriggerSeq = 0,
  isFullScreen = false,
  onExitFullScreen,
  isEmbeddedInNoteWindow = false,
  onDeepLinkTargetResolved,
  onNavigateToCitation,
  pendingReturnRestore,
  onSelectWordOrSentence,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const multiWordAnchorRef = useRef<HTMLDivElement | null>(null);

  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [pdfLoadFailed, setPdfLoadFailed] = useState<boolean>(false);
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number>(643.575 / 992.575);
  const [hotspots, setHotspots] = useState<VilnaPdfHotspot[]>([]);
  const [biblicalCitation, setBiblicalCitation] = useState(null);
  const isAmudBet = dafData.dafId.endsWith('b');
  const isSiddurPdf = dafData.tractateId.startsWith('Siddur_');

  // Selection state supporting both single word AND classic copy/paste multi-word range
  const [selectedRange, setSelectedRange] = useState<{
    startIdx: number;
    endIdx: number;
  } | null>(null);
  // Requirement 3: Range handles (the two little balls) only appear when the user long-presses an already-selected word on a 2nd press (or drags a multi-word range)
  const [showRangeHandles, setShowRangeHandles] = useState<boolean>(false);
  // Internal PDF return point when jumping between a marker (e.g. (א)) and a margin commentary on the same Daf
  const [internalPdfReturnPoint, setInternalPdfReturnPoint] = useState<{
    rowId: string;
    selectedRange: { startIdx: number; endIdx: number } | null;
    hotspotId: string;
    leftPct: number;
    topPct: number;
    widthPct: number;
    heightPct: number;
    windowScrollY: number;
    labelKa: string;
    labelHe: string;
  } | null>(null);

  // Marker navigation is independent of the two-stage word-selection workflow.
  const [blinkingTarget, setBlinkingTarget] = useState<BlinkingTargetRegion | null>(null);

  // Drag / Long-press Copy/Paste state
  const [isDraggingSelection, setIsDraggingSelection] = useState<boolean>(false);
  const dragModeRef = useRef<'none' | 'range' | 'start-handle' | 'end-handle'>('none');
  const dragAnchorIdxRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWordTapRef = useRef<{ idx: number; time: number } | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number; idx: number } | null>(null);
  const suppressNextClickRef = useRef<boolean>(false);
  const markerTouchRef = useRef<{ idx: number; x: number; y: number } | null>(null);
  const lastMarkerTouchRef = useRef(0);

  // Guard ref to prevent infinite effect loop when externalStoppedRowStepTrigger fires
  const lastHandledTriggerSeqRef = useRef<number>(0);
  const lastHandledDeepLinkKeyRef = useRef<string>('');

  // Latest sentence data ref so PDF doesn't re-render when Sefaria async enrichment finishes
  const latestDataRef = useRef({
    dafData,
    effectiveMishnah,
    effectiveGemara,
    effectiveRashi,
    effectiveTosafot,
  });
  useEffect(() => {
    latestDataRef.current = {
      dafData,
      effectiveMishnah,
      effectiveGemara,
      effectiveRashi,
      effectiveTosafot,
    };
  }, [dafData, effectiveMishnah, effectiveGemara, effectiveRashi, effectiveTosafot]);

  // Stopped reading line bookmark state (Point 4: სანიშნი ხაზები)
  const stoppedRowStorageKey = `talmud_stopped_row_${dafData.tractateId}_${dafData.dafId}`;
  const [stoppedRowId, setStoppedRowId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`talmud_stopped_row_${dafData.tractateId}_${dafData.dafId}`);
    }
    return null;
  });
  const [isDraggingReadingLine, setIsDraggingReadingLine] = useState<boolean>(false);
  const [readingHandleInvScale, setReadingHandleInvScale] = useState<number>(1);

  // Live Line Translation state (Point 5: ხაზის ავტო-თარგმანი სტრიქონის ქვეშ)
  const [lineTranslationsCache, setLineTranslationsCache] = useState<Record<string, string>>({});
  const lineTranslationsCacheRef = useRef(lineTranslationsCache);
  lineTranslationsCacheRef.current = lineTranslationsCache;
  const [translatingRowId, setTranslatingRowId] = useState<string | null>(null);
  const [lineBoxZoom, setLineBoxZoom] = useState<number>(1);
  const [isLineBoxMinimized, setIsLineBoxMinimized] = useState<boolean>(false);
  const [isLineBoxMaximized, setIsLineBoxMaximized] = useState<boolean>(false);
  const [selectedUnionScreenRect, setSelectedUnionScreenRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null>(null);
  const [copyToastText, setCopyToastText] = useState<string | null>(null);
  const lineBoxPinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const [stoppedLineRect, setStoppedLineRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    vw: number;
    vh: number;
    vvScale: number;
  } | null>(null);

  const dafKey = `${dafData.tractateId}:${dafData.dafId}`;
  const isChumashPdf = dafData.tractateId.startsWith('Chumash_');
  const exactPdfUrl = isChumashPdf
    ? resolveAuthenticVilnaPdfCloneUrl(dafData.tractateId, dafData.dafId)
    : isSiddurPdf
      ? isExactBundledSiddurPage(dafData.tractateId, dafData.dafId)
        ? resolveAuthenticVilnaPdfCloneUrl(dafData.tractateId, dafData.dafId)
        : null
      : EXACT_VILNA_PDF_MAP[dafKey] || null;
  const activePdfUrl = useMemo(() => {
    return resolveAuthenticVilnaPdfCloneUrl(dafData.tractateId, dafData.dafId);
  }, [dafData.tractateId, dafData.dafId]);

  const dynamicDafContentSig = useMemo(() => {
    if (exactPdfUrl) return dafKey;
    const g0 = effectiveGemara[0]?.hebrewText?.slice(0, 24) || '';
    const r0 = effectiveRashi[0]?.hebrewText?.slice(0, 24) || '';
    const t0 = effectiveTosafot[0]?.hebrewText?.slice(0, 24) || '';
    return `${dafKey}::${effectiveMishnah.length}-${effectiveGemara.length}-${effectiveRashi.length}-${effectiveTosafot.length}::${g0}::${r0}::${t0}`;
  }, [
    exactPdfUrl,
    dafKey,
    effectiveMishnah,
    effectiveGemara,
    effectiveRashi,
    effectiveTosafot,
  ]);

  // Group hotspots into distinct ordered horizontal lines on the Daf
  const pdfLines: PdfDafLine[] = useMemo(() => {
    const map = new Map<
      string,
      {
        rowId: string;
        section: VilnaPdfHotspot['section'];
        minTop: number;
        maxBottom: number;
        minLeft: number;
        maxRight: number;
        lineTextHe: string;
        sentence: TalmudSentence;
        firstHotspotId: string;
      }
    >();

    for (const h of hotspots) {
      if (h.section === 'header') continue;
      const existing = map.get(h.rowId);
      const right = h.leftPct + h.widthPct;
      const bottom = h.topPct + h.heightPct;
      if (!existing) {
        map.set(h.rowId, {
          rowId: h.rowId,
          section: h.section,
          minTop: h.topPct,
          maxBottom: bottom,
          minLeft: h.leftPct,
          maxRight: right,
          lineTextHe: h.lineTextHe || h.sentence.hebrewText || h.word,
          sentence: h.sentence,
          firstHotspotId: h.id,
        });
      } else {
        if (!h.isSmallMarker) {
          existing.minTop = Math.min(existing.minTop, h.topPct);
          existing.maxBottom = Math.max(existing.maxBottom, bottom);
        }
        existing.minLeft = Math.min(existing.minLeft, h.leftPct);
        existing.maxRight = Math.max(existing.maxRight, right);
      }
    }

    const isAmudBet = dafData.dafId.endsWith('b');
    const rashiIsRight = !isAmudBet;

    const list: PdfDafLine[] = Array.from(map.values()).map((item) => {
      // Expand the line bounds slightly and snap to the full column edges when a line spans most of its column
      // so the reading line ALWAYS reaches from the very beginning to the very end of the line!
      let leftEdge = Math.max(0.4, item.minLeft - 0.45);
      let rightEdge = Math.min(99.6, item.maxRight + 0.45);

      if (!isSiddurPdf && !isChumashPdf && (item.section === 'mishnah' || item.section === 'gemara')) {
        // Standard center column: ~33.8% .. 60.5%; Wide lower Gemara: ~33.8% .. 79.8%
        if (leftEdge > 32.0 && leftEdge < 36.2) leftEdge = 33.7;
        if (rightEdge > 58.0 && rightEdge < 62.2) rightEdge = 60.5;
        else if (rightEdge > 76.5 && rightEdge < 81.0) rightEdge = 79.8;
      } else if (!isSiddurPdf && !isChumashPdf && (item.section === 'rashi' || item.section === 'tosafot')) {
        const isRightCol =
          (item.section === 'rashi' && rashiIsRight) ||
          (item.section === 'tosafot' && !rashiIsRight);
        if (item.minTop < 9.0) {
          // Top 4 wide lines above Mishnah
          if (isRightCol) {
            if (leftEdge > 46.8 && leftEdge < 51.5) leftEdge = 47.9;
            if (rightEdge > 76.0 && rightEdge < 81.0) rightEdge = 79.8;
          } else {
            if (leftEdge > 13.5 && leftEdge < 17.5) leftEdge = 14.4;
            if (rightEdge > 43.0 && rightEdge < 47.2) rightEdge = 46.3;
          }
        } else if (item.minTop >= 65.5 && rightEdge - leftEdge > 34) {
          // Full-width bottom Tosafot/Rashi lines
          if (leftEdge > 13.5 && leftEdge < 18.5) leftEdge = 14.4;
          if (rightEdge > 75.5 && rightEdge < 81.0) rightEdge = 79.8;
        } else if (isRightCol) {
          if (leftEdge > 61.5 && leftEdge < 65.5) leftEdge = 62.4;
          if (rightEdge > 76.0 && rightEdge < 81.0) rightEdge = 79.8;
        } else {
          if (leftEdge > 13.5 && leftEdge < 17.5) leftEdge = 14.4;
          if (rightEdge > 29.0 && rightEdge < 33.2) rightEdge = 31.8;
        }
      }

      return {
        rowId: item.rowId,
        section: item.section,
        topPct: item.minTop,
        heightPct: Math.max(0.95, item.maxBottom - item.minTop),
        leftPct: leftEdge,
        widthPct: Math.max(4, rightEdge - leftEdge),
        lineTextHe: item.lineTextHe,
        sentence: item.sentence,
        firstHotspotId: item.firstHotspotId,
      };
    });

    const sectionRank: Record<string, number> = {
      mishnah: 1,
      gemara: 1,
      rashi: 2,
      tosafot: 3,
      margin: 4,
      header: 5,
    };
    list.sort((a, b) => {
      const rankDiff = (sectionRank[a.section] || 9) - (sectionRank[b.section] || 9);
      if (rankDiff !== 0) return rankDiff;
      return a.topPct - b.topPct;
    });
    return list;
  }, [hotspots]);

  // Ensure stoppedRowId defaults to the first Mishnah/Gemara line if none saved yet
  useEffect(() => {
    if (pdfLines.length === 0) return;
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem(stoppedRowStorageKey) : null;
    if (saved && pdfLines.some((l) => l.rowId === saved)) {
      setStoppedRowId(saved);
    } else {
      const firstMain =
        pdfLines.find((l) => l.section === 'mishnah' || l.section === 'gemara') || pdfLines[0];
      if (firstMain) {
        setStoppedRowId(firstMain.rowId);
      }
    }
  }, [pdfLines, stoppedRowStorageKey]);

  const updateStoppedRow = useCallback(
    (rowId: string) => {
      setStoppedRowId(rowId);
      try {
        localStorage.setItem(stoppedRowStorageKey, rowId);
      } catch {
        // ignore
      }
    },
    [stoppedRowStorageKey]
  );

  const activeStoppedLine = useMemo(() => {
    if (!stoppedRowId) return pdfLines[0] || null;
    return pdfLines.find((l) => l.rowId === stoppedRowId) || pdfLines[0] || null;
  }, [pdfLines, stoppedRowId]);

  // Independent reading lines for Rashi and Tosafot (the Gemara keeps the main stopped line).
  // A scan row can contain words from several columns, so each line is drawn only over the
  // column segment of the word that was tapped (its "anchor").
  type ReadingRows = {
    rashi?: string;
    tosafot?: string;
    rashiAnchor?: string;
    tosafotAnchor?: string;
    mainAnchor?: string;
  };
  const commentaryRowsKey = `talmud_commentary_rows_${dafData.tractateId}_${dafData.dafId}`;
  const [commentaryRows, setCommentaryRows] = useState<ReadingRows>({});
  useEffect(() => {
    try {
      setCommentaryRows(JSON.parse(localStorage.getItem(commentaryRowsKey) || '{}') || {});
    } catch {
      setCommentaryRows({});
    }
  }, [commentaryRowsKey]);
  const saveReadingRows = useCallback(
    (next: ReadingRows) => {
      try {
        localStorage.setItem(commentaryRowsKey, JSON.stringify(next));
      } catch {}
      return next;
    },
    [commentaryRowsKey]
  );

  type LineBox = { leftPct: number; topPct: number; widthPct: number; heightPct: number };
  const segmentBox = useCallback(
    (rowId: string | undefined, anchorId: string | undefined): LineBox | null => {
      if (!rowId || !anchorId) return null;
      // Inline markers (ג) occupy space in the line: keep them in the gap walk so the band runs to the end.
      const row = hotspots
        .filter((x) => x.rowId === rowId)
        .sort((a, b) => a.leftPct - b.leftPct);
      if (!row.some((x) => x.id === anchorId)) return null;
      let seg: VilnaPdfHotspot[] = [];
      for (const x of row) {
        const prev = seg[seg.length - 1];
        if (prev && x.leftPct - (prev.leftPct + prev.widthPct) > 1.3) {
          if (seg.some((s) => s.id === anchorId)) break;
          seg = [];
        }
        seg.push(x);
      }
      if (!seg.some((s) => s.id === anchorId)) return null;
      const left = Math.min(...seg.map((s) => s.leftPct));
      const right = Math.max(...seg.map((s) => s.leftPct + s.widthPct));
      const top = Math.min(...seg.map((s) => s.topPct));
      const bottom = Math.max(...seg.map((s) => s.topPct + s.heightPct));
      return {
        leftPct: Math.max(0.4, left - 0.45),
        topPct: top,
        widthPct: Math.min(99.2, right - left + 0.9),
        heightPct: Math.max(0.95, bottom - top),
      };
    },
    [hotspots]
  );

  const mainLineBox: LineBox | null = activeStoppedLine
    ? segmentBox(activeStoppedLine.rowId, commentaryRows.mainAnchor) || activeStoppedLine
    : null;

  const commentaryLines = useMemo(
    () =>
      (['rashi', 'tosafot'] as const)
        .map((sec) => {
          const line = pdfLines.find((l) => l.rowId === commentaryRows[sec]);
          if (!line) return null;
          const box = segmentBox(line.rowId, commentaryRows[`${sec}Anchor`]) || line;
          return { key: sec, ...box };
        })
        .filter((l): l is LineBox & { key: 'rashi' | 'tosafot' } => {
          if (!l || !mainLineBox) return !!l;
          // Never draw a second band on top of the main line.
          return Math.abs(l.topPct - mainLineBox.topPct) > 0.3 || Math.abs(l.leftPct - mainLineBox.leftPct) > 0.5;
        }),
    [pdfLines, commentaryRows, segmentBox, mainLineBox]
  );

  const markReadingLineAt = useCallback(
    (h: VilnaPdfHotspot | undefined) => {
      if (!h || !h.rowId || h.section === 'margin' || h.section === 'header') return;
      const newBox = segmentBox(h.rowId, h.id);
      type Stream = 'main' | 'rashi' | 'tosafot';
      let stream: Stream =
        h.section === 'rashi' ? 'rashi' : h.section === 'tosafot' ? 'tosafot' : 'main';

      // The same printed column continuing (e.g. a narrow commentary column widening below the
      // Gemara) keeps its own line: the new tap replaces the nearest line just above it whose
      // column overlaps and whose letters are the same size, instead of adding a second band.
      if (newBox) {
        const anchorOf = (s: Stream) =>
          hotspots.find(
            (x) => x.id === (s === 'main' ? commentaryRows.mainAnchor : commentaryRows[`${s}Anchor`])
          );
        const boxOf = (s: Stream) => {
          const rowId = s === 'main' ? activeStoppedLine?.rowId : commentaryRows[s];
          const a = anchorOf(s);
          return a ? segmentBox(rowId, a.id) : null;
        };
        let best: { s: Stream; dist: number } | null = null;
        for (const s of ['main', 'rashi', 'tosafot'] as Stream[]) {
          const box = boxOf(s);
          const a = anchorOf(s);
          if (!box || !a) continue;
          const overlap =
            Math.min(box.leftPct + box.widthPct, newBox.leftPct + newBox.widthPct) -
            Math.max(box.leftPct, newBox.leftPct);
          const narrower = Math.min(box.widthPct, newBox.widthPct);
          const dist = Math.abs(newBox.topPct - box.topPct);
          const sizeRatio = (h.glyphH || h.heightPct) / Math.max(0.01, a.glyphH || a.heightPct);
          if (
            overlap >= narrower * 0.5 &&
            dist <= newBox.heightPct * 3.2 &&
            sizeRatio > 0.82 &&
            sizeRatio < 1.22 &&
            (!best || dist < best.dist)
          ) {
            best = { s, dist };
          }
        }
        if (best) stream = best.s;
      }

      if (stream === 'main') {
        updateStoppedRow(h.rowId);
        setCommentaryRows((prev) => saveReadingRows({ ...prev, mainAnchor: h.id }));
      } else {
        setCommentaryRows((prev) =>
          saveReadingRows({ ...prev, [stream]: h.rowId, [`${stream}Anchor`]: h.id })
        );
      }
    },
    [updateStoppedRow, segmentBox, hotspots, commentaryRows, activeStoppedLine, saveReadingRows]
  );

  const stepStoppedLine = useCallback(
    (dir: 'prev' | 'next') => {
      if (pdfLines.length === 0) return;
      const curIdx = activeStoppedLine
        ? pdfLines.findIndex((l) => l.rowId === activeStoppedLine.rowId)
        : 0;
      const nextIdx =
        dir === 'next'
          ? Math.min(pdfLines.length - 1, curIdx + 1)
          : Math.max(0, curIdx - 1);
      const nextLine = pdfLines[nextIdx];
      if (nextLine) {
        updateStoppedRow(nextLine.rowId);
      }
    },
    [pdfLines, activeStoppedLine, updateStoppedRow]
  );

  const stepStoppedLineRef = useRef(stepStoppedLine);
  useEffect(() => {
    stepStoppedLineRef.current = stepStoppedLine;
  }, [stepStoppedLine]);

  // Handle external step/jump triggers from the bar above the Daf (guarded by seq + ref so it NEVER loops!)
  useEffect(() => {
    if (!externalStoppedRowStepTrigger) return;
    if (externalStoppedRowStepTrigger.seq === lastHandledTriggerSeqRef.current) return;
    lastHandledTriggerSeqRef.current = externalStoppedRowStepTrigger.seq;

    if (externalStoppedRowStepTrigger.dir === 'prev') {
      stepStoppedLineRef.current('prev');
    } else if (externalStoppedRowStepTrigger.dir === 'next') {
      stepStoppedLineRef.current('next');
    } else if (externalStoppedRowStepTrigger.dir === 'jump') {
      const el = document.getElementById('active-stopped-reading-line');
      const folio = document.getElementById('talmud-daf-folio-anchor');
      if (folio && el && folio.scrollHeight > folio.clientHeight + 10) {
        const elRect = el.getBoundingClientRect();
        const folioRect = folio.getBoundingClientRect();
        const currentScroll = folio.scrollTop;
        const targetTop = currentScroll + (elRect.top - folioRect.top) - folioRect.height * 0.40;
        folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }
    }
  }, [externalStoppedRowStepTrigger]);

  // Highlight and scroll to the target segment on the Daf page (or inside the Source Daf Note Window) when a Talmudic citation link is clicked
  useEffect(() => {
    if (!deepLinkTriggerSeq || pdfLines.length === 0 || hotspots.length === 0) return;
    const firstSentSnippet = (pdfLines[0]?.sentence?.hebrewText || '').slice(0, 24);
    const triggerKey = `${dafKey}:${deepLinkTriggerSeq}:${deepLinkedSentenceId || ''}:${
      deepLinkedCitationSnippetHe || ''
    }:${pdfLines.length}:${firstSentSnippet}`;
    if (lastHandledDeepLinkKeyRef.current === triggerKey) return;
    lastHandledDeepLinkKeyRef.current = triggerKey;

    const citationNoiseWords = new Set([
      'דף',
      'בדף',
      'מדף',
      'לדף',
      'ודף',
      'פרק',
      'בפרק',
      'מסכת',
      'במסכת',
      'שם',
      'וכו',
      'כו',
      'עא',
      'עב',
      'לקמן',
      'לעיל',
      'פירש',
      'רשי',
      'תוספות',
      'בתוספות',
      normalizeHebrewWord(tractateNameHe),
    ]);

    const rawTokens = (deepLinkedCitationSnippetHe || '')
      .replace(/[\u0591-\u05C7]/g, '')
      .split(/\s+/)
      .map((w) => normalizeHebrewWord(w))
      .filter((w) => w.length >= 2);

    const meaningfulTokens = rawTokens.filter(
      (w) => !citationNoiseWords.has(w) && !parsePdfHebrewDafToken(w)
    );
    const snippetTokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

    // 1. Try matching by exact sentence ID
    let targetLine =
      (deepLinkedSentenceId &&
        pdfLines.find((l) => l.sentence.id === deepLinkedSentenceId)) ||
      null;

    // 2. Try matching by Hebrew snippet tokens (exact words + prefix-stripped stems)
    if (!targetLine && snippetTokens.length > 0) {
      let bestLine: PdfDafLine | null = null;
      let bestScore = 0;
      for (const line of pdfLines) {
        if (line.section === 'header' || line.section === 'margin') continue;
        const plainLine = normalizeHebrewWord(
          `${line.lineTextHe} ${line.sentence.dibburHamatchil || ''} ${
            line.sentence.hebrewText || ''
          }`
        );
        const lineOnlyPlain = line.lineTextHe.replace(/[\u0591-\u05C7]/g, '');
        let score = 0;
        for (const tok of snippetTokens) {
          if (lineOnlyPlain.includes(tok)) {
            score += 4;
          } else if (plainLine.includes(tok)) {
            score += 2;
          } else {
            const stem = stripHebrewPrefix(tok);
            if (stem.length >= 3 && lineOnlyPlain.includes(stem)) {
              score += 2.5;
            }
          }
        }
        // Slight preference for Gemara/Mishnah main column when scores are tied
        if (score > 0 && (line.section === 'gemara' || line.section === 'mishnah')) {
          score += 0.5;
        }
        if (score > bestScore) {
          bestScore = score;
          bestLine = line;
        }
      }
      if (bestLine && bestScore >= 2) {
        targetLine = bestLine;
      }
    }

    // 3. Fallback to first Gemara or Mishnah line on the referenced Daf
    if (!targetLine) {
      targetLine =
        pdfLines.find((l) => l.section === 'gemara') ||
        pdfLines.find((l) => l.section === 'mishnah') ||
        pdfLines[0] ||
        null;
    }

    if (!targetLine) return;

    updateStoppedRow(targetLine.rowId);

    const rowHotspots = hotspots.filter((h) => h.rowId === targetLine!.rowId);
    // Check if specific hotspots on the target row match our meaningful snippet tokens for tighter segment focus
    const matchedRowSpots =
      meaningfulTokens.length > 0
        ? rowHotspots.filter((h) =>
            meaningfulTokens.some(
              (tok) =>
                h.cleanWord === tok ||
                h.cleanWord.includes(tok) ||
                tok.includes(h.cleanWord) ||
                (stripHebrewPrefix(tok).length >= 3 &&
                  h.cleanWord.includes(stripHebrewPrefix(tok)))
            )
          )
        : [];

    const focusSpots = matchedRowSpots.length >= 2 ? matchedRowSpots : rowHotspots;
    const idSet = new Set<string>(rowHotspots.map((h) => h.id));

    let boxLeft = targetLine.leftPct;
    let boxTop = targetLine.topPct;
    let boxRight = targetLine.leftPct + targetLine.widthPct;
    let boxBottom = targetLine.topPct + targetLine.heightPct;

    if (focusSpots.length >= 2 && focusSpots.length < rowHotspots.length) {
      boxLeft = Math.min(...focusSpots.map((s) => s.leftPct));
      boxTop = Math.min(...focusSpots.map((s) => s.topPct));
      boxRight = Math.max(...focusSpots.map((s) => s.leftPct + s.widthPct));
      boxBottom = Math.max(...focusSpots.map((s) => s.topPct + s.heightPct));
    }

    const focusBox = {
      leftPct: Math.max(0.2, boxLeft - 0.4),
      topPct: Math.max(0.2, boxTop - 0.3),
      widthPct: Math.min(99.4, Math.max(6, boxRight - boxLeft + 0.8)),
      heightPct: Math.min(9, Math.max(1.4, boxBottom - boxTop + 0.6)),
    };

    setBlinkingTarget({
      key: `cite-seg-${deepLinkTriggerSeq}`,
      labelHe: deepLinkedCitationLabelHe || 'מקור מצוטט בדף',
      labelKa: 'ფოკუსირებული წყაროს მონაკვეთი',
      leftPct: focusBox.leftPct,
      topPct: focusBox.topPct,
      widthPct: focusBox.widthPct,
      heightPct: focusBox.heightPct,
      hotspotIds: idSet,
      activatedAt: Date.now(),
    });

    onDeepLinkTargetResolved?.({
      sentence: targetLine.sentence,
      topPct: focusBox.topPct,
      leftPct: focusBox.leftPct,
      widthPct: focusBox.widthPct,
      heightPct: focusBox.heightPct,
      lineTextHe: targetLine.lineTextHe,
    });

    const centerOx = focusBox.leftPct + focusBox.widthPct * 0.5;
    const centerOy = focusBox.topPct + focusBox.heightPct * 0.5;

    if (!isEmbeddedInNoteWindow && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('talmud-focus-target-pct', {
          detail: { ox: centerOx, oy: centerOy, targetScale: 1.45 },
        })
      );
    }

    const scrollNoteViewportToFocusBox = (behavior: ScrollBehavior = 'smooth') => {
      const noteViewport = pageContainerRef.current?.closest(
        '[data-source-note-scroll-viewport="true"]'
      ) as HTMLElement | null;

      if (noteViewport && pageContainerRef.current) {
        const vpRect = noteViewport.getBoundingClientRect();
        const pageRect = pageContainerRef.current.getBoundingClientRect();
        if (pageRect.height > 20 && pageRect.width > 20) {
          const targetCenterYInPage =
            ((focusBox.topPct + focusBox.heightPct * 0.5) / 100) * pageRect.height;
          const targetCenterXInPage =
            ((focusBox.leftPct + focusBox.widthPct * 0.5) / 100) * pageRect.width;

          const currentPageTopInScroll =
            pageRect.top - vpRect.top + noteViewport.scrollTop;
          const currentPageLeftInScroll =
            pageRect.left - vpRect.left + noteViewport.scrollLeft;

          const desiredScrollTop = Math.max(
            0,
            currentPageTopInScroll + targetCenterYInPage - vpRect.height * 0.42
          );
          const desiredScrollLeft = Math.max(
            0,
            currentPageLeftInScroll + targetCenterXInPage - vpRect.width * 0.5
          );

          noteViewport.scrollTo({
            top: desiredScrollTop,
            left: desiredScrollLeft,
            behavior,
          });
          return;
        }
      }

      if (!isEmbeddedInNoteWindow) {
        const folio = document.getElementById('talmud-daf-folio-anchor');
        if (folio && folio.scrollHeight > folio.clientHeight + 10) {
          const targetTop = (centerOy / 100) * folio.scrollHeight - folio.clientHeight * 0.40;
          folio.scrollTo({ top: Math.max(0, targetTop), behavior });
        }
      }
    };

    const t1 = setTimeout(() => scrollNoteViewportToFocusBox('auto'), 25);
    const t2 = setTimeout(() => scrollNoteViewportToFocusBox('smooth'), 130);
    const t3 = setTimeout(() => scrollNoteViewportToFocusBox('smooth'), 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    deepLinkTriggerSeq,
    deepLinkedSentenceId,
    deepLinkedCitationLabelHe,
    deepLinkedCitationSnippetHe,
    pdfLines,
    hotspots,
    dafKey,
    tractateNameHe,
    updateStoppedRow,
    onDeepLinkTargetResolved,
  ]);

  // Interactive vertical dragging for the Carved Wood Reading Line Handle on the Daf (same behavior & visual as Deep Study screen)
  useEffect(() => {
    if (!isDraggingReadingLine) return;

    const handleDragMove = (clientX: number, clientY: number) => {
      if (!pageContainerRef.current || pdfLines.length === 0) return;
      const rect = pageContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;
      const currentSection = activeStoppedLine?.section;

      let bestLine: PdfDafLine | null = null;
      let bestScore = Infinity;

      for (const line of pdfLines) {
        const lineCenterY = line.topPct + line.heightPct * 0.5;
        const dy = Math.abs(lineCenterY - yPct);
        const withinHoriz =
          xPct >= line.leftPct - 8 && xPct <= line.leftPct + line.widthPct + 8;
        const sectionPenalty =
          withinHoriz ? 0 : line.section === currentSection ? 1.5 : 14;
        const score = dy + sectionPenalty;
        if (score < bestScore) {
          bestScore = score;
          bestLine = line;
        }
      }

      if (bestLine && bestLine.rowId !== activeStoppedLine?.rowId) {
        updateStoppedRow(bestLine.rowId);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onEnd = () => {
      setIsDraggingReadingLine(false);
      if (typeof document !== 'undefined') {
        delete document.body.dataset.talmudWordSelecting;
      }
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 90);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [isDraggingReadingLine, pdfLines, activeStoppedLine, updateStoppedRow]);

  // Keep the Carved Wood Reading Line Handle counter-scaled so it stays crisp and compact even at 500% Daf zoom
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    const syncHandleScale = () => {
      const container = pageContainerRef.current;
      if (container && container.offsetWidth > 0) {
        const rect = container.getBoundingClientRect();
        const scaleRatio = rect.width / container.offsetWidth;
        const inv = scaleRatio > 1.04 ? Number((1 / scaleRatio).toFixed(3)) : 1;
        setReadingHandleInvScale((prev) => (Math.abs(prev - inv) > 0.015 ? inv : prev));
      }
      rafId = requestAnimationFrame(syncHandleScale);
    };
    rafId = requestAnimationFrame(syncHandleScale);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Clear selection when Daf changes or when external selectedTarget is cleared
  useEffect(() => {
    if (!selectedTarget) {
      setSelectedRange(null);
      setShowRangeHandles(false);
    }
  }, [selectedTarget]);

  useEffect(() => {
    setSelectedRange(null);
    setShowRangeHandles(false);
    setBlinkingTarget(null);
    setInternalPdfReturnPoint(null);
  }, [dafKey]);

  // Restore exact PDF row / word range when returning from a cited source via the Return button
  const lastRestoredSeqRef = useRef<number>(0);
  useEffect(() => {
    if (
      !pendingReturnRestore ||
      pendingReturnRestore.seq <= 0 ||
      pendingReturnRestore.seq === lastRestoredSeqRef.current ||
      hotspots.length === 0
    ) {
      return;
    }
    lastRestoredSeqRef.current = pendingReturnRestore.seq;

    if (pendingReturnRestore.pdfRowId) {
      updateStoppedRow(pendingReturnRestore.pdfRowId);
    }
    if (pendingReturnRestore.pdfSelectedRange) {
      setSelectedRange(pendingReturnRestore.pdfSelectedRange);
      setShowRangeHandles(false);
    }

    const range = pendingReturnRestore.pdfSelectedRange;
    const targetSpots = range
      ? hotspots.slice(
          Math.max(0, Math.min(range.startIdx, range.endIdx)),
          Math.min(hotspots.length, Math.max(range.startIdx, range.endIdx) + 1)
        )
      : pendingReturnRestore.pdfRowId
        ? hotspots.filter((h) => h.rowId === pendingReturnRestore.pdfRowId)
        : [];

    if (targetSpots.length > 0) {
      let minLeft = 100;
      let maxRight = 0;
      let minTop = 100;
      let maxBottom = 0;
      const idSet = new Set<string>();
      for (const h of targetSpots) {
        idSet.add(h.id);
        minLeft = Math.min(minLeft, h.leftPct);
        maxRight = Math.max(maxRight, h.leftPct + h.widthPct);
        minTop = Math.min(minTop, h.topPct);
        maxBottom = Math.max(maxBottom, h.topPct + h.heightPct);
      }
      setBlinkingTarget({
        key: `return-restore-${pendingReturnRestore.seq}`,
        labelHe: 'מקום היציאה',
        labelKa: pendingReturnRestore.labelKa || 'დაბრუნებული ადგილი',
        leftPct: Math.max(0.2, minLeft - 0.4),
        topPct: Math.max(0.2, minTop - 0.35),
        widthPct: Math.min(99.2, Math.max(2.2, maxRight - minLeft + 0.8)),
        heightPct: Math.min(8, Math.max(1.6, maxBottom - minTop + 0.7)),
        hotspotIds: idSet,
        activatedAt: Date.now(),
      });

      const centerOx = (minLeft + maxRight) * 0.5;
      const centerOy = (minTop + maxBottom) * 0.5;
      window.dispatchEvent(
        new CustomEvent('talmud-focus-target-pct', {
          detail: { ox: centerOx, oy: centerOy, targetScale: 1.85 },
        })
      );

      setTimeout(() => {
        const folio = document.getElementById('talmud-daf-folio-anchor');
        if (folio && folio.scrollHeight > folio.clientHeight + 10) {
          const targetTop = (centerOy / 100) * folio.scrollHeight - folio.clientHeight * 0.40;
          folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }, 95);
    }
  }, [pendingReturnRestore, hotspots, updateStoppedRow]);

  // Stop the blinking target commentary box as soon as the user touches/presses anywhere on the screen
  useEffect(() => {
    if (!blinkingTarget) return;
    const stopBlinkingOnTouchOrPress = () => {
      if (Date.now() - blinkingTarget.activatedAt < 360) return;
      setBlinkingTarget(null);
    };
    window.addEventListener('touchstart', stopBlinkingOnTouchOrPress, {
      passive: true,
      capture: true,
    });
    window.addEventListener('mousedown', stopBlinkingOnTouchOrPress, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener('touchstart', stopBlinkingOnTouchOrPress, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener('mousedown', stopBlinkingOnTouchOrPress, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [blinkingTarget]);

  const lastPdfTextLayerRef = useRef<{
    dafKey: string;
    items: Array<Record<string, unknown>>;
    baseViewport: pdfjsLib.PageViewport;
  } | null>(null);

  // Render authentic Vilna PDF page, extract single-word hotspots & small markers,
  // and tint ONLY the letters of linked citations in Royal Blue (#1D4ED8)!
  useEffect(() => {
    let isCancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const computeCitationIdsForHotspots = (
      list: VilnaPdfHotspot[],
      trId: string,
      trHe: string,
      trKa: string
    ): Set<string> => {
      const citSet = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        const cit = resolvePdfHotspotDafCitation(i, list, trId, trHe, trKa);
        if (cit) {
          const minI = Math.max(0, cit.markStartIdx);
          const maxI = Math.min(list.length - 1, cit.markEndIdx);
          for (let k = minI; k <= maxI; k++) {
            citSet.add(list[k].id);
          }
        } else if (list[i].isSmallMarker) {
          citSet.add(list[i].id);
        }
      }
      return citSet;
    };

    async function loadAndRenderPdf() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setLoadingPdf(true);

      // Always load the authentic Vilna PDF for this Daf via bundled file or server proxy
      try {
        const fetchValidPdfBuffer = async (urlToFetch: string): Promise<ArrayBuffer> => {
          const controller = new AbortController();
          const timer = setTimeout(
            () => controller.abort(),
            urlToFetch.startsWith('/api/talmud/vilna-pdf') ? 20000 : 6500
          );
          try {
            const resp = await fetch(urlToFetch, { signal: controller.signal });
            if (!resp.ok) {
              throw new Error(`Failed to fetch PDF: ${resp.status}`);
            }
            const buf = await resp.arrayBuffer();
            const head = new Uint8Array(buf.slice(0, 5));
            // Verify %PDF magic header so SPA HTML fallback is never passed to pdf.js
            const isPdfHeader =
              head.length >= 4 &&
              head[0] === 0x25 &&
              head[1] === 0x50 &&
              head[2] === 0x44 &&
              head[3] === 0x46;
            if (!isPdfHeader) {
              throw new Error(`Invalid PDF header for ${urlToFetch}`);
            }
            return buf;
          } finally {
            clearTimeout(timer);
          }
        };

        let arrayBuffer: ArrayBuffer;
        let isUsingFallbackClone = false;
        const isTalmudApiScan = activePdfUrl.startsWith('/api/talmud/vilna-pdf');
        try {
          arrayBuffer = await fetchValidPdfBuffer(activePdfUrl);
        } catch (firstErr) {
          if (isTalmudApiScan) {
            // Never show another daf's scan: its layout would not match this daf's text.
            try {
              arrayBuffer = await fetchValidPdfBuffer(activePdfUrl);
            } catch {
              if (!isCancelled) setPdfLoadFailed(true);
              throw firstErr;
            }
          } else {
            isUsingFallbackClone = true;
            const fallbackCloneUrl = isChumashPdf
              ? resolveFallbackBundledChumashPdfUrl(dafData.tractateId, dafData.dafId)
              : isSiddurPdf
                ? resolveFallbackBundledSiddurPdfUrl(dafData.tractateId, dafData.dafId)
                : null;
            if (!fallbackCloneUrl) {
              if (!isCancelled) setPdfLoadFailed(true);
              throw firstErr;
            }
            arrayBuffer = await fetchValidPdfBuffer(fallbackCloneUrl);
          }
        }
        if (!isCancelled) setPdfLoadFailed(false);
        if (isCancelled) return;

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          wasmUrl: `${origin}/pdfjs-wasm/`,
          standardFontDataUrl: `${origin}/pdfjs-fonts/`,
          cMapUrl: `${origin}/pdfjs-cmaps/`,
          cMapPacked: true,
        });
        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdfDoc.getPage(1);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        if (baseViewport.width > 0 && baseViewport.height > 0) {
          setPdfAspectRatio(baseViewport.width / baseViewport.height);
        }

        const dpr =
          typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 2;
        const renderScale = Math.min(3.2, 2.2 * dpr);
        const renderViewport = page.getViewport({ scale: renderScale });

        // Render onto an offscreen canvas first so concurrent/cancelled renders never conflict on the visible canvas
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = Math.floor(renderViewport.width);
        offscreenCanvas.height = Math.floor(renderViewport.height);
        const offCtx = offscreenCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        renderTask = page.render({
          canvasContext: offCtx,
          viewport: renderViewport,
          canvas: offscreenCanvas,
        });
        await renderTask.promise;
        if (isCancelled) return;

        // Verify that the rendered PDF page actually painted dark ink pixels onto offscreenCanvas
        // (guards against silent CCITTFax/JBIG2 decoder failures in restricted browser contexts)
        let darkInkSampleCount = 0;
        try {
          const sampleW = Math.max(1, Math.floor(offscreenCanvas.width * 0.72));
          const sampleH = Math.max(1, Math.floor(offscreenCanvas.height * 0.72));
          const sampleX = Math.floor(offscreenCanvas.width * 0.14);
          const sampleY = Math.floor(offscreenCanvas.height * 0.14);
          const imgData = offCtx.getImageData(sampleX, sampleY, sampleW, sampleH).data;
          const stride = Math.max(4, Math.floor(imgData.length / (4 * 900)) * 4);
          for (let i = 0; i < imgData.length; i += stride) {
            if (imgData[i] < 220 || imgData[i + 1] < 220 || imgData[i + 2] < 220) {
              darkInkSampleCount++;
              if (darkInkSampleCount >= 8) break;
            }
          }
        } catch {
          darkInkSampleCount = 10;
        }
        if (darkInkSampleCount < 3) {
          throw new Error('Rendered PDF canvas contained no visible ink pixels');
        }

        const textContent = await page.getTextContent();
        if (isCancelled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = offscreenCanvas.width;
        canvas.height = offscreenCanvas.height;
        ctx.drawImage(offscreenCanvas, 0, 0);

        // Only stamp header if using a fallback clone (never over authentic PDFs where text might be covered)
        const shouldStampHeader = isUsingFallbackClone;

        if (shouldStampHeader) {
          const cw = canvas.width;
          const ch = canvas.height;
          // Only stamp a subtle header if using a fallback clone, strictly in the top margin without covering text
          const headerBandY = Math.max(2, Math.round(ch * 0.003));
          const headerBandH = Math.round(ch * 0.018);
          const headerBandX = Math.round(cw * 0.20);
          const headerBandW = Math.round(cw * 0.60);

          ctx.save();
          // Subtle parchment-matching background confined strictly to the center title slot
          ctx.fillStyle = isDark ? '#EADBC2' : '#FDFBF4';
          ctx.fillRect(headerBandX, headerBandY, headerBandW, headerBandH);

          const isBet = dafData.dafId.toLowerCase().endsWith('b');
          const dafDisplayHe = dafMarkHe.replace(/[.:]/g, '');
          const amudLabelHe = isBet ? 'ע״ב' : 'ע״א';
          const perekHe = dafData.perekNameHe || (isSiddurPdf ? 'סדר התפילה' : 'פרק ראשონ');
          const siddurPageNum = dafData.dafId.replace(/[^\d]/g, '') || '29';

          ctx.fillStyle = '#111111';
          ctx.textBaseline = 'middle';
          const centerY = headerBandY + Math.round(headerBandH * 0.52);

          // Center: Tractate or Siddur Name (e.g. מסכת תרומות)
          ctx.font = `900 ${Math.round(cw * 0.022)}px "Frank Ruhl Libre", "David Libre", Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillText(
            isSiddurPdf ? tractateNameHe : `מסכת ${tractateNameHe}`,
            Math.round(cw * 0.5),
            centerY
          );

          // Right side: Perek / Section Name
          ctx.font = `700 ${Math.round(cw * 0.016)}px "Frank Ruhl Libre", "David Libre", Georgia, serif`;
          ctx.textAlign = 'right';
          ctx.fillText(perekHe, headerBandX + headerBandW - Math.round(cw * 0.02), centerY);

          // Left side: Daf & Amud or Siddur Page Number (e.g. דף ב׳ ע״ב)
          ctx.font = `800 ${Math.round(cw * 0.018)}px "Frank Ruhl Libre", "David Libre", Georgia, serif`;
          ctx.textAlign = 'left';
          ctx.fillText(
            isSiddurPdf ? `עמוד ${siddurPageNum}` : `דף ${dafDisplayHe} ${amudLabelHe}`,
            headerBandX + Math.round(cw * 0.02),
            centerY
          );
          ctx.restore();
        }

        const applyTextItems = (rawItems: Array<Record<string, unknown>>) => {
          lastPdfTextLayerRef.current = {
            dafKey,
            items: rawItems,
            baseViewport,
          };
          const latest = latestDataRef.current;
          let parsed = extractHotspotsFromTextContent(
            rawItems,
            baseViewport,
            latest.dafData.dafId.endsWith('b'),
            latest.effectiveMishnah,
            latest.effectiveGemara,
            latest.effectiveRashi,
            latest.effectiveTosafot,
            latest.dafData
          );
          setHotspots(parsed);
          if (import.meta.env.DEV && typeof window !== 'undefined') {
            (window as any).__vilnaHotspots = { dafKey, hotspots: parsed };
          }

          // Tint ONLY the dark ink glyph letters of linked citations and dibbur-hamatchil words.
          try {
            const citSet = computeCitationIdsForHotspots(
              parsed,
              latest.dafData.tractateId,
              tractateNameHe,
              tractateNameKa
            );
            tintCitationHotspotsBlueOnCanvas(ctx, canvas.width, canvas.height, parsed, citSet);
            const dhColors = new Map();
            const { roles } = buildDibburHamatchilLinks(parsed);
            for (const [id, role] of roles) {
              if (citSet.has(id)) continue;
              if (role.splitWord) dhColors.set(id, { first: RASHI_INK, second: TOSAFOT_INK });
              else if (role.rashi) dhColors.set(id, { first: RASHI_INK });
              else if (role.tosafot) dhColors.set(id, { first: TOSAFOT_INK });
            }
            tintHotspotsInkOnCanvas(ctx, canvas.width, canvas.height, parsed, dhColors);
          } catch {
            // ignore
          }
        };

        if (textContent && Array.isArray(textContent.items)) {
          const rawItems = decodeLegacyHebrewItems(textContent.items as Array<Record<string, unknown>>);
          applyTextItems(rawItems);

        }
      } catch (err) {
        const errMsg = String((err as Error)?.message || err || '').toLowerCase();
        if (isCancelled || errMsg.includes('cancel') || errMsg.includes('abort')) {
          return;
        }
        if (!isCancelled) {
          setHotspots([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingPdf(false);
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [activePdfUrl, dafKey, tractateNameHe, tractateNameKa, dafMarkHe]);

  // Refresh hotspot sentence mappings when asynchronous Sefaria commentary/text arrives WITHOUT re-rendering or cancelling the PDF canvas
  useEffect(() => {
    const cached = lastPdfTextLayerRef.current;
    if (!cached || cached.dafKey !== dafKey) return;
    const latest = latestDataRef.current;
    const parsed = extractHotspotsFromTextContent(
      cached.items,
      cached.baseViewport,
      latest.dafData.dafId.endsWith('b'),
      latest.effectiveMishnah,
      latest.effectiveGemara,
      latest.effectiveRashi,
      latest.effectiveTosafot,
      latest.dafData
    );
    setHotspots(parsed);
  }, [dynamicDafContentSig, dafKey]);

  // Helper to resolve the exact target hotspots on the Daf for any small index marker ((א), (א, א, 1..9, [א])
  const resolveMarkerTargetHotspots = useCallback(
    (markerHotspot: VilnaPdfHotspot): {
      targetHotspots: VilnaPdfHotspot[];
      commType: MarginCommentaryType;
      key: string;
      targetSentenceId?: string;
    } | null => {
      if (!markerHotspot.isSmallMarker && !markerHotspot.marginEntryKey) return null;
      const key = markerHotspot.markerKey || markerHotspot.marginEntryKey || markerHotspot.cleanWord;
      if (!key) return null;

      const isCircleTarget =
        isCircleMarker(markerHotspot.word) ||
        /^[\(\[][⊙◉◎⊛●○\*•°][\)\]]$/.test(markerHotspot.word) ||
        markerHotspot.markerTargetType === 'gilyon-hashas' ||
        key === 'גליון';

      const isDigit = /^[0-9]+$/.test(key);
      const isSingleParen =
        /[\(\)]/.test(markerHotspot.word) &&
        !(/^\(.*\)$/.test(markerHotspot.word) || /^\[.*\]$/.test(markerHotspot.word));

      // Authentic Vilna Shas marker routing:
      // 1. Arabic digits (1, 2, 3...) -> תורה אור שלם (torah-or)
      // 2. Letters with single parenthesis (א), ב), ג)...) -> מסורת הש"ს (masoret)
      // 3. Letters with double parentheses in Rashi script ((א), (ב)...) -> הגהות הב"ח (bach)
      // 4. Circle with dot/target symbol (⊙, ◉, ◎...) -> גליון הש"ס (gilyon-hashas)
      // 5. Square brackets ([א], [ב]...) -> הגהות הגר"א (gra)
      // 6. Regular Hebrew letters (א, ב, ג...) -> עין משפט נר מצוה (ein-mishpat)
      let preferredType: MarginCommentaryType = 'ein-mishpat';
      if (markerHotspot.markerTargetType) {
        preferredType = markerHotspot.markerTargetType;
      } else if (isCircleTarget) {
        preferredType = 'gilyon-hashas';
      } else if (isDigit) {
        preferredType = 'torah-or';
      } else if (/^[\[\]][\u05D0-\u05EA]{1,2}[.:]?[\[\]][.:]?$/.test(markerHotspot.word)) {
        preferredType = 'gra';
      } else if (
        /^[\(\[][\u05D0-\u05EA]{1,2}[)\]][.:]?$/.test(markerHotspot.word) ||
        /^[)\]][\u05D0-\u05EA]{1,2}[\(\[][.:]?$/.test(markerHotspot.word)
      ) {
        preferredType = 'bach';
      } else if (isSingleParen) {
        preferredType = 'masoret';
      } else {
        preferredType = 'ein-mishpat';
      }

      // Expected side of the folio: prefer where this commentary's column was actually found on the page;
      // otherwise use the Vilna layout (Ein Mishpat & Torah Or on the outer margin — left on amud A,
      // right on amud B; Masoret, Bach, Gilyon and Gra on the inner margin).
      const typedMarginHotspots = hotspots.filter(
        (h) => h.section === 'margin' && h.marginCommType === preferredType
      );
      const isOuterColComm = preferredType === 'ein-mishpat' || preferredType === 'torah-or';
      let expectedSide: 'left' | 'right' = isOuterColComm
        ? (isAmudBet ? 'right' : 'left')
        : (isAmudBet ? 'left' : 'right');
      if (typedMarginHotspots.length > 0) {
        const leftCount = typedMarginHotspots.filter((h) => h.leftPct < 50).length;
        expectedSide = leftCount * 2 >= typedMarginHotspots.length ? 'left' : 'right';
      }
      const onExpectedSide = (h: VilnaPdfHotspot) =>
        expectedSide === 'left' ? h.leftPct < 40 : h.leftPct > 60;

      // Case 1: User tapped a small marker in Mishnah / Gemara / Rashi / Tosafot -> jump to its Margin Commentary entry!
      if (markerHotspot.section !== 'margin') {
        let targetSentenceId: string | undefined = undefined;
        if (preferredType === 'ein-mishpat') {
          const em = dafData.einMishpat?.find((e) => e.marker === key || normalizeHebrewWord(e.marker) === key);
          targetSentenceId = em ? `ein-mishpat-${em.id}` : `ein-mishpat-${key}`;
        } else if (preferredType === 'torah-or') {
          targetSentenceId = getTorahOrSentenceId(dafData.torahOr, key);
        } else if (preferredType === 'masoret') {
          const m = dafData.masoretHaShas?.find((ms) => ms.marker === key || normalizeHebrewWord(ms.marker) === key);
          targetSentenceId = m ? `masoret-${m.id}` : `masoret-${key}`;
        } else if (preferredType === 'bach') {
          targetSentenceId = `hagahot-habach-${key}`;
        } else if (preferredType === 'gilyon-hashas') {
          targetSentenceId = `gilyon-hashas-${key}`;
        } else if (preferredType === 'gra') {
          targetSentenceId = `hagahot-hagra-${key}`;
        }

        const marginHotspots = hotspots.filter(
          (h) => h.section === 'margin' || (isSiddurPdf && h.section === 'rashi')
        );

        if (preferredType === 'torah-or') {
          const entry = getTorahOrEntryHotspots(hotspots, key, expectedSide);
          return entry.length ? { targetHotspots: entry, commType: preferredType, key, targetSentenceId } : null;
        }

        if (preferredType === 'gilyon-hashas') {
          const sourceSection = markerHotspot.sentence?.source === 'mishnah' ? 'mishnah' : markerHotspot.section;
          // Chronological: the n-th Gilyon marker on the daf points to the n-th note (each ends with ":").
          const rank = (x: VilnaPdfHotspot) => (x.section === 'mishnah' || x.section === 'gemara' ? 0 : x.section === 'rashi' ? 1 : 2);
          const gilyonMarkers = hotspots
            .filter((x) => x.section !== 'margin' && x.isSmallMarker &&
              (x.markerTargetType === 'gilyon-hashas' || isCircleMarker(x.word)))
            .sort((a, b) => rank(a) - rank(b) || a.topPct - b.topPct || b.leftPct - a.leftPct);
          const ordered = getGilyonNoteByOrder(hotspots, gilyonMarkers.findIndex((x) => x.id === markerHotspot.id), expectedSide);
          const entry = ordered.length ? ordered : getGilyonNote(hotspots, sourceSection, expectedSide);
          return entry.length ? { targetHotspots: entry, commType: preferredType, key, targetSentenceId } : null;
        }

        const isGilyonEntry = (h: VilnaPdfHotspot) =>
          h.marginCommType === 'gilyon-hashas' ||
          h.word.includes('גליון') ||
          isCircleMarker(h.word);

        // 1) Exact match: same commentary column + same entry key, on the expected side.
        let candidates = marginHotspots.filter(
          (h) =>
            onExpectedSide(h) &&
            (preferredType === 'gilyon-hashas'
              ? isGilyonEntry(h)
              : (h.marginCommType === preferredType &&
                  (h.marginEntryKey === key || (h.isSmallMarker && h.markerKey === key))) ||
                // The printed entry key itself (e.g. the small "א" opening an Ein Mishpat entry,
                // or "2." opening a Torah Or entry), even when the column header was not tied to it.
                (h.isSmallMarker && h.markerKey === key && h.markerTargetType === preferredType) ||
                (preferredType === 'torah-or' && /^[0-9]/.test(h.word) && h.cleanWord === key))
        );

        // 2) Same entry key on the expected side (column header was not recognised).
        if (candidates.length === 0 && preferredType !== 'gilyon-hashas') {
          candidates = marginHotspots.filter(
            (h) =>
              onExpectedSide(h) &&
              (h.marginCommType === 'ein-mishpat') === (preferredType === 'ein-mishpat') &&
              ((h.isSmallMarker && h.markerKey === key && h.markerTargetType === preferredType) ||
                h.marginEntryKey === key)
          );
        }

        if (candidates.length > 0) {
          // Prefer the printed entry key itself, then its row.
          const keyGlyphs = candidates.filter((h) => h.isSmallMarker && h.markerTargetType === preferredType);
          const pool = keyGlyphs.length > 0 ? keyGlyphs : candidates;
          let best = pool[0];
          for (const c of pool) {
            if (preferredType === 'gilyon-hashas') {
              if (Math.abs(c.topPct - markerHotspot.topPct) < Math.abs(best.topPct - markerHotspot.topPct)) best = c;
            } else if (c.topPct < best.topPct) {
              best = c;
            }
          }

          const actualComm = preferredType;
          const targetRowId = best.rowId;
          // Words on the same row, confined to the same margin column.
          const rowWords = getExactMarginEntry(hotspots, preferredType, key, expectedSide);

          return {
            targetHotspots: rowWords.length > 0 ? rowWords : [best],
            commType: actualComm,
            key,
            targetSentenceId: best.targetSentenceId || targetSentenceId,
          };
        }

        // An unverified heading or synthetic location is not the referenced text.
        return null;
      } else {
        // Case 2: User tapped an entry marker inside the Margin Commentary -> jump back to source marker!
        const matchedSource = hotspots.filter(
          (h) =>
            h.section !== 'margin' &&
            h.isSmallMarker &&
            (h.markerKey === key ||
              h.cleanWord === key ||
              h.word.replace(/[^\u05D0-\u05EA0-9]/g, '') === key) &&
            (!markerHotspot.marginCommType ||
              !h.markerTargetType ||
              h.markerTargetType === markerHotspot.marginCommType)
        );

        if (matchedSource.length > 0) {
          let best = matchedSource[0];
          let bestDist = Math.abs(best.topPct - markerHotspot.topPct);
          for (const s of matchedSource) {
            const d = Math.abs(s.topPct - markerHotspot.topPct);
            if (d < bestDist) {
              bestDist = d;
              best = s;
            }
          }
          const targetRowId = best.rowId;
          const rowWords = hotspots.filter((h) => h.rowId === targetRowId && h.section === best.section && (!best.sentence?.id || h.sentence?.id === best.sentence.id));
          return {
            targetHotspots: rowWords.length > 0 ? rowWords : [best],
            commType: markerHotspot.marginCommType || preferredType,
            key,
            targetSentenceId: best.sentence?.id,
          };
        }
      }

      return null;
    },
    [hotspots, isAmudBet, isSiddurPdf, dafData.einMishpat, dafData.torahOr, dafData.masoretHaShas]
  );

  // Ordered slice of currently selected words
  // When selecting a multi-word range (startIdx !== endIdx), skip tiny superscript index markers so only real text words are joined!
  const selectedHotspotsSlice = useMemo(() => {
    if (!selectedRange || hotspots.length === 0) return [];
    const minI = Math.max(0, Math.min(selectedRange.startIdx, selectedRange.endIdx));
    const maxI = Math.min(
      hotspots.length - 1,
      Math.max(selectedRange.startIdx, selectedRange.endIdx)
    );
    const rawSlice = hotspots.slice(minI, maxI + 1);
    if (rawSlice.length <= 1) return rawSlice;
    const anchorSection = hotspots[selectedRange.startIdx]?.section;
    const filtered = rawSlice.filter(
      (h) => !h.isSmallMarker && (!anchorSection || h.section === anchorSection)
    );
    return filtered.length > 0 ? filtered : rawSlice;
  }, [selectedRange, hotspots]);

  const selectedHotspotIdsSet = useMemo(() => {
    return new Set(selectedHotspotsSlice.map((h) => h.id));
  }, [selectedHotspotsSlice]);

  const handleCopySelectedText = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (selectedHotspotsSlice.length === 0) return;
    const textToCopy = selectedHotspotsSlice
      .filter((h) => !h.isSmallMarker)
      .map((h) => h.word)
      .join(' ');
    if (!textToCopy) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    const preview = textToCopy.length > 28 ? textToCopy.slice(0, 28) + '...' : textToCopy;
    setCopyToastText(`კოპირებულია: "${preview}"`);
    setTimeout(() => {
      setCopyToastText(null);
    }, 2400);
  }, [selectedHotspotsSlice]);

  // Combined Line + Selected Additional Text target when autoTranslateLineMode is ON
  const activeLineTranslationTarget = useMemo(() => {
    if (!activeStoppedLine) return null;
    const baseCleanHe =
      stripTalmudicReferenceHintsForTranslation(activeStoppedLine.lineTextHe) ||
      activeStoppedLine.lineTextHe;
    const extraSelected = selectedHotspotsSlice.filter(
      (h) => h.rowId !== activeStoppedLine.rowId && !h.isSmallMarker
    );
    if (extraSelected.length === 0) {
      return {
        cacheKey: activeStoppedLine.rowId,
        hebrewToTranslate: baseCleanHe,
        hasExtraSelection: false,
        extraWordsCount: 0,
      };
    }

    const stoppedRowSpots = hotspots.filter(
      (h) => h.rowId === activeStoppedLine.rowId && !h.isSmallMarker
    );
    const sameSection = extraSelected.every((h) => h.section === activeStoppedLine.section);
    let combinedRawHe = '';
    if (sameSection && stoppedRowSpots.length > 0) {
      const indexMap = new Map<string, number>();
      hotspots.forEach((h, i) => indexMap.set(h.id, i));
      const unionMap = new Map<string, VilnaPdfHotspot>();
      for (const h of stoppedRowSpots) unionMap.set(h.id, h);
      for (const h of selectedHotspotsSlice) {
        if (!h.isSmallMarker) unionMap.set(h.id, h);
      }
      const ordered = Array.from(unionMap.values()).sort(
        (a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)
      );
      combinedRawHe = ordered.map((h) => h.word).join(' ');
    } else {
      const extraRawHe = extraSelected.map((h) => h.word).join(' ');
      combinedRawHe = `${baseCleanHe} — ${extraRawHe}`;
    }

    const cleanCombinedHe =
      stripTalmudicReferenceHintsForTranslation(combinedRawHe) || combinedRawHe;
    const rangeKey = selectedRange
      ? `${Math.min(selectedRange.startIdx, selectedRange.endIdx)}-${Math.max(
          selectedRange.startIdx,
          selectedRange.endIdx
        )}`
      : 'none';
    return {
      cacheKey: `${activeStoppedLine.rowId}::sel:${rangeKey}`,
      hebrewToTranslate: cleanCombinedHe,
      hasExtraSelection: true,
      extraWordsCount: extraSelected.length,
    };
  }, [activeStoppedLine, selectedHotspotsSlice, selectedRange, hotspots]);

  // Automatically translate the active stopped line (PLUS any additionally selected text!) when autoTranslateLineMode is ON
  useEffect(() => {
    if (
      !autoTranslateLineMode ||
      !activeStoppedLine ||
      !activeLineTranslationTarget ||
      isDraggingReadingLine ||
      isDraggingSelection
    ) {
      return;
    }
    const { cacheKey, hebrewToTranslate } = activeLineTranslationTarget;
    if (lineTranslationsCacheRef.current[cacheKey]) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setTranslatingRowId(cacheKey);

      translateToGeorgianLive(hebrewToTranslate, 'iw', {
        tractate: dafData.tractateId,
        daf: dafData.dafId,
        section: activeStoppedLine.section,
        englishHint:
          activeStoppedLine.sentence.translationKa ||
          activeStoppedLine.sentence.explanationKa ||
          undefined,
      })
        .then((ka) => {
          if (cancelled) return;
          const cleaned =
            normalizeGeorgianJewishTerms(ka || '') ||
            activeStoppedLine.sentence.translationKa ||
            'სტრიქონის ქართული თარგმანი';
          setLineTranslationsCache((prev) => ({
            ...prev,
            [cacheKey]: cleaned,
          }));
        })
        .catch(() => {
          if (cancelled) return;
          setLineTranslationsCache((prev) => ({
            ...prev,
            [cacheKey]:
              activeStoppedLine.sentence.translationKa || 'სტრიქონის ქართული თარგმანი',
          }));
        })
        .finally(() => {
          if (!cancelled) setTranslatingRowId(null);
        });
    }, 90);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    autoTranslateLineMode,
    activeStoppedLine,
    activeLineTranslationTarget,
    isDraggingReadingLine,
    isDraggingSelection,
  ]);

  // Live screen position tracker for the fixed Portal Line Translation Window
  useEffect(() => {
    if (!autoTranslateLineMode || !activeStoppedLine || typeof window === 'undefined') {
      setStoppedLineRect(null);
      return;
    }
    let rafId = 0;
    const syncRect = () => {
      const el = document.getElementById('active-stopped-reading-line');
      if (el) {
        const r = el.getBoundingClientRect();
        let effectiveBottom = r.bottom;
        if (
          activeLineTranslationTarget?.hasExtraSelection &&
          multiWordAnchorRef.current
        ) {
          const selR = multiWordAnchorRef.current.getBoundingClientRect();
          if (selR.bottom > r.bottom && selR.bottom - r.bottom < 180) {
            effectiveBottom = selR.bottom;
          }
        }
        const vvScale = window.visualViewport?.scale || 1;
        setStoppedLineRect((prev) => {
          const next = {
            top: Math.round(r.top),
            bottom: Math.round(effectiveBottom),
            left: Math.round(r.left),
            width: Math.round(r.width),
            vw: window.innerWidth,
            vh: window.innerHeight,
            vvScale: Number(vvScale.toFixed(3)),
          };
          if (
            prev &&
            prev.top === next.top &&
            prev.bottom === next.bottom &&
            prev.left === next.left &&
            prev.width === next.width &&
            prev.vw === next.vw &&
            prev.vvScale === next.vvScale
          ) {
            return prev;
          }
          return next;
        });
      }
      rafId = requestAnimationFrame(syncRect);
    };
    rafId = requestAnimationFrame(syncRect);
    return () => cancelAnimationFrame(rafId);
  }, [autoTranslateLineMode, activeStoppedLine, activeLineTranslationTarget]);

  // Detect all hotspots on the PDF page that belong to a Talmudic Daf citation (like (.דף לג)) or linked commentary marker so their letters are colored green from the start!
  const citationHotspotIdsSet = useMemo(() => {
    const set = new Set<string>();
    if (hotspots.length === 0) return set;
    for (let i = 0; i < hotspots.length; i++) {
      const cit = resolvePdfHotspotDafCitation(
        i,
        hotspots,
        dafData.tractateId,
        tractateNameHe,
        tractateNameKa
      );
      if (cit) {
        const minI = Math.max(0, cit.markStartIdx);
        const maxI = Math.min(hotspots.length - 1, cit.markEndIdx);
        for (let k = minI; k <= maxI; k++) {
          set.add(hotspots[k].id);
        }
      } else if (hotspots[i].isSmallMarker) {
        const resolved = resolveMarkerTargetHotspots(hotspots[i]);
        if (resolved && resolved.targetHotspots.length > 0) {
          set.add(hotspots[i].id);
        }
      }
    }
    return set;
  }, [hotspots, dafData.tractateId, tractateNameHe, tractateNameKa, resolveMarkerTargetHotspots]);

  // Rashi (green) / Tosafot (bordeaux) dibbur-hamatchil ↔ main-text links.
  const dibburLinks = useMemo(() => {
    const { links, roles } = buildDibburHamatchilLinks(hotspots);
    return { byKey: new Map(links.map((l) => [l.key, l])), roles };
  }, [hotspots]);

  const jumpToDibbur = useCallback(
    (h: VilnaPdfHotspot, clientX: number, rect: DOMRect | null): boolean => {
      const role = dibburLinks.roles.get(h.id);
      if (!role || h.isSmallMarker || citationHotspotIdsSet.has(h.id)) return false;
      let side: 'rashi' | 'tosafot' | undefined;
      if (role.splitWord && rect) side = splitSideAt(clientX, rect);
      else side = role.rashi ? 'rashi' : role.tosafot ? 'tosafot' : undefined;
      const key = side ? role[side] : undefined;
      const link = key ? dibburLinks.byKey.get(key) : undefined;
      if (!link) return false;
      const fromMain = h.section === 'gemara' || h.section === 'mishnah';
      const ids = new Set(fromMain ? link.dhIds : link.mainIds);
      const targets = hotspots.filter((x) => ids.has(x.id));
      if (targets.length === 0) return false;
      const left = Math.min(...targets.map((t) => t.leftPct));
      const top = Math.min(...targets.map((t) => t.topPct));
      const right = Math.max(...targets.map((t) => t.leftPct + t.widthPct));
      const bottom = Math.max(...targets.map((t) => t.topPct + t.heightPct));
      const isRashi = link.commentator === 'rashi';
      const dhText = hotspots.filter((x) => link.dhIds.includes(x.id)).map((x) => x.word).join(' ');
      setSelectedRange(null);
      setShowRangeHandles(false);
      setBlinkingTarget({
        key: `dh:${link.key}:${Date.now()}`,
        labelHe: isRashi ? 'רש״י' : 'תוספות',
        labelKa: fromMain ? (isRashi ? 'რაში' : 'თოსაფოთი') : 'გემარა',
        originMarker: `${isRashi ? 'רש״י' : 'תוס׳'} · ${dhText.slice(0, 24)}`,
        leftPct: left,
        topPct: top,
        widthPct: right - left,
        heightPct: bottom - top,
        hotspotIds: ids,
        activatedAt: Date.now(),
      });
      window.dispatchEvent(
        new CustomEvent('talmud-focus-target-pct', {
          detail: { ox: (left + right) / 2, oy: (top + bottom) / 2, keepScale: true, scrollHandled: true },
        })
      );
      requestAnimationFrame(() => {
        const el = pageContainerRef.current?.querySelector(`[id="pdf-hotspot-${targets[0].id}"]`);
        if (el instanceof HTMLElement) scrollToTarget(el);
      });
      return true;
    },
    [dibburLinks, hotspots, citationHotspotIdsSet]
  );

  // A dibbur-hamatchil destination glows for a few seconds, then fades by itself.
  useEffect(() => {
    if (!blinkingTarget?.key.startsWith('dh:')) return;
    const key = blinkingTarget.key;
    const t = window.setTimeout(() => {
      setBlinkingTarget((cur) => (cur && cur.key === key ? null : cur));
    }, 3200);
    return () => window.clearTimeout(t);
  }, [blinkingTarget]);

  // Detect if the currently selected hotspot(s) represent a Talmudic Daf citation (like (.דף לג) -> Berakhot 33a)
  const activeSelectedDafCitation = useMemo(() => {
    if (!selectedRange || hotspots.length === 0) return null;
    return (
      resolvePdfHotspotDafCitation(
        selectedRange.startIdx,
        hotspots,
        dafData.tractateId,
        tractateNameHe,
        tractateNameKa
      ) ||
      resolvePdfHotspotDafCitation(
        selectedRange.endIdx,
        hotspots,
        dafData.tractateId,
        tractateNameHe,
        tractateNameKa
      )
    );
  }, [selectedRange, hotspots, dafData.tractateId, tractateNameHe, tractateNameKa]);

  // Detect if the currently selected single hotspot is a linked small marker (like (א) -> הגהות הב"ח)
  const activeSelectedMarkerTarget = useMemo(() => {
    if (
      !selectedRange ||
      selectedRange.startIdx !== selectedRange.endIdx ||
      hotspots.length === 0
    ) {
      return null;
    }
    const spot = hotspots[selectedRange.startIdx];
    if (!spot || !spot.isSmallMarker) return null;
    const resolved = resolveMarkerTargetHotspots(spot);
    if (!resolved || resolved.targetHotspots.length === 0) return null;
    const meta = MARGIN_COMM_LABELS[resolved.commType] || {
      he: 'מראה מקום',
      ka: 'მითითებული კომენტარი',
    };
    return {
      spot,
      resolved,
      labelKa: `${meta.ka} (${resolved.key})`,
      labelHe: `${meta.he} (${resolved.key})`,
    };
  }, [selectedRange, hotspots, resolveMarkerTargetHotspots]);

  // Union bounding box in percentage coordinates for the selected word(s)
  const selectedUnionBoxPct = useMemo(() => {
    if (selectedHotspotsSlice.length === 0) return null;
    let minLeft = 100;
    let maxRight = 0;
    let minTop = 100;
    let maxBottom = 0;
    for (const h of selectedHotspotsSlice) {
      minLeft = Math.min(minLeft, h.leftPct);
      maxRight = Math.max(maxRight, h.leftPct + h.widthPct);
      minTop = Math.min(minTop, h.topPct);
      maxBottom = Math.max(maxBottom, h.topPct + h.heightPct);
    }
    return {
      leftPct: minLeft,
      topPct: minTop,
      widthPct: Math.max(1.2, maxRight - minLeft),
      heightPct: Math.max(1.2, maxBottom - minTop),
    };
  }, [selectedHotspotsSlice]);

  // Cross-Commentary Highlighting (Requirement 1):
  // Highlights matching places in Rashi, Tosafot, and Margin Commentaries (including הגהות הב"ח, מסורת הש"ס, עין משפט, תורה אור)!
  const relatedCommentaryHotspotIds = useMemo(() => {
    const directSet = new Set<string>();
    const sentenceRelatedSet = new Set<string>();
    if (selectedHotspotsSlice.length === 0) {
      return { directSet, sentenceRelatedSet };
    }

    // If a small index marker ((א), (א, א, 1..9) is selected, immediately highlight its exact target commentary entry!
    if (selectedHotspotsSlice.length === 1 && selectedHotspotsSlice[0].isSmallMarker) {
      const resolved = resolveMarkerTargetHotspots(selectedHotspotsSlice[0]);
      if (resolved) {
        for (const th of resolved.targetHotspots) {
          directSet.add(th.id);
        }
        return { directSet, sentenceRelatedSet };
      }
    }

    const primarySection = selectedHotspotsSlice[0].section;
    const selectedCleanWords = new Set<string>();
    const selectedStems = new Set<string>();

    for (const h of selectedHotspotsSlice) {
      if (h.cleanWord.length >= 2) {
        selectedCleanWords.add(h.cleanWord);
        const stem = stripHebrewPrefix(h.cleanWord);
        if (stem.length >= 3) selectedStems.add(stem);
      }
    }

    const lineRawText =
      selectedHotspotsSlice[0].lineTextHe ||
      selectedHotspotsSlice[0].sentence.hebrewText ||
      '';
    const sentenceSignificantWords = new Set<string>();
    for (const rawTok of lineRawText.split(/\s+/)) {
      const cw = normalizeHebrewWord(rawTok);
      if (cw.length >= 3 && !HEBREW_STOP_WORDS.has(cw)) {
        sentenceSignificantWords.add(cw);
        const stem = stripHebrewPrefix(cw);
        if (stem.length >= 3 && !HEBREW_STOP_WORDS.has(stem)) {
          sentenceSignificantWords.add(stem);
        }
      }
    }

    const otherRowMatchCounts = new Map<string, number>();
    for (const h of hotspots) {
      if (h.section === primarySection || h.section === 'header' || h.isSmallMarker) continue;
      if (selectedHotspotIdsSet.has(h.id)) continue;
      const cw = h.cleanWord;
      const stem = stripHebrewPrefix(cw);
      if (
        selectedCleanWords.has(cw) ||
        (stem.length >= 3 && selectedStems.has(stem))
      ) {
        directSet.add(h.id);
        otherRowMatchCounts.set(h.rowId, (otherRowMatchCounts.get(h.rowId) || 0) + 3);
      } else if (
        cw.length >= 3 &&
        !HEBREW_STOP_WORDS.has(cw) &&
        (sentenceSignificantWords.has(cw) ||
          (stem.length >= 3 && sentenceSignificantWords.has(stem)))
      ) {
        otherRowMatchCounts.set(h.rowId, (otherRowMatchCounts.get(h.rowId) || 0) + 1);
      }
    }

    for (const h of hotspots) {
      if (h.section === primarySection || h.section === 'header' || h.isSmallMarker) continue;
      if (directSet.has(h.id) || selectedHotspotIdsSet.has(h.id)) continue;
      const rowScore = otherRowMatchCounts.get(h.rowId) || 0;
      if (rowScore >= 2) {
        const cw = h.cleanWord;
        const stem = stripHebrewPrefix(cw);
        if (
          cw.length >= 3 &&
          !HEBREW_STOP_WORDS.has(cw) &&
          (sentenceSignificantWords.has(cw) ||
            (stem.length >= 3 && sentenceSignificantWords.has(stem)))
        ) {
          sentenceRelatedSet.add(h.id);
        }
      }
    }

    return { directSet, sentenceRelatedSet };
  }, [selectedHotspotsSlice, hotspots, selectedHotspotIdsSet, resolveMarkerTargetHotspots]);

  // Live screen position tracker for the selected citation union box so CrystalDiamondJumpButton renders via fixed Portal completely independent of Daf zoom
  useEffect(() => {
    if (!selectedUnionBoxPct || typeof window === 'undefined') {
      setSelectedUnionScreenRect(null);
      return;
    }
    let rafId = 0;
    const syncUnionRect = () => {
      const el = multiWordAnchorRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setSelectedUnionScreenRect((prev) => {
          const next = {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
          if (
            prev &&
            prev.top === next.top &&
            prev.left === next.left &&
            prev.width === next.width &&
            prev.height === next.height
          ) {
            return prev;
          }
          return next;
        });
      }
      rafId = requestAnimationFrame(syncUnionRect);
    };
    rafId = requestAnimationFrame(syncUnionRect);
    return () => cancelAnimationFrame(rafId);
  }, [selectedUnionBoxPct, activeSelectedDafCitation, activeSelectedMarkerTarget]);

  // Helper to commit a single-word or multi-word selection to parent App state
  const commitSelectionRange = useCallback(
    (startIdx: number, endIdx: number, forceOpenNote = false) => {
      if (hotspots.length === 0) return;
      const minI = Math.max(0, Math.min(startIdx, endIdx));
      const maxI = Math.min(hotspots.length - 1, Math.max(startIdx, endIdx));
      const rawSlice = hotspots.slice(minI, maxI + 1);
      const anchorSection = hotspots[startIdx]?.section;
      const slice =
        rawSlice.length > 1
          ? rawSlice.filter(
              (h) => !h.isSmallMarker && (!anchorSection || h.section === anchorSection)
            )
          : rawSlice;
      if (slice.length === 0) return;

      const combinedWord = slice.map((h) => h.word).join(' ');
      const primaryHotspot = slice[0];
      if (!primaryHotspot.isSmallMarker && (!autoTranslateLineMode || !stoppedRowId)) {
        updateStoppedRow(primaryHotspot.rowId);
      }

      let rect: DOMRect | null = null;
      if (pageContainerRef.current) {
        const containerRect = pageContainerRef.current.getBoundingClientRect();
        let minLeft = 100;
        let maxRight = 0;
        let minTop = 100;
        let maxBottom = 0;
        for (const h of slice) {
          minLeft = Math.min(minLeft, h.leftPct);
          maxRight = Math.max(maxRight, h.leftPct + h.widthPct);
          minTop = Math.min(minTop, h.topPct);
          maxBottom = Math.max(maxBottom, h.topPct + h.heightPct);
        }
        const leftPx = containerRect.left + (minLeft / 100) * containerRect.width;
        const topPx = containerRect.top + (minTop / 100) * containerRect.height;
        const widthPx = Math.max(16, ((maxRight - minLeft) / 100) * containerRect.width);
        const heightPx = Math.max(14, ((maxBottom - minTop) / 100) * containerRect.height);
        rect = new DOMRect(leftPx, topPx, widthPx, heightPx);
      }

      if (!rect) return;

      const combinedSentenceHe =
        autoTranslateLineMode && activeLineTranslationTarget?.hasExtraSelection
          ? activeLineTranslationTarget.hebrewToTranslate
          : slice.length > 2
            ? stripTalmudicReferenceHintsForTranslation(combinedWord) || combinedWord
            : primaryHotspot.lineTextHe || primaryHotspot.sentence.hebrewText;

      const combinedSentence: TalmudSentence =
        slice.length > 1 || (autoTranslateLineMode && activeLineTranslationTarget?.hasExtraSelection)
          ? {
              ...primaryHotspot.sentence,
              hebrewText: combinedSentenceHe,
            }
          : primaryHotspot.sentence;

      onSelectWordOrSentence(combinedWord, combinedSentence, rect);
      if (forceOpenNote && onOpenWordNote) {
        onOpenWordNote();
      }
    },
    [
      hotspots,
      autoTranslateLineMode,
      stoppedRowId,
      activeLineTranslationTarget,
      onSelectWordOrSentence,
      onOpenWordNote,
      updateStoppedRow,
    ]
  );

  // Locate the hotspot index closest to a client (x, y) coordinate within a given section
  const findNearestHotspotIndexAtPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      restrictSection?: VilnaPdfHotspot['section']
    ): number | null => {
      if (!pageContainerRef.current || hotspots.length === 0) return null;
      const rect = pageContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;

      let bestIdx: number | null = null;
      let bestDist = Infinity;

      for (let i = 0; i < hotspots.length; i++) {
        const h = hotspots[i];
        if (h.isSmallMarker) continue;
        if (restrictSection && h.section !== restrictSection) continue;
        const cx = h.leftPct + h.widthPct * 0.5;
        const cy = h.topPct + h.heightPct * 0.5;
        const dist = Math.hypot(cx - xPct, (cy - yPct) * 2.4);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      return bestDist < 28 ? bestIdx : null;
    },
    [hotspots]
  );

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        delete document.body.dataset.talmudWordSelecting;
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Global pointer move / up listeners when dragging a multi-word copy/paste selection
  useEffect(() => {
    if (!isDraggingSelection) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (dragAnchorIdxRef.current === null) return;
      const anchorHotspot = hotspots[dragAnchorIdxRef.current];
      const hoverIdx = findNearestHotspotIndexAtPoint(
        clientX,
        clientY,
        anchorHotspot?.section
      );
      if (hoverIdx === null) return;

      setSelectedRange((prev) => {
        if (!prev) return { startIdx: dragAnchorIdxRef.current!, endIdx: hoverIdx };
        if (dragModeRef.current === 'start-handle') {
          return { startIdx: hoverIdx, endIdx: prev.endIdx };
        }
        if (dragModeRef.current === 'end-handle') {
          return { startIdx: prev.startIdx, endIdx: hoverIdx };
        }
        return { startIdx: dragAnchorIdxRef.current!, endIdx: hoverIdx };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const finishDrag = () => {
      setIsDraggingSelection(false);
      dragModeRef.current = 'none';
      if (typeof document !== 'undefined') {
        delete document.body.dataset.talmudWordSelecting;
      }
      setSelectedRange((currentRange) => {
        if (currentRange) {
          setTimeout(() => {
            commitSelectionRange(currentRange.startIdx, currentRange.endIdx, false);
          }, 0);
        }
        return currentRange;
      });
      // Reset suppressNextClickRef after a short delay so a subsequent second tap on the selected range opens the Note window!
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 90);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', finishDrag);
    window.addEventListener('touchcancel', finishDrag);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', finishDrag);
      window.removeEventListener('touchcancel', finishDrag);
    };
  }, [isDraggingSelection, hotspots, findNearestHotspotIndexAtPoint, commitSelectionRange]);

  // Global capture-phase touchmove listener: if the user moves their finger to pan/scroll the Daf, cancel word triggers
  useEffect(() => {
    const onGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingSelection) return;
      if (!pointerDownPosRef.current) return;
      if (e.touches.length !== 1) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        pointerDownPosRef.current = null;
        suppressNextClickRef.current = true;
        return;
      }
      const dist = Math.hypot(
        e.touches[0].clientX - pointerDownPosRef.current.x,
        e.touches[0].clientY - pointerDownPosRef.current.y
      );
      if (dist > 18) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        pointerDownPosRef.current = null;
        suppressNextClickRef.current = true;
      }
    };

    window.addEventListener('touchmove', onGlobalTouchMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener('touchmove', onGlobalTouchMove, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [isDraggingSelection]);

  const handleWordPointerDown = (
    idx: number,
    clientX: number,
    clientY: number,
    _isTouch: boolean
  ) => {
    if (typeof document !== 'undefined' && document.body.dataset.talmudPanning === 'true') {
      return;
    }
    pointerDownPosRef.current = { x: clientX, y: clientY, idx };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    const isInsideAlreadySelected =
      selectedRange !== null &&
      idx >= Math.min(selectedRange.startIdx, selectedRange.endIdx) &&
      idx <= Math.max(selectedRange.startIdx, selectedRange.endIdx);

    // Long-press (~450ms) on any regular word starts copy/paste range selection
    if (!hotspots[idx]?.isSmallMarker) {
      longPressTimerRef.current = setTimeout(() => {
        if (typeof document !== 'undefined' && document.body.dataset.talmudPanning === 'true') {
          return;
        }
        suppressNextClickRef.current = true;
        setShowRangeHandles(true);
        const anchorIdx = isInsideAlreadySelected && selectedRange ? selectedRange.startIdx : idx;
        dragAnchorIdxRef.current = anchorIdx;
        dragModeRef.current = 'range';
        setSelectedRange({ startIdx: anchorIdx, endIdx: idx });
        setIsDraggingSelection(true);
        if (typeof document !== 'undefined') {
          document.body.dataset.talmudWordSelecting = 'true';
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {}
        }
      }, 450);
    }
  };

  const handleWordTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSelection) return;
    if (e.touches.length !== 1 || !pointerDownPosRef.current) {
      clearLongPressTimer();
      suppressNextClickRef.current = true;
      return;
    }
    const dist = Math.hypot(
      e.touches[0].clientX - pointerDownPosRef.current.x,
      e.touches[0].clientY - pointerDownPosRef.current.y
    );
    if (dist > 18) {
      clearLongPressTimer();
      suppressNextClickRef.current = true;
    }
  };

  const handleWordMouseMove = (e: React.MouseEvent, idx: number) => {
    if (
      e.buttons !== 1 ||
      !pointerDownPosRef.current ||
      isDraggingSelection ||
      hotspots[idx]?.isSmallMarker ||
      (typeof document !== 'undefined' &&
        (document.body.dataset.talmudPanning === 'true' ||
          document.querySelector('[data-daf-pan-mode="true"]')))
    ) {
      return;
    }
    const dist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    if (dist > 6) {
      suppressNextClickRef.current = true;
      const startIdx = pointerDownPosRef.current.idx;
      dragAnchorIdxRef.current = startIdx;
      dragModeRef.current = 'range';
      setSelectedRange({ startIdx, endIdx: idx });
      if (startIdx !== idx) {
        setShowRangeHandles(true);
      }
      setIsDraggingSelection(true);
      if (typeof document !== 'undefined') {
        document.body.dataset.talmudWordSelecting = 'true';
      }
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerDownPosRef.current = null;
  };

  // Trigger jump + continuous blinking on the target commentary spot for a small index marker ((א), (א, א, 1..9)
  const triggerJumpAndBlinkForMarker = useCallback(
    (markerHotspot: VilnaPdfHotspot): boolean => {
      const resolved = resolveMarkerTargetHotspots(markerHotspot);
      if (!resolved || resolved.targetHotspots.length === 0) return false;

      let minLeft = 100;
      let maxRight = 0;
      let minTop = 100;
      let maxBottom = 0;
      const ids = new Set<string>();

      for (const th of resolved.targetHotspots) {
        ids.add(th.id);
        minLeft = Math.min(minLeft, th.leftPct);
        maxRight = Math.max(maxRight, th.leftPct + th.widthPct);
        minTop = Math.min(minTop, th.topPct);
        maxBottom = Math.max(maxBottom, th.topPct + th.heightPct);
      }

      const padX = 0.6;
      const padY = 0.45;
      const boxLeft = Math.max(0.2, minLeft - padX);
      const boxTop = Math.max(0.2, minTop - padY);
      const rawWidth = Math.max(2.2, maxRight - minLeft + padX * 2);
      const rawHeight = Math.max(1.8, maxBottom - minTop + padY * 2);

      // HARD SAFEGUARD: Margin commentary target box must NEVER span the whole page!
      // Limit margin note width to 18.0% and height to 8.5% so the whole screen never flashes!
      const isTargetInMargin = resolved.targetHotspots[0]?.section === 'margin';
      const boxWidth = Math.min(isTargetInMargin ? 18.0 : 45.0, Math.min(99 - boxLeft, rawWidth));
      const boxHeight = Math.min(isTargetInMargin ? 8.5 : 18.0, Math.min(99 - boxTop, rawHeight));

      const meta = MARGIN_COMM_LABELS[resolved.commType] || {
        he: 'מראה מקום',
        ka: 'მითითებული კომენტარი',
      };

      const secLabelKa =
        markerHotspot.section === 'tosafot'
          ? 'თოსაფოთი'
          : markerHotspot.section === 'rashi'
            ? 'რაში'
            : markerHotspot.section === 'margin'
              ? 'კიდის კომენტარი'
              : 'გემარა';

      // Save internal PDF return point so the user can return to the exact spot they came from!
      setInternalPdfReturnPoint({
        rowId: markerHotspot.rowId,
        selectedRange: selectedRange,
        hotspotId: markerHotspot.id,
        leftPct: markerHotspot.leftPct,
        topPct: markerHotspot.topPct,
        widthPct: markerHotspot.widthPct,
        heightPct: markerHotspot.heightPct,
        windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
        labelKa: `${secLabelKa} (${markerHotspot.word})`,
        labelHe: markerHotspot.word,
      });

      setBlinkingTarget({
        key: `${resolved.commType}:${resolved.key}:${Date.now()}`,
        labelHe: `${meta.he} (${resolved.key})`,
        labelKa: `${meta.ka} (${resolved.key})`,
        originMarker: `${meta.he} · ${markerHotspot.word === '$' ? '⦸' : markerHotspot.word}`,
        leftPct: boxLeft,
        topPct: boxTop,
        widthPct: boxWidth,
        heightPct: boxHeight,
        hotspotIds: ids,
        activatedAt: Date.now(),
      });

      const centerOx = boxLeft + boxWidth * 0.5;
      const centerOy = boxTop + boxHeight * 0.5;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('talmud-focus-target-pct', {
            detail: { ox: centerOx, oy: centerOy, targetScale: 1.45, scrollHandled: true },
          })
        );
      }

      const targetHotspot = resolved.targetHotspots[0];
      const targetSentenceId =
        targetHotspot?.targetSentenceId ||
        resolved.targetSentenceId ||
        targetHotspot?.sentence?.id;

      if (typeof window !== 'undefined' && targetSentenceId) {
        window.dispatchEvent(
          new CustomEvent('talmud-jump-to-sentence', {
            detail: {
              sentenceId: targetSentenceId,
              targetHotspotId: targetHotspot?.id,
              refKey: resolved.key,
              commType: resolved.commType,
              labelKa: meta.ka,
              scrollHandled: true,
            },
          })
        );
      }

      // Scroll to the real target element (measured live, so zoom transforms and
      // nested scroll containers are accounted for). Falls back to the page box.
      requestAnimationFrame(() => {
        const page = pageContainerRef.current;
        const targetEl = page?.querySelector('[data-marker-navigation-target]') ||
          (targetHotspot && page?.querySelector(`[id="pdf-hotspot-${targetHotspot.id}"]`));
        if (targetEl instanceof HTMLElement) scrollToTarget(targetEl);
      });

      return true;
    },
    [resolveMarkerTargetHotspots, selectedRange]
  );

  // Requirement: Direct focus on connected text on the same Daf when a blue citation link is tapped (without opening any window or note popup!)
  const triggerFocusForSameDafCitation = useCallback(
    (
      citation: NonNullable<ReturnType<typeof resolvePdfHotspotDafCitation>>,
      clickedHotspot: VilnaPdfHotspot
    ): boolean => {
      const citationNoiseWords = new Set([
        'דף',
        'בדף',
        'מדף',
        'לדף',
        'ודף',
        'פרק',
        'בפרק',
        'מסכת',
        'במסכת',
        'שם',
        'וכו',
        'כו',
        'עא',
        'עב',
        'לקמן',
        'לעיל',
        'פירש',
        'רשי',
        'תוספות',
        'בתוספות',
        normalizeHebrewWord(tractateNameHe),
      ]);

      const rawQuery = (citation.contextSnippetHe || citation.citeHe || '')
        .replace(/[\u0591-\u05C7]/g, '')
        .split(/\s+/)
        .map((w) => normalizeHebrewWord(w))
        .filter((w) => w.length >= 2);

      const meaningfulTokens = rawQuery.filter(
        (w) => !citationNoiseWords.has(w) && !parsePdfHebrewDafToken(w)
      );
      const searchTokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawQuery;

      // Find matching line in PDF
      let targetLine: PdfDafLine | null = null;
      let bestScore = 0;

      for (const line of pdfLines) {
        if (line.section === 'header' || line.section === 'margin') continue;
        const linePlain = normalizeHebrewWord(
          `${line.lineTextHe} ${line.sentence.dibburHamatchil || ''} ${
            line.sentence.hebrewText || ''
          }`
        );
        let score = 0;
        for (const tok of searchTokens) {
          if (linePlain.includes(tok)) score += 3;
          const stem = stripHebrewPrefix(tok);
          if (stem.length >= 3 && linePlain.includes(stem)) score += 2;
        }
        if (score > 0 && (line.section === 'gemara' || line.section === 'mishnah')) {
          score += 0.5;
        }
        if (score > bestScore) {
          bestScore = score;
          targetLine = line;
        }
      }

      if (!targetLine) {
        targetLine =
          pdfLines.find((l) => l.section === 'gemara') ||
          pdfLines.find((l) => l.section === 'mishnah') ||
          pdfLines[0] ||
          null;
      }

      if (!targetLine) return false;

      updateStoppedRow(targetLine.rowId);

      const rowHotspots = hotspots.filter((h) => h.rowId === targetLine!.rowId);
      const matchedRowSpots =
        searchTokens.length > 0
          ? rowHotspots.filter((h) =>
              searchTokens.some(
                (tok) =>
                  h.cleanWord === tok ||
                  h.cleanWord.includes(tok) ||
                  tok.includes(h.cleanWord) ||
                  (stripHebrewPrefix(tok).length >= 3 &&
                    h.cleanWord.includes(stripHebrewPrefix(tok)))
              )
            )
          : [];

      const focusSpots = matchedRowSpots.length >= 1 ? matchedRowSpots : rowHotspots;
      const ids = new Set<string>(focusSpots.map((h) => h.id));

      let minLeft = 100;
      let maxRight = 0;
      let minTop = 100;
      let maxBottom = 0;
      for (const h of focusSpots) {
        minLeft = Math.min(minLeft, h.leftPct);
        maxRight = Math.max(maxRight, h.leftPct + h.widthPct);
        minTop = Math.min(minTop, h.topPct);
        maxBottom = Math.max(maxBottom, h.topPct + h.heightPct);
      }

      const padX = 0.6;
      const padY = 0.45;
      const boxLeft = Math.max(0.2, minLeft - padX);
      const boxTop = Math.max(0.2, minTop - padY);
      const boxWidth = Math.min(99 - boxLeft, Math.max(2.2, maxRight - minLeft + padX * 2));
      const boxHeight = Math.min(99 - boxTop, Math.max(1.8, maxBottom - minTop + padY * 2));

      setInternalPdfReturnPoint({
        rowId: clickedHotspot.rowId,
        selectedRange: null,
        hotspotId: clickedHotspot.id,
        leftPct: clickedHotspot.leftPct,
        topPct: clickedHotspot.topPct,
        widthPct: clickedHotspot.widthPct,
        heightPct: clickedHotspot.heightPct,
        windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
        labelKa: `${tractateNameKa} ${dafData.dafId}`,
        labelHe: citation.citeHe,
      });

      setBlinkingTarget({
        key: `same-daf-cite:${citation.citeHe}:${Date.now()}`,
        labelHe: citation.citeHe,
        labelKa: `${tractateNameKa} ${dafData.dafId}`,
        leftPct: boxLeft,
        topPct: boxTop,
        widthPct: boxWidth,
        heightPct: boxHeight,
        hotspotIds: ids,
        activatedAt: Date.now(),
      });

      const centerOx = boxLeft + boxWidth * 0.5;
      const centerOy = boxTop + boxHeight * 0.5;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('talmud-focus-target-pct', {
            detail: { ox: centerOx, oy: centerOy, targetScale: 1.45 },
          })
        );
      }

      const scrollToCitationTarget = () => {
        const folio = document.getElementById('talmud-daf-folio-anchor');
        if (pageContainerRef.current) {
          const pRect = pageContainerRef.current.getBoundingClientRect();
          const targetY = (centerOy / 100) * pRect.height;
          if (folio && folio.contains(pageContainerRef.current)) {
            const fRect = folio.getBoundingClientRect();
            const targetTop =
              folio.scrollTop + (pRect.top - fRect.top) + targetY - folio.clientHeight * 0.40;
            folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          } else if (typeof window !== 'undefined') {
            const targetDocY =
              window.scrollY + pRect.top + targetY - window.innerHeight * 0.40;
            window.scrollTo({ top: Math.max(0, targetDocY), behavior: 'smooth' });
          }
        } else if (folio && folio.scrollHeight > folio.clientHeight + 10) {
          const targetTop = (centerOy / 100) * folio.scrollHeight - folio.clientHeight * 0.40;
          folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      };

      setTimeout(scrollToCitationTarget, 40);
      setTimeout(scrollToCitationTarget, 160);

      return true;
    },
    [pdfLines, hotspots, tractateNameHe, tractateNameKa, dafData.dafId, updateStoppedRow]
  );

  const openBiblicalCitation = (idx: number): boolean => {
    const spot = hotspots[idx];
    if (!spot) return false;
    const row = hotspots.filter(h => h.rowId === spot.rowId).sort((a,b) => b.leftPct - a.leftPct);
    const citation = parseBiblicalCitation(row.map(h => h.word).join(' '));
    if (!citation) return false;
    // Only the printed citation is a link, not every word in its quotation row.
    const bookIdx = row.findIndex(h => h.word.includes(citation.bookHe));
    const spotIdx = row.findIndex(h => h.id === spot.id);
    const citationEndIdx = bookIdx + (citation.verse ? 2 : 1);
    if (bookIdx < 0 || spotIdx < bookIdx || spotIdx > citationEndIdx) return false;
    setSelectedRange(null); setShowRangeHandles(false);
    setBiblicalCitation(citation);
    return true;
  };

  const handleWordClick = (e: React.MouseEvent<HTMLElement>, idx: number) => {
    e.stopPropagation();
    clearLongPressTimer();

    if (
      suppressNextClickRef.current ||
      (typeof document !== 'undefined' &&
        document.body.dataset.talmudPanning === 'true')
    ) {
      suppressNextClickRef.current = false;
      return;
    }

    // While a long-press selection is active, tapping another word in the same column extends it.
    if (showRangeHandles && selectedRange && !hotspots[idx]?.isSmallMarker) {
      const a = Math.min(selectedRange.startIdx, selectedRange.endIdx);
      const b = Math.max(selectedRange.startIdx, selectedRange.endIdx);
      if (idx < a || idx > b) {
        if (hotspots[idx]?.section === hotspots[a]?.section) {
          const next = idx < a ? { startIdx: idx, endIdx: b } : { startIdx: a, endIdx: idx };
          setSelectedRange(next);
          commitSelectionRange(next.startIdx, next.endIdx, false);
          return;
        }
      }
    }

    const clickedHotspot = hotspots[idx];
    if (!clickedHotspot) return;
    if (openBiblicalCitation(idx)) return;

    // When tapping on an index marker (either in text or in the margin commentary):
    // Directly focus on the connected target with smooth scroll & blink — DO NOT open any note window!
    if (clickedHotspot.isSmallMarker || clickedHotspot.marginEntryKey) {
      setSelectedRange(null);
      setShowRangeHandles(false);
      const jumped = triggerJumpAndBlinkForMarker(clickedHotspot);
      if (jumped) return;
    }

    const detectedCitation = resolvePdfHotspotDafCitation(
      idx,
      hotspots,
      dafData.tractateId,
      tractateNameHe,
      tractateNameKa
    );

    const isCitationOnSameDaf =
      detectedCitation !== null &&
      (!detectedCitation.tractateId ||
        detectedCitation.tractateId.toLowerCase() === dafData.tractateId.toLowerCase()) &&
      (!detectedCitation.dafId ||
        detectedCitation.dafId.toLowerCase() === dafData.dafId.toLowerCase());

    if (detectedCitation && isCitationOnSameDaf) {
      setSelectedRange(null);
      setShowRangeHandles(false);
      const focused = triggerFocusForSameDafCitation(detectedCitation, clickedHotspot);
      if (focused) return;
    }

    // Direct, first-tap navigation for citations to another Daf (e.g. "(דף כד.)"):
    // Open cited Daf immediately in the Floating Source Note Window!
    if (detectedCitation && !isCitationOnSameDaf) {
      if (onNavigateToCitation) {
        const secLabelKa =
          clickedHotspot.section === 'tosafot'
            ? 'თოსაფოთი'
            : clickedHotspot.section === 'rashi'
              ? 'რაში'
              : clickedHotspot.section === 'margin'
                ? 'კიდის კომენტარი'
                : 'გემარა';
        const targetRect =
          multiWordAnchorRef.current?.getBoundingClientRect() ||
          e.currentTarget.getBoundingClientRect();
        setSelectedRange(null);
        setShowRangeHandles(false);
        onNavigateToCitation(
          detectedCitation.tractateId,
          detectedCitation.dafId,
          detectedCitation.citeHe,
          {
            fromPdfRowId: clickedHotspot.rowId,
            fromPdfSelectedRange: {
              startIdx: detectedCitation.startIdx,
              endIdx: detectedCitation.endIdx,
            },
            sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
            sourceLabelHe: detectedCitation.citeHe,
            contextSnippetHe: detectedCitation.contextSnippetHe,
            anchorRect: {
              top: targetRect.top,
              bottom: targetRect.bottom,
              left: targetRect.left,
              right: targetRect.right,
              width: targetRect.width,
              height: targetRect.height,
            },
          }
        );
        return;
      }
    }

    // Double tap on a word -> mark it and open its explanation window.
    // A single tap on ordinary text does nothing (taps are reserved for navigation).
    const now = Date.now();
    const last = lastWordTapRef.current;
    lastWordTapRef.current = { idx, time: now };
    if (last && last.idx === idx && now - last.time < 380) {
      lastWordTapRef.current = null;
      const range = detectedCitation
        ? { startIdx: detectedCitation.startIdx, endIdx: detectedCitation.endIdx }
        : { startIdx: idx, endIdx: idx };
      setShowRangeHandles(false);
      setSelectedRange(range);
      commitSelectionRange(range.startIdx, range.endIdx, true);
      return;
    }
    if (selectedRange && !showRangeHandles) {
      setSelectedRange(null);
    }
  };

  const startHandleDrag = (
    e: React.MouseEvent | React.TouchEvent,
    handleType: 'start-handle' | 'end-handle'
  ) => {
    e.stopPropagation();
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    if (!selectedRange) return;
    suppressNextClickRef.current = true;
    dragModeRef.current = handleType;
    dragAnchorIdxRef.current =
      handleType === 'start-handle' ? selectedRange.endIdx : selectedRange.startIdx;
    setIsDraggingSelection(true);
    if (typeof document !== 'undefined') {
      document.body.dataset.talmudWordSelecting = 'true';
    }
  };

  const isSingleSmallMarkerSelected =
    selectedHotspotsSlice.length === 1 && Boolean(selectedHotspotsSlice[0]?.isSmallMarker);

  // Nearest daf-reference word within a finger's reach of the tap (same row only).
  const resolveCitationTapIndex = (idx: number, x: number, y: number): number => {
    const spot = hotspots[idx];
    if (!spot || citationHotspotIdsSet.has(spot.id) || spot.isSmallMarker) return idx;
    const slop = 14;
    let best = idx;
    let bestDist = Infinity;
    for (let k = Math.max(0, idx - 4); k <= Math.min(hotspots.length - 1, idx + 4); k++) {
      const cand = hotspots[k];
      if (!cand || cand.rowId !== spot.rowId || !citationHotspotIdsSet.has(cand.id)) continue;
      const el = pageContainerRef.current?.querySelector(`[id="pdf-hotspot-${cand.id}"]`);
      if (!(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d <= slop && d < bestDist) {
        bestDist = d;
        best = k;
      }
    }
    return best;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {blinkingTarget?.originMarker && (
        <ReferenceOriginLabel container={pageContainerRef} label={blinkingTarget.labelKa} origin={blinkingTarget.originMarker} />
      )}
      {/* ORIGINAL VILNA DAF PDF CANVAS CONTAINER — NO ZOOM BUTTONS ON THE DAF AREA ITSELF */}
      <div className={`w-full flex justify-center ${isFullScreen ? 'w-full min-h-full p-0 m-0' : 'overflow-x-auto py-0'}`}>
        <div
          ref={pageContainerRef}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: '100%',
            maxWidth: isFullScreen ? '100%' : '960px',
            aspectRatio: `${pdfAspectRatio}`,
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          className={`relative select-none shadow-[0_14px_40px_rgba(0,0,0,0.42)] transition-all duration-200 ${
            isFullScreen ? 'rounded-none border-0 w-full p-0 m-0' : 'rounded-none sm:rounded-xl border overflow-hidden'
          } ${
            isDark
              ? 'bg-[#F4EAD5] border-[#C49A6C]/50'
              : 'bg-[#FBF6EA] border-[#8B5A2B]/35'
          }`}
        >
          {/* Loading Overlay */}
          {loadingPdf && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FBF6EA]/75 backdrop-blur-[1px]">
              <Loader2 className="w-7 h-7 animate-spin text-[#6B4226] mb-1.5" />
              <span className="text-xs font-extrabold text-[#3B2313]">
                იტვირთება ორიგინალური ვილნას დაფი...
              </span>
            </div>
          )}
          {!loadingPdf && pdfLoadFailed && (
            <div className="absolute inset-x-0 top-6 z-30 flex justify-center">
              <span className="rounded-full bg-[#FBF6EA]/90 px-3 py-1.5 text-xs font-extrabold text-[#3B2313] shadow">
                ამ დაფის სკანი ვერ ჩაიტვირთა — სცადეთ თავიდან
              </span>
            </div>
          )}

          {/* High-Resolution Original Vilna PDF Typography Canvas */}
          <canvas
            ref={canvasRef}
            className="block pointer-events-none w-full h-full"
            style={{
              filter: isDark
                ? 'sepia(0.18) contrast(1.06) brightness(0.95)'
                : 'contrast(1.05)',
            }}
          />

          {/* Independent Rashi / Tosafot reading lines — same sheer band style as the Gemara line */}
          {!loadingPdf &&
            commentaryLines.map((line) => (
              <div
                key={`commentary-line-${line.key}`}
                data-reading-line-section={line.key}
                style={{
                  left: `${Math.max(0.4, line.leftPct)}%`,
                  top: `${line.topPct}%`,
                  width: `${Math.min(99.2, line.widthPct)}%`,
                  height: `${line.heightPct}%`,
                  backgroundColor: 'rgba(212, 163, 115, 0.10)',
                  borderBottom: '1px solid rgba(139, 90, 43, 0.36)',
                }}
                className="absolute z-25 pointer-events-none rounded-[2px] transition-all duration-150 ease-out"
              />
            ))}

          {/* READING BOOKMARK LINE — LIGHT, HIGH-TRANSPARENCY BAND SPANNING FULL LINE + DELICATE HANDLE */}
          {!loadingPdf && hotspots.length > 0 && activeStoppedLine && (
            <div
              id="active-stopped-reading-line"
              data-reading-line-control="true"
              style={{
                left: `${Math.max(0.4, (mainLineBox || activeStoppedLine).leftPct)}%`,
                top: `${(mainLineBox || activeStoppedLine).topPct}%`,
                width: `${Math.min(99.2, (mainLineBox || activeStoppedLine).widthPct)}%`,
                height: `${(mainLineBox || activeStoppedLine).heightPct}%`,
              }}
              className={`absolute z-25 pointer-events-none transition-all ${
                isDraggingReadingLine ? 'duration-0' : 'duration-150 ease-out'
              }`}
            >
              {/* Sheer, High-Transparency Reading Line Highlight Band spanning 100% from start to end of the line */}
              <div
                style={{
                  backgroundColor: isDraggingReadingLine
                    ? 'rgba(212, 163, 115, 0.19)'
                    : 'rgba(212, 163, 115, 0.10)',
                  borderBottom: isDraggingReadingLine
                    ? '1.5px solid rgba(139, 90, 43, 0.62)'
                    : '1px solid rgba(139, 90, 43, 0.36)',
                }}
                className="w-full h-full rounded-[2px] pointer-events-none transition-colors"
              />
            </div>
          )}

          {/* BLINKING TARGET COMMENTARY / FOCUSED SOURCE SEGMENT BOX — CLEAN GLOWING FRAME WITHOUT INTRUSIVE MESSAGE BADGES */}
          {blinkingTarget && (
            <div
              id="active-blinking-marker-target"
              data-marker-navigation-target="true"
              style={{
                left: `${blinkingTarget.leftPct}%`,
                top: `${blinkingTarget.topPct}%`,
                width: `${blinkingTarget.widthPct}%`,
                height: `${blinkingTarget.heightPct}%`,
              }}
              className="absolute z-28 pointer-events-none"
            />
          )}

          {/* AUTOMATIC INTERLINEAR LINE TRANSLATION WINDOW — PORTAL FIXED, EXPANDS HORIZONTALLY TO MAXIMUM AVAILABLE WIDTH ACCORDING TO ITS TEXT, WITH INTERNAL 2-FINGER PINCH ZOOM */}
          {!loadingPdf &&
            autoTranslateLineMode &&
            activeStoppedLine &&
            activeLineTranslationTarget &&
            stoppedLineRect &&
            typeof document !== 'undefined' &&
            createPortal(
              (() => {
                const invScreenScale =
                  stoppedLineRect.vvScale > 1.01 ? 1 / stoppedLineRect.vvScale : 1;
                const fontPx = Number((10.5 * lineBoxZoom).toFixed(1));
                const activeCacheKey = activeLineTranslationTarget.cacheKey;
                const activeTranslatedText =
                  translatingRowId === activeCacheKey &&
                  !lineTranslationsCache[activeCacheKey]
                    ? 'ითარგმნება...'
                    : lineTranslationsCache[activeCacheKey] ||
                      lineTranslationsCache[activeStoppedLine.rowId] ||
                      activeStoppedLine.sentence.translationKa ||
                      '';

                // Expand horizontally as much as possible according to the text inside it (up to full viewport width - 8px)
                const maxScreenWidth = Math.max(
                  200,
                  Math.floor((stoppedLineRect.vw - 8) / invScreenScale)
                );
                const estimatedSingleLineWidth = Math.ceil(
                  activeTranslatedText.length * fontPx * 0.64 + 88
                );
                const minLineWidth = Math.min(
                  maxScreenWidth,
                  Math.max(160, Math.round(stoppedLineRect.width))
                );
                const dynamicBoxWidth = Math.min(
                  maxScreenWidth,
                  Math.max(minLineWidth, estimatedSingleLineWidth)
                );

                const visualWidthOnScreen = Math.round(dynamicBoxWidth * invScreenScale);
                const lineCenterX = stoppedLineRect.left + stoppedLineRect.width / 2;
                const clampedLeft = Math.max(
                  4,
                  Math.min(
                    stoppedLineRect.vw - visualWidthOnScreen - 4,
                    Math.round(lineCenterX - visualWidthOnScreen / 2)
                  )
                );
                const clampedTop = Math.max(
                  52,
                  Math.min(stoppedLineRect.vh - 64, stoppedLineRect.bottom + 3)
                );

                return (
                  <div
                    style={
                      isLineBoxMaximized
                        ? {
                            position: 'fixed',
                            inset: '12px',
                            zIndex: 275,
                            touchAction: 'none',
                          }
                        : {
                            position: 'fixed',
                            top: `${clampedTop}px`,
                            left: `${clampedLeft}px`,
                            width: `${dynamicBoxWidth}px`,
                            maxWidth: `${maxScreenWidth}px`,
                            zIndex: 260,
                            transform:
                              invScreenScale !== 1 ? `scale(${invScreenScale})` : undefined,
                            transformOrigin: 'top left',
                            touchAction: 'none',
                          }
                    }
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 2) {
                        const d = Math.hypot(
                          e.touches[1].clientX - e.touches[0].clientX,
                          e.touches[1].clientY - e.touches[0].clientY
                        );
                        lineBoxPinchRef.current = {
                          startDist: Math.max(18, d),
                          startZoom: lineBoxZoom,
                        };
                      }
                    }}
                    onTouchMove={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 2 && lineBoxPinchRef.current) {
                        e.preventDefault();
                        const d = Math.hypot(
                          e.touches[1].clientX - e.touches[0].clientX,
                          e.touches[1].clientY - e.touches[0].clientY
                        );
                        const ratio = d / lineBoxPinchRef.current.startDist;
                        const nextZoom = Number(
                          Math.max(
                            0.7,
                            Math.min(2.4, lineBoxPinchRef.current.startZoom * ratio)
                          ).toFixed(2)
                        );
                        setLineBoxZoom(nextZoom);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.touches.length < 2) {
                        lineBoxPinchRef.current = null;
                      }
                    }}
                    onWheel={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        setLineBoxZoom((z) =>
                          Number(Math.max(0.7, Math.min(2.4, z - e.deltaY * 0.006)).toFixed(2))
                        );
                      }
                    }}
                    className={`pointer-events-auto rounded-xl border px-2.5 py-1.5 shadow-[0_6px_20px_rgba(30,18,10,0.24)] backdrop-blur-xl transition-colors duration-150 ${
                      isLineBoxMaximized ? 'flex flex-col overflow-y-auto p-4' : ''
                    } ${
                      isDark
                        ? 'bg-[#1E140D]/92 border-[#C49A6C]/50 text-[#FAF5EB]'
                        : 'bg-[#FDF9F1]/94 border-[#A68256]/55 text-[#2B1B10]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Translated Georgian Line Text (scales with internal 2-finger pinch zoom) */}
                      {isLineBoxMinimized ? (
                        <div className="text-[10.5px] font-extrabold truncate flex-1 py-0.5">
                          სტრიქონის ავტო-თარგმანი (ჩაკეცილია)
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: `${isLineBoxMaximized ? Math.max(16, fontPx * 1.35) : fontPx}px`,
                            lineHeight: 1.35,
                          }}
                          className="font-semibold flex-1 min-w-0 break-words"
                        >
                          {activeLineTranslationTarget.hasExtraSelection && (
                            <span className="inline-block mr-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/45 text-[9px] font-extrabold text-amber-700 dark:text-amber-300 align-middle">
                              სტრიქონი + მონიშნული ({activeLineTranslationTarget.extraWordsCount})
                            </span>
                          )}
                          {translatingRowId === activeCacheKey &&
                          !lineTranslationsCache[activeCacheKey] ? (
                            <span className="inline-flex items-center gap-1 opacity-80">
                              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                              <span>ითარგმნება...</span>
                            </span>
                          ) : (
                            lineTranslationsCache[activeCacheKey] ||
                            lineTranslationsCache[activeStoppedLine.rowId] ||
                            activeStoppedLine.sentence.translationKa
                          )}
                        </div>
                      )}

                      {/* Crystal Windows Frame: Stepper Arrows (▲/▼) + Close ('✕') in one unified capsule */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5 select-none">
                        {Math.abs(lineBoxZoom - 1) > 0.05 && (
                          <div
                            role="button"
                            data-daf-word="true"
                            onClick={() => setLineBoxZoom(1)}
                            title="ზუმის საწყის ზომაზე დაბრუნება (100%)"
                            className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 cursor-pointer border border-amber-500/30"
                          >
                            {Math.round(lineBoxZoom * 100)}%
                          </div>
                        )}

                        {/* Unified Windows controls frame with up/down line arrows and single X close button */}
                        <div
                          dir="ltr"
                          data-daf-word="true"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            boxShadow: isDark
                              ? '0 2px 8px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.15)'
                              : '0 1px 4px rgba(60,38,20,0.15), inset 0 0.5px 0 rgba(255,255,255,0.85)',
                          }}
                          className={`inline-flex items-center rounded-lg border overflow-hidden backdrop-blur-md shrink-0 divide-x transition-all duration-150 ${
                            isDark
                              ? 'bg-[#1F150E]/95 border-[#C49A6C]/45 text-[#F3E5D0] divide-[#C49A6C]/30 shadow-md'
                              : 'bg-[#FFFDF9]/98 border-[#8B5A2B]/35 text-[#2C1A10] divide-stone-200 shadow-sm'
                          }`}
                        >
                          {/* Previous Line Arrow */}
                          <button
                            type="button"
                            data-daf-word="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepStoppedLine('prev');
                            }}
                            title="წინა სტრიქონზე გადასვლა"
                            aria-label="წინა სტრიქონი"
                            className="w-6 h-5.5 inline-flex items-center justify-center hover:bg-amber-500/20 active:scale-95 text-stone-700 dark:text-amber-200 transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* Next Line Arrow */}
                          <button
                            type="button"
                            data-daf-word="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepStoppedLine('next');
                            }}
                            title="შემდეგ სტრიქონზე გადასვლა"
                            aria-label="შემდეგი სტრიქონი"
                            className="w-6 h-5.5 inline-flex items-center justify-center hover:bg-amber-500/20 active:scale-95 text-stone-700 dark:text-amber-200 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* Single Windows Close 'X' Button */}
                          <button
                            type="button"
                            data-daf-word="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleAutoTranslateLineMode();
                            }}
                            title="ფანჯრის დახურვა"
                            aria-label="დახურვა"
                            className="w-6 h-5.5 inline-flex items-center justify-center hover:bg-rose-500/25 hover:text-rose-600 dark:hover:text-rose-300 active:scale-95 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })(),
              document.body
            )}

          {/* UNION BOUNDING ANCHOR FOR POPOVER POSITIONING & MULTI-WORD COPY/PASTE HANDLES */}
          {selectedUnionBoxPct && (
            <div
              ref={multiWordAnchorRef}
              data-active-talmud-word="true"
              style={{
                left: `${selectedUnionBoxPct.leftPct}%`,
                top: `${selectedUnionBoxPct.topPct}%`,
                width: `${selectedUnionBoxPct.widthPct}%`,
                height: `${selectedUnionBoxPct.heightPct}%`,
              }}
              className="absolute z-40 pointer-events-none"
            >
              {/* Requirement 4: Translucent Faceted Diamond Jump Button in overall design colors, rendered via fixed Portal so it is 100% independent of Daf/Screen Zoom */}
              {activeSelectedDafCitation && onNavigateToCitation && selectedUnionScreenRect && (
                <CrystalDiamondJumpButton
                  portalFixed={true}
                  anchorRect={selectedUnionScreenRect}
                  isDark={isDark}
                  labelKa={`${activeSelectedDafCitation.tractateNameKa} ${activeSelectedDafCitation.dafId}`}
                  labelHe={activeSelectedDafCitation.citeHe}
                  onClick={() => {
                    const savedRange = selectedRange;
                    const savedRect = selectedUnionScreenRect;
                    const anchorSpot =
                      hotspots[savedRange?.startIdx ?? 0] || hotspots[0];
                    const secLabelKa =
                      anchorSpot?.section === 'tosafot'
                        ? 'თოსაფოთი'
                        : anchorSpot?.section === 'rashi'
                          ? 'რაში'
                          : anchorSpot?.section === 'margin'
                            ? 'კიდის კომენტარი'
                            : 'გემარა';
                    // Immediately hide the jump button when clicked
                    setSelectedRange(null);
                    setShowRangeHandles(false);
                    onNavigateToCitation(
                      activeSelectedDafCitation.tractateId,
                      activeSelectedDafCitation.dafId,
                      activeSelectedDafCitation.citeHe,
                      {
                        fromPdfRowId: anchorSpot?.rowId || activeStoppedLine?.rowId || null,
                        fromPdfSelectedRange: savedRange,
                        sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${secLabelKa}`,
                        sourceLabelHe: activeSelectedDafCitation.citeHe,
                        contextSnippetHe: activeSelectedDafCitation.contextSnippetHe,
                        anchorRect: savedRect,
                      }
                    );
                  }}
                />
              )}

              {/* Requirement 4: Translucent Faceted Diamond Jump Button when a linked small commentary marker (like (א) -> הגהות הב"ח) is selected on the PDF */}
              {!activeSelectedDafCitation &&
                activeSelectedMarkerTarget &&
                selectedUnionScreenRect && (
                  <CrystalDiamondJumpButton
                    portalFixed={true}
                    anchorRect={selectedUnionScreenRect}
                    isDark={isDark}
                    labelKa={activeSelectedMarkerTarget.labelKa}
                    labelHe={activeSelectedMarkerTarget.labelHe}
                    onClick={() => {
                      const targetSpot = activeSelectedMarkerTarget.spot;
                      // Immediately hide the jump button when clicked
                      setSelectedRange(null);
                      setShowRangeHandles(false);
                      triggerJumpAndBlinkForMarker(targetSpot);
                    }}
                  />
                )}

              {/* Requirement 3: Only show the two draggable range-expansion balls after a 2nd-press long-press on the selected word (or when dragging multi-word range) */}
              {showRangeHandles &&
                !isSingleSmallMarkerSelected && (
                <>
                  {(['start-handle', 'end-handle'] as const).map((handleType) => {
                    const isStart = handleType === 'start-handle';
                    return (
                      <div
                        key={handleType}
                        onMouseDown={(e) => startHandleDrag(e, handleType)}
                        onTouchStart={(e) => startHandleDrag(e, handleType)}
                        title="გადასწიეთ რამდენიმე სიტყვის მოსანიშნად"
                        style={{
                          // Small water-drop handles hang just below the line so the letters stay visible.
                          [isStart ? 'right' : 'left']: 0,
                          top: '100%',
                          width: '28px',
                          height: '30px',
                          transform: `translateX(${isStart ? '50%' : '-50%'}) scale(${readingHandleInvScale})`,
                          transformOrigin: 'top center',
                          touchAction: 'none',
                        }}
                        className="pointer-events-auto absolute z-50 flex items-start justify-center cursor-ew-resize"
                      >
                        <span
                          aria-hidden
                          style={{
                            marginTop: '3px',
                            width: '11px',
                            height: '11px',
                            borderRadius: '0 50% 50% 50%',
                            transform: 'rotate(45deg)',
                            background: 'color-mix(in oklab, var(--color-amber-500, #d97706) 38%, transparent)',
                            border: '1px solid color-mix(in oklab, var(--color-amber-700, #b45309) 70%, transparent)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(1px)',
                          }}
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Transparent Interactive Single-Word, Multi-Word & Small-Marker Hotspots Overlay */}
          <div className="absolute inset-0 z-35 pointer-events-none">
            {hotspots.map((h, idx) => {
              const isSelected = selectedHotspotIdsSet.has(h.id);
              const isBlinkingWord = blinkingTarget?.hotspotIds.has(h.id) || false;
              const isMarkerOrCitation = h.isSmallMarker || citationHotspotIdsSet.has(h.id);

              // Royal Blue ink tinting is applied strictly on the letter glyphs on the canvas.
              // Markers and citation nodes remain 100% transparent without any background overlays masking surrounding characters.
              const bgStyle = isBlinkingWord
                ? 'var(--reference-target-highlight)'
                : isSelected
                  ? 'rgba(245, 168, 28, 0.25)'
                  : 'transparent';

              return (
                <div
                  key={h.id}
                  id={`pdf-hotspot-${h.id}`}
                  data-sentence-id={h.sentence?.id}
                  role="button"
                  tabIndex={-1}
                  data-daf-word="true"
                  data-reference-highlight={isBlinkingWord ? 'true' : undefined}
                  data-small-marker={h.isSmallMarker ? 'true' : undefined}
                  data-section={h.section}
                  data-row-id={h.rowId}
                  data-marker-type={h.markerTargetType}
                  data-marker-key={h.markerKey}
                  aria-label={h.word}
                  onMouseDown={(e) => {
                    if (h.isSmallMarker) {
                      suppressNextClickRef.current = false;
                      e.stopPropagation();
                      return;
                    }
                    handleWordPointerDown(idx, e.clientX, e.clientY, false);
                  }}
                  onMouseMove={(e) => handleWordMouseMove(e, idx)}
                  onMouseUp={clearLongPressTimer}
                  onTouchStart={(e) => {
                    if (h.isSmallMarker) {
                      suppressNextClickRef.current = false;
                      const touch = e.touches.length === 1 ? e.touches[0] : null;
                      markerTouchRef.current = touch ? { idx, x: touch.clientX, y: touch.clientY } : null;
                      e.stopPropagation();
                      return;
                    }
                    if (e.touches.length === 1) {
                      suppressNextClickRef.current = false;
                      handleWordPointerDown(
                        idx,
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                        true
                      );
                    } else {
                      clearLongPressTimer();
                      suppressNextClickRef.current = true;
                    }
                  }}
                  onTouchMove={(e) => {
                    if (h.isSmallMarker) {
                      const start = markerTouchRef.current;
                      const touch = e.touches[0];
                      if (!start || !touch || e.touches.length !== 1 || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 10) markerTouchRef.current = null;
                    } else handleWordTouchMove(e);
                  }}
                  onTouchEnd={(e) => {
                    const start = markerTouchRef.current;
                    markerTouchRef.current = null;
                    if (h.isSmallMarker && start?.idx === idx && e.touches.length === 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      clearLongPressTimer();
                      suppressNextClickRef.current = false;
                      lastMarkerTouchRef.current = Date.now();
                      setSelectedRange(null);
                      setShowRangeHandles(false);
                      if (!openBiblicalCitation(idx)) triggerJumpAndBlinkForMarker(h);
                    } else clearLongPressTimer();
                  }}
                  onTouchCancel={() => { markerTouchRef.current = null; clearLongPressTimer(); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (h.isSmallMarker && Date.now() - lastMarkerTouchRef.current < 700) return;
                    // Printed daf references are tiny; a finger landing just beside one still opens it.
                    const tapIdx = showRangeHandles ? idx : resolveCitationTapIndex(idx, e.clientX, e.clientY);
                    const tapSpot = hotspots[tapIdx] || h;
                    const isNavTap = citationHotspotIdsSet.has(tapSpot.id) || tapSpot.isSmallMarker;
                    if (
                      !isNavTap &&
                      !showRangeHandles &&
                      !suppressNextClickRef.current &&
                      document.body.dataset.talmudPanning !== 'true'
                    ) {
                      markReadingLineAt(h);
                    }
                    if (!isNavTap && !showRangeHandles && jumpToDibbur(h, e.clientX, (e.currentTarget as HTMLElement).getBoundingClientRect())) return;
                    handleWordClick(e, tapIdx);
                  }}
                  style={{
                    left: `${h.leftPct}%`,
                    top: `${h.topPct}%`,
                    width: `${h.widthPct}%`,
                    height: `${h.heightPct}%`,
                    zIndex: isBlinkingWord ? 55 : isMarkerOrCitation ? 55 : isSelected ? 48 : 22,
                    pointerEvents: 'auto',
                    backgroundColor: bgStyle,
                    mixBlendMode: 'normal',
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                  data-dibbur-link={dibburLinks.roles.has(h.id) ? 'true' : undefined}
                  className={`absolute p-0 m-0 rounded-none cursor-pointer transition-colors duration-150 pointer-events-auto select-none ${
                    isMarkerOrCitation ? 'talmud-blue-marker' : ''
                  }`}
                />
              );
            })}
          </div>

          {/* Floating Action Bar (Copy & Explain) for Selected Range */}
          {typeof document !== 'undefined' &&
            selectedUnionScreenRect &&
            selectedRange &&
            showRangeHandles &&
            !isDraggingSelection &&
            !isSingleSmallMarkerSelected &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: `${Math.max(12, Math.min(window.innerWidth - 272, selectedUnionScreenRect.left + selectedUnionScreenRect.width / 2 - 130))}px`,
                  top: `${selectedUnionScreenRect.bottom + 84 < window.innerHeight ? selectedUnionScreenRect.bottom + 40 : Math.max(8, selectedUnionScreenRect.top - 46)}px`,
                  zIndex: 9999,
                }}
                className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-900/95 dark:bg-[#1C120C]/95 text-stone-100 border border-amber-500/50 shadow-2xl backdrop-blur-md select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCopySelectedText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 font-bold text-xs transition-colors cursor-pointer active:scale-95"
                  title="მონიშნული ტექსტის კოპირება"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>კოპირება</span>
                </button>
                <div className="w-[1px] h-4 bg-white/20" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRangeHandles(false);
                    commitSelectionRange(selectedRange.startIdx, selectedRange.endIdx, true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 font-bold text-xs transition-colors cursor-pointer active:scale-95"
                  title="მონიშნული ტექსტის ახსნა"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>განმარტება</span>
                </button>
                <div className="w-[1px] h-4 bg-white/20" />
                <button
                  type="button"
                  aria-label="მონიშვნის გაუქმება"
                  title="მონიშვნის გაუქმება"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRangeHandles(false);
                    setSelectedRange(null);
                    lastWordTapRef.current = null;
                    if (typeof document !== 'undefined') delete document.body.dataset.talmudWordSelecting;
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-300 hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>,
              document.body
            )}

          {biblicalCitation && <BiblicalVerseWindow citation={biblicalCitation} onClose={() => setBiblicalCitation(null)} />}

          {/* Copy Confirmation Toast */}
          {typeof document !== 'undefined' &&
            copyToastText &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  bottom: '84px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10000,
                }}
                className="pointer-events-none px-4 py-2 rounded-full bg-emerald-900/95 text-emerald-100 border border-emerald-400/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{copyToastText}</span>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
};
