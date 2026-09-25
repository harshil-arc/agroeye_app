'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmData } from '@/context/FarmDataContext';
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
  ImageIcon
} from 'lucide-react';

export default function DetectionsPage() {
  const { detections, triggerManualAlert, refreshFirebaseData, isLoadingDetections, setAutoOpenedDetection } = useFarmData();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFirebaseData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const diseaseCount = detections.filter((d) => d.category === 'disease').length;
  const pestCount = detections.filter((d) => d.category === 'pest').length;
  const waterCount = detections.filter((d) => d.category === 'water_stress').length;
  const weedCount = detections.filter((d) => d.category === 'weed').length;

  const categories = [
    { id: 'all', label: 'All Real Ingests', count: detections.length },
    { id: 'disease', label: 'Diseases', count: diseaseCount },
    { id: 'pest', label: 'Animal / Pest', count: pestCount },
    { id: 'water_stress', label: 'Water Stress', count: waterCount },
    { id: 'weed', label: 'Weeds', count: weedCount },
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
    return matchesCategory && matchesSearch && matchesPlot;
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* 1. Top Instrumentation Subhead */}
      <section className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="font-headline text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
              Live Firebase Ingest Stream
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-headline text-[11px] shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>{detections.length} Real Ingests Synced</span>
          </div>
        </div>
        <h1 className="font-headline text-2xl text-slate-900 font-bold tracking-tight mt-1">
          Real AI Detections &amp; Captures
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live edge neural network classifications and real camera images from Firebase (iili.io)
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
              placeholder="Search by real disease, animal, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-headline text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs flex-shrink-0"
            title="Refresh Firebase Realtime Database"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </section>

      {/* 4. Real Detections Feed List */}
      <section className="px-4 pt-2 space-y-3">
        {isLoadingDetections && detections.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
            <h3 className="font-headline text-sm font-bold text-slate-900">
              Fetching Real Images from Firebase...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Connecting to sample-629de-default-rtdb.firebaseio.com
            </p>
          </div>
        ) : filteredDetections.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
            <h3 className="font-headline text-base font-bold text-slate-900">
              No detections match your query
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Try changing your search term or category filter.
            </p>
          </div>
        ) : (
          filteredDetections.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 relative overflow-hidden group"
            >
              {/* Real Photo Thumbnail from iili.io / Firebase */}
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
                    // Fallback to real crop photo if an image URL fails to load
                    (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nuiqbzg.jpg');
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
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
