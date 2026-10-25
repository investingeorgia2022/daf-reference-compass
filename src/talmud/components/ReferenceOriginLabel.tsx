import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/** Follow the actual destination through PDF zoom and nested scrolling. */
export function ReferenceOriginLabel({ container, label, origin }: {
  container: RefObject<HTMLDivElement | null>; label: string; origin: string;
}) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    let frame = 0;
    const track = () => {
      const target = container.current?.querySelector('[data-marker-navigation-target]');
      if (target) {
        const rect = target.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
        const next = visible ? {
          left: Math.max(12, Math.min(window.innerWidth - 236, rect.left)),
          top: Math.max(12, Math.min(window.innerHeight - 120, rect.top - 76)),
        } : null;
        setPosition(previous => previous?.left === next?.left && previous?.top === next?.top ? previous : next);
      }
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
  }, [container]);
  if (!position) return null;
  return createPortal(
    <div className="reference-origin-label" role="status" style={{ left: position.left, top: position.top }}>
      <span>{label}</span>
      <strong dir="rtl">{origin}</strong>
    </div>, document.body,
  );
}