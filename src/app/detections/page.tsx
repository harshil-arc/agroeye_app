'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmData } from '@/context/FarmDataContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  Cpu,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  ImageIcon,
  AlertTriangle,
  RotateCcw,
  Trash2
} from 'lucide-react';

export default function DetectionsPage() {
  const {
    detections,
    triggerManualAlert,
    refreshFirebaseData,
    isLoadingDetections,
    setAutoOpenedDetection,
    deleteDetection,
    clearAllDetections
  } = useFarmData();
  const { t, lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unhandled' | 'treated'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFirebaseData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    await clearAllDetections();
    setIsClearingAll(false);
    setShowClearAllModal(false);
    setDeleteSuccessToast(lang === 'hi' ? 'सभी घटनाएं और तस्वीरें सफलतापूर्वक हटा दी गईं।' : 'All detection images and records removed from Firebase and app.');
    setTimeout(() => setDeleteSuccessToast(null), 3500);
  };

  const diseaseCount = detections.filter((d) => d.category === 'disease').length;
  const pestCount = detections.filter((d) => d.category === 'pest').length;
  const waterCount = detections.filter((d) => d.category === 'water_stress').length;
  const weedCount = detections.filter((d) => d.category === 'weed').length;

  const categories = [
    { id: 'all', label: lang === 'hi' ? 'सभी घटनाएं' : 'All Detections', count: detections.length },
    { id: 'disease', label: lang === 'hi' ? 'रोग' : 'Diseases', count: diseaseCount },
    { id: 'pest', label: lang === 'hi' ? 'कीट व वन्यजीव' : 'Animal / Pest', count: pestCount },
    { id: 'water_stress', label: lang === 'hi' ? 'जल तनाव' : 'Water Stress', count: waterCount },
    { id: 'weed', label: lang === 'hi' ? 'खरपतवार' : 'Weeds', count: weedCount },
  ];

  const filteredDetections = detections.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pathogen && item.pathogen.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlot = plotFilter === 'all' || item.plot.toLowerCase().includes(plotFilter.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'treated' && item.isTreated) ||
      (statusFilter === 'unhandled' && !item.isTreated);

    return matchesCategory && matchesSearch && matchesPlot && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* 1. Top Instrumentation Subhead */}
      <section className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="font-headline text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
              Real-Time Edge Detection Stream
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-headline text-[11px] shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>{detections.length} Events Synced</span>
          </div>
        </div>
        <h1 className="font-headline text-2xl text-slate-900 font-bold tracking-tight mt-1">
          {t('aiDetections')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live edge neural network classifications and real camera images from field gateway
        </p>
      </section>

      {/* 2. Interactive Filter Pills */}
      <section className="px-4 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[38px] px-3.5 py-1 rounded-full font-headline text-xs flex items-center gap-1.5 whitespace-nowrap transition-all shadow-xs font-semibold ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeCategory === cat.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Search & Refresh Action Bar */}
      <section className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'रोग, कीट या फसल से खोजें...' : 'Search by pathogen, pest, or field keyword...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-headline text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs flex-shrink-0"
            title="Sync with Field Gateway"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {detections.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllModal(true)}
              className="h-10 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-headline text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs flex-shrink-0"
              title="Clear all detection records and images from cloud and app"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. Real Detections Feed List */}
      <section className="px-4 pt-2 space-y-3">
        {isLoadingDetections && detections.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs animate-pulse flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-44 h-40 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-8 bg-slate-100 rounded mt-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDetections.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mb-2" />
            <h3 className="font-headline text-base font-bold text-slate-900">
              No matching detections found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mb-4">
              All crop canopies are currently clear or no records match your search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredDetections.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 relative overflow-hidden group"
            >
              {/* Real Photo Thumbnail */}
              <div
                onClick={() => setAutoOpenedDetection(item)}
                className="relative w-full sm:w-44 h-48 sm:h-auto rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200 cursor-pointer group-hover:ring-2 ring-emerald-500/50 transition-all"
                title="Click to view full resolution image"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?w=800&auto=format&fit=crop&q=80');
                  }}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white font-headline text-[10px] font-bold">
                  {item.code}
                </span>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-headline font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm truncate max-w-[90px]">
                    {item.plot.split('•')[0]}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 backdrop-blur-sm">
                    {item.confidence}%
                  </span>
                </div>
              </div>

              {/* Information Body */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase tracking-wider ${
                          item.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : item.severity === 'High'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-headline text-[10px] font-semibold">
                        {item.categoryLabel}
                      </span>
                      {item.isTreated && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-headline text-[10px] font-bold">
                          ✓ Treated
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">{item.timeAgo}</span>
                  </div>

                  <h3
                    onClick={() => setAutoOpenedDetection(item)}
                    className="font-headline text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{item.location}</span>
                    </span>
                    {item.pathogen && (
                      <>
                        <span>•</span>
                        <span className="truncate text-slate-700 font-mono text-[11px]">{item.pathogen}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Recommendation & Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold truncate">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{item.recommendation}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setAutoOpenedDetection(item)}
                      className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-headline text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Image</span>
                    </button>

                    <Link
                      href={`/detections/${item.id}`}
                      className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs uppercase font-bold tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                    >
                      <span>Diagnose</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {confirmDeleteId === item.id ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-in fade-in"
                      >
                        <span className="text-[10px] text-rose-800 font-bold px-1">Delete?</span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            await deleteDetection(item.id);
                            setConfirmDeleteId(null);
                            setDeleteSuccessToast(`Detection record ${item.code} deleted successfully`);
                            setTimeout(() => setDeleteSuccessToast(null), 3000);
                          }}
                          className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase transition-all shadow-xs active:scale-95"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setConfirmDeleteId(null);
                          }}
                          className="h-7 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setConfirmDeleteId(item.id);
                        }}
                        className="h-9 px-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 font-headline text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Delete Detection Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Delete Feedback Toast */}
      {deleteSuccessToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Trash2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="text-xs font-medium flex-1">{deleteSuccessToast}</span>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-slate-900">
                {lang === 'hi' ? 'सभी घटनाएं हटाएं?' : 'Clear All Detection Records?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'hi'
                  ? 'यह सभी रोग और कीट पहचान रिकॉर्ड और उनकी छवियों को Firebase क्लाउड और इस ऐप से हमेशा के लिए हटा देगा।'
                  : 'This will permanently delete all detection events and snapshot images from Firebase and local storage.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                disabled={isClearingAll}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-xs font-bold transition-all"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-headline text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                {isClearingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isClearingAll ? (lang === 'hi' ? 'हटाया जा रहा है...' : 'Clearing...') : (lang === 'hi' ? 'हां, सब हटाएं' : 'Yes, Delete All')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
