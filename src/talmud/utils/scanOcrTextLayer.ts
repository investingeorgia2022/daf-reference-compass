// @ts-nocheck
// Image-only Vilna scans carry no text layer. This recognizes word boxes on the rendered
// scan (Hebrew OCR) and returns them as pdf.js-shaped text items, so the regular hotspot
// pipeline (and then the Sefaria overlay that fixes the letters) runs unchanged.

const HEBREW = /[\u05D0-\u05EA]/g;

/** True when the PDF's own text layer is too thin to be a real daf text layer. */
export function needsOcrTextLayer(items: Array<Record<string, unknown>>): boolean {
  let letters = 0;
  for (const it of items) letters += (String(it.str || '').match(HEBREW) || []).length;
  return letters < 1500;
}

export interface OcrWordBox {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const memoryCache = new Map<string, OcrWordBox[]>();
const STORAGE_PREFIX = 'vilna-ocr-v1:';

function readCache(key: string): OcrWordBox[] | null {
  if (memoryCache.has(key)) return memoryCache.get(key)!;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const words = JSON.parse(raw);
      memoryCache.set(key, words);
      return words;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCache(key: string, words: OcrWordBox[]) {
  memoryCache.set(key, words);
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(words));
  } catch {
    // storage full: memory cache is enough
  }
}

let workerPromise: Promise<any> | null = null;
function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(async (mod) => {
      const createWorker = mod.createWorker || mod.default?.createWorker;
      const worker = await createWorker('heb');
      await worker.setParameters({ preserve_interword_spaces: '1' });
      return worker;
    });
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

/** Word boxes in canvas pixels, cached per page key. */
export async function recognizeScanWords(cacheKey: string, canvas: HTMLCanvasElement): Promise<OcrWordBox[]> {
  const cached = readCache(cacheKey);
  if (cached) return cached;
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  const words: OcrWordBox[] = [];
  const collect = (w: any) => {
    const text = String(w?.text || '').trim();
    if (!text || !w.bbox) return;
    if (!/[\u05D0-\u05EA0-9().:\[\]]/.test(text)) return;
    words.push({ text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 });
  };
  if (Array.isArray(data?.words)) data.words.forEach(collect);
  else
    for (const b of data?.blocks || [])
      for (const p of b.paragraphs || []) for (const l of p.lines || []) for (const w of l.words || []) collect(w);
  writeCache(cacheKey, words);
  return words;
}

/**
 * Converts canvas-pixel word boxes to pdf.js text items in PDF user space.
 * `pxPerUnit` is the canvas pixels per base-viewport unit (the render scale).
 */
export function ocrWordsToTextItems(
  words: OcrWordBox[],
  baseViewport: { convertToPdfPoint: (x: number, y: number) => number[] },
  pxPerUnit: number
): Array<Record<string, unknown>> {
  return words.map((w) => {
    const [px0, pyBase] = baseViewport.convertToPdfPoint(w.x0 / pxPerUnit, w.y1 / pxPerUnit);
    const [px1, pyTop] = baseViewport.convertToPdfPoint(w.x1 / pxPerUnit, w.y0 / pxPerUnit);
    const h = Math.max(1, Math.abs(pyTop - pyBase));
    const x = Math.min(px0, px1);
    return {
      str: w.text,
      dir: 'rtl',
      width: Math.max(1, Math.abs(px1 - px0)),
      height: h,
      transform: [h, 0, 0, h, x, Math.min(pyBase, pyTop)],
      fontName: 'ocr',
      hasEOL: false,
      ocr: true,
    };
  });
}
