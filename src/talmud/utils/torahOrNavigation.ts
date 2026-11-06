interface TorahOrSpot {
  section: string;
  marginCommType?: string;
  marginEntryKey?: string;
  topPct: number;
  leftPct: number;
  word?: string;
  cleanWord?: string;
}

/** Only verified numbered quotation entries are valid destinations. */
export function getTorahOrEntryHotspots<T extends TorahOrSpot>(
  hotspots: T[], key: string, side: 'left' | 'right',
): T[] {
  const onSide = (h: T) => (side === 'left' ? h.leftPct < 40 : h.leftPct > 60);
  const keyed = hotspots.filter(h =>
    h.section === 'margin' && h.marginCommType === 'torah-or' && h.marginEntryKey === key && onSide(h),
  ).sort((a, b) => a.topPct - b.topPct || b.leftPct - a.leftPct);
  if (!keyed.length) return keyed;
  // The whole entry runs from its printed number to the next number: verse lines and source line,
  // even when the column parser tied only part of them to this key.
  const column = hotspots.filter(h => h.section === 'margin' && h.marginCommType === 'torah-or' && onSide(h));
  const numberOf = (h: T) => {
    const m = /^\.?(\d{1,3})\.?$/.exec(String(h.word ?? h.cleanWord ?? '').trim());
    return m ? m[1] : undefined;
  };
  const start = column.find(h => numberOf(h) === key);
  if (!start) return keyed;
  const next = column
    .filter(h => { const n = numberOf(h); return n && Number(n) > Number(key) && h.topPct > start.topPct + 0.3; })
    .sort((a, b) => a.topPct - b.topPct)[0];
  const lastKeyed = keyed[keyed.length - 1]?.topPct ?? start.topPct;
  const end = next ? next.topPct - 0.3 : lastKeyed + 0.3;
  return column
    .filter(h => h.topPct >= start.topPct - 0.3 && h.topPct <= end)
    .sort((a, b) => a.topPct - b.topPct || b.leftPct - a.leftPct);
}

export function getTorahOrSentenceId(entries: Array<{ id?: string }> | undefined, key: string): string | undefined {
  const index = Number(key) - 1;
  if (!Number.isInteger(index) || index < 0) return undefined;
  const entry = entries?.[index];
  return entry ? `torah-or-${entry.id || index}` : undefined;
}