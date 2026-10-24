// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { X, Check, RotateCcw, History, ArrowRight, Sliders, Hash } from 'lucide-react';
import { SEDARIM, TRACTATES, toHebrewDafNumber } from '../data/tractates';
import { RecentlyViewedDaf } from '../types/talmud';

export type { RecentlyViewedDaf };

export interface CascadingTalmudMishnahSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSederId?: string;
  initialTractateId?: string;
  initialDafId?: string;
  initialChapter?: number;
  initialMishnah?: number;
  onSelectDaf?: (tractateId: string, dafId: string) => void;
  onSelectMishnah?: (tractateId: string, chapter: number, mishnah: number) => void;
  recentlyViewedDapim?: RecentlyViewedDaf[];
  onClearHistory?: () => void;
  isDark?: boolean;
  theme?: string;
}

// Complete Mishnah Tractate Catalog (all 63 tractates of the Shishah Sidrei Mishnah)
interface MishnahTractateMeta {
  id: string;
  sederId: string;
  nameKa: string;
  nameHe: string;
  chapters: number;
}

const ALL_MISHNAH_TRACTATES: MishnahTractateMeta[] = [
  // ZERAIM (11) — All 11 tractates of Seder Zeraim
  { id: 'Berakhot', sederId: 'zeraim', nameKa: 'ბერახოთი', nameHe: 'ברכות', chapters: 9 },
  { id: 'Peah', sederId: 'zeraim', nameKa: 'ფეა', nameHe: 'פאה', chapters: 8 },
  { id: 'Demai', sederId: 'zeraim', nameKa: 'დემაი', nameHe: 'דמאי', chapters: 7 },
  { id: 'Kilayim', sederId: 'zeraim', nameKa: 'კილაიიმი', nameHe: 'כלאים', chapters: 9 },
  { id: 'Sheviit', sederId: 'zeraim', nameKa: 'შევიითი', nameHe: 'שביעית', chapters: 10 },
  { id: 'Terumot', sederId: 'zeraim', nameKa: 'ტერუმოთი', nameHe: 'תרומות', chapters: 11 },
  { id: 'Maaserot', sederId: 'zeraim', nameKa: 'მაასეროთი', nameHe: 'מעשרות', chapters: 5 },
  { id: 'Maaser_Sheni', sederId: 'zeraim', nameKa: 'მაასერ შენი', nameHe: 'מעשר שני', chapters: 5 },
  { id: 'Challah', sederId: 'zeraim', nameKa: 'ხალა', nameHe: 'חלה', chapters: 4 },
  { id: 'Orlah', sederId: 'zeraim', nameKa: 'ორლა', nameHe: 'ערלה', chapters: 3 },
  { id: 'Bikkurim', sederId: 'zeraim', nameKa: 'ბიკურიმი', nameHe: 'ביכורים', chapters: 4 },

  // MOED (12)
  { id: 'Shabbat', sederId: 'moed', nameKa: 'შაბათი', nameHe: 'שבת', chapters: 24 },
  { id: 'Eruvin', sederId: 'moed', nameKa: 'ყერუვინი', nameHe: 'עירובין', chapters: 10 },
  { id: 'Pesachim', sederId: 'moed', nameKa: 'ფესახიმი', nameHe: 'פסחים', chapters: 10 },
  { id: 'Shekalim', sederId: 'moed', nameKa: 'შეკალიმი', nameHe: 'שקלים', chapters: 8 },
  { id: 'Yoma', sederId: 'moed', nameKa: 'იომა', nameHe: 'יומא', chapters: 8 },
  { id: 'Sukkah', sederId: 'moed', nameKa: 'სუქა', nameHe: 'סוכה', chapters: 5 },
  { id: 'Beitzah', sederId: 'moed', nameKa: 'ბეცა', nameHe: 'ביצה', chapters: 5 },
  { id: 'Rosh_Hashanah', sederId: 'moed', nameKa: 'როშ ჰაშანა', nameHe: 'ראש השנה', chapters: 4 },
  { id: 'Taanit', sederId: 'moed', nameKa: 'თაყანითი', nameHe: 'תענית', chapters: 4 },
  { id: 'Megillah', sederId: 'moed', nameKa: 'მეგილა', nameHe: 'מגילה', chapters: 4 },
  { id: 'Moed_Katan', sederId: 'moed', nameKa: 'მოყედ კატანი', nameHe: 'מועד קטן', chapters: 3 },
  { id: 'Chagigah', sederId: 'moed', nameKa: 'ხაგიგა', nameHe: 'חגיגה', chapters: 3 },

  // NASHIM (7)
  { id: 'Yevamot', sederId: 'nashim', nameKa: 'იევამოთი', nameHe: 'יבמות', chapters: 16 },
  { id: 'Ketubot', sederId: 'nashim', nameKa: 'ქეთუბოთი', nameHe: 'כתובות', chapters: 13 },
  { id: 'Nedarim', sederId: 'nashim', nameKa: 'ნედარიმი', nameHe: 'נדרים', chapters: 11 },
  { id: 'Nazir', sederId: 'nashim', nameKa: 'ნაზირი', nameHe: 'נזיר', chapters: 9 },
  { id: 'Sotah', sederId: 'nashim', nameKa: 'სოტა', nameHe: 'סוטה', chapters: 9 },
  { id: 'Gittin', sederId: 'nashim', nameKa: 'გიტინი', nameHe: 'גיטין', chapters: 9 },
  { id: 'Kiddushin', sederId: 'nashim', nameKa: 'კიდუშინი', nameHe: 'קידושין', chapters: 4 },

  // NEZIKIN (10)
  { id: 'Bava_Kamma', sederId: 'nezikin', nameKa: 'ბავა კამა', nameHe: 'בבא קמא', chapters: 10 },
  { id: 'Bava_Metzia', sederId: 'nezikin', nameKa: 'ბავა მეცია', nameHe: 'בבא מציעא', chapters: 10 },
  { id: 'Bava_Batra', sederId: 'nezikin', nameKa: 'ბავა ბათრა', nameHe: 'בבא בתרא', chapters: 10 },
  { id: 'Sanhedrin', sederId: 'nezikin', nameKa: 'სანჰედრინი', nameHe: 'סנהדרין', chapters: 11 },
  { id: 'Makkot', sederId: 'nezikin', nameKa: 'მაკოთი', nameHe: 'מכות', chapters: 3 },
  { id: 'Shevuot', sederId: 'nezikin', nameKa: 'შევუოთი', nameHe: 'שבועות', chapters: 8 },
  { id: 'Eduyot', sederId: 'nezikin', nameKa: 'ედუიოთი', nameHe: 'עדויות', chapters: 8 },
  { id: 'Avodah_Zarah', sederId: 'nezikin', nameKa: 'ავოდა ზარა', nameHe: 'עבודה זרה', chapters: 5 },
  { id: 'Avot', sederId: 'nezikin', nameKa: 'პირკეი ავოთი', nameHe: 'אבות', chapters: 6 },
  { id: 'Horayot', sederId: 'nezikin', nameKa: 'ჰორაიოთი', nameHe: 'הוריות', chapters: 3 },

  // KODASHIM (11)
  { id: 'Zevachim', sederId: 'kodashim', nameKa: 'ზევახიმი', nameHe: 'זבחים', chapters: 14 },
  { id: 'Menachot', sederId: 'kodashim', nameKa: 'მენახოთი', nameHe: 'מנחות', chapters: 13 },
  { id: 'Chullin', sederId: 'kodashim', nameKa: 'ხულინი', nameHe: 'חולין', chapters: 12 },
  { id: 'Bekhorot', sederId: 'kodashim', nameKa: 'ბეხოროთი', nameHe: 'בכורות', chapters: 9 },
  { id: 'Arakhin', sederId: 'kodashim', nameKa: 'არახინი', nameHe: 'ערכין', chapters: 9 },
  { id: 'Temurah', sederId: 'kodashim', nameKa: 'თემურა', nameHe: 'תמורה', chapters: 7 },
  { id: 'Keritot', sederId: 'kodashim', nameKa: 'კერითოთი', nameHe: 'כריתות', chapters: 6 },
  { id: 'Meilah', sederId: 'kodashim', nameKa: 'მეყილა', nameHe: 'מעילה', chapters: 6 },
  { id: 'Tamid', sederId: 'kodashim', nameKa: 'თამიდი', nameHe: 'תמיד', chapters: 7 },
  { id: 'Middot', sederId: 'kodashim', nameKa: 'მიდოთი', nameHe: 'מידות', chapters: 5 },
  { id: 'Kinnim', sederId: 'kodashim', nameKa: 'კინინი', nameHe: 'קינים', chapters: 3 },

  // TAHAROT (12)
  { id: 'Kelim', sederId: 'taharot', nameKa: 'კელიმი', nameHe: 'כלים', chapters: 30 },
  { id: 'Oholot', sederId: 'taharot', nameKa: 'ოჰოლოთი', nameHe: 'אהלות', chapters: 18 },
  { id: 'Negaim', sederId: 'taharot', nameKa: 'ნეგაიიმი', nameHe: 'נגעים', chapters: 14 },
  { id: 'Parah', sederId: 'taharot', nameKa: 'პარა', nameHe: 'פרה', chapters: 12 },
  { id: 'Taharot', sederId: 'taharot', nameKa: 'ტაჰაროთი', nameHe: 'טהרות', chapters: 10 },
  { id: 'Mikvaot', sederId: 'taharot', nameKa: 'მიკვაოთი', nameHe: 'מקוואות', chapters: 10 },
  { id: 'Niddah', sederId: 'taharot', nameKa: 'ნიდა', nameHe: 'נידה', chapters: 10 },
  { id: 'Makhshirin', sederId: 'taharot', nameKa: 'მახშირინი', nameHe: 'מכשירין', chapters: 6 },
  { id: 'Zavim', sederId: 'taharot', nameKa: 'ზავიმი', nameHe: 'זבים', chapters: 5 },
  { id: 'Tevul_Yom', sederId: 'taharot', nameKa: 'ტევულ იომი', nameHe: 'טבול יום', chapters: 4 },
  { id: 'Yadayim', sederId: 'taharot', nameKa: 'იადაიიმი', nameHe: 'ידים', chapters: 4 },
  { id: 'Uktzin', sederId: 'taharot', nameKa: 'უკცინი', nameHe: 'עוקצין', chapters: 3 },
];

