import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BiblicalCitation, findQuotedVerse } from '../utils/biblicalCitation';

export function BiblicalVerseWindow({ citation, onClose }: { citation: BiblicalCitation; onClose: () => void }) {
  const [result, setResult] = useState<{ verses: string[]; verse: number | undefined } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(false);
    fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(`${citation.book}.${citation.chapter}`)}?context=0&commentary=0`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('verse unavailable'); return r.json(); })
      .then(data => {
        const verses = (Array.isArray(data.he) ? data.he.flat() : [data.he]).filter((s: unknown): s is string => typeof s === 'string').map((s: string) => s.replace(/<[^>]*>/g,''));
        if (!verses.length || (citation.verse && !verses[citation.verse-1])) throw new Error('verse missing');
        setResult({ verses, verse: citation.verse ?? findQuotedVerse(verses,citation.quote) });
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [citation, retry]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown',key);
    return () => window.removeEventListener('keydown',key);
  }, [onClose]);
  return createPortal(<div className="biblical-verse-overlay" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label={citation.label} className="biblical-verse-window" onClick={e => e.stopPropagation()}>
      <header><BookOpen size={20}/><h2 dir="rtl">{citation.label}{result?.verse && !citation.verse ? `:${result.verse}` : ''}</h2><Button variant="ghost" size="icon" aria-label="დახურვა" onClick={onClose}><X size={18}/></Button></header>
      {!result && !error && <div role="status"><Loader2 className="animate-spin"/> იტვირთება მუხლი…</div>}
      {error && <div role="alert">მუხლი ვერ ჩაიტვირთა.<Button variant="outline" onClick={() => setRetry(n => n+1)}>ხელახლა ცდა</Button></div>}
      {result && <div className="biblical-verse-text" dir="rtl">{result.verses.map((text,i) => (!result.verse || result.verse === i+1) && <p key={i} data-verse={i+1}><span>{i+1}.</span> {text}</p>)}</div>}
    </section>
  </div>, document.body);
}