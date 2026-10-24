// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  children,
  className = '',
  title,
}) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const inner = innerRef.current;
      if (!container || !inner) return;
      const diff = inner.scrollWidth - container.clientWidth;
      if (diff > 3) {
        setOverflowPx(diff + 8);
      } else {
        setOverflowPx(0);
      }
    };

    checkOverflow();
    const timer = window.setTimeout(checkOverflow, 180);
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  return (
    <span
      ref={containerRef}
      title={title || (typeof children === 'string' ? children : undefined)}
      className={`block overflow-hidden whitespace-nowrap relative max-w-full ${className}`}
    >
      <span
        ref={innerRef}
        className={overflowPx > 0 ? 'marquee-auto-scroll' : 'inline-block whitespace-nowrap'}
        style={
          overflowPx > 0
            ? ({ '--marquee-offset': `-${overflowPx}px` } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </span>
  );
};
