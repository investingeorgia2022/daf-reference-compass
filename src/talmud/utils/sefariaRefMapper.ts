// @ts-nocheck
import { DafPageData, SefariaCommentaryItem, TalmudSentence } from '../types/talmud';

export interface ParsedSefariaRef {
  rawRef: string;
  tractateId?: string;
  dafId?: string;
  isAmudBet?: boolean;
  segmentIndex?: number; // 1-based segment on the daf
  commentator?: string;
  commentaryClause?: number;
  refType: 'talmud-segment' | 'commentary' | 'ein-mishpat' | 'mesorat-hashas' | 'torah-or' | 'generic';
}

export interface SefariaResolvedDomAnchor {
  ref: string;
  parsed: ParsedSefariaRef;
  sentenceId: string | null;
  elementId: string | null;
  targetElement: HTMLElement | null;
  sectionId: string | null;
  labelKa: string;
  labelHe: string;
  matchType: 'exact-segment' | 'mishnah' | 'gemara' | 'rashi' | 'tosafot' | 'sefaria-comm' | 'margin-ref' | 'pdf-hotspot' | 'fallback';
}

export interface ScrollCoordinateMetrics {
  elementId: string | null;
  sentenceId: string | null;
  ref: string | null;
  targetDocY: number;
  targetElementHeight: number;
  containerHeight: number;
  currentScrollTop: number;
  calculatedTargetScrollTop: number;
  deltaPx: number; // current - calculatedTarget
  isLocked: boolean; // |deltaPx| <= 4
  viewportTop: number;
  recalculationCount: number;
  lastRecalculatedAt: number;
  cause: string;
}

/**
 * Normalizes Hebrew text for fuzzy anchor/snippet matching
 */
