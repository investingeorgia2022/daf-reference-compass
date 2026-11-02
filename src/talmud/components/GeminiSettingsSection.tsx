// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { KeyRound, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { GEMINI_MODEL_CHOICES, loadGeminiSettings, saveGeminiSettings, DEFAULT_GEMINI } from '../utils/geminiSettings';

export const GeminiSettingsSection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [s, setS] = useState(DEFAULT_GEMINI);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'testing' | 'ok' | 'fail'>('idle');
  useEffect(() => setS(loadGeminiSettings()), []);

  const update = (patch) => { const next = { ...s, ...patch }; setS(next); saveGeminiSettings(next); setStatus('saved'); };

  const test = async () => {
    setStatus('testing');
    try {
      const r = await fetch('/api/talmud/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'შალომ! გასაღები მუშაობს.' }) });
      if (!r.ok) throw new Error();
      const url = URL.createObjectURL(await r.blob());
      new Audio(url).play().catch(() => {});
      setStatus('ok');
    } catch { setStatus('fail'); }
  };

  const field = `w-full h-9 px-3 rounded-xl border text-xs font-semibold ${isDark ? 'bg-black/30 border-white/15 text-amber-50' : 'bg-white border-stone-300 text-stone-900'}`;

  return (
    <div className={`p-4 rounded-2xl border space-y-3 w-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-stone-200'}`}>
      <div className="flex items-center gap-2 text-sm font-black"><KeyRound className="w-4 h-4 text-amber-500" /> Gemini API Key</div>
      <p className="text-[11px] opacity-75 leading-snug">თქვენი გასაღები ინახება მხოლოდ ამ ტელეფონში. როცა ჩაწერილია, ყველა AI ფუნქცია და მამაკაცის ხმით გახმოვანება თქვენს Gemini-ზე იმუშავებს.</p>
      <div className="flex gap-2">
        <input type={show ? 'text' : 'password'} value={s.apiKey} placeholder="AIza..." autoComplete="off" onChange={(e) => update({ apiKey: e.target.value })} className={field} />
        <button type="button" onClick={() => setShow((v) => !v)} className="px-2 rounded-xl border border-stone-300/50" aria-label="ჩვენება">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
      </div>
      <label className="block text-[11px] font-bold">მოდელის არჩევა</label>
      <select value={s.mode === 'auto' ? 'auto' : s.fixedModel} onChange={(e) => e.target.value === 'auto' ? update({ mode: 'auto' }) : update({ mode: 'fixed', fixedModel: e.target.value })} className={field}>
        <option value="auto">🤖 ჭკვიანი ავტო-განაწილება (რეკომენდებული)</option>
        {GEMINI_MODEL_CHOICES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
      </select>
      {s.mode === 'auto' && (
        <p className="text-[10.5px] opacity-70 leading-snug">სიტყვის განმარტება → Flash-Lite · ასისტენტი/თარგმანი → Flash · წყაროები → Pro · ჰალახა/მიშნა → კომპლექსური მოდელი. შეფერხებისას ავტომატურად Flash-ზე გადადის.</p>
      )}
      <label className="block text-[11px] font-bold">კომპლექსური ამოცანების მოდელი (არასავალდებულო, მაგ. Argon-ის ზუსტი სახელი)</label>
      <input value={s.complexModel} placeholder="gemini-pro-latest" onChange={(e) => update({ complexModel: e.target.value })} className={field} />
      <div className="flex items-center gap-2">
        <button type="button" disabled={!s.apiKey.trim() || status === 'testing'} onClick={test} className="h-8 px-3 rounded-xl bg-amber-500 text-stone-950 text-xs font-black disabled:opacity-50 flex items-center gap-1">
          {status === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} ტესტი
        </button>
        <span className="text-[11px] font-bold">
          {status === 'saved' && <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" />შენახულია</span>}
          {status === 'ok' && '✓ გასაღები მუშაობს'}
          {status === 'fail' && '✗ გასაღები ვერ შემოწმდა'}
        </span>
      </div>
    </div>
  );
};
