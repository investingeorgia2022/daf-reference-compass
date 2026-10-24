// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Search, Check, X, Plus, UserPlus } from 'lucide-react';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badgeHe?: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isDark?: boolean;
  className?: string;
  compact?: boolean;
  wrapLabels?: boolean;
  variant?: 'classic' | 'modern';
  allowCustomValue?: boolean;
  customValueLabel?: string;
  onAddNewToDb?: (newValue: string) => void;
  addNewToDbPromptLabel?: string;
  theme?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'აირჩიეთ...',
  searchPlaceholder = 'ძიება / გაფილტვრა...',
  isDark = true,
  className = '',
  compact = false,
  wrapLabels = false,
  variant = 'classic',
  allowCustomValue = false,
  customValueLabel = 'თავისუფლად შეყვანა',
  onAddNewToDb,
  addNewToDbPromptLabel = 'წევრების ბაზაში დამატება',
  theme,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 280,
    maxHeight: 280,
  });

  const selectedOption = options.find((o) => o.value === value);

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (opt) =>
      opt.value.toLowerCase() === trimmedQuery.toLowerCase() ||
      opt.label.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const filtered = options.filter((opt) => {
    if (!trimmedQuery) return true;
    const q = trimmedQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badgeHe && opt.badgeHe.toLowerCase().includes(q)) ||
      opt.value.toLowerCase().includes(q)
    );
  });

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(Math.max(rect.width, 260), vw - 16);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));

    const spaceBelow = vh - rect.bottom - 72; // leave clearance for bottom nav bar
    const spaceAbove = rect.top - 60;

    if (spaceBelow >= 210 || spaceBelow >= spaceAbove) {
      const maxHeight = Math.max(180, Math.min(340, spaceBelow));
      setMenuPosition({
        top: Math.round(rect.bottom + 6),
        left: Math.round(left),
        width: Math.round(width),
        maxHeight: Math.round(maxHeight),
      });
    } else {
      const maxHeight = Math.max(180, Math.min(310, spaceAbove));
      setMenuPosition({
        top: Math.max(52, Math.round(rect.top - maxHeight - 6)),
        left: Math.round(left),
        width: Math.round(width),
        maxHeight: Math.round(maxHeight),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    updateMenuPosition();

    const handleScrollOrResize = (e: Event) => {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        dropdownRef.current.contains(e.target)
      ) {
        return;
      }
      updateMenuPosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const scrollTimer = setTimeout(() => {
      const selectedEl = dropdownRef.current?.querySelector('[data-selected="true"]');
      if (selectedEl) {
        try {
          selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
        } catch {
          // ignore
        }
      }
    }, 70);

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const handleSelectOption = (optValue: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onChange(optValue);
    setOpen(false);
  };

  const dropdownPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={dropdownRef}
                data-wrap-labels={wrapLabels ? 'true' : undefined}
                data-searchable-select-portal="true"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -10, scale: 0.96, rotateX: -6 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  zIndex: 100000,
                }}
                className={`rounded-2xl flex flex-col overflow-hidden border-2 shadow-2xl backdrop-blur-xl ${
                  theme === 'celestial-slate'
                    ? 'bg-[#F4F8FC]/98 border-[#BED4EB] text-[#1E293B] shadow-[0_16px_40px_rgba(30,58,95,0.18)]'
                    : isDark
                      ? 'bg-[#1F150E]/98 border-[#C49A6C]/70 text-[#FAF5EB]'
                      : 'bg-[#FAF5EB]/98 border-[#8B5A2B]/70 text-[#1A0F07]'
                }`}
              >
                {/* Live Filter / Free-Type Input inside the Dropdown */}
                <div
                  className={`p-2.5 border-b flex items-center gap-1.5 shrink-0 ${
                    theme === 'celestial-slate'
                      ? 'border-[#BED4EB] bg-[#E2EDF8]'
                      : isDark
                        ? 'border-[#5C3A21] bg-[#2A1D14]'
                        : 'border-[#D4C3A3] bg-[#EFE3CF]'
                  }`}
                >
                  <Search
                    className={`w-3.5 h-3.5 shrink-0 ml-1 ${
                      theme === 'celestial-slate'
                        ? 'text-sky-600'
                        : isDark
                          ? 'text-[#C49A6C]'
                          : 'text-[#8B5A2B]'
                    }`}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus={false}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && trimmedQuery) {
                        e.preventDefault();
                        if (onAddNewToDb && !hasExactMatch) {
                          onAddNewToDb(trimmedQuery);
                        }
                        onChange(trimmedQuery);
                        setOpen(false);
                      }
                    }}
                    placeholder={searchPlaceholder}
                    className={`w-full bg-transparent text-xs font-semibold focus:outline-none ${
                      theme === 'celestial-slate'
                        ? 'text-[#1E293B] placeholder-slate-400'
                        : isDark
                          ? 'text-[#FAF5EB] placeholder-[#A89278]'
                          : 'text-[#1A0F07] placeholder-[#786149]'
                    }`}
                  />
                  {query && (
                    <button
                      type="button"
                      data-raw-btn="true"
                      data-flat-btn="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuery('');
                      }}
                      className={`p-1 rounded-full cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-white/10 text-[#C49A6C]' : 'hover:bg-black/10 text-[#8B5A2B]'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <VoiceSearchMicButton
                    onTranscript={(txt) => setQuery(txt)}
                    currentValue={query}
                  />
                </div>

                <div
                  style={{ maxHeight: `${Math.max(120, menuPosition.maxHeight - 52)}px` }}
                  className="flex-1 overflow-y-auto overscroll-contain space-y-1 p-1.5"
                >
                  {/* Inline Free-Text Option when allowCustomValue is true and user types something new */}
                  {allowCustomValue && trimmedQuery.length > 0 && !hasExactMatch && (
                    <button
                      type="button"
                      data-raw-btn="true"
                      onClick={(e) => handleSelectOption(trimmedQuery, e)}
                      className={`w-full px-3 py-2.5 mb-1 rounded-xl text-left flex items-center justify-between gap-2 text-xs font-extrabold border cursor-pointer transition-all ${
                        isDark
                          ? 'bg-[#3D2817] hover:bg-[#4E341F] text-[#FAF5EB] border-[#C49A6C]'
                          : 'bg-[#EDE0CA] hover:bg-[#E2D2B8] text-[#1A0F07] border-[#8B5A2B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="w-4 h-4 text-[#C49A6C] shrink-0" />
                        <span className="truncate">
                          {customValueLabel}: &ldquo;{trimmedQuery}&rdquo;
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black shrink-0 ${
                          isDark
                            ? 'bg-[#6B4226] text-[#FAF5EB]'
                            : 'bg-[#8B5A2B] text-[#FAF5EB]'
                        }`}
                      >
                        არჩევა
                      </span>
                    </button>
                  )}

                  {/* Inline Member Database Prompt when onAddNewToDb is provided and typed name is not in DB */}
                  {onAddNewToDb && trimmedQuery.length > 1 && !hasExactMatch && (
                    <div
                      className={`p-2.5 mb-1 rounded-xl border space-y-2 ${
                        isDark
                          ? 'bg-[#213527]/90 border-[#4D7C5D] text-[#FAF5EB]'
                          : 'bg-[#EBF3EC] border-[#5E9470] text-[#14291B]'
                      }`}
                    >
                      <div className="text-[11px] font-bold leading-snug">
                        <span className="font-black underline">&ldquo;{trimmedQuery}&rdquo;</span> არ მოიძებნა წევრების ბაზაში. გსურთ დაამატოთ წევრთა ბაზაში?
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          data-raw-btn="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNewToDb(trimmedQuery);
                            onChange(trimmedQuery);
                            setOpen(false);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#3A6B4B] hover:bg-[#2E573C] text-white text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>{addNewToDbPromptLabel}</span>
                        </button>
                        <button
                          type="button"
                          data-raw-btn="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange(trimmedQuery);
                            setOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 text-[#FAF5EB]'
                              : 'bg-black/10 hover:bg-black/15 text-[#1A0F07]'
                          }`}
                        >
                          მხოლოდ არჩევა
                        </button>
                      </div>
                    </div>
                  )}

                  {filtered.length === 0 && !allowCustomValue && !onAddNewToDb ? (
                    <div
                      className={`p-3.5 text-xs text-center font-bold ${
                        isDark ? 'text-[#C49A6C]' : 'text-[#8B5A2B]'
                      }`}
                    >
                      შედეგი ვერ მოიძებნა
                    </div>
                  ) : (
                    filtered.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          data-raw-btn="true"
                          data-selected={isSelected ? 'true' : undefined}
                          onClick={(e) => handleSelectOption(opt.value, e)}
                          className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-all duration-150 cursor-pointer select-none border ${
                            isSelected
                              ? theme === 'celestial-slate'
                                ? 'bg-[#0284C7] text-white font-black border-[#0284C7] shadow-sm'
                                : isDark
                                  ? 'bg-[#5C3A21] text-[#FAF5EB] font-black border-[#C49A6C] shadow-sm'
                                  : 'bg-[#E5D2B3] text-[#1A0F07] font-black border-[#8B5A2B] shadow-sm'
                              : theme === 'celestial-slate'
                                ? 'hover:bg-[#E0EFFC] text-[#1E293B] border-transparent'
                                : isDark
                                  ? 'hover:bg-[#2F2016] text-[#FAF5EB] border-transparent'
                                  : 'hover:bg-[#F2E5D0] text-[#1A0F07] border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={wrapLabels ? 'flex flex-col items-start gap-1' : 'flex items-center gap-2'}>
                              {opt.badgeHe && (
                                <span
                                  dir="rtl"
                                  className={`font-serif font-black px-1.5 py-0.5 rounded-md text-[11px] whitespace-nowrap shrink-0 border ${
                                    theme === 'celestial-slate'
                                      ? isSelected
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-[#E0EFFC] text-[#0369A1] border-[#BAE6FD]'
                                      : isDark
                                        ? 'bg-black/25 text-amber-300 border-[#C49A6C]/40'
                                        : 'bg-white/50 text-[#6B4226] border-[#8B5A2B]/40'
                                  }`}
                                >
                                  {opt.badgeHe}
                                </span>
                              )}
                              <span className={wrapLabels ? 'whitespace-normal break-words' : 'truncate'}>{opt.label}</span>
                            </div>
                            {opt.sublabel && (
                              <div
                                className={`text-[10.5px] ${wrapLabels ? 'whitespace-normal' : 'truncate'} mt-0.5 ${
                                  theme === 'celestial-slate'
                                    ? isSelected
                                      ? 'text-sky-100'
                                      : 'text-slate-500'
                                    : isDark
                                      ? 'text-[#C49A6C]/80'
                                      : 'text-[#7D5531]'
                                }`}
                              >
                                {opt.sublabel}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check
                              className={`w-4 h-4 shrink-0 ${
                                theme === 'celestial-slate'
                                  ? 'text-white'
                                  : isDark
                                    ? 'text-amber-300'
                                    : 'text-[#6B4226]'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {label && (
        <span
          className={`block text-[11px] sm:text-xs font-bold tracking-tight mb-1 truncate ${
            theme === 'celestial-slate'
              ? 'text-slate-800 font-extrabold'
              : isDark
                ? 'text-[#F5E8D8] font-bold'
                : 'text-[#2D1B0F] font-black'
          }`}
        >
          {label}
        </span>
      )}

      <button
        ref={buttonRef}
        type="button"
        data-raw-btn="true"
        data-flat-btn="true"
        aria-label={label || placeholder}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 text-left rounded-xl border transition-all duration-150 cursor-pointer shadow-xs ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
        } ${
          theme === 'celestial-slate'
            ? open
              ? 'bg-white border-sky-500 text-[#1E293B] ring-2 ring-sky-400/20 shadow-sm'
              : 'bg-white/95 hover:bg-[#F0F6FC] border-[#BED4EB] text-[#1E293B]'
            : open
              ? isDark
                ? 'bg-[#291C14] border-[#8A633F] text-[#FAF5EB] ring-2 ring-[#8A633F]/25'
                : 'bg-[#FAF5EC] border-[#8B5A2B] text-[#1E130A] ring-2 ring-[#8B5A2B]/20 shadow-xs'
              : isDark
                ? 'bg-[#231811] hover:bg-[#2C1F16] border-[#443021] text-[#FAF5EB]'
                : 'bg-[#FAF5EC] hover:bg-[#F3EBDD] border-[#D4C3AC] text-[#1E130A]'
        }`}
      >
        <div className={wrapLabels ? 'flex flex-col items-start gap-1 min-w-0 flex-1' : 'flex items-center justify-between gap-1.5 min-w-0 flex-1'}>
          <span className={`${wrapLabels ? 'whitespace-normal break-words' : 'truncate'} font-bold`}>
            {selectedOption ? selectedOption.label : value || placeholder}
          </span>
          {selectedOption?.badgeHe && (
            <span
              dir="rtl"
              className={`font-serif font-black text-[11px] shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded ${
                theme === 'celestial-slate'
                  ? 'text-[#0369A1] bg-[#E0EFFC] border border-[#BAE6FD]'
                  : isDark
                    ? 'text-[#F5D296] bg-[#342217] border border-[#523725]'
                    : 'text-[#6D3F1B] bg-[#EFE4D2] border border-[#DFCBB5]'
              }`}
            >
              {selectedOption.badgeHe}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            theme === 'celestial-slate'
              ? 'text-sky-600'
              : isDark
                ? 'text-[#C49A6C]'
                : 'text-[#8B5A2B]'
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownPortal}
    </div>
  );
};