export function normalizeHebrewText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05C7]/g, '') // remove nikud/cantillation
    .replace(/[()[\].,:;!?'"״״׳]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses Sefaria standard citation references:
 * e.g.:
 * - "Berakhot 2a:3" or "Berakhot.2a.3" -> Talmud segment 3 on 2a
 * - "Rashi on Berakhot 2a:1:1" -> Rashi on segment 1, clause 1
 * - "Tosafot on Berakhot 2a:2:1" -> Tosafot on segment 2, clause 1
 * - "Rashba on Berakhot 2a:1:2" -> Rashba commentary
 * - "Ein Mishpat / Ner Mitsvah on Berakhot 2a:1"
 * - "Mesorat HaShas on Berakhot 2a:1"
 */
export function parseSefariaRef(ref: string): ParsedSefariaRef {
  const cleanRef = (ref || '').trim();

  // 1. Commentary pattern: e.g. "Rashi on Berakhot 2a:1:1" or "Tosafot on Berakhot 2a.1.1"
  const commMatch = cleanRef.match(
    /^([A-Za-z\s'/]+)\s+on\s+([A-Za-z_]+)\s+(\d{1,3}[ab])(?:[:.](\d+))?(?:[:.](\d+))?/i
  );
  if (commMatch) {
    const commentator = commMatch[1].trim();
    const tractateId = commMatch[2].trim();
    const dafId = commMatch[3].toLowerCase();
    const segIdx = commMatch[4] ? parseInt(commMatch[4], 10) : undefined;
    const clauseIdx = commMatch[5] ? parseInt(commMatch[5], 10) : undefined;

    let refType: ParsedSefariaRef['refType'] = 'commentary';
    if (/ein\s*mishpat/i.test(commentator)) {
      refType = 'ein-mishpat';
    } else if (/mesorat\s*hashas/i.test(commentator)) {
      refType = 'mesorat-hashas';
    } else if (/torah\s*o(?:h)?r/i.test(commentator)) {
      refType = 'torah-or';
    }

    return {
      rawRef: cleanRef,
      commentator,
      tractateId,
      dafId,
      isAmudBet: dafId.endsWith('b'),
      segmentIndex: segIdx,
      commentaryClause: clauseIdx,
      refType,
    };
  }

  // 2. Halakhic & Special links: e.g. "Ein Mishpat, Berakhot 2a:1"
  const einMishpatCommaMatch = cleanRef.match(
    /^(Ein\s*Mishpat|Ner\s*Mitsvah)[^,]*,\s*([A-Za-z_]+)\s+(\d{1,3}[ab])(?:[:.](\d+))?/i
  );
  if (einMishpatCommaMatch) {
    return {
      rawRef: cleanRef,
      commentator: einMishpatCommaMatch[1].trim(),
      tractateId: einMishpatCommaMatch[2].trim(),
      dafId: einMishpatCommaMatch[3].toLowerCase(),
      isAmudBet: einMishpatCommaMatch[3].toLowerCase().endsWith('b'),
      segmentIndex: einMishpatCommaMatch[4] ? parseInt(einMishpatCommaMatch[4], 10) : undefined,
      refType: 'ein-mishpat',
    };
  }

  // 3. Talmud standard text segment: e.g. "Berakhot 2a:5" or "Berakhot.2a.5"
  const segmentMatch = cleanRef.match(
    /^([A-Za-z_]+)\s+(\d{1,3}[ab])(?:[:.](\d+))?$/i
  );
  if (segmentMatch) {
    const tractateId = segmentMatch[1].trim();
    const dafId = segmentMatch[2].toLowerCase();
    const segIdx = segmentMatch[3] ? parseInt(segmentMatch[3], 10) : 1;
    return {
      rawRef: cleanRef,
      tractateId,
      dafId,
      isAmudBet: dafId.endsWith('b'),
      segmentIndex: segIdx,
      refType: 'talmud-segment',
    };
  }

  // 4. Dot notation: "Berakhot.2a.1"
  const dotMatch = cleanRef.match(
    /^([A-Za-z_]+)\.(\d{1,3}[ab])(?:\.(\d+))?$/i
  );
  if (dotMatch) {
    const tractateId = dotMatch[1].trim();
    const dafId = dotMatch[2].toLowerCase();
    const segIdx = dotMatch[3] ? parseInt(dotMatch[3], 10) : 1;
    return {
      rawRef: cleanRef,
      tractateId,
      dafId,
      isAmudBet: dafId.endsWith('b'),
      segmentIndex: segIdx,
      refType: 'talmud-segment',
    };
  }

  return {
    rawRef: cleanRef,
    refType: 'generic',
  };
}

/**
 * Coordinate lookup map: Translates Sefaria reference strings or segment indices into
 * precise DOM elements and target coordinates in ClassicTalmudDaf.
 */
export function lookupSefariaRefDomAnchor(
  refOrId: string,
  dafData: DafPageData,
  effectiveMishnah: TalmudSentence[] = [],
  effectiveGemara: TalmudSentence[] = [],
  effectiveRashi: TalmudSentence[] = [],
  effectiveTosafot: TalmudSentence[] = [],
  allCommentaries: SefariaCommentaryItem[] = []
): SefariaResolvedDomAnchor {
  const parsed = parseSefariaRef(refOrId);
  const mishnahLen = effectiveMishnah.length;

  // Case A: Direct sentence ID match passed in
  if (refOrId.startsWith('ber-') || refOrId.startsWith('shab-') || refOrId.includes('-m') || refOrId.includes('-g') || refOrId.startsWith('sentence-')) {
    const cleanId = refOrId.replace(/^sentence-/, '');
    const domEl =
      document.getElementById(`sentence-${cleanId}`) ||
      (document.querySelector(`[data-sentence-id="${cleanId}"]`) as HTMLElement | null);
    if (domEl) {
      return {
        ref: refOrId,
        parsed,
        sentenceId: cleanId,
        elementId: domEl.id || `sentence-${cleanId}`,
        targetElement: domEl,
        sectionId: domEl.closest('[id^="daf-section-"]')?.id || null,
        labelKa: 'მიმდინარე წინადადება',
        labelHe: 'משפט נבחר',
        matchType: 'exact-segment',
      };
    }
  }

  // Case B: Talmud main text segment (e.g. "Berakhot 2a:2" or segmentIndex = 2)
  if (parsed.refType === 'talmud-segment' && parsed.segmentIndex !== undefined) {
    const segIdx = parsed.segmentIndex;
    let targetSentence: TalmudSentence | null = null;
    let matchType: SefariaResolvedDomAnchor['matchType'] = 'exact-segment';

    if (mishnahLen > 0 && segIdx <= mishnahLen) {
      targetSentence = effectiveMishnah[segIdx - 1];
      matchType = 'mishnah';
    } else {
      const gemaraIdx = Math.max(0, segIdx - mishnahLen - 1);
      targetSentence = effectiveGemara[gemaraIdx] || effectiveGemara[0] || effectiveMishnah[0] || null;
      matchType = 'gemara';
    }

    if (targetSentence) {
      const el =
        document.getElementById(`sentence-${targetSentence.id}`) ||
        (document.querySelector(`[data-sentence-id="${targetSentence.id}"]`) as HTMLElement | null);

      return {
        ref: refOrId,
        parsed,
        sentenceId: targetSentence.id,
        elementId: el ? el.id : `sentence-${targetSentence.id}`,
        targetElement: el,
        sectionId: matchType === 'mishnah' ? 'daf-section-mishnah' : 'daf-section-gemara',
        labelKa: `${matchType === 'mishnah' ? 'მიშნა' : 'გემარა'} სეგმენტი ${segIdx}`,
        labelHe: `${matchType === 'mishnah' ? 'משנה' : 'גמרא'} אות ${segIdx}`,
        matchType,
      };
    }
  }

  // Case C: Commentary on Daf (e.g. "Rashi on Berakhot 2a:1:1" or "Rashba on Berakhot 2a:2:1")
  if (parsed.refType === 'commentary' && parsed.commentator) {
    const cName = parsed.commentator.toLowerCase();

    // 1. Check Rashi
    if (cName.includes('rashi')) {
      const rIdx = (parsed.segmentIndex ? parsed.segmentIndex - 1 : 0);
      const rSent = effectiveRashi[rIdx] || effectiveRashi[0];
      if (rSent) {
        const el =
          document.getElementById(`sentence-${rSent.id}`) ||
          document.getElementById(`commentary-card-rashi-${rSent.id}`) ||
          (document.querySelector(`[data-sentence-id="${rSent.id}"]`) as HTMLElement | null);
        return {
          ref: refOrId,
          parsed,
          sentenceId: rSent.id,
          elementId: el?.id || `sentence-${rSent.id}`,
          targetElement: el,
          sectionId: 'daf-section-rashi',
          labelKa: `რაში (სეგმენტი ${parsed.segmentIndex || 1})`,
          labelHe: `רש״י אות ${parsed.segmentIndex || 1}`,
          matchType: 'rashi',
        };
      }
    }

    // 2. Check Tosafot
    if (cName.includes('tosafot')) {
      const tIdx = (parsed.segmentIndex ? parsed.segmentIndex - 1 : 0);
      const tSent = effectiveTosafot[tIdx] || effectiveTosafot[0];
      if (tSent) {
        const el =
          document.getElementById(`sentence-${tSent.id}`) ||
          document.getElementById(`commentary-card-tos-${tSent.id}`) ||
          (document.querySelector(`[data-sentence-id="${tSent.id}"]`) as HTMLElement | null);
        return {
          ref: refOrId,
          parsed,
          sentenceId: tSent.id,
          elementId: el?.id || `sentence-${tSent.id}`,
          targetElement: el,
          sectionId: 'daf-section-tosafot',
          labelKa: `თოსაფოთი (სეგმენტი ${parsed.segmentIndex || 1})`,
          labelHe: `תוספות אות ${parsed.segmentIndex || 1}`,
          matchType: 'tosafot',
        };
      }
    }

    // 3. Search in Sefaria allCommentaries list
    const matchedComm = allCommentaries.find((comm) => {
      if (comm.ref && comm.ref.toLowerCase().includes(parsed.rawRef.toLowerCase())) return true;
      if (
        comm.commentatorEn &&
        cName.includes(comm.commentatorEn.toLowerCase()) &&
        parsed.segmentIndex !== undefined &&
        comm.anchorVerse === parsed.segmentIndex
      ) {
        return true;
      }
      return false;
    });

    if (matchedComm) {
      const commElId = `commentary-card-comm-${matchedComm.id}`;
      const sentElId = `sentence-sefaria-comm-${matchedComm.id}`;
      const el =
        document.getElementById(sentElId) ||
        document.getElementById(commElId) ||
        (document.querySelector(`[data-sentence-id="sefaria-comm-${matchedComm.id}"]`) as HTMLElement | null);

      return {
        ref: refOrId,
        parsed,
        sentenceId: `sefaria-comm-${matchedComm.id}`,
        elementId: el?.id || commElId,
        targetElement: el,
        sectionId: 'daf-section-sefaria-all',
        labelKa: `${matchedComm.commentatorKa} (${matchedComm.ref})`,
        labelHe: matchedComm.commentatorHe,
        matchType: 'sefaria-comm',
      };
    }
  }

  // Case D: Margin annotations (Ein Mishpat, Mesorat HaShas, Torah Ohr)
  if (parsed.refType === 'ein-mishpat') {
    const el =
      (document.querySelector('[data-commentary-type="ein-mishpat"]') as HTMLElement | null) ||
      document.getElementById('daf-section-ein-mishpat') ||
      document.getElementById('sentence-ein-mishpat-1');
    return {
      ref: refOrId,
      parsed,
      sentenceId: 'ein-mishpat-1',
      elementId: el?.id || 'daf-section-ein-mishpat',
      targetElement: el,
      sectionId: 'daf-section-ein-mishpat',
      labelKa: 'ეინ მიშპატი (ჰალახა)',
      labelHe: 'עין משפט',
      matchType: 'margin-ref',
    };
  }

  if (parsed.refType === 'mesorat-hashas') {
    const el =
      (document.querySelector('[data-commentary-type="masoret"]') as HTMLElement | null) ||
      document.getElementById('daf-section-masoret') ||
      document.getElementById('sentence-masoret-1');
    return {
      ref: refOrId,
      parsed,
      sentenceId: 'masoret-1',
      elementId: el?.id || 'daf-section-masoret',
      targetElement: el,
      sectionId: 'daf-section-masoret',
      labelKa: 'მასორეთ ჰაშასი',
      labelHe: 'מסורת הש״ס',
      matchType: 'margin-ref',
    };
  }

  // Case E: Check PDF Hotspots if active in Vilna PDF submode
  const pdfHotspotEl = document.querySelector(`[data-sentence-id="${refOrId}"]`) as HTMLElement | null;
  if (pdfHotspotEl) {
    return {
      ref: refOrId,
      parsed,
      sentenceId: refOrId,
      elementId: pdfHotspotEl.id,
      targetElement: pdfHotspotEl,
      sectionId: 'talmud-daf-folio-anchor',
      labelKa: 'ვილნის დაფის წერტილი',
      labelHe: 'צורת הדף',
      matchType: 'pdf-hotspot',
    };
  }

  // Fallback to primary gemara or mishnah
  const fallbackSent = effectiveGemara[0] || effectiveMishnah[0];
  const fallbackEl = fallbackSent ? document.getElementById(`sentence-${fallbackSent.id}`) : null;

  return {
    ref: refOrId,
    parsed,
    sentenceId: fallbackSent?.id || null,
    elementId: fallbackEl?.id || 'talmud-daf-folio-anchor',
    targetElement: fallbackEl,
    sectionId: 'talmud-daf-folio-anchor',
    labelKa: 'დაფის დასაწყისი',
    labelHe: 'ראש הדף',
    matchType: 'fallback',
  };
}

/**
 * Calculates precise scroll coordinates for a target element relative to its scroll container
 * (either `#talmud-daf-folio-anchor` if full viewport, or window document).
 */
export function calculateScrollCoordinates(
  targetEl: HTMLElement,
  containerEl: HTMLElement | null,
  isFullViewport: boolean,
  cause = 'manual'
): ScrollCoordinateMetrics {
  const targetRect = targetEl.getBoundingClientRect();
  const targetElementHeight = targetRect.height;
  const sentenceId = targetEl.getAttribute('data-sentence-id') || targetEl.id.replace(/^sentence-/, '');

  if (isFullViewport && containerEl) {
    const containerRect = containerEl.getBoundingClientRect();
    const containerHeight = containerEl.clientHeight;
    const currentScrollTop = containerEl.scrollTop;

    // Target element's position relative to the scroll container's content top:
    const targetOffsetInScrollContainer = currentScrollTop + (targetRect.top - containerRect.top);
    // Center target comfortably (~38% from top of container viewport)
    const targetCenterOffset = targetOffsetInScrollContainer - containerHeight * 0.38 + targetElementHeight * 0.5;
    const calculatedTargetScrollTop = Math.max(
      0,
      Math.min(containerEl.scrollHeight - containerHeight, Math.round(targetCenterOffset))
    );
    const deltaPx = currentScrollTop - calculatedTargetScrollTop;

    return {
      elementId: targetEl.id,
      sentenceId,
      ref: targetEl.getAttribute('data-sefaria-ref') || null,
      targetDocY: Math.round(targetOffsetInScrollContainer),
      targetElementHeight: Math.round(targetElementHeight),
      containerHeight: Math.round(containerHeight),
      currentScrollTop: Math.round(currentScrollTop),
      calculatedTargetScrollTop,
      deltaPx: Math.round(deltaPx),
      isLocked: Math.abs(deltaPx) <= 4,
      viewportTop: Math.round(targetRect.top),
      recalculationCount: 1,
      lastRecalculatedAt: Date.now(),
      cause,
    };
  }

  // Standard window scrolling mode:
  const windowScrollY = typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop || 0 : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const targetDocY = windowScrollY + targetRect.top;

  // Center target comfortably (~36% from top of screen viewport to account for navigation bars)
  const calculatedTargetScrollTop = Math.max(
    0,
    Math.round(targetDocY - viewportHeight * 0.36 + targetElementHeight * 0.5)
  );
  const deltaPx = windowScrollY - calculatedTargetScrollTop;

  return {
    elementId: targetEl.id,
    sentenceId,
    ref: targetEl.getAttribute('data-sefaria-ref') || null,
    targetDocY: Math.round(targetDocY),
    targetElementHeight: Math.round(targetElementHeight),
    containerHeight: viewportHeight,
    currentScrollTop: Math.round(windowScrollY),
    calculatedTargetScrollTop,
    deltaPx: Math.round(deltaPx),
    isLocked: Math.abs(deltaPx) <= 4,
    viewportTop: Math.round(targetRect.top),
    recalculationCount: 1,
    lastRecalculatedAt: Date.now(),
    cause,
  };
}
