// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  HardDrive,
  Download,
  CheckCircle2,
  Wifi,
  WifiOff,
  Trash2,
  Loader2,
  FolderDown,
  Upload,
  Sparkles,
  Search,
  BookOpen,
  Square,
  Database,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  PieChart,
  BarChart3,
  Layers,
  AlertCircle,
  Check,
  FileArchive,
} from 'lucide-react';
import { DafPageData, TractateInfo } from '../types/talmud';
import { SEDARIM, TRACTATES, generateDafListForTractate } from '../data/tractates';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import {
  OfflineStorageStats,
  PackDownloadProgress,
  clearAllOfflineStorage,
  deleteOfflineDaf,
  deleteOfflineTractate,
  downloadAndCacheDafOffline,
  downloadTractateOfflinePack,
  exportOfflineLibraryBackup,
  formatBytesKa,
  getAllOfflineStorageStats,
  importOfflineLibraryBackup,
  saveDafToOfflineStorage,
} from '../utils/offlineTalmudStorage';
import { OfflineDafDatabaseBuilder } from './OfflineDafDatabaseBuilder';

interface OfflineLibraryPanelProps {
  currentDafData: DafPageData;
  isDark: boolean;
  onNavigateToDaf: (tractateId: string, dafId: string) => void;
  onCloseModal?: () => void;
}

