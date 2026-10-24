// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Layers,
  Scale,
  Search,
  Maximize2,
  Trash2,
  Link2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ArrowUpRight,
  CornerUpLeft,
} from 'lucide-react';
import {
  DafPageData,
  ScholarNote,
  SefariaCommentaryItem,
  TalmudSentence,
  AnalysisMode,
} from '../types/talmud';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';
import { PoskimHalachaMasterGrid } from './PoskimHalachaMasterGrid';
import { TosafotDeepLinkRef } from './TalmudModals';
import { WindowsWindowControls, CrystalDiamondJumpButton } from './WindowsWindowControls';
import {
  containsLatinButNoGeorgian,
  translateToGeorgianLive,
} from '../utils/georgianTranslator';

interface TalmudBelowDafSectionsProps {
  dafData: DafPageData;
  effectiveRashi?: TalmudSentence[];
  effectiveTosafot?: TalmudSentence[];
  tractateNameHe: string;
  tractateNameKa: string;
  isDark: boolean;
  notes: ScholarNote[];
  onDeleteNote: (id: string) => void;
  onOpenAddNoteModal: () => void;
  onOpenSectionFullscreen: (
    id: string,
    titleHe: string,
    titleKa: string,
    sentences: TalmudSentence[],
    isRashiScript?: boolean
  ) => void;
  makeInteractiveSentence: (
    id: string,
    source: TalmudSentence['source'],
    hebrewText: string,
    translationKa: string,
    explanationKa: string,
    dibburHamatchil?: string,
    commentatorNameHe?: string,
    commentatorNameKa?: string
  ) => TalmudSentence;
  renderInlineInteractiveWords: (
    sentence: TalmudSentence,
    isRashiScript?: boolean,
    boldFirstWord?: boolean
  ) => React.ReactNode;
  extractTosafotCitations: (
    heText: string,
    dibburOrAnchor?: string,
    itemIdx?: number
  ) => TosafotDeepLinkRef[];
  onTriggerTosafotDeepLink: (
    link: TosafotDeepLinkRef,
    tosafotTitle?: string,
    originContext?: {
      fromSectionId?: string | null;
      fromSentenceId?: string | null;
      fromElementId?: string | null;
      sourceLabelKa?: string;
      sourceLabelHe?: string;
      anchorRect?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
      } | null;
    }
  ) => void;
  onShowTosafotCitationTooltip: (
    e: React.MouseEvent<HTMLElement>,
    link: TosafotDeepLinkRef
  ) => void;
  onHideTosafotCitationTooltip: () => void;
  deepLinkedSentenceId: string | null;
  onSetDeepLinkedSentenceId: (id: string | null) => void;
  liveCrossHighlightEnabled: boolean;
  crossLinkedIds: Set<string>;
  onHoverSentence: (sent: TalmudSentence | null) => void;
  onSelectWordOrSentence?: (
    word: string,
    sentence: TalmudSentence,
    rect: DOMRect,
    initialMode?: AnalysisMode
  ) => void;
  onOpenWordNote?: () => void;
  fontScaleRatio?: number;
}

const HEBREW_INDEX_LETTERS = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'יא',
  'יב',
  'יג',
  'יד',
  'טו',
  'טז',
];

