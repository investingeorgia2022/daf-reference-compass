export type TalmudSourceType =
  | 'mishnah'
  | 'gemara'
  | 'rashi'
  | 'tosafot'
  | 'chavruta'
  | 'meforshim';

export type AnalysisMode =
  | 'word-he'
  | 'word-ka'
  | 'word-explain'
  | 'sentence-he'
  | 'sentence-ka'
  | 'sentence-explain'
  | 'source-lookup'
  | 'all-commentaries'
  | 'peshat';

export type AppTheme =
  | 'sanctuary-3d'
  | 'parchment-day'
  | 'jerusalem-stone'
  | 'royal-sapphire'
  | 'celestial-slate';
export type UILang = 'ka' | 'he' | 'en' | 'ru' | 'fr' | 'es' | 'de';

export interface RecentlyViewedDaf {
  tractateId: string;
  dafId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  timestamp: number;
}

export type AppCurrency = 'ILS' | 'USD' | 'EUR' | 'GEL';

export interface AppSettings {
  defaultShowAboveDaf: boolean;
  defaultShowBelowDaf: boolean;
  uiLang: UILang;
  defaultCurrency?: AppCurrency;
  dafFontSizeScale?: number;
  showNikudByDefault?: boolean;
  showAboveDafByDefault?: boolean;
  showBelowDafByDefault?: boolean;
  showChavrutaOnDaf?: boolean;
  defaultLang?: UILang;
}

export interface SederInfo {
  id: string;
  nameHe: string;
  nameKa: string;
  nameEn: string;
}

export interface TractateInfo {
  id: string;
  sederId: string;
  sederHe?: string;
  sederKa?: string;
  sederEn?: string;
  nameHe: string;
  nameKa: string;
  nameEn: string;
  chapters: number;
  lastDaf: number;
  descriptionKa: string;
  descriptionHe?: string;
}

export interface SugyaLogicStage {
  type:
    | 'mishnah'
    | 'question'
    | 'answer'
    | 'proof'
    | 'refutation'
    | 'resolution'
    | 'halacha'
    | 'reayah'
    | 'maskana'
    | 'kushya'
    | 'terutz'
    | 'pircha'
    | 'aggadah';
  labelHe: string;
  labelKa: string;
}

export interface SourceLookupResult {
  sourceCategoryHe: string;
  sourceCategoryKa: string;
  citationHe: string;
  citationKa: string;
  fullOriginalTextHe: string;
  fullTextTranslationHe: string;
  fullTextTranslationKa: string;
  contextAndDerashaKa: string;
  contextAndDerashaHe: string;
  parallelRefs: string[];
}

export interface SefariaCommentaryItem {
  id: string;
  commentatorEn: string;
  commentatorHe: string;
  commentatorKa: string;
  category: string;
  categoryKa: string;
  ref: string;
  heRef: string;
  anchorText?: string;
  anchorVerse?: number;
  he: string;
  en: string;
  translationKa?: string;
  explanationKa?: string;
}

export interface TalmudSentence {
  id: string;
  source: TalmudSourceType;
  dibburHamatchil?: string;
  commentatorNameHe?: string;
  commentatorNameKa?: string;
  hebrew?: string;
  hebrewText?: string;
  translationHe?: string;
  translationKa: string;
  explanationKa: string;
  explanationHe?: string;
  sugyaStage?: SugyaLogicStage;
  sourceDetails?: SourceLookupResult;
  sagesMentioned?: string[];
  masoretRef?: string;
  einMishpatRef?: string;
}

export interface MasoretRef {
  id: string;
  marker: string;
  refHe: string;
  refKa: string;
  hebrewText?: string;
  dibburHamatchil?: string;
}

export interface EinMishpatRef {
  id: string;
  marker: string;
  halachaHe: string;
  halachaKa: string;
  hebrewText?: string;
  dibburHamatchil?: string;
}

export interface DafPageData {
  tractateId: string;
  tractateNameHe?: string;
  tractateNameKa?: string;
  dafId: string;
  dafNumberHe: string;
  amudHe: string;
  amudKa?: string;
  chapterNumHe?: string;
  chapterNameHe?: string;
  chapterNameKa?: string;
  perekNumber?: number;
  perekNameHe?: string;
  perekNameKa?: string;
  sugyaTitleKa?: string;
  sugyaTitleHe?: string;
  sugyaSummaryKa?: string;
  openingWordHe?: string;
  mishnah: TalmudSentence[];
  gemara: TalmudSentence[];
  rashi: TalmudSentence[];
  tosafot: TalmudSentence[];
  chavruta?: TalmudSentence[];
  meforshim?: TalmudSentence[];
  torahOr?: TalmudSentence[];
  masoretHaShas: MasoretRef[];
  einMishpat: EinMishpatRef[];
  allCommentaries?: SefariaCommentaryItem[];
}

export interface LexiconEntry {
  wordHe: string;
  vocalizedHe: string;
  translitKa: string;
  translationHe: string;
  translationKa: string;
  rootAndGrammar: string;
  explanationKa: string;
  explanationHe: string;
}

export interface AramaicTermCard {
  termHe: string;
  translitKa: string;
  meaningHe: string;
  meaningKa: string;
  category: 'question' | 'proof' | 'structure' | 'resolution' | 'source';
  usageKa?: string;
}

export interface SageBio {
  nameHe: string;
  nameKa: string;
  era?: string;
  academy?: string;
  titleKa?: string;
  eraHe?: string;
  eraKa?: string;
  generationKa?: string;
  bioKa: string;
  keyTeachingsKa?: string;
}

export interface ScholarNote {
  id: string;
  tractateId: string;
  dafId: string;
  sentenceId: string;
  word: string;
  hebrewSnippet: string;
  noteText: string;
  createdAt: string;
}

export interface SelectedDafTarget {
  word: string;
  cleanWord: string;
  sentence: TalmudSentence;
  rect: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
  };
}

export interface WordSentenceAnalysisResult {
  wordTranslationHebrew: string;
  wordTranslationGeorgian: string;
  wordTransliterationGeorgian: string;
  wordRootAndGrammar: string;
  wordExplanationGeorgian: string;
  wordExplanationHebrew: string;
  sentenceTranslationHebrew: string;
  sentenceTranslationGeorgian: string;
  sentenceExplanationGeorgian: string;
  sentenceExplanationHebrew: string;
  sugyaRole: string;
  sourceDetails?: SourceLookupResult;
}

export interface CitationReturnPoint {
  id: string;
  fromRealm: string;
  fromTractateId: string;
  fromTractateNameKa: string;
  fromTractateNameHe: string;
  fromDafId: string;
  fromBookId?: string;
  fromBookNameKa?: string;
  fromBookNameHe?: string;
  fromChapter?: number;
  fromSectionId?: string | null;
  fromSentenceId?: string | null;
  fromElementId?: string | null;
  fromPdfRowId?: string | null;
  fromPdfSelectedRange?: { startIdx: number; endIdx: number } | null;
  fromWindowScrollY: number;
  sourceLabelKa: string;
  sourceLabelHe?: string;
  targetLabelKa?: string;
  timestamp: number;
}

