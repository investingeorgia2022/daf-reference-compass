// @ts-nocheck
import {
  DafPageData,
  MasoretRef,
  SefariaCommentaryItem,
  TalmudSentence,
  TractateInfo,
} from '../types/talmud';
import {
  getCuratedOrDynamicDaf,
  getInitialActiveMishnahForTractate,
} from '../data/curatedDapim';
import {
  getBuiltinSefariaCommentaries,
  mapSefariaCommentatorMeta,
} from '../data/sefariaCommentators';
import { translateToGeorgianLive } from './georgianTranslator';
import { validateOfflineBackup } from './offlineBackupValidation';

const DB_NAME = 'talmud_bavli_offline_db_v1';
const DB_VERSION = 1;
const STORE_DAPIM = 'dapim';
export const WORKBOX_SEFARIA_CACHE = 'talmud-sefaria-texts-cache';
export const WORKBOX_TRANSLATION_CACHE = 'talmud-translations-cache';

export interface CachedDafRecord {
  key: string; // "${tractateId}:${dafId}"
  tractateId: string;
  dafId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  dafData: DafPageData;
  savedAt: number;
  sizeBytes: number;
  source: 'viewed' | 'pack-download' | 'manual';
   includeTranslations: boolean;
}

export interface CachedDafSummary {
  key: string;
  tractateId: string;
  dafId: string;
  tractateNameHe: string;
  tractateNameKa: string;
  savedAt: number;
  sizeBytes: number;
  source: 'viewed' | 'pack-download' | 'manual';
  mishnahCount: number;
  gemaraCount: number;
  rashiCount: number;
  tosafotCount: number;
  commentariesCount: number;
}

export interface OfflineStorageStats {
  items: CachedDafSummary[];
  byTractate: Record<string, CachedDafSummary[]>;
  totalDapimCount: number;
  totalSizeBytes: number;
  workboxSefariaCount: number;
  workboxTranslationsCount: number;
}

export interface PackDownloadProgress {
  tractateId: string;
  tractateNameKa: string;
  currentDafId: string;
  completedDapim: number;
  totalDapim: number;
  percent: number;
  statusText: string;
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DAPIM)) {
        const store = db.createObjectStore(STORE_DAPIM, { keyPath: 'key' });
        store.createIndex('by_tractate', 'tractateId', { unique: false });
        store.createIndex('by_savedAt', 'savedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notifyOfflineStorageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('talmud-offline-updated'));
  }
}

