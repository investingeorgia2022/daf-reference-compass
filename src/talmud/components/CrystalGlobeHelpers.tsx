// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Plus, Minus, RotateCcw, X, Crown, Globe, Search } from 'lucide-react';
import { SacredRealmId } from '../data/tanakhAndHalakhaData';

export const MAX_ACTIVE_GLOBE_ORBS = 12;

export interface CrystalShortcutOrbItem {
  id: string;
  realmId: SacredRealmId;
  bookEn?: string;
  chapter?: number;
  tractateId?: string;
  dafId?: string;
  badgeHe: string;
  mainKa: string;
  subKa: string;
  accentColor: string;
  categoryKa: string;
}

export const ALL_CRYSTAL_SHORTCUT_ORBS: CrystalShortcutOrbItem[] = [
  {
    id: 'torah',
    realmId: 'torah',
    bookEn: 'Genesis',
    chapter: 1,
    badgeHe: 'תורה',
    mainKa: 'თორა',
    subKa: 'ხუმაში • 5 წიგნი',
    accentColor: '#F59E0B',
    categoryKa: 'წმინდა წერილი',
  },
  {
    id: 'neviim',
    realmId: 'neviim',
    bookEn: 'Joshua',
    chapter: 1,
    badgeHe: 'נביאים',
    mainKa: 'ნევიიმ',
    subKa: 'წინასწარმეტყველნი',
    accentColor: '#38BDF8',
    categoryKa: 'წმინდა წერილი',
  },
  {
    id: 'ketuvim',
    realmId: 'ketuvim',
    bookEn: 'Psalms',
    chapter: 1,
    badgeHe: 'כתובים',
    mainKa: 'ქეთუვიმ',
    subKa: 'თეჰილიმ • წერილნი',
    accentColor: '#A855F7',
    categoryKa: 'წმინდა წერილი',
  },
  {
    id: 'talmud',
    realmId: 'talmud',
    tractateId: 'Berakhot',
    dafId: '2a',
    badgeHe: 'תלמוד',
    mainKa: 'თალმუდი',
    subKa: 'ბავლი • ვილნის დაფი',
    accentColor: '#EAB308',
    categoryKa: 'ზეპირი თორა',
  },
  {
    id: 'rambam',
    realmId: 'rambam',
    bookEn: 'Mishneh_Torah,_Foundations_of_the_Torah',
    chapter: 1,
    badgeHe: 'רמב״ם',
    mainKa: 'რამბამი',
    subKa: 'მიშნე თორა',
    accentColor: '#10B981',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'tur',
    realmId: 'tur',
    bookEn: 'Tur,_Orach_Chaim',
    chapter: 1,
    badgeHe: 'ארבעה טורים',
    mainKa: 'ტური',
    subKa: 'ბეთ იოსეფი',
    accentColor: '#EC4899',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'shulchan-aruch',
    realmId: 'shulchan-aruch',
    bookEn: 'Shulchan_Arukh,_Orach_Chayim',
    chapter: 1,
    badgeHe: 'שולחן ערוך',
    mainKa: 'შულხან ყარუხი',
    subKa: 'კლასიკური დაფი',
    accentColor: '#6366F1',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'mishnah-berurah',
    realmId: 'mishnah-berurah',
    bookEn: 'Mishnah_Berurah_1',
    chapter: 1,
    badgeHe: 'משנה ברורה',
    mainKa: 'მიშნა ბრურა',
    subKa: 'ხაფეც ხაიმი',
    accentColor: '#14B8A6',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'yalkut-yosef',
    realmId: 'yalkut-yosef',
    bookEn: 'Yalkut_Yosef_Kitzur_OC_1',
    chapter: 1,
    badgeHe: 'ילקוט יוסף',
    mainKa: 'იალკუტ იოსეფი',
    subKa: 'קיצור שולחן ערוך',
    accentColor: '#EA580C',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'daily-halakhot',
    realmId: 'daily-halakhot',
    badgeHe: 'ב׳ הלכות ביום',
    mainKa: '2 ჰალახა',
    subKa: 'ყოველდღიური ჰალახა',
    accentColor: '#10B981',
    categoryKa: 'პრაქტიკული',
  },
  {
    id: 'sephardic-halakha',
    realmId: 'sephardic-halakha',
    bookEn: 'Yalkut_Yosef_OC',
    chapter: 1,
    badgeHe: 'הלכה ספרדית',
    mainKa: 'სეფარადული',
    subKa: 'პოსკიმ ספרד',
    accentColor: '#F97316',
    categoryKa: 'ჰალახა',
  },
  {
    id: 'siddur',
    realmId: 'siddur',
    badgeHe: 'סידור כוונת הלב',
    mainKa: 'სიდური',
    subKa: 'כוונת הלב & კლასიკური',
    accentColor: '#F59E0B',
    categoryKa: 'პრაქტიკული',
  },
  {
    id: 'blessings',
    realmId: 'blessings',
    badgeHe: 'ברכות',
    mainKa: 'კურთხევები',
    subKa: 'ყოველდღიური ბრახოთ',
    accentColor: '#FB7185',
    categoryKa: 'პრაქტიკული',
  },
  {
    id: 'calendar',
    realmId: 'calendar',
    badgeHe: 'לוח שנה',
    mainKa: 'კალენდარი',
    subKa: 'ჰილულა & ზმანიმ',
    accentColor: '#22D3EE',
    categoryKa: 'პრაქტიკული',
  },
  {
    id: 'talmud-shabbat',
    realmId: 'talmud',
    tractateId: 'shabbat',
    dafId: '2a',
    badgeHe: 'שבת',
    mainKa: 'მასეხეთ შაბათი',
    subKa: 'ბავლი • დაფ ბ',
    accentColor: '#FBBF24',
    categoryKa: 'ზეპირი თორა',
  },
  {
    id: 'zohar-baba-kamma',
    realmId: 'talmud',
    tractateId: 'bava_kamma',
    dafId: '2a',
    badgeHe: 'בבא קמא',
    mainKa: 'ბავა კამა',
    subKa: 'ნეზიკინ • დაფი',
    accentColor: '#818CF8',
    categoryKa: 'ზეპირი თორა',
  },
  {
    id: 'tehillim-portal',
    realmId: 'ketuvim',
    bookEn: 'Psalms',
    chapter: 119,
    badgeHe: 'תהילים',
    mainKa: 'თეჰილიმი',
    subKa: 'დავითის ფსალმუნნი',
    accentColor: '#C084FC',
    categoryKa: 'წმინდა წერილი',
  },
  {
    id: 'pirkei-avot',
    realmId: 'talmud',
    tractateId: 'avot',
    dafId: '2a',
    badgeHe: 'פרקי אבות',
    mainKa: 'ფირკეი ავოთ',
    subKa: 'მამათა სწავლანი',
    accentColor: '#34D399',
    categoryKa: 'მუსარი & სიბრძნე',
  },
  {
    id: 'parashat-hashavua',
    realmId: 'torah',
    bookEn: 'Exodus',
    chapter: 18,
    badgeHe: 'פרשת השבוע',
    mainKa: 'კვირის ფარაშა',
    subKa: 'შემოთ • ითრო',
    accentColor: '#F43F5E',
    categoryKa: 'წმინდა წერილი',
  },
];