export const TalmudBelowDafSections: React.FC<TalmudBelowDafSectionsProps> = React.memo(({
  dafData,
  effectiveRashi,
  effectiveTosafot,
  tractateNameHe,
  tractateNameKa,
  isDark,
  notes,
  onDeleteNote,
  onOpenAddNoteModal,
  onOpenSectionFullscreen,
  makeInteractiveSentence,
  renderInlineInteractiveWords,
  extractTosafotCitations,
  onTriggerTosafotDeepLink,
  onShowTosafotCitationTooltip,
  onHideTosafotCitationTooltip,
  deepLinkedSentenceId,
  onSetDeepLinkedSentenceId,
  liveCrossHighlightEnabled,
  crossLinkedIds,
  onHoverSentence,
  onSelectWordOrSentence,
  onOpenWordNote,
  fontScaleRatio = 1,
}) => {
  const [showPoskimGridOnDaf, setShowPoskimGridOnDaf] = useState<boolean>(false);
  const [selectedCommentator, setSelectedCommentator] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [commentarySearch, setCommentarySearch] = useState<string>('');
  const [visibleCommCount, setVisibleCommCount] = useState<number>(24);
  const [commGeorgianMap, setCommGeorgianMap] = useState<Record<string, string>>({});

  // Section tab filter inside #daf-section-sefaria-all: 'all' | 'tosafot' | 'rashi' | 'other'
  const [activeExplorerTab, setActiveExplorerTab] = useState<
    'all' | 'tosafot' | 'rashi' | 'other'
  >('all');

  // Track which individual entries are collapsed (by default entries are expanded; user can smoothly collapse/expand any entry or all entries)
  const [collapsedEntryIds, setCollapsedEntryIds] = useState<Record<string, boolean>>({});

  // Breadcrumb navigation history so user can see the jump trail and jump back to the exact origin card/scroll position
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<
    Array<{
      fromTractateId: string;
      fromDafId: string;
      fromLabelKa: string;
      fromLabelHe: string;
      viaSourceKa: string;
      targetCiteEn: string;
      fromElementId?: string | null;
      fromSentenceId?: string | null;
      fromWindowScrollY: number;
    }>
  >([]);

  // Requirement 1 & 4: Track which blue citation text was tapped so the translucent diamond jump button appears
  const [activeTappedCiteKey, setActiveTappedCiteKey] = useState<string | null>(null);
  const [activeTappedCiteRect, setActiveTappedCiteRect] = useState<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null>(null);
  const [minimizedMainPanels, setMinimizedMainPanels] = useState<Record<string, boolean>>({});
  const [maximizedMainPanel, setMaximizedMainPanel] = useState<string | null>(null);

  const toggleEntryExpanded = (entryId: string) => {
    setCollapsedEntryIds((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const tosafotList: TalmudSentence[] = useMemo(
    () =>
      effectiveTosafot && effectiveTosafot.length > 0
        ? effectiveTosafot
        : dafData.tosafot || [],
    [effectiveTosafot, dafData.tosafot]
  );

  const rashiList: TalmudSentence[] = useMemo(
    () =>
      effectiveRashi && effectiveRashi.length > 0 ? effectiveRashi : dafData.rashi || [],
    [effectiveRashi, dafData.rashi]
  );

  const allCommentaries: SefariaCommentaryItem[] = useMemo(
    () => dafData.allCommentaries || [],
    [dafData.allCommentaries]
  );

  // Trigger jump-to-reference + record breadcrumb trail + open Source Daf Note Window pointing to the link
  const handleJumpToCitedReference = (
    link: TosafotDeepLinkRef,
    sourceLabelKa: string,
    dibburHe?: string,
    fromElementId?: string | null,
    fromSentenceId?: string | null,
    explicitAnchorRect?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
    } | null
  ) => {
    const resolvedAnchorRect = explicitAnchorRect || activeTappedCiteRect;
    onHideTosafotCitationTooltip();
    setActiveTappedCiteKey(null);
    const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const viaLabel = dibburHe ? `${sourceLabelKa} (ד״ה ${dibburHe.slice(0, 20)})` : sourceLabelKa;

    setBreadcrumbHistory((prev) => [
      {
        fromTractateId: dafData.tractateId,
        fromDafId: dafData.dafId,
        fromLabelKa: `${tractateNameKa} ${dafData.dafId}`,
        fromLabelHe: `${tractateNameHe} ${dafData.dafId}`,
        viaSourceKa: viaLabel,
        targetCiteEn:
          link.citeEn ||
          (link.tractateId && link.dafId
            ? `${link.tractateId.replace(/_/g, ' ')} ${link.dafId}`
            : link.targetSectionLabelKa),
        fromElementId: fromElementId || 'daf-section-sefaria-all',
        fromSentenceId: fromSentenceId || null,
        fromWindowScrollY: currentScrollY,
      },
      ...prev.slice(0, 6),
    ]);

    onTriggerTosafotDeepLink(link, dibburHe || link.citeHe, {
      fromSectionId: 'daf-section-sefaria-all',
      fromSentenceId: fromSentenceId || null,
      fromElementId: fromElementId || 'daf-section-sefaria-all',
      sourceLabelKa: `${tractateNameKa} ${dafData.dafId} • ${viaLabel}`,
      sourceLabelHe: link.citeHe,
      anchorRect: resolvedAnchorRect,
    });

    // Only scroll the main page if this is an internal same-daf section jump without a cited tractate/daf Note window
    if (!link.tractateId || !link.dafId) {
      setTimeout(() => {
        const dafAnchor = document.getElementById('talmud-daf-folio-anchor');
        if (dafAnchor) {
          dafAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 95);
    }
  };

  const commentatorOptions: SelectOption[] = useMemo(() => {
    const counts = new Map<string, { en: string; he: string; ka: string; count: number }>();
    for (const item of allCommentaries) {
      const existing = counts.get(item.commentatorEn) || {
        en: item.commentatorEn,
        he: item.commentatorHe,
        ka: item.commentatorKa,
        count: 0,
      };
      existing.count++;
      counts.set(item.commentatorEn, existing);
    }
    const list = Array.from(counts.values());
    return [
      {
        value: 'all',
        badgeHe: `כל המפרשים (${allCommentaries.length})`,
        label: `ყველა კომენტატორი სეფარიადან (${allCommentaries.length} კომენტარი)`,
        sublabel: `${list.length} სხვადასხვა კომენტატორი და წყარო ამ გვერდზე`,
      },
      ...list.map((c) => ({
        value: c.en,
        badgeHe: `${c.he} (${c.count})`,
        label: `${c.ka} — ${c.count}`,
        sublabel: c.en,
      })),
    ];
  }, [allCommentaries]);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: 'הכל',
        label: `ყველა კატეგორია (${allCommentaries.length})`,
        sublabel: 'ყველა ტიპის კომენტარი და წყარო',
      },
      {
        value: 'Commentary',
        badgeHe: 'מפרשים',
        label: 'კლასიკური კომენტარები (ראשונים ואחרונים)',
        sublabel: 'რაში, თოსაფოთი, ხავრუთა, შტაინზალცი, მეირი, რაშბა, რიტბა, მაჰარშა',
      },
      {
        value: 'Halakhah',
        badgeHe: 'הלכה',
        label: 'ჰალახა და კოდექსები (רמב״ם ושו״ע)',
        sublabel: 'მიშნე თორა, ტური, შულხან არუხი, სმაგი',
      },
      {
        value: 'Chasidut',
        badgeHe: 'חסידות',
        label: 'ხასიდუთი, კაბალა და მუსარი',
        sublabel: 'სფათ ემეთი, ბენ იეჰოიადა, კდუშათ ლევი',
      },
      {
        value: 'Reference',
        badgeHe: 'מילון',
        label: 'ლექსიკონი და წყაროები (ג׳סטרו / מסורת הש״ס)',
        sublabel: 'ჯასტროუს ლექსიკონი და ტექსტოლოგიური შენიშვნები',
      },
    ],
    [allCommentaries.length]
  );

  const filteredTosafot = useMemo(() => {
    if (!commentarySearch.trim()) return tosafotList;
    const q = commentarySearch.trim().toLowerCase();
    return tosafotList.filter((t) => {
      const he = `${t.dibburHamatchil || ''} ${t.hebrewText || ''}`.toLowerCase();
      const ka = `${t.translationKa || ''} ${t.explanationKa || ''}`.toLowerCase();
      return he.includes(q) || ka.includes(q);
    });
  }, [tosafotList, commentarySearch]);

  const filteredRashi = useMemo(() => {
    if (!commentarySearch.trim()) return rashiList;
    const q = commentarySearch.trim().toLowerCase();
    return rashiList.filter((r) => {
      const he = `${r.dibburHamatchil || ''} ${r.hebrewText || ''}`.toLowerCase();
      const ka = `${r.translationKa || ''} ${r.explanationKa || ''}`.toLowerCase();
      return he.includes(q) || ka.includes(q);
    });
  }, [rashiList, commentarySearch]);

  const filteredCommentaries = useMemo(() => {
    return allCommentaries.filter((c) => {
      if (selectedCommentator !== 'all' && c.commentatorEn !== selectedCommentator) {
        return false;
      }
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'Commentary') {
          if (c.category !== 'Commentary' && c.category !== 'Quoting Commentary') return false;
        } else if (c.category !== selectedCategory) {
          return false;
        }
      }
      if (commentarySearch.trim()) {
        const q = commentarySearch.trim().toLowerCase();
        const matchHe = c.he.toLowerCase().includes(q);
        const matchEn = c.en.toLowerCase().includes(q);
        const matchComm =
          c.commentatorKa.toLowerCase().includes(q) ||
          c.commentatorHe.toLowerCase().includes(q) ||
          c.commentatorEn.toLowerCase().includes(q);
        if (!matchHe && !matchEn && !matchComm) return false;
      }
      return true;
    });
  }, [allCommentaries, selectedCommentator, selectedCategory, commentarySearch]);

  const handleExpandAllEntries = () => {
    setCollapsedEntryIds({});
  };

  const handleCollapseAllEntries = () => {
    const next: Record<string, boolean> = {};
    tosafotList.forEach((t) => {
      next[`tos-${t.id}`] = true;
    });
    rashiList.forEach((r) => {
      next[`rashi-${r.id}`] = true;
    });
    filteredCommentaries.forEach((c) => {
      next[`comm-${c.id}`] = true;
    });
    setCollapsedEntryIds(next);
  };

  const hasAnyCollapsed = useMemo(
    () => Object.values(collapsedEntryIds).some(Boolean),
    [collapsedEntryIds]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const comm of filteredCommentaries.slice(0, 12)) {
        if (cancelled) break;
        const rawKa = comm.translationKa || '';
        const needsTranslation =
          !rawKa ||
          containsLatinButNoGeorgian(rawKa) ||
          rawKa.includes('დააწკაპუნეთ ნებისმიერ სიტყვას');
        if (needsTranslation && !commGeorgianMap[comm.id]) {
          const sourceStr = comm.en || comm.he;
          const fromLang = comm.en ? 'en' : 'iw';
          const translated = await translateToGeorgianLive(sourceStr, fromLang);
          if (!cancelled && translated) {
            setCommGeorgianMap((prev) => ({ ...prev, [comm.id]: translated }));
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filteredCommentaries]);

  // Helper to scan any Georgian/English/Hebrew string for Talmudic citations (like 'Taanit 5a', 'Rosh Hashanah 16a', 'Sukkah 42b', 'Berakhot 33a') and render green letters that reveal a jump button on tap
  const renderTextWithInteractiveCitations = (
    rawText: string,
    sourceLabelKa: string,
    dibburHe?: string,
    fromElementId?: string,
    fromSentenceId?: string
  ): React.ReactNode => {
    if (!rawText) return null;
    const citationPattern =
      /\b((?:Berakhot|Shabbat|Eruvin|Pesachim|Yoma|Sukkah|Beitzah|Rosh[_\s]+Hashanah|Taanit|Megillah|Chagigah|Yevamot|Ketubot|Gittin|Kiddushin|Bava[_\s]+Kamma|Bava[_\s]+Metzia|Bava[_\s]+Batra|Sanhedrin|Shevuot|Avodah[_\s]+Zarah|Zevachim|Menachot|Chullin|Niddah)\s+\d{1,3}[ab])\b/gi;

    const parts = rawText.split(citationPattern);
    if (parts.length === 1) return rawText;

    return parts.map((part, i) => {
      const m =
        /^(Berakhot|Shabbat|Eruvin|Pesachim|Yoma|Sukkah|Beitzah|Rosh[_\s]+Hashanah|Taanit|Megillah|Chagigah|Yevamot|Ketubot|Gittin|Kiddushin|Bava[_\s]+Kamma|Bava[_\s]+Metzia|Bava[_\s]+Batra|Sanhedrin|Shevuot|Avodah[_\s]+Zarah|Zevachim|Menachot|Chullin|Niddah)\s+(\d{1,3}[ab])$/i.exec(
          part.trim()
        );
      if (!m) {
        return <React.Fragment key={i}>{part}</React.Fragment>;
      }
      const rawTr = m[1].replace(/\s+/g, '_');
      const normalizedTr =
        rawTr.toLowerCase() === 'rosh_hashanah'
          ? 'Rosh_Hashanah'
          : rawTr.charAt(0).toUpperCase() + rawTr.slice(1);
      const targetDaf = m[2].toLowerCase();
      const citeEn = `${normalizedTr.replace(/_/g, ' ')} ${targetDaf}`;
      const dl: TosafotDeepLinkRef = {
        id: `inline-text-cite-${normalizedTr}-${targetDaf}-${i}`,
        citeHe: citeEn,
        citeEn,
        tractateId: normalizedTr,
        dafId: targetDaf,
        targetSectionId: 'daf-section-gemara',
        targetSectionLabelKa: `${citeEn}`,
        targetSentenceId: dafData.gemara[0]?.id || 'g-1',
        targetSnippetHe: dafData.gemara[0]?.hebrewText?.slice(0, 48) || '',
      };

      const tapKey = `txt-${fromElementId || 'sec'}-${dl.id}`;
      const isTapped = activeTappedCiteKey === tapKey;

      return (
        <span key={i} className="inline-flex items-center gap-1 mx-0.5 align-baseline">
          <span
            role="button"
            tabIndex={0}
            data-jump-reference={citeEn}
            onMouseEnter={(e) => onShowTosafotCitationTooltip(e, dl)}
            onMouseLeave={onHideTosafotCitationTooltip}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const rectObj = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
              };
              setActiveTappedCiteKey(tapKey);
              setActiveTappedCiteRect(rectObj);
              handleJumpToCitedReference(
                dl,
                sourceLabelKa,
                dibburHe,
                fromElementId,
                fromSentenceId,
                rectObj
              );
            }}
            className="text-[#1545C8] dark:text-[#60A5FA] hover:text-[#0E3299] font-mono text-[11.5px] font-extrabold cursor-pointer transition-colors"
            title={`1-ლი დაჭერა: გადასვლის ღილაკის ჩვენება • მე-2 დაჭერა: გადასვლა (${citeEn})`}
          >
            {part}
          </span>
          {isTapped && (
            <CrystalDiamondJumpButton
              labelKa={`წყარო (Note): ${citeEn}`}
              citeHe={dl.citeHe}
              anchorRect={activeTappedCiteRect}
              isDark={isDark}
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToCitedReference(
                  dl,
                  sourceLabelKa,
                  dibburHe,
                  fromElementId,
                  fromSentenceId
                );
              }}
            />
          )}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. SAVED PERSONAL NOTES STRIP */}
      {notes.length > 0 && (
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isDark
              ? 'bg-[#261A12]/95 border-[#C49A6C]/45 text-[#FAF5EB]'
              : 'bg-[#E5D6BC] border-[#6E472B]/50 text-[#21160F]'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-extrabold">
              📝 თქვენი ჩაწერილი კომენტარები და შენიშვნები ამ დაფზე ({notes.length}):
            </span>
            <button
              type="button"
              onClick={onOpenAddNoteModal}
              className="text-xs font-bold underline cursor-pointer"
            >
              + ახალი შენიშვნა
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border shadow-xs flex items-start justify-between gap-2 ${
                  isDark ? 'bg-[#1D130C] border-[#4A3020]' : 'bg-[#F5EBD6] border-[#8B5A2B]/50'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#8B5A2B]">{n.word}</div>
                  <p className="text-xs leading-snug mt-0.5">{n.noteText}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSectionFullscreen(
                        n.id,
                        n.word,
                        `პირადი კომენტარი (${n.createdAt})`,
                        [
                          makeInteractiveSentence(
                            n.id,
                            'meforshim',
                            n.hebrewSnippet || n.word,
                            n.noteText,
                            n.noteText
                          ),
                        ],
                        false
                      )
                    }
                    className="p-1 rounded hover:bg-[#8C6239]/20 text-[#8C6239] cursor-pointer"
                    title="მთელ ეკრანზე გახსნა"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(n.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-rose-500 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LATE-ERA & CONTEMPORARY POSKIM MASTER GRID */}
      <div
        id="daf-section-poskim-grid"
        className={
          maximizedMainPanel === 'poskim-grid'
            ? `fixed inset-2 z-[260] overflow-y-auto rounded-2xl border-2 p-4 sm:p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#21150E] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#E5D6BC] border-[#6E472B] text-[#21160F]'
              }`
            : `rounded-2xl border p-4 sm:p-5 shadow-sm ${
                isDark
                  ? 'bg-[#21150E]/95 border-[#C49A6C]/45 text-[#FAF5EB]'
                  : 'bg-[#E5D6BC] border-[#6E472B]/55 text-[#21160F]'
              }`
        }
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#8B5A2B]" />
            <span className="text-xs sm:text-sm font-black">
              ბოლო ეპოქის ჰალახის კანონმდებელთა ბადე (פוסקי ספרד ואשכנז) • სეფარადული და აშკენაზური ფოსკიმები
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPoskimGridOnDaf((v) => !v)}
              className="px-3 py-1 rounded-xl bg-[#6B4226] text-[#FAF5EB] text-xs font-extrabold cursor-pointer"
            >
              {showPoskimGridOnDaf ? 'ბადის დაკეცვა' : 'ბადის გაშლა'}
            </button>
            <WindowsWindowControls
              isMinimized={!showPoskimGridOnDaf}
              onToggleMinimize={() => setShowPoskimGridOnDaf((v) => !v)}
              isMaximized={maximizedMainPanel === 'poskim-grid'}
              onToggleMaximize={() => {
                setShowPoskimGridOnDaf(true);
                setMaximizedMainPanel((prev) => (prev === 'poskim-grid' ? null : 'poskim-grid'));
              }}
              isDark={isDark}
              size="sm"
            />
          </div>
        </div>
        <AnimatePresence initial={false}>
          {showPoskimGridOnDaf && (
            <motion.div
              key="poskim-grid-collapse"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.25, ease: 'easeInOut' },
              }}
              className="overflow-hidden pt-2"
            >
              <PoskimHalachaMasterGrid
                dafData={dafData}
                tractateNameHe={tractateNameHe}
                tractateNameKa={tractateNameKa}
                isDark={isDark}
                compactOnDaf
                onHighlightSentence={(sentId) => {
                  if (sentId) onSetDeepLinkedSentenceId(sentId);
                }}
                onOpenFullscreen={(fs) => {
                  onOpenSectionFullscreen(
                    'poskim-fs',
                    fs.subtitle || tractateNameHe,
                    fs.title,
                    [
                      makeInteractiveSentence(
                        'poskim-fs-sent',
                        'meforshim',
                        fs.hebrewText || fs.title,
                        fs.georgianText,
                        fs.georgianText
                      ),
                    ],
                    false
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. ALL SEFARIA COMMENTARIES, TOSAFOT & RASHI EXPLORER (#daf-section-sefaria-all) */}
      {/* Refactored to a responsive CSS Grid container where all commentary entries render as distinct, cleanly padded cards with subtle drop shadows */}
      <div
        id="daf-section-sefaria-all"
        className={
          maximizedMainPanel === 'sefaria-all'
            ? `fixed inset-2 z-[260] overflow-y-auto overflow-x-hidden grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start gap-4 rounded-2xl border-2 p-4 sm:p-6 shadow-2xl ${
                isDark
                  ? 'bg-[#241810] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#E5D6BC] border-[#6E472B] text-[#21160F]'
              }`
            : `relative z-20 overflow-visible grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start gap-4 rounded-2xl border p-4 sm:p-6 pb-20 shadow-md transition-all ${
                isDark
                  ? 'bg-[#241810]/95 border-[#C49A6C]/35 text-[#FAF5EB]'
                  : 'bg-[#E5D6BC] border-[#6E472B]/55 text-[#21160F]'
              }`
        }
      >
        {/* Full-Span Top Header + Interactive Breadcrumb Trail & Jump-to-Reference Navigation */}
        <div className="col-span-full flex flex-col gap-3 pb-3 border-b border-[#8B5A2B]/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#6B4226] text-[#FBF7F0] shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold">
                    თოსაფოთი, რაში და სეფარიას ყველა კომენტარი (תוספות, רש״י וכל מפרשי הדף)
                  </h3>
                  <span className="text-xs font-bold opacity-80">
                    · {tosafotList.length} תוספות · {rashiList.length} רש״י · {allCommentaries.length} מפרשים
                  </span>
                </div>
                <p className="text-xs opacity-80">
                  დააწკაპუნეთ ნებისმიერ ბარათზე რბილი ანიმაციით გასაშლელად/დასაკეცად, ან დააწკაპუნეთ ლურჯ ციტირებულ წყაროზე (მაგ. Taanit 5a) წყაროს დაფის Note-ფანჯარაში გასახსნელად
                </p>
              </div>
            </div>

            {/* Expand All / Collapse All Smooth Height Controls + Windows Window Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={hasAnyCollapsed ? handleExpandAllEntries : handleCollapseAllEntries}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                  isDark
                    ? 'bg-[#332115] hover:bg-[#462E1E] border-[#C49A6C]/50 text-[#FAF5EB]'
                    : 'bg-[#F5EBD6] hover:bg-[#EADBC0] border-[#8B5A2B]/50 text-[#2C1A10]'
                }`}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    hasAnyCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
                <span>{hasAnyCollapsed ? 'ყველას გაშლა' : 'ყველას დაკეცვა'}</span>
              </button>
              <WindowsWindowControls
                isMinimized={Boolean(minimizedMainPanels['sefaria-all'])}
                onToggleMinimize={() =>
                  setMinimizedMainPanels((prev) => ({
                    ...prev,
                    ['sefaria-all']: !prev['sefaria-all'],
                  }))
                }
                isMaximized={maximizedMainPanel === 'sefaria-all'}
                onToggleMaximize={() =>
                  setMaximizedMainPanel((prev) => (prev === 'sefaria-all' ? null : 'sefaria-all'))
                }
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>

          {/* Interactive Section Filter Tabs: All | Tosafot | Rashi | Other Commentaries */}
          {!minimizedMainPanels['sefaria-all'] && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {(
              [
                {
                  id: 'all',
                  labelKa: `ყველა ერთად (${tosafotList.length + rashiList.length + filteredCommentaries.length})`,
                  labelHe: 'כל המפרשים',
                },
                {
                  id: 'tosafot',
                  labelKa: `თოსაფოთი (${filteredTosafot.length})`,
                  labelHe: 'תוספות',
                },
                {
                  id: 'rashi',
                  labelKa: `რაშის კომენტარი (${filteredRashi.length})`,
                  labelHe: 'פירוש רש״י',
                },
                {
                  id: 'other',
                  labelKa: `სხვა კომენტარები (${filteredCommentaries.length})`,
                  labelHe: 'שאר מפרשים',
                },
              ] as const
            ).map((tab) => {
              const active = activeExplorerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveExplorerTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-xs'
                      : isDark
                        ? 'bg-[#1D130D] hover:bg-[#2E1F15] text-[#EED9B9] border-[#5C3A21]'
                        : 'bg-[#FAF3E3] hover:bg-[#EFE2C8] text-[#2C1A10] border-[#8B5A2B]/40'
                  }`}
                >
                  <span>{tab.labelKa}</span>
                  <span dir="rtl" className="font-serif text-[11px] opacity-85">
                    ({tab.labelHe})
                  </span>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Full-Span Filter Bar & Cards Body (hidden when #daf-section-sefaria-all is minimized) */}
        {!minimizedMainPanels['sefaria-all'] && (
        <>
        <div className="col-span-full grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <SearchableSelect
              label="კომენტატორის არჩევა (מפרש)"
              value={selectedCommentator}
              options={commentatorOptions}
              onChange={(val) => {
                setSelectedCommentator(val);
                setVisibleCommCount(24);
              }}
              placeholder="მოძებნეთ კომენტატორი (რაში, თოსაფოთი, შტაინზალცი...)"
              isDark={isDark}
            />
          </div>

          <div className="md:col-span-4">
            <SearchableSelect
              label="კატეგორიის არჩევა (קטגוריה)"
              value={selectedCategory}
              options={categoryOptions}
              onChange={(val) => {
                setSelectedCategory(val);
                setVisibleCommCount(24);
              }}
              placeholder="აირჩიეთ კატეგორია..."
              isDark={isDark}
            />
          </div>

          <div className="md:col-span-3 flex flex-col justify-end">
            <span className="block text-[11px] font-bold mb-1">ძიება კომენტარებში</span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                isDark
                  ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB]'
                  : 'bg-[#FAF3E3] border-[#6E472B]/50 text-[#21160F]'
              }`}
            >
              <Search className="w-4 h-4 text-[#8B5A2B] shrink-0" />
              <input
                type="text"
                value={commentarySearch}
                onChange={(e) => setCommentarySearch(e.target.value)}
                placeholder="სიტყვა (მაგ. מאימתי, גשמים, Taanit 5a)..."
                className="flex-1 min-w-0 bg-transparent text-xs outline-none"
              />
              <VoiceSearchMicButton
                onTranscript={(text) => setCommentarySearch(text)}
                isDark={isDark}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* SECTION A: TOSAFOT COMMENTARY CARDS IN RESPONSIVE CSS GRID              */}
        {/* ======================================================================= */}
        {(activeExplorerTab === 'all' || activeExplorerTab === 'tosafot') &&
          filteredTosafot.length > 0 && (
            <>
              <div className="col-span-full flex items-center justify-between gap-2 pt-2 border-t border-[#8B5A2B]/25">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-[#B8860B]">
                    תוספות • თოსაფოთი ({filteredTosafot.length})
                  </h4>
                  <span className="text-xs opacity-75">
                    · რბილი ანიმაციით გაშლა/დაკეცვა და ინტერაქტიული ციტირებული წყაროები (მაგ. Taanit 5a)
                  </span>
                </div>
              </div>

              {filteredTosafot.map((tos, idx) => {
                const entryKey = `tos-${tos.id}`;
                const isExpanded = !collapsedEntryIds[entryKey];
                const isTargetHighlighted = deepLinkedSentenceId === tos.id;
                const isCrossLinked =
                  isTargetHighlighted ||
                  (liveCrossHighlightEnabled && crossLinkedIds.has(tos.id));
                const letterHe = HEBREW_INDEX_LETTERS[idx] || String(idx + 1);

                const handleSelectSegment = (e: React.MouseEvent<HTMLElement>) => {
                  const targetEl = e.currentTarget;
                  onSetDeepLinkedSentenceId(tos.id);
                  onHoverSentence(tos);
                  const rect = targetEl.getBoundingClientRect();
                  if (typeof window !== 'undefined' && rect.bottom > window.innerHeight * 0.44) {
                    const deltaY = rect.top - 84;
                    if (Math.abs(deltaY) > 12) {
                      window.scrollBy({ top: deltaY, behavior: 'smooth' });
                    }
                  }
                  const leadWord =
                    tos.dibburHamatchil ||
                    (tos.hebrewText || '').split(/\s+/)[0] ||
                    'תוספות';
                  onSelectWordOrSentence?.(leadWord, tos, rect, 'sentence-ka');
                  onOpenWordNote?.();
                };

                return (
                  <motion.article
                    layout="position"
                    key={tos.id}
                    id={`commentary-card-tos-${tos.id}`}
                    data-commentary-card="tosafot"
                    onMouseEnter={() => {
                      if (liveCrossHighlightEnabled) onHoverSentence(tos);
                    }}
                    className={`relative min-w-0 max-w-full overflow-hidden break-words rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-start ${
                      isTargetHighlighted ? 'z-30 ' : 'z-0 hover:z-10 '
                    }${
                      isCrossLinked
                        ? isDark
                          ? 'bg-[#2E2012] border-[#FDE68A] ring-2 ring-[#FDE68A]/65'
                          : 'bg-[#FEF3C7] border-[#B45309] ring-2 ring-[#B45309]/50'
                        : isDark
                          ? 'bg-[#1D130D]/95 border-[#5C3A21] hover:border-[#C49A6C]'
                          : 'bg-[#FAF3E4] border-[#8B5A2B]/45 hover:border-[#6B4226]'
                    }`}
                  >
                    {/* Clickable Tosafot Card Header (triggers smooth Framer Motion expand/collapse) */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleEntryExpanded(entryKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleEntryExpanded(entryKey);
                        }
                      }}
                      className={`flex items-start justify-between gap-2.5 cursor-pointer select-none ${
                        isExpanded ? 'pb-3 border-b border-[#8B5A2B]/25' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          dir="rtl"
                          className="w-7 h-7 rounded-xl bg-[#6B4226] text-[#FAF5EB] font-serif text-xs font-black flex items-center justify-center shrink-0 shadow-2xs"
                        >
                          {letterHe}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs font-extrabold ${
                                isDark ? 'text-[#EED9B9]' : 'text-[#3B2313]'
                              }`}
                            >
                              თოსაფოთი · תוספות
                            </span>
                          </div>
                          {tos.dibburHamatchil && (
                            <div
                              dir="rtl"
                              className="font-serif text-xs font-black break-words mt-0.5 text-[#B8860B]"
                            >
                              ד״ה {tos.dibburHamatchil}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <WindowsWindowControls
                          isMinimized={!isExpanded}
                          onToggleMinimize={() => toggleEntryExpanded(entryKey)}
                          isMaximized={false}
                          onToggleMaximize={() =>
                            onOpenSectionFullscreen(
                              tos.id,
                              tos.dibburHamatchil ? `תוספות ד״ה ${tos.dibburHamatchil}` : 'תוספות',
                              'თოსაფოთი',
                              [tos],
                              true
                            )
                          }
                          isDark={isDark}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Framer Motion Smooth Height & Graceful Fade-In/Out Animation for Tosafot Entry Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="tosafot-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.22, ease: 'easeInOut' },
                          }}
                          className="min-w-0"
                        >
                          <div className="pt-3 max-h-[340px] overflow-y-auto overscroll-contain pr-1 break-words">
                            <div
                              dir="rtl"
                              onClick={handleSelectSegment}
                              style={{ fontSize: `${Math.round(14.5 * fontScaleRatio)}px` }}
                              className={`leading-relaxed text-justify mb-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10 ${
                                isDark ? 'text-[#FAF5EB]' : 'text-[#1F140B]'
                              }`}
                            >
                              {renderInlineInteractiveWords(tos, true, false)}
                            </div>

                            {tos.translationKa && (
                              <p
                                onClick={handleSelectSegment}
                                style={{ fontSize: `${Math.round(12 * fontScaleRatio)}px` }}
                                className="opacity-90 leading-relaxed border-t border-[#8B5A2B]/20 pt-2 mt-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10"
                              >
                                {renderTextWithInteractiveCitations(
                                  tos.translationKa,
                                  'თოსაფოთი',
                                  tos.dibburHamatchil,
                                  `commentary-card-tos-${tos.id}`,
                                  tos.id
                                )}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </>
          )}

        {/* ======================================================================= */}
        {/* SECTION B: RASHI COMMENTARY CARDS IN RESPONSIVE CSS GRID                */}
        {/* ======================================================================= */}
        {(activeExplorerTab === 'all' || activeExplorerTab === 'rashi') &&
          filteredRashi.length > 0 && (
            <>
              <div className="col-span-full flex items-center justify-between gap-2 pt-3 border-t border-[#8B5A2B]/25">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-[#B8860B]">
                    פירוש רש״י • რაშის კომენტარი ({filteredRashi.length})
                  </h4>
                  <span className="text-xs opacity-75">
                    · რბილი ანიმაციით გაშლა/დაკეცვა და ინტერაქტიული ციტირებული წყაროები (Jump-to-Reference)
                  </span>
                </div>
              </div>

              {filteredRashi.map((rashi, idx) => {
                const entryKey = `rashi-${rashi.id}`;
                const isExpanded = !collapsedEntryIds[entryKey];
                const isTargetHighlighted = deepLinkedSentenceId === rashi.id;
                const isCrossLinked =
                  isTargetHighlighted ||
                  (liveCrossHighlightEnabled && crossLinkedIds.has(rashi.id));
                const letterHe = HEBREW_INDEX_LETTERS[idx] || String(idx + 1);

                const handleSelectSegment = (e: React.MouseEvent<HTMLElement>) => {
                  const targetEl = e.currentTarget;
                  onSetDeepLinkedSentenceId(rashi.id);
                  onHoverSentence(rashi);
                  const rect = targetEl.getBoundingClientRect();
                  if (typeof window !== 'undefined' && rect.bottom > window.innerHeight * 0.44) {
                    const deltaY = rect.top - 84;
                    if (Math.abs(deltaY) > 12) {
                      window.scrollBy({ top: deltaY, behavior: 'smooth' });
                    }
                  }
                  const leadWord =
                    rashi.dibburHamatchil ||
                    (rashi.hebrewText || '').split(/\s+/)[0] ||
                    'רש״י';
                  onSelectWordOrSentence?.(leadWord, rashi, rect, 'sentence-ka');
                  onOpenWordNote?.();
                };

                return (
                  <motion.article
                    layout="position"
                    key={rashi.id}
                    id={`commentary-card-rashi-${rashi.id}`}
                    data-commentary-card="rashi"
                    onMouseEnter={() => {
                      if (liveCrossHighlightEnabled) onHoverSentence(rashi);
                    }}
                    className={`relative min-w-0 max-w-full overflow-hidden break-words rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-start ${
                      isTargetHighlighted ? 'z-30 ' : 'z-0 hover:z-10 '
                    }${
                      isCrossLinked
                        ? isDark
                          ? 'bg-[#2E2012] border-[#FDE68A] ring-2 ring-[#FDE68A]/65'
                          : 'bg-[#FEF3C7] border-[#B45309] ring-2 ring-[#B45309]/50'
                        : isDark
                          ? 'bg-[#1D130D]/95 border-[#5C3A21] hover:border-[#C49A6C]'
                          : 'bg-[#FAF3E4] border-[#8B5A2B]/45 hover:border-[#6B4226]'
                    }`}
                  >
                    {/* Clickable Rashi Card Header (triggers smooth Framer Motion expand/collapse) */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleEntryExpanded(entryKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleEntryExpanded(entryKey);
                        }
                      }}
                      className={`flex items-start justify-between gap-2.5 cursor-pointer select-none ${
                        isExpanded ? 'pb-3 border-b border-[#8B5A2B]/25' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          dir="rtl"
                          className="w-7 h-7 rounded-xl bg-[#5C3A21] text-[#FAF5EB] font-serif text-xs font-black flex items-center justify-center shrink-0 shadow-2xs"
                        >
                          {letterHe}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs font-extrabold ${
                                isDark ? 'text-[#EED9B9]' : 'text-[#3B2313]'
                              }`}
                            >
                              რაში · רש״י
                            </span>
                          </div>
                          {rashi.dibburHamatchil && (
                            <div
                              dir="rtl"
                              className="font-serif text-xs font-black break-words mt-0.5 text-[#B8860B]"
                            >
                              ד״ה {rashi.dibburHamatchil}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <WindowsWindowControls
                          isMinimized={!isExpanded}
                          onToggleMinimize={() => toggleEntryExpanded(entryKey)}
                          isMaximized={false}
                          onToggleMaximize={() =>
                            onOpenSectionFullscreen(
                              rashi.id,
                              rashi.dibburHamatchil ? `רש״י ד״ה ${rashi.dibburHamatchil}` : 'רש״י',
                              'რაშის კომენტარი',
                              [rashi],
                              true
                            )
                          }
                          isDark={isDark}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Framer Motion Smooth Height & Graceful Fade-In/Out Animation for Rashi Entry Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="rashi-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.22, ease: 'easeInOut' },
                          }}
                          className="min-w-0"
                        >
                          <div className="pt-3 max-h-[340px] overflow-y-auto overscroll-contain pr-1 break-words">
                            <div
                              dir="rtl"
                              onClick={handleSelectSegment}
                              style={{ fontSize: `${Math.round(14.5 * fontScaleRatio)}px` }}
                              className={`leading-relaxed text-justify mb-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10 ${
                                isDark ? 'text-[#FAF5EB]' : 'text-[#1F140B]'
                              }`}
                            >
                              {renderInlineInteractiveWords(rashi, true, false)}
                            </div>

                            {rashi.translationKa && (
                              <p
                                onClick={handleSelectSegment}
                                style={{ fontSize: `${Math.round(12 * fontScaleRatio)}px` }}
                                className="opacity-90 leading-relaxed border-t border-[#8B5A2B]/20 pt-2 mt-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10"
                              >
                                {renderTextWithInteractiveCitations(
                                  rashi.translationKa,
                                  'რაში',
                                  rashi.dibburHamatchil,
                                  `commentary-card-rashi-${rashi.id}`,
                                  rashi.id
                                )}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </>
          )}

        {/* ======================================================================= */}
        {/* SECTION C: ALL OTHER SEFARIA COMMENTARY CARDS IN RESPONSIVE CSS GRID    */}
        {/* ======================================================================= */}
        {(activeExplorerTab === 'all' || activeExplorerTab === 'other') && (
          <>
            <div className="col-span-full flex items-center justify-between gap-2 pt-3 border-t border-[#8B5A2B]/25">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-[#B8860B]">
                  שאר מפרשי הדף • სეფარიას სხვა კომენტატორები ({filteredCommentaries.length})
                </h4>
              </div>
            </div>

            {filteredCommentaries.slice(0, visibleCommCount).map((comm, commIdx) => {
              const entryKey = `comm-${comm.id}`;
              const isExpanded = !collapsedEntryIds[entryKey];

              const georgianText =
                commGeorgianMap[comm.id] ||
                (!containsLatinButNoGeorgian(comm.translationKa || '')
                  ? comm.translationKa
                  : `${comm.commentatorKa} — ${comm.categoryKa}`);

              const interactiveSent = makeInteractiveSentence(
                `sefaria-comm-${comm.id}`,
                'meforshim',
                comm.he,
                georgianText || comm.commentatorKa,
                `${comm.commentatorKa} (${comm.ref}) — ${comm.categoryKa}`,
                comm.anchorText,
                comm.commentatorHe,
                comm.commentatorKa
              );

              const isTargetHighlighted = deepLinkedSentenceId === interactiveSent.id;
              const isCommCrossLinked =
                isTargetHighlighted ||
                (liveCrossHighlightEnabled && crossLinkedIds.has(interactiveSent.id));

              const handleSelectCommSegment = (e: React.MouseEvent<HTMLElement>) => {
                const targetEl = e.currentTarget;
                onSetDeepLinkedSentenceId(interactiveSent.id);
                onHoverSentence(interactiveSent);
                const rect = targetEl.getBoundingClientRect();
                if (typeof window !== 'undefined' && rect.bottom > window.innerHeight * 0.44) {
                  const deltaY = rect.top - 84;
                  if (Math.abs(deltaY) > 12) {
                    window.scrollBy({ top: deltaY, behavior: 'smooth' });
                  }
                }
                const leadWord =
                  comm.anchorText ||
                  (comm.he || '').split(/\s+/)[0] ||
                  comm.commentatorHe;
                onSelectWordOrSentence?.(leadWord, interactiveSent, rect, 'sentence-ka');
                onOpenWordNote?.();
              };

              return (
                <motion.article
                  layout="position"
                  key={comm.id}
                  id={`commentary-card-comm-${comm.id}`}
                  data-commentary-card="sefaria-commentary"
                  onMouseEnter={() => {
                    if (liveCrossHighlightEnabled) {
                      onHoverSentence(interactiveSent);
                    }
                  }}
                  className={`relative min-w-0 max-w-full overflow-hidden break-words rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-start ${
                    isTargetHighlighted ? 'z-30 ' : 'z-0 hover:z-10 '
                  }${
                    isCommCrossLinked
                      ? isDark
                        ? 'bg-[#2E2012] border-[#FDE68A] ring-2 ring-[#FDE68A]/65'
                        : 'bg-[#FEF3C7] border-[#B45309] ring-2 ring-[#B45309]/50'
                      : isDark
                        ? 'bg-[#1D130D]/95 border-[#5C3A21] hover:border-[#C49A6C]'
                        : 'bg-[#FAF3E4] border-[#8B5A2B]/45 hover:border-[#6B4226]'
                  }`}
                >
                  {/* Clickable Card Header for Smooth Framer Motion Expand/Collapse */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => toggleEntryExpanded(entryKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleEntryExpanded(entryKey);
                      }
                    }}
                    className={`flex items-start justify-between gap-2.5 cursor-pointer select-none ${
                      isExpanded ? 'pb-3 border-b border-[#8B5A2B]/25' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                      <span
                        className={`text-xs font-extrabold break-words ${
                          isDark ? 'text-[#EED9B9]' : 'text-[#3B2313]'
                        }`}
                      >
                        {comm.commentatorKa}
                      </span>
                      <span className="text-[11px] opacity-70 truncate">
                        · {comm.categoryKa}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span
                        dir="rtl"
                        className={`text-xs font-serif font-bold px-2 py-0.5 rounded ${
                          isDark
                            ? 'bg-[#362519] text-[#EED9B9]'
                            : 'bg-[#E5D6BC] text-[#3B2313]'
                        }`}
                      >
                        {comm.heRef || comm.commentatorHe}
                      </span>
                      <WindowsWindowControls
                        isMinimized={!isExpanded}
                        onToggleMinimize={() => toggleEntryExpanded(entryKey)}
                        isMaximized={false}
                        onToggleMaximize={() =>
                          onOpenSectionFullscreen(
                            comm.id,
                            comm.heRef || comm.commentatorHe,
                            comm.commentatorKa,
                            [interactiveSent],
                            true
                          )
                        }
                        isDark={isDark}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Framer Motion Smooth Height & Graceful Fade-In/Out Animation for Commentary Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="comm-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.22, ease: 'easeInOut' },
                        }}
                        className="min-w-0"
                      >
                        <div className="pt-3 max-h-[340px] overflow-y-auto overscroll-contain pr-1 break-words">
                          <div
                            dir="rtl"
                            onClick={handleSelectCommSegment}
                            style={{ fontSize: `${Math.round(14.5 * fontScaleRatio)}px` }}
                            className={`leading-relaxed text-justify mb-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10 ${
                              isDark ? 'text-[#FAF5EB]' : 'text-[#1F140B]'
                            }`}
                          >
                            {renderInlineInteractiveWords(interactiveSent, true, false)}
                          </div>

                          {georgianText && (
                            <p
                              onClick={handleSelectCommSegment}
                              style={{ fontSize: `${Math.round(12 * fontScaleRatio)}px` }}
                              className="opacity-90 leading-relaxed border-t border-[#8B5A2B]/20 pt-2 mt-2 break-words cursor-pointer rounded-lg p-1 -m-1 transition-colors hover:bg-amber-500/10"
                            >
                              {renderTextWithInteractiveCitations(
                                georgianText,
                                comm.commentatorKa,
                                comm.anchorText || comm.heRef,
                                `commentary-card-comm-${comm.id}`,
                                interactiveSent.id
                              )}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}

            {filteredCommentaries.length > visibleCommCount && (
              <div className="col-span-full mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCommCount((prev) => prev + 30)}
                  className="px-5 py-2.5 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  მაჩვენე მეტი კომენტარი ({filteredCommentaries.length - visibleCommCount} დარჩენილია)
                </button>
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
});
