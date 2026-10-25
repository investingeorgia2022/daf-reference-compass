import { beforeEach, describe, expect, it } from 'vitest';
import { loadAppSettings } from '../talmud/utils/appPreferences';
describe('saved study preferences', () => {
  beforeEach(() => localStorage.clear());
  it('retains currency and nikud when the app reloads', () => {
    localStorage.setItem('talmud_app_settings_v2', JSON.stringify({ uiLang: 'he', defaultCurrency: 'ILS', showNikudByDefault: false, showChavrutaOnDaf: false }));
    expect(loadAppSettings()).toMatchObject({ uiLang: 'he', defaultCurrency: 'ILS', showNikudByDefault: false, showChavrutaOnDaf: false });
  });
  it('migrates legacy language and currency without overwriting saved settings', () => {
    localStorage.setItem('talmud_ui_lang_v1', 'en');
    localStorage.setItem('talmud_default_currency_v1', 'USD');
    expect(loadAppSettings()).toMatchObject({ uiLang: 'en', defaultCurrency: 'USD' });
  });
});