/**
 * Processed-daf cache: the finished (already tinted) page picture plus the decoded
 * PDF text items. A daf found here skips PDF rendering, text extraction and ink
 * tinting entirely — only the cheap hotspot pass runs again.
 *
 * Fail-soft like dafPdfCache: missing IndexedDB only costs speed, never content.
 */

/** Bump when rendering/tinting/text decoding changes so stale pictures are ignored. */
export const DAF_RENDER_CACHE_VERSION = 2;
const DB_NAME = 'talmud_daf_render_cache_v1';
const STORE = 'renders';
export const DAF_RENDER_CACHE_LIMIT = 160;

export interface CachedDafRender {
  key: string;
  image: Blob;
  width: number;
  height: number;
  itemsJson: string;
  savedAt: number;
}

export function dafRenderCacheKey(url: string, width: number, height: number, dark: boolean): string {
  return `v${DAF_RENDER_CACHE_VERSION}|${dark ? 'd' : 'l'}|${width}x${height}|${url}`;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function readDafRender(key: string): Promise<CachedDafRender | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => {
        const rec = r.result as CachedDafRender | undefined;
        resolve(rec && rec.image && rec.itemsJson ? rec : null);
      };
      r.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    try { db.close(); } catch { /* closed */ }
  }
}

export async function writeDafRender(rec: Omit<CachedDafRender, 'savedAt'>): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...rec, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const all: Array<{ key: string; savedAt: number }> = [];
      const cur = store.openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (c) {
          all.push({ key: c.value.key, savedAt: c.value.savedAt || 0 });
          c.continue();
          return;
        }
        if (all.length > DAF_RENDER_CACHE_LIMIT) {
          all.sort((a, b) => a.savedAt - b.savedAt)
            .slice(0, all.length - DAF_RENDER_CACHE_LIMIT)
            .forEach((e) => store.delete(e.key));
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* best-effort */
  } finally {
    try { db.close(); } catch { /* closed */ }
  }
}

export async function clearDafRenderCache(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } finally {
    try { db.close(); } catch { /* closed */ }
  }
}
