// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ScrollText, X, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';
import { getBackendUrl } from '../utils/georgianTranslator';

export interface MishnahItem {
  index: number; // 1-based within chapter
  he: string;
  translationKa?: string;
  sagesHe?: string;
  explanationKa?: string;
}

const stripNikud = (s: string) =>
  (s || '').replace(/<[^>]+>/g, '').replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA ]/g, ' ').replace(/\s+/g, ' ').trim();

function dafToNum(d: string) {
  const m = /^(\d+)([ab])/.exec(d || '');
  return m ? Number(m[1]) * 2 + (m[2] === 'b' ? 1 : 0) : 0;
}

/** Loads the Mishnah chapter discussed on the current daf (Sefaria) + Georgian guide (AI, cached). */
export function useMishnahChapter(tractateId: string, dafId: string, dafMishnahHe: string[], enabled: boolean) {
  const [state, setState] = useState<{ chapter: number; items: MishnahItem[]; loading: boolean; error?: string; aiLoading: boolean }>({ chapter: 0, items: [], loading: false, aiLoading: false });

  useEffect(() => {
    if (!enabled || !tractateId) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        const idx = await fetch(`https://www.sefaria.org/api/v2/raw/index/${encodeURIComponent(tractateId)}`).then((r) => r.json());
        const nodes = idx?.alt_structs?.Chapters?.nodes || [];
        const cur = dafToNum(dafId);
        let chapter = 1;
        nodes.forEach((n, i) => {
          const m = /\s(\d+[ab])(?::\d+)?-(\d+[ab])/.exec(n.wholeRef || '');
          if (m && cur >= dafToNum(m[1]) && cur <= dafToNum(m[2])) chapter = i + 1;
        });
        const cacheKey = `talmud_mishnah_guide_v1_${tractateId}_${chapter}`;
        const cached = (() => { try { return JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch { return null; } })();
        if (cached?.items?.length) {
          if (!cancelled) setState({ chapter, items: cached.items, loading: false, aiLoading: false });
          return;
        }
        const txt = await fetch(`https://www.sefaria.org/api/v3/texts/Mishnah_${encodeURIComponent(tractateId)}.${chapter}?version=hebrew&return_format=text_only`).then((r) => r.json());
        const he: string[] = (txt?.versions?.[0]?.text || []).map((t) => String(t || '').replace(/<[^>]+>/g, ''));
        const base = he.map((h, i) => ({ index: i + 1, he: h }));
        if (cancelled) return;
        setState({ chapter, items: base, loading: false, aiLoading: true });
        const res = await fetch(getBackendUrl('/api/talmud/mishnah-guide'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tractate: tractateId, daf: String(chapter), mishnayot: he }),
        });
        const data = res.ok ? await res.json() : { items: [] };
        const merged = base.map((b, i) => ({ ...b, ...(data.items?.[i] || {}) }));
        if (merged.some((m) => m.translationKa)) localStorage.setItem(cacheKey, JSON.stringify({ items: merged }));
        if (!cancelled) setState({ chapter, items: merged, loading: false, aiLoading: false });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, aiLoading: false, error: 'მიშნის ჩატვირთვა ვერ მოხერხდა' }));
      }
    })();
    return () => { cancelled = true; };
  }, [tractateId, dafId, enabled]);

  // Which Mishnah does this daf discuss? Match daf Mishnah text against the chapter.
  const currentIndices = useMemo(() => {
    const out = new Set<number>();
    const dafTexts = dafMishnahHe.map(stripNikud).filter(Boolean);
    for (const dt of dafTexts) {
      const probe = dt.split(' ').slice(0, 4).join(' ');
      let best = 0, bestScore = 0;
      state.items.forEach((it) => {
        const t = stripNikud(it.he);
        const score = t.includes(probe) ? 10 : dt.split(' ').filter((w) => w.length > 2 && t.includes(w)).length;
        if (score > bestScore) { bestScore = score; best = it.index; }
      });
      if (best && bestScore >= 3) out.add(best);
    }
    if (!out.size && state.items.length) out.add(1);
    return out;
  }, [dafMishnahHe, state.items]);

  return { ...state, currentIndices };
}

const tabs = [
  { id: 'both', label: 'ორივე ერთად' },
  { id: 'daf', label: 'დაფის ნაწილი' },
  { id: 'chapter', label: 'თავის სრული მიშნა' },
] as const;

