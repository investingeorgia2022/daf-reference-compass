import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  Mic,
  MicOff,
  X,
  Send,
  Globe,
  Compass,
  Volume2,
  VolumeX,
  Download,
  Plus,
  Crown,
  Search,
  Loader2,
  BookOpen,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { SACRED_REALMS, SacredRealmId } from '../data/tanakhAndHalakhaData';
import { getBackendUrl } from '../utils/georgianTranslator';
import {
  ALL_CRYSTAL_SHORTCUT_ORBS,
  DEFAULT_ACTIVE_ORB_IDS,
  MAX_ACTIVE_GLOBE_ORBS,
  CrystalOrbsSelectorModal,
  drawCrystalGoldenCrown,
  AxialRotatingSphereCanvas,
  AxialSpinningOrbContent,
  SpinningCrystalCrownMagenDavidEmblem,
} from './CrystalGlobeHelpers';

// Realistic World Continent Polygons ([lat, lon] in degrees) for the 3D Central Globe
const REAL_WORLD_CONTINENTS: { name: string; coords: [number, number][] }[] = [
  {
    name: 'Africa',
    coords: [
      [37, 10], [35, -6], [31, -10], [21, -17], [15, -17], [5, -8], [4, 9],
      [-6, 12], [-18, 12], [-34, 18], [-35, 25], [-25, 33], [-15, 41],
      [-2, 41], [12, 51], [12, 43], [22, 37], [31, 32], [32, 24], [37, 10],
    ],
  },
  {
    name: 'Europe',
    coords: [
      [36, -9], [43, -9], [44, -2], [48, -5], [51, 2], [54, 8], [58, 8],
      [62, 5], [70, 20], [70, 30], [66, 40], [60, 60], [50, 55], [45, 40],
      [42, 28], [38, 24], [40, 18], [44, 12], [42, 3], [36, -5], [36, -9],
    ],
  },
  {
    name: 'Asia',
    coords: [
      [31, 32], [37, 36], [41, 29], [45, 40], [50, 55], [60, 60], [70, 70],
      [73, 105], [70, 140], [65, 170], [55, 160], [52, 140], [40, 122],
      [31, 121], [22, 114], [10, 105], [1, 104], [16, 97], [22, 88],
      [8, 77], [24, 67], [25, 56], [13, 45], [28, 34], [31, 32],
    ],
  },
  {
    name: 'NorthAmerica',
    coords: [
      [70, -160], [71, -130], [65, -90], [60, -65], [47, -53], [42, -70],
      [35, -75], [25, -80], [30, -88], [22, -97], [18, -94], [8, -78],
      [15, -92], [23, -106], [32, -117], [48, -124], [60, -140], [61, -165],
      [70, -160],
    ],
  },
  {
    name: 'SouthAmerica',
    coords: [
      [11, -75], [10, -62], [2, -50], [-6, -35], [-15, -39], [-23, -43],
      [-35, -54], [-54, -68], [-50, -75], [-33, -72], [-18, -71], [-5, -81],
      [5, -77], [11, -75],
    ],
  },
  {
    name: 'Australia',
    coords: [
      [-12, 131], [-12, 142], [-20, 149], [-28, 153], [-38, 146], [-35, 136],
      [-34, 115], [-22, 114], [-15, 124], [-12, 131],
    ],
  },
  {
    name: 'Greenland',
    coords: [
      [60, -44], [68, -53], [78, -68], [82, -35], [72, -22], [65, -38], [60, -44],
    ],
  },
  {
    name: 'Madagascar',
    coords: [
      [-13, 49], [-20, 44], [-25, 47], [-18, 50], [-13, 49],
    ],
  },
  {
    name: 'Japan',
    coords: [
      [31, 130], [35, 136], [40, 140], [44, 145], [36, 140], [31, 130],
    ],
  },
  {
    name: 'BritishIsles',
    coords: [
      [50, -5], [55, -6], [58, -4], [53, 1], [50, -5],
    ],
  },
];

export function getTimeBasedGeorgianGreeting(): {
  greetingKa: string;
  greetingHe: string;
  periodLabel: string;
  presetAudio: string;
  spokenTextKa: string;
} {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greetingKa: 'დილა მშვიდობისა!',
      greetingHe: 'בוקר טוב!',
      periodLabel: 'დილის სწავლება',
      presetAudio: 'kacuna-morning',
      spokenTextKa:
        'დილა მშვიდობისა! ბოკერ ტოვ! მე ვარ თქვენი ჭკვიანი დამხმარე. რას ვსწავლობთ ახლა? მითხარით ან შეეხეთ სასურველ სფეროს.',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greetingKa: 'შუადღე მშვიდობისა!',
      greetingHe: 'צהריים טובים!',
      periodLabel: 'შუადღის სწავლება',
      presetAudio: 'kacuna-afternoon',
      spokenTextKa:
        'შუადღე მშვიდობისა! ცოჰორაიმ ტოვიმ! მე ვარ თქვენი ჭკვიანი დამხმარე. რას ვსწავლობთ ახლა? მითხარით ან შეეხეთ სასურველ სფეროს.',
    };
  }
  return {
    greetingKa: 'საღამო მშვიდობისა!',
    greetingHe: 'ערב טוב!',
    periodLabel: 'საღამოს სწავლება',
    presetAudio: 'kacuna-evening',
    spokenTextKa:
      'საღამო მშვიდობისა! ერევ ტოვ! მე ვარ თქვენი ჭკვიანი დამხმარე. რას ვსწავლობთ ახლა? მითხარით ან შეეხეთ სასურველ სფეროს.',
  };
}

interface GalacticGlobeAndAiGreeterProps {
  isGlobeOpen: boolean;
  onCloseGlobe: () => void;
  onOpenGlobe?: () => void;
  onSelectRealm: (
    realmId: SacredRealmId,
    bookId?: string,
    chapter?: number,
    tractateId?: string,
    dafId?: string
  ) => void;
  activeRealm: SacredRealmId;
  bottomSheetExpanded?: boolean;
  isDark?: boolean;
}

/**
 * 3D Rotating Globe Sphere (identical to the Central 3D Globe with rotating meridians, continents & golden glass)
 * with Seated Chacham Kacuna inside!
 * ("კაცუნა ჩასვი გლობუსის ნაირ ბურთულაში რომელიც ტრიალობს")
 */
