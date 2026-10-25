/** Reject the entire import before writing anything, so damaged backups cannot replace valid pages. */
export function validateOfflineBackup(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') throw new Error('არასწორი სარეზერვო ასლი');
  const backup = value as Record<string, unknown>;
  if (backup['version'] !== 1 || !Array.isArray(backup['records'])) throw new Error('სარეზერვო ასლის ფორმატი არ არის მხარდაჭერილი');
  const seen = new Set<string>();
  return backup['records'].map(record => {
    if (!record || typeof record !== 'object') throw new Error('დაზიანებული დაფის ჩანაწერი');
    const rec = record as Record<string, unknown>;
    const data = rec['dafData'] as Record<string, unknown> | undefined;
    if (typeof rec['tractateId'] !== 'string' || !rec['tractateId'] || typeof rec['dafId'] !== 'string' || !/^\d+[ab]$/.test(rec['dafId']) ||
      rec['key'] !== `${rec['tractateId']}:${rec['dafId']}` || !data || data['tractateId'] !== rec['tractateId'] || data['dafId'] !== rec['dafId'] ||
      !['mishnah', 'gemara', 'rashi', 'tosafot'].every(k => Array.isArray(data[k])) ||
      typeof rec['savedAt'] !== 'number' || !Number.isFinite(rec['savedAt']) || typeof rec['sizeBytes'] !== 'number' || !Number.isFinite(rec['sizeBytes']) || rec['sizeBytes'] < 0 ||
      seen.has(rec['key'] as string)) throw new Error('დაზიანებული ან განმეორებული დაფის ჩანაწერი');
    seen.add(rec['key'] as string);
    return rec;
  });
}