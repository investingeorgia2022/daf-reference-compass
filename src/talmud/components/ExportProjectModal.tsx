// @ts-nocheck
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Download,
  FileCode,
  Archive,
  Smartphone,
  Copy,
  Check,
  PackageCheck,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';

interface ExportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ExportProjectModal: React.FC<ExportProjectModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    const full = window.location.origin + url;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedUrl(id);
      setTimeout(() => setCopiedUrl(null), 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col ${
              isDark
                ? 'bg-[#18110B] border-[#5C3A21] text-[#FAF5EB]'
                : 'bg-[#FDF9F2] border-[#CBB89D] text-[#1E1108]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b backdrop-blur-md ${
                isDark
                  ? 'bg-[#18110B]/95 border-[#452714]'
                  : 'bg-[#FDF9F2]/95 border-[#E5D7C3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-md">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>პროექტის ექსპორტი და ჩამოტვირთვა</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      /export
                    </span>
                  </h2>
                  <p className="text-xs opacity-75">
                    ჩამოტვირთეთ კოდი (ZIP), სრული პროექტი ან მობილური Android APK
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="დახურვა"
              >
                <X className="w-5 h-5 opacity-70 hover:opacity-100" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-7 space-y-5">
              {/* Card 1: Source Code Only (Recommended) */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#24170E] border-[#5C3A21] hover:border-amber-500/60'
                    : 'bg-[#F4ECDE] border-[#D4C3AB] hover:border-amber-600/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base">
                          Source Code ZIP (კოდის არქივი)
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          რეკომენდებული • ~910 KB
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-1 leading-relaxed">
                        შეიცავს მთლიან <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">src/</code> საქაღალდეს,
                        ყველა კომპონენტს, გასწორებულ ფილტრებსა და ნავიგაციას, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">package.json</code>,
                        <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">vite.config.ts</code> და კონფიგურაციებს.
                        იდეალურია ახალ AI Studio სესიაში გადასატანად ან GitHub-ზე სამუშაოდ.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="/export/talmud-source-code-only.zip"
                    download="talmud-source-code-only.zip"
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ჩამოტვირთეთ Source Code ZIP</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink('/export/talmud-source-code-only.zip', 'source')}
                    className="py-2.5 px-3 rounded-xl border border-amber-600/30 hover:bg-amber-500/10 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="პირდაპირი ბმულის კოპირება"
                  >
                    {copiedUrl === 'source' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">დაკოპირდა!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                        <span>ბმულის კოპირება</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Full Project ZIP (Code + Public Assets) */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#24170E] border-[#5C3A21] hover:border-amber-500/60'
                    : 'bg-[#F4ECDE] border-[#D4C3AB] hover:border-amber-600/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base">
                          Full Project ZIP (სრული პროექტი ასეტებით)
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                          სრული პაკეტი • ~19 MB
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-1 leading-relaxed">
                        შეიცავს სრულ პროექტს კოდით, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">public/</code> ასეტებით,
                        PDF ფაილებით, შრიფტებით, იკონებითა და PWA მანიფესტებით.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="/export/talmud-project-source.zip"
                    download="talmud-project-source.zip"
                    className="py-2.5 px-4 rounded-xl bg-[#2C1A10] dark:bg-[#FAF5EB] hover:bg-[#3D2517] dark:hover:bg-white text-[#FAF5EB] dark:text-[#18110B] font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ჩამოტვირთეთ Full Project ZIP</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink('/export/talmud-project-source.zip', 'full')}
                    className="py-2.5 px-3 rounded-xl border border-stone-500/30 hover:bg-stone-500/10 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="პირდაპირი ბმულის კოპირება"
                  >
                    {copiedUrl === 'full' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">დაკოპირდა!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                        <span>ბმულის კოპირება</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 3: Android APK & Mobile Bundle */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#24170E] border-[#5C3A21]'
                    : 'bg-[#F4ECDE] border-[#D4C3AB]'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm sm:text-base">
                        Android APK და მობილური პაკეტი
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        Android 8.0+
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-1 leading-relaxed">
                      დააინსტალირეთ მზა აპლიკაცია თქვენს Android სმარტფონსა თუ პლანშეტზე პირდაპირი APK ფაილით.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href="/export/Talmud-Bavli-3D-Georgia.apk"
                    download="Talmud-Bavli-3D-Georgia.apk"
                    className="py-2.5 px-3 rounded-xl border border-amber-600 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-200" />
                    <span className="truncate">Talmud-Bavli-3D-Georgia.apk (1.5 MB)</span>
                  </a>

                  <a
                    href="/export/Talmud-Bavli-3D-APK-Export.zip"
                    download="Talmud-Bavli-3D-APK-Export.zip"
                    className={`py-2.5 px-3 rounded-xl border font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                      isDark
                        ? 'bg-[#18110B] border-[#5C3A21] hover:border-amber-500 text-[#FAF5EB]'
                        : 'bg-white border-[#D4C3AB] hover:border-amber-600 text-[#1E1108]'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="truncate">APK Export Bundle (.ZIP 1.2 MB)</span>
                  </a>
                </div>
              </div>

              {/* Instructions for New Session */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                  isDark
                    ? 'bg-amber-950/20 border-amber-600/30 text-amber-100/90'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="font-black flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>როგორ გადავიტანოთ ახალ Google AI Studio სესიაში:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 opacity-90">
                  <li>ჩამოტვირთეთ ზემოთ მოცემული <strong>Source Code ZIP</strong> ფაილი.</li>
                  <li>AI Studio-ს მარცხენა მენიუში დააჭირეთ <strong>+ (New Chat)</strong> ღილაკს.</li>
                  <li>ატვირთეთ გადმოწერილი ZIP ფაილი და მიუთითეთ: <em>„გაშალე ეს პროექტი და განაგრძე მუშაობა“</em>.</li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`px-5 sm:px-7 py-3.5 border-t flex justify-end ${
                isDark ? 'border-[#452714] bg-[#140E09]' : 'border-[#E5D7C3] bg-[#F7F0E4]'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 font-bold text-xs transition-colors cursor-pointer"
              >
                დახურვა
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