const MISHNAH_CHAPTER_COUNT_MAP: Record<string, number[]> = {
  Berakhot: [5, 8, 6, 7, 5, 8, 5, 8, 5],
  Peah: [6, 8, 8, 11, 8, 11, 8, 9],
  Demai: [4, 5, 6, 7, 11, 12, 8],
  Kilayim: [9, 11, 7, 9, 8, 9, 8, 6, 10],
  Sheviit: [8, 10, 10, 10, 9, 6, 7, 11, 9, 9],
  Terumot: [10, 6, 9, 13, 9, 6, 7, 12, 7, 12, 10],
  Maaserot: [8, 8, 10, 6, 8],
  Maaser_Sheni: [7, 10, 13, 12, 15],
  Challah: [9, 8, 10, 11],
  Orlah: [9, 17, 9],
  Bikkurim: [11, 11, 12, 5],
  Shabbat: [11, 7, 6, 2, 4, 10, 4, 7, 7, 6, 6, 6, 7, 4, 3, 8, 8, 3, 6, 5, 3, 6, 5, 5],
  Eruvin: [10, 6, 9, 11, 9, 10, 11, 11, 4, 15],
  Pesachim: [7, 8, 8, 9, 10, 6, 13, 8, 11, 9],
  Shekalim: [7, 5, 4, 9, 6, 6, 7, 8],
  Yoma: [8, 7, 11, 6, 7, 8, 5, 9],
  Sukkah: [11, 9, 15, 10, 8], // Perek 1 has 11 mishnayot (exactly as in screenshot!)
  Beitzah: [10, 10, 8, 7, 7],
  Rosh_Hashanah: [9, 9, 8, 9],
  Taanit: [7, 10, 9, 8],
  Megillah: [11, 6, 6, 10],
  Moed_Katan: [10, 5, 9],
  Chagigah: [8, 7, 8],
  Yevamot: [4, 10, 10, 13, 6, 6, 6, 6, 6, 9, 7, 6, 13, 9, 10, 7],
  Ketubot: [10, 10, 9, 12, 9, 7, 10, 8, 9, 6, 6, 4, 11],
  Nedarim: [4, 5, 11, 8, 6, 10, 9, 7, 10, 8, 12],
  Nazir: [7, 10, 7, 7, 7, 11, 4, 2, 5],
  Sotah: [9, 6, 8, 5, 5, 4, 8, 7, 15],
  Gittin: [6, 7, 8, 9, 9, 7, 9, 10, 10],
  Kiddushin: [10, 10, 13, 14],
  Bava_Kamma: [4, 6, 11, 9, 7, 6, 7, 7, 12, 10],
  Bava_Metzia: [8, 11, 12, 12, 11, 8, 11, 9, 13, 6],
  Bava_Batra: [6, 14, 8, 9, 11, 8, 4, 8, 10, 8],
  Sanhedrin: [6, 5, 8, 5, 5, 6, 11, 7, 6, 6, 6],
  Makkot: [10, 8, 16],
  Shevuot: [7, 5, 11, 13, 5, 7, 8, 6],
  Avot: [18, 16, 18, 22, 23, 11],
};

