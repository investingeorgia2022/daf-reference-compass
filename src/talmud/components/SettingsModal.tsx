// @ts-nocheck
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Database,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Sun,
  Moon,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  History,
  BookOpen,
  Download,
  Coins,
  Palette,
  FileCode,
  Archive,
  FolderArchive,
} from 'lucide-react';
import { AppSettings, AppTheme, RecentlyViewedDaf, UILang } from '../types/talmud';
import { TRACTATES } from '../data/tractates';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { writePreference } from '../utils/appPreferences';
import { GeminiSettingsSection } from './GeminiSettingsSection';
import sourceArchive from '@/assets/talmud-source.zip.asset.json';
import projectArchive from '@/assets/talmud-project.zip.asset.json';

export type AppLanguage = UILang;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  dafFontSizeScale?: number;
  onChangeDafFontSizeScale?: (nextScale: number) => void;
  showAboveDaf: boolean;
  onToggleAboveDaf: (val: boolean) => void;
  showBelowDaf: boolean;
  onToggleBelowDaf: (val: boolean) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  onSelectTheme?: (nextTheme: AppTheme) => void;
  isDark: boolean;
  recentlyViewedDapim?: RecentlyViewedDaf[];
  onSelectRecentDaf?: (tractateId: string, dafId: string) => void;
}

