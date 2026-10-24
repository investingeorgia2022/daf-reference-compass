// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Award,
  Heart,
  Timer,
  GitMerge,
  Type,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowUpRight,
  Maximize2,
  Plus,
  Trash2,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import {
  EIN_YAAKOV_AGGADAH_TREASURY,
  GEMATRIA_EQUIVALENCES,
  SEMICHA_EXAM_QUESTIONS,
} from '../data/nextGenTwelveFeaturesData';
import { SharedPart3Props } from './WorldClassModulesPart3';
import { SearchableSelect } from './SearchableSelect';
import { sanitizeGeorgianText } from '../utils/georgianTranslator';

/* ============================================================================
 * FEATURE #17: გემატრიის, ნოტარიკონისა და აგადური საიდუმლოებების ლაბორატორია
 * ============================================================================ */
const HEBREW_GEMATRIA_MAP: Record<string, number> = {
  א: 1,
  ב: 2,
  ג: 3,
  ד: 4,
  ה: 5,
  ו: 6,
  ז: 7,
  ח: 8,
  ט: 9,
  י: 10,
  כ: 20,
  ך: 20,
  ל: 30,
  מ: 40,
  ם: 40,
  נ: 50,
  ן: 50,
  ס: 60,
  ע: 70,
  פ: 80,
  ף: 80,
  צ: 90,
  ץ: 90,
  ק: 100,
  ר: 200,
  ש: 300,
  ת: 400,
};

const ATBASH_MAP: Record<string, string> = {
  א: 'ת',
  ב: 'ש',
  ג: 'ר',
  ד: 'ק',
  ה: 'צ',
  ו: 'פ',
  ז: 'ע',
  ח: 'ס',
  ט: 'נ',
  י: 'מ',
  כ: 'ל',
  ך: 'ל',
  ל: 'כ',
  מ: 'י',
  ם: 'י',
  נ: 'ט',
  ן: 'ט',
  ס: 'ח',
  ע: 'ז',
  פ: 'ו',
  ף: 'ו',
  צ: 'ה',
  ץ: 'ה',
  ק: 'ד',
  ר: 'ג',
  ש: 'ב',
  ת: 'א',
};

function computeGematriaDetails(input: string) {
  const cleanLetters = input.replace(/[^א-ת]/g, '');
  let standard = 0;
  let katan = 0;
  let atbashStr = '';
  const breakdown: { char: string; val: number }[] = [];

  for (const ch of cleanLetters) {
    const val = HEBREW_GEMATRIA_MAP[ch] || 0;
    standard += val;
    const reduced = val > 0 ? ((val - 1) % 9) + 1 : 0;
    katan += reduced;
    atbashStr += ATBASH_MAP[ch] || ch;
    breakdown.push({ char: ch, val });
  }

  return {
    standard,
    katan,
    letterCount: cleanLetters.length,
    withKolel: standard + (cleanLetters.length > 0 ? 1 : 0),
    atbashStr,
    breakdown,
  };
}

