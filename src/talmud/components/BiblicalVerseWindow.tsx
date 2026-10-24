import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Languages, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BiblicalCitation, findQuotedVerse } from '../utils/biblicalCitation';
import { getVerseSources, sourceText, type VerseSource } from '../utils/biblicalStudy';
import { translateWithTorahTalmudSpecServer } from '../utils/georgianTranslator';

function SourceExplanation({ source }: { source: VerseSource }) {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function translate() {
    setLoading(true); setError(false);
    try {
      const text = await translateWithTorahTalmudSpecServer(source.english || source.hebrew, { hebrewOriginal: source.hebrew, sectionType: 'meforshim', targetLang: 'ka' });
      if (!/[\u10A0-\u10FF]/.test(text)) throw new Error('translation unavailable');
      setTranslation(text);
    } catch { setError(true); }
    finally { setLoading(false); }
  }
  return <details className="verse-source" data-source-ref={source.ref}>
    <summary><span>{source.author}</span><small dir="rtl">{source.label}</small></summary>
    {source.hebrew && <p dir="rtl" lang="he">{source.hebrew}</p>}
    {!source.hebrew && <p lang="en">{source.english}</p>}
    {translation ? <p lang="ka" className="verse-translation">{translation}</p> : <Button variant="outline" size="sm" disabled={loading} onClick={translate}>{loading ? <Loader2 className="animate-spin" size={16}/> : <Languages size={16}/>} ქართული თარგმანი</Button>}
    {error && <p role="alert">თარგმანი ვერ ჩაიტვირთა. სცადეთ ხელახლა.</p>}
    <a href={`https://www.sefaria.org/${encodeURIComponent(source.ref)}`} target="_blank" rel="noopener noreferrer">Sefaria ↗</a>
  </details>;
}