export const LANGUAGE_OPTIONS: {
  id: UILang;
  short: string;
  label: string;
  native: string;
}[] = [
  { id: 'ka', short: 'ქარ', label: 'ქართული', native: 'ქართული (Georgian)' },
  { id: 'he', short: 'עבר', label: 'ებრაული', native: 'עברית (Hebrew)' },
  { id: 'en', short: 'EN', label: 'ინგლისური', native: 'English' },
  { id: 'ru', short: 'RU', label: 'რუსული', native: 'Русский (Russian)' },
  { id: 'fr', short: 'FR', label: 'ფრანგული', native: 'Français (French)' },
  { id: 'es', short: 'ES', label: 'ესპანური', native: 'Español (Spanish)' },
  { id: 'de', short: 'DE', label: 'გერმანული', native: 'Deutsch (German)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  dafFontSizeScale,
  onChangeDafFontSizeScale,
  showAboveDaf,
  onToggleAboveDaf,
  showBelowDaf,
  onToggleBelowDaf,
  theme,
  onToggleTheme,
  onSelectTheme,
  isDark,
  recentlyViewedDapim = [],
  onSelectRecentDaf,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('.settings-dialog');
      const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const timer = window.setTimeout(() => document.querySelector<HTMLElement>('.settings-dialog button')?.focus(), 100);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer); document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [isOpen, onClose]);
  const currentFontScale = dafFontSizeScale ?? settings.dafFontSizeScale ?? 100;
  const [recentSortOrder, setRecentSortOrder] = React.useState<'recent' | 'tractate'>('recent');

  const sortedRecentlyViewedDapim = React.useMemo(() => {
    if (recentSortOrder === 'recent') return recentlyViewedDapim;
    return [...recentlyViewedDapim].sort((a, b) => {
      const idxA = TRACTATES.findIndex((tr) => tr.id === a.tractateId);
      const idxB = TRACTATES.findIndex((tr) => tr.id === b.tractateId);
      const orderA = idxA === -1 ? 999 : idxA;
      const orderB = idxB === -1 ? 999 : idxB;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a.dafId, 10) || 2;
      const numB = parseInt(b.dafId, 10) || 2;
      if (numA !== numB) return numA - numB;
      return a.dafId.localeCompare(b.dafId);
    });
  }, [recentlyViewedDapim, recentSortOrder]);

  const updateFontScale = (nextScale: number) => {
    const clamped = Math.max(70, Math.min(180, Math.round(nextScale)));
    if (onChangeDafFontSizeScale) {
      onChangeDafFontSizeScale(clamped);
    }
    onUpdateSettings({
      ...settings,
      dafFontSizeScale: clamped,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.44, ease: 'easeInOut' }}
          className="settings-overlay fixed inset-0 flex items-center justify-center p-3 sm:p-5"
        >
          <motion.div
            key="settings-modal-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="პარამეტრები"
            className="settings-dialog w-full max-w-xl overflow-hidden"
          >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#5C3A21] via-[#C49A6C] to-[#5C3A21]" />

        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-[#4A3222] bg-[#2C1E14]' : 'border-[#CBB89D] bg-[#E8DCC4]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark
                  ? 'bg-[#6B4226]/40 border-[#C49A6C]/50 text-[#EED9B9]'
                  : 'bg-[#5C3A21] border-[#3E2412] text-[#FBF7F0]'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black tracking-tight truncate">
                პარამეტრების მენიუ • הגדרות מערכת
              </h2>
              <p className="text-[11px] opacity-80 truncate">
                შრიფტის ზომა, ენების არჩევა, Android APK და პანელების მართვა
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#6B4226] text-[#FBF7F0] hover:bg-[#7D4E2D] font-bold cursor-pointer shrink-0 shadow-sm"
            title="დახურვა"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="settings-body p-4 sm:p-5 space-y-4">
          {/* Offline daf database */}
          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('talmud-open-offline-library'));
            }}
            className={`w-full p-4 rounded-2xl border text-start flex items-center gap-3 cursor-pointer ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <Database className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <span className="block text-xs sm:text-sm font-extrabold">დაფების ბაზა ტელეფონში</span>
              <span className="block text-[11px] opacity-80">
                აირჩიეთ ტრაქტატები და შეინახეთ მათი დაფები ინტერნეტის გარეშე მყისიერად გასახსნელად
              </span>
            </span>
          </button>
          {/* 1. Theme Color Design Selection (დიზაინის გადართვა • ნაზი ცისფერი / სერი და სხვა თემები) */}
          <div
            className={`p-4 rounded-2xl border space-y-3.5 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>აპლიკაციის დიზაინის გადართვა • Design & Themes</span>
                </div>
                <div className="text-[11px] opacity-80">
                  აირჩიეთ სასურველი დიზაინი და ფერების გამა მთლიანი აპლიკაციისთვის
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] shadow-sm shrink-0"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>შემდეგი დიზაინი</span>
              </button>
            </div>

            {/* FEATURED: ნაზი ცისფერი / სერი დიზაინის სწრაფი ჩართვა */}
            <div
              onClick={() => onSelectTheme?.('celestial-slate')}
              className={`p-3 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                theme === 'celestial-slate'
                  ? 'bg-gradient-to-r from-sky-900/40 via-sky-800/30 to-slate-900/40 border-sky-400 shadow-md ring-2 ring-sky-400/30'
                  : isDark
                    ? 'bg-[#1C140E] border-[#5C3A21] hover:border-sky-400/60'
                    : 'bg-[#FDFBF7] border-[#CBB89D] hover:border-sky-500/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#475569] border border-white/60 shadow-inner shrink-0 flex items-center justify-center text-sky-950 font-black text-xs">
                  ✦
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-[13px] font-black text-sky-400 dark:text-sky-300">
                      ნაზი ცისფერი / სერი დიზაინი
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      ახალი დიზაინი
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5 line-clamp-1">
                    სუფთა, ნათელი, მშვიდი და თვალისთვის კომფორტული ცისფერ-სერი ფერები
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                {theme === 'celestial-slate' ? (
                  <span className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>არჩეულია ✓</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    data-raw-btn="true"
                    data-flat-btn="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTheme?.('celestial-slate');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-xs cursor-pointer shadow-sm transition-transform active:scale-95"
                  >
                    დიზაინის არჩევა
                  </button>
                )}
              </div>
            </div>

            {/* ALL 5 DESIGNS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {(
                [
                  {
                    id: 'celestial-slate' as AppTheme,
                    titleKa: '1. ნაზი ცისფერი / სერი',
                    subKa: 'ნაზი ცისფერი, ელეგანტური სერი და რბილი კონტრასტი',
                    swatch: 'from-[#E0F2FE] via-[#BAE6FD] to-[#475569]',
                  },
                  {
                    id: 'parchment-day' as AppTheme,
                    titleKa: '2. ვილნის პერგამენტი (დღე)',
                    subKa: 'თბილი კრემისფერი და მუქი კაკლისფერი კონტრასტი',
                    swatch: 'from-[#FBF5E8] via-[#E5D4B7] to-[#5C3A21]',
                  },
                  {
                    id: 'sanctuary-3d' as AppTheme,
                    titleKa: '3. მუქი კაკლის ხე (ღამე)',
                    subKa: 'მუქი კაკლის ხის და ოქროსფერი 3D დიზაინი',
                    swatch: 'from-[#2A1A10] via-[#1B110B] to-[#C49A6C]',
                  },
                  {
                    id: 'jerusalem-stone' as AppTheme,
                    titleKa: '4. იერუსალიმის ოქროს ქვა',
                    subKa: 'იერუსალიმის ქვის თბილი ქარვისფერ-ოქროსფერი ტონალობა',
                    swatch: 'from-[#F5E6C8] via-[#D8B884] to-[#7C4D25]',
                  },
                  {
                    id: 'royal-sapphire' as AppTheme,
                    titleKa: '5. სამეფო საფირონი და ოქრო',
                    subKa: 'ღრმა სამეფო ლურჯი-საფირონისა და ოქროს კონტრასტი',
                    swatch: 'from-[#101C33] via-[#1B2D4F] to-[#D4AF37]',
                  },
                ] as const
              ).map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme(t.id);
                      } else {
                        onToggleTheme();
                      }
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      active
                        ? 'bg-[#6B4226] text-[#FAF5EB] border-[#FAF5EB] shadow-md ring-1 ring-white/40'
                        : isDark
                          ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB] hover:border-[#C49A6C]'
                          : 'bg-[#FBF7F0] border-[#CBB89D] text-[#2C1A10] hover:border-[#6B4226]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.swatch} border border-white/40 shrink-0 shadow-inner`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{t.titleKa}</div>
                        <div
                          className={`text-[10px] truncate ${
                            active ? 'text-[#F5EBD6]' : 'opacity-75'
                          }`}
                        >
                          {t.subKa}
                        </div>
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Talmud Daf Text Font Size Control (Synced across Mishnah, Gemara, Rashi, Tosafot) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div
                className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                  isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                }`}
              >
                <ZoomIn className="w-4 h-4 shrink-0" />
                <span>თალმუდის დაფის ტექსტის ზომა (მიშნა, გემარა, რაში, თოსაფოთი):</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black tabular-nums shrink-0 ${
                  isDark
                    ? 'bg-[#6B4226] border border-[#C49A6C]/40 text-[#FAF5EB]'
                    : 'bg-[#5C3A21] text-[#FBF7F0]'
                }`}
              >
                {currentFontScale}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2.5 w-full">
              <button
                type="button"
                onClick={() => updateFontScale(currentFontScale - 10)}
                disabled={currentFontScale <= 70}
                className={`h-9 w-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 disabled:opacity-40 ${
                  isDark
                    ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C] text-[#EED9B9]'
                    : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
                }`}
                title="ტექსტის დაპატარავება (-10%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="range"
                  aria-label="თალმუდის ტექსტის შრიფტის ზომის სლაიდერი (dafFontSizeScale)"
                  min={70}
                  max={180}
                  step={1}
                  value={currentFontScale}
                  onChange={(e) => updateFontScale(Number(e.target.value))}
                  className="w-full h-2 rounded-lg accent-[#6B4226] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-bold opacity-75 px-0.5 tabular-nums">
                  <span>70% (მცირე)</span>
                  <span>100% (სტანდარტი)</span>
                  <span>140% (დიდი)</span>
                  <span>180% (მაქს.)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateFontScale(currentFontScale + 10)}
                disabled={currentFontScale >= 180}
                className={`h-9 w-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0 disabled:opacity-40 ${
                  isDark
                    ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C] text-[#EED9B9]'
                    : 'bg-[#FBF7F0] border-[#8B5A2B]/40 text-[#2C1A10] hover:bg-white'
                }`}
                title="ტექსტის გადიდება (+10%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {currentFontScale !== 100 && (
                <button
                  type="button"
                  onClick={() => updateFontScale(100)}
                  className="h-9 px-3 rounded-xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  title="საწყის ზომაზე დაბრუნება (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>100%</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full pt-0.5">
              {[80, 90, 100, 115, 135, 160].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateFontScale(preset)}
                  className={`w-full py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all text-center tabular-nums ${
                    currentFontScale === preset
                      ? 'bg-[#6B4226] text-[#FBF7F0] shadow-sm'
                      : isDark
                        ? 'bg-[#1D130D] text-[#FAF5EB] border border-[#5C3A21] hover:border-[#C49A6C]'
                        : 'bg-[#FBF7F0] text-[#2C1A10] border border-[#8B5A2B]/30 hover:bg-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Live Talmudic Text Preview Box */}
            <div
              className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                isDark
                  ? 'bg-[#1B120C] border-[#5C3A21]/80 text-[#FAF5EB]'
                  : 'bg-[#FAF4E4] border-[#8B5A2B]/45 text-[#140E08]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
                <span>ცოცხალი ნიმუში (გემარა • რაში • ქართული):</span>
                <span className="font-mono">{currentFontScale}%</span>
              </div>
              <div
                dir="rtl"
                style={{
                  fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                  fontSize: `${Math.round((16.5 * currentFontScale) / 100)}px`,
                  lineHeight: 1.55,
                }}
                className="font-bold text-right"
              >
                מתני׳ מֵאֵימָתַי מַזְכִּירִין גְּבוּרוֹת גְּשָׁמִים? רַבִּי אֱלִיעֶזֶר אוֹמֵר: מִיּוֹם טוֹב הָרִאשׁוֹן שֶׁל חָג.
              </div>
              <div
                dir="rtl"
                style={{
                  fontFamily: "'Noto Rashi Hebrew', 'David Libre', serif",
                  fontSize: `${Math.round((14 * currentFontScale) / 100)}px`,
                  lineHeight: 1.48,
                }}
                className="opacity-90 text-right border-t border-[#8B5A2B]/25 pt-1"
              >
                <span className="font-black">רש״י ד״ה מאימתי מזכירין:</span> משיב הרוח ומוריד הגשם.
              </div>
              <div
                dir="ltr"
                style={{
                  fontSize: `${Math.round((12.5 * currentFontScale) / 100)}px`,
                  lineHeight: 1.45,
                }}
                className="opacity-85 text-left font-sans"
              >
                რა დროიდან იხსენიებენ „წვიმის ძლიერებას“? რაბი ელიეზერი ამბობს: სუკოთის პირველი დღიდან.
              </div>
            </div>
          </div>

          {/* 2. Symmetric Full-Width Visibility Controls for Above & Below Daf */}
          <div
            className={`p-4 rounded-2xl border space-y-3 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <div
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
              }`}
            >
              თალმუდის დაფის ზედა და ქვედა პანელების ჩვენება:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {/* Card 1: Above Daf Panel */}
              <div
                className={`w-full p-3.5 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                }`}
              >
                <div className="space-y-1 w-full">
                  <div className="text-xs sm:text-sm font-black leading-snug">
                    თალმუდის დაფის ზედა პანელი
                  </div>
                  <div className="text-[11px] opacity-80 leading-relaxed">
                    სედერის, ტრაქტატის, დაფისა და განლაგების სელექტორი
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showAboveDaf;
                    onUpdateSettings({
                      ...settings,
                      defaultShowAboveDaf: nextVal,
                    });
                    onToggleAboveDaf(nextVal);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    showAboveDaf
                      ? 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] shadow-sm'
                      : isDark
                        ? 'bg-[#362519] hover:bg-[#463021] text-[#EED9B9] border border-[#5C3A21]'
                        : 'bg-[#D6C5A9] hover:bg-[#C6B394] text-[#2C1A10]'
                  }`}
                >
                  {showAboveDaf ? (
                    <>
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>ხილულია (ჩართული)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 shrink-0" />
                      <span>დამალულია (გამორთული)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Below Daf Panel */}
              <div
                className={`w-full p-3.5 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isDark ? 'bg-[#1D130D] border-[#5C3A21]' : 'bg-[#FBF7F0] border-[#CBB89D]'
                }`}
              >
                <div className="space-y-1 w-full">
                  <div className="text-xs sm:text-sm font-black leading-snug">
                    თალმუდის დაფის ქვედა პანელი
                  </div>
                  <div className="text-[11px] opacity-80 leading-relaxed">
                    სეფარიას კომენტარები, სუგიის რუკა, ხავრუთა და შენიშვნები
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showBelowDaf;
                    onUpdateSettings({
                      ...settings,
                      defaultShowBelowDaf: nextVal,
                    });
                    onToggleBelowDaf(nextVal);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    showBelowDaf
                      ? 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0] shadow-sm'
                      : isDark
                        ? 'bg-[#362519] hover:bg-[#463021] text-[#EED9B9] border border-[#5C3A21]'
                        : 'bg-[#D6C5A9] hover:bg-[#C6B394] text-[#2C1A10]'
                  }`}
                >
                  {showBelowDaf ? (
                    <>
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>ხილულია (ჩართული)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 shrink-0" />
                      <span>დამალულია (გამორთული)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Recently Viewed Talmud Pages (ბოლოს ნანახი დაფები) + Sort Toggle */}
          {recentlyViewedDapim.length > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-3 w-full ${
                isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDark ? 'text-[#EED9B9]' : 'text-[#4A2E1B]'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>ბოლოს ნანახი დაფები • דפים שנלמדו לאחרונה:</span>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/15 border border-[#8C6239]/30">
                  <button
                    type="button"
                    onClick={() => setRecentSortOrder('recent')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                      recentSortOrder === 'recent'
                        ? 'bg-[#6B4226] text-[#FAF5EB] shadow-sm'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    ბოლოს ნანახით
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentSortOrder('tractate')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                      recentSortOrder === 'tractate'
                        ? 'bg-[#6B4226] text-[#FAF5EB] shadow-sm'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    ტრაქტატის რიგით
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {sortedRecentlyViewedDapim.map((item) => (
                  <button
                    key={`${item.tractateId}:${item.dafId}`}
                    type="button"
                    onClick={() => {
                      if (onSelectRecentDaf) {
                        onSelectRecentDaf(item.tractateId, item.dafId);
                        onClose();
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C] text-[#FAF5EB]'
                        : 'bg-[#FBF7F0] border-[#CBB89D] hover:border-[#6B4226] text-[#2C1A10]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#8B5A2B] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">
                          {item.tractateNameKa} • დაფი {item.dafId}
                        </div>
                        <div
                          dir="rtl"
                          className={`text-[11px] font-serif truncate ${
                            isDark ? 'text-[#EED9B9]' : 'text-[#5C3A21] font-bold'
                          }`}
                        >
                          מסכת {item.tractateNameHe} דף {item.dafId}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#6B4226] text-[#FBF7F0] shrink-0">
                      გადასვლა
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <GeminiSettingsSection isDark={isDark} />

          {/* 3b. Project & Android APK Export & Direct Download Card */}
          <div
            className={`p-4 rounded-2xl border space-y-3.5 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-[#C49A6C] shrink-0" />
                  <span>პროექტის ჩამოტვირთვა</span>
                </div>
                <div className="text-[11px] opacity-80">
                  სორსის არქივი და სრული პროექტი
                </div>
              </div>
            </div>

            {/* Source Code & Full Project ZIPs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <a
                href={sourceArchive.url}
                download="talmud-source-code-only.zip"
                className="w-full py-2.5 px-3 rounded-xl border border-amber-500/70 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <span className="truncate">Source Code ZIP</span>
              </a>

              <a
                href={projectArchive.url}
                download="talmud-project-source.zip"
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 ${
                  isDark
                    ? 'bg-[#1D130D] border-[#5C3A21] hover:border-[#C49A6C] text-[#FAF5EB]'
                    : 'bg-[#FBF7F0] border-[#CBB89D] hover:border-[#6B4226] text-[#2C1A10]'
                }`}
              >
                <FolderArchive className="w-4 h-4 text-[#C49A6C] shrink-0" />
                <span className="truncate">Full Project ZIP</span>
              </a>
            </div>


          </div>


          {/* 4b. Language Version Selection (ქართული • עברית • English + 4 Languages) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#E2CEAE] border-[#7A5130]'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                isDark ? 'text-[#EED9B9]' : 'text-[#1E1108]'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>აპლიკაციის ენა (ქართული • עברית • English):</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = settings.uiLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        uiLang: lang.id,
                      });
                      try {
                        localStorage.setItem('talmud_ui_lang_v1', lang.id);
                        window.dispatchEvent(
                          new CustomEvent('talmud-ui-lang-changed', { detail: lang.id })
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] font-black shadow-sm'
                        : isDark
                          ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB] hover:border-[#C49A6C]'
                          : 'bg-[#F4E8D1] border-[#6E472B]/55 text-[#1A0E06] hover:border-[#6B4226]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">{lang.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          active ? 'text-[#F5EBD6] font-bold' : 'opacity-80'
                        }`}
                      >
                        {lang.native}
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4c. Default Currency (ვალუტა ბაი დიფოლტ: GEL ₾ • USD $ • ILS ₪ • EUR €) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#E2CEAE] border-[#7A5130]'
            }`}
          >
            <div
              className={`flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider ${
                isDark ? 'text-[#EED9B9]' : 'text-[#1E1108]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 shrink-0 text-amber-400" />
                <span>ძირითადი ვალუტა (Default Currency):</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                {settings.defaultCurrency || 'GEL'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {[
                { id: 'GEL', symbol: '₾', nameKa: 'ქართული ლარი (GEL)', nameHe: 'לארי גיאורגי' },
                { id: 'USD', symbol: '$', nameKa: 'აშშ დოლარი (USD)', nameHe: 'דולר אמריקאי' },
                { id: 'ILS', symbol: '₪', nameKa: 'ახალი შეკელი (ILS)', nameHe: 'שקל ישראלי' },
                { id: 'EUR', symbol: '€', nameKa: 'ევროპული ევრო (EUR)', nameHe: 'אירו אירופי' },
              ].map((curr) => {
                const active = (settings.defaultCurrency || 'GEL') === curr.id;
                return (
                  <button
                    key={curr.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        defaultCurrency: curr.id as any,
                      });
                      try {
                        localStorage.setItem('talmud_default_currency_v1', curr.id);
                        window.dispatchEvent(
                          new CustomEvent('talmud-default-currency-changed', { detail: curr.id })
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      active
                        ? 'bg-[#6B4226] text-[#FBF7F0] border-[#C49A6C] font-black shadow-sm ring-1 ring-[#C49A6C]'
                        : isDark
                          ? 'bg-[#1D130D] border-[#5C3A21] text-[#FAF5EB] hover:border-[#C49A6C]'
                          : 'bg-[#F4E8D1] border-[#6E472B]/55 text-[#1A0E06] hover:border-[#6B4226]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black flex items-center gap-1.5 truncate">
                        <span className="text-amber-400 font-bold text-sm">{curr.symbol}</span>
                        <span>{curr.id}</span>
                      </div>
                      <div className="text-[10px] opacity-80 truncate">{curr.nameKa}</div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          </div>



          {/* 6. Default Nikud (ניקוד) Toggle Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${
              isDark ? 'bg-[#2A1D14] border-[#5C3A21]' : 'bg-[#EFE5D0] border-[#CBB89D]'
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-extrabold">
                ניקוד / ნიკუდით ჩვენება (ხმოვნების ნიშნები ებრაულ ტექსტში)
              </div>
              <div className="text-[11px] opacity-80">
                ჩართეთ ან გამორთეთ ებრაული ნიკუდი (ניקוד) მთელ აპლიკაციაში
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextNikud = !(settings.showNikudByDefault ?? true);
                onUpdateSettings({
                  ...settings,
                  showNikudByDefault: nextNikud,
                });
                writePreference('talmud_sacred_nikud_v1', String(nextNikud));
                writePreference('talmud_blessings_nikud_v1', String(nextNikud));
              }}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 ${
                (settings.showNikudByDefault ?? true)
                  ? 'bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FBF7F0]'
                  : isDark
                    ? 'bg-[#362519] text-[#EED9B9] border border-[#5C3A21]'
                    : 'bg-[#D6C5A9] text-[#2C1A10]'
              }`}
            >
              <span>
                ניקוד / ნიკუდი: {(settings.showNikudByDefault ?? true) ? 'ჩართულია ✓' : 'გამორთულია'}
              </span>
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
