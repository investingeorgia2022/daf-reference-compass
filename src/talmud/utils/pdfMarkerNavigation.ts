interface MarkerBox {
  id: string; isSmallMarker?: boolean; leftPct: number; topPct: number; widthPct: number; heightPct: number;
  inkLeftPct?: number; inkTopPct?: number; inkWidthPct?: number; inkHeightPct?: number;
}

/** Partition padded touch areas at the midpoint between adjacent printed glyphs. */
export function getIndependentMarkerBoxes<T extends MarkerBox>(spots: T[]): T[] {
  return spots.map(spot => {
    if (!spot.isSmallMarker) return spot;
    const x = spot.inkLeftPct ?? spot.leftPct;
    const w = spot.inkWidthPct ?? spot.widthPct;
    const y = spot.inkTopPct ?? spot.topPct;
    const center = x + w / 2;
    let left = spot.leftPct;
    let right = spot.leftPct + spot.widthPct;
    for (const other of spots) {
      if (other.id === spot.id || !other.isSmallMarker) continue;
      const oy = other.inkTopPct ?? other.topPct;
      if (Math.abs(oy - y) > Math.max(spot.inkHeightPct ?? 0.6, other.inkHeightPct ?? 0.6) * 0.65) continue;
      const ox = other.inkLeftPct ?? other.leftPct;
      const ow = other.inkWidthPct ?? other.widthPct;
      const oc = ox + ow / 2;
      if (oc < center) left = Math.max(left, (ox + ow + x) / 2);
      if (oc > center) right = Math.min(right, (x + w + ox) / 2);
    }
    return { ...spot, leftPct: left, widthPct: Math.max(0.1, right - left) };
  });
}

interface MarginSpot {
  section: string; marginCommType?: string; marginEntryKey?: string; word: string; topPct: number; leftPct: number;
}

/** Gilyon contains separate notes on Mishnah, Gemara and Tosafot, not one nearest row. */
export function getGilyonNote<T extends MarginSpot>(spots: T[], sourceSection: string, side: 'left' | 'right'): T[] {
  const column = spots.filter(s => s.section === 'margin' && s.marginCommType === 'gilyon-hashas' &&
    (side === 'left' ? s.leftPct < 40 : s.leftPct > 60)).sort((a,b) => a.topPct - b.topPct || b.leftPct - a.leftPct);
  const leads = column.filter(s => /^(?:ב?מתני|ב?משנה|ב?גמ|ב?תוס|ב?רש)/.test(s.word));
  const pattern = sourceSection === 'mishnah' ? /^(?:ב?מתני|ב?משנה)/ : sourceSection === 'tosafot' ? /^ב?תוס/ : sourceSection === 'rashi' ? /^ב?רש/ : /^ב?גמ/;
  const lead = leads.find(s => pattern.test(s.word));
  if (!lead) return [];
  const next = leads.find(s => s.topPct > lead.topPct + 0.4);
  return column.filter(s => s.topPct >= lead.topPct - 0.35 && (!next || s.topPct < next.topPct - 0.35));
}