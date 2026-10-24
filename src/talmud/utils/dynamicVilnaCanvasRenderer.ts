// @ts-nocheck
import { DafPageData, TalmudSentence } from '../types/talmud';
import { normalizeHebrewWord } from '../data/lexicon';
import type { VilnaPdfHotspot, MarginCommentaryType } from '../components/VilnaPdfInteractiveViewer';

/**
 * Tints ONLY the dark ink glyph pixels of citation/linked hotspots on a 2D canvas into crisp Royal Blue (#1D4ED8),
 * leaving all light paper/parchment background pixels 100% untouched (no background box!).
 */
export function tintCitationHotspotsBlueOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  hotspots: VilnaPdfHotspot[],
  citationHotspotIds: Set<string>
): void {
  if (!ctx || canvasWidth <= 0 || canvasHeight <= 0 || citationHotspotIds.size === 0) {
    return;
  }

  for (const h of hotspots) {
    if (!citationHotspotIds.has(h.id)) continue;

    // Markers have an enlarged tap area; tint only their exact glyph box so
    // neighbouring letters of regular words never turn blue.
    const L = h.inkLeftPct ?? h.leftPct;
    const T = h.inkTopPct ?? h.topPct;
    const W = h.inkWidthPct ?? h.widthPct;
    const H = h.inkHeightPct ?? h.heightPct;
    const rx = Math.max(0, Math.floor((L / 100) * canvasWidth));
    const ry = Math.max(0, Math.floor((T / 100) * canvasHeight));
    const rw = Math.min(canvasWidth - rx, Math.ceil((W / 100) * canvasWidth) + 1);
    const rh = Math.min(canvasHeight - ry, Math.ceil((H / 100) * canvasHeight) + 1);

    if (rw <= 1 || rh <= 1) continue;

    try {
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;

      for (let p = 0; p < data.length; p += 4) {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const a = data[p + 3];
        if (a < 30) continue;

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Only tint ink pixels (lum < 0.84); leave paper pixels (lum >= 0.84) 100% untouched!
        if (lum < 0.84) {
          const inkStrength = Math.min(1, (0.86 - lum) / 0.58);
          // Royal Blue ink (#1D4ED8 -> R:29, G:78, B:216)
          data[p] = Math.round(r * (1 - inkStrength) + 29 * inkStrength);
          data[p + 1] = Math.round(g * (1 - inkStrength) + 78 * inkStrength);
          data[p + 2] = Math.round(b * (1 - inkStrength) + 216 * inkStrength);
        }
      }

      ctx.putImageData(imgData, rx, ry);
    } catch {
      // Ignore cross-origin or bounds errors if any
    }
  }
}

/**
 * Renders a high-DPI, authentic Vilna Tzurat HaDaf page onto the 2D canvas for any Daf
 * that does not have a static PDF file in /public/vilna-pdf, and returns exact word-level VilnaPdfHotspots.
 */
