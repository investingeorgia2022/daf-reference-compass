import type { AppSettings } from '../types/talmud';

export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Keep the current in-memory state. */ }
}
export function loadAppSettings(): AppSettings {
  let saved: Partial<AppSettings> = {};
  try { saved = JSON.parse(readPreference('talmud_app_settings_v2') || '{}') || {}; } catch { /* Use defaults. */ }
  return {
    ...saved,
    defaultShowAboveDaf: saved.defaultShowAboveDaf ?? true,
    defaultShowBelowDaf: saved.defaultShowBelowDaf ?? false,
    uiLang: saved.uiLang || readPreference('talmud_ui_lang_v1') as AppSettings['uiLang'] || readPreference('talmud_ui_lang') as AppSettings['uiLang'] || 'ka',
    defaultCurrency: saved.defaultCurrency || readPreference('talmud_default_currency_v1') as AppSettings['defaultCurrency'] || 'GEL',
    dafFontSizeScale: Math.max(70, Math.min(180, Number(saved.dafFontSizeScale) || 100)),
    showNikudByDefault: saved.showNikudByDefault ?? (readPreference('talmud_sacred_nikud_v1') !== 'false'),
  };
}