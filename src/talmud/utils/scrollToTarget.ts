// @ts-nocheck
// TEMPORARY: user-provided version. Previous version backed up.
export function scrollToTarget(targetEl: HTMLElement | null) {
  if (!targetEl) return;

  try {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {
    console.warn('scrollIntoView failed', e);
  }

  const folio = document.getElementById('talmud-daf-folio-anchor');
  if (folio && folio.contains(targetEl)) {
    const fRect = folio.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();
    const targetTop = folio.scrollTop + (tRect.top - fRect.top) - folio.clientHeight * 0.4;
    folio.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }
}