export async function saveDafToOfflineStorage(
  dafData: DafPageData,
  source: 'viewed' | 'pack-download' | 'manual' = 'viewed'
): Promise<void> {
  try {
    const db = await openOfflineDB();
    const key = `${dafData.tractateId}:${dafData.dafId}`;
    const serialized = JSON.stringify(dafData);
    const sizeBytes = new Blob([serialized]).size;

    // Preserve 'pack-download' or 'manual' badge if already saved via pack
    const existing = await getDafFromOfflineStorage(dafData.tractateId, dafData.dafId);
    const finalSource =
      source === 'viewed' && existing && existing.source !== 'viewed'
        ? existing.source
        : source;

    const record: CachedDafRecord = {
      key,
      tractateId: dafData.tractateId,
      dafId: dafData.dafId,
      tractateNameHe: dafData.tractateNameHe || dafData.tractateId,
      tractateNameKa: dafData.tractateNameKa || dafData.tractateId,
      dafData,
      savedAt: Date.now(),
      sizeBytes,
      source: finalSource,
      includeTranslations: true,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readwrite');
      const store = tx.objectStore(STORE_DAPIM);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    notifyOfflineStorageChanged();
  } catch {
    // Fallback ignored if storage quota or private mode
  }
}

export async function getDafFromOfflineStorage(
  tractateId: string,
  dafId: string
): Promise<CachedDafRecord | null> {
  try {
    const db = await openOfflineDB();
    const key = `${tractateId}:${dafId}`;
    const result = await new Promise<CachedDafRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readonly');
      const store = tx.objectStore(STORE_DAPIM);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as CachedDafRecord) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (
      result &&
      result.dafData &&
      (result.dafData.tractateId !== tractateId ||
        result.dafData.dafId !== dafId ||
        (tractateId !== 'Taanit' &&
          result.dafData.gemara?.[0]?.id?.startsWith('taanit-2a')))
    ) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export async function getAllOfflineStorageStats(): Promise<OfflineStorageStats> {
  const items: CachedDafSummary[] = [];
  const byTractate: Record<string, CachedDafSummary[]> = {};
  let totalSizeBytes = 0;

  try {
    const db = await openOfflineDB();
    const allRecords = await new Promise<CachedDafRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readonly');
      const store = tx.objectStore(STORE_DAPIM);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CachedDafRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();

    for (const rec of allRecords) {
      const summary: CachedDafSummary = {
        key: rec.key,
        tractateId: rec.tractateId,
        dafId: rec.dafId,
        tractateNameHe: rec.tractateNameHe,
        tractateNameKa: rec.tractateNameKa,
        savedAt: rec.savedAt,
        sizeBytes: rec.sizeBytes || 18400,
        source: rec.source || 'viewed',
        mishnahCount: rec.dafData?.mishnah?.length || 0,
        gemaraCount: rec.dafData?.gemara?.length || 0,
        rashiCount: rec.dafData?.rashi?.length || 0,
        tosafotCount: rec.dafData?.tosafot?.length || 0,
        commentariesCount: rec.dafData?.allCommentaries?.length || 0,
      };
      items.push(summary);
      totalSizeBytes += summary.sizeBytes;
      if (!byTractate[rec.tractateId]) {
        byTractate[rec.tractateId] = [];
      }
      byTractate[rec.tractateId].push(summary);
    }
  } catch {
    // ignore
  }

  items.sort((a, b) => b.savedAt - a.savedAt);

  let workboxSefariaCount = 0;
  let workboxTranslationsCount = 0;

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const sefCache = await window.caches.open(WORKBOX_SEFARIA_CACHE);
      const sefKeys = await sefCache.keys();
      workboxSefariaCount = sefKeys.length;
    } catch {
      // ignore
    }
    try {
      const trCache = await window.caches.open(WORKBOX_TRANSLATION_CACHE);
      const trKeys = await trCache.keys();
      workboxTranslationsCount = trKeys.length;
    } catch {
      // ignore
    }
  }

  return {
    items,
    byTractate,
    totalDapimCount: items.length,
    totalSizeBytes,
    workboxSefariaCount,
    workboxTranslationsCount,
  };
}

export async function deleteOfflineDaf(tractateId: string, dafId: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    const key = `${tractateId}:${dafId}`;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readwrite');
      const store = tx.objectStore(STORE_DAPIM);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    notifyOfflineStorageChanged();
  } catch {
    // ignore
  }
}

export async function deleteOfflineTractate(tractateId: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readwrite');
      const store = tx.objectStore(STORE_DAPIM);
      const index = store.index('by_tractate');
      const req = index.openCursor(IDBKeyRange.only(tractateId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    notifyOfflineStorageChanged();
  } catch {
    // ignore
  }
}

export async function clearAllOfflineStorage(): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readwrite');
      const store = tx.objectStore(STORE_DAPIM);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    if (typeof window !== 'undefined' && 'caches' in window) {
      await window.caches.delete(WORKBOX_SEFARIA_CACHE);
      await window.caches.delete(WORKBOX_TRANSLATION_CACHE);
    }
    notifyOfflineStorageChanged();
  } catch {
    // ignore
  }
}

/**
 * Automatically prunes stale or corrupted 'viewed' cache records from IndexedDB
 * and trims oversized Workbox caches so IndexedDB queries never bottleneck 3D Daf rendering.
 */
