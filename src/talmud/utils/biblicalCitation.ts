const BOOKS: Record<string, string> = {
  בראשית: 'Genesis', שמות: 'Exodus', ויקרא: 'Leviticus', במדבר: 'Numbers', דברים: 'Deuteronomy',
  יהושע: 'Joshua', שופטים: 'Judges', ישעיה: 'Isaiah', ישעיהו: 'Isaiah', ירמיה: 'Jeremiah', ירמיהו: 'Jeremiah',
  יחזקאל: 'Ezekiel', תהלים: 'Psalms', משלי: 'Proverbs', איוב: 'Job', רות: 'Ruth', איכה: 'Lamentations',
  קהלת: 'Ecclesiastes', אסתר: 'Esther', דניאל: 'Daniel', עזרא: 'Ezra', נחמיה: 'Nehemiah',
};
const VALUES: Record<string, number> = { א:1,ב:2,ג:3,ד:4,ה:5,ו:6,ז:7,ח:8,ט:9,י:10,כ:20,ל:30,מ:40,נ:50,ס:60,ע:70,פ:80,צ:90,ק:100,ר:200,ש:300,ת:400 };
function numberOf(s: string): number {
  return /^\d+$/.test(s) ? Number(s) : [...s.replace(/[״׳"']/g,'')].reduce((n,c) => n + (VALUES[c] ?? 0),0);
}
export interface BiblicalCitation { book: string; bookHe: string; chapter: number; verse?: number | undefined; quote: string; label: string }
export function parseBiblicalCitation(text: string): BiblicalCitation | null {
  const pattern = new RegExp(`(${Object.keys(BOOKS).join('|')})\\s+([א-ת״׳"']{1,6}|\\d{1,3})(?:[\\s,:]+([א-ת״׳"']{1,6}|\\d{1,3})(?=[)\\]\\s.:]|$))?`, 'u');
  const m = text.match(pattern);
  if (!m || m.index === undefined || !m[1] || !m[2]) return null;
  const book = BOOKS[m[1]];
  if (!book) return null;
  const chapter = numberOf(m[2]);
  const verse = m[3] ? numberOf(m[3]) : undefined;
  if (!chapter || chapter > 150 || (verse !== undefined && (!verse || verse > 176))) return null;
  return { book, bookHe: m[1], chapter, verse, quote: text.slice(0,m.index).replace(/[()[\]]/g,'').trim(), label: `${m[1]} ${chapter}${verse ? `:${verse}` : ''}` };
}
export function plainBiblicalText(text: string): string {
  return text.replace(/<[^>]*>/g,'').replace(/[\u0591-\u05c7]/g,'').replace(/[^א-ת\s]/g,' ').replace(/\s+/g,' ').trim();
}
/** Chapter-only printed references require a unique quotation match, never an invented verse number. */
export function findQuotedVerse(verses: string[], quote: string): number | undefined {
  const words = plainBiblicalText(quote).split(' ').filter(Boolean).slice(-12);
  for (let length = Math.min(8,words.length); length >= 2; length--) {
    for (let start = words.length - length; start >= 0; start--) {
      const phrase = words.slice(start,start+length).join(' ');
      const matches = verses.map((v,i) => plainBiblicalText(v).includes(phrase) ? i+1 : 0).filter(Boolean);
      if (matches.length === 1) return matches[0];
    }
  }
  return undefined;
}