function Shell({ open, onClose, children, label }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mg-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={label}
            className="mg-window"
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MishnahMapModal({ open, onClose, onOpenGuide, data, tractateNameKa, dafId, mishnahPct }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const first = [...data.currentIndices][0];
      listRef.current?.querySelector(`[data-mishnah="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 320);
    return () => clearTimeout(t);
  }, [open, data.currentIndices, data.items.length]);

  const n = data.items.length || 1;
  return (
    <Shell open={open} onClose={onClose} label="მიშნების რუკა">
      <header className="mg-head">
        <span className="mg-head-icon"><ScrollText className="w-5 h-5" /></span>
        <div className="mg-head-text">
          <h2>დაფის სარჩევი • რუკა</h2>
          <p>{tractateNameKa} • თავი {data.chapter || '…'} • დაფი {dafId}</p>
        </div>
        <button className="mg-close" onClick={onClose} aria-label="დახურვა"><X className="w-4 h-4" /></button>
      </header>
      <div className="mg-progress">
        <div className="mg-bar"><span style={{ width: `${mishnahPct}%` }} /></div>
        <div className="mg-legend"><b className="mg-m">მიშნა {mishnahPct}%</b><b className="mg-g">გემარა {100 - mishnahPct}%</b></div>
      </div>
      <div className="mg-body" ref={listRef}>
        {data.loading && <div className="mg-status"><Loader2 className="w-4 h-4 animate-spin" /> იტვირთება…</div>}
        {data.error && <div className="mg-status">{data.error}</div>}
        {data.items.map((it) => {
          const current = data.currentIndices.has(it.index);
          return (
            <button key={it.index} data-mishnah={it.index} className={`mg-card ${current ? 'is-current' : ''}`} onClick={onOpenGuide}>
              <div className="mg-card-top">
                <span className="mg-badge"><ScrollText className="w-3.5 h-3.5" /> მიშნა {it.index}</span>
                {current ? <span className="mg-here">მიმდინარე დაფი</span> : <span className="mg-pos">~{Math.round(((it.index - 0.5) / n) * 100)}% თავი</span>}
              </div>
              <p className="mg-he" dir="rtl">{it.he.split(' ').slice(0, 9).join(' ')}…</p>
              {it.translationKa ? <p className="mg-ka">{it.translationKa}</p> : data.aiLoading ? <p className="mg-ka mg-dim">თარგმანი მზადდება…</p> : null}
            </button>
          );
        })}
      </div>
      <footer className="mg-foot">
        <button className="mg-primary" onClick={onOpenGuide}><BookOpen className="w-4 h-4" /> მიშნის იზოლირებული მეგზურის გახსნა</button>
      </footer>
    </Shell>
  );
}

export function MishnahGuideModal({ open, onClose, data, tractateNameKa, tractateNameHe, dafId }) {
  const [tab, setTab] = useState<'both' | 'daf' | 'chapter'>('both');
  const dafItems = data.items.filter((i) => data.currentIndices.has(i.index));
  const sections = tab === 'daf' ? [{ title: `მიმდინარე დაფის მიშნა (დაფი ${dafId})`, items: dafItems }]
    : tab === 'chapter' ? [{ title: `თავი ${data.chapter} — სრული მიშნა`, items: data.items }]
    : [{ title: `მიმდინარე დაფის მიშნა (დაფი ${dafId})`, items: dafItems }, { title: `თავი ${data.chapter} — სრული მიშნა`, items: data.items }];
  return (
    <Shell open={open} onClose={onClose} label="მიშნის მეგზური">
      <header className="mg-head">
        <span className="mg-head-icon"><ScrollText className="w-5 h-5" /></span>
        <div className="mg-head-text">
          <h2>მიმდინარე გემარის მიშნა</h2>
          <p dir="rtl" className="mg-he-sub">משנה {tractateNameHe} • ({dafId})</p>
        </div>
        <button className="mg-close" onClick={onClose} aria-label="დახურვა"><X className="w-4 h-4" /></button>
      </header>
      <div className="mg-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.id === 'daf' ? `${t.label} (${dafId})` : t.label}
          </button>
        ))}
      </div>
      <div className="mg-body">
        {data.loading && <div className="mg-status"><Loader2 className="w-4 h-4 animate-spin" /> იტვირთება…</div>}
        {sections.map((s) => (
          <section key={s.title} className="mg-section">
            <h3 className="mg-section-title"><span />{s.title}<em>{s.items.length} მიშნა</em></h3>
            {s.items.map((it) => (
              <article key={s.title + it.index} className={`mg-card mg-static ${data.currentIndices.has(it.index) ? 'is-current' : ''}`}>
                <div className="mg-card-top">
                  <span className="mg-badge mg-badge-soft">მიშნა {it.index}</span>
                  {it.sagesHe && <span className="mg-sages">ბრძენნი: <span dir="rtl">{it.sagesHe}</span></span>}
                  {data.currentIndices.has(it.index) && <CheckCircle2 className="w-4 h-4 mg-check" />}
                </div>
                <p className="mg-he mg-he-full" dir="rtl">{it.he}</p>
                <div className="mg-divider" />
                {it.translationKa ? <p className="mg-ka"><b>თარგმანი: </b>{it.translationKa}</p> : <p className="mg-ka mg-dim">{data.aiLoading ? 'თარგმანი მზადდება…' : 'თარგმანი მიუწვდომელია'}</p>}
                {it.explanationKa && (
                  <div className="mg-explain"><h4><Lightbulb className="w-4 h-4" /> ჰალახური და კონცეპტუალური განმარტება</h4><p>{it.explanationKa}</p></div>
                )}
              </article>
            ))}
          </section>
        ))}
      </div>
      <footer className="mg-foot mg-foot-split">
        <span>{tractateNameKa} • დაფი {dafId}</span>
        <button className="mg-secondary" onClick={onClose}>დახურვა</button>
      </footer>
    </Shell>
  );
}
