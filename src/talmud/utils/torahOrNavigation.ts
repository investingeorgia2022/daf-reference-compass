interface TorahOrSpot {
  section: string;
  marginCommType?: string;
  marginEntryKey?: string;
  topPct: number;
  leftPct: number;
}

/** Only verified numbered quotation entries are valid destinations. */
export function getTorahOrEntryHotspots<T extends TorahOrSpot>(
  hotspots: T[], key: string, side: 'left' | 'right',
): T[] {
  return hotspots.filter(h =>
    h.section === 'margin' && h.marginCommType === 'torah-or' && h.marginEntryKey === key &&
    (side === 'left' ? h.leftPct < 40 : h.leftPct > 60),
  ).sort((a, b) => a.topPct - b.topPct || b.leftPct - a.leftPct);
}

export function getTorahOrSentenceId(entries: Array<{ id?: string }> | undefined, key: string): string | undefined {
  const index = Number(key) - 1;
  if (!Number.isInteger(index) || index < 0) return undefined;
  const entry = entries?.[index];
  return entry ? `torah-or-${entry.id || index}` : undefined;
}