export const DEFAULT_ACTIVE_ORB_IDS: string[] = ALL_CRYSTAL_SHORTCUT_ORBS.slice(0, 11).map(
  (o) => o.id
);

/**
 * Draws the Large 3D Crystal Golden Royal King's Crown ("დიდი მეფის ლამაზი გვირგვინი და მაღალი კარკასი")
 * sitting atop the central 3D Globe — or smoothly transitioning into the exact center of the Globe
 * when the spheres arrange symmetrically around the Globe (`insideGlobeProgress` 0 -> 1).
 * Features a tall, ornate royal rim/carcass ("მაღალი კარკასი") with embossed Hebrew inscription
 * "שויתי ה' לנגדי תמיד" and is crowned at the apex with a large radiant 3D Magen David (מגן דוד) instead of a cross!
 */
export function drawCrystalGoldenCrown(
  ctx: CanvasRenderingContext2D,
  cx: number,
  globeTopY: number,
  globeRadius: number,
  rotYaw: number,
  rotPitch: number,
  insideGlobeProgress: number = 0
) {
  ctx.save();

  const nowTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const clampedInside = Math.max(0, Math.min(1, insideGlobeProgress));
  // Harmoniously proportioned Royal King's Crown scale
  const sizeScale = 0.92 - clampedInside * 0.14;

  // Royal King's Crown proportions + Tall Crystalline Rim Carcass ("კრისტალური მაღალი კარკასი")
  const crownBaseR = globeRadius * 0.56 * sizeScale;
  const crownTopR = globeRadius * 0.69 * sizeScale;
  const crownHeight = globeRadius * 0.54 * sizeScale;
  const bandHeight = crownHeight * 0.54;

  const globeCenterY = globeTopY + globeRadius;
  const topPositionBaseY = globeTopY + globeRadius * 0.04;
  const insideCenterBaseY = globeCenterY + crownHeight * 0.42;
  const baseCenterY =
    topPositionBaseY * (1 - clampedInside) + insideCenterBaseY * clampedInside;

  const tiltRatio = Math.max(0.16, Math.min(0.38, 0.22 + Math.sin(rotPitch) * 0.12));

  // Helper to draw a 4-point sparkling diamond starburst glint
  const drawDiamondStarburst = (
    sx: number,
    sy: number,
    radius: number,
    alpha: number,
    tintColor: string = '#E0F2FE'
  ) => {
    if (alpha <= 0.05) return;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.globalAlpha = Math.min(1, alpha);
    const glow = ctx.createRadialGradient(0, 0, 0.3, 0, 0, radius);
    glow.addColorStop(0, '#FFFFFF');
    glow.addColorStop(0.35, tintColor);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 4-point crisp diamond rays
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-radius * 1.15, 0);
    ctx.lineTo(radius * 1.15, 0);
    ctx.moveTo(0, -radius * 1.15);
    ctx.lineTo(0, radius * 1.15);
    ctx.stroke();
    ctx.restore();
  };

  // 0. Subtle Transparent Crystal Caustic Aura behind the Crown (see-through like the orbs)
  const crownGlow = ctx.createRadialGradient(
    cx,
    baseCenterY - crownHeight * 0.58,
    crownBaseR * 0.08,
    cx,
    baseCenterY - crownHeight * 0.58,
    crownTopR * 1.55
  );
  crownGlow.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  crownGlow.addColorStop(0.32, 'rgba(56, 189, 248, 0.14)');
  crownGlow.addColorStop(0.65, 'rgba(245, 158, 11, 0.10)');
  crownGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = crownGlow;
  ctx.beginPath();
  ctx.arc(cx, baseCenterY - crownHeight * 0.58, crownTopR * 1.55, 0, Math.PI * 2);
  ctx.fill();

  const numSpires = 12;

  // 1. Draw Back-facing Transparent Crystal Glass Spires & Arches (z < 0)
  for (let i = 0; i < numSpires; i++) {
    const a = (i / numSpires) * Math.PI * 2 + rotYaw;
    const z = Math.cos(a);
    if (z >= 0) continue; // Only back spires first

    const xBase = cx + Math.sin(a) * crownBaseR;
    const yBase = baseCenterY - bandHeight + z * crownBaseR * tiltRatio;

    const xTip = cx + Math.sin(a) * crownTopR;
    const yTip = baseCenterY - crownHeight + z * crownTopR * tiltRatio;

    const aPrev = ((i - 0.45) / numSpires) * Math.PI * 2 + rotYaw;
    const aNext = ((i + 0.45) / numSpires) * Math.PI * 2 + rotYaw;
    const xL = cx + Math.sin(aPrev) * crownBaseR;
    const yL = baseCenterY - bandHeight + Math.cos(aPrev) * crownBaseR * tiltRatio;
    const xR = cx + Math.sin(aNext) * crownBaseR;
    const yR = baseCenterY - bandHeight + Math.cos(aNext) * crownBaseR * tiltRatio;

    ctx.beginPath();
    ctx.moveTo(xL, yL);
    ctx.lineTo(xTip, yTip);
    ctx.lineTo(xR, yR);
    ctx.closePath();

    const spireGrad = ctx.createLinearGradient(xBase, yTip, xBase, yBase);
    spireGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    spireGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.10)');
    spireGrad.addColorStop(1, 'rgba(245, 158, 11, 0.12)');
    ctx.fillStyle = spireGrad;
    ctx.fill();
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.stroke();

    // Translucent crystal pearl on back spire tip
    ctx.beginPath();
    ctx.arc(xTip, yTip, 3.0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.fill();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.stroke();
  }

  // 2. Back half of the Tall Transparent Crystal Rim Carcass
  ctx.beginPath();
  ctx.ellipse(
    cx,
    baseCenterY - bandHeight,
    crownBaseR,
    crownBaseR * tiltRatio,
    0,
    Math.PI,
    Math.PI * 2
  );
  ctx.ellipse(
    cx,
    baseCenterY,
    crownBaseR * 0.96,
    crownBaseR * 0.96 * tiltRatio,
    0,
    0,
    Math.PI,
    true
  );
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
  ctx.fill();
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.36)';
  ctx.stroke();

  // 3. Ultra-Transparent Crystal Sphere-Like Inner Dome & Arches converging to the Finial
  const finialX = cx;
  const finialY = baseCenterY - crownHeight * 1.25;

  // Inner crystal glass dome matching the orbiting spheres' radial gradient
  const domeGrad = ctx.createRadialGradient(
    cx - crownBaseR * 0.28,
    baseCenterY - crownHeight * 0.82,
    crownBaseR * 0.04,
    cx,
    baseCenterY - bandHeight * 0.9,
    crownTopR * 0.94
  );
  domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  domeGrad.addColorStop(0.32, 'rgba(56, 189, 248, 0.14)');
  domeGrad.addColorStop(0.68, 'rgba(6, 10, 22, 0.24)');
  domeGrad.addColorStop(1, 'rgba(245, 158, 11, 0.20)');
  ctx.beginPath();
  ctx.ellipse(
    cx,
    baseCenterY - bandHeight * 0.95,
    crownBaseR * 0.92,
    crownHeight * 0.59,
    0,
    Math.PI,
    Math.PI * 2
  );
  ctx.fillStyle = domeGrad;
  ctx.fill();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  for (let i = 0; i < numSpires; i++) {
    const a = (i / numSpires) * Math.PI * 2 + rotYaw;
    const xTip = cx + Math.sin(a) * crownTopR;
    const yTip = baseCenterY - crownHeight + Math.cos(a) * crownTopR * tiltRatio;
    const ctrlX = (xTip + finialX) * 0.5 + Math.sin(a) * crownBaseR * 0.14;
    const ctrlY = finialY - crownHeight * 0.14;

    ctx.beginPath();
    ctx.moveTo(xTip, yTip);
    ctx.quadraticCurveTo(ctrlX, ctrlY, finialX, finialY);
    ctx.lineWidth = Math.cos(a) > 0 ? 1.8 : 0.95;
    ctx.strokeStyle =
      Math.cos(a) > 0 ? 'rgba(255, 255, 255, 0.68)' : 'rgba(186, 230, 253, 0.28)';
    ctx.stroke();

    // Translucent crystal beads along front-facing royal arches
    if (Math.cos(a) > 0) {
      for (let p = 1; p <= 4; p++) {
        const t = p / 5;
        const px = (1 - t) * (1 - t) * xTip + 2 * (1 - t) * t * ctrlX + t * t * finialX;
        const py = (1 - t) * (1 - t) * yTip + 2 * (1 - t) * t * ctrlY + t * t * finialY;
        ctx.beginPath();
        ctx.arc(px, py, 2.0, 0, Math.PI * 2);
        ctx.fillStyle =
          p % 2 === 0 ? 'rgba(224, 242, 254, 0.55)' : 'rgba(254, 240, 138, 0.52)';
        ctx.fill();
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.stroke();
      }
    }
  }

  // 4. Front-facing See-Through Crystal Glass Spires (z >= 0) — exact same glass transparency as the spheres
  for (let i = 0; i < numSpires; i++) {
    const a = (i / numSpires) * Math.PI * 2 + rotYaw;
    const z = Math.cos(a);
    if (z < 0) continue;

    const xBase = cx + Math.sin(a) * crownBaseR;
    const yBase = baseCenterY - bandHeight + z * crownBaseR * tiltRatio;

    const xTip = cx + Math.sin(a) * crownTopR;
    const yTip = baseCenterY - crownHeight + z * crownTopR * tiltRatio;

    const aPrev = ((i - 0.47) / numSpires) * Math.PI * 2 + rotYaw;
    const aNext = ((i + 0.47) / numSpires) * Math.PI * 2 + rotYaw;
    const xL = cx + Math.sin(aPrev) * crownBaseR;
    const yL = baseCenterY - bandHeight + Math.cos(aPrev) * crownBaseR * tiltRatio;
    const xR = cx + Math.sin(aNext) * crownBaseR;
    const yR = baseCenterY - bandHeight + Math.cos(aNext) * crownBaseR * tiltRatio;

    const midY = (yTip + yBase) * 0.52;

    // Left transparent crystal glass facet of spire
    ctx.beginPath();
    ctx.moveTo(xL, yL);
    ctx.lineTo(xTip, yTip);
    ctx.lineTo(xBase, yBase);
    ctx.closePath();
    const leftGrad = ctx.createLinearGradient(xL, yTip, xBase, yBase);
    leftGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    leftGrad.addColorStop(0.32, 'rgba(56, 189, 248, 0.18)');
    leftGrad.addColorStop(0.68, 'rgba(6, 10, 22, 0.26)');
    leftGrad.addColorStop(1, 'rgba(245, 158, 11, 0.25)');
    ctx.fillStyle = leftGrad;
    ctx.fill();

    // Right transparent crystal glass facet of spire
    ctx.beginPath();
    ctx.moveTo(xBase, yBase);
    ctx.lineTo(xTip, yTip);
    ctx.lineTo(xR, yR);
    ctx.closePath();
    const rightGrad = ctx.createLinearGradient(xBase, yTip, xR, yBase);
    rightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.30)');
    rightGrad.addColorStop(0.38, 'rgba(125, 211, 252, 0.15)');
    rightGrad.addColorStop(0.72, 'rgba(6, 10, 22, 0.30)');
    rightGrad.addColorStop(1, 'rgba(245, 158, 11, 0.22)');
    ctx.fillStyle = rightGrad;
    ctx.fill();

    // Delicate crystal glass facet edges inside each spire
    ctx.beginPath();
    ctx.moveTo(xL, yL);
    ctx.lineTo(xTip, yTip);
    ctx.lineTo(xR, yR);
    ctx.moveTo(xBase, yBase);
    ctx.lineTo(xTip, yTip);
    ctx.moveTo((xL + xTip) * 0.5, midY);
    ctx.lineTo(xBase, yBase - bandHeight * 0.18);
    ctx.lineTo((xR + xTip) * 0.5, midY);
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.stroke();

    // Translucent Crystal Sphere Jewel on Spire Tip (matching the mini orbs)
    const tipGlow = ctx.createRadialGradient(xTip - 1.2, yTip - 1.2, 0.4, xTip, yTip, 5.5);
    tipGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    tipGlow.addColorStop(0.35, 'rgba(56, 189, 248, 0.35)');
    tipGlow.addColorStop(0.72, 'rgba(15, 23, 42, 0.38)');
    tipGlow.addColorStop(1, 'rgba(245, 158, 11, 0.45)');
    ctx.beginPath();
    ctx.arc(xTip, yTip, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = tipGlow;
    ctx.fill();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.stroke();

    // Subtle diamond sparkle on the front-most spires
    const sparklePulse = Math.sin(nowTime * 0.005 + i * 1.7);
    if (z > 0.65 && sparklePulse > 0.25) {
      drawDiamondStarburst(xTip, yTip, 6.2 * sparklePulse, sparklePulse * 0.75, '#BAE6FD');
    }
  }

  // 5. Front Tall See-Through Crystal Rim Carcass ("კრისტალური გამჭვირვალე კარკასი ისე როგორც ბურთულები")
  ctx.beginPath();
  for (let s = 0; s <= 48; s++) {
    const ang = -Math.PI / 2 + (s / 48) * Math.PI;
    const x = cx + Math.sin(ang) * crownBaseR;
    const y = baseCenterY - bandHeight + Math.cos(ang) * crownBaseR * tiltRatio;
    if (s === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let s = 48; s >= 0; s--) {
    const ang = -Math.PI / 2 + (s / 48) * Math.PI;
    const x = cx + Math.sin(ang) * (crownBaseR * 0.96);
    const y = baseCenterY + Math.cos(ang) * (crownBaseR * 0.96) * tiltRatio;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const bandGrad = ctx.createLinearGradient(
    cx - crownBaseR,
    baseCenterY - bandHeight * 0.5,
    cx + crownBaseR,
    baseCenterY - bandHeight * 0.5
  );
  bandGrad.addColorStop(0, 'rgba(56, 189, 248, 0.26)');
  bandGrad.addColorStop(0.18, 'rgba(245, 158, 11, 0.22)');
  bandGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.34)');
  bandGrad.addColorStop(0.5, 'rgba(6, 10, 22, 0.32)');
  bandGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.34)');
  bandGrad.addColorStop(0.82, 'rgba(245, 158, 11, 0.22)');
  bandGrad.addColorStop(1, 'rgba(56, 189, 248, 0.26)');
  ctx.fillStyle = bandGrad;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.stroke();

  // Crystalline geometric diamond lattice lines across the transparent front carcass band
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
  ctx.lineWidth = 0.85;
  for (let d = 0; d < 16; d++) {
    const a1 = -Math.PI * 0.46 + (d / 16) * Math.PI * 0.92;
    const a2 = -Math.PI * 0.46 + ((d + 1) / 16) * Math.PI * 0.92;
    const x1 = cx + Math.sin(a1) * (crownBaseR * 0.98);
    const y1Top = baseCenterY - bandHeight * 0.86 + Math.cos(a1) * (crownBaseR * 0.98) * tiltRatio;
    const y1Bot = baseCenterY - bandHeight * 0.14 + Math.cos(a1) * (crownBaseR * 0.98) * tiltRatio;
    const x2 = cx + Math.sin(a2) * (crownBaseR * 0.98);
    const y2Top = baseCenterY - bandHeight * 0.86 + Math.cos(a2) * (crownBaseR * 0.98) * tiltRatio;
    const y2Bot = baseCenterY - bandHeight * 0.14 + Math.cos(a2) * (crownBaseR * 0.98) * tiltRatio;
    ctx.beginPath();
    ctx.moveTo(x1, y1Top);
    ctx.lineTo(x2, y2Bot);
    ctx.moveTo(x1, y1Bot);
    ctx.lineTo(x2, y2Top);
    ctx.stroke();
  }
  ctx.restore();

  // Upper & lower crystal glass specular rails framing the tall inscription band
  for (const railRatio of [0.14, 0.86]) {
    ctx.beginPath();
    for (let s = 0; s <= 48; s++) {
      const ang = -Math.PI / 2 + (s / 48) * Math.PI;
      const x = cx + Math.sin(ang) * (crownBaseR * 0.985);
      const y =
        baseCenterY -
        bandHeight * railRatio +
        Math.cos(ang) * (crownBaseR * 0.985) * tiltRatio;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  // Translucent crystal orb gemstones along the bottom rim
  const gemColors = [
    'rgba(56, 189, 248, 0.52)',
    'rgba(244, 63, 94, 0.48)',
    'rgba(16, 185, 129, 0.48)',
    'rgba(168, 85, 247, 0.48)',
    'rgba(245, 158, 11, 0.52)',
    'rgba(6, 182, 212, 0.52)',
  ];
  for (let g = 0; g < 12; g++) {
    const gAng = (g / 12) * Math.PI * 2 + rotYaw;
    const gz = Math.cos(gAng);
    if (gz < 0.15) continue;
    const gx = cx + Math.sin(gAng) * (crownBaseR * 0.98);
    const gy = baseCenterY - bandHeight * 0.08 + gz * (crownBaseR * 0.98) * tiltRatio;
    const gemR = Math.max(2.4, globeRadius * 0.02 * gz);
    ctx.beginPath();
    ctx.arc(gx, gy, gemR, 0, Math.PI * 2);
    ctx.fillStyle = gemColors[g % gemColors.length];
    ctx.fill();
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.stroke();
  }

  // 6. FROSTED CRYSTAL-GLASS ENGRAVED 3D HEBREW INSCRIPTION ON THE TRANSPARENT CARCASS:
  // "שויתי ה' לנגדי תמיד"
  const inscriptionText = 'שויתי ה׳ לנגדי תמיד ★ ';
  const chars = Array.from(inscriptionText);
  const totalChars = chars.length;
  const fontSize = Math.max(14, Math.min(28, Math.round(bandHeight * 0.62)));
  ctx.font = `900 ${fontSize}px "Frank Ruhl Libre", "David Libre", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < totalChars; i++) {
    const charAngle = rotYaw - (i / totalChars) * Math.PI * 2;
    const z = Math.cos(charAngle);
    if (z < 0.06) continue;

    const x = cx + Math.sin(charAngle) * (crownBaseR * 0.995);
    const y =
      baseCenterY -
      bandHeight * 0.5 +
      z * (crownBaseR * 0.995) * tiltRatio;

    ctx.save();
    ctx.translate(x, y);
    const horizScale = Math.max(0.52, z);
    const tangentSlope =
      (-Math.sin(charAngle) * tiltRatio) / Math.max(0.3, Math.cos(charAngle));
    ctx.rotate(Math.max(-0.28, Math.min(0.28, tangentSlope * 0.32)));
    ctx.scale(horizScale, 1);

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(6, 10, 22, 0.68)';
    ctx.strokeText(chars[i], 0, 0.8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(chars[i], 0, 0);

    ctx.restore();
  }

  // 7. Transparent Crystal Finial Sphere at the apex (identical to the mini crystal spheres)
  const finialR = Math.max(8, globeRadius * 0.075 * sizeScale);
  const finialGrad = ctx.createRadialGradient(
    finialX - finialR * 0.32,
    finialY - finialR * 0.32,
    0.5,
    finialX,
    finialY,
    finialR * 1.25
  );
  finialGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
  finialGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.28)');
  finialGrad.addColorStop(0.68, 'rgba(6, 10, 22, 0.36)');
  finialGrad.addColorStop(1, 'rgba(245, 158, 11, 0.45)');
  ctx.beginPath();
  ctx.arc(finialX, finialY, finialR, 0, Math.PI * 2);
  ctx.fillStyle = finialGrad;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.stroke();

  // 8. CONTINUOUSLY SPINNING 3D TRANSPARENT CRYSTAL MAGEN DAVID (מגן דוד — Star of David) ATOP THE CROWN FINIAL!
  const starR = Math.max(18.5, globeRadius * 0.19 * sizeScale);
  const starCenterY = finialY - finialR - starR * 0.98;

  const magenSpinAngle = nowTime * 0.0028 + rotYaw * 2.5;
  const spinCos = Math.cos(magenSpinAngle);
  const spinSin = Math.sin(magenSpinAngle);
  const horizSpinScale =
    (spinCos >= 0 ? 1 : -1) * Math.max(0.24, Math.abs(spinCos));
  const extrusionOffsetX = spinSin * Math.max(3.2, starR * 0.22);

  // Subtle Transparent Crystal Halo behind the spinning Magen David
  const magenGlow = ctx.createRadialGradient(
    finialX,
    starCenterY,
    1,
    finialX,
    starCenterY,
    starR * 2.1
  );
  magenGlow.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  magenGlow.addColorStop(0.38, 'rgba(56, 189, 248, 0.18)');
  magenGlow.addColorStop(0.72, 'rgba(245, 158, 11, 0.12)');
  magenGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.beginPath();
  ctx.arc(finialX, starCenterY, starR * 2.1, 0, Math.PI * 2);
  ctx.fillStyle = magenGlow;
  ctx.fill();

  // Orbiting Crystal Light Ring around the spinning Magen David
  ctx.save();
  ctx.translate(finialX, starCenterY);
  ctx.rotate(Math.sin(nowTime * 0.0018) * 0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, starR * 1.28, starR * 0.36, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  const getTriangleVertices = (
    pointingUp: boolean,
    offsetX: number,
    offsetY: number,
    scaleR: number = starR
  ) => {
    const baseAngle = pointingUp ? -Math.PI / 2 : Math.PI / 2;
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k < 3; k++) {
      const ang = baseAngle + (k * Math.PI * 2) / 3;
      const vx = finialX + offsetX + Math.cos(ang) * scaleR * horizSpinScale;
      const vy = starCenterY + offsetY + Math.sin(ang) * scaleR;
      pts.push({ x: vx, y: vy });
    }
    return pts;
  };

  const traceTrianglePath = (pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 8a. Back Extruded 3D Transparent Crystal Layer & Connecting 3D Bevel Edges
  for (const up of [true, false]) {
    const backPts = getTriangleVertices(up, -extrusionOffsetX, 1.2);
    const frontPts = getTriangleVertices(up, 0, 0);

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(backPts[k].x, backPts[k].y);
      ctx.lineTo(frontPts[k].x, frontPts[k].y);
      ctx.stroke();
    }

    traceTrianglePath(backPts);
    ctx.lineWidth = Math.max(2.6, starR * 0.2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.stroke();
  }

  // 8b. Front Interlocking See-Through Crystal Triangles of the Magen David
  const starCrystalGrad = ctx.createLinearGradient(
    finialX - starR,
    starCenterY - starR,
    finialX + starR,
    starCenterY + starR
  );
  starCrystalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  starCrystalGrad.addColorStop(0.28, 'rgba(186, 230, 253, 0.55)');
  starCrystalGrad.addColorStop(0.55, 'rgba(254, 240, 138, 0.52)');
  starCrystalGrad.addColorStop(0.78, 'rgba(56, 189, 248, 0.55)');
  starCrystalGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

  for (const up of [true, false]) {
    const frontPts = getTriangleVertices(up, 0, 0);
    traceTrianglePath(frontPts);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
    ctx.lineWidth = Math.max(2.6, starR * 0.19);
    ctx.strokeStyle = starCrystalGrad;
    ctx.stroke();

    traceTrianglePath(frontPts);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.stroke();

    frontPts.forEach((pt, vIdx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fill();
      if ((vIdx + (up ? 0 : 1)) % 2 === 0) {
        drawDiamondStarburst(
          pt.x,
          pt.y,
          4.8,
          0.35 + 0.35 * Math.abs(spinSin),
          '#E0F2FE'
        );
      }
    });
  }

  // 8c. Counter-Rotating Inner Transparent Crystal Hexagram Core
  const innerSpinScale = Math.cos(-nowTime * 0.0045);
  for (const up of [true, false]) {
    const baseAngle = up ? -Math.PI / 2 : Math.PI / 2;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const ang = baseAngle + (k * Math.PI * 2) / 3 + nowTime * 0.002;
      const vx = finialX + Math.cos(ang) * (starR * 0.44) * innerSpinScale;
      const vy = starCenterY + Math.sin(ang) * (starR * 0.44);
      if (k === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
    ctx.stroke();
  }

  // Center translucent crystal sphere jewel inside the Magen David hexagram
  ctx.beginPath();
  ctx.arc(finialX, starCenterY, Math.max(2.8, starR * 0.16), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.48)';
  ctx.fill();
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.stroke();

  drawDiamondStarburst(
    finialX,
    starCenterY,
    starR * 0.45,
    0.45 + 0.25 * Math.abs(spinCos),
    '#BAE6FD'
  );

  ctx.restore();
}

/**
 * Crystal Transparent Sphere containing Chacham Kacuna inside (matching the orbiting spheres),
 * where BOTH the sphere and Kacuna rotate around their own vertical axis!
 */
export const CrystalDiamondKacunaAvatar: React.FC<{
  size?: 'sm' | 'md';
  isSpeaking?: boolean;
}> = ({ size = 'md', isSpeaking = false }) => {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  return (
    <div
      className={`relative ${dim} rounded-full flex items-center justify-center shrink-0 select-none`}
      style={{
        perspective: '420px',
      }}
    >
      {/* Outer Ambient Translucent Sphere Halo */}
      <div
        className={`pointer-events-none absolute -inset-1 rounded-full blur-[4px] transition-opacity duration-300 ${
          isSpeaking ? 'opacity-95 animate-pulse' : 'opacity-65'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(245,158,11,0.35) 55%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Crystal Sphere + Chacham Kacuna inside */}
      <div
        style={{
          background:
            'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.42) 0%, rgba(56,189,248,0.18) 32%, rgba(15,23,42,0.46) 68%, rgba(245,158,11,0.28) 100%)',
          boxShadow:
            '0 8px 22px rgba(0,0,0,0.6), 0 0 16px rgba(56,189,248,0.35), inset 0 2px 6px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(245,158,11,0.35)',
        }}
        className="relative w-full h-full rounded-full border border-white/55 overflow-hidden flex items-center justify-center"
      >
        {/* Seated Chacham Kacuna Figure Inside the Crystal Diamond Sphere */}
        <svg
          viewBox="0 0 64 64"
          className="w-[82%] h-[82%] drop-shadow-[0_2px_4px_rgba(15,23,42,0.45)]"
        >
          {/* Glowing Golden Cushion / Throne inside the crystal */}
          <ellipse cx="32" cy="52" rx="18" ry="5.5" fill="#F59E0B" opacity="0.85" />
          <ellipse cx="32" cy="50.5" rx="15" ry="3.8" fill="#FEF08A" opacity="0.9" />

          {/* Seated Robe / Tallit with Blue Tekhelet Stripes */}
          <path
            d="M18 49 C18 37, 46 37, 46 49 Z"
            fill="#F8FAFC"
            stroke="#0284C7"
            strokeWidth="1.5"
          />
          <path d="M22 40 L21 48 M42 40 L43 48" stroke="#0284C7" strokeWidth="1.8" />
          <path d="M25 39 L32 45 L39 39" fill="none" stroke="#F59E0B" strokeWidth="1.4" />

          {/* Crossed Legs (Sitting posture inside the sphere) */}
          <path
            d="M20 49 Q32 54 44 49"
            fill="none"
            stroke="#1E293B"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Open Miniature Torah Scroll held in lap */}
          <rect
            x="23"
            y="41"
            width="18"
            height="7"
            rx="1.5"
            fill="#FFFBEB"
            stroke="#D97706"
            strokeWidth="1.2"
          />
          <line x1="32" y1="41" x2="32" y2="48" stroke="#D97706" strokeWidth="1" />
          <circle cx="23" cy="40.5" r="1.4" fill="#F59E0B" />
          <circle cx="41" cy="40.5" r="1.4" fill="#F59E0B" />

          {/* Warm Face & Wise Smile */}
          <circle cx="32" cy="24" r="9.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />

          {/* Royal Golden-Embroidered Kippah / Crown Hat */}
          <path
            d="M22 20 Q32 10 42 20 Z"
            fill="#1E3A8A"
            stroke="#FBBF24"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="14" r="1.6" fill="#FDE047" />

          {/* Kind Twinkling Eyes */}
          <circle cx="28.5" cy="23" r="1.3" fill="#0F172A" />
          <circle cx="35.5" cy="23" r="1.3" fill="#0F172A" />
          <circle cx="28.9" cy="22.5" r="0.45" fill="#FFFFFF" />
          <circle cx="35.9" cy="22.5" r="0.45" fill="#FFFFFF" />

          {/* Flowing White-Silver Wise Beard */}
          <path
            d="M23.5 26.5 Q32 41 40.5 26.5 Q36 30 32 30 Q28 30 23.5 26.5 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.9"
          />
          {/* Smile */}
          <path
            d="M29.5 27.5 Q32 29.5 34.5 27.5"
            fill="none"
            stroke="#92400E"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Prismatic Cut-Diamond Facet Lines Overlay */}
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75"
        >
          <polygon
            points="32,2 52,14 58,32 52,50 32,62 12,50 6,32 12,14"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.9"
          />
          <polygon
            points="32,10 48,22 48,42 32,54 16,42 16,22"
            fill="none"
            stroke="rgba(186,230,253,0.75)"
            strokeWidth="0.75"
          />
          <line x1="32" y1="2" x2="32" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
          <line x1="52" y1="14" x2="48" y2="22" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
          <line x1="12" y1="14" x2="16" y2="22" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
          <line x1="52" y1="50" x2="48" y2="42" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
          <line x1="12" y1="50" x2="16" y2="42" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
        </svg>

        {/* Top Crystal Specular Glint */}
        <span className="pointer-events-none absolute top-1 left-2 w-4 h-1.5 rounded-full bg-white/90 blur-[0.3px] -rotate-12" />
      </div>
    </div>
  );
};