export const OfflineLibraryPanel: React.FC<OfflineLibraryPanelProps> = ({
  currentDafData,
  isDark,
  onNavigateToDaf,
  onCloseModal,
}) => {
  const [subTab, setSubTab] = useState<'status-visualization' | 'packs' | 'cached-dapim'>('status-visualization');
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'partial' | 'none'>('all');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [swActive, setSwActive] = useState<boolean>(true);
  const [stats, setStats] = useState<OfflineStorageStats>({
    items: [],
    byTractate: {},
    totalDapimCount: 0,
    totalSizeBytes: 0,
    workboxSefariaCount: 0,
    workboxTranslationsCount: 0,
  });

  const [selectedSeder, setSelectedSeder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeTranslationsOnPack, setIncludeTranslationsOnPack] = useState<boolean>(true);
  const [activeProgress, setActiveProgress] = useState<PackDownloadProgress | null>(null);
  const [savingCurrentDaf, setSavingCurrentDaf] = useState<boolean>(false);
  const [statusBannerMsg, setStatusBannerMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshStats = useCallback(async () => {
    const nextStats = await getAllOfflineStorageStats();
    setStats(nextStats);
  }, []);

  useEffect(() => {
    refreshStats();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleStorageUpdated = () => {
      refreshStats();
    };
    const handleSwStatus = () => {
      setSwActive(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('talmud-offline-updated', handleStorageUpdated);
    window.addEventListener('talmud-sw-status', handleSwStatus);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) setSwActive(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('talmud-offline-updated', handleStorageUpdated);
      window.removeEventListener('talmud-sw-status', handleSwStatus);
    };
  }, [refreshStats]);

  const sederOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        badgeHe: 'כל הש״ס',
        label: 'ყველა სედერი (37 ტრაქტატი)',
        sublabel: 'ბაბილონის თალმუდის სრული ოფლაინ კატალოგი',
      },
      ...SEDARIM.map((s) => ({
        value: s.id,
        badgeHe: s.nameHe,
        label: `${s.nameKa} (${s.nameEn})`,
        sublabel: `სედერი ${s.nameKa}`,
      })),
    ],
    []
  );

  const filteredTractates = useMemo(() => {
    return TRACTATES.filter((tr) => {
      if (selectedSeder !== 'all' && tr.sederId !== selectedSeder) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tr.nameKa.toLowerCase().includes(q) ||
        tr.nameHe.includes(q) ||
        tr.nameEn.toLowerCase().includes(q) ||
        tr.descriptionKa.toLowerCase().includes(q)
      );
    });
  }, [selectedSeder, searchQuery]);

  const filteredCachedItems = useMemo(() => {
    if (!searchQuery.trim()) return stats.items;
    const q = searchQuery.toLowerCase();
    return stats.items.filter(
      (item) =>
        item.tractateNameKa.toLowerCase().includes(q) ||
        item.tractateNameHe.includes(q) ||
        item.dafId.toLowerCase().includes(q) ||
        item.tractateId.toLowerCase().includes(q)
    );
  }, [stats.items, searchQuery]);

  const isCurrentDafSaved = useMemo(() => {
    const key = `${currentDafData.tractateId}:${currentDafData.dafId}`;
    return stats.items.some((i) => i.key === key);
  }, [stats.items, currentDafData.tractateId, currentDafData.dafId]);

  const handleSaveCurrentDafManual = async () => {
    setSavingCurrentDaf(true);
    try {
      await saveDafToOfflineStorage(currentDafData, 'manual');
      const tr = TRACTATES.find((t) => t.id === currentDafData.tractateId);
      if (tr && isOnline) {
        await downloadAndCacheDafOffline(tr, currentDafData.dafId, {
          translateGeorgian: true,
          source: 'manual',
        });
      }
      await refreshStats();
      setStatusBannerMsg(
        `დაფი ${currentDafData.tractateNameKa} ${currentDafData.dafId} წარმატებით შეინახა Workbox & IndexedDB ოფლაინ საცავში!`
      );
      setTimeout(() => setStatusBannerMsg(null), 4000);
    } finally {
      setSavingCurrentDaf(false);
    }
  };

  const handleDownloadPack = async (
    tractate: TractateInfo,
    mode: 'quick-10' | 'full-tractate'
  ) => {
    if (activeProgress) {
      abortControllerRef.current?.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const allDapim = generateDafListForTractate(tractate.lastDaf);
    const targetDapim = mode === 'quick-10' ? allDapim.slice(0, 10) : allDapim;

    try {
      const res = await downloadTractateOfflinePack({
        tractate,
        dafIds: targetDapim,
        translateGeorgian: includeTranslationsOnPack,
        signal: controller.signal,
        onProgress: (prog) => {
          setActiveProgress(prog);
        },
      });
      await refreshStats();
      if (!res.aborted) {
        setStatusBannerMsg(
          `ტრაქტატი „${tractate.nameKa}“ (${res.downloadedCount} დაფი) სრულად ჩამოიტვირთა ოფლაინ ბიბლიოთეკაში!`
        );
        setTimeout(() => setStatusBannerMsg(null), 5000);
      }
    } finally {
      setActiveProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleDownloadGoldenShasPack = async () => {
    if (activeProgress) {
      abortControllerRef.current?.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const keyTractates = ['Berakhot', 'Shabbat', 'Pesachim', 'Yoma', 'Taanit', 'Megillah', 'Bava_Kamma', 'Bava_Metzia', 'Sanhedrin', 'Pirkei_Avot'];
    const selectedTrs = TRACTATES.filter((t) => keyTractates.includes(t.id));

    try {
      for (let idx = 0; idx < selectedTrs.length; idx++) {
        if (controller.signal.aborted) break;
        const tr = selectedTrs[idx];
        const dapim = ['2a', '2b'];
        for (const dafId of dapim) {
          if (controller.signal.aborted) break;
          setActiveProgress({
            tractateId: tr.id,
            tractateNameKa: tr.nameKa,
            currentDafId: dafId,
            completedDapim: idx * 2 + (dafId === '2b' ? 1 : 0),
            totalDapim: selectedTrs.length * 2,
            percent: Math.round(((idx * 2 + (dafId === '2b' ? 2 : 1)) / (selectedTrs.length * 2)) * 100),
            statusText: `ოქროს ფონდის კეშირება: ${tr.nameKa} (${tr.nameHe}) • დაფი ${dafId}...`,
          });
          await downloadAndCacheDafOffline(tr, dafId, {
            translateGeorgian: true,
            source: 'pack-download',
          });
        }
      }
      await refreshStats();
      setStatusBannerMsg(
        'შასის ოქროს ფონდის საბაზისო პაკეტი წარმატებით შეინახა ოფლაინ წასაკითხად!'
      );
      setTimeout(() => setStatusBannerMsg(null), 5000);
    } finally {
      setActiveProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleStopDownload = () => {
    abortControllerRef.current?.abort();
    setActiveProgress(null);
  };

  const handleExportBackup = async () => {
    const json = await exportOfflineLibraryBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talmud-bavli-offline-pack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importOfflineLibraryBackup(text);
      await refreshStats();
      setStatusBannerMsg(`წარმატებით იმპორტირდა ${count} ოფლაინ დაფი ბექაპ ფაილიდან!`);
      setTimeout(() => setStatusBannerMsg(null), 4000);
    } catch {
      setStatusBannerMsg('ფაილის იმპორტი ვერ მოხერხდა. შეამოწმეთ JSON ფორმატი.');
      setTimeout(() => setStatusBannerMsg(null), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Dedicated Seder batch downloader — Downloads all remaining/uncached dapim in a specific Seder
   */
  const handleDownloadSeder = async (sederId: string) => {
    if (activeProgress) {
      abortControllerRef.current?.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const targetSeder = SEDARIM.find((s) => s.id === sederId);
    const sederTractates = TRACTATES.filter((t) => t.sederId === sederId);

    // Compute remaining uncached dapim in this seder
    const uncachedTasks: { tractate: TractateInfo; dafId: string }[] = [];
    for (const tr of sederTractates) {
      const allDapim = generateDafListForTractate(tr.lastDaf);
      const cachedForTr = stats.byTractate[tr.id] || [];
      const cachedDafSet = new Set(cachedForTr.map((item) => item.dafId));
      for (const dId of allDapim) {
        if (!cachedDafSet.has(dId)) {
          uncachedTasks.push({ tractate: tr, dafId: dId });
        }
      }
    }

    if (uncachedTasks.length === 0) {
      setStatusBannerMsg(
        `სედერი „${targetSeder?.nameKa || sederId}“ უკვე 100% სრულად კეშირებულია ოფლაინ!`
      );
      setTimeout(() => setStatusBannerMsg(null), 4000);
      return;
    }

    try {
      for (let idx = 0; idx < uncachedTasks.length; idx++) {
        if (controller.signal.aborted) break;
        const { tractate, dafId } = uncachedTasks[idx];
        const completed = idx;
        const percent = Math.round(((idx + 1) / uncachedTasks.length) * 100);

        setActiveProgress({
          tractateId: tractate.id,
          tractateNameKa: tractate.nameKa,
          currentDafId: dafId,
          completedDapim: completed,
          totalDapim: uncachedTasks.length,
          percent,
          statusText: `სედერ ${targetSeder?.nameKa || ''}: ${tractate.nameKa} (${tractate.nameHe}) • დაფი ${dafId} (${idx + 1}/${uncachedTasks.length})...`,
        });

        await downloadAndCacheDafOffline(tractate, dafId, {
          translateGeorgian: includeTranslationsOnPack,
          source: 'pack-download',
        });
      }
      await refreshStats();
      if (!controller.signal.aborted) {
        setStatusBannerMsg(
          `სედერი „${targetSeder?.nameKa || sederId}“ (${uncachedTasks.length} დაფი) წარმატებით ჩამოიტვირთა ოფლაინ ბიბლიოთეკაში!`
        );
        setTimeout(() => setStatusBannerMsg(null), 5000);
      }
    } finally {
      setActiveProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleClearSederCache = async (sederId: string) => {
    const targetSeder = SEDARIM.find((s) => s.id === sederId);
    const sederTractates = TRACTATES.filter((t) => t.sederId === sederId);
    for (const tr of sederTractates) {
      await deleteOfflineTractate(tr.id);
    }
    await refreshStats();
    setStatusBannerMsg(`სედერის „${targetSeder?.nameKa || sederId}“ კეში გასუფთავდა.`);
    setTimeout(() => setStatusBannerMsg(null), 3500);
  };

  // Comprehensive per-tractate cache status calculation
  const tractateStatuses = useMemo(() => {
    return TRACTATES.map((tr) => {
      const allDapim = generateDafListForTractate(tr.lastDaf);
      const totalDapim = allDapim.length;
      const cachedForTr = stats.byTractate[tr.id] || [];
      const cachedDafSet = new Set(cachedForTr.map((item) => item.dafId));
      const cachedCount = cachedForTr.length;
      const uncachedDapimList = allDapim.filter((d) => !cachedDafSet.has(d));
      const remainingDapimCount = uncachedDapimList.length;
      const cachedPercent =
        totalDapim > 0 ? Math.min(100, Math.round((cachedCount / totalDapim) * 100)) : 0;
      const status: 'full' | 'partial' | 'none' =
        cachedCount >= totalDapim && totalDapim > 0
          ? 'full'
          : cachedCount > 0
            ? 'partial'
            : 'none';
      const sizeBytes = cachedForTr.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

      return {
        tractate: tr,
        totalDapim,
        cachedCount,
        cachedPercent,
        status,
        sizeBytes,
        remainingDapimCount,
        uncachedDapimList,
      };
    });
  }, [stats.byTractate]);

  // Overall Shas cache statistics
  const globalStatusCounts = useMemo(() => {
    let full = 0;
    let partial = 0;
    let none = 0;
    let totalDapim = 0;
    for (const t of tractateStatuses) {
      totalDapim += t.totalDapim;
      if (t.status === 'full') full++;
      else if (t.status === 'partial') partial++;
      else none++;
    }
    const globalPercent =
      totalDapim > 0 ? Math.min(100, Math.round((stats.totalDapimCount / totalDapim) * 100)) : 0;
    return { full, partial, none, totalDapim, globalPercent };
  }, [tractateStatuses, stats.totalDapimCount]);

  // Per-Seder aggregated cache statuses
  const sederStatuses = useMemo(() => {
    return SEDARIM.map((seder) => {
      const trs = tractateStatuses.filter((t) => t.tractate.sederId === seder.id);
      const totalDapim = trs.reduce((acc, curr) => acc + curr.totalDapim, 0);
      const cachedDapim = trs.reduce((acc, curr) => acc + curr.cachedCount, 0);
      const cachedPercent =
        totalDapim > 0 ? Math.min(100, Math.round((cachedDapim / totalDapim) * 100)) : 0;
      const fullCount = trs.filter((t) => t.status === 'full').length;
      const partialCount = trs.filter((t) => t.status === 'partial').length;
      const noneCount = trs.filter((t) => t.status === 'none').length;
      const totalSizeBytes = trs.reduce((acc, curr) => acc + curr.sizeBytes, 0);
      const remainingDapimCount = trs.reduce((acc, curr) => acc + curr.remainingDapimCount, 0);
      const status: 'full' | 'partial' | 'none' =
        cachedDapim >= totalDapim && totalDapim > 0
          ? 'full'
          : cachedDapim > 0
            ? 'partial'
            : 'none';

      return {
        seder,
        tractates: trs,
        totalDapim,
        cachedDapim,
        cachedPercent,
        fullCount,
        partialCount,
        noneCount,
        totalSizeBytes,
        remainingDapimCount,
        status,
      };
    });
  }, [tractateStatuses]);

  return (
    <div className="space-y-4">
      <OfflineDafDatabaseBuilder isDark={isDark} />
      {/* Top Status & Workbox Service Worker Dashboard */}
      <div
        className={`rounded-2xl border p-4 transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#231911] via-[#1C140E] to-[#17100B] border-amber-500/30'
            : 'bg-gradient-to-br from-[#EFE3CC] via-[#E8D8BC] to-[#DFCCA9] border-[#78522B]/35 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                isOnline
                  ? isDark
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-900'
                  : isDark
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-amber-900/20 border-amber-700/50 text-amber-950'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4
                  className={`text-sm sm:text-base font-bold font-serif-ka ${
                    isDark ? 'text-amber-100' : 'text-[#20150B]'
                  }`}
                >
                  სრული ოფლაინ ბიბლიოთეკა • Workbox & IndexedDB ძრავა
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOnline
                      ? isDark
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-900'
                      : isDark
                        ? 'bg-amber-950/70 border-amber-400/50 text-amber-200'
                        : 'bg-amber-900/20 border-amber-800/40 text-amber-950'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {isOnline
                    ? 'ონლაინ რეჟიმი • ავტო-კეშირება ჩართულია'
                    : 'ოფლაინ რეჟიმი • კითხვა ლოკალური საცავიდან'}
                </span>
                {swActive && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      isDark
                        ? 'bg-sky-950/50 border-sky-500/35 text-sky-300'
                        : 'bg-sky-900/10 border-sky-700/30 text-sky-900'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Workbox SW აქტიურია
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDark ? 'text-stone-300' : 'text-[#4A3520]'
                }`}
              >
                ყველა ნანახი დაფი ავტომატურად ინახება მოწყობილობაზე. ასევე შეგიძლიათ წინასწარ ჩამოტვირთოთ მთლიანი ტრაქტატების ოფლაინ პაკეტები ინტერნეტის გარეშე სასწავლად.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveCurrentDafManual}
              disabled={savingCurrentDaf}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isCurrentDafSaved
                  ? isDark
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/60'
                    : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-950 hover:bg-emerald-900/25'
                  : isDark
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#492E14]'
              }`}
            >
              {savingCurrentDaf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isCurrentDafSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isCurrentDafSaved
                  ? `შენახულია: ${currentDafData.tractateNameKa} ${currentDafData.dafId} (განახლება)`
                  : `მიმდინარე დაფის შენახვა (${currentDafData.tractateNameKa} ${currentDafData.dafId})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadGoldenShasPack}
              disabled={Boolean(activeProgress)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#2C2016] border-amber-500/35 text-amber-200 hover:bg-[#38291C]'
                  : 'bg-[#E2CFB0] border-[#78522B]/40 text-[#23170B] hover:bg-[#D6BF9B]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>შასის ოქროს ფონდის ჩამოტვირთვა (20 დაფი)</span>
            </button>

            <a
              href="/talmud-source-code-only.zip"
              download="talmud-source-code-only.zip"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-amber-500/25 border-amber-400/50 text-amber-200 hover:bg-amber-500/35'
                  : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#492E14]'
              }`}
              title="მთლიანი პროექტის სორს კოდის ჩამოტვირთვა (ZIP • 916 KB)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>პროექტის სორს კოდი (ZIP • 916 KB)</span>
            </a>

            <a
              href="/talmud-project-source.zip"
              download="talmud-project-source.zip"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#2C2016] border-amber-500/35 text-amber-200 hover:bg-[#38291C]'
                  : 'bg-[#E2CFB0] border-[#78522B]/40 text-[#23170B] hover:bg-[#D6BF9B]'
              }`}
              title="სრული პაკეტის ჩამოტვირთვა (სორსი + ყველა PDF და რესურსი • 19 MB)"
            >
              <FileArchive className="w-3.5 h-3.5 text-amber-500" />
              <span>სრული პაკეტი (ZIP • 19 MB)</span>
            </a>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div
            className={`rounded-xl p-2.5 border ${
              isDark
                ? 'bg-[#17110C]/90 border-stone-800'
                : 'bg-[#F5EBD9]/90 border-[#78522B]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  isDark ? 'text-stone-400' : 'text-[#5C4328]'
                }`}
              >
                ოფლაინ დაფები (IndexedDB)
              </span>
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                isDark ? 'text-amber-200' : 'text-[#23170B]'
              }`}
            >
              {stats.totalDapimCount} დაფი
            </div>
          </div>

          <div
            className={`rounded-xl p-2.5 border ${
              isDark
                ? 'bg-[#17110C]/90 border-stone-800'
                : 'bg-[#F5EBD9]/90 border-[#78522B]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  isDark ? 'text-stone-400' : 'text-[#5C4328]'
                }`}
              >
                Workbox Sefaria კეში
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                isDark ? 'text-emerald-300' : 'text-emerald-900'
              }`}
            >
              {stats.workboxSefariaCount + stats.totalDapimCount} წყარო
            </div>
          </div>

          <div
            className={`rounded-xl p-2.5 border ${
              isDark
                ? 'bg-[#17110C]/90 border-stone-800'
                : 'bg-[#F5EBD9]/90 border-[#78522B]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  isDark ? 'text-stone-400' : 'text-[#5C4328]'
                }`}
              >
                ქართული თარგმანების კეში
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                isDark ? 'text-sky-300' : 'text-sky-900'
              }`}
            >
              {stats.workboxTranslationsCount + stats.totalDapimCount * 12} სეგმენტი
            </div>
          </div>

          <div
            className={`rounded-xl p-2.5 border ${
              isDark
                ? 'bg-[#17110C]/90 border-stone-800'
                : 'bg-[#F5EBD9]/90 border-[#78522B]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  isDark ? 'text-stone-400' : 'text-[#5C4328]'
                }`}
              >
                დაკავებული მოცულობა
              </span>
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                isDark ? 'text-amber-200' : 'text-[#23170B]'
              }`}
            >
              {formatBytesKa(stats.totalSizeBytes)}
            </div>
          </div>
        </div>

        {/* Status Notification Banner */}
        <AnimatePresence>
          {statusBannerMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className={`mt-3 px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                isDark
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBannerMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Pack Download Progress Bar */}
        <AnimatePresence>
          {activeProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className={`mt-3 p-3.5 rounded-xl border ${
                isDark
                  ? 'bg-[#140F0A] border-amber-400/50 text-amber-100'
                  : 'bg-[#F8EFE0] border-[#5A3A1B] text-[#23170B]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-xs font-bold">{activeProgress.statusText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-500">
                    {activeProgress.completedDapim} / {activeProgress.totalDapim} ({activeProgress.percent}%)
                  </span>
                  <button
                    type="button"
                    onClick={handleStopDownload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    შეჩერება
                  </button>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-stone-800/50">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${activeProgress.percent}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sub-navigation & Backup Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-w-[320px]">
          <button
            type="button"
            onClick={() => setSubTab('status-visualization')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'status-visualization'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-sm'
                  : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] shadow-sm'
                : isDark
                  ? 'bg-[#1D150E] border-stone-800 text-stone-300 hover:bg-[#271C13]'
                  : 'bg-[#E6D5B8] border-[#78522B]/30 text-[#2E1F10] hover:bg-[#DEC8A4]'
            }`}
          >
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>კეშირების ვიზუალიზაცია & სედარიმები</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('packs')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'packs'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-sm'
                  : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] shadow-sm'
                : isDark
                  ? 'bg-[#1D150E] border-stone-800 text-stone-300 hover:bg-[#271C13]'
                  : 'bg-[#E6D5B8] border-[#78522B]/30 text-[#2E1F10] hover:bg-[#DEC8A4]'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>ტრაქტატების პაკეტები (37)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('cached-dapim')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'cached-dapim'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-sm'
                  : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] shadow-sm'
                : isDark
                  ? 'bg-[#1D150E] border-stone-800 text-stone-300 hover:bg-[#271C13]'
                  : 'bg-[#E6D5B8] border-[#78522B]/30 text-[#2E1F10] hover:bg-[#DEC8A4]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>შენახული დაფები ({stats.totalDapimCount})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackupFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={stats.totalDapimCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40 ${
              isDark
                ? 'bg-[#1D150E] border-stone-700 text-stone-200 hover:bg-[#281D14]'
                : 'bg-[#E6D5B8] border-[#78522B]/35 text-[#23170B] hover:bg-[#DAC4A0]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON ექსპორტი</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1D150E] border-stone-700 text-stone-200 hover:bg-[#281D14]'
                : 'bg-[#E6D5B8] border-[#78522B]/35 text-[#23170B] hover:bg-[#DAC4A0]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>JSON იმპორტი</span>
          </button>

          {stats.totalDapimCount > 0 && (
            <button
              type="button"
              onClick={async () => {
                await clearAllOfflineStorage();
                await refreshStats();
                setStatusBannerMsg('ოფლაინ ბიბლიოთეკის კეში გასუფთავდა.');
                setTimeout(() => setStatusBannerMsg(null), 3500);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-rose-950/50 border-rose-500/35 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-rose-900/10 border-rose-700/35 text-rose-900 hover:bg-rose-900/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>გასუფთავება</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <SearchableSelect
            label="სედერის ფილტრი (סדר)"
            options={sederOptions}
            value={selectedSeder}
            onChange={setSelectedSeder}
            placeholder="აირჩიეთ სედერი..."
            isDark={isDark}
          />
        </div>

        <div>
          <label
            className={`block text-[11px] font-bold mb-1 ${
              isDark ? 'text-stone-400' : 'text-[#4A3520]'
            }`}
          >
            ძიება ტრაქტატის ან დაფის მიხედვით
          </label>
          <div className="relative">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-stone-400' : 'text-[#5C4328]'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="მაგ: ბერახოთი, შაბათი, 2a, ברכות..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-[#17110C] border-stone-700 text-stone-100 focus:border-amber-500'
                  : 'bg-[#F5EBD9] border-[#78522B]/35 text-[#20150B] focus:border-[#5A3A1B]'
              }`}
            />
          </div>
        </div>

        <label
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer select-none ${
            isDark
              ? 'bg-[#17110C] border-stone-800 text-stone-200'
              : 'bg-[#F5EBD9] border-[#78522B]/30 text-[#23170B]'
          }`}
        >
          <input
            type="checkbox"
            checked={includeTranslationsOnPack}
            onChange={(e) => setIncludeTranslationsOnPack(e.target.checked)}
            className="w-4 h-4 accent-amber-600 rounded"
          />
          <span>ქართული თარგმანებისა და რაშის კეშირება</span>
        </label>
      </div>

      {/* SUBTAB 0: DEDICATED STATUS VISUALIZATION & SEDARIM BATCH DOWNLOAD */}
      {subTab === 'status-visualization' ? (
        <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
          {/* Global Shas Visualization Summary Card */}
          <div
            className={`rounded-2xl border p-4 transition-all ${
              isDark
                ? 'bg-gradient-to-br from-[#1C140E] to-[#140D08] border-amber-500/30'
                : 'bg-gradient-to-br from-[#F5EBD9] to-[#E9DCBF] border-[#78522B]/35 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isDark
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      : 'bg-[#5A3A1B]/15 border-[#5A3A1B]/35 text-[#5A3A1B]'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`text-sm font-bold font-serif-ka ${
                      isDark ? 'text-amber-100' : 'text-[#20150B]'
                    }`}
                  >
                    ბაბილონის თალმუდის კეშირების გლობალური ვიზუალიზაცია
                  </h4>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-stone-400' : 'text-[#5C4328]'
                    }`}
                  >
                    37 ტრაქტატი • 6 სედერ • 2,711 დაფი • სრული ოფლაინ ავტონომია
                  </p>
                </div>
              </div>

              {/* Status filter toggle pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? isDark
                        ? 'bg-amber-500/30 border-amber-400 text-amber-100'
                        : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1]'
                      : isDark
                        ? 'bg-[#18110B] border-stone-800 text-stone-400 hover:text-stone-200'
                        : 'bg-[#EBDDC5] border-[#78522B]/30 text-[#4A3520]'
                  }`}
                >
                  ყველა (37)
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('full')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    statusFilter === 'full'
                      ? isDark
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                        : 'bg-emerald-900 border-emerald-950 text-emerald-100'
                      : isDark
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-900/10 border-emerald-700/30 text-emerald-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  სრული ({globalStatusCounts.full})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('partial')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    statusFilter === 'partial'
                      ? isDark
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                        : 'bg-amber-900 border-amber-950 text-amber-100'
                      : isDark
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        : 'bg-amber-900/10 border-amber-700/30 text-amber-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ნაწილობრივი ({globalStatusCounts.partial})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('none')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    statusFilter === 'none'
                      ? isDark
                        ? 'bg-stone-800 border-stone-500 text-stone-200'
                        : 'bg-stone-700 border-stone-800 text-stone-100'
                      : isDark
                        ? 'bg-stone-900/50 border-stone-800 text-stone-400'
                        : 'bg-stone-200/60 border-stone-400/40 text-stone-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  ჩამოუტვირთავი ({globalStatusCounts.none})
                </button>
              </div>
            </div>

            {/* Total progress bar & disk usage */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isDark ? 'text-amber-200' : 'text-[#3E2712]'}>
                  კეშირებულია {stats.totalDapimCount} / {globalStatusCounts.totalDapim} დაფი ({globalStatusCounts.globalPercent}%)
                </span>
                <span className={isDark ? 'text-stone-400' : 'text-[#5C4328]'}>
                  {formatBytesKa(stats.totalSizeBytes)} მოცულობა
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden bg-stone-800/40 p-0.5 border border-amber-500/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(1, globalStatusCounts.globalPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sedarim Visualizer List */}
          <div className="space-y-4">
            {sederStatuses
              .filter((s) => selectedSeder === 'all' || s.seder.id === selectedSeder)
              .map((sStatus) => {
                const q = searchQuery.toLowerCase().trim();
                const visibleTractates = sStatus.tractates.filter((t) => {
                  if (statusFilter !== 'all' && t.status !== statusFilter) return false;
                  if (!q) return true;
                  return (
                    t.tractate.nameKa.toLowerCase().includes(q) ||
                    t.tractate.nameHe.includes(q) ||
                    t.tractate.nameEn.toLowerCase().includes(q) ||
                    t.tractate.descriptionKa.toLowerCase().includes(q)
                  );
                });

                const isSederDownloading =
                  activeProgress &&
                  sStatus.tractates.some((t) => t.tractate.id === activeProgress.tractateId);

                return (
                  <div
                    key={sStatus.seder.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isDark
                        ? 'bg-[#18120C]/90 border-stone-800'
                        : 'bg-[#F6EFE2] border-[#78522B]/30 shadow-xs'
                    }`}
                  >
                    {/* Seder Header Card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800/30">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span
                            dir="rtl"
                            className="font-serif text-base sm:text-lg font-black text-amber-500"
                          >
                            {sStatus.seder.nameHe}
                          </span>
                          <span className="text-stone-400">•</span>
                          <h4
                            className={`text-sm sm:text-base font-bold font-serif-ka ${
                              isDark ? 'text-stone-100' : 'text-[#20150B]'
                            }`}
                          >
                            {sStatus.seder.nameKa}
                          </h4>
                          <span
                            className={`text-xs hidden sm:inline ${
                              isDark ? 'text-stone-400' : 'text-[#5C4328]'
                            }`}
                          >
                            ({sStatus.seder.nameEn})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold border text-[11px] ${
                              sStatus.status === 'full'
                                ? isDark
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                  : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-900'
                                : sStatus.status === 'partial'
                                  ? isDark
                                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                    : 'bg-amber-900/15 border-amber-700/40 text-amber-950'
                                  : isDark
                                    ? 'bg-stone-900 border-stone-800 text-stone-400'
                                    : 'bg-stone-200 border-stone-400/30 text-stone-700'
                            }`}
                          >
                            {sStatus.status === 'full'
                              ? '🟢 სრული სედერი კეშირებულია (100%)'
                              : sStatus.status === 'partial'
                                ? `🟡 ნაწილობრივ კეშირებული (${sStatus.cachedDapim} / ${sStatus.totalDapim} დაფი • ${sStatus.cachedPercent}%)`
                                : '⚪ ჩამოუტვირთავი (0%)'}
                          </span>
                          <span
                            className={isDark ? 'text-stone-400' : 'text-[#5C4328]'}
                          >
                            • {sStatus.tractates.length} ტრაქტატი • {sStatus.fullCount} სრული, {sStatus.partialCount} ნაწილობრივი, {sStatus.noneCount} ცარიელი
                          </span>
                          {sStatus.totalSizeBytes > 0 && (
                            <span
                              className={isDark ? 'text-amber-400/80' : 'text-amber-900'}
                            >
                              • {formatBytesKa(sStatus.totalSizeBytes)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Seder Actions: Download Entire Seder & Clear */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadSeder(sStatus.seder.id)}
                          disabled={Boolean(activeProgress) || sStatus.status === 'full'}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                            sStatus.status === 'full'
                              ? isDark
                                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                                : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-950'
                              : isDark
                                ? 'bg-amber-500/25 border-amber-400/60 text-amber-100 hover:bg-amber-500/35'
                                : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#492E14]'
                          }`}
                        >
                          {isSederDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : sStatus.status === 'full' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {sStatus.status === 'full'
                              ? 'სედერი სრულად შენახულია'
                              : sStatus.status === 'partial'
                                ? `მთლიანი სედერის ჩამოტვირთვა (დარჩა ${sStatus.remainingDapimCount} დაფი)`
                                : `მთლიანი სედერის ჩამოტვირთვა (${sStatus.totalDapim} დაფი)`}
                          </span>
                        </button>

                        {sStatus.cachedDapim > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearSederCache(sStatus.seder.id)}
                            title="სედერის კეშის გასუფთავება"
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50'
                                : 'bg-rose-900/10 border-rose-700/30 text-rose-900 hover:bg-rose-900/20'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seder Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-stone-800/40 mt-3 mb-3">
                      <div
                        className={`h-full transition-all duration-300 ${
                          sStatus.status === 'full'
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${sStatus.cachedPercent}%` }}
                      />
                    </div>

                    {/* Tractates Grid Inside Seder */}
                    {visibleTractates.length === 0 ? (
                      <div
                        className={`p-4 rounded-xl border text-center text-xs ${
                          isDark
                            ? 'bg-[#140E0A] border-stone-800 text-stone-400'
                            : 'bg-[#EFE3CF] border-[#78522B]/20 text-[#5C4328]'
                        }`}
                      >
                        არჩეული ფილტრით ტრაქტატები ამ სედერში ვერ მოიძებნა.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {visibleTractates.map((t) => {
                          const isDownloadingThis = activeProgress?.tractateId === t.tractate.id;
                          return (
                            <div
                              key={t.tractate.id}
                              className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                                isDark
                                  ? 'bg-[#1F1710] border-stone-800 hover:border-amber-500/40'
                                  : 'bg-[#FAF4E8] border-[#78522B]/25 hover:border-[#5A3A1B]/50 shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1.5">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        dir="rtl"
                                        className="font-serif font-black text-sm text-amber-500"
                                      >
                                        {t.tractate.nameHe}
                                      </span>
                                      <span
                                        className={`font-bold text-xs font-serif-ka ${
                                          isDark ? 'text-stone-100' : 'text-[#20150B]'
                                        }`}
                                      >
                                        {t.tractate.nameKa}
                                      </span>
                                    </div>
                                    <div
                                      className={`text-[10px] mt-0.5 ${
                                        isDark ? 'text-stone-400' : 'text-[#5C4328]'
                                      }`}
                                    >
                                      {t.tractate.chapters} თავი • {t.tractate.lastDaf} ფოლიო ({t.totalDapim} დაფი)
                                    </div>
                                  </div>

                                  {/* Status Badge */}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                                      t.status === 'full'
                                        ? isDark
                                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                          : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-950'
                                        : t.status === 'partial'
                                          ? isDark
                                            ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                                            : 'bg-amber-900/15 border-amber-700/40 text-amber-950'
                                          : isDark
                                            ? 'bg-stone-900 border-stone-800 text-stone-400'
                                            : 'bg-stone-200 border-stone-400/30 text-stone-700'
                                    }`}
                                  >
                                    {t.status === 'full'
                                      ? '🟢 სრული (100%)'
                                      : t.status === 'partial'
                                        ? `🟡 ${t.cachedCount}/${t.totalDapim} (${t.cachedPercent}%)`
                                        : `⚪ 0/${t.totalDapim}`}
                                  </span>
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="w-full h-1.5 rounded-full overflow-hidden bg-stone-800/40 mt-2 mb-1.5">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      t.status === 'full'
                                        ? 'bg-emerald-500'
                                        : 'bg-gradient-to-r from-amber-600 to-amber-400'
                                    }`}
                                    style={{ width: `${t.cachedPercent}%` }}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-stone-400 mb-2">
                                  <span>
                                    {t.cachedCount > 0
                                      ? `კეშირებულია ${t.cachedCount} დაფი`
                                      : 'არ არის კეშირებული'}
                                  </span>
                                  {t.sizeBytes > 0 && (
                                    <span className="text-amber-400 font-semibold">
                                      {formatBytesKa(t.sizeBytes)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Tractate Action Buttons */}
                              <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-stone-800/20">
                                <button
                                  type="button"
                                  disabled={Boolean(activeProgress)}
                                  onClick={() => handleDownloadPack(t.tractate, 'full-tractate')}
                                  className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-45 ${
                                    t.status === 'full'
                                      ? isDark
                                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                                        : 'bg-emerald-900/10 border-emerald-700/30 text-emerald-900 hover:bg-emerald-900/20'
                                      : isDark
                                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                                        : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#482E15]'
                                  }`}
                                >
                                  {isDownloadingThis ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : t.status === 'full' ? (
                                    <RefreshCw className="w-3 h-3" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  <span>
                                    {t.status === 'full'
                                      ? 'განახლება'
                                      : t.status === 'partial'
                                        ? `დარჩენილი (${t.remainingDapimCount})`
                                        : `ჩამოტვირთვა (${t.totalDapim})`}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateToDaf(t.tractate.id, '2a');
                                    onCloseModal?.();
                                  }}
                                  className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    isDark
                                      ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                                      : 'bg-[#EADBC3] border-[#78522B]/30 text-[#2B1B0E] hover:bg-[#DFCFB3]'
                                  }`}
                                >
                                  <span>გახსნა</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>

                                {t.cachedCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await deleteOfflineTractate(t.tractate.id);
                                      await refreshStats();
                                    }}
                                    title="კეშის წაშლა"
                                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                      isDark
                                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50'
                                        : 'bg-rose-900/10 border-rose-700/30 text-rose-900 hover:bg-rose-900/20'
                                    }`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : subTab === 'packs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {filteredTractates.map((tr) => {
            const totalDapimInTractate = (tr.lastDaf - 1) * 2;
            const cachedForTr = stats.byTractate[tr.id] || [];
            const cachedCount = cachedForTr.length;
            const coveragePercent = Math.min(
              100,
              Math.round((cachedCount / Math.max(1, totalDapimInTractate)) * 100)
            );
            const isDownloadingThis = activeProgress?.tractateId === tr.id;

            return (
              <div
                key={tr.id}
                className={`rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#1A130D]/95 border-stone-800 hover:border-amber-500/35'
                    : 'bg-[#F3E7D3] border-[#78522B]/30 hover:border-[#5A3A1B]/60 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          dir="rtl"
                          lang="he"
                          className={`text-base font-bold font-hebrew px-2 py-0.5 rounded-lg border ${
                            isDark
                              ? 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                              : 'bg-[#E3D0B1] border-[#78522B]/35 text-[#3A230E]'
                          }`}
                        >
                          {tr.nameHe}
                        </span>
                        <h5
                          className={`text-sm font-extrabold font-serif-ka ${
                            isDark ? 'text-stone-100' : 'text-[#20150B]'
                          }`}
                        >
                          {tr.nameKa} ({tr.nameEn})
                        </h5>
                      </div>
                      <p
                        className={`text-[11px] mt-1 line-clamp-1 ${
                          isDark ? 'text-stone-400' : 'text-[#523B22]'
                        }`}
                      >
                        {tr.descriptionKa} • {tr.chapters} თავი • დაფები 2a–{tr.lastDaf}b ({totalDapimInTractate} ამუდი)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 border ${
                        cachedCount > 0
                          ? isDark
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-emerald-900/15 border-emerald-700/40 text-emerald-900'
                          : isDark
                            ? 'bg-stone-900 border-stone-800 text-stone-400'
                            : 'bg-[#E5D4B7] border-[#78522B]/25 text-[#5C4328]'
                      }`}
                    >
                      {cachedCount} / {totalDapimInTractate} დაფი
                    </span>
                  </div>

                  {/* Coverage Progress Bar */}
                  <div className="mt-2.5">
                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isDark ? 'bg-stone-800' : 'bg-[#DCC7A4]'
                      }`}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${coveragePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Jump Chips for already-cached Dapim in this Tractate */}
                  {cachedForTr.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                      <span
                        className={`text-[10px] font-bold mr-1 ${
                          isDark ? 'text-stone-400' : 'text-[#5C4328]'
                        }`}
                      >
                        ოფლაინ ხელმისაწვდომია:
                      </span>
                      {cachedForTr.slice(0, 8).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => {
                            onNavigateToDaf(tr.id, c.dafId);
                            onCloseModal?.();
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-emerald-950/50 border-emerald-500/35 text-emerald-200 hover:bg-emerald-900/70'
                              : 'bg-emerald-900/15 border-emerald-700/35 text-emerald-950 hover:bg-emerald-900/25'
                          }`}
                        >
                          {c.dafId}
                        </button>
                      ))}
                      {cachedForTr.length > 8 && (
                        <span
                          className={`text-[10px] font-bold ${
                            isDark ? 'text-stone-400' : 'text-[#5C4328]'
                          }`}
                        >
                          +{cachedForTr.length - 8} სხვა
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Download Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-stone-700/25 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={Boolean(activeProgress)}
                    onClick={() => handleDownloadPack(tr, 'quick-10')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-45 ${
                      isDark
                        ? 'bg-[#261C14] border-amber-500/30 text-amber-200 hover:bg-[#33251A]'
                        : 'bg-[#E5D3B3] border-[#78522B]/35 text-[#23170B] hover:bg-[#DAC39C]'
                    }`}
                  >
                    {isDownloadingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>სწრაფი პაკეტი (10 დაფი)</span>
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(activeProgress)}
                    onClick={() => handleDownloadPack(tr, 'full-tractate')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-45 ${
                      isDark
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-100 hover:bg-amber-500/30'
                        : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#482E15]'
                    }`}
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>სრული ტრაქტატი ({totalDapimInTractate})</span>
                  </button>

                  {cachedCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteOfflineTractate(tr.id);
                        await refreshStats();
                      }}
                      title="ტრაქტატის ოფლაინ კეშის წაშლა"
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50'
                          : 'bg-rose-900/10 border-rose-700/30 text-rose-900 hover:bg-rose-900/20'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SUBTAB 2: CACHED & VIEWED DAPIM LIST */
        <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
          {filteredCachedItems.length === 0 ? (
            <div
              className={`rounded-2xl border p-8 text-center ${
                isDark
                  ? 'bg-[#1A130D]/80 border-stone-800 text-stone-400'
                  : 'bg-[#F3E7D3] border-[#78522B]/30 text-[#4A3520]'
              }`}
            >
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold">
                ოფლაინ ბიბლიოთეკაში ჯერ არ არის შენახული დაფები
              </p>
              <p className="text-xs mt-1 opacity-80">
                ნებისმიერი დაფის გახსნისას იგი ავტომატურად შეინახება Workbox & IndexedDB კეშში, ან აირჩიეთ ტრაქტატის პაკეტის ჩამოტვირთვა.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredCachedItems.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                    isDark
                      ? 'bg-[#1A130D] border-stone-800 hover:border-amber-500/40'
                      : 'bg-[#F3E7D3] border-[#78522B]/30 hover:border-[#5A3A1B]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        dir="rtl"
                        lang="he"
                        className={`text-xs font-bold font-hebrew px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                            : 'bg-[#E4D1B3] border-[#78522B]/35 text-[#3A230E]'
                        }`}
                      >
                        {item.tractateNameHe} {item.dafId}
                      </span>
                      <span
                        className={`text-xs font-extrabold truncate ${
                          isDark ? 'text-stone-100' : 'text-[#20150B]'
                        }`}
                      >
                        {item.tractateNameKa} • დაფი {item.dafId}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          item.source === 'pack-download'
                            ? isDark
                              ? 'bg-emerald-950/60 border-emerald-500/35 text-emerald-300'
                              : 'bg-emerald-900/15 border-emerald-700/35 text-emerald-900'
                            : item.source === 'manual'
                              ? isDark
                                ? 'bg-amber-950/60 border-amber-500/35 text-amber-300'
                                : 'bg-amber-900/15 border-amber-700/35 text-amber-900'
                              : isDark
                                ? 'bg-sky-950/60 border-sky-500/35 text-sky-300'
                                : 'bg-sky-900/15 border-sky-700/35 text-sky-900'
                        }`}
                      >
                        {item.source === 'pack-download'
                          ? 'პაკეტი'
                          : item.source === 'manual'
                            ? 'შენახული'
                            : 'ნანახი (ავტო-კეში)'}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 ${
                        isDark ? 'text-stone-400' : 'text-[#523B22]'
                      }`}
                    >
                      გემარა: {item.gemaraCount} • რაში: {item.rashiCount} • თოსაფოთი: {item.tosafotCount} • მפרשים: {item.commentariesCount} • {formatBytesKa(item.sizeBytes)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToDaf(item.tractateId, item.dafId);
                        onCloseModal?.();
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                          : 'bg-[#5A3A1B] border-[#3E2712] text-[#F9F1E1] hover:bg-[#482E15]'
                      }`}
                    >
                      <span>გახსნა</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await deleteOfflineDaf(item.tractateId, item.dafId);
                        await refreshStats();
                      }}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-rose-300'
                          : 'bg-[#E5D4B7] border-[#78522B]/30 text-[#5C4328] hover:text-rose-900'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
