/**
 * Local scan cache for already-downloaded dafim.
 *
 * The Vilna scan itself is fetched from shas.org through the server proxy on every
 * daf open (the service worker deliberately never caches /api/). Storing the bytes
 * in IndexedDB makes a previously opened daf open without any network round trip.
 *
 * Every entry point here is fail-soft: a missing/blocked/private-mode IndexedDB must
 * never change what the reader sees, only how long it takes to appear.
 */

const DB_NAME = 'talmud_daf_pdf_cache_v1';
const DB_VERSION = 1;
const STORE = 'pdfs';

/** Newest scans are kept; older ones are dropped once the cache grows past this. */
export const DAF_PDF_CACHE_LIMIT = 40;

interface CachedDafPdf {
  url: string;
  buffer: ArrayBuffer;
  savedAt: number;
}

/** `%PDF` magic header — an SPA HTML fallback must never reach pdf.js from the cache. */
export function isPdfBuffer(data: ArrayBuffer | Uint8Array | null | undefined): boolean {
  if (!data) return false;
  const head = data instanceof Uint8Array ? data.subarray(0, 4) : new Uint8Array(data.slice(0, 4));
  return (
    head.length >= 4 &&
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46
  );
}

/** Oldest-first eviction list so the cache never grows past `limit` entries. */
export function selectPdfCacheEvictions(
  entries: Array<{ url: string; savedAt: number }>,
  limit: number = DAF_PDF_CACHE_LIMIT
): string[] {
  if (!Array.isArray(entries) || entries.length <= limit) return [];
  return [...entries]
    .sort((a, b) => a.savedAt - b.savedAt)
    .slice(0, entries.length - limit)
    .map((e) => e.url);
}

function cacheUnavailable(): boolean {
  return typeof indexedDB === 'undefined' || typeof navigator !== 'undefined' && navigator.storage?.persisted === undefined
    ? typeof indexedDB === 'undefined'
    : false;
}

function openCacheDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (cacheUnavailable()) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'url' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Cached scan bytes for this url, or null when nothing valid is stored. */
export async function readCachedDafPdf(url: string): Promise<ArrayBuffer | null> {
  if (!url) return null;
  const db = await openCacheDb();
  if (!db) return null;
  try {
    return await new Promise<ArrayBuffer | null>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(url);
      request.onsuccess = () => {
        const record = request.result as CachedDafPdf | undefined;
        resolve(record && isPdfBuffer(record.buffer) ? record.buffer : null);
      };
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}

/** Store a scan for next time. Never throws: a full or blocked cache is not an error. */
export async function writeCachedDafPdf(url: string, buffer: ArrayBuffer): Promise<void> {
  if (!url || !isPdfBuffer(buffer)) return;
  const db = await openCacheDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ url, buffer, savedAt: Date.now() } satisfies CachedDafPdf);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
    await prunePdfCache(db);
  } catch {
    /* storage is best-effort */
  } finally {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}

async function prunePdfCache(db: IDBDatabase): Promise<void> {
  try {
    const entries = await new Promise<Array<{ url: string; savedAt: number }>>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () =>
        resolve(
          ((request.result as CachedDafPdf[]) || []).map((r) => ({ url: r.url, savedAt: r.savedAt || 0 }))
        );
      request.onerror = () => resolve([]);
    });
    const doomed = selectPdfCacheEvictions(entries);
    if (!doomed.length) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      doomed.forEach((url) => store.delete(url));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* storage is best-effort */
  }
}

/** How many scans are already sitting on this device. */
export async function getDafPdfCacheCount(): Promise<number> {
  const db = await openCacheDb();
  if (!db) return 0;
  try {
    return await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).count();
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  } finally {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}

/** Drop every stored scan (used when the reader clears offline data). */
export async function clearDafPdfCache(): Promise<void> {
  const db = await openCacheDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* storage is best-effort */
  } finally {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}