export const GematriaNotarikonLabPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onOpenFullscreen,
}) => {
  const [hebrewInput, setHebrewInput] = useState<string>('גשם');

  const stats = useMemo(() => computeGematriaDetails(hebrewInput), [hebrewInput]);

  const presetWords = [
    { word: 'גשם', labelKa: 'გეშემ (წვიმა = 343)' },
    { word: 'טל', labelKa: 'ტალ (ნამი = 39)' },
    { word: 'בכור', labelKa: 'ბექორ (პირმშო = 228)' },
    { word: 'תורה', labelKa: 'თორა (611)' },
    { word: 'תפילה', labelKa: 'თფილა (ლოცვა = 515)' },
    { word: 'חיים', labelKa: 'ხაიმ (სიცოცხლე = 68)' },
  ];

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            17. გემატრიის, ნოტარიკონისა და ათბაშის (א״ת ב״ש) ინტერაქტიული ლაბორატორია
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {presetWords.map((item) => (
            <button
              key={item.word}
              type="button"
              onClick={() => setHebrewInput(item.word)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer border ${
                hebrewInput === item.word
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/30'
              }`}
            >
              <span dir="rtl" className="font-serif font-extrabold mr-1">
                {item.word}
              </span>
              <span>· {item.labelKa}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          dir="rtl"
          value={hebrewInput}
          onChange={(e) => setHebrewInput(e.target.value)}
          placeholder="ჩაწერეთ ნებისმიერი ებრაული სიტყვა ან ფასუკი..."
          className={`w-full px-3.5 py-2.5 rounded-xl border font-serif text-lg font-bold ${
            isDark
              ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
              : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
          }`}
        />

        {/* 4 Gematria Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">მისფარ ჰეხრახი (רגיל)</div>
            <div className="text-xl font-black text-[#C49A6C] tabular-nums">{stats.standard}</div>
          </div>
          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">კოლელით (+1)</div>
            <div className="text-xl font-black text-emerald-400 tabular-nums">
              {stats.withKolel}
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">მისფარ კატანი (קטן)</div>
            <div className="text-xl font-black text-amber-400 tabular-nums">{stats.katan}</div>
          </div>
          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">ათბაში (א״ת ב״ש)</div>
            <div dir="rtl" className="text-lg font-serif font-black text-sky-400">
              {stats.atbashStr || '—'}
            </div>
          </div>
        </div>

        {/* Letter-by-letter Breakdown */}
        {stats.breakdown.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1" dir="rtl">
            {stats.breakdown.map((b, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#6B4226]/20 border border-[#C49A6C]/40 text-xs font-bold"
              >
                <span className="font-serif text-sm">{b.char}</span> = {b.val}
              </span>
            ))}
          </div>
        )}

        {/* Classic Talmudic Gematria Equivalences */}
        <div className="space-y-2 pt-2 border-t border-[#8B5A2B]/25">
          <div className="text-xs font-extrabold text-[#C49A6C]">
            კლასიკური გემატრიული პარალელები შასსა და აგადაში:
          </div>
          {GEMATRIA_EQUIVALENCES.map((eq, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#C49A6C]">
                  გემატრია: {eq.value} • {eq.wordsKa.join(' ⇄ ')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenFullscreen({
                      title: `გემატრია ${eq.value}`,
                      subtitle: eq.wordsKa.join(' ⇄ '),
                      hebrewText: eq.wordsHe.join(' = '),
                      georgianText: eq.aggadicInsightKa,
                    })
                  }
                  className="p-1 rounded border border-[#8B5A2B]/35 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs leading-relaxed opacity-90">{eq.aggadicInsightKa}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #18: „იეშივის გამოცდა და სმიხის (סמיכה) სერტიფიკატი“
 * ============================================================================ */
export const YeshivaSemichaExamPanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameHe,
  tractateNameKa,
  isDark,
  onOpenFullscreen,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [scholarName, setScholarName] = useState<string>('חבר בית המדרש • თორის შემსწავლელი');

  const correctCount = useMemo(() => {
    return SEMICHA_EXAM_QUESTIONS.reduce((acc, q) => {
      const picked = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      return acc + (picked && correctOpt && picked === correctOpt.id ? 1 : 0);
    }, 0);
  }, [selectedAnswers]);

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              18. იეშივის გამოცდა (ბეკიუთი • იუნი • ჰორაა) და სმიხის (סמיכה) სიგელი
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold">
            შედეგი: {correctCount} / {SEMICHA_EXAM_QUESTIONS.length}
          </span>
        </div>

        <div className="space-y-3">
          {SEMICHA_EXAM_QUESTIONS.map((q) => {
            const picked = selectedAnswers[q.id];
            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
                }`}
              >
                <div className="text-[11px] font-extrabold text-[#C49A6C]">{q.tierLabelKa}</div>
                <div dir="rtl" className="font-serif text-sm font-bold">
                  {q.questionHe}
                </div>
                <div className="text-xs font-bold">{q.questionKa}</div>

                <div className="space-y-1.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = picked === opt.id;
                    let btnStyle = isDark
                      ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C]'
                      : 'bg-white border-[#CBB89D] hover:border-[#6B4226]';
                    if (picked) {
                      if (opt.isCorrect) {
                        btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                      } else if (isSelected && !opt.isCorrect) {
                        btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                      }
                    }
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${btnStyle}`}
                      >
                        {opt.textKa}
                      </button>
                    );
                  })}
                </div>

                {picked && (
                  <div className="p-2.5 rounded-xl bg-[#6B4226]/20 border border-[#C49A6C]/40 text-xs">
                    {q.explanationKa}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Official Semicha & Mastery Certificate */}
        <div
          className={`p-4 rounded-2xl border-2 space-y-2.5 text-center ${
            isDark
              ? 'bg-gradient-to-br from-[#23170F] via-[#2D1E14] to-[#1D130D] border-[#C49A6C]'
              : 'bg-gradient-to-br from-[#FDF8EE] via-[#F5E9D3] to-[#EAD7B7] border-[#8B5A2B]'
          }`}
        >
          <div dir="rtl" className="font-serif text-lg font-black text-[#C49A6C]">
            תְּעוּדַת סְמִיכָה וְהוֹקָרָה בְּתַלְמוּד בַּבְלִי
          </div>
          <div className="text-xs font-extrabold uppercase tracking-wider">
            ბაბილონის თალმუდის დახელოვნებისა და სმიხის საპატიო სიგელი
          </div>
          <input
            type="text"
            value={scholarName}
            onChange={(e) => setScholarName(e.target.value)}
            className={`mx-auto max-w-xs w-full text-center px-3 py-1.5 rounded-xl border text-xs font-extrabold ${
              isDark
                ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
                : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
            }`}
          />
          <p className="text-xs leading-relaxed opacity-90">
            დასტურდება, რომ <strong>{scholarName}</strong> ღრმად გაეცნო ტრაქტატ{' '}
            <strong>
              {tractateNameKa} ({tractateNameHe})
            </strong>{' '}
            დაფ {dafData.dafId}-ის მიშნას, გემარას, რაშისა და თოსაფოთს (შეფასება: {correctCount}/
            {SEMICHA_EXAM_QUESTIONS.length}).
          </p>
          <button
            type="button"
            onClick={() =>
              onOpenFullscreen({
                title: 'תעודת סמיכה והוקרה • იეშივის სმიხის სიგელი',
                subtitle: `${tractateNameKa} ${dafData.dafId} • ${scholarName}`,
                hebrewText: `תעודת סמיכה והוקרה\nזאת לתעודה כי ${scholarName} עסק בתורה לשמה במסכת ${tractateNameHe} דף ${dafData.dafId} בבקיאות, בעיון ובהלכה למעשה.`,
                georgianText: `საპატიო სიგელი გადაეცემა: ${scholarName}\nტრაქტატი: ${tractateNameKa} (${dafData.dafId})\nგამოცდის შედეგი: ${correctCount} / ${SEMICHA_EXAM_QUESTIONS.length} (ბეკიუთი, იუნი და ჰალახა).`,
              })
            }
            className="mx-auto px-4 py-2 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>სიგელის სრულ ეკრანზე გახსნა</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #19: „ეინ იაკოვი“ — თალმუდური სიბრძნის, იგავებისა და მუსარის საგანძური
 * ============================================================================ */
export const EinYaakovAggadahPanel: React.FC<SharedPart3Props> = ({
  isDark,
  onNavigateToDaf,
  onOpenFullscreen,
}) => {
  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-2 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            19. „ეინ იაკოვი“ (עין יעקב) — თალმუდური აგადის, მაჰარშას სიღრმისა და მუსარის საგანძური
          </span>
        </div>
        <p className="text-xs opacity-85">
          ბაბილონის თალმუდის სულიერი გული: იგავები, ფილოსოფიური განმარტებანი (מהרש״א) და ყოველდღიური
          ზნეობრივი დასკვნა (מוסר השכל).
        </p>
      </div>

      {EIN_YAAKOV_AGGADAH_TREASURY.map((entry) => (
        <div
          key={entry.id}
          className={`p-4 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#1D130D]/95 border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#8B5A2B]/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8B5A2B]/25 pb-2">
            <div>
              <div className="text-sm font-black text-[#C49A6C]">{entry.titleKa}</div>
              <div className="text-[11px] opacity-80">
                {entry.sourceRefKa} ({entry.sourceRefHe})
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onNavigateToDaf && (
                <button
                  type="button"
                  onClick={() => onNavigateToDaf(entry.tractateId, entry.dafId)}
                  className="px-2.5 py-1 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <span>დაფზე ({entry.dafId})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onOpenFullscreen({
                    title: entry.titleKa,
                    subtitle: entry.sourceRefKa,
                    hebrewText: entry.hebrewText,
                    georgianText: `${entry.literaryTranslationKa}\n\n${entry.maharshaDepthKa}\n\n${entry.mussarHaskelKa}`,
                  })
                }
                className="p-1.5 rounded-lg border border-[#8B5A2B]/40 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div dir="rtl" className="font-serif text-base font-bold leading-relaxed">
            {entry.hebrewText}
          </div>
          <div className="text-xs leading-relaxed font-medium">{entry.literaryTranslationKa}</div>

          <div className="p-2.5 rounded-xl bg-[#6B4226]/20 border border-[#C49A6C]/40 text-xs">
            <strong className="text-[#C49A6C]">חדושי אגדות מהרש״א:</strong> {entry.maharshaDepthKa}
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/40 text-xs">
            <strong className="text-emerald-400">מוסר השכל:</strong> {entry.mussarHaskelKa}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
 * FEATURE #20: „ხავრუთა-ტაიმერი (სედერ-ტაიმერი) და სწავლის უწყვეტი სტრიქი“
 * ============================================================================ */
function playBeitMidrashChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.82);
  } catch {
    // ignore audio restrictions
  }
}

export const ChavrutaSederTimerPanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameKa,
  isDark,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [completedSedarim, setCompletedSedarim] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('talmud-completed-sedarim-v1') || '3');
    } catch {
      return 3;
    }
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playBeitMidrashChime();
          setCompletedSedarim((c) => {
            const next = c + 1;
            try {
              localStorage.setItem('talmud-completed-sedarim-v1', String(next));
            } catch {
              // ignore
            }
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="space-y-3">
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#C49A6C]" />
            <span className="text-xs font-extrabold">
              20. „ხავრუთა-ტაიმერი“ (სედერ-ტაიმერი) და იეშივის ფოკუს-სესიები
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold">
            დასრულებული სედერები: {completedSedarim} 🔥
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { min: 45, label: '45 წთ • კლასიკური სედერი' },
            { min: 25, label: '25 წთ • დაფ იომის სპრინტი' },
            { min: 15, label: '15 წთ • ხაზარა (გამეორება)' },
            { min: 60, label: '60 წთ • ღრმა იუნი' },
          ].map((preset) => (
            <button
              key={preset.min}
              type="button"
              onClick={() => {
                setRunning(false);
                setDurationMinutes(preset.min);
                setSecondsLeft(preset.min * 60);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border ${
                durationMinutes === preset.min
                  ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                  : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div
          className={`p-5 rounded-2xl border text-center space-y-3 ${
            isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
          }`}
        >
          <div className="text-xs font-bold text-[#C49A6C]">
            მიმდინარე სედერი: {tractateNameKa} • დაფი {dafData.dafId}
          </div>
          <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-wider">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                playBeitMidrashChime();
                setRunning((r) => !r);
              }}
              className="px-4 py-2 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{running ? 'პაუზა' : 'სედერის დაწყება'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(durationMinutes * 60);
              }}
              className="px-3 py-2 rounded-xl border border-[#8B5A2B]/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>განულება</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #21: „შაქლა ვეტარიას“ ცოცხალი გონებრივი რუკა (Sugya Flowchart Builder)
 * ============================================================================ */
interface CustomFlowNode {
  id: string;
  stageLabelKa: string;
  textKa: string;
}

export const SugyaFlowchartBuilderPanel: React.FC<SharedPart3Props> = ({
  dafData,
  tractateNameKa,
  isDark,
  onHighlightSentence,
}) => {
  const [newStage, setNewStage] = useState<string>('კუშია (קושיא)');
  const [newText, setNewText] = useState<string>('');
  const [customNodes, setCustomNodes] = useState<CustomFlowNode[]>([]);

  const builtInNodes = useMemo(() => {
    const list = [
      ...dafData.mishnah.map((m) => ({
        id: m.id,
        badgeHe: 'משנה',
        stageKa: 'მიშნა • საწყისი ჰალახა',
        hebrew: m.hebrewText,
        georgian: sanitizeGeorgianText(m.translationKa || m.explanationKa),
      })),
      ...dafData.gemara.map((g, i) => ({
        id: g.id,
        badgeHe: g.sugyaStage?.labelHe || (i % 2 === 0 ? 'קושיא' : 'תירוץ'),
        stageKa:
          g.sugyaStage?.labelKa || (i % 2 === 0 ? 'კუშია • კითხვა' : 'თერუცი • გადაჭრა'),
        hebrew: g.hebrewText,
        georgian: sanitizeGeorgianText(g.translationKa || g.explanationKa),
      })),
    ];
    return list;
  }, [dafData]);

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            21. „შაქლა ვეტარიას“ ცოცხალი გონებრივი რუკა — სუგიის ლოგიკური ხე ({tractateNameKa}{' '}
            {dafData.dafId})
          </span>
        </div>

        {/* Visual Flowchart Chain */}
        <div className="space-y-2">
          {builtInNodes.map((node, idx) => (
            <div key={node.id} className="space-y-1">
              <div
                onClick={() => onHighlightSentence(node.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#241810] border-[#5C3A21] hover:border-[#C49A6C]'
                    : 'bg-[#F5EBD6] border-[#CBB89D] hover:border-[#6B4226]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-[#C49A6C]">
                    ნაბიჯი #{idx + 1} · {node.stageKa}
                  </span>
                  <span dir="rtl" className="font-serif text-xs font-bold px-2 py-0.5 rounded bg-[#6B4226]/25">
                    {node.badgeHe}
                  </span>
                </div>
                <div dir="rtl" className="font-serif text-sm font-bold mb-1">
                  {node.hebrew}
                </div>
                <div className="text-xs opacity-90">{node.georgian}</div>
              </div>
              {idx < builtInNodes.length - 1 && (
                <div className="text-center text-xs font-black text-[#C49A6C]">↓</div>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Flowchart Node */}
        <div className="pt-2 border-t border-[#8B5A2B]/25 space-y-2">
          <div className="text-xs font-extrabold text-[#C49A6C]">
            დაამატეთ თქვენი ლოგიკური კვანძი სუგიის რუკას:
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-[160px] min-w-0">
              <SearchableSelect
                value={newStage}
                onChange={(val) => setNewStage(val)}
                options={[
                  { value: 'კუშია (קושיא)', badgeHe: 'קושיא', label: 'კუშია (קושיא)' },
                  { value: 'ფირხა (פירכא)', badgeHe: 'פירכא', label: 'ფირხა (פירכא)' },
                  { value: 'თერუცი (תירוץ)', badgeHe: 'תירוץ', label: 'თერუცი (תירוץ)' },
                  { value: 'მასკანა (מסקנא)', badgeHe: 'מסקנא', label: 'მასკანა (מסקנא)' },
                ]}
                isDark={isDark}
                compact
                searchPlaceholder="კვანძი..."
              />
            </div>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="ჩაწერეთ ლოგიკური არგუმენტი..."
              className={`flex-1 min-w-[180px] px-3 py-2 rounded-xl border text-xs ${
                isDark
                  ? 'bg-[#241810] border-[#5C3A21] text-[#FAF5EB]'
                  : 'bg-white border-[#8B5A2B]/40 text-[#2C1A10]'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (!newText.trim()) return;
                setCustomNodes((prev) => [
                  ...prev,
                  { id: `cn-${Date.now()}`, stageLabelKa: newStage, textKa: newText.trim() },
                ]);
                setNewText('');
              }}
              className="px-3 py-2 rounded-xl bg-[#6B4226] text-[#FBF7F0] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>დამატება</span>
            </button>
          </div>
          {customNodes.map((cn) => (
            <div
              key={cn.id}
              className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/40 flex items-center justify-between text-xs"
            >
              <div>
                <strong className="text-emerald-400">{cn.stageLabelKa}:</strong> {cn.textKa}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCustomNodes((prev) => prev.filter((item) => item.id !== cn.id))
                }
                className="text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE #22: „სოფერის ოსტატობა“ — რაშის შრიფტისა და ראשי תיבות-ის ტრენაჟორი
 * ============================================================================ */
const RASHI_CONFUSABLE_PAIRS = [
  {
    pairHe: 'א ⇄ ח',
    nameKa: 'ალეფი და ხეთი',
    tipKa: 'რაშის შრიფტში ალეფს (א) აქვს ზედა მარჯვენა განშტოება, ხოლო ხეთი (ח) შეკრული თაღია.',
  },
  {
    pairHe: 'ב ⇄ כ',
    nameKa: 'ბეთი და ქაფი',
    tipKa: 'ბეთს (ב) ქვედა მარჯვენა კუთხე მკვეთრი აქვს, ქაფი (כ) კი მომრგვალებულია.',
  },
  {
    pairHe: 'ד ⇄ ר',
    nameKa: 'დალეთი და რეში',
    tipKa: 'დალეთს (ד) ზედა მარჯვენა კუთხე წამოწეული აქვს, რეში (ר) კი გლუვი რკალია.',
  },
  {
    pairHe: 'ם ⇄ ס',
    nameKa: 'მემ-სოფითი და სამეხი',
    tipKa: 'სამეხს (ס) ქვედა მარცხენა მხარეს მცირე კუდი აქვს, მემ-სოფითი (ם) კი სწორია.',
  },
  {
    pairHe: 'ע ⇄ ט',
    nameKa: 'აინი და ტეთი',
    tipKa: 'აინს (ע) ქვემოთ გრძელი დახრილი ფეხი ეშვება, ტეთი (ט) კი ქვემოთ შეკრულია.',
  },
];

const RASHEI_TEVOT_ITEMS = [
  { abbrHe: 'ד״ה', fullHe: 'דִּבּוּר הַמַּתְחִיל', meaningKa: 'დიბურ ჰამათხილ — საწყისი ციტატა რაშისა და თოსაფოთში' },
  { abbrHe: 'אא״כ', fullHe: 'אֶלָּא אִם כֵּן', meaningKa: 'ელა იმ ქენ — გარდა იმ შემთხვევისა, თუ...' },
  { abbrHe: 'קמ״ל', fullHe: 'קָא מַשְׁמַע לָן', meaningKa: 'კა მაშმა ლან — ამით გვასწავლის თანაი ან ამორაი' },
  { abbrHe: 'ה״א', fullHe: 'הֲוָה אָמִינָא', meaningKa: 'ჰავა ამინა — თავდაპირველი ვარაუდი სუგიაში' },
  { abbrHe: 'ת״ר', fullHe: 'תָּנוּ רַבָּנָן', meaningKa: 'თანუ რაბანან — ასწავლეს ჩვენმა ბრძენებმა (ბარაითა)' },
  { abbrHe: 'וא״ת', fullHe: 'וְאִם תֹּאמַר', meaningKa: 'ვეიმ თომარ — „და თუ იტყვი“ (თოსაფოთის კითხვა)' },
  { abbrHe: 'וי״ל', fullHe: 'וְיֵשׁ לוֹמַר', meaningKa: 'ვეიეშ ლომარ — „შეიძლება ითქვას“ (თოსაფოთის პასუხი)' },
  { abbrHe: 'ש״מ', fullHe: 'שְׁמַע מִינַּהּ', meaningKa: 'შმა მინა — აქედან დაასკვენი!' },
];

export const SoferRashiScriptTrainerPanel: React.FC<SharedPart3Props> = ({ isDark }) => {
  const [selectedAbbr, setSelectedAbbr] = useState(RASHEI_TEVOT_ITEMS[0]);

  return (
    <div className="space-y-3">
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
            : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[#C49A6C]" />
          <span className="text-xs font-extrabold">
            22. „სოფერის ოსტატობა“ — რაშის შრიფტისა და ראשי תיבות-ის ინტერაქტიული ტრენაჟორი
          </span>
        </div>

        {/* Confusable Rashi Script Pairs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RASHI_CONFUSABLE_PAIRS.map((p, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#C49A6C]">{p.nameKa}</span>
                <span dir="rtl" className="text-base font-serif font-black">
                  {p.pairHe}
                </span>
              </div>
              <div className="text-xs opacity-90">{p.tipKa}</div>
            </div>
          ))}
        </div>

        {/* Rashei Tevot Interactive Decoder */}
        <div className="pt-2 border-t border-[#8B5A2B]/25 space-y-2">
          <div className="text-xs font-extrabold text-[#C49A6C]">
            „რაშეი თევოთ“ (ראשי תיבות) — დააწკაპუნეთ აბრევიატურაზე გასაშიფრად:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RASHEI_TEVOT_ITEMS.map((item) => (
              <button
                key={item.abbrHe}
                type="button"
                onClick={() => setSelectedAbbr(item)}
                className={`px-3 py-1.5 rounded-xl font-serif text-sm font-black cursor-pointer border ${
                  selectedAbbr.abbrHe === item.abbrHe
                    ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C]'
                    : 'bg-[#6B4226]/15 border-[#8B5A2B]/35'
                }`}
              >
                {item.abbrHe}
              </button>
            ))}
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-1 ${
              isDark ? 'bg-[#241810] border-[#5C3A21]' : 'bg-[#F5EBD6] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span dir="rtl" className="font-serif text-lg font-black text-[#C49A6C]">
                {selectedAbbr.abbrHe} = {selectedAbbr.fullHe}
              </span>
            </div>
            <div className="text-xs font-bold">{selectedAbbr.meaningKa}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