export async function pruneStaleOfflineCache(
  maxAgeMs: number = 1000 * 60 * 60 * 24 * 7,
  maxViewedEntries: number = 45
): Promise<number> {
  let removedCount = 0;
  try {
    const db = await openOfflineDB();
    const allRecords = await new Promise<CachedDafRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_DAPIM, 'readonly');
      const store = tx.objectStore(STORE_DAPIM);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CachedDafRecord[]) || []);
      req.onerror = () => reject(req.error);
    });

    const now = Date.now();
    const viewedRecords = allRecords
      .filter((r) => !r.source || r.source === 'viewed')
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    const keysToDelete: string[] = [];

    for (const rec of allRecords) {
      if (
        !rec.dafData ||
        !rec.key ||
        rec.dafData.tractateId !== rec.tractateId ||
        rec.dafData.dafId !== rec.dafId
      ) {
        if (rec.key) keysToDelete.push(rec.key);
      }
    }

    viewedRecords.forEach((rec, index) => {
      const isExpired = now - (rec.savedAt || 0) > maxAgeMs;
      const isOverCap = index >= maxViewedEntries;
      if ((isExpired || isOverCap) && !keysToDelete.includes(rec.key)) {
        keysToDelete.push(rec.key);
      }
    });

    if (keysToDelete.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DAPIM, 'readwrite');
        const store = tx.objectStore(STORE_DAPIM);
        for (const k of keysToDelete) {
          store.delete(k);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      removedCount = keysToDelete.length;
    }
    db.close();

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const trCache = await window.caches.open(WORKBOX_TRANSLATION_CACHE);
        const trKeys = await trCache.keys();
        if (trKeys.length > 180) {
          const toEvict = trKeys.slice(0, trKeys.length - 120);
          await Promise.all(toEvict.map((req) => trCache.delete(req)));
        }
      } catch {
        // ignore
      }
    }

    if (removedCount > 0) {
      notifyOfflineStorageChanged();
    }
  } catch {
    // ignore
  }
  return removedCount;
}

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenSefariaArray(input: unknown): string[] {
  if (!input) return [];
  if (typeof input === 'string') {
    const cleaned = stripHtmlTags(input);
    return cleaned ? [cleaned] : [];
  }
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      out.push(...flattenSefariaArray(item));
    }
    return out;
  }
  return [];
}

/**
 * Downloads and caches a single Daf from Sefaria into both Workbox CacheStorage
 * and IndexedDB (`talmud_bavli_offline_db_v1`), with Georgian translations & commentaries.
 */