// Clean Hebrew numeral letter converter for Daf column (2-ב, 5-ה, 30-ל, etc.)
export const toCleanHebrewLetter = (num: number): string => {
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const h = Math.floor(num / 100);
  const rem = num % 100;
  if (rem === 15) return `${hundreds[h] || ''}טו`;
  if (rem === 16) return `${hundreds[h] || ''}טז`;
  const t = Math.floor(rem / 10);
  const o = rem % 10;
  return `${hundreds[h] || ''}${tens[t] || ''}${ones[o] || ''}`;
};

const cascadingModalContainerVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.36,
      ease: [0.32, 0.72, 0, 1] as const,
      when: 'afterChildren',
      staggerChildren: 0.045,
      staggerDirection: -1, // folds back in exact reverse order on close
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1] as const,
      when: 'beforeChildren',
      staggerChildren: 0.055, // sequentially appears one by one on open
      delayChildren: 0.03,
    },
  },
};

const cascadingModalItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.985,
    transition: {
      duration: 0.22,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const CascadingTalmudMishnahSelectorModal: React.FC<CascadingTalmudMishnahSelectorModalProps> = ({
  isOpen,
  onClose,
  initialSederId = 'moed',
  initialTractateId = 'Sukkah',
  initialDafId = '2a',
  initialChapter = 1,
  initialMishnah = 1,
  onSelectDaf,
  onSelectMishnah,
  recentlyViewedDapim,
  onClearHistory,
  isDark = false,
  theme,
}) => {
  // Mode: Default to 'talmud' (დაფი) as requested
  const [selectorMode, setSelectorMode] = useState<'mishnah' | 'talmud'>('talmud');

  // History of recently viewed Dapim (ბოლო დაფების ისტორია)
  const [historyList, setHistoryList] = useState<RecentlyViewedDaf[]>(() => {
    if (recentlyViewedDapim && recentlyViewedDapim.length > 0) return recentlyViewedDapim;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('talmud_recently_viewed_v1');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    if (recentlyViewedDapim && recentlyViewedDapim.length > 0) {
      setHistoryList(recentlyViewedDapim);
    } else if (isOpen && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('talmud_recently_viewed_v1');
        if (saved) setHistoryList(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [recentlyViewedDapim, isOpen]);

  // Helper to reliably find tractate in both lists regardless of casing or underscores
  const resolveTractateMeta = useCallback((trId?: string) => {
    if (!trId) return null;
    const clean = trId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      ALL_MISHNAH_TRACTATES.find((t) => t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) ||
      TRACTATES.find((t) => t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) ||
      ALL_MISHNAH_TRACTATES.find((t) => t.id === trId) ||
      TRACTATES.find((t) => t.id === trId) ||
      null
    );
  }, []);

  // Compute resolved initial Seder: The active tractate's OWN Seder always takes strict priority!
  const initialResolvedSeder = useMemo(() => {
    const tr = resolveTractateMeta(initialTractateId);
    if (tr?.sederId) return tr.sederId;
    if (initialSederId && initialSederId !== 'all') return initialSederId;
    return 'moed';
  }, [initialSederId, initialTractateId, resolveTractateMeta]);

  // Selected state for all 4 cascading columns
  const [selectedSederId, setSelectedSederId] = useState<string>(initialResolvedSeder);
  const [selectedTractateId, setSelectedTractateId] = useState<string>(() => {
    const tr = resolveTractateMeta(initialTractateId);
    return tr?.id || initialTractateId || 'Taanit';
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [selectedMishnah, setSelectedMishnah] = useState<number>(initialMishnah);

  // Talmud mode specific selections (Bavli folios ALWAYS start from 2-ב!)
  const [selectedDafNum, setSelectedDafNum] = useState<number>(() => {
    if (initialDafId) {
      const match = initialDafId.match(/^(\d+)/);
      if (match) return Math.max(2, parseInt(match[1], 10));
    }
    return 2;
  });
  const [selectedAmud, setSelectedAmud] = useState<'a' | 'b'>(() => {
    if (initialDafId && initialDafId.endsWith('b')) return 'b';
    return 'a';
  });

  const handleSelectRecentDaf = (item: RecentlyViewedDaf, jumpNow: boolean = false) => {
    const tr = resolveTractateMeta(item.tractateId);
    if (tr) {
      setSelectedSederId(tr.sederId);
      setSelectedTractateId(tr.id);
    }
    const match = item.dafId.match(/^(\d+)([ab]?)$/);
    if (match) {
      setSelectedDafNum(Math.max(2, parseInt(match[1], 10)));
      setSelectedAmud((match[2] as 'a' | 'b') || 'a');
    }
    setSelectorMode('talmud');

    if (jumpNow && onSelectDaf) {
      onSelectDaf(item.tractateId, item.dafId);
      onClose();
    }
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('talmud_recently_viewed_v1');
      } catch {
        // ignore
      }
    }
    onClearHistory?.();
  };

  // Sync with initial props whenever modal opens — guarantees focus is ALWAYS on the exact active Daf and tractate by default!
  useEffect(() => {
    if (isOpen) {
      setSelectorMode('talmud');
      const tr = resolveTractateMeta(initialTractateId);
      const targetSeder = tr?.sederId || (initialSederId !== 'all' ? initialSederId : 'moed');
      setSelectedSederId(targetSeder);

      const targetTrId = tr?.id || initialTractateId;
      if (targetTrId) {
        setSelectedTractateId(targetTrId);
      }
      if (initialChapter) setSelectedChapter(initialChapter);
      if (initialMishnah) setSelectedMishnah(initialMishnah);

      if (initialDafId) {
        const match = initialDafId.match(/^(\d+)([ab]?)$/);
        if (match) {
          const num = Math.max(2, parseInt(match[1], 10));
          setSelectedDafNum(num);
          setSelectedAmud((match[2] as 'a' | 'b') || 'a');
        }
      }
    }
  }, [isOpen, initialSederId, initialTractateId, initialDafId, initialChapter, initialMishnah, resolveTractateMeta]);

  // Auto-scroll the active/selected elements in each column into the center of view when the modal opens
  useEffect(() => {
    if (isOpen) {
      const scrollAllActiveColumns = () => {
        const columns = document.querySelectorAll('[data-cascading-column="true"]');
        columns.forEach((col) => {
          const active = col.querySelector('[data-cascading-active="true"]');
          if (active && col instanceof HTMLElement && active instanceof HTMLElement) {
            const colRect = col.getBoundingClientRect();
            const activeRect = active.getBoundingClientRect();
            const offsetDiff = activeRect.top - colRect.top;
            const targetScrollTop =
              col.scrollTop + offsetDiff - col.clientHeight / 2 + active.clientHeight / 2;
            col.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
          }
        });
      };
      const t1 = setTimeout(scrollAllActiveColumns, 40);
      const t2 = setTimeout(scrollAllActiveColumns, 150);
      const t3 = setTimeout(scrollAllActiveColumns, 380);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, selectedSederId, selectedTractateId, selectedDafNum, selectedAmud, selectorMode]);

  // Column 1: Sedarim list with clean names matching screenshot
  const sedarimList = useMemo(() => {
    return SEDARIM.map((s) => ({
      id: s.id,
      nameHe: s.nameHe.replace(/^סדר\s+/, ''),
      nameKa: s.nameKa.replace(/^სედერ\s+/, '').split(' (')[0],
      rawKa: s.nameKa,
    }));
  }, []);

  // Column 2: ALL tractates for the selected Seder
  const filteredTractates = useMemo(() => {
    const list = ALL_MISHNAH_TRACTATES.filter((t) => t.sederId === selectedSederId);
    if (list.length === 0) {
      return ALL_MISHNAH_TRACTATES.slice(0, 10);
    }
    return list;
  }, [selectedSederId]);

  // Current active tractate info
  const currentTractate = useMemo(() => {
    const cleanSel = (selectedTractateId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      ALL_MISHNAH_TRACTATES.find(
        (t) => t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSel
      ) ||
      TRACTATES.find(
        (t) => t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSel
      ) ||
      filteredTractates[0] ||
      ALL_MISHNAH_TRACTATES[0]
    );
  }, [selectedTractateId, filteredTractates]);

  const bavliMeta = useMemo(() => {
    return (
      TRACTATES.find((t) => t.id.toLowerCase() === currentTractate.id.toLowerCase()) ||
      TRACTATES.find((t) => t.nameKa === currentTractate.nameKa) ||
      TRACTATES[0]
    );
  }, [currentTractate]);

  const hasBavliGemara = Boolean(bavliMeta);

  // Column 3 (Mishnah Mode): Chapters for active tractate
  const chaptersList = useMemo(() => {
    const count = currentTractate.chapters || 5;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentTractate]);

  // Column 4 (Mishnah Mode): Mishnayot for active chapter
  const mishnayotList = useMemo(() => {
    const tractateChapterMap = MISHNAH_CHAPTER_COUNT_MAP[currentTractate.id];
    let count = 8;
    if (tractateChapterMap && tractateChapterMap[selectedChapter - 1]) {
      count = tractateChapterMap[selectedChapter - 1];
    }
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentTractate.id, selectedChapter]);

  // Column 3 (Talmud Mode): Daf numbers for active tractate
  // In Talmud Bavli, Daf 1 (1-א) DOES NOT EXIST! Daf numbering ALWAYS starts from 2-ב!
  const dafNumbersList = useMemo(() => {
    const last = bavliMeta?.lastDaf || 64;
    const count = Math.max(1, last - 1);
    return Array.from({ length: count }, (_, i) => i + 2);
  }, [bavliMeta]);

  // Handlers for cascading selections
  const handleSelectSeder = (sederId: string) => {
    setSelectedSederId(sederId);
    const tractatesInSeder = ALL_MISHNAH_TRACTATES.filter((t) => t.sederId === sederId);

    if (tractatesInSeder.length > 0) {
      const nextTr = tractatesInSeder[0];
      setSelectedTractateId(nextTr.id);
      setSelectedChapter(1);
      setSelectedMishnah(1);
      setSelectedDafNum(2);
      setSelectedAmud('a');
    }
  };

  const handleSelectTractate = (trId: string) => {
    setSelectedTractateId(trId);
    setSelectedChapter(1);
    setSelectedMishnah(1);
    setSelectedDafNum(2);
    setSelectedAmud('a');
  };

  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedMishnah(1);
  };

  const handleConfirmAndClose = () => {
    if (hasBavliGemara && selectorMode === 'talmud') {
      if (onSelectDaf) {
        const effectiveDaf = Math.max(2, selectedDafNum);
        onSelectDaf(selectedTractateId, `${effectiveDaf}${selectedAmud}`);
      }
    } else {
      if (onSelectMishnah) {
        onSelectMishnah(selectedTractateId, selectedChapter, selectedMishnah);
      } else if (onSelectDaf) {
        const lastD = bavliMeta?.lastDaf || 64;
        const totalCh = currentTractate.chapters || 5;
        const estDaf = Math.min(
          lastD,
          Math.max(2, Math.round((selectedChapter / totalCh) * (lastD - 2) + 2))
        );
        onSelectDaf(selectedTractateId, `${estDaf}a`);
      }
    }
    onClose();
  };

  const handleResetFilters = () => {
    setSelectedSederId('zeraim');
    setSelectedTractateId('Berakhot');
    setSelectedChapter(1);
    setSelectedMishnah(1);
    setSelectedDafNum(2);
    setSelectedAmud('a');
  };

  const isDafModeActive = hasBavliGemara && selectorMode === 'talmud';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cascading-selector-backdrop"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[320] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* MODAL SHEET (SLIDES UP AND DOWN WITH REVERSE STAGGERED CASCADING ANIMATION) */}
          <motion.div
            key="cascading-selector-sheet"
            variants={cascadingModalContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`w-full max-w-[640px] rounded-t-[26px] sm:rounded-[28px] border shadow-[0_-16px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[88vh] select-none backdrop-blur-2xl ${
              theme === 'celestial-slate'
                ? 'border-[#BED4EB] bg-[#F4F8FC]/98 text-[#1E293B] shadow-[0_-16px_50px_rgba(30,58,95,0.22)]'
                : 'border-[#4A3425] bg-[#1E1510]/98 text-[#FAF5EB]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ITEM 1: HEADER: MATCHES SERENE PALETTE */}
            <motion.div
              variants={cascadingModalItemVariants}
              className={`shrink-0 px-4 sm:px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b ${
                theme === 'celestial-slate'
                  ? 'bg-[#E2EDF8] border-[#BED4EB] text-[#1E293B]'
                  : 'bg-[#251A13] border-[#3E2B1E] text-[#FAF5EB]'
              }`}
            >
              <div className="flex items-center gap-2">
                <h2
                  className={`text-sm sm:text-base font-bold tracking-tight ${
                    theme === 'celestial-slate' ? 'text-[#0F172A]' : 'text-[#FAF5EB]'
                  }`}
                >
                  {selectorMode === 'mishnah' ? 'משנה • בחירת משנה - მიშნის არჩევა' : 'תלמוד • בחירת תלמוד - თალმუდის არჩევა'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Subtle Mode Switcher (მიშნა / დაფი) */}
                {hasBavliGemara && (
                  <div
                    className={`flex items-center rounded-xl p-0.5 border text-xs font-bold ${
                      theme === 'celestial-slate'
                        ? 'bg-[#DDE8F4] border-[#BED4EB]'
                        : 'bg-[#2C1F16] border-[#443021]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectorMode('mishnah')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                        selectorMode === 'mishnah'
                          ? theme === 'celestial-slate'
                            ? 'bg-[#0284C7] text-white shadow-xs border border-sky-400'
                            : 'bg-[#4F6832] text-white shadow-xs border border-[#64843F]'
                          : theme === 'celestial-slate'
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      მიშნა
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectorMode('talmud')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                        selectorMode === 'talmud'
                          ? theme === 'celestial-slate'
                            ? 'bg-[#0284C7] text-white shadow-xs border border-sky-400'
                            : 'bg-[#4F6832] text-white shadow-xs border border-[#64843F]'
                          : theme === 'celestial-slate'
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      დაფი
                    </button>
                  </div>
                )}

                {/* Circular Close Button (X) */}
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                    theme === 'celestial-slate'
                      ? 'bg-white hover:bg-slate-100 text-[#1E293B] border-[#BED4EB]'
                      : 'bg-[#2C1F16] hover:bg-[#3B291D] text-[#FAF5EB] border-[#4A3425]'
                  }`}
                  title="დახურვა"
                  aria-label="დახურვა"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>

            {/* SCROLLABLE INTERMEDIATE BODY (ENSURES MODAL BOTTOM BUTTONS NEVER GET CUT OFF!) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col divide-y divide-[#3A271B]">
              {/* ITEM 2: RECENT DAPIM HISTORY (ბოლო დაფების ისტორია) */}
              <motion.div
                variants={cascadingModalItemVariants}
                className={`shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 flex flex-col gap-1.5 transition-colors ${
                  theme === 'celestial-slate'
                    ? 'bg-[#EBF3FB]'
                    : 'bg-[#211711]'
                }`}
              >
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History
                    className={`w-3.5 h-3.5 ${
                      theme === 'celestial-slate' ? 'text-sky-600' : 'text-amber-400'
                    }`}
                  />
                  <span
                    className={`text-[11px] sm:text-xs font-black tracking-tight ${
                      theme === 'celestial-slate' ? 'text-slate-800' : 'text-[#FAF5EB]'
                    }`}
                  >
                    ბოლო დაფების ისტორია • היסטוריית דפים אחרונים
                  </span>
                  {historyList.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        theme === 'celestial-slate'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-600/30'
                      }`}
                    >
                      {historyList.length}
                    </span>
                  )}
                </div>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className={`text-[10px] font-bold cursor-pointer hover:underline transition-colors ${
                      theme === 'celestial-slate'
                        ? 'text-red-500 hover:text-red-700'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                    title="ისტორიის გასუფთავება"
                  >
                    გასუფთავება
                  </button>
                )}
              </div>

              {historyList.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {historyList.map((item, idx) => {
                    const isCurrent =
                      item.tractateId === selectedTractateId &&
                      item.dafId === `${selectedDafNum}${selectedAmud}`;
                    return (
                      <button
                        key={`hist-${item.tractateId}-${item.dafId}-${idx}`}
                        type="button"
                        onClick={() => handleSelectRecentDaf(item, true)}
                        className={`group flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isCurrent
                            ? theme === 'celestial-slate'
                              ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-2 ring-sky-300'
                              : 'bg-[#5B7036] text-white border-[#718B44] shadow-md ring-2 ring-[#8EA856]/40'
                            : theme === 'celestial-slate'
                              ? 'bg-white hover:bg-sky-50 text-slate-800 border-sky-200 hover:border-sky-300'
                              : 'bg-[#2B1E15] hover:bg-[#38271C] text-[#FAF5EB] border-[#4A3322] hover:border-amber-600/50'
                        }`}
                        title={`${item.tractateNameKa} (${item.tractateNameHe}) ${item.dafId} — დააჭირეთ გადასასვლელად`}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-black truncate max-w-[105px]">
                            {item.tractateNameKa.split(' (')[0]}
                          </span>
                          <span
                            dir="rtl"
                            className={`text-[10px] font-serif ${
                              isCurrent
                                ? 'text-white/85 font-bold'
                                : theme === 'celestial-slate'
                                  ? 'text-slate-500'
                                  : 'text-amber-300/80'
                            }`}
                          >
                            {item.tractateNameHe}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black shrink-0 ${
                            isCurrent
                              ? 'bg-black/25 text-white'
                              : theme === 'celestial-slate'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-black/40 text-amber-300'
                          }`}
                        >
                          {item.dafId}
                        </span>
                        <ArrowRight
                          className={`w-3 h-3 transition-transform group-hover:translate-x-0.5 shrink-0 ${
                            isCurrent
                              ? 'text-white'
                              : theme === 'celestial-slate'
                                ? 'text-sky-600'
                                : 'text-amber-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`text-[11px] py-0.5 italic ${
                    theme === 'celestial-slate' ? 'text-slate-500' : 'text-stone-400'
                  }`}
                >
                  ისტორია ჯერ ცარიელია — თქვენ მიერ მონახულებული დაფები აქ ავტომატურად გამოჩნდება.
                </div>
              )}
            </motion.div>

            {/* ITEM 3: DAF QUICK-JUMP SLIDER & DIRECT NUMBER INPUT (TALMUD MODE) */}
            {isDafModeActive && (
              <motion.div
                variants={cascadingModalItemVariants}
                className={`px-3 sm:px-5 py-2 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                  theme === 'celestial-slate'
                    ? 'bg-[#F0F6FC] border-[#BED4EB]'
                    : 'bg-[#251A13] border-[#3E2B1E]'
                }`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <Sliders
                    className={`w-3.5 h-3.5 ${
                      theme === 'celestial-slate' ? 'text-sky-600' : 'text-amber-400'
                    }`}
                  />
                  <span
                    className={`text-[11px] sm:text-xs font-black ${
                      theme === 'celestial-slate' ? 'text-slate-800' : 'text-[#FAF5EB]'
                    }`}
                  >
                    დაფზე სწრაფი გადასვლა:
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded ${
                        theme === 'celestial-slate'
                          ? 'bg-white text-sky-800 border border-sky-300'
                          : 'bg-[#1C130D] text-amber-300 border border-[#4A3322]'
                      }`}
                    >
                      {selectedDafNum}-{toCleanHebrewLetter(selectedDafNum)}
                      {selectedAmud}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-[340px]">
                  <input
                    type="range"
                    min={2}
                    max={bavliMeta?.lastDaf || 64}
                    value={selectedDafNum}
                    onChange={(e) => setSelectedDafNum(Number(e.target.value))}
                    className="flex-1 h-2 rounded-lg cursor-pointer accent-[#5B7036] dark:accent-amber-500"
                    title={`დაფი ${selectedDafNum}`}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={2}
                      max={bavliMeta?.lastDaf || 64}
                      value={selectedDafNum}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const maxD = bavliMeta?.lastDaf || 64;
                          setSelectedDafNum(Math.min(maxD, Math.max(2, val)));
                        }
                      }}
                      className={`w-12 px-1 py-0.5 text-center font-mono font-black text-xs rounded border ${
                        theme === 'celestial-slate'
                          ? 'bg-white text-slate-800 border-sky-300'
                          : 'bg-[#1C130D] text-[#FAF5EB] border-[#4A3322]'
                      }`}
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAmud('a')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                          selectedAmud === 'a'
                            ? theme === 'celestial-slate'
                              ? 'bg-sky-600 text-white'
                              : 'bg-[#5B7036] text-white'
                            : theme === 'celestial-slate'
                              ? 'bg-white text-slate-600 border border-sky-200'
                              : 'bg-[#1C130D] text-stone-300 border border-[#4A3322]'
                        }`}
                      >
                        1-א
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAmud('b')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                          selectedAmud === 'b'
                            ? theme === 'celestial-slate'
                              ? 'bg-sky-600 text-white'
                              : 'bg-[#5B7036] text-white'
                            : theme === 'celestial-slate'
                              ? 'bg-white text-slate-600 border border-sky-200'
                              : 'bg-[#1C130D] text-stone-300 border border-[#4A3322]'
                        }`}
                      >
                        2-ב
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ITEM 4: 4 CASCADING SCROLLABLE COLUMNS — SERENE PALETTE & FLUID SCALING */}
            <motion.div
              variants={cascadingModalItemVariants}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 flex-1 min-h-[170px] sm:min-h-[260px] max-h-[46dvh] overflow-hidden flex flex-col"
            >
              <div className="grid grid-cols-[1.3fr_1.5fr_56px_52px] sm:grid-cols-[1.4fr_1.7fr_64px_56px] gap-[1px] rounded-2xl overflow-hidden border border-[#443021] bg-[#362418] h-full shadow-inner backdrop-blur-md">
                {/* COLUMN 1: סדר • სედერ */}
                <div className="flex flex-col min-w-0 h-full overflow-hidden bg-[#1C130D]">
                  <div className="py-2 px-1 text-center font-bold text-xs sm:text-[13px] border-b select-none bg-[#281D15] text-[#E8CFA6] border-[#3E2B1E]">
                    <span>სედერ • סדר</span>
                  </div>
                  <div
                    data-cascading-column="true"
                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col divide-y divide-[#322013]"
                  >
                    {sedarimList.map((s) => {
                      const isSelected = selectedSederId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          data-cascading-active={isSelected ? 'true' : undefined}
                          onClick={() => handleSelectSeder(s.id)}
                          className={`w-full py-2.5 px-1 text-center transition-colors cursor-pointer flex flex-col items-center justify-center leading-tight ${
                            isSelected
                              ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                              : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB]'
                          }`}
                        >
                          <span className="text-[12px] sm:text-[13px] font-black truncate max-w-full px-0.5">
                            {s.nameKa}
                          </span>
                          <span
                            dir="rtl"
                            className={`font-serif text-[11px] sm:text-[11.5px] mt-0.5 font-bold ${
                              isSelected ? 'text-[#E4EFC9] font-bold' : 'text-[#E6A64C]'
                            }`}
                          >
                            ({s.nameHe})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: מסכת • ტრაქ. */}
                <div className="flex flex-col min-w-0 h-full overflow-hidden bg-[#1C130D]">
                  <div className="py-2 px-1 text-center font-black text-xs sm:text-[13px] border-b select-none bg-[#261A11] text-[#F5D296] border-[#3D2919]">
                    <span>ტრაქ. • מסכת</span>
                  </div>
                  <div
                    data-cascading-column="true"
                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col divide-y divide-[#322013]"
                  >
                    {filteredTractates.map((tr) => {
                      const isSelected = selectedTractateId === tr.id;
                      const shortKa = tr.nameKa.split(' (')[0];
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          data-cascading-active={isSelected ? 'true' : undefined}
                          onClick={() => handleSelectTractate(tr.id)}
                          className={`w-full py-2.5 px-1 text-center transition-colors cursor-pointer flex flex-col items-center justify-center leading-tight ${
                            isSelected
                              ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                              : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB]'
                          }`}
                        >
                          <span className="text-[12px] sm:text-[13px] font-black truncate max-w-full px-0.5">
                            {shortKa}
                          </span>
                          <span
                            dir="rtl"
                            className={`font-serif text-[11px] sm:text-[11.5px] mt-0.5 font-bold ${
                              isSelected ? 'text-[#E4EFC9] font-bold' : 'text-[#E6A64C]'
                            }`}
                          >
                            ({tr.nameHe})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 3: פרკ / דף (FORMAT: 2-ב, 3-ג, 4-დ, 5-ה, etc. — 1-א DOES NOT EXIST IN TALMUD!) */}
                <div className="flex flex-col min-w-0 h-full overflow-hidden bg-[#1C130D]">
                  <div className="py-2 px-0.5 text-center font-black text-[11px] sm:text-xs border-b select-none bg-[#261A11] text-[#F5D296] border-[#3D2919]">
                    <span>{isDafModeActive ? 'დף' : 'פרק'}</span>
                  </div>
                  <div
                    data-cascading-column="true"
                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col divide-y divide-[#322013]"
                  >
                    {!isDafModeActive
                      ? chaptersList.map((ch) => {
                          const isSelected = selectedChapter === ch;
                          return (
                            <button
                              key={`ch-${ch}`}
                              type="button"
                              data-cascading-active={isSelected ? 'true' : undefined}
                              onClick={() => handleSelectChapter(ch)}
                              className={`w-full py-2.5 text-center transition-colors cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                                  : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB] font-black'
                              }`}
                            >
                              <span className="font-mono text-sm sm:text-base font-black">{ch}</span>
                            </button>
                          );
                        })
                      : dafNumbersList.map((dNum) => {
                          const isSelected = selectedDafNum === dNum;
                          return (
                            <button
                              key={`dnum-${dNum}`}
                              type="button"
                              data-cascading-active={isSelected ? 'true' : undefined}
                              onClick={() => setSelectedDafNum(dNum)}
                              className={`w-full py-2.5 text-center transition-colors cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                                  : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB] font-black'
                              }`}
                            >
                              <span className="font-mono text-xs sm:text-[13px] font-black tracking-tight whitespace-nowrap">
                                {dNum}-{toCleanHebrewLetter(dNum)}
                              </span>
                            </button>
                          );
                        })}
                  </div>
                </div>

                {/* COLUMN 4: עמוד / משנה (1-א, 2-ב FORMAT) */}
                <div className="flex flex-col min-w-0 h-full overflow-hidden bg-[#1C130D]">
                  <div className="py-2 px-0.5 text-center font-black text-[11px] sm:text-xs border-b select-none bg-[#261A11] text-[#F5D296] border-[#3D2919]">
                    <span>{isDafModeActive ? 'עמוד' : 'משנה'}</span>
                  </div>
                  <div
                    data-cascading-column="true"
                    className="flex-1 overflow-y-auto no-scrollbar flex flex-col divide-y divide-[#322013]"
                  >
                    {!isDafModeActive ? (
                      mishnayotList.map((m) => {
                        const isSelected = selectedMishnah === m;
                        return (
                          <button
                            key={`mish-${m}`}
                            type="button"
                            data-cascading-active={isSelected ? 'true' : undefined}
                            onClick={() => setSelectedMishnah(m)}
                            className={`w-full py-2.5 text-center transition-colors cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                                : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB] font-black'
                            }`}
                          >
                            <span className="font-mono text-sm sm:text-base font-black">{m}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex flex-col divide-y divide-[#322013]">
                        {/* Row 1: 1-א (Amud Alef) */}
                        <button
                          type="button"
                          data-cascading-active={selectedAmud === 'a' ? 'true' : undefined}
                          onClick={() => setSelectedAmud('a')}
                          className={`w-full py-4 text-center transition-colors cursor-pointer flex items-center justify-center ${
                            selectedAmud === 'a'
                              ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                              : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB] font-black'
                          }`}
                          title="ამუდი 1 (א)"
                        >
                          <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
                            1-א
                          </span>
                        </button>

                        {/* Row 2: 2-ב (Amud Bet) */}
                        <button
                          type="button"
                          data-cascading-active={selectedAmud === 'b' ? 'true' : undefined}
                          onClick={() => setSelectedAmud('b')}
                          className={`w-full py-4 text-center transition-colors cursor-pointer flex items-center justify-center ${
                            selectedAmud === 'b'
                              ? 'bg-[#5B7036] text-white font-black shadow-xs ring-1 ring-white/30'
                              : 'bg-[#221811] hover:bg-[#2C1F16] text-[#FAF5EB] font-black'
                          }`}
                          title="ამუდი 2 (ב)"
                        >
                          <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
                            2-ב
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ITEM 5: BOTTOM ACTION BAR — PROPORTIONAL BEAUTIFUL ACTION BUTTONS (STICKY & ALWAYS VISIBLE) */}
          <motion.div
            variants={cascadingModalItemVariants}
            className={`shrink-0 sticky bottom-0 z-20 px-4 sm:px-5 py-2.5 sm:py-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 border-t transition-colors ${
              theme === 'celestial-slate'
                ? 'bg-[#E2EDF8] border-[#BED4EB]'
                : 'bg-[#251A13] border-[#3E2B1E]'
            }`}
          >
            {/* Left: Reset / Clear Icon Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className={`h-9 sm:h-10 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs border text-xs font-bold ${
                theme === 'celestial-slate'
                  ? 'bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400'
                  : 'bg-[#2E2017] hover:bg-red-950/40 text-red-300 hover:text-red-200 border-red-800/40'
              }`}
              title="ფილტრების გასუფთავება • נקה"
              aria-label="გასუფთავება"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.25]" />
              <span className="hidden xs:inline">გასუფთავება</span>
            </button>

            {/* Right: Confirm & Close Button (არჩევანზე გადასვლა) */}
            <button
              type="button"
              onClick={handleConfirmAndClose}
              className={`h-9 sm:h-10 px-4 sm:px-5 rounded-xl flex items-center gap-2 cursor-pointer font-bold shadow-md active:scale-95 transition-all border text-xs sm:text-sm ${
                theme === 'celestial-slate'
                  ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white border-sky-400'
                  : 'bg-[#4F6832] hover:bg-[#5C783B] text-white border-[#658442]'
              }`}
              title="დაკეტვა და არჩეულ დაფზე გადასვლა • אישור"
              aria-label="დაკეტვა და გადასვლა"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>არჩევა და გადასვლა</span>
            </button>
          </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
