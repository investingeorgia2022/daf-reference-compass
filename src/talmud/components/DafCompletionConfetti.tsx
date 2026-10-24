// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export interface DafCelebrationDetail {
  dafKey: string;
  labelKa?: string;
  labelHe?: string;
}

export function emitDafCompletedCelebration(detail: DafCelebrationDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DafCelebrationDetail>('daf-completed-celebration', { detail })
  );
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle' | 'diamond';
}

const CONFETTI_PALETTE = [
  '#F59E0B', // Royal Amber
  '#FBBF24', // Warm Gold
  '#38BDF8', // Crystal Sky
  '#10B981', // Emerald
  '#FDE68A', // Soft Gold Pearl
  '#0284C7', // Deep Sky
  '#A7F3D0', // Mint Frost
];

export const DafCompletionConfetti: React.FC = () => {
  const [celebration, setCelebration] = useState<{
    key: number;
    dafKey: string;
    labelKa?: string;
    labelHe?: string;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEv = e as CustomEvent<DafCelebrationDetail>;
      const detail = customEv.detail || { dafKey: '' };
      setCelebration({
        key: Date.now(),
        dafKey: detail.dafKey,
        labelKa: detail.labelKa,
        labelHe: detail.labelHe,
      });
    };

    window.addEventListener('daf-completed-celebration', handleCelebration);
    return () => {
      window.removeEventListener('daf-completed-celebration', handleCelebration);
    };
  }, []);

  useEffect(() => {
    if (!celebration) return;

    const timer = window.setTimeout(() => {
      setCelebration(null);
    }, 2800);

    const canvas = canvasRef.current;
    if (!canvas) return () => window.clearTimeout(timer);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => window.clearTimeout(timer);

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const originX = width * 0.5;
    const originY = Math.min(180, height * 0.24);

    const particles: ConfettiParticle[] = Array.from({ length: 58 }, (_, i) => {
      const spreadAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.45;
      const speed = 4.5 + Math.random() * 7.5;
      const shapes: ('rect' | 'circle' | 'diamond')[] = ['rect', 'circle', 'diamond'];
      return {
        x: originX + (Math.random() - 0.5) * 80,
        y: originY + (Math.random() - 0.5) * 24,
        vx: Math.cos(spreadAngle) * speed + (Math.random() - 0.5) * 2.5,
        vy: Math.sin(spreadAngle) * speed - Math.random() * 2,
        width: 6 + Math.random() * 5,
        height: 4 + Math.random() * 4,
        color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.16,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.07 + Math.random() * 0.06,
        alpha: 1,
        shape: shapes[i % shapes.length],
      };
    });

    let rafId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      for (const p of particles) {
        p.vy += 0.18; // Gentle gravity
        p.vx *= 0.99; // Air drag
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.85;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > 1700) {
          p.alpha = Math.max(0, 1 - (elapsed - 1700) / 1000);
        }

        if (p.alpha > 0.02 && p.y < height + 30) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.width * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(0, -p.height);
            ctx.lineTo(p.width * 0.65, 0);
            ctx.lineTo(0, p.height);
            ctx.lineTo(-p.width * 0.65, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          }
          ctx.restore();
        }
      }

      if (aliveCount > 0 && elapsed < 2750) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [celebration]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {celebration && (
        <div
          key={celebration.key}
          className="pointer-events-none fixed inset-0 z-[100020] overflow-hidden flex justify-center items-start pt-14 sm:pt-16 px-3"
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 w-full h-full"
          />

          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 px-4 py-2.5 rounded-2xl crystal-panel-dark border border-amber-400/85 shadow-[0_12px_32px_rgba(245,158,11,0.25)] flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#0F1E36]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>მაზალ ტოვ! დაფი შესწავლილია</span>
                <span dir="rtl" className="font-serif text-amber-700 font-black">
                  • מזל טוב!
                </span>
              </div>
              {(celebration.labelKa || celebration.dafKey) && (
                <div className="text-[11px] font-extrabold text-[#476282] truncate">
                  {celebration.labelKa || celebration.dafKey}
                  {celebration.labelHe ? ` (${celebration.labelHe})` : ''}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