export async function downloadAndCacheDafOffline(
  tractate: TractateInfo,
  dafId: string,
  options?: {
    translateGeorgian?: boolean;
    source?: 'pack-download' | 'manual';
  }
): Promise<DafPageData> {
  const translateGeorgian = options?.translateGeorgian ?? true;
  const sourceType = options?.source ?? 'pack-download';

  const baseData = getCuratedOrDynamicDaf(
    tractate.id,
    dafId,
    tractate.nameHe,
    tractate.nameKa
  );
  const builtinComms = getBuiltinSefariaCommentaries(tractate.id, dafId);

  const ref = `${tractate.id}.${dafId}`;
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(
    ref
  )}?commentary=1&context=1`;

  try {
    let response: Response | undefined;
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await window.caches.open(WORKBOX_SEFARIA_CACHE);
      const cachedResp = await cache.match(url);
      if (cachedResp) {
        response = cachedResp;
      } else {
        const netResp = await fetch(url);
        if (netResp.ok) {
          await cache.put(url, netResp.clone());
          response = netResp;
        }
      }
    } else {
      const netResp = await fetch(url);
      if (netResp.ok) {
        response = netResp;
      }
    }

    if (!response || !response.ok) {
      const fallbackDaf: DafPageData = {
        ...baseData,
        allCommentaries:
          baseData.allCommentaries && baseData.allCommentaries.length > 0
            ? baseData.allCommentaries
            : builtinComms,
      };
      await saveDafToOfflineStorage(fallbackDaf, sourceType);
      return fallbackDaf;
    }

    const json = await response.json();
    const rawLinks: Record<string, unknown>[] = Array.isArray(json.commentary)
      ? json.commentary
      : [];

    const extractedCommentaries: SefariaCommentaryItem[] = [];
    const seenCommentaries = new Set<string>();

    for (let idx = 0; idx < rawLinks.length; idx++) {
      const item = rawLinks[idx];
      const heText = flattenSefariaArray(item.he).join(' ');
      const enText = flattenSefariaArray(item.text).join(' ');
      if (!heText && !enText) continue;

      const rawTitleEn = String(
        item.collectiveTitle && typeof item.collectiveTitle === 'object'
          ? (item.collectiveTitle as Record<string, unknown>).en ||
              item.index_title ||
              'Commentator'
          : item.index_title || item.type || 'Commentator'
      );
      const rawTitleHe = String(
        item.collectiveTitle && typeof item.collectiveTitle === 'object'
          ? (item.collectiveTitle as Record<string, unknown>).he || rawTitleEn
          : rawTitleEn
      );
      const rawCat = String(item.category || item.type || 'Commentary');
      const refStr = String(item.ref || item.sourceRef || `${rawTitleEn}-${idx}`);
      if (seenCommentaries.has(refStr)) continue;
      seenCommentaries.add(refStr);

      const mappedMeta = mapSefariaCommentatorMeta(rawTitleEn, rawTitleHe, rawCat);

      extractedCommentaries.push({
        id: `sef-comm-${idx}`,
        commentatorEn: rawTitleEn,
        commentatorHe: mappedMeta.he,
        commentatorKa: mappedMeta.ka,
        category: rawCat,
        categoryKa: mappedMeta.categoryKa,
        ref: refStr,
        heRef: String(item.heRef || item.sourceHeRef || refStr),
        anchorText: item.anchorText ? stripHtmlTags(String(item.anchorText)) : undefined,
        anchorVerse: typeof item.anchorVerse === 'number' ? item.anchorVerse : undefined,
        he: heText || enText,
        en: enText,
        translationKa: '',
      });

      if (extractedCommentaries.length >= 140) break;
    }

    const mergedCommentaries = [
      ...builtinComms,
      ...extractedCommentaries.filter(
        (ext) =>
          !builtinComms.some(
            (b) =>
              b.commentatorHe === ext.commentatorHe &&
              b.he.slice(0, 25) === ext.he.slice(0, 25)
          )
      ),
    ];

    const heSegments = flattenSefariaArray(json.he).slice(0, 14);
    const enSegments = flattenSefariaArray(json.text).slice(0, 14);

    if (heSegments.length === 0) {
      const fallbackDaf: DafPageData = {
        ...baseData,
        allCommentaries: mergedCommentaries,
      };
      await saveDafToOfflineStorage(fallbackDaf, sourceType);
      return fallbackDaf;
    }

    const isFirstDaf2a = dafId === '2a';
    const mishnahSegs = isFirstDaf2a ? heSegments.slice(0, 1) : [];
    const gemaraSegs = isFirstDaf2a ? heSegments.slice(1) : heSegments;

    const finalMishnah: TalmudSentence[] =
      mishnahSegs.length > 0
        ? await Promise.all(
            mishnahSegs.map(async (he, idx) => {
              const en = enSegments[idx] || '';
              const ka = translateGeorgian
                ? await translateToGeorgianLive(en || he, en ? 'en' : 'iw')
                : '';
              return {
                id: `${tractate.id}-${dafId}-m-${idx + 1}`,
                source: 'mishnah' as const,
                hebrewText: he,
                translationHe: he,
                translationKa:
                  ka || `მიშნა (${tractate.nameKa} ${dafId}, მონაკვეთი ${idx + 1}).`,
                explanationKa: `მიშნა (${tractate.nameKa} ${dafId}): ${
                  ka || tractate.descriptionKa
                }`,
                explanationHe: `משנה בדף ${dafId} במסכת ${tractate.nameHe}.`,
                sugyaStage: {
                  type: 'mishnah' as const,
                  labelHe: 'מתני׳ • משנה',
                  labelKa: 'მიშნა (დაფის დასაწყისი)',
                },
              };
            })
          )
        : getInitialActiveMishnahForTractate(tractate.id);

    const finalGemara: TalmudSentence[] = await Promise.all(
      gemaraSegs.map(async (he, idx) => {
        const enIdx = isFirstDaf2a ? idx + 1 : idx;
        const en = enSegments[enIdx] || '';
        const ka = translateGeorgian
          ? await translateToGeorgianLive(en || he, en ? 'en' : 'iw')
          : '';
        return {
          id: `${tractate.id}-${dafId}-g-${idx + 1}`,
          source: 'gemara' as const,
          hebrewText: he,
          translationHe: he,
          translationKa:
            ka || `გემარის სუგია (${tractate.nameKa} ${dafId}, მონაკვეთი ${idx + 1}).`,
          explanationKa: `გემარის სუგია (${tractate.nameKa} ${dafId}): ${ka || he}`,
          explanationHe: `סוגיית הגמרא בדף ${dafId} (קטע ${idx + 1}).`,
          sugyaStage: {
            type: idx % 2 === 0 ? ('question' as const) : ('answer' as const),
            labelHe: idx % 2 === 0 ? 'שקלא וטריא' : 'תירוץ הגמרא',
            labelKa: idx % 2 === 0 ? 'სუგიის განხილვა' : 'გემარის განმარტება',
          },
        };
      })
    );

    const allRashiLinks = extractedCommentaries
      .filter(
        (c) =>
          c.commentatorEn.toLowerCase().includes('rashi') ||
          c.commentatorHe.includes('רש"י') ||
          c.commentatorHe.includes('רש״י')
      )
      .slice(0, 18);

    const allTosafotLinks = extractedCommentaries
      .filter(
        (c) =>
          c.commentatorEn.toLowerCase().includes('tosafot') ||
          c.commentatorHe.includes('תוספות')
      )
      .slice(0, 12);

    const rashiItems: TalmudSentence[] =
      allRashiLinks.length > 0
        ? await Promise.all(
            allRashiLinks.map(async (r, idx) => {
              const splitParts = r.he.split(/[-–:]/);
              const dibbur =
                splitParts.length > 1
                  ? splitParts[0].trim()
                  : r.he.split(' ').slice(0, 3).join(' ');
              const body =
                splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : r.he;
              const ka =
                translateGeorgian && idx < 8
                  ? await translateToGeorgianLive(r.en || r.he, r.en ? 'en' : 'iw')
                  : '';
              return {
                id: `${tractate.id}-${dafId}-r-${idx + 1}`,
                source: 'rashi' as const,
                dibburHamatchil: dibbur,
                hebrewText: body,
                translationHe: r.he,
                translationKa:
                  ka || 'რაშის კლასიკური განმარტება გემარის მოცემულ სტრიქონზე.',
                explanationKa: `რაშის განმარტება (${r.heRef || r.ref}): ${ka || r.he}`,
                explanationHe: `פירוש רש"י על הסוגיה בדף ${dafId}.`,
              };
            })
          )
        : baseData.rashi;

    const tosafotItems: TalmudSentence[] =
      allTosafotLinks.length > 0
        ? await Promise.all(
            allTosafotLinks.map(async (t, idx) => {
              const splitParts = t.he.split(/[-–:]/);
              const dibbur =
                splitParts.length > 1
                  ? splitParts[0].trim()
                  : t.he.split(' ').slice(0, 4).join(' ');
              const body =
                splitParts.length > 1 ? splitParts.slice(1).join(' ').trim() : t.he;
              const ka =
                translateGeorgian && idx < 6
                  ? await translateToGeorgianLive(t.en || t.he, t.en ? 'en' : 'iw')
                  : '';
              return {
                id: `${tractate.id}-${dafId}-t-${idx + 1}`,
                source: 'tosafot' as const,
                dibburHamatchil: dibbur,
                hebrewText: body,
                translationHe: t.he,
                translationKa:
                  ka || 'თოსაფოთის შედარებითი ანალიზი და კითხვა-პასუხი.',
                explanationKa: `თოსაფოთის დიალექტიკური განმარტება (${t.heRef || t.ref}): ${
                  ka || t.he
                }`,
                explanationHe: `חידושי התוספות על הסוגיה בדף ${dafId}.`,
              };
            })
          )
        : baseData.tosafot;

    const masoretLinks = extractedCommentaries
      .filter(
        (c) =>
          c.category.toLowerCase().includes('talmud') ||
          c.category.toLowerCase().includes('tanakh')
      )
      .slice(0, 4);

    const masoretItems: MasoretRef[] =
      masoretLinks.length > 0
        ? masoretLinks.map((m, idx) => ({
            id: `mas-pack-${idx}`,
            marker: ['א', 'ב', 'ג', 'ד'][idx] || 'א',
            refHe: m.heRef,
            refKa: `${m.commentatorKa} (${m.ref})`,
          }))
        : baseData.masoretHaShas;

    const fullDaf: DafPageData = {
      ...baseData,
      openingWordHe: heSegments[0]?.split(' ')[0] || baseData.openingWordHe,
      mishnah: finalMishnah,
      gemara: finalGemara.length > 0 ? finalGemara : baseData.gemara,
      rashi: rashiItems,
      tosafot: tosafotItems,
      masoretHaShas: masoretItems,
      allCommentaries: mergedCommentaries,
    };

    await saveDafToOfflineStorage(fullDaf, sourceType);
    return fullDaf;
  } catch {
    const fallbackDaf: DafPageData = {
      ...baseData,
      allCommentaries:
        baseData.allCommentaries && baseData.allCommentaries.length > 0
          ? baseData.allCommentaries
          : builtinComms,
    };
    await saveDafToOfflineStorage(fallbackDaf, sourceType);
    return fallbackDaf;
  }
}