const LifelikeGlassOrbKacunaAvatar: React.FC<{
  speaking: boolean;
  stopped: boolean;
  sizeClass?: string;
}> = ({ speaking, stopped, sizeClass = 'w-14 h-14' }) => {
  const backGlobeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontGlobeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    let currentYaw = 0.45;
    const pitch = 0.18;
    const size = 112;

    const render = () => {
      currentYaw += 0.012;
      const backCanvas = backGlobeCanvasRef.current;
      const frontCanvas = frontGlobeCanvasRef.current;
      if (!backCanvas || !frontCanvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (backCanvas.width !== size) {
        backCanvas.width = size;
        backCanvas.height = size;
      }
      if (frontCanvas.width !== size) {
        frontCanvas.width = size;
        frontCanvas.height = size;
      }

      const bCtx = backCanvas.getContext('2d');
      const fCtx = frontCanvas.getContext('2d');
      if (!bCtx || !fCtx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.46;

      bCtx.clearRect(0, 0, size, size);
      fCtx.clearRect(0, 0, size, size);

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

      // 1. Back Canvas: Translucent 3D Globe Body matching the Central Globe
      const sphereGrad = bCtx.createRadialGradient(
        cx - r * 0.32,
        cy - r * 0.32,
        r * 0.06,
        cx,
        cy,
        r
      );
      sphereGrad.addColorStop(0, 'rgba(74, 46, 27, 0.72)');
      sphereGrad.addColorStop(0.38, 'rgba(30, 27, 75, 0.68)');
      sphereGrad.addColorStop(0.75, 'rgba(15, 23, 42, 0.76)');
      sphereGrad.addColorStop(1, 'rgba(217, 119, 6, 0.82)');

      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fillStyle = sphereGrad;
      bCtx.fill();

      // Back hemisphere meridians
      bCtx.lineWidth = 0.9;
      bCtx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        bCtx.beginPath();
        let started = false;
        for (let latDeg = -80; latDeg <= 80; latDeg += 16) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z <= 0) {
            if (!started) {
              bCtx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              bCtx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        bCtx.stroke();
      }

      // 2. Front Canvas: Front hemisphere meridians, parallels & continents
      fCtx.save();
      fCtx.beginPath();
      fCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fCtx.clip();

      fCtx.lineWidth = 1.05;
      fCtx.strokeStyle = 'rgba(253, 230, 138, 0.42)';
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        fCtx.beginPath();
        let started = false;
        for (let latDeg = -80; latDeg <= 80; latDeg += 12) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              fCtx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              fCtx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        fCtx.stroke();
      }

      for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
        fCtx.beginPath();
        let started = false;
        for (let lonDeg = 0; lonDeg <= 360; lonDeg += 12) {
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              fCtx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              fCtx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        fCtx.stroke();
      }

      // World Continents on the Front Hemisphere of Kacuna's Globe
      REAL_WORLD_CONTINENTS.forEach((cont) => {
        fCtx.beginPath();
        let visibleCount = 0;
        let started = false;
        for (let i = 0; i < cont.coords.length; i++) {
          const [latDeg, lonDeg] = cont.coords[i];
          const pt = projectPt(latDeg, lonDeg);
          if (pt.z > 0) {
            if (!started) {
              fCtx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              fCtx.lineTo(pt.x, pt.y);
            }
            visibleCount++;
          } else {
            started = false;
          }
        }
        if (visibleCount >= 2) {
          fCtx.closePath();
          fCtx.fillStyle = 'rgba(245, 158, 11, 0.24)';
          fCtx.fill();
          fCtx.lineWidth = 1.1;
          fCtx.strokeStyle = 'rgba(253, 230, 138, 0.68)';
          fCtx.stroke();
        }
      });

      // Glass Specular Highlight Arc on Kacuna's 3D Globe
      const glossGrad = fCtx.createRadialGradient(
        cx - r * 0.36,
        cy - r * 0.36,
        r * 0.02,
        cx - r * 0.22,
        cy - r * 0.22,
        r * 0.58
      );
      glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.52)');
      glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      fCtx.beginPath();
      fCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fCtx.fillStyle = glossGrad;
      fCtx.fill();
      fCtx.restore();

      // Golden 3D Globe Outer Rim
      fCtx.beginPath();
      fCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fCtx.lineWidth = 2.2;
      fCtx.strokeStyle = 'rgba(253, 230, 138, 0.85)';
      fCtx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className={`relative ${sizeClass} rounded-full flex items-center justify-center select-none`}
    >
      {/* Golden-Celestial 3D Globe Aura */}
      <div
        className={`pointer-events-none absolute -inset-1.5 rounded-full blur-[5px] transition-opacity duration-300 ${
          speaking && !stopped ? 'opacity-95 animate-pulse' : 'opacity-75'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(245,158,11,0.52) 0%, rgba(56,189,248,0.34) 55%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* 1. Back Hemisphere of the 3D Globe */}
      <canvas
        ref={backGlobeCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-10 rounded-full"
      />

      {/* 2. Seated Chacham Kacuna Inside the Center of the 3D Globe */}
      <div
        className={`relative z-20 w-[76%] h-[76%] flex items-center justify-center transition-transform duration-300 ${
          speaking && !stopped ? 'scale-105' : 'scale-100'
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
          <defs>
            <radialGradient id="kacunaCrystalSkin" cx="46%" cy="38%" r="56%">
              <stop offset="0%" stopColor="#FFF1DF" />
              <stop offset="55%" stopColor="#F4CCA4" />
              <stop offset="100%" stopColor="#D49B6A" />
            </radialGradient>
            <linearGradient id="kacunaCrystalBeard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Royal Golden Cushion Inside the Globe where Kacuna sits */}
          <ellipse cx="50" cy="84" rx="28" ry="8" fill="#F59E0B" opacity="0.82" />
          <ellipse cx="50" cy="82" rx="23" ry="5.5" fill="#FEF08A" opacity="0.92" />

          {/* Seated Body & White-Gold Tallit Robe */}
          <path
            d="M26 79 C28 58 38 53 50 53 C62 53 72 58 74 79 Z"
            fill="#FFFFFF"
            stroke="#38BDF8"
            strokeWidth="1.6"
          />
          <path d="M35 56 L32 77 M65 56 L68 77" stroke="#0284C7" strokeWidth="2.4" />
          <path d="M39 55 L50 66 L61 55" fill="none" stroke="#F59E0B" strokeWidth="1.8" />

          {/* Crossed Legs in Seated Posture */}
          <path
            d="M28 79 Q50 88 72 79"
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Open Golden Sefer / Book on Lap */}
          <rect
            x="35"
            y="66"
            width="30"
            height="11"
            rx="2"
            fill="#FFFBEB"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <line x1="50" y1="66" x2="50" y2="77" stroke="#D97706" strokeWidth="1.3" />

          {/* Seated Scholar Head */}
          <circle
            cx="50"
            cy="35"
            r="15.5"
            fill="url(#kacunaCrystalSkin)"
            stroke="#C28858"
            strokeWidth="1"
          />

          {/* Golden-Crowned Velvet Kippah */}
          <path
            d="M34 29 Q50 13 66 29 Z"
            fill="#1E3A8A"
            stroke="#FBBF24"
            strokeWidth="1.8"
          />
          <circle cx="50" cy="19.5" r="2.3" fill="#FEF08A" />

          {/* Twinkling Eyes */}
          <circle cx="44" cy="34" r="2.1" fill="#0F172A" />
          <circle cx="56" cy="34" r="2.1" fill="#0F172A" />
          <circle cx="43.3" cy="33.2" r="0.8" fill="#FFFFFF" />
          <circle cx="55.3" cy="33.2" r="0.8" fill="#FFFFFF" />

          {/* Flowing White Beard */}
          <path
            d="M36 39 C36 54 43 63 50 64 C57 63 64 54 64 39 C59 44 55 45 50 45 C45 45 41 44 36 39 Z"
            fill="url(#kacunaCrystalBeard)"
            stroke="#CBD5E1"
            strokeWidth="0.9"
          />

          {/* Smiling / Speaking Mouth */}
          {speaking && !stopped ? (
            <ellipse cx="50" cy="44.5" rx="3.2" ry="2.1" fill="#991B1B" />
          ) : (
            <path
              d="M46 44 Q50 47 54 44"
              fill="none"
              stroke="#92400E"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* 3. Front Hemisphere of the Rotating 3D Globe (Meridians, Continents & Glass Specular Glint rotating over Kacuna!) */}
      <canvas
        ref={frontGlobeCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-30 rounded-full"
      />
    </div>
  );
};

interface KacunaGeminiSource {
  realmId: SacredRealmId;
  bookId?: string;
  chapter?: number;
  tractateId?: string;
  dafId?: string;
  section?: string;
  labelKa: string;
  labelHe: string;
  quoteHe: string;
  explanationKa: string;
}

interface KacunaDirectNavShortcut {
  labelKa: string;
  realmId: SacredRealmId;
  bookId?: string;
  chapter?: number;
  tractateId?: string;
  dafId?: string;
}

interface KacunaGeminiSearchResult {
  question: string;
  answerKa: string;
  summaryHe: string;
  keyPointsKa: string[];
  halachaTakeawayKa: string;
  sources: KacunaGeminiSource[];
  webSources: { title: string; uri: string }[];
  directNavShortcut?: KacunaDirectNavShortcut;
}

const KACUNA_QUICK_QUESTIONS: { label: string; query: string }[] = [
  {
    label: '❓ კრიათ შმას დრო',
    query: 'როდის იწყება საღამოს კრიათ შმას კითხვა და რას ამბობს ბერახოთ 2a?',
  },
  {
    label: '🕯️ ხანუქის სასწაული',
    query: 'რა არის ხანუქა და როგორ ვანთებთ სანთლებს ტრაქტატ შაბათის 21b-ის მიხედვით?',
  },
  {
    label: '🌧️ 3 გასაღები (თაანით)',
    query: 'რა არის სამი გასაღები უფლის ხელში ტრაქტატ თაანითის 2a დაფის მიხედვით?',
  },
  {
    label: '📜 ბერეშითი 1',
    query: 'რას გვასწავლის თორის პირველი თავი (ბერეშითი) და რაშის კომენტარი სამყაროს შექმნაზე?',
  },
  {
    label: '⚖️ რამბამი და შულხან ყარუხი',
    query: 'რა არის რამბამის იესოდეი ჰათორასა და შულხან ყარუხის პირველი კანონი?',
  },
];

const KacunaGeminiResultPanel: React.FC<{
  loading: boolean;
  result: KacunaGeminiSearchResult | null;
  onClear: () => void;
  onSpeakText: (text: string) => void;
  onSelectSource: (src: KacunaGeminiSource) => void;
  onExecuteShortcut?: (shortcut: KacunaDirectNavShortcut) => void;
}> = ({ loading, result, onClear, onSpeakText, onSelectSource, onExecuteShortcut }) => {
  if (loading) {
    return (
      <div className="relative z-10 mt-2.5 rounded-xl bg-white/90 border border-amber-300/90 p-3 shadow-inner flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black text-amber-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
            <span>ჭკვიანი ეძებს Gemini-ში...</span>
          </div>
          <p className="text-[10.5px] font-bold text-slate-700 leading-snug mt-0.5">
            მოწმდება თორის, თალმუდის, ჰალახისა და Google Search-ის წყაროები
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="relative z-10 mt-2.5 rounded-2xl bg-white/92 border-2 border-amber-300/90 p-2.5 sm:p-3 shadow-lg max-h-[50vh] sm:max-h-[54vh] overflow-y-auto space-y-2.5 text-slate-900">
      {/* Top Result Header Bar */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-amber-900/15">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9.5px] font-black tracking-wide flex items-center gap-1 shrink-0 shadow-xs">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Gemini ძიება</span>
          </span>
          <span className="text-[10.5px] font-black text-slate-800 truncate">
            „{result.question}“
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-raw-btn="true"
            onClick={() => onSpeakText(result.answerKa)}
            title="პასუხის წაკითხვა ხმით"
            className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-[9.5px] font-black flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-3 h-3 text-amber-700" />
            <span>წაკითხვა</span>
          </button>
          <button
            type="button"
            data-raw-btn="true"
            onClick={onClear}
            title="შედეგის გასუფთავება"
            className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[9.5px] font-extrabold cursor-pointer"
          >
            გასუფთავება
          </button>
        </div>
      </div>

      {/* Optional Direct Navigation Shortcut Banner if query also matched a realm/tractate */}
      {result.directNavShortcut && onExecuteShortcut && (
        <button
          type="button"
          data-raw-btn="true"
          onClick={() => onExecuteShortcut(result.directNavShortcut!)}
          className="w-full px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 hover:brightness-105 text-white text-[11px] font-black flex items-center justify-between gap-2 shadow cursor-pointer"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Compass className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">
              პირდაპირ გადასვლა: {result.directNavShortcut.labelKa}
            </span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      )}

      {/* 1. Main Structured Answer Card */}
      <div className="rounded-xl bg-gradient-to-br from-[#2A1B10]/95 via-[#1F140D]/95 to-[#150D08]/98 border border-amber-400/50 p-2.5 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>1. მთავარი პასუხი • העיקר</span>
          </span>
        </div>
        <p className="text-[11.5px] sm:text-xs font-bold leading-relaxed text-amber-100">
          {result.answerKa}
        </p>
        {result.summaryHe && (
          <div
            dir="rtl"
            className="mt-2 pt-1.5 border-t border-amber-500/30 text-[11.5px] font-serif font-bold text-amber-200 leading-relaxed"
          >
            {result.summaryHe}
          </div>
        )}
      </div>

      {/* 2. Organized Key Points */}
      {result.keyPointsKa && result.keyPointsKa.length > 0 && (
        <div className="rounded-xl bg-[#20150D]/90 border border-amber-500/35 p-2.5 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span>2. ძირითადი პუნქტები • დალაგებული ანალიზი</span>
          </div>
          <div className="space-y-1.5">
            {result.keyPointsKa.map((pt, idx) => (
              <div
                key={`kacuna-kp-${idx}`}
                className="flex items-start gap-2 rounded-lg bg-[#2D1E13]/90 border border-amber-500/25 px-2 py-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-amber-500 text-[#180E05] text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-bold text-stone-200 leading-snug">
                  {pt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Halachic / Practical Takeaway */}
      {result.halachaTakeawayKa && (
        <div className="rounded-xl bg-[#14261B]/90 border border-emerald-500/50 p-2.5 shadow-xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 mb-1">
            ⚖️ 3. დასკვნა და პრაქტიკული აზრი • הלכה למעשה
          </div>
          <p className="text-[11px] font-extrabold text-emerald-100 leading-snug">
            {result.halachaTakeawayKa}
          </p>
        </div>
      )}

      {/* 4. Clickable Sacred Library Sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="rounded-xl bg-[#22160E]/90 border border-amber-500/40 p-2.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1.5">
            📚 4. პირდაპირი წყაროები (დააჭირეთ დაფზე გადასასვლელად)
          </div>
          <div className="space-y-1.5">
            {result.sources.map((src, idx) => (
              <button
                key={`kacuna-src-${idx}`}
                type="button"
                data-raw-btn="true"
                onClick={() => onSelectSource(src)}
                className="w-full text-left rounded-xl bg-[#2D1D12]/90 hover:bg-[#3D2719] border border-amber-500/40 hover:border-amber-400 p-2 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-black text-amber-200 group-hover:text-amber-100 truncate">
                    {src.labelKa}
                  </span>
                  <span
                    dir="rtl"
                    className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-[10px] font-serif font-bold text-amber-200 shrink-0"
                  >
                    {src.labelHe}
                  </span>
                </div>
                {src.quoteHe && (
                  <div
                    dir="rtl"
                    className="mt-1 text-[11px] font-serif font-bold text-amber-200/90 bg-[#1A1009]/80 px-2 py-0.5 rounded border border-amber-500/30"
                  >
                    „{src.quoteHe}“
                  </div>
                )}
                {src.explanationKa && (
                  <p className="mt-1 text-[10.5px] font-bold text-stone-300 leading-snug">
                    {src.explanationKa}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Grounded Web Sources from Gemini Google Search */}
      {result.webSources && result.webSources.length > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-sky-600" />
            <span>5. Gemini Google Search ვებ-წყაროები</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.webSources.map((ws, idx) => (
              <a
                key={`kacuna-ws-${idx}`}
                href={ws.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-300 text-[10px] font-extrabold text-sky-800 flex items-center gap-1 max-w-full truncate"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{ws.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Multi-origin spawn points so spheres emerge from several distinct places,
// sway left and right, and join the rotating chain around the globe
const MULTI_SPAWN_ORIGINS: { xRatio: number; yRatio: number }[] = [
  { xRatio: -0.42, yRatio: 0.56 }, // Bottom-left cluster
  { xRatio: 0.42, yRatio: 0.56 },  // Bottom-right cluster
  { xRatio: -0.22, yRatio: 0.64 }, // Lower-mid-left cluster
  { xRatio: 0.22, yRatio: 0.64 },  // Lower-mid-right cluster
  { xRatio: 0.0, yRatio: 0.68 },   // Center-bottom cluster
];

// Global session flag so Kacuna greets ONLY ONCE on the Orbs screen ("საკმარისია ერთხელ")
let hasKacunaGreetedOnceGlobal = false;

export const GalacticGlobeAndAiGreeter: React.FC<GalacticGlobeAndAiGreeterProps> = ({
  isGlobeOpen,
  onCloseGlobe,
  onOpenGlobe,
  onSelectRealm,
  activeRealm,
  bottomSheetExpanded = false,
  isDark = false,
}) => {
  const [externalSheetExpanded, setExternalSheetExpanded] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSheetChange = (ev: Event) => {
      const customEv = ev as CustomEvent<{ expanded?: boolean }>;
      setExternalSheetExpanded(Boolean(customEv.detail?.expanded));
    };
    window.addEventListener('bottom-sheet-expanded-change', onSheetChange);
    return () => window.removeEventListener('bottom-sheet-expanded-change', onSheetChange);
  }, []);
  const isAnyBottomSheetExpanded = bottomSheetExpanded || externalSheetExpanded;
  // 3D Sphere & Orbiting Glass Orbs rotation state (in radians)
  const [rotYaw, setRotYaw] = useState<number>(0.45);
  const [rotPitch, setRotPitch] = useState<number>(0.16);
  const [isUserTouchingGlobe, setIsUserTouchingGlobe] = useState<boolean>(false);
  const [isSymmetricRingMode, setIsSymmetricRingMode] = useState<boolean>(false);
  const [ringStep, setRingStep] = useState<number>(0);
  const [isTapBloomActive, setIsTapBloomActive] = useState<boolean>(false);
  const [isReturningToOrbit, setIsReturningToOrbit] = useState<boolean>(false);
  const [tapRippleKey, setTapRippleKey] = useState<number>(0);
  // Smooth blend (0 = crown atop globe, 1 = crown inside center of globe when spheres arrange around globe)
  const [crownInsideBlend, setCrownInsideBlend] = useState<number>(0);
  // Active crystal shortcut spheres around the globe (customizable via double-click modal, max 12)
  const [activeOrbIds, setActiveOrbIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('crystal_globe_active_orb_ids_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, MAX_ACTIVE_GLOBE_ORBS);
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_ACTIVE_ORB_IDS;
  });
  const [isOrbsModalOpen, setIsOrbsModalOpen] = useState<boolean>(false);
  // Multi-origin swaying ascent progress (0 -> 1) when entering the screen OR re-activating arranged spheres
  const [ascendProgress, setAscendProgress] = useState<number>(0);
  const [ascentTriggerKey, setAscentTriggerKey] = useState<number>(0);
  const enterStartPerfRef = useRef<number>(0);
  const lastGlobeTapTimeRef = useRef<number>(0);

  const activeOrbsList = useMemo(() => {
    const list = ALL_CRYSTAL_SHORTCUT_ORBS.filter((o) => activeOrbIds.includes(o.id));
    return list.length > 0 ? list : ALL_CRYSTAL_SHORTCUT_ORBS.slice(0, 11);
  }, [activeOrbIds]);

  const handleToggleOrbId = (orbId: string) => {
    setActiveOrbIds((prev) => {
      let next: string[];
      if (prev.includes(orbId)) {
        if (prev.length <= 3) return prev; // Keep at least 3 spheres around the globe
        next = prev.filter((id) => id !== orbId);
      } else {
        if (prev.length >= MAX_ACTIVE_GLOBE_ORBS) return prev;
        next = [...prev, orbId];
      }
      try {
        window.localStorage.setItem('crystal_globe_active_orb_ids_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    tailBoostUntilRef.current = performance.now() + 900;
  };

  const handleResetDefaultOrbs = () => {
    setActiveOrbIds(DEFAULT_ACTIVE_ORB_IDS);
    try {
      window.localStorage.setItem(
        'crystal_globe_active_orb_ids_v1',
        JSON.stringify(DEFAULT_ACTIVE_ORB_IDS)
      );
    } catch {
      // ignore
    }
    tailBoostUntilRef.current = performance.now() + 900;
  };

  // Cinematic Sphere Selection Animation State:
  // Glides slowly and smoothly to center (2250ms), zooms up to equal globe in size, pulses with crystal resonance (550ms),
  // bursts into a brilliant celestial supernova with shockwaves and stardust (1500ms), then cleanly transitions to the interface.
  const [burstingOrbState, setBurstingOrbState] = useState<{
    orb: (typeof ALL_CRYSTAL_SHORTCUT_ORBS)[number];
    startX: number;
    startY: number;
    startScale: number;
    targetScale: number;
    phase: 'glide' | 'resonate' | 'burst';
    galaxyCenterOffsetY: number;
    sphereDiameter: number;
  } | null>(null);

  const burstAnimationTimersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      burstAnimationTimersRef.current.forEach(clearTimeout);
      burstAnimationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isGlobeOpen) {
      setBurstingOrbState(null);
      burstAnimationTimersRef.current.forEach(clearTimeout);
      burstAnimationTimersRef.current = [];
    }
  }, [isGlobeOpen]);

  const handleOrbClickWithCinematicBurst = (
    orb: (typeof ALL_CRYSTAL_SHORTCUT_ORBS)[number],
    currentX: number,
    currentY: number,
    currentScale: number,
    sphereDiameter: number,
    galaxyCenterOffsetY: number,
    targetScaleToMatchGlobe: number
  ) => {
    if (burstingOrbState) return;

    burstAnimationTimersRef.current.forEach(clearTimeout);
    burstAnimationTimersRef.current = [];

    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 30, 45]);
      }
    } catch {
      // ignore
    }

    // Phase 1: Snappy, responsive glide & zoom to the screen center to equal the globe (280ms)
    setBurstingOrbState({
      orb,
      startX: currentX,
      startY: currentY,
      startScale: currentScale,
      targetScale: targetScaleToMatchGlobe,
      phase: 'glide',
      galaxyCenterOffsetY,
      sphereDiameter,
    });

    // Phase 2: Sits at center and equals the Globe in size — radiant crystal resonance & golden pulse (280ms -> 420ms)
    const tResonate = setTimeout(() => {
      setBurstingOrbState((prev) => (prev ? { ...prev, phase: 'resonate' } : null));
    }, 280);
    burstAnimationTimersRef.current.push(tResonate);

    // Phase 3: Spectacular supernova burst with expanding shockwave rings, stardust shards & light beams (420ms -> 580ms)
    const tBurst = setTimeout(() => {
      setBurstingOrbState((prev) => (prev ? { ...prev, phase: 'burst' } : null));
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([35, 45, 60]);
        }
      } catch {
        // ignore
      }
    }, 420);
    burstAnimationTimersRef.current.push(tBurst);

    // Phase 4: Snappy transition into the selected sacred realm / tractate interface (580ms)
    const tDone = setTimeout(() => {
      onSelectRealm(
        orb.realmId,
        orb.bookEn,
        orb.chapter,
        orb.tractateId,
        orb.dafId
      );
      onCloseGlobe();
      setBurstingOrbState(null);
    }, 580);
    burstAnimationTimersRef.current.push(tDone);
  };

  // Smoothly animate the Crown between the top of the Globe (0) and the exact center inside the Globe (1)
  // whenever spheres arrange around the globe (`isSymmetricRingMode`)
  useEffect(() => {
    let animFrame = 0;
    const target = isSymmetricRingMode ? 1 : 0;
    const stepCrown = () => {
      setCrownInsideBlend((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.008) return target;
        animFrame = requestAnimationFrame(stepCrown);
        return prev + diff * 0.14;
      });
    };
    animFrame = requestAnimationFrame(stepCrown);
    return () => cancelAnimationFrame(animFrame);
  }, [isSymmetricRingMode]);

  // Trigger multi-origin swaying ascent animation whenever the Spheres Screen opens OR when re-activating arranged spheres
  useEffect(() => {
    if (!isGlobeOpen) {
      setAscendProgress(0);
      return;
    }
    enterStartPerfRef.current = performance.now();
    tailBoostUntilRef.current = performance.now() + 2850;
    setAscendProgress(0);

    let animFrame = 0;
    const DURATION_MS = 2650;
    const tickAscent = (now: number) => {
      const elapsed = now - enterStartPerfRef.current;
      const p = Math.max(0, Math.min(1, elapsed / DURATION_MS));
      setAscendProgress(p);
      if (p < 1) {
        animFrame = requestAnimationFrame(tickAscent);
      }
    };
    animFrame = requestAnimationFrame(tickAscent);
    return () => cancelAnimationFrame(animFrame);
  }, [isGlobeOpen, ascentTriggerKey]);
  const portalRootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 760,
    height: 680,
  });
  const bloomTimeoutRef = useRef<number | null>(null);
  const returnOrbitTimeoutRef = useRef<number | null>(null);
  const wasDraggedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    moved: boolean;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Track celestial particle tails following the spheres as they travel to new positions
  const sphereInterpolatedPosRef = useRef<{ x: number; y: number }[]>([]);
  const celestialParticlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;
    }[]
  >([]);
  const tailBoostUntilRef = useRef<number>(0);

  // Measure interactive stage dimensions so the central globe and symmetrical sphere ring
  // align in exact Euclidean pixel coordinates on every screen size
  useEffect(() => {
    if (!isGlobeOpen || typeof window === 'undefined') return;
    const updateStageSize = () => {
      const el = stageRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        setStageSize({ width: el.clientWidth, height: el.clientHeight });
      } else {
        setStageSize({ width: window.innerWidth, height: window.innerHeight - 100 });
      }
    };
    updateStageSize();
    window.addEventListener('resize', updateStageSize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      ro = new ResizeObserver(updateStageSize);
      ro.observe(stageRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateStageSize);
      if (ro) ro.disconnect();
    };
  }, [isGlobeOpen]);

  // Toggle between Symmetrical Interlocking Ring around Central Globe and 3D Orbital Motion
  const handleTriggerSymmetricGlobeRing = () => {
    hasTouchedGlobeScreenRef.current = true;
    setShowTouchScreenReminder(false);
    if (touchReminderTimerRef.current) {
      window.clearTimeout(touchReminderTimerRef.current);
      touchReminderTimerRef.current = null;
    }
    setIsUserTouchingGlobe(false);
    setTapRippleKey((k) => k + 1);
    setIsTapBloomActive(true);
    // Activate rich celestial comet particle tail burst while spheres travel
    tailBoostUntilRef.current = performance.now() + 2650;
    if (bloomTimeoutRef.current) {
      window.clearTimeout(bloomTimeoutRef.current);
    }
    bloomTimeoutRef.current = window.setTimeout(() => {
      setIsTapBloomActive(false);
    }, 260);

    setIsSymmetricRingMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        // Arranging symmetrically around the central globe (and moving the crown inside the center of the globe!)
        setIsReturningToOrbit(false);
        setRingStep((s) => s % Math.max(1, activeOrbsList.length));
      } else {
        // When tapping the screen again to set arranged spheres back in motion:
        // trigger the multi-origin swaying ascent animation where spheres emerge from several places,
        // sway left and right, and join the rotating chain around the globe!
        setIsReturningToOrbit(true);
        setAscentTriggerKey((k) => k + 1);
        if (returnOrbitTimeoutRef.current) {
          window.clearTimeout(returnOrbitTimeoutRef.current);
        }
        returnOrbitTimeoutRef.current = window.setTimeout(() => {
          setIsReturningToOrbit(false);
        }, 440);
      }
      return nextMode;
    });
  };

  // Interactive event listener on the GalacticGlobeAndAiGreeter portal container:
  // clicking anywhere on the screen outside the spheres toggles symmetrical ring <-> orbital motion
  useEffect(() => {
    if (!isGlobeOpen) return;
    const portalEl = portalRootRef.current;
    if (!portalEl) return;

    const handleAnyPortalTouchOrPointerDown = () => {
      hasTouchedGlobeScreenRef.current = true;
      setShowTouchScreenReminder(false);
      if (touchReminderTimerRef.current) {
        window.clearTimeout(touchReminderTimerRef.current);
        touchReminderTimerRef.current = null;
      }
    };

    const handlePortalClickOutsideSpheres = (e: MouseEvent) => {
      handleAnyPortalTouchOrPointerDown();
      if (wasDraggedRef.current) {
        wasDraggedRef.current = false;
        return;
      }
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('[data-globe-sphere="true"]') ||
        target.closest('[data-globe-control="true"]')
      ) {
        return;
      }
      handleTriggerSymmetricGlobeRing();
    };

    portalEl.addEventListener('pointerdown', handleAnyPortalTouchOrPointerDown, { passive: true });
    portalEl.addEventListener('touchstart', handleAnyPortalTouchOrPointerDown, { passive: true });
    portalEl.addEventListener('click', handlePortalClickOutsideSpheres);
    return () => {
      portalEl.removeEventListener('pointerdown', handleAnyPortalTouchOrPointerDown);
      portalEl.removeEventListener('touchstart', handleAnyPortalTouchOrPointerDown);
      portalEl.removeEventListener('click', handlePortalClickOutsideSpheres);
    };
  }, [isGlobeOpen]);

  // AI Character ("კაცუნა") starts MINIMIZED / COMPACT so it never covers the galaxy or Daf
  const [kacunaExpanded, setKacunaExpanded] = useState<boolean>(false);
  const [kacunaStopped, setKacunaStopped] = useState<boolean>(false);
  const [kacunaSpeaking, setKacunaSpeaking] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [userCommandInput, setUserCommandInput] = useState<string>('');
  const [kacunaMessage, setKacunaMessage] = useState<string>('');
  const [showTouchScreenReminder, setShowTouchScreenReminder] = useState<boolean>(false);
  const [kacunaSearchLoading, setKacunaSearchLoading] = useState<boolean>(false);
  const [kacunaSearchResult, setKacunaSearchResult] = useState<KacunaGeminiSearchResult | null>(
    null
  );
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const kacunaAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoSpeakRef = useRef<{ text?: string; preset?: string } | null>(null);
  const hasAutoGreetedGlobeRef = useRef<boolean>(false);
  const hasTouchedGlobeScreenRef = useRef<boolean>(false);
  const touchReminderTimerRef = useRef<number | null>(null);

  const greetingInfo = useMemo(() => getTimeBasedGeorgianGreeting(), []);

  // Auto-close Kacuna dialog with gentle soft fade when user taps/clicks outside the window
  useEffect(() => {
    if (!kacunaExpanded) return;
    const handleOutsideInteraction = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('[data-kacuna-dialog="true"]') ||
        target?.closest('[data-kacuna-toggle="true"]') ||
        target?.closest('[data-globe-sphere="true"]')
      ) {
        return;
      }
      setKacunaExpanded(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutsideInteraction, { passive: true });
      window.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
      window.addEventListener('click', handleOutsideInteraction, { passive: true });
    }, 60);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutsideInteraction);
      window.removeEventListener('touchstart', handleOutsideInteraction);
      window.removeEventListener('click', handleOutsideInteraction);
    };
  }, [kacunaExpanded]);

  // Speak Kacuna's Georgian/Hebrew voice using pre-cached Gemini 3.8 TTS WAVs + /api/tts/speak
  const speakKacunaVoice = (options: { text?: string; preset?: string }) => {
    if (typeof window === 'undefined') return;
    const { text, preset } = options;

    try {
      if (kacunaAudioRef.current) {
        kacunaAudioRef.current.onended = null;
        kacunaAudioRef.current.onerror = null;
        kacunaAudioRef.current.pause();
        kacunaAudioRef.current.currentTime = 0;
        kacunaAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }

    const spokenPhrase = text || greetingInfo.spokenTextKa;
    const primarySrc = preset
      ? `/tts-cache/${preset}.wav`
      : `/api/tts/speak?text=${encodeURIComponent(spokenPhrase)}`;
    const fallbackApiSrc = `/api/tts/speak?preset=${encodeURIComponent(preset || '')}&text=${encodeURIComponent(
      spokenPhrase
    )}`;

    let fallbackHandled = false;
    const playWithBrowserSpeechFallback = (phrase: string) => {
      if (fallbackHandled) return;
      fallbackHandled = true;
      if (!('speechSynthesis' in window)) {
        setKacunaSpeaking(false);
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(phrase);
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => v.lang.toLowerCase().startsWith('ka')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('he') || v.lang.toLowerCase().startsWith('iw')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('ru'));
        if (preferred) utter.voice = preferred;
        utter.rate = 0.96;
        utter.onstart = () => {
          setKacunaStopped(false);
          setKacunaSpeaking(true);
        };
        utter.onend = () => setKacunaSpeaking(false);
        utter.onerror = () => setKacunaSpeaking(false);
        window.speechSynthesis.speak(utter);
      } catch {
        setKacunaSpeaking(false);
      }
    };

    const audio = new Audio(primarySrc);
    audio.preload = 'auto';
    kacunaAudioRef.current = audio;

    let triedApiFallback = false;
    const triggerNextFallback = () => {
      if (!triedApiFallback && primarySrc !== fallbackApiSrc) {
        triedApiFallback = true;
        audio.src = fallbackApiSrc;
        audio.play().catch(() => {
          playWithBrowserSpeechFallback(spokenPhrase);
        });
      } else {
        playWithBrowserSpeechFallback(spokenPhrase);
      }
    };

    audio.onplay = () => {
      pendingAutoSpeakRef.current = null;
      setKacunaStopped(false);
      setKacunaSpeaking(true);
    };
    audio.onended = () => {
      setKacunaSpeaking(false);
    };
    audio.onpause = () => {
      if (audio.ended || audio.currentTime === 0) {
        setKacunaSpeaking(false);
      }
    };
    audio.onerror = () => {
      triggerNextFallback();
    };

    audio.play().catch((err) => {
      // If browser blocked un-interacted autoplay, queue for the very first touch/click anywhere
      if (err && (err.name === 'NotAllowedError' || String(err).includes('NotAllowedError'))) {
        pendingAutoSpeakRef.current = options;
        setKacunaSpeaking(false);
      } else {
        triggerNextFallback();
      }
    });
  };

  // Unlock pending Kacuna greeting on user's very first pointer/touch interaction if autoplay was deferred
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlockAudioOnFirstGesture = (e: Event) => {
      if (!pendingAutoSpeakRef.current || kacunaStopped) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-kacuna-mute="true"]')) return;
      const pending = pendingAutoSpeakRef.current;
      pendingAutoSpeakRef.current = null;
      speakKacunaVoice(pending);
    };
    window.addEventListener('pointerdown', unlockAudioOnFirstGesture, { passive: true });
    window.addEventListener('keydown', unlockAudioOnFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudioOnFirstGesture);
      window.removeEventListener('keydown', unlockAudioOnFirstGesture);
    };
  }, [kacunaStopped, greetingInfo]);

  // Automatically greet with Kacuna's voice ONLY ONCE on the 3D Orbs screen ("საკმარისია ერთხელ")
  useEffect(() => {
    if (isGlobeOpen && !kacunaStopped) {
      if (!hasKacunaGreetedOnceGlobal && !hasAutoGreetedGlobeRef.current) {
        hasKacunaGreetedOnceGlobal = true;
        hasAutoGreetedGlobeRef.current = true;
        speakKacunaVoice({
          preset: greetingInfo.presetAudio,
          text: greetingInfo.spokenTextKa,
        });
      }
    }
  }, [isGlobeOpen, kacunaStopped, greetingInfo]);

  // If 5 seconds pass on the Orbs screen without any touch/click on the screen,
  // Kacuna reminds: "დაადე თითი ეკრანს და დალაგდება ბურთულები"
  useEffect(() => {
    if (!isGlobeOpen || isSymmetricRingMode) {
      if (touchReminderTimerRef.current) {
        window.clearTimeout(touchReminderTimerRef.current);
        touchReminderTimerRef.current = null;
      }
      return;
    }

    hasTouchedGlobeScreenRef.current = false;
    setShowTouchScreenReminder(false);

    if (touchReminderTimerRef.current) {
      window.clearTimeout(touchReminderTimerRef.current);
    }

    touchReminderTimerRef.current = window.setTimeout(() => {
      if (hasTouchedGlobeScreenRef.current || isSymmetricRingMode) return;
      const reminderText = 'დაადე თითი ეკრანს და დალაგდება ბურთულები';
      setShowTouchScreenReminder(true);
      setKacunaMessage(`👆 ${reminderText}`);

      if (!kacunaStopped) {
        const activeAudio = kacunaAudioRef.current;
        if (activeAudio && !activeAudio.paused && !activeAudio.ended) {
          const prevEnded = activeAudio.onended;
          activeAudio.onended = (ev) => {
            if (prevEnded) prevEnded.call(activeAudio, ev);
            if (!hasTouchedGlobeScreenRef.current) {
              speakKacunaVoice({ text: reminderText });
            }
          };
        } else {
          speakKacunaVoice({ text: reminderText });
        }
      }
    }, 5000);

    return () => {
      if (touchReminderTimerRef.current) {
        window.clearTimeout(touchReminderTimerRef.current);
        touchReminderTimerRef.current = null;
      }
    };
  }, [isGlobeOpen, isSymmetricRingMode, kacunaStopped]);

  // Pre-generate 120 spiral galaxy stars for smooth rendering
  const galaxyStars = useMemo(() => {
    const arr: {
      armAngle: number;
      distRatio: number;
      size: number;
      color: string;
      twinkleSpeed: number;
      phase: number;
    }[] = [];
    const palette = ['#FFFBEB', '#FDE68A', '#93C5FD', '#C4B5FD', '#F59E0B', '#E0F2FE'];
    for (let i = 0; i < 120; i++) {
      const arm = i % 3;
      const distRatio = Math.pow((i + 1) / 120, 0.72);
      const armAngle =
        (arm * (Math.PI * 2)) / 3 + distRatio * 4.2 + (Math.sin(i * 12.9898) * 0.45);
      arr.push({
        armAngle,
        distRatio,
        size: 0.8 + (i % 4) * 0.65,
        color: palette[i % palette.length],
        twinkleSpeed: 1.5 + (i % 5) * 0.6,
        phase: i * 0.7,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    setKacunaMessage(
      `${greetingInfo.greetingKa} (${greetingInfo.greetingHe}) რას ვსწავლობთ ახლა? მითხარით ან შეეხეთ 3D შუშის ბურთულას.`
    );
  }, [greetingInfo]);

  // Stop AI character immediately when tapped or told "არაფერი"
  const handleStopKacuna = () => {
    pendingAutoSpeakRef.current = null;
    setKacunaSpeaking(false);
    setKacunaStopped(true);
    setIsListeningVoice(false);
    setKacunaExpanded(false);
    try {
      if (kacunaAudioRef.current) {
        kacunaAudioRef.current.pause();
        kacunaAudioRef.current.currentTime = 0;
        kacunaAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch {
      // ignore
    }
    setKacunaMessage('გავჩერდი!');
  };

  // Detect if user text also matches a known realm or tractate shortcut
  const detectDirectNavShortcut = (rawText: string): KacunaDirectNavShortcut | undefined => {
    const text = rawText.trim().toLowerCase();
    if (!text) return undefined;
    if (text.includes('თორა') || text.includes('ხუმაშ') || text.includes('ბერეშით') || text.includes('torah')) {
      return { labelKa: 'თორა • ბერეშითი 1', realmId: 'torah', bookId: 'Genesis', chapter: 1 };
    }
    if (text.includes('ნევიიმ') || text.includes('წინასწარმეტყველ') || text.includes('იეშაია') || text.includes('neviim')) {
      return { labelKa: 'ნევიიმი • იეჰოშუა 1', realmId: 'neviim', bookId: 'Joshua', chapter: 1 };
    }
    if (text.includes('ქეთუვიმ') || text.includes('თეჰილიმ') || text.includes('ფსალმუნ') || text.includes('მიშლე')) {
      return { labelKa: 'ქეთუვიმი • თეჰილიმ 1', realmId: 'ketuvim', bookId: 'Psalms', chapter: 1 };
    }
    if (text.includes('რამბამ') || text.includes('მიშნე თორა') || text.includes('ნოსე ქელიმ')) {
      return {
        labelKa: 'რამბამი • იესოდეი ჰათორა 1',
        realmId: 'rambam',
        bookId: 'Mishneh_Torah,_Foundations_of_the_Torah',
        chapter: 1,
      };
    }
    if (text.includes('ტურ') || text.includes('ბეთ იოსეფ')) {
      return { labelKa: 'არბაა ტურიმი • ორახ ხაიმ 1', realmId: 'tur', bookId: 'Tur,_Orach_Chaim', chapter: 1 };
    }
    if (text.includes('მიშნა ბრურა') || text.includes('მიშნა ბერურა') || text.includes('ხაფეც ხაიმ')) {
      return { labelKa: 'მიშნა ბრურა • სიმანი 1', realmId: 'mishnah-berurah', bookId: 'Mishnah_Berurah_1', chapter: 1 };
    }
    if (text.includes('სეფარად') || text.includes('ყოვადია') || text.includes('ბენ იშ ხაი') || text.includes('ქაფ ჰახაიმ') || text.includes('იალკუტ')) {
      return { labelKa: 'სფარდული ჰალახა • იალკუტ იოსეფი 1', realmId: 'sephardic-halakha', bookId: 'Yalkut_Yosef_OC', chapter: 1 };
    }
    if (text.includes('შულხან') || text.includes('ყარუხ') || text.includes('არუხ')) {
      return {
        labelKa: 'შულხან ყარუხი • ორახ ხაიმ 1',
        realmId: 'shulchan-aruch',
        bookId: 'Shulchan_Arukh,_Orach_Chayim',
        chapter: 1,
      };
    }
    if (text.includes('კურთხევ') || text.includes('ბრახოთ') || text.includes('ბირქათ') || text.includes('ჰამოცი')) {
      return { labelKa: 'ყოველდღიური კურთხევები', realmId: 'blessings' };
    }
    if (text.includes('კალენდარ') || text.includes('ცადიკ') || text.includes('ჰილულა') || text.includes('დღესასწაულ')) {
      return { labelKa: 'ებრაული კალენდარი', realmId: 'calendar' };
    }
    if (text.includes('ხანუქ') || text.includes('חנוכ')) {
      return { labelKa: 'თალმუდი • შაბათი 21b (ხანუქა)', realmId: 'talmud', tractateId: 'Shabbat', dafId: '21b' };
    }
    if (text.includes('თაანით') || text.includes('წვიმ')) {
      return { labelKa: 'თალმუდი • თაანითი 2a', realmId: 'talmud', tractateId: 'Taanit', dafId: '2a' };
    }
    if (text.includes('შაბათ')) {
      return { labelKa: 'თალმუდი • შაბათი 2a', realmId: 'talmud', tractateId: 'Shabbat', dafId: '2a' };
    }
    if (text.includes('თალმუდ') || text.includes('გემარა') || text.includes('ბერახოთ')) {
      return { labelKa: 'თალმუდი • ბერახოთი 2a', realmId: 'talmud', tractateId: 'Berakhot', dafId: '2a' };
    }
    return undefined;
  };

  const handleExecuteShortcut = (shortcut: KacunaDirectNavShortcut) => {
    onSelectRealm(
      shortcut.realmId,
      shortcut.bookId,
      shortcut.chapter,
      shortcut.tractateId,
      shortcut.dafId
    );
    onCloseGlobe();
  };

  const handleSelectGeminiSource = (src: KacunaGeminiSource) => {
    const cleanRealm = (String(src.realmId || 'talmud').replace(/_/g, '-') as SacredRealmId);
    onSelectRealm(
      cleanRealm,
      src.bookId,
      src.chapter,
      src.tractateId || 'Berakhot',
      src.dafId || '2a'
    );
    onCloseGlobe();
  };

  // Search Gemini via Smart Kacuna and present structured, organized results
  const handleAskKacunaGemini = async (rawQuery: string) => {
    const cleanQ = rawQuery.trim();
    if (!cleanQ) return;

    setKacunaStopped(false);
    setKacunaExpanded(true);
    setKacunaSearchLoading(true);
    setKacunaMessage(`🔍 ვეძებ Gemini-ში: „${cleanQ}“ — ვამზადებ დალაგებულ პასუხსა და წყაროებს...`);

    const shortcut = detectDirectNavShortcut(cleanQ);

    try {
      const res = await fetch(getBackendUrl('/api/talmud/ask-gemini'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQ,
          scope: 'all',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mappedSources: KacunaGeminiSource[] = Array.isArray(data.sources)
          ? data.sources.map((s: any) => ({
              realmId: (String(s.realmId || 'talmud').replace(/_/g, '-') as SacredRealmId),
              bookId: s.bookId,
              chapter: typeof s.chapter === 'number' ? s.chapter : Number(s.chapter) || 1,
              tractateId: s.tractateId || 'Berakhot',
              dafId: s.dafId || '2a',
              section: s.section || 'daf-section-gemara',
              labelKa:
                s.labelKa ||
                s.titleKa ||
                `${s.tractateId || s.bookId || 'წყარო'} ${s.dafId || s.chapter || ''}`,
              labelHe: s.labelHe || s.titleHe || '',
              quoteHe: s.quoteHe || s.quotedSnippetHe || '',
              explanationKa: s.explanationKa || '',
            }))
          : [];

        const keyPts: string[] =
          Array.isArray(data.keyPointsKa) && data.keyPointsKa.length > 0
            ? data.keyPointsKa
            : mappedSources.map((s) => `${s.labelKa}: ${s.explanationKa}`).filter(Boolean);

        const builtResult: KacunaGeminiSearchResult = {
          question: cleanQ,
          answerKa:
            data.answerKa ||
            `თქვენს შეკითხვაზე („${cleanQ}“) მოძიებულია წყაროები თორაში, თალმუდსა და ჰალახის კოდექსებში.`,
          summaryHe: data.summaryHe || '',
          keyPointsKa: keyPts,
          halachaTakeawayKa:
            data.halachaTakeawayKa ||
            'დააჭირეთ ქვემოთ მოცემულ ნებისმიერ წყაროს ზუსტ დაფზე ან თავზე გადასასვლელად.',
          sources: mappedSources,
          webSources: Array.isArray(data.webSources) ? data.webSources : [],
          directNavShortcut: shortcut,
        };

        setKacunaSearchResult(builtResult);
        setKacunaSearchLoading(false);
        setKacunaMessage('✨ Gemini-ში მოვძებნე! ქვემოთ იხილეთ დალაგებული პასუხი და წყაროები:');
        speakKacunaVoice({
          text: builtResult.answerKa.slice(0, 200),
        });
        return;
      }
    } catch {
      // Fallback below
    }

    const fallbackResult: KacunaGeminiSearchResult = {
      question: cleanQ,
      answerKa: `თქვენს შეკითხვაზე („${cleanQ}“) გლობალური წმინდა ბიბლიოთეკის (თორა, თანახი, მიშნა, თალმუდ ბავლი და ჰალახა) მიხედვით მოძიებულია ფუნდამენტური წყაროები.`,
      summaryHe: 'תשובה הלכתית ועיונית מתוך מקורות התורה, המשנה, הש״ס והפוסקים.',
      keyPointsKa: [
        'წერილობითი და ზეპირი თორის წყაროების შეჯერება რაშისა და თოსაფოთის განმარტებებით.',
        'პრაქტიკული ჰალახური დასკვნა რამბამისა და შულხან ყარუხის მიხედვით.',
      ],
      halachaTakeawayKa: 'დააჭირეთ ქვემოთ მოცემულ წყაროს შესაბამის დაფზე გადასასვლელად.',
      sources: [
        {
          realmId: 'talmud',
          tractateId: 'Berakhot',
          dafId: '2a',
          section: 'daf-section-mishnah',
          labelKa: 'თალმუდი • ბერახოთი 2a (კრიათ შმა)',
          labelHe: 'ברכות דף ב׳ ע״א',
          quoteHe: 'מאימתי קורין את שמע בערבין',
          explanationKa: 'შასის პირველი სუგია კრიათ შმასა და ლოცვის დროების შესახებ.',
        },
      ],
      webSources: [],
      directNavShortcut: shortcut,
    };

    setKacunaSearchResult(fallbackResult);
    setKacunaSearchLoading(false);
    setKacunaMessage('✨ შედეგები დალაგებულია ქვემოთ:');
  };

  // Parse user spoken/typed answer: stop on "არაფერი", navigate on explicit "გადადი ...", or search in Gemini!
  const handleProcessUserAnswer = (rawText: string) => {
    const trimmed = rawText.trim();
    const text = trimmed.toLowerCase();
    if (!text) return;

    if (
      text.includes('არაფერი') ||
      text.includes('გაჩერდი') ||
      text.includes('სტოპ') ||
      text === 'nothing' ||
      text === 'stop'
    ) {
      handleStopKacuna();
      onCloseGlobe();
      return;
    }

    const shortcut = detectDirectNavShortcut(trimmed);
    const isExplicitJumpCommand =
      text.startsWith('გადადი ') ||
      text.startsWith('გახსენი ') ||
      text.startsWith('ჩართე ');

    if (isExplicitJumpCommand && shortcut) {
      handleExecuteShortcut(shortcut);
      return;
    }

    // For all questions and search queries, use Gemini Search and show structured results nicely!
    void handleAskKacunaGemini(trimmed);
  };

  const handleToggleVoiceListening = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRec =
      (window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
          onerror: () => void;
          onend: () => void;
        };
      }).SpeechRecognition ||
      (window as unknown as {
        webkitSpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
          onerror: () => void;
          onend: () => void;
        };
      }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setKacunaExpanded(true);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'ka-GE';
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setUserCommandInput(transcript);
          handleProcessUserAnswer(transcript);
        }
      };
      rec.onerror = () => setIsListeningVoice(false);
      rec.onend = () => setIsListeningVoice(false);
      recognitionRef.current = rec;
      setIsListeningVoice(true);
      rec.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Auto-rotate the 3D Galactic Globe & Orbiting Glass Spheres when NOT touched (throttled to ~30fps to keep main thread light)
  useEffect(() => {
    if (!isGlobeOpen || isUserTouchingGlobe) return;
    let animId = 0;
    let lastTick = performance.now();
    const step = (now: number) => {
      if (now - lastTick >= 32) {
        lastTick = now;
        setRotYaw((prev) => prev + 0.0085);
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isGlobeOpen, isUserTouchingGlobe]);

  // Draw Real Spiral Galaxy + Large Central 3D Globe + Orbital Rings on Fullscreen Canvas
  useEffect(() => {
    if (!isGlobeOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Lift the entire galaxy slightly upward so it sits midway between the top header panel and the bottom Kacuna section!
    const galaxyCenterOffsetY = -Math.round(Math.min(54, h * 0.068));
    const cx = w / 2;
    const cy = h / 2 + galaxyCenterOffsetY;
    const minDim = Math.min(w, h);
    const globeRadius = isSymmetricRingMode ? minDim * 0.26 : minDim * 0.286;
    const galaxyMaxR = Math.max(w, h) * 0.66;

    ctx.clearRect(0, 0, w, h);

    // 1. Deep Cosmic Spiral Galaxy Nebula Glow
    const bgNebula = ctx.createRadialGradient(cx, cy, globeRadius * 0.15, cx, cy, galaxyMaxR);
    bgNebula.addColorStop(0, 'rgba(245, 158, 11, 0.34)');
    bgNebula.addColorStop(0.28, 'rgba(59, 130, 246, 0.22)');
    bgNebula.addColorStop(0.58, 'rgba(139, 92, 246, 0.14)');
    bgNebula.addColorStop(0.85, 'rgba(15, 23, 42, 0.06)');
    bgNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgNebula;
    ctx.fillRect(0, 0, w, h);

    // 2. Rotating Spiral Galaxy Starfield & Dust Lanes
    galaxyStars.forEach((star) => {
      const a = star.armAngle + rotYaw * 0.55;
      const r = star.distRatio * galaxyMaxR;
      const sx = cx + Math.cos(a) * r;
      const sy = cy + Math.sin(a) * r * (0.62 + 0.18 * Math.sin(rotPitch));
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(rotYaw * star.twinkleSpeed + star.phase));

      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = twinkle;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 3. Luminous 3D Orbital Glass Tracks or Symmetrical Crown Halo around the Central Globe
    if (isSymmetricRingMode) {
      const sphereD = Math.max(78, Math.min(142, Math.round(minDim * 0.218)));
      const symRingR = Math.round(sphereD * 1.56);

      // Symmetrical Sacred Geometry Radial Rays from Central Globe to each Sphere
      ctx.save();
      for (let i = 0; i < activeOrbsList.length; i++) {
        const ang = (i / activeOrbsList.length) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * (globeRadius * 0.92), cy + Math.sin(ang) * (globeRadius * 0.92));
        ctx.lineTo(cx + Math.cos(ang) * symRingR, cy + Math.sin(ang) * symRingR);
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.34)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Glowing Golden Symmetrical Halo Track connecting the interlocking spheres
      ctx.beginPath();
      ctx.arc(cx, cy, symRingR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.18);
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        minDim * 0.432,
        minDim * 0.432 * Math.max(0.32, Math.cos(rotPitch * 0.8)),
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Central 3D Translucent Glass & Gold Globe Body
    const sphereGrad = ctx.createRadialGradient(
      cx - globeRadius * 0.32,
      cy - globeRadius * 0.32,
      globeRadius * 0.06,
      cx,
      cy,
      globeRadius
    );
    sphereGrad.addColorStop(0, '#4A2E1B');
    sphereGrad.addColorStop(0.38, '#1E1B4B');
    sphereGrad.addColorStop(0.75, '#0F172A');
    sphereGrad.addColorStop(1, '#D97706');

    ctx.beginPath();
    ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.7)';
    ctx.stroke();

    // 5. 3D Latitude & Longitude Meridians on Central Globe
    const projectGlobe = (latDeg: number, lonDeg: number) => {
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180 + rotYaw;
      const x0 = Math.cos(lat) * Math.sin(lon);
      const y0 = Math.sin(lat);
      const z0 = Math.cos(lat) * Math.cos(lon);
      const y1 = y0 * Math.cos(rotPitch) - z0 * Math.sin(rotPitch);
      const z1 = y0 * Math.sin(rotPitch) + z0 * Math.cos(rotPitch);
      return {
        x: cx + x0 * globeRadius,
        y: cy - y1 * globeRadius,
        z: z1,
      };
    };

    ctx.lineWidth = 0.85;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';

    for (let lonDeg = 0; lonDeg < 360; lonDeg += 30) {
      ctx.beginPath();
      let started = false;
      for (let latDeg = -80; latDeg <= 80; latDeg += 8) {
        const pt = projectGlobe(latDeg, lonDeg);
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

    for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
      ctx.beginPath();
      let started = false;
      for (let lonDeg = 0; lonDeg <= 360; lonDeg += 8) {
        const pt = projectGlobe(latDeg, lonDeg);
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

    // 6. Realistic World Continents Layout on Central Globe (Keeping exact same colors & design!)
    REAL_WORLD_CONTINENTS.forEach((cont) => {
      ctx.save();
      ctx.beginPath();
      let visibleCount = 0;
      let sumZ = 0;
      let started = false;

      for (let i = 0; i < cont.coords.length; i++) {
        const [latDeg, lonDeg] = cont.coords[i];
        const pt = projectGlobe(latDeg, lonDeg);
        if (pt.z > -0.05) {
          const distFromCenter = Math.hypot(pt.x - cx, pt.y - cy);
          let rx = pt.x;
          let ry = pt.y;
          if (distFromCenter > globeRadius * 0.985) {
            const ang = Math.atan2(pt.y - cy, pt.x - cx);
            rx = cx + Math.cos(ang) * globeRadius * 0.985;
            ry = cy + Math.sin(ang) * globeRadius * 0.985;
          }
          if (!started) {
            ctx.moveTo(rx, ry);
            started = true;
          } else {
            ctx.lineTo(rx, ry);
          }
          if (pt.z > 0) {
            visibleCount++;
            sumZ += pt.z;
          }
        } else {
          started = false;
        }
      }

      if (visibleCount >= 2) {
        const avgZ = sumZ / visibleCount;
        const alpha = Math.max(0.24, Math.min(0.88, avgZ * 0.95));
        ctx.closePath();
        ctx.fillStyle = `rgba(245, 158, 11, ${(alpha * 0.36).toFixed(3)})`;
        ctx.fill();
        ctx.lineWidth = 1.35;
        ctx.strokeStyle = `rgba(253, 230, 138, ${(alpha * 0.82).toFixed(3)})`;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Sacred Golden Beacon at Jerusalem / Eretz Yisrael (31.77°N, 35.21°E)
    const jerusalemPt = projectGlobe(31.77, 35.21);
    if (jerusalemPt.z > 0.05) {
      ctx.save();
      const jGlow = ctx.createRadialGradient(
        jerusalemPt.x,
        jerusalemPt.y,
        1,
        jerusalemPt.x,
        jerusalemPt.y,
        globeRadius * 0.14
      );
      jGlow.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
      jGlow.addColorStop(0.4, 'rgba(251, 191, 36, 0.65)');
      jGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.beginPath();
      ctx.arc(jerusalemPt.x, jerusalemPt.y, globeRadius * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = jGlow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(jerusalemPt.x, jerusalemPt.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFBEB';
      ctx.fill();
      ctx.restore();
    }

    // 7. Royal Crystal Golden Crown ("კრისტალური ოქროსფერი სამეფო გვირგვინი") with Magen David atop the Finial!
    // When spheres orbit, it sits atop the Central Globe; when spheres arrange around the Globe (`crownInsideBlend` -> 1),
    // the Crown moves right inside the center of the Globe!
    drawCrystalGoldenCrown(
      ctx,
      cx,
      cy - globeRadius,
      globeRadius,
      rotYaw,
      rotPitch,
      crownInsideBlend
    );

    // 7.5. Glass Specular Highlight Arc on Central Globe (drawn after the Crown so when the Crown is inside the Globe,
    // the translucent glass globe surface shimmers over it!)
    const glossGrad = ctx.createRadialGradient(
      cx - globeRadius * 0.38,
      cy - globeRadius * 0.38,
      globeRadius * 0.02,
      cx - globeRadius * 0.25,
      cy - globeRadius * 0.25,
      globeRadius * 0.55
    );
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.44)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
    ctx.fillStyle = glossGrad;
    ctx.fill();

    // 8. Celestial Particle Tail Effect following the spheres as they travel to their new positions
    const nowPerf = performance.now();
    const isBoostActive = nowPerf < tailBoostUntilRef.current;
    const totalSpheres = activeOrbsList.length;
    const sphereD = Math.max(78, Math.min(142, Math.round(minDim * 0.218)));
    const baseSymR = Math.round(sphereD * 1.56);
    const curSymR = isTapBloomActive ? Math.round(baseSymR * 1.08) : baseSymR;
    const orbRX = Math.min(w * 0.385, minDim * 0.432);
    const orbRY = Math.min(h * 0.36, minDim * 0.398);

    activeOrbsList.forEach((realm, idx) => {
      const baseAngle = (idx / totalSpheres) * Math.PI * 2 + rotYaw;
      const latWave = Math.sin((idx / totalSpheres) * Math.PI * 4) * 0.34;
      const x0 = Math.sin(baseAngle) * Math.cos(latWave);
      const y0 = Math.sin(latWave);
      const z0 = Math.cos(baseAngle) * Math.cos(latWave);
      const y1 = y0 * Math.cos(rotPitch) - z0 * Math.sin(rotPitch);

      const symAng = (((idx + ringStep) % totalSpheres) / totalSpheres) * Math.PI * 2 - Math.PI / 2;
      const tx = cx + (isSymmetricRingMode ? Math.cos(symAng) * curSymR : x0 * orbRX);
      const ty = cy + (isSymmetricRingMode ? Math.sin(symAng) * curSymR : -y1 * orbRY);

      const prevPos = sphereInterpolatedPosRef.current[idx];
      if (!prevPos) {
        sphereInterpolatedPosRef.current[idx] = { x: tx, y: ty };
      } else {
        const dx = tx - prevPos.x;
        const dy = ty - prevPos.y;
        const speed = Math.hypot(dx, dy);
        // Smooth interpolation matching the spring travel path
        const lerpFactor = isBoostActive ? 0.16 : 0.35;
        const nextX = prevPos.x + dx * lerpFactor;
        const nextY = prevPos.y + dy * lerpFactor;

        if (isBoostActive || speed > 1.4) {
          const spawnCount = isBoostActive ? 3 : 1;
          for (let s = 0; s < spawnCount; s++) {
            const frac = s / spawnCount;
            const px = prevPos.x + (nextX - prevPos.x) * frac + (Math.random() - 0.5) * 8;
            const py = prevPos.y + (nextY - prevPos.y) * frac + (Math.random() - 0.5) * 8;
            celestialParticlesRef.current.push({
              x: px,
              y: py,
              vx: -(dx * 0.03) + (Math.random() - 0.5) * 0.6,
              vy: -(dy * 0.03) + (Math.random() - 0.5) * 0.6,
              size: isBoostActive ? 2.2 + Math.random() * 2.6 : 1.4 + Math.random() * 1.4,
              alpha: isBoostActive ? 0.92 : 0.48,
              decay: isBoostActive ? 0.022 : 0.04,
              color: s % 2 === 0 ? '#FDE68A' : realm.accentColor,
            });
          }
        }
        sphereInterpolatedPosRef.current[idx] = { x: nextX, y: nextY };
      }
    });

    if (celestialParticlesRef.current.length > 72) {
      celestialParticlesRef.current.splice(0, celestialParticlesRef.current.length - 72);
    }

    ctx.save();
    for (let i = celestialParticlesRef.current.length - 1; i >= 0; i--) {
      const p = celestialParticlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0.02) {
        celestialParticlesRef.current.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    }
    ctx.restore();
  }, [
    isGlobeOpen,
    rotYaw,
    rotPitch,
    galaxyStars,
    isSymmetricRingMode,
    ringStep,
    isTapBloomActive,
    activeOrbsList,
    crownInsideBlend,
  ]);

  // Compute 3D Orbiting Crystal Spheres positions around the central Globe
  const orbitingGlassSpheres = useMemo(() => {
    const total = activeOrbsList.length;
    return activeOrbsList.map((orb, idx) => {
      // Distribute evenly around a 3D orbital ring + subtle latitude wave
      const baseAngle = (idx / total) * Math.PI * 2 + rotYaw;
      const latWave = Math.sin((idx / total) * Math.PI * 4) * 0.34;

      const x0 = Math.sin(baseAngle) * Math.cos(latWave);
      const y0 = Math.sin(latWave);
      const z0 = Math.cos(baseAngle) * Math.cos(latWave);

      const y1 = y0 * Math.cos(rotPitch) - z0 * Math.sin(rotPitch);
      const z1 = y0 * Math.sin(rotPitch) + z0 * Math.cos(rotPitch);

      return {
        orb,
        idx,
        nx: x0,
        ny: -y1,
        nz: z1,
      };
    });
  }, [rotYaw, rotPitch, activeOrbsList]);

  return (
    <AnimatePresence mode="wait">
      {isGlobeOpen ? (
          <motion.div
            id="galactic-globe-portal"
            ref={portalRootRef}
            key="galactic-globe-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            className="fixed inset-0 z-[500] bg-[#040308] text-[#FAF5EB] overflow-hidden flex flex-col justify-between select-none"
          >
            {/* Deep Galaxy Backdrop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,#171126_0%,#090612_58%,#030206_100%)]"
            />

            {/* ULTRA-COMPACT TOP HEADER BAR (Translucent 3D Glass Globe Icon + Translucent "დაფაზე შესვლა" Button) */}
            <div className="relative z-30 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 bg-black/30 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  style={{
                    background:
                      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.45) 0%, rgba(217,119,6,0.34) 38%, rgba(15,23,42,0.78) 78%, rgba(3,7,18,0.92) 100%)',
                    perspective: '300px',
                  }}
                  className="relative w-8 h-8 rounded-full border border-amber-200/60 text-amber-200 flex items-center justify-center backdrop-blur-xl shadow-[0_6px_18px_rgba(0,0,0,0.8),0_0_14px_rgba(251,191,36,0.28),inset_0_1.5px_4px_rgba(255,255,255,0.72)] shrink-0 overflow-hidden"
                >
                  <AxialRotatingSphereCanvas accentColor="#F59E0B" idx={0} />
                  <span className="pointer-events-none absolute top-1 left-1.5 w-2.5 h-1 rounded-full bg-white/70 blur-[0.3px] -rotate-12 z-20" />
                  <motion.span
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Globe className="w-4 h-4 text-amber-200 drop-shadow" />
                  </motion.span>
                </div>
                <h2 className="hidden md:inline text-xs sm:text-sm font-black tracking-tight text-[#FAF5EB] truncate">
                  გალაქტიკური პორტალი • <span dir="rtl" className="font-serif text-amber-300">כתר תורה ומגן דוד</span>
                </h2>
              </div>

              {/* Top right translucent crystal action buttons */}
              <div data-globe-control="true" className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-raw-btn="true"
                  data-globe-control="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOrbsModalOpen(true);
                  }}
                  style={{
                    background:
                      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.75) 0%, rgba(253,230,138,0.45) 45%, rgba(217,119,6,0.35) 100%)',
                  }}
                  title="ბურთულების / შორთქათების დამატება-გამოკლება (ან ორჯერ დააწკაპუნეთ გლობუსზე)"
                  className="relative h-8 px-2.5 sm:px-3 rounded-full border border-white/80 text-amber-100 font-black text-[10px] sm:text-[11px] flex items-center gap-1 backdrop-blur-xl shadow-[0_6px_18px_rgba(0,0,0,0.65),0_0_14px_rgba(251,191,36,0.35),inset_0_1.5px_4px_rgba(255,255,255,0.85)] hover:border-amber-200 transition-all cursor-pointer overflow-hidden"
                >
                  <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>ბურთულები ({activeOrbsList.length}/{MAX_ACTIVE_GLOBE_ORBS})</span>
                </button>

                <a
                  href="/export/Talmud-Bavli-3D.apk"
                  download="Talmud-Bavli-3D.apk"
                  data-globe-control="true"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background:
                      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.34) 0%, rgba(217,119,6,0.26) 38%, rgba(15,23,42,0.75) 78%, rgba(3,7,18,0.9) 100%)',
                  }}
                  title="Android APK ფაილის ჩამოტვირთვა (Export APK)"
                  className="relative h-8 px-2.5 sm:px-3 rounded-full border border-amber-200/55 text-amber-100 font-black text-[10px] sm:text-[11px] flex items-center gap-1 backdrop-blur-xl shadow-[0_8px_22px_rgba(0,0,0,0.78),0_0_14px_rgba(251,191,36,0.22),inset_0_1.5px_4px_rgba(255,255,255,0.65)] hover:border-amber-200 transition-all cursor-pointer overflow-hidden"
                >
                  <Download className="w-3 h-3 text-amber-200 shrink-0" />
                  <span className="hidden xs:inline">APK</span>
                </a>

                <button
                  type="button"
                  data-raw-btn="true"
                  data-globe-control="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseGlobe();
                  }}
                  style={{
                    background:
                      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.42) 0%, rgba(217,119,6,0.34) 38%, rgba(15,23,42,0.78) 78%, rgba(3,7,18,0.92) 100%)',
                  }}
                  className="relative h-8 px-3 sm:px-3.5 rounded-full border border-amber-200/65 text-[#FAF5EB] font-black text-[10.5px] sm:text-xs flex items-center gap-1.5 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.82),0_0_18px_rgba(251,191,36,0.28),inset_0_1.5px_4px_rgba(255,255,255,0.72)] cursor-pointer hover:border-white active:scale-95 transition-all overflow-hidden"
                >
                  <span className="pointer-events-none absolute top-1 left-2.5 w-5 h-1.5 rounded-full bg-white/55 blur-[0.5px] -rotate-6" />
                  <span className="text-amber-100 drop-shadow">დაფაზე შესვლა</span>
                  <X className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                </button>
              </div>
            </div>

            {/* FULL-VIEWPORT GALAXY + CENTRAL 3D GLOBE + ORBITING / SYMMETRICAL 3D CRYSTAL SPHERES */}
            <div
              ref={stageRef}
              onDoubleClick={(e) => {
                const target = e.target as HTMLElement | null;
                if (
                  target?.closest('[data-globe-sphere="true"]') ||
                  target?.closest('[data-globe-control="true"]')
                ) {
                  return;
                }
                e.stopPropagation();
                setIsOrbsModalOpen(true);
              }}
              onPointerDown={(e) => {
                // Support double-tap on touch screens to open the Crystal Orbs Manager Modal
                const target = e.target as HTMLElement | null;
                if (
                  !target?.closest('[data-globe-sphere="true"]') &&
                  !target?.closest('[data-globe-control="true"]')
                ) {
                  const now = performance.now();
                  if (now - lastGlobeTapTimeRef.current < 310) {
                    setIsOrbsModalOpen(true);
                    lastGlobeTapTimeRef.current = 0;
                    return;
                  }
                  lastGlobeTapTimeRef.current = now;
                }
                wasDraggedRef.current = false;
                dragStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  yaw: rotYaw,
                  pitch: rotPitch,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                if (!dragStartRef.current) return;
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 8) {
                  dragStartRef.current.moved = true;
                  wasDraggedRef.current = true;
                  setIsUserTouchingGlobe(true);
                  setRotYaw(dragStartRef.current.yaw + dx * 0.0075);
                  setRotPitch(
                    Math.max(
                      -1.05,
                      Math.min(1.05, dragStartRef.current.pitch + dy * 0.0065)
                    )
                  );
                }
              }}
              onPointerUp={() => {
                dragStartRef.current = null;
                setIsUserTouchingGlobe(false);
              }}
              onPointerCancel={() => {
                dragStartRef.current = null;
                setIsUserTouchingGlobe(false);
              }}
              className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-pointer active:cursor-grabbing touch-none"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Expanding Golden Halo Ripple when user taps outside the spheres (centered at lifted galaxy position) */}
              <AnimatePresence>
                {tapRippleKey > 0 && (
                  <motion.div
                    key={`tap-ripple-${tapRippleKey}`}
                    initial={{ scale: 0.42, opacity: 0.85 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      width: `${Math.round(Math.min(stageSize.width, stageSize.height) * 0.56)}px`,
                      height: `${Math.round(Math.min(stageSize.width, stageSize.height) * 0.56)}px`,
                      marginTop: `${-Math.round(Math.min(52, stageSize.height * 0.068)) * 2}px`,
                    }}
                    className="pointer-events-none absolute rounded-full border-2 border-amber-300/80 shadow-[0_0_45px_rgba(251,191,36,0.65)]"
                  />
                )}
              </AnimatePresence>

              {/* Large 3D Orbiting & Symmetrical Ring Crystal Transparent Spheres Container */}
              <div className="relative w-full h-full pointer-events-none flex items-center justify-center">
                {orbitingGlassSpheres.map(({ orb, idx, nx, ny, nz }) => {
                  const total = activeOrbsList.length;
                  const minDim = Math.max(280, Math.min(stageSize.width, stageSize.height));
                  // Vertical offset lifting the entire galaxy midway between the top panel and bottom Kacuna section
                  const galaxyCenterOffsetY = -Math.round(
                    Math.min(54, stageSize.height * 0.068)
                  );
                  const sphereDiameter = Math.max(
                    78,
                    Math.min(142, Math.round(minDim * 0.218))
                  );
                  const baseSymRingRadius = Math.round(sphereDiameter * 1.56);
                  const symRingRadius = isTapBloomActive
                    ? Math.round(baseSymRingRadius * 1.08)
                    : baseSymRingRadius;

                  const symAngle =
                    (((idx + ringStep) % total) / total) * Math.PI * 2 - Math.PI / 2;

                  const orbitRadiusX = Math.min(stageSize.width * 0.385, minDim * 0.432);
                  const orbitRadiusY = Math.min(stageSize.height * 0.36, minDim * 0.398);

                  const chainTargetX = isSymmetricRingMode
                    ? Math.cos(symAngle) * symRingRadius
                    : nx * orbitRadiusX;
                  const chainTargetY =
                    (isSymmetricRingMode
                      ? Math.sin(symAngle) * symRingRadius
                      : ny * orbitRadiusY) + galaxyCenterOffsetY;

                  // Multi-Origin Swaying Ascent Calculation:
                  // Each sphere emerges from one of several distinct origin points (`MULTI_SPAWN_ORIGINS`),
                  // sways left and right (`აქეთ-იქით ქანავით`), and smoothly joins the rotating chain around the globe!
                  const originCluster = MULTI_SPAWN_ORIGINS[idx % MULTI_SPAWN_ORIGINS.length];
                  const staggerDelay = (idx / Math.max(1, total)) * 0.32;
                  const localP = Math.max(
                    0,
                    Math.min(1, (ascendProgress - staggerDelay) / (1 - staggerDelay))
                  );
                  // Smooth cubic ease-out for joining the chain
                  const easeJoin = 1 - Math.pow(1 - localP, 3);
                  // Multi-origin starting coordinates
                  const scatterSpreadX =
                    originCluster.xRatio * stageSize.width +
                    Math.sin(idx * 2.3) * 34;
                  const bottomStartY =
                    originCluster.yRatio * stageSize.height +
                    (idx % 3) * 32 +
                    galaxyCenterOffsetY;
                  // Skyward arc peak before settling into orbital chain
                  const skyArcOffsetY = -Math.sin(localP * Math.PI) * (stageSize.height * 0.14);
                  // Prominent left-right swaying oscillation ("აქეთ-იქით ქანავით") that dampens as it joins the chain
                  const swayAmplitude = (1 - easeJoin) * 76;
                  const swayOffsetX =
                    Math.sin(localP * Math.PI * 4.6 + idx * 1.45) * swayAmplitude;

                  const targetX =
                    ascendProgress < 1
                      ? scatterSpreadX * (1 - easeJoin) + chainTargetX * easeJoin + swayOffsetX
                      : chainTargetX;
                  const targetY =
                    ascendProgress < 1
                      ? bottomStartY * (1 - easeJoin) + chainTargetY * easeJoin + skyArcOffsetY
                      : chainTargetY;

                  const globeRadius = isSymmetricRingMode ? minDim * 0.26 : minDim * 0.286;
                  const targetGlobeScale = (globeRadius * 2) / sphereDiameter;

                  const isSelectedAnimating = burstingOrbState?.orb.id === orb.id;
                  const isAnotherAnimating = burstingOrbState !== null && !isSelectedAnimating;

                  const depthScale = isSymmetricRingMode
                    ? isTapBloomActive
                      ? 1.05
                      : 1
                    : 0.74 + (nz + 1) * 0.21;
                  const rawOpacity = isSymmetricRingMode
                    ? 1
                    : Math.max(0.54, Math.min(1, 0.62 + (nz + 1) * 0.22));
                  const isCurrent = orb.realmId === activeRealm && orb.id === activeRealm;

                  const finalOpacity = isSelectedAnimating
                    ? 0
                    : isAnotherAnimating
                      ? 0.12
                      : ascendProgress < 1
                        ? Math.min(1, localP * 1.8) * rawOpacity
                        : rawOpacity;

                  const finalScale = isAnotherAnimating
                    ? depthScale * 0.72
                    : depthScale * (ascendProgress < 1 ? 0.78 + 0.22 * easeJoin : 1);

                  return (
                    <motion.button
                      key={orb.id}
                      type="button"
                      data-globe-sphere="true"
                      disabled={burstingOrbState !== null}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrbClickWithCinematicBurst(
                          orb,
                          targetX,
                          targetY,
                          depthScale,
                          sphereDiameter,
                          galaxyCenterOffsetY,
                          targetGlobeScale
                        );
                      }}
                      animate={{
                        x: targetX,
                        y: targetY,
                        scale: finalScale,
                        opacity: finalOpacity,
                      }}
                      transition={
                        ascendProgress < 1
                          ? {
                              type: 'tween',
                              duration: 0.04,
                              ease: 'linear',
                            }
                          : isSymmetricRingMode || isReturningToOrbit
                            ? {
                                type: 'spring',
                                stiffness: 112,
                                damping: 15,
                                mass: 0.85,
                                delay: idx * 0.025,
                              }
                            : {
                                type: 'tween',
                                duration: 0.06,
                                ease: 'linear',
                              }
                      }
                      whileHover={{ scale: depthScale * 1.12 }}
                      whileTap={{ scale: depthScale * 0.94 }}
                      style={{
                        width: `${sphereDiameter}px`,
                        height: `${sphereDiameter}px`,
                        left: '50%',
                        top: '50%',
                        marginLeft: `${-sphereDiameter / 2}px`,
                        marginTop: `${-sphereDiameter / 2}px`,
                        zIndex: isSymmetricRingMode
                          ? isCurrent
                            ? 160
                            : 100 + idx
                          : Math.round((nz + 2) * 50),
                        // Delicate Luminous Crystal Spheres with gem reflections & rich crystal transparency
                        background: isCurrent
                          ? `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.72) 0%, rgba(254,240,138,0.42) 24%, ${orb.accentColor}33 58%, ${orb.accentColor}77 100%)`
                          : `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.18) 28%, ${orb.accentColor}25 62%, ${orb.accentColor}66 100%)`,
                        boxShadow: isCurrent
                          ? `0 0 34px ${orb.accentColor}bb, 0 0 16px rgba(255,255,255,0.65), inset 0 3px 8px rgba(255,255,255,0.75), inset 0 -4px 12px ${orb.accentColor}88`
                          : `0 12px 30px rgba(0,0,0,0.55), 0 0 22px ${orb.accentColor}55, inset 0 3px 8px rgba(255,255,255,0.65), inset 0 -3px 10px ${orb.accentColor}66`,
                      }}
                      className={`sphere-orbit-wrapper pointer-events-auto absolute rounded-full border overflow-hidden flex flex-col items-center justify-center px-1.5 py-1.5 text-center backdrop-blur-[6px] cursor-pointer box-border ${
                        isCurrent
                          ? 'border-white/90 ring-2 ring-amber-300/90 text-white'
                          : 'border-white/60 text-white hover:border-white/90'
                      }`}
                    >
                      {/* True 3D Axial Rotating Sphere Mesh (meridians, parallels, continents & equatorial nodes spinning around its own axis!) */}
                      <AxialRotatingSphereCanvas
                        accentColor={orb.accentColor}
                        idx={idx}
                      />

                      {/* 3D Crystal Sphere Specular Glints (Top & Bottom Caustic Rim) */}
                      <span className="pointer-events-none absolute top-1.5 left-3.5 w-6 h-2 rounded-full bg-white/70 blur-[0.4px] -rotate-12 z-20" />
                      <span className="pointer-events-none absolute top-3.5 left-2.5 w-2.5 h-1 rounded-full bg-white/55 blur-[0.2px] -rotate-12 z-20" />
                      <span
                        style={{ backgroundColor: orb.accentColor }}
                        className="pointer-events-none absolute bottom-1.5 right-3.5 w-6 h-1.5 rounded-full opacity-45 blur-[1.5px] z-20"
                      />

                      {/* 3D Double-Sided Axial Spinning Content rotating around the sphere's vertical axis */}
                      <AxialSpinningOrbContent idx={idx}>
                        <span
                          dir="rtl"
                          style={{
                            textShadow:
                              '0 1.5px 3px rgba(0,0,0,0.92), 0 0 8px rgba(0,0,0,0.75)',
                          }}
                          className="relative z-10 font-serif text-[11px] sm:text-sm font-black leading-none mb-0.5 text-amber-100 max-w-[88%] truncate"
                        >
                          {orb.badgeHe}
                        </span>
                        <span
                          style={{
                            textShadow:
                              '0 1.5px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8)',
                          }}
                          className="relative z-10 text-[10.5px] sm:text-xs font-black leading-tight max-w-[94%] truncate text-white"
                        >
                          {orb.mainKa}
                        </span>
                        {orb.subKa && (
                          <span
                            style={{
                              textShadow:
                                '0 1px 2.5px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.8)',
                            }}
                            className="relative z-10 text-[7.5px] sm:text-[9px] font-extrabold leading-tight tracking-tighter w-full px-1 text-center whitespace-nowrap text-amber-50 mt-0.5 truncate"
                          >
                            {orb.subKa}
                          </span>
                        )}
                      </AxialSpinningOrbContent>
                    </motion.button>
                  );
                })}

                {/* CINEMATIC SPHERE CENTERING, ZOOMING & SUPERNOVA BURST OVERLAY */}
                <AnimatePresence>
                  {burstingOrbState && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[9990]">
                      {/* Ambient Cosmic Focus Backdrop Layer — gently dims background so user tracks the hero sphere effortlessly */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: burstingOrbState.phase === 'burst' ? 0.5 : 0.28,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-[9991]"
                      />

                      {/* 1. The Gliding, Zooming, Resonating, and Popping Hero Sphere */}
                      <motion.div
                        key={`bursting-hero-${burstingOrbState.orb.id}`}
                        initial={{
                          x: burstingOrbState.startX,
                          y: burstingOrbState.startY,
                          scale: burstingOrbState.startScale,
                          opacity: 1,
                        }}
                        animate={
                          burstingOrbState.phase === 'glide'
                            ? {
                                x: 0,
                                y: burstingOrbState.galaxyCenterOffsetY,
                                scale: burstingOrbState.targetScale,
                                opacity: 1,
                              }
                            : burstingOrbState.phase === 'resonate'
                              ? {
                                  x: 0,
                                  y: burstingOrbState.galaxyCenterOffsetY,
                                  scale: [
                                    burstingOrbState.targetScale,
                                    burstingOrbState.targetScale * 1.05,
                                    burstingOrbState.targetScale * 1.02,
                                  ],
                                  opacity: 1,
                                }
                              : {
                                  x: 0,
                                  y: burstingOrbState.galaxyCenterOffsetY,
                                  scale: burstingOrbState.targetScale * 1.48,
                                  opacity: 0,
                                  filter: 'brightness(3.5) blur(12px)',
                                }
                        }
                        transition={
                          burstingOrbState.phase === 'glide'
                            ? {
                                duration: 0.28,
                                ease: [0.16, 1, 0.3, 1], // Snappy, responsive glide
                              }
                            : burstingOrbState.phase === 'resonate'
                              ? {
                                  duration: 0.14,
                                  ease: 'easeInOut',
                                }
                              : {
                                  duration: 0.22,
                                  ease: 'easeOut',
                                }
                        }
                        style={{
                          width: `${burstingOrbState.sphereDiameter}px`,
                          height: `${burstingOrbState.sphereDiameter}px`,
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          marginLeft: `${-burstingOrbState.sphereDiameter / 2}px`,
                          marginTop: `${-burstingOrbState.sphereDiameter / 2}px`,
                          borderRadius: '9999px',
                          boxShadow:
                            burstingOrbState.phase === 'glide'
                              ? `0 0 65px ${burstingOrbState.orb.accentColor}, 0 0 110px rgba(255,255,255,0.85), inset 0 4px 16px rgba(255,255,255,0.95), inset 0 -6px 20px ${burstingOrbState.orb.accentColor}`
                              : burstingOrbState.phase === 'resonate'
                                ? `0 0 95px #FFFFFF, 0 0 160px ${burstingOrbState.orb.accentColor}, inset 0 0 45px #FFFFFF, 0 0 220px rgba(253,230,138,0.7)`
                                : `0 0 160px #FFFFFF, 0 0 240px ${burstingOrbState.orb.accentColor}, inset 0 0 50px #FFFFFF`,
                          background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.96) 0%, rgba(254,240,138,0.65) 24%, ${burstingOrbState.orb.accentColor}66 60%, ${burstingOrbState.orb.accentColor}ee 100%)`,
                          zIndex: 9995,
                        }}
                        className="pointer-events-none border-2 border-white/95 overflow-hidden flex flex-col items-center justify-center text-center backdrop-blur-md"
                      >
                        <AxialRotatingSphereCanvas
                          accentColor={burstingOrbState.orb.accentColor}
                          idx={0}
                        />

                        {/* Caustic Glass Specular Highlights */}
                        <span className="pointer-events-none absolute top-2 left-4 w-12 h-3.5 rounded-full bg-white/85 blur-[0.4px] -rotate-12 z-20" />
                        <span className="pointer-events-none absolute top-5 left-3 w-5 h-2 rounded-full bg-white/70 blur-[0.2px] -rotate-12 z-20" />
                        <span
                          style={{ backgroundColor: burstingOrbState.orb.accentColor }}
                          className="pointer-events-none absolute bottom-2 right-4 w-12 h-2.5 rounded-full opacity-60 blur-[2px] z-20"
                        />

                        {/* Sacred Hebrew & Georgian Typography scaling with the sphere */}
                        <div className="relative z-10 flex flex-col items-center justify-center p-2">
                          <span
                            dir="rtl"
                            style={{
                              textShadow:
                                '0 2px 6px rgba(0,0,0,0.95), 0 0 14px rgba(255,255,255,0.85)',
                            }}
                            className="font-serif text-sm sm:text-base font-black leading-none mb-1 text-amber-100"
                          >
                            {burstingOrbState.orb.badgeHe}
                          </span>
                          <span
                            style={{
                              textShadow:
                                '0 2px 6px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.9)',
                            }}
                            className="text-xs sm:text-sm font-black leading-tight text-white"
                          >
                            {burstingOrbState.orb.mainKa}
                          </span>
                          {burstingOrbState.orb.subKa && (
                            <span
                              style={{ textShadow: '0 1.5px 4px rgba(0,0,0,0.95)' }}
                              className="text-[9px] sm:text-[10.5px] font-extrabold text-amber-200 mt-0.5 tracking-tight"
                            >
                              {burstingOrbState.orb.subKa}
                            </span>
                          )}
                        </div>
                      </motion.div>

                      {/* 2. Crystal Resonance Halo When Reached Center & Exactly Equals Globe in Size */}
                      {burstingOrbState.phase === 'resonate' && (
                        <motion.div
                          key={`resonate-halo-${burstingOrbState.orb.id}`}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.8] }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{
                            width: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                            height: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                            marginLeft: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2}px`,
                            marginTop: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2 + burstingOrbState.galaxyCenterOffsetY}px`,
                            borderColor: '#FDE68A',
                            boxShadow: `0 0 75px #FFFFFF, 0 0 130px ${burstingOrbState.orb.accentColor}, inset 0 0 35px rgba(255,255,255,0.85)`,
                          }}
                          className="absolute rounded-full border-2 pointer-events-none z-[9994]"
                        />
                      )}

                      {/* 3. Supernova Burst Shockwaves, Cosmic Rays & Radiant Stardust When It Pops ("სკდება") */}
                      {burstingOrbState.phase === 'burst' && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                          }}
                          className="pointer-events-none flex items-center justify-center z-[9998]"
                        >
                          {/* Central Stellar Core Flash */}
                          <motion.div
                            initial={{ scale: 0.35, opacity: 1 }}
                            animate={{ scale: 3.8, opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{
                              width: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              height: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              marginLeft: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2}px`,
                              marginTop: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2 + burstingOrbState.galaxyCenterOffsetY}px`,
                              background: `radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,0.98) 25%, ${burstingOrbState.orb.accentColor}cc 52%, rgba(245,158,11,0.4) 72%, transparent 88%)`,
                            }}
                            className="absolute rounded-full"
                          />

                          {/* Primary Concentric Golden Shockwave Ring */}
                          <motion.div
                            initial={{ scale: 0.85, opacity: 1 }}
                            animate={{ scale: 4.2, opacity: 0 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            style={{
                              width: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              height: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              marginLeft: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2}px`,
                              marginTop: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2 + burstingOrbState.galaxyCenterOffsetY}px`,
                              borderColor: '#FDE68A',
                              boxShadow: `0 0 65px #FDE68A, inset 0 0 35px ${burstingOrbState.orb.accentColor}`,
                            }}
                            className="absolute rounded-full border-4"
                          />

                          {/* Secondary Orb Accent Color Shockwave Ring */}
                          <motion.div
                            initial={{ scale: 0.72, opacity: 0.95 }}
                            animate={{ scale: 4.8, opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.02, ease: 'easeOut' }}
                            style={{
                              width: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              height: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              marginLeft: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2}px`,
                              marginTop: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2 + burstingOrbState.galaxyCenterOffsetY}px`,
                              borderColor: burstingOrbState.orb.accentColor,
                              boxShadow: `0 0 55px ${burstingOrbState.orb.accentColor}, inset 0 0 25px ${burstingOrbState.orb.accentColor}`,
                            }}
                            className="absolute rounded-full border-3"
                          />

                          {/* Tertiary Diamond Horizon Wave */}
                          <motion.div
                            initial={{ scale: 0.65, opacity: 0.9 }}
                            animate={{ scale: 5.6, opacity: 0 }}
                            transition={{ duration: 1.4, delay: 0.08, ease: 'easeOut' }}
                            style={{
                              width: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              height: `${burstingOrbState.sphereDiameter * burstingOrbState.targetScale}px`,
                              marginLeft: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2}px`,
                              marginTop: `${(-burstingOrbState.sphereDiameter * burstingOrbState.targetScale) / 2 + burstingOrbState.galaxyCenterOffsetY}px`,
                              borderColor: '#FFFFFF',
                              boxShadow: '0 0 45px rgba(255, 255, 255, 0.9)',
                            }}
                            className="absolute rounded-full border-2"
                          />

                          {/* 12 Radiant Celestial Starburst Light Beams */}
                          {Array.from({ length: 12 }).map((_, rayIdx) => {
                            const rayAngle = (rayIdx / 12) * 360;
                            const rayLength =
                              burstingOrbState.sphereDiameter *
                              burstingOrbState.targetScale *
                              1.8;
                            return (
                              <motion.div
                                key={`burst-ray-${rayIdx}`}
                                initial={{ opacity: 1, scaleY: 0.2, scaleX: 1 }}
                                animate={{
                                  opacity: [1, 0.9, 0],
                                  scaleY: [0.2, 1.4, 1.8],
                                  rotate: [rayAngle, rayAngle + 12],
                                }}
                                transition={{ duration: 1.15, ease: 'easeOut' }}
                                style={{
                                  position: 'absolute',
                                  width: '3.5px',
                                  height: `${rayLength}px`,
                                  marginTop: `${burstingOrbState.galaxyCenterOffsetY}px`,
                                  transformOrigin: 'center center',
                                  background: `linear-gradient(to top, transparent, #FFFFFF 40%, ${burstingOrbState.orb.accentColor} 70%, transparent 100%)`,
                                  boxShadow: `0 0 16px ${burstingOrbState.orb.accentColor}`,
                                }}
                              />
                            );
                          })}

                          {/* 42 Sparkling Cosmic Stardust & Gemstone Shards Bursting Radially */}
                          {Array.from({ length: 42 }).map((_, pIdx) => {
                            const angle = (pIdx / 42) * Math.PI * 2;
                            const distance =
                              burstingOrbState.sphereDiameter *
                                burstingOrbState.targetScale *
                                0.72 +
                              (pIdx % 7) * 42;
                            const pSize = 4.5 + (pIdx % 6) * 3.2;
                            const isStar = pIdx % 3 === 0;
                            const color =
                              pIdx % 5 === 0
                                ? '#FFFFFF'
                                : pIdx % 5 === 1
                                  ? '#FDE68A'
                                  : pIdx % 5 === 2
                                    ? burstingOrbState.orb.accentColor
                                    : pIdx % 5 === 3
                                      ? '#F59E0B'
                                      : '#38BDF8';
                            return (
                              <motion.div
                                key={`burst-shard-${pIdx}`}
                                initial={{
                                  x: 0,
                                  y: burstingOrbState.galaxyCenterOffsetY,
                                  scale: 0.35,
                                  opacity: 1,
                                }}
                                animate={{
                                  x: Math.cos(angle) * distance,
                                  y:
                                    burstingOrbState.galaxyCenterOffsetY +
                                    Math.sin(angle) * distance,
                                  scale: [0.35, 1.45, 0],
                                  opacity: [1, 1, 0],
                                  rotate: [0, pIdx * 72],
                                }}
                                transition={{
                                  duration: 1.05 + (pIdx % 4) * 0.12,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                style={{
                                  position: 'absolute',
                                  width: `${pSize}px`,
                                  height: `${pSize}px`,
                                  backgroundColor: color,
                                  boxShadow: `0 0 16px ${color}, 0 0 30px rgba(255,255,255,0.9)`,
                                  borderRadius: isStar ? '2px' : '9999px',
                                  transform: isStar ? 'rotate(45deg)' : undefined,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Crystal Shortcut Spheres Customization Modal (Opened on Double-Click of Globe or Header Button) */}
              <CrystalOrbsSelectorModal
                isOpen={isOrbsModalOpen}
                onClose={() => setIsOrbsModalOpen(false)}
                activeOrbIds={activeOrbIds}
                onToggleOrbId={handleToggleOrbId}
                onResetDefault={handleResetDefaultOrbs}
              />

              {/* Soft dismiss backdrop when Kacuna dialog is open on Globe */}
              <AnimatePresence>
                {kacunaExpanded && (
                  <motion.div
                    key="globe-kacuna-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setKacunaExpanded(false)}
                    className="fixed inset-0 z-[225] bg-black/15 backdrop-blur-[0.5px] cursor-pointer pointer-events-auto"
                  />
                )}
              </AnimatePresence>

              {/* FLOATING KACUNA ("კაცუნა") AI SCHOLAR GREETER ON THE 3D GLOBE SCREEN — LIGHT CRYSTAL TRANSPARENT DESIGN */}
              <div
                data-globe-control="true"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={`fixed bottom-4 left-3 right-3 sm:right-auto sm:left-5 z-[230] flex flex-col items-start gap-2 max-w-[95vw] ${
                  kacunaSearchResult || kacunaSearchLoading ? 'sm:max-w-lg' : 'sm:max-w-md'
                } pointer-events-auto transition-all`}
              >
                <AnimatePresence>
                  {kacunaExpanded && (
                    <motion.div
                      key="globe-kacuna-dialog"
                      data-kacuna-dialog="true"
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 16, scale: 0.96 }}
                      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(253,230,138,0.14) 22%, rgba(26,17,28,0.88) 60%, rgba(8,5,15,0.96) 100%)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        boxShadow:
                          '0 28px 75px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.32), inset 0 2px 5px rgba(255,255,255,0.85), inset 0 -2px 6px rgba(0,0,0,0.6)',
                      }}
                      className="relative w-full rounded-2xl p-3 sm:p-4 border-2 border-amber-300/75 text-[#FAF5EB] overflow-hidden transition-all max-h-[75vh] flex flex-col"
                    >
                      <span className="pointer-events-none absolute top-1 left-3 right-3 h-2 rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent blur-[0.4px] z-20" />
                      <span className="pointer-events-none absolute top-1.5 left-6 w-28 h-1 rounded-full bg-white/75 blur-[0.3px] -rotate-1 z-20" />
                      <div className="relative z-10 flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-500/30 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs font-black truncate text-amber-200">
                            ჭკვიანი • Gemini ძიება
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={() =>
                              speakKacunaVoice({
                                preset: kacunaSearchResult ? undefined : 'kacuna-prompt',
                                text:
                                  kacunaSearchResult?.answerKa.slice(0, 200) ||
                                  kacunaMessage ||
                                  greetingInfo.spokenTextKa,
                              })
                            }
                            title="ხმის მოსმენა"
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 cursor-pointer shadow-xs shrink-0 ${
                              kacunaSpeaking
                                ? 'bg-emerald-500 border-emerald-600 text-white animate-pulse'
                                : 'bg-[#2B1B11]/85 hover:bg-[#3D2719] border-amber-500/40 text-amber-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)]'
                            }`}
                          >
                            <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="hidden xs:inline">{kacunaSpeaking ? 'საუბრობს' : 'ხმა'}</span>
                          </button>
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={handleTriggerSymmetricGlobeRing}
                            title="ბურთულების სიმეტრიული წყობა / ორბიტა"
                            className="px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-500/40 bg-[#2B1B11]/85 hover:bg-[#3D2719] text-amber-200 flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                          >
                            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="hidden sm:inline">{isSymmetricRingMode ? 'ორბიტა' : 'დალაგება'}</span>
                          </button>
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={() => setIsOrbsModalOpen(true)}
                            title="ბურთულების დამატება / გამოკლება"
                            className="px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-500/40 bg-[#2B1B11]/85 hover:bg-[#3D2719] text-sky-200 flex items-center gap-0.5 cursor-pointer shadow-xs shrink-0"
                          >
                            <Plus className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="hidden sm:inline">სფეროები</span>
                          </button>
                          <button
                            type="button"
                            data-raw-btn="true"
                            data-kacuna-mute="true"
                            onClick={handleStopKacuna}
                            title="გაჩერება"
                            className="p-1 rounded-full border border-amber-500/40 bg-[#2B1B11]/85 hover:bg-[#3D2719] text-rose-300 cursor-pointer shrink-0"
                          >
                            <VolumeX className="w-3 h-3 shrink-0" />
                          </button>
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={() => setKacunaExpanded(false)}
                            title="დაკეცვა"
                            className="p-1 rounded-full border border-amber-500/40 bg-[#2B1B11]/85 hover:bg-[#3D2719] text-amber-200 cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3 shrink-0" />
                          </button>
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 min-h-0 pr-0.5 space-y-2">
                        <div
                          style={{
                            background: 'rgba(28, 17, 10, 0.78)',
                            boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.65)',
                          }}
                          className="relative z-10 rounded-xl border border-amber-500/40 px-3 py-2 shadow-sm"
                        >
                          <p className="text-xs font-bold leading-relaxed text-amber-100">
                            {kacunaMessage}
                          </p>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleProcessUserAnswer(userCommandInput);
                            setUserCommandInput('');
                          }}
                          className="relative z-10 flex items-end gap-1.5"
                        >
                          <div
                            style={{
                              background: 'rgba(20, 12, 7, 0.9)',
                              boxShadow: 'inset 0 1.5px 3.5px rgba(0,0,0,0.7)',
                            }}
                            className="flex-1 min-w-0 flex items-center border border-amber-500/50 focus-within:border-amber-300 focus-within:ring-1 focus-within:ring-amber-400/40 rounded-xl px-2.5 py-1"
                          >
                            <textarea
                              rows={1}
                              value={userCommandInput}
                              onChange={(e) => {
                                setUserCommandInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleProcessUserAnswer(userCommandInput);
                                  setUserCommandInput('');
                                  if (e.currentTarget) {
                                    e.currentTarget.style.height = 'auto';
                                  }
                                }
                              }}
                              placeholder="დაუსვით კითხვა (Gemini ძიება)..."
                              className="flex-1 min-w-0 bg-transparent text-xs font-bold text-[#FAF5EB] placeholder:text-amber-200/50 outline-none resize-none leading-relaxed overflow-y-auto max-h-[120px] py-1"
                              style={{ minHeight: '28px' }}
                            />
                          </div>
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={handleToggleVoiceListening}
                            title="ხმოვანი კითხვა / ბრძანება"
                            className={`h-8 w-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                              isListeningVoice
                                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                                : 'bg-[#2B1B11]/90 border-amber-500/45 text-amber-300 hover:text-amber-100'
                            }`}
                          >
                            {isListeningVoice ? (
                              <MicOff className="w-3.5 h-3.5" />
                            ) : (
                              <Mic className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="submit"
                            data-crystal-gold="true"
                            title="Gemini-ში ძიება და პასუხის ჩვენება"
                            className="h-8 px-2.5 rounded-xl text-[#140C03] font-black text-[11px] flex items-center gap-1 justify-center cursor-pointer shadow-xs border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 shrink-0"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>ძიება</span>
                          </button>
                        </form>

                        {/* Quick Suggested Gemini Questions for Kacuna */}
                        <div className="relative z-10 flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                          {KACUNA_QUICK_QUESTIONS.map((item, idx) => (
                            <button
                              key={`globe-kacuna-q-${idx}`}
                              type="button"
                              data-raw-btn="true"
                              onClick={() => void handleAskKacunaGemini(item.query)}
                              className="px-2.5 py-1 rounded-full bg-[#26170E]/85 hover:bg-[#3D2517] border border-amber-500/35 text-[10px] font-bold text-amber-200 whitespace-nowrap cursor-pointer shrink-0 transition-colors"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Organized Gemini Search Results inside Kacuna */}
                        <KacunaGeminiResultPanel
                          loading={kacunaSearchLoading}
                          result={kacunaSearchResult}
                          onClear={() => setKacunaSearchResult(null)}
                          onSpeakText={(txt) => speakKacunaVoice({ text: txt.slice(0, 220) })}
                          onSelectSource={handleSelectGeminiSource}
                          onExecuteShortcut={handleExecuteShortcut}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2.5 w-full">
                  <motion.button
                    type="button"
                    data-globe-sphere="true"
                    data-kacuna-toggle="true"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      setKacunaStopped(false);
                      setKacunaExpanded((prev) => {
                        const next = !prev;
                        if (next) {
                          speakKacunaVoice({
                            preset: 'kacuna-prompt',
                            text: 'გისმენთ! მითხარით ან დაწერეთ, რას ვსწავლობთ ახლა.',
                          });
                        } else {
                          try {
                            if (kacunaAudioRef.current) {
                              kacunaAudioRef.current.pause();
                              kacunaAudioRef.current.currentTime = 0;
                            }
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                          } catch {
                            // ignore
                          }
                          setKacunaSpeaking(false);
                        }
                        return next;
                      });
                    }}
                    title="ჭკვიანი — კრისტალური ბრილიანტის სფერო (დააწკაპუნეთ სასაუბროდ)"
                    className="relative cursor-pointer rounded-full focus:outline-none group shrink-0"
                  >
                    <LifelikeGlassOrbKacunaAvatar
                      speaking={kacunaSpeaking}
                      stopped={kacunaStopped}
                      sizeClass="w-14 h-14 sm:w-16 sm:h-16"
                    />
                  </motion.button>

                  {!kacunaExpanded && (
                    <motion.button
                      type="button"
                      data-raw-btn="true"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setKacunaStopped(false);
                        setKacunaExpanded(true);
                      }}
                      style={{
                        background:
                          'radial-gradient(circle at 20% 20%, rgba(45,27,17,0.92) 0%, rgba(26,17,11,0.94) 55%, rgba(12,8,5,0.97) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow:
                          '0 12px 35px rgba(0,0,0,0.85), 0 0 20px rgba(245,158,11,0.2), inset 0 1.5px 3px rgba(255,255,255,0.32), inset 0 -1px 2px rgba(0,0,0,0.6)',
                      }}
                      className={`relative px-3.5 py-2.5 rounded-2xl border border-amber-400/60 text-left transition-all cursor-pointer flex-1 min-w-0 max-w-[320px] sm:max-w-sm overflow-hidden group hover:border-amber-300 hover:shadow-[0_14px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(245,158,11,0.35)] ${
                        showTouchScreenReminder
                          ? 'ring-2 ring-amber-400 shadow-[0_6px_22px_rgba(245,158,11,0.4)]'
                          : ''
                      }`}
                    >
                      <span className="pointer-events-none absolute top-1 left-2.5 w-12 h-1 rounded-full bg-white/40 blur-[0.4px] -rotate-2 z-20" />
                      {showTouchScreenReminder ? (
                        <div className="relative z-10 text-xs sm:text-[13px] font-black text-amber-300 leading-snug tracking-tight drop-shadow">
                          👆 დაადე თითი ეკრანს და დალაგდება ბურთულები
                        </div>
                      ) : (
                        <>
                          <div className="relative z-10 text-xs sm:text-[13px] font-black text-amber-300 leading-snug tracking-tight drop-shadow flex items-center gap-1.5">
                            <span>{greetingInfo.greetingKa}</span>
                            <span className="text-amber-500/80">•</span>
                            <span
                              dir="rtl"
                              className="text-amber-200 font-serif font-black"
                            >
                              {greetingInfo.greetingHe}
                            </span>
                          </div>
                          <div className="relative z-10 text-[11px] sm:text-xs font-bold text-stone-200/90 leading-snug mt-0.5 group-hover:text-amber-100 transition-colors">
                            რას ვსწავლობთ ახლა? დააწკაპუნეთ აქ
                          </div>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
      ) : (
        <>
          {/* Soft dismiss backdrop when Kacuna dialog is open on Study Screen */}
          <AnimatePresence>
            {kacunaExpanded && (
              <motion.div
                key="study-kacuna-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setKacunaExpanded(false)}
                className="fixed inset-0 z-[195] bg-black/15 backdrop-blur-[0.5px] cursor-pointer pointer-events-auto"
              />
            )}
          </AnimatePresence>

          <motion.div
            key="floating-study-kacuna-and-top-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isAnyBottomSheetExpanded ? 0 : 1,
              y: isAnyBottomSheetExpanded ? 14 : 0,
            }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            style={{
              pointerEvents: 'none',
            }}
            className={`fixed bottom-[70px] sm:bottom-[74px] left-3 right-3 sm:left-5 sm:right-5 z-[250] flex flex-col items-start gap-2 ${
              isAnyBottomSheetExpanded ? 'invisible pointer-events-none' : ''
            }`}
          >
            {/* Expanded Kacuna Study Assistant Card on Study Screens (Anchored on Left above Kacuna) */}
            <AnimatePresence>
              {kacunaExpanded && (
                <motion.div
                  key="study-screen-kacuna-dialog"
                  data-kacuna-dialog="true"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.96 }}
                  transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(253,230,138,0.14) 22%, rgba(26,17,28,0.9) 60%, rgba(8,5,15,0.97) 100%)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    boxShadow:
                      '0 28px 75px rgba(0,0,0,0.85), 0 0 35px rgba(245,158,11,0.32), inset 0 2px 5px rgba(255,255,255,0.85), inset 0 -2px 6px rgba(0,0,0,0.6)',
                  }}
                  className="pointer-events-auto w-[calc(100vw-24px)] max-w-md rounded-2xl p-3.5 sm:p-4 border-2 border-amber-300/75 text-[#FAF5EB] overflow-hidden self-start backdrop-blur-2xl transition-all max-h-[75vh] flex flex-col"
                >
                  <span className="pointer-events-none absolute top-1 left-3 right-3 h-2 rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent blur-[0.4px] z-20" />
                  <span className="pointer-events-none absolute top-1.5 left-6 w-28 h-1 rounded-full bg-white/75 blur-[0.3px] -rotate-1 z-20" />
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-500/30 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-black truncate text-amber-200">
                        ჭკვიანი • חכם
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onOpenGlobe && (
                        <button
                          type="button"
                          data-raw-btn="true"
                          data-flat-btn="true"
                          onClick={() => {
                            setKacunaExpanded(false);
                            onOpenGlobe();
                          }}
                          className="px-2 py-1 rounded-lg border border-amber-500/40 bg-[#3A2416]/90 hover:bg-[#4E311F] text-amber-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                          title="3D ბურთულების ეკრანზე გადასვლა"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="hidden sm:inline">3D სფეროები</span>
                        </button>
                      )}
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() => {
                          if (kacunaSpeaking) {
                            handleStopKacuna();
                          } else {
                            setKacunaStopped(false);
                            speakKacunaVoice({
                              text: kacunaSearchResult?.answerKa || greetingInfo.spokenTextKa,
                            });
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-[#2B1B11]/85 hover:bg-[#3D2719] border border-amber-500/40 text-[10.5px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer shadow-xs"
                        title={kacunaSpeaking ? 'ხმის გაჩერება' : 'ხმოვანი წაკითხვა'}
                      >
                        {kacunaSpeaking ? (
                          <VolumeX className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-amber-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        onClick={() => setKacunaExpanded(false)}
                        className="p-1 rounded-lg bg-[#2B1B11]/85 hover:bg-[#3D2719] border border-amber-500/40 text-amber-200 cursor-pointer shadow-xs"
                        title="დახურვა"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 min-h-0 pr-0.5 space-y-2">
                    <div
                      style={{
                        background: 'rgba(28, 17, 10, 0.78)',
                        boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.65)',
                      }}
                      className="relative z-10 rounded-xl border border-amber-500/40 px-3 py-2 shadow-sm"
                    >
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-100">
                        {kacunaMessage || 'რას ვსწავლობთ ახლა? დამისვით შეკითხვა ან მოძებნეთ წყარო.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
                      {KACUNA_QUICK_QUESTIONS.map((qq, idx) => (
                        <button
                          key={`study-qq-${idx}`}
                          type="button"
                          data-raw-btn="true"
                          data-flat-btn="true"
                          onClick={() => {
                            setUserCommandInput(qq.query);
                            void handleAskKacunaGemini(qq.query);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#26170E]/85 hover:bg-[#3D2517] border border-amber-500/35 text-amber-200 text-[10.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors shrink-0"
                        >
                          {qq.label}
                        </button>
                      ))}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleProcessUserAnswer(userCommandInput);
                      }}
                      className="flex items-end gap-1.5"
                    >
                      <div
                        style={{
                          background: 'rgba(20, 12, 7, 0.9)',
                          boxShadow: 'inset 0 1.5px 3.5px rgba(0,0,0,0.7)',
                        }}
                        className="relative flex-1 min-w-0 flex items-center border border-amber-500/50 focus-within:border-amber-300 focus-within:ring-1 focus-within:ring-amber-400/40 rounded-xl px-2.5 py-1"
                      >
                        <textarea
                          rows={1}
                          value={userCommandInput}
                          onChange={(e) => {
                            setUserCommandInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleProcessUserAnswer(userCommandInput);
                              if (e.currentTarget) {
                                e.currentTarget.style.height = 'auto';
                              }
                            }
                          }}
                          placeholder="ჰკითხეთ ჭკვიანს ან მოძებნეთ წყარო..."
                          className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-[#FAF5EB] placeholder:text-amber-200/50 focus:outline-none resize-none leading-relaxed overflow-y-auto max-h-[120px] py-1 pr-1"
                          style={{ minHeight: '28px' }}
                        />
                        <button
                          type="button"
                          data-raw-btn="true"
                          data-flat-btn="true"
                          onClick={handleToggleVoiceListening}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                            isListeningVoice
                              ? 'bg-rose-500/20 text-rose-600 ring-1 ring-rose-400 animate-pulse'
                              : 'bg-[#2B1B11]/90 border border-amber-500/40 text-amber-300 hover:text-amber-100'
                          }`}
                          title="ხმოვანი ჩაწერა"
                        >
                          {isListeningVoice ? (
                            <MicOff className="w-3.5 h-3.5" />
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <button
                        type="submit"
                        data-raw-btn="true"
                        data-flat-btn="true"
                        disabled={kacunaSearchLoading}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 border border-amber-300 text-[#140C03] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-60 h-8 shadow-xs"
                      >
                        {kacunaSearchLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </form>

                    <KacunaGeminiResultPanel
                      loading={kacunaSearchLoading}
                      result={kacunaSearchResult}
                      onClear={() => setKacunaSearchResult(null)}
                      onSpeakText={(txt) => speakKacunaVoice({ text: txt.slice(0, 260) })}
                      onSelectSource={handleSelectGeminiSource}
                      onExecuteShortcut={handleExecuteShortcut}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Single Horizontal Row: Kacuna on the LEFT, Round Translucent Crystal Return-to-Top Button on the RIGHT */}
            <div className="w-full flex items-center justify-between pointer-events-none">
              {/* LEFT: Floating Kacuna Avatar Orb — Pure Orb, completely without title or text badge */}
              <motion.button
                type="button"
                data-raw-btn="true"
                data-flat-btn="true"
                data-kacuna-toggle="true"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setKacunaExpanded((prev) => !prev);
              }}
              aria-label="AI ასისტენტი"
              className="pointer-events-auto relative w-12 h-12 sm:w-13 sm:h-13 cursor-pointer rounded-full focus:outline-none group shrink-0 shadow-[0_6px_18px_rgba(14,116,144,0.16)] flex items-center justify-center"
            >
              <LifelikeGlassOrbKacunaAvatar
                speaking={kacunaSpeaking}
                stopped={kacunaStopped}
                sizeClass="w-12 h-12 sm:w-13 sm:h-13"
              />
            </motion.button>

            {/* RIGHT: Round, Delicate, Crystal-Transparent Return-to-Top Button (მრგვალი, ნაზი და კრისტალური გამჭვირვალე) */}
            <motion.button
              type="button"
              data-raw-btn="true"
              data-flat-btn="true"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('talmud-reset-zoom'));
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                document.body.scrollTop = 0;
                if (document.scrollingElement) {
                  document.scrollingElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  document.scrollingElement.scrollTop = 0;
                }
                const dafFolio = document.getElementById('talmud-daf-folio-anchor');
                if (dafFolio) {
                  dafFolio.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  dafFolio.scrollTop = 0;
                }
                document
                  .querySelectorAll('[data-daf-scroll-pane="true"], .overflow-y-auto')
                  .forEach((el) => {
                    try {
                      (el as HTMLElement).scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                      (el as HTMLElement).scrollTop = 0;
                    } catch {
                      // ignore
                    }
                  });
                window.dispatchEvent(new CustomEvent('torah-reveal-top-panel'));
                window.dispatchEvent(new CustomEvent('torah-scroll-to-top'));
              }}
              title="თავში დაბრუნება (Return to Top)"
              aria-label="თავში დაბრუნება"
              style={{
                background:
                  'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.52) 0%, rgba(224,242,254,0.28) 58%, rgba(186,230,253,0.16) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow:
                  '0 4px 14px rgba(14,116,144,0.09), inset 0 1px 1.5px rgba(255,255,255,0.75)',
              }}
              className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/65 hover:border-sky-300/80 text-sky-900/85 hover:text-amber-800 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all shrink-0"
            >
              <ArrowUp className="w-4 h-4 text-sky-700/85 stroke-[1.85] shrink-0" />
              <span className="text-[8px] font-medium tracking-tight text-slate-700/90 leading-none">
                თავში
              </span>
            </motion.button>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
