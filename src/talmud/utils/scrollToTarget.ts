// @ts-nocheck
/**
 * Smoothly scrolls the nearest scrollable ancestor (or the window) so that `target`
 * lands at `anchorRatio` of the visible height. Uses live getBoundingClientRect,
 * so CSS transforms (zoom/pan of the daf) and nested scroll containers are honoured.
 */

const isScrollable = (el: HTMLElement) => {
  const oy = getComputedStyle(el).overflowY;
  return (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 1;
};

export function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement || null;
  while (node && node !== document.body && node !== document.documentElement) {
    if (isScrollable(node)) return node;
    node = node.parentElement;
  }
  return null; // window
}

function scrollOnce(target: HTMLElement, anchorRatio: number, behavior: ScrollBehavior): number {
  const container = findScrollParent(target);
  const r = target.getBoundingClientRect();
  const targetCenter = r.top + r.height / 2;

  if (container) {
    const c = container.getBoundingClientRect();
    const delta = targetCenter - (c.top + container.clientHeight * anchorRatio);
    const top = Math.max(0, Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + delta));
    container.scrollTo({ top, behavior });
    // Container itself may be off-screen inside the page: bring it into view too.
    if (c.top < 0 || c.bottom > window.innerHeight) {
      window.scrollBy({ top: c.top - 8, behavior });
    }
    return delta;
  }
  const delta = targetCenter - window.innerHeight * anchorRatio;
  window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior });
  return delta;
}

/**
 * Scrolls after layout has settled (2 animation frames), then re-checks once after
 * `settleMs` (e.g. after a zoom transition) and corrects any remaining drift.
 */
export function scrollToTarget(
  target: HTMLElement | string,
  { anchorRatio = 0.42, settleMs = 450 }: { anchorRatio?: number; settleMs?: number } = {}
): void {
  if (typeof window === 'undefined') return;
  const resolve = () =>
    typeof target === 'string' ? (document.getElementById(target) as HTMLElement | null) : target;

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = resolve();
      if (!el) return;
      scrollOnce(el, anchorRatio, 'smooth');
      window.setTimeout(() => {
        const again = resolve();
        if (!again) return;
        const r = again.getBoundingClientRect();
        const container = findScrollParent(again);
        const viewTop = container ? container.getBoundingClientRect().top : 0;
        const viewH = container ? container.clientHeight : window.innerHeight;
        const drift = r.top + r.height / 2 - (viewTop + viewH * anchorRatio);
        if (Math.abs(drift) > 6) scrollOnce(again, anchorRatio, 'smooth');
      }, settleMs);
    })
  );
}
