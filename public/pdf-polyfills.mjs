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