export function BiblicalVerseWindow({ citation, onClose }: { citation: BiblicalCitation; onClose: () => void }) {
  const [result, setResult] = useState<{ verses: string[]; verse: number | undefined } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<number | undefined>();
  const [sources, setSources] = useState<VerseSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState(false);
  const [sourcesRetry, setSourcesRetry] = useState(0);
  const [translation, setTranslation] = useState('');
  const [translationError, setTranslationError] = useState(false);
  const [translationRetry, setTranslationRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(false); setSelectedVerse(undefined); setSearch(''); setCategory('all');
    fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(`${citation.book}.${citation.chapter}`)}?context=0&commentary=0`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('verse unavailable'); return r.json(); })
      .then(data => {
        const verses = (Array.isArray(data.he) ? data.he : [data.he]).map(sourceText);
        if (!verses.length || (citation.verse && !verses[citation.verse-1])) throw new Error('verse missing');
        const verse = citation.verse ?? findQuotedVerse(verses,citation.quote);
        setResult({ verses, verse }); setSelectedVerse(verse);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [citation, retry]);
  const verseRef = selectedVerse ? `${citation.book} ${citation.chapter}:${selectedVerse}` : '';
  const verseText = result && selectedVerse ? result.verses[selectedVerse - 1] : '';
  useEffect(() => {
    const controller = new AbortController();
    setSources([]); setSourcesError(false); setSourcesLoading(Boolean(verseRef));
    if (!verseRef) return () => controller.abort();
    fetch(`https://www.sefaria.org/api/links/${encodeURIComponent(verseRef)}?with_text=1`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('sources unavailable'); return r.json(); })
      .then(data => { if (!controller.signal.aborted) setSources(getVerseSources(data, verseRef)); })
      .catch(() => { if (!controller.signal.aborted) setSourcesError(true); })
      .finally(() => { if (!controller.signal.aborted) setSourcesLoading(false); });
    return () => controller.abort();
  }, [verseRef, sourcesRetry]);
  useEffect(() => {
    let active = true;
    setTranslation(''); setTranslationError(false);
    if (verseText) translateWithTorahTalmudSpecServer(verseText, { hebrewOriginal: verseText, sectionType: 'torah', targetLang: 'ka' })
      .then(text => { if (active) { if (!/[\u10A0-\u10FF]/.test(text)) setTranslationError(true); else setTranslation(text); } })
      .catch(() => { if (active) setTranslationError(true); });
    return () => { active = false; };
  }, [verseText, translationRetry]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown',key);
    return () => window.removeEventListener('keydown',key);
  }, [onClose]);
  const visibleSources = sources.filter(s => (category === 'all' || (category === 'commentary' ? s.category === 'Commentary' : s.category !== 'Commentary')) && `${s.author} ${s.label} ${s.hebrew} ${s.english}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return createPortal(<div className="biblical-verse-overlay" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label={citation.label} className="biblical-verse-window" onClick={e => e.stopPropagation()}>
      <header><BookOpen size={20}/><div className="verse-heading"><small>ფასუკი და განმარტებები</small><h2 dir="rtl">{citation.bookHe} {citation.chapter}{selectedVerse ? `:${selectedVerse}` : ''}</h2></div><Button variant="ghost" size="icon" aria-label="დახურვა" onClick={onClose}><X size={18}/></Button></header>
      {!result && !error && <div role="status"><Loader2 className="animate-spin"/> იტვირთება მუხლი…</div>}
      {error && <div role="alert">მუხლი ვერ ჩაიტვირთა.<Button variant="outline" onClick={() => setRetry(n => n+1)}>ხელახლა ცდა</Button></div>}
      {result && <>
        {!selectedVerse && <div className="verse-chapter"><p>ზუსტი მუხლი ვერ განისაზღვრა. აირჩიეთ მუხლი:</p>{result.verses.map((text, i) => <Button variant="ghost" key={i} onClick={() => setSelectedVerse(i+1)} dir="rtl">{i+1}. {text}</Button>)}</div>}
        {selectedVerse && <>
          <div className="biblical-verse-text" dir="rtl"><p data-verse={selectedVerse}><span>{selectedVerse}.</span> {verseText}</p></div>
          <div className="verse-translation" lang="ka"><h3>ქართული თარგმანი</h3>{translation ? <p>{translation}</p> : translationError ? <div role="alert">თარგმანი ვერ ჩაიტვირთა.<Button variant="ghost" onClick={() => setTranslationRetry(n => n+1)}>ხელახლა ცდა</Button></div> : <div role="status"><Loader2 className="animate-spin" size={16}/> ითარგმნება…</div>}</div>
          <div className="verse-connections"><h3>განმარტებები და დაკავშირებული წყაროები <small>({sources.length})</small></h3>
            <div className="verse-filters" role="group" aria-label="წყაროს ტიპი">{[['all','ყველა'],['commentary','კომენტარები'],['related','სხვა წყაროები']].map(([value,label]) => <Button key={value} variant={category === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={category === value} onClick={() => setCategory(value ?? 'all')}>{label}</Button>)}</div>
            <label className="verse-search"><Search size={16}/><input aria-label="განმარტებების ძიება" placeholder="ძიება" value={search} onChange={e => setSearch(e.target.value)}/></label>
            {sourcesLoading && <div role="status"><Loader2 className="animate-spin" size={18}/> იტვირთება განმარტებები…</div>}
            {sourcesError && <div role="alert">განმარტებები ვერ ჩაიტვირთა.<Button variant="outline" onClick={() => setSourcesRetry(n => n+1)}>ხელახლა ცდა</Button></div>}
            {!sourcesLoading && !sourcesError && !visibleSources.length && <p className="verse-empty">{sources.length ? 'ძიების შედეგი არ მოიძებნა.' : 'ამ მუხლთან დაკავშირებული წყაროები არ მოიძებნა.'}</p>}
            {visibleSources.map(source => <SourceExplanation key={`${verseRef}:${source.ref}`} source={source}/>)}
          </div>
        </>}
      </>}
    </section>
  </div>, document.body);
}