// @ts-nocheck
/**
 * Pre-computed coordinate layers for image-only Vilna scans (no PDF text layer).
 * Each layer lists margin entries and Rashi/Tosafot dibbur-hamatchil boxes with their
 * Gemara targets on a 0–1000 [ymin, xmin, ymax, xmax] scale.
 */
import bekhorot36a from '../data/scanLayers/Bekhorot-36a.json';
import type { DhLink, DhHotspotRole } from './dibburHamatchilMatcher';

interface RawLayer {
  markers: Array<{ type: string; text: string; box: number[] }>;
  commentary_openings: Array<{
    commentary: 'rashi' | 'tosafot';
    dh_text: string;
    dh_box: number[];
    gemara_target_phrase: string;
    gemara_target_box: number[];
  }>;
}

const LAYERS: Record<string, RawLayer> = {
  'Bekhorot:36a': bekhorot36a as RawLayer,
};

const MARKER_TYPE: Record<string, string> = {
  torah_or: 'torah-or',
  ein_mishpat: 'ein-mishpat',
  masoret_hashas: 'masoret',
  gilyon: 'gilyon-hashas',
};

export function hasScanLayer(dafKey: string): boolean {
  return Boolean(LAYERS[dafKey]);
}

function boxPct(box: number[]) {
  const [y0, x0, y1, x1] = box.map((n) => Math.max(0, Math.min(1000, Number(n) || 0)));
  return { leftPct: x0 / 10, topPct: y0 / 10, widthPct: Math.max(0.4, (x1 - x0) / 10), heightPct: Math.max(0.4, (y1 - y0) / 10) };
}

function valid(box: unknown): box is number[] {
  return Array.isArray(box) && box.length === 4 && box[2] > box[0] && box[3] > box[1];
}

/** Builds hotspots plus explicit DH links for a scanned daf, or null when no layer exists. */
export function buildScanLayer(dafKey: string, sentence: unknown) {
  const raw = LAYERS[dafKey];
  if (!raw) return null;
  const hotspots: any[] = [];
  const links: DhLink[] = [];
  const roles = new Map<string, DhHotspotRole>();
  const make = (id: string, word: string, section: string, box: number[], extra = {}) => ({
    id,
    word,
    cleanWord: word,
    section,
    ...boxPct(box),
    sentence: sentence || { id: `${id}-s`, he: word, ka: '', en: '' },
    rowId: `${id}-row`,
    lineTextHe: word,
    ...extra,
  });

  raw.markers.forEach((m, i) => {
    if (!valid(m.box)) return;
    hotspots.push(
      make(`scan-m-${i}`, m.text, 'margin', m.box, {
        marginCommType: MARKER_TYPE[m.type],
        marginEntryKey: String(m.text || '').split(/\s+/)[0],
      })
    );
  });

  const counter = { rashi: 0, tosafot: 0 };
  raw.commentary_openings.forEach((c, i) => {
    if (!valid(c.dh_box) || !valid(c.gemara_target_box)) return;
    const commentator = c.commentary === 'tosafot' ? 'tosafot' : 'rashi';
    const key = `${commentator}:scan:${counter[commentator]++}`;
    const dhId = `scan-dh-${i}`;
    const mainId = `scan-gm-${i}`;
    hotspots.push(make(dhId, c.dh_text, commentator, c.dh_box));
    hotspots.push(make(mainId, c.gemara_target_phrase, 'gemara', c.gemara_target_box));
    links.push({ key, commentator, dhIds: [dhId], mainIds: [mainId] });
    roles.set(dhId, { [commentator]: key });
    roles.set(mainId, { [commentator]: key });
  });

  return { hotspots, links, roles };
}