const MINI_SPHERE_CONTINENTS: [number, number][][] = [
  [
    [35, 10], [28, -12], [8, -10], [-18, 14], [-32, 24], [-10, 40], [18, 42], [35, 10],
  ],
  [
    [45, 55], [62, 85], [55, 130], [25, 118], [12, 80], [28, 48], [45, 55],
  ],
  [
    [55, -115], [50, -70], [22, -82], [12, -88], [32, -118], [55, -115],
  ],
  [
    [5, -72], [-8, -38], [-38, -58], [-22, -72], [5, -72],
  ],
];

/**
 * Renders a true 3D spherical globe mesh (longitude meridians, latitude parallels,
 * rotating continental facets, and equatorial crystal nodes) spinning continuously
 * around its own vertical axis inside any crystal sphere!
 */
const MINI_SPHERE_FRAME_MS =
  typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0 ? 70 : 40;

export const AxialRotatingSphereCanvas: React.FC<{
  accentColor: string;
  idx?: number;
  lightMode?: boolean;
}> = ({ accentColor, idx = 0, lightMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    let currentYaw = idx * 0.85;
    const pitch = 0.22;
    const size = MINI_SPHERE_FRAME_MS > 40 ? 84 : 120;
    const rotSpeed = 0.011 + (idx % 3) * 0.002;

    let lastDraw = 0;
    const render = (now = 0) => {
      if (now - lastDraw < MINI_SPHERE_FRAME_MS || document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      currentYaw += rotSpeed * 2.4 * (MINI_SPHERE_FRAME_MS / 40);
      const canvas = canvasRef.current;
      if (canvas && !canvas.isConnected) return;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.47;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      const projectPt = (latDeg: number, lonDeg: number) => {
        const lat = (latDeg * Math.PI) / 180;
        const lon = (lonDeg * Math.PI) / 180 + currentYaw;
        const x0 = Math.cos(lat) * Math.sin(lon);
        const y0 = Math.sin(lat);
        const z0 = Math.cos(lat) * Math.cos(lon);
        const y1 = y0 * Math.cos(pitch) - z0 * Math.sin(pitch);
        const z1 = y0 * Math.sin(pitch) + z0 * Math.cos(pitch);
        return {
          x: cx + x0 * r,
          y: cy - y1 * r,
          z: z1,
        };
      };

      // 1. Back hemisphere meridians
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = lightMode
        ? 'rgba(100, 116, 139, 0.20)'
        : 'rgba(253, 230, 138, 0.20)';
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        ctx.beginPath();
        let started = false;
        for (let latDeg = -80; latDeg <= 80; latDeg += 16) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z <= 0) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // 2. Continental Crystal Patches on Front Hemisphere
      MINI_SPHERE_CONTINENTS.forEach((coords) => {
        ctx.beginPath();
        let visibleCount = 0;
        let started = false;
        for (let i = 0; i < coords.length; i++) {
          const [latDeg, lonDeg] = coords[i];
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
            visibleCount++;
          } else {
            started = false;
          }
        }
        if (visibleCount >= 2) {
          ctx.closePath();
          ctx.fillStyle = lightMode
            ? `${accentColor}28`
            : 'rgba(251, 191, 36, 0.18)';
          ctx.fill();
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = lightMode
            ? `${accentColor}88`
            : 'rgba(253, 230, 138, 0.55)';
          ctx.stroke();
        }
      });

      // 3. Front hemisphere meridians & parallels
      ctx.lineWidth = 1.05;
      ctx.strokeStyle = lightMode
        ? `${accentColor}66`
        : 'rgba(255, 251, 235, 0.46)';
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        ctx.beginPath();
        let started = false;
        for (let latDeg = -80; latDeg <= 80; latDeg += 12) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      for (const latDeg of [-45, 0, 45]) {
        ctx.beginPath();
        let started = false;
        for (let lonDeg = 0; lonDeg <= 360; lonDeg += 12) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [accentColor, idx, lightMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full rounded-full z-[2]"
    />
  );
};

/**
 * 3D Double-Sided Axial Spinning Content wrapper so the inner text/emblem of every sphere
 * also rotates 360° around its own vertical Y axis while remaining readable from both front & back!
 */
export const AxialSpinningOrbContent: React.FC<{
  idx?: number;
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-1">
      {children}
    </div>
  );
};

/**
 * Modal opened on Double-Click of the Central Globe (or via the "+" button)
 * allowing the user to add/remove shortcut spheres symmetrically up to MAX_ACTIVE_GLOBE_ORBS (12).
 */
export const CrystalOrbsSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeOrbIds: string[];
  onToggleOrbId: (id: string) => void;
  onResetDefault: () => void;
}> = ({ isOpen, onClose, activeOrbIds, onToggleOrbId, onResetDefault }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="crystal-orbs-selector-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          data-globe-control="true"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[260] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(240,249,255,0.82) 48%, rgba(254,243,199,0.82) 100%)',
              boxShadow:
                '0 25px 70px rgba(0,0,0,0.65), 0 0 40px rgba(251,191,36,0.35), inset 0 2px 6px rgba(255,255,255,0.95)',
            }}
            className="relative w-full max-w-3xl max-h-[86vh] rounded-3xl border-2 border-white/90 text-slate-900 flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-amber-500/25 bg-white/55 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AnimatedMiniGlobeIcon sizeClass="w-8 h-8" iconSizeClass="w-4 h-4" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    კრისტალური ბურთულების / შორთქათების მართვა
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-600 truncate">
                    აირჩიეთ გლობუსის გარშემო მოძრავი სფეროები • მაქსიმუმ{' '}
                    <span className="text-amber-700 font-black">{MAX_ACTIVE_GLOBE_ORBS}</span>{' '}
                    ბურთულა ერთდროულად ({activeOrbIds.length}/{MAX_ACTIVE_GLOBE_ORBS})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={onResetDefault}
                  title="სტანდარტულის აღდგენა"
                  className="px-2.5 py-1.5 rounded-full text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">აღდგენა</span>
                </button>
                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={onClose}
                  title="დახურვა"
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-rose-500 hover:text-white text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Symmetrical Grid of Crystal Spheres */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 place-items-center">
              {ALL_CRYSTAL_SHORTCUT_ORBS.map((orb, i) => {
                const isSelected = activeOrbIds.includes(orb.id);
                const isAtLimit = !isSelected && activeOrbIds.length >= MAX_ACTIVE_GLOBE_ORBS;

                return (
                  <motion.button
                    key={orb.id}
                    type="button"
                    data-raw-btn="true"
                    initial={{ opacity: 0, y: 18, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.025, type: 'spring', stiffness: 240, damping: 20 }}
                    whileHover={{ scale: isAtLimit ? 1 : 1.06 }}
                    whileTap={{ scale: isAtLimit ? 1 : 0.94 }}
                    onClick={() => {
                      if (isAtLimit) return;
                      onToggleOrbId(orb.id);
                    }}
                    style={{
                      background: isSelected
                        ? `radial-gradient(circle at 28% 24%, rgba(255,255,255,0.96) 0%, ${orb.accentColor}55 42%, ${orb.accentColor}99 82%, rgba(255,255,255,0.92) 100%)`
                        : `radial-gradient(circle at 28% 24%, rgba(255,255,255,0.88) 0%, ${orb.accentColor}26 48%, rgba(226,232,240,0.68) 100%)`,
                      boxShadow: isSelected
                        ? `0 12px 28px ${orb.accentColor}50, 0 0 18px ${orb.accentColor}66, inset 0 3px 8px rgba(255,255,255,0.98)`
                        : '0 6px 16px rgba(15,23,42,0.12), inset 0 2px 5px rgba(255,255,255,0.9)',
                    }}
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer select-none overflow-hidden ${
                      isSelected
                        ? 'border-white ring-2 ring-amber-400/90'
                        : isAtLimit
                          ? 'border-slate-300/70 opacity-50 cursor-not-allowed'
                          : 'border-white/80 hover:border-amber-300'
                    }`}
                  >
                    {/* 3D Axial Rotating Sphere Mesh */}
                    <AxialRotatingSphereCanvas
                      accentColor={orb.accentColor}
                      idx={i}
                      lightMode={true}
                    />

                    {/* Crystal Specular Glint */}
                    <span className="pointer-events-none absolute top-2 left-4 w-7 h-2.5 rounded-full bg-white/90 blur-[0.4px] -rotate-12 z-20" />
                    <span className="pointer-events-none absolute bottom-2 right-4 w-5 h-1.5 rounded-full bg-white/65 blur-[0.5px] z-20" />

                    {/* Status Badge (+ / Check) */}
                    <span
                      className={`absolute top-2 right-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow ${
                        isSelected
                          ? 'bg-emerald-500 text-white border border-white'
                          : 'bg-white/90 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </span>

                    <AxialSpinningOrbContent idx={i}>
                      <span
                        dir="rtl"
                        className="font-serif text-xs sm:text-sm font-black text-slate-900 leading-none mb-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                      >
                        {orb.badgeHe}
                      </span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight max-w-[92%] truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                        {orb.mainKa}
                      </span>
                      <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-700 leading-tight max-w-[90%] truncate mt-0.5">
                        {orb.subKa}
                      </span>
                      <span
                        className={`mt-1 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                          isSelected
                            ? 'bg-slate-900/80 text-amber-200'
                            : 'bg-slate-800/15 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'ჩართულია' : 'დამატება'}
                      </span>
                    </AxialSpinningOrbContent>
                  </motion.button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-amber-500/25 bg-white/65 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">
                💡 მინიშნება: გლობუსზე ორჯერ დაწკაპუნებით ეს ფანჯარა ნებისმიერ დროს იხსნება.
              </span>
              <button
                type="button"
                data-raw-btn="true"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:brightness-110 cursor-pointer"
              >
                მზადაა ({activeOrbIds.length})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Reusable Crystalline Royal Crown with Continuously Spinning 3D Magen David Emblem
 * ("გვირგვინის კრისტალური სილამაზე და მბრუნავი მაგენ დავითი")
 */
export const SpinningCrystalCrownMagenDavidEmblem: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 34, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size, perspective: '260px' }}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
    >
      {/* Prismatic Crystal Halo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full opacity-85 animate-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(186,230,253,0.75) 0%, rgba(253,224,71,0.45) 52%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Top Crystal Magen David */}
      <div
        style={{ top: '1px' }}
        className="absolute z-20 w-[48%] h-[48%] flex items-center justify-center"
      >
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-[0_0_5px_rgba(255,255,255,0.95)]">
          <defs>
            <linearGradient id="crystalMagenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#7DD3FC" />
              <stop offset="70%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          {/* Upward & Downward Interlocking Crystal Triangles of Magen David */}
          <polygon
            points="20,3 35,29 5,29"
            fill="rgba(186,230,253,0.28)"
            stroke="url(#crystalMagenGrad)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <polygon
            points="20,37 35,11 5,11"
            fill="rgba(254,240,138,0.25)"
            stroke="url(#crystalMagenGrad)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="3.4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Lower Crystalline Royal Torah Crown with Transparent Glass Facets */}
      <svg
        viewBox="0 0 64 46"
        className="relative z-10 w-[92%] h-[66%] mt-[30%] drop-shadow-[0_2px_6px_rgba(14,116,144,0.35)]"
      >
        <defs>
          <linearGradient id="crystalCrownFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
            <stop offset="32%" stopColor="#38BDF8" stopOpacity="0.18" />
            <stop offset="68%" stopColor="#0F172A" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="crystalBandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.26" />
            <stop offset="25%" stopColor="#F59E0B" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.26" />
          </linearGradient>
        </defs>
        {/* 5 Transparent Crystal Spires */}
        <polygon
          points="8,34 4,14 18,24 20,8 32,20 32,4 32,20 44,8 46,24 60,14 56,34"
          fill="url(#crystalCrownFacetGrad)"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Internal Crystal Facet Ridges */}
        <polyline
          points="4,14 14,34 20,8 26,34 32,4 38,34 44,8 50,34 60,14"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.9"
        />
        {/* Tall Transparent Crystal Rim Band */}
        <rect
          x="8"
          y="33"
          width="48"
          height="10"
          rx="3"
          fill="url(#crystalBandGrad)"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.3"
        />
        {/* Hoshen Translucent Crystal Jewels */}
        <circle cx="16" cy="38" r="2.0" fill="rgba(56,189,248,0.55)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
        <circle cx="24" cy="38" r="2.0" fill="rgba(244,63,94,0.55)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
        <circle cx="32" cy="38" r="2.2" fill="rgba(16,185,129,0.55)" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
        <circle cx="40" cy="38" r="2.0" fill="rgba(168,85,247,0.55)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
        <circle cx="48" cy="38" r="2.0" fill="rgba(245,158,11,0.55)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7" />
        {/* Translucent Crystal Pearls on Spire Tips */}
        <circle cx="4" cy="13" r="2.0" fill="rgba(255,255,255,0.75)" />
        <circle cx="20" cy="7" r="2.2" fill="rgba(224,242,254,0.75)" />
        <circle cx="44" cy="7" r="2.2" fill="rgba(224,242,254,0.75)" />
        <circle cx="60" cy="13" r="2.0" fill="rgba(255,255,255,0.75)" />
      </svg>
    </div>
  );
};

/**
 * AnimatedMiniGlobeIcon:
 * The signature glowing 3D miniature crystal globe with axial rotating sphere canvas,
 * specular reflection highlight, and rotating 3D globe wireframe.
 */
export const AnimatedMiniGlobeIcon: React.FC<{
  sizeClass?: string;
  iconSizeClass?: string;
  search?: boolean;
}> = ({
  sizeClass = 'w-6 h-6 sm:w-6.5 sm:h-6.5',
  iconSizeClass = 'w-3 h-3',
  search = false,
}) => {
  const Icon = search ? Search : Globe;
  return (
    <div
      style={{
        background: search
          ? 'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.7) 0%, rgba(186,230,253,0.28) 34%, rgba(56,189,248,0.14) 62%, rgba(245,158,11,0.3) 100%)'
          : 'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.45) 0%, rgba(217,119,6,0.34) 38%, rgba(15,23,42,0.78) 78%, rgba(3,7,18,0.92) 100%)',
        perspective: '300px',
      }}
      className={`relative ${sizeClass} rounded-full border border-amber-400/70 text-amber-200 flex items-center justify-center backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.4),0_0_8px_rgba(251,191,36,0.25),inset_0_1px_2.5px_rgba(255,255,255,0.7)] shrink-0 overflow-hidden`}
    >
      <AxialRotatingSphereCanvas accentColor="#F59E0B" idx={0} />
      <span className="pointer-events-none absolute top-0.5 left-0.5 w-2 h-0.8 rounded-full bg-white/70 blur-[0.2px] -rotate-12 z-20" />
      <motion.span
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative z-10 flex items-center justify-center"
      >
        <Icon className={`${iconSizeClass} ${search ? 'text-amber-600 dark:text-amber-200' : 'text-amber-200'} drop-shadow`} />
      </motion.span>
    </div>
  );
};

/**
 * AnimatedGlobeIconWrapper:
 * Animates ANY icon or button content just like the animated 3D globe:
 * - 3D continuous axial rotation around Y-axis (perspective 300px, transformStyle preserve-3d)
 * - Optional miniature crystal orb sphere backing with specular light highlight & radial gradient
 */
export const AnimatedGlobeIconWrapper: React.FC<{
  children: React.ReactNode;
  duration?: number;
  withOrb?: boolean;
  sizeClass?: string;
  orbAccent?: string;
  className?: string;
}> = ({
  children,
  duration = 6,
  withOrb = false,
  sizeClass = 'w-6 h-6 sm:w-6.5 sm:h-6.5',
  orbAccent = '#F59E0B',
  className = '',
}) => {
  const content = (
    <motion.span
      animate={{ rotateY: [0, 360] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      className="relative z-10 flex items-center justify-center shrink-0"
    >
      {children}
    </motion.span>
  );

  if (!withOrb) {
    return (
      <span
        style={{ perspective: '300px', transformStyle: 'preserve-3d' }}
        className={`agw-icon icon-orb ${className}`}
      >
        {content}
      </span>
    );
  }

  return (
    <div
      style={{
        background:
          'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.45) 0%, rgba(217,119,6,0.34) 38%, rgba(15,23,42,0.78) 78%, rgba(3,7,18,0.92) 100%)',
        perspective: '300px',
      }}
      className={`relative ${sizeClass} rounded-full border border-amber-400/70 text-amber-200 flex items-center justify-center backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.4),0_0_8px_rgba(251,191,36,0.25),inset_0_1px_2.5px_rgba(255,255,255,0.7)] shrink-0 overflow-hidden ${className}`}
    >
      <AxialRotatingSphereCanvas accentColor={orbAccent} idx={0} />
      <span className="pointer-events-none absolute top-0.5 left-0.5 w-2 h-0.8 rounded-full bg-white/70 blur-[0.2px] -rotate-12 z-20" />
      {content}
    </div>
  );
};