/**
 * Downloads a batch of Dapim for a Tractate (or full Tractate pack) with progress callback and AbortSignal support.
 */
export async function downloadTractateOfflinePack(params: {
  tractate: TractateInfo;
  dafIds: string[];
  translateGeorgian?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: PackDownloadProgress) => void;
}): Promise<{ downloadedCount: number; aborted: boolean }> {
  const { tractate, dafIds, translateGeorgian = true, signal, onProgress } = params;
  let downloadedCount = 0;

  for (let i = 0; i < dafIds.length; i++) {
    if (signal?.aborted) {
      return { downloadedCount, aborted: true };
    }
    const dafId = dafIds[i];
    const percent = Math.round(((i + 1) / dafIds.length) * 100);

    onProgress?.({
      tractateId: tractate.id,
      tractateNameKa: tractate.nameKa,
      currentDafId: dafId,
      completedDapim: i,
      totalDapim: dafIds.length,
      percent,
      statusText: `იტვირთება ${tractate.nameKa} (${tractate.nameHe}) • დაფი ${dafId}...`,
    });

    // Check if already cached via pack-download to speed up resumes
    const existing = await getDafFromOfflineStorage(tractate.id, dafId);
    if (!existing || existing.dafData.gemara.length <= 1 || (translateGeorgian && !existing.includeTranslations)) {
      await downloadAndCacheDafOffline(tractate, dafId, {
        translateGeorgian,
        source: 'pack-download',
      });
    }
    downloadedCount++;

    onProgress?.({
      tractateId: tractate.id,
      tractateNameKa: tractate.nameKa,
      currentDafId: dafId,
      completedDapim: i + 1,
      totalDapim: dafIds.length,
      percent,
      statusText: `შენახულია ${tractate.nameKa} • დაფი ${dafId} (${i + 1}/${dafIds.length})`,
    });
  }

  return { downloadedCount, aborted: false };
}

export async function exportOfflineLibraryBackup(): Promise<string> {
  const db = await openOfflineDB();
  const allRecords = await new Promise<CachedDafRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_DAPIM, 'readonly');
    const store = tx.objectStore(STORE_DAPIM);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as CachedDafRecord[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'Talmud Bavli 3D Offline Library',
      count: allRecords.length,
      records: allRecords,
    },
    null,
    2
  );
}

export async function importOfflineLibraryBackup(jsonString: string): Promise<number> {
  const records = validateOfflineBackup(JSON.parse(jsonString));
  if (records.length === 0) return 0;

  const db = await openOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DAPIM, 'readwrite');
    const store = tx.objectStore(STORE_DAPIM);
    for (const rec of records) store.put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('შენახვა შეწყდა'));
  });
  db.close();
  notifyOfflineStorageChanged();
  return records.length;
}

export function formatBytesKa(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
