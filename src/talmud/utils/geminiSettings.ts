// User-owned Gemini key + model routing preferences, stored on this device only.
export type GeminiMode = 'auto' | 'fixed';
export interface GeminiSettings {
  apiKey: string;
  mode: GeminiMode;
  fixedModel: string;
  complexModel: string; // model used for the "complex" tier (e.g. Argon); empty = pro alias
}

const KEY = 'talmud-gemini-settings-v1';
export const DEFAULT_GEMINI: GeminiSettings = { apiKey: '', mode: 'auto', fixedModel: 'gemini-flash-latest', complexModel: '' };

export const GEMINI_MODEL_CHOICES = [
  { id: 'gemini-flash-latest', label: '⚡ Flash (უახლესი) — ყოველდღიური' },
  { id: 'gemini-flash-lite-latest', label: '🚀 Flash-Lite (უახლესი) — უსწრაფესი' },
  { id: 'gemini-pro-latest', label: '🧠 Pro (უახლესი) — ღრმა ანალიზი' },
];

export function loadGeminiSettings(): GeminiSettings {
  if (typeof window === 'undefined') return DEFAULT_GEMINI;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULT_GEMINI, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return DEFAULT_GEMINI;
  }
}

export function saveGeminiSettings(s: GeminiSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function geminiHeaders(): Record<string, string> {
  const s = loadGeminiSettings();
  if (!s.apiKey.trim()) return {};
  return {
    'x-gemini-key': s.apiKey.trim(),
    'x-gemini-mode': s.mode,
    'x-gemini-model': s.fixedModel,
    'x-gemini-complex': s.complexModel.trim(),
  };
}

/** Adds the user's Gemini headers to every same-origin /api/talmud/* request. Idempotent. */
export function installGeminiFetchHeaders() {
  if (typeof window === 'undefined' || (window as any).__geminiFetchPatched) return;
  (window as any).__geminiFetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/api/talmud/')) {
      const extra = geminiHeaders();
      if (Object.keys(extra).length) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        for (const [k, v] of Object.entries(extra)) headers.set(k, v);
        return orig(input, { ...init, headers });
      }
    }
    return orig(input, init);
  };
}
