// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export function playBookPageTurnSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * Math.pow(1 - t, 1.4);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.035;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch {
    // Ignore audio context restrictions
  }
}

interface PageFlip3DWrapperProps {
  pageKey: string;
  direction: 1 | -1 | number;
  isDark?: boolean;
  pageLabelHe?: string;
  pageLabelKa?: string;
  externalRotationY?: number;
  onRotationYChange?: (nextRotationY: number) => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  compactControls?: boolean;
  showFlipControlBar?: boolean;
  children: React.ReactNode;
}

const pageFlipVariants = {
  enter: (dir: number) => ({
    rotateY: dir >= 0 ? 12 : -12,
    x: dir >= 0 ? 20 : -20,
    scale: 0.988,
    opacity: 0.6,
    filter: 'brightness(0.97)',
  }),
  center: {
    rotateY: 0,
    x: 0,
    scale: 1,
    opacity: 1,
    filter: 'brightness(1)',
  },
  exit: (dir: number) => ({
    rotateY: dir >= 0 ? -12 : 12,
    x: dir >= 0 ? -20 : 20,
    scale: 0.988,
    opacity: 0.35,
    filter: 'brightness(0.94)',
  }),
};

export const PageFlip3DWrapper: React.FC<PageFlip3DWrapperProps> = React.memo(({
  pageKey,
  direction = 1,
  children,
}) => {
  const [prevKey, setPrevKey] = useState(pageKey);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (pageKey !== prevKey) {
      setPrevKey(pageKey);
      if (!reducedMotion) playBookPageTurnSound();
    }
  }, [pageKey, prevKey, reducedMotion]);

  const effectiveDir = direction >= 0 ? 1 : -1;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        perspective: 1600,
        transformStyle: 'preserve-3d',
      }}
      data-component="PageFlip3DWrapper"
    >
      <AnimatePresence mode="popLayout" initial={false} custom={effectiveDir}>
        <motion.div
          key={pageKey}
          custom={effectiveDir}
          variants={reducedMotion ? { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 1 } } : pageFlipVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: reducedMotion ? 0 : 0.28,
            ease: [0.22, 1, 0.36, 1], // gentle organic 3D paper ease
          }}
          style={{
            transformOrigin: effectiveDir >= 0 ? 'right center' : 'left center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="relative w-full"
        >
          {children}

          {/* Gentle, hardware-accelerated tactile paper turn curl & spine reflection shimmer */}
          {!reducedMotion && <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-30 rounded-xl"
            style={{
              background:
                effectiveDir >= 0
                  ? 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.06) 18%, transparent 50%)'
                  : 'linear-gradient(270deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.06) 18%, transparent 50%)',
            }}
          />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
