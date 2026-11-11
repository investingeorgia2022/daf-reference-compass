// @ts-nocheck
// Older iOS Safari (before 17.4 / 18) lacks APIs PDF.js calls; add them only when missing.
export const needsPdfPolyfills = typeof Promise.withResolvers !== "function" || typeof URL.parse !== "function";
if (typeof Promise.withResolvers !== "function") {
  Object.defineProperty(Promise, "withResolvers", { configurable: true, writable: true, value: function () {
    let resolve, reject;
    const promise = new this((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  } });
}
if (typeof URL !== "undefined" && typeof URL.parse !== "function") {
  Object.defineProperty(URL, "parse", { configurable: true, writable: true, value: function (url, base) {
    try { return new URL(url, base); } catch { return null; }
  } });
}
