// @ts-nocheck
import React, { useEffect, useMemo, useRef } from 'react';
import type { DafPageData, TalmudSentence } from '../types/talmud';

interface CitedDafTextViewProps {
  dafData: DafPageData;
  tractateNameHe: string;
  dafMarkHe: string;
  snippetHe?: string;
  loading?: boolean;
  isDark?: boolean;
}

const plain = (s: string) => (s || '').replace(/[\u0591-\u05C7]/g, '');

/** Index of the sentence sharing the most words (3+ letters) with the cited phrase, or -1. */
export function bestSnippetMatch(sentences: TalmudSentence[], snippetHe?: string): number {
  const tokens = plain(snippetHe || '')
    .split(/\s+/)
    .map((w) => w.replace(/[^א-ת]/g, ''))
    .filter((w) => w.length >= 3);
  if (tokens.length === 0) return -1;
  let best = -1;
  let bestScore = 0;
  sentences.forEach((s, i) => {
    const text = plain(s.hebrewText || '');
    const score = tokens.filter((t) => text.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 2 ? best : -1;
}

/**
 * Text view of a cited daf for which no printed scan is bundled. Shows the correct
 * tractate and daf with the cited passage highlighted.
 */
export const CitedDafTextView: React.FC<CitedDafTextViewProps> = ({
  dafData,
  tractateNameHe,
  dafMarkHe,
  snippetHe,
  loading,
  isDark,
}) => {
  const main = useMemo(() => [...(dafData.mishnah || []), ...(dafData.gemara || [])], [dafData]);
  const hit = useMemo(() => bestSnippetMatch(main, snippetHe), [main, snippetHe]);
  const hitRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    hitRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [hit, main]);

  const ink = isDark ? 'text-[#F4EAD5]' : 'text-[#2C1A10]';
  const sub = isDark ? 'text-[#C49A6C]' : 'text-[#8B5A2B]';

  const renderComments = (label: string, list: TalmudSentence[]) =>
    list.length > 0 && (
      <section className="mt-4">
        <h4 className={`text-sm font-bold mb-1 ${sub}`}>{label}</h4>
        {list.map((c) => (
          <p key={c.id} className={`text-[15px] leading-relaxed mb-1.5 ${ink}`}>
            {c.dibburHamatchil && <b>{c.dibburHamatchil} </b>}
            {c.hebrewText}
          </p>
        ))}
      </section>
    );

  return (
    <div dir="rtl" className="px-3 py-3" style={{ fontFamily: "'Frank Ruhl Libre', 'David Libre', serif" }}>
      <header className={`text-center border-b pb-2 mb-3 ${isDark ? 'border-[#C49A6C]/40' : 'border-[#8B5A2B]/30'}`}>
        <div className={`text-lg font-black ${ink}`}>
          מסכת {tractateNameHe} דף {dafMarkHe}
        </div>
        <div className={`text-[11px] ${sub}`} dir="ltr">
          ამ დაფის ორიგინალი გვერდი აპლიკაციაში არ არის — ნაჩვენებია მისი ტექსტი
        </div>
      </header>
      {loading && main.length === 0 && <p className={`text-center text-sm ${sub}`}>იტვირთება…</p>}
      {main.map((s, i) => (
        <p
          key={s.id}
          ref={i === hit ? hitRef : undefined}
          data-cited-passage={i === hit ? 'true' : undefined}
          className={`text-[17px] leading-loose mb-2 rounded px-1 ${ink}`}
          style={i === hit ? { background: 'var(--reference-target-highlight, rgba(245,168,28,0.22))' } : undefined}
        >
          {s.hebrewText}
        </p>
      ))}
      {renderComments('רש״י', dafData.rashi || [])}
      {renderComments('תוספות', dafData.tosafot || [])}
    </div>
  );
};
