// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, ZoomIn, ZoomOut, Languages, Loader2 } from 'lucide-react';
import {
  sanitizeGeorgianText,
  translateToGeorgianLive,
} from '../utils/georgianTranslator';

export interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  hebrewText?: string;
  georgianText: string;
  isDark?: boolean;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  hebrewText,
  georgianText,
}) => {
  const [fontScale, setFontScale] = useState<number>(110);
  const [showGeorgian, setShowGeorgian] = useState<boolean>(!hebrewText);
  const [resolvedGeorgianParagraphs, setResolvedGeorgianParagraphs] = useState<string[]>([]);
  const [isTranslatingModalKa, setIsTranslatingModalKa] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setShowGeorgian(!hebrewText);
    }
  }, [isOpen, hebrewText]);

  useEffect(() => {
    if (!isOpen || (!georgianText && !hebrewText)) {
      setResolvedGeorgianParagraphs([]);
      return;
    }

    let cancelled = false;
    const paragraphs = (georgianText || '').split(/\n\n+/);
    const heParagraphs = (hebrewText || '').split(/\n\n+/);
    const needsLiveTranslation = paragraphs.some(
      (p, idx) =>
        /[A-Za-z]{3,}/.test(p) ||
        p.includes('კლასიკური განმარტება') ||
        p.includes('კლასიკური პეშატი') ||
        p.includes('სინაის მთიდან გადმოცემული') ||
        (p.replace(/^\(\d+\)\s*[^:]*:\s*/, '').trim().length < 6 && Boolean(heParagraphs[idx]))
    );

    const immediateCleaned = paragraphs.map((p) =>
      sanitizeGeorgianText(p)
        .replace(/[A-Za-z]{2,}[^()\n]*/g, '')
        .replace(/[\u0590-\u05FF]+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    );

    setResolvedGeorgianParagraphs(immediateCleaned);

    if (!needsLiveTranslation) {
      setIsTranslatingModalKa(false);
      return;
    }

    setIsTranslatingModalKa(true);
    Promise.all(
      paragraphs.map(async (para, idx) => {
        const prefixMatch = para.match(/^(\(\d+\)\s*[^:]+:\s*)/);
        const prefixKa = prefixMatch
          ? sanitizeGeorgianText(prefixMatch[1]).replace(/[A-Za-z\u0590-\u05FF]+/g, '').trim() + ' '
          : `(${idx + 1}) `;
        const bodyPart = prefixMatch ? para.slice(prefixMatch[1].length).trim() : para.trim();
        const hasEng = /[A-Za-z]{3,}/.test(bodyPart);
        const isPlaceholder =
          !bodyPart ||
          bodyPart.includes('კლასიკური განმარტება') ||
          bodyPart.includes('კლასიკური პეშატი') ||
          bodyPart.includes('სინაის მთიდან გადმოცემული');

        if (!hasEng && !isPlaceholder && bodyPart.length >= 6) {
          return `${prefixKa}${sanitizeGeorgianText(bodyPart).replace(/[A-Za-z\u0590-\u05FF]+/g, '').trim()}`;
        }

        const sourceForTranslation = hasEng
          ? bodyPart.replace(/[\u0590-\u05FF]+/g, ' ').trim()
          : (heParagraphs[idx] || '').replace(/^\([^)]+\)\s*/, '').trim() || bodyPart;

        if (!sourceForTranslation) {
          return sanitizeGeorgianText(para).replace(/[A-Za-z\u0590-\u05FF]+/g, '').trim();
        }

        try {
          const translated = await translateToGeorgianLive(
            sourceForTranslation,
            hasEng ? 'en' : 'iw'
          );
          const cleanTranslated = sanitizeGeorgianText(translated || '')
            .replace(/[A-Za-z]{2,}/g, '')
            .replace(/[\u0590-\u05FF]+/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          return cleanTranslated ? `${prefixKa}${cleanTranslated}` : prefixKa.trim();
        } catch {
          return sanitizeGeorgianText(para).replace(/[A-Za-z\u0590-\u05FF]+/g, '').trim();
        }
      })
    )
      .then((translatedParagraphs) => {
        if (cancelled) return;
        setResolvedGeorgianParagraphs(translatedParagraphs);
      })
      .finally(() => {
        if (!cancelled) setIsTranslatingModalKa(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, georgianText, hebrewText]);

  const hebrewParagraphs = (hebrewText || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="fullscreen-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[240] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
        >
          <motion.div
            key="fullscreen-modal-card"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[92dvh] rounded-3xl crystal-daf-folio flex flex-col overflow-hidden"
          >
            {/* Clean Single-Line Delicate Crystal Header */}
            <div className="px-3.5 sm:px-5 py-2.5 crystal-daf-header border-b border-sky-200/80 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-black text-[#0F1E36] truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p
                    dir="rtl"
                    className="text-[11px] font-serif font-bold text-[#92400E] truncate text-left"
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Streamlined Icon-Only Controls on One Row */}
              <div className="flex items-center gap-1.5 shrink-0">
                {hebrewText && georgianText && (
                  <button
                    type="button"
                    data-raw-btn="true"
                    onClick={() => setShowGeorgian((v) => !v)}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all shadow-2xs ${
                      showGeorgian
                        ? 'bg-amber-400/30 border-amber-400 text-[#92400E]'
                        : 'bg-white/85 hover:bg-sky-50 border-sky-200/90 text-[#1E334C]'
                    }`}
                    title={
                      showGeorgian
                        ? 'ქართული თარგმანის დამალვა'
                        : 'ქართული თარგმანის ჩვენება'
                    }
                    aria-label="ქართული თარგმანი"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={() => setFontScale((s) => Math.max(80, s - 10))}
                  className="w-8 h-8 rounded-xl bg-white/85 hover:bg-sky-50 border border-sky-200/90 text-[#1E334C] flex items-center justify-center cursor-pointer transition-all shadow-2xs"
                  title="შრიფტის დაპატარავება"
                  aria-label="შრიფტის დაპატარავება"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={() => setFontScale((s) => Math.min(175, s + 10))}
                  className="w-8 h-8 rounded-xl bg-white/85 hover:bg-sky-50 border border-sky-200/90 text-[#1E334C] flex items-center justify-center cursor-pointer transition-all shadow-2xs"
                  title="შრიფტის გადიდება"
                  aria-label="შრიფტის გადიდება"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  data-raw-btn="true"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/90 hover:bg-rose-50 border border-sky-300/80 text-[#0F1E36] hover:text-rose-700 flex items-center justify-center cursor-pointer transition-all shadow-2xs"
                  title="დახურვა"
                  aria-label="დახურვა"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Clean Uncluttered Reading Surface (No Double Borders, No Clipped Top Lines) */}
            <div className="p-2.5 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-2xl crystal-daf-pane px-4 sm:px-7 py-5 sm:py-6 space-y-5">
                {hebrewParagraphs.length > 0 ? (
                  hebrewParagraphs.map((paraHe, idx) => {
                    const kaPara = resolvedGeorgianParagraphs[idx] || '';
                    const leadMatch = paraHe.match(/^(\([^)]+\)\s*[^:.]+[:.]\s*|\([^)]+\)\s*|[^:]{2,36}:\s*)/);
                    const leadPart = leadMatch ? leadMatch[1] : '';
                    const restPart = leadMatch ? paraHe.slice(leadPart.length) : paraHe;

                    return (
                      <div
                        key={`fs-para-${idx}`}
                        className="pb-4 last:pb-0 border-b border-sky-200/60 last:border-b-0"
                      >
                        <div
                          dir="rtl"
                          style={{
                            fontSize: `${Math.round((22 * fontScale) / 100)}px`,
                            lineHeight: 1.85,
                            fontFamily: "'Frank Ruhl Libre', 'David Libre', serif",
                          }}
                          className="text-justify font-semibold text-[#0B1324] pt-1"
                        >
                          {leadPart && (
                            <span className="font-black text-[#1E334C] ml-1">
                              {leadPart}
                            </span>
                          )}
                          <span>{restPart}</span>
                        </div>

                        {showGeorgian && kaPara && (
                          <div
                            dir="ltr"
                            style={{
                              fontSize: `${Math.round((15 * fontScale) / 100)}px`,
                              lineHeight: 1.65,
                            }}
                            className="mt-2.5 px-3.5 py-2 rounded-xl bg-sky-50/70 border border-sky-200/80 text-[#0F1E36] font-medium text-left"
                          >
                            {kaPara}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      fontSize: `${Math.round((16 * fontScale) / 100)}px`,
                      lineHeight: 1.7,
                    }}
                    className="whitespace-pre-line font-medium text-[#0F1E36]"
                  >
                    {isTranslatingModalKa && (
                      <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 mb-3 pb-2 border-b border-sky-200/70">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>მიმდინარეობს ქართული თარგმანის მომზადება...</span>
                      </div>
                    )}
                    {resolvedGeorgianParagraphs.join('\n\n')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
