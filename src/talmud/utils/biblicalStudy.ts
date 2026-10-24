export interface VerseSource {
  ref: string;
  label: string;
  author: string;
  category: string;
  hebrew: string;
  english: string;
}

export function sourceText(value: unknown): string {
  if (Array.isArray(value)) return value.map(sourceText).filter(Boolean).join('\n');
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '';
}

/** Only verified links to the selected verse; chapter-wide links cannot stand in for them. */
export function getVerseSources(data: unknown, verseRef: string): VerseSource[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  return data.flatMap(link => {
    if (!link || typeof link !== 'object') return [];
    const anchors = Array.isArray(link.anchorRefExpanded) ? link.anchorRefExpanded : [];
    if (link.anchorRef !== verseRef && !anchors.includes(verseRef)) return [];
    const ref = typeof link.ref === 'string' ? link.ref : '';
    const hebrew = sourceText(link.he);
    const english = sourceText(link.text);
    if (!ref || seen.has(ref) || (!hebrew && !english)) return [];
    seen.add(ref);
    return [{ ref, label: link.sourceHeRef || ref, author: link.collectiveTitle?.he || link.collectiveTitle?.en || link.index_title || ref,
      category: link.category || 'Other', hebrew, english }];
  }).sort((a, b) => (a.category === 'Commentary' ? 0 : 1) - (b.category === 'Commentary' ? 0 : 1) || a.author.localeCompare(b.author));
}