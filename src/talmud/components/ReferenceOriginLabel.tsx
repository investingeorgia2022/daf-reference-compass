import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/** Small, short-lived badge that follows the destination through zoom and scrolling. */
export function ReferenceOriginLabel({ container, label, origin }: {
  container: RefObject<HTMLDivElement | null>; label: string; origin: string;
}) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    setFading(false); setGone(false);
    const fade = window.setTimeout(() => setFading(true), 2600);
    const hide = window.setTimeout(() => setGone(true), 3200);
    return () => { clearTimeout(fade); clearTimeout(hide); };
  }, [origin, label]);
  useEffect(() => {
    let frame = 0;
    const track = () => {
      const target = container.current?.querySelector('[data-marker-navigation-target]');
      if (target) {
        const rect = target.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
        const next = visible ? {
          left: Math.max(8, Math.min(window.innerWidth - 180, rect.left)),
          top: Math.max(8, rect.top - 26),
        } : null;
        setPosition(previous => previous?.left === next?.left && previous?.top === next?.top ? previous : next);
      }
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [container]);
  if (!position || gone) return null;
  return createPortal(
    <div className={`reference-origin-label${fading ? ' is-fading' : ''}`} role="status" style={{ left: position.left, top: position.top }}>
      <span>{label}</span>
      <strong dir="rtl">{origin}</strong>
    </div>, document.body,
  );
}
