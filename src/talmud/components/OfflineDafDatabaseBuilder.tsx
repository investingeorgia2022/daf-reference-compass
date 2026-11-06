// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Database, Download, Loader2, Square, Trash2, CheckCircle2 } from 'lucide-react';
import { SEDARIM, TRACTATES, generateDafListForTractate } from '../data/tractates';
import {
  deletePinnedTractateDafPdfs,
  getPinnedDafPdfSummary,
  isPdfBuffer,
  talmudDafPdfUrl,
  writeCachedDafPdf,
} from '../utils/dafPdfCache';

/** Average Vilna scan size, used only for the estimate before downloading. */
const AVG_DAF_BYTES = 450 * 1024;

const fmtMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;

interface Progress {
  tractateKa: string;
  done: number;
  total: number;
  failed: number;
}

/** Choose one or several tractates and save every daf scan on this device for instant offline opening. */
export const OfflineDafDatabaseBuilder: React.FC<{ isDark?: boolean }> = ({ isDark }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<Record<string, { count: number; bytes: number }>>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => setSummary(await getPinnedDafPdfSummary()), []);
  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  const dafCount = (id: string) => {
    const t = TRACTATES.find((x) => x.id === id);
    return t ? generateDafListForTractate(t.lastDaf).length : 0;
  };

  const remaining = useMemo(
    () => [...selected].reduce((n, id) => n + Math.max(0, dafCount(id) - (summary[id]?.count || 0)), 0),
    [selected, summary]
  );
  const savedBytes = Object.values(summary).reduce((n, s) => n + s.bytes, 0);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSeder = (sederId: string) => {
    const ids = TRACTATES.filter((t) => t.sederId === sederId).map((t) => t.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const build = async () => {
    if (progress || selected.size === 0) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setMessage(null);
    let failedTotal = 0;
    const current = await getPinnedDafPdfSummary();
    for (const id of selected) {
      const t = TRACTATES.find((x) => x.id === id);
      if (!t) continue;
      const have = new Set((current[id] as any)?.urls || []);
      const dapim = generateDafListForTractate(t.lastDaf);
      let done = 0;
      let failed = 0;
      const tractateKa = t.nameKa.split(' (')[0];
      setProgress({ tractateKa, done, total: dapim.length, failed });
      for (const dafId of dapim) {
        if (ctrl.signal.aborted) break;
        const url = talmudDafPdfUrl(t.id, dafId);
        if (!have.has(url)) {
          try {
            const res = await fetch(url, { signal: ctrl.signal });
            const buf = res.ok ? await res.arrayBuffer() : null;
            if (buf && isPdfBuffer(buf)) await writeCachedDafPdf(url, buf, { pinned: true });
            else failed++;
          } catch {
            if (ctrl.signal.aborted) break;
            failed++;
          }
        }
        done++;
        setProgress({ tractateKa, done, total: dapim.length, failed });
      }
      failedTotal += failed;
      await refresh();
      if (ctrl.signal.aborted) break;
    }
    const stopped = ctrl.signal.aborted;
    abortRef.current = null;
    setProgress(null);
    await refresh();
    setMessage(
      stopped
        ? 'შეჩერდა. უკვე შენახული დაფები ტელეფონში დარჩა.'
        : failedTotal
          ? `ბაზა შეიქმნა. ${failedTotal} დაფი ვერ ჩამოიტვირთა — სცადეთ თავიდან.`
          : 'ბაზა შეიქმნა. ეს დაფები ახლა ინტერნეტის გარეშეც მყისიერად გაიხსნება.'
    );
  };

  const removeTractate = async (id: string) => {
    await deletePinnedTractateDafPdfs(id);
    await refresh();
  };

  const card = isDark ? 'border-amber-400/30 bg-stone-900/60' : 'border-[#C5B49D] bg-white/70';

  return (
    <section className={`rounded-2xl border p-3 sm:p-4 mb-4 ${card}`}>
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h4 className="font-extrabold text-sm">დაფების ბაზა ტელეფონში</h4>
      </div>
      <p className="text-[11px] opacity-80 mb-3">
        მონიშნეთ ერთი ან რამდენიმე ტრაქტატი. მათი ყველა დაფი შეინახება ტელეფონში და გაიხსნება მყისიერად, ინტერნეტის გარეშეც.
      </p>

      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {SEDARIM.map((s) => {
          const list = TRACTATES.filter((t) => t.sederId === s.id);
          if (!list.length) return null;
          const all = list.every((t) => selected.has(t.id));
          return (
            <div key={s.id}>
              <label className="flex items-center gap-2 text-xs font-black mb-1 cursor-pointer">
                <input type="checkbox" checked={all} onChange={() => toggleSeder(s.id)} disabled={!!progress} />
                {s.nameKa || s.id} <span dir="rtl" className="opacity-70">{s.nameHe}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ps-5">
                {list.map((t) => {
                  const total = dafCount(t.id);
                  const have = summary[t.id]?.count || 0;
                  return (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                          disabled={!!progress}
                        />
                        <span className="truncate">{t.nameKa.split(' (')[0]}</span>
                        <span className="opacity-60 shrink-0">
                          {have >= total ? <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-600" /> : `${have}/${total}`}
                        </span>
                      </label>
                      {have > 0 && !progress && (
                        <button
                          type="button"
                          onClick={() => removeTractate(t.id)}
                          className="p-1 rounded hover:bg-red-500/15"
                          title="წაშლა ტელეფონიდან"
                          aria-label={`${t.nameKa} წაშლა`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] opacity-85">
        მონიშნულია {selected.size} ტრაქტატი • ჩამოსატვირთი {remaining} დაფი (~{fmtMb(remaining * AVG_DAF_BYTES)}) •
        ტელეფონში უკვე შენახულია {fmtMb(savedBytes)}
      </div>

      {progress && (
        <div className="mt-3">
          <div className="text-xs font-bold mb-1">
            მუშავდება {progress.tractateKa}: {progress.done} / {progress.total} დაფი
          </div>
          <div className="h-2 rounded-full bg-stone-300/50 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-[width] duration-300"
              style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
        </div>
      )}
      {message && <div className="mt-2 text-xs font-bold">{message}</div>}

      <div className="mt-3 flex gap-2">
        {progress ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="h-9 px-4 rounded-xl border border-red-500/50 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs font-black"
          >
            <Square className="w-3.5 h-3.5" /> შეჩერება
          </button>
        ) : (
          <button
            type="button"
            onClick={build}
            disabled={selected.size === 0}
            className="h-9 px-4 rounded-xl bg-amber-600 text-stone-950 disabled:opacity-50 flex items-center gap-2 text-xs font-black"
          >
            {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            ბაზის შექმნა
          </button>
        )}
      </div>
    </section>
  );
};