export function renderDynamicVilnaDafToCanvas(
  canvas: HTMLCanvasElement,
  dafData: DafPageData,
  tractateNameHe: string,
  tractateNameKa: string,
  dafMarkHe: string,
  effectiveMishnah: TalmudSentence[],
  effectiveGemara: TalmudSentence[],
  effectiveRashi: TalmudSentence[],
  effectiveTosafot: TalmudSentence[]
): VilnaPdfHotspot[] {
  const W = 1288;
  const H = 1985;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const isAmudBet = dafData.dafId.endsWith('b');
  const hotspots: VilnaPdfHotspot[] = [];
  let hotspotSeq = 1;

  // 1. Classic Vilna cream paper background
  ctx.fillStyle = '#FDFBF4';
  ctx.fillRect(0, 0, W, H);

  // Subtle classic Vilna outer & inner frame rules
  ctx.strokeStyle = 'rgba(60, 38, 20, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // 2. Crown Header (Tractate Name, Chapter Name, Daf & Amud Mark)
  ctx.fillStyle = '#140E08';
  ctx.textBaseline = 'top';
  ctx.direction = 'rtl';

  const isSiddur = dafData.tractateId.startsWith('Siddur_');
  const amudLabelHe = isSiddur ? '' : isAmudBet ? 'ע״ב' : 'ע״א';
  const dafNumHe = dafData.dafNumberHe || dafMarkHe || dafData.dafId;
  const chapterHe = dafData.perekNameHe || dafData.chapterNameHe || (isSiddur ? 'תפילות וברכות' : 'פרק ראשון');
  const chapterNumHe = dafData.chapterNumHe || (isSiddur ? 'כוונת הלב' : 'פרק א׳');

  // Right header: Chapter name & number
  ctx.font = 'bold 24px "Frank Ruhl Libre", "David Libre", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${chapterHe} • ${chapterNumHe}`, W * 0.80, 40);

  // Center header: Large Tractate / Siddur Title
  ctx.font = '900 40px "Frank Ruhl Libre", "David Libre", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(isSiddur ? tractateNameHe : `מסכת ${tractateNameHe}`, W * 0.50, 32);

  // Left header: Daf & Amud mark
  ctx.font = '900 28px "Frank Ruhl Libre", "David Libre", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    isSiddur ? `עמוד ${dafNumHe}` : `דף ${dafNumHe} ${amudLabelHe} (${dafData.dafId})`,
    W * 0.145,
    38
  );

  // Header divider line
  ctx.strokeStyle = 'rgba(60, 38, 20, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W * 0.142, 82);
  ctx.lineTo(W * 0.802, 82);
  ctx.stroke();

  // Helper to draw RTL justified/right-aligned lines of words within a column box and record exact hotspots
  const drawColumnBlock = (
    sentences: TalmudSentence[],
    section: VilnaPdfHotspot['section'],
    colLeftPct: number,
    colRightPct: number,
    startTopPct: number,
    maxBottomPct: number,
    fontPx: number,
    lineHeightPx: number,
    sectionHeaderHe?: string,
    isRashiFont = false,
    marginCommType?: MarginCommentaryType
  ): number => {
    const colRightX = (colRightPct / 100) * W;
    const colLeftX = (colLeftPct / 100) * W;
    const maxColWidth = colRightX - colLeftX;
    let curY = (startTopPct / 100) * H;
    const maxY = (maxBottomPct / 100) * H;

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#120C07';

    if (sectionHeaderHe && curY + lineHeightPx < maxY) {
      ctx.font = `900 ${Math.round(fontPx * 1.06)}px "Frank Ruhl Libre", "David Libre", serif`;
      const centerColX = (colLeftX + colRightX) / 2;
      ctx.textAlign = 'center';
      ctx.fillText(sectionHeaderHe, centerColX, curY);
      ctx.textAlign = 'right';
      curY += lineHeightPx * 1.15;
    }

    const fontFamily = isRashiFont
      ? '"Noto Rashi Hebrew", "Frank Ruhl Libre", "David Libre", serif'
      : '"Frank Ruhl Libre", "David Libre", Georgia, serif';

    let rowCounter = 1;

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      if (curY + lineHeightPx > maxY) break;
      const sent = sentences[sIdx];
      const prefixTag =
        sIdx === 0 && section === 'mishnah'
          ? 'מתני׳ '
          : sIdx === 0 && section === 'gemara'
            ? 'גמ׳ '
            : '';
      const dibbur = sent.dibburHamatchil ? `${sent.dibburHamatchil} — ` : '';
      const rawBody = sent.hebrewText || sent.hebrew || '';
      const fullText = `${prefixTag}${dibbur}${rawBody}`.replace(/\s+/g, ' ').trim();
      if (!fullText) continue;

      const words = fullText.split(' ').filter(Boolean);
      const dibburWordCount =
        (prefixTag ? 1 : 0) +
        (sent.dibburHamatchil ? sent.dibburHamatchil.split(/\s+/).filter(Boolean).length + 1 : 0);

      // Break words into lines that fit within maxColWidth
      let lineWords: Array<{ word: string; isBold: boolean; wPx: number }> = [];
      let lineWidthPx = 0;
      const spacePx = Math.max(4, fontPx * 0.28);

      const flushLine = (items: Array<{ word: string; isBold: boolean; wPx: number }>) => {
        if (items.length === 0 || curY + lineHeightPx > maxY) return;
        const rowId = `dyn-${dafData.tractateId}-${dafData.dafId}-${section}-r${rowCounter++}`;
        const lineTextHe = items.map((it) => it.word).join(' ');
        let cursorRightX = colRightX;

        for (let wIdx = 0; wIdx < items.length; wIdx++) {
          const item = items[wIdx];
          ctx.font = `${item.isBold ? '900' : '600'} ${fontPx}px ${fontFamily}`;
          ctx.fillStyle = '#120C07';
          ctx.fillText(item.word, cursorRightX, curY);

          const wordLeftX = Math.max(colLeftX, cursorRightX - item.wPx);
          const leftPct = Number(((wordLeftX / W) * 100).toFixed(3));
          const topPct = Number(((curY / H) * 100).toFixed(3));
          const widthPct = Number((Math.max(0.55, (item.wPx / W) * 100)).toFixed(3));
          const heightPct = Number((((fontPx * 1.18) / H) * 100).toFixed(3));
          const cleanW = normalizeHebrewWord(item.word) || item.word.replace(/[^\u05D0-\u05EA0-9]/g, '');
          const rawW = item.word.trim();
          const isSmallMarker =
            section !== 'margin' && (
              (/^[\(\[][\u05D0-\u05EA]{1,2}[)\]][.:]?$/.test(rawW) && !rawW.includes('דף')) ||
              (/^[)\]][\u05D0-\u05EA]{1,2}[\(\[][.:]?$/.test(rawW) && !rawW.includes('דף')) ||
              (/^[\(\)]([\u05D0-\u05EA]|י[א-ט])[.:]?$/.test(rawW) || /^([\u05D0-\u05EA]|י[א-ט])[\(\)][.:]?$/.test(rawW)) ||
              (/^[(\[]?[0-9]{1,2}[)\].,:;\-–—־]?$/.test(rawW) && !/[\u0590-\u05FF]/.test(rawW))
            );

          let markerTargetType: MarginCommentaryType | undefined = undefined;
          if (isSmallMarker) {
            if (/^[0-9]+$/.test(cleanW)) {
              markerTargetType = 'torah-or';
            } else if (rawW.includes('(') && rawW.includes(')')) {
              markerTargetType = 'bach';
            } else if (rawW.includes('[') || rawW.includes(']')) {
              markerTargetType = 'gra';
            } else if (rawW.includes('(') || rawW.includes(')')) {
              markerTargetType = 'masoret';
            } else {
              markerTargetType = 'ein-mishpat';
            }
          }

          hotspots.push({
            id: `dyn-hs-${dafData.tractateId}-${dafData.dafId}-${hotspotSeq++}`,
            word: item.word,
            cleanWord: cleanW,
            section,
            leftPct,
            topPct,
            widthPct,
            heightPct,
            sentence: sent,
            rowId,
            lineTextHe,
            isSmallMarker,
            markerTargetType,
            markerKey: isSmallMarker ? cleanW : undefined,
            marginCommType,
            marginEntryKey: marginCommType && wIdx === 0 ? cleanW : undefined,
          });

          cursorRightX -= item.wPx + spacePx;
        }

        curY += lineHeightPx;
      };

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const isBold = i < dibburWordCount;
        ctx.font = `${isBold ? '900' : '600'} ${fontPx}px ${fontFamily}`;
        const measured = Math.max(fontPx * 0.45, ctx.measureText(w).width);

        if (lineWords.length > 0 && lineWidthPx + spacePx + measured > maxColWidth) {
          flushLine(lineWords);
          lineWords = [{ word: w, isBold, wPx: measured }];
          lineWidthPx = measured;
          if (curY + lineHeightPx > maxY) break;
        } else {
          lineWords.push({ word: w, isBold, wPx: measured });
          lineWidthPx += (lineWords.length > 1 ? spacePx : 0) + measured;
        }
      }

      if (lineWords.length > 0 && curY + lineHeightPx <= maxY) {
        flushLine(lineWords);
      }

      curY += lineHeightPx * 0.22;
    }

    return Number(((curY / H) * 100).toFixed(2));
  };

  // Column coordinates matching classic Vilna proportions
  const rashiLeftPct = isAmudBet ? 14.5 : 62.0;
  const rashiRightPct = isAmudBet ? 32.2 : 79.8;
  const tosafotLeftPct = isAmudBet ? 62.0 : 14.5;
  const tosafotRightPct = isAmudBet ? 79.8 : 32.2;

  // Vertical column dividers
  ctx.strokeStyle = 'rgba(60, 38, 20, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.33, 90);
  ctx.lineTo(W * 0.33, H * 0.72);
  ctx.moveTo(W * 0.612, 90);
  ctx.lineTo(W * 0.612, H * 0.72);
  ctx.stroke();

  // 3. Draw Center Mishnah + Gemara Pillar (33.8% .. 60.4%)
  const afterMishnahPct = drawColumnBlock(
    effectiveMishnah,
    'mishnah',
    33.8,
    60.4,
    5.0,
    27.0,
    24,
    33,
    'משנה'
  );

  // Horizontal divider between Mishnah and Gemara
  const gemaraStartPct = Math.min(28.5, Math.max(14.0, afterMishnahPct + 1.0));
  ctx.beginPath();
  ctx.moveTo(W * 0.34, (gemaraStartPct / 100) * H - 8);
  ctx.lineTo(W * 0.60, (gemaraStartPct / 100) * H - 8);
  ctx.stroke();

  drawColumnBlock(
    effectiveGemara,
    'gemara',
    33.8,
    60.4,
    gemaraStartPct,
    71.5,
    24,
    33,
    'גמרא'
  );

  // 4. Draw Rashi Column
  drawColumnBlock(
    effectiveRashi,
    'rashi',
    rashiLeftPct,
    rashiRightPct,
    5.0,
    71.5,
    18.5,
    25.5,
    'פירוש רש״י',
    true
  );

  // 5. Draw Tosafot Side Column + Wide Bottom Band (73% .. 95%)
  drawColumnBlock(
    effectiveTosafot.slice(0, 3),
    'tosafot',
    tosafotLeftPct,
    tosafotRightPct,
    5.0,
    71.5,
    18.5,
    25.5,
    'תוספות',
    true
  );

  // Horizontal divider above wide bottom commentary band
  ctx.beginPath();
  ctx.moveTo(W * 0.145, H * 0.725);
  ctx.lineTo(W * 0.798, H * 0.725);
  ctx.stroke();

  const bottomSentences =
    effectiveTosafot.length > 3
      ? effectiveTosafot.slice(3)
      : [...effectiveTosafot.slice(0, 2), ...effectiveRashi.slice(0, 2)];

  drawColumnBlock(
    bottomSentences,
    'tosafot',
    14.5,
    79.8,
    73.5,
    95.5,
    18,
    25,
    'המשך תוספות ופירוש רש״י על הדף',
    true
  );

  // 6. Outer Margin Commentaries (Masoret HaShas, Ein Mishpat, Hagahot HaBach)
  // On Amud A: Outer Margin is on RIGHT (81.0 .. 96.5%), Inner Gutter is on LEFT (2.2 .. 13.4%)
  // On Amud B: Outer Margin is on LEFT (2.2 .. 13.4%), Inner Gutter is on RIGHT (81.0 .. 96.5%)
  const masoretLeftPct = isAmudBet ? 81.0 : 2.2;
  const masoretRightPct = isAmudBet ? 96.5 : 13.4;
  const einLeftPct = isAmudBet ? 2.2 : 81.0;
  const einRightPct = isAmudBet ? 13.4 : 96.5;

  const masoretSentences: TalmudSentence[] = (dafData.masoretHaShas || []).slice(0, 4).map((m, i) => ({
    id: `dyn-masoret-${i}`,
    source: 'meforshim',
    hebrewText: `${m.marker || 'א'}) ${m.refHe}`,
    translationHe: m.refHe,
    translationKa: m.refKa,
    explanationKa: `მასორეთ ჰაშასი: ${m.refKa}`,
    explanationHe: m.refHe,
  }));

  if (masoretSentences.length > 0) {
    drawColumnBlock(
      masoretSentences,
      'margin',
      masoretLeftPct,
      masoretRightPct,
      6.0,
      42.0,
      14.5,
      20,
      'מסורת הש״ס',
      true,
      'masoret'
    );
  }

  const einMishpatSentences: TalmudSentence[] = (dafData.einMishpat || []).slice(0, 4).map((em, i) => ({
    id: `dyn-ein-${i}`,
    source: 'meforshim',
    hebrewText: `${em.marker || 'א'} ${em.halachaHe}`,
    translationHe: em.halachaHe,
    translationKa: em.halachaKa,
    explanationKa: `ეინ მიშპატი: ${em.halachaKa}`,
    explanationHe: em.halachaHe,
  }));

  if (einMishpatSentences.length > 0) {
    drawColumnBlock(
      einMishpatSentences,
      'margin',
      einLeftPct,
      einRightPct,
      6.0,
      46.0,
      14.5,
      20,
      'עין משפט',
      true,
      'ein-mishpat'
    );
  }

  // Tint ONLY the specific letters/glyphs of citations and small markers in Royal Blue (#1D4ED8),
  // leaving all parchment background and surrounding text 100% untouched!
  try {
    const citSet = new Set<string>();
    for (const h of hotspots) {
      if (
        h.isSmallMarker ||
        /^[(\[]?(?:ב|מ|ל|ו)?דף[\s\-_־\.]*[א-ת0-9]/.test(h.word) ||
        (h.section === 'margin' && (h.marginEntryKey || /^[(\[]?דף/.test(h.word)))
      ) {
        citSet.add(h.id);
      }
    }
    tintCitationHotspotsBlueOnCanvas(ctx, W, H, hotspots, citSet);
  } catch {
    // ignore
  }

  return hotspots;
